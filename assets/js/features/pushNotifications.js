// @ts-check

// Notifications when the site is closed: registers this browser with the notification server
// (Zemaneh-Yosef/website-notif) and keeps the server's copy of what it needs up to date: the calendar's
// place, the settings that change the zemanim, the per-zeman choices (zmanNotifications.js) and how times
// are written. The server runs the site's own zmanim code (core/) and sends the same notifications by Web
// Push; sw.js shows them, replacing silently any the open calendar already showed (same `tag`).
//
// Opt-in from the settings modal's Notifications tab (settings/docLoad.js). Turning it off deletes the
// server's copy.

import { settings } from "../settings/handler.js";
import { ZMANIM_SETTING_KEYS } from "../core/zmanimSettings.js";
import { loadPrefs, permissionState, PREFS_EVENT } from "./zmanNotifications.js";

export const PUSH_SERVER = "https://notifs.royzmanim.com";
/** Fired on window when the push state changes (on/off, synced, an error) */
export const PUSH_EVENT = "zmanPushStatusChanged";

const ENABLED_KEY = "zmanPushEnabled";
const SYNCED_KEY = "zmanPushSynced";
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

export function pushSupported() {
	return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext !== false;
}

export function pushEnabled() {
	return pushSupported() && lsGet(ENABLED_KEY) === "true";
}

/** @typedef {{ at: number; hash: string; locationName: string }} SyncRecord */
/** @type {{ syncing: boolean; error: string | null; needsCalendar: boolean }} */
const state = { syncing: false, error: null, needsCalendar: false };

/** @returns {{ supported: boolean; enabled: boolean; syncing: boolean; error: string | null; needsCalendar: boolean; synced: SyncRecord | null }} */
export function pushStatus() {
	/** @type {SyncRecord | null} */
	let synced = null;
	try { synced = JSON.parse(lsGet(SYNCED_KEY) || "null"); } catch (e) { /* none */ }
	return { supported: pushSupported(), enabled: pushEnabled(), ...state, synced };
}

function announce() {
	window.dispatchEvent(new CustomEvent(PUSH_EVENT));
}

// ─── What the server is sent ──────────────────────────────────────────────────

/**
 * The calendar's place: this page's when it shows one, else the last calendar opened (pwa.js keeps its address)
 * @returns {{ lat: number; lon: number; elevation: number; timeZone: string; name: string } | null}
 */
function currentLocation() {
	/** @param {URLSearchParams} p */
	const fromParams = (p) => {
		const lat = parseFloat(p.get("lat") ?? ""), lon = parseFloat(p.get("long") ?? "");
		const timeZone = p.get("timeZone");
		if (!Number.isFinite(lat) || !Number.isFinite(lon) || !timeZone) return null;
		return { lat, lon, elevation: parseFloat(p.get("elevation") ?? "") || 0, timeZone, name: (p.get("locationName") || "").slice(0, 100) };
	};
	const here = window.location.pathname.replace(/\.html$/, "") === "/calendar" ? fromParams(new URLSearchParams(window.location.search)) : null;
	return here ?? fromParams(new URLSearchParams(lsGet("pwaLastCalendar") || ""));
}

/** The settings that change the zemanim, as in effect on this page (URL first, then stored) */
function zemanimSettingValues() {
	const urlParams = new URLSearchParams(window.location.search);
	/** @type {Record<string, string>} */
	const values = {};
	for (const key of ZMANIM_SETTING_KEYS) {
		const value = urlParams.get(key) || lsGet(key);
		if (value) values[key] = value;
	}
	// a Tzet Melakha degree given in the URL is used as given (see settings/handler.js)
	if (urlParams.get("tzeithIMdeg") && values.tzeithIMmin)
		values.tzeithIMdegMin = values.tzeithIMmin;
	return values;
}

function displayOptions() {
	const language = settings.language();
	let locale = language == "he" ? "he" : "en";
	const preferred = navigator.languages.find((lang) => lang.startsWith(locale));
	if (preferred) locale = preferred;
	return { language, hourCycle: settings.timeFormat(), seconds: settings.seconds(), locale };
}

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
	const { status, data } = await api("GET", "/v1/key");
	if (status !== 200 || !data?.publicKey) throw new Error("the notification server isn't answering");
	await dbSet({ publicKey: data.publicKey });
	return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(data.publicKey) });
}

/** Send the server everything it needs (skipped when nothing changed since the last time, within a day) */
export async function syncPush({ force = false } = {}) {
	if (!pushEnabled() || state.syncing) return;
	if (permissionState() !== "granted") {
		state.error = "permission";
		return announce();
	}
	const location = currentLocation();
	state.needsCalendar = !location;
	if (!location) return announce();

	state.syncing = true;
	announce();
	try {
		const registration = await workerReady();
		const subscription = await browserSubscription(registration);
		const json = subscription.toJSON();
		const fields = {
			location,
			settings: zemanimSettingValues(),
			notifications: loadPrefs(),
			display: displayOptions()
		};
		const hash = JSON.stringify([json.endpoint, fields]);
		const last = pushStatus().synced;
		let token = await dbGet("token");
		if (!force && token && last && last.hash === hash && Date.now() - last.at < RESYNC_MS) return;

		const body = { subscription: { endpoint: json.endpoint, keys: json.keys }, ...fields };
		if (token) {
			const res = await api("PUT", "/v1/subscription", body, token);
			if (res.status === 401) token = null; // the server no longer has it: register again
			else if (res.status !== 200) throw new Error(res.data?.error || `the server answered ${res.status}`);
		}
		if (!token) {
			const res = await api("POST", "/v1/subscribe", body);
			if (res.status !== 201 || !res.data?.token) throw new Error(res.data?.error || `the server answered ${res.status}`);
			await dbSet({ token: res.data.token, server: PUSH_SERVER });
		}
		lsSet(SYNCED_KEY, JSON.stringify({ at: Date.now(), hash, locationName: location.name }));
		state.error = null;
	} catch (e) {
		state.error = /** @type {Error} */ (e).message || String(e);
		console.warn("Notification server sync failed", e);
	} finally {
		state.syncing = false;
		announce();
	}
}

let syncTimer = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
/** Sync soon (several changes in a row make one request) */
export function scheduleSync() {
	if (!pushEnabled()) return;
	if (syncTimer !== null) clearTimeout(syncTimer);
	syncTimer = setTimeout(() => { syncTimer = null; syncPush(); }, 1500);
}

/** Turn on (from a click: may ask for permission first) */
export async function enablePush() {
	lsSet(ENABLED_KEY, "true");
	await syncPush({ force: true });
}

/** Turn off: the server forgets this browser, and the browser drops its push subscription */
export async function disablePush() {
	lsSet(ENABLED_KEY, null);
	lsSet(SYNCED_KEY, null);
	state.error = null;
	try {
		const token = await dbGet("token");
		if (token) await api("DELETE", "/v1/subscription", undefined, token).catch(() => null);
		await dbSet({ token: null });
		const registration = await navigator.serviceWorker.getRegistration();
		const subscription = await registration?.pushManager.getSubscription();
		await subscription?.unsubscribe();
	} catch (e) {
		console.warn("Turning off the notification server failed", e);
	} finally {
		announce();
	}
}

// choices change in this tab or another: tell the server
window.addEventListener(PREFS_EVENT, scheduleSync);
window.addEventListener("storage", (event) => { if (event.key === "zmanNotifications") scheduleSync(); });
