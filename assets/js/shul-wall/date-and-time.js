// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteCalendar from "../WebsiteCalendar.js";
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";

const hourElem = document.querySelector('[data-sw-hour]')
const minuteElem = document.querySelector('[data-sw-minute]')
const portElem = document.querySelector('[data-sw-portion]')

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

function updateTime() {
	hourElem.childNodes.forEach(node => node.remove())
	minuteElem.childNodes.forEach(node => node.remove());

	const curTime = Temporal.Now.zonedDateTimeISO();
	const hour = (curTime.hour - ((curTime.hour >= 13 && portElem) ? 12 : 0)).toString().padStart(2, '0')

	hourElem.appendChild(document.createTextNode(hour));
	minuteElem.appendChild(document.createTextNode(curTime.minute.toString().padStart(2, '0')));

	if (portElem) {
		portElem.childNodes.forEach(node => node.remove());
		portElem.appendChild(document.createTextNode(curTime.hour >= 13 ? "PM" : "AM"))
	}

	// @ts-ignore
	window.timers.clockUpdate =
		setTimeout(() => updateTime(), curTime.until(curTime.add({ minutes: 1 }).with({ second: 0, millisecond: 0 })).total('milliseconds'))
}
updateTime();

const jCal = new WebsiteCalendar();
const enDate = document.querySelector('[data-en-date]');
enDate.innerHTML = jCal.getDayOfTheWeek().english + ", " + jCal.dateRenderer('en').primary.text;
const ruDate = document.querySelector('[data-ru-date]');
if (ruDate)
	ruDate.innerHTML = jCal.getDate().toLocaleString('ru', { weekday: "long", day: "numeric", month: "long", year: "numeric"});
const hbDate = document.querySelector('[data-hb-date]');
hbDate.innerHTML = (jCal.getDayOfWeek() == 7 ? "שבת" : n2wordsOrdinal[jCal.getDayOfWeek()]) + ", " + jCal.formatJewishFullDate().hebrew;
