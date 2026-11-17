// Draws the launch screens iOS shows while the installed app opens (it has no use for the manifest's
// icons and colors there), and lists them in _data/pwaSplash.yml for _includes/pwa.html. Run by hand
// when the icon or the device list changes; needs Playwright with Chromium (not a dependency of the site):
//     node scripts/pwa/make-splash.mjs
//
// iOS only uses an image whose media query matches the device exactly, so there is one per screen size,
// portrait (the manifest keeps the app in portrait).

import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");

const root = path.resolve(import.meta.dirname, "../..");
const outDir = "assets/images/pwa/splash";
const BACKGROUND = "#1A1D2A"; // manifest.json background_color

/** [CSS width, CSS height, pixel ratio, devices] */
const SCREENS = [
	[440, 956, 3, "iPhone 16 Pro Max, 17 Pro Max"],
	[402, 874, 3, "iPhone 16 Pro, 17, 17 Pro"],
	[420, 912, 3, "iPhone Air"],
	[430, 932, 3, "iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus"],
	[393, 852, 3, "iPhone 14 Pro, 15, 15 Pro, 16, 16e"],
	[428, 926, 3, "iPhone 12 Pro Max, 13 Pro Max, 14 Plus"],
	[390, 844, 3, "iPhone 12, 12 Pro, 13, 13 Pro, 14"],
	[375, 812, 3, "iPhone X, XS, 11 Pro, 12 mini, 13 mini"],
	[414, 896, 3, "iPhone XS Max, 11 Pro Max"],
	[414, 896, 2, "iPhone XR, 11"],
	[375, 667, 2, "iPhone 6–8, SE (2nd, 3rd gen.)"],
	[1032, 1376, 2, "iPad Pro 13\" (M4)"],
	[1024, 1366, 2, "iPad Pro 12.9\", iPad Air 13\""],
	[834, 1210, 2, "iPad Pro 11\" (M4)"],
	[834, 1194, 2, "iPad Pro 11\", iPad Air 11\""],
	[820, 1180, 2, "iPad Air (4th, 5th gen.), iPad (10th gen. and later)"],
	[810, 1080, 2, "iPad (7th–9th gen.)"],
	[768, 1024, 2, "iPad mini (5th gen.), older iPads"],
	[744, 1133, 2, "iPad mini (6th gen. and later)"]
];

const icon = (await readFile(path.join(root, "assets/images/pwa/icon-512.png"))).toString("base64");
const html = `<!doctype html><html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:${BACKGROUND}">
<img src="data:image/png;base64,${icon}" style="width:min(36vw,280px);aspect-ratio:1;border-radius:22%;box-shadow:0 1.5vw 5vw rgba(0,0,0,.45)"></body></html>`;

await mkdir(path.join(root, outDir), { recursive: true });
const browser = await chromium.launch();
const yaml = ["# Launch screens for the installed app on iOS (_includes/pwa.html). Made by scripts/pwa/make-splash.mjs."];
for (const [width, height, ratio, devices] of SCREENS) {
	const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: ratio });
	await page.setContent(html);
	const file = `${outDir}/splash-${width * ratio}x${height * ratio}.jpg`;
	await page.screenshot({ path: path.join(root, file), type: "jpeg", quality: 82 });
	await page.close();
	yaml.push(`- href: /${file} # ${devices}`,
		`  media: "(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)"`);
}
await browser.close();
await writeFile(path.join(root, "_data/pwaSplash.yml"), yaml.join("\n") + "\n");
console.log(`${SCREENS.length} launch screens written to ${outDir}`);
