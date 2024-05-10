//@ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "./ROYZmanim.js";
import { HebrewNumberFormatter } from "./WebsiteCalendar.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import { settings } from "./settings/handler.js";

const hNum = new HebrewNumberFormatter();

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const jCal = new WebsiteLimudCalendar();
jCal.setDate(jCal.getDate().with({ day: 1, month: 1 }))
const zmanCalc = (
    !jCal.getInIsrael() && settings.calendarToggle.hourCalculators() == "degrees"
        ? new AmudehHoraahZmanim(geoLocation)
        : new OhrHachaimZmanim(geoLocation, true)
    );
zmanCalc.configSettings(settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha())
zmanCalc.setDate(jCal.getDate())

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const dtF = [settings.language() == 'hb' ? 'he' : 'en', {
    hourCycle: settings.timeFormat(),
    hour: 'numeric',
    minute: '2-digit'
}];

const listAllShitot = Array.from(document.querySelectorAll('[data-zyData]')).map(elem => elem.getAttribute('data-zyData'))
const baseTable = document.getElementsByClassName('tableGrid')[0];

const header = document.querySelector('[data-zyHeader] h3');
header.appendChild(document.createTextNode(geoLocation.getLocationName()))

let plainDateForLoop = jCal.getDate()
function handleShita (/** @type {string} */ shita) {
    const div = document.createElement('div');
    div.classList.add('tableCell')
    switch (shita) {
        case 'special':
            if (jCal.getDayOfWeek() === 7)
                div.appendChild(document.createTextNode(WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]))
            break;
        case 'date':
            div.innerHTML =
                jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " + jCal.getDate().toLocaleString('en', { day: 'numeric' }) + "<br>"
                + hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " + jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})
            break;
        case 'candleLighting':
            if (jCal.hasCandleLighting()) {
                if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
                    div.appendChild(document.createTextNode(zmanCalc.getCandleLighting().toLocaleString(...dtF)));
                else if (jCal.getDayOfWeek() === 7)
                    div.appendChild(document.createTextNode(zmanCalc.getTzaitShabbath().toLocaleString(...dtF)));
                else
                    div.appendChild(document.createTextNode(zmanCalc.getTzaitLechumra().toLocaleString(...dtF)));
            }
            break;
        case 'getTzaitShabbath':
            if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
                div.appendChild(document.createTextNode(zmanCalc.getTzaitShabbath().toLocaleString(...dtF)));
            }
            break;
        case 'getTzait':
            if (!jCal.isAssurBemelacha()) {
                div.appendChild(document.createTextNode(zmanCalc.getTzait().toLocaleString(...dtF)))
            }
            break;
        default:
            div.appendChild(document.createTextNode(zmanCalc[shita]().toLocaleString(...dtF)));
    }

    return div;
}

for (let mIndex = 1; mIndex < plainDateForLoop.monthsInYear + 1; mIndex++) {
    plainDateForLoop = plainDateForLoop.with({ month: mIndex });
    jCal.setDate(jCal.getDate().with({ month: mIndex }));

    baseTable.parentElement.appendChild(header.parentElement.cloneNode(true))
    /** @type {Element} */
    // @ts-ignore
    const tableFirstHalf = baseTable.cloneNode(true);
    tableFirstHalf.querySelector('[data-zyData="date"]').appendChild(document.createTextNode(plainDateForLoop.toLocaleString('en', { month: "long" })))
    for (let index = 1; index < (plainDateForLoop.daysInMonth / 2); index++) {
        jCal.setDate(jCal.getDate().with({ day: index }))
        zmanCalc.setDate(jCal.getDate());

        for (const shita of listAllShitot) {
            const cell = handleShita(shita)
            tableFirstHalf.appendChild(cell)
        }
    }
    baseTable.parentElement.appendChild(tableFirstHalf)

    baseTable.parentElement.appendChild(header.parentElement.cloneNode(true))
    /** @type {Element} */
    // @ts-ignore
    const tableSecondHalf = baseTable.cloneNode(true);
    tableSecondHalf.querySelector('[data-zyData="date"]').appendChild(document.createTextNode(plainDateForLoop.toLocaleString('en', { month: "long" })))
    for (let index = Math.ceil(plainDateForLoop.daysInMonth / 2); index < plainDateForLoop.daysInMonth + 1; index++) {
        jCal.setDate(jCal.getDate().with({ day: index }))
        zmanCalc.setDate(jCal.getDate());

        for (const shita of listAllShitot) {
            const cell = handleShita(shita)
            tableSecondHalf.appendChild(cell)
        }
    }
    baseTable.parentElement.appendChild(tableSecondHalf);
}

header.parentElement.remove();
baseTable.remove();