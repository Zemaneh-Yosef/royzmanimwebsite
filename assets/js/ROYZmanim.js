// @ts-check

// Comment the following line before going live (as well as the export line on the bottom)!
import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import { settings } from "./settings/handler.js";
import TekufahCalculator from "./tekufot.js";

class ZmanimMathBase {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.coreZC = new KosherZmanim.ZmanimCalendar(geoLocation)
		this.tekufaCalc = new TekufahCalculator(this.coreZC.getDate().withCalendar("hebrew").year);

		/* getElevationAdjustedSunrise & getElevationAdjustedSunset are protected. Manually make the Object */
		this.zmanim = {
			sunrise: () => this.coreZC.isUseElevation() ? this.coreZC.getSunrise() : this.coreZC.getSeaLevelSunrise(),
			sunset: () => this.coreZC.isUseElevation() ? this.coreZC.getSunset() : this.coreZC.getSeaLevelSunset()
		}
	}

	/**
	 * @param {KosherZmanim.Temporal.PlainDate} plainDate
	 */
	setDate(plainDate) {
		this.coreZC.setDate(plainDate);
		this.tekufaCalc.setYear(this.coreZC.getDate().withCalendar("hebrew").year)
	}

	/** @returns {this} */
	tomorrow() {
		return this.chainDate(this.coreZC.getDate().add({days: 1}));
	}

	/**
	 * @param {KosherZmanim.Temporal.PlainDate} date 
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
		calc.setDate(date);

		// @ts-ignore
		return calc;
	}

	/**
	 * @param {{
	 * 	length: "hours"|"minutes";
	 *  format: "milliseconds"|"seconds"|"minutes"|"hours"
	 *  temporal: "gra"
	 * }} param
	 * @returns {number}
	 */
	getZmaniyotTime(param={ length: "hours", temporal: "gra", format: "milliseconds" }) {
		const {length, format, temporal} = param;

		if (temporal !== "gra") return;
		let timePeriod = this.coreZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		if (length == "minutes")
			timePeriod /= 60;

		let timeByFormat = timePeriod;
		switch (format) {
			case "milliseconds":
				break;
			case "seconds":
				timeByFormat /= 1000;
				break;
			case "minutes":
				timeByFormat /= 60_000;
				break;
			case "hours":
				timeByFormat = timeByFormat / 1000 / 60 / 60;
				break;
		}

		return timeByFormat;
	}

	/**
	 * @param {number} input
	 * @param {{length: "hours"|"minutes"; measure: "gra"}} adjustments
	 * @param {"milliseconds"|"seconds"|"minutes"|"hours"} returned
	 */
	fixedToZmaniyot(input, adjustments={length: "hours", measure: "gra"}, returned="milliseconds") {
		if (isNaN(input)) return;
		if (!this.getZmaniyotTime()) return;

		return input * this.getZmaniyotTime({length: adjustments.length, temporal: adjustments.measure, format: returned});
	}

	/**
	 * @param {KosherZmanim.Temporal.ZonedDateTime} time
	 */
	plagHaminchaCore(time) {
		return time.subtract({ milliseconds: Math.trunc(this.fixedToZmaniyot(1.25, {length: "hours", measure: "gra"})) })
	}

	/**
	 * @param {boolean} [fixedClock]
	 */
	nextTekufa(fixedClock) {
		const plainTekufoth = this.tekufaCalc.calculateTekufotShemuel(fixedClock);
		const tekufotTZ = plainTekufoth
			.map(temporal => temporal.toZonedDateTime("+02:00").withTimeZone(this.coreZC.getGeoLocation().getTimeZone()))

		return tekufotTZ.find(tekufa => this.coreZC.getDate().toZonedDateTime(this.coreZC.getGeoLocation().getTimeZone()).epochMilliseconds < tekufa.epochMilliseconds)
	}
}

class GRAZmanim extends ZmanimMathBase {
	getNetz() {
		return this.coreZC.getSeaLevelSunrise();
	}

	getSofZmanShmaGRA() {
		return this.zmanim.sunrise().add({ milliseconds: Math.trunc(this.fixedToZmaniyot(3, {length: "hours", measure: "gra"})) });
    }

	getSofZmanBrachothShma() {
		return this.zmanim.sunrise().add({ milliseconds: Math.trunc(this.fixedToZmaniyot(4, {length: "hours", measure: "gra"})) });
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
		return this.zmanim.sunrise().add({ milliseconds: Math.trunc(this.fixedToZmaniyot(9.5, {length: "hours", measure: "gra"})) });
	}

	getPlagHaminhaHalachaBrurah() {
		return this.plagHaminchaCore(this.zmanim.sunset());
	}

	getEarliestMinchaBirkatKohanim() {
		return this.zmanim.sunset().subtract({ minutes: 30 })
	}

	getCandleLighting() {
		return this.zmanim.sunset().subtract({ minutes: this.coreZC.getCandleLightingOffset() })
	}

	getShkiya() {
		return this.zmanim.sunset();
	}

	getTzaitTaanitLChumra() {
		return this.zmanim.sunset().add({ minutes: 30 });
	}
}

class AlotTzeitZmanim extends GRAZmanim {
	/**
	 * @param {{
	 * 	length: "hours"|"minutes";
	 *  format: "milliseconds"|"seconds"|"minutes"|"hours"
	 *  temporal: "gra"|"mga"
	 * }} param
	 * @returns {number}
	 */
	getZmaniyotTime(param={ length: "hours", temporal: "gra", format: "milliseconds" }) {
		const {length, format, temporal} = param;

		let timePeriod;
		switch (temporal) {
			case 'gra':
				timePeriod = this.coreZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
				break;
			case 'mga':
				timePeriod = this.coreZC.getTemporalHour(this.getAlotHashachar(), this.getTzait72Zmanit());
				break;
		}
		if (length == "minutes")
			timePeriod /= 60;

		let timeByFormat = timePeriod;
		switch (format) {
			case "milliseconds":
				break;
			case "seconds":
				timeByFormat /= 1000;
				break;
			case "minutes":
				timeByFormat /= 60_000;
				break;
			case "hours":
				timeByFormat = timeByFormat / 1000 / 60 / 60;
				break;
		}

		return timeByFormat;
	}

	/**
	 * @param {number} input
	 * @param {{length: "hours"|"minutes"; measure: "gra"|"mga"}} adjustments
	 * @param {"milliseconds"|"seconds"|"minutes"|"hours"} returned
	 */
	fixedToZmaniyot(input, adjustments={length: "hours", measure: "gra"}, returned="milliseconds") {
		if (isNaN(input)) return;
		if (!this.getZmaniyotTime()) return;

		return input * this.getZmaniyotTime({length: adjustments.length, temporal: adjustments.measure, format: returned});
	}

	getSofZmanShmaMGA() {
		return this.getAlotHashachar().add({ milliseconds: Math.trunc(this.fixedToZmaniyot(3, {length: "hours", measure: "mga"})) });
    }

	getSofZmanAchilathHametz() {
		return this.getAlotHashachar().add({ milliseconds: Math.trunc(this.fixedToZmaniyot(4, {length: "hours", measure: "mga"})) });
	}

	getSofZmanBiurHametz() {
		return this.getAlotHashachar().add({ milliseconds: Math.trunc(this.fixedToZmaniyot(5, {length: "hours", measure: "mga"})) });
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
	 * @return {KosherZmanim.Temporal.ZonedDateTime} the <code>Date</code> of chatzos. If the calculation can't be computed such as in the Arctic Circle
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
			this.getHatzoth().add({ milliseconds: Math.trunc(this.fixedToZmaniyot(30, {length: "minutes", measure: "gra"})) })
		]
		return timesToMeasure.sort(KosherZmanim.Temporal.ZonedDateTime.compare).at(-1) || null;
	}

	getPlagHaminhaYalkutYosef() {
		return this.plagHaminchaCore(this.getTzait());
	}

	getTzaitRT() {
		const rtTimes = [
			this.getTzait72Zmanit(),
			this.zmanim.sunset().add({ minutes: 72 })
		];

		if (settings.calendarToggle.rtKulah()) 
			return rtTimes.sort(KosherZmanim.Temporal.ZonedDateTime.compare)[0]
		else
			return rtTimes[0];
	}

	getSolarMidnight() {
		return this.coreZC.getSolarMidnight()
	}

	// <needsImplementation>

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
     */
	getAlotHashachar() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
     */
	getMisheyakir() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
     */
	getTzait() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
     */
	getTzait72Zmanit() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
     */
	getTzaitShabbath() { throw new Error("Unimplemented") }

	/**
     * Abstract method reserved for the Amudeh Hora'ah subclass.
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
     */
	getTzaitLechumra() { throw new Error("Not in Amudeh Hora'ah Mode") }

	/**
     * Abstract method reserved for the Ohr Hachaim subclass.
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
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
		this.coreZC.setUseElevation(elevation);
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
		return this.zmanim.sunrise()
			.subtract({ milliseconds: Math.trunc(this.fixedToZmaniyot(zemaniyot.minutes, { length: "minutes", measure: "gra"})) });
	}

	getMisheyakir(alotZemaniyot={minutes:72, degree: 16.04}, percentageForMisheyakir=(66/72)) {
		return this.zmanim.sunrise()
			.subtract({
				milliseconds: Math.trunc(this.fixedToZmaniyot((alotZemaniyot.minutes*percentageForMisheyakir), { length: "minutes", measure: "gra"}))
			});
	}

	getTzait() {
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(13.5, {length: "minutes", measure: "gra"}))
			})
	}

	getTzaitBenIshHai() {
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(27, {length: "minutes", measure: "gra"}))
			})
	}

	getTzaitLechumra() {
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(20, {length: "minutes", measure: "gra"}))
			})
	}

	getTzaitTaanit() {
		return this.zmanim.sunset().add({ minutes: 20 });
	}

	getTzaitShabbath(shabbatTimeObj = settings.customTimes.tzeithIssurMelakha()) {
		return this.zmanim.sunset().add({ minutes: shabbatTimeObj.minutes });
	}

	getTzait72Zmanit() {
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(72, {length: "minutes", measure: "gra"}))
			});
	}
}

class AmudehHoraahZmanim extends AlotTzeitZmanim {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		super(geoLocation)
		this.coreZC.setUseElevation(false);
	}

	/**
	 * @param {Parameters<KosherZmanim.ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[0]} degree 
	 * @param {Parameters<KosherZmanim.ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[1]} sunset 
	 * @returns {ReturnType<KosherZmanim.ZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>}
	 */
	equinoxSeasonalHourPercentFromDegrees(degree, sunset) {
		const equinoxDayZmanim = new KosherZmanim.ZmanimCalendar(this.coreZC.getGeoLocation());
		equinoxDayZmanim.setUseElevation(false);
		equinoxDayZmanim.setDate(new Date("March 17 " + this.coreZC.getDate().year.toString()));
		return equinoxDayZmanim.getPercentOfShaahZmanisFromDegrees(degree, sunset)
	}

	getAlotHashachar(zemaniyot={minutes: 72, degree: 16.04}) {
		const sunrisePercent = this.equinoxSeasonalHourPercentFromDegrees(zemaniyot.degree, false);
		return this.zmanim.sunrise()
			.subtract({
				milliseconds: Math.trunc(this.fixedToZmaniyot(sunrisePercent, {length: "hours", measure: "gra"}))
			})
	}

	getMisheyakir(alotZemaniyot={minutes: 72, degree: 16.04}, percentageForMisheyakir=(5/6)) {
		const sunrisePercent = this.equinoxSeasonalHourPercentFromDegrees(alotZemaniyot.degree, false);
		return this.zmanim.sunrise()
			.subtract({
				milliseconds: Math.trunc(this.fixedToZmaniyot(sunrisePercent, {length: "hours", measure: "gra"}) * percentageForMisheyakir)
			})
	}

	getTzait() {
		const sunsetPercent = this.equinoxSeasonalHourPercentFromDegrees(3.77, true);
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(sunsetPercent, {length: "hours", measure: "gra"}))
			})
	}

	getTzaitLechumra() {
		const sunsetPercent = this.equinoxSeasonalHourPercentFromDegrees(5.135, true);
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(sunsetPercent, {length: "hours", measure: "gra"}))
			})
	}

	getTzaitBenIshHai() {
		const sunsetPercent = this.equinoxSeasonalHourPercentFromDegrees(6.563, true);
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(sunsetPercent, {length: "hours", measure: "gra"}))
			})
	}

	getTzaitTaanitLChumra() {
		return [this.getTzaitLechumra(), super.getTzaitTaanitLChumra()].sort(KosherZmanim.Temporal.ZonedDateTime.compare).at(-1);
	}

	/**
     * Actual A"H implementation of Tzeit Shabbat
     * @returns {KosherZmanim.Temporal.ZonedDateTime} The return value.
     */
	getTzaitShabbath(shabbatTimeObj=settings.customTimes.tzeithIssurMelakha()) {
		const degree = shabbatTimeObj.degree + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH;
		const sunsetOffset = this.coreZC.getSunsetOffsetByDegrees(degree);
		if (!sunsetOffset || sunsetOffset.epochMilliseconds > this.getSolarMidnight().epochMilliseconds)
			return (shabbatTimeObj.degree > 5.32 ? this.getTzaitShabbath({ degree: 5.32, minutes: null }) : this.getSolarMidnight());

		return sunsetOffset;
	}

	getTzait72Zmanit() {
		const sunsetPercent = this.equinoxSeasonalHourPercentFromDegrees(16.01, true);
		return this.zmanim.sunset()
			.add({
				milliseconds: Math.trunc(this.fixedToZmaniyot(sunsetPercent, {length: "hours", measure: "gra"}))
			})
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