// @ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { AmudehHoraahZmanim, OhrHachaimZmanim } from "../ROYZmanim.js";
import preSettings from "./preSettings.js";

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
const geoL = new GeoLocation(...glArgs);

const dateForSet = Temporal.Now.plainDateISO(preSettings.location.timezone());
const jCal = new WebsiteLimudCalendar(dateForSet);
jCal.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))

let dateHighlight = jCal.shabbat();
for (; !jCal.getDate().equals(dateHighlight.getDate()); jCal.forward(5, 1)) {
    if (jCal.isAssurBemelacha()) {
        dateHighlight = jCal.clone();
        break;
    }
}
jCal.setDate(dateForSet);

const zmanCalc =
    (preSettings.calendarToggle.hourCalculators() == "seasonal" || jCal.getInIsrael() ?
        new OhrHachaimZmanim(geoL, true) :
        new AmudehHoraahZmanim(geoL));
zmanCalc.configSettings(preSettings.calendarToggle.rtKulah(), preSettings.customTimes.tzeithIssurMelakha());
zmanCalc.coreZC.setCandleLightingOffset(preSettings.customTimes.candleLighting())
zmanCalc.setDate(dateForSet);

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
    hourCycle: preSettings.timeFormat(),
    hour: 'numeric',
    minute: '2-digit'
}];

const titleElem = document.querySelector('[data-parasha]')
titleElem.innerHTML = (dateHighlight.isYomTov() ? "YT" : jCal.getHebrewParasha().join(" / "))

const lightCand = document.querySelector('[data-lightingCandles]');
if (dateHighlight.hasCandleLighting()) {
    const lightCand2 = lightCand.cloneNode(true);
    // @ts-ignore
    lightCand2.innerHTML += "(2<sup>nd</sup> night): " + zmanCalc.getTzaitLechumra().toLocaleString(...dtF);
    lightCand.innerHTML += "(1<sup>st</sup> night): ";
}
lightCand.innerHTML += zmanCalc.chainDate(dateHighlight.getDate().subtract({ days: 1 })).getCandleLighting().toLocaleString(...dtF);

const tzet = dateHighlight.clone();
do {
    tzet.forward(5, 1)
} while (tzet.isAssurBemelacha())
tzet.back(); // last day of assur bemelacha

// Figuring out whether this is Rabbinic or Biblical
tzet.back();
const rabbinic = tzet.getDayOfWeek() !== 6 && tzet.isErevYomTovSheni()
tzet.forward(5, 1);

const tzetTimes = {
    ikar: zmanCalc.chainDate(tzet.getDate()).getTzaitShabbath().toLocaleString(...dtF),
    rt: zmanCalc.chainDate(tzet.getDate()).getTzaitRT().toLocaleString(...dtF)
}

const tzetElem = document.querySelector('[data-tzetShab]');
let tzetText;
if (tzetElem.hasAttribute('data-ikar-text')) {
    tzetText = (rabbinic
        ? tzetTimes.ikar
        : tzetTimes.rt + ` (${tzetElem.getAttribute('data-ikar-text')}: ${tzetTimes.ikar})`)
} else {
    tzetText = tzetTimes.ikar;
    if (!rabbinic && tzetElem.hasAttribute('data-rt-text'))
        tzetText += ` (${tzetElem.getAttribute('data-rt-text')}: ${tzetTimes.rt})`
}
tzetElem.appendChild(document.createTextNode(tzetText))