// Types for ol.js, the site's OpenLayers bundle: the same exports as scripts/vendor/ol-entry.mjs.
export { default as Map } from 'ol/Map.js';
export { default as View } from 'ol/View.js';
export { default as Feature } from 'ol/Feature.js';
export { fromLonLat } from 'ol/proj.js';
export { boundingExtent } from 'ol/extent.js';
export { default as Point } from 'ol/geom/Point.js';
export { default as LineString } from 'ol/geom/LineString.js';
export { default as CircleGeometry } from 'ol/geom/Circle.js';
export { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
export { default as StadiaMaps } from 'ol/source/StadiaMaps.js';
export { default as VectorTileSource } from 'ol/source/VectorTile.js';
export { default as VectorSource } from 'ol/source/Vector.js';
export { default as MVT } from 'ol/format/MVT.js';
export { default as Attribution } from 'ol/control/Attribution.js';
export * as style from '../../../scripts/vendor/ol-style.mjs';
export * as layer from '../../../scripts/vendor/ol-layer.mjs';
