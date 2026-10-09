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
 * when medium stars appear.
 *
 * Normals: the CAMS archive Open-Meteo serves starts in August 2022, so the averages cover August 2022
 * to the end of the last full month (three-plus years by now; they firm up as it grows). One request of
 * ~30,000 hourly values (~300 KB; a few dozen "calls" of the free quota): fetch once per place and keep
 * it, refreshing once a year. The reference ("average sky") is the mean of the 12 monthly averages, so
 * an uneven number of each month in the archive does not tilt it.
 *
 * Terms as open-meteo-atmosphere.js: non-commercial use, credit "Weather data by Open-Meteo.com" (CC BY
 * 4.0); CAMS data: Copernicus Atmosphere Monitoring Service.
 */

import { getOpenMeteoJson } from './open-meteo-atmosphere.js';
import { eveningSunAt } from './star-nightfall.js';

const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
export const HAZE_HISTORY_START = '2022-08-01';
/** the Sun's altitude (deg) at which the evening's haze is read */
export const HAZE_SUN_ALT = -7;

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
 * Evening aerosol optical depth per date over the series.
 * @param {any} j Open-Meteo JSON @param {number} lat @param {number} lon @returns {Record<string, number>}
 */
function evenings(j, lat, lon) {
	const times = j?.hourly?.time ?? [], vals = j?.hourly?.aerosol_optical_depth ?? [];
	/** @type {Record<string, number>} */
	const out = {};
	if (!times.length) return out;
	const first = new Date(times[0] * 1000), last = new Date(times[times.length - 1] * 1000);
	for (let d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate())); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
		const t = eveningSunAt({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }, lat, lon, HAZE_SUN_ALT);
		const v = Number.isFinite(t) ? valueAt(times, vals, t) : NaN;
		if (Number.isFinite(v) && v >= 0) out[isoOf(d)] = +v.toFixed(3);
	}
	return out;
}

/**
 * Average evening haze per month and the place's year-round average.
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, extraParams?: string, start?: string, end?: string, retries?: number }} [options]
 *   start / end: ISO dates (default August 2022 .. the end of last month).
 * @returns {Promise<{ monthly: number[], reference: number, normalsRange: [string, string], source: string }>}
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
	const ev = evenings(j, latitude, longitude);
	const sum = Array(12).fill(0), n = Array(12).fill(0);
	for (const [iso, v] of Object.entries(ev)) { const m = +iso.slice(5, 7) - 1; sum[m] += v; n[m]++; }
	const have = n.filter(c => c >= 10).length;
	if (have < 9) throw new Error(`Open-Meteo returned haze for only ${have} months`);
	const raw = sum.map((s, i) => n[i] >= 10 ? s / n[i] : NaN);
	const mean = raw.filter(Number.isFinite).reduce((a, b) => a + b, 0) / have;
	const monthly = raw.map(v => +(Number.isFinite(v) ? v : mean).toFixed(3));
	return {
		monthly,
		reference: +(monthly.reduce((a, b) => a + b, 0) / 12).toFixed(3),
		normalsRange: [start, end],
		source: 'CAMS global via Open-Meteo air-quality API',
	};
}

/**
 * Forecast evening haze, yesterday to `days` ahead (CAMS reaches ~5 days; Open-Meteo allows up to 7).
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, extraParams?: string, days?: number, retries?: number }} [options]
 * @returns {Promise<Record<string, number>>} aerosol optical depth by ISO date
 */
export async function fetchHazeForecast(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const url = `${options.url ?? AQ_URL}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}`
		+ `&hourly=aerosol_optical_depth&past_days=1&forecast_days=${Math.min(7, Math.max(1, options.days ?? 7))}`
		+ '&timeformat=unixtime&timezone=GMT' + (options.extraParams ?? '');
	return evenings(await getOpenMeteoJson(doFetch, url, { retries: options.retries ?? 1 }), latitude, longitude);
}
