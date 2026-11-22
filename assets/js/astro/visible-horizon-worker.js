// @ts-check
/**
 * visible-horizon-worker.js — the one background worker of the calendar pages (started and stopped by
 * visible-horizon-client.js).
 *
 * Why it exists: finding when the sun or moon crosses the real terrain horizon in the forecast air is far too
 * slow for the main thread (up to ~100 ms for one sunrise, seconds for a month of Birkat Halevana). Both jobs
 * need the same heavy modules (kosher-zmanim, the refraction code), so one worker loads them once and runs
 * both jobs from one queue, instead of one worker each.
 *
 * This file holds no astronomy: it only queues and routes. Each job stays in its own file and is imported on
 * its first message, so a page loads only the jobs it asks for (the classic build for old browsers bundles
 * them in instead):
 *   - visible-sunrise-worker.js  (createSunriseJob: one visible sunrise per request)
 *   - print/weekly/moon-birkat-worker.js  (runBirkatMessage: a month of Birkat Halevana; pages without the
 *     card never fetch the moon library)
 *
 * Messages in (job + type; plain data):
 *   { job: 'sunrise', slot, type: 'init' | 'compute' | 'bump' | 'drop', ... }   see visible-sunrise-worker.js
 *   { job: 'moon', type: 'compute', id, key, init, params }
 *        init: the RefractionInit (or null) and params: the birkatWorkerParam of the print protocol; key: place +
 *        year + month. A newer request with the same key replaces one still waiting in the queue.
 * Messages out:
 *   { job: 'sunrise', slot, gen, date, ms }
 *   { job: 'moon', id, result: MonthResult | undefined, error?: string, superseded?: true }
 *
 * Order: lowest priority first; among equals the most recent request. Sunrise: 0 = the day on screen, k = k days
 * away (prefetch). Moon: 0.5, i.e. after the day on screen and before the prefetch. A running job is never
 * interrupted. Idle shutdown is the client's job (it knows what it is waiting for).
 */

import { loadWorkerPolyfills } from "../misc/worker-polyfills.js";

/** @typedef {import("./visible-sunrise-worker.js").SunriseMessage} SunriseMessage */
/** @typedef {import("../print/weekly/moon-birkat-worker.js").birkatWorkerParam} BirkatParam */
/** @typedef {import("../print/weekly/moon-birkat-worker.js").MonthResult} MonthResult */
/** @typedef {import("../print/weekly/worker.js").RefractionInit} RefractionInit */
/** @typedef {{ job: 'moon', type: 'compute', id: number, key: string, init: RefractionInit | null, params: BirkatParam }} MoonMessage */
/** @typedef {{ job: 'moon', id: number, result?: MonthResult, error?: string, superseded?: true }} MoonAnswer */
/** @typedef {SunriseMessage | MoonMessage} HorizonMessage */
/** @typedef {import("./visible-sunrise-worker.js").SunriseAnswer | MoonAnswer} HorizonAnswer */

/** Priority of a moon month: after the sunrise on screen (0), before the prefetched days (1+) */
export const MOON_PRIORITY = 0.5;

/** @typedef {ReturnType<typeof createHorizonQueue>} HorizonQueue */

/**
 * The one priority queue. Entries are keyed: adding under a key that is still waiting replaces that entry.
 * `defer` schedules the next step (a macrotask, so messages that arrived during a job are queued - and can
 * overtake - before the next one starts); `ready` resolves once computing is possible (the Temporal polyfill).
 * @param {(fn: () => void) => void} [defer]
 * @param {() => Promise<void>} [ready]
 */
export function createHorizonQueue(defer = (fn) => setTimeout(fn, 0), ready = async () => {}) {
	/** @type {Map<string, { priority: number, seq: number, run: () => unknown, onReplaced?: () => void }>} */
	const items = new Map();
	let seq = 0;
	let scheduled = false;
	let busy = false;

	const schedule = () => {
		if (scheduled || busy || !items.size) return;
		scheduled = true;
		defer(step);
	};

	const step = async () => {
		scheduled = false;
		if (busy || !items.size) return;
		busy = true;
		try {
			await ready();
			/** @type {string | null} */
			let bestKey = null;
			for (const [key, item] of items) {
				const best = bestKey === null ? null : items.get(bestKey);
				if (!best || item.priority < best.priority || (item.priority === best.priority && item.seq > best.seq))
					bestKey = key;
			}
			if (bestKey === null) return;
			const item = /** @type {{ run: () => unknown }} */ (items.get(bestKey));
			items.delete(bestKey);
			await item.run();
		} catch (e) {
			console.error("Visible horizon job failed", e);
		} finally {
			busy = false;
			schedule();
		}
	};

	return {
		/**
		 * @param {string} key @param {number} priority @param {() => unknown} run
		 * @param {() => void} [onReplaced] called if a newer add with the same key replaces this one while it waits
		 */
		add(key, priority, run, onReplaced) {
			items.get(key)?.onReplaced?.();
			items.set(key, { priority, seq: ++seq, run, onReplaced });
			schedule();
		},
		/** Make a waiting entry at least this urgent and the most recent of its priority. @returns {boolean} whether it was waiting */
		raise(/** @type {string} */ key, /** @type {number} */ priority) {
			const item = items.get(key);
			if (!item) return false;
			item.priority = Math.min(item.priority, priority);
			item.seq = ++seq;
			return true;
		},
		removeWhere(/** @type {(key: string) => boolean} */ test) {
			for (const key of [...items.keys()])
				if (test(key)) items.delete(key);
		},
		get size() { return items.size; }
	};
}

/**
 * Routes messages to the jobs.
 * @param {HorizonQueue} queue
 * @param {(answer: HorizonAnswer) => void} post
 * @param {() => Promise<typeof import("./visible-sunrise-worker.js")>} loadSunrise the sunrise job's module
 * @param {() => Promise<{ runBirkatMessage: (data: any) => Promise<any> }>} loadMoon the moon job's module
 */
export function createHorizonHost(queue, post, loadSunrise, loadMoon) {
	/** @type {Promise<ReturnType<typeof import("./visible-sunrise-worker.js").createSunriseJob>> | null} */
	let sunrise = null;
	/** @type {Promise<{ runBirkatMessage: (data: any) => Promise<any> }> | null} */
	let moon = null;

	return {
		/** @param {HorizonMessage} msg */
		receive(msg) {
			if (msg.job === "sunrise") {
				// messages wait for the module in arrival order (each .then on the same promise runs in turn)
				(sunrise ??= loadSunrise().then(({ createSunriseJob }) => createSunriseJob(post)))
					.then(job => job.receive(msg, queue))
					.catch(e => console.error("Visible sunrise job failed to load", e));
			} else if (msg.job === "moon") {
				const { id, key, init, params } = msg;
				const module = (moon ??= loadMoon());      // starts loading now, while the job waits its turn
				queue.add(`moon:${key}`, MOON_PRIORITY, async () => {
					try {
						const { runBirkatMessage } = await module;
						if (init) await runBirkatMessage(init);
						const answer = await runBirkatMessage(params);
						if (Array.isArray(answer) && answer[0]) post({ job: "moon", id, result: answer[0] });
						else post({ job: "moon", id, error: String(/** @type {any} */ (answer)?.error ?? "No result") });
					} catch (e) {
						post({ job: "moon", id, error: String(e) });
					}
				}, () => post({ job: "moon", id, superseded: true }));
			}
		}
	};
}

// Worker wiring (skipped when this module is imported for tests)
if ("WorkerGlobalScope" in globalThis && !("document" in globalThis)) {
	// Tells the moon job (which is also a standalone worker for the print pages) that this host does its messaging
	/** @type {any} */ (globalThis).visibleHorizonHost = true;
	const host = createHorizonHost(createHorizonQueue(undefined, loadWorkerPolyfills), (a) => postMessage(a),
		() => import("./visible-sunrise-worker.js"),
		() => import("../print/weekly/moon-birkat-worker.js"));
	addEventListener("message", (/** @type {MessageEvent<HorizonMessage>} */ event) => host.receive(event.data));
}
