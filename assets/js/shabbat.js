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

const shabbatDate = 18;
const jCal = new WebsiteCalendar(window.luxon.DateTime.now().set({ day: shabbatDate }))

for (const title of document.getElementsByClassName('shabbatTitleCore'))
    title.innerHTML += jCal.getHebrewParasha().join(" / ")

if (jCal.getDate().weekday != 6)
    throw new Error("Non-Saturday")

const elems = document.getElementsByClassName('timecalc');
/** @type {Record<string, Element>} */
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

    const dtF = new Intl.DateTimeFormat('en', {
        hourCycle: window.location.href.includes('usa') ? "h12" : "h24",
        timeStyle: "short",
        timeZone: elem.getAttribute('data-timezone')
    });

    currentCalc.coreZC.setDate(currentCalc.coreZC.getDate().set({ day: shabbatDate - 1 }));

    let candleTime = currentCalc.getCandleLighting()
    if (elem.hasAttribute('data-humra'))
        candleTime = candleTime.minus({minute: parseInt(elem.getAttribute('data-humra'))})
    elem.nextElementSibling.setAttribute('data-milisecondValue', candleTime.toMillis().toString())
    elem.nextElementSibling.innerHTML = dtF.format(candleTime.toJSDate())

    currentCalc.coreZC.setDate(currentCalc.coreZC.getDate().set({ day: shabbatDate }));

    const tzetElement = elem.nextElementSibling.nextElementSibling;
    let tzeiTime = currentCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 })
    if (elem.hasAttribute('data-humra'))
        tzeiTime = tzeiTime.plus({minute: parseInt(elem.getAttribute('data-humra'))})
    tzetElement.setAttribute('data-milisecondValue', tzeiTime.toMillis().toString())
    tzetElement.innerHTML = dtF.format(tzeiTime.toJSDate())

    /** @type {HTMLElement} */
    // @ts-ignore
    let rtElem = (elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? tzetElement : tzetElement.nextElementSibling);
    let rTime = currentCalc.getTzaitRT()
    if (rtElem && !rtElem.classList.contains('timecalc') && !rtElem.style.gridColumn) {
        if (elem.hasAttribute('data-humra'))
            rTime = rTime.plus({minute: parseInt(elem.getAttribute('data-humra'))})

        if (elem.getAttribute('data-timezone') == 'Asia/Jerusalem')
            rtElem.innerHTML += ` / <span class="explanation">(RT: ${dtF.format(rTime.toJSDate())})</span>`;
        else {
            rtElem.setAttribute('data-milisecondValue', rTime.toMillis().toString())
            rtElem.innerHTML = dtF.format(rTime.toJSDate());
        }
    }

    if (elem.hasAttribute('data-double-location')) {
        const stateLocation = elem.innerHTML.split(',')[1].trim()
        console.log(stateLocation)
        if (stateLocation in doubleLocations) {
            const baseLocation = doubleLocations[stateLocation];
            const ogTzetTime = window.luxon.DateTime.fromMillis(parseInt(baseLocation.nextElementSibling.nextElementSibling.getAttribute('data-milisecondValue')));

            const compTimes = [tzeiTime, ogTzetTime].map(dTime => Math.floor(dTime.toMillis() / 1000 / 60))
            const diffTime = compTimes
                .reduce(
                    (accumulator, currentValue) => accumulator - currentValue,
                    compTimes[0] * 2,
                );
            if (Math.abs(diffTime) <= 2) {
                elem.style.display = "none";
                elem.nextElementSibling.style.display = "none";
                tzetElement.style.display = "none";
                if (rtElem && !rtElem.classList.contains('timecalc') && !rtElem.style.gridColumn)
                    rtElem.style.display = "none"

                baseLocation.innerHTML = [
                    baseLocation.innerHTML.split(',')[0].trim(),
                    elem.innerHTML.split(',')[0].trim()
                ].join('/') + ', ' + stateLocation

                const ogCandleTime = window.luxon.DateTime.fromMillis(parseInt(baseLocation.nextElementSibling.getAttribute('data-milisecondValue')))
                if (candleTime.toMillis() < ogCandleTime.toMillis()) {
                    baseLocation.nextElementSibling.setAttribute('data-milisecondValue', candleTime.toMillis().toString())
                    baseLocation.nextElementSibling.innerHTML = dtF.format(candleTime.toJSDate())
                }

                if (tzeiTime.toMillis() > ogTzetTime.toMillis()) {
                    baseLocation.nextElementSibling.nextElementSibling.setAttribute('data-milisecondValue', tzeiTime.toMillis().toString())
                    baseLocation.nextElementSibling.nextElementSibling.innerHTML = dtF.format(tzeiTime.toJSDate())
                }

                if (rtElem && !rtElem.classList.contains('timecalc') && !rtElem.style.gridColumn) {
                    const ogRTime = window.luxon.DateTime.fromMillis(parseInt(baseLocation.nextElementSibling.nextElementSibling.nextElementSibling.getAttribute('data-milisecondValue')))
                    if (rTime.toMillis() > ogRTime.toMillis()) {
                        baseLocation.nextElementSibling.nextElementSibling.nextElementSibling.setAttribute('data-milisecondValue', rTime.toMillis().toString())
                        baseLocation.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML = dtF.format(rTime.toJSDate())
                    }
                }   
            }
        } else {
            doubleLocations[stateLocation] = elem;
        }
    }
}