import { GeoLocation } from './GeoLocation';
/**
 * A class for various location calculations
 * Most of the code in this class is ported from <a href="http://www.movable-type.co.uk/">Chris Veness'</a>
 * <a href="http://www.fsf.org/licensing/licenses/lgpl.html">LGPL</a> Javascript Implementation
 *
 * @author &copy; Eliyahu Hershfeld 2009 - 2020
 * @deprecated All methods in this class are available in the {@link GeoLocation} class, and this class that duplicates that
 * code will be removed in a future release.
 */
export declare class GeoLocationUtils {
    /**
     * Constant for a distance type calculation.
     * @see #getGeodesicDistance(GeoLocation, GeoLocation)
     */
    private static readonly DISTANCE;
    /**
     * Constant for a initial bearing type calculation.
     * @see #getGeodesicInitialBearing(GeoLocation, GeoLocation)
     */
    private static readonly INITIAL_BEARING;
    /**
     * Constant for a final bearing type calculation.
     * @see #getGeodesicFinalBearing(GeoLocation, GeoLocation)
     */
    private static readonly FINAL_BEARING;
    /**
     * Calculate the <a href="http://en.wikipedia.org/wiki/Great_circle">geodesic</a> initial bearing between this Object and
     * a second Object passed to this method using <a href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus
     * Vincenty's</a> inverse formula See T Vincenty, "<a href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and
     * Inverse Solutions of Geodesics on the Ellipsoid with application of nested equations</a>", Survey Review, vol XXII
     * no 176, 1975.
     *
     * @param location
     *            the initial location
     * @param destination
     *            the destination location
     * @return the geodesic bearing
     */
    static getGeodesicInitialBearing(location: GeoLocation, destination: GeoLocation): number;
    /**
     * Calculate the <a href="http://en.wikipedia.org/wiki/Great_circle">geodesic</a> final bearing between this Object
     * and a second Object passed to this method using <a href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a>
     * inverse formula See T Vincenty, "<a href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics
     * on the Ellipsoid with application of nested equations</a>", Survey Review, vol XXII no 176, 1975.
     *
     * @param location
     *            the initial location
     * @param destination
     *            the destination location
     * @return the geodesic bearing
     */
    static getGeodesicFinalBearing(location: GeoLocation, destination: GeoLocation): number;
    /**
     * Calculate <a href="http://en.wikipedia.org/wiki/Great-circle_distance">geodesic distance</a> in Meters
     * between this Object and a second Object passed to this method using <a
     * href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty,
     * "<a href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the
     * Ellipsoid with application of nested equations</a>", Survey Review, vol XXII no 176, 1975. This uses the
     * WGS-84 geodetic model.
     * @param location
     *            the initial location
     * @param destination
     *            the destination location
     * @return the geodesic distance in Meters
     */
    static getGeodesicDistance(location: GeoLocation, destination: GeoLocation): number;
    /**
     * Calculates the initial <a href="http://en.wikipedia.org/wiki/Great_circle">geodesic</a> bearing, final bearing or
     * <a href="http://en.wikipedia.org/wiki/Great-circle_distance">geodesic distance</a> using <a href=
     * "http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty, "<a
     * href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the Ellipsoid
     * with application of nested equations</a>", Survey Review, vol XXII no 176, 1975.
     *
     * @param location
     *            the initial location
     * @param destination
     *            the destination location
     * @param formula
     *            This formula calculates initial bearing ({@link #INITIAL_BEARING}),
     *            final bearing ({@link #FINAL_BEARING}) and distance ({@link #DISTANCE}).
     * @return
     *            the geodesic distance, initial or final bearing (based on the formula passed in) between the location
     *            and destination in Meters
     * @see #getGeodesicDistance(GeoLocation, GeoLocation)
     * @see #getGeodesicInitialBearing(GeoLocation, GeoLocation)
     * @see #getGeodesicFinalBearing(GeoLocation, GeoLocation)
     */
    private static vincentyFormula;
    /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Rhumb_line">rhumb line</a>
     * bearing from the current location to the GeoLocation passed in.
     *
     * @param location
     *            the initial location
     * @param destination
     *            the destination location
     * @return the bearing in degrees
     */
    static getRhumbLineBearing(location: GeoLocation, destination: GeoLocation): number;
    /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Rhumb_line">rhumb line</a> distance from the current
     * location to the GeoLocation passed in. Ported from <a href="http://www.movable-type.co.uk/">Chris Veness'</a>
     * Javascript Implementation.
     *
     * @param location
     *            the initial location
     * @param destination
     *            the destination location
     * @return the distance in Meters
     */
    static getRhumbLineDistance(location: GeoLocation, destination: GeoLocation): number;
}
