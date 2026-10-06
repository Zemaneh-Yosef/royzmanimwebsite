// @ts-check
/**
 * moon-visible.js — visible moonrise / moonset over terrain, for birkat halevana.
 *
 * Worker-safe (no network, no localStorage). Uses the server's composite moon horizon (horizon-client.js,
 * `moon: true`): one profile per side, which in an area is the 90th-percentile horizon of all its spots.
 * Since the blessing needs the Moon actually seen, that gives a moonrise about 90% of the area can see,
 * and a moonset before it is hidden from about 90% of it.
 *
 * The physics follows ROYSPACalculator's getVisibleSunrise (royzmanim-spa-corrections.js):
 *   - each horizon point's apparent elevation = geometric elevation (Earth curvature) + terrestrial
 *     refraction, never below the sea horizon; then the true altitude a body must reach there is that
 *     minus the astronomical refraction at that apparent altitude, ray traced for the observer's height;
 *   - air from the same provider as the sun (moon-refraction.js airAt); without one, the ISA ray trace is
 *     scaled so the sea-level horizon refraction is the 34.48' constant, as the sun does;
 *   - Earth radius of curvature at the latitude (east-west), as configureForLocation sets for the sun.
 * Beyond the ends of the data (a Moon first seen over a horizon higher than the server's 10 deg design
 * height), the terrain at the nearest end is taken to continue: closer to the truth than a flat horizon.
 * If the Moon never clears the terrain during a pass, that pass has no visible rise / set at all.
 * What differs from the sun: only the sunlit part of the Moon counts. The tested points are the bright half
 * of the limb (between the cusps) and the terminator, placed with moon-calc's bright-limb angle θ (measured
 * from the vertical towards DECREASING azimuth - checked against the Sun's direction from the Moon).
 *
 *   const vis = createVisibleMoon(calc, horizon.moon, AstronomyImp, { provider, timeZone, geo, flat });
 *   vis.nextRise(epochMs);   // next visible moonrise at or after epochMs (epoch ms), or null
 *   vis.nextSet(epochMs);
 */

import {
	createAtmosphere, rayRefraction, seaHorizonAltitude, terrestrialRefraction, geometricElevation,
	earthRadiusAtLatitude, ROY_REFRACTION_ARCMIN
} from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { airAt } from "./moon-refraction.js";

/** @typedef {import("../libraries/kosherZmanim/horizon-client.js").MoonHorizon} MoonHorizon */
/** @typedef {import("../libraries/kosherZmanim/horizon-client.js").MoonHorizonEntry} MoonHorizonEntry */
/** @typedef {import("./refraction-snapshot.js").AtmosphereProvider} AtmosphereProvider */
/** @typedef {{ altCenterDeg: number, azDeg: number, semiDiameterDeg: number, thetaDeg: number, phaseAngleDeg: number }} Geometry */
/** @typedef {{ moonGeometry: (time: Date, observer: any) => Geometry }} MoonCalcLike */
/** @typedef {(direction: 1 | -1, epochMs: number) => number | null} FlatEvent  next flat-horizon rise (+1) / set (-1) at or after epochMs */

const DEG = Math.PI / 180;
const MIN = 60000;

// Sample points of the sunlit region, in units of the semi-diameter (see litPoints)
const LIMB_STEPS = 18;        // the bright half of the limb, every 10 degrees (cusps included)
const TERMINATOR_STEPS = 12;  // the terminator, every 15 degrees (cusps excluded: they are on the limb)

/**
 * Points on the boundary of the sunlit region (the highest lit point is always on it), in the sky frame
 * (x towards DECREASING azimuth, y up), unit = semi-diameter.
 *   bright limb: the half of the limb centred on the bright-limb direction b = (sin θ, cos θ);
 *   terminator:  sin t · p − cos t · cos i · b, with p = (cos θ, −sin θ), the half-ellipse from cusp to
 *                cusp (i = 0: the far limb, full moon; i = 90: the straight line; i = 180: on b, new moon).
 * @param {number} thetaDeg bright-limb angle from the vertical @param {number} phaseAngleDeg i
 * @returns {[number, number][]}
 */
function litPoints(thetaDeg, phaseAngleDeg) {
	const th = thetaDeg * DEG, ci = Math.cos(phaseAngleDeg * DEG);
	const b = [Math.sin(th), Math.cos(th)], p = [Math.cos(th), -Math.sin(th)];
	/** @type {[number, number][]} */
	const out = [];
	for (let k = 0; k <= LIMB_STEPS; k++) {
		const beta = th + (-90 + 180 * k / LIMB_STEPS) * DEG;
		out.push([Math.sin(beta), Math.cos(beta)]);
	}
	for (let k = 1; k < TERMINATOR_STEPS; k++) {
		const t = (-90 + 180 * k / TERMINATOR_STEPS) * DEG;
		const s = Math.sin(t), c = -Math.cos(t) * ci;
		out.push([s * p[0] + c * b[0], s * p[1] + c * b[1]]);
	}
	return out;
}

/**
 * @param {MoonCalcLike} calc  a createMoonCalc() instance
 * @param {MoonHorizon} horizon  the `moon` entry of a horizon fetched with { moon: true }
 * @param {{ Observer: new (lat: number, lon: number, height: number) => any }} Astronomy  AstronomyImp
 * @param {{ provider?: AtmosphereProvider | null, timeZone: string, geo?: any, flat: FlatEvent,
 *           searchHours?: number }} options
 *   provider:    the sun's atmosphere provider (null: standard air scaled to 34.48', as the sun)
 *   flat:        the flat-horizon moonrise / moonset, used to find each event (and returned as is in the
 *                rare case the search cannot get below the terrain within searchHours: grazing passes)
 *   searchHours: how far the visible event may be from the flat one (default 6)
 */
export function createVisibleMoon(calc, horizon, Astronomy, options) {
	const { provider = null, timeZone, geo, flat } = options;
	const searchMs = (options.searchHours ?? 6) * 3600000;
	const R = earthRadiusAtLatitude(horizon.lat) * 1000;

	// The reference observer the composite is expressed for, at the area's median eye height
	const heights = [...horizon.moonrise, ...horizon.moonset].map(e => e.observerM).sort((a, b) => a - b);
	const observer = new Astronomy.Observer(horizon.lat, horizon.lon, heights[heights.length >> 1] ?? 0);

	// Without a provider: the ISA trace scaled so the sea-level horizon refraction is the 34.48' constant
	const isa = createAtmosphere(15, 1013.25, 0);
	const isaScale = (ROY_REFRACTION_ARCMIN / 60) / rayRefraction(isa, 0, 0, R);

	/** @type {Map<string, { az: Float64Array, thr: Float64Array, minThr: number }>} */
	const thresholdCache = new Map();

	/**
	 * Per-azimuth true altitude the Moon's lit points must reach, for one side and one air.
	 * Air is rounded to 0.5 C / 1 mb (< 0.2 s of moonrise) so nearby days share one table.
	 * @param {'moonrise'|'moonset'} side @param {number} epochMs
	 */
	function thresholds(side, epochMs) {
		const air = airAt(provider, timeZone, geo, epochMs, observer.height);
		const T = air ? Math.round(air.temperatureC * 2) / 2 : null;
		const P = air ? Math.round(air.pressureMb) : null;
		const H = air ? Math.round(air.heightM) : null;
		const key = `${side}|${T}|${P}|${H}`;
		let table = thresholdCache.get(key);
		if (table) return table;

		const atm = air ? createAtmosphere(/** @type {number} */ (T), /** @type {number} */ (P), /** @type {number} */ (H)) : isa;
		const scale = air ? 1 : isaScale;
		const entries = horizon[side];
		const hOf = (/** @type {number} */ ho) => Math.max(0, Math.round(ho / 10) * 10);   // eye heights to 10 m

		// 1. apparent elevation of every horizon point, in its own spot's frame
		/** @type {Map<number, number>} */
		const seaAlts = new Map();
		const seaAltAt = (/** @type {number} */ h) => {
			let v = seaAlts.get(h);
			if (v === undefined) { v = seaHorizonAltitude(atm, h, R); seaAlts.set(h, v); }
			return v;
		};
		const apps = entries.map(e => {
			const ho = e.observerM, d = e.distanceKm * 1000;
			const geoEl = geometricElevation(ho, e.heightM, d, R);
			const chord = Math.hypot(d, (R + e.heightM) * Math.cos(d / R) - (R + ho));
			return Math.max(geoEl + terrestrialRefraction(atm, ho, e.heightM, chord), seaAltAt(hOf(ho)));
		});
		const top = Math.max(0, ...apps) + 0.5;

		// 2. refraction vs apparent altitude per eye height, every 0.1 deg up to the highest point (as the sun)
		/** @type {Map<number, (a: number) => number>} */
		const byHeight = new Map();
		const refrFor = (/** @type {number} */ h) => {
			let f = byHeight.get(h);
			if (f) return f;
			const seaAlt = seaAltAt(h), step = 0.1, n = Math.ceil((top - seaAlt) / step) + 1;
			const tab = new Float64Array(n), filled = new Uint8Array(n);
			const at = (/** @type {number} */ i) => {
				if (!filled[i]) {
					// the grazing ray itself: nudge up so the perigee solve stays inside the atmosphere
					tab[i] = rayRefraction(atm, h, i === 0 && h > 0 ? seaAlt + 1e-7 : seaAlt + i * step, R);
					filled[i] = 1;
				}
				return tab[i];
			};
			f = a => {                                // linear between table points (< 1" at 0.1 deg spacing)
				const x = Math.min(Math.max((a - seaAlt) / step, 0), n - 1.000001);
				const i = Math.floor(x), t = x - i;
				return scale * (at(i) * (1 - t) + at(i + 1) * t);
			};
			byHeight.set(h, f);
			return f;
		};

		// 3. the true altitude to reach, in the reference frame (minus the spot's tilt)
		const az = new Float64Array(entries.length), thr = new Float64Array(entries.length);
		let minThr = Infinity;
		const first = entries[0]?.azimuthDeg ?? 0;
		entries.forEach((e, k) => {
			thr[k] = apps[k] - refrFor(hOf(e.observerM))(apps[k]) - e.tiltDeg;
			az[k] = first + (((e.azimuthDeg - first) % 360) + 360) % 360;   // unwrapped, increasing
			if (thr[k] < minThr) minThr = thr[k];
		});
		table = { az, thr, minThr };
		if (thresholdCache.size > 400) thresholdCache.clear();
		thresholdCache.set(key, table);
		return table;
	}

	/**
	 * Threshold at an azimuth (linear interpolation); beyond either end of the data, the nearest end's;
	 * NaN in a gap > 1 deg.
	 * @param {{ az: Float64Array, thr: Float64Array }} t @param {number} a
	 */
	function thresholdAt(t, a) {
		const n = t.az.length;
		if (n < 2) return NaN;
		a = t.az[0] + (((a - t.az[0]) % 360) + 360) % 360;
		if (a > t.az[n - 1]) {                          // past the end: nearer to the end, or to the start?
			const span = t.az[n - 1] - t.az[0];
			return a - t.az[n - 1] <= (360 - span) / 2 ? t.thr[n - 1] : t.thr[0];
		}
		let lo = 0, hi = n - 1;
		while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t.az[m] <= a) lo = m; else hi = m; }
		const gap = t.az[hi] - t.az[lo];
		if (gap > 1) return NaN;
		return gap === 0 ? t.thr[lo] : t.thr[lo] + (t.thr[hi] - t.thr[lo]) * (a - t.az[lo]) / gap;
	}

	/** @param {number} ms */
	const geometry = ms => calc.moonGeometry(new Date(ms), observer);

	/**
	 * Is any sunlit point of the Moon above the terrain at this moment?
	 * @param {{ az: Float64Array, thr: Float64Array }} t @param {number} ms
	 */
	function visibleAt(t, ms) {
		const g = geometry(ms);
		const c = Math.max(Math.cos(g.altCenterDeg * DEG), 1e-6);
		for (const [x, y] of litPoints(g.thetaDeg, g.phaseAngleDeg)) {
			const lim = thresholdAt(t, g.azDeg - g.semiDiameterDeg * x / c);
			if (!Number.isNaN(lim) && g.altCenterDeg + g.semiDiameterDeg * y >= lim) return true;
		}
		return false;
	}

	/**
	 * The visible event belonging to a flat-horizon one: the first moment (rise) / last moment (set) any
	 * sunlit point is above the terrain, within searchHours of it.
	 * Returns null when the Moon never clears the terrain in that pass, and NaN when the search cannot
	 * start (the Moon does not get below the terrain within searchHours: a grazing pass).
	 * The scan runs on a fixed 20-second grid, so the same event comes out identical however it is reached.
	 * @param {1 | -1} dir  +1 rise, -1 set @param {number} flatMs
	 * @returns {number | null}
	 */
	function visibleEvent(dir, flatMs) {
		const t = thresholds(dir > 0 ? 'moonrise' : 'moonset', flatMs);
		if (!t.az.length) return NaN;
		/** the Moon is certainly hidden: its top is below the lowest threshold anywhere */
		const below = (/** @type {number} */ ms, /** @type {number} */ margin) => {
			const g = geometry(ms);
			return g.altCenterDeg + g.semiDiameterDeg < t.minThr - margin;
		};
		const STEP = 20000;
		// 1. back off (rise: earlier, set: later) to where the Moon is certainly hidden, onto the grid
		let ms = (dir > 0 ? Math.floor : Math.ceil)(flatMs / STEP) * STEP;
		for (let k = 0; k < searchMs / (10 * MIN) && !below(ms, 0.02); k++) ms -= dir * 10 * MIN;
		if (!below(ms, 0.02)) return NaN;
		const limit = flatMs + dir * searchMs;
		// 2. coarse: 2-minute steps while far below (the Moon climbs < 0.3 deg in 2 minutes)
		while (dir * (limit - ms) > 0 && below(ms + dir * 2 * MIN, 0.6)) ms += dir * 2 * MIN;
		// 3. fine: 20-second steps until a lit point clears the terrain
		let prev = ms, found = false;
		for (; dir * (limit - ms) > 0; prev = ms, ms += dir * STEP) {
			if (visibleAt(t, ms)) { found = true; break; }
		}
		if (!found) return null;                         // never seen in this pass
		// 4. bisect to 0.1 s
		let a = prev, b = ms;
		while (Math.abs(b - a) > 100) {
			const m = (a + b) / 2;
			if (visibleAt(t, m)) b = m; else a = m;
		}
		return b;
	}

	/**
	 * Next visible event at or after epochMs. The search starts searchHours earlier, since terrain can
	 * delay a rise (or advance a set) past the flat-horizon time. A pass in which the Moon never clears the
	 * terrain is skipped (no rise and no set).
	 * @param {1 | -1} dir @param {number} startMs
	 */
	function next(dir, startMs) {
		let cursor = startMs - searchMs;
		for (let k = 0; k < 6; k++) {
			const f = flat(dir, cursor);
			if (f == null) return null;
			const v = visibleEvent(dir, f);
			cursor = f + MIN;
			if (v === null) continue;                    // hidden all pass
			const ms = Number.isNaN(v) ? f : v;          // grazing pass: the flat time
			if (ms >= startMs) return ms;
		}
		return null;
	}

	return {
		/** @param {number} epochMs */
		nextRise: epochMs => next(1, epochMs),
		/** @param {number} epochMs */
		nextSet: epochMs => next(-1, epochMs),
		visibleEvent,
		observer
	};
}
