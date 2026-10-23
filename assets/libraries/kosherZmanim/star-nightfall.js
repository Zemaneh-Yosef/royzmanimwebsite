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
 *             halakhic_calc), scaled by (1 - 10^(-0.4 k X)) for the air the line of sight crosses (k of the
 *             sky's haze, skyAod: see "How sure"); plus the artificial sky (light pollution, Blp) and the
 *             natural night sky (1.7e-4 cd/m^2)
 *   threshold the faintest point source the eye sees against that sky (Crumey 2014), raised by the
 *             star's extinction 10^(0.4 k X), with halakhic_calc's 1 magnitude margin
 *   extinction k = 0.1066 x P / 1013.25 (Rayleigh: halakhic_calc's 0.1066 is Schaefer's Rayleigh term alone,
 *             though calc_time.py labels it Rayleigh and ozone; P the standard pressure at the observer's
 *             height) + 0.031 (ozone's Chappuis band at V, Schaefer 1992) + 1.086 x aerosol optical depth
 *             (550 nm). Minnaert (sec. 46) measured k = 0.21-0.23 on very clear nights: this at AOD ~0.1
 *   airmass   X = (1 - (cos(alt) / (1 + h / R))^2)^-1/2 at the apparent (refracted) altitude, stars
 *             above 10 degrees only
 *   stars     Yale Bright Star Catalog: medium = V 2.0-3.0, small = V 3.0-4.0 (halakhic_calc's classes);
 *             apparent places of the date (proper motion, IAU 2006 precession, IAU 2000B nutation, aberration)
 *   sun       ROYSPACalculator's apparent place (0.08" against JPL's DE421), lowered by the solar parallax
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
 * Those checks predate the gas term's ozone and pressure (October 2026): at a given aerosol optical depth
 * they put nightfall 0.4-1 min later than calc_time.py; its default sky (defaultAod) gives the same times.
 *
 * Haze delay (hazeDelay / hazeDelayMs): nightfall at a day's haze minus nightfall at a reference haze (e.g.
 * the place's long-run average), same sky otherwise. Added to a time defined for average conditions (such
 * as Tzet Shabbat by degrees), it makes hazier evenings later and clearer ones earlier. Where the stars do
 * not appear before the Sun is 18 degrees down the model has no time, only a bound: hazeDelay says so
 * (status 'at-least' / 'at-most' / 'unresolved') rather than passing the 18-degree moment off as nightfall,
 * and the caller chooses its own fallback.
 *
 * Options added for absolute nightfall times (handasi-hazeman), both off by default so the haze delay above
 * is unchanged:
 *  - marginMag: the safety margin on the threshold magnitude (halakhic_calc's 1.0). A smaller margin counts
 *    a star as seen sooner, so nightfall comes earlier.
 *  - moon: the Moon's position and phase per instant (moonFromAstronomy() builds one); its glare and the sky
 *    glow it scatters are added to every star's sky as calc_time.py does (Krisciunas & Schaefer 1991 scattering,
 *    glare in the eye and in the air near the Moon), only while the Moon is above the horizon.
 * defaultAod(elevationM) gives the aerosol optical depth that matches halakhic_calc's fixed extinction
 * 0.1066 + 0.12 e^(-h/1500): the "default sky" with nothing local about it.
 *
 * How sure: the extinction of starlight by haze is plain physics (Beer-Lambert). The brightening of the
 * twilight sky by haze - calc_time.py's (1 - 10^(-0.4 k X)) with the day's k - is not: it treats haze as lit
 * by the Sun, but from ~4 degrees down the low haze is in the Earth's shadow and the light it would scatter
 * comes from tens of km up (Rozenberg, Twilight, pp. 184, 207, 258), and twilight brightness away from the
 * horizon is observed to be "virtually independent" of the weather at the station (p. 25). With the day's
 * haze in the sky term too, Jerusalem's delay for AOD 0.1 -> 0.4 was 7-8 minutes; with the sky held at the
 * reference haze (skyAod, as hazeDelay does) it is ~4 minutes, and haze that also dimmed the sunlit high sky
 * would make it ~2.5; Rozenberg's own estimate was 4-5. So the haze delay keeps the sky at the reference haze
 * and lets the day's haze dim only the stars. That is an interim choice, not a measured result: haze also
 * scatters the glow from above, and only a spherical multiple-scattering calculation or timed observations
 * on hazy evenings can settle how much. Absolute times (starNightfall without skyAod) are unchanged.
 */

import ROYSPACalculator from './royzmanim-spa-corrections.js';
import { nutation } from './nutation.js';
import { deltaT } from './delta-t.js';

const DEG = Math.PI / 180;
/** Rayleigh extinction at V, sea level (Schaefer's; halakhic_calc's whole gas term) */
const RAYLEIGH_K = 0.1066;
/** ozone (Chappuis band) at V, magnitudes per airmass (Schaefer 1992's 0.031 average) */
const OZONE_K = 0.031;
const AOD_TO_K = 2.5 * Math.LOG10E;            // magnitudes per unit optical depth (1.0857)
const NATURAL_SKY_CDM2 = 1.7e-4;
const MIN_ALT_DEG = 10;
const EARTH_R_M = 6371000;

/** @typedef {'medium' | 'small'} StarClass */
/**
 * @typedef {(ms: number) => { raDeg: number, decDeg: number, phaseAngleDeg: number } | null} MoonSource
 *   the Moon's topocentric right ascension / declination of date (deg) and phase angle (deg) at an instant
 */
/**
 * @typedef {{ aod: number, skyAod?: number, blpCdM2?: number | null, stars?: StarClass, together?: boolean,
 *             nearDeg?: number, elevationM?: number, marginMag?: number, moon?: MoonSource | null }} NightfallOptions
 *   aod: aerosol optical depth at 550 nm. skyAod: the one the twilight sky's brightness is figured with
 *   (default aod; see "How sure" above). blpCdM2: light pollution, cd/m^2 (the server's blpCdM2; 0 / null =
 *   none). stars: 'medium' (default) or 'small'. together: three within nearDeg (default: true for small
 *   stars, false for medium). elevationM: observer's height (airmass only; default 0). marginMag: threshold
 *   margin in magnitudes (default 1.0, halakhic_calc's). moon: include the Moon's light (default: none).
 */

/** Julian day of an epoch-ms instant @param {number} ms */
const jdOf = ms => ms / 86400000 + 2440587.5;

/** SPACalculator's solarCoords is TypeScript-private, hence the cast */
const SUN = /** @type {any} */ (new ROYSPACalculator());
let sunJd = NaN, sunCoords = [0, 0, 0, 0, 1, 0];
/**
 * The Sun's apparent place of date.
 * @param {number} jd UT Julian day
 * @returns {number[]} [RA, Dec, true obliquity, Greenwich apparent sidereal time (deg), distance (AU), apparent longitude (deg)]
 */
function sunAt(jd) {
	if (jd !== sunJd) { sunCoords = SUN.solarCoords(jd); sunJd = jd; }
	return sunCoords;
}

/** Local apparent sidereal time (deg) @param {number[]} sun sunAt() @param {number} lonDeg */
function lst(sun, lonDeg) {
	return ((sun[3] + lonDeg) % 360 + 360) % 360;
}

/**
 * Topocentric altitude and azimuth (deg) of the Sun's centre: the geocentric place lowered by the parallax.
 * @param {number} jd @param {number} latDeg @param {number} lonDeg @returns {[number, number]}
 */
function sunHorizontal(jd, latDeg, lonDeg) {
	const sun = sunAt(jd);
	const [alt, az] = altAz(sun[0], sun[1], lst(sun, lonDeg), latDeg);
	return [alt - 8.794 / 3600 / sun[4] * Math.cos(alt * DEG), az];
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

/** @param {number[][]} m @param {number[]} v */
const apply = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
/** @param {number[][]} a @param {number[][]} b */
const mul = (a, b) => a.map(r => [0, 1, 2].map(j => r[0] * b[0][j] + r[1] * b[1][j] + r[2] * b[2][j]));
/** frame rotations about x, y, z (SOFA's Rx, Ry, Rz) @param {number} a radians */
const rotX = a => [[1, 0, 0], [0, Math.cos(a), Math.sin(a)], [0, -Math.sin(a), Math.cos(a)]];
const rotY = (/** @type {number} */ a) => [[Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], [Math.sin(a), 0, Math.cos(a)]];
const rotZ = (/** @type {number} */ a) => [[Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
const ARCSEC = DEG / 3600;

/**
 * Apparent places of date of J2000 catalogue stars: proper motion, IAU 2006 precession (Capitaine et al.
 * 2003), IAU 2000B nutation, and annual aberration with the eccentricity of the Earth's orbit (Meeus ch. 23).
 * Left out: annual parallax (under 0.1" for these stars) and the Sun's light bending (under 0.03" at the
 * 15 degrees or more that twilight stars stand from it).
 * @param {number[][]} stars [ra, dec, mag, pmRa cos dec, pmDec] @param {number} jd UT Julian day
 * @returns {[number, number, number][]} [ra, dec, mag]
 */
function apparentStars(stars, jd) {
	const t = (jd + deltaT(jd) / 86400 - 2451545) / 36525, years = 100 * t;
	const zeta = (2.650545 + t * (2306.083227 + t * (0.2988499 + t * (0.01801828 + t * (-0.000005971 - t * 0.0000003173))))) * ARCSEC;
	const z = (-2.650545 + t * (2306.077181 + t * (1.0927348 + t * (0.01826837 + t * (-0.000028596 - t * 0.0000002904))))) * ARCSEC;
	const theta = t * (2004.191903 + t * (-0.4294934 + t * (-0.04182264 + t * (-0.000007089 - t * 0.0000001274)))) * ARCSEC;
	const [dpsi, deps] = nutation(t);
	const sun = sunAt(jd), eps = sun[2] * DEG;
	// J2000 mean -> mean of date -> true of date
	const m = mul(mul(rotX(-eps), mul(rotZ(-dpsi * ARCSEC), rotX(eps - deps * ARCSEC))), mul(rotZ(-z), mul(rotY(theta), rotZ(-zeta))));
	// the Earth's velocity over c, ecliptic of date: toward the Sun's true longitude less 90 deg, and the
	// eccentricity term toward the perihelion's
	const kappa = 20.49552 * ARCSEC, e = 0.016708634 - 0.000042037 * t, pi = (102.93735 + 1.71946 * t) * DEG;
	const lon = (sun[5] + (20.4898 / sun[4] - dpsi) / 3600) * DEG;
	const vx = kappa * (Math.sin(lon) - e * Math.sin(pi)), vy = -kappa * (Math.cos(lon) - e * Math.cos(pi));
	const v = [vx, vy * Math.cos(eps), vy * Math.sin(eps)];
	return stars.map(([ra, dec, mag, pmRa, pmDec]) => {
		const d = (dec + pmDec * years / 3600) * DEG, a = (ra + pmRa * years / 3600 / Math.cos(dec * DEG)) * DEG;
		const u = apply(m, [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]).map((x, i) => x + v[i]);
		const n = Math.hypot(u[0], u[1], u[2]);
		return [((Math.atan2(u[1], u[0]) / DEG) % 360 + 360) % 360, Math.asin(u[2] / n) / DEG, mag];
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

/**
 * Extinction (magnitudes per airmass) of the air's gases at a height: Rayleigh scaled by the standard
 * pressure there, plus ozone.
 * @param {number} elevationM
 */
function gasExtinction(elevationM) {
	return RAYLEIGH_K * Math.pow(1 - 0.0065 * Math.max(0, elevationM) / 288.15, 5.25588) + OZONE_K;
}

/** @param {number} altDeg @param {number} elevationM */
function airmass(altDeg, elevationM) {
	const s = Math.cos(altDeg * DEG) / (1 + elevationM / EARTH_R_M);
	return 1 / Math.sqrt(1 - s * s);
}

/**
 * Aerosol optical depth that, with the gases (gasExtinction), gives halakhic_calc's default extinction
 * k = 0.1066 + 0.12 e^(-h / 1500) at the observer's height.
 * @param {number} [elevationM]
 */
export function defaultAod(elevationM = 0) {
	const h = Math.max(0, elevationM);
	return Math.max(0, RAYLEIGH_K + 0.12 * Math.exp(-h / 1500) - gasExtinction(h)) / AOD_TO_K;
}

/**
 * A MoonSource from astronomy-engine (the mooncalc bundle's AstronomyImp).
 * @param {any} Astronomy astronomy-engine namespace @param {number} latDeg @param {number} lonDeg
 * @param {number} [elevationM] @returns {MoonSource}
 */
export function moonFromAstronomy(Astronomy, latDeg, lonDeg, elevationM = 0) {
	const observer = new Astronomy.Observer(latDeg, lonDeg, elevationM);
	return (ms) => {
		const date = new Date(ms);
		const eq = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true);
		const ill = Astronomy.Illumination(Astronomy.Body.Moon, date);
		return { raDeg: eq.ra * 15, decDeg: eq.dec, phaseAngleDeg: ill.phase_angle };
	};
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
 * @param {{ k: number, kSky: number, blp: number, elevationM: number, marginMag: number, moon: MoonSource | null }} p
 *   k: the day's extinction (stars, moonlight); kSky: the one the twilight sky's brightness is figured with
 * @returns {{ alt: number, az: number, mag: number, limit: number }[]}
 */
function skyAt(ms, latDeg, lonDeg, stars, p) {
	const jd = jdOf(ms), t = lst(sunAt(jd), lonDeg);
	const [sunAlt, sunAz] = sunHorizontal(jd, latDeg, lonDeg);
	// the Moon, as calc_time.py: magnitude from the phase angle, dimmed by its own airmass
	let moon = null;
	const m = p.moon ? p.moon(ms) : null;
	if (m) {
		const [mAlt, mAz] = altAz(m.raDeg, m.decDeg, t, latDeg);
		if (mAlt > 0) {
			const a = m.phaseAngleDeg;
			const mag = 0.026 * a + 4e-9 * Math.pow(a, 4) - 12.73;
			const Istar = Math.pow(10, -0.4 * (mag + 13.99));                 // lux, outside the air
			const I = Istar * Math.pow(10, -0.4 * p.k * airmass(mAlt, p.elevationM));
			moon = { pos: [mAlt, mAz], Istar, I };
		}
	}
	const out = [];
	for (const [ra, dec, mag] of stars) {
		const [trueAlt, az] = altAz(ra, dec, t, latDeg);
		// apparent altitude (Bennett 1982, standard air): stars are seen where refraction puts them
		const alt = trueAlt + 1 / Math.tan((trueAlt + 7.31 / (trueAlt + 4.4)) * DEG) / 60;
		if (alt <= MIN_ALT_DEG) continue;
		let dAz = Math.abs(az - sunAz);
		if (dAz > 180) dAz = 360 - dAz;
		const X = airmass(alt, p.elevationM);
		let B = twilightLuminance(alt, dAz, sunAlt) * (1 - Math.pow(10, -0.4 * p.kSky * X)) + p.blp + NATURAL_SKY_CDM2;
		if (moon) {
			const d = Math.max(separation(moon.pos, [alt, az]), 0.25); // deg; floored: no star sits on the Moon
			const ext = Math.pow(10, -0.4 * p.k * X);
			B += 3.183e-6 * 4.63e7 * moon.I / 10.76 / (d * d);                                       // glare in the eye
			if (d <= 5) B += 3.183e-6 * 6.25e7 * moon.Istar / 10.76 * (ext - ext * ext) / (d * d);  // glare in the air
			const cosd = Math.cos(d * DEG);
			const f = Math.pow(10, 5.36) * (1.06 + cosd * cosd) + Math.pow(10, 6.15 - d / 40) + 6.2e7 / (d * d);
			B += 3.183e-6 * f * (1 - ext) * moon.I / 10.76;                                            // scattered moonlight
		}
		const I = brightLimit(B) * Math.pow(10, 0.4 * p.k * X);
		out.push({ alt, az, mag, limit: -2.5 * Math.log10(I) - 13.99 - p.marginMag });
	}
	return out;
}

/**
 * Whether three stars are visible at an instant.
 * @param {number} ms epoch ms @param {number} latDeg @param {number} lonDeg
 * @param {[number, number, number][]} stars precessed [ra, dec, mag]
 * @param {{ k: number, kSky: number, blp: number, together: boolean, nearDeg: number, elevationM: number, marginMag: number, moon: MoonSource | null }} p
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
	return skyAt(ms, latDeg, lonDeg, starsFor(cls, ms), paramsOf(options));
}

/** @param {NightfallOptions} options */
function paramsOf(options) {
	const cls = options.stars ?? 'medium';
	const gas = gasExtinction(options.elevationM ?? 0);
	return {
		k: gas + AOD_TO_K * Math.max(0, options.aod),
		kSky: gas + AOD_TO_K * Math.max(0, Number.isFinite(options.skyAod) ? /** @type {number} */ (options.skyAod) : options.aod),
		blp: Math.max(0, options.blpCdM2 ?? 0),
		together: options.together ?? cls === 'small',
		nearDeg: options.nearDeg ?? 10,
		elevationM: Math.max(0, options.elevationM ?? 0),
		marginMag: Number.isFinite(options.marginMag) ? /** @type {number} */ (options.marginMag) : 1.0,
		moon: options.moon ?? null,
	};
}

/**
 * The Sun's topocentric altitude and azimuth (deg) at an instant, unrefracted.
 * @param {number} ms @param {number} latDeg @param {number} lonDeg @returns {[number, number]}
 */
export function sunAltAz(ms, latDeg, lonDeg) {
	return sunHorizontal(jdOf(ms), latDeg, lonDeg);
}

/**
 * Instant (epoch ms) the Sun's centre reaches altitude hDeg in the evening of a date, or NaN.
 * @param {{year:number, month:number, day:number}} date @param {number} latDeg @param {number} lonDeg @param {number} hDeg
 */
export function eveningSunAt(date, latDeg, lonDeg, hDeg) {
	const noon = Date.UTC(date.year, date.month - 1, date.day, 12) - lonDeg / 15 * 3600000;
	const alt = (/** @type {number} */ ms) => sunHorizontal(jdOf(ms), latDeg, lonDeg)[0];
	let lo = noon, hi = noon + 12 * 3600000;
	if (alt(lo) < hDeg || alt(hi) > hDeg) return NaN;
	for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (alt(m) > hDeg) lo = m; else hi = m; }
	return (lo + hi) / 2;
}

/**
 * Instant (epoch ms) the Sun's centre reaches altitude hDeg in the morning of a date, or NaN.
 * @param {{year:number, month:number, day:number}} date @param {number} latDeg @param {number} lonDeg @param {number} hDeg
 */
export function morningSunAt(date, latDeg, lonDeg, hDeg) {
	const noon = Date.UTC(date.year, date.month - 1, date.day, 12) - lonDeg / 15 * 3600000;
	const alt = (/** @type {number} */ ms) => sunHorizontal(jdOf(ms), latDeg, lonDeg)[0];
	let lo = noon - 12 * 3600000, hi = noon;
	if (alt(lo) > hDeg || alt(hi) < hDeg) return NaN;
	for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (alt(m) < hDeg) lo = m; else hi = m; }
	return (lo + hi) / 2;
}

/** apparent star lists, per class and UTC day (aberration moves a star 0.4" a day at most) @type {Map<string, [number, number, number][]>} */
const starCache = new Map();
/** @param {StarClass} cls @param {number} ms an instant of the day */
function starsFor(cls, ms) {
	const day = Math.floor(ms / 86400000), key = cls + day;
	let s = starCache.get(key);
	if (!s) {
		const [lo, hi] = cls === 'small' ? [3.0, 4.0] : [2.0, 3.0];
		s = apparentStars(STARS.filter(x => x[2] >= lo && x[2] <= hi), jdOf((day + 0.5) * 86400000));
		if (starCache.size >= 16) starCache.delete(/** @type {string} */ (starCache.keys().next().value));
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
	const start = eveningSunAt(date, latDeg, lonDeg, -0.833);
	const end = eveningSunAt(date, latDeg, lonDeg, -18);
	if (!Number.isFinite(start)) return { ms: NaN, reached: false };
	const stars = starsFor(cls, start);
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
 * @typedef {{ aod: number, aodRef: number, blpCdM2?: number | null, elevationM?: number, stars?: StarClass,
 *             together?: boolean, nearDeg?: number, marginMag?: number, moon?: MoonSource | null }} HazeDelayOptions
 * @typedef {'none' | 'modeled' | 'at-least' | 'at-most' | 'unresolved'} HazeDelayStatus
 *   none: the hazes are equal or the Sun doesn't set (ms 0). modeled: three stars seen under both hazes.
 *   at-least: not under the day's haze before the Sun is 18 degrees down (ms is the least the delay can be).
 *   at-most: not under the reference haze (ms the most it can be). unresolved: under neither (ms NaN).
 */

/**
 * Nightfall at the day's haze minus nightfall at a reference haze (ms; positive = later), everything else
 * equal, with the twilight sky's brightness held at the reference haze (see "How sure" at the top).
 * @param {{year:number, month:number, day:number}} date @param {number} latDeg @param {number} lonDeg
 * @param {HazeDelayOptions} options
 * @returns {{ ms: number, status: HazeDelayStatus }}
 */
export function hazeDelay(date, latDeg, lonDeg, options) {
	if (!(Number.isFinite(options.aod) && Number.isFinite(options.aodRef)) || options.aod === options.aodRef)
		return { ms: 0, status: 'none' };
	const a = starNightfall(date, latDeg, lonDeg, { ...options, aod: options.aod, skyAod: options.aodRef });
	const b = starNightfall(date, latDeg, lonDeg, { ...options, aod: options.aodRef, skyAod: options.aodRef });
	const d = a.ms - b.ms;
	if (!Number.isFinite(d)) return { ms: 0, status: 'none' };
	if (a.reached && b.reached) return { ms: d, status: 'modeled' };
	if (b.reached) return { ms: d, status: 'at-least' };
	if (a.reached) return { ms: d, status: 'at-most' };
	return { ms: NaN, status: 'unresolved' };
}

/**
 * hazeDelay's milliseconds alone: the bound where there is only a bound, 0 where there is neither a time nor
 * a bound. Prefer hazeDelay, which says which.
 * @param {{year:number, month:number, day:number}} date @param {number} latDeg @param {number} lonDeg
 * @param {HazeDelayOptions} options
 */
export function hazeDelayMs(date, latDeg, lonDeg, options) {
	const { ms } = hazeDelay(date, latDeg, lonDeg, options);
	return Number.isFinite(ms) ? ms : 0;
}

// ------------------------------------------------------------------------------------------------
// Haze data for a place (filled by open-meteo-haze.js; plain JSON, safe to post to workers)
// ------------------------------------------------------------------------------------------------
/**
 * @typedef {{ monthly: number[], reference: number, evenings: Record<string, number>, blpCdM2: number | null,
 *             forecastFetchedAt: number | null, normalsRange: [string, string], source: string,
 *             forecastSource?: string, aodScale?: number, monthlyMorning?: number[], referenceMorning?: number,
 *             mornings?: Record<string, number>, monthlyNight?: number[], referenceNight?: number,
 *             nights?: Record<string, number>, monthlyDusk?: number[], referenceDusk?: number,
 *             dusks?: Record<string, number> }} HazeData
 *   monthly: average evening aerosol optical depth (550 nm), January..December. reference: the place's
 *   year-round average (mean of the months): the "average sky". evenings: forecast evening values by ISO
 *   date. blpCdM2: light pollution (the refraction server's blpCdM2), null if unknown. forecastSource:
 *   'cams' (Open-Meteo) or 'gefs' (NOAA GEFS-Aerosols, the fallback). aodScale: the refraction server's
 *   AERONET calibration of CAMS for the place (/v1/haze-calibration; 1 or absent = none); it multiplies the
 *   CAMS values (monthly, reference and CAMS forecasts), not a GEFS forecast.
 *   monthlyMorning / referenceMorning / mornings: the same for the morning, read when the Sun is 16 degrees
 *   down before sunrise (open-meteo-haze.js HAZE_DAWN_SUN_ALT), for dawn by the horizon glow
 *   (horizon-glow.js); monthlyNight / referenceNight / nights: read when it is 16 degrees down after sunset,
 *   for Rabbenu Tam's nightfall by the glow; monthlyDusk / referenceDusk / dusks: read when it is 4.65 degrees
 *   down after sunset (handasi-hazeman's nightfall by the stars). Absent where the Sun doesn't get that low for
 *   most of the year, and in data stored before they existed: the evening values stand in.
 */

const MID_MONTH_DOY = [15.5, 45, 74.5, 105, 135.5, 166, 196.5, 227.5, 258, 288.5, 319, 349.5];

/**
 * The evening (or morning) aerosol optical depth for a date: the forecast's when it has the date, else the
 * month's average (interpolated between mid-months), plus the reference to compare it with.
 * @param {HazeData} haze @param {{year:number, month:number, day:number}} date
 * @param {'evening' | 'dusk' | 'morning' | 'night'} [when] default 'evening' (Sun 7 degrees down: ZY's Tzet);
 *   'dusk': 4.65 degrees down (handasi-hazeman's nightfall); 'morning' / 'night': 16 degrees down before sunrise /
 *   after sunset (the horizon glow)
 * @returns {{ aod: number, aodRef: number, forecast: boolean }}
 */
export function hazeOn(haze, date, when = 'evening') {
	const iso = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
	const scale = Number.isFinite(haze.aodScale) && /** @type {number} */ (haze.aodScale) > 0 ? /** @type {number} */ (haze.aodScale) : 1;
	const alt = when === 'morning' ? { monthly: haze.monthlyMorning, reference: haze.referenceMorning, days: haze.mornings }
		: when === 'night' ? { monthly: haze.monthlyNight, reference: haze.referenceNight, days: haze.nights }
		: when === 'dusk' ? { monthly: haze.monthlyDusk, reference: haze.referenceDusk, days: haze.dusks }
		: null;
	const own = alt && Array.isArray(alt.monthly) && alt.monthly.length === 12 && Number.isFinite(alt.reference);
	const monthly = own ? /** @type {number[]} */ (alt.monthly) : haze.monthly;
	const reference = own ? /** @type {number} */ (alt.reference) : haze.reference;
	const aodRef = reference * scale;
	// a day's forecast at its own moment, else the evening's for that day (better than a monthly average)
	const f = alt?.days?.[iso] ?? haze.evenings?.[iso];
	if (Number.isFinite(f)) return { aod: haze.forecastSource === 'gefs' ? f : f * scale, aodRef, forecast: true };
	const doy = (Date.UTC(date.year, date.month - 1, date.day) - Date.UTC(date.year, 0, 1)) / 86400000 + 1;
	const m = monthly, d = doy < MID_MONTH_DOY[0] ? doy + 365 : doy;
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
/**
 * Yale Bright Star Catalog (5th ed.), V 2.0-4.0: [RA J2000 deg, Dec J2000 deg, V mag, proper motion in RA
 * (times cos Dec) and in Dec, arcsec per year (FK5)]
 */
const STARS = [
	[31.7933, 23.4625, 2.0, 0.19, -0.148], [239.8758, 25.9203, 2.0, -0.005, 0.013], [37.9529, 89.2642, 2.02, 0.038, -0.015], [283.8163, -26.2967, 2.02, 0.013, -0.054], [10.8975, -17.9867, 2.04, 0.234, 0.033],
	[85.1896, -1.9428, 2.05, 0.003, -0.002], [2.0971, 29.0906, 2.06, 0.136, -0.163], [17.4329, 35.6206, 2.06, 0.178, -0.114], [86.9392, -9.6697, 2.06, 0.002, -0.002], [211.6708, -36.37, 2.06, -0.519, -0.519],
	[222.6763, 74.1556, 2.08, -0.031, 0.012], [263.7337, 12.56, 2.08, 0.12, -0.226], [340.6671, -46.8847, 2.1, 0.137, -0.008], [47.0421, 40.9556, 2.12, 0.004, -0.001], [177.265, 14.5719, 2.14, -0.497, -0.114],
	[190.3792, -48.9597, 2.17, -0.189, -0.005], [305.5571, 40.2567, 2.2, 0.004, 0.0], [136.9992, -43.4325, 2.21, -0.019, 0.013], [10.1271, 56.5372, 2.23, 0.053, -0.032], [83.0017, -0.2992, 2.23, 0.001, -0.002],
	[233.6721, 26.7147, 2.23, 0.121, -0.089], [269.1517, 51.4889, 2.23, -0.008, -0.019], [120.8963, -40.0033, 2.25, -0.027, 0.012], [139.2725, -59.2753, 2.25, -0.02, 0.008], [30.975, 42.3297, 2.26, 0.045, -0.052],
	[2.2946, 59.1497, 2.27, 0.525, -0.181], [200.9812, 54.9253, 2.27, 0.122, -0.02], [252.5408, -34.2933, 2.29, -0.611, -0.255], [204.9717, -53.4664, 2.3, -0.028, -0.016], [220.4825, -47.3883, 2.3, -0.021, -0.018],
	[218.8767, -42.1578, 2.31, -0.035, -0.035], [240.0833, -22.6217, 2.32, -0.012, -0.022], [165.4604, 56.3825, 2.37, 0.082, 0.034], [6.5708, -42.3061, 2.39, 0.203, -0.396], [326.0467, 9.875, 2.39, 0.031, -0.001],
	[265.6221, -39.03, 2.41, -0.006, -0.027], [345.9438, 28.0828, 2.42, 0.189, 0.137], [257.5946, -15.7247, 2.43, 0.039, 0.098], [178.4575, 53.6947, 2.44, 0.095, 0.012], [319.645, 62.5856, 2.44, 0.151, 0.049],
	[111.0238, -29.3031, 2.45, -0.004, 0.005], [311.5529, 33.9703, 2.46, 0.356, 0.328], [14.1771, 60.7167, 2.47, 0.026, -0.005], [346.1904, 15.2053, 2.49, 0.063, -0.042], [140.5283, -55.0108, 2.5, -0.008, 0.009],
	[45.57, 4.0897, 2.53, -0.009, -0.078], [208.885, -47.2883, 2.55, -0.057, -0.042], [168.5271, 20.5236, 2.56, 0.142, -0.13], [249.2896, -10.5672, 2.56, 0.014, 0.026], [83.1825, -17.8222, 2.58, 0.001, 0.002],
	[183.9517, -17.5419, 2.59, -0.161, 0.023], [182.0896, -50.7225, 2.6, -0.034, -0.008], [285.6529, -29.8803, 2.6, -0.015, -0.002], [154.9929, 19.8417, 2.61, 0.306, -0.147], [229.2517, -9.3831, 2.61, -0.096, -0.019],
	[89.9304, 37.2125, 2.62, 0.048, -0.081], [241.3592, -19.8056, 2.62, -0.006, -0.019], [28.66, 20.8081, 2.64, 0.096, -0.111], [84.9121, -34.0742, 2.64, 0.007, -0.026], [188.5967, -23.3967, 2.65, 0.002, -0.054],
	[236.0671, 6.4256, 2.65, 0.137, 0.047], [21.4542, 60.2353, 2.68, 0.297, -0.051], [208.6713, 18.3978, 2.68, -0.063, -0.358], [224.6329, -43.1339, 2.68, -0.035, -0.039], [74.2483, 33.1661, 2.69, 0.003, -0.018],
	[161.6925, -49.42, 2.69, 0.074, -0.048], [189.2958, -69.1356, 2.69, -0.048, -0.013], [262.6908, -37.2958, 2.69, -0.001, -0.031], [109.2858, -37.0975, 2.7, -0.009, 0.004], [221.2467, 27.0742, 2.7, -0.049, 0.021],
	[275.2487, -29.8281, 2.7, 0.035, -0.028], [296.565, 10.6133, 2.72, 0.018, -0.002], [243.5863, -3.6944, 2.74, -0.044, -0.143], [245.9979, 61.5142, 2.74, -0.017, 0.061], [200.1492, -36.7122, 2.75, -0.341, -0.085],
	[222.7196, -16.0417, 2.75, -0.106, -0.067], [160.7392, -64.3944, 2.76, -0.023, 0.01], [83.8583, -5.91, 2.77, 0.0, 0.001], [247.555, 21.4897, 2.77, -0.098, -0.015], [265.8683, 4.5672, 2.77, -0.04, 0.159],
	[233.7854, -41.1669, 2.78, -0.015, -0.028], [76.9625, -5.0864, 2.79, -0.095, -0.081], [262.6083, 52.3014, 2.79, -0.016, 0.015], [6.4379, -77.2542, 2.8, 2.215, 0.324], [183.7862, -58.7489, 2.8, -0.041, -0.009],
	[121.8858, -24.3042, 2.81, -0.083, 0.049], [250.3217, 31.6031, 2.81, -0.47, 0.394], [276.9925, -25.4217, 2.81, -0.044, -0.185], [248.9708, -28.2161, 2.82, -0.008, -0.022], [3.3092, 15.1836, 2.83, 0.003, -0.012],
	[195.5442, 10.9592, 2.83, -0.273, 0.02], [82.0613, -20.7594, 2.84, -0.004, -0.089], [58.5329, 31.8836, 2.85, 0.006, -0.01], [238.7854, -63.4306, 2.85, -0.191, -0.398], [261.325, -55.53, 2.85, -0.008, -0.025],
	[29.6925, -61.5697, 2.86, 0.264, 0.027], [334.6254, -60.2597, 2.86, -0.072, -0.043], [56.8713, 24.105, 2.87, 0.019, -0.046], [296.2437, 45.1308, 2.87, 0.053, 0.047], [326.76, -16.1272, 2.87, 0.263, -0.297],
	[95.74, 22.5136, 2.88, 0.054, -0.111], [113.65, 31.8886, 2.88, -0.172, -0.099], [59.4633, 40.0103, 2.89, 0.018, -0.026], [229.7275, -68.6794, 2.89, -0.072, -0.031], [239.7129, -26.1142, 2.89, -0.011, -0.026],
	[245.2971, -25.5928, 2.89, -0.01, -0.021], [287.4408, -21.0236, 2.89, 0.0, -0.035], [111.7875, 8.2894, 2.9, -0.052, -0.038], [194.0071, 38.3183, 2.9, -0.234, 0.056], [322.8896, -5.5711, 2.91, 0.021, -0.008],
	[46.1992, 53.5064, 2.93, 0.0, -0.005], [102.4842, -50.6147, 2.93, 0.036, -0.07], [340.7504, 30.2214, 2.94, 0.015, -0.025], [59.5075, -13.5086, 2.95, 0.061, -0.111], [187.4663, -16.5156, 2.95, -0.21, -0.138],
	[262.9604, -49.8761, 2.95, -0.031, -0.07], [331.4458, -0.3197, 2.96, 0.02, -0.01], [100.9829, 25.1311, 2.98, -0.006, -0.013], [146.4629, 23.7742, 2.98, -0.046, -0.011], [75.4921, 43.8233, 2.99, -0.001, -0.004],
	[271.4521, -30.4242, 2.99, -0.053, -0.185], [286.3525, 13.8633, 2.99, -0.005, -0.096], [32.3858, 34.9872, 3.0, 0.15, -0.04], [84.4113, 21.1425, 3.0, 0.0, -0.021], [182.5312, -22.6197, 3.0, -0.071, 0.014],
	[199.7304, -23.1717, 3.0, 0.064, -0.045], [55.7313, 47.7875, 3.01, 0.028, -0.034], [146.7754, -65.0719, 3.01, -0.012, 0.011], [167.4158, 44.4986, 3.01, -0.065, -0.028], [328.4821, -37.365, 3.01, 0.102, -0.021],
	[95.0783, -30.0633, 3.02, 0.009, 0.003], [105.7562, -23.8333, 3.02, -0.004, 0.003], [218.0196, 38.3083, 3.03, -0.114, 0.153], [266.8963, -40.1269, 3.03, 0.0, -0.008], [34.8362, -2.9775, 3.04, -0.008, -0.237],
	[207.4042, -42.4739, 3.04, -0.023, -0.02], [155.5821, 41.4994, 3.05, -0.082, 0.035], [191.5704, -68.1081, 3.05, -0.039, -0.017], [230.1821, 71.8339, 3.05, -0.019, 0.02], [288.1388, 67.6617, 3.07, 0.094, 0.093],
	[252.9675, -38.0475, 3.08, -0.011, -0.025], [292.6804, 27.9597, 3.08, 0.002, -0.002], [305.2529, -14.7814, 3.08, 0.042, 0.002], [133.8483, 5.9456, 3.11, -0.099, 0.014], [162.4062, -16.1936, 3.11, 0.094, 0.2],
	[274.4067, -36.7617, 3.11, -0.128, -0.167], [309.3917, -47.2914, 3.11, 0.053, 0.066], [87.74, -35.7683, 3.12, 0.059, 0.401], [140.2637, 34.3925, 3.13, -0.221, 0.019], [142.8054, -57.0344, 3.13, -0.032, 0.004],
	[173.945, -63.0197, 3.13, -0.041, -0.005], [224.7904, -42.1042, 3.13, -0.019, -0.024], [254.655, -55.9903, 3.13, -0.019, -0.036], [134.8017, 48.0417, 3.14, -0.444, -0.226], [258.7579, 24.8392, 3.14, -0.021, -0.157],
	[258.7617, 36.8092, 3.16, -0.026, 0.004], [76.6287, 41.2344, 3.17, 0.029, -0.068], [99.4404, -43.1961, 3.17, 0.002, -0.006], [143.2142, 51.6772, 3.17, -0.954, -0.531], [257.1967, 65.7147, 3.17, -0.02, 0.022],
	[281.4142, -26.9908, 3.17, 0.053, 0.0], [72.46, 6.9614, 3.19, 0.466, 0.012], [76.3654, -22.3711, 3.19, 0.025, -0.074], [220.6267, -64.9753, 3.19, -0.192, -0.232], [254.4171, 9.375, 3.2, -0.291, -0.01],
	[318.2342, 30.2269, 3.2, 0.001, -0.056], [267.4646, -37.0433, 3.21, 0.049, 0.033], [354.8367, 77.6325, 3.21, -0.067, 0.151], [230.3429, -40.6475, 3.22, -0.015, -0.026], [302.8263, -0.8214, 3.23, 0.038, 0.004],
	[322.165, 70.5608, 3.23, 0.01, 0.007], [44.5654, -40.3047, 3.24, -0.045, 0.019], [56.8096, -74.2389, 3.24, 0.047, 0.114], [244.5804, -4.6925, 3.24, 0.085, 0.041], [284.7358, 32.6894, 3.24, -0.002, 0.002],
	[112.3075, -43.3014, 3.25, -0.055, 0.187], [275.3275, -2.8989, 3.26, -0.547, -0.7], [9.8321, 30.8608, 3.27, 0.136, -0.091], [68.4992, -55.045, 3.27, 0.051, -0.003], [102.0475, -61.9414, 3.27, -0.069, 0.269],
	[211.5929, -26.6825, 3.27, 0.044, -0.139], [260.5025, -24.9994, 3.27, -0.004, -0.02], [343.6625, -15.8208, 3.27, -0.04, -0.025], [93.7192, 22.5067, 3.28, -0.068, -0.012], [226.0175, -25.2819, 3.29, -0.073, -0.043],
	[231.2325, 58.9661, 3.29, -0.009, 0.017], [16.5208, -46.7186, 3.31, -0.027, -0.001], [78.2329, -16.2056, 3.31, 0.043, -0.026], [183.8567, 57.0325, 3.31, 0.104, 0.009], [153.4342, -70.0381, 3.32, -0.039, 0.007],
	[158.0058, -61.6853, 3.32, -0.019, 0.009], [286.735, -27.6706, 3.32, -0.053, -0.251], [258.0383, -43.2392, 3.33, 0.024, -0.287], [117.3237, -24.8597, 3.34, -0.003, -0.002], [168.56, 15.4294, 3.34, -0.061, -0.079],
	[261.3483, -56.3775, 3.34, -0.002, -0.012], [269.7567, -9.7736, 3.34, -0.007, -0.116], [63.6062, -62.4739, 3.35, 0.045, 0.045], [332.7138, 58.2011, 3.35, 0.015, 0.004], [81.1192, -2.3969, 3.36, 0.002, 0.0],
	[101.3225, 12.8956, 3.36, -0.116, -0.191], [127.5662, 60.7181, 3.36, -0.133, -0.107], [291.3746, 3.1147, 3.36, 0.257, 0.082], [203.6733, -0.5958, 3.37, -0.285, 0.042], [230.6704, -44.6894, 3.37, -0.019, -0.013],
	[28.5987, 63.67, 3.38, 0.032, -0.021], [131.6942, 6.4189, 3.38, -0.189, -0.051], [193.9008, 3.3975, 3.38, -0.469, -0.054], [46.2942, 38.8403, 3.39, 0.13, -0.106], [67.1654, 15.8708, 3.4, 0.103, -0.025],
	[154.2708, -61.3322, 3.4, -0.024, 0.005], [340.3654, 10.8314, 3.4, 0.08, -0.013], [22.0913, -43.3183, 3.41, -0.014, -0.209], [28.2704, 29.5789, 3.41, 0.011, -0.235], [207.3762, -41.6878, 3.41, -0.022, -0.021],
	[228.0712, -52.0992, 3.41, -0.112, -0.073], [240.0304, -38.3969, 3.41, -0.022, -0.032], [266.6146, 27.7206, 3.42, -0.311, -0.751], [311.2396, -66.2031, 3.42, -0.046, 0.012], [311.3225, 61.8389, 3.43, 0.087, 0.818],
	[12.275, 57.8158, 3.44, 1.1, -0.529], [137.7417, -58.9669, 3.44, -0.026, 0.008], [154.1725, 23.4172, 3.44, 0.018, -0.007], [286.5621, -4.8825, 3.44, -0.017, -0.09], [17.1475, -10.1822, 3.45, 0.218, -0.138],
	[154.2742, 42.9144, 3.45, -0.164, -0.038], [282.52, 33.3628, 3.45, 0.003, -0.003], [40.825, 3.2358, 3.47, -0.142, -0.152], [60.17, 12.4903, 3.47, -0.006, -0.012], [105.4296, -27.9347, 3.47, -0.005, 0.005],
	[119.1946, -52.9822, 3.47, -0.029, 0.021], [228.8758, 33.3147, 3.47, 0.086, -0.112], [299.6892, 19.4922, 3.47, 0.066, 0.024], [169.6196, 33.0942, 3.48, -0.026, 0.028], [258.6621, 14.3903, 3.48, -0.006, 0.036],
	[342.5008, 24.6017, 3.48, 0.147, -0.042], [342.1388, -51.3169, 3.49, 0.108, -0.071], [26.0171, -15.9375, 3.5, -1.718, 0.856], [225.4867, 40.3906, 3.5, -0.041, -0.028], [276.7433, -45.9683, 3.51, -0.016, -0.054],
	[284.4325, -21.1067, 3.51, 0.033, -0.012], [124.1288, 9.1856, 3.52, -0.044, -0.049], [145.2875, 9.8922, 3.52, -0.142, -0.037], [151.8333, 16.7628, 3.52, -0.002, 0.0], [342.42, 66.2006, 3.52, -0.065, -0.125],
	[67.1542, 19.1803, 3.53, 0.107, -0.038], [110.0308, 21.9822, 3.53, -0.026, -0.012], [237.405, -3.4303, 3.53, -0.086, -0.024], [250.7242, 38.9222, 3.53, 0.037, -0.083], [332.55, 6.1978, 3.53, 0.276, 0.027],
	[55.8121, -9.7633, 3.54, -0.092, 0.745], [83.7846, 9.9342, 3.54, 0.0, -0.006], [149.2158, -54.5678, 3.54, -0.01, 0.003], [173.2504, -31.8578, 3.54, -0.206, -0.04], [264.3967, -15.3986, 3.54, -0.042, -0.058],
	[86.7387, -14.8219, 3.55, -0.016, -0.001], [214.8508, -46.0578, 3.55, -0.013, 0.002], [4.8571, -8.8239, 3.56, -0.014, -0.036], [34.1275, -51.5122, 3.56, 0.096, -0.027], [64.4737, -33.7983, 3.56, 0.067, -0.008],
	[169.8354, -14.7786, 3.56, -0.122, 0.208], [230.4517, -36.2614, 3.56, -0.089, -0.084], [302.1817, -66.1819, 3.56, 1.207, -1.131], [24.4983, 48.6283, 3.57, 0.065, -0.113], [116.1117, 24.3981, 3.57, -0.033, -0.052],
	[253.0838, -38.0175, 3.57, -0.011, -0.024], [275.2642, 72.7328, 3.57, 0.532, -0.35], [304.5137, -12.5447, 3.57, 0.064, 0.004], [109.5233, 16.5403, 3.58, -0.048, -0.037], [217.9575, 30.3714, 3.58, -0.1, 0.119],
	[234.2562, -28.135, 3.58, -0.009, 0.003], [185.34, -60.4011, 3.59, -0.175, 0.087], [21.0058, -8.1833, 3.6, -0.079, -0.218], [51.2033, 9.0289, 3.6, -0.066, -0.078], [79.4017, -6.8444, 3.6, -0.015, -0.008],
	[86.1158, -22.4483, 3.6, -0.293, -0.37], [103.1971, 33.9611, 3.6, -0.002, -0.048], [135.9062, 47.1567, 3.6, -0.033, -0.054], [142.675, -40.4667, 3.6, -0.182, 0.073], [116.3137, -37.9686, 3.61, -0.01, 0.002],
	[152.6471, -12.3542, 3.61, -0.202, -0.089], [177.6738, 1.7647, 3.61, 0.743, -0.271], [22.8708, 15.3458, 3.62, 0.028, -0.006], [130.0733, -52.9219, 3.62, -0.022, 0.019], [195.5675, -71.5489, 3.62, 0.256, -0.021],
	[253.6458, -42.3614, 3.62, -0.124, -0.236], [262.7746, -60.6839, 3.62, -0.059, -0.096], [266.4333, -64.7239, 3.62, -0.014, -0.054], [345.4804, 42.3261, 3.62, 0.023, -0.006], [42.4958, 27.2606, 3.63, 0.067, -0.118],
	[57.2904, 24.0533, 3.63, 0.018, -0.047], [309.3875, 14.5953, 3.63, 0.113, -0.033], [176.4017, -66.7286, 3.64, -0.103, 0.037], [64.9483, 15.6275, 3.65, 0.115, -0.025], [190.415, -1.4494, 3.65, -0.565, 0.012],
	[211.0971, 64.3758, 3.65, -0.055, 0.018], [313.7025, -58.4542, 3.65, 0.017, -0.026], [9.2429, 53.8969, 3.66, 0.019, -0.009], [234.6642, -29.7778, 3.66, -0.015, -0.03], [271.6579, -50.0917, 3.66, -0.01, -0.014],
	[347.3617, -21.1725, 3.66, 0.055, 0.031], [142.8821, 63.0619, 3.67, 0.109, 0.028], [236.5471, 15.4219, 3.67, 0.067, -0.045], [130.8979, -33.1864, 3.68, -0.011, 0.011], [190.415, -1.4494, 3.68, -0.565, 0.012],
	[231.9571, 29.1058, 3.68, -0.179, 0.086], [325.0229, -16.6622, 3.68, 0.19, -0.023], [49.8792, -21.7578, 3.69, 0.052, 0.033], [72.8017, 5.605, 3.69, -0.001, 0.001], [146.3117, -62.5078, 3.69, -0.014, 0.007],
	[349.2912, 3.2822, 3.69, 0.762, 0.017], [28.9896, -51.6089, 3.7, 0.681, 0.292], [56.2188, 24.1133, 3.7, 0.019, -0.046], [269.4412, 29.2478, 3.7, 0.084, -0.017], [89.1013, -14.1678, 3.71, -0.042, 0.139],
	[176.5125, 47.7794, 3.71, -0.137, 0.03], [237.7042, 4.4778, 3.71, 0.128, 0.063], [298.8283, 6.4067, 3.71, 0.048, -0.482], [73.5629, 2.4406, 3.72, 0.0, 0.0], [89.8817, 54.2847, 3.72, 0.081, -0.125],
	[221.5621, 1.8928, 3.72, -0.114, -0.026], [316.2329, 43.9278, 3.72, 0.008, 0.001], [318.6979, 38.0456, 3.72, 0.16, 0.435], [27.865, -10.335, 3.73, 0.041, -0.039], [53.2325, -9.4583, 3.73, -0.974, 0.021],
	[118.0542, -40.5758, 3.73, -0.01, 0.003], [271.8375, 9.5639, 3.73, -0.06, 0.08], [51.7925, 9.7328, 3.74, 0.06, -0.039], [321.6667, -22.4114, 3.74, 0.001, 0.023], [343.1538, -7.5797, 3.74, 0.011, 0.037],
	[75.6196, 41.0758, 3.75, 0.009, -0.022], [136.0387, -47.0978, 3.75, -0.044, -0.013], [245.48, 19.1531, 3.75, -0.047, 0.043], [266.9733, 2.7072, 3.75, -0.022, -0.074], [268.3821, 56.8728, 3.75, 0.094, 0.08],
	[337.2929, 58.4153, 3.75, 0.015, 0.001], [42.6742, 55.8956, 3.76, 0.017, -0.014], [65.7338, 17.5425, 3.76, 0.107, -0.03], [83.4062, -62.4897, 3.76, 0.002, 0.009], [252.4463, -59.0414, 3.76, 0.038, -0.028],
	[325.3687, -77.39, 3.76, 0.045, -0.24], [331.7529, 25.345, 3.76, 0.298, 0.025], [56.2983, 42.5786, 3.77, -0.014, -0.002], [126.4342, -66.1369, 3.77, -0.036, -0.155], [286.1708, -21.7417, 3.77, 0.08, -0.06],
	[289.2758, 53.3686, 3.77, 0.059, 0.125], [309.9096, 15.9119, 3.77, 0.066, -0.002], [311.9192, -9.4958, 3.77, 0.035, -0.034], [337.8229, 50.2825, 3.77, 0.138, 0.019], [107.1871, -70.4989, 3.78, 0.023, 0.106],
	[163.3733, -58.8533, 3.78, 0.067, 0.03], [106.0271, 20.5703, 3.79, -0.009, 0.0], [111.4317, 27.7981, 3.79, -0.123, -0.086], [292.4262, 51.7297, 3.79, 0.02, 0.13], [303.4079, 46.7414, 3.79, 0.004, 0.003],
	[47.3742, 44.8572, 3.8, 0.177, -0.157], [147.7475, 59.0386, 3.8, -0.293, -0.151], [154.9942, 19.8406, 3.8, 0.312, -0.169], [233.7004, 10.5375, 3.8, -0.074, -0.005], [233.7004, 10.5392, 3.8, -0.074, 0.012],
	[264.8662, 46.0064, 3.8, -0.005, 0.005], [84.6867, -2.6, 3.81, 0.002, 0.001], [87.8304, -20.8792, 3.81, 0.227, -0.649], [156.5225, -16.8364, 3.81, -0.128, -0.08], [68.8875, -30.5622, 3.82, -0.045, -0.012],
	[139.7113, 36.8025, 3.82, -0.03, -0.122], [156.9696, -58.7394, 3.82, -0.013, 0.0], [247.7283, 1.9839, 3.82, -0.027, -0.073], [296.8471, 18.5342, 3.82, 0.007, 0.008], [354.3913, 46.4581, 3.82, 0.162, -0.421],
	[56.0796, 32.2883, 3.83, 0.007, -0.011], [163.3279, 34.215, 3.83, 0.087, -0.278], [209.5679, -42.1008, 3.83, -0.024, -0.021], [221.965, -79.0447, 3.83, -0.012, -0.015], [271.8858, 28.7625, 3.83, 0.001, 0.009],
	[297.0433, 70.2678, 3.83, 0.082, 0.037], [67.1438, 15.9622, 3.84, 0.103, -0.027], [130.1567, -46.6489, 3.84, 0.0, 0.003], [133.7617, -60.6447, 3.84, -0.021, 0.038], [159.3254, -48.2258, 3.84, -0.155, -0.017],
	[172.8508, 69.3311, 3.84, -0.039, -0.017], [235.6858, 26.2956, 3.84, -0.105, 0.045], [275.9246, 21.7697, 3.84, 0.196, -0.242], [335.4142, -1.3872, 3.84, 0.132, 0.007], [56.05, -64.8069, 3.85, 0.313, 0.076],
	[86.8212, -51.0664, 3.85, 0.011, 0.085], [95.5283, -33.4364, 3.85, -0.024, -0.055], [108.7029, -26.7728, 3.85, -0.008, 0.006], [153.6842, -42.1219, 3.85, -0.145, 0.045], [158.2029, 9.3067, 3.85, -0.007, -0.003],
	[239.1133, 15.6617, 3.85, 0.312, -1.281], [243.8596, -63.6856, 3.85, 0.002, -0.011], [278.8017, -8.2442, 3.85, -0.015, -0.312], [63.5004, -42.2944, 3.86, 0.046, -0.209], [189.4258, -48.5411, 3.86, -0.184, -0.005],
	[269.0633, 37.2506, 3.86, 0.004, 0.006], [273.4408, -21.0589, 3.86, 0.002, 0.001], [14.1883, 38.4994, 3.87, 0.152, 0.033], [48.0179, -28.9869, 3.87, 0.339, 0.64], [56.4567, 24.3678, 3.87, 0.02, -0.046],
	[69.545, -14.3039, 3.87, -0.075, -0.156], [82.8029, -35.4706, 3.87, 0.022, -0.035], [103.5329, -24.1839, 3.87, -0.008, 0.013], [188.1167, -72.1331, 3.87, -0.058, -0.002], [188.3708, 69.7883, 3.87, -0.059, 0.012],
	[209.67, -44.8036, 3.87, -0.025, -0.024], [227.9838, -48.7378, 3.87, -0.095, -0.049], [2.3529, -45.7475, 3.88, 0.124, -0.181], [138.5912, 2.3142, 3.88, 0.129, -0.31], [148.1908, 26.0069, 3.88, -0.216, -0.056],
	[202.7613, -39.4075, 3.88, -0.012, -0.015], [220.765, -5.6583, 3.88, 0.109, -0.316], [239.2212, -29.2142, 3.88, -0.013, -0.025], [44.1071, -8.8981, 3.89, 0.079, -0.22], [170.2517, -54.4911, 3.89, -0.036, -0.006],
	[184.9767, -0.6669, 3.89, -0.063, -0.018], [244.935, 46.3133, 3.89, -0.011, 0.04], [248.3625, -78.8972, 3.89, -0.131, -0.076], [299.0767, 35.0833, 3.89, -0.032, -0.027], [126.415, -3.9064, 3.9, -0.066, -0.023],
	[298.1183, 1.0056, 3.9, 0.011, -0.007], [347.59, -45.2467, 3.9, 0.136, -0.03], [60.7892, 5.9892, 3.91, 0.005, -0.003], [131.5071, -46.0417, 3.91, -0.001, 0.0], [144.9642, -1.1428, 3.91, 0.049, -0.064],
	[167.1475, -58.975, 3.91, -0.007, 0.0], [187.01, -50.2306, 3.91, -0.03, -0.015], [233.8817, -14.7894, 3.91, 0.065, 0.009], [17.0963, -55.2458, 3.92, 0.019, 0.025], [255.0725, 30.9264, 3.92, -0.047, 0.028],
	[318.9558, 5.2478, 3.92, 0.059, -0.088], [69.0796, -3.3525, 3.93, 0.002, -0.005], [115.3117, -9.5511, 3.93, -0.073, -0.019], [290.4183, -17.8472, 3.93, -0.024, 0.024], [6.5508, -43.68, 3.94, 0.109, 0.029],
	[131.1712, 18.1542, 3.94, -0.018, -0.228], [170.9812, 10.5292, 3.94, 0.168, -0.075], [314.2933, 41.1672, 3.94, 0.012, -0.016], [22.8129, -49.0728, 3.95, 0.142, 0.151], [43.5646, 52.7625, 3.95, 0.0, -0.005],
	[99.1708, -19.2558, 3.95, 0.059, -0.062], [115.455, -72.6061, 3.95, 0.03, 0.018], [200.985, 54.9217, 3.95, 0.119, -0.028], [237.7396, -33.6272, 3.95, -0.006, -0.03], [341.6329, 23.5656, 3.95, 0.058, -0.01],
	[66.0092, -34.0169, 3.96, 0.069, 0.051], [89.7867, -42.8153, 3.96, 0.022, -0.014], [102.4604, -32.5086, 3.96, -0.007, 0.004], [115.9521, -28.9547, 3.96, 0.002, 0.005], [182.9129, -52.3686, 3.96, -0.035, -0.016],
	[241.7017, -20.6692, 3.96, -0.009, -0.021], [300.1479, -72.9106, 3.96, 0.074, -0.132], [87.8725, 39.1486, 3.97, -0.005, 0.007], [130.0258, -35.3083, 3.97, 0.012, -0.022], [135.16, 41.7828, 3.97, -0.44, -0.246],
	[137.8192, -62.3172, 3.97, -0.043, 0.009], [270.1612, 2.9317, 3.97, 0.002, -0.008], [290.9717, -40.6161, 3.97, 0.03, -0.123], [337.3175, -43.4956, 3.97, 0.028, -0.005], [350.7425, -20.1006, 3.97, -0.12, -0.096],
	[30.8587, 72.4214, 3.98, -0.045, 0.022], [93.7137, -6.2747, 3.98, -0.008, -0.019], [109.2075, -67.9572, 3.98, -0.007, 0.005], [303.8679, 47.7144, 3.98, 0.001, 0.008], [349.3575, -58.2358, 3.99, -0.029, 0.079],
	[30.0013, -21.0778, 4.0, 0.135, -0.024], [43.4704, -49.8903, 4.0, 0.135, 0.014], [135.6117, -66.3961, 4.0, -0.002, -0.096], [156.0987, -74.0317, 4.0, -0.021, -0.026], [220.49, -37.7936, 4.0, -0.023, -0.032],
];
