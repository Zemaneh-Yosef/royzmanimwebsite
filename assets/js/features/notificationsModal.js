// @ts-check

// The calendar's Notifications window (_includes/modals/notifications.html): subscribe to the place on screen,
// choose its zemanim and how long before each, and see or turn off the other places this browser is subscribed to.
// Turning a place's notifications off keeps it saved (places.js); the sidebar's Places list removes it altogether.
// Places and choices are kept by zmanNotifications.js; pushNotifications.js keeps the notification server in step.

import { settings } from "../settings/handler.js";
import {
	addPlace, calendarLocation, calendarUrl, clampMinutes, getNotifiedPlace, getPlace, getPref, migrateToPlaces, notifiedPlaces,
	permissionState, placeKey, PLACES_EVENT, PLACES_KEY, refreshPlaceSettings, requestPermission, savePref, showNotification,
	stopNotifications, zemanimSettingValues
} from "./zmanNotifications.js";
import { pushStatus, pushSupported, PUSH_EVENT, scheduleSync, serverPlaces, syncPush } from "./pushNotifications.js";

const here = calendarLocation();
const hereKey = here ? placeKey(here.lat, here.lon) : null;

// before places, one set of choices for whichever calendar was open: make it a place (the server's, if it had one)
const migrated = migrateToPlaces(here, zemanimSettingValues(), serverPlaces);

/**
 * The calendar was rebuilt (a new setting): a saved place keeps the settings its calendar shows, and the
 * server gets them (pushNotifications.js listens for the change)
 */
export function calendarChanged() {
	if (hereKey && getPlace(hereKey)) refreshPlaceSettings(hereKey, zemanimSettingValues());
	scheduleSync();
}

/** @param {Element} root @param {string} selector */
const all = (root, selector) => /** @type {HTMLElement[]} */ ([...root.querySelectorAll(selector)]);

function setup() {
	const modal = document.getElementById("notificationsModal");
	const root = document.getElementById("zmanNotificationSettings");
	if (!modal || !root || !here || !hereKey) return;
	const key = hereKey;

	all(modal, "[data-notif-place-name]").forEach((elem) => elem.textContent = here.name || `${here.lat.toFixed(3)}, ${here.lon.toFixed(3)}`);

	const status = /** @type {HTMLElement} */ (root.querySelector("[data-notif-status]"));
	const allowButton = /** @type {HTMLElement} */ (root.querySelector("[data-notif-allow]"));
	const testButton = /** @type {HTMLElement} */ (root.querySelector("[data-notif-test]"));
	const toggle = /** @type {HTMLInputElement} */ (root.querySelector("[data-place-toggle]"));
	const rows = all(root, "[data-notif-key]");
	const others = /** @type {HTMLElement} */ (root.querySelector("[data-other-places]"));
	const othersList = /** @type {HTMLElement} */ (root.querySelector("[data-other-places-list]"));
	const otherTemplate = /** @type {HTMLTemplateElement} */ (root.querySelector("[data-other-place-template]"));
	/** @type {string | null} a note that isn't the server's state ("full") */
	let note = null;

	const render = () => {
		const permission = permissionState();
		all(status, "[data-notif-state]").forEach((elem) => elem.classList.toggle("d-none", elem.getAttribute("data-notif-state") !== permission));
		status.classList.remove("alert-info", "alert-success", "alert-warning", "alert-secondary");
		status.classList.add({ granted: "alert-success", denied: "alert-warning", unsupported: "alert-secondary" }[permission] || "alert-info");
		allowButton.classList.toggle("d-none", permission !== "default");
		testButton.classList.toggle("d-none", permission !== "granted");

		const place = getNotifiedPlace(key);
		root.dataset.subscribed = place ? "true" : "false";
		toggle.checked = !!place;
		toggle.disabled = permission === "denied" || permission === "unsupported";

		const push = pushSupported();
		all(root, "[data-delivery]").forEach((elem) => elem.classList.toggle("d-none", elem.getAttribute("data-delivery") !== (push ? "push" : "local")));
		const server = pushStatus();
		let shown = note;
		if (!shown && place && push) {
			if (server.syncing) shown = "syncing";
			else if (server.error && server.error !== "permission") shown = "error";
			else if (server.synced?.places.includes(key)) shown = "synced";
		}
		all(root, "[data-push-state]").forEach((elem) => elem.classList.toggle("d-none", elem.getAttribute("data-push-state") !== shown));
		/** @type {HTMLElement} */ (root.querySelector("[data-push-error]")).textContent = shown === "error" ? server.error ?? "" : "";

		for (const row of rows) {
			const zman = /** @type {string} */ (row.getAttribute("data-notif-key"));
			const pref = getPref(key, zman);
			const enabled = /** @type {HTMLInputElement} */ (row.querySelector("[data-notif-enabled]"));
			const minutes = /** @type {HTMLInputElement} */ (row.querySelector("[data-notif-minutes]"));
			enabled.checked = !!place && pref.enabled;
			enabled.disabled = !place;
			if (document.activeElement !== minutes) minutes.value = pref.minutes.toString();
			minutes.disabled = !place || !pref.enabled;
		}

		const rest = notifiedPlaces().filter((p) => p.key !== key);
		others.classList.toggle("d-none", rest.length === 0);
		othersList.replaceChildren(...rest.map((p) => {
			const item = /** @type {HTMLElement} */ (/** @type {DocumentFragment} */ (otherTemplate.content.cloneNode(true)).firstElementChild);
			/** @type {HTMLAnchorElement} */ (item.querySelector("[data-place-link]")).href = calendarUrl(p.location);
			/** @type {HTMLElement} */ (item.querySelector("[data-place-name]")).textContent = p.location.name || p.key;
			const count = Object.values(p.notifications).filter((n) => n && n.enabled).length;
			/** @type {HTMLElement} */ (item.querySelector("[data-place-count]")).textContent = count ? `🔔 ${count}` : "";
			/** @type {HTMLElement} */ (item.querySelector("[data-place-remove]")).addEventListener("click", () => stopNotifications(p.key));
			return item;
		}));
	};

	const askPermission = async () => {
		await requestPermission();
		render();
		scheduleSync();
	};

	toggle.addEventListener("change", async () => {
		note = null;
		if (!toggle.checked) {
			stopNotifications(key);
			return render();
		}
		if (permissionState() === "default") await requestPermission();
		if (permissionState() !== "granted") {
			toggle.checked = false;
			return render();
		}
		if (!addPlace(here, zemanimSettingValues())) {
			note = "full";
			toggle.checked = false;
		}
		render();
	});

	for (const row of rows) {
		const zman = /** @type {string} */ (row.getAttribute("data-notif-key"));
		const enabled = /** @type {HTMLInputElement} */ (row.querySelector("[data-notif-enabled]"));
		const minutes = /** @type {HTMLInputElement} */ (row.querySelector("[data-notif-minutes]"));
		enabled.addEventListener("change", () => savePref(key, zman, { enabled: enabled.checked }));
		minutes.addEventListener("change", () => {
			const value = clampMinutes(minutes.value);
			minutes.value = value.toString();
			savePref(key, zman, { minutes: value });
		});
	}

	allowButton.addEventListener("click", askPermission);
	testButton.addEventListener("click", () => {
		const language = settings.language();
		showNotification(language == "he" ? "זמני יוסף" : "Zemaneh Yosef", {
			body: language == "he" ? "כך ייראו התראות הזמנים." : "This is how Zeman notifications will look.",
			tag: "zman-test"
		});
	});

	window.addEventListener(PLACES_EVENT, render);
	window.addEventListener(PUSH_EVENT, render);
	window.addEventListener("storage", (event) => { if (event.key === PLACES_KEY) render(); });
	// permission can be changed in the browser's site settings while the page is open
	modal.addEventListener("show.bs.modal", () => { note = null; render(); });
	render();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
else setup();

// every visit: make sure the server has what this browser has (a no-op when nothing changed)
migrated.then(() => { if (notifiedPlaces().length || pushStatus().synced) syncPush(); });
