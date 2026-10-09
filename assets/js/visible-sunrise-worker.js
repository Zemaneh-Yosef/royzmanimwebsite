// @ts-check
/**
 * visible-sunrise-worker.js — computes visible sunrises off the main thread for the web page
 * (see visible-sunrise-client.js). Imports only the calculator and the worker-safe snapshot helpers.
 *
 * Protocol (all plain data):
 *   → { type: 'init', gen, geo: [name, lat, lon, elevation, tz], horizon, visibleOptions, humidity, seaSurfaceLayer }
 *   → { type: 'compute', gen, date: 'YYYY-MM-DD', table, priority }   table: ProviderSnapshot around that date
 *   → { type: 'bump', gen, date, priority }                           raise a queued date's priority
 *   ← { gen, date, ms }                                               ms: epoch ms, NaN = not seen / failed
 *
 * Requests are queued, not handled in arrival order: the lowest `priority` goes first (0 = the day on
 * screen, k = k days away, for prefetching), and among equals the most recent request - so after quick
 * clicks through the days, the day the user stopped on is computed next instead of waiting its turn.
 */

import { GeoLocation } from "../libraries/kosherZmanim/kosher-zmanim.js";
import ROYSPACalculator from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { providerFromSnapshot } from "./refraction-snapshot.js";

/** @typedef {import("./refraction-snapshot.js").Horizon} Horizon */
/** @typedef {import("./refraction-snapshot.js").ProviderSnapshot} ProviderSnapshot */
/** @typedef {import("./refraction-snapshot.js").VisibleOptions} VisibleOptions */

/** @typedef {{ type: 'init', gen: number, geo: [string, number, number, number, string], horizon: Horizon, visibleOptions?: VisibleOptions, humidity?: boolean, seaSurfaceLayer?: boolean }} InitMessage */
/** @typedef {{ type: 'compute', gen: number, date: string, table: ProviderSnapshot, priority?: number }} ComputeMessage */
/** @typedef {{ type: 'bump', gen: number, date: string, priority: number }} BumpMessage */
/** @typedef {InitMessage | ComputeMessage | BumpMessage} WorkerMessage */
/** @typedef {{ gen: number, date: string, ms: number }} ResultMessage */

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
 * Priority queue in front of the engine. `post` sends a result; `defer` schedules the next step (a macrotask,
 * so messages that arrived during a computation are queued - and can overtake - before the next one starts).
 * @param {ReturnType<typeof createVisibleSunriseEngine>} engine
 * @param {(result: ResultMessage) => void} post
 * @param {(fn: () => void) => void} [defer]
 * @param {() => Promise<void>} [ready] resolves once computing is possible (e.g. the Temporal polyfill is loaded)
 */
export function createVisibleSunriseQueue(engine, post, defer = (fn) => setTimeout(fn, 0), ready = async () => {}) {
	/** @type {Map<string, { msg: ComputeMessage, priority: number, seq: number }>} */
	const queue = new Map();
	let seq = 0;
	let scheduled = false;
	let busy = false;

	const schedule = () => {
		if (scheduled || busy || !queue.size) return;
		scheduled = true;
		defer(step);
	};

	const step = async () => {
		scheduled = false;
		if (busy || !queue.size) return;
		busy = true;
		try {
			await ready();
			/** @type {string | null} */
			let bestKey = null;
			for (const [key, item] of queue) {
				const best = bestKey === null ? null : queue.get(bestKey);
				if (!best || item.priority < best.priority || (item.priority === best.priority && item.seq > best.seq))
					bestKey = key;
			}
			if (bestKey === null) return;
			const item = /** @type {{ msg: ComputeMessage }} */ (queue.get(bestKey));
			queue.delete(bestKey);
			const result = engine.compute(item.msg);
			if (result) post(result);
		} finally {
			busy = false;
			schedule();
		}
	};

	return {
		/** @param {WorkerMessage} msg */
		receive(msg) {
			if (msg.type === "init") {
				engine.init(msg);                          // synchronous: in place before any later compute
				queue.clear();                             // everything queued was for the old config
				return;
			}
			if (msg.gen !== engine.gen) return;           // stale
			const existing = queue.get(msg.date);
			if (msg.type === "bump") {
				if (existing) {
					existing.priority = Math.min(existing.priority, msg.priority);
					existing.seq = ++seq;
				}
			} else if (existing) {
				engine.addSpecs(msg.table);
				existing.priority = Math.min(existing.priority, msg.priority ?? 0);
				existing.seq = ++seq;
			} else {
				queue.set(msg.date, { msg, priority: msg.priority ?? 0, seq: ++seq });
			}
			schedule();
		},
		get size() { return queue.size; }
	};
}

// Worker wiring (skipped when this module is imported for tests)
if ("WorkerGlobalScope" in globalThis && !("document" in globalThis)) {
	/** @type {Promise<void> | null} */
	let temporalReady = null;
	const ready = async () => {
		if ("Temporal" in globalThis) return;
		// @ts-ignore -- URL import: no type declarations
		temporalReady ??= import("https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.2/+esm").then(m => { globalThis.Temporal = m.Temporal; });
		await temporalReady;
	};
	const queue = createVisibleSunriseQueue(createVisibleSunriseEngine(), (r) => postMessage(r), undefined, ready);
	addEventListener("message", (/** @type {MessageEvent<WorkerMessage>} */ event) => queue.receive(event.data));
}
