// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import ROYSPACalculator from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { MathUtils } from "../libraries/kosherZmanim/kosher-zmanim.js";
import TekufahCalculator from "./tekufot.js";

/** @typedef {{minutes: number | null; degree?: number | null}} melakhaTzet */
/** @typedef {import("./refraction-snapshot.js").AtmosphereProvider} AtmosphereProvider */
/** @typedef {import("./refraction-snapshot.js").Horizon} Horizon */
/** @typedef {import("./refraction-snapshot.js").VisibleOptions} VisibleOptions */

/**
 * @typedef {Object} ZemanimConfig
 * @property {boolean} [elevation] use the GeoLocation's elevation for sunrise / sunset
 * @property {boolean} fixedMil fixed (Ohr HaChaim) instead of degree-based (Amudeh Hora'ah) offsets
 * @property {boolean} rtKulah use the earlier of the Rabbenu Tam options
 * @property {melakhaTzet|melakhaTzet[]|null} melakha stringency config(s) for Tzet Melakha
 * @property {number} candleLighting minutes before sunset
 * @property {AtmosphereProvider | null} [atmosphereProvider] actual air at sunrise / sunset (refraction-data.js);
 *   null / omitted = the calculator's default 34.48' model
 * @property {Horizon | null} [horizon] terrain horizon set from the refraction server; enables the visible
 *   sunrise in getNetz(). null / omitted = getNetz() returns sea-level sunrise
 * @property {VisibleOptions} [visibleOptions] passed to getVisibleSunrise (e.g. { limb: 'top' })
 * @property {(date: Temporal.PlainDate) => void} [deferVisibleSunrise] compute visible sunrises elsewhere
 *   (visible-sunrise-client.js): on a cache miss this is called instead of ray tracing here, and getNetz()
 *   returns sea-level sunrise until setCachedVisibleSunrise() delivers the value. Omit to compute inline
 *   (print pages and workers do).
 */

/**
 * Visible sunrises per config object, shared by every instance chainDate() makes from it
 * (they all pass the same config). A new config — e.g. after a forecast refresh — starts a new cache.
 * @type {WeakMap<ZemanimConfig, Map<string, number>>}
 */
const visibleSunriseCache = new WeakMap();

/** @param {ZemanimConfig} config */
function visibleCacheFor(config) {
	let cache = visibleSunriseCache.get(config);
	if (!cache) {
		cache = new Map();
		visibleSunriseCache.set(config, cache);
	}
	return cache;
}

/** @param {Temporal.PlainDate} date */
const visibleCacheKey = (date) => date.withCalendar("iso8601").toString({ calendarName: "never" });

/**
 * Store a visible sunrise computed elsewhere (see ZemanimConfig.deferVisibleSunrise).
 * @param {ZemanimConfig} config the same config object the calendar was built with
 * @param {Temporal.PlainDate} date
 * @param {number} epochMs NaN = no visible sunrise (getNetz() then keeps sea level)
 */
export function setCachedVisibleSunrise(config, date, epochMs) {
	visibleCacheFor(config).set(visibleCacheKey(date), epochMs);
}

/**
 * Values to show while a deferred visible sunrise is being computed (instead of sea level).
 * @type {WeakMap<ZemanimConfig, Map<string, number>>}
 */
const visiblePlaceholders = new WeakMap();

/**
 * When a config replaces another for the same place (e.g. fresh forecast data), keep showing the old
 * visible sunrises until the new ones arrive, so netz doesn't flick to sea level and back.
 * Copies plain numbers: the old config (and the forecast data it holds) can be garbage-collected.
 * @param {ZemanimConfig} newConfig @param {ZemanimConfig | null | undefined} oldConfig
 */
export function seedVisiblePlaceholders(newConfig, oldConfig) {
	if (!oldConfig) return;
	const seeded = new Map(visiblePlaceholders.get(oldConfig));
	for (const [key, ms] of visibleSunriseCache.get(oldConfig) ?? [])
		seeded.set(key, ms);
	if (seeded.size)
		visiblePlaceholders.set(newConfig, seeded);
}

/**
 * One astronomical calculator per config (and latitude), shared by every instance chainDate() makes.
 * With a forecast provider each sunrise / sunset is ray traced through the temperature layers
 * (~10-20 ms each); the calculator caches those traces, so sharing it means a date is traced once per
 * page instead of once per chainDate(). Safe to share: the calculator only holds per-call state inside
 * synchronous calls. Earth radius depends on latitude, hence the inner key.
 * @type {WeakMap<ZemanimConfig, Map<string, ROYSPACalculator>>}
 */
const sharedCalculators = new WeakMap();

/**
 * @param {ZemanimConfig} config
 * @param {KosherZmanim.GeoLocation} geoLocation
 * @returns {ROYSPACalculator}
 */
function calculatorFor(config, geoLocation) {
	let byLatitude = sharedCalculators.get(config);
	if (!byLatitude) {
		byLatitude = new Map();
		sharedCalculators.set(config, byLatitude);
	}
	const latKey = geoLocation.getLatitude().toFixed(6);
	let calc = byLatitude.get(latKey);
	if (!calc) {
		calc = new ROYSPACalculator();
		// The provider changes every sunrise / sunset this calendar computes (sea-level and elevated too),
		// not only the visible sunrise.
		calc.setAtmosphereProvider(config.atmosphereProvider ?? null);
		calc.configureForLocation(geoLocation);
		byLatitude.set(latKey, calc);
	}
	return calc;
}

/** requestIdleCallback where it exists (not Safari, not workers), else a short timeout. @param {() => void} fn */
const whenIdle = (fn) => (typeof requestIdleCallback === "function" ? requestIdleCallback(() => fn(), { timeout: 2000 }) : setTimeout(fn, 50));

/**
 * Sort durations in descending order
 * @param {string | Temporal.Duration | Temporal.DurationLike} a
 * @param {string | Temporal.Duration | Temporal.DurationLike} b
 * @returns {number}
 */
function durationSort(a, b) {
	const pSort = Temporal.Duration.compare(a, b);
	return pSort * -1;
}

class ZemanimMathBase {
	/**
	 * Base class for halachic time calculations
	 * @param {KosherZmanim.GeoLocation} geoLocation - Geographic location
	 * @param {ZemanimConfig} [config] - Configuration options
	 * @param {Temporal.PlainDate} [initialDate] start on this date instead of today (saves computing
	 *   today first when the caller is about to setDate anyway, as chainDate() is)
	 */
	constructor(geoLocation, config = {
		elevation: undefined,
		fixedMil: false,
		rtKulah: true,
		melakha: { minutes: 30, degree: 7.165 },
		candleLighting: 20
	}, initialDate = undefined) {
		this.config = config;

		/** @type {KosherZmanim.ZmanimCalendar} */
		this.coreZC = new KosherZmanim.ZmanimCalendar(geoLocation);
		this.coreZC.setUseElevation(config.elevation);
		if (initialDate)
			this.coreZC.setDate(initialDate);

		/** @type {ROYSPACalculator} */
		this.astroCalc = calculatorFor(config, geoLocation);
		this.coreZC.setAstronomicalCalculator(this.astroCalc);

		/** @type {TekufahCalculator} */
		this.tekufaCalc = new TekufahCalculator(this.coreZC.getDate().withCalendar("hebrew").year);

		/** @type {{
			equinox: {
				dawn: Temporal.Duration;
				nightfall: Temporal.Duration;
				stringentNightfall: Temporal.Duration;
				TzetHakokhavim: Temporal.Duration;

				milLength: Temporal.Duration;
			};
			current: {
				dawn: Temporal.ZonedDateTime;
				sunrise: Temporal.ZonedDateTime;
				hatzoth: Temporal.ZonedDateTime;
				sunset: Temporal.ZonedDateTime;
				nightfall: Temporal.ZonedDateTime;
				tzethakokhavim: Temporal.ZonedDateTime;
				ranges: {
					mga: Temporal.Duration;
					gra: Temporal.Duration
				}
			}
		}} */
		this.timeRange = {
			equinox: {
				dawn: null,
				// We don't need Misheyakir, since it recreates seasonal minutes from within Alot -> Sunrise
				nightfall: null,
				stringentNightfall: null,
				TzetHakokhavim: null,
				
				milLength: null
			},
			current: {
				dawn: null,
				sunrise: null,
				hatzoth: null, // used for Minha Gedola
				sunset: null,
				nightfall: null,
				// no need for Tzet LeHumra here, we don't use it as a base for anything
				tzethakokhavim: null, // for internal purposes, we're going to use the GR"A's distinction between Tzet & Nightfall
				ranges: {
					mga: null,
					gra: null
				}
			}
		}

		this.setGeoLocation(geoLocation);
	}

	/**
	 * Calculate seasonal hour duration at equinox for a given degree
	 * @param {number} degree - Solar angle in degrees
	 * @param {boolean} sunset - If true, calculate from sunset; if false, from sunrise
	 * @returns {Temporal.Duration}
	 */
	durationOfEquinoxDegreeSeasonalHour(degree, sunset) {
		// Cannot use chainDate here - gets called internally, thus creating a loop;
		// instead, we use the coreZC directly, change its date, and then revert
		// to the original date

		const originalDate = this.coreZC.getDate();
		this.coreZC.setDate(originalDate.with({ month: 3, day: 17 }));

		const seasonalHourDegree = this.coreZC.getPercentOfShaahZmanisFromDegrees(degree, sunset);
		this.coreZC.setDate(originalDate);

		return Temporal.Duration.from({
			nanoseconds: Math.trunc(seasonalHourDegree * Temporal.Duration.from({ hours: 1 }).total('nanoseconds'))
		})
	}

	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	setGeoLocation(geoLocation) {
		this.coreZC.setGeoLocation(geoLocation);
		// shared calculators are per latitude: swap rather than reconfigure one other instances use
		this.astroCalc = calculatorFor(this.config, geoLocation);
		this.coreZC.setAstronomicalCalculator(this.astroCalc);

		if (this.config.fixedMil)
			this.timeRange.equinox = {
				dawn: Temporal.Duration.from({ minutes: 72 }),
				nightfall: Temporal.Duration.from({ minutes: 13, seconds: 30 }),
				stringentNightfall: Temporal.Duration.from({ minutes: 20 }), // not used
				TzetHakokhavim: Temporal.Duration.from({ minutes: 72 }),

				milLength: Temporal.Duration.from({ minutes: 18 })
			}
		else
			this.timeRange.equinox = {
				dawn: this.durationOfEquinoxDegreeSeasonalHour(16.04, false),
				nightfall: this.durationOfEquinoxDegreeSeasonalHour(3.7, true),
				stringentNightfall: this.durationOfEquinoxDegreeSeasonalHour(5.075, true),
				TzetHakokhavim: this.durationOfEquinoxDegreeSeasonalHour(16.04, true),

				milLength: this.durationOfEquinoxDegreeSeasonalHour(4.8, true)
			}

		this.setDate(this.coreZC.getDate())
	}

	/**
	 * @param {Temporal.PlainDate} plainDate
	 */
	setDate(plainDate) {
		this.coreZC.setDate(plainDate);
		this.tekufaCalc.setYear(this.coreZC.getDate().withCalendar("hebrew").year)

		this.timeRange.current.sunrise = (this.coreZC.isUseElevation() ? this.coreZC.getSunrise() : this.coreZC.getSeaLevelSunrise());
		this.timeRange.current.sunset = (this.coreZC.isUseElevation() ? this.coreZC.getSunset() : this.coreZC.getSeaLevelSunset());
		this.timeRange.current.ranges.gra = this.timeRange.current.sunrise.until(this.timeRange.current.sunset);

		this.timeRange.current.hatzoth = this.coreZC.getSunTransit();

		const dawnMinTimeRange = maxDuration(
			this.fixedToSeasonal(this.timeRange.equinox.dawn),
			this.config.fixedMil
				? this.fixedToSeasonal(this.timeRange.equinox.dawn)
				: this.timeRange.current.sunrise.since(this.coreZC.getSunriseOffsetByDegrees(98.5))
		);

		const tzetMinTimeRange = maxDuration(
			this.fixedToSeasonal(this.timeRange.equinox.TzetHakokhavim),
			this.config.fixedMil
				? this.fixedToSeasonal(this.timeRange.equinox.TzetHakokhavim)
				: this.timeRange.current.sunrise.since(this.coreZC.getSunsetOffsetByDegrees(98.5))
		);

		this.timeRange.current.dawn = this.timeRange.current.sunrise.subtract(dawnMinTimeRange);
		this.timeRange.current.nightfall = this.timeRange.current.sunset.add(this.fixedToSeasonal(this.timeRange.equinox.nightfall));
		this.timeRange.current.tzethakokhavim = this.timeRange.current.sunset.add(tzetMinTimeRange);

		this.timeRange.current.ranges.mga = this.timeRange.current.dawn.until(this.timeRange.current.tzethakokhavim);
	}

	/**
	 * @param {boolean} useElevation
	 */
	setUseElevation(useElevation) {
		this.coreZC.setUseElevation(useElevation);
		this.setDate(this.coreZC.getDate())
	}

	/**
	 * Visible sunrise over the terrain for the current date, in epoch ms (NaN if there is no horizon set,
	 * or the Sun is not seen to rise). Ray tracing is not cheap, so results are cached per config.
	 * @returns {number}
	 */
	getVisibleSunriseEpochMs() {
		const horizon = this.config.horizon;
		if (!horizon) return NaN;

		// The calculator does its own Julian-day math on year/month/day, so it needs ISO fields
		const date = this.coreZC.getDate().withCalendar("iso8601");
		const key = visibleCacheKey(date);
		const cache = visibleCacheFor(this.config);

		let ms = cache.get(key);
		if (ms === undefined && this.config.deferVisibleSunrise) {
			// computed off-thread; until setCachedVisibleSunrise() fills it in, show the previous config's
			// value if there was one (seedVisiblePlaceholders), else NaN -> getNetz() shows sea level
			this.config.deferVisibleSunrise(date);
			return visiblePlaceholders.get(this.config)?.get(key) ?? NaN;
		}
		if (ms === undefined) {
			try {
				ms = this.astroCalc.getVisibleSunrise(date, this.coreZC.getGeoLocation(), horizon, this.config.visibleOptions);
			} catch (e) {
				console.error("Visible sunrise failed", e);
				ms = NaN;
			}
			cache.set(key, ms);
		}
		return ms;
	}

	/** @returns {this} */
	tomorrow() {
		return this.chainDate(this.coreZC.getDate().add({ days: 1 }));
	}

	/**
	 * @param {Temporal.PlainDate} date
	 * @returns {this}
	 */
	chainDate(date) {
		if (this.coreZC.getDate().equals(date))
			return this;

		// Starts directly on `date` (no detour through today) and shares this instance's calculator caches
		/** @type {this} */
		const calc = new (/** @type {new (geo: KosherZmanim.GeoLocation, config: ZemanimConfig, initialDate?: Temporal.PlainDate) => this} */ (this.constructor))(this.coreZC.getGeoLocation(), this.config, date);

		return calc;
	}

	/**
	 * Compute the days around `date` ahead of time, one day per idle slot, so navigating to them is
	 * instant: their sunrise / sunset ray traces and visible sunrise land in the shared caches.
	 * No-op without refraction data (nothing expensive to warm).
	 * @param {Temporal.PlainDate} date
	 * @param {number} [radius=2] days on each side
	 * @returns {() => void} cancel (call it when the user navigates again, to warm the new neighbours instead)
	 */
	prewarm(date, radius = 2) {
		if (!this.config.atmosphereProvider && !this.config.horizon)
			return () => {};

		// nearest first, alternating: +1, -1, +2, -2, ...
		const offsets = Array.from({ length: radius }, (_, i) => [i + 1, -(i + 1)]).flat();
		let cancelled = false;
		const next = () => {
			if (cancelled || !offsets.length)
				return;
			const day = this.chainDate(date.add({ days: /** @type {number} */ (offsets.shift()) }));
			day.getVisibleSunriseEpochMs(); // fills the same cache getNetz() reads
			whenIdle(next);
		};
		whenIdle(next);
		return () => { cancelled = true; };
	}

	/**
	 * Convert fixed duration to seasonal proportion of the day
	 * @param {Temporal.Duration} portion - Fixed duration (e.g., 1 hour)
	 * @param {Temporal.Duration} [fullDay] - Full day duration (defaults to GRA range)
	 * @returns {Temporal.Duration}
	 */
	fixedToSeasonal(portion, fullDay = this.timeRange.current.ranges.gra) {
		const inputPortionOfDay = portion.total("nanoseconds") / Temporal.Duration.from({ hours: 12 }).total('nanoseconds'); // Length of 12

		return Temporal.Duration.from({
			nanoseconds: Math.trunc(fullDay.total("nanoseconds") * inputPortionOfDay)
		});
	}

	/**
	 * Core calculation for Plag HaMincha (various opinions)
	 * @param {Temporal.ZonedDateTime} time - Reference time (sunset or nightfall)
	 * @returns {Temporal.ZonedDateTime}
	 */
	plagHaminchaCore(time) {
		return time.subtract(this.fixedToSeasonal(Temporal.Duration.from({ hours: 1, minutes: 15 })));
	}

	/**
	 * Get the next tekufah (seasonal turning point)
	 * @param {boolean} [fixedClock] - Use fixed clock (Jerusalem time)
	 * @returns {Temporal.ZonedDateTime|undefined}
	 */
	nextTekufa(fixedClock) {
		const plainTekufoth = this.tekufaCalc.calculateTekufotShemuel(fixedClock);
		const tekufotTZ = plainTekufoth
			.map(temporal => temporal.toZonedDateTime("+02:00").withTimeZone(this.coreZC.getGeoLocation().getTimeZone()))

		return tekufotTZ.find(tekufa => Temporal.ZonedDateTime.compare(this.coreZC.getDate().toZonedDateTime(this.coreZC.getGeoLocation().getTimeZone()), tekufa) == -1)
	}
}

class ZemanFunctions extends ZemanimMathBase {
	customDawn(timeBack={minutes:90, degree:19.8}) {
		if (this.config.fixedMil)
			return this.timeRange.current.sunrise
				.subtract(this.fixedToSeasonal(Temporal.Duration.from({ minutes: timeBack.minutes })));
		else
			return this.timeRange.current.sunrise
				.subtract(this.fixedToSeasonal(this.durationOfEquinoxDegreeSeasonalHour(timeBack.degree, false)));
	}

	getAlotHashahar() {
		return this.timeRange.current.dawn;
	}

	getMisheyakir(percentageForMisheyakir=(5/6)) {
		const alotDuration = this.timeRange.current.dawn.until(this.timeRange.current.sunrise)
		return this.timeRange.current.sunrise
			.subtract({ nanoseconds: Math.trunc(alotDuration.total("nanoseconds") * percentageForMisheyakir) })
	}

	getEarlyMisheyakir() {
		return this.getMisheyakir(5.5/6);
	}

	/**
	 * Netz: the visible sunrise over the terrain when a horizon set is configured, otherwise sea-level sunrise.
	 * Same return shape as before (callers check for the wrapper to show seconds).
	 * @returns {Temporal.ZonedDateTime | {time: Temporal.ZonedDateTime; isVisual: true}}
	 */
	getNetz() {
		const seaLevel = this.coreZC.getSeaLevelSunrise();
		const ms = this.getVisibleSunriseEpochMs();
		if (!Number.isFinite(ms))
			return seaLevel;

		const visible = Temporal.Instant
			.fromEpochMilliseconds(Math.round(ms))
			.toZonedDateTimeISO(this.coreZC.getGeoLocation().getTimeZone());

		// Same sanity check as with the ChaiTables data: a result more than an hour off is a bad profile
		if (Math.abs(visible.until(this.timeRange.current.sunrise).total('hour')) > 1)
			return seaLevel;

		return { time: visible, isVisual: true };
	}

	getSofZemanShemaMGA() {
		return this.timeRange.current.dawn
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 3 }), this.timeRange.current.ranges.mga));
	}

	getSofZemanShemaGRA() {
		return this.timeRange.current.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 3 })));
    }

	getSofZemanBerakhothShema() {
		return this.timeRange.current.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 4 })));
    }

	getSofZemanAhilathHametz() {
		return this.timeRange.current.dawn
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 4 }), this.timeRange.current.ranges.mga));
	}

	getSofZemanBiurHametz() {
		return this.timeRange.current.dawn
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 5 }), this.timeRange.current.ranges.mga));
	}

	/**
	 * This method returns <em>chatzos</em> (midday) following most opinions that <em>chatzos</em> is the midpoint
	 * between {@link #getSeaLevelSunrise sea level sunrise} and {@link #getSeaLevelSunset sea level sunset}. A day
	 * starting at <em>alos</em> and ending at <em>tzais</em> using the same time or degree offset will also return
	 * the same time. The returned value is identical to {@link #getSunTransit()}. In reality due to lengthening or
	 * shortening of day, this is not necessarily the exact midpoint of the day, but it is very close.
	 * 
	 * @see AstronomicalCalendar#getSunTransit()
	 * @return {Temporal.ZonedDateTime} the <code>Date</code> of chatzos. If the calculation can't be computed such as in the Arctic Circle
	 *                          where there is at least one day where the sun does not rise, and one where it does not set, a null will
	 *                          be returned. See detailed explanation on top of the {@link KosherZmanim.AstronomicalCalendar AstronomicalCalendar}
	 *                          documentation.
	 */
	getHatzoth() {
		return this.timeRange.current.hatzoth;
	}

	/**
     * This is a conveniance method that returns the later of {@link #getMinchaGedola()} and
     * {@link #getMinchaGedola30Minutes()}. In the winter when 1/2 of a <em>{@link #getShaahZmanisGra() shaah zmanis}</em> is
     * less than 30 minutes {@link #getMinchaGedola30Minutes()} will be returned, otherwise {@link #getMinchaGedola()}
     * will be returned.
     *
     * @return the <code>Date</code> of the later of {@link #getMinchaGedola()} and {@link #getMinchaGedola30Minutes()}.
     *         If the calculation can't be computed such as in the Arctic Circle where there is at least one day a year
     *         where the sun does not rise, and one where it does not set, a null will be returned. See detailed
     *         explanation on top of the {@link AstronomicalCalendar} documentation.
     */
	getMinhaGedolah() {
		return this.timeRange.current.hatzoth.add([
			Temporal.Duration.from({ minutes: 30 }),
			this.fixedToSeasonal(Temporal.Duration.from({ minutes: 30 }))
		].sort(durationSort)[0]);
	}

	getMinhaGedolahIkar() {
		return this.timeRange.current.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 6, minutes: 30 })));
	}

	/**
	 * A generic method for calculating <em>mincha ketana</em>, (the preferred time to recite the mincha prayers in
	 * the opinion of the <em><a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a></em> and others) that is
	 * 9.5 * <em>shaos zmaniyos</em> (temporal hours) after the start of the day, calculated using the start and end
	 * of the day passed to this method.
	 * The time from the start of day to the end of day are divided into 12 <em>shaos zmaniyos</em> (temporal hours), and
	 * <em>mincha ketana</em> is calculated as 9.5 of those <em>shaos zmaniyos</em> after the beginning of the day. As an
	 * example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link #getSeaLevelSunrise() sea level
	 * sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()} elevation
	 * setting) to this method will return <em>mincha ketana</em> according to the opinion of the
	 * <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>.
	 *
	 * @return the <code>Date</code> of the time of <em>Mincha ketana</em> based on the start and end of day times
	 *         passed to this method. If the calculation can't be computed such as in the Arctic Circle where there is
	 *         at least one day a year where the sun does not rise, and one where it does not set, a null will be
	 *         returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
	 */
	getMinchaKetana() {
		return this.timeRange.current.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 9, minutes: 30 })));
	}

	getPlagHaminhaHalachaBrurah() {
		return this.plagHaminchaCore(this.timeRange.current.sunset);
	}

	getPlagHaminhaYalkutYosef() {
		return this.plagHaminchaCore(this.timeRange.current.nightfall);
	}

	getPlagHaminhaMaamarMordechi() {
		return this.timeRange.current.nightfall
			.subtract(this.fixedToSeasonal(Temporal.Duration.from({ hours: 1, minutes: 15 }), this.timeRange.current.dawn.until(this.timeRange.current.nightfall)));
	}

	getCandleLighting() {
		return this.timeRange.current.sunset.subtract({ minutes: this.config.candleLighting })
	}

	getShkiya() {
		return this.timeRange.current.sunset;
	}

	getTzet() {
		return this.timeRange.current.nightfall;
	}

	getTzetHumra() {
		return this.timeRange.current.sunset.add(
			this.config.fixedMil
				? { minutes: 20 }
				: this.fixedToSeasonal(this.timeRange.equinox.stringentNightfall)
		);
	}

	/**
	 * Calculate Tzet for work/melakha (stringency opinion)
	 *
	 * Supports:
	 * - Single fixed minutes: `{minutes: 30}`
	 * - Single degree: `{degree: 7.165}`
	 * - Multiple stringencies: `[{minutes: 27}, {minutes: 30}]`
	 *
	 * When multiple provided, multiHandle determines selection:
	 * - "PRETTY": Returns rounded time (ends in 0 or 5)
	 * - "LENIENT": Returns earlier time
	 * - "STRINGENT": Returns later time
	 *
	 * @param {melakhaTzet|melakhaTzet[]|null} [humraConf] - Stringency config(s)
	 * @param {"PRETTY"|"LENIENT"|"STRINGENT"} [multiHandle="PRETTY"] - Selection strategy for multiple configs
	 * @returns {Temporal.ZonedDateTime|{time: Temporal.ZonedDateTime; minutes?: number; degree?: number}}
	 */
	getTzetMelakha(humraConf = this.config.melakha, multiHandle = "PRETTY") {
		if (!humraConf) {
			return this.getTzetHumra();
		}

		if ((this.config.fixedMil && ((!Array.isArray(humraConf) && humraConf.minutes !== null) || (Array.isArray(humraConf) && humraConf.some(conf => conf.minutes !== null))))
		 || (!this.config.fixedMil && ((!Array.isArray(humraConf) && humraConf.degree == null) || (Array.isArray(humraConf) && humraConf.every(conf => conf.degree == null))))) {
			let humraObj = Array.isArray(humraConf) ? humraConf.sort((humraObjA, humraObjB) => humraObjB.minutes - humraObjA.minutes)[0] : humraConf;
			return { time: this.timeRange.current.sunset.add({ minutes: humraObj.minutes }), minutes: humraObj.minutes };
		}

		if (!Array.isArray(humraConf) || humraConf.length == 1) {
			const humraObj = (Array.isArray(humraConf) ? humraConf[0] : humraConf);

			const degree = humraObj.degree + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH;
			const sunsetOffset = this.coreZC.getSunsetOffsetByDegrees(degree);
			if (!sunsetOffset || Temporal.ZonedDateTime.compare(sunsetOffset, this.getSolarMidnight()) == 1)
				return (humraObj.degree > 5.2 ? this.getTzetMelakha({ degree: 5.2, minutes: null }) : this.getSolarMidnight());

			return { time: sunsetOffset, minutes: humraObj.minutes, degree: humraObj.degree };
		}

		switch (multiHandle) {
			case 'LENIENT':
			case "STRINGENT":
				const stringentFixed = humraConf.sort((humraObjA, humraObjB) => humraObjB.minutes - humraObjA.minutes)[0];
				const lenientDegree = humraConf.sort((humraObjA, humraObjB) => humraObjA.degree - humraObjB.degree)[0];

				let degreeTzet = this.coreZC.getSunsetOffsetByDegrees(lenientDegree.degree + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH);
				if (!degreeTzet || Temporal.ZonedDateTime.compare(degreeTzet, this.getSolarMidnight()) == 1)
					degreeTzet = this.getSolarMidnight();

				const sortedEntries = [degreeTzet, this.timeRange.current.sunset.add({ minutes: stringentFixed.minutes })]
					.sort(Temporal.ZonedDateTime.compare);

				return sortedEntries[multiHandle == "LENIENT" ? 0 : sortedEntries.length - 1];
				break;
			default:
				if (humraConf.length >= 3)
					throw Error("Too many humra objects provided for Tzet Melakha calculation, expected 1 or 2");

				// Discard fixed minutes
				const sortedDegrees = humraConf
					.map(humraObj => {
						const degree = humraObj.degree + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH;
						let sunsetOffset = this.coreZC.getSunsetOffsetByDegrees(degree);
						if (!sunsetOffset || Temporal.ZonedDateTime.compare(sunsetOffset, this.getSolarMidnight()) == 1) {
							sunsetOffset = this.coreZC.getSunsetOffsetByDegrees(5.2 + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH);
							if (!sunsetOffset || Temporal.ZonedDateTime.compare(sunsetOffset, this.getSolarMidnight()) == 1)
								sunsetOffset = this.getSolarMidnight();
						}

						return sunsetOffset;
					}).reduce((/** @type {Temporal.ZonedDateTime[]} */acc, obj) => {
						if (!acc.some(o => o.epochMilliseconds === obj.epochMilliseconds)) acc.push(obj);
						return acc;
					}, [])
					.sort(Temporal.ZonedDateTime.compare);

				if (sortedDegrees.length == 1)
					return { time: sortedDegrees[0] };

				return (
					[sortedDegrees[0]
						.round({ smallestUnit: 'second', roundingIncrement: 10, roundingMode: "trunc" })
						.round({ smallestUnit: 'minute', roundingIncrement: 5, roundingMode: "ceil" }),
					sortedDegrees[1]]
					.sort(Temporal.ZonedDateTime.compare)[0]);
		}
	}

	getTzetRT() {
		const rtTimes = [
			this.timeRange.current.tzethakokhavim,
			this.timeRange.current.sunset.add({ minutes: 72 })
		];

		if (this.config.rtKulah)
			return rtTimes.sort(Temporal.ZonedDateTime.compare)[0]
		else
			return rtTimes[0];
	}

	getSolarMidnight() {
		return this.coreZC.getSolarMidnight()
	}

	/** Full solar-sphere sunrise (Halacha Berura): the whole disk above the horizon. */
	testSunriseHBWorking() {
		if (this.config.horizon) {
			const date = this.coreZC.getDate().withCalendar("iso8601");
			const ms = this.astroCalc.getVisibleSunrise(date, this.coreZC.getGeoLocation(), this.config.horizon,
				{ ...this.config.visibleOptions, limb: 'full' });
			if (Number.isFinite(ms))
				return Temporal.Instant.fromEpochMilliseconds(Math.round(ms))
					.toZonedDateTimeISO(this.coreZC.getGeoLocation().getTimeZone());
		}

		// No terrain: shift the sunrise by the solar diameter
		const solarRadius = this.astroCalc.getSolarRadius();
		const zenith = KosherZmanim.ZmanimCalendar.GEOMETRIC_ZENITH;
		const refraction = this.astroCalc.getRefraction();

		const offsetFromRegSunrise = this.coreZC.getSeaLevelSunrise()
			.until(this.coreZC.getSunriseOffsetByDegrees(zenith - solarRadius + refraction))
		return zDTFromFunc(this.getNetz()).add(offsetFromRegSunrise); // proper adjustment
	}

	getAsiTzet () {
		return this.coreZC.getSunsetOffsetByDegrees(18 + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH);
	}

	getSofZemanSeuda() {
		return this.timeRange.current.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 9, minutes: 0 })));
	}

	getSofZemanMelakha() {
		return this.timeRange.current.sunset.subtract([
			Temporal.Duration.from({ hours: 2, minutes: 30 }),
			this.fixedToSeasonal(Temporal.Duration.from({ hours: 2, minutes: 30 }))
		].sort(durationSort)[0]);
	}
}

class DebugZemanFunctions extends ZemanFunctions {
	logDawn() {
		/** @type {KosherZmanim.SPACalculator} */
		// @ts-ignore
		const astCalc = this.coreZC.getAstronomicalCalculator()

		console.log(`Alot of ${dropHundredths(this.timeRange.equinox.dawn.total("minutes"))} zemaniyot minutes, in ${this.coreZC.getGeoLocation().getLocationName()}`
			+ ` on ${this.coreZC.getDate().toString()}, the day with ${dropHundredths(this.timeRange.current.ranges.gra.total("hours"))} hours [GR"A]`
			+ ` and ${dropHundredths(this.timeRange.current.ranges.mga.total("hours"))} hours [MG"A]: `
			+ `${dropHundredths(this.timeRange.current.dawn.until(this.timeRange.current.sunrise).total('minutes'))} minutes post-zemaniyot adjustments`
			+ ` (${this.timeRange.current.dawn.toPlainTime().toLocaleString()}-${this.timeRange.current.sunrise.toPlainTime().toLocaleString()})`
			+ `, which is at ${dropHundredths(astCalc.getSolarElevation(this.timeRange.current.dawn.toInstant(), this.coreZC.getGeoLocation()))} degrees`)
	}
}

/**
 * Get all method names from a class/object including inherited ones
 * @param {any} toCheck - Object to inspect
 * @returns {string[]} Array of unique method names
 */
function getAllMethods(toCheck) {
	const props = [];
	let obj = toCheck;
	do {
		props.push(...Object.getOwnPropertyNames(obj));
	} while ((obj = Object.getPrototypeOf(obj)));

	return props
		.sort()
		.filter((e, i, arr) => e !== arr[i + 1] && typeof toCheck[e] === 'function');
}

/**
 * Constants for the WGS84 Earth model.
 * The Earth is modeled as an oblate spheroid.
 */
const WGS84_EQUATORIAL_RADIUS = 6378.137; // in KM
const WGS84_POLAR_RADIUS = 6356.752; // in KM

/**
 * Calculate Earth's radius at a given latitude using WGS84 ellipsoid model
 * @param {number} latitude - Latitude in degrees
 * @returns {number} Earth's radius at latitude in kilometers
 */
function getEarthRadiusAtLatitude(latitude) {
	const latRad = MathUtils.degreesToRadians(latitude);
	const a = WGS84_EQUATORIAL_RADIUS;
	const b = WGS84_POLAR_RADIUS;

	// Formula for oblate spheroid radius
	const numerator = Math.pow(a * Math.cos(latRad), 2) + Math.pow(b * Math.sin(latRad), 2);
	const denominator = Math.pow(a * Math.cos(latRad), 2) / Math.pow(a, 2) + Math.pow(b * Math.sin(latRad), 2) / Math.pow(b, 2);
	return Math.sqrt(numerator / denominator);
}

const methodNames = getAllMethods(ZemanFunctions.prototype);

/**
 * Extract ZonedDateTime from function result (handles both direct return and {time} wrapper)
 * @param {Temporal.ZonedDateTime | {time: Temporal.ZonedDateTime}} funcRet
 * @returns {Temporal.ZonedDateTime}
 */
const zDTFromFunc = (funcRet) =>
	funcRet instanceof Temporal.ZonedDateTime ? funcRet : funcRet.time;

export {
	ZemanimMathBase,
	ZemanFunctions,
	methodNames,
	zDTFromFunc
};

/**
 * Round number down to 2 decimal places
 * @param {number} num
 * @returns {number}
 */
function dropHundredths(num) {
	const factor = Math.pow(10, 2);
	return Math.floor(num * factor) / factor;
}

/**
 * Return the longer of two durations
 * @param {Temporal.Duration} a
 * @param {Temporal.Duration} b
 * @returns {Temporal.Duration}
 */
function maxDuration(a, b) {
	return a.total("nanoseconds") >= b.total("nanoseconds") ? a : b;
}