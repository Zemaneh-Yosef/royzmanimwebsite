// @ts-check

import { moonGlyphSvg } from "../../../libraries/mooncalc/moonRiseSetCalc.js";
import WebsiteCalendar, { getOrdinal, HebrewNumberFormatter } from "../../WebsiteCalendar.js";

const MOON_GLYPH_SIZE = 40;
const MONTHS_PER_PAGE = 1;

/** @typedef {{ms: number, thetaDeg: number, phaseAngleDeg: number}} MoonEvent */

const TEXT = {
	en: { rises: 'Rises', sets: 'Sets', from: 'Visible from', until: 'Visible until', all: 'Visible all night' },
	hb: { rises: 'זורחת', sets: 'שוקעת', from: 'נראית משעה', until: 'נראית עד', all: 'נראית כל הלילה' }
};

/**
 * @param {Temporal.PlainDate} startDate
 * @param {Temporal.PlainDate} endDate
 */
function collectHebrewMonths(startDate, endDate) {
    const months = [];
    const jd = new WebsiteCalendar(startDate);
    let seenKey = null;

    for (let cursor = startDate; Temporal.PlainDate.compare(cursor, endDate) <= 0; cursor = cursor.add({ days: 1 })) {
        jd.setDate(cursor);
        const key = jd.getJewishYear() + '-' + jd.getJewishMonth();
        if (key !== seenKey) {
            months.push({ year: jd.getJewishYear(), month: jd.getJewishMonth() });
            seenKey = key;
        }
    }
    return months;
}

export default class MoonRender {
    hNum = new HebrewNumberFormatter();

    /**
     * @param {import('../../../libraries/kosherZmanim/kosher-zmanim').GeoLocation} geoLocation
     * @param {{language: "en" | "hb" | "en-et";timeFormat: 'h11' | 'h12' | 'h23' | 'h24';hourCalculator: "seasonal" | "degrees";}} settings
     * @param {Temporal.PlainDate} baseDate
     * @param {Temporal.PlainDate} endDate
     */
    constructor(geoLocation, settings, baseDate, endDate) {
        this.geoLocation = geoLocation;
        this.settings = settings;

        const hebrewMonthsInRange = collectHebrewMonths(baseDate.withCalendar('hebrew'), endDate.withCalendar('hebrew'));
        /** @type {[string, number, number, number, string]} */
        // @ts-ignore
        const glArgs = [geoLocation.getLocationName(), geoLocation.getLatitude(), geoLocation.getLongitude(), geoLocation.getElevation(),
            geoLocation.getTimeZone()
        ];

        const israel = ['israel', 'ישראל'].some(isrName => (geoLocation.getLocationName() || "").toLowerCase().includes(isrName));

        this.spawnMoonWorkers(hebrewMonthsInRange, glArgs, israel);
    }

    /**
     * @param {{year: number; month: number}[]} months
     * @param {[string, number, number, number, string]} glArgs
     * @param {boolean} israel
     */
    spawnMoonWorkers(months, glArgs, israel) {
        const anchor = document.querySelector('[data-monthPrefix^="7"]');
        if (!anchor) return;

        // One hidden placeholder per month, so pages end up in order no matter which worker finishes first
        const placeholders = months.map(() => {
            const ph = document.createElement('div');
            ph.hidden = true;
            anchor.before(ph);
            return ph;
        });

        const poolSize = Math.min(months.length, Math.min(4, navigator.hardwareConcurrency || 2));

        for (let w = 0; w < poolSize; w++) {
            const indices = months.map((_, i) => i).filter(i => i % poolSize === w);
            const worker = new Worker('/assets/js/features/weeklyPrint/moon-birkat-worker.js', { type: 'module' });

            worker.addEventListener('message', ({ data }) => {
                data.forEach((/** @type {any} */ monthResult, /** @type {number} */ k) => {
                    const ph = placeholders[indices[k]];
                    ph.insertAdjacentHTML('beforebegin', this.buildMoonPages([monthResult]));
                    ph.remove();
                });
                worker.terminate();
            });
            worker.addEventListener('error', err => {
                console.error('Moon worker failed:', err);
                worker.terminate();
            });

            worker.postMessage({
                geoCoordinates: glArgs,
                months: indices.map(i => months[i]),
                israel,
                hourCalculator: this.settings.hourCalculator
            });
        }
    }

    /**
     * @param {MoonEvent | null} event
     * @param {'rise'|'set'|'mid'} kind  'mid' = open night sky (no horizon, no time)
     * @param {string} label
     * @param {string} lang
     * @param {'h11'|'h12'|'h23'|'h24'} timeFormat
     * @param {boolean} wide  span both columns of the day block
     */
    moonCell(event, kind, label, lang, timeFormat, wide) {
        if (!event) return '';

        const zdt = Temporal.Instant.fromEpochMilliseconds(event.ms)
            .toZonedDateTimeISO(this.geoLocation.getTimeZone());
        const plainDate = zdt.toPlainDate();
        const dateLabel = plainDate.toLocaleString('en', { month: 'short' }) + ' ' + getOrdinal(plainDate.day, true);
        const timeLabel = zdt.toLocaleString(lang == 'hb' ? 'he' : 'en', {
            hourCycle: timeFormat, hour: 'numeric', minute: '2-digit'
        });
        const glyph = moonGlyphSvg(event.thetaDeg, event.phaseAngleDeg, {
            size: MOON_GLYPH_SIZE,
            horizon: kind !== 'mid',
            label: kind === 'mid' ? 'Moon in the night sky' : `Moon at ${kind}`
        });

        return `<div class="moonCell${wide ? ' wide' : ''}">`
            + `<div class="moonGlyph">${glyph}</div>`
            + `<div class="timeVal">${kind === 'mid' ? label : `${label} ${timeLabel}`}</div>`
            + (kind === 'mid' ? '' : `<div class="dateHint">(${dateLabel})</div>`)
            + `</div>`;
    }

    /**
     * @param {{ jewishDay: number; coverage: 'both'|'from'|'until'|'all'; events: { rise: MoonEvent | null; set: MoonEvent | null; mid: MoonEvent | null } }} row
     * @param {string} lang
     * @param {'h11'|'h12'|'h23'|'h24'} timeFormat
     */
    buildMoonDay(row, lang, timeFormat) {
        const t = TEXT[lang == 'hb' ? 'hb' : 'en'];
        const { rise, set, mid } = row.events;
        const dayLabel = lang == 'hb' ? this.hNum.formatHebrewNumber(row.jewishDay) : row.jewishDay;

        let cells;
        switch (row.coverage) {
            case 'both':
                cells = this.moonCell(rise, 'rise', t.rises, lang, timeFormat, false)
                    + this.moonCell(set, 'set', t.sets, lang, timeFormat, false);
                break;
            case 'from':
                cells = this.moonCell(rise, 'rise', t.from, lang, timeFormat, true);
                break;
            case 'until':
                cells = this.moonCell(set, 'set', t.until, lang, timeFormat, true);
                break;
            default:
                cells = this.moonCell(mid, 'mid', t.all, lang, timeFormat, true);
        }

        return `<div class="moonDay"><div class="dayNum">${dayLabel}</div>${cells}</div>`;
    }

    /**
     * @param {import('./moon-birkat-worker.js').MonthResult} monthResult
     */
    buildMoonMonthCard(monthResult) {
        const lang = this.settings.language;
        const timeFormat = this.settings.timeFormat;
        const title = lang == 'hb' ? monthResult.titleHe : monthResult.titleEn;

        const daysHtml = monthResult.rows.map((/** @type {any} */ row) => this.buildMoonDay(row, lang, timeFormat)).join('');

        return {
            html: `
            <div class="moonMonthCard">
                <h2 class="moonPageTitle">${title}</h2>
                <div class="moonGrid">
                    ${daysHtml}
                </div>
            </div>`,
            id: monthResult.monthID
        };
    }

    /**
     * @param {import('./moon-birkat-worker.js').MonthResult[]} monthResults
     */
    buildMoonPages(monthResults) {
        const pages = [];
        for (let i = 0; i < monthResults.length; i += MONTHS_PER_PAGE) {
            const chunk = monthResults.slice(i, i + MONTHS_PER_PAGE);
            if (chunk.length == 1) {
                const monthCard = this.buildMoonMonthCard(chunk[0])
                pages.push(`<div class="page birkatLevanaMoonPage verso" data-monthPrefix="${monthCard.id}">${monthCard.html}</div>`)
            } else {
                pages.push(`<div class="page birkatLevanaMoonPage verso">${chunk.map(m => this.buildMoonMonthCard(m)).join('')}</div>`);
            }
        }
        return pages.join('');
    }
}