// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "./ROYZmanim.js";
import { settings } from "./settings/handler.js"
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js"

import {isEmojiSupported} from "../libraries/is-emoji-supported.js";
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
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);
amudehHoraahCal.configSettings(
	document.getElementById('gridElement').hasAttribute('data-force-rtkulah') ?
		document.getElementById('gridElement').getAttribute('data-force-rtkulah') == "true" :
		true,
	settings.customTimes.tzeithIssurMelakha()
);

const shabbatDate = KosherZmanim.Temporal.Now.plainDateISO().with({ day: 20 });
const jCal = new WebsiteLimudCalendar(shabbatDate)

if (jCal.getDate().dayOfWeek != 6)
	throw new Error("Non-Saturday")

for (const title of document.getElementsByClassName('shabbatTitleCore'))
	title.innerHTML += jCal.getHebrewParasha().join(" / ") + " " + jCal.formatJewishYear().hebrew

let shitot = {
	fri: document.getElementById('gridElement').getAttribute('data-functions-fri').split(" "),
	shab: document.getElementById('gridElement').getAttribute('data-functions-shab').split(" ")
}

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

	currentCalc.setDate(shabbatDate.subtract({ days: 1 }));
	for (const friShita of shitot.fri) {
		editElem = editElem.nextElementSibling

		/** @type {KosherZmanim.Temporal.ZonedDateTime} */
		// @ts-ignore
		let time = currentCalc[friShita]()
		if (elem.hasAttribute('data-humra'))
			time = time.subtract({minutes: parseInt(elem.getAttribute('data-humra'))})
		editElem.setAttribute('data-milisecondValue', time.epochMilliseconds.toString())
		editElem.innerHTML = time.toLocaleString(...dtF);
	}

	currentCalc.setDate(shabbatDate);
	for (const shabShita of shitot.shab) {
		editElem = editElem.nextElementSibling

		/** @type {KosherZmanim.Temporal.ZonedDateTime} */
		// @ts-ignore
		let time = (currentCalc[shabShita]());

		if (elem.hasAttribute('data-humra'))
			time = time.add({minutes: parseInt(elem.getAttribute('data-humra'))})
		editElem.setAttribute('data-milisecondValue', time.epochMilliseconds.toString())

		editElem.innerHTML = time.toLocaleString(...dtF);

		if (shabShita == 'getTzaitShabbath' && elem.getAttribute('data-timezone') == 'Asia/Jerusalem' && !shitot.shab.includes('getTzaitRT')) {
			let rTime = currentCalc.getTzaitRT()
			if (elem.hasAttribute('data-humra'))
				rTime = rTime.add({minutes: parseInt(elem.getAttribute('data-humra'))})

			editElem.innerHTML += ` / <span class="explanation">(${document.getElementById('gridElement').getAttribute('data-rt-text')}: ${rTime.toLocaleString(...dtF)})</span>`;
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
				for (let i of ['', ...shitot.fri, ...shitot.shab]) {
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
				currentCalc.setDate(shabbatDate.subtract({ days: 1 }));
				baseCalc.setDate(shabbatDate.subtract({ days: 1 }));
				for (const friShita of shitot.fri) {
					editElem = editElem.nextElementSibling
					baseEditElem = baseEditElem.nextElementSibling;

					const [curCalcTime, baseCalcTime] = [currentCalc, baseCalc].map(
						//@ts-ignore
						calc => calc[friShita]()
							.subtract({minutes: !baseLocation.hasAttribute('data-humra') ? 0 : parseInt(baseLocation.getAttribute('data-humra'))})
					)

					if (!Math.trunc(curCalcTime.until(baseCalcTime).total({ unit: "minute" })) || curCalcTime.until(baseCalcTime).total({ unit: "minute" }) < 0) {
						console.log("new one was later, continue")
						continue;
					}

					baseEditElem.setAttribute('data-milisecondValue', curCalcTime.epochMilliseconds.toString())
					baseEditElem.innerHTML = curCalcTime.toLocaleString(...dtF)
				}

				currentCalc.setDate(shabbatDate);
				baseCalc.setDate(shabbatDate);

				for (const shabShita of shitot.shab) {
					editElem = editElem.nextElementSibling
					baseEditElem = baseEditElem.nextElementSibling;

					const [curCalcTime, baseCalcTime] = [currentCalc, baseCalc].map(
						//@ts-ignore
						calc => (calc[shabShita]())
							.add({minutes: !baseLocation.hasAttribute('data-humra') ? 0 : parseInt(baseLocation.getAttribute('data-humra'))})
					)

					if (!Math.trunc(curCalcTime.until(baseCalcTime).total({ unit: "minute" })) || curCalcTime.until(baseCalcTime).total({ unit: "minute" }) > 0) {
						console.log("new one was earlier, continue")
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