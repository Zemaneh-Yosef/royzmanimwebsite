import { type UniffiByteArray, type UniffiRustArcPtr, type UnsafeMutableRawPointer, FfiConverterObject, RustBuffer, UniffiAbstractObject, destructorGuardSymbol, pointerLiteralSymbol, uniffiTypeNameSymbol } from "uniffi-bindgen-react-native";
export declare function newAstronomicalCalendar(timestamp: bigint, geoLocation: GeoLocationInterface): AstronomicalCalendarInterface;
export declare function newComplexZmanimCalendar(timestamp: bigint, geoLocation: GeoLocationInterface, useAstronomicalChatzos: boolean, useAstronomicalChatzosForOtherZmanim: boolean, candleLightingOffset: bigint, ateretTorahSunsetOffset: bigint): ComplexZmanimCalendarInterface;
export declare function newGeolocation(latitude: number, longitude: number, elevation: number): GeoLocationInterface | undefined;
export declare function newJewishDate(timestamp: bigint, tzOffset: bigint): JewishDateInterface | undefined;
export declare function newNoaaCalculator(): NoaaCalculatorInterface;
export declare function newZmanimCalendar(timestamp: bigint, geoLocation: GeoLocationInterface, useAstronomicalChatzos: boolean, useAstronomicalChatzosForOtherZmanim: boolean, candleLightingOffset: bigint): ZmanimCalendarInterface;
export declare enum BavliTractate {
    Berachos = 0,
    Shabbos = 1,
    Eruvin = 2,
    Pesachim = 3,
    Shekalim = 4,
    Yoma = 5,
    Sukkah = 6,
    Beitzah = 7,
    RoshHashana = 8,
    Taanis = 9,
    Megillah = 10,
    MoedKatan = 11,
    Chagigah = 12,
    Yevamos = 13,
    Kesubos = 14,
    Nedarim = 15,
    Nazir = 16,
    Sotah = 17,
    Gitin = 18,
    Kiddushin = 19,
    BavaKamma = 20,
    BavaMetzia = 21,
    BavaBasra = 22,
    Sanhedrin = 23,
    Makkos = 24,
    Shevuos = 25,
    AvodahZarah = 26,
    Horiyos = 27,
    Zevachim = 28,
    Menachos = 29,
    Chullin = 30,
    Bechoros = 31,
    Arachin = 32,
    Temurah = 33,
    Kerisos = 34,
    Meilah = 35,
    Kinnim = 36,
    Tamid = 37,
    Midos = 38,
    Niddah = 39
}
export declare enum DayOfWeek {
    Sunday = 1,
    Monday = 2,
    Tuesday = 3,
    Wednesday = 4,
    Thursday = 5,
    Friday = 6,
    Saturday = 7
}
export declare enum Formula {
    Distance = 0,
    InitialBearing = 1,
    FinalBearing = 2
}
export declare enum JewishHoliday {
    ErevPesach = 0,
    Pesach = 1,
    CholHamoedPesach = 2,
    PesachSheni = 3,
    ErevShavuos = 4,
    Shavuos = 5,
    SeventeenOfTammuz = 6,
    TishaBeav = 7,
    TuBeav = 8,
    ErevRoshHashana = 9,
    RoshHashana = 10,
    FastOfGedalyah = 11,
    ErevYomKippur = 12,
    YomKippur = 13,
    ErevSuccos = 14,
    Succos = 15,
    CholHamoedSuccos = 16,
    HoshanaRabba = 17,
    SheminiAtzeres = 18,
    SimchasTorah = 19,
    Chanukah = 21,
    TenthOfTeves = 22,
    TuBeshvat = 23,
    FastOfEsther = 24,
    Purim = 25,
    ShushanPurim = 26,
    PurimKatan = 27,
    RoshChodesh = 28,
    YomHashoah = 29,
    YomHazikaron = 30,
    YomHaatzmaut = 31,
    YomYerushalayim = 32,
    LagBaomer = 33,
    ShushanPurimKatan = 34,
    IsruChag = 35,
    YomKippurKatan = 36,
    Behab = 37
}
export declare enum JewishMonth {
    Nissan = 1,
    Iyar = 2,
    Sivan = 3,
    Tammuz = 4,
    Av = 5,
    Elul = 6,
    Tishrei = 7,
    Cheshvan = 8,
    Kislev = 9,
    Teves = 10,
    Shevat = 11,
    Adar = 12,
    Adarii = 13
}
export declare enum Parsha {
    None = 0,
    Bereshis = 1,
    Noach = 2,
    LechLecha = 3,
    Vayera = 4,
    ChayeiSara = 5,
    Toldos = 6,
    Vayetzei = 7,
    Vayishlach = 8,
    Vayeshev = 9,
    Miketz = 10,
    Vayigash = 11,
    Vayechi = 12,
    Shemos = 13,
    Vaera = 14,
    Bo = 15,
    Beshalach = 16,
    Yisro = 17,
    Mishpatim = 18,
    Terumah = 19,
    Tetzaveh = 20,
    KiSisa = 21,
    Vayakhel = 22,
    Pekudei = 23,
    Vayikra = 24,
    Tzav = 25,
    Shmini = 26,
    Tazria = 27,
    Metzora = 28,
    AchreiMos = 29,
    Kedoshim = 30,
    Emor = 31,
    Behar = 32,
    Bechukosai = 33,
    Bamidbar = 34,
    Nasso = 35,
    Behaaloscha = 36,
    Shlach = 37,
    Korach = 38,
    Chukas = 39,
    Balak = 40,
    Pinchas = 41,
    Matos = 42,
    Masei = 43,
    Devarim = 44,
    Vaeschanan = 45,
    Eikev = 46,
    Reeh = 47,
    Shoftim = 48,
    KiSeitzei = 49,
    KiSavo = 50,
    Nitzavim = 51,
    Vayeilech = 52,
    Haazinu = 53,
    VzosHaberacha = 54,
    VayakhelPekudei = 55,
    TazriaMetzora = 56,
    AchreiMosKedoshim = 57,
    BeharBechukosai = 58,
    ChukasBalak = 59,
    MatosMasei = 60,
    NitzavimVayeilech = 61,
    Shkalim = 62,
    Zachor = 63,
    Para = 64,
    Hachodesh = 65,
    Shuva = 66,
    Shira = 67,
    Hagadol = 68,
    Chazon = 69,
    Nachamu = 70
}
export declare enum SolarEvent {
    Sunrise = 1,
    Sunset = 2,
    Noon = 3,
    Midnight = 4
}
export declare enum YearLengthType {
    Chaserim = 0,
    Kesidran = 1,
    Shelaimim = 2
}
export interface AstronomicalCalculatorInterface {
}
export declare class AstronomicalCalculator extends UniffiAbstractObject implements AstronomicalCalculatorInterface {
    readonly [uniffiTypeNameSymbol] = "AstronomicalCalculator";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is AstronomicalCalculator;
}
export interface AstronomicalCalendarInterface {
    getBeginAstronomicalTwilight(): /*i64*/ bigint | undefined;
    getBeginCivilTwilight(): /*i64*/ bigint | undefined;
    getBeginNauticalTwilight(): /*i64*/ bigint | undefined;
    getEndAstronomicalTwilight(): /*i64*/ bigint | undefined;
    getEndCivilTwilight(): /*i64*/ bigint | undefined;
    getEndNauticalTwilight(): /*i64*/ bigint | undefined;
    getGeoLocation(): GeoLocationInterface;
    getNoaaCalculator(): NoaaCalculatorInterface;
    getSeaLevelSunrise(): /*i64*/ bigint | undefined;
    getSeaLevelSunset(): /*i64*/ bigint | undefined;
    getSolarMidnight(): /*i64*/ bigint | undefined;
    getSunTransit(): /*i64*/ bigint | undefined;
    getSunTransitWithStartAndEndTimes(startTime: bigint, endTime: bigint): /*i64*/ bigint | undefined;
    getSunrise(): /*i64*/ bigint | undefined;
    getSunriseOffsetByDegrees(degrees: number): /*i64*/ bigint | undefined;
    getSunset(): /*i64*/ bigint | undefined;
    getSunsetOffsetByDegrees(degrees: number): /*i64*/ bigint | undefined;
    getTemporalHour(): /*i64*/ bigint | undefined;
    getTemporalHourWithStartAndEndTimes(startTime: bigint, endTime: bigint): /*i64*/ bigint | undefined;
    getTimestamp(): bigint;
    getUtcSeaLevelSunrise(zenith: number): /*f64*/ number | undefined;
    getUtcSeaLevelSunset(zenith: number): /*f64*/ number | undefined;
    getUtcSunrise(zenith: number): /*f64*/ number | undefined;
    getUtcSunset(zenith: number): /*f64*/ number | undefined;
}
export declare class AstronomicalCalendar extends UniffiAbstractObject implements AstronomicalCalendarInterface {
    readonly [uniffiTypeNameSymbol] = "AstronomicalCalendar";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    getBeginAstronomicalTwilight(): /*i64*/ bigint | undefined;
    getBeginCivilTwilight(): /*i64*/ bigint | undefined;
    getBeginNauticalTwilight(): /*i64*/ bigint | undefined;
    getEndAstronomicalTwilight(): /*i64*/ bigint | undefined;
    getEndCivilTwilight(): /*i64*/ bigint | undefined;
    getEndNauticalTwilight(): /*i64*/ bigint | undefined;
    getGeoLocation(): GeoLocationInterface;
    getNoaaCalculator(): NoaaCalculatorInterface;
    getSeaLevelSunrise(): /*i64*/ bigint | undefined;
    getSeaLevelSunset(): /*i64*/ bigint | undefined;
    getSolarMidnight(): /*i64*/ bigint | undefined;
    getSunTransit(): /*i64*/ bigint | undefined;
    getSunTransitWithStartAndEndTimes(startTime: bigint, endTime: bigint): /*i64*/ bigint | undefined;
    getSunrise(): /*i64*/ bigint | undefined;
    getSunriseOffsetByDegrees(degrees: number): /*i64*/ bigint | undefined;
    getSunset(): /*i64*/ bigint | undefined;
    getSunsetOffsetByDegrees(degrees: number): /*i64*/ bigint | undefined;
    getTemporalHour(): /*i64*/ bigint | undefined;
    getTemporalHourWithStartAndEndTimes(startTime: bigint, endTime: bigint): /*i64*/ bigint | undefined;
    getTimestamp(): bigint;
    getUtcSeaLevelSunrise(zenith: number): /*f64*/ number | undefined;
    getUtcSeaLevelSunset(zenith: number): /*f64*/ number | undefined;
    getUtcSunrise(zenith: number): /*f64*/ number | undefined;
    getUtcSunset(zenith: number): /*f64*/ number | undefined;
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is AstronomicalCalendar;
}
export interface BavliDafInterface {
}
export declare class BavliDaf extends UniffiAbstractObject implements BavliDafInterface {
    readonly [uniffiTypeNameSymbol] = "BavliDaf";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is BavliDaf;
}
export interface ComplexZmanimCalendarInterface {
    getAlos120(): /*i64*/ bigint | undefined;
    getAlos120Zmanis(): /*i64*/ bigint | undefined;
    getAlos16Point1Degrees(): /*i64*/ bigint | undefined;
    getAlos18Degrees(): /*i64*/ bigint | undefined;
    getAlos19Degrees(): /*i64*/ bigint | undefined;
    getAlos19Point8Degrees(): /*i64*/ bigint | undefined;
    getAlos26Degrees(): /*i64*/ bigint | undefined;
    getAlos60(): /*i64*/ bigint | undefined;
    getAlos72Zmanis(): /*i64*/ bigint | undefined;
    getAlos90(): /*i64*/ bigint | undefined;
    getAlos90Zmanis(): /*i64*/ bigint | undefined;
    getAlos96(): /*i64*/ bigint | undefined;
    getAlos96Zmanis(): /*i64*/ bigint | undefined;
    getAlosBaalHatanya(): /*i64*/ bigint | undefined;
    getAstronomicalCalendar(): AstronomicalCalendarInterface;
    getAteretTorahSunsetOffset(): bigint;
    getBainHashmashosRt13Point24Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosRt13Point5MinutesBefore7Point083Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosRt2Stars(): /*i64*/ bigint | undefined;
    getBainHashmashosRt58Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim13Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim16Point875Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim18Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim2Point1Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim2Point8Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim3Point05Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosrt13Point24Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosrt13Point5MinutesBefore7Point083Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosrt2Stars(): /*i64*/ bigint | undefined;
    getBainHasmashosrt58Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim13Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim16Point875Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim18Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim2Point1Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim2Point8Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim3Point05Degrees(): /*i64*/ bigint | undefined;
    getCandleLightingOffset(): bigint;
    getFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getFixedLocalChatzosBasedZmanim(startOfHalfDay: bigint, endOfHalfDay: bigint, hours: number): /*i64*/ bigint | undefined;
    getMinchaGedola16Point1Degrees(): /*i64*/ bigint | undefined;
    getMinchaGedola30Minutes(): /*i64*/ bigint | undefined;
    getMinchaGedola72Minutes(): /*i64*/ bigint | undefined;
    getMinchaGedolaAhavatShalom(): /*i64*/ bigint | undefined;
    getMinchaGedolaAteretTorah(): /*i64*/ bigint | undefined;
    getMinchaGedolaBaalHatanya(): /*i64*/ bigint | undefined;
    getMinchaGedolaBaalHatanyaGreaterThan30(): /*i64*/ bigint | undefined;
    getMinchaGedolaGraFixedLocalChatzos30Minutes(): /*i64*/ bigint | undefined;
    getMinchaGedolaGreaterThan30(): /*i64*/ bigint | undefined;
    getMinchaKetana16Point1Degrees(): /*i64*/ bigint | undefined;
    getMinchaKetana72Minutes(): /*i64*/ bigint | undefined;
    getMinchaKetanaAhavatShalom(): /*i64*/ bigint | undefined;
    getMinchaKetanaAteretTorah(): /*i64*/ bigint | undefined;
    getMinchaKetanaBaalHatanya(): /*i64*/ bigint | undefined;
    getMinchaKetanaGraFixedLocalChatzosToSunset(): /*i64*/ bigint | undefined;
    getMisheyakir10Point2Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir11Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir11Point5Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir7Point65Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir9Point5Degrees(): /*i64*/ bigint | undefined;
    getPlagAhavatShalom(): /*i64*/ bigint | undefined;
    getPlagAlos16Point1ToTzaisGeonim7Point083Degrees(): /*i64*/ bigint | undefined;
    getPlagAlosToSunset(): /*i64*/ bigint | undefined;
    getPlagHamincha120Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha120MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHamincha16Point1Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha18Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha19Point8Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha26Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha60Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha72Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha72MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHamincha90Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha90MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHamincha96Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha96MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHaminchaAteretTorah(): /*i64*/ bigint | undefined;
    getPlagHaminchaBaalHatanya(): /*i64*/ bigint | undefined;
    getPlagHaminchaGraFixedLocalChatzosToSunset(): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetana16Point1Degrees(): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetana72Minutes(): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetanaGra(): /*i64*/ bigint | undefined;
    getShaahZmanis120Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis120MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanis16Point1Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis18Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis19Point8Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis26Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis60Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis72Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis72MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanis90Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis90MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanis96Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis96MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanisAlos16Point1ToTzais3Point7(): /*i64*/ bigint | undefined;
    getShaahZmanisAlos16Point1ToTzais3Point8(): /*i64*/ bigint | undefined;
    getShaahZmanisAteretTorah(): /*i64*/ bigint | undefined;
    getShaahZmanisBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzGra(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzGra(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanKidushLevana15Days(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getSofZmanKidushLevana15DaysDefault(): /*i64*/ bigint | undefined;
    getSofZmanKidushLevanaBetweenMoldos(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getSofZmanKidushLevanaBetweenMoldosDefault(): /*i64*/ bigint | undefined;
    getSofZmanShma3HoursBeforeChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaAlos16Point1ToSunset(): /*i64*/ bigint | undefined;
    getSofZmanShmaAlos16Point1ToTzaisGeonim7Point083Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaAteretTorah(): /*i64*/ bigint | undefined;
    getSofZmanShmaBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanShmaFixedLocal(): /*i64*/ bigint | undefined;
    getSofZmanShmaGraSunriseToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaKolEliyahu(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga120Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga16Point1DegreesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga18Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga18DegreesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga19Point8Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga72MinutesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga90Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga90MinutesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga90MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga96Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga96MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfila2HoursBeforeChatzos(): /*i64*/ bigint | undefined;
    getSofZmanTfilaAteretTorah(): /*i64*/ bigint | undefined;
    getSofZmanTfilaBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanTfilaFixedLocal(): /*i64*/ bigint | undefined;
    getSofZmanTfilaGraSunriseToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga120Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga18Degrees(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga19Point8Degrees(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga90Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga90MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga96Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga96MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfilahAteretTorah(): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana3Days(): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana3DaysWithTimes(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana7Days(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana7DaysDefault(): /*i64*/ bigint | undefined;
    getTzais120(): /*i64*/ bigint | undefined;
    getTzais120Zmanis(): /*i64*/ bigint | undefined;
    getTzais16Point1Degrees(): /*i64*/ bigint | undefined;
    getTzais18Degrees(): /*i64*/ bigint | undefined;
    getTzais19Point8Degrees(): /*i64*/ bigint | undefined;
    getTzais26Degrees(): /*i64*/ bigint | undefined;
    getTzais50(): /*i64*/ bigint | undefined;
    getTzais60(): /*i64*/ bigint | undefined;
    getTzais72Zmanis(): /*i64*/ bigint | undefined;
    getTzais90(): /*i64*/ bigint | undefined;
    getTzais90Zmanis(): /*i64*/ bigint | undefined;
    getTzais96(): /*i64*/ bigint | undefined;
    getTzais96Zmanis(): /*i64*/ bigint | undefined;
    getTzaisAteretTorah(): /*i64*/ bigint | undefined;
    getTzaisBaalHatanya(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point65Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point676Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point7Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point8Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim4Point37Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim4Point61Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim4Point8Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim5Point88Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim5Point95Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim6Point45Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim7Point083Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim7Point67Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim8Point5Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim9Point3Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim9Point75Degrees(): /*i64*/ bigint | undefined;
    getUseAstronomicalChatzos(): boolean;
    getUseAstronomicalChatzosForOtherZmanim(): boolean;
    getZmanMolad(): /*i64*/ bigint | undefined;
}
export declare class ComplexZmanimCalendar extends UniffiAbstractObject implements ComplexZmanimCalendarInterface {
    readonly [uniffiTypeNameSymbol] = "ComplexZmanimCalendar";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    getAlos120(): /*i64*/ bigint | undefined;
    getAlos120Zmanis(): /*i64*/ bigint | undefined;
    getAlos16Point1Degrees(): /*i64*/ bigint | undefined;
    getAlos18Degrees(): /*i64*/ bigint | undefined;
    getAlos19Degrees(): /*i64*/ bigint | undefined;
    getAlos19Point8Degrees(): /*i64*/ bigint | undefined;
    getAlos26Degrees(): /*i64*/ bigint | undefined;
    getAlos60(): /*i64*/ bigint | undefined;
    getAlos72Zmanis(): /*i64*/ bigint | undefined;
    getAlos90(): /*i64*/ bigint | undefined;
    getAlos90Zmanis(): /*i64*/ bigint | undefined;
    getAlos96(): /*i64*/ bigint | undefined;
    getAlos96Zmanis(): /*i64*/ bigint | undefined;
    getAlosBaalHatanya(): /*i64*/ bigint | undefined;
    getAstronomicalCalendar(): AstronomicalCalendarInterface;
    getAteretTorahSunsetOffset(): bigint;
    getBainHashmashosRt13Point24Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosRt13Point5MinutesBefore7Point083Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosRt2Stars(): /*i64*/ bigint | undefined;
    getBainHashmashosRt58Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim13Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim16Point875Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim18Minutes(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim2Point1Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim2Point8Degrees(): /*i64*/ bigint | undefined;
    getBainHashmashosYereim3Point05Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosrt13Point24Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosrt13Point5MinutesBefore7Point083Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosrt2Stars(): /*i64*/ bigint | undefined;
    getBainHasmashosrt58Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim13Point5Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim16Point875Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim18Minutes(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim2Point1Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim2Point8Degrees(): /*i64*/ bigint | undefined;
    getBainHasmashosyereim3Point05Degrees(): /*i64*/ bigint | undefined;
    getCandleLightingOffset(): bigint;
    getFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getFixedLocalChatzosBasedZmanim(startOfHalfDay: bigint, endOfHalfDay: bigint, hours: number): /*i64*/ bigint | undefined;
    getMinchaGedola16Point1Degrees(): /*i64*/ bigint | undefined;
    getMinchaGedola30Minutes(): /*i64*/ bigint | undefined;
    getMinchaGedola72Minutes(): /*i64*/ bigint | undefined;
    getMinchaGedolaAhavatShalom(): /*i64*/ bigint | undefined;
    getMinchaGedolaAteretTorah(): /*i64*/ bigint | undefined;
    getMinchaGedolaBaalHatanya(): /*i64*/ bigint | undefined;
    getMinchaGedolaBaalHatanyaGreaterThan30(): /*i64*/ bigint | undefined;
    getMinchaGedolaGraFixedLocalChatzos30Minutes(): /*i64*/ bigint | undefined;
    getMinchaGedolaGreaterThan30(): /*i64*/ bigint | undefined;
    getMinchaKetana16Point1Degrees(): /*i64*/ bigint | undefined;
    getMinchaKetana72Minutes(): /*i64*/ bigint | undefined;
    getMinchaKetanaAhavatShalom(): /*i64*/ bigint | undefined;
    getMinchaKetanaAteretTorah(): /*i64*/ bigint | undefined;
    getMinchaKetanaBaalHatanya(): /*i64*/ bigint | undefined;
    getMinchaKetanaGraFixedLocalChatzosToSunset(): /*i64*/ bigint | undefined;
    getMisheyakir10Point2Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir11Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir11Point5Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir7Point65Degrees(): /*i64*/ bigint | undefined;
    getMisheyakir9Point5Degrees(): /*i64*/ bigint | undefined;
    getPlagAhavatShalom(): /*i64*/ bigint | undefined;
    getPlagAlos16Point1ToTzaisGeonim7Point083Degrees(): /*i64*/ bigint | undefined;
    getPlagAlosToSunset(): /*i64*/ bigint | undefined;
    getPlagHamincha120Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha120MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHamincha16Point1Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha18Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha19Point8Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha26Degrees(): /*i64*/ bigint | undefined;
    getPlagHamincha60Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha72Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha72MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHamincha90Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha90MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHamincha96Minutes(): /*i64*/ bigint | undefined;
    getPlagHamincha96MinutesZmanis(): /*i64*/ bigint | undefined;
    getPlagHaminchaAteretTorah(): /*i64*/ bigint | undefined;
    getPlagHaminchaBaalHatanya(): /*i64*/ bigint | undefined;
    getPlagHaminchaGraFixedLocalChatzosToSunset(): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetana16Point1Degrees(): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetana72Minutes(): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetanaGra(): /*i64*/ bigint | undefined;
    getShaahZmanis120Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis120MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanis16Point1Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis18Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis19Point8Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis26Degrees(): /*i64*/ bigint | undefined;
    getShaahZmanis60Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis72Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis72MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanis90Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis90MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanis96Minutes(): /*i64*/ bigint | undefined;
    getShaahZmanis96MinutesZmanis(): /*i64*/ bigint | undefined;
    getShaahZmanisAlos16Point1ToTzais3Point7(): /*i64*/ bigint | undefined;
    getShaahZmanisAlos16Point1ToTzais3Point8(): /*i64*/ bigint | undefined;
    getShaahZmanisAteretTorah(): /*i64*/ bigint | undefined;
    getShaahZmanisBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzGra(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanAchilasChametzMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzGra(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanBiurChametzMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanKidushLevana15Days(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getSofZmanKidushLevana15DaysDefault(): /*i64*/ bigint | undefined;
    getSofZmanKidushLevanaBetweenMoldos(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getSofZmanKidushLevanaBetweenMoldosDefault(): /*i64*/ bigint | undefined;
    getSofZmanShma3HoursBeforeChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaAlos16Point1ToSunset(): /*i64*/ bigint | undefined;
    getSofZmanShmaAlos16Point1ToTzaisGeonim7Point083Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaAteretTorah(): /*i64*/ bigint | undefined;
    getSofZmanShmaBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanShmaFixedLocal(): /*i64*/ bigint | undefined;
    getSofZmanShmaGraSunriseToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaKolEliyahu(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga120Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga16Point1DegreesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga18Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga18DegreesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga19Point8Degrees(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga72MinutesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga90Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga90MinutesToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga90MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga96Minutes(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga96MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfila2HoursBeforeChatzos(): /*i64*/ bigint | undefined;
    getSofZmanTfilaAteretTorah(): /*i64*/ bigint | undefined;
    getSofZmanTfilaBaalHatanya(): /*i64*/ bigint | undefined;
    getSofZmanTfilaFixedLocal(): /*i64*/ bigint | undefined;
    getSofZmanTfilaGraSunriseToFixedLocalChatzos(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga120Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga16Point1Degrees(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga18Degrees(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga19Point8Degrees(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga72Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga72MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga90Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga90MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga96Minutes(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga96MinutesZmanis(): /*i64*/ bigint | undefined;
    getSofZmanTfilahAteretTorah(): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana3Days(): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana3DaysWithTimes(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana7Days(alos: /*i64*/ bigint | undefined, tzais: /*i64*/ bigint | undefined): /*i64*/ bigint | undefined;
    getTchilasZmanKidushLevana7DaysDefault(): /*i64*/ bigint | undefined;
    getTzais120(): /*i64*/ bigint | undefined;
    getTzais120Zmanis(): /*i64*/ bigint | undefined;
    getTzais16Point1Degrees(): /*i64*/ bigint | undefined;
    getTzais18Degrees(): /*i64*/ bigint | undefined;
    getTzais19Point8Degrees(): /*i64*/ bigint | undefined;
    getTzais26Degrees(): /*i64*/ bigint | undefined;
    getTzais50(): /*i64*/ bigint | undefined;
    getTzais60(): /*i64*/ bigint | undefined;
    getTzais72Zmanis(): /*i64*/ bigint | undefined;
    getTzais90(): /*i64*/ bigint | undefined;
    getTzais90Zmanis(): /*i64*/ bigint | undefined;
    getTzais96(): /*i64*/ bigint | undefined;
    getTzais96Zmanis(): /*i64*/ bigint | undefined;
    getTzaisAteretTorah(): /*i64*/ bigint | undefined;
    getTzaisBaalHatanya(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point65Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point676Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point7Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim3Point8Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim4Point37Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim4Point61Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim4Point8Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim5Point88Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim5Point95Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim6Point45Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim7Point083Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim7Point67Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim8Point5Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim9Point3Degrees(): /*i64*/ bigint | undefined;
    getTzaisGeonim9Point75Degrees(): /*i64*/ bigint | undefined;
    getUseAstronomicalChatzos(): boolean;
    getUseAstronomicalChatzosForOtherZmanim(): boolean;
    getZmanMolad(): /*i64*/ bigint | undefined;
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is ComplexZmanimCalendar;
}
export interface GeoLocationInterface {
    geodesicDistance(location: GeoLocationInterface): /*f64*/ number | undefined;
    geodesicFinalBearing(location: GeoLocationInterface): /*f64*/ number | undefined;
    geodesicInitialBearing(location: GeoLocationInterface): /*f64*/ number | undefined;
    getElevation(): number;
    getLatitude(): number;
    getLongitude(): number;
    rhumbLineBearing(location: GeoLocationInterface): number;
    rhumbLineDistance(location: GeoLocationInterface): number;
    vincentyInverseFormula(location: GeoLocationInterface, formula: Formula): /*f64*/ number | undefined;
}
export declare class GeoLocation extends UniffiAbstractObject implements GeoLocationInterface {
    readonly [uniffiTypeNameSymbol] = "GeoLocation";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    geodesicDistance(location: GeoLocationInterface): /*f64*/ number | undefined;
    geodesicFinalBearing(location: GeoLocationInterface): /*f64*/ number | undefined;
    geodesicInitialBearing(location: GeoLocationInterface): /*f64*/ number | undefined;
    getElevation(): number;
    getLatitude(): number;
    getLongitude(): number;
    rhumbLineBearing(location: GeoLocationInterface): number;
    rhumbLineDistance(location: GeoLocationInterface): number;
    vincentyInverseFormula(location: GeoLocationInterface, formula: Formula): /*f64*/ number | undefined;
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is GeoLocation;
}
export interface JewishCalendarInterface {
    getBavliDafYomi(): BavliDafInterface | undefined;
    getDayOfChanukah(): number;
    getDayOfOmer(): number;
    getInIsrael(): boolean;
    getJewishDate(): JewishDateInterface;
    getParshah(): Parsha;
    getUseModernHolidays(): boolean;
    getYomTovIndex(): JewishHoliday | undefined;
    hasCandleLighting(): boolean;
    isAseresYemeiTeshuva(): boolean;
    isAssurBemelacha(): boolean;
    isChanukah(): boolean;
    isCholHamoed(): boolean;
    isCholHamoedPesach(): boolean;
    isCholHamoedSuccos(): boolean;
    isErevYomTov(): boolean;
    isErevYomTovSheni(): boolean;
    isHoshanaRabba(): boolean;
    isIsruChag(): boolean;
    isPesach(): boolean;
    isPurim(): boolean;
    isRoshChodesh(): boolean;
    isRoshHashana(): boolean;
    isShavuos(): boolean;
    isSheminiAtzeres(): boolean;
    isSimchasTorah(): boolean;
    isSuccos(): boolean;
    isTaanis(): boolean;
    isTaanisBechoros(): boolean;
    isTishaBeav(): boolean;
    isTomorrowShabbosOrYomTov(): boolean;
    isYomKippur(): boolean;
    isYomTov(): boolean;
    isYomTovAssurBemelacha(): boolean;
}
export declare class JewishCalendar extends UniffiAbstractObject implements JewishCalendarInterface {
    readonly [uniffiTypeNameSymbol] = "JewishCalendar";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    getBavliDafYomi(): BavliDafInterface | undefined;
    getDayOfChanukah(): number;
    getDayOfOmer(): number;
    getInIsrael(): boolean;
    getJewishDate(): JewishDateInterface;
    getParshah(): Parsha;
    getUseModernHolidays(): boolean;
    getYomTovIndex(): JewishHoliday | undefined;
    hasCandleLighting(): boolean;
    isAseresYemeiTeshuva(): boolean;
    isAssurBemelacha(): boolean;
    isChanukah(): boolean;
    isCholHamoed(): boolean;
    isCholHamoedPesach(): boolean;
    isCholHamoedSuccos(): boolean;
    isErevYomTov(): boolean;
    isErevYomTovSheni(): boolean;
    isHoshanaRabba(): boolean;
    isIsruChag(): boolean;
    isPesach(): boolean;
    isPurim(): boolean;
    isRoshChodesh(): boolean;
    isRoshHashana(): boolean;
    isShavuos(): boolean;
    isSheminiAtzeres(): boolean;
    isSimchasTorah(): boolean;
    isSuccos(): boolean;
    isTaanis(): boolean;
    isTaanisBechoros(): boolean;
    isTishaBeav(): boolean;
    isTomorrowShabbosOrYomTov(): boolean;
    isYomKippur(): boolean;
    isYomTov(): boolean;
    isYomTovAssurBemelacha(): boolean;
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is JewishCalendar;
}
export interface JewishDateInterface {
    getChalakimSinceMoladTohu(): bigint;
    getCheshvanKislevKviah(): YearLengthType;
    getDayOfWeek(): DayOfWeek;
    getDaysInJewishMonth(): number;
    getDaysInJewishYear(): number;
    getDaysSinceStartOfJewishYear(): number;
    getGregorianDayOfMonth(): number;
    getGregorianMonth(): number;
    getGregorianYear(): number;
    getJewishDayOfMonth(): number;
    getJewishMonth(): JewishMonth;
    getJewishYear(): number;
    getMoladData(): MoladDataInterface | undefined;
    getMoladDate(): JewishDateInterface | undefined;
    isCheshvanLong(): boolean;
    isJewishLeapYear(): boolean;
    isKislevShort(): boolean;
}
export declare class JewishDate extends UniffiAbstractObject implements JewishDateInterface {
    readonly [uniffiTypeNameSymbol] = "JewishDate";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    getChalakimSinceMoladTohu(): bigint;
    getCheshvanKislevKviah(): YearLengthType;
    getDayOfWeek(): DayOfWeek;
    getDaysInJewishMonth(): number;
    getDaysInJewishYear(): number;
    getDaysSinceStartOfJewishYear(): number;
    getGregorianDayOfMonth(): number;
    getGregorianMonth(): number;
    getGregorianYear(): number;
    getJewishDayOfMonth(): number;
    getJewishMonth(): JewishMonth;
    getJewishYear(): number;
    getMoladData(): MoladDataInterface | undefined;
    getMoladDate(): JewishDateInterface | undefined;
    isCheshvanLong(): boolean;
    isJewishLeapYear(): boolean;
    isKislevShort(): boolean;
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is JewishDate;
}
export interface MoladDataInterface {
}
export declare class MoladData extends UniffiAbstractObject implements MoladDataInterface {
    readonly [uniffiTypeNameSymbol] = "MoladData";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is MoladData;
}
export interface NoaaCalculatorInterface {
    getSolarAzimuth(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getSolarElevation(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getUtcMidnight(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getUtcNoon(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getUtcSunrise(timestamp: bigint, geoLocation: GeoLocationInterface, zenith: number, adjustForElevation: boolean): /*f64*/ number | undefined;
    getUtcSunset(timestamp: bigint, geoLocation: GeoLocationInterface, zenith: number, adjustForElevation: boolean): /*f64*/ number | undefined;
}
export declare class NoaaCalculator extends UniffiAbstractObject implements NoaaCalculatorInterface {
    readonly [uniffiTypeNameSymbol] = "NoaaCalculator";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    getSolarAzimuth(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getSolarElevation(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getUtcMidnight(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getUtcNoon(timestamp: bigint, geoLocation: GeoLocationInterface): /*f64*/ number | undefined;
    getUtcSunrise(timestamp: bigint, geoLocation: GeoLocationInterface, zenith: number, adjustForElevation: boolean): /*f64*/ number | undefined;
    getUtcSunset(timestamp: bigint, geoLocation: GeoLocationInterface, zenith: number, adjustForElevation: boolean): /*f64*/ number | undefined;
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is NoaaCalculator;
}
export interface ZmanimCalendarInterface {
    getMinchaGedola(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getMinchaKetana(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getPlagHamincha(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetana(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getSofZmanShma(startOfDay: bigint, endOfDay: /*i64*/ bigint | undefined, synchronous: boolean): /*i64*/ bigint | undefined;
    getSofZmanTfila(startOfDay: bigint, endOfDay: /*i64*/ bigint | undefined, synchronous: boolean): /*i64*/ bigint | undefined;
    getAlos72(): /*i64*/ bigint | undefined;
    getAlosHashachar(): /*i64*/ bigint | undefined;
    getAstronomicalCalendar(): AstronomicalCalendarInterface;
    getCandleLighting(): /*i64*/ bigint | undefined;
    getCandleLightingOffset(): bigint;
    getChatzos(): /*i64*/ bigint | undefined;
    getChatzosAsHalfDay(): /*i64*/ bigint | undefined;
    getHalfDayBasedShaahZmanis(startOfHalfDay: bigint, endOfHalfDay: bigint): /*i64*/ bigint | undefined;
    getHalfDayBasedZman(startOfHalfDay: bigint, endOfHalfDay: bigint, hours: number): /*i64*/ bigint | undefined;
    getMinchaGedolaDefault(): /*i64*/ bigint | undefined;
    getMinchaGedolaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getMinchaKetanaDefault(): /*i64*/ bigint | undefined;
    getMinchaKetanaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getPercentOfShaahZmanisFromDegrees(degrees: number, sunset: boolean): /*f64*/ number | undefined;
    getPlagHaminchaDefault(): /*i64*/ bigint | undefined;
    getPlagHaminchaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetanaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getShaahZmanisBasedZman(startOfDay: bigint, endOfDay: bigint, hours: number): /*i64*/ bigint | undefined;
    getShaahZmanisGra(): /*i64*/ bigint | undefined;
    getShaahZmanisMga(): /*i64*/ bigint | undefined;
    getSofZmanShmaGra(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga(): /*i64*/ bigint | undefined;
    getSofZmanShmaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getSofZmanTfilaGra(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga(): /*i64*/ bigint | undefined;
    getSofZmanTfilaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getTzais(): /*i64*/ bigint | undefined;
    getTzais72(): /*i64*/ bigint | undefined;
    getUseAstronomicalChatzos(): boolean;
    getUseAstronomicalChatzosForOtherZmanim(): boolean;
}
export declare class ZmanimCalendar extends UniffiAbstractObject implements ZmanimCalendarInterface {
    readonly [uniffiTypeNameSymbol] = "ZmanimCalendar";
    readonly [destructorGuardSymbol]: UniffiRustArcPtr;
    readonly [pointerLiteralSymbol]: UnsafeMutableRawPointer;
    private constructor();
    getMinchaGedola(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getMinchaKetana(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getPlagHamincha(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetana(startOfDay: /*i64*/ bigint | undefined, endOfDay: bigint, synchronous: boolean): /*i64*/ bigint | undefined;
    getSofZmanShma(startOfDay: bigint, endOfDay: /*i64*/ bigint | undefined, synchronous: boolean): /*i64*/ bigint | undefined;
    getSofZmanTfila(startOfDay: bigint, endOfDay: /*i64*/ bigint | undefined, synchronous: boolean): /*i64*/ bigint | undefined;
    getAlos72(): /*i64*/ bigint | undefined;
    getAlosHashachar(): /*i64*/ bigint | undefined;
    getAstronomicalCalendar(): AstronomicalCalendarInterface;
    getCandleLighting(): /*i64*/ bigint | undefined;
    getCandleLightingOffset(): bigint;
    getChatzos(): /*i64*/ bigint | undefined;
    getChatzosAsHalfDay(): /*i64*/ bigint | undefined;
    getHalfDayBasedShaahZmanis(startOfHalfDay: bigint, endOfHalfDay: bigint): /*i64*/ bigint | undefined;
    getHalfDayBasedZman(startOfHalfDay: bigint, endOfHalfDay: bigint, hours: number): /*i64*/ bigint | undefined;
    getMinchaGedolaDefault(): /*i64*/ bigint | undefined;
    getMinchaGedolaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getMinchaKetanaDefault(): /*i64*/ bigint | undefined;
    getMinchaKetanaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getPercentOfShaahZmanisFromDegrees(degrees: number, sunset: boolean): /*f64*/ number | undefined;
    getPlagHaminchaDefault(): /*i64*/ bigint | undefined;
    getPlagHaminchaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getSamuchLeMinchaKetanaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getShaahZmanisBasedZman(startOfDay: bigint, endOfDay: bigint, hours: number): /*i64*/ bigint | undefined;
    getShaahZmanisGra(): /*i64*/ bigint | undefined;
    getShaahZmanisMga(): /*i64*/ bigint | undefined;
    getSofZmanShmaGra(): /*i64*/ bigint | undefined;
    getSofZmanShmaMga(): /*i64*/ bigint | undefined;
    getSofZmanShmaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getSofZmanTfilaGra(): /*i64*/ bigint | undefined;
    getSofZmanTfilaMga(): /*i64*/ bigint | undefined;
    getSofZmanTfilaSimple(startOfDay: bigint, endOfDay: bigint): /*i64*/ bigint | undefined;
    getTzais(): /*i64*/ bigint | undefined;
    getTzais72(): /*i64*/ bigint | undefined;
    getUseAstronomicalChatzos(): boolean;
    getUseAstronomicalChatzosForOtherZmanim(): boolean;
    /**
     * {@inheritDoc uniffi-bindgen-react-native#UniffiAbstractObject.uniffiDestroy}
     */
    uniffiDestroy(): void;
    static instanceOf(obj: any): obj is ZmanimCalendar;
}
/**
 * This should be called before anything else.
 *
 * It is likely that this is being done for you by the library's `index.ts`.
 *
 * It checks versions of uniffi between when the Rust scaffolding was generated
 * and when the bindings were generated.
 *
 * It also initializes the machinery to enable Rust to talk back to Javascript.
 */
declare function uniffiEnsureInitialized(): void;
declare const _default: Readonly<{
    initialize: typeof uniffiEnsureInitialized;
    converters: {
        FfiConverterTypeAstronomicalCalculator: FfiConverterObject<AstronomicalCalculatorInterface>;
        FfiConverterTypeAstronomicalCalendar: FfiConverterObject<AstronomicalCalendarInterface>;
        FfiConverterTypeBavliDaf: FfiConverterObject<BavliDafInterface>;
        FfiConverterTypeBavliTractate: {
            read(from: RustBuffer): BavliTractate;
            write(value: BavliTractate, into: RustBuffer): void;
            allocationSize(value: BavliTractate): number;
            lift(value: UniffiByteArray): BavliTractate;
            lower(value: BavliTractate): UniffiByteArray;
        };
        FfiConverterTypeComplexZmanimCalendar: FfiConverterObject<ComplexZmanimCalendarInterface>;
        FfiConverterTypeDayOfWeek: {
            read(from: RustBuffer): DayOfWeek;
            write(value: DayOfWeek, into: RustBuffer): void;
            allocationSize(value: DayOfWeek): number;
            lift(value: UniffiByteArray): DayOfWeek;
            lower(value: DayOfWeek): UniffiByteArray;
        };
        FfiConverterTypeFormula: {
            read(from: RustBuffer): Formula;
            write(value: Formula, into: RustBuffer): void;
            allocationSize(value: Formula): number;
            lift(value: UniffiByteArray): Formula;
            lower(value: Formula): UniffiByteArray;
        };
        FfiConverterTypeGeoLocation: FfiConverterObject<GeoLocationInterface>;
        FfiConverterTypeJewishCalendar: FfiConverterObject<JewishCalendarInterface>;
        FfiConverterTypeJewishDate: FfiConverterObject<JewishDateInterface>;
        FfiConverterTypeJewishHoliday: {
            read(from: RustBuffer): JewishHoliday;
            write(value: JewishHoliday, into: RustBuffer): void;
            allocationSize(value: JewishHoliday): number;
            lift(value: UniffiByteArray): JewishHoliday;
            lower(value: JewishHoliday): UniffiByteArray;
        };
        FfiConverterTypeJewishMonth: {
            read(from: RustBuffer): JewishMonth;
            write(value: JewishMonth, into: RustBuffer): void;
            allocationSize(value: JewishMonth): number;
            lift(value: UniffiByteArray): JewishMonth;
            lower(value: JewishMonth): UniffiByteArray;
        };
        FfiConverterTypeMoladData: FfiConverterObject<MoladDataInterface>;
        FfiConverterTypeNOAACalculator: FfiConverterObject<NoaaCalculatorInterface>;
        FfiConverterTypeParsha: {
            read(from: RustBuffer): Parsha;
            write(value: Parsha, into: RustBuffer): void;
            allocationSize(value: Parsha): number;
            lift(value: UniffiByteArray): Parsha;
            lower(value: Parsha): UniffiByteArray;
        };
        FfiConverterTypeSolarEvent: {
            read(from: RustBuffer): SolarEvent;
            write(value: SolarEvent, into: RustBuffer): void;
            allocationSize(value: SolarEvent): number;
            lift(value: UniffiByteArray): SolarEvent;
            lower(value: SolarEvent): UniffiByteArray;
        };
        FfiConverterTypeYearLengthType: {
            read(from: RustBuffer): YearLengthType;
            write(value: YearLengthType, into: RustBuffer): void;
            allocationSize(value: YearLengthType): number;
            lift(value: UniffiByteArray): YearLengthType;
            lower(value: YearLengthType): UniffiByteArray;
        };
        FfiConverterTypeZmanimCalendar: FfiConverterObject<ZmanimCalendarInterface>;
    };
}>;
export default _default;
