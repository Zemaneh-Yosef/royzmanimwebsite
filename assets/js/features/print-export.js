//@ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "../ROYZmanim.js";
import { HebrewNumberFormatter, daysForLocale, getOrdinal, monthForLocale } from "../WebsiteCalendar.js";
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
jCal.setInIsrael((geoLocation.getLocationName() || "").toLowerCase().includes('israel'));
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
/** @type {HTMLElement} */
// @ts-ignore
const baseTable = document.getElementsByClassName('tableGrid')[0];
baseTable.style.gridTemplateColumns = Array.from(document.getElementsByClassName('tableHeader'))
    .filter(elem => !elem.hasAttribute('data-zyHeaderContainer'))
    .map((/** @type {HTMLElement} */elem) => (elem.style.gridRow == '1 / span 2' ? '1fr' : '.75fr'))
    .join(" ");

/** @type {false|KosherZmanim.Temporal.ZonedDateTime[]} */
let availableVS = false;
if (typeof localStorage !== "undefined" && localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
    const ctNetz = JSON.parse(localStorage.getItem('ctNetz'))
    if (ctNetz.lat == zmanCalc.coreZC.getGeoLocation().getLatitude()
     && ctNetz.lng == zmanCalc.coreZC.getGeoLocation().getLongitude())
        availableVS = ctNetz.times
            .map((/** @type {number} */ value) => KosherZmanim.Temporal.Instant
                .fromEpochSeconds(value)
                .toZonedDateTimeISO(zmanCalc.coreZC.getGeoLocation().getTimeZone())
            )
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

const flexWorkAround = document.createElement("span");
flexWorkAround.classList.add("flexElemWorkaround")

function handleShita (/** @type {string} */ shita) {
    const omerSpan = document.createElement("span");
    omerSpan.classList.add("omerText");
    omerSpan.innerHTML = getOrdinal(jCal.tomorrow().getDayOfOmer(), true) + " of omer";

    const div = document.createElement('div');
    div.classList.add('tableCell')
    switch (shita) {
        case 'special':
            if (jCal.getDayOfWeek() === 7) {
                const shabElem = flexWorkAround.cloneNode(true);
                shabElem.appendChild(document.createTextNode(WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]));
                div.appendChild(shabElem)
            }
            if (jCal.isRoshChodesh()) {
                const rHelem = flexWorkAround.cloneNode(true);
                rHelem.appendChild(document.createTextNode({
                    'hb': "ראש חדש",
                    "en-et": "Rosh Ḥodesh",
                    'en': "New Month"
                }[settings.language()]));

                div.appendChild(rHelem);
                div.style.fontWeight = "bold";
            }

            if (jCal.tomorrow().getDayOfChanukah() !== -1) {
                const hanTitleElem = flexWorkAround.cloneNode(true);
                hanTitleElem.appendChild(document.createTextNode({
                    "hb": (jCal.getDayOfChanukah() == -1 ? "ערב " : "") + "חנוכה",
                    "en": "Ḥanukah" + (jCal.getDayOfChanukah() == -1 ? " Eve" : ""),
                    "en-et": (jCal.getDayOfChanukah() == -1 ? "Erev " : "") + "Ḥanukah"
                }[settings.language()]));
                div.appendChild(hanTitleElem);

                const hanNightElem = flexWorkAround.cloneNode(true);
                // @ts-ignore
                hanNightElem.classList.add("omerText");
                // @ts-ignore
                hanNightElem.innerHTML = "(" + {
                    "hb": "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()],
                    "en": getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night",
                    "en-et": getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night"
                }[settings.language()] + ")";
                div.appendChild(hanNightElem);

                div.style.fontWeight = "bold";
            }

            if (jCal.getYomTovIndex() in yomTovObj) {
                const yomTovElem = flexWorkAround.cloneNode(true);
                yomTovElem.appendChild(document.createTextNode(yomTovObj[jCal.getYomTovIndex()][settings.language()]))
                div.appendChild(yomTovElem);

                div.style.fontWeight = "bold";
            }

            if (jCal.isTaanis()) {
                const taanitElem = flexWorkAround.cloneNode(true);

                switch (jCal.getYomTovIndex()) {
                    case WebsiteLimudCalendar.FAST_OF_ESTHER:
                        taanitElem.appendChild(document.createTextNode({
                            'hb': "תענית אסתר",
                            "en-et": "Fast of Ester",
                            'en': "Fast of Ester"
                        }[settings.language()]));
                        break;
                    case WebsiteLimudCalendar.FAST_OF_GEDALYAH:
                        taanitElem.appendChild(document.createTextNode({
                            'hb': "צום גדליה",
                            "en-et": "Fast of Gedalia",
                            'en': "Fast of Gedalia"
                        }[settings.language()]));
                        break;
                    case WebsiteLimudCalendar.YOM_KIPPUR:
                        taanitElem.appendChild(document.createTextNode({
                            "hb": "יום כיפור",
                            "en": "Yom Kippur",
                            "en-et": "Yom Kippur"
                        }[settings.language()]));
                    default:
                        taanitElem.appendChild(document.createTextNode({
                            'hb': "צום",
                            "en-et": "Fast",
                            'en': "Fast"
                        }[settings.language()]));
                }

                div.appendChild(taanitElem);
                div.style.fontWeight = "bold";
            }

            break;
        case 'date':
            let primaryDate = flexWorkAround.cloneNode(true);
            let secondaryDate = flexWorkAround.cloneNode(true);
            switch (settings.language()) {
                case 'en':
                    primaryDate.appendChild(document.createTextNode(
                        jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
                        jCal.getDate().toLocaleString('en', { day: 'numeric' })
                    ));
                    secondaryDate.appendChild(document.createTextNode(
                        hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " +
                        jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})
                    ));
                    break;
                case 'en-et':
                    primaryDate.appendChild(document.createTextNode(
                        jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
                        this.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long', day: "numeric"})
                    ));
                    secondaryDate.appendChild(document.createTextNode(jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })));
                    break;
                case 'hb':
                    primaryDate.appendChild(document.createTextNode(
                        (jCal.getDayOfWeek() == 7 ? "שבת" : n2wordsOrdinal[jCal.getDayOfWeek()]) + " - " +
                        hNum.formatHebrewNumber(jCal.getJewishDayOfMonth())
                    ));
                    secondaryDate.appendChild(document.createTextNode(jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })));
            }
            div.appendChild(primaryDate);
            div.appendChild(secondaryDate);

            if (jCal.isRoshChodesh() || jCal.getYomTovIndex() in yomTovObj)
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
                let shabbatTzetElem = flexWorkAround.cloneNode(true);
                shabbatTzetElem.appendChild(document.createTextNode(zmanCalc.getTzaitShabbath().toLocaleString(...dtF)));
                div.appendChild(shabbatTzetElem);

                if (jCal.tomorrow().getDayOfOmer() !== -1) {
                    div.appendChild(omerSpan);
                }
            }
            break;
        case 'getTzait':
            if (!jCal.isAssurBemelacha()) {
                let tzetElem = flexWorkAround.cloneNode(true);
                tzetElem.appendChild(document.createTextNode(zmanCalc.getTzait().toLocaleString(...dtF)))
                div.appendChild(tzetElem);

                if (jCal.tomorrow().getDayOfOmer() !== -1) {
                    div.appendChild(omerSpan);
                }

                if (jCal.tomorrow().getDayOfChanukah() !== -1) {
                    const hanukahSpan = flexWorkAround.cloneNode(true);
                    // @ts-ignore
                    hanukahSpan.classList.add("omerText");
                    hanukahSpan.appendChild(document.createTextNode(
                        "Light before " + zmanCalc.getTzait().add({ minutes: 30 }).toLocaleString(...dtF)
                    ));

                    div.appendChild(hanukahSpan);
                }
            }
            break;
        case 'getTzaitLechumra':
            let appear = false;
            const tzetElem = flexWorkAround.cloneNode(true);
            if (zmanCalc instanceof OhrHachaimZmanim) {
                if (jCal.isTaanis() && !jCal.isYomKippur()) {
                    appear = true;
                    tzetElem.appendChild(document.createTextNode(zmanCalc.getTzait().add({ minutes: 20 }).toLocaleString(...dtF)))

                    div.appendChild(tzetElem);
                    div.style.fontWeight = "bold";
                }
            } else {
                appear = true;
                tzetElem.appendChild(document.createTextNode(zmanCalc.getTzaitLechumra().toLocaleString(...dtF)))

                div.appendChild(tzetElem);
                if (jCal.isTaanis() && !jCal.isYomKippur()) {
                    div.style.fontWeight = "bold";
                }
            }

            if (appear && jCal.hasCandleLighting() && jCal.getDayOfWeek() !== 6 && jCal.isAssurBemelacha() && jCal.getDayOfWeek() !== 7) {
                div.style.gridColumnEnd = "span 2";
                if (jCal.tomorrow().getDayOfOmer() !== -1) {
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

            if (availableVS) {
                let visibleSunrise = availableVS.find(zDT => Math.abs(zmanCalc.getNetz().until(zDT).total('minutes')) <= 6)
                if (visibleSunrise)
                    sunString = visibleSunrise.toLocaleString(dtF[0], {...dtF[1], second: '2-digit'})
            }

            div.appendChild(document.createTextNode(sunString));
            break;
        default:
            // @ts-ignore
            div.appendChild(document.createTextNode(zmanCalc[shita]().toLocaleString(...dtF)));
    }

    return div;
}

const locationElem = document.querySelector("[data-zyLocationText]");
locationElem.appendChild(document.createTextNode(geoLocation.getLocationName()));

const footer = document.createElement("div");
footer.classList.add("zyCalFooter");

const locationSection = document.createElement("div");
locationSection.classList.add("sides")
locationSection.appendChild(locationElem);
locationSection.innerHTML += `(${geoLocation.getLatitude()}, ${geoLocation.getLongitude()})`;
footer.appendChild(locationSection)

footer.appendChild(document.querySelector('[data-zyBranding]').cloneNode(true));

const rightSide = document.createElement("div");
rightSide.classList.add("sides", "d-flex", "justify-content-around")
footer.appendChild(rightSide);

let plainDateForLoop = jCal.getDate().withCalendar(settings.language() == 'en' ? 'iso8601' : 'hebrew').with({ month: 1, day: 1 })
for (let mIndex = 1; mIndex <= plainDateForLoop.monthsInYear; mIndex++) {
    plainDateForLoop = plainDateForLoop.with({ month: mIndex });
    jCal.setDate(plainDateForLoop.withCalendar("iso8601"));

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

    const initTekuf = zmanCalc.nextTekufa(zmanCalc instanceof OhrHachaimZmanim)
    const halfDaysInMonth = plainDateForLoop.daysInMonth; //Math.floor(plainDateForLoop.daysInMonth / 2);
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
    baseTable.parentElement.appendChild(tableFirstHalf);

    jCal.getDate().withCalendar("hebrew");

    /** @type {HTMLDivElement} */
    // @ts-ignore
    const thisMonthFooter = footer.cloneNode(true);
    if (!initTekuf.equals(zmanCalc.nextTekufa(zmanCalc instanceof OhrHachaimZmanim).withTimeZone(geoLocation.getTimeZone()))) {
        const nextTekufaJDate = [1, 4, 7, 10]
            .map(month => new KosherZmanim.JewishDate(jCal.getJewishYear(), month, 15))
            .sort((jDateA, jDateB) => {
                const durationA = initTekuf.until(jDateA.getDate().toZonedDateTime("+02:00").withTimeZone(geoLocation.getTimeZone()))
                const durationB = initTekuf.until(jDateB.getDate().toZonedDateTime("+02:00").withTimeZone(geoLocation.getTimeZone()))

                return Math.abs(durationA.total('days')) - Math.abs(durationB.total('days'))
            })[0]

        /** @type {{en: string; he: string}} */
        // @ts-ignore
        const tekufaMonth = ['en', 'he']
            .map(locale => [locale, nextTekufaJDate.getDate().toLocaleString(locale + '-u-ca-hebrew', { month: 'long' })])
            .reduce(function (obj, [key, val]) {
                //@ts-ignore
                obj[key] = val
                return obj
            }, {})

        const tekufaContainer = document.createElement("div");
        const tekufaTitle = document.createElement("h5");
        tekufaTitle.appendChild(document.createTextNode({
            hb: "תקופת " + tekufaMonth.he,
            en: tekufaMonth.en + " Season",
            "en-et": "Tekufath " + tekufaMonth.en
        }[settings.language()]));

        let tekufaDate;
        switch (settings.language()) {
            default:
                tekufaDate = `${daysForLocale('en')[initTekuf.dayOfWeek]}, ${monthForLocale('en')[initTekuf.month]} ${getOrdinal(initTekuf.day, true)}`;
        }
        const tekufaTimingDiv = document.createElement("p");
        tekufaTimingDiv.innerHTML = tekufaDate;
        tekufaTimingDiv.appendChild(document.createElement("br"));
        tekufaTimingDiv.appendChild(document.createTextNode({
            "hb": "אל תשתה מים בין ",
            "en": "Do not drink water between ",
            "en-et": "Do not drink water between "
        }[settings.language()] + [
            initTekuf.round("minute").subtract({ minutes: 30 }).toLocaleString(...dtF),
            initTekuf.round("minute").add({ minutes: 30 }).toLocaleString(...dtF),
        ].join('-')));

        tekufaContainer.appendChild(tekufaTitle);
        tekufaContainer.appendChild(tekufaTimingDiv);
        thisMonthFooter.lastElementChild.appendChild(tekufaContainer);
    }
    baseTable.parentElement.appendChild(thisMonthFooter);

    //baseTable.parentElement.appendChild(header.parentElement.cloneNode(true))
    /** @type {Element} */
    // @ts-ignore
    /* const tableSecondHalf = baseTable.cloneNode(true);
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
    baseTable.parentElement.appendChild(tableSecondHalf); */
}

locationElem.remove();
document.querySelector('[data-zyBranding]').remove();
baseTable.remove();

document.documentElement.setAttribute('forceLight', '')
document.documentElement.removeAttribute('data-bs-theme');

/** @type {HTMLElement} */
const finalExplanation = document.querySelector('[data-printFind]');

let paged = new Previewer();
let flow = await paged.preview(finalExplanation, ["/assets/css/footnotes.css"], finalExplanation.parentElement);
console.log("Rendered", flow.total, "pages.");

finalExplanation.style.display = "none";

const elems = [
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
    .forEach(dir => elems.forEach((/** @type {HTMLElement} */elem) => elem.style.setProperty(`--pagedjs-margin-${dir}`, '0')));

Array.from(document.querySelectorAll('.pagedjs_pagebox > .pagedjs_area')).forEach((/** @type {HTMLElement} */elem) => elem.style.gridRow = 'unset')
Array.from(document.querySelectorAll('.pagedjs_pagebox > .pagedjs_area > .pagedjs_page_content > div'))
    .forEach((/** @type {HTMLElement} */elem) => elem.style.height = 'unset')

window.print();

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