// Node check of refraction-data.js's grid-cell cache: a location is served by a stored place's data of each kind only
// where that kind's own source would answer the same (horizon: the area's outline, else its box; forecast: half the
// weather model's cell; normals: the reanalysis cell; haze: the CAMS cell; sky: the atlas pixel; no reported cell:
// GPS noise). Runs loadRefraction against an in-memory IndexedDB and a mocked network, and counts the downloads.
//
//   node scripts/check-refraction-cells.mjs        (needs node_modules: temporal-polyfill)

import "temporal-polyfill/global";
import assert from "node:assert/strict";

// ─── a small in-memory IndexedDB (what refraction-data.js uses of it) ─────────
const data = new Map();
const later = (fn) => setTimeout(fn, 0);
class Req { constructor() { this.result = undefined; this.error = null; this.onsuccess = null; this.onerror = null; } }
function transaction() {
	const queue = [];
	let running = false;
	const tx = { oncomplete: null, onerror: null, onabort: null, error: null };
	const pump = () => {
		running = true;
		later(() => {
			while (queue.length) queue.shift()();
			running = false;
			later(() => { if (queue.length) pump(); else tx.oncomplete?.(); });
		});
	};
	const op = (fn) => {
		const r = new Req();
		queue.push(() => { r.result = fn(); r.onsuccess?.({ target: r }); });
		if (!running) pump();
		return r;
	};
	tx.objectStore = () => ({
		get: (k) => op(() => data.has(k) ? structuredClone(data.get(k)) : undefined),
		getKey: (k) => op(() => data.has(k) ? k : undefined),
		getAllKeys: () => op(() => [...data.keys()]),
		put: (v, k) => op(() => { data.set(k, structuredClone(v)); return k; }),
		delete: (k) => op(() => { data.delete(k); }),
	});
	return tx;
}
globalThis.indexedDB = {
	open() {
		const r = new Req();
		r.result = { objectStoreNames: { contains: () => true }, createObjectStore() {}, transaction, onversionchange: null };
		later(() => r.onsuccess?.());
		return r;
	},
};
globalThis.requestIdleCallback = (fn) => setTimeout(fn, 0);
// the mocked air is crude: atmosphere-guard.js refuses some of it, which is beside the point here
const warn = console.warn;
console.warn = (...a) => { if (!String(a[0]).startsWith("weather data refused")) warn(...a); };

// ─── a mocked network: cells reported as the sources do, every request counted ─
const snap = (v, g) => +(Math.round(v / g) * g).toFixed(6);
const DAY = 86400;
const hours = (fromS, n) => Array.from({ length: n }, (_, i) => fromS + i * 3600);
const now0 = Math.floor(Date.now() / 1000 / 3600) * 3600;
/** false: an older server, which sends no outline even with outline=1 */
let sendsOutline = true;
/** areas the mocked server knows, smallest first: { id, bbox, polygons } */
let areas = [];
let forecastPathFails = false;
const counts = {};
const count = (k) => { counts[k] = (counts[k] ?? 0) + 1; };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const inBox = (b, lat, lon) => lat >= b[0] && lat <= b[2] && lon >= b[1] && lon <= b[3];

globalThis.fetch = async (input) => {
	const url = new URL(String(input));
	const q = url.searchParams;
	const lats = (q.get("latitude") ?? "").split(",").map(Number), lons = (q.get("longitude") ?? "").split(",").map(Number);
	if (url.host === "api.open-meteo.com") {
		if (q.get("hourly").includes("hPa")) {                     // path profiles (several points)
			if (q.get("models") !== "gfs_seamless") count("forecast");   // the model's request (not the fallback alongside)
			if (forecastPathFails) return json({ error: true, reason: "test" }, 400);
			const lv = [1000, 975, 950, 925, 900, 850, 800, 700];
			const t = hours(now0 - DAY, 17 * 24);
			return json(lats.map((la, i) => {
				const hourly = { time: t, temperature_2m: t.map(() => 20), surface_pressure: t.map(() => 1005) };
				for (const p of lv) {                               // the standard atmosphere
					const h = 44330 * (1 - (p / 1013.25) ** 0.1903);
					hourly[`temperature_${p}hPa`] = t.map(() => 20 - 0.0065 * h); hourly[`geopotential_height_${p}hPa`] = t.map(() => h);
				}
				return { latitude: snap(la, 0.0625), longitude: snap(lons[i], 0.0625), elevation: 100, hourly };
			}));
		}
		count("forecast-single");                                  // one temperature at the observer
		const t = hours(now0 - DAY, 17 * 24);
		return json({ latitude: snap(lats[0], 0.1), longitude: snap(lons[0], 0.1), elevation: 100,
			hourly_units: { temperature_2m: "°C" }, hourly: { time: t, temperature_2m: t.map(() => 20), surface_pressure: t.map(() => 1005) } });
	}
	if (url.host === "archive-api.open-meteo.com") {               // ERA5 normals
		count("normals");
		const start = Date.UTC(+q.get("start_date").slice(0, 4), 0, 1) / 1000, end = Date.UTC(+q.get("end_date").slice(0, 4) + 1, 0, 1) / 1000;
		const t = hours(start, (end - start) / 3600);
		return json({ latitude: snap(lats[0], 0.1), longitude: snap(lons[0], 0.1), elevation: 100, hourly: { time: t, temperature_2m: t.map(() => 18) } });
	}
	if (url.host === "air-quality-api.open-meteo.com") {           // CAMS haze
		count(q.has("start_date") ? "haze-normals" : "haze-forecast");
		const t = q.has("start_date") ? hours(Date.UTC(2022, 7, 1) / 1000, 365 * 24) : hours(now0 - DAY, 8 * 24);
		return json({ latitude: snap(lats[0], 0.4), longitude: snap(lons[0], 0.4), hourly: { time: t, aerosol_optical_depth: t.map(() => 0.2) } });
	}
	if (url.host === "api.weather.gov") return json({}, 404);
	if (url.host === "hanetz.royzmanim.com") {
		const lat = +q.get("lat"), lon = +q.get("lon");
		if (url.pathname.endsWith("/v1/horizon")) {
			count("horizon");
			const a = areas.find(a => inBox(a.bbox, lat, lon) && (!a.polygons || areaPolygonsContain(a.polygons, lat, lon)));
			const area = a ? { id: a.id, name: a.id, kind: "test", bbox: a.bbox, ...(q.get("outline") === "1" && sendsOutline && a.polygons ? { polygons: a.polygons } : {}) } : null;
			return json({ points: [{ lat, lon, height: 800 }], terrain: { layers: "L", fine: null, algo: 2 }, area });
		}
		if (url.pathname.endsWith("/v1/light-pollution")) {
			count("sky");
			const row = Math.floor((85.0541668645001 - lat) / 0.008333330000000002), col = Math.floor((lon + 180.00000000000003) / 0.008333330000000002);
			return json({ blpCdM2: 0.01, pixel: { row, col, lat: 0, lon: 0 } });
		}
		if (url.pathname.endsWith("/v1/haze-calibration")) { count("calibration"); return json({ factor: 1 }); }
		return json({ error: "not here" }, 404);                   // the server's path profiles: not in this test
	}
	throw new Error(`unexpected request ${url}`);
};

/** even-odd over each polygon's flat [lon, lat, ...] rings, as the server's areas.py */
function areaPolygonsContain(polygons, lat, lon) {
	return polygons.some(rings => {
		let c = false;
		for (const r of rings) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
			if ((r[i + 1] > lat) !== (r[j + 1] > lat) && lon < (r[j] - r[i]) * (lat - r[i + 1]) / (r[j + 1] - r[i + 1]) + r[i]) c = !c;
		return c;
	});
}

const { loadRefraction, readCachedRefraction, forecastCellRadiusM, skyPixel } = await import("../assets/js/refraction-data.js");

const settle = () => new Promise(r => setTimeout(r, 120));
/** Load at a spot (as a GPS fix or a picked place would) and return what was downloaded. */
async function load(lat, lon) {
	for (const k of Object.keys(counts)) delete counts[k];
	const d = await loadRefraction(lat, lon);
	await settle();                                                 // the background writes
	return { ...counts, data: d };
}
const reset = () => data.clear();
let checks = 0;
const got = (r, kind, n, what) => { assert.equal(r[kind] ?? 0, n, `${what}: ${kind} downloads`); checks++; };
const M = (dLatM, dLonM, lat) => [dLatM / 111320, dLonM / (111320 * Math.cos(lat * Math.PI / 180))];
const at = (lat, lon, dLatM, dLonM) => { const [a, b] = M(dLatM, dLonM, lat); return [lat + a, lon + b]; };

// Israel (icon_seamless): P0 sits on every mocked grid (0.0625 / 0.1 / 0.4 degrees)
const P0 = [32.0, 34.0];

// ── 1. a place picked from the list: fetched once, then served from storage, as before ──
reset();
areas = [];
let r = await load(...P0);
for (const k of ["horizon", "forecast", "normals", "haze-normals", "haze-forecast", "sky", "calibration"]) got(r, k, 1, "first load");
r = await load(...P0);
for (const k of ["horizon", "forecast", "normals", "haze-normals", "haze-forecast", "sky", "calibration"]) got(r, k, 0, "same place again");
assert.equal(r.data.fromCache, true);
const far = await load(40.0, 20.0);                                // another picked place: its own downloads
for (const k of ["horizon", "forecast", "normals", "haze-normals", "sky"]) got(far, k, 1, "a far place");
r = await load(...P0);
for (const k of ["horizon", "forecast", "normals", "haze-normals", "sky"]) got(r, k, 0, "back to the first place");
const c = await readCachedRefraction(...P0);
assert.ok(c?.horizon && c.normals && c.forecast && c.haze && c.haze.blpCdM2 === 0.01, "readCachedRefraction has every kind");
checks++;

// ── 2. a GPS fix 10 m away: nothing downloaded again ──
r = await load(...at(...P0, 7, 7));
for (const k of ["horizon", "forecast", "normals", "haze-normals", "haze-forecast", "sky", "calibration"]) got(r, k, 0, "GPS fix 10 m away");

// ── 3. forecast: within half the model's cell of the reported centre, not past it ──
const rf = forecastCellRadiusM(P0[0], P0[1]);                     // ICON-EU: 0.03125 degrees of longitude
assert.ok(Math.abs(rf - 0.03125 * 111320 * Math.cos(32 * Math.PI / 180)) < 1);
reset(); await load(...P0);
got(await load(...at(...P0, rf - 100, 0)), "forecast", 0, "inside the forecast cell");
got(await load(...at(...P0, 0, rf + 100)), "forecast", 1, "outside the forecast cell");
// the other regions' radii
assert.equal(forecastCellRadiusM(48.85, 2.35), 650);                // Europe (best_match)
assert.equal(forecastCellRadiusM(45.5, -73.6), 1250);               // Canada (gem_seamless)
assert.equal(forecastCellRadiusM(40.7, -74.0), 1500);               // contiguous US (gfs_seamless, HRRR)
assert.ok(Math.abs(forecastCellRadiusM(-33.9, 151.2) - 0.055 * 111320 * Math.cos(-33.9 * Math.PI / 180)) < 1); // elsewhere
checks += 5;

// ── 4. normals: within 0.05 degrees of the reanalysis cell's centre ──
reset(); await load(...P0);
got(await load(P0[0] + 0.045, P0[1]), "normals", 0, "inside the normals cell");
r = await load(P0[0] + 0.055, P0[1]);
got(r, "normals", 1, "outside the normals cell");

// ── 5. haze: within 0.125 degrees of the CAMS cell's centre ──
reset(); await load(...P0);
r = await load(P0[0] + 0.12, P0[1]);
got(r, "haze-normals", 0, "inside the haze cell"); got(r, "haze-forecast", 0, "inside the haze cell");
r = await load(P0[0] + 0.13, P0[1]);
got(r, "haze-normals", 1, "outside the haze cell"); got(r, "haze-forecast", 1, "outside the haze cell");

// ── 6. light pollution: the same atlas pixel ──
reset(); await load(...P0);
const px0 = skyPixel(...P0);
const sameLon = P0[1] + 0.004, nextLon = P0[1] + 0.009;
assert.equal(skyPixel(P0[0], sameLon).col, px0.col); assert.notEqual(skyPixel(P0[0], nextLon).col, px0.col);
got(await load(P0[0], sameLon), "sky", 0, "same atlas pixel");
got(await load(P0[0], nextLon), "sky", 1, "next atlas pixel");

// ── 7. horizon: anywhere in the area's outline; the box where the server sends no outline; the smallest area ──
// (each seeded from a spot of its own: horizon-client keeps answers by URL for the page's life)
const box = [31.95, 33.95, 32.05, 34.05];
// a diamond inside the box: its corners are in the box but not the area
const diamond = [[34.0, 31.95, 34.05, 32.0, 34.0, 32.05, 33.95, 32.0, 34.0, 31.95]];
const corner = [32.04, 34.04];
areas = [{ id: "diamond", bbox: box, polygons: [diamond] }];
reset(); await load(32.0, 34.0005);
got(await load(32.02, 34.01), "horizon", 0, "inside the area's outline");
got(await load(...corner), "horizon", 1, "in the box but outside the outline");
// an older server: no outline, so the box decides
sendsOutline = false;
reset(); await load(32.0, 34.001);
got(await load(32.035, 34.035), "horizon", 0, "in the box (no outline sent)");
sendsOutline = true;
// nested areas: the smallest containing area's horizon serves
const small = [32.0, 34.0, 32.02, 34.02];
areas = [{ id: "small", bbox: small, polygons: null }, { id: "big", bbox: [31.9, 33.9, 32.1, 34.1], polygons: null }];
reset();
await load(32.01, 34.01);                                           // stores "small"
r = await load(31.95, 33.95);                                       // outside it: stores "big"
got(r, "horizon", 1, "outside the stored small area");
r = await load(32.015, 34.015);
got(r, "horizon", 0, "inside the stored small area"); assert.equal(r.data.horizon.area.id, "small");
r = await load(31.92, 33.92);
got(r, "horizon", 0, "inside only the big area"); assert.equal(r.data.horizon.area.id, "big");
checks += 3;
// a point in no area: its own horizon, within GPS noise only
areas = [];
const P1 = [32.0, 34.0015];
reset(); await load(...P1);
got(await load(...at(...P1, 15, 15)), "horizon", 0, "no area: 21 m away");
got(await load(...at(...P1, 40, 0)), "horizon", 1, "no area: 40 m away");

// ── 8. a forecast whose source reports no cell (single temperature): within GPS noise only ──
forecastPathFails = true;
reset(); await load(...P0);
r = await load(...at(...P0, 15, 15));
got(r, "forecast", 0, "no forecast cell: 21 m away"); got(r, "forecast-single", 0, "no forecast cell: 21 m away");
r = await load(...at(...P0, 40, 0));
got(r, "forecast-single", 1, "no forecast cell: 40 m away");
forecastPathFails = false;

console.log(`refraction cache cells: ${checks} checks passed`);
process.exit(0);
