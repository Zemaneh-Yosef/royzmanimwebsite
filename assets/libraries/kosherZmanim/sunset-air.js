// @ts-check
/**
 * sunset-air.js
 *
 * A statistical correction of the lowest 200 m of weather-model air at sunset (Model Output Statistics,
 * Glahn & Lowry 1972, J. Appl. Meteor. 11:1203).
 *
 * Why: in the evening the ground cools and the air just above it ends up colder than the air higher up
 * (a ground inversion). Weather models make that inversion too strong at sunset, which bends the last
 * light too much and puts the computed sunset late. Against Sampson's 124 observed Edmonton sunsets
 * (1990-94; Sampson, Lozowski & Peterson 2003, PASP 115:366) ERA5 air gave sunsets 25 s late on average
 * (rms 50 s; summer 82 s); the same correction fitted to ERA5 brought that to 7 s (rms 29 s; summer 26 s),
 * without making more sunsets early. At sunrise it changed nothing measurable, so it is applied at sunset only.
 *
 * What: at 25, 50, 100 and 200 m above the model's ground the temperature rise over the 2 m air becomes
 *     a + b * (the model's own rise there)
 * Above 200 m the model's air is kept. a and b come from radiosondes (NOAA's IGRA v2) released within
 * an hour of sunset, against the same model's forecast at the release, one least-squares line per height;
 * out-of-sample skill was checked by leaving out a fifth of the stations at a time. Wind, cloud cover,
 * boundary-layer height and surface heat flux were tried as further predictors and added nothing.
 *
 * Which air: each model has its own errors, so each has its own coefficients and air from a model with
 * none is left as it is. Columns over water are never changed (the fit is for land).
 *   gfs  NOAA GFS 0.25 deg, the 00 UTC run's 11 and 23 h forecasts, 2022-2025: 19,409 sunset soundings,
 *        166 stations. Out of sample, rms error of the rise at 25 / 50 / 100 / 200 m:
 *        0.80 / 1.25 / 1.79 / 2.06 K raw -> 0.64 / 0.90 / 1.18 / 1.60 K; the raw rise was too large
 *        by 0.29 / 0.55 / 0.85 / 0.82 K on average.
 * The correction is linear, so it is equally right for a column averaged over many days (a climatology
 * built from the same model).
 */

/** @typedef {import('./royzmanim-spa-corrections.js').PathProfile} PathProfile */

/** Heights above the model's ground (m) the correction sets. */
export const SUNSET_AIR_HEIGHTS_M = [25, 50, 100, 200];

/** a (K), b per height in SUNSET_AIR_HEIGHTS_M, by model. */
export const SUNSET_AIR_COEFFICIENTS = {
	gfs: [[-0.0912, 0.2659], [-0.2151, 0.2745], [-0.4609, 0.2952], [-0.7808, 0.4320]],
};

const G0 = 9.80665, R_DRY = 287.05;

/** @param {number[]} zs ascending @param {number[]} ts @param {number} z */
function interp(zs, ts, z) {
	if (z <= zs[0]) return ts[0];
	for (let i = 0; i < zs.length - 1; i++) {
		if (z <= zs[i + 1]) return ts[i] + (ts[i + 1] - ts[i]) * (z - zs[i]) / (zs[i + 1] - zs[i]);
	}
	return NaN;
}

/**
 * One column corrected (a new profile; the input is not changed). Returned unchanged when the model has no
 * coefficients, the column is over water, or its levels do not reach 200 m above the ground.
 * The lowest level must be the 2 m air (as both the refraction server and the Open-Meteo provider give it).
 * @param {PathProfile} prof @param {string} model a key of SUNSET_AIR_COEFFICIENTS
 * @returns {PathProfile}
 */
export function correctSunsetColumn(prof, model) {
	const coef = SUNSET_AIR_COEFFICIENTS[/** @type {keyof typeof SUNSET_AIR_COEFFICIENTS} */ (model)];
	if (!coef || prof.water) return prof;
	const levels = [...(prof.levels ?? [])].sort((a, b) => a.h - b.h);
	if (levels.length < 2) return prof;
	const l0 = levels[0], ground = l0.h - 2;
	const zs = levels.map(l => l.h - ground), ts = levels.map(l => l.t);
	const top = SUNSET_AIR_HEIGHTS_M[SUNSET_AIR_HEIGHTS_M.length - 1];
	if (zs[zs.length - 1] < top + 2) return prof;
	const out = [l0];
	SUNSET_AIR_HEIGHTS_M.forEach((h, k) => {
		const rise = interp(zs, ts, h + 2) - l0.t;
		const t = l0.t + coef[k][0] + coef[k][1] * rise;
		const z = ground + 2 + h, prev = out[out.length - 1];
		const p = prev.p * Math.exp(-G0 * (z - prev.h) / (R_DRY * ((t + prev.t) / 2 + 273.15)));
		out.push({ h: z, t, p });
	});
	for (const l of levels) if (l.h - ground > top + 3) out.push(l);
	return { ...prof, levels: out };
}

/**
 * A sunset path corrected column by column (see correctSunsetColumn).
 * @param {PathProfile[]} path @param {string} model
 * @returns {PathProfile[]}
 */
export function correctSunsetPath(path, model) {
	return path.map(p => correctSunsetColumn(p, model));
}
