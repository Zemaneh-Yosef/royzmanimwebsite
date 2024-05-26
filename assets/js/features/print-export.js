//@ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "../ROYZmanim.js";
import { HebrewNumberFormatter, getOrdinal } from "../WebsiteCalendar.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { settings } from "../settings/handler.js";
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";
import { Previewer } from "../../libraries/paged.js"

if (new URLSearchParams(window.location.search).has('lessContrast')) {
    document.documentElement.style.setProperty('--bs-body-bg', 'snow');
    document.documentElement.style.setProperty('--bs-body-color', '#1A0033');
}

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
baseTable.style.gridTemplateColumns = Array.from(document.getElementsByClassName('tableHeader'))
    .filter(elem => !elem.hasAttribute('data-zyHeaderContainer'))
    .map(elem => (elem.style.gridRow == '1 / span 2' ? '1fr' : '.75fr'))
    .join(" ");

const header = document.querySelector('[data-zyHeader] h3');
header.appendChild(document.createTextNode(geoLocation.getLocationName()))

function handleShita (/** @type {string} */ shita) {
    const omerSpan = document.createElement("span");
    omerSpan.classList.add("omerText");
    omerSpan.innerHTML = getOrdinal(jCal.tomorrow().getDayOfOmer(), true) + " of omer";

    const div = document.createElement('div');
    div.classList.add('tableCell')
    switch (shita) {
        case 'special':
            if (jCal.getDayOfWeek() === 7)
                div.appendChild(document.createTextNode(WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]))
            if (jCal.isRoshChodesh()) {
                if (jCal.getDayOfWeek() === 7)
                    div.appendChild(document.createElement("br"));

                div.appendChild(document.createTextNode({
                    'hb': "ראש חדש",
                    "en-et": "Rosh Ḥodesh",
                    'en': "New Month"
                }[settings.language()]));
                div.style.fontWeight = "bold";
            }

            // Cloned WebsiteCalendar.getYomTov() for two reasons
            // 1. I wanted shorter titles since the PDF is already aiming to be small
            // 2. We will soon delete the function as part of our gradual move to HTML
            const yomTovObj = {
                // Holidays
                [KosherZmanim.JewishCalendar.PESACH]: {
                    hb: "פסח",
                    "en-et": "Pesach",
                    en: "Passover",
                },
                [KosherZmanim.JewishCalendar.CHOL_HAMOED_PESACH]: {
                    en: "Intermediary",
                    "en-et": "Ḥol HaMoedh",
                    hb: "חול המועד"
                },
                [KosherZmanim.JewishCalendar.SHAVUOS]: {
                    en: "Shavuoth",
                    hb: "שבועות",
                    "en-et": "Shavuoth"
                },
                [KosherZmanim.JewishCalendar.ROSH_HASHANA]: {
                    hb: "ראש השנה",
                    en: "Rosh Hashana",
                    "en-et": "Rosh Hashana"
                },
                [KosherZmanim.JewishCalendar.SUCCOS]: {
                    hb: "סוכות",
                    en: "Sukkoth",
                    "en-et": "Sukkoth"
                },
                [KosherZmanim.JewishCalendar.CHOL_HAMOED_SUCCOS]: {
                    hb: "חול המועד",
                    "en-et": "Ḥol HaMoedh",
                    en: "Intermediary"
                },
                [KosherZmanim.JewishCalendar.HOSHANA_RABBA]: {
                    hb: "הושנה רבה",
                    "en-et": "Hoshanah Rabba",
                    en: "Hoshana Rabba"
                },
    
                // This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
                // I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
                [KosherZmanim.JewishCalendar.SHEMINI_ATZERES]: {
                    hb: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
                    en: "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simchath Torah" : ""),
                    "en-et": "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simchath Torah" : "")
                },
                [KosherZmanim.JewishCalendar.SIMCHAS_TORAH]: {
                    hb: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
                    en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah",
                    "en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah"
                },
    
                // Semi-Holidays & Fasts
                [KosherZmanim.JewishCalendar.PESACH_SHENI]: {
                    hb: "פסח שני",
                    en: "Pesach Sheni",
                    "en-et": "Pesach Sheni"
                },
                [KosherZmanim.JewishCalendar.LAG_BAOMER]: {
                    hb: "לג בעומר",
                    en: "Lag Baomer",
                    "en-et": "Lag Baomer"
                },
                [KosherZmanim.JewishCalendar.TU_BEAV]: {
                    "he": 'ט"ו באב',
                    en: "Tu Be'av",
                    "en-et": "Tu Be'av"
                },
                [KosherZmanim.JewishCalendar.TU_BESHVAT]: {
                    "he": 'ט"ו בשבת',
                    en: "Tu Bishvath",
                    "en-et": "Tu Bishvath"
                },
                [KosherZmanim.JewishCalendar.PURIM_KATAN]: {
                    hb: "פורים קתן",
                    en: "Purim Katan",
                    "en-et": "Purim Katan"
                },
                [KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN]: {
                    hb: "שושן פורים קתן",
                    en: "Shushan Purim Katan",
                    "en-et": "Shushan Purim Katan"
                },
                [KosherZmanim.JewishCalendar.PURIM]: {
                    hb: "פורים",
                    en: "Purim",
                    "en-et": "Purim"
                },
                [KosherZmanim.JewishCalendar.SHUSHAN_PURIM]: {
                    hb: "שושן פורים",
                    en: "Shushan Purim",
                    "en-et": "Shushan Purim"
                },

                /*
                Rabbi Leeor Dahan doesn't include these. I'm not getting involved
                // Modern-Day Celebrations
                [KosherZmanim.JewishCalendar.YOM_HASHOAH]: {
                    hb: "יום השועה",
                    "en-et": "Yom Hashoa",
                    en: "Holocaust Memorial Day"
                },
                [KosherZmanim.JewishCalendar.YOM_HAZIKARON]: {
                    hb: "יום הזכרון",
                    "en-et": "Yom Hazikaron",
                    en: "Day of Rememberance"
                },
                [KosherZmanim.JewishCalendar.YOM_HAATZMAUT]: {
                    hb: "יום האצמעות",
                    "en-et": "Yom Haatzmauth",
                    en: "Yom Haatzmauth"
                }, // Tachanun is said
                [KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM]: {
                    hb: "יום ירושלים",
                    "en-et": "Yom Yerushalayim",
                    en: "Jerusalem Day"
                },
                */
            }

            if (jCal.getYomTovIndex() in yomTovObj)
                div.appendChild(document.createTextNode(yomTovObj[jCal.getYomTovIndex()][settings.language()]))

            if (jCal.isTaanis()) {
                switch (jCal.getYomTovIndex()) {
                    case WebsiteLimudCalendar.FAST_OF_ESTHER:
                        div.appendChild(document.createTextNode({
                            'hb': "תענית אסתר",
                            "en-et": "Fast of Ester",
                            'en': "Fast of Ester"
                        }[settings.language()]));
                        break;
                    case WebsiteLimudCalendar.FAST_OF_GEDALYAH:
                        div.appendChild(document.createTextNode({
                            'hb': "צום גדליה",
                            "en-et": "Fast of Gedalia",
                            'en': "Fast of Gedalia"
                        }[settings.language()]));
                        break;
                    case WebsiteLimudCalendar.YOM_KIPPUR:
                        div.appendChild(document.createTextNode({
                            "hb": "יום כיפור",
                            "en": "Yom Kippur",
                            "en-et": "Yom Kippur"
                        }[settings.language()]));
                    default:
                        div.appendChild(document.createTextNode({
                            'hb': "צום",
                            "en-et": "Fast",
                            'en': "Fast"
                        }[settings.language()]));
                }
            }

            break;
        case 'date':
            let dateFormat;
            switch (settings.language()) {
                case 'en':
                    dateFormat = jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " + jCal.getDate().toLocaleString('en', { day: 'numeric' }) + "<br>"
                    + hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " + jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'});
                    break;
                case 'en-et':
                    dateFormat = jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " + this.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long', day: "numeric"}) + "<br>"
                    + jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })
                    break;
                case 'hb':
                    dateFormat = (jCal.getDayOfWeek() == 7 ? "שבת" : n2wordsOrdinal[jCal.getDayOfWeek()]) + " - " + hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + "<br>"
                    + jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })
            }
            div.innerHTML = dateFormat;

            if (jCal.isRoshChodesh())
                div.style.fontWeight = "bold";

            break;
        case 'candleLighting':
            if (jCal.hasCandleLighting()) {
                if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
                    div.appendChild(document.createTextNode(zmanCalc.getCandleLighting().toLocaleString(...dtF)));
                else if (jCal.getDayOfWeek() === 7)
                    div.appendChild(document.createTextNode(zmanCalc.getTzaitShabbath().toLocaleString(...dtF)));
                else
                    return false;
            }
            break;
        case 'getTzaitShabbath':
            if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
                div.appendChild(document.createTextNode(zmanCalc.getTzaitShabbath().toLocaleString(...dtF)));
                if (jCal.tomorrow().getDayOfOmer() !== -1) {
                    div.appendChild(document.createElement("br"));
                    div.appendChild(omerSpan);
                }
            }
            break;
        case 'getTzait':
            if (!jCal.isAssurBemelacha()) {
                div.appendChild(document.createTextNode(zmanCalc.getTzait().toLocaleString(...dtF)))
                if (jCal.tomorrow().getDayOfOmer() !== -1) {
                    div.appendChild(document.createElement("br"));
                    div.appendChild(omerSpan);
                }
            }
            break;
        case 'getTzaitLechumra':
            let appear = false;
            if (zmanCalc instanceof OhrHachaimZmanim) {
                if (jCal.isTaanis() && !jCal.isYomKippur()) {
                    appear = true;
                    div.appendChild(document.createTextNode(zmanCalc.getTzait().add({ minutes: 20 }).toLocaleString(...dtF)))
                    div.style.fontWeight = "bold";
                }
            } else {
                appear = true;
                div.appendChild(document.createTextNode(zmanCalc.getTzaitLechumra().toLocaleString(...dtF)))
                if (jCal.isTaanis() && !jCal.isYomKippur()) {
                    div.style.fontWeight = "bold";
                }
            }

            if (appear && jCal.hasCandleLighting() && jCal.getDayOfWeek() !== 6 && jCal.isAssurBemelacha() && jCal.getDayOfWeek() !== 7) {
                div.style.gridColumnEnd = "span 2";
                if (jCal.tomorrow().getDayOfOmer() !== -1) {
                    div.appendChild(document.createElement("br"));
                    div.appendChild(omerSpan);
                }
            }

            break;
        case 'getAlotHashachar':
            div.appendChild(document.createTextNode(zmanCalc.getAlotHashachar().toLocaleString(...dtF)));
            if (jCal.isTaanis() && jCal.getJewishMonth() !== WebsiteLimudCalendar.AV && !jCal.isYomKippur())
                div.style.fontWeight = "bold";
            break;
        case 'getNetz':
            let sunString = zmanCalc.getNetz().toLocaleString(...dtF);

            /**
             * @param {string} str
             */
            function isValidJSON(str) {
                try {
                    JSON.parse(str);
                    return true;
                } catch (e) {
                    return false;
                }
            }
            if (typeof localStorage !== "undefined" && localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
                const ctNetz = JSON.parse(localStorage.getItem('ctNetz'))
                if (ctNetz.lat == zmanCalc.coreZC.getGeoLocation().getLatitude()
                 && ctNetz.lng == zmanCalc.coreZC.getGeoLocation().getLongitude()) {
                    /** @type {KosherZmanim.Temporal.ZonedDateTime[]} */
                    const timeSheet = ctNetz.times
                        .map((/** @type {number} */ value) => KosherZmanim.Temporal.Instant
                            .fromEpochSeconds(value)
                            .toZonedDateTimeISO(zmanCalc.coreZC.getGeoLocation().getTimeZone())
                        )

                    let visibleSunrise = timeSheet.find(zDT => Math.abs(zmanCalc.getNetz().until(zDT).total('minutes')) <= 6)
                    if (visibleSunrise)
                        sunString = visibleSunrise.toLocaleString(dtF[0], {...dtF[1], second: '2-digit'})
                }
            }

            div.appendChild(document.createTextNode(sunString));
            break;
        default:
            // @ts-ignore
            div.appendChild(document.createTextNode(zmanCalc[shita]().toLocaleString(...dtF)));
    }

    return div;
}

let plainDateForLoop = jCal.getDate().withCalendar(settings.language() == 'en' ? 'iso8601' : 'hebrew').with({ month: 1, day: 1 })
for (let mIndex = 1; mIndex < plainDateForLoop.monthsInYear + 1; mIndex++) {
    plainDateForLoop = plainDateForLoop.with({ month: mIndex });
    jCal.setDate(plainDateForLoop.withCalendar("iso8601"));

    baseTable.parentElement.appendChild(header.parentElement.cloneNode(true))
    /** @type {Element} */
    // @ts-ignore
    const tableFirstHalf = baseTable.cloneNode(true);
    tableFirstHalf.querySelector('[data-zyData="date"]')
        .appendChild(document.createTextNode(
            plainDateForLoop
                .toLocaleString(
                    settings.language() == "en" ? 'en' : settings.language().replace('hb', 'he') + '-u-ca-hebrew',
                    { month: "long" }
                )
        ));

    const halfDaysInMonth = Math.floor(plainDateForLoop.daysInMonth / 2);
    for (let index = 1; index <= halfDaysInMonth; index++) {
        plainDateForLoop = plainDateForLoop.with({ day: index })
        jCal.setDate(plainDateForLoop.withCalendar("iso8601"))
        zmanCalc.setDate(plainDateForLoop.withCalendar("iso8601"))

        for (const shita of listAllShitot) {
            const cell = handleShita(shita);

            if (!cell)
                continue;

            if (index !== halfDaysInMonth)
                cell.style.borderBottom = '1px solid #21252922';

            tableFirstHalf.appendChild(cell)
        }
    }
    baseTable.parentElement.appendChild(tableFirstHalf)

    baseTable.parentElement.appendChild(header.parentElement.cloneNode(true))
    /** @type {Element} */
    // @ts-ignore
    const tableSecondHalf = baseTable.cloneNode(true);
    tableSecondHalf.querySelector('[data-zyData="date"]')
        .appendChild(document.createTextNode(
            plainDateForLoop
                .toLocaleString(
                    settings.language() == "en" ? 'en' : settings.language().replace('hb', 'he') + '-u-ca-hebrew',
                    { month: "long" }
                )
        ))

    const lastDayOfMonth = plainDateForLoop.daysInMonth;
    for (let index = Math.ceil(plainDateForLoop.daysInMonth / 2); index <= lastDayOfMonth; index++) {
        plainDateForLoop = plainDateForLoop.with({ day: index })
        jCal.setDate(plainDateForLoop.withCalendar("iso8601"))
        zmanCalc.setDate(plainDateForLoop.withCalendar("iso8601"))

        for (const shita of listAllShitot) {
            const cell = handleShita(shita);

            if (!cell)
                continue;

            if (index !== lastDayOfMonth)
                cell.style.borderBottom = '1px solid #21252922';

            tableSecondHalf.appendChild(cell)
        }
    }
    baseTable.parentElement.appendChild(tableSecondHalf);
}

header.parentElement.remove();
baseTable.remove();

document.documentElement.setAttribute('forceLight', '')
document.documentElement.removeAttribute('data-bs-theme');

let paged = new Previewer();
let flow = await paged.preview(document.getElementsByTagName("main")[0], ["/assets/css/print-year/footnotes.css", "/assets/css/print-year/pagedjs.css"], document.body);
console.log("Rendered", flow.total, "pages.");

Array.from(document.getElementsByClassName('pagedjs_footnote_inner_content'))
    .forEach(elem => {
        if (elem instanceof HTMLElement)
            elem.style.setProperty('columns', '4')
    });

/* const elems = [
    'pagedjs_margin-top-left-corner-holder',
    'pagedjs_margin-top',
    'pagedjs_margin-top-right-corner-holder',
    'pagedjs_margin-right',
    'pagedjs_margin-left',
    'pagedjs_margin-bottom-left-corner-holder',
    'pagedjs_margin-bottom',
    'pagedjs_margin-bottom-right-corner-holder',
    'pagedjs_pagebox'
]
    .map(className => Array.from(document.getElementsByClassName(className)))
    .flat();

['top', 'right', 'left', 'bottom']
    .forEach(dir => elems.forEach(elem => elem.style.setProperty(`--pagedjs-margin-${dir}`, '0')));

Array.from(document.querySelectorAll('.pagedjs_pagebox > .pagedjs_area')).forEach(elem => elem.style.gridRow = 'unset') */

window.print();