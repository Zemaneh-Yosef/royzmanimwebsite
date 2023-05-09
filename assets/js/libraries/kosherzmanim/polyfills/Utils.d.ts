import { DateTime } from '../../luxon';
export declare namespace Utils {
    function getAllMethodNames(obj: object, excludeContructors?: boolean): Array<string>;
}
export declare namespace TimeZone {
    /**
     * Returns the amount of time in milliseconds to add to UTC to get
     * standard time in this time zone. Because this value is not
     * affected by daylight saving time, it is called <I>raw
     * offset</I>.
     *
     * Since JS doesn't have a native function for this, use the lesser offset of January and July.
     *
     * @return the amount of raw offset time in milliseconds to add to UTC.
     */
    function getRawOffset(timeZoneId: string): number;
    /**
     * Returns a name in the specified style of this TimeZone suitable for presentation to the user in the default locale.
     * @param {string} timeZoneId
     * @param {DateTime} [date]
     * @param {boolean} [short]
     */
    function getDisplayName(timeZoneId: string, date?: DateTime, short?: boolean): string;
    /**
     * Returns the amount of time to be added to local standard time to get local wall clock time.
     * The default implementation returns 3600000 milliseconds (i.e., one hour) if a call to useDaylightTime() returns true.
     * Otherwise, 0 (zero) is returned.
     * @param {string} timeZoneId
     * @return {number}
     */
    function getDSTSavings(timeZoneId: string): number;
    /**
     * Returns the offset of this time zone from UTC at the specified date. If Daylight Saving Time is in effect at the
     * specified date, the offset value is adjusted with the amount of daylight saving.
     *
     * This method returns a historically correct offset value if an underlying TimeZone implementation subclass
     * supports historical Daylight Saving Time schedule and GMT offset changes.
     * @param {string} timeZoneId
     * @param {number} millisSinceEpoch
     */
    function getOffset(timeZoneId: string, millisSinceEpoch: number): number;
}
/**
 * java.util.Calendar
 */
export declare namespace Calendar {
    const JANUARY: number;
    const FEBRUARY: number;
    const MARCH: number;
    const APRIL: number;
    const MAY: number;
    const JUNE: number;
    const JULY: number;
    const AUGUST: number;
    const SEPTEMBER: number;
    const OCTOBER: number;
    const NOVEMBER: number;
    const DECEMBER: number;
    const SUNDAY: number;
    const MONDAY: number;
    const TUESDAY: number;
    const WEDNESDAY: number;
    const THURSDAY: number;
    const FRIDAY: number;
    const SATURDAY: number;
    const DATE = 5;
    const MONTH = 2;
    const YEAR = 1;
}
/**
 * java.lang.Math
 */
export declare namespace MathUtils {
    /**
     * java.lang.Math.toRadians
     * @param degrees
     */
    function degreesToRadians(degrees: number): number;
    /**
     * java.lang.Math.toDegrees
     * @param radians
     */
    function radiansToDegrees(radians: number): number;
}
/**
 * java.lang.String
 */
export declare namespace StringUtils {
    /**
     * Compares two strings lexicographically.
     * The comparison is based on the Unicode value of each character in
     * the strings. The character sequence represented by this
     * {@code String} object is compared lexicographically to the
     * character sequence represented by the argument string. The result is
     * a negative integer if this {@code String} object
     * lexicographically precedes the argument string. The result is a
     * positive integer if this {@code String} object lexicographically
     * follows the argument string. The result is zero if the strings
     * are equal; {@code compareTo} returns {@code 0} exactly when
     * the {@link #equals(Object)} method would return {@code true}.
     * <p>
     * This is the definition of lexicographic ordering. If two strings are
     * different, then either they have different characters at some index
     * that is a valid index for both strings, or their lengths are different,
     * or both. If they have different characters at one or more index
     * positions, let <i>k</i> be the smallest such index; then the string
     * whose character at position <i>k</i> has the smaller value, as
     * determined by using the &lt; operator, lexicographically precedes the
     * other string. In this case, {@code compareTo} returns the
     * difference of the two character values at position {@code k} in
     * the two string -- that is, the value:
     * <blockquote><pre>
     * this.charAt(k)-anotherString.charAt(k)
     * </pre></blockquote>
     * If there is no index position at which they differ, then the shorter
     * string lexicographically precedes the longer string. In this case,
     * {@code compareTo} returns the difference of the lengths of the
     * strings -- that is, the value:
     * <blockquote><pre>
     * this.length()-anotherString.length()
     * </pre></blockquote>
     *
     * @param string1
     * @param   string2   the {@code String} to be compared.
     * @return  the value {@code 0} if the argument string is equal to
     *          this string; a value less than {@code 0} if this string
     *          is lexicographically less than the string argument; and a
     *          value greater than {@code 0} if this string is
     *          lexicographically greater than the string argument.
     */
    function compareTo(string1: string, string2: string): number;
}
export declare namespace IntegerUtils {
    /**
     * Compares 2 numbers
     * @param x
     * @param y
     */
    function compare(x: number, y: number): number;
}
export declare const Long_MIN_VALUE: number;
/**
 * @param {number} num
 * @param {number} places - The number of places to pad with zeros
 * @returns {string} - The formatted integer
 */
export declare function padZeros(num: number, places: number): string;
