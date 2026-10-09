// @ts-check
/**
 * royzmanim-spa-corrections.js
 *
 * Extends KosherJava's SPACalculator (kosher-zmanim, JavaScript port) with the accuracy corrections
 * discussed for ROYZmanim, plus the parts of Chaim Keller's ChaiTables (netzski6) model that hold up
 * physically. Usage:
 *
 *     import ROYSPACalculator, { monthlyClimate } from "./royzmanim-spa-corrections.js";
 *
 *     const calc = new ROYSPACalculator();                  // defaults = corrections 1-3 on
 *     calc.configureForLocation(geoLocation);               // sets the per-latitude Earth radius
 *     zmanimCalendar.setAstronomicalCalculator(calc);
 *
 *     // optional: real air instead of the 34.48' average (see 6)
 *     calc.setAtmosphereProvider(monthlyClimate({ minC: [...12 values], meanC: [...12 values] }));
 *
 *     // optional: visible sunrise / sunset over terrain (see 7)
 *     const ms = calc.getVisibleSunrise(date, geoLocation, horizonProfile);   // epoch ms, or NaN
 *
 * WHAT IT CHANGES (only the geometric 90 degree zenith, i.e. sunrise/sunset and anything defined from
 * them; depression-angle zmanim such as 16.1 degrees or 7.165 degrees are untouched, as in KosherJava):
 *
 *  1. Refraction constant: 34.478885263888294' (Calendrical Calculations global average) instead of 34'.
 *  2. Elevation model ('physical', default): replaces `refraction + acos(R / (R + h))` with the dip and
 *     horizon-ray refraction from Sweer's (1938) ray equations in a standard atmosphere. KosherJava's
 *     geometric dip is ~10% too large (it ignores terrestrial refraction) and its refraction is the value
 *     for a body at 0 degrees altitude, while the sea horizon seen from above is below that, where
 *     refraction is larger. At 800 m the old total depression was ~5.7' too shallow. Sea-level results
 *     are unchanged. Pass { elevationModel: 'kosherjava' } to get the original behaviour back.
 *  3. Earth radius: radius of curvature of the WGS84 ellipsoid along the line of sight (east-west by
 *     default) instead of a single mean radius. (ChaiTables uses 6356.766 km, the US Standard Atmosphere
 *     geopotential constant, which is not a radius of curvature; not ported.)
 *  4. Optional: setHorizonAtmosphere(pressureMb, temperatureC) - kept for compatibility, now a shorthand
 *     for a constant atmosphere in (6). The previous version scaled by SPA's (P/1010)(283/(273+T)), which
 *     is about half as temperature-sensitive as the true horizon refraction (exponent ~1.68, see 6).
 *  5. Optional: setSolarRadiusKm(km). 695,700 km (IAU 2015) instead of the table's 696,000 km.
 *  6. Optional, from ChaiTables: ray-traced refraction for the actual air (setAtmosphereProvider).
 *     The provider is asked separately for sunrise and sunset, so it can return the morning minimum and
 *     the daytime mean temperature as ChaiTables does (monthlyClimate() builds such a provider from 12
 *     monthly WorldClim-style values). With a provider set, the 34.48' constant is NOT used: the whole
 *     horizon depression (dip + refraction) is ray traced through a standard-lapse atmosphere anchored to
 *     the supplied temperature and pressure. In ISA air this gives 32.9' at sea level - the same value as
 *     Sweer's integral and van der Werf's ray tracing used by ChaiTables - and it reproduces van der
 *     Werf's scaling laws (T exponent 1.68, P exponent 1.08, falling with altitude) without curve fits.
 *     Note the 34.48' average implicitly assumes colder-than-ISA air; do not combine the two.
 *  7. Optional, from ChaiTables: visible sunrise/sunset over a horizon profile (getVisibleSunrise /
 *     getVisibleSunset). Profile points come from a DEM (distance + height; geometric angle with Earth
 *     curvature plus terrestrial refraction) or are measured apparent angles. Every point of the solar
 *     limb is tested against the profile at its own azimuth (ChaiTables' 2022 limb-sampling fix), and the
 *     refraction for each point is ray traced at its own apparent altitude for the observer's height.
 *     The semidiameter is date-based (ChaiTables' visible branch uses a fixed 16').
 *
 *  8. Optional: air that varies along the path. A provider may return { path: [...] } - weather-model
 *     temperature profiles at several distances along the Sun's azimuth (see path-atmosphere.js and
 *     refraction-server) - instead of one temperature. Rays are then traced through that 2D field
 *     (RK4 in the vertical plane of the azimuth; agrees with the 1D tracer to ~1-2" (~0.1 s) for uniform
 *     air). chainProviders(a, b, c) uses the first provider that has data.
 *     Sea surface layer (OFF by default, setSeaSurfaceLayer(true)): over water the lowest 2 m follow a
 *     neutral log profile in potential temperature from the water temperature to the 2 m air; rays below
 *     0.5 m (wave crests) count as blocked; over warm water the Sun is taken to vanish at the
 *     inferior-mirage vanishing line, not the sea edge. It omits stability corrections, and over water
 *     colder than the air the grazing ray's refraction through it is ill-conditioned (a sea-level eye's
 *     ray meets the wave line, and 0.2 K of sea temperature moved the elevated sunset by up to a minute),
 *     so it stays off for zmanim until it has been checked against observations. Off, the sea is a
 *     smooth surface at sea level under the weather model's air.
 *  9. Observers below sea level (Jordan Valley, Kinneret, Dead Sea). KosherJava's GeoLocation rejects
 *     negative elevations, so the visible sunrise takes the eye's real height separately (the server's
 *     HorizonSet points carry it; for a plain profile pass options.observerHeightM). Rays are then traced
 *     down to the basin floor instead of to sea level. Sea-level / elevated sunrise treat such an
 *     observer as at sea level (no sea horizon lies below them), as KosherJava's callers clamp anyway.
 * 10. Optional (OFF by default, setHumidity(true)): water vapour. Moist air bends visible light slightly
 *     less than dry air at the same pressure and temperature: refractivity (A P - B e) / T with
 *     B / A = 0.143 (Hohenkerk & Sinclair 1985, as in SLALIB's sla_REFRO; e = vapour pressure). Only
 *     data that carry humidity are affected: a single-temperature spec with dewPointC or
 *     relativeHumidity (vapour then falls off with a 2 km scale height, capped at saturation), or path
 *     profile levels with td (dew point, C) or rh (%). Without such data, or with it off, results are
 *     unchanged to the bit. Size: on the most humid mornings in the US (dew point ~24 C) sunrise comes
 *     ~1.5-2 s later and sunset ~1.5-2 s earlier than in dry air; at the world-record Persian Gulf dew
 *     points ~3 s, up to ~4-5 s when the moist air is a shallow layer over the sea. Elsewhere ~1 s or
 *     less. Small next to temperature profiles and terrain, hence off unless asked for.
 *
 * NOT ported from ChaiTables: its low-precision solar ephemeris (SPA is far better), the 6356.766 km
 * radius, the fixed 16' semidiameter, and the +/-15 s winter "inversion" cushion (a safety margin, not a
 * physical model - add your own margin on top if you want one).
 *
 * NOT changed (checked, negligible): the abridged VSOP87/nutation (max ~2" vs Astronomy Engine) and the
 * Espenak-Meeus delta-T estimate. If you have a trusted delta-T, use setDeltaTOverride().
 */

import { SPACalculator, GeoLocation } from './kosher-zmanim.js';

export const ROY_REFRACTION_ARCMIN = 34.478885263888294;

const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------------
// Sweer (1938), "The Path of a Ray of Light Tangent to the Surface of the Earth", J. Opt. Soc. Am. 28:327.
// Same algorithm as the 'physical' dip model in moon-calc.ts. Used for the default (no provider) path.
// ------------------------------------------------------------------------------------------------
const SWEER_A = 0.000277;                         // Dale-Gladstone constant (5800 A, 15 C, 760 mmHg)
const ISA_T0 = 288.15, ISA_LAPSE = 0.0065, ISA_EXP = 4.2559;
const ISA_RHO11 = Math.pow(216.65 / ISA_T0, ISA_EXP), ISA_H11 = 11000, ISA_SCALE_H = 6341.6;
const SWEER_TOP_M = 45000;

/** @param {number} h metres above sea level @returns {number} density relative to sea-level standard */
function isaDensityRatio(h) {
	return h <= ISA_H11 ? Math.pow(1 - ISA_LAPSE * h / ISA_T0, ISA_EXP)
		: ISA_RHO11 * Math.exp(-(h - ISA_H11) / ISA_SCALE_H);
}
/** @param {number} h @returns {number} |d(rho)/dh| per metre */
function isaDensityGradient(h) {
	return h <= ISA_H11 ? ISA_EXP * ISA_LAPSE / ISA_T0 * Math.pow(1 - ISA_LAPSE * h / ISA_T0, ISA_EXP - 1)
		: isaDensityRatio(h) / ISA_SCALE_H;
}
/**
 * Dip (radians) at height s above the ground for the ray tangent to the surface (Sweer eq. 2).
 * @param {number} s
 * @param {number} g
 * @param {number} R
 */
function sweerDip(s, g, R) {
	const rho0 = isaDensityRatio(g), rho = isaDensityRatio(g + s);
	const mu = 1 + SWEER_A * rho;
	const oneMinusX = (s * mu - R * SWEER_A * (rho0 - rho)) / ((R + s) * mu);   // cancellation-free form
	return 2 * Math.asin(Math.sqrt(Math.max(oneMinusX, 0) / 2));
}
/**
 * Refraction (radians) accumulated by that ray between the ground and height s (Sweer eq. 4).
 * @param {number} s
 * @param {number} g
 * @param {number} R
 */
function sweerDelta(s, g, R, steps = 400) {
	if (s <= 0) return 0;
	const ds = Math.sqrt(s) / steps;                // z = u^2 removes the 1/sqrt(z) singularity
	let sum = 0;
	for (let i = 0; i < steps; i++) {
		const u = (i + 0.5) * ds, z = u * u;
		const mu = 1 + SWEER_A * isaDensityRatio(g + z);
		sum += (SWEER_A * isaDensityGradient(g + z) / mu) / Math.tan(sweerDip(z, g, R)) * 2 * u * ds;
	}
	return sum;
}
/**
 * @param {number} heightM observer height above the horizon surface
 * @param {number} groundElevM elevation of that surface above sea level (0 for KosherJava's sea-level horizon)
 * @param {number} R radius of curvature, metres
 * @returns {{dipDeg:number, refractionRatio:number}} refractionRatio = (delta_inf + delta(h)) / delta_inf
 */
export function sweerHorizon(heightM, groundElevM, R) {
	const h = Math.max(0, heightM);
	if (h === 0) return { dipDeg: 0, refractionRatio: 1 };
	const dInf = sweerDelta(SWEER_TOP_M, groundElevM, R, 800);
	return {
		dipDeg: sweerDip(h, groundElevM, R) * 180 / Math.PI,
		refractionRatio: (dInf + sweerDelta(h, groundElevM, R)) / dInf
	};
}

// ------------------------------------------------------------------------------------------------
// General ray tracer (ChaiTables / van der Werf physics, without their curve fits)
//
// Spherically symmetric atmosphere: standard 6.5 K/km lapse to 11 km, isothermal above, hydrostatic
// pressure, n - 1 proportional to density (Gladstone-Dale, same constant as Sweer). Refraction of a ray
// leaving the observer at apparent altitude a is integral of (-dn/dr / n) tan z dr with Bouguer's
// invariant n r sin z = const. Rays below the horizontal are integrated down to their perigee and back.
// ------------------------------------------------------------------------------------------------
const GLADSTONE_A = SWEER_A, G0 = 9.80665, R_DRY = 287.053, P_EXP = G0 / (R_DRY * ISA_LAPSE);
const RAY_TOP_M = 90000;
/** n - 1 = REFR_K (P - VAPOUR_BETA e) / T, with P and e in mb and T in K (header, item 10) */
const REFR_K = GLADSTONE_A * 288.15 / 1013.25;
/** vapour term relative to the dry term at equal partial pressure: 11.2684e-6 / 78.77e-6 (sla_REFRO) */
const VAPOUR_BETA = 0.143;
/** scale height of water vapour above a single measured value (typical 1.5-2.5 km) */
const VAPOUR_SCALE_M = 2000;

/**
 * Saturation vapour pressure over water (mb) at a temperature (C), Bolton (1980).
 * @param {number} tC
 */
export function saturationVapourMb(tC) {
	return 6.112 * Math.exp(17.67 * tC / (tC + 243.5));
}

/**
 * Vapour pressure (mb) from a dew point or a relative humidity at temperature tC; NaN if neither is
 * given. Never above saturation.
 * @param {number} tC @param {number | null | undefined} dewPointC @param {number | null | undefined} rhPercent
 */
export function vapourPressureMb(tC, dewPointC, rhPercent) {
	const es = saturationVapourMb(tC);
	if (Number.isFinite(dewPointC)) return Math.min(saturationVapourMb(/** @type {number} */ (dewPointC)), es);
	if (Number.isFinite(rhPercent)) return Math.min(Math.max(/** @type {number} */ (rhPercent), 0), 100) / 100 * es;
	return NaN;
}

/**
 * @typedef {{ temperatureC: number, pressureMb?: number, heightM?: number, dewPointC?: number,
 *             relativeHumidity?: number } | { path: PathProfile[], key?: string }} AtmosphereSpec
 *   Either one temperature (temperatureC / pressureMb: air at heightM metres above sea level, default the
 *   observer's height; pressureMb defaults to the standard pressure for that height), or `path`: weather-
 *   model profiles at several distances along the Sun's azimuth (see createPathAtmosphere).
 *   dewPointC / relativeHumidity (%): the air's moisture at heightM; used only with setHumidity(true).
 * @typedef {{ T0: number, P0: number, nm1: (h:number)=>number, dndh: (h:number)=>number, key: string }} Atmosphere
 */

/**
 * Standard-atmosphere pressure (mb) at a height.
 * @param {number} heightM
 */
export function standardPressure(heightM) {
	return 1013.25 * Math.pow(1 - ISA_LAPSE * heightM / ISA_T0, P_EXP);
}

/**
 * Build the refractivity profile for a given surface temperature / pressure.
 * @param {number} temperatureC
 * @param {number} pressureMb
 * @param {number} heightM height at which temperatureC / pressureMb apply
 * @param {number} [vapourMb] water vapour pressure at heightM (mb); 0 / omitted = dry air (header, item 10).
 *   Above and below it falls off with a 2 km scale height, never above saturation.
 * @returns {Atmosphere}
 */
export function createAtmosphere(temperatureC, pressureMb, heightM, vapourMb = 0) {
	const Ts = temperatureC + 273.15;
	const T0 = Ts + ISA_LAPSE * heightM, P0 = pressureMb / Math.pow(Ts / T0, P_EXP);
	const T11 = T0 - ISA_LAPSE * ISA_H11, P11 = P0 * Math.pow(T11 / T0, P_EXP), H = R_DRY * T11 / G0;
	/** @param {number} h @returns {[number, number, number]} T, P, d(ln(n-1))/dh */
	const state = h => {
		if (h <= ISA_H11) {
			const T = T0 - ISA_LAPSE * h;
			return [T, P0 * Math.pow(T / T0, P_EXP), (ISA_LAPSE - G0 / R_DRY) / T];
		}
		return [T11, P11 * Math.exp(-(h - ISA_H11) / H), -1 / H];
	};
	if (!(vapourMb > 0)) {
		return {
			T0, P0,
			key: T0.toFixed(4) + '|' + P0.toFixed(4),
			nm1(h) { const s = state(h); return GLADSTONE_A * (s[1] / 1013.25) * (288.15 / s[0]); },
			dndh(h) { const s = state(h); return GLADSTONE_A * (s[1] / 1013.25) * (288.15 / s[0]) * s[2]; },
		};
	}
	/** T, P, dT/dh, dP/dh, e, de/dh @param {number} h @returns {[number, number, number, number, number, number]} */
	const moist = h => {
		const [T, P] = state(h);
		const dT = h <= ISA_H11 ? -ISA_LAPSE : 0, dP = -P * G0 / (R_DRY * T);
		let e = vapourMb * Math.exp(-(h - heightM) / VAPOUR_SCALE_M), de = -e / VAPOUR_SCALE_M;
		const tC = T - 273.15, es = saturationVapourMb(tC);
		if (es < e) { e = es; de = es * 17.67 * 243.5 / ((tC + 243.5) * (tC + 243.5)) * dT; }
		return [T, P, dT, dP, e, de];
	};
	return {
		T0, P0,
		key: T0.toFixed(4) + '|' + P0.toFixed(4) + '|e' + vapourMb.toFixed(4) + '@' + heightM.toFixed(1),
		nm1(h) { const [T, P, , , e] = moist(h); return REFR_K * (P - VAPOUR_BETA * e) / T; },
		dndh(h) {
			const [T, P, dT, dP, e, de] = moist(h);
			return REFR_K * ((dP - VAPOUR_BETA * de) / T - (P - VAPOUR_BETA * e) * dT / (T * T));
		},
	};
}

/**
 * Built path media, per profile array. Providers hand back the same array for a date / event, and this is
 * called on every sunrise / sunset calculation: rebuilding the columns each time cost more than the
 * cached ray trace the medium feeds (and a path medium does not depend on the observer's height).
 * One cache per combination of the sea-surface-layer and humidity settings.
 * @type {WeakMap<object, Medium>[]}
 */
const pathMediumCache = [new WeakMap(), new WeakMap(), new WeakMap(), new WeakMap()];

/**
 * @param {number} heightM @param {AtmosphereSpec | null | undefined} spec
 * @param {boolean} [surfaceLayer] model the sea surface layer over water (see header, item 8)
 * @param {boolean} [humidity] use the water vapour the spec carries (see header, item 10)
 * @returns {Medium}
 */
function atmosphereFromSpec(heightM, spec, surfaceLayer = false, humidity = false) {
	if (!spec) return mediumOf(createAtmosphere(ISA_T0 - 273.15, 1013.25, 0));
	if ('path' in spec) {
		const cache = pathMediumCache[(surfaceLayer ? 1 : 0) + (humidity ? 2 : 0)];
		let medium = cache.get(spec.path);
		if (!medium) {
			medium = createPathAtmosphere(spec.path, spec.key, { surfaceLayer, humidity });
			cache.set(spec.path, medium);
		}
		return medium;
	}
	const h = spec.heightM ?? heightM;
	const e = humidity ? vapourPressureMb(spec.temperatureC, spec.dewPointC, spec.relativeHumidity) : 0;
	return mediumOf(createAtmosphere(spec.temperatureC, spec.pressureMb ?? standardPressure(h), h, Number.isFinite(e) ? e : 0));
}

/**
 * Total refraction (degrees) of the ray leaving an observer at height ho (m) with apparent altitude
 * aDeg, out to the top of the atmosphere. NaN if the ray meets the surface before its perigee.
 * @param {Atmosphere} atm
 * @param {number} ho observer height above sea level (may be negative in a depression)
 * @param {number} aDeg
 * @param {number} R radius of curvature, metres
 * @param {number} [steps]
 * @param {number} [floorM] height of the lowest surface the ray can reach (0 = the sea; a basin floor
 *   below sea level for an observer in a depression)
 */
export function rayRefraction(atm, ho, aDeg, R, steps = 600, floorM = 0) {
	const a = aDeg * DEG, ro = R + ho, Rb = R + floorM;
	const k = (1 + atm.nm1(ho)) * ro * Math.cos(a);
	/** @param {number} r */
	const nr = r => (1 + atm.nm1(r - R)) * r;
	/** @param {number} r */
	const g = r => {
		const n = 1 + atm.nm1(r - R), q = n * r, d = q * q - k * k;
		// d <= 0 only within rounding of the perigee, where the u^2 substitution leaves the integrand finite
		return d > 0 ? -atm.dndh(r - R) / n * k / Math.sqrt(d) : 0;
	};
	/** integral from rb (singular end) to re, substituting r = rb + u^2 @param {number} rb @param {number} re @param {number} m */
	const seg = (rb, re, m) => {
		const du = Math.sqrt(re - rb) / m;
		let s = 0;
		for (let i = 0; i < m; i++) { const u = (i + 0.5) * du; s += g(rb + u * u) * 2 * u * du; }
		return s;
	};
	let total;
	if (a < 0) {
		if (nr(Rb) > k) return NaN;
		let lo = Rb, hi = ro;
		for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (nr(mid) < k) lo = mid; else hi = mid; }
		total = 2 * seg(hi, ro, Math.max(60, steps >> 2)) + seg(ro, R + RAY_TOP_M, steps);
	} else {
		total = seg(ro, R + RAY_TOP_M, steps);
	}
	return total / DEG;
}

/**
 * Apparent altitude (degrees, <= 0) of the sea horizon (or, with floorM < 0, of a level basin floor)
 * for an observer at height ho.
 * @param {Atmosphere} atm @param {number} ho @param {number} R @param {number} [floorM]
 */
export function seaHorizonAltitude(atm, ho, R, floorM = 0) {
	if (ho <= floorM) return 0;
	return -Math.acos(Math.min(1, (1 + atm.nm1(floorM)) * (R + floorM) / ((1 + atm.nm1(ho)) * (R + ho)))) / DEG;
}

/**
 * Terrestrial refraction (degrees) toward a target: the ray's curvature (-dn/dh) at the mean height
 * times half the path length. Same physics as the "Wikipedia" formula ChaiTables uses
 * (8.15 L P (0.0342 - lapse) / T^2 arcsec); ChaiTables' L^0.9965 exponent is a fit and is not used.
 * @param {{ dndh: (h: number) => number }} atm any Atmosphere or Medium
 * @param {number} h1 @param {number} h2 @param {number} pathM
 */
export function terrestrialRefraction(atm, h1, h2, pathM) {
	// negative when the air at that height is superadiabatic (rays bend upward): the target looks lower
	return -atm.dndh((h1 + h2) / 2) * pathM / 2 / DEG;
}

/**
 * Geometric (unrefracted) elevation angle, degrees, of a point at surface distance distM and height
 * targetM, seen from observerM, on a sphere of radius R.
 * @param {number} observerM @param {number} targetM @param {number} distM @param {number} R
 */
export function geometricElevation(observerM, targetM, distM, R) {
	const phi = distM / R, rt = R + targetM;
	return Math.atan2(rt * Math.cos(phi) - (R + observerM), rt * Math.sin(phi)) / DEG;
}

// ------------------------------------------------------------------------------------------------
// Path-varying atmosphere (temperature profiles at several distances along the Sun's azimuth)
//
// Each profile is a column of { h (m above sea level), t (C), p (mb) } from a weather model, plus the
// water surface temperature where the column is over water. Between levels T is linear and ln p is
// linear in height; above the top level the standard lapse rate continues; between columns the
// refractivity is interpolated linearly in distance. Over water the lowest 2 m follow a neutral
// logarithmic surface-layer profile from the water temperature to the 2 m air temperature
// (roughness length 1e-4 m; stability corrections are not modelled).
// Rays are traced in the vertical plane of the azimuth with RK4 in polar coordinates.
// ------------------------------------------------------------------------------------------------

/**
 * @typedef {{ h: number, t: number, p: number, td?: number | null, rh?: number | null }} ProfileLevel
 *   td / rh: dew point (C) or relative humidity (%) at the level; used only with humidity on (header, item 10)
 * @typedef {{ distanceKm: number, water?: boolean, skinC?: number | null, levels: ProfileLevel[] }} PathProfile
 * @typedef {{ key: string, nm1: (h:number)=>number, dndh: (h:number)=>number,
 *             refraction: (ho:number, aDeg:number, R:number, floorM?:number)=>number,
 *             seaHorizon: (ho:number, R:number, floorM?:number)=>number }} Medium
 */

const SURFACE_Z0H = 1e-4;
const PATH_TOP_M = 60000;
// Over water, rays passing below typical wave-crest height are treated as blocked. Without this the
// "sea horizon" would hinge on the bottom millimetres of air over a perfectly smooth sphere.
const WAVE_CLEARANCE_M = 0.5;

/**
 * ln(vapour pressure) at every level, or null when no level carries humidity. Levels without it get it
 * from their neighbours: ln e linear in height between known levels, the 2 km scale height above the
 * highest, the lowest known value below it.
 * @param {{z:number, T:number}[]} pts @param {ProfileLevel[]} levels same order as pts
 * @returns {number[] | null}
 */
function vapourColumn(pts, levels) {
	const le = levels.map((l, i) => {
		const e = vapourPressureMb(pts[i].T - 273.15, l.td, l.rh);
		return e > 0 ? Math.log(e) : NaN;
	});
	const known = le.map((v, i) => Number.isFinite(v) ? i : -1).filter(i => i >= 0);
	if (!known.length) return null;
	return le.map((v, i) => {
		if (Number.isFinite(v)) return v;
		const lo = known.filter(k => k < i).pop(), hi = known.find(k => k > i);
		if (lo != null && hi != null) return le[lo] + (le[hi] - le[lo]) * (pts[i].z - pts[lo].z) / (pts[hi].z - pts[lo].z);
		if (lo != null) return le[lo] - (pts[i].z - pts[lo].z) / VAPOUR_SCALE_M;
		return le[/** @type {number} */ (hi)];
	});
}

/** @param {PathProfile} prof @param {boolean} surfaceLayer @param {boolean} [humidity] */
function buildColumn(prof, surfaceLayer, humidity = false) {
	const levels = (prof.levels ?? [])
		.filter(l => Number.isFinite(l.h) && Number.isFinite(l.t) && Number.isFinite(l.p) && l.p > 0)
		.sort((a, b) => a.h - b.h)
		.filter((l, i, arr) => i === 0 || l.h > arr[i - 1].h + 1e-6);
	/** @type {{z:number, T:number, lp:number, le?:number}[]} */
	let pts = levels.map(l => ({ z: l.h, T: l.t + 273.15, lp: Math.log(l.p) }));
	if (!pts.length) throw new Error('Path profile has no usable levels');
	const vap = humidity ? vapourColumn(pts, levels) : null;
	if (vap) pts.forEach((q, i) => { q.le = vap[i]; });
	const s = pts[0];
	if (surfaceLayer && prof.water && Number.isFinite(prof.skinC) && s.z > 0 && s.z <= 10) {
		// log profile in potential temperature (theta = T + GAMMA_D z), so equal water and air temperatures
		// give the dry-adiabatic (neutral) lapse rate rather than an isothermal layer
		const GAMMA_D = G0 / 1004.7;
		const Ts = /** @type {number} */ (prof.skinC) + 273.15, L = Math.log(1 + s.z / SURFACE_Z0H);
		const dTheta = s.T + GAMMA_D * s.z - Ts;
		const low = [0, 0.002, 0.01, 0.03, 0.1, 0.3, 0.7, 1.2].filter(z => z < s.z * 0.95).map(z => {
			const T = Ts + dTheta * Math.log(1 + z / SURFACE_Z0H) / L - GAMMA_D * z;
			// vapour held at the lowest level's (the 2 m air's) value through the surface layer
			return { z, T, lp: s.lp + (s.z - z) * G0 / (R_DRY * (T + s.T) / 2), le: s.le };
		});
		pts = low.concat(pts);
	}
	const top = pts[pts.length - 1];
	const eOf = (/** @type {{le?: number}} */ q) => vap && Number.isFinite(q.le) ? Math.exp(/** @type {number} */ (q.le)) : 0;
	const above = createAtmosphere(top.T - 273.15, Math.exp(top.lp), top.z, eOf(top));
	const bottom = pts[0];
	const below = createAtmosphere(bottom.T - 273.15, Math.exp(bottom.lp), bottom.z, eOf(bottom));
	const zs = pts.map(q => q.z);
	/** N = n - 1 and dN/dz at height z (exact for this column model) @param {number} z @returns {[number, number]} */
	const exact = z => {
		if (z >= top.z) return [above.nm1(z), above.dndh(z)];
		if (z <= bottom.z) return [below.nm1(z), below.dndh(z)];
		let lo = 0, hi = zs.length - 1;
		while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zs[m] <= z) lo = m; else hi = m; }
		const a = pts[lo], b = pts[hi], dz = b.z - a.z, f = (z - a.z) / dz;
		const dT = (b.T - a.T) / dz, dlp = (b.lp - a.lp) / dz;
		const T = a.T + dT * f * dz, P = Math.exp(a.lp + dlp * f * dz);
		if (!vap) {
			const N = GLADSTONE_A * (P / 1013.25) * (288.15 / T);
			return [N, N * (dlp - dT / T)];
		}
		// moist: ln e linear in height between levels (header, item 10)
		const dle = (/** @type {number} */ (b.le) - /** @type {number} */ (a.le)) / dz;
		const e = Math.exp(/** @type {number} */ (a.le) + dle * f * dz);
		const N = REFR_K * (P - VAPOUR_BETA * e) / T;
		return [N, REFR_K * (P * dlp - VAPOUR_BETA * e * dle) / T - N * dT / T];
	};
	// Tabulate for speed: 2 m steps to 3 km, 20 m steps to the top. The lowest few metres (the
	// surface layer over water) stay exact; elsewhere linear interpolation is far below 0.01".
	const Z1 = 3000, D1 = 2, D2 = 20, ZEXACT = 3;
	const n1 = Z1 / D1, n2 = Math.ceil((PATH_TOP_M + 2000 - Z1) / D2);
	const tN = new Float64Array(n1 + n2 + 2), tD = new Float64Array(n1 + n2 + 2);
	for (let i = 0; i <= n1 + n2 + 1; i++) {
		const z = i <= n1 ? i * D1 : Z1 + (i - n1) * D2;
		const v = exact(z);
		tN[i] = v[0]; tD[i] = v[1];
	}
	return (/** @type {number} */ z) => {
		if (z < ZEXACT) return exact(z);
		const x = z < Z1 ? z / D1 : n1 + (z - Z1) / D2;
		const i = Math.floor(x);
		if (i >= n1 + n2 + 1) return exact(z);
		const f = x - i;
		return [tN[i] + (tN[i + 1] - tN[i]) * f, tD[i] + (tD[i + 1] - tD[i]) * f];
	};
}

/** small string hash for cache keys @param {string} s */
function hashString(s) {
	let h = 5381;
	for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
	return (h >>> 0).toString(36);
}

/**
 * Atmosphere that varies along the path, from profiles at increasing distances (km) along the Sun's
 * azimuth. The first profile should be at (or near) the observer.
 * @param {PathProfile[]} profiles
 * @param {string} [key] cache key; derived from the data when omitted
 * @param {{ surfaceLayer?: boolean, humidity?: boolean }} [options] surfaceLayer: model the sea surface
 *   layer, wave crests and inferior mirages over water (default true here; ROYSPACalculator turns it off
 *   unless asked, see header item 8). humidity: use the levels' td / rh (default false; header, item 10)
 * @returns {Medium}
 */
export function createPathAtmosphere(profiles, key, options = {}) {
	const surfaceLayer = options.surfaceLayer ?? true;
	const humidity = options.humidity ?? false;
	const sorted = [...profiles].sort((a, b) => a.distanceKm - b.distanceKm);
	if (!sorted.length) throw new Error('No path profiles');
	const ds = sorted.map(p => p.distanceKm * 1000);
	const cols = sorted.map(p => buildColumn(p, surfaceLayer, humidity));
	const moist = humidity && sorted.some(p => (p.levels ?? []).some(l => Number.isFinite(l.td) || Number.isFinite(l.rh)));
	/** N, dN/dz, dN/dd at height z and ground distance d @param {number} z @param {number} d @returns {[number, number, number]} */
	const field = (z, d) => {
		if (cols.length === 1 || d <= ds[0]) { const c = cols[0](z); return [c[0], c[1], 0]; }
		const last = ds.length - 1;
		if (d >= ds[last]) { const c = cols[last](z); return [c[0], c[1], 0]; }
		let j = 0;
		while (ds[j + 1] < d) j++;
		const w = (d - ds[j]) / (ds[j + 1] - ds[j]);
		const a = cols[j](z), b = cols[j + 1](z);
		return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, (b[0] - a[0]) / (ds[j + 1] - ds[j])];
	};

	/**
	 * Trace a ray from height ho with apparent altitude aDeg. Returns the refraction (degrees), or NaN
	 * if the ray comes down to the surface (sea level, or floorM in a basin below sea level).
	 * @param {number} ho @param {number} aDeg @param {number} R @param {number} [floorM]
	 */
	const trace = (ho, aDeg, R, floorM = 0) => {
		const blockedBelow = floorM < 0 ? () => floorM : clearance;
		// state: r (radius), th (central angle travelled), b (ray elevation above the local horizontal)
		let dr = 0, dth = 0, db = 0;
		/** derivatives d/ds into dr, dth, db @param {number} r @param {number} th @param {number} b */
		const f = (r, th, b) => {
			const F = field(r - R, R * th), cb = Math.cos(b), sb = Math.sin(b);
			dr = sb; dth = cb / r; db = cb / r + (F[1] * cb - (R / r) * F[2] * sb) / (1 + F[0]);
		};
		let r = R + ho, th = 0, b = aDeg * DEG;
		for (let i = 0; i < 200000 && r - R <= PATH_TOP_M; i++) {
			const s = Math.min(2000, 80 + 0.3 * (r - R));
			f(r, th, b); const r1 = dr, t1 = dth, b1 = db;
			f(r + s / 2 * r1, th + s / 2 * t1, b + s / 2 * b1); const r2 = dr, t2 = dth, b2 = db;
			f(r + s / 2 * r2, th + s / 2 * t2, b + s / 2 * b2); const r3 = dr, t3 = dth, b3 = db;
			f(r + s * r3, th + s * t3, b + s * b3);
			r += s / 6 * (r1 + 2 * r2 + 2 * r3 + dr);
			th += s / 6 * (t1 + 2 * t2 + 2 * t3 + dth);
			b += s / 6 * (b1 + 2 * b2 + 2 * b3 + db);
			if (r - R < blockedBelow(R * th)) return NaN;
		}
		return aDeg - (b - th) / DEG;
	};

	// without the surface layer the sea is a smooth surface at sea level: no wave crests, no mirage
	const water = sorted.map(p => surfaceLayer && !!p.water);
	// an inferior mirage needs water warmer than the air above it
	const warmWater = surfaceLayer && sorted.some(p => p.water && Number.isFinite(p.skinC) && p.levels?.length
		&& /** @type {number} */ (p.skinC) > p.levels[0].t);
	/** blocking height of the surface at ground distance d (nearest profile decides water / land) @param {number} d */
	const clearance = d => {
		let j = 0;
		while (j < ds.length - 1 && Math.abs(ds[j + 1] - d) < Math.abs(ds[j] - d)) j++;
		return water[j] ? WAVE_CLEARANCE_M : 0;
	};
	const near = cols[0];
	return {
		key: (key ?? 'path|' + hashString(JSON.stringify(sorted))) + (surfaceLayer ? '|sl' : '') + (moist ? '|h' : ''),
		nm1: z => near(z)[0],
		dndh: z => near(z)[1],
		refraction: trace,
		// Apparent altitude of the lowest direction in which the Sun can be seen. Normally that is the
		// sea horizon (the ray grazing the water). Over water warmer than the air, rays aimed just above
		// the water curve back up (inferior mirage); the Sun then vanishes where it meets its mirror image,
		// at the apparent altitude whose ray reaches the lowest true altitude (the "vanishing line").
		seaHorizon(ho, R, floorM = 0) {
			if (ho <= floorM) return 0;
			const tr = (/** @type {number} */ a) => trace(ho, a, R, floorM);
			// bracket around the estimate for an atmosphere like the observer's column, widening if needed
			const n0 = 1 + near(floorM)[0], no = 1 + near(ho)[0];
			const est = -Math.acos(Math.min(1, n0 * (R + floorM) / (no * (R + ho)))) / DEG;
			const geo = Math.acos((R + floorM) / (R + ho)) / DEG;
			let lo = est - 0.005, hi = est + 0.005;
			while (Number.isNaN(tr(hi)) && hi < 0.5) { lo = hi; hi += 0.1; }
			while (!Number.isNaN(tr(lo)) && lo > -2 * geo - 1) { hi = lo; lo -= 0.1; }
			if (!Number.isNaN(tr(lo))) return lo;                             // nothing reaches the surface
			// bisect to 1e-5 deg (0.04") - far below anything visible
			while (hi - lo > 1e-5) { const m = (lo + hi) / 2; if (Number.isNaN(tr(m))) lo = m; else hi = m; }
			const aHit = hi + 1e-7;
			if (!warmWater || floorM < 0) return aHit;                        // no mirage possible
			/** true altitude reached by the ray @param {number} a */
			const trueAlt = a => { const x = trace(ho, a, R); return Number.isNaN(x) ? Infinity : a - x; };
			// coarse scan (denser near the water), then golden-section refinement around the minimum
			const span = 0.6, n = 16;
			const as = Array.from({ length: n }, (_, i) => aHit + span * (i / (n - 1)) ** 2);
			const vs = as.map(trueAlt);
			let k = 0;
			for (let i = 1; i < n; i++) if (vs[i] < vs[k]) k = i;
			if (k === 0) return aHit;                                         // normal case: minimum at the water
			let a = as[k - 1], b = as[Math.min(k + 1, n - 1)];
			const gr = (Math.sqrt(5) - 1) / 2;
			let c = b - gr * (b - a), d = a + gr * (b - a), fc = trueAlt(c), fd = trueAlt(d);
			for (let i = 0; i < 14; i++) {
				if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = trueAlt(c); }
				else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = trueAlt(d); }
			}
			return (a + b) / 2;
		},
	};
}

/**
 * The common interface over the 1D (spherically symmetric) atmosphere and the path atmosphere.
 * @param {Atmosphere | Medium} atm @returns {Medium}
 */
function mediumOf(atm) {
	if ('refraction' in atm) return atm;
	return {
		key: atm.key, nm1: atm.nm1, dndh: atm.dndh,
		refraction: (ho, a, R, floorM = 0) => rayRefraction(atm, ho, a, R, 600, floorM),
		seaHorizon: (ho, R, floorM = 0) => seaHorizonAltitude(atm, ho, R, floorM),
	};
}

// ------------------------------------------------------------------------------------------------
// Earth radius of curvature (WGS84)
// ------------------------------------------------------------------------------------------------
const WGS84_A_KM = 6378.137, WGS84_B_KM = 6356.7523142;
const WGS84_E2 = 1 - (WGS84_B_KM * WGS84_B_KM) / (WGS84_A_KM * WGS84_A_KM);

/**
 * Radius of curvature of the WGS84 ellipsoid (km) at a geodetic latitude, in the given azimuth (Euler's
 * formula). Default azimuth 90 = prime-vertical radius, right for sunrise/sunset within ~0.1%.
 * @param {number} latitudeDeg
 * @param {number} [azimuthDeg=90]
 */
export function earthRadiusAtLatitude(latitudeDeg, azimuthDeg = 90) {
	const sinLat = Math.sin(latitudeDeg * DEG);
	const w = 1 - WGS84_E2 * sinLat * sinLat;
	const N = WGS84_A_KM / Math.sqrt(w);
	const M = WGS84_A_KM * (1 - WGS84_E2) / (w * Math.sqrt(w));
	const az = azimuthDeg * DEG;
	return 1 / (Math.cos(az) ** 2 / M + Math.sin(az) ** 2 / N);
}

// ------------------------------------------------------------------------------------------------
// Climate helper (ChaiTables' sunrise = mean daily minimum, sunset = mean daily temperature)
// ------------------------------------------------------------------------------------------------
const MID_MONTH_DOY = [15.5, 45, 74.5, 105, 135.5, 166, 196.5, 227.5, 258, 288.5, 319, 349.5];

/**
 * Interpolate 12 monthly values (assigned to mid-month) to a day of year, wrapping around the year.
 * @param {number[]} values @param {number} doy
 */
function interpolateMonthly(values, doy) {
	for (let i = 0; i < 12; i++) {
		const a = MID_MONTH_DOY[i], b = i < 11 ? MID_MONTH_DOY[i + 1] : MID_MONTH_DOY[0] + 365;
		const d = doy < MID_MONTH_DOY[0] ? doy + 365 : doy;
		if (d >= a && d <= b) return values[i] + (values[(i + 1) % 12] - values[i]) * (d - a) / (b - a);
	}
	return values[0];
}

/**
 * Build an atmosphere provider from monthly climate normals (e.g. WorldClim 2 tmin / tavg for the
 * location), following ChaiTables: sunrise uses the mean daily minimum, sunset the mean temperature.
 * Values are taken to be at the observer's height unless heightM gives the height they were measured
 * at (e.g. a weather station's elevation); they are then carried to the observer along the standard
 * lapse rate. Optional sunriseDewC / sunsetDewC (12 monthly dew points, C) add the air's moisture, used
 * only by a calculator with setHumidity(true).
 * @param {{ minC: number[], meanC: number[], pressureMb?: number, heightM?: number,
 *           sunriseDewC?: number[], sunsetDewC?: number[] }} normals
 * @returns {(date: Temporal.PlainDate, event: 'sunrise'|'sunset') => AtmosphereSpec}
 */
export function monthlyClimate(normals) {
	if (normals.minC?.length !== 12 || normals.meanC?.length !== 12) throw new Error('minC and meanC need 12 monthly values');
	return (date, event) => {
		const doy = date.dayOfYear;
		/** @type {{ temperatureC: number, pressureMb?: number, heightM?: number, dewPointC?: number }} */
		const spec = { temperatureC: interpolateMonthly(event === 'sunrise' ? normals.minC : normals.meanC, doy) };
		if (normals.pressureMb != null) spec.pressureMb = normals.pressureMb;
		if (normals.heightM != null) spec.heightM = normals.heightM;
		const dew = event === 'sunrise' ? normals.sunriseDewC : normals.sunsetDewC;
		if (dew?.length === 12 && dew.every(Number.isFinite)) spec.dewPointC = interpolateMonthly(dew, doy);
		return spec;
	};
}

/**
 * Combine providers: each is asked in turn and the first non-null answer is used, e.g.
 * chainProviders(serverPaths.provider, nws.provider, monthlyClimate(normals)).
 * @param {...(((date: Temporal.PlainDate, event: 'sunrise'|'sunset', geo: any) => AtmosphereSpec | null | undefined) | null | undefined)} providers
 * @returns {(date: Temporal.PlainDate, event: 'sunrise'|'sunset', geo: any) => AtmosphereSpec | null}
 */
export function chainProviders(...providers) {
	return (date, event, geo) => {
		for (const p of providers) {
			if (!p) continue;
			const spec = p(date, event, geo);
			if (spec) return spec;
		}
		return null;
	};
}

// ------------------------------------------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------------------------------------------
/** Julian day at 0h UT of a calendar date (Meeus ch. 7). @param {{year:number, month:number, day:number}} d */
function julianDay0(d) {
	let y = d.year, m = d.month;
	if (m <= 2) { y -= 1; m += 12; }
	const a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4);
	return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d.day + b - 1524.5;
}
const JD_UNIX_EPOCH = 2440587.5;

/** Simple bounded cache. @template V */
class Cache {
	constructor(limit = 64) { /** @type {Map<string, V>} */ this.map = new Map(); this.limit = limit; }
	/** @param {string} k @param {() => V} make @returns {V} */
	get(k, make) {
		let v = this.map.get(k);
		if (v === undefined) {
			v = make();
			if (this.map.size >= this.limit) this.map.delete(/** @type {string} */ (this.map.keys().next().value));
			this.map.set(k, v);
		}
		return v;
	}
}

/**
 * @typedef {{ limbPoints?: number, stepSeconds?: number, maxGapDeg?: number, inversionCorrection?: boolean,
 *             limb?: 'any' | 'top' | 'bottom' | 'full', observerHeightM?: number }} VisibleOptions
 *   observerHeightM: the eye's height above sea level when it differs from the GeoLocation's elevation -
 *   in practice below sea level, which a GeoLocation cannot hold (HorizonSet points carry it themselves).
 *   limb: which part of the Sun's disk decides the moment (sunrise: first moment it clears the terrain;
 *   sunset: last moment it is still clear):
 *     'any' (default) - any part of the disk: the first / last light an observer sees (on a sloping
 *                       horizon that can be a side of the disk rather than the top)
 *     'top'           - the top of the disk (the upper limb)
 *     'bottom'        - the bottom of the disk (the lower limb)
 *     'full'          - the whole disk (on a sloping horizon, later than 'bottom' at sunrise)
 * @typedef {{ lat: number, lon: number, ground: number, height: number,
 *             sunrise?: HorizonPoint[], sunset?: HorizonPoint[], wins?: Record<string, [number, number][]> }} HorizonSetPoint
 * @typedef {{ mode: 'point' | 'vantage', points: HorizonSetPoint[], params?: any }} HorizonSet
 *   What the server's /v1/horizon returns (see horizon-client.js): the exact point, or the vantage
 *   points within a radius that have the lowest horizon in some direction.
 * @typedef {{ azimuthDeg: number, distanceKm: number, heightM: number }} DemHorizonPoint
 *   A horizon point from a DEM: the highest-angle terrain point at this azimuth, its distance along the
 *   surface and its height above sea level. Elevation angle and terrestrial refraction are computed.
 * @typedef {{ azimuthDeg: number, elevationDeg: number }} ObservedHorizonPoint
 *   A measured (theodolite / photo) apparent elevation angle; used as-is (refraction already included).
 * @typedef {DemHorizonPoint | ObservedHorizonPoint} HorizonPoint
 */

export default class ROYSPACalculator extends SPACalculator {
	/**
	 * @param {{ refractionArcmin?: number, elevationModel?: 'physical'|'kosherjava' }} [options]
	 */
	constructor(options = {}) {
		super();
		this.setRefraction((options.refractionArcmin ?? ROY_REFRACTION_ARCMIN) / 60);
		/** @type {'physical'|'kosherjava'} */
		this._elevationModel = options.elevationModel ?? 'physical';
		this._solarRadiusScale = 1;
		/** @type {((date: Temporal.PlainDate, event: 'sunrise'|'sunset', geoLocation: GeoLocation) => AtmosphereSpec | null | undefined) | null} */
		this._atmosphereProvider = null;
		/** @type {'sunrise'|'sunset'|null} */
		this._event = null;
		/** @type {GeoLocation} */
		this._geo = null;
		/** @type {Cache<{dip:number, refr:number}>} */
		this._horizonCache = new Cache(256);
		/** @type {Cache<{a0:number, step:number, refr:Float64Array}>} */
		this._refrTableCache = new Cache(64);
		this._seaSurfaceLayer = false;
		this._humidity = false;
	}

	/**
	 * Include water vapour in the refractivity wherever the atmosphere data carry humidity (header,
	 * item 10). Off by default: at most a few seconds, and only where the data have it.
	 * @param {boolean} on
	 */
	setHumidity(on) {
		this._humidity = !!on;
	}

	/** Whether water vapour is included (see setHumidity). */
	getHumidity() {
		return this._humidity;
	}

	/**
	 * Model the sea surface layer, wave crests and inferior mirages over water in path profiles (header,
	 * item 8). Off by default: unvalidated, and unstable over water colder than the air.
	 * @param {boolean} on
	 */
	setSeaSurfaceLayer(on) {
		this._seaSurfaceLayer = !!on;
	}

	getCalculatorName() {
		return super.getCalculatorName() + ' (ROYZmanim corrections)';
	}

	/**
	 * Sets the per-latitude Earth radius (radius of curvature, east-west). Call when the location changes.
	 * @param {GeoLocation} geoLocation
	 */
	configureForLocation(geoLocation, azimuthDeg = 90) {
		this.setEarthRadius(earthRadiusAtLatitude(geoLocation.getLatitude(), azimuthDeg));
	}

	/**
	 * Use the actual air at sunrise / sunset instead of the 34.48' average (see header, item 6).
	 * The provider receives (date, 'sunrise'|'sunset', geoLocation) and returns
	 * { temperatureC, pressureMb?, heightM?, dewPointC?, relativeHumidity? }, { path }, or null to fall back
	 * to the default model for that event.
	 * Pass null to remove.
	 * @param {((date: Temporal.PlainDate, event: 'sunrise'|'sunset', geoLocation: any) => AtmosphereSpec | null | undefined) | null} provider
	 */
	setAtmosphereProvider(provider) {
		this._atmosphereProvider = provider;
	}

	/**
	 * Shorthand for a constant atmosphere given as sea-level (reduced) values, for both events.
	 * @param {number} pressureMillibars
	 * @param {number} temperatureCelsius
	 */
	setHorizonAtmosphere(pressureMillibars, temperatureCelsius) {
		const spec = { temperatureC: temperatureCelsius, pressureMb: pressureMillibars, heightM: 0 };
		this._atmosphereProvider = () => spec;
	}

	/**
	 * Use a different solar radius than the table's 696,000 km basis, e.g. 695700 (IAU 2015 nominal). null = table.
	 * @param {number | null} km
	 */
	setSolarRadiusKm(km) {
		this._solarRadiusScale = km == null ? 1 : km / 696000;
	}

	/** @param {Temporal.PlainDate | null} date */
	getApparentSolarRadius(date) {
		return super.getApparentSolarRadius(date) * this._solarRadiusScale;
	}

	/** @param {Temporal.PlainDate} date @param {GeoLocation} geoLocation @param {number} zenith @param {boolean} adjustForElevation */
	getUTCSunrise(date, geoLocation, zenith, adjustForElevation) {
		return this._withEvent('sunrise', geoLocation, () => super.getUTCSunrise(date, geoLocation, zenith, adjustForElevation));
	}

	/** @param {Temporal.PlainDate} date @param {GeoLocation} geoLocation @param {number} zenith @param {boolean} adjustForElevation */
	getUTCSunset(date, geoLocation, zenith, adjustForElevation) {
		return this._withEvent('sunset', geoLocation, () => super.getUTCSunset(date, geoLocation, zenith, adjustForElevation));
	}

	/** @param {'sunrise'|'sunset'} event @param {GeoLocation} geo @param {() => number} fn */
	_withEvent(event, geo, fn) {
		const prevE = this._event, prevG = this._geo;
		this._event = event; this._geo = geo;
		try { return fn(); } finally { this._event = prevE; this._geo = prevG; }
	}

	/**
	 * The atmosphere for an event, or null when the default (34.48' + Sweer) model applies.
	 * @param {Temporal.PlainDate | null | undefined} date @param {'sunrise'|'sunset'|null} event @param {GeoLocation} geo @param {number} heightM
	 * @returns {Medium | null}
	 */
	_atmosphereFor(date, event, geo, heightM) {
		if (!this._atmosphereProvider || !date || !event) return null;
		const spec = this._atmosphereProvider(date, event, geo);
		return spec ? atmosphereFromSpec(heightM, spec, this._seaSurfaceLayer, this._humidity) : null;
	}

	/** @param {Medium} atm @param {number} heightM */
	_rayTracedHorizon(atm, heightM) {
		const R = this.getEarthRadius() * 1000;
		return this._horizonCache.get(atm.key + '|' + heightM + '|' + R, () => {
			const dip = -atm.seaHorizon(heightM, R);
			// nudge just above the grazing ray so the tracer does not register it as reaching the sea
			return { dip, refr: atm.refraction(heightM, -dip + (heightM > 0 ? 1e-7 : 0), R) };
		});
	}

	/**
	 * Observed dip of the sea horizon in degrees for an observer `elevationMeters` above it (>= 0).
	 * @param {number} elevationMeters
	 */
	getObservedDip(elevationMeters) {
		return sweerHorizon(elevationMeters, 0, this.getEarthRadius() * 1000).dipDeg;
	}

	/**
	 * Total depression of the Sun's upper limb below the geometric horizon, excluding solar radius, degrees:
	 * observed dip + refraction of the horizon ray. With an atmosphere it is fully ray traced; without, it
	 * is the 34.48' constant scaled by Sweer's ratio (equals the constant at sea level).
	 * @param {number} elevationMeters
	 * @param {Atmosphere | Medium | null} [atmosphere]
	 */
	getHorizonDepression(elevationMeters, atmosphere = null) {
		const h0 = Math.max(0, elevationMeters);
		if (atmosphere) {
			const r = this._rayTracedHorizon(mediumOf(atmosphere), h0);
			const total = r.dip + r.refr;
			// never let odd weather data take sunrise / sunset away: fall back to the default model
			if (Number.isFinite(total)) return total;
		}
		const h = sweerHorizon(h0, 0, this.getEarthRadius() * 1000);
		return h.dipDeg + this.getRefraction() * h.refractionRatio;
	}

	/**
	 * @param {number} zenith
	 * @param {number} elevation
	 * @param {Temporal.PlainDate | null} [date]
	 */
	adjustZenith(zenith, elevation, date) {
		if (zenith !== 90 || this._elevationModel === 'kosherjava') {
			return super.adjustZenith(zenith, elevation, date);
		}
		// Negative elevations (e.g. Dead Sea) are treated as sea level: the horizon model needs height >= 0.
		const heightM = Number.isFinite(elevation) ? Math.max(0, elevation) : 0;
		const atm = this._atmosphereFor(date, this._event, this._geo, heightM);
		return zenith + this.getApparentSolarRadius(date ?? null) + this.getHorizonDepression(heightM, atm);
	}

	// --------------------------------------------------------------------------------------------
	// Visible sunrise / sunset over a horizon profile
	// --------------------------------------------------------------------------------------------

	/**
	 * Visible sunrise: first moment any point of the Sun's limb clears the horizon profile.
	 * @param {Temporal.PlainDate} date
	 * @param {GeoLocation} geoLocation observer; its elevation is the observer's height above sea level
	 * @param {HorizonPoint[] | HorizonSet} profile either horizon points by azimuth (degrees east of north)
	 *   for this observer, or a HorizonSet from the server. With a set in 'vantage' mode the result is the
	 *   earliest sunrise among its points (each seen from its own position and height); in 'point' mode,
	 *   the set's point and height are used. A profile need not cover 360 degrees, but the Sun must rise
	 *   within it: azimuths in a gap wider than maxGapDeg (default 10) count as unknown, and NaN is
	 *   returned if the Sun is there when it would appear.
	 * @param {VisibleOptions} [options]
	 *   limbPoints: points tested around the solar limb (default 24); stepSeconds: scan step (default 10);
	 *   limb: 'any' (default) or 'top' (see VisibleOptions)
	 *   inversionCorrection: apply Keller & Hall's (2022) correction for dawn inversion layers - sunrise
	 *   15 s earlier when the night is longer than 13 h and the Sun rises over a horizon within 0.01 deg
	 *   of horizontal (Computers & Geosciences 161, 105044). Checked against 521 observed sunrises at
	 *   Armon HaNatziv: rms error 13.4 s -> 11.3 s. Use it with temperature-only providers (monthly
	 *   normals, NWS); path profiles from the server already contain any inversion they forecast.
	 * @returns {number} epoch milliseconds (UTC), or NaN if the Sun is not seen to rise that day
	 */
	getVisibleSunrise(date, geoLocation, profile, options = {}) {
		if (!Array.isArray(profile)) return this._fromSet(date, geoLocation, profile, 'sunrise', options)[0]?.epochMs ?? NaN;
		return this._visibleEvent(date, geoLocation, profile, 'sunrise', options);
	}

	/**
	 * Visible sunset: last moment any point of the Sun's limb is above the horizon profile.
	 * @param {Temporal.PlainDate} date
	 * @param {GeoLocation} geoLocation
	 * @param {HorizonPoint[] | HorizonSet} profile as for getVisibleSunrise; with a vantage set, the latest
	 *   sunset among its points
	 * @param {VisibleOptions} [options]
	 * @returns {number} epoch milliseconds (UTC), or NaN
	 */
	getVisibleSunset(date, geoLocation, profile, options = {}) {
		if (!Array.isArray(profile)) return this._fromSet(date, geoLocation, profile, 'sunset', options)[0]?.epochMs ?? NaN;
		return this._visibleEvent(date, geoLocation, profile, 'sunset', options);
	}

	/**
	 * Visible sunrise or sunset from every relevant point of a HorizonSet, best first (earliest sunrise,
	 * latest sunset) - e.g. to show where the time is seen from.
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geoLocation @param {HorizonSet} set
	 * @param {'sunrise'|'sunset'} event @param {VisibleOptions} [options]
	 * @returns {{ epochMs: number, lat: number, lon: number, height: number }[]}
	 */
	getVisibleEvents(date, geoLocation, set, event, options = {}) {
		return this._fromSet(date, geoLocation, set, event, options);
	}

	/**
	 * The three sunrises for a date, in epoch milliseconds (NaN where there is none):
	 *   seaLevel  - observer at sea level at the given coordinates, sea-level horizon
	 *   elevated  - observer at the GeoLocation's elevation, sea horizon (includes the dip)
	 *   visible   - over the terrain (only when a horizon profile or HorizonSet is given)
	 * All use the same refraction model and atmosphere provider.
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geoLocation
	 * @param {HorizonPoint[] | HorizonSet | null} [horizon] @param {VisibleOptions} [options]
	 */
	getSunrises(date, geoLocation, horizon = null, options = {}) {
		return {
			seaLevel: this._utcToEpochMs(date, geoLocation, this.getUTCSunrise(date, geoLocation, 90, false), 'sunrise'),
			elevated: this._utcToEpochMs(date, geoLocation, this.getUTCSunrise(date, geoLocation, 90, true), 'sunrise'),
			visible: horizon ? this.getVisibleSunrise(date, geoLocation, horizon, options) : NaN,
		};
	}

	/**
	 * The three sunsets for a date (see getSunrises).
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geoLocation
	 * @param {HorizonPoint[] | HorizonSet | null} [horizon] @param {VisibleOptions} [options]
	 */
	getSunsets(date, geoLocation, horizon = null, options = {}) {
		return {
			seaLevel: this._utcToEpochMs(date, geoLocation, this.getUTCSunset(date, geoLocation, 90, false), 'sunset'),
			elevated: this._utcToEpochMs(date, geoLocation, this.getUTCSunset(date, geoLocation, 90, true), 'sunset'),
			visible: horizon ? this.getVisibleSunset(date, geoLocation, horizon, options) : NaN,
		};
	}

	/**
	 * UTC hours (modulo 24, as KosherJava returns them) to epoch ms on the right day for this place.
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geo @param {number} hours @param {'sunrise'|'sunset'} event
	 */
	_utcToEpochMs(date, geo, hours, event) {
		if (!Number.isFinite(hours)) return NaN;
		const noon = julianDay0(date) + 0.5 - geo.getLongitude() / 360;           // approximate local noon (JD)
		const target = noon + (event === 'sunrise' ? -0.25 : 0.25);
		let jd = julianDay0(date) + hours / 24;
		while (jd - target > 0.5) jd -= 1;
		while (target - jd > 0.5) jd += 1;
		return (jd - JD_UNIX_EPOCH) * 86400000;
	}

	/**
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geo @param {HorizonSet} set
	 * @param {'sunrise'|'sunset'} event @param {VisibleOptions} options
	 */
	_fromSet(date, geo, set, event, options) {
		if (!set?.points?.length) throw new Error('Not a horizon profile or HorizonSet');
		// A GeoLocation cannot be below sea level; the real height goes to the horizon model separately
		/** @param {HorizonSetPoint} p */
		const pointGeo = p => new GeoLocation(geo.getLocationName(), p.lat, p.lon, Math.max(0, p.height), geo.getTimeZone());
		// The server sends each point's horizon only around the directions it wins (+/- 3 deg), at 0.1 deg
		// steps: never interpolate across what it left out
		const opts = { ...options, maxGapDeg: options.maxGapDeg ?? 0.5 };
		let pts = set.points.filter(p => p[event]?.length);
		if (set.mode === 'vantage' && pts.length > 1) {
			// only points that win near today's rise / set direction need tracing
			const t = this._utcToEpochMs(date, geo, event === 'sunrise' ? this.getUTCSunrise(date, geo, 90, true)
				: this.getUTCSunset(date, geo, 90, true), event);
			if (Number.isFinite(t)) {
				const az0 = this._sunTrue(t / 86400000 + JD_UNIX_EPOCH, geo)[1];
				const near = pts.filter(p => (p.wins?.[event] ?? []).some(([lo, hi]) =>
					((az0 - (lo - 3)) % 360 + 360) % 360 <= ((hi + 3 - (lo - 3)) % 360 + 360) % 360));
				if (near.length) pts = near;
			}
		}
		const out = [];
		for (const p of pts) {
			let ms = NaN;
			try {
				ms = this._visibleEvent(date, pointGeo(p), /** @type {HorizonPoint[]} */ (p[event]), event, opts,
					{ heightM: p.height, groundM: p.ground });
			} catch (e) {
				console.error('Visible ' + event + ' failed for vantage point', p.lat, p.lon, e);
			}
			if (Number.isFinite(ms)) out.push({ epochMs: ms, lat: p.lat, lon: p.lon, height: p.height });
		}
		out.sort((a, b) => event === 'sunrise' ? a.epochMs - b.epochMs : b.epochMs - a.epochMs);
		return out;
	}

	/**
	 * The profile reduced to the true (unrefracted) altitude the Sun must reach at each azimuth.
	 * Exposed for inspection / plotting.
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geoLocation @param {HorizonPoint[]} profile @param {'sunrise'|'sunset'} event
	 * @param {{ heightM?: number, groundM?: number }} [observer] the eye's real height above sea level (and the
	 *   ground's) when the GeoLocation cannot hold it, i.e. below sea level
	 * @returns {{ azimuthDeg: number[], apparentDeg: number[], thresholdDeg: number[] }}
	 */
	getHorizonThresholds(date, geoLocation, profile, event, observer = {}) {
		const ho = Number.isFinite(observer.heightM) ? /** @type {number} */ (observer.heightM) : Math.max(0, geoLocation.getElevation());
		// Rays can reach down to sea level, or in a depression to the basin floor: the lowest of the
		// observer's ground and the terrain heights in the profile (which include the lake where the
		// line of sight crosses it)
		let floorM = 0;
		if (ho < 0) {
			floorM = Math.min(Number.isFinite(observer.groundM) ? /** @type {number} */ (observer.groundM) : ho, ho);
			for (const p of profile) if ('heightM' in p && Number.isFinite(p.heightM)) floorM = Math.min(floorM, p.heightM);
		}
		const R = this.getEarthRadius() * 1000;
		const provided = this._atmosphereFor(date, event, geoLocation, ho);
		const atm = provided ?? atmosphereFromSpec(ho, null);
		// Without a provider, match the default sunrise model: the ISA ray trace scaled so that the
		// sea-level horizon refraction equals getRefraction() (34.48' by default), as Sweer's ratio is.
		const scale = provided ? 1 : this.getRefraction() / this._horizonCache.get('isa0|' + R,
			() => ({ dip: 0, refr: atm.refraction(0, 0, R) })).refr;
		const seaAlt = atm.seaHorizon(ho, R, floorM);
		const pts = profile.map(p => {
			let app;
			if ('elevationDeg' in p && p.elevationDeg != null) {
				app = p.elevationDeg;
			} else {
				const q = /** @type {DemHorizonPoint} */ (p);
				const d = q.distanceKm * 1000;
				const geo = geometricElevation(ho, q.heightM, d, R);
				const path = Math.hypot(d, (R + q.heightM) * Math.cos(d / R) - (R + ho)); // chord length
				app = geo + terrestrialRefraction(atm, ho, q.heightM, path);
			}
			return { az: ((p.azimuthDeg % 360) + 360) % 360, app: Math.max(app, seaAlt) };
		}).sort((a, b) => a.az - b.az);
		if (pts.length < 2) throw new Error('Horizon profile needs at least two points');

		const maxApp = Math.max(...pts.map(p => p.app));
		const table = this._refractionTable(atm, ho, R, seaAlt, maxApp, floorM);
		const tab = table.refr, N = tab.length;
		/** cubic Hermite (Catmull-Rom) interpolation; < 1" from a direct ray trace @param {number} a */
		const refrAt = a => {
			const x = (a - table.a0) / table.step;
			const i = Math.min(Math.max(Math.floor(x), 0), N - 2), t = x - i;
			const p0 = tab[Math.max(i - 1, 0)], p1 = tab[i], p2 = tab[i + 1], p3 = tab[Math.min(i + 2, N - 1)];
			const m1 = i === 0 ? p2 - p1 : (p2 - p0) / 2, m2 = i + 2 > N - 1 ? p2 - p1 : (p3 - p1) / 2;
			const t2 = t * t, t3 = t2 * t;
			return scale * ((2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2);
		};
		return {
			azimuthDeg: pts.map(p => p.az),
			apparentDeg: pts.map(p => p.app),
			thresholdDeg: pts.map(p => p.app - refrAt(p.app)),
		};
	}

	/**
	 * Refraction versus apparent altitude for this observer and air, from the sea horizon upward.
	 * @param {Medium} atm @param {number} ho @param {number} R @param {number} seaAlt @param {number} maxApp
	 * @param {number} [floorM] lowest surface the rays can reach (see getHorizonThresholds)
	 */
	_refractionTable(atm, ho, R, seaAlt, maxApp, floorM = 0) {
		const step = 0.1;
		const top = Math.max(maxApp, seaAlt) + 0.5;
		const n = Math.ceil((top - seaAlt) / step) + 1;
		const key = [atm.key, ho, R, n, floorM].join('|');
		return this._refrTableCache.get(key, () => {
			const refr = new Float64Array(n);
			for (let i = 0; i < n; i++) {
				// the grazing ray itself: nudge up by 1e-7 deg so the perigee solve stays inside the atmosphere
				const a = i === 0 && ho > floorM ? seaAlt + 1e-7 : seaAlt + i * step;
				refr[i] = atm.refraction(ho, a, R, floorM);
			}
			return { a0: seaAlt, step, refr };
		});
	}

	/**
	 * Topocentric true (unrefracted) altitude and azimuth of the Sun's centre.
	 * @param {number} jd UT Julian day @param {GeoLocation} geo @returns {[number, number]}
	 */
	_sunTrue(jd, geo) {
		// @ts-ignore - SPACalculator.topocentric is TypeScript-private but present at runtime
		if (typeof this.topocentric === 'function') {
			// @ts-ignore
			const t = this.topocentric(jd, geo.getLatitude(), geo.getLongitude(), geo.getElevation());
			return [t[0], t[2]];
		}
		// Fallback through the public API: pressure 0 switches SPA's refraction off.
		const T = (globalThis).Temporal;
		if (!T) throw new Error('Temporal is not available for the public-API fallback');
		const inst = T.Instant.fromEpochMilliseconds(Math.round((jd - JD_UNIX_EPOCH) * 86400000));
		const p = this.getPressure();
		this.setPressure(0);
		try { return [this.getSolarElevation(inst, geo), this.getSolarAzimuth(inst, geo)]; }
		finally { this.setPressure(p); }
	}

	/**
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geo @param {HorizonPoint[]} profile
	 * @param {'sunrise'|'sunset'} event @param {VisibleOptions} options
	 * @param {{ heightM?: number, groundM?: number }} [observer] see getHorizonThresholds
	 */
	_visibleEvent(date, geo, profile, event, options, observer = { heightM: options.observerHeightM }) {
		const th = this.getHorizonThresholds(date, geo, profile, event, observer);
		const sd = this.getApparentSolarRadius(date);
		const limb = options.limb ?? 'any';
		if (!['any', 'top', 'bottom', 'full'].includes(limb)) throw new Error(`Unknown limb option '${limb}'`);
		const single = limb === 'top' ? Math.PI / 2 : limb === 'bottom' ? -Math.PI / 2 : null;
		const nLimb = single != null ? 1 : options.limbPoints ?? 24;
		const all = limb === 'full';
		const fine = (options.stepSeconds ?? 10) / 86400;
		const az = th.azimuthDeg, thr = th.thresholdDeg, n = az.length;

		const maxGap = options.maxGapDeg ?? 10;
		/** threshold at an azimuth (circular interpolation); NaN inside a gap wider than maxGap @param {number} a */
		const thresholdAt = a => {
			a = ((a % 360) + 360) % 360;
			/** @type {number} */ let lo;
			/** @type {number} */ let hi;
			if (a < az[0] || a >= az[n - 1]) { lo = n - 1; hi = 0; }
			else {
				lo = 0; hi = n - 1;
				while (hi - lo > 1) { const m = (lo + hi) >> 1; if (az[m] <= a) lo = m; else hi = m; }
			}
			const gap = ((az[hi] - az[lo]) % 360 + 360) % 360;
			if (gap === 0) return Math.max(thr[lo], thr[hi]);
			if (gap > maxGap) return NaN;
			const off = ((a - az[lo]) % 360 + 360) % 360;
			return thr[lo] + (thr[hi] - thr[lo]) * off / gap;
		};
		let outside = false;
		/** @param {number} jd @returns {boolean} */
		const visible = jd => {
			const [alt, azi] = this._sunTrue(jd, geo);
			const c = Math.max(Math.cos(alt * DEG), 1e-6);
			for (let i = 0; i < nLimb; i++) {
				const t = single ?? 2 * Math.PI * i / nLimb;
				const lim = thresholdAt(azi + sd * Math.cos(t) / c);
				if (Number.isNaN(lim)) { outside = true; if (all) return false; continue; }
				const clear = alt + sd * Math.sin(t) >= lim;
				if (clear && !all) return true;        // 'any' / 'top' / 'bottom': this point is enough
				if (!clear && all) return false;       // 'full': every point must be clear
			}
			return all;
		};

		// Local apparent noon as a Julian day (getUTCNoon is modulo 24 h, so pick the right day).
		const jd0 = julianDay0(date);
		const approx = jd0 + 0.5 - geo.getLongitude() / 360;
		const nh = this.getUTCNoon(date, geo) / 24;
		let jdNoon = jd0 + nh;
		for (const k of [-1, 1]) if (Math.abs(jd0 + nh + k - approx) < Math.abs(jdNoon - approx)) jdNoon = jd0 + nh + k;

		const dir = event === 'sunrise' ? 1 : -1;
		const minThr = Math.min(...thr);
		const coarse = 5 / 1440, margin = 1.5;            // the Sun moves < 1.25 deg in 5 min
		let jd = jdNoon - dir * 0.5;
		if (visible(jd)) return NaN;                     // never sets that night / day
		// coarse: advance while the Sun's centre is clearly below every threshold
		while (dir * (jdNoon - jd) > 0 && this._sunTrue(jd + dir * coarse, geo)[0] < minThr - sd - margin) jd += dir * coarse;
		// fine scan
		let prev = jd;
		for (jd = prev + dir * fine; dir * (jdNoon - jd) > 0; prev = jd, jd += dir * fine) {
			if (visible(jd)) break;
		}
		if (dir * (jdNoon - jd) <= 0) return NaN;
		if (outside && Number.isNaN(thresholdAt(this._sunTrue(jd, geo)[1]))) return NaN;
		// bisect between prev (not visible) and jd (visible) to ~1 ms
		let a = prev, b = jd;
		for (let i = 0; i < 30 && Math.abs(b - a) * 86400 > 1e-3; i++) {
			const m = (a + b) / 2;
			if (visible(m)) b = m; else a = m;
		}
		let ms = (b - JD_UNIX_EPOCH) * 86400000;
		if (options.inversionCorrection && event === 'sunrise' && this._inversionLikely(date, geo, th, b)) ms -= 15000;
		return ms;
	}

	/**
	 * Keller & Hall's inversion criteria: night longer than 13 h, and the horizon where the Sun rises
	 * within 0.01 deg of horizontal.
	 * @param {Temporal.PlainDate} date @param {GeoLocation} geo @param {{ azimuthDeg: number[], apparentDeg: number[] }} th
	 * @param {number} jd Julian day of the visible sunrise
	 */
	_inversionLikely(date, geo, th, jd) {
		const rise = this.getUTCSunrise(date, geo, 90, false);
		const set = this.getUTCSunset(date.subtract({ days: 1 }), geo, 90, false);
		const night = ((rise - set) % 24 + 24) % 24;
		if (!(night > 13)) return false;
		const az = this._sunTrue(jd, geo)[1];
		let k = 0;
		for (let i = 1; i < th.azimuthDeg.length; i++) {
			if (Math.abs(th.azimuthDeg[i] - az) < Math.abs(th.azimuthDeg[k] - az)) k = i;
		}
		return th.apparentDeg[k] <= 0.01;
	}
}
