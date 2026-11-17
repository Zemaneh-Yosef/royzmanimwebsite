// Brings data and libraries built in sibling repositories into assets/libraries. Run by hand after the
// source changes:
//     pnpm vendor [step…]
//
// Each source repository is looked for next to this one (../<name>), or where <NAME>_DIR points.
// A step refuses to copy files that have uncommitted changes in their repository, so what the site ships
// can always be traced to a commit there.
//
// Steps:
//   hiloulot  Yahrzeit data from Elyahu41/hiloulot (hiloulah_en.json / hiloulah_he.json, the only place
//             it's edited). Writes two copies of each language:
//               assets/libraries/kosherZmanim/withDesc/hiloulah-<lang>.json  everything (print, ICS export)
//               assets/libraries/kosherZmanim/hiloulah-<lang>.json           name and src only, what
//                 HiloulahYomiCalculator reads from kosher-zmanim.js's folder (calendar, shul wall)
//             Never take these from KosherZmanim's dist/: its copy of the data is much older.
//   kosherZmanim  Our kosher-zmanim fork (../KosherZmanim): builds it (pnpm build) and copies
//             kosher-zmanim.js, its source map and types into assets/libraries/kosherZmanim/.
//   mooncalc  The moon calculator (../moonrise): builds the library (tsdown) and copies dist/ into
//             assets/libraries/mooncalc/. The site imports it through assets/js/astro/moon.js.
//
// The build steps refuse uncommitted changes anywhere in the repository's sources, since they're built
// in. Each build runs with the repository's own installed tools (pnpm install there first).

import { execFileSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** @param {string} name */
function sourceDir(name) {
	const dir = path.resolve(process.env[`${name.toUpperCase()}_DIR`] ?? path.join(siteDir, "..", name));
	if (!existsSync(dir))
		throw new Error(`${name}: no repository at ${dir} (clone it there or set ${name.toUpperCase()}_DIR)`);
	return dir;
}

/**
 * Throws if any of the files has uncommitted changes; returns the commit they're from.
 * @param {string} repo @param {string[]} files relative to repo
 */
function committedSource(repo, files) {
	const git = (/** @type {string[]} */ ...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
	const dirty = git("status", "--porcelain", "--", ...files);
	if (dirty)
		throw new Error(`${path.basename(repo)} has uncommitted changes; commit them first:\n${dirty}`);
	return git("log", "-1", "--format=%h %s", "--", ...files);
}

/**
 * Runs a build in a source repository, with its own installed tools
 * @param {string} repo @param {string[]} args
 */
function build(repo, args) {
	const command = `pnpm ${args.join(" ")}`;
	console.log(`  ${path.basename(repo)}: ${command}`);
	// through a shell: on Windows pnpm is a .cmd script (the arguments are this file's own fixed words)
	execSync(command, { cwd: repo, stdio: "inherit" });
}

/**
 * Copies files from a build into the site, replacing (and removing) what an earlier copy left there
 * @param {string} fromDir @param {string[]} names @param {string} toDir relative to the site
 * @param {(name: string) => boolean} [stale] files in toDir from an earlier build to remove first
 */
async function copyBuild(fromDir, names, toDir, stale = () => false) {
	const target = path.join(siteDir, toDir);
	for (const name of await readdir(target))
		if (stale(name) && !names.includes(name)) {
			await rm(path.join(target, name));
			console.log(`  removed ${toDir}/${name}`);
		}
	for (const name of names) {
		await copyFile(path.join(fromDir, name), path.join(target, name));
		console.log(`  copied ${toDir}/${name}`);
	}
}

/** @param {string} file @param {unknown} data */
async function writeJson(file, data) {
	await writeFile(path.join(siteDir, file), JSON.stringify(data));
	console.log(`  wrote ${file}`);
}

const steps = {
	async hiloulot() {
		const repo = sourceDir("hiloulot");
		const sources = { en: "hiloulah_en.json", he: "hiloulah_he.json" };
		console.log(`hiloulot: ${committedSource(repo, Object.values(sources))}`);

		for (const [lang, file] of Object.entries(sources)) {
			/** @type {Record<string, { name: string; src: string }[]>} */
			const full = JSON.parse(await readFile(path.join(repo, file), "utf8"));
			const short = Object.fromEntries(Object.entries(full)
				.map(([day, entries]) => [day, entries.map(({ name, src }) => ({ name, src }))]));

			const count = Object.values(full).reduce((n, entries) => n + entries.length, 0);
			console.log(`  ${lang}: ${count} entries over ${Object.keys(full).length} days`);
			await writeJson(`assets/libraries/kosherZmanim/withDesc/hiloulah-${lang}.json`, full);
			await writeJson(`assets/libraries/kosherZmanim/hiloulah-${lang}.json`, short);
		}
	},

	async kosherZmanim() {
		const repo = sourceDir("KosherZmanim");
		console.log(`kosherZmanim: ${committedSource(repo, ["src", "package.json", "pnpm-lock.yaml", "tsdown.config.ts", "tsconfig.json"])}`);
		build(repo, ["run", "build"]);
		// not the hiloulah-*.json the build also puts in dist/ (see the hiloulot step)
		await copyBuild(path.join(repo, "dist"), ["kosher-zmanim.js", "kosher-zmanim.js.map", "kosher-zmanim.d.ts"],
			"assets/libraries/kosherZmanim");
	},

	async mooncalc() {
		const repo = sourceDir("moonrise");
		console.log(`mooncalc: ${committedSource(repo, ["src", "package.json", "pnpm-lock.yaml", "tsdown.config.ts", "tsconfig.json"])}`);
		build(repo, ["exec", "tsdown"]);
		const dist = path.join(repo, "dist");
		// tsdown names its shared runtime chunk by content (rolldown-runtime-<hash>.js)
		const names = (await readdir(dist)).filter(name => /^(moonRiseSetCalc\.(js|js\.map|d\.ts)|rolldown-runtime-[\w-]+\.js)$/.test(name));
		await copyBuild(dist, names, "assets/libraries/mooncalc", name => name.startsWith("rolldown-runtime-"));
	},

	async openlayers() {
		// From this repository's own node_modules (package.json pins the version), only what ol-entry.mjs lists
		const { build: esbuild } = await import("esbuild");
		const version = JSON.parse(await readFile(path.join(siteDir, "node_modules/ol/package.json"), "utf8")).version;
		console.log(`openlayers: ol ${version}`);
		const outfile = path.join(siteDir, "assets/libraries/OpenLayers/ol.js");
		await esbuild({
			entryPoints: [path.join(siteDir, "scripts/vendor/ol-entry.mjs")],
			bundle: true, format: "esm", minify: true, sourcemap: true, legalComments: "inline",
			target: "es2020", outfile, logLevel: "warning"
		});
		console.log("  built assets/libraries/OpenLayers/ol.js");
		await copyFile(path.join(siteDir, "node_modules/ol/ol.css"), path.join(siteDir, "assets/libraries/OpenLayers/ol.css"));
		console.log("  copied assets/libraries/OpenLayers/ol.css");
	}
};

const requested = process.argv.slice(2);
for (const name of requested.length ? requested : Object.keys(steps)) {
	const step = steps[/** @type {keyof typeof steps} */ (name)];
	if (!step)
		throw new Error(`Unknown step "${name}" (have: ${Object.keys(steps).join(", ")})`);
	await step();
}
