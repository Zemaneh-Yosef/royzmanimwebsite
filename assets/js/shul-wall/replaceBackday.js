// @ts-check

import { jCal } from "./base.js";

for (const d8Displ of document.querySelectorAll(['', 'Formal', 'Y', 'SY', 'S', 'JewishFormal'].map(format => `[data-dateRender${format}-backday], [data-dateRenderShabbat${format}-backday]`).join(', '))) {
    if (!(d8Displ instanceof HTMLElement))
        continue;

    const attributes = d8Displ.dataset;
    const entryFound = Object.entries(attributes).find(attr => attr[0].startsWith('daterender'));

    const [dateRender] = entryFound[0].split(/(?<![A-Z])(?=[A-Z])/);

    const d8jCal = (dateRender.includes('shabbat') ? jCal.shabbat() : jCal.clone());
    d8jCal.setDate(d8jCal.getDate()[parseInt(entryFound[1]) < 0 ? 'add' : 'subtract']({ days: Math.abs(parseInt(entryFound[1])) }));

    if (dateRender.endsWith('jewishformal')) {
        d8Displ.innerHTML = d8jCal.dateRenderer('en-et').primary.text;
    } else if (dateRender.endsWith('formal')) {
        d8Displ.innerHTML = d8jCal.dateRenderer('en').primary.text;
    } else {
        d8Displ.innerHTML = d8jCal.formatFancyDate({
            dayLength: 'long',
            monthLength: (dateRender.endsWith('sy') || dateRender.endsWith('s') ? 'short' : 'long'),
            ordinal: true
        }).en + (dateRender.endsWith('y') ? ", " + d8jCal.getGregorianYear() : "")
    }
}