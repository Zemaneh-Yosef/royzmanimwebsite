const getJSON = async (/** @type {RequestInfo | URL} */ url) => await (await fetch(url)).json();
const geoLocation = {
	locationName: '',
	lat: 0,
	long: 0,
	elevation: 0,
	timeZone: ""
}

let maxRows = 5;
let maxPossibleRows = 0;

const errorBox = document.getElementById("error");

function showManualLocationSettings() {
	const manualLocation = document.getElementById("manualLocation");
	if (!manualLocation.style.display) {
		manualLocation.style.display = "none";
		return;
	}

	manualLocation.style.removeProperty("display");

	/**
	 * @type {HTMLSelectElement}
	 */
	let select = document.getElementById("timezoneInput");
	if (!select.options.length) {
		if (!Intl.supportedValuesOf) {
			let opt = new Option("Your browser does not support Intl.supportedValuesOf().", null, true, true);
			opt.disabled = true;
			select.options.add(opt);
		} else {
			for (const timeZone of Intl.supportedValuesOf("timeZone")) {
				select.options.add(new Option(timeZone));
			}
			select.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
	}
}

function manualLocationSubmit() {
	geoLocation.locationName = document.getElementById("cityInput").value;
	geoLocation.lat = document.getElementById("latInput").value;
	geoLocation.long = document.getElementById("longInput").value;
	geoLocation.elevation = document.getElementById("elevationInput").value;
	geoLocation.timeZone = document.getElementById("timezoneInput").value;

	if (geoLocation.lat == "" || geoLocation.long == "") {
		alert("Please fill out latitude and longitude fields");
		return;
	}

	openCalendarWithLocationInfo();
}

const iconography = {
	search: document.querySelector('.input-group-text .fa-search'),
	error: document.querySelector('.input-group-text .fa-times-circle'),
	loading: document.querySelector('.input-group-text .spinner-border')
}

const geoNameTitleGenerator = (geoName) => [...new Set([geoName.name || geoName.placeName,
	geoName.adminName1 || geoName.adminCode1,
	geoName.countryName || geoName.countryCode])].filter(Boolean).join(", ");

async function updateList(event) {
	const q = document.getElementById("Main").value;
	if (q.length < 3)
		return;

	try {
		let locationName = true;
		let params = new URLSearchParams({ q, maxRows, 'username': 'Elyahu41' });
		let data = await getJSON("https://secure.geonames.org/searchJSON?" + params.toString());
		if (!data.geonames.length && q.includes(',')) {
			params.delete('q');
			params.set('q', q.split(',')[0]);
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

		if (event instanceof KeyboardEvent && event.key !== "Enter") {
			iconography.error.style.display = "none";
			iconography.search.style.removeProperty("display");
			iconography.loading.style.display = "none"
			document.getElementsByClassName("input-group-text")[0].style.removeProperty("padding-left");

			const list = document.getElementById("locationNames");
			list.querySelectorAll('*').forEach(n => n.remove());
			for (const geoName of (locationName ? data.geonames : data.postalcodes)) {
				const option = document.createElement("option");
				option.setAttribute("value", geoNameTitleGenerator(geoName))

				list.append(option)
			}
		} else {
			const geoName = (locationName ? data.geonames.find(entry => entry.name.includes(q)) || data.geonames[0] : data.postalcodes[0])
			const multiZip = (!locationName || !data.geonames.find(geoName => geoNameTitleGenerator(geoName).includes(q) || geoNameTitleGenerator(geoName).includes(q.split(',')[0]))) && (data.postalcodes || data.geonames).length !== 1;
			if (!geoName || multiZip) {
				iconography.error.style.removeProperty("display");
				iconography.search.style.display = "none";
				iconography.loading.style.display = "none"
				document.getElementsByClassName("input-group-text")[0].style.removeProperty("padding-left");

				const toastBootstrap = mdb.Toast.getOrCreateInstance(document.getElementById(!geoName ? 'inaccessibleToast' : 'zipToast'))
				toastBootstrap.show()
				return;
			}

			iconography.error.style.display = "none";
			iconography.search.style.display = "none";
			iconography.loading.style.removeProperty("display");
			document.getElementsByClassName("input-group-text")[0].style.paddingLeft = '.5rem';

			await setLocation(
				geoName.name || geoName.placeName,
				geoName.adminName1 || geoName.adminCode1,
				geoName.countryName || geoName.countryCode,
				geoName.lat, geoName.lng
			);
			openCalendarWithLocationInfo();
		}
	} catch (e) {
		console.error(e);
		// Do not crash the program - it just means that they cannot look for a location by name, so just don't offer that feature
	}
}

async function setLocation(name, admin, country, latitude, longitude) {
	geoLocation.locationName = [...new Set([name, admin, country])].filter(Boolean).join(", ");
	geoLocation.lat = latitude;
	geoLocation.long = longitude;

	if (!geoLocation.timeZone) {
		try {
			const params = new URLSearchParams({
				'lat': latitude,
				'lng': longitude,
				'username': 'Elyahu41'
			});
			const data = await getJSON("https://secure.geonames.org/timezoneJSON?" + params);

			geoLocation.timeZone = data["timezoneId"];
		} catch (e) {
			iconography.error.style.removeProperty("display");
			iconography.search.style.display = "none";
			iconography.loading.style.display = "none"
			document.getElementsByClassName("input-group-text")[0].style.removeProperty("padding-left");

			console.error(e);
			// This didn't come from getting the user's own location, because they already have the timezone
			// This would come if the location was entered, that API worked and this one started to fail
			// Crash the whole app in this case; it's not a matter of not being able to do things yourself

			const error = {
				PERMISSION_DENIED: 1,
				POSITION_UNAVAILABLE: 2,
				TIMEOUT: 3,
				UNKNOWN_ERROR: 4,
				code: 4
			}
			showError(error);
		}
	}

	geoLocation.elevation = await getAverageElevation(latitude, longitude);
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
		errorBox.innerHTML = "Geolocation is not supported by this browser.";
		errorBox.style.display = "block";
	}

	getCoordinates({maximumAge:60000, timeout:5000, enableHighAccuracy:true})
		.then(pos => {
			iconography.error.style.display = "none";
			iconography.search.style.display = "none";
			iconography.loading.style.removeProperty("display");
			document.getElementsByClassName("input-group-text")[0].style.paddingLeft = '.5rem';

			return setLatLong(pos)
		})
		.then(() => openCalendarWithLocationInfo())
		.catch((e) => {
			iconography.error.style.removeProperty("display");
			iconography.search.style.display = "none";
			iconography.loading.style.display = "none"
			document.getElementsByClassName("input-group-text")[0].style.removeProperty("padding-left");

			showError(e)
		})
}

async function setLatLong (position) {
	geoLocation.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	let location;
	try {
		const params = new URLSearchParams({
			'lat': position.coords.latitude,
			'lng': position.coords.longitude,
			'username': 'Elyahu41'
		});
		const data = await getJSON("https://secure.geonames.org/findNearbyPlaceNameJSON?" + params);
		location = data["geonames"][0]; // TODO: If there are other False positives
	} catch (e) {
		// Only thing this is good for is the location name - if there is a problem, then just have the thing say "Your Location"
		console.error(e);
		// set up date formatting parameters
		const ops = {year: 'numeric'};
		ops.month = ops.day = '2-digit';

		location = {
			name: "Your Location as of " + new Intl.DateTimeFormat([], ops).format(new Date()),
			adminName1: "",
			country: ""
		}
	}

	await setLocation(location.name, location.adminName1, location.country, position.coords.latitude, position.coords.longitude);
}

/**
 * @param {GeolocationPositionError} error
 */
function showError(error) {
	const errorObjectBuilder = Object.fromEntries([
		[error.PERMISSION_DENIED, "User denied the request for Geolocation. Please allow location access in your browser settings."
		+ '<img src="chrome-location-prompt.png" alt="chrome-location-prompt" style="display: block; margin-left: auto; margin-right: auto; width: 100%" id="loading" />'],
		[error.POSITION_UNAVAILABLE, "Location information is unavailable."],
		[error.TIMEOUT, "The request to get user location timed out."],
		[error.UNKNOWN_ERROR, "An unknown error occured. Please report this on our GitHub repository"]
	]);

	errorBox.style.display = "block";
	errorBox.innerHTML = errorObjectBuilder[error.code];
}

async function getAverageElevation (lat, long) {
	const elevations = [];

	//we make 3 JSON requests to get the elevation data from the 3 different sources on geonames.org and we average the results
	//whichever is the last one to return will be the one to sum up and divide by the number of elevations to get the average

	const params = new URLSearchParams({
		lat,
		'lng': long,
		'username': 'Elyahu41'
	});

	try {
		const data = await getJSON("https://secure.geonames.org/srtm3JSON?" + params.toString());
		if (data.srtm3 > 0)
			elevations.push(data.srtm3);
	} catch (e) {
		console.error("Error with strm3JSON elevation request");
		console.error(e);
	}

	try {
		const data2 = await getJSON("https://secure.geonames.org/astergdemJSON?" + params.toString());
		if (data2.astergdem > 0)
			elevations.push(data2.astergdem);
	} catch(e) {
		console.error("Error with astergdemJSON elevation request");
		console.error(e);
	}

	try {
		const data3 = await getJSON("https://secure.geonames.org/gtopo30JSON?" + params.toString());
		if (data3.gtopo30 > 0)
			elevations.push(data3.gtopo30);
	} catch(e) {
		console.error("Error with gtopo30JSON elevation request");
		console.error(e);
	}

	return (elevations.length ? elevations.reduce( ( p, c ) => p + c, 0 ) / elevations.length : 0);
}

function openCalendarWithLocationInfo() {
	localStorage.setItem("calendarSource", document.getElementById("flexRadioDefault2").checked ? "amudehHoraah" : "ohrHachaim")
	const params = new URLSearchParams(geoLocation);
	window.location.href = "calendar?" + params.toString();
}
