// @ts-check
/**
 * The 3D horizon view (/horizon-3d?lat=..&lon=..[&event=sunrise|sunset][&date=YYYY-MM-DD]).
 *
 * Shows the terrain the visible sunrise / sunset is computed from, from where the observer stands: the
 * refraction server's own heights (/v1/terrain-tiles: the same layers as /v1/horizon) where it has them,
 * the AWS Terrain Tiles elsewhere. On it, the horizon the server found for the location (the same set the
 * calendar uses: stored with the place, else /v1/horizon?area=auto) and the point where today's sun meets
 * it. One link does both events: the toggle turns the observer to face the other one.
 *
 * Drawn with CesiumJS: a round Earth (the WGS84 ellipsoid), the camera exactly at the observer's eye, so a
 * ridge is drawn at its geometric angle, Earth's curvature included. What the drawing leaves out is the air's
 * bending, which raises a ridge d away by d k / 2R (standard air: k = 0.13); the sun's disc is lowered by
 * the same amount there, so it stands where it really is against that ridge.
 */
import * as Cesium from "../libraries/cesium/index.js";
import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { REFRACTION_SERVER, TERRAIN_VERSION, readCachedRefraction, loadRefraction } from "./refraction-data.js";
import { ZmanimDay, zmanimListFromData, timeFormat } from "./core/zmanimCore.js";
import { settings } from "./settings/handler.js";
import { fetchHorizonForArea, HorizonPendingError } from "../libraries/kosherZmanim/horizon-client.js";
import { sunAltAz, morningSunAt, eveningSunAt } from "../libraries/kosherZmanim/star-nightfall.js";
import { ROY_REFRACTION_ARCMIN } from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { terrainSource, SERVER_MAX_ZOOM } from "./horizon-3d-terrain.js";

/** @typedef {import('../libraries/kosherZmanim/royzmanim-spa-corrections.js').HorizonSet} HorizonSet */
/** @typedef {import('../libraries/kosherZmanim/royzmanim-spa-corrections.js').HorizonSetPoint} HorizonSetPoint */
/** @typedef {'sunrise' | 'sunset'} SunEvent */

const R_EARTH = 6371008.8;
/** Refraction coefficient of standard air, as the server picks its horizon points with (terrain.py). */
const K_STANDARD = 0.13;
const EYE_M = 1.7;
/** How far the eye view looks down / up (deg). */
const TILT_MIN = -30, TILT_MAX = 25;
/** The lens's vertical field of view (deg). */
const FOV_MIN = 5, FOV_MAX = 60;
const clampTilt = (/** @type {number} */ x) => Math.max(TILT_MIN, Math.min(TILT_MAX, x));
const clampFov = (/** @type {number} */ x) => Math.max(FOV_MIN, Math.min(FOV_MAX, x));
const D2R = Math.PI / 180;
/** The finest heightmap level made (geographic tiles of 65 x 65 heights: ~38 m apart at level 13, about the 1"
 * data's own spacing); finer, Cesium refines what it has. One level more is four times the tiles. */
const MAX_TERRAIN_LEVEL = 13;

// ─── Language ────────────────────────────────────────────────────────────────
// The page's words are in its HTML, in each language (pages/horizon-3d.html), shown by the site's own setting as
// everywhere else: docLoadBlock.js puts lang-he / lang-he-Latn / lang-en on <body> and core.css hides the rest.
// Here only numbers and names go into the messages' slots.

/** @type {'he' | 'he-Latn' | 'en'} */
const LANG = document.body.classList.contains("lang-he") ? "he"
	: document.body.classList.contains("lang-he-Latn") ? "he-Latn" : "en";
const RTL = document.body.dir === "rtl";

/**
 * Puts a message from the page's <template id="msg-NAME"> into `target`: its [data-v] slots get `values`, and the
 * [data-part]s named in `drop` (optional clauses) are left out.
 * @param {HTMLElement} target @param {string} name @param {Record<string, string>} [values] @param {string[]} [drop]
 */
function show(target, name, values = {}, drop = []) {
	const tpl = /** @type {HTMLTemplateElement} */ (document.getElementById(`msg-${name}`));
	const frag = /** @type {DocumentFragment} */ (tpl.content.cloneNode(true));
	for (const el of /** @type {NodeListOf<HTMLElement>} */ (frag.querySelectorAll("[data-part]")))
		if (drop.includes(el.dataset.part ?? "")) el.remove();
	for (const el of /** @type {NodeListOf<HTMLElement>} */ (frag.querySelectorAll("[data-v]")))
		el.textContent = values[el.dataset.v ?? ""] ?? "";
	target.replaceChildren(frag);
	return target;
}

/** An <option>'s (or other text-only element's) words in the page's language, from its data-he / data-he-latn / data-en. */
const langText = (/** @type {HTMLElement} */ el) => el.dataset[{ he: "he", "he-Latn": "heLatn", en: "en" }[LANG]] ?? el.textContent ?? "";

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

// ─── Terrain: the elevation tiles, as Cesium heightmaps ───────────────────────
// The work (fetching, decoding, resampling, shading) is horizon-3d-terrain.js, in a worker so that it never holds up
// the page; where a worker can't decode images (no OffscreenCanvas), on the page itself.

const tileStats = { server: 0, aws: 0 };
let updateStats = () => {};
const countTile = (/** @type {boolean} */ fromServer) => { tileStats[fromServer ? "server" : "aws"]++; updateStats(); };

/** @returns {{ heightmap: (w: number, s: number, e: number, n: number, level: number) => Promise<Float32Array>,
 *              hillshade: (z: number, x: number, y: number) => Promise<Uint8ClampedArray> }} */
function terrainWork() {
	if (typeof OffscreenCanvas !== "undefined") {
		try {
			const worker = new Worker(new URL("./horizon-3d-terrain-worker.js", import.meta.url), { type: "module" });
			/** @type {Map<number, {resolve: (v: any) => void, reject: (e: any) => void}>} */
			const waiting = new Map();
			let next = 0;
			worker.onmessage = (e) => {
				const m = e.data;
				if ("tile" in m) return countTile(m.tile);
				const w = waiting.get(m.id);
				waiting.delete(m.id);
				if (m.error) w?.reject(new Error(m.error)); else w?.resolve(m.heights ?? m.rgba);
			};
			worker.postMessage({ init: { server: REFRACTION_SERVER } });
			const call = (msg) => new Promise((resolve, reject) => {
				const id = next++;
				waiting.set(id, { resolve, reject });
				worker.postMessage({ id, ...msg });
			});
			return { heightmap: (...a) => call({ heightmap: a }), hillshade: (...a) => call({ hillshade: a }) };
		} catch (e) {
			console.warn("terrain worker:", e);
		}
	}
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = 256;
	const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d", { willReadFrequently: true }));
	return terrainSource({ server: REFRACTION_SERVER, onTile: countTile, decode: async (blob) => {
		const bmp = await createImageBitmap(blob);
		ctx.clearRect(0, 0, 256, 256);
		ctx.drawImage(bmp, 0, 0);
		return ctx.getImageData(0, 0, 256, 256).data;
	} });
}
const work = terrainWork();

/** The heightmaps, ending at MAX_TERRAIN_LEVEL: finer tiles are refined by Cesium from those. */
class ElevationTerrain extends Cesium.CustomHeightmapTerrainProvider {
	constructor() {
		const scheme = new Cesium.GeographicTilingScheme();
		const heights = (x, y, level) => {
			const r = scheme.tileXYToRectangle(x, y, level);
			return work.heightmap(r.west / D2R, r.south / D2R, r.east / D2R, r.north / D2R, level);
		};
		super({
			width: 65, height: 65, tilingScheme: scheme, callback: heights,
			credit: new Cesium.Credit("Terrain: <a href=\"https://github.com/zemaneh-yosef/zemaneh-shamayim\">ROYZmanim server</a> (SRTM, FABDEM, national surveys); elsewhere <a href=\"https://registry.opendata.aws/terrain-tiles/\">AWS Terrain Tiles</a>")
		});
		this.heights = heights;
	}
	requestTileGeometry(x, y, level) {
		return this.heights(x, y, level).then(h => new Cesium.HeightmapTerrainData({
			buffer: h, width: 65, height: 65, childTileMask: level < MAX_TERRAIN_LEVEL ? 15 : 0
		}));
	}
	getTileDataAvailable(x, y, level) {
		return level <= MAX_TERRAIN_LEVEL;
	}
}

/**
 * Shaded relief from the same tiles, for "relief only" (Cesium shades only terrain that comes with surface normals,
 * which heightmaps don't).
 */
class HillshadeImagery extends Cesium.UrlTemplateImageryProvider {
	constructor() {
		super({ url: "hillshade://{z}/{x}/{y}", tilingScheme: new Cesium.WebMercatorTilingScheme(), maximumLevel: SERVER_MAX_ZOOM });
	}
	async requestImage(x, y, level) {
		return createImageBitmap(new ImageData(await work.hillshade(level, x, y), 256, 256));
	}
}

// ─── Page ────────────────────────────────────────────────────────────────────

const $ = (id) => /** @type {any} */ (document.getElementById(id));
const fmt = (x, d = 1) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

async function main() {
	for (const o of /** @type {NodeListOf<HTMLOptionElement>} */ (document.querySelectorAll("option[data-en]"))) o.textContent = langText(o);
	// The place as the calendar's own parameters give it (locationName, lat, long, elevation, timeZone), which the
	// location panel's link passes on; lon / tz from older links
	const q = new URLSearchParams(location.search);
	const lat = Number(q.get("lat")), lon = Number(q.get("long") ?? q.get("lon"));
	const elevation = Number(q.get("elevation")) || 0;
	const tzParam = q.get("timeZone") ?? q.get("tz");
	if (!q.get("lat") || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 60 || Math.abs(lon) > 180) {
		show($("err"), "errLatLon");
		return;
	}
	if (!document.createElement("canvas").getContext("webgl2") && !document.createElement("canvas").getContext("webgl")) {
		show($("err"), "errWebgl");
		return;
	}
	// The terrain and imagery servers speak HTTP/2 and 3, one connection carrying many requests at once: Cesium
	// need not hold back to its 18 per server (sized for HTTP/1.1's six connections). Each tile's finer ones wait
	// for it, so the more asked for at once, the sooner the deepest arrive.
	Cesium.RequestScheduler.maximumRequests = 120;
	for (const url of [REFRACTION_SERVER, "https://tiles.maps.eox.at/"]) {
		Cesium.RequestScheduler.requestsByServer[Cesium.RequestScheduler.getServerKey(url)] = 60;
	}
	// The server's terrain in Cesium's own format, asked for now so that it arrives while the horizon is read
	const ownTerrain = Cesium.CesiumTerrainProvider.fromUrl(`${REFRACTION_SERVER}/v1/cesium-terrain`, { requestVertexNormals: true })
		.then(provider => ({ provider }), error => ({ provider: null, error }));
	// Back to the calendar page that opened this one, as it was (its own parameters: locationName, lat, long,
	// elevation, timeZone, ...), only ever on this site; else the main calendar for this place
	const backParam = q.get("back") ?? "";
	if (backParam.startsWith("/") && !backParam.startsWith("//") && !backParam.startsWith("/\\")) {
		$("back").href = backParam;
	} else {
		const cal = new URLSearchParams({ lat: String(lat), long: String(lon), elevation: String(elevation) });
		if (q.get("locationName")) cal.set("locationName", /** @type {string} */ (q.get("locationName")));
		if (tzParam) cal.set("timeZone", tzParam);
		$("back").href = `/calendar?${cal}`;
	}

	// The moment shown: a date and a time at the place (its time zone from the calendar, else this device's)
	const tz = (() => {
		try { if (tzParam) return Temporal.Now.zonedDateTimeISO(tzParam).timeZoneId; } catch (e) { /* not a time zone */ }
		return Temporal.Now.timeZoneId();
	})();
	// whole milliseconds, as ROYZmanim.js converts its computed times: sunrise / sunset found by bisection have fractions
	const zoned = (/** @type {number} */ ms) => Temporal.Instant.fromEpochMilliseconds(Math.round(ms)).toZonedDateTimeISO(tz);
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
		show($("err"), "errHorizon", { detail: String(e?.message ?? e) });
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

	updateStats = () => show($("tileStats"), "tiles", { server: String(tileStats.server), aws: String(tileStats.aws),
		total: String(tileStats.server + tileStats.aws) });

	// ─── The globe ───
	const imagery = {
		sat: new Cesium.UrlTemplateImageryProvider({
			url: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg",
			tilingScheme: new Cesium.WebMercatorTilingScheme(), maximumLevel: 15,
			credit: new Cesium.Credit("<a href=\"https://s2maps.eu\">Sentinel-2 cloudless 2016</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016)")
		}),
		osm: new Cesium.UrlTemplateImageryProvider({
			url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", maximumLevel: 19,
			credit: new Cesium.Credit("© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors")
		})
	};
	// The server's terrain in Cesium's own format (quantized-mesh with surface normals: no work here, and Cesium
	// shades it); from a server without it, the Mercator tiles made into heightmaps here
	/** @type {Cesium.TerrainProvider} */
	let terrainProvider, ownFormat = true;
	const own = await ownTerrain;
	if (own.provider) terrainProvider = own.provider;
	else {
		console.warn("terrain in Cesium's format not available, using the map tiles:", own.error);
		terrainProvider = new ElevationTerrain();
		ownFormat = false;
	}
	const widget = new Cesium.CesiumWidget("map", {
		terrainProvider,
		baseLayer: new Cesium.ImageryLayer(imagery.sat),
		scene3DOnly: true,
		// drawn only when something changes (the view, the moment, the markers, tiles arriving), not every frame
		requestRenderMode: true,
		maximumRenderTimeChange: Infinity,
		// the sky is the page's own (behind a transparent globe view): by the sun's depression, as the calendar
		// reckons twilight in degrees; Cesium's darkens far too early and leaves the ground lit
		skyBox: false, skyAtmosphere: false,
		contextOptions: { webgl: { alpha: true } },
		// drawn at the screen's own pixels (on a high-DPI screen Cesium otherwise draws fewer and stretches them):
		// affordable, as a frame is drawn only on a change
		useBrowserRecommendedResolution: false,
		// anti-aliased (Cesium's default, made explicit): the ridges' edges against the sky are what the view is for
		msaaSamples: 4
	});
	const scene = widget.scene, camera = scene.camera, globe = scene.globe;
	// without WebGL 2 (no multisampling), smoothed after drawing instead
	if (!scene.msaaSupported) scene.postProcessStages.fxaa.enabled = true;
	/** made when "relief only" is first chosen (only with the map tiles: the server's own terrain is lit instead) */
	let relief = null;
	if (ownFormat) {
		// the ground shaded as a relief map is: by a light from the north-west, 45 deg up, over this place
		const enu = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(lon, lat));
		const toLight = Cesium.Matrix4.multiplyByPointAsVector(enu, new Cesium.Cartesian3(-0.5, 0.5, Math.SQRT1_2), new Cesium.Cartesian3());
		scene.light = new Cesium.DirectionalLight({ direction: Cesium.Cartesian3.negate(toLight, toLight), intensity: 1.6 });
		globe.enableLighting = true;
		globe.dynamicAtmosphereLighting = false;
	}
	globe.depthTestAgainstTerrain = true;          // markers behind a hill are hidden by it
	globe.showGroundAtmosphere = false;            // it whitens far terrain, the horizon's own ridges
	globe.showWaterEffect = false;                 // no animated waves (nor the texture for them, not vendored)
	globe.baseColor = Cesium.Color.fromCssColorString("#c9c3b4");
	scene.backgroundColor = Cesium.Color.TRANSPARENT;
	globe.maximumScreenSpaceError = 2;
	globe.preloadAncestors = true;
	scene.fog.enabled = false;                     // fog would thin out the far ridges the horizon is made of
	if (scene.sun) scene.sun.show = false;         // drawn below, where refraction puts it
	if (scene.moon) scene.moon.show = false;
	scene.screenSpaceCameraController.enableCollisionDetection = false;   // the camera stays exactly at the eye
	camera.frustum.near = 0.2;
	widget.clock.shouldAnimate = false;
	window.addEventListener("error", (e) => console.warn(e.message));

	/** The observer's eye above sea level: the server's height for the spot, else the ground under it + eye. */
	function eyeAltitude() {
		if (Number.isFinite(spot.height)) return spot.height;
		const g = globe.getHeight(Cesium.Cartographic.fromDegrees(spot.lon, spot.lat));
		return (g ?? 0) + EYE_M;
	}

	/** Cesium's field of view is the wider side's: the lens is the vertical one. */
	function setFov() {
		const c = scene.canvas, aspect = c.clientWidth / Math.max(1, c.clientHeight);
		const f = /** @type {Cesium.PerspectiveFrustum} */ (camera.frustum);
		f.fov = aspect >= 1 ? 2 * Math.atan(Math.tan(fov / 2 * D2R) * aspect) : fov * D2R;
		scene.requestRender();
	}

	function look() {
		$("az").value = String(az);
		$("azVal").textContent = `${fmt(az, 1)}°`;
		$("tiltVal").textContent = `${fmt(tilt, 2)}°`;
		$("tilt").value = String(tilt);
		$("fov").value = String(fov);
		$("fovVal").textContent = `${Math.round(fov)}°`;
		setFov();
		syncHandlers();
		if (!eyeMode) return;
		// at the eye (a hair above it, clear of the ground's mesh), facing az, tilt above the horizontal
		camera.setView({
			destination: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, eyeAltitude() + 0.5),
			orientation: { heading: az * D2R, pitch: tilt * D2R, roll: 0 }
		});
	}

	// ─── Markers: the server's horizon, where the sun meets it, the spots ───
	const ridgePoints = scene.primitives.add(new Cesium.PointPrimitiveCollection());
	const markPoints = scene.primitives.add(new Cesium.PointPrimitiveCollection());
	const ORANGE = Cesium.Color.fromCssColorString("#d97706"), SUN = Cesium.Color.fromCssColorString("#f5b400");
	const at = (la, lo, h) => Cesium.Cartesian3.fromDegrees(lo, la, h);

	function drawData() {
		// both events' horizons: whatever can hide the sun, whichever way the view faces
		ridgePoints.removeAll();
		for (const ev of /** @type {SunEvent[]} */ (["sunrise", "sunset"])) {
			for (const e of spot[ev] ?? []) {
				if (!("distanceKm" in e)) continue;
				const [lo, la] = destination(spot.lat, spot.lon, e.azimuthDeg, e.distanceKm * 1000);
				ridgePoints.add({ position: at(la, lo, e.heightM + 1), pixelSize: 6, color: ORANGE,
					outlineColor: Cesium.Color.WHITE, outlineWidth: 1, disableDepthTestDistance: 0 });
			}
		}
		markPoints.removeAll();
		const sun = Number.isFinite(spot.height) ? sunOnHorizon(spot, event, decl) : null;
		if (sun) {
			if (sun.entry) {
				const [lo, la] = destination(spot.lat, spot.lon, sun.az, sun.entry.distanceKm * 1000);
				markPoints.add({ position: at(la, lo, sun.entry.heightM + 1), pixelSize: 16, color: SUN,
					outlineColor: Cesium.Color.fromCssColorString("#7c2d12"), outlineWidth: 2 });
			}
			show($("sunInfo"), event, sun.entry
				? { az: fmt(sun.az, 1), dist: fmt(sun.entry.distanceKm, 1), height: fmt(sun.entry.heightM, 0), angle: fmt(sun.alt, 2) }
				: { az: fmt(sun.az, 1) }, sun.entry ? [] : ["over"]);
		} else {
			$("sunInfo").replaceChildren();
		}
		for (const p of customSpot ? [spot] : set?.points ?? [spot]) {
			if (!Number.isFinite(p.ground)) continue;
			markPoints.add({ position: at(p.lat, p.lon, p.ground + 0.5), pixelSize: p === spot ? 12 : 7,
				color: Cesium.Color.fromCssColorString(p === spot ? "#2563eb" : "#93c5fd"),
				outlineColor: Cesium.Color.WHITE, outlineWidth: 1.5 });
		}
		scene.requestRender();
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
		const name = area?.name && !customSpot ? area.name : "";
		show($("where"), "where", { lat: fmt(spot.lat, 5), lon: fmt(spot.lon, 5), eye: fmt(spot.height, 1), area: name },
			[...(Number.isFinite(spot.height) ? [] : ["eye"]), ...(name ? [] : ["area"])]);
	}

	// ─── The moment: the sun where it is, the sky and ground lit by it ───

	/** The sun's true (unrefracted) and apparent altitude and its azimuth at `when`, from the spot. */
	function sunNow() {
		return sunAt(when);
	}
	function sunAt(/** @type {number} */ ms) {
		const [alt, sAz] = sunAltAz(ms, spot.lat, spot.lon);
		return { alt, app: alt > -1.5 ? alt + refractionTrue(Math.max(alt, -1)) : alt, az: sAz };
	}

	/**
	 * The moment the sun's disc and the sky are drawn at: it glides to `when` (an ease-out of up to ~1/3 s) instead
	 * of jumping a quarter of a degree with every minute; a change of more than three hours is shown at once.
	 */
	let shownWhen = when, glide = 0;
	function glideTo() {
		cancelAnimationFrame(glide);
		const from = shownWhen, to = when, span = Math.abs(to - from);
		const apply = () => { sky = skyAt(-sunAt(shownWhen).alt); darkenGround(); };
		if (!span || span > 3 * 3600000) { shownWhen = to; apply(); return; }
		const t0 = performance.now(), dur = Math.min(350, 120 + span / 60000 * 20);
		const step = () => {
			const f = Math.min(1, (performance.now() - t0) / dur);
			shownWhen = from + (to - from) * (1 - (1 - f) ** 3);
			apply();                                 // asks for a frame too
			if (f < 1) glide = requestAnimationFrame(step);
		};
		glide = requestAnimationFrame(step);
	}

	/** The world point 100 km from the eye in a direction (azimuth, altitude in deg). */
	function pointToward(azDeg, altDeg) {
		const eye = at(spot.lat, spot.lon, eyeAltitude() + 0.5);
		const enu = Cesium.Transforms.eastNorthUpToFixedFrame(eye);
		const a = azDeg * D2R, e = altDeg * D2R;
		const dir = Cesium.Matrix4.multiplyByPointAsVector(enu,
			new Cesium.Cartesian3(Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)), new Cesium.Cartesian3());
		return Cesium.Cartesian3.add(eye, Cesium.Cartesian3.multiplyByScalar(dir, 1e5, dir), new Cesium.Cartesian3());
	}
	/** A world point's place on the screen (CSS px), or undefined behind the camera. */
	const toScreen = (p) => Cesium.SceneTransforms.worldToWindowCoordinates(scene, p);

	/** The direction (azimuth, altitude in deg) a screen point looks in, in the eye view. */
	function screenDirection(/** @type {{x: number, y: number}} */ pt) {
		const ray = camera.getPickRay(new Cesium.Cartesian2(pt.x, pt.y));
		if (!ray) return null;
		const enu = Cesium.Transforms.eastNorthUpToFixedFrame(camera.positionWC);
		const inv = Cesium.Matrix4.inverseTransformation(enu, new Cesium.Matrix4());
		const d = Cesium.Matrix4.multiplyByPointAsVector(inv, ray.direction, new Cesium.Cartesian3());
		return { az: (Math.atan2(d.x, d.y) / D2R + 360) % 360, alt: Math.atan2(d.z, Math.hypot(d.x, d.y)) / D2R };
	}

	/**
	 * Where the terrain Cesium draws hides the sun in a direction, where the spot has no server horizon there (a
	 * direction another spot of the area covers, or "Stand here"): the highest point of the drawn ground along
	 * it, from 1 km (as the server's horizons) to 150 km; kept for half a second per direction.
	 */
	let skylineCache = { key: "", at: 0, value: /** @type {{lat: number, lon: number, h: number, distM: number} | null} */ (null) };
	function drawnSkyline(azDeg) {
		const key = `${spot.lat},${spot.lon},${azDeg.toFixed(2)}`;
		const now = performance.now();
		if (skylineCache.key === key && now - skylineCache.at < 500) return skylineCache.value;
		const eye = eyeAltitude();
		let best = null, bestAngle = -Infinity;
		for (let d = 1000; d <= 150000; d *= 1.02) {
			const [lo, la] = destination(spot.lat, spot.lon, azDeg, d);
			const h = globe.getHeight(Cesium.Cartographic.fromDegrees(lo, la));
			if (h === undefined) continue;
			const angle = Math.atan2(h - eye - d * d / (2 * R_EARTH), d);
			if (angle > bestAngle) { bestAngle = angle; best = { lat: la, lon: lo, h, distM: d }; }
		}
		skylineCache = { key, at: now, value: best };
		return best;
	}

	/**
	 * Draws the sun's disc over the eye view, where it is seen (refraction included), lowered by what the drawing
	 * leaves out of the ridge behind it (the air's bending: d k / 2R), so it stands where it really is against that
	 * ridge (standard air); the part below the ridge is cut off. What hides it: the server's horizon there (what the
	 * calendar computes with, and what the orange dots show), else the drawn ground.
	 */
	function placeSun() {
		const disc = $("sunDisc");
		const sun = sunAt(shownWhen);
		if (!eyeMode || sun.app < -1.5) { disc.hidden = true; return; }
		const entry = entryAtAny(spot, sun.az);
		let edgePoint = null, distM = 0;
		if (entry) {
			const [lo, la] = destination(spot.lat, spot.lon, sun.az, entry.distanceKm * 1000);
			edgePoint = at(la, lo, entry.heightM);
			distM = entry.distanceKm * 1000;
		} else {
			const s = drawnSkyline(sun.az);
			if (s) { edgePoint = at(s.lat, s.lon, s.h); distM = s.distM; }
		}
		const bend = distM * K_STANDARD / (2 * R_EARTH) / D2R;
		const c = toScreen(pointToward(sun.az, sun.app - bend));
		const H = scene.canvas.clientHeight;
		if (!c || c.x < -100 || c.x > scene.canvas.clientWidth + 100 || c.y < -100 || c.y > H + 100) { disc.hidden = true; return; }
		const r = Math.max(5, H / 2 / Math.tan(fov / 2 * D2R) * Math.tan(SUN_RADIUS * D2R));
		disc.hidden = false;
		disc.style.left = `${c.x}px`;
		disc.style.top = `${c.y}px`;
		disc.style.width = disc.style.height = `${2 * r}px`;
		// the ridge's edge on screen, straight below or above the sun's centre
		const e = edgePoint && toScreen(edgePoint);
		const hidden = e ? Math.max(0, Math.min(2 * r, c.y + r - e.y)) : 0;
		disc.style.clipPath = hidden ? `inset(0 0 ${hidden}px 0)` : "";
		disc.hidden = hidden >= 2 * r;
	}
	scene.postRender.addEventListener(placeSun);

	/** The sky behind the globe: the depression's colours, the horizon's glow at the horizon line on screen. */
	let sky = skyAt(6), skyKey = "";
	function paintSky() {
		const H = scene.canvas.clientHeight;
		const p = toScreen(pointToward(az, 0));
		const y = p ? Math.max(-H, Math.min(2 * H, p.y)) : H / 2;
		const key = `${sky.sky}${sky.horizon}${Math.round(y)}`;
		if (key === skyKey) return;
		skyKey = key;
		$("map").style.background = `linear-gradient(to bottom, ${sky.sky} 0px, ${sky.sky} ${Math.round(y - H * 0.55)}px, ${sky.horizon} ${Math.round(y)}px, ${sky.horizon} 100%)`;
	}
	scene.postRender.addEventListener(paintSky);
	/** The ground as dark as the sky says. */
	function darkenGround() {
		const b = 1 - sky.dark;
		for (let i = 0; i < scene.imageryLayers.length; i++) scene.imageryLayers.get(i).brightness = b;
		globe.baseColor = Cesium.Color.fromCssColorString("#c9c3b4").withAlpha(1).darken(sky.dark, new Cesium.Color());
		scene.requestRender();                     // the sun's disc and the sky follow the moment too
	}

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
		// the event the moment belongs to: the morning's sunrise or the afternoon's sunset (the view stays put)
		const ev = sun.az < 180 ? "sunrise" : "sunset";
		if (ev !== event) setEvent(ev, false);
		// the sky and the ground's light by the sun's depression at that moment (gliding there with the disc)
		glideTo();
		show($("sunNow"), "sunNow", {
			time: z.toLocaleString(LANG === "he" ? "he-IL" : "en-US", { dateStyle: "medium", timeStyle: "short" }),
			alt: fmt(sun.alt, 2), app: fmt(sun.app, 2), az: fmt(sun.az, 1), below: fmt(-sun.alt, 2)
		}, [...(sun.alt > -1.5 ? [] : ["seen"]), ...(sun.alt < 0 ? [] : ["below"])]);
		fillZmanim();
		if (aimed) {
			az = sun.az;
			tilt = clampTilt(sun.app);
			eyeMode = true;
			look();
		}
	}

	// ─── The calendar's zemanim, for "jump to a zman" ───
	// The same list as /calendar (_data/zmanim.yml, embedded in the page) and the same calculator
	// (core/zmanimCore.js ZmanimDay: the calendar's settings, this place's air, horizon and haze), so the times
	// are the calendar's, for whatever date is shown.
	const zmanimData = JSON.parse(/** @type {HTMLElement} */ (document.getElementById("zmanimData")).textContent ?? "[]");
	/** @type {ZmanimDay | null} */
	let zmanimDay = null;
	/** The calculator, with this place's refraction data when there is some (as the calendar: its plain times first). */
	function makeZmanimDay(/** @type {any} */ refraction) {
		zmanimDay = new ZmanimDay({
			geoLocation: new KosherZmanim.GeoLocation(q.get("locationName") ?? "", lat, lon, elevation, tz),
			settings, zmanimList: zmanimListFromData(zmanimData), refraction, date,
			dtF: timeFormat({ language: LANG, hourCycle: settings.timeFormat(), seconds: settings.seconds() })
		});
		$("zman").dataset.date = "";
		fillZmanim();
	}
	/** The calendar's air, horizon and haze for this place (stored by it, else fetched), then the times with them. */
	async function setupZmanim() {
		if (!zmanimDay) makeZmanimDay(undefined);
		try {
			const r = await loadRefraction(lat, lon, { humidity: settings.refraction.humidity() });
			makeZmanimDay({ atmosphereProvider: r.provider, horizon: r.horizon, haze: r.haze });
		} catch (e) {
			console.warn("refraction data:", e);       // the calendar's fallback too: the plain times
		}
	}

	/** The zemanim the calendar shows on the date shown. */
	function fillZmanim() {
		const sel = $("zman");
		sel.hidden = $("zmanLabel").hidden = !zmanimDay;
		if (!zmanimDay || sel.dataset.date === date.toString()) return;
		sel.dataset.date = date.toString();
		const plain = document.createElement("template");
		const pick = document.createElement("option");
		pick.value = "";
		pick.textContent = langText(sel);
		sel.replaceChildren(pick, ...zmanimDay.shownOn(date, LANG).map(z => {
			plain.innerHTML = z.title;                 // titles may hold markup (<sup>)
			const o = document.createElement("option");
			o.value = String(z.time.epochMilliseconds);
			o.textContent = `${z.timeText} ${(plain.content.textContent ?? "").replace(/\s+/g, " ").trim()}`;
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
		const reach = far ? far.distanceKm * 1000 : 20000;
		const [lo, la] = destination(spot.lat, spot.lon, (az + 180) % 360, reach * 0.6);
		camera.flyTo({ destination: at(la, lo, eyeAltitude() + reach * 0.5),
			orientation: { heading: az * D2R, pitch: -35 * D2R, roll: 0 }, duration: 0.8 });
	};
	$("az").oninput = (e) => { az = Number(e.target.value); eyeMode = true; look(); };
	$("left").onclick = () => { az = (az - 5 + 360) % 360; eyeMode = true; look(); };
	$("right").onclick = () => { az = (az + 5) % 360; eyeMode = true; look(); };
	$("tilt").oninput = (e) => { tilt = Number(e.target.value); eyeMode = true; look(); };
	$("fov").oninput = (e) => { fov = Number(e.target.value); look(); };
	$("imagery").onchange = (e) => {
		const v = e.target.value;
		scene.imageryLayers.removeAll();
		if (v === "sat" || v === "osm") scene.imageryLayers.addImageryProvider(imagery[v]);
		else if (!ownFormat) scene.imageryLayers.addImageryProvider(relief ??= new HillshadeImagery());
		darkenGround();
	};
	$("spot").onchange = (e) => {
		spot = set.points[Number(e.target.value)];
		spotChosen = true;                       // kept when the date or event changes
		describeWhere();
		drawData();
		look();
	};
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") { popup.hidden = true; return; }
		if (/** @type {HTMLElement} */ (e.target).closest("input, select") || e.ctrlKey || e.metaKey || e.altKey) return;
		if (!eyeMode) { if (aboveKey(e)) { e.preventDefault(); scene.requestRender(); } return; }
		if (e.key === "+" || e.key === "=" || e.key === "-") {
			fov = clampFov(fov * (e.key === "-" ? 1.25 : 0.8));
			look(); e.preventDefault();
		} else if (e.key === "n" || e.key === "N") {
			az = 0; look();
		} else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			az = (az + (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 0.2 : 2) + 360) % 360;
			eyeMode = true; look(); e.preventDefault();
		} else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
			tilt = clampTilt(tilt + (e.key === "ArrowUp" ? 0.25 : -0.25));
			eyeMode = true; look(); e.preventDefault();
		}
	});
	window.addEventListener("resize", () => look());

	/** The point the view is centred on (the ground), or null. */
	function centrePoint() {
		const ray = camera.getPickRay(new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2));
		return (ray && globe.pick(ray, scene)) || null;
	}
	/** Turns and tilts the view about the point it is centred on (or, over the sky, in place). */
	function orbit(dHeading, dPitch, heading = camera.heading + dHeading) {
		const pitch = Math.max(-Math.PI / 2, Math.min(-2 * D2R, camera.pitch + dPitch));
		const c = centrePoint();
		if (!c) { camera.setView({ orientation: { heading, pitch, roll: 0 } }); return; }
		camera.lookAt(c, new Cesium.HeadingPitchRange(heading, pitch, Cesium.Cartesian3.distance(camera.position, c)));
		camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
	}
	/**
	 * Google Earth's keys from above: arrows pan, Shift+arrows turn and tilt, + / - (or Page Up / Down) zoom, N faces
	 * north, U looks straight down, R does both. True if the key was one of them.
	 */
	function aboveKey(/** @type {KeyboardEvent} */ e) {
		const above = camera.positionCartographic.height - (globe.getHeight(camera.positionCartographic) ?? 0);
		const step = Math.max(20, above) * 0.15;
		const turn = 5 * D2R, k = e.key;
		if (k.startsWith("Arrow") && e.shiftKey) {
			if (k === "ArrowLeft" || k === "ArrowRight") orbit(k === "ArrowLeft" ? -turn : turn, 0);
			else orbit(0, k === "ArrowUp" ? turn / 2 : -turn / 2);
		} else if (k.startsWith("Arrow")) {
			// along the ground: the heading's way, as the view looks
			const c = camera.positionCartographic, h = camera.heading / D2R;
			const bearing = h + { ArrowUp: 0, ArrowRight: 90, ArrowDown: 180, ArrowLeft: 270 }[k];
			const [lo, la] = destination(c.latitude / D2R, c.longitude / D2R, (bearing + 360) % 360, step);
			camera.setView({ destination: at(la, lo, c.height), orientation: { heading: camera.heading, pitch: camera.pitch, roll: 0 } });
		} else if (k === "+" || k === "=" || k === "PageUp") camera.zoomIn(step * 2);
		else if (k === "-" || k === "PageDown") camera.zoomOut(step * 2);
		else if (k === "n" || k === "N") orbit(0, 0, 0);
		else if (k === "u" || k === "U") orbit(0, -Math.PI);
		else if (k === "r" || k === "R") orbit(0, -Math.PI, 0);
		else return false;
		return true;
	}

	// ─── Looking around, as in Google Earth's ground-level view ───
	// In the eye view you stay where you stand: dragging turns your head (the ground follows the pointer),
	// scrolling or pinching changes the lens, a double click faces that spot. From above, Google Earth's: drag
	// pans, Shift+drag tilts and turns about the point, Ctrl (or Alt) + drag looks around, scroll or right-drag
	// zooms toward the pointer, a double click flies toward the spot; on a touch screen two fingers pinch, twist
	// and (moved up or down together) tilt. Cesium's own handling, with Shift and Ctrl swapped to match.
	const canvas = scene.canvas;
	{
		const ssc = scene.screenSpaceCameraController, CE = Cesium.CameraEventType, KM = Cesium.KeyboardEventModifier;
		ssc.tiltEventTypes = [CE.MIDDLE_DRAG, CE.PINCH, { eventType: CE.LEFT_DRAG, modifier: KM.SHIFT },
			{ eventType: CE.RIGHT_DRAG, modifier: KM.SHIFT }];
		ssc.lookEventTypes = [{ eventType: CE.LEFT_DRAG, modifier: KM.CTRL }, { eventType: CE.LEFT_DRAG, modifier: KM.ALT }];
	}
	/** @type {Map<number, {x: number, y: number}>} */
	const pointers = new Map();
	/** @type {{x: number, y: number, az: number, tilt: number, fov: number, dist: number} | null} */
	let grab = null;
	let dragged = false;

	function syncHandlers() {
		scene.screenSpaceCameraController.enableInputs = !eyeMode;
		canvas.style.cursor = eyeMode ? (grab ? "grabbing" : "grab") : "";
		canvas.style.touchAction = "none";
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
	/** where the last press began: from above (Cesium's own dragging), a click that ends a drag is no tap either */
	let pressAt = { x: 0, y: 0 };
	canvas.addEventListener("pointerdown", (e) => {
		pressAt = { x: e.clientX, y: e.clientY };
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
		const perPx = grab.fov / canvas.clientHeight;
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

	/** The ground under a screen point: its place and height, or null (sky). */
	function groundAt(/** @type {{x: number, y: number}} */ pt) {
		const ray = camera.getPickRay(new Cesium.Cartesian2(pt.x, pt.y));
		const p = ray && globe.pick(ray, scene);
		if (!p) return null;
		const c = Cesium.Cartographic.fromCartesian(p);
		return { lat: c.latitude / D2R, lon: c.longitude / D2R, h: c.height };
	}

	/**
	 * Turns to face what was tapped: with `dir` (a tap in the eye view: its direction from the camera, exact) that
	 * direction, else the ground point `g`.
	 */
	function faceGround(g, dir) {
		if (dir) {
			az = dir.az;
			tilt = clampTilt(dir.alt);
		} else if (g) {
			const { dist, bearing } = inverse(spot.lat, spot.lon, g.lat, g.lon);
			az = bearing;
			tilt = clampTilt(elevationAngle(eyeAltitude(), g.h, dist));
		}
		eyeMode = true;
		look();
	}

	/** A single tap's popup waits a moment, so a double one can face the spot instead. */
	let tapTimer = 0;
	const popup = /** @type {HTMLElement} */ ($("popup"));
	canvas.addEventListener("dblclick", (e) => {
		clearTimeout(tapTimer);
		const pt = { x: e.offsetX, y: e.offsetY };
		if (eyeMode) faceGround(null, screenDirection(pt));
		else {
			// from above, as Google Earth: halfway toward the spot, looking the same way
			const ray = camera.getPickRay(new Cesium.Cartesian2(pt.x, pt.y));
			const p = ray && globe.pick(ray, scene);
			if (p) camera.flyTo({ destination: Cesium.Cartesian3.lerp(camera.position, p, 0.5, new Cesium.Cartesian3()),
				orientation: { heading: camera.heading, pitch: camera.pitch, roll: 0 }, duration: 0.5 });
		}
	});
	canvas.addEventListener("click", (e) => {
		if (dragged || Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 3) return;
		clearTimeout(tapTimer);
		const pt = { x: e.offsetX, y: e.offsetY };
		tapTimer = window.setTimeout(() => showPoint(pt), 280);
	});

	function showPoint(pt) {
		popup.hidden = true;
		const g = groundAt(pt);
		if (!g) return;
		const { dist, bearing } = inverse(spot.lat, spot.lon, g.lat, g.lon);
		const angle = Number.isFinite(eyeAltitude()) ? elevationAngle(eyeAltitude(), g.h, dist) : null;
		const body = show(/** @type {HTMLElement} */ (popup.querySelector(".popup-body")), "point", {
			lat: fmt(g.lat, 5), lon: fmt(g.lon, 5), height: fmt(g.h, 0), dist: fmt(dist / 1000, 2),
			bearing: fmt(bearing, 1), angle: angle === null ? "" : fmt(angle, 2)
		}, angle === null ? ["angle"] : []);
		const dir = eyeMode ? screenDirection(pt) : null;
		/** @type {HTMLButtonElement} */ (body.querySelector('[data-action="look"]')).onclick = () => { popup.hidden = true; faceGround(g, dir); };
		/** @type {HTMLButtonElement} */ (body.querySelector('[data-action="stand"]')).onclick = () => {
			// a spot of one's own: no server horizon for it, just the terrain
			spot = { lat: g.lat, lon: g.lon, ground: g.h, height: g.h + EYE_M };
			customSpot = true;
			popup.hidden = true; fillSpots(); describeWhere(); drawData(); eyeMode = true; look();
		};
		popup.style.left = `${Math.min(pt.x + 12, canvas.clientWidth - 240)}px`;
		popup.style.top = `${Math.max(8, pt.y - 20)}px`;
		popup.hidden = false;
	}
	/** @type {HTMLButtonElement} */ (popup.querySelector(".popup-close")).onclick = () => { popup.hidden = true; };

	fillSpots();
	describeWhere();
	setEvent(event);
	showMoment();
	if (pending) waitForHorizon(pending);
	setupZmanim().catch(e => console.error("zemanim:", e));

	/** Shows the terrain meanwhile, and the horizon once the server has it. @param {HorizonPendingError} p */
	function waitForHorizon(p) {
		// the server's estimate, rounded (it is one): to 5 s under a minute and a half, else to minutes
		const s = p.etaS ?? 0;
		show($("sunInfo"), "pending", { eta: String(s < 90 ? Math.max(5, Math.round(s / 5) * 5) : Math.round(s / 60)) },
			!s ? ["eta"] : s < 90 ? ["min"] : ["sec"]);
		setTimeout(async () => {
			try {
				set = await fetchSet();
			} catch (e) {
				if (e instanceof HorizonPendingError) return waitForHorizon(e);
				$("sunInfo").replaceChildren();
				return horizonFailed(e);
			}
			// the view stays where it is: only the ridge, the eye's height and the sun's point change
			if (!customSpot) spot = set.points[0];
			fillSpots();
			describeWhere();
			setEvent(event, false);
			showMoment();
			look();
			setupZmanim().catch(e => console.error("zemanim:", e));   // the visible sunrise needs the horizon too
		}, p.retryAfterS * 1000);
	}
}

main().catch((e) => {
	console.error(e);
	$("err").textContent = String(e?.message ?? e);
});
