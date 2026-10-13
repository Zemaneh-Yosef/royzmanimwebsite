// Rewrites top-level await so the modules run in browsers without it (Chrome < 89, Firefox < 89,
// Safari < 15), keeping the same order of execution: a module with top-level await, and every module
// that imports one, wraps its body in a promise and exports it as `__tla`; importers wait for it
// before running their own body. This is what vite-plugin-top-level-await does for Vite builds; its
// transform is reused here on the site's unbundled modules.

import { build } from "esbuild";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The plugin doesn't export its transform, so load it from its dist folder (version pinned in package.json).
const require = createRequire(import.meta.url);
const pluginDist = path.join(realpathSync(fileURLToPath(new URL("../../node_modules/vite-plugin-top-level-await", import.meta.url))), "dist");
const { parseBundleAsts, parseBundleInfo } = require(path.join(pluginDist, "bundle-info.js"));
const { transformModule } = require(path.join(pluginDist, "transform.js"));
const { DEFAULT_OPTIONS } = require(path.join(pluginDist, "options.js"));
const SWC = require(path.join(pluginDist, "swc.js"));

/**
 * @typedef {{ name: string, dir: string, code: string }} ModuleSource
 *   name: unique, "/"-separated id of the module (its path in the site, or a made-up one for inline scripts)
 *   dir: the site directory its relative imports resolve against ("" for the root)
 */

/**
 * @param {ModuleSource[]} modules every module that may need the rewrite (others can be left out)
 * @returns {Promise<Map<string, string>>} rewritten code, by module name, for the ones that changed
 */
export async function lowerTopLevelAwait(modules) {
	// The transform expects bundler output: imports first, exports gathered into one `export { … }`.
	// esbuild produces that shape when it "bundles" a single module with every import left external.
	// Site-absolute specifiers ("/assets/…") are made relative so the transform can follow them;
	// they're put back afterwards.
	const chunks = {};
	const restore = new Map();
	for (const mod of modules) {
		const specifiers = new Map();
		const result = await build({
			stdin: { contents: mod.code, loader: "js", sourcefile: mod.name },
			bundle: true, write: false, format: "esm", platform: "neutral", target: "esnext",
			treeShaking: false, logLevel: "silent",
			plugins: [{
				name: "keep-imports",
				setup(b) {
					b.onResolve({ filter: /.*/ }, (args) => {
						let relative = args.path;
						if (args.path.startsWith("/"))
							relative = toRelative(mod.dir, args.path.slice(1));
						if (relative !== args.path) specifiers.set(relative, args.path);
						return { path: relative, external: true };
					});
				}
			}]
		});
		chunks[mod.name] = result.outputFiles[0].text;
		restore.set(mod.name, specifiers);
	}

	const asts = await parseBundleAsts(chunks);
	// Only the modules involved are passed in, so it would warn about every other import; those are
	// correctly treated as synchronous.
	const warn = console.warn;
	console.warn = () => {};
	let info;
	try {
		info = await parseBundleInfo(asts);
	} finally {
		console.warn = warn;
	}

	const lowered = new Map();
	for (const mod of modules) {
		if (!info[mod.name].transformNeeded) continue;
		const ast = transformModule(chunks[mod.name], asts[mod.name], mod.name, info, DEFAULT_OPTIONS);
		let code = SWC.printSync(ast, {}).code;
		for (const [relative, original] of restore.get(mod.name))
			code = code.split(JSON.stringify(relative)).join(JSON.stringify(original))
				.split(`'${relative}'`).join(JSON.stringify(original));
		lowered.set(mod.name, code);
	}
	return lowered;
}

/** Relative specifier from a site directory ("" = root) to a site path. */
function toRelative(fromDir, target) {
	let relative = path.posix.relative(fromDir || ".", target);
	if (!relative.startsWith(".")) relative = "./" + relative;
	return relative;
}
