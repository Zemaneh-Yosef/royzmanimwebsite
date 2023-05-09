/**
 * A class that contains location information such as latitude and longitude required for astronomical calculations. The
 * elevation field may not be used by some calculation engines and would be ignored if set. Check the documentation for
 * specific implementations of the {@link AstronomicalCalculator} to see if elevation is calculated as part of the
 * algorithm.
 *
 * @author &copy; Eliyahu Hershfeld 2004 - 2016
 * @version 1.1
 */
export declare class GeoLocation {
    /**
     * @see #getLatitude()
     * @see #setLatitude(double)
     * @see #setLatitude(int, int, double, String)
     */
    private latitude;
    /**
     * @see #getLongitude()
     * @see #setLongitude(double)
     * @see #setLongitude(int, int, double, String)
     */
    private longitude;
    /**
     * @see #getLocationName()
     * @see #setLocationName(String)
     */
    private locationName;
    /**
     * @see #getTimeZone()
     * @see #setTimeZone(TimeZone)
     */
    private timeZoneId;
    /**
     * @see #getElevation()
     * @see #setElevation(double)
     */
    private elevation;
    /**
     * Constant for a distance type calculation.
     * @see #getGeodesicDistance(GeoLocation)
     */
    private static readonly DISTANCE;
    /**
     * Constant for a initial bearing type calculation.
     * @see #getGeodesicInitialBearing(GeoLocation)
     */
    private static readonly INITIAL_BEARING;
    /**
     * Constant for a final bearing type calculation.
     * @see #getGeodesicFinalBearing(GeoLocation)
     */
    private static readonly FINAL_BEARING;
    /** constant for milliseconds in a minute (60,000) */
    private static readonly MINUTE_MILLIS;
    /** constant for milliseconds in an hour (3,600,000) */
    private static readonly HOUR_MILLIS;
    /**
     * Method to get the elevation in Meters.
     *
     * @return Returns the elevation in Meters.
     */
    getElevation(): number;
    /**
     * Method to set the elevation in Meters <b>above </b> sea level.
     *
     * @param elevation
     *            The elevation to set in Meters. An IllegalArgumentException will be thrown if the value is a negative.
     */
    setElevation(elevation: number): void;
    /**
     * GeoLocation constructor with parameters for all required fields.
     *
     * @param name
     *            The location name for display use such as &quot;Lakewood, NJ&quot;
     * @param latitude
     *            the latitude in a double format such as 40.095965 for Lakewood, NJ.
     *            <b>Note: </b> For latitudes south of the equator, a negative value should be used.
     * @param longitude
     *            double the longitude in a double format such as -74.222130 for Lakewood, NJ.
     *            <b>Note: </b> For longitudes east of the <a href="http://en.wikipedia.org/wiki/Prime_Meridian">Prime
     *            Meridian </a> (Greenwich), a negative value should be used.
     * @param timeZone
     *            the <code>TimeZone</code> for the location.
     */
    /**
     * GeoLocation constructor with parameters for all required fields.
     *
     * @param name
     *            The location name for display use such as &quot;Lakewood, NJ&quot;
     * @param latitude
     *            the latitude in a double format such as 40.095965 for Lakewood, NJ.
     *            <b>Note: </b> For latitudes south of the equator, a negative value should be used.
     * @param longitude
     *            double the longitude in a double format such as -74.222130 for Lakewood, NJ.
     *            <b>Note: </b> For longitudes east of the <a href="http://en.wikipedia.org/wiki/Prime_Meridian">Prime
     *            Meridian </a> (Greenwich), a negative value should be used.
     * @param elevation
     *            the elevation above sea level in Meters. Elevation is not used in most algorithms used for calculating
     *            sunrise and set.
     * @param timeZoneId
     *            the <code>TimeZone</code> for the location.
     */
    constructor(name: string | null, latitude: number, longitude: number, elevation: number, timeZoneId?: string);
    constructor(name: string | null, latitude: number, longitude: number, timeZoneId: string);
    constructor();
    /**
     * Default GeoLocation constructor will set location to the Prime Meridian at Greenwich, England and a TimeZone of
     * GMT. The longitude will be set to 0 and the latitude will be 51.4772 to match the location of the <a
     * href="http://www.rog.nmm.ac.uk">Royal Observatory, Greenwich </a>. No daylight savings time will be used.
     */
    /**
     * Method to set the latitude.
     *
     * @param latitude
     *            The degrees of latitude to set. The values should be between -90&deg; and 90&deg;. An
     *            IllegalArgumentException will be thrown if the value exceeds the limit. For example 40.095965 would be
     *            used for Lakewood, NJ. <b>Note: </b> For latitudes south of the equator, a negative value should be
     *            used.
     */
    /**
     * Method to set the latitude in degrees, minutes and seconds.
     *
     * @param degrees
     *            The degrees of latitude to set between 0&deg; and 90&deg;. For example 40 would be used for Lakewood, NJ.
     *            An IllegalArgumentException will be thrown if the value exceeds the limit.
     * @param minutes
     *            <a href="http://en.wikipedia.org/wiki/Minute_of_arc#Cartography">minutes of arc</a>
     * @param seconds
     *            <a href="http://en.wikipedia.org/wiki/Minute_of_arc#Cartography">seconds of arc</a>
     * @param direction
     *            N for north and S for south. An IllegalArgumentException will be thrown if the value is not S or N.
     */
    setLatitude(degrees: number, minutes: number, seconds: number, direction: 'N' | 'S'): void;
    setLatitude(latitude: number): void;
    /**
     * @return Returns the latitude.
     */
    getLatitude(): number;
    /**
     * Method to set the longitude in a double format.
     *
     * @param longitude
     *            The degrees of longitude to set in a double format between -180&deg; and 180&deg;. An
     *            IllegalArgumentException will be thrown if the value exceeds the limit. For example -74.2094 would be
     *            used for Lakewood, NJ. Note: for longitudes east of the <a
     *            href="http://en.wikipedia.org/wiki/Prime_Meridian">Prime Meridian</a> (Greenwich) a negative value
     *            should be used.
     */
    /**
     * Method to set the longitude in degrees, minutes and seconds.
     *
     * @param degrees
     *            The degrees of longitude to set between 0&deg; and 180&deg;. As an example 74 would be set for Lakewood, NJ.
     *            An IllegalArgumentException will be thrown if the value exceeds the limits.
     * @param minutes
     *            <a href="http://en.wikipedia.org/wiki/Minute_of_arc#Cartography">minutes of arc</a>
     * @param seconds
     *            <a href="http://en.wikipedia.org/wiki/Minute_of_arc#Cartography">seconds of arc</a>
     * @param direction
     *            E for east of the <a href="http://en.wikipedia.org/wiki/Prime_Meridian">Prime Meridian </a> or W for west of it.
     *            An IllegalArgumentException will be thrown if
     *            the value is not E or W.
     */
    setLongitude(degrees: number, minutes: number, seconds: number, direction: 'E' | 'W'): void;
    setLongitude(longitude: number): void;
    /**
     * @return Returns the longitude.
     */
    getLongitude(): number;
    /**
     * @return Returns the location name.
     */
    getLocationName(): string | null;
    /**
     * @param name
     *            The setter method for the display name.
     */
    setLocationName(name: string | null): void;
    /**
     * @return Returns the timeZone.
     */
    getTimeZone(): string;
    /**
     * Method to set the TimeZone. If this is ever set after the GeoLocation is set in the
     * {@link AstronomicalCalendar}, it is critical that
     * {@link AstronomicalCalendar#getCalendar()}.
     * {@link java.util.Calendar#setTimeZone(TimeZone) setTimeZone(TimeZone)} be called in order for the
     * AstronomicalCalendar to output times in the expected offset. This situation will arise if the
     * AstronomicalCalendar is ever {@link AstronomicalCalendar#clone() cloned}.
     *
     * @param timeZone
     *            The timeZone to set.
     */
    setTimeZone(timeZoneId: string): void;
    /**
     * A method that will return the location's local mean time offset in milliseconds from local <a
     * href="http://en.wikipedia.org/wiki/Standard_time">standard time</a>. The globe is split into 360&deg;, with
     * 15&deg; per hour of the day. For a local that is at a longitude that is evenly divisible by 15 (longitude % 15 ==
     * 0), at solar {@link AstronomicalCalendar#getSunTransit() noon} (with adjustment for the <a
     * href="http://en.wikipedia.org/wiki/Equation_of_time">equation of time</a>) the sun should be directly overhead,
     * so a user who is 1&deg; west of this will have noon at 4 minutes after standard time noon, and conversely, a user
     * who is 1&deg; east of the 15&deg; longitude will have noon at 11:56 AM. Lakewood, N.J., whose longitude is
     * -74.2094, is 0.7906 away from the closest multiple of 15 at -75&deg;. This is multiplied by 4 to yield 3 minutes
     * and 10 seconds earlier than standard time. The offset returned does not account for the <a
     * href="http://en.wikipedia.org/wiki/Daylight_saving_time">Daylight saving time</a> offset since this class is
     * unaware of dates.
     *
     * @return the offset in milliseconds not accounting for Daylight saving time. A positive value will be returned
     *         East of the 15&deg; timezone line, and a negative value West of it.
     * @since 1.1
     */
    getLocalMeanTimeOffset(): number;
    /**
     * Adjust the date for <a href="https://en.wikipedia.org/wiki/180th_meridian">antimeridian</a> crossover. This is
     * needed to deal with edge cases such as Samoa that use a different calendar date than expected based on their
     * geographic location.
     *
     * The actual Time Zone offset may deviate from the expected offset based on the longitude. Since the 'absolute time'
     * calculations are always based on longitudinal offset from UTC for a given date, the date is presumed to only
     * increase East of the Prime Meridian, and to only decrease West of it. For Time Zones that cross the antimeridian,
     * the date will be artificially adjusted before calculation to conform with this presumption.
     *
     * For example, Apia, Samoa with a longitude of -171.75 uses a local offset of +14:00.  When calculating sunrise for
     * 2018-02-03, the calculator should operate using 2018-02-02 since the expected zone is -11.  After determining the
     * UTC time, the local DST offset of <a href="https://en.wikipedia.org/wiki/UTC%2B14:00">UTC+14:00</a> should be applied
     * to bring the date back to 2018-02-03.
     *
     * @return the number of days to adjust the date This will typically be 0 unless the date crosses the antimeridian
     */
    getAntimeridianAdjustment(): -1 | 1 | 0;
    /**
     * Calculate the initial <a href="http://en.wikipedia.org/wiki/Great_circle">geodesic</a> bearing between this
     * Object and a second Object passed to this method using <a
     * href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty, "<a
     * href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the Ellipsoid
     * with application of nested equations</a>", Survey Review, vol XXII no 176, 1975
     *
     * @param location
     *            the destination location
     * @return the initial bearing
     */
    getGeodesicInitialBearing(location: GeoLocation): number;
    /**
     * Calculate the final <a href="http://en.wikipedia.org/wiki/Great_circle">geodesic</a> bearing between this Object
     * and a second Object passed to this method using <a href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus
     * Vincenty's</a> inverse formula See T Vincenty, "<a href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and
     * Inverse Solutions of Geodesics on the Ellipsoid with application of nested equations</a>", Survey Review, vol
     * XXII no 176, 1975
     *
     * @param location
     *            the destination location
     * @return the final bearing
     */
    getGeodesicFinalBearing(location: GeoLocation): number;
    /**
     * Calculate <a href="http://en.wikipedia.org/wiki/Great-circle_distance">geodesic distance</a> in Meters between
     * this Object and a second Object passed to this method using <a
     * href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty, "<a
     * href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the Ellipsoid
     * with application of nested equations</a>", Survey Review, vol XXII no 176, 1975
     *
     * @see #vincentyFormula(GeoLocation, int)
     * @param location
     *            the destination location
     * @return the geodesic distance in Meters
     */
    getGeodesicDistance(location: GeoLocation): number;
    /**
     * Calculate <a href="http://en.wikipedia.org/wiki/Great-circle_distance">geodesic distance</a> in Meters between
     * this Object and a second Object passed to this method using <a
     * href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty, "<a
     * href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the Ellipsoid
     * with application of nested equations</a>", Survey Review, vol XXII no 176, 1975
     *
     * @param location
     *            the destination location
     * @param formula
     *            This formula calculates initial bearing ({@link #INITIAL_BEARING}), final bearing (
     *            {@link #FINAL_BEARING}) and distance ({@link #DISTANCE}).
     * @return geodesic distance in Meters
     */
    private vincentyFormula;
    /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Rhumb_line">rhumb line</a> bearing from the current location to
     * the GeoLocation passed in.
     *
     * @param location
     *            destination location
     * @return the bearing in degrees
     */
    getRhumbLineBearing(location: GeoLocation): number;
    /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Rhumb_line">rhumb line</a> distance from the current location
     * to the GeoLocation passed in.
     *
     * @param location
     *            the destination location
     * @return the distance in Meters
     */
    getRhumbLineDistance(location: GeoLocation): number;
    /**
     * A method that returns an XML formatted <code>String</code> representing the serialized <code>Object</code>. Very
     * similar to the toString method but the return value is in an xml format. The format currently used (subject to
     * change) is:
     *
     * <pre>
     *   &lt;GeoLocation&gt;
     *        &lt;LocationName&gt;Lakewood, NJ&lt;/LocationName&gt;
     *        &lt;Latitude&gt;40.0828&amp;deg&lt;/Latitude&gt;
     *        &lt;Longitude&gt;-74.2094&amp;deg&lt;/Longitude&gt;
     *        &lt;Elevation&gt;0 Meters&lt;/Elevation&gt;
     *        &lt;TimezoneName&gt;America/New_York&lt;/TimezoneName&gt;
     *        &lt;TimeZoneDisplayName&gt;Eastern Standard Time&lt;/TimeZoneDisplayName&gt;
     *        &lt;TimezoneGMTOffset&gt;-5&lt;/TimezoneGMTOffset&gt;
     *        &lt;TimezoneDSTOffset&gt;1&lt;/TimezoneDSTOffset&gt;
     *   &lt;/GeoLocation&gt;
     * </pre>
     *
     * @return The XML formatted <code>String</code>.
     * @deprecated
     */
    toXML(): void;
    /**
     * @see java.lang.Object#equals(Object)
     */
    equals(object: object): boolean;
    /**
     * @see java.lang.Object#toString()
     */
    toString(): string;
    /**
     * An implementation of the {@link java.lang.Object#clone()} method that creates a <a
     * href="http://en.wikipedia.org/wiki/Object_copy#Deep_copy">deep copy</a> of the object.
     * <b>Note:</b> If the {@link java.util.TimeZone} in the clone will be changed from the original, it is critical
     * that {@link AstronomicalCalendar#getCalendar()}.
     * {@link java.util.Calendar#setTimeZone(TimeZone) setTimeZone(TimeZone)} is called after cloning in order for the
     * AstronomicalCalendar to output times in the expected offset.
     *
     * @see java.lang.Object#clone()
     * @since 1.1
     */
    clone(): GeoLocation;
}
