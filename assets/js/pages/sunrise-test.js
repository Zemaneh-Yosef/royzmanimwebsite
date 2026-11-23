// @ts-check

/**
 * /sunrise-test: the calendar's zemanim for one place and day, computed three ways side by side, to compare
 * the elevated sunrise and sunset:
 *  - elevation on (the old way): heights measured from sea level (useElevation, no base level);
 *  - elevation off (the old way): sea-level sunrise and sunset;
 *  - the new way: heights measured from the land the horizon lies on (the server's base candidates,
 *    ZemanimConfig.baseLevel), with the seasonal hours at one angle, the lower Sun's, at both ends. Where the
 *    horizon has no base candidates it falls back to the site's default for the place (on in Israel, off abroad).
 * Everything else (rulings, weather, horizon, time format) follows the visitor's settings, through the same
 * calculator as /calendar (core/zmanimCore.js ZmanimDay) and its list (_data/zmanim.yml, embedded in the page).
 * The place comes from a list (the 60 places of the elevation report, _data/sunriseTestPlaces.json), the
 * calendar's own place, or typed coordinates; it is kept in this page's URL (p, ll, d), never in the settings.
 * Two tabs: one day (every zman), and through the year (tab=year, y): the equinoxes and solstices, and the
 * smallest, largest and average gap between each two ways at sunrise and sunset over every day of the year.
 *
 * The horizon (the refraction server's, for the place's official area) is loaded at once, and asked for again
 * while the server is still computing it; the weather (Open-Meteo and the server's forecasts) only when the
 * visitor ticks it (wx=1), so stepping through places doesn't send Open-Meteo a burst of requests. Without it
 * the air is the calculator's standard air. Either can be left out (hz=0, wx unticked) to see its share.
 *
 * The base level is off everywhere else on the site (zmanimSettings useBaseLevel, ZemanimConfig.baseLevel):
 * this page is the only one that turns it on, for its third column.
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { settings } from "../settings/handler.js";
import { ZmanimDay, zmanimListFromData, timeFormat } from "../core/zmanimCore.js";
import { isInIsrael } from "../misc/israel.js";
import { loadFreshRefraction } from "../astro/place-refraction.js";
import { REFRACTION_SERVER, TERRAIN_VERSION } from "../astro/refraction-data.js";
import { fetchHorizonForArea, fetchTerrainVersion, HorizonPendingError } from "../astro/horizon-client.js";

/** @typedef {{ name: string, lat: number, lon: number, elevation: number, tz: string }} Place */
/** @typedef {import("../astro/place-refraction.js").Refraction} Refraction */

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const json = (/** @type {string} */ id) => JSON.parse($(id).textContent ?? "[]");

const zmanimList = zmanimListFromData(json("zmanimData"));
/** @type {(Place & { israel: boolean })[]} */
const PRESETS = json("sunriseTestPlaces");

/**
 * The three columns: what each forces in the visitor's settings. The new way's fallback (no base candidates) is
 * the site's default for the place (elevation on in Israel, off abroad), not the visitor's own elevation setting:
 * a saved one applies to every place.
 * @type {{ id: string, elevation: (inIsrael: boolean) => boolean, baseLevel: boolean }[]}
 */
const METHODS = [
	{ id: "on", elevation: () => true, baseLevel: false },
	{ id: "off", elevation: () => false, baseLevel: false },
	{ id: "new", elevation: (inIsrael) => inIsrael, baseLevel: true }
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
	/** @type {Refraction} what the calculators are built with (the parts below that are in use) */
	refraction: { atmosphereProvider: null, horizon: null, haze: null },
	useHorizon: url.searchParams.get("hz") !== "0",
	useWeather: url.searchParams.get("wx") === "1",
	/** @type {Refraction['horizon']} */
	horizon: null,
	/** "off" | "loading" | "pending" (the server is computing it) | "ok" | "failed" */
	horizonState: "off",
	/** the error, or how long until it is asked for again */
	horizonNote: "",
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	horizonRetry: undefined,
	/** @type {Pick<Refraction, 'atmosphereProvider' | 'haze'> | null} */
	weather: null,
	/** "off" | "loading" | "ok" | "failed" */
	weatherState: "off",
	/** @type {ZmanimDay[]} */
	days: [],
	/** @type {KosherZmanim.GeoLocation | null} */
	geo: null,
	/** "day" | "year" */
	tab: url.searchParams.get("tab") == "year" ? "year" : "day",
	/** @type {number | null} the year tab's (Gregorian) year */
	year: parseInt(url.searchParams.get("y") ?? "") || null,
	/** the year tab needs scanning again (a new place, data, year or settings) */
	yearDirty: true,
	/** bumped on every year scan, so an old one stops */
	yearToken: 0,
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

	// at once in standard air without a horizon, then with each part as it comes
	clearTimeout(state.horizonRetry);
	state.horizon = null;
	state.weather = null;
	state.horizonState = state.weatherState = "off";
	build();
	loadHorizon(false);
	loadWeather(false);
}

/**
 * The place's horizon from the refraction server: its terrain version first, so the address changes (and no
 * cached copy is used) when the server's terrain or base settings change. A place the server is still
 * computing is asked for again when it says.
 * @param {boolean} force past any cached copy
 */
async function loadHorizon(force) {
	clearTimeout(state.horizonRetry);
	const place = state.place, token = state.token;
	if (!place || !state.useHorizon) return;
	state.horizonState = "loading";
	showStatus();
	try {
		const now = await fetchTerrainVersion(state.server, place.lat, place.lon, { area: true });
		const version = `${TERRAIN_VERSION}.${now.layers ?? "-"}.${now.fine ?? "-"}.${now.algo ?? 1}.${now.base ?? "-"}`
			+ (force ? `.${Date.now()}` : "");
		const horizon = await fetchHorizonForArea(state.server, place.lat, place.lon, { outline: true, version });
		if (token !== state.token) return;
		state.horizon = horizon;
		state.horizonState = "ok";
	} catch (e) {
		if (token !== state.token) return;
		if (e instanceof HorizonPendingError) {
			const s = Math.max(5, Math.round(e.retryAfterS || 15));
			state.horizonState = "pending";
			state.horizonNote = String(s);
			state.horizonRetry = setTimeout(() => { if (token === state.token) loadHorizon(false); }, s * 1000);
			showStatus();
			return;
		}
		state.horizonState = "failed";
		state.horizonNote = /** @type {Error} */ (e).message;
	}
	build();
}

/**
 * The place's weather (from storage when still current, else downloaded), only when the visitor asked for it
 * @param {boolean} force download even if the stored forecast is current
 */
async function loadWeather(force) {
	const place = state.place, token = state.token;
	if (!place || !state.useWeather) return;
	state.weatherState = "loading";
	showStatus();
	const data = await loadFreshRefraction(place.lat, place.lon,
		{ serverUrl: state.server, force, humidity: settings.refraction.humidity(), seaSurface: settings.refraction.seaSurfaceLayer() },
		() => token === state.token);
	if (token !== state.token) return;
	if (data) {
		state.weather = { atmosphereProvider: data.provider, haze: data.haze };
		state.weatherState = "ok";
	} else
		state.weatherState = "failed";
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
	state.refraction = {
		atmosphereProvider: state.useWeather ? state.weather?.atmosphereProvider ?? null : null,
		horizon: state.useHorizon ? state.horizon : null,
		haze: state.useWeather ? state.weather?.haze ?? null : null
	};
	state.geo = geo;
	state.days = makeDays(geo);
	state.yearDirty = true;
	render();
	if (state.tab == "year")
		scanYear();
}

/** One calculator per column, with the data in hand @param {KosherZmanim.GeoLocation} geo */
function makeDays(geo) {
	const dtF = timeFormat({ language: lang(), hourCycle: settings.timeFormat(), seconds: state.seconds });
	return METHODS.map(m => new ZmanimDay({
		geoLocation: geo, settings: /** @type {any} */ (settingsFor(m)), zmanimList, dtF,
		refraction: state.refraction, date: /** @type {Temporal.PlainDate} */ (state.date)
	}));
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

/** What the horizon says about the base level, in words */
function horizonBase() {
	const h = /** @type {any} */ (state.refraction.horizon);
	if (!h) return "";
	if (hasBaseCandidates()) return tr("with base candidates", "עם נקודות בסיס");
	const statuses = [...new Set((h.points ?? []).map((/** @type {any} */ p) => p.base?.status).filter(Boolean))];
	if (!statuses.length)
		return tr("without base candidates (this server doesn't send them)", "בלי נקודות בסיס (השרת הזה לא שולח אותן)");
	return tr(`without base candidates (the server: ${statuses.join(", ")})`, `בלי נקודות בסיס (השרת: ${statuses.join(", ")})`);
}

/** Why the new way has no base, for the notes over its column */
function noBaseReason() {
	if (!state.useHorizon) return tr("the horizon is turned off", "האופק כבוי");
	if (!state.refraction.horizon)
		return state.horizonState == "pending" || state.horizonState == "loading"
			? tr("the horizon hasn't arrived yet", "האופק עוד לא הגיע")
			: tr("no horizon", "אין אופק");
	if (!hasBaseCandidates()) return tr("the horizon has no base candidates", "באופק אין נקודות בסיס");
	return tr("no candidates in the Sun's direction", "אין נקודות בסיס בכיוון השמש");
}

/** The horizon's and the weather's state, each on its own line */
function showStatus() {
	const horizon = {
		off: tr("off: no visible sunrise, no base level", "כבוי: בלי הנץ הנראה ובלי גובה בסיס"),
		loading: tr("loading…", "טוען…"),
		pending: tr(`the server is still computing this place's horizon (its first request); asking again in ${state.horizonNote} s…`,
			`השרת עוד מחשב את האופק של המקום הזה (בקשה ראשונה); שואל שוב בעוד ${state.horizonNote} שניות…`),
		ok: tr("loaded, ", "נטען, ") + horizonBase(),
		failed: tr(`couldn't be loaded (${state.horizonNote})`, `לא ניתן לטעון (${state.horizonNote})`)
	}[state.useHorizon ? state.horizonState : "off"];
	const weather = {
		off: tr("standard air (tick \"Use the weather\" under Options to load it)", "אוויר תקני (סמן \"השתמש במזג האוויר\" באפשרויות כדי לטעון)"),
		loading: tr("loading…", "טוען…"),
		ok: tr("loaded", "נטען"),
		failed: tr("couldn't be loaded: standard air", "לא ניתן לטעון: אוויר תקני")
	}[state.useWeather ? state.weatherState : "off"];
	const line = (/** @type {string} */ name, /** @type {string} */ text) => {
		const div = document.createElement("div");
		const b = document.createElement("b");
		b.textContent = name + ": ";
		div.append(b, text);
		return div;
	};
	$("stStatus").replaceChildren(line(tr("Horizon", "אופק"), horizon), line(tr("Weather", "מזג אוויר"), weather));
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
	const base = days[2].zmanCalc.timeRange.current.base;
	colNotes("data-col-note", base
		? tr(`base: sunrise ${base.sunrise.toFixed(0)} m, sunset ${base.sunset.toFixed(0)} m; hours from the ${base.hoursFrom}'s angle`,
			`בסיס: הנץ ${base.sunrise.toFixed(0)} מ', שקיעה ${base.sunset.toFixed(0)} מ'; השעות לפי זווית ה${base.hoursFrom == "sunrise" ? "הנץ" : "שקיעה"}`)
		: tr(`no base (${noBaseReason()}): falls back to elevation ${days[2].config.elevation ? "on" : "off"}`,
			`אין בסיס (${noBaseReason()}): חוזר לגובה ${days[2].config.elevation ? "מופעל" : "כבוי"}`));

	showStatus();
	if (state.tab != "day") return;

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
	addTimeRangeRows(days, tbody);
}

/** The listed and hours' sunrise and sunset, and the seasonal hour @param {ZmanimDay[]} days @param {HTMLElement} tbody */
function addTimeRangeRows(days, tbody) {
	const cur = days.map(d => d.zmanCalc.timeRange.current);
	addRow(tr("Listed sunrise", "הנץ המוצג"), cur.map(c => c.listedSunrise), "time", tbody);
	addRow(tr("Sunrise the hours count from", "הנץ שממנו נמנות השעות"), cur.map(c => c.sunrise), "time", tbody);
	addRow(tr("Listed sunset", "השקיעה המוצגת"), cur.map(c => c.listedSunset), "time", tbody);
	addRow(tr("Sunset the hours count from", "השקיעה שעד אליה נמנות השעות"), cur.map(c => c.sunset), "time", tbody);
	addRow(tr("Seasonal hour (GRA)", 'שעה זמנית (גר"א)'), cur.map(c => c.ranges.gra), "duration", tbody);
}

/**
 * The notes over the three columns: what each measured from
 * @param {string} attr the table's note attribute @param {string} newNote the new way's
 */
function colNotes(attr, newNote) {
	const place = /** @type {Place} */ (state.place);
	const notes = [
		tr(`height ${place.elevation} m above sea level`, `גובה ${place.elevation} מ' מעל פני הים`),
		tr("sea level", "פני הים"),
		newNote
	];
	const ref = refIndex();
	notes[ref] += tr(" · today's calendar: the others are compared with it", " · הלוח של היום: האחרות מושוות אליה");
	document.querySelectorAll(`[${attr}]`).forEach(el => {
		const i = parseInt(/** @type {string} */ (el.getAttribute(attr)));
		el.textContent = notes[i];
		el.closest("th")?.classList.toggle("stRef", i == ref);
	});
}

/**
 * The column the others are compared with: what the calendar shows today at the place shown, by the site's
 * default (elevation on in Israel, off abroad): 0 elevation on, 1 elevation off. Not the visitor's own
 * elevation setting: a saved one applies to every place, so one chosen for a calendar abroad would compare
 * Jerusalem with sea level.
 */
function refIndex() {
	const place = state.place;
	if (!place) return 0;
	return isInIsrael(place.lat, place.lon) ? 0 : 1;
}

/** A section heading across the table @param {HTMLElement} tbody @param {string | Node} content */
function addSection(tbody, content) {
	const row = document.createElement("tr");
	row.className = "stSection";
	const th = document.createElement("th");
	th.colSpan = 4;
	th.append(content);
	row.append(th);
	tbody.append(row);
}

/**
 * A row: its name and the three columns, the others marked where they differ from today's calendar (refIndex)
 * @param {string} name
 * @param {(Temporal.ZonedDateTime | Temporal.Duration | null)[]} values
 * @param {"time" | "duration"} [kind]
 * @param {HTMLElement} [tbody]
 */
function addRow(name, values, kind = "time", tbody = $("stRows")) {
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
			const ref = refIndex(), first = values[ref];
			if (i != ref && first) {
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
	tbody.append(tr_);
}

/** A twelfth of a day's length, as h:mm:ss @param {Temporal.Duration} day */
function hms(day) {
	const s = Math.round(day.total("seconds") / 12);
	return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Through the year ─────────────────────────────────────────────────────────

/**
 * The Sun's apparent longitude in degrees at a moment (Meeus, Astronomical Algorithms ch. 25, low precision:
 * about 0.01°, a quarter of an hour of the Sun's motion), to find the day of an equinox or solstice
 * @param {number} ms milliseconds since the epoch
 */
function sunLongitude(ms) {
	const T = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
	const rad = Math.PI / 180;
	const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
	const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
	const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
		+ 0.000289 * Math.sin(3 * M);
	const omega = (125.04 - 1934.136 * T) * rad;
	return ((L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) % 360 + 360) % 360;
}

/**
 * The year's equinoxes and solstices: the day, in the place's time zone, in which the Sun's longitude passes
 * 0°, 90°, 180° and 270°
 * @param {number} year @param {string} tz
 * @returns {{ en: string, he: string, date: Temporal.PlainDate }[]}
 */
function keyDays(year, tz) {
	const first = Temporal.PlainDate.from({ year, month: 1, day: 1 });
	const at = (/** @type {number} */ i) => first.add({ days: i });
	const lon = (/** @type {number} */ i) => sunLongitude(at(i).toZonedDateTime({ timeZone: tz }).epochMilliseconds);
	/** the day whose start is before the Sun reaches deg and whose end after it @param {number} deg */
	const dayOf = (deg) => {
		for (let i = 0; i < first.daysInYear; i++) {
			const a = (lon(i) - deg + 540) % 360 - 180, b = (lon(i + 1) - deg + 540) % 360 - 180;
			if (a < 0 && b >= 0) return at(i);
		}
		return first;
	};
	return [
		{ en: "March equinox", he: "תקופת ניסן", date: dayOf(0) },
		{ en: "June solstice", he: "תקופת תמוז", date: dayOf(90) },
		{ en: "September equinox", he: "תקופת תשרי", date: dayOf(180) },
		{ en: "December solstice", he: "תקופת טבת", date: dayOf(270) }
	];
}

/** A link that shows a day in the one-day tab @param {Temporal.PlainDate} date @param {string} [label] */
function dayLink(date, label) {
	const a = document.createElement("a");
	a.href = "#";
	a.className = "stDay";
	a.textContent = label ?? date.toLocaleString(lang() == "he" ? "he" : "en", { day: "numeric", month: "short", year: "numeric" });
	a.addEventListener("click", (e) => {
		e.preventDefault();
		state.date = date;
		setTab("day");
	});
	return a;
}

const yearBox = /** @type {HTMLInputElement} */ ($("stYear"));

/**
 * Work out every day of the year three ways (a few days at a time, so the page stays live), then show the
 * equinoxes and solstices and the gaps between the ways
 */
async function scanYear() {
	const place = state.place;
	if (!place || !state.geo) return;
	if (!state.year)
		state.year = (state.date ?? Temporal.Now.plainDateISO(place.tz)).year;
	yearBox.value = String(state.year);
	saveUrl();
	const token = ++state.yearToken;
	state.yearDirty = false;
	const year = state.year;

	// calculators of their own, so the one-day tab's keep their date
	const days = makeDays(state.geo);
	const first = Temporal.PlainDate.from({ year, month: 1, day: 1 });
	const n = first.daysInYear;
	/** seconds since the epoch of each column's listed sunrise and sunset, NaN where there is none */
	const rise = METHODS.map(() => new Float64Array(n).fill(NaN));
	const set = METHODS.map(() => new Float64Array(n).fill(NaN));
	let withBase = 0;

	$("stKeyRows").replaceChildren();
	$("stExtremeRows").replaceChildren();
	for (let i = 0; i < n; i++) {
		if (i % 10 == 0) {
			$("stYearStatus").textContent = tr(`Working out ${year}: ${Math.round(100 * i / n)}%…`, `מחשב את ${year}: ${Math.round(100 * i / n)}%…`);
			await new Promise(r => setTimeout(r, 0));
			if (token !== state.yearToken) return;
		}
		const date = first.add({ days: i });
		days.forEach((d, m) => {
			try {
				d.setDate(date);
				const cur = d.zmanCalc.timeRange.current;
				if (cur.listedSunrise) rise[m][i] = cur.listedSunrise.epochMilliseconds / 1000;
				if (cur.listedSunset) set[m][i] = cur.listedSunset.epochMilliseconds / 1000;
				if (m == 2 && cur.base) withBase++;
			} catch { /* no sunrise or sunset that day (polar): left out */ }
		});
	}
	if (token !== state.yearToken) return;

	$("stYearStatus").textContent = withBase
		? tr(`The new way had a base level on ${withBase} of the year's ${n} days; on the rest it fell back.`,
			`לשיטה החדשה היה גובה בסיס ב-${withBase} מתוך ${n} ימי השנה; בשאר חזרה לברירת המחדל.`)
		: tr(`The new way had no base level on any day (${noBaseReason()}): it fell back to elevation ${days[2].config.elevation ? "on" : "off"} all year.`,
			`לשיטה החדשה לא היה גובה בסיס באף יום (${noBaseReason()}): היא חזרה לגובה ${days[2].config.elevation ? "מופעל" : "כבוי"} כל השנה.`);
	colNotes("data-col-note-y", withBase
		? tr(`base level on ${withBase} of ${n} days`, `גובה בסיס ב-${withBase} מתוך ${n} ימים`)
		: tr(`no base: elevation ${days[2].config.elevation ? "on" : "off"}`, `אין בסיס: גובה ${days[2].config.elevation ? "מופעל" : "כבוי"}`));

	// the equinoxes and solstices
	const keyRows = $("stKeyRows");
	for (const k of keyDays(year, place.tz)) {
		days.forEach(d => d.setDate(k.date));
		const label = document.createElement("span");
		label.append(tr(k.en, k.he) + " · ", dayLink(k.date));
		addSection(keyRows, label);
		const cur = days.map(d => d.zmanCalc.timeRange.current);
		addRow(tr("Sunrise", "הנץ"), cur.map(c => c.listedSunrise ?? null), "time", keyRows);
		addRow(tr("Sunset", "שקיעה"), cur.map(c => c.listedSunset ?? null), "time", keyRows);
		addRow(tr("Seasonal hour (GRA)", 'שעה זמנית (גר"א)'), cur.map(c => c.ranges?.gra ?? null), "duration", keyRows);
	}

	// the gaps between each two ways
	const names = [tr("elevation on", "גובה מופעל"), tr("elevation off", "גובה כבוי"), tr("the new way", "השיטה החדשה")];
	// each against today's calendar, then the new way against the other old way
	const ref = refIndex(), other = 1 - ref;
	const pairs = [[2, ref], [other, ref], [2, other]];
	const ext = $("stExtremeRows");
	for (const [event, series] of /** @type {[string, Float64Array[]][]} */ ([[tr("Sunrise", "הנץ"), rise], [tr("Sunset", "שקיעה"), set]])) {
		addSection(ext, event);
		for (const [a, b] of pairs) {
			let lo = Infinity, hi = -Infinity, loAt = -1, hiAt = -1, sum = 0, count = 0;
			for (let i = 0; i < n; i++) {
				const g = series[a][i] - series[b][i];
				if (!Number.isFinite(g)) continue;
				sum += g; count++;
				if (g < lo) { lo = g; loAt = i; }
				if (g > hi) { hi = g; hiAt = i; }
			}
			const row = document.createElement("tr");
			const th = document.createElement("th");
			th.scope = "row";
			th.textContent = `${names[a]} − ${names[b]}`;
			row.append(th);
			/** @param {number} g @param {number} at */
			const cell = (g, at) => {
				const td = document.createElement("td");
				td.className = "stTime";
				if (at < 0) { td.textContent = "—"; return td; }
				const v = document.createElement("span");
				v.dir = "ltr";
				v.textContent = signed(g);
				td.append(v);
				if (Math.abs(g) >= 0.5) td.classList.add("stChanged");
				const when = document.createElement("span");
				when.className = "stDiff";
				when.append(dayLink(first.add({ days: at })));
				td.append(when);
				return td;
			};
			const mean = document.createElement("td");
			mean.className = "stTime";
			const mv = document.createElement("span");
			mv.dir = "ltr";
			mv.textContent = count ? signed(sum / count) : "—";
			mean.append(mv);
			row.append(cell(lo, loAt), cell(hi, hiAt), mean);
			ext.append(row);
		}
	}
}

/** Show a tab @param {"day" | "year"} tab */
function setTab(tab) {
	state.tab = tab;
	showTab();
	saveUrl();
	render();
	if (tab == "year" && state.yearDirty)
		scanYear();
}

/** Mark the chosen tab and show its pane */
function showTab() {
	const tab = state.tab;
	document.querySelectorAll("#sunriseTest [data-st-tab]").forEach(b => {
		const on = b.getAttribute("data-st-tab") == tab;
		b.classList.toggle("active", on);
		b.setAttribute("aria-selected", String(on));
	});
	document.querySelectorAll("#sunriseTest [data-st-pane]").forEach(p =>
		p.classList.toggle("d-none", p.getAttribute("data-st-pane") != tab));
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
	if (state.tab == "year") u.searchParams.set("tab", "year"); else u.searchParams.delete("tab");
	if (state.year && state.tab == "year") u.searchParams.set("y", String(state.year)); else u.searchParams.delete("y");
	if (state.seconds) u.searchParams.delete("sec"); else u.searchParams.set("sec", "0");
	if (state.server != REFRACTION_SERVER) u.searchParams.set("srv", state.server); else u.searchParams.delete("srv");
	if (state.useHorizon) u.searchParams.delete("hz"); else u.searchParams.set("hz", "0");
	if (state.useWeather) u.searchParams.set("wx", "1"); else u.searchParams.delete("wx");
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

for (const b of document.querySelectorAll("#sunriseTest [data-st-tab]"))
	b.addEventListener("click", () => setTab(/** @type {"day" | "year"} */ (b.getAttribute("data-st-tab"))));
for (const b of document.querySelectorAll("#sunriseTest [data-years]"))
	b.addEventListener("click", () => {
		state.year = (state.year ?? Temporal.Now.plainDateISO().year) + parseInt(/** @type {string} */ (b.getAttribute("data-years")));
		scanYear();
	});
yearBox.addEventListener("change", () => {
	const y = parseInt(yearBox.value);
	if (y >= 1900 && y <= 2200) { state.year = y; scanYear(); }
});
showTab();

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
	state.horizon = null;
	state.weather = null;
	build();
	loadHorizon(false);
	loadWeather(false);
});

const horizonBox = /** @type {HTMLInputElement} */ ($("stUseHorizon"));
horizonBox.checked = state.useHorizon;
horizonBox.addEventListener("change", () => {
	state.useHorizon = horizonBox.checked;
	saveUrl();
	if (state.useHorizon && !state.horizon) loadHorizon(false);
	else clearTimeout(state.horizonRetry);
	build();
});
const weatherBox = /** @type {HTMLInputElement} */ ($("stUseWeather"));
weatherBox.checked = state.useWeather;
weatherBox.addEventListener("change", () => {
	state.useWeather = weatherBox.checked;
	saveUrl();
	if (state.useWeather && !state.weather) loadWeather(false);
	build();
});
$("stReloadHorizon").addEventListener("click", () => { if (state.useHorizon) loadHorizon(true); });
$("stReloadWeather").addEventListener("click", () => { if (state.useWeather) loadWeather(true); });

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
