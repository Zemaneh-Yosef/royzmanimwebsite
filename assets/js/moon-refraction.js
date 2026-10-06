// @ts-check
/**
 * moon-refraction.js — weather-aware horizon target for the moon calculator (moon-calc.ts).
 *
 * Worker-safe like refraction-snapshot.js: no network, no localStorage, and its only import is
 * royzmanim-spa-corrections.js (already loaded by anything that uses refraction-snapshot.js).
 *
 * The sun's atmosphere providers answer per (date, 'sunrise' | 'sunset'). A moonrise / moonset can be at
 * any hour, so each moon event borrows the air of the nearest solar event of its local day:
 *   before local noon -> that day's 'sunrise' air
 *   after local noon  -> that day's 'sunset' air
 * This is an approximation: a moonrise at 02:00 is usually a little warmer than the air at sunrise,
 * and one at 22:00 a little colder than at sunset (about 5 s of moonrise per 10 C).
 *
 * The refraction itself is the same physics the sun uses with a provider (ROYSPACalculator's
 * getHorizonDepression): a standard-lapse atmosphere anchored to the given temperature / pressure,
 * ray traced from the observer to the top of the atmosphere (the Moon is effectively at infinity for this).
 *
 * Path specs ({ path: [...] }, weather-model columns along the SUN's azimuth) are not reused along the
 * Moon's azimuth, which can differ by tens of degrees: only the column nearest the observer is kept, reduced
 * to the air at the observer's height.
 *
 *   const target = moonHorizonTarget(provider, geo.getTimeZone(), calc.horizonTarget, geo);
 *   calc.nextMoonRise(start, observer, { mode: 'lit', horizonTarget: target });
 */

import {
	createAtmosphere, rayRefraction, seaHorizonAltitude, standardPressure, earthRadiusAtLatitude
} from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";

/** @typedef {import("./refraction-snapshot.js").AtmosphereSpec} AtmosphereSpec */
/** @typedef {import("./refraction-snapshot.js").AtmosphereProvider} AtmosphereProvider */
/** @typedef {{ latitude: number, height: number }} ObserverLike  astronomy-engine Observer (height = m above sea level) */
/** @typedef {{ date: Date }} TimeLike  astronomy-engine AstroTime */
/** @typedef {(observer: any, metersAboveGround: number, time?: any) => number} HorizonTarget */
/** @typedef {{ temperatureC: number, pressureMb: number, heightM: number }} PointAir */

/**
 * One temperature / pressure at a known height, from either kind of spec.
 * @param {AtmosphereSpec} spec
 * @param {number} observerHeightM
 * @returns {PointAir | null}
 */
function pointAir(spec, observerHeightM) {
	if (!('path' in spec)) {
		const heightM = spec.heightM ?? observerHeightM;
		return { temperatureC: spec.temperatureC, pressureMb: spec.pressureMb ?? standardPressure(heightM), heightM };
	}

	// Path spec: the column nearest the observer, interpolated to the observer's height
	// (T linear, ln p linear in height, as createPathAtmosphere does between levels).
	const column = [...spec.path].sort((a, b) => a.distanceKm - b.distanceKm)[0];
	const levels = column ? [...column.levels].sort((a, b) => a.h - b.h) : [];
	if (!levels.length) return null;

	const h = observerHeightM;
	if (h <= levels[0].h) return { temperatureC: levels[0].t, pressureMb: levels[0].p, heightM: levels[0].h };
	const top = levels[levels.length - 1];
	if (h >= top.h) return { temperatureC: top.t, pressureMb: top.p, heightM: top.h };

	let i = 0;
	while (levels[i + 1].h < h) i++;
	const lo = levels[i], hi = levels[i + 1];
	const w = (h - lo.h) / (hi.h - lo.h);
	return {
		temperatureC: lo.t + (hi.t - lo.t) * w,
		pressureMb: Math.exp(Math.log(lo.p) + (Math.log(hi.p) - Math.log(lo.p)) * w),
		heightM: h
	};
}

/**
 * The air for a moon event at this moment (see the top of the file), at a known height; null when the
 * provider has nothing for that date.
 * @param {AtmosphereProvider | null | undefined} provider
 * @param {string} timeZone
 * @param {any} geo  passed through to the provider
 * @param {number} epochMs
 * @param {number} observerHeightM  height the air is wanted at (used for path specs and specs without heightM)
 * @returns {PointAir | null}
 */
export function airAt(provider, timeZone, geo, epochMs, observerHeightM) {
	if (!provider) return null;
	const local = Temporal.Instant.fromEpochMilliseconds(epochMs).toZonedDateTimeISO(timeZone);
	const spec = provider(local.toPlainDate(), local.hour < 12 ? 'sunrise' : 'sunset', geo);
	const air = spec ? pointAir(spec, observerHeightM) : null;
	return air && Number.isFinite(air.temperatureC) && Number.isFinite(air.pressureMb) ? air : null;
}

/**
 * Geometric altitude (degrees) the Moon's limb must reach, for this air: -(dip + refraction of the
 * horizon ray), ray traced over a horizon surface at the ground's elevation.
 * @param {PointAir} air
 * @param {number} latitude
 * @param {number} groundM elevation of the horizon surface above sea level
 * @param {number} metersAboveGround observer's height above that surface (>= 0)
 */
function rayTracedTarget(air, latitude, groundM, metersAboveGround) {
	const atm = createAtmosphere(air.temperatureC, air.pressureMb, air.heightM);
	// rayRefraction / seaHorizonAltitude measure heights from the sphere they are given; shift the
	// atmosphere so height 0 is the ground, which sits groundM above sea level.
	const shifted = {
		...atm,
		nm1: (/** @type {number} */ h) => atm.nm1(h + groundM),
		dndh: (/** @type {number} */ h) => atm.dndh(h + groundM)
	};
	const R = earthRadiusAtLatitude(latitude) * 1000 + groundM;
	const dip = -seaHorizonAltitude(shifted, metersAboveGround, R);
	// nudge just above the grazing ray so the tracer does not register it as reaching the surface (as the sun does)
	const refr = rayRefraction(shifted, metersAboveGround, -dip + (metersAboveGround > 0 ? 1e-7 : 0), R);
	return -(dip + refr);
}

/**
 * A HorizonTarget for createMoonCalc's nextMoonRise / nextMoonSet / moonEventsForDay that uses the sun's
 * atmosphere provider. Falls back to `fallback` (the calculator's own constant-refraction target) when
 * there is no provider, no time, or the provider has no data for that date.
 *
 * The value is constant within each half-day, which is what nextMoonEvent() expects of a time-dependent target.
 *
 * @param {AtmosphereProvider | null | undefined} provider  e.g. providerFromSnapshot(table, normals)
 * @param {string} timeZone  the location's IANA time zone (decides the local date and morning / evening)
 * @param {HorizonTarget} fallback  usually calc.horizonTarget
 * @param {any} [geo]  GeoLocation, passed through to the provider (some read it)
 * @returns {HorizonTarget}
 */
export function moonHorizonTarget(provider, timeZone, fallback, geo) {
	if (!provider) return fallback;
	/** @type {Map<string, number>} */
	const cache = new Map();

	return (/** @type {ObserverLike} */ observer, metersAboveGround = 0, /** @type {TimeLike | undefined} */ time) => {
		if (!time) return fallback(observer, metersAboveGround, time);

		const air = airAt(provider, timeZone, geo, time.date.getTime(), observer.height);
		if (!air) return fallback(observer, metersAboveGround, time);

		const groundM = observer.height - metersAboveGround;
		const key = [air.temperatureC, air.pressureMb, air.heightM, groundM, metersAboveGround, observer.latitude].join('|');
		let target = cache.get(key);
		if (target === undefined) {
			target = rayTracedTarget(air, observer.latitude, groundM, metersAboveGround);
			if (!Number.isFinite(target)) return fallback(observer, metersAboveGround, time);
			if (cache.size > 256) cache.clear();
			cache.set(key, target);
		}
		return target;
	};
}
