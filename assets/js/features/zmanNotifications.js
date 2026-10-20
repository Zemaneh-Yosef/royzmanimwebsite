// @ts-check

// Zeman notifications, per place: each place someone subscribes to (from the calendar's Notifications button,
// features/notificationsModal.js) has its own per-zeman on/off and "minutes before". Places themselves (saved with
// or without notifications) are kept by places.js.
//
// The calendar sends the open place's notifications itself (ZmanNotificationScheduler below), in a tab (also in
// the background) or the installed app. When the browser can receive pushes, the notification server sends every
// subscribed place's notifications too, even when the site is closed (pushNotifications.js); both use the same
// `tag`, so one never doubles the other. They are shown through the service worker when there is one (Android
// Chrome only allows that), with a plain Notification otherwise.

import { notificationText, plainText, notificationTag } from "../core/notificationText.js";
import { ZMANIM_SETTING_KEYS } from "../core/zmanimSettings.js";
import {
	calendarLocation, calendarUrl, getPlace, isNotified, listPlaces, loadPlaces, placeKey, PLACES_EVENT, PLACES_KEY,
	readJson, storePlaces, writeJson
} from "./places.js";

/** localStorage key of the choices a new place starts with (the last ones used); before places, the only choices */
export const TEMPLATE_KEY = "zmanNotifications";
/** localStorage key of what was already sent, so reloads and other open tabs don't repeat it */
const SENT_KEY = "zmanNotificationsSent";

export const DEFAULT_MINUTES = 15;
/** A notification that comes due this late (a sleeping phone, a throttled tab) is still worth sending */
const LATE_GRACE_MS = 2 * 60 * 1000;
export const MAX_MINUTES = 24 * 60;
/** As the notification server allows */
export const MAX_PLACES = 10;

export { calendarLocation, calendarUrl, getPlace, listPlaces, placeKey, PLACES_EVENT, PLACES_KEY };

/** @typedef {import("./places.js").ZmanNotificationPref} ZmanNotificationPref */
/** @typedef {import("./places.js").PlaceLocation} PlaceLocation */
/** @typedef {import("./places.js").Place} Place */
/**
 * @typedef {Object} ZmanOccurrence
 * @property {string} key zeman id as in the calendar list ("sunset", "latestShma-mga", …)
 * @property {Temporal.ZonedDateTime} time the time as shown on the calendar
 * @property {string} title the zeman's name, plain text, in the display language
 * @property {string} timeText the time as shown on the calendar
 */

/** The places that get notifications, oldest first @returns {Place[]} */
export function notifiedPlaces() {
	return listPlaces().filter(isNotified);
}

/** A place that gets notifications @param {string} key @returns {Place | null} */
export function getNotifiedPlace(key) {
	const place = getPlace(key);
	return place && isNotified(place) ? place : null;
}

/** The choices a new place starts with: the last ones used @returns {Record<string, ZmanNotificationPref>} */
export function templateChoices() {
	return readJson(TEMPLATE_KEY) ?? {};
}

/**
 * Get notifications for a place (saving it, or updating its location and settings)
 * @param {PlaceLocation} location @param {Record<string, string>} settings
 * @returns {Place | null} null when MAX_PLACES others already get them
 */
export function addPlace(location, settings) {
	const places = loadPlaces();
	const key = placeKey(location.lat, location.lon);
	const old = places[key];
	if (!(old && isNotified(old)) && Object.values(places).filter(isNotified).length >= MAX_PLACES)
		return null;
	const notifications = old?.notifications ?? {};
	places[key] = {
		key, location, settings,
		notifications: Object.keys(notifications).length ? notifications : templateChoices(),
		addedAt: old?.addedAt ?? Date.now(),
		notify: true
	};
	storePlaces(places);
	return places[key];
}

/** Stop a place's notifications; it stays saved, its choices kept for next time @param {string} key */
export function stopNotifications(key) {
	const places = loadPlaces();
	if (!places[key] || !isNotified(places[key])) return;
	places[key].notify = false;
	storePlaces(places);
}

/** Keep a place's settings in step with its calendar (they decide its times) @param {string} key @param {Record<string, string>} settings */
export function refreshPlaceSettings(key, settings) {
	const places = loadPlaces();
	if (!places[key] || JSON.stringify(places[key].settings) === JSON.stringify(settings)) return;
	places[key].settings = settings;
	storePlaces(places);
}

/**
 * @param {string} place placeKey
 * @param {string} key zeman id
 * @returns {ZmanNotificationPref}
 */
export function getPref(place, key) {
	const pref = (getNotifiedPlace(place)?.notifications ?? templateChoices())[key];
	return {
		enabled: !!(pref && pref.enabled),
		minutes: pref ? clampMinutes(pref.minutes) : DEFAULT_MINUTES
	};
}

/**
 * @param {string} place placeKey
 * @param {string} key zeman id
 * @param {Partial<ZmanNotificationPref>} change
 */
export function savePref(place, key, change) {
	const places = loadPlaces();
	if (!places[place] || !isNotified(places[place])) return;
	const pref = Object.assign(getPref(place, key), change);
	pref.minutes = clampMinutes(pref.minutes);
	places[place].notifications[key] = pref;
	// the next place starts from these
	writeJson(TEMPLATE_KEY, places[place].notifications);
	storePlaces(places);
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

/** The settings that change the zemanim, as in effect on this page (URL first, then stored) */
export function zemanimSettingValues() {
	const urlParams = new URLSearchParams(window.location.search);
	/** @type {Record<string, string>} */
	const values = {};
	for (const key of ZMANIM_SETTING_KEYS) {
		const value = urlParams.get(key) || localStorage.getItem(key);
		if (value) values[key] = value;
	}
	// a Tzet Melakha degree given in the URL is used as given (see settings/handler.js)
	if (urlParams.get("tzeithIMdeg") && values.tzeithIMmin)
		values.tzeithIMdegMin = values.tzeithIMmin;
	return values;
}

/** localStorage key set once the choices from before places became places */
const MIGRATED_KEY = "zmanPlacesMigrated";

/**
 * Whether the choices from before places are places yet. Places saved without notifications (the sidebar's Save)
 * may come first; until then the notification server isn't touched, so the place it has isn't lost.
 */
export function placesMigrated() {
	if (localStorage.getItem(MIGRATED_KEY) !== null) return true;
	if (localStorage.getItem(PLACES_KEY) === null) return false;
	// stored before saving existed, so already migrated
	return Object.values(loadPlaces()).some(isNotified);
}

/**
 * Before places, one set of choices served whichever calendar was open (and the notification server got the
 * last one opened). Make that the one subscribed place: the place the server had, else the last calendar.
 * Places saved since are kept.
 * @param {PlaceLocation | null} fallback the calendar on screen, if any
 * @param {Record<string, string>} settings
 * @param {() => Promise<Place[] | null>} [fromServer] the places the notification server already has, if any:
 *   those win (the server had the place the person really chose)
 */
export async function migrateToPlaces(fallback, settings, fromServer) {
	const done = () => {
		try {
			localStorage.setItem(MIGRATED_KEY, "1");
			localStorage.removeItem("zmanPushEnabled");
			localStorage.removeItem("zmanPushSynced");
		} catch (e) { /* blocked */ }
	};
	if (placesMigrated()) return done();
	const adopted = fromServer ? await fromServer() : null;
	if (placesMigrated()) return done(); // another tab got there first

	/** @type {Place[]} */
	let found = [];
	if (adopted && adopted.length) {
		found = adopted;
	} else {
		const old = templateChoices();
		const hadChoices = Object.values(old).some((pref) => pref && pref.enabled);
		/** @type {PlaceLocation | null} */
		let location = null;
		const last = new URLSearchParams(localStorage.getItem("pwaLastCalendar") || "");
		const lat = parseFloat(last.get("lat") ?? ""), lon = parseFloat(last.get("long") ?? "");
		if (Number.isFinite(lat) && Number.isFinite(lon) && last.get("timeZone"))
			location = { lat, lon, elevation: parseFloat(last.get("elevation") ?? "") || 0, timeZone: /** @type {string} */ (last.get("timeZone")), name: (last.get("locationName") || "").slice(0, 100) };
		location = location ?? fallback;
		if (hadChoices && location) {
			const key = placeKey(location.lat, location.lon);
			found = [{ key, location, settings, notifications: old, addedAt: Date.now(), notify: true }];
		}
	}

	const places = loadPlaces();
	for (const place of found)
		places[place.key] = { ...place, addedAt: places[place.key]?.addedAt ?? place.addedAt, notify: true };
	writeJson(PLACES_KEY, places);
	done();
	if (found.length) window.dispatchEvent(new CustomEvent(PLACES_EVENT));
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
	 * @param {() => { language: 'he'|'en'|'he-Latn'; locationName: string | null; placeKey: string }} context
	 *   placeKey: the open calendar's place; only a subscribed place notifies
	 */
	constructor(context) {
		this.context = context;
		/** @type {ZmanOccurrence[]} */
		this.occurrences = [];
		/** @type {ReturnType<typeof setTimeout>[]} */
		this.timers = [];

		const reschedule = () => this.reschedule();
		window.addEventListener(PLACES_EVENT, reschedule);
		window.addEventListener("storage", (event) => { if (event.key === PLACES_KEY) reschedule(); });
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

		const place = getNotifiedPlace(this.context().placeKey);
		if (!place)
			return;
		const prefs = place.notifications;
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

			const id = `${place.key}@${occurrence.key}@${occurrence.time.toInstant().toString()}@${minutes}`;
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

		const { language, locationName, placeKey } = this.context();
		const minutesLeft = Math.max(0, Math.min(minutes, Math.ceil((zmanAt - Date.now()) / 60000)));
		const { title, body } = notificationText(occurrence, minutesLeft, language, locationName);
		showNotification(title, {
			body,
			// the same zeman never stacks up, even from two tabs
			tag: notificationTag(occurrence.key, occurrence.time, placeKey),
			timestamp: zmanAt
		});
	}
}
