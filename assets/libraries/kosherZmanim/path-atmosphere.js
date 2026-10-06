// @ts-check
/**
 * path-atmosphere.js
 *
 * Atmosphere provider backed by your refraction-server: temperature profiles along the sunrise /
 * sunset direction for any date. Each event comes from the best source the server has for it:
 *   "forecast"          the latest GFS run (about 7 days ahead)
 *   "climatology-gfs"   typical profiles from the server's own archive of past GFS runs
 *   "climatology-ncep"  typical profiles from NOAA's 1991-2020 reanalysis (until the archive fills in)
 *
 *     import ROYSPACalculator, { chainProviders, monthlyClimate } from "./royzmanim-spa-corrections.js";
 *     import { createServerPathAtmosphere } from "./path-atmosphere.js";
 *
 *     const paths = await createServerPathAtmosphere("https://your-vps.example/refraction", lat, lon);
 *     calc.setAtmosphereProvider(chainProviders(paths.provider, monthlyClimate(normals)));
 *
 *     await paths.prefetch(Temporal.PlainDate.from("2027-01-01"), 365);   // e.g. before a yearly calendar
 *     paths.sourceOf(date, "sunrise");                                     // "forecast", "climatology-gfs", ...
 *     await paths.refresh();                                               // e.g. every few hours
 *
 * The provider is synchronous, so dates must be fetched (constructor range or prefetch) before the
 * calculator asks for them; dates not fetched return null and the next provider in the chain is used.
 * The profiles are for the requested lat/lon. Use one instance per location.
 */

/**
 * @typedef {{ date: string, event: 'sunrise'|'sunset', source: string, timeUtc: string, azimuthDeg: number,
 *             profiles: { distanceKm: number, water?: boolean, skinC?: number, levels: { h: number, t: number, p: number }[] }[] }} PathEvent
 */

/**
 * @param {string} baseUrl e.g. "https://example.org/refraction" (the server's /v1/... lives under it)
 * @param {number} latitude
 * @param {number} longitude
 * @param {{ days?: number, fetch?: typeof fetch, throwOnError?: boolean }} [options]
 *   days: how many days to load at start, from yesterday (default 31; at most the server's limit).
 *   throwOnError: default false - a failed request leaves those dates empty (the provider returns null
 *   and the next provider in the chain is used) instead of throwing.
 */
export async function createServerPathAtmosphere(baseUrl, latitude, longitude, options = {}) {
	const doFetch = options.fetch ?? globalThis.fetch;
	const root = `${baseUrl.replace(/\/+$/, '')}/v1/path-profiles?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`;
	/** @type {Map<string, { path: any[], key: string, source: string }>} */
	const byKey = new Map();
	/** @type {string | null} */
	let cycle = null;
	/** @type {Error | null} */
	let lastError = null;
	/** ranges loaded so far, re-requested by refresh() @type {{ from: string, days: number }[]} */
	const ranges = [];

	/** @param {string} from YYYY-MM-DD @param {number} days */
	const load = async (from, days) => {
		try {
			const r = await doFetch(`${root}&from=${from}&days=${days}`);
			if (!r.ok) throw new Error(`refraction server: HTTP ${r.status}`);
			const json = await r.json();
			for (const e of /** @type {PathEvent[]} */ (json.events ?? [])) {
				if (!e.profiles?.length) continue;
				const tag = e.source === 'forecast' ? json.cycle : e.source;
				byKey.set(`${e.date}|${e.event}`, {
					path: e.profiles, source: e.source,
					key: `srv|${tag}|${latitude},${longitude}|${e.date}|${e.event}`,
				});
			}
			if (json.cycle) cycle = json.cycle;
			lastError = null;
		} catch (err) {
			lastError = /** @type {Error} */ (err);
			if (options.throwOnError) throw err;
		}
	};

	/** @param {string} from @param {number} days */
	const loadRange = async (from, days) => {
		const start = new Date(from + 'T00:00:00Z').getTime();
		for (let k = 0; k < days; k += 120) {
			await load(new Date(start + k * 86400000).toISOString().slice(0, 10), Math.min(120, days - k));
		}
	};

	const yesterday = new Date(Date.now() - 86400000 + longitude / 15 * 3600000).toISOString().slice(0, 10);
	ranges.push({ from: yesterday, days: options.days ?? 31 });
	await loadRange(yesterday, options.days ?? 31);

	return {
		/** @param {Temporal.PlainDate} date  @param {'sunrise'|'sunset'} event */
		provider: (date, event) => {
			const e = byKey.get(`${date.toString()}|${event}`);
			return e ? { path: e.path, key: e.key } : null;
		},
		/**
		 * Load a date range (e.g. a whole year before printing a calendar). Requests are split into
		 * chunks of up to 120 days.
		 * @param {Temporal.PlainDate} fromDate or "YYYY-MM-DD" @param {number} days
		 */
		async prefetch(fromDate, days) {
			const from = fromDate.toString();
			ranges.push({ from, days });
			await loadRange(from, days);
		},
		/** Re-request everything loaded so far (picks up new forecasts and a growing climatology). */
		async refresh() {
			for (const r of [...ranges]) await loadRange(r.from, r.days);
		},
		/** @param {Temporal.PlainDate} date @param {'sunrise'|'sunset'} event */
		sourceOf: (date, event) => byKey.get(`${date.toString()}|${event}`)?.source ?? null,
		get cycle() { return cycle; },
		get lastError() { return lastError; },
		get eventCount() { return byKey.size; },
	};
}
