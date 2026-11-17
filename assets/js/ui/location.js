// @ts-check

/** @typedef {{geonames?: {
			"adminCode1": string,
			"lng": string,
			"geonameId": number,
			"toponymName": string,
			"countryId": string,
			"fcl": string,
			"population": number,
			"countryCode": string,
			"name": string,
			"fclName": string,
			"adminCodes1": Record<string, string>,
			"countryName": string,
			"fcodeName": string,
			"adminName1": string,
			"lat": string,
			"fcode": string
		}[], postalcodes?: {
			"adminCode2": string,
			"adminCode1": string,
			"adminName2": string,
			"lng": number,
			"countryCode": string,
			"postalcode": string,
			"adminName1": string,
			"placeName": string,
			"lat": number
		}[]}} geoNamesResponse */

/**
 * The location search (name, ZIP code, coordinates or GPS), shared by the zmanim site (pages/home.js)
 * and the Hazon Yosef calendar (hazon-yosef/search.js). It reads no settings: what differs between them
 * comes from the page, through configureLocationSearch(), which the page's own module calls on import.
 * @typedef {{
	language: () => 'he' | 'en' | 'he-Latn',
	onChosen: (geoLocation: { locationName: string, lat: number, long: number, elevation: number, timeZone: string }) => void
  }} LocationSearchOptions
 *   language: the page's language (map names, how a neutral query is searched, nearby-place names);
 *   onChosen: what happens once a place is chosen (open the calendar there, save it, ...)
 */

/** @type {LocationSearchOptions | null} */
let pageOptions = null;

/** @param {LocationSearchOptions} options */
export function configureLocationSearch(options) {
	pageOptions = options;
}

function options() {
	if (!pageOptions)
		throw new Error("location.js: the page didn't call configureLocationSearch()");
	return pageOptions;
}

/** Degrees, then optional minutes and seconds, each with its mark (ASCII and typographic alike, '' for seconds too) */
const ANGLE = String.raw`([+-]?\d+(?:\.\d+)?)\s*[°º˚]?\s*(?:(\d+(?:\.\d+)?)\s*['′‘’]\s*)?(?:(\d+(?:\.\d+)?)\s*(?:"|″|“|”|''|′′|’’)\s*)?`;
/** One coordinate, its hemisphere before or after it (8 groups: hemisphere, angle | angle, hemisphere) */
const COORDINATE = String.raw`(?:([NSEW])\s*${ANGLE}|${ANGLE}([NSEW])?)`;
const COORDINATE_PAIR = new RegExp(String.raw`^\(?\s*${COORDINATE}\s*[,;]?\s*${COORDINATE}\s*\)?$`, "i");

/**
 * Coordinates typed into the search, or null when the text isn't a pair of them. Takes decimal degrees,
 * "(31.778, 35.235)", "31.778, 35.235" or "31.778 35.235", and degrees, minutes and seconds with
 * hemispheres, as maps copy them: 36°08'38.50"N 5°20'20.22"W (or 36°08.64'N, N36°08'38.5" W5°20'20.2" ...).
 * Longitude first is accepted when the hemispheres say so.
 * @param {string} text
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseCoordinates(text) {
	const m = text.trim().match(COORDINATE_PAIR);
	if (!m) return null;

	/** @param {(string | undefined)[]} c the 8 groups of COORDINATE */
	const read = (c) => {
		const [deg, min, sec] = c[0] ? c.slice(1, 4) : c.slice(4, 7);
		if (deg === undefined) return null;
		const hemisphere = (c[0] || c[7] || "").toUpperCase();
		if (hemisphere && /^[+-]/.test(deg)) return null;
		const minutes = min ? parseFloat(min) : 0, seconds = sec ? parseFloat(sec) : 0;
		if (minutes >= 60 || seconds >= 60) return null;
		// minutes and seconds count only on whole degrees (and seconds only on whole minutes)
		if ((min || sec) && deg.includes(".")) return null;
		if (sec && min?.includes(".")) return null;
		const magnitude = Math.abs(parseFloat(deg)) + minutes / 60 + seconds / 3600;
		const negative = hemisphere ? hemisphere == "S" || hemisphere == "W" : deg.startsWith("-");
		return { value: negative ? -magnitude : magnitude, hemisphere };
	};
	const first = read(m.slice(1, 9)), second = read(m.slice(9, 17));
	if (!first || !second) return null;

	const isLng = (/** @type {string} */ h) => h == "E" || h == "W";
	const isLat = (/** @type {string} */ h) => h == "N" || h == "S";
	// A hemisphere given on one side only, or both on the same axis, is a typo, not a place
	if (!!first.hemisphere != !!second.hemisphere) return null;
	if (first.hemisphere && isLat(first.hemisphere) == isLat(second.hemisphere)) return null;
	const [lat, lng] = isLng(first.hemisphere) ? [second.value, first.value] : [first.value, second.value];

	if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return null;
	return { lat, lng };
}

/** The map of a place typed as coordinates @type {Promise<import("ol/Map.js").default> | null} */
let manualMap = null;
/** Where manualMap is centred ("lat,lng"), so only a new place redraws it */
let manualMapAt = "";

const getJSON = async (/** @type {RequestInfo | URL} */ url) => await (await fetch(url)).json();
const geoLocation = {
	locationName: '',
	lat: 0,
	long: 0,
	elevation: 0,
	timeZone: ""
}

// Why 10? "West Hempstead" is not properly detected under counts with less
let maxRows = 10;

/** @type {{
 * 	manual: {
 * 		container: HTMLDivElement,
 * 		locationNameInput: HTMLInputElement,
 * 		timezoneSelect: HTMLSelectElement | import('@material/web/select/outlined-select.js').MdOutlinedSelect,
 * 		map: HTMLDivElement,
 *      elevationInput: HTMLInputElement
 * },
 *   icons: {
 * 		search: HTMLElement,
 * 		error: HTMLElement,
 * 		loading: HTMLElement,
 * 		container: HTMLElement
 *   },
 *   searchBar: HTMLInputElement,
 *   error: {
 *     box: HTMLDivElement,
 *     offline: HTMLSpanElement,
 *     notEnoughChar: HTMLSpanElement
 *   }
 * }} */
const elements = {
	manual: {
		// @ts-ignore
		container: document.getElementById("manualHelp"),
		// @ts-ignore
		locationNameInput: document.getElementById("cityInput"),
		// @ts-ignore
		timezoneSelect: document.getElementById("tz"),
		// @ts-ignore
		map: document.getElementById("leafletMap"),
		// @ts-ignore
		elevationInput: document.getElementById("elevationInput")
	},
	icons: {
		search: document.querySelector('.input-group-text .bi-search'),
		error: document.querySelector('.input-group-text .bi-x-circle-fill'),
		loading: document.querySelector('.input-group-text .spinner-border'),
		// @ts-ignore
		container: document.getElementsByClassName("input-group-text")[0]
	},
	// @ts-ignore
	searchBar: document.getElementById("Main"),
	error: {
		// @ts-ignore
		box: document.getElementById("error"),
		offline: document.getElementById("offlineText"),
		notEnoughChar: document.getElementById("notEnoughChar")
	}
}

/** @param {geoNamesResponse["postalcodes"][0] | geoNamesResponse["geonames"][0]} geoName */
const geoNameTitleGenerator = (geoName) =>
	[...new Set([
		('name' in geoName ? geoName.name : geoName.placeName),
		geoName.adminName1 || geoName.adminCode1,
		('countryName' in geoName ? geoName.countryName : geoName.countryCode)
	])]
		.filter(Boolean)
		.map(field => field
			.split(" ")
			.map(word => word[0] ? (word[0].toUpperCase() + word.substring(1).toLowerCase()) : word)
			.join(" ")
		)
		.join(", ");

let pool;
const delay = (/** @type {Number} */ms) => new Promise(res => setTimeout(res, ms));

const menu = document.getElementById("locationMenu");
const list = document.getElementById("locationList");

function clearSuggestions() {
    list.innerHTML = "";
	// @ts-ignore
    menu.close();
}

function showSuggestions() {
	// @ts-ignore
    if (list.children.length > 0) menu.show();
	// @ts-ignore
    else menu.close();
}

/** @param {KeyboardEvent|MouseEvent} event */
async function updateList(event) {
	elements.searchBar.classList.remove("is-warning")
	elements.error.notEnoughChar.style.display = "none";

	elements.icons.error.style.display = "none";
	elements.icons.search.style.removeProperty("display");
	elements.icons.loading.style.display = "none";

	elements.icons.container.style.paddingLeft = '1rem';
	elements.icons.container.style.paddingRight = '1rem';

	const q = elements.searchBar.value
		.split(" ")
		.map(word => word[0] ? (word[0].toUpperCase() + word.substring(1)) : word)
		.join(" ");
	if (elements.searchBar.value !== q)
		elements.searchBar.value = q;

	if (q.length < 3) {
		if ((event instanceof KeyboardEvent && event.key == "Enter") || event instanceof MouseEvent) {
			elements.searchBar.classList.add('is-warning')
			elements.error.notEnoughChar.style.removeProperty("display")
		}
		return;
	}

	const typedCoordinates = parseCoordinates(q);
	if (typedCoordinates) {
		if (elements.manual.container.classList.contains('d-none')) {
			elements.manual.container.classList.remove('d-none');
			requestAnimationFrame(() => elements.manual[navigator.onLine ? 'map' : 'timezoneSelect'].scrollIntoView());
		}

		const { lat, lng } = typedCoordinates;
		// A new map for each place typed (the map is held on its place); keys that leave the
		// coordinates as they were (arrows, Home/End, Shift…) keep the one shown
		if (manualMapAt !== `${lat},${lng}`) {
			manualMapAt = `${lat},${lng}`;
			manualMap?.then(map => map.setTarget(undefined)).catch(() => {});
			// map.js (and OpenLayers) only load once a map is shown
			manualMap = import("./map.js").then(({ drawScreenMap }) =>
				drawScreenMap(elements.manual.map, { lat, long: lng }, { lang: options().language(), zoom: 16, minZoom: 16 }));
			manualMap.catch(err => {
				console.warn("Location map:", err);
				manualMapAt = ""; // try again on the next key
			});
		}

		if ((event instanceof KeyboardEvent && event.key == "Enter") || event instanceof MouseEvent) {
			if (elements.manual.timezoneSelect.value)
				geoLocation.timeZone = elements.manual.timezoneSelect.value;

			if (elements.manual.locationNameInput.value)
				geoLocation.locationName = elements.manual.locationNameInput.value

			/** @type {Omit<GeolocationPosition, 'coords' | 'toJSON'> & { coords: Partial<{ -readonly [key in keyof GeolocationCoordinates]: GeolocationCoordinates[key]}>}} */
			const params = { timestamp: new Date().getTime(), coords: { latitude: lat, longitude: lng } }
			if (elements.manual.elevationInput.value) {
				params.coords.altitude = parseFloat(elements.manual.elevationInput.value);
			}

			await setLatLong(params, !elements.manual.timezoneSelect.value, true);
			openCalendarWithLocationInfo();
		}
	} else {
		elements.manual.container.classList.add('d-none');

		if (!navigator.onLine) return;

		if (!((event instanceof KeyboardEvent && event.key == "Enter") || event instanceof MouseEvent)) {
			pool = q;
			await delay(500);
			if (pool !== q) {
				console.log('Skipping to next implementation');
				return;
			}
		} else {
			elements.searchBar.disabled = true;
			elements.icons.error.style.display = "none";
			elements.icons.search.style.display = "none";
			elements.icons.loading.style.removeProperty("display");

			elements.icons.container.style.paddingLeft = '.5rem';
			elements.icons.container.style.paddingRight = '.5rem';
		}

		try {
			let q = elements.searchBar.value.trim();

			/** @param {URLSearchParams} params */
			const addLangIfHebrew = params => {
				if (detectLanguageIntent(q) == "english") return;
				if (detectLanguageIntent(q) == "neutral" && options().language() != "he") return;

				params.set("lang", "he");
			};

			/** @type {geoNamesResponse} */
			let data;
			let locationName = true;

			// Search while specifically limiting it to name
			{
				const params = new URLSearchParams({
					q,
					maxRows: maxRows.toString(),
					username: "Elyahu41",
				});
				addLangIfHebrew(params);

				data = await getJSON("https://secure.geonames.org/searchJSON?" + params.toString());
			}

			//
			// 2) SECOND ATTEMPT: postalCodeLookupJSON?postalcode=
			//
			if (!data.geonames?.length) {
				locationName = false;

				const params = new URLSearchParams({
					postalcode: q,
					username: "Elyahu41"
				});

				data = await getJSON("https://secure.geonames.org/postalCodeLookupJSON?" + params.toString());
			}

			// AUTOCOMPLETE MODE (not Enter key)
			if (!((event instanceof KeyboardEvent && event.key == "Enter") || event instanceof MouseEvent)) {
				clearSuggestions();

				for (const geoName of data[locationName ? "geonames" : "postalcodes"] || []) {
					const item = document.createElement("md-list-item");
					item.innerHTML = `<div slot="headline">${geoNameTitleGenerator(geoName)}</div>`;

					item.addEventListener("click", () => {
						elements.searchBar.value = geoNameTitleGenerator(geoName);
						clearSuggestions();
						// Trigger Enter-mode logic manually
						updateList(new MouseEvent("click"));
					});

					list.appendChild(item);
				}

				showSuggestions();
				return;
			}

			// ENTER KEY MODE (selecting a result)
			let geoName;
			let errorAlert = false;

			if (!locationName) {
				// ZIP mode
				errorAlert = data.postalcodes.length >= 2;
				geoName = data.postalcodes[0];
			} else {
				// Name mode
				geoName =
					data.geonames.find(entry => geoNameTitleGenerator(entry).toLowerCase().includes(q.toLowerCase())) ||
					data.geonames.find(entry => entry.name.toLowerCase() === q.toLowerCase()) ||
					data.geonames.find(entry => entry.name.toLowerCase().includes(q.toLowerCase())) ||
					(q.includes(",") &&
						(data.geonames.find(entry => entry.name.toLowerCase() === q.split(",")[0].toLowerCase()) ||
							data.geonames.find(entry => entry.name.toLowerCase().includes(q.split(",")[0].toLowerCase())))) ||
					data.geonames[0];

				errorAlert =
					!data.geonames.find(geoName =>
						geoNameTitleGenerator(geoName).toLowerCase().includes(q.toLowerCase()) ||
						geoNameTitleGenerator(geoName).toLowerCase().includes(q.toLowerCase().split(",")[0])
					) && data.geonames.length >= 2;
			}

			if (!geoName || errorAlert) {
				showSearchError(errorAlert ? "zipToast" : "inaccessibleToast");
				return;
			}

			// Set coordinates
			geoLocation.lat = parseFloat((typeof geoName.lat == "string" ? parseFloat(geoName.lat) : geoName.lat).toFixed(5));
			geoLocation.long = parseFloat((typeof geoName.lng == "string" ? parseFloat(geoName.lng) : geoName.lng).toFixed(5));

			if (!geoLocation.elevation)
				geoLocation.elevation = await getAverageElevation(geoLocation.lat, geoLocation.long);

			await setLocation(
				"name" in geoName ? geoName.name : geoName.placeName,
				geoName.adminName1 || geoName.adminCode1,
				"countryName" in geoName ? geoName.countryName : geoName.countryCode,
				geoLocation.lat,
				geoLocation.long
			);

			openCalendarWithLocationInfo();

		} catch (e) {
			console.error(e);
			if ((event instanceof KeyboardEvent && event.key == "Enter") || event instanceof MouseEvent)
				showSearchError("inaccessibleToast");
		}
	}
}

/** @param {string} toastId */
function showSearchError(toastId) {
	elements.searchBar.disabled = false;
	elements.icons.error.style.removeProperty("display");
	elements.icons.search.style.display = "none";
	elements.icons.loading.style.display = "none";
	elements.icons.container.style.paddingLeft = "1rem";
	elements.icons.container.style.paddingRight = "1rem";

	const toast = document.getElementById(toastId);
	if ("bootstrap" in window && toast)
		window.bootstrap.Toast.getOrCreateInstance(toast).show();
}

/**
 *  @param {string} name 
 *  @param {string} admin
 *  @param {string} country
 *  @param {number} latitude
 *  @param {number} longitude
*/
async function setLocation(name, admin, country, latitude, longitude) {
	if (country)
		country = country.split("Palestine").join("Israel")

	geoLocation.locationName = [...new Set([name, admin, country])].filter(Boolean).join(", ");

	if (!geoLocation.timeZone) {
		try {
			const params = new URLSearchParams({
				'lat': latitude.toString(),
				'lng': longitude.toString(),
				'username': 'Elyahu41'
			});
			const data = await getJSON("https://secure.geonames.org/timezoneJSON?" + params);

			geoLocation.timeZone = data["timezoneId"]
				.replaceAll("Asia/Gaza", "Asia/Jerusalem")
				.replaceAll("Asia/Hebron", "Asia/Jerusalem");
		} catch (e) {
			const attemptedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
			if (attemptedTimezone) {
				geoLocation.timeZone = attemptedTimezone;
				alert("Timezone API error - The app will use your local timezone on your computer instead of the destination timezone. Please retry later for the intended timezone.")
			} else {
				elements.searchBar.disabled = false;

				elements.icons.error.style.removeProperty("display");
				elements.icons.search.style.display = "none";
				elements.icons.loading.style.display = "none";

				elements.icons.container.style.paddingLeft = '1rem';
				elements.icons.container.style.paddingRight = '1rem';

				console.error(e);
				// This didn't come from getting the user's own location, because they already have the timezone
				// This would come if the location was entered, that API worked and this one started to fail
				// Crash the whole app in this case; it's not a matter of not being able to do things yourself

				const error = {
					/** @type {1} */
					PERMISSION_DENIED: 1,
					/** @type {2} */
					POSITION_UNAVAILABLE: 2,
					/** @type {3} */
					TIMEOUT: 3,
					UNKNOWN_ERROR: 4,
					code: 4,
					message: "An unknown error occured. Please report this on our GitHub repository"
				}
				showError(error);
				return;
			}
		}
	}
}

/**
 * @param {PositionOptions} options
 */
function getCoordinates(options) {
	return new Promise(function (resolve, reject) {
		navigator.geolocation.getCurrentPosition(resolve, reject, options);
	});
}

function getLocation() {
	if (!navigator.geolocation) {
		elements.error.box.innerHTML = "Geolocation is not supported by this browser.";
		elements.error.box.style.removeProperty("display");
	}

	elements.searchBar.disabled = true;

	elements.icons.error.style.display = "none";
	elements.icons.search.style.display = "none";
	elements.icons.loading.style.removeProperty("display");

	elements.icons.container.style.paddingLeft = '.5rem';
	elements.icons.container.style.paddingRight = '.5rem';

	getCoordinates({ maximumAge: 60000, timeout: 9000, enableHighAccuracy: true })
		.then(pos => setLatLong(pos))
		.then(() => openCalendarWithLocationInfo())
		.catch((e) => {
			elements.searchBar.disabled = false;

			elements.icons.error.style.removeProperty("display");
			elements.icons.search.style.display = "none";
			elements.icons.loading.style.display = "none";

			elements.icons.container.style.paddingLeft = '1rem';
			elements.icons.container.style.paddingRight = '1rem';

			showError(e)
		})
}

/**
 * @param {Omit<GeolocationPosition, 'coords'|'toJSON'> & { coords: Partial<GeolocationCoordinates>}} position
 * @param {boolean} [manual] look the time zone up from the place
 * @param {boolean} [typed] the visitor typed these coordinates (and maybe a height, kept as given)
 */
async function setLatLong(position, manual = false, typed = false) {
	let location;
	if (!geoLocation.locationName || !geoLocation.timeZone) {
		try {
			const params = new URLSearchParams({
				'lat': position.coords.latitude.toFixed(5),
				'lng': position.coords.longitude.toFixed(5),
				'username': 'Elyahu41',
				'style': 'FULL'
			});

			if (options().language() == 'he') {
				params.set("lang", "he");
			}
			const data = await getJSON("https://secure.geonames.org/findNearbyPlaceNameJSON?" + params);
			location = data.geonames[0]; // TODO: If there are other False positives

			if (manual)
				geoLocation.timeZone = location.timezone.timeZoneId
		} catch (e) {
			// Only thing this is good for is the location name - if there is a problem, then just have the thing say "Your Location"
			// Only dependency of the location name is to determine whether one is in Israel or not
			console.error(e);

			location = {
				name: "Your Location as of " + new Intl.DateTimeFormat([], {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				}).format(new Date(position.timestamp)),
				adminName1: "",
				countryName: ""
			}
		}
	}

	if (!geoLocation.timeZone)
		geoLocation.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	if (!geoLocation.locationName)
		await setLocation(location.name, location.adminName1, location.countryName,
			parseFloat(position.coords.latitude.toFixed(5)), parseFloat(position.coords.longitude.toFixed(5))
		);

	geoLocation.lat = position.coords.latitude
	geoLocation.long = position.coords.longitude

	// A height the visitor typed (manual entry) is kept. A device's GPS altitude is not used: it is often tens of
	// metres off, can be below zero near the sea, and is height above the ellipsoid on many phones, not above sea
	// level. The ground height comes from the same terrain the visible sunrise is computed on.
	if (typed && Number.isFinite(position.coords.altitude))
		geoLocation.elevation = Math.max(0, /** @type {number} */ (position.coords.altitude));
	else
		geoLocation.elevation = await getAverageElevation(position.coords.latitude, position.coords.longitude);
}

/**
 * @param {GeolocationPositionError} error
 */
function showError(error) {
	const errorObjectBuilder = {
		[error.PERMISSION_DENIED]: "User denied the request for Geolocation. Please allow location access in your browser settings."
			+ '<img src="/assets/images/chrome-location-prompt.png" alt="chrome-location-prompt" style="display: block; margin-left: auto; margin-right: auto; width: 100%" id="loading" />',
		[error.POSITION_UNAVAILABLE]: "Location information is unavailable.",
		[error.TIMEOUT]: "The request to get user location timed out.",
		// @ts-ignore
		[error.UNKNOWN_ERROR]: "An unknown error occured. Please report this on our GitHub repository"
	};

	elements.error.box.style.display = "block";
	elements.error.box.innerHTML = errorObjectBuilder[error.code];
}

/**
 * Ground height (m, never below 0) from the refraction server's terrain (the heights its horizons use), else
 * the AWS Terrain Tiles; 0 if neither answers.
 * @param {number} lat
 * @param {number} long
 */
async function getAverageElevation(lat, long) {
	try {
		const [{ fetchGroundHeight }, { REFRACTION_SERVER }] = await Promise.all([
			import("../astro/ground-height.js"), import("../astro/refraction-data.js")]);
		const h = await fetchGroundHeight(REFRACTION_SERVER, lat, long);
		return Number.isFinite(h) ? Math.max(0, parseFloat(h.toFixed(2))) : 0;
	} catch (e) {
		console.error("Ground height lookup failed", e);
		return 0;
	}
}

function openCalendarWithLocationInfo() {
	options().onChosen(geoLocation);
}

const networkStatus = {
	online: () => { elements.error.offline.style.display = "none" },
	offline: () => { elements.error.offline.style.removeProperty("display") }
}

document.addEventListener("DOMContentLoaded", function () {
	if (!navigator.onLine) networkStatus.offline();
});

window.addEventListener('online', () => networkStatus.online());
window.addEventListener('offline', () => networkStatus.offline());

queryAllElements('button > i.bi-pin-map')
	.forEach((i) => i.parentElement.addEventListener('click', () => getLocation()));

document.getElementById('searchIcon').addEventListener('click', updateList);
document.getElementById('Main').addEventListener('keyup', updateList);

/** @param {string} tz */
function appendOptionToTZSel(tz) {
	const nameContainer = document.createElement('div');
	nameContainer.setAttribute('slot', 'headline');
	nameContainer.appendChild(document.createTextNode(tz));

	const selectOption = document.createElement('md-select-option');
	selectOption.setAttribute('value', tz);
	selectOption.appendChild(nameContainer);

	elements.manual.timezoneSelect.appendChild(selectOption);
}

appendOptionToTZSel(Intl.DateTimeFormat().resolvedOptions().timeZone)
Intl.supportedValuesOf("timeZone")
	.filter(tz => tz !== Intl.DateTimeFormat().resolvedOptions().timeZone)
	.forEach(tz => appendOptionToTZSel(tz))

// @ts-ignore
window.elements = elements;

/** 
 * @param {string} str
 */
function detectLanguageIntent(str) {
    const hasHebrew = /[\u0590-\u05FF]/.test(str);
    const hasEnglish = /[A-Za-z]/.test(str);

    if (hasHebrew && !hasEnglish) return "hebrew";
    if (hasEnglish && !hasHebrew) return "english";

    // If it contains neither Hebrew nor English letters:
    // numbers, punctuation, ZIP codes, coordinates, etc.
    return "neutral";
}

/**
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} selector
 * @returns {Array<T>}
 */
function queryAllElements(selector) {
	/** @type {NodeListOf<T>} */
    const allNodes = (document.querySelectorAll(selector))
	return [...allNodes].filter(node => node instanceof HTMLElement)
}