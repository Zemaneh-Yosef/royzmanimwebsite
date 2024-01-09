// @ts-check
// taken from https://webspace.science.uu.nl/~gent0113/hebrew/hebrewyear_year.htm#tekufot
import { Temporal } from "../libraries/kosherZmanim/kosher-zmanim.esm.js";

/**
 * @param {number} mjd
 */
function mjd2date(mjd){
    // Meeus, _Astronomical Algorithms_ (1998), Chapter 7, modified for mjd's

    var z = Math.floor(mjd); // integer MJD's

    if(mjd<-100840) var a = z; // assume Julian calendar

    if(mjd>=-100840){      // assume Gregorian calendar
        var aa  = Math.floor((z+532784.25)/36524.25);
        var a   = z+1+aa-Math.floor(aa/4);
    }  

    var b   = a+1102;
    var c   = Math.floor((b-122.1)/365.25);
    var d   = Math.floor(365.25*c);
    var e   = Math.floor((b-d)/30.6001);
    var dy  = b-d-Math.floor(30.6001*e); // day of month
    var mon = e-(e<13.5?2:14);           // month number
    var yr  = c+(mon>1.5?1856:1857);     // year    

    return Temporal.PlainDate.from({
        day: dy,
        month: mon + 1,
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
     * @param {boolean} fixedClock
     */
    calculateTekufotShemuel(fixedClock) {
        let temporalDates = [];
        const solarYearLength = 719513280/1969920;

        let mjd = solarYearLength*(this.hebrewYear-1.75)-2051833;
        for (let index = 0; index < 6; index++) {
            mjd += solarYearLength/4;
            let f = (mjd-0.25)-Math.floor(mjd-0.25);
            temporalDates.push(fracday2hrmin(f, mjd2date(mjd-0.25)))
        }

        if (!fixedClock)
            temporalDates = temporalDates.map(temporal => temporal.subtract({ minutes: 21 }))

        return temporalDates;
    }

    calculateTekufotRAda() {
        let temporalDates = [];
        const solarYearLength = 719507020/1969920;

        let mjd = solarYearLength*(this.hebrewYear-1.75)-2051826;
        for (let index = 0; index < 6; index++) {
            mjd += solarYearLength/4;
            let f = (mjd-0.25)-Math.floor(mjd-0.25);
            temporalDates.push(fracday2hrmin(f, mjd2date(mjd-0.25)))
        }

        return temporalDates;
    }
}