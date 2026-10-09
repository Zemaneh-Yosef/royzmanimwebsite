// @ts-check
import { createMoonCalc, AstronomyImp } from '../../../libraries/mooncalc/moonRiseSetCalc.js';
import * as KosherZmanim from '../../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteCalendar from '../../WebsiteCalendar.js';
import { ZemanFunctions, zDTFromFunc } from '../../ROYZmanim.js';
import { providerFromSnapshot } from '../../refraction-snapshot.js';
import { moonHorizonTarget } from '../../moon-refraction.js';
import { createVisibleMoon } from '../../moon-visible.js';

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
 * Next moonrise / moonset at or after an instant (epoch ms), or null if none within the search horizon.
 * @typedef {{ rise: (epochMs: number) => number | null, set: (epochMs: number) => number | null }} MoonEvents
 */

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
 * `events` decides what rise / set mean: visible over the terrain when there is a moon horizon, else
 * the lit limb on the flat horizon (see messageHandler).
 * rise or set is null only if none is found within the search horizon.
 *
 * @param {MoonEvents} events
 * @param {number} winStart
 * @param {number} winEnd
 * @returns {{rise: number | null, set: number | null} | null}
 */
function findMoonUp(events, winStart, winEnd) {
	const nextRise = events.rise(winStart);
	const nextSet = events.set(winStart);

	// A set that comes before the next rise means the moon is currently up.
	// (Condition is inlined, not stored in a boolean, so TS narrows nextSet to number inside.)
	if (nextSet !== null && (nextRise === null || nextSet < nextRise)) {
		// Walk forward from 2 days back to find the last rise before that set.
		let rise = null;
		let cursor = winStart - 2 * DAY_MS;
		for (let i = 0; i < 4; i++) {
			const r = events.rise(cursor);
			if (r === null || r >= nextSet) break;
			rise = r;
			cursor = r + 60 * 1000;
		}
		return { rise, set: nextSet };
	}

	if (nextRise === null || nextRise >= winEnd)
		return null;

	// The set that completes THIS rise's arc, searched from the rise itself.
	return { rise: nextRise, set: events.set(nextRise) };
}

/** @typedef {{geoCoordinates: [string, number, number, number, string]; months: {year: number; month: number}[]; israel: boolean; hourCalculator: "seasonal"|"degrees";}} birkatWorkerParam */

/** Same message the weekly print workers get. @typedef {import('./print-web-worker.js').RefractionInit} RefractionInit */

/**
 * Set by the RefractionInit message, which the page posts before any months.
 * Both stay null if it never comes: then the calculators use their standard-air defaults.
 * @type {{ provider: import('../../refraction-snapshot.js').AtmosphereProvider | null, horizon: import('../../refraction-snapshot.js').Horizon | null, haze: import('../../../libraries/kosherZmanim/star-nightfall.js').HazeData | null }}
 */
const refraction = { provider: null, horizon: null, haze: null };

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
 * @property {MoonEvent | null} [peak]  Moon at the middle of its visible part of the night (early rows only; used for the table header glyph)
 */

/**
 * @typedef {Object} MonthResult
 * @property {number} year
 * @property {number} month
 * @property {number} monthID
 * @property {string} titleHe
 * @property {string} titleEn
 * @property {{ start3: number, start: number, endStretch: number, endIkar: number }} limits
 * @property {Record<string, number>} unplacedMarks
 * @property {BirkatRow[]} rows       The customary range: 7 days after the molad -> the 15th
 * @property {BirkatRow[]} earlyRows  The halachic early range: 3 days -> 7 days after the molad
 */

/**
 * @typedef {Object} NightTimes
 * @property {Temporal.PlainDate} nightDate
 * @property {number} shkiya
 * @property {number} tzet
 * @property {number} alot
 * @property {number} netz
 * @property {number} nextShkiya
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
	// Moonrise / moonset refraction from the same air as the sun's (falls back to calc's standard air)
	const horizonTarget = moonHorizonTarget(refraction.provider, tz, calc.horizonTarget, geoLocation);

	// Flat horizon: the same convention as the printed sun times. With elevation on (Israel), a sea-level
	// horizon seen from the elevation (the dip included); otherwise an observer at sea level.
	const elevationM = x.israel ? Math.max(0, geoLocation.getElevation()) : 0;
	const flatObserver = new AstronomyImp.Observer(geoLocation.getLatitude(), geoLocation.getLongitude(), elevationM);
	/** @type {{mode: 'lit', limitDays: number, metersAboveGround: number, horizonTarget: ReturnType<typeof moonHorizonTarget>}} */
	const flatOpts = { mode: 'lit', limitDays: 2, metersAboveGround: elevationM, horizonTarget };
	const msOf = (/** @type {AstronomyImp.AstroTime | null | undefined} */ t) => t ? t.date.getTime() : null;
	/** @type {import('../../moon-visible.js').FlatEvent} */
	const flat = (dir, at) => msOf(dir > 0
		? calc.nextMoonRise(new Date(at), flatObserver, flatOpts)
		: calc.nextMoonSet(new Date(at), flatObserver, flatOpts));

	// Over the terrain when the server sent a moon horizon: the moonrise about 90% of the area can see
	// (and the moonset before it is hidden from about 90% of it). Directions the data doesn't cover: flat.
	const moonHorizon = refraction.horizon?.moon;
	const visible = moonHorizon?.moonrise?.length && moonHorizon.moonset?.length
		? createVisibleMoon(calc, moonHorizon, AstronomyImp, { provider: refraction.provider, timeZone: tz, geo: geoLocation, flat })
		: null;
	/** @type {MoonEvents} */
	const moonEvents = visible
		? { rise: visible.nextRise, set: visible.nextSet }
		: { rise: at => flat(1, at), set: at => flat(-1, at) };
	const dayCalc = new ZemanFunctions(geoLocation, {
		elevation: x.israel,
		fixedMil: x.israel || x.hourCalculator == "seasonal",
		// Same atmosphere and horizon as the weekly pages, so shkiya / netz here match the printed times
		atmosphereProvider: refraction.provider,
		horizon: refraction.horizon,
		haze: refraction.haze,

		// Rest are unused, so we'll fill them with defaults
		candleLighting: 0,
		melakha: { minutes: 0, degree: 0 },
		rtKulah: false
	});

	/**
	 * Builds one row for a night, clipped to the given limits. Returns null when the night
	 * doesn't overlap the limits, or the moon isn't up at any point of it.
	 * @param {NightTimes} n
	 * @param {number} minStart   earliest allowed instant (both ranges)
	 * @param {number} maxStretch bediavad end limit
	 * @param {number} maxIkar    lechatchila end limit
	 * @param {Record<string, number> | null} markTimes  marks to place on this row (null = none)
	 * @param {Set<string>} placedMarks
	 * @param {boolean} [withPeak]  also describe the moon mid-way through its visible part of the night
	 * @returns {BirkatRow | null}
	 */
	function buildRow(n, minStart, maxStretch, maxIkar, markTimes, placedMarks, withPeak = false) {
		// Ranges, each clipped by its own limits.
		const bediavad = clip(n.shkiya, n.netz, minStart, maxStretch);    // full shkiya -> netz
		const lechatchila = clip(n.tzet, n.alot, minStart, maxIkar);      // tzet -> alot (sub-range of bediavad)
		if (!bediavad)
			return null;

		// Moon-up interval overlapping the bediavad window. None -> skip the night entirely.
		const moon = findMoonUp(moonEvents, bediavad[0], bediavad[1]);
		if (!moon)
			return null;

		// Bediavad-only: the moon is not up at any point of the lechatchila range.
		const moonRise = moon.rise ?? -Infinity;
		const moonSet = moon.set ?? Infinity;
		const moonInLechatchila = lechatchila !== null && moonRise < lechatchila[1] && moonSet > lechatchila[0];

		/** @type {Record<string, RowMark>} */
		const marks = {};
		for (const [name, t] of Object.entries(markTimes || {})) {
			// Uses the unclipped boundaries so the position is about the day, not the clipping.
			let position = null;
			if (t >= n.shkiya && t < n.tzet) position = 'shkiyaToTzet';
			else if (t >= n.tzet && t < n.alot) position = 'lechatchila';
			else if (t >= n.alot && t < n.netz) position = 'alotToNetz';
			else if (t >= n.netz && t < n.nextShkiya) position = 'day'; // the daytime after this night
			if (position) {
				marks[name] = { time: t, position };
				placedMarks.add(name);
			}
		}

		const coverage = classifyCoverage(moon, bediavad[0], bediavad[1]);
		const midMs = Math.round(bediavad[0] + (bediavad[1] - bediavad[0]) / 2);

		// Middle of the part of the window where the moon is actually up.
		const visStart = Math.max(moonRise, bediavad[0]);
		const visEnd = Math.min(moonSet, bediavad[1]);
		const peak = withPeak ? describeMoonEvent(calc, observer, Math.round(visStart + (visEnd - visStart) / 2)) : undefined;

		return {
			jewishDay: n.nightDate.add({ days: 1 }).withCalendar("hebrew").day,
			night: { lechatchila, bediavad },
			moon,
			coverage,
			events: {
				rise: coverage === 'both' || coverage === 'from' ? describeMoonEvent(calc, observer, moon.rise) : null,
				set:  coverage === 'both' || coverage === 'until' ? describeMoonEvent(calc, observer, moon.set) : null,
				mid:  coverage === 'all' ? describeMoonEvent(calc, observer, midMs) : null
			},
			bediavadOnly: !moonInLechatchila,
			...(Object.keys(marks).length ? { marks } : {}),
			...(peak ? { peak } : {})
		};
	}

	return x.months.map(({ year, month }) => {
		const monthCal = baseCal.chainJewishDate(year, month, 15);
		const date15 = monthCal.getDate();
		const at15 = dayCalc.chainDate(date15);
		const atEve15 = dayCalc.chainDate(date15.subtract({ days: 1 }));

		// --- Global limits (these bound the loop and clip the ranges) ---
		const start3 = monthCal.getTchilasZmanKidushLevana3Days().withTimeZone(tz).epochMilliseconds; // law: 3 days after the molad
		const start = monthCal.getTchilasZmanKidushLevana7Days().withTimeZone(tz).epochMilliseconds;   // custom: 7 days after the molad
		const endStretch = at15.timeRange.current.sunrise.epochMilliseconds; // bediavad end: sunrise of the 15th
		const endIkar = at15.getAlotHashahar().epochMilliseconds;             // lechatchila end: alot of the 15th

		// --- Marks only (NOT loop bounds): reported on the row they fall in ---
		/** @type {Record<string, number>} */
		const markTimes = {
			endStrict: monthCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(tz).epochMilliseconds,
			endEarlyIkar: atEve15.getAlotHashahar().epochMilliseconds,
			endEarlyStretch: atEve15.timeRange.current.sunrise.epochMilliseconds
		};
		/** @type {Set<string>} */
		const placedMarks = new Set();

		/** @type {BirkatRow[]} */
		const rows = [];
		/** @type {BirkatRow[]} */
		const earlyRows = [];

		// A night starting on civil evening D runs until the morning of D+1.
		// The night that contains `start3` may begin the evening before start3's civil date.
		let nightDate = Temporal.PlainDate.from(
			Temporal.Instant.fromEpochMilliseconds(start3).toZonedDateTimeISO(tz).toPlainDate()
		).subtract({ days: 1 });

		// Last night = the one ending at the morning of the 15th, so nightDate + 1 day <= date15.
		for (; Temporal.PlainDate.compare(nightDate.add({ days: 1 }), date15) <= 0; nightDate = nightDate.add({ days: 1 })) {
			const today = dayCalc.chainDate(nightDate);
			const tomorrow = today.tomorrow();

			/** @type {NightTimes} */
			const n = {
				nightDate,
				shkiya: today.getShkiya().epochMilliseconds,
				tzet: today.getTzet().epochMilliseconds,
				alot: tomorrow.getAlotHashahar().epochMilliseconds,
				netz: zDTFromFunc(tomorrow.getNetz()).epochMilliseconds,
				nextShkiya: tomorrow.getShkiya().epochMilliseconds
			};

			// Early (law) range: [start3, start). A night straddling `start` contributes its
			// first part here and its remainder to the regular range below.
			if (n.shkiya < start) {
				const early = buildRow(n, start3, start, start, null, placedMarks, true);
				if (early) earlyRows.push(early);
			}

			// Regular (custom) range: [start, 15th].
			if (n.netz > start) {
				const row = buildRow(n, start, endStretch, endIkar, markTimes, placedMarks);
				if (row) rows.push(row);
			}
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
			limits: { start3, start, endStretch, endIkar },
			unplacedMarks,
			rows,
			earlyRows
		};
	});
}

addEventListener('message', async (/** @type {MessageEvent<birkatWorkerParam | RefractionInit>} */ message) => {
	// Handled before any await, so it is in place before the first month runs
	if ('type' in message.data && message.data.type === 'refraction') {
		refraction.provider = providerFromSnapshot(message.data.table, message.data.normals);
		refraction.horizon = message.data.horizon;
		refraction.haze = message.data.haze ?? null;
		return;
	}

	try {
		if (!('Temporal' in globalThis)) {
			const { Temporal } = await import('https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.2/+esm');
			globalThis.Temporal = Temporal;
		}
		postMessage(messageHandler(/** @type {birkatWorkerParam} */ (message.data)));
	} catch (err) {
		console.error('moon-birkat-worker failed:', err);
		// Throwing inside an async listener only causes an unhandled rejection in the worker,
		// which never reaches the page's 'error' listener. Report back explicitly instead,
		// so the page knows this worker is done and can still build the early pages.
		postMessage({ error: String(err) });
	}
});
