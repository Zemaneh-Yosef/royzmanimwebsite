// Rebuilds the vendored polyfill files from node_modules. Run after changing
// scripts/legacy/polyfills/* or bumping core-js, element-internals-polyfill or temporal-polyfill:
//     pnpm build:polyfills
// The outputs are committed like the other files in assets/libraries.

import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { TARGETS } from "./config.mjs";

// Read straight from node_modules: some of these packages don't export their package.json or files.
const pkg = (name, file) => `node_modules/${name}/${file}`;
const version = (name) => JSON.parse(readFileSync(pkg(name, "package.json"), "utf8")).version;

const common = { bundle: true, minify: true, format: "iife", target: TARGETS, legalComments: "none", logLevel: "warning" };

await build({
	...common,
	entryPoints: ["scripts/legacy/polyfills/core.js"],
	outfile: "assets/libraries/polyfills/core.min.js",
	banner: { js: `/* Polyfills for older browsers, built by scripts/legacy/build-polyfills.mjs. core-js ${version("core-js")} (MIT, © Denis Pushkarev). */` }
});

await build({
	...common,
	entryPoints: ["scripts/legacy/polyfills/dom.js"],
	outfile: "assets/libraries/polyfills/dom.min.js",
	banner: { js: `/* DOM polyfills for older browsers, built by scripts/legacy/build-polyfills.mjs. element-internals-polyfill ${version("element-internals-polyfill")} (MIT, © Caleb Williams). */` }
});

// The "full" build adds the Hebrew calendar. It's a self-installing script that leaves native Temporal alone.
await build({
	...common,
	bundle: false,
	stdin: { contents: await readFile(pkg("temporal-polyfill", "full/global.js"), "utf8"), loader: "js" },
	outfile: "assets/libraries/temporal-polyfill/global.min.js",
	banner: { js: `/* temporal-polyfill ${version("temporal-polyfill")} full/global.js (MIT, © Adam Shaw), lowered for older browsers by scripts/legacy/build-polyfills.mjs. */` }
});
