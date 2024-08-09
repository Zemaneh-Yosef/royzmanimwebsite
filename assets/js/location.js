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
		search: document.querySelector('.input-group-text .fa-search'),
		error: document.querySelector('.input-group-text .fa-times-circle'),
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
const geoNameTitleGenerator = (geoName) => [...new Set([('name' in geoName ? geoName.name : geoName.placeName),
	geoName.adminName1 || geoName.adminCode1,
	('countryName' in geoName ? geoName.countryName : geoName.countryCode)])].filter(Boolean).join(", ");

let pool;
const delay = (/** @type {Number} */ms) => new Promise(res => setTimeout(res, ms));

/** @param {KeyboardEvent|MouseEvent} event */
async function updateList(event) {
	elements.searchBar.classList.remove("is-warning")
	elements.error.notEnoughChar.style.display = "none";

	elements.icons.error.style.display = "none";
	elements.icons.search.style.removeProperty("display");
	elements.icons.loading.style.display = "none";

	elements.icons.container.style.paddingLeft = '1rem';
	elements.icons.container.style.paddingRight = '1rem';

	/** @type {string} */
	const q = elements.searchBar.value;
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
			requestAnimationFrame(() => elements.manual.map.scrollIntoView());
		}

		const [lat, lng] = q.replace('(', '').replace(')', '').split(',').map(num=>parseFloat(num))
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

			/** @type {Omit<GeolocationPosition, 'coords'> & { coords: Partial<GeolocationCoordinates>}} */
			const params = { timestamp: new Date().getTime(), coords: { latitude: lat, longitude: lng } }
			if (elements.manual.elevationInput.value) {
				params.coords.altitude = parseFloat(elements.manual.elevationInput.value);
				params.coords.altitudeAccuracy = true
			}

			await setLatLong(params, !elements.manual.timezoneSelect.value);
			openCalendarWithLocationInfo();
		}
	} else {
		elements.manual.container.classList.add('d-none');
		if (!((event instanceof KeyboardEvent && event.key == "Enter") || event instanceof MouseEvent)) {
			pool = q;
			await delay(1000);
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
			let locationName = true;
			let params = new URLSearchParams({ q, maxRows: maxRows.toString(), 'username': 'Elyahu41' });
			/** @type {geoNamesResponse} */
			let data = await getJSON("https://secure.geonames.org/searchJSON?" + params.toString());
			if (!data.geonames.length && q.includes(',')) {
				params.delete('q');
				params.set('q', q.split(',')[0]);
				/** @type {geoNamesResponse} */
				const newData = await getJSON("https://secure.geonames.org/searchJSON?" + params.toString())
				const match = newData.geonames.find(geoName => geoNameTitleGenerator(geoName) == q)
				if (match)
					data.geonames = [match]
			}
			if (!data.geonames.length) {
				locationName = false;
	
				params.delete('maxRows');
				params.delete('q');
				params.set('postalcode', q);
				data = await getJSON("https://secure.geonames.org/postalCodeLookupJSON?" + params.toString())
			}
	
			if ((event instanceof KeyboardEvent && event.key == "Enter") || event instanceof MouseEvent) {
				let geoName;
				if (!locationName)
					geoName = data.postalcodes[0];
				else {
					geoName = data.geonames.find(entry => entry.name == q);
					if (!geoName)
						geoName = data.geonames.find(entry => entry.name.includes(q))
					if (!geoName && q.includes(',')) {
						geoName = data.geonames.find(entry => entry.name == q.split(',')[0]);
						if (!geoName)
							geoName = data.geonames.find(entry => entry.name.includes(q.split(',')[0]))
					}
					if (!geoName)
						geoName = data.geonames[0]
				}

				const multiZip = (locationName
					? !data.geonames.find(geoName => geoNameTitleGenerator(geoName).includes(q) || geoNameTitleGenerator(geoName).includes(q.split(',')[0])) && data.geonames.length !== 1
					: data.postalcodes.length >= 2);
				if (!geoName || multiZip) {
					elements.searchBar.disabled = false;
					elements.icons.error.style.removeProperty("display");
					elements.icons.search.style.display = "none";
					elements.icons.loading.style.display = "none"

					elements.icons.container.style.paddingLeft = '1rem';
					elements.icons.container.style.paddingRight = '1rem';
	
					const toastBootstrap = window.bootstrap.Toast.getOrCreateInstance(document.getElementById(!geoName ? 'inaccessibleToast' : 'zipToast'))
					toastBootstrap.show()
					return;
				}

				geoLocation.lat = parseFloat((typeof geoName.lat == "string" ? parseFloat(geoName.lat) : geoName.lat).toFixed(5)),
				geoLocation.long = parseFloat((typeof geoName.lng == "string" ? parseFloat(geoName.lng) : geoName.lng).toFixed(5))

				if (!geoLocation.elevation)
					geoLocation.elevation = await getAverageElevation(geoLocation.lat, geoLocation.long);

				await setLocation(
					('name' in geoName ? geoName.name : geoName.placeName),
					geoName.adminName1 || geoName.adminCode1,
					('countryName' in geoName ? geoName.countryName : geoName.countryCode),
					geoLocation.lat, geoLocation.long
				);

				openCalendarWithLocationInfo();
			} else {
				const list = document.getElementById("locationNames");
				list.querySelectorAll('*').forEach(n => n.remove());
				for (const geoName of (locationName ? data.geonames : data.postalcodes)) {
					const option = document.createElement("option");
					option.setAttribute("value", geoNameTitleGenerator(geoName))
	
					list.append(option)
				}
			}
		} catch (e) {
			console.error(e);
			// Do not crash the program - it just means that they cannot look for a location by name, so just don't offer that feature
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
	return new Promise(function(resolve, reject) {
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

	getCoordinates({maximumAge:60000, timeout:9000, enableHighAccuracy:true})
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
 * @param {Omit<GeolocationPosition, 'coords'> & { coords: Partial<GeolocationCoordinates>}} position 
 */
async function setLatLong (position, manual=false) {
	let location;
	if (!geoLocation.locationName || !geoLocation.timeZone) {
		try {
			const params = new URLSearchParams({
				'lat': position.coords.latitude.toFixed(5),
				'lng': position.coords.longitude.toFixed(5),
				'username': 'Elyahu41',
				'style': 'FULL'
			});
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
async function getAverageElevation (lat, long) {
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
		} catch(e) {
			console.error("Error with astergdemJSON elevation request");
			console.error(e);
		}
	}

	/** @type {() => Promise<number>} */
	const gtopo30 = async () => {
		try {
			const data3 = await getJSON("https://secure.geonames.org/gtopo30JSON?" + params.toString());
			return data3.gtopo30;
		} catch(e) {
			console.error("Error with gtopo30JSON elevation request");
			console.error(e);
		}
	}

	const elevations = (await Promise.all([astergdem(), srtm3(), gtopo30()])).filter(Boolean).filter(num => num > 0)
	const equation = parseFloat((elevations.length ? elevations.reduce( ( p, c ) => p + c, 0 ) / elevations.length : 0).toFixed(2));

	return Math.max(equation, 0);
}

function openCalendarWithLocationInfo() {
	if (document.getElementById("flexRadioDefault2").checked) {
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
	online: () => { elements.searchBar.disabled = false; elements.error.offline.style.display = "none" },
	offline: () => { elements.searchBar.disabled = true; elements.error.offline.style.removeProperty("display") }
}

document.addEventListener("DOMContentLoaded", function(){
	if (urlParams.get('modalShow') == 'tekufa') {
		window.bootstrap.Modal.getOrCreateInstance(document.getElementById("tekufaModal")).show()
	}

	if (!navigator.onLine) networkStatus.offline();
});

window.addEventListener('online', () => networkStatus.online());
window.addEventListener('offline', () => networkStatus.offline());

document.querySelectorAll('button > i.fa-map-marker')
	.forEach((/** @type {HTMLElement} */ i) => i.parentElement.addEventListener('click', () => getLocation()));

document.getElementById('searchIcon').addEventListener('click', (e) => updateList(e));
document.getElementById('Main').addEventListener('keyup', (ev) => updateList(ev));

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

window.elements = elements;