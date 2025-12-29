// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { scheduleSettings, jCal } from "./base.js";
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";
import { reload } from "./reload.js";

const hourElem = document.querySelector('[data-sw-hour]')
const minuteElem = document.querySelector('[data-sw-minute]')
const portElem = document.querySelector('[data-sw-portion]')

let minutePassed = false;

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

function updateTime() {
	const curTime = Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone);

	if (minutePassed && curTime.minute == 0 && [0, 12, 24].includes(curTime.hour)) {
		reload();
		minutePassed = false;
		return;
	}

	let local = scheduleSettings.language == 'hb' ? 'he' : 'en'
	if (navigator.languages.find(lang => lang.startsWith(local)))
		local = navigator.languages.find(lang => lang.startsWith(local));

	let hourCycle = scheduleSettings.timeFormat;
	if (portElem)
		/** @type {'h11'|'h12'} */
		// @ts-ignore
		hourCycle = hourCycle
			.replace('h23', 'h11')
			.replace('h24', 'h12');
	else
		/** @type {'h23'|'h24'} */
		// @ts-ignore
		hourCycle = hourCycle
			.replace('h11', 'h23')
			.replace('h12', 'h24');

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = [local, {
		hourCycle,
		hour: 'numeric',
		minute: '2-digit'
	}];

	const [time, AMPM] = curTime.toLocaleString(...dtF).split(' ');
	const [hourStr, minuteStr] = time.split(':');

	hourElem.childNodes.forEach(node => node.remove())
	minuteElem.childNodes.forEach(node => node.remove());

	hourElem.appendChild(document.createTextNode(hourStr));
	minuteElem.appendChild(document.createTextNode(minuteStr));

	if (portElem) {
		portElem.childNodes.forEach(node => node.remove());
		portElem.appendChild(document.createTextNode(AMPM))
	}

	// @ts-ignore
	window.timers.clockUpdate =
		setTimeout(() => {minutePassed = true; updateTime()}, curTime.until(curTime.add({ minutes: 1 }).with({ second: 0, millisecond: 0 })).total('milliseconds'))
}
updateTime();

const enDate = document.querySelector('[data-en-date]');
if (enDate)
	enDate.innerHTML = jCal.getDayOfTheWeek().en + ", " + jCal.dateRenderer('en').primary.text;
const ruDate = document.querySelector('[data-ru-date]');
if (ruDate)
	ruDate.innerHTML = jCal.getDate().toLocaleString('ru', { weekday: "long", day: "numeric", month: "long", year: "numeric"});
const hbDate = document.querySelector('[data-hb-date]');
hbDate.innerHTML = (jCal.getDayOfWeek() == 7 ? "שבת" : n2wordsOrdinal[jCal.getDayOfWeek()]) + ", " + jCal.formatJewishFullDate().hebrew;
