import { AstronomicalCalculator } from './AstronomicalCalculator';
import { MathUtils } from '../polyfills/Utils';
/**
 * Implementation of sunrise and sunset methods to calculate astronomical times. This calculator uses the Java algorithm
 * written by <a href="http://web.archive.org/web/20090531215353/http://www.kevinboone.com/suntimes.html">Kevin
 * Boone</a> that is based on the <a href = "http://aa.usno.navy.mil/">US Naval Observatory's</a><a
 * href="http://aa.usno.navy.mil/publications/docs/asa.php">Almanac</a> for Computer algorithm ( <a
 * href="http://www.amazon.com/exec/obidos/tg/detail/-/0160515106/">Amazon</a>, <a
 * href="http://search.barnesandnoble.com/booksearch/isbnInquiry.asp?isbn=0160515106">Barnes &amp; Noble</a>) and is
 * used with his permission. Added to Kevin's code is adjustment of the zenith to account for elevation.
 *
 * @author &copy; Eliyahu Hershfeld 2004 - 2019
 * @author &copy; Kevin Boone 2000
 * @version 1.1
 */
export class SunTimesCalculator extends AstronomicalCalculator {
    /**
     * @see AstronomicalCalculator#getCalculatorName()
     */
    // eslint-disable-next-line class-methods-use-this
    getCalculatorName() {
        return 'US Naval Almanac Algorithm';
    }
    /**
     * @see AstronomicalCalculator#getUTCSunrise(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunrise(date, geoLocation, zenith, adjustForElevation) {
        const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
        const adjustedZenith = this.adjustZenith(zenith, elevation);
        const doubleTime = SunTimesCalculator.getTimeUTC(date, geoLocation.getLongitude(), geoLocation.getLatitude(), adjustedZenith, true);
        return doubleTime;
    }
    /**
     * @see AstronomicalCalculator#getUTCSunset(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunset(date, geoLocation, zenith, adjustForElevation) {
        const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
        const adjustedZenith = this.adjustZenith(zenith, elevation);
        const doubleTime = SunTimesCalculator.getTimeUTC(date, geoLocation.getLongitude(), geoLocation.getLatitude(), adjustedZenith, false);
        return doubleTime;
    }
    /**
     * sin of an angle in degrees
     */
    static sinDeg(deg) {
        // return Math.sin(deg * 2 * Math.PI / 360);
        return Math.sin(MathUtils.degreesToRadians(deg));
    }
    /**
     * acos of an angle, result in degrees
     */
    static acosDeg(x) {
        // return Math.acos(x) * 360 / (2 * Math.PI);
        return MathUtils.radiansToDegrees(Math.acos(x));
    }
    /**
     * asin of an angle, result in degrees
     */
    static asinDeg(x) {
        // return Math.asin(x) * 360 / (2 * Math.PI);
        return MathUtils.radiansToDegrees(Math.asin(x));
    }
    /**
     * tan of an angle in degrees
     */
    static tanDeg(deg) {
        // return Math.tan(deg * 2 * Math.PI / 360);
        return Math.tan(MathUtils.degreesToRadians(deg));
    }
    /**
     * Calculate cosine of the angle in degrees
     *
     * @param deg degrees
     * @return cosine of the angle in degrees
     */
    static cosDeg(deg) {
        // return Math.cos(deg * 2 * Math.PI / 360);
        return Math.cos(MathUtils.degreesToRadians(deg));
    }
    /**
     * Get time difference between location's longitude and the Meridian, in hours. West of Meridian has a negative time
     * difference
     */
    static getHoursFromMeridian(longitude) {
        return longitude / SunTimesCalculator.DEG_PER_HOUR;
    }
    /**
     * Calculate the approximate time of sunset or sunrise in days since midnight Jan 1st, assuming 6am and 6pm events. We
     * need this figure to derive the Sun's mean anomaly.
     *
     * @param dayOfYear the day of year
     * @param hoursFromMeridian hours from the meridian
     * @param isSunrise true for sunrise and false for sunset
     *
     * @return the approximate time of sunset or sunrise in days since midnight Jan 1st, assuming 6am and 6pm events. We
     * need this figure to derive the Sun's mean anomaly.
     */
    static getApproxTimeDays(dayOfYear, hoursFromMeridian, isSunrise) {
        if (isSunrise) {
            return dayOfYear + ((6 - hoursFromMeridian) / 24);
        }
        // sunset
        return dayOfYear + ((18 - hoursFromMeridian) / 24);
    }
    /**
     * Calculate the Sun's mean anomaly in degrees, at sunrise or sunset, given the longitude in degrees
     *
     * @param dayOfYear the day of the year
     * @param longitude longitude
     * @param isSunrise true for sunrise and false for sunset
     * @return the Sun's mean anomaly in degrees
     */
    static getMeanAnomaly(dayOfYear, longitude, isSunrise) {
        return (0.9856 * SunTimesCalculator.getApproxTimeDays(dayOfYear, SunTimesCalculator.getHoursFromMeridian(longitude), isSunrise)) - 3.289;
    }
    /**
     * Calculates the Sun's true longitude in degrees. The result is an angle gte 0 and lt 360. Requires the Sun's mean
     * anomaly, also in degrees
     */
    static getSunTrueLongitude(sunMeanAnomaly) {
        let l = sunMeanAnomaly + (1.916 * SunTimesCalculator.sinDeg(sunMeanAnomaly)) + (0.020 * SunTimesCalculator.sinDeg(2 * sunMeanAnomaly)) + 282.634;
        // get longitude into 0-360 degree range
        if (l >= 360) {
            l = l - 360;
        }
        if (l < 0) {
            l = l + 360;
        }
        return l;
    }
    /**
     * Calculates the Sun's right ascension in hours, given the Sun's true longitude in degrees. Input and output are
     * angles gte 0 and lt 360.
     */
    static getSunRightAscensionHours(sunTrueLongitude) {
        const a = 0.91764 * SunTimesCalculator.tanDeg(sunTrueLongitude);
        let ra = 360 / (2 * Math.PI) * Math.atan(a);
        const lQuadrant = Math.floor(sunTrueLongitude / 90) * 90;
        const raQuadrant = Math.floor(ra / 90) * 90;
        ra += (lQuadrant - raQuadrant);
        return ra / SunTimesCalculator.DEG_PER_HOUR; // convert to hours
    }
    /**
     * Calculate the cosine of the Sun's local hour angle
     *
     * @param sunTrueLongitude the sun's true longitude
     * @param latitude the latitude
     * @param zenith the zenith
     * @return the cosine of the Sun's local hour angle
     */
    static getCosLocalHourAngle(sunTrueLongitude, latitude, zenith) {
        const sinDec = 0.39782 * SunTimesCalculator.sinDeg(sunTrueLongitude);
        const cosDec = SunTimesCalculator.cosDeg(SunTimesCalculator.asinDeg(sinDec));
        return (SunTimesCalculator.cosDeg(zenith) - (sinDec * SunTimesCalculator.sinDeg(latitude))) / (cosDec * SunTimesCalculator.cosDeg(latitude));
    }
    /**
     * Calculate local mean time of rising or setting. By `local' is meant the exact time at the location, assuming that
     * there were no time zone. That is, the time difference between the location and the Meridian depended entirely on
     * the longitude. We can't do anything with this time directly; we must convert it to UTC and then to a local time.
     * The result is expressed as a fractional number of hours since midnight
     *
     * @param localHour the local hour
     * @param sunRightAscensionHours the sun's right ascention in hours
     * @param approxTimeDays approximate time days
     *
     * @return the fractional number of hours since midnight as a double
     */
    static getLocalMeanTime(localHour, sunRightAscensionHours, approxTimeDays) {
        return localHour + sunRightAscensionHours - (0.06571 * approxTimeDays) - 6.622;
    }
    /**
     * Get sunrise or sunset time in UTC, according to flag.
     *
     * @param year
     *            4-digit year
     * @param month
     *            month, 1-12 (not the zero based Java month
     * @param day
     *            day of month, 1-31
     * @param longitude
     *            in degrees, longitudes west of Meridian are negative
     * @param latitude
     *            in degrees, latitudes south of equator are negative
     * @param zenith
     *            Sun's zenith, in degrees
     * @param type
     *            type of calculation to carry out {@link #TYPE_SUNRISE} or {@link #TYPE_SUNRISE}.
     *
     * @return the time as a double. If an error was encountered in the calculation (expected behavior for some
     *         locations such as near the poles, {@link Double.NaN} will be returned.
     */
    static getTimeUTC(date, longitude, latitude, zenith, isSunrise) {
        const dayOfYear = date.ordinal;
        const sunMeanAnomaly = SunTimesCalculator.getMeanAnomaly(dayOfYear, longitude, isSunrise);
        const sunTrueLong = SunTimesCalculator.getSunTrueLongitude(sunMeanAnomaly);
        const sunRightAscensionHours = SunTimesCalculator.getSunRightAscensionHours(sunTrueLong);
        const cosLocalHourAngle = SunTimesCalculator.getCosLocalHourAngle(sunTrueLong, latitude, zenith);
        let localHourAngle;
        if (isSunrise) {
            localHourAngle = 360 - SunTimesCalculator.acosDeg(cosLocalHourAngle);
        }
        else { // sunset
            localHourAngle = SunTimesCalculator.acosDeg(cosLocalHourAngle);
        }
        const localHour = localHourAngle / SunTimesCalculator.DEG_PER_HOUR;
        const localMeanTime = SunTimesCalculator.getLocalMeanTime(localHour, sunRightAscensionHours, SunTimesCalculator.getApproxTimeDays(dayOfYear, SunTimesCalculator.getHoursFromMeridian(longitude), isSunrise));
        let processedTime = localMeanTime - SunTimesCalculator.getHoursFromMeridian(longitude);
        while (processedTime < 0) {
            processedTime += 24;
        }
        while (processedTime >= 24) {
            processedTime -= 24;
        }
        return processedTime;
    }
}
/**
 * The number of degrees of longitude that corresponds to one hour time difference.
 */
SunTimesCalculator.DEG_PER_HOUR = 360 / 24;
//# sourceMappingURL=SunTimesCalculator.js.map