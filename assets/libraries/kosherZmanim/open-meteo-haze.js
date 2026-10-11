// @ts-check
/**
 * open-meteo-haze.js
 *
 * Haze (aerosol optical depth at 550 nm) for nightfall by the stars (star-nightfall.js), from
 * Open-Meteo's air-quality API: the Copernicus Atmosphere Monitoring Service (CAMS) global forecast,
 * ~45 km, worldwide, no API key, callable from the browser.
 *
 *     import { fetchHazeNormals, fetchHazeForecast } from "./open-meteo-haze.js";
 *     const normals = await fetchHazeNormals(lat, lon);       // once per place; store it (JSON)
 *     const evenings = await fetchHazeForecast(lat, lon);     // every ~6-12 h (CAMS runs twice a day)
 *     const haze = { ...normals, evenings, forecastFetchedAt: Date.now(), blpCdM2 };   // a HazeData
 *     hazeOn(haze, date);   // { aod, aodRef } for hazeDelayMs (star-nightfall.js)
 *
 * Every value is the haze in the evening: at the moment the Sun's centre is 7 degrees down, about
 * when medium stars appear. The same hourly series also gives the morning's: at the moment the Sun's centre
 * is 16 degrees down before sunrise, for dawn by the horizon glow (horizon-glow.js) - no extra requests.
 *
 * Normals: the CAMS archive Open-Meteo serves starts in August 2022, so the averages cover August 2022
 * to the end of the last full month (three-plus years by now; they firm up as it grows). One request of
 * ~30,000 hourly values (~300 KB; a few dozen "calls" of the free quota): fetch once per place and keep
 * it, refreshing once a year. The reference ("average sky") is the mean of the 12 monthly averages, so
 * an uneven number of each month in the archive does not tilt it.
 *
 * Fallback forecast: NOAA's GEFS-Aerosols (fetchGefsHazeForecast), the US global aerosol forecast -
 * 0.25 deg, 3-hourly, ~5 days, the same 550 nm optical depth - from NOAA's ERDDAP server (no key; free to
 * use and redistribute). Used only when Open-Meteo's forecast fails. The normals stay CAMS (ERDDAP keeps
 * no history), so a GEFS evening is compared with a CAMS average: if the two models differ on average,
 * the delay carries that difference on those days.
 *
 * Terms as open-meteo-atmosphere.js: non-commercial use, credit "Weather data by Open-Meteo.com" (CC BY
 * 4.0); CAMS data: Copernicus Atmosphere Monitoring Service. GEFS-Aerosols: NOAA/NCEP.
 */

import { getOpenMeteoJson } from './open-meteo-atmosphere.js';
import { eveningSunAt, morningSunAt } from './star-nightfall.js';

const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
/** NOAA AOML's ERDDAP copy of the latest GEFS-Aerosols run (aerosol optical thickness at 550 nm) */
export const GEFS_AEROSOL_URL = 'https://oceanwatch.aoml.noaa.gov/erddap/griddap/GEFS_Aerosols_bfd8_ee31_ed8b.json';
export const HAZE_HISTORY_START = '2022-08-01';
/** the Sun's altitude (deg) at which the evening's haze is read */
export const HAZE_SUN_ALT = -7;
/** the Sun's altitude (deg) at which the morning's haze is read (about dawn) */
export const HAZE_DAWN_SUN_ALT = -16;

/** @param {number[]} times unix s @param {(number | null)[]} values @param {number} t epoch ms */
function valueAt(times, values, t) {
	if (!times.length) return NaN;
	const x = (t / 1000 - times[0]) / (times[1] - times[0] || 3600);
	if (x < 0 || x > times.length - 1) return NaN;
	const i = Math.min(Math.floor(x), times.length - 2), f = x - i;
	const a = values[i], b = values[i + 1];
	if (a == null || b == null) return f < 0.5 ? (a ?? NaN) : (b ?? NaN);
	return a + (b - a) * f;
}

/** @param {Date} d */
const isoOf = d => d.toISOString().slice(0, 10);

/**
 * Evening and morning aerosol optical depth per date over an Open-Meteo hourly series.
 * @param {any} j Open-Meteo JSON @param {number} lat @param {number} lon
 * @returns {{ evenings: Record<string, number>, mornings: Record<string, number> }}
 */
function readings(j, lat, lon) {
	const times = j?.hourly?.time ?? [], vals = j?.hourly?.aerosol_optical_depth ?? [];
	return { evenings: readingsOf(times, vals, lat, lon, 'evening'), mornings: readingsOf(times, vals, lat, lon, 'morning') };
}

/**
 * Evening (Sun HAZE_SUN_ALT, setting) or morning (Sun HAZE_DAWN_SUN_ALT, rising) aerosol optical depth per
 * date over a regular series.
 * @param {number[]} times unix s, evenly spaced @param {(number | null)[]} vals @param {number} lat @param {number} lon
 * @param {'evening' | 'morning'} [when] default 'evening'
 * @returns {Record<string, number>}
 */
function readingsOf(times, vals, lat, lon, when = 'evening') {
	/** @type {Record<string, number>} */
	const out = {};
	if (!times.length) return out;
	const first = new Date(times[0] * 1000), last = new Date(times[times.length - 1] * 1000);
	for (let d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate())); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
		const date = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
		const t = when === 'morning' ? morningSunAt(date, lat, lon, HAZE_DAWN_SUN_ALT) : eveningSunAt(date, lat, lon, HAZE_SUN_ALT);
		const v = Number.isFinite(t) ? valueAt(times, vals, t) : NaN;
		if (Number.isFinite(v) && v >= 0) out[isoOf(d)] = +v.toFixed(3);
	}
	return out;
}

/**
 * Monthly averages of per-date values (months with fewer than 10 dates take the mean of the others), and
 * the mean of the 12. Null with fewer than 9 usable months.
 * @param {Record<string, number>} byDate @returns {{ monthly: number[], reference: number, have: number } | null}
 */
function monthlyOf(byDate) {
	const sum = Array(12).fill(0), n = Array(12).fill(0);
	for (const [iso, v] of Object.entries(byDate)) { const m = +iso.slice(5, 7) - 1; sum[m] += v; n[m]++; }
	const have = n.filter(c => c >= 10).length;
	if (have < 9) return null;
	const raw = sum.map((s, i) => n[i] >= 10 ? s / n[i] : NaN);
	const mean = raw.filter(Number.isFinite).reduce((a, b) => a + b, 0) / have;
	const monthly = raw.map(v => +(Number.isFinite(v) ? v : mean).toFixed(3));
	return { monthly, reference: +(monthly.reduce((a, b) => a + b, 0) / 12).toFixed(3), have };
}

/**
 * Average evening (and morning) haze per month and the place's year-round averages.
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, extraParams?: string, start?: string, end?: string, retries?: number }} [options]
 *   start / end: ISO dates (default August 2022 .. the end of last month).
 * @returns {Promise<{ monthly: number[], reference: number, monthlyMorning?: number[], referenceMorning?: number,
 *   normalsRange: [string, string], source: string }>}
 */
export async function fetchHazeNormals(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const now = new Date();
	const start = options.start ?? HAZE_HISTORY_START;
	const end = options.end ?? isoOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)));
	const url = `${options.url ?? AQ_URL}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}`
		+ `&hourly=aerosol_optical_depth&start_date=${start}&end_date=${end}&timeformat=unixtime&timezone=GMT`
		+ (options.extraParams ?? '');
	const j = await getOpenMeteoJson(doFetch, url, { retries: options.retries ?? 1 });
	const r = readings(j, latitude, longitude);
	const ev = monthlyOf(r.evenings);
	if (!ev) throw new Error('Open-Meteo returned haze for fewer than 9 months');
	// mornings: only where the Sun gets 16 degrees down (not high-latitude summers); else the evenings stand in
	const mo = monthlyOf(r.mornings);
	return {
		monthly: ev.monthly,
		reference: ev.reference,
		...(mo ? { monthlyMorning: mo.monthly, referenceMorning: mo.reference } : {}),
		normalsRange: [start, end],
		source: 'CAMS global via Open-Meteo air-quality API',
	};
}

/**
 * Forecast evening and morning haze, yesterday to `days` ahead (CAMS reaches ~5 days; Open-Meteo allows up
 * to 7), from one request.
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, extraParams?: string, days?: number, retries?: number }} [options]
 * @returns {Promise<{ evenings: Record<string, number>, mornings: Record<string, number> }>} aerosol optical depth by ISO date
 */
export async function fetchHazeForecastBoth(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const url = `${options.url ?? AQ_URL}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}`
		+ `&hourly=aerosol_optical_depth&past_days=1&forecast_days=${Math.min(7, Math.max(1, options.days ?? 7))}`
		+ '&timeformat=unixtime&timezone=GMT' + (options.extraParams ?? '');
	return readings(await getOpenMeteoJson(doFetch, url, { retries: options.retries ?? 1 }), latitude, longitude);
}

/**
 * Forecast evening haze (fetchHazeForecastBoth's evenings).
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, extraParams?: string, days?: number, retries?: number }} [options]
 * @returns {Promise<Record<string, number>>} aerosol optical depth by ISO date
 */
export async function fetchHazeForecast(latitude, longitude, options = {}) {
	return (await fetchHazeForecastBoth(latitude, longitude, options)).evenings;
}

/**
 * Forecast evening haze from NOAA's GEFS-Aerosols (fetchGefsHazeForecastBoth's evenings).
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, retries?: number }} [options]
 * @returns {Promise<Record<string, number>>} aerosol optical depth by ISO date
 */
export async function fetchGefsHazeForecast(latitude, longitude, options = {}) {
	return (await fetchGefsHazeForecastBoth(latitude, longitude, options)).evenings;
}

/**
 * Forecast evening and morning haze from NOAA's GEFS-Aerosols (the fallback; see the header), same shape as
 * fetchHazeForecastBoth. The latest run's ~41 three-hourly values at the nearest 0.25 deg point.
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, retries?: number }} [options]
 *   url: the dataset's .json address (default GEFS_AEROSOL_URL), e.g. a same-origin proxy of it if a
 *   browser may not call NOAA's server directly.
 * @returns {Promise<{ evenings: Record<string, number>, mornings: Record<string, number> }>} aerosol optical depth by ISO date
 */
export async function fetchGefsHazeForecastBoth(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const lat = Math.round(latitude * 4) / 4, lon = ((Math.round(longitude * 4) / 4) % 360 + 360) % 360;
	const url = `${options.url ?? GEFS_AEROSOL_URL}?AOTK_entireatmosphere%5B0:1:last%5D%5B(${lat})%5D%5B(${lon})%5D`;
	const retries = options.retries ?? 1;
	/** @type {any} */ let j = null;
	for (let attempt = 0; ; attempt++) {
		try {
			const r = await doFetch(url);
			if (!r.ok) throw new Error(`GEFS-Aerosols request failed (HTTP ${r.status})`);
			j = await r.json();
			break;
		} catch (e) {
			if (attempt >= retries) throw e;
			await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
		}
	}
	const cols = j?.table?.columnNames ?? [], rows = j?.table?.rows ?? [];
	const it = cols.indexOf('time'), iv = cols.indexOf('AOTK_entireatmosphere');
	if (it < 0 || iv < 0 || rows.length < 2) throw new Error('GEFS-Aerosols returned no data');
	const pts = rows.map((/** @type {any[]} */ r) => [Date.parse(r[it]) / 1000, r[iv]]).filter((/** @type {any[]} */ q) => Number.isFinite(q[0]))
		.sort((/** @type {number[]} */ a, /** @type {number[]} */ b) => a[0] - b[0]);
	// onto an even hourly grid (the interpolation assumes even spacing)
	const t0 = pts[0][0], t1 = pts[pts.length - 1][0];
	/** @type {number[]} */ const times = [];
	/** @type {(number | null)[]} */ const vals = [];
	for (let t = t0, k = 0; t <= t1; t += 3600) {
		while (k < pts.length - 2 && pts[k + 1][0] <= t) k++;
		const [ta, va] = pts[k], [tb, vb] = pts[k + 1];
		times.push(t);
		vals.push(Number.isFinite(va) && Number.isFinite(vb) ? va + (vb - va) * (t - ta) / (tb - ta) : null);
	}
	return { evenings: readingsOf(times, vals, latitude, longitude, 'evening'), mornings: readingsOf(times, vals, latitude, longitude, 'morning') };
}
