// @ts-check
import { createMoonCalc, AstronomyImp } from '../../../libraries/mooncalc/moonRiseSetCalc.js';
import * as KosherZmanim from '../../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteCalendar from '../../WebsiteCalendar.js';
import { ZemanFunctions, zDTFromFunc } from '../../ROYZmanim.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Clips [start, end] (epoch ms) to [minStart, maxEnd]. Returns null if the result is empty.
 * @param {number} start
 * @param {number} end
 * @param {number} minStart
 * @param {number} maxEnd
 * @returns {[number, number] | null}
 */
function clip(start, end, minStart, maxEnd) {
	const s = Math.max(start, minStart);
	const e = Math.min(end, maxEnd);
	return s < e ? [s, e] : null;
}

/**
 * Captures what the glyph needs at the instant of a moon rise/set.
 * @param {ReturnType<typeof createMoonCalc>} calc
 * @param {AstronomyImp.Observer} observer
 * @param {number | null} ms
 * @returns {{ms: number, thetaDeg: number, phaseAngleDeg: number} | null}
 */
function describeMoonEvent(calc, observer, ms) {
	if (ms === null) return null;
	const g = calc.moonGeometry(new Date(ms), observer);
	return { ms: Math.round(ms), thetaDeg: g.thetaDeg, phaseAngleDeg: g.phaseAngleDeg };
}

/**
 * How the moon covers the night window [winStart, winEnd) (epoch ms).
 *  'both'  - rises and sets inside the window
 *  'from'  - rises inside the window, still up when it ends
 *  'until' - already up when the window opens, sets inside it
 *  'all'   - up for the whole window
 * @param {{rise: number | null, set: number | null}} moon
 * @param {number} winStart
 * @param {number} winEnd
 * @returns {'both'|'from'|'until'|'all'}
 */
function classifyCoverage(moon, winStart, winEnd) {
	const within = (/** @type {number | null} */ t) => t !== null && t >= winStart && t < winEnd;
	const riseIn = within(moon.rise), setIn = within(moon.set);
	if (riseIn && setIn) return 'both';
	if (riseIn) return 'from';
	if (setIn) return 'until';
	return 'all';
}

/**
 * Finds the moon-up interval (rise -> set) that overlaps the window [winStart, winEnd], in epoch ms.
 *
 * The moon may already be up when the window opens (e.g. it rose in the afternoon and is still up
 * after tzet, which is the normal case around the full moon), so the search is NOT anchored to a
 * civil day. Rules:
 *  - Moon already up at winStart: interval is [the rise before winStart, the next set].
 *  - Moon not up at winStart: interval is [the next rise, the set after it], but only if that rise
 *    occurs before winEnd. Otherwise the moon is not in the sky at any point of the window -> null.
 *
 * `mode: 'lit'` is used because we care about the moon being illuminated/visible.
 * `limitDays` is the search horizon of the calculator.
 * rise or set is null only if the calculator finds none within its horizon.
 *
 * @param {ReturnType<typeof createMoonCalc>} calc
 * @param {AstronomyImp.Observer} observer
 * @param {number} winStart
 * @param {number} winEnd
 * @returns {{rise: number | null, set: number | null} | null}
 */
function findMoonUp(calc, observer, winStart, winEnd) {
	/** @type {{mode: 'lit', limitDays: number}} */
	const opts = { mode: 'lit', limitDays: 2 };
	const ms = (/** @type {AstronomyImp.AstroTime | null | undefined} */ t) => t ? t.date.getTime() : null;

	const nextRise = ms(calc.nextMoonRise(new Date(winStart), observer, opts));
	const nextSet = ms(calc.nextMoonSet(new Date(winStart), observer, opts));

	// A set that comes before the next rise means the moon is currently up.
	// (Condition is inlined, not stored in a boolean, so TS narrows nextSet to number inside.)
	if (nextSet !== null && (nextRise === null || nextSet < nextRise)) {
		// Walk forward from 2 days back to find the last rise before that set.
		let rise = null;
		let cursor = winStart - 2 * DAY_MS;
		for (let i = 0; i < 4; i++) {
			const r = ms(calc.nextMoonRise(new Date(cursor), observer, opts));
			if (r === null || r >= nextSet) break;
			rise = r;
			cursor = r + 60 * 1000;
		}
		return { rise, set: nextSet };
	}

	if (nextRise === null || nextRise >= winEnd)
		return null;

	// The set that completes THIS rise's arc, searched from the rise itself.
	return { rise: nextRise, set: ms(calc.nextMoonSet(new Date(nextRise), observer, opts)) };
}

/** @typedef {{geoCoordinates: [string, number, number, number, string]; months: {year: number; month: number}[]; israel: boolean; hourCalculator: "seasonal"|"degrees";}} birkatWorkerParam */

/**
 * @typedef {Object} MoonEvent
 * @property {number} ms
 * @property {number} thetaDeg
 * @property {number} phaseAngleDeg
 */

/**
 * @typedef {Object} MoonUpInterval
 * @property {number | null} rise
 * @property {number | null} set
 */

/**
 * @typedef {Object} RowMark
 * @property {number} time
 * @property {string} position
 */

/**
 * @typedef {Object} BirkatRow
 * @property {number} jewishDay
 * @property {{ lechatchila: [number, number] | null, bediavad: [number, number] }} night
 * @property {MoonUpInterval} moon
 * @property {'both'|'from'|'until'|'all'} coverage
 * @property {{ rise: MoonEvent | null, set: MoonEvent | null, mid: MoonEvent | null }} events
 * @property {boolean} bediavadOnly
 * @property {Record<string, RowMark>} [marks]
 */

/**
 * @typedef {Object} MonthResult
 * @property {number} year
 * @property {number} month
 * @property {number} monthID
 * @property {string} titleHe
 * @property {string} titleEn
 * @property {{ start: number, endStretch: number, endIkar: number }} limits
 * @property {Record<string, number>} unplacedMarks
 * @property {BirkatRow[]} rows
 */

/**
 * @param {birkatWorkerParam} x
 * @returns {MonthResult[]}
 */
function messageHandler(x) {
	const geoLocation = new KosherZmanim.GeoLocation(...x.geoCoordinates);
	const tz = geoLocation.getTimeZone();
	const baseCal = new WebsiteCalendar();
	const observer = new AstronomyImp.Observer(geoLocation.getLatitude(), geoLocation.getLongitude(), geoLocation.getElevation());
	const calc = createMoonCalc();
	const dayCalc = new ZemanFunctions(geoLocation, {
		elevation: x.israel,
		fixedMil: x.israel || x.hourCalculator == "seasonal",

		// Rest are unused, so we'll fill them with defaults
		candleLighting: 0,
		melakha: { minutes: 0, degree: 0 },
		rtKulah: false
	});

	return x.months.map(({ year, month }) => {
		const monthCal = baseCal.chainJewishDate(year, month, 15);
		const date15 = monthCal.getDate();
		const at15 = dayCalc.chainDate(date15);
		const atEve15 = dayCalc.chainDate(date15.subtract({ days: 1 }));

		// --- Global limits (these bound the loop and clip the ranges) ---
		const start = monthCal.getTchilasZmanKidushLevana7Days().withTimeZone(tz).epochMilliseconds;
		const endStretch = at15.timeRange.current.sunrise.epochMilliseconds; // bediavad end: sunrise of the 15th
		const endIkar = at15.getAlotHashahar().epochMilliseconds;             // lechatchila end: alot of the 15th

		// --- Marks only (NOT loop bounds): reported on the row they fall in ---
		/** @type {Record<string, number>} */
		const markTimes = {
			endStrict: monthCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(tz).epochMilliseconds,
			endEarlyIkar: atEve15.getAlotHashahar().epochMilliseconds,
			endEarlyStretch: atEve15.timeRange.current.sunrise.epochMilliseconds
		};
		const placedMarks = new Set();

		const rows = [];

		// A night starting on civil evening D runs until the morning of D+1.
		// The night that contains `start` may begin the evening before start's civil date.
		let nightDate = Temporal.PlainDate.from(
			Temporal.Instant.fromEpochMilliseconds(start).toZonedDateTimeISO(tz).toPlainDate()
		).subtract({ days: 1 });

		// Last night = the one ending at the morning of the 15th, so nightDate + 1 day <= date15.
		for (; Temporal.PlainDate.compare(nightDate.add({ days: 1 }), date15) <= 0; nightDate = nightDate.add({ days: 1 })) {
			const today = dayCalc.chainDate(nightDate);
			const tomorrow = today.tomorrow();

			const shkiya = today.getShkiya().epochMilliseconds;
			const tzet = today.getTzet().epochMilliseconds;
			const alot = tomorrow.getAlotHashahar().epochMilliseconds;
			const netz = zDTFromFunc(tomorrow.getNetz()).epochMilliseconds;
			const nextShkiya = tomorrow.getShkiya().epochMilliseconds;

			// Ranges, each clipped by its own global limits.
			const bediavad = clip(shkiya, netz, start, endStretch);    // full shkiya -> netz
			const lechatchila = clip(tzet, alot, start, endIkar);      // tzet -> alot (sub-range of bediavad)
			if (!bediavad)
				continue;

			// Moon-up interval overlapping the bediavad window. None -> skip the night entirely.
			const moon = findMoonUp(calc, observer, bediavad[0], bediavad[1]);
			if (!moon)
				continue;

			// Bediavad-only: the moon is not up at any point of the lechatchila range.
			const moonRise = moon.rise ?? -Infinity;
			const moonSet = moon.set ?? Infinity;
			const moonInLechatchila = lechatchila !== null && moonRise < lechatchila[1] && moonSet > lechatchila[0];

			/** @type {Record<string, {time: number, position: string}>} */
			const marks = {};
			for (const [name, t] of Object.entries(markTimes)) {
				// Uses the unclipped boundaries so the position is about the day, not the clipping.
				let position = null;
				if (t >= shkiya && t < tzet) position = 'shkiyaToTzet';
				else if (t >= tzet && t < alot) position = 'lechatchila';
				else if (t >= alot && t < netz) position = 'alotToNetz';
				else if (t >= netz && t < nextShkiya) position = 'day'; // the daytime after this night
				if (position) {
					marks[name] = { time: t, position };
					placedMarks.add(name);
				}
			}

			const coverage = classifyCoverage(moon, bediavad[0], bediavad[1]);
			const midMs = Math.round(bediavad[0] + (bediavad[1] - bediavad[0]) / 2);

			rows.push({
				jewishDay: nightDate.add({ days: 1 }).withCalendar("hebrew").day,
				night: { lechatchila, bediavad },
				moon,
				coverage,
				events: {
					rise: coverage === 'both' || coverage === 'from' ? describeMoonEvent(calc, observer, moon.rise) : null,
					set:  coverage === 'both' || coverage === 'until' ? describeMoonEvent(calc, observer, moon.set) : null,
					mid:  coverage === 'all' ? describeMoonEvent(calc, observer, midMs) : null
				},
				bediavadOnly: !moonInLechatchila,
				...(Object.keys(marks).length ? { marks } : {})
			});
		}

		// Mark times that fell on no emitted row (e.g. a skipped night, or outside the loop).
		/** @type {Record<string, number>} */
		const unplacedMarks = {};
		for (const [name, t] of Object.entries(markTimes))
			if (!placedMarks.has(name))
				unplacedMarks[name] = t;

		return {
			year, month,
			monthID: monthCal.getJewishMonth(),
			titleHe: monthCal.formatJewishMonth().he,
			titleEn: monthCal.formatJewishMonth().en,
			limits: { start, endStretch, endIkar },
			unplacedMarks,
			rows
		};
	});
}

addEventListener('message', async (message) => {
	try {
		if (!('Temporal' in globalThis)) {
			const { Temporal } = await import('https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.2/+esm');
			globalThis.Temporal = Temporal;
		}
		postMessage(messageHandler(message.data));
	} catch (err) {
		console.error('moon-birkat-worker failed:', err);
		throw err;
	}
});