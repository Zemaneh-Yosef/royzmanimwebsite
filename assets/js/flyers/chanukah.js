// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js"
import { ZemanFunctions, zDTFromFunc } from "../ROYZmanim.js";
import WebsiteCalendar from "../WebsiteCalendar.js"
import { settings } from "../settings/handler.js";

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const jCal = new WebsiteCalendar()
jCal.setInIsrael(settings.location.timezone() == 'Asia/Jerusalem')
const calc = new ZemanFunctions(geoLocation, {
	elevation: jCal.getInIsrael(),
	fixedMil: settings.calendarToggle.forceSunSeasonal() || jCal.getInIsrael(),
	melakha: settings.customTimes.tzeithIssurMelakha(),
	candleLighting: settings.customTimes.candleLighting(),
	rtKulah: settings.calendarToggle.rtKulah()
})

for (const title of document.getElementsByClassName('shabbatTitleCore')) {
	title.innerHTML = [
		`<span style="font-size: 0.85em">${settings.location.name().toLowerCase().replace(/ /g, '  ')}</span>`,
		title.innerHTML,
		jCal.formatJewishYear().hebrew
	].join('')
}

let shitot = document.getElementById("innerDisplay").firstElementChild.getAttribute("data-columns").split(" ");

jCal.setJewishDate(jCal.getJewishYear(), KosherZmanim.JewishCalendar.KISLEV, 24);
calc.setDate(jCal.getDate());

/** @type {Record<string, { plagHamincha: KosherZmanim.Temporal.ZonedDateTime; msg?: string } & ({ candleLighting: KosherZmanim.Temporal.ZonedDateTime } | { tzetShabbat: KosherZmanim.Temporal.ZonedDateTime; rt: KosherZmanim.Temporal.ZonedDateTime } | Record<string, KosherZmanim.Temporal.ZonedDateTime>)>} */
const timeSchedule = {};

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
		timeSchedule[jCal.formatFancyDate()] = {
			...buildObj,
			candleLighting: calc.getCandleLighting(),
			msg: '(Light Chanukah Candles before Shabbat Candles)'
		}
	else if (jCal.getDate().dayOfWeek == 6)
		timeSchedule[jCal.formatFancyDate()] = {
			...buildObj,
			tzetShabbat: zDTFromFunc(calc.getTzetMelakha()),
			rt: calc.getTzetRT(),
			msg: '(At home, make Havdalah before lighting Chanukah Candles)'
		}
	else {
		timeSchedule[jCal.formatFancyDate()] = buildObj;
		for (const shita of shitot) {
			/** @type {KosherZmanim.Temporal.ZonedDateTime} */
			// @ts-ignore
			let time = calc[shita]();

			if (time.second >= 21)
				time = time.add({ minutes: 1 }).with({second: 0});

			// @ts-ignore
			timeSchedule[jCal.formatFancyDate()][shita] = time;
		}
	}

	jCal.setDate(jCal.getDate().add({days: 1}))
	calc.setDate(calc.coreZC.getDate().add({ days: 1 }))
}

const pmHB = Object.values(timeSchedule)
	.map(list => list.plagHamincha)
	.sort(rZTDsort)[0]

document.getElementById("plagElement").innerHTML =
	`(One who cannot wait until this time may light no earlier than "Plag Hamincha HB" [${pmHB.toLocaleString(...timeFormatAttr)}])`

let index = 1;
let baseElem = document.getElementById("innerDisplay").firstElementChild.lastElementChild;
for (const [day, times] of Object.entries(timeSchedule)) {
	const image = document.createElement('img');
	image.src = `/assets/images/hanukah/menorah-${index}.png`

	const dateElem = document.createElement('div');
	dateElem.classList.add('shabbatRow')
	dateElem.appendChild(image)
	dateElem.appendChild(document.createTextNode(day))

	baseElem.insertAdjacentElement('afterend', dateElem);
	baseElem = dateElem;

	if ("msg" in times) {
		dateElem.style.lineHeight = "1";
		dateElem.appendChild(document.createElement('br'))

		const explanation = document.createElement('span')
		explanation.classList.add('explanation');
		explanation.appendChild(document.createTextNode(times.msg));
		dateElem.appendChild(explanation);

		const timeContElem = document.createElement('div');
		timeContElem.classList.add("timeshow", "shabbatRow");
		timeContElem.style.height = "100%"
		timeContElem.style.gridColumnEnd = "span " + shitot.length

		const timeElem = document.createElement('span')
		timeElem.appendChild(document.createTextNode(
			"candleLighting" in times
				? times.candleLighting.toLocaleString(...timeFormatAttr)
				: times.tzetShabbat.toLocaleString(...timeFormatAttr) + ` (RT: ${times.rt.toLocaleString(...timeFormatAttr)})`
		));

		timeContElem.appendChild(timeElem)
		dateElem.insertAdjacentElement('afterend', timeContElem)
		baseElem = timeContElem;
	} else {
		const cleanTimes = Object.keys(times);
		cleanTimes.splice(cleanTimes.indexOf("plagHamincha"), 1);
		for (const lightTimeName of cleanTimes) {
			const lightElem = document.createElement('div');
			lightElem.classList.add("timeshow", "shabbatRow");
			// @ts-ignore
			lightElem.append(document.createTextNode(times[lightTimeName].toLocaleString(...timeFormatAttr)))

			baseElem.insertAdjacentElement('afterend', lightElem)
			baseElem = lightElem;
		}
	}

	index++;
}

/**
 * @param {string | KosherZmanim.Temporal.ZonedDateTime | KosherZmanim.Temporal.ZonedDateTimeLike} a
 * @param {string | KosherZmanim.Temporal.ZonedDateTime | KosherZmanim.Temporal.ZonedDateTimeLike} b
 */
function rZTDsort(a,b) {
	const pSort = KosherZmanim.Temporal.ZonedDateTime.compare(a, b);
	return pSort * -1;
}