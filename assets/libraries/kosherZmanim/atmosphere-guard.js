// @ts-check
/**
 * atmosphere-guard.js
 *
 * Guardrails for the weather and climate data the zmanim are computed from: forecasts, normals, the refraction
 * server's path profiles, haze - whether fetched, stored on the device, or served. A value that cannot be real
 * air is refused, and the next source in line is used instead (chainProviders), or, when none is left, the
 * calculator's standard model (_atmosphereFor). A corrupted download, a unit mix-up (Kelvin or Fahrenheit read
 * as Celsius), a tampered answer or a damaged stored copy then costs at most a few seconds of accuracy, never a
 * wrong time.
 *
 * The limits are the extremes the Earth has recorded (WMO), with a margin, so real weather - however rare - is
 * never refused; they catch values no air can have, not unusual ones:
 *   air at the surface   -89.2 C (Vostok, 1983) to 56.7 C (Death Valley, 1913)        -> -95 .. +60 C
 *   air aloft            the coldest tropopause and polar stratosphere, ~ -95 C        -> -110 .. +60 C
 *   sea-level pressure   870 hPa (Typhoon Tip, 1979) to 1083.8 hPa (Agata, 1968)      -> 860 .. 1090 hPa
 *   ground height        the Dead Sea shore (-430 m) to Everest (8,849 m)             -> -500 .. 9,000 m
 *   surface skin         ice and snow as cold as the air above; ground up to ~71 C     -> -95 .. +75 C
 *                        (the Lut desert, by satellite; a mostly-water grid cell may hold hot shore)
 *   haze (AOD, 550 nm)   ~0.01 (clean polar air) to ~5-7 (dust storms, the worst smoke) -> 0 .. 10
 *   haze calibration     the server's CAMS-to-AERONET factor, near 1                  -> 0.1 .. 10 (else 1)
 *   dew point            never above the air temperature (rounding aside)             -> <= T + 0.5 C
 * and, within a profile, what air cannot do:
 *   heights must rise and pressure fall, level by level, as the weight of the air between them says (the
 *   hypsometric equation, within 15% + 30 m);
 *   between two levels dz metres apart, air cannot be more than 5 C + 0.05 C/m * dz cooler above (past
 *   ~0.034 C/m air is denser above than below and overturns; a sunlit ground layer a few metres deep can be
 *   superadiabatic) or more than 20 C + 0.1 C/m * dz warmer above (night-time inversions reach ~10 C in the
 *   lowest 15 m in weather models; polar snow, ~25 C in the lowest few hundred metres).
 *   These were checked against 15,427 Bet Dagan radiosondes (1990-2025: only their recorded errors are
 *   refused) and ~150,000 ERA5 columns over the Middle East (none refused).
 * And two checks against jumps:
 *   a forecast more than 45 C from the place's normal for that day is refused (the largest anomaly on record,
 *   Antarctica in March 2022, was ~39 C);
 *   in an hourly series, a lone hour 15 C (temperature) or 10 hPa (pressure) away from both neighbours, which
 *   agree with each other, is dropped: real fronts and chinooks step and stay, they don't spike for an hour.
 */

export const LIMITS = Object.freeze({
	surfaceC: [-95, 60],
	aloftC: [-110, 60],
	seaLevelMb: [860, 1090],
	groundM: [-500, 9000],
	profileTopM: 80000,
	skinC: [-95, 75],
	dewBelowC: 0.5,
	dewMinC: -120,
	rhPercent: [0, 105],
	aod: [0, 10],
	coolingC: [5, 0.05],
	warmingC: [20, 0.1],
	hypsometricTolerance: 0.15,
	hypsometricSlackM: 30,
	maxAnomalyC: 45,
	spikeC: 15,
	spikeMb: 10,
	profileMaxKm: 1000,
});

const RD = 287.05, G = 9.80665;

/** Each refusal is reported once (console.warn), so a bad source shows up in the console without flooding it. */
const reported = new Set();
/** @param {string} what */
export function report(what) {
	if (reported.has(what)) return;
	reported.add(what);
	if (reported.size > 200) reported.clear();
	globalThis.console?.warn?.(`weather data refused: ${what}`);
}

/** @param {unknown} v @param {[number, number]} range */
const within = (v, range) => typeof v === 'number' && Number.isFinite(v) && v >= range[0] && v <= range[1];

/** Pressure at height h (m) carried to sea level with the air's own temperature (C), hPa. */
export function seaLevelPressure(pMb, heightM, tC) {
	return pMb * Math.exp(G * heightM / (RD * (tC + 273.15 + 0.00325 * heightM)));
}

/**
 * Why a surface spec ({ temperatureC, pressureMb?, heightM?, dewPointC?, relativeHumidity? }) cannot be real air,
 * or null if it can.
 * @param {any} spec @returns {string | null}
 */
export function surfaceProblem(spec) {
	const t = spec?.temperatureC;
	if (!within(t, /** @type {[number, number]} */ (LIMITS.surfaceC))) return `temperature ${t} C`;
	if (spec.heightM != null && !within(spec.heightM, /** @type {[number, number]} */ (LIMITS.groundM))) return `height ${spec.heightM} m`;
	if (spec.pressureMb != null) {
		if (!Number.isFinite(spec.pressureMb) || spec.pressureMb <= 0) return `pressure ${spec.pressureMb} hPa`;
		const slp = seaLevelPressure(spec.pressureMb, spec.heightM ?? 0, t);
		// without a height the pressure may be a station's anywhere up to the highest ground
		const range = spec.heightM != null ? LIMITS.seaLevelMb : [250, LIMITS.seaLevelMb[1]];
		if (!within(spec.heightM != null ? slp : spec.pressureMb, /** @type {[number, number]} */ (range))) {
			return `pressure ${spec.pressureMb} hPa at ${spec.heightM ?? '?'} m`;
		}
	}
	if (spec.dewPointC != null && (!Number.isFinite(spec.dewPointC) || spec.dewPointC > t + LIMITS.dewBelowC || spec.dewPointC < LIMITS.dewMinC)) {
		return `dew point ${spec.dewPointC} C with air at ${t} C`;
	}
	if (spec.relativeHumidity != null && !within(spec.relativeHumidity, /** @type {[number, number]} */ (LIMITS.rhPercent))) {
		return `relative humidity ${spec.relativeHumidity}%`;
	}
	return null;
}

/**
 * Why a path (an array of { distanceKm, water?, skinC?, levels: [{ h, t, p, td?, rh? }] } columns, h in m above sea
 * level, t in C, p in hPa) cannot be real air, or null if it can.
 * @param {any} path @returns {string | null}
 */
export function pathProblem(path) {
	if (!Array.isArray(path) || !path.length) return 'empty path';
	// a path's profiles are asked for many times (every step of every sunrise): checked once per array
	let r = checkedPaths.get(path);
	if (r === undefined) checkedPaths.set(path, r = checkPath(path));
	return r;
}
/** @type {WeakMap<any[], string | null>} */
const checkedPaths = new WeakMap();

/** @param {any[]} path @returns {string | null} */
function checkPath(path) {
	for (const col of path) {
		const at = `at ${col?.distanceKm} km`;
		if (!within(col?.distanceKm, [0, LIMITS.profileMaxKm])) return `profile distance ${col?.distanceKm} km`;
		if (col.skinC != null && !within(col.skinC, /** @type {[number, number]} */ (LIMITS.skinC))) return `water ${col.skinC} C ${at}`;
		const lv = col.levels;
		if (!Array.isArray(lv) || lv.length < 2) return `profile with ${lv?.length ?? 0} levels ${at}`;
		for (let i = 0; i < lv.length; i++) {
			const { h, t, p } = lv[i] ?? {};
			if (!within(h, [LIMITS.groundM[0], LIMITS.profileTopM])) return `level height ${h} m ${at}`;
			// the air at the bottom of the column is surface air; above it, the air aloft's limits
			const tr = h <= LIMITS.groundM[1] && i === 0 ? LIMITS.surfaceC : LIMITS.aloftC;
			if (!within(t, /** @type {[number, number]} */ (tr))) return `${t} C at ${h} m ${at}`;
			if (!Number.isFinite(p) || p <= 0 || p > LIMITS.seaLevelMb[1] + 30) return `${p} hPa at ${h} m ${at}`;
			const { td, rh } = lv[i];
			if (td != null && (!Number.isFinite(td) || td > t + LIMITS.dewBelowC || td < LIMITS.dewMinC)) return `dew point ${td} C with air at ${t} C, ${h} m ${at}`;
			if (rh != null && !within(rh, /** @type {[number, number]} */ (LIMITS.rhPercent))) return `relative humidity ${rh}% at ${h} m ${at}`;
			if (i === 0) {
				if (!within(seaLevelPressure(p, h, t), /** @type {[number, number]} */ (LIMITS.seaLevelMb))) return `${p} hPa at ${h} m ${at}`;
				continue;
			}
			const b = lv[i - 1], dz = h - b.h;
			if (!(dz > 0)) return `levels not rising (${b.h} m, then ${h} m) ${at}`;
			if (!(p < b.p)) return `pressure not falling (${b.p} hPa at ${b.h} m, ${p} hPa at ${h} m) ${at}`;
			// the hypsometric equation: the layer is as thick as its air's mean temperature says
			const thick = RD * ((b.t + t) / 2 + 273.15) / G * Math.log(b.p / p);
			if (Math.abs(thick - dz) > LIMITS.hypsometricTolerance * dz + LIMITS.hypsometricSlackM) {
				return `${b.p} -> ${p} hPa over ${dz.toFixed(0)} m (the air says ${thick.toFixed(0)} m) ${at}`;
			}
			const dt = t - b.t;
			if (-dt > LIMITS.coolingC[0] + LIMITS.coolingC[1] * dz || dt > LIMITS.warmingC[0] + LIMITS.warmingC[1] * dz) {
				return `${b.t} -> ${t} C over ${dz.toFixed(0)} m ${at}`;
			}
		}
	}
	return null;
}

/**
 * Why an atmosphere spec (surface or { path }) cannot be real air, or null if it can.
 * @param {any} spec @returns {string | null}
 */
export function specProblem(spec) {
	if (!spec || typeof spec !== 'object') return null;
	return 'path' in spec ? pathProblem(spec.path) : surfaceProblem(spec);
}

/**
 * The temperature (C) near the ground a spec describes: the surface spec's own, or the path's column nearest the
 * observer at its lowest level. NaN if none.
 * @param {any} spec
 */
export function groundTemperature(spec) {
	if (!spec) return NaN;
	if (!('path' in spec)) return spec.temperatureC;
	let best = null;
	for (const col of spec.path ?? []) if (!best || col.distanceKm < best.distanceKm) best = col;
	return best?.levels?.[0]?.t ?? NaN;
}

/**
 * Hourly intervals ({ start, end, value }) with the impossible values and the lone spikes taken out (see the
 * header). kind: 'temperature' (C), 'dew' (C), 'pressure' (hPa at the forecast point's height).
 * @template {{ value: number }} I
 * @param {I[]} series @param {'temperature' | 'dew' | 'pressure'} kind @param {string} [source]
 * @returns {I[]}
 */
export function cleanSeries(series, kind, source = 'forecast') {
	/** @type {[number, number]} */
	const range = kind === 'pressure' ? [250, LIMITS.seaLevelMb[1] + 30] : kind === 'dew' ? [LIMITS.dewMinC, LIMITS.surfaceC[1]] : /** @type {[number, number]} */ (LIMITS.surfaceC);
	const spike = kind === 'pressure' ? LIMITS.spikeMb : LIMITS.spikeC;
	const ok = series.filter(x => within(x.value, range));
	if (ok.length < series.length) report(`${source}: ${series.length - ok.length} ${kind} values out of range`);
	const out = ok.filter((x, i) => {
		const a = ok[i - 1], b = ok[i + 1];
		if (!a || !b) return true;
		const da = x.value - a.value, db = x.value - b.value;
		const lone = Math.abs(da) > spike && Math.abs(db) > spike && Math.sign(da) === Math.sign(db)
			&& Math.abs(a.value - b.value) < spike / 3;
		if (lone) report(`${source}: a lone ${kind} spike (${a.value}, ${x.value}, ${b.value})`);
		return !lone;
	});
	return out;
}

/** An aerosol optical depth if it can be real, else null. @param {unknown} v */
export function plausibleAod(v) {
	return within(v, /** @type {[number, number]} */ (LIMITS.aod)) ? /** @type {number} */ (v) : null;
}
