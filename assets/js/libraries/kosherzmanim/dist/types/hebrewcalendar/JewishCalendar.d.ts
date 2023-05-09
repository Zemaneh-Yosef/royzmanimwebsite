import { DateTime } from '../../../../luxon';

import { Daf } from './Daf';
import { JewishDate } from './JewishDate';
/**
 * List of <em>parshiyos</em>. {@link #NONE} indicates a week without a <em>parsha</em>, while the enum for the <em>parsha</em> of
 * {@link #VZOS_HABERACHA} exists for consistency, but is not currently used.
 *
 */
export declare enum Parsha {
    /** NONE - A week without any <em>parsha</em> such as <em>Shabbos Chol Hamoed</em> */
    NONE = 0,
    BERESHIS = 1,
    NOACH = 2,
    LECH_LECHA = 3,
    VAYERA = 4,
    CHAYEI_SARA = 5,
    TOLDOS = 6,
    VAYETZEI = 7,
    VAYISHLACH = 8,
    VAYESHEV = 9,
    MIKETZ = 10,
    VAYIGASH = 11,
    VAYECHI = 12,
    SHEMOS = 13,
    VAERA = 14,
    BO = 15,
    BESHALACH = 16,
    YISRO = 17,
    MISHPATIM = 18,
    TERUMAH = 19,
    TETZAVEH = 20,
    KI_SISA = 21,
    VAYAKHEL = 22,
    PEKUDEI = 23,
    VAYIKRA = 24,
    TZAV = 25,
    SHMINI = 26,
    TAZRIA = 27,
    METZORA = 28,
    ACHREI_MOS = 29,
    KEDOSHIM = 30,
    EMOR = 31,
    BEHAR = 32,
    BECHUKOSAI = 33,
    BAMIDBAR = 34,
    NASSO = 35,
    BEHAALOSCHA = 36,
    SHLACH = 37,
    KORACH = 38,
    CHUKAS = 39,
    BALAK = 40,
    PINCHAS = 41,
    MATOS = 42,
    MASEI = 43,
    DEVARIM = 44,
    VAESCHANAN = 45,
    EIKEV = 46,
    REEH = 47,
    SHOFTIM = 48,
    KI_SEITZEI = 49,
    KI_SAVO = 50,
    NITZAVIM = 51,
    VAYEILECH = 52,
    HAAZINU = 53,
    VZOS_HABERACHA = 54,
    /** The double parsha of Vayakhel &amp; Peudei */
    VAYAKHEL_PEKUDEI = 55,
    /** The double <em>parsha</em> of Tazria &amp; Metzora */
    TAZRIA_METZORA = 56,
    /** The double <em>parsha</em> of Achrei Mos &amp; Kedoshim */
    ACHREI_MOS_KEDOSHIM = 57,
    /** The double <em>parsha</em> of Behar &amp; Bechukosai */
    BEHAR_BECHUKOSAI = 58,
    /** The double <em>parsha</em> of Chukas &amp; Balak */
    CHUKAS_BALAK = 59,
    /** The double <em>parsha</em> of Matos &amp; Masei */
    MATOS_MASEI = 60,
    /** The double <em>parsha</em> of Nitzavim &amp; Vayelech */
    NITZAVIM_VAYEILECH = 61,
    /** The special <em>parsha</em> of Shekalim */
    SHKALIM = 62,
    /** The special <em>parsha</em> of Zachor */
    ZACHOR = 63,
    /** The special <em>parsha</em> of Para */
    PARA = 64,
    /** The special <em>parsha</em> of Hachodesh */
    HACHODESH = 65
}
/**
 * The JewishCalendar extends the JewishDate class and adds calendar methods.
 *
 * This open source Java code was originally ported by <a href="http://www.facebook.com/avromf">Avrom Finkelstien</a>
 * from his C++ code. It was refactored to fit the KosherJava Zmanim API with simplification of the code, enhancements
 * and some bug fixing. The class allows setting whether the holiday and parsha scheme follows the Israel scheme or outside Israel
 * scheme. The default is the outside Israel scheme.
 * The parsha code was ported by Y. Paritcher from his <a href="https://github.com/yparitcher/libzmanim">libzmanim</a> code.
 *
 * TODO: Some do not belong in this class, but here is a partial list of what should still be implemented in some form:
 * <ol>
 * <li>Add Isru Chag</li>
 * <li>Mishna yomis etc</li>
 * </ol>
 *
 * @see java.util.Date
 * @see java.util.Calendar
 * @author &copy; Y. Paritcher 2019
 * @author &copy; Avrom Finkelstien 2002
 * @author &copy; Eliyahu Hershfeld 2011 - 2019
 */
export declare class JewishCalendar extends JewishDate {
    /** The 14th day of Nisan, the day before of Pesach (Passover). */
    static readonly EREV_PESACH: number;
    /** The holiday of Pesach (Passover) on the 15th (and 16th out of Israel) day of Nisan. */
    static readonly PESACH: number;
    /** Chol Hamoed (interim days) of Pesach (Passover) */
    static readonly CHOL_HAMOED_PESACH: number;
    /** Pesach Sheni, the 14th day of Iyar, a minor holiday. */
    static readonly PESACH_SHENI: number;
    /** Erev Shavuos (the day before Shavuos), the 5th of Sivan */
    static readonly EREV_SHAVUOS: number;
    /** Shavuos (Pentecost), the 6th of Sivan */
    static readonly SHAVUOS: number;
    /** The fast of the 17th day of Tamuz */
    static readonly SEVENTEEN_OF_TAMMUZ: number;
    /** The fast of the 9th of Av */
    static readonly TISHA_BEAV: number;
    /** The 15th day of Av, a minor holiday */
    static readonly TU_BEAV: number;
    /** Erev Rosh Hashana (the day before Rosh Hashana), the 29th of Elul */
    static readonly EREV_ROSH_HASHANA: number;
    /** Rosh Hashana, the first of Tishrei. */
    static readonly ROSH_HASHANA: number;
    /** The fast of Gedalyah, the 3rd of Tishrei. */
    static readonly FAST_OF_GEDALYAH: number;
    /** The 9th day of Tishrei, the day before of Yom Kippur. */
    static readonly EREV_YOM_KIPPUR: number;
    /** The holiday of Yom Kippur, the 10th day of Tishrei */
    static readonly YOM_KIPPUR: number;
    /** The 14th day of Tishrei, the day before of Succos/Sukkos (Tabernacles). */
    static readonly EREV_SUCCOS: number;
    /** The holiday of Succos/Sukkos (Tabernacles), the 15th (and 16th out of Israel) day of Tishrei */
    static readonly SUCCOS: number;
    /** Chol Hamoed (interim days) of Succos/Sukkos (Tabernacles) */
    static readonly CHOL_HAMOED_SUCCOS: number;
    /** Hoshana Rabba, the 7th day of Succos/Sukkos that occurs on the 21st of Tishrei. */
    static readonly HOSHANA_RABBA: number;
    /** Shmini Atzeres, the 8th day of Succos/Sukkos is an independent holiday that occurs on the 22nd of Tishrei. */
    static readonly SHEMINI_ATZERES: number;
    /** Simchas Torah, the 9th day of Succos/Sukkos, or the second day of Shmini Atzeres that is celebrated
     * {@link #getInIsrael() out of Israel} on the 23rd of Tishrei.
     */
    static readonly SIMCHAS_TORAH: number;
    /** The holiday of Chanukah. 8 days starting on the 25th day Kislev. */
    static readonly CHANUKAH: number;
    /** The fast of the 10th day of Teves. */
    static readonly TENTH_OF_TEVES: number;
    /** Tu Bishvat on the 15th day of Shevat, a minor holiday. */
    static readonly TU_BESHVAT: number;
    /** The fast of Esther, usually on the 13th day of Adar (or Adar II on leap years). It is earlier on some years. */
    static readonly FAST_OF_ESTHER: number;
    /** The holiday of Purim on the 14th day of Adar (or Adar II on leap years). */
    static readonly PURIM: number;
    /** The holiday of Shushan Purim on the 15th day of Adar (or Adar II on leap years). */
    static readonly SHUSHAN_PURIM: number;
    /** The holiday of Purim Katan on the 14th day of Adar I on a leap year when Purim is on Adar II, a minor holiday. */
    static readonly PURIM_KATAN: number;
    /**
     * Rosh Chodesh, the new moon on the first day of the Jewish month, and the 30th day of the previous month in the
     * case of a month with 30 days.
     */
    static readonly ROSH_CHODESH: number;
    /** Yom HaShoah, Holocaust Remembrance Day, usually held on the 27th of Nisan. If it falls on a Friday, it is moved
     * to the 26th, and if it falls on a Sunday it is moved to the 28th. A {@link #isUseModernHolidays() modern holiday}.
     */
    static readonly YOM_HASHOAH: number;
    /**
     * Yom HaZikaron, Israeli Memorial Day, held a day before Yom Ha'atzmaut.  A {@link #isUseModernHolidays() modern holiday}.
     */
    static readonly YOM_HAZIKARON: number;
    /** Yom Ha'atzmaut, Israel Independence Day, the 5th of Iyar, but if it occurs on a Friday or Saturday, the holiday is
     * moved back to Thursday, the 3rd of 4th of Iyar, and if it falls on a Monday, it is moved forward to Tuesday the
     * 6th of Iyar.  A {@link #isUseModernHolidays() modern holiday}. */
    static readonly YOM_HAATZMAUT: number;
    /**
     * Yom Yerushalayim or Jerusalem Day, on 28 Iyar. A {@link #isUseModernHolidays() modern holiday}.
     */
    static readonly YOM_YERUSHALAYIM: number;
    /** The 33rd day of the Omer, the 18th of Iyar, a minor holiday. */
    static readonly LAG_BAOMER: number;
    /** The holiday of Purim Katan on the 15th day of Adar I on a leap year when Purim is on Adar II, a minor holiday. */
    static readonly SHUSHAN_PURIM_KATAN: number;
    /**
     * Is the calendar set to Israel, where some holidays have different rules.
     * @see #getInIsrael()
     * @see #setInIsrael(boolean)
     */
    private inIsrael;
    /**
     * Is the calendar set to use modern Israeli holidays such as Yom Haatzmaut.
     * @see #isUseModernHolidays()
     * @see #setUseModernHolidays(boolean)
     */
    private useModernHolidays;
    /**
     * An array of <em>parshiyos</em> in the 17 possible combinations.
     */
    static readonly parshalist: Parsha[][];
    /**
     * Is this calendar set to return modern Israeli national holidays. By default this value is false. The holidays
     * are: "Yom HaShoah", "Yom Hazikaron", "Yom Ha'atzmaut" and "Yom Yerushalayim"
     *
     * @return the useModernHolidays true if set to return modern Israeli national holidays
     */
    isUseModernHolidays(): boolean;
    /**
     * Seth the calendar to return modern Israeli national holidays. By default this value is false. The holidays are:
     * "Yom HaShoah", "Yom Hazikaron", "Yom Ha'atzmaut" and "Yom Yerushalayim"
     *
     * @param useModernHolidays
     *            the useModernHolidays to set
     */
    setUseModernHolidays(useModernHolidays: boolean): void;
    /**
     * Default constructor will set a default date to the current system date.
     */
    /**
     * A constructor that initializes the date to the {@link java.util.Date Date} parameter.
     *
     * @param date
     *            the <code>Date</code> to set the calendar to
     */
    /**
     * A constructor that initializes the date to the {@link java.util.Calendar Calendar} parameter.
     *
     * @param calendar
     *            the <code>Calendar</code> to set the calendar to
     */
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
     * Creates a Jewish date based on a Jewish date and whether in Israel
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
     * @param inIsrael
     *            whether in Israel. This affects Yom Tov calculations
     */
    constructor(jewishYear: number, jewishMonth: number, jewishDayOfMonth: number, inIsrael?: boolean);
    constructor(date: Date);
    constructor(date: DateTime);
    constructor();
    /**
     * Sets whether to use Israel holiday scheme or not. Default is false.
     *
     * @param inIsrael
     *            set to true for calculations for Israel
     */
    setInIsrael(inIsrael: boolean): void;
    /**
     * Gets whether Israel holiday scheme is used or not. The default (if not set) is false.
     *
     * @return if the if the calendar is set to Israel
     */
    getInIsrael(): boolean;
    /**
     * <a href="https://en.wikipedia.org/wiki/Birkat_Hachama">Birkas Hachamah</a> is recited every 28 years based on
     * Tekufas Shmulel (Julian years) that a year is 365.25 days. The <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a>
     * in <a href="http://hebrewbooks.org/pdfpager.aspx?req=14278&amp;st=&amp;pgnum=323">Hilchos Kiddush Hachodesh 9:3</a> states that
     * tekufas Nisan of year 1 was 7 days + 9 hours before molad Nisan. This is calculated as every 10,227 days (28 * 365.25).
     * @return true for a day that Birkas Hachamah is recited.
     */
    isBirkasHachamah(): boolean;
    /**
     * Return the type of year for parsha calculations. The algorithm follows the
     * <a href="http://hebrewbooks.org/pdfpager.aspx?req=14268&amp;st=&amp;pgnum=222">Luach Arba'ah Shearim</a> in the Tur Ohr Hachaim.
     * @return the type of year for parsha calculations.
     * @todo Use constants in this class.
     */
    private getParshaYearType;
    /**
     * Returns this week's {@link Parsha} if it is Shabbos.
     * returns Parsha.NONE if a weekday or if there is no parsha that week (for example Yomtov is on Shabbos)
     * @return the current parsha
     */
    getParsha(): Parsha;
    /**
     * Returns a parsha enum if the Shabbos is one of the four parshiyos of Parsha.SHKALIM, Parsha.ZACHOR, Parsha.PARA,
     * Parsha.HACHODESH or Parsha.NONE for a regular Shabbos (or any weekday).
     * @return one of the four parshiyos of Parsha.SHKALIM, Parsha.ZACHOR, Parsha.PARA, Parsha.HACHODESH or Parsha.NONE.
     */
    getSpecialShabbos(): Parsha;
    /**
     * Returns an index of the Jewish holiday or fast day for the current day, or a -1 if there is no holiday for this
     * day. There are constants in this class representing each Yom Tov. Formatting of the Yomim tovim is done in the
     * ZmanimFormatter#
     *
     * @todo consider using enums instead of the constant ints.
     *
     * @return the index of the holiday such as the constant {@link #LAG_BAOMER} or {@link #YOM_KIPPUR} or a -1 if it is not a holiday.
     * @see HebrewDateFormatter
     */
    getYomTovIndex(): number;
    /**
     * Returns true if the current day is Yom Tov. The method returns true even for holidays such as {@link #CHANUKAH} and minor
     * ones such as {@link #TU_BEAV} and {@link #PESACH_SHENI}. Erev Yom Tov (with the exception of {@link #HOSHANA_RABBA},
     * Erev the second days of Pesach) returns false, as do {@link #isTaanis() fast days} besides {@link #YOM_KIPPUR}. Use
     * {@link #isAssurBemelacha()} to find the days that have a prohibition of work.
     *
     * @return true if the current day is a Yom Tov
     *
     * @see #getYomTovIndex()
     * @see #isErevYomTov()
     * @see #isErevYomTovSheni()
     * @see #isTaanis()
     * @see #isAssurBemelacha()
     * @see #isCholHamoed()
     */
    isYomTov(): boolean;
    /**
     * Returns true if the <em>Yom Tov</em> day has a <em>melacha</em> (work) prohibition. This method will return false for a
     * non-<em>Yom Tov</em> day, even if it is <em>Shabbos</em>.
     *
     * @return if the <em>Yom Tov</em> day has a <em>melacha</em> (work) prohibition.
     */
    isYomTovAssurBemelacha(): boolean;
    /**
     * Returns true if it is <em>Shabbos</em> or if it is a <em>Yom Tov</em> day that has a <em>melacha</em> (work)  prohibition.
     * This method will return false for a.
     * @return if the day is a <em>Yom Tov</em> that is <em>assur bemlacha</em> or <em>Shabbos</em>
     */
    isAssurBemelacha(): boolean;
    /**
     * Returns true if the day has candle lighting. This will return true on erev <em>Shabbos</em>, erev <em>Yom Tov</em>, the
     * first day of <em>Rosh Hashana</em> and the first days of <em>Yom Tov</em> out of Israel. It is identical
     * to calling {@link #isTomorrowShabbosOrYomTov()}.
     *
     * @return if the day has candle lighting
     */
    hasCandleLighting(): boolean;
    /**
     * Returns true if tomorrow is <em>Shabbos</em> or <em>Yom Tov</em>. This will return true on erev <em>Shabbos</em>, erev
     * <em>Yom Tov</em>, the first day of <em>Rosh Hashana</em> and <em>erev</em> the first days of <em>Yom Tov</em> out of
     * Israel. It is identical to calling {@link #hasCandleLighting()}.
     * @return will return if the next day is <em>Shabbos</em> or <em>Yom Tov</em>
     */
    isTomorrowShabbosOrYomTov(): boolean;
    /**
     * Returns true if the day is the second day of <em>Yom Tov</em>. This impacts the second day of <em>Rosh Hashana</em>
     * everywhere, and the second days of Yom Tov in <em>chutz laaretz</em> (out of Israel).
     *
     * @return  if the day is the second day of <em>Yom Tov</em>.
     */
    isErevYomTovSheni(): boolean;
    /**
     * Returns true if the current day is <em>Aseret Yemei Teshuva</em>.
     *
     * @return if the current day is <em>Aseret Yemei Teshuvah</em>
     */
    isAseresYemeiTeshuva(): boolean;
    /**
     * Returns true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em> or <em>Succos</em>.
     *
     * @return true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em> or <em>Succos</em>
     * @see #isYomTov()
     * @see #CHOL_HAMOED_PESACH
     * @see #CHOL_HAMOED_SUCCOS
     */
    isCholHamoed(): boolean;
    /**
     * Returns true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em>.
     *
     * @return true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em>
     * @see #isYomTov()
     * @see #CHOL_HAMOED_PESACH
     */
    isCholHamoedPesach(): boolean;
    /**
     * Returns true if the current day is <em>Chol Hamoed</em> of <em>Succos</em>.
     *
     * @return true if the current day is <em>Chol Hamoed</em> of <em>Succos</em>
     * @see #isYomTov()
     * @see #CHOL_HAMOED_SUCCOS
     */
    isCholHamoedSuccos(): boolean;
    /**
     * Returns true if the current day is erev Yom Tov. The method returns true for Erev - Pesach (first and last days),
     * Shavuos, Rosh Hashana, Yom Kippur and Succos and Hoshana Rabba.
     *
     * @return true if the current day is Erev - Pesach, Shavuos, Rosh Hashana, Yom Kippur and Succos
     * @see #isYomTov()
     * @see #isErevYomTovSheni()
     */
    isErevYomTov(): boolean;
    /**
     * Returns true if the current day is Erev Rosh Chodesh. Returns false for Erev Rosh Hashana
     *
     * @return true if the current day is Erev Rosh Chodesh. Returns false for Erev Rosh Hashana
     * @see #isRoshChodesh()
     */
    isErevRoshChodesh(): boolean;
    /**
     * Return true if the day is a Taanis (fast day). Return true for 17 of Tammuz, Tisha B'Av, Yom Kippur, Fast of
     * Gedalyah, 10 of Teves and the Fast of Esther
     *
     * @return true if today is a fast day
     */
    isTaanis(): boolean;
    /**
     * Returns the day of <em>Chanukah</em> or -1 if it is not <em>Chanukah</em>.
     *
     * @return the day of <em>Chanukah</em> or -1 if it is not <em>Chanukah</em>.
     * @see #isChanukah()
     */
    getDayOfChanukah(): number;
    /**
     * Returns true if the current day is one of the 8 days of <em>Chanukah</em>.
     * @return if the current day is one of the 8 days of <em>Chanukah</em>.
     * @see #getDayOfChanukah()
     */
    isChanukah(): boolean;
    /**
     * Returns if the day is Rosh Chodesh. Rosh Hashana will return false
     *
     * @return true if it is Rosh Chodesh. Rosh Hashana will return false
     */
    isRoshChodesh(): boolean;
    /**
     * Returns if the day is Shabbos and sunday is Rosh Chodesh.
     *
     * @return true if it is Shabbos and sunday is Rosh Chodesh.
     */
    isMacharChodesh(): boolean;
    /**
     * Returns if the day is Shabbos Mevorchim.
     *
     * @return true if it is Shabbos Mevorchim.
     */
    isShabbosMevorchim(): boolean;
    /**
     * Returns the int value of the Omer day or -1 if the day is not in the omer
     *
     * @return The Omer count as an int or -1 if it is not a day of the Omer.
     */
    getDayOfOmer(): number;
    /**
     * Returns the molad in Standard Time in Yerushalayim as a Date. The traditional calculation uses local time. This
     * method subtracts 20.94 minutes (20 minutes and 56.496 seconds) from the local time (Har Habayis with a longitude
     * of 35.2354&deg; is 5.2354&deg; away from the %15 timezone longitude) to get to standard time. This method
     * intentionally uses standard time and not dailight savings time. Java will implicitly format the time to the
     * default (or set) Timezone.
     *
     * @return the Date representing the moment of the molad in Yerushalayim standard time (GMT + 2)
     */
    getMoladAsDate(): DateTime;
    /**
     * Returns the earliest time of <em>Kiddush Levana</em> calculated as 3 days after the molad. This method returns the time
     * even if it is during the day when <em>Kiddush Levana</em> can't be said. Callers of this method should consider
     * displaying the next <em>tzais</em> if the zman is between <em>alos</em> and <em>tzais</em>.
     *
     * @return the Date representing the moment 3 days after the molad.
     *
     * @see ComplexZmanimCalendar#getTchilasZmanKidushLevana3Days()
     * @see ComplexZmanimCalendar#getTchilasZmanKidushLevana3Days(Date, Date)
     */
    getTchilasZmanKidushLevana3Days(): DateTime;
    /**
     * Returns the earliest time of Kiddush Levana calculated as 7 days after the molad as mentioned by the <a
     * href="http://en.wikipedia.org/wiki/Yosef_Karo">Mechaber</a>. See the <a
     * href="http://en.wikipedia.org/wiki/Yoel_Sirkis">Bach's</a> opinion on this time. This method returns the time
     * even if it is during the day when <em>Kiddush Levana</em> can't be said. Callers of this method should consider
     * displaying the next <em>tzais</em> if the zman is between <em>alos</em> and <em>tzais</em>.
     *
     * @return the Date representing the moment 7 days after the molad.
     *
     * @see ComplexZmanimCalendar#getTchilasZmanKidushLevana7Days()
     * @see ComplexZmanimCalendar#getTchilasZmanKidushLevana7Days(Date, Date)
     */
    getTchilasZmanKidushLevana7Days(): DateTime;
    /**
     * Returns the latest time of Kiddush Levana according to the <a
     * href="http://en.wikipedia.org/wiki/Yaakov_ben_Moshe_Levi_Moelin">Maharil's</a> opinion that it is calculated as
     * halfway between molad and molad. This adds half the 29 days, 12 hours and 793 chalakim time between molad and
     * molad (14 days, 18 hours, 22 minutes and 666 milliseconds) to the month's molad. This method returns the time
     * even if it is during the day when <em>Kiddush Levana</em> can't be said. Callers of this method should consider
     * displaying <em>alos</em> before this time if the zman is between <em>alos</em> and <em>tzais</em>.
     *
     * @return the Date representing the moment halfway between molad and molad.
     * @see #getSofZmanKidushLevana15Days()
     * @see ComplexZmanimCalendar#getSofZmanKidushLevanaBetweenMoldos()
     * @see ComplexZmanimCalendar#getSofZmanKidushLevanaBetweenMoldos(Date, Date)
     */
    getSofZmanKidushLevanaBetweenMoldos(): DateTime;
    /**
     * Returns the latest time of Kiddush Levana calculated as 15 days after the molad. This is the opinion brought down
     * in the Shulchan Aruch (Orach Chaim 426). It should be noted that some opinions hold that the
     * <a href="http://en.wikipedia.org/wiki/Moses_Isserles">Rema</a> who brings down the opinion of the <a
     * href="http://en.wikipedia.org/wiki/Yaakov_ben_Moshe_Levi_Moelin">Maharil's</a> of calculating
     * {@link #getSofZmanKidushLevanaBetweenMoldos() half way between molad and mold} is of the opinion that Mechaber
     * agrees to his opinion. Also see the Aruch Hashulchan. For additional details on the subject, See Rabbi Dovid
     * Heber's very detailed writeup in Siman Daled (chapter 4) of <a
     * href="http://www.worldcat.org/oclc/461326125">Shaarei Zmanim</a>. This method returns the time even if it is during
     * the day when <em>Kiddush Levana</em> can't be said. Callers of this method should consider displaying <em>alos</em>
     * before this time if the zman is between <em>alos</em> and <em>tzais</em>.
     *
     * @return the Date representing the moment 15 days after the molad.
     * @see #getSofZmanKidushLevanaBetweenMoldos()
     * @see ComplexZmanimCalendar#getSofZmanKidushLevana15Days()
     * @see ComplexZmanimCalendar#getSofZmanKidushLevana15Days(Date, Date)
     */
    getSofZmanKidushLevana15Days(): DateTime;
    /**
     * Returns the Daf Yomi (Bavli) for the date that the calendar is set to. See the
     * {@link HebrewDateFormatter#formatDafYomiBavli(Daf)} for the ability to format the daf in Hebrew or transliterated
     * masechta names.
     *
     * @deprecated This depends on a circular dependency. Use <pre>YomiCalculator.getDafYomiBavli(jewishCalendar)</pre> instead.
     * @return the daf as a {@link Daf}
     */
    getDafYomiBavli(): Daf;
    /**
     * Returns the Daf Yomi (Yerushalmi) for the date that the calendar is set to. See the
     * {@link HebrewDateFormatter#formatDafYomiYerushalmi(Daf)} for the ability to format the daf in Hebrew or transliterated
     * masechta names.
     *
     * @deprecated This depends on a circular dependency. Use <pre>YerushalmiYomiCalculator.getDafYomiYerushalmi(jewishCalendar)</pre> instead.
     * @return the daf as a {@link Daf}
     */
    getDafYomiYerushalmi(): Daf;
    /**
     * Indicates whether some other object is "equal to" this one.
     * @see Object#equals(Object)
     */
    equals(jewishCalendar: JewishCalendar): boolean;
}
