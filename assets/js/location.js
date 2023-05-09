const getJSON = async (url) => await (await fetch(url)).json();
const geoLocation = {
	locationName: '',
	lat: 0,
	long: 0,
	elevation: 0,
	timeZone: ""
}

let maxRows = 10;
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

async function updateList() {
	const q = document.getElementById("Main").value;
	if (q.length < 3) {
		if (q.length == 0)
			document.getElementById("list").style.display = "none";

		return;
	}
	document.getElementById("list").style.display = "block";

	const params = new URLSearchParams({
		q,
		maxRows,
		'username': 'Elyahu41'
	});
	const data = await getJSON("https://secure.geonames.org/searchJSON?" + params);

	var list = document.getElementById("list");
	list.innerHTML = "";
	for (var i = 0; i < data["geonames"].length; i++) {
		const geoName = data.geonames[i];

		const li = document.createElement("li");
		const a = document.createElement("a");
		a.setAttribute("href", "#");
		a.addEventListener("click", () => setLocation(geoName.name, geoName.adminName1, geoName.countryName, geoName.lat, geoName.lng));
		a.innerText = [geoName.name, geoName.adminName1, geoName.countryName].join(", ");

		li.appendChild(a);
		list.appendChild(li);

		if (i == data["geonames"].length - 1 && maxRows == 10) {
			const allResultsList = document.createElement("li");
			const allResultsLink = document.createElement("a");
			allResultsLink.innerText = "Show all results";
			allResultsLink.addEventListener("click", () => showAllLocations());
			allResultsList.appendChild(allResultsLink);
			list.appendChild(allResultsList);
		}
	}
	maxPossibleRows = data["totalResultsCount"];
	filterList();
}

function filterList() {
	const filter = document.getElementById("Main").value.toUpperCase();
	const list = document.getElementById("list");
	const li = list.getElementsByTagName("li");

	// Loop through all list items, and hide those who don't match the search query
	for (let element of li) {
		const a = element.querySelector("a");
		const txtValue = a?.textContent || a?.innerText;
		if (!(txtValue.toUpperCase().indexOf(filter) > -1))
			element.style.display = "none";
	}
}

function showAllLocations() {
	maxRows = maxPossibleRows;
	updateList();
}

async function setLocation(name, admin, country, latitude, longitude) {
	var array = [...new Set(name, admin, country)];
	geoLocation.locationName = array.join(", ");
	geoLocation.lat = latitude;
	geoLocation.long = longitude;
	document.getElementById("list").style.display = "none";
	document.getElementById("error").value = "";
	loadingScreen();

	const params = new URLSearchParams({
		lat,
		'lng': long,
		'username': 'Elyahu41'
	});
	const data = await getJSON("https://secure.geonames.org/timezoneJSON?" + params);

	geoLocation.timeZone = data["timezoneId"];
	getAverageElevation(lat, long) | 0;
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
	geoLocation.lat = position.coords.latitude;
	geoLocation.long = position.coords.longitude;

	const params = new URLSearchParams({
		'lat': geoLocation.lat,
		'lng': geoLocation.long,
		'username': 'Elyahu41'
	});
	const data = await getJSON("https://secure.geonames.org/findNearbyPlaceNameJSON?" + params);
	geoLocation.locationName = [data["geonames"][0]["name"], data["geonames"][0]["adminName1"], data["geonames"][0]["countryName"]].join(", ");

	geoLocation.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	getAverageElevation(geoLocation.lat, geoLocation.long) | 0;
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
	const data = await getJSON("https://secure.geonames.org/srtm3JSON?" + params);

	if (data.srtm3 > 0)
		elevations.push(data.srtm3);

	const data2 = await getJSON("https://secure.geonames.org/astergdemJSON?" + params);
	if (data2.astergdem > 0)
		elevations.push(data2.astergdem);

	const data3 = await getJSON("https://secure.geonames.org/gtopo30JSON?" + params);
	if (data3.gtopo30 > 0)
		elevations.push(data3.gtopo30);

	geoLocation.elevation = elevations.reduce( ( p, c ) => p + c, 0 ) / elevations.length;
}

function openCalendarWithLocationInfo() {
	const params = new URLSearchParams(geoLocation);
	window.location.href = "calendar?" + params.toString();
}
