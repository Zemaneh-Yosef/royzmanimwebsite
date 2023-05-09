import { MathUtils } from '../polyfills/Utils';
/**
 * A class for various location calculations
 * Most of the code in this class is ported from <a href="http://www.movable-type.co.uk/">Chris Veness'</a>
 * <a href="http://www.fsf.org/licensing/licenses/lgpl.html">LGPL</a> Javascript Implementation
 *
 * @author &copy; Eliyahu Hershfeld 2009 - 2020
 * @deprecated All methods in this class are available in the {@link GeoLocation} class, and this class that duplicates that
 * code will be removed in a future release.
 */
export class GeoLocationUtils {
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
    static getGeodesicInitialBearing(location, destination) {
        return GeoLocationUtils.vincentyFormula(location, destination, GeoLocationUtils.INITIAL_BEARING);
    }
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
    static getGeodesicFinalBearing(location, destination) {
        return GeoLocationUtils.vincentyFormula(location, destination, GeoLocationUtils.FINAL_BEARING);
    }
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
    static getGeodesicDistance(location, destination) {
        return GeoLocationUtils.vincentyFormula(location, destination, GeoLocationUtils.DISTANCE);
    }
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
    static vincentyFormula(location, destination, formula) {
        const a = 6378137; // length of semi-major axis of the ellipsoid (radius at equator) in metres based on WGS-84
        const b = 6356752.3142; // length of semi-minor axis of the ellipsoid (radius at the poles) in meters based on WGS-84
        const f = 1 / 298.257223563; // flattening of the ellipsoid based on WGS-84
        const L = MathUtils.degreesToRadians(destination.getLongitude() - location.getLongitude()); // difference in longitude of two points;
        const U1 = Math.atan((1 - f) * Math.tan(MathUtils.degreesToRadians(location.getLatitude()))); // reduced latitude (latitude on the auxiliary sphere)
        const U2 = Math.atan((1 - f) * Math.tan(MathUtils.degreesToRadians(destination.getLatitude()))); // reduced latitude (latitude on the auxiliary sphere)
        const sinU1 = Math.sin(U1);
        const cosU1 = Math.cos(U1);
        const sinU2 = Math.sin(U2);
        const cosU2 = Math.cos(U2);
        let lambda = L;
        let lambdaP = 2 * Math.PI;
        let iterLimit = 20;
        let sinLambda = 0;
        let cosLambda = 0;
        let sinSigma = 0;
        let cosSigma = 0;
        let sigma = 0;
        let sinAlpha = 0;
        let cosSqAlpha = 0;
        let cos2SigmaM = 0;
        let C;
        while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0) {
            sinLambda = Math.sin(lambda);
            cosLambda = Math.cos(lambda);
            sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda)
                + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
                    * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
            if (sinSigma === 0)
                return 0; // co-incident points
            cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
            sigma = Math.atan2(sinSigma, cosSigma);
            sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
            cosSqAlpha = 1 - sinAlpha * sinAlpha;
            cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
            if (Number.isNaN(cos2SigmaM))
                cos2SigmaM = 0; // equatorial line: cosSqAlpha=0 (§6)
            C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
            lambdaP = lambda;
            lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
        }
        if (iterLimit === 0)
            return Number.NaN; // formula failed to converge
        const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
        const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
        const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
        const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4
            * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM
                * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
        const distance = b * A * (sigma - deltaSigma);
        // initial bearing
        const fwdAz = MathUtils.radiansToDegrees(Math.atan2(cosU2 * sinLambda, cosU1
            * sinU2 - sinU1 * cosU2 * cosLambda));
        // final bearing
        const revAz = MathUtils.radiansToDegrees(Math.atan2(cosU1 * sinLambda, -sinU1
            * cosU2 + cosU1 * sinU2 * cosLambda));
        if (formula === GeoLocationUtils.DISTANCE) {
            return distance;
        }
        else if (formula === GeoLocationUtils.INITIAL_BEARING) {
            return fwdAz;
        }
        else if (formula === GeoLocationUtils.FINAL_BEARING) {
            return revAz;
        }
        // should never happen
        return Number.NaN;
    }
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
    static getRhumbLineBearing(location, destination) {
        let dLon = MathUtils.degreesToRadians(destination.getLongitude() - location.getLongitude());
        const dPhi = Math.log(Math.tan(MathUtils.degreesToRadians(destination.getLatitude())
            / 2 + Math.PI / 4)
            / Math.tan(MathUtils.degreesToRadians(location.getLatitude()) / 2 + Math.PI / 4));
        if (Math.abs(dLon) > Math.PI)
            dLon = dLon > 0 ? -(2 * Math.PI - dLon) : (2 * Math.PI + dLon);
        return MathUtils.radiansToDegrees(Math.atan2(dLon, dPhi));
    }
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
    static getRhumbLineDistance(location, destination) {
        const earthRadius = 6378137; // earth's mean radius in km
        const dLat = MathUtils.degreesToRadians(location.getLatitude())
            - MathUtils.degreesToRadians(destination.getLatitude());
        let dLon = Math.abs(MathUtils.degreesToRadians(location.getLongitude())
            - MathUtils.degreesToRadians(destination.getLongitude()));
        const dPhi = Math.log(Math.tan(MathUtils.degreesToRadians(location.getLatitude()) / 2 + Math.PI / 4)
            / Math.tan(MathUtils.degreesToRadians(destination.getLatitude()) / 2 + Math.PI / 4));
        let q = dLat / dPhi;
        if (!Number.isFinite(q)) {
            q = Math.cos(MathUtils.degreesToRadians(destination.getLatitude()));
        }
        // if dLon over 180° take shorter rhumb across 180° meridian:
        if (dLon > Math.PI) {
            dLon = 2 * Math.PI - dLon;
        }
        const d = Math.sqrt(dLat * dLat + q * q * dLon * dLon);
        return d * earthRadius;
    }
}
/**
 * Constant for a distance type calculation.
 * @see #getGeodesicDistance(GeoLocation, GeoLocation)
 */
GeoLocationUtils.DISTANCE = 0;
/**
 * Constant for a initial bearing type calculation.
 * @see #getGeodesicInitialBearing(GeoLocation, GeoLocation)
 */
GeoLocationUtils.INITIAL_BEARING = 1;
/**
 * Constant for a final bearing type calculation.
 * @see #getGeodesicFinalBearing(GeoLocation, GeoLocation)
 */
GeoLocationUtils.FINAL_BEARING = 2;
//# sourceMappingURL=GeoLocationUtils.js.map