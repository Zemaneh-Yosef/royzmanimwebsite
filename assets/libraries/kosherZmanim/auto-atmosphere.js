// @ts-check
/**
 * auto-atmosphere.js
 *
 * One call that sets up the most accurate keyless weather for refraction, all from the browser,
 * without making the app wait for it:
 *
 *     import { createAutoAtmosphere } from "./auto-atmosphere.js";
 *
 *     const atm = await createAutoAtmosphere(lat, lon, {
 *         normals: savedNormals,                              // optional: from a previous run (atm.normals)
 *         serverUrl: "https://your-vps.example/refraction",   // optional: your refraction-server
 *         onUpdate: (atm, what) => {                          // better data arrived: recompute and redraw
 *             if (what === 'normals') save(atm.normals);      // reuse next time; they don't change
 *             render();
 *         },
 *     });
 *     calc.setAtmosphereProvider(atm.provider);               // set once; it upgrades itself
 *     render();                                               // right away, with what is there already
 *     // later, e.g. every 3-6 hours:  await atm.refresh();
 *
 * It returns at once. atm.provider answers immediately with the best data in hand (your saved normals,
 * or the calculator's default model on a first run) and upgrades itself as each download finishes,
 * calling onUpdate each time; times may shift by a few seconds when the forecast arrives. A slow or
 * dead connection never leaves the app without times. To wait for everything instead (the old
 * behaviour): pass `wait: true` (or `await atm.ready`).
 *
 * Order, per sunrise / sunset (the first that has the date wins):
 *   1. Open-Meteo path profiles (open-meteo-path.js), the next 16 days: temperatures from the ground
 *      to ~3 km at 9 points along the line of sight, plus the sea temperature where it crosses water,
 *      from the model chosen for the place (open-meteo-path.js says which). Worldwide.
 *      Until they arrive, and if they fail: a forecast at the observer only - NWS where it has a grid
 *      (US), otherwise Open-Meteo. It is fetched alongside, so it is there within a second or two.
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
 * @typedef {'forecast' | 'interim-forecast' | 'paths' | 'normals' | 'refresh'} UpdateKind
 *   forecast: the path profiles (or, if they failed, the single-temperature forecast) are in use;
 *   interim-forecast: the single-temperature forecast arrived first and is in use meanwhile;
 *   paths: the refraction-server's profiles; normals: the monthly normals; refresh: atm.refresh() ended.
 */

/**
 * @param {number} latitude @param {number} longitude
 * @param {{ forecast?: 'path' | 'nws' | 'open-meteo', serverUrl?: string, serverDays?: number,
 *           normals?: { minC: number[], meanC: number[], heightM?: number } | null,
 *           normalsSource?: 'open-meteo' | 'ncei', userAgent?: string, fetch?: typeof fetch,
 *           timeoutMs?: number, pathTimeoutMs?: number, wait?: boolean, interim?: boolean,
 *           onUpdate?: (atm: any, what: UpdateKind) => void,
 *           openMeteo?: { forecastUrl?: string, archiveUrl?: string, marineUrl?: string, extraParams?: string,
 *                         models?: string, fallbackModel?: string | null } }} [options]
 *   forecast: 'path' (default) as above; 'nws' / 'open-meteo' force a single-temperature forecast.
 *   serverDays: days of server profiles to load at start (default 31; more with atm.paths.prefetch).
 *   normals: pass what a previous run returned (atm.normals): used from the first moment, and the
 *     download is skipped.
 *   userAgent: identifies the app to NWS (servers only; browsers send their own).
 *   timeoutMs: per request (default 20000). pathTimeoutMs: per path-profile request (default 60000;
 *     Open-Meteo can take 30-50 s the first time a model is asked for in a while). Each is retried once.
 *   onUpdate: called whenever the provider has better data (see UpdateKind); recompute times there.
 *   wait: true = resolve only when every download has finished (default false). Use it when you
 *     already render from stored data while this loads (as refraction-data.js does).
 *   interim: also fetch the single-temperature forecast right away, to stand in while the path
 *     profiles load (default: true, or false with wait - then it is fetched only if the paths fail).
 *   openMeteo.models: 'auto' (default, by place), 'best_match', or a model name; see open-meteo-path.js.
 *
 * Offline (or every source failing) is not an error: the provider keeps the saved normals if you
 * passed them, else the calculator's default model, and atm.notes says what failed. Call
 * atm.refresh() when the connection returns: it retries whatever failed.
 */
export async function createAutoAtmosphere(latitude, longitude, options = {}) {
	const baseFetch = options.fetch ?? globalThis.fetch;
	/** fetch that gives up after `ms`, so a bad connection can't stall anything @returns {typeof fetch} */
	const fetchWithin = (/** @type {number} */ ms) => (url, init = {}) => {
		if (globalThis.navigator?.onLine === false) return Promise.reject(new Error('offline'));
		const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
		return baseFetch(url, signal ? { ...init, signal } : init);
	};
	const doFetch = fetchWithin(options.timeoutMs ?? 20000);
	const pathFetch = fetchWithin(options.pathTimeoutMs ?? 60000);
	const om = options.openMeteo ?? {};
	const want = options.forecast ?? 'path';
	/** @type {string[]} */
	const notes = [];
	const note = (/** @type {string} */ what, /** @type {unknown} */ e) => notes.push(`${what}: ${/** @type {Error} */ (e).message}`);

	/** what is in hand; the provider is rebuilt from it whenever it changes */
	const state = {
		/** @type {any} path profiles */ path: null,
		/** @type {any} single-temperature forecast */ single: null,
		/** @type {'nws' | 'open-meteo' | null} */ singleSrc: null,
		/** @type {boolean} the path request has ended (either way) */ pathDone: want !== 'path',
		/** @type {any} */ paths: null,
		/** @type {any} */ normals: options.normals ?? null,
	};

	// the single-temperature forecast only until the path profiles are in (as before: where the paths
	// have no profile, the server's climatology is preferred to one temperature)
	const compose = () => chainProviders(state.path ? state.path.provider : state.single?.provider,
		state.paths?.provider, state.normals ? monthlyClimate(state.normals) : null);
	let current = compose();
	/** what the calculator holds: always the latest data @type {(date: any, event: any, geo: any) => any} */
	const provider = (date, event, geo) => current(date, event, geo);

	/** @type {any} */
	let atm;
	const update = (/** @type {UpdateKind} */ what) => {
		current = compose();
		if (!atm || !options.onUpdate) return;
		try { options.onUpdate(atm, what); } catch (e) { note('onUpdate', e); }
	};

	// the three groups don't depend on each other: run them at once, each upgrading the provider as it
	// lands, so a slow or dead connection costs nothing but the upgrade

	// 1a. path profiles
	const loadPath = async () => {
		if (want !== 'path') return;
		try {
			state.path = await createOpenMeteoPathAtmosphere(latitude, longitude, { fetch: pathFetch, ...om });
			if (state.path.lastError) note('Open-Meteo path profiles (partly)', state.path.lastError);
			state.pathDone = true;
			update('forecast');
		} catch (e) {
			note('Open-Meteo path profiles', e);
			state.pathDone = true;
			if (state.single) update('forecast');                 // the single forecast stays, now for good
		}
	};

	// 1b. single-temperature forecast: interim while the paths load, the forecast if they fail
	const loadSingle = async () => {
		/** @type {any} */ let f = null;
		/** @type {'nws' | 'open-meteo' | null} */ let src = null;
		if (want !== 'open-meteo') {
			try { f = await createNwsAtmosphere(latitude, longitude, { userAgent: options.userAgent, fetch: doFetch }); src = 'nws'; }
			catch (e) {
				if (!/\(404\)|US only/.test(/** @type {Error} */ (e).message)) note('NWS', e);   // 404 = outside the US
			}
		}
		if (!f) {
			try { f = await createOpenMeteoAtmosphere(latitude, longitude, { fetch: doFetch, ...om }); src = 'open-meteo'; }
			catch (e) { note('Open-Meteo forecast', e); }
		}
		if (!f) return;
		state.single = f; state.singleSrc = src;
		if (!state.path) update(state.pathDone ? 'forecast' : 'interim-forecast');
	};

	// 2. your server's climatology (and its forecast, should Open-Meteo be down)
	const loadPaths = async () => {
		if (!options.serverUrl) return;
		try {
			const p = await createServerPathAtmosphere(options.serverUrl, latitude, longitude,
				{ days: options.serverDays ?? 31, fetch: doFetch });
			if (p.lastError) note('refraction server', p.lastError);
			else if (p.eventCount === 0) notes.push('refraction server: no data for this place (outside its regions?)');
			state.paths = p;
			update('paths');
		} catch (e) { note('refraction server', e); }
	};

	// 3. normals
	const loadNormals = async () => {
		if (state.normals) return;
		/** @type {any} */ let n = null;
		if (options.normalsSource === 'ncei') {
			try { n = await fetchNearestNormals(latitude, longitude, { fetch: doFetch }); }
			catch (e) { note('NOAA normals', e); }
		}
		if (!n) {
			try { n = await fetchOpenMeteoNormals(latitude, longitude, { fetch: doFetch, ...om }); }
			catch (e) { note('Open-Meteo normals', e); }
		}
		if (!n && options.normalsSource !== 'ncei') {                  // last resort in the US
			try { n = await fetchNearestNormals(latitude, longitude, { fetch: doFetch }); }
			catch { /* outside the US, or NCEI unreachable */ }
		}
		if (!n) return;
		state.normals = n;
		update('normals');
	};

	// interim: fetch the single forecast alongside the paths, to show something better than normals
	// while they load. Without it (the default when waiting), it is only fetched if the paths fail.
	const interim = options.interim ?? !options.wait;
	const forecastP = interim || want !== 'path'
		? Promise.all([loadPath(), loadSingle()])
		: loadPath().then(() => (state.path ? undefined : loadSingle()));
	const ready = Promise.all([forecastP, loadPaths(), loadNormals()]).then(() => atm);

	atm = {
		/** set this on the calculator once; it always uses the latest data */
		provider,
		/** which forecast is in use: 'open-meteo-path' (best), 'nws' or 'open-meteo' (single temperature), or null */
		get forecastSource() { return state.path ? 'open-meteo-path' : state.singleSrc; },
		/** true while the single-temperature forecast stands in for path profiles still loading */
		get interim() { return !state.path && !state.pathDone && !!state.single; },
		/** the Open-Meteo model the path profiles use here (and where it hands over), once loaded */
		get model() { return state.path ? { model: state.path.model, fallback: state.path.fallbackModel } : null; },
		get normals() { return state.normals; },
		get forecast() { return state.path ?? state.single; },
		get paths() { return state.paths; },
		/** what could not be used, for logging */
		notes,
		/** resolves (with atm) when every download has finished or failed */
		ready,
		/** re-fetch the forecast and the server's profiles, and retry whatever failed; a failure keeps the previous data */
		async refresh() {
			await Promise.allSettled([
				state.path ? state.path.refresh() : loadPath(),
				state.single ? state.single.refresh() : loadSingle(),
				state.paths ? state.paths.refresh() : loadPaths(),
				loadNormals(),
			]);
			update('refresh');
		},
	};
	if (options.wait) await ready;
	return atm;
}
