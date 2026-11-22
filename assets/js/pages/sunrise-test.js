// @ts-check

/**
 * /sunrise-test: the calendar's zemanim for one place and day, computed three ways side by side, to compare
 * the elevated sunrise and sunset:
 *  - elevation on (the old way): heights measured from sea level (useElevation, no base level);
 *  - elevation off (the old way): sea-level sunrise and sunset;
 *  - the new way: heights measured from the land the horizon lies on (the server's base candidates,
 *    ZemanimConfig.baseLevel), with the seasonal hours at one angle, the lower Sun's, at both ends. Where the
 *    horizon has no base candidates it falls back to the visitor's elevation setting, as the calendar does.
 * Everything else (rulings, weather, horizon, time format) follows the visitor's settings, through the same
 * calculator as /calendar (core/zmanimCore.js ZmanimDay) and its list (_data/zmanim.yml, embedded in the page).
 * The place comes from a list (the 60 places of the elevation report, _data/sunriseTestPlaces.json), the
 * calendar's own place, or typed coordinates; it is kept in this page's URL (p, ll, d), never in the settings.
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { settings } from "../settings/handler.js";
import { ZmanimDay, zmanimListFromData, timeFormat } from "../core/zmanimCore.js";
import { isInIsrael } from "../misc/israel.js";
import { readStoredRefraction, refractionFromStored, refractionFromData, loadFreshRefraction } from "../astro/place-refraction.js";
import { REFRACTION_SERVER } from "../astro/refraction-data.js";

/** @typedef {{ name: string, lat: number, lon: number, elevation: number, tz: string }} Place */
/** @typedef {import("../astro/place-refraction.js").Refraction} Refraction */

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const json = (/** @type {string} */ id) => JSON.parse($(id).textContent ?? "[]");

const zmanimList = zmanimListFromData(json("zmanimData"));
/** @type {(Place & { israel: boolean })[]} */
const PRESETS = json("sunriseTestPlaces");

/**
 * The three columns: what each forces in the visitor's settings. The new way's fallback (no base candidates) is
 * the visitor's own elevation setting, as on the calendar.
 * @type {{ id: string, elevation: (inIsrael: boolean) => boolean, baseLevel: boolean }[]}
 */
const METHODS = [
	{ id: "on", elevation: () => true, baseLevel: false },
	{ id: "off", elevation: () => false, baseLevel: false },
	{ id: "new", elevation: (inIsrael) => settings.calendarToggle.useElevation(inIsrael), baseLevel: true }
];

/** The visitor's settings with one column's elevation and base level @param {typeof METHODS[number]} m */
function settingsFor(m) {
	return {
		...settings,
		calendarToggle: { ...settings.calendarToggle, useElevation: m.elevation, useBaseLevel: () => m.baseLevel }
	};
}

const lang = () => settings.language();
/** @param {string} en @param {string} he */
const tr = (en, he) => lang() == "he" ? he : en;

// ─── State ────────────────────────────────────────────────────────────────────

const url = new URL(window.location.href);
const state = {
	/** @type {Place | null} */
	place: null,
	/** @type {Temporal.PlainDate | null} */
	date: null,
	seconds: url.searchParams.get("sec") !== "0",
	server: url.searchParams.get("srv") || REFRACTION_SERVER,
	/** @type {Refraction} */
	refraction: { atmosphereProvider: null, horizon: null, haze: null },
	/** what the refraction is: "none" | "stored" | "fresh" | "failed" */
	refractionKind: "none",
	/** @type {ZmanimDay[]} */
	days: [],
	/** bumped on every place change, so a slow load for an old place is dropped */
	token: 0
};

/** The calendar's own place (the settings), if it has one @returns {Place | null} */
function calendarPlace() {
	const lat = settings.location.lat(), lon = settings.location.long();
	if (isNaN(lat) || isNaN(lon))
		return null;
	return { name: settings.location.name() || tr("Your calendar's place", "המקום בלוח שלך"), lat, lon,
		elevation: settings.location.elevation(), tz: settings.location.timezone() };
}

/** @param {Place} p */
const placeKey = (p) => `${p.lat},${p.lon}`;

// ─── The place selector ───────────────────────────────────────────────────────

const select = /** @type {HTMLSelectElement} */ ($("stPlace"));

function fillSelect() {
	select.replaceChildren();
	const mine = calendarPlace();
	/** @param {string} label @param {[string, string][]} options */
	const group = (label, options) => {
		const g = document.createElement("optgroup");
		g.label = label;
		for (const [value, text] of options) {
			const o = document.createElement("option");
			o.value = value;
			o.textContent = text;
			g.append(o);
		}
		select.append(g);
	};
	if (mine)
		group(tr("Your calendar", "הלוח שלך"), [["mine", `${mine.name} (${mine.elevation} m)`]]);
	/** @param {boolean} israel @returns {[string, string][]} */
	const presets = (israel) => PRESETS.flatMap((p, i) => p.israel == israel
		? [/** @type {[string, string]} */ ([String(i), `${p.name} (${p.elevation} m)`])] : []);
	group(tr("Israel", "ארץ ישראל"), presets(true));
	group(tr("Abroad", 'חו"ל'), presets(false));
	group(tr("Other", "אחר"), [["custom", tr("Coordinates…", "קואורדינטות…")]]);

	const tzList = $("stTzList");
	for (const tz of Intl.supportedValuesOf("timeZone")) {
		const o = document.createElement("option");
		o.value = tz;
		tzList.append(o);
	}
}

/** The place an option stands for @param {string} value @returns {Place | null} */
function placeOf(value) {
	if (value == "mine")
		return calendarPlace();
	if (value == "custom")
		return customPlace();
	const p = PRESETS[parseInt(value)];
	return p ? { name: p.name, lat: p.lat, lon: p.lon, elevation: p.elevation, tz: p.tz } : null;
}

/** The typed coordinates @returns {Place | null} */
function customPlace() {
	const v = (/** @type {string} */ id) => /** @type {HTMLInputElement} */ ($(id)).value.trim();
	const lat = parseFloat(v("stLat")), lon = parseFloat(v("stLon"));
	const tz = v("stTz") || Intl.DateTimeFormat().resolvedOptions().timeZone;
	if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180) || !Intl.supportedValuesOf("timeZone").includes(tz))
		return null;
	return { name: v("stName") || `${lat}, ${lon}`, lat, lon, elevation: Math.max(0, parseFloat(v("stElev")) || 0), tz };
}

/** @param {Place} p */
function fillCustom(p) {
	/** @type {HTMLInputElement} */ ($("stName")).value = p.name;
	/** @type {HTMLInputElement} */ ($("stLat")).value = String(p.lat);
	/** @type {HTMLInputElement} */ ($("stLon")).value = String(p.lon);
	/** @type {HTMLInputElement} */ ($("stElev")).value = String(p.elevation);
	/** @type {HTMLInputElement} */ ($("stTz")).value = p.tz;
}

function onSelect() {
	const custom = select.value == "custom";
	$("stCustom").classList.toggle("d-none", !custom);
	if (custom) {
		if (state.place) fillCustom(state.place);
		return; // shown once applied
	}
	const p = placeOf(select.value);
	if (p) showPlace(p);
}

/** Move through the list's places (not "custom") @param {number} step */
function stepPlace(step) {
	const values = [...select.options].map(o => o.value).filter(v => v != "custom");
	const at = values.indexOf(select.value);
	select.value = values[(at + step + values.length) % values.length];
	onSelect();
}

// ─── Place, data, calculators ─────────────────────────────────────────────────

/** @param {Place} place */
async function showPlace(place) {
	const token = ++state.token;
	state.place = place;
	if (!state.date)
		state.date = Temporal.Now.plainDateISO(place.tz);
	saveUrl();

	const inIsrael = isInIsrael(place.lat, place.lon);
	const facts = document.createElement("bdi");
	facts.dir = "ltr";
	facts.textContent = `${place.lat.toFixed(4)}, ${place.lon.toFixed(4)} · ${place.elevation} m · ${place.tz}`;
	$("stPlaceInfo").replaceChildren(facts, " · " + (inIsrael ? tr("in Israel", "בארץ ישראל") : tr("outside Israel", 'בחו"ל')));

	// at once without weather, then what is stored, then a fresh download
	state.refraction = { atmosphereProvider: null, horizon: null, haze: null };
	state.refractionKind = "none";
	build();
	const cached = await readStoredRefraction(place.lat, place.lon, 3000);
	if (token !== state.token) return;
	if (cached) {
		state.refraction = refractionFromStored(cached);
		state.refractionKind = "stored";
		build();
	}
	await reload(false, token);
}

/** Download the place's weather and horizon (from storage when fresh) @param {boolean} force @param {number} [token] */
async function reload(force, token = state.token) {
	const place = state.place;
	if (!place) return;
	status(tr("Loading the weather and the horizon…", "טוען מזג אוויר ואופק…"));
	const data = await loadFreshRefraction(place.lat, place.lon,
		{ serverUrl: state.server, force, humidity: settings.refraction.humidity(), seaSurface: settings.refraction.seaSurfaceLayer() },
		() => token === state.token);
	if (token !== state.token) return;
	if (data) {
		state.refraction = refractionFromData(data);
		state.refractionKind = "fresh";
	} else if (state.refractionKind == "none")
		state.refractionKind = "failed";
	build();
}

/** The three calculators for the place, with the data in hand */
function build() {
	const place = /** @type {Place} */ (state.place);
	let geo;
	try {
		geo = new KosherZmanim.GeoLocation(place.name, place.lat, place.lon, place.elevation, place.tz);
	} catch (e) {
		status(tr("That place can't be used: ", "אי אפשר להשתמש במקום הזה: ") + e);
		return;
	}
	const dtF = timeFormat({ language: lang(), hourCycle: settings.timeFormat(), seconds: state.seconds });
	state.days = METHODS.map(m => new ZmanimDay({
		geoLocation: geo, settings: /** @type {any} */ (settingsFor(m)), zmanimList, dtF,
		refraction: state.refraction, date: /** @type {Temporal.PlainDate} */ (state.date)
	}));
	render();
}

// ─── Render ───────────────────────────────────────────────────────────────────

/** @param {string} text */
function status(text) {
	$("stStatus").textContent = text;
}

/** Whether the horizon has the server's base candidates */
function hasBaseCandidates() {
	const h = /** @type {any} */ (state.refraction.horizon);
	return !!h?.points?.some((/** @type {any} */ p) => ["sunrise", "sunset"].some(s => p[s]?.some((/** @type {any} */ e) => e.baseCandidates)));
}

/** "+2:33" / "−0:05" @param {number} seconds */
function signed(seconds) {
	const s = Math.round(Math.abs(seconds));
	return (seconds < 0 ? "−" : "+") + `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** @param {Temporal.ZonedDateTime} t */
const fmt = (t) => t.toLocaleString(...state.days[0].dtF);

function render() {
	const date = /** @type {Temporal.PlainDate} */ (state.date);
	const days = state.days;
	if (!days.length) return;
	for (const d of days) d.setDate(date);

	// the date
	const shown = days[0].jCal.dateRenderer(lang());
	// the calendar's own date texts (with <sup> ordinals)
	$("stPrimaryDate").innerHTML = shown.primary.text;
	$("stPrimaryDate").setAttribute("dir", shown.primary.dir);
	$("stSecondaryDate").innerHTML = `<bdi class="text-nowrap" dir="${shown.secondary.dir}">${shown.secondary.text}</bdi> · <bdi class="text-nowrap" dir="${shown.other.dir}">${shown.other.text}</bdi>`;
	/** @type {HTMLInputElement} */ ($("stDate")).value = date.toString();

	// what each column measured from
	const place = /** @type {Place} */ (state.place);
	const base = days[2].zmanCalc.timeRange.current.base;
	const notes = [
		tr(`height ${place.elevation} m above sea level`, `גובה ${place.elevation} מ' מעל פני הים`),
		tr("sea level", "פני הים"),
		base
			? tr(`base: sunrise ${base.sunrise.toFixed(0)} m, sunset ${base.sunset.toFixed(0)} m; hours from the ${base.hoursFrom}'s angle`,
				`בסיס: הנץ ${base.sunrise.toFixed(0)} מ', שקיעה ${base.sunset.toFixed(0)} מ'; השעות לפי זווית ה${base.hoursFrom == "sunrise" ? "הנץ" : "שקיעה"}`)
			: tr(`no base from the server: falls back to elevation ${days[2].config.elevation ? "on" : "off"}`,
				`אין בסיס מהשרת: חוזר לגובה ${days[2].config.elevation ? "מופעל" : "כבוי"}`)
	];
	document.querySelectorAll("[data-col-note]").forEach(el => {
		el.textContent = notes[parseInt(/** @type {string} */ (el.getAttribute("data-col-note")))];
	});

	const kind = {
		none: tr("No weather data yet: standard air, no horizon.", "אין עדיין נתוני מזג אוויר: אוויר תקני, בלי אופק."),
		stored: tr("Stored weather and horizon; checking for newer…", "מזג אוויר ואופק שמורים; בודק אם יש חדשים…"),
		fresh: tr("Weather and horizon loaded.", "מזג האוויר והאופק נטענו."),
		failed: tr("The weather and horizon couldn't be loaded: standard air, no horizon.", "לא ניתן לטעון מזג אוויר ואופק: אוויר תקני, בלי אופק.")
	}[state.refractionKind];
	const horizon = state.refraction.horizon
		? (hasBaseCandidates() ? tr(" The horizon has base candidates.", " באופק יש נקודות בסיס.")
			: tr(" The horizon has no base candidates (the server doesn't send them yet).", " באופק אין נקודות בסיס (השרת עוד לא שולח אותן)."))
		: "";
	status(kind + horizon);

	// the rows: every zman of the calendar's list shown in at least one column, in the list's order
	const infos = days.map(d => d.zemanim());
	const tbody = $("stRows");
	tbody.replaceChildren();
	for (const [key, entry] of Object.entries(zmanimList)) {
		const cells = infos.map(info => info[key]);
		if (!cells.some(c => c && c.display == 1 && c.zDTObj))
			continue;
		const named = cells.find(c => c?.title?.[lang()]);
		addRow(named?.title[lang()] || entry.title[lang()] || entry.title.en,
			cells.map(c => c && c.display == 1 && c.zDTObj ? c.zDTObj : null));
	}

	// what the seasonal hours were counted from (the new way's hours' pair differs from its listed times at one end)
	const section = document.createElement("tr");
	section.className = "stSection";
	const th = document.createElement("th");
	th.colSpan = 4;
	th.textContent = tr("Behind the times", "מאחורי הזמנים");
	section.append(th);
	tbody.append(section);
	const cur = days.map(d => d.zmanCalc.timeRange.current);
	addRow(tr("Listed sunrise", "הנץ המוצג"), cur.map(c => c.listedSunrise));
	addRow(tr("Sunrise the hours count from", "הנץ שממנו נמנות השעות"), cur.map(c => c.sunrise));
	addRow(tr("Listed sunset", "השקיעה המוצגת"), cur.map(c => c.listedSunset));
	addRow(tr("Sunset the hours count from", "השקיעה שעד אליה נמנות השעות"), cur.map(c => c.sunset));
	addRow(tr("Seasonal hour (GRA)", 'שעה זמנית (גר"א)'), cur.map(c => c.ranges.gra), "duration");
}

/**
 * A row: its name and the three columns, the second and third marked where they differ from the first
 * @param {string} name
 * @param {(Temporal.ZonedDateTime | Temporal.Duration | null)[]} values
 * @param {"time" | "duration"} [kind]
 */
function addRow(name, values, kind = "time") {
	const tr_ = document.createElement("tr");
	const th = document.createElement("th");
	th.scope = "row";
	th.innerHTML = name;
	tr_.append(th);
	/** @param {any} v */
	const seconds = (v) => kind == "duration"
		? v.total("seconds") / 12
		: v.epochMilliseconds / 1000;
	values.forEach((v, i) => {
		const td = document.createElement("td");
		td.className = "stTime";
		if (!v) {
			td.textContent = "—";
		} else {
			td.textContent = kind == "duration" ? hms(/** @type {Temporal.Duration} */ (v)) : fmt(/** @type {Temporal.ZonedDateTime} */ (v));
			const first = values[0];
			if (i > 0 && first) {
				const diff = seconds(v) - seconds(first);
				if (Math.abs(diff) >= 0.5) {
					td.classList.add("stChanged");
					const span = document.createElement("span");
					span.className = "stDiff";
					span.dir = "ltr";
					span.textContent = signed(diff);
					td.append(span);
				}
			}
		}
		tr_.append(td);
	});
	$("stRows").append(tr_);
}

/** A twelfth of a day's length, as h:mm:ss @param {Temporal.Duration} day */
function hms(day) {
	const s = Math.round(day.total("seconds") / 12);
	return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── URL ──────────────────────────────────────────────────────────────────────

function saveUrl() {
	const u = new URL(window.location.href);
	for (const k of ["p", "ll"]) u.searchParams.delete(k);
	const v = select.value;
	if (v == "custom" && state.place) {
		const p = state.place;
		u.searchParams.set("ll", [p.lat, p.lon, p.elevation, p.tz, p.name].join(","));
	} else if (v != "mine" && PRESETS[parseInt(v)]) {
		u.searchParams.set("p", PRESETS[parseInt(v)].name);
	}
	if (state.date) u.searchParams.set("d", state.date.toString());
	if (state.seconds) u.searchParams.delete("sec"); else u.searchParams.set("sec", "0");
	if (state.server != REFRACTION_SERVER) u.searchParams.set("srv", state.server); else u.searchParams.delete("srv");
	history.replaceState(history.state, "", u);
}

/** The place and date the URL asks for */
function fromUrl() {
	const d = url.searchParams.get("d");
	if (d) {
		try { state.date = Temporal.PlainDate.from(d); } catch { /* today */ }
	}
	const ll = url.searchParams.get("ll");
	if (ll) {
		const [lat, lon, elevation, tz, ...name] = ll.split(",");
		fillCustom({ name: name.join(","), lat: parseFloat(lat), lon: parseFloat(lon), elevation: parseFloat(elevation) || 0, tz });
		select.value = "custom";
		return;
	}
	const p = url.searchParams.get("p");
	const i = p ? PRESETS.findIndex(x => x.name == p) : -1;
	if (i >= 0) select.value = String(i);
	else if (calendarPlace()) select.value = "mine";
	else select.value = "0";
}

// ─── Wiring ───────────────────────────────────────────────────────────────────

fillSelect();
fromUrl();

select.addEventListener("change", onSelect);
$("stPrevPlace").addEventListener("click", () => stepPlace(-1));
$("stNextPlace").addEventListener("click", () => stepPlace(1));
$("stApply").addEventListener("click", () => {
	const p = customPlace();
	if (p) showPlace(p);
	else status(tr("Give a latitude, a longitude and a time zone.", "יש למלא קו רוחב, קו אורך ואזור זמן."));
});

for (const btn of document.querySelectorAll("#sunriseTest [data-days]"))
	btn.addEventListener("click", () => {
		if (!state.date) return;
		state.date = state.date.add({ days: parseInt(/** @type {string} */ (btn.getAttribute("data-days"))) });
		saveUrl();
		render();
	});
$("stDate").addEventListener("change", () => {
	const v = /** @type {HTMLInputElement} */ ($("stDate")).value;
	if (!v) return;
	state.date = Temporal.PlainDate.from(v);
	saveUrl();
	render();
});
$("stToday").addEventListener("click", () => {
	if (!state.place) return;
	state.date = Temporal.Now.plainDateISO(state.place.tz);
	saveUrl();
	render();
});

const secondsBox = /** @type {HTMLInputElement} */ ($("stSeconds"));
secondsBox.checked = state.seconds;
secondsBox.addEventListener("change", () => {
	state.seconds = secondsBox.checked;
	saveUrl();
	build();
});

const serverBox = /** @type {HTMLInputElement} */ ($("stServer"));
serverBox.value = state.server;
serverBox.addEventListener("change", () => {
	state.server = serverBox.value.trim().replace(/\/+$/, "") || REFRACTION_SERVER;
	serverBox.value = state.server;
	saveUrl();
	reload(true);
});
$("stReload").addEventListener("click", () => reload(true));

// the visitor changed the language or time format in the settings modal
document.addEventListener("zmanimsettingchange", () => {
	const chosen = select.value;
	fillSelect();
	select.value = chosen;
	if (state.place) build();
});

if (select.value == "custom") {
	$("stCustom").classList.remove("d-none");
	const p = customPlace();
	if (p) showPlace(p);
} else {
	const p = placeOf(select.value);
	if (p) showPlace(p);
}
