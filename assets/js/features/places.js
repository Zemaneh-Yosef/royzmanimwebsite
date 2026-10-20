// @ts-check

// Saved places: the places someone keeps at hand, listed in the sidebar (or its Places window) and on the home page
// (features/placesList.js). Some of them also get zeman notifications (zmanNotifications.js): getting notifications
// for a place saves it, and turning them off keeps it saved.
//
// Kept in localStorage: a place is well under a kilobyte, so there is room for far more places than anyone keeps.
// The one limit is the notification server's, on the places it sends notifications for (MAX_NOTIFIED_PLACES).

import { placeKey } from "../core/notificationText.js";
import { applyLocationDefaults, isInIsrael } from "../misc/israel.js";

/** localStorage key of the saved places: { [placeKey]: Place } (named from when places were only for notifications) */
export const PLACES_KEY = "zmanNotificationPlaces";
/** Fired on window when the places or their choices change in this tab (other tabs get the "storage" event) */
export const PLACES_EVENT = "zmanNotificationPlacesChanged";

export { placeKey };

/** @typedef {{ enabled: boolean; minutes: number }} ZmanNotificationPref */
/** @typedef {{ lat: number; lon: number; elevation: number; timeZone: string; name: string }} PlaceLocation */
/**
 * @typedef {Object} Place
 * @property {string} key placeKey(lat, lon)
 * @property {PlaceLocation} location
 * @property {Record<string, ZmanNotificationPref>} notifications
 * @property {Record<string, string>} settings the settings that change the zemanim, as on this place's calendar
 * @property {number} addedAt
 * @property {boolean} [notify] whether it gets notifications; places from before saving (all for notifications) have none
 */

/** @param {string} key */
export function readJson(key) {
	try {
		const parsed = JSON.parse(localStorage.getItem(key) || "null");
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch (e) {
		return null;
	}
}

/** @param {string} key @param {unknown} value */
export function writeJson(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.warn("Couldn't save the places", e);
	}
}

/** @returns {Record<string, Place>} */
export function loadPlaces() {
	return readJson(PLACES_KEY) ?? {};
}

/** The saved places, oldest first @returns {Place[]} */
export function listPlaces() {
	return Object.values(loadPlaces()).sort((a, b) => a.addedAt - b.addedAt);
}

/** @param {string} key @returns {Place | null} */
export function getPlace(key) {
	return loadPlaces()[key] ?? null;
}

/** @param {Place} place */
export const isNotified = (place) => place.notify !== false;

/** @param {Record<string, Place>} places */
export function storePlaces(places) {
	writeJson(PLACES_KEY, places);
	window.dispatchEvent(new CustomEvent(PLACES_EVENT));
}

/**
 * Save a place (or update its location and settings), keeping its notifications as they are
 * @param {PlaceLocation} location @param {Record<string, string>} settings
 * @returns {Place}
 */
export function savePlace(location, settings) {
	const places = loadPlaces();
	const key = placeKey(location.lat, location.lon);
	const old = places[key];
	places[key] = {
		key, location, settings,
		notifications: old?.notifications ?? {},
		addedAt: old?.addedAt ?? Date.now(),
		notify: old ? isNotified(old) : false
	};
	storePlaces(places);
	return places[key];
}

/** Forget a place, its notifications with it @param {string} key */
export function removePlace(key) {
	const places = loadPlaces();
	if (!(key in places)) return;
	delete places[key];
	storePlaces(places);
}

/** @param {Place} place */
export const placeName = (place) => place.location.name || `${place.location.lat.toFixed(3)}, ${place.location.lon.toFixed(3)}`;

/** The calendar's place when this page is one (from its address) @returns {PlaceLocation | null} */
export function calendarLocation() {
	if (window.location.pathname.replace(/\.html$/, "") !== "/calendar") return null;
	const p = new URLSearchParams(window.location.search);
	const lat = parseFloat(p.get("lat") ?? ""), lon = parseFloat(p.get("long") ?? "");
	const timeZone = p.get("timeZone");
	if (!Number.isFinite(lat) || !Number.isFinite(lon) || !timeZone) return null;
	return { lat, lon, elevation: parseFloat(p.get("elevation") ?? "") || 0, timeZone, name: (p.get("locationName") || "").trim().slice(0, 100) };
}

/** A place's calendar @param {PlaceLocation} loc */
export function calendarUrl(loc) {
	const params = new URLSearchParams({ lat: String(loc.lat), long: String(loc.lon), elevation: String(loc.elevation), locationName: loc.name, timeZone: loc.timeZone });
	return `/calendar?${params}`;
}

/** Picking a place sets the settings whose defaults depend on Israel, as the location search does @param {PlaceLocation} loc */
export function placePicked(loc) {
	applyLocationDefaults(isInIsrael(loc.lat, loc.lon));
}
