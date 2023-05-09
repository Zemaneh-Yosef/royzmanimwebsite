import { Daf } from './Daf';
import { JewishCalendar } from './JewishCalendar';
/**
 * This class calculates the <a href="https://en.wikipedia.org/wiki/Jerusalem_Talmud">Talmud Yerusalmi</a> <a href=
 * "https://en.wikipedia.org/wiki/Daf_Yomi">Daf Yomi</a> page ({@link Daf}) for the a given date.
 *
 * @author &copy; elihaidv
 * @author &copy; Eliyahu Hershfeld 2017 - 2019
 */
export declare class YerushalmiYomiCalculator {
    /**
     * The start date of the first Daf Yomi Yerushalmi cycle of February 2, 1980 / 15 Shevat, 5740.
     */
    private static readonly DAF_YOMI_START_DAY;
    /** The number of pages in the Talmud Yerushalmi. */
    private static readonly WHOLE_SHAS_DAFS;
    /** The number of pages per <em>masechta</em> (tractate). */
    private static readonly BLATT_PER_MASECHTA;
    /**
     * Returns the <a href="https://en.wikipedia.org/wiki/Daf_Yomi">Daf Yomi</a>
     * <a href="https://en.wikipedia.org/wiki/Jerusalem_Talmud">Yerusalmi</a> page ({@link Daf}) for a given date.
     * The first Daf Yomi cycle started on 15 Shevat (Tu Bishvat) 5740 (February, 2, 1980) and calculations
     * prior to this date will result in an IllegalArgumentException thrown.
     *
     * @param jewishCalendar
     *            the calendar date for calculation
     * @return the {@link Daf}.
     *
     * @throws IllegalArgumentException
     *             if the date is prior to the September 11, 1923 start date of the first Daf Yomi cycle
     */
    static getDafYomiYerushalmi(jewishCalendar: JewishCalendar): Daf;
    /**
     * Return the number of special days (Yom Kippur and Tisha B'Av) on which there is no daf, between the two given dates
     *
     * @param start - start date to calculate
     * @param end - end date to calculate
     * @return the number of special days
     */
    private static getNumOfSpecialDays;
}
