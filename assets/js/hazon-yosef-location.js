// @ts-check
/**
 * The Hazon Yosef calendar's location search (location.js). This calendar is in Hebrew and doesn't use the
 * zmanim site's settings: a chosen place is added to its own list of places (hycal-customLocation),
 * selected, and the page reloads with it.
 */

import { configureLocationSearch } from "./location.js";
import { isValidJSON } from "./misc/util.js";

configureLocationSearch({
	language: () => 'he',
	onChosen(geoLocation) {
		const saved = localStorage.getItem('hycal-customLocation');
		/** @type {{ name: string, lat: number, lng: number, elevation: number, timeZone: string }[]} */
		const locationArr = isValidJSON(saved) ? JSON.parse(saved) : [];

		locationArr.push({
			name: geoLocation.locationName,
			lat: geoLocation.lat,
			lng: geoLocation.long,
			elevation: geoLocation.elevation,
			timeZone: geoLocation.timeZone
		});

		localStorage.setItem('hycal-customLocation', JSON.stringify(locationArr));
		localStorage.setItem('hycal-selectedLocation', geoLocation.locationName);
		window.location.reload();
	}
});
