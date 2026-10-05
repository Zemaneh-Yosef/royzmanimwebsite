// @ts-check
/**
 * royzmanim-spa-corrections.js
 *
 * Extends KosherJava's SPACalculator (kosher-zmanim, JavaScript port) with the accuracy corrections
 * discussed for ROYZmanim. Usage:
 *
 *     import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
 *     import { createROYSPACalculator } from "./royzmanim-spa-corrections.js";
 *
 *     const ROYSPACalculator = createROYSPACalculator(KosherZmanim.SPACalculator);
 *     const calc = new ROYSPACalculator();                  // defaults = all corrections on
 *     calc.configureForLocation(geoLocation);               // sets the per-latitude Earth radius
 *     zmanimCalendar.setAstronomicalCalculator(calc);
 *
 * It is a factory (it receives the base class) so this file needs no import path into the library.
 *
 * WHAT IT CHANGES (only the geometric 90 degree zenith, i.e. sunrise/sunset and anything defined from
 * them; depression-angle zmanim such as 16.1 degrees or 7.165 degrees are untouched, as in KosherJava):
 *
 *  1. Refraction constant: 34.478885263888294' (Calendrical Calculations global average) instead of 34'.
 *  2. Elevation model ('physical', default): replaces `refraction + acos(R / (R + h))` with the dip and
 *     horizon-ray refraction from Sweer's (1938) ray equations in a standard atmosphere. KosherJava's
 *     geometric dip is ~10% too large (it ignores terrestrial refraction) and its refraction is the value
 *     for a body at 0 degrees altitude, while the sea horizon seen from above is below that, where
 *     refraction is larger. The second effect dominates: at 800 m the old total depression was ~5.7'
 *     (about 27 s at Jerusalem's latitude, equinox) too shallow. Sea-level results are unchanged.
 *     Validated against Sweer's Table I (dip within his stated 0.5', refraction within 0.06').
 *     Pass { elevationModel: 'kosherjava' } to get the original behaviour back (with the new constant).
 *  3. Earth radius: radius of curvature of the WGS84 ellipsoid along the line of sight (east-west by
 *     default) instead of a single mean radius. Effect on dip is ~0.1% (under 1 s), but it is the correct
 *     quantity. The old ROYZmanim helper divided by a denominator that simplified to exactly 1.
 *  4. Optional: setHorizonAtmosphere(pressureMb, temperatureC) scales the sea-level horizon refraction
 *     for non-standard conditions, using the same factor as the class's elevation/azimuth path. This is a
 *     separate method on purpose: setPressure()/setTemperature() are inert for rise/set in KosherJava, and
 *     they typically hold observer-level values, which would double count with the elevation model.
 *  5. Optional: setSolarRadiusKm(km). The built-in table corresponds to a 696,000 km solar radius (the
 *     IAU 1976 value, still used by the Astronomical Almanac); the IAU 2015 nominal value is 695,700 km
 *     (0.4" smaller, ~0.04 s). Off by default.
 *
 * NOT changed (checked, negligible): the abridged VSOP87/nutation (max ~2" vs Astronomy Engine) and the
 * Espenak-Meeus delta-T estimate (about 75 s for 2026; real value is nearer 69 s, effect < 0.3"). If you
 * have a trusted delta-T, use the base class's setDeltaTOverride().
 */

import { SPACalculator } from './kosher-zmanim.js';

export const ROY_REFRACTION_ARCMIN = 34.478885263888294;

// ------------------------------------------------------------------------------------------------
// Sweer (1938), "The Path of a Ray of Light Tangent to the Surface of the Earth", J. Opt. Soc. Am. 28:327.
// Same algorithm as the 'physical' dip model in moon-calc.ts.
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
	const sinLat = Math.sin(latitudeDeg * Math.PI / 180);
	const w = 1 - WGS84_E2 * sinLat * sinLat;
	const N = WGS84_A_KM / Math.sqrt(w);
	const M = WGS84_A_KM * (1 - WGS84_E2) / (w * Math.sqrt(w));
	const az = azimuthDeg * Math.PI / 180;
	return 1 / (Math.cos(az) ** 2 / M + Math.sin(az) ** 2 / N);
}

/**
 * @param {typeof import('./kosher-zmanim').SPACalculator} SPACalculator the base class, e.g. KosherZmanim.SPACalculator
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
		this._horizonAtmosFactor = 1;      // sea-level horizon refraction scale (1 = standard air)
		this._solarRadiusScale = 1;
	}

	getCalculatorName() {
		return super.getCalculatorName() + ' (ROYZmanim corrections)';
	}

	/**
	   * Sets the per-latitude Earth radius (radius of curvature, east-west). Call when the location changes.
	   * @param {import('./kosher-zmanim').GeoLocation} geoLocation
	   */
	configureForLocation(geoLocation, azimuthDeg = 90) {
		this.setEarthRadius(earthRadiusAtLatitude(geoLocation.getLatitude(), azimuthDeg));
	}

	/**
	   * Scale the sea-level horizon refraction for non-standard air at the horizon, using the same factor as
	   * the class's own refraction model: (P / 1010) * (283 / (273 + T)). Pass sea-level (reduced) values.
	   * @param {number} pressureMillibars
	   * @param {number} temperatureCelsius
	   */
	setHorizonAtmosphere(pressureMillibars, temperatureCelsius) {
		this._horizonAtmosFactor = (pressureMillibars / 1010) * (283 / (273 + temperatureCelsius));
	}

	/**
	   * Use a different solar radius than the table's 696,000 km basis, e.g. 695700 (IAU 2015 nominal). null = table.
	   * @param {number} km
	   */
	setSolarRadiusKm(km) {
		this._solarRadiusScale = km == null ? 1 : km / 696000;
	}

	/**
	   * @param {Temporal.PlainDate} date
	   */
	getApparentSolarRadius(date) {
		return super.getApparentSolarRadius(date) * this._solarRadiusScale;
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
	   * observed dip + refraction of the horizon ray. Equals the plain refraction constant at sea level.
	   * @param {number} elevationMeters
	   */
	getHorizonDepression(elevationMeters) {
		const h = sweerHorizon(elevationMeters, 0, this.getEarthRadius() * 1000);
		return h.dipDeg + this.getRefraction() * this._horizonAtmosFactor * h.refractionRatio;
	}

	/**
	   * @param {number} zenith
	   * @param {number} elevation
	   * @param {Temporal.PlainDate} date
	   */
	adjustZenith(zenith, elevation, date) {
		if (zenith !== 90 || this._elevationModel === 'kosherjava') {
			return super.adjustZenith(zenith, elevation, date);
		}
		// Negative elevations (e.g. Dead Sea) are treated as sea level: the horizon model needs height >= 0.
		const heightM = Number.isFinite(elevation) ? Math.max(0, elevation) : 0;
		return zenith + this.getApparentSolarRadius(date ?? null) + this.getHorizonDepression(heightM);
	}
};