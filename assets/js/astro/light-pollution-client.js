// @ts-check
/**
 * Light pollution (artificial night-sky brightness) for nightfall by the stars, from the refraction
 * server's /v1/light-pollution (World Atlas of Artificial Night Sky Brightness, Falchi et al. 2016).
 *
 *   import { fetchLightPollution, fetchLightPollutionForArea } from './light-pollution-client.js';
 *   // the exact spot (one 30" atlas pixel, ~0.9 x 0.7 km at 40 N):
 *   const here = await fetchLightPollution('https://example.org/refraction', 31.7767, 35.2345);
 *   here.artificialMcdM2;   // 5.756   the atlas value
 *   here.blpCdM2;           // 0.01808 Blp as calc_time.py's app passes it to nightfall() (pi x cd/m^2)
 *   here.totalMagArcsec2;   // 18.15   zenith brightness incl. the natural sky (for display)
 *   // the whole official area the point is in (the server looks it up, as for horizons); the value is
 *   // the 90th percentile of its pixels, i.e. a nightfall about 90% of the area has reached:
 *   const hood = await fetchLightPollutionForArea('https://example.org/refraction', 40.7298, -73.8221);
 *   hood.area;     // { id, name, kind, ... } or null (then it is the point's value, see hood.areaNote)
 *   hood.stats;    // { pixels, min, p10, median, p90, max, mean, percentile } when an area was used
 *   hood.point;    // the point's own value
 *
 * The atlas does not change, so this is one small download per place: keep it with the location, as
 * the horizon set. The server caches answers (30 days for a point, 7 for an area); this module also
 * keeps them for the page's lifetime.
 *
 * No answer is not the same as a dark sky. Do not silently substitute 0 when the request fails:
 * a darker sky than the real one gives an EARLIER nightfall (the lenient side). Outside the atlas
 * (north of 85 N, south of 60 S) the server itself answers 0 with coverage: false.
 */

/**
 * @typedef {{ artificialMcdM2: number, artificialCdM2: number, blpCdM2: number, ratioToNatural: number,
 *             totalMagArcsec2: number, coverage: boolean }} LightPollutionValue
 *   artificialMcdM2: artificial zenith brightness, mcd/m^2 (the atlas value).
 *   artificialCdM2:  the same in cd/m^2; equals calc_time.py's light_pollution(lat, lon).
 *   blpCdM2:         pi x artificialCdM2, the Blp calc_time.py's app passes to nightfall() / halakhic_time().
 *   ratioToNatural:  artificial / natural sky brightness (0.174 mcd/m^2).
 *   totalMagArcsec2: artificial + natural, in mag/arcsec^2 (about 22 for a pristine sky, ~17 in a city).
 *   coverage:        false outside the atlas (85.05 N .. 60.00 S); then everything is 0.
 * @typedef {{ row: number, col: number, lat: number, lon: number }} AtlasPixel
 * @typedef {LightPollutionValue & { lat: number, lon: number, pixel: AtlasPixel | null, note?: string }} LightPollutionPoint
 * @typedef {{ pixels: number, percentile: number, min: number, p10: number, median: number, p90: number,
 *             max: number, mean: number }} LightPollutionStats   (mcd/m^2)
 * @typedef {LightPollutionValue & { lat: number, lon: number, source: string,
 *             pixel?: AtlasPixel | null, area?: import('./horizon-client.js').AreaInfo | null, areaNote?: string,
 *             bbox?: [number, number, number, number], stats?: LightPollutionStats, point?: LightPollutionPoint
 *          }} LightPollution
 *   Point request: the point's value plus `pixel`. With area / bbox and at least one pixel inside: the
 *   area's percentile, plus `stats` and `point`; otherwise the point's value with `areaNote`.
 * @typedef {{ area?: boolean, bbox?: import('./horizon-client.js').BoundingBox | [number, number, number, number],
 *             percentile?: number, version?: string, fetch?: typeof fetch, signal?: AbortSignal }} LightPollutionOptions
 *   area:       the official area containing lat/lon (server's areas.json) instead of the single pixel.
 *   bbox:       every pixel in this box ([south, west, north, east] or an object; max 30 km centre to corner).
 *   percentile: which percentile of the area's pixels (server default 90; 50 = median, 100 = brightest).
 *   version:    any string, sent as &v= (ignored by the server); change it to bypass browser caches.
 */

/** @type {Map<string, Promise<LightPollution>>} */
const cache = new Map();

/**
 * @param {string} baseUrl the server root, e.g. 'https://example.org/refraction'
 * @param {number | null} lat @param {number | null} lon (may be null with options.bbox: the box centre)
 * @param {LightPollutionOptions} [options]
 * @returns {Promise<LightPollution>}
 */
export function fetchLightPollution(baseUrl, lat, lon, options = {}) {
	const q = new URLSearchParams();
	if (lat != null && lon != null) { q.set('lat', lat.toFixed(5)); q.set('lon', lon.toFixed(5)); }
	if (options.area) {
		if (lat == null || lon == null) throw new Error('fetchLightPollution with area needs lat/lon');
		q.set('area', 'auto');
	} else if (options.bbox) {
		const b = Array.isArray(options.bbox) ? options.bbox
			: [options.bbox.south, options.bbox.west, options.bbox.north, options.bbox.east];
		q.set('bbox', b.map(v => v.toFixed(5)).join(','));
	} else if (lat == null || lon == null) throw new Error('fetchLightPollution needs lat/lon or a bbox');
	if (options.percentile != null) q.set('percentile', String(options.percentile));
	if (options.version) q.set('v', options.version);
	const url = `${baseUrl.replace(/\/+$/, '')}/v1/light-pollution?${q}`;
	const hit = cache.get(url);
	if (hit) return hit;
	const doFetch = options.fetch ?? globalThis.fetch;
	const p = (async () => {
		const r = await doFetch(url, { signal: options.signal });
		if (!r.ok) {
			let msg = `HTTP ${r.status}`;
			try { msg = (await r.json()).error ?? msg; } catch { /* not JSON */ }
			throw new Error(`light-pollution request failed: ${msg}`);
		}
		return /** @type {LightPollution} */ (await r.json());
	})();
	cache.set(url, p);
	p.catch(() => cache.delete(url));
	return p;
}

/**
 * The official area (neighbourhood, village, city) containing the point; same as
 * fetchLightPollution(baseUrl, lat, lon, { area: true }).
 * @param {string} baseUrl @param {number} lat @param {number} lon
 * @param {Omit<LightPollutionOptions, 'area' | 'bbox'>} [options]
 */
export function fetchLightPollutionForArea(baseUrl, lat, lon, options = {}) {
	return fetchLightPollution(baseUrl, lat, lon, { ...options, area: true });
}

/**
 * Every atlas pixel inside a box; same as fetchLightPollution(baseUrl, null, null, { bbox }).
 * @param {string} baseUrl @param {import('./horizon-client.js').BoundingBox | [number, number, number, number]} bbox
 * @param {Omit<LightPollutionOptions, 'area' | 'bbox'>} [options]
 */
export function fetchLightPollutionForBox(baseUrl, bbox, options = {}) {
	return fetchLightPollution(baseUrl, null, null, { ...options, bbox });
}
