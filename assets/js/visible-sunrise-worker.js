// @ts-check
/**
 * visible-sunrise-worker.js — computes visible sunrises off the main thread for the web page
 * (see visible-sunrise-client.js). Imports only the calculator and the worker-safe snapshot helpers.
 *
 * Protocol (all plain data):
 *   → { type: 'init', gen, geo: [name, lat, lon, elevation, tz], horizon, visibleOptions }
 *   → { type: 'compute', gen, date: 'YYYY-MM-DD', table }      table: ProviderSnapshot around that date
 *   ← { gen, date, ms }                                         ms: epoch ms, NaN = not seen / failed
 */

import { GeoLocation } from "../libraries/kosherZmanim/kosher-zmanim.js";
import ROYSPACalculator from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { providerFromSnapshot } from "./refraction-snapshot.js";

/** @typedef {import("./refraction-snapshot.js").Horizon} Horizon */
/** @typedef {import("./refraction-snapshot.js").ProviderSnapshot} ProviderSnapshot */
/** @typedef {import("./refraction-snapshot.js").VisibleOptions} VisibleOptions */

/** @typedef {{ type: 'init', gen: number, geo: [string, number, number, number, string], horizon: Horizon, visibleOptions?: VisibleOptions }} InitMessage */
/** @typedef {{ type: 'compute', gen: number, date: string, table: ProviderSnapshot }} ComputeMessage */
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
			calc.configureForLocation(geo);
			/** Specs accumulate across requests for this config, so neighbouring days share them */
			const table = /** @type {ProviderSnapshot} */ ({});
			calc.setAtmosphereProvider(providerFromSnapshot(table, null));
			state = { gen: msg.gen, geo, horizon: msg.horizon, visibleOptions: msg.visibleOptions, calc, table };
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

// Worker wiring (skipped when this module is imported for tests)
if ("WorkerGlobalScope" in globalThis && !("document" in globalThis)) {
	const engine = createVisibleSunriseEngine();
	/** @type {Promise<void> | null} */
	let temporalReady = null;

	addEventListener("message", async (/** @type {MessageEvent<InitMessage | ComputeMessage>} */ event) => {
		const msg = event.data;
		if (msg.type === "init") {
			engine.init(msg); // synchronous, so it is in place before any compute that follows it
			return;
		}

		if (!("Temporal" in globalThis)) {
			// @ts-ignore -- URL import: no type declarations
			temporalReady ??= import("https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.2/+esm").then(m => { globalThis.Temporal = m.Temporal; });
			await temporalReady;
		}

		const result = engine.compute(msg);
		if (result)
			postMessage(result);
	});
}
