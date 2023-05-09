import { Daf } from './Daf';
import { JewishCalendar } from './JewishCalendar';
/**
 * This class calculates the Daf Yomi Bavli page (daf) for a given date. To calculate Daf Yomi Yerushalmi
 * use the {@link YerushalmiYomiCalculator}. The library may cover Mishna Yomi etc. at some point in the future.
 *
 * @author &copy; Bob Newell (original C code)
 * @author &copy; Eliyahu Hershfeld 2011 - 2019
 * @version 0.0.1
 */
export declare class YomiCalculator {
    /**
     * The start date of the first Daf Yomi Bavli cycle of September 11, 1923 / Rosh Hashana 5684.
     */
    private static readonly dafYomiStartDate;
    /** The start date of the first Daf Yomi Bavli cycle in the Julian calendar. Used internally for claculations. */
    private static readonly dafYomiJulianStartDay;
    /**
     * The date that the pagination for the Daf Yomi <em>Maseches Shekalim</em> changed to use the commonly used Vilna
     * Shas pagination from the no longer commonly available Zhitomir / Slavuta Shas used by Rabbi Meir Shapiro.
     */
    private static readonly shekalimChangeDate;
    /** The Julian date that the cycle for Shekalim changed.
     * @see #getDafYomiBavli(JewishCalendar) for details.
     */
    private static readonly shekalimJulianChangeDay;
    /**
     * Returns the <a href="http://en.wikipedia.org/wiki/Daf_yomi">Daf Yomi</a> <a
     * href="http://en.wikipedia.org/wiki/Talmud">Bavli</a> {@link Daf} for a given date. The first Daf Yomi cycle
     * started on Rosh Hashana 5684 (September 11, 1923) and calculations prior to this date will result in an
     * IllegalArgumentException thrown. For historical calculations (supported by this method), it is important to note
     * that a change in length of the cycle was instituted starting in the eighth Daf Yomi cycle beginning on June 24,
     * 1975. The Daf Yomi Bavli cycle has a single masechta of the Talmud Yerushalmi - Shekalim as part of the cycle.
     * Unlike the Bavli where the number of daf per masechta was standardized since the original <a
     * href="http://en.wikipedia.org/wiki/Daniel_Bomberg">Bomberg Edition</a> published from 1520 - 1523, there is no
     * uniform page length in the Yerushalmi. The early cycles had the Yerushalmi Shekalim length of 13 days following the
     * <a href=
     * "https://he.wikipedia.org/wiki/%D7%93%D7%A4%D7%95%D7%A1_%D7%A1%D7%9C%D7%90%D7%95%D7%95%D7%99%D7%98%D7%90">Slavuta/Zhytomyr</a>
     * Shas used by <a href="http://en.wikipedia.org/wiki/Meir_Shapiro">Rabbi Meir Shapiro</a>. With the start of the eighth Daf Yomi
     * cycle beginning on June 24, 1975 the length of the Yerushalmi Shekalim was changed from 13 to 22 daf to follow
     * the <a href="https://en.wikipedia.org/wiki/Vilna_Edition_Shas">Vilna Shas</a> that is in common use today.
     *
     * @param calendar
     *            the calendar date for calculation
     * @return the {@link Daf}.
     *
     * @throws IllegalArgumentException
     *             if the date is prior to the September 11, 1923 start date of the first Daf Yomi cycle
     */
    static getDafYomiBavli(calendar: JewishCalendar): Daf;
    /**
     * Return the <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> from a Java Date.
     *
     * @param date
     *            The Java Date
     * @return the Julian day number corresponding to the date
     */
    private static getJulianDay;
}
