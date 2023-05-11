const getJSON = async (url) => await (await fetch(url)).json();
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
const loadingScreen = () => {
	errorBox.style.display = "block";
	errorBox.innerHTML = '<img src="Loading_icon.gif" alt="loading" style="display: block; margin-left: auto; margin-right: auto; width: 10%" id="loading" /><br><br>Loading...';
}

function showManualLocationSettings() {
	const manualLocation = document.getElementById("manualLocation");
	const manualLocationButton = document.getElementById("showManualLocation");
	if (manualLocation.style.display == "block") {
		manualLocationButton.innerHTML = "Manual Location";
		manualLocation.style.display = "none";
		return;
	}

	manualLocationButton.innerHTML = "Hide Manual Location";
	manualLocation.style.display = "block";

	let select = document.getElementById("timezoneInput");
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

async function updateList(event) {
	const q = document.getElementById("Main").value;
	if (q.length < 3)
		return;

	const params = new URLSearchParams({ q, maxRows, 'username': 'Elyahu41' });
	const data = await getJSON("https://secure.geonames.org/searchJSON?" + params);

	if (event instanceof KeyboardEvent && event.key !== "Enter") {
		const list = document.getElementById("locationNames");
		list.querySelectorAll('*').forEach(n => n.remove());
		for (const geoName of data.geonames) {
			const option = document.createElement("option");
			option.setAttribute("value", [...new Set([geoName.name, geoName.adminName1, geoName.country])].filter(Boolean).join(", "))

			list.append(option)
		}
	} else {
		loadingScreen();
		await setLocation(data.geonames[0].name, data.geonames[0].adminName1, data.geonames[0].countryName, data.geonames[0].lat, data.geonames[0].lng);
		openCalendarWithLocationInfo();
	}
}

async function setLocation(name, admin, country, latitude, longitude) {
	geoLocation.locationName = [...new Set([name, admin, country])].filter(Boolean).join(", ");
	geoLocation.lat = latitude;
	geoLocation.long = longitude;

	if (!geoLocation.timeZone) {
		const params = new URLSearchParams({
			'lat': latitude,
			'lng': longitude,
			'username': 'Elyahu41'
		});
		const data = await getJSON("https://secure.geonames.org/timezoneJSON?" + params);

		geoLocation.timeZone = data["timezoneId"];
	}

	geoLocation.elevation = await getAverageElevation(latitude, longitude);
}

async function getLocation() {
	if (!navigator.geolocation) {
		errorBox.innerHTML = "Geolocation is not supported by this browser.";
		errorBox.style.display = "block";
	}

	loadingScreen();
	try {
		const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));

		await setLatLong(pos);
		openCalendarWithLocationInfo();
	} catch (e) {
		showError(error)
	}
}

async function setLatLong (position) {
	geoLocation.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	const params = new URLSearchParams({
		'lat': position.coords.latitude,
		'lng': position.coords.longitude,
		'username': 'Elyahu41'
	});
	const data = await getJSON("https://secure.geonames.org/findNearbyPlaceNameJSON?" + params);
	const location = data["geonames"][0]; // TODO: If there are other False positives

	await setLocation(location.name, location.adminName1, location.country, position.coords.latitude, position.coords.longitude);
}

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
	const params = new URLSearchParams(geoLocation);
	window.location.href = "calendar?" + params.toString();
}
