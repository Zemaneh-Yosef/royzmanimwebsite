// @ts-check
/**
 * Terrain horizons for visible sunrise / sunset, from the refraction server's /v1/horizon.
 *
 *   import { fetchHorizon } from './horizon-client.js';
 *   // the exact spot, eye at a known height above sea level:
 *   const here = await fetchHorizon('https://example.org/refraction', 31.7486, 35.2374, { heightM: 802 });
 *   // or the best vantage points within 0.8 km (earliest sunrise / latest sunset among them):
 *   const area = await fetchHorizon('https://example.org/refraction', 40.6092, -73.9683, { radiusKm: 0.8 });
 *   // or the whole official area the point is in (neighbourhood, village or city - the server looks it up):
 *   const hood = await fetchHorizonForArea('https://example.org/refraction', 40.7298, -73.8221);
 *   hood.area;     // { id, name, kind, source, bbox, ... } or null (then it is the request as given)
 *   // or within a bounding box of your own (every spot inside the box, corners included):
 *   const box = await fetchHorizonForBox('https://example.org/refraction',
 *                                        { south: 40.60, west: -73.98, north: 40.63, east: -73.95 });
 *   calc.getVisibleSunrise(date, geo, area);      // epoch ms
 *   calc.getSunrises(date, geo, here);            // { seaLevel, elevated, visible }
 *   // moon: true adds set.moon, the composite moonrise / moonset horizon (see MoonHorizon below):
 *   const withMoon = await fetchHorizonForArea('https://example.org/refraction', 31.778, 35.235, { moon: true });
 *
 * The server computes the set once per place and caches it, so this is one small download per place
 * (a few KB for a point, ~50 KB gzip for a vantage set). Keep it with the location; it does not change.
 */

/**
 * @typedef {{ south: number, west: number, north: number, east: number }} BoundingBox
 * @typedef {{ radiusKm?: number, bbox?: BoundingBox | [number, number, number, number], area?: boolean, gridM?: number, eyeM?: number,
 *             heightM?: number, minKm?: number, moon?: boolean, version?: string, fetch?: typeof fetch, signal?: AbortSignal }} HorizonOptions
 *   radiusKm: 0 (default) = the exact coordinates; > 0 = search vantage points within that radius
 *             (the server caps it, default 3 km), each with its own ground height + eyeM.
 *   bbox:     search every spot inside this box instead of a circle ([south, west, north, east] or an
 *             object). Its centre is the reference point. The server caps the centre-to-corner
 *             distance (default 3 km) and widens the grid for large boxes (default max 1200 spots).
 *   area:     search the whole official area containing lat/lon (a neighbourhood, village or city from the
 *             server's areas.json) instead; the result's `area` names it. A point in no known area gets the
 *             request as given (radiusKm / heightM), with `area: null` and an `areaNote`.
 *   gridM:    vantage grid spacing, metres (default 100).
 *   eyeM:     eye above the ground (default 1.7 m).
 *   heightM:  observer height above sea level, for radiusKm 0 (e.g. an upper floor); default ground + eyeM.
 *             Use the same height in the GeoLocation for the elevated sunrise.
 *   minKm:    ignore terrain nearer than this (default 1 km: the observer's own building / hilltop).
 *   moon:     also return `moon`, the composite moonrise / moonset horizon (the Moon's wider range of
 *             directions; in an area, the spots at the server's 90th percentile of horizon height, i.e. a
 *             moonrise nearly all of the area can see). The sun's part of the answer is unchanged.
 *   version:  any string, sent as &v=; the server ignores it, but a new value is a new URL, so browsers
 *             re-fetch instead of using a cached copy (horizons are cached for up to 30 days). Change it
 *             when the server's terrain data changes.
 */

const cache = new Map();

/**
 * @param {string} baseUrl the server root, e.g. 'https://example.org/refraction'
 * @param {number | null} lat @param {number | null} lon (may be null with options.bbox: the box centre)
 * @param {HorizonOptions} [options]
 * @returns {Promise<import('./royzmanim-spa-corrections.js').HorizonSet>}
 */
export async function fetchHorizon(baseUrl, lat, lon, options = {}) {
	const q = new URLSearchParams();
	if (lat != null && lon != null) { q.set('lat', lat.toFixed(6)); q.set('lon', lon.toFixed(6)); }
	if (options.area) {
		if (lat == null || lon == null) throw new Error('fetchHorizon with area needs lat/lon');
		q.set('area', 'auto');
	} else if (options.bbox) {
		const b = Array.isArray(options.bbox) ? options.bbox
			: [options.bbox.south, options.bbox.west, options.bbox.north, options.bbox.east];
		q.set('bbox', b.map(v => v.toFixed(6)).join(','));
	} else if (lat == null || lon == null) throw new Error('fetchHorizon needs lat/lon or a bbox');
	if (options.radiusKm) q.set('radius_km', String(options.radiusKm));
	if (options.gridM != null) q.set('grid_m', String(options.gridM));
	if (options.eyeM != null) q.set('eye', String(options.eyeM));
	if (options.heightM != null) q.set('height', String(options.heightM));
	if (options.minKm != null) q.set('min_km', String(options.minKm));
	if (options.moon) q.set('moon', '1');
	if (options.version) q.set('v', options.version);
	const url = `${baseUrl.replace(/\/+$/, '')}/v1/horizon?${q}`;
	if (cache.has(url)) return cache.get(url);
	const doFetch = options.fetch ?? globalThis.fetch;
	const p = (async () => {
		const r = await doFetch(url, { signal: options.signal });
		if (!r.ok) {
			let msg = `HTTP ${r.status}`;
			try { msg = (await r.json()).error ?? msg; } catch { /* not JSON */ }
			throw new Error(`horizon request failed: ${msg}`);
		}
		return r.json();
	})();
	cache.set(url, p);
	p.catch(() => cache.delete(url));
	return p;
}

/**
 * Vantage search over a bounding box (e.g. a neighbourhood's); same as fetchHorizon(baseUrl, null, null, { bbox }).
 * @param {string} baseUrl @param {BoundingBox | [number, number, number, number]} bbox [south, west, north, east]
 * @param {Omit<HorizonOptions, 'bbox' | 'radiusKm' | 'heightM'>} [options]
 */
export function fetchHorizonForBox(baseUrl, bbox, options = {}) {
	return fetchHorizon(baseUrl, null, null, { ...options, bbox });
}

/**
 * Vantage search over the official area (neighbourhood, village, city) containing the point; the server
 * picks the area, so the client needs no boundary data. Same as fetchHorizon(baseUrl, lat, lon, { area: true }).
 * Pass radiusKm / heightM for the fallback used where no area is known.
 * @param {string} baseUrl @param {number} lat @param {number} lon
 * @param {Omit<HorizonOptions, 'bbox' | 'area'>} [options]
 * @returns {Promise<import('./royzmanim-spa-corrections.js').HorizonSet & { area: AreaInfo | null, areaNote?: string }>}
 */
export function fetchHorizonForArea(baseUrl, lat, lon, options = {}) {
	// the server adds `area` (and `areaNote`) when called with area=auto
	return /** @type {Promise<any>} */ (fetchHorizon(baseUrl, lat, lon, { ...options, area: true }));
}

/**
 * One direction of the composite moon horizon. Its geometric elevation, seen from the reference point
 * (MoonHorizon.lat / lon), is geometricElevation(observerM, heightM, distanceKm) - tiltDeg.
 * @typedef {{ azimuthDeg: number, distanceKm: number, heightM: number, observerM: number, tiltDeg: number }} MoonHorizonEntry
 * @typedef {{ lat: number, lon: number, percentile: number, spots: number, spotsUsed: number,
 *             moonrise: MoonHorizonEntry[], moonset: MoonHorizonEntry[] }} MoonHorizon
 */

/**
 * @typedef {{ id: string, name: string, kind: string, level: number, source: string, places: string[],
 *             bbox: [number, number, number, number], radiusKm: number }} AreaInfo
 */

/**
 * The visible point the set was computed for (radiusKm 0), as plain fields - e.g. to build the
 * GeoLocation with the server's ground height: new GeoLocation(name, lat, lon, horizonHeight(set), tz).
 * @param {import('./royzmanim-spa-corrections.js').HorizonSet} set
 */
export function horizonHeight(set) {
	return set.points[0]?.height;
}
