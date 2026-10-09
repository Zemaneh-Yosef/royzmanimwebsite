// @ts-check
/**
 * star-nightfall.js
 *
 * Nightfall by the stars: the moment three stars of a given brightness can be seen, from the twilight
 * sky's brightness, light pollution and the air's clarity (haze). This is the star-visibility model of
 * A. Taylor's halakhic_calc (github.com/astertaylor/halakhic_calc, calc_time.py; Taylor 2026,
 * arXiv:2608.04064), written again from its published formulas, with two fixes (below), and with the
 * haze taken from data instead of a fixed clear atmosphere:
 *
 *   sky       twilight luminance by altitude, azimuth from the Sun and solar altitude (the table used by
 *             halakhic_calc), scaled by (1 - 10^(-0.4 k X)) for the air the line of sight crosses; plus
 *             the artificial sky (light pollution, Blp) and the natural night sky (1.7e-4 cd/m^2)
 *   threshold the faintest point source the eye sees against that sky (Crumey 2014), raised by the
 *             star's extinction 10^(0.4 k X), with halakhic_calc's 1 magnitude margin
 *   extinction k = 0.1066 (Rayleigh and ozone, as halakhic_calc) + 1.086 x aerosol optical depth (550 nm)
 *   airmass   X = (1 - (cos(alt) / (1 + h / R))^2)^-1/2 at the apparent (refracted) altitude, stars
 *             above 10 degrees only
 *   stars     Yale Bright Star Catalog: medium = V 2.0-3.0, small = V 3.0-4.0 (halakhic_calc's classes);
 *             positions precessed from J2000 to the date
 *   nightfall the first moment three such stars are visible ('anywhere'), or three within `nearDeg` of
 *             one another ('together', halakhic_calc's 10 degrees for small stars)
 *
 * halakhic_calc's own fixed extinction (0.1066 + 0.12 e^(-h/1500)) corresponds to an aerosol optical
 * depth of ~0.11 at sea level - clearer than most places most of the time. The Moon is left out (it is
 * in halakhic_calc): the haze delay below compares two hazes under the same sky, and a moonless sky is
 * the reference.
 *
 * Fixes relative to calc_time.py (October 2026):
 *  - its twilight table is stored from the zenith down (altitude 90, 80, ... 0) but was reshaped as if
 *    stored from the horizon up, so every star got the sky brightness of the mirrored altitude (the
 *    zenith's for a star on the horizon, and the horizon's - strongly dependent on the Sun's side - for
 *    one overhead). Read the right way up here. It moves nightfall by under a minute.
 *  - halakhic_time() checks its final answer with the default 10 degree grouping even for 'anywhere',
 *    so 'anywhere' times often fell on its 10 minute search grid. The search here bisects to ~5 s.
 * Checked against calc_time.py (with the table fixed and the Moon removed) for Jerusalem and Brooklyn at
 * the equinox and both solstices, aerosol optical depths 0.05-0.7, with and without light pollution: all
 * 87 times within 1.6 min; small stars within 0.4 min. Medium stars come ~1 min earlier here because
 * PyEphem refracts the Sun's altitude even below the horizon (-1.8 deg true reads -1.0 deg) and the
 * twilight table is entered with that; here the true solar altitude is used. That cancels in a haze delay.
 *
 * Haze delay (hazeDelayMs): nightfall at a day's haze minus nightfall at a reference haze (e.g. the
 * place's long-run average), same sky otherwise. Added to a time defined for average conditions (such
 * as Tzet Shabbat by degrees), it makes hazier evenings later and clearer ones earlier. Where the stars
 * do not appear before the Sun is 18 degrees down, the moment it reaches 18 degrees stands in.
 *
 * How sure: the extinction of starlight by haze is plain physics; the brightening of the twilight sky by
 * haze (the (1 - 10^(-0.4 k X)) factor) is the model's assumption and probably overstates the effect late
 * in twilight, when most haze is in the Earth's shadow. Not yet compared with observations on hazy nights.
 */

const DEG = Math.PI / 180;
const RAYLEIGH_K = 0.1066;
const AOD_TO_K = 2.5 * Math.LOG10E;            // magnitudes per unit optical depth (1.0857)
const NATURAL_SKY_CDM2 = 1.7e-4;
const MIN_ALT_DEG = 10;
const EARTH_R_M = 6371000;

/** @typedef {'medium' | 'small'} StarClass */
/**
 * @typedef {{ aod: number, blpCdM2?: number | null, stars?: StarClass, together?: boolean, nearDeg?: number,
 *             elevationM?: number }} NightfallOptions
 *   aod: aerosol optical depth at 550 nm. blpCdM2: light pollution, cd/m^2 (the server's blpCdM2; 0 / null =
 *   none). stars: 'medium' (default) or 'small'. together: three within nearDeg (default: true for small
 *   stars, false for medium). elevationM: observer's height (airmass only; default 0).
 */

/** Julian day of an epoch-ms instant @param {number} ms */
const jdOf = ms => ms / 86400000 + 2440587.5;

/**
 * The Sun's apparent right ascension and declination (deg), low precision (Meeus ch. 25, ~0.01 deg).
 * @param {number} jd @returns {[number, number]}
 */
function sunRaDec(jd) {
	const T = (jd - 2451545) / 36525;
	const L0 = 280.46646 + 36000.76983 * T;
	const M = (357.52911 + 35999.05029 * T) * DEG;
	const C = (1.914602 - 0.004817 * T) * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
	const om = (125.04 - 1934.136 * T) * DEG;
	const lam = (L0 + C - 0.00569 - 0.00478 * Math.sin(om)) * DEG;
	const eps = (23.439291 - 0.0130042 * T + 0.00256 * Math.cos(om)) * DEG;
	return [Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / DEG, Math.asin(Math.sin(eps) * Math.sin(lam)) / DEG];
}

/** Local sidereal time (deg) @param {number} jd @param {number} lonDeg */
function lst(jd, lonDeg) {
	const d = jd - 2451545, T = d / 36525;
	return ((280.46061837 + 360.98564736629 * d + 0.000387933 * T * T + lonDeg) % 360 + 360) % 360;
}

/**
 * Altitude and azimuth (deg; azimuth east of north) of RA / Dec.
 * @param {number} raDeg @param {number} decDeg @param {number} lstDeg @param {number} latDeg @returns {[number, number]}
 */
function altAz(raDeg, decDeg, lstDeg, latDeg) {
	const H = (lstDeg - raDeg) * DEG, d = decDeg * DEG, p = latDeg * DEG;
	const sinAlt = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
	const az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.sin(p) * Math.cos(H));
	return [Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG, ((az / DEG) % 360 + 360) % 360];
}

/**
 * J2000 RA / Dec precessed to the date (IAU 1976 angles; ample for star visibility).
 * @param {number[][]} stars [ra, dec, mag] @param {number} jd @returns {[number, number, number][]}
 */
function precess(stars, jd) {
	const T = (jd - 2451545) / 36525;
	const zeta = (2306.2181 * T + 0.30188 * T * T) / 3600 * DEG;
	const z = (2306.2181 * T + 1.09468 * T * T) / 3600 * DEG;
	const th = (2004.3109 * T - 0.42665 * T * T) / 3600 * DEG;
	return stars.map(([ra, dec, mag]) => {
		const a = ra * DEG, d = dec * DEG;
		const A = Math.cos(d) * Math.sin(a + zeta);
		const B = Math.cos(th) * Math.cos(d) * Math.cos(a + zeta) - Math.sin(th) * Math.sin(d);
		const C = Math.sin(th) * Math.cos(d) * Math.cos(a + zeta) + Math.cos(th) * Math.sin(d);
		return [((Math.atan2(A, B) + z) / DEG % 360 + 360) % 360, Math.asin(C) / DEG, mag];
	});
}

/** index and fraction along a sorted axis, extrapolating past the ends @param {number[]} ax @param {number} x */
function axisPos(ax, x) {
	let i = 0;
	while (i < ax.length - 2 && x > ax[i + 1]) i++;
	return [i, (x - ax[i]) / (ax[i + 1] - ax[i])];
}

/**
 * Twilight sky luminance (cd/m^2): trilinear in log10, linearly extrapolated outside the table
 * (as scipy's RegularGridInterpolator with fill_value=None, which halakhic_calc uses).
 * @param {number} altDeg @param {number} dAzDeg 0-180 @param {number} sunAltDeg
 */
export function twilightLuminance(altDeg, dAzDeg, sunAltDeg) {
	const [i, fi] = axisPos(TW_ALT, altDeg), [j, fj] = axisPos(TW_DAZ, dAzDeg), [k, fk] = axisPos(TW_SUN, sunAltDeg);
	let v = 0;
	for (const [di, wi] of [[0, 1 - fi], [1, fi]])
		for (const [dj, wj] of [[0, 1 - fj], [1, fj]])
			for (const [dk, wk] of [[0, 1 - fk], [1, fk]])
				v += wi * wj * wk * TW_LOG_B[i + di][j + dj][k + dk];
	return Math.pow(10, v);
}

/** Crumey (2014) threshold illuminance (lux) of a point source against luminance B (cd/m^2) @param {number} B */
function brightLimit(B) {
	const a1 = 6.112e-8, a2 = -1.598e-7, a3 = 1.167e-7, a4 = 4.988e-4, a5 = -3.014e-4;
	const r = Math.sqrt(Math.max(0, a1 * Math.sqrt(B) + a2 * Math.pow(B, 0.75) + a3 * B));
	return Math.pow(r + a4 * Math.pow(B, 0.25) + a5 * Math.sqrt(B), 2);
}

/** @param {number} altDeg @param {number} elevationM */
function airmass(altDeg, elevationM) {
	const s = Math.cos(altDeg * DEG) / (1 + elevationM / EARTH_R_M);
	return 1 / Math.sqrt(1 - s * s);
}

/** angular distance (deg) @param {number[]} a [alt, az] @param {number[]} b */
function separation(a, b) {
	const c = Math.sin(a[0] * DEG) * Math.sin(b[0] * DEG) + Math.cos(a[0] * DEG) * Math.cos(b[0] * DEG) * Math.cos((a[1] - b[1]) * DEG);
	return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
}

/** three of the points within d of one another @param {number[][]} pts @param {number} d */
function threeTogether(pts, d) {
	for (let i = 0; i < pts.length; i++) {
		const nb = [];
		for (let j = 0; j < pts.length; j++) if (j !== i && separation(pts[i], pts[j]) <= d) nb.push(pts[j]);
		for (let k = 0; k < nb.length; k++)
			for (let l = k + 1; l < nb.length; l++) if (separation(nb[k], nb[l]) <= d) return true;
	}
	return false;
}

/**
 * Every star of a list above 10 degrees at an instant, with the faintest magnitude visible where it is.
 * @param {number} ms epoch ms @param {number} latDeg @param {number} lonDeg
 * @param {[number, number, number][]} stars precessed [ra, dec, mag]
 * @param {{ k: number, blp: number, elevationM: number }} p
 * @returns {{ alt: number, az: number, mag: number, limit: number }[]}
 */
function skyAt(ms, latDeg, lonDeg, stars, p) {
	const jd = jdOf(ms), t = lst(jd, lonDeg);
	const [sra, sdec] = sunRaDec(jd);
	const [sunAlt, sunAz] = altAz(sra, sdec, t, latDeg);
	const out = [];
	for (const [ra, dec, mag] of stars) {
		const [trueAlt, az] = altAz(ra, dec, t, latDeg);
		// apparent altitude (Bennett 1982, standard air): stars are seen where refraction puts them
		const alt = trueAlt + 1 / Math.tan((trueAlt + 7.31 / (trueAlt + 4.4)) * DEG) / 60;
		if (alt <= MIN_ALT_DEG) continue;
		let dAz = Math.abs(az - sunAz);
		if (dAz > 180) dAz = 360 - dAz;
		const X = airmass(alt, p.elevationM);
		const B = twilightLuminance(alt, dAz, sunAlt) * (1 - Math.pow(10, -0.4 * p.k * X)) + p.blp + NATURAL_SKY_CDM2;
		const I = brightLimit(B) * Math.pow(10, 0.4 * p.k * X);
		out.push({ alt, az, mag, limit: -2.5 * Math.log10(I) - 13.99 - 1.0 });
	}
	return out;
}

/**
 * Whether three stars are visible at an instant.
 * @param {number} ms epoch ms @param {number} latDeg @param {number} lonDeg
 * @param {[number, number, number][]} stars precessed [ra, dec, mag]
 * @param {{ k: number, blp: number, together: boolean, nearDeg: number, elevationM: number }} p
 */
function starsVisible(ms, latDeg, lonDeg, stars, p) {
	const seen = skyAt(ms, latDeg, lonDeg, stars, p).filter(s => s.mag <= s.limit).map(s => [s.alt, s.az]);
	return p.together ? threeTogether(seen, p.nearDeg) : seen.length >= 3;
}

/**
 * The stars of a class above 10 degrees at an instant, each with the faintest magnitude visible at its
 * place in the sky (visible when mag <= limit). For display or checking.
 * @param {number} ms @param {number} latDeg @param {number} lonDeg @param {NightfallOptions} options
 */
export function starsAt(ms, latDeg, lonDeg, options) {
	const cls = options.stars ?? 'medium';
	return skyAt(ms, latDeg, lonDeg, starsFor(cls, new Date(ms).getUTCFullYear()), paramsOf(options));
}

/** @param {NightfallOptions} options */
function paramsOf(options) {
	const cls = options.stars ?? 'medium';
	return {
		k: RAYLEIGH_K + AOD_TO_K * Math.max(0, options.aod),
		blp: Math.max(0, options.blpCdM2 ?? 0),
		together: options.together ?? cls === 'small',
		nearDeg: options.nearDeg ?? 10,
		elevationM: Math.max(0, options.elevationM ?? 0),
	};
}

/**
 * The Sun's altitude and azimuth (deg) at an instant (low precision, ~0.01 deg).
 * @param {number} ms @param {number} latDeg @param {number} lonDeg @returns {[number, number]}
 */
export function sunAltAz(ms, latDeg, lonDeg) {
	const jd = jdOf(ms), [r, d] = sunRaDec(jd);
	return altAz(r, d, lst(jd, lonDeg), latDeg);
}

/**
 * Instant (epoch ms) the Sun's centre reaches altitude hDeg in the evening of a date, or NaN.
 * @param {{year:number, month:number, day:number}} date @param {number} latDeg @param {number} lonDeg @param {number} hDeg
 */
export function eveningSunAt(date, latDeg, lonDeg, hDeg) {
	const noon = Date.UTC(date.year, date.month - 1, date.day, 12) - lonDeg / 15 * 3600000;
	const alt = (/** @type {number} */ ms) => { const jd = jdOf(ms); const [r, d] = sunRaDec(jd); return altAz(r, d, lst(jd, lonDeg), latDeg)[0]; };
	let lo = noon, hi = noon + 12 * 3600000;
	if (alt(lo) < hDeg || alt(hi) > hDeg) return NaN;
	for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (alt(m) > hDeg) lo = m; else hi = m; }
	return (lo + hi) / 2;
}

/** precessed star lists, per class and year @type {Map<string, [number, number, number][]>} */
const starCache = new Map();
/** @param {StarClass} cls @param {number} year */
function starsFor(cls, year) {
	const key = cls + year;
	let s = starCache.get(key);
	if (!s) {
		const [lo, hi] = cls === 'small' ? [3.0, 4.0] : [2.0, 3.0];
		s = precess(STARS.filter(x => x[2] >= lo && x[2] <= hi), jdOf(Date.UTC(year, 6, 1)));
		starCache.set(key, s);
	}
	return s;
}

/**
 * Nightfall by the stars on the evening of a date.
 * @param {{year:number, month:number, day:number}} date @param {number} latDeg @param {number} lonDeg
 * @param {NightfallOptions} options
 * @returns {{ ms: number, reached: boolean }} ms: the moment three stars are visible; if they are not
 *   before the Sun is 18 degrees down, that moment instead (reached: false). NaN if the Sun doesn't set.
 */
export function starNightfall(date, latDeg, lonDeg, options) {
	const cls = options.stars ?? 'medium';
	const p = paramsOf(options);
	const stars = starsFor(cls, date.year);
	const start = eveningSunAt(date, latDeg, lonDeg, -0.833);
	const end = eveningSunAt(date, latDeg, lonDeg, -18);
	if (!Number.isFinite(start)) return { ms: NaN, reached: false };
	const stop = Number.isFinite(end) ? end : start + 4 * 3600000;
	const step = 120000;
	let prev = start;
	for (let t = start; t <= stop; prev = t, t += step) {
		if (starsVisible(t, latDeg, lonDeg, stars, p)) {
			let lo = prev, hi = t;
			while (hi - lo > 5000) { const m = (lo + hi) / 2; if (starsVisible(m, latDeg, lonDeg, stars, p)) hi = m; else lo = m; }
			return { ms: hi, reached: true };
		}
	}
	return { ms: stop, reached: false };
}

/**
 * Nightfall at the day's haze minus nightfall at a reference haze (ms; positive = later), everything else
 * equal. 0 when the two hazes are equal or the Sun doesn't set.
 * @param {{year:number, month:number, day:number}} date @param {number} latDeg @param {number} lonDeg
 * @param {{ aod: number, aodRef: number, blpCdM2?: number | null, elevationM?: number, stars?: StarClass,
 *           together?: boolean, nearDeg?: number }} options
 */
export function hazeDelayMs(date, latDeg, lonDeg, options) {
	if (!(Number.isFinite(options.aod) && Number.isFinite(options.aodRef)) || options.aod === options.aodRef) return 0;
	const a = starNightfall(date, latDeg, lonDeg, { ...options, aod: options.aod });
	const b = starNightfall(date, latDeg, lonDeg, { ...options, aod: options.aodRef });
	const d = a.ms - b.ms;
	return Number.isFinite(d) ? d : 0;
}

// ------------------------------------------------------------------------------------------------
// Haze data for a place (filled by open-meteo-haze.js; plain JSON, safe to post to workers)
// ------------------------------------------------------------------------------------------------
/**
 * @typedef {{ monthly: number[], reference: number, evenings: Record<string, number>, blpCdM2: number | null,
 *             forecastFetchedAt: number | null, normalsRange: [string, string], source: string,
 *             forecastSource?: string, aodScale?: number }} HazeData
 *   monthly: average evening aerosol optical depth (550 nm), January..December. reference: the place's
 *   year-round average (mean of the months): the "average sky". evenings: forecast evening values by ISO
 *   date. blpCdM2: light pollution (the refraction server's blpCdM2), null if unknown. forecastSource:
 *   'cams' (Open-Meteo) or 'gefs' (NOAA GEFS-Aerosols, the fallback). aodScale: the refraction server's
 *   AERONET calibration of CAMS for the place (/v1/haze-calibration; 1 or absent = none); it multiplies the
 *   CAMS values (monthly, reference and CAMS forecasts), not a GEFS forecast.
 */

const MID_MONTH_DOY = [15.5, 45, 74.5, 105, 135.5, 166, 196.5, 227.5, 258, 288.5, 319, 349.5];

/**
 * The evening aerosol optical depth for a date: the forecast's when it has the date, else the month's
 * average (interpolated between mid-months), plus the reference to compare it with.
 * @param {HazeData} haze @param {{year:number, month:number, day:number}} date
 * @returns {{ aod: number, aodRef: number, forecast: boolean }}
 */
export function hazeOn(haze, date) {
	const iso = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
	const scale = Number.isFinite(haze.aodScale) && /** @type {number} */ (haze.aodScale) > 0 ? /** @type {number} */ (haze.aodScale) : 1;
	const aodRef = haze.reference * scale;
	const f = haze.evenings?.[iso];
	if (Number.isFinite(f)) return { aod: haze.forecastSource === 'gefs' ? f : f * scale, aodRef, forecast: true };
	const doy = (Date.UTC(date.year, date.month - 1, date.day) - Date.UTC(date.year, 0, 1)) / 86400000 + 1;
	const m = haze.monthly, d = doy < MID_MONTH_DOY[0] ? doy + 365 : doy;
	let aod = m[0];
	for (let i = 0; i < 12; i++) {
		const a = MID_MONTH_DOY[i], b = i < 11 ? MID_MONTH_DOY[i + 1] : MID_MONTH_DOY[0] + 365;
		if (d >= a && d <= b) { aod = m[i] + (m[(i + 1) % 12] - m[i]) * (d - a) / (b - a); break; }
	}
	return { aod: aod * scale, aodRef, forecast: false };
}

// ------------------------------------------------------------------------------------------------
// Data
// ------------------------------------------------------------------------------------------------
const TW_ALT = [0.0, 20.0, 40.0, 60.0, 80.0, 90.0];
const TW_DAZ = [0.0, 22.5, 45.0, 90.0, 135.0, 180.0];
const TW_SUN = [-15.0, -12.0, -9.0, -6.0, -3.0, 0.0, 3.0, 5.0];
/** log10 of twilight sky luminance (cd/m^2), [altitude][azimuth from the Sun][solar altitude] */
const TW_LOG_B = [
	[[-2.6029, -1.7205, -0.3894, 0.9660, 2.3038, 4.5134, 4.5134, 4.0363], [-2.7604, -1.8494, -0.5089, 0.8428, 2.1904, 3.0299, 3.5419, 3.7571], [-2.9646, -1.3368, -0.7208, 0.6490, 2.0453, 2.8217, 3.2332, 3.3880], [-3.1863, -2.4134, -1.2479, 0.1496, 1.7215, 2.5867, 2.9532, 3.0976], [-3.2397, -2.5571, -1.4319, -0.0397, 1.5403, 2.5861, 3.0573, 3.2404], [-3.2077, -2.5402, -1.4319, -0.0397, 1.3791, 2.6382, 3.1155, 3.3036]],   // altitude 0
	[[-2.5091, -1.6269, -0.3780, 1.0839, 2.4771, 3.4241, 3.9399, 4.1561], [-2.5392, -1.7183, -0.4247, 1.0646, 2.4315, 3.2821, 3.7727, 3.9591], [-2.6453, -1.8858, -0.6244, 0.8240, 2.3050, 3.1067, 3.5597, 3.6884], [-2.7674, -1.3423, -0.9846, 0.3543, 2.0427, 2.9268, 3.2865, 3.3606], [-2.8470, -2.2191, -1.0841, 0.2763, 1.8762, 2.9353, 3.3761, 3.5332], [-2.8060, -2.1859, -1.1173, 0.2805, 1.8586, 2.9921, 3.4337, 3.5823]],   // altitude 20
	[[-2.5364, -1.8440, -0.6795, 0.8526, 2.3398, 3.2569, 3.7030, 3.8850], [-2.1945, -1.8790, -0.7070, 0.8263, 2.3041, 3.2102, 3.6390, 3.8013], [-2.5728, -1.9797, -0.8114, 0.6721, 2.2373, 3.1138, 3.5192, 3.6564], [-2.6185, -2.1062, -0.9672, 0.4801, 2.0968, 2.9858, 3.3413, 3.4245], [-2.7056, -2.1443, -1.0148, 0.4327, 2.0679, 3.0036, 3.4145, 3.5408], [-2.6772, -2.1372, -1.0364, 0.4220, 2.1144, 3.0534, 3.4463, 3.5716]],   // altitude 40
	[[-2.5611, -2.0012, -0.8839, 0.6440, 2.1923, 3.0892, 3.5314, 3.6817], [-2.2275, -2.0126, -0.9218, 0.6146, 2.1613, 3.0620, 3.4638, 3.6160], [-2.5834, -2.0552, -0.9523, 0.5335, 2.1289, 3.0272, 3.3949, 3.5190], [-2.6193, -2.1380, -1.0209, 0.4572, 2.0770, 2.9693, 3.3307, 3.4340], [-2.6601, -2.1787, -1.0576, 0.4492, 2.0703, 2.9701, 3.3749, 3.4957], [-2.6533, -2.1615, -1.0516, 0.4436, 2.0843, 3.0120, 3.3887, 3.5121]],   // altitude 60
	[[-2.6114, -2.0869, -1.0350, 0.5162, 2.0976, 2.9682, 3.3835, 3.5149], [-2.6156, -2.0936, -1.0510, 0.5079, 2.0760, 2.9625, 3.3541, 3.4841], [-2.6269, -2.1127, -1.0643, 0.4781, 2.0531, 2.9565, 3.3320, 3.4516], [-2.6366, -2.1420, -1.0789, 0.4314, 2.0333, 2.9439, 3.3121, 3.4372], [-2.6574, -2.1760, -1.0984, 0.4314, 2.0333, 2.9371, 3.3313, 3.4584], [-2.6611, -2.1662, -1.0826, 0.4314, 2.0333, 2.9565, 3.3340, 3.4658]],   // altitude 80
	[[-2.6693, -2.1417, -1.0952, 0.4498, 2.0297, 2.9179, 3.3111, 3.4427], [-2.6693, -2.1417, -1.0952, 0.4498, 2.0297, 2.9179, 3.3111, 3.4427], [-2.6693, -2.1417, -1.0952, 0.4498, 2.0297, 2.9179, 3.3111, 3.4427], [-2.6693, -2.1417, -1.0952, 0.4498, 2.0297, 2.9179, 3.3111, 3.4427], [-2.6693, -2.1417, -1.0952, 0.4498, 2.0297, 2.9179, 3.3111, 3.4427], [-2.6693, -2.1417, -1.0952, 0.4498, 2.0297, 2.9179, 3.3111, 3.4427]],   // altitude 90
];
/** Yale Bright Star Catalog (5th ed.), V 2.0-4.0: [RA J2000 deg, Dec J2000 deg, V mag] */
const STARS = [
	[31.7933, 23.4625, 2.0], [239.8758, 25.9203, 2.0], [37.9529, 89.2642, 2.02], [283.8163, -26.2967, 2.02], [10.8975, -17.9867, 2.04], [85.1896, -1.9428, 2.05],
	[2.0971, 29.0906, 2.06], [17.4329, 35.6206, 2.06], [86.9392, -9.6697, 2.06], [211.6708, -36.37, 2.06], [222.6763, 74.1556, 2.08], [263.7337, 12.56, 2.08],
	[340.6671, -46.8847, 2.1], [47.0421, 40.9556, 2.12], [177.265, 14.5719, 2.14], [190.3792, -48.9597, 2.17], [305.5571, 40.2567, 2.2], [136.9992, -43.4325, 2.21],
	[10.1271, 56.5372, 2.23], [83.0017, -0.2992, 2.23], [233.6721, 26.7147, 2.23], [269.1517, 51.4889, 2.23], [120.8963, -40.0033, 2.25], [139.2725, -59.2753, 2.25],
	[30.975, 42.3297, 2.26], [2.2946, 59.1497, 2.27], [200.9812, 54.9253, 2.27], [252.5408, -34.2933, 2.29], [204.9717, -53.4664, 2.3], [220.4825, -47.3883, 2.3],
	[218.8767, -42.1578, 2.31], [240.0833, -22.6217, 2.32], [165.4604, 56.3825, 2.37], [6.5708, -42.3061, 2.39], [326.0467, 9.875, 2.39], [265.6221, -39.03, 2.41],
	[345.9438, 28.0828, 2.42], [257.5946, -15.7247, 2.43], [178.4575, 53.6947, 2.44], [319.645, 62.5856, 2.44], [111.0238, -29.3031, 2.45], [311.5529, 33.9703, 2.46],
	[14.1771, 60.7167, 2.47], [346.1904, 15.2053, 2.49], [140.5283, -55.0108, 2.5], [45.57, 4.0897, 2.53], [208.885, -47.2883, 2.55], [168.5271, 20.5236, 2.56],
	[249.2896, -10.5672, 2.56], [83.1825, -17.8222, 2.58], [183.9517, -17.5419, 2.59], [182.0896, -50.7225, 2.6], [285.6529, -29.8803, 2.6], [154.9929, 19.8417, 2.61],
	[229.2517, -9.3831, 2.61], [89.9304, 37.2125, 2.62], [241.3592, -19.8056, 2.62], [28.66, 20.8081, 2.64], [84.9121, -34.0742, 2.64], [188.5967, -23.3967, 2.65],
	[236.0671, 6.4256, 2.65], [21.4542, 60.2353, 2.68], [208.6713, 18.3978, 2.68], [224.6329, -43.1339, 2.68], [74.2483, 33.1661, 2.69], [161.6925, -49.42, 2.69],
	[189.2958, -69.1356, 2.69], [262.6908, -37.2958, 2.69], [109.2858, -37.0975, 2.7], [221.2467, 27.0742, 2.7], [275.2487, -29.8281, 2.7], [296.565, 10.6133, 2.72],
	[243.5863, -3.6944, 2.74], [245.9979, 61.5142, 2.74], [200.1492, -36.7122, 2.75], [222.7196, -16.0417, 2.75], [160.7392, -64.3944, 2.76], [83.8583, -5.91, 2.77],
	[247.555, 21.4897, 2.77], [265.8683, 4.5672, 2.77], [233.7854, -41.1669, 2.78], [76.9625, -5.0864, 2.79], [262.6083, 52.3014, 2.79], [6.4379, -77.2542, 2.8],
	[183.7862, -58.7489, 2.8], [121.8858, -24.3042, 2.81], [250.3217, 31.6031, 2.81], [276.9925, -25.4217, 2.81], [248.9708, -28.2161, 2.82], [3.3092, 15.1836, 2.83],
	[195.5442, 10.9592, 2.83], [82.0613, -20.7594, 2.84], [58.5329, 31.8836, 2.85], [238.7854, -63.4306, 2.85], [261.325, -55.53, 2.85], [29.6925, -61.5697, 2.86],
	[334.6254, -60.2597, 2.86], [56.8713, 24.105, 2.87], [296.2437, 45.1308, 2.87], [326.76, -16.1272, 2.87], [95.74, 22.5136, 2.88], [113.65, 31.8886, 2.88],
	[59.4633, 40.0103, 2.89], [229.7275, -68.6794, 2.89], [239.7129, -26.1142, 2.89], [245.2971, -25.5928, 2.89], [287.4408, -21.0236, 2.89], [111.7875, 8.2894, 2.9],
	[194.0071, 38.3183, 2.9], [322.8896, -5.5711, 2.91], [46.1992, 53.5064, 2.93], [102.4842, -50.6147, 2.93], [340.7504, 30.2214, 2.94], [59.5075, -13.5086, 2.95],
	[187.4663, -16.5156, 2.95], [262.9604, -49.8761, 2.95], [331.4458, -0.3197, 2.96], [100.9829, 25.1311, 2.98], [146.4629, 23.7742, 2.98], [75.4921, 43.8233, 2.99],
	[271.4521, -30.4242, 2.99], [286.3525, 13.8633, 2.99], [32.3858, 34.9872, 3.0], [84.4113, 21.1425, 3.0], [182.5312, -22.6197, 3.0], [199.7304, -23.1717, 3.0],
	[55.7313, 47.7875, 3.01], [146.7754, -65.0719, 3.01], [167.4158, 44.4986, 3.01], [328.4821, -37.365, 3.01], [95.0783, -30.0633, 3.02], [105.7562, -23.8333, 3.02],
	[218.0196, 38.3083, 3.03], [266.8963, -40.1269, 3.03], [34.8362, -2.9775, 3.04], [207.4042, -42.4739, 3.04], [155.5821, 41.4994, 3.05], [191.5704, -68.1081, 3.05],
	[230.1821, 71.8339, 3.05], [288.1388, 67.6617, 3.07], [252.9675, -38.0475, 3.08], [292.6804, 27.9597, 3.08], [305.2529, -14.7814, 3.08], [133.8483, 5.9456, 3.11],
	[162.4062, -16.1936, 3.11], [274.4067, -36.7617, 3.11], [309.3917, -47.2914, 3.11], [87.74, -35.7683, 3.12], [140.2637, 34.3925, 3.13], [142.8054, -57.0344, 3.13],
	[173.945, -63.0197, 3.13], [224.7904, -42.1042, 3.13], [254.655, -55.9903, 3.13], [134.8017, 48.0417, 3.14], [258.7579, 24.8392, 3.14], [258.7617, 36.8092, 3.16],
	[76.6287, 41.2344, 3.17], [99.4404, -43.1961, 3.17], [143.2142, 51.6772, 3.17], [257.1967, 65.7147, 3.17], [281.4142, -26.9908, 3.17], [72.46, 6.9614, 3.19],
	[76.3654, -22.3711, 3.19], [220.6267, -64.9753, 3.19], [254.4171, 9.375, 3.2], [318.2342, 30.2269, 3.2], [267.4646, -37.0433, 3.21], [354.8367, 77.6325, 3.21],
	[230.3429, -40.6475, 3.22], [302.8263, -0.8214, 3.23], [322.165, 70.5608, 3.23], [44.5654, -40.3047, 3.24], [56.8096, -74.2389, 3.24], [244.5804, -4.6925, 3.24],
	[284.7358, 32.6894, 3.24], [112.3075, -43.3014, 3.25], [275.3275, -2.8989, 3.26], [9.8321, 30.8608, 3.27], [68.4992, -55.045, 3.27], [102.0475, -61.9414, 3.27],
	[211.5929, -26.6825, 3.27], [260.5025, -24.9994, 3.27], [343.6625, -15.8208, 3.27], [93.7192, 22.5067, 3.28], [226.0175, -25.2819, 3.29], [231.2325, 58.9661, 3.29],
	[16.5208, -46.7186, 3.31], [78.2329, -16.2056, 3.31], [183.8567, 57.0325, 3.31], [153.4342, -70.0381, 3.32], [158.0058, -61.6853, 3.32], [286.735, -27.6706, 3.32],
	[258.0383, -43.2392, 3.33], [117.3237, -24.8597, 3.34], [168.56, 15.4294, 3.34], [261.3483, -56.3775, 3.34], [269.7567, -9.7736, 3.34], [63.6062, -62.4739, 3.35],
	[332.7138, 58.2011, 3.35], [81.1192, -2.3969, 3.36], [101.3225, 12.8956, 3.36], [127.5662, 60.7181, 3.36], [291.3746, 3.1147, 3.36], [203.6733, -0.5958, 3.37],
	[230.6704, -44.6894, 3.37], [28.5987, 63.67, 3.38], [131.6942, 6.4189, 3.38], [193.9008, 3.3975, 3.38], [46.2942, 38.8403, 3.39], [67.1654, 15.8708, 3.4],
	[154.2708, -61.3322, 3.4], [340.3654, 10.8314, 3.4], [22.0913, -43.3183, 3.41], [28.2704, 29.5789, 3.41], [207.3762, -41.6878, 3.41], [228.0712, -52.0992, 3.41],
	[240.0304, -38.3969, 3.41], [266.6146, 27.7206, 3.42], [311.2396, -66.2031, 3.42], [311.3225, 61.8389, 3.43], [12.275, 57.8158, 3.44], [137.7417, -58.9669, 3.44],
	[154.1725, 23.4172, 3.44], [286.5621, -4.8825, 3.44], [17.1475, -10.1822, 3.45], [154.2742, 42.9144, 3.45], [282.52, 33.3628, 3.45], [40.825, 3.2358, 3.47],
	[60.17, 12.4903, 3.47], [105.4296, -27.9347, 3.47], [119.1946, -52.9822, 3.47], [228.8758, 33.3147, 3.47], [299.6892, 19.4922, 3.47], [169.6196, 33.0942, 3.48],
	[258.6621, 14.3903, 3.48], [342.5008, 24.6017, 3.48], [342.1388, -51.3169, 3.49], [26.0171, -15.9375, 3.5], [225.4867, 40.3906, 3.5], [276.7433, -45.9683, 3.51],
	[284.4325, -21.1067, 3.51], [124.1288, 9.1856, 3.52], [145.2875, 9.8922, 3.52], [151.8333, 16.7628, 3.52], [342.42, 66.2006, 3.52], [67.1542, 19.1803, 3.53],
	[110.0308, 21.9822, 3.53], [237.405, -3.4303, 3.53], [250.7242, 38.9222, 3.53], [332.55, 6.1978, 3.53], [55.8121, -9.7633, 3.54], [83.7846, 9.9342, 3.54],
	[149.2158, -54.5678, 3.54], [173.2504, -31.8578, 3.54], [264.3967, -15.3986, 3.54], [86.7387, -14.8219, 3.55], [214.8508, -46.0578, 3.55], [4.8571, -8.8239, 3.56],
	[34.1275, -51.5122, 3.56], [64.4737, -33.7983, 3.56], [169.8354, -14.7786, 3.56], [230.4517, -36.2614, 3.56], [302.1817, -66.1819, 3.56], [24.4983, 48.6283, 3.57],
	[116.1117, 24.3981, 3.57], [253.0838, -38.0175, 3.57], [275.2642, 72.7328, 3.57], [304.5137, -12.5447, 3.57], [109.5233, 16.5403, 3.58], [217.9575, 30.3714, 3.58],
	[234.2562, -28.135, 3.58], [185.34, -60.4011, 3.59], [21.0058, -8.1833, 3.6], [51.2033, 9.0289, 3.6], [79.4017, -6.8444, 3.6], [86.1158, -22.4483, 3.6],
	[103.1971, 33.9611, 3.6], [135.9062, 47.1567, 3.6], [142.675, -40.4667, 3.6], [116.3137, -37.9686, 3.61], [152.6471, -12.3542, 3.61], [177.6738, 1.7647, 3.61],
	[22.8708, 15.3458, 3.62], [130.0733, -52.9219, 3.62], [195.5675, -71.5489, 3.62], [253.6458, -42.3614, 3.62], [262.7746, -60.6839, 3.62], [266.4333, -64.7239, 3.62],
	[345.4804, 42.3261, 3.62], [42.4958, 27.2606, 3.63], [57.2904, 24.0533, 3.63], [309.3875, 14.5953, 3.63], [176.4017, -66.7286, 3.64], [64.9483, 15.6275, 3.65],
	[190.415, -1.4494, 3.65], [211.0971, 64.3758, 3.65], [313.7025, -58.4542, 3.65], [9.2429, 53.8969, 3.66], [234.6642, -29.7778, 3.66], [271.6579, -50.0917, 3.66],
	[347.3617, -21.1725, 3.66], [142.8821, 63.0619, 3.67], [236.5471, 15.4219, 3.67], [130.8979, -33.1864, 3.68], [190.415, -1.4494, 3.68], [231.9571, 29.1058, 3.68],
	[325.0229, -16.6622, 3.68], [49.8792, -21.7578, 3.69], [72.8017, 5.605, 3.69], [146.3117, -62.5078, 3.69], [349.2912, 3.2822, 3.69], [28.9896, -51.6089, 3.7],
	[56.2188, 24.1133, 3.7], [269.4412, 29.2478, 3.7], [89.1013, -14.1678, 3.71], [176.5125, 47.7794, 3.71], [237.7042, 4.4778, 3.71], [298.8283, 6.4067, 3.71],
	[73.5629, 2.4406, 3.72], [89.8817, 54.2847, 3.72], [221.5621, 1.8928, 3.72], [316.2329, 43.9278, 3.72], [318.6979, 38.0456, 3.72], [27.865, -10.335, 3.73],
	[53.2325, -9.4583, 3.73], [118.0542, -40.5758, 3.73], [271.8375, 9.5639, 3.73], [51.7925, 9.7328, 3.74], [321.6667, -22.4114, 3.74], [343.1538, -7.5797, 3.74],
	[75.6196, 41.0758, 3.75], [136.0387, -47.0978, 3.75], [245.48, 19.1531, 3.75], [266.9733, 2.7072, 3.75], [268.3821, 56.8728, 3.75], [337.2929, 58.4153, 3.75],
	[42.6742, 55.8956, 3.76], [65.7338, 17.5425, 3.76], [83.4062, -62.4897, 3.76], [252.4463, -59.0414, 3.76], [325.3687, -77.39, 3.76], [331.7529, 25.345, 3.76],
	[56.2983, 42.5786, 3.77], [126.4342, -66.1369, 3.77], [286.1708, -21.7417, 3.77], [289.2758, 53.3686, 3.77], [309.9096, 15.9119, 3.77], [311.9192, -9.4958, 3.77],
	[337.8229, 50.2825, 3.77], [107.1871, -70.4989, 3.78], [163.3733, -58.8533, 3.78], [106.0271, 20.5703, 3.79], [111.4317, 27.7981, 3.79], [292.4262, 51.7297, 3.79],
	[303.4079, 46.7414, 3.79], [47.3742, 44.8572, 3.8], [147.7475, 59.0386, 3.8], [154.9942, 19.8406, 3.8], [233.7004, 10.5375, 3.8], [233.7004, 10.5392, 3.8],
	[264.8662, 46.0064, 3.8], [84.6867, -2.6, 3.81], [87.8304, -20.8792, 3.81], [156.5225, -16.8364, 3.81], [68.8875, -30.5622, 3.82], [139.7113, 36.8025, 3.82],
	[156.9696, -58.7394, 3.82], [247.7283, 1.9839, 3.82], [296.8471, 18.5342, 3.82], [354.3913, 46.4581, 3.82], [56.0796, 32.2883, 3.83], [163.3279, 34.215, 3.83],
	[209.5679, -42.1008, 3.83], [221.965, -79.0447, 3.83], [271.8858, 28.7625, 3.83], [297.0433, 70.2678, 3.83], [67.1438, 15.9622, 3.84], [130.1567, -46.6489, 3.84],
	[133.7617, -60.6447, 3.84], [159.3254, -48.2258, 3.84], [172.8508, 69.3311, 3.84], [235.6858, 26.2956, 3.84], [275.9246, 21.7697, 3.84], [335.4142, -1.3872, 3.84],
	[56.05, -64.8069, 3.85], [86.8212, -51.0664, 3.85], [95.5283, -33.4364, 3.85], [108.7029, -26.7728, 3.85], [153.6842, -42.1219, 3.85], [158.2029, 9.3067, 3.85],
	[239.1133, 15.6617, 3.85], [243.8596, -63.6856, 3.85], [278.8017, -8.2442, 3.85], [63.5004, -42.2944, 3.86], [189.4258, -48.5411, 3.86], [269.0633, 37.2506, 3.86],
	[273.4408, -21.0589, 3.86], [14.1883, 38.4994, 3.87], [48.0179, -28.9869, 3.87], [56.4567, 24.3678, 3.87], [69.545, -14.3039, 3.87], [82.8029, -35.4706, 3.87],
	[103.5329, -24.1839, 3.87], [188.1167, -72.1331, 3.87], [188.3708, 69.7883, 3.87], [209.67, -44.8036, 3.87], [227.9838, -48.7378, 3.87], [2.3529, -45.7475, 3.88],
	[138.5912, 2.3142, 3.88], [148.1908, 26.0069, 3.88], [202.7613, -39.4075, 3.88], [220.765, -5.6583, 3.88], [239.2212, -29.2142, 3.88], [44.1071, -8.8981, 3.89],
	[170.2517, -54.4911, 3.89], [184.9767, -0.6669, 3.89], [244.935, 46.3133, 3.89], [248.3625, -78.8972, 3.89], [299.0767, 35.0833, 3.89], [126.415, -3.9064, 3.9],
	[298.1183, 1.0056, 3.9], [347.59, -45.2467, 3.9], [60.7892, 5.9892, 3.91], [131.5071, -46.0417, 3.91], [144.9642, -1.1428, 3.91], [167.1475, -58.975, 3.91],
	[187.01, -50.2306, 3.91], [233.8817, -14.7894, 3.91], [17.0963, -55.2458, 3.92], [255.0725, 30.9264, 3.92], [318.9558, 5.2478, 3.92], [69.0796, -3.3525, 3.93],
	[115.3117, -9.5511, 3.93], [290.4183, -17.8472, 3.93], [6.5508, -43.68, 3.94], [131.1712, 18.1542, 3.94], [170.9812, 10.5292, 3.94], [314.2933, 41.1672, 3.94],
	[22.8129, -49.0728, 3.95], [43.5646, 52.7625, 3.95], [99.1708, -19.2558, 3.95], [115.455, -72.6061, 3.95], [200.985, 54.9217, 3.95], [237.7396, -33.6272, 3.95],
	[341.6329, 23.5656, 3.95], [66.0092, -34.0169, 3.96], [89.7867, -42.8153, 3.96], [102.4604, -32.5086, 3.96], [115.9521, -28.9547, 3.96], [182.9129, -52.3686, 3.96],
	[241.7017, -20.6692, 3.96], [300.1479, -72.9106, 3.96], [87.8725, 39.1486, 3.97], [130.0258, -35.3083, 3.97], [135.16, 41.7828, 3.97], [137.8192, -62.3172, 3.97],
	[270.1612, 2.9317, 3.97], [290.9717, -40.6161, 3.97], [337.3175, -43.4956, 3.97], [350.7425, -20.1006, 3.97], [30.8587, 72.4214, 3.98], [93.7137, -6.2747, 3.98],
	[109.2075, -67.9572, 3.98], [303.8679, 47.7144, 3.98], [349.3575, -58.2358, 3.99], [30.0013, -21.0778, 4.0], [43.4704, -49.8903, 4.0], [135.6117, -66.3961, 4.0],
	[156.0987, -74.0317, 4.0], [220.49, -37.7936, 4.0],
];
