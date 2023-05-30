// @ts-check

// Comment out the commenters when developing
/*
import * as KosherZmanim from "./libraries/dev/kosherZmanim.js"
export default
*/

class ROZmanim extends KosherZmanim.ComplexZmanimCalendar {
	/**
	 * @param {boolean} degreeValue
	 */
	setDegreeUsage(degreeValue) {
		this.degreeUsage = degreeValue;
	}

	getMorningShaotZmaniyot(degree=16.04) {
		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunrise = this.getSeaLevelSunrise();
		const alotBy16point1Degrees = this.getSunriseOffsetByDegrees(new Decimal(degree).plus(KosherZmanim.ZmanimCalendar.GEOMETRIC_ZENITH).toNumber());
		const numberOfMilli = sunrise.toMillis() - alotBy16point1Degrees.toMillis();
		const numberOfSeconds = numberOfMilli / 1000;
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;
		const secondsZmanit = dakahZmanit / 60;

		return {shaahZmanit, dakahZmanit, secondsZmanit, numberOfMilli, numberOfSeconds}
	}

	getAlos72Zmanis(degree=16.04) {
		if (!this.degreeUsage)
			return super.getAlos72Zmanis()

		const {numberOfSeconds, secondsZmanit} = this.getMorningShaotZmaniyot(degree);
		return KosherZmanim.ZmanimCalendar.getTimeOffset(this.getSeaLevelSunrise(), -(numberOfSeconds * secondsZmanit))
	}

	getEarliestTalitAndTefilin(degree=16.04) {
		if (this.degreeUsage) {
			const {numberOfSeconds, secondsZmanit} = this.getMorningShaotZmaniyot(degree);
			return KosherZmanim.ZmanimCalendar.getTimeOffset(this.getSeaLevelSunrise(), -(numberOfSeconds * secondsZmanit * 5 / 6));
		} else {
			var shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
			var dakahZmanit = shaahZmanit / 60;
			return KosherZmanim.ZmanimCalendar.getTimeOffset(
				this.getAlos72Zmanis(),
				6 * dakahZmanit
			);
		}
	}

	//TODO Netz

	getSofZmanShmaMGA72MinutesZmanis() {
        return this.getSofZmanShma(this.getAlos72Zmanis(), this.getTzais72Zmanis());
    }

	getSofZmanAchilatChametzMGA() {
		return this.getSofZmanTfila(this.getAlos72Zmanis(), this.getTzais72Zmanis());
	}

	getSofZmanBiurChametzMGA() {
		const shaahZmanit = this.getTemporalHour(this.getAlos72Zmanis(), this.getTzais72Zmanis());
		return KosherZmanim.ZmanimCalendar.getTimeOffset(
			this.getAlos72Zmanis(),
			shaahZmanit * 5
		);
	}

	/**
	 * @param {luxon.DateTime} time
	 */
	plagHaminchaCore(time) {
		const shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
		const dakahZmanit = shaahZmanit / 60;
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			time,
			-(shaahZmanit + 15 * dakahZmanit)
		);

	}

	getPlagHaminchaYalkutYosef() {
		return this.plagHaminchaCore(this.getTzait());
	}

	getPlagHaminchaHalachaBrurah() {
		// @ts-ignore
		return this.plagHaminchaCore(this.getSunset());
	}

	getCandleLighting() {
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getElevationAdjustedSunset(),
			-(this.getCandleLightingOffset() * 60_000)
		);
	}

	getTzait(degree=3.75) {
		if (this.degreeUsage) {
			const originalDate = this.getDate()
			this.setDate(new Date("March 17 " + originalDate.year.toString()))
			const sunset = this.getSeaLevelSunset();
			const tzaitGeonimInDegrees = this.getSunsetOffsetByDegrees(new Decimal(degree).plus(KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH).toNumber());
			const numberOfMilli = tzaitGeonimInDegrees.toMillis() - sunset.toMillis();
			const numberOfSeconds = numberOfMilli / 1000;
			this.setDate(originalDate);

			const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
			const dakahZmanit = shaahZmanit / 60;
			const secondsZmanit = dakahZmanit / 60;

			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), numberOfSeconds * secondsZmanit);
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
		const tzaitBy5point054degrees = this.getSunsetOffsetByDegrees(90.0 + 5.054);
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

	getTzaitShabbat() {
		if (this.degreeUsage)
			return this.getSunsetOffsetByDegrees(90.0 + 7.18);
		else
			return this.getTzaisAteretTorah()
	}

	getTzais72Zmanis() {
		if (!this.degreeUsage)
			return super.getTzais72Zmanis();

		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunset = this.getSeaLevelSunset();
		const tzaitBy16Degrees = this.getSunsetOffsetByDegrees(90.0 + 16.0);
		const numberOfMinutes = ((tzaitBy16Degrees.toMillis() - sunset.toMillis()) / 60_000);
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;

		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), (numberOfMinutes * dakahZmanit))
	}

	getTzais72ZmanisLKulah() {
		if (this.getTzais72().toMillis() > this.getTzais72Zmanis().toMillis()) {
			return this.getTzais72Zmanis();
		} else {
			return this.getTzais72();
		}
	}
}