// @ts-check
/**
 * flyer-refraction.js — refraction data (forecast air + terrain horizon) for flyers that list many cities.
 *
 * A calculator's atmosphere provider belongs to one place, so a shared calculator can't simply be moved
 * with setGeoLocation() any more. Instead: load every city up front (in parallel), then get a calculator
 * per city with calcFor(template, geo), which keeps the template's settings and date.
 *
 *   await preloadFlyerRefraction(geoLocations);
 *   const calc = calcFor(amudehHoraahCal, geo);
 *
 * A city whose data can't be loaded falls back to the calculator's standard model (as before).
 */

import { ZemanFunctions } from "../ROYZmanim.js";
import { loadRefraction } from "../refraction-data.js";

/** @typedef {import("../../libraries/kosherZmanim/kosher-zmanim.js").GeoLocation} GeoLocation */
/** @typedef {Pick<import("../ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon'>} PlaceRefraction */

/** @type {Map<string, PlaceRefraction>} */
const byPlace = new Map();

/** @param {GeoLocation} geo */
const placeKey = (geo) => `${geo.getLatitude().toFixed(5)},${geo.getLongitude().toFixed(5)}`;

/**
 * One config per (template config, place), so every calculator for a city shares the same ray-trace caches.
 * @type {WeakMap<import("../ROYZmanim.js").ZemanimConfig, Map<string, import("../ROYZmanim.js").ZemanimConfig>>}
 */
const configs = new WeakMap();

/**
 * Load refraction data for every place not loaded yet. Never throws.
 * @param {Iterable<GeoLocation>} geoLocations
 */
export async function preloadFlyerRefraction(geoLocations) {
	/** @type {Map<string, GeoLocation>} */
	const missing = new Map();
	for (const geo of geoLocations) {
		const key = placeKey(geo);
		if (!byPlace.has(key) && Number.isFinite(geo.getLatitude()) && Number.isFinite(geo.getLongitude()))
			missing.set(key, geo);
	}

	await Promise.all([...missing].map(async ([key, geo]) => {
		try {
			const data = await loadRefraction(geo.getLatitude(), geo.getLongitude());
			byPlace.set(key, { atmosphereProvider: data.provider, horizon: data.horizon });
		} catch (e) {
			console.error(`Refraction data failed to load for ${key}`, e);
			byPlace.set(key, { atmosphereProvider: null, horizon: null });
		}
	}));
}

/**
 * The refraction settings for a place (empty when it wasn't preloaded or failed).
 * @param {GeoLocation} geo
 * @returns {PlaceRefraction}
 */
export function refractionFor(geo) {
	return byPlace.get(placeKey(geo)) ?? { atmosphereProvider: null, horizon: null };
}

/**
 * A calculator for `geo` with the template's settings and current date, plus that place's refraction data.
 * Replaces `template.setGeoLocation(geo)`.
 * @param {ZemanFunctions} template
 * @param {GeoLocation} geo
 * @returns {ZemanFunctions}
 */
export function calcFor(template, geo) {
	let perPlace = configs.get(template.config);
	if (!perPlace) {
		perPlace = new Map();
		configs.set(template.config, perPlace);
	}
	const key = placeKey(geo);
	let config = perPlace.get(key);
	if (!config) {
		config = { ...template.config, ...refractionFor(geo) };
		perPlace.set(key, config);
	}
	return new ZemanFunctions(geo, config, template.coreZC.getDate());
}
