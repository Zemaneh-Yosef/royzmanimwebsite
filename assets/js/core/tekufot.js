// @ts-check
// taken from https://webspace.science.uu.nl/~gent0113/hebrew/hebrewyear_year.htm#tekufot

/** Modified Julian Day 0 */
const MJD_EPOCH = "1858-11-17";

/**
 * The (Gregorian) date of a Modified Julian Day. The site's dates start with the Gregorian calendar
 * (misc/util.js EARLIEST_DATE), so there are no Julian-calendar dates to handle.
 * @param {number} mjd
 */
function mjd2date(mjd) {
	return Temporal.PlainDate.from(MJD_EPOCH).add({ days: Math.floor(mjd) });
}

/**
 * @param {number} fday
 * @param {Temporal.PlainDate} date 
 */
function fracday2hrmin(fday, date){
	// reduces the fractional part of the day to hours and minutes

	const hour = 24*fday;
	const minute = (hour - Math.trunc(hour)) * 60;
	const second = (minute - Math.trunc(minute)) * 60; 

	return date
		.toPlainDateTime({
			hour: Math.trunc(hour),
			minute: Math.trunc(minute),
			second: Math.trunc(second)
		});
}

export default class TekufahCalculator {
	/**
	 * @param {number} hebrewYear
	 */
	constructor(hebrewYear) {
		this.setYear(hebrewYear)
	}

	/**
	 * @param {number} hebrewYear
	 */
	setYear(hebrewYear) {
		this.hebrewYear = hebrewYear
	}

	/**
	 * @param {number} solarYearLength
	 * @param {number} val2
	 */
	calculateTekufot(solarYearLength, val2) {
		let tekTimes = [];

		let mjd = solarYearLength*(this.hebrewYear-1.75)-val2;
		for (let index = 0; index < 6; index++) {
			mjd += solarYearLength/4;
			let f = (mjd-0.25)-Math.floor(mjd-0.25);
			tekTimes.push(fracday2hrmin(f, mjd2date(mjd-0.25)))
		}

		return tekTimes;
	}

	/**
	 * @param {boolean} fixedClock
	 */
	calculateTekufotShemuel(fixedClock) {
		let tekTimes = this.calculateTekufot(365.25, 2051833);
		if (!fixedClock)
			tekTimes = tekTimes.map(time => time.subtract({ minutes: 20, seconds: 56, milliseconds: 496 }))

		return tekTimes;
	}

	calculateTekufotRAda() {
		return this.calculateTekufot(235/19 * (29 + 13753/25920), 2051826);
	}
}