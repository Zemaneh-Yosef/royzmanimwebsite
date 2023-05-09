import { DateTime } from '../../luxon';
import { GeoLocation } from './GeoLocation';
import { AstronomicalCalculator } from './AstronomicalCalculator';
/**
 * Implementation of sunrise and sunset methods to calculate astronomical times based on the <a
 * href="http://noaa.gov">NOAA</a> algorithm. This calculator uses the Java algorithm based on the implementation by <a
 * href="http://noaa.gov">NOAA - National Oceanic and Atmospheric Administration</a>'s <a href =
 * "http://www.srrb.noaa.gov/highlights/sunrise/sunrise.html">Surface Radiation Research Branch</a>. NOAA's <a
 * href="http://www.srrb.noaa.gov/highlights/sunrise/solareqns.PDF">implementation</a> is based on equations from <a
 * href="http://www.willbell.com/math/mc1.htm">Astronomical Algorithms</a> by <a
 * href="http://en.wikipedia.org/wiki/Jean_Meeus">Jean Meeus</a>. Added to the algorithm is an adjustment of the zenith
 * to account for elevation. The algorithm can be found in the <a
 * href="http://en.wikipedia.org/wiki/Sunrise_equation">Wikipedia Sunrise Equation</a> article.
 *
 * @author &copy; Eliyahu Hershfeld 2011 - 2019
 */
export declare class NOAACalculator extends AstronomicalCalculator {
    /**
     * The <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> of January 1, 2000
     */
    private static readonly JULIAN_DAY_JAN_1_2000;
    /**
     * Julian days per century
     */
    private static readonly JULIAN_DAYS_PER_CENTURY;
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
     * Return the <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> from a Java Calendar
     *
     * @param calendar
     *            The Java Calendar
     * @return the Julian day corresponding to the date Note: Number is returned for start of day. Fractional days
     *         should be added later.
     */
    private static getJulianDay;
    /**
     * Convert <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> to centuries since J2000.0.
     *
     * @param julianDay
     *            the Julian Day to convert
     * @return the centuries since 2000 Julian corresponding to the Julian Day
     */
    private static getJulianCenturiesFromJulianDay;
    /**
     * Convert centuries since J2000.0 to <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a>.
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the Julian Day corresponding to the Julian centuries passed in
     */
    private static getJulianDayFromJulianCenturies;
    /**
     * Returns the Geometric <a href="http://en.wikipedia.org/wiki/Mean_longitude">Mean Longitude</a> of the Sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the Geometric Mean Longitude of the Sun in degrees
     */
    private static getSunGeometricMeanLongitude;
    /**
     * Returns the Geometric <a href="http://en.wikipedia.org/wiki/Mean_anomaly">Mean Anomaly</a> of the Sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the Geometric Mean Anomaly of the Sun in degrees
     */
    private static getSunGeometricMeanAnomaly;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Eccentricity_%28orbit%29">eccentricity of earth's orbit</a>.
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the unitless eccentricity
     */
    private static getEarthOrbitEccentricity;
    /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Equation_of_the_center">equation of center</a> for the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the equation of center for the sun in degrees
     */
    private static getSunEquationOfCenter;
    /**
     * Return the true longitude of the sun
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the sun's true longitude in degrees
     */
    private static getSunTrueLongitude;
    /**
     * Return the apparent longitude of the sun
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return sun's apparent longitude in degrees
     */
    private static getSunApparentLongitude;
    /**
     * Returns the mean <a href="http://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial tilt).
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the mean obliquity in degrees
     */
    private static getMeanObliquityOfEcliptic;
    /**
     * Returns the corrected <a href="http://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial
     * tilt).
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return the corrected obliquity in degrees
     */
    private static getObliquityCorrection;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Declination">declination</a> of the sun.
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return
     *            the sun's declination in degrees
     */
    private static getSunDeclination;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Equation_of_time">Equation of Time</a> - the difference between
     * true solar time and mean solar time
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @return equation of time in minutes of time
     */
    private static getEquationOfTime;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Hour_angle">hour angle</a> of the sun at sunrise for the
     * latitude.
     *
     * @param lat
     *            , the latitude of observer in degrees
     * @param solarDec
     *            the declination angle of sun in degrees
     * @param zenith
     *            the zenith
     * @return hour angle of sunrise in radians
     */
    private static getSunHourAngleAtSunrise;
    /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Hour_angle">hour angle</a> of the sun at sunset for the
     * latitude. TODO: use - {@link #getSunHourAngleAtSunrise(double, double, double)} implementation to avoid
     * duplication of code.
     *
     * @param lat
     *            the latitude of observer in degrees
     * @param solarDec
     *            the declination angle of sun in degrees
     * @param zenith
     *            the zenith
     * @return the hour angle of sunset in radians
     */
    private static getSunHourAngleAtSunset;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Elevation</a> for the
     * horizontal coordinate system at the given location at the given time. Can be negative if the sun is below the
     * horizon. Not corrected for altitude.
     *
     * @param cal
     *            time of calculation
     * @param lat
     *            latitude of location for calculation
     * @param lon
     *            longitude of location for calculation
     * @return solar elevation in degrees - horizon is 0 degrees, civil twilight is -6 degrees
     */
    static getSolarElevation(date: DateTime, lat: number, lon: number): number;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Azimuth</a> for the
     * horizontal coordinate system at the given location at the given time. Not corrected for altitude. True south is 0
     * degrees.
     *
     * @param cal
     *            time of calculation
     * @param latitude
     *            latitude of location for calculation
     * @param lon
     *            longitude of location for calculation
     * @return FIXME
     */
    static getSolarAzimuth(date: DateTime, latitude: number, lon: number): number;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of sunrise for the given day at the given location on earth
     *
     * @param julianDay
     *            the Julian day
     * @param latitude
     *            the latitude of observer in degrees
     * @param longitude
     *            the longitude of observer in degrees
     * @param zenith
     *            the zenith
     * @return the time in minutes from zero UTC
     */
    private static getSunriseUTC;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of <a href="http://en.wikipedia.org/wiki/Noon#Solar_noon">solar noon</a> for the given day at the given location
     * on earth.
     *
     * @param julianCenturies
     *            the number of Julian centuries since J2000.0
     * @param longitude
     *            the longitude of observer in degrees
     * @return the time in minutes from zero UTC
     */
    private static getSolarNoonUTC;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
     * of sunset for the given day at the given location on earth
     *
     * @param julianDay
     *            the Julian day
     * @param latitude
     *            the latitude of observer in degrees
     * @param longitude
     *            : longitude of observer in degrees
     * @param zenith
     *            the zenith
     * @return the time in minutes from zero Universal Coordinated Time (UTC)
     */
    private static getSunsetUTC;
}
