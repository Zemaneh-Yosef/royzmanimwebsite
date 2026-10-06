// @ts-check
/**
 * auto-atmosphere.js
 *
 * One call that sets up the most accurate keyless weather for refraction, all from the browser:
 *
 *     import { createAutoAtmosphere } from "./auto-atmosphere.js";
 *
 *     const atm = await createAutoAtmosphere(lat, lon, {
 *         normals: savedNormals,                              // optional: from a previous run (atm.normals)
 *         serverUrl: "https://your-vps.example/refraction",   // optional: your refraction-server
 *     });
 *     calc.setAtmosphereProvider(atm.provider);
 *     save(atm.normals);                                      // reuse next time; they don't change
 *     // later, e.g. every 3-6 hours:  await atm.refresh();
 *
 * Order, per sunrise / sunset (the first that has the date wins):
 *   1. Open-Meteo path profiles (open-meteo-path.js), the next 16 days: temperatures from the ground
 *      to ~3 km at 9 points along the line of sight, plus the sea temperature where it crosses water,
 *      from the best weather model for the place. Worldwide.
 *      If that request fails: a forecast at the observer only - NWS where it has a grid (US),
 *      otherwise Open-Meteo.
 *   2. Your refraction-server, if serverUrl is given and the place is in its regions: typical path
 *      profiles (climatology) for dates past the forecast.
 *   3. Monthly normals at the observer: the average temperature at the time of sunrise and of sunset,
 *      from Open-Meteo's archive of the ERA5 reanalysis (5 years), for the exact spot.
 *   4. Otherwise: the calculator's default model.
 *
 * Why not the US government sources first: NWS's forecast is excellent, but it is one temperature at
 * the observer, and refraction depends on how temperature changes with height and along the 100+ km
 * the light travels. With one temperature the calculator has to assume the standard lapse rate, which
 * is wrong in exactly the calm dawns when inversions form. Open-Meteo carries NOAA's own models (GFS,
 * HRRR) alongside ECMWF and others, with the vertical levels. Past the forecast, NOAA's station normals
 * give the daily minimum / mean at a station that may be 10-30 km away; the ERA5 normals give the
 * temperature at the actual times of sunrise and sunset at the spot. Both NOAA sources remain
 * available (forecast: 'nws', normalsSource: 'ncei').
 */

import { chainProviders, monthlyClimate } from './royzmanim-spa-corrections.js';
import { createNwsAtmosphere, fetchNearestNormals } from './nws-atmosphere.js';
import { createOpenMeteoAtmosphere, fetchOpenMeteoNormals } from './open-meteo-atmosphere.js';
import { createOpenMeteoPathAtmosphere } from './open-meteo-path.js';
import { createServerPathAtmosphere } from './path-atmosphere.js';

/**
 * @param {number} latitude @param {number} longitude
 * @param {{ forecast?: 'path' | 'nws' | 'open-meteo', serverUrl?: string, serverDays?: number,
 *           normals?: { minC: number[], meanC: number[], heightM?: number } | null,
 *           normalsSource?: 'open-meteo' | 'ncei', userAgent?: string, fetch?: typeof fetch, timeoutMs?: number,
 *           openMeteo?: { forecastUrl?: string, archiveUrl?: string, marineUrl?: string, extraParams?: string, models?: string } }} [options]
 *   forecast: 'path' (default) as above; 'nws' / 'open-meteo' force a single-temperature forecast.
 *   serverDays: days of server profiles to load at start (default 31; more with atm.paths.prefetch).
 *   normals: pass what a previous run returned (atm.normals) to skip that download.
 *   userAgent: identifies the app to NWS (servers only; browsers send their own).
 *   timeoutMs: per request (default 20000).
 *
 * Offline (or every source failing) is not an error: the provider then falls back to the saved
 * normals if you passed them, else to the calculator's default model, and atm.notes says what failed.
 * Call atm.refresh() when the connection returns.
 */
export async function createAutoAtmosphere(latitude, longitude, options = {}) {
	const baseFetch = options.fetch ?? globalThis.fetch;
	const timeoutMs = options.timeoutMs ?? 20000;
	/** every request gives up after timeoutMs, so a bad connection can't stall the page @type {typeof fetch} */
	const doFetch = (url, init = {}) => {
		if (globalThis.navigator?.onLine === false) return Promise.reject(new Error('offline'));
		const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
		return baseFetch(url, signal ? { ...init, signal } : init);
	};
	const om = options.openMeteo ?? {};
	/** @type {string[]} */
	const notes = [];
	const note = (/** @type {string} */ what, /** @type {unknown} */ e) => notes.push(`${what}: ${/** @type {Error} */ (e).message}`);

	// the three groups don't depend on each other: run them at once, so a slow or dead connection
	// costs one timeout, not one per request

	// 1. forecast
	const forecastP = (async () => {
		const want = options.forecast ?? 'path';
		if (want === 'path') {
			try {
				return { f: await createOpenMeteoPathAtmosphere(latitude, longitude, { fetch: doFetch, ...om }), src: 'open-meteo-path' };
			} catch (e) { note('Open-Meteo path profiles', e); }
		}
		if (want !== 'open-meteo') {
			try {
				return { f: await createNwsAtmosphere(latitude, longitude, { userAgent: options.userAgent, fetch: doFetch }), src: 'nws' };
			} catch (e) {
				if (!/\(404\)|US only/.test(/** @type {Error} */ (e).message)) note('NWS', e);   // 404 = outside the US
			}
		}
		try {
			return { f: await createOpenMeteoAtmosphere(latitude, longitude, { fetch: doFetch, ...om }), src: 'open-meteo' };
		} catch (e) { note('Open-Meteo forecast', e); }
		return null;
	})();

	// 2. your server's climatology (and its forecast, should Open-Meteo be down)
	const pathsP = (async () => {
		if (!options.serverUrl) return null;
		try {
			const p = await createServerPathAtmosphere(options.serverUrl, latitude, longitude,
				{ days: options.serverDays ?? 31, fetch: doFetch });
			if (p.lastError) note('refraction server', p.lastError);
			else if (p.eventCount === 0) notes.push('refraction server: no data for this place (outside its regions?)');
			return p;
		} catch (e) { note('refraction server', e); return null; }
	})();

	// 3. normals
	const normalsP = (async () => {
		if (options.normals) return options.normals;
		if (options.normalsSource === 'ncei') {
			try { return await fetchNearestNormals(latitude, longitude, { fetch: doFetch }); }
			catch (e) { note('NOAA normals', e); }
		}
		try { return await fetchOpenMeteoNormals(latitude, longitude, { fetch: doFetch, ...om }); }
		catch (e) { note('Open-Meteo normals', e); }
		if (options.normalsSource !== 'ncei') {                  // last resort in the US
			try { return await fetchNearestNormals(latitude, longitude, { fetch: doFetch }); }
			catch { /* outside the US, or NCEI unreachable */ }
		}
		return null;
	})();

	const [fr, paths, normals] = await Promise.all([forecastP, pathsP, normalsP]);
	const forecast = fr?.f ?? null;
	/** @type {'open-meteo-path' | 'nws' | 'open-meteo' | null} */
	const forecastSource = /** @type {any} */ (fr?.src ?? null);

	const provider = chainProviders(forecast?.provider, paths?.provider, normals ? monthlyClimate(normals) : null);
	return {
		provider,
		/** which forecast is in use: 'open-meteo-path' (best), 'nws' or 'open-meteo' (single temperature) */
		forecastSource,
		normals,
		forecast,
		paths,
		/** what could not be used, for logging */
		notes,
		/** re-fetch the forecast (and the server's profiles); a failure keeps the previous data */
		async refresh() {
			await Promise.allSettled([forecast?.refresh(), paths?.refresh()]);
		},
	};
}
