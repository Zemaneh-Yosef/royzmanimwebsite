// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "../ROYZmanim.js";
import { settings } from "../settings/handler.js"
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js"
import rYisraelizmanim from "./shabbat-rYisraeli.js";

import {isEmojiSupported} from "../../libraries/is-emoji-supported.js";

import { HebrewNumberFormatter, getOrdinal } from "../WebsiteCalendar.js";
import { he as n2heWords } from "../../libraries/n2words.esm.js";

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

const ohrHachaimCal = new OhrHachaimZmanim(fallbackGL, true);
ohrHachaimCal.configSettings(false, settings.customTimes.tzeithIssurMelakha());
ohrHachaimCal.coreZC.setCandleLightingOffset(20);
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);
amudehHoraahCal.configSettings(true, settings.customTimes.tzeithIssurMelakha());
amudehHoraahCal.coreZC.setCandleLightingOffset(20);
const rYisraeliCal = new rYisraelizmanim(fallbackGL);

/** @type {string[]} */
let calendars = [];
const jCal = new WebsiteLimudCalendar(5784, KosherZmanim.JewishDate.ELUL, 25)
const shabbatDate = jCal.getDate();

switch (document.getElementById('gridElement').getAttribute('data-flyerType')) {
	case 'shabbat': {
		if (jCal.getDate().dayOfWeek != 6)
			throw new Error("Non-Saturday")
		
		if (document.getElementsByClassName('shabbatTitleCore').length) {
			let parashaText = document.getElementsByClassName('shabbatTitleCore')[0].innerHTML + jCal.getHebrewParasha().join(" / ");
			if (jCal.getHebrewParasha().join(" / ") == "No Parasha this week"
			&& [5,6].includes(jCal.getDate().dayOfWeek)
			&& [KosherZmanim.JewishCalendar.NISSAN, KosherZmanim.JewishCalendar.TISHREI].includes(jCal.getJewishMonth()))
			   parashaText = "חול המועד " + (jCal.getDate().withCalendar("hebrew").month == 1 ? "סוכות" : "פסח");
			for (const title of document.getElementsByClassName('shabbatTitleCore'))
				title.innerHTML = parashaText + " " + jCal.formatJewishYear().hebrew
		}
		break;
	} case 'fast': {
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
			hebrewLocale.titleYear = jCal.getJewishDayOfMonth() == fastMonths[jCal.getJewishMonth()];
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
		break;
	} case 'shovavim': {
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
	}
}

if (['shovavim', 'fast'].includes(document.getElementById('gridElement').getAttribute('data-flyerType')) && document.getElementById('calSubtitle'))
	document.getElementById("calSubtitle").innerHTML = calendars.map(text=> `<span style="unicode-bidi: isolate;">${text}</span>`).join(" • ")

let shitotOptions = document.getElementById("gridElement")
	.getAttributeNames()
	.filter(attr => attr.startsWith('data-functions-backday'))

for (const dateDisplay of document.querySelectorAll('[data-dateRender-backday]')) {
	const dateJCal = jCal.clone();
	dateJCal.setDate(shabbatDate.subtract({ days: parseInt(dateDisplay.getAttribute('data-dateRender-backday')) }));

	dateDisplay.innerHTML = dateJCal.formatFancyDate()
}

for (const yearDisplay of document.querySelectorAll('[data-yearRender]')) {
	yearDisplay.innerHTML = jCal.getDate().year.toString()
}

const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, {elem: Element; geo: KosherZmanim.GeoLocation}>} */
const dupLocs = {}
for (const elem of elems) {
	const currentCalc = (elem.getAttribute('data-calc') == 'rYisraeli' ? rYisraeliCal :
		(elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal));
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

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = ['en', {
		// @ts-ignore
		hourCycle: elem.getAttribute("data-format"),
		hour: 'numeric',
		minute: '2-digit'
	}];

	let editElem = elem;

	for (const shitotDay of shitotOptions) {
		currentCalc.setDate(shabbatDate.subtract({ days: parseInt(shitotDay.replace('data-functions-backday-', '')) }));
		const plag = currentCalc.getPlagHaminhaHalachaBrurah();

		for (const timeFunc of document.getElementById('gridElement').getAttribute(shitotDay).split(" ")) {
			do {
				editElem = editElem.nextElementSibling
			} while (!editElem.classList.contains('timeshow'))

			/** @type {KosherZmanim.Temporal.ZonedDateTime} */
			// @ts-ignore
			let time = currentCalc[timeFunc]()

			if (document.getElementById('gridElement').getAttribute('data-flyerType') == 'shovavim') {
				// @ts-ignore
				const action = (KosherZmanim.Temporal.ZonedDateTime.compare(currentCalc[shita](), plag) == 1 ? 'add' : 'subtract')
				const times = [];
				for (let extremeDay = 0; extremeDay < 6; extremeDay++) {
					const extremeCalc = currentCalc.chainDate(currentCalc.coreZC.getDate().add({ days: extremeDay }));
					/** @type {KosherZmanim.Temporal.ZonedDateTime} */
					// @ts-ignore
					let extremeTime = extremeCalc[shita]();
					if (elem.hasAttribute('data-humra')) {
						extremeTime = extremeTime[action]({minutes: parseInt(elem.getAttribute('data-humra'))})
					}

					times.push(extremeTime)
				}

				time = times.sort(KosherZmanim.Temporal.ZonedDateTime.compare)[action == 'subtract' ? 0 : times.length - 1]
			} else {
				const LeKhumra = shitotOptions.length >= 2 ?
					shitotDay !== shitotOptions[0] : 
					KosherZmanim.Temporal.ZonedDateTime.compare(time, plag) == 1
				if (elem.hasAttribute('data-humra'))
					time = time[LeKhumra ? 'add' : 'subtract']({minutes: parseInt(elem.getAttribute('data-humra'))});
			}

			editElem.setAttribute('data-milisecondValue', time.epochMilliseconds.toString())
			editElem.innerHTML = time.toLocaleString(...dtF);

			if (timeFunc == 'getTzaitShabbath'
			 && document.getElementById('gridElement').hasAttribute('data-rt-text')
			 && !document.getElementById('gridElement').getAttribute(shitotDay).includes('getTzaitRT')) {
				let rTime = currentCalc.getTzaitRT()
				if (elem.hasAttribute('data-humra'))
					rTime = rTime.add({minutes: parseInt(elem.getAttribute('data-humra'))})
	
				editElem.innerHTML += ` / <span class="explanation">(${document.getElementById('gridElement').getAttribute('data-rt-text')}: ${rTime.toLocaleString(...dtF)})</span>`;
			}
		}
	}

	if (elem.hasAttribute('data-double-location')) {
		const stateLoc = elem.innerHTML.split(',')[1].trim()
		if (stateLoc in dupLocs) {
			const baseLocation = dupLocs[stateLoc].elem;

			const baseCalc = (baseLocation.getAttribute('data-timezone') == 'Asia/Jerusalem' ? new OhrHachaimZmanim(dupLocs[stateLoc].geo, true) : new AmudehHoraahZmanim(dupLocs[stateLoc].geo))
			baseCalc.setDate(shabbatDate);
			baseCalc.configSettings(currentCalc.rtKulah, currentCalc.shabbatObj)

			const compTimes = baseCalc.getTzaitShabbath().until(currentCalc.getTzaitShabbath()).total({ unit: 'minutes' })
			if (Math.abs(compTimes) <= 2 && elem.getAttribute('data-timezone') == baseLocation.getAttribute('data-timezone')) {
				editElem = elem;
				for (let _i of ['', ...shitotOptions.map(attrName => document.getElementById("gridElement").getAttribute(attrName).split(" ")).flat()]) {
					// @ts-ignore
					editElem.style.display = 'none';
					editElem = editElem.nextElementSibling;
				}

				baseLocation.innerHTML = [
					baseLocation.innerHTML.split(',')[0].trim(),
					elem.innerHTML.split(',')[0].trim()
				].join('/') + ', ' + stateLoc

				let baseEditElem = baseLocation;
				editElem = elem;
				for (const shitotDay of shitotOptions) {
					currentCalc.setDate(shabbatDate.subtract({ days: parseInt(shitotDay.replace('data-functions-backday-', '')) }));
					baseCalc.setDate(shabbatDate.subtract({ days: parseInt(shitotDay.replace('data-functions-backday-', '')) }));
					const plag = currentCalc.getPlagHaminhaHalachaBrurah();
			
					for (const timeFunc of document.getElementById('gridElement').getAttribute(shitotDay).split(" ")) {
						editElem = editElem.nextElementSibling;
						baseEditElem = baseEditElem.nextElementSibling;

						const [curCalcTime, baseCalcTime] = [currentCalc, baseCalc].map((calc, index) => {
							/** @type {KosherZmanim.Temporal.ZonedDateTime} */
							// @ts-ignore
							let time = calc[timeFunc]()

							if ((index == 0 ? elem : baseLocation).hasAttribute('data-humra')) {
								const LeKhumra = shitotOptions.length >= 2 ?
									parseInt(shitotDay.replace('data-functions-backday-', '')) == 0 : 
									KosherZmanim.Temporal.ZonedDateTime.compare(time, plag) == 1;
								time = time[LeKhumra ? 'add' : 'subtract']({
									minutes: parseInt((index == 0 ? elem : baseLocation).getAttribute('data-humra'))
								});
							}

							return time;
						})
			
						if (!Math.trunc(curCalcTime.until(baseCalcTime).total({ unit: "minute" })) || curCalcTime.until(baseCalcTime).total({ unit: "minute" }) < 0) {
							console.log("new one was later, continue")
							continue;
						}
	
						baseEditElem.setAttribute('data-milisecondValue', curCalcTime.epochMilliseconds.toString())
						baseEditElem.innerHTML = curCalcTime.toLocaleString(...dtF)
					}
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

for (const sefiraElement of document.querySelectorAll('[data-sefira-backday]')) {
	const omerJCal = jCal.clone();
	omerJCal.setDate(shabbatDate.subtract({ days: parseInt(sefiraElement.getAttribute('data-sefira-backday')) }).add({ days: 1 }));

	let shitaOptions = document.getElementById('gridElement')
		.getAttribute('data-functions-backday-' + parseInt(sefiraElement.getAttribute('data-sefira-backday')))
		.split(" ");

	let headerText = omerJCal.getDayOfOmer().toString();
	if (!(shitaOptions.some(shita => shita.startsWith('getTzait'))))
		headerText += ` after ${amudehHoraahCal
			.chainDate(omerJCal.getDate().subtract({ days: 1 }))
			.getTzait()
			.toLocaleString('en', { hourCycle: "h12", hour: "numeric", minute: "2-digit"})}`;

	const sefiraText = "הַיּוֹם " +  omerJCal.getOmerInfo().title.hb.mainCount + ` לָעֹמֶר` +
	(omerJCal.getDayOfOmer() >= 7 ? (`, שֶׁהֵם ` + omerJCal.getOmerInfo().title.hb.subCount.toString()) : '');

	sefiraElement.firstElementChild.appendChild(document.createTextNode(headerText));
	sefiraElement.appendChild(document.createTextNode(sefiraText))

	if (sefiraElement.hasAttribute('data-sefira-lang')) {
		const separator = document.createElement("hr");
		separator.style.setProperty('--bs-border-width', '2px');
		separator.style.opacity = 'unset';
		sefiraElement.appendChild(separator);
		const ruSefiraText = "hаём " +  omerJCal.getOmerInfo().title.ru.mainCount + ` лаóмер` +
		(omerJCal.getDayOfOmer() >= 7 ? (`, шеһэм ` + omerJCal.getOmerInfo().title.ru.subCount.toString()) : '');

		sefiraElement.appendChild(document.createTextNode(ruSefiraText.toLocaleUpperCase()))
	}
}