// @ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteCalendar from "../WebsiteCalendar.js";
import { ZemanFunctions, methodNames } from "../ROYZmanim.js";
import preSettings from "./preSettings.js";
import { reload } from "./reload.js";

/** @typedef {import("../WebsiteCalendar.js").zmanInfoList} zmanInfoList */

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
const geoL = new GeoLocation(...glArgs);

const dateForSet = Temporal.Now.plainDateISO(preSettings.location.timezone());
const jCal = new WebsiteCalendar(dateForSet);
jCal.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))

const zmanCalc = new ZemanFunctions(geoL, {
	elevation: jCal.getInIsrael(),
	fixedMil: preSettings.calendarToggle.forceSunSeasonal() || jCal.getInIsrael(),
	rtKulah: preSettings.calendarToggle.rtKulah(),
	candleLighting: preSettings.customTimes.candleLighting(),
	melakha: preSettings.customTimes.tzeithIssurMelakha(),
})
zmanCalc.setDate(dateForSet);

/** @type {number[]} */
let availableVS = [];
if (typeof localStorage !== "undefined" && localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
	const ctNetz = JSON.parse(localStorage.getItem('ctNetz'))
	if ('url' in ctNetz) {
		const ctNetzLink = new URL(ctNetz.url);

		if (ctNetzLink.searchParams.get('cgi_eroslatitude') == geoL.getLatitude().toString()
		&& ctNetzLink.searchParams.get('cgi_eroslongitude') == (-geoL.getLongitude()).toString())
			availableVS = ctNetz.times
	}
}
zmanCalc.setVisualSunrise(availableVS);

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
	hourCycle: preSettings.timeFormat(),
	hour: 'numeric',
	minute: '2-digit'
}];

const calList = document.querySelector('[data-zfFind="calendarFormatter"]')
const langList = calList.getAttribute('data-langPull').split(' ')

/**
 * @param {Element} timeSlot
 * @returns {[string, zmanInfoList]}
 */
function zmanListToFormat (timeSlot) {
	/** @type {"degrees" | "seasonal"} */
	//@ts-ignore
	const luach = timeSlot.getAttribute('data-luachInclusive');

	/** @type {"earlier"|"later"|"exact"} */
	// @ts-ignore
	const round = timeSlot.getAttribute('data-round');

	return [
		timeSlot.getAttribute('data-zmanid'),
		Object.freeze({
			function: timeSlot.getAttribute('data-timeGetter'),
			yomTovInclusive: timeSlot.getAttribute('data-yomTovInclusive'),
			luachInclusive: luach,
			condition: timeSlot.getAttribute('data-condition'),
			title: Object.fromEntries(['hb', 'en', 'en-et', 'ru'].map(lang => {
				if (!timeSlot.querySelector(`span.langTV.lang-${lang}`))
					return null;

				return [lang, timeSlot.querySelector(`span.langTV.lang-${lang}`).innerHTML];
			}).filter(Boolean)),
			round,
		})
	]
}

const zmanimList = Object.fromEntries(Array.from(calList.children)
	.map(timeSlot => zmanListToFormat(timeSlot))
	.filter(
		arrayEntry =>
			arrayEntry[0] !== null
			// @ts-ignore
		&& (arrayEntry[0] == 'candleLighting' || (arrayEntry[1].function && methodNames.includes(arrayEntry[1].function)))
	))

/** @type {ReturnType<typeof jCal.getZmanimInfo>} */
const timesDataList = {};
jCal.back();

for (let index = 0; index < 3; index++) {
	zmanCalc.setDate(jCal.getDate());
	for (const [yTimeName, yTimeData] of Object.entries(jCal.getZmanimInfo(true, zmanCalc, zmanimList, dtF))) {
		if (yTimeData.zDTObj &&
			yTimeData.display == 1
			&& Temporal.ZonedDateTime.compare(yTimeData.zDTObj, Temporal.Now.zonedDateTimeISO(preSettings.location.timezone())) == 1
			&& !(yTimeName in timesDataList))
			timesDataList[yTimeName] = yTimeData;
	}

	jCal.setDate(jCal.getDate().add({ days: 1 }));
}
jCal.back();

for (const elem of Array.from(calList.children)) {
	elem.remove()
}

const sortedTimes = Object.entries(timesDataList).sort((a, b) => Temporal.ZonedDateTime.compare(a[1].zDTObj, b[1].zDTObj));
for (const timeListing of sortedTimes) {
	const timeData = timeListing[1];
	const artElem = document.createElement('article');

	const artTitles = langList.map(lang => {
		const titleElem = document.createElement('div');
		titleElem.classList.add('langTV', `lang-${lang}`);
		// @ts-ignore
		titleElem.appendChild(document.createTextNode(timeData.title[lang]));
		return titleElem;
	});
	for (const titleElem of artTitles)
		artElem.appendChild(titleElem);

	const artTime = document.createElement('div');
	artTime.appendChild(document.createTextNode(timeData.zDTObj.toLocaleString(...timeData.dtF)));
	artTime.classList.add('timeDisplayWide')
	if (Temporal.PlainDate.compare(timeData.zDTObj, dateForSet) == 1)
		artTime.classList.add("nextDay");

	artElem.appendChild(artTime);

	const curTimeIsShema = (/** @type {typeof timeData} */row) => ("hb" in row.title && row.title.hb) ? row.title.hb.startsWith("שמע")
		: row.title.en.startsWith("Shema");
	if (curTimeIsShema(timeData) && calList.hasAttribute('data-primaryShema')) {
		const shemaTimes = sortedTimes
			.map(arrayEntry => arrayEntry[1])
			.filter(curTimeIsShema)
			.map(zmanObj => zmanObj.zDTObj.toPlainDate());

		if (shemaTimes[0].equals(shemaTimes[1])) {
			if (timeData.function !== calList.getAttribute('data-primaryShema'))
				continue;

			for (const titleElem of artTitles)
				titleElem.innerHTML = titleElem.innerHTML.split(" ")[0];

			const secondShemaZmanObj = sortedTimes
				.map(arrayEntry => arrayEntry[1])
				.find(zmanObj => zmanObj.title.hb.startsWith("שמע") && zmanObj.function !== calList.getAttribute('data-primaryShema'));
			const secondShemaElem = document.createElement('div');
			secondShemaElem.classList.add('secondShemaDispl');
			secondShemaElem.appendChild(document.createTextNode('('))
			for (const lang of langList) {
				const titleSecShema = document.createElement('span');
				titleSecShema.classList.add('langTV', `lang-${lang}`);
				titleSecShema.style.unicodeBidi = 'isolate';
				// @ts-ignore
				titleSecShema.appendChild(document.createTextNode(secondShemaZmanObj.title[lang].split(" ")[1]));
				secondShemaElem.appendChild(titleSecShema);
			}
			secondShemaElem.appendChild(document.createTextNode(': ' + secondShemaZmanObj.zDTObj.toLocaleString(...dtF) + ')'))
			artElem.appendChild(secondShemaElem);
		}
	}
	calList.appendChild(artElem)
}

let timeForReload = sortedTimes[0][1].zDTObj;
if (jCal.tomorrow().isChanukah() && ![6, 7].includes(jCal.getDayOfWeek())) {
	switch (sortedTimes[0][1].function) {
		case 'getTzet':
			timeForReload = timeForReload.add({ minutes: 30 });
			break;
		case 'getTzetHumra':
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

/**
 * @param {string} str
 */
function isValidJSON(str) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}