// @ts-check
/**
 * open-meteo-path.js
 *
 * The air along the whole line of sight, straight from the browser: for each sunrise and sunset in
 * the next 16 days, model temperature profiles (2 m plus pressure levels up to 700 mb, ~3 km) at
 * 0, 10, 25, 50, 100, 150, 200, 300 and 400 km along the Sun's direction, with the sea-surface
 * temperature where the path crosses the sea. Worldwide, no API key, no server: Open-Meteo
 * (open-meteo.com) serves the latest runs of the national weather models.
 *
 *     import { createOpenMeteoPathAtmosphere } from "./open-meteo-path.js";
 *     const om = await createOpenMeteoPathAtmosphere(lat, lon);
 *     calc.setAtmosphereProvider(chainProviders(om.provider, monthlyClimate(normals)));
 *     // later, e.g. every 3-6 hours (models run every 1-6 h):  await om.refresh();
 *
 * Which model. Refraction depends on how temperature changes from the ground up, so every profile
 * must come from one model. Open-Meteo's default ("best_match") does not guarantee that: checked
 * against the live API (October 2026), outside the area of NOAA's HRRR it takes the 2 m temperature
 * from ECMWF and the levels above from ICON or GFS (Edmonton, Anchorage, Honolulu, Sinai from day 0;
 * Israel from day 7.8). So the model is chosen by place (chooseOpenMeteoModel, MODEL_REGIONS):
 *   Israel and its neighbours  icon_seamless (DWD ICON-EU 7 km to ~5 days, ICON global to ~7.5)
 *   Canada                     gem_seamless (Canada's GEM: HRDPS 2.5 km ~2 days, RDPS 10 km ~4,
 *                              global 15 km to 10; extra levels 1015 / 985 / 970 / 875 mb)
 *   Europe                     best_match (Open-Meteo's European models; not yet checked level by level)
 *   everywhere else            gfs_seamless (NOAA HRRR 3 km where it reaches, ~2.3 days, then GFS;
 *                              in the US this is exactly what best_match returns)
 * Where the chosen model ends (or lacks a level for an event), the whole path for that event comes
 * from gfs_seamless instead, which reaches 16 days: never a mix within one sunrise or sunset.
 * Override with options.models (one Open-Meteo model name, 'best_match', or 'auto').
 *
 * This is the same information the refraction-server builds from GFS, from better models, and needs
 * nothing of yours. It covers the forecast range only; for later dates chain a climatology after it.
 *
 * Humidity (options.humidity, off by default): also the 2 m dew point and the relative humidity at each
 * level, for a calculator with setHumidity(true) (water vapour in the refractivity; at most a few
 * seconds). About 50% more data per refresh, so ask for it only when it is used.
 *
 * Cost per refresh: two or three requests (forecast for 33 points from the chosen model and from GFS,
 * marine for the sea points); 2-4 MB of JSON (less with compression), roughly 70-140 "calls" of
 * Open-Meteo's free quota of 10,000 a day per user. A model Open-Meteo has not served for a while can
 * take 30-50 s to answer the first time (seen live); give the request a long timeout (60 s) and run
 * it in the background (auto-atmosphere.js does both). Terms: non-commercial use; credit
 * "Weather data by Open-Meteo.com" (CC BY 4.0).
 */

import { getOpenMeteoJson } from './open-meteo-atmosphere.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const DEG = Math.PI / 180;
const R_EARTH = 6371008.8;

export const DEFAULT_DISTANCES_KM = [0, 10, 25, 50, 100, 150, 200, 300, 400];
// Pressure levels used. Above 700 mb (~3 km) the calculator uses the standard atmosphere; rays at the
// horizon spend almost all of their bending below that.
export const DEFAULT_LEVELS_MB = [1000, 975, 950, 925, 900, 850, 800, 700];
/** Canada's GEM has no 975 mb level but more near the ground, where dawn inversions sit. */
export const GEM_LEVELS_MB = [1015, 1000, 985, 970, 950, 925, 900, 875, 850, 800, 700];
/** Model used where the chosen one ends: consistent at every level for 16 days, everywhere. */
export const FALLBACK_MODEL = 'gfs_seamless';

/**
 * Canada, as a rough outline (lon, lat): the US border to within ~20 km, then the Arctic and the
 * Davis Strait. Near the border either model is fine; the point is to keep Canada on Canada's model.
 */
const CANADA = [
	[-141, 84], [-141, 60.3], [-139, 60], [-137.5, 59], [-135.5, 59.8], [-133.4, 58.4], [-131, 56],
	[-130, 55.3], [-130.6, 54.7], [-128, 52], [-125, 48.4], [-123.25, 48.25], [-123.2, 48.75],
	[-123, 49], [-95.15, 49], [-95.15, 49.38], [-94.6, 48.7], [-93, 48.6], [-90.8, 48.2], [-89.4, 48],
	[-88.3, 48.3], [-84.8, 46.9], [-84.4, 46.5], [-84, 46.2], [-83.5, 46], [-82.4, 45.3], [-82.42, 43],
	[-82.5, 42.6], [-82.9, 42.35], [-83.06, 42.31], [-83.13, 42.2], [-83.15, 42.05], [-82.5, 41.7], [-81, 42.25], [-79.8, 42.5], [-78.9, 42.9], [-79.05, 43.2],
	[-79.2, 43.45], [-78, 43.6], [-76.8, 43.6], [-76.3, 44.2], [-75.4, 44.8], [-74.7, 45], [-71.5, 45],
	[-71.1, 45.3], [-70.6, 45.5], [-70.2, 46.2], [-70, 46.7], [-69.2, 47.45], [-68.3, 47.35],
	[-67.8, 47.07], [-67.8, 45.7], [-67.4, 45.6], [-67, 44.9], [-66.5, 44], [-60, 41], [-50, 45],
	[-52, 60], [-64, 60.5], [-73, 76], [-60, 82.5], [-60, 84],
];

/** @param {number} lat @param {number} lon @param {number[][]} poly ray casting */
function inPolygon(lat, lon, poly) {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i], [xj, yj] = poly[j];
		if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}

/**
 * Where each model is used, first match wins; edit or replace to suit (e.g. after checking a region
 * with check-open-meteo-models.mjs).
 * @type {{ name: string, model: string, test: (lat: number, lon: number) => boolean }[]}
 */
export const MODEL_REGIONS = [
	{ name: 'Israel and neighbours', model: 'icon_seamless', test: (lat, lon) => lat >= 29 && lat <= 34.8 && lon >= 33 && lon <= 36.8 },
	{ name: 'Canada', model: 'gem_seamless', test: (lat, lon) => inPolygon(lat, lon, CANADA) },
	{ name: 'Europe (ICON-EU area)', model: 'best_match', test: (lat, lon) => lat >= 29.5 && lat <= 70.5 && lon >= -23.5 && lon <= 62.5 },
];

/**
 * The Open-Meteo model to use for an observer (see the header).
 * @param {number} latitude @param {number} longitude @returns {string}
 */
export function chooseOpenMeteoModel(latitude, longitude) {
	return MODEL_REGIONS.find(r => r.test(latitude, longitude))?.model ?? FALLBACK_MODEL;
}

/**
 * @typedef {import('./royzmanim-spa-corrections.js').PathProfile} PathProfile
 * @typedef {{ times: number[], cols: Record<string, (number | null)[]>, elevation: number, levels: number[] }} Series
 *   levels: the pressure levels this series actually has (any value at all)
 */

/**
 * Point at distance dM along azimuth azDeg (great circle).
 * @param {number} lat @param {number} lon @param {number} azDeg @param {number} dM @returns {[number, number]}
 */
function destination(lat, lon, azDeg, dM) {
	const d = dM / R_EARTH, p1 = lat * DEG, l1 = lon * DEG, a = azDeg * DEG;
	const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(a));
	const l2 = l1 + Math.atan2(Math.sin(a) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
	return [p2 / DEG, ((l2 / DEG + 540) % 360) - 180];
}

/** Solar declination (deg), low precision. @param {number} ms epoch ms */
function declination(ms) {
	const n = ms / 86400000 - 10957.5;                        // days from J2000
	const g = (357.529 + 0.98560028 * n) * DEG;
	const q = 280.459 + 0.98564736 * n;
	const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
	return Math.asin(Math.sin(23.439 * DEG) * Math.sin(L)) / DEG;
}

/**
 * Azimuth of sunrise / sunset (deg east of north), to ~0.5 deg: enough to place the profiles.
 * @param {number} lat @param {number} ms epoch ms near the event @param {'sunrise'|'sunset'} event
 */
export function eventAzimuth(lat, ms, event) {
	const c = Math.max(-1, Math.min(1, Math.sin(declination(ms) * DEG) / Math.cos(lat * DEG)));
	const a = Math.acos(c) / DEG;
	return event === 'sunrise' ? a : 360 - a;
}

/**
 * Rough sunrise / sunset time (epoch ms) of a date at a place; NaN if the Sun doesn't rise or set.
 * @param {{year:number, month:number, day:number}} date @param {number} lat @param {number} lon
 * @param {'sunrise'|'sunset'} event
 */
export function eventTime(date, lat, lon, event) {
	const noon = Date.UTC(date.year, date.month - 1, date.day, 12) - lon / 15 * 3600000;
	const dec = declination(noon) * DEG;
	const cosH = (Math.sin(-0.833 * DEG) - Math.sin(lat * DEG) * Math.sin(dec)) / (Math.cos(lat * DEG) * Math.cos(dec));
	if (cosH < -1 || cosH > 1) return NaN;
	const H = Math.acos(cosH) / DEG;
	return noon + (event === 'sunrise' ? -H : H) / 15 * 3600000;   // equation of time ignored (< 17 min)
}

/** value of an hourly column at time t (epoch ms), linear; NaN outside or at gaps */
function at(/** @type {Series} */ s, /** @type {string} */ name, /** @type {number} */ t) {
	const col = s.cols[name], ts = s.times;
	if (!col || !ts.length) return NaN;
	const x = (t / 1000 - ts[0]) / 3600;
	if (x < 0 || x > ts.length - 1) return NaN;
	const i = Math.min(Math.floor(x), ts.length - 2), f = x - i;
	const a = col[i], b = col[i + 1];
	if (a == null || b == null) return f < 0.5 ? (a ?? NaN) : (b ?? NaN);
	return a + (b - a) * f;
}

/** @param {any} json @param {number[]} levels @returns {Series[]} */
function toSeries(json, levels = []) {
	const arr = Array.isArray(json) ? json : [json];
	return arr.map(j => {
		const cols = j?.hourly ?? {};
		const has = (/** @type {string} */ k) => (cols[k] ?? []).some((/** @type {any} */ v) => v != null);
		return {
			times: cols.time ?? [], cols, elevation: j?.elevation,
			levels: levels.filter(p => has(`temperature_${p}hPa`) && has(`geopotential_height_${p}hPa`)),
		};
	});
}

/**
 * @param {number} latitude @param {number} longitude
 * @param {{ days?: number, distancesKm?: number[], levelsMb?: number[], fetch?: typeof fetch,
 *           forecastUrl?: string, marineUrl?: string, extraParams?: string, models?: string,
 *           fallbackModel?: string | null, retries?: number, humidity?: boolean }} [options]
 *   days: forecast days (default 16, Open-Meteo's maximum).
 *   models: 'auto' (default: chooseOpenMeteoModel), 'best_match', or one Open-Meteo model name.
 *   fallbackModel: used where the chosen model ends (default 'gfs_seamless'; null = none).
 *   levelsMb: pressure levels (default GEM_LEVELS_MB for GEM, else DEFAULT_LEVELS_MB).
 *   retries: retries of a failed request (default 1; see getOpenMeteoJson).
 *   humidity: also fetch dew point / relative humidity (see the header; default false).
 *   forecastUrl / marineUrl / extraParams: e.g. a paid endpoint and "&apikey=...".
 */
export async function createOpenMeteoPathAtmosphere(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const days = Math.max(1, Math.min(options.days ?? 16, 16));
	const dists = options.distancesKm ?? DEFAULT_DISTANCES_KM;
	const model = !options.models || options.models === 'auto' ? chooseOpenMeteoModel(latitude, longitude) : options.models;
	// best_match always reaches 16 days, so it needs no fallback (and gets none)
	const fallback = options.fallbackModel === undefined ? FALLBACK_MODEL : options.fallbackModel;
	const fbModel = fallback && fallback !== model && model !== 'best_match' ? fallback : null;
	const levelsFor = (/** @type {string} */ m) => options.levelsMb ?? (/^(cmc_)?gem/.test(m) ? GEM_LEVELS_MB : DEFAULT_LEVELS_MB);
	const json = { retries: options.retries ?? 1 };

	/** @type {{ event: 'sunrise'|'sunset', az: number, idx: number[] }[]} fans of points by azimuth */
	let fans = [];
	/** @type {Series[]} chosen model */ let fc = [];
	/** @type {Series[]} fallback model (empty if none / failed) */ let fb = [];
	/** @type {Map<number, Series>} marine series by point index */ let marine = new Map();
	/** @type {Map<string, { path: PathProfile[], key: string } | null>} */ let built = new Map();
	/** @type {Map<string, string>} model used per event */ let usedModel = new Map();
	let stamp = '';
	/** @type {{ start: number, end: number } | null} */ let coverage = null;
	/** @type {Error | null} */ let lastError = null;

	const refresh = async () => {
		// two azimuths per event, at 1/4 and 3/4 of the window: every date is within ~2 deg of one
		const now = Date.now();
		const span = (days + 1) * 86400000, t0 = now - 86400000;
		/** @type {[number, number][]} */
		const pts = [[latitude, longitude]];
		const newFans = [];
		for (const event of /** @type {const} */ (['sunrise', 'sunset'])) {
			for (const frac of [0.25, 0.75]) {
				const az = eventAzimuth(latitude, t0 + span * frac, event);
				const idx = dists.map(d => {
					if (d === 0) return 0;
					pts.push(destination(latitude, longitude, az, d * 1000));
					return pts.length - 1;
				});
				newFans.push({ event, az, idx });
			}
		}
		const lats = pts.map(p => p[0].toFixed(4)).join(','), lons = pts.map(p => p[1].toFixed(4)).join(',');
		const fetchModel = async (/** @type {string} */ m) => {
			const lv = levelsFor(m);
			const hourly = ['temperature_2m', 'surface_pressure',
				...lv.map(p => `temperature_${p}hPa`), ...lv.map(p => `geopotential_height_${p}hPa`),
				...(options.humidity ? ['dew_point_2m', ...lv.map(p => `relative_humidity_${p}hPa`)] : [])];
			const url = `${options.forecastUrl ?? FORECAST_URL}?latitude=${lats}&longitude=${lons}`
				+ `&hourly=${hourly.join(',')}&past_days=1&forecast_days=${days}&timeformat=unixtime&timezone=GMT`
				+ '&cell_selection=nearest' + (m === 'best_match' ? '' : `&models=${m}`) + (options.extraParams ?? '');
			const s = toSeries(await getOpenMeteoJson(doFetch, url, json), lv);
			if (s.length !== pts.length) throw new Error(`Open-Meteo returned ${s.length} locations, expected ${pts.length}`);
			if (!s[0].times.length) throw new Error(`Open-Meteo returned no hourly data for ${m}`);
			return s;
		};
		// both at once; either alone is still usable
		const [a, b] = await Promise.allSettled([fetchModel(model), fbModel ? fetchModel(fbModel) : Promise.resolve([])]);
		if (a.status === 'rejected' && (b.status === 'rejected' || !fbModel)) throw a.reason;
		const newFc = a.status === 'fulfilled' ? a.value : [];
		const newFb = b.status === 'fulfilled' ? b.value : [];
		lastError = a.status === 'rejected' ? a.reason : b.status === 'rejected' ? b.reason : null;
		const any = newFc.length ? newFc : newFb;

		// sea-surface temperature where the 90 m terrain model puts the point at sea level (open water)
		const sea = pts.map((_, i) => i).filter(i => any[i].elevation === 0);
		const newMarine = new Map();
		if (sea.length) {
			try {
				const murl = `${options.marineUrl ?? MARINE_URL}?latitude=${sea.map(i => pts[i][0].toFixed(4)).join(',')}`
					+ `&longitude=${sea.map(i => pts[i][1].toFixed(4)).join(',')}`
					+ `&hourly=sea_surface_temperature&past_days=1&forecast_days=${Math.min(days, 8)}&timeformat=unixtime&timezone=GMT`
					+ (options.extraParams ?? '');
				const ms = toSeries(await getOpenMeteoJson(doFetch, murl, json));
				sea.forEach((i, k) => { if (ms[k]?.times.length) newMarine.set(i, ms[k]); });
			} catch (e) {
				lastError = /** @type {Error} */ (e);                // keep going without water temperatures
			}
		}
		const ends = [newFc, newFb].filter(s => s.length).map(s => s[0].times);
		fans = newFans; fc = newFc; fb = newFb; marine = newMarine; built = new Map(); usedModel = new Map();
		coverage = {
			start: Math.min(...ends.map(ts => ts[0])) * 1000,
			end: Math.max(...ends.map(ts => ts[ts.length - 1])) * 1000,
		};
		stamp = ends.map(ts => ts[0]).join('.');
	};
	await refresh();

	/**
	 * Water temperature at time t: the marine forecast, held at its last value beyond its 8 days
	 * (sea-surface temperature changes slowly).
	 * @param {Series} s @param {number} t
	 */
	const sstAt = (s, t) => {
		let v = at(s, 'sea_surface_temperature', t);
		if (Number.isFinite(v)) return v;
		const col = s.cols.sea_surface_temperature ?? [];
		for (let i = col.length - 1; i >= 0; i--) if (col[i] != null && t > s.times[i] * 1000) return /** @type {number} */ (col[i]);
		return NaN;
	};

	/**
	 * Profile at point i from one series, or null if anything it should have is missing at time t
	 * (that model has ended, or lacks this hour), so the caller can take the whole path from the other.
	 * @param {Series} s @param {number} i @param {number} t @param {number} distanceKm @returns {PathProfile | null}
	 */
	const profileFrom = (s, i, t, distanceKm) => {
		if (!s) return null;
		const t2 = at(s, 'temperature_2m', t), ps = at(s, 'surface_pressure', t);
		if (!Number.isFinite(t2) || !Number.isFinite(ps) || !Number.isFinite(s.elevation)) return null;
		const h0 = s.elevation + 2;
		/** @type {import('./royzmanim-spa-corrections.js').ProfileLevel[]} */
		const lv = [{ h: h0, t: t2, p: ps }];
		// humidity is optional: a missing value never rejects the profile (the calculator fills it in)
		if (options.humidity) { const td = at(s, 'dew_point_2m', t); if (Number.isFinite(td)) lv[0].td = td; }
		for (const p of s.levels) {
			if (p >= ps) continue;                                   // below the ground here
			const z = at(s, `geopotential_height_${p}hPa`, t), tp = at(s, `temperature_${p}hPa`, t);
			if (!Number.isFinite(z) || !Number.isFinite(tp)) return null;
			if (z > h0 + 1) {
				/** @type {import('./royzmanim-spa-corrections.js').ProfileLevel} */
				const l = { h: z, t: tp, p };
				if (options.humidity) { const rh = at(s, `relative_humidity_${p}hPa`, t); if (Number.isFinite(rh)) l.rh = rh; }
				lv.push(l);
			}
		}
		/** @type {PathProfile} */
		const prof = { distanceKm, levels: lv };
		const m = marine.get(i);
		if (m) {
			const sst = sstAt(m, t);
			if (Number.isFinite(sst)) { prof.water = true; prof.skinC = sst; }
		}
		return prof;
	};

	/** @type {(date: any, event: 'sunrise'|'sunset', geo: any) => ({ path: PathProfile[], key: string } | null)} */
	const provider = (date, event, geo) => {
		const k = `${date.year}-${date.month}-${date.day}|${event}`;
		if (built.has(k)) return /** @type {any} */ (built.get(k));
		let res = null;
		const t = eventTime(date, geo?.getLatitude?.() ?? latitude, geo?.getLongitude?.() ?? longitude, event);
		if (coverage && Number.isFinite(t) && t >= coverage.start && t <= coverage.end) {
			const az = eventAzimuth(latitude, t, event);
			const fan = fans.filter(f => f.event === event)
				.reduce((b, f) => Math.abs(f.az - az) < Math.abs(b.az - az) ? f : b);
			// the whole path from one model: the chosen one if it is complete, else the fallback
			for (const [series, name] of /** @type {[Series[], string][]} */ ([[fc, model], [fb, fbModel ?? '']])) {
				if (!series.length) continue;
				const path = fan.idx.map((i, n) => profileFrom(series[i], i, t, dists[n]));
				if (path.every(Boolean)) {
					res = { path: /** @type {PathProfile[]} */ (path), key: `om|${name}|${stamp}|${k}${options.humidity ? '|h' : ''}` };
					usedModel.set(k, name);
					break;
				}
			}
		}
		built.set(k, res);
		return res;
	};

	return {
		provider,
		async refresh() {
			try { await refresh(); } catch (e) { lastError = /** @type {Error} */ (e); throw e; }
		},
		/** the model chosen for this place, and the one used where it ends (or null) */
		model,
		fallbackModel: fbModel,
		/** which model an event's path came from (after the provider was asked for it), or undefined */
		modelOf(/** @type {{year:number, month:number, day:number}} */ date, /** @type {'sunrise'|'sunset'} */ event) {
			return usedModel.get(`${date.year}-${date.month}-${date.day}|${event}`);
		},
		get coverage() { return coverage; },
		/** the last problem (a failed fallback or marine request) even when the data are usable */
		get lastError() { return lastError; },
		/** number of points on open water (sea-surface temperature used) */
		get seaPoints() { return marine.size; },
		source: 'open-meteo-path',
		/** whether dew point / relative humidity were asked for */
		humidity: !!options.humidity,
	};
}
