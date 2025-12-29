// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { methodNames } from "../ROYZmanim.js";
import { reload } from "./reload.js";
import { currentZDT, jCal, zmanCalc, dtF } from "./base.js";

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

const calList = document.querySelector('[data-zfFind="calendarFormatter"]')
const langList = calList.getAttribute('data-langPull').split(' ')

/**
 * @param {Element} timeSlot
 * @returns {[string, import('../WebsiteCalendar.js').zmanInfoList]}
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
			&& Temporal.ZonedDateTime.compare(yTimeData.zDTObj, currentZDT) == 1
			&& !(yTimeName in timesDataList))
			timesDataList[yTimeName] = yTimeData;
	}

	jCal.setDate(jCal.getDate().add({ days: 1 }));
}
jCal.setDate(currentZDT.toPlainDate());

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
	if (Temporal.PlainDate.compare(timeData.zDTObj, currentZDT.toPlainDate()) == 1)
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
		currentZDT.until(timeForReload).total('milliseconds') + 1000)

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