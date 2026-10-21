// @ts-check
/**
 * solar-icons.js — the icons in front of Sunrise and Sunset on the calendar, and the line about them at the
 * top of their dropdowns: which sunrise / sunset it is (sea level, elevated, visible over the terrain, or an
 * estimate of the visible one while it is computed) and what air its refraction was traced through (a weather
 * forecast, typical air for the date, monthly averages, or none). Reads the `solar` field getZmanimInfo gives
 * those two zemanim (WebsiteCalendar.js).
 */

/** @typedef {import("./WebsiteCalendar.js").solarInfo} SolarInfo */
/** @typedef {{ he: string, "he-Latn": string, en?: string }} Tri */
/** @typedef {{ icon: string, sunrise: Tri, sunset: Tri }} KindText */

/** @type {Record<SolarInfo['kind'], KindText>} */
const KINDS = {
	'sea-level': {
		icon: "bi-water",
		sunrise: { he: "הנץ בגובה פני הים (ללא פני השטח)", "he-Latn": "Sea-level sunrise (no terrain)" },
		sunset: { he: "שקיעה בגובה פני הים", "he-Latn": "Sea-level sunset" }
	},
	'elevated': {
		icon: "bi-triangle",
		sunrise: { he: "הנץ מגובה המקום", "he-Latn": "Sunrise from the location's elevation" },
		sunset: { he: "שקיעה מגובה המקום", "he-Latn": "Sunset from the location's elevation" }
	},
	'visible': {
		icon: "bi-eye-fill",
		sunrise: { he: "הנץ הנראה מעל פני השטח", "he-Latn": "Visible sunrise over the terrain" },
		sunset: { he: "שקיעה נראית מעל פני השטח", "he-Latn": "Visible sunset over the terrain" }
	},
	'visible-estimated': {
		icon: "bi-hourglass-split",
		sunrise: { he: "הנץ הנראה – הערכה עד שהחישוב יסתיים", "he-Latn": "Visible sunrise – estimated until the calculation finishes" },
		sunset: { he: "שקיעה נראית – הערכה עד שהחישוב יסתיים", "he-Latn": "Visible sunset – estimated until the calculation finishes" }
	}
};

/** @type {Record<SolarInfo['air'], { icon: string, text: Tri }>} */
const AIRS = {
	'forecast-path': {
		icon: "bi-cloud-sun-fill",
		text: { he: "תחזית מזג אוויר לאורך קו הראייה", "he-Latn": "Weather forecast along the line of sight" }
	},
	'forecast-point': {
		icon: "bi-thermometer-sun",
		text: { he: "תחזית מזג אוויר במקום (טמפרטורה אחת)", "he-Latn": "Weather forecast at the location (one temperature)" }
	},
	'climatology': {
		icon: "bi-bar-chart-line",
		text: { he: "אוויר אופייני לתאריך (מעבר לטווח התחזית)", "he-Latn": "Typical air for the date (beyond the forecast)" }
	},
	'normals': {
		icon: "bi-calendar-month",
		text: { he: "טמפרטורות ממוצעות לחודש", "he-Latn": "Monthly average temperatures" }
	},
	'standard': {
		icon: "bi-globe2",
		text: { he: "שבירה ממוצעת תקנית (34.48′) – אין נתוני מזג אוויר", "he-Latn": "Standard average refraction (34.48′) – no weather data" }
	}
};

/** @type {(keyof Tri)[]} */
const LANGS = ["he", "he-Latn", "en"];

/** @param {Tri} t @param {keyof Tri} lang */
const inLang = (t, lang) => t[lang] ?? t["he-Latn"];

/**
 * One icon per language (the page shows the one in its language), so the tooltip is in that language too.
 * @param {string} icon @param {Tri} text
 */
function icon(icon, text) {
	const frag = document.createDocumentFragment();
	for (const lang of LANGS) {
		const i = document.createElement("i");
		i.className = `bi ${icon} lang lang-${lang}`;
		i.title = inLang(text, lang);
		i.setAttribute("role", "img");
		i.setAttribute("aria-label", i.title);
		frag.appendChild(i);
	}
	return frag;
}

/** @param {Tri} t */
function tri(t) {
	const frag = document.createDocumentFragment();
	for (const lang of LANGS) {
		const span = document.createElement("span");
		span.className = `lang lang-${lang}`;
		span.textContent = inLang(t, lang);
		frag.appendChild(span);
	}
	return frag;
}

/**
 * Put the icons in front of a sunrise / sunset row's name and the explanation at the top of its dropdown;
 * without `solar` (not computed) both are removed.
 * @param {HTMLElement} timeSlot the zeman's <details>
 * @param {'sunrise'|'sunset'} event
 * @param {SolarInfo | undefined} solar
 */
export function renderSolarIcons(timeSlot, event, solar) {
	const text = timeSlot.querySelector(":scope > summary > .accordianText");
	const content = timeSlot.querySelector(":scope > .accordianContent");
	let icons = text?.querySelector(":scope > .solarIcons");
	let note = content?.querySelector(":scope > .solarNote");
	if (!solar) {
		icons?.remove();
		note?.remove();
		return;
	}

	const kind = KINDS[solar.kind], air = AIRS[solar.air];
	if (text) {
		if (!icons) {
			icons = document.createElement("span");
			icons.className = "solarIcons";
			text.prepend(icons);
		}
		icons.replaceChildren(icon(kind.icon, kind[event]), icon(air.icon, air.text));
	}

	if (content) {
		if (!note) {
			note = document.createElement("p");
			note.className = "solarNote small text-body-secondary";
			content.prepend(note);
		}
		const airLine = document.createElement("span");
		airLine.append(icon(air.icon, air.text), " ", tri(air.text));
		if (Number.isFinite(solar.temperatureC)) {
			const temp = document.createElement("span");
			temp.dir = "ltr";
			temp.textContent = `${solar.temperatureC.toFixed(1)} °C`;
			airLine.append(" · ", temp);
		}

		const details = document.createElement("a");
		details.href = "#";
		details.setAttribute("data-bs-toggle", "modal");
		details.setAttribute("data-bs-target", "#locationModal");
		details.append(tri({ he: "פרטים נוספים", "he-Latn": "More details" }));

		const kindLine = document.createElement("span");
		kindLine.append(icon(kind.icon, kind[event]), " ", tri(kind[event]));
		note.replaceChildren(kindLine, document.createElement("br"), airLine, document.createElement("br"), details);
	}
}
