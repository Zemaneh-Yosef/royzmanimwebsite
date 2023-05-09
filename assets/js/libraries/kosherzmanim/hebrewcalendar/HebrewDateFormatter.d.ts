import { Daf } from './Daf';
import { JewishDate } from './JewishDate';
import { JewishCalendar, Parsha } from './JewishCalendar';
/**
 * The HebrewDateFormatter class formats a {@link JewishDate}.
 *
 * The class formats Jewish dates, numbers, Daf Yomi (Bavli and Yerushalmi), the Omer, Parshas Hashavua (including special parshiyos
 * such as Shekalim, Zachor, Parah, Hachodesh), Yomim Tovim and the Molad (experimental) in Hebrew or Latin chars, and has various
 * settings. Sample full date output includes
 * (using various options):
 * <ul>
 * <li>21 Shevat, 5729</li>
 * <li>&#x5DB;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5DB;&#x5D8;</li>
 * <li>&#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5D4;&#x5F3;&#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;</li>
 * <li>&#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x05E4; or
 * &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x05E3;</li>
 * <li>&#x05DB;&#x05F3; &#x05E9;&#x05D1;&#x05D8; &#x05D5;&#x05F3; &#x05D0;&#x05DC;&#x05E4;&#x05D9;&#x05DD;</li>
 * </ul>
 *
 * @see JewishDate
 * @see JewishCalendar
 *
 * @author &copy; Eliyahu Hershfeld 2011 - 2015
 */
export declare class HebrewDateFormatter {
    /**
     * See {@link #isHebrewFormat()} and {@link #setHebrewFormat(boolean)}.
     */
    private hebrewFormat;
    /**
     * See {@link #isUseLongHebrewYears()} and {@link #setUseLongHebrewYears(boolean)}.
     */
    private useLonghebrewYears;
    /**
     * See {@link #isUseGershGershayim()} and {@link #setUseGershGershayim(boolean)}.
     */
    private useGershGershayim;
    /**
     * See {@link #isLongWeekFormat()} and {@link #setLongWeekFormat(boolean)}.
     */
    private longWeekFormat;
    /**
     * See {@link #isUseFinalFormLetters()} and {@link #setUseFinalFormLetters(boolean)}.
     */
    private useFinalFormLetters;
    /**
     * The internal DateFormat.&nbsp; See {@link #isLongWeekFormat()} and {@link #setLongWeekFormat(boolean)}.
     */
    private weekFormat;
    /**
     * List of transliterated parshiyos using the default Ashkenazi pronounciation.&nbsp; The formatParsha method uses this
     * for transliterated parsha formatting.&nbsp; This list can be overridden (for Sephardi English transliteration for
     * example) by setting the {@link #setTransliteratedParshiosList(EnumMap)}.&nbsp; The list includes double and special
     * parshiyos is set as "Bereshis, Noach, Lech Lecha, Vayera, Chayei Sara, Toldos, Vayetzei, Vayishlach, Vayeshev, Miketz,
     * Vayigash, Vayechi, Shemos, Vaera, Bo, Beshalach, Yisro, Mishpatim, Terumah, Tetzaveh, Ki Sisa, Vayakhel, Pekudei,
     * Vayikra, Tzav, Shmini, Tazria, Metzora, Achrei Mos, Kedoshim, Emor, Behar, Bechukosai, Bamidbar, Nasso, Beha'aloscha,
     * Sh'lach, Korach, Chukas, Balak, Pinchas, Matos, Masei, Devarim, Vaeschanan, Eikev, Re'eh, Shoftim, Ki Seitzei, Ki Savo,
     * Nitzavim, Vayeilech, Ha'Azinu, Vezos Habracha, Vayakhel Pekudei, Tazria Metzora, Achrei Mos Kedoshim, Behar Bechukosai,
     * Chukas Balak, Matos Masei, Nitzavim Vayeilech, Shekalim, Zachor, Parah, Hachodesh".
     *
     * @see #formatParsha(JewishCalendar)
     */
    private transliteratedParshaMap;
    /**
     * Unicode {@link Record} of Hebrew parshiyos.&nbsp; the The list includes double and special parshiyos and contains
     *  <code>"&#x05D1;&#x05E8;&#x05D0;&#x05E9;&#x05D9;&#x05EA;, &#x05E0;&#x05D7;, &#x05DC;&#x05DA; &#x05DC;&#x05DA;,
     *  &#x05D5;&#x05D9;&#x05E8;&#x05D0;, &#x05D7;&#x05D9;&#x05D9; &#x05E9;&#x05E8;&#x05D4;,
     *  &#x05EA;&#x05D5;&#x05DC;&#x05D3;&#x05D5;&#x05EA;, &#x05D5;&#x05D9;&#x05E6;&#x05D0;, &#x05D5;&#x05D9;&#x05E9;&#x05DC;&#x05D7;,
     *  &#x05D5;&#x05D9;&#x05E9;&#x05D1;, &#x05DE;&#x05E7;&#x05E5;, &#x05D5;&#x05D9;&#x05D2;&#x05E9;, &#x05D5;&#x05D9;&#x05D7;&#x05D9;,
     *  &#x05E9;&#x05DE;&#x05D5;&#x05EA;, &#x05D5;&#x05D0;&#x05E8;&#x05D0;, &#x05D1;&#x05D0;, &#x05D1;&#x05E9;&#x05DC;&#x05D7;,
     *  &#x05D9;&#x05EA;&#x05E8;&#x05D5;, &#x05DE;&#x05E9;&#x05E4;&#x05D8;&#x05D9;&#x05DD;, &#x05EA;&#x05E8;&#x05D5;&#x05DE;&#x05D4;,
     *  &#x05EA;&#x05E6;&#x05D5;&#x05D4;, &#x05DB;&#x05D9; &#x05EA;&#x05E9;&#x05D0;, &#x05D5;&#x05D9;&#x05E7;&#x05D4;&#x05DC;,
     *  &#x05E4;&#x05E7;&#x05D5;&#x05D3;&#x05D9;, &#x05D5;&#x05D9;&#x05E7;&#x05E8;&#x05D0;, &#x05E6;&#x05D5;,
     *  &#x05E9;&#x05DE;&#x05D9;&#x05E0;&#x05D9;, &#x05EA;&#x05D6;&#x05E8;&#x05D9;&#x05E2;, &#x05DE;&#x05E6;&#x05E8;&#x05E2;,
     *  &#x05D0;&#x05D7;&#x05E8;&#x05D9; &#x05DE;&#x05D5;&#x05EA;, &#x05E7;&#x05D3;&#x05D5;&#x05E9;&#x05D9;&#x05DD;,
     *  &#x05D0;&#x05DE;&#x05D5;&#x05E8;, &#x05D1;&#x05D4;&#x05E8;, &#x05D1;&#x05D7;&#x05E7;&#x05EA;&#x05D9;,
     *  &#x05D1;&#x05DE;&#x05D3;&#x05D1;&#x05E8;, &#x05E0;&#x05E9;&#x05D0;, &#x05D1;&#x05D4;&#x05E2;&#x05DC;&#x05EA;&#x05DA;,
     *  &#x05E9;&#x05DC;&#x05D7; &#x05DC;&#x05DA;, &#x05E7;&#x05E8;&#x05D7;, &#x05D7;&#x05D5;&#x05E7;&#x05EA;, &#x05D1;&#x05DC;&#x05E7;,
     *  &#x05E4;&#x05D9;&#x05E0;&#x05D7;&#x05E1;, &#x05DE;&#x05D8;&#x05D5;&#x05EA;, &#x05DE;&#x05E1;&#x05E2;&#x05D9;,
     *  &#x05D3;&#x05D1;&#x05E8;&#x05D9;&#x05DD;, &#x05D5;&#x05D0;&#x05EA;&#x05D7;&#x05E0;&#x05DF;, &#x05E2;&#x05E7;&#x05D1;,
     *  &#x05E8;&#x05D0;&#x05D4;, &#x05E9;&#x05D5;&#x05E4;&#x05D8;&#x05D9;&#x05DD;, &#x05DB;&#x05D9; &#x05EA;&#x05E6;&#x05D0;,
     *  &#x05DB;&#x05D9; &#x05EA;&#x05D1;&#x05D5;&#x05D0;, &#x05E0;&#x05D9;&#x05E6;&#x05D1;&#x05D9;&#x05DD;, &#x05D5;&#x05D9;&#x05DC;&#x05DA;,
     *  &#x05D4;&#x05D0;&#x05D6;&#x05D9;&#x05E0;&#x05D5;, &#x05D5;&#x05D6;&#x05D0;&#x05EA; &#x05D4;&#x05D1;&#x05E8;&#x05DB;&#x05D4;,
     *  &#x05D5;&#x05D9;&#x05E7;&#x05D4;&#x05DC; &#x05E4;&#x05E7;&#x05D5;&#x05D3;&#x05D9;, &#x05EA;&#x05D6;&#x05E8;&#x05D9;&#x05E2;
     *  &#x05DE;&#x05E6;&#x05E8;&#x05E2;, &#x05D0;&#x05D7;&#x05E8;&#x05D9; &#x05DE;&#x05D5;&#x05EA;
     *  &#x05E7;&#x05D3;&#x05D5;&#x05E9;&#x05D9;&#x05DD;, &#x05D1;&#x05D4;&#x05E8; &#x05D1;&#x05D7;&#x05E7;&#x05EA;&#x05D9;,
     *  &#x05D7;&#x05D5;&#x05E7;&#x05EA; &#x05D1;&#x05DC;&#x05E7;, &#x05DE;&#x05D8;&#x05D5;&#x05EA; &#x05DE;&#x05E1;&#x05E2;&#x05D9;,
     *  &#x05E0;&#x05D9;&#x05E6;&#x05D1;&#x05D9;&#x05DD; &#x05D5;&#x05D9;&#x05DC;&#x05DA;, &#x05E9;&#x05E7;&#x05DC;&#x05D9;&#x05DD;,
     *  &#x05D6;&#x05DB;&#x05D5;&#x05E8;, &#x05E4;&#x05E8;&#x05D4;, &#x05D4;&#x05D7;&#x05D3;&#x05E9;"</code>
     */
    private readonly hebrewParshaMap;
    /**
     * returns if the {@link #formatDayOfWeek(JewishDate)} will use the long format such as
     * &#x05E8;&#x05D0;&#x05E9;&#x05D5;&#x05DF; or short such as &#x05D0; when formatting the day of week in
     * {@link #isHebrewFormat() Hebrew}.
     *
     * @return the longWeekFormat
     * @see #setLongWeekFormat(boolean)
     * @see #formatDayOfWeek(JewishDate)
     */
    isLongWeekFormat(): boolean;
    /**
     * Setting to control if the {@link #formatDayOfWeek(JewishDate)} will use the long format such as
     * &#x05E8;&#x05D0;&#x05E9;&#x05D5;&#x05DF; or short such as &#x05D0; when formatting the day of week in
     * {@link #isHebrewFormat() Hebrew}.
     *
     * @param longWeekFormat
     *            the longWeekFormat to set
     */
    setLongWeekFormat(longWeekFormat: boolean): void;
    /**
     * The <a href="https://en.wikipedia.org/wiki/Geresh#Punctuation_mark">gersh</a> character is the &#x05F3; char
     * that is similar to a single quote and is used in formatting Hebrew numbers.
     */
    private static readonly GERESH;
    /**
     * The <a href="https://en.wikipedia.org/wiki/Gershayim#Punctuation_mark">gershyim</a> character is the &#x05F4; char
     * that is similar to a double quote and is used in formatting Hebrew numbers.
     */
    private static readonly GERSHAYIM;
    /**
     * Transliterated month names.&nbsp; Defaults to ["Nissan", "Iyar", "Sivan", "Tammuz", "Av", "Elul", "Tishrei", "Cheshvan",
     * "Kislev", "Teves", "Shevat", "Adar", "Adar II", "Adar I" ].
     * @see #getTransliteratedMonthList()
     * @see #setTransliteratedMonthList(String[])
     */
    private transliteratedMonths;
    /**
     * The Hebrew omer prefix charachter. It defaults to &#x05D1; producing &#x05D1;&#x05E2;&#x05D5;&#x05DE;&#x05E8;,
     * but can be set to &#x05DC; to produce &#x05DC;&#x05E2;&#x05D5;&#x05DE;&#x05E8; (or any other prefix).
     * @see #getHebrewOmerPrefix()
     * @see #setHebrewOmerPrefix(String)
     */
    private hebrewOmerPrefix;
    /**
     * The default value for formatting Shabbos (Saturday).&nbsp; Defaults to Shabbos.
     * @see #getTransliteratedShabbosDayOfWeek()
     * @see #setTransliteratedShabbosDayOfWeek(String)
     */
    private transliteratedShabbosDayOfweek;
    /**
     * Returns the day of Shabbos transliterated into Latin chars. The default uses Ashkenazi pronunciation "Shabbos".
     * This can be overwritten using the {@link #setTransliteratedShabbosDayOfWeek(String)}
     *
     * @return the transliteratedShabbos. The default list of months uses Ashkenazi pronunciation "Shabbos".
     * @see #setTransliteratedShabbosDayOfWeek(String)
     * @see #formatDayOfWeek(JewishDate)
     */
    getTransliteratedShabbosDayOfWeek(): string;
    /**
     * Setter to override the default transliterated name of "Shabbos" to alternate spelling such as "Shabbat" used by
     * the {@link #formatDayOfWeek(JewishDate)}
     *
     * @param transliteratedShabbos
     *            the transliteratedShabbos to set
     *
     * @see #getTransliteratedShabbosDayOfWeek()
     * @see #formatDayOfWeek(JewishDate)
     */
    setTransliteratedShabbosDayOfWeek(transliteratedShabbos: string): void;
    /**
     * See {@link #getTransliteratedHolidayList()} and {@link #setTransliteratedHolidayList(String[])}.
     */
    private transliteratedHolidays;
    /**
     * Returns the list of holidays transliterated into Latin chars. This is used by the
     * {@link #formatYomTov(JewishCalendar)} when formatting the Yom Tov String. The default list of months uses
     * Ashkenazi pronunciation in typical American English spelling.
     *
     * @return the list of transliterated holidays. The default list is currently ["Erev Pesach", "Pesach",
     *         "Chol Hamoed Pesach", "Pesach Sheni", "Erev Shavuos", "Shavuos", "Seventeenth of Tammuz", "Tishah B'Av",
     *         "Tu B'Av", "Erev Rosh Hashana", "Rosh Hashana", "Fast of Gedalyah", "Erev Yom Kippur", "Yom Kippur",
     *         "Erev Succos", "Succos", "Chol Hamoed Succos", "Hoshana Rabbah", "Shemini Atzeres", "Simchas Torah",
     *         "Erev Chanukah", "Chanukah", "Tenth of Teves", "Tu B'Shvat", "Fast of Esther", "Purim", "Shushan Purim",
     *         "Purim Katan", "Rosh Chodesh", "Yom HaShoah", "Yom Hazikaron", "Yom Ha'atzmaut", "Yom Yerushalayim",
     *         "Lag B'Omer","Shushan Purim Katan"].
     *
     * @see #setTransliteratedMonthList(String[])
     * @see #formatYomTov(JewishCalendar)
     * @see #isHebrewFormat()
     */
    getTransliteratedHolidayList(): string[];
    /**
     * Sets the list of holidays transliterated into Latin chars. This is used by the
     * {@link #formatYomTov(JewishCalendar)} when formatting the Yom Tov String.
     *
     * @param transliteratedHolidays
     *            the transliteratedHolidays to set. Ensure that the sequence exactly matches the list returned by the
     *            default
     */
    setTransliteratedHolidayList(transliteratedHolidays: string[]): void;
    /**
     * Hebrew holiday array in the following format.<br><code>["&#x05E2;&#x05E8;&#x05D1; &#x05E4;&#x05E1;&#x05D7;",
     * "&#x05E4;&#x05E1;&#x05D7;", "&#x05D7;&#x05D5;&#x05DC; &#x05D4;&#x05DE;&#x05D5;&#x05E2;&#x05D3;
     * &#x05E4;&#x05E1;&#x05D7;", "&#x05E4;&#x05E1;&#x05D7; &#x05E9;&#x05E0;&#x05D9;", "&#x05E2;&#x05E8;&#x05D1;
     * &#x05E9;&#x05D1;&#x05D5;&#x05E2;&#x05D5;&#x05EA;", "&#x05E9;&#x05D1;&#x05D5;&#x05E2;&#x05D5;&#x05EA;",
     * "&#x05E9;&#x05D1;&#x05E2;&#x05D4; &#x05E2;&#x05E9;&#x05E8; &#x05D1;&#x05EA;&#x05DE;&#x05D5;&#x05D6;",
     * "&#x05EA;&#x05E9;&#x05E2;&#x05D4; &#x05D1;&#x05D0;&#x05D1;",
     * "&#x05D8;&#x05F4;&#x05D5; &#x05D1;&#x05D0;&#x05D1;",
     * "&#x05E2;&#x05E8;&#x05D1; &#x05E8;&#x05D0;&#x05E9; &#x05D4;&#x05E9;&#x05E0;&#x05D4;",
     * "&#x05E8;&#x05D0;&#x05E9; &#x05D4;&#x05E9;&#x05E0;&#x05D4;",
     * "&#x05E6;&#x05D5;&#x05DD; &#x05D2;&#x05D3;&#x05DC;&#x05D9;&#x05D4;",
     * "&#x05E2;&#x05E8;&#x05D1; &#x05D9;&#x05D5;&#x05DD; &#x05DB;&#x05D9;&#x05E4;&#x05D5;&#x05E8;",
     * "&#x05D9;&#x05D5;&#x05DD; &#x05DB;&#x05D9;&#x05E4;&#x05D5;&#x05E8;",
     * "&#x05E2;&#x05E8;&#x05D1; &#x05E1;&#x05D5;&#x05DB;&#x05D5;&#x05EA;",
     * "&#x05E1;&#x05D5;&#x05DB;&#x05D5;&#x05EA;",
     * "&#x05D7;&#x05D5;&#x05DC; &#x05D4;&#x05DE;&#x05D5;&#x05E2;&#x05D3; &#x05E1;&#x05D5;&#x05DB;&#x05D5;&#x05EA;",
     * "&#x05D4;&#x05D5;&#x05E9;&#x05E2;&#x05E0;&#x05D0; &#x05E8;&#x05D1;&#x05D4;",
     * "&#x05E9;&#x05DE;&#x05D9;&#x05E0;&#x05D9; &#x05E2;&#x05E6;&#x05E8;&#x05EA;",
     * "&#x05E9;&#x05DE;&#x05D7;&#x05EA; &#x05EA;&#x05D5;&#x05E8;&#x05D4;",
     * "&#x05E2;&#x05E8;&#x05D1; &#x05D7;&#x05E0;&#x05D5;&#x05DB;&#x05D4;",
     * "&#x05D7;&#x05E0;&#x05D5;&#x05DB;&#x05D4;", "&#x05E2;&#x05E9;&#x05E8;&#x05D4; &#x05D1;&#x05D8;&#x05D1;&#x05EA;",
     * "&#x05D8;&#x05F4;&#x05D5; &#x05D1;&#x05E9;&#x05D1;&#x05D8;",
     * "&#x05EA;&#x05E2;&#x05E0;&#x05D9;&#x05EA; &#x05D0;&#x05E1;&#x05EA;&#x05E8;",
     * "&#x05E4;&#x05D5;&#x05E8;&#x05D9;&#x05DD;",
     * "&#x05E4;&#x05D5;&#x05E8;&#x05D9;&#x05DD; &#x05E9;&#x05D5;&#x05E9;&#x05DF;",
     * "&#x05E4;&#x05D5;&#x05E8;&#x05D9;&#x05DD; &#x05E7;&#x05D8;&#x05DF;",
     * "&#x05E8;&#x05D0;&#x05E9; &#x05D7;&#x05D5;&#x05D3;&#x05E9;",
     * "&#x05D9;&#x05D5;&#x05DD; &#x05D4;&#x05E9;&#x05D5;&#x05D0;&#x05D4;",
     * "&#x05D9;&#x05D5;&#x05DD; &#x05D4;&#x05D6;&#x05D9;&#x05DB;&#x05E8;&#x05D5;&#x05DF;",
     * "&#x05D9;&#x05D5;&#x05DD; &#x05D4;&#x05E2;&#x05E6;&#x05DE;&#x05D0;&#x05D5;&#x05EA;",
     * "&#x05D9;&#x05D5;&#x05DD; &#x05D9;&#x05E8;&#x05D5;&#x05E9;&#x05DC;&#x05D9;&#x05DD;",
     * "&#x05DC;&#x05F4;&#x05D2; &#x05D1;&#x05E2;&#x05D5;&#x05DE;&#x05E8;",
     * "&#x05E4;&#x05D5;&#x05E8;&#x05D9;&#x05DD; &#x05E9;&#x05D5;&#x05E9;&#x05DF; &#x05E7;&#x05D8;&#x05DF;"]</code>
     */
    private static readonly hebrewHolidays;
    /**
     * Formats the Yom Tov (holiday) in Hebrew or transliterated Latin characters.
     *
     * @param jewishCalendar the JewishCalendar
     * @return the formatted holiday or an empty String if the day is not a holiday.
     * @see #isHebrewFormat()
     */
    formatYomTov(jewishCalendar: JewishCalendar): string;
    /**
     * Formats a day as Rosh Chodesh in the format of in the format of &#x05E8;&#x05D0;&#x05E9;
     * &#x05D7;&#x05D5;&#x05D3;&#x05E9; &#x05E9;&#x05D1;&#x05D8; or Rosh Chodesh Shevat. If it
     * is not Rosh Chodesh, an empty <code>String</code> will be returned.
     * @param jewishCalendar the JewishCalendar
     * @return The formatted <code>String</code> in the format of &#x05E8;&#x05D0;&#x05E9;
     * &#x05D7;&#x05D5;&#x05D3;&#x05E9; &#x05E9;&#x05D1;&#x05D8; or Rosh Chodesh Shevat. If it
     * is not Rosh Chodesh, an empty <code>String</code> will be returned.
     */
    formatRoshChodesh(jewishCalendar: JewishCalendar): string;
    /**
     * Returns if the formatter is set to use Hebrew formatting in the various formatting methods.
     *
     * @return the hebrewFormat
     * @see #setHebrewFormat(boolean)
     * @see #format(JewishDate)
     * @see #formatDayOfWeek(JewishDate)
     * @see #formatMonth(JewishDate)
     * @see #formatOmer(JewishCalendar)
     * @see #formatParsha(JewishCalendar)
     * @see #formatYomTov(JewishCalendar)
     */
    isHebrewFormat(): boolean;
    /**
     * Sets the formatter to format in Hebrew in the various formatting methods.
     *
     * @param hebrewFormat
     *            the hebrewFormat to set
     * @see #isHebrewFormat()
     * @see #format(JewishDate)
     * @see #formatDayOfWeek(JewishDate)
     * @see #formatMonth(JewishDate)
     * @see #formatOmer(JewishCalendar)
     * @see #formatParsha(JewishCalendar)
     * @see #formatYomTov(JewishCalendar)
     */
    setHebrewFormat(hebrewFormat: boolean): void;
    /**
     * Returns the Hebrew Omer prefix.&nbsp; By default it is the letter &#x05D1; producing
     * &#x05D1;&#x05E2;&#x05D5;&#x05DE;&#x05E8;, but it can be set to &#x05DC; to produce
     * &#x05DC;&#x05E2;&#x05D5;&#x05DE;&#x05E8; (or any other prefix) using the {@link #setHebrewOmerPrefix(String)}.
     *
     * @return the hebrewOmerPrefix
     *
     * @see #hebrewOmerPrefix
     * @see #setHebrewOmerPrefix(String)
     * @see #formatOmer(JewishCalendar)
     */
    getHebrewOmerPrefix(): string;
    /**
     * Method to set the Hebrew Omer prefix. By default it is the letter &#x5D1;, but this allows setting it to a
     * &#x5DC; (or any other prefix).
     *
     * @param hebrewOmerPrefix
     *            the hebrewOmerPrefix to set. You can use the Unicode &#92;u05DC to set it to &#x5DC;.
     * @see #getHebrewOmerPrefix()
     * @see #formatOmer(JewishCalendar)
     */
    setHebrewOmerPrefix(hebrewOmerPrefix: string): void;
    /**
     * Returns the list of months transliterated into Latin chars. The default list of months uses Ashkenazi
     * pronunciation in typical American English spelling. This list has a length of 14 with 3 variations for Adar -
     * "Adar", "Adar II", "Adar I"
     *
     * @return the list of months beginning in Nissan and ending in in "Adar", "Adar II", "Adar I". The default list is
     *         currently ["Nissan", "Iyar", "Sivan", "Tammuz", "Av", "Elul", "Tishrei", "Cheshvan", "Kislev", "Teves",
     *         "Shevat", "Adar", "Adar II", "Adar I"].
     * @see #setTransliteratedMonthList(String[])
     */
    getTransliteratedMonthList(): string[];
    /**
     * Setter method to allow overriding of the default list of months transliterated into into Latin chars. The default
     * uses Ashkenazi American English transliteration.
     *
     * @param transliteratedMonths
     *            an array of 14 month names that defaults to ["Nissan", "Iyar", "Sivan", "Tamuz", "Av", "Elul", "Tishrei",
     *            "Heshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II", "Adar I"].
     * @see #getTransliteratedMonthList()
     */
    setTransliteratedMonthList(transliteratedMonths: string[]): void;
    /**
     * Unicode list of Hebrew months in the following format <code>["\u05E0\u05D9\u05E1\u05DF","\u05D0\u05D9\u05D9\u05E8",
     * "\u05E1\u05D9\u05D5\u05DF","\u05EA\u05DE\u05D5\u05D6","\u05D0\u05D1","\u05D0\u05DC\u05D5\u05DC",
     * "\u05EA\u05E9\u05E8\u05D9","\u05D7\u05E9\u05D5\u05DF","\u05DB\u05E1\u05DC\u05D5","\u05D8\u05D1\u05EA",
     * "\u05E9\u05D1\u05D8","\u05D0\u05D3\u05E8","\u05D0\u05D3\u05E8 \u05D1","\u05D0\u05D3\u05E8 \u05D0"]</code>
     *
     * @see #formatMonth(JewishDate)
     */
    private hebrewMonths;
    /**
     * Unicode list of Hebrew days of week in the format of <code>["&#x05E8;&#x05D0;&#x05E9;&#x05D5;&#x05DF;",
     * "&#x05E9;&#x05E0;&#x05D9;","&#x05E9;&#x05DC;&#x05D9;&#x05E9;&#x05D9;","&#x05E8;&#x05D1;&#x05D9;&#x05E2;&#x05D9;",
     * "&#x05D7;&#x05DE;&#x05D9;&#x05E9;&#x05D9;","&#x05E9;&#x05E9;&#x05D9;","&#x05E9;&#x05D1;&#x05EA;"]</code>
     */
    private static readonly hebrewDaysOfWeek;
    /**
     * Formats the day of week. If {@link #isHebrewFormat() Hebrew formatting} is set, it will display in the format
     * &#x05E8;&#x05D0;&#x05E9;&#x05D5;&#x05DF; etc. If Hebrew formatting is not in use it will return it in the format
     * of Sunday etc. There are various formatting options that will affect the output.
     *
     * @param jewishDate the JewishDate Object
     * @return the formatted day of week
     * @see #isHebrewFormat()
     * @see #isLongWeekFormat()
     */
    formatDayOfWeek(jewishDate: JewishDate): string;
    /**
     * Returns whether the class is set to use the Geresh &#x5F3; and Gershayim &#x5F4; in formatting Hebrew dates and
     * numbers. When true and output would look like &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x5DB;
     * (or &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x5DA;). When set to false, this output
     * would display as &#x5DB;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5DB;.
     *
     * @return true if set to use the Geresh &#x5F3; and Gershayim &#x5F4; in formatting Hebrew dates and numbers.
     */
    isUseGershGershayim(): boolean;
    /**
     * Sets whether to use the Geresh &#x5F3; and Gershayim &#x5F4; in formatting Hebrew dates and numbers. The default
     * value is true and output would look like &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x5DB;
     * (or &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x5DA;). When set to false, this output would
     * display as &#x5DB;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5DB; (or
     * &#x5DB;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5DA;). Single digit days or month or years such as &#x05DB;&#x05F3;
     * &#x05E9;&#x05D1;&#x05D8; &#x05D5;&#x05F3; &#x05D0;&#x05DC;&#x05E4;&#x05D9;&#x05DD; show the use of the Geresh.
     *
     * @param useGershGershayim
     *            set to false to omit the Geresh &#x5F3; and Gershayim &#x5F4; in formatting
     */
    setUseGershGershayim(useGershGershayim: boolean): void;
    /**
     * Returns whether the class is set to use the &#x05DE;&#x05E0;&#x05E6;&#x05E4;&#x05F4;&#x05DA; letters when
     * formatting years ending in 20, 40, 50, 80 and 90 to produce &#x05EA;&#x05E9;&#x05F4;&#x05E4; if false or
     * or &#x05EA;&#x05E9;&#x05F4;&#x05E3; if true. Traditionally non-final form letters are used, so the year
     * 5780 would be formatted as &#x05EA;&#x05E9;&#x05F4;&#x05E4; if the default false is used here. If this returns
     * true, the format &#x05EA;&#x05E9;&#x05F4;&#x05E3; would be used.
     *
     * @return true if set to use final form letters when formatting Hebrew years. The default value is false.
     */
    isUseFinalFormLetters(): boolean;
    /**
     * When formatting a Hebrew Year, traditionally years ending in 20, 40, 50, 80 and 90 are formatted using non-final
     * form letters for example &#x05EA;&#x05E9;&#x05F4;&#x05E4; for the year 5780. Setting this to true (the default
     * is false) will use the final form letters for &#x05DE;&#x05E0;&#x05E6;&#x05E4;&#x05F4;&#x05DA; and will format
     * the year 5780 as &#x05EA;&#x05E9;&#x05F4;&#x05E3;.
     *
     * @param useFinalFormLetters
     *            Set this to true to use final form letters when formatting Hebrew years.
     */
    setUseFinalFormLetters(useFinalFormLetters: boolean): void;
    /**
     * Returns whether the class is set to use the thousands digit when formatting. When formatting a Hebrew Year,
     * traditionally the thousands digit is omitted and output for a year such as 5729 (1969 Gregorian) would be
     * calculated for 729 and format as &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;. When set to true the long format year such
     * as &#x5D4;&#x5F3; &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8; for 5729/1969 is returned.
     *
     * @return true if set to use the thousands digit when formatting Hebrew dates and numbers.
     */
    isUseLongHebrewYears(): boolean;
    /**
     * When formatting a Hebrew Year, traditionally the thousands digit is omitted and output for a year such as 5729
     * (1969 Gregorian) would be calculated for 729 and format as &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;. This method
     * allows setting this to true to return the long format year such as &#x5D4;&#x5F3;
     * &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8; for 5729/1969.
     *
     * @param useLongHebrewYears
     *            Set this to true to use the long formatting
     */
    setUseLongHebrewYears(useLongHebrewYears: boolean): void;
    /**
     * Formats the Jewish date. If the formatter is set to Hebrew, it will format in the form, "day Month year" for
     * example &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;, and the format
     * "21 Shevat, 5729" if not.
     *
     * @param jewishDate
     *            the JewishDate to be formatted
     * @return the formatted date. If the formatter is set to Hebrew, it will format in the form, "day Month year" for
     *         example &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;, and the format
     *         "21 Shevat, 5729" if not.
     */
    format(jewishDate: JewishDate): string;
    /**
     * Returns a string of the current Hebrew month such as "Tishrei". Returns a string of the current Hebrew month such
     * as "&#x5D0;&#x5D3;&#x5E8; &#x5D1;&#x5F3;".
     *
     * @param jewishDate
     *            the JewishDate to format
     * @return the formatted month name
     * @see #isHebrewFormat()
     * @see #setHebrewFormat(boolean)
     * @see #getTransliteratedMonthList()
     * @see #setTransliteratedMonthList(String[])
     */
    formatMonth(jewishDate: JewishDate): string;
    /**
     * Returns a String of the Omer day in the form &#x5DC;&#x5F4;&#x5D2; &#x5D1;&#x05E2;&#x05D5;&#x05DE;&#x5E8; if
     * Hebrew Format is set, or "Omer X" or "Lag B'Omer" if not. An empty string if there is no Omer this day.
     *
     * @param jewishCalendar
     *            the JewishCalendar to be formatted
     *
     * @return a String of the Omer day in the form or an empty string if there is no Omer this day. The default
     *         formatting has a &#x5D1;&#x5F3; prefix that would output &#x5D1;&#x05E2;&#x05D5;&#x05DE;&#x5E8;, but this
     *         can be set via the {@link #setHebrewOmerPrefix(String)} method to use a &#x5DC; and output
     *         &#x5DC;&#x5F4;&#x5D2; &#x5DC;&#x05E2;&#x05D5;&#x05DE;&#x5E8;.
     * @see #isHebrewFormat()
     * @see #getHebrewOmerPrefix()
     * @see #setHebrewOmerPrefix(String)
     */
    formatOmer(jewishCalendar: JewishCalendar): string;
    /**
     * Formats a molad.
     * TODO: Experimental and incomplete
     *
     * @param moladChalakim - the chalakim of the molad
     * @return the formatted molad. FIXME: define proper format in English and Hebrew.
     */
    private static formatMolad;
    /**
     * Returns the kviah in the traditional 3 letter Hebrew format where the first letter represents the day of week of
     * Rosh Hashana, the second letter represents the lengths of Cheshvan and Kislev ({@link JewishDate#SHELAIMIM
       * Shelaimim} , {@link JewishDate#KESIDRAN Kesidran} or {@link JewishDate#CHASERIM Chaserim}) and the 3rd letter
     * represents the day of week of Pesach. For example 5729 (1969) would return &#x5D1;&#x5E9;&#x5D4; (Rosh Hashana on
     * Monday, Shelaimim, and Pesach on Thursday), while 5771 (2011) would return &#x5D4;&#x5E9;&#x5D2; (Rosh Hashana on
     * Thursday, Shelaimim, and Pesach on Tuesday).
     *
     * @param jewishYear
     *            the Jewish year
     * @return the Hebrew String such as &#x5D1;&#x5E9;&#x5D4; for 5729 (1969) and &#x5D4;&#x5E9;&#x5D2; for 5771
     *         (2011).
     */
    getFormattedKviah(jewishYear: number): string;
    /**
     * Formats the <a href="https://en.wikipedia.org/wiki/Daf_Yomi">Daf Yomi</a> Bavli in the format of
     * "&#x05E2;&#x05D9;&#x05E8;&#x05D5;&#x05D1;&#x05D9;&#x05DF; &#x05E0;&#x05F4;&#x05D1;" in {@link #isHebrewFormat() Hebrew},
     * or the transliterated format of "Eruvin 52".
     * @param daf the Daf to be formatted.
     * @return the formatted daf.
     */
    formatDafYomiBavli(daf: Daf): string;
    /**
     * Formats the <a href="https://en.wikipedia.org/wiki/Jerusalem_Talmud#Daf_Yomi_Yerushalmi">Daf Yomi Yerushalmi</a> in the format
     * of "&#x05E2;&#x05D9;&#x05E8;&#x05D5;&#x05D1;&#x05D9;&#x05DF; &#x05E0;&#x05F4;&#x05D1;" in {@link #isHebrewFormat() Hebrew}, or
     * the transliterated format of "Eruvin 52".
     *
     * @param daf the Daf to be formatted.
     * @return the formatted daf.
     */
    formatDafYomiYerushalmi(daf: Daf): string;
    /**
     * Returns a Hebrew formatted string of a number. The method can calculate from 0 - 9999.
     * <ul>
     * <li>Single digit numbers such as 3, 30 and 100 will be returned with a &#x5F3; (<a
     * href="http://en.wikipedia.org/wiki/Geresh">Geresh</a>) appended as at the end. For example &#x5D2;&#x5F3;,
     * &#x5DC;&#x5F3; and &#x5E7;&#x5F3;</li>
     * <li>multi digit numbers such as 21 and 769 will be returned with a &#x5F4; (<a
     * href="http://en.wikipedia.org/wiki/Gershayim">Gershayim</a>) between the second to last and last letters. For
     * example &#x5DB;&#x5F4;&#x5D0;, &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;</li>
     * <li>15 and 16 will be returned as &#x5D8;&#x5F4;&#x5D5; and &#x5D8;&#x5F4;&#x5D6;</li>
     * <li>Single digit numbers (years assumed) such as 6000 (%1000=0) will be returned as &#x5D5;&#x5F3;
     * &#x5D0;&#x5DC;&#x5E4;&#x5D9;&#x5DD;</li>
     * <li>0 will return &#x5D0;&#x5E4;&#x05E1;</li>
     * </ul>
     *
     * @param num
     *            the number to be formatted. It will trow an IllegalArgumentException if the number is &lt; 0 or &gt; 9999.
     * @return the Hebrew formatted number such as &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;
     * @see #isUseFinalFormLetters()
     * @see #isUseGershGershayim()
     * @see #isHebrewFormat()
     *
     */
    formatHebrewNumber(num: number): string;
    /**
     * Returns the list of transliterated parshiyos used by this formatter.
     *
     * @return the list of transliterated Parshios
     */
    getTransliteratedParshiosList(): Record<Parsha, string>;
    /**
     * Setter method to allow overriding of the default list of parshiyos transliterated into into Latin chars. The
     * default uses Ashkenazi American English transliteration.
     *
     * @param transliteratedParshaMap
     *            the transliterated Parshios as an EnumMap to set
     * @see #getTransliteratedParshiosList()
     */
    setTransliteratedParshiosList(transliteratedParshaMap: Record<Parsha, string>): void;
    /**
     * Returns a String with the name of the current parsha(ios). If the formatter is set to format in Hebrew, returns
     * a string of the current parsha(ios) in Hebrew for example &#x05D1;&#x05E8;&#x05D0;&#x05E9;&#x05D9;&#x05EA; or
     * &#x05E0;&#x05D9;&#x05E6;&#x05D1;&#x05D9;&#x05DD; &#x05D5;&#x05D9;&#x05DC;&#x05DA; or an empty string if there
     * are none. If not set to Hebrew, it returns a string of the parsha(ios) transliterated into Latin chars. The
     * default uses Ashkenazi pronunciation in typical American English spelling, for example Bereshis or
     * Nitzavim Vayeilech or an empty string if there are none.
     *
     * @param jewishCalendar the JewishCalendar Object
     * @return today's parsha(ios) in Hebrew for example, if the formatter is set to format in Hebrew, returns a string
     *         of the current parsha(ios) in Hebrew for example &#x05D1;&#x05E8;&#x05D0;&#x05E9;&#x05D9;&#x05EA; or
     *         &#x05E0;&#x05D9;&#x05E6;&#x05D1;&#x05D9;&#x05DD; &#x05D5;&#x05D9;&#x05DC;&#x05DA; or an empty string if
     *         there are none. If not set to Hebrew, it returns a string of the parsha(ios) transliterated into Latin
     *         chars. The default uses Ashkenazi pronunciation in typical American English spelling, for example
     *         Bereshis or Nitzavim Vayeilech or an empty string if there are none.
     */
    formatParsha(jewishCalendar: JewishCalendar): string;
    /**
     * Returns a String with the name of the current special parsha of Shekalim, Zachor, Parah or Hachodesh or an
     * empty String for a non-special parsha. If the formatter is set to format in Hebrew, it returns a string of
     * the current special parsha in Hebrew, for example &#x05E9;&#x05E7;&#x05DC;&#x05D9;&#x05DD;,
     * &#x05D6;&#x05DB;&#x05D5;&#x05E8;, &#x05E4;&#x05E8;&#x05D4; or &#x05D4;&#x05D7;&#x05D3;&#x05E9;. An empty
     * string if the date is not a special parsha. If not set to Hebrew, it returns a string of the special parsha
     * transliterated into Latin chars. The default uses Ashkenazi pronunciation in typical American English spelling
     * Shekalim, Zachor, Parah or Hachodesh.
     *
     * @param jewishCalendar the JewishCalendar Object
     * @return today's special parsha. If the formatter is set to format in Hebrew, returns a string
     *         of the current special parsha  in Hebrew for in the format of &#x05E9;&#x05E7;&#x05DC;&#x05D9;&#x05DD;,
     *         &#x05D6;&#x05DB;&#x05D5;&#x05E8;, &#x05E4;&#x05E8;&#x05D4; or &#x05D4;&#x05D7;&#x05D3;&#x05E9; or an empty
     *         string if there are none. If not set to Hebrew, it returns a string of the special parsha transliterated
     *         into Latin chars. The default uses Ashkenazi pronunciation in typical American English spelling of Shekalim,
     *         Zachor, Parah or Hachodesh. An empty string if there are none.
     */
    formatSpecialParsha(jewishCalendar: JewishCalendar): string;
}
