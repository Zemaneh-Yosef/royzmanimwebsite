// @ts-check
/**
 * refraction-data.js — loads the refraction server's data on the MAIN THREAD and turns it into plain,
 * structured-cloneable values that ROYZmanim.js (and the print workers) can use without network or
 * localStorage.
 *
 *   Web page / print page (main thread, localStorage OK):
 *     const cached = readCachedRefraction(lat, lon);              // instant, for the first render
 *     const ref = await loadRefraction(lat, lon);                 // { provider, horizon, normals, ... }
 *     new ZemanFunctions(geo, { ...config, atmosphereProvider: ref.provider, horizon: ref.horizon });
 *
 *   Print page -> workers (no localStorage, no closures across postMessage):
 *     const table = snapshotProvider(ref.provider, geo, firstDate, days);   // plain JSON
 *     worker.postMessage({ type: 'refraction', table, normals: ref.normals, horizon: ref.horizon });
 *   Worker (import from refraction-snapshot.js, NOT this file, so the forecast modules stay out of it):
 *     const provider = providerFromSnapshot(table, normals);
 *
 * localStorage, per location (the last MAX_LOCATIONS places; older ones are evicted):
 *   - horizon set + monthly normals: kept until evicted (they don't change for a place)
 *   - forecast snapshot: the provider's results for yesterday .. +FORECAST_DAYS, stamped with when it
 *     was fetched. Fresh (< FORECAST_TTL_MS) -> used with no network at all; older but within
 *     FORECAST_MAX_AGE_MS -> shown at once while a fresh one loads (stale-while-revalidate).
 *   - haze (for Tzet by the stars' haze delay, star-nightfall.js): monthly averages + reference (refetched
 *     after HAZE_NORMALS_MAX_AGE_MS), light pollution, and the evening forecast (HAZE_TTL_MS).
 */

import { chainProviders } from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { providerFromNormals, providerFromSnapshot, snapshotProvider, snapshotHasHumidity } from "./refraction-snapshot.js";
import { createAutoAtmosphere } from "../libraries/kosherZmanim/auto-atmosphere.js";
import { createServerPathAtmosphere } from "../libraries/kosherZmanim/path-atmosphere.js";
import { fetchHorizonForArea } from "../libraries/kosherZmanim/horizon-client.js";
import { fetchHazeNormals, fetchHazeForecast } from "../libraries/kosherZmanim/open-meteo-haze.js";
import { fetchLightPollution } from "../libraries/light-pollution-client.js";

/** Root of the refraction server; its API lives under `${REFRACTION_SERVER}/v1/...`. */
export const REFRACTION_SERVER = "https://hanetz.royzmanim.com/selfhost";

/** A forecast younger than this is used as-is: no request. Weather models update every 1-6 h. */
export const FORECAST_TTL_MS = 3 * 60 * 60 * 1000;
/** Older than TTL but younger than this: shown immediately while a fresh forecast loads. */
export const FORECAST_MAX_AGE_MS = 48 * 60 * 60 * 1000;
/** Days stored from yesterday on (Open-Meteo covers ~16, the server's profiles ~31). */
const FORECAST_DAYS = 33;
/** The haze forecast (CAMS, two runs a day) is fetched again after this. */
export const HAZE_TTL_MS = 6 * 60 * 60 * 1000;
/** Monthly haze averages are rebuilt after this (the archive grows by a year). */
const HAZE_NORMALS_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
/** Places kept in localStorage (a vantage horizon set alone can be a few hundred KB). */
const MAX_LOCATIONS = 3;

/** Bump when the cached shape changes, so old entries are ignored. */
const CACHE_VERSION = 2;
/**
 * The server's terrain data generation. Change it whenever the server's elevation sources change
 * (terrain.layers): it is sent with horizon requests (so browsers don't serve a 30-day-old cached copy)
 * and is part of the stored horizon's key (so stored horizons are re-fetched). Forecasts are unaffected.
 */
export const TERRAIN_VERSION = "bare-earth-2"; // 2: + Jerusalem 10 m DTM
const INDEX_KEY = `refraction:v${CACHE_VERSION}:index`;

// Types live in refraction-snapshot.js; aliased here so either module can be imported for them
/** @typedef {import("./refraction-snapshot.js").AtmosphereSpec} AtmosphereSpec */
/** @typedef {import("./refraction-snapshot.js").HorizonSet} HorizonSet */
/** @typedef {import("./refraction-snapshot.js").VisibleOptions} VisibleOptions */
/** @typedef {import("./refraction-snapshot.js").AreaInfo} AreaInfo */
/** @typedef {import("./refraction-snapshot.js").SolarEvent} SolarEvent */
/** @typedef {import("./refraction-snapshot.js").AtmosphereProvider} AtmosphereProvider */
/** @typedef {import("./refraction-snapshot.js").Horizon} Horizon */
/** @typedef {import("./refraction-snapshot.js").Normals} Normals */
/** @typedef {import("./refraction-snapshot.js").ProviderSnapshot} ProviderSnapshot */
/** @typedef {import("../libraries/kosherZmanim/star-nightfall.js").HazeData} HazeData */
/**
 * What is stored for a place's haze.
 * @typedef {{ monthly: number[], reference: number, normalsRange: [string, string], source: string,
 *             normalsFetchedAt: number, blpCdM2: number | null, evenings: Record<string, number>,
 *             forecastFetchedAt: number | null }} StoredHaze
 */

// Re-exported so main-thread code has one import
export { providerFromNormals, snapshotProvider, providerFromSnapshot } from "./refraction-snapshot.js";

/** @typedef {{ fetchedAt: number, table: ProviderSnapshot }} CachedForecast */

/**
 * @typedef {Object} CachedRefraction
 * @property {Horizon | null} horizon
 * @property {Normals | null} normals
 * @property {CachedForecast | null} forecast  null when none, or older than FORECAST_MAX_AGE_MS
 * @property {HazeData | null} haze            null when none stored
 */

/**
 * @typedef {Object} RefractionData
 * @property {AtmosphereProvider} provider  forecast -> server climatology -> monthly normals -> null
 * @property {Horizon | null} horizon        terrain horizon set for visible sunrise (null if unavailable)
 * @property {Normals | null} normals        monthly normals
 * @property {number | null} forecastFetchedAt when the forecast behind `provider` was downloaded (epoch ms);
 *   null = no forecast (normals only). Compare it to tell whether data actually changed.
 * @property {boolean} fromCache            true = no forecast request was made
 * @property {HazeData | null} haze          evening haze + light pollution for nightfall by the stars
 *   (ZemanimConfig.haze); null when it could not be had
 * @property {string[]} notes               what could not be loaded, for logging
 */

// ─── localStorage plumbing ───────────────────────────────────────────────────

/** localStorage, or null where it does not exist / is blocked (workers, private mode, sandboxed iframes). */
function getStorage() {
	try {
		return typeof localStorage !== "undefined" ? localStorage : null;
	} catch {
		return null;
	}
}

/** @param {number} lat @param {number} lon */
const placeId = (lat, lon) => `${lat.toFixed(5)},${lon.toFixed(5)}`;
/** @param {string} id */
const staticKey = (id) => `refraction:v${CACHE_VERSION}:${id}:${TERRAIN_VERSION}`;
/** @param {string} id */
const forecastKey = (id) => `refraction:v${CACHE_VERSION}:${id}:forecast`;
/** @param {string} id */
const hazeKey = (id) => `refraction:v${CACHE_VERSION}:${id}:haze`;

/** @param {Storage} storage @param {string} key */
function readJSON(storage, key) {
	try {
		const raw = storage.getItem(key);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

/** @param {Storage} storage @returns {string[]} most recent first */
function readIndex(storage) {
	const index = readJSON(storage, INDEX_KEY);
	return Array.isArray(index) ? index : [];
}

let swept = false;
/**
 * Once per page: drop entries an older CACHE_VERSION or TERRAIN_VERSION left behind (a stored horizon
 * can be a few hundred KB, and nothing else would ever remove them).
 * @param {Storage} storage
 */
function sweepOldEntries(storage) {
	if (swept) return;
	swept = true;
	try {
		const current = `refraction:v${CACHE_VERSION}:`;
		for (let i = storage.length - 1; i >= 0; i--) {
			const key = storage.key(i);
			if (!key || !/^refraction:v\d+:/.test(key)) continue;
			const stale = !key.startsWith(current)
				|| (!key.endsWith(":forecast") && !key.endsWith(":haze") && key !== INDEX_KEY && !key.endsWith(`:${TERRAIN_VERSION}`));
			if (stale) storage.removeItem(key);
		}
	} catch { /* best-effort */ }
}

/** @param {Storage} storage @param {string} id */
function removePlace(storage, id) {
	try {
		storage.removeItem(staticKey(id));
		storage.removeItem(forecastKey(id));
		storage.removeItem(hazeKey(id));
	} catch { /* nothing to do */ }
}

/**
 * Write, keeping only the last MAX_LOCATIONS places. If the quota is hit, evict the oldest other
 * places and try again; if it still doesn't fit, give up quietly (the data is used for this page anyway).
 * @param {string} id @param {string} key @param {unknown} value
 */
function writeForPlace(id, key, value) {
	const storage = getStorage();
	if (!storage) return;
	sweepOldEntries(storage);

	const index = [id, ...readIndex(storage).filter(other => other !== id)];
	for (const old of index.splice(MAX_LOCATIONS))
		removePlace(storage, old);

	const json = JSON.stringify(value);
	for (;;) {
		try {
			storage.setItem(key, json);
			break;
		} catch {
			const victim = index.length > 1 ? index.pop() : undefined;
			if (!victim) return;
			removePlace(storage, victim);
		}
	}
	try { storage.setItem(INDEX_KEY, JSON.stringify(index)); } catch { /* index is best-effort */ }
}

/**
 * Synchronously read what previous visits stored for this spot. Use it to render instantly.
 * @param {number} lat @param {number} lon
 * @returns {CachedRefraction | null}
 */
export function readCachedRefraction(lat, lon) {
	const storage = getStorage();
	if (!storage) return null;
	const id = placeId(lat, lon);
	const stat = readJSON(storage, staticKey(id));
	/** @type {CachedForecast | null} */
	let forecast = readJSON(storage, forecastKey(id));
	if (!forecast || typeof forecast.fetchedAt !== "number" || !forecast.table
		|| Date.now() - forecast.fetchedAt > FORECAST_MAX_AGE_MS)
		forecast = null;
	const haze = hazeFromStored(readJSON(storage, hazeKey(id)));
	if (!stat && !forecast && !haze) return null;
	return { horizon: stat?.horizon ?? null, normals: stat?.normals ?? null, forecast, haze };
}

/**
 * HazeData from what is stored (the forecast part only while it is under FORECAST_MAX_AGE_MS old).
 * @param {StoredHaze | null} st @returns {HazeData | null}
 */
function hazeFromStored(st) {
	if (!st || !Array.isArray(st.monthly) || st.monthly.length !== 12 || !Number.isFinite(st.reference)) return null;
	const fresh = st.forecastFetchedAt != null && Date.now() - st.forecastFetchedAt < FORECAST_MAX_AGE_MS;
	return {
		monthly: st.monthly, reference: st.reference, normalsRange: st.normalsRange, source: st.source,
		blpCdM2: st.blpCdM2 ?? null,
		evenings: fresh ? st.evenings ?? {} : {},
		forecastFetchedAt: fresh ? st.forecastFetchedAt : null,
	};
}

/**
 * Haze for a place: stored parts reused while fresh, the rest fetched. Never throws.
 * @param {number} lat @param {number} lon @param {string} serverUrl @param {string[]} notes
 * @param {{ force?: boolean, signal?: AbortSignal }} options
 * @returns {Promise<HazeData | null>}
 */
async function loadHaze(lat, lon, serverUrl, notes, options) {
	const storage = getStorage(), id = placeId(lat, lon);
	/** @type {StoredHaze | null} */
	const st = storage ? readJSON(storage, hazeKey(id)) : null;
	const now = Date.now();
	const normalsOk = st && Array.isArray(st.monthly) && now - (st.normalsFetchedAt ?? 0) < HAZE_NORMALS_MAX_AGE_MS;
	const forecastOk = !options.force && st?.forecastFetchedAt != null && now - st.forecastFetchedAt < HAZE_TTL_MS;
	const [normals, evenings, blp] = await Promise.all([
		normalsOk ? null : fetchHazeNormals(lat, lon).catch((/** @type {Error} */ e) => { notes.push(`haze normals: ${e.message}`); return null; }),
		forecastOk ? null : fetchHazeForecast(lat, lon).catch((/** @type {Error} */ e) => { notes.push(`haze forecast: ${e.message}`); return null; }),
		st?.blpCdM2 != null ? null : fetchLightPollution(serverUrl, lat, lon, { signal: options.signal })
			.then(lp => lp.blpCdM2).catch((/** @type {Error} */ e) => { notes.push(`light pollution: ${e.message}`); return null; }),
	]);
	const base = normals ?? (st && Array.isArray(st.monthly) ? st : null);
	if (!base) return null;
	/** @type {StoredHaze} */
	const out = {
		monthly: base.monthly, reference: base.reference, normalsRange: base.normalsRange, source: base.source,
		normalsFetchedAt: normals ? now : /** @type {StoredHaze} */ (st).normalsFetchedAt,
		blpCdM2: blp ?? st?.blpCdM2 ?? null,
		evenings: evenings ?? st?.evenings ?? {},
		forecastFetchedAt: evenings ? now : st?.forecastFetchedAt ?? null,
	};
	if (normals || evenings || blp != null) writeForPlace(id, hazeKey(id), out);
	return hazeFromStored(out);
}

/**
 * The best provider available without network: the stored forecast (falling back to the normals for
 * dates it doesn't cover), else the normals alone, else null.
 * @param {CachedRefraction | null | undefined} cached
 * @returns {AtmosphereProvider | null}
 */
export function providerFromCache(cached) {
	if (!cached) return null;
	if (cached.forecast) return providerFromSnapshot(cached.forecast.table, cached.normals);
	return providerFromNormals(cached.normals);
}

/**
 * Milliseconds until the stored forecast for a place should be re-fetched (0 = now / no forecast).
 * @param {CachedRefraction | null | undefined} cached
 */
export function forecastStaleIn(cached) {
	if (!cached?.forecast) return 0;
	return Math.max(0, cached.forecast.fetchedAt + FORECAST_TTL_MS - Date.now());
}

/** @param {number} lon */
function yesterdayAt(lon) {
	// local date at this longitude, minus a day (the forecast/server ranges start yesterday too)
	// Temporal (natively, unlike some polyfills) requires a whole number of milliseconds
	return Temporal.Instant.fromEpochMilliseconds(Math.round(Date.now() + lon / 15 * 3600000))
		.toZonedDateTimeISO("UTC").toPlainDate().subtract({ days: 1 });
}

/** requestIdleCallback where it exists, else a short timeout. @param {() => void} fn */
const whenIdle = (fn) => (typeof requestIdleCallback === "function" ? requestIdleCallback(() => fn(), { timeout: 5000 }) : setTimeout(fn, 50));

// ─── Loading ─────────────────────────────────────────────────────────────────

/**
 * Load everything for one spot. Main thread only (uses fetch and, when available, localStorage).
 * Never throws for network failures: missing pieces come back null and are listed in `notes`.
 *
 * With a fresh stored forecast (< FORECAST_TTL_MS) no forecast request is made at all.
 *
 * @param {number} lat @param {number} lon
 * @param {{ serverUrl?: string, prefetch?: { from: Temporal.PlainDate, days: number }, force?: boolean, moon?: boolean,
 *           signal?: AbortSignal, humidity?: boolean, haze?: boolean }} [options]
 *   prefetch: also load the server's climatology for this range (e.g. a yearly print). Only the server
 *     is asked for it: a fresh stored forecast still saves the Open-Meteo download.
 *   force: ignore the stored forecast and fetch.
 *   moon: the horizon must include `moon` (the composite moonrise / moonset horizon). A stored horizon
 *     without it is fetched again once; if that fails, the stored one is kept (the sun still has it).
 *   humidity: also fetch dew points / relative humidity (for ZemanimConfig.humidity). A stored forecast
 *     or normals without them are fetched again once; if that fails, the stored ones are used dry.
 *   haze: load the haze data (default true; false skips it and `haze` comes back null).
 * @returns {Promise<RefractionData>}
 */
export async function loadRefraction(lat, lon, options = {}) {
	const serverUrl = options.serverUrl ?? REFRACTION_SERVER;
	const id = placeId(lat, lon);
	const cached = readCachedRefraction(lat, lon);
	const freshForecast = !options.force && cached?.forecast && forecastStaleIn(cached) > 0
		&& (!options.humidity || snapshotHasHumidity(cached.forecast.table)) ? cached.forecast : null;
	// normals stored without dew points are fetched again when humidity is wanted
	const usableNormals = options.humidity && cached?.normals && !cached.normals.sunriseDewC ? null : cached?.normals ?? null;
	/** @type {string[]} */
	const notes = [];
	/** @type {Promise<HazeData | null>} */
	const hazeP = options.haze === false ? Promise.resolve(null)
		: loadHaze(lat, lon, serverUrl, notes, { force: options.force, signal: options.signal });

	/** @type {Promise<Horizon | null>} */
	const horizonP = cached?.horizon && (!options.moon || cached.horizon.moon)
		? Promise.resolve(cached.horizon)
		: fetchHorizonForArea(serverUrl, lat, lon, { signal: options.signal, version: TERRAIN_VERSION, moon: options.moon })
			// a stored sun-only horizon beats none when the moon version can't be had
			.catch((/** @type {Error} */ e) => { notes.push(`horizon: ${e.message}`); return cached?.horizon ?? null; });

	// ── Fresh forecast in storage: no Open-Meteo request ──
	if (freshForecast) {
		const fromStore = providerFromSnapshot(freshForecast.table, null);
		/** @type {AtmosphereProvider | null} */
		let serverPaths = null;
		if (options.prefetch) {
			// a long range (print) still needs the server's climatology past the stored days
			try {
				const paths = await createServerPathAtmosphere(serverUrl, lat, lon, { days: 1 });
				await paths.prefetch(options.prefetch.from, options.prefetch.days);
				if (paths.lastError) notes.push(`refraction server: ${paths.lastError.message}`);
				serverPaths = paths.provider;
			} catch (e) {
				notes.push(`refraction server: ${/** @type {Error} */ (e).message}`);
			}
		}
		const horizon = await horizonP;
		const normals = cached?.normals ?? null;
		if (horizon && horizon !== cached?.horizon)
			writeForPlace(id, staticKey(id), { horizon, normals });

		notes.push(`forecast from storage (${Math.round((Date.now() - freshForecast.fetchedAt) / 60000)} min old)`);
		return {
			provider: chainProviders(fromStore, serverPaths, providerFromNormals(normals)),
			horizon, normals,
			forecastFetchedAt: freshForecast.fetchedAt,
			fromCache: true,
			haze: await hazeP,
			notes
		};
	}

	// ── Fetch ──
	// wait: this page already shows the stored forecast / normals while this runs (resetCalendar), and
	// what follows needs the complete result (snapshot, normals, gotForecast)
	const atm = await createAutoAtmosphere(lat, lon, { serverUrl, normals: usableNormals, wait: true,
		openMeteo: options.humidity ? { humidity: true } : undefined })
		.catch((/** @type {Error} */ e) => { notes.push(`atmosphere: ${e.message}`); return null; });
	const horizon = await horizonP;
	if (atm) notes.push(...atm.notes);

	if (atm && options.prefetch && atm.paths) {
		try {
			await atm.paths.prefetch(options.prefetch.from, options.prefetch.days);
		} catch (e) {
			notes.push(`server prefetch: ${/** @type {Error} */ (e).message}`);
		}
	}

	const normals = atm?.normals ?? cached?.normals ?? null;
	writeForPlace(id, staticKey(id), { horizon, normals });

	const gotForecast = !!(atm?.forecast || atm?.paths?.eventCount);
	const fetchedAt = Date.now();
	/** @type {AtmosphereProvider} */
	const provider = atm?.provider ?? providerFromNormals(normals) ?? (() => null);

	if (gotForecast) {
		// Evaluating ~66 sunrises/sunsets takes a moment; do it after the page has rendered
		whenIdle(() => {
			/** @type {CachedForecast} */
			const forecast = { fetchedAt, table: snapshotProvider(provider, null, yesterdayAt(lon), FORECAST_DAYS) };
			writeForPlace(id, forecastKey(id), forecast);
		});
	} else if (cached?.forecast) {
		// Offline / every source failed: a stored forecast (even past its TTL) beats the normals
		notes.push("forecast download failed; using the stored one");
		return {
			provider: providerFromCache(cached) ?? provider,
			horizon, normals,
			forecastFetchedAt: cached.forecast.fetchedAt,
			fromCache: true,
			haze: await hazeP,
			notes
		};
	}

	return { provider, horizon, normals, forecastFetchedAt: gotForecast ? fetchedAt : null, fromCache: false, haze: await hazeP, notes };
}
