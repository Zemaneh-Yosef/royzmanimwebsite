// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim, methodNames } from "./ROYZmanim.js";

import { polyfillCountryFlagEmojis } from "https://cdn.skypack.dev/country-flag-emoji-polyfill";
polyfillCountryFlagEmojis();

const fallbackGL = new KosherZmanim.GeoLocation("null", 0,0,0, "UTC");

const ohrHachaimCal = new OhrHachaimZmanim(fallbackGL, false);
const amudehHoraahCal = new AmudehHoraahZmanim(fallbackGL);

const elems = document.getElementsByClassName('timecalc');
for (const elem of elems) {
    const currentCalc = (elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal);
    currentCalc.coreZC.setGeoLocation(new KosherZmanim.GeoLocation("null", parseInt(elem.getAttribute("data-lat")), parseInt(elem.getAttribute('data-lng')), 0, elem.getAttribute('data-timezone')))

    const dtF = new Intl.DateTimeFormat('en', {
        hourCycle: "h24",
        timeStyle: "short",
        timeZone: elem.getAttribute('data-timezone')
    });

    if (elem.classList.contains('end')) {
        currentCalc.coreZC.setDate(currentCalc.coreZC.getDate().set({ day: 14 }));

        const time = currentCalc.getTzaitShabbath({ minutes: 30, degree: 7.14 })
        console.log(time.toJSDate());

        elem.innerHTML = dtF.format(time.toJSDate())
    } else {
        currentCalc.coreZC.setCandleLightingOffset((elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? 20 : 20))
        currentCalc.coreZC.setDate(currentCalc.coreZC.getDate().set({ day: 13 }));

        const time = currentCalc.getCandleLighting()
        console.log(time.toJSDate());

        elem.innerHTML = dtF.format(time.toJSDate())
    }
}