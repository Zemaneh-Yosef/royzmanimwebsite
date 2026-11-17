// Makes the lossless WebP copies of the images listed in _data/images.yml, one per width. Run on the Jekyll
// output after each build, by _plugins/images.rb, which passes the list as JSON on stdin:
//     node scripts/images/build.mjs <built site> [<site source>] < images.json
//
// Each copy goes next to its source in the built site, as name-<width>w.webp (_includes/image.html links
// them). Encoding is slow, so copies are kept in .jekyll-cache/images and only made again when the source,
// the width or this script changes.

import sharp from "sharp";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename } from "node:fs/promises";
import path from "node:path";

const siteDir = path.resolve(process.argv[2] ?? "_site");
const sourceDir = path.resolve(process.argv[3] ?? ".");
const cacheDir = path.join(sourceDir, ".jekyll-cache", "images");
const started = Date.now();

/** @type {Record<string, { src: string, widths: number[] }>} */
const images = JSON.parse(await readStdin() || "{}");
const scriptId = createHash("sha256").update(await readFile(new URL(import.meta.url))).update(sharp.versions.sharp).digest("hex");
await mkdir(cacheDir, { recursive: true });

const problems = [];
let made = 0, total = 0;
await Promise.all(Object.entries(images).map(async ([name, { src, widths }]) => {
	const source = path.join(sourceDir, src.replace(/^\/+/, ""));
	if (!existsSync(source)) { problems.push(`${name}: ${src} doesn't exist`); return; }
	const bytes = await readFile(source);
	const { width: sourceWidth } = await sharp(bytes).metadata();
	const base = src.replace(/^\/+/, "").replace(/\.[^./]+$/, "");
	for (const width of widths) {
		if (!Number.isInteger(width) || width <= 0) { problems.push(`${name}: width ${width} isn't a whole number of pixels`); continue; }
		if (width > sourceWidth) { problems.push(`${name}: ${width}w is wider than ${src} (${sourceWidth}px)`); continue; }
		total++;
		const key = createHash("sha256").update(scriptId).update(bytes).update(String(width)).digest("hex");
		const cached = path.join(cacheDir, key + ".webp");
		if (!existsSync(cached)) {
			const temp = cached + "." + process.pid + ".tmp";
			await sharp(bytes)
				.resize({ width, kernel: "lanczos3" })
				.webp({ lossless: true, effort: 6 })
				.toFile(temp);
			await rename(temp, cached);
			made++;
		}
		const out = path.join(siteDir, `${base}-${width}w.webp`);
		await mkdir(path.dirname(out), { recursive: true });
		await copyFile(cached, out);
	}
}));

if (problems.length) {
	console.error(problems.map((p) => "images: " + p).join("\n"));
	process.exit(1);
}
console.log(`${total} WebP copies (${made} made, the rest from the cache) in ${((Date.now() - started) / 1000).toFixed(1)}s`);

async function readStdin() {
	const chunks = [];
	for await (const chunk of process.stdin) chunks.push(chunk);
	return Buffer.concat(chunks).toString("utf8");
}
