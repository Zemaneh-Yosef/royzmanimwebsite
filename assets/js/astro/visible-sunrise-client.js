// @ts-check
/**
 * visible-sunrise-client.js — main-thread side of the visible-sunrise job (visible-sunrise-worker.js), a thin
 * wrapper over the page's shared worker (visible-horizon-client.js).
 *
 * Plug it into a ZemanFunctions config:
 *     const config = { ...settings, atmosphereProvider, horizon };
 *     config.deferVisibleSunrise = (date) => netz.request(date);
 *     netz.configure(config, geoLocation);
 * On a cache miss getNetz() then shows an estimate (or sea level) and asks the worker; when the answer
 * comes back it goes into the same cache getNetz() reads, and `onResult(date)` fires so the page re-renders.
 * prefetchAround(date) queues the surrounding days behind it, nearest first.
 */

import { setCachedVisibleSunrise } from "../core/ROYZmanim.js";
import { snapshotProvider } from "../core/refraction-snapshot.js";
import { registerSunriseSlot } from "./visible-horizon-client.js";

/** @typedef {import("../core/ROYZmanim.js").ZemanimConfig} ZemanimConfig */

/** @param {Temporal.PlainDate} date */
const isoKey = (date) => date.withCalendar("iso8601").toString({ calendarName: "never" });

export default class VisibleSunriseClient {
	/**
	 * Throws where the worker can't be started (the caller then computes on the main thread).
	 * @param {(date: Temporal.PlainDate) => void} onResult called on the main thread after a result is cached
	 */
	constructor(onResult) {
		this.onResult = onResult;
		/** bumped by configure(); results from an older config are ignored */
		this.gen = 0;
		/** @type {ZemanimConfig | null} */
		this.config = null;
		/** @type {any} */
		this.geo = null;
		/** dates asked for and not answered yet (-> the best priority asked), current config @type {Map<string, number>} */
		this.pending = new Map();
		/** the date last asked for as "needed now", so repeated asks in one render don't each send a bump */
		this.lastNow = "";

		this.slot = registerSunriseSlot({
			onAnswer: ({ gen, date, ms }) => {
				if (gen !== this.gen || !this.config)
					return;
				this.pending.delete(date);
				const plainDate = Temporal.PlainDate.from(date);
				setCachedVisibleSunrise(this.config, plainDate, ms);
				this.onResult(plainDate);
			},
			pendingCount: () => this.pending.size,
			onWorkerLost: () => { this.pending.clear(); }
		});
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
		this._send({
			type: "init",
			gen: this.gen,
			geo: [geoLocation.getLocationName() ?? "", geoLocation.getLatitude(), geoLocation.getLongitude(),
				geoLocation.getElevation(), geoLocation.getTimeZone()],
			horizon: config.horizon,
			visibleOptions: config.visibleOptions,
			humidity: config.humidity === true,
			seaSurfaceLayer: config.seaSurfaceLayer === true
		});
	}

	/**
	 * Ask for one date. Cheap to call repeatedly: a repeat only sends a small "bump" when it asks with a
	 * higher priority than before (e.g. a prefetched day the user has now navigated to).
	 * @param {Temporal.PlainDate} date
	 * @param {number} [priority=0] 0 = needed now (on screen); k = k days from the day on screen
	 */
	request(date, priority = 0) {
		const config = this.config;
		if (!config?.horizon)
			return;
		const key = isoKey(date);
		const asked = this.pending.get(key);
		if (asked !== undefined) {
			// bump when it got more urgent, or when the user came back to it (needed now, but another day was
			// asked for as "now" since) - not on every repeated ask within the same render
			if (priority < asked || (priority === 0 && key !== this.lastNow)) {
				this.pending.set(key, Math.min(asked, priority));
				this._send({ type: "bump", gen: this.gen, date: key, priority });
				if (priority === 0) this.lastNow = key;
			}
			return;
		}
		this.pending.set(key, priority);
		if (priority === 0) this.lastNow = key;

		// The provider is a closure and can't be posted; send its results for the days around this one
		const table = config.atmosphereProvider
			? snapshotProvider(config.atmosphereProvider, this.geo, date.subtract({ days: 1 }), 3)
			: {};
		this._send({ type: "compute", gen: this.gen, date: key, table, priority });
	}

	/**
	 * Queue the days around `date` (nearest first) behind anything needed now, so navigating to them is
	 * instant. Already-cached days aren't asked again (the caller's cache check happens in getNetz;
	 * here we skip only what's pending - results for cached days are cheap and simply ignored).
	 * @param {Temporal.PlainDate} date @param {number} [radius=7] days on each side
	 * @param {(date: Temporal.PlainDate) => boolean} [isCached] skip days that are already known
	 */
	prefetchAround(date, radius = 7, isCached = () => false) {
		for (let k = 1; k <= radius; k++)
			for (const d of [date.add({ days: k }), date.subtract({ days: k })])
				if (!isCached(d))
					this.request(d, k);
	}

	/** Gives up this client's place in the shared worker (which keeps running for others until it is idle). */
	terminate() {
		this.pending.clear();
		this.slot.release();
	}

	/** @param {Record<string, any>} message */
	_send(message) {
		try {
			this.slot.send(message);
		} catch (e) {
			// worker unavailable or crashed: nothing will answer these, so don't wait for them
			console.warn("Visible sunrise worker unavailable", e);
			this.pending.clear();
		}
	}
}
