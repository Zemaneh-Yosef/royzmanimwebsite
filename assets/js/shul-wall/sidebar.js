// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { ZemanFunctions } from "../ROYZmanim.js";
import preSettings from "./preSettings.js";

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
const geoL = new KosherZmanim.GeoLocation(...glArgs);

const dateForSet = Temporal.Now.plainDateISO(preSettings.location.timezone());
const jCal = new WebsiteLimudCalendar(dateForSet);
jCal.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))

const zmanCalc = new ZemanFunctions(geoL, {
    elevation: jCal.getInIsrael(),
    rtKulah: preSettings.calendarToggle.rtKulah(),
    candleLighting: preSettings.customTimes.candleLighting(),
    fixedMil: preSettings.calendarToggle.forceSunSeasonal() || jCal.getInIsrael(),
    melakha: preSettings.customTimes.tzeithIssurMelakha()
})
zmanCalc.setDate(dateForSet);

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
	hourCycle: preSettings.timeFormat(),
	hour: 'numeric',
	minute: '2-digit'
}];

/** @param {HTMLElement} [fastContainer] */
function renderFastIndex(fastContainer) {
    const todayFast = jCal.isTaanis() || jCal.isTaanisBechoros();
    if (!todayFast && !jCal.tomorrow().isTaanis() && !jCal.tomorrow().isTaanisBechoros()) {
        fastContainer.style.display = "none";
        return;
    }
    fastContainer.style.removeProperty("display");

    /**
     * @param {Element} contElem
     */
    function hideErev(contElem, inverse=false) {
        const cond = (inverse ? !todayFast : todayFast)
        contElem.querySelectorAll('[data-zfFind="erevTzom"]')
            .forEach(elem => {
                if (!(elem instanceof HTMLElement))
                    return;

                if (cond)
                    elem.style.display = "none";
                else
                    elem.style.removeProperty("display");
            });
    }

    const fastJCal = jCal.isTaanis() || jCal.isTaanisBechoros() ? jCal : jCal.tomorrow();
    const fastCalc = zmanCalc.chainDate(fastJCal.getDate());
    const nameElements = [...fastContainer.getElementsByTagName("h5")];
    nameElements.forEach(element => element.style.display = "none");

    const ourFast = nameElements.find(fastElm =>
        fastElm.getAttribute("data-zfFind") == (fastJCal.isTaanisBechoros() ? 0 : fastJCal.getYomTovIndex()).toString()
    );
    hideErev(ourFast);
    ourFast.style.removeProperty("display");

    /** @type {Record<'multiDay' | 'oneDay', HTMLElement>} */
    const timeList = {
        multiDay: fastContainer.querySelector('[data-zfFind="twoDayTimes"]'),
        oneDay: fastContainer.querySelector('[data-zfFind="oneDayTimes"]')
    };

    if ([KosherZmanim.JewishCalendar.TISHA_BEAV, KosherZmanim.JewishCalendar.YOM_KIPPUR].includes(fastJCal.getYomTovIndex())) {
        timeList.oneDay.style.display = "none";
        timeList.multiDay.style.removeProperty("display");

        const erevTzom = timeList.multiDay.firstElementChild;
        hideErev(erevTzom);
        if (erevTzom.lastChild.nodeType == Node.TEXT_NODE) {
            erevTzom.lastChild.remove();
        }

        const erevCalc = zmanCalc.chainDate(fastJCal.getDate().subtract({ days: 1 }));
        const timeOnErev =
            (fastJCal.getYomTovIndex() == KosherZmanim.JewishCalendar.YOM_KIPPUR ? erevCalc.getCandleLighting() : erevCalc.getShkiya())
        erevTzom.appendChild(document.createTextNode(timeOnErev.toLocaleString(...dtF)));

        const yomTzom = timeList.multiDay.lastElementChild;
        hideErev(yomTzom, true);
        if (yomTzom.lastChild.nodeType == Node.TEXT_NODE)
            yomTzom.lastChild.remove();

        if (jCal.isYomKippur()) {
            yomTzom.appendChild(document.createTextNode(
                fastCalc.getTzetMelakha().toLocaleString(...dtF) + ` (R"T: ${fastCalc.getTzetRT().toLocaleString(...dtF)})`
            ));
        } else {
            yomTzom.appendChild(document.createTextNode(fastCalc.getTzetHumra().toLocaleString(...dtF)))
        }
    } else {
        timeList.multiDay.style.display = "none";
        timeList.oneDay.style.removeProperty("display")
        if (timeList.oneDay.lastChild.nodeType == Node.TEXT_NODE) {
            timeList.oneDay.lastChild.remove();
        }

        timeList.oneDay.appendChild(document.createTextNode(
            fastCalc.getAlotHashahar().toLocaleString(...dtF) + ' - ' + fastCalc.getTzetHumra().toLocaleString(...dtF)
        ))
    }
}

/** @param {HTMLElement} [mourningDiv] */
function writeMourningPeriod(mourningDiv) {
    if (!jCal.isMourningPeriod()) {
        mourningDiv.style.display = "none";
        return;
    }
    mourningDiv.style.removeProperty("display");

    /** @type {HTMLElement} */
    const sefirathHaomer = mourningDiv.querySelector('[data-zfFind="SefirathHaomer"]');

    /** @type {HTMLElement} */
    const threeWeeks = mourningDiv.querySelector('[data-zfFind="ThreeWeeksHeader"]');
    if (jCal.getDayOfOmer() !== -1) {
        sefirathHaomer.style.removeProperty("display");
        threeWeeks.style.display = "none";

        const eachLang = Object.fromEntries(Array.from(sefirathHaomer.children)
            .filter(elem => elem.tagName == "DIV")
            .map(elem => [Array.from(elem.classList)[1].replace('lang-', ''), elem]));

        for (const [lang, elem] of Object.entries(eachLang)) {
            const finalDayAdjust = (jCal.tomorrow().getDayOfOmer() == -1 ? "add" : "remove")
            elem.lastElementChild.classList[finalDayAdjust]("d-none");
            elem.lastElementChild.previousElementSibling.classList[finalDayAdjust]("mb-0")

            for (const completeCount of elem.querySelectorAll('[data-zfReplace="completeCount"]')) {
                const jCalOmer = (completeCount.getAttribute('data-omerDay') == 'tomorrow' ? jCal.tomorrow() : jCal)
                // @ts-ignore
                completeCount.innerHTML = jCalOmer.getOmerInfo().title[lang].mainCount
            }

            for (const indCount of elem.querySelectorAll('[data-zfReplace="indCount"]')) {
                const jCalOmer = (indCount.getAttribute('data-omerDay') == 'tomorrow' ? jCal.tomorrow() : jCal)
                if (jCalOmer.getDayOfOmer() >= 7) {
                    indCount.parentElement.style.removeProperty("display");
                    // @ts-ignore
                    indCount.innerHTML = jCalOmer.getOmerInfo().title[lang].subCount.toString();
                } else {
                    indCount.parentElement.style.display = 'none';
                }
            }
        }

        /** @type {HTMLElement} */
        const omerRules = mourningDiv.querySelector('[data-zfFind="omerRules"]')
        if (Object.values(jCal.mourningHalachot()).every(elem => elem == false)) {
            omerRules.style.display = "none"
        } else {
            omerRules.style.removeProperty("display");
        }
    } else {
        sefirathHaomer.style.display = 'none';
        threeWeeks.style.removeProperty("display");

        /** @type {HTMLElement[]} */
        const threeWeeksText = Array.from(threeWeeks.querySelectorAll('[data-zfFind="threeWeeks"]'));
        /** @type {HTMLElement[]} */
        const nineDaysText = Array.from(threeWeeks.querySelectorAll('[data-zfFind="nineDays"]'));
        /** @type {HTMLElement[]} */
        const weekOfText = Array.from(threeWeeks.querySelectorAll('[data-zfFind="weekOf"]'));

        if (jCal.isShvuaShechalBo()) {
            weekOfText.forEach((elem) => elem.style.removeProperty("display"));

            ([nineDaysText, threeWeeksText]).flat()
                .forEach((elem) => elem.style.display = "none")
        } else if (jCal.getJewishMonth() == KosherZmanim.JewishCalendar.AV) {
            nineDaysText.forEach((elem) => elem.style.removeProperty("display"));

            ([weekOfText, threeWeeksText]).flat()
                .forEach((elem) => elem.style.display = "none")
        } else {
            threeWeeksText.forEach((elem) => elem.style.removeProperty("display"));

            ([weekOfText, nineDaysText]).flat()
                .forEach((elem) => elem.style.display = "none")
        }
    }

    for (const [key, value] of Object.entries(jCal.mourningHalachot())) {
        mourningDiv.querySelectorAll(`[data-zfFind="${key}"]`)
            .forEach((/** @type {HTMLElement} */ halachaIndex) => {
                if (value)
                    halachaIndex.style.removeProperty("display")
                else
                    halachaIndex.style.display = "none"
            })
    }
}

for (const fastContainer of document.querySelectorAll('[data-zfFind="FastDays"]'))
    if (fastContainer instanceof HTMLElement)
        renderFastIndex(fastContainer)

const specialDayText = jCal.listOfSpecialDays().join(" / ");
for (const specialDay of document.querySelectorAll('[data-zfReplace="SpecialDay"]')) {
    if (!(specialDay instanceof HTMLElement))
        continue;

    if (!specialDayText) {
        specialDay.style.display = "none";
    } else {
        specialDay.style.removeProperty("display");
        specialDay.innerHTML = specialDayText;
    }
}

for (const mourningDiv of document.querySelectorAll('[data-zfFind="MourningPeriod"]')) {
    if (mourningDiv instanceof HTMLElement)
        writeMourningPeriod(mourningDiv);
}

document.querySelectorAll('[data-zfReplace="Ulchaparat"]').forEach(
    (/**@type {HTMLElement} */ulchaparat) => {
        if (jCal.isRoshChodesh()) {
            ulchaparat.style.removeProperty("display");
            ulchaparat.innerHTML = (jCal.tefilahRules().amidah.ulChaparatPesha ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע")
        } else {
            ulchaparat.style.display = "none";
        }
    }
)

document.querySelectorAll('[data-zfFind="Chamah"]').forEach(
    (/**@type {HTMLElement} */chamah) => {
        if (jCal.isBirkasHachamah()) {
            chamah.style.removeProperty("display");
        } else {
            chamah.style.display = "none";
        }
    }
)

document.querySelectorAll('[data-zfFind="BirchatHalevana"]').forEach(
    (/**@type {HTMLElement} */birchatHalevana) => {
        const birLev = jCal.birkathHalevanaCheck(zmanCalc);
        if (!birLev.current) {
            birchatHalevana.style.display = "none";
            return;
        }

        birchatHalevana.style.removeProperty("display");
        birchatHalevana.querySelectorAll('[data-zfReplace="date-en-end"]').forEach(
            endDate => endDate.innerHTML = birLev.data.end.toLocaleString("en", {day: 'numeric', month: 'short'})
        )

        const bhHeb = birchatHalevana.querySelector('[data-zfReplace="date-hb-end"]')
        if (bhHeb)
            bhHeb.innerHTML = birLev.data.end.toLocaleString("he", {day: 'numeric', month: 'short'})

        const bhRus = birchatHalevana.querySelector('[data-zfReplace="date-ru-end"]')
        if (bhRus)
            bhRus.innerHTML = birLev.data.end.toLocaleString("ru", {day: 'numeric', month: 'short'})

        if (birLev.data.start.dayOfYear == jCal.getDate().dayOfYear) {
            birchatHalevana.querySelectorAll('[data-zfFind="starts-tonight"]').forEach(
                //@ts-ignore
                startsToday => startsToday.style.removeProperty("display")
            )
        } else {
            birchatHalevana.querySelectorAll('[data-zfFind="starts-tonight"]').forEach(
                //@ts-ignore
                startsToday => startsToday.style.display = "none"
            )
        }

        if (birLev.data.end.dayOfYear == jCal.getDate().dayOfYear) {
            birchatHalevana.querySelectorAll('[data-zfFind="ends-tonight"]').forEach(
                //@ts-ignore
                endsToday => endsToday.style.removeProperty("display")
            )
        } else {
            birchatHalevana.querySelectorAll('[data-zfFind="ends-tonight"]').forEach(
                //@ts-ignore
                endsToday => endsToday.style.display = "none"
            )
        }
    }
)

/** @param {HTMLElement} [tefilahRuleContainer] */
function renderSeasonalRules(tefilahRuleContainer) {
    /** @type {import('../WebsiteCalendar.js').default} */
    let calForRules = jCal;
    if (jCal.getDate().equals(Temporal.Now.plainDateISO())
        && Temporal.ZonedDateTime.compare(zmanCalc.getTzet(), Temporal.Now.zonedDateTimeISO(geoL.getTimeZone())) < 1) {
        calForRules = jCal.tomorrow();
    }
    const seasonalRules = [
        calForRules.tefilahRules().amidah.mechayehHametim,
        calForRules.tefilahRules().amidah.mevarechHashanim
    ];

    tefilahRuleContainer.querySelector('[data-zfReplace="SeasonalPrayers"]').innerHTML = seasonalRules.filter(Boolean).join(" / ");
}

document.querySelectorAll('[data-zfReplace="Tachanun"]').forEach(
    (/**@type {HTMLElement} */tachanun) => {
        if (jCal.isYomTovAssurBemelacha()) {
            tachanun.style.display = "none";
            return;
        }

        tachanun.style.removeProperty("display");
        if (jCal.getDayOfWeek() == 7) {
            tachanun.innerHTML = jCal.tefilahRules().tachanun == 0 ? "צדקתך" : "יהי שם"
        } else {
            switch (jCal.tefilahRules().tachanun) {
                case 2:
                    tachanun.innerHTML = "No Taḥanun";
                    break;
                case 1:
                    tachanun.innerHTML = "Only Taḥanun at Shacharit";
                    break;
                case 0:
                    tachanun.innerHTML = "Calendar-Taḥanun Day";
            }
        }
    }
)

const hallelText = jCal.tefilahRules().hallel;
document.querySelectorAll('[data-zfReplace="Hallel"]').forEach(
    (/**@type {HTMLElement} */hallel) => {
        if (!hallelText) {
            hallel.style.display = "none";
        } else {
            hallel.style.removeProperty("display");
            hallel.innerHTML = hallelText == 2 ? "הלל שלם (עם ברכה)" : "חצי הלל (בלי ברכה)";
        }
    }
)

const tekufaDate = zmanCalc.nextTekufa(preSettings.calendarToggle.tekufaMidpoint() !== "hatzoth");
if (jCal.getDate().toZonedDateTime(geoL.getTimeZone()).until(tekufaDate).total('days') < 1) {
    /** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
    const tekufaTF = [dtF[0], { ...dtF[1] }]
    delete tekufaTF[1].second

    const nextTekufaJDate = [1, 4, 7, 10]
        .map(month => new KosherZmanim.JewishDate(jCal.getJewishYear(), month, 15))
        .sort((jDateA, jDateB) => {
            const durationA = jCal.getDate().until(jDateA.getDate())
            const durationB = jCal.getDate().until(jDateB.getDate())

            return Math.abs(durationA.total('days')) - Math.abs(durationB.total('days'))
        })[0]

    /** @type {{en: string; he: string}} */
    // @ts-ignore
    const nextTekufotNames = ['en', 'he']
        .map(locale => [locale, nextTekufaJDate.getDate().toLocaleString(locale + '-u-ca-hebrew', { month: 'long' })])
        .reduce(function (obj, [key, val]) {
            //@ts-ignore
            obj[key] = val
            return obj
        }, {})

    for (let tekufa of document.querySelectorAll('[data-zfFind="Tekufa"]')) {
        if (!(tekufa instanceof HTMLElement))
            continue;

        tekufa.style.removeProperty("display");

        Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaTime"]'))
            .forEach(element => element.innerHTML = tekufaDate.round("minute").toLocaleString(...tekufaTF));
        Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaFastTime"]'))
            .forEach(element => element.innerHTML =
                [
                    tekufaDate.round("minute").subtract({ minutes: 30 }).toLocaleString(...tekufaTF),
                    tekufaDate.round("minute").add({ minutes: 30 }).toLocaleString(...tekufaTF),
                ].join('-')
            );

        Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaName-en"]'))
            .forEach(element => element.innerHTML = nextTekufotNames.en);
        tekufa.querySelector('[data-zfReplace="tekufaName-hb"]').innerHTML = nextTekufotNames.he;
    }
} else {
    document.querySelectorAll('[data-zfFind="Tekufa"]').forEach(
        (/**@type {HTMLElement} */ tekufa) => tekufa.style.display = "none"
    )
}

for (let seasonalRuleContainer of document.querySelectorAll('[data-zfFind="SeasonalPrayers"]')) {
    if (seasonalRuleContainer instanceof HTMLElement)
        renderSeasonalRules(seasonalRuleContainer);
}