// @ts-check

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

function handleLanguage(zmanimLanguage = settings.language(), save=false) {
    const langSelectors = Array.from(document.getElementById('languageSelector').getElementsByTagName('input'));

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

            document.body.dir = "rtl";

            langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'hebrew').forEach(btnOfGroup => btnOfGroup.checked = false);
            langSelectors.find(btnOfGroup=>btnOfGroup.id == 'hebrew').checked = true;
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

            langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'enet').forEach(btnOfGroup => btnOfGroup.checked = false);
            langSelectors.find(btnOfGroup=>btnOfGroup.id == 'enet').checked = true;
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

            langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'enli').forEach(btnOfGroup => btnOfGroup.checked = false);
            langSelectors.find(btnOfGroup=>btnOfGroup.id == 'enli').checked = true;
            break;
        }
    }

    Array.from(document.getElementsByClassName('form-outline')).forEach((formOutline) => {
        // @ts-ignore
        new mdb.Input(formOutline).update();
        if (zmanimLanguage == "hb") {
            /** @type {HTMLElement} */
            const formLabel = formOutline.querySelector('.form-label');
            formLabel.style.marginRight = formLabel.style.marginLeft;
            formLabel.style.marginLeft = (0).toString();
        }
    });

    if (save)
        localStorage.setItem("zmanimLanguage", zmanimLanguage)
}

export {settings, handleLanguage}