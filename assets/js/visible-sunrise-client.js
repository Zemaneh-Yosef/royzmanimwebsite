// @ts-check
/**
 * visible-sunrise-client.js — main-thread side of visible-sunrise-worker.js.
 *
 * Plug it into a ZemanFunctions config:
 *     const config = { ...settings, atmosphereProvider, horizon };
 *     config.deferVisibleSunrise = (date) => netz.request(date);
 *     netz.configure(config, geoLocation);
 * On a cache miss getNetz() then returns sea-level sunrise and asks the worker; when the answer comes
 * back it goes into the same cache getNetz() reads, and `onResult(date)` fires so the page re-renders.
 */

import { setCachedVisibleSunrise } from "./ROYZmanim.js";
import { snapshotProvider } from "./refraction-snapshot.js";

/** @typedef {import("./ROYZmanim.js").ZemanimConfig} ZemanimConfig */
/** @typedef {import("./visible-sunrise-worker.js").ResultMessage} ResultMessage */

/** @param {Temporal.PlainDate} date */
const isoKey = (date) => date.withCalendar("iso8601").toString({ calendarName: "never" });

export default class VisibleSunriseClient {
	/**
	 * @param {(date: Temporal.PlainDate) => void} onResult called on the main thread after a result is cached
	 * @param {() => Worker} [createWorker] override for tests
	 */
	constructor(onResult, createWorker = () => new Worker(new URL("./visible-sunrise-worker.js", import.meta.url), { type: "module" })) {
		this.onResult = onResult;
		/** @type {Worker} */
		this.worker = createWorker();
		/** bumped by configure(); results from an older config are ignored */
		this.gen = 0;
		/** @type {ZemanimConfig | null} */
		this.config = null;
		/** @type {any} */
		this.geo = null;
		/** dates asked for and not answered yet, for the current config @type {Set<string>} */
		this.pending = new Set();

		this.worker.addEventListener("message", (/** @type {MessageEvent<ResultMessage>} */ event) => {
			const { gen, date, ms } = event.data;
			if (gen !== this.gen || !this.config)
				return;
			this.pending.delete(date);
			const plainDate = Temporal.PlainDate.from(date);
			setCachedVisibleSunrise(this.config, plainDate, ms);
			this.onResult(plainDate);
		});
		this.worker.addEventListener("error", (e) => console.error("Visible sunrise worker failed", e));
	}

	/**
	 * Point the worker at a new config (new location, or fresh forecast data). Sends the horizon once.
	 * @param {ZemanimConfig} config @param {any} geoLocation KosherZmanim GeoLocation
	 */
	configure(config, geoLocation) {
		this.gen++;
		this.config = config;
		this.geo = geoLocation;
		this.pending.clear();
		if (!config.horizon)
			return;
		this.worker.postMessage({
			type: "init",
			gen: this.gen,
			geo: [geoLocation.getLocationName() ?? "", geoLocation.getLatitude(), geoLocation.getLongitude(),
				geoLocation.getElevation(), geoLocation.getTimeZone()],
			horizon: config.horizon,
			visibleOptions: config.visibleOptions
		});
	}

	/**
	 * Ask for one date. Cheap to call repeatedly: repeats are dropped until the answer arrives.
	 * @param {Temporal.PlainDate} date
	 */
	request(date) {
		const config = this.config;
		if (!config?.horizon)
			return;
		const key = isoKey(date);
		if (this.pending.has(key))
			return;
		this.pending.add(key);

		// The provider is a closure and can't be posted; send its results for the days around this one
		const table = config.atmosphereProvider
			? snapshotProvider(config.atmosphereProvider, this.geo, date.subtract({ days: 1 }), 3)
			: {};
		this.worker.postMessage({ type: "compute", gen: this.gen, date: key, table });
	}

	terminate() {
		this.worker.terminate();
	}
}
