var errorBox = document.getElementById("error");
var locationName = "";
var lat = 0;
var long = 0;
var elevation = 0;
var timezone = "";
var maxRows = 10;
var maxPossibleRows = 0;

const getJSON = async (url) => {
  const response = await fetch(url);
  return (data = response.json()); // get JSON from the response
};

function showManualLocationSettings() {
  var manualLocation = document.getElementById("manualLocation");
  var manualLocationButton = document.getElementById("showManualLocation");
  if (manualLocation.style.display == "block") {
    manualLocationButton.innerHTML = "Manual Location";
    manualLocation.style.display = "none";
    return;
  }
  manualLocationButton.innerHTML = "Hide Manual Location";
  manualLocation.style.display = "block";
  let select = document.getElementById("timezoneInput");
  if (!Intl.supportedValuesOf) {// TODO replace the option with a console warning
    let opt = new Option(
      "Your browser does not support Intl.supportedValuesOf().",
      null,
      true,
      true
    );
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
  locationName = document.getElementById("cityInput").value;
  lat = document.getElementById("latInput").value;
  long = document.getElementById("longInput").value;
  elevation = document.getElementById("elevationInput").value;
  timezone = document.getElementById("timezoneInput").value;
  if (lat == "" || long == "") {
    alert("Please fill out latitude and longitude fields");
    return;
  }
  openCalendarWithLocationInfo();
}

function updateList() {
  var q = document.getElementById("Main").value;
  if (q.length < 3) {
    if (q.length == 0) {
      document.getElementById("list").style.display = "none";
    }
    return;
  }
  document.getElementById("list").style.display = "block";
  getJSON(
    "https://secure.geonames.org/searchJSON?q=" +
    q +
    "&" +
    "maxRows=" +
    maxRows +
    "&username=Elyahu41"
  ).then((data) => {
    var list = document.getElementById("list");
    list.innerHTML = "";
    for (var i = 0; i < data["geonames"].length; i++) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.setAttribute("href", "#");
      a.setAttribute(
        "onclick",
        "setLocation(" +
        "'" +
        data["geonames"][i]["name"] +
        "'" +
        ", " +
        "'" +
        data["geonames"][i]["adminName1"] +
        "'" +
        ", " +
        "'" +
        data["geonames"][i]["countryName"] +
        "'" +
        ", " +
        data["geonames"][i]["lat"] +
        ", " +
        data["geonames"][i]["lng"] +
        ")"
      );
      a.innerHTML =
        data["geonames"][i]["name"] +
        ", " +
        data["geonames"][i]["adminName1"] +
        ", " +
        data["geonames"][i]["countryName"];
      li.appendChild(a);
      list.appendChild(li);
      if (i == data["geonames"].length - 1 && maxRows == 10) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.innerHTML = "Show all results";
        a.setAttribute("onclick", "showAllLocations()");
        li.appendChild(a);
        list.appendChild(li);
      }
    }
    maxPossibleRows = data["totalResultsCount"];
  });
  filterList();
}

function filterList() {
  // Declare variables
  var input, filter, list, li, a, i, txtValue;
  input = document.getElementById("Main");
  filter = input.value.toUpperCase();
  list = document.getElementById("list");
  li = list.getElementsByTagName("li");

  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

function showAllLocations() {
  maxRows = maxPossibleRows;
  updateList();
}

function setLocation(name, admin, country, latitude, longitude) {
  var array = [name, admin, country];
  if (name == admin) {
    array = [name, country];
  }
  if (name == admin && admin == country) {
    array = [name];
  }
  locationName = array.join(", ");
  lat = latitude;
  long = longitude;
  document.getElementById("list").style.display = "none";
  document.getElementById("error").value = "";
  errorBox.style.display = "block";
  errorBox.innerHTML =
    '<img src="Loading_icon.gif" alt="loading" style="display: block; margin-left: auto; margin-right: auto; width: 10%" id="loading" /><br><br>Loading...';
  getJSON(
    "https://secure.geonames.org/timezoneJSON?lat=" +
    lat +
    "&lng=" +
    long +
    "&username=Elyahu41"
  ).then((data) => {
    timezone = data["timezoneId"];
    getAverageElevation(lat, long) | 0;
  });
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setLatLong, showError);
  } else {
    errorBox.innerHTML = "Geolocation is not supported by this browser.";
    errorBox.style.display = "block";
  }
}

function setLatLong(position) {
  errorBox.style.display = "block";
  errorBox.innerHTML =
    '<img src="Loading_icon.gif" alt="loading" style="display: block; margin-left: auto; margin-right: auto; width: 10%" id="loading" /><br><br>Loading...';
  locationName = getJSON(
    "https://secure.geonames.org/findNearbyPlaceNameJSON?lat=" +
    position.coords.latitude +
    "&lng=" +
    position.coords.longitude +
    "&username=Elyahu41"
  ).then((data) => {
    locationName = data["geonames"][0]["name"] + ", " + data["geonames"][0]["adminName1"] + ", " + data["geonames"][0]["countryName"];
  });
  lat = position.coords.latitude;
  long = position.coords.longitude;
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  getAverageElevation(lat, long) | 0;
}

function showError(error) {
  errorBox.style.display = "block";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      //user denied the request for Geolocation, show image "chrome-location-prompt.png"
      errorBox.innerHTML = "User denied the request for Geolocation. Please allow location access in your browser settings.";
      errorBox.innerHTML += '<img src="chrome-location-prompt.png" alt="chrome-location-prompt" style="display: block; margin-left: auto; margin-right: auto; width: 100%" id="loading" />';
      break;
    case error.POSITION_UNAVAILABLE:
      errorBox.innerHTML = "Location information is unavailable.";
      break;
    case error.TIMEOUT:
      errorBox.innerHTML = "The request to get user location timed out.";
      break;
    case error.UNKNOWN_ERROR:
      errorBox.innerHTML = "An unknown error occurred.";
      break;
  }
}

function getAverageElevation(lat, long) {
  var sum = 0;
  var count = 0;
  var elevations = [];

  //we make 3 JSON requests to get the elevation data from the 3 different sources on geonames.org and we average the results
  //whichever is the last one to return will be the one to sum up and divide by the number of elevations to get the average
  getJSON(
    "https://secure.geonames.org/srtm3JSON?lat=" +
    lat +
    "&lng=" +
    long +
    "&username=Elyahu41"
  )
    .then((data) => {
      if (data.srtm3 > 0) {
        elevations.push(data.srtm3);
      }
      count++;
      if (count == 3) {
        for (var i = 0; i < elevations.length; i++) {
          sum += elevations[i];
        }

        var size = elevations.length;

        if (size == 0) {
          size = 1;
        }

        elevation = sum / size;
      }
    })
    .then(() => {
      //this is the second request
      getJSON(
        "https://secure.geonames.org/astergdemJSON?lat=" +
        lat +
        "&lng=" +
        long +
        "&username=Elyahu41"
      )
        .then((data) => {
          if (data.astergdem > 0) {
            elevations.push(data.astergdem);
          }
          count++;
          if (count == 3) {
            for (var i = 0; i < elevations.length; i++) {
              sum += elevations[i];
            }

            var size = elevations.length;

            if (size == 0) {
              size = 1;
            }

            elevation = sum / size;
          }
        })
        .then(() => {
          //this is the third request
          getJSON(
            "https://secure.geonames.org/gtopo30JSON?lat=" +
            lat +
            "&lng=" +
            long +
            "&username=Elyahu41"
          )
            .then((data) => {
              if (data.gtopo30 > 0) {
                elevations.push(data.gtopo30);
              }
              count++;
              if (count == 3) {
                for (var i = 0; i < elevations.length; i++) {
                  sum += elevations[i];
                }

                var size = elevations.length;

                if (size == 0) {
                  size = 1;
                }

                elevation = sum / size;
              }
            })
            .then(() => {
              openCalendarWithLocationInfo();
            });
        });
    });
}

function openCalendarWithLocationInfo() {
  var urlWithLocationInfo =
    "calendar.html?locationName=" +
    locationName +
    "&lat=" +
    lat +
    "&long=" +
    long +
    "&elevation=" +
    elevation +
    "&timeZone=" +
    timezone;
  window.location.href = urlWithLocationInfo;
}
