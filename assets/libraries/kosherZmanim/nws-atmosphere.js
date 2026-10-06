// @ts-check
/**
 * nws-atmosphere.js
 *
 * Atmosphere provider for ROYSPACalculator.setAtmosphereProvider() backed by the US National Weather
 * Service forecast grid (api.weather.gov). US locations only; about 7 days ahead.
 *
 *     import { createNwsAtmosphere, fetchNearestNormals } from "./nws-atmosphere.js";
 *     import { monthlyClimate } from "./royzmanim-spa-corrections.js";
 *
 *     const normals = await fetchNearestNormals(lat, lon);     // once; store it (changes once a decade)
 *     const nws = await createNwsAtmosphere(lat, lon, {
 *         userAgent: "(myapp.example, me@example.com)",        // NWS asks every app to identify itself
 *         fallback: monthlyClimate(normals),                   // used outside the forecast window
 *     });
 *     calc.setAtmosphereProvider(nws.provider);
 *     // later, e.g. every few hours:  await nws.refresh();
 *
 * The provider is synchronous (the calculator calls it during the sunrise solve), so the forecast is
 * fetched up front and kept in memory; refresh() re-fetches it.
 *
 * Temperature: the forecast's hourly 2 m temperature, interpolated to the approximate time of the
 * event (sunrise or sunset that day). This replaces ChaiTables' monthly-minimum / monthly-mean rule,
 * which only approximates the temperature at those times.
 *
 * Height: the temperature is tagged with the grid cell's elevation (properties.elevation), so it is
 * carried to the observer's height along the standard lapse rate.
 *
 * Pressure: not taken from NWS (the grid's "pressure" layer is published but empty); standard pressure
 * for the height is used. Weather-
 * driven pressure swings of +/-10 mb change horizon refraction by only about 1% (~2 s), whereas a
 * 10 C temperature error changes it by about 6%.
 */

const NWS_BASE = 'https://api.weather.gov';

/**
 * @typedef {{ start: number, end: number, value: number }} Interval   epoch ms, degrees C
 * @typedef {(date: any, event: 'sunrise'|'sunset', geo: import('./kosher-zmanim').GeoLocation) => ({ temperatureC: number, pressureMb?: number, heightM?: number } | null | undefined)} Provider
 */

/**
 * Parse an ISO 8601 duration such as PT1H, PT13H, P1D, P1DT6H into milliseconds.
 * @param {string} d
 */
function durationMs(d) {
	const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(d);
	if (!m) throw new Error('Unrecognised ISO 8601 duration: ' + d);
	return (((+(m[1] || 0) * 24 + +(m[2] || 0)) * 60 + +(m[3] || 0)) * 60 + +(m[4] || 0)) * 1000;
}

/**
 * Convert an NWS grid layer ({ uom, values: [{ validTime: "start/duration", value }] }) to intervals in C.
 * @param {{ uom?: string, values?: { validTime: string, value: number | null }[] } | undefined} layer
 * @returns {Interval[]}
 */
export function parseTemperatureLayer(layer) {
	if (!layer?.values) return [];
	const f = /degF/i.test(layer.uom ?? '');
	return layer.values
		.filter(v => v.value != null)
		.map(v => {
			const [s, d] = v.validTime.split('/');
			const start = Date.parse(s);
			const value = /** @type {number} */ (v.value);
			return { start, end: start + durationMs(d), value: f ? (value - 32) * 5 / 9 : value };
		})
		.sort((a, b) => a.start - b.start);
}

/**
 * Temperature at time t, interpolated linearly between interval midpoints; NaN outside the series.
 * @param {Interval[]} series @param {number} t epoch ms
 */
export function temperatureAt(series, t) {
	if (!series.length || t < series[0].start || t > series[series.length - 1].end) return NaN;
	const mid = (/** @type {Interval} */ i) => (i.start + i.end) / 2;
	if (t <= mid(series[0])) return series[0].value;
	for (let i = 0; i < series.length - 1; i++) {
		const a = mid(series[i]), b = mid(series[i + 1]);
		if (t >= a && t <= b) return series[i].value + (series[i + 1].value - series[i].value) * (t - a) / (b - a);
	}
	return series[series.length - 1].value;
}

/**
 * Rough time of sunrise / sunset (epoch ms), good to well under an hour: enough to pick the hourly
 * temperature. Uses the standard sunrise equation, so it needs nothing from the calculator.
 * @param {{year:number, month:number, day:number}} date @param {number} lat @param {number} lon
 * @param {'sunrise'|'sunset'} event
 */
export function approximateEventTime(date, lat, lon, event) {
	const DEG = Math.PI / 180;
	const day0 = Date.UTC(date.year, date.month - 1, date.day);
	const n = (day0 - Date.UTC(2000, 0, 1, 12)) / 86400000 + 0.0008 - lon / 360 + 0.5;
	const M = (357.5291 + 0.98560028 * n) % 360;
	const C = 1.9148 * Math.sin(M * DEG) + 0.02 * Math.sin(2 * M * DEG);
	const L = (M + C + 180 + 102.9372) % 360;
	const noonJ = 2451545 + n + 0.0053 * Math.sin(M * DEG) - 0.0069 * Math.sin(2 * L * DEG);
	const dec = Math.asin(Math.sin(L * DEG) * Math.sin(23.44 * DEG));
	const cosH = (Math.sin(-0.833 * DEG) - Math.sin(lat * DEG) * Math.sin(dec)) / (Math.cos(lat * DEG) * Math.cos(dec));
	const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / DEG;      // polar day/night: clamps to noon/midnight
	const J = noonJ + (event === 'sunrise' ? -H : H) / 360;
	return (J - 2440587.5) * 86400000;
}

// ------------------------------------------------------------------------------------------------
// Fallback: NOAA 1991-2020 U.S. Climate Normals (NCEI), for dates outside the forecast
// ------------------------------------------------------------------------------------------------
const NCEI_DATA = 'https://www.ncei.noaa.gov/access/services/data/v1';
const NCEI_SEARCH = 'https://www.ncei.noaa.gov/access/services/search/v1/data';

/**
 * @typedef {{ minC: number[], meanC: number[], heightM: number, station: string, name: string,
 *             latitude: number, longitude: number, distanceKm: number }} StationNormals
 *   minC = monthly normal of the daily minimum (MLY-TMIN-NORMAL), meanC = monthly normal of the daily
 *   mean (MLY-TAVG-NORMAL), both converted to C; heightM = station elevation. Pass straight to
 *   monthlyClimate(), which uses heightM to carry the temperatures to the observer's height.
 */

/** @param {number} lat1 @param {number} lon1 @param {number} lat2 @param {number} lon2 */
function distanceKm(lat1, lon1, lat2, lon2) {
	const r = Math.PI / 180, a = Math.sin((lat2 - lat1) * r / 2) ** 2
		+ Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
	return 12742 * Math.asin(Math.sqrt(a));
}

/**
 * Monthly temperature normals for one station. Rows come back in F as padded strings.
 * @param {string} stationId e.g. "USW00094728" (Central Park)
 * @param {{ fetch?: typeof fetch }} [options]
 * @returns {Promise<Omit<StationNormals, 'distanceKm'> | null>} null if the station has no temperature normals
 */
export async function fetchStationNormals(stationId, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const url = `${NCEI_DATA}?dataset=normals-monthly-1991-2020&stations=${encodeURIComponent(stationId)}`
		+ '&dataTypes=MLY-TMIN-NORMAL,MLY-TAVG-NORMAL&format=json&includeStationName=true&includeStationLocation=1';
	const r = await doFetch(url);
	if (!r.ok) throw new Error(`NCEI request failed (${r.status})`);
	/** @type {Record<string, string>[]} */
	const rows = await r.json();
	const f2c = (/** @type {string | undefined} */ s) => s == null || s.trim() === '' ? NaN : (parseFloat(s) - 32) * 5 / 9;
	const minC = Array(12).fill(NaN), meanC = Array(12).fill(NaN);
	for (const row of rows ?? []) {
		const m = parseInt(row.DATE, 10) - 1;
		if (m >= 0 && m < 12) { minC[m] = f2c(row['MLY-TMIN-NORMAL']); meanC[m] = f2c(row['MLY-TAVG-NORMAL']); }
	}
	if (!rows?.length || [...minC, ...meanC].some(v => !Number.isFinite(v))) return null;
	const first = rows[0];
	return {
		minC, meanC,
		heightM: parseFloat(first.ELEVATION),                // metres
		station: stationId,
		name: (first.NAME ?? '').trim(),
		latitude: parseFloat(first.LATITUDE),
		longitude: parseFloat(first.LONGITUDE),
	};
}

/**
 * Normals from the nearest NOAA station that has temperature normals. Fetch this once and store the
 * result (normals change once a decade); there is no need to call it on every launch.
 * @param {number} latitude
 * @param {number} longitude
 * @param {{ searchRadiusDeg?: number, maxCandidates?: number, fetch?: typeof fetch }} [options]
 * @returns {Promise<StationNormals>}
 */
export async function fetchNearestNormals(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const d = options.searchRadiusDeg ?? 0.5;
	const bbox = [latitude + d, longitude - d, latitude - d, longitude + d].map(v => v.toFixed(4)).join(','); // N,W,S,E
	const r = await doFetch(`${NCEI_SEARCH}?dataset=normals-monthly-1991-2020&bbox=${bbox}&limit=1000`);
	if (!r.ok) throw new Error(`NCEI station search failed (${r.status})`);
	const json = await r.json();
	const candidates = (json?.results ?? [])
		.map((/** @type {any} */ x) => ({ id: String(x.name ?? '').replace(/\.csv$/i, ''), lon: x.centroid?.[0], lat: x.centroid?.[1] }))
		.filter((/** @type {any} */ c) => c.id && Number.isFinite(c.lat) && Number.isFinite(c.lon))
		.map((/** @type {any} */ c) => ({ ...c, km: distanceKm(latitude, longitude, c.lat, c.lon) }))
		.sort((/** @type {any} */ a, /** @type {any} */ b) => a.km - b.km)
		.slice(0, options.maxCandidates ?? 8);
	for (const c of candidates) {
		const n = await fetchStationNormals(c.id, { fetch: doFetch });    // many stations are precipitation-only
		if (n) return { ...n, distanceKm: c.km };
	}
	throw new Error('No station with temperature normals nearby; widen searchRadiusDeg');
}

/**
 * Fetch the NWS forecast grid for a US location and build an atmosphere provider from it.
 * @param {number} latitude
 * @param {number} longitude
 * @param {{ userAgent?: string, fallback?: Provider | null, fetch?: typeof fetch }} [options]
 *   userAgent: sent as User-Agent (servers); browsers send their own and ignore this.
 *   fallback: provider for dates outside the forecast (e.g. monthlyClimate(...)); null = default model.
 *   fetch: custom fetch implementation (tests, proxies).
 */
export async function createNwsAtmosphere(latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const headers = { Accept: 'application/geo+json', ...(options.userAgent ? { 'User-Agent': options.userAgent } : {}) };
	const get = async (/** @type {string} */ url) => {
		const r = await doFetch(url, { headers });
		if (!r.ok) throw new Error(`NWS request failed (${r.status}) for ${url}`);
		return r.json();
	};
	const lat = +latitude.toFixed(4), lon = +longitude.toFixed(4);   // NWS rejects more than 4 decimals

	/** @type {Interval[]} */
	let series = [];
	let gridUrl = '';
	/** @type {number | undefined} elevation of the forecast grid cell, metres */
	let gridElevationM;
	const refresh = async () => {
		if (!gridUrl) {
			const point = await get(`${NWS_BASE}/points/${lat},${lon}`);
			gridUrl = point?.properties?.forecastGridData;
			if (!gridUrl) throw new Error('NWS has no forecast grid for this location (US only)');
		}
		const grid = await get(gridUrl);
		series = parseTemperatureLayer(grid?.properties?.temperature);
		if (!series.length) throw new Error('NWS grid returned no temperature data');
		const elev = grid?.properties?.elevation;
		gridElevationM = elev && Number.isFinite(elev.value)
			? (/ft/i.test(elev.unitCode ?? '') ? elev.value * 0.3048 : elev.value) : undefined;
	};
	await refresh();

	/** @type {Provider} */
	const provider = (date, event, geo) => {
		const t = approximateEventTime(date, geo?.getLatitude?.() ?? lat, geo?.getLongitude?.() ?? lon, event);
		const temperatureC = temperatureAt(series, t);
		// The forecast is for the grid cell's own elevation; passing it lets the calculator carry the
		// temperature to the observer's height along the standard lapse rate.
		if (Number.isFinite(temperatureC)) return gridElevationM == null ? { temperatureC } : { temperatureC, heightM: gridElevationM };
		return options.fallback ? options.fallback(date, event, geo) : null;
	};

	return {
		provider,
		refresh,
		/** first / last instant covered by the forecast (epoch ms) */
		get coverage() { return series.length ? { start: series[0].start, end: series[series.length - 1].end } : null; },
	};
}
