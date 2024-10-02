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

const yomTovObj = {
    // Holidays
    [WebsiteLimudCalendar.PESACH]: {
        hb: "פסח",
        "en-et": "Pesaḥ",
        en: "Passover",
    },
    [WebsiteLimudCalendar.CHOL_HAMOED_PESACH]: {
        en: "Shabbat Intermediary",
        "en-et": "Shabbath Ḥol HaMoedh",
        hb: "שבת חול המועד"
    },
    [WebsiteLimudCalendar.SHAVUOS]: {
        en: "Shavuoth",
        hb: "שבועות",
        "en-et": "Shavuoth"
    },
    [WebsiteLimudCalendar.ROSH_HASHANA]: {
        hb: "ראש השנה",
        en: "Rosh Hashana",
        "en-et": "Rosh Hashana"
    },
    [WebsiteLimudCalendar.SUCCOS]: {
        hb: "סוכות",
        en: "Sukkoth",
        "en-et": "Sukkoth"
    },
    [WebsiteLimudCalendar.CHOL_HAMOED_SUCCOS]: {
        hb: "שבת חול המועד",
        "en-et": "Shabbath Ḥol HaMoedh",
        en: "Shabbath Intermediary"
    },

    // This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
    // I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
    [WebsiteLimudCalendar.SHEMINI_ATZERES]: {
        hb: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
        en: "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simchath Torah" : ""),
        "en-et": "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simchath Torah" : "")
    },
    [WebsiteLimudCalendar.SIMCHAS_TORAH]: {
        hb: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
        en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah",
        "en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah"
    },

    // YK is the only Fast considered a YT
    [WebsiteLimudCalendar.YOM_KIPPUR]: {
        "hb": "יום כיפור",
        "en": "Yom Kippur",
        "en-et": "Yom Kippur"
    }
}

const titleElem = document.querySelector('[data-parasha]')
if (dateHighlight.isYomTov() && dateHighlight.getYomTovIndex() in yomTovObj) {
    titleElem.innerHTML = yomTovObj[dateHighlight.getYomTovIndex()][preSettings.language()]
} else
    titleElem.innerHTML = jCal.getHebrewParasha().join(" / ") + (dateHighlight.isChanukah() ? " (חנוכה)" : "");

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