// @ts-check
/**
 * map.js — the site's maps, drawn from vector tiles so they stay sharp on any screen and at any print
 * resolution. Tiles: OpenFreeMap (OpenMapTiles schema, no key), credited as
 * "© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors" (in the map on screen, on the page in print).
 *
 *   drawPrintMap(element, [{ lat, long }], { lang: 'he' });   // the printouts' location map
 *   drawScreenMap(element, { lat, long }, { lang, zoom: 16 }); // the location pickers
 *
 * A print map with several places fits them all and marks each with a dot; with one it is centred on it.
 */

import * as ol from "../../libraries/OpenLayers/ol.js";

const TILEJSON = "https://tiles.openfreemap.org/planet";
const ATTRIBUTION = '© <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> '
	+ '© <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> '
	+ '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';
/** Canvas pixels per CSS pixel: enough for a 600 dpi printer, whatever the screen */
const PRINT_PIXEL_RATIO = 6;

const colors = {
	land: "#f4f1ea",
	water: "#a9cfe0",
	wood: "#d3e4c3",
	grass: "#e2edd2",
	park: "#d6e8c2",
	residential: "#ebe7e0",
	building: "#ddd7cd",
	casing: "#bdb6aa",
	motorway: "#eaa063",
	major: "#f4d38c",
	road: "#ffffff",
	boundary: "#9b8fa9",
	label: "#333333",
	halo: "rgba(255, 255, 255, 0.9)",
	dot: "#b91c1c"
};

const { Style, Fill, Stroke, Text, Circle } = ol.style;
const fill = (/** @type {string} */ color) => new Style({ fill: new Fill({ color }) });
const line = (/** @type {string} */ color, /** @type {number} */ width, /** @type {number[]} */ lineDash = undefined, zIndex = 0) =>
	new Style({ stroke: new Stroke({ color, width, lineDash, lineCap: lineDash ? "butt" : "round", lineJoin: "round" }), zIndex });

const areaStyles = {
	water: fill(colors.water),
	wood: fill(colors.wood),
	grass: fill(colors.grass),
	park: fill(colors.park),
	residential: fill(colors.residential),
	building: fill(colors.building)
};

/** Roads by OpenMapTiles class: [casing width, fill colour, fill width] */
const roadClasses = {
	motorway: [3.4, colors.motorway, 2.4],
	trunk: [3, colors.major, 2],
	primary: [3, colors.major, 2],
	secondary: [2.4, colors.road, 1.6],
	tertiary: [2.2, colors.road, 1.4],
	minor: [1.6, colors.road, 0.9],
	service: [1.1, colors.road, 0.6]
};
/** @type {Record<string, Style[]>} */
const roadStyles = Object.fromEntries(Object.entries(roadClasses).map(([cls, [casing, color, width], ], index) =>
	// wider roads drawn over narrower ones
	[cls, [line(colors.casing, casing, undefined, 10 - index), line(/** @type {string} */ (color), /** @type {number} */ (width), undefined, 20 - index)]]));

const placeSizes = { city: 13, town: 11, village: 9.5, suburb: 9, neighbourhood: 8, hamlet: 8 };

/**
 * A feature's name in the page's language, else its local name
 * @param {import("ol/Feature.js").FeatureLike} feature @param {'he'|'en'|'he-Latn'} lang
 * @returns {string | undefined}
 */
const placeName = (feature, lang) =>
	(lang == "he" ? feature.get("name:he") : feature.get("name:en") ?? feature.get("name:latin")) ?? feature.get("name");

/**
 * The style for one feature of the OpenMapTiles schema
 * @param {'he'|'en'|'he-Latn'} lang
 */
function styleFunction(lang) {
	/** @param {import("ol/Feature.js").FeatureLike} feature @param {number} resolution */
	return (feature, resolution) => {
		const layer = feature.get("layer");
		const cls = feature.get("class");
		switch (layer) {
			case "water":
				return areaStyles.water;
			case "waterway":
				return line(colors.water, cls == "river" ? 1.6 : 0.8);
			case "landcover":
				return cls == "wood" || cls == "forest" ? areaStyles.wood : cls == "grass" ? areaStyles.grass : null;
			case "landuse":
				return cls == "residential" ? areaStyles.residential : null;
			case "park":
				return areaStyles.park;
			case "building":
				return resolution < 5 ? areaStyles.building : null;
			case "boundary":
				return feature.get("admin_level") <= 4 && !feature.get("maritime") ? line(colors.boundary, 1, [4, 2]) : null;
			case "transportation":
				return roadStyles[cls] ?? null;
			case "transportation_name": {
				// street names only close in (the location pickers), along the street
				if (resolution > 5) return null;
				const name = placeName(feature, lang);
				if (!name) return null;
				return new Style({
					text: new Text({
						text: name, placement: "line",
						font: `500 10px system-ui, "Segoe UI", Arial, sans-serif`,
						fill: new Fill({ color: "#555555" }),
						stroke: new Stroke({ color: colors.halo, width: 3 })
					}),
					zIndex: 90
				});
			}
			case "place": {
				const size = placeSizes[/** @type {keyof typeof placeSizes} */ (cls)];
				if (!size) return null;
				const name = placeName(feature, lang);
				if (!name) return null;
				return new Style({
					text: new Text({
						text: name,
						font: `${cls == "city" ? 600 : 500} ${size}px system-ui, "Segoe UI", Arial, sans-serif`,
						fill: new Fill({ color: colors.label }),
						stroke: new Stroke({ color: colors.halo, width: 3 })
					}),
					zIndex: 100
				});
			}
			default:
				return null;
		}
	};
}

/** @type {Promise<string> | undefined} */
let tileUrlPromise;
/** The tile URL template in OpenFreeMap's TileJSON (it changes with every planet build); fetched once per page */
function tileUrl() {
	return tileUrlPromise ??= fetch(TILEJSON)
		.then(response => {
			if (!response.ok) throw new Error(`OpenFreeMap: ${response.status}`);
			return response.json();
		})
		.then((/** @type {{ tiles: string[] }} */ json) => json.tiles[0])
		.catch(err => { tileUrlPromise = undefined; throw err; });
}

/**
 * The OpenFreeMap layer, styled for the site
 * @param {'he'|'en'|'he-Latn'} lang place names in Hebrew, or in English
 */
async function openFreeMapLayer(lang) {
	return new ol.layer.VectorTile({
		source: new ol.VectorTileSource({ format: new ol.MVT(), url: await tileUrl(), maxZoom: 14, attributions: ATTRIBUTION }),
		style: styleFunction(lang),
		declutter: true,
		renderMode: "vector"
	});
}

/**
 * Draws the map into the element
 * @param {HTMLElement} target
 * @param {{ lat: number, long: number }[]} places
 * @param {{ lang: 'he'|'en'|'he-Latn' }} options
 */
export async function drawPrintMap(target, places, { lang }) {
	const points = places.map(place => ol.fromLonLat([place.long, place.lat]));
	const view = new ol.View({ center: points[0], zoom: 11 });

	/** @type {any[]} */
	const layers = [];
	try {
		layers.push(await openFreeMapLayer(lang));
	} catch (err) {
		// Without the vector tiles (offline, or the service is down) the printout keeps the terrain image tiles
		console.warn("Print map: vector tiles unavailable, using raster tiles", err);
		layers.push(new ol.layer.Tile({ source: new ol.StadiaMaps({ layer: "stamen_terrain", retina: true }) }));
	}

	if (places.length > 1)
		layers.push(new ol.layer.Vector({
			source: new ol.VectorSource({ features: points.map(point => new ol.Feature(new ol.Point(point))) }),
			style: new Style({
				image: new Circle({ radius: 4.5, fill: new Fill({ color: colors.dot }), stroke: new Stroke({ color: "#ffffff", width: 1.5 }) }),
				zIndex: 200
			})
		}));

	target.style.background = colors.land;
	const map = new ol.Map({ controls: [], target, layers, view, pixelRatio: Math.max(window.devicePixelRatio, PRINT_PIXEL_RATIO) });

	if (places.length > 1) {
		const size = [target.clientWidth || 300, target.clientHeight || 300];
		view.fit(ol.boundingExtent(points), { size, padding: [40, 40, 40, 40], maxZoom: 14 });
	}
	return map;
}

/**
 * A map for the screen (the location pickers): centred on a place, zoomed with the wheel or a pinch about
 * that centre, not dragged. Draws nothing when the tiles can't be loaded (offline).
 * @param {HTMLElement} target
 * @param {{ lat: number, long: number }} place
 * @param {{
 *   lang: 'he'|'en'|'he-Latn', zoom: number, minZoom?: number,
 *   toward?: { lat: number, long: number }, halo?: number
 * }} options toward: a line from the place to another (the direction of prayer); halo: a circle around the
 *   place, in metres (how exact the location is)
 */
export async function drawScreenMap(target, place, { lang, zoom, minZoom, toward, halo }) {
	const center = ol.fromLonLat([place.long, place.lat]);
	/** @type {any[]} */
	const features = [];
	if (toward) {
		// A rhumb line: straight on the Mercator map
		const line = new ol.Feature(new ol.LineString([center, ol.fromLonLat([toward.long, toward.lat])]));
		line.setStyle(new Style({ stroke: new Stroke({ color: "red", width: 3 }) }));
		features.push(line);
	}
	if (halo) {
		// Mercator metres grow by 1 / cos(latitude)
		const circle = new ol.Feature(new ol.CircleGeometry(center, halo / Math.cos(place.lat * Math.PI / 180)));
		circle.setStyle(new Style({ fill: new Fill({ color: "rgba(0, 0, 255, 0.15)" }) }));
		features.push(circle);
	}
	const dot = new ol.Feature(new ol.Point(center));
	dot.setStyle(new Style({ image: new Circle({ radius: 8, fill: new Fill({ color: "blue" }), stroke: new Stroke({ color: "white", width: 2 }) }) }));
	features.push(dot);

	target.style.background = colors.land;
	const view = new ol.View({ center, zoom, minZoom });
	// zoom only: the place stays in the middle whatever the wheel or the pinch was over
	view.on("change:center", () => {
		const now = view.getCenter();
		if (now && (now[0] != center[0] || now[1] != center[1])) view.setCenter(center);
	});
	return new ol.Map({
		target,
		layers: [await openFreeMapLayer(lang), new ol.layer.Vector({ source: new ol.VectorSource({ features }), zIndex: 10 })],
		view,
		controls: [new ol.Attribution({ collapsible: false })],
		interactions: ol.defaultInteractions({ dragPan: false, altShiftDragRotate: false, pinchRotate: false, doubleClickZoom: false })
	});
}
