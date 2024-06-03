// @ts-check
// taken from https://webspace.science.uu.nl/~gent0113/hebrew/hebrewyear_year.htm#tekufot
import { Temporal } from "../libraries/kosherZmanim/kosher-zmanim.esm.js";

/**
 * @param {number} mjd
 */
function mjd2date(mjd){
	// Meeus, _Astronomical Algorithms_ (1998), Chapter 7, modified for mjd's
	let z = Math.floor(mjd); // integer MJD's

	let a;
	if (mjd<-100840) // assume Julian calendar
		a = z;
	else {           // assume Gregorian calendar
		let aa  = Math.floor((z+532784.25)/36524.25);
		a = z+1+aa-Math.floor(aa/4);
	}

	let b  = a+1102;
	let c  = Math.floor((b-122.1)/365.25);
	let d  = Math.floor(365.25*c);
	let e  = Math.floor((b-d)/30.6001);
	let dy = b-d-Math.floor(30.6001*e); // day
	let mn = e-(e<13.5?2:14);           // month
	var yr = c+(mn>1.5?1856:1857);      // year

	return Temporal.PlainDate.from({
		day: dy,
		month: mn + 1,
		year: yr
	});
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
		let tekTimes = this.calculateTekufot(719513280/1969920, 2051833);
		if (!fixedClock)
			tekTimes = tekTimes.map(time => time.subtract({ minutes: 20, seconds: 56, milliseconds: 496 }))

		return tekTimes;
	}

	calculateTekufotRAda() {
		return this.calculateTekufot(719507020/1969920, 2051826);
	}
}