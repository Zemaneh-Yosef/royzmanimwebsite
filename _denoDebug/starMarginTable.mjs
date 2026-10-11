// Builds STAR_MARGIN_TABLE in pages/handasi-hazeman.html. Run with Node or Deno:
//     node _denoDebug/starMarginTable.mjs
//
// For each average dusk haze (read when the Sun is 4.65 degrees down) Jerusalem might have (aerosol optical depth at 550 nm), the star model's
// threshold margin (marginMag) at which the earliest nightfall of the year in Jerusalem (754 m, three medium
// stars anywhere, no light pollution, no Moon - the earliest evening of the year is a moonless one) comes 18
// minutes after sea-level sunset (the Sun's centre 0.833 degrees down). The page interpolates it at Jerusalem's
// actual average, so that under Jerusalem's average sky the Gemara's 18 minutes come out exactly.

import { starNightfall, eveningSunAt } from "../assets/libraries/kosherZmanim/star-nightfall.js";

const J = { lat: 31.7780, lon: 35.2354, h: 754 };
const TARGET_MIN = 18;
const AODS = [0.03, 0.05, 0.07, 0.1, 0.13, 0.16, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6];
const YEARS = [2024, 2026, 2028, 2030];

/** @param {number} year @param {number} doy 0-based */
const dateOf = (year, doy) => {
	const d = new Date(Date.UTC(year, 0, 1 + doy));
	return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};

/** minutes from sea-level sunset to nightfall */
function minutesAfterSunset(date, aod, marginMag) {
	const r = starNightfall(date, J.lat, J.lon, { stars: "medium", aod, blpCdM2: 0, elevationM: J.h, marginMag });
	return (r.ms - eveningSunAt(date, J.lat, J.lon, -0.833)) / 60000;
}

/** earliest nightfall of the year: coarse every 3 days, then daily around the coarse minimum */
function earliest(year, aod, marginMag, around = null) {
	let best = Infinity, bestDoy = 0;
	const days = around === null ? Array.from({ length: 122 }, (_, i) => i * 3) : Array.from({ length: 21 }, (_, i) => around - 10 + i);
	for (const doy of days) {
		const m = minutesAfterSunset(dateOf(year, (doy + 365) % 365), aod, marginMag);
		if (m < best) { best = m; bestDoy = doy; }
	}
	if (around === null) return earliest(year, aod, marginMag, bestDoy);
	return { minutes: best, doy: (bestDoy + 365) % 365 };
}

const rows = [];
for (const aod of AODS) {
	const year = 2026;
	// the earliest evening hardly moves with the margin: find it once, then bisect on that window
	const guess = earliest(year, aod, 0.5);
	let lo = -3, hi = 3;
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2;
		if (earliest(year, aod, mid, guess.doy).minutes > TARGET_MIN) hi = mid; else lo = mid;
	}
	const margin = (lo + hi) / 2;
	const check = YEARS.map(y => earliest(y, aod, margin));
	rows.push([aod, +margin.toFixed(4)]);
	console.error(`aod ${aod.toFixed(2)}  margin ${margin.toFixed(4)}  earliest ${check.map(c => `${c.minutes.toFixed(2)} (doy ${c.doy})`).join(", ")}`);
}
console.log(`const STAR_MARGIN_TABLE = [\n${rows.map(r => `\t\t[${r[0]}, ${r[1]}]`).join(",\n")}\n\t];`);
