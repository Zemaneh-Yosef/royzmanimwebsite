// Fills in the service worker's offline file list and version. Run on the Jekyll output after each
// build, by _plugins/pwa.rb (after the legacy build):
//     node scripts/pwa/precache.mjs <built site> [<site source>]
//
// Starting from the pages in PAGES, it collects every same-origin file they need to run: scripts,
// stylesheets (and the .woff2 fonts and small images they use), icons, the manifest, their small images
// (every srcset width that's small enough), the polyfills
// _includes/polyfills.html may load, and the JavaScript modules those scripts import (statically,
// through import() of a fixed path, as module workers via new URL("…", import.meta.url), and the
// JSON they fetch from a fixed path). The list, and a version made from the bytes of every file on
// it, replace the placeholders in the built sw.js. So a deploy that changes any of these files
// changes sw.js, which makes browsers install the new worker and download the new set; a deploy
// that changes nothing on the list leaves sw.js, and everyone's offline copy, alone.
//
// The source sw.js is always the input, so running this again gives the same result.

import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/** Pages that work offline from the moment the worker is installed. Paths are relative to _site. */
const PAGES = ["index.html", "calendar.html", "offline.html"];

/**
 * Files never put on the list, with everything they import: features that only run on request
 * and need a large download (the Excel export pulls in a 900 KB library). They are still stored
 * once they've been used.
 */
const SKIP = ["assets/js/features/excelPrepare.js", "assets/libraries/xlsx.js",
	// the maps (OpenLayers, 350 KB) are no use offline: their tiles come from the network
	"assets/js/ui/map.js"];

/** Files the pages need that no fixed path points to (kosher-zmanim.js builds these URLs from its folder). */
const EXTRA = ["assets/libraries/kosherZmanim/hiloulah-en.json", "assets/libraries/kosherZmanim/hiloulah-he.json"];

/** The pages' own <img>s up to this size are on the list; bigger ones are stored once they're shown. */
const MAX_IMAGE_BYTES = 150 * 1024;

const siteDir = path.resolve(process.argv[2] ?? "_site");
const sourceDir = path.resolve(process.argv[3] ?? ".");

/** Files on the list (relative to _site) → the URL they're requested at @type {Map<string, string>} */
const found = new Map();
const problems = [];

for (const page of PAGES) {
	const file = path.join(siteDir, page);
	if (!existsSync(file)) { problems.push(`${page}: not in the built site`); continue; }
	found.set(page, toUrl(page));
	const html = await readFile(file, "utf8");
	for (const ref of htmlReferences(html)) await add(ref, page);
	// <img>s: src and every srcset width (_includes/image.html), each if it's small enough
	for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
		const attr = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"))?.slice(1).find((v) => v !== undefined);
		const src = attr("src");
		if (src) await add(src, page, true);
		for (const candidate of (attr("srcset") ?? "").split(",")) {
			const url = candidate.trim().split(/\s+/)[0];
			if (url) await add(url, page, true);
		}
	}
	for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
		if (/\bsrc\s*=/i.test(match[1]) || !/\btype\s*=\s*["']?module/i.test(match[1])) continue;
		for (const ref of moduleReferences(match[2], page)) await add(ref, page);
	}
}

for (const name of EXTRA) await add("/" + name, "EXTRA");

if (problems.length) {
	console.error(problems.map((p) => "pwa: " + p).join("\n"));
	process.exit(1);
}

const files = [...found.keys()].sort();
const hash = createHash("sha256");
for (const name of files) hash.update(name + "\0").update(await readFile(path.join(siteDir, name))).update("\0");
const swSource = await readFile(path.join(sourceDir, "sw.js"), "utf8");
hash.update(swSource);
const version = hash.digest("hex").slice(0, 12);

const urls = files.map((name) => found.get(name));
let sw = swSource;
sw = replaceOnce(sw, /var VERSION = "[^"]*";/, `var VERSION = "${version}";`);
sw = replaceOnce(sw, /var PRECACHE = \[\];/, `var PRECACHE = ${JSON.stringify(urls)};`);
const out = path.join(siteDir, "sw.js");
if (!existsSync(out) || (await readFile(out, "utf8")) !== sw) await writeFile(out, sw);

let bytes = 0;
for (const name of files) bytes += (await readFile(path.join(siteDir, name))).length;
console.log(`pwa: ${urls.length} files (${(bytes / 1024 / 1024).toFixed(1)} MB) stored for offline use, version ${version}`);

// ─── Helpers ───

/**
 * Adds a same-origin file, and what it imports, to the list.
 * @param {string} ref as written in the page or script
 * @param {string} from the file it was written in (relative to _site)
 * @param {boolean} [isImage] an image, left off the list when it's over MAX_IMAGE_BYTES
 */
async function add(ref, from, isImage = false) {
	const resolved = resolve(ref, from);
	if (!resolved) return;
	const { name, search } = resolved;
	if (found.has(name) || SKIP.includes(name)) return;
	const file = path.join(siteDir, name);
	if (!existsSync(file)) {
		// a missing image only looks broken; a missing script would break the page offline
		if (isImage) console.warn(`pwa: ${from}: "${ref}" isn't in the built site`);
		else problems.push(`${from}: "${ref}" isn't in the built site`);
		return;
	}
	if (isImage && (await stat(file)).size > MAX_IMAGE_BYTES) return;
	// Requested exactly as referenced (e.g. a font's "?hash"), so the stored copy is found
	found.set(name, name.endsWith(".html") ? toUrl(name) : "/" + name + search);
	if (/\.m?js$/.test(name)) {
		const code = await readFile(file, "utf8");
		for (const next of moduleReferences(code, name)) await add(next, name);
	} else if (name.endsWith(".css")) {
		const css = await readFile(file, "utf8");
		for (const [, , url] of css.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/g)) {
			const file = url.split(/[?#]/)[0];
			if (/\.woff2$/i.test(file)) await add(url, name);
			else if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file)) await add(url, name, true); // backgrounds, if small enough
		}
	}
}

/** @returns {{ name: string, search: string } | null} the path relative to _site, or null for other sites and data: URLs */
function resolve(ref, from) {
	if (!ref || /^(data|blob|javascript|mailto):/i.test(ref) || ref.startsWith("#")) return null;
	let url;
	try { url = new URL(ref, "https://site.invalid/" + from); } catch { return null; }
	if (url.origin !== "https://site.invalid") return null;
	let name = decodeURIComponent(url.pathname).replace(/^\/+/, "");
	if (name === "" || name.endsWith("/")) name += "index.html";
	else if (!path.extname(name) && existsSync(path.join(siteDir, name + ".html"))) name += ".html";
	return { name, search: url.search };
}

/** The URL a file is requested at: pages without ".html" (as the site links them), "/" for the home page. */
function toUrl(name) {
	if (name === "index.html") return "/";
	return "/" + name.replace(/\.html$/, "");
}

/** Files a page loads through its <script> and <link> tags (and the polyfills its inline scripts write in). */
function htmlReferences(html) {
	const refs = [];
	for (const [tag] of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
		const attr = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(1).find((v) => v !== undefined);
		if (/^<script/i.test(tag)) { const src = attr("src"); if (src) refs.push(src); continue; }
		const rel = (attr("rel") ?? "").toLowerCase().split(/\s+/);
		if (rel.some((r) => ["stylesheet", "modulepreload", "icon", "apple-touch-icon", "manifest"].includes(r))) {
			const href = attr("href");
			if (href) refs.push(href);
		}
	}
	return refs;
}

/** What a script imports, starts as a module worker or fetches as JSON — only fixed paths. */
function moduleReferences(code, name) {
	let ast;
	try {
		ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module", allowHashBang: true });
	} catch {
		try { ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "script", allowHashBang: true }); }
		catch { problems.push(`${name}: couldn't be parsed`); return []; }
	}
	const refs = [];
	const literal = (node) => node && node.type === "Literal" && typeof node.value === "string" ? node.value
		: node && node.type === "TemplateLiteral" && node.expressions.length === 0 ? node.quasis[0].value.cooked : null;
	walk.full(ast, (node) => {
		switch (node.type) {
			case "ImportDeclaration":
			case "ExportAllDeclaration":
			case "ExportNamedDeclaration":
				if (node.source) refs.push(node.source.value);
				break;
			case "ImportExpression": {
				const spec = literal(node.source);
				if (spec) refs.push(spec);
				break;
			}
			case "NewExpression": {
				// new URL("./worker.js", import.meta.url)
				if (node.callee.type === "Identifier" && node.callee.name === "URL" && node.arguments.length === 2
					&& node.arguments[1].type === "MemberExpression" && node.arguments[1].object.type === "MetaProperty") {
					const spec = literal(node.arguments[0]);
					if (spec && /\.m?js$/.test(spec)) refs.push(spec);
				}
				break;
			}
			case "CallExpression": {
				// fetch("/assets/…/data.json")
				if (node.callee.type === "Identifier" && node.callee.name === "fetch") {
					const spec = literal(node.arguments[0]);
					if (spec && /\.json$/.test(spec.split("?")[0])) refs.push(spec);
				}
				break;
			}
		}
	});
	return refs.filter((ref) => /^(\.{1,2}\/|\/)/.test(ref));
}

function replaceOnce(text, pattern, replacement) {
	if (!pattern.test(text)) throw new Error(`pwa: sw.js no longer contains ${pattern}`);
	return text.replace(pattern, replacement);
}
