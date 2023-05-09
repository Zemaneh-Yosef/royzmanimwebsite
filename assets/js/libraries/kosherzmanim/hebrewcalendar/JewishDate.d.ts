import { DateTime } from '../../luxon/index';

/**
 * The JewishDate is the base calendar class, that supports maintenance of a {@link java.util.GregorianCalendar}
 * instance along with the corresponding Jewish date. This class can use the standard Java Date and Calendar
 * classes for setting and maintaining the dates, but it does not subclass these classes or use them internally
 * in any calculations. This class also does not have a concept of a time (which the Date class does). Please
 * note that the calendar does not currently support dates prior to 1/1/1 Gregorian. Also keep in mind that the
 * Gregorian calendar started on October 15, 1582, so any calculations prior to that are suspect (at least from
 * a Gregorian perspective). While 1/1/1 Gregorian and forward are technically supported, any calculations prior to <a
 * href="http://en.wikipedia.org/wiki/Hillel_II">Hillel II's (Hakatan's</a>) calendar (4119 in the Jewish Calendar / 359
 * CE Julian as recorded by <a href="http://en.wikipedia.org/wiki/Hai_Gaon">Rav Hai Gaon</a>) would be just an
 * approximation.
 *
 * This open source Java code was written by <a href="http://www.facebook.com/avromf">Avrom Finkelstien</a> from his C++
 * code. It was refactored to fit the KosherJava Zmanim API with simplification of the code, enhancements and some bug
 * fixing.
 *
 * Some of Avrom's original C++ code was translated from <a href="https://web.archive.org/web/20120124134148/http://emr.cs.uiuc.edu/~reingold/calendar.C">C/C++
 * code</a> in <a href="http://www.calendarists.com">Calendrical Calculations</a> by Nachum Dershowitz and Edward M.
 * Reingold, Software-- Practice &amp; Experience, vol. 20, no. 9 (September, 1990), pp. 899- 928. Any method with the mark
 * "ND+ER" indicates that the method was taken from this source with minor modifications.
 *
 * If you are looking for a class that implements a Jewish calendar version of the Calendar class, one is available from
 * the <a href="http://site.icu-project.org/" >ICU (International Components for Unicode)</a> project, formerly part of
 * IBM's DeveloperWorks.
 *
 * @see JewishCalendar
 * @see HebrewDateFormatter
 * @see java.util.Date
 * @see java.util.Calendar
 * @author &copy; Avrom Finkelstien 2002
 * @author &copy; Eliyahu Hershfeld 2011 - 2015
 */
export declare class JewishDate {
    /**
     * Value of the month field indicating Nissan, the first numeric month of the year in the Jewish calendar. With the
     * year starting at {@link #TISHREI}, it would actually be the 7th (or 8th in a {@link #isJewishLeapYear() leap
       * year}) month of the year.
     */
    static readonly NISSAN: number;
    /**
     * Value of the month field indicating Iyar, the second numeric month of the year in the Jewish calendar. With the
     * year starting at {@link #TISHREI}, it would actually be the 8th (or 9th in a {@link #isJewishLeapYear() leap
       * year}) month of the year.
     */
    static readonly IYAR: number;
    /**
     * Value of the month field indicating Sivan, the third numeric month of the year in the Jewish calendar. With the
     * year starting at {@link #TISHREI}, it would actually be the 9th (or 10th in a {@link #isJewishLeapYear() leap
       * year}) month of the year.
     */
    static readonly SIVAN: number;
    /**
     * Value of the month field indicating Tammuz, the fourth numeric month of the year in the Jewish calendar. With the
     * year starting at {@link #TISHREI}, it would actually be the 10th (or 11th in a {@link #isJewishLeapYear() leap
       * year}) month of the year.
     */
    static readonly TAMMUZ: number;
    /**
     * Value of the month field indicating Av, the fifth numeric month of the year in the Jewish calendar. With the year
     * starting at {@link #TISHREI}, it would actually be the 11th (or 12th in a {@link #isJewishLeapYear() leap year})
     * month of the year.
     */
    static readonly AV: number;
    /**
     * Value of the month field indicating Elul, the sixth numeric month of the year in the Jewish calendar. With the
     * year starting at {@link #TISHREI}, it would actually be the 12th (or 13th in a {@link #isJewishLeapYear() leap
       * year}) month of the year.
     */
    static readonly ELUL: number;
    /**
     * Value of the month field indicating Tishrei, the seventh numeric month of the year in the Jewish calendar. With
     * the year starting at this month, it would actually be the 1st month of the year.
     */
    static readonly TISHREI: number;
    /**
     * Value of the month field indicating Cheshvan/marcheshvan, the eighth numeric month of the year in the Jewish
     * calendar. With the year starting at {@link #TISHREI}, it would actually be the 2nd month of the year.
     */
    static readonly CHESHVAN: number;
    /**
     * Value of the month field indicating Kislev, the ninth numeric month of the year in the Jewish calendar. With the
     * year starting at {@link #TISHREI}, it would actually be the 3rd month of the year.
     */
    static readonly KISLEV: number;
    /**
     * Value of the month field indicating Teves, the tenth numeric month of the year in the Jewish calendar. With the
     * year starting at {@link #TISHREI}, it would actually be the 4th month of the year.
     */
    static readonly TEVES: number;
    /**
     * Value of the month field indicating Shevat, the eleventh numeric month of the year in the Jewish calendar. With
     * the year starting at {@link #TISHREI}, it would actually be the 5th month of the year.
     */
    static readonly SHEVAT: number;
    /**
     * Value of the month field indicating Adar (or Adar I in a {@link #isJewishLeapYear() leap year}), the twelfth
     * numeric month of the year in the Jewish calendar. With the year starting at {@link #TISHREI}, it would actually
     * be the 6th month of the year.
     */
    static readonly ADAR: number;
    /**
     * Value of the month field indicating Adar II, the leap (intercalary or embolismic) thirteenth (Undecimber) numeric
     * month of the year added in Jewish {@link #isJewishLeapYear() leap year}). The leap years are years 3, 6, 8, 11,
     * 14, 17 and 19 of a 19 year cycle. With the year starting at {@link #TISHREI}, it would actually be the 7th month
     * of the year.
     */
    static readonly ADAR_II: number;
    /**
     * the Jewish epoch using the RD (Rata Die/Fixed Date or Reingold Dershowitz) day used in Calendrical Calculations.
     * Day 1 is January 1, 0001 Gregorian
     */
    private static readonly JEWISH_EPOCH;
    /** The number  of <em>chalakim</em> (18) in a minute. */
    private static readonly CHALAKIM_PER_MINUTE;
    /** The number  of <em>chalakim</em> (1080) in an hour. */
    private static readonly CHALAKIM_PER_HOUR;
    /** The number of <em>chalakim</em> (25,920) in a 24 hour day. */
    private static readonly CHALAKIM_PER_DAY;
    /** The number  of <em>chalakim</em> in an average Jewish month. A month has 29 days, 12 hours and 793
     * <em>chalakim</em> (44 minutes and 3.3 seconds) for a total of 765,433 <em>chalakim</em> */
    private static readonly CHALAKIM_PER_MONTH;
    /**
     * Days from the beginning of Sunday till molad BaHaRaD. Calculated as 1 day, 5 hours and 204 chalakim = (24 + 5) *
     * 1080 + 204 = 31524
     */
    private static readonly CHALAKIM_MOLAD_TOHU;
    /**
     * A short year where both {@link #CHESHVAN} and {@link #KISLEV} are 29 days.
     *
     * @see #getCheshvanKislevKviah()
     * @see HebrewDateFormatter#getFormattedKviah(int)
     */
    static readonly CHASERIM: number;
    /**
     * An ordered year where {@link #CHESHVAN} is 29 days and {@link #KISLEV} is 30 days.
     *
     * @see #getCheshvanKislevKviah()
     * @see HebrewDateFormatter#getFormattedKviah(int)
     */
    static readonly KESIDRAN: number;
    /**
     * A long year where both {@link #CHESHVAN} and {@link #KISLEV} are 30 days.
     *
     * @see #getCheshvanKislevKviah()
     * @see HebrewDateFormatter#getFormattedKviah(int)
     */
    static readonly SHELAIMIM: number;
    /** the internal Jewish month. */
    private jewishMonth;
    /** the internal Jewish day. */
    private jewishDay;
    /** the internal Jewish year. */
    private jewishYear;
    /** the internal count of <em>molad</em> hours. */
    private moladHours;
    /** the internal count of <em>molad</em> minutes. */
    private moladMinutes;
    /** the internal count of <em>molad</em> <em>chalakim</em>. */
    private moladChalakim;
    /**
     * Returns the molad hours. Only a JewishDate object populated with {@link #getMolad()},
     * {@link #setJewishDate(int, int, int, int, int, int)} or {@link #setMoladHours(int)} will have this field
     * populated. A regular JewishDate object will have this field set to 0.
     *
     * @return the molad hours
     * @see #setMoladHours(int)
     * @see #getMolad()
     * @see #setJewishDate(int, int, int, int, int, int)
     */
    getMoladHours(): number;
    /**
     * Sets the molad hours.
     *
     * @param moladHours
     *            the molad hours to set
     * @see #getMoladHours()
     * @see #getMolad()
     * @see #setJewishDate(int, int, int, int, int, int)
     *
     */
    setMoladHours(moladHours: number): void;
    /**
     * Returns the molad minutes. Only an object populated with {@link #getMolad()},
     * {@link #setJewishDate(int, int, int, int, int, int)} or or {@link #setMoladMinutes(int)} will have these fields
     * populated. A regular JewishDate object will have this field set to 0.
     *
     * @return the molad minutes
     * @see #setMoladMinutes(int)
     * @see #getMolad()
     * @see #setJewishDate(int, int, int, int, int, int)
     */
    getMoladMinutes(): number;
    /**
     * Sets the molad minutes. The expectation is that the traditional minute-less chalakim will be broken out to
     * minutes and {@link #setMoladChalakim(int) chalakim/parts} , so 793 (TaShTZaG) parts would have the minutes set to
     * 44 and chalakim to 1.
     *
     * @param moladMinutes
     *            the molad minutes to set
     * @see #getMoladMinutes()
     * @see #setMoladChalakim(int)
     * @see #getMolad()
     * @see #setJewishDate(int, int, int, int, int, int)
     *
     */
    setMoladMinutes(moladMinutes: number): void;
    /**
     * Sets the molad chalakim/parts. The expectation is that the traditional minute-less chalakim will be broken out to
     * {@link #setMoladMinutes(int) minutes} and chalakim, so 793 (TaShTZaG) parts would have the minutes set to 44 and
     * chalakim to 1.
     *
     * @param moladChalakim
     *            the molad chalakim/parts to set
     * @see #getMoladChalakim()
     * @see #setMoladMinutes(int)
     * @see #getMolad()
     * @see #setJewishDate(int, int, int, int, int, int)
     *
     */
    setMoladChalakim(moladChalakim: number): void;
    /**
     * Returns the molad chalakim/parts. Only an object populated with {@link #getMolad()},
     * {@link #setJewishDate(int, int, int, int, int, int)} or or {@link #setMoladChalakim(int)} will have these fields
     * populated. A regular JewishDate object will have this field set to 0.
     *
     * @return the molad chalakim/parts
     * @see #setMoladChalakim(int)
     * @see #getMolad()
     * @see #setJewishDate(int, int, int, int, int, int)
     */
    getMoladChalakim(): number;
    /**
     * Returns the last day in a gregorian month
     *
     * @param month
     *            the Gregorian month
     * @return the last day of the Gregorian month
     */
    getLastDayOfGregorianMonth(month: number): number;
    /**
     * The month, where 1 == January, 2 == February, etc... Note that this is different than the Java's Calendar class
     * where January ==0
     */
    private gregorianMonth;
    /** The day of the Gregorian month */
    private gregorianDayOfMonth;
    /** The Gregorian year */
    private gregorianYear;
    /** 1 == Sunday, 2 == Monday, etc... */
    private dayOfWeek;
    /** Returns the absolute date (days since January 1, 0001 on the Gregorian calendar).
     * @see #getAbsDate()
     * @see #absDateToJewishDate()
     */
    private gregorianAbsDate;
    /**
     * Returns the number of days in a given month in a given month and year.
     *
     * @param month
     *            the month. As with other cases in this class, this is 1-based, not zero-based.
     * @param year
     *            the year (only impacts February)
     * @return the number of days in the month in the given year
     */
    private static getLastDayOfGregorianMonth;
    /**
     * Computes the Gregorian date from the absolute date. ND+ER
     * @param absDate - the absolute date
     */
    private absDateToDate;
    /**
     * Returns the absolute date (days since January 1, 0001 on the Gregorian calendar).
     *
     * @return the number of days since January 1, 1
     */
    getAbsDate(): number;
    /**
     * Computes the absolute date from a Gregorian date. ND+ER
     *
     * @param year
     *            the Gregorian year
     * @param month
     *            the Gregorian month. Unlike the Java Calendar where January has the value of 0,This expects a 1 for
     *            January
     * @param dayOfMonth
     *            the day of the month (1st, 2nd, etc...)
     * @return the absolute Gregorian day
     */
    private static gregorianDateToAbsDate;
    /**
     * Returns if the year is a Jewish leap year. Years 3, 6, 8, 11, 14, 17 and 19 in the 19 year cycle are leap years.
     *
     * @param year
     *            the Jewish year.
     * @return true if it is a leap year
     * @see #isJewishLeapYear()
     */
    private static isJewishLeapYear;
    /**
     * Returns if the year the calendar is set to is a Jewish leap year. Years 3, 6, 8, 11, 14, 17 and 19 in the 19 year
     * cycle are leap years.
     *
     * @return true if it is a leap year
     * @see #isJewishLeapYear(int)
     */
    isJewishLeapYear(): boolean;
    /**
     * Returns the last month of a given Jewish year. This will be 12 on a non {@link #isJewishLeapYear(int) leap year}
     * or 13 on a leap year.
     *
     * @param year
     *            the Jewish year.
     * @return 12 on a non leap year or 13 on a leap year
     * @see #isJewishLeapYear(int)
     */
    private static getLastMonthOfJewishYear;
    /**
     * Returns the number of days elapsed from the Sunday prior to the start of the Jewish calendar to the mean
     * conjunction of Tishri of the Jewish year.
     *
     * @param year
     *            the Jewish year
     * @return the number of days elapsed from prior to the molad Tohu BaHaRaD (Be = Monday, Ha= 5 hours and Rad =204
     *         chalakim/parts) prior to the start of the Jewish calendar, to the mean conjunction of Tishri of the
     *         Jewish year. BeHaRaD is 23:11:20 on Sunday night(5 hours 204/1080 chalakim after sunset on Sunday
     *         evening).
     */
    static getJewishCalendarElapsedDays(year: number): number;
    /**
     * Adds the 4 dechiyos for molad Tishrei. These are:
     * <ol>
     * <li>Lo ADU Rosh - Rosh Hashana can't fall on a Sunday, Wednesday or Friday. If the molad fell on one of these
     * days, Rosh Hashana is delayed to the following day.</li>
     * <li>Molad Zaken - If the molad of Tishrei falls after 12 noon, Rosh Hashana is delayed to the following day. If
     * the following day is ADU, it will be delayed an additional day.</li>
     * <li>GaTRaD - If on a non leap year the molad of Tishrei falls on a Tuesday (Ga) on or after 9 hours (T) and 204
     * chalakim (TRaD) it is delayed till Thursday (one day delay, plus one day for Lo ADU Rosh)</li>
     * <li>BeTuTaKFoT - if the year following a leap year falls on a Monday (Be) on or after 15 hours (Tu) and 589
     * chalakim (TaKFoT) it is delayed till Tuesday</li>
     * </ol>
     *
     * @param year - the year
     * @param moladDay - the molad day
     * @param moladParts - the molad parts
     * @return the number of elapsed days in the JewishCalendar adjusted for the 4 dechiyos.
     */
    private static addDechiyos;
    /**
     * Returns the number of chalakim (parts - 1080 to the hour) from the original hypothetical Molad Tohu to the year
     * and month passed in.
     *
     * @param year
     *            the Jewish year
     * @param month
     *            the Jewish month the Jewish month, with the month numbers starting from Nisan. Use the JewishDate
     *            constants such as {@link JewishDate#TISHREI}.
     * @return the number of chalakim (parts - 1080 to the hour) from the original hypothetical Molad Tohu
     */
    private static getChalakimSinceMoladTohu;
    /**
     * Returns the number of chalakim (parts - 1080 to the hour) from the original hypothetical Molad Tohu to the Jewish
     * year and month that this Object is set to.
     *
     * @return the number of chalakim (parts - 1080 to the hour) from the original hypothetical Molad Tohu
     */
    getChalakimSinceMoladTohu(): number;
    /**
     * Converts the {@link JewishDate#NISSAN} based constants used by this class to numeric month starting from
     * {@link JewishDate#TISHREI}. This is required for Molad claculations.
     *
     * @param year
     *            The Jewish year
     * @param month
     *            The Jewish Month
     * @return the Jewish month of the year starting with Tishrei
     */
    private static getJewishMonthOfYear;
    /**
     * Validates the components of a Jewish date for validity. It will throw an {@link IllegalArgumentException} if the
     * Jewish date is earlier than 18 Teves, 3761 (1/1/1 Gregorian), a month < 1 or > 12 (or 13 on a
     * {@link #isJewishLeapYear(int) leap year}), the day of month is < 1 or > 30, an hour < 0 or > 23, a minute < 0 >
     * 59 or chalakim < 0 > 17. For larger a larger number of chalakim such as 793 (TaShTzaG) break the chalakim into
     * minutes (18 chalakim per minutes, so it would be 44 minutes and 1 chelek in the case of 793/TaShTzaG).
     *
     * @param year
     *            the Jewish year to validate. It will reject any year <= 3761 (lower than the year 1 Gregorian).
     * @param month
     *            the Jewish month to validate. It will reject a month < 1 or > 12 (or 13 on a leap year) .
     * @param dayOfMonth
     *            the day of the Jewish month to validate. It will reject any value < 1 or > 30 TODO: check calling
     *            methods to see if there is any reason that the class can validate that 30 is invalid for some months.
     * @param hours
     *            the hours (for molad calculations). It will reject an hour < 0 or > 23
     * @param minutes
     *            the minutes (for molad calculations). It will reject a minute < 0 or > 59
     * @param chalakim
     *            the chalakim/parts (for molad calculations). It will reject a chalakim < 0 or > 17. For larger numbers
     *            such as 793 (TaShTzaG) break the chalakim into minutes (18 chalakim per minutes, so it would be 44
     *            minutes and 1 chelek in the case of 793/TaShTzaG)
     *
     * @throws IllegalArgumentException
     *             if a A Jewish date earlier than 18 Teves, 3761 (1/1/1 Gregorian), a month < 1 or > 12 (or 13 on a
     *             leap year), the day of month is < 1 or > 30, an hour < 0 or > 23, a minute < 0 > 59 or chalakim < 0 >
     *             17. For larger a larger number of chalakim such as 793 (TaShTzaG) break the chalakim into minutes (18
     *             chalakim per minutes, so it would be 44 minutes and 1 chelek in the case of 793 (TaShTzaG).
     */
    private static validateJewishDate;
    /**
     * Validates the components of a Gregorian date for validity. It will throw an {@link IllegalArgumentException} if a
     * year of < 1, a month < 0 or > 11 or a day of month < 1 is passed in.
     *
     * @param year
     *            the Gregorian year to validate. It will reject any year < 1.
     * @param month
     *            the Gregorian month number to validate. It will enforce that the month is between 0 - 11 like a
     *            {@link GregorianCalendar}, where {@link Calendar#JANUARY} has a value of 0.
     * @param dayOfMonth
     *            the day of the Gregorian month to validate. It will reject any value < 1, but will allow values > 31
     *            since calling methods will simply set it to the maximum for that month. TODO: check calling methods to
     *            see if there is any reason that the class needs days > the maximum.
     * @throws IllegalArgumentException
     *             if a year of < 1, a month < 0 or > 11 or a day of month < 1 is passed in
     * @see #validateGregorianYear(int)
     * @see #validateGregorianMonth(int)
     * @see #validateGregorianDayOfMonth(int)
     */
    private static validateGregorianDate;
    /**
     * Validates a Gregorian month for validity.
     *
     * @param month
     *            the Gregorian month number to validate. It will enforce that the month is between 0 - 11 like a
     *            {@link GregorianCalendar}, where {@link Calendar#JANUARY} has a value of 0.
     */
    private static validateGregorianMonth;
    /**
     * Validates a Gregorian day of month for validity.
     *
     * @param dayOfMonth
     *            the day of the Gregorian month to validate. It will reject any value < 1, but will allow values > 31
     *            since calling methods will simply set it to the maximum for that month. TODO: check calling methods to
     *            see if there is any reason that the class needs days > the maximum.
     */
    private static validateGregorianDayOfMonth;
    /**
     * Validates a Gregorian year for validity.
     *
     * @param year
     *            the Gregorian year to validate. It will reject any year < 1.
     */
    private static validateGregorianYear;
    /**
     * Returns the number of days for a given Jewish year. ND+ER
     *
     * @param year
     *            the Jewish year
     * @return the number of days for a given Jewish year.
     * @see #isCheshvanLong()
     * @see #isKislevShort()
     */
    static getDaysInJewishYear(year: number): number;
    /**
     * Returns the number of days for the current year that the calendar is set to.
     *
     * @return the number of days for the Object's current Jewish year.
     * @see #isCheshvanLong()
     * @see #isKislevShort()
     * @see #isJewishLeapYear()
     */
    getDaysInJewishYear(): number;
    /**
     * Returns if Cheshvan is long in a given Jewish year. The method name isLong is done since in a Kesidran (ordered)
     * year Cheshvan is short. ND+ER
     *
     * @param year
     *            the year
     * @return true if Cheshvan is long in Jewish year.
     * @see #isCheshvanLong()
     * @see #getCheshvanKislevKviah()
     */
    private static isCheshvanLong;
    /**
     * Returns if Cheshvan is long (30 days VS 29 days) for the current year that the calendar is set to. The method
     * name isLong is done since in a Kesidran (ordered) year Cheshvan is short.
     *
     * @return true if Cheshvan is long for the current year that the calendar is set to
     * @see #isCheshvanLong()
     */
    isCheshvanLong(): boolean;
    /**
     * Returns if Kislev is short (29 days VS 30 days) in a given Jewish year. The method name isShort is done since in
     * a Kesidran (ordered) year Kislev is long. ND+ER
     *
     * @param year
     *            the Jewish year
     * @return true if Kislev is short for the given Jewish year.
     * @see #isKislevShort()
     * @see #getCheshvanKislevKviah()
     */
    private static isKislevShort;
    /**
     * Returns if the Kislev is short for the year that this class is set to. The method name isShort is done since in a
     * Kesidran (ordered) year Kislev is long.
     *
     * @return true if Kislev is short for the year that this class is set to
     */
    isKislevShort(): boolean;
    /**
     * Returns the Cheshvan and Kislev kviah (whether a Jewish year is short, regular or long). It will return
     * {@link #SHELAIMIM} if both cheshvan and kislev are 30 days, {@link #KESIDRAN} if Cheshvan is 29 days and Kislev
     * is 30 days and {@link #CHASERIM} if both are 29 days.
     *
     * @return {@link #SHELAIMIM} if both cheshvan and kislev are 30 days, {@link #KESIDRAN} if Cheshvan is 29 days and
     *         Kislev is 30 days and {@link #CHASERIM} if both are 29 days.
     * @see #isCheshvanLong()
     * @see #isKislevShort()
     */
    getCheshvanKislevKviah(): number;
    /**
     * Returns the number of days of a Jewish month for a given month and year.
     *
     * @param month
     *            the Jewish month
     * @param year
     *            the Jewish Year
     * @return the number of days for a given Jewish month
     */
    private static getDaysInJewishMonth;
    /**
     * Returns the number of days of the Jewish month that the calendar is currently set to.
     *
     * @return the number of days for the Jewish month that the calendar is currently set to.
     */
    getDaysInJewishMonth(): number;
    /**
     * Computes the Jewish date from the absolute date.
     */
    private absDateToJewishDate;
    /**
     * Returns the absolute date of Jewish date. ND+ER
     *
     * @param year
     *            the Jewish year. The year can't be negative
     * @param month
     *            the Jewish month starting with Nisan. Nisan expects a value of 1 etc till Adar with a value of 12. For
     *            a leap year, 13 will be the expected value for Adar II. Use the constants {@link JewishDate#NISSAN}
     *            etc.
     * @param dayOfMonth
     *            the Jewish day of month. valid values are 1-30. If the day of month is set to 30 for a month that only
     *            has 29 days, the day will be set as 29.
     * @return the absolute date of the Jewish date.
     */
    private static jewishDateToAbsDate;
    /**
     * Returns the molad for a given year and month. Returns a JewishDate {@link Object} set to the date of the molad
     * with the {@link #getMoladHours() hours}, {@link #getMoladMinutes() minutes} and {@link #getMoladChalakim()
       * chalakim} set. In the current implementation, it sets the molad time based on a midnight date rollover. This
     * means that Rosh Chodesh Adar II, 5771 with a molad of 7 chalakim past midnight on Shabbos 29 Adar I / March 5,
     * 2011 12:00 AM and 7 chalakim, will have the following values: hours: 0, minutes: 0, Chalakim: 7.
     *
     * @return a JewishDate {@link Object} set to the date of the molad with the {@link #getMoladHours() hours},
     *         {@link #getMoladMinutes() minutes} and {@link #getMoladChalakim() chalakim} set.
     */
    getMolad(): JewishDate;
    /**
     * Returns the number of days from the Jewish epoch from the number of chalakim from the epoch passed in.
     *
     * @param chalakim
     *            the number of chalakim since the beginning of Sunday prior to BaHaRaD
     * @return the number of days from the Jewish epoch
     */
    private static moladToAbsDate;
    /**
     * Constructor that creates a JewishDate based on a molad passed in. The molad would be the number of chalakim/parts
     * starting at the beginning of Sunday prior to the molad Tohu BeHaRaD (Be = Monday, Ha= 5 hours and Rad =204
     * chalakim/parts) - prior to the start of the Jewish calendar. BeHaRaD is 23:11:20 on Sunday night(5 hours 204/1080
     * chalakim after sunset on Sunday evening).
     *
     * @param molad the number of chalakim since the beginning of Sunday prior to BaHaRaD
     */
    /**
     * Sets the molad time (hours minutes and chalakim) based on the number of chalakim since the start of the day.
     *
     * @param chalakim
     *            the number of chalakim since the start of the day.
     */
    private setMoladTime;
    /**
     * returns the number of days from Rosh Hashana of the date passed in, to the full date passed in.
     *
     * @return the number of days
     */
    getDaysSinceStartOfJewishYear(): number;
    /**
     * returns the number of days from Rosh Hashana of the date passed in, to the full date passed in.
     *
     * @param year
     *            the Jewish year
     * @param month
     *            the Jewish month
     * @param dayOfMonth
     *            the day in the Jewish month
     * @return the number of days
     */
    private static getDaysSinceStartOfJewishYear;
    constructor(jewishYear: number, jewishMonth: number, jewishDayOfMonth: number);
    constructor(molad: number);
    constructor(date: Date);
    constructor(date: DateTime);
    constructor();
    /**
     * Creates a Jewish date based on a Jewish year, month and day of month.
     *
     * @param jewishYear
     *            the Jewish year
     * @param jewishMonth
     *            the Jewish month. The method expects a 1 for Nissan ... 12 for Adar and 13 for Adar II. Use the
     *            constants {@link #NISSAN} ... {@link #ADAR} (or {@link #ADAR_II} for a leap year Adar II) to avoid any
     *            confusion.
     * @param jewishDayOfMonth
     *            the Jewish day of month. If 30 is passed in for a month with only 29 days (for example {@link #IYAR},
     *            or {@link #KISLEV} in a year that {@link #isKislevShort()}), the 29th (last valid date of the month)
     *            will be set
     * @throws IllegalArgumentException
     *             if the day of month is &lt; 1 or &gt; 30, or a year of &lt; 0 is passed in.
     */
    /**
     * Default constructor will set a default date to the current system date.
     */
    /**
     * A constructor that initializes the date to the {@link java.util.Date Date} paremeter.
     *
     * @param date
     *            the <code>Date</code> to set the calendar to
     * @throws IllegalArgumentException
     *             if the date would fall prior to the January 1, 1 AD
     */
    /**
     * A constructor that initializes the date to the {@link java.util.Calendar Calendar} paremeter.
     *
     * @param calendar
     *            the <code>Calendar</code> to set the calendar to
     * @throws IllegalArgumentException
     *             if the {@link Calendar#ERA} is {@link GregorianCalendar#BC}
     */
    /**
     * Sets the date based on a {@link java.util.Calendar Calendar} object. Modifies the Jewish date as well.
     *
     * @param date
     *            the <code>Calendar</code> to set the calendar to
     * @throws IllegalArgumentException
     *             if the {@link Calendar#ERA} is {@link GregorianCalendar#BC}
     */
    setDate(date: DateTime): void;
    /**
     * Sets the date based on a {@link java.util.Date Date} object. Modifies the Jewish date as well.
     *
     * @param date
     *            the <code>Date</code> to set the calendar to
     * @throws IllegalArgumentException
     *             if the date would fall prior to the year 1 AD
     */
    /**
     * Sets the Gregorian Date, and updates the Jewish date accordingly. Like the Java Calendar A value of 0 is expected
     * for January.
     *
     * @param year
     *            the Gregorian year
     * @param month
     *            the Gregorian month. Like the Java Calendar, this class expects 0 for January
     * @param dayOfMonth
     *            the Gregorian day of month. If this is &gt; the number of days in the month/year, the last valid date of
     *            the month will be set
     * @throws IllegalArgumentException
     *             if a year of &lt; 1, a month &lt; 0 or &gt; 11 or a day of month &lt; 1 is passed in
     */
    setGregorianDate(year: number, month: number, dayOfMonth: number): void;
    /**
     * Sets the hidden internal representation of the Gregorian date , and updates the Jewish date accordingly. While
     * public getters and setters have 0 based months matching the Java Calendar classes, This class internally
     * represents the Gregorian month starting at 1. When this is called it will not adjust the month to match the Java
     * Calendar classes.
     *
     * @param year - the year
     * @param month - the month
     * @param dayOfMonth - the day of month
     */
    private setInternalGregorianDate;
    /**
     * Sets the Jewish Date and updates the Gregorian date accordingly.
     *
     * @param year
     *            the Jewish year. The year can't be negative
     * @param month
     *            the Jewish month starting with Nisan. A value of 1 is expected for Nissan ... 12 for Adar and 13 for
     *            Adar II. Use the constants {@link #NISSAN} ... {@link #ADAR} (or {@link #ADAR_II} for a leap year Adar
     *            II) to avoid any confusion.
     * @param dayOfMonth
     *            the Jewish day of month. valid values are 1-30. If the day of month is set to 30 for a month that only
     *            has 29 days, the day will be set as 29.
     * @throws IllegalArgumentException
     *             if a A Jewish date earlier than 18 Teves, 3761 (1/1/1 Gregorian), a month &lt; 1 or &gt; 12 (or 13 on a
     *             leap year) or the day of month is &lt; 1 or &gt; 30 is passed in
     */
    /**
     * Sets the Jewish Date and updates the Gregorian date accordingly.
     *
     * @param year
     *            the Jewish year. The year can't be negative
     * @param month
     *            the Jewish month starting with Nisan. A value of 1 is expected for Nissan ... 12 for Adar and 13 for
     *            Adar II. Use the constants {@link #NISSAN} ... {@link #ADAR} (or {@link #ADAR_II} for a leap year Adar
     *            II) to avoid any confusion.
     * @param dayOfMonth
     *            the Jewish day of month. valid values are 1-30. If the day of month is set to 30 for a month that only
     *            has 29 days, the day will be set as 29.
     *
     * @param hours
     *            the hour of the day. Used for Molad calculations
     * @param minutes
     *            the minutes. Used for Molad calculations
     * @param chalakim
     *            the chalakim/parts. Used for Molad calculations. The chalakim should not exceed 17. Minutes should be
     *            used for larger numbers.
     *
     * @throws IllegalArgumentException
     *             if a A Jewish date earlier than 18 Teves, 3761 (1/1/1 Gregorian), a month &lt; 1 or &gt; 12 (or 13 on a
     *             leap year), the day of month is &lt; 1 or &gt; 30, an hour &lt; 0 or &gt; 23, a minute &lt; 0 &gt; 59 or chalakim &lt; 0 &gt;
     *             17. For larger a larger number of chalakim such as 793 (TaShTzaG) break the chalakim into minutes (18
     *             chalakim per minutes, so it would be 44 minutes and 1 chelek in the case of 793 (TaShTzaG).
     */
    setJewishDate(year: number, month: number, dayOfMonth: number, hours: number, minutes: number, chalakim: number): void;
    setJewishDate(year: number, month: number, dayOfMonth: number): void;

    getDate(): DateTime;
    /**
     * Resets this date to the current system date.
     */
    resetDate(): void;
    /**
     * Returns a string containing the Jewish date in the form, "day Month, year" e.g. "21 Shevat, 5729". For more
     * complex formatting, use the formatter classes.
     *
     * This functionality is duplicated from {@link HebrewDateFormatter} to avoid circular dependencies.
     *
     * @return the Jewish date in the form "day Month, year" e.g. "21 Shevat, 5729"
     * @see HebrewDateFormatter#format(JewishDate)
     */
    toString(): string;
    /**
     * Rolls the date, month or year forward by the amount passed in. It modifies both the Gregorian and Jewish dates
     * accordingly. If manipulation beyond the fields supported here is required, use the {@link Calendar} class
     * {@link Calendar#add(int, int)} or {@link Calendar#roll(int, int)} methods in the following manner.
     *
     * <pre>
     * <code>
     *     Calendar cal = jewishDate.getTime(); // get a java.util.Calendar representation of the JewishDate
     *     cal.add(Calendar.MONTH, 3); // add 3 Gregorian months
     *     jewishDate.setDate(cal); // set the updated calendar back to this class
     * </code>
     * </pre>
     *
     * @param field the calendar field to be forwarded. The must be {@link Calendar#DATE}, {@link Calendar#MONTH} or {@link Calendar#YEAR}
     * @param amount the positive amount to move forward
     * @throws IllegalArgumentException if the field is anything besides {@link Calendar#DATE}, {@link Calendar#MONTH}
     * or {@link Calendar#YEAR} or if the amount is less than 1
     *
     * @see #back()
     * @see Calendar#add(int, int)
     * @see Calendar#roll(int, int)
     */
    forward(field: number, amount: number): void;
    /**
     * Forward the Jewish date by the number of months passed in.
     * FIXME: Deal with forwarding a date such as 30 Nisan by a month. 30 Iyar does not exist. This should be dealt with similar to
     * the way that the Java Calendar behaves (not that simple since there is a difference between add() or roll().
     *
     * @throws IllegalArgumentException if the amount is less than 1
     * @param amount the number of months to roll the month forward
     */
    private forwardJewishMonth;
    /**
     * Rolls the date back by 1 day. It modifies both the Gregorian and Jewish dates accordingly. The API does not
     * currently offer the ability to forward more than one day t a time, or to forward by month or year. If such
     * manipulation is required use the {@link Calendar} class {@link Calendar#add(int, int)} or
     * {@link Calendar#roll(int, int)} methods in the following manner.
     *
     * <pre>
     * <code>
     *     Calendar cal = jewishDate.getTime(); // get a java.util.Calendar representation of the JewishDate
     *     cal.add(Calendar.MONTH, -3); // subtract 3 Gregorian months
     *     jewishDate.setDate(cal); // set the updated calendar back to this class
     * </code>
     * </pre>
     *
     * @see #back()
     * @see Calendar#add(int, int)
     * @see Calendar#roll(int, int)
     */
    back(): void;
    /**
     * Indicates whether some other object is "equal to" this one.
     * @see Object#equals(Object)
     */
    equals(object: object): boolean;
    /**
     * Compares two dates as per the compareTo() method in the Comparable interface. Returns a value less than 0 if this
     * date is "less than" (before) the date, greater than 0 if this date is "greater than" (after) the date, or 0 if
     * they are equal.
     */
    compareTo(jewishDate: JewishDate): number;
    /**
     * Returns the Gregorian month (between 0-11).
     *
     * @return the Gregorian month (between 0-11). Like the java.util.Calendar, months are 0 based.
     */
    getGregorianMonth(): number;
    /**
     * Returns the Gregorian day of the month.
     *
     * @return the Gregorian day of the mont
     */
    getGregorianDayOfMonth(): number;
    /**
     * Returns the Gregotian year.
     *
     * @return the Gregorian year
     */
    getGregorianYear(): number;
    /**
     * Returns the Jewish month 1-12 (or 13 years in a leap year). The month count starts with 1 for Nisan and goes to
     * 13 for Adar II
     *
     * @return the Jewish month from 1 to 12 (or 13 years in a leap year). The month count starts with 1 for Nisan and
     *         goes to 13 for Adar II
     */
    getJewishMonth(): number;
    /**
     * Returns the Jewish day of month.
     *
     * @return the Jewish day of the month
     */
    getJewishDayOfMonth(): number;
    /**
     * Returns the Jewish year.
     *
     * @return the Jewish year
     */
    getJewishYear(): number;
    /**
     * Returns the day of the week as a number between 1-7.
     *
     * @return the day of the week as a number between 1-7.
     */
    getDayOfWeek(): number;
    /**
     * Sets the Gregorian month.
     *
     * @param month
     *            the Gregorian month
     *
     * @throws IllegalArgumentException
     *             if a month &lt; 0 or &gt; 11 is passed in
     */
    setGregorianMonth(month: number): void;
    /**
     * sets the Gregorian year.
     *
     * @param year
     *            the Gregorian year.
     * @throws IllegalArgumentException
     *             if a year of &lt; 1 is passed in
     */
    setGregorianYear(year: number): void;
    /**
     * sets the Gregorian Day of month.
     *
     * @param dayOfMonth
     *            the Gregorian Day of month.
     * @throws IllegalArgumentException
     *             if the day of month of &lt; 1 is passed in
     */
    setGregorianDayOfMonth(dayOfMonth: number): void;
    /**
     * sets the Jewish month.
     *
     * @param month
     *            the Jewish month from 1 to 12 (or 13 years in a leap year). The month count starts with 1 for Nisan
     *            and goes to 13 for Adar II
     * @throws IllegalArgumentException
     *             if a month &lt; 1 or &gt; 12 (or 13 on a leap year) is passed in
     */
    setJewishMonth(month: number): void;
    /**
     * sets the Jewish year.
     *
     * @param year
     *            the Jewish year
     * @throws IllegalArgumentException
     *             if a year of &lt; 3761 is passed in. The same will happen if the year is 3761 and the month and day
     *             previously set are &lt; 18 Teves (preior to Jan 1, 1 AD)
     */
    setJewishYear(year: number): void;
    /**
     * sets the Jewish day of month.
     *
     * @param dayOfMonth
     *            the Jewish day of month
     * @throws IllegalArgumentException
     *             if the day of month is &lt; 1 or &gt; 30 is passed in
     */
    setJewishDayOfMonth(dayOfMonth: number): void;
    /**
     * A method that creates a <a href="http://en.wikipedia.org/wiki/Object_copy#Deep_copy">deep copy</a> of the object.
     *
     * @see Object#clone()
     */
    clone(): JewishDate;
}
