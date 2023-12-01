// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "./ROYZmanim.js";
import WebsiteCalendar from "./WebsiteCalendar.js"

import {isEmojiSupported} from "https://cdn.skypack.dev/is-emoji-supported";
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

const fallbackGL = new KosherZmanim.GeoLocation("null", 0,0,0, "UTC");

const ohrHachaimCal = new OhrHachaimZmanim(fallbackGL, true);
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);

const shabbatDate = KosherZmanim.Temporal.Now.plainDateISO().with({ month: 12, day: 2 });
const jCal = new WebsiteCalendar(shabbatDate)

for (const title of document.getElementsByClassName('shabbatTitleCore'))
    title.innerHTML += jCal.getHebrewParasha().join(" / ") + " " + jCal.formatJewishYear().hebrew

if (jCal.getDate().dayOfWeek != 6)
    throw new Error("Non-Saturday")

const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, Element>} */
const doubleLocations = {}
for (const elem of elems) {
    const currentCalc = (elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal);
    const elevation = (elem.hasAttribute('data-elevation') ? parseInt(elem.getAttribute('data-elevation')) : 0);

    const zonedDT = shabbatDate.toZonedDateTime(elem.getAttribute('data-timezone'))

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
        timeStyle: "short"
    }];

    currentCalc.coreZC.setDate(zonedDT.subtract({ days: 1 }));

    let candleTime = currentCalc.getCandleLighting()
    if (elem.hasAttribute('data-humra'))
        candleTime = candleTime.subtract({minutes: parseInt(elem.getAttribute('data-humra'))})
    elem.nextElementSibling.setAttribute('data-milisecondValue', candleTime.epochMilliseconds.toString())
    elem.nextElementSibling.innerHTML = candleTime.toLocaleString(...dtF);

    currentCalc.coreZC.setDate(zonedDT);

    /** @type {HTMLElement} */
    // @ts-ignore
    const tzetElement = elem.nextElementSibling.nextElementSibling;
    let tzeiTime = currentCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 })
    if (elem.hasAttribute('data-humra'))
        tzeiTime = tzeiTime.add({minutes: parseInt(elem.getAttribute('data-humra'))})
    tzetElement.setAttribute('data-milisecondValue', tzeiTime.epochMilliseconds.toString())
    tzetElement.innerHTML = tzeiTime.toLocaleString(...dtF)

    /** @type {HTMLElement} */
    // @ts-ignore
    let rtElem = (elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? tzetElement : tzetElement.nextElementSibling);
    let rTime = currentCalc.getTzaitRT()
    if (rtElem && !rtElem.classList.contains('timecalc') && !rtElem.style.gridColumn) {
        if (elem.hasAttribute('data-humra'))
            rTime = rTime.add({minutes: parseInt(elem.getAttribute('data-humra'))})

        if (elem.getAttribute('data-timezone') == 'Asia/Jerusalem')
            rtElem.innerHTML += ` / <span class="explanation">(RT: ${rTime.toLocaleString(...dtF)})</span>`;
        else {
            rtElem.setAttribute('data-milisecondValue', rTime.epochMilliseconds.toString())
            rtElem.innerHTML = rTime.toLocaleString(...dtF);
        }
    }

    if (elem.hasAttribute('data-double-location')) {
        const stateLocation = elem.innerHTML.split(',')[1].trim()
        console.log(stateLocation)
        if (stateLocation in doubleLocations) {
            const baseLocation = doubleLocations[stateLocation];
            const ogTzetTime = KosherZmanim.Temporal.Instant.fromEpochMilliseconds(parseInt(baseLocation.nextElementSibling.nextElementSibling.getAttribute('data-milisecondValue')));

            const compTimes = tzeiTime.until(ogTzetTime.toZonedDateTimeISO(elem.getAttribute('data-timezone'))).total({ unit: 'minutes' })
            console.log(compTimes)
            if (Math.abs(compTimes) <= 2 && elem.getAttribute('data-timezone') == baseLocation.getAttribute('data-timezone')) {
                elem.style.display = "none";
                elem.nextElementSibling.style.display = "none";
                tzetElement.style.display = "none";

                if (rtElem && !rtElem.classList.contains('timecalc') && !rtElem.style.gridColumn)
                    rtElem.style.display = "none"

                baseLocation.innerHTML = [
                    baseLocation.innerHTML.split(',')[0].trim(),
                    elem.innerHTML.split(',')[0].trim()
                ].join('/') + ', ' + stateLocation

                const ogCandleTime = KosherZmanim.Temporal.Instant.fromEpochMilliseconds(parseInt(baseLocation.nextElementSibling.getAttribute('data-milisecondValue')))
                if (candleTime.epochMilliseconds < ogCandleTime.epochMilliseconds) {
                    baseLocation.nextElementSibling.setAttribute('data-milisecondValue', candleTime.epochMilliseconds.toString())
                    baseLocation.nextElementSibling.innerHTML = candleTime.toLocaleString(...dtF)
                }

                if (tzeiTime.epochMilliseconds > ogTzetTime.epochMilliseconds) {
                    baseLocation.nextElementSibling.nextElementSibling.setAttribute('data-milisecondValue', tzeiTime.epochMilliseconds.toString())
                    baseLocation.nextElementSibling.nextElementSibling.innerHTML = tzeiTime.toLocaleString(...dtF)
                }

                if (rtElem && !rtElem.classList.contains('timecalc') && !rtElem.style.gridColumn) {
                    const ogRTime = KosherZmanim.Temporal.Instant.fromEpochMilliseconds(parseInt(baseLocation.nextElementSibling.nextElementSibling.nextElementSibling.getAttribute('data-milisecondValue')))
                    if (rTime.epochMilliseconds > ogRTime.epochMilliseconds) {
                        baseLocation.nextElementSibling.nextElementSibling.nextElementSibling.setAttribute('data-milisecondValue', rTime.epochMilliseconds.toString())
                        baseLocation.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML = rTime.toLocaleString(...dtF);
                    }
                }   
            }
        } else {
            doubleLocations[stateLocation] = elem;
        }
    }
}