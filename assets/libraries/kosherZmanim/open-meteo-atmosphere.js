// @ts-check
/**
 * open-meteo-atmosphere.js
 *
 * Atmosphere provider for ROYSPACalculator.setAtmosphereProvider() backed by Open-Meteo
 * (open-meteo.com): worldwide, no API key, callable straight from the browser (CORS enabled).
 *
 *     import { createOpenMeteoAtmosphere, fetchOpenMeteoNormals } from "./open-meteo-atmosphere.js";
 *     import { monthlyClimate } from "./royzmanim-spa-corrections.js";
 *
 *     const normals = await fetchOpenMeteoNormals(lat, lon);   // once per place; store it (JSON)
 *     const om = await createOpenMeteoAtmosphere(lat, lon, { fallback: monthlyClimate(normals) });
 *     calc.setAtmosphereProvider(om.provider);
 *     // later, e.g. every few hours:  await om.refresh();
 *
 * Forecast: hourly 2 m temperature and surface pressure for 16 days (plus yesterday), interpolated to
 * the approximate time of each sunrise / sunset. Open-Meteo downscales the forecast to the point's
 * elevation (90 m terrain model) and returns that elevation, which is passed on as heightM.
 *
 * Normals: from Open-Meteo's historical archive (ECMWF ERA5 reanalysis), the average temperature at
 * the time of sunrise and at the time of sunset in each month over the last `years` full years. That is
 * closer to what refraction needs than the monthly-minimum / monthly-mean rule (ChaiTables', and NOAA
 * station normals), which only approximates the temperature at those times.
 *
 * Terms: the free API is for non-commercial use (no ads or subscriptions), up to 10,000 calls a day,
 * 5,000 an hour and 600 a minute per client; heavy requests (many variables or long periods) count
 * as several calls. Data licence CC BY 4.0: credit "Weather data by Open-Meteo.com" with a link.
 * Commercial apps need their paid API (customer- prefixed hosts with an apikey parameter; see
 * open-meteo.com/en/pricing) - pass those via the forecastUrl / archiveUrl options.
 */

import { approximateEventTime, temperatureAt } from './nws-atmosphere.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * @typedef {(date: any, event: 'sunrise'|'sunset', geo: import('./kosher-zmanim.js').GeoLocation) => ({ temperatureC: number, pressureMb?: number, heightM?: number } | null | undefined)} Provider
 * @typedef {{ start: number, end: number, value: number }} Interval
 */

/**
 * Hourly values (time in unix seconds, value at that instant) to intervals centred on each hour, the
 * form temperatureAt() interpolates.
 * @param {number[]} times @param {(number | null)[]} values @returns {Interval[]}
 */
function hourlySeries(times, values) {
	/** @type {Interval[]} */
	const out = [];
	for (let i = 0; i < times.length; i++) {
		const v = values?.[i];
		if (v == null || !Number.isFinite(v)) continue;
		const t = times[i] * 1000;
		out.push({ start: t - 1800000, end: t + 1800000, value: v });
	}
	return out;
}

/**
 * GET a JSON response from Open-Meteo, with clear errors and retries for passing trouble.
 *
 * Open-Meteo sometimes answers a heavy request with HTTP 200 and a plain-text body ("Unexpected error
 * while streaming data: timeoutReached"), typically the first time a model is asked for in a while;
 * the same request usually succeeds seconds later. That, a timeout (the fetch's AbortSignal), a
 * network error, HTTP 429 and HTTP 5xx are retried `retries` times; HTTP 4xx (a bad request, a
 * location outside a model) is not.
 * @param {typeof fetch} doFetch @param {string} url
 * @param {{ retries?: number, retryDelayMs?: number }} [options] retries default 1, delay default 2000 ms
 */
export async function getOpenMeteoJson(doFetch, url, options = {}) {
	const retries = options.retries ?? 1, delay = options.retryDelayMs ?? 2000;
	for (let attempt = 0; ; attempt++) {
		/** @type {boolean} */ let retryable = true;
		try {
			const r = await doFetch(url);
			const text = await r.text();
			/** @type {any} */ let j;
			try { j = JSON.parse(text); }
			catch {
				retryable = r.ok || r.status === 429 || r.status >= 500;
				throw new Error(`Open-Meteo request failed (HTTP ${r.status}: ${text.trim().slice(0, 120) || 'empty response'})`);
			}
			if (!r.ok || j?.error) {
				retryable = r.status === 429 || r.status >= 500;
				throw new Error(`Open-Meteo request failed (HTTP ${r.status}${j?.reason ? `: ${j.reason}` : ''})`);
			}
			return j;
		} catch (e) {
			if (!retryable || attempt >= retries || globalThis.navigator?.onLine === false) throw e;
			await new Promise(res => setTimeout(res, delay * (attempt + 1)));
		}
	}
}

const getJson = getOpenMeteoJson;

/**
 * Forecast-backed provider.
 * @param {number} latitude @param {number} longitude
 * @param {{ fallback?: Provider | null, fetch?: typeof fetch, forecastUrl?: string, extraParams?: string }} [options]
 *   fallback: provider for dates outside the forecast (e.g. monthlyClimate(normals)); null = default model.
 *   forecastUrl / extraParams: e.g. a paid endpoint and "&apikey=...".
 */
export async function createOpenMeteoAtmosphere(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const url = `${options.forecastUrl ?? FORECAST_URL}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}`
		+ '&hourly=temperature_2m,surface_pressure&past_days=1&forecast_days=16&timeformat=unixtime&timezone=GMT'
		+ (options.extraParams ?? '');
	/** @type {Interval[]} */
	let temps = [];
	/** @type {Interval[]} */
	let press = [];
	/** @type {number | undefined} */
	let elevationM;

	const refresh = async () => {
		const j = await getJson(doFetch, url);
		const h = j?.hourly;
		if (!h?.time?.length) throw new Error('Open-Meteo returned no hourly data');
		if (j.hourly_units?.temperature_2m && !/°C|C$/.test(j.hourly_units.temperature_2m)) {
			throw new Error(`unexpected temperature unit ${j.hourly_units.temperature_2m}`);
		}
		temps = hourlySeries(h.time, h.temperature_2m);
		press = hourlySeries(h.time, h.surface_pressure);
		elevationM = Number.isFinite(j.elevation) ? j.elevation : undefined;
		if (!temps.length) throw new Error('Open-Meteo returned no temperatures');
	};
	await refresh();

	/** @type {Provider} */
	const provider = (date, event, geo) => {
		const t = approximateEventTime(date, geo?.getLatitude?.() ?? latitude, geo?.getLongitude?.() ?? longitude, event);
		const temperatureC = temperatureAt(temps, t);
		if (!Number.isFinite(temperatureC)) return options.fallback ? options.fallback(date, event, geo) : null;
		/** @type {{ temperatureC: number, pressureMb?: number, heightM?: number }} */
		const spec = { temperatureC };
		// surface pressure and temperature both belong to the forecast point's elevation; the calculator
		// carries them to the observer's height
		if (elevationM != null) {
			spec.heightM = elevationM;
			const p = temperatureAt(press, t);
			if (Number.isFinite(p)) spec.pressureMb = p;
		}
		return spec;
	};

	return {
		provider,
		refresh,
		source: 'open-meteo',
		/** first / last instant covered by the forecast (epoch ms) */
		get coverage() { return temps.length ? { start: temps[0].start, end: temps[temps.length - 1].end } : null; },
	};
}

/**
 * @typedef {{ sunriseC: number[], sunsetC: number[], minC: number[], meanC: number[], heightM: number,
 *             years: [number, number], source: string }} EventNormals
 *   sunriseC / sunsetC: average temperature (C) at the time of sunrise / sunset, January..December.
 *   minC / meanC are the same arrays under the names monthlyClimate() reads (it uses minC for sunrise
 *   and meanC for sunset), so monthlyClimate(normals) uses the event-time values directly.
 */

/**
 * Monthly temperature normals at the times of sunrise and sunset, from ERA5 via Open-Meteo's archive.
 * One request of `years` years of hourly data (about 100-150 "calls" of the free quota for 5 years;
 * ~0.5 MB). Fetch once per place and store the result.
 * @param {number} latitude @param {number} longitude
 * @param {{ years?: number, endYear?: number, fetch?: typeof fetch, archiveUrl?: string, extraParams?: string }} [options]
 *   years: number of full calendar years (default 5), ending endYear (default: last year).
 * @returns {Promise<EventNormals>}
 */
export async function fetchOpenMeteoNormals(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const endYear = options.endYear ?? new Date().getUTCFullYear() - 1;
	const startYear = endYear - (options.years ?? 5) + 1;
	const url = `${options.archiveUrl ?? ARCHIVE_URL}?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}`
		+ `&start_date=${startYear}-01-01&end_date=${endYear}-12-31&hourly=temperature_2m&timeformat=unixtime&timezone=GMT`
		+ (options.extraParams ?? '');
	const j = await getJson(doFetch, url);
	const series = hourlySeries(j?.hourly?.time ?? [], j?.hourly?.temperature_2m ?? []);
	if (series.length < 24 * 300) throw new Error('Open-Meteo archive returned too little data');
	const sum = { sunrise: Array(12).fill(0), sunset: Array(12).fill(0) };
	const n = { sunrise: Array(12).fill(0), sunset: Array(12).fill(0) };
	for (let y = startYear; y <= endYear; y++) {
		for (let m = 1; m <= 12; m++) {
			const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
			for (let d = 1; d <= days; d++) {
				for (const ev of /** @type {const} */ (['sunrise', 'sunset'])) {
					const v = temperatureAt(series, approximateEventTime({ year: y, month: m, day: d }, latitude, longitude, ev));
					if (Number.isFinite(v)) { sum[ev][m - 1] += v; n[ev][m - 1]++; }
				}
			}
		}
	}
	const avg = (/** @type {'sunrise'|'sunset'} */ ev) => sum[ev].map((s, i) => n[ev][i] ? +(s / n[ev][i]).toFixed(2) : NaN);
	const sunriseC = avg('sunrise'), sunsetC = avg('sunset');
	if ([...sunriseC, ...sunsetC].some(v => !Number.isFinite(v))) throw new Error('Open-Meteo archive has gaps for some months');
	return {
		sunriseC, sunsetC, minC: sunriseC, meanC: sunsetC,
		heightM: Number.isFinite(j.elevation) ? j.elevation : 0,
		years: [startYear, endYear],
		source: 'Open-Meteo archive (ECMWF ERA5)',
	};
}
