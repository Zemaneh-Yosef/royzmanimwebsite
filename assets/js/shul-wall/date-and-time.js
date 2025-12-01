// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteCalendar from "../WebsiteCalendar.js";
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";
import { reload } from "./reload.js";

import preSettings from "./preSettings.js";

const hourElem = document.querySelector('[data-sw-hour]')
const minuteElem = document.querySelector('[data-sw-minute]')
const portElem = document.querySelector('[data-sw-portion]')

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

function updateTime() {
	const curTime = Temporal.Now.zonedDateTimeISO(preSettings.location.timezone());
	const textHour = (curTime.hour - ((curTime.hour >= 13 && portElem) ? 12 : 0)).toString().padStart(2, '0')

	if (Math.abs(parseInt(hourElem.innerHTML) - parseInt(textHour)) > 1 && !(hourElem.innerHTML == "12" && curTime.hour == 1)) {
		reload();
		return;
	}

	hourElem.childNodes.forEach(node => node.remove())
	minuteElem.childNodes.forEach(node => node.remove());

	hourElem.appendChild(document.createTextNode(textHour));
	minuteElem.appendChild(document.createTextNode(curTime.minute.toString().padStart(2, '0')));

	if (portElem) {
		portElem.childNodes.forEach(node => node.remove());
		portElem.appendChild(document.createTextNode(curTime.hour >= 12 ? "PM" : "AM"))
	}

	// @ts-ignore
	window.timers.clockUpdate =
		setTimeout(() => updateTime(), curTime.until(curTime.add({ minutes: 1 }).with({ second: 0, millisecond: 0 })).total('milliseconds'))
}
updateTime();

const dateForSet = Temporal.Now.plainDateISO(preSettings.location.timezone());
const jCal = new WebsiteCalendar(dateForSet);

const enDate = document.querySelector('[data-en-date]');
if (enDate)
	enDate.innerHTML = jCal.getDayOfTheWeek().en + ", " + jCal.dateRenderer('en').primary.text;
const ruDate = document.querySelector('[data-ru-date]');
if (ruDate)
	ruDate.innerHTML = jCal.getDate().toLocaleString('ru', { weekday: "long", day: "numeric", month: "long", year: "numeric"});
const hbDate = document.querySelector('[data-hb-date]');
hbDate.innerHTML = (jCal.getDayOfWeek() == 7 ? "שבת" : n2wordsOrdinal[jCal.getDayOfWeek()]) + ", " + jCal.formatJewishFullDate().hebrew;
