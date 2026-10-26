// @ts-check
/**
 * refraction-data.js — loads the refraction server's data on the MAIN THREAD and turns it into plain,
 * structured-cloneable values that ROYZmanim.js (and the print workers) can use without network or
 * storage.
 *
 *   Web page / print page (main thread):
 *     const cached = await readCachedRefraction(lat, lon);        // from IndexedDB, for the first render
 *     const ref = await loadRefraction(lat, lon);                 // { provider, horizon, normals, ... }
 *     new ZemanFunctions(geo, { ...config, atmosphereProvider: ref.provider, horizon: ref.horizon });
 *
 *   Print page -> workers (no closures across postMessage):
 *     const table = snapshotProvider(ref.provider, geo, firstDate, days);   // plain JSON
 *     worker.postMessage({ type: 'refraction', table, normals: ref.normals, horizon: ref.horizon });
 *   Worker (import from refraction-snapshot.js, NOT this file, so the forecast modules stay out of it):
 *     const provider = providerFromSnapshot(table, normals);
 *
 * IndexedDB (database DB_NAME, one key-value store), per location (the last MAX_LOCATIONS places; older
 * ones are evicted, and more of them if the browser's quota is hit):
 *   - horizon set + monthly normals: kept until evicted (they don't change for a place)
 *   - forecast snapshot: the provider's results for yesterday .. +FORECAST_DAYS, stamped with when it
 *     was fetched. Fresh (< FORECAST_TTL_MS) -> used with no network at all; older but within
 *     FORECAST_MAX_AGE_MS -> shown at once while a fresh one loads (stale-while-revalidate).
 *   - haze (for Tzet by the stars' haze delay, star-nightfall.js): monthly averages + reference (refetched
 *     after HAZE_NORMALS_MAX_AGE_MS), light pollution, and the evening forecast (HAZE_TTL_MS).
 * Settings stay in localStorage (small, and read synchronously before the page renders). This cache used
 * to live there too (capped at 3 places by localStorage's ~5 MB); what a browser still has there is moved
 * into IndexedDB once and removed from localStorage.
 *
 * Every read and write is best-effort: where IndexedDB is missing or blocked (some private modes,
 * sandboxed iframes) reads come back empty and writes do nothing, and the data is fetched each visit.
 */

import { chainProviders } from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { providerFromNormals, providerFromSnapshot, snapshotProvider, snapshotHasHumidity } from "./refraction-snapshot.js";
import { createAutoAtmosphere } from "../libraries/kosherZmanim/auto-atmosphere.js";
import { createServerPathAtmosphere } from "../libraries/kosherZmanim/path-atmosphere.js";
import { fetchOpenMeteoNormals } from "../libraries/kosherZmanim/open-meteo-atmosphere.js";
import { fetchHorizonForArea, fetchTerrainVersion, sameTerrain, terrainOf, HorizonPendingError } from "../libraries/kosherZmanim/horizon-client.js";
import { fetchHazeNormals, fetchHazeForecastBoth, fetchGefsHazeForecastBoth } from "../libraries/kosherZmanim/open-meteo-haze.js";
import { fetchLightPollution } from "../libraries/light-pollution-client.js";

/** Root of the refraction server; its API lives under `${REFRACTION_SERVER}/v1/...`. */
export const REFRACTION_SERVER = "https://hanetz.royzmanim.com/selfhost";

/** A forecast younger than this is used as-is: no request. Weather models update every 1-6 h. */
export const FORECAST_TTL_MS = 3 * 60 * 60 * 1000;
/** Older than TTL but younger than this: shown immediately while a fresh forecast loads. */
export const FORECAST_MAX_AGE_MS = 48 * 60 * 60 * 1000;
/** Days stored from yesterday on (Open-Meteo covers ~16, the server's profiles ~31). */
const FORECAST_DAYS = 33;
/** Days, from today, that the day's own weather reaches (Open-Meteo's forecast). */
export const FORECAST_REACH_DAYS = 16;
/** The haze forecast (CAMS, two runs a day) is fetched again after this. */
export const HAZE_TTL_MS = 6 * 60 * 60 * 1000;
/** The server's AERONET calibration factor is asked again after this. */
const HAZE_CALIBRATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/** Monthly haze averages are rebuilt after this (the archive grows by a year). */
const HAZE_NORMALS_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
/**
 * Places kept (a vantage horizon set alone can be a few hundred KB). IndexedDB's quota is a share of the
 * free disk, so this is about tidiness, not space; a quota error still evicts the oldest places early.
 */
const MAX_LOCATIONS = 30;
/** IndexedDB database and store of the cache. */
const DB_NAME = "royzmanim-refraction";
const DB_VERSION = 1;
const STORE = "entries";
/** Give up on IndexedDB if opening it takes longer than this (an old Safari bug can leave it hanging). */
const DB_OPEN_TIMEOUT_MS = 3000;

/** Bump when the cached shape changes, so old entries are ignored. */
const CACHE_VERSION = 2;
/**
 * The horizon data's generation on this side. The server's terrain no longer needs it: a stored horizon is
 * checked against the server's terrain for its place about once a day (TERRAIN_CHECK_MS, /v1/terrain-version)
 * and downloaded again only where that changed (new elevation sources, or fine near-range terrain turned on
 * where it has data). Change it when stored horizons must be re-fetched everywhere for another reason: it is
 * sent with horizon requests (so browsers don't serve a 30-day-old cached copy) and is part of the stored
 * horizon's key. Forecasts are unaffected.
 */
export const TERRAIN_VERSION = "bare-earth-2"; // 2: + Jerusalem 10 m DTM
/** How often a stored horizon is checked against the server's terrain for its place. */
const TERRAIN_CHECK_MS = 24 * 60 * 60 * 1000;
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
 * @typedef {{ normals: HazeSeries, normalsRange: [string, string], source: string, normalsFetchedAt: number,
 *             blpCdM2: number | null, forecast: HazeSeries | null, forecastFetchedAt: number | null,
 *             forecastSource?: string, aodScale?: number | null, calibratedAt?: number }} StoredHaze
 *   normals / forecast: CAMS's hourly series (open-meteo-haze.js), read at each time's own moment (hazeOn).
 *   Data stored before the series were kept (monthly averages at fixed moments) is fetched again once.
 */
/** @typedef {import("../libraries/kosherZmanim/star-nightfall.js").HazeSeries} HazeSeries */

// Re-exported so main-thread code has one import
export { providerFromNormals, snapshotProvider, providerFromSnapshot } from "./refraction-snapshot.js";

/** @typedef {{ fetchedAt: number, table: ProviderSnapshot }} CachedForecast */

/**
 * @typedef {Object} CachedRefraction
 * @property {Horizon | null} horizon
 * @property {Normals | null} normals
 * @property {CachedForecast | null} forecast  null when none, or older than FORECAST_MAX_AGE_MS
 * @property {HazeData | null} haze            null when none stored
 * @property {number | null} [terrainCheckedAt] when the stored horizon was last found current (epoch ms)
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
 * @property {number | null} [horizonRetryS] the server is still computing this place's first horizon: ask
 *   again in this many seconds (the data is otherwise complete, with the stored horizon or none)
 */

// ─── IndexedDB plumbing ──────────────────────────────────────────────────────

/** @param {number} lat @param {number} lon */
const placeId = (lat, lon) => `${lat.toFixed(5)},${lon.toFixed(5)}`;
/** @param {string} id */
const staticKey = (id) => `refraction:v${CACHE_VERSION}:${id}:${TERRAIN_VERSION}`;
/** @param {string} id */
const forecastKey = (id) => `refraction:v${CACHE_VERSION}:${id}:forecast`;
/** @param {string} id */
const hazeKey = (id) => `refraction:v${CACHE_VERSION}:${id}:haze`;
/**
 * Haze of a reference place (e.g. Jerusalem's average sky, for dawn by the horizon glow): outside the place
 * index, so it never pushes out one of the user's places. Ends in ":haze", so sweepOldEntries keeps it.
 * @param {string} id
 */
const referenceHazeKey = (id) => `refraction:v${CACHE_VERSION}:reference:${id}:haze`;
/** Keys this module ever wrote, in any version (localStorage before, IndexedDB now). */
const OUR_KEY = /^refraction:v\d+:/;

/**
 * Whether a key belongs to an older CACHE_VERSION or TERRAIN_VERSION (a stored horizon can be a few
 * hundred KB, and nothing else would ever remove it).
 * @param {string} key
 */
function isStaleKey(key) {
	return !key.startsWith(`refraction:v${CACHE_VERSION}:`)
		|| (!key.endsWith(":forecast") && !key.endsWith(":haze") && key !== INDEX_KEY && !key.endsWith(`:${TERRAIN_VERSION}`));
}

/**
 * @template T
 * @param {IDBRequest<T>} req
 * @returns {Promise<T>}
 */
const requestDone = (req) => new Promise((resolve, reject) => {
	req.onsuccess = () => resolve(req.result);
	req.onerror = () => reject(req.error);
});

/** @param {IDBTransaction} tx @returns {Promise<void>} */
const transactionDone = (tx) => new Promise((resolve, reject) => {
	tx.oncomplete = () => resolve();
	tx.onabort = tx.onerror = () => reject(tx.error ?? new DOMException("Transaction aborted", "AbortError"));
});

/**
 * Put a value; one that can't be structured-cloned (shouldn't happen: it's all plain data) is stored as
 * its JSON round trip instead, as the localStorage cache did.
 * @param {IDBObjectStore} store @param {string} key @param {unknown} value
 */
function putValue(store, key, value) {
	try {
		store.put(value, key);
	} catch (e) {
		if (/** @type {DOMException} */ (e)?.name !== "DataCloneError") throw e;
		store.put(JSON.parse(JSON.stringify(value)), key);
	}
}

/** @type {Promise<IDBDatabase | null> | null} */
let dbPromise = null;

/**
 * The cache database, opened once per page (and swept / migrated then); null where IndexedDB is missing,
 * blocked, or doesn't answer within DB_OPEN_TIMEOUT_MS.
 * @returns {Promise<IDBDatabase | null>}
 */
function openDB() {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise((/** @type {(db: IDBDatabase | null) => void} */ resolve) => {
		/** @type {IDBOpenDBRequest} */
		let req;
		try {
			if (typeof indexedDB === "undefined") return resolve(null);
			req = indexedDB.open(DB_NAME, DB_VERSION);
		} catch {
			return resolve(null);
		}
		const timer = setTimeout(() => resolve(null), DB_OPEN_TIMEOUT_MS);
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE))
				req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => {
			clearTimeout(timer);
			const db = req.result;
			// a newer version of the page (in another tab) wants to upgrade: step aside, reopen on next use
			db.onversionchange = () => { db.close(); dbPromise = null; };
			resolve(db);
		};
		req.onerror = () => { clearTimeout(timer); resolve(null); };
	}).then(async (db) => {
		if (db) {
			await migrateFromLocalStorage(db).catch(() => { /* best-effort */ });
			await sweepOldEntries(db).catch(() => { /* best-effort */ });
		}
		return db;
	});
	return dbPromise;
}

/**
 * Once: move what the old localStorage cache holds (current-version entries) into IndexedDB, so the
 * places a user already has don't download again, then remove every cache key from localStorage.
 * Entries IndexedDB already has are newer and kept.
 * @param {IDBDatabase} db
 */
async function migrateFromLocalStorage(db) {
	/** @type {Storage | null} */
	let storage = null;
	try { storage = typeof localStorage !== "undefined" ? localStorage : null; } catch { /* blocked */ }
	if (!storage) return;

	/** @type {[string, string | null][]} */
	const entries = [];
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i);
		if (key && OUR_KEY.test(key)) entries.push([key, storage.getItem(key)]);
	}
	if (!entries.length) return;

	const tx = db.transaction(STORE, "readwrite");
	const store = tx.objectStore(STORE);
	const done = transactionDone(tx);
	for (const [key, raw] of entries) {
		if (!raw || isStaleKey(key)) continue;
		/** @type {unknown} */
		let value;
		try { value = JSON.parse(raw); } catch { continue; }
		const has = store.getKey(key);
		has.onsuccess = () => {
			if (has.result === undefined) putValue(store, key, value);
		};
	}
	try {
		await done;
	} catch {
		return; // e.g. quota: leave localStorage as it is and try again next page
	}
	for (const [key] of entries)
		try { storage.removeItem(key); } catch { /* nothing to do */ }
}

/**
 * Once per page: drop entries an older CACHE_VERSION or TERRAIN_VERSION left behind.
 * @param {IDBDatabase} db
 */
async function sweepOldEntries(db) {
	const tx = db.transaction(STORE, "readwrite");
	const store = tx.objectStore(STORE);
	const done = transactionDone(tx);
	const keys = store.getAllKeys();
	keys.onsuccess = () => {
		for (const key of keys.result)
			if (typeof key === "string" && OUR_KEY.test(key) && isStaleKey(key))
				store.delete(key);
	};
	await done;
}

/**
 * Read several keys in one transaction. Missing keys, and every key when the database can't be used,
 * come back null.
 * @param {string[]} keys
 * @returns {Promise<any[]>}
 */
async function readMany(keys) {
	const db = await openDB();
	if (!db) return keys.map(() => null);
	try {
		const store = db.transaction(STORE, "readonly").objectStore(STORE);
		const values = await Promise.all(keys.map(key => requestDone(store.get(key))));
		return values.map(v => v ?? null);
	} catch {
		return keys.map(() => null);
	}
}

/** @param {string} key */
const readOne = async (key) => (await readMany([key]))[0];

/** @param {IDBObjectStore} store @param {string} id */
function removePlace(store, id) {
	store.delete(staticKey(id));
	store.delete(forecastKey(id));
	store.delete(hazeKey(id));
}

/** Writes run one after another, so two of them never update the place index from the same old copy. */
let writeQueue = Promise.resolve();

/**
 * Write, keeping only the last MAX_LOCATIONS places. If the quota is hit, keep fewer of the older
 * places and try again; if even this place alone doesn't fit, give up quietly (the data is used for this
 * page anyway). Never rejects.
 * @param {string} id @param {string} key @param {unknown} value
 * @returns {Promise<void>}
 */
function writeForPlace(id, key, value) {
	const run = writeQueue.then(() => writeForPlaceNow(id, key, value)).catch(() => { /* best-effort */ });
	writeQueue = run;
	return run;
}

/** @param {string} id @param {string} key @param {unknown} value */
async function writeForPlaceNow(id, key, value) {
	const db = await openDB();
	if (!db) return;

	let keep = MAX_LOCATIONS;
	for (;;) {
		let placesBefore = 0;
		const tx = db.transaction(STORE, "readwrite");
		const store = tx.objectStore(STORE);
		const done = transactionDone(tx);
		// callbacks, not await, inside the transaction: it must not see an empty event loop turn
		const indexReq = store.get(INDEX_KEY);
		indexReq.onsuccess = () => {
			/** @type {string[]} */
			const old = Array.isArray(indexReq.result) ? indexReq.result : [];
			const index = [id, ...old.filter(other => other !== id)];
			placesBefore = index.length;
			for (const evicted of index.splice(keep))
				removePlace(store, evicted);
			putValue(store, key, value);
			store.put(index, INDEX_KEY);
		};
		try {
			await done;
			return;
		} catch (e) {
			if (/** @type {DOMException} */ (e)?.name !== "QuotaExceededError") return;
			keep = Math.min(keep, placesBefore) - 1;
			if (keep < 1) return;
		}
	}
}

/**
 * Write a reference place's entry (outside the place index). Never rejects.
 * @param {string} key @param {unknown} value
 */
function writeReference(key, value) {
	const run = writeQueue.then(async () => {
		const db = await openDB();
		if (!db) return;
		const tx = db.transaction(STORE, "readwrite");
		const done = transactionDone(tx);
		putValue(tx.objectStore(STORE), key, value);
		await done;
	}).catch(() => { /* used for this page anyway */ });
	writeQueue = run;
	return run;
}

/**
 * Read what previous visits stored for this spot. Use it to render before anything is fetched.
 * @param {number} lat @param {number} lon
 * @returns {Promise<CachedRefraction | null>}
 */
export async function readCachedRefraction(lat, lon) {
	const id = placeId(lat, lon);
	const [stat, storedForecast, storedHaze] = await readMany([staticKey(id), forecastKey(id), hazeKey(id)]);
	/** @type {CachedForecast | null} */
	let forecast = storedForecast;
	if (!forecast || typeof forecast.fetchedAt !== "number" || !forecast.table
		|| Date.now() - forecast.fetchedAt > FORECAST_MAX_AGE_MS)
		forecast = null;
	const haze = hazeFromStored(storedHaze);
	if (!stat && !forecast && !haze) return null;
	return { horizon: stat?.horizon ?? null, normals: stat?.normals ?? null, forecast, haze,
		terrainCheckedAt: stat?.terrainCheckedAt ?? null };
}

/**
 * HazeData from what is stored (the forecast part only while it is under FORECAST_MAX_AGE_MS old).
 * @param {StoredHaze | null} st @returns {HazeData | null}
 */
function hazeFromStored(st) {
	if (!st || !st.normals?.aod?.length) return null;
	const fresh = st.forecastFetchedAt != null && Date.now() - st.forecastFetchedAt < FORECAST_MAX_AGE_MS;
	return {
		normals: st.normals, normalsRange: st.normalsRange, source: st.source,
		blpCdM2: st.blpCdM2 ?? null,
		forecast: fresh ? st.forecast ?? null : null,
		forecastFetchedAt: fresh ? st.forecastFetchedAt : null,
		...(fresh && st.forecastSource ? { forecastSource: st.forecastSource } : {}),
		...(Number.isFinite(st.aodScale) ? { aodScale: /** @type {number} */ (st.aodScale) } : {}),
	};
}

/**
 * The refraction server's AERONET calibration of CAMS at a place (/v1/haze-calibration): the factor, 1
 * where no station is near.
 * @param {string} serverUrl @param {number} lat @param {number} lon @param {AbortSignal} [signal]
 * @returns {Promise<number>}
 */
async function fetchHazeCalibration(serverUrl, lat, lon, signal) {
	const r = await fetch(`${serverUrl}/v1/haze-calibration?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, { signal });
	if (!r.ok) throw new Error(`HTTP ${r.status}`);
	const j = await r.json();
	if (!Number.isFinite(j?.factor) || j.factor <= 0) throw new Error("no factor in the answer");
	return j.factor;
}

/**
 * Haze for a place: stored parts reused while fresh, the rest fetched. Never throws.
 * @param {number} lat @param {number} lon @param {string} serverUrl @param {string[]} notes
 * @param {{ force?: boolean, signal?: AbortSignal, reference?: boolean }} options
 *   reference: a reference place (loadReferenceHaze): normals and calibration only - no forecast, no light
 *   pollution - stored outside the place index.
 * @returns {Promise<HazeData | null>}
 */
async function loadHaze(lat, lon, serverUrl, notes, options) {
	const id = placeId(lat, lon);
	const key = options.reference ? referenceHazeKey(id) : hazeKey(id);
	/** @type {StoredHaze | null} */
	const st = await readOne(key);
	const now = Date.now();
	// haze stored before the hourly series were kept is fetched again once
	const normalsOk = st && st.normals?.aod?.length && now - (st.normalsFetchedAt ?? 0) < HAZE_NORMALS_MAX_AGE_MS;
	const forecastOk = options.reference || (!options.force && st?.forecastFetchedAt != null && now - st.forecastFetchedAt < HAZE_TTL_MS
		&& st.forecast !== undefined);
	const calibrationOk = st?.calibratedAt != null && now - st.calibratedAt < HAZE_CALIBRATION_MAX_AGE_MS;
	const [normals, fc, blp, scale] = await Promise.all([
		normalsOk ? null : fetchHazeNormals(lat, lon).catch((/** @type {Error} */ e) => { notes.push(`haze normals: ${e.message}`); return null; }),
		forecastOk ? null : fetchHazeForecastBoth(lat, lon)
			.then(ev => ({ ev, src: "cams" }))
			// Open-Meteo down: NOAA's GEFS-Aerosols forecast instead
			.catch((/** @type {Error} */ e) => {
				notes.push(`haze forecast (Open-Meteo): ${e.message}`);
				return fetchGefsHazeForecastBoth(lat, lon).then(ev => ({ ev, src: "gefs" }));
			})
			.catch((/** @type {Error} */ e) => { notes.push(`haze forecast (NOAA GEFS-Aerosols): ${e.message}`); return null; }),
		options.reference || st?.blpCdM2 != null ? null : fetchLightPollution(serverUrl, lat, lon, { signal: options.signal })
			.then(lp => lp.blpCdM2).catch((/** @type {Error} */ e) => { notes.push(`light pollution: ${e.message}`); return null; }),
		calibrationOk ? null : fetchHazeCalibration(serverUrl, lat, lon, options.signal)
			.catch((/** @type {Error} */ e) => { notes.push(`haze calibration: ${e.message}`); return null; }),
	]);
	const base = normals ?? (st?.normals?.aod?.length ? st : null);
	if (!base) return null;
	/** @type {StoredHaze} */
	const out = {
		normals: base.normals, normalsRange: base.normalsRange, source: base.source,
		normalsFetchedAt: normals ? now : /** @type {StoredHaze} */ (st).normalsFetchedAt,
		blpCdM2: blp ?? st?.blpCdM2 ?? null,
		forecast: fc?.ev ?? st?.forecast ?? null,
		forecastFetchedAt: fc ? now : st?.forecastFetchedAt ?? null,
		forecastSource: fc?.src ?? st?.forecastSource,
		aodScale: scale ?? st?.aodScale ?? null,
		// a failed ask is retried on the next load; an answer is kept for HAZE_CALIBRATION_MAX_AGE_MS
		calibratedAt: scale != null ? now : st?.calibratedAt,
	};
	if (normals || fc || blp != null || scale != null) {
		// not awaited: the page uses `out` now, storing it can finish in the background
		if (!options.reference) writeForPlace(id, key, out);
		else writeReference(key, out);
	}
	return hazeFromStored(out);
}

/**
 * The average haze of a reference place (monthly evening / morning normals and the AERONET calibration; no
 * forecast): e.g. Jerusalem's, the sky dawn by the horizon glow is measured against (horizon-glow.js).
 * Stored apart from the user's places and refreshed as their normals are (yearly). Never throws.
 * @param {number} lat @param {number} lon
 * @param {{ serverUrl?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<HazeData | null>}
 */
export async function loadReferenceHaze(lat, lon, options = {}) {
	/** @type {string[]} */
	const notes = [];
	const haze = await loadHaze(lat, lon, options.serverUrl ?? REFRACTION_SERVER, notes, { reference: true, signal: options.signal });
	if (notes.length) console.info("Reference haze:", notes);
	return haze;
}

/**
 * The stored average haze of a reference place (null until loadReferenceHaze has stored it).
 * @param {number} lat @param {number} lon @returns {Promise<HazeData | null>}
 */
export async function readCachedReferenceHaze(lat, lon) {
	return hazeFromStored(await readOne(referenceHazeKey(placeId(lat, lon))));
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

/**
 * Whether a printed range runs past the day's own weather (FORECAST_REACH_DAYS from today). Such a print
 * uses typical air on every day (loadRefraction's `typical`), so its times have no step where the forecast
 * ends; a print within the forecast keeps the forecast.
 * @param {Temporal.PlainDate} last last printed date (any calendar) @param {number} lon
 */
export function printNeedsTypicalAir(last, lon) {
	const lastForecastDay = yesterdayAt(lon).add({ days: FORECAST_REACH_DAYS });
	return Temporal.PlainDate.compare(last.withCalendar("iso8601"), lastForecastDay) > 0;
}

/** requestIdleCallback where it exists, else a short timeout. @param {() => void} fn */
const whenIdle = (fn) => (typeof requestIdleCallback === "function" ? requestIdleCallback(() => fn(), { timeout: 5000 }) : setTimeout(fn, 50));

// ─── Loading ─────────────────────────────────────────────────────────────────

/**
 * Load everything for one spot. Main thread only (uses fetch and, when available, IndexedDB).
 * Never throws for network failures: missing pieces come back null and are listed in `notes`.
 *
 * With a fresh stored forecast (< FORECAST_TTL_MS) no forecast request is made at all.
 *
 * @param {number} lat @param {number} lon
 * @param {{ serverUrl?: string, prefetch?: { from: Temporal.PlainDate, days: number }, force?: boolean, moon?: boolean,
 *           signal?: AbortSignal, humidity?: boolean, haze?: boolean, typical?: boolean }} [options]
 *   prefetch: also load the server's climatology for this range (e.g. a yearly print). Only the server
 *     is asked for it: a fresh stored forecast still saves the Open-Meteo download.
 *   force: ignore the stored forecast and fetch.
 *   moon: the horizon must include `moon` (the composite moonrise / moonset horizon). A stored horizon
 *     without it is fetched again once; if that fails, the stored one is kept (the sun still has it).
 *   humidity: also fetch dew points / relative humidity (for ZemanimConfig.humidity). A stored forecast
 *     or normals without them are fetched again once; if that fails, the stored ones are used dry.
 *   haze: load the haze data (default true; false skips it and `haze` comes back null).
 *   typical: typical air only - the server's climatology, then the monthly normals - with no forecast, for a
 *     print that runs past the forecast (printNeedsTypicalAir), so all its days use the same kind of air.
 * @returns {Promise<RefractionData>}
 */
export async function loadRefraction(lat, lon, options = {}) {
	const serverUrl = options.serverUrl ?? REFRACTION_SERVER;
	const id = placeId(lat, lon);
	const cached = await readCachedRefraction(lat, lon);
	const freshForecast = !options.force && cached?.forecast && forecastStaleIn(cached) > 0
		&& (!options.humidity || snapshotHasHumidity(cached.forecast.table)) ? cached.forecast : null;
	// normals stored without dew points are fetched again when humidity is wanted
	const usableNormals = options.humidity && cached?.normals && !cached.normals.sunriseDewC ? null : cached?.normals ?? null;
	/** @type {string[]} */
	const notes = [];
	/** @type {Promise<HazeData | null>} */
	const hazeP = options.haze === false ? Promise.resolve(null)
		: loadHaze(lat, lon, serverUrl, notes, { force: options.force, signal: options.signal });

	// The stored horizon, checked about once a day against the server's terrain for this place and
	// downloaded again only where that changed
	const stored = cached?.horizon && (!options.moon || cached.horizon.moon) ? cached.horizon : null;
	let terrainCheckedAt = cached?.terrainCheckedAt ?? null;
	/** @type {number | null} */
	let horizonRetryS = null;
	/** @param {string} version @returns {Promise<Horizon>} */
	const fetchHorizon = (version) => fetchHorizonForArea(serverUrl, lat, lon, { signal: options.signal, version, moon: options.moon })
		.then(h => { terrainCheckedAt = Date.now(); return h; });
	/** @type {Promise<Horizon | null>} */
	const horizonP = (!stored
		? fetchHorizon(TERRAIN_VERSION)
		: !options.force && terrainCheckedAt !== null && Date.now() - terrainCheckedAt < TERRAIN_CHECK_MS
			? Promise.resolve(stored)
			: /** @type {Promise<Horizon>} */ (fetchTerrainVersion(serverUrl, lat, lon, { area: true, signal: options.signal, moon: options.moon })
				.then(/** @returns {Horizon | Promise<Horizon>} */ now => {
					if (sameTerrain(now, terrainOf(stored))) {
						terrainCheckedAt = Date.now();
						return stored;
					}
					notes.push("terrain changed here: horizon downloaded again");
					// a new URL, so the browser's cached copy of the old one isn't used
					return fetchHorizon(`${TERRAIN_VERSION}.${now.layers ?? "-"}.${now.fine ?? "-"}`);
				})))
		// a stored (or sun-only) horizon beats none when a new one can't be had; checked again next time
		.catch((/** @type {Error} */ e) => {
			notes.push(`horizon: ${e.message}`);
			// a place's first horizon, still being computed on the server: the caller asks again then
			if (e instanceof HorizonPendingError) horizonRetryS = e.retryAfterS;
			return cached?.horizon ?? null;
		});

	// ── Typical air only (a print that runs past the forecast): the server's climatology, then the normals ──
	if (options.typical) {
		/** @type {AtmosphereProvider | null} */
		let serverPaths = null;
		try {
			const paths = await createServerPathAtmosphere(serverUrl, lat, lon, { days: 1, typical: true });
			if (options.prefetch) await paths.prefetch(options.prefetch.from, options.prefetch.days);
			if (paths.lastError) notes.push(`refraction server: ${paths.lastError.message}`);
			serverPaths = paths.provider;
		} catch (e) {
			notes.push(`refraction server: ${/** @type {Error} */ (e).message}`);
		}
		let normals = usableNormals;
		if (!normals) {
			try {
				normals = await fetchOpenMeteoNormals(lat, lon, { humidity: options.humidity });
			} catch (e) {
				notes.push(`normals: ${/** @type {Error} */ (e).message}`);
			}
		}
		const horizon = await horizonP;
		writeForPlace(id, staticKey(id), { horizon, normals, terrainCheckedAt });
		notes.push("typical air only (the printed range runs past the forecast)");
		return {
			provider: chainProviders(serverPaths, providerFromNormals(normals)),
			horizon, normals, forecastFetchedAt: null, fromCache: false, haze: await hazeP, notes, horizonRetryS
		};
	}

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
		if (horizon && (horizon !== cached?.horizon || terrainCheckedAt !== (cached?.terrainCheckedAt ?? null)))
			writeForPlace(id, staticKey(id), { horizon, normals, terrainCheckedAt });

		notes.push(`forecast from storage (${Math.round((Date.now() - freshForecast.fetchedAt) / 60000)} min old)`);
		return {
			provider: chainProviders(fromStore, serverPaths, providerFromNormals(normals)),
			horizon, normals,
			forecastFetchedAt: freshForecast.fetchedAt,
			fromCache: true,
			haze: await hazeP,
			notes,
			horizonRetryS
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
	writeForPlace(id, staticKey(id), { horizon, normals, terrainCheckedAt });

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
			notes,
			horizonRetryS
		};
	}

	return { provider, horizon, normals, forecastFetchedAt: gotForecast ? fetchedAt : null, fromCache: false, haze: await hazeP, notes, horizonRetryS };
}
