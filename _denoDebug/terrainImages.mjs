// node _denoDebug/terrainImages.mjs HORIZON ERA5 - how often a horizon point near the sunrise azimuth has more than one image
import "../assets/libraries/temporal-polyfill/global.min.js";
import { readFileSync } from "node:fs";
import { createPathAtmosphere, terrainElevation, earthRadiusAtLatitude } from "../assets/libraries/kosherZmanim/royzmanim-spa-corrections.js";
const [hzFile, era5File] = process.argv.slice(2);
const pt = JSON.parse(readFileSync(hzFile, "utf8")).points[0];
const body = JSON.parse(readFileSync(era5File, "utf8"));
const R = earthRadiusAtLatitude(pt.lat, 90) * 1000, ho = pt.height;
let days = 0, multi = 0, maxGap = 0;
for (const e of body.events) {
  if (!e.profiles?.length) continue;
  days++;
  const m = createPathAtmosphere(e.profiles, "d" + e.date, { surfaceLayer: false, latitudeDeg: pt.lat });
  const az0 = e.azimuthDeg ?? 100;
  const pts = pt.sunrise.filter(q => Math.abs(q.azimuthDeg - az0) < 1.5);
  let dayMulti = false;
  for (const q of pts) {
    const d = q.distanceKm * 1000, a = terrainElevation(m, ho, q.heightM, d, R);
    // a ray aimed higher should clear the ridge; one that falls below it again means another image
    for (let k = 1; k <= 30; k++) {
      const h = m.heightAt(ho, a + k * 0.005, R, d) - q.heightM;
      if (h < 0) { dayMulti = true; maxGap = Math.max(maxGap, k * 0.005); break; }
    }
  }
  if (dayMulti) multi++;
}
console.log("days", days, "with a multiple image near the sunrise azimuth", multi, "largest extra elevation (deg)", maxGap);
