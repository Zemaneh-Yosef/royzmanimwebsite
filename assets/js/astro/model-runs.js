// @ts-check
/**
 * When the weather models behind a stored forecast have published a newer run, from Open-Meteo's own record of
 * each model's last run (https://api.open-meteo.com/data/<domain>/static/meta.json: a few hundred bytes, free:
 * not counted against the forecast quota). So a forecast is downloaded again when a run comes out, not on a
 * fixed timer:
 *
 *   NOAA HRRR (US, first 48 h)  every hour        DWD ICON-EU / ICON-D2         every 3 h
 *   NOAA GFS, DWD ICON          every 6 h         Canada's GEM (HRDPS / RDPS)   every 6 h, GDPS every 12 h
 *   CAMS (haze)                 every 12 h        CAMS Europe                   every 24 h
 *
 * A record that has stopped being updated (Open-Meteo's GEM GDPS and RDPS records stopped in May 2026, while the
 * data itself kept coming) can't say when a run is out; for such a model the stored forecast counts as old once
 * the model's update interval has passed since it was fetched. Where no record can be read at all (offline),
 * `fallbackTtlMs` is the age limit.
 */

import { chooseOpenMeteoModel } from './open-meteo-path.js';

const FORECAST_DATA = 'https://api.open-meteo.com/data/';
const AIR_QUALITY_DATA = 'https://air-quality-api.open-meteo.com/data/';
/** A record is read again after this (the run it names is still the newest until then). */
const RECORD_REUSE_MS = 5 * 60 * 1000;
/** A run later than its schedule: check again this often until it is out. */
const LATE_RECHECK_MS = 10 * 60 * 1000;
/** A record whose last run is this many update intervals old (plus a day) has stopped being updated. */
const STALE_INTERVALS = 3;

/** @typedef {{ host: string, domain: string }} Domain */

/** @param {number} lat @param {number} lon @param {number} s @param {number} n @param {number} w @param {number} e */
const inBox = (lat, lon, s, n, w, e) => lat >= s && lat <= n && lon >= w && lon <= e;

/**
 * The model domains a place's path forecast (open-meteo-path.js) comes from: the chosen model's, and GFS's
 * where that model ends.
 * @param {number} lat @param {number} lon
 * @returns {Domain[]}
 */
export function forecastDomains(lat, lon) {
	const model = chooseOpenMeteoModel(lat, lon);
	/** @type {string[]} */
	const names = [];
	// HRRR only where gfs_seamless is the chosen model: as the fallback, GFS serves only days past HRRR's 48 h
	if (model === 'gfs_seamless' && inBox(lat, lon, 21, 53, -135, -60)) names.push('ncep_hrrr_conus');
	const icon = () => {
		names.push('dwd_icon');
		if (inBox(lat, lon, 29.5, 70.5, -23.5, 62.5)) names.push('dwd_icon_eu');
		if (inBox(lat, lon, 43.18, 58.08, -3.94, 20.34)) names.push('dwd_icon_d2');
	};
	if (model === 'icon_seamless') icon();
	else if (model === 'gem_seamless') {
		names.push('cmc_gem_gdps', 'cmc_gem_rdps');
		if (inBox(lat, lon, 39.6, 75, -152, -40.7)) names.push('cmc_gem_hrdps');
	}
	// GFS: the chosen model, or the fallback where the chosen one ends
	names.push('ncep_gfs013', 'ncep_gfs025');
	return [...new Set(names)].map(domain => ({ host: FORECAST_DATA, domain }));
}

/**
 * The domains of the haze forecast (open-meteo-haze.js: CAMS through Open-Meteo's air-quality API, which uses
 * CAMS Europe inside its area).
 * @param {number} lat @param {number} lon
 * @returns {Domain[]}
 */
export function hazeDomains(lat, lon) {
	const out = [{ host: AIR_QUALITY_DATA, domain: 'cams_global' }];
	if (inBox(lat, lon, 30.05, 71.95, -24.95, 44.95)) out.push({ host: AIR_QUALITY_DATA, domain: 'cams_europe' });
	return out;
}

/** @type {Map<string, { at: number, p: Promise<{ availableAt: number, intervalMs: number } | null> }>} */
const records = new Map();

/**
 * A domain's last run: when it became available and how often runs come, or null (unreadable).
 * @param {Domain} d
 */
function lastRun(d) {
	const url = `${d.host}${d.domain}/static/meta.json`;
	const now = Date.now();
	const hit = records.get(url);
	if (hit && now - hit.at < RECORD_REUSE_MS) return hit.p;
	const p = (async () => {
		try {
			const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined;
			// no-cache: revalidated (its ETag), never an old copy from the browser's cache
			const r = await fetch(url, { cache: 'no-cache', signal });
			if (!r.ok) return null;
			const j = await r.json();
			const availableAt = Number(j?.last_run_availability_time) * 1000, intervalMs = Number(j?.update_interval_seconds) * 1000;
			return Number.isFinite(availableAt) && intervalMs > 0 ? { availableAt, intervalMs } : null;
		} catch {
			return null;
		}
	})();
	records.set(url, { at: now, p });
	return p;
}

/**
 * Whether data fetched at `fetchedAt` is still the newest these domains have, and when to look again.
 * @param {Domain[]} domains
 * @param {number} fetchedAt epoch ms
 * @param {number} fallbackTtlMs the age limit when no record can be read
 * @returns {Promise<{ current: boolean, nextCheckAt: number }>}
 *   nextCheckAt: when the next run is due (the earliest of the domains'), or the age limit's end
 */
export async function runState(domains, fetchedAt, fallbackTtlMs) {
	const now = Date.now();
	const runs = await Promise.all(domains.map(lastRun));
	let current = true, nextCheckAt = Infinity, anyRecord = false;
	for (const run of runs) {
		if (!run) continue;
		anyRecord = true;
		const stale = now - run.availableAt > STALE_INTERVALS * run.intervalMs + 86400000;
		if (stale) {
			// no record of its runs: old after one interval
			if (now >= fetchedAt + run.intervalMs) current = false;
			nextCheckAt = Math.min(nextCheckAt, fetchedAt + run.intervalMs);
			continue;
		}
		if (run.availableAt > fetchedAt) current = false;
		const due = run.availableAt + run.intervalMs;
		nextCheckAt = Math.min(nextCheckAt, due > now ? due : now + LATE_RECHECK_MS);
	}
	if (!anyRecord) {
		current = now < fetchedAt + fallbackTtlMs;
		nextCheckAt = fetchedAt + fallbackTtlMs;
	}
	// old already: whoever asked downloads now; the time after that is the next run's
	if (!current && nextCheckAt <= now) nextCheckAt = now + LATE_RECHECK_MS;
	return { current, nextCheckAt };
}
