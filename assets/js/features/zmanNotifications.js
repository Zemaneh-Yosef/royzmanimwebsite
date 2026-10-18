// @ts-check

// Zeman notifications: per-zeman on/off and "minutes before", chosen in the settings modal
// (Notifications tab, wired in settings/docLoad.js) and scheduled by the calendar (zmanimListUpdater.js).
//
// These are scheduled in the page, so they are sent while the calendar is open, in a tab (also in the
// background) or as the installed app. When the site is closed, the notification server sends the same ones
// by Web Push (pushNotifications.js); both use the same `tag`, so one never doubles the other. They are shown
// through the service worker when there is one (Android Chrome only allows that), with a plain Notification
// otherwise.

import { notificationText, plainText, notificationTag } from "../core/notificationText.js";

/** localStorage key of the per-zeman choices: { [zmanId]: { enabled, minutes } } */
export const PREFS_KEY = "zmanNotifications";
/** localStorage key of what was already sent, so reloads and other open tabs don't repeat it */
const SENT_KEY = "zmanNotificationsSent";
/** Fired on window when the choices change in this tab (other tabs get the "storage" event) */
export const PREFS_EVENT = "zmanNotificationPrefsChanged";

export const DEFAULT_MINUTES = 15;
/** A notification that comes due this late (a sleeping phone, a throttled tab) is still worth sending */
const LATE_GRACE_MS = 2 * 60 * 1000;
export const MAX_MINUTES = 24 * 60;

/** @typedef {{ enabled: boolean; minutes: number }} ZmanNotificationPref */
/**
 * @typedef {Object} ZmanOccurrence
 * @property {string} key zeman id as in the calendar list ("sunset", "latestShma-mga", …)
 * @property {Temporal.ZonedDateTime} time the time as shown on the calendar
 * @property {string} title the zeman's name, plain text, in the display language
 * @property {string} timeText the time as shown on the calendar
 */

/** @returns {Record<string, ZmanNotificationPref>} */
export function loadPrefs() {
	try {
		const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	} catch (e) {
		return {};
	}
}

/**
 * @param {string} key
 * @returns {ZmanNotificationPref}
 */
export function getPref(key) {
	const pref = loadPrefs()[key];
	return {
		enabled: !!(pref && pref.enabled),
		minutes: pref ? clampMinutes(pref.minutes) : DEFAULT_MINUTES
	};
}

/**
 * @param {string} key
 * @param {Partial<ZmanNotificationPref>} change
 */
export function savePref(key, change) {
	const prefs = loadPrefs();
	prefs[key] = Object.assign(getPref(key), change);
	prefs[key].minutes = clampMinutes(prefs[key].minutes);
	try {
		localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
	} catch (e) {
		console.warn("Couldn't save the notification settings", e);
	}
	window.dispatchEvent(new CustomEvent(PREFS_EVENT));
}

/** @param {unknown} value */
export function clampMinutes(value) {
	if (value === null || value === undefined || value === "")
		return DEFAULT_MINUTES;
	const minutes = Math.round(Number(value));
	if (Number.isNaN(minutes))
		return DEFAULT_MINUTES;
	return Math.min(Math.max(minutes, 0), MAX_MINUTES);
}

export function anyEnabled() {
	return Object.values(loadPrefs()).some(pref => pref && pref.enabled);
}

// ─── Permission ───────────────────────────────────────────────────────────────

export function notificationsSupported() {
	return "Notification" in window && window.isSecureContext !== false;
}

/** @returns {NotificationPermission | 'unsupported'} */
export function permissionState() {
	return notificationsSupported() ? Notification.permission : "unsupported";
}

/** Must run from a user action (a click). @returns {Promise<NotificationPermission | 'unsupported'>} */
export async function requestPermission() {
	if (!notificationsSupported())
		return "unsupported";
	if (Notification.permission !== "default")
		return Notification.permission;
	try {
		return await Notification.requestPermission();
	} catch (e) {
		// Safari before 15 only takes the callback form
		return new Promise(resolve => Notification.requestPermission(resolve));
	}
}

// ─── Showing ──────────────────────────────────────────────────────────────────

/**
 * @param {string} title
 * @param {NotificationOptions} options
 */
export async function showNotification(title, options) {
	if (permissionState() !== "granted")
		return false;

	options = Object.assign({
		icon: "/assets/images/pwa/icon-192.png",
		badge: "/assets/images/pwa/icon-192.png",
		lang: document.documentElement.lang || undefined,
		dir: document.body && document.body.dir === "rtl" ? "rtl" : "ltr",
		data: { url: window.location.href }
	}, options);

	if ("serviceWorker" in navigator) {
		try {
			const registration = await Promise.race([
				navigator.serviceWorker.getRegistration(),
				new Promise(resolve => setTimeout(() => resolve(undefined), 3000))
			]);
			if (registration && registration.active) {
				// the notification server (pushNotifications.js) may already have shown it: don't show it twice
				if (options.tag && (await registration.getNotifications({ tag: options.tag })).length)
					return true;
				await registration.showNotification(title, options);
				return true;
			}
		} catch (e) {
			console.warn("Service worker notification failed; using a page notification", e);
		}
	}

	try {
		const notification = new Notification(title, options);
		notification.onclick = () => { window.focus(); notification.close(); };
		return true;
	} catch (e) {
		console.warn("Couldn't show the notification", e);
		return false;
	}
}

// ─── Wording ──────────────────────────────────────────────────────────────────
// Shared with the notification server (core/notificationText.js), so both say the same thing.

export { notificationText, plainText };

// ─── Scheduling ───────────────────────────────────────────────────────────────

/** @returns {Record<string, number>} notification id → when its zeman is (epoch ms) */
function loadSent() {
	try {
		const parsed = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch (e) {
		return {};
	}
}

/** @param {string} id @param {number} zmanAt */
function markSent(id, zmanAt) {
	const sent = loadSent();
	const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
	for (const [key, at] of Object.entries(sent))
		if (!(at > cutoff)) delete sent[key];
	sent[id] = zmanAt;
	try {
		localStorage.setItem(SENT_KEY, JSON.stringify(sent));
	} catch (e) { /* storage full or blocked: worst case a repeat */ }
}

export class ZmanNotificationScheduler {
	/**
	 * @param {() => { language: 'he'|'en'|'he-Latn'; locationName: string | null }} context
	 */
	constructor(context) {
		this.context = context;
		/** @type {ZmanOccurrence[]} */
		this.occurrences = [];
		/** @type {ReturnType<typeof setTimeout>[]} */
		this.timers = [];

		const reschedule = () => this.reschedule();
		window.addEventListener(PREFS_EVENT, reschedule);
		window.addEventListener("storage", (event) => { if (event.key === PREFS_KEY) reschedule(); });
		// timers can be held back while a phone sleeps: catch up on what came due when the page is back
		document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reschedule(); });
	}

	/** @param {ZmanOccurrence[]} occurrences the coming zemanim (today and tomorrow) */
	schedule(occurrences) {
		this.occurrences = occurrences;
		this.reschedule();
	}

	clear() {
		this.timers.forEach(timer => clearTimeout(timer));
		this.timers = [];
	}

	reschedule() {
		this.clear();
		if (permissionState() !== "granted")
			return;

		const prefs = loadPrefs();
		const now = Date.now();
		for (const occurrence of this.occurrences) {
			const pref = prefs[occurrence.key];
			if (!pref || !pref.enabled)
				continue;

			const minutes = clampMinutes(pref.minutes);
			// the time as shown: to the minute unless seconds are displayed
			const zmanAt = occurrence.time.epochMilliseconds;
			const notifyAt = zmanAt - minutes * 60 * 1000;
			if (zmanAt + LATE_GRACE_MS <= now)
				continue;

			const id = `${occurrence.key}@${occurrence.time.toInstant().toString()}@${minutes}`;
			const fire = () => this._fire(id, occurrence, minutes);
			if (notifyAt <= now)
				fire(); // turned on (or opened) inside the lead time: tell them now
			else
				this.timers.push(setTimeout(fire, notifyAt - now));
		}
	}

	/**
	 * @param {string} id
	 * @param {ZmanOccurrence} occurrence
	 * @param {number} minutes
	 */
	_fire(id, occurrence, minutes) {
		const zmanAt = occurrence.time.epochMilliseconds;
		if (zmanAt + LATE_GRACE_MS <= Date.now() || id in loadSent())
			return; // slept through it, or another tab already sent it
		markSent(id, zmanAt);

		const { language, locationName } = this.context();
		const minutesLeft = Math.max(0, Math.min(minutes, Math.ceil((zmanAt - Date.now()) / 60000)));
		const { title, body } = notificationText(occurrence, minutesLeft, language, locationName);
		showNotification(title, {
			body,
			// the same zeman never stacks up, even from two tabs
			tag: notificationTag(occurrence.key, occurrence.time),
			timestamp: zmanAt
		});
	}
}
