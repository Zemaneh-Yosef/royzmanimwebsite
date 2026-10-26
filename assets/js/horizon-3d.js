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
import { fetchHorizonForArea } from "../libraries/kosherZmanim/horizon-client.js";

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
	legSun: "היכן שהשמש פוגשת אותו היום (בקירוב)",
	legSpot: "היכן שאתם עומדים",
	clickNote: "הקישו על הקרקע לראות מיקום, גובה וזווית.",
	sources: "נתונים",
	errLatLon: "פתחו דף זה ממיקום בלוח (צריך קו רוחב וקו אורך בין 60° דרום ל־60° צפון).",
	errHorizon: "לא ניתן היה לטעון את האופק; פני השטח מוצגים בכל זאת.",
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

/** Refraction (deg) at apparent altitude h (deg): Sæmundsson (1986), standard air. */
const refraction = (h) => 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * D2R) / 60;

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

/** The spot of a vantage set that sees lowest at this azimuth (its `wins`), else the first. @param {HorizonSet} set */
function spotFor(set, event, az) {
	for (const p of set.points) {
		for (const [a, b] of p.wins?.[event] ?? []) {
			if (a <= b ? az >= a && az <= b : az >= a || az <= b) return p;
		}
	}
	return set.points[0];
}

/**
 * Where today's sun meets this spot's horizon: its azimuth when the centre's apparent altitude equals the
 * horizon's elevation angle there (standard air). Two passes: the horizon's angle depends on the azimuth.
 */
function sunOnHorizon(spot, event, decl) {
	let alt = 0, az = null, entry = null;
	for (let i = 0; i < 3; i++) {
		az = sunAzimuthAt(spot.lat, decl, alt - refraction(alt), event);
		if (az === null) return null;
		entry = entryAt(spot, event, az);
		alt = entry ? elevationAngle(spot.height, entry.heightM, entry.distanceKm * 1000) : 0;
	}
	return { az, alt, entry };
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

	const dateParam = q.get("date");
	const day = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? new Date(dateParam + "T12:00:00Z") : new Date();
	// noon at the place, on that day
	const jdNoon = Math.floor(day.getTime() / 86400000) + 2440588 - lon / 360;
	const decl = declination(jdNoon);
	/** @type {SunEvent} */
	let event = q.get("event") === "sunset" ? "sunset" : q.get("event") === "sunrise" ? "sunrise"
		: (((day.getUTCHours() + lon / 15) % 24 + 24) % 24) < 12 ? "sunrise" : "sunset";

	// The horizon set the calendar uses for this place (stored with it), else the same request it makes
	/** @type {HorizonSet | null} */
	let set = null;
	try { set = (await readCachedRefraction(lat, lon))?.horizon ?? null; } catch (e) { /* no stored place */ }
	if (!set) {
		try { set = await fetchHorizonForArea(REFRACTION_SERVER, lat, lon, { version: TERRAIN_VERSION }); }
		catch (e) { showError(t("errHorizon", "The horizon could not be loaded; the terrain is still shown.") + ` (${e?.message ?? e})`); }
	}

	/** @type {HorizonSetPoint} */
	let spot = set?.points?.[0] ?? { lat, lon, ground: NaN, height: NaN };
	let customSpot = false;
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
		maxPitch: 115,
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
		$("fovVal").textContent = `${fov}°`;
		map.setVerticalFieldOfView(fov);
		if (!eyeMode) return;
		// a hair above the eye, so the camera stays clear of the terrain mesh under it
		map.jumpTo(map.calculateCameraOptionsFromCameraLngLatAltRotation([spot.lon, spot.lat], eyeAltitude() + 0.5, az, 90 + tilt));
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
		if (set && !customSpot) {
			const first = sunOnHorizon(set.points[0], ev, decl);
			const s = spotFor(set, ev, first?.az ?? (ev === "sunrise" ? 90 : 270));
			if (s !== spot) { spot = s; fillSpots(); }
		}
		const sun = drawData();
		if (aim) {
			az = sun?.az ?? (ev === "sunrise" ? 90 : 270);
			tilt = sun ? Math.max(-5, Math.min(15, sun.alt)) : 1;
			$("tilt").value = String(tilt);
			eyeMode = true;
			look();
		}
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

	// ─── Controls ───
	$("evSunrise").onclick = () => setEvent("sunrise");
	$("evSunset").onclick = () => setEvent("sunset");
	$("eyeBtn").onclick = () => { eyeMode = true; look(); };
	$("aboveBtn").onclick = () => {
		eyeMode = false;
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
			tilt = Math.max(-10, Math.min(20, tilt + (e.key === "ArrowUp" ? 0.25 : -0.25)));
			$("tilt").value = String(tilt);
			eyeMode = true; look(); e.preventDefault();
		}
	});
	// dragging or zooming the map leaves the eye view until "Eye view" is pressed again
	map.on("dragstart", () => { eyeMode = false; });
	map.on("wheel", () => { eyeMode = false; });

	map.on("click", (e) => {
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
		lookBtn.onclick = () => {
			az = bearing;
			if (h !== null) { tilt = Math.max(-10, Math.min(20, elevationAngle(eyeAltitude(), h, dist))); $("tilt").value = String(tilt); }
			eyeMode = true; popup.remove(); look();
		};
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
	});

	await new Promise(resolve => map.once("load", resolve));
	fillSpots();
	describeWhere();
	setEvent(event);
	// the terrain under the camera arrives after the first frame; aim again once it has
	map.once("idle", () => { if (eyeMode) look(); });
}

main().catch((e) => {
	console.error(e);
	showError(String(e?.message ?? e));
});
