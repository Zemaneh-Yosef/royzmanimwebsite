// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { Input } from "../../libraries/mdbootstrap/mdb.esm.js"
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

/** @param {string} param */
const settingsURLOverride = (param) => urlParams.get(param) || localStorage.getItem(param);

window.customTZAlert = false;

/**
 * @param {string} variedTocheck
 * @param {string} defaultSetting
 */
function defaultSettings (variedTocheck, defaultSetting) {
    if (urlParams.has(variedTocheck) || localStorage.getItem(variedTocheck))
        return settingsURLOverride(variedTocheck);
    else
        return defaultSetting
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
        timezone: () => {
            if (settingsURLOverride("timeZone")) {
                if (!Intl.supportedValuesOf('timeZone').includes(settingsURLOverride("timeZone")) && !window.customTZAlert) {
                    alert("custom timezone found; expect issues.")
                    window.customTZAlert = true;
                }

                return settingsURLOverride("timeZone");
            }

            if (Intl.DateTimeFormat() && Intl.DateTimeFormat().resolvedOptions() && Intl.DateTimeFormat().resolvedOptions().timeZone) {
                if (!window.customTZAlert) {
                    alert("timezone not found in the request; using the system local.")
                    window.customTZAlert = true;
                }

                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            }

            if (!window.customTZAlert) {
                alert("UTC timezone used due to inability to get system timezone. Please set the timezone via the URL params");
                window.customTZAlert = true;
            }

            return "UTC";
        }
    },

    calendarToggle: {
        /** @returns {'seasonal'|'degrees'} */
        // @ts-ignore
        hourCalculators: () => ['seasonal', 'degrees'].includes(settingsURLOverride("hourCalculators")) ? settingsURLOverride("hourCalculators") : 'degrees',
        rtKulah: () => defaultSettings("rtKulah", "true") == "true",
        tzeitTaanitHumra: () => settingsURLOverride("tzeitTaanitHumra") == "true",
        /** @returns {'hatzoth'|'arbitrary'} */
        // @ts-ignore
        tekufaMidpoint: () => ['hatzoth', 'arbitrary'].includes(settingsURLOverride("tekufa")) ? settingsURLOverride("tekufa") : 'hatzoth',
        /** @returns {'shemuel'|'adabaravah'} */
        // @ts-ignore
        tekufaCalc: () => ['shemuel', 'adabaravah'].includes(settingsURLOverride("tekufaCalc")) ? settingsURLOverride("tekufaCalc") : 'shemuel'
    },
    customTimes: {
        candleLighting: () => parseInt(settingsURLOverride("candles")) || 20,
        tzeithIssurMelakha: () => {
            if (!(settingsURLOverride("tzeithIMmin") || "").trim() || isNaN(parseInt(settingsURLOverride("tzeithIMmin")))) {
                return (settings.calendarToggle.hourCalculators() == "seasonal" ? { minutes: 40, degree: null } : {
                    minutes: 30,
                    degree: 7.14
                });
            }

            if (!(settingsURLOverride("tzeithIMdeg") || "").trim()) {
                const geoLocation = new KosherZmanim.GeoLocation("R Ovadia's house", 31.7898742, 35.1771491, 776, "UTC")

                const aCalendar = new KosherZmanim.AstronomicalCalendar(geoLocation);
                aCalendar.setDate(KosherZmanim.Temporal.Now.plainDateISO().with({ month: 3, day: 20 }))
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

            const bsCSSLink = document.getElementById("bs");
            if (bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")
                bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")

            const mdbCSSLink = document.getElementById("mdb");
            if (mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out-rtl.css")
                mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out-rtl.css")

            document.body.dir = "rtl";

            langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'hebrew').forEach(btnOfGroup => btnOfGroup.checked = false);
            langSelectors.find(btnOfGroup=>btnOfGroup.id == 'hebrew').checked = true;
            break;
        } case 'en-et': {
            document.body.classList.remove("lang-hb", "lang-en");
            document.body.classList.add("lang-en-et");

            const bsCSSLink = document.getElementById("bs");
            if (bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
                bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

            const mdbCSSLink = document.getElementById("mdb");
            if (mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out.css")
                mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out.css")

            document.body.dir = "ltr"

            langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'enet').forEach(btnOfGroup => btnOfGroup.checked = false);
            langSelectors.find(btnOfGroup=>btnOfGroup.id == 'enet').checked = true;
            break;
        } case 'en': {
            document.body.classList.remove("lang-hb", "lang-en-et");
            document.body.classList.add("lang-en");

            const bsCSSLink = document.getElementById("bs");
            if (bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
                bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

            const mdbCSSLink = document.getElementById("mdb");
            if (mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out.css")
                mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out.css")

            document.body.dir = "ltr"

            langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'enli').forEach(btnOfGroup => btnOfGroup.checked = false);
            langSelectors.find(btnOfGroup=>btnOfGroup.id == 'enli').checked = true;
            break;
        }
    }

    Array.from(document.getElementsByClassName('form-outline')).forEach((formOutline) => {
        new Input(formOutline).update();
        if (zmanimLanguage == "hb") {
            const formLabels = [...formOutline.getElementsByTagName('label')].filter(label => label.classList.contains('form-label'));
            for (const formLabel of formLabels) {
                formLabel.style.marginRight = formLabel.style.marginLeft;
                formLabel.style.marginLeft = (0).toString();
            }
        }
    });

    if (save)
        localStorage.setItem("zmanimLanguage", zmanimLanguage)
}

export {settings, handleLanguage}