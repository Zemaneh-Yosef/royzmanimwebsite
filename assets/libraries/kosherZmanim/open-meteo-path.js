// @ts-check
/**
 * open-meteo-path.js
 *
 * The air along the whole line of sight, straight from the browser: for each sunrise and sunset in
 * the next 16 days, model temperature profiles (2 m plus pressure levels up to 700 mb, ~3 km) at
 * 0, 10, 25, 50, 100, 150, 200, 300 and 400 km along the Sun's direction, with the sea-surface
 * temperature where the path crosses the sea. Worldwide, no API key, no server: Open-Meteo
 * (open-meteo.com) serves the latest runs of the national weather models (ECMWF, NOAA GFS/HRRR,
 * DWD ICON, ...), picking the best for each place ("best_match").
 *
 *     import { createOpenMeteoPathAtmosphere } from "./open-meteo-path.js";
 *     const om = await createOpenMeteoPathAtmosphere(lat, lon);
 *     calc.setAtmosphereProvider(chainProviders(om.provider, monthlyClimate(normals)));
 *     // later, e.g. every 3-6 hours (models run every 1-6 h):  await om.refresh();
 *
 * This is the same information the refraction-server builds from GFS, from better models, and needs
 * nothing of yours. It covers the forecast range only; for later dates chain a climatology after it.
 *
 * Cost per refresh: two requests (forecast for 33 points, marine for the sea points); about 1-2 MB of
 * JSON (less with compression), roughly 70 "calls" of Open-Meteo's free quota of 10,000 a day per
 * user. Terms: non-commercial use; credit "Weather data by Open-Meteo.com" (CC BY 4.0).
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';
const DEG = Math.PI / 180;
const R_EARTH = 6371008.8;

export const DEFAULT_DISTANCES_KM = [0, 10, 25, 50, 100, 150, 200, 300, 400];
// Pressure levels used. Above 700 mb (~3 km) the calculator uses the standard atmosphere; rays at the
// horizon spend almost all of their bending below that.
export const DEFAULT_LEVELS_MB = [1000, 975, 950, 925, 900, 850, 800, 700];

/**
 * @typedef {import('./royzmanim-spa-corrections.js').PathProfile} PathProfile
 * @typedef {{ times: number[], cols: Record<string, (number | null)[]>, elevation: number }} Series
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

/** @param {any} json @returns {Series[]} */
function toSeries(json) {
	const arr = Array.isArray(json) ? json : [json];
	return arr.map(j => ({ times: j?.hourly?.time ?? [], cols: j?.hourly ?? {}, elevation: j?.elevation }));
}

/** @param {typeof fetch} doFetch @param {string} url */
async function getJson(doFetch, url) {
	const r = await doFetch(url);
	if (!r.ok) {
		let msg = `HTTP ${r.status}`;
		try { const j = await r.json(); if (j?.reason) msg += `: ${j.reason}`; } catch { /* not JSON */ }
		throw new Error(`Open-Meteo request failed (${msg})`);
	}
	const j = await r.json();
	if (j?.error) throw new Error(`Open-Meteo: ${j.reason ?? 'error'}`);
	return j;
}

/**
 * @param {number} latitude @param {number} longitude
 * @param {{ days?: number, distancesKm?: number[], levelsMb?: number[], fetch?: typeof fetch,
 *           forecastUrl?: string, marineUrl?: string, extraParams?: string, models?: string }} [options]
 *   days: forecast days (default 16, Open-Meteo's maximum).
 *   models: Open-Meteo model choice (default best_match), e.g. "ecmwf_ifs025" or "gfs_seamless".
 *   forecastUrl / marineUrl / extraParams: e.g. a paid endpoint and "&apikey=...".
 */
export async function createOpenMeteoPathAtmosphere(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const days = Math.max(1, Math.min(options.days ?? 16, 16));
	const dists = options.distancesKm ?? DEFAULT_DISTANCES_KM;
	const levels = options.levelsMb ?? DEFAULT_LEVELS_MB;
	const hourly = ['temperature_2m', 'surface_pressure',
		...levels.map(p => `temperature_${p}hPa`), ...levels.map(p => `geopotential_height_${p}hPa`)];

	/** @type {{ event: 'sunrise'|'sunset', az: number, idx: number[] }[]} fans of points by azimuth */
	let fans = [];
	/** @type {Series[]} */ let fc = [];
	/** @type {Map<number, Series>} marine series by point index */ let marine = new Map();
	/** @type {Map<string, { path: PathProfile[], key: string } | null>} */ let built = new Map();
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
		const url = `${options.forecastUrl ?? FORECAST_URL}?latitude=${lats}&longitude=${lons}`
			+ `&hourly=${hourly.join(',')}&past_days=1&forecast_days=${days}&timeformat=unixtime&timezone=GMT`
			+ '&cell_selection=nearest' + (options.models ? `&models=${options.models}` : '') + (options.extraParams ?? '');
		const newFc = toSeries(await getJson(doFetch, url));
		if (newFc.length !== pts.length) throw new Error(`Open-Meteo returned ${newFc.length} locations, expected ${pts.length}`);

		// sea-surface temperature where the 90 m terrain model puts the point at sea level (open water)
		const sea = pts.map((_, i) => i).filter(i => newFc[i].elevation === 0);
		const newMarine = new Map();
		if (sea.length) {
			try {
				const murl = `${options.marineUrl ?? MARINE_URL}?latitude=${sea.map(i => pts[i][0].toFixed(4)).join(',')}`
					+ `&longitude=${sea.map(i => pts[i][1].toFixed(4)).join(',')}`
					+ `&hourly=sea_surface_temperature&past_days=1&forecast_days=${Math.min(days, 8)}&timeformat=unixtime&timezone=GMT`
					+ (options.extraParams ?? '');
				const ms = toSeries(await getJson(doFetch, murl));
				sea.forEach((i, k) => { if (ms[k]?.times.length) newMarine.set(i, ms[k]); });
			} catch (e) {
				lastError = /** @type {Error} */ (e);                // keep going without water temperatures
			}
		}
		const ts = newFc[0].times;
		if (!ts.length) throw new Error('Open-Meteo returned no hourly data');
		fans = newFans; fc = newFc; marine = newMarine; built = new Map();
		coverage = { start: ts[0] * 1000, end: ts[ts.length - 1] * 1000 };
		stamp = String(ts[0]);
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

	/** @param {number} i point index @param {number} t @param {number} distanceKm @returns {PathProfile | null} */
	const profileAt = (i, t, distanceKm) => {
		const s = fc[i];
		const t2 = at(s, 'temperature_2m', t), ps = at(s, 'surface_pressure', t);
		if (!Number.isFinite(t2) || !Number.isFinite(ps) || !Number.isFinite(s.elevation)) return null;
		const h0 = s.elevation + 2;
		const lv = [{ h: h0, t: t2, p: ps }];
		for (const p of levels) {
			const z = at(s, `geopotential_height_${p}hPa`, t), tp = at(s, `temperature_${p}hPa`, t);
			if (Number.isFinite(z) && Number.isFinite(tp) && p < ps && z > h0 + 1) lv.push({ h: z, t: tp, p });
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
			const path = fan.idx.map((i, n) => profileAt(i, t, dists[n]));
			if (path[0] && path.every(Boolean)) res = { path: /** @type {PathProfile[]} */ (path), key: `om|${stamp}|${k}` };
		}
		built.set(k, res);
		return res;
	};

	return {
		provider,
		async refresh() {
			try { await refresh(); lastError = null; } catch (e) { lastError = /** @type {Error} */ (e); throw e; }
		},
		get coverage() { return coverage; },
		get lastError() { return lastError; },
		/** number of points on open water (sea-surface temperature used) */
		get seaPoints() { return marine.size; },
		source: 'open-meteo-path',
	};
}
