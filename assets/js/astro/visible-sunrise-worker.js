// @ts-check
/**
 * visible-sunrise-worker.js — the visible-sunrise job of the shared worker (visible-horizon-worker.js, started
 * by visible-horizon-client.js). It is no worker entry point itself: it exports createSunriseJob(), which the
 * host runs. Imports only the calculator and the worker-safe snapshot helpers.
 *
 * Messages (job: 'sunrise', plus `slot`, the VisibleSunriseClient they belong to; all plain data):
 *   → { type: 'init', gen, geo: [name, lat, lon, elevation, tz], horizon, visibleOptions, humidity, seaSurfaceLayer }
 *   → { type: 'compute', gen, date: 'YYYY-MM-DD', table, priority }   table: ProviderSnapshot around that date
 *   → { type: 'bump', gen, date, priority }                           raise a queued date's priority
 *   → { type: 'drop' }                                                forget the slot
 *   ← { job: 'sunrise', slot, gen, date, ms }                         ms: epoch ms, NaN = not seen / failed
 *
 * Ordering is the host's queue: the lowest `priority` goes first (0 = the day on screen, k = k days away, for
 * prefetching), and among equals the most recent request.
 */

import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import ROYSPACalculator from "./royzmanim-spa-corrections.js";
import { providerFromSnapshot } from "../core/refraction-snapshot.js";

/** @typedef {import("../core/refraction-snapshot.js").Horizon} Horizon */
/** @typedef {import("../core/refraction-snapshot.js").ProviderSnapshot} ProviderSnapshot */
/** @typedef {import("../core/refraction-snapshot.js").VisibleOptions} VisibleOptions */

/** @typedef {{ type: 'init', gen: number, geo: [string, number, number, number, string], horizon: Horizon, visibleOptions?: VisibleOptions, humidity?: boolean, seaSurfaceLayer?: boolean }} InitMessage */
/** @typedef {{ type: 'compute', gen: number, date: string, table: ProviderSnapshot, priority?: number }} ComputeMessage */
/** @typedef {{ type: 'bump', gen: number, date: string, priority: number }} BumpMessage */
/** @typedef {{ type: 'drop' }} DropMessage  forget this slot's config (its client is gone) */
/** @typedef {(InitMessage | ComputeMessage | BumpMessage | DropMessage) & { job: 'sunrise', slot: number }} SunriseMessage */
/** @typedef {{ gen: number, date: string, ms: number }} ResultMessage */
/** @typedef {ResultMessage & { job: 'sunrise', slot: number }} SunriseAnswer */

/**
 * The computation, separate from the message plumbing so it can be tested without a Worker.
 * Must produce exactly what ZemanimMathBase.getVisibleSunriseEpochMs() would on the main thread:
 * same calculator setup, same call.
 */
export function createVisibleSunriseEngine() {
	/** @type {{ gen: number, geo: GeoLocation, horizon: Horizon, visibleOptions?: VisibleOptions, calc: ROYSPACalculator, table: ProviderSnapshot } | null} */
	let state = null;

	return {
		/** @param {InitMessage} msg */
		init(msg) {
			const geo = new GeoLocation(...msg.geo);
			const calc = new ROYSPACalculator();
			// same switches as calculatorFor() in ROYZmanim.js, so the worker's answer matches the main thread's
			calc.setHumidity(msg.humidity === true);
			calc.setSeaSurfaceLayer(msg.seaSurfaceLayer === true);
			calc.configureForLocation(geo);
			/** Specs accumulate across requests for this config, so neighbouring days share them */
			const table = /** @type {ProviderSnapshot} */ ({});
			calc.setAtmosphereProvider(providerFromSnapshot(table, null));
			state = { gen: msg.gen, geo, horizon: msg.horizon, visibleOptions: msg.visibleOptions, calc, table };
		},

		/** current config generation (-1 before init) */
		get gen() { return state ? state.gen : -1; },

		/** @param {ProviderSnapshot} table */
		addSpecs(table) {
			if (state) Object.assign(state.table, table);
		},

		/** @param {ComputeMessage} msg @returns {ResultMessage | null} null = stale (an init for a newer config came in) */
		compute(msg) {
			if (!state || msg.gen !== state.gen)
				return null;
			Object.assign(state.table, msg.table);
			let ms = NaN;
			try {
				ms = state.calc.getVisibleSunrise(Temporal.PlainDate.from(msg.date), state.geo, state.horizon, state.visibleOptions);
			} catch (e) {
				console.error("Visible sunrise failed for", msg.date, e);
			}
			return { gen: msg.gen, date: msg.date, ms };
		}
	};
}

/**
 * The sunrise job for the shared worker (visible-horizon-worker.js): one engine per client slot, and its
 * messages turned into entries of the host's queue. `post` sends an answer to the page.
 *
 * Messages carry `slot` (which VisibleSunriseClient they belong to); an init for a slot clears what that slot
 * had queued, since it was for the old config. A repeat compute for a date still waiting only raises its
 * priority (and shares its specs), like a bump.
 * @param {(answer: SunriseAnswer) => void} post
 */
export function createSunriseJob(post) {
	/** @type {Map<number, ReturnType<typeof createVisibleSunriseEngine>>} */
	const engines = new Map();
	const keyOf = (/** @type {number} */ slot, /** @type {string} */ date) => `sunrise:${slot}:${date}`;

	return {
		/**
		 * @param {SunriseMessage} msg
		 * @param {import("./visible-horizon-worker.js").HorizonQueue} queue
		 */
		receive(msg, queue) {
			const slot = msg.slot;
			if (msg.type === "init") {
				let engine = engines.get(slot);
				if (!engine) engines.set(slot, engine = createVisibleSunriseEngine());
				engine.init(msg);                                          // synchronous: in place before any later compute
				queue.removeWhere((key) => key.startsWith(`sunrise:${slot}:`));   // everything queued was for the old config
				return;
			}
			if (msg.type === "drop") {
				engines.delete(slot);
				queue.removeWhere((key) => key.startsWith(`sunrise:${slot}:`));
				return;
			}
			const engine = engines.get(slot);
			if (!engine || msg.gen !== engine.gen) return;                // stale
			const key = keyOf(slot, msg.date);
			if (msg.type === "bump") {
				queue.raise(key, msg.priority);
			} else if (queue.raise(key, msg.priority ?? 0)) {
				engine.addSpecs(msg.table);
			} else {
				queue.add(key, msg.priority ?? 0, () => {
					const result = engine.compute(msg);
					if (result) post({ job: "sunrise", slot, ...result });
				});
			}
		}
	};
}
