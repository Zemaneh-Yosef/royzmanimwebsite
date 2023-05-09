import { DateTime } from '../../luxon';
import { GeoLocation } from './GeoLocation';
import { AstronomicalCalculator } from './AstronomicalCalculator';
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
export declare class SunTimesCalculator extends AstronomicalCalculator {
    /**
     * @see AstronomicalCalculator#getCalculatorName()
     */
    getCalculatorName(): string;
    /**
     * @see AstronomicalCalculator#getUTCSunrise(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunrise(date: DateTime, geoLocation: GeoLocation, zenith: number, adjustForElevation: boolean): number;
    /**
     * @see AstronomicalCalculator#getUTCSunset(Calendar, GeoLocation, double, boolean)
     */
    getUTCSunset(date: DateTime, geoLocation: GeoLocation, zenith: number, adjustForElevation: boolean): number;
    /**
     * The number of degrees of longitude that corresponds to one hour time difference.
     */
    private static readonly DEG_PER_HOUR;
    /**
     * sin of an angle in degrees
     */
    private static sinDeg;
    /**
     * acos of an angle, result in degrees
     */
    private static acosDeg;
    /**
     * asin of an angle, result in degrees
     */
    private static asinDeg;
    /**
     * tan of an angle in degrees
     */
    private static tanDeg;
    /**
     * Calculate cosine of the angle in degrees
     *
     * @param deg degrees
     * @return cosine of the angle in degrees
     */
    private static cosDeg;
    /**
     * Get time difference between location's longitude and the Meridian, in hours. West of Meridian has a negative time
     * difference
     */
    private static getHoursFromMeridian;
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
    private static getApproxTimeDays;
    /**
     * Calculate the Sun's mean anomaly in degrees, at sunrise or sunset, given the longitude in degrees
     *
     * @param dayOfYear the day of the year
     * @param longitude longitude
     * @param isSunrise true for sunrise and false for sunset
     * @return the Sun's mean anomaly in degrees
     */
    private static getMeanAnomaly;
    /**
     * Calculates the Sun's true longitude in degrees. The result is an angle gte 0 and lt 360. Requires the Sun's mean
     * anomaly, also in degrees
     */
    private static getSunTrueLongitude;
    /**
     * Calculates the Sun's right ascension in hours, given the Sun's true longitude in degrees. Input and output are
     * angles gte 0 and lt 360.
     */
    private static getSunRightAscensionHours;
    /**
     * Calculate the cosine of the Sun's local hour angle
     *
     * @param sunTrueLongitude the sun's true longitude
     * @param latitude the latitude
     * @param zenith the zenith
     * @return the cosine of the Sun's local hour angle
     */
    private static getCosLocalHourAngle;
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
    private static getLocalMeanTime;
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
    private static getTimeUTC;
}
