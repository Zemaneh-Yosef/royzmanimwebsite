// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js"
import { ZemanFunctions } from "../ROYZmanim.js";
import WebsiteLimudCalendar, { HebrewNumberFormatter } from "../WebsiteCalendar.js"

import {isEmojiSupported} from "../../libraries/is-emoji-supported.js";
if (isEmojiSupported("\u{1F60A}") && !isEmojiSupported("\u{1F1E8}\u{1F1ED}")) {
	const n = document.createElement("style");
	const fontName = "Twemoji Country Flags"; //BabelStone Flags
	const e = "https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.woff2"; //"https://www.babelstone.co.uk/Fonts/Download/BabelStoneFlags.ttf"
	n.textContent = `@font-face {
	  font-family: "${fontName}";
	  src: url('${e}') format('woff2');
	  font-display: swap;
	}`;
	document.head.appendChild(n)
}

const fallbackGL = new KosherZmanim.GeoLocation("null", 0,0,0, "UTC");

const ohrHachaimCal = new ZemanFunctions(fallbackGL, { elevation: true, melakha: {minutes: 30, degree: 7.165}, rtKulah: false, fixedMil: true, candleLighting: 20 });
const amudehHoraahCal = new ZemanFunctions(fallbackGL, { elevation: false, melakha: {minutes: 30, degree: 7.165}, rtKulah: true, fixedMil: false, candleLighting: 20 });

const jCal = new WebsiteLimudCalendar(ohrHachaimCal.coreZC.getDate().withCalendar("hebrew").year, 1, 13)
const dayB4ErevPesach = jCal.getDate();
const times = {
	'bedikatHametz': { date: dayB4ErevPesach, method: 'getTzet' },
	'taanitBechorotStart': { date: dayB4ErevPesach.add({ days: 1 }), method: 'getAlotHashahar' },
	'taanitBechorotEnd': { date: dayB4ErevPesach.add({ days: 1 }), method: 'getTzetHumra' },
	'achilah': { date: dayB4ErevPesach.add({ days: 1 }), method: 'getSofZemanAhilathHametz' },
	'biur': { date: dayB4ErevPesach.add({ days: 1 }), method: 'getSofZemanBiurHametz' },
	'hatzot': { date: dayB4ErevPesach.add({ days: 1 }), method: 'getHatzoth' },
	'getCandle': { date: dayB4ErevPesach.add({ days: 1 }), method: 'getCandleLighting' },
	'endFirstDay': { date: dayB4ErevPesach.add({ days: 2 }), method: 'getTzetHumra' },
	'endOutsideIsrael': { date: dayB4ErevPesach.add({ days: 3 }), method: 'getTzetMelakha' },
	'endIsrael': { date: dayB4ErevPesach.add({ days: 2 }), method: 'getTzetMelakha' },
	'hatzotMidnight': { date: dayB4ErevPesach.add({ days: 2 }), method: 'getSolarMidnight' },
}

document.getElementById("zemanehShab").innerHTML += jCal.formatJewishYear().hebrew;

const elems = document.getElementsByClassName('timecalc');
let anyIsrael = false;
for (const locationTitleElem of elems) {
	let currentCalc = amudehHoraahCal;
	if (locationTitleElem.getAttribute('data-timezone') == 'Asia/Jerusalem') {
		currentCalc = ohrHachaimCal;
		anyIsrael = true;
	}

	const elevation = (locationTitleElem.hasAttribute('data-elevation') ? parseInt(locationTitleElem.getAttribute('data-elevation')) : 0);
	const geoLocationsParams = [
		"null",
		parseFloat(locationTitleElem.getAttribute("data-lat")),
		parseFloat(locationTitleElem.getAttribute('data-lng')),
		elevation,
		locationTitleElem.getAttribute('data-timezone')
	]
	// @ts-ignore
	currentCalc.setGeoLocation(new KosherZmanim.GeoLocation(...geoLocationsParams))
	currentCalc.coreZC.setCandleLightingOffset(20);
	currentCalc.setDate(dayB4ErevPesach);

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = ['en', {
		// @ts-ignore
		hourCycle: locationTitleElem.getAttribute("data-format"),
		hour: 'numeric',
		minute: '2-digit'
	}];

	const adjustedTimes = Object.fromEntries(Object.entries(times)
		.map(([zmanName, zmanDetails]) => {
			/** @type {KosherZmanim.Temporal.ZonedDateTime} */
			// @ts-ignore
			let time = currentCalc.chainDate(zmanDetails.date)[zmanDetails.method]()
			if (locationTitleElem.hasAttribute('data-humra'))
				time = time[(zmanDetails.method.startsWith("getTzet") ? "add" : "subtract")]({
					minutes: parseInt(locationTitleElem.getAttribute('data-humra'))
				});

			return [zmanName, time];
		}));

	if (anyIsrael) {
		locationTitleElem.nextElementSibling.innerHTML =
			`זמן בדיקה (ל): ${adjustedTimes['bedikatHametz'].toLocaleString(...dtF)}<br>
			סוף זמן אכילה (י): ${adjustedTimes['achilah'].toLocaleString(...dtF)}<br>
			סוף זמן ביעור (י): ${adjustedTimes['biur'].toLocaleString(...dtF)}`;

		

		locationTitleElem.nextElementSibling.nextElementSibling.innerHTML =
			`סוף זמן תספורת: ${adjustedTimes['hatzot'].toLocaleString(...dtF)}<br>
			הדלקת נרות: ${adjustedTimes['getCandle'].toLocaleString(...dtF)}<br>
			סוף זמן אפיקמן: ${adjustedTimes['hatzotMidnight'].toLocaleString(...dtF)}`;

		locationTitleElem.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML =
			adjustedTimes['endIsrael'].toLocaleString(...dtF);
	} else {
		locationTitleElem.nextElementSibling.innerHTML =
			`<b>Bedikat Hametz after:</b> ${adjustedTimes['bedikatHametz'].toLocaleString(...dtF)}<br>
			<b>End Eating by:</b> ${adjustedTimes['achilah'].toLocaleString(...dtF)}<br>
			<b>Burn by:</b> ${adjustedTimes['biur'].toLocaleString(...dtF)}`;

		locationTitleElem.nextElementSibling.nextElementSibling.innerHTML =
			`<b>Starts:</b> ${adjustedTimes['taanitBechorotStart'].toLocaleString(...dtF)}<br>
			<b>Ends:</b> ${adjustedTimes['taanitBechorotEnd'].toLocaleString(...dtF)}`;

		locationTitleElem.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML =
			`<b>Haircut by:</b> ${adjustedTimes['hatzot'].toLocaleString(...dtF)}<br>
			<b>Candle Lighting (1<sup>st</sup> Y"T):</b> ${adjustedTimes['getCandle'].toLocaleString(...dtF)}<br>
			<b>Eat Afikoman by:</b> ${adjustedTimes['hatzotMidnight'].toLocaleString(...dtF)}`;

		locationTitleElem.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML =
			`<b>1<sup>st</sup> Y"T (Candle Lighting after):</b> ${adjustedTimes['endFirstDay'].toLocaleString(...dtF)}<br>
			<b>2<sup>nd</sup> Y"T (Havdalah after):</b> ${adjustedTimes['endOutsideIsrael'].toLocaleString(...dtF)}`;
	}
}

const lastDayYT = dayB4ErevPesach.add({ days: (anyIsrael ? 2 : 3) });
const lastDayYTjCal = new WebsiteLimudCalendar(lastDayYT);
document.getElementById("dateElement").innerHTML =
	jCal.formatFancyDate() + " - " + lastDayYTjCal.formatFancyDate() + ", " + dayB4ErevPesach.year;