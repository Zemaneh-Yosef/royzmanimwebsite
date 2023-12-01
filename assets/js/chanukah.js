// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "./ROYZmanim.js";
import WebsiteCalendar from "./WebsiteCalendar.js"
import { settings } from "./settings/handler.js";

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const calc = (settings.location.timezone() == 'Asia/Jerusalem' ? new OhrHachaimZmanim(geoLocation, true) : (new AmudehHoraahZmanim(geoLocation)))
const jCal = new WebsiteCalendar()

for (const title of document.getElementsByClassName('shabbatTitleCore')) {
    title.innerHTML = [
        `<span style="font-size: 0.85em">${settings.location.name().replaceAll(' ', '  ')}</span>`,
        title.innerHTML,
        jCal.formatJewishYear().hebrew
    ].join('')
}

let baseElem = document.getElementById("lastTitle")

let biH = false;
if (baseElem.style.gridColumn == "3")
    biH = true;

jCal.setJewishDate(jCal.getJewishYear(), KosherZmanim.JewishCalendar.KISLEV, 24);
calc.coreZC.setDate(jCal.getDate().toZonedDateTime(settings.location.timezone()))
for (let i = 0; i <= 7; i++) {
    const image = document.createElement('img');
    image.src = `/assets/images/hanukah/menorah-${i + 1}.png`
    image.style.height = "1em";
    image.style.verticalAlign = "baseline";
    image.style.paddingRight = ".6ch"
    image.style.filter = "invert(1)"

    const dateElem = document.createElement('div');
    dateElem.classList.add('shabbatRow')
    dateElem.appendChild(image)
    dateElem.appendChild(document.createTextNode(jCal.formatFancyDate()))

    baseElem.insertAdjacentElement('afterend', dateElem);

    /** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
    const timeFormatAttr = ['en', {
        hourCycle: settings.timeFormat(),
        timeStyle: "short"
    }]

    if ([5,6].includes(jCal.getDate().dayOfWeek)) {
        dateElem.style.lineHeight = "1";
        dateElem.appendChild(document.createElement('br'))

        const explanation = document.createElement('span')
        explanation.classList.add('explanation');
        explanation.appendChild(document.createTextNode(
            jCal.getDate().dayOfWeek == 5
                ? '(Light Chanukah Candles before Shabbat Candles)'
                : '(At home, make Havdalah before lighting Chanukah Candles)'
        ));
        dateElem.appendChild(explanation);

        const timeContElem = document.createElement('div');
        timeContElem.classList.add("timeshow", "shabbatRow");
        timeContElem.style.height = "100%"
        if (biH)
            timeContElem.style.gridColumnEnd = "span 2";

        const timeElem = document.createElement('span')
        timeElem.appendChild(document.createTextNode(
            jCal.getDate().dayOfWeek == 5
                ? calc.getCandleLighting().toLocaleString(...timeFormatAttr)
                : calc.getTzaitShabbath().toLocaleString(...timeFormatAttr) + ` (RT: ${calc.getTzaitRT().toLocaleString(...timeFormatAttr)})`
        ));

        timeContElem.appendChild(timeElem)
        dateElem.insertAdjacentElement('afterend', timeContElem)
        baseElem = timeContElem;
    } else {
        const tzeitOvadia = document.createElement('div');
        tzeitOvadia.classList.add("timeshow", "shabbatRow");
        tzeitOvadia.append(document.createTextNode(calc.getTzait().toLocaleString(...timeFormatAttr)))

        dateElem.insertAdjacentElement('afterend', tzeitOvadia)
        if (biH) {
            const tzeitBIH = document.createElement('div')
            tzeitBIH.classList.add("timeshow", "shabbatRow");
            tzeitBIH.append(document.createTextNode(calc.getTzaitBenIshHai().toLocaleString(...timeFormatAttr)))

            tzeitOvadia.insertAdjacentElement('afterend', tzeitBIH)
            baseElem = tzeitBIH
        } else {
            baseElem = tzeitOvadia;
        }
    }

    jCal.setDate(jCal.getDate().add({days: 1}))
    calc.coreZC.setDate(calc.coreZC.getDate().add({ days: 1 }))
}