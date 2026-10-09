// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js"
import { Input } from "../../libraries/mdbootstrap/mdb.js"
const urlParams = new URLSearchParams(window.location.search);

/** @param {string} param */
const settingsURLOverride = (param) => urlParams.get(param) || localStorage.getItem(param);

// @ts-ignore
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
		if (navigator.languages.find(lang => lang.startsWith(local)))
			local = navigator.languages.find(lang => lang.startsWith(local));

		return (new Intl.Locale(local)).hourCycle;
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
	location: {
		name: () => settingsURLOverride("locationName"),
		lat: () => parseFloat(settingsURLOverride("lat")),
		long: () => parseFloat(settingsURLOverride("long")),
		elevation: () => parseFloat(settingsURLOverride("elevation")) || 0,
		timezone: () => {
			if (settingsURLOverride("timeZone")) {
				if (!Intl.supportedValuesOf('timeZone').includes(settingsURLOverride("timeZone"))
				// @ts-ignore
				&& !window.customTZAlert) {
					alert("custom timezone found; expect issues.");
					// @ts-ignore
					window.customTZAlert = true;
				}

				return settingsURLOverride("timeZone");
			}

			if (Intl.DateTimeFormat() && Intl.DateTimeFormat().resolvedOptions() && Intl.DateTimeFormat().resolvedOptions().timeZone) {
				// @ts-ignore
				if (!window.customTZAlert) {
					alert("timezone not found in the request; using the system local.")
					// @ts-ignore
					window.customTZAlert = true;
				}

				return Intl.DateTimeFormat().resolvedOptions().timeZone;
			}

			// @ts-ignore
			if (!window.customTZAlert) {
				alert("UTC timezone used due to inability to get system timezone. Please set the timezone via the URL params");
				// @ts-ignore
				window.customTZAlert = true;
			}

			return "UTC";
		}
	},

	calendarToggle: {
		rtKulah: () => defaultSettings("rtKulah", "true") == "true",
		/** @returns {'hatzoth'|'arbitrary'} */
		// @ts-ignore
		tekufaMidpoint: () => ['hatzoth', 'arbitrary'].includes(settingsURLOverride("tekufa")) ? settingsURLOverride("tekufa") : 'hatzoth',
		/** @returns {'shemuel'|'adabaravah'} */
		// @ts-ignore
		tekufaCalc: () => ['shemuel', 'adabaravah'].includes(settingsURLOverride("tekufaCalc")) ? settingsURLOverride("tekufaCalc") : 'shemuel',
		// @ts-ignore
		forceSunSeasonal: () => defaultSettings("forceSunSeasonal") == "true",
	},
	/** Atmosphere-model options, edited from the location modal (assets/js/location-modal.js) */
	refraction: {
		/** move Tzet Melakha by degrees by the evening's haze (star-visibility nightfall); on by default */
		hazeTzet: () => defaultSettings("hazeTzet", "true") == "true",
		/** @returns {number | null} largest haze delay either way in minutes; null = no cap */
		hazeMaxDelay: () => {
			const raw = settingsURLOverride("hazeMaxDelay");
			if (raw == "none")
				return null;
			const minutes = parseFloat(raw);
			return Number.isFinite(minutes) && minutes >= 0 ? minutes : 15;
		},
		/** include water vapour in the refraction; off by default */
		humidity: () => defaultSettings("refrHumidity", "false") == "true",
		/** model the sea surface layer over water; off by default (unvalidated) */
		seaSurfaceLayer: () => defaultSettings("seaSurfaceLayer", "false") == "true",
	},
	customTimes: {
		candleLighting: () => parseInt(settingsURLOverride("candles")) || 20,
		tzeithIssurMelakha: () => {
			if (!(settingsURLOverride("tzeithIMmin") || "").trim() || isNaN(parseInt(settingsURLOverride("tzeithIMmin")))) {
				const retObj = {
					minutes: 30,
					degree: 7.165
				};

				// @ts-ignore
				if (settings.calendarToggle.forceSunSeasonal() && "zmanimListUpdater2" in window && !window.zmanimListUpdater2.jCal.getInIsrael())
					retObj.minutes = 40;
				return retObj;
			}

			if (!(settingsURLOverride("tzeithIMdeg") || "").trim()) {
				const geoLocation = new KosherZmanim.GeoLocation("R Ovadia's house", 31.7898742, 35.1771491, 776, "UTC")

				const aCalendar = new KosherZmanim.AstronomicalCalendar(geoLocation);
				aCalendar.setDate(Temporal.Now.plainDateISO().with({ month: 3, day: 20 }))
				const degree = aCalendar.getSunsetSolarDipFromOffset({minutes: parseInt(settingsURLOverride("tzeithIMmin")) });

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
			if (bsCSSLink && bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")
				bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.rtl.min.css")

			const mdbCSSLink = document.getElementById("mdb");
			if (mdbCSSLink && mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out-rtl.css")
				mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out-rtl.css")

			const bsrCSSLink = document.getElementById("bsr");
			if (bsrCSSLink && bsrCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap-reboot.rtl.min.css")
				bsrCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap-reboot.rtl.min.css")

			document.body.dir = "rtl";

			if (langSelectors.length) {
				langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'hebrew').forEach(btnOfGroup => btnOfGroup.checked = false);
				langSelectors.find(btnOfGroup=>btnOfGroup.id == 'hebrew').checked = true;
			}
			break;
		} case 'en-et': {
			document.body.classList.remove("lang-hb", "lang-en");
			document.body.classList.add("lang-en-et");

			const bsCSSLink = document.getElementById("bs");
			if (bsCSSLink && bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
				bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

			const mdbCSSLink = document.getElementById("mdb");
			if (mdbCSSLink && mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out.css")
				mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out.css")

			const bsrCSSLink = document.getElementById("bsr");
			if (bsrCSSLink && bsrCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")
				bsrCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")

			document.body.dir = "ltr"

			if (langSelectors.length) {
				langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'enet').forEach(btnOfGroup => btnOfGroup.checked = false);
				langSelectors.find(btnOfGroup=>btnOfGroup.id == 'enet').checked = true;
			}
			break;
		} case 'en': {
			document.body.classList.remove("lang-hb", "lang-en-et");
			document.body.classList.add("lang-en");

			const bsCSSLink = document.getElementById("bs");
			if (bsCSSLink && bsCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap.min.css")
				bsCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap.min.css")

			const mdbCSSLink = document.getElementById("mdb");
			if (mdbCSSLink && mdbCSSLink.getAttribute("href") !== "/assets/libraries/mdbootstrap/out.css")
				mdbCSSLink.setAttribute("href", "/assets/libraries/mdbootstrap/out.css")

			const bsrCSSLink = document.getElementById("bsr");
			if (bsrCSSLink && bsrCSSLink.getAttribute("href") !== "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")
				bsrCSSLink.setAttribute("href", "/assets/libraries/bootstrap/css/bootstrap-reboot.min.css")

			document.body.dir = "ltr"

			if (langSelectors.length) {
				langSelectors.filter(btnOfGroup=>btnOfGroup.id !== 'enli').forEach(btnOfGroup => btnOfGroup.checked = false);
				langSelectors.find(btnOfGroup=>btnOfGroup.id == 'enli').checked = true;
			}
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

/**
 * Save a setting to localStorage. A URL parameter of the same name would keep overriding it, so it is
 * dropped from both this page's address and the parameters the settings above read.
 * @param {string} key
 * @param {string | null} value null = remove (back to the default)
 */
function saveSetting(key, value) {
	if (value === null)
		localStorage.removeItem(key);
	else
		localStorage.setItem(key, value);

	if (urlParams.has(key)) {
		urlParams.delete(key);
		const url = new URL(window.location.href);
		url.searchParams.delete(key);
		history.replaceState(history.state, "", url);
	}
}

export {settings, handleLanguage, saveSetting}