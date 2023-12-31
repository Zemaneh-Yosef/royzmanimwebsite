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
 * @param {number} n
 * @param {number} m
 */
function gmod(n,m){
    // generalized modulo function (n mod m) also valid for negative values of n

    return ((n%m)+m)%m;
}

/**
 * @param {number} fday
 * @param {Temporal.PlainDate} date 
 */
function fracday2hrmin(fday, date){
    // reduces the fractional part of the day to hours and minutes

    var hour = 24*fday;
    var hr   = Math.floor(hour);
    var min  = Math.floor(6000*(hour-hr)+0.5);

    if(min==0)
        return date.toPlainDateTime({ hour: hr });
    if((min>0) && (gmod(min,10)>0) || (min>0) && (gmod(min,100)==0))
        return date.toPlainDateTime({ hour: hr, minute: min/100 });
    if((min>0) && (gmod(min,100)>0) && (gmod(min,10)==0))
    return date.toPlainDateTime({ hour: hr, minute: (min/100) * 10 });
}

export default class TekufahCalculator {
    /**
     * @param {number} hebrewYear
     * @param {boolean} [fixedClock]
     */
    constructor(hebrewYear, fixedClock) {
        this.hebrewYear = hebrewYear
        this.solarYearLength = 719513280/1969920;
        this.fixedClock = fixedClock;

        this.startPoint = this.solarYearLength*(hebrewYear-1.75)-2051833
    }

    calculateTekufot() {
        let temporalDates = [];

        let mjd = this.startPoint;
        for (let index = 0; index < 6; index++) {
            mjd += this.solarYearLength/4;
            let f = mjd-Math.floor(mjd);

            f = (mjd-0.25)-Math.floor(mjd-0.25);
            temporalDates.push(fracday2hrmin(f, mjd2date(mjd-0.25)))
        }

        if (!this.fixedClock)
            temporalDates = temporalDates.map(temporal => temporal.subtract({ minutes: 21 }))

        return temporalDates;
    }
}