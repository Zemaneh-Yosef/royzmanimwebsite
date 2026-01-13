// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { MathUtils, Temporal } from "../libraries/kosherZmanim/kosher-zmanim.js";
import TekufahCalculator from "./tekufot.js";

/** @typedef {{minutes: number; degree?: number}} melakhaTzet */

/**
 * @param {string | Temporal.Duration | KosherZmanim.Temporal.DurationLike} a
 * @param {string | Temporal.Duration | KosherZmanim.Temporal.DurationLike} b
 */
function durationSort(a,b) {
	const pSort = Temporal.Duration.compare(a, b);
	return pSort * -1;
}

class ZemanimMathBase {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 * @param {{ elevation: boolean | undefined; fixedMil: boolean; rtKulah: boolean; melakha: melakhaTzet|melakhaTzet[]; candleLighting: number; }} config
	 */
	constructor(geoLocation, config={ elevation: undefined, fixedMil: false, rtKulah: true, melakha: {minutes: 30, degree: 7.165}, candleLighting: 20 }) {
		this.config = config;

		/** @type {{indexDates:Temporal.PlainDate[];zoneDT:Temporal.ZonedDateTime[];preservedInts:number[]}} */
		this.vSunrise = {
			indexDates: [],
			zoneDT: [],
			preservedInts: []
		};

		/** @type {KosherZmanim.ZmanimCalendar} */
		this.coreZC = new KosherZmanim.ZmanimCalendar(geoLocation)
		this.coreZC.setUseElevation(config.elevation);
		this.coreZC.getAstronomicalCalculator().setRefraction(34.478885263888294 / 60);

		/** @type {TekufahCalculator} */
		this.tekufaCalc = new TekufahCalculator(this.coreZC.getDate().withCalendar("hebrew").year);

		/** @type {{
			equinox: {
				dawn: Temporal.Duration;
				nightfall: Temporal.Duration;
				stringentNightfall: Temporal.Duration;
				TzetHakokhavim: Temporal.Duration
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
	 * @param {Parameters<KosherZmanim.ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[0]} degree 
	 * @param {Parameters<KosherZmanim.ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[1]} sunset 
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
		this.coreZC.getAstronomicalCalculator().setEarthRadius(getEarthRadiusAtLatitude(geoLocation.getLatitude()));

		if (this.config.fixedMil)
			this.timeRange.equinox = {
				dawn: Temporal.Duration.from({ minutes: 72 }),
				nightfall: Temporal.Duration.from({ minutes: 13, seconds: 30 }),
				stringentNightfall: Temporal.Duration.from({ minutes: 20 }), // not used
				TzetHakokhavim: Temporal.Duration.from({ minutes: 72 })
			}
		else
			this.timeRange.equinox = {
				dawn: this.durationOfEquinoxDegreeSeasonalHour(16.04, false),
				nightfall: this.durationOfEquinoxDegreeSeasonalHour(3.7, true),
				stringentNightfall: this.durationOfEquinoxDegreeSeasonalHour(5.075, true),
				TzetHakokhavim: this.durationOfEquinoxDegreeSeasonalHour(16.04, true)
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

		this.timeRange.current.dawn = this.timeRange.current.sunrise.subtract(this.fixedToSeasonal(this.timeRange.equinox.dawn));
		this.timeRange.current.nightfall = this.timeRange.current.sunset.add(this.fixedToSeasonal(this.timeRange.equinox.nightfall));
		this.timeRange.current.tzethakokhavim = this.timeRange.current.sunset.add(this.fixedToSeasonal(this.timeRange.equinox.TzetHakokhavim));

		this.timeRange.current.ranges.mga = this.timeRange.current.dawn.until(this.timeRange.current.tzethakokhavim);
	}

	/**
	 * @param {boolean} useElevation
	 */
	setUseElevation(useElevation) {
		this.coreZC.setUseElevation(useElevation);
		this.setDate(this.coreZC.getDate())
	}

	/** @param {number[]} sunriseTimes */
	setVisualSunrise(sunriseTimes) {
		this.vSunrise.preservedInts = sunriseTimes;
		this.vSunrise.zoneDT = sunriseTimes
			.map((/** @type {number} */ value) => KosherZmanim.Temporal.Instant
				.fromEpochMilliseconds(value * 1000)
				.toZonedDateTimeISO(this.coreZC.getGeoLocation().getTimeZone())
			)
		this.vSunrise.indexDates = this.vSunrise.zoneDT.map((/** @type {Temporal.ZonedDateTime} */ value) => value.toPlainDate());
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

		// @ts-ignore
		let calc = new (this.constructor)(this.coreZC.getGeoLocation(), this.config);
		calc.setDate(date);
		calc.setVisualSunrise(this.vSunrise.preservedInts);

		return calc;
	}

	/**
	 * @param {Temporal.Duration} portion
	 * @param {Temporal.Duration} fullDay
	 */
	fixedToSeasonal(portion, fullDay=this.timeRange.current.ranges.gra) {
		const inputPortionOfDay = portion.total("nanoseconds") / Temporal.Duration.from({ hours: 12 }).total('nanoseconds'); // Length of 12

		return Temporal.Duration.from({
			nanoseconds: Math.trunc(fullDay.total("nanoseconds") * inputPortionOfDay)
		});
	}

	/**
	 * @param {Temporal.ZonedDateTime} time
	 */
	plagHaminchaCore(time) {
		return time.subtract(this.fixedToSeasonal(Temporal.Duration.from({ hours: 1, minutes: 15 })));
	}

	/**
	 * @param {boolean} [fixedClock]
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

	getNetz() {
		if (this.vSunrise.zoneDT.length) {
			const todayVS = this.vSunrise.zoneDT[this.vSunrise.indexDates.indexOf(this.vSunrise.indexDates.find(vs => vs.equals(this.coreZC.getDate())))];
			if (todayVS && Math.abs(todayVS.until(this.timeRange.current.sunrise).total('hour')) <= 1) {
				return {time: todayVS, isVisual: true};
			}
		}
		return this.coreZC.getSeaLevelSunrise();
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
		return this.timeRange.current.hatzoth.add(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 30 })))
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

	/* The philosophy behind Tzet Shabbat is as such:
	 * The passed value will be both the public facing response & the highly technical one
	 * If the expectation is that you could just minus X amount of minutes to get sunset, that's clearly public facing;
	 * thus use the public facing (aka stringent value)
	 * When you're using degrees, it's clear that you're being different week-to-week, and thus leave room for more technical math
	 * Thus, although we will not default to the most technical time, we will factor it in when we want to be more public-facing
	 * In our case, we have four options to handle the multiple Zemanim:
	 * PRETTY - The stricter time is the one that's meant to be there, but if there is time between the two is divisable by 5, use that time instead
	 * LENIENT - Either the degree or the fixed minute as a cap-off for the degree.
	 * Each object has both fixed minutes and its degree-equivalent - thus, you'll instead use the "strictest" fixed minute and the lenient degree
	 * STRINGENT - The degree is meant to increase, not decrease from the stringent fixed value - find the strictest fixed, lenient degree and adjust
	 * This functionality goes unused anywhere that shows sunset - nevertheless, for flyers, we default to pretty
	 * The app implements "lenient", stringent remains unused by our flyers but used elsewhere
	 */
	/** @param {"PRETTY"|"LENIENT"|"STRINGENT"} [multiHandle="PRETTY"] */
	/** @returns {Temporal.ZonedDateTime|{time:Temporal.ZonedDateTime; minutes?: number; degree?: number;}} */
	getTzetMelakha(humraConf = this.config.melakha, multiHandle="PRETTY") {
		if (!humraConf) {
			return this.getTzetHumra();
		}

		if (this.config.fixedMil || (!Array.isArray(humraConf) && humraConf.degree == null)) {
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

	testSunriseHBWorking() {
		const solarRadius = this.coreZC.getAstronomicalCalculator().getSolarRadius();
		const zenith = KosherZmanim.ZmanimCalendar.GEOMETRIC_ZENITH;
		const refraction = this.coreZC.getAstronomicalCalculator().getRefraction();

		return this.coreZC.getSunriseOffsetByDegrees(zenith - solarRadius + refraction); // proper adjustment
	}
}

/**
 * @param {{ [x: string]: any; }} toCheck
 */
function getAllMethods (toCheck) {
	const props = [];
    let obj = toCheck;
    do {
        props.push(...Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));

    return props.sort().filter((e, i, arr) => (e!=arr[i+1] && typeof toCheck[e] == 'function'));
}

/**
 * Constants for the WGS84 Earth model.
 * The Earth is modeled as an oblate spheroid.
 */
const WGS84_EQUATORIAL_RADIUS = 6378.137; // in KM
const WGS84_POLAR_RADIUS = 6356.752; // in KM

/**
 * A method to calculate the Earth's radius at a given latitude using the WGS84 model.
 * This accounts for the Earth's oblateness.

 * @param {number} latitude The latitude in degrees.
 * @return The Earth's radius at the given latitude in KM.
 */
function getEarthRadiusAtLatitude(latitude) {
  const latRad = MathUtils.degreesToRadians(latitude); // Convert latitude to radians
  const a = WGS84_EQUATORIAL_RADIUS; // Equatorial radius
  const b = WGS84_POLAR_RADIUS; // Polar radius

  // Calculate the radius using the formula for an oblate spheroid
  const numerator = Math.pow(a * Math.cos(latRad), 2) + Math.pow(b * Math.sin(latRad), 2);
  const denominator = Math.pow(a * Math.cos(latRad), 2) / Math.pow(a, 2) + Math.pow(b * Math.sin(latRad), 2) / Math.pow(b, 2);
  return Math.sqrt(numerator / denominator);
}

const methodNames = getAllMethods(ZemanFunctions.prototype)

/** @param {Temporal.ZonedDateTime | { time: Temporal.ZonedDateTime }} funcRet */
const zDTFromFunc = (funcRet) =>
	(funcRet instanceof Temporal.ZonedDateTime ? funcRet : funcRet.time)

export {
	ZemanFunctions,
	methodNames,
	zDTFromFunc
};