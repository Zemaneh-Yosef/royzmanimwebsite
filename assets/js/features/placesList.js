// @ts-check

// The saved places as links (_includes/places-list.html): in the wide sidebar, the Places window (the slim
// sidebar's and the phone menu's) and on the home page. On a calendar, its place can be saved from here; a place
// can be removed here too, its notifications with it. The places are kept by places.js.

import { settings } from "../settings/handler.js";
import {
	calendarLocation, calendarUrl, isNotified, listPlaces, placeKey, placeName, placePicked, PLACES_EVENT, PLACES_KEY,
	removePlace, savePlace
} from "./places.js";
import { zemanimSettingValues } from "./zmanNotifications.js";

const here = calendarLocation();
const hereKey = here ? placeKey(here.lat, here.lon) : null;

/** @param {{ he: string; en: string }} text */
const say = (text) => settings.language() == "he" ? text.he : text.en;

/** @param {import("./places.js").Place} place @param {boolean} removable */
function placeItem(place, removable) {
	const item = document.createElement("li");
	item.className = "places-item";

	const link = document.createElement("a");
	link.className = "places-link";
	link.href = calendarUrl(place.location);
	link.addEventListener("click", (event) => {
		// a new tab or window keeps this page's settings as they are
		if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
			placePicked(place.location);
	});
	const current = place.key === hereKey;
	if (current) {
		item.classList.add("active");
		link.setAttribute("aria-current", "page");
	}

	const icon = document.createElement("i");
	icon.className = current ? "bi bi-geo-alt-fill" : "bi bi-geo-alt";
	icon.setAttribute("aria-hidden", "true");
	const name = document.createElement("span");
	name.className = "places-name";
	name.dir = "auto";
	name.textContent = placeName(place);
	link.append(icon, name);

	if (isNotified(place) && Object.values(place.notifications).some((n) => n && n.enabled)) {
		const bell = document.createElement("i");
		bell.className = "bi bi-bell-fill places-bell";
		bell.title = say({ he: "מקבל התראות", en: "Gets notifications" });
		link.append(bell);
	}
	item.append(link);

	if (removable) {
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "btn btn-sm places-remove";
		remove.setAttribute("aria-label", say({ he: `הסר את ${placeName(place)}`, en: `Remove ${placeName(place)}` }));
		remove.title = say({ he: "הסר", en: "Remove" });
		remove.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
		remove.addEventListener("click", () => {
			if (isNotified(place) && !confirm(say({
				he: `להסיר את ${placeName(place)}? גם ההתראות שלו יימחקו.`,
				en: `Remove ${placeName(place)}? Its notifications will stop too.`
			}))) return;
			removePlace(place.key);
		});
		item.append(remove);
	}
	return item;
}

function render() {
	const places = listPlaces();
	const saved = !!hereKey && places.some((p) => p.key === hereKey);

	for (const container of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("[data-places-container]"))) {
		const linksOnly = container.hasAttribute("data-places-links-only");
		const list = /** @type {HTMLElement} */ (container.querySelector("[data-places-list]"));
		list.replaceChildren(...places.map((p) => placeItem(p, !linksOnly)));
		container.querySelector("[data-places-empty]")?.classList.toggle("d-none", places.length > 0);
		container.querySelector("[data-places-save]")?.classList.toggle("d-none", !here || saved);
	}
	// the home page's section only shows with something in it
	document.querySelectorAll("[data-places-section]").forEach((elem) => elem.classList.toggle("d-none", places.length === 0));
}

function setup() {
	if (!document.querySelector("[data-places-container]")) return;

	if (here) {
		const hereName = here.name || `${here.lat.toFixed(3)}, ${here.lon.toFixed(3)}`;
		document.querySelectorAll("[data-places-here]").forEach((elem) => elem.textContent = hereName);
		document.querySelectorAll("[data-places-save]").forEach((button) =>
			button.addEventListener("click", () => savePlace(here, zemanimSettingValues())));
	}

	window.addEventListener(PLACES_EVENT, render);
	window.addEventListener("storage", (event) => { if (event.key === PLACES_KEY) render(); });
	render();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
else setup();
