// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "./ROYZmanim.js";
import WebsiteCalendar from "./WebsiteCalendar.js"
import { settings } from "./settings/handler.js";

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const calc = (settings.location.timezone() == 'Asia/Jerusalem' ? new OhrHachaimZmanim(geoLocation, true) : (new AmudehHoraahZmanim(geoLocation)))
const jCal = new WebsiteCalendar()

const dateFormater = new Intl.DateTimeFormat('en', {
    hourCycle: window.location.href.includes('usa') ? "h12" : "h24",
    timeStyle: "short",
    timeZone: settings.location.timezone()
});

for (const title of document.getElementsByClassName('shabbatTitleCore')) {
    title.innerHTML = settings.location.name() + title.innerHTML + jCal.formatJewishYear().hebrew
}

let baseElem = document.getElementById("wrappedElement").firstElementChild

jCal.setJewishDate(jCal.getJewishYear(), KosherZmanim.JewishCalendar.KISLEV, 24);
calc.coreZC.setDate(jCal.getDate())
for (let i = 0; i <= 8; i++) {
    const dateElem = document.createElement('div');

    const weekday = jCal.getDate().weekdayLong
    const month = jCal.getDate().monthLong
    dateElem.innerHTML = jCal.getDate().toJSDate().toLocaleDateString()

    console.log(dateElem.innerHTML)
}