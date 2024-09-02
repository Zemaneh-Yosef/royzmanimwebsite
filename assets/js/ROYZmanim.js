// @ts-check

// Comment the following line before going live (as well as the export line on the bottom)!
import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { Temporal } from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import TekufahCalculator from "./tekufot.js";

/**
 * @param {string | Temporal.ZonedDateTime | Temporal.ZonedDateTimeLike} a
 * @param {string | Temporal.ZonedDateTime | Temporal.ZonedDateTimeLike} b
 */
function rZTDsort(a,b) {
	const pSort = Temporal.ZonedDateTime.compare(a, b);
	return pSort * -1;
}

class ZmanimMathBase {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.coreZC = new KosherZmanim.ZmanimCalendar(geoLocation)
		this.coreZC.getAstronomicalCalculator().setRefraction(34.478885263888294 / 60)
		this.tekufaCalc = new TekufahCalculator(this.coreZC.getDate().withCalendar("hebrew").year);

		this.setDate(Temporal.Now.plainDateISO())
	}

	/**
	 * @param {Temporal.PlainDate} plainDate
	 */
	setDate(plainDate) {
		this.coreZC.setDate(plainDate);
		this.tekufaCalc.setYear(this.coreZC.getDate().withCalendar("hebrew").year)

		if (this.coreZC.isUseElevation())
			this.astronomicalZman = { sunrise: this.coreZC.getSunrise(), sunset: this.coreZC.getSunset() }
		else
			this.astronomicalZman = { sunrise: this.coreZC.getSeaLevelSunrise(), sunset: this.coreZC.getSeaLevelSunset() }

		this.seasonalDay = this.astronomicalZman.sunrise.until(this.astronomicalZman.sunset)
	}

	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	setGeoLocation(geoLocation) {
		this.coreZC.setGeoLocation(geoLocation);
		this.setDate(this.coreZC.getDate())
	}

	/**
	 * @param {boolean} useElevation 
	 */
	setUseElevation(useElevation) {
		this.coreZC.setUseElevation(useElevation);
		this.setDate(this.coreZC.getDate())
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
		let calc;
		if (this instanceof OhrHachaimZmanim) {
			calc = new OhrHachaimZmanim(this.coreZC.getGeoLocation(), this.coreZC.isUseElevation());
		} else {
			calc = new (
				this instanceof AmudehHoraahZmanim ? AmudehHoraahZmanim :
					this instanceof AlotTzeitZmanim ? AlotTzeitZmanim :
						this instanceof GRAZmanim ? GRAZmanim : ZmanimMathBase)(this.coreZC.getGeoLocation())
		}

		calc.coreZC.setAstronomicalCalculator(this.coreZC.getAstronomicalCalculator())
		calc.coreZC.setCandleLightingOffset(this.coreZC.getCandleLightingOffset())
		calc.setDate(date);

		if (this instanceof AlotTzeitZmanim)
			// @ts-ignore
			calc.configSettings(this.rtKulah, this.shabbatObj);

		// @ts-ignore
		return calc;
	}

	/**
	 * @param {Temporal.Duration} input
	 * @param {"gra"} dayCalc
	 */
	fixedToSeasonal(input, dayCalc="gra") {
		const inputPortionOfDay = input.total("nanoseconds") / Temporal.Duration.from({ hours: 12 }).total('nanoseconds'); // Length of 12

		return Temporal.Duration.from({
			nanoseconds: Math.trunc(this.seasonalDay.total("nanoseconds") * inputPortionOfDay)
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

class GRAZmanim extends ZmanimMathBase {
	getNetz() {
		return this.coreZC.getSeaLevelSunrise();
	}

	getSofZmanShmaGRA() {
		return this.astronomicalZman.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 3 })));
    }

	getSofZmanBrachothShma() {
		return this.astronomicalZman.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 4 })));
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
		return this.astronomicalZman.sunrise
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 9, minutes: 30 })));
	}

	getPlagHaminhaHalachaBrurah() {
		return this.plagHaminchaCore(this.astronomicalZman.sunset);
	}

	getEarliestMinchaBirkatKohanim() {
		return this.astronomicalZman.sunset.subtract({ minutes: 30 })
	}

	getCandleLighting() {
		return this.astronomicalZman.sunset.subtract({ minutes: this.coreZC.getCandleLightingOffset() })
	}

	getShkiya() {
		return this.astronomicalZman.sunset;
	}

	getTzaitTaanitLChumra() {
		return this.astronomicalZman.sunset.add({ minutes: 30 });
	}
}

class AlotTzeitZmanim extends GRAZmanim {
	/**
	 * @param {boolean} rtKulah
	 * @param {{ minutes: number; degree: number; }} shabbatObj
	 */
	configSettings(rtKulah, shabbatObj) {
		this.rtKulah = rtKulah;
		this.shabbatObj = shabbatObj;
	}

	/**
	 * @param {Temporal.Duration} input
	 * @param {"gra"|"mga"} dayCalc
	 */
	fixedToSeasonal(input, dayCalc="gra") {
		let lengthOfDay;
		switch (dayCalc) {
			case 'gra':
				lengthOfDay = this.seasonalDay;
				break;
			case 'mga':
				lengthOfDay = this.getAlotHashachar().until(this.getTzait72Zmanit());
				break;
		}

		const inputPortionOfDay = input.total("nanoseconds") / Temporal.Duration.from({ hours: 12 }).total('nanoseconds');

		return Temporal.Duration.from({
			nanoseconds: Math.trunc(lengthOfDay.total("nanoseconds") * inputPortionOfDay)
		});
	}

	/**
	 * @param {number} percentageForMisheyakir
	 */
	getMisheyakir(percentageForMisheyakir) {
		const alotDuration = this.getAlotHashachar().until(this.astronomicalZman.sunrise)
		return this.astronomicalZman.sunrise
			.subtract({ nanoseconds: Math.trunc(alotDuration.total("nanoseconds") * percentageForMisheyakir) })
	}

	getSofZmanShmaMGA() {
		return this.getAlotHashachar()
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 3 }), "mga"));
    }

	getSofZmanAchilathHametz() {
		return this.getAlotHashachar()
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 4 }), "mga"));
	}

	getSofZmanBiurHametz() {
		return this.getAlotHashachar()
			.add(this.fixedToSeasonal(Temporal.Duration.from({ hours: 5 }), "mga"));
	}

	/**
	 * This method returns <em>chatzos</em> (midday) following most opinions that <em>chatzos</em> is the midpoint
	 * between {@link #getSeaLevelSunrise sea level sunrise} and {@link #getSeaLevelSunset sea level sunset}. A day
	 * starting at <em>alos</em> and ending at <em>tzais</em> using the same time or degree offset will also return
	 * the same time. The returned value is identical to {@link #getSunTransit()}. In reality due to lengthening or
	 * shortening of day, this is not necessarily the exact midpoint of the day, but it is very close.
	 * This is in MGAZmanim because based on the config, one could get R Bentzion's Shaot Zmaniyot, which is based on
	 * Hatzot being from Netz until Tzeit Hakokhavim
	 * 
	 * @see AstronomicalCalendar#getSunTransit()
	 * @return {Temporal.ZonedDateTime} the <code>Date</code> of chatzos. If the calculation can't be computed such as in the Arctic Circle
	 *                          where there is at least one day where the sun does not rise, and one where it does not set, a null will
	 *                          be returned. See detailed explanation on top of the {@link KosherZmanim.AstronomicalCalendar AstronomicalCalendar}
	 *                          documentation.
	 */
	getHatzoth() {
		return this.coreZC.getSunTransit();
	}

	/**
     * This is a conveniance method that returns the later of {@link #getMinchaGedola()} and
     * {@link #getMinchaGedola30Minutes()}. In the winter when 1/2 of a <em>{@link #getShaahZmanisGra() shaah zmanis}</em> is
     * less than 30 minutes {@link #getMinchaGedola30Minutes()} will be returned, otherwise {@link #getMinchaGedola()}
     * will be returned.
	 * This is in MGAZmanim because based on the config, one could get R Bentzion's Shaot Zmaniyot
     *
     * @return the <code>Date</code> of the later of {@link #getMinchaGedola()} and {@link #getMinchaGedola30Minutes()}.
     *         If the calculation can't be computed such as in the Arctic Circle where there is at least one day a year
     *         where the sun does not rise, and one where it does not set, a null will be returned. See detailed
     *         explanation on top of the {@link AstronomicalCalendar} documentation.
     */
	getMinhaGedolah() {
		const timesToMeasure = [
			this.getHatzoth().add({ minutes: 30 }),
			this.getHatzoth().add(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 30 })))
		]
		return timesToMeasure.sort(rZTDsort)[0] || null;
	}

	getPlagHaminhaYalkutYosef() {
		return this.plagHaminchaCore(this.getTzait());
	}

	getTzaitRT() {
		const rtTimes = [
			this.getTzait72Zmanit(),
			this.astronomicalZman.sunset.add({ minutes: 72 })
		];

		if (this.rtKulah) 
			return rtTimes.sort(Temporal.ZonedDateTime.compare)[0]
		else
			return rtTimes[0];
	}

	getSolarMidnight() {
		return this.coreZC.getSolarMidnight()
	}

	// <needsImplementation>

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {Temporal.ZonedDateTime} The return value.
     */
	getAlotHashachar() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {Temporal.ZonedDateTime} The return value.
     */
	getTzait() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {Temporal.ZonedDateTime} The return value.
     */
	getTzait72Zmanit() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {Temporal.ZonedDateTime} The return value.
     */
	getTzaitShabbath() { throw new Error("Unimplemented") }

	/**
     * Abstract method reserved for the Amudeh Hora'ah subclass.
     * @returns {Temporal.ZonedDateTime} The return value.
     */
	getTzaitLechumra() { throw new Error("Not in Amudeh Hora'ah Mode") }

	/**
     * Abstract method reserved for the Ohr Hachaim subclass.
     * @returns {Temporal.ZonedDateTime} The return value.
     */
	getTzaitTaanit() { throw new Error("Not in Ohr Hachaim Mode") }

	// </needsImplementaton>
}

class OhrHachaimZmanim extends AlotTzeitZmanim {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 * @param {boolean} elevation
	 */
	constructor(geoLocation, elevation) {
		super(geoLocation)
		this.setUseElevation(elevation);
	}

	/**
     * Method to return <em>alos</em> (dawn) calculated using 72 minutes <em>zmaniyos</em> or 1/10th of the day before
     * sunrise. This is based on an 18 minute <em>Mil</em> so the time for 4 <em>Mil</em> is 72 minutes which is 1/10th
     * of a day (12 * 60 = 720) based on the a day being from {@link #getSeaLevelSunrise() sea level sunrise} to
     * {@link #getSeaLevelSunrise sea level sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset}
     * (depending on the {@link #isUseElevation()} setting).
     * The actual calculation is {@link #getSeaLevelSunrise()}- ( {@link #getShaahZmanisGra()} * 1.2). This calculation
     * is used in the calendars published by <em><a href=
     * "https://en.wikipedia.org/wiki/Central_Rabbinical_Congress">Hisachdus Harabanim D'Artzos Habris Ve'Canada</a></em>
     *
     * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
     *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
     *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
     *         documentation.
     * @see KosherZmanim.ComplexZmanimCalendar.getShaahZmanisGra()
     */
	getAlotHashachar(zemaniyot={minutes:72, degree: 16.04}) {
		return this.astronomicalZman.sunrise
			.subtract(this.fixedToSeasonal(Temporal.Duration.from({ minutes: zemaniyot.minutes })));
	}

	getMisheyakir(percentageForMisheyakir=(5/6)) {
		return super.getMisheyakir(percentageForMisheyakir)
	}

	getTzait() {
		return this.astronomicalZman.sunset
			.add(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 13, seconds: 30 })))
	}

	getTzaitBenIshHai() {
		return this.astronomicalZman.sunset
			.add(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 27 })))
	}

	getTzaitLechumra() {
		return this.astronomicalZman.sunset
			.add(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 20 })))
	}

	getTzaitTaanit() {
		return this.astronomicalZman.sunset.add({ minutes: 20 });
	}

	getTzaitShabbath(shabbatTimeObj = this.shabbatObj) {
		return this.astronomicalZman.sunset.add({ minutes: shabbatTimeObj.minutes });
	}

	getTzait72Zmanit() {
		return this.astronomicalZman.sunset
			.add(this.fixedToSeasonal(Temporal.Duration.from({ minutes: 72 })))
	}
}

class AmudehHoraahZmanim extends AlotTzeitZmanim {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		super(geoLocation)
		this.setUseElevation(false);
	}


	/**
	 * @param {Parameters<KosherZmanim.ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[0]} degree 
	 * @param {Parameters<KosherZmanim.ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[1]} sunset 
	 * @returns {Temporal.Duration}
	 */
	durationOfEquinoxDegreeSeasonalHour(degree, sunset) {
		return Temporal.Duration.from({
			nanoseconds: Math.trunc(
				this
					.chainDate(this.coreZC.getDate().with({ month: 3, day: 17 }))
					.coreZC.getPercentOfShaahZmanisFromDegrees(degree, sunset)
				* Temporal.Duration.from({ hours: 1 }).total('nanoseconds')
			)
		})
	}

	getAlotHashachar(zemaniyot={minutes: 72, degree: 16.04}) {
		return this.astronomicalZman.sunrise
			.subtract(this.fixedToSeasonal(this.durationOfEquinoxDegreeSeasonalHour(zemaniyot.degree, false)))
	}

	getMisheyakir(percentageForMisheyakir=(5/6)) {
		return super.getMisheyakir(percentageForMisheyakir)
	}

	getTzait() {
		return this.astronomicalZman.sunset
			.add(this.fixedToSeasonal(this.durationOfEquinoxDegreeSeasonalHour(3.77, true)))
	}

	getTzaitLechumra() {
		return this.astronomicalZman.sunset
			.add(this.fixedToSeasonal(this.durationOfEquinoxDegreeSeasonalHour(5.135, true)));
	}

	getTzaitTaanitLChumra() {
		return [this.getTzaitLechumra(), super.getTzaitTaanitLChumra()].sort(rZTDsort)[0];
	}

	/**
     * Actual A"H implementation of Tzeit Shabbat
     * @returns {Temporal.ZonedDateTime} The return value.
     */
	getTzaitShabbath(shabbatTimeObj=this.shabbatObj) {
		const degree = shabbatTimeObj.degree + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH;
		const sunsetOffset = this.coreZC.getSunsetOffsetByDegrees(degree);
		if (!sunsetOffset || Temporal.ZonedDateTime.compare(sunsetOffset, this.getSolarMidnight()) == 1)
			return (shabbatTimeObj.degree > 5.32 ? this.getTzaitShabbath({ degree: 5.32, minutes: null }) : this.getSolarMidnight());

		return sunsetOffset;
	}

	getTzait72Zmanit() {
		return this.astronomicalZman.sunset
			.add(this.fixedToSeasonal(this.durationOfEquinoxDegreeSeasonalHour(16.01, true)))
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

const methodNames = getAllMethods(AlotTzeitZmanim.prototype)

export {
	OhrHachaimZmanim,
	AmudehHoraahZmanim,
	methodNames
};