const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

/** @param {string} param */
const settingsURLOverride = (param) => urlParams.get(param) || localStorage.getItem(param);

const settings = {
	calendarSource: () => ['amudehHoraah', 'ohrHachaim'].includes(settingsURLOverride("calendarSource")) ? settingsURLOverride('calendarSource') : "amudehHoraah",
	seconds: () => settingsURLOverride("seconds") == "true",
	timeFormat: () => settingsURLOverride("timeFormat") == "12" ? "12" : "24",
	language: () => ['hb', 'en-et', 'en'].includes(settingsURLOverride("zmanimLanguage")) ? settingsURLOverride("zmanimLanguage") : "hb",
	candleLighting: () => parseInt(settingsURLOverride("candles")) || 20,
	tzeith: () => parseInt(settingsURLOverride("tzeith")) || 40,

    location: {
        name: () => settingsURLOverride("locationName"),
        lat: () => parseFloat(settingsURLOverride("lat")),
        long: () => parseFloat(settingsURLOverride("long")),
        elevation: () => parseFloat(settingsURLOverride("elevation")) || 0,
        timezone: () => settingsURLOverride("timeZone")
    }
}

function handleLanguage(zmanimLanguage = settings.language()) {
    switch (zmanimLanguage) {
        case 'hb':
        default: {
            document.body.classList.remove("lang-en", "lang-en-et");
            document.body.classList.add("lang-hb");

            const mdbCSSLink = document.getElementById("mdb");
            if (mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/css/mdb.rtl.min.css")
                mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.rtl.min.css")

            const darkmdbCSSLink = document.getElementById("mdbd");
            if (darkmdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/css/mdb.dark.rtl.min.css")
                darkmdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.dark.rtl.min.css")

            document.body.dir = "rtl"
            break;
        } case 'en-et': {
            document.body.classList.remove("lang-hb", "lang-en");
            document.body.classList.add("lang-en-et");

            const mdbCSSLink = document.getElementById("mdb");
            if (mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/css/mdb.min.css")
                mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.min.css")

            const darkmdbCSSLink = document.getElementById("mdbd");
            if (darkmdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/css/mdb.dark.min.css")
                darkmdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.dark.min.css")

            document.body.dir = "ltr"
            break;
        } case 'en': {
            document.body.classList.remove("lang-hb", "lang-en-et");
            document.body.classList.add("lang-en");

            const mdbCSSLink = document.getElementById("mdb");
            if (mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/css/mdb.min.css")
                mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.min.css")

            const darkmdbCSSLink = document.getElementById("mdbd");
            if (darkmdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/css/mdb.dark.min.css")
                darkmdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.dark.min.css")

            document.body.dir = "ltr"
            break;
        }
    }

    Array.from(document.getElementsByClassName('form-outline')).forEach((formOutline) => {
        new mdb.Input(formOutline).update();
        if (settings.language() == "hb") {
            const formLabel = formOutline.querySelector('.form-label');
            formLabel.style.marginRight = formLabel.style.marginLeft;
            formLabel.style.marginLeft = 0;
        }
    });
}

window.handleLanguage = handleLanguage;

document.addEventListener("DOMContentLoaded", () => handleLanguage())

export {settings, handleLanguage}