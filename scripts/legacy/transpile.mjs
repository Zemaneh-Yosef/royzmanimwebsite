// Makes the built site's JavaScript run in older browsers (see TARGETS in config.mjs).
// Run on the Jekyll output after each build, by _plugins/legacy-browsers.rb:
//     node scripts/legacy/transpile.mjs <built site> [<site source>]
//
// 1. Top-level await is rewritten into promises (tla.mjs), keeping the same order of execution.
// 2. Newer syntax (?., ??, ??=, class fields, …) is lowered with esbuild, in .js files and in inline
//    <script>s. Files that don't need it are left byte-for-byte alone.
// 3. Each module worker in WORKERS gets a self-contained classic copy, "name.classic.js".
// Anything that can't be made to work (e.g. a regex lookbehind) fails the build with its location.
//
// Source files are always read from the site source, never from the output, so running this again
// (as `jekyll serve` does on every change) gives the same result. Inline scripts it has changed are
// marked with data-legacy-build so they aren't processed twice. Results are cached in
// .jekyll-cache/legacy-build, so rebuilds only redo what changed.

import { build, transform } from "esbuild";
import * as acorn from "acorn";
import remapping from "@jridgewell/remapping";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { TARGETS, MODERN_ONLY_PAGES, WORKERS, CLASSIC_WORKER_POLYFILLS } from "./config.mjs";
import { lowerTopLevelAwait } from "./tla.mjs";

const siteDir = path.resolve(process.argv[2] ?? "_site");
const sourceDir = path.resolve(process.argv[3] ?? ".");
const cacheDir = path.join(sourceDir, ".jekyll-cache", "legacy-build");
// Cached results are only reused by the same version of these scripts (and the same dependencies).
const buildId = hash((await Promise.all(["transpile.mjs", "tla.mjs", "config.mjs"].map((f) =>
	readFile(new URL(f, import.meta.url), "utf8")))).join("\0") + await readFile(path.join(sourceDir, "pnpm-lock.yaml"), "utf8").catch(() => ""));
const started = Date.now();
const problems = [];

/**
 * @typedef {{
 *   name: string, dir: string, code: string, info: Analysis, lower: boolean,
 *   write: (code: string, map?: string) => Promise<void>
 * }} Script
 * @typedef {{ kind: "script" | "module" | null, topLevelAwait: boolean, needsLowering: boolean, imports: string[], dynamicImports: string[], unsupportedRegex: string[] }} Analysis
 */

// ─── Collect every script in the built site ───

/** @type {Script[]} */
const scripts = [];
/** @type {Map<string, { text: string, edits: { start: number, end: number, tagStart: number, code: string }[] }>} */
const pages = new Map();

for (const file of await listFiles(siteDir)) {
	const name = toPosix(path.relative(siteDir, file));
	if (/\.m?js$/.test(name) && !name.endsWith(".classic.js")) {
		const sourceFile = path.join(sourceDir, name);
		const code = await readFile(existsSync(sourceFile) ? sourceFile : file, "utf8");
		const info = await analyze(code);
		if (!info.kind) { console.warn(`legacy build: couldn't parse ${name}, left as is`); continue; }
		scripts.push({
			name, dir: path.posix.dirname(name), code, info, lower: true,
			write: async (output, map) => {
				if (map) {
					await writeIfChanged(file + ".map", map);
					output += `\n//# sourceMappingURL=${path.basename(file)}.map\n`;
				}
				await writeIfChanged(file, output);
			}
		});
	} else if (name.endsWith(".html")) {
		const text = await readFile(file, "utf8");
		const page = { text, edits: [] };
		const modernOnly = MODERN_ONLY_PAGES.includes(name);
		let index = 0;
		for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
			const [whole, attributes, body] = match;
			index++;
			if (/\bsrc\s*=/i.test(attributes) || /\bdata-legacy-build\b/i.test(attributes) || !body.trim()) continue;
			const type = (attributes.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1]?.toLowerCase();
			if (type && type !== "module" && !/^(text|application)\/javascript$/.test(type)) continue;
			const info = await analyze(body, type === "module" ? "module" : "script");
			if (!info.kind) { console.warn(`legacy build: couldn't parse inline script #${index} of ${name}, left as is`); continue; }
			const start = match.index + whole.indexOf(">") + 1;
			scripts.push({
				name: `${name}.inline-${index}.js`, dir: path.posix.dirname(name), code: body, info, lower: !modernOnly,
				write: async (output) => { page.edits.push({ start, end: start + body.length, tagStart: match.index, code: output }); }
			});
		}
		pages.set(file, page);
	}
}

// ─── 1. Top-level await ───

/** @type {Map<Script, string>} code after step 1, for the scripts it changed */
const afterTla = new Map();
{
	const modules = new Map(scripts.filter((s) => s.info.kind === "module").map((s) => [s.name, s]));
	const resolve = (from, specifier) => specifier.startsWith("/") ? specifier.slice(1)
		: specifier.startsWith(".") ? path.posix.join(from.dir, specifier) : null;

	// Modules that run asynchronously: those with top-level await, and everything that imports one.
	const async = new Set([...modules.values()].filter((s) => s.info.topLevelAwait));
	for (let grew = true; grew;) {
		grew = false;
		for (const s of modules.values())
			if (!async.has(s) && s.info.imports.some((i) => async.has(modules.get(resolve(s, i))))) { async.add(s); grew = true; }
	}
	// …plus modules that import() one, which have to wait for it too.
	const involved = [...modules.values()].filter((s) => async.has(s) || s.info.dynamicImports.some((i) => async.has(modules.get(resolve(s, i)))));

	if (involved.length) {
		const key = hash(involved.map((s) => s.name + "\0" + s.code).join("\0"));
		let lowered = await readCache(key, "tla.json").then((text) => text && new Map(JSON.parse(text)));
		if (!lowered) {
			lowered = await lowerTopLevelAwait(involved.map(({ name, dir, code }) => ({ name, dir, code })));
			await writeCache(key, "tla.json", JSON.stringify([...lowered]));
		}
		for (const s of involved)
			if (lowered.has(s.name)) afterTla.set(s, lowered.get(s.name));
	}
}

// ─── 2. Newer syntax ───

for (const script of scripts) {
	if (script.lower)
		for (const regex of script.info.unsupportedRegex)
			problems.push(`${script.name}, ${regex} — regex lookbehind and the d/v flags don't work in the target browsers`);
	const code = afterTla.get(script) ?? script.code;
	const needsLowering = script.lower && (afterTla.has(script) ? (await analyze(code, "module")).needsLowering : script.info.needsLowering);
	if (!needsLowering) {
		if (afterTla.has(script)) await script.write(code);
		continue;
	}
	const lowered = await lower(script, code);
	if (lowered) await script.write(lowered.code, lowered.map);
}

// Inline scripts: splice the new bodies in, marking each tag as done.
for (const [file, page] of pages) {
	if (!page.edits.length) continue;
	let text = page.text;
	for (const edit of page.edits.sort((a, b) => b.start - a.start)) {
		text = text.slice(0, edit.start) + edit.code + text.slice(edit.end);
		text = text.slice(0, edit.tagStart) + text.slice(edit.tagStart).replace(/^<script\b/i, "<script data-legacy-build");
	}
	await writeIfChanged(file, text);
}

// ─── 3. Classic copies of the module workers ───

for (const entry of WORKERS) {
	const outfile = path.join(siteDir, entry.replace(/\.js$/, ".classic.js"));
	// Reuse the last bundle when none of the files that went into it changed.
	const previous = await readCache(hash(entry), "worker.json").then((text) => text && JSON.parse(text));
	if (previous && await Promise.all(previous.inputs.map(async ([file, digest]) =>
		existsSync(file) && hash(await readFile(file, "utf8")) === digest)).then((same) => same.every(Boolean))) {
		await writeIfChanged(outfile, previous.code);
		continue;
	}
	try {
		const result = await build({
			entryPoints: [path.join(sourceDir, entry)], outfile, absWorkingDir: sourceDir,
			bundle: true, format: "iife", target: TARGETS, write: false, metafile: true,
			minifyWhitespace: true, legalComments: "inline", logLevel: "silent",
			banner: { js: `importScripts(${CLASSIC_WORKER_POLYFILLS.map((url) => JSON.stringify(url)).join(", ")});` },
			plugins: [{
				name: "site-urls",
				setup(b) {
					// Leave site and CDN URLs alone: the polyfill loader's import()s never run here, since
					// classic workers get the polyfills from the banner above.
					b.onResolve({ filter: /^(\/|https?:)/ }, (args) => args.kind === "entry-point" ? undefined : { path: args.path, external: true });
					// Each module's import.meta.url becomes the URL it has on the site, as if it were loaded as a module.
					b.onLoad({ filter: /\.m?js$/ }, async (args) => {
						let contents = rewriteBigIntKeys(await readFile(args.path, "utf8"), "module");
						const url = "/" + toPosix(path.relative(sourceDir, args.path));
						contents = contents.replaceAll("import.meta.url", `new URL(${JSON.stringify(url)}, self.location.href).href`);
						return { contents, loader: "js" };
					});
				}
			}]
		});
		for (const warning of result.warnings) problems.push(`${entry} (classic worker): ${describe(warning)}`);
		const code = result.outputFiles[0].text;
		await writeIfChanged(outfile, code);
		const inputs = await Promise.all(Object.keys(result.metafile.inputs).map(async (input) => {
			const file = path.resolve(sourceDir, input);
			return [file, hash(await readFile(file, "utf8"))];
		}));
		await writeCache(hash(entry), "worker.json", JSON.stringify({ inputs, code }));
	} catch (error) {
		for (const e of error.errors ?? [error]) problems.push(`${entry} (classic worker): ${describe(e)}`);
	}
}

if (problems.length) {
	console.error("legacy build: these can't be made to work in the target browsers:\n  " + problems.join("\n  "));
	process.exit(1);
}
console.log(`legacy build: done in ${((Date.now() - started) / 1000).toFixed(1)}s`);

// ─── helpers ───

/** Lowers one script with esbuild. Returns null (and records the problem) if it can't be. */
async function lower(script, code) {
	const isInline = script.name.includes(".inline-");
	const isLibrary = script.name.startsWith("assets/libraries/");
	const file = path.posix.basename(script.name);
	const key = hash([TARGETS.join(), script.info.kind, isLibrary, file, code].join("\0"));
	const cached = await readCache(key, "lowered.json");
	if (cached) return JSON.parse(cached);

	let result;
	try {
		result = await transform(rewriteBigIntKeys(code, script.info.kind), {
			loader: "js", target: TARGETS, format: script.info.kind === "module" ? "esm" : undefined,
			sourcefile: file, sourcemap: isInline ? false : "external", sourcesContent: true,
			legalComments: "inline", minifyWhitespace: isLibrary, logLevel: "silent"
		});
	} catch (error) {
		for (const e of error.errors ?? [error]) problems.push(`${script.name}: ${describe(e)}`);
		return null;
	}
	for (const warning of result.warnings) problems.push(`${script.name}: ${describe(warning)}`);

	// A library that ships its own source map: chain it, so the browser still points at the library's sources.
	let map = result.map || undefined;
	const ownMap = !isInline && code.match(/\/\/# sourceMappingURL=(?!data:)(\S+)\s*$/);
	const ownMapFile = ownMap && path.join(sourceDir, script.dir, ownMap[1]);
	if (map && ownMapFile && existsSync(ownMapFile)) {
		const original = JSON.parse(await readFile(ownMapFile, "utf8"));
		map = JSON.stringify(remapping(JSON.parse(map), (source) => source === file ? original : null));
	}
	const output = { code: result.code, map };
	await writeCache(key, "lowered.json", JSON.stringify(output));
	return output;
}

/** Parses once and answers everything the steps above need to know. Cached by content. */
async function analyze(code, kind) {
	const key = hash((kind ?? "") + "\0" + code);
	const cached = await readCache(key, "analysis.json");
	if (cached) return JSON.parse(cached);

	/** @type {Analysis} */
	const info = { kind: null, topLevelAwait: false, needsLowering: false, imports: [], dynamicImports: [], unsupportedRegex: [] };
	let ast;
	for (const sourceType of kind ? [kind] : ["script", "module"]) {
		try {
			ast = acorn.parse(code, { ecmaVersion: "latest", sourceType, allowHashBang: true });
			info.kind = sourceType;
			break;
		} catch { /* try the next */ }
	}
	if (ast) {
		// Lowering is needed for anything from ES2021 on, and for ES2020's ?. and ?? — the rest of
		// ES2020 (BigInt, import(), import.meta) is supported by every target.
		try {
			acorn.parse(code, { ecmaVersion: 2020, sourceType: info.kind, allowHashBang: true });
		} catch {
			info.needsLowering = true;
		}
		(function visit(node, inFunction) {
			if (!node || typeof node.type !== "string") return;
			switch (node.type) {
				case "ChainExpression": info.needsLowering = true; break;
				case "LogicalExpression": if (node.operator === "??") info.needsLowering = true; break;
				case "Property": case "MethodDefinition": case "PropertyDefinition":
					if (isBigIntKey(node)) info.needsLowering = true; break;
				case "AwaitExpression": if (!inFunction) info.topLevelAwait = true; break;
				case "ForOfStatement": if (node.await && !inFunction) info.topLevelAwait = true; break;
				case "ImportDeclaration": case "ExportNamedDeclaration": case "ExportAllDeclaration":
					if (node.source) info.imports.push(node.source.value); break;
				case "Literal":
					// esbuild turns these into new RegExp(…), which then throws when it runs (Safari < 16.4 has no
					// lookbehind; the d and v flags are newer still). Nothing can lower them, so they fail the build.
					if (node.regex && (/\(\?<[=!]/.test(node.regex.pattern) || /[dv]/.test(node.regex.flags)))
						info.unsupportedRegex.push(`line ${lineOf(code, node.start)}: ${node.raw.slice(0, 60)}`);
					break;
				case "ImportExpression":
					if (node.source.type === "Literal" && typeof node.source.value === "string") info.dynamicImports.push(node.source.value); break;
			}
			const enters = inFunction || /Function/.test(node.type) || node.type === "StaticBlock" || node.type === "PropertyDefinition";
			for (const key in node) {
				const value = node[key];
				if (Array.isArray(value)) for (const child of value) visit(child, enters);
				else if (value && typeof value.type === "string") visit(value, enters);
			}
		})(ast, false);
	}
	await writeCache(key, "analysis.json", JSON.stringify(info));
	return info;
}

/** A BigInt literal used as a property name, `{ 0n: … }`, which Chrome < 73's parser rejects. */
function isBigIntKey(node) {
	return !node.computed && node.key && node.key.type === "Literal" && typeof node.key.bigint === "string";
}

/** Rewrites `{ 0n: … }` keys to the equivalent `{ "0": … }` (a property name is a string either way). */
function rewriteBigIntKeys(code, sourceType) {
	if (!/\dn\s*[:(]/.test(code)) return code;
	const keys = [];
	(function visit(node) {
		if (!node || typeof node.type !== "string") return;
		if (/^(Property|MethodDefinition|PropertyDefinition)$/.test(node.type) && isBigIntKey(node)) keys.push(node.key);
		for (const key in node) {
			const value = node[key];
			if (Array.isArray(value)) value.forEach(visit);
			else if (value && typeof value.type === "string") visit(value);
		}
	})(acorn.parse(code, { ecmaVersion: "latest", sourceType, allowHashBang: true }));
	for (const key of keys.sort((a, b) => b.start - a.start))
		code = code.slice(0, key.start) + JSON.stringify(BigInt(key.bigint).toString()) + code.slice(key.end);
	return code;
}

function lineOf(code, offset) {
	return code.slice(0, offset).split("\n").length;
}

function describe(message) {
	const where = message.location ? `:${message.location.line}` : "";
	return `${message.text ?? message.message}${where ? ` (line ${where.slice(1)})` : ""}`;
}

function hash(text) {
	return createHash("sha1").update(text).digest("hex");
}

async function readCache(key, kind) {
	const file = path.join(cacheDir, kind.replace(".json", ""), hash(buildId + key) + ".json");
	return existsSync(file) ? readFile(file, "utf8") : null;
}

async function writeCache(key, kind, text) {
	const dir = path.join(cacheDir, kind.replace(".json", ""));
	await mkdir(dir, { recursive: true });
	await writeFile(path.join(dir, hash(buildId + key) + ".json"), text);
}

async function listFiles(dir) {
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...await listFiles(full));
		else out.push(full);
	}
	return out;
}

function toPosix(p) {
	return p.split(path.sep).join("/");
}

async function writeIfChanged(file, text) {
	if (existsSync(file) && (await readFile(file, "utf8")) === text) return;
	await writeFile(file, text);
}
