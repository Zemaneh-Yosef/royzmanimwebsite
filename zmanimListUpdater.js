var locationName = "";
var lat = 0;
var long = 0;
var elevation = 0;
var timezone = "";
var geoLocation = null;
var zmanimCalendar = null;
var jewishCalendar = new KosherZmanim.JewishCalendar();
jewishCalendar.setUseModernHolidays(true);
var hebrewFormatter = null;
var zmanimFormatter = new KosherZmanim.ZmanimFormatter();
zmanimFormatter.setTimeFormat(KosherZmanim.ZmanimFormatter.SEXAGESIMAL_FORMAT);
var isShabbatMode = false;
var showSeconds = false;
var nextUpcomingZman = null;
var initAlreadyCalledOnceBefore = false;
//end of global variables

//get the location details from the query string and create the zmanim calendar
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
locationName = urlParams.get("locationName");
lat = parseFloat(urlParams.get("lat"));
long = parseFloat(urlParams.get("long"));
elevation = parseFloat(urlParams.get("elevation"));
if (isNaN(elevation)) {
  elevation = 0;
}
timezone = urlParams.get("timeZone");
hebrewFormatter = new KosherZmanim.HebrewDateFormatter(timezone);
hebrewFormatter.setHebrewFormat(true);
if (isNaN(lat) && isNaN(long)) {
  getLocation();
}
var geoLocation = new KosherZmanim.GeoLocation(
  locationName,
  lat,
  long,
  elevation,
  timezone
);

if (timezone == "Asia/Jerusalem") {
  //if the timezone is Asia/Jerusalem, then the location is probably very close to the Israel or in Israel, so we set the jewish calendar to inIsrael mode.
  //What we really should do is confirm with the user if they are in Israel or not. We'll leave that for another day.
  jewishCalendar.setInIsrael(true);
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setLatLong, showError);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function setLatLong(position) {
  locationName = getJSON(
    "https://secure.geonames.org/findNearbyPlaceNameJSON?lat=" +
    position.coords.latitude +
    "&lng=" +
    position.coords.longitude +
    "&username=Elyahu41"
  ).then((data) => {
    locationName =
      data["geonames"][0]["name"] +
      ", " +
      data["geonames"][0]["adminName1"] +
      ", " +
      data["geonames"][0]["countryName"];
  });
  lat = position.coords.latitude;
  long = position.coords.longitude;
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  getAverageElevation(lat, long) | 0;
}

function showError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      alert("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      alert("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred.");
      break;
  }
}

function getAverageElevation(lat, long) {
  var sum = 0;
  var count = 0;
  var elevations = [];

  //we make 3 JSON requests to get the elevation data from the 3 different sources on geonames.org and we average the results
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
              geoLocation = new KosherZmanim.GeoLocation(
                locationName,
                lat,
                long,
                elevation,
                timezone
              );
              init();
              updateZmanimList();
            });
        });
    });
}

const getJSON = async (url) => {
  const response = await fetch(url);
  return (data = response.json()); // get JSON from the response
};

class ROZmanim extends KosherZmanim.ComplexZmanimCalendar {
  //custom zmanim class, RO stands for Rabbi Ovadia
  constructor(geoLocation) {
    super(geoLocation);
    this.setCandleLightingOffset(20);
    this.setUseElevation(true);
  }

  getEarliestTalitAndTefilin() {
    var shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
    var dakahZmanit = shaahZmanit / 60;
    return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
      this.getAlos72Zmanis(),
      6 * dakahZmanit
    );
  }

  //TODO Netz

  getSofZmanBiurChametzMGA() {
    var shaahZmanit = this.getTemporalHour(
      this.getAlos72Zmanis(),
      this.getTzais72Zmanis()
    );
    return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
      this.getAlos72Zmanis(),
      shaahZmanit * 5
    );
  }

  getPlagHamincha() {
    var shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
    var dakahZmanit = shaahZmanit / 60;
    return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
      this.getTzait(),
      -(shaahZmanit + 15 * dakahZmanit)
    );
  }

  getCandleLighting() {
    return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
      this.getElevationAdjustedSunset(),
      -(this.getCandleLightingOffset() * 60_000)
    );
  }

  getTzait() {
    var shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
    var dakahZmanit = shaahZmanit / 60;
    return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
      this.getElevationAdjustedSunset(),
      13 * dakahZmanit + dakahZmanit / 2
    );
  }

  getTzaitTaanit() {
    return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
      this.getElevationAdjustedSunset(),
      20 * 60_000
    );
  }

  getTzaitTaanitLChumra() {
    return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
      this.getElevationAdjustedSunset(),
      30 * 60_000
    );
  }
}

function init() {
  //initializes the zmanim calendar and anythign else that needs to be initialized when the page loads and updates the zmanim list. This function is called at the end of the script
  zmanimCalendar = new ROZmanim(geoLocation);
  if (initAlreadyCalledOnceBefore) {
    updateZmanimList();
    return;
  }
  document.getElementById("LocationName").innerHTML = locationName;
  if (document.getElementById("LocationName").innerHTML == "") {
    document.getElementById("LocationName").innerHTML =
      "No Location Name Provided";
  }
  document.getElementById("shabbatModeBanner").addEventListener("click", () => {
    document.getElementById("shabbatModeBanner").style.display = "none";
  });
  initAlreadyCalledOnceBefore = true;
  var zmanimLanguage = localStorage.getItem("zmanimLanguage");
  if (zmanimLanguage == "TranslatedEnglish") {
    isZmanimInHebrew = false;
    isZmanimInTranslatedEnglish = true;
  } else if (zmanimLanguage == "Hebrew") {
    isZmanimInHebrew = true;
    isZmanimInTranslatedEnglish = false;
  } else {
    isZmanimInHebrew = false;
    isZmanimInTranslatedEnglish = false;
  }
  setButtonsState(isZmanimInHebrew, isZmanimInTranslatedEnglish);
  initLanguageButtons();
  setupButtons();
  setNextUpcomingZman();
  updateZmanimList(); //Note: if there are no parameters, this method will crash because there is no timezone set. However, it will be recalled in the getJson method
}

function setupButtons() {
  var shabbatModeButton = document.getElementById("shabbatMode");
  shabbatModeButton.addEventListener("click", function () {
    if (isShabbatMode) {
      shabbatModeButton.innerHTML = "Shabbat Mode";
    } else {
      shabbatModeButton.innerHTML = "Undo Shabbat Mode";
    }
    shabbatMode();
  });
  var isShowSeconds = localStorage.getItem("isShowSeconds");
  if (isShowSeconds == "true") {
    showSeconds = true;
  } else {
    showSeconds = false;
  }
  var showSecondsButton = document.getElementById("showSeconds");
  if (showSeconds) {
    showSecondsButton.innerHTML = "Hide Seconds";
  } else {
    showSecondsButton.innerHTML = "Show Seconds";
  }
  showSecondsButton.addEventListener("click", function () {
    showSeconds = !showSeconds;
    if (showSeconds) {
      showSecondsButton.innerHTML = "Hide Seconds";
      updateZmanimList();
    } else {
      showSecondsButton.innerHTML = "Show Seconds";
    }
    updateZmanimList();
    localStorage.setItem("isShowSeconds", showSeconds);
  });
  var darkModeButton = document.getElementById("darkMode");
  var isDarkMode = localStorage.getItem("isDarkMode");
  if (isDarkMode == "true") {
    toggleDarkMode();
    darkModeButton.innerHTML =
      "Light Mode&nbsp;<i class='fas fa-lightbulb'></i>";
  }
  darkModeButton.addEventListener("click", function () {
    toggleDarkMode();
    var isDarkMode = localStorage.getItem("isDarkMode");
    if (isDarkMode == "false") {
      darkModeButton.innerHTML =
        "Light Mode&nbsp;<i class='fas fa-lightbulb'></i>";
      isDarkMode = "true";
    } else {
      darkModeButton.innerHTML = "Dark Mode&nbsp;<i class='fas fa-moon'></i>";
      isDarkMode = "false";
    }
    localStorage.setItem("isDarkMode", isDarkMode);
  });
  var useElevationButton = document.getElementById("useElevation");
  var isUseElevation = localStorage.getItem("isUseElevation");
  if (isUseElevation == "true" || isUseElevation == null) {
    //by default we want to use elevation
    zmanimCalendar.setUseElevation(true);
    useElevationButton.innerHTML = "No Elevation";
  } else {
    zmanimCalendar.setUseElevation(false);
    useElevationButton.innerHTML = "Use Elevation";
  }
  useElevationButton.addEventListener("click", function () {
    if (zmanimCalendar.isUseElevation()) {
      //if it is currently using elevation, then we want to turn it off
      zmanimCalendar.setUseElevation(false);
      useElevationButton.innerHTML = "Use Elevation";
    } else {
      // else we want to turn it on
      zmanimCalendar.setUseElevation(true);
      useElevationButton.innerHTML = "No Elevation";
    }
    localStorage.setItem("isUseElevation", zmanimCalendar.isUseElevation());
    setNextUpcomingZman();//this method will update the zmanim list as well
  });
  var showInfoIcon = document.getElementById("showInfoIcons");
  if (localStorage.getItem("showInfoIcon") == "false") {
    showInfoIcon.innerHTML = 'Show&nbsp<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewbox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
    } else {
    showInfoIcon.innerHTML = 'Hide&nbsp<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewbox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
    }
  showInfoIcon.addEventListener("click", function () {
    if (localStorage.getItem("showInfoIcon") == "true") {
    localStorage.setItem("showInfoIcon", "false");
    showInfoIcon.innerHTML = 'Show&nbsp<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewbox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
    } else {
    localStorage.setItem("showInfoIcon", "true");
    showInfoIcon.innerHTML = 'Hide&nbsp<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewbox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
    }
    updateZmanimList();
  });
  updateZmanimList();
}

function initLanguageButtons() {
  var hebrewButton = document.getElementById("hebrewZmanim");
  hebrewButton.addEventListener("click", function () {
    isZmanimInHebrew = true;
    isZmanimInTranslatedEnglish = false;
    setButtonsState(isZmanimInHebrew, isZmanimInTranslatedEnglish);
    localStorage.setItem("zmanimLanguage", "Hebrew");
    updateZmanimList();
  });
  var translatedEnglishButton = document.getElementById("englishZmanim");
  translatedEnglishButton.addEventListener("click", function () {
    isZmanimInHebrew = false;
    isZmanimInTranslatedEnglish = true;
    setButtonsState(isZmanimInHebrew, isZmanimInTranslatedEnglish);
    localStorage.setItem("zmanimLanguage", "TranslatedEnglish");
    updateZmanimList();
  });
  var defaultZmanimButton = document.getElementById("defaultZmanim");
  defaultZmanimButton.addEventListener("click", function () {
    isZmanimInHebrew = false;
    isZmanimInTranslatedEnglish = false;
    setButtonsState(isZmanimInHebrew, isZmanimInTranslatedEnglish);
    localStorage.setItem("zmanimLanguage", "Default");
    updateZmanimList();
  });
}

function updateZmanimList() {
  //common information first, we always skip the first one because it is location name and we already have it set in init()
  var date = document.getElementById("Date");
  date.innerHTML =
    jewishCalendar.getDate().toLocaleString(luxon.DateTime.DATE_FULL) +
    " • " +
    jewishCalendar
      .toString()
      .replace("Teves", "Tevet")
      .replace("Tishrei", "Tishri") +
    "  •  " +
    hebrewFormatter.format(jewishCalendar);

  if (zmanimCalendar.getDate().hasSame(luxon.DateTime.local(), "day")) {
    date.innerHTML = "<strong>" + date.innerHTML + "</strong>";
  }

  var parasha = document.getElementById("Parasha");

  var currentDay = jewishCalendar.getDate(); //save the current day
  var s = nextSaturday(currentDay.toJSDate(), 6); // 6 = saturday
  function nextSaturday(d, dow) {
    d.setDate(d.getDate() + ((dow + (7 - d.getDay())) % 7));
    return d;
  }
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(s));
  if (hebrewFormatter.formatParsha(jewishCalendar) !== "") {
    parasha.innerHTML = hebrewFormatter.formatParsha(jewishCalendar);
  } else {
    parasha.innerHTML = "No Weekly Parasha";
  }
  if (hebrewFormatter.formatSpecialParsha(jewishCalendar) !== "") {
    parasha.innerHTML +=
      " / " + hebrewFormatter.formatSpecialParsha(jewishCalendar);
  }
  jewishCalendar.setDate(currentDay); //reset to current day

  var day = document.getElementById("Day");
  //day of week should show the day of the week in English and Hebrew for example: Sunday / ראשון
  day.innerHTML =
    currentDay.toJSDate().toLocaleDateString("en-US", {
      weekday: "long",
    }) +
    " / " +
    "יום " +
    hebrewFormatter.formatDayOfWeek(jewishCalendar);

  var specialDay = document.getElementById("SpecialDay");
  var specialDayText = getSpecialDay();
  if (specialDayText === "") {
    specialDay.style.display = "none";
  } else {
    specialDay.style.display = "block";
    specialDay.innerHTML = specialDayText;
  }

  var isOkayToListenToMusic = getIsOkayToListenToMusic();
  var music = document.getElementById("Music");
  if (isOkayToListenToMusic) {
    music.style.display = "none";
  } else {
    music.style.display = "block";
    music.innerHTML = "No music";
  }

  var ulchaparatPesha = getUlchaparatPesha();
  var ulchaparat = document.getElementById("Ulchaparat");
  if (ulchaparatPesha === "") {
    ulchaparat.style.display = "none";
  } else {
    ulchaparat.style.display = "block";
    ulchaparat.innerHTML = ulchaparatPesha;
  }

  var chamah = document.getElementById("Chamah");
  if (jewishCalendar.isBirkasHachamah()) {
    chamah.style.display = "block";
    chamah.innerHTML = "Birchat HaChamah is said today";
  } else {
    chamah.style.display = "none";
  }

  var birchatHalevana = document.getElementById("BirchatHalevana");
  var birchatHalevanaText = getIsTonightStartOrEndBirchatLevana();
  if (birchatHalevanaText === "") {
    birchatHalevana.style.display = "none";
  } else {
    birchatHalevana.style.display = "block";
    birchatHalevana.innerHTML = birchatHalevanaText;
  }

  var tachanun = document.getElementById("Tachanun");
  tachanun.innerHTML = getTachanun();

  var hallel = document.getElementById("Hallel");
  var hallelText = getHallel();
  if (hallelText === "") {
    hallel.style.display = "none";
  } else {
    hallel.style.display = "block";
    hallel.innerHTML = hallelText;
  }

  var tekufa = document.getElementById("Tekufa");
  var tekufaToday = getTekufa();
  var tekufaNextDay = getTekufaForNextDay();
  if (
    (tekufaToday === null && tekufaNextDay === null) || //if no tekufa today or tomorrow
    (tekufaToday === null &&
      getTekufaForNextDayAsDate().toJSDate().toLocaleDateString() !==
      currentDay.toJSDate().toLocaleDateString()) || //if no tekufa today but there is one tomorrow and it's not today
    (tekufaNextDay === null &&
      getTekufaAsDate().toJSDate().toLocaleDateString() !==
      currentDay.toJSDate().toLocaleDateString())
  ) {
    //if no tekufa tomorrow but there is one today and it's not today
    tekufa.style.display = "none";
  } else if (
    tekufaToday !== null &&
    getTekufaAsDate().toJSDate().toLocaleDateString() ===
    currentDay.toJSDate().toLocaleDateString()
  ) {
    //if tekufa date is today
    tekufa.style.display = "block";
    tekufa.innerHTML =
      "Tekufa " +
      getTekufaName() +
      " is today at " +
      getTekufaAsDate().toJSDate().toLocaleTimeString();
  } else {
    // if tekufa date is tomorrow but is on the same day as today
    tekufa.style.display = "block";
    tekufa.innerHTML =
      "Tekufa " +
      getTekufaName() +
      " is today at " +
      getTekufaForNextDayAsDate().toJSDate().toLocaleTimeString();
  }

  var shabbatAndChagTimes = document.getElementById("ShabbatAndChagTimes");//not really a zman but an alert for shabbat and chag times
  //zmanim list updated here
  var alot = document.getElementById("Alot");
  var talit = document.getElementById("Talit");
  var sunrise = document.getElementById("Sunrise");
  var latestShmaMGA = document.getElementById("LatestShmaMGA");
  var latestShmaGRA = document.getElementById("LatestShmaGRA");
  var sofZmanAchilatChametz = document.getElementById("SofZmanAchilatChametz");
  var sofZmanBiurChametz = document.getElementById("SofZmanBiurChametz");
  var latestBerachotShmaGRA = document.getElementById("LatestBerachotShmaGRA");
  var chatzot = document.getElementById("Chatzot");
  var minchaGedola = document.getElementById("MinchaGedola");
  var minchaKetana = document.getElementById("MinchaKetana");
  var plag = document.getElementById("Plag");
  var candle = document.getElementById("Candle");
  var sunset = document.getElementById("Sunset");
  var tzeit = document.getElementById("Tzeit");
  var tzeitCandles = document.getElementById("TzeitCandles");
  var tzeitT = document.getElementById("TzeitT");
  var tzeitTL = document.getElementById("TzeitTL");
  var tzaitShabbatChag = document.getElementById("TzeitShabbatChag");
  var rt = document.getElementById("RT");
  var chatzotLayla = document.getElementById("ChatzotLayla");
  var daf = document.getElementById("Daf");
  var dafYerushalmi = document.getElementById("DafYerushalmi");
  var seasonal = document.getElementById("SeasonalPrayers");
  var shaahZmanit = document.getElementById("ShaahZmanit");

  if (!showSeconds) {
    alot.innerHTML =
      "<b>" +
      getAlotString() +
      "</b>" + addInfoIcon("Alot") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getAlos72Zmanis()) +
      zmanimCalendar.getAlos72Zmanis().setZone(timezone).toFormat("h:mm a") +
      "</span>";
    talit.innerHTML =
      "<b>" +
      getTalitTefilinString() +
      "</b>" + addInfoIcon("Talit") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getEarliestTalitAndTefilin()) +
      zmanimCalendar
        .getEarliestTalitAndTefilin()
        .setZone(timezone)
        .toFormat("h:mm a") +
      "</span>";
    sunrise.innerHTML =
      "<b>" +
      getMishorSunriseString() +
      "</b>" + addInfoIcon("Sunrise") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getSeaLevelSunrise()) +
      zmanimCalendar.getSeaLevelSunrise().setZone(timezone).toFormat("h:mm a") +
      "</span>";
    latestShmaMGA.innerHTML =
      "<b>" +
      getLatestShmaMGAString() +
      "</b>" + addInfoIcon("LatestShmaMGA") +
      "<span>" +
      addArrowIfNextUpcomingZman(
        zmanimCalendar.getSofZmanShmaMGA72MinutesZmanis()
      ) +
      zmanimCalendar
        .getSofZmanShmaMGA72MinutesZmanis()
        .setZone(timezone)
        .toFormat("h:mm a") +
      "</span>";
    latestShmaGRA.innerHTML =
      "<b>" +
      getLatestShmaGRAString() +
      "</b>" + addInfoIcon("LatestShmaGRA") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanShmaGRA()) +
      zmanimCalendar.getSofZmanShmaGRA().setZone(timezone).toFormat("h:mm a") +
      "</span>";
    if (
      jewishCalendar.getYomTovIndex() ===
      KosherZmanim.JewishCalendar.EREV_PESACH
    ) {
      sofZmanAchilatChametz.style.display = "block";
      sofZmanBiurChametz.style.display = "block";
      sofZmanAchilatChametz.innerHTML =
        "<b>" +
        getSofZmanAchilatChametzString() +
        "</b>" + addInfoIcon("SofZmanAchilatChametz") +
        "<span>" +
        addArrowIfNextUpcomingZman(
          zmanimCalendar.getSofZmanTfilaMGA72MinutesZmanis()
        ) +
        zmanimCalendar
          .getSofZmanTfilaMGA72MinutesZmanis()
          .setZone(timezone)
          .toFormat("h:mm a") +
        "</span>";
      latestBerachotShmaGRA.innerHTML =
        "<b>" +
        getLatestBerachotShmaGRAString() +
        "</b>" + addInfoIcon("LatestBerachotShmaGRA") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanTfilaGRA()) +
        zmanimCalendar
          .getSofZmanTfilaGRA()
          .setZone(timezone)
          .toFormat("h:mm a") +
        "</span>";
      sofZmanBiurChametz.innerHTML =
        "<b>" +
        getSofZmanBiurChametzString() +
        "</b>" + addInfoIcon("SofZmanBiurChametz") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanBiurChametzMGA()) +
        zmanimCalendar
          .getSofZmanBiurChametzMGA()
          .setZone(timezone)
          .toFormat("h:mm a") +
        "</span>";
    } else {
      sofZmanAchilatChametz.style.display = "none";
      sofZmanBiurChametz.style.display = "none";
      latestBerachotShmaGRA.innerHTML =
        "<b>" +
        getLatestBerachotShmaGRAString() +
        "</b>" + addInfoIcon("LatestBerachotShmaGRA") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanTfilaGRA()) +
        zmanimCalendar
          .getSofZmanTfilaGRA()
          .setZone(timezone)
          .toFormat("h:mm a") +
        "</span>";
    }

    chatzot.innerHTML =
      "<b>" +
      getChatzotString() +
      "</b>" + addInfoIcon("Chatzot") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getChatzos()) +
      zmanimCalendar.getChatzos().setZone(timezone).toFormat("h:mm a") +
      "</span>";
    minchaGedola.innerHTML =
      "<b>" +
      getMinchaGedolaString() +
      "</b>" + addInfoIcon("MinchaGedola") +
      "<span>" +
      addArrowIfNextUpcomingZman(
        zmanimCalendar.getMinchaGedolaGreaterThan30()
      ) +
      zmanimCalendar
        .getMinchaGedolaGreaterThan30()
        .setZone(timezone)
        .toFormat("h:mm a") +
      "</span>";
    minchaKetana.innerHTML =
      "<b>" +
      getMinchaKetanaString() +
      "</b>" + addInfoIcon("MinchaKetana") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getMinchaKetana()) +
      zmanimCalendar.getMinchaKetana().setZone(timezone).toFormat("h:mm a") +
      "</span>";
    plag.innerHTML =
      "<b>" +
      getPlagString() +
      "</b>" + addInfoIcon("Plag") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getPlagHamincha()) +
      zmanimCalendar.getPlagHamincha().setZone(timezone).toFormat("h:mm a") +
      "</span>";

    if (
      jewishCalendar.hasCandleLighting() &&
      jewishCalendar.isAssurBemelacha()
    ) {
      if (jewishCalendar.getDayOfWeek() !== 6) {
        tzeitCandles.style.display = "block";
        tzeitCandles.innerHTML =
          "<b>" +
          getCandleLightingString() +
          "</b>" + addInfoIcon("CandleLighting") +
          "<span>" +
          addArrowIfNextUpcomingZman(zmanimCalendar.getTzait()) +
          zmanimCalendar.getTzait().setZone(timezone).toFormat("h:mm a") +
          "</span>";
      } else {
        tzeitCandles.style.display = "none";
      }
    } else {
      tzeitCandles.style.display = "none";
    }
    if (
      (jewishCalendar.hasCandleLighting() &&
        !jewishCalendar.isAssurBemelacha()) ||
      jewishCalendar.getDayOfWeek() === 6
    ) {
      var cookieForCLT = getCookie("candleLightingTime");
      if (cookieForCLT) {
        zmanimCalendar.setCandleLightingOffset(parseInt(cookieForCLT));
      } else {
        zmanimCalendar.setCandleLightingOffset(20); //default to 20 minutes
      }
      shabbatAndChagTimes.style.display = "block";
      var alertString = "";
      if (isZmanimInHebrew) {
        alertString = "<b>" + zmanimCalendar.getCandleLighting().setZone(timezone).toFormat("h:mm a") + " : " + getCandleLightingString() + "<hr>";
      } else {
        alertString = "<b>" + getCandleLightingString() + " : " + zmanimCalendar.getCandleLighting().setZone(timezone).toFormat("h:mm a") + "<hr>";
      }
      var backup = zmanimCalendar.getDate().toJSDate();
      var nextDay = zmanimCalendar.getDate().toJSDate();
      nextDay.setDate(nextDay.getDate() + 1);//move to next day
      jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
      while (jewishCalendar.isAssurBemelacha()) {//while the day is assur bemelacha,
      nextDay.setDate(nextDay.getDate() + 1);//move to next day
      jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
      if (!jewishCalendar.isAssurBemelacha()) {// if the day is not assur bemelacha, we moved to the day after shabbat/yom tov
        nextDay.setDate(nextDay.getDate() - 1);//go back to the last day of shabbat/yom tov
      }
      }
      jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
      zmanimCalendar.setDate(nextDay);

      if (isZmanimInHebrew) {
        alertString += zmanimCalendar.getTzaisAteretTorah().setZone(timezone).toFormat("h:mm a") + " : " + getTzaitShabbatChagString(jewishCalendar)
      } else {
        alertString += getTzaitShabbatChagString(jewishCalendar) + " : " + zmanimCalendar.getTzaisAteretTorah().setZone(timezone).toFormat("h:mm a")
        + "</b>";
      }

      jewishCalendar.setDate(luxon.DateTime.fromJSDate(backup));
      zmanimCalendar.setDate(backup);

      shabbatAndChagTimes.innerHTML = alertString;

      candle.style.display = "block";
      candle.innerHTML =
        "<b>" +
        getCandleLightingString() +
        " (" +
        zmanimCalendar.getCandleLightingOffset() +
        ")" +
        "</b>" + addInfoIcon("CandleLighting") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getCandleLighting()) +
        zmanimCalendar
          .getCandleLighting()
          .setZone(timezone)
          .toFormat("h:mm a") +
        "</span>";
      candle.onclick = function () {
        // add on click event to the candle lighting time to save the time to a cookie
        if (document.getElementById("candleMinutes") == null) {
          candle.innerHTML =
            "<b>" +
            getCandleLightingString() +
            ' (<input type="number" id="candleMinutes" onchange="saveCandleLightingSetting()"/>)' +//TODO we need to remove the input field after the user clicks on something else
            "</b>" + addInfoIcon("CandleLighting") +
            "<span>" +
            addArrowIfNextUpcomingZman(zmanimCalendar.getCandleLighting()) +
            zmanimCalendar
              .getCandleLighting()
              .setZone(timezone)
              .toFormat("h:mm a") +
            "</span>";
        }
      };
    } else {
      shabbatAndChagTimes.style.display = "none";
      candle.style.display = "none";
    }

    sunset.innerHTML =
      "<b>" +
      getSunsetString() +
      "</b>" + addInfoIcon("Sunset") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getElevationAdjustedSunset()) +
      zmanimCalendar.getElevationAdjustedSunset().setZone(timezone).toFormat("h:mm a") +
      "</span>";
    tzeit.innerHTML =
      "<b>" +
      getTzeitString() +
      "</b>" + addInfoIcon("Tzeit") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getTzait()) +
      zmanimCalendar.getTzait().setZone(timezone).toFormat("h:mm a") +
      "</span>";

    if (
      jewishCalendar.isTaanis() &&
      !(
        jewishCalendar.getYomTovIndex() ===
        KosherZmanim.JewishCalendar.YOM_KIPPUR
      )
    ) {
      tzeitT.style.display = "block";
      tzeitTL.style.display = "block";
      tzeitT.innerHTML =
        "<b>" +
        getTzaitTaanitString() +
        "</b>" + addInfoIcon("TzaitTaanit") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getTzaitTaanit()) +
        zmanimCalendar.getTzaitTaanit().setZone(timezone).toFormat("h:mm a") +
        "</span>";
      tzeitTL.innerHTML =
        "<b>" +
        getTzaitTaanitLChumraString() +
        "</b>" + addInfoIcon("TzaitTaanitLChumra") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getTzaitTaanitLChumra()) +
        zmanimCalendar
          .getTzaitTaanitLChumra()
          .setZone(timezone)
          .toFormat("h:mm a") +
        "</span>";
    } else {
      tzeitT.style.display = "none";
      tzeitTL.style.display = "none";
    }

    if (
      jewishCalendar.isAssurBemelacha() &&
      !jewishCalendar.hasCandleLighting()
    ) {
      var cookieForTSC = getCookie("tzeitShabbatTime");
      if (cookieForTSC) {
        zmanimCalendar.setAteretTorahSunsetOffset(parseInt(cookieForTSC));
      } else {
        zmanimCalendar.setAteretTorahSunsetOffset(40); //default to 40 minutes
      }
      tzaitShabbatChag.style.display = "block";
      tzaitShabbatChag.innerHTML =
        "<b>" +
        getTzaitShabbatChagString(jewishCalendar) +
        " (" +
        zmanimCalendar.getAteretTorahSunsetOffset() +
        ") " +
        "</b>" + addInfoIcon("TzaitShabbat") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getTzaisAteretTorah()) +
        zmanimCalendar
          .getTzaisAteretTorah()
          .setZone(timezone)
          .toFormat("h:mm a") +
        "</span>";

      tzaitShabbatChag.onclick = function () {
        // add on click event to the tzeit shabbat time to save the time to a cookie
        if (document.getElementById("tzeitShabbatMinutes") == null) {
          tzaitShabbatChag.innerHTML =
            "<b>" +
            getTzaitShabbatChagString(jewishCalendar) +
            ' (<input type="number" id="tzeitShabbatMinutes" onchange="saveTzeitShabbatSetting()"/>): ' +
            "</b>" + addInfoIcon("TzaitShabbat") +
            "<span>" +
            addArrowIfNextUpcomingZman(zmanimCalendar.getTzaisAteretTorah()) +
            zmanimCalendar
              .getTzaisAteretTorah()
              .setZone(timezone)
              .toFormat("h:mm a") +
            "</span>";
        }
      };
    } else {
      tzaitShabbatChag.style.display = "none";
    }

    rt.innerHTML =
      "<b>" +
      getRabbeinuTamString() +
      "</b>" + addInfoIcon("RabbeinuTam") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getTzais72Zmanis()) +
      zmanimCalendar
        .getTzais72Zmanis()
        .set({ second: 0 })
        .plus({ minutes: 1 })
        .setZone(timezone)
        .toFormat("h:mm a") +
      "</span>";
    chatzotLayla.innerHTML =
      "<b>" +
      getChatzotLaylaString() +
      "</b>" + addInfoIcon("ChatzotLayla") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getSolarMidnight()) +
      zmanimCalendar.getSolarMidnight().setZone(timezone).toFormat("h:mm a") +
      "</span>";
  } else {
    // if the user wants to see the seconds
    alot.innerHTML =
      "<b>" +
      getAlotString() +
      "</b>" + addInfoIcon("Alot") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getAlos72Zmanis()) +
      zmanimCalendar.getAlos72Zmanis().setZone(timezone).toFormat("h:mm:ss a") +
      "</span>";
    talit.innerHTML =
      "<b>" +
      getTalitTefilinString() +
      "</b>" + addInfoIcon("TalitTefilin") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getEarliestTalitAndTefilin()) +
      zmanimCalendar
        .getEarliestTalitAndTefilin()
        .setZone(timezone)
        .toFormat("h:mm:ss a") +
      "</span>";
    sunrise.innerHTML =
      "<b>" +
      getMishorSunriseString() +
      "</b>" + addInfoIcon("Sunrise") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getSeaLevelSunrise()) +
      zmanimCalendar
        .getSeaLevelSunrise()
        .setZone(timezone)
        .toFormat("h:mm:ss a") +
      "</span>";
    latestShmaMGA.innerHTML =
      "<b>" +
      getLatestShmaMGAString() +
      "</b>" + addInfoIcon("LatestShmaMGA") +
      "<span>" +
      addArrowIfNextUpcomingZman(
        zmanimCalendar.getSofZmanShmaMGA72MinutesZmanis()
      ) +
      zmanimCalendar
        .getSofZmanShmaMGA72MinutesZmanis()
        .setZone(timezone)
        .toFormat("h:mm:ss a") +
      "</span>";
    latestShmaGRA.innerHTML =
      "<b>" +
      getLatestShmaGRAString() +
      "</b>" + addInfoIcon("LatestShmaGRA") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanShmaGRA()) +
      zmanimCalendar
        .getSofZmanShmaGRA()
        .setZone(timezone)
        .toFormat("h:mm:ss a") +
      "</span>";

    if (
      jewishCalendar.getYomTovIndex() ===
      KosherZmanim.JewishCalendar.EREV_PESACH
    ) {
      sofZmanAchilatChametz.style.display = "block";
      sofZmanBiurChametz.style.display = "block";
      sofZmanAchilatChametz.innerHTML =
        "<b>" +
        getSofZmanAchilatChametzString() +
        "</b>" + addInfoIcon("SofZmanAchilatChametz") +
        "<span>" +
        addArrowIfNextUpcomingZman(
          zmanimCalendar.getSofZmanTfilaMGA72MinutesZmanis()
        ) +
        zmanimCalendar
          .getSofZmanTfilaMGA72MinutesZmanis()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";
      latestBerachotShmaGRA.innerHTML =
        "<b>" +
        getLatestBerachotShmaGRAString() +
        "</b>" + addInfoIcon("LatestBerachotShmaGRA") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanTfilaGRA()) +
        zmanimCalendar
          .getSofZmanTfilaGRA()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";
      sofZmanBiurChametz.innerHTML =
        "<b>" +
        getSofZmanBiurChametzString() +
        "</b>" + addInfoIcon("SofZmanBiurChametz") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanBiurChametzMGA()) +
        zmanimCalendar
          .getSofZmanBiurChametzMGA()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";
    } else {
      sofZmanAchilatChametz.style.display = "none";
      sofZmanBiurChametz.style.display = "none";
      latestBerachotShmaGRA.innerHTML =
        "<b>" +
        getLatestBerachotShmaGRAString() +
        "</b>" + addInfoIcon("LatestBerachotShmaGRA") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getSofZmanTfilaGRA()) +
        zmanimCalendar
          .getSofZmanTfilaGRA()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";
    }

    chatzot.innerHTML =
      "<b>" +
      getChatzotString() +
      "</b>" + addInfoIcon("Chatzot") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getChatzos()) +
      zmanimCalendar.getChatzos().setZone(timezone).toFormat("h:mm:ss a") +
      "</span>";
    minchaGedola.innerHTML =
      "<b>" +
      getMinchaGedolaString() +
      "</b>" + addInfoIcon("MinchaGedola") +
      "<span>" +
      addArrowIfNextUpcomingZman(
        zmanimCalendar.getMinchaGedolaGreaterThan30()
      ) +
      zmanimCalendar
        .getMinchaGedolaGreaterThan30()
        .setZone(timezone)
        .toFormat("h:mm:ss a") +
      "</span>";
    minchaKetana.innerHTML =
      "<b>" +
      getMinchaKetanaString() +
      "</b>" + addInfoIcon("MinchaKetana") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getMinchaKetana()) +
      zmanimCalendar.getMinchaKetana().setZone(timezone).toFormat("h:mm:ss a") +
      "</span>";
    plag.innerHTML =
      "<b>" +
      getPlagString() +
      "</b>" + addInfoIcon("Plag") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getPlagHamincha()) +
      zmanimCalendar.getPlagHamincha().setZone(timezone).toFormat("h:mm:ss a") +
      "</span>";
    if (
      jewishCalendar.hasCandleLighting() &&
      jewishCalendar.isAssurBemelacha()
    ) {
      if (jewishCalendar.getDayOfWeek() !== 6) {
        tzeitCandles.style.display = "block";
        tzeitCandles.innerHTML =
          "<b>" +
          getCandleLightingString() +
          "</b>" + addInfoIcon("CandleLighting") +
          "<span>" +
          addArrowIfNextUpcomingZman(zmanimCalendar.getTzait()) +
        zmanimCalendar.getTzait().setZone(timezone).toFormat("h:mm:ss a") + "</span>";
      } else {
        tzeitCandles.style.display = "none";
      }
    } else {
      tzeitCandles.style.display = "none";
    }
    if (
      (jewishCalendar.hasCandleLighting() &&
        !jewishCalendar.isAssurBemelacha()) ||
      jewishCalendar.getDayOfWeek() === 6
    ) {
      var cookieForCLT = getCookie("candleLightingTime");
      if (cookieForCLT) {
        zmanimCalendar.setCandleLightingOffset(parseInt(cookieForCLT));
      } else {
        zmanimCalendar.setCandleLightingOffset(20); //default to 20 minutes
      }
      shabbatAndChagTimes.style.display = "block";
      var alertString = "";
      if (isZmanimInHebrew) {
        alertString = "<b>" + zmanimCalendar.getCandleLighting().setZone(timezone).toFormat("h:mm a") + " : " + getCandleLightingString() + "<hr>";
      } else {
        alertString = "<b>" + getCandleLightingString() + " : " + zmanimCalendar.getCandleLighting().setZone(timezone).toFormat("h:mm a") + "<hr>";
      }
      var backup = zmanimCalendar.getDate().toJSDate();
      var nextDay = zmanimCalendar.getDate().toJSDate();
      nextDay.setDate(nextDay.getDate() + 1);//move to next day
      jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
      while (jewishCalendar.isAssurBemelacha()) {//while the day is assur bemelacha,
      nextDay.setDate(nextDay.getDate() + 1);//move to next day
      jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
      if (!jewishCalendar.isAssurBemelacha()) {// if the day is not assur bemelacha, we moved to the day after shabbat/yom tov
        nextDay.setDate(nextDay.getDate() - 1);//go back to the last day of shabbat/yom tov
      }
      }
      jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
      zmanimCalendar.setDate(nextDay);

      if (isZmanimInHebrew) {
        alertString += zmanimCalendar.getTzaisAteretTorah().setZone(timezone).toFormat("h:mm a") + " : " + getTzaitShabbatChagString(jewishCalendar)
      } else {
        alertString += getTzaitShabbatChagString(jewishCalendar) + " : " + zmanimCalendar.getTzaisAteretTorah().setZone(timezone).toFormat("h:mm a")
        + "</b>";
      }

      jewishCalendar.setDate(luxon.DateTime.fromJSDate(backup));
      zmanimCalendar.setDate(backup);

      shabbatAndChagTimes.innerHTML = alertString;

      candle.style.display = "block";
      candle.innerHTML =
        "<b>" +
        getCandleLightingString() +
        " (" +
        zmanimCalendar.getCandleLightingOffset() +
        ")" +
        "</b>" + addInfoIcon("CandleLighting") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getCandleLighting()) +
        zmanimCalendar
          .getCandleLighting()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";
      // add on click event to the candle lighting time to save the time to a cookie
      candle.onclick = function () {
        if (document.getElementById("candleMinutes") == null) {
          //if the input element doesn't exist yet then add it to the webpage
          candle.innerHTML =
            "<b>" +
            getCandleLightingString() +
            "</b>" + addInfoIcon("CandleLighting") +
            ' (<input type="number" id="candleMinutes" onchange="saveCandleLightingSetting()"/>) ' +
            "</b>" +
            "<span>" +
            addArrowIfNextUpcomingZman(zmanimCalendar.getCandleLighting()) +
            zmanimCalendar
              .getCandleLighting()
              .setZone(timezone)
              .toFormat("h:mm:ss a") +
            "</span>";
        }
      };
    } else {
      shabbatAndChagTimes.style.display = "none";
      candle.style.display = "none";
    }

    sunset.innerHTML =
      "<b>" +
      getSunsetString() +
      "</b>" + addInfoIcon("Sunset") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getElevationAdjustedSunset()) +
      zmanimCalendar.getElevationAdjustedSunset().setZone(timezone).toFormat("h:mm:ss a") +
      "</span>";
    tzeit.innerHTML =
      "<b>" +
      getTzeitString() +
      "</b>" + addInfoIcon("Tzeit") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getTzait()) +
      zmanimCalendar.getTzait().setZone(timezone).toFormat("h:mm:ss a") +
      "</span>";

    if (
      jewishCalendar.isTaanis() &&
      !(
        jewishCalendar.getYomTovIndex() ===
        KosherZmanim.JewishCalendar.YOM_KIPPUR
      )
    ) {
      tzeitT.style.display = "block";
      tzeitTL.style.display = "block";
      tzeitT.innerHTML =
        "<b>" +
        getTzaitTaanitString() +
        "</b>" + addInfoIcon("TzaitTaanit") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getTzaitTaanit()) +
        zmanimCalendar
          .getTzaitTaanit()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";
      tzeitTL.innerHTML =
        "<b>" +
        getTzaitTaanitLChumraString() +
        "</b>" + addInfoIcon("TzaitTaanitLChumra") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getTzaitTaanitLChumra()) +
        zmanimCalendar
          .getTzaitTaanitLChumra()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";
    } else {
      tzeitT.style.display = "none";
      tzeitTL.style.display = "none";
    }

    if (
      jewishCalendar.isAssurBemelacha() &&
      !jewishCalendar.hasCandleLighting()
    ) {
      var cookieForTSC = getCookie("tzeitShabbatTime");
      if (cookieForTSC) {
        zmanimCalendar.setAteretTorahSunsetOffset(parseInt(cookieForTSC));
      } else {
        zmanimCalendar.setAteretTorahSunsetOffset(40); //default to 40 minutes
      }
      tzaitShabbatChag.style.display = "block";
      tzaitShabbatChag.innerHTML =
        "<b>" +
        getTzaitShabbatChagString(jewishCalendar) +
        " (" +
        zmanimCalendar.getAteretTorahSunsetOffset() +
        ") " +
        "</b>" + addInfoIcon("TzaitShabbat") +
        "<span>" +
        addArrowIfNextUpcomingZman(zmanimCalendar.getTzaisAteretTorah()) +
        zmanimCalendar
          .getTzaisAteretTorah()
          .setZone(timezone)
          .toFormat("h:mm:ss a") +
        "</span>";

      tzaitShabbatChag.onclick = function () {
        // add on click event to the tzeit shabbat time to save the time to a cookie
        if (document.getElementById("tzeitShabbatMinutes") == null) {
          tzaitShabbatChag.innerHTML =
            "<b>" +
            getTzaitShabbatChagString(jewishCalendar) +
            "</b>" +
            ' (<input type="number" id="tzeitShabbatMinutes" onchange="saveTzeitShabbatSetting()"/>) ' +
            "</b>" + addInfoIcon("TzaitShabbat") +
            "<span>" +
            addArrowIfNextUpcomingZman(zmanimCalendar.getTzaisAteretTorah()) +
            zmanimCalendar
              .getTzaisAteretTorah()
              .setZone(timezone)
              .toFormat("h:mm:ss a") +
            "</span>";
        }
      };
    } else {
      tzaitShabbatChag.style.display = "none";
    }

    rt.innerHTML =
      "<b>" +
      getRabbeinuTamString() +
      "</b>" + addInfoIcon("RabbeinuTam") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getTzais72Zmanis()) +
      zmanimCalendar
        .getTzais72Zmanis()
        .setZone(timezone)
        .toFormat("h:mm:ss a") +
      "</span>";
    chatzotLayla.innerHTML =
      "<b>" +
      getChatzotLaylaString() +
      "</b>" + addInfoIcon("ChatzotLayla") +
      "<span>" +
      addArrowIfNextUpcomingZman(zmanimCalendar.getSolarMidnight()) +
      zmanimCalendar
        .getSolarMidnight()
        .setZone(timezone)
        .toFormat("h:mm:ss a") +
      "</span>";
  }
  var dafObject = KosherZmanim.YomiCalculator.getDafYomiBavli(jewishCalendar);
  daf.innerHTML =
    "Daf Yomi: " +
    dafObject.getMasechta() +
    " " +
    numberToHebrew(dafObject.getDaf());

  var dafYerushalmiObject =
    KosherZmanim.YerushalmiYomiCalculator.getDafYomiYerushalmi(jewishCalendar);
  if (dafYerushalmiObject.getDaf() == 0) {
    dafYerushalmi.innerHTML = "No Daf Yomi Yerushalmi today";
  } else {
    dafYerushalmi.innerHTML =
      "Daf Yomi Yerushalmi: " +
      dafYerushalmiObject.getYerushalmiMasechta() +
      " " +
      numberToHebrew(dafYerushalmiObject.getDaf());
  }

  seasonal.innerHTML = getSeasonalPrayers();

  shaahZmanit.innerHTML = getShaahZmanits();
} // end of zmanim list update

function addInfoIcon(zman) {
  if (localStorage.getItem("showInfoIcon") == "false") {
    return "";
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" fill="currentColor" class="bi bi-info-circle" onclick="' + zman + 'Dialog' + '()" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
}

function forwardOneDay() {
  var nextDay = zmanimCalendar.getDate().toJSDate();
  nextDay.setDate(nextDay.getDate() + 1);
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
  zmanimCalendar.setDate(nextDay);
  updateZmanimList();
}

function backwardOneDay() {
  var previousDay = zmanimCalendar.getDate().toJSDate();
  previousDay.setDate(previousDay.getDate() - 1);
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(previousDay));
  zmanimCalendar.setDate(previousDay);
  updateZmanimList();
}

function updateDate() {
  var date = document.getElementById("date");
  var dateObject = luxon.DateTime.fromFormat(date.value, "MM/dd/yyyy");
  jewishCalendar.setDate(dateObject);
  zmanimCalendar.setDate(dateObject);
  updateZmanimList();
}

function getSpecialDay() {
  var result = [];
  var yomTovOfToday = getYomTov(jewishCalendar);
  var yomTovOfNextDay = getYomTovForNextDay();

  if (yomTovOfToday === "" && yomTovOfNextDay === "") {
    //if no yom tov today or tomorrow, do nothing to the result array
  } else if (yomTovOfToday === "" && !yomTovOfNextDay.startsWith("Erev")) {
    //if next day has yom tov
    result.push("Erev " + yomTovOfNextDay);
  } else if (
    !(yomTovOfNextDay === "") &&
    !yomTovOfNextDay.startsWith("Erev") &&
    !yomTovOfToday.endsWith(yomTovOfNextDay)
  ) {
    //if today and the next day have yom tov
    result.push(yomTovOfToday + " / Erev " + yomTovOfNextDay);
  } else {
    result.push(yomTovOfToday);
  }
  result = addTaanitBechorot(result);
  result = addRoshChodesh(result);
  result = addDayOfOmer(result);
  result = addDayOfChanukah(result);
  return result.join(" / ");
}

function addTaanitBechorot(result) {
  if (tomorrowIsTaanitBechorot()) {
    result.push("Erev Taanit Bechorot");
  }
  if (isTaanisBechoros(jewishCalendar)) {
    result.push("Taanit Bechorot");
  }
  return result;
}

function tomorrowIsTaanitBechorot() {
  var nextDay = jewishCalendar.getDate().toJSDate();
  nextDay.setDate(nextDay.getDate() + 1);
  var nextJewishCalendar = new KosherZmanim.JewishCalendar(nextDay);
  return isTaanisBechoros(nextJewishCalendar);
}

function isTaanisBechoros(jewishCalendar) {
  if (
    jewishCalendar.getJewishMonth() === KosherZmanim.JewishCalendar.NISSAN &&
    ((jewishCalendar.getJewishDayOfMonth() === 14 &&
      jewishCalendar.getDayOfWeek() !== 7) ||
      (jewishCalendar.getJewishDayOfMonth() === 12 &&
        jewishCalendar.getDayOfWeek() === 5))
  ) {
    return true;
  }
}

function addRoshChodesh(result) {
  var roshChodeshOrErevRoshChodesh = getRoshChodeshOrErevRoshChodesh();
  if (roshChodeshOrErevRoshChodesh !== "") {
    result.push(roshChodeshOrErevRoshChodesh);
  }
  return result;
}

function getRoshChodeshOrErevRoshChodesh() {
  var result = "";
  var hebrewFormatter = new KosherZmanim.HebrewDateFormatter(timezone);
  if (jewishCalendar.isRoshChodesh()) {
    var roshChodesh = hebrewFormatter.formatRoshChodesh(jewishCalendar);
    if (roshChodesh.includes("Teves")) {
      roshChodesh = "Rosh Chodesh Tevet";
    }
    if (roshChodesh.includes("Tishrei")) {
      roshChodesh = "Rosh Chodesh Tishri";
    }
    result = roshChodesh;
  } else if (jewishCalendar.isErevRoshChodesh()) {
    var nextDay = jewishCalendar.getDate().toJSDate();
    nextDay.setDate(nextDay.getDate() + 1);
    var nextJewishCalendar = new KosherZmanim.JewishCalendar(
      luxon.DateTime.fromJSDate(nextDay)
    );
    var hebrewMonth = hebrewFormatter.formatRoshChodesh(nextJewishCalendar);
    if (hebrewMonth.includes("Teves")) {
      hebrewMonth = "Rosh Chodesh Tevet";
    }
    if (hebrewMonth.includes("Tishrei")) {
      hebrewMonth = "Rosh Chodesh Tishri";
    }
    result = "Erev " + hebrewMonth;
  }
  return result;
}

function addDayOfOmer(result) {
  var dayOfOmer = jewishCalendar.getDayOfOmer();
  if (dayOfOmer != -1) {
    result.push(getOrdinal(dayOfOmer) + " day of Omer");
  }
  return result;
}

function addDayOfChanukah(result) {
  var dayOfChanukah = jewishCalendar.getDayOfChanukah();
  if (dayOfChanukah != -1) {
    result.splice(result.indexOf("Chanukah"), 1); //remove Chanukah from the list to avoid duplication
    result.push(getOrdinal(dayOfChanukah) + " day of Chanukah");
  }
  return result;
}

function getSeasonalPrayers() {
  var result = [];
  var startDateForMashivHaruach = new KosherZmanim.JewishDate(
    jewishCalendar.getJewishYear(),
    KosherZmanim.JewishCalendar.TISHREI,
    22
  );
  var endDateForMashivHaruach = new KosherZmanim.JewishDate(
    jewishCalendar.getJewishYear(),
    KosherZmanim.JewishCalendar.NISSAN,
    15
  );
  if (
    jewishCalendar.compareTo(startDateForMashivHaruach) > 0 &&
    jewishCalendar.compareTo(endDateForMashivHaruach) < 0
  ) {
    result.push("משיב הרוח");
  } else {
    result.push("מוריד הטל");
  }

  if (isBarechAleinu()) {
    result.push("ברך עלינו");
  } else {
    result.push("ברכנו");
  }
  return result.join(" / ");
}

function getShaahZmanits() {
  var result = [];
  result.push(
    "Shaah Zmanit GR'A: " +
    zmanimFormatter.format(zmanimCalendar.getShaahZmanisGra())
  );
  result.push(
    "MG'A: " +
    zmanimFormatter.format(zmanimCalendar.getShaahZmanis72MinutesZmanis())
  );
  return result.join(" / ");
}

function getHallel() {
  var yomTovIndex = jewishCalendar.getYomTovIndex();
  if (
    (jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.NISSAN &&
      jewishCalendar.getJewishDayOfMonth() == 15) || //First day of Pesach
    (!jewishCalendar.getInIsrael() &&
      jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.NISSAN &&
      jewishCalendar.getJewishDayOfMonth() == 16) || //First day of Pesach outside of israel
    yomTovIndex == KosherZmanim.JewishCalendar.SHAVUOS ||
    yomTovIndex == KosherZmanim.JewishCalendar.SUCCOS ||
    yomTovIndex == KosherZmanim.JewishCalendar.SHEMINI_ATZERES ||
    jewishCalendar.isCholHamoedSuccos() ||
    jewishCalendar.isChanukah()
  ) {
    return "הלל שלם";
  } else if (
    jewishCalendar.isRoshChodesh() ||
    jewishCalendar.isCholHamoedPesach() ||
    (jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.NISSAN &&
      jewishCalendar.getJewishDayOfMonth() == 21) ||
    (!jewishCalendar.getInIsrael() &&
      jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.NISSAN &&
      jewishCalendar.getJewishDayOfMonth() == 22)
  ) {
    return "חצי הלל";
  } else {
    return "";
  }
}

function getTekufaForNextDay() {
  var nextDay = jewishCalendar.getDate().toJSDate();
  nextDay.setDate(nextDay.getDate() + 1);
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
  var tekufa = getTekufa();
  nextDay.setDate(nextDay.getDate() - 1);
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
  return tekufa;
}

function getTekufaForNextDayAsDate() {
  var nextDay = jewishCalendar.getDate().toJSDate();
  nextDay.setDate(nextDay.getDate() + 1);
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
  var tekufaDate = getTekufaAsDate();
  nextDay.setDate(nextDay.getDate() - 1);
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
  return tekufaDate;
}

function getTekufa() {
  var INITIAL_TEKUFA_OFFSET = 12.625; // the number of days Tekufas Tishrei occurs before JEWISH_EPOCH

  var days =
    KosherZmanim.JewishCalendar.getJewishCalendarElapsedDays(
      jewishCalendar.getJewishYear()
    ) +
    KosherZmanim.JewishCalendar.getDaysSinceStartOfJewishYear(
      jewishCalendar.getJewishYear(),
      jewishCalendar.getJewishMonth(),
      jewishCalendar.getJewishDayOfMonth()
    ) +
    INITIAL_TEKUFA_OFFSET -
    1; // total days since first Tekufas Tishrei event

  var solarDaysElapsed = days % 365.25; // total days elapsed since start of solar year
  var tekufaDaysElapsed = solarDaysElapsed % 91.3125; // the number of days that have passed since a tekufa event
  if (tekufaDaysElapsed > 0 && tekufaDaysElapsed <= 1) {
    // if the tekufa happens in the upcoming 24 hours
    return ((1.0 - tekufaDaysElapsed) * 24.0) % 24; // rationalize the tekufa event to number of hours since start of jewish day
  } else {
    return null;
  }
}

function getTekufaName() {
  var tekufaNameForToday = getTekufaType();
  if (tekufaNameForToday === "") {
    jewishCalendar.setDate(jewishCalendar.getDate().plus({ days: 1 }));
    var tekufaNameForTomorrow = getTekufaType();
    jewishCalendar.setDate(jewishCalendar.getDate().minus({ days: 1 }));
    if (tekufaNameForTomorrow === "") {
      return "";
    } else {
      return tekufaNameForTomorrow;
    }
  } else {
    return tekufaNameForToday;
  }

  function getTekufaType() {
    var tekufaNames = ["Tishri", "Tevet", "Nissan", "Tammuz"];
    var INITIAL_TEKUFA_OFFSET = 12.625; // the number of days Tekufas Tishrei occurs before JEWISH_EPOCH
    var days =
      KosherZmanim.JewishCalendar.getJewishCalendarElapsedDays(
        jewishCalendar.getJewishYear()
      ) +
      KosherZmanim.JewishCalendar.getDaysSinceStartOfJewishYear(
        jewishCalendar.getJewishYear(),
        jewishCalendar.getJewishMonth(),
        jewishCalendar.getJewishDayOfMonth()
      ) +
      INITIAL_TEKUFA_OFFSET -
      1; // total days since first Tekufas Tishrei event

    var solarDaysElapsed = days % 365.25; // total days elapsed since start of solar year
    var currentTekufaNumber = parseInt(solarDaysElapsed / 91.3125); // the number of days that have passed since a tekufa event
    var tekufaDaysElapsed = solarDaysElapsed % 91.3125; // the number of days that have passed since a tekufa event
    if (tekufaDaysElapsed > 0 && tekufaDaysElapsed <= 1) {
      // if the tekufa happens in the upcoming 24 hours
      return tekufaNames[currentTekufaNumber]; //0 for Tishrei, 1 for Tevet, 2, for Nissan, 3 for Tammuz
    } else {
      return "";
    }
  }
}

function getTekufaAsDate() {
  var hours = getTekufa() - 6;
  var minutes = parseInt((hours - parseInt(hours)) * 60);
  hours = parseInt(hours);
  var date = luxon.DateTime.fromObject(
    {
      year: jewishCalendar.getGregorianYear(),
      month: jewishCalendar.getGregorianMonth() + 1,
      day: jewishCalendar.getGregorianDayOfMonth(),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    { zone: "Europe/Amsterdam", isOffsetFixed: false }//Luxon does not support GMT+2, so we need to use Europe/Amsterdam and then make sure that DST is not applied
  ).plus({ hours: hours, minutes: minutes });
  return date;
}

function getIsTonightStartOrEndBirchatLevana() {
  var startTimeSevenDays = jewishCalendar.getTchilasZmanKidushLevana7Days();

  if (zmanimCalendar.getDate().hasSame(startTimeSevenDays, "day")) {
    return "Birchat HaLevana starts tonight";
  }
  if (jewishCalendar.getJewishDayOfMonth() === 14) {
    return "Last night for Birchat HaLevana";
  }
  return "";
}

function isBarechAleinu() {
  var tekufatTishriElapsedDays =
    KosherZmanim.JewishCalendar.getJewishCalendarElapsedDays(
      jewishCalendar.getJewishYear()
    ) +
    (KosherZmanim.JewishCalendar.getDaysSinceStartOfJewishYear(
      jewishCalendar.getJewishYear,
      jewishCalendar.getJewishMonth(),
      jewishCalendar.getJewishDayOfMonth()
    ) -
      1) +
    0.5;
  var solar = (jewishCalendar.getJewishYear() - 1) * 365.25;
  tekufatTishriElapsedDays = Math.floor(tekufatTishriElapsedDays - solar);
  if (
    jewishCalendar.getJewishMonth() === KosherZmanim.JewishCalendar.NISSAN &&
    jewishCalendar.getJewishDayOfMonth() < 15
  ) {
    return true;
  }
  if (jewishCalendar.getJewishMonth() < KosherZmanim.JewishCalendar.CHESHVAN) {
    return false;
  }
  if (jewishCalendar.getInIsrael()) {
    return (
      jewishCalendar.getJewishMonth() !==
      KosherZmanim.JewishCalendar.CHESHVAN ||
      jewishCalendar.getJewishDayOfMonth() >= 7
    );
  } else {
    return tekufatTishriElapsedDays >= 47;
  }
}

function getOrdinal(number) {
  //https://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffix-to-a-number
  var suffixes = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
  switch (number % 100) {
    case 11:
    case 12:
    case 13:
      return number + "th";
    default:
      return number + suffixes[number % 10];
  }
}

function getYomTov(jewishCalendar) {
  switch (jewishCalendar.getYomTovIndex()) {
    case KosherZmanim.JewishCalendar.EREV_PESACH:
      return "Erev Pesach";
    case KosherZmanim.JewishCalendar.PESACH:
      return "Pesach";
    case KosherZmanim.JewishCalendar.CHOL_HAMOED_PESACH:
      return "Chol HaMoed Pesach";
    case KosherZmanim.JewishCalendar.PESACH_SHENI:
      return "Pesach Sheni";
    case KosherZmanim.JewishCalendar.EREV_SHAVUOS:
      return "Erev Shavuot";
    case KosherZmanim.JewishCalendar.SHAVUOS:
      return "Shavuot";
    case KosherZmanim.JewishCalendar.SEVENTEEN_OF_TAMMUZ:
      return "Fast of the Seventeenth of Tammuz";
    case KosherZmanim.JewishCalendar.TISHA_BEAV:
      return "Tisha Be'Av";
    case KosherZmanim.JewishCalendar.TU_BEAV:
      return "Tu Be'Av";
    case KosherZmanim.JewishCalendar.EREV_ROSH_HASHANA:
      return "Erev Rosh Hashana";
    case KosherZmanim.JewishCalendar.ROSH_HASHANA:
      return "Rosh Hashana";
    case KosherZmanim.JewishCalendar.FAST_OF_GEDALYAH:
      return "Tzom Gedalya";
    case KosherZmanim.JewishCalendar.EREV_YOM_KIPPUR:
      return "Erev Yom Kippur";
    case KosherZmanim.JewishCalendar.YOM_KIPPUR:
      return "Yom Kippur";
    case KosherZmanim.JewishCalendar.EREV_SUCCOS:
      return "Erev Succot";
    case KosherZmanim.JewishCalendar.SUCCOS:
      return "Succot";
    case KosherZmanim.JewishCalendar.CHOL_HAMOED_SUCCOS:
      return "Chol HaMoed Succot";
    case KosherZmanim.JewishCalendar.HOSHANA_RABBA:
      return "7th day of Sukkot (Hoshana Rabba)";
    case KosherZmanim.JewishCalendar.SHEMINI_ATZERES:
      if (jewishCalendar.getInIsrael()) {
        return "Shemini Atzeret & Simchat Torah";
      } else {
        return "Shemini Atzeret";
      }
    case KosherZmanim.JewishCalendar.SIMCHAS_TORAH:
      if (!jewishCalendar.getInIsrael()) {
        return "Shemini Atzeret & Simchat Torah";
      } else {
        return "Shemini Atzeret";
      }
    //20 was erev chanuka which was deleted
    case KosherZmanim.JewishCalendar.CHANUKAH:
      return "Chanukah";
    case KosherZmanim.JewishCalendar.TENTH_OF_TEVES:
      return "Fast of Asarah Be'Tevet";
    case KosherZmanim.JewishCalendar.TU_BESHVAT:
      return "Tu Be'Shevat";
    case KosherZmanim.JewishCalendar.FAST_OF_ESTHER:
      return "Ta'anit Ester";
    case KosherZmanim.JewishCalendar.PURIM:
      return "Purim";
    case KosherZmanim.JewishCalendar.SHUSHAN_PURIM:
      return "Shushan Purim";
    case KosherZmanim.JewishCalendar.PURIM_KATAN:
      return "Purim Katan";
    case KosherZmanim.JewishCalendar.ROSH_CHODESH:
      return "Rosh Chodesh";
    case KosherZmanim.JewishCalendar.YOM_HASHOAH:
      return "Yom Hashoah";
    case KosherZmanim.JewishCalendar.YOM_HAZIKARON:
      return "Yom Hazikaron";
    case KosherZmanim.JewishCalendar.YOM_HAATZMAUT: //tachanun is said
      return "Yom Haatzmaut";
    case KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM: //tachanun erev before, however, Rav ovadia would not say on the day itself
      return "Yom Yerushalayim";
    case KosherZmanim.JewishCalendar.LAG_BAOMER:
      return "Lag B'Omer";
    case KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN:
      return "Shushan Purim Katan";
    default:
      return "";
  }
}

function getYomTovForNextDay() {
  var nextDay = jewishCalendar.getDate().toJSDate();
  nextDay.setDate(nextDay.getDate() + 1);
  var nextJewishCalendar = new KosherZmanim.JewishCalendar(nextDay);
  return getYomTov(nextJewishCalendar);
}

function getTachanun() {
  var yomTovIndex = jewishCalendar.getYomTovIndex();
  if (
    jewishCalendar.isRoshChodesh() ||
    yomTovIndex == KosherZmanim.JewishCalendar.PESACH_SHENI ||
    yomTovIndex == KosherZmanim.JewishCalendar.LAG_BAOMER ||
    yomTovIndex == KosherZmanim.JewishCalendar.TISHA_BEAV ||
    yomTovIndex == KosherZmanim.JewishCalendar.TU_BEAV ||
    yomTovIndex == KosherZmanim.JewishCalendar.EREV_ROSH_HASHANA ||
    yomTovIndex == KosherZmanim.JewishCalendar.ROSH_HASHANA ||
    yomTovIndex == KosherZmanim.JewishCalendar.EREV_YOM_KIPPUR ||
    yomTovIndex == KosherZmanim.JewishCalendar.YOM_KIPPUR ||
    yomTovIndex == KosherZmanim.JewishCalendar.TU_BESHVAT ||
    yomTovIndex == KosherZmanim.JewishCalendar.PURIM_KATAN ||
    yomTovIndex == KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN ||
    yomTovIndex == KosherZmanim.JewishCalendar.PURIM ||
    yomTovIndex == KosherZmanim.JewishCalendar.SHUSHAN_PURIM ||
    yomTovIndex == KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM ||
    jewishCalendar.isChanukah() ||
    jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.NISSAN ||
    (jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.SIVAN &&
      jewishCalendar.getJewishDayOfMonth() <= 12) ||
    (jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.TISHREI &&
      jewishCalendar.getJewishDayOfMonth() >= 11)
  ) {
    return "There is no Tachanun today";
  }
  var yomTovIndexForNextDay = getYomTovIndexForNextDay();
  if (
    jewishCalendar.getDayOfWeek() == 6 ||
    yomTovIndex == KosherZmanim.JewishCalendar.FAST_OF_ESTHER ||
    yomTovIndexForNextDay == KosherZmanim.JewishCalendar.TISHA_BEAV ||
    yomTovIndexForNextDay == KosherZmanim.JewishCalendar.TU_BEAV ||
    yomTovIndexForNextDay == KosherZmanim.JewishCalendar.TU_BESHVAT ||
    yomTovIndexForNextDay == KosherZmanim.JewishCalendar.LAG_BAOMER ||
    yomTovIndexForNextDay == KosherZmanim.JewishCalendar.PESACH_SHENI ||
    yomTovIndexForNextDay == KosherZmanim.JewishCalendar.PURIM_KATAN ||
    jewishCalendar.isErevRoshChodesh()
  ) {
    return "There is only Tachanun in the morning";
  }
  if (jewishCalendar.getDayOfWeek() == 7) {
    return "צדקתך";
  }
  return "There is Tachanun today";
}

function getYomTovIndexForNextDay() {
  var nextDay = jewishCalendar.getDate().toJSDate();
  nextDay.setDate(nextDay.getDate() + 1);

  jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
  var yomTovIndex = jewishCalendar.getYomTovIndex();

  nextDay.setDate(nextDay.getDate() - 1); //reset the date to the original date
  jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));

  return yomTovIndex;
}

function numberToHebrew(num) {
  var buffer = [];
  if (num <= 0 || num >= 6000) return null; // only support 1-5999 for now, since that's all we need, but could be extended
  var let1000 = [" א'", " ב'", " ג'", " ד'", " ה'"];
  var let100 = ["ק", "ר", "ש", "ת"];
  var let10 = ["י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  var let1 = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];

  if (num >= 100) {
    if (num >= 1000) {
      buffer.push(let1000[Math.floor(num) / 1000 - 1]);
      num %= 1000;
    }

    if (num < 500) {
      buffer.push(let100[Math.floor(num) / 100 - 1]);
    } else if (num < 900) {
      buffer.push("ת");
      buffer.push(let100[(Math.floor(num) - 400) / 100 - 1]);
    } else {
      buffer.push("תת");
      buffer.push(let100[(Math.floor(num) - 800) / 100 - 1]);
    }

    num %= 100;
  }
  switch (num) {
    // Avoid letter combinations from the Tetragrammaton
    case 16:
      buffer.push("טז");
      break;
    case 15:
      buffer.push("טו");
      break;
    default:
      if (num >= 10) {
        buffer.push(let10[Math.floor(num / 10) - 1]);
        num %= 10;
      }
      if (num > 0) {
        buffer.push(let1[Math.floor(num) - 1]);
      }
      break;
  }
  return buffer.join("");
}

function saveCandleLightingSetting() {
  var candleLightingTime = document.getElementById("candleMinutes").value;
  zmanimCalendar.setCandleLightingOffset(candleLightingTime);
  setCookie("candleLightingTime", candleLightingTime, 36500); //100 years
  updateZmanimList();
}

function saveTzeitShabbatSetting() {
  var tzeitShabbatTime = document.getElementById("tzeitShabbatMinutes").value;
  zmanimCalendar.setAteretTorahSunsetOffset(tzeitShabbatTime);
  setCookie("tzeitShabbatTime", tzeitShabbatTime, 36500); //100 years
  updateZmanimList();
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function getIsOkayToListenToMusic() {
  if (
    jewishCalendar.getDayOfOmer() >= 8 &&
    jewishCalendar.getDayOfOmer() <= 33
  ) {
    return false;
  } else if (
    jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.TAMMUZ
  ) {
    if (jewishCalendar.getJewishDayOfMonth() >= 17) {
      return false;
    }
  } else if (
    jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.AV
  ) {
    if (jewishCalendar.getJewishDayOfMonth() <= 9) {
      return false;
    }
  }
  return true;
}

function getUlchaparatPesha() {
  if (jewishCalendar.isRoshChodesh()) {
    if (jewishCalendar.isJewishLeapYear()) {
      var month = jewishCalendar.getJewishMonth();
      if (
        month == KosherZmanim.JewishCalendar.CHESHVAN ||
        month == KosherZmanim.JewishCalendar.KISLEV ||
        month == KosherZmanim.JewishCalendar.TEVES ||
        month == KosherZmanim.JewishCalendar.SHEVAT ||
        month == KosherZmanim.JewishCalendar.ADAR ||
        month == KosherZmanim.JewishCalendar.ADAR_II
      ) {
        return "Say וּלְכַפָּרַת פֶּשַׁע";
      } else {
        return "Do not say וּלְכַפָּרַת פֶּשַׁע";
      }
    } else {
      return "Do not say וּלְכַפָּרַת פֶּשַׁע";
    }
  }
  return "";
}

function shabbatMode() {
  //shabbat mode is a mode that disables all the buttons to change the date, and slowly scrolls the zmanim up and down the screen while displaying the shabbat mode banner
  isShabbatMode = !isShabbatMode;
  if (!isShabbatMode) {
    //undo shabbat mode
    document.getElementById("date").disabled = false;
    document.getElementById("date").style.backgroundColor = "white";
    document.getElementById("date").style.color = "black";
    document.getElementById("date").style.cursor = "pointer";
    document.getElementById("backButton").disabled = false;
    document.getElementById("forwardButton").disabled = false;
    document.getElementById("shabbatModeBanner").style.display = "none";
  } else {
    var date = new luxon.DateTime.now();
    jewishCalendar.setDate(date);
    zmanimCalendar.setDate(date);
    updateZmanimList(); //update the zmanim list to the current date
    //disable the date buttons
    document.getElementById("date").disabled = true;
    document.getElementById("date").style.backgroundColor = "grey";
    document.getElementById("date").style.color = "black";
    document.getElementById("date").style.cursor = "default";
    document.getElementById("backButton").disabled = true;
    document.getElementById("forwardButton").disabled = true;
    document.getElementById("shabbatModeBanner").style.display = "block";
    scrollPage(); //scroll the zmanim up and down the screen
    initUpdaterForZmanim();
  }
}

var scrollDirection = 1;
function scrollPage() {
  if (isShabbatMode) {
    window.scrollBy(0, scrollDirection); // horizontal and vertical scroll increments
    scrolldelay = setTimeout("scrollPage()", 50); // scrolls every 50 milliseconds
    if (window.pageYOffset == 0) {
      scrollDirection = 1;
    } else if (
      window.pageYOffset + 1 >
      document.body.scrollHeight - window.innerHeight
    ) {
      //window.pageYOffset return a float scroll y value, for exemple in my case 78.4000015258789;
      //We add +1 to obtain 79.4
      //(document.body.scrollHeight - window.innerHeight) return a interger of 79
      scrollDirection = -1;
    }
  }
}

function initUpdaterForZmanim() {
  //at 12:00 AM the next day, update the zmanim to the next day's zmanim
  var tomorrow = new luxon.DateTime.now().plus({ days: 1 });
  tomorrow = tomorrow.set({ hour: 0, minute: 0, second: 2, millisecond: 0 });
  var timeUntilTomorrow = tomorrow.diffNow().as("milliseconds");
  setTimeout(function () {
    var date = new luxon.DateTime.now();
    jewishCalendar.setDate(date);
    updateZmanimList();
    initUpdaterForZmanim();
  }, timeUntilTomorrow);
}

function setButtonsState(isZmanimInHebrew, isZmanimInTranslatedEnglish) {
  if (isZmanimInHebrew) {
    document.getElementById("hebrewZmanim").disabled = true;
    document.getElementById("englishZmanim").disabled = false;
    document.getElementById("defaultZmanim").disabled = false;
  } else if (isZmanimInTranslatedEnglish) {
    document.getElementById("englishZmanim").disabled = true;
    document.getElementById("hebrewZmanim").disabled = false;
    document.getElementById("defaultZmanim").disabled = false;
  } else {
    document.getElementById("defaultZmanim").disabled = true;
    document.getElementById("hebrewZmanim").disabled = false;
    document.getElementById("englishZmanim").disabled = false;
  }
}

function toggleDarkMode() {
  if (
    document
      .getElementById("logo")
      .src.includes("/RabbiOvadiahYosefCalendar/ro_flag.png")
  ) {
    document.getElementById("logo").src =
      "/RabbiOvadiahYosefCalendar/ro_flag_light.png";
  } else if (
    document
      .getElementById("logo")
      .src.includes("/RabbiOvadiahYosefCalendar/ro_flag_light.png")
  ) {
    document.getElementById("logo").src =
      "/RabbiOvadiahYosefCalendar/ro_flag.png";
  }
  document.getElementById("hd").classList.toggle("hdDarkMode");
  var as = document.getElementsByTagName("a");
  for (var i = 0; i < as.length; i++) {
    as[i].classList.toggle("aDarkMode");
  }
  document
    .getElementsByClassName("main-nav__megamenu")[0]
    .classList.toggle("darkMode");
  document
    .getElementsByClassName("main-nav__toogle")[0]
    .classList.toggle("darkMode");
  if (
    document.getElementsByClassName("main-nav__nav")[0].style.backgroundColor ==
    "rgb(59, 57, 57)"
  ) {
    document.getElementsByClassName("main-nav__nav")[0].style.backgroundColor =
      "rgb(229, 232, 233)";
  } else {
    document.getElementsByClassName("main-nav__nav")[0].style.backgroundColor =
      "rgb(59, 57, 57)";
  }
  document.querySelector("title").classList.toggle("titleDarkMode");
  document.querySelector("body").classList.toggle("bodyDarkMode");
  document.querySelector("h2").classList.toggle("h2DarkMode");
  document.querySelector("h5").classList.toggle("h5DarkMode");
  document.getElementById("ShabbatAndChagTimes").classList.toggle("borderAlertDarkMode");
  var borders = document.getElementsByClassName("border");
  for (var i = 0; i < borders.length; i++) {
    borders[i].classList.toggle("borderDarkMode");
  }
  var bordersSplit = document.getElementsByClassName("border-split");
  for (var i = 0; i < bordersSplit.length; i++) {
    bordersSplit[i].classList.toggle("border-splitDarkMode");
  }
  document.addEventListener("DOMContentLoaded", function (event) {
    document.getElementById("footer").classList.toggle("footerDarkMode");
    var links = document.getElementsByClassName("sourceCode");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("sourceCodeDarkMode");
    }
  });
  if (document.getElementById("footer") !== null) {
    document.getElementById("footer").classList.toggle("footerDarkMode");
  }
  var links = document.getElementsByClassName("sourceCode");
  for (var i = 0; i < links.length; i++) {
    links[i].classList.toggle("sourceCodeDarkMode");
  }
}

function addArrowIfNextUpcomingZman(zman) {
  if (nextUpcomingZman == null) {
    return "";
  }
  if (zman.toMillis() == nextUpcomingZman.toMillis()) {
    return "➤";
  } else {
    return "";
  }
}

function setNextUpcomingZman() {
  nextUpcomingZman = null;
  var zmanim = [];
  var currentSelectedDate = zmanimCalendar.getDate();
  zmanimCalendar.setDate(luxon.DateTime.now().minus({ days: 1 }));
  jewishCalendar.setDate(luxon.DateTime.now().minus({ days: 1 }));
  addZmanim(zmanim);
  zmanimCalendar.setDate(luxon.DateTime.now());
  jewishCalendar.setDate(luxon.DateTime.now());
  addZmanim(zmanim);
  zmanimCalendar.setDate(luxon.DateTime.now().plus({ days: 1 }));
  jewishCalendar.setDate(luxon.DateTime.now().plus({ days: 1 }));
  addZmanim(zmanim);
  zmanimCalendar.setDate(currentSelectedDate); //reset the date to the current date
  jewishCalendar.setDate(currentSelectedDate); //reset the date to the current date

  for (let i = 0; i < zmanim.length; i++) {
    if (
      zmanim[i] !== null &&
      zmanim[i].toMillis() > luxon.DateTime.now().toMillis() &&
      (nextUpcomingZman === null ||
        zmanim[i].toMillis() < nextUpcomingZman.toMillis())
    ) {
      nextUpcomingZman = zmanim[i];
    }
  }
  updateZmanimList();
  //call back this function 1 second after the nextUpcomingZman passes
  setTimeout(
    setNextUpcomingZman,
    nextUpcomingZman.toMillis() - luxon.DateTime.now().toMillis() + 1000
  ); //TODO test
}

function addZmanim(zmanim) {
  zmanim.push(zmanimCalendar.getAlos72Zmanis());
  zmanim.push(zmanimCalendar.getEarliestTalitAndTefilin());
  zmanim.push(zmanimCalendar.getSunrise());
  zmanim.push(zmanimCalendar.getSofZmanShmaMGA72MinutesZmanis());
  zmanim.push(zmanimCalendar.getSofZmanShmaGRA());
  if (
    jewishCalendar.getYomTovIndex() == KosherZmanim.JewishCalendar.EREV_PESACH
  ) {
    zmanim.push(zmanimCalendar.getSofZmanTfilaMGA72MinutesZmanis());
    zmanim.push(zmanimCalendar.getSofZmanTfilaGRA());
    zmanim.push(zmanimCalendar.getSofZmanBiurChametzMGA());
  } else {
    zmanim.push(zmanimCalendar.getSofZmanTfilaGRA());
  }
  zmanim.push(zmanimCalendar.getChatzos());
  zmanim.push(zmanimCalendar.getMinchaGedolaGreaterThan30());
  zmanim.push(zmanimCalendar.getMinchaKetana());
  zmanim.push(zmanimCalendar.getPlagHamincha());
  if (
    (jewishCalendar.hasCandleLighting() &&
      !jewishCalendar.isAssurBemelacha()) ||
    jewishCalendar.getDayOfWeek == 6
  ) {
    zmanim.push(zmanimCalendar.getCandleLighting());
  }
  zmanim.push(zmanimCalendar.getSunset());
  zmanim.push(zmanimCalendar.getTzait());
  if (
    jewishCalendar.isTaanis() &&
    jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_KIPPUR
  ) {
    zmanim.push(zmanimCalendar.getTzaitTaanit());
    zmanim.push(zmanimCalendar.getTzaitTaanitLChumra());
  }
  if (
    jewishCalendar.isAssurBemelacha() &&
    !jewishCalendar.hasCandleLighting()
  ) {
    zmanim.push(zmanimCalendar.getTzaisAteretTorah());
  }
  zmanim.push(zmanimCalendar.getTzais72Zmanis());
  zmanim.push(zmanimCalendar.getSolarMidnight());
}

init(); // initialize the page with the current date and location as well as any other buttons that need to be initialized
