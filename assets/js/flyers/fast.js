// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "../ROYZmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { he as n2heWords } from "../../libraries/n2words.esm.js";

import {isEmojiSupported} from "../../libraries/is-emoji-supported.js";
import { HebrewNumberFormatter, getOrdinal } from "../WebsiteCalendar.js";
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

const jCal = new WebsiteLimudCalendar(5784, WebsiteLimudCalendar.TAMMUZ, 17);
let calendars = [];

const shovavim = window.location.href.includes('shovavim');
if (shovavim) {
	const internationalCheck = window.location.href.endsWith('/international') || window.location.href.endsWith('/international/')
	const weekNumber = jCal.shabbat().getParshah() - KosherZmanim.Parsha.VAYECHI
	const textWeekNumber = internationalCheck ? n2heWords(weekNumber) : weekNumber
	document.getElementsByClassName('shabbatTitleCore')[0].innerHTML += textWeekNumber + ` (${jCal.getHebrewParasha()})`

	const lastFastDay = jCal.getDate().add({ days: 5 })

	let englishDate = `Week of ${jCal.getDate().toLocaleString('en', { month: "long" })} ${getOrdinal(jCal.getDate().day, true)} - `
	if (jCal.getDate().month !== lastFastDay.month)
		englishDate += [lastFastDay.toLocaleString('en', { month: "long" }), getOrdinal(lastFastDay.day, true)].join(" ")
	else
		englishDate += getOrdinal(lastFastDay.day, true)

	const hnF = new HebrewNumberFormatter();
	let hebrewDate = `שבוע של ${hnF.formatHebrewNumber(jCal.getDate().withCalendar("hebrew").day)}`;
	if (jCal.getDate().withCalendar("hebrew").month !== lastFastDay.withCalendar("hebrew").month)
		hebrewDate += ` ב${jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})} עד ${hnF.formatHebrewNumber(lastFastDay.withCalendar("hebrew").day)} ב${lastFastDay.toLocaleString('he-u-ca-hebrew', {month: 'long'})}`;
	else
		hebrewDate += `-${hnF.formatHebrewNumber(lastFastDay.withCalendar("hebrew").day)} ב${jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})}`

	calendars.push(englishDate, hebrewDate);
} else {
	if (!jCal.isTaanis())
		throw new Error("Non-Fast day")

	const fastMonths = {
		[WebsiteLimudCalendar.TAMMUZ]: 17,
		[WebsiteLimudCalendar.AV]: 9,
		[WebsiteLimudCalendar.TEVES]: 10
	}

	const locales = document.getElementById('gridElement').getAttribute('data-extra-locales').split(" ").filter(Boolean)
	const hebrewLocale = {
		titleYear: false,
		addToCalendars: false,
	};

	let fastName;
	if (!(jCal.getJewishMonth() in fastMonths)) {
		/**
		 * The date of the fast doesn't correspond to the fast name, so always add the Hebrew date to our list of dates
		 * However, for the year going in the title, we don't want that in the Hebrew version (saves title width)
		 * While we explicitly want that in the English version (where the date list will be so long so we extend the width to accomodate
		 */
		fastName = (jCal.getJewishMonth() == WebsiteLimudCalendar.TISHREI ? "צום גדליה" : "תענית אסתר")
		hebrewLocale.titleYear = !!locales.length
		hebrewLocale.addToCalendars = true
	} else {
		/**
		 * The date of the fast corresponds to the fast name in most cases, so check for those.
		 * If it does, then we could add our Hebrew year to the fast name title to save a need to add the Hebrew date to the date list
		 * Thereby, the Hebrew version will have no date list - the English option will have a shorter title that the width of the Hebrew title will accomodate
		 * If not, we add in the Hebrew date to our locales. The year will always go in the title, though, due to how rare this is.
		 */
		fastName = ("צום " + n2heWords(fastMonths[jCal.getJewishMonth()]) + " ב" + jCal.formatJewishMonth().he)
			.replace(/[\u0591-\u05C7]/gu, '')
		hebrewLocale.addToCalendars = jCal.getJewishDayOfMonth() !== fastMonths[jCal.getJewishMonth()];
		hebrewLocale.titleYear = jCal.getJewishDayOfMonth() !== fastMonths[jCal.getJewishMonth()];
	}

	for (const title of document.getElementsByClassName('shabbatTitleCore'))
		title.innerHTML += fastName + (hebrewLocale.titleYear ? " " + jCal.formatJewishYear().hebrew : "")


	/*if (!window.location.href.includes('usa'))
		locales.push('fa', 'ar-u-ca-islamic-umalqura'); */

	console.log(locales)
	calendars = locales.map(loc => jCal.getDate().toLocaleString(loc, { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
	//if (!window.location.href.includes('usa'))
	//    calendars[2] = calendars[2].replace(/0/g, '۰').replace(/1/g, '۱').replace(/2/g, '۲').replace(/3/g, '۳')
	//    .replace(/4/g, '٤').replace(/5/g, '٥').replace(/6/g, '٦').replace(/7/g, '۷').replace(/8/g, '۸').replace(/9/g, '۹')

	if (hebrewLocale.addToCalendars) {
		const hnF = new HebrewNumberFormatter();
		calendars.push(`${jCal.getDayOfTheWeek().hebrew}, `
		+ (!hebrewLocale.titleYear
			? jCal.formatJewishFullDate().hebrew
			: `${hnF.formatHebrewNumber(jCal.getJewishDayOfMonth())} ${jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})}`))
	}
}

document.getElementById("subtitle").innerHTML = calendars.map(text=> `<span style="unicode-bidi: isolate;">${text}</span>`).join(" • ")

const fallbackGL = new KosherZmanim.GeoLocation("null", 0,0,0, "UTC");

const ohrHachaimCal = new OhrHachaimZmanim(fallbackGL, true);
ohrHachaimCal.setDate(jCal.getDate())
ohrHachaimCal.configSettings(false, { minutes: 30, degree: 7.14 })
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);
amudehHoraahCal.setDate(jCal.getDate())
ohrHachaimCal.configSettings(true, { minutes: 30, degree: 7.14 })

const isIsrael = (/** @type {Element} */ elem) => elem.getAttribute('data-timezone') == 'Asia/Jerusalem'

let methods = document.getElementById('gridElement').getAttribute('data-functions').split(" ");
const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, {elem: Element; geo: KosherZmanim.GeoLocation}>} */
const dupLocs = {}
for (const elem of elems) {
	const currentCalc = (isIsrael(elem) ? ohrHachaimCal : amudehHoraahCal);
	const elevation = (elem.hasAttribute('data-elevation') ? parseInt(elem.getAttribute('data-elevation')) : 0);

	const geoLocationsParams = [
		"null",
		parseFloat(elem.getAttribute("data-lat")),
		parseFloat(elem.getAttribute('data-lng')),
		elevation,
		elem.getAttribute('data-timezone')
	]
	// @ts-ignore
	currentCalc.setGeoLocation(new KosherZmanim.GeoLocation(...geoLocationsParams))
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
		do {
			editElem = editElem.nextElementSibling
		} while (!editElem.classList.contains('timeshow'))

		// @ts-ignore
		const action = (KosherZmanim.Temporal.ZonedDateTime.compare(currentCalc[shita](), plag) == 1 ? 'add' : 'subtract')
		const times = [];
		for (let extremeDay = 0; extremeDay < (shovavim ? 6 : 1); extremeDay++) {
			const extremeCalc = currentCalc.chainDate(currentCalc.coreZC.getDate().add({ days: extremeDay }));
			/** @type {KosherZmanim.Temporal.ZonedDateTime} */
			// @ts-ignore
			let time = extremeCalc[shita]();
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
		const stateLoc = elem.innerHTML.split(',')[1].trim()
		if (stateLoc in dupLocs) {
			const baseLoc = dupLocs[stateLoc].elem;

			const baseCalc = (isIsrael(baseLoc) ? new OhrHachaimZmanim(dupLocs[stateLoc].geo, true) : new AmudehHoraahZmanim(dupLocs[stateLoc].geo))
			baseCalc.setDate(jCal.getDate());
			baseCalc.configSettings(currentCalc.rtKulah, currentCalc.shabbatObj);

			const compTimes = baseCalc.getTzaitShabbath()
				.until(currentCalc.getTzaitShabbath())
				.total({ unit: 'minutes' })
			if (Math.abs(compTimes) <= 2 && elem.getAttribute('data-timezone') == baseLoc.getAttribute('data-timezone')) {
				editElem = elem;
				for (let i of ['', ...methods]) {
					// @ts-ignore
					editElem.style.display = 'none';
					editElem = editElem.nextElementSibling;
				}

				baseLoc.innerHTML = [
					baseLoc.innerHTML.split(',')[0].trim(),
					elem.innerHTML.split(',')[0].trim()
				].join('/') + ', ' + stateLoc

				let baseEditElem = baseLoc;
				editElem = elem;
				for (const shita of methods) {
					editElem = editElem.nextElementSibling
					baseEditElem = baseEditElem.nextElementSibling;

					const [curCalcTime, baseCalcTime] = [currentCalc, baseCalc].map(
						//@ts-ignore
						calc => (calc[shita]())
							.subtract({minutes: !baseLoc.hasAttribute('data-humra') ? 0 : parseInt(baseLoc.getAttribute('data-humra'))})
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
			dupLocs[stateLoc] = {elem: elem, geo:
				// @ts-ignore
				new KosherZmanim.GeoLocation(...geoLocationsParams)
			};
		}
	}
}