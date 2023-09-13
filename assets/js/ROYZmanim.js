// @ts-check

// Comment the following line before going live (as well as the export line on the bottom)!
import * as KosherZmanim from "./libraries/kosher-zmanim.esm.js"
import { settings } from "./settings/handler.js";

class ROYZmanim {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.coreCZC = new KosherZmanim.ZmanimCalendar(geoLocation)

		/* getElevationAdjustedSunrise & getElevationAdjustedSunset are protected. Manually make the Object */
		this.zmanim = {
			sunrise: () => this.coreCZC.isUseElevation() ? this.coreCZC.getSunrise() : this.coreCZC.getSeaLevelSunrise(),
			sunset: () => this.coreCZC.isUseElevation() ? this.coreCZC.getSunset() : this.coreCZC.getSeaLevelSunset()
		}
	}

	// <core>

	/**
	 * @param {luxon.DateTime} time
	 */
	plagHaminchaCore(time) {
		const shaahZmanit = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		const dakahZmanit = shaahZmanit / 60;
		return time.minus(shaahZmanit + 15 * dakahZmanit)
	}

	// </core>
	// <portable>

	getNetz() {
		return this.coreCZC.getSeaLevelSunrise();
	}

	getSofZmanShmaMGA() {
        return this.coreCZC.getShaahZmanisBasedZman(this.getAlotHashachar(), this.getTzait72Zmanit(), 3);
    }

	getSofZmanShmaGRA() {
        return this.coreCZC.getShaahZmanisBasedZman(this.zmanim.sunrise(), this.zmanim.sunset(), 3);
    }

	getSofZmanBrachothShma() {
        return this.coreCZC.getShaahZmanisBasedZman(this.zmanim.sunrise(), this.zmanim.sunset(), 4);
    }

	getSofZmanAchilathHametz() {
		return this.coreCZC.getShaahZmanisBasedZman(this.getAlotHashachar(), this.getTzait72Zmanit(), 4);
	}

	getSofZmanBiurHametz() {
		const shaahZmanit = this.coreCZC.getTemporalHour(this.getAlotHashachar(), this.getTzait72Zmanit());
		return KosherZmanim.ZmanimCalendar.getTimeOffset(
			this.getAlotHashachar(),
			shaahZmanit * 5
		);
	}

	/**
	 * This method returns <em>chatzos</em> (midday) following most opinions that <em>chatzos</em> is the midpoint
	 * between {@link #getSeaLevelSunrise sea level sunrise} and {@link #getSeaLevelSunset sea level sunset}. A day
	 * starting at <em>alos</em> and ending at <em>tzais</em> using the same time or degree offset will also return
	 * the same time. The returned value is identical to {@link #getSunTransit()}. In reality due to lengthening or
	 * shortening of day, this is not necessarily the exact midpoint of the day, but it is very close.
	 * 
	 * @see AstronomicalCalendar#getSunTransit()
	 * @return {luxon.DateTime} the <code>Date</code> of chatzos. If the calculation can't be computed such as in the Arctic Circle
	 *                          where there is at least one day where the sun does not rise, and one where it does not set, a null will
	 *                          be returned. See detailed explanation on top of the {@link KosherZmanim.AstronomicalCalendar AstronomicalCalendar}
	 *                          documentation.
	 */
	getHatzoth() {
		return this.coreCZC.getSunTransit();
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
		return window.luxon.DateTime.max(this.coreCZC.getChatzos().plus({minutes: 30}), this.coreCZC.getMinchaGedola()) || null;
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
	 * @param startOfDay
	 *            the start of day for calculating <em>Mincha ketana</em>. This can be sunrise or any alos passed to
	 *            this method.
	 * @param endOfDay
	 *            the end of day for calculating <em>Mincha ketana</em>. This can be sunrise or any alos passed to
	 *            this method.
	 * @return the <code>Date</code> of the time of <em>Mincha ketana</em> based on the start and end of day times
	 *         passed to this method. If the calculation can't be computed such as in the Arctic Circle where there is
	 *         at least one day a year where the sun does not rise, and one where it does not set, a null will be
	 *         returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
	 */
	getMinchaKetana(startOfDay = this.zmanim.sunrise(), endOfDay = this.zmanim.sunset()) {
		return this.coreCZC.getShaahZmanisBasedZman(startOfDay, endOfDay, 9.5);
	}

	getPlagHaminhaHalachaBrurah() {
		return this.plagHaminchaCore(this.zmanim.sunset());
	}

	getPlagHaminhaYalkutYosef() {
		return this.plagHaminchaCore(this.getTzait());
	}

	getShkiya() {
		return this.zmanim.sunset();
	}

	getCandleLighting() {
		return this.zmanim.sunset().minus({ minutes: this.coreCZC.getCandleLightingOffset() })
	}

	getTzaitTaanitLChumra() {
		return this.zmanim.sunset().plus({ minutes: 30 });
	}

	getTzaitRT() {
		if (settings.calendarToggle.rtKulah())
			return window.luxon.DateTime.min(this.coreCZC.getTzais72(), this.getTzait72Zmanit())
		else
			return this.getTzait72Zmanit();
	}

	getSolarMidnight() {
		return this.coreCZC.getSolarMidnight()
	}

	// </portable>
	// <needsImplementation>

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {luxon.DateTime} The return value.
     */
	getAlotHashachar() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {luxon.DateTime} The return value.
     */
	getMisheyakir() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {luxon.DateTime} The return value.
     */
	getTzait() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {luxon.DateTime} The return value.
     */
	getTzait72Zmanit() { throw new Error("Unimplemented") }

	/**
     * Abstract method that should be implemented by subclasses.
     * @returns {luxon.DateTime} The return value.
     */
	getTzaitShabbath() { throw new Error("Unimplemented") }

	/**
     * Abstract method reserved for the Amudeh Hora'ah subclass.
     * @returns {luxon.DateTime} The return value.
     */
	getTzaitLechumra() { throw new Error("Not in Amudeh Hora'ah Mode") }

	/**
     * Abstract method reserved for the Ohr Hachaim subclass.
     * @returns {luxon.DateTime} The return value.
     */
	getTzaitTaanit() { throw new Error("Not in Ohr Hachaim Mode") }

	// </needsImplementaton>
}

class OhrHachaimZmanim extends ROYZmanim {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 * @param {boolean} elevation
	 */
	constructor(geoLocation, elevation) {
		super(geoLocation)
		this.coreCZC.setUseElevation(elevation);
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
	getAlotHashachar() {
		const shaahZmanis = this.coreCZC.getShaahZmanisGra();
		return this.zmanim.sunrise().minus(shaahZmanis * 1.2);;
	}

	getMisheyakir() {
		const shaahZmanit = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		const dakahZmanit = shaahZmanit / 60;
		return KosherZmanim.ZmanimCalendar.getTimeOffset(
			this.getAlotHashachar(),
			6 * dakahZmanit
		);
	}

	getTzait() {
		const shaahZmanit = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		const dakahZmanit = shaahZmanit / 60;
		return this.zmanim.sunset().plus(13.5 * dakahZmanit);
	}

	getTzaitTaanit() {
		return this.zmanim.sunset().plus(60_000 * 20);
	}

	getTzaitShabbath(shabbatTimeObj = settings.customTimes.tzeithIssurMelakha()) {
		return this.zmanim.sunset().plus(60_000 * shabbatTimeObj.minutes);
	}

	getTzait72Zmanit() {
		const shaahZmanis = this.coreCZC.getShaahZmanisGra();
		return this.zmanim.sunset().plus(shaahZmanis * 1.2);;
	}
}

class AmudehHoraahZmanim extends ROYZmanim {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		super(geoLocation)
		this.coreCZC.setUseElevation(false);
	}

	/**
	 * 
	 * @param {Parameters<KosherZmanim.ComplexZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[0]} degree 
	 * @param {Parameters<KosherZmanim.ComplexZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>[1]} sunset 
	 * @returns {ReturnType<KosherZmanim.ComplexZmanimCalendar["getPercentOfShaahZmanisFromDegrees"]>} Percentage
	 */
	getPercentOfShaahZmanisFromDegreesOnEquinoxDay(degree, sunset) {
		const equinoxDayZmanim = new KosherZmanim.ComplexZmanimCalendar(this.coreCZC.getGeoLocation());
		equinoxDayZmanim.setUseElevation(false);
		equinoxDayZmanim.setDate(new Date("March 17 " + this.coreCZC.getDate().year.toString()));
		return equinoxDayZmanim.getPercentOfShaahZmanisFromDegrees(degree, sunset)
	}

	getAlotHashachar(degree=16.04) {
		const sunrisePercent = this.getPercentOfShaahZmanisFromDegreesOnEquinoxDay(degree, false);
		const temporalHour = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		return KosherZmanim.ZmanimCalendar.getTimeOffset(this.zmanim.sunrise(), -(sunrisePercent * temporalHour));
	}

	getMisheyakir(degree=16.04) {
		const sunrisePercent = this.getPercentOfShaahZmanisFromDegreesOnEquinoxDay(degree, false);
		const temporalHour = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		return KosherZmanim.ZmanimCalendar.getTimeOffset(this.zmanim.sunrise(), -(sunrisePercent * temporalHour * 5 / 6));
	}

	getTzait() {
		const sunsetPercent = this.getPercentOfShaahZmanisFromDegreesOnEquinoxDay(3.77, true);
		const temporalHour = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		return KosherZmanim.ZmanimCalendar.getTimeOffset(this.zmanim.sunset(), sunsetPercent * temporalHour);
	}

	getTzaitLechumra() {
		const sunsetPercent = this.getPercentOfShaahZmanisFromDegreesOnEquinoxDay(5.054, true);
		const temporalHour = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		return KosherZmanim.ZmanimCalendar.getTimeOffset(this.zmanim.sunset(), sunsetPercent * temporalHour);
	}

	getTzaitTaanitLChumra() {
		return window.luxon.DateTime.max(this.getTzaitLechumra(), super.getTzaitTaanitLChumra());
	}

	/**
     * Actual A"H implementation of Tzeit Shabbat
     * @returns {luxon.DateTime} The return value.
     */
	getTzaitShabbath(shabbatTimeObj=settings.customTimes.tzeithIssurMelakha()) {
		const degree = shabbatTimeObj.degree + KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH;
		const sunsetOffset = this.coreCZC.getSunsetOffsetByDegrees(degree);
		if (!sunsetOffset || sunsetOffset.toMillis() > this.getSolarMidnight().toMillis())
			return (shabbatTimeObj.degree > 5.32 ? this.getTzaitShabbath({ degree: 5.32, minutes: null }) : this.getSolarMidnight());

		return sunsetOffset;
	}

	getTzait72Zmanit() {
		const sunsetPercent = this.getPercentOfShaahZmanisFromDegreesOnEquinoxDay(16.01, true);
		const temporalHour = this.coreCZC.getTemporalHour(this.zmanim.sunrise(), this.zmanim.sunset());
		return KosherZmanim.ZmanimCalendar.getTimeOffset(this.zmanim.sunset(), sunsetPercent * temporalHour);
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

const methodNames = getAllMethods(ROYZmanim.prototype)

export {
	OhrHachaimZmanim,
	AmudehHoraahZmanim,
	methodNames
};