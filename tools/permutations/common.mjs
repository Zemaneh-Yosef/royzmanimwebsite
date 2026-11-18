// Shared by fetch.mjs and run.mjs: a frozen clock, the recorded-response store, and the site's own modules.
import 'temporal-polyfill/global';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const CACHE = join(HERE, 'cache');
export const SERVER = 'https://hanetz.royzmanim.com/selfhost';
/** Sent to the National Weather Service, which asks every client for one. Generic on purpose. */
export const USER_AGENT = 'royzmanim-permutation-test';

// ── Clock ──
// run.mjs replays each place's downloads with the clock set to when they were made, so every module asks for
// the same URLs and reads "today" the same way. fetch.mjs leaves the clock alone.
const RealDate = Date;
/** @type {number | null} */
let frozen = null;
class FrozenDate extends RealDate {
	constructor(...a) { if (a.length === 0 && frozen !== null) super(frozen); else super(...a); }
	static now() { return frozen ?? RealDate.now(); }
}
globalThis.Date = /** @type {any} */ (FrozenDate);
/** @param {number | null} ms */
export const setClock = (ms) => { frozen = ms; };

// ── Places ──
export const PLACES = JSON.parse(readFileSync(join(HERE, 'places.json'), 'utf8'));
/** @param {string} name */
export const slug = (name) => name.normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

// ── Recorded responses: cache/<place>/<sha1 of URL>.json ──
const keyOf = (/** @type {string} */ url) => createHash('sha1').update(url).digest('hex');
const fileOf = (/** @type {string} */ place, /** @type {string} */ url) => join(CACHE, place, keyOf(url) + '.json');
const KEEP = ['content-type', 'retry-after'];   // not X-RateLimit-*: see recordingFetch

/**
 * fetch that saves every answer (except "over the limit" and "still being computed") for run.mjs.
 * Open-Meteo's X-RateLimit headers are dropped before the site's code sees them: open-meteo-path.js asks for
 * the sea temperatures of all points at once only when the quota looks ample, and that choice changes the
 * URL; without the headers it always does, so the recorded URLs are the ones replay will ask for.
 * @param {string} place @returns {typeof fetch}
 */
export function recordingFetch(place) {
	mkdirSync(join(CACHE, place), { recursive: true });
	return async (input, init = {}) => {
		const url = String(input);
		const headers = { ...(init.headers ?? {}) };
		if (url.includes('weather.gov')) headers['User-Agent'] = USER_AGENT;
		let r;
		try { r = await fetch(url, { ...init, headers }); }
		catch (e) {
			// a failed request is saved too (a later success at the same URL replaces it), so replay meets the same failure
			// the site met instead of an unknown URL
			writeFileSync(fileOf(place, url), JSON.stringify({ url, error: String(e?.cause?.message ?? e?.message ?? e) }));
			throw e;
		}
		const body = await r.text();
		const h = {};
		for (const k of KEEP) { const v = r.headers.get(k); if (v != null) h[k] = v; }
		const pending = r.status === 202 || /"(pending|etaS)"/.test(body.slice(0, 400));
		if (r.status !== 429 && !pending) writeFileSync(fileOf(place, url), JSON.stringify({ url, status: r.status, headers: h, body }));
		return new Response(body, { status: r.status, headers: h });
	};
}

/** fetch that answers only from what fetch.mjs saved; anything else fails like a dead connection. */
export function replayFetch(place) {
	return async (input) => {
		const url = String(input);
		const f = fileOf(place, url);
		if (!existsSync(f)) throw new TypeError(`not recorded: ${url.slice(0, 140)}`);
		const { status, headers, body, error } = JSON.parse(readFileSync(f, 'utf8'));
		if (error !== undefined) throw new TypeError(`failed when fetched: ${error}`);
		return new Response(body, { status, headers });
	};
}

export const manifestPath = (/** @type {string} */ place) => join(CACHE, place, 'manifest.json');
export const readManifest = (/** @type {string} */ place) => existsSync(manifestPath(place)) ? JSON.parse(readFileSync(manifestPath(place), 'utf8')) : null;
export const writeManifest = (/** @type {string} */ place, /** @type {any} */ m) => writeFileSync(manifestPath(place), JSON.stringify(m, null, 1));

// ── The site's modules (imported after the clock is in place) ──
const ASTRO = '../../assets/js/astro/';
export const lib = await import('../../assets/libraries/kosherZmanim/kosher-zmanim.js');
export const { default: ROYSPACalculator, chainProviders, monthlyClimate } = await import(ASTRO + 'royzmanim-spa-corrections.js');
export const { createOpenMeteoPathAtmosphere } = await import(ASTRO + 'open-meteo-path.js');
export const { createOpenMeteoAtmosphere, fetchOpenMeteoNormals, OpenMeteoRateLimitError } = await import(ASTRO + 'open-meteo-atmosphere.js');
export const { createNwsAtmosphere } = await import(ASTRO + 'nws-atmosphere.js');
export const { createServerPathAtmosphere } = await import(ASTRO + 'path-atmosphere.js');
export const { fetchHorizonForArea, HorizonPendingError } = await import(ASTRO + 'horizon-client.js');

/** The options the site passes (refraction-data.js -> auto-atmosphere.js), with humidity and sea temperature
 *  always fetched so both settings can be tried; the calculator ignores what its settings leave off. */
export const OPEN_METEO = { humidity: true, seaSurfaceTemperature: true };
/** The 5-year normals without dew points: humidity doubles their download (and Open-Meteo quota), and it is tested
 *  on the forecasts, where the air is the day's own. */
export const NORMALS_OPTIONS = { humidity: false };
/** Days of the server's profiles fetched: a year and a bit from the fetch date. */
export const SERVER_DAYS = 400;
export const isUS = (/** @type {any} */ p) => p.tz.startsWith('America/') && p.lat > 24 && p.lat < 50 && p.lon < -66 && p.lon > -125
	&& !/Toronto|Montreal|Mexico/.test(p.name);

/** Calendar date (YYYY-MM-DD) at the place at epoch ms. */
export const localDate = (/** @type {number} */ ms, /** @type {string} */ tz) => Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(tz).toPlainDate();
