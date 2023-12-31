// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "./ROYZmanim.js";
import WebsiteCalendar from "./WebsiteCalendar.js"
import n2words from "../libraries/n2words.js";

import {isEmojiSupported} from "../libraries/is-emoji-supported.js";
if (isEmojiSupported("\u{1F60A}") && !isEmojiSupported("\u{1F1E8}\u{1F1ED}")) {
    const n = document.createElement("style");
    const fontName = "Twemoji Country Flags"; //BabelStone Flags
    const e = "https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.woff2"; //"https://www.babelstone.co.uk/Fonts/Download/BabelStoneFlags.ttf"
    n.textContent = `@font-face {
      font-family: "${fontName}";
      src: url('${e}') format('woff2');
      font-display: swap;
    }`;
    document.head.appendChild(n)
}

const jCal = new WebsiteCalendar(5784, 10, 10);
const fastDate = jCal.getDate();

if (!jCal.isTaanis())
    throw new Error("Non-Saturday")

let fastName;
const fastMonths = {
    [WebsiteCalendar.TAMMUZ]: 17,
    [WebsiteCalendar.AV]: 9,
    [WebsiteCalendar.TEVES]: 10
}
if (!(jCal.getJewishMonth() in fastMonths))
    fastName = (jCal.getJewishMonth() == WebsiteCalendar.TISHREI ? "צום גדליה" : "תענית אסתר")
else
    fastName = ("צום " + n2words(fastMonths[jCal.getJewishMonth()]) + " ב" + jCal.formatJewishMonth().hebrew)

for (const title of document.getElementsByClassName('shabbatTitleCore'))
    title.innerHTML += fastName + " " + jCal.formatJewishYear().hebrew

const locales = [];
if (window.location.href.includes('usa') || window.location.href.includes('ltr'))
    locales.push('en');
/*if (!window.location.href.includes('usa'))
    locales.push('fa', 'ar-u-ca-islamic-umalqura'); */

const calendars = locales.map(loc => jCal.getDate().toLocaleString(loc, { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
//if (!window.location.href.includes('usa'))
//    calendars[2] = calendars[2].replace(/0/g, '۰').replace(/1/g, '۱').replace(/2/g, '۲').replace(/3/g, '۳').replace(/4/g, '٤').replace(/5/g, '٥').replace(/6/g, '٦').replace(/7/g, '۷').replace(/8/g, '۸').replace(/9/g, '۹')

if (!(jCal.getJewishMonth() in fastMonths))
    calendars.push(`${jCal.getDayOfTheWeek().hebrew}, ${jCal.formatJewishFullDate().hebrew}`)

document.getElementById("subtitle").innerHTML = calendars.map(text=> `<span style="unicode-bidi: isolate;">${text}</span>`).join(" • ")

const fallbackGL = new KosherZmanim.GeoLocation("null", 0,0,0, "UTC");

const ohrHachaimCal = new OhrHachaimZmanim(fallbackGL, true);
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);

let methods = document.getElementById('gridElement').getAttribute('data-functions').split(" ");
const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, {elem: Element; geo: KosherZmanim.GeoLocation}>} */
const doubleLocations = {}
for (const elem of elems) {
    const currentCalc = (elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal);
    const elevation = (elem.hasAttribute('data-elevation') ? parseInt(elem.getAttribute('data-elevation')) : 0);

    const geoLocationsParams = [
        "null",
        parseFloat(elem.getAttribute("data-lat")),
        parseFloat(elem.getAttribute('data-lng')),
        elevation,
        elem.getAttribute('data-timezone')
    ]
    // @ts-ignore
    currentCalc.coreZC.setGeoLocation(new KosherZmanim.GeoLocation(...geoLocationsParams))
    currentCalc.coreZC.setCandleLightingOffset(20);

    /** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
    const dtF = ['en', {
        hourCycle: window.location.href.includes('usa') ? "h12" : "h24",
        hour: 'numeric',
        minute: '2-digit'
    }];

    let editElem = elem;

    currentCalc.setDate(fastDate);
    const sunset = currentCalc.getShkiya();
    for (const shita of methods) {
        editElem = editElem.nextElementSibling

        /** @type {KosherZmanim.Temporal.ZonedDateTime} */
        // @ts-ignore
        let time = (shita == 'getTzaitShabbath' ? currentCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 }) : currentCalc[shita]());
        if (elem.hasAttribute('data-humra')) {
            const action = (KosherZmanim.Temporal.ZonedDateTime.compare(time, sunset) == 1 ? 'add' : 'subtract')
            time = time[action]({minutes: parseInt(elem.getAttribute('data-humra'))})
        }
        editElem.setAttribute('data-milisecondValue', time.epochMilliseconds.toString())
        editElem.innerHTML = time.toLocaleString(...dtF);
    }

    if (elem.hasAttribute('data-double-location')) {
        const stateLocation = elem.innerHTML.split(',')[1].trim()
        if (stateLocation in doubleLocations) {
            const baseLocation = doubleLocations[stateLocation].elem;

            const baseCalc = (baseLocation.getAttribute('data-timezone') == 'Asia/Jerusalem' ? new OhrHachaimZmanim(doubleLocations[stateLocation].geo, true) : new AmudehHoraahZmanim(doubleLocations[stateLocation].geo))
            baseCalc.setDate(fastDate);

            const compTimes = baseCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 }).until(currentCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 })).total({ unit: 'minutes' })
            if (Math.abs(compTimes) <= 2 && elem.getAttribute('data-timezone') == baseLocation.getAttribute('data-timezone')) {
                editElem = elem;
                for (let i of ['', ...methods]) {
                    editElem.style.display = 'none';
                    editElem = editElem.nextElementSibling;
                }

                baseLocation.innerHTML = [
                    baseLocation.innerHTML.split(',')[0].trim(),
                    elem.innerHTML.split(',')[0].trim()
                ].join('/') + ', ' + stateLocation

                let baseEditElem = baseLocation;
                editElem = elem;
                currentCalc.setDate(fastDate);
                baseCalc.setDate(fastDate);
                for (const shita of methods) {
                    editElem = editElem.nextElementSibling
                    baseEditElem = baseEditElem.nextElementSibling;

                    const [curCalcTime, baseCalcTime] = [currentCalc, baseCalc].map(
                        //@ts-ignore
                        calc => (shita == 'getTzaitShabbath' ? calc.getTzaitShabbath({ minutes: 30, degree: 7.14 }) : calc[shita]())
                            .subtract({minutes: !baseLocation.hasAttribute('data-humra') ? 0 : parseInt(baseLocation.getAttribute('data-humra'))})
                    )

                    if (!Math.trunc(curCalcTime.until(baseCalcTime).total({ unit: "minute" })) || curCalcTime.until(baseCalcTime).total({ unit: "minute" }) < 0) {
                        console.log("new one was later, continue")
                        continue;
                    }

                    baseEditElem.setAttribute('data-milisecondValue', curCalcTime.epochMilliseconds.toString())
                    baseEditElem.innerHTML = curCalcTime.toLocaleString(...dtF)
                }
            }
        } else {
            doubleLocations[stateLocation] = {elem: elem, geo:
                // @ts-ignore
                new KosherZmanim.GeoLocation(...geoLocationsParams)
            };
        }
    }
}