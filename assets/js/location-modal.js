// @ts-check
/**
 * location-modal.js — the calendar's location modal (_includes/modals/location.html), in three tabs:
 *   1. Prayer direction: rhumb-line bearing to Har HaBayit, compass, map
 *   2. Technical details: coordinates, elevation, timezone, then the atmosphere the zemanim are computed
 *      with for the selected date (climate / forecast, humidity, haze, light pollution, terrain)
 *   3. Edit: the location (reopens the calendar with new URL parameters) and the atmosphere-model options
 *      (saved to localStorage, applied in place)
 *
 * Reads everything from the zmanimListUpdater that owns it; holds no data of its own besides the map.
 */

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import * as leaflet from "../libraries/leaflet/leaflet.js";
import { hazeOn } from "../libraries/kosherZmanim/star-nightfall.js";
import { settings, saveSetting } from "./settings/handler.js";

/** @typedef {import("./refraction-snapshot.js").AtmosphereSpec} AtmosphereSpec */
/** @typedef {import("./refraction-snapshot.js").Horizon} Horizon */
/** @typedef {import("./refraction-snapshot.js").Normals} Normals */
/** @typedef {import("../libraries/kosherZmanim/star-nightfall.js").HazeData} HazeData */

/**
 * Text in the site's three languages. `en` falls back to `et`.
 * @typedef {{ hb: string, et: string, en?: string }} Tri
 */

const harHabait = new KosherZmanim.GeoLocation('Jerusalem, Israel', 31.778, 35.2354, "Asia/Jerusalem");

/** Natural night-sky brightness (µcd/m²) that artificial brightness is compared with (Falchi et al. 2016). */
const NATURAL_SKY_UCD = 174;

/** The localStorage keys of the atmosphere options (settings.refraction). */
const KEYS = Object.freeze({
	hazeTzet: "hazeTzet",
	hazeMaxDelay: "hazeMaxDelay",
	humidity: "refrHumidity",
	seaSurfaceLayer: "seaSurfaceLayer"
});

// ─── Small DOM helpers ───────────────────────────────────────────────────────

/**
 * Three spans, one per language, for the page's .lang switching.
 * @param {Tri} t
 */
function tri(t) {
	const frag = document.createDocumentFragment();
	for (const [cls, text] of /** @type {[string, string][]} */ ([["lang-hb", t.hb], ["lang-et", t.et], ["lang-en", t.en ?? t.et]])) {
		const span = document.createElement("span");
		span.className = "lang " + cls;
		span.textContent = text;
		frag.appendChild(span);
	}
	return frag;
}

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {...(Node | string | null | undefined)} children
 */
function el(tag, className, ...children) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	for (const child of children)
		if (child != null) node.append(child);
	return node;
}

/** A language-neutral value (numbers, units), kept left-to-right inside Hebrew text. @param {string} text */
function ltr(text) {
	const span = el("span", undefined, text);
	span.dir = "ltr";
	return span;
}

/** A muted note after a value. @param {Tri} t */
const note = (t) => el("span", "text-body-secondary", " (", tri(t), ")");

/**
 * One section: a heading and a <dl> of rows.
 * @param {Tri} title
 * @param {[Tri, Node][]} rows
 */
function section(title, rows) {
	const dl = el("dl", "zf-facts small");
	for (const [label, value] of rows)
		dl.append(el("dt", undefined, tri(label)), el("dd", undefined, value));
	return el("section", "mt-3", el("h5", "mb-2", tri(title)), dl);
}

/** @param {...(Node | string | null | undefined)} parts */
const val = (...parts) => el("span", undefined, ...parts);

// ─── Formatting ──────────────────────────────────────────────────────────────

/** @param {number} c */
const fmtTemp = (c) => `${c.toFixed(1)} °C`;
/** @param {number} n @param {number} [digits] */
const fmt = (n, digits = 0) => n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** Elapsed time since an epoch-ms stamp. @param {number} at @returns {Tri} */
function ago(at) {
	const min = Math.max(0, Math.round((Date.now() - at) / 60000));
	if (min < 1) return { hb: "זה עתה", et: "just now" };
	if (min < 90) return { hb: `לפני ${min} דק'`, et: `${min} min ago` };
	const h = Math.round(min / 60);
	return { hb: `לפני ${h} שע'`, et: `${h} h ago` };
}

/** @param {number} deg 0..360 @returns {Tri} */
function cardinal(deg) {
	const i = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
	return [
		{ hb: "צפון", et: "N" }, { hb: "צפון-מזרח", et: "NE" }, { hb: "מזרח", et: "E" }, { hb: "דרום-מזרח", et: "SE" },
		{ hb: "דרום", et: "S" }, { hb: "דרום-מערב", et: "SW" }, { hb: "מערב", et: "W" }, { hb: "צפון-מערב", et: "NW" }
	][i];
}

/** @param {number} ms @returns {string} signed minutes, e.g. "+3.2 min" */
function fmtShift(ms) {
	const min = ms / 60000;
	if (Math.abs(min) < 0.05) return "±0 min";
	return `${min > 0 ? "+" : "−"}${fmt(Math.abs(min), 1)} min`;
}

/**
 * Falchi et al. (2016) classes of artificial sky brightness, as a ratio to the natural sky.
 * @param {number} ratio @returns {Tri}
 */
function lightClass(ratio) {
	if (ratio < 0.01) return { hb: "שמיים טבעיים", et: "pristine sky" };
	if (ratio < 0.08) return { hb: "פגיעה קלה באופק", et: "degraded near the horizon" };
	if (ratio < 0.5) return { hb: "פגיעה עד לזנית", et: "degraded to the zenith" };
	if (ratio < 3) return { hb: "השמיים הטבעיים אבדו", et: "natural sky lost" };
	if (ratio < 30) return { hb: "שביל החלב אינו נראה", et: "Milky Way not visible" };
	return { hb: "עיר מוארת מאוד", et: "very bright city sky" };
}

/**
 * The surface air of a spec: one temperature, or the observer's end of a path profile.
 * @param {AtmosphereSpec} spec
 * @returns {{ t: number, p: number | null, td: number | null, rh: number | null, path: number | null, water: boolean }}
 */
function surfaceOf(spec) {
	if ("path" in spec) {
		const near = [...spec.path].sort((a, b) => a.distanceKm - b.distanceKm)[0];
		const lowest = [...(near?.levels ?? [])].filter(l => Number.isFinite(l.t)).sort((a, b) => a.h - b.h)[0];
		return {
			t: lowest?.t ?? NaN,
			p: Number.isFinite(lowest?.p) ? lowest.p : null,
			td: Number.isFinite(lowest?.td) ? lowest.td : null,
			rh: Number.isFinite(lowest?.rh) ? lowest.rh : null,
			path: spec.path.length,
			water: spec.path.some(p => p.water)
		};
	}
	return {
		t: spec.temperatureC,
		p: Number.isFinite(spec.pressureMb) ? spec.pressureMb : null,
		td: Number.isFinite(spec.dewPointC) ? spec.dewPointC : null,
		rh: Number.isFinite(spec.relativeHumidity) ? spec.relativeHumidity : null,
		path: null,
		water: false
	};
}

/** @param {AtmosphereSpec | null | undefined} spec */
function describeAir(spec) {
	if (!spec) return val(tri({ hb: "אטמוספרה תקנית", et: "standard atmosphere" }));
	const air = surfaceOf(spec);
	if (!Number.isFinite(air.t)) return val("—");
	const parts = [fmtTemp(air.t)];
	if (air.p !== null) parts.push(`${fmt(air.p)} mb`);
	const out = val(ltr(parts.join(" · ")));
	if (air.td !== null)
		out.append(" · ", tri({ hb: "נקודת טל", et: "dew point" }), " ", ltr(fmtTemp(air.td)));
	else if (air.rh !== null)
		out.append(" · ", tri({ hb: "לחות", et: "humidity" }), " ", ltr(`${fmt(air.rh)}%`));
	if (air.path !== null)
		out.append(note({ hb: `פרופילים לאורך ${air.path} נקודות בכיוון השמש`, et: `profiles at ${air.path} points towards the sun` }));
	return out;
}

/** @param {AtmosphereSpec | null | undefined} spec */
function hasMoisture(spec) {
	if (!spec) return false;
	if ("path" in spec) return spec.path.some(p => (p.levels ?? []).some(l => Number.isFinite(l.td) || Number.isFinite(l.rh)));
	return Number.isFinite(spec.dewPointC) || Number.isFinite(spec.relativeHumidity);
}

// ─── The modal ───────────────────────────────────────────────────────────────

export default class LocationModal {
	/**
	 * @param {import("./zmanimListUpdater.js").default} updater
	 */
	constructor(updater) {
		this.updater = updater;
		/** @type {HTMLElement | null} */
		this.root = document.getElementById("locationModal");
		/** @type {leaflet.Map | null} */
		this.map = null;
		if (!this.root) return;

		const mapTab = this.root.querySelector("#locModal-direction-tab");
		mapTab?.addEventListener("shown.bs.tab", () => this.map?.invalidateSize());
		this.root.querySelector("#locModal-technical-tab")
			?.addEventListener("shown.bs.tab", () => this.renderTechnical());
		this.root.querySelector("#locModal-edit-tab")
			?.addEventListener("shown.bs.tab", () => this.fillEditForms());

		this._wireLocationForm();
		this._wireAtmosphereForm();
	}

	/** Whether the modal is on screen. */
	get isOpen() {
		return !!this.root?.classList.contains("show");
	}

	/** On shown.bs.modal. */
	open() {
		if (!this.root) return;
		this.renderDirection();
		this._drawMap();
		this.renderTechnical();
		this.fillEditForms();
	}

	/** On hidden.bs.modal. */
	close() {
		this.map?.remove();
		this.map = null;
	}

	/**
	 * New data or a new location: redraw what is on screen. Nothing to do while the modal is closed
	 * (open() renders from scratch).
	 * @param {{ redrawMap?: boolean }} [options]
	 */
	refresh(options = {}) {
		if (!this.root) return;
		this._fillLocationFields();
		if (!this.isOpen) return;
		this.renderDirection();
		if (options.redrawMap) {
			this.close();
			this._drawMap();
		}
		this.renderTechnical();
	}

	get geo() {
		return this.updater.geoLocation;
	}

	// ─── Tab 1: direction ──────────────────────────────────────────────────

	renderDirection() {
		if (!this.root) return;
		const bearing = this.geo.getRhumbLineBearing(harHabait);
		const distanceKm = this.geo.getRhumbLineDistance(harHabait) / 1000;

		this._setText("locationBearing", `${bearing.toFixed(2)}°`);
		this._setNodes("locationBearingCardinal", tri(cardinal(bearing)));
		const km = `${fmt(distanceKm)} km`;
		this._setNodes("locationDistance", tri({ hb: km, et: `${km} (${fmt(distanceKm * 0.621371)} mi)` }));

		const needle = this.root.querySelector('[data-zfFind="locationCompassNeedle"]');
		needle?.setAttribute("transform", `rotate(${bearing.toFixed(2)})`);
		const compass = this.root.querySelector('[data-zfFind="locationCompass"]');
		compass?.setAttribute("aria-label", `${bearing.toFixed(0)}°`);
	}

	_drawMap() {
		/** @type {HTMLElement | null} */
		const mapElem = this.root?.querySelector('[data-zfFind="locationMap"]');
		if (!mapElem || this.map) return;
		const here = /** @type {[number, number]} */ ([this.geo.getLatitude(), this.geo.getLongitude()]);

		this.map = leaflet.map(mapElem, {
			dragging: false,
			minZoom: 14,
			touchZoom: 'center',
			scrollWheelZoom: 'center'
		}).setView(here, 16);

		leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(this.map);

		// Rhumb line to Har HaBayit: straight on the Mercator map
		leaflet.polyline([here, [harHabait.getLatitude(), harHabait.getLongitude()]], { color: 'red' }).addTo(this.map);

		// Accuracy halo and centre dot
		leaflet.circle(here, { radius: 30, color: 'blue', fillColor: 'blue', fillOpacity: 0.15, weight: 0 }).addTo(this.map);
		leaflet.circleMarker(here, { radius: 8, fillColor: 'blue', color: 'white', weight: 2, opacity: 1, fillOpacity: 1 }).addTo(this.map);
	}

	// ─── Tab 2: technical details ──────────────────────────────────────────

	/** The static fields of tab 2 (coordinates, elevation, timezone, ground height). */
	_fillLocationFields() {
		const geo = this.geo;
		this._setText("locationLat", geo.getLatitude().toString());
		this._setText("locationLng", geo.getLongitude().toString());
		this._setText("locationElev", `${geo.getElevation().toFixed(1)} m`);

		let offset = "";
		try {
			offset = ` (UTC${Temporal.Now.zonedDateTimeISO(geo.getTimeZone()).offset})`;
		} catch { /* custom timezone */ }
		this._setText("locationTimeZone", geo.getTimeZone() + offset);

		const ground = this._groundHeight();
		this._setNodes("locationGroundHeight", ground === null
			? val(tri({ hb: "לא זמין", et: "not available" }))
			: val(`${ground.toFixed(1)} m`));
	}

	/** The refraction server's height for the spot, or null without a terrain horizon. */
	_groundHeight() {
		const horizon = this._horizon();
		const h = horizon?.points?.[0]?.height;
		return Number.isFinite(h) ? h : null;
	}

	/** @returns {Horizon | null} */
	_horizon() {
		return this.updater.refraction?.horizon ?? this.updater.zmanCalc?.config.horizon ?? null;
	}

	renderTechnical() {
		/** @type {HTMLElement | null} */
		const container = this.root?.querySelector('[data-zfFind="locationTechnical"]');
		if (!container || !this.updater.zmanCalc) return;
		this._fillLocationFields();

		const zc = this.updater.zmanCalc;
		const config = zc.config;
		const date = zc.coreZC.getDate().withCalendar("iso8601");
		const provider = config.atmosphereProvider ?? null;

		/** @param {'sunrise'|'sunset'} event @returns {AtmosphereSpec | null} */
		const specAt = (event) => {
			if (!provider) return null;
			try {
				return provider(date, event, zc.coreZC.getGeoLocation()) ?? null;
			} catch (e) {
				console.error("Atmosphere provider failed", e);
				return null;
			}
		};
		const sunrise = specAt("sunrise"), sunset = specAt("sunset");

		let dateText = date.toString();
		try {
			// via Date: a Temporal.PlainDate only formats in a locale whose calendar matches its own
			dateText = new Date(Date.UTC(date.year, date.month - 1, date.day))
				.toLocaleDateString(settings.language() == "hb" ? "he" : "en", { dateStyle: "medium", timeZone: "UTC" });
		} catch { /* ISO is fine */ }

		const nodes = [
			el("p", "small text-body-secondary mt-3 mb-0",
				tri({ hb: "נתוני האטמוספרה לתאריך הנבחר: ", et: "Atmosphere for the selected date: " }), ltr(dateText)),
			this._climateSection(sunrise, sunset, date.month),
			this._humiditySection(sunrise, sunset),
			this._hazeSection(date),
			this._otherSection(sunrise, sunset)
		];
		container.replaceChildren(...nodes);
	}

	/**
	 * @param {AtmosphereSpec | null} sunrise @param {AtmosphereSpec | null} sunset @param {number} month 1..12
	 */
	_climateSection(sunrise, sunset, month) {
		const forecastAt = this.updater._shownForecastAt;
		const provider = this.updater.zmanCalc.config.atmosphereProvider;

		/** @type {HTMLElement} */
		let source;
		if (forecastAt != null) {
			source = val(tri({ hb: "תחזית מזג אוויר", et: "Weather forecast" }),
				note(ago(forecastAt)));
			source.appendChild(el("div", "text-body-secondary",
				tri({ hb: "כשבועיים קדימה; אחר כך ממוצעים אקלימיים.", et: "About two weeks ahead; later dates use climate averages." })));
		} else if (provider) {
			source = val(tri({ hb: "ממוצעים חודשיים (אין תחזית)", et: "Monthly averages (no forecast)" }));
		} else {
			source = val(tri({ hb: "אטמוספרה תקנית (34.48′) — אין נתונים", et: "Standard atmosphere (34.48′) — no data" }));
		}

		/** @type {[Tri, Node][]} */
		const rows = [
			[{ hb: "מקור", et: "Source" }, source],
			[{ hb: "אוויר בזריחה", et: "Air at sunrise" }, describeAir(sunrise)],
			[{ hb: "אוויר בשקיעה", et: "Air at sunset" }, describeAir(sunset)]
		];

		/** @type {Normals | null} */
		const normals = this.updater.refraction?.normals ?? null;
		if (normals?.meanC?.length === 12 && normals.minC?.length === 12) {
			const m = month - 1;
			const v = val(ltr(`${fmtTemp(normals.meanC[m])}`), " ", tri({ hb: "ממוצע", et: "average" }),
				" · ", ltr(fmtTemp(normals.minC[m])), " ", tri({ hb: "מינימום", et: "low" }));
			if (Number.isFinite(normals.pressureMb))
				v.append(" · ", ltr(`${fmt(normals.pressureMb)} mb`));
			rows.push([{ hb: "אקלים החודש", et: "This month's climate" }, v]);
		}

		return section({ hb: "אקלים ומזג אוויר", et: "Climate & weather" }, rows);
	}

	/** @param {AtmosphereSpec | null} sunrise @param {AtmosphereSpec | null} sunset */
	_humiditySection(sunrise, sunset) {
		const on = this.updater.zmanCalc.config.humidity === true;
		const data = hasMoisture(sunrise) || hasMoisture(sunset);

		/** @type {HTMLElement} */
		let status;
		if (on && data)
			status = val(tri({ hb: "פעיל", et: "On" }));
		else if (on)
			status = val(tri({ hb: "פעיל", et: "On" }), note({ hb: "אין נתוני לחות לתאריך זה", et: "no humidity data for this date" }));
		else
			status = val(tri({ hb: "כבוי", et: "Off" }), note({ hb: "אוויר יבש", et: "dry air" }));

		return section({ hb: "לחות", et: "Humidity" }, [
			[{ hb: "בחישוב השבירה", et: "In the refraction" }, status]
		]);
	}

	/** @param {Temporal.PlainDate} date */
	_hazeSection(date) {
		const zc = this.updater.zmanCalc;
		/** @type {HazeData | null} */
		const haze = zc.config.haze ?? null;
		if (!haze)
			return section({ hb: "אובך וזיהום אור", et: "Haze & light pollution" }, [
				[{ hb: "נתונים", et: "Data" }, val(tri({ hb: "לא זמינים (עדיין)", et: "not available (yet)" }))]
			]);

		const { aod, aodRef, forecast } = hazeOn(haze, date);
		const evening = val(ltr(`AOD ${aod.toFixed(2)}`));
		if (forecast)
			evening.append(note(haze.forecastSource === "gefs"
				? { hb: "תחזית NOAA GEFS", et: "NOAA GEFS forecast" }
				: { hb: "תחזית CAMS", et: "CAMS forecast" }));
		else
			evening.append(note({ hb: "ממוצע חודשי", et: "monthly average" }));

		const comparison = aod > aodRef * 1.15 ? { hb: "אובך מהרגיל", et: "hazier than usual" }
			: aod < aodRef * 0.85 ? { hb: "צלול מהרגיל", et: "clearer than usual" }
			: { hb: "כרגיל", et: "about usual" };

		/** @type {[Tri, Node][]} */
		const rows = [
			[{ hb: "הערב", et: "This evening" }, evening],
			[{ hb: "ממוצע המקום", et: "Place's average" }, val(ltr(`AOD ${aodRef.toFixed(2)}`), note(comparison))]
		];

		if (Number.isFinite(haze.aodScale) && haze.aodScale !== 1)
			rows.push([{ hb: "כיול AERONET", et: "AERONET calibration" }, val(ltr(`× ${haze.aodScale.toFixed(2)}`))]);

		/** @type {HTMLElement} */
		let effect;
		if (zc.config.hazeTzet === false) {
			effect = val(tri({ hb: "כבוי", et: "Off" }));
		} else {
			const delay = zc.getHazeDelay();
			const ms = delay ? delay.total({ unit: "milliseconds" }) : 0;
			effect = val(ltr(fmtShift(ms)));
			const cap = zc.config.hazeMaxDelayMinutes === undefined ? 15 : zc.config.hazeMaxDelayMinutes;
			if (cap !== null && Math.abs(ms) >= cap * 60000 - 1)
				effect.append(note({ hb: `הגיע לגבול של ${cap} דק'`, et: `at the ${cap}-minute limit` }));
		}
		rows.push([{ hb: "השפעה על צאת הכוכבים במעלות", et: "Effect on Tzet by degrees" }, effect]);

		if (Number.isFinite(haze.blpCdM2)) {
			const ucd = haze.blpCdM2 * 1e6;
			const ratio = ucd / NATURAL_SKY_UCD;
			rows.push([{ hb: "זיהום אור", et: "Light pollution" },
				val(ltr(`${fmt(ucd, ucd < 10 ? 1 : 0)} µcd/m² (×${fmt(ratio, ratio < 1 ? 2 : 1)})`), note(lightClass(ratio)))]);
		} else {
			rows.push([{ hb: "זיהום אור", et: "Light pollution" }, val(tri({ hb: "לא ידוע", et: "unknown" }))]);
		}

		return section({ hb: "אובך וזיהום אור", et: "Haze & light pollution" }, rows);
	}

	/** @param {AtmosphereSpec | null} sunrise @param {AtmosphereSpec | null} sunset */
	_otherSection(sunrise, sunset) {
		const config = this.updater.zmanCalc.config;
		const horizon = this._horizon();

		/** @type {HTMLElement} */
		let terrain;
		if (horizon) {
			terrain = val(tri({ hb: "זריחה נראית מחושבת לפי פני השטח", et: "Visible sunrise from the terrain" }));
			const spots = horizon.points?.length ?? 0;
			if (horizon.area?.radiusKm > 0)
				terrain.append(note({
					hb: `${spots} נקודות ברדיוס ${fmt(horizon.area.radiusKm, 1)} ק"מ`,
					et: `${spots} spots within ${fmt(horizon.area.radiusKm, 1)} km`
				}));
		} else {
			terrain = val(tri({ hb: "לא זמין — הנץ לפי גובה פני הים", et: "Not available — netz at sea level" }));
		}

		const overWater = [sunrise, sunset].some(spec => spec && "path" in spec && spec.path.some(p => p.water));
		const sea = val(tri(config.seaSurfaceLayer ? { hb: "פעיל", et: "On" } : { hb: "כבוי", et: "Off" }));
		if (overWater)
			sea.append(note({ hb: "השמש עולה או שוקעת מעל מים", et: "the sun rises or sets over water" }));

		/** @type {[Tri, Node][]} */
		const rows = [
			[{ hb: "אופק", et: "Horizon" }, terrain],
			[{ hb: "שכבת פני הים", et: "Sea surface layer" }, sea]
		];

		const notes = this.updater.refraction?.notes ?? [];
		if (notes.length) {
			const details = el("details", undefined, el("summary", undefined, ltr(String(notes.length))));
			details.append(el("ul", "mb-0 ps-3", ...notes.map(n => el("li", undefined, ltr(n)))));
			rows.push([{ hb: "הערות טעינה", et: "Loading notes" }, details]);
		}

		return section({ hb: "אחר", et: "Other" }, rows);
	}

	// ─── Tab 3: edit ───────────────────────────────────────────────────────

	fillEditForms() {
		const loc = this._form("locationEditForm");
		if (loc) {
			this._input(loc, "locationName").value = this.geo.getLocationName() ?? "";
			this._input(loc, "lat").value = this.geo.getLatitude().toString();
			this._input(loc, "long").value = this.geo.getLongitude().toString();
			this._input(loc, "elevation").value = this.geo.getElevation().toString();
			this._input(loc, "timeZone").value = this.geo.getTimeZone();
			this._setText("locationEditError", "");

			/** @type {HTMLButtonElement | null} */
			const groundBtn = loc.querySelector('[data-zfFind="locationUseGround"]');
			if (groundBtn) groundBtn.disabled = this._groundHeight() === null;
		}

		const atm = this._form("atmosphereEditForm");
		if (atm) {
			const cap = settings.refraction.hazeMaxDelay();
			this._input(atm, "hazeTzet").checked = settings.refraction.hazeTzet();
			this._input(atm, "hazeMaxDelay").value = cap === null ? "" : String(cap);
			this._input(atm, "hazeNoCap").checked = cap === null;
			this._input(atm, "humidity").checked = settings.refraction.humidity();
			this._input(atm, "seaSurfaceLayer").checked = settings.refraction.seaSurfaceLayer();
			this._syncHazeInputs(atm);
		}
	}

	_wireLocationForm() {
		const form = this._form("locationEditForm");
		if (!form) return;

		/** @type {HTMLDataListElement | null} */
		const zones = form.querySelector("#locModal-timeZones");
		if (zones && "supportedValuesOf" in Intl) {
			for (const tz of Intl.supportedValuesOf("timeZone"))
				zones.appendChild(el("option")).setAttribute("value", tz);
		}

		form.querySelector('[data-zfFind="locationUseGround"]')?.addEventListener("click", () => {
			const ground = this._groundHeight();
			if (ground !== null) this._input(form, "elevation").value = ground.toFixed(1);
		});

		form.addEventListener("submit", (event) => {
			event.preventDefault();
			const name = this._input(form, "locationName").value.trim();
			const lat = parseFloat(this._input(form, "lat").value);
			const long = parseFloat(this._input(form, "long").value);
			const elevationRaw = this._input(form, "elevation").value.trim();
			const elevation = elevationRaw === "" ? 0 : parseFloat(elevationRaw);
			const timeZone = this._input(form, "timeZone").value.trim();

			/** @type {Tri | null} */
			let error = null;
			if (!(Number.isFinite(lat) && Math.abs(lat) <= 90))
				error = { hb: "קו הרוחב חייב להיות בין ‎-90 ל-90.", et: "Latitude must be between -90 and 90." };
			else if (!(Number.isFinite(long) && Math.abs(long) <= 180))
				error = { hb: "קו האורך חייב להיות בין ‎-180 ל-180.", et: "Longitude must be between -180 and 180." };
			else if (!Number.isFinite(elevation))
				error = { hb: "הגובה אינו מספר.", et: "Elevation is not a number." };
			else if (!isValidTimeZone(timeZone))
				error = { hb: "אזור הזמן אינו מוכר.", et: "Unknown timezone." };

			if (error) {
				this._setNodes("locationEditError", tri(error));
				return;
			}

			const url = new URL(window.location.href);
			url.searchParams.set("locationName", name);
			url.searchParams.set("lat", lat.toString());
			url.searchParams.set("long", long.toString());
			url.searchParams.set("elevation", elevation.toString());
			url.searchParams.set("timeZone", timeZone);
			window.location.assign(url);
		});
	}

	_wireAtmosphereForm() {
		const form = this._form("atmosphereEditForm");
		if (!form) return;

		for (const name of ["hazeTzet", "hazeNoCap"])
			this._input(form, name).addEventListener("change", () => this._syncHazeInputs(form));

		form.addEventListener("submit", (event) => {
			event.preventDefault();
			const noCap = this._input(form, "hazeNoCap").checked;
			const cap = parseFloat(this._input(form, "hazeMaxDelay").value);

			saveSetting(KEYS.hazeTzet, String(this._input(form, "hazeTzet").checked));
			saveSetting(KEYS.hazeMaxDelay, noCap ? "none" : Number.isFinite(cap) && cap >= 0 ? String(cap) : null);
			saveSetting(KEYS.humidity, String(this._input(form, "humidity").checked));
			saveSetting(KEYS.seaSurfaceLayer, String(this._input(form, "seaSurfaceLayer").checked));
			this._applyAtmosphere({ hb: "נשמר", et: "Saved" });
		});

		form.querySelector('[data-zfFind="atmosphereDefaults"]')?.addEventListener("click", () => {
			for (const key of Object.values(KEYS))
				saveSetting(key, null);
			this.fillEditForms();
			this._applyAtmosphere({ hb: "הוחזר לברירת המחדל", et: "Back to defaults" });
		});

		form.querySelector('[data-zfFind="atmosphereRefresh"]')?.addEventListener("click", async (event) => {
			const btn = /** @type {HTMLButtonElement} */ (event.currentTarget);
			btn.disabled = true;
			this._setNodes("atmosphereStatus", tri({ hb: "טוען…", et: "Loading…" }));
			try {
				await this.updater._loadRefraction({ force: true });
				this._setNodes("atmosphereStatus", tri({ hb: "התחזית עודכנה", et: "Forecast updated" }));
			} finally {
				btn.disabled = false;
			}
		});
	}

	/**
	 * Rebuild the calendar with the saved options (resetCalendar re-reads settings, and fetches humidity
	 * data if it was just turned on and isn't stored).
	 * @param {Tri} message
	 */
	_applyAtmosphere(message) {
		this.updater.resetCalendar();
		this._setNodes("atmosphereStatus", tri(message));
	}

	/** @param {HTMLFormElement} form */
	_syncHazeInputs(form) {
		const on = this._input(form, "hazeTzet").checked;
		const noCap = this._input(form, "hazeNoCap");
		noCap.disabled = !on;
		this._input(form, "hazeMaxDelay").disabled = !on || noCap.checked;
	}

	// ─── Helpers ───────────────────────────────────────────────────────────

	/** @param {string} find @returns {HTMLFormElement | null} */
	_form(find) {
		return this.root?.querySelector(`form[data-zfFind="${find}"]`) ?? null;
	}

	/** @param {HTMLFormElement} form @param {string} name @returns {HTMLInputElement} */
	_input(form, name) {
		return /** @type {HTMLInputElement} */ (form.elements.namedItem(name));
	}

	/** @param {string} key data-zfReplace or data-zfFind value @param {string} text */
	_setText(key, text) {
		for (const node of this._all(key))
			node.textContent = text;
	}

	/** @param {string} key @param {Node} content */
	_setNodes(key, content) {
		const targets = this._all(key);
		targets.forEach((node, i) => node.replaceChildren(i === targets.length - 1 ? content : content.cloneNode(true)));
	}

	/** @param {string} key */
	_all(key) {
		return this.root ? [...this.root.querySelectorAll(`[data-zfReplace="${key}"], [data-zfFind="${key}"]`)] : [];
	}
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
