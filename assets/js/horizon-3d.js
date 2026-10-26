// @ts-check
/**
 * The 3D horizon view (/horizon-3d?lat=..&lon=..[&event=sunrise|sunset][&date=YYYY-MM-DD]).
 *
 * Shows the terrain the visible sunrise / sunset is computed from, from where the observer stands: the
 * refraction server's own heights (/v1/terrain-tiles: the same layers as /v1/horizon) where it has them,
 * the AWS Terrain Tiles elsewhere. On it, the horizon the server found for the location (the same set the
 * calendar uses: stored with the place, else /v1/horizon?area=auto) and the point where today's sun meets
 * it. One link does both events: the toggle turns the observer to face the other one.
 */
import * as maplibregl from "../libraries/maplibre/maplibre-gl.mjs";
import { REFRACTION_SERVER, TERRAIN_VERSION, readCachedRefraction } from "./refraction-data.js";
import { fetchHorizonForArea, HorizonPendingError } from "../libraries/kosherZmanim/horizon-client.js";
import { sunAltAz, morningSunAt, eveningSunAt } from "../libraries/kosherZmanim/star-nightfall.js";
import { ROY_REFRACTION_ARCMIN } from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";

/** @typedef {import('../libraries/kosherZmanim/royzmanim-spa-corrections.js').HorizonSet} HorizonSet */
/** @typedef {import('../libraries/kosherZmanim/royzmanim-spa-corrections.js').HorizonSetPoint} HorizonSetPoint */
/** @typedef {'sunrise' | 'sunset'} SunEvent */

const AWS_TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
/** Zooms the server makes tiles for (terrain_tiles.py MIN_ZOOM..MAX_ZOOM). */
const SERVER_MIN_ZOOM = 8, SERVER_MAX_ZOOM = 14;
const R_EARTH = 6371008.8;
/** Refraction coefficient of standard air, as the server picks its horizon points with (terrain.py). */
const K_STANDARD = 0.13;
const EYE_M = 1.7;
/** How far the eye view looks down / up (deg): the map's pitch reaches 90 + TILT_MAX (maxPitch). */
const TILT_MIN = -30, TILT_MAX = 25;
/** The lens's vertical field of view (deg). */
const FOV_MIN = 5, FOV_MAX = 60;
const clampTilt = (/** @type {number} */ x) => Math.max(TILT_MIN, Math.min(TILT_MAX, x));
const clampFov = (/** @type {number} */ x) => Math.max(FOV_MIN, Math.min(FOV_MAX, x));
const D2R = Math.PI / 180;

// ─── Language ────────────────────────────────────────────────────────────────

/** @returns {'he' | 'he-Latn' | 'en'} */
function language() {
	let saved = null;
	try { saved = new URLSearchParams(location.search).get("zmanimLanguage") || localStorage.getItem("zmanimLanguage"); } catch (e) { /* storage blocked */ }
	saved = { hb: "he", "en-et": "he-Latn" }[saved ?? ""] ?? saved;
	if (saved === "he" || saved === "he-Latn" || saved === "en") return saved;
	return (navigator.languages ?? [navigator.language]).some(l => l?.startsWith("he")) ? "he" : "en";
}
const LANG = language();
const HE = LANG === "he";

/** @type {Record<string, string>} */
const HEBREW = {
	back: "→ חזרה ללוח",
	title: "האופק בתלת־ממד",
	sunrise: "זריחה",
	sunset: "שקיעה",
	eye: "מבט מהעין",
	above: "מבט מלמעלה",
	facing: "כיוון",
	tilt: "הרמת מבט",
	lens: "עדשה",
	imagery: "רקע",
	satellite: "לוויין",
	map: "מפה",
	relief: "תבליט בלבד",
	spot: "נקודה",
	legRidge: "האופק שהשרת מצא (מה שמסתיר את השמש)",
	legSun: "היכן שהשמש פוגשת אותו בתאריך (בקירוב)",
	now: "עכשיו",
	zman: "זמן",
	faceSun: "פנו אל השמש",
	legSpot: "היכן שאתם עומדים",
	clickNote: "גררו כדי להסתכל סביב, גללו או צבטו כדי לשנות עדשה, הקישו פעמיים כדי לפנות לנקודה. הקישו על הקרקע לראות מיקום, גובה וזווית.",
	sources: "נתונים",
	errLatLon: "פתחו דף זה ממיקום בלוח (צריך קו רוחב וקו אורך בין 60° דרום ל־60° צפון).",
	errHorizon: "לא ניתן היה לטעון את האופק; פני השטח מוצגים בכל זאת.",
	pending: "השרת עדיין מחשב את האופק של המקום הזה (בפעם הראשונה זה יכול לקחת כמה דקות); פני השטח מוצגים בינתיים, והאופק יופיע כשיהיה מוכן.",
	pendingEta: "השרת מחשב את האופק של המקום הזה בפעם הראשונה: עוד כ־{eta}. פני השטח מוצגים בינתיים, והאופק יופיע כשיהיה מוכן.",
	errWebgl: "הדפדפן הזה אינו תומך ב־WebGL 2, שהתצוגה התלת־ממדית צריכה.",
	srcText: "פני השטח: אותם נתוני גובה שמהם מחושב אופק הנץ הנראה (מודלים של פני הקרקע החשופה: SRTM, ‏FABDEM ומיפוי לאומי היכן שנטען); היכן שאין לשרת נתונים — אריחי הגובה של AWS. הגבהים הם של הקרקע עצמה: בניינים ועצים אינם בהם."
};
/** @param {string} key @param {string} en */
const t = (key, en) => HE ? (HEBREW[key] ?? en) : en;

function translatePage() {
	document.documentElement.lang = HE ? "he" : "en";
	document.documentElement.dir = HE ? "rtl" : "ltr";
	for (const node of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll("[data-t]"))) {
		const key = node.dataset.t ?? "";
		if (HE && HEBREW[key]) node.textContent = HEBREW[key];
	}
}

// ─── Geometry ────────────────────────────────────────────────────────────────

/** Great-circle destination. @returns {[number, number]} [lon, lat] */
function destination(lat, lon, azDeg, distM) {
	const p1 = lat * D2R, l1 = lon * D2R, a = azDeg * D2R, d = distM / R_EARTH;
	const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(a));
	const l2 = l1 + Math.atan2(Math.sin(a) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
	return [((l2 / D2R + 540) % 360) - 180, p2 / D2R];
}

/** Distance (m) and initial bearing (deg) from 1 to 2. */
function inverse(lat1, lon1, lat2, lon2) {
	const p1 = lat1 * D2R, p2 = lat2 * D2R, dl = (lon2 - lon1) * D2R;
	const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
	const dist = 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
	const brg = Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl));
	return { dist, bearing: (brg / D2R + 360) % 360 };
}

/** Apparent elevation angle (deg) of a point in standard air: Earth's curvature less refraction's bending. */
function elevationAngle(observerM, heightM, distM) {
	return Math.atan2(heightM - observerM - distM * distM * (1 - K_STANDARD) / (2 * R_EARTH), distM) / D2R;
}

// ─── The sun (only to aim the view: the calendar traces the day's air for the time itself) ─────

/** Declination (rad) of the sun at a Julian day: NOAA's solar calculator (Meeus, Astronomical Algorithms ch. 25, low accuracy). */
function declination(jd) {
	const T = (jd - 2451545) / 36525;
	const L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
	const M = (357.52911 + T * (35999.05029 - 0.0001537 * T)) * D2R;
	const C = Math.sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M) * (0.019993 - 0.000101 * T) + Math.sin(3 * M) * 0.000289;
	const omega = (125.04 - 1934.136 * T) * D2R;
	const lambda = (L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) * D2R;
	const eps = (23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(omega)) * D2R;
	return Math.asin(Math.sin(eps) * Math.sin(lambda));
}

/** Azimuth (deg) of the sun's centre at true altitude altDeg, rising or setting; null if it never gets there. */
function sunAzimuthAt(latDeg, decl, altDeg, event) {
	const phi = latDeg * D2R, h = altDeg * D2R;
	const c = (Math.sin(decl) - Math.sin(phi) * Math.sin(h)) / (Math.cos(phi) * Math.cos(h));
	if (Math.abs(c) > 1) return null;
	const a = Math.acos(c) / D2R;
	return event === "sunrise" ? a : 360 - a;
}

/** Refraction (deg) of a body at true altitude h (deg), standard air: Sæmundsson (1986). Meant for h above about -1. */
const refractionTrue = (h) => 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * D2R) / 60;
/** Refraction (deg) at apparent altitude h (deg), standard air: Bennett (1982). */
const refractionApparent = (h) => 1 / Math.tan((h + 7.31 / (h + 4.4)) * D2R) / 60;
/** The sun's centre at sunrise / sunset as the calendar's calculator takes it: refraction and the semi-diameter. */
const SUNRISE_ALT = -(ROY_REFRACTION_ARCMIN + 16) / 60;
/** The sun's angular radius (deg), for drawing it. */
const SUN_RADIUS = 0.2666;

// ─── Horizon data ────────────────────────────────────────────────────────────

/**
 * The horizon entry of a spot nearest an azimuth (DEM entries only: distance and height).
 * @param {HorizonSetPoint} spot @param {SunEvent} event @param {number} az
 */
function entryAt(spot, event, az) {
	let best = null, bestD = Infinity;
	for (const e of spot[event] ?? []) {
		if (!("distanceKm" in e)) continue;
		const d = Math.abs(((e.azimuthDeg - az + 540) % 360) - 180);
		if (d < bestD) { best = e; bestD = d; }
	}
	return bestD <= 1 ? best : null;
}

/** The horizon entry nearest an azimuth among both events' (they cover the year's sunrise and sunset directions). */
function entryAtAny(spot, az) {
	return entryAt(spot, "sunrise", az) ?? entryAt(spot, "sunset", az);
}

/** The spot of a vantage set that sees lowest at this azimuth (its `wins`), else the first. @param {HorizonSet} set */
function spotFor(set, event, az) {
	for (const p of set.points) {
		for (const [a, b] of p.wins?.[event] ?? []) {
			if (a <= b ? az >= a && az <= b : az >= a || az <= b) return p;
		}
	}
	// no spot's range holds it (a gap between them): of those with a horizon there, the one that sees lowest.
	// A spot's horizon only covers the few degrees around where it wins.
	let best = set.points[0], lowest = Infinity;
	for (const p of set.points) {
		const e = entryAt(p, event, az);
		const angle = e && elevationAngle(p.height, e.heightM, e.distanceKm * 1000);
		if (e && angle < lowest) { best = p; lowest = angle; }
	}
	return best;
}

/**
 * Where today's sun meets this spot's horizon: its azimuth when the centre's apparent altitude equals the
 * horizon's elevation angle there (standard air). Two passes: the horizon's angle depends on the azimuth.
 */
function sunOnHorizon(spot, event, decl) {
	let alt = 0, az = null, entry = null;
	for (let i = 0; i < 3; i++) {
		az = sunAzimuthAt(spot.lat, decl, alt - refractionApparent(alt), event);
		if (az === null) return null;
		entry = entryAt(spot, event, az);
		alt = entry ? elevationAngle(spot.height, entry.heightM, entry.distanceKm * 1000) : 0;
	}
	return { az, alt, entry };
}

// ─── The sky by the sun's depression ─────────────────────────────────────────

/** [depression (deg; negative: the sun up), sky, horizon, darkening of the ground (0..1)] */
const SKY_STOPS = /** @type {[number, string, string, number][]} */ ([
	[-6, "#6fa3dc", "#e3edf7", 0],
	[0, "#5b88c2", "#f3c993", 0.05],
	[3, "#3f5f92", "#e7955f", 0.2],
	[6, "#263a63", "#a8677a", 0.4],
	[9, "#16223f", "#4c4466", 0.58],
	[12, "#0c1427", "#25283f", 0.7],
	[15, "#070b18", "#11141f", 0.78],
	[18, "#04060c", "#06080f", 0.84]
]);

const hex = (/** @type {string} */ c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a, b, f) => "#" + hex(a).map((x, i) => Math.round(x + (hex(b)[i] - x) * f).toString(16).padStart(2, "0")).join("");

/** The sky's colours and the ground's darkening for a depression (deg below the horizon). */
function skyAt(depression) {
	const d = Math.max(SKY_STOPS[0][0], Math.min(18, depression));
	let i = 0;
	while (i < SKY_STOPS.length - 2 && d > SKY_STOPS[i + 1][0]) i++;
	const [d0, s0, h0, g0] = SKY_STOPS[i], [d1, s1, h1, g1] = SKY_STOPS[i + 1];
	const f = (d - d0) / (d1 - d0);
	return { sky: mixHex(s0, s1, f), horizon: mixHex(h0, h1, f), dark: g0 + (g1 - g0) * f };
}

// ─── Page ────────────────────────────────────────────────────────────────────

const $ = (id) => /** @type {any} */ (document.getElementById(id));
const fmt = (x, d = 1) => x.toLocaleString(HE ? "he-IL" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function showError(msg) { $("err").textContent = msg; }

async function main() {
	translatePage();
	const q = new URLSearchParams(location.search);
	const lat = Number(q.get("lat")), lon = Number(q.get("lon") ?? q.get("long"));
	if (!q.get("lat") || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 60 || Math.abs(lon) > 180) {
		showError(t("errLatLon", "Open this page from a location in the calendar (it needs lat and lon between 60°S and 60°N)."));
		return;
	}
	if (!document.createElement("canvas").getContext("webgl2")) {
		showError(t("errWebgl", "This browser doesn't support WebGL 2, which the 3D view needs."));
		return;
	}
	const back = new URL("/calendar", location.href);
	back.search = location.search;
	$("back").href = back.pathname + back.search;

	// The moment shown: a date and a time at the place (its time zone from the calendar, else this device's)
	const tz = (() => {
		const z = q.get("tz");
		try { if (z) return Temporal.Now.zonedDateTimeISO(z).timeZoneId; } catch (e) { /* not a time zone */ }
		return Temporal.Now.timeZoneId();
	})();
	const zoned = (/** @type {number} */ ms) => Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(tz);
	const dateParam = q.get("date") ?? "";
	/** @type {Temporal.PlainDate} */
	let date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? Temporal.PlainDate.from(dateParam) : Temporal.Now.plainDateISO(tz);
	const ymd = (/** @type {Temporal.PlainDate} */ d) => ({ year: d.year, month: d.month, day: d.day });
	/** The sun's declination at the place's noon of the date: aims the view at the day's sunrise / sunset. */
	let decl = 0;
	const setDecl = () => { decl = declination(Date.UTC(date.year, date.month - 1, date.day, 12) / 86400000 + 2440587.5 - lon / 360); };
	setDecl();

	const timeParam = q.get("time") ?? "";
	/** @type {SunEvent} */
	let event = q.get("event") === "sunset" ? "sunset" : q.get("event") === "sunrise" ? "sunrise"
		: /^\d{1,2}:\d{2}/.test(timeParam) ? (Number(timeParam.split(":")[0]) < 12 ? "sunrise" : "sunset")
		: Temporal.Now.zonedDateTimeISO(tz).hour < 12 ? "sunrise" : "sunset";
	/** The moment shown (epoch ms). */
	let when = /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeParam)
		? date.toZonedDateTime({ timeZone: tz, plainTime: Temporal.PlainTime.from(timeParam.padStart(5, "0")) }).epochMilliseconds
		: date.equals(Temporal.Now.plainDateISO(tz)) ? Date.now()
		: (event === "sunrise" ? morningSunAt : eveningSunAt)(ymd(date), lat, lon, SUNRISE_ALT);
	if (!Number.isFinite(when)) when = date.toZonedDateTime({ timeZone: tz, plainTime: "12:00" }).epochMilliseconds;

	// The horizon set the calendar uses for this place (stored with it), else the same request it makes
	/** @type {HorizonSet | null} */
	let set = null;
	try { set = (await readCachedRefraction(lat, lon))?.horizon ?? null; } catch (e) { /* no stored place */ }
	/** A place's first horizon, still being computed on the server: asked for again until it is ready. */
	/** @type {HorizonPendingError | null} */
	let pending = null;
	const fetchSet = () => fetchHorizonForArea(REFRACTION_SERVER, lat, lon, { version: TERRAIN_VERSION });
	const horizonFailed = (/** @type {any} */ e) =>
		showError(t("errHorizon", "The horizon could not be loaded; the terrain is still shown.") + ` (${e?.message ?? e})`);
	if (!set) {
		try { set = await fetchSet(); }
		catch (e) {
			if (e instanceof HorizonPendingError) pending = e;
			else horizonFailed(e);
		}
	}

	/** @type {HorizonSetPoint} */
	let spot = set?.points?.[0] ?? { lat, lon, ground: NaN, height: NaN };
	let customSpot = false;
	/** a spot picked from the list: not changed for another date's sunrise */
	let spotChosen = false;
	let az = 90, tilt = 1, fov = 30;
	let eyeMode = true;

	const tileStats = { server: 0, aws: 0 };
	maplibregl.addProtocol("royzdem", async (params, abort) => {
		const [z, x, y] = params.url.slice("royzdem://".length).split("/").map(Number);
		if (z >= SERVER_MIN_ZOOM && z <= SERVER_MAX_ZOOM) {
			try {
				const r = await fetch(`${REFRACTION_SERVER}/v1/terrain-tiles/${z}/${x}/${y}.png`, { signal: abort.signal });
				if (r.ok) { tileStats.server++; updateStats(); return { data: await r.arrayBuffer() }; }
			} catch (e) {
				if (abort.signal.aborted) throw e;
			}
		}
		const r = await fetch(`${AWS_TERRARIUM}/${z}/${x}/${y}.png`, { signal: abort.signal });
		if (!r.ok) throw new Error(`terrain tile ${z}/${x}/${y}: HTTP ${r.status}`);
		tileStats.aws++; updateStats();
		return { data: await r.arrayBuffer() };
	});
	function updateStats() {
		const n = tileStats.server + tileStats.aws;
		$("tileStats").textContent = HE
			? `אריחי גובה: ${tileStats.server} מהשרת שלנו, ${tileStats.aws} מ־AWS (מתוך ${n})`
			: `Terrain tiles: ${tileStats.server} from our server, ${tileStats.aws} from AWS (of ${n})`;
	}

	const dem = /** @type {const} */ ({
		type: "raster-dem", tiles: ["royzdem://{z}/{x}/{y}"], tileSize: 256, encoding: "terrarium", maxzoom: SERVER_MAX_ZOOM,
		attribution: "Terrain: <a href=\"https://github.com/zemaneh-yosef/zemaneh-shamayim\">ROYZmanim server</a> (SRTM, FABDEM, national surveys); elsewhere <a href=\"https://registry.opendata.aws/terrain-tiles/\">AWS Terrain Tiles</a>"
	});
	const map = new maplibregl.Map({
		container: "map",
		center: [lon, lat],
		zoom: 14,
		pitch: 85,
		maxPitch: 90 + TILT_MAX,
		centerClampedToGround: false,
		attributionControl: { compact: true },
		style: {
			version: 8,
			sources: {
				dem,
				demShade: { ...dem },
				sat: {
					type: "raster", tileSize: 256, maxzoom: 15,
					tiles: ["https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"],
					attribution: "<a href=\"https://s2maps.eu\">Sentinel-2 cloudless 2016</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016)"
				},
				osm: {
					type: "raster", tileSize: 256, maxzoom: 19,
					tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
					attribution: "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
				},
				ridge: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
				sun: { type: "geojson", data: { type: "FeatureCollection", features: [] } },
				spots: { type: "geojson", data: { type: "FeatureCollection", features: [] } }
			},
			layers: [
				{ id: "bg", type: "background", paint: { "background-color": "#c9c3b4" } },
				{ id: "sat", type: "raster", source: "sat" },
				{ id: "osm", type: "raster", source: "osm", layout: { visibility: "none" } },
				{ id: "shade", type: "hillshade", source: "demShade", paint: { "hillshade-exaggeration": 0.35 } },
				{ id: "sunLine", type: "line", source: "sun", filter: ["==", ["geometry-type"], "LineString"],
					paint: { "line-color": "#f5b400", "line-width": 2, "line-opacity": 0.8, "line-dasharray": [3, 3] } },
				{ id: "ridge", type: "circle", source: "ridge",
					paint: { "circle-color": "#d97706", "circle-radius": 3, "circle-stroke-color": "#fff", "circle-stroke-width": 0.5,
						"circle-pitch-alignment": "viewport", "circle-pitch-scale": "viewport" } },
				{ id: "sunPoint", type: "circle", source: "sun", filter: ["==", ["geometry-type"], "Point"],
					paint: { "circle-color": "#f5b400", "circle-radius": 8, "circle-stroke-color": "#7c2d12", "circle-stroke-width": 2,
						"circle-pitch-alignment": "viewport", "circle-pitch-scale": "viewport" } },
				{ id: "spots", type: "circle", source: "spots",
					paint: { "circle-color": ["case", ["get", "here"], "#2563eb", "#93c5fd"], "circle-radius": ["case", ["get", "here"], 7, 4],
						"circle-stroke-color": "#fff", "circle-stroke-width": 1.5,
						"circle-pitch-alignment": "viewport", "circle-pitch-scale": "viewport" } }
			],
			terrain: { source: "dem", exaggeration: 1 },
			sky: {
				"sky-color": "#6fa3dc", "horizon-color": "#e3edf7", "fog-color": "#e3edf7",
				"sky-horizon-blend": 0.5, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.75
			}
		}
	});
	map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), HE ? "top-left" : "top-right");   // clear of the panel
	map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), HE ? "bottom-left" : "bottom-right");
	map.on("error", (e) => console.warn("map:", e?.error?.message ?? e));

	/** The observer's eye above sea level: the server's height for the spot, else the ground under it + eye. */
	function eyeAltitude() {
		if (Number.isFinite(spot.height)) return spot.height;
		const g = map.queryTerrainElevation([spot.lon, spot.lat]);
		return (g ?? 0) + EYE_M;
	}

	function look() {
		$("az").value = String(az);
		$("azVal").textContent = `${fmt(az, 1)}°`;
		$("tiltVal").textContent = `${fmt(tilt, 2)}°`;
		$("tilt").value = String(tilt);
		$("fov").value = String(fov);
		$("fovVal").textContent = `${Math.round(fov)}°`;
		map.setVerticalFieldOfView(fov);
		syncHandlers();
		if (!eyeMode) return;
		// a hair above the eye, so the camera stays clear of the terrain mesh under it
		// The camera looks at a point 40 km out rather than wherever its ray meets the ground: MapLibre loads
		// terrain only so far beyond its centre, and a view tilted slightly down would put that centre on the
		// ground a few km ahead and leave distant ridges out (in Los Angeles: the San Gabriels, 77 km). Much
		// farther and it draws the ground under the observer from coarser tiles (60 km: 34 m too high there).
		// The direction is the same either way.
		// The target is placed on the flat map, straight along the bearing (a great circle would turn the view
		// by the meridians' convergence: ~0.4 deg at 150 km in Los Angeles).
		const eye = eyeAltitude() + 0.5;
		const far = 40000;
		const here = maplibregl.MercatorCoordinate.fromLngLat([spot.lon, spot.lat]);
		const units = far * here.meterInMercatorCoordinateUnits();
		const there = new maplibregl.MercatorCoordinate(here.x + units * Math.sin(az * D2R), here.y - units * Math.cos(az * D2R)).toLngLat();
		map.jumpTo(map.calculateCameraOptionsFromTo(new maplibregl.LngLat(spot.lon, spot.lat), eye, there,
			eye + far * Math.tan(tilt * D2R)));
	}

	function drawData() {
		/** @type {any[]} */
		const ridge = [];
		for (const e of spot[event] ?? []) {
			if (!("distanceKm" in e)) continue;
			ridge.push({ type: "Feature", properties: { az: e.azimuthDeg, d: e.distanceKm, h: e.heightM },
				geometry: { type: "Point", coordinates: destination(spot.lat, spot.lon, e.azimuthDeg, e.distanceKm * 1000) } });
		}
		map.getSource("ridge").setData({ type: "FeatureCollection", features: ridge });

		const sun = Number.isFinite(spot.height) ? sunOnHorizon(spot, event, decl) : null;
		/** @type {any[]} */
		const sunF = [];
		if (sun) {
			const dist = sun.entry ? sun.entry.distanceKm * 1000 : 30000;
			const to = destination(spot.lat, spot.lon, sun.az, dist);
			// from 1 km out: nearer, the line would fill the bottom of the eye view
			sunF.push({ type: "Feature", properties: {}, geometry: { type: "LineString",
				coordinates: [destination(spot.lat, spot.lon, sun.az, Math.min(1000, dist / 2)), to] } });
			if (sun.entry) sunF.push({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: to } });
			$("sunInfo").textContent = HE
				? `השמש ${event === "sunrise" ? "עולה" : "שוקעת"} בכיוון ${fmt(sun.az, 1)}° בערך` + (sun.entry
					? `, מעל הר במרחק ${fmt(sun.entry.distanceKm, 1)} ק"מ בגובה ${fmt(sun.entry.heightM, 0)} מ' (זווית ${fmt(sun.alt, 2)}° באוויר תקני).`
					: ".")
				: `The sun ${event === "sunrise" ? "rises" : "sets"} at about ${fmt(sun.az, 1)}°` + (sun.entry
					? `, over terrain ${fmt(sun.entry.distanceKm, 1)} km away at ${fmt(sun.entry.heightM, 0)} m (${fmt(sun.alt, 2)}° up in standard air).`
					: ".");
		} else {
			$("sunInfo").textContent = "";
		}
		map.getSource("sun").setData({ type: "FeatureCollection", features: sunF });

		const spots = (customSpot ? [spot] : set?.points ?? [spot]).map(p => ({
			type: "Feature", properties: { here: p === spot }, geometry: { type: "Point", coordinates: [p.lon, p.lat] }
		}));
		map.getSource("spots").setData({ type: "FeatureCollection", features: spots });
		return sun;
	}

	function setEvent(ev, aim = true) {
		event = ev;
		$("evSunrise").setAttribute("aria-pressed", String(ev === "sunrise"));
		$("evSunset").setAttribute("aria-pressed", String(ev === "sunset"));
		pickSpot();
		const sun = drawData();
		if (aim) {
			az = sun?.az ?? (ev === "sunrise" ? 90 : 270);
			tilt = sun ? clampTilt(sun.alt) : 1;
			$("tilt").value = String(tilt);
			eyeMode = true;
			look();
		}
	}

	/**
	 * In an area, the spot that sees the date's sunrise / sunset lowest, as the calendar does (unless one was
	 * picked by hand or "Stand here"). Each spot's horizon covers only the few degrees where it wins, so a new
	 * date needs its own spot. @returns {boolean} whether the spot changed
	 */
	function pickSpot() {
		if (!set || customSpot || spotChosen) return false;
		const first = sunOnHorizon(set.points[0], event, decl);
		const s = spotFor(set, event, first?.az ?? (event === "sunrise" ? 90 : 270));
		const changed = s !== spot;
		if (changed) { spot = s; fillSpots(); describeWhere(); }
		return changed;
	}

	function fillSpots() {
		const sel = $("spot");
		const many = !customSpot && (set?.points?.length ?? 0) > 1;
		sel.hidden = $("spotLabel").hidden = !many;
		if (!many) return;
		sel.replaceChildren(...set.points.map((p, i) => {
			const o = document.createElement("option");
			o.value = String(i);
			o.textContent = `${i + 1}: ${fmt(p.lat, 4)}, ${fmt(p.lon, 4)} (${fmt(p.ground, 0)} m)`;
			o.selected = p === spot;
			return o;
		}));
	}

	function describeWhere() {
		const area = /** @type {any} */ (set)?.area;
		const h = Number.isFinite(spot.height) ? ` · ${HE ? "עין" : "eye"} ${fmt(spot.height, 1)} m` : "";
		$("where").textContent = `${fmt(spot.lat, 5)}, ${fmt(spot.lon, 5)}${h}` + (area?.name && !customSpot ? ` · ${area.name}` : "");
	}

	// ─── The moment: the sun where it is, the sky as dark as its depression ───

	/** The sun's true (unrefracted) and apparent altitude and its azimuth at `when`, from the spot. */
	function sunNow() {
		const [alt, sAz] = sunAltAz(when, spot.lat, spot.lon);
		return { alt, app: alt > -1.5 ? alt + refractionTrue(Math.max(alt, -1)) : alt, az: sAz };
	}

	/**
	 * The eye view's camera as a pinhole: screen size, focal length (px) and its forward / right / up unit
	 * vectors (east, north, up).
	 */
	function cameraBasis() {
		const W = map.getContainer().clientWidth, H = map.getContainer().clientHeight;
		const f = H / 2 / Math.tan(fov / 2 * D2R);
		const b = map.getBearing() * D2R, tl = (map.getPitch() - 90) * D2R;
		const F = [Math.sin(b) * Math.cos(tl), Math.cos(b) * Math.cos(tl), Math.sin(tl)];
		const Rt = [Math.cos(b), -Math.sin(b), 0];
		const U = [Rt[1] * F[2] - Rt[2] * F[1], Rt[2] * F[0] - Rt[0] * F[2], Rt[0] * F[1] - Rt[1] * F[0]];
		return { W, H, f, F, Rt, U };
	}

	/** The direction (azimuth, altitude in deg) a screen point looks in, in the eye view. */
	function screenDirection(/** @type {{x: number, y: number}} */ pt) {
		const { W, H, f, F, Rt, U } = cameraBasis();
		const u = (pt.x - W / 2) / f, v = (H / 2 - pt.y) / f;
		const d = [0, 1, 2].map(i => F[i] + u * Rt[i] + v * U[i]);
		return { az: (Math.atan2(d[0], d[1]) / D2R + 360) % 360, alt: Math.atan2(d[2], Math.hypot(d[0], d[1])) / D2R };
	}

	/**
	 * The skyline the map draws in a direction from the spot: the highest angle of its terrain, as drawn (flat:
	 * atan(rise / distance)), and how far away that is. Sampled from the terrain loaded so far (sparser with
	 * distance, out to 150 km); kept for half a second per direction, as it is asked for every frame.
	 */
	let skylineCache = { key: "", at: 0, value: /** @type {{angle: number, distM: number} | null} */ (null) };
	function drawnSkyline(azDeg) {
		const key = `${spot.lat},${spot.lon},${azDeg.toFixed(2)}`;
		const now = performance.now();
		if (skylineCache.key === key && now - skylineCache.at < 500) return skylineCache.value;
		const eye = eyeAltitude();
		let best = null;
		for (let d = 100; d <= 150000; d *= 1.03) {
			const [lon2, lat2] = destination(spot.lat, spot.lon, azDeg, d);
			const h = map.queryTerrainElevation([lon2, lat2]);
			if (h === null || h === undefined) continue;
			const angle = Math.atan2(h - eye, d) / D2R;
			if (!best || angle > best.angle) best = { angle, distM: d };
		}
		skylineCache = { key, at: now, value: best };
		return best;
	}

	/**
	 * Draws the sun's disc over the eye view. The map is flat (web Mercator: no curvature, no bending), so a
	 * ridge d away is drawn atan(dh / d) up instead of the d (1 - k) / 2R less it is seen at; the sun is raised
	 * by the same amount there, so it stands where it really is against that ridge (standard air), and the
	 * part of it below the ridge is cut off.
	 */
	function placeSun() {
		const disc = $("sunDisc");
		const sun = sunNow();
		if (!eyeMode || sun.app < -1.5) { disc.hidden = true; return; }
		// What hides the sun: the higher of the server's horizon there (if the spot has it) and the terrain the
		// map draws, both as the flat map shows them; the sun is raised by the curvature the flat map leaves
		// out at that distance (see below)
		const entry = entryAtAny(spot, sun.az);
		const server = entry && { angle: Math.atan2(entry.heightM - eyeAltitude(), entry.distanceKm * 1000) / D2R,
			distM: entry.distanceKm * 1000 };
		const drawn = drawnSkyline(sun.az);
		const edge = server && (!drawn || server.angle >= drawn.angle) ? server : drawn;
		const flatten = edge ? edge.distM * (1 - K_STANDARD) / (2 * R_EARTH) / D2R : 0;
		const { W, H, f, F, Rt, U } = cameraBasis();
		/** screen [x, y] of a direction, or null behind the camera */
		const screen = (azDeg, altDeg) => {
			const a = azDeg * D2R, e = altDeg * D2R;
			const d = [Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)];
			const z = d[0] * F[0] + d[1] * F[1] + d[2] * F[2];
			if (z <= 0.05) return null;
			return [W / 2 + f * (d[0] * Rt[0] + d[1] * Rt[1]) / z, H / 2 - f * (d[0] * U[0] + d[1] * U[1] + d[2] * U[2]) / z];
		};
		const at = screen(sun.az, sun.app + flatten);
		if (!at || at[0] < -100 || at[0] > W + 100 || at[1] < -100 || at[1] > H + 100) { disc.hidden = true; return; }
		const r = Math.max(5, f * Math.tan(SUN_RADIUS * D2R));
		disc.hidden = false;
		disc.style.left = `${at[0]}px`;
		disc.style.top = `${at[1]}px`;
		disc.style.width = disc.style.height = `${2 * r}px`;
		// the skyline in that direction, as drawn
		const ridge = edge && screen(sun.az, edge.angle);
		const hidden = ridge ? Math.max(0, Math.min(2 * r, at[1] + r - ridge[1])) : 0;
		disc.style.clipPath = hidden ? `inset(0 0 ${hidden}px 0)` : "";
		disc.hidden = hidden >= 2 * r;
	}
	map.on("render", placeSun);

	/** Puts the controls, the sky and the sun at `when`; with `aimed`, turns to face the sun. */
	function showMoment(aimed = false) {
		const z = zoned(when);
		const d = z.toPlainDate();
		if (!d.equals(date)) {
			date = d;
			setDecl();
			const moved = pickSpot();
			drawData();
			if (moved && eyeMode) look();       // to the new spot's eye, facing the same way
		}
		$("date").value = date.toString();
		$("time").value = z.toPlainTime().toString({ smallestUnit: "minute" });
		$("clock").value = String(z.hour * 60 + z.minute);
		const sun = sunNow();
		const sky = skyAt(-sun.alt);
		map.setSky({ "sky-color": sky.sky, "horizon-color": sky.horizon, "fog-color": sky.horizon,
			"sky-horizon-blend": 0.5, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.75 });
		$("dusk").style.opacity = String(sky.dark);
		const time = z.toLocaleString(HE ? "he-IL" : "en-US", { dateStyle: "medium", timeStyle: "short" });
		$("sunNow").textContent = HE
			? `${time}: השמש בגובה ${fmt(sun.alt, 2)}°${sun.alt > -1.5 ? ` (נראית ${fmt(sun.app, 2)}°)` : ""}, בכיוון ${fmt(sun.az, 1)}°` + (sun.alt < 0 ? ` — ${fmt(-sun.alt, 2)}° מתחת לאופק.` : ".")
			: `${time}: the sun is ${fmt(sun.alt, 2)}° up${sun.alt > -1.5 ? ` (seen at ${fmt(sun.app, 2)}°)` : ""}, at ${fmt(sun.az, 1)}°` + (sun.alt < 0 ? ` — ${fmt(-sun.alt, 2)}° below the horizon.` : ".");
		fillZmanim();
		if (aimed) {
			az = sun.az;
			tilt = clampTilt(sun.app);
			$("tilt").value = String(tilt);
			eyeMode = true;
			look();
		}
		map.triggerRepaint();
	}

	/** The calendar's zmanim for the date shown, when it opened this page for this place and date. */
	function fillZmanim() {
		let items = [];
		try {
			const z = JSON.parse(localStorage.getItem("horizon3d.zmanim") ?? "null");
			if (z && Math.abs(z.lat - lat) < 1e-6 && Math.abs(z.lon - lon) < 1e-6 && z.date === date.toString()) items = z.items;
		} catch (e) { /* none */ }
		const sel = $("zman");
		sel.hidden = $("zmanLabel").hidden = !items.length;
		if (sel.dataset.date === date.toString() && sel.options.length - 1 === items.length) return;
		sel.dataset.date = date.toString();
		const pick = document.createElement("option");
		pick.value = "";
		pick.textContent = HE ? "קפיצה לזמן…" : "Jump to a zman…";
		sel.replaceChildren(pick, ...items.map((/** @type {{title: string, ms: number}} */ it) => {
			const o = document.createElement("option");
			o.value = String(it.ms);
			o.textContent = `${zoned(it.ms).toPlainTime().toString({ smallestUnit: "minute" })} ${it.title}`;
			return o;
		}));
	}

	let playing = 0;
	function stop() { clearInterval(playing); playing = 0; $("play").textContent = "▶"; $("play").setAttribute("aria-pressed", "false"); }
	$("play").onclick = () => {
		if (playing) return stop();
		$("play").textContent = "❚❚"; $("play").setAttribute("aria-pressed", "true");
		playing = setInterval(() => { when += 60000; showMoment(); }, 120);
	};
	$("date").onchange = (e) => {
		if (!e.target.value) return;
		const z = zoned(when);
		when = Temporal.PlainDate.from(e.target.value).toZonedDateTime({ timeZone: tz, plainTime: z.toPlainTime() }).epochMilliseconds;
		showMoment();
	};
	$("time").onchange = (e) => {
		if (!e.target.value) return;
		when = date.toZonedDateTime({ timeZone: tz, plainTime: Temporal.PlainTime.from(e.target.value) }).epochMilliseconds;
		showMoment();
	};
	$("clock").oninput = (e) => {
		const m = Number(e.target.value);
		when = date.toZonedDateTime({ timeZone: tz, plainTime: { hour: Math.floor(m / 60), minute: m % 60 } }).epochMilliseconds;
		showMoment();
	};
	$("back10").onclick = () => { when -= 600000; showMoment(); };
	$("fwd10").onclick = () => { when += 600000; showMoment(); };
	$("now").onclick = () => { stop(); when = Date.now(); showMoment(true); };
	$("faceSun").onclick = () => showMoment(true);
	$("zman").onchange = (e) => {
		if (!e.target.value) return;
		stop();
		when = Number(e.target.value);
		showMoment(true);
		e.target.value = "";
	};

	// ─── Controls ───
	$("evSunrise").onclick = () => setEvent("sunrise");
	$("evSunset").onclick = () => setEvent("sunset");
	$("eyeBtn").onclick = () => { eyeMode = true; look(); };
	$("aboveBtn").onclick = () => {
		eyeMode = false;
		syncHandlers();
		// the spot and its horizon in the direction it faces, seen from behind and above
		const far = entryAt(spot, event, az);
		const to = destination(spot.lat, spot.lon, az, far ? far.distanceKm * 1000 : 20000);
		const bounds = new maplibregl.LngLatBounds([spot.lon, spot.lat], [spot.lon, spot.lat]).extend(to);
		map.fitBounds(bounds, { padding: 80, bearing: az, pitch: 55, duration: 800, maxZoom: 15 });
	};
	$("az").oninput = (e) => { az = Number(e.target.value); eyeMode = true; look(); };
	$("left").onclick = () => { az = (az - 5 + 360) % 360; eyeMode = true; look(); };
	$("right").onclick = () => { az = (az + 5) % 360; eyeMode = true; look(); };
	$("tilt").oninput = (e) => { tilt = Number(e.target.value); eyeMode = true; look(); };
	$("fov").oninput = (e) => { fov = Number(e.target.value); look(); };
	$("imagery").onchange = (e) => {
		const v = e.target.value;
		map.setLayoutProperty("sat", "visibility", v === "sat" ? "visible" : "none");
		map.setLayoutProperty("osm", "visibility", v === "osm" ? "visible" : "none");
	};
	$("spot").onchange = (e) => {
		spot = set.points[Number(e.target.value)];
		spotChosen = true;                       // kept when the date or event changes
		describeWhere();
		drawData();
		look();
	};
	document.addEventListener("keydown", (e) => {
		if (/** @type {HTMLElement} */ (e.target).closest("input, select")) return;
		if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			az = (az + (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 0.2 : 2) + 360) % 360;
			eyeMode = true; look(); e.preventDefault();
		} else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
			tilt = clampTilt(tilt + (e.key === "ArrowUp" ? 0.25 : -0.25));
			$("tilt").value = String(tilt);
			eyeMode = true; look(); e.preventDefault();
		}
	});
	// ─── Looking around, as in Google Earth's ground-level view ───
	// In the eye view you stay where you stand: dragging turns your head (the ground follows the pointer),
	// scrolling or pinching changes the lens, a double click faces that spot. From above, the map's own
	// pan / rotate / zoom apply.
	const canvas = map.getCanvasContainer();
	/** @type {Map<number, {x: number, y: number}>} */
	const pointers = new Map();
	/** @type {{x: number, y: number, az: number, tilt: number, fov: number, dist: number} | null} */
	let grab = null;
	let dragged = false;

	function syncHandlers() {
		for (const h of [map.dragPan, map.dragRotate, map.scrollZoom, map.touchZoomRotate, map.touchPitch, map.doubleClickZoom, map.keyboard])
			eyeMode ? h.disable() : h.enable();
		canvas.style.cursor = eyeMode ? (grab ? "grabbing" : "grab") : "";
		canvas.style.touchAction = eyeMode ? "none" : "";
	}
	const spread = () => {
		const [a, b] = [...pointers.values()];
		return b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
	};
	const startGrab = () => {
		const ps = [...pointers.values()];
		const x = ps.reduce((t, p) => t + p.x, 0) / ps.length, y = ps.reduce((t, p) => t + p.y, 0) / ps.length;
		grab = { x, y, az, tilt, fov, dist: spread() };
	};
	canvas.addEventListener("pointerdown", (e) => {
		if (!eyeMode || (e.pointerType === "mouse" && e.button !== 0)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not capturable: moves still arrive over the map */ }
		dragged = false;
		startGrab();
		syncHandlers();
	});
	canvas.addEventListener("pointermove", (e) => {
		if (!grab || !pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		const ps = [...pointers.values()];
		const x = ps.reduce((t, p) => t + p.x, 0) / ps.length, y = ps.reduce((t, p) => t + p.y, 0) / ps.length;
		if (Math.hypot(x - grab.x, y - grab.y) > 3) dragged = true;
		// a pixel is fov / height degrees at the centre: the ground stays under the pointer
		const perPx = grab.fov / map.getContainer().clientHeight;
		az = ((grab.az - (x - grab.x) * perPx) % 360 + 360) % 360;
		tilt = clampTilt(grab.tilt + (y - grab.y) * perPx);
		if (grab.dist && pointers.size > 1) { fov = clampFov(grab.fov * grab.dist / Math.max(1, spread())); dragged = true; }
		look();
	});
	const release = (/** @type {PointerEvent} */ e) => {
		if (!pointers.delete(e.pointerId)) return;
		if (pointers.size) startGrab(); else grab = null;
		syncHandlers();
		// the click that ends a drag is not a tap on the ground
		if (dragged && !pointers.size) setTimeout(() => { dragged = false; }, 0);
	};
	canvas.addEventListener("pointerup", release);
	canvas.addEventListener("pointercancel", release);
	canvas.addEventListener("wheel", (e) => {
		if (!eyeMode) return;
		e.preventDefault();
		fov = clampFov(fov * Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)));
		look();
	}, { passive: false });

	/**
	 * Turns to face what was tapped: with `dir` (a tap in the eye view: its direction from the camera's
	 * geometry, exact whatever the terrain mesh) that direction, else the ground point `at`.
	 * @param {maplibregl.LngLat} at @param {{az: number, alt: number} | null} dir
	 */
	function faceGround(at, dir) {
		if (dir) {
			az = dir.az;
			tilt = clampTilt(dir.alt);
			eyeMode = true;
			look();
			return;
		}
		const h = map.queryTerrainElevation(at);
		const { dist, bearing } = inverse(spot.lat, spot.lon, at.lat, at.lng);
		az = bearing;
		if (h !== null) tilt = clampTilt(elevationAngle(eyeAltitude(), h, dist));
		eyeMode = true;
		look();
	}

	/** A single tap's popup waits a moment, so a double one can face the spot instead. */
	let tapTimer = 0;
	map.on("dblclick", (e) => {
		clearTimeout(tapTimer);
		if (eyeMode) faceGround(e.lngLat, screenDirection(e.point));
	});
	map.on("click", (e) => {
		if (dragged) return;
		clearTimeout(tapTimer);
		tapTimer = setTimeout(() => showPoint(e), 280);
	});

	function showPoint(e) {
		const { lng, lat: la } = e.lngLat;
		const h = map.queryTerrainElevation(e.lngLat);
		const { dist, bearing } = inverse(spot.lat, spot.lon, la, lng);
		const div = document.createElement("div");
		div.dir = HE ? "rtl" : "ltr";
		const lines = [
			`${fmt(la, 5)}, ${fmt(lng, 5)}`,
			h === null ? "" : `${HE ? "גובה" : "Height"}: ${fmt(h, 0)} m`,
			`${HE ? "מרחק" : "Distance"}: ${fmt(dist / 1000, 2)} km · ${HE ? "כיוון" : "bearing"} ${fmt(bearing, 1)}°`,
			h === null || !Number.isFinite(eyeAltitude()) ? "" : `${HE ? "זווית" : "Angle"}: ${fmt(elevationAngle(eyeAltitude(), h, dist), 2)}° ${HE ? "(אוויר תקני)" : "(standard air)"}`
		].filter(Boolean);
		for (const l of lines) { const p = document.createElement("div"); p.textContent = l; div.append(p); }
		const lookBtn = document.createElement("button");
		lookBtn.className = "btn"; lookBtn.textContent = HE ? "הסתכלו לכאן" : "Look here";
		const dir = eyeMode ? screenDirection(e.point) : null;
		lookBtn.onclick = () => { popup.remove(); faceGround(e.lngLat, dir); };
		const standBtn = document.createElement("button");
		standBtn.className = "btn"; standBtn.textContent = HE ? "עמדו כאן" : "Stand here";
		standBtn.style.marginInlineStart = "6px";
		standBtn.onclick = () => {
			// a spot of one's own: no server horizon for it, just the terrain
			spot = { lat: la, lon: lng, ground: h ?? NaN, height: (h ?? 0) + EYE_M };
			customSpot = true;
			popup.remove(); fillSpots(); describeWhere(); drawData(); eyeMode = true; look();
		};
		div.append(lookBtn, standBtn);
		const popup = new maplibregl.Popup({ maxWidth: "260px" }).setLngLat(e.lngLat).setDOMContent(div).addTo(map);
	}

	// the style, not every tile ("load" waits for all of them): the controls work while the terrain streams in
	await new Promise(resolve => map.isStyleLoaded() ? resolve(null) : map.once("style.load", resolve));
	fillSpots();
	describeWhere();
	setEvent(event);
	showMoment();
	if (pending) waitForHorizon(pending);

	/** "40 s" / "3 min" (rounded: it is an estimate) @param {number} s */
	function aboutTime(s) {
		return s < 90
			? (HE ? `${Math.max(5, Math.round(s / 5) * 5)} שניות` : `${Math.max(5, Math.round(s / 5) * 5)} s`)
			: (HE ? `${Math.round(s / 60)} דקות` : `${Math.round(s / 60)} min`);
	}

	/** Shows the terrain meanwhile, and the horizon once the server has it. @param {HorizonPendingError} p */
	function waitForHorizon(p) {
		$("sunInfo").textContent = p.etaS
			? (HE ? HEBREW.pendingEta.replace("{eta}", aboutTime(p.etaS))
				: `The server is computing this place's horizon for the first time: about ${aboutTime(p.etaS)} more. The terrain is shown meanwhile, and the horizon appears when it is ready.`)
			: t("pending", "The server is still computing this place's horizon (the first time can take a few minutes); the terrain is shown meanwhile, and the horizon appears when it is ready.");
		setTimeout(async () => {
			try {
				set = await fetchSet();
			} catch (e) {
				if (e instanceof HorizonPendingError) return waitForHorizon(e);
				$("sunInfo").textContent = "";
				return horizonFailed(e);
			}
			// the view stays where it is: only the ridge, the eye's height and the sun's point change
			if (!customSpot) spot = set.points[0];
			fillSpots();
			describeWhere();
			setEvent(event, false);
			showMoment();
			look();
		}, p.retryAfterS * 1000);
	}
	// the terrain under the camera arrives after the first frame; aim again once it has
	map.once("idle", () => { if (eyeMode) look(); });
}

main().catch((e) => {
	console.error(e);
	showError(String(e?.message ?? e));
});
