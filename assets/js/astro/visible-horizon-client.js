// @ts-check
/**
 * visible-horizon-client.js — the page's side of the shared worker (visible-horizon-worker.js, see there for why
 * it exists and the protocol). One worker per page, shared by every job:
 *   - sunrise: VisibleSunriseClient (visible-sunrise-client.js) registers a slot and sends its messages through here
 *   - moon: requestMoon() (used by the Birkat Halevana card, features/levanaWeb.js)
 *
 * The worker starts on the first use and is terminated after IDLE_MS with nothing queued or running. That loses
 * nothing: answers are already cached on the main thread (setCachedVisibleSunrise for sunrise, LevanaCard.results
 * for the moon). The next request starts a new worker, which first gets the latest config of every sunrise slot
 * again (the moon needs none: each moon request carries its own refraction data).
 *
 * No settings or storage in here: pages that must never follow visitor settings (the Hazon Yosef calendar) use it.
 */

import { spawnWorker } from "../misc/worker.js";

/** @typedef {import("./visible-horizon-worker.js").HorizonAnswer} HorizonAnswer */
/** @typedef {import("./visible-horizon-worker.js").MoonMessage} MoonMessage */
/** @typedef {import("./visible-sunrise-worker.js").SunriseAnswer} SunriseAnswer */
/** @typedef {import("../print/weekly/moon-birkat-worker.js").MonthResult} MonthResult */

/** How long the worker may sit with nothing to do before it is terminated */
export const IDLE_MS = 30_000;
/** After the worker crashed, starting another is refused for this long (so a render loop can't spawn crash after crash) */
const RETRY_AFTER_CRASH_MS = 60_000;

/**
 * A sunrise client's registration.
 * @typedef {Object} Slot
 * @property {Record<string, any> | null} init its latest init message, re-sent to every new worker
 * @property {(answer: SunriseAnswer) => void} onAnswer
 * @property {() => number} pendingCount how many dates it is waiting for
 * @property {() => void} onWorkerLost the worker crashed: forget what was pending
 */

/** @type {Worker | null} */
let worker = null;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let idleTimer;
let crashedAt = -Infinity;
let nextSlot = 1;
let nextMoonId = 1;
/** @type {Map<number, Slot>} */
const slots = new Map();
/** @type {Map<number, { resolve: (result: MonthResult) => void, reject: (error: Error) => void }>} */
const moonPending = new Map();

/** @type {() => Worker} replaceable for tests */
let createWorker = () => spawnWorker(new URL("./visible-horizon-worker.js", import.meta.url));

/** @param {() => Worker} factory */
export function setWorkerFactory(factory) {
	createWorker = factory;
}

/** Whether the worker is running (for tests / diagnostics). */
export function isWorkerRunning() {
	return worker !== null;
}

function outstanding() {
	let n = moonPending.size;
	for (const slot of slots.values()) n += slot.pendingCount();
	return n;
}

/** Called whenever something was answered or abandoned: starts the idle countdown when nothing is left */
function checkIdle() {
	clearTimeout(idleTimer);
	if (!worker || outstanding() > 0)
		return;
	idleTimer = setTimeout(() => {
		if (worker && outstanding() === 0)
			stopWorker();
	}, IDLE_MS);
}

function stopWorker() {
	clearTimeout(idleTimer);
	worker?.terminate();
	worker = null;
}

/** @param {unknown} reason */
function workerLost(reason) {
	console.error("Visible horizon worker failed", reason);
	stopWorker();
	crashedAt = Date.now();
	const error = reason instanceof Error ? reason : new Error("The visible horizon worker failed");
	for (const { reject } of [...moonPending.values()]) reject(error);
	moonPending.clear();
	for (const slot of slots.values()) slot.onWorkerLost();
}

/**
 * The running worker, started if need be (then given every sunrise slot's latest config). Throws where
 * workers can't be started.
 * @returns {Worker}
 */
function ensureWorker() {
	clearTimeout(idleTimer);
	if (worker)
		return worker;
	if (Date.now() - crashedAt < RETRY_AFTER_CRASH_MS)
		throw new Error("The visible horizon worker failed recently");
	const w = createWorker();
	worker = w;
	w.addEventListener("message", (/** @type {MessageEvent<HorizonAnswer>} */ event) => {
		if (w !== worker) return;
		const answer = event.data;
		if (answer.job === "sunrise") {
			slots.get(answer.slot)?.onAnswer(answer);
		} else if (answer.job === "moon") {
			const pending = moonPending.get(answer.id);
			if (pending) {
				moonPending.delete(answer.id);
				if (answer.result) pending.resolve(answer.result);
				else pending.reject(Object.assign(new Error(answer.superseded ? "Replaced by a newer request" : answer.error ?? "No result"),
					{ superseded: answer.superseded === true }));
			}
		}
		checkIdle();
	});
	w.addEventListener("error", (e) => { if (w === worker) workerLost(e); });
	for (const [slot, { init }] of slots)
		if (init) w.postMessage({ ...init, job: "sunrise", slot });
	return w;
}

/**
 * Registers a sunrise client; returns its handle. Starts the worker if need be (throws where it can't).
 * @param {{ onAnswer: (answer: SunriseAnswer) => void, pendingCount: () => number, onWorkerLost: () => void }} handlers
 */
export function registerSunriseSlot(handlers) {
	const id = nextSlot++;
	slots.set(id, { init: null, ...handlers });
	try {
		ensureWorker();
	} catch (e) {
		slots.delete(id);
		throw e;
	}
	checkIdle();
	return {
		/**
		 * Posts a sunrise message (init, compute, bump) for this slot. An init is also remembered, to be re-sent
		 * to a later worker.
		 * @param {Record<string, any>} message
		 */
		send(message) {
			const slot = slots.get(id);
			if (!slot) return;
			if (message.type === "init") slot.init = message;
			ensureWorker().postMessage({ ...message, job: "sunrise", slot: id });
			checkIdle();
		},
		/** Forgets the slot (and tells the worker to drop its engine) */
		release() {
			if (!slots.delete(id)) return;
			worker?.postMessage({ job: "sunrise", slot: id, type: "drop" });
			checkIdle();
		}
	};
}

/**
 * Asks for a month of Birkat Halevana (see moon-birkat-worker.js). A newer request with the same `key` replaces
 * an older one still waiting in the worker's queue; the older promise then rejects with `superseded: true`.
 * @param {string} key place + year + month
 * @param {import("../print/weekly/worker.js").RefractionInit | null} init
 * @param {import("../print/weekly/moon-birkat-worker.js").birkatWorkerParam} params
 * @returns {Promise<MonthResult>}
 */
export function requestMoon(key, init, params) {
	return new Promise((resolve, reject) => {
		const id = nextMoonId++;
		try {
			const w = ensureWorker();
			moonPending.set(id, { resolve, reject });
			/** @type {MoonMessage} */
			const message = { job: "moon", type: "compute", id, key, init, params };
			w.postMessage(message);
		} catch (e) {
			moonPending.delete(id);
			reject(e);
		}
	});
}
