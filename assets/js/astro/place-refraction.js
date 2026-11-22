// @ts-check

/**
 * The weather data for a place, in the steps the website's list (ui/zmanim-list.js) and the shul-wall screens
 * (shul-wall/base.js) both take: what is stored (read at once, so the page can draw), the same data, or a
 * fresh download, as the `{ atmosphereProvider, horizon, haze }` the calculator is built with, and a
 * download that is dropped when the page has moved on. What to do with the data (rebuild, redraw, when to
 * look again) is each caller's. Reads no settings.
 */

import { loadRefraction, readCachedRefraction, providerFromCache, MIN_REFRACTION_RECHECK_MS } from "./refraction-data.js";

/** @typedef {Pick<import("../core/ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} Refraction */
/** @typedef {import("./refraction-data.js").RefractionData} RefractionData */
/** @typedef {import("./refraction-data.js").CachedRefraction} CachedRefraction */

/**
 * What is stored for a place (readCachedRefraction), never rejecting.
 * @param {number} lat @param {number} lon
 * @param {number} [waitMs] give up after this long (null: the page goes on without it)
 * @returns {Promise<CachedRefraction | null>}
 */
export function readStoredRefraction(lat, lon, waitMs) {
	/** @type {Promise<CachedRefraction | null>} */
	const read = readCachedRefraction(lat, lon).catch((/** @type {unknown} */ _e) => /** @type {null} */ (null));
	if (waitMs === undefined)
		return read;
	/** @type {Promise<null>} */
	const gaveUp = new Promise((resolve) => setTimeout(() => resolve(null), waitMs));
	return Promise.race([read, gaveUp]);
}

/**
 * The calculator's refraction from what is stored (none stored: standard refraction).
 * @param {CachedRefraction | null} cached
 * @returns {Refraction}
 */
export function refractionFromStored(cached) {
	return {
		atmosphereProvider: providerFromCache(cached),
		horizon: cached?.horizon ?? null,
		haze: cached?.haze ?? null
	};
}

/**
 * The calculator's refraction from loaded data.
 * @param {RefractionData} data
 * @returns {Refraction}
 */
export function refractionFromData(data) {
	return { atmosphereProvider: data.provider, horizon: data.horizon, haze: data.haze };
}

/**
 * Load a place's data (from storage when current, else the network). Logs what could not be had and a failure,
 * never throws.
 * @param {number} lat @param {number} lon
 * @param {Parameters<typeof loadRefraction>[2]} options
 * @param {() => boolean} isCurrent whether the page still wants this place's data: asked once the load is done
 * @returns {Promise<RefractionData | null>} null when the load failed or isCurrent said no
 */
export async function loadFreshRefraction(lat, lon, options, isCurrent) {
	/** @type {RefractionData} */
	let data;
	try {
		data = await loadRefraction(lat, lon, options);
	} catch (e) {
		console.error("Refraction data failed to load", e);
		return null;
	}
	if (!isCurrent())
		return null;
	if (data.notes.length)
		console.info("Refraction:", data.notes);
	return data;
}

/**
 * When to ask again for a place whose first horizon the server is still computing (horizonRetryS); null when
 * the data is complete. (refractionRecheckMs also covers model runs and rate limits: for pages that look again
 * on their own.)
 * @param {RefractionData} data
 */
export function horizonRetryMs(data) {
	return data.horizonRetryS ? Math.max(MIN_REFRACTION_RECHECK_MS, data.horizonRetryS * 1000) : null;
}
