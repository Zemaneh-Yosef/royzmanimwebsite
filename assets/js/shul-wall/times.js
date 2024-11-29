// @ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { AmudehHoraahZmanim, OhrHachaimZmanim, methodNames } from "../ROYZmanim.js";
import preSettings from "./preSettings.js";
import { reload } from "./reload.js";

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
const geoL = new GeoLocation(...glArgs);

const dateForSet = Temporal.Now.plainDateISO(preSettings.location.timezone());
const jCal = new WebsiteLimudCalendar(dateForSet);
jCal.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))

const zmanCalc =
	(preSettings.calendarToggle.hourCalculators() == "seasonal" || jCal.getInIsrael() ?
		new OhrHachaimZmanim(geoL, true) :
		new AmudehHoraahZmanim(geoL));
zmanCalc.configSettings(preSettings.calendarToggle.rtKulah(), preSettings.customTimes.tzeithIssurMelakha());
zmanCalc.setDate(dateForSet);

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
	hourCycle: preSettings.timeFormat(),
	hour: 'numeric',
	minute: '2-digit'
}];

const calList = document.querySelector('[data-zfFind="calendarFormatter"]')
const langList = calList.getAttribute('data-langPull').split(' ')
const zmanimList = Object.fromEntries(Array.from(calList.children)
	.map(timeSlot => [timeSlot.getAttribute('data-zmanid'), {
		function: timeSlot.getAttribute('data-timeGetter'),
		yomTovInclusive: timeSlot.getAttribute('data-yomTovInclusive'),
		luachInclusive: timeSlot.getAttribute('data-luachInclusive'),
		condition: timeSlot.getAttribute('data-condition'),
		title: {
			'hb': timeSlot.querySelector('span.langTV.lang-hb').innerHTML,
			'en': timeSlot.querySelector('span.langTV.lang-en').innerHTML,
			'en-et': timeSlot.querySelector('span.langTV.lang-et').innerHTML,
			ru: timeSlot.querySelector('span.langTV.lang-ru').innerHTML
		}
	}])
	.filter(
		arrayEntry =>
			arrayEntry[0] !== null
			// @ts-ignore
		&& (arrayEntry[0] == 'candleLighting' || (arrayEntry[1].function && methodNames.includes(arrayEntry[1].function)))
	))

const zmanInfoSettings = {
	hourCalculator: preSettings.calendarToggle.hourCalculators(),
	tzeithIssurMelakha: preSettings.customTimes.tzeithIssurMelakha(),
	tzeitTaanitHumra: preSettings.calendarToggle.tzeitTaanitHumra()
};

/** @type {ReturnType<typeof jCal.getZmanimInfo>} */
const timesDataList = {};
jCal.back();

for (const [yTimeName, yTimeData] of Object.entries(jCal.getZmanimInfo(true, zmanCalc, zmanimList, zmanInfoSettings))) {
	if (yTimeData.luxonObj &&
		yTimeData.display == 1
		&& Temporal.ZonedDateTime.compare(yTimeData.luxonObj, Temporal.Now.zonedDateTimeISO(preSettings.location.timezone())) == 1)
		timesDataList[yTimeName] = yTimeData;
}

jCal.setDate(dateForSet);
for (const [todTimeName, todTimeData] of Object.entries(jCal.getZmanimInfo(true, zmanCalc, zmanimList, zmanInfoSettings))) {
	if (todTimeData.luxonObj &&
		todTimeData.display == 1
		&& Temporal.ZonedDateTime.compare(todTimeData.luxonObj, Temporal.Now.zonedDateTimeISO(preSettings.location.timezone())) == 1
		&& !(todTimeName in timesDataList))
		timesDataList[todTimeName] = todTimeData;
}

jCal.setDate(dateForSet.add({ days: 1 }));
for (const [tomTimeName, tomTimeData] of Object.entries(jCal.getZmanimInfo(true, zmanCalc, zmanimList, zmanInfoSettings))) {
	if (tomTimeData.luxonObj &&
		tomTimeData.display == 1
		&& Temporal.ZonedDateTime.compare(tomTimeData.luxonObj, Temporal.Now.zonedDateTimeISO(preSettings.location.timezone())) == 1
		&& !(tomTimeName in timesDataList))
		timesDataList[tomTimeName] = tomTimeData;
}

jCal.back();

for (const elem of Array.from(calList.children)) {
	elem.remove()
}

const sortedTimes = Object.values(timesDataList).sort((a, b) => Temporal.ZonedDateTime.compare(a.luxonObj, b.luxonObj));
for (const timeData of sortedTimes) {
	const artElem = document.createElement('article');
	// @ts-ignore
	artElem.innerHTML = langList.map(lang => `<div class="langTV lang-${lang}">${timeData.title[lang]}</div>`).join('')
		+ `<div class="timeDisplayWide ${Temporal.PlainDate.compare(timeData.luxonObj, dateForSet) == 1 ? "nextDay" : ""}">
			${timeData.luxonObj.toLocaleString(...dtF)}
		</div>`;
	calList.appendChild(artElem)
}

if (calList.children.length > 10)
	calList.classList.add("needsResize")

let timeForReload = sortedTimes[0].luxonObj;
if (jCal.tomorrow().isChanukah() && ![6, 7].includes(jCal.getDayOfWeek())) {
	switch (sortedTimes[0].function) {
		case 'getTzait':
			timeForReload = timeForReload.add({ minutes: 30 });
			break;
		case 'getTzaitLechumra':
			// Rather than figure out some way to keep the previous Tzet time while Tzet Lekhumra is reloading,
			// just reload it after our extended Tzet time
			timeForReload = null;
			break;
	}
}

if (timeForReload)
	// @ts-ignore
	window.timers.zmanReload = setTimeout(
		async () => await reload(),
		Temporal.Now.zonedDateTimeISO(preSettings.location.timezone())
			.until(timeForReload).total('milliseconds') + 1000)