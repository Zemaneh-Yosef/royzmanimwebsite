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

import * as leaflet from "../libraries/leaflet/leaflet.js"
import { settings } from "./settings/handler.js";
/** @type {ReturnType<leaflet["map"]>} */
let leafletInit;

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
 * 		timezoneSelect: HTMLSelectElement,
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

	if (q.startsWith("(") && q.endsWith(")") && q.split('').filter(x => x == ',').length == 1 && q.split(',').length == 2
		&& q.replace('(', '').replace(')', '').replaceAll(' ', '').split(',').every(val => !isNaN(val) && !isNaN(parseFloat(val)))) {
		if (elements.manual.container.classList.contains('d-none')) {
			elements.manual.container.classList.remove('d-none');
			requestAnimationFrame(() => elements.manual[navigator.onLine ? 'map' : 'timezoneSelect'].scrollIntoView());
		}

		const [lat, lng] = q.replace('(', '').replace(')', '').split(',').map(num => parseFloat(num))
		if (!leafletInit) {
			leafletInit = leaflet.map(elements.manual.map, {
				dragging: false,
				minZoom: 16,
				touchZoom: 'center',
				scrollWheelZoom: 'center'
			})
			leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			}).addTo(leafletInit);
		}

		leafletInit.setView([lat, lng], 13);

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

			await setLatLong(params, !elements.manual.timezoneSelect.value);
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
				console.log(detectLanguageIntent(q));
				if (detectLanguageIntent(q) == "english") return;
				if (detectLanguageIntent(q) == "neutral" && settings.language() != "hb") return;

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
				elements.searchBar.disabled = false;
				elements.icons.error.style.removeProperty("display");
				elements.icons.search.style.display = "none";
				elements.icons.loading.style.display = "none";
				elements.icons.container.style.paddingLeft = "1rem";
				elements.icons.container.style.paddingRight = "1rem";

				if ("bootstrap" in window) {
					const toastBootstrap = window.bootstrap.Toast.getOrCreateInstance(
						document.getElementById(errorAlert ? "zipToast" : "inaccessibleToast")
					);
					toastBootstrap.show();
				}
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
		}
	}
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
			if (attemptedTimezone)
				alert("Timezone API error - The app will use your local timezone on your computer instead of the destination timezone. Please retry later for the intended timezone.")
			else {
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
 */
async function setLatLong(position, manual = false) {
	let location;
	if (!geoLocation.locationName || !geoLocation.timeZone) {
		try {
			const params = new URLSearchParams({
				'lat': position.coords.latitude.toFixed(5),
				'lng': position.coords.longitude.toFixed(5),
				'username': 'Elyahu41',
				'style': 'FULL'
			});

			if (settings.language() == 'hb') {
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
				country: ""
			}
		}
	}

	if (!geoLocation.timeZone)
		geoLocation.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	if (!geoLocation.locationName)
		await setLocation(location.name, location.adminName1, location.country,
			parseFloat(position.coords.latitude.toFixed(5)), parseFloat(position.coords.longitude.toFixed(5))
		);

	geoLocation.lat = position.coords.latitude
	geoLocation.long = position.coords.longitude

	if ('altitude' in position.coords && position.coords.altitude !== null && 'altitudeAccuracy' in position.coords && position.coords.altitudeAccuracy) {
		geoLocation.elevation = position.coords.altitude
	} else {
		geoLocation.elevation = await getAverageElevation(position.coords.latitude, position.coords.longitude);
	}
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
 * @param {number} lat
 * @param {number} long  
 */
async function getAverageElevation(lat, long) {
	//we make 3 JSON requests to get the elevation data from the 3 different sources on geonames.org and we average the results
	//whichever is the last one to return will be the one to sum up and divide by the number of elevations to get the average

	const params = new URLSearchParams({
		'lat': lat.toString(),
		'lng': long.toString(),
		'username': 'Elyahu41'
	});

	/** @type {() => Promise<number>} */
	const srtm3 = async () => {
		try {
			const data = await getJSON("https://secure.geonames.org/srtm3JSON?" + params.toString());
			return data.srtm3;
		} catch (e) {
			console.error("Error with strm3JSON elevation request");
			console.error(e);
		}
	}

	/** @type {() => Promise<number>} */
	const astergdem = async () => {
		try {
			const data2 = await getJSON("https://secure.geonames.org/astergdemJSON?" + params.toString());
			return data2.astergdem;
		} catch (e) {
			console.error("Error with astergdemJSON elevation request");
			console.error(e);
		}
	}

	/** @type {() => Promise<number>} */
	const gtopo30 = async () => {
		try {
			const data3 = await getJSON("https://secure.geonames.org/gtopo30JSON?" + params.toString());
			return data3.gtopo30;
		} catch (e) {
			console.error("Error with gtopo30JSON elevation request");
			console.error(e);
		}
	}

	const elevations = (await Promise.all([astergdem(), srtm3(), gtopo30()])).filter(Boolean).filter(num => num > 0)
	const equation = parseFloat((elevations.length ? elevations.reduce((p, c) => p + c, 0) / elevations.length : 0).toFixed(2));

	return Math.max(equation, 0);
}

function openCalendarWithLocationInfo() {
	if (!geoLocation.locationName.toLowerCase().includes('israel')) {
		localStorage.setItem("hourCalculators", "degrees");
		localStorage.setItem("rtKulah", "true");
		localStorage.setItem("tzeitTaanitHumra", "false");
		localStorage.setItem("tekufa", "hatzoth");
	} else {
		localStorage.setItem("hourCalculators", "seasonal");
		localStorage.setItem("rtKulah", "false");
		localStorage.setItem("tzeitTaanitHumra", "true");
		localStorage.setItem("tekufa", "arbitrary");
	}

	const typedGL = Object.entries(geoLocation).map(([key, value]) => [key, (typeof value == 'number' ? value.toString() : value)])
	const params = new URLSearchParams(Object.fromEntries(typedGL));
	window.location.href = "calendar?" + params.toString();
}

const networkStatus = {
	online: () => { elements.error.offline.style.display = "none" },
	offline: () => { elements.error.offline.style.removeProperty("display") }
}

document.addEventListener("DOMContentLoaded", function () {
	if (urlParams.get('modalShow') == 'tekufa') {
		// @ts-ignore
		window.bootstrap.Modal.getOrCreateInstance(document.getElementById("tekufaModal")).show()
	}

	if (!navigator.onLine) networkStatus.offline();
});

window.addEventListener('online', () => networkStatus.online());
window.addEventListener('offline', () => networkStatus.offline());

document.querySelectorAll('button > i.bi-pin-map')
	.forEach((/** @type {HTMLElement} */ i) => i.parentElement.addEventListener('click', () => getLocation()));

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
