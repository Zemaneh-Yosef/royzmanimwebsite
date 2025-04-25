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
	(preSettings.calendarToggle.forceSunSeasonal() || jCal.getInIsrael() ?
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
	tzeithIssurMelakha: preSettings.customTimes.tzeithIssurMelakha(),
};

/** @type {ReturnType<typeof jCal.getZmanimInfo>} */
const timesDataList = {};
jCal.back();

for (let index = 0; index < 2; index++) {
	for (const [yTimeName, yTimeData] of Object.entries(jCal.getZmanimInfo(true, zmanCalc, zmanimList, zmanInfoSettings, dtF))) {
		if (yTimeData.luxonObj &&
			yTimeData.display == 1
			&& Temporal.ZonedDateTime.compare(yTimeData.luxonObj, Temporal.Now.zonedDateTimeISO(preSettings.location.timezone())) == 1
			&& !(yTimeName in timesDataList))
			timesDataList[yTimeName] = yTimeData;
	}

	jCal.setDate(jCal.getDate().add({ days: 1 }));
}
jCal.back();

for (const elem of Array.from(calList.children)) {
	elem.remove()
}

const sortedTimes = Object.values(timesDataList).sort((a, b) => Temporal.ZonedDateTime.compare(a.luxonObj, b.luxonObj));
for (const timeData of sortedTimes) {
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
	artTime.appendChild(document.createTextNode(timeData.luxonObj.toLocaleString(...dtF)));
	artTime.classList.add('timeDisplayWide')
	if (Temporal.PlainDate.compare(timeData.luxonObj, dateForSet) == 1)
		artTime.classList.add("nextDay");

	artElem.appendChild(artTime);

	if (timeData.title.hb.startsWith("שמע") && calList.hasAttribute('data-primaryShema')) {
		const shemaTimes = sortedTimes
			.filter(time => time.title.hb.startsWith("שמע"))
			.map(zmanObj => zmanObj.luxonObj.toPlainDate());

		if (shemaTimes[0].equals(shemaTimes[1])) {
			if (timeData.function !== calList.getAttribute('data-primaryShema'))
				continue;

			for (const titleElem of artTitles)
				titleElem.innerHTML = titleElem.innerHTML.split(" ")[0];

			const secondShemaZmanObj = sortedTimes
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
			secondShemaElem.appendChild(document.createTextNode(': ' + secondShemaZmanObj.luxonObj.toLocaleString(...dtF) + ')'))
			artElem.appendChild(secondShemaElem);
		}
	}
	calList.appendChild(artElem)
}

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