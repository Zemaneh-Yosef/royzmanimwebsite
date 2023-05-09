import { DateTime, Info } from '../../luxon/index';
export var Utils;
(function (Utils) {
    // https://stackoverflow.com/a/40577337/8037425
    function getAllMethodNames(obj, excludeContructors = false) {
        const methods = new Set();
        // eslint-disable-next-line no-cond-assign
        while ((obj = Reflect.getPrototypeOf(obj)) && Reflect.getPrototypeOf(obj)) {
            const keys = Reflect.ownKeys(obj);
            keys.filter((key) => !excludeContructors || key !== 'constructor')
                .forEach((key) => methods.add(key));
        }
        // Convert Symbols to strings, if there are any
        return Array.from(methods, value => value.toString())
            .sort();
    }
    Utils.getAllMethodNames = getAllMethodNames;
})(Utils || (Utils = {}));
export var TimeZone;
(function (TimeZone) {
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
    function getRawOffset(timeZoneId) {
        const janDateTime = DateTime.fromObject({
            month: 1,
            day: 1,
            zone: timeZoneId,
        });
        const julyDateTime = janDateTime.set({ month: 7 });
        let rawOffsetMinutes;
        if (janDateTime.offset === julyDateTime.offset) {
            rawOffsetMinutes = janDateTime.offset;
        }
        else {
            const max = Math.max(janDateTime.offset, julyDateTime.offset);
            rawOffsetMinutes = max < 0
                ? 0 - max
                : 0 - Math.min(janDateTime.offset, julyDateTime.offset);
        }
        return rawOffsetMinutes * 60 * 1000;
    }
    TimeZone.getRawOffset = getRawOffset;
    /**
     * Returns a name in the specified style of this TimeZone suitable for presentation to the user in the default locale.
     * @param {string} timeZoneId
     * @param {DateTime} [date]
     * @param {boolean} [short]
     */
    function getDisplayName(timeZoneId, date = DateTime.local(), short = false) {
        return Info.normalizeZone(timeZoneId).offsetName(date.toMillis(), { format: short ? 'short' : 'long' });
    }
    TimeZone.getDisplayName = getDisplayName;
    /**
     * Returns the amount of time to be added to local standard time to get local wall clock time.
     * The default implementation returns 3600000 milliseconds (i.e., one hour) if a call to useDaylightTime() returns true.
     * Otherwise, 0 (zero) is returned.
     * @param {string} timeZoneId
     * @return {number}
     */
    function getDSTSavings(timeZoneId) {
        return Info.hasDST(timeZoneId) ? 3600000 : 0;
    }
    TimeZone.getDSTSavings = getDSTSavings;
    /**
     * Returns the offset of this time zone from UTC at the specified date. If Daylight Saving Time is in effect at the
     * specified date, the offset value is adjusted with the amount of daylight saving.
     *
     * This method returns a historically correct offset value if an underlying TimeZone implementation subclass
     * supports historical Daylight Saving Time schedule and GMT offset changes.
     * @param {string} timeZoneId
     * @param {number} millisSinceEpoch
     */
    function getOffset(timeZoneId, millisSinceEpoch) {
        return Info.normalizeZone(timeZoneId).offset(millisSinceEpoch) * 60 * 1000;
    }
    TimeZone.getOffset = getOffset;
})(TimeZone || (TimeZone = {}));
/**
 * java.util.Calendar
 */
export var Calendar;
(function (Calendar) {
    Calendar.JANUARY = 0;
    Calendar.FEBRUARY = 1;
    Calendar.MARCH = 2;
    Calendar.APRIL = 3;
    Calendar.MAY = 4;
    Calendar.JUNE = 5;
    Calendar.JULY = 6;
    Calendar.AUGUST = 7;
    Calendar.SEPTEMBER = 8;
    Calendar.OCTOBER = 9;
    Calendar.NOVEMBER = 10;
    Calendar.DECEMBER = 11;
    Calendar.SUNDAY = 1;
    Calendar.MONDAY = 2;
    Calendar.TUESDAY = 3;
    Calendar.WEDNESDAY = 4;
    Calendar.THURSDAY = 5;
    Calendar.FRIDAY = 6;
    Calendar.SATURDAY = 7;
    Calendar.DATE = 5;
    Calendar.MONTH = 2;
    Calendar.YEAR = 1;
})(Calendar || (Calendar = {}));
/**
 * java.lang.Math
 */
export var MathUtils;
(function (MathUtils) {
    /**
     * java.lang.Math.toRadians
     * @param degrees
     */
    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    MathUtils.degreesToRadians = degreesToRadians;
    /**
     * java.lang.Math.toDegrees
     * @param radians
     */
    function radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }
    MathUtils.radiansToDegrees = radiansToDegrees;
})(MathUtils || (MathUtils = {}));
/**
 * java.lang.String
 */
export var StringUtils;
(function (StringUtils) {
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
    function compareTo(string1, string2) {
        let k = 0;
        while (k < Math.min(string1.length, string2.length)) {
            if (string1.substr(k, 1) !== string2.substr(k, 1)) {
                return string1.charCodeAt(k) - string2.charCodeAt(k);
            }
            k++;
        }
        return string1.length - string2.length;
    }
    StringUtils.compareTo = compareTo;
})(StringUtils || (StringUtils = {}));
export var IntegerUtils;
(function (IntegerUtils) {
    /**
     * Compares 2 numbers
     * @param x
     * @param y
     */
    function compare(x, y) {
        if (x === y)
            return 0;
        return x > y ? 1 : -1;
    }
    IntegerUtils.compare = compare;
})(IntegerUtils || (IntegerUtils = {}));
// export const Long_MIN_VALUE = 0;
export const Long_MIN_VALUE = NaN;
/**
 * @param {number} num
 * @param {number} places - The number of places to pad with zeros
 * @returns {string} - The formatted integer
 */
export function padZeros(num, places) {
    const int = Math.trunc(num);
    if (int >= Math.pow(10, places))
        return int.toString();
    return '0'.repeat(places).concat(int.toString()).slice(-places);
}
//# sourceMappingURL=Utils.js.map