/**
 * An Object representing a Daf in the Daf Yomi cycle.
 *
 * @author &copy; Eliyahu Hershfeld 2011 - 2019
 */
export declare class Daf {
    /**
     * {@link #getMasechtaNumber()} and {@link #setMasechtaNumber(int)}.
     */
    private masechtaNumber;
    /**
     * See {@link #getDaf()} and {@link #setDaf(int)}.
     */
    private daf;
    /**
     * See {@link #getMasechtaTransliterated()} and {@link #setMasechtaTransliterated(String[])}.
     */
    private static masechtosBavliTransliterated;
    /**
     * See {@link #getMasechta()}.
     */
    private static readonly masechtosBavli;
    /**
     * See {@link #getYerushlmiMasechtaTransliterated()}.
     */
    private static masechtosYerushalmiTransliterated;
    /**
     * See {@link #getYerushalmiMasechta()}.
     */
    private static readonly masechtosYerushlmi;
    /**
     * gets the masechta number of the currently set Daf. The sequence is: Berachos, Shabbos, Eruvin, Pesachim,
     * Shekalim, Yoma, Sukkah, Beitzah, Rosh Hashana, Taanis, Megillah, Moed Katan, Chagigah, Yevamos, Kesubos, Nedarim,
     * Nazir, Sotah, Gitin, Kiddushin, Bava Kamma, Bava Metzia, Bava Basra, Sanhedrin, Makkos, Shevuos, Avodah Zarah,
     * Horiyos, Zevachim, Menachos, Chullin, Bechoros, Arachin, Temurah, Kerisos, Meilah, Kinnim, Tamid, Midos and
     * Niddah.
     * @return the masechtaNumber
     * @see #setMasechtaNumber(int)
     */
    getMasechtaNumber(): number;
    /**
     * Set the masechta number in the order of the Daf Yomi. The sequence is: Berachos, Shabbos, Eruvin, Pesachim,
     * Shekalim, Yoma, Sukkah, Beitzah, Rosh Hashana, Taanis, Megillah, Moed Katan, Chagigah, Yevamos, Kesubos, Nedarim,
     * Nazir, Sotah, Gitin, Kiddushin, Bava Kamma, Bava Metzia, Bava Basra, Sanhedrin, Makkos, Shevuos, Avodah Zarah,
     * Horiyos, Zevachim, Menachos, Chullin, Bechoros, Arachin, Temurah, Kerisos, Meilah, Kinnim, Tamid, Midos and
     * Niddah.
     *
     * @param masechtaNumber
     *            the masechtaNumber in the order of the Daf Yomi to set
     */
    setMasechtaNumber(masechtaNumber: number): void;
    /**
     * Constructor that creates a Daf setting the {@link #setMasechtaNumber(int) masechta Number} and
     * {@link #setDaf(int) daf Number}
     *
     * @param masechtaNumber the masechtaNumber in the order of the Daf Yomi to set
     * @param daf the daf (page) number to set
     */
    constructor(masechtaNumber: number, daf: number);
    /**
     * Returns the daf (page number) of the Daf Yomi
     * @return the daf (page number) of the Daf Yomi
     */
    getDaf(): number;
    /**
     * Sets the daf (page number) of the Daf Yomi
     * @param daf the daf (page) number
     */
    setDaf(daf: number): void;
    /**
     * Returns the transliterated name of the masechta (tractate) of the Daf Yomi. The list of mashechtos is: Berachos,
     * Shabbos, Eruvin, Pesachim, Shekalim, Yoma, Sukkah, Beitzah, Rosh Hashana, Taanis, Megillah, Moed Katan, Chagigah,
     * Yevamos, Kesubos, Nedarim, Nazir, Sotah, Gitin, Kiddushin, Bava Kamma, Bava Metzia, Bava Basra, Sanhedrin,
     * Makkos, Shevuos, Avodah Zarah, Horiyos, Zevachim, Menachos, Chullin, Bechoros, Arachin, Temurah, Kerisos, Meilah,
     * Kinnim, Tamid, Midos and Niddah.
     *
     * @return the transliterated name of the masechta (tractate) of the Daf Yomi such as Berachos.
     * @see #setMasechtaTransliterated(String[])
     */
    getMasechtaTransliterated(): string;
    /**
     * Setter method to allow overriding of the default list of masechtos transliterated into into Latin chars. The default
     * uses Ashkenazi American English transliteration.
     *
     * @param masechtosBavliTransliterated the list of transliterated Bavli masechtos to set.
     * @see #getMasechtaTransliterated()
     */
    static setMasechtaTransliterated(masechtosBavliTransliterated: string[]): void;
    /**
     * Returns the masechta (tractate) of the Daf Yomi in Hebrew. The list is in the following format<br>
     * <code>["&#x05D1;&#x05E8;&#x05DB;&#x05D5;&#x05EA;",
     * "&#x05E9;&#x05D1;&#x05EA;", "&#x05E2;&#x05D9;&#x05E8;&#x05D5;&#x05D1;&#x05D9;&#x05DF;",
     * "&#x05E4;&#x05E1;&#x05D7;&#x05D9;&#x05DD;", "&#x05E9;&#x05E7;&#x05DC;&#x05D9;&#x05DD;", "&#x05D9;&#x05D5;&#x05DE;&#x05D0;",
     * "&#x05E1;&#x05D5;&#x05DB;&#x05D4;", "&#x05D1;&#x05D9;&#x05E6;&#x05D4;", "&#x05E8;&#x05D0;&#x05E9; &#x05D4;&#x05E9;&#x05E0;&#x05D4;",
     * "&#x05EA;&#x05E2;&#x05E0;&#x05D9;&#x05EA;", "&#x05DE;&#x05D2;&#x05D9;&#x05DC;&#x05D4;", "&#x05DE;&#x05D5;&#x05E2;&#x05D3;
     * &#x05E7;&#x05D8;&#x05DF;", "&#x05D7;&#x05D2;&#x05D9;&#x05D2;&#x05D4;", "&#x05D9;&#x05D1;&#x05DE;&#x05D5;&#x05EA;",
     * "&#x05DB;&#x05EA;&#x05D5;&#x05D1;&#x05D5;&#x05EA;", "&#x05E0;&#x05D3;&#x05E8;&#x05D9;&#x05DD;","&#x05E0;&#x05D6;&#x05D9;&#x05E8;",
     * "&#x05E1;&#x05D5;&#x05D8;&#x05D4;", "&#x05D2;&#x05D9;&#x05D8;&#x05D9;&#x05DF;", "&#x05E7;&#x05D9;&#x05D3;&#x05D5;&#x05E9;&#x05D9;&#x05DF;",
     * "&#x05D1;&#x05D1;&#x05D0; &#x05E7;&#x05DE;&#x05D0;", "&#x05D1;&#x05D1;&#x05D0; &#x05DE;&#x05E6;&#x05D9;&#x05E2;&#x05D0;",
     * "&#x05D1;&#x05D1;&#x05D0; &#x05D1;&#x05EA;&#x05E8;&#x05D0;", "&#x05E1;&#x05E0;&#x05D4;&#x05D3;&#x05E8;&#x05D9;&#x05DF;",
     * "&#x05DE;&#x05DB;&#x05D5;&#x05EA;", "&#x05E9;&#x05D1;&#x05D5;&#x05E2;&#x05D5;&#x05EA;", "&#x05E2;&#x05D1;&#x05D5;&#x05D3;&#x05D4;
     * &#x05D6;&#x05E8;&#x05D4;", "&#x05D4;&#x05D5;&#x05E8;&#x05D9;&#x05D5;&#x05EA;", "&#x05D6;&#x05D1;&#x05D7;&#x05D9;&#x05DD;",
     * "&#x05DE;&#x05E0;&#x05D7;&#x05D5;&#x05EA;", "&#x05D7;&#x05D5;&#x05DC;&#x05D9;&#x05DF;", "&#x05D1;&#x05DB;&#x05D5;&#x05E8;&#x05D5;&#x05EA;",
     * "&#x05E2;&#x05E8;&#x05DB;&#x05D9;&#x05DF;", "&#x05EA;&#x05DE;&#x05D5;&#x05E8;&#x05D4;", "&#x05DB;&#x05E8;&#x05D9;&#x05EA;&#x05D5;&#x05EA;",
     * "&#x05DE;&#x05E2;&#x05D9;&#x05DC;&#x05D4;", "&#x05E7;&#x05D9;&#x05E0;&#x05D9;&#x05DD;", "&#x05EA;&#x05DE;&#x05D9;&#x05D3;",
     * "&#x05DE;&#x05D9;&#x05D3;&#x05D5;&#x05EA;", "&#x05E0;&#x05D3;&#x05D4;"]</code>.
     *
     * @return the masechta (tractate) of the Daf Yomi in Hebrew, It will return
     *         &#x05D1;&#x05E8;&#x05DB;&#x05D5;&#x05EA; for Berachos.
     */
    getMasechta(): string;
    /**
     * Returns the transliterated name of the masechta (tractate) of the Daf Yomi in Yerushalmi. The list of mashechtos
     * is: Berachos, Pe'ah, Demai, Kilayim, Shevi'is, Terumos, Ma'asros, Ma'aser Sheni, Chalah, Orlah, Bikurim, Shabbos,
     * Eruvin, Pesachim, Beitzah, Rosh Hashanah, Yoma, Sukah, Ta'anis, Shekalim, Megilah, Chagigah, Moed Katan, Yevamos,
     * Kesuvos, Sotah, Nedarim, Nazir, Gitin, Kidushin, Bava Kama, Bava Metzia, Bava Basra, Sanhedrin, Makos, Shevuos,
     * Avodah Zarah, Horayos, Nidah, and No Daf Today.
     *
     * @return the transliterated name of the masechta (tractate) of the Daf Yomi such as Berachos.
     */
    getYerushlmiMasechtaTransliterated(): string;
    /**
     * Setter method to allow overriding of the default list of Yerushalmi masechtos transliterated into into Latin chars.
     * The default uses Ashkenazi American English transliteration.
     *
     * @param masechtosYerushalmiTransliterated the list of transliterated Yerushalmi masechtos to set.
     */
    static setYerushlmiMasechtaTransliterated(masechtosYerushalmiTransliterated: string[]): void;
    /**
     * Returns the Yerushlmi masechta (tractate) of the Daf Yomi in Hebrew, It will return
     * &#x05D1;&#x05E8;&#x05DB;&#x05D5;&#x05EA; for Berachos.
     *
     * @return the Yerushalmi masechta (tractate) of the Daf Yomi in Hebrew, It will return
     *         &#x05D1;&#x05E8;&#x05DB;&#x05D5;&#x05EA; for Berachos.
     */
    getYerushalmiMasechta(): string;
}
