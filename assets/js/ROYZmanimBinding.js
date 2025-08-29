// @ts-check

import TekufahCalculator from "./tekufot.js";
import { GeoLocation, newZmanimCalendar, ZmanimCalendar } from '../libraries/zmanim-binding/index.js';
import * as zmanBind from '../libraries/zmanim-binding/index.js';

import * as LuxonLib from '../libraries/zmanim-binding/luxon.min.js';

/** @type {import('luxon')} */
// @ts-ignore
const Luxon = LuxonLib;
const geoZenith = 90;

/** @typedef {{minutes: number; degree: number}} melakhaTzet */

class ZemanimMathBase {
	/**
	 * @param {zmanBind.GeoLocationInterface} geoLocation
	 * @param {{ elevation: boolean | undefined; fixedMil: boolean; rtKulah: boolean; melakha: melakhaTzet|melakhaTzet[]; candleLighting: number; }} config
	 * @param {string} [timezone]
	 */
	constructor(geoLocation, config={ elevation: undefined, fixedMil: false, rtKulah: true, melakha: {minutes: 30, degree: 7.165}, candleLighting: 20 }, timezone) {
		this.config = config;
		this.elevation = config.elevation ?? false;
		this.timezone = timezone ?? Luxon.DateTime.now().zoneName;

		/** @type {{luxonDates:import('luxon').DateTime[];preservedInts:number[]}} */
		this.vSunrise = {
			luxonDates: [],
			preservedInts: []
		};

		// Get current LuxonDate in milliseconds
		/** @type {import('luxon').DateTime} */
		// @ts-ignore
		this.date = Luxon.DateTime.now().setZone(this.timezone);

		/** @type {{
			equinox: {
				dawn: number;
				nightfall: number;
				stringentNightfall: number;
				TzetHakokhavim: number;
			};
			current: {
				dawn: import('luxon').DateTime;
				sunrise: import('luxon').DateTime;
				hatzoth: import('luxon').DateTime;
				sunset: import('luxon').DateTime;
				nightfall: import('luxon').DateTime;
				tzethakokhavim: import('luxon').DateTime;
				ranges: {
					mga: import('luxon').Interval;
					gra: import('luxon').Interval;
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
	 * @param {Parameters<ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[0]} degree
	 * @param {Parameters<ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[1]} sunset
	 * @returns {number}
	 */
	durationOfEquinoxDegreeSeasonalHour(degree, sunset) {
		const equinox = new Date("2021/03/17");

		const equinoxCalc = newZmanimCalendar(BigInt(equinox.valueOf()), this.geoLocation, true, false, BigInt(this.config.candleLighting))
		return equinoxCalc.getPercentOfShaahZmanisFromDegrees(degree, sunset);
	}

	/**
	 * @param {zmanBind.GeoLocationInterface} geoLocation
	 */
	setGeoLocation(geoLocation) {
		this.geoLocation = geoLocation;

		if (this.config.fixedMil)
			this.timeRange.equinox = {
				dawn: 1.2,
				nightfall: 0.225,
				stringentNightfall: 1/3, // not used
				TzetHakokhavim: 1.2
			}
		else
			this.timeRange.equinox = {
				dawn: this.durationOfEquinoxDegreeSeasonalHour(16.04, false),
				nightfall: this.durationOfEquinoxDegreeSeasonalHour(3.7, true),
				stringentNightfall: this.durationOfEquinoxDegreeSeasonalHour(5.075, true),
				TzetHakokhavim: this.durationOfEquinoxDegreeSeasonalHour(16.04, true)
			}

		this.setDate(this.date)
	}

	/**
	 * @param {import('luxon').DateTime} plainDate
	 */
	setDate(plainDate) {
		this.date = plainDate;
		this.zemanCal = newZmanimCalendar(BigInt(this.date.toMillis()), this.geoLocation, true, false, BigInt(this.config.candleLighting));
		this.astCal = this.zemanCal.getAstronomicalCalendar();
		this.tekufaCalc = new TekufahCalculator(this.date.reconfigure({ outputCalendar: "hebrew" }).year)

		if (this.elevation) {
			this.timeRange.current.sunrise = Luxon.DateTime.fromMillis(Number(this.astCal.getSunrise()), { zone: this.timezone });
			this.timeRange.current.sunset = Luxon.DateTime.fromMillis(Number(this.astCal.getSunset()), { zone: this.timezone });
		} else {
			this.timeRange.current.sunrise = Luxon.DateTime.fromMillis(Number(this.astCal.getSeaLevelSunrise()), { zone: this.timezone });
			this.timeRange.current.sunset = Luxon.DateTime.fromMillis(Number(this.astCal.getSeaLevelSunset()), { zone: this.timezone });
		}

		// @ts-ignore
		this.timeRange.current.ranges.gra = this.timeRange.current.sunrise.until(this.timeRange.current.sunset);

		this.timeRange.current.hatzoth = Luxon.DateTime.fromMillis(Number(this.astCal.getSunTransit()), { zone: this.timezone });

		this.timeRange.current.dawn = this.timeRange.current.sunrise.minus(this.fixedHourToSeasonalHour(this.timeRange.equinox.dawn));
		this.timeRange.current.nightfall = this.timeRange.current.sunset.plus(this.fixedHourToSeasonalHour(this.timeRange.equinox.nightfall));
		this.timeRange.current.tzethakokhavim = this.timeRange.current.sunset.plus(this.fixedHourToSeasonalHour(this.timeRange.equinox.TzetHakokhavim));

		// @ts-ignore
		this.timeRange.current.ranges.mga = this.timeRange.current.dawn.until(this.timeRange.current.tzethakokhavim);
	}

	/**
	 * @param {boolean} useElevation
	 */
	setUseElevation(useElevation) {
		this.elevation = useElevation;
		this.setDate(this.date)
	}

	/** @param {number[]} sunriseTimes */
	setVisualSunrise(sunriseTimes) {
		this.vSunrise.preservedInts = sunriseTimes;
		this.vSunrise.luxonDates = sunriseTimes
			.map((/** @type {number} */ value) => Luxon.DateTime.fromSeconds(value, { zone: this.timezone }))
	}

	/** @returns {this} */
	tomorrow() {
		return this.chainDate(this.date.plus({ days: 1 }));
	}

	/**
	 * @param {import('luxon').DateTime} date
	 * @returns {this}
	 */
	chainDate(date) {
		if (this.date.hasSame(date, 'day'))
			return this;

		// @ts-ignore
		let calc = new (this.constructor)(this.geoLocation, this.config);
		calc.setDate(date);

		return calc;
	}

	/**
	 * @param {number} fixedHour
	 * @param {import('luxon').Interval} fullDay
	 */
	fixedHourToSeasonalHour(fixedHour, fullDay=this.timeRange.current.ranges.gra) {
		return Luxon.Duration.fromMillis(fixedHour * (fullDay.toDuration().toMillis() / 12));
	}

	/**
	 * @param {import('luxon').DateTime} time
	 */
	plagHaminchaCore(time) {
		return time.minus(this.fixedHourToSeasonalHour(1.25));
	}

	/**
	 * @param {boolean} [fixedClock]
	 */
	nextTekufa(fixedClock) {
		const plainTekufoth = this.tekufaCalc.calculateTekufotShemuel(fixedClock);
		const tekufotTZ = plainTekufoth
			.map(temporal => Luxon.DateTime.fromMillis(temporal.toZonedDateTime("+02:00").withTimeZone(this.timezone).epochMilliseconds, { zone: this.timezone }))

		return tekufotTZ.find(tekufa => this.date.startOf("day") <= tekufa.startOf("day"));
	}
}

class ZemanFunctions extends ZemanimMathBase {
	customDawn(timeBack={hour:1.5, degree:19.8}) {
		if (this.config.fixedMil)
			return this.timeRange.current.sunrise.minus(this.fixedHourToSeasonalHour(timeBack.hour))
		else
			return this.timeRange.current.sunrise.minus(this.fixedHourToSeasonalHour(this.durationOfEquinoxDegreeSeasonalHour(timeBack.degree, false)));
	}

	getAlotHashahar() {
		return this.timeRange.current.dawn;
	}

	getMisheyakir(percentageForMisheyakir=(5/6)) {
		const alotDuration = this.timeRange.current.dawn.until(this.timeRange.current.sunrise)
		return this.timeRange.current.sunrise
			.minus({ millisecond: alotDuration.toDuration().toMillis() * percentageForMisheyakir })
	}

	getNetz() {
		if (this.vSunrise.luxonDates.length) {
			const todayVS = this.vSunrise.luxonDates.find(date => date.startOf('day').equals(this.date.startOf('day')));
			if (todayVS && Math.abs(todayVS.until(this.timeRange.current.sunrise).toDuration().hours) <= 1) {
				return {time: todayVS, isVisual: true};
			}
		}
		return Luxon.DateTime.fromMillis(Number(this.astCal.getSeaLevelSunrise()), { zone: this.timezone });
	}

	getSofZemanShemaMGA() {
		return this.timeRange.current.dawn
			.plus(this.fixedHourToSeasonalHour(3, this.timeRange.current.ranges.mga));
	}

	getSofZemanShemaGRA() {
		return this.timeRange.current.sunrise
			.plus(this.fixedHourToSeasonalHour(3));
    }

	getSofZemanBerakhothShema() {
		return this.timeRange.current.sunrise
			.plus(this.fixedHourToSeasonalHour(4));
    }

	getSofZemanAhilathHametz() {
		return this.timeRange.current.dawn
			.plus(this.fixedHourToSeasonalHour(4, this.timeRange.current.ranges.mga));
	}

	getSofZemanBiurHametz() {
		return this.timeRange.current.dawn
			.plus(this.fixedHourToSeasonalHour(5, this.timeRange.current.ranges.mga));
	}

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
		return this.timeRange.current.hatzoth.plus([
			Luxon.Duration.fromDurationLike({ minutes: 30 }),
			this.fixedHourToSeasonalHour(.5)
		].sort()[0]);
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
			.plus(this.fixedHourToSeasonalHour(9.5));
	}

	getPlagHaminhaHalachaBrurah() {
		return this.plagHaminchaCore(this.timeRange.current.sunset);
	}

	getPlagHaminhaYalkutYosef() {
		return this.plagHaminchaCore(this.timeRange.current.nightfall);
	}

	getCandleLighting() {
		return this.timeRange.current.sunset.minus({ minutes: this.config.candleLighting })
	}

	getShkiya() {
		return this.timeRange.current.sunset;
	}

	getTzet() {
		return this.timeRange.current.nightfall;
	}

	getTzetHumra() {
		return this.timeRange.current.sunset.plus(
			this.config.fixedMil
				? { minutes: 20 }
				: this.fixedHourToSeasonalHour(this.timeRange.equinox.stringentNightfall)
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
	/** @returns {import('luxon').DateTime|{time:import('luxon').DateTime; minutes?: number; degree?: number;}} */
	getTzetMelakha(humraConf = this.config.melakha, multiHandle = "PRETTY") {
		if (!humraConf) {
			return this.getTzetHumra();
		}

		if (this.config.fixedMil) {
			const humraObj = Array.isArray(humraConf)
				? humraConf.sort((a, b) => b.minutes - a.minutes)[0]
				: humraConf;

			return {
				time: this.timeRange.current.sunset.plus({ minutes: humraObj.minutes }),
				minutes: humraObj.minutes
			};
		}

		if (!Array.isArray(humraConf) || humraConf.length === 1) {
			const humraObj = Array.isArray(humraConf) ? humraConf[0] : humraConf;
			const degree = humraObj.degree + geoZenith;
			const rawMillis = this.astCal.getSunsetOffsetByDegrees(degree);
			const sunsetOffset = Luxon.DateTime.fromMillis(Number(rawMillis), { zone: this.timezone });

			if (!rawMillis || !sunsetOffset.isValid || sunsetOffset.toMillis() > this.getSolarMidnight().toMillis()) {
				return humraObj.degree > 5.2
					? this.getTzetMelakha({ degree: 5.2, minutes: null }, multiHandle)
					: this.getSolarMidnight();
			}

				return {
					time: sunsetOffset,
					minutes: humraObj.minutes,
					degree: humraObj.degree
				};
		}

		switch (multiHandle) {
			case "LENIENT":
			case "STRINGENT": {
				const stringentFixed = humraConf.sort((a, b) => b.minutes - a.minutes)[0];
				const lenientDegree = humraConf.sort((a, b) => a.degree - b.degree)[0];

				const degree = lenientDegree.degree + geoZenith;
				let degreeTzet = Luxon.DateTime.fromMillis(
					Number(this.astCal.getSunsetOffsetByDegrees(degree)),
					{ zone: this.timezone }
				);

				if (!degreeTzet.isValid || degreeTzet < this.getSolarMidnight()) {
					degreeTzet = this.getSolarMidnight();
				}

				const fixedTzet = this.timeRange.current.sunset.plus({ minutes: stringentFixed.minutes });

			const sorted = [degreeTzet, fixedTzet].sort((a, b) => a.toMillis() - b.toMillis());

				return {
					time: multiHandle === "LENIENT" ? sorted[0] : sorted[1]
				};
			}

			default: {
				if (humraConf.length >= 3) {
					throw new Error("Too many humra objects provided for Tzet Melakha calculation, expected 1 or 2");
				}

				const sortedDegrees = humraConf.map(humraObj => {
					const degree = humraObj.degree + geoZenith;
					let sunsetOffset = Luxon.DateTime.fromMillis(
						Number(this.astCal.getSunsetOffsetByDegrees(degree)),
						{ zone: this.timezone }
					);

					if (!sunsetOffset.isValid || sunsetOffset < this.getSolarMidnight()) {
						sunsetOffset = Luxon.DateTime.fromMillis(
							Number(this.astCal.getSunsetOffsetByDegrees(5.2 + geoZenith)),
							{ zone: this.timezone }
						);

						if (!sunsetOffset.isValid || sunsetOffset < this.getSolarMidnight()) {
							sunsetOffset = this.getSolarMidnight();
						}
					}

					return sunsetOffset;
				}).reduce((acc, dt) => {
					if (!acc.some(o => o.toMillis() === dt.toMillis())) acc.push(dt);
					return acc;
				}, []).sort((a, b) => a.toMillis() - b.toMillis());

				if (sortedDegrees.length === 1) {
					return { time: sortedDegrees[0] };
				}

				const rounded = sortedDegrees[0]
					.startOf('second')
					.plus({ seconds: -(sortedDegrees[0].second % 10) })
					.plus({ minutes: 5 - (sortedDegrees[0].minute % 5) });

				const finalSorted = [rounded, sortedDegrees[1]].sort((a, b) => a.toMillis() - b.toMillis());

				return { time: finalSorted[0] };
			}
		}
	}

	getTzetRT() {
		const rtTimes = [
			this.timeRange.current.tzethakokhavim,
			this.timeRange.current.sunset.plus({ minutes: 72 })
		];

		if (this.config.rtKulah)
			return rtTimes.sort()[0]
		else
			return rtTimes[0];
	}

	getSolarMidnight() {
		return Luxon.DateTime.fromMillis(Number(this.astCal.getSolarMidnight()), { zone: this.timezone });
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

const methodNames = getAllMethods(ZemanFunctions.prototype)

/** @param {import('luxon').DateTime | { time: import('luxon').DateTime }} funcRet */
const lDTFromFunc = (funcRet) =>
	(funcRet instanceof Luxon.DateTime ? funcRet : funcRet.time)

export {
	ZemanFunctions,
	methodNames,
	lDTFromFunc
};