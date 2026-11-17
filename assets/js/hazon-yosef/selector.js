// @ts-check

/**
 * Hazon Yosef's place selector (#locationSelector): its listed places, then the ones the visitor added
 * (hazon-yosef/search.js stores them in hycal-customLocation), the one chosen last (hycal-selectedLocation,
 * or ?hycal-selectedLocation=), and the change to another. Its own storage only: the calendar's settings
 * never reach this page.
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { isValidJSON } from "../misc/util.js";

const urlParams = new URLSearchParams(window.location.search);
/** @param {string} param */
const settingsURLOverride = (param) => urlParams.get(param) || localStorage.getItem(param);

/**
 * @param {{ onChange: (geoLocation: KosherZmanim.GeoLocation) => void }} options
 * @returns {{ geoLocation: KosherZmanim.GeoLocation; isCustom: () => boolean }} the place shown first, and
 *   whether the one selected was added by the visitor (it isn't shared)
 */
export function setUpLocationSelector({ onChange }) {
	/** @type {import('@material/web/select/outlined-select.js').MdOutlinedSelect} */
	// @ts-ignore
	const matLocSelect = document.getElementById("locationSelector");
	const lastListedIndex = matLocSelect.options.length - 1;

	if (isValidJSON(localStorage.getItem('hycal-customLocation'))) {
		/** @type {import('@material/web/select/select-option.js').MdSelectOption} */
		const header = document.createElement("md-select-option");
		header.disabled = true;

		const headerDiv = document.createElement("div");
		headerDiv.setAttribute("slot", "headline");
		headerDiv.style.fontWeight = "600";
		headerDiv.style.opacity = "0.7";
		headerDiv.style.padding = "6px 0";
		headerDiv.appendChild(document.createTextNode("מיקום מותאם אישית"));
		header.appendChild(headerDiv);
		matLocSelect.appendChild(header);

		for (const customOption of JSON.parse(localStorage.getItem('hycal-customLocation'))) {
			/** @type {import('@material/web/select/select-option.js').MdSelectOption} */
			const optionElem = document.createElement("md-select-option");

			optionElem.setAttribute('value', JSON.stringify({
				lat: customOption.lat,
				lng: customOption.lng,
				elevation: customOption.elevation,
				timezone: customOption.timeZone
			}));

			const optionDiv = document.createElement("div");
			optionDiv.setAttribute("slot", "headline");
			optionDiv.appendChild(document.createTextNode(customOption.name));

			optionElem.displayText = customOption.name;

			optionElem.appendChild(optionDiv);
			matLocSelect.appendChild(optionElem);
		}
	}

	if (settingsURLOverride('hycal-selectedLocation')) {
		const selectedOption = [...matLocSelect.options].find(option => option.textContent.trim() == settingsURLOverride('hycal-selectedLocation'));
		if (selectedOption)
			matLocSelect.select(selectedOption.value);
	}

	const locationGeoList = Array.from(matLocSelect.options).map(option => {
		if (option.disabled)
			return null;

		const geoLData = JSON.parse(option.value);
		return new KosherZmanim.GeoLocation(
			option.textContent.trim(),
			geoLData.lat,
			geoLData.lng,
			geoLData.elevation,
			isValidTimeZone(geoLData.timezone) ? geoLData.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone
		);
	});

	matLocSelect.addEventListener('change', () => {
		const name = matLocSelect.options[matLocSelect.selectedIndex].textContent.trim();
		localStorage.setItem('hycal-selectedLocation', name);
		updateURLParameters({ "hycal-selectedLocation": name });
		onChange(locationGeoList[matLocSelect.selectedIndex]);
	});

	return {
		geoLocation: locationGeoList[matLocSelect.selectedIndex],
		isCustom: () => matLocSelect.selectedIndex > lastListedIndex
	};
}

/** @param {string} tz */
function isValidTimeZone(tz) {
	if (!tz) return false;
	try {
		new Intl.DateTimeFormat("en", { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

/**
 * Set (or with an empty value, remove) URL parameters, as a new history entry
 * @param {Record<string, string>} newParams
 */
function updateURLParameters(newParams) {
	for (const [key, value] of Object.entries(newParams)) {
		if (value)
			urlParams.set(key, value);
		else
			urlParams.delete(key);
	}

	const newUrl = urlParams.toString() ? `?${urlParams.toString()}` : window.location.pathname;
	history.pushState({ params: newParams }, '', newUrl);
}
