// @ts-check
/**
 * open-meteo-haze.js
 *
 * Haze (aerosol optical depth at 550 nm) for nightfall by the stars (star-nightfall.js), from
 * Open-Meteo's air-quality API: the Copernicus Atmosphere Monitoring Service (CAMS) global forecast,
 * ~45 km, worldwide, no API key, callable from the browser.
 *
 *     import { fetchHazeNormals, fetchHazeForecastBoth } from "./open-meteo-haze.js";
 *     const normals = await fetchHazeNormals(lat, lon);           // once per place; store it (JSON)
 *     const forecast = await fetchHazeForecastBoth(lat, lon);     // every ~6-12 h (CAMS runs twice a day)
 *     const haze = { ...normals, forecast, forecastFetchedAt: Date.now(), blpCdM2 };   // a HazeData
 *     hazeOn(haze, date, { depressionDeg: 7.165, rising: false });   // { aod, aodRef } (star-nightfall.js)
 *
 * Both keep CAMS's hourly series as it comes, so the haze can be read at whatever moment a time is defined
 * by - Tzet at its degree after sunset, dawn at its degree before sunrise - and the averages at that same
 * moment of every day of the archive (hazeOn).
 *
 * Normals: the CAMS archive Open-Meteo serves starts in August 2022, so the averages cover August 2022
 * to the end of the last full month (three-plus years by now; they firm up as it grows). One request of
 * ~30,000 hourly values (~300 KB; a few dozen "calls" of the free quota): fetch once per place and keep
 * it, refreshing once a year. The reference ("average sky") is the mean of the 12 monthly averages, so
 * an uneven number of each month in the archive does not tilt it.
 *
 * Fallback forecast: NOAA's GEFS-Aerosols (fetchGefsHazeForecastBoth), the US global aerosol forecast -
 * 0.25 deg, 3-hourly, ~5 days, the same 550 nm optical depth - from NOAA's ERDDAP server (no key; free to
 * use and redistribute). Used only when Open-Meteo's forecast fails. The normals stay CAMS (ERDDAP keeps
 * no history), so a GEFS evening is compared with a CAMS average: if the two models differ on average,
 * the delay carries that difference on those days.
 *
 * Terms as open-meteo-atmosphere.js: non-commercial use, credit "Weather data by Open-Meteo.com" (CC BY
 * 4.0); CAMS data: Copernicus Atmosphere Monitoring Service. GEFS-Aerosols: NOAA/NCEP.
 */

import { getOpenMeteoJson } from './open-meteo-atmosphere.js';

const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
/** NOAA AOML's ERDDAP copy of the latest GEFS-Aerosols run (aerosol optical thickness at 550 nm) */
export const GEFS_AEROSOL_URL = 'https://oceanwatch.aoml.noaa.gov/erddap/griddap/GEFS_Aerosols_bfd8_ee31_ed8b.json';
export const HAZE_HISTORY_START = '2022-08-01';

/** @typedef {import('./star-nightfall.js').HazeSeries} HazeSeries */

/** @param {Date} d */
const isoOf = d => d.toISOString().slice(0, 10);

/**
 * An Open-Meteo hourly aerosol_optical_depth series as a HazeSeries.
 * @param {any} j @param {number} lat @param {number} lon @returns {HazeSeries}
 */
function seriesOf(j, lat, lon) {
	const times = j?.hourly?.time ?? [], vals = j?.hourly?.aerosol_optical_depth ?? [];
	if (times.length < 2) throw new Error('Open-Meteo returned no haze');
	return { lat, lon, t0: times[0], step: times[1] - times[0], aod: vals.map((/** @type {number | null} */ v) => v == null ? null : +v.toFixed(3)) };
}

/**
 * CAMS's archive at a place, hourly, for the averages (hazeOn reads them at any moment).
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, extraParams?: string, start?: string, end?: string, retries?: number }} [options]
 *   start / end: ISO dates (default August 2022 .. the end of last month).
 * @returns {Promise<{ normals: HazeSeries, normalsRange: [string, string], source: string }>}
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
	return { normals: seriesOf(j, latitude, longitude), normalsRange: [start, end], source: 'CAMS global via Open-Meteo air-quality API' };
}

/**
 * CAMS's forecast haze, hourly, yesterday to `days` ahead (CAMS reaches ~5 days; Open-Meteo allows up to 7),
 * from one request.
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, extraParams?: string, days?: number, retries?: number }} [options]
 * @returns {Promise<HazeSeries>}
 */
export async function fetchHazeForecastBoth(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const url = `${options.url ?? AQ_URL}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}`
		+ `&hourly=aerosol_optical_depth&past_days=1&forecast_days=${Math.min(7, Math.max(1, options.days ?? 7))}`
		+ '&timeformat=unixtime&timezone=GMT' + (options.extraParams ?? '');
	return seriesOf(await getOpenMeteoJson(doFetch, url, { retries: options.retries ?? 1 }), latitude, longitude);
}

/**
 * Forecast haze from NOAA's GEFS-Aerosols (the fallback; see the header), hourly like fetchHazeForecastBoth. The latest run's ~41 three-hourly values at the nearest 0.25 deg point.
 * @param {number} latitude @param {number} longitude
 * @param {{ fetch?: typeof fetch, url?: string, retries?: number }} [options]
 *   url: the dataset's .json address (default GEFS_AEROSOL_URL), e.g. a same-origin proxy of it if a
 *   browser may not call NOAA's server directly.
 * @returns {Promise<HazeSeries>}
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
	return { lat: latitude, lon: longitude, t0: times[0], step: 3600, aod: vals.map(v => v == null ? null : +v.toFixed(3)) };
}
