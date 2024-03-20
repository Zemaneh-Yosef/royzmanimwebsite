// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "./ROYZmanim.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import n2words from "../libraries/n2words.esm.js";

import {isEmojiSupported} from "../libraries/is-emoji-supported.js";
import { HebrewNumberFormatter, getOrdinal } from "./WebsiteCalendar.js";
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

const jCal = new WebsiteLimudCalendar(5784, WebsiteLimudCalendar.ADAR_II, 11);
let calendars = [];

const shovavim = window.location.href.includes('shovavim');
if (shovavim) {
	jCal.setDate(KosherZmanim.Temporal.Now.plainDateISO().with({ day: 28 }));

	const internationalCheck = window.location.href.endsWith('/international') || window.location.href.endsWith('/international/')
	const weekNumber = jCal.shabbat().getParshah() - KosherZmanim.Parsha.VAYECHI
	const textWeekNumber = internationalCheck ? n2words(weekNumber) : weekNumber
	document.getElementsByClassName('shabbatTitleCore')[0].innerHTML += textWeekNumber + ` (${jCal.getHebrewParasha()})`

	const lastFastDay = jCal.getDate().add({ days: 5 })

	let englishDate = `Week of ${jCal.getDate().toLocaleString('en', { month: "long" })} ${getOrdinal(jCal.getDate().day, true)} - `
	if (jCal.getDate().month !== lastFastDay.month)
		englishDate += [lastFastDay.toLocaleString('en', { month: "long" }), getOrdinal(lastFastDay.day, true)].join(" ")
	else
		englishDate += getOrdinal(lastFastDay.day, true)

	const hnF = new HebrewNumberFormatter();
	let hebrewDate;
	if (jCal.getDate().withCalendar("hebrew").month !== lastFastDay.withCalendar("hebrew").month)
		hebrewDate = `שבוע של ${hnF.formatHebrewNumber(jCal.getDate().withCalendar("hebrew").day)} ב${jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})} עד ${hnF.formatHebrewNumber(lastFastDay.withCalendar("hebrew").day)} ב${lastFastDay.toLocaleString('he-u-ca-hebrew', {month: 'long'})}`;
	else
		hebrewDate = `שבוע של ${hnF.formatHebrewNumber(jCal.getDate().withCalendar("hebrew").day)}-${hnF.formatHebrewNumber(lastFastDay.withCalendar("hebrew").day)} ב${jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})}`

	calendars.push(englishDate, hebrewDate);
} else {
	if (!jCal.isTaanis())
		throw new Error("Non-Fast day")

	const fastMonths = {
		[WebsiteLimudCalendar.TAMMUZ]: 17,
		[WebsiteLimudCalendar.AV]: 9,
		[WebsiteLimudCalendar.TEVES]: 10
	}

	let fastName;
	if (!(jCal.getJewishMonth() in fastMonths))
		fastName = (jCal.getJewishMonth() == WebsiteLimudCalendar.TISHREI ? "צום גדליה" : "תענית אסתר")
	else
		fastName = ("צום " + n2words(fastMonths[jCal.getJewishMonth()]) + " ב" + jCal.formatJewishMonth().he)

	for (const title of document.getElementsByClassName('shabbatTitleCore'))
		title.innerHTML += fastName + " " + jCal.formatJewishYear().hebrew

	const locales = [];
	if (window.location.href.includes('usa') || window.location.href.includes('ltr') || window.location.href.includes('east'))
		locales.push('en');
	/*if (!window.location.href.includes('usa'))
		locales.push('fa', 'ar-u-ca-islamic-umalqura'); */

	calendars = locales.map(loc => jCal.getDate().toLocaleString(loc, { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
	//if (!window.location.href.includes('usa'))
	//    calendars[2] = calendars[2].replace(/0/g, '۰').replace(/1/g, '۱').replace(/2/g, '۲').replace(/3/g, '۳').replace(/4/g, '٤').replace(/5/g, '٥').replace(/6/g, '٦').replace(/7/g, '۷').replace(/8/g, '۸').replace(/9/g, '۹')

	if (!(jCal.getJewishMonth() in fastMonths)) {
		const hnF = new HebrewNumberFormatter();
		calendars.push(`${jCal.getDayOfTheWeek().hebrew}, ${hnF.formatHebrewNumber(jCal.getJewishDayOfMonth())} ${jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})}`)
	}
}

document.getElementById("subtitle").innerHTML = calendars.map(text=> `<span style="unicode-bidi: isolate;">${text}</span>`).join(" • ")

const fallbackGL = new KosherZmanim.GeoLocation("null", 0,0,0, "UTC");

const ohrHachaimCal = new OhrHachaimZmanim(fallbackGL, true);
ohrHachaimCal.setDate(jCal.getDate())
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);
amudehHoraahCal.setDate(jCal.getDate())

let methods = document.getElementById('gridElement').getAttribute('data-functions').split(" ");
const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, {elem: Element; geo: KosherZmanim.GeoLocation}>} */
const doubleLocations = {}
for (const elem of elems) {
	const currentCalc = (elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal);
	const elevation = (elem.hasAttribute('data-elevation') ? parseInt(elem.getAttribute('data-elevation')) : 0);

	const geoLocationsParams = [
		"null",
		parseFloat(elem.getAttribute("data-lat")),
		parseFloat(elem.getAttribute('data-lng')),
		elevation,
		elem.getAttribute('data-timezone')
	]
	// @ts-ignore
	currentCalc.coreZC.setGeoLocation(new KosherZmanim.GeoLocation(...geoLocationsParams))
	currentCalc.coreZC.setCandleLightingOffset(20);

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = ['en', {
		// @ts-ignore
		hourCycle: elem.getAttribute("data-format"),
		hour: 'numeric',
		minute: '2-digit'
	}];

	let editElem = elem;

	const plag = currentCalc.getPlagHaminhaHalachaBrurah();
	for (const shita of methods) {
		editElem = editElem.nextElementSibling

		// @ts-ignore
		const action = (KosherZmanim.Temporal.ZonedDateTime.compare(currentCalc[shita](), plag) == 1 ? 'add' : 'subtract')
		const times = [];
		for (let extremeDay = 0; extremeDay < (shovavim ? 6 : 1); extremeDay++) {
			const extremeCalc = currentCalc.chainDate(currentCalc.coreZC.getDate().add({ days: extremeDay }));
			/** @type {KosherZmanim.Temporal.ZonedDateTime} */
			// @ts-ignore
			let time = (shita == 'getTzaitShabbath' ? extremeCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 }) : extremeCalc[shita]());
			if (elem.hasAttribute('data-humra')) {
				time = time[action]({minutes: parseInt(elem.getAttribute('data-humra'))})
			}

			times.push(time)
		}

		const finalTime = times.sort(KosherZmanim.Temporal.ZonedDateTime.compare)[action == 'subtract' ? 0 : times.length - 1]
		editElem.setAttribute('data-milisecondValue', finalTime.epochMilliseconds.toString())
		editElem.innerHTML = finalTime.toLocaleString(...dtF);
	}

	if (elem.hasAttribute('data-double-location')) {
		const stateLocation = elem.innerHTML.split(',')[1].trim()
		if (stateLocation in doubleLocations) {
			const baseLocation = doubleLocations[stateLocation].elem;

			const baseCalc = (baseLocation.getAttribute('data-timezone') == 'Asia/Jerusalem' ? new OhrHachaimZmanim(doubleLocations[stateLocation].geo, true) : new AmudehHoraahZmanim(doubleLocations[stateLocation].geo))
			baseCalc.setDate(jCal.getDate());

			const compTimes = baseCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 }).until(currentCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 })).total({ unit: 'minutes' })
			if (Math.abs(compTimes) <= 2 && elem.getAttribute('data-timezone') == baseLocation.getAttribute('data-timezone')) {
				editElem = elem;
				for (let i of ['', ...methods]) {
					// @ts-ignore
					editElem.style.display = 'none';
					editElem = editElem.nextElementSibling;
				}

				baseLocation.innerHTML = [
					baseLocation.innerHTML.split(',')[0].trim(),
					elem.innerHTML.split(',')[0].trim()
				].join('/') + ', ' + stateLocation

				let baseEditElem = baseLocation;
				editElem = elem;
				for (const shita of methods) {
					editElem = editElem.nextElementSibling
					baseEditElem = baseEditElem.nextElementSibling;

					const [curCalcTime, baseCalcTime] = [currentCalc, baseCalc].map(
						//@ts-ignore
						calc => (shita == 'getTzaitShabbath' ? calc.getTzaitShabbath({ minutes: 30, degree: 7.14 }) : calc[shita]())
							.subtract({minutes: !baseLocation.hasAttribute('data-humra') ? 0 : parseInt(baseLocation.getAttribute('data-humra'))})
					)

					if (!Math.trunc(curCalcTime.until(baseCalcTime).total({ unit: "minute" })) || curCalcTime.until(baseCalcTime).total({ unit: "minute" }) < 0) {
						console.log("new one was later, continue")
						continue;
					}

					baseEditElem.setAttribute('data-milisecondValue', curCalcTime.epochMilliseconds.toString())
					baseEditElem.innerHTML = curCalcTime.toLocaleString(...dtF)
				}
			}
		} else {
			doubleLocations[stateLocation] = {elem: elem, geo:
				// @ts-ignore
				new KosherZmanim.GeoLocation(...geoLocationsParams)
			};
		}
	}
}