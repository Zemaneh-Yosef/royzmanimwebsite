// Shared settings for the legacy-browser build (scripts/legacy/*.mjs).

/**
 * Oldest browsers the site's JavaScript is lowered for. The real floor is BigInt (Chrome 67,
 * Firefox 68, Safari 14), which the Temporal polyfill needs and nothing can stand in for.
 * Chrome 67 also covers LG webOS 5 TVs (Chromium 68). Firefox is set to 78 because the code uses
 * regex named groups, which Firefox only parses from 78 on and no transpiler can lower. Safari is
 * 14.1 because esbuild can't work around a destructuring bug in 14.0; every device that ran iOS 14.0
 * can update to 14.8.
 */
export const TARGETS = ["chrome67", "edge79", "firefox78", "safari14.1", "ios14.5"];

/** Pages built for modern browsers only: their inline scripts and styles are not lowered. Paths are relative to _site. */
export const MODERN_ONLY_PAGES = ["handasi-hazeman.html", "horizon-3d.html"];

/**
 * Third-party code served exactly as shipped. PDF.js only runs in newer browsers; the haskamot modal
 * falls back to showing the PDF itself where it doesn't start (_includes/modals/haskamot.html).
 * MapLibre needs WebGL 2 and a modern browser anyway (the 3D horizon page, horizon-3d.html, says so where it can't start).
 */
export const LEAVE_AS_IS = ["assets/libraries/pdfviewer/", "assets/libraries/maplibre/"];

/**
 * Module workers started through spawnWorker() (assets/js/misc/worker.js). For each one the build
 * also writes a self-contained "*.classic.js" copy for browsers without module workers.
 */
export const WORKERS = [
	"assets/js/visible-sunrise-worker.js",
	"assets/js/features/icsPrepare.js",
	"assets/js/features/excelPrepare.js",
	"assets/js/features/print-web-worker.js",
	"assets/js/features/weeklyPrint/print-web-worker.js",
	"assets/js/features/weeklyPrint/moon-birkat-worker.js"
];

/** Loaded by every classic worker before its own code (only old browsers get classic workers). */
export const CLASSIC_WORKER_POLYFILLS = [
	"/assets/libraries/polyfills/core.min.js",
	"/assets/libraries/temporal-polyfill/global.min.js"
];
