// @ts-check

/**
 * multi-zeman.js — one calculator that stands for several nearby locations.
 *
 * mergeCalcs() wraps one ZemanFunctions per location in a Proxy with the same API. Every call is made on
 * every location's calculator and the results merged:
 *  - a ZonedDateTime (or a {time} wrapper, e.g. a visible sunrise or Tzet Melakha) becomes the mean of
 *    the locations' times; the individual times are kept (see locationTimes) so roundAcrossLocations()
 *    can round each location's time first
 *  - an object (chainDate's new calculator, timeRange, config, coreZC...) becomes another merged view,
 *    so `calc.chainDate(d).timeRange.current.sunrise` is merged too
 *  - anything else (numbers, booleans, Durations, PlainDates) is the first location's
 *
 * With one location mergeCalcs() returns the calculator itself, so a single-location print runs exactly
 * the code it always did.
 */

/** Merged time -> the locations' own times @type {WeakMap<Temporal.ZonedDateTime, Temporal.ZonedDateTime[]>} */
const perLocation = new WeakMap();

/**
 * The individual locations' times behind a merged time (undefined for a single-location time)
 * @param {Temporal.ZonedDateTime} zdt
 */
export function locationTimes(zdt) {
	return perLocation.get(zdt);
}

/**
 * @template T
 * @param {T[]} calcs
 * @returns {T}
 */
export function mergeCalcs(calcs) {
	if (!calcs.length)
		throw new Error("mergeCalcs needs at least one calculator");
	return calcs.length == 1 ? calcs[0] : view(calcs);
}

/** @param {any} value */
function isTemporal(value) {
	const tag = value?.[Symbol.toStringTag];
	return typeof tag == "string" && tag.startsWith("Temporal.");
}

/**
 * @param {any[]} objs
 * @returns {any}
 */
function view(objs) {
	// An empty target, so frozen objects (whose properties a Proxy would have to return unchanged) work too
	return new Proxy(Object.create(Object.getPrototypeOf(objs[0])), {
		has(_target, prop) {
			return prop in objs[0];
		},
		get(_target, prop) {
			const first = objs[0][prop];
			if (typeof first === 'function')
				return (/** @type {any[]} */ ...args) => merge(objs.map(obj => obj[prop](...args)));
			return merge(objs.map(obj => obj[prop]));
		},
		// Writes go to every location (nothing in the print does this today, but it keeps them in step)
		set(_target, prop, value) {
			for (const obj of objs)
				obj[prop] = value;
			return true;
		}
	});
}

/** @param {any} value @returns {Temporal.ZonedDateTime | undefined} */
function timeOf(value) {
	if (value instanceof Temporal.ZonedDateTime)
		return value;
	if (value && value.time instanceof Temporal.ZonedDateTime)
		return value.time;
	return undefined;
}

/** @param {any[]} values */
function merge(values) {
	const first = values[0];

	const times = values.map(timeOf);
	if (times.some(Boolean)) {
		// All plain times: their mean
		if (values.every(value => value instanceof Temporal.ZonedDateTime))
			return meanTime(values);

		// All {time} wrappers: keep the wrapper (callers check for it, e.g. to show seconds) with the time merged
		if (values.every(value => value && !(value instanceof Temporal.ZonedDateTime) && timeOf(value)))
			return view(values);

		// Mixed (one location got a visible sunrise, another fell back to sea level) or some missing:
		// a plain time from whichever locations have one
		return meanTime(/** @type {Temporal.ZonedDateTime[]} */ (times.filter(Boolean)));
	}

	if (first && typeof first == "object" && !Array.isArray(first) && !isTemporal(first)
		&& values.every(value => value && typeof value == "object"))
		return view(values);

	return first;
}

/**
 * @param {Temporal.ZonedDateTime[]} times
 * @returns {Temporal.ZonedDateTime}
 */
function meanTime(times) {
	if (times.length == 1 || times.every(time => time.epochMilliseconds === times[0].epochMilliseconds))
		return times[0];

	const mean = times.reduce((sum, time) => sum + time.epochMilliseconds, 0) / times.length;
	let result = Temporal.Instant.fromEpochMilliseconds(Math.round(mean)).toZonedDateTimeISO(times[0].timeZoneId);
	if (times[0].calendarId !== "iso8601")
		result = result.withCalendar(times[0].calendarId);

	perLocation.set(result, times);
	return result;
}

/**
 * The print's minute rounding, applied to each location before averaging: every location's time is
 * rounded on its own (with `roundOne`, the print's usual rule), the rounded times are averaged, and a
 * mean that falls between minutes goes in the same direction (earlier = down, later = up). A time that
 * isn't merged is just rounded.
 *
 * @param {Temporal.ZonedDateTime} zdt
 * @param {'earlier'|'later'} round
 * @param {(zdt: Temporal.ZonedDateTime, round: 'earlier'|'later') => Temporal.ZonedDateTime} roundOne
 */
export function roundAcrossLocations(zdt, round, roundOne) {
	const times = perLocation.get(zdt);
	if (!times)
		return roundOne(zdt, round);

	const rounded = times.map(time => roundOne(time, round).epochMilliseconds);
	const mean = rounded.reduce((sum, ms) => sum + ms, 0) / rounded.length;

	let result = Temporal.Instant.fromEpochMilliseconds(Math.round(mean)).toZonedDateTimeISO(zdt.timeZoneId);
	if (zdt.calendarId !== "iso8601")
		result = result.withCalendar(zdt.calendarId);

	return result.round({ smallestUnit: "minute", roundingMode: round == "later" ? "ceil" : "floor" });
}
