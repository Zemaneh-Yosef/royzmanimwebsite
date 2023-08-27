// @ts-check

import * as KosherZmanim from "../libraries/kosher-zmanim.esm.js"
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

/** @param {string} param */
const settingsURLOverride = (param) => urlParams.get(param) || localStorage.getItem(param);
const defaultSettings = (variedTocheck, defaultSetting) => {
    if (urlParams.has(variedTocheck) || localStorage.getItem(variedTocheck))
        return settingsURLOverride(variedTocheck);
    else
        return defaultSetting
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

const settings = Object.freeze({
	seconds: () => settingsURLOverride("seconds") == "true",
    /** @return {'h11'|'h12'|'h23'|'h24'} */
	timeFormat: function () {
        if (['h11', 'h12', 'h23', 'h24'].includes(settingsURLOverride("timeFormat")))
            // @ts-ignore
            return settingsURLOverride("timeFormat");

        let local = this.language() == 'hb' ? 'he' : 'en'
        const testTime = (new Intl.DateTimeFormat(local, { timeStyle: "short" })).format(new Date().setHours(0,0,0,0));
        if (testTime.endsWith('AM'))
            return testTime.startsWith('0') ? 'h11' : 'h12';
        else
            return testTime.startsWith('2') ? 'h24' : 'h23'
    },
    /** @returns {'hb'|'en'|'en-et'} */
	language: () => {
        if (['hb', 'en-et', 'en'].includes(settingsURLOverride("zmanimLanguage")))
            // @ts-ignore
            return settingsURLOverride("zmanimLanguage")

        if (window.navigator && window.navigator.languages) {
            const languagePartOfOptions = window.navigator.languages.find(language => language.includes('hb') || language.includes('en'))
            if (languagePartOfOptions) {
                return languagePartOfOptions.includes('en') ? 'en' : 'hb'
            }
        }

        return 'hb';
    },
	candleLighting: () => parseInt(settingsURLOverride("candles")) || 20,
	tzeith: () => parseInt(settingsURLOverride("tzeith")) || 40,

    location: {
        name: () => settingsURLOverride("locationName"),
        lat: () => parseFloat(settingsURLOverride("lat")),
        long: () => parseFloat(settingsURLOverride("long")),
        elevation: () => parseFloat(settingsURLOverride("elevation")) || 0,
        timezone: () => settingsURLOverride("timeZone")
    },

    calendarToggle: {
        /** @returns {'seasonal'|'degrees'} */
        // @ts-ignore
        hourCalculators: () => ['seasonal', 'degrees'].includes(settingsURLOverride("hourCalculators")) ? settingsURLOverride("hourCalculators") : 'degrees',
        rtKulah: () => defaultSettings("rtKulah", "true") == "true",
        tzeitTaanitHumra: () => settingsURLOverride("tzeitTaanitHumra") == "true",
        /** @returns {'hatzoth'|'arbitrary'} */
        // @ts-ignore
        tekufa: () => ['hatzoth', 'arbitrary'].includes(settingsURLOverride("tekufa")) ? settingsURLOverride("tekufa") : 'hatzoth'
    },
    customTimes: {
        candleLighting: () => parseInt(settingsURLOverride("candles")) || 20,
        tzeithIssurMelakha: () => {
            if (!settingsURLOverride("tzeithIMmin").trim() || isNaN(parseInt(settingsURLOverride("tzeithIMmin")))) {
                return (settings.calendarToggle.hourCalculators() == "seasonal" ? { minutes: 40, degree: null } : {
                    minutes: 30,
                    degree: 7.14
                });
            }

            let degreeValid = true;

            if (!settingsURLOverride("tzeithIMdeg") || !settingsURLOverride("tzeithIMdeg").trim() || !isValidJSON(settingsURLOverride("tzeithIMdeg"))) {
                degreeValid = false;
            } else {
                const degCheck = JSON.parse(settingsURLOverride("tzeithIMdeg"))
                degreeValid = 'lat' in degCheck && 'lng' in degCheck;
                degreeValid = degreeValid && !isNaN(settings.location.lat()) && !isNaN(settings.location.long());
                degreeValid = degreeValid && degCheck.lat == settings.location.lat() && degCheck.lng == settings.location.long()
                degreeValid = degreeValid && !isNaN(parseFloat(degCheck.degree))
            }

            if (!degreeValid) {
                if (isNaN(settings.location.lat()) || isNaN(settings.location.long())) {
                    return {
                        minutes: parseInt(settingsURLOverride("tzeithIMmin")),
                        degree: null
                    };
                }

                /** @type {[string, number, number, number, string]} */
                // @ts-ignore
                const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
                const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

                const aCalendar = new KosherZmanim.AstronomicalCalendar(geoLocation);
                const degree = aCalendar.getSunsetSolarDipFromOffset(parseInt(settingsURLOverride("tzeithIMmin")));

                localStorage.setItem("tzeithIMdeg", degree.toString())
                return {
                    minutes: parseInt(settingsURLOverride("tzeithIMmin")),
                    degree
                }
            }

            return {
                minutes: parseInt(settingsURLOverride("tzeithIMmin")),
                degree: parseInt(settingsURLOverride("tzeithIMdeg"))
            }
        }
    }
})

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