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

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
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
	}
};

const requested = process.argv.slice(2);
for (const name of requested.length ? requested : Object.keys(steps)) {
	const step = steps[/** @type {keyof typeof steps} */ (name)];
	if (!step)
		throw new Error(`Unknown step "${name}" (have: ${Object.keys(steps).join(", ")})`);
	await step();
}
