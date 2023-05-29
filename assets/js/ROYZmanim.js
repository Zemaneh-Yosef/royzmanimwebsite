// @ts-check

// Comment out the commenters when developing
/* 
import * as KosherZmanim from "./libraries/kosherzmanim/kosher-zmanim.js"
import luxon from "./libraries/luxon/index.js";
export default
// */

class ROZmanim extends KosherZmanim.ComplexZmanimCalendar {
	//custom zmanim class, RO stands for Rabbi Ovadia
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		super(geoLocation);
		this.setCandleLightingOffset(20);
		this.setUseElevation(true);
	}

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getAlos72Zmanis(amudehHoraah) {
		if (!amudehHoraah)
			return super.getAlos72Zmanis()

		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunrise = this.getSeaLevelSunrise();
		const alotBy16point1Degrees = this.getAlos16Point1Degrees();
		const numberOfMinutes = ((sunrise.toMillis() - alotBy16point1Degrees.toMillis()) / 60_000);
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;

		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunrise(), -(numberOfMinutes * dakahZmanit))
	}

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getEarliestTalitAndTefilin(amudehHoraah) {
		if (amudehHoraah) {
			const originalDate = this.getDate()
			this.setDate(new Date("March 17 " + originalDate.year.toString())); // Set the Calendar to the equinox
			const sunrise = this.getSeaLevelSunrise();
			const alotBy16point1Degrees = this.getAlos16Point1Degrees(); // 16.1 degrees is 72 minutes before sunrise in Netanya on the equinox, so no adjustment is needed
			const numberOfMinutes = ((sunrise.toMillis() - alotBy16point1Degrees.toMillis()) / 60_000);
			this.setDate(originalDate);

			const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
			const dakahZmanit = shaahZmanit / 60;

			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunrise(), -(numberOfMinutes * dakahZmanit * 5 / 6));
		} else {
			var shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
			var dakahZmanit = shaahZmanit / 60;
			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
				this.getAlos72Zmanis(),
				6 * dakahZmanit
			);
		}
	}

	//TODO Netz

	getSofZmanShmaMGA72MinutesZmanis(amudehHoraah) {
        return this.getSofZmanShma(this.getAlos72Zmanis(amudehHoraah), this.getTzais72Zmanis(amudehHoraah));
    }

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getSofZmanAchilatChametzMGA(amudehHoraah) {
		return this.getSofZmanTfila(this.getAlos72Zmanis(amudehHoraah), this.getTzais72Zmanis(amudehHoraah));
	}

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getSofZmanBiurChametzMGA(amudehHoraah) {
		var shaahZmanit = this.getTemporalHour(
			this.getAlos72Zmanis(amudehHoraah),
			this.getTzais72Zmanis(amudehHoraah)
		);
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getAlos72Zmanis(amudehHoraah),
			shaahZmanit * 5
		);
	}

	/**
	 * Workaround for passing an invalid argument
	 * {@link KosherZmanim.ComplexZmanimCalendar.getMinchaKetana}
	 */
	getMinhaKetana() {
		return this.getMinchaKetana();
	}
	/**
	 * @param {luxon.DateTime} time
	 * @param {boolean} amudehHoraah
	 */
	plagHaminchaCore(time, amudehHoraah) {
		let sunrise, sunset;
		if (amudehHoraah) {
			sunrise = this.getSeaLevelSunrise();
			sunset = this.getSeaLevelSunset();
		} else {
			sunrise = this.getElevationAdjustedSunrise();
			sunset = this.getElevationAdjustedSunset();
		}

		const shaahZmanit = this.getTemporalHour(sunrise, sunset);
		const dakahZmanit = shaahZmanit / 60;
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			time,
			-(shaahZmanit + 15 * dakahZmanit)
		);

	}

	/**
 * @param {boolean} [amudehHoraah]
 */
	getPlagHaminchaYalkutYosef(amudehHoraah) {
		return this.plagHaminchaCore(this.getTzait(amudehHoraah), amudehHoraah);
	}

	/**
 * @param {boolean} [amudehHoraah]
 */
	getPlagHaminchaHalachaBrurah(amudehHoraah) {
		return this.plagHaminchaCore(this.getSunset(), amudehHoraah);
	}

	getCandleLighting() {
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getElevationAdjustedSunset(),
			-(this.getCandleLightingOffset() * 60_000)
		);
	}

	/**
	 * @param {boolean} [degreeShaotZmaniot]
	 */
	getTzait(degreeShaotZmaniot) {
		if (degreeShaotZmaniot) {
			const originalDate = this.getDate()
			this.setDate(new Date("March 17 " + originalDate.year.toString()))
			const sunset = this.getSeaLevelSunset();
			const tzaitBy3point86degrees = this.getSunsetOffsetByDegrees(KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH + 3.86);
			const numberOfMinutes = ((tzaitBy3point86degrees.toMillis() - sunset.toMillis()) / 60_000);
			this.setDate(originalDate);

			const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
			const dakahZmanit = shaahZmanit / 60;

			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), numberOfMinutes * dakahZmanit);
		} else {
			const shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
			const dakahZmanit = shaahZmanit / 60;
			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
				this.getElevationAdjustedSunset(),
				13 * dakahZmanit + dakahZmanit / 2
			);
		}
	}

	getTzaitLChumra() {
		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunset = this.getSeaLevelSunset();
		const tzaitBy5point054degrees = this.getSunriseOffsetByDegrees(90.0 + 5.054);
		const numberOfMinutes = ((tzaitBy5point054degrees.toMillis() - sunset.toMillis()) / 60_000);
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;

		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), numberOfMinutes * dakahZmanit);
	}

	getTzaitTaanit() {
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getElevationAdjustedSunset(),
			20 * 60_000
		);
	}

	getTzaitTaanitLChumra() {
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getElevationAdjustedSunset(),
			30 * 60_000
		);
	}

	getTzaitShabbatAmudehHoraah() {
		return this.getSunsetOffsetByDegrees(90.0 + 7.18);
	}

	/**
 * @param {boolean} [amudehHoraah]
 */
	getTzais72Zmanis(amudehHoraah) {
		if (!amudehHoraah)
			return super.getTzais72Zmanis();

		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunset = this.getSeaLevelSunset();
		const tzaitBy16Degrees = this.getSunriseOffsetByDegrees(90.0 + 16.0);
		const numberOfMinutes = ((tzaitBy16Degrees.toMillis() - sunset.toMillis()) / 60_000);
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;

		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), (numberOfMinutes * dakahZmanit))
	}

		/**
 * @param {boolean} [amudehHoraah]
 */
	getTzais72ZmanisLKulah(amudehHoraah) {
		if (this.getTzais72().toMillis() > this.getTzais72Zmanis(amudehHoraah).toMillis()) {
			return this.getTzais72Zmanis(amudehHoraah);
		} else {
			return this.getTzais72();
		}
	}
}