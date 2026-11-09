// @ts-check
/**
 * The home page's location search (location.js) for the zmanim site: in the visitor's language, and once a
 * place is chosen, the defaults for Israel or abroad and the calendar for that place.
 */

import { configureLocationSearch } from "./location.js";
import { settings } from "./settings/handler.js";
import { isInIsrael, applyLocationDefaults } from "./misc/israel.js";

configureLocationSearch({
	language: settings.language,
	onChosen(geoLocation) {
		applyLocationDefaults(isInIsrael(geoLocation.lat, geoLocation.long));

		const typedGL = Object.entries(geoLocation).map(([key, value]) => [key, (typeof value == 'number' ? value.toString() : value)]);
		window.location.href = "calendar?" + new URLSearchParams(Object.fromEntries(typedGL)).toString();
	}
});

// A link to the home page can open the tekufa explanation (?modalShow=tekufa)
document.addEventListener("DOMContentLoaded", () => {
	if (new URLSearchParams(window.location.search).get('modalShow') == 'tekufa')
		// @ts-ignore
		window.bootstrap.Modal.getOrCreateInstance(document.getElementById("tekufaModal")).show();
});
