// @ts-check
/**
 * moon-estimate.js — the quick estimate of the moon on the page (the Birkat Halevana card on /calendar).
 *
 * A low-precision lunar position (Meeus, Astronomical Algorithms ch. 47, cut to its larger terms, with a
 * low-precision sun), good to about 1-2 arcminutes, which puts moonrise / moonset within a minute or two of the
 * exact ones on a flat sea-level horizon. It exists so the card can show tonight's moon at once without loading
 * the moon library (Astronomy Engine) on the main thread. The worker (print/weekly/moon-birkat-worker.js)
 * refines it: the lit limb over the terrain with the weather's refraction, which can differ by many minutes.
 * No imports. Rise / set are those of the moon's highest lit point on a flat horizon with standard refraction,
 * like moon.js's flat mode; elevation and terrain are ignored.
 */

const DEG = Math.PI / 180;
const DAY_MS = 86400000;
const EARTH_RADIUS_KM = 6378.14;
const MOON_RADIUS_KM = 1738.1;
const AU_KM = 149597870.7;
/** Where the moon's highest lit point is at rise / set: standard refraction at the horizon (34.48 arcmin), degrees. */
const HORIZON_DEG = -34.4789 / 60;
const STEP_MS = 10 * 60 * 1000;

/** @param {number} x */
const norm360 = x => ((x % 360) + 360) % 360;
/** @param {number} x */
const norm180 = x => { const a = norm360(x); return a > 180 ? a - 360 : a; };

/** Meeus table 47.A, the larger terms: [D, M, M', F, longitude (1e-6 deg), distance (1e-3 km)] */
const LON_DIST = [
	[0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111], [2, 0, 0, 0, 658314, -2955968],
	[0, 0, 2, 0, 213618, -569925], [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
	[2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138], [2, 0, 1, 0, 53322, -170733],
	[2, -1, 0, 0, 45758, -204586], [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
	[0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321], [0, 0, 1, 2, -12528, 0],
	[0, 0, 1, -2, 10980, 79661], [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
	[4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208], [2, 1, 0, 0, -6766, 30824],
	[1, 0, -1, 0, -5163, -8379], [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
	[2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650], [2, 0, -3, 0, 3665, 14403],
	[0, 1, -2, 0, -2689, -7003], [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056],
	[1, 0, 1, 0, -2348, 6322], [2, -2, 0, 0, 2236, -9884], [0, 1, 2, 0, -2120, 5751],
	[0, 2, 0, 0, -2069, 0], [2, -2, -1, 0, 2048, -4950], [2, 0, 1, -2, -1773, 4130],
	[2, 0, 0, 2, -1595, 0], [4, -1, -1, 0, 1215, -3958], [0, 0, 2, 2, -1110, 0],
	[3, 0, -1, 0, -892, 3258], [2, 1, 1, 0, -810, 2616], [4, -1, -2, 0, 759, -1897]
];

/** Meeus table 47.B, the larger terms: [D, M, M', F, latitude (1e-6 deg)] */
const LAT = [
	[0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237],
	[2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198],
	[2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
	[2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463], [2, -1, 0, 1, 2211],
	[2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870], [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794],
	[0, 0, 0, 3, -1749], [0, 1, -1, 1, -1565], [1, 0, 0, 1, -1491], [0, 1, 1, 1, -1475],
	[0, 1, 1, -1, -1410], [0, 1, 0, -1, -1344], [1, 0, 0, -1, -1335], [0, 0, 3, 1, 1107],
	[4, 0, 0, -1, 1021], [4, 0, -1, 1, 833]
];

/**
 * Delta-T (TT - UT) in seconds, Espenak-Meeus for 2005-2050; the moon moves 0.5" a second, so it matters.
 * @param {number} year
 */
const deltaT = year => { const t = year - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; };

/**
 * @typedef {Object} Equatorial
 * @property {number} ra   radians
 * @property {number} dec  radians
 * @property {number} dist km
 */

/**
 * @param {number} lon radians @param {number} lat radians @param {number} dist km @param {number} eps radians
 * @returns {Equatorial}
 */
function equatorial(lon, lat, dist, eps) {
	const sinL = Math.sin(lon), cosL = Math.cos(lon);
	return {
		ra: Math.atan2(sinL * Math.cos(eps) - Math.tan(lat) * Math.sin(eps), cosL),
		dec: Math.asin(Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * sinL),
		dist
	};
}

/**
 * @param {number} jdUt Julian day (UT)
 * @returns {{ moon: Equatorial, sun: Equatorial }} geocentric, apparent, of date
 */
function bodies(jdUt) {
	const T = (jdUt + deltaT(2000 + (jdUt - 2451545) / 365.25) / 86400 - 2451545) / 36525;
	const Lm = 218.3164477 + 481267.88123421 * T;
	const D = (297.8501921 + 445267.1114034 * T) * DEG;
	const M = (357.5291092 + 35999.0502909 * T) * DEG;
	const Mm = (134.9633964 + 477198.8675055 * T) * DEG;
	const F = (93.272095 + 483202.0175233 * T) * DEG;
	const E = 1 - 0.002516 * T - 0.0000074 * T * T;
	const a1 = (119.75 + 131.849 * T) * DEG, a2 = (53.09 + 479264.29 * T) * DEG, a3 = (313.45 + 481266.484 * T) * DEG;

	let sl = 0, sr = 0, sb = 0;
	for (const [d, m, mm, f, l, r] of LON_DIST) {
		const arg = d * D + m * M + mm * Mm + f * F;
		const e = m ? (Math.abs(m) == 1 ? E : E * E) : 1;
		sl += e * l * Math.sin(arg);
		sr += e * r * Math.cos(arg);
	}
	for (const [d, m, mm, f, b] of LAT) {
		const e = m ? (Math.abs(m) == 1 ? E : E * E) : 1;
		sb += e * b * Math.sin(d * D + m * M + mm * Mm + f * F);
	}
	const Lr = Lm * DEG;
	sl += 3958 * Math.sin(a1) + 1962 * Math.sin(Lr - F) + 318 * Math.sin(a2);
	sb += -2235 * Math.sin(Lr) + 382 * Math.sin(a3) + 175 * Math.sin(a1 - F) + 175 * Math.sin(a1 + F)
		+ 127 * Math.sin(Lr - Mm) - 115 * Math.sin(Lr + Mm);

	const omega = (125.04 - 1934.136 * T) * DEG;
	const eps = (23.439291 - 0.0130042 * T + 0.00256 * Math.cos(omega)) * DEG;
	const moonLon = (Lm + sl / 1e6 - 0.00478 * Math.sin(omega)) * DEG;
	const moonLat = sb / 1e6 * DEG;
	const moon = equatorial(moonLon, moonLat, 385000.56 + sr / 1000, eps);

	// Sun, Meeus ch. 25
	const L0 = 280.46646 + 36000.76983 * T;
	const Ms = (357.52911 + 35999.05029 * T) * DEG;
	const ecc = 0.016708634 - 0.000042037 * T;
	const C = (1.914602 - 0.004817 * T) * Math.sin(Ms) + 0.019993 * Math.sin(2 * Ms) + 0.000289 * Math.sin(3 * Ms);
	const sunLon = (L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) * DEG;
	const sunDist = 1.000001018 * (1 - ecc * ecc) / (1 + ecc * Math.cos((Ms / DEG + C) * DEG)) * AU_KM;
	return { moon, sun: equatorial(sunLon, 0, sunDist, eps) };
}

/**
 * What the glyph needs (what moonGeometry in the moon library calls thetaDeg and phaseAngleDeg), and where the
 * moon's centre is relative to the horizon.
 * @param {number} ms epoch ms
 * @param {number} latDeg
 * @param {number} lonDeg east positive
 */
function state(ms, latDeg, lonDeg) {
	const jd = ms / DAY_MS + 2440587.5;
	const { moon, sun } = bodies(jd);
	const T = (jd - 2451545) / 36525;
	const lst = (280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T + lonDeg) * DEG;
	const H = lst - moon.ra;
	const phi = latDeg * DEG;

	// Topocentric altitude of the centre, geometric (no refraction): the moon seen from the surface of a sphere
	const sinAlt = Math.sin(phi) * Math.sin(moon.dec) + Math.cos(phi) * Math.cos(moon.dec) * Math.cos(H);
	const cosAlt = Math.sqrt(1 - sinAlt * sinAlt);
	const rho = 1 - 0.00167 * Math.sin(phi) ** 2;
	const parallax = rho * EARTH_RADIUS_KM / moon.dist;
	const altDeg = Math.atan2(sinAlt - parallax, cosAlt) / DEG;
	const topoDist = moon.dist * Math.hypot(cosAlt, sinAlt - parallax);
	const semiDeg = Math.asin(MOON_RADIUS_KM / topoDist) / DEG;

	// Phase angle from the sun-moon elongation (Meeus 48.2-48.4)
	const dRa = sun.ra - moon.ra;
	const cosPsi = Math.sin(sun.dec) * Math.sin(moon.dec) + Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(dRa);
	const psi = Math.acos(Math.max(-1, Math.min(1, cosPsi)));
	const phaseAngleDeg = Math.atan2(sun.dist * Math.sin(psi), moon.dist - sun.dist * cosPsi) / DEG;

	// Angle of the bright limb from the vertical: position angle of the bright limb (48.5) minus the parallactic angle (14.1)
	const chi = Math.atan2(Math.cos(sun.dec) * Math.sin(dRa),
		Math.sin(sun.dec) * Math.cos(moon.dec) - Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(dRa)) / DEG;
	const q = Math.atan2(Math.sin(H), Math.tan(phi) * Math.cos(moon.dec) - Math.sin(moon.dec) * Math.cos(H)) / DEG;
	const thetaDeg = norm180(chi - q);

	return { altDeg, semiDeg, thetaDeg, phaseAngleDeg };
}

/**
 * How high above the moon's centre its highest lit point is, in semi-diameters (the flat-disk form).
 * @param {number} thetaDeg @param {number} phaseAngleDeg
 */
function litPointFactor(thetaDeg, phaseAngleDeg) {
	const cosTh = Math.cos(thetaDeg * DEG), sinTh = Math.sin(thetaDeg * DEG);
	if (cosTh >= 0) return 1;
	if (phaseAngleDeg <= 90) {
		const cosI = Math.cos(phaseAngleDeg * DEG);
		return Math.sqrt(sinTh * sinTh + cosI * cosI * cosTh * cosTh);
	}
	return Math.abs(sinTh);
}

/**
 * How far the moon's highest lit point is above the horizon, degrees (zero at rise / set).
 * @param {number} ms @param {number} latDeg @param {number} lonDeg
 */
function excess(ms, latDeg, lonDeg) {
	const s = state(ms, latDeg, lonDeg);
	return s.altDeg + litPointFactor(s.thetaDeg, s.phaseAngleDeg) * s.semiDeg - HORIZON_DEG;
}

/**
 * The first moonrise (dir > 0) or moonset (dir < 0) after an instant, within two days: 10-minute steps, then bisection.
 * @param {number} dir @param {number} startMs @param {number} latDeg @param {number} lonDeg
 * @returns {number | null} epoch ms
 */
function nextEvent(dir, startMs, latDeg, lonDeg) {
	let t0 = startMs, f0 = excess(t0, latDeg, lonDeg);
	for (let t1 = t0 + STEP_MS; t1 <= startMs + 2 * DAY_MS; t1 += STEP_MS) {
		const f1 = excess(t1, latDeg, lonDeg);
		if (dir > 0 ? f0 < 0 && f1 >= 0 : f0 >= 0 && f1 < 0) {
			let lo = t0, hi = t1;
			while (hi - lo > 1000) {
				const mid = (lo + hi) / 2;
				if ((excess(mid, latDeg, lonDeg) >= 0) === (dir > 0)) hi = mid; else lo = mid;
			}
			return Math.round((lo + hi) / 2);
		}
		t0 = t1; f0 = f1;
	}
	return null;
}

/**
 * Moonrise / moonset finders in the shape moon-coverage.js takes.
 * @param {number} latDeg
 * @param {number} lonDeg east positive
 * @returns {import('./moon-coverage.js').MoonEvents}
 */
export function estimatedMoonEvents(latDeg, lonDeg) {
	return {
		rise: at => nextEvent(1, at, latDeg, lonDeg),
		set: at => nextEvent(-1, at, latDeg, lonDeg)
	};
}

/**
 * The moon's look at an instant, as the glyph needs it (the same fields the worker's moon events carry).
 * @param {number} ms
 * @param {number} latDeg
 * @param {number} lonDeg east positive
 * @returns {{ ms: number, thetaDeg: number, phaseAngleDeg: number }}
 */
export function estimatedMoonLook(ms, latDeg, lonDeg) {
	const { thetaDeg, phaseAngleDeg } = state(ms, latDeg, lonDeg);
	return { ms: Math.round(ms), thetaDeg, phaseAngleDeg };
}
