// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { ZemanFunctions, zDTFromFunc, methodNames } from "../ROYZmanim.js";
import { settings } from "../settings/handler.js"
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js"

import {isEmojiSupported} from "../../libraries/is-emoji-supported.js";

import {
	HebrewNumberFormatter, getOrdinal,
	monthForLocale, daysForLocale
} from "../WebsiteCalendar.js";
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

const ohrHachaimCal = new ZemanFunctions(fallbackGL, { elevation: true, melakha: {minutes: 30, degree: null}, rtKulah: false, fixedMil: true, candleLighting: 20 });
const amudehHoraahCal = new ZemanFunctions(fallbackGL, { elevation: false, melakha: [{minutes: 27, degree: 6.75}, {minutes: 30, degree: 7.165}], rtKulah: true, fixedMil: false, candleLighting: 20 });

/** @type {string[]} */
let calendars = [];
const jCal = new WebsiteLimudCalendar();
let shabbatDate = jCal.getDate();

switch (document.getElementById('gridElement').getAttribute('data-flyerType')) {
	case 'shabbat': {
		const jCalShabbat = jCal.shabbat();
		jCalShabbat.back();

		if ((jCalShabbat.isAssurBemelacha() || jCalShabbat.tomorrow().tomorrow().isAssurBemelacha())
			&& document.getElementById('gridElement').getAttribute('data-flyerType') == 'shabbat')
			throw new Error("Surrounding-Shabbat Asur Bemelacha")

		shabbatDate = jCalShabbat.tomorrow().getDate();
		jCal.setDate(shabbatDate);

		if (document.getElementsByClassName('shabbatTitleCore').length) {
			let parashaText = document.getElementsByClassName('shabbatTitleCore')[0].innerHTML + jCal.getHebrewParasha().join(" / ");
			if (jCal.isCholHamoed())
				parashaText = "חול המועד " + (jCal.getDate().withCalendar("hebrew").month == 1 ? "סוכות" : "פסח");

			for (const title of document.getElementsByClassName('shabbatTitleCore'))
				title.innerHTML = parashaText + " " + jCal.formatJewishYear().hebrew
		}
		break;
	} case 'yomTov': {
		let tempJcal = jCal.clone();
		while (!tempJcal.isYomTovAssurBemelacha() || (tempJcal.isYomTovAssurBemelacha() && tempJcal.tomorrow().isYomTovAssurBemelacha()))
			tempJcal = tempJcal.tomorrow();

		shabbatDate = tempJcal.getDate();
		jCal.setDate(shabbatDate);
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
			fastName = (/* "צום " + */ n2heWords(fastMonths[jCal.getJewishMonth()]) + " ב" + jCal.formatJewishMonth().he)
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
			calendars.push(`${jCal.getDayOfTheWeek().hb}, `
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
	} case 'hanuka': {
		if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
			window.location.href = "/"
		}

		/** @type {[string, number, number, number, string]} */
		// @ts-ignore
		const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
		const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

		const calc = settings.location.timezone() == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal;
		calc.setGeoLocation(geoLocation);

		jCal.setJewishDate(jCal.getJewishYear(), KosherZmanim.JewishCalendar.KISLEV, 24);
		calc.setDate(jCal.getDate());

		document.getElementById('location').innerHTML = settings.location.name();

		/** @type {({ plagHamincha: KosherZmanim.Temporal.ZonedDateTime; } & ({ msg?: string; candleLighting: KosherZmanim.Temporal.ZonedDateTime } | { msg?: string; tzetShabbat: KosherZmanim.Temporal.ZonedDateTime; rt: KosherZmanim.Temporal.ZonedDateTime } | Record<string, KosherZmanim.Temporal.ZonedDateTime>))[]} */
		const timeSchedule = [];

		/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
		const timeFormatAttr = ['en', {
			hourCycle: settings.timeFormat(),
			hour: 'numeric',
			minute: '2-digit'
		}]

		for (let i = 0; i <= 7; i++) {
			const buildObj = {
				plagHamincha: calc.getPlagHaminhaHalachaBrurah()
			};

			if (jCal.getDate().dayOfWeek == 5)
				timeSchedule.push({
					...buildObj,
					candleLighting: calc.getCandleLighting()
				})
			else if (jCal.getDate().dayOfWeek == 6)
				timeSchedule.push({
					...buildObj,
					tzetShabbat: zDTFromFunc(calc.getTzetMelakha())
				})
			else {
				/** @type {typeof buildObj & Record<string, KosherZmanim.Temporal.ZonedDateTime>} */
				const ourObj = {...buildObj};
				for (const shita of ['getTzet']) {
					/** @type {KosherZmanim.Temporal.ZonedDateTime} */
					// @ts-ignore
					let time = calc[shita]();

					if (time.second >= 21)
						time = time.add({ minutes: 1 }).with({second: 0});

					ourObj[shita] = time;
				}

				timeSchedule.push(ourObj);
			}

			jCal.setDate(jCal.getDate().add({days: 1}))
			calc.setDate(calc.coreZC.getDate().add({ days: 1 }))
		}

		const pmHB = timeSchedule.map(list => list.plagHamincha)
			.sort(rZTDsort)[0]

		timeSchedule.forEach((timeObj, index) => {
			const relevantDay = document.getElementsByClassName('timeshow')[index];
			for (const [timeName, timeValue] of Object.entries(timeObj)) {
				if (timeName == 'plagHamincha')
					continue;

				relevantDay.appendChild(document.createTextNode(timeValue.toLocaleString(...timeFormatAttr)));
			}
			/*if ('msg' in timeObj)
				relevantDay.appendChild(document.createTextNode('tzetShabbat' in timeObj
					? timeObj.tzetShabbat?.toLocaleString(...timeFormatAttr)
					: timeObj.candleLighting?.toLocaleString(...timeFormatAttr)) + "<br><span class='helpText'>" + timeObj.msg + "</span>";
			else
				// @ts-ignore
				relevantDay.innerHTML = timeObj.getTzet.toLocaleString(...timeFormatAttr) */
		});
		document.querySelector('[data-plag]').innerHTML = pmHB.toLocaleString(...timeFormatAttr)

		shabbatDate = jCal.getDate().subtract({ days: 1 });
	}
}

if (['shovavim', 'fast'].includes(document.getElementById('gridElement')?.getAttribute('data-flyerType')) && document.getElementById('calSubtitle'))
	document.getElementById("calSubtitle").innerHTML = calendars.map(text=> `<span style="unicode-bidi: isolate;">${text}</span>`).join(" • ")

let shitotOptions = (document.getElementById("gridElement")?.getAttributeNames() || [])
	.filter(attr => attr.startsWith('data-functions-backday'))

for (const d8Displ of [...document.querySelectorAll('[data-dateRender-backday]'), ...document.querySelectorAll('[data-dateRenderY-backday]')]) {
	const dateJCal = jCal.clone();
	dateJCal.setDate(shabbatDate.subtract({ days: parseInt(d8Displ.getAttribute('data-dateRender-backday') || d8Displ.getAttribute('data-dateRenderY-backday')) }));

	d8Displ.innerHTML = dateJCal.formatFancyDate() + (d8Displ.hasAttribute('data-dateRenderY-backday') ? ", " + dateJCal.getGregorianYear() : "")
}

for (const d8Displ of document.querySelectorAll('[data-dateRenderSY-backday]')) {
	const d8jCal = jCal.clone();
	d8jCal.setDate(shabbatDate.subtract({ days: parseInt(d8Displ.getAttribute('data-dateRenderSY-backday')) }));

	d8Displ.innerHTML =
		`${daysForLocale('en')[d8jCal.getDate().dayOfWeek]}, ${monthForLocale('en', 'short')[d8jCal.getDate().month]} ${getOrdinal(d8jCal.getDate().day, true)}, ${d8jCal.getGregorianYear()}`;
}

for (const d8Displ of document.querySelectorAll('[data-dateRenderFormal-backday]')) {
	const d8jCal = jCal.clone();
	d8jCal.setDate(shabbatDate.subtract({ days: parseInt(d8Displ.getAttribute('data-dateRenderFormal-backday')) }));

	d8Displ.innerHTML = jCal.dateRenderer('en').primary.text;
}

for (const yearDisplay of document.querySelectorAll('[data-yearRender]')) {
	const yNum = jCal.getDate().withCalendar(yearDisplay.getAttribute('data-yearRender').replace('Parsed', '')).year
	if (yearDisplay.getAttribute('data-yearRender').endsWith('Parsed'))
		yearDisplay.innerHTML = new HebrewNumberFormatter().formatHebrewNumber(yNum)
	else
		yearDisplay.innerHTML = yNum.toString()
}

const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, {elem: Element; geo: KosherZmanim.GeoLocation}>} */
const dupLocs = {}
for (const elem of elems) {
	const currentCalc = elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal;
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

	/** @type {HTMLElement} */
	// @ts-ignore
	let editElem = elem;

	for (const shitotDay of shitotOptions) {
		currentCalc.setDate(shabbatDate.subtract({ days: parseInt(shitotDay.replace('data-functions-backday-', '')) }));
		const plag = currentCalc.getPlagHaminhaHalachaBrurah();

		for (const timeFunc of document.getElementById('gridElement').getAttribute(shitotDay).split(" ")) {
			do {
				// @ts-ignore
				editElem = editElem.nextElementSibling
			} while (!editElem.classList.contains('timeshow'))

			/** @type {KosherZmanim.Temporal.ZonedDateTime} */
			// @ts-ignore
			let time = zDTFromFunc(currentCalc[timeFunc]())

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

				if (elem.hasAttribute('data-humra') && (!editElem.hasAttribute('data-humra') || editElem.getAttribute('data-humra') !== "false"))
					time = time[LeKhumra ? 'add' : 'subtract']({minutes: parseInt(elem.getAttribute('data-humra'))});
			}

			editElem.innerHTML = time.toLocaleString(...dtF);

			for (const attr in editElem.dataset) {
				const [functionName, prefOrSuf] = attr.split(/(?<![A-Z])(?=[A-Z])/);
				if (!functionName.startsWith('get') || prefOrSuf !== 'Prefix')
					continue;

				const methodName = methodNames.find(name => name.toLowerCase() == functionName.toLowerCase());
				/** @type {KosherZmanim.Temporal.ZonedDateTime} */
				// @ts-ignore
				let subTime = currentCalc[methodName]();

				const LeKhumra = shitotOptions.length >= 2 ?
					shitotDay !== shitotOptions[0] :
					KosherZmanim.Temporal.ZonedDateTime.compare(time, plag) == 1

				if (elem.hasAttribute('data-humra') && (!editElem.hasAttribute('data-humra') || editElem.getAttribute('data-humra') !== "false"))
					subTime = subTime[LeKhumra ? 'add' : 'subtract']({minutes: parseInt(elem.getAttribute('data-humra'))});

				editElem.innerHTML += `<div class="addOn">${[
					editElem.dataset[attr],
					subTime.toLocaleString(...dtF),
					editElem.getAttribute('data-' + functionName + '-suffix')
				].join('')}</div>`;
			}

			editElem.setAttribute('data-milisecondValue', time.epochMilliseconds.toString())
		}
	}

	if (elem.hasAttribute('data-double-location')) {
		const stateLoc = elem.innerHTML.split(',')[1].trim()
		if (stateLoc in dupLocs) {
			const baseLocation = dupLocs[stateLoc].elem;

			const baseCalc = new ZemanFunctions(dupLocs[stateLoc].geo,
				baseLocation.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal.config : amudehHoraahCal.config)
			baseCalc.setDate(shabbatDate);

			const compTimes = zDTFromFunc(baseCalc.getTzetMelakha()).until(zDTFromFunc(currentCalc.getTzetMelakha())).total({ unit: 'minutes' })
			if (Math.abs(compTimes) <= 2 && elem.getAttribute('data-timezone') == baseLocation.getAttribute('data-timezone')) {
				// @ts-ignore
				editElem = elem;
				for (let _i of ['', ...shitotOptions.map(attrName => document.getElementById("gridElement").getAttribute(attrName).split(" ")).flat()]) {
					// @ts-ignore
					editElem.style.display = 'none';
					// @ts-ignore
					editElem = editElem.nextElementSibling;
				}

				baseLocation.innerHTML = [
					baseLocation.innerHTML.split(',')[0].trim(),
					elem.innerHTML.split(',')[0].trim()
				].join('/') + ', ' + stateLoc

				let baseEditElem = baseLocation;
				// @ts-ignore
				editElem = elem;
				for (const shitotDay of shitotOptions) {
					currentCalc.setDate(shabbatDate.subtract({ days: parseInt(shitotDay.replace('data-functions-backday-', '')) }));
					baseCalc.setDate(shabbatDate.subtract({ days: parseInt(shitotDay.replace('data-functions-backday-', '')) }));
					const plag = currentCalc.getPlagHaminhaHalachaBrurah();

					for (const timeFunc of document.getElementById('gridElement').getAttribute(shitotDay).split(" ")) {
						// @ts-ignore
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
	if (!(shitaOptions.some(shita => shita.startsWith('getTzet'))))
		headerText += ` after ${amudehHoraahCal
			.chainDate(omerJCal.getDate().subtract({ days: 1 }))
			.getTzet()
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

if (document.getElementById('gridElement').hasAttribute('data-hasMakam')) {
	const makamObj = await (await fetch("/assets/js/makamObj.json")).json();
	const makamIndex = new KosherZmanim.Makam(makamObj.sefarimList);

	const makam = makamIndex.getTodayMakam(jCal);
	for (const makamContainer of document.querySelectorAll('[data-makam]'))
		makamContainer.innerHTML += makam.makam
			.map(mak => (typeof mak == "number" ? makamObj.makamNameMapEng[mak] : mak))
			.join(" / ");
} else {
	for (const makamContainer of document.querySelectorAll('[data-makam]'))
		// @ts-ignore
		makamContainer.style.display = "none";
}

for (const haftara of document.querySelectorAll('[data-haftara]')) {
	const haftaraText = KosherZmanim.Haftara.getThisWeeksHaftarah(jCal).text;
	haftara.innerHTML += (haftaraText.length ? haftaraText : "No Haftara");
}

/**
 * @param {string | KosherZmanim.Temporal.ZonedDateTime | KosherZmanim.Temporal.ZonedDateTimeLike} a
 * @param {string | KosherZmanim.Temporal.ZonedDateTime | KosherZmanim.Temporal.ZonedDateTimeLike} b
 */
function rZTDsort(a,b) {
	const pSort = KosherZmanim.Temporal.ZonedDateTime.compare(a, b);
	return pSort * -1;
}
