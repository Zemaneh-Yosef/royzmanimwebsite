// @ts-check

// Notifications when the site is closed: registers this browser with the notification server
// (Zemaneh-Yosef/website-notif) and keeps the server's list of places in step with this browser's
// (zmanNotifications.js): each place's location, the settings that change its times and its per-zeman choices,
// plus how times are written. The server runs the site's own zmanim code (core/) and sends the same
// notifications by Web Push; sw.js shows them, replacing silently any the open calendar already showed (same tag).
//
// Used automatically when the browser can receive pushes and notifications are allowed; with no place left getting
// notifications, the server forgets this browser.

import { settings } from "../settings/handler.js";
import { notifiedPlaces, permissionState, placesMigrated, PLACES_EVENT, PLACES_KEY } from "./zmanNotifications.js";

export const PUSH_SERVER = "https://notifs.royzmanim.com";
/** Fired on window when the server state changes (syncing, synced, an error) */
export const PUSH_EVENT = "zmanPushStatusChanged";

const SYNCED_KEY = "zmanPushState";
/** Sync again after this even when nothing changed, so a lost server-side copy is noticed */
const RESYNC_MS = 24 * 60 * 60 * 1000;

// ─── Storage shared with the service worker (sw.js reads it on pushsubscriptionchange) ─────────────────

const DB_NAME = "royzmanim-push";
const STORE = "kv";

/** @returns {Promise<IDBDatabase | null>} */
function openDb() {
	return new Promise((resolve) => {
		try {
			const req = indexedDB.open(DB_NAME, 1);
			req.onupgradeneeded = () => req.result.createObjectStore(STORE);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => resolve(null);
			setTimeout(() => resolve(null), 3000);
		} catch (e) {
			resolve(null);
		}
	});
}

/** @param {string} key @returns {Promise<any>} */
async function dbGet(key) {
	const db = await openDb();
	if (!db) return null;
	return new Promise((resolve) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
		req.onsuccess = () => resolve(req.result ?? null);
		req.onerror = () => resolve(null);
	});
}

/** @param {Record<string, any>} values null removes */
async function dbSet(values) {
	const db = await openDb();
	if (!db) throw new Error("this browser's storage isn't available");
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		const store = tx.objectStore(STORE);
		for (const [key, value] of Object.entries(values))
			value === null ? store.delete(key) : store.put(value, key);
		tx.oncomplete = () => resolve(undefined);
		tx.onerror = () => reject(tx.error);
	});
}

/** @param {string} key */
function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
/** @param {string} key @param {string | null} value */
function lsSet(key, value) { try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (e) { /* blocked */ } }

// ─── State ────────────────────────────────────────────────────────────────────

/** Whether this browser can get notifications when the site is closed */
export function pushSupported() {
	return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext !== false;
}

/** @typedef {{ at: number; hash: string; places: string[] }} SyncRecord */
/** @type {{ syncing: boolean; error: string | null }} */
const state = { syncing: false, error: null };

/** @returns {{ supported: boolean; syncing: boolean; error: string | null; synced: SyncRecord | null }} */
export function pushStatus() {
	/** @type {SyncRecord | null} */
	let synced = null;
	try { synced = JSON.parse(lsGet(SYNCED_KEY) || "null"); } catch (e) { /* none */ }
	return { supported: pushSupported(), ...state, synced };
}

function announce() {
	window.dispatchEvent(new CustomEvent(PUSH_EVENT));
}

function displayOptions() {
	const language = settings.language();
	let locale = language == "he" ? "he" : "en";
	const preferred = navigator.languages.find((lang) => lang.startsWith(locale));
	if (preferred) locale = preferred;
	return { language, hourCycle: settings.timeFormat(), seconds: settings.seconds(), locale };
}

/** JSON equality, whatever the order of keys @param {unknown} a @param {unknown} b */
function sameJson(a, b) {
	/** @param {any} v @returns {any} */
	const sorted = (v) => Array.isArray(v) ? v.map(sorted)
		: v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])])) : v;
	return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}

/** @param {import("./zmanNotifications.js").Place} place */
const placeBody = (place) => ({ location: place.location, settings: place.settings, notifications: place.notifications });

// ─── Talking to the server ────────────────────────────────────────────────────

/**
 * @param {string} method @param {string} path @param {unknown} [body] @param {string | null} [token]
 * @returns {Promise<{ status: number; data: any }>}
 */
async function api(method, path, body, token) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 20000);
	try {
		/** @type {Record<string, string>} */
		const headers = {};
		if (body !== undefined) headers["Content-Type"] = "application/json";
		if (token) headers["Authorization"] = `Bearer ${token}`;
		const response = await fetch(PUSH_SERVER + path, {
			method, headers, body: body === undefined ? undefined : JSON.stringify(body),
			signal: controller.signal, credentials: "omit", cache: "no-store"
		});
		const data = response.status === 204 ? null : await response.json().catch(() => null);
		return { status: response.status, data };
	} finally {
		clearTimeout(timer);
	}
}

/** @param {{ status: number; data: any }} res @param {number[]} ok */
function expect(res, ok) {
	if (!ok.includes(res.status)) throw new Error(res.data?.error || `the server answered ${res.status}`);
	return res;
}

/** @param {string} b64 */
function b64urlToBytes(b64) {
	const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64.length + 3) % 4));
	return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** @returns {Promise<ServiceWorkerRegistration>} */
function workerReady() {
	return Promise.race([
		navigator.serviceWorker.ready,
		new Promise((_, reject) => setTimeout(() => reject(new Error("the site's service worker isn't running")), 10000))
	]);
}

/** @param {ServiceWorkerRegistration} registration */
async function browserSubscription(registration) {
	const existing = await registration.pushManager.getSubscription();
	if (existing) return existing;
	const { data } = expect(await api("GET", "/v1/key"), [200]);
	if (!data?.publicKey) throw new Error("the notification server isn't answering");
	await dbSet({ publicKey: data.publicKey });
	return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(data.publicKey) });
}

/** Forget this browser on the server (no places left getting notifications) */
async function forget() {
	const token = await dbGet("token");
	if (token) await api("DELETE", "/v1/subscription", undefined, token).catch(() => null);
	await dbSet({ token: null }).catch(() => null);
	lsSet(SYNCED_KEY, null);
	const registration = await navigator.serviceWorker.getRegistration();
	const subscription = await registration?.pushManager.getSubscription();
	await subscription?.unsubscribe();
}

/**
 * Make the server's places this browser's: add or change what differs, remove what is gone.
 * Skipped when nothing changed since the last time (within a day).
 */
export async function syncPush({ force = false } = {}) {
	if (!pushSupported() || state.syncing) return;
	// not migrated to places yet (notificationsModal.js does it first): nothing to compare with, so don't touch the server
	if (!placesMigrated()) return;
	const places = notifiedPlaces();
	const hadServer = !!pushStatus().synced || !!(await dbGet("token"));
	if (!places.length) {
		if (hadServer) await forget().catch((e) => console.warn("Couldn't remove this browser from the notification server", e));
		state.error = null;
		return announce();
	}
	if (permissionState() !== "granted") {
		state.error = "permission";
		return announce();
	}

	state.syncing = true;
	announce();
	try {
		const registration = await workerReady();
		const subscription = await browserSubscription(registration);
		const json = subscription.toJSON();
		const display = displayOptions();
		const hash = JSON.stringify([json.endpoint, display, places.map(placeBody)]);
		const last = pushStatus().synced;
		let token = await dbGet("token");
		if (!force && token && last && last.hash === hash && Date.now() - last.at < RESYNC_MS) return;

		const browser = { subscription: { endpoint: json.endpoint, keys: json.keys }, display };
		/** @type {any} */
		let server = null;
		if (token) {
			const res = await api("GET", "/v1/subscription", undefined, token);
			if (res.status === 401) token = null; // the server no longer has it: register again
			else server = expect(res, [200]).data;
		}

		if (!token) {
			const { data } = expect(await api("POST", "/v1/subscribe", { ...browser, places: places.map(placeBody) }), [201]);
			if (!data?.token) throw new Error("the server sent no token");
			await dbSet({ token: data.token, server: PUSH_SERVER });
		} else {
			if (server.endpoint !== json.endpoint || !sameJson(server.display, display))
				expect(await api("PUT", "/v1/subscription", browser, token), [200]);
			/** @type {Map<string, any>} */
			const theirs = new Map((server.places ?? []).map((/** @type {any} */ p) => [p.key, p]));
			for (const place of places) {
				const remote = theirs.get(place.key);
				theirs.delete(place.key);
				if (remote && sameJson({ location: remote.location, settings: remote.settings, notifications: remote.notifications }, placeBody(place)))
					continue;
				expect(await api("PUT", `/v1/places/${encodeURIComponent(place.key)}`, placeBody(place), token), [200]);
			}
			for (const key of theirs.keys())
				expect(await api("DELETE", `/v1/places/${encodeURIComponent(key)}`, undefined, token), [204, 404]);
		}
		lsSet(SYNCED_KEY, JSON.stringify({ at: Date.now(), hash, places: places.map((p) => p.key) }));
		state.error = null;
	} catch (e) {
		state.error = /** @type {Error} */ (e).message || String(e);
		console.warn("Notification server sync failed", e);
	} finally {
		state.syncing = false;
		announce();
	}
}

/**
 * The places the notification server has for this browser, if it has a token from before places (one location
 * per browser, which the server turned into one place): the migration adopts them as this browser's places.
 * @returns {Promise<import("./zmanNotifications.js").Place[] | null>}
 */
export async function serverPlaces() {
	if (!pushSupported()) return null;
	const token = await dbGet("token");
	if (!token) return null;
	try {
		const res = await api("GET", "/v1/subscription", undefined, token);
		if (res.status !== 200 || !Array.isArray(res.data?.places)) return null;
		return res.data.places.map((/** @type {any} */ p, /** @type {number} */ i) => ({
			key: p.key, location: p.location, settings: p.settings ?? {}, notifications: p.notifications ?? {}, addedAt: Date.now() + i, notify: true
		}));
	} catch (e) {
		return null;
	}
}

let syncTimer = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
/** Sync soon (several changes in a row make one request) */
export function scheduleSync() {
	if (!pushSupported()) return;
	if (syncTimer !== null) clearTimeout(syncTimer);
	syncTimer = setTimeout(() => { syncTimer = null; syncPush(); }, 1500);
}

// places or choices change in this tab or another: tell the server
window.addEventListener(PLACES_EVENT, scheduleSync);
window.addEventListener("storage", (event) => { if (event.key === PLACES_KEY) scheduleSync(); });
