// @ts-check

import { moonGlyphSvg } from "../../../libraries/mooncalc/moonRiseSetCalc.js";
import WebsiteCalendar, { getOrdinal, HebrewNumberFormatter } from "../../WebsiteCalendar.js";

const MOON_GLYPH_SIZE = 40;
const MONTHS_PER_PAGE = 1;

/** @typedef {{ms: number, thetaDeg: number, phaseAngleDeg: number}} MoonEvent */
/** @typedef {import('./moon-birkat-worker.js').MonthResult} MonthResult */
/** @typedef {import('./moon-birkat-worker.js').BirkatRow} BirkatRow */

const TEXT = {
	en: {
		rises: 'Rises', sets: 'Sets', from: 'Visible from', until: 'Visible until', all: 'Visible all night',
		earlyTitle: 'Birkat Halevana: 3–7 days after the molad', month: 'Month', allShort: 'All night',
		legendRise: '↑ moon rises', legendSet: '↓ moon sets',
		onlyRise: 'Times shown are moonrise', onlySet: 'Times shown are moonset'
	},
	hb: {
		rises: 'זורחת', sets: 'שוקעת', from: 'נראית משעה', until: 'נראית עד', all: 'נראית כל הלילה',
		earlyTitle: 'ברכת הלבנה: מג׳ עד ז׳ ימים למולד', month: 'חודש', allShort: 'כל הלילה',
		legendRise: '↑ הלבנה זורחת', legendSet: '↓ הלבנה שוקעת',
		onlyRise: 'השעות הן זמני זריחת הלבנה', onlySet: 'השעות הן זמני שקיעת הלבנה'
	}
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

/**
 * True when `last` (the last piece of content on the page) extends past the bottom of the
 * page's content box. Measures the content itself rather than using scrollHeight, which
 * also counts unrelated descendants (page numbers, decorations positioned outside the flow).
 * Relies on `.page` having a fixed height (as it does for print layout).
 * @param {HTMLElement} page
 * @param {Element} last
 */
function overflows(page, last) {
    const pageBottom = page.getBoundingClientRect().bottom - (parseFloat(getComputedStyle(page).paddingBottom) || 0);
    return last.getBoundingClientRect().bottom > pageBottom + 1;
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
        if (!anchor || !months.length) return;

        // One hidden placeholder per month, so pages end up in order no matter which worker finishes first
        const placeholders = months.map(() => {
            const ph = document.createElement('div');
            ph.hidden = true;
            anchor.before(ph);
            return ph;
        });

        // One more placeholder after all the month pages, where the early (3-7 day) pages go.
        const earlyPlaceholder = document.createElement('div');
        earlyPlaceholder.hidden = true;
        anchor.before(earlyPlaceholder);

        /** Early-range results, kept in month order (null = not received / failed). @type {(MonthResult | null)[]} */
        const earlyResults = months.map(() => null);

        const poolSize = Math.min(months.length, Math.min(4, navigator.hardwareConcurrency || 2));
        let remainingWorkers = poolSize;

        for (let w = 0; w < poolSize; w++) {
            const indices = months.map((_, i) => i).filter(i => i % poolSize === w);
            const worker = new Worker('/assets/js/features/weeklyPrint/moon-birkat-worker.js', { type: 'module' });

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                worker.terminate();
                if (--remainingWorkers === 0)
                    this.buildEarlyPages(
                        /** @type {MonthResult[]} */ (earlyResults.filter(Boolean)),
                        earlyPlaceholder
                    );
            };

            worker.addEventListener('message', ({ data }) => {
                if (Array.isArray(data)) {
                    data.forEach((/** @type {MonthResult} */ monthResult, /** @type {number} */ k) => {
                        const ph = placeholders[indices[k]];
                        ph.insertAdjacentHTML('beforebegin', this.buildMoonPages([monthResult]));
                        ph.remove();
                        earlyResults[indices[k]] = monthResult;
                    });
                } else {
                    console.error('Moon worker failed:', data?.error);
                    indices.forEach(i => placeholders[i].remove());
                }
                finish();
            });
            worker.addEventListener('error', err => {
                console.error('Moon worker failed:', err);
                indices.forEach(i => placeholders[i].remove());
                finish();
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
     * @param {number} ms
     * @param {string} lang
     * @param {'h11'|'h12'|'h23'|'h24'} timeFormat
     */
    formatTime(ms, lang, timeFormat) {
        return Temporal.Instant.fromEpochMilliseconds(ms)
            .toZonedDateTimeISO(this.geoLocation.getTimeZone())
            .toLocaleString(lang == 'hb' ? 'he' : 'en', { hourCycle: timeFormat, hour: 'numeric', minute: '2-digit' });
    }

    /**
     * Gregorian date of an instant, as shown under the times, e.g. "Oct 5th".
     * @param {number} ms
     */
    formatDateLabel(ms) {
        const plainDate = Temporal.Instant.fromEpochMilliseconds(ms)
            .toZonedDateTimeISO(this.geoLocation.getTimeZone()).toPlainDate();
        return plainDate.toLocaleString('en', { month: 'short' }) + ' ' + getOrdinal(plainDate.day, true);
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
        const dateLabel = this.formatDateLabel(event.ms);
        const timeLabel = this.formatTime(event.ms, lang, timeFormat);
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
     * @param {MonthResult} monthResult
     */
    buildMoonMonthCard(monthResult) {
        const lang = this.settings.language;
        const timeFormat = this.settings.timeFormat;
        const title = lang == 'hb' ? monthResult.titleHe : monthResult.titleEn;

        const daysHtml = monthResult.rows.map(row => this.buildMoonDay(row, lang, timeFormat)).join('');

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
     * @param {MonthResult[]} monthResults
     */
    buildMoonPages(monthResults) {
        const pages = [];
        for (let i = 0; i < monthResults.length; i += MONTHS_PER_PAGE) {
            const chunk = monthResults.slice(i, i + MONTHS_PER_PAGE);
            if (chunk.length == 1) {
                const monthCard = this.buildMoonMonthCard(chunk[0])
                pages.push(`<div class="page birkatLevanaMoonPage verso" data-monthPrefix="${monthCard.id}">${monthCard.html}</div>`)
            } else {
                pages.push(`<div class="page birkatLevanaMoonPage verso">${chunk.map(m => this.buildMoonMonthCard(m).html).join('')}</div>`);
            }
        }
        return pages.join('');
    }

    /**
     * One table cell of the early table: times only, no glyph (the glyph lives in the column header).
     * @param {BirkatRow | undefined} row
     * @param {string} lang
     * @param {'h11'|'h12'|'h23'|'h24'} timeFormat
     */
    buildEarlyCell(row, lang, timeFormat) {
        if (!row) return `<td class="earlyCell empty">–</td>`;

        const t = TEXT[lang == 'hb' ? 'hb' : 'en'];
        const { rise, set } = row.events;
        const shownRise = row.coverage === 'both' || row.coverage === 'from' ? rise : null;
        const shownSet = row.coverage === 'both' || row.coverage === 'until' ? set : null;

        // Gregorian date under the times, like the main pages. When rise and set fall on
        // different civil dates (e.g. sets after midnight), each time gets its own date;
        // otherwise a single date goes under the whole cell.
        const riseDate = shownRise ? this.formatDateLabel(shownRise.ms) : null;
        const setDate = shownSet ? this.formatDateLabel(shownSet.ms) : null;
        const splitDates = riseDate !== null && setDate !== null && riseDate !== setDate;
        const hint = (/** @type {string | null} */ d) => d ? `<div class="dateHint">(${d})</div>` : '';

        const riseHtml = shownRise ? `<div class="earlyTime rise" title="${t.rises}"><span class="arrow">↑ </span>${this.formatTime(shownRise.ms, lang, timeFormat)}</div>` : '';
        const setHtml = shownSet ? `<div class="earlyTime set" title="${t.sets}"><span class="arrow">↓ </span>${this.formatTime(shownSet.ms, lang, timeFormat)}</div>` : '';

        let content;
        if (row.coverage === 'all')
            content = `<div class="earlyTime all">${t.allShort}</div>`; // no date, same as the main pages
        else if (splitDates)
            content = riseHtml + hint(riseDate) + setHtml + hint(setDate);
        else
            content = riseHtml + setHtml + hint(riseDate ?? setDate);

        return `<td class="earlyCell ${row.coverage}${row.bediavadOnly ? ' bediavadOnly' : ''}">${content}</td>`;
    }

    /**
     * Lays out the early (3-7 day) range as a table: one row per month, one column per day of the month.
     * The header row shows each day's moon glyph once, so the cells only need times.
     * Rows are added one by one; when the table overflows its page, a new page is started
     * with a fresh copy of the header. Called once, after every worker has reported back.
     * @param {MonthResult[]} monthResults  in month order
     * @param {HTMLElement} placeholder     the new pages are inserted where this sits, then it's removed
     */
    async buildEarlyPages(monthResults, placeholder) {
        // Measure with the real fonts: the fallback font is wider, wraps more, and makes rows look taller.
        if (document.fonts) await document.fonts.ready;

        const lang = this.settings.language;
        const timeFormat = this.settings.timeFormat;
        const t = TEXT[lang == 'hb' ? 'hb' : 'en'];

        const months = monthResults.filter(m => m.earlyRows && m.earlyRows.length);
        if (!months.length) {
            placeholder.remove();
            return;
        }

        // Columns: every day of the month that appears in any month, so all pages share one layout.
        // Header glyph for each day: the first month that has that day (the phase is near-identical between months).
        /** @type {Map<number, MoonEvent | null>} */
        const dayGlyph = new Map();
        for (const m of months)
            for (const row of m.earlyRows)
                if (!dayGlyph.has(row.jewishDay) || !dayGlyph.get(row.jewishDay))
                    dayGlyph.set(row.jewishDay, row.peak || row.events.mid || row.events.rise || row.events.set);
        const days = [...dayGlyph.keys()].sort((a, b) => a - b);

        const headerHtml = `<thead><tr>`
            + `<th class="monthHead">${t.month}</th>`
            + days.map(day => {
                const ev = dayGlyph.get(day);
                const glyph = ev ? moonGlyphSvg(ev.thetaDeg, ev.phaseAngleDeg, {
                    size: MOON_GLYPH_SIZE, horizon: false, label: 'Moon in the night sky'
                }) : '';
                const dayLabel = lang == 'hb' ? this.hNum.formatHebrewNumber(day) : day;
                return `<th class="dayHead"><div class="moonGlyph">${glyph}</div>${dayLabel}</th>`;
            }).join('')
            + `</tr></thead>`;

        const rowsHtml = months.map(m => {
            const byDay = new Map(m.earlyRows.map(r => [r.jewishDay, r]));
            const name = lang == 'hb' ? m.titleHe : m.titleEn;
            return `<tr><th class="monthName" scope="row">${name}</th>`
                + days.map(day => this.buildEarlyCell(byDay.get(day), lang, timeFormat)).join('')
                + `</tr>`;
        });

        /**
         * Brings a page's arrows and legend in line with the rows currently on it.
         * Called after every row change, BEFORE measuring, so the measurement matches the
         * final page: arrows add width, and on a narrow page that makes times wrap and rows taller.
         *  - rises and sets: arrows shown, legend explains both
         *  - only one kind:  arrows hidden, legend says what the times are
         *  - neither:        no legend
         * @param {HTMLElement} p
         */
        const refreshPage = p => {
            const hasRise = !!p.querySelector('.earlyTime.rise');
            const hasSet = !!p.querySelector('.earlyTime.set');
            const both = hasRise && hasSet;
            p.querySelectorAll('.earlyTime .arrow').forEach(a => { /** @type {HTMLElement} */ (a).hidden = !both; });

            const legend = /** @type {HTMLElement} */ (p.querySelector('.earlyLegend'));
            legend.hidden = !hasRise && !hasSet;
            legend.textContent = both ? `${t.legendRise} · ${t.legendSet}` : hasRise ? t.onlyRise : t.onlySet;
        };

        /** @returns {{page: HTMLElement, tbody: HTMLTableSectionElement}} */
        const newPage = () => {
            const page = document.createElement('div');
            page.className = 'page birkatLevanaMoonPage birkatLevanaEarlyPage verso';
            page.innerHTML = `
                <h2 class="moonPageTitle">${t.earlyTitle}</h2>
                <table class="earlyMoonTable">${headerHtml}<tbody></tbody></table>
                <div class="earlyLegend"></div>`;
            placeholder.before(page); // must be in the DOM (and not hidden) to be measured
            return { page, tbody: /** @type {HTMLTableSectionElement} */ (page.querySelector('tbody')) };
        };

        /** The last piece of content on the page, to compare against the page bottom. */
        const lastContent = (/** @type {HTMLElement} */ p) =>
            /** @type {Element} */ (p.querySelector('.earlyLegend:not([hidden])') || p.querySelector('table'));

        let { page, tbody } = newPage();
        for (const html of rowsHtml) {
            tbody.insertAdjacentHTML('beforeend', html);
            refreshPage(page);

            // Overflowed: move this row to a fresh page. A row alone on its page stays put.
            if (tbody.rows.length > 1 && overflows(page, lastContent(page))) {
                const row = /** @type {HTMLTableRowElement} */ (tbody.lastElementChild);
                row.remove();
                refreshPage(page); // the page may have gone back to single-kind without this row

                ({ page, tbody } = newPage());
                tbody.append(row);
                refreshPage(page);
            }
        }

        placeholder.remove();
    }
}