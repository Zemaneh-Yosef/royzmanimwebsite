// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "../ROYZmanim.js";
import { settings } from "../settings/handler.js"
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js"
import rYisraelizmanim from "./shabbat-rYisraeli.js";

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

const ohrHachaimCal = new OhrHachaimZmanim(fallbackGL, true);
ohrHachaimCal.configSettings(false, settings.customTimes.tzeithIssurMelakha());
ohrHachaimCal.coreZC.setCandleLightingOffset(20);
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);
amudehHoraahCal.configSettings(true, settings.customTimes.tzeithIssurMelakha());
amudehHoraahCal.coreZC.setCandleLightingOffset(20);
const rYisraeliCal = new rYisraelizmanim(fallbackGL);

const shabbatDate = KosherZmanim.Temporal.Now.plainDateISO().with({ day: 27 });
const jCal = new WebsiteLimudCalendar(shabbatDate)

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

let shitotOptions = document.getElementById("gridElement")
	.getAttributeNames()
	.filter(attr => attr.startsWith('data-functions-backday'))

if (document.getElementById("dateElement")) {
	const earliestDay = shabbatDate.subtract({ days: parseInt(shitotOptions[0].replace('data-functions-backday-', '')) });
	const earliestJCal = new WebsiteLimudCalendar(earliestDay)
	document.getElementById("dateElement").innerHTML = earliestJCal.formatFancyDate() + " - " + jCal.formatFancyDate() + ", " + earliestDay.year;
}

const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, {elem: Element; geo: KosherZmanim.GeoLocation}>} */
const doubleLocations = {}
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

			const LeKhumra = shitotOptions.length >= 2 ?
				shitotDay !== shitotOptions[0] : 
				KosherZmanim.Temporal.ZonedDateTime.compare(time, plag) == 1
			if (elem.hasAttribute('data-humra'))
				time = time[LeKhumra ? 'add' : 'subtract']({minutes: parseInt(elem.getAttribute('data-humra'))});

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
		const stateLocation = elem.innerHTML.split(',')[1].trim()
		if (stateLocation in doubleLocations) {
			const baseLocation = doubleLocations[stateLocation].elem;

			const baseCalc = (baseLocation.getAttribute('data-timezone') == 'Asia/Jerusalem' ? new OhrHachaimZmanim(doubleLocations[stateLocation].geo, true) : new AmudehHoraahZmanim(doubleLocations[stateLocation].geo))
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
				].join('/') + ', ' + stateLocation

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

							const LeKhumra = shitotOptions.length >= 2 ?
								parseInt(shitotDay.replace('data-functions-backday-', '')) == 0 : 
								KosherZmanim.Temporal.ZonedDateTime.compare(time, plag) == 1;
							if ((index == 0 ? elem : baseLocation).hasAttribute('data-humra'))
								time = time[LeKhumra ? 'add' : 'subtract']({
									minutes: parseInt((index == 0 ? elem : baseLocation).getAttribute('data-humra'))
								});

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
			doubleLocations[stateLocation] = {elem: elem, geo:
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

for (const dateDisplay of document.querySelectorAll('[data-dateRender-backday]')) {
	const dateJCal = jCal.clone();
	dateJCal.setDate(shabbatDate.subtract({ days: parseInt(dateDisplay.getAttribute('data-dateRender-backday')) }));

	dateDisplay.innerHTML = dateJCal.formatFancyDate()
}