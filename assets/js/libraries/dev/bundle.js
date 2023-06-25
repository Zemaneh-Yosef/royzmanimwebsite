// these aren't really private, but nor are they really useful to document

/**
 * @private
 */
class LuxonError extends Error {}

/**
 * @private
 */
class InvalidDateTimeError extends LuxonError {
  constructor(reason) {
    super(`Invalid DateTime: ${reason.toMessage()}`);
  }
}

/**
 * @private
 */
class InvalidIntervalError extends LuxonError {
  constructor(reason) {
    super(`Invalid Interval: ${reason.toMessage()}`);
  }
}

/**
 * @private
 */
class InvalidDurationError extends LuxonError {
  constructor(reason) {
    super(`Invalid Duration: ${reason.toMessage()}`);
  }
}

/**
 * @private
 */
class ConflictingSpecificationError extends LuxonError {}

/**
 * @private
 */
class InvalidUnitError extends LuxonError {
  constructor(unit) {
    super(`Invalid unit ${unit}`);
  }
}

/**
 * @private
 */
class InvalidArgumentError extends LuxonError {}

/**
 * @private
 */
class ZoneIsAbstractError extends LuxonError {
  constructor() {
    super("Zone is an abstract class");
  }
}

/**
 * @private
 */

const n = "numeric",
  s = "short",
  l = "long";

const DATE_SHORT = {
  year: n,
  month: n,
  day: n,
};

const DATE_MED = {
  year: n,
  month: s,
  day: n,
};

const DATE_MED_WITH_WEEKDAY = {
  year: n,
  month: s,
  day: n,
  weekday: s,
};

const DATE_FULL = {
  year: n,
  month: l,
  day: n,
};

const DATE_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l,
};

const TIME_SIMPLE = {
  hour: n,
  minute: n,
};

const TIME_WITH_SECONDS = {
  hour: n,
  minute: n,
  second: n,
};

const TIME_WITH_SHORT_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  timeZoneName: s,
};

const TIME_WITH_LONG_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  timeZoneName: l,
};

const TIME_24_SIMPLE = {
  hour: n,
  minute: n,
  hourCycle: "h23",
};

const TIME_24_WITH_SECONDS = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23",
};

const TIME_24_WITH_SHORT_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23",
  timeZoneName: s,
};

const TIME_24_WITH_LONG_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23",
  timeZoneName: l,
};

const DATETIME_SHORT = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: n,
};

const DATETIME_SHORT_WITH_SECONDS = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: n,
  second: n,
};

const DATETIME_MED = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: n,
};

const DATETIME_MED_WITH_SECONDS = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: n,
  second: n,
};

const DATETIME_MED_WITH_WEEKDAY = {
  year: n,
  month: s,
  day: n,
  weekday: s,
  hour: n,
  minute: n,
};

const DATETIME_FULL = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: n,
  timeZoneName: s,
};

const DATETIME_FULL_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: n,
  second: n,
  timeZoneName: s,
};

const DATETIME_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: n,
  timeZoneName: l,
};

const DATETIME_HUGE_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: n,
  second: n,
  timeZoneName: l,
};

/**
 * @interface
 */
class Zone {
  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    throw new ZoneIsAbstractError();
  }

  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    throw new ZoneIsAbstractError();
  }

  get ianaName() {
    return this.name;
  }

  /**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */
  get isUniversal() {
    throw new ZoneIsAbstractError();
  }

  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(ts, opts) {
    throw new ZoneIsAbstractError();
  }

  /**
   * Returns the offset's value as a string
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    throw new ZoneIsAbstractError();
  }

  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    throw new ZoneIsAbstractError();
  }

  /**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    throw new ZoneIsAbstractError();
  }

  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    throw new ZoneIsAbstractError();
  }
}

let singleton$1 = null;

/**
 * Represents the local zone for this JavaScript environment.
 * @implements {Zone}
 */
class SystemZone extends Zone {
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance() {
    if (singleton$1 === null) {
      singleton$1 = new SystemZone();
    }
    return singleton$1;
  }

  /** @override **/
  get type() {
    return "system";
  }

  /** @override **/
  get name() {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /** @override **/
  get isUniversal() {
    return false;
  }

  /** @override **/
  offsetName(ts, { format, locale }) {
    return parseZoneInfo(ts, format, locale);
  }

  /** @override **/
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }

  /** @override **/
  offset(ts) {
    return -new Date(ts).getTimezoneOffset();
  }

  /** @override **/
  equals(otherZone) {
    return otherZone.type === "system";
  }

  /** @override **/
  get isValid() {
    return true;
  }
}

let dtfCache = {};
function makeDTF(zone) {
  if (!dtfCache[zone]) {
    dtfCache[zone] = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      era: "short",
    });
  }
  return dtfCache[zone];
}

const typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  era: 3,
  hour: 4,
  minute: 5,
  second: 6,
};

function hackyOffset(dtf, date) {
  const formatted = dtf.format(date).replace(/\u200E/g, ""),
    parsed = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted),
    [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = parsed;
  return [fYear, fMonth, fDay, fadOrBc, fHour, fMinute, fSecond];
}

function partsOffset(dtf, date) {
  const formatted = dtf.formatToParts(date);
  const filled = [];
  for (let i = 0; i < formatted.length; i++) {
    const { type, value } = formatted[i];
    const pos = typeToPos[type];

    if (type === "era") {
      filled[pos] = value;
    } else if (!isUndefined(pos)) {
      filled[pos] = parseInt(value, 10);
    }
  }
  return filled;
}

let ianaZoneCache = {};
/**
 * A zone identified by an IANA identifier, like America/New_York
 * @implements {Zone}
 */
class IANAZone extends Zone {
  /**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */
  static create(name) {
    if (!ianaZoneCache[name]) {
      ianaZoneCache[name] = new IANAZone(name);
    }
    return ianaZoneCache[name];
  }

  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCache() {
    ianaZoneCache = {};
    dtfCache = {};
  }

  /**
   * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
   * @param {string} s - The string to check validity on
   * @example IANAZone.isValidSpecifier("America/New_York") //=> true
   * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
   * @deprecated This method returns false for some valid IANA names. Use isValidZone instead.
   * @return {boolean}
   */
  static isValidSpecifier(s) {
    return this.isValidZone(s);
  }

  /**
   * Returns whether the provided string identifies a real zone
   * @param {string} zone - The string to check
   * @example IANAZone.isValidZone("America/New_York") //=> true
   * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
   * @example IANAZone.isValidZone("Sport~~blorp") //=> false
   * @return {boolean}
   */
  static isValidZone(zone) {
    if (!zone) {
      return false;
    }
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
      return true;
    } catch (e) {
      return false;
    }
  }

  constructor(name) {
    super();
    /** @private **/
    this.zoneName = name;
    /** @private **/
    this.valid = IANAZone.isValidZone(name);
  }

  /** @override **/
  get type() {
    return "iana";
  }

  /** @override **/
  get name() {
    return this.zoneName;
  }

  /** @override **/
  get isUniversal() {
    return false;
  }

  /** @override **/
  offsetName(ts, { format, locale }) {
    return parseZoneInfo(ts, format, locale, this.name);
  }

  /** @override **/
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }

  /** @override **/
  offset(ts) {
    const date = new Date(ts);

    if (isNaN(date)) return NaN;

    const dtf = makeDTF(this.name);
    let [year, month, day, adOrBc, hour, minute, second] = dtf.formatToParts
      ? partsOffset(dtf, date)
      : hackyOffset(dtf, date);

    if (adOrBc === "BC") {
      year = -Math.abs(year) + 1;
    }

    // because we're using hour12 and https://bugs.chromium.org/p/chromium/issues/detail?id=1025564&can=2&q=%2224%3A00%22%20datetimeformat
    const adjustedHour = hour === 24 ? 0 : hour;

    const asUTC = objToLocalTS({
      year,
      month,
      day,
      hour: adjustedHour,
      minute,
      second,
      millisecond: 0,
    });

    let asTS = +date;
    const over = asTS % 1000;
    asTS -= over >= 0 ? over : 1000 + over;
    return (asUTC - asTS) / (60 * 1000);
  }

  /** @override **/
  equals(otherZone) {
    return otherZone.type === "iana" && otherZone.name === this.name;
  }

  /** @override **/
  get isValid() {
    return this.valid;
  }
}

// todo - remap caching

let intlLFCache = {};
function getCachedLF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlLFCache[key];
  if (!dtf) {
    dtf = new Intl.ListFormat(locString, opts);
    intlLFCache[key] = dtf;
  }
  return dtf;
}

let intlDTCache = {};
function getCachedDTF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlDTCache[key];
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(locString, opts);
    intlDTCache[key] = dtf;
  }
  return dtf;
}

let intlNumCache = {};
function getCachedINF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let inf = intlNumCache[key];
  if (!inf) {
    inf = new Intl.NumberFormat(locString, opts);
    intlNumCache[key] = inf;
  }
  return inf;
}

let intlRelCache = {};
function getCachedRTF(locString, opts = {}) {
  const { base, ...cacheKeyOpts } = opts; // exclude `base` from the options
  const key = JSON.stringify([locString, cacheKeyOpts]);
  let inf = intlRelCache[key];
  if (!inf) {
    inf = new Intl.RelativeTimeFormat(locString, opts);
    intlRelCache[key] = inf;
  }
  return inf;
}

let sysLocaleCache = null;
function systemLocale() {
  if (sysLocaleCache) {
    return sysLocaleCache;
  } else {
    sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
    return sysLocaleCache;
  }
}

function parseLocaleString(localeStr) {
  // I really want to avoid writing a BCP 47 parser
  // see, e.g. https://github.com/wooorm/bcp-47
  // Instead, we'll do this:

  // a) if the string has no -u extensions, just leave it alone
  // b) if it does, use Intl to resolve everything
  // c) if Intl fails, try again without the -u

  // private subtags and unicode subtags have ordering requirements,
  // and we're not properly parsing this, so just strip out the
  // private ones if they exist.
  const xIndex = localeStr.indexOf("-x-");
  if (xIndex !== -1) {
    localeStr = localeStr.substring(0, xIndex);
  }

  const uIndex = localeStr.indexOf("-u-");
  if (uIndex === -1) {
    return [localeStr];
  } else {
    let options;
    let selectedStr;
    try {
      options = getCachedDTF(localeStr).resolvedOptions();
      selectedStr = localeStr;
    } catch (e) {
      const smaller = localeStr.substring(0, uIndex);
      options = getCachedDTF(smaller).resolvedOptions();
      selectedStr = smaller;
    }

    const { numberingSystem, calendar } = options;
    return [selectedStr, numberingSystem, calendar];
  }
}

function intlConfigString(localeStr, numberingSystem, outputCalendar) {
  if (outputCalendar || numberingSystem) {
    if (!localeStr.includes("-u-")) {
      localeStr += "-u";
    }

    if (outputCalendar) {
      localeStr += `-ca-${outputCalendar}`;
    }

    if (numberingSystem) {
      localeStr += `-nu-${numberingSystem}`;
    }
    return localeStr;
  } else {
    return localeStr;
  }
}

function mapMonths(f) {
  const ms = [];
  for (let i = 1; i <= 12; i++) {
    const dt = DateTime.utc(2016, i, 1);
    ms.push(f(dt));
  }
  return ms;
}

function mapWeekdays(f) {
  const ms = [];
  for (let i = 1; i <= 7; i++) {
    const dt = DateTime.utc(2016, 11, 13 + i);
    ms.push(f(dt));
  }
  return ms;
}

function listStuff(loc, length, defaultOK, englishFn, intlFn) {
  const mode = loc.listingMode(defaultOK);

  if (mode === "error") {
    return null;
  } else if (mode === "en") {
    return englishFn(length);
  } else {
    return intlFn(length);
  }
}

function supportsFastNumbers(loc) {
  if (loc.numberingSystem && loc.numberingSystem !== "latn") {
    return false;
  } else {
    return (
      loc.numberingSystem === "latn" ||
      !loc.locale ||
      loc.locale.startsWith("en") ||
      new Intl.DateTimeFormat(loc.intl).resolvedOptions().numberingSystem === "latn"
    );
  }
}

/**
 * @private
 */

class PolyNumberFormatter {
  constructor(intl, forceSimple, opts) {
    this.padTo = opts.padTo || 0;
    this.floor = opts.floor || false;

    const { padTo, floor, ...otherOpts } = opts;

    if (!forceSimple || Object.keys(otherOpts).length > 0) {
      const intlOpts = { useGrouping: false, ...opts };
      if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
      this.inf = getCachedINF(intl, intlOpts);
    }
  }

  format(i) {
    if (this.inf) {
      const fixed = this.floor ? Math.floor(i) : i;
      return this.inf.format(fixed);
    } else {
      // to match the browser's numberformatter defaults
      const fixed = this.floor ? Math.floor(i) : roundTo(i, 3);
      return padStart(fixed, this.padTo);
    }
  }
}

/**
 * @private
 */

class PolyDateFormatter {
  constructor(dt, intl, opts) {
    this.opts = opts;
    this.originalZone = undefined;

    let z = undefined;
    if (this.opts.timeZone) {
      // Don't apply any workarounds if a timeZone is explicitly provided in opts
      this.dt = dt;
    } else if (dt.zone.type === "fixed") {
      // UTC-8 or Etc/UTC-8 are not part of tzdata, only Etc/GMT+8 and the like.
      // That is why fixed-offset TZ is set to that unless it is:
      // 1. Representing offset 0 when UTC is used to maintain previous behavior and does not become GMT.
      // 2. Unsupported by the browser:
      //    - some do not support Etc/
      //    - < Etc/GMT-14, > Etc/GMT+12, and 30-minute or 45-minute offsets are not part of tzdata
      const gmtOffset = -1 * (dt.offset / 60);
      const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
      if (dt.offset !== 0 && IANAZone.create(offsetZ).valid) {
        z = offsetZ;
        this.dt = dt;
      } else {
        // Not all fixed-offset zones like Etc/+4:30 are present in tzdata so
        // we manually apply the offset and substitute the zone as needed.
        z = "UTC";
        this.dt = dt.offset === 0 ? dt : dt.setZone("UTC").plus({ minutes: dt.offset });
        this.originalZone = dt.zone;
      }
    } else if (dt.zone.type === "system") {
      this.dt = dt;
    } else if (dt.zone.type === "iana") {
      this.dt = dt;
      z = dt.zone.name;
    } else {
      // Custom zones can have any offset / offsetName so we just manually
      // apply the offset and substitute the zone as needed.
      z = "UTC";
      this.dt = dt.setZone("UTC").plus({ minutes: dt.offset });
      this.originalZone = dt.zone;
    }

    const intlOpts = { ...this.opts };
    intlOpts.timeZone = intlOpts.timeZone || z;
    this.dtf = getCachedDTF(intl, intlOpts);
  }

  format() {
    if (this.originalZone) {
      // If we have to substitute in the actual zone name, we have to use
      // formatToParts so that the timezone can be replaced.
      return this.formatToParts()
        .map(({ value }) => value)
        .join("");
    }
    return this.dtf.format(this.dt.toJSDate());
  }

  formatToParts() {
    const parts = this.dtf.formatToParts(this.dt.toJSDate());
    if (this.originalZone) {
      return parts.map((part) => {
        if (part.type === "timeZoneName") {
          const offsetName = this.originalZone.offsetName(this.dt.ts, {
            locale: this.dt.locale,
            format: this.opts.timeZoneName,
          });
          return {
            ...part,
            value: offsetName,
          };
        } else {
          return part;
        }
      });
    }
    return parts;
  }

  resolvedOptions() {
    return this.dtf.resolvedOptions();
  }
}

/**
 * @private
 */
class PolyRelFormatter {
  constructor(intl, isEnglish, opts) {
    this.opts = { style: "long", ...opts };
    if (!isEnglish && hasRelative()) {
      this.rtf = getCachedRTF(intl, opts);
    }
  }

  format(count, unit) {
    if (this.rtf) {
      return this.rtf.format(count, unit);
    } else {
      return formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== "long");
    }
  }

  formatToParts(count, unit) {
    if (this.rtf) {
      return this.rtf.formatToParts(count, unit);
    } else {
      return [];
    }
  }
}

/**
 * @private
 */

class Locale {
  static fromOpts(opts) {
    return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.defaultToEN);
  }

  static create(locale, numberingSystem, outputCalendar, defaultToEN = false) {
    const specifiedLocale = locale || Settings.defaultLocale;
    // the system locale is useful for human readable strings but annoying for parsing/formatting known formats
    const localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale());
    const numberingSystemR = numberingSystem || Settings.defaultNumberingSystem;
    const outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
    return new Locale(localeR, numberingSystemR, outputCalendarR, specifiedLocale);
  }

  static resetCache() {
    sysLocaleCache = null;
    intlDTCache = {};
    intlNumCache = {};
    intlRelCache = {};
  }

  static fromObject({ locale, numberingSystem, outputCalendar } = {}) {
    return Locale.create(locale, numberingSystem, outputCalendar);
  }

  constructor(locale, numbering, outputCalendar, specifiedLocale) {
    const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);

    this.locale = parsedLocale;
    this.numberingSystem = numbering || parsedNumberingSystem || null;
    this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
    this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);

    this.weekdaysCache = { format: {}, standalone: {} };
    this.monthsCache = { format: {}, standalone: {} };
    this.meridiemCache = null;
    this.eraCache = {};

    this.specifiedLocale = specifiedLocale;
    this.fastNumbersCached = null;
  }

  get fastNumbers() {
    if (this.fastNumbersCached == null) {
      this.fastNumbersCached = supportsFastNumbers(this);
    }

    return this.fastNumbersCached;
  }

  listingMode() {
    const isActuallyEn = this.isEnglish();
    const hasNoWeirdness =
      (this.numberingSystem === null || this.numberingSystem === "latn") &&
      (this.outputCalendar === null || this.outputCalendar === "gregory");
    return isActuallyEn && hasNoWeirdness ? "en" : "intl";
  }

  clone(alts) {
    if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
      return this;
    } else {
      return Locale.create(
        alts.locale || this.specifiedLocale,
        alts.numberingSystem || this.numberingSystem,
        alts.outputCalendar || this.outputCalendar,
        alts.defaultToEN || false
      );
    }
  }

  redefaultToEN(alts = {}) {
    return this.clone({ ...alts, defaultToEN: true });
  }

  redefaultToSystem(alts = {}) {
    return this.clone({ ...alts, defaultToEN: false });
  }

  months(length, format = false, defaultOK = true) {
    return listStuff(this, length, defaultOK, months, () => {
      const intl = format ? { month: length, day: "numeric" } : { month: length },
        formatStr = format ? "format" : "standalone";
      if (!this.monthsCache[formatStr][length]) {
        this.monthsCache[formatStr][length] = mapMonths((dt) => this.extract(dt, intl, "month"));
      }
      return this.monthsCache[formatStr][length];
    });
  }

  weekdays(length, format = false, defaultOK = true) {
    return listStuff(this, length, defaultOK, weekdays, () => {
      const intl = format
          ? { weekday: length, year: "numeric", month: "long", day: "numeric" }
          : { weekday: length },
        formatStr = format ? "format" : "standalone";
      if (!this.weekdaysCache[formatStr][length]) {
        this.weekdaysCache[formatStr][length] = mapWeekdays((dt) =>
          this.extract(dt, intl, "weekday")
        );
      }
      return this.weekdaysCache[formatStr][length];
    });
  }

  meridiems(defaultOK = true) {
    return listStuff(
      this,
      undefined,
      defaultOK,
      () => meridiems,
      () => {
        // In theory there could be aribitrary day periods. We're gonna assume there are exactly two
        // for AM and PM. This is probably wrong, but it's makes parsing way easier.
        if (!this.meridiemCache) {
          const intl = { hour: "numeric", hourCycle: "h12" };
          this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map(
            (dt) => this.extract(dt, intl, "dayperiod")
          );
        }

        return this.meridiemCache;
      }
    );
  }

  eras(length, defaultOK = true) {
    return listStuff(this, length, defaultOK, eras, () => {
      const intl = { era: length };

      // This is problematic. Different calendars are going to define eras totally differently. What I need is the minimum set of dates
      // to definitely enumerate them.
      if (!this.eraCache[length]) {
        this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map((dt) =>
          this.extract(dt, intl, "era")
        );
      }

      return this.eraCache[length];
    });
  }

  extract(dt, intlOpts, field) {
    const df = this.dtFormatter(dt, intlOpts),
      results = df.formatToParts(),
      matching = results.find((m) => m.type.toLowerCase() === field);
    return matching ? matching.value : null;
  }

  numberFormatter(opts = {}) {
    // this forcesimple option is never used (the only caller short-circuits on it, but it seems safer to leave)
    // (in contrast, the rest of the condition is used heavily)
    return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
  }

  dtFormatter(dt, intlOpts = {}) {
    return new PolyDateFormatter(dt, this.intl, intlOpts);
  }

  relFormatter(opts = {}) {
    return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
  }

  listFormatter(opts = {}) {
    return getCachedLF(this.intl, opts);
  }

  isEnglish() {
    return (
      this.locale === "en" ||
      this.locale.toLowerCase() === "en-us" ||
      new Intl.DateTimeFormat(this.intl).resolvedOptions().locale.startsWith("en-us")
    );
  }

  equals(other) {
    return (
      this.locale === other.locale &&
      this.numberingSystem === other.numberingSystem &&
      this.outputCalendar === other.outputCalendar
    );
  }
}

let singleton = null;

/**
 * A zone with a fixed offset (meaning no DST)
 * @implements {Zone}
 */
class FixedOffsetZone extends Zone {
  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    if (singleton === null) {
      singleton = new FixedOffsetZone(0);
    }
    return singleton;
  }

  /**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */
  static instance(offset) {
    return offset === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset);
  }

  /**
   * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
   * @param {string} s - The offset string to parse
   * @example FixedOffsetZone.parseSpecifier("UTC+6")
   * @example FixedOffsetZone.parseSpecifier("UTC+06")
   * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
   * @return {FixedOffsetZone}
   */
  static parseSpecifier(s) {
    if (s) {
      const r = s.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
      if (r) {
        return new FixedOffsetZone(signedOffset(r[1], r[2]));
      }
    }
    return null;
  }

  constructor(offset) {
    super();
    /** @private **/
    this.fixed = offset;
  }

  /** @override **/
  get type() {
    return "fixed";
  }

  /** @override **/
  get name() {
    return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
  }

  get ianaName() {
    if (this.fixed === 0) {
      return "Etc/UTC";
    } else {
      return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
    }
  }

  /** @override **/
  offsetName() {
    return this.name;
  }

  /** @override **/
  formatOffset(ts, format) {
    return formatOffset(this.fixed, format);
  }

  /** @override **/
  get isUniversal() {
    return true;
  }

  /** @override **/
  offset() {
    return this.fixed;
  }

  /** @override **/
  equals(otherZone) {
    return otherZone.type === "fixed" && otherZone.fixed === this.fixed;
  }

  /** @override **/
  get isValid() {
    return true;
  }
}

/**
 * A zone that failed to parse. You should never need to instantiate this.
 * @implements {Zone}
 */
class InvalidZone extends Zone {
  constructor(zoneName) {
    super();
    /**  @private */
    this.zoneName = zoneName;
  }

  /** @override **/
  get type() {
    return "invalid";
  }

  /** @override **/
  get name() {
    return this.zoneName;
  }

  /** @override **/
  get isUniversal() {
    return false;
  }

  /** @override **/
  offsetName() {
    return null;
  }

  /** @override **/
  formatOffset() {
    return "";
  }

  /** @override **/
  offset() {
    return NaN;
  }

  /** @override **/
  equals() {
    return false;
  }

  /** @override **/
  get isValid() {
    return false;
  }
}

/**
 * @private
 */


function normalizeZone(input, defaultZone) {
  if (isUndefined(input) || input === null) {
    return defaultZone;
  } else if (input instanceof Zone) {
    return input;
  } else if (isString(input)) {
    const lowered = input.toLowerCase();
    if (lowered === "default") return defaultZone;
    else if (lowered === "local" || lowered === "system") return SystemZone.instance;
    else if (lowered === "utc" || lowered === "gmt") return FixedOffsetZone.utcInstance;
    else return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
  } else if (isNumber(input)) {
    return FixedOffsetZone.instance(input);
  } else if (typeof input === "object" && input.offset && typeof input.offset === "number") {
    // This is dumb, but the instanceof check above doesn't seem to really work
    // so we're duck checking it
    return input;
  } else {
    return new InvalidZone(input);
  }
}

let now = () => Date.now(),
  defaultZone = "system",
  defaultLocale = null,
  defaultNumberingSystem = null,
  defaultOutputCalendar = null,
  twoDigitCutoffYear = 60,
  throwOnInvalid;

/**
 * Settings contains static getters and setters that control Luxon's overall behavior. Luxon is a simple library with few options, but the ones it does have live here.
 */
class Settings {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return now;
  }

  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(n) {
    now = n;
  }

  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */
  static set defaultZone(zone) {
    defaultZone = zone;
  }

  /**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */
  static get defaultZone() {
    return normalizeZone(defaultZone, SystemZone.instance);
  }

  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return defaultLocale;
  }

  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(locale) {
    defaultLocale = locale;
  }

  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return defaultNumberingSystem;
  }

  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(numberingSystem) {
    defaultNumberingSystem = numberingSystem;
  }

  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return defaultOutputCalendar;
  }

  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(outputCalendar) {
    defaultOutputCalendar = outputCalendar;
  }

  /**
   * Get the cutoff year after which a string encoding a year as two digits is interpreted to occur in the current century.
   * @type {number}
   */
  static get twoDigitCutoffYear() {
    return twoDigitCutoffYear;
  }

  /**
   * Set the cutoff year after which a string encoding a year as two digits is interpreted to occur in the current century.
   * @type {number}
   * @example Settings.twoDigitCutoffYear = 0 // cut-off year is 0, so all 'yy' are interpretted as current century
   * @example Settings.twoDigitCutoffYear = 50 // '49' -> 1949; '50' -> 2050
   * @example Settings.twoDigitCutoffYear = 1950 // interpretted as 50
   * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpretted as 50
   */
  static set twoDigitCutoffYear(cutoffYear) {
    twoDigitCutoffYear = cutoffYear % 100;
  }

  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return throwOnInvalid;
  }

  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(t) {
    throwOnInvalid = t;
  }

  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    Locale.resetCache();
    IANAZone.resetCache();
  }
}

/*
  This is just a junk drawer, containing anything used across multiple classes.
  Because Luxon is small(ish), this should stay small and we won't worry about splitting
  it up into, say, parsingUtil.js and basicUtil.js and so on. But they are divided up by feature area.
*/


/**
 * @private
 */

// TYPES

function isUndefined(o) {
  return typeof o === "undefined";
}

function isNumber(o) {
  return typeof o === "number";
}

function isInteger(o) {
  return typeof o === "number" && o % 1 === 0;
}

function isString(o) {
  return typeof o === "string";
}

function isDate(o) {
  return Object.prototype.toString.call(o) === "[object Date]";
}

// CAPABILITIES

function hasRelative() {
  try {
    return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
  } catch (e) {
    return false;
  }
}

// OBJECTS AND ARRAYS

function maybeArray(thing) {
  return Array.isArray(thing) ? thing : [thing];
}

function bestBy(arr, by, compare) {
  if (arr.length === 0) {
    return undefined;
  }
  return arr.reduce((best, next) => {
    const pair = [by(next), next];
    if (!best) {
      return pair;
    } else if (compare(best[0], pair[0]) === best[0]) {
      return best;
    } else {
      return pair;
    }
  }, null)[1];
}

function pick(obj, keys) {
  return keys.reduce((a, k) => {
    a[k] = obj[k];
    return a;
  }, {});
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// NUMBERS AND STRINGS

function integerBetween(thing, bottom, top) {
  return isInteger(thing) && thing >= bottom && thing <= top;
}

// x % n but takes the sign of n instead of x
function floorMod(x, n) {
  return x - n * Math.floor(x / n);
}

function padStart(input, n = 2) {
  const isNeg = input < 0;
  let padded;
  if (isNeg) {
    padded = "-" + ("" + -input).padStart(n, "0");
  } else {
    padded = ("" + input).padStart(n, "0");
  }
  return padded;
}

function parseInteger(string) {
  if (isUndefined(string) || string === null || string === "") {
    return undefined;
  } else {
    return parseInt(string, 10);
  }
}

function parseFloating(string) {
  if (isUndefined(string) || string === null || string === "") {
    return undefined;
  } else {
    return parseFloat(string);
  }
}

function parseMillis(fraction) {
  // Return undefined (instead of 0) in these cases, where fraction is not set
  if (isUndefined(fraction) || fraction === null || fraction === "") {
    return undefined;
  } else {
    const f = parseFloat("0." + fraction) * 1000;
    return Math.floor(f);
  }
}

function roundTo(number, digits, towardZero = false) {
  const factor = 10 ** digits,
    rounder = towardZero ? Math.trunc : Math.round;
  return rounder(number * factor) / factor;
}

// DATE BASICS

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

function daysInMonth(year, month) {
  const modMonth = floorMod(month - 1, 12) + 1,
    modYear = year + (month - modMonth) / 12;

  if (modMonth === 2) {
    return isLeapYear(modYear) ? 29 : 28;
  } else {
    return [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
  }
}

// covert a calendar object to a local timestamp (epoch, but with the offset baked in)
function objToLocalTS(obj) {
  let d = Date.UTC(
    obj.year,
    obj.month - 1,
    obj.day,
    obj.hour,
    obj.minute,
    obj.second,
    obj.millisecond
  );

  // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
  if (obj.year < 100 && obj.year >= 0) {
    d = new Date(d);
    // set the month and day again, this is necessary because year 2000 is a leap year, but year 100 is not
    // so if obj.year is in 99, but obj.day makes it roll over into year 100,
    // the calculations done by Date.UTC are using year 2000 - which is incorrect
    d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
  }
  return +d;
}

function weeksInWeekYear(weekYear) {
  const p1 =
      (weekYear +
        Math.floor(weekYear / 4) -
        Math.floor(weekYear / 100) +
        Math.floor(weekYear / 400)) %
      7,
    last = weekYear - 1,
    p2 = (last + Math.floor(last / 4) - Math.floor(last / 100) + Math.floor(last / 400)) % 7;
  return p1 === 4 || p2 === 3 ? 53 : 52;
}

function untruncateYear(year) {
  if (year > 99) {
    return year;
  } else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2000 + year;
}

// PARSING

function parseZoneInfo(ts, offsetFormat, locale, timeZone = null) {
  const date = new Date(ts),
    intlOpts = {
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    };

  if (timeZone) {
    intlOpts.timeZone = timeZone;
  }

  const modified = { timeZoneName: offsetFormat, ...intlOpts };

  const parsed = new Intl.DateTimeFormat(locale, modified)
    .formatToParts(date)
    .find((m) => m.type.toLowerCase() === "timezonename");
  return parsed ? parsed.value : null;
}

// signedOffset('-5', '30') -> -330
function signedOffset(offHourStr, offMinuteStr) {
  let offHour = parseInt(offHourStr, 10);

  // don't || this because we want to preserve -0
  if (Number.isNaN(offHour)) {
    offHour = 0;
  }

  const offMin = parseInt(offMinuteStr, 10) || 0,
    offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
  return offHour * 60 + offMinSigned;
}

// COERCION

function asNumber(value) {
  const numericValue = Number(value);
  if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue))
    throw new InvalidArgumentError(`Invalid unit value ${value}`);
  return numericValue;
}

function normalizeObject(obj, normalizer) {
  const normalized = {};
  for (const u in obj) {
    if (hasOwnProperty(obj, u)) {
      const v = obj[u];
      if (v === undefined || v === null) continue;
      normalized[normalizer(u)] = asNumber(v);
    }
  }
  return normalized;
}

function formatOffset(offset, format) {
  const hours = Math.trunc(Math.abs(offset / 60)),
    minutes = Math.trunc(Math.abs(offset % 60)),
    sign = offset >= 0 ? "+" : "-";

  switch (format) {
    case "short":
      return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
    case "narrow":
      return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
    case "techie":
      return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
    default:
      throw new RangeError(`Value format ${format} is out of range for property format`);
  }
}

function timeObject(obj) {
  return pick(obj, ["hour", "minute", "second", "millisecond"]);
}

/**
 * @private
 */

const monthsLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthsShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const monthsNarrow = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function months(length) {
  switch (length) {
    case "narrow":
      return [...monthsNarrow];
    case "short":
      return [...monthsShort];
    case "long":
      return [...monthsLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    case "2-digit":
      return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    default:
      return null;
  }
}

const weekdaysLong = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const weekdaysNarrow = ["M", "T", "W", "T", "F", "S", "S"];

function weekdays(length) {
  switch (length) {
    case "narrow":
      return [...weekdaysNarrow];
    case "short":
      return [...weekdaysShort];
    case "long":
      return [...weekdaysLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7"];
    default:
      return null;
  }
}

const meridiems = ["AM", "PM"];

const erasLong = ["Before Christ", "Anno Domini"];

const erasShort = ["BC", "AD"];

const erasNarrow = ["B", "A"];

function eras(length) {
  switch (length) {
    case "narrow":
      return [...erasNarrow];
    case "short":
      return [...erasShort];
    case "long":
      return [...erasLong];
    default:
      return null;
  }
}

function meridiemForDateTime(dt) {
  return meridiems[dt.hour < 12 ? 0 : 1];
}

function weekdayForDateTime(dt, length) {
  return weekdays(length)[dt.weekday - 1];
}

function monthForDateTime(dt, length) {
  return months(length)[dt.month - 1];
}

function eraForDateTime(dt, length) {
  return eras(length)[dt.year < 0 ? 0 : 1];
}

function formatRelativeTime(unit, count, numeric = "always", narrow = false) {
  const units = {
    years: ["year", "yr."],
    quarters: ["quarter", "qtr."],
    months: ["month", "mo."],
    weeks: ["week", "wk."],
    days: ["day", "day", "days"],
    hours: ["hour", "hr."],
    minutes: ["minute", "min."],
    seconds: ["second", "sec."],
  };

  const lastable = ["hours", "minutes", "seconds"].indexOf(unit) === -1;

  if (numeric === "auto" && lastable) {
    const isDay = unit === "days";
    switch (count) {
      case 1:
        return isDay ? "tomorrow" : `next ${units[unit][0]}`;
      case -1:
        return isDay ? "yesterday" : `last ${units[unit][0]}`;
      case 0:
        return isDay ? "today" : `this ${units[unit][0]}`;
    }
  }

  const isInPast = Object.is(count, -0) || count < 0,
    fmtValue = Math.abs(count),
    singular = fmtValue === 1,
    lilUnits = units[unit],
    fmtUnit = narrow
      ? singular
        ? lilUnits[1]
        : lilUnits[2] || lilUnits[1]
      : singular
      ? units[unit][0]
      : unit;
  return isInPast ? `${fmtValue} ${fmtUnit} ago` : `in ${fmtValue} ${fmtUnit}`;
}

function stringifyTokens(splits, tokenToString) {
  let s = "";
  for (const token of splits) {
    if (token.literal) {
      s += token.val;
    } else {
      s += tokenToString(token.val);
    }
  }
  return s;
}

const macroTokenToFormatOpts = {
  D: DATE_SHORT,
  DD: DATE_MED,
  DDD: DATE_FULL,
  DDDD: DATE_HUGE,
  t: TIME_SIMPLE,
  tt: TIME_WITH_SECONDS,
  ttt: TIME_WITH_SHORT_OFFSET,
  tttt: TIME_WITH_LONG_OFFSET,
  T: TIME_24_SIMPLE,
  TT: TIME_24_WITH_SECONDS,
  TTT: TIME_24_WITH_SHORT_OFFSET,
  TTTT: TIME_24_WITH_LONG_OFFSET,
  f: DATETIME_SHORT,
  ff: DATETIME_MED,
  fff: DATETIME_FULL,
  ffff: DATETIME_HUGE,
  F: DATETIME_SHORT_WITH_SECONDS,
  FF: DATETIME_MED_WITH_SECONDS,
  FFF: DATETIME_FULL_WITH_SECONDS,
  FFFF: DATETIME_HUGE_WITH_SECONDS,
};

/**
 * @private
 */

class Formatter {
  static create(locale, opts = {}) {
    return new Formatter(locale, opts);
  }

  static parseFormat(fmt) {
    // white-space is always considered a literal in user-provided formats
    // the " " token has a special meaning (see unitForToken)

    let current = null,
      currentFull = "",
      bracketed = false;
    const splits = [];
    for (let i = 0; i < fmt.length; i++) {
      const c = fmt.charAt(i);
      if (c === "'") {
        if (currentFull.length > 0) {
          splits.push({ literal: bracketed || /^\s+$/.test(currentFull), val: currentFull });
        }
        current = null;
        currentFull = "";
        bracketed = !bracketed;
      } else if (bracketed) {
        currentFull += c;
      } else if (c === current) {
        currentFull += c;
      } else {
        if (currentFull.length > 0) {
          splits.push({ literal: /^\s+$/.test(currentFull), val: currentFull });
        }
        currentFull = c;
        current = c;
      }
    }

    if (currentFull.length > 0) {
      splits.push({ literal: bracketed || /^\s+$/.test(currentFull), val: currentFull });
    }

    return splits;
  }

  static macroTokenToFormatOpts(token) {
    return macroTokenToFormatOpts[token];
  }

  constructor(locale, formatOpts) {
    this.opts = formatOpts;
    this.loc = locale;
    this.systemLoc = null;
  }

  formatWithSystemDefault(dt, opts) {
    if (this.systemLoc === null) {
      this.systemLoc = this.loc.redefaultToSystem();
    }
    const df = this.systemLoc.dtFormatter(dt, { ...this.opts, ...opts });
    return df.format();
  }

  formatDateTime(dt, opts = {}) {
    const df = this.loc.dtFormatter(dt, { ...this.opts, ...opts });
    return df.format();
  }

  formatDateTimeParts(dt, opts = {}) {
    const df = this.loc.dtFormatter(dt, { ...this.opts, ...opts });
    return df.formatToParts();
  }

  formatInterval(interval, opts = {}) {
    const df = this.loc.dtFormatter(interval.start, { ...this.opts, ...opts });
    return df.dtf.formatRange(interval.start.toJSDate(), interval.end.toJSDate());
  }

  resolvedOptions(dt, opts = {}) {
    const df = this.loc.dtFormatter(dt, { ...this.opts, ...opts });
    return df.resolvedOptions();
  }

  num(n, p = 0) {
    // we get some perf out of doing this here, annoyingly
    if (this.opts.forceSimple) {
      return padStart(n, p);
    }

    const opts = { ...this.opts };

    if (p > 0) {
      opts.padTo = p;
    }

    return this.loc.numberFormatter(opts).format(n);
  }

  formatDateTimeFromString(dt, fmt) {
    const knownEnglish = this.loc.listingMode() === "en",
      useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory",
      string = (opts, extract) => this.loc.extract(dt, opts, extract),
      formatOffset = (opts) => {
        if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) {
          return "Z";
        }

        return dt.isValid ? dt.zone.formatOffset(dt.ts, opts.format) : "";
      },
      meridiem = () =>
        knownEnglish
          ? meridiemForDateTime(dt)
          : string({ hour: "numeric", hourCycle: "h12" }, "dayperiod"),
      month = (length, standalone) =>
        knownEnglish
          ? monthForDateTime(dt, length)
          : string(standalone ? { month: length } : { month: length, day: "numeric" }, "month"),
      weekday = (length, standalone) =>
        knownEnglish
          ? weekdayForDateTime(dt, length)
          : string(
              standalone ? { weekday: length } : { weekday: length, month: "long", day: "numeric" },
              "weekday"
            ),
      maybeMacro = (token) => {
        const formatOpts = Formatter.macroTokenToFormatOpts(token);
        if (formatOpts) {
          return this.formatWithSystemDefault(dt, formatOpts);
        } else {
          return token;
        }
      },
      era = (length) =>
        knownEnglish ? eraForDateTime(dt, length) : string({ era: length }, "era"),
      tokenToString = (token) => {
        // Where possible: http://cldr.unicode.org/translation/date-time-1/date-time#TOC-Standalone-vs.-Format-Styles
        switch (token) {
          // ms
          case "S":
            return this.num(dt.millisecond);
          case "u":
          // falls through
          case "SSS":
            return this.num(dt.millisecond, 3);
          // seconds
          case "s":
            return this.num(dt.second);
          case "ss":
            return this.num(dt.second, 2);
          // fractional seconds
          case "uu":
            return this.num(Math.floor(dt.millisecond / 10), 2);
          case "uuu":
            return this.num(Math.floor(dt.millisecond / 100));
          // minutes
          case "m":
            return this.num(dt.minute);
          case "mm":
            return this.num(dt.minute, 2);
          // hours
          case "h":
            return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
          case "hh":
            return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
          case "H":
            return this.num(dt.hour);
          case "HH":
            return this.num(dt.hour, 2);
          // offset
          case "Z":
            // like +6
            return formatOffset({ format: "narrow", allowZ: this.opts.allowZ });
          case "ZZ":
            // like +06:00
            return formatOffset({ format: "short", allowZ: this.opts.allowZ });
          case "ZZZ":
            // like +0600
            return formatOffset({ format: "techie", allowZ: this.opts.allowZ });
          case "ZZZZ":
            // like EST
            return dt.zone.offsetName(dt.ts, { format: "short", locale: this.loc.locale });
          case "ZZZZZ":
            // like Eastern Standard Time
            return dt.zone.offsetName(dt.ts, { format: "long", locale: this.loc.locale });
          // zone
          case "z":
            // like America/New_York
            return dt.zoneName;
          // meridiems
          case "a":
            return meridiem();
          // dates
          case "d":
            return useDateTimeFormatter ? string({ day: "numeric" }, "day") : this.num(dt.day);
          case "dd":
            return useDateTimeFormatter ? string({ day: "2-digit" }, "day") : this.num(dt.day, 2);
          // weekdays - standalone
          case "c":
            // like 1
            return this.num(dt.weekday);
          case "ccc":
            // like 'Tues'
            return weekday("short", true);
          case "cccc":
            // like 'Tuesday'
            return weekday("long", true);
          case "ccccc":
            // like 'T'
            return weekday("narrow", true);
          // weekdays - format
          case "E":
            // like 1
            return this.num(dt.weekday);
          case "EEE":
            // like 'Tues'
            return weekday("short", false);
          case "EEEE":
            // like 'Tuesday'
            return weekday("long", false);
          case "EEEEE":
            // like 'T'
            return weekday("narrow", false);
          // months - standalone
          case "L":
            // like 1
            return useDateTimeFormatter
              ? string({ month: "numeric", day: "numeric" }, "month")
              : this.num(dt.month);
          case "LL":
            // like 01, doesn't seem to work
            return useDateTimeFormatter
              ? string({ month: "2-digit", day: "numeric" }, "month")
              : this.num(dt.month, 2);
          case "LLL":
            // like Jan
            return month("short", true);
          case "LLLL":
            // like January
            return month("long", true);
          case "LLLLL":
            // like J
            return month("narrow", true);
          // months - format
          case "M":
            // like 1
            return useDateTimeFormatter
              ? string({ month: "numeric" }, "month")
              : this.num(dt.month);
          case "MM":
            // like 01
            return useDateTimeFormatter
              ? string({ month: "2-digit" }, "month")
              : this.num(dt.month, 2);
          case "MMM":
            // like Jan
            return month("short", false);
          case "MMMM":
            // like January
            return month("long", false);
          case "MMMMM":
            // like J
            return month("narrow", false);
          // years
          case "y":
            // like 2014
            return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year);
          case "yy":
            // like 14
            return useDateTimeFormatter
              ? string({ year: "2-digit" }, "year")
              : this.num(dt.year.toString().slice(-2), 2);
          case "yyyy":
            // like 0012
            return useDateTimeFormatter
              ? string({ year: "numeric" }, "year")
              : this.num(dt.year, 4);
          case "yyyyyy":
            // like 000012
            return useDateTimeFormatter
              ? string({ year: "numeric" }, "year")
              : this.num(dt.year, 6);
          // eras
          case "G":
            // like AD
            return era("short");
          case "GG":
            // like Anno Domini
            return era("long");
          case "GGGGG":
            return era("narrow");
          case "kk":
            return this.num(dt.weekYear.toString().slice(-2), 2);
          case "kkkk":
            return this.num(dt.weekYear, 4);
          case "W":
            return this.num(dt.weekNumber);
          case "WW":
            return this.num(dt.weekNumber, 2);
          case "o":
            return this.num(dt.ordinal);
          case "ooo":
            return this.num(dt.ordinal, 3);
          case "q":
            // like 1
            return this.num(dt.quarter);
          case "qq":
            // like 01
            return this.num(dt.quarter, 2);
          case "X":
            return this.num(Math.floor(dt.ts / 1000));
          case "x":
            return this.num(dt.ts);
          default:
            return maybeMacro(token);
        }
      };

    return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
  }

  formatDurationFromString(dur, fmt) {
    const tokenToField = (token) => {
        switch (token[0]) {
          case "S":
            return "millisecond";
          case "s":
            return "second";
          case "m":
            return "minute";
          case "h":
            return "hour";
          case "d":
            return "day";
          case "w":
            return "week";
          case "M":
            return "month";
          case "y":
            return "year";
          default:
            return null;
        }
      },
      tokenToString = (lildur) => (token) => {
        const mapped = tokenToField(token);
        if (mapped) {
          return this.num(lildur.get(mapped), token.length);
        } else {
          return token;
        }
      },
      tokens = Formatter.parseFormat(fmt),
      realTokens = tokens.reduce(
        (found, { literal, val }) => (literal ? found : found.concat(val)),
        []
      ),
      collapsed = dur.shiftTo(...realTokens.map(tokenToField).filter((t) => t));
    return stringifyTokens(tokens, tokenToString(collapsed));
  }
}

class Invalid {
  constructor(reason, explanation) {
    this.reason = reason;
    this.explanation = explanation;
  }

  toMessage() {
    if (this.explanation) {
      return `${this.reason}: ${this.explanation}`;
    } else {
      return this.reason;
    }
  }
}

/*
 * This file handles parsing for well-specified formats. Here's how it works:
 * Two things go into parsing: a regex to match with and an extractor to take apart the groups in the match.
 * An extractor is just a function that takes a regex match array and returns a { year: ..., month: ... } object
 * parse() does the work of executing the regex and applying the extractor. It takes multiple regex/extractor pairs to try in sequence.
 * Extractors can take a "cursor" representing the offset in the match to look at. This makes it easy to combine extractors.
 * combineExtractors() does the work of combining them, keeping track of the cursor through multiple extractions.
 * Some extractions are super dumb and simpleParse and fromStrings help DRY them.
 */

const ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;

function combineRegexes(...regexes) {
  const full = regexes.reduce((f, r) => f + r.source, "");
  return RegExp(`^${full}$`);
}

function combineExtractors(...extractors) {
  return (m) =>
    extractors
      .reduce(
        ([mergedVals, mergedZone, cursor], ex) => {
          const [val, zone, next] = ex(m, cursor);
          return [{ ...mergedVals, ...val }, zone || mergedZone, next];
        },
        [{}, null, 1]
      )
      .slice(0, 2);
}

function parse$1(s, ...patterns) {
  if (s == null) {
    return [null, null];
  }

  for (const [regex, extractor] of patterns) {
    const m = regex.exec(s);
    if (m) {
      return extractor(m);
    }
  }
  return [null, null];
}

function simpleParse(...keys) {
  return (match, cursor) => {
    const ret = {};
    let i;

    for (i = 0; i < keys.length; i++) {
      ret[keys[i]] = parseInteger(match[cursor + i]);
    }
    return [ret, null, cursor + i];
  };
}

// ISO and SQL parsing
const offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;
const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
const isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`);
const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
const extractISOOrdinalData = simpleParse("year", "ordinal");
const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/; // dumbed-down version of the ISO one
const sqlTimeRegex = RegExp(
  `${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`
);
const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);

function int(match, pos, fallback) {
  const m = match[pos];
  return isUndefined(m) ? fallback : parseInteger(m);
}

function extractISOYmd(match, cursor) {
  const item = {
    year: int(match, cursor),
    month: int(match, cursor + 1, 1),
    day: int(match, cursor + 2, 1),
  };

  return [item, null, cursor + 3];
}

function extractISOTime(match, cursor) {
  const item = {
    hours: int(match, cursor, 0),
    minutes: int(match, cursor + 1, 0),
    seconds: int(match, cursor + 2, 0),
    milliseconds: parseMillis(match[cursor + 3]),
  };

  return [item, null, cursor + 4];
}

function extractISOOffset(match, cursor) {
  const local = !match[cursor] && !match[cursor + 1],
    fullOffset = signedOffset(match[cursor + 1], match[cursor + 2]),
    zone = local ? null : FixedOffsetZone.instance(fullOffset);
  return [{}, zone, cursor + 3];
}

function extractIANAZone(match, cursor) {
  const zone = match[cursor] ? IANAZone.create(match[cursor]) : null;
  return [{}, zone, cursor + 1];
}

// ISO time parsing

const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);

// ISO duration parsing

const isoDuration =
  /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;

function extractISODuration(match) {
  const [s, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] =
    match;

  const hasNegativePrefix = s[0] === "-";
  const negativeSeconds = secondStr && secondStr[0] === "-";

  const maybeNegate = (num, force = false) =>
    num !== undefined && (force || (num && hasNegativePrefix)) ? -num : num;

  return [
    {
      years: maybeNegate(parseFloating(yearStr)),
      months: maybeNegate(parseFloating(monthStr)),
      weeks: maybeNegate(parseFloating(weekStr)),
      days: maybeNegate(parseFloating(dayStr)),
      hours: maybeNegate(parseFloating(hourStr)),
      minutes: maybeNegate(parseFloating(minuteStr)),
      seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
      milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds),
    },
  ];
}

// These are a little braindead. EDT *should* tell us that we're in, say, America/New_York
// and not just that we're in -240 *right now*. But since I don't think these are used that often
// I'm just going to ignore that
const obsOffsets = {
  GMT: 0,
  EDT: -4 * 60,
  EST: -5 * 60,
  CDT: -5 * 60,
  CST: -6 * 60,
  MDT: -6 * 60,
  MST: -7 * 60,
  PDT: -7 * 60,
  PST: -8 * 60,
};

function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
  const result = {
    year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
    month: monthsShort.indexOf(monthStr) + 1,
    day: parseInteger(dayStr),
    hour: parseInteger(hourStr),
    minute: parseInteger(minuteStr),
  };

  if (secondStr) result.second = parseInteger(secondStr);
  if (weekdayStr) {
    result.weekday =
      weekdayStr.length > 3
        ? weekdaysLong.indexOf(weekdayStr) + 1
        : weekdaysShort.indexOf(weekdayStr) + 1;
  }

  return result;
}

// RFC 2822/5322
const rfc2822 =
  /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;

function extractRFC2822(match) {
  const [
      ,
      weekdayStr,
      dayStr,
      monthStr,
      yearStr,
      hourStr,
      minuteStr,
      secondStr,
      obsOffset,
      milOffset,
      offHourStr,
      offMinuteStr,
    ] = match,
    result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);

  let offset;
  if (obsOffset) {
    offset = obsOffsets[obsOffset];
  } else if (milOffset) {
    offset = 0;
  } else {
    offset = signedOffset(offHourStr, offMinuteStr);
  }

  return [result, new FixedOffsetZone(offset)];
}

function preprocessRFC2822(s) {
  // Remove comments and folding whitespace and replace multiple-spaces with a single space
  return s
    .replace(/\([^()]*\)|[\n\t]/g, " ")
    .replace(/(\s\s+)/g, " ")
    .trim();
}

// http date

const rfc1123 =
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,
  rfc850 =
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,
  ascii =
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;

function extractRFC1123Or850(match) {
  const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match,
    result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}

function extractASCII(match) {
  const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match,
    result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}

const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);

const extractISOYmdTimeAndOffset = combineExtractors(
  extractISOYmd,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOWeekTimeAndOffset = combineExtractors(
  extractISOWeekData,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOOrdinalDateAndTime = combineExtractors(
  extractISOOrdinalData,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOTimeAndOffset = combineExtractors(
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);

/*
 * @private
 */

function parseISODate(s) {
  return parse$1(
    s,
    [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
    [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset],
    [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime],
    [isoTimeCombinedRegex, extractISOTimeAndOffset]
  );
}

function parseRFC2822Date(s) {
  return parse$1(preprocessRFC2822(s), [rfc2822, extractRFC2822]);
}

function parseHTTPDate(s) {
  return parse$1(
    s,
    [rfc1123, extractRFC1123Or850],
    [rfc850, extractRFC1123Or850],
    [ascii, extractASCII]
  );
}

function parseISODuration(s) {
  return parse$1(s, [isoDuration, extractISODuration]);
}

const extractISOTimeOnly = combineExtractors(extractISOTime);

function parseISOTimeOnly(s) {
  return parse$1(s, [isoTimeOnly, extractISOTimeOnly]);
}

const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);

const extractISOTimeOffsetAndIANAZone = combineExtractors(
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);

function parseSQL(s) {
  return parse$1(
    s,
    [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
    [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]
  );
}

const INVALID$3 = "Invalid Duration";

// unit conversion constants
const lowOrderMatrix = {
    weeks: {
      days: 7,
      hours: 7 * 24,
      minutes: 7 * 24 * 60,
      seconds: 7 * 24 * 60 * 60,
      milliseconds: 7 * 24 * 60 * 60 * 1000,
    },
    days: {
      hours: 24,
      minutes: 24 * 60,
      seconds: 24 * 60 * 60,
      milliseconds: 24 * 60 * 60 * 1000,
    },
    hours: { minutes: 60, seconds: 60 * 60, milliseconds: 60 * 60 * 1000 },
    minutes: { seconds: 60, milliseconds: 60 * 1000 },
    seconds: { milliseconds: 1000 },
  },
  casualMatrix = {
    years: {
      quarters: 4,
      months: 12,
      weeks: 52,
      days: 365,
      hours: 365 * 24,
      minutes: 365 * 24 * 60,
      seconds: 365 * 24 * 60 * 60,
      milliseconds: 365 * 24 * 60 * 60 * 1000,
    },
    quarters: {
      months: 3,
      weeks: 13,
      days: 91,
      hours: 91 * 24,
      minutes: 91 * 24 * 60,
      seconds: 91 * 24 * 60 * 60,
      milliseconds: 91 * 24 * 60 * 60 * 1000,
    },
    months: {
      weeks: 4,
      days: 30,
      hours: 30 * 24,
      minutes: 30 * 24 * 60,
      seconds: 30 * 24 * 60 * 60,
      milliseconds: 30 * 24 * 60 * 60 * 1000,
    },

    ...lowOrderMatrix,
  },
  daysInYearAccurate = 146097.0 / 400,
  daysInMonthAccurate = 146097.0 / 4800,
  accurateMatrix = {
    years: {
      quarters: 4,
      months: 12,
      weeks: daysInYearAccurate / 7,
      days: daysInYearAccurate,
      hours: daysInYearAccurate * 24,
      minutes: daysInYearAccurate * 24 * 60,
      seconds: daysInYearAccurate * 24 * 60 * 60,
      milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1000,
    },
    quarters: {
      months: 3,
      weeks: daysInYearAccurate / 28,
      days: daysInYearAccurate / 4,
      hours: (daysInYearAccurate * 24) / 4,
      minutes: (daysInYearAccurate * 24 * 60) / 4,
      seconds: (daysInYearAccurate * 24 * 60 * 60) / 4,
      milliseconds: (daysInYearAccurate * 24 * 60 * 60 * 1000) / 4,
    },
    months: {
      weeks: daysInMonthAccurate / 7,
      days: daysInMonthAccurate,
      hours: daysInMonthAccurate * 24,
      minutes: daysInMonthAccurate * 24 * 60,
      seconds: daysInMonthAccurate * 24 * 60 * 60,
      milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1000,
    },
    ...lowOrderMatrix,
  };

// units ordered by size
const orderedUnits$1 = [
  "years",
  "quarters",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
];

const reverseUnits = orderedUnits$1.slice(0).reverse();

// clone really means "create another instance just like this one, but with these changes"
function clone$1(dur, alts, clear = false) {
  // deep merge for vals
  const conf = {
    values: clear ? alts.values : { ...dur.values, ...(alts.values || {}) },
    loc: dur.loc.clone(alts.loc),
    conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
    matrix: alts.matrix || dur.matrix,
  };
  return new Duration(conf);
}

function antiTrunc(n) {
  return n < 0 ? Math.floor(n) : Math.ceil(n);
}

// NB: mutates parameters
function convert(matrix, fromMap, fromUnit, toMap, toUnit) {
  const conv = matrix[toUnit][fromUnit],
    raw = fromMap[fromUnit] / conv,
    sameSign = Math.sign(raw) === Math.sign(toMap[toUnit]),
    // ok, so this is wild, but see the matrix in the tests
    added =
      !sameSign && toMap[toUnit] !== 0 && Math.abs(raw) <= 1 ? antiTrunc(raw) : Math.trunc(raw);
  toMap[toUnit] += added;
  fromMap[fromUnit] -= added * conv;
}

// NB: mutates parameters
function normalizeValues(matrix, vals) {
  reverseUnits.reduce((previous, current) => {
    if (!isUndefined(vals[current])) {
      if (previous) {
        convert(matrix, vals, previous, vals, current);
      }
      return current;
    } else {
      return previous;
    }
  }, null);
}

// Remove all properties with a value of 0 from an object
function removeZeroes(vals) {
  const newVals = {};
  for (const [key, value] of Object.entries(vals)) {
    if (value !== 0) {
      newVals[key] = value;
    }
  }
  return newVals;
}

/**
 * A Duration object represents a period of time, like "2 months" or "1 day, 1 hour". Conceptually, it's just a map of units to their quantities, accompanied by some additional configuration and methods for creating, parsing, interrogating, transforming, and formatting them. They can be used on their own or in conjunction with other Luxon types; for example, you can use {@link DateTime#plus} to add a Duration object to a DateTime, producing another DateTime.
 *
 * Here is a brief overview of commonly used methods and getters in Duration:
 *
 * * **Creation** To create a Duration, use {@link Duration.fromMillis}, {@link Duration.fromObject}, or {@link Duration.fromISO}.
 * * **Unit values** See the {@link Duration#years}, {@link Duration#months}, {@link Duration#weeks}, {@link Duration#days}, {@link Duration#hours}, {@link Duration#minutes}, {@link Duration#seconds}, {@link Duration#milliseconds} accessors.
 * * **Configuration** See  {@link Duration#locale} and {@link Duration#numberingSystem} accessors.
 * * **Transformation** To create new Durations out of old ones use {@link Duration#plus}, {@link Duration#minus}, {@link Duration#normalize}, {@link Duration#set}, {@link Duration#reconfigure}, {@link Duration#shiftTo}, and {@link Duration#negate}.
 * * **Output** To convert the Duration into other representations, see {@link Duration#as}, {@link Duration#toISO}, {@link Duration#toFormat}, and {@link Duration#toJSON}
 *
 * There's are more methods documented below. In addition, for more information on subtler topics like internationalization and validity, see the external documentation.
 */
class Duration {
  /**
   * @private
   */
  constructor(config) {
    const accurate = config.conversionAccuracy === "longterm" || false;
    let matrix = accurate ? accurateMatrix : casualMatrix;

    if (config.matrix) {
      matrix = config.matrix;
    }

    /**
     * @access private
     */
    this.values = config.values;
    /**
     * @access private
     */
    this.loc = config.loc || Locale.create();
    /**
     * @access private
     */
    this.conversionAccuracy = accurate ? "longterm" : "casual";
    /**
     * @access private
     */
    this.invalid = config.invalid || null;
    /**
     * @access private
     */
    this.matrix = matrix;
    /**
     * @access private
     */
    this.isLuxonDuration = true;
  }

  /**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  static fromMillis(count, opts) {
    return Duration.fromObject({ milliseconds: count }, opts);
  }

  /**
   * Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
   * If this object is empty then a zero milliseconds duration is returned.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.years
   * @param {number} obj.quarters
   * @param {number} obj.months
   * @param {number} obj.weeks
   * @param {number} obj.days
   * @param {number} obj.hours
   * @param {number} obj.minutes
   * @param {number} obj.seconds
   * @param {number} obj.milliseconds
   * @param {Object} [opts=[]] - options for creating this Duration
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the custom conversion system to use
   * @return {Duration}
   */
  static fromObject(obj, opts = {}) {
    if (obj == null || typeof obj !== "object") {
      throw new InvalidArgumentError(
        `Duration.fromObject: argument expected to be an object, got ${
          obj === null ? "null" : typeof obj
        }`
      );
    }

    return new Duration({
      values: normalizeObject(obj, Duration.normalizeUnit),
      loc: Locale.fromObject(opts),
      conversionAccuracy: opts.conversionAccuracy,
      matrix: opts.matrix,
    });
  }

  /**
   * Create a Duration from DurationLike.
   *
   * @param {Object | number | Duration} durationLike
   * One of:
   * - object with keys like 'years' and 'hours'.
   * - number representing milliseconds
   * - Duration instance
   * @return {Duration}
   */
  static fromDurationLike(durationLike) {
    if (isNumber(durationLike)) {
      return Duration.fromMillis(durationLike);
    } else if (Duration.isDuration(durationLike)) {
      return durationLike;
    } else if (typeof durationLike === "object") {
      return Duration.fromObject(durationLike);
    } else {
      throw new InvalidArgumentError(
        `Unknown duration argument ${durationLike} of type ${typeof durationLike}`
      );
    }
  }

  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the preset conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */
  static fromISO(text, opts) {
    const [parsed] = parseISODuration(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }

  /**
   * Create a Duration from an ISO 8601 time string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
   * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @return {Duration}
   */
  static fromISOTime(text, opts) {
    const [parsed] = parseISOTimeOnly(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }

  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
    }

    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);

    if (Settings.throwOnInvalid) {
      throw new InvalidDurationError(invalid);
    } else {
      return new Duration({ invalid });
    }
  }

  /**
   * @private
   */
  static normalizeUnit(unit) {
    const normalized = {
      year: "years",
      years: "years",
      quarter: "quarters",
      quarters: "quarters",
      month: "months",
      months: "months",
      week: "weeks",
      weeks: "weeks",
      day: "days",
      days: "days",
      hour: "hours",
      hours: "hours",
      minute: "minutes",
      minutes: "minutes",
      second: "seconds",
      seconds: "seconds",
      millisecond: "milliseconds",
      milliseconds: "milliseconds",
    }[unit ? unit.toLowerCase() : unit];

    if (!normalized) throw new InvalidUnitError(unit);

    return normalized;
  }

  /**
   * Check if an object is a Duration. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDuration(o) {
    return (o && o.isLuxonDuration) || false;
  }

  /**
   * Get  the locale of a Duration, such 'en-GB'
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }

  /**
   * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }

  /**
   * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
   * * `S` for milliseconds
   * * `s` for seconds
   * * `m` for minutes
   * * `h` for hours
   * * `d` for days
   * * `w` for weeks
   * * `M` for months
   * * `y` for years
   * Notes:
   * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
   * * Tokens can be escaped by wrapping with single quotes.
   * * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} [opts.floor=true] - floor numerical values
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    // reverse-compat since 1.2; we always round down now, never up, and we do it by default
    const fmtOpts = {
      ...opts,
      floor: opts.round !== false && opts.floor !== false,
    };
    return this.isValid
      ? Formatter.create(this.loc, fmtOpts).formatDurationFromString(this, fmt)
      : INVALID$3;
  }

  /**
   * Returns a string representation of a Duration with all units included.
   * To modify its behavior use the `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
   * @param opts - On option object to override the formatting. Accepts the same keys as the options parameter of the native `Int.NumberFormat` constructor, as well as `listStyle`.
   * @example
   * ```js
   * var dur = Duration.fromObject({ days: 1, hours: 5, minutes: 6 })
   * dur.toHuman() //=> '1 day, 5 hours, 6 minutes'
   * dur.toHuman({ listStyle: "long" }) //=> '1 day, 5 hours, and 6 minutes'
   * dur.toHuman({ unitDisplay: "short" }) //=> '1 day, 5 hr, 6 min'
   * ```
   */
  toHuman(opts = {}) {
    const l = orderedUnits$1
      .map((unit) => {
        const val = this.values[unit];
        if (isUndefined(val)) {
          return null;
        }
        return this.loc
          .numberFormatter({ style: "unit", unitDisplay: "long", ...opts, unit: unit.slice(0, -1) })
          .format(val);
      })
      .filter((n) => n);

    return this.loc
      .listFormatter({ type: "conjunction", style: opts.listStyle || "narrow", ...opts })
      .format(l);
  }

  /**
   * Returns a JavaScript object with this Duration's values.
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */
  toObject() {
    if (!this.isValid) return {};
    return { ...this.values };
  }

  /**
   * Returns an ISO 8601-compliant string representation of this Duration.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
   * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
   * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
   * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
   * @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
   * @return {string}
   */
  toISO() {
    // we could use the formatter, but this is an easier way to get the minimum string
    if (!this.isValid) return null;

    let s = "P";
    if (this.years !== 0) s += this.years + "Y";
    if (this.months !== 0 || this.quarters !== 0) s += this.months + this.quarters * 3 + "M";
    if (this.weeks !== 0) s += this.weeks + "W";
    if (this.days !== 0) s += this.days + "D";
    if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0)
      s += "T";
    if (this.hours !== 0) s += this.hours + "H";
    if (this.minutes !== 0) s += this.minutes + "M";
    if (this.seconds !== 0 || this.milliseconds !== 0)
      // this will handle "floating point madness" by removing extra decimal places
      // https://stackoverflow.com/questions/588004/is-floating-point-math-broken
      s += roundTo(this.seconds + this.milliseconds / 1000, 3) + "S";
    if (s === "P") s += "T0S";
    return s;
  }

  /**
   * Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
   * Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
   * @return {string}
   */
  toISOTime(opts = {}) {
    if (!this.isValid) return null;

    const millis = this.toMillis();
    if (millis < 0 || millis >= 86400000) return null;

    opts = {
      suppressMilliseconds: false,
      suppressSeconds: false,
      includePrefix: false,
      format: "extended",
      ...opts,
    };

    const value = this.shiftTo("hours", "minutes", "seconds", "milliseconds");

    let fmt = opts.format === "basic" ? "hhmm" : "hh:mm";

    if (!opts.suppressSeconds || value.seconds !== 0 || value.milliseconds !== 0) {
      fmt += opts.format === "basic" ? "ss" : ":ss";
      if (!opts.suppressMilliseconds || value.milliseconds !== 0) {
        fmt += ".SSS";
      }
    }

    let str = value.toFormat(fmt);

    if (opts.includePrefix) {
      str = "T" + str;
    }

    return str;
  }

  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }

  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */
  toString() {
    return this.toISO();
  }

  /**
   * Returns an milliseconds value of this Duration.
   * @return {number}
   */
  toMillis() {
    return this.as("milliseconds");
  }

  /**
   * Returns an milliseconds value of this Duration. Alias of {@link toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }

  /**
   * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  plus(duration) {
    if (!this.isValid) return this;

    const dur = Duration.fromDurationLike(duration),
      result = {};

    for (const k of orderedUnits$1) {
      if (hasOwnProperty(dur.values, k) || hasOwnProperty(this.values, k)) {
        result[k] = dur.get(k) + this.get(k);
      }
    }

    return clone$1(this, { values: result }, true);
  }

  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  minus(duration) {
    if (!this.isValid) return this;

    const dur = Duration.fromDurationLike(duration);
    return this.plus(dur.negate());
  }

  /**
   * Scale this Duration by the specified amount. Return a newly-constructed Duration.
   * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
   * @return {Duration}
   */
  mapUnits(fn) {
    if (!this.isValid) return this;
    const result = {};
    for (const k of Object.keys(this.values)) {
      result[k] = asNumber(fn(this.values[k], k));
    }
    return clone$1(this, { values: result }, true);
  }

  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
   * @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
   * @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
   * @return {number}
   */
  get(unit) {
    return this[Duration.normalizeUnit(unit)];
  }

  /**
   * "Set" the values of specified units. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */
  set(values) {
    if (!this.isValid) return this;

    const mixed = { ...this.values, ...normalizeObject(values, Duration.normalizeUnit) };
    return clone$1(this, { values: mixed });
  }

  /**
   * "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */
  reconfigure({ locale, numberingSystem, conversionAccuracy, matrix } = {}) {
    const loc = this.loc.clone({ locale, numberingSystem });
    const opts = { loc, matrix, conversionAccuracy };
    return clone$1(this, opts);
  }

  /**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */
  as(unit) {
    return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
  }

  /**
   * Reduce this Duration to its canonical representation in its current units.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @return {Duration}
   */
  normalize() {
    if (!this.isValid) return this;
    const vals = this.toObject();
    normalizeValues(this.matrix, vals);
    return clone$1(this, { values: vals }, true);
  }

  /**
   * Rescale units to its largest representation
   * @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
   * @return {Duration}
   */
  rescale() {
    if (!this.isValid) return this;
    const vals = removeZeroes(this.normalize().shiftToAll().toObject());
    return clone$1(this, { values: vals }, true);
  }

  /**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */
  shiftTo(...units) {
    if (!this.isValid) return this;

    if (units.length === 0) {
      return this;
    }

    units = units.map((u) => Duration.normalizeUnit(u));

    const built = {},
      accumulated = {},
      vals = this.toObject();
    let lastUnit;

    for (const k of orderedUnits$1) {
      if (units.indexOf(k) >= 0) {
        lastUnit = k;

        let own = 0;

        // anything we haven't boiled down yet should get boiled to this unit
        for (const ak in accumulated) {
          own += this.matrix[ak][k] * accumulated[ak];
          accumulated[ak] = 0;
        }

        // plus anything that's already in this unit
        if (isNumber(vals[k])) {
          own += vals[k];
        }

        const i = Math.trunc(own);
        built[k] = i;
        accumulated[k] = (own * 1000 - i * 1000) / 1000;

        // plus anything further down the chain that should be rolled up in to this
        for (const down in vals) {
          if (orderedUnits$1.indexOf(down) > orderedUnits$1.indexOf(k)) {
            convert(this.matrix, vals, down, built, k);
          }
        }
        // otherwise, keep it in the wings to boil it later
      } else if (isNumber(vals[k])) {
        accumulated[k] = vals[k];
      }
    }

    // anything leftover becomes the decimal for the last unit
    // lastUnit must be defined since units is not empty
    for (const key in accumulated) {
      if (accumulated[key] !== 0) {
        built[lastUnit] +=
          key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
      }
    }

    return clone$1(this, { values: built }, true).normalize();
  }

  /**
   * Shift this Duration to all available units.
   * Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
   * @return {Duration}
   */
  shiftToAll() {
    if (!this.isValid) return this;
    return this.shiftTo(
      "years",
      "months",
      "weeks",
      "days",
      "hours",
      "minutes",
      "seconds",
      "milliseconds"
    );
  }

  /**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */
  negate() {
    if (!this.isValid) return this;
    const negated = {};
    for (const k of Object.keys(this.values)) {
      negated[k] = this.values[k] === 0 ? 0 : -this.values[k];
    }
    return clone$1(this, { values: negated }, true);
  }

  /**
   * Get the years.
   * @type {number}
   */
  get years() {
    return this.isValid ? this.values.years || 0 : NaN;
  }

  /**
   * Get the quarters.
   * @type {number}
   */
  get quarters() {
    return this.isValid ? this.values.quarters || 0 : NaN;
  }

  /**
   * Get the months.
   * @type {number}
   */
  get months() {
    return this.isValid ? this.values.months || 0 : NaN;
  }

  /**
   * Get the weeks
   * @type {number}
   */
  get weeks() {
    return this.isValid ? this.values.weeks || 0 : NaN;
  }

  /**
   * Get the days.
   * @type {number}
   */
  get days() {
    return this.isValid ? this.values.days || 0 : NaN;
  }

  /**
   * Get the hours.
   * @type {number}
   */
  get hours() {
    return this.isValid ? this.values.hours || 0 : NaN;
  }

  /**
   * Get the minutes.
   * @type {number}
   */
  get minutes() {
    return this.isValid ? this.values.minutes || 0 : NaN;
  }

  /**
   * Get the seconds.
   * @return {number}
   */
  get seconds() {
    return this.isValid ? this.values.seconds || 0 : NaN;
  }

  /**
   * Get the milliseconds.
   * @return {number}
   */
  get milliseconds() {
    return this.isValid ? this.values.milliseconds || 0 : NaN;
  }

  /**
   * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
   * on invalid DateTimes or Intervals.
   * @return {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }

  /**
   * Returns an error code if this Duration became invalid, or null if the Duration is valid
   * @return {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }

  /**
   * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }

  /**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }

    if (!this.loc.equals(other.loc)) {
      return false;
    }

    function eq(v1, v2) {
      // Consider 0 and undefined as equal
      if (v1 === undefined || v1 === 0) return v2 === undefined || v2 === 0;
      return v1 === v2;
    }

    for (const u of orderedUnits$1) {
      if (!eq(this.values[u], other.values[u])) {
        return false;
      }
    }
    return true;
  }
}

const INVALID$2 = "Invalid Interval";

// checks if the start is equal to or before the end
function validateStartEnd(start, end) {
  if (!start || !start.isValid) {
    return Interval.invalid("missing or invalid start");
  } else if (!end || !end.isValid) {
    return Interval.invalid("missing or invalid end");
  } else if (end < start) {
    return Interval.invalid(
      "end before start",
      `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`
    );
  } else {
    return null;
  }
}

/**
 * An Interval object represents a half-open interval of time, where each endpoint is a {@link DateTime}. Conceptually, it's a container for those two endpoints, accompanied by methods for creating, parsing, interrogating, comparing, transforming, and formatting them.
 *
 * Here is a brief overview of the most commonly used methods and getters in Interval:
 *
 * * **Creation** To create an Interval, use {@link Interval.fromDateTimes}, {@link Interval.after}, {@link Interval.before}, or {@link Interval.fromISO}.
 * * **Accessors** Use {@link Interval#start} and {@link Interval#end} to get the start and end.
 * * **Interrogation** To analyze the Interval, use {@link Interval#count}, {@link Interval#length}, {@link Interval#hasSame}, {@link Interval#contains}, {@link Interval#isAfter}, or {@link Interval#isBefore}.
 * * **Transformation** To create other Intervals out of this one, use {@link Interval#set}, {@link Interval#splitAt}, {@link Interval#splitBy}, {@link Interval#divideEqually}, {@link Interval.merge}, {@link Interval.xor}, {@link Interval#union}, {@link Interval#intersection}, or {@link Interval#difference}.
 * * **Comparison** To compare this Interval to another one, use {@link Interval#equals}, {@link Interval#overlaps}, {@link Interval#abutsStart}, {@link Interval#abutsEnd}, {@link Interval#engulfs}
 * * **Output** To convert the Interval into other representations, see {@link Interval#toString}, {@link Interval#toLocaleString}, {@link Interval#toISO}, {@link Interval#toISODate}, {@link Interval#toISOTime}, {@link Interval#toFormat}, and {@link Interval#toDuration}.
 */
class Interval {
  /**
   * @private
   */
  constructor(config) {
    /**
     * @access private
     */
    this.s = config.start;
    /**
     * @access private
     */
    this.e = config.end;
    /**
     * @access private
     */
    this.invalid = config.invalid || null;
    /**
     * @access private
     */
    this.isLuxonInterval = true;
  }

  /**
   * Create an invalid Interval.
   * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Interval}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
    }

    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);

    if (Settings.throwOnInvalid) {
      throw new InvalidIntervalError(invalid);
    } else {
      return new Interval({ invalid });
    }
  }

  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */
  static fromDateTimes(start, end) {
    const builtStart = friendlyDateTime(start),
      builtEnd = friendlyDateTime(end);

    const validateError = validateStartEnd(builtStart, builtEnd);

    if (validateError == null) {
      return new Interval({
        start: builtStart,
        end: builtEnd,
      });
    } else {
      return validateError;
    }
  }

  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static after(start, duration) {
    const dur = Duration.fromDurationLike(duration),
      dt = friendlyDateTime(start);
    return Interval.fromDateTimes(dt, dt.plus(dur));
  }

  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(end, duration) {
    const dur = Duration.fromDurationLike(duration),
      dt = friendlyDateTime(end);
    return Interval.fromDateTimes(dt.minus(dur), dt);
  }

  /**
   * Create an Interval from an ISO 8601 string.
   * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
   * @param {string} text - the ISO string to parse
   * @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {Interval}
   */
  static fromISO(text, opts) {
    const [s, e] = (text || "").split("/", 2);
    if (s && e) {
      let start, startIsValid;
      try {
        start = DateTime.fromISO(s, opts);
        startIsValid = start.isValid;
      } catch (e) {
        startIsValid = false;
      }

      let end, endIsValid;
      try {
        end = DateTime.fromISO(e, opts);
        endIsValid = end.isValid;
      } catch (e) {
        endIsValid = false;
      }

      if (startIsValid && endIsValid) {
        return Interval.fromDateTimes(start, end);
      }

      if (startIsValid) {
        const dur = Duration.fromISO(e, opts);
        if (dur.isValid) {
          return Interval.after(start, dur);
        }
      } else if (endIsValid) {
        const dur = Duration.fromISO(s, opts);
        if (dur.isValid) {
          return Interval.before(end, dur);
        }
      }
    }
    return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
  }

  /**
   * Check if an object is an Interval. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isInterval(o) {
    return (o && o.isLuxonInterval) || false;
  }

  /**
   * Returns the start of the Interval
   * @type {DateTime}
   */
  get start() {
    return this.isValid ? this.s : null;
  }

  /**
   * Returns the end of the Interval
   * @type {DateTime}
   */
  get end() {
    return this.isValid ? this.e : null;
  }

  /**
   * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
   * @type {boolean}
   */
  get isValid() {
    return this.invalidReason === null;
  }

  /**
   * Returns an error code if this Interval is invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }

  /**
   * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }

  /**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  length(unit = "milliseconds") {
    return this.isValid ? this.toDuration(...[unit]).get(unit) : NaN;
  }

  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @return {number}
   */
  count(unit = "milliseconds") {
    if (!this.isValid) return NaN;
    const start = this.start.startOf(unit),
      end = this.end.startOf(unit);
    return Math.floor(end.diff(start, unit).get(unit)) + (end.valueOf() !== this.end.valueOf());
  }

  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */
  hasSame(unit) {
    return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, unit) : false;
  }

  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */
  isEmpty() {
    return this.s.valueOf() === this.e.valueOf();
  }

  /**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isAfter(dateTime) {
    if (!this.isValid) return false;
    return this.s > dateTime;
  }

  /**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isBefore(dateTime) {
    if (!this.isValid) return false;
    return this.e <= dateTime;
  }

  /**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  contains(dateTime) {
    if (!this.isValid) return false;
    return this.s <= dateTime && this.e > dateTime;
  }

  /**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */
  set({ start, end } = {}) {
    if (!this.isValid) return this;
    return Interval.fromDateTimes(start || this.s, end || this.e);
  }

  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */
  splitAt(...dateTimes) {
    if (!this.isValid) return [];
    const sorted = dateTimes
        .map(friendlyDateTime)
        .filter((d) => this.contains(d))
        .sort(),
      results = [];
    let { s } = this,
      i = 0;

    while (s < this.e) {
      const added = sorted[i] || this.e,
        next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
      i += 1;
    }

    return results;
  }

  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */
  splitBy(duration) {
    const dur = Duration.fromDurationLike(duration);

    if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) {
      return [];
    }

    let { s } = this,
      idx = 1,
      next;

    const results = [];
    while (s < this.e) {
      const added = this.start.plus(dur.mapUnits((x) => x * idx));
      next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
      idx += 1;
    }

    return results;
  }

  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {Array}
   */
  divideEqually(numberOfParts) {
    if (!this.isValid) return [];
    return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
  }

  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */
  overlaps(other) {
    return this.e > other.s && this.s < other.e;
  }

  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsStart(other) {
    if (!this.isValid) return false;
    return +this.e === +other.s;
  }

  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsEnd(other) {
    if (!this.isValid) return false;
    return +other.e === +this.s;
  }

  /**
   * Return whether this Interval engulfs the start and end of the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  engulfs(other) {
    if (!this.isValid) return false;
    return this.s <= other.s && this.e >= other.e;
  }

  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }

    return this.s.equals(other.s) && this.e.equals(other.e);
  }

  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, meaning, the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */
  intersection(other) {
    if (!this.isValid) return this;
    const s = this.s > other.s ? this.s : other.s,
      e = this.e < other.e ? this.e : other.e;

    if (s >= e) {
      return null;
    } else {
      return Interval.fromDateTimes(s, e);
    }
  }

  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(other) {
    if (!this.isValid) return this;
    const s = this.s < other.s ? this.s : other.s,
      e = this.e > other.e ? this.e : other.e;
    return Interval.fromDateTimes(s, e);
  }

  /**
   * Merge an array of Intervals into a equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static merge(intervals) {
    const [found, final] = intervals
      .sort((a, b) => a.s - b.s)
      .reduce(
        ([sofar, current], item) => {
          if (!current) {
            return [sofar, item];
          } else if (current.overlaps(item) || current.abutsStart(item)) {
            return [sofar, current.union(item)];
          } else {
            return [sofar.concat([current]), item];
          }
        },
        [[], null]
      );
    if (final) {
      found.push(final);
    }
    return found;
  }

  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static xor(intervals) {
    let start = null,
      currentCount = 0;
    const results = [],
      ends = intervals.map((i) => [
        { time: i.s, type: "s" },
        { time: i.e, type: "e" },
      ]),
      flattened = Array.prototype.concat(...ends),
      arr = flattened.sort((a, b) => a.time - b.time);

    for (const i of arr) {
      currentCount += i.type === "s" ? 1 : -1;

      if (currentCount === 1) {
        start = i.time;
      } else {
        if (start && +start !== +i.time) {
          results.push(Interval.fromDateTimes(start, i.time));
        }

        start = null;
      }
    }

    return Interval.merge(results);
  }

  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */
  difference(...intervals) {
    return Interval.xor([this].concat(intervals))
      .map((i) => this.intersection(i))
      .filter((i) => i && !i.isEmpty());
  }

  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString() {
    if (!this.isValid) return INVALID$2;
    return `[${this.s.toISO()} – ${this.e.toISO()})`;
  }

  /**
   * Returns a localized string representing this Interval. Accepts the same options as the
   * Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
   * {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
   * is browser-specific, but in general it will return an appropriate representation of the
   * Interval in the assigned locale. Defaults to the system's locale if no locale has been
   * specified.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
   * Intl.DateTimeFormat constructor options.
   * @param {Object} opts - Options to override the configuration of the start DateTime.
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid
      ? Formatter.create(this.s.loc.clone(opts), formatOpts).formatInterval(this)
      : INVALID$2;
  }

  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(opts) {
    if (!this.isValid) return INVALID$2;
    return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
  }

  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate() {
    if (!this.isValid) return INVALID$2;
    return `${this.s.toISODate()}/${this.e.toISODate()}`;
  }

  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISOTime(opts) {
    if (!this.isValid) return INVALID$2;
    return `${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;
  }

  /**
   * Returns a string representation of this Interval formatted according to the specified format
   * string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
   * formatting tool.
   * @param {string} dateFormat - The format string. This string formats the start and end time.
   * See {@link DateTime#toFormat} for details.
   * @param {Object} opts - Options.
   * @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
   * representations.
   * @return {string}
   */
  toFormat(dateFormat, { separator = " – " } = {}) {
    if (!this.isValid) return INVALID$2;
    return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
  }

  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */
  toDuration(unit, opts) {
    if (!this.isValid) {
      return Duration.invalid(this.invalidReason);
    }
    return this.e.diff(this.s, unit, opts);
  }

  /**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */
  mapEndpoints(mapFn) {
    return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
  }
}

/**
 * The Info class contains static methods for retrieving general time and date related data. For example, it has methods for finding out if a time zone has a DST, for listing the months in any supported locale, and for discovering which of Luxon features are available in the current environment.
 */
class Info {
  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  static hasDST(zone = Settings.defaultZone) {
    const proto = DateTime.now().setZone(zone).set({ month: 12 });

    return !zone.isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
  }

  /**
   * Return whether the specified zone is a valid IANA specifier.
   * @param {string} zone - Zone to check
   * @return {boolean}
   */
  static isValidIANAZone(zone) {
    return IANAZone.isValidZone(zone);
  }

  /**
   * Converts the input into a {@link Zone} instance.
   *
   * * If `input` is already a Zone instance, it is returned unchanged.
   * * If `input` is a string containing a valid time zone name, a Zone instance
   *   with that name is returned.
   * * If `input` is a string that doesn't refer to a known time zone, a Zone
   *   instance with {@link Zone#isValid} == false is returned.
   * * If `input is a number, a Zone instance with the specified fixed offset
   *   in minutes is returned.
   * * If `input` is `null` or `undefined`, the default zone is returned.
   * @param {string|Zone|number} [input] - the value to be converted
   * @return {Zone}
   */
  static normalizeZone(input) {
    return normalizeZone(input, Settings.defaultZone);
  }

  /**
   * Return an array of standalone month names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @example Info.months()[0] //=> 'January'
   * @example Info.months('short')[0] //=> 'Jan'
   * @example Info.months('numeric')[0] //=> '1'
   * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
   * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
   * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
   * @return {Array}
   */
  static months(
    length = "long",
    { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}
  ) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
  }

  /**
   * Return an array of format month names.
   * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
   * changes the string.
   * See {@link Info#months}
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @return {Array}
   */
  static monthsFormat(
    length = "long",
    { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}
  ) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
  }

  /**
   * Return an array of standalone week names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @example Info.weekdays()[0] //=> 'Monday'
   * @example Info.weekdays('short')[0] //=> 'Mon'
   * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
   * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
   * @return {Array}
   */
  static weekdays(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length);
  }

  /**
   * Return an array of format week names.
   * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
   * changes the string.
   * See {@link Info#weekdays}
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale=null] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @return {Array}
   */
  static weekdaysFormat(
    length = "long",
    { locale = null, numberingSystem = null, locObj = null } = {}
  ) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length, true);
  }

  /**
   * Return an array of meridiems.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.meridiems() //=> [ 'AM', 'PM' ]
   * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
   * @return {Array}
   */
  static meridiems({ locale = null } = {}) {
    return Locale.create(locale).meridiems();
  }

  /**
   * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
   * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.eras() //=> [ 'BC', 'AD' ]
   * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
   * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
   * @return {Array}
   */
  static eras(length = "short", { locale = null } = {}) {
    return Locale.create(locale, null, "gregory").eras(length);
  }

  /**
   * Return the set of available features in this environment.
   * Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
   * Keys:
   * * `relative`: whether this environment supports relative time formatting
   * @example Info.features() //=> { relative: false }
   * @return {Object}
   */
  static features() {
    return { relative: hasRelative() };
  }
}

function dayDiff(earlier, later) {
  const utcDayStart = (dt) => dt.toUTC(0, { keepLocalTime: true }).startOf("day").valueOf(),
    ms = utcDayStart(later) - utcDayStart(earlier);
  return Math.floor(Duration.fromMillis(ms).as("days"));
}

function highOrderDiffs(cursor, later, units) {
  const differs = [
    ["years", (a, b) => b.year - a.year],
    ["quarters", (a, b) => b.quarter - a.quarter + (b.year - a.year) * 4],
    ["months", (a, b) => b.month - a.month + (b.year - a.year) * 12],
    [
      "weeks",
      (a, b) => {
        const days = dayDiff(a, b);
        return (days - (days % 7)) / 7;
      },
    ],
    ["days", dayDiff],
  ];

  const results = {};
  const earlier = cursor;
  let lowestOrder, highWater;

  for (const [unit, differ] of differs) {
    if (units.indexOf(unit) >= 0) {
      lowestOrder = unit;

      results[unit] = differ(cursor, later);
      highWater = earlier.plus(results);

      if (highWater > later) {
        results[unit]--;
        cursor = earlier.plus(results);
      } else {
        cursor = highWater;
      }
    }
  }

  return [cursor, results, highWater, lowestOrder];
}

function diff (earlier, later, units, opts) {
  let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);

  const remainingMillis = later - cursor;

  const lowerOrderUnits = units.filter(
    (u) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(u) >= 0
  );

  if (lowerOrderUnits.length === 0) {
    if (highWater < later) {
      highWater = cursor.plus({ [lowestOrder]: 1 });
    }

    if (highWater !== cursor) {
      results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
    }
  }

  const duration = Duration.fromObject(results, opts);

  if (lowerOrderUnits.length > 0) {
    return Duration.fromMillis(remainingMillis, opts)
      .shiftTo(...lowerOrderUnits)
      .plus(duration);
  } else {
    return duration;
  }
}

const numberingSystems = {
  arab: "[\u0660-\u0669]",
  arabext: "[\u06F0-\u06F9]",
  bali: "[\u1B50-\u1B59]",
  beng: "[\u09E6-\u09EF]",
  deva: "[\u0966-\u096F]",
  fullwide: "[\uFF10-\uFF19]",
  gujr: "[\u0AE6-\u0AEF]",
  hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
  khmr: "[\u17E0-\u17E9]",
  knda: "[\u0CE6-\u0CEF]",
  laoo: "[\u0ED0-\u0ED9]",
  limb: "[\u1946-\u194F]",
  mlym: "[\u0D66-\u0D6F]",
  mong: "[\u1810-\u1819]",
  mymr: "[\u1040-\u1049]",
  orya: "[\u0B66-\u0B6F]",
  tamldec: "[\u0BE6-\u0BEF]",
  telu: "[\u0C66-\u0C6F]",
  thai: "[\u0E50-\u0E59]",
  tibt: "[\u0F20-\u0F29]",
  latn: "\\d",
};

const numberingSystemsUTF16 = {
  arab: [1632, 1641],
  arabext: [1776, 1785],
  bali: [6992, 7001],
  beng: [2534, 2543],
  deva: [2406, 2415],
  fullwide: [65296, 65303],
  gujr: [2790, 2799],
  khmr: [6112, 6121],
  knda: [3302, 3311],
  laoo: [3792, 3801],
  limb: [6470, 6479],
  mlym: [3430, 3439],
  mong: [6160, 6169],
  mymr: [4160, 4169],
  orya: [2918, 2927],
  tamldec: [3046, 3055],
  telu: [3174, 3183],
  thai: [3664, 3673],
  tibt: [3872, 3881],
};

const hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");

function parseDigits(str) {
  let value = parseInt(str, 10);
  if (isNaN(value)) {
    value = "";
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);

      if (str[i].search(numberingSystems.hanidec) !== -1) {
        value += hanidecChars.indexOf(str[i]);
      } else {
        for (const key in numberingSystemsUTF16) {
          const [min, max] = numberingSystemsUTF16[key];
          if (code >= min && code <= max) {
            value += code - min;
          }
        }
      }
    }
    return parseInt(value, 10);
  } else {
    return value;
  }
}

function digitRegex({ numberingSystem }, append = "") {
  return new RegExp(`${numberingSystems[numberingSystem || "latn"]}${append}`);
}

const MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";

function intUnit(regex, post = (i) => i) {
  return { regex, deser: ([s]) => post(parseDigits(s)) };
}

const NBSP = String.fromCharCode(160);
const spaceOrNBSP = `[ ${NBSP}]`;
const spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");

function fixListRegex(s) {
  // make dots optional and also make them literal
  // make space and non breakable space characters interchangeable
  return s.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
}

function stripInsensitivities(s) {
  return s
    .replace(/\./g, "") // ignore dots that were made optional
    .replace(spaceOrNBSPRegExp, " ") // interchange space and nbsp
    .toLowerCase();
}

function oneOf(strings, startIndex) {
  if (strings === null) {
    return null;
  } else {
    return {
      regex: RegExp(strings.map(fixListRegex).join("|")),
      deser: ([s]) =>
        strings.findIndex((i) => stripInsensitivities(s) === stripInsensitivities(i)) + startIndex,
    };
  }
}

function offset(regex, groups) {
  return { regex, deser: ([, h, m]) => signedOffset(h, m), groups };
}

function simple(regex) {
  return { regex, deser: ([s]) => s };
}

function escapeToken(value) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}

function unitForToken(token, loc) {
  const one = digitRegex(loc),
    two = digitRegex(loc, "{2}"),
    three = digitRegex(loc, "{3}"),
    four = digitRegex(loc, "{4}"),
    six = digitRegex(loc, "{6}"),
    oneOrTwo = digitRegex(loc, "{1,2}"),
    oneToThree = digitRegex(loc, "{1,3}"),
    oneToSix = digitRegex(loc, "{1,6}"),
    oneToNine = digitRegex(loc, "{1,9}"),
    twoToFour = digitRegex(loc, "{2,4}"),
    fourToSix = digitRegex(loc, "{4,6}"),
    literal = (t) => ({ regex: RegExp(escapeToken(t.val)), deser: ([s]) => s, literal: true }),
    unitate = (t) => {
      if (token.literal) {
        return literal(t);
      }
      switch (t.val) {
        // era
        case "G":
          return oneOf(loc.eras("short", false), 0);
        case "GG":
          return oneOf(loc.eras("long", false), 0);
        // years
        case "y":
          return intUnit(oneToSix);
        case "yy":
          return intUnit(twoToFour, untruncateYear);
        case "yyyy":
          return intUnit(four);
        case "yyyyy":
          return intUnit(fourToSix);
        case "yyyyyy":
          return intUnit(six);
        // months
        case "M":
          return intUnit(oneOrTwo);
        case "MM":
          return intUnit(two);
        case "MMM":
          return oneOf(loc.months("short", true, false), 1);
        case "MMMM":
          return oneOf(loc.months("long", true, false), 1);
        case "L":
          return intUnit(oneOrTwo);
        case "LL":
          return intUnit(two);
        case "LLL":
          return oneOf(loc.months("short", false, false), 1);
        case "LLLL":
          return oneOf(loc.months("long", false, false), 1);
        // dates
        case "d":
          return intUnit(oneOrTwo);
        case "dd":
          return intUnit(two);
        // ordinals
        case "o":
          return intUnit(oneToThree);
        case "ooo":
          return intUnit(three);
        // time
        case "HH":
          return intUnit(two);
        case "H":
          return intUnit(oneOrTwo);
        case "hh":
          return intUnit(two);
        case "h":
          return intUnit(oneOrTwo);
        case "mm":
          return intUnit(two);
        case "m":
          return intUnit(oneOrTwo);
        case "q":
          return intUnit(oneOrTwo);
        case "qq":
          return intUnit(two);
        case "s":
          return intUnit(oneOrTwo);
        case "ss":
          return intUnit(two);
        case "S":
          return intUnit(oneToThree);
        case "SSS":
          return intUnit(three);
        case "u":
          return simple(oneToNine);
        case "uu":
          return simple(oneOrTwo);
        case "uuu":
          return intUnit(one);
        // meridiem
        case "a":
          return oneOf(loc.meridiems(), 0);
        // weekYear (k)
        case "kkkk":
          return intUnit(four);
        case "kk":
          return intUnit(twoToFour, untruncateYear);
        // weekNumber (W)
        case "W":
          return intUnit(oneOrTwo);
        case "WW":
          return intUnit(two);
        // weekdays
        case "E":
        case "c":
          return intUnit(one);
        case "EEE":
          return oneOf(loc.weekdays("short", false, false), 1);
        case "EEEE":
          return oneOf(loc.weekdays("long", false, false), 1);
        case "ccc":
          return oneOf(loc.weekdays("short", true, false), 1);
        case "cccc":
          return oneOf(loc.weekdays("long", true, false), 1);
        // offset/zone
        case "Z":
        case "ZZ":
          return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
        case "ZZZ":
          return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
        // we don't support ZZZZ (PST) or ZZZZZ (Pacific Standard Time) in parsing
        // because we don't have any way to figure out what they are
        case "z":
          return simple(/[a-z_+-/]{1,256}?/i);
        // this special-case "token" represents a place where a macro-token expanded into a white-space literal
        // in this case we accept any non-newline white-space
        case " ":
          return simple(/[^\S\n\r]/);
        default:
          return literal(t);
      }
    };

  const unit = unitate(token) || {
    invalidReason: MISSING_FTP,
  };

  unit.token = token;

  return unit;
}

const partTypeStyleToTokenVal = {
  year: {
    "2-digit": "yy",
    numeric: "yyyyy",
  },
  month: {
    numeric: "M",
    "2-digit": "MM",
    short: "MMM",
    long: "MMMM",
  },
  day: {
    numeric: "d",
    "2-digit": "dd",
  },
  weekday: {
    short: "EEE",
    long: "EEEE",
  },
  dayperiod: "a",
  dayPeriod: "a",
  hour: {
    numeric: "h",
    "2-digit": "hh",
  },
  minute: {
    numeric: "m",
    "2-digit": "mm",
  },
  second: {
    numeric: "s",
    "2-digit": "ss",
  },
  timeZoneName: {
    long: "ZZZZZ",
    short: "ZZZ",
  },
};

function tokenForPart(part, formatOpts) {
  const { type, value } = part;

  if (type === "literal") {
    const isSpace = /^\s+$/.test(value);
    return {
      literal: !isSpace,
      val: isSpace ? " " : value,
    };
  }

  const style = formatOpts[type];

  let val = partTypeStyleToTokenVal[type];
  if (typeof val === "object") {
    val = val[style];
  }

  if (val) {
    return {
      literal: false,
      val,
    };
  }

  return undefined;
}

function buildRegex(units) {
  const re = units.map((u) => u.regex).reduce((f, r) => `${f}(${r.source})`, "");
  return [`^${re}$`, units];
}

function match(input, regex, handlers) {
  const matches = input.match(regex);

  if (matches) {
    const all = {};
    let matchIndex = 1;
    for (const i in handlers) {
      if (hasOwnProperty(handlers, i)) {
        const h = handlers[i],
          groups = h.groups ? h.groups + 1 : 1;
        if (!h.literal && h.token) {
          all[h.token.val[0]] = h.deser(matches.slice(matchIndex, matchIndex + groups));
        }
        matchIndex += groups;
      }
    }
    return [matches, all];
  } else {
    return [matches, {}];
  }
}

function dateTimeFromMatches(matches) {
  const toField = (token) => {
    switch (token) {
      case "S":
        return "millisecond";
      case "s":
        return "second";
      case "m":
        return "minute";
      case "h":
      case "H":
        return "hour";
      case "d":
        return "day";
      case "o":
        return "ordinal";
      case "L":
      case "M":
        return "month";
      case "y":
        return "year";
      case "E":
      case "c":
        return "weekday";
      case "W":
        return "weekNumber";
      case "k":
        return "weekYear";
      case "q":
        return "quarter";
      default:
        return null;
    }
  };

  let zone = null;
  let specificOffset;
  if (!isUndefined(matches.z)) {
    zone = IANAZone.create(matches.z);
  }

  if (!isUndefined(matches.Z)) {
    if (!zone) {
      zone = new FixedOffsetZone(matches.Z);
    }
    specificOffset = matches.Z;
  }

  if (!isUndefined(matches.q)) {
    matches.M = (matches.q - 1) * 3 + 1;
  }

  if (!isUndefined(matches.h)) {
    if (matches.h < 12 && matches.a === 1) {
      matches.h += 12;
    } else if (matches.h === 12 && matches.a === 0) {
      matches.h = 0;
    }
  }

  if (matches.G === 0 && matches.y) {
    matches.y = -matches.y;
  }

  if (!isUndefined(matches.u)) {
    matches.S = parseMillis(matches.u);
  }

  const vals = Object.keys(matches).reduce((r, k) => {
    const f = toField(k);
    if (f) {
      r[f] = matches[k];
    }

    return r;
  }, {});

  return [vals, zone, specificOffset];
}

let dummyDateTimeCache = null;

function getDummyDateTime() {
  if (!dummyDateTimeCache) {
    dummyDateTimeCache = DateTime.fromMillis(1555555555555);
  }

  return dummyDateTimeCache;
}

function maybeExpandMacroToken(token, locale) {
  if (token.literal) {
    return token;
  }

  const formatOpts = Formatter.macroTokenToFormatOpts(token.val);
  const tokens = formatOptsToTokens(formatOpts, locale);

  if (tokens == null || tokens.includes(undefined)) {
    return token;
  }

  return tokens;
}

function expandMacroTokens(tokens, locale) {
  return Array.prototype.concat(...tokens.map((t) => maybeExpandMacroToken(t, locale)));
}

/**
 * @private
 */

function explainFromTokens(locale, input, format) {
  const tokens = expandMacroTokens(Formatter.parseFormat(format), locale),
    units = tokens.map((t) => unitForToken(t, locale)),
    disqualifyingUnit = units.find((t) => t.invalidReason);

  if (disqualifyingUnit) {
    return { input, tokens, invalidReason: disqualifyingUnit.invalidReason };
  } else {
    const [regexString, handlers] = buildRegex(units),
      regex = RegExp(regexString, "i"),
      [rawMatches, matches] = match(input, regex, handlers),
      [result, zone, specificOffset] = matches
        ? dateTimeFromMatches(matches)
        : [null, null, undefined];
    if (hasOwnProperty(matches, "a") && hasOwnProperty(matches, "H")) {
      throw new ConflictingSpecificationError(
        "Can't include meridiem when specifying 24-hour format"
      );
    }
    return { input, tokens, regex, rawMatches, matches, result, zone, specificOffset };
  }
}

function parseFromTokens(locale, input, format) {
  const { result, zone, specificOffset, invalidReason } = explainFromTokens(locale, input, format);
  return [result, zone, specificOffset, invalidReason];
}

function formatOptsToTokens(formatOpts, locale) {
  if (!formatOpts) {
    return null;
  }

  const formatter = Formatter.create(locale, formatOpts);
  const parts = formatter.formatDateTimeParts(getDummyDateTime());
  return parts.map((p) => tokenForPart(p, formatOpts));
}

const nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
  leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

function unitOutOfRange(unit, value) {
  return new Invalid(
    "unit out of range",
    `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`
  );
}

function dayOfWeek(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));

  if (year < 100 && year >= 0) {
    d.setUTCFullYear(d.getUTCFullYear() - 1900);
  }

  const js = d.getUTCDay();

  return js === 0 ? 7 : js;
}

function computeOrdinal(year, month, day) {
  return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}

function uncomputeOrdinal(year, ordinal) {
  const table = isLeapYear(year) ? leapLadder : nonLeapLadder,
    month0 = table.findIndex((i) => i < ordinal),
    day = ordinal - table[month0];
  return { month: month0 + 1, day };
}

/**
 * @private
 */

function gregorianToWeek(gregObj) {
  const { year, month, day } = gregObj,
    ordinal = computeOrdinal(year, month, day),
    weekday = dayOfWeek(year, month, day);

  let weekNumber = Math.floor((ordinal - weekday + 10) / 7),
    weekYear;

  if (weekNumber < 1) {
    weekYear = year - 1;
    weekNumber = weeksInWeekYear(weekYear);
  } else if (weekNumber > weeksInWeekYear(year)) {
    weekYear = year + 1;
    weekNumber = 1;
  } else {
    weekYear = year;
  }

  return { weekYear, weekNumber, weekday, ...timeObject(gregObj) };
}

function weekToGregorian(weekData) {
  const { weekYear, weekNumber, weekday } = weekData,
    weekdayOfJan4 = dayOfWeek(weekYear, 1, 4),
    yearInDays = daysInYear(weekYear);

  let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 3,
    year;

  if (ordinal < 1) {
    year = weekYear - 1;
    ordinal += daysInYear(year);
  } else if (ordinal > yearInDays) {
    year = weekYear + 1;
    ordinal -= daysInYear(weekYear);
  } else {
    year = weekYear;
  }

  const { month, day } = uncomputeOrdinal(year, ordinal);
  return { year, month, day, ...timeObject(weekData) };
}

function gregorianToOrdinal(gregData) {
  const { year, month, day } = gregData;
  const ordinal = computeOrdinal(year, month, day);
  return { year, ordinal, ...timeObject(gregData) };
}

function ordinalToGregorian(ordinalData) {
  const { year, ordinal } = ordinalData;
  const { month, day } = uncomputeOrdinal(year, ordinal);
  return { year, month, day, ...timeObject(ordinalData) };
}

function hasInvalidWeekData(obj) {
  const validYear = isInteger(obj.weekYear),
    validWeek = integerBetween(obj.weekNumber, 1, weeksInWeekYear(obj.weekYear)),
    validWeekday = integerBetween(obj.weekday, 1, 7);

  if (!validYear) {
    return unitOutOfRange("weekYear", obj.weekYear);
  } else if (!validWeek) {
    return unitOutOfRange("week", obj.week);
  } else if (!validWeekday) {
    return unitOutOfRange("weekday", obj.weekday);
  } else return false;
}

function hasInvalidOrdinalData(obj) {
  const validYear = isInteger(obj.year),
    validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));

  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validOrdinal) {
    return unitOutOfRange("ordinal", obj.ordinal);
  } else return false;
}

function hasInvalidGregorianData(obj) {
  const validYear = isInteger(obj.year),
    validMonth = integerBetween(obj.month, 1, 12),
    validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));

  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validMonth) {
    return unitOutOfRange("month", obj.month);
  } else if (!validDay) {
    return unitOutOfRange("day", obj.day);
  } else return false;
}

function hasInvalidTimeData(obj) {
  const { hour, minute, second, millisecond } = obj;
  const validHour =
      integerBetween(hour, 0, 23) ||
      (hour === 24 && minute === 0 && second === 0 && millisecond === 0),
    validMinute = integerBetween(minute, 0, 59),
    validSecond = integerBetween(second, 0, 59),
    validMillisecond = integerBetween(millisecond, 0, 999);

  if (!validHour) {
    return unitOutOfRange("hour", hour);
  } else if (!validMinute) {
    return unitOutOfRange("minute", minute);
  } else if (!validSecond) {
    return unitOutOfRange("second", second);
  } else if (!validMillisecond) {
    return unitOutOfRange("millisecond", millisecond);
  } else return false;
}

const INVALID$1 = "Invalid DateTime";
const MAX_DATE = 8.64e15;

function unsupportedZone(zone) {
  return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
}

// we cache week data on the DT object and this intermediates the cache
function possiblyCachedWeekData(dt) {
  if (dt.weekData === null) {
    dt.weekData = gregorianToWeek(dt.c);
  }
  return dt.weekData;
}

// clone really means, "make a new object with these modifications". all "setters" really use this
// to create a new object while only changing some of the properties
function clone(inst, alts) {
  const current = {
    ts: inst.ts,
    zone: inst.zone,
    c: inst.c,
    o: inst.o,
    loc: inst.loc,
    invalid: inst.invalid,
  };
  return new DateTime({ ...current, ...alts, old: current });
}

// find the right offset a given local time. The o input is our guess, which determines which
// offset we'll pick in ambiguous cases (e.g. there are two 3 AMs b/c Fallback DST)
function fixOffset(localTS, o, tz) {
  // Our UTC time is just a guess because our offset is just a guess
  let utcGuess = localTS - o * 60 * 1000;

  // Test whether the zone matches the offset for this ts
  const o2 = tz.offset(utcGuess);

  // If so, offset didn't change and we're done
  if (o === o2) {
    return [utcGuess, o];
  }

  // If not, change the ts by the difference in the offset
  utcGuess -= (o2 - o) * 60 * 1000;

  // If that gives us the local time we want, we're done
  const o3 = tz.offset(utcGuess);
  if (o2 === o3) {
    return [utcGuess, o2];
  }

  // If it's different, we're in a hole time. The offset has changed, but the we don't adjust the time
  return [localTS - Math.min(o2, o3) * 60 * 1000, Math.max(o2, o3)];
}

// convert an epoch timestamp into a calendar object with the given offset
function tsToObj(ts, offset) {
  ts += offset * 60 * 1000;

  const d = new Date(ts);

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds(),
  };
}

// convert a calendar object to a epoch timestamp
function objToTS(obj, offset, zone) {
  return fixOffset(objToLocalTS(obj), offset, zone);
}

// create a new DT instance by adding a duration, adjusting for DSTs
function adjustTime(inst, dur) {
  const oPre = inst.o,
    year = inst.c.year + Math.trunc(dur.years),
    month = inst.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3,
    c = {
      ...inst.c,
      year,
      month,
      day:
        Math.min(inst.c.day, daysInMonth(year, month)) +
        Math.trunc(dur.days) +
        Math.trunc(dur.weeks) * 7,
    },
    millisToAdd = Duration.fromObject({
      years: dur.years - Math.trunc(dur.years),
      quarters: dur.quarters - Math.trunc(dur.quarters),
      months: dur.months - Math.trunc(dur.months),
      weeks: dur.weeks - Math.trunc(dur.weeks),
      days: dur.days - Math.trunc(dur.days),
      hours: dur.hours,
      minutes: dur.minutes,
      seconds: dur.seconds,
      milliseconds: dur.milliseconds,
    }).as("milliseconds"),
    localTS = objToLocalTS(c);

  let [ts, o] = fixOffset(localTS, oPre, inst.zone);

  if (millisToAdd !== 0) {
    ts += millisToAdd;
    // that could have changed the offset by going over a DST, but we want to keep the ts the same
    o = inst.zone.offset(ts);
  }

  return { ts, o };
}

// helper useful in turning the results of parsing into real dates
// by handling the zone options
function parseDataToDateTime(parsed, parsedZone, opts, format, text, specificOffset) {
  const { setZone, zone } = opts;
  if ((parsed && Object.keys(parsed).length !== 0) || parsedZone) {
    const interpretationZone = parsedZone || zone,
      inst = DateTime.fromObject(parsed, {
        ...opts,
        zone: interpretationZone,
        specificOffset,
      });
    return setZone ? inst : inst.setZone(zone);
  } else {
    return DateTime.invalid(
      new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`)
    );
  }
}

// if you want to output a technical format (e.g. RFC 2822), this helper
// helps handle the details
function toTechFormat(dt, format, allowZ = true) {
  return dt.isValid
    ? Formatter.create(Locale.create("en-US"), {
        allowZ,
        forceSimple: true,
      }).formatDateTimeFromString(dt, format)
    : null;
}

function toISODate(o, extended) {
  const longFormat = o.c.year > 9999 || o.c.year < 0;
  let c = "";
  if (longFormat && o.c.year >= 0) c += "+";
  c += padStart(o.c.year, longFormat ? 6 : 4);

  if (extended) {
    c += "-";
    c += padStart(o.c.month);
    c += "-";
    c += padStart(o.c.day);
  } else {
    c += padStart(o.c.month);
    c += padStart(o.c.day);
  }
  return c;
}

function toISOTime(
  o,
  extended,
  suppressSeconds,
  suppressMilliseconds,
  includeOffset,
  extendedZone
) {
  let c = padStart(o.c.hour);
  if (extended) {
    c += ":";
    c += padStart(o.c.minute);
    if (o.c.second !== 0 || !suppressSeconds) {
      c += ":";
    }
  } else {
    c += padStart(o.c.minute);
  }

  if (o.c.second !== 0 || !suppressSeconds) {
    c += padStart(o.c.second);

    if (o.c.millisecond !== 0 || !suppressMilliseconds) {
      c += ".";
      c += padStart(o.c.millisecond, 3);
    }
  }

  if (includeOffset) {
    if (o.isOffsetFixed && o.offset === 0 && !extendedZone) {
      c += "Z";
    } else if (o.o < 0) {
      c += "-";
      c += padStart(Math.trunc(-o.o / 60));
      c += ":";
      c += padStart(Math.trunc(-o.o % 60));
    } else {
      c += "+";
      c += padStart(Math.trunc(o.o / 60));
      c += ":";
      c += padStart(Math.trunc(o.o % 60));
    }
  }

  if (extendedZone) {
    c += "[" + o.zone.ianaName + "]";
  }
  return c;
}

// defaults for unspecified units in the supported calendars
const defaultUnitValues = {
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  },
  defaultWeekUnitValues = {
    weekNumber: 1,
    weekday: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  },
  defaultOrdinalUnitValues = {
    ordinal: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  };

// Units in the supported calendars, sorted by bigness
const orderedUnits = ["year", "month", "day", "hour", "minute", "second", "millisecond"],
  orderedWeekUnits = [
    "weekYear",
    "weekNumber",
    "weekday",
    "hour",
    "minute",
    "second",
    "millisecond",
  ],
  orderedOrdinalUnits = ["year", "ordinal", "hour", "minute", "second", "millisecond"];

// standardize case and plurality in units
function normalizeUnit(unit) {
  const normalized = {
    year: "year",
    years: "year",
    month: "month",
    months: "month",
    day: "day",
    days: "day",
    hour: "hour",
    hours: "hour",
    minute: "minute",
    minutes: "minute",
    quarter: "quarter",
    quarters: "quarter",
    second: "second",
    seconds: "second",
    millisecond: "millisecond",
    milliseconds: "millisecond",
    weekday: "weekday",
    weekdays: "weekday",
    weeknumber: "weekNumber",
    weeksnumber: "weekNumber",
    weeknumbers: "weekNumber",
    weekyear: "weekYear",
    weekyears: "weekYear",
    ordinal: "ordinal",
  }[unit.toLowerCase()];

  if (!normalized) throw new InvalidUnitError(unit);

  return normalized;
}

// this is a dumbed down version of fromObject() that runs about 60% faster
// but doesn't do any validation, makes a bunch of assumptions about what units
// are present, and so on.
function quickDT(obj, opts) {
  const zone = normalizeZone(opts.zone, Settings.defaultZone),
    loc = Locale.fromObject(opts),
    tsNow = Settings.now();

  let ts, o;

  // assume we have the higher-order units
  if (!isUndefined(obj.year)) {
    for (const u of orderedUnits) {
      if (isUndefined(obj[u])) {
        obj[u] = defaultUnitValues[u];
      }
    }

    const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
    if (invalid) {
      return DateTime.invalid(invalid);
    }

    const offsetProvis = zone.offset(tsNow);
    [ts, o] = objToTS(obj, offsetProvis, zone);
  } else {
    ts = tsNow;
  }

  return new DateTime({ ts, zone, loc, o });
}

function diffRelative(start, end, opts) {
  const round = isUndefined(opts.round) ? true : opts.round,
    format = (c, unit) => {
      c = roundTo(c, round || opts.calendary ? 0 : 2, true);
      const formatter = end.loc.clone(opts).relFormatter(opts);
      return formatter.format(c, unit);
    },
    differ = (unit) => {
      if (opts.calendary) {
        if (!end.hasSame(start, unit)) {
          return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
        } else return 0;
      } else {
        return end.diff(start, unit).get(unit);
      }
    };

  if (opts.unit) {
    return format(differ(opts.unit), opts.unit);
  }

  for (const unit of opts.units) {
    const count = differ(unit);
    if (Math.abs(count) >= 1) {
      return format(count, unit);
    }
  }
  return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
}

function lastOpts(argList) {
  let opts = {},
    args;
  if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
    opts = argList[argList.length - 1];
    args = Array.from(argList).slice(0, argList.length - 1);
  } else {
    args = Array.from(argList);
  }
  return [opts, args];
}

/**
 * A DateTime is an immutable data structure representing a specific date and time and accompanying methods. It contains class and instance methods for creating, parsing, interrogating, transforming, and formatting them.
 *
 * A DateTime comprises of:
 * * A timestamp. Each DateTime instance refers to a specific millisecond of the Unix epoch.
 * * A time zone. Each instance is considered in the context of a specific zone (by default the local system's zone).
 * * Configuration properties that effect how output strings are formatted, such as `locale`, `numberingSystem`, and `outputCalendar`.
 *
 * Here is a brief overview of the most commonly used functionality it provides:
 *
 * * **Creation**: To create a DateTime from its components, use one of its factory class methods: {@link DateTime.local}, {@link DateTime.utc}, and (most flexibly) {@link DateTime.fromObject}. To create one from a standard string format, use {@link DateTime.fromISO}, {@link DateTime.fromHTTP}, and {@link DateTime.fromRFC2822}. To create one from a custom string format, use {@link DateTime.fromFormat}. To create one from a native JS date, use {@link DateTime.fromJSDate}.
 * * **Gregorian calendar and time**: To examine the Gregorian properties of a DateTime individually (i.e as opposed to collectively through {@link DateTime#toObject}), use the {@link DateTime#year}, {@link DateTime#month},
 * {@link DateTime#day}, {@link DateTime#hour}, {@link DateTime#minute}, {@link DateTime#second}, {@link DateTime#millisecond} accessors.
 * * **Week calendar**: For ISO week calendar attributes, see the {@link DateTime#weekYear}, {@link DateTime#weekNumber}, and {@link DateTime#weekday} accessors.
 * * **Configuration** See the {@link DateTime#locale} and {@link DateTime#numberingSystem} accessors.
 * * **Transformation**: To transform the DateTime into other DateTimes, use {@link DateTime#set}, {@link DateTime#reconfigure}, {@link DateTime#setZone}, {@link DateTime#setLocale}, {@link DateTime.plus}, {@link DateTime#minus}, {@link DateTime#endOf}, {@link DateTime#startOf}, {@link DateTime#toUTC}, and {@link DateTime#toLocal}.
 * * **Output**: To convert the DateTime to other representations, use the {@link DateTime#toRelative}, {@link DateTime#toRelativeCalendar}, {@link DateTime#toJSON}, {@link DateTime#toISO}, {@link DateTime#toHTTP}, {@link DateTime#toObject}, {@link DateTime#toRFC2822}, {@link DateTime#toString}, {@link DateTime#toLocaleString}, {@link DateTime#toFormat}, {@link DateTime#toMillis} and {@link DateTime#toJSDate}.
 *
 * There's plenty others documented below. In addition, for more information on subtler topics like internationalization, time zones, alternative calendars, validity, and so on, see the external documentation.
 */
class DateTime {
  /**
   * @access private
   */
  constructor(config) {
    const zone = config.zone || Settings.defaultZone;

    let invalid =
      config.invalid ||
      (Number.isNaN(config.ts) ? new Invalid("invalid input") : null) ||
      (!zone.isValid ? unsupportedZone(zone) : null);
    /**
     * @access private
     */
    this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;

    let c = null,
      o = null;
    if (!invalid) {
      const unchanged = config.old && config.old.ts === this.ts && config.old.zone.equals(zone);

      if (unchanged) {
        [c, o] = [config.old.c, config.old.o];
      } else {
        const ot = zone.offset(this.ts);
        c = tsToObj(this.ts, ot);
        invalid = Number.isNaN(c.year) ? new Invalid("invalid input") : null;
        c = invalid ? null : c;
        o = invalid ? null : ot;
      }
    }

    /**
     * @access private
     */
    this._zone = zone;
    /**
     * @access private
     */
    this.loc = config.loc || Locale.create();
    /**
     * @access private
     */
    this.invalid = invalid;
    /**
     * @access private
     */
    this.weekData = null;
    /**
     * @access private
     */
    this.c = c;
    /**
     * @access private
     */
    this.o = o;
    /**
     * @access private
     */
    this.isLuxonDateTime = true;
  }

  // CONSTRUCT

  /**
   * Create a DateTime for the current instant, in the system's time zone.
   *
   * Use Settings to override these default values if needed.
   * @example DateTime.now().toISO() //~> now in the ISO format
   * @return {DateTime}
   */
  static now() {
    return new DateTime({});
  }

  /**
   * Create a local DateTime
   * @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month, 1-indexed
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @example DateTime.local()                                  //~> now
   * @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
   * @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
   * @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
   * @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
   * @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
   * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
   * @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
   * @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
   * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
   * @return {DateTime}
   */
  static local() {
    const [opts, args] = lastOpts(arguments),
      [year, month, day, hour, minute, second, millisecond] = args;
    return quickDT({ year, month, day, hour, minute, second, millisecond }, opts);
  }

  /**
   * Create a DateTime in UTC
   * @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @param {Object} options - configuration options for the DateTime
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @example DateTime.utc()                                              //~> now
   * @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
   * @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
   * @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
   * @return {DateTime}
   */
  static utc() {
    const [opts, args] = lastOpts(arguments),
      [year, month, day, hour, minute, second, millisecond] = args;

    opts.zone = FixedOffsetZone.utcInstance;
    return quickDT({ year, month, day, hour, minute, second, millisecond }, opts);
  }

  /**
   * Create a DateTime from a JavaScript Date object. Uses the default zone.
   * @param {Date} date - a JavaScript Date object
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @return {DateTime}
   */
  static fromJSDate(date, options = {}) {
    const ts = isDate(date) ? date.valueOf() : NaN;
    if (Number.isNaN(ts)) {
      return DateTime.invalid("invalid input");
    }

    const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }

    return new DateTime({
      ts: ts,
      zone: zoneToUse,
      loc: Locale.fromObject(options),
    });
  }

  /**
   * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} milliseconds - a number of milliseconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromMillis(milliseconds, options = {}) {
    if (!isNumber(milliseconds)) {
      throw new InvalidArgumentError(
        `fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`
      );
    } else if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) {
      // this isn't perfect because because we can still end up out of range because of additional shifting, but it's a start
      return DateTime.invalid("Timestamp out of range");
    } else {
      return new DateTime({
        ts: milliseconds,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options),
      });
    }
  }

  /**
   * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} seconds - a number of seconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromSeconds(seconds, options = {}) {
    if (!isNumber(seconds)) {
      throw new InvalidArgumentError("fromSeconds requires a numerical input");
    } else {
      return new DateTime({
        ts: seconds * 1000,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options),
      });
    }
  }

  /**
   * Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.year - a year, such as 1987
   * @param {number} obj.month - a month, 1-12
   * @param {number} obj.day - a day of the month, 1-31, depending on the month
   * @param {number} obj.ordinal - day of the year, 1-365 or 366
   * @param {number} obj.weekYear - an ISO week year
   * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
   * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
   * @param {number} obj.hour - hour of the day, 0-23
   * @param {number} obj.minute - minute of the hour, 0-59
   * @param {number} obj.second - second of the minute, 0-59
   * @param {number} obj.millisecond - millisecond of the second, 0-999
   * @param {Object} opts - options for creating this DateTime
   * @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
   * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
   * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
   * @return {DateTime}
   */
  static fromObject(obj, opts = {}) {
    obj = obj || {};
    const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }

    const tsNow = Settings.now(),
      offsetProvis = !isUndefined(opts.specificOffset)
        ? opts.specificOffset
        : zoneToUse.offset(tsNow),
      normalized = normalizeObject(obj, normalizeUnit),
      containsOrdinal = !isUndefined(normalized.ordinal),
      containsGregorYear = !isUndefined(normalized.year),
      containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day),
      containsGregor = containsGregorYear || containsGregorMD,
      definiteWeekDef = normalized.weekYear || normalized.weekNumber,
      loc = Locale.fromObject(opts);

    // cases:
    // just a weekday -> this week's instance of that weekday, no worries
    // (gregorian data or ordinal) + (weekYear or weekNumber) -> error
    // (gregorian month or day) + ordinal -> error
    // otherwise just use weeks or ordinals or gregorian, depending on what's specified

    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError(
        "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
      );
    }

    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }

    const useWeekData = definiteWeekDef || (normalized.weekday && !containsGregor);

    // configure ourselves to deal with gregorian dates or week stuff
    let units,
      defaultValues,
      objNow = tsToObj(tsNow, offsetProvis);
    if (useWeekData) {
      units = orderedWeekUnits;
      defaultValues = defaultWeekUnitValues;
      objNow = gregorianToWeek(objNow);
    } else if (containsOrdinal) {
      units = orderedOrdinalUnits;
      defaultValues = defaultOrdinalUnitValues;
      objNow = gregorianToOrdinal(objNow);
    } else {
      units = orderedUnits;
      defaultValues = defaultUnitValues;
    }

    // set default values for missing stuff
    let foundFirst = false;
    for (const u of units) {
      const v = normalized[u];
      if (!isUndefined(v)) {
        foundFirst = true;
      } else if (foundFirst) {
        normalized[u] = defaultValues[u];
      } else {
        normalized[u] = objNow[u];
      }
    }

    // make sure the values we have are in range
    const higherOrderInvalid = useWeekData
        ? hasInvalidWeekData(normalized)
        : containsOrdinal
        ? hasInvalidOrdinalData(normalized)
        : hasInvalidGregorianData(normalized),
      invalid = higherOrderInvalid || hasInvalidTimeData(normalized);

    if (invalid) {
      return DateTime.invalid(invalid);
    }

    // compute the actual time
    const gregorian = useWeekData
        ? weekToGregorian(normalized)
        : containsOrdinal
        ? ordinalToGregorian(normalized)
        : normalized,
      [tsFinal, offsetFinal] = objToTS(gregorian, offsetProvis, zoneToUse),
      inst = new DateTime({
        ts: tsFinal,
        zone: zoneToUse,
        o: offsetFinal,
        loc,
      });

    // gregorian data + weekday serves only to validate
    if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) {
      return DateTime.invalid(
        "mismatched weekday",
        `you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`
      );
    }

    return inst;
  }

  /**
   * Create a DateTime from an ISO 8601 string
   * @param {string} text - the ISO string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromISO('2016-05-25T09:08:34.123')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
   * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
   * @example DateTime.fromISO('2016-W05-4')
   * @return {DateTime}
   */
  static fromISO(text, opts = {}) {
    const [vals, parsedZone] = parseISODate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
  }

  /**
   * Create a DateTime from an RFC 2822 string
   * @param {string} text - the RFC 2822 string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
   * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
   * @return {DateTime}
   */
  static fromRFC2822(text, opts = {}) {
    const [vals, parsedZone] = parseRFC2822Date(text);
    return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
  }

  /**
   * Create a DateTime from an HTTP header date
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @param {string} text - the HTTP header date
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
   * @return {DateTime}
   */
  static fromHTTP(text, opts = {}) {
    const [vals, parsedZone] = parseHTTPDate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "HTTP", opts);
  }

  /**
   * Create a DateTime from an input string and format string.
   * Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromFormat(text, fmt, opts = {}) {
    if (isUndefined(text) || isUndefined(fmt)) {
      throw new InvalidArgumentError("fromFormat requires an input string and a format");
    }

    const { locale = null, numberingSystem = null } = opts,
      localeToUse = Locale.fromOpts({
        locale,
        numberingSystem,
        defaultToEN: true,
      }),
      [vals, parsedZone, specificOffset, invalid] = parseFromTokens(localeToUse, text, fmt);
    if (invalid) {
      return DateTime.invalid(invalid);
    } else {
      return parseDataToDateTime(vals, parsedZone, opts, `format ${fmt}`, text, specificOffset);
    }
  }

  /**
   * @deprecated use fromFormat instead
   */
  static fromString(text, fmt, opts = {}) {
    return DateTime.fromFormat(text, fmt, opts);
  }

  /**
   * Create a DateTime from a SQL date, time, or datetime
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @example DateTime.fromSQL('2017-05-15')
   * @example DateTime.fromSQL('2017-05-15 09:12:34')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
   * @example DateTime.fromSQL('09:12:34.342')
   * @return {DateTime}
   */
  static fromSQL(text, opts = {}) {
    const [vals, parsedZone] = parseSQL(text);
    return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
  }

  /**
   * Create an invalid DateTime.
   * @param {DateTime} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
    }

    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);

    if (Settings.throwOnInvalid) {
      throw new InvalidDateTimeError(invalid);
    } else {
      return new DateTime({ invalid });
    }
  }

  /**
   * Check if an object is an instance of DateTime. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDateTime(o) {
    return (o && o.isLuxonDateTime) || false;
  }

  /**
   * Produce the format string for a set of options
   * @param formatOpts
   * @param localeOpts
   * @returns {string}
   */
  static parseFormatForOpts(formatOpts, localeOpts = {}) {
    const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));
    return !tokenList ? null : tokenList.map((t) => (t ? t.val : null)).join("");
  }

  /**
   * Produce the the fully expanded format token for the locale
   * Does NOT quote characters, so quoted tokens will not round trip correctly
   * @param fmt
   * @param localeOpts
   * @returns {string}
   */
  static expandFormat(fmt, localeOpts = {}) {
    const expanded = expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts));
    return expanded.map((t) => t.val).join("");
  }

  // INFO

  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
   * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
   * @return {number}
   */
  get(unit) {
    return this[unit];
  }

  /**
   * Returns whether the DateTime is valid. Invalid DateTimes occur when:
   * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
   * * The DateTime was created by an operation on another invalid date
   * @type {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }

  /**
   * Returns an error code if this DateTime is invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }

  /**
   * Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }

  /**
   * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
   *
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }

  /**
   * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }

  /**
   * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
   *
   * @type {string}
   */
  get outputCalendar() {
    return this.isValid ? this.loc.outputCalendar : null;
  }

  /**
   * Get the time zone associated with this DateTime.
   * @type {Zone}
   */
  get zone() {
    return this._zone;
  }

  /**
   * Get the name of the time zone.
   * @type {string}
   */
  get zoneName() {
    return this.isValid ? this.zone.name : null;
  }

  /**
   * Get the year
   * @example DateTime.local(2017, 5, 25).year //=> 2017
   * @type {number}
   */
  get year() {
    return this.isValid ? this.c.year : NaN;
  }

  /**
   * Get the quarter
   * @example DateTime.local(2017, 5, 25).quarter //=> 2
   * @type {number}
   */
  get quarter() {
    return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
  }

  /**
   * Get the month (1-12).
   * @example DateTime.local(2017, 5, 25).month //=> 5
   * @type {number}
   */
  get month() {
    return this.isValid ? this.c.month : NaN;
  }

  /**
   * Get the day of the month (1-30ish).
   * @example DateTime.local(2017, 5, 25).day //=> 25
   * @type {number}
   */
  get day() {
    return this.isValid ? this.c.day : NaN;
  }

  /**
   * Get the hour of the day (0-23).
   * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
   * @type {number}
   */
  get hour() {
    return this.isValid ? this.c.hour : NaN;
  }

  /**
   * Get the minute of the hour (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
   * @type {number}
   */
  get minute() {
    return this.isValid ? this.c.minute : NaN;
  }

  /**
   * Get the second of the minute (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
   * @type {number}
   */
  get second() {
    return this.isValid ? this.c.second : NaN;
  }

  /**
   * Get the millisecond of the second (0-999).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
   * @type {number}
   */
  get millisecond() {
    return this.isValid ? this.c.millisecond : NaN;
  }

  /**
   * Get the week year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 12, 31).weekYear //=> 2015
   * @type {number}
   */
  get weekYear() {
    return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
  }

  /**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */
  get weekNumber() {
    return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
  }

  /**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */
  get weekday() {
    return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
  }

  /**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */
  get ordinal() {
    return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
  }

  /**
   * Get the human readable short month name, such as 'Oct'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
   * @type {string}
   */
  get monthShort() {
    return this.isValid ? Info.months("short", { locObj: this.loc })[this.month - 1] : null;
  }

  /**
   * Get the human readable long month name, such as 'October'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthLong //=> October
   * @type {string}
   */
  get monthLong() {
    return this.isValid ? Info.months("long", { locObj: this.loc })[this.month - 1] : null;
  }

  /**
   * Get the human readable short weekday, such as 'Mon'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
   * @type {string}
   */
  get weekdayShort() {
    return this.isValid ? Info.weekdays("short", { locObj: this.loc })[this.weekday - 1] : null;
  }

  /**
   * Get the human readable long weekday, such as 'Monday'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
   * @type {string}
   */
  get weekdayLong() {
    return this.isValid ? Info.weekdays("long", { locObj: this.loc })[this.weekday - 1] : null;
  }

  /**
   * Get the UTC offset of this DateTime in minutes
   * @example DateTime.now().offset //=> -240
   * @example DateTime.utc().offset //=> 0
   * @type {number}
   */
  get offset() {
    return this.isValid ? +this.o : NaN;
  }

  /**
   * Get the short human name for the zone's current offset, for example "EST" or "EDT".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameShort() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "short",
        locale: this.locale,
      });
    } else {
      return null;
    }
  }

  /**
   * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameLong() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "long",
        locale: this.locale,
      });
    } else {
      return null;
    }
  }

  /**
   * Get whether this zone's offset ever changes, as in a DST.
   * @type {boolean}
   */
  get isOffsetFixed() {
    return this.isValid ? this.zone.isUniversal : null;
  }

  /**
   * Get whether the DateTime is in a DST.
   * @type {boolean}
   */
  get isInDST() {
    if (this.isOffsetFixed) {
      return false;
    } else {
      return (
        this.offset > this.set({ month: 1, day: 1 }).offset ||
        this.offset > this.set({ month: 5 }).offset
      );
    }
  }

  /**
   * Returns true if this DateTime is in a leap year, false otherwise
   * @example DateTime.local(2016).isInLeapYear //=> true
   * @example DateTime.local(2013).isInLeapYear //=> false
   * @type {boolean}
   */
  get isInLeapYear() {
    return isLeapYear(this.year);
  }

  /**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */
  get daysInMonth() {
    return daysInMonth(this.year, this.month);
  }

  /**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */
  get daysInYear() {
    return this.isValid ? daysInYear(this.year) : NaN;
  }

  /**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */
  get weeksInWeekYear() {
    return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
  }

  /**
   * Returns the resolved Intl options for this DateTime.
   * This is useful in understanding the behavior of formatting methods
   * @param {Object} opts - the same options as toLocaleString
   * @return {Object}
   */
  resolvedLocaleOptions(opts = {}) {
    const { locale, numberingSystem, calendar } = Formatter.create(
      this.loc.clone(opts),
      opts
    ).resolvedOptions(this);
    return { locale, numberingSystem, outputCalendar: calendar };
  }

  // TRANSFORM

  /**
   * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
   *
   * Equivalent to {@link DateTime#setZone}('utc')
   * @param {number} [offset=0] - optionally, an offset from UTC in minutes
   * @param {Object} [opts={}] - options to pass to `setZone()`
   * @return {DateTime}
   */
  toUTC(offset = 0, opts = {}) {
    return this.setZone(FixedOffsetZone.instance(offset), opts);
  }

  /**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */
  toLocal() {
    return this.setZone(Settings.defaultZone);
  }

  /**
   * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
   *
   * By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
   * @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
   * @param {Object} opts - options
   * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
   * @return {DateTime}
   */
  setZone(zone, { keepLocalTime = false, keepCalendarTime = false } = {}) {
    zone = normalizeZone(zone, Settings.defaultZone);
    if (zone.equals(this.zone)) {
      return this;
    } else if (!zone.isValid) {
      return DateTime.invalid(unsupportedZone(zone));
    } else {
      let newTS = this.ts;
      if (keepLocalTime || keepCalendarTime) {
        const offsetGuess = zone.offset(this.ts);
        const asObj = this.toObject();
        [newTS] = objToTS(asObj, offsetGuess, zone);
      }
      return clone(this, { ts: newTS, zone });
    }
  }

  /**
   * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
   * @param {Object} properties - the properties to set
   * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
   * @return {DateTime}
   */
  reconfigure({ locale, numberingSystem, outputCalendar } = {}) {
    const loc = this.loc.clone({ locale, numberingSystem, outputCalendar });
    return clone(this, { loc });
  }

  /**
   * "Set" the locale. Returns a newly-constructed DateTime.
   * Just a convenient alias for reconfigure({ locale })
   * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
   * @return {DateTime}
   */
  setLocale(locale) {
    return this.reconfigure({ locale });
  }

  /**
   * "Set" the values of specified units. Returns a newly-constructed DateTime.
   * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
   * @param {Object} values - a mapping of units to numbers
   * @example dt.set({ year: 2017 })
   * @example dt.set({ hour: 8, minute: 30 })
   * @example dt.set({ weekday: 5 })
   * @example dt.set({ year: 2005, ordinal: 234 })
   * @return {DateTime}
   */
  set(values) {
    if (!this.isValid) return this;

    const normalized = normalizeObject(values, normalizeUnit),
      settingWeekStuff =
        !isUndefined(normalized.weekYear) ||
        !isUndefined(normalized.weekNumber) ||
        !isUndefined(normalized.weekday),
      containsOrdinal = !isUndefined(normalized.ordinal),
      containsGregorYear = !isUndefined(normalized.year),
      containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day),
      containsGregor = containsGregorYear || containsGregorMD,
      definiteWeekDef = normalized.weekYear || normalized.weekNumber;

    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError(
        "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
      );
    }

    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }

    let mixed;
    if (settingWeekStuff) {
      mixed = weekToGregorian({ ...gregorianToWeek(this.c), ...normalized });
    } else if (!isUndefined(normalized.ordinal)) {
      mixed = ordinalToGregorian({ ...gregorianToOrdinal(this.c), ...normalized });
    } else {
      mixed = { ...this.toObject(), ...normalized };

      // if we didn't set the day but we ended up on an overflow date,
      // use the last day of the right month
      if (isUndefined(normalized.day)) {
        mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
      }
    }

    const [ts, o] = objToTS(mixed, this.o, this.zone);
    return clone(this, { ts, o });
  }

  /**
   * Add a period of time to this DateTime and return the resulting DateTime
   *
   * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @example DateTime.now().plus(123) //~> in 123 milliseconds
   * @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
   * @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
   * @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
   * @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
   * @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
   * @return {DateTime}
   */
  plus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration);
    return clone(this, adjustTime(this, dur));
  }

  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */
  minus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration).negate();
    return clone(this, adjustTime(this, dur));
  }

  /**
   * "Set" this DateTime to the beginning of a unit of time.
   * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
   * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
   * @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
   * @return {DateTime}
   */
  startOf(unit) {
    if (!this.isValid) return this;
    const o = {},
      normalizedUnit = Duration.normalizeUnit(unit);
    switch (normalizedUnit) {
      case "years":
        o.month = 1;
      // falls through
      case "quarters":
      case "months":
        o.day = 1;
      // falls through
      case "weeks":
      case "days":
        o.hour = 0;
      // falls through
      case "hours":
        o.minute = 0;
      // falls through
      case "minutes":
        o.second = 0;
      // falls through
      case "seconds":
        o.millisecond = 0;
        break;
      // no default, invalid units throw in normalizeUnit()
    }

    if (normalizedUnit === "weeks") {
      o.weekday = 1;
    }

    if (normalizedUnit === "quarters") {
      const q = Math.ceil(this.month / 3);
      o.month = (q - 1) * 3 + 1;
    }

    return this.set(o);
  }

  /**
   * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
   * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
   * @return {DateTime}
   */
  endOf(unit) {
    return this.isValid
      ? this.plus({ [unit]: 1 })
          .startOf(unit)
          .minus(1)
      : this;
  }

  // OUTPUT

  /**
   * Returns a string representation of this DateTime formatted according to the specified format string.
   * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
   * Defaults to en-US if no locale has been specified, regardless of the system's locale.
   * @param {string} fmt - the format string
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
   * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
   * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
   * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    return this.isValid
      ? Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt)
      : INVALID$1;
  }

  /**
   * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
   * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
   * of the DateTime in the assigned locale.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toLocaleString(); //=> 4/20/2017
   * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
   * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
   * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
   * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
   * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
   * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid
      ? Formatter.create(this.loc.clone(opts), formatOpts).formatDateTime(this)
      : INVALID$1;
  }

  /**
   * Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
   * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
   * @example DateTime.now().toLocaleParts(); //=> [
   *                                   //=>   { type: 'day', value: '25' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'month', value: '05' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'year', value: '1982' }
   *                                   //=> ]
   */
  toLocaleParts(opts = {}) {
    return this.isValid
      ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this)
      : [];
  }

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=false] - add the time zone format extension
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
   * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
   * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
   * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
   * @return {string}
   */
  toISO({
    format = "extended",
    suppressSeconds = false,
    suppressMilliseconds = false,
    includeOffset = true,
    extendedZone = false,
  } = {}) {
    if (!this.isValid) {
      return null;
    }

    const ext = format === "extended";

    let c = toISODate(this, ext);
    c += "T";
    c += toISOTime(this, ext, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
    return c;
  }

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @param {Object} opts - options
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
   * @return {string}
   */
  toISODate({ format = "extended" } = {}) {
    if (!this.isValid) {
      return null;
    }

    return toISODate(this, format === "extended");
  }

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */
  toISOWeekDate() {
    return toTechFormat(this, "kkkk-'W'WW-c");
  }

  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's time component
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=true] - add the time zone format extension
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
   * @return {string}
   */
  toISOTime({
    suppressMilliseconds = false,
    suppressSeconds = false,
    includeOffset = true,
    includePrefix = false,
    extendedZone = false,
    format = "extended",
  } = {}) {
    if (!this.isValid) {
      return null;
    }

    let c = includePrefix ? "T" : "";
    return (
      c +
      toISOTime(
        this,
        format === "extended",
        suppressSeconds,
        suppressMilliseconds,
        includeOffset,
        extendedZone
      )
    );
  }

  /**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */
  toRFC2822() {
    return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
  }

  /**
   * Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
   * Specifically, the string conforms to RFC 1123.
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
   * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
   * @return {string}
   */
  toHTTP() {
    return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  }

  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string}
   */
  toSQLDate() {
    if (!this.isValid) {
      return null;
    }
    return toISODate(this, true);
  }

  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Time
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc().toSQL() //=> '05:15:16.345'
   * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
   * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
   * @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
   * @return {string}
   */
  toSQLTime({ includeOffset = true, includeZone = false, includeOffsetSpace = true } = {}) {
    let fmt = "HH:mm:ss.SSS";

    if (includeZone || includeOffset) {
      if (includeOffsetSpace) {
        fmt += " ";
      }
      if (includeZone) {
        fmt += "z";
      } else if (includeOffset) {
        fmt += "ZZ";
      }
    }

    return toTechFormat(this, fmt, true);
  }

  /**
   * Returns a string representation of this DateTime appropriate for use in SQL DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
   * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
   * @return {string}
   */
  toSQL(opts = {}) {
    if (!this.isValid) {
      return null;
    }

    return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
  }

  /**
   * Returns a string representation of this DateTime appropriate for debugging
   * @return {string}
   */
  toString() {
    return this.isValid ? this.toISO() : INVALID$1;
  }

  /**
   * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }

  /**
   * Returns the epoch milliseconds of this DateTime.
   * @return {number}
   */
  toMillis() {
    return this.isValid ? this.ts : NaN;
  }

  /**
   * Returns the epoch seconds of this DateTime.
   * @return {number}
   */
  toSeconds() {
    return this.isValid ? this.ts / 1000 : NaN;
  }

  /**
   * Returns the epoch seconds (as a whole number) of this DateTime.
   * @return {number}
   */
  toUnixInteger() {
    return this.isValid ? Math.floor(this.ts / 1000) : NaN;
  }

  /**
   * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }

  /**
   * Returns a BSON serializable equivalent to this DateTime.
   * @return {Date}
   */
  toBSON() {
    return this.toJSDate();
  }

  /**
   * Returns a JavaScript object with this DateTime's year, month, day, and so on.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
   * @return {Object}
   */
  toObject(opts = {}) {
    if (!this.isValid) return {};

    const base = { ...this.c };

    if (opts.includeConfig) {
      base.outputCalendar = this.outputCalendar;
      base.numberingSystem = this.loc.numberingSystem;
      base.locale = this.loc.locale;
    }
    return base;
  }

  /**
   * Returns a JavaScript Date equivalent to this DateTime.
   * @return {Date}
   */
  toJSDate() {
    return new Date(this.isValid ? this.ts : NaN);
  }

  // COMPARE

  /**
   * Return the difference between two DateTimes as a Duration.
   * @param {DateTime} otherDateTime - the DateTime to compare this one to
   * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example
   * var i1 = DateTime.fromISO('1982-05-25T09:45'),
   *     i2 = DateTime.fromISO('1983-10-14T10:30');
   * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
   * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
   * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
   * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
   * @return {Duration}
   */
  diff(otherDateTime, unit = "milliseconds", opts = {}) {
    if (!this.isValid || !otherDateTime.isValid) {
      return Duration.invalid("created by diffing an invalid DateTime");
    }

    const durOpts = { locale: this.locale, numberingSystem: this.numberingSystem, ...opts };

    const units = maybeArray(unit).map(Duration.normalizeUnit),
      otherIsLater = otherDateTime.valueOf() > this.valueOf(),
      earlier = otherIsLater ? this : otherDateTime,
      later = otherIsLater ? otherDateTime : this,
      diffed = diff(earlier, later, units, durOpts);

    return otherIsLater ? diffed.negate() : diffed;
  }

  /**
   * Return the difference between this DateTime and right now.
   * See {@link DateTime#diff}
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  diffNow(unit = "milliseconds", opts = {}) {
    return this.diff(DateTime.now(), unit, opts);
  }

  /**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval}
   */
  until(otherDateTime) {
    return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
  }

  /**
   * Return whether this DateTime is in the same unit of time as another DateTime.
   * Higher-order units must also be identical for this function to return `true`.
   * Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
   * @param {DateTime} otherDateTime - the other DateTime
   * @param {string} unit - the unit of time to check sameness on
   * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
   * @return {boolean}
   */
  hasSame(otherDateTime, unit) {
    if (!this.isValid) return false;

    const inputMs = otherDateTime.valueOf();
    const adjustedToZone = this.setZone(otherDateTime.zone, { keepLocalTime: true });
    return adjustedToZone.startOf(unit) <= inputMs && inputMs <= adjustedToZone.endOf(unit);
  }

  /**
   * Equality check
   * Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
   * To compare just the millisecond values, use `+dt1 === +dt2`.
   * @param {DateTime} other - the other DateTime
   * @return {boolean}
   */
  equals(other) {
    return (
      this.isValid &&
      other.isValid &&
      this.valueOf() === other.valueOf() &&
      this.zone.equals(other.zone) &&
      this.loc.equals(other.loc)
    );
  }

  /**
   * Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
   * platform supports Intl.RelativeTimeFormat. Rounds down by default.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
   * @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
   * @param {boolean} [options.round=true] - whether to round the numbers in the output.
   * @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
   * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
   * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
   * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
   * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
   * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
   */
  toRelative(options = {}) {
    if (!this.isValid) return null;
    const base = options.base || DateTime.fromObject({}, { zone: this.zone }),
      padding = options.padding ? (this < base ? -options.padding : options.padding) : 0;
    let units = ["years", "months", "days", "hours", "minutes", "seconds"];
    let unit = options.unit;
    if (Array.isArray(options.unit)) {
      units = options.unit;
      unit = undefined;
    }
    return diffRelative(base, this.plus(padding), {
      ...options,
      numeric: "always",
      units,
      unit,
    });
  }

  /**
   * Returns a string representation of this date relative to today, such as "yesterday" or "next month".
   * Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
   * @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
   * @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
   */
  toRelativeCalendar(options = {}) {
    if (!this.isValid) return null;

    return diffRelative(options.base || DateTime.fromObject({}, { zone: this.zone }), this, {
      ...options,
      numeric: "auto",
      units: ["years", "months", "days"],
      calendary: true,
    });
  }

  /**
   * Return the min of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
   * @return {DateTime} the min DateTime, or undefined if called with no argument
   */
  static min(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("min requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i) => i.valueOf(), Math.min);
  }

  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */
  static max(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("max requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i) => i.valueOf(), Math.max);
  }

  // MISC

  /**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */
  static fromFormatExplain(text, fmt, options = {}) {
    const { locale = null, numberingSystem = null } = options,
      localeToUse = Locale.fromOpts({
        locale,
        numberingSystem,
        defaultToEN: true,
      });
    return explainFromTokens(localeToUse, text, fmt);
  }

  /**
   * @deprecated use fromFormatExplain instead
   */
  static fromStringExplain(text, fmt, options = {}) {
    return DateTime.fromFormatExplain(text, fmt, options);
  }

  // FORMAT PRESETS

  /**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */
  static get DATE_SHORT() {
    return DATE_SHORT;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED() {
    return DATE_MED;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED_WITH_WEEKDAY() {
    return DATE_MED_WITH_WEEKDAY;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */
  static get DATE_FULL() {
    return DATE_FULL;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */
  static get DATE_HUGE() {
    return DATE_HUGE;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_SIMPLE() {
    return TIME_SIMPLE;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SECONDS() {
    return TIME_WITH_SECONDS;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SHORT_OFFSET() {
    return TIME_WITH_SHORT_OFFSET;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_LONG_OFFSET() {
    return TIME_WITH_LONG_OFFSET;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_SIMPLE() {
    return TIME_24_SIMPLE;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SECONDS() {
    return TIME_24_WITH_SECONDS;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SHORT_OFFSET() {
    return TIME_24_WITH_SHORT_OFFSET;
  }

  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_LONG_OFFSET() {
    return TIME_24_WITH_LONG_OFFSET;
  }

  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT() {
    return DATETIME_SHORT;
  }

  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT_WITH_SECONDS() {
    return DATETIME_SHORT_WITH_SECONDS;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED() {
    return DATETIME_MED;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_SECONDS() {
    return DATETIME_MED_WITH_SECONDS;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_WEEKDAY() {
    return DATETIME_MED_WITH_WEEKDAY;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL() {
    return DATETIME_FULL;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL_WITH_SECONDS() {
    return DATETIME_FULL_WITH_SECONDS;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE() {
    return DATETIME_HUGE;
  }

  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE_WITH_SECONDS() {
    return DATETIME_HUGE_WITH_SECONDS;
  }
}

/**
 * @private
 */
function friendlyDateTime(dateTimeish) {
  if (DateTime.isDateTime(dateTimeish)) {
    return dateTimeish;
  } else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) {
    return DateTime.fromJSDate(dateTimeish);
  } else if (dateTimeish && typeof dateTimeish === "object") {
    return DateTime.fromObject(dateTimeish);
  } else {
    throw new InvalidArgumentError(
      `Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`
    );
  }
}

const VERSION = "3.3.0";

var _Luxon = /*#__PURE__*/Object.freeze({
  __proto__: null,
  DateTime: DateTime,
  Duration: Duration,
  FixedOffsetZone: FixedOffsetZone,
  IANAZone: IANAZone,
  Info: Info,
  Interval: Interval,
  InvalidZone: InvalidZone,
  Settings: Settings,
  SystemZone: SystemZone,
  VERSION: VERSION,
  Zone: Zone
});

var Utils;
((Utils2) => {
  function getAllMethodNames(obj, excludeContructors = false) {
    let _obj = obj;
    const methods = /* @__PURE__ */ new Set();
    while ((_obj = Reflect.getPrototypeOf(_obj)) && Reflect.getPrototypeOf(_obj)) {
      const keys = Reflect.ownKeys(_obj);
      keys.filter((key) => !excludeContructors || key !== "constructor").forEach((key) => methods.add(key));
    }
    return Array.from(methods, (value) => value.toString()).sort();
  }
  Utils2.getAllMethodNames = getAllMethodNames;
})(Utils || (Utils = {}));
var TimeZone;
((TimeZone2) => {
  function getRawOffset(timeZoneId) {
    const janDateTime = DateTime.fromObject({
      month: 1,
      day: 1
    }, { zone: timeZoneId });
    const julyDateTime = janDateTime.set({ month: 7 });
    let rawOffsetMinutes;
    if (janDateTime.offset === julyDateTime.offset) {
      rawOffsetMinutes = janDateTime.offset;
    } else {
      const max = Math.max(janDateTime.offset, julyDateTime.offset);
      rawOffsetMinutes = max < 0 ? 0 - max : 0 - Math.min(janDateTime.offset, julyDateTime.offset);
    }
    return rawOffsetMinutes * 60 * 1e3;
  }
  TimeZone2.getRawOffset = getRawOffset;
  function getDisplayName(timeZoneId, date = DateTime.local(), short = false) {
    return Info.normalizeZone(timeZoneId).offsetName(date.toMillis(), { format: short ? "short" : "long" });
  }
  TimeZone2.getDisplayName = getDisplayName;
  function getDSTSavings(timeZoneId) {
    return Info.hasDST(timeZoneId) ? 36e5 : 0;
  }
  TimeZone2.getDSTSavings = getDSTSavings;
  function getOffset(timeZoneId, millisSinceEpoch) {
    return Info.normalizeZone(timeZoneId).offset(millisSinceEpoch) * 60 * 1e3;
  }
  TimeZone2.getOffset = getOffset;
})(TimeZone || (TimeZone = {}));
var Calendar;
((Calendar2) => {
  Calendar2.JANUARY = 0;
  Calendar2.FEBRUARY = 1;
  Calendar2.MARCH = 2;
  Calendar2.APRIL = 3;
  Calendar2.MAY = 4;
  Calendar2.JUNE = 5;
  Calendar2.JULY = 6;
  Calendar2.AUGUST = 7;
  Calendar2.SEPTEMBER = 8;
  Calendar2.OCTOBER = 9;
  Calendar2.NOVEMBER = 10;
  Calendar2.DECEMBER = 11;
  Calendar2.SUNDAY = 1;
  Calendar2.MONDAY = 2;
  Calendar2.TUESDAY = 3;
  Calendar2.WEDNESDAY = 4;
  Calendar2.THURSDAY = 5;
  Calendar2.FRIDAY = 6;
  Calendar2.SATURDAY = 7;
  Calendar2.DATE = 5;
  Calendar2.MONTH = 2;
  Calendar2.YEAR = 1;
})(Calendar || (Calendar = {}));
var MathUtils;
((MathUtils2) => {
  function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }
  MathUtils2.degreesToRadians = degreesToRadians;
  function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
  }
  MathUtils2.radiansToDegrees = radiansToDegrees;
})(MathUtils || (MathUtils = {}));
var StringUtils;
((StringUtils2) => {
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
  StringUtils2.compareTo = compareTo;
})(StringUtils || (StringUtils = {}));
var IntegerUtils;
((IntegerUtils2) => {
  function compare(x, y) {
    if (x === y)
      return 0;
    return x > y ? 1 : -1;
  }
  IntegerUtils2.compare = compare;
})(IntegerUtils || (IntegerUtils = {}));
const Long_MIN_VALUE = NaN;
function padZeros(num, places) {
  const int = Math.trunc(num);
  if (int >= Math.pow(10, places))
    return int.toString();
  return "0".repeat(places).concat(int.toString()).slice(-places);
}

class BaseCustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
class NullPointerException extends BaseCustomError {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    super();
  }
}
class IllegalArgumentException extends BaseCustomError {
}
class UnsupportedError extends BaseCustomError {
}

var __defProp$g = Object.defineProperty;
var __defNormalProp$g = (obj, key, value) => key in obj ? __defProp$g(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$g = (obj, key, value) => {
  __defNormalProp$g(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _GeoLocation = class _GeoLocation {
  constructor(name = "Greenwich, England", latitude = 51.4772, longitude = 0, elevationOrTimeZoneId, timeZoneId) {
    /**
     * @see #getLatitude()
     * @see #setLatitude(double)
     * @see #setLatitude(int, int, double, String)
     */
    __publicField$g(this, "latitude");
    /**
     * @see #getLongitude()
     * @see #setLongitude(double)
     * @see #setLongitude(int, int, double, String)
     */
    __publicField$g(this, "longitude");
    /**
     * @see #getLocationName()
     * @see #setLocationName(String)
     */
    __publicField$g(this, "locationName", null);
    /**
     * @see #getTimeZone()
     * @see #setTimeZone(TimeZone)
     */
    __publicField$g(this, "timeZoneId");
    /**
     * @see #getElevation()
     * @see #setElevation(double)
     */
    __publicField$g(this, "elevation");
    let elevation = 0;
    if (timeZoneId) {
      elevation = elevationOrTimeZoneId;
    } else {
      timeZoneId = elevationOrTimeZoneId;
    }
    this.setLocationName(name);
    this.setLatitude(latitude);
    this.setLongitude(longitude);
    this.setElevation(elevation);
    this.setTimeZone(timeZoneId);
  }
  /**
   * Method to get the elevation in Meters.
   *
   * @return Returns the elevation in Meters.
   */
  getElevation() {
    return this.elevation;
  }
  /**
   * Method to set the elevation in Meters <b>above </b> sea level.
   *
   * @param elevation
   *            The elevation to set in Meters. An IllegalArgumentException will be thrown if the value is a negative.
   */
  setElevation(elevation) {
    if (elevation < 0) {
      throw new IllegalArgumentException("Elevation cannot be negative");
    }
    this.elevation = elevation;
  }
  setLatitude(degreesOrLatitude, minutes, seconds, direction) {
    if (!minutes) {
      const latitude = degreesOrLatitude;
      if (latitude > 90 || latitude < -90) {
        throw new IllegalArgumentException("Latitude must be between -90 and  90");
      }
      this.latitude = latitude;
    } else {
      const degrees = degreesOrLatitude;
      let tempLat = degrees + (minutes + seconds / 60) / 60;
      if (tempLat > 90 || tempLat < 0) {
        throw new IllegalArgumentException("Latitude must be between 0 and  90. Use direction of S instead of negative.");
      }
      if (direction === "S") {
        tempLat *= -1;
      } else if (!(direction === "N")) {
        throw new IllegalArgumentException("Latitude direction must be N or S");
      }
      this.latitude = tempLat;
    }
  }
  /**
   * @return Returns the latitude.
   */
  getLatitude() {
    return this.latitude;
  }
  setLongitude(degreesOrLongitude, minutes, seconds, direction) {
    if (!minutes) {
      const longitude = degreesOrLongitude;
      if (longitude > 180 || longitude < -180) {
        throw new IllegalArgumentException("Longitude must be between -180 and  180");
      }
      this.longitude = longitude;
    } else {
      const degrees = degreesOrLongitude;
      let longTemp = degrees + (minutes + seconds / 60) / 60;
      if (longTemp > 180 || this.longitude < 0) {
        throw new IllegalArgumentException("Longitude must be between 0 and  180.  Use a direction of W instead of negative.");
      }
      if (direction === "W") {
        longTemp *= -1;
      } else if (!(direction === "E")) {
        throw new IllegalArgumentException("Longitude direction must be E or W");
      }
      this.longitude = longTemp;
    }
  }
  /**
   * @return Returns the longitude.
   */
  getLongitude() {
    return this.longitude;
  }
  /**
   * @return Returns the location name.
   */
  getLocationName() {
    return this.locationName;
  }
  /**
   * @param name
   *            The setter method for the display name.
   */
  setLocationName(name) {
    this.locationName = name;
  }
  /**
   * @return Returns the timeZone.
   */
  getTimeZone() {
    return this.timeZoneId;
  }
  /**
   * Method to set the TimeZone. If this is ever set after the GeoLocation is set in the
   * {@link AstronomicalCalendar}, it is critical that
   * {@link AstronomicalCalendar#getCalendar()}.
   * {@link java.util.Calendar#setTimeZone(TimeZone) setTimeZone(TimeZone)} be called in order for the
   * AstronomicalCalendar to output times in the expected offset. This situation will arise if the
   * AstronomicalCalendar is ever {@link AstronomicalCalendar#clone() cloned}.
   *
   * @param timeZone
   *            The timeZone to set.
   */
  setTimeZone(timeZoneId) {
    this.timeZoneId = timeZoneId;
  }
  /**
   * A method that will return the location's local mean time offset in milliseconds from local <a
   * href="http://en.wikipedia.org/wiki/Standard_time">standard time</a>. The globe is split into 360&deg;, with
   * 15&deg; per hour of the day. For a local that is at a longitude that is evenly divisible by 15 (longitude % 15 ==
   * 0), at solar {@link AstronomicalCalendar#getSunTransit() noon} (with adjustment for the <a
   * href="http://en.wikipedia.org/wiki/Equation_of_time">equation of time</a>) the sun should be directly overhead,
   * so a user who is 1&deg; west of this will have noon at 4 minutes after standard time noon, and conversely, a user
   * who is 1&deg; east of the 15&deg; longitude will have noon at 11:56 AM. Lakewood, N.J., whose longitude is
   * -74.2094, is 0.7906 away from the closest multiple of 15 at -75&deg;. This is multiplied by 4 to yield 3 minutes
   * and 10 seconds earlier than standard time. The offset returned does not account for the <a
   * href="http://en.wikipedia.org/wiki/Daylight_saving_time">Daylight saving time</a> offset since this class is
   * unaware of dates.
   *
   * @return the offset in milliseconds not accounting for Daylight saving time. A positive value will be returned
   *         East of the 15&deg; timezone line, and a negative value West of it.
   * @since 1.1
   */
  getLocalMeanTimeOffset() {
    return this.getLongitude() * 4 * _GeoLocation.MINUTE_MILLIS - TimeZone.getRawOffset(this.getTimeZone());
  }
  /**
   * Adjust the date for <a href="https://en.wikipedia.org/wiki/180th_meridian">antimeridian</a> crossover. This is
   * needed to deal with edge cases such as Samoa that use a different calendar date than expected based on their
   * geographic location.
   *
   * The actual Time Zone offset may deviate from the expected offset based on the longitude. Since the 'absolute time'
   * calculations are always based on longitudinal offset from UTC for a given date, the date is presumed to only
   * increase East of the Prime Meridian, and to only decrease West of it. For Time Zones that cross the antimeridian,
   * the date will be artificially adjusted before calculation to conform with this presumption.
   *
   * For example, Apia, Samoa with a longitude of -171.75 uses a local offset of +14:00.  When calculating sunrise for
   * 2018-02-03, the calculator should operate using 2018-02-02 since the expected zone is -11.  After determining the
   * UTC time, the local DST offset of <a href="https://en.wikipedia.org/wiki/UTC%2B14:00">UTC+14:00</a> should be applied
   * to bring the date back to 2018-02-03.
   *
   * @return the number of days to adjust the date This will typically be 0 unless the date crosses the antimeridian
   */
  getAntimeridianAdjustment() {
    const localHoursOffset = this.getLocalMeanTimeOffset() / _GeoLocation.HOUR_MILLIS;
    if (localHoursOffset >= 20) {
      return 1;
    } else if (localHoursOffset <= -20) {
      return -1;
    }
    return 0;
  }
  /**
   * Calculate the initial <a href="http://en.wikipedia.org/wiki/Great_circle">geodesic</a> bearing between this
   * Object and a second Object passed to this method using <a
   * href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty, "<a
   * href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the Ellipsoid
   * with application of nested equations</a>", Survey Review, vol XXII no 176, 1975
   *
   * @param location
   *            the destination location
   * @return the initial bearing
   */
  getGeodesicInitialBearing(location) {
    return this.vincentyFormula(location, _GeoLocation.INITIAL_BEARING);
  }
  /**
   * Calculate the final <a href="http://en.wikipedia.org/wiki/Great_circle">geodesic</a> bearing between this Object
   * and a second Object passed to this method using <a href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus
   * Vincenty's</a> inverse formula See T Vincenty, "<a href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and
   * Inverse Solutions of Geodesics on the Ellipsoid with application of nested equations</a>", Survey Review, vol
   * XXII no 176, 1975
   *
   * @param location
   *            the destination location
   * @return the final bearing
   */
  getGeodesicFinalBearing(location) {
    return this.vincentyFormula(location, _GeoLocation.FINAL_BEARING);
  }
  /**
   * Calculate <a href="http://en.wikipedia.org/wiki/Great-circle_distance">geodesic distance</a> in Meters between
   * this Object and a second Object passed to this method using <a
   * href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty, "<a
   * href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the Ellipsoid
   * with application of nested equations</a>", Survey Review, vol XXII no 176, 1975
   *
   * @see #vincentyFormula(GeoLocation, int)
   * @param location
   *            the destination location
   * @return the geodesic distance in Meters
   */
  getGeodesicDistance(location) {
    return this.vincentyFormula(location, _GeoLocation.DISTANCE);
  }
  /**
   * Calculate <a href="http://en.wikipedia.org/wiki/Great-circle_distance">geodesic distance</a> in Meters between
   * this Object and a second Object passed to this method using <a
   * href="http://en.wikipedia.org/wiki/Thaddeus_Vincenty">Thaddeus Vincenty's</a> inverse formula See T Vincenty, "<a
   * href="http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf">Direct and Inverse Solutions of Geodesics on the Ellipsoid
   * with application of nested equations</a>", Survey Review, vol XXII no 176, 1975
   *
   * @param location
   *            the destination location
   * @param formula
   *            This formula calculates initial bearing ({@link #INITIAL_BEARING}), final bearing (
   *            {@link #FINAL_BEARING}) and distance ({@link #DISTANCE}).
   * @return geodesic distance in Meters
   */
  vincentyFormula(location, formula) {
    const a = 6378137;
    const b = 63567523142e-4;
    const f = 1 / 298.257223563;
    const L = MathUtils.degreesToRadians(location.getLongitude() - this.getLongitude());
    const U1 = Math.atan((1 - f) * Math.tan(MathUtils.degreesToRadians(this.getLatitude())));
    const U2 = Math.atan((1 - f) * Math.tan(MathUtils.degreesToRadians(location.getLatitude())));
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
      sinSigma = Math.sqrt(cosU2 * sinLambda * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma === 0)
        return 0;
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      if (Number.isNaN(cos2SigmaM))
        cos2SigmaM = 0;
      C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    }
    if (iterLimit === 0)
      return Number.NaN;
    const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    const distance = b * A * (sigma - deltaSigma);
    const fwdAz = MathUtils.radiansToDegrees(Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
    const revAz = MathUtils.radiansToDegrees(Math.atan2(cosU1 * sinLambda, -sinU1 * cosU2 + cosU1 * sinU2 * cosLambda));
    if (formula === _GeoLocation.DISTANCE) {
      return distance;
    } else if (formula === _GeoLocation.INITIAL_BEARING) {
      return fwdAz;
    } else if (formula === _GeoLocation.FINAL_BEARING) {
      return revAz;
    }
    return Number.NaN;
  }
  /**
   * Returns the <a href="http://en.wikipedia.org/wiki/Rhumb_line">rhumb line</a> bearing from the current location to
   * the GeoLocation passed in.
   *
   * @param location
   *            destination location
   * @return the bearing in degrees
   */
  getRhumbLineBearing(location) {
    let dLon = MathUtils.degreesToRadians(location.getLongitude() - this.getLongitude());
    const dPhi = Math.log(Math.tan(MathUtils.degreesToRadians(location.getLatitude()) / 2 + Math.PI / 4) / Math.tan(MathUtils.degreesToRadians(this.getLatitude()) / 2 + Math.PI / 4));
    if (Math.abs(dLon) > Math.PI)
      dLon = dLon > 0 ? -(2 * Math.PI - dLon) : 2 * Math.PI + dLon;
    return MathUtils.radiansToDegrees(Math.atan2(dLon, dPhi));
  }
  /**
   * Returns the <a href="http://en.wikipedia.org/wiki/Rhumb_line">rhumb line</a> distance from the current location
   * to the GeoLocation passed in.
   *
   * @param location
   *            the destination location
   * @return the distance in Meters
   */
  getRhumbLineDistance(location) {
    const earthRadius = 6378137;
    const dLat = MathUtils.degreesToRadians(location.getLatitude()) - MathUtils.degreesToRadians(this.getLatitude());
    let dLon = Math.abs(MathUtils.degreesToRadians(location.getLongitude()) - MathUtils.degreesToRadians(this.getLongitude()));
    const dPhi = Math.log(Math.tan(MathUtils.degreesToRadians(location.getLatitude()) / 2 + Math.PI / 4) / Math.tan(MathUtils.degreesToRadians(this.getLatitude()) / 2 + Math.PI / 4));
    let q = dLat / dPhi;
    if (!Number.isFinite(q)) {
      q = Math.cos(MathUtils.degreesToRadians(this.getLatitude()));
    }
    if (dLon > Math.PI) {
      dLon = 2 * Math.PI - dLon;
    }
    const d = Math.sqrt(dLat * dLat + q * q * dLon * dLon);
    return d * earthRadius;
  }
  /**
   * A method that returns an XML formatted <code>String</code> representing the serialized <code>Object</code>. Very
   * similar to the toString method but the return value is in an xml format. The format currently used (subject to
   * change) is:
   *
   * <pre>
   *   &lt;GeoLocation&gt;
   *        &lt;LocationName&gt;Lakewood, NJ&lt;/LocationName&gt;
   *        &lt;Latitude&gt;40.0828&amp;deg&lt;/Latitude&gt;
   *        &lt;Longitude&gt;-74.2094&amp;deg&lt;/Longitude&gt;
   *        &lt;Elevation&gt;0 Meters&lt;/Elevation&gt;
   *        &lt;TimezoneName&gt;America/New_York&lt;/TimezoneName&gt;
   *        &lt;TimeZoneDisplayName&gt;Eastern Standard Time&lt;/TimeZoneDisplayName&gt;
   *        &lt;TimezoneGMTOffset&gt;-5&lt;/TimezoneGMTOffset&gt;
   *        &lt;TimezoneDSTOffset&gt;1&lt;/TimezoneDSTOffset&gt;
   *   &lt;/GeoLocation&gt;
   * </pre>
   *
   * @return The XML formatted <code>String</code>.
   * @deprecated
   */
  // eslint-disable-next-line class-methods-use-this
  toXML() {
    throw new UnsupportedError("This method is deprecated");
  }
  /**
   * @see java.lang.Object#equals(Object)
   */
  equals(object) {
    if (this === object)
      return true;
    if (!(object instanceof _GeoLocation))
      return false;
    const geo = object;
    return this.latitude === geo.latitude && this.longitude === geo.longitude && this.elevation === geo.elevation && this.locationName === geo.locationName && this.timeZoneId === geo.getTimeZone();
  }
  /**
   * @see java.lang.Object#toString()
   */
  toString() {
    return `Location Name:			${this.getLocationName()}`.concat(`
Latitude:			${this.getLatitude().toString()}\xB0`).concat(`
Longitude:			${this.getLongitude().toString()}\xB0`).concat(`
Elevation:			${this.getElevation().toString()} Meters`).concat(`
Timezone ID:			${this.getTimeZone()}`).concat(`
Timezone Display Name:		${TimeZone.getDisplayName(this.getTimeZone())}`).concat(` (${TimeZone.getDisplayName(this.getTimeZone(), DateTime.local(), true)})`).concat(`
Timezone GMT Offset:		${(TimeZone.getRawOffset(this.getTimeZone()) / _GeoLocation.HOUR_MILLIS).toString()}`).concat(`
Timezone DST Offset:		${(TimeZone.getDSTSavings(this.getTimeZone()) / _GeoLocation.HOUR_MILLIS).toString()}`);
  }
  /**
   * An implementation of the {@link java.lang.Object#clone()} method that creates a <a
   * href="http://en.wikipedia.org/wiki/Object_copy#Deep_copy">deep copy</a> of the object.
   * <b>Note:</b> If the {@link java.util.TimeZone} in the clone will be changed from the original, it is critical
   * that {@link AstronomicalCalendar#getCalendar()}.
   * {@link java.util.Calendar#setTimeZone(TimeZone) setTimeZone(TimeZone)} is called after cloning in order for the
   * AstronomicalCalendar to output times in the expected offset.
   *
   * @see java.lang.Object#clone()
   * @since 1.1
   */
  clone() {
    return JSON.parse(JSON.stringify(this));
  }
};
/**
 * Constant for a distance type calculation.
 * @see #getGeodesicDistance(GeoLocation)
 */
__publicField$g(_GeoLocation, "DISTANCE", 0);
/**
 * Constant for a initial bearing type calculation.
 * @see #getGeodesicInitialBearing(GeoLocation)
 */
__publicField$g(_GeoLocation, "INITIAL_BEARING", 1);
/**
 * Constant for a final bearing type calculation.
 * @see #getGeodesicFinalBearing(GeoLocation)
 */
__publicField$g(_GeoLocation, "FINAL_BEARING", 2);
/** constant for milliseconds in a minute (60,000) */
__publicField$g(_GeoLocation, "MINUTE_MILLIS", 60 * 1e3);
/** constant for milliseconds in an hour (3,600,000) */
__publicField$g(_GeoLocation, "HOUR_MILLIS", _GeoLocation.MINUTE_MILLIS * 60);
let GeoLocation = _GeoLocation;

/*
 *  big.js v6.2.1
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2022 Michael Mclaughlin
 *  https://github.com/MikeMcl/big.js/LICENCE.md
 */


/************************************** EDITABLE DEFAULTS *****************************************/


  // The default values below must be integers within the stated ranges.

  /*
   * The maximum number of decimal places (DP) of the results of operations involving division:
   * div and sqrt, and pow with negative exponents.
   */
var DP = 20,          // 0 to MAX_DP

  /*
   * The rounding mode (RM) used when rounding to the above decimal places.
   *
   *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
   *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
   *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
   *  3  Away from zero.                                  (ROUND_UP)
   */
  RM = 1,             // 0, 1, 2 or 3

  // The maximum value of DP and Big.DP.
  MAX_DP = 1E6,       // 0 to 1000000

  // The maximum magnitude of the exponent argument to the pow method.
  MAX_POWER = 1E6,    // 1 to 1000000

  /*
   * The negative exponent (NE) at and beneath which toString returns exponential notation.
   * (JavaScript numbers: -7)
   * -1000000 is the minimum recommended exponent value of a Big.
   */
  NE = -7,            // 0 to -1000000

  /*
   * The positive exponent (PE) at and above which toString returns exponential notation.
   * (JavaScript numbers: 21)
   * 1000000 is the maximum recommended exponent value of a Big, but this limit is not enforced.
   */
  PE = 21,            // 0 to 1000000

  /*
   * When true, an error will be thrown if a primitive number is passed to the Big constructor,
   * or if valueOf is called, or if toNumber is called on a Big which cannot be converted to a
   * primitive number without a loss of precision.
   */
  STRICT = false,     // true or false


/**************************************************************************************************/


  // Error messages.
  NAME = '[big.js] ',
  INVALID = NAME + 'Invalid ',
  INVALID_DP = INVALID + 'decimal places',
  INVALID_RM = INVALID + 'rounding mode',
  DIV_BY_ZERO = NAME + 'Division by zero',

  // The shared prototype object.
  P = {},
  UNDEFINED = void 0,
  NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


/*
 * Create and return a Big constructor.
 */
function _Big_() {

  /*
   * The Big constructor and exported function.
   * Create and return a new instance of a Big number object.
   *
   * n {number|string|Big} A numeric value.
   */
  function Big(n) {
    var x = this;

    // Enable constructor usage without new.
    if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

    // Duplicate.
    if (n instanceof Big) {
      x.s = n.s;
      x.e = n.e;
      x.c = n.c.slice();
    } else {
      if (typeof n !== 'string') {
        if (Big.strict === true && typeof n !== 'bigint') {
          throw TypeError(INVALID + 'value');
        }

        // Minus zero?
        n = n === 0 && 1 / n < 0 ? '-0' : String(n);
      }

      parse(x, n);
    }

    // Retain a reference to this Big constructor.
    // Shadow Big.prototype.constructor which points to Object.
    x.constructor = Big;
  }

  Big.prototype = P;
  Big.DP = DP;
  Big.RM = RM;
  Big.NE = NE;
  Big.PE = PE;
  Big.strict = STRICT;
  Big.roundDown = 0;
  Big.roundHalfUp = 1;
  Big.roundHalfEven = 2;
  Big.roundUp = 3;

  return Big;
}


/*
 * Parse the number or string value passed to a Big constructor.
 *
 * x {Big} A Big number instance.
 * n {number|string} A numeric value.
 */
function parse(x, n) {
  var e, i, nl;

  if (!NUMERIC.test(n)) {
    throw Error(INVALID + 'number');
  }

  // Determine sign.
  x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

  // Decimal point?
  if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

  // Exponential form?
  if ((i = n.search(/e/i)) > 0) {

    // Determine exponent.
    if (e < 0) e = i;
    e += +n.slice(i + 1);
    n = n.substring(0, i);
  } else if (e < 0) {

    // Integer.
    e = n.length;
  }

  nl = n.length;

  // Determine leading zeros.
  for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

  if (i == nl) {

    // Zero.
    x.c = [x.e = 0];
  } else {

    // Determine trailing zeros.
    for (; nl > 0 && n.charAt(--nl) == '0';);
    x.e = e - i - 1;
    x.c = [];

    // Convert string to array of digits without leading/trailing zeros.
    for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
  }

  return x;
}


/*
 * Round Big x to a maximum of sd significant digits using rounding mode rm.
 *
 * x {Big} The Big to round.
 * sd {number} Significant digits: integer, 0 to MAX_DP inclusive.
 * rm {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 * [more] {boolean} Whether the result of division was truncated.
 */
function round(x, sd, rm, more) {
  var xc = x.c;

  if (rm === UNDEFINED) rm = x.constructor.RM;
  if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
    throw Error(INVALID_RM);
  }

  if (sd < 1) {
    more =
      rm === 3 && (more || !!xc[0]) || sd === 0 && (
      rm === 1 && xc[0] >= 5 ||
      rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED))
    );

    xc.length = 1;

    if (more) {

      // 1, 0.1, 0.01, 0.001, 0.0001 etc.
      x.e = x.e - sd + 1;
      xc[0] = 1;
    } else {

      // Zero.
      xc[0] = x.e = 0;
    }
  } else if (sd < xc.length) {

    // xc[sd] is the digit after the digit that may be rounded up.
    more =
      rm === 1 && xc[sd] >= 5 ||
      rm === 2 && (xc[sd] > 5 || xc[sd] === 5 &&
        (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) ||
      rm === 3 && (more || !!xc[0]);

    // Remove any digits after the required precision.
    xc.length = sd;

    // Round up?
    if (more) {

      // Rounding up may mean the previous digit has to be rounded up.
      for (; ++xc[--sd] > 9;) {
        xc[sd] = 0;
        if (sd === 0) {
          ++x.e;
          xc.unshift(1);
          break;
        }
      }
    }

    // Remove trailing zeros.
    for (sd = xc.length; !xc[--sd];) xc.pop();
  }

  return x;
}


/*
 * Return a string representing the value of Big x in normal or exponential notation.
 * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
 */
function stringify(x, doExponential, isNonzero) {
  var e = x.e,
    s = x.c.join(''),
    n = s.length;

  // Exponential notation?
  if (doExponential) {
    s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

  // Normal notation.
  } else if (e < 0) {
    for (; ++e;) s = '0' + s;
    s = '0.' + s;
  } else if (e > 0) {
    if (++e > n) {
      for (e -= n; e--;) s += '0';
    } else if (e < n) {
      s = s.slice(0, e) + '.' + s.slice(e);
    }
  } else if (n > 1) {
    s = s.charAt(0) + '.' + s.slice(1);
  }

  return x.s < 0 && isNonzero ? '-' + s : s;
}


// Prototype/instance methods


/*
 * Return a new Big whose value is the absolute value of this Big.
 */
P.abs = function () {
  var x = new this.constructor(this);
  x.s = 1;
  return x;
};


/*
 * Return 1 if the value of this Big is greater than the value of Big y,
 *       -1 if the value of this Big is less than the value of Big y, or
 *        0 if they have the same value.
 */
P.cmp = function (y) {
  var isneg,
    x = this,
    xc = x.c,
    yc = (y = new x.constructor(y)).c,
    i = x.s,
    j = y.s,
    k = x.e,
    l = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

  // Signs differ?
  if (i != j) return i;

  isneg = i < 0;

  // Compare exponents.
  if (k != l) return k > l ^ isneg ? 1 : -1;

  j = (k = xc.length) < (l = yc.length) ? k : l;

  // Compare digit by digit.
  for (i = -1; ++i < j;) {
    if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
  }

  // Compare lengths.
  return k == l ? 0 : k > l ^ isneg ? 1 : -1;
};


/*
 * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
 * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.div = function (y) {
  var x = this,
    Big = x.constructor,
    a = x.c,                  // dividend
    b = (y = new Big(y)).c,   // divisor
    k = x.s == y.s ? 1 : -1,
    dp = Big.DP;

  if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }

  // Divisor is zero?
  if (!b[0]) {
    throw Error(DIV_BY_ZERO);
  }

  // Dividend is 0? Return +-0.
  if (!a[0]) {
    y.s = k;
    y.c = [y.e = 0];
    return y;
  }

  var bl, bt, n, cmp, ri,
    bz = b.slice(),
    ai = bl = b.length,
    al = a.length,
    r = a.slice(0, bl),   // remainder
    rl = r.length,
    q = y,                // quotient
    qc = q.c = [],
    qi = 0,
    p = dp + (q.e = x.e - y.e) + 1;    // precision of the result

  q.s = k;
  k = p < 0 ? 0 : p;

  // Create version of divisor with leading zero.
  bz.unshift(0);

  // Add zeros to make remainder as long as divisor.
  for (; rl++ < bl;) r.push(0);

  do {

    // n is how many times the divisor goes into current remainder.
    for (n = 0; n < 10; n++) {

      // Compare divisor and remainder.
      if (bl != (rl = r.length)) {
        cmp = bl > rl ? 1 : -1;
      } else {
        for (ri = -1, cmp = 0; ++ri < bl;) {
          if (b[ri] != r[ri]) {
            cmp = b[ri] > r[ri] ? 1 : -1;
            break;
          }
        }
      }

      // If divisor < remainder, subtract divisor from remainder.
      if (cmp < 0) {

        // Remainder can't be more than 1 digit longer than divisor.
        // Equalise lengths using divisor with extra leading zero?
        for (bt = rl == bl ? b : bz; rl;) {
          if (r[--rl] < bt[rl]) {
            ri = rl;
            for (; ri && !r[--ri];) r[ri] = 9;
            --r[ri];
            r[rl] += 10;
          }
          r[rl] -= bt[rl];
        }

        for (; !r[0];) r.shift();
      } else {
        break;
      }
    }

    // Add the digit n to the result array.
    qc[qi++] = cmp ? n : ++n;

    // Update the remainder.
    if (r[0] && cmp) r[rl] = a[ai] || 0;
    else r = [a[ai]];

  } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

  // Leading zero? Do not remove if result is simply zero (qi == 1).
  if (!qc[0] && qi != 1) {

    // There can't be more than one zero.
    qc.shift();
    q.e--;
    p--;
  }

  // Round?
  if (qi > p) round(q, p, Big.RM, r[0] !== UNDEFINED);

  return q;
};


/*
 * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
 */
P.eq = function (y) {
  return this.cmp(y) === 0;
};


/*
 * Return true if the value of this Big is greater than the value of Big y, otherwise return
 * false.
 */
P.gt = function (y) {
  return this.cmp(y) > 0;
};


/*
 * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
 * return false.
 */
P.gte = function (y) {
  return this.cmp(y) > -1;
};


/*
 * Return true if the value of this Big is less than the value of Big y, otherwise return false.
 */
P.lt = function (y) {
  return this.cmp(y) < 0;
};


/*
 * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
 * return false.
 */
P.lte = function (y) {
  return this.cmp(y) < 1;
};


/*
 * Return a new Big whose value is the value of this Big minus the value of Big y.
 */
P.minus = P.sub = function (y) {
  var i, j, t, xlty,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  // Signs differ?
  if (a != b) {
    y.s = -b;
    return x.plus(y);
  }

  var xc = x.c.slice(),
    xe = x.e,
    yc = y.c,
    ye = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) {
    if (yc[0]) {
      y.s = -b;
    } else if (xc[0]) {
      y = new Big(x);
    } else {
      y.s = 1;
    }
    return y;
  }

  // Determine which is the bigger number. Prepend zeros to equalise exponents.
  if (a = xe - ye) {

    if (xlty = a < 0) {
      a = -a;
      t = xc;
    } else {
      ye = xe;
      t = yc;
    }

    t.reverse();
    for (b = a; b--;) t.push(0);
    t.reverse();
  } else {

    // Exponents equal. Check digit by digit.
    j = ((xlty = xc.length < yc.length) ? xc : yc).length;

    for (a = b = 0; b < j; b++) {
      if (xc[b] != yc[b]) {
        xlty = xc[b] < yc[b];
        break;
      }
    }
  }

  // x < y? Point xc to the array of the bigger number.
  if (xlty) {
    t = xc;
    xc = yc;
    yc = t;
    y.s = -y.s;
  }

  /*
   * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
   * needs to start at yc.length.
   */
  if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

  // Subtract yc from xc.
  for (b = i; j > a;) {
    if (xc[--j] < yc[j]) {
      for (i = j; i && !xc[--i];) xc[i] = 9;
      --xc[i];
      xc[j] += 10;
    }

    xc[j] -= yc[j];
  }

  // Remove trailing zeros.
  for (; xc[--b] === 0;) xc.pop();

  // Remove leading zeros and adjust exponent accordingly.
  for (; xc[0] === 0;) {
    xc.shift();
    --ye;
  }

  if (!xc[0]) {

    // n - n = +0
    y.s = 1;

    // Result must be zero.
    xc = [ye = 0];
  }

  y.c = xc;
  y.e = ye;

  return y;
};


/*
 * Return a new Big whose value is the value of this Big modulo the value of Big y.
 */
P.mod = function (y) {
  var ygtx,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  if (!y.c[0]) {
    throw Error(DIV_BY_ZERO);
  }

  x.s = y.s = 1;
  ygtx = y.cmp(x) == 1;
  x.s = a;
  y.s = b;

  if (ygtx) return new Big(x);

  a = Big.DP;
  b = Big.RM;
  Big.DP = Big.RM = 0;
  x = x.div(y);
  Big.DP = a;
  Big.RM = b;

  return this.minus(x.times(y));
};


/*
 * Return a new Big whose value is the value of this Big negated.
 */
P.neg = function () {
  var x = new this.constructor(this);
  x.s = -x.s;
  return x;
};


/*
 * Return a new Big whose value is the value of this Big plus the value of Big y.
 */
P.plus = P.add = function (y) {
  var e, k, t,
    x = this,
    Big = x.constructor;

  y = new Big(y);

  // Signs differ?
  if (x.s != y.s) {
    y.s = -y.s;
    return x.minus(y);
  }

  var xe = x.e,
    xc = x.c,
    ye = y.e,
    yc = y.c;

  // Either zero?
  if (!xc[0] || !yc[0]) {
    if (!yc[0]) {
      if (xc[0]) {
        y = new Big(x);
      } else {
        y.s = x.s;
      }
    }
    return y;
  }

  xc = xc.slice();

  // Prepend zeros to equalise exponents.
  // Note: reverse faster than unshifts.
  if (e = xe - ye) {
    if (e > 0) {
      ye = xe;
      t = yc;
    } else {
      e = -e;
      t = xc;
    }

    t.reverse();
    for (; e--;) t.push(0);
    t.reverse();
  }

  // Point xc to the longer array.
  if (xc.length - yc.length < 0) {
    t = yc;
    yc = xc;
    xc = t;
  }

  e = yc.length;

  // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
  for (k = 0; e; xc[e] %= 10) k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;

  // No need to check for zero, as +x + +y != 0 && -x + -y != 0

  if (k) {
    xc.unshift(k);
    ++ye;
  }

  // Remove trailing zeros.
  for (e = xc.length; xc[--e] === 0;) xc.pop();

  y.c = xc;
  y.e = ye;

  return y;
};


/*
 * Return a Big whose value is the value of this Big raised to the power n.
 * If n is negative, round to a maximum of Big.DP decimal places using rounding
 * mode Big.RM.
 *
 * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
 */
P.pow = function (n) {
  var x = this,
    one = new x.constructor('1'),
    y = one,
    isneg = n < 0;

  if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
    throw Error(INVALID + 'exponent');
  }

  if (isneg) n = -n;

  for (;;) {
    if (n & 1) y = y.times(x);
    n >>= 1;
    if (!n) break;
    x = x.times(x);
  }

  return isneg ? one.div(y) : y;
};


/*
 * Return a new Big whose value is the value of this Big rounded to a maximum precision of sd
 * significant digits using rounding mode rm, or Big.RM if rm is not specified.
 *
 * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.prec = function (sd, rm) {
  if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
    throw Error(INVALID + 'precision');
  }
  return round(new this.constructor(this), sd, rm);
};


/*
 * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal places
 * using rounding mode rm, or Big.RM if rm is not specified.
 * If dp is negative, round to an integer which is a multiple of 10**-dp.
 * If dp is not specified, round to 0 decimal places.
 *
 * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.round = function (dp, rm) {
  if (dp === UNDEFINED) dp = 0;
  else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }
  return round(new this.constructor(this), dp + this.e + 1, rm);
};


/*
 * Return a new Big whose value is the square root of the value of this Big, rounded, if
 * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.sqrt = function () {
  var r, c, t,
    x = this,
    Big = x.constructor,
    s = x.s,
    e = x.e,
    half = new Big('0.5');

  // Zero?
  if (!x.c[0]) return new Big(x);

  // Negative?
  if (s < 0) {
    throw Error(NAME + 'No square root');
  }

  // Estimate.
  s = Math.sqrt(x + '');

  // Math.sqrt underflow/overflow?
  // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
  if (s === 0 || s === 1 / 0) {
    c = x.c.join('');
    if (!(c.length + e & 1)) c += '0';
    s = Math.sqrt(c);
    e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
    r = new Big((s == 1 / 0 ? '5e' : (s = s.toExponential()).slice(0, s.indexOf('e') + 1)) + e);
  } else {
    r = new Big(s + '');
  }

  e = r.e + (Big.DP += 4);

  // Newton-Raphson iteration.
  do {
    t = r;
    r = half.times(t.plus(x.div(t)));
  } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

  return round(r, (Big.DP -= 4) + r.e + 1, Big.RM);
};


/*
 * Return a new Big whose value is the value of this Big times the value of Big y.
 */
P.times = P.mul = function (y) {
  var c,
    x = this,
    Big = x.constructor,
    xc = x.c,
    yc = (y = new Big(y)).c,
    a = xc.length,
    b = yc.length,
    i = x.e,
    j = y.e;

  // Determine sign of result.
  y.s = x.s == y.s ? 1 : -1;

  // Return signed 0 if either 0.
  if (!xc[0] || !yc[0]) {
    y.c = [y.e = 0];
    return y;
  }

  // Initialise exponent of result as x.e + y.e.
  y.e = i + j;

  // If array xc has fewer digits than yc, swap xc and yc, and lengths.
  if (a < b) {
    c = xc;
    xc = yc;
    yc = c;
    j = a;
    a = b;
    b = j;
  }

  // Initialise coefficient array of result with zeros.
  for (c = new Array(j = a + b); j--;) c[j] = 0;

  // Multiply.

  // i is initially xc.length.
  for (i = b; i--;) {
    b = 0;

    // a is yc.length.
    for (j = a + i; j > i;) {

      // Current sum of products at this digit position, plus carry.
      b = c[j] + yc[i] * xc[j - i - 1] + b;
      c[j--] = b % 10;

      // carry
      b = b / 10 | 0;
    }

    c[j] = b;
  }

  // Increment result exponent if there is a final carry, otherwise remove leading zero.
  if (b) ++y.e;
  else c.shift();

  // Remove trailing zeros.
  for (i = c.length; !c[--i];) c.pop();
  y.c = c;

  return y;
};


/*
 * Return a string representing the value of this Big in exponential notation rounded to dp fixed
 * decimal places using rounding mode rm, or Big.RM if rm is not specified.
 *
 * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.toExponential = function (dp, rm) {
  var x = this,
    n = x.c[0];

  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), ++dp, rm);
    for (; x.c.length < dp;) x.c.push(0);
  }

  return stringify(x, true, !!n);
};


/*
 * Return a string representing the value of this Big in normal notation rounded to dp fixed
 * decimal places using rounding mode rm, or Big.RM if rm is not specified.
 *
 * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 *
 * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
 * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
 */
P.toFixed = function (dp, rm) {
  var x = this,
    n = x.c[0];

  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), dp + x.e + 1, rm);

    // x.e may have changed if the value is rounded up.
    for (dp = dp + x.e + 1; x.c.length < dp;) x.c.push(0);
  }

  return stringify(x, false, !!n);
};


/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Omit the sign for negative zero.
 */
P[Symbol.for('nodejs.util.inspect.custom')] = P.toJSON = P.toString = function () {
  var x = this,
    Big = x.constructor;
  return stringify(x, x.e <= Big.NE || x.e >= Big.PE, !!x.c[0]);
};


/*
 * Return the value of this Big as a primitve number.
 */
P.toNumber = function () {
  var n = Number(stringify(this, true, true));
  if (this.constructor.strict === true && !this.eq(n.toString())) {
    throw Error(NAME + 'Imprecise conversion');
  }
  return n;
};


/*
 * Return a string representing the value of this Big rounded to sd significant digits using
 * rounding mode rm, or Big.RM if rm is not specified.
 * Use exponential notation if sd is less than the number of digits necessary to represent
 * the integer part of the value in normal notation.
 *
 * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.toPrecision = function (sd, rm) {
  var x = this,
    Big = x.constructor,
    n = x.c[0];

  if (sd !== UNDEFINED) {
    if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
      throw Error(INVALID + 'precision');
    }
    x = round(new Big(x), sd, rm);
    for (; x.c.length < sd;) x.c.push(0);
  }

  return stringify(x, sd <= x.e || x.e <= Big.NE || x.e >= Big.PE, !!n);
};


/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Include the sign for negative zero.
 */
P.valueOf = function () {
  var x = this,
    Big = x.constructor;
  if (Big.strict === true) {
    throw Error(NAME + 'valueOf disallowed');
  }
  return stringify(x, x.e <= Big.NE || x.e >= Big.PE, true);
};


// Export


var Big = _Big_();

var __defProp$f = Object.defineProperty;
var __defNormalProp$f = (obj, key, value) => key in obj ? __defProp$f(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$f = (obj, key, value) => {
  __defNormalProp$f(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _AstronomicalCalculator = class _AstronomicalCalculator {
  constructor() {
    /**
     * The commonly used average solar refraction. Calendrical Calculations lists a more accurate global average of
     * 34.478885263888294
     *
     * @see #getRefraction()
     */
    __publicField$f(this, "refraction", 34 / 60);
    // private double refraction = 34.478885263888294 / 60d;
    /**
     * The commonly used average solar radius in minutes of a degree.
     *
     * @see #getSolarRadius()
     */
    __publicField$f(this, "solarRadius", 16 / 60);
    /**
     * The commonly used average earth radius in KM. At this time, this only affects elevation adjustment and not the
     * sunrise and sunset calculations. The value currently defaults to 6356.9 KM.
     *
     * @see #getEarthRadius()
     * @see #setEarthRadius(double)
     */
    __publicField$f(this, "earthRadius", 6356.9);
  }
  // in KM
  /**
   * A method that returns the earth radius in KM. The value currently defaults to 6356.9 KM if not set.
   *
   * @return the earthRadius the earth radius in KM.
   */
  getEarthRadius() {
    return this.earthRadius;
  }
  /**
   * A method that allows setting the earth's radius.
   *
   * @param earthRadius
   *            the earthRadius to set in KM
   */
  setEarthRadius(earthRadius) {
    this.earthRadius = earthRadius;
  }
  /**
   * Returns the default class for calculating sunrise and sunset. This is currently the {@link NOAACalculator},
   * but this may change.
   *
   * @return AstronomicalCalculator the default class for calculating sunrise and sunset. In the current
   *         implementation the default calculator returned is the {@link NOAACalculator}.
   * @deprecated This depends on a circular dependency. Use <pre>new NOAACalculator()</pre> instead
   */
  static getDefault() {
    throw new UnsupportedError("This method is deprecated, due to the fact that it depends on a circular dependency. Use `new NOAACalculator()` instead.");
  }
  /**
   * Method to return the adjustment to the zenith required to account for the elevation. Since a person at a higher
   * elevation can see farther below the horizon, the calculation for sunrise / sunset is calculated below the horizon
   * used at sea level. This is only used for sunrise and sunset and not times before or after it such as
   * {@link AstronomicalCalendar#getBeginNauticalTwilight() nautical twilight} since those
   * calculations are based on the level of available light at the given dip below the horizon, something that is not
   * affected by elevation, the adjustment should only made if the zenith == 90&deg; {@link #adjustZenith adjusted}
   * for refraction and solar radius. The algorithm used is
   *
   * <pre>
   * elevationAdjustment = Math.toDegrees(Math.acos(earthRadiusInMeters / (earthRadiusInMeters + elevationMeters)));
   * </pre>
   *
   * The source of this algorithm is <a href="http://www.calendarists.com">Calendrical Calculations</a> by Edward M.
   * Reingold and Nachum Dershowitz. An alternate algorithm that produces an almost identical (but not accurate)
   * result found in Ma'aglay Tzedek by Moishe Kosower and other sources is:
   *
   * <pre>
   * elevationAdjustment = 0.0347 * Math.sqrt(elevationMeters);
   * </pre>
   *
   * @param elevation
   *            elevation in Meters.
   * @return the adjusted zenith
   */
  getElevationAdjustment(elevation) {
    const elevationAdjustment = MathUtils.radiansToDegrees(Math.acos(this.earthRadius / (this.earthRadius + elevation / 1e3)));
    return elevationAdjustment;
  }
  /**
   * Adjusts the zenith of astronomical sunrise and sunset to account for solar refraction, solar radius and
   * elevation. The value for Sun's zenith and true rise/set Zenith (used in this class and subclasses) is the angle
   * that the center of the Sun makes to a line perpendicular to the Earth's surface. If the Sun were a point and the
   * Earth were without an atmosphere, true sunset and sunrise would correspond to a 90&deg; zenith. Because the Sun
   * is not a point, and because the atmosphere refracts light, this 90&deg; zenith does not, in fact, correspond to
   * true sunset or sunrise, instead the centre of the Sun's disk must lie just below the horizon for the upper edge
   * to be obscured. This means that a zenith of just above 90&deg; must be used. The Sun subtends an angle of 16
   * minutes of arc (this can be changed via the {@link #setSolarRadius(double)} method , and atmospheric refraction
   * accounts for 34 minutes or so (this can be changed via the {@link #setRefraction(double)} method), giving a total
   * of 50 arcminutes. The total value for ZENITH is 90+(5/6) or 90.8333333&deg; for true sunrise/sunset. Since a
   * person at an elevation can see blow the horizon of a person at sea level, this will also adjust the zenith to
   * account for elevation if available. Note that this will only adjust the value if the zenith is exactly 90 degrees.
   * For values below and above this no correction is done. As an example, astronomical twilight is when the sun is
   * 18&deg; below the horizon or {@link AstronomicalCalendar#ASTRONOMICAL_ZENITH 108&deg;
   * below the zenith}. This is traditionally calculated with none of the above mentioned adjustments. The same goes
   * for various <em>tzais</em> and <em>alos</em> times such as the
   * {@link ZmanimCalendar#ZENITH_16_POINT_1 16.1&deg;} dip used in
   * {@link ComplexZmanimCalendar#getAlos16Point1Degrees()}.
   *
   * @param zenith
   *            the azimuth below the vertical zenith of 90&deg;. For sunset typically the {@link #adjustZenith
   *            zenith} used for the calculation uses geometric zenith of 90&deg; and {@link #adjustZenith adjusts}
   *            this slightly to account for solar refraction and the sun's radius. Another example would be
   *            {@link AstronomicalCalendar#getEndNauticalTwilight()} that passes
   *            {@link AstronomicalCalendar#NAUTICAL_ZENITH} to this method.
   * @param elevation
   *            elevation in Meters.
   * @return The zenith adjusted to include the {@link #getSolarRadius sun's radius}, {@link #getRefraction
     *         refraction} and {@link #getElevationAdjustment elevation} adjustment. This will only be adjusted for
   *         sunrise and sunset (if the zenith == 90&deg;)
   * @see #getElevationAdjustment(double)
   */
  adjustZenith(zenith, elevation) {
    let adjustedZenith = zenith;
    if (zenith === _AstronomicalCalculator.GEOMETRIC_ZENITH) {
      adjustedZenith = zenith + (this.getSolarRadius() + this.getRefraction() + this.getElevationAdjustment(elevation));
    }
    return adjustedZenith;
  }
  /**
   * Method to get the refraction value to be used when calculating sunrise and sunset. The default value is 34 arc
   * minutes. The <a href="http://emr.cs.iit.edu/home/reingold/calendar-book/second-edition/errata.pdf">Errata and
   * Notes for Calendrical Calculations: The Millennium Edition</a> by Edward M. Reingold and Nachum Dershowitz lists
   * the actual average refraction value as 34.478885263888294 or approximately 34' 29". The refraction value as well
   * as the solarRadius and elevation adjustment are added to the zenith used to calculate sunrise and sunset.
   *
   * @return The refraction in arc minutes.
   */
  getRefraction() {
    return this.refraction;
  }
  /**
   * A method to allow overriding the default refraction of the calculator.
   * @todo At some point in the future, an AtmosphericModel or Refraction object that models the atmosphere of different
   * locations might be used for increased accuracy.
   *
   * @param refraction
   *            The refraction in arc minutes.
   * @see #getRefraction()
   */
  setRefraction(refraction) {
    this.refraction = refraction;
  }
  /**
   * Method to get the sun's radius. The default value is 16 arc minutes. The sun's radius as it appears from earth is
   * almost universally given as 16 arc minutes but in fact it differs by the time of the year. At the <a
   * href="http://en.wikipedia.org/wiki/Perihelion">perihelion</a> it has an apparent radius of 16.293, while at the
   * <a href="http://en.wikipedia.org/wiki/Aphelion">aphelion</a> it has an apparent radius of 15.755. There is little
   * affect for most location, but at high and low latitudes the difference becomes more apparent. My Calculations for
   * the difference at the location of the <a href="http://www.rog.nmm.ac.uk">Royal Observatory, Greenwich </a> show
   * only a 4.494 second difference between the perihelion and aphelion radii, but moving into the arctic circle the
   * difference becomes more noticeable. Tests for Tromso, Norway (latitude 69.672312, longitude 19.049787) show that
   * on May 17, the rise of the midnight sun, a 2 minute 23 second difference is observed between the perihelion and
   * aphelion radii using the USNO algorithm, but only 1 minute and 6 seconds difference using the NOAA algorithm.
   * Areas farther north show an even greater difference. Note that these test are not real valid test cases because
   * they show the extreme difference on days that are not the perihelion or aphelion, but are shown for illustrative
   * purposes only.
   *
   * @return The sun's radius in arc minutes.
   */
  getSolarRadius() {
    return this.solarRadius;
  }
  /**
   * Method to set the sun's radius.
   *
   * @param solarRadius
   *            The sun's radius in arc minutes.
   * @see #getSolarRadius()
   */
  setSolarRadius(solarRadius) {
    this.solarRadius = solarRadius;
  }
  /**
   * @see java.lang.Object#clone()
   * @since 1.1
   */
  clone() {
    return JSON.parse(JSON.stringify(this));
  }
  equals(object) {
    return this === object;
  }
};
/**
 * The zenith of astronomical sunrise and sunset. The sun is 90&deg; from the vertical 0&deg;
 */
__publicField$f(_AstronomicalCalculator, "GEOMETRIC_ZENITH", 90);
let AstronomicalCalculator = _AstronomicalCalculator;

var __defProp$e = Object.defineProperty;
var __defNormalProp$e = (obj, key, value) => key in obj ? __defProp$e(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$e = (obj, key, value) => {
  __defNormalProp$e(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _NOAACalculator = class _NOAACalculator extends AstronomicalCalculator {
  /**
   * @see AstronomicalCalculator#getCalculatorName()
   */
  // eslint-disable-next-line class-methods-use-this
  getCalculatorName() {
    return "US National Oceanic and Atmospheric Administration Algorithm";
  }
  /**
   * @see AstronomicalCalculator#getUTCSunrise(Calendar, GeoLocation, double, boolean)
   */
  getUTCSunrise(date, geoLocation, zenith, adjustForElevation) {
    const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
    const adjustedZenith = this.adjustZenith(zenith, elevation);
    let sunrise = _NOAACalculator.getSunriseUTC(
      _NOAACalculator.getJulianDay(date),
      geoLocation.getLatitude(),
      -geoLocation.getLongitude(),
      adjustedZenith
    );
    sunrise = sunrise / 60;
    while (sunrise < 0) {
      sunrise += 24;
    }
    while (sunrise >= 24) {
      sunrise -= 24;
    }
    return sunrise;
  }
  /**
   * @see AstronomicalCalculator#getUTCSunset(Calendar, GeoLocation, double, boolean)
   */
  getUTCSunset(date, geoLocation, zenith, adjustForElevation) {
    const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
    const adjustedZenith = this.adjustZenith(zenith, elevation);
    let sunset = _NOAACalculator.getSunsetUTC(
      _NOAACalculator.getJulianDay(date),
      geoLocation.getLatitude(),
      -geoLocation.getLongitude(),
      adjustedZenith
    );
    sunset = sunset / 60;
    while (sunset < 0) {
      sunset += 24;
    }
    while (sunset >= 24) {
      sunset -= 24;
    }
    return sunset;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> from a Java Calendar
   *
   * @param calendar
   *            The Java Calendar
   * @return the Julian day corresponding to the date Note: Number is returned for start of day. Fractional days
   *         should be added later.
   */
  static getJulianDay(date) {
    let { year, month } = date;
    const { day } = date;
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const a = Math.trunc(year / 100);
    const b = Math.trunc(2 - a + a / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
  }
  /**
   * Convert <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> to centuries since J2000.0.
   *
   * @param julianDay
   *            the Julian Day to convert
   * @return the centuries since 2000 Julian corresponding to the Julian Day
   */
  static getJulianCenturiesFromJulianDay(julianDay) {
    return (julianDay - _NOAACalculator.JULIAN_DAY_JAN_1_2000) / _NOAACalculator.JULIAN_DAYS_PER_CENTURY;
  }
  /**
   * Convert centuries since J2000.0 to <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a>.
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the Julian Day corresponding to the Julian centuries passed in
   */
  static getJulianDayFromJulianCenturies(julianCenturies) {
    return julianCenturies * _NOAACalculator.JULIAN_DAYS_PER_CENTURY + _NOAACalculator.JULIAN_DAY_JAN_1_2000;
  }
  /**
   * Returns the Geometric <a href="http://en.wikipedia.org/wiki/Mean_longitude">Mean Longitude</a> of the Sun.
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the Geometric Mean Longitude of the Sun in degrees
   */
  static getSunGeometricMeanLongitude(julianCenturies) {
    let longitude = 280.46646 + julianCenturies * (36000.76983 + 3032e-7 * julianCenturies);
    while (longitude > 360) {
      longitude -= 360;
    }
    while (longitude < 0) {
      longitude += 360;
    }
    return longitude;
  }
  /**
   * Returns the Geometric <a href="http://en.wikipedia.org/wiki/Mean_anomaly">Mean Anomaly</a> of the Sun.
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the Geometric Mean Anomaly of the Sun in degrees
   */
  static getSunGeometricMeanAnomaly(julianCenturies) {
    return 357.52911 + julianCenturies * (35999.05029 - 1537e-7 * julianCenturies);
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Eccentricity_%28orbit%29">eccentricity of earth's orbit</a>.
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the unitless eccentricity
   */
  static getEarthOrbitEccentricity(julianCenturies) {
    return 0.016708634 - julianCenturies * (42037e-9 + 1267e-10 * julianCenturies);
  }
  /**
   * Returns the <a href="http://en.wikipedia.org/wiki/Equation_of_the_center">equation of center</a> for the sun.
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the equation of center for the sun in degrees
   */
  static getSunEquationOfCenter(julianCenturies) {
    const m = _NOAACalculator.getSunGeometricMeanAnomaly(julianCenturies);
    const mrad = MathUtils.degreesToRadians(m);
    const sinm = Math.sin(mrad);
    const sin2m = Math.sin(mrad + mrad);
    const sin3m = Math.sin(mrad + mrad + mrad);
    return sinm * (1.914602 - julianCenturies * (4817e-6 + 14e-6 * julianCenturies)) + sin2m * (0.019993 - 101e-6 * julianCenturies) + sin3m * 289e-6;
  }
  /**
   * Return the true longitude of the sun
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the sun's true longitude in degrees
   */
  static getSunTrueLongitude(julianCenturies) {
    const sunLongitude = _NOAACalculator.getSunGeometricMeanLongitude(julianCenturies);
    const center = _NOAACalculator.getSunEquationOfCenter(julianCenturies);
    return sunLongitude + center;
  }
  // /**
  // * Returns the <a href="http://en.wikipedia.org/wiki/True_anomaly">true anamoly</a> of the sun.
  // *
  // * @param julianCenturies
  // * the number of Julian centuries since J2000.0
  // * @return the sun's true anamoly in degrees
  // */
  // private static double getSunTrueAnomaly(double julianCenturies) {
  // double meanAnomaly = getSunGeometricMeanAnomaly(julianCenturies);
  // double equationOfCenter = getSunEquationOfCenter(julianCenturies);
  //
  // return meanAnomaly + equationOfCenter; // in degrees
  // }
  /**
   * Return the apparent longitude of the sun
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return sun's apparent longitude in degrees
   */
  static getSunApparentLongitude(julianCenturies) {
    const sunTrueLongitude = _NOAACalculator.getSunTrueLongitude(julianCenturies);
    const omega = 125.04 - 1934.136 * julianCenturies;
    const lambda = sunTrueLongitude - 569e-5 - 478e-5 * Math.sin(MathUtils.degreesToRadians(omega));
    return lambda;
  }
  /**
   * Returns the mean <a href="http://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial tilt).
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the mean obliquity in degrees
   */
  static getMeanObliquityOfEcliptic(julianCenturies) {
    const seconds = 21.448 - julianCenturies * (46.815 + julianCenturies * (59e-5 - julianCenturies * 1813e-6));
    return 23 + (26 + seconds / 60) / 60;
  }
  /**
   * Returns the corrected <a href="http://en.wikipedia.org/wiki/Axial_tilt">obliquity of the ecliptic</a> (Axial
   * tilt).
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return the corrected obliquity in degrees
   */
  static getObliquityCorrection(julianCenturies) {
    const obliquityOfEcliptic = _NOAACalculator.getMeanObliquityOfEcliptic(julianCenturies);
    const omega = 125.04 - 1934.136 * julianCenturies;
    return obliquityOfEcliptic + 256e-5 * Math.cos(MathUtils.degreesToRadians(omega));
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Declination">declination</a> of the sun.
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return
   *            the sun's declination in degrees
   */
  static getSunDeclination(julianCenturies) {
    const obliquityCorrection = _NOAACalculator.getObliquityCorrection(julianCenturies);
    const lambda = _NOAACalculator.getSunApparentLongitude(julianCenturies);
    const sint = Math.sin(MathUtils.degreesToRadians(obliquityCorrection)) * Math.sin(MathUtils.degreesToRadians(lambda));
    const theta = MathUtils.radiansToDegrees(Math.asin(sint));
    return theta;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Equation_of_time">Equation of Time</a> - the difference between
   * true solar time and mean solar time
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @return equation of time in minutes of time
   */
  static getEquationOfTime(julianCenturies) {
    const epsilon = _NOAACalculator.getObliquityCorrection(julianCenturies);
    const geomMeanLongSun = _NOAACalculator.getSunGeometricMeanLongitude(julianCenturies);
    const eccentricityEarthOrbit = _NOAACalculator.getEarthOrbitEccentricity(julianCenturies);
    const geomMeanAnomalySun = _NOAACalculator.getSunGeometricMeanAnomaly(julianCenturies);
    let y = Math.tan(MathUtils.degreesToRadians(epsilon) / 2);
    y *= y;
    const sin2l0 = Math.sin(2 * MathUtils.degreesToRadians(geomMeanLongSun));
    const sinm = Math.sin(MathUtils.degreesToRadians(geomMeanAnomalySun));
    const cos2l0 = Math.cos(2 * MathUtils.degreesToRadians(geomMeanLongSun));
    const sin4l0 = Math.sin(4 * MathUtils.degreesToRadians(geomMeanLongSun));
    const sin2m = Math.sin(2 * MathUtils.degreesToRadians(geomMeanAnomalySun));
    const equationOfTime = y * sin2l0 - 2 * eccentricityEarthOrbit * sinm + 4 * eccentricityEarthOrbit * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * eccentricityEarthOrbit * eccentricityEarthOrbit * sin2m;
    return MathUtils.radiansToDegrees(equationOfTime) * 4;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Hour_angle">hour angle</a> of the sun at sunrise for the
   * latitude.
   *
   * @param lat
   *            , the latitude of observer in degrees
   * @param solarDec
   *            the declination angle of sun in degrees
   * @param zenith
   *            the zenith
   * @return hour angle of sunrise in radians
   */
  static getSunHourAngleAtSunrise(lat, solarDec, zenith) {
    const latRad = MathUtils.degreesToRadians(lat);
    const sdRad = MathUtils.degreesToRadians(solarDec);
    return Math.acos(Math.cos(MathUtils.degreesToRadians(zenith)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));
  }
  /**
   * Returns the <a href="http://en.wikipedia.org/wiki/Hour_angle">hour angle</a> of the sun at sunset for the
   * latitude. TODO: use - {@link #getSunHourAngleAtSunrise(double, double, double)} implementation to avoid
   * duplication of code.
   *
   * @param lat
   *            the latitude of observer in degrees
   * @param solarDec
   *            the declination angle of sun in degrees
   * @param zenith
   *            the zenith
   * @return the hour angle of sunset in radians
   */
  static getSunHourAngleAtSunset(lat, solarDec, zenith) {
    const latRad = MathUtils.degreesToRadians(lat);
    const sdRad = MathUtils.degreesToRadians(solarDec);
    const hourAngle = Math.acos(Math.cos(MathUtils.degreesToRadians(zenith)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));
    return -hourAngle;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Elevation</a> for the
   * horizontal coordinate system at the given location at the given time. Can be negative if the sun is below the
   * horizon. Not corrected for altitude.
   *
   * @param cal
   *            time of calculation
   * @param lat
   *            latitude of location for calculation
   * @param lon
   *            longitude of location for calculation
   * @return solar elevation in degrees - horizon is 0 degrees, civil twilight is -6 degrees
   */
  static getSolarElevation(date, lat, lon) {
    const julianDay = _NOAACalculator.getJulianDay(date);
    const julianCenturies = _NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
    const equationOfTime = _NOAACalculator.getEquationOfTime(julianCenturies);
    let longitude = date.hour + 12 + (date.minute + equationOfTime + date.second / 60) / 60;
    longitude = -(longitude * 360 / 24) % 360;
    const hourAngleRad = MathUtils.degreesToRadians(lon - longitude);
    const declination = _NOAACalculator.getSunDeclination(julianCenturies);
    const decRad = MathUtils.degreesToRadians(declination);
    const latRad = MathUtils.degreesToRadians(lat);
    return MathUtils.radiansToDegrees(Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad)));
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Celestial_coordinate_system">Solar Azimuth</a> for the
   * horizontal coordinate system at the given location at the given time. Not corrected for altitude. True south is 0
   * degrees.
   *
   * @param cal
   *            time of calculation
   * @param latitude
   *            latitude of location for calculation
   * @param lon
   *            longitude of location for calculation
   * @return FIXME
   */
  static getSolarAzimuth(date, latitude, lon) {
    const julianDay = _NOAACalculator.getJulianDay(date);
    const julianCenturies = _NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
    const equationOfTime = _NOAACalculator.getEquationOfTime(julianCenturies);
    let longitude = date.hour + 12 + (date.minute + equationOfTime + date.second / 60) / 60;
    longitude = -(longitude * 360 / 24) % 360;
    const hourAngleRad = MathUtils.degreesToRadians(lon - longitude);
    const declination = _NOAACalculator.getSunDeclination(julianCenturies);
    const decRad = MathUtils.degreesToRadians(declination);
    const latRad = MathUtils.degreesToRadians(latitude);
    return MathUtils.radiansToDegrees(Math.atan(Math.sin(hourAngleRad) / (Math.cos(hourAngleRad) * Math.sin(latRad) - Math.tan(decRad) * Math.cos(latRad)))) + 180;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
   * of sunrise for the given day at the given location on earth
   *
   * @param julianDay
   *            the Julian day
   * @param latitude
   *            the latitude of observer in degrees
   * @param longitude
   *            the longitude of observer in degrees
   * @param zenith
   *            the zenith
   * @return the time in minutes from zero UTC
   */
  static getSunriseUTC(julianDay, latitude, longitude, zenith) {
    const julianCenturies = _NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
    const noonmin = _NOAACalculator.getSolarNoonUTC(julianCenturies, longitude);
    const tnoon = _NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + noonmin / 1440);
    let eqTime = _NOAACalculator.getEquationOfTime(tnoon);
    let solarDec = _NOAACalculator.getSunDeclination(tnoon);
    let hourAngle = _NOAACalculator.getSunHourAngleAtSunrise(latitude, solarDec, zenith);
    let delta = longitude - MathUtils.radiansToDegrees(hourAngle);
    let timeDiff = 4 * delta;
    let timeUTC = 720 + timeDiff - eqTime;
    const newt = _NOAACalculator.getJulianCenturiesFromJulianDay(
      _NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) + timeUTC / 1440
    );
    eqTime = _NOAACalculator.getEquationOfTime(newt);
    solarDec = _NOAACalculator.getSunDeclination(newt);
    hourAngle = _NOAACalculator.getSunHourAngleAtSunrise(latitude, solarDec, zenith);
    delta = longitude - MathUtils.radiansToDegrees(hourAngle);
    timeDiff = 4 * delta;
    timeUTC = 720 + timeDiff - eqTime;
    return timeUTC;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
   * of <a href="http://en.wikipedia.org/wiki/Noon#Solar_noon">solar noon</a> for the given day at the given location
   * on earth.
   *
   * @param julianCenturies
   *            the number of Julian centuries since J2000.0
   * @param longitude
   *            the longitude of observer in degrees
   * @return the time in minutes from zero UTC
   */
  static getSolarNoonUTC(julianCenturies, longitude) {
    const tnoon = _NOAACalculator.getJulianCenturiesFromJulianDay(
      _NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) + longitude / 360
    );
    let eqTime = _NOAACalculator.getEquationOfTime(tnoon);
    const solNoonUTC = 720 + longitude * 4 - eqTime;
    const newt = _NOAACalculator.getJulianCenturiesFromJulianDay(
      _NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) - 0.5 + solNoonUTC / 1440
    );
    eqTime = _NOAACalculator.getEquationOfTime(newt);
    return 720 + longitude * 4 - eqTime;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Universal_Coordinated_Time">Universal Coordinated Time</a> (UTC)
   * of sunset for the given day at the given location on earth
   *
   * @param julianDay
   *            the Julian day
   * @param latitude
   *            the latitude of observer in degrees
   * @param longitude
   *            : longitude of observer in degrees
   * @param zenith
   *            the zenith
   * @return the time in minutes from zero Universal Coordinated Time (UTC)
   */
  static getSunsetUTC(julianDay, latitude, longitude, zenith) {
    const julianCenturies = _NOAACalculator.getJulianCenturiesFromJulianDay(julianDay);
    const noonmin = _NOAACalculator.getSolarNoonUTC(julianCenturies, longitude);
    const tnoon = _NOAACalculator.getJulianCenturiesFromJulianDay(julianDay + noonmin / 1440);
    let eqTime = _NOAACalculator.getEquationOfTime(tnoon);
    let solarDec = _NOAACalculator.getSunDeclination(tnoon);
    let hourAngle = _NOAACalculator.getSunHourAngleAtSunset(latitude, solarDec, zenith);
    let delta = longitude - MathUtils.radiansToDegrees(hourAngle);
    let timeDiff = 4 * delta;
    let timeUTC = 720 + timeDiff - eqTime;
    const newt = _NOAACalculator.getJulianCenturiesFromJulianDay(
      _NOAACalculator.getJulianDayFromJulianCenturies(julianCenturies) + timeUTC / 1440
    );
    eqTime = _NOAACalculator.getEquationOfTime(newt);
    solarDec = _NOAACalculator.getSunDeclination(newt);
    hourAngle = _NOAACalculator.getSunHourAngleAtSunset(latitude, solarDec, zenith);
    delta = longitude - MathUtils.radiansToDegrees(hourAngle);
    timeDiff = 4 * delta;
    timeUTC = 720 + timeDiff - eqTime;
    return timeUTC;
  }
};
/**
 * The <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> of January 1, 2000
 */
__publicField$e(_NOAACalculator, "JULIAN_DAY_JAN_1_2000", 2451545);
/**
 * Julian days per century
 */
__publicField$e(_NOAACalculator, "JULIAN_DAYS_PER_CENTURY", 36525);
let NOAACalculator = _NOAACalculator;

var __defProp$d = Object.defineProperty;
var __defNormalProp$d = (obj, key, value) => key in obj ? __defProp$d(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$d = (obj, key, value) => {
  __defNormalProp$d(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _AstronomicalCalendar = class _AstronomicalCalendar {
  /**
   * Default constructor will set a default {@link GeoLocation#GeoLocation()}, a default
   * {@link AstronomicalCalculator#getDefault() AstronomicalCalculator} and default the calendar to the current date.
   */
  /*
  constructor() {
      this(new GeoLocation());
  }
  */
  /**
   * A constructor that takes in <a href="http://en.wikipedia.org/wiki/Geolocation">geolocation</a> information as a
   * parameter. The default {@link AstronomicalCalculator#getDefault() AstronomicalCalculator} used for solar
   * calculations is the the {@link NOAACalculator}.
   *
   * @param geoLocation
   *            The location information used for calculating astronomical sun times.
   *
   * @see #setAstronomicalCalculator(AstronomicalCalculator) for changing the calculator class.
   */
  constructor(geoLocation = new GeoLocation()) {
    /**
     * The Java Calendar encapsulated by this class to track the current date used by the class
     */
    __publicField$d(this, "date");
    /**
     * the {@link GeoLocation} used for calculations.
     */
    __publicField$d(this, "geoLocation");
    /**
     * the internal {@link AstronomicalCalculator} used for calculating solar based times.
     */
    __publicField$d(this, "astronomicalCalculator");
    this.setDate(DateTime.fromObject({}, { zone: geoLocation.getTimeZone() }));
    this.setGeoLocation(geoLocation);
    this.setAstronomicalCalculator(new NOAACalculator());
  }
  /**
   * The getSunrise method Returns a <code>Date</code> representing the
   * {@link AstronomicalCalculator#getElevationAdjustment(double) elevation adjusted} sunrise time. The zenith used
   * for the calculation uses {@link #GEOMETRIC_ZENITH geometric zenith} of 90&deg; plus
   * {@link AstronomicalCalculator#getElevationAdjustment(double)}. This is adjusted by the
   * {@link AstronomicalCalculator} to add approximately 50/60 of a degree to account for 34 archminutes of refraction
   * and 16 archminutes for the sun's radius for a total of {@link AstronomicalCalculator#adjustZenith 90.83333&deg;}.
   * See documentation for the specific implementation of the {@link AstronomicalCalculator} that you are using.
   *
   * @return the <code>Date</code> representing the exact sunrise time. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the page.
   * @see AstronomicalCalculator#adjustZenith
   * @see #getSeaLevelSunrise()
   * @see AstronomicalCalendar#getUTCSunrise
   */
  getSunrise() {
    const sunrise = this.getUTCSunrise(_AstronomicalCalendar.GEOMETRIC_ZENITH);
    if (Number.isNaN(sunrise))
      return null;
    return this.getDateFromTime(sunrise, true);
  }
  /**
   * A method that returns the sunrise without {@link AstronomicalCalculator#getElevationAdjustment(double) elevation
     * adjustment}. Non-sunrise and sunset calculations such as dawn and dusk, depend on the amount of visible light,
   * something that is not affected by elevation. This method returns sunrise calculated at sea level. This forms the
   * base for dawn calculations that are calculated as a dip below the horizon before sunrise.
   *
   * @return the <code>Date</code> representing the exact sea-level sunrise time. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a null will be returned. See detailed explanation on top of the page.
   * @see AstronomicalCalendar#getSunrise
   * @see AstronomicalCalendar#getUTCSeaLevelSunrise
   * @see #getSeaLevelSunset()
   */
  getSeaLevelSunrise() {
    const sunrise = this.getUTCSeaLevelSunrise(_AstronomicalCalendar.GEOMETRIC_ZENITH);
    if (Number.isNaN(sunrise))
      return null;
    return this.getDateFromTime(sunrise, true);
  }
  /**
   * A method that returns the beginning of civil twilight (dawn) using a zenith of {@link #CIVIL_ZENITH 96&deg;}.
   *
   * @return The <code>Date</code> of the beginning of civil twilight using a zenith of 96&deg;. If the calculation
   *         can't be computed, null will be returned. See detailed explanation on top of the page.
   * @see #CIVIL_ZENITH
   */
  getBeginCivilTwilight() {
    return this.getSunriseOffsetByDegrees(_AstronomicalCalendar.CIVIL_ZENITH);
  }
  /**
   * A method that returns the beginning of nautical twilight using a zenith of {@link #NAUTICAL_ZENITH 102&deg;}.
   *
   * @return The <code>Date</code> of the beginning of nautical twilight using a zenith of 102&deg;. If the
   *         calculation can't be computed null will be returned. See detailed explanation on top of the page.
   * @see #NAUTICAL_ZENITH
   */
  getBeginNauticalTwilight() {
    return this.getSunriseOffsetByDegrees(_AstronomicalCalendar.NAUTICAL_ZENITH);
  }
  /**
   * A method that returns the beginning of astronomical twilight using a zenith of {@link #ASTRONOMICAL_ZENITH
     * 108&deg;}.
   *
   * @return The <code>Date</code> of the beginning of astronomical twilight using a zenith of 108&deg;. If the
   *         calculation can't be computed, null will be returned. See detailed explanation on top of the page.
   * @see #ASTRONOMICAL_ZENITH
   */
  getBeginAstronomicalTwilight() {
    return this.getSunriseOffsetByDegrees(_AstronomicalCalendar.ASTRONOMICAL_ZENITH);
  }
  /**
   * The getSunset method Returns a <code>Date</code> representing the
   * {@link AstronomicalCalculator#getElevationAdjustment(double) elevation adjusted} sunset time. The zenith used for
   * the calculation uses {@link #GEOMETRIC_ZENITH geometric zenith} of 90&deg; plus
   * {@link AstronomicalCalculator#getElevationAdjustment(double)}. This is adjusted by the
   * {@link AstronomicalCalculator} to add approximately 50/60 of a degree to account for 34 archminutes of refraction
   * and 16 archminutes for the sun's radius for a total of {@link AstronomicalCalculator#adjustZenith 90.83333&deg;}.
   * See documentation for the specific implementation of the {@link AstronomicalCalculator} that you are using. Note:
   * In certain cases the calculates sunset will occur before sunrise. This will typically happen when a timezone
   * other than the local timezone is used (calculating Los Angeles sunset using a GMT timezone for example). In this
   * case the sunset date will be incremented to the following date.
   *
   * @return the <code>Date</code> representing the exact sunset time. If the calculation can't be computed such as in
   *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the page.
   * @see AstronomicalCalculator#adjustZenith
   * @see #getSeaLevelSunset()
   * @see AstronomicalCalendar#getUTCSunset
   */
  getSunset() {
    const sunset = this.getUTCSunset(_AstronomicalCalendar.GEOMETRIC_ZENITH);
    if (Number.isNaN(sunset))
      return null;
    return this.getDateFromTime(sunset, false);
  }
  /**
   * A method that returns the sunset without {@link AstronomicalCalculator#getElevationAdjustment(double) elevation
     * adjustment}. Non-sunrise and sunset calculations such as dawn and dusk, depend on the amount of visible light,
   * something that is not affected by elevation. This method returns sunset calculated at sea level. This forms the
   * base for dusk calculations that are calculated as a dip below the horizon after sunset.
   *
   * @return the <code>Date</code> representing the exact sea-level sunset time. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a null will be returned. See detailed explanation on top of the page.
   * @see AstronomicalCalendar#getSunset
   * @see AstronomicalCalendar#getUTCSeaLevelSunset 2see {@link #getSunset()}
   */
  getSeaLevelSunset() {
    const sunset = this.getUTCSeaLevelSunset(_AstronomicalCalendar.GEOMETRIC_ZENITH);
    if (Number.isNaN(sunset))
      return null;
    return this.getDateFromTime(sunset, false);
  }
  /**
   * A method that returns the end of civil twilight using a zenith of {@link #CIVIL_ZENITH 96&deg;}.
   *
   * @return The <code>Date</code> of the end of civil twilight using a zenith of {@link #CIVIL_ZENITH 96&deg;}. If
   *         the calculation can't be computed, null will be returned. See detailed explanation on top of the page.
   * @see #CIVIL_ZENITH
   */
  getEndCivilTwilight() {
    return this.getSunsetOffsetByDegrees(_AstronomicalCalendar.CIVIL_ZENITH);
  }
  /**
   * A method that returns the end of nautical twilight using a zenith of {@link #NAUTICAL_ZENITH 102&deg;}.
   *
   * @return The <code>Date</code> of the end of nautical twilight using a zenith of {@link #NAUTICAL_ZENITH 102&deg;}
   *         . If the calculation can't be computed, null will be returned. See detailed explanation on top of the
   *         page.
   * @see #NAUTICAL_ZENITH
   */
  getEndNauticalTwilight() {
    return this.getSunsetOffsetByDegrees(_AstronomicalCalendar.NAUTICAL_ZENITH);
  }
  /**
   * A method that returns the end of astronomical twilight using a zenith of {@link #ASTRONOMICAL_ZENITH 108&deg;}.
   *
   * @return the <code>Date</code> of the end of astronomical twilight using a zenith of {@link #ASTRONOMICAL_ZENITH
     *         108&deg;}. If the calculation can't be computed, null will be returned. See detailed explanation on top
   *         of the page.
   * @see #ASTRONOMICAL_ZENITH
   */
  getEndAstronomicalTwilight() {
    return this.getSunsetOffsetByDegrees(_AstronomicalCalendar.ASTRONOMICAL_ZENITH);
  }
  /**
   * A utility method that returns a date offset by the offset time passed in. Please note that the level of light
   * during twilight is not affected by elevation, so if this is being used to calculate an offset before sunrise or
   * after sunset with the intent of getting a rough "level of light" calculation, the sunrise or sunset time passed
   * to this method should be sea level sunrise and sunset.
   *
   * @param time
   *            the start time
   * @param offset
   *            the offset in milliseconds to add to the time.
   * @return the {@link java.util.Date} with the offset in milliseconds added to it
   */
  static getTimeOffset(time, offset) {
    if (time === null || offset === Long_MIN_VALUE || Number.isNaN(offset)) {
      return null;
    }
    return time.plus({ milliseconds: offset });
  }
  /**
   * A utility method that returns the time of an offset by degrees below or above the horizon of
   * {@link #getSunrise() sunrise}. Note that the degree offset is from the vertical, so for a calculation of 14&deg;
   * before sunrise, an offset of 14 + {@link #GEOMETRIC_ZENITH} = 104 would have to be passed as a parameter.
   *
   * @param offsetZenith
   *            the degrees before {@link #getSunrise()} to use in the calculation. For time after sunrise use
   *            negative numbers. Note that the degree offset is from the vertical, so for a calculation of 14&deg;
   *            before sunrise, an offset of 14 + {@link #GEOMETRIC_ZENITH} = 104 would have to be passed as a
   *            parameter.
   * @return The {@link java.util.Date} of the offset after (or before) {@link #getSunrise()}. If the calculation
   *         can't be computed such as in the Arctic Circle where there is at least one day a year where the sun does
   *         not rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
   *         page.
   */
  getSunriseOffsetByDegrees(offsetZenith) {
    const dawn = this.getUTCSunrise(offsetZenith);
    if (Number.isNaN(dawn))
      return null;
    return this.getDateFromTime(dawn, true);
  }
  /**
   * A utility method that returns the time of an offset by degrees below or above the horizon of {@link #getSunset()
     * sunset}. Note that the degree offset is from the vertical, so for a calculation of 14&deg; after sunset, an
   * offset of 14 + {@link #GEOMETRIC_ZENITH} = 104 would have to be passed as a parameter.
   *
   * @param offsetZenith
   *            the degrees after {@link #getSunset()} to use in the calculation. For time before sunset use negative
   *            numbers. Note that the degree offset is from the vertical, so for a calculation of 14&deg; after
   *            sunset, an offset of 14 + {@link #GEOMETRIC_ZENITH} = 104 would have to be passed as a parameter.
   * @return The {@link java.util.Date}of the offset after (or before) {@link #getSunset()}. If the calculation can't
   *         be computed such as in the Arctic Circle where there is at least one day a year where the sun does not
   *         rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
   *         page.
   */
  getSunsetOffsetByDegrees(offsetZenith) {
    const sunset = this.getUTCSunset(offsetZenith);
    if (Number.isNaN(sunset))
      return null;
    return this.getDateFromTime(sunset, false);
  }
  /**
   * A method that returns the sunrise in UTC time without correction for time zone offset from GMT and without using
   * daylight savings time.
   *
   * @param zenith
   *            the degrees below the horizon. For time after sunrise use negative numbers.
   * @return The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, {@link Double#NaN} will be returned. See detailed explanation on top of the page.
   */
  getUTCSunrise(zenith) {
    return this.getAstronomicalCalculator().getUTCSunrise(this.getAdjustedDate(), this.getGeoLocation(), zenith, true);
  }
  /**
   * A method that returns the sunrise in UTC time without correction for time zone offset from GMT and without using
   * daylight savings time. Non-sunrise and sunset calculations such as dawn and dusk, depend on the amount of visible
   * light, something that is not affected by elevation. This method returns UTC sunrise calculated at sea level. This
   * forms the base for dawn calculations that are calculated as a dip below the horizon before sunrise.
   *
   * @param zenith
   *            the degrees below the horizon. For time after sunrise use negative numbers.
   * @return The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, {@link Double#NaN} will be returned. See detailed explanation on top of the page.
   * @see AstronomicalCalendar#getUTCSunrise
   * @see AstronomicalCalendar#getUTCSeaLevelSunset
   */
  getUTCSeaLevelSunrise(zenith) {
    return this.getAstronomicalCalculator().getUTCSunrise(this.getAdjustedDate(), this.getGeoLocation(), zenith, false);
  }
  /**
   * A method that returns the sunset in UTC time without correction for time zone offset from GMT and without using
   * daylight savings time.
   *
   * @param zenith
   *            the degrees below the horizon. For time after sunset use negative numbers.
   * @return The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, {@link Double#NaN} will be returned. See detailed explanation on top of the page.
   * @see AstronomicalCalendar#getUTCSeaLevelSunset
   */
  getUTCSunset(zenith) {
    return this.getAstronomicalCalculator().getUTCSunset(this.getAdjustedDate(), this.getGeoLocation(), zenith, true);
  }
  /**
   * A method that returns the sunset in UTC time without correction for elevation, time zone offset from GMT and
   * without using daylight savings time. Non-sunrise and sunset calculations such as dawn and dusk, depend on the
   * amount of visible light, something that is not affected by elevation. This method returns UTC sunset calculated
   * at sea level. This forms the base for dusk calculations that are calculated as a dip below the horizon after
   * sunset.
   *
   * @param zenith
   *            the degrees below the horizon. For time before sunset use negative numbers.
   * @return The time in the format: 18.75 for 18:45:00 UTC/GMT. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, {@link Double#NaN} will be returned. See detailed explanation on top of the page.
   * @see AstronomicalCalendar#getUTCSunset
   * @see AstronomicalCalendar#getUTCSeaLevelSunrise
   */
  getUTCSeaLevelSunset(zenith) {
    return this.getAstronomicalCalculator().getUTCSunset(this.getAdjustedDate(), this.getGeoLocation(), zenith, false);
  }
  /**
   * A method that returns an {@link AstronomicalCalculator#getElevationAdjustment(double) elevation adjusted}
   * temporal (solar) hour. The day from {@link #getSunrise() sunrise} to {@link #getSunset() sunset} is split into 12
   * equal parts with each one being a temporal hour.
   *
   * @see #getSunrise()
   * @see #getSunset()
   * @see #getTemporalHour(Date, Date)
   *
   * @return the <code>long</code> millisecond length of a temporal hour. If the calculation can't be computed,
   *         {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the page.
   *
   * @see #getTemporalHour(Date, Date)
   */
  /*
      public getTemporalHour(): number {
          return this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
      }
  */
  /**
   * A utility method that will allow the calculation of a temporal (solar) hour based on the sunrise and sunset
   * passed as parameters to this method. An example of the use of this method would be the calculation of a
   * non-elevation adjusted temporal hour by passing in {@link #getSeaLevelSunrise() sea level sunrise} and
   * {@link #getSeaLevelSunset() sea level sunset} as parameters.
   *
   * @param startOfday
   *            The start of the day.
   * @param endOfDay
   *            The end of the day.
   *
   * @return the <code>long</code> millisecond length of the temporal hour. If the calculation can't be computed a
   *         {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the page.
   *
   * @see #getTemporalHour()
   */
  getTemporalHour(startOfday = this.getSeaLevelSunrise(), endOfDay = this.getSeaLevelSunset()) {
    if (startOfday === null || endOfDay === null) {
      return Long_MIN_VALUE;
    }
    return (endOfDay.valueOf() - startOfday.valueOf()) / 12;
  }
  /**
   * A method that returns sundial or solar noon. It occurs when the Sun is <a href
   * ="http://en.wikipedia.org/wiki/Transit_%28astronomy%29">transiting</a> the <a
   * href="http://en.wikipedia.org/wiki/Meridian_%28astronomy%29">celestial meridian</a>. In this class it is
   * calculated as halfway between sea level sunrise and sea level sunset, which can be slightly off the real transit
   * time due to changes in declination (the lengthening or shortening day).
   *
   * @return the <code>Date</code> representing Sun's transit. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, null will be returned. See detailed explanation on top of the page.
   * @see #getSunTransit(Date, Date)
   * @see #getTemporalHour()
   */
  /*
      public getSunTransit(): Date {
          return this.getSunTransit(getSeaLevelSunrise(), this.getSeaLevelSunset());
      }
  */
  /**
   * A method that returns sundial or solar noon. It occurs when the Sun is <a href
   * ="http://en.wikipedia.org/wiki/Transit_%28astronomy%29">transiting</a> the <a
   * href="http://en.wikipedia.org/wiki/Meridian_%28astronomy%29">celestial meridian</a>. In this class it is
   * calculated as halfway between the sunrise and sunset passed to this method. This time can be slightly off the
   * real transit time due to changes in declination (the lengthening or shortening day).
   *
   * @param startOfDay
   *            the start of day for calculating the sun's transit. This can be sea level sunrise, visual sunrise (or
   *            any arbitrary start of day) passed to this method.
   * @param endOfDay
   *            the end of day for calculating the sun's transit. This can be sea level sunset, visual sunset (or any
   *            arbitrary end of day) passed to this method.
   *
   * @return the <code>Date</code> representing Sun's transit. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, null will be returned. See detailed explanation on top of the page.
   */
  getSunTransit(startOfDay = this.getSeaLevelSunrise(), endOfDay = this.getSeaLevelSunset()) {
    const temporalHour = this.getTemporalHour(startOfDay, endOfDay);
    return _AstronomicalCalendar.getTimeOffset(startOfDay, temporalHour * 6);
  }
  /**
   * A method that returns a <code>Date</code> from the time passed in as a parameter.
   *
   * @param time
   *            The time to be set as the time for the <code>Date</code>. The time expected is in the format: 18.75
   *            for 6:45:00 PM.
   * @param isSunrise true if the time is sunrise, and false if it is sunset
   * @return The Date.
   */
  getDateFromTime(time, isSunrise) {
    if (Number.isNaN(time)) {
      return null;
    }
    let calculatedTime = time;
    const adjustedDate = this.getAdjustedDate();
    let cal = DateTime.utc(adjustedDate.year, adjustedDate.month, adjustedDate.day);
    const hours = Math.trunc(calculatedTime);
    calculatedTime -= hours;
    const minutes = Math.trunc(calculatedTime *= 60);
    calculatedTime -= minutes;
    const seconds = Math.trunc(calculatedTime *= 60);
    calculatedTime -= seconds;
    const localTimeHours = Math.trunc(this.getGeoLocation().getLongitude() / 15);
    if (isSunrise && localTimeHours + hours > 18) {
      cal = cal.minus({ days: 1 });
    } else if (!isSunrise && localTimeHours + hours < 6) {
      cal = cal.plus({ days: 1 });
    }
    return cal.set({
      hour: hours,
      minute: minutes,
      second: seconds,
      millisecond: Math.trunc(calculatedTime * 1e3)
    });
  }
  /**
   * Returns the dip below the horizon before sunrise that matches the offset minutes on passed in as a parameter. For
   * example passing in 72 minutes for a calendar set to the equinox in Jerusalem returns a value close to 16.1&deg;
   * Please note that this method is very slow and inefficient and should NEVER be used in a loop. TODO: Improve
   * efficiency.
   *
   * @param minutes
   *            offset
   * @return the degrees below the horizon before sunrise that match the offset in minutes passed it as a parameter.
   * @see #getSunsetSolarDipFromOffset(double)
   */
  getSunriseSolarDipFromOffset(minutes) {
    if (Number.isNaN(minutes))
      return null;
    let offsetByDegrees = this.getSeaLevelSunrise();
    const offsetByTime = _AstronomicalCalendar.getTimeOffset(this.getSeaLevelSunrise(), -(minutes * _AstronomicalCalendar.MINUTE_MILLIS));
    let degrees = new Big(0);
    const incrementor = new Big("0.0001");
    while (offsetByDegrees === null || (minutes < 0 && offsetByDegrees < offsetByTime || minutes > 0 && offsetByDegrees > offsetByTime)) {
      if (minutes > 0) {
        degrees = degrees.add(incrementor);
      } else {
        degrees = degrees.sub(incrementor);
      }
      offsetByDegrees = this.getSunriseOffsetByDegrees(_AstronomicalCalendar.GEOMETRIC_ZENITH + degrees.toNumber());
    }
    return degrees.toNumber();
  }
  /**
   * Returns the dip below the horizon after sunset that matches the offset minutes on passed in as a parameter. For
   * example passing in 72 minutes for a calendar set to the equinox in Jerusalem returns a value close to 16.1&deg;
   * Please note that this method is very slow and inefficient and should NEVER be used in a loop. TODO: Improve
   * efficiency.
   *
   * @param minutes
   *            offset
   * @return the degrees below the horizon after sunset that match the offset in minutes passed it as a parameter.
   * @see #getSunriseSolarDipFromOffset(double)
   */
  getSunsetSolarDipFromOffset(minutes) {
    if (Number.isNaN(minutes))
      return null;
    let offsetByDegrees = this.getSeaLevelSunset();
    const offsetByTime = _AstronomicalCalendar.getTimeOffset(this.getSeaLevelSunset(), minutes * _AstronomicalCalendar.MINUTE_MILLIS);
    let degrees = new Big(0);
    const incrementor = new Big("0.001");
    while (offsetByDegrees == null || (minutes > 0 && offsetByDegrees < offsetByTime || minutes < 0 && offsetByDegrees > offsetByTime)) {
      if (minutes > 0) {
        degrees = degrees.add(incrementor);
      } else {
        degrees = degrees.sub(incrementor);
      }
      offsetByDegrees = this.getSunsetOffsetByDegrees(_AstronomicalCalendar.GEOMETRIC_ZENITH + degrees.toNumber());
    }
    return degrees.toNumber();
  }
  /**
   * FIXME broken for czc.getRiseSetSolarDipFromOffset(-72, czc.getSunrise());
   * and broken in other was as well
   * @param minutes
   * @param riseSet
   * @return
   */
  /*
      public getRiseSetSolarDipFromOffset(minutes: number, riseSet: DateTime): number {
        let offsetByDegrees: DateTime | null = riseSet;
        const offsetByTime: DateTime | null = AstronomicalCalendar.getTimeOffset(riseSet, minutes * AstronomicalCalendar.MINUTE_MILLIS);
  
        let degrees: Big = new Big(0);
        const incrementor: Big = new Big('0.001');
  
        while (offsetByDegrees == null || ((minutes > 0 && offsetByDegrees < offsetByTime!)
          || (minutes < 0 && offsetByDegrees > offsetByTime!))) {
          if (minutes > 0) {
            degrees = degrees.add(incrementor);
          } else {
            degrees = degrees.sub(incrementor);
          }
          offsetByDegrees = this.getSunsetOffsetByDegrees(AstronomicalCalendar.GEOMETRIC_ZENITH + degrees.toNumber());
        }
        return degrees.valueOf();
      }
    */
  /**
   * Adjusts the <code>Calendar</code> to deal with edge cases where the location crosses the antimeridian.
   *
   * @see GeoLocation#getAntimeridianAdjustment()
   * @return the adjusted Calendar
   */
  getAdjustedDate() {
    const offset = this.getGeoLocation().getAntimeridianAdjustment();
    if (offset === 0)
      return this.getDate();
    return this.getDate().plus({ days: offset });
  }
  /**
   * @return an XML formatted representation of the class. It returns the default output of the
   *         {@link ZmanimFormatter#toXML(AstronomicalCalendar) toXML} method.
   * @see ZmanimFormatter#toXML(AstronomicalCalendar)
   * @see java.lang.Object#toString()
   * @deprecated (This depends on a circular dependency).
   */
  // eslint-disable-next-line class-methods-use-this
  toString() {
    throw new UnsupportedError("This method is unsupported, due to the fact that it depends on a circular dependency.");
  }
  /**
   * @return a JSON formatted representation of the class. It returns the default output of the
   *         {@link ZmanimFormatter#toJSON(AstronomicalCalendar) toJSON} method.
   * @see ZmanimFormatter#toJSON(AstronomicalCalendar)
   * @see java.lang.Object#toString()
   * @deprecated  This depends on a circular dependency. Use <pre>ZmanimFormatter.toJSON(astronomicalCalendar)</pre> instead.
   */
  // eslint-disable-next-line class-methods-use-this
  toJSON() {
    throw new UnsupportedError("This method is unsupported, due to the fact that it depends on a circular dependency. Use `ZmanimFormatter.toJSON(astronomicalCalendar)` instead.");
  }
  /**
   * @see java.lang.Object#equals(Object)
   */
  equals(object) {
    if (this === object) {
      return true;
    }
    if (!(object instanceof _AstronomicalCalendar)) {
      return false;
    }
    const aCal = object;
    return this.getDate().equals(aCal.getDate()) && this.getGeoLocation().equals(aCal.getGeoLocation()) && this.getAstronomicalCalculator() === aCal.getAstronomicalCalculator();
  }
  /**
   * A method that returns the currently set {@link GeoLocation} which contains location information used for the
   * astronomical calculations.
   *
   * @return Returns the geoLocation.
   */
  getGeoLocation() {
    return this.geoLocation;
  }
  /**
   * Sets the {@link GeoLocation} <code>Object</code> to be used for astronomical calculations.
   *
   * @param geoLocation
   *            The geoLocation to set.
   */
  setGeoLocation(geoLocation) {
    this.geoLocation = geoLocation;
    this.date = this.date.setZone(geoLocation.getTimeZone());
  }
  /**
   * A method that returns the currently set AstronomicalCalculator.
   *
   * @return Returns the astronomicalCalculator.
   * @see #setAstronomicalCalculator(AstronomicalCalculator)
   */
  getAstronomicalCalculator() {
    return this.astronomicalCalculator;
  }
  /**
   * A method to set the {@link AstronomicalCalculator} used for astronomical calculations. The Zmanim package ships
   * with a number of different implementations of the <code>abstract</code> {@link AstronomicalCalculator} based on
   * different algorithms, including {@link SunTimesCalculator one implementation} based
   * on the <a href = "http://aa.usno.navy.mil/">US Naval Observatory's</a> algorithm, and
   * {@link NOAACalculator another} based on <a href="http://noaa.gov">NOAA's</a>
   * algorithm. This allows easy runtime switching and comparison of different algorithms.
   *
   * @param astronomicalCalculator
   *            The astronomicalCalculator to set.
   */
  setAstronomicalCalculator(astronomicalCalculator) {
    this.astronomicalCalculator = astronomicalCalculator;
  }
  /**
   * returns the Calendar object encapsulated in this class.
   *
   * @return Returns the calendar.
   */
  getDate() {
    return this.date;
  }
  /**
   * @param calendar
   *            The calendar to set.
   */
  setDate(date) {
    if (DateTime.isDateTime(date)) {
      this.date = date;
    } else if (date instanceof Date) {
      this.date = DateTime.fromJSDate(date);
    } else if (typeof date === "string") {
      this.date = DateTime.fromISO(date);
    } else if (typeof date === "number") {
      this.date = DateTime.fromMillis(date);
    }
  }
  /**
   * A method that creates a <a href="http://en.wikipedia.org/wiki/Object_copy#Deep_copy">deep copy</a> of the object.
   * <b>Note:</b> If the {@link java.util.TimeZone} in the cloned {@link GeoLocation} will
   * be changed from the original, it is critical that
   * {@link AstronomicalCalendar#getCalendar()}.
   * {@link java.util.Calendar#setTimeZone(TimeZone) setTimeZone(TimeZone)} be called in order for the
   * AstronomicalCalendar to output times in the expected offset after being cloned.
   *
   * @see java.lang.Object#clone()
   * @since 1.1
   */
  clone() {
    const clonedCalendar = new _AstronomicalCalendar();
    clonedCalendar.setDate(this.date);
    clonedCalendar.setAstronomicalCalculator(this.astronomicalCalculator);
    clonedCalendar.setGeoLocation(this.geoLocation);
    return clonedCalendar;
  }
  // eslint-disable-next-line class-methods-use-this
  getClassName() {
    return "com.kosherjava.zmanim.AstronomicalCalendar";
  }
};
/**
 * 90&deg; below the vertical. Used as a basis for most calculations since the location of the sun is 90&deg; below
 * the horizon at sunrise and sunset.
 * <b>Note </b>: it is important to note that for sunrise and sunset the {@link AstronomicalCalculator#adjustZenith
   * adjusted zenith} is required to account for the radius of the sun and refraction. The adjusted zenith should not
 * be used for calculations above or below 90&deg; since they are usually calculated as an offset to 90&deg;.
 */
__publicField$d(_AstronomicalCalendar, "GEOMETRIC_ZENITH", 90);
/**
 * Default value for Sun's zenith and true rise/set Zenith (used in this class and subclasses) is the angle that the
 * center of the Sun makes to a line perpendicular to the Earth's surface. If the Sun were a point and the Earth
 * were without an atmosphere, true sunset and sunrise would correspond to a 90&deg; zenith. Because the Sun is not
 * a point, and because the atmosphere refracts light, this 90&deg; zenith does not, in fact, correspond to true
 * sunset or sunrise, instead the center of the Sun's disk must lie just below the horizon for the upper edge to be
 * obscured. This means that a zenith of just above 90&deg; must be used. The Sun subtends an angle of 16 minutes of
 * arc (this can be changed via the {@link #setSunRadius(double)} method , and atmospheric refraction accounts for
 * 34 minutes or so (this can be changed via the {@link #setRefraction(double)} method), giving a total of 50
 * arcminutes. The total value for ZENITH is 90+(5/6) or 90.8333333&deg; for true sunrise/sunset.
 */
// const ZENITH: number = GEOMETRIC_ZENITH + 5.0 / 6.0;
/** Sun's zenith at civil twilight (96&deg;). */
__publicField$d(_AstronomicalCalendar, "CIVIL_ZENITH", 96);
/** Sun's zenith at nautical twilight (102&deg;). */
__publicField$d(_AstronomicalCalendar, "NAUTICAL_ZENITH", 102);
/** Sun's zenith at astronomical twilight (108&deg;). */
__publicField$d(_AstronomicalCalendar, "ASTRONOMICAL_ZENITH", 108);
/** constant for milliseconds in a minute (60,000) */
__publicField$d(_AstronomicalCalendar, "MINUTE_MILLIS", 60 * 1e3);
/** constant for milliseconds in an hour (3,600,000) */
__publicField$d(_AstronomicalCalendar, "HOUR_MILLIS", _AstronomicalCalendar.MINUTE_MILLIS * 60);
let AstronomicalCalendar = _AstronomicalCalendar;

var __defProp$c = Object.defineProperty;
var __defNormalProp$c = (obj, key, value) => key in obj ? __defProp$c(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$c = (obj, key, value) => {
  __defNormalProp$c(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _JewishDate = class _JewishDate {
  constructor(jewishYearOrDateTimeOrDateOrMolad, jewishMonth, jewishDayOfMonth) {
    /** the internal Jewish month. */
    __publicField$c(this, "jewishMonth");
    /** the internal Jewish day. */
    __publicField$c(this, "jewishDay");
    /** the internal Jewish year. */
    __publicField$c(this, "jewishYear");
    /** the internal count of <em>molad</em> hours. */
    __publicField$c(this, "moladHours");
    /** the internal count of <em>molad</em> minutes. */
    __publicField$c(this, "moladMinutes");
    /** the internal count of <em>molad</em> <em>chalakim</em>. */
    __publicField$c(this, "moladChalakim");
    /**
     * The month, where 1 == January, 2 == February, etc... Note that this is different than the Java's Calendar class
     * where January ==0
     */
    __publicField$c(this, "gregorianMonth");
    /** The day of the Gregorian month */
    __publicField$c(this, "gregorianDayOfMonth");
    /** The Gregorian year */
    __publicField$c(this, "gregorianYear");
    /** 1 == Sunday, 2 == Monday, etc... */
    __publicField$c(this, "dayOfWeek");
    /** Returns the absolute date (days since January 1, 0001 on the Gregorian calendar).
     * @see #getAbsDate()
     * @see #absDateToJewishDate()
     */
    __publicField$c(this, "gregorianAbsDate");
    if (!jewishYearOrDateTimeOrDateOrMolad) {
      this.resetDate();
    } else if (jewishMonth) {
      this.setJewishDate(jewishYearOrDateTimeOrDateOrMolad, jewishMonth, jewishDayOfMonth);
    } else if (jewishYearOrDateTimeOrDateOrMolad instanceof Date) {
      this.setDate(DateTime.fromJSDate(jewishYearOrDateTimeOrDateOrMolad));
    } else if (DateTime.isDateTime(jewishYearOrDateTimeOrDateOrMolad)) {
      this.setDate(jewishYearOrDateTimeOrDateOrMolad);
    } else if (typeof jewishYearOrDateTimeOrDateOrMolad === "number") {
      const molad = jewishYearOrDateTimeOrDateOrMolad;
      this.absDateToDate(_JewishDate.moladToAbsDate(molad));
      const conjunctionDay = Math.trunc(molad / _JewishDate.CHALAKIM_PER_DAY);
      const conjunctionParts = Math.trunc(molad - conjunctionDay * _JewishDate.CHALAKIM_PER_DAY);
      this.setMoladTime(conjunctionParts);
    }
  }
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
  getMoladHours() {
    return this.moladHours;
  }
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
  setMoladHours(moladHours) {
    this.moladHours = moladHours;
  }
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
  getMoladMinutes() {
    return this.moladMinutes;
  }
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
  setMoladMinutes(moladMinutes) {
    this.moladMinutes = moladMinutes;
  }
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
  setMoladChalakim(moladChalakim) {
    this.moladChalakim = moladChalakim;
  }
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
  getMoladChalakim() {
    return this.moladChalakim;
  }
  /**
   * Returns the last day in a gregorian month
   *
   * @param month
   *            the Gregorian month
   * @return the last day of the Gregorian month
   */
  getLastDayOfGregorianMonth(month) {
    return _JewishDate.getLastDayOfGregorianMonth(month, this.gregorianYear);
  }
  /**
   * Returns the number of days in a given month in a given month and year.
   *
   * @param month
   *            the month. As with other cases in this class, this is 1-based, not zero-based.
   * @param year
   *            the year (only impacts February)
   * @return the number of days in the month in the given year
   */
  static getLastDayOfGregorianMonth(month, year) {
    switch (month) {
      case 2:
        if (year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) {
          return 29;
        }
        return 28;
      case 4:
      case 6:
      case 9:
      case 11:
        return 30;
      default:
        return 31;
    }
  }
  /**
   * Computes the Gregorian date from the absolute date. ND+ER
   * @param absDate - the absolute date
   */
  absDateToDate(absDate) {
    let year = Math.trunc(absDate / 366);
    while (absDate >= _JewishDate.gregorianDateToAbsDate(year + 1, 1, 1)) {
      year++;
    }
    let month = 1;
    while (absDate > _JewishDate.gregorianDateToAbsDate(year, month, _JewishDate.getLastDayOfGregorianMonth(month, year))) {
      month++;
    }
    const dayOfMonth = absDate - _JewishDate.gregorianDateToAbsDate(year, month, 1) + 1;
    this.setInternalGregorianDate(year, month, dayOfMonth);
  }
  /**
   * Returns the absolute date (days since January 1, 0001 on the Gregorian calendar).
   *
   * @return the number of days since January 1, 1
   */
  getAbsDate() {
    return this.gregorianAbsDate;
  }
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
  static gregorianDateToAbsDate(year, month, dayOfMonth) {
    let absDate = dayOfMonth;
    for (let m = month - 1; m > 0; m--) {
      absDate += _JewishDate.getLastDayOfGregorianMonth(m, year);
    }
    return absDate + 365 * (year - 1) + Math.trunc((year - 1) / 4) - Math.trunc((year - 1) / 100) + Math.trunc((year - 1) / 400);
  }
  /**
   * Returns if the year is a Jewish leap year. Years 3, 6, 8, 11, 14, 17 and 19 in the 19 year cycle are leap years.
   *
   * @param year
   *            the Jewish year.
   * @return true if it is a leap year
   * @see #isJewishLeapYear()
   */
  static isJewishLeapYear(year) {
    return (7 * year + 1) % 19 < 7;
  }
  /**
   * Returns if the year the calendar is set to is a Jewish leap year. Years 3, 6, 8, 11, 14, 17 and 19 in the 19 year
   * cycle are leap years.
   *
   * @return true if it is a leap year
   * @see #isJewishLeapYear(int)
   */
  isJewishLeapYear() {
    return _JewishDate.isJewishLeapYear(this.getJewishYear());
  }
  /**
   * Returns the last month of a given Jewish year. This will be 12 on a non {@link #isJewishLeapYear(int) leap year}
   * or 13 on a leap year.
   *
   * @param year
   *            the Jewish year.
   * @return 12 on a non leap year or 13 on a leap year
   * @see #isJewishLeapYear(int)
   */
  static getLastMonthOfJewishYear(year) {
    return _JewishDate.isJewishLeapYear(year) ? _JewishDate.ADAR_II : _JewishDate.ADAR;
  }
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
  static getJewishCalendarElapsedDays(year) {
    const chalakimSince = _JewishDate.getChalakimSinceMoladTohu(year, _JewishDate.TISHREI);
    const moladDay = Math.trunc(chalakimSince / _JewishDate.CHALAKIM_PER_DAY);
    const moladParts = Math.trunc(chalakimSince - moladDay * _JewishDate.CHALAKIM_PER_DAY);
    return _JewishDate.addDechiyos(year, moladDay, moladParts);
  }
  // private static int getJewishCalendarElapsedDaysOLD(int year) {
  // // Jewish lunar month = 29 days, 12 hours and 793 chalakim
  // // Molad Tohu = BeHaRaD - Monday, 5 hours (11 PM) and 204 chalakim
  // final int chalakimTashTZag = 793; // chalakim in a lunar month
  // final int chalakimTohuRaD = 204; // chalakim from original molad Tohu BeHaRaD
  // final int hoursTohuHa = 5; // hours from original molad Tohu BeHaRaD
  // final int dayTohu = 1; // Monday (0 based)
  //
  // int monthsElapsed = (235 * ((year - 1) / 19)) // Months in complete 19 year lunar (Metonic) cycles so far
  // + (12 * ((year - 1) % 19)) // Regular months in this cycle
  // + ((7 * ((year - 1) % 19) + 1) / 19); // Leap months this cycle
  // // start with Molad Tohu BeHaRaD
  // // start with RaD of BeHaRaD and add TaShTzaG (793) chalakim plus elapsed chalakim
  // int partsElapsed = chalakimTohuRaD + chalakimTashTZag * (monthsElapsed % 1080);
  // // start with Ha hours of BeHaRaD, add 12 hour remainder of lunar month add hours elapsed
  // int hoursElapsed = hoursTohuHa + 12 * monthsElapsed + 793 * (monthsElapsed / 1080) + partsElapsed / 1080;
  // // start with Monday of BeHaRaD = 1 (0 based), add 29 days of the lunar months elapsed
  // int conjunctionDay = dayTohu + 29 * monthsElapsed + hoursElapsed / 24;
  // int conjunctionParts = 1080 * (hoursElapsed % 24) + partsElapsed % 1080;
  // return addDechiyos(year, conjunctionDay, conjunctionParts);
  // }
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
  static addDechiyos(year, moladDay, moladParts) {
    let roshHashanaDay = moladDay;
    if (moladParts >= 19440 || moladDay % 7 === 2 && moladParts >= 9924 && !_JewishDate.isJewishLeapYear(year) || moladDay % 7 === 1 && moladParts >= 16789 && _JewishDate.isJewishLeapYear(year - 1)) {
      roshHashanaDay += 1;
    }
    if (roshHashanaDay % 7 === 0 || roshHashanaDay % 7 === 3 || roshHashanaDay % 7 === 5) {
      roshHashanaDay++;
    }
    return roshHashanaDay;
  }
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
  static getChalakimSinceMoladTohu(year, month) {
    const monthOfYear = _JewishDate.getJewishMonthOfYear(year, month);
    const monthsElapsed = 235 * Math.trunc((year - 1) / 19) + 12 * ((year - 1) % 19) + Math.trunc((7 * ((year - 1) % 19) + 1) / 19) + (monthOfYear - 1);
    return _JewishDate.CHALAKIM_MOLAD_TOHU + _JewishDate.CHALAKIM_PER_MONTH * monthsElapsed;
  }
  /**
   * Returns the number of chalakim (parts - 1080 to the hour) from the original hypothetical Molad Tohu to the Jewish
   * year and month that this Object is set to.
   *
   * @return the number of chalakim (parts - 1080 to the hour) from the original hypothetical Molad Tohu
   */
  getChalakimSinceMoladTohu() {
    return _JewishDate.getChalakimSinceMoladTohu(this.jewishYear, this.jewishMonth);
  }
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
  static getJewishMonthOfYear(year, month) {
    const isLeapYear = _JewishDate.isJewishLeapYear(year);
    return (month + (isLeapYear ? 6 : 5)) % (isLeapYear ? 13 : 12) + 1;
  }
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
  static validateJewishDate(year, month, dayOfMonth, hours, minutes, chalakim) {
    if (month < _JewishDate.NISSAN || month > _JewishDate.getLastMonthOfJewishYear(year)) {
      throw new IllegalArgumentException(`The Jewish month has to be between 1 and 12 (or 13 on a leap year). ${month} is invalid for the year ${year}.`);
    }
    if (dayOfMonth < 1 || dayOfMonth > 30) {
      throw new IllegalArgumentException(`The Jewish day of month can't be < 1 or > 30. ${dayOfMonth} is invalid.`);
    }
    if (year < 3761 || year === 3761 && (month >= _JewishDate.TISHREI && month < _JewishDate.TEVES) || year === 3761 && month === _JewishDate.TEVES && dayOfMonth < 18) {
      throw new IllegalArgumentException(`A Jewish date earlier than 18 Teves, 3761 (1/1/1 Gregorian) can't be set. ${year}, ${month}, ${dayOfMonth} is invalid.`);
    }
    if (hours < 0 || hours > 23) {
      throw new IllegalArgumentException(`Hours < 0 or > 23 can't be set. ${hours} is invalid.`);
    }
    if (minutes < 0 || minutes > 59) {
      throw new IllegalArgumentException(`Minutes < 0 or > 59 can't be set. ${minutes} is invalid.`);
    }
    if (chalakim < 0 || chalakim > 17) {
      throw new IllegalArgumentException(`Chalakim/parts < 0 or > 17 can't be set. ${chalakim} is invalid. For larger numbers such as 793 (TaShTzaG) break the chalakim into minutes (18 chalakim per minutes, so it would be 44 minutes and 1 chelek in the case of 793 (TaShTzaG)`);
    }
  }
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
  static validateGregorianDate(year, month, dayOfMonth) {
    _JewishDate.validateGregorianMonth(month);
    _JewishDate.validateGregorianDayOfMonth(dayOfMonth);
    _JewishDate.validateGregorianYear(year);
  }
  /**
   * Validates a Gregorian month for validity.
   *
   * @param month
   *            the Gregorian month number to validate. It will enforce that the month is between 0 - 11 like a
   *            {@link GregorianCalendar}, where {@link Calendar#JANUARY} has a value of 0.
   */
  static validateGregorianMonth(month) {
    if (month > 11 || month < 0) {
      throw new IllegalArgumentException(`The Gregorian month has to be between 0 - 11. ${month} is invalid.`);
    }
  }
  /**
   * Validates a Gregorian day of month for validity.
   *
   * @param dayOfMonth
   *            the day of the Gregorian month to validate. It will reject any value < 1, but will allow values > 31
   *            since calling methods will simply set it to the maximum for that month. TODO: check calling methods to
   *            see if there is any reason that the class needs days > the maximum.
   */
  static validateGregorianDayOfMonth(dayOfMonth) {
    if (dayOfMonth <= 0) {
      throw new IllegalArgumentException(`The day of month can't be less than 1. ${dayOfMonth} is invalid.`);
    }
  }
  /**
   * Validates a Gregorian year for validity.
   *
   * @param year
   *            the Gregorian year to validate. It will reject any year < 1.
   */
  static validateGregorianYear(year) {
    if (year < 1) {
      throw new IllegalArgumentException(`Years < 1 can't be calculated. ${year} is invalid.`);
    }
  }
  /**
   * Returns the number of days for a given Jewish year. ND+ER
   *
   * @param year
   *            the Jewish year
   * @return the number of days for a given Jewish year.
   * @see #isCheshvanLong()
   * @see #isKislevShort()
   */
  static getDaysInJewishYear(year) {
    return _JewishDate.getJewishCalendarElapsedDays(year + 1) - _JewishDate.getJewishCalendarElapsedDays(year);
  }
  /**
   * Returns the number of days for the current year that the calendar is set to.
   *
   * @return the number of days for the Object's current Jewish year.
   * @see #isCheshvanLong()
   * @see #isKislevShort()
   * @see #isJewishLeapYear()
   */
  getDaysInJewishYear() {
    return _JewishDate.getDaysInJewishYear(this.getJewishYear());
  }
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
  static isCheshvanLong(year) {
    return _JewishDate.getDaysInJewishYear(year) % 10 === 5;
  }
  /**
   * Returns if Cheshvan is long (30 days VS 29 days) for the current year that the calendar is set to. The method
   * name isLong is done since in a Kesidran (ordered) year Cheshvan is short.
   *
   * @return true if Cheshvan is long for the current year that the calendar is set to
   * @see #isCheshvanLong()
   */
  isCheshvanLong() {
    return _JewishDate.isCheshvanLong(this.getJewishYear());
  }
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
  static isKislevShort(year) {
    return _JewishDate.getDaysInJewishYear(year) % 10 === 3;
  }
  /**
   * Returns if the Kislev is short for the year that this class is set to. The method name isShort is done since in a
   * Kesidran (ordered) year Kislev is long.
   *
   * @return true if Kislev is short for the year that this class is set to
   */
  isKislevShort() {
    return _JewishDate.isKislevShort(this.getJewishYear());
  }
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
  getCheshvanKislevKviah() {
    if (this.isCheshvanLong() && !this.isKislevShort()) {
      return _JewishDate.SHELAIMIM;
    } else if (!this.isCheshvanLong() && this.isKislevShort()) {
      return _JewishDate.CHASERIM;
    }
    return _JewishDate.KESIDRAN;
  }
  /**
   * Returns the number of days of a Jewish month for a given month and year.
   *
   * @param month
   *            the Jewish month
   * @param year
   *            the Jewish Year
   * @return the number of days for a given Jewish month
   */
  static getDaysInJewishMonth(month, year) {
    const shortMonths = [
      _JewishDate.IYAR,
      _JewishDate.TAMMUZ,
      _JewishDate.ELUL,
      _JewishDate.ADAR_II
    ];
    if (shortMonths.includes(month) || month === _JewishDate.CHESHVAN && !_JewishDate.isCheshvanLong(year) || month === _JewishDate.KISLEV && _JewishDate.isKislevShort(year) || month === _JewishDate.TEVES || month === _JewishDate.ADAR && !_JewishDate.isJewishLeapYear(year)) {
      return 29;
    }
    return 30;
  }
  /**
   * Returns the number of days of the Jewish month that the calendar is currently set to.
   *
   * @return the number of days for the Jewish month that the calendar is currently set to.
   */
  getDaysInJewishMonth() {
    return _JewishDate.getDaysInJewishMonth(this.getJewishMonth(), this.getJewishYear());
  }
  /**
   * Computes the Jewish date from the absolute date.
   */
  absDateToJewishDate() {
    this.jewishYear = Math.trunc((this.gregorianAbsDate - _JewishDate.JEWISH_EPOCH) / 366);
    while (this.gregorianAbsDate >= _JewishDate.jewishDateToAbsDate(this.jewishYear + 1, _JewishDate.TISHREI, 1)) {
      this.jewishYear++;
    }
    if (this.gregorianAbsDate < _JewishDate.jewishDateToAbsDate(this.jewishYear, _JewishDate.NISSAN, 1)) {
      this.jewishMonth = _JewishDate.TISHREI;
    } else {
      this.jewishMonth = _JewishDate.NISSAN;
    }
    while (this.gregorianAbsDate > _JewishDate.jewishDateToAbsDate(this.jewishYear, this.jewishMonth, this.getDaysInJewishMonth())) {
      this.jewishMonth++;
    }
    this.jewishDay = this.gregorianAbsDate - _JewishDate.jewishDateToAbsDate(this.jewishYear, this.jewishMonth, 1) + 1;
  }
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
  static jewishDateToAbsDate(year, month, dayOfMonth) {
    const elapsed = _JewishDate.getDaysSinceStartOfJewishYear(year, month, dayOfMonth);
    return elapsed + _JewishDate.getJewishCalendarElapsedDays(year) + _JewishDate.JEWISH_EPOCH;
  }
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
  getMolad() {
    const moladDate = new _JewishDate(this.getChalakimSinceMoladTohu());
    if (moladDate.getMoladHours() >= 6) {
      moladDate.forward(Calendar.DATE, 1);
    }
    moladDate.setMoladHours((moladDate.getMoladHours() + 18) % 24);
    return moladDate;
  }
  /**
   * Returns the number of days from the Jewish epoch from the number of chalakim from the epoch passed in.
   *
   * @param chalakim
   *            the number of chalakim since the beginning of Sunday prior to BaHaRaD
   * @return the number of days from the Jewish epoch
   */
  static moladToAbsDate(chalakim) {
    return Math.trunc(chalakim / _JewishDate.CHALAKIM_PER_DAY) + _JewishDate.JEWISH_EPOCH;
  }
  /**
   * Constructor that creates a JewishDate based on a molad passed in. The molad would be the number of chalakim/parts
   * starting at the beginning of Sunday prior to the molad Tohu BeHaRaD (Be = Monday, Ha= 5 hours and Rad =204
   * chalakim/parts) - prior to the start of the Jewish calendar. BeHaRaD is 23:11:20 on Sunday night(5 hours 204/1080
   * chalakim after sunset on Sunday evening).
   *
   * @param molad the number of chalakim since the beginning of Sunday prior to BaHaRaD
   */
  /*
      public JewishDate(molad: number) {
          this.absDateToDate(JewishDate.moladToAbsDate(molad));
          // long chalakimSince = getChalakimSinceMoladTohu(year, JewishDate.TISHREI);// tishrei
          const conjunctionDay: number = Math.trunc(molad / JewishDate.CHALAKIM_PER_DAY);
          const conjunctionParts: number = Math.trunc(molad - conjunctionDay * JewishDate.CHALAKIM_PER_DAY);
          this.setMoladTime(conjunctionParts);
      }
  */
  /**
   * Sets the molad time (hours minutes and chalakim) based on the number of chalakim since the start of the day.
   *
   * @param chalakim
   *            the number of chalakim since the start of the day.
   */
  setMoladTime(chalakim) {
    let adjustedChalakim = chalakim;
    this.setMoladHours(Math.trunc(adjustedChalakim / _JewishDate.CHALAKIM_PER_HOUR));
    adjustedChalakim = adjustedChalakim - this.getMoladHours() * _JewishDate.CHALAKIM_PER_HOUR;
    this.setMoladMinutes(Math.trunc(adjustedChalakim / _JewishDate.CHALAKIM_PER_MINUTE));
    this.setMoladChalakim(adjustedChalakim - this.moladMinutes * _JewishDate.CHALAKIM_PER_MINUTE);
  }
  /**
   * returns the number of days from Rosh Hashana of the date passed in, to the full date passed in.
   *
   * @return the number of days
   */
  getDaysSinceStartOfJewishYear() {
    return _JewishDate.getDaysSinceStartOfJewishYear(this.getJewishYear(), this.getJewishMonth(), this.getJewishDayOfMonth());
  }
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
  static getDaysSinceStartOfJewishYear(year, month, dayOfMonth) {
    let elapsedDays = dayOfMonth;
    if (month < _JewishDate.TISHREI) {
      for (let m = _JewishDate.TISHREI; m <= _JewishDate.getLastMonthOfJewishYear(year); m++) {
        elapsedDays += _JewishDate.getDaysInJewishMonth(m, year);
      }
      for (let m = _JewishDate.NISSAN; m < month; m++) {
        elapsedDays += _JewishDate.getDaysInJewishMonth(m, year);
      }
    } else {
      for (let m = _JewishDate.TISHREI; m < month; m++) {
        elapsedDays += _JewishDate.getDaysInJewishMonth(m, year);
      }
    }
    return elapsedDays;
  }
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
  /*
      public JewishDate(jewishYear: number, jewishMonth: number, jewishDayOfMonth: number) {
          this.setJewishDate(jewishYear, jewishMonth, jewishDayOfMonth);
      }
  */
  /**
   * Default constructor will set a default date to the current system date.
   */
  /*
      public JewishDate() {
          this.resetDate();
      }
  */
  /**
   * A constructor that initializes the date to the {@link java.util.Date Date} paremeter.
   *
   * @param date
   *            the <code>Date</code> to set the calendar to
   * @throws IllegalArgumentException
   *             if the date would fall prior to the January 1, 1 AD
   */
  /*
      public JewishDate(date: Date) {
          this.setDate(date);
      }
  */
  /**
   * A constructor that initializes the date to the {@link java.util.Calendar Calendar} paremeter.
   *
   * @param calendar
   *            the <code>Calendar</code> to set the calendar to
   * @throws IllegalArgumentException
   *             if the {@link Calendar#ERA} is {@link GregorianCalendar#BC}
   */
  /*
      public JewishDate(calendar: GregorianCalendar) {
          this.setDate(calendar);
      }
  */
  /**
   * Sets the date based on a {@link java.util.Calendar Calendar} object. Modifies the Jewish date as well.
   *
   * @param date
   *            the <code>Calendar</code> to set the calendar to
   * @throws IllegalArgumentException
   *             if the {@link Calendar#ERA} is {@link GregorianCalendar#BC}
   */
  setDate(date) {
    if (date.year < 1) {
      throw new IllegalArgumentException(`Dates with a BC era are not supported. The year ${date.year} is invalid.`);
    }
    this.gregorianMonth = date.month;
    this.gregorianDayOfMonth = date.day;
    this.gregorianYear = date.year;
    this.gregorianAbsDate = _JewishDate.gregorianDateToAbsDate(this.gregorianYear, this.gregorianMonth, this.gregorianDayOfMonth);
    this.absDateToJewishDate();
    this.dayOfWeek = Math.abs(this.gregorianAbsDate % 7) + 1;
  }
  /**
   * Sets the date based on a {@link java.util.Date Date} object. Modifies the Jewish date as well.
   *
   * @param date
   *            the <code>Date</code> to set the calendar to
   * @throws IllegalArgumentException
   *             if the date would fall prior to the year 1 AD
   */
  /*
      public setDate(date: Date): void {
          const cal: GregorianCalendar = new GregorianCalendar();
          cal.setTime(date);
          this.setDate(cal);
      }
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
  setGregorianDate(year, month, dayOfMonth) {
    _JewishDate.validateGregorianDate(year, month, dayOfMonth);
    this.setInternalGregorianDate(year, month + 1, dayOfMonth);
  }
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
  setInternalGregorianDate(year, month, dayOfMonth) {
    if (dayOfMonth > _JewishDate.getLastDayOfGregorianMonth(month, year)) {
      dayOfMonth = _JewishDate.getLastDayOfGregorianMonth(month, year);
    }
    this.gregorianMonth = month;
    this.gregorianDayOfMonth = dayOfMonth;
    this.gregorianYear = year;
    this.gregorianAbsDate = _JewishDate.gregorianDateToAbsDate(this.gregorianYear, this.gregorianMonth, this.gregorianDayOfMonth);
    this.absDateToJewishDate();
    this.dayOfWeek = Math.abs(this.gregorianAbsDate % 7) + 1;
  }
  setJewishDate(year, month, dayOfMonth, hours = 0, minutes = 0, chalakim = 0) {
    _JewishDate.validateJewishDate(year, month, dayOfMonth, hours, minutes, chalakim);
    if (dayOfMonth > _JewishDate.getDaysInJewishMonth(month, year)) {
      dayOfMonth = _JewishDate.getDaysInJewishMonth(month, year);
    }
    this.jewishMonth = month;
    this.jewishDay = dayOfMonth;
    this.jewishYear = year;
    this.moladHours = hours;
    this.moladMinutes = minutes;
    this.moladChalakim = chalakim;
    this.gregorianAbsDate = _JewishDate.jewishDateToAbsDate(this.jewishYear, this.jewishMonth, this.jewishDay);
    this.absDateToDate(this.gregorianAbsDate);
    this.dayOfWeek = Math.abs(this.gregorianAbsDate % 7) + 1;
  }
  /**
   * Returns this object's date as a {@link java.util.Calendar} object.
   *
   * @return The {@link java.util.Calendar}
   */
  getDate() {
    return DateTime.fromObject({
      year: this.gregorianYear,
      month: this.gregorianMonth,
      day: this.gregorianDayOfMonth
    });
  }
  /**
   * Resets this date to the current system date.
   */
  resetDate() {
    this.setDate(DateTime.local());
  }
  /**
   * Returns a string containing the Jewish date in the form, "day Month, year" e.g. "21 Shevat, 5729". For more
   * complex formatting, use the formatter classes.
   *
   * This functionality is duplicated from {@link HebrewDateFormatter} to avoid circular dependencies.
   *
   * @return the Jewish date in the form "day Month, year" e.g. "21 Shevat, 5729"
   * @see HebrewDateFormatter#format(JewishDate)
   */
  toString() {
    const transliteratedMonths = [
      "Nissan",
      "Iyar",
      "Sivan",
      "Tammuz",
      "Av",
      "Elul",
      "Tishrei",
      "Cheshvan",
      "Kislev",
      "Teves",
      "Shevat",
      "Adar",
      "Adar II",
      "Adar I"
    ];
    let formattedMonth;
    if (this.isJewishLeapYear() && this.jewishMonth === _JewishDate.ADAR) {
      formattedMonth = transliteratedMonths[13];
    } else {
      formattedMonth = transliteratedMonths[this.jewishMonth - 1];
    }
    return `${this.getJewishDayOfMonth()} ${formattedMonth}, ${this.getJewishYear()}`;
  }
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
  forward(field, amount) {
    if (field !== Calendar.DATE && field !== Calendar.MONTH && field !== Calendar.YEAR) {
      throw new IllegalArgumentException("Unsupported field was passed to Forward. Only Calendar.DATE, Calendar.MONTH or Calendar.YEAR are supported.");
    }
    if (amount < 1) {
      throw new IllegalArgumentException("JewishDate.forward() does not support amounts less than 1. See JewishDate.back()");
    }
    if (field === Calendar.DATE) {
      for (let i = 0; i < amount; i++) {
        if (this.gregorianDayOfMonth === _JewishDate.getLastDayOfGregorianMonth(this.gregorianMonth, this.gregorianYear)) {
          this.gregorianDayOfMonth = 1;
          if (this.gregorianMonth === 12) {
            this.gregorianYear++;
          } else {
            this.gregorianMonth++;
          }
        } else {
          this.gregorianDayOfMonth++;
        }
        if (this.jewishDay === this.getDaysInJewishMonth()) {
          if (this.jewishMonth === _JewishDate.ELUL) {
            this.jewishYear++;
            this.jewishMonth++;
            this.jewishDay = 1;
          } else if (this.jewishMonth === _JewishDate.getLastMonthOfJewishYear(this.jewishYear)) {
            this.jewishMonth = _JewishDate.NISSAN;
            this.jewishDay = 1;
          } else {
            this.jewishMonth++;
            this.jewishDay = 1;
          }
        } else {
          this.jewishDay++;
        }
        if (this.dayOfWeek === 7) {
          this.dayOfWeek = 1;
        } else {
          this.dayOfWeek++;
        }
        this.gregorianAbsDate++;
      }
    } else if (field === Calendar.MONTH) {
      this.forwardJewishMonth(amount);
    } else if (field === Calendar.YEAR) {
      this.setJewishYear(this.getJewishYear() + amount);
    }
  }
  /**
   * Forward the Jewish date by the number of months passed in.
   * FIXME: Deal with forwarding a date such as 30 Nisan by a month. 30 Iyar does not exist. This should be dealt with similar to
   * the way that the Java Calendar behaves (not that simple since there is a difference between add() or roll().
   *
   * @throws IllegalArgumentException if the amount is less than 1
   * @param amount the number of months to roll the month forward
   */
  forwardJewishMonth(amount) {
    if (amount < 1) {
      throw new IllegalArgumentException("the amount of months to forward has to be greater than zero.");
    }
    for (let i = 0; i < amount; i++) {
      if (this.getJewishMonth() === _JewishDate.ELUL) {
        this.setJewishMonth(_JewishDate.TISHREI);
        this.setJewishYear(this.getJewishYear() + 1);
      } else if (!this.isJewishLeapYear() && this.getJewishMonth() === _JewishDate.ADAR || this.isJewishLeapYear() && this.getJewishMonth() === _JewishDate.ADAR_II) {
        this.setJewishMonth(_JewishDate.NISSAN);
      } else {
        this.setJewishMonth(this.getJewishMonth() + 1);
      }
    }
  }
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
  back() {
    if (this.gregorianDayOfMonth === 1) {
      if (this.gregorianMonth === 1) {
        this.gregorianMonth = 12;
        this.gregorianYear--;
      } else {
        this.gregorianMonth--;
      }
      this.gregorianDayOfMonth = _JewishDate.getLastDayOfGregorianMonth(this.gregorianMonth, this.gregorianYear);
    } else {
      this.gregorianDayOfMonth--;
    }
    if (this.jewishDay === 1) {
      if (this.jewishMonth === _JewishDate.NISSAN) {
        this.jewishMonth = _JewishDate.getLastMonthOfJewishYear(this.jewishYear);
      } else if (this.jewishMonth === _JewishDate.TISHREI) {
        this.jewishYear--;
        this.jewishMonth--;
      } else {
        this.jewishMonth--;
      }
      this.jewishDay = this.getDaysInJewishMonth();
    } else {
      this.jewishDay--;
    }
    if (this.dayOfWeek === 1) {
      this.dayOfWeek = 7;
    } else {
      this.dayOfWeek--;
    }
    this.gregorianAbsDate--;
  }
  /**
   * Indicates whether some other object is "equal to" this one.
   * @see Object#equals(Object)
   */
  equals(object) {
    if (this === object) {
      return true;
    }
    if (!(object instanceof _JewishDate)) {
      return false;
    }
    const jewishDate = object;
    return this.gregorianAbsDate === jewishDate.getAbsDate();
  }
  /**
   * Compares two dates as per the compareTo() method in the Comparable interface. Returns a value less than 0 if this
   * date is "less than" (before) the date, greater than 0 if this date is "greater than" (after) the date, or 0 if
   * they are equal.
   */
  compareTo(jewishDate) {
    return IntegerUtils.compare(this.gregorianAbsDate, jewishDate.getAbsDate());
  }
  /**
   * Returns the Gregorian month (between 0-11).
   *
   * @return the Gregorian month (between 0-11). Like the java.util.Calendar, months are 0 based.
   */
  getGregorianMonth() {
    return this.gregorianMonth - 1;
  }
  /**
   * Returns the Gregorian day of the month.
   *
   * @return the Gregorian day of the mont
   */
  getGregorianDayOfMonth() {
    return this.gregorianDayOfMonth;
  }
  /**
   * Returns the Gregotian year.
   *
   * @return the Gregorian year
   */
  getGregorianYear() {
    return this.gregorianYear;
  }
  /**
   * Returns the Jewish month 1-12 (or 13 years in a leap year). The month count starts with 1 for Nisan and goes to
   * 13 for Adar II
   *
   * @return the Jewish month from 1 to 12 (or 13 years in a leap year). The month count starts with 1 for Nisan and
   *         goes to 13 for Adar II
   */
  getJewishMonth() {
    return this.jewishMonth;
  }
  /**
   * Returns the Jewish day of month.
   *
   * @return the Jewish day of the month
   */
  getJewishDayOfMonth() {
    return this.jewishDay;
  }
  /**
   * Returns the Jewish year.
   *
   * @return the Jewish year
   */
  getJewishYear() {
    return this.jewishYear;
  }
  /**
   * Returns the day of the week as a number between 1-7.
   *
   * @return the day of the week as a number between 1-7.
   */
  getDayOfWeek() {
    return this.dayOfWeek;
  }
  /**
   * Sets the Gregorian month.
   *
   * @param month
   *            the Gregorian month
   *
   * @throws IllegalArgumentException
   *             if a month &lt; 0 or &gt; 11 is passed in
   */
  setGregorianMonth(month) {
    _JewishDate.validateGregorianMonth(month);
    this.setInternalGregorianDate(this.gregorianYear, month + 1, this.gregorianDayOfMonth);
  }
  /**
   * sets the Gregorian year.
   *
   * @param year
   *            the Gregorian year.
   * @throws IllegalArgumentException
   *             if a year of &lt; 1 is passed in
   */
  setGregorianYear(year) {
    _JewishDate.validateGregorianYear(year);
    this.setInternalGregorianDate(year, this.gregorianMonth, this.gregorianDayOfMonth);
  }
  /**
   * sets the Gregorian Day of month.
   *
   * @param dayOfMonth
   *            the Gregorian Day of month.
   * @throws IllegalArgumentException
   *             if the day of month of &lt; 1 is passed in
   */
  setGregorianDayOfMonth(dayOfMonth) {
    _JewishDate.validateGregorianDayOfMonth(dayOfMonth);
    this.setInternalGregorianDate(this.gregorianYear, this.gregorianMonth, dayOfMonth);
  }
  /**
   * sets the Jewish month.
   *
   * @param month
   *            the Jewish month from 1 to 12 (or 13 years in a leap year). The month count starts with 1 for Nisan
   *            and goes to 13 for Adar II
   * @throws IllegalArgumentException
   *             if a month &lt; 1 or &gt; 12 (or 13 on a leap year) is passed in
   */
  setJewishMonth(month) {
    this.setJewishDate(this.jewishYear, month, this.jewishDay);
  }
  /**
   * sets the Jewish year.
   *
   * @param year
   *            the Jewish year
   * @throws IllegalArgumentException
   *             if a year of &lt; 3761 is passed in. The same will happen if the year is 3761 and the month and day
   *             previously set are &lt; 18 Teves (preior to Jan 1, 1 AD)
   */
  setJewishYear(year) {
    this.setJewishDate(year, this.jewishMonth, this.jewishDay);
  }
  /**
   * sets the Jewish day of month.
   *
   * @param dayOfMonth
   *            the Jewish day of month
   * @throws IllegalArgumentException
   *             if the day of month is &lt; 1 or &gt; 30 is passed in
   */
  setJewishDayOfMonth(dayOfMonth) {
    this.setJewishDate(this.jewishYear, this.jewishMonth, dayOfMonth);
  }
  /**
   * A method that creates a <a href="http://en.wikipedia.org/wiki/Object_copy#Deep_copy">deep copy</a> of the object.
   *
   * @see Object#clone()
   */
  clone() {
    const clone = new _JewishDate(this.jewishYear, this.jewishMonth, this.jewishDay);
    clone.setMoladHours(this.moladHours);
    clone.setMoladMinutes(this.moladMinutes);
    clone.setMoladChalakim(this.moladChalakim);
    return clone;
  }
};
/**
 * Value of the month field indicating Nissan, the first numeric month of the year in the Jewish calendar. With the
 * year starting at {@link #TISHREI}, it would actually be the 7th (or 8th in a {@link #isJewishLeapYear() leap
   * year}) month of the year.
 */
__publicField$c(_JewishDate, "NISSAN", 1);
/**
 * Value of the month field indicating Iyar, the second numeric month of the year in the Jewish calendar. With the
 * year starting at {@link #TISHREI}, it would actually be the 8th (or 9th in a {@link #isJewishLeapYear() leap
   * year}) month of the year.
 */
__publicField$c(_JewishDate, "IYAR", 2);
/**
 * Value of the month field indicating Sivan, the third numeric month of the year in the Jewish calendar. With the
 * year starting at {@link #TISHREI}, it would actually be the 9th (or 10th in a {@link #isJewishLeapYear() leap
   * year}) month of the year.
 */
__publicField$c(_JewishDate, "SIVAN", 3);
/**
 * Value of the month field indicating Tammuz, the fourth numeric month of the year in the Jewish calendar. With the
 * year starting at {@link #TISHREI}, it would actually be the 10th (or 11th in a {@link #isJewishLeapYear() leap
   * year}) month of the year.
 */
__publicField$c(_JewishDate, "TAMMUZ", 4);
/**
 * Value of the month field indicating Av, the fifth numeric month of the year in the Jewish calendar. With the year
 * starting at {@link #TISHREI}, it would actually be the 11th (or 12th in a {@link #isJewishLeapYear() leap year})
 * month of the year.
 */
__publicField$c(_JewishDate, "AV", 5);
/**
 * Value of the month field indicating Elul, the sixth numeric month of the year in the Jewish calendar. With the
 * year starting at {@link #TISHREI}, it would actually be the 12th (or 13th in a {@link #isJewishLeapYear() leap
   * year}) month of the year.
 */
__publicField$c(_JewishDate, "ELUL", 6);
/**
 * Value of the month field indicating Tishrei, the seventh numeric month of the year in the Jewish calendar. With
 * the year starting at this month, it would actually be the 1st month of the year.
 */
__publicField$c(_JewishDate, "TISHREI", 7);
/**
 * Value of the month field indicating Cheshvan/marcheshvan, the eighth numeric month of the year in the Jewish
 * calendar. With the year starting at {@link #TISHREI}, it would actually be the 2nd month of the year.
 */
__publicField$c(_JewishDate, "CHESHVAN", 8);
/**
 * Value of the month field indicating Kislev, the ninth numeric month of the year in the Jewish calendar. With the
 * year starting at {@link #TISHREI}, it would actually be the 3rd month of the year.
 */
__publicField$c(_JewishDate, "KISLEV", 9);
/**
 * Value of the month field indicating Teves, the tenth numeric month of the year in the Jewish calendar. With the
 * year starting at {@link #TISHREI}, it would actually be the 4th month of the year.
 */
__publicField$c(_JewishDate, "TEVES", 10);
/**
 * Value of the month field indicating Shevat, the eleventh numeric month of the year in the Jewish calendar. With
 * the year starting at {@link #TISHREI}, it would actually be the 5th month of the year.
 */
__publicField$c(_JewishDate, "SHEVAT", 11);
/**
 * Value of the month field indicating Adar (or Adar I in a {@link #isJewishLeapYear() leap year}), the twelfth
 * numeric month of the year in the Jewish calendar. With the year starting at {@link #TISHREI}, it would actually
 * be the 6th month of the year.
 */
__publicField$c(_JewishDate, "ADAR", 12);
/**
 * Value of the month field indicating Adar II, the leap (intercalary or embolismic) thirteenth (Undecimber) numeric
 * month of the year added in Jewish {@link #isJewishLeapYear() leap year}). The leap years are years 3, 6, 8, 11,
 * 14, 17 and 19 of a 19 year cycle. With the year starting at {@link #TISHREI}, it would actually be the 7th month
 * of the year.
 */
__publicField$c(_JewishDate, "ADAR_II", 13);
/**
 * the Jewish epoch using the RD (Rata Die/Fixed Date or Reingold Dershowitz) day used in Calendrical Calculations.
 * Day 1 is January 1, 0001 Gregorian
 */
__publicField$c(_JewishDate, "JEWISH_EPOCH", -1373429);
/** The number  of <em>chalakim</em> (18) in a minute. */
__publicField$c(_JewishDate, "CHALAKIM_PER_MINUTE", 18);
/** The number  of <em>chalakim</em> (1080) in an hour. */
__publicField$c(_JewishDate, "CHALAKIM_PER_HOUR", 1080);
/** The number of <em>chalakim</em> (25,920) in a 24 hour day. */
__publicField$c(_JewishDate, "CHALAKIM_PER_DAY", 25920);
// 24 * 1080
/** The number  of <em>chalakim</em> in an average Jewish month. A month has 29 days, 12 hours and 793
 * <em>chalakim</em> (44 minutes and 3.3 seconds) for a total of 765,433 <em>chalakim</em> */
__publicField$c(_JewishDate, "CHALAKIM_PER_MONTH", 765433);
// (29 * 24 + 12) * 1080 + 793
/**
 * Days from the beginning of Sunday till molad BaHaRaD. Calculated as 1 day, 5 hours and 204 chalakim = (24 + 5) *
 * 1080 + 204 = 31524
 */
__publicField$c(_JewishDate, "CHALAKIM_MOLAD_TOHU", 31524);
/**
 * A short year where both {@link #CHESHVAN} and {@link #KISLEV} are 29 days.
 *
 * @see #getCheshvanKislevKviah()
 * @see HebrewDateFormatter#getFormattedKviah(int)
 */
__publicField$c(_JewishDate, "CHASERIM", 0);
/**
 * An ordered year where {@link #CHESHVAN} is 29 days and {@link #KISLEV} is 30 days.
 *
 * @see #getCheshvanKislevKviah()
 * @see HebrewDateFormatter#getFormattedKviah(int)
 */
__publicField$c(_JewishDate, "KESIDRAN", 1);
/**
 * A long year where both {@link #CHESHVAN} and {@link #KISLEV} are 30 days.
 *
 * @see #getCheshvanKislevKviah()
 * @see HebrewDateFormatter#getFormattedKviah(int)
 */
__publicField$c(_JewishDate, "SHELAIMIM", 2);
let JewishDate = _JewishDate;

var __defProp$b = Object.defineProperty;
var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$b = (obj, key, value) => {
  __defNormalProp$b(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const { MONDAY, TUESDAY, THURSDAY, FRIDAY, SATURDAY } = Calendar;
var Parsha = /* @__PURE__ */ ((Parsha2) => {
  Parsha2[Parsha2["NONE"] = 0] = "NONE";
  Parsha2[Parsha2["BERESHIS"] = 1] = "BERESHIS";
  Parsha2[Parsha2["NOACH"] = 2] = "NOACH";
  Parsha2[Parsha2["LECH_LECHA"] = 3] = "LECH_LECHA";
  Parsha2[Parsha2["VAYERA"] = 4] = "VAYERA";
  Parsha2[Parsha2["CHAYEI_SARA"] = 5] = "CHAYEI_SARA";
  Parsha2[Parsha2["TOLDOS"] = 6] = "TOLDOS";
  Parsha2[Parsha2["VAYETZEI"] = 7] = "VAYETZEI";
  Parsha2[Parsha2["VAYISHLACH"] = 8] = "VAYISHLACH";
  Parsha2[Parsha2["VAYESHEV"] = 9] = "VAYESHEV";
  Parsha2[Parsha2["MIKETZ"] = 10] = "MIKETZ";
  Parsha2[Parsha2["VAYIGASH"] = 11] = "VAYIGASH";
  Parsha2[Parsha2["VAYECHI"] = 12] = "VAYECHI";
  Parsha2[Parsha2["SHEMOS"] = 13] = "SHEMOS";
  Parsha2[Parsha2["VAERA"] = 14] = "VAERA";
  Parsha2[Parsha2["BO"] = 15] = "BO";
  Parsha2[Parsha2["BESHALACH"] = 16] = "BESHALACH";
  Parsha2[Parsha2["YISRO"] = 17] = "YISRO";
  Parsha2[Parsha2["MISHPATIM"] = 18] = "MISHPATIM";
  Parsha2[Parsha2["TERUMAH"] = 19] = "TERUMAH";
  Parsha2[Parsha2["TETZAVEH"] = 20] = "TETZAVEH";
  Parsha2[Parsha2["KI_SISA"] = 21] = "KI_SISA";
  Parsha2[Parsha2["VAYAKHEL"] = 22] = "VAYAKHEL";
  Parsha2[Parsha2["PEKUDEI"] = 23] = "PEKUDEI";
  Parsha2[Parsha2["VAYIKRA"] = 24] = "VAYIKRA";
  Parsha2[Parsha2["TZAV"] = 25] = "TZAV";
  Parsha2[Parsha2["SHMINI"] = 26] = "SHMINI";
  Parsha2[Parsha2["TAZRIA"] = 27] = "TAZRIA";
  Parsha2[Parsha2["METZORA"] = 28] = "METZORA";
  Parsha2[Parsha2["ACHREI_MOS"] = 29] = "ACHREI_MOS";
  Parsha2[Parsha2["KEDOSHIM"] = 30] = "KEDOSHIM";
  Parsha2[Parsha2["EMOR"] = 31] = "EMOR";
  Parsha2[Parsha2["BEHAR"] = 32] = "BEHAR";
  Parsha2[Parsha2["BECHUKOSAI"] = 33] = "BECHUKOSAI";
  Parsha2[Parsha2["BAMIDBAR"] = 34] = "BAMIDBAR";
  Parsha2[Parsha2["NASSO"] = 35] = "NASSO";
  Parsha2[Parsha2["BEHAALOSCHA"] = 36] = "BEHAALOSCHA";
  Parsha2[Parsha2["SHLACH"] = 37] = "SHLACH";
  Parsha2[Parsha2["KORACH"] = 38] = "KORACH";
  Parsha2[Parsha2["CHUKAS"] = 39] = "CHUKAS";
  Parsha2[Parsha2["BALAK"] = 40] = "BALAK";
  Parsha2[Parsha2["PINCHAS"] = 41] = "PINCHAS";
  Parsha2[Parsha2["MATOS"] = 42] = "MATOS";
  Parsha2[Parsha2["MASEI"] = 43] = "MASEI";
  Parsha2[Parsha2["DEVARIM"] = 44] = "DEVARIM";
  Parsha2[Parsha2["VAESCHANAN"] = 45] = "VAESCHANAN";
  Parsha2[Parsha2["EIKEV"] = 46] = "EIKEV";
  Parsha2[Parsha2["REEH"] = 47] = "REEH";
  Parsha2[Parsha2["SHOFTIM"] = 48] = "SHOFTIM";
  Parsha2[Parsha2["KI_SEITZEI"] = 49] = "KI_SEITZEI";
  Parsha2[Parsha2["KI_SAVO"] = 50] = "KI_SAVO";
  Parsha2[Parsha2["NITZAVIM"] = 51] = "NITZAVIM";
  Parsha2[Parsha2["VAYEILECH"] = 52] = "VAYEILECH";
  Parsha2[Parsha2["HAAZINU"] = 53] = "HAAZINU";
  Parsha2[Parsha2["VZOS_HABERACHA"] = 54] = "VZOS_HABERACHA";
  Parsha2[Parsha2["VAYAKHEL_PEKUDEI"] = 55] = "VAYAKHEL_PEKUDEI";
  Parsha2[Parsha2["TAZRIA_METZORA"] = 56] = "TAZRIA_METZORA";
  Parsha2[Parsha2["ACHREI_MOS_KEDOSHIM"] = 57] = "ACHREI_MOS_KEDOSHIM";
  Parsha2[Parsha2["BEHAR_BECHUKOSAI"] = 58] = "BEHAR_BECHUKOSAI";
  Parsha2[Parsha2["CHUKAS_BALAK"] = 59] = "CHUKAS_BALAK";
  Parsha2[Parsha2["MATOS_MASEI"] = 60] = "MATOS_MASEI";
  Parsha2[Parsha2["NITZAVIM_VAYEILECH"] = 61] = "NITZAVIM_VAYEILECH";
  Parsha2[Parsha2["SHKALIM"] = 62] = "SHKALIM";
  Parsha2[Parsha2["ZACHOR"] = 63] = "ZACHOR";
  Parsha2[Parsha2["PARA"] = 64] = "PARA";
  Parsha2[Parsha2["HACHODESH"] = 65] = "HACHODESH";
  return Parsha2;
})(Parsha || {});
const _JewishCalendar = class _JewishCalendar extends JewishDate {
  constructor(jewishYearOrDateTimeOrDate, jewishMonth, jewishDayOfMonth, inIsrael) {
    super(jewishYearOrDateTimeOrDate, jewishMonth, jewishDayOfMonth);
    /**
     * Is the calendar set to Israel, where some holidays have different rules.
     * @see #getInIsrael()
     * @see #setInIsrael(boolean)
     */
    __publicField$b(this, "inIsrael", false);
    /**
     * Is the calendar set to use modern Israeli holidays such as Yom Haatzmaut.
     * @see #isUseModernHolidays()
     * @see #setUseModernHolidays(boolean)
     */
    __publicField$b(this, "useModernHolidays", false);
    if (inIsrael)
      this.setInIsrael(inIsrael);
  }
  /**
   * Is this calendar set to return modern Israeli national holidays. By default this value is false. The holidays
   * are: "Yom HaShoah", "Yom Hazikaron", "Yom Ha'atzmaut" and "Yom Yerushalayim"
   *
   * @return the useModernHolidays true if set to return modern Israeli national holidays
   */
  isUseModernHolidays() {
    return this.useModernHolidays;
  }
  /**
   * Seth the calendar to return modern Israeli national holidays. By default this value is false. The holidays are:
   * "Yom HaShoah", "Yom Hazikaron", "Yom Ha'atzmaut" and "Yom Yerushalayim"
   *
   * @param useModernHolidays
   *            the useModernHolidays to set
   */
  setUseModernHolidays(useModernHolidays) {
    this.useModernHolidays = useModernHolidays;
  }
  /**
   * Sets whether to use Israel holiday scheme or not. Default is false.
   *
   * @param inIsrael
   *            set to true for calculations for Israel
   */
  setInIsrael(inIsrael) {
    this.inIsrael = inIsrael;
  }
  /**
   * Gets whether Israel holiday scheme is used or not. The default (if not set) is false.
   *
   * @return if the if the calendar is set to Israel
   */
  getInIsrael() {
    return this.inIsrael;
  }
  /**
   * <a href="https://en.wikipedia.org/wiki/Birkat_Hachama">Birkas Hachamah</a> is recited every 28 years based on
   * Tekufas Shmulel (Julian years) that a year is 365.25 days. The <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a>
   * in <a href="http://hebrewbooks.org/pdfpager.aspx?req=14278&amp;st=&amp;pgnum=323">Hilchos Kiddush Hachodesh 9:3</a> states that
   * tekufas Nisan of year 1 was 7 days + 9 hours before molad Nisan. This is calculated as every 10,227 days (28 * 365.25).
   * @return true for a day that Birkas Hachamah is recited.
   */
  isBirkasHachamah() {
    let elapsedDays = _JewishCalendar.getJewishCalendarElapsedDays(this.getJewishYear());
    elapsedDays += this.getDaysSinceStartOfJewishYear();
    return elapsedDays % (28 * 365.25) === 172;
  }
  /**
   * Return the type of year for parsha calculations. The algorithm follows the
   * <a href="http://hebrewbooks.org/pdfpager.aspx?req=14268&amp;st=&amp;pgnum=222">Luach Arba'ah Shearim</a> in the Tur Ohr Hachaim.
   * @return the type of year for parsha calculations.
   * @todo Use constants in this class.
   */
  getParshaYearType() {
    let roshHashanaDayOfWeek = (_JewishCalendar.getJewishCalendarElapsedDays(this.getJewishYear()) + 1) % 7;
    if (roshHashanaDayOfWeek === 0) {
      roshHashanaDayOfWeek = SATURDAY;
    }
    if (this.isJewishLeapYear()) {
      switch (roshHashanaDayOfWeek) {
        case MONDAY:
          if (this.isKislevShort()) {
            if (this.getInIsrael()) {
              return 14;
            }
            return 6;
          }
          if (this.isCheshvanLong()) {
            if (this.getInIsrael()) {
              return 15;
            }
            return 7;
          }
          break;
        case TUESDAY:
          if (this.getInIsrael()) {
            return 15;
          }
          return 7;
        case THURSDAY:
          if (this.isKislevShort()) {
            return 8;
          }
          if (this.isCheshvanLong()) {
            return 9;
          }
          break;
        case SATURDAY:
          if (this.isKislevShort()) {
            return 10;
          }
          if (this.isCheshvanLong()) {
            if (this.getInIsrael()) {
              return 16;
            }
            return 11;
          }
          break;
      }
    } else {
      switch (roshHashanaDayOfWeek) {
        case MONDAY:
          if (this.isKislevShort()) {
            return 0;
          }
          if (this.isCheshvanLong()) {
            if (this.getInIsrael()) {
              return 12;
            }
            return 1;
          }
          break;
        case TUESDAY:
          if (this.getInIsrael()) {
            return 12;
          }
          return 1;
        case THURSDAY:
          if (this.isCheshvanLong()) {
            return 3;
          }
          if (!this.isKislevShort()) {
            if (this.getInIsrael()) {
              return 13;
            }
            return 2;
          }
          break;
        case SATURDAY:
          if (this.isKislevShort()) {
            return 4;
          }
          if (this.isCheshvanLong()) {
            return 5;
          }
          break;
      }
    }
    return -1;
  }
  /**
   * Returns this week's {@link Parsha} if it is Shabbos.
   * returns Parsha.NONE if a weekday or if there is no parsha that week (for example Yomtov is on Shabbos)
   * @return the current parsha
   */
  getParsha() {
    if (this.getDayOfWeek() !== SATURDAY) {
      return 0 /* NONE */;
    }
    const yearType = this.getParshaYearType();
    const roshHashanaDayOfWeek = _JewishCalendar.getJewishCalendarElapsedDays(this.getJewishYear()) % 7;
    const day = roshHashanaDayOfWeek + this.getDaysSinceStartOfJewishYear();
    if (yearType >= 0) {
      return _JewishCalendar.parshalist[yearType][day / 7];
    }
    return 0 /* NONE */;
  }
  /**
   * Returns a parsha enum if the Shabbos is one of the four parshiyos of Parsha.SHKALIM, Parsha.ZACHOR, Parsha.PARA,
   * Parsha.HACHODESH or Parsha.NONE for a regular Shabbos (or any weekday).
   * @return one of the four parshiyos of Parsha.SHKALIM, Parsha.ZACHOR, Parsha.PARA, Parsha.HACHODESH or Parsha.NONE.
   */
  getSpecialShabbos() {
    if (this.getDayOfWeek() === SATURDAY) {
      if ((this.getJewishMonth() === _JewishCalendar.SHEVAT && !this.isJewishLeapYear() || this.getJewishMonth() === _JewishCalendar.ADAR && this.isJewishLeapYear()) && [25, 27, 29].includes(this.getJewishDayOfMonth())) {
        return 62 /* SHKALIM */;
      }
      if (this.getJewishMonth() === _JewishCalendar.ADAR && !this.isJewishLeapYear() || this.getJewishMonth() === _JewishCalendar.ADAR_II) {
        if (this.getJewishDayOfMonth() === 1) {
          return 62 /* SHKALIM */;
        }
        if ([8, 9, 11, 13].includes(this.getJewishDayOfMonth())) {
          return 63 /* ZACHOR */;
        }
        if ([18, 20, 22, 23].includes(this.getJewishDayOfMonth())) {
          return 64 /* PARA */;
        }
        if ([25, 27, 29].includes(this.getJewishDayOfMonth())) {
          return 65 /* HACHODESH */;
        }
      }
      if (this.getJewishMonth() === _JewishCalendar.NISSAN && this.getJewishDayOfMonth() === 1) {
        return 65 /* HACHODESH */;
      }
    }
    return 0 /* NONE */;
  }
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
  getYomTovIndex() {
    const day = this.getJewishDayOfMonth();
    const dayOfWeek = this.getDayOfWeek();
    switch (this.getJewishMonth()) {
      case _JewishCalendar.NISSAN:
        if (day === 14) {
          return _JewishCalendar.EREV_PESACH;
        } else if (day === 15 || day === 21 || !this.inIsrael && (day === 16 || day === 22)) {
          return _JewishCalendar.PESACH;
        } else if (day >= 17 && day <= 20 || day === 16 && this.inIsrael) {
          return _JewishCalendar.CHOL_HAMOED_PESACH;
        }
        if (this.isUseModernHolidays() && (day === 26 && dayOfWeek === 5 || day === 28 && dayOfWeek === 2 || day === 27 && dayOfWeek !== 1 && dayOfWeek !== 6)) {
          return _JewishCalendar.YOM_HASHOAH;
        }
        break;
      case _JewishCalendar.IYAR:
        if (this.isUseModernHolidays() && (day === 4 && dayOfWeek === 3 || (day === 3 || day === 2) && dayOfWeek === 4 || day === 5 && dayOfWeek === 2)) {
          return _JewishCalendar.YOM_HAZIKARON;
        }
        if (this.isUseModernHolidays() && (day === 5 && dayOfWeek === 4 || (day === 4 || day === 3) && dayOfWeek === 5 || day === 6 && dayOfWeek === 3)) {
          return _JewishCalendar.YOM_HAATZMAUT;
        }
        if (day === 14) {
          return _JewishCalendar.PESACH_SHENI;
        }
        if (day === 18) {
          return _JewishCalendar.LAG_BAOMER;
        }
        if (this.isUseModernHolidays() && day === 28) {
          return _JewishCalendar.YOM_YERUSHALAYIM;
        }
        break;
      case _JewishCalendar.SIVAN:
        if (day === 5) {
          return _JewishCalendar.EREV_SHAVUOS;
        } else if (day === 6 || day === 7 && !this.inIsrael) {
          return _JewishCalendar.SHAVUOS;
        }
        break;
      case _JewishCalendar.TAMMUZ:
        if (day === 17 && dayOfWeek !== 7 || day === 18 && dayOfWeek === 1) {
          return _JewishCalendar.SEVENTEEN_OF_TAMMUZ;
        }
        break;
      case _JewishCalendar.AV:
        if (dayOfWeek === 1 && day === 10 || dayOfWeek !== 7 && day === 9) {
          return _JewishCalendar.TISHA_BEAV;
        } else if (day === 15) {
          return _JewishCalendar.TU_BEAV;
        }
        break;
      case _JewishCalendar.ELUL:
        if (day === 29) {
          return _JewishCalendar.EREV_ROSH_HASHANA;
        }
        break;
      case _JewishCalendar.TISHREI:
        if (day === 1 || day === 2) {
          return _JewishCalendar.ROSH_HASHANA;
        } else if (day === 3 && dayOfWeek !== 7 || day === 4 && dayOfWeek === 1) {
          return _JewishCalendar.FAST_OF_GEDALYAH;
        } else if (day === 9) {
          return _JewishCalendar.EREV_YOM_KIPPUR;
        } else if (day === 10) {
          return _JewishCalendar.YOM_KIPPUR;
        } else if (day === 14) {
          return _JewishCalendar.EREV_SUCCOS;
        }
        if (day === 15 || day === 16 && !this.inIsrael) {
          return _JewishCalendar.SUCCOS;
        }
        if (day >= 17 && day <= 20 || day === 16 && this.inIsrael) {
          return _JewishCalendar.CHOL_HAMOED_SUCCOS;
        }
        if (day === 21) {
          return _JewishCalendar.HOSHANA_RABBA;
        }
        if (day === 22) {
          return _JewishCalendar.SHEMINI_ATZERES;
        }
        if (day === 23 && !this.inIsrael) {
          return _JewishCalendar.SIMCHAS_TORAH;
        }
        break;
      case _JewishCalendar.KISLEV:
        if (day >= 25) {
          return _JewishCalendar.CHANUKAH;
        }
        break;
      case _JewishCalendar.TEVES:
        if (day === 1 || day === 2 || day === 3 && this.isKislevShort()) {
          return _JewishCalendar.CHANUKAH;
        } else if (day === 10) {
          return _JewishCalendar.TENTH_OF_TEVES;
        }
        break;
      case _JewishCalendar.SHEVAT:
        if (day === 15) {
          return _JewishCalendar.TU_BESHVAT;
        }
        break;
      case _JewishCalendar.ADAR:
        if (!this.isJewishLeapYear()) {
          if ((day === 11 || day === 12) && dayOfWeek === 5 || day === 13 && !(dayOfWeek === 6 || dayOfWeek === 7)) {
            return _JewishCalendar.FAST_OF_ESTHER;
          }
          if (day === 14) {
            return _JewishCalendar.PURIM;
          } else if (day === 15) {
            return _JewishCalendar.SHUSHAN_PURIM;
          }
        } else {
          if (day === 14) {
            return _JewishCalendar.PURIM_KATAN;
          }
          if (day === 15) {
            return _JewishCalendar.SHUSHAN_PURIM_KATAN;
          }
        }
        break;
      case _JewishCalendar.ADAR_II:
        if ((day === 11 || day === 12) && dayOfWeek === 5 || day === 13 && !(dayOfWeek === 6 || dayOfWeek === 7)) {
          return _JewishCalendar.FAST_OF_ESTHER;
        }
        if (day === 14) {
          return _JewishCalendar.PURIM;
        } else if (day === 15) {
          return _JewishCalendar.SHUSHAN_PURIM;
        }
        break;
    }
    return -1;
  }
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
  isYomTov() {
    const holidayIndex = this.getYomTovIndex();
    if (this.isErevYomTov() && (holidayIndex !== _JewishCalendar.HOSHANA_RABBA && (holidayIndex === _JewishCalendar.CHOL_HAMOED_PESACH && this.getJewishDayOfMonth() !== 20)) || this.isTaanis() && holidayIndex !== _JewishCalendar.YOM_KIPPUR) {
      return false;
    }
    return this.getYomTovIndex() !== -1;
  }
  /**
   * Returns true if the <em>Yom Tov</em> day has a <em>melacha</em> (work) prohibition. This method will return false for a
   * non-<em>Yom Tov</em> day, even if it is <em>Shabbos</em>.
   *
   * @return if the <em>Yom Tov</em> day has a <em>melacha</em> (work) prohibition.
   */
  isYomTovAssurBemelacha() {
    const yamimTovimAssurBemelacha = [
      _JewishCalendar.PESACH,
      _JewishCalendar.SHAVUOS,
      _JewishCalendar.SUCCOS,
      _JewishCalendar.SHEMINI_ATZERES,
      _JewishCalendar.SIMCHAS_TORAH,
      _JewishCalendar.ROSH_HASHANA,
      _JewishCalendar.YOM_KIPPUR
    ];
    const holidayIndex = this.getYomTovIndex();
    return yamimTovimAssurBemelacha.includes(holidayIndex);
  }
  /**
   * Returns true if it is <em>Shabbos</em> or if it is a <em>Yom Tov</em> day that has a <em>melacha</em> (work)  prohibition.
   * This method will return false for a.
   * @return if the day is a <em>Yom Tov</em> that is <em>assur bemlacha</em> or <em>Shabbos</em>
   */
  isAssurBemelacha() {
    return this.getDayOfWeek() === SATURDAY || this.isYomTovAssurBemelacha();
  }
  /**
   * Returns true if the day has candle lighting. This will return true on erev <em>Shabbos</em>, erev <em>Yom Tov</em>, the
   * first day of <em>Rosh Hashana</em> and the first days of <em>Yom Tov</em> out of Israel. It is identical
   * to calling {@link #isTomorrowShabbosOrYomTov()}.
   *
   * @return if the day has candle lighting
   */
  hasCandleLighting() {
    return this.isTomorrowShabbosOrYomTov();
  }
  /**
   * Returns true if tomorrow is <em>Shabbos</em> or <em>Yom Tov</em>. This will return true on erev <em>Shabbos</em>, erev
   * <em>Yom Tov</em>, the first day of <em>Rosh Hashana</em> and <em>erev</em> the first days of <em>Yom Tov</em> out of
   * Israel. It is identical to calling {@link #hasCandleLighting()}.
   * @return will return if the next day is <em>Shabbos</em> or <em>Yom Tov</em>
   */
  isTomorrowShabbosOrYomTov() {
    return this.getDayOfWeek() === FRIDAY || this.isErevYomTov() || this.isErevYomTovSheni();
  }
  /**
   * Returns true if the day is the second day of <em>Yom Tov</em>. This impacts the second day of <em>Rosh Hashana</em>
   * everywhere, and the second days of Yom Tov in <em>chutz laaretz</em> (out of Israel).
   *
   * @return  if the day is the second day of <em>Yom Tov</em>.
   */
  isErevYomTovSheni() {
    return this.getJewishMonth() === _JewishCalendar.TISHREI && this.getJewishDayOfMonth() === 1 || !this.getInIsrael() && (this.getJewishMonth() === _JewishCalendar.NISSAN && [15, 21].includes(this.getJewishDayOfMonth()) || this.getJewishMonth() === _JewishCalendar.TISHREI && [15, 22].includes(this.getJewishDayOfMonth()) || this.getJewishMonth() === _JewishCalendar.SIVAN && this.getJewishDayOfMonth() === 6);
  }
  /**
   * Returns true if the current day is <em>Aseret Yemei Teshuva</em>.
   *
   * @return if the current day is <em>Aseret Yemei Teshuvah</em>
   */
  isAseresYemeiTeshuva() {
    return this.getJewishMonth() === _JewishCalendar.TISHREI && this.getJewishDayOfMonth() <= 10;
  }
  /**
   * Returns true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em> or <em>Succos</em>.
   *
   * @return true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em> or <em>Succos</em>
   * @see #isYomTov()
   * @see #CHOL_HAMOED_PESACH
   * @see #CHOL_HAMOED_SUCCOS
   */
  isCholHamoed() {
    return this.isCholHamoedPesach() || this.isCholHamoedSuccos();
  }
  /**
   * Returns true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em>.
   *
   * @return true if the current day is <em>Chol Hamoed</em> of <em>Pesach</em>
   * @see #isYomTov()
   * @see #CHOL_HAMOED_PESACH
   */
  isCholHamoedPesach() {
    const holidayIndex = this.getYomTovIndex();
    return holidayIndex === _JewishCalendar.CHOL_HAMOED_PESACH;
  }
  /**
   * Returns true if the current day is <em>Chol Hamoed</em> of <em>Succos</em>.
   *
   * @return true if the current day is <em>Chol Hamoed</em> of <em>Succos</em>
   * @see #isYomTov()
   * @see #CHOL_HAMOED_SUCCOS
   */
  isCholHamoedSuccos() {
    const holidayIndex = this.getYomTovIndex();
    return holidayIndex === _JewishCalendar.CHOL_HAMOED_SUCCOS;
  }
  /**
   * Returns true if the current day is erev Yom Tov. The method returns true for Erev - Pesach (first and last days),
   * Shavuos, Rosh Hashana, Yom Kippur and Succos and Hoshana Rabba.
   *
   * @return true if the current day is Erev - Pesach, Shavuos, Rosh Hashana, Yom Kippur and Succos
   * @see #isYomTov()
   * @see #isErevYomTovSheni()
   */
  isErevYomTov() {
    const erevYomTov = [
      _JewishCalendar.EREV_PESACH,
      _JewishCalendar.EREV_SHAVUOS,
      _JewishCalendar.EREV_ROSH_HASHANA,
      _JewishCalendar.EREV_YOM_KIPPUR,
      _JewishCalendar.EREV_SUCCOS,
      _JewishCalendar.HOSHANA_RABBA
    ];
    const holidayIndex = this.getYomTovIndex();
    return erevYomTov.includes(holidayIndex) || holidayIndex === _JewishCalendar.CHOL_HAMOED_PESACH && this.getJewishDayOfMonth() === 20;
  }
  /**
   * Returns true if the current day is Erev Rosh Chodesh. Returns false for Erev Rosh Hashana
   *
   * @return true if the current day is Erev Rosh Chodesh. Returns false for Erev Rosh Hashana
   * @see #isRoshChodesh()
   */
  isErevRoshChodesh() {
    return this.getJewishDayOfMonth() === 29 && this.getJewishMonth() !== _JewishCalendar.ELUL;
  }
  /**
   * Return true if the day is a Taanis (fast day). Return true for 17 of Tammuz, Tisha B'Av, Yom Kippur, Fast of
   * Gedalyah, 10 of Teves and the Fast of Esther
   *
   * @return true if today is a fast day
   */
  isTaanis() {
    const taaniyos = [
      _JewishCalendar.SEVENTEEN_OF_TAMMUZ,
      _JewishCalendar.TISHA_BEAV,
      _JewishCalendar.YOM_KIPPUR,
      _JewishCalendar.FAST_OF_GEDALYAH,
      _JewishCalendar.TENTH_OF_TEVES,
      _JewishCalendar.FAST_OF_ESTHER
    ];
    const holidayIndex = this.getYomTovIndex();
    return taaniyos.includes(holidayIndex);
  }
  /**
   * Return true if the day is Taanis Bechoros (on erev Pesach). It will return true for the 14th of Nissan if it is not
   * on Shabbos, or if the 12th of Nissan occurs on a Thursday
   *
   * @return true if today is the fast of Bechoros
   */
  isTaanisBechoros() {
    const day = this.getJewishDayOfMonth();
    const dayOfWeek = this.getDayOfWeek();
    return this.getJewishMonth() === _JewishCalendar.NISSAN && (day === 14 && dayOfWeek !== Calendar.SATURDAY || day === 12 && dayOfWeek === Calendar.THURSDAY);
  }
  /**
   * Returns the day of <em>Chanukah</em> or -1 if it is not <em>Chanukah</em>.
   *
   * @return the day of <em>Chanukah</em> or -1 if it is not <em>Chanukah</em>.
   * @see #isChanukah()
   */
  getDayOfChanukah() {
    const day = this.getJewishDayOfMonth();
    if (this.isChanukah()) {
      if (this.getJewishMonth() === _JewishCalendar.KISLEV) {
        return day - 24;
      }
      return this.isKislevShort() ? day + 5 : day + 6;
    }
    return -1;
  }
  /**
   * Returns true if the current day is one of the 8 days of <em>Chanukah</em>.
   * @return if the current day is one of the 8 days of <em>Chanukah</em>.
   * @see #getDayOfChanukah()
   */
  isChanukah() {
    return this.getYomTovIndex() === _JewishCalendar.CHANUKAH;
  }
  /**
   * Returns if the day is Rosh Chodesh. Rosh Hashana will return false
   *
   * @return true if it is Rosh Chodesh. Rosh Hashana will return false
   */
  isRoshChodesh() {
    return this.getJewishDayOfMonth() === 1 && this.getJewishMonth() !== _JewishCalendar.TISHREI || this.getJewishDayOfMonth() === 30;
  }
  /**
   * Returns if the day is Shabbos and sunday is Rosh Chodesh.
   *
   * @return true if it is Shabbos and sunday is Rosh Chodesh.
   */
  isMacharChodesh() {
    return this.getDayOfWeek() === SATURDAY && (this.getJewishDayOfMonth() === 30 || this.getJewishDayOfMonth() === 29);
  }
  /**
   * Returns if the day is Shabbos Mevorchim.
   *
   * @return true if it is Shabbos Mevorchim.
   */
  isShabbosMevorchim() {
    return this.getDayOfWeek() === SATURDAY && this.getJewishDayOfMonth() >= 23 && this.getJewishDayOfMonth() <= 29 && this.getJewishMonth() !== _JewishCalendar.ELUL;
  }
  /**
   * Returns the int value of the Omer day or -1 if the day is not in the omer
   *
   * @return The Omer count as an int or -1 if it is not a day of the Omer.
   */
  getDayOfOmer() {
    let omer = -1;
    const month = this.getJewishMonth();
    const day = this.getJewishDayOfMonth();
    if (month === _JewishCalendar.NISSAN && day >= 16) {
      omer = day - 15;
    } else if (month === _JewishCalendar.IYAR) {
      omer = day + 15;
    } else if (month === _JewishCalendar.SIVAN && day < 6) {
      omer = day + 44;
    }
    return omer;
  }
  /**
   * Returns the molad in Standard Time in Yerushalayim as a Date. The traditional calculation uses local time. This
   * method subtracts 20.94 minutes (20 minutes and 56.496 seconds) from the local time (Har Habayis with a longitude
   * of 35.2354&deg; is 5.2354&deg; away from the %15 timezone longitude) to get to standard time. This method
   * intentionally uses standard time and not dailight savings time. Java will implicitly format the time to the
   * default (or set) Timezone.
   *
   * @return the Date representing the moment of the molad in Yerushalayim standard time (GMT + 2)
   */
  getMoladAsDate() {
    const molad = this.getMolad();
    const locationName = "Jerusalem, Israel";
    const latitude = 31.778;
    const longitude = 35.2354;
    const yerushalayimStandardTZ = "Etc/GMT+2";
    const geo = new GeoLocation(locationName, latitude, longitude, yerushalayimStandardTZ);
    const moladSeconds = molad.getMoladChalakim() * 10 / 3;
    const milliseconds = Math.trunc(1e3 * (moladSeconds - Math.trunc(moladSeconds)));
    return DateTime.fromObject({
      year: molad.getGregorianYear(),
      month: molad.getGregorianMonth() + 1,
      day: molad.getGregorianDayOfMonth(),
      hour: molad.getMoladHours(),
      minute: molad.getMoladMinutes(),
      second: Math.trunc(moladSeconds),
      millisecond: milliseconds
    }, { zone: geo.getTimeZone() }).minus({ milliseconds: Math.trunc(geo.getLocalMeanTimeOffset()) });
  }
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
  getTchilasZmanKidushLevana3Days() {
    const molad = this.getMoladAsDate();
    return molad.plus({ hours: 72 });
  }
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
  getTchilasZmanKidushLevana7Days() {
    const molad = this.getMoladAsDate();
    return molad.plus({ hours: 168 });
  }
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
  getSofZmanKidushLevanaBetweenMoldos() {
    const molad = this.getMoladAsDate();
    return molad.plus({
      days: 14,
      hours: 18,
      minutes: 22,
      seconds: 1,
      milliseconds: 666
    });
  }
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
  getSofZmanKidushLevana15Days() {
    const molad = this.getMoladAsDate();
    return molad.plus({ days: 15 });
  }
  /**
   * Returns the Daf Yomi (Bavli) for the date that the calendar is set to. See the
   * {@link HebrewDateFormatter#formatDafYomiBavli(Daf)} for the ability to format the daf in Hebrew or transliterated
   * masechta names.
   *
   * @deprecated This depends on a circular dependency. Use <pre>YomiCalculator.getDafYomiBavli(jewishCalendar)</pre> instead.
   * @return the daf as a {@link Daf}
   */
  // eslint-disable-next-line class-methods-use-this
  getDafYomiBavli() {
    throw new UnsupportedError("This method is not supported, due to a circular dependency. Use `YomiCalculator.getDafYomiBavli(jewishCalendar)` instead");
  }
  /**
   * Returns the Daf Yomi (Yerushalmi) for the date that the calendar is set to. See the
   * {@link HebrewDateFormatter#formatDafYomiYerushalmi(Daf)} for the ability to format the daf in Hebrew or transliterated
   * masechta names.
   *
   * @deprecated This depends on a circular dependency. Use <pre>YerushalmiYomiCalculator.getDafYomiYerushalmi(jewishCalendar)</pre> instead.
   * @return the daf as a {@link Daf}
   */
  // eslint-disable-next-line class-methods-use-this
  getDafYomiYerushalmi() {
    throw new UnsupportedError("This method is not supported, due to a circular dependency. Use `YerushalmiYomiCalculator.getDafYomiYerushalmi(jewishCalendar)` instead");
  }
  /**
   * Indicates whether some other object is "equal to" this one.
   * @see Object#equals(Object)
   */
  equals(jewishCalendar) {
    return this.getAbsDate() === jewishCalendar.getAbsDate() && this.getInIsrael() === jewishCalendar.getInIsrael();
  }
};
/** The 14th day of Nisan, the day before of Pesach (Passover). */
__publicField$b(_JewishCalendar, "EREV_PESACH", 0);
/** The holiday of Pesach (Passover) on the 15th (and 16th out of Israel) day of Nisan. */
__publicField$b(_JewishCalendar, "PESACH", 1);
/** Chol Hamoed (interim days) of Pesach (Passover) */
__publicField$b(_JewishCalendar, "CHOL_HAMOED_PESACH", 2);
/** Pesach Sheni, the 14th day of Iyar, a minor holiday. */
__publicField$b(_JewishCalendar, "PESACH_SHENI", 3);
/** Erev Shavuos (the day before Shavuos), the 5th of Sivan */
__publicField$b(_JewishCalendar, "EREV_SHAVUOS", 4);
/** Shavuos (Pentecost), the 6th of Sivan */
__publicField$b(_JewishCalendar, "SHAVUOS", 5);
/** The fast of the 17th day of Tamuz */
__publicField$b(_JewishCalendar, "SEVENTEEN_OF_TAMMUZ", 6);
/** The fast of the 9th of Av */
__publicField$b(_JewishCalendar, "TISHA_BEAV", 7);
/** The 15th day of Av, a minor holiday */
__publicField$b(_JewishCalendar, "TU_BEAV", 8);
/** Erev Rosh Hashana (the day before Rosh Hashana), the 29th of Elul */
__publicField$b(_JewishCalendar, "EREV_ROSH_HASHANA", 9);
/** Rosh Hashana, the first of Tishrei. */
__publicField$b(_JewishCalendar, "ROSH_HASHANA", 10);
/** The fast of Gedalyah, the 3rd of Tishrei. */
__publicField$b(_JewishCalendar, "FAST_OF_GEDALYAH", 11);
/** The 9th day of Tishrei, the day before of Yom Kippur. */
__publicField$b(_JewishCalendar, "EREV_YOM_KIPPUR", 12);
/** The holiday of Yom Kippur, the 10th day of Tishrei */
__publicField$b(_JewishCalendar, "YOM_KIPPUR", 13);
/** The 14th day of Tishrei, the day before of Succos/Sukkos (Tabernacles). */
__publicField$b(_JewishCalendar, "EREV_SUCCOS", 14);
/** The holiday of Succos/Sukkos (Tabernacles), the 15th (and 16th out of Israel) day of Tishrei */
__publicField$b(_JewishCalendar, "SUCCOS", 15);
/** Chol Hamoed (interim days) of Succos/Sukkos (Tabernacles) */
__publicField$b(_JewishCalendar, "CHOL_HAMOED_SUCCOS", 16);
/** Hoshana Rabba, the 7th day of Succos/Sukkos that occurs on the 21st of Tishrei. */
__publicField$b(_JewishCalendar, "HOSHANA_RABBA", 17);
/** Shmini Atzeres, the 8th day of Succos/Sukkos is an independent holiday that occurs on the 22nd of Tishrei. */
__publicField$b(_JewishCalendar, "SHEMINI_ATZERES", 18);
/** Simchas Torah, the 9th day of Succos/Sukkos, or the second day of Shmini Atzeres that is celebrated
 * {@link #getInIsrael() out of Israel} on the 23rd of Tishrei.
 */
__publicField$b(_JewishCalendar, "SIMCHAS_TORAH", 19);
// public static final int EREV_CHANUKAH = 20;// probably remove this
/** The holiday of Chanukah. 8 days starting on the 25th day Kislev. */
__publicField$b(_JewishCalendar, "CHANUKAH", 21);
/** The fast of the 10th day of Teves. */
__publicField$b(_JewishCalendar, "TENTH_OF_TEVES", 22);
/** Tu Bishvat on the 15th day of Shevat, a minor holiday. */
__publicField$b(_JewishCalendar, "TU_BESHVAT", 23);
/** The fast of Esther, usually on the 13th day of Adar (or Adar II on leap years). It is earlier on some years. */
__publicField$b(_JewishCalendar, "FAST_OF_ESTHER", 24);
/** The holiday of Purim on the 14th day of Adar (or Adar II on leap years). */
__publicField$b(_JewishCalendar, "PURIM", 25);
/** The holiday of Shushan Purim on the 15th day of Adar (or Adar II on leap years). */
__publicField$b(_JewishCalendar, "SHUSHAN_PURIM", 26);
/** The holiday of Purim Katan on the 14th day of Adar I on a leap year when Purim is on Adar II, a minor holiday. */
__publicField$b(_JewishCalendar, "PURIM_KATAN", 27);
/**
 * Rosh Chodesh, the new moon on the first day of the Jewish month, and the 30th day of the previous month in the
 * case of a month with 30 days.
 */
__publicField$b(_JewishCalendar, "ROSH_CHODESH", 28);
/** Yom HaShoah, Holocaust Remembrance Day, usually held on the 27th of Nisan. If it falls on a Friday, it is moved
 * to the 26th, and if it falls on a Sunday it is moved to the 28th. A {@link #isUseModernHolidays() modern holiday}.
 */
__publicField$b(_JewishCalendar, "YOM_HASHOAH", 29);
/**
 * Yom HaZikaron, Israeli Memorial Day, held a day before Yom Ha'atzmaut.  A {@link #isUseModernHolidays() modern holiday}.
 */
__publicField$b(_JewishCalendar, "YOM_HAZIKARON", 30);
/** Yom Ha'atzmaut, Israel Independence Day, the 5th of Iyar, but if it occurs on a Friday or Saturday, the holiday is
 * moved back to Thursday, the 3rd of 4th of Iyar, and if it falls on a Monday, it is moved forward to Tuesday the
 * 6th of Iyar.  A {@link #isUseModernHolidays() modern holiday}. */
__publicField$b(_JewishCalendar, "YOM_HAATZMAUT", 31);
/**
 * Yom Yerushalayim or Jerusalem Day, on 28 Iyar. A {@link #isUseModernHolidays() modern holiday}.
 */
__publicField$b(_JewishCalendar, "YOM_YERUSHALAYIM", 32);
/** The 33rd day of the Omer, the 18th of Iyar, a minor holiday. */
__publicField$b(_JewishCalendar, "LAG_BAOMER", 33);
/** The holiday of Purim Katan on the 15th day of Adar I on a leap year when Purim is on Adar II, a minor holiday. */
__publicField$b(_JewishCalendar, "SHUSHAN_PURIM_KATAN", 34);
/**
 * An array of <em>parshiyos</em> in the 17 possible combinations.
 */
__publicField$b(_JewishCalendar, "parshalist", [
  [0 /* NONE */, 52 /* VAYEILECH */, 53 /* HAAZINU */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 55 /* VAYAKHEL_PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 58 /* BEHAR_BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 52 /* VAYEILECH */, 53 /* HAAZINU */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 55 /* VAYAKHEL_PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 58 /* BEHAR_BECHUKOSAI */, 34 /* BAMIDBAR */, 0 /* NONE */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 59 /* CHUKAS_BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 55 /* VAYAKHEL_PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 58 /* BEHAR_BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 51 /* NITZAVIM */],
  [0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 58 /* BEHAR_BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 51 /* NITZAVIM */],
  [0 /* NONE */, 0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 55 /* VAYAKHEL_PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 58 /* BEHAR_BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 51 /* NITZAVIM */],
  [0 /* NONE */, 0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 55 /* VAYAKHEL_PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 58 /* BEHAR_BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 52 /* VAYEILECH */, 53 /* HAAZINU */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 0 /* NONE */, 29 /* ACHREI_MOS */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 0 /* NONE */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 59 /* CHUKAS_BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 52 /* VAYEILECH */, 53 /* HAAZINU */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 0 /* NONE */, 0 /* NONE */, 29 /* ACHREI_MOS */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 51 /* NITZAVIM */],
  [0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 29 /* ACHREI_MOS */, 0 /* NONE */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 42 /* MATOS */, 43 /* MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 51 /* NITZAVIM */],
  [0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 29 /* ACHREI_MOS */, 0 /* NONE */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 42 /* MATOS */, 43 /* MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 0 /* NONE */, 29 /* ACHREI_MOS */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 0 /* NONE */, 29 /* ACHREI_MOS */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 0 /* NONE */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 59 /* CHUKAS_BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 52 /* VAYEILECH */, 53 /* HAAZINU */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 55 /* VAYAKHEL_PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 58 /* BEHAR_BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 55 /* VAYAKHEL_PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 0 /* NONE */, 26 /* SHMINI */, 56 /* TAZRIA_METZORA */, 57 /* ACHREI_MOS_KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 51 /* NITZAVIM */],
  [0 /* NONE */, 52 /* VAYEILECH */, 53 /* HAAZINU */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 0 /* NONE */, 29 /* ACHREI_MOS */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */],
  [0 /* NONE */, 52 /* VAYEILECH */, 53 /* HAAZINU */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 0 /* NONE */, 29 /* ACHREI_MOS */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 42 /* MATOS */, 43 /* MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 51 /* NITZAVIM */],
  [0 /* NONE */, 0 /* NONE */, 53 /* HAAZINU */, 0 /* NONE */, 0 /* NONE */, 1 /* BERESHIS */, 2 /* NOACH */, 3 /* LECH_LECHA */, 4 /* VAYERA */, 5 /* CHAYEI_SARA */, 6 /* TOLDOS */, 7 /* VAYETZEI */, 8 /* VAYISHLACH */, 9 /* VAYESHEV */, 10 /* MIKETZ */, 11 /* VAYIGASH */, 12 /* VAYECHI */, 13 /* SHEMOS */, 14 /* VAERA */, 15 /* BO */, 16 /* BESHALACH */, 17 /* YISRO */, 18 /* MISHPATIM */, 19 /* TERUMAH */, 20 /* TETZAVEH */, 21 /* KI_SISA */, 22 /* VAYAKHEL */, 23 /* PEKUDEI */, 24 /* VAYIKRA */, 25 /* TZAV */, 26 /* SHMINI */, 27 /* TAZRIA */, 28 /* METZORA */, 0 /* NONE */, 29 /* ACHREI_MOS */, 30 /* KEDOSHIM */, 31 /* EMOR */, 32 /* BEHAR */, 33 /* BECHUKOSAI */, 34 /* BAMIDBAR */, 35 /* NASSO */, 36 /* BEHAALOSCHA */, 37 /* SHLACH */, 38 /* KORACH */, 39 /* CHUKAS */, 40 /* BALAK */, 41 /* PINCHAS */, 60 /* MATOS_MASEI */, 44 /* DEVARIM */, 45 /* VAESCHANAN */, 46 /* EIKEV */, 47 /* REEH */, 48 /* SHOFTIM */, 49 /* KI_SEITZEI */, 50 /* KI_SAVO */, 61 /* NITZAVIM_VAYEILECH */]
]);
let JewishCalendar = _JewishCalendar;

var __defProp$a = Object.defineProperty;
var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$a = (obj, key, value) => {
  __defNormalProp$a(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _ZmanimCalendar = class _ZmanimCalendar extends AstronomicalCalendar {
  constructor() {
    super(...arguments);
    /**
    * Is elevation factored in for some zmanim (see {@link #isUseElevation()} for additional information).
    * @see #isUseElevation()
    * @see #setUseElevation(boolean)
    */
    __publicField$a(this, "useElevation", false);
    /**
    * The default <em>Shabbos</em> candle lighting offset is 18 minutes. This can be changed via the
    * {@link #setCandleLightingOffset(double)} and retrieved by the {@link #getCandleLightingOffset()}.
    */
    __publicField$a(this, "candleLightingOffset", 18);
  }
  /**
  * Is elevation above sea level calculated for times besides sunrise and sunset. According to Rabbi Dovid Yehuda
  * Bursztyn in his <a href="https://www.worldcat.org/oclc/659793988">Zmanim Kehilchasam (second edition published
  * in 2007)</a> chapter 2 (pages 186-187) no <em>zmanim</em> besides sunrise and sunset should use elevation. However
  * Rabbi Yechiel Avrahom Zilber in the <a href="https://hebrewbooks.org/51654">Birur Halacha Vol. 6</a> Ch. 58 Pages
  * <a href="https://hebrewbooks.org/pdfpager.aspx?req=51654&amp;pgnum=42">34</a> and <a href=
  * "https://hebrewbooks.org/pdfpager.aspx?req=51654&amp;pgnum=50">42</a> is of the opinion that elevation should be
  * accounted for in <em>zmanim</em> calculations. Related to this, Rabbi Yaakov Karp in <a href=
  * "https://www.worldcat.org/oclc/919472094">Shimush Zekeinim</a>, Ch. 1, page 17 states that obstructing horizons
  * should be factored into <em>zmanim</em> calculations.The setting defaults to false (elevation will not be used for
  * <em>zmanim</em> calculations), unless the setting is changed to true in {@link #setUseElevation(boolean)}. This will
  * impact sunrise and sunset based <em>zmanim</em> such as {@link #getSunrise()}, {@link #getSunset()},
  * {@link #getSofZmanShmaGRA()}, alos based <em>zmanim</em> such as {@link #getSofZmanShmaMGA()} that are based on a
  * fixed offset of sunrise or sunset and <em>zmanim</em> based on a percentage of the day such as {@link
  * ComplexZmanimCalendar#getSofZmanShmaMGA90MinutesZmanis()} that are based on sunrise and sunset. It will not impact
  * <em>zmanim</em> that are a degree based offset of sunrise and sunset, such as
  * {@link ComplexZmanimCalendar#getSofZmanShmaMGA16Point1Degrees()} or {@link ComplexZmanimCalendar#getSofZmanShmaBaalHatanya()}.
  * 
  * @return if the use of elevation is active
  * 
  * @see #setUseElevation(boolean)
  */
  isUseElevation() {
    return this.useElevation;
  }
  /**
  * Sets whether elevation above sea level is factored into <em>zmanim</em> calculations for times besides sunrise and sunset.
  * See {@link #isUseElevation()} for more details. 
  * @see #isUseElevation()
  * 
  * @param useElevation set to true to use elevation in <em>zmanim</em> calculations
  */
  setUseElevation(useElevation) {
    this.useElevation = useElevation;
  }
  /**
  * This method will return {@link #getSeaLevelSunrise() sea level sunrise} if {@link #isUseElevation()} is false (the
  * default), or elevation adjusted {@link AstronomicalCalendar#getSunrise()} if it is true. This allows relevant <em>zmanim</em>
  * in this and extending classes (such as the {@link ComplexZmanimCalendar}) to automatically adjust to the elevation setting.
  * 
  * @return {@link #getSeaLevelSunrise()} if {@link #isUseElevation()} is false (the default), or elevation adjusted
  *         {@link AstronomicalCalendar#getSunrise()} if it is true.
  * @see AstronomicalCalendar#getSunrise()
  */
  getElevationAdjustedSunrise() {
    if (this.isUseElevation()) {
      return super.getSunrise();
    }
    return this.getSeaLevelSunrise();
  }
  /**
  * This method will return {@link #getSeaLevelSunrise() sea level sunrise} if {@link #isUseElevation()} is false (the default),
  * or elevation adjusted {@link AstronomicalCalendar#getSunrise()} if it is true. This allows relevant <em>zmanim</em>
  * in this and extending classes (such as the {@link ComplexZmanimCalendar}) to automatically adjust to the elevation setting.
  * 
  * @return {@link #getSeaLevelSunset()} if {@link #isUseElevation()} is false (the default), or elevation adjusted
  *         {@link AstronomicalCalendar#getSunset()} if it is true.
  * @see AstronomicalCalendar#getSunset()
  */
  getElevationAdjustedSunset() {
    if (this.isUseElevation()) {
      return super.getSunset();
    }
    return this.getSeaLevelSunset();
  }
  /**
  * A method that returns <em>tzais</em> (nightfall) when the sun is {@link #ZENITH_8_POINT_5 8.5&deg;} below the
  * {@link #GEOMETRIC_ZENITH geometric horizon} (90&deg;) after {@link #getSunset sunset}, a time that Rabbi Meir
  * Posen in his the <em><a href="https://www.worldcat.org/oclc/29283612">Ohr Meir</a></em> calculated that 3 small
  * stars are visible, which is later than the required 3 medium stars. See the {@link #ZENITH_8_POINT_5} constant.
  * 
  * @see #ZENITH_8_POINT_5
  * 
  * @return The <code>Date</code> of nightfall. If the calculation can't be computed such as northern and southern
  *         locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not reach
  *         low enough below the horizon for this calculation, a null will be returned. See detailed explanation on
  *         top of the {@link AstronomicalCalendar} documentation.
  * @see #ZENITH_8_POINT_5
  * ComplexZmanimCalendar#getTzaisGeonim8Point5Degrees() that returns an identical time to this generic <em>tzais</em>
  */
  getTzais() {
    return this.getSunsetOffsetByDegrees(_ZmanimCalendar.ZENITH_8_POINT_5);
  }
  /**
  * Returns <em>alos</em> (dawn) based on the time when the sun is {@link #ZENITH_16_POINT_1 16.1&deg;} below the
  * eastern {@link #GEOMETRIC_ZENITH geometric horizon} before {@link #getSunrise sunrise}. This is based on the
  * calculation that the time between dawn and sunrise (and sunset to nightfall) is 72 minutes, the time that is
  * takes to walk 4 <em>mil</em> at 18 minutes a mil (<em><a href="https://en.wikipedia.org/wiki/Maimonides"
  * >Rambam</a></em> and others). The sun's position at 72 minutes before {@link #getSunrise sunrise} in Jerusalem
  * on the <a href="https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox /
  * equilux</a> is 16.1&deg; below {@link #GEOMETRIC_ZENITH}.
  * 
  * @see #ZENITH_16_POINT_1
  * @see ComplexZmanimCalendar#getAlos16Point1Degrees()
  * 
  * @return The <code>Date</code> of dawn. If the calculation can't be computed such as northern and southern
  *         locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not reach
  *         low enough below the horizon for this calculation, a null will be returned. See detailed explanation on
  *         top of the {@link AstronomicalCalendar} documentation.
  */
  getAlosHashachar() {
    return this.getSunriseOffsetByDegrees(_ZmanimCalendar.ZENITH_16_POINT_1);
  }
  /**
  * Method to return <em>alos</em> (dawn) calculated using 72 minutes before {@link #getSunrise() sunrise} or
  * {@link #getSeaLevelSunrise() sea level sunrise} (depending on the {@link #isUseElevation()} setting). This time
  * is based on the time to walk the distance of 4 <em>Mil</em> at 18 minutes a <em>Mil</em>. The 72 minute time (but
  * not the concept of fixed minutes) is based on the opinion that the time of the <em>Neshef</em> (twilight between
  * dawn and sunrise) does not vary by the time of year or location but depends on the time it takes to walk the
  * distance of 4 <em>Mil</em>.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  */
  getAlos72() {
    return _ZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunrise(), -72 * _ZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * This method returns <em>chatzos</em> (midday) following most opinions that <em>chatzos</em> is the midpoint
  * between {@link #getSeaLevelSunrise sea level sunrise} and {@link #getSeaLevelSunset sea level sunset}. A day
  * starting at <em>alos</em> and ending at <em>tzais</em> using the same time or degree offset will also return
  * the same time. The returned value is identical to {@link #getSunTransit()}. In reality due to lengthening or
  * shortening of day, this is not necessarily the exact midpoint of the day, but it is very close.
  * 
  * @see AstronomicalCalendar#getSunTransit()
  * @return the <code>Date</code> of chatzos. If the calculation can't be computed such as in the Arctic Circle
  *         where there is at least one day where the sun does not rise, and one where it does not set, a null will
  *         be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  */
  getChatzos() {
    return this.getSunTransit();
  }
  /**
  * A generic method for calculating the latest <em>zman krias shema</em> (time to recite shema in the morning)
  * that is 3 * <em>shaos zmaniyos</em> (temporal hours) after the start of the day, calculated using the start and
  * end of the day passed to this method.
  * The time from the start of day to the end of day are divided into 12 <em>shaos zmaniyos</em> (temporal hours),
  * and the latest <em>zman krias shema</em> is calculated as 3 of those <em>shaos zmaniyos</em> after the beginning of
  * the day. As an example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link #getSeaLevelSunrise()
  * sea level sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()}
  * elevation setting) to this method will return <em>sof zman krias shema</em> according to the opinion of the
  * <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>.
  * 
  * @param startOfDay
  *            the start of day for calculating <em>zman krias shema</em>. This can be sunrise or any <em>alos</em> passed
  *            to this method.
  * @param endOfDay
  *            the end of day for calculating <em>zman krias shema</em>. This can be sunset or any <em>tzais</em> passed to
  *            this method.
  * @return the <code>Date</code> of the latest <em>zman shema</em> based on the start and end of day times passed to this
  *         method. If the calculation can't be computed such as in the Arctic Circle where there is at least one day
  *         a year where the sun does not rise, and one where it does not set, a null will be returned. See detailed
  *         explanation on top of the {@link AstronomicalCalendar} documentation.
  */
  getSofZmanShma(startOfDay, endOfDay) {
    return this.getShaahZmanisBasedZman(startOfDay, endOfDay, 3);
  }
  /**
  * This method returns the latest <em>zman krias shema</em> (time to recite shema in the morning) that is 3 *
  * {@link #getShaahZmanisGra() <em>shaos zmaniyos</em>} (solar hours) after {@link #getSunrise() sunrise} or
  * {@link #getSeaLevelSunrise() sea level sunrise} (depending on the {@link #isUseElevation()} setting), according
  * to the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a>. 
  *  The day is calculated from {@link #getSeaLevelSunrise() sea level sunrise} to {@link #getSeaLevelSunrise sea level
  *  sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset} (depending on the {@link #isUseElevation()}
  *  setting).
  * 
  * @see #getSofZmanShma(Date, Date)
  * @see #getShaahZmanisGra()
  * @see #isUseElevation()
  * @see ComplexZmanimCalendar#getSofZmanShmaBaalHatanya()
  * @return the <code>Date</code> of the latest <em>zman shema</em> according to the GRA. If the calculation can't be
  *         computed such as in the Arctic Circle where there is at least one day a year where the sun does not rise,
  *         and one where it does not set, a null will be returned. See the detailed explanation on top of the {@link
  *         AstronomicalCalendar} documentation.
  */
  getSofZmanShmaGRA() {
    return this.getSofZmanShma(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
  }
  /**
  * This method returns the latest <em>zman krias shema</em> (time to recite shema in the morning) that is 3 *
  * {@link #getShaahZmanisMGA() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos72()}, according to the
  * <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a>. The day is calculated
  * from 72 minutes before {@link #getSeaLevelSunrise() sea level sunrise} to 72 minutes after {@link
  * #getSeaLevelSunrise sea level sunset} or from 72 minutes before {@link #getSunrise() sunrise} to {@link #getSunset()
  * sunset} (depending on the {@link #isUseElevation()} setting).
  * 
  * @return the <code>Date</code> of the latest <em>zman shema</em>. If the calculation can't be computed such as in
  *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  * @see #getSofZmanShma(Date, Date)
  * @see ComplexZmanimCalendar#getShaahZmanis72Minutes()
  * @see ComplexZmanimCalendar#getAlos72()
  * @see ComplexZmanimCalendar#getSofZmanShmaMGA72Minutes() that 
  */
  getSofZmanShmaMGA() {
    return this.getSofZmanShma(this.getAlos72(), this.getTzais72());
  }
  /**
  * This method returns the <em>tzais</em> (nightfall) based on the opinion of <em>Rabbeinu Tam</em> that
  * <em>tzais hakochavim</em> is calculated as 72 minutes, the time it takes to walk 4 <em>Mil</em> at 18 minutes
  * a <em>Mil</em>. According to the <a href="https://en.wikipedia.org/wiki/Samuel_Loew">Machtzis Hashekel</a> in
  * Orach Chaim 235:3, the <a href="https://en.wikipedia.org/wiki/Joseph_ben_Meir_Teomim">Pri Megadim</a> in Orach
  * Chaim 261:2 (see the Biur Halacha) and others (see Hazmanim Bahalacha 17:3 and 17:5) the 72 minutes are standard
  * clock minutes any time of the year in any location. Depending on the {@link #isUseElevation()} setting) a 72
  * minute offset from  either {@link #getSunset() sunset} or {@link #getSeaLevelSunset() sea level sunset} is used.
  * 
  * @see ComplexZmanimCalendar#getTzais16Point1Degrees()
  * @return the <code>Date</code> representing 72 minutes after sunset. If the calculation can't be
  *         computed such as in the Arctic Circle where there is at least one day a year where the sun does not rise,
  *         and one where it does not set, a null will be returned See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  */
  getTzais72() {
    return _ZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), 72 * _ZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * A method to return candle lighting time, calculated as {@link #getCandleLightingOffset()} minutes before
  * {@link #getSeaLevelSunset() sea level sunset}. This will return the time for any day of the week, since it can be
  * used to calculate candle lighting time for <em>Yom Tov</em> (mid-week holidays) as well. Elevation adjustments
  * are intentionally not performed by this method, but you can calculate it by passing the elevation adjusted sunset
  * to {@link #getTimeOffset(Date, long)}.
  * 
  * @return candle lighting time. If the calculation can't be computed such as in the Arctic Circle where there is at
  *         least one day a year where the sun does not rise, and one where it does not set, a null will be returned.
  *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * 
  * @see #getSeaLevelSunset()
  * @see #getCandleLightingOffset()
  * @see #setCandleLightingOffset(double)
  */
  getCandleLighting() {
    return _ZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), -this.getCandleLightingOffset() * _ZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * A generic method for calculating the latest <em>zman tfilah</em> (time to recite the morning prayers)
  * that is 4 * <em>shaos zmaniyos</em> (temporal hours) after the start of the day, calculated using the start and
  * end of the day passed to this method.
  * The time from the start of day to the end of day are divided into 12 <em>shaos zmaniyos</em> (temporal hours),
  * and <em>sof zman tfila</em> is calculated as 4 of those <em>shaos zmaniyos</em> after the beginning of the day.
  * As an example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link #getSeaLevelSunrise()
  * sea level sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()}
  * elevation setting) to this method will return <em>zman tfilah</em> according to the opinion of the <em><a href=
  * "https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>.
  * 
  * @param startOfDay
  *            the start of day for calculating <em>zman tfilah</em>. This can be sunrise or any <em>alos</em> passed
  *            to this method.
  * @param endOfDay
  *            the end of day for calculating <em>zman tfilah</em>. This can be sunset or any <em>tzais</em> passed
  *            to this method.
  * @return the <code>Date</code> of the latest <em>zman tfilah</em> based on the start and end of day times passed
  *         to this method. If the calculation can't be computed such as in the Arctic Circle where there is at least
  *         one day a year where the sun does not rise, and one where it does not set, a null will be returned. See
  *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  */
  getSofZmanTfila(startOfDay, endOfDay) {
    return this.getShaahZmanisBasedZman(startOfDay, endOfDay, 4);
  }
  /**
  * This method returns the latest <em>zman tfila</em> (time to recite shema in the morning) that is 4 *
  * {@link #getShaahZmanisGra() <em>shaos zmaniyos</em> }(solar hours) after {@link #getSunrise() sunrise} or
  * {@link #getSeaLevelSunrise() sea level sunrise} (depending on the {@link #isUseElevation()} setting), according
  * to the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a>. 
  * The day is calculated from {@link #getSeaLevelSunrise() sea level sunrise} to {@link #getSeaLevelSunrise sea level
  * sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset} (depending on the {@link #isUseElevation()}
  * setting).
  * 
  * @see #getSofZmanTfila(Date, Date)
  * @see #getShaahZmanisGra()
  * @see ComplexZmanimCalendar#getSofZmanTfilaBaalHatanya()
  * @return the <code>Date</code> of the latest <em>zman tfilah</em>. If the calculation can't be computed such as in
  *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  */
  getSofZmanTfilaGRA() {
    return this.getSofZmanTfila(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
  }
  /**
  * This method returns the latest <em>zman tfila</em> (time to recite shema in the morning) that is 4 *
  * {@link #getShaahZmanisMGA() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos72()}, according to the
  * <em><a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a></em>. The day is calculated
  * from 72 minutes before {@link #getSeaLevelSunrise() sea level sunrise} to 72 minutes after {@link
  * #getSeaLevelSunrise sea level sunset} or from 72 minutes before {@link #getSunrise() sunrise} to {@link #getSunset()
  * sunset} (depending on the {@link #isUseElevation()} setting).
  * 
  * @return the <code>Date</code> of the latest <em>zman tfila</em>. If the calculation can't be computed such as in
  *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set), a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #getSofZmanTfila(Date, Date)
  * @see #getShaahZmanisMGA()
  * @see #getAlos72()
  */
  getSofZmanTfilaMGA() {
    return this.getSofZmanTfila(this.getAlos72(), this.getTzais72());
  }
  /**
  * A generic method for calculating the latest <em>mincha gedola</em> (the earliest time to recite the mincha  prayers)
  * that is 6.5 * <em>shaos zmaniyos</em> (temporal hours) after the start of the day, calculated using the start and end
  * of the day passed to this method.
  * The time from the start of day to the end of day are divided into 12 <em>shaos zmaniyos</em> (temporal hours), and
  * <em>mincha gedola</em> is calculated as 6.5 of those <em>shaos zmaniyos</em> after the beginning of the day. As an
  * example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link #getSeaLevelSunrise() sea level
  * sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()} elevation
  * setting) to this method will return <em>mincha gedola</em> according to the opinion of the
  * <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>.
  * 
  * @param startOfDay
  *            the start of day for calculating <em>Mincha gedola</em>. This can be sunrise or any <em>alos</em> passed
  *            to this method.
  * @param endOfDay
  *            the end of day for calculating <em>Mincha gedola</em>. This can be sunset or any <em>tzais</em> passed
  *            to this method.
  * @return the <code>Date</code> of the time of <em>Mincha gedola</em> based on the start and end of day times
  *         passed to this method. If the calculation can't be computed such as in the Arctic Circle where there is
  *         at least one day a year where the sun does not rise, and one where it does not set, a null will be
  *         returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  */
  getMinchaGedola(startOfDay = this.getElevationAdjustedSunrise(), endOfDay = this.getElevationAdjustedSunset()) {
    return this.getShaahZmanisBasedZman(startOfDay, endOfDay, 6.5);
  }
  /**
  * A generic method for calculating <em>samuch lemincha ketana</em>, / near <em>mincha ketana</em> time that is half
  * an hour before {@link #getMinchaKetana(Date, Date)}  or 9 * <em>shaos zmaniyos</em> (temporal hours) after the
  * start of the day, calculated using the start and end of the day passed to this method.
  * The time from the start of day to the end of day are divided into 12 <em>shaos zmaniyos</em> (temporal hours), and
  * <em>samuch lemincha ketana</em> is calculated as 9 of those <em>shaos zmaniyos</em> after the beginning of the day.
  * For example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link #getSeaLevelSunrise() sea
  * level sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()} elevation
  * setting) to this method will return <em>samuch lemincha ketana</em> according to the opinion of the
  * <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a>.
  * 
  * @param startOfDay
  *            the start of day for calculating <em>samuch lemincha ketana</em>. This can be sunrise or any <em>alos</em>
  *            passed to to this method.
  * @param endOfDay
  *            the end of day for calculating <em>samuch lemincha ketana</em>. This can be sunset or any <em>tzais</em>
  *            passed to this method.
  * @return the <code>Date</code> of the time of <em>Mincha ketana</em> based on the start and end of day times
  *         passed to this method. If the calculation can't be computed such as in the Arctic Circle where there is
  *         at least one day a year where the sun does not rise, and one where it does not set, a null will be
  *         returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  *
  * @see ComplexZmanimCalendar#getSamuchLeMinchaKetanaGRA()
  * @see ComplexZmanimCalendar#getSamuchLeMinchaKetana16Point1Degrees()
  * @see ComplexZmanimCalendar#getSamuchLeMinchaKetana72Minutes()
  */
  getSamuchLeMinchaKetana(startOfDay, endOfDay) {
    return this.getShaahZmanisBasedZman(startOfDay, endOfDay, 9);
  }
  /**
   * A generic method for calculating <em>mincha ketana</em>, (the preferred time to recite the mincha prayers in
   * the opinion of the <em><a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a></em> and others) that is
   * 9.5 * <em>shaos zmaniyos</em> (temporal hours) after the start of the day, calculated using the start and end
   * of the day passed to this method.
   * The time from the start of day to the end of day are divided into 12 <em>shaos zmaniyos</em> (temporal hours), and
   * <em>mincha ketana</em> is calculated as 9.5 of those <em>shaos zmaniyos</em> after the beginning of the day. As an
   * example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link #getSeaLevelSunrise() sea level
     * sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()} elevation
   * setting) to this method will return <em>mincha ketana</em> according to the opinion of the
   * <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>.
   *
   * @param startOfDay
   *            the start of day for calculating <em>Mincha ketana</em>. This can be sunrise or any alos passed to
   *            this method.
   * @param endOfDay
   *            the end of day for calculating <em>Mincha ketana</em>. This can be sunrise or any alos passed to
   *            this method.
   * @return the <code>Date</code> of the time of <em>Mincha ketana</em> based on the start and end of day times
   *         passed to this method. If the calculation can't be computed such as in the Arctic Circle where there is
   *         at least one day a year where the sun does not rise, and one where it does not set, a null will be
   *         returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getMinchaKetana(startOfDay = this.getElevationAdjustedSunrise(), endOfDay = this.getElevationAdjustedSunset()) {
    return this.getShaahZmanisBasedZman(startOfDay, endOfDay, 9.5);
  }
  /**
   * A generic method for calculating <em>plag hamincha</em> (the earliest time that Shabbos can be started) that is
   * 10.75 hours after the start of the day, (or 1.25 hours before the end of the day) based on the start and end of
   * the day passed to the method.
   * The time from the start of day to the end of day are divided into 12 <em>shaos zmaniyos</em> (temporal hours), and
   * <em>plag hamincha</em> is calculated as 10.75 of those <em>shaos zmaniyos</em> after the beginning of the day. As an
   * example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link #getSeaLevelSunrise() sea level
     * sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()} elevation
   * setting) to this method will return <em>plag mincha</em> according to the opinion of the
   * <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>.
   *
   * @param startOfDay
   *            the start of day for calculating plag. This can be sunrise or any alos passed to this method.
   * @param endOfDay
   *            the end of day for calculating plag. This can be sunrise or any alos passed to this method.
   * @return the <code>Date</code> of the time of <em>plag hamincha</em> based on the start and end of day times
   *         passed to this method. If the calculation can't be computed such as in the Arctic Circle where there is
   *         at least one day a year where the sun does not rise, and one where it does not set, a null will be
   *         returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getPlagHamincha(startOfDay = this.getElevationAdjustedSunrise(), endOfDay = this.getElevationAdjustedSunset()) {
    return this.getShaahZmanisBasedZman(startOfDay, endOfDay, 10.75);
  }
  /**
   * This method returns <em>plag hamincha</em>, that is 10.75 * <em>{@link #getShaahZmanisGra() shaos zmaniyos}</em>
   * (solar hours) after {@link #getSunrise() sunrise} or {@link #getSeaLevelSunrise() sea level sunrise} (depending on
   * the {@link #isUseElevation()} setting), according to the <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon"
   * >GRA</a></em>. Plag hamincha is the earliest time that <em>Shabbos</em> can be started.
   * The day is calculated from {@link #getSeaLevelSunrise() sea level sunrise} to {@link #getSeaLevelSunrise sea level
     * sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset} (depending on the {@link #isUseElevation()}
   *
   * @see #getPlagHamincha(Date, Date)
   * @see ComplexZmanimCalendar#getPlagHaminchaBaalHatanya()
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  /*
      public getPlagHamincha(): Date {
          return this.getPlagHamincha(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
      }
  */
  /**
   * A method that returns a <em>shaah zmanis</em> ({@link #getTemporalHour(Date, Date) temporal hour}) according to
   * the opinion of the <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>. This calculation divides
   * the day based on the opinion of the <em>GRA</em> that the day runs from from {@link #getSeaLevelSunrise() sea
     * level sunrise} to {@link #getSeaLevelSunrise sea level sunset} or {@link #getSunrise() sunrise} to
   * {@link #getSunset() sunset} (depending on the {@link #isUseElevation()} setting). The day is split into 12 equal
   * parts with each one being a <em>shaah zmanis</em>. This method is similar to {@link #getTemporalHour}, but can
   * account for elevation.
   *
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em> calculated from sunrise to sunset.
   *         If the calculation can't be computed such as in the Arctic Circle where there is at least one day a year
   *         where the sun does not rise, and one where it does not set, {@link Long#MIN_VALUE} will be returned. See
   *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getTemporalHour(Date, Date)
   * @see #getSeaLevelSunrise()
   * @see #getSeaLevelSunset()
   * @see ComplexZmanimCalendar#getShaahZmanisBaalHatanya()
   */
  getShaahZmanisGra() {
    return this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
  }
  /**
   * A method that returns a <em>shaah zmanis</em> (temporal hour) according to the opinion of the <em><a href=
   * "https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a></em> based on a 72 minutes <em>alos</em>
   * and <em>tzais</em>. This calculation divides the day that runs from dawn to dusk (for sof zman krias shema and tfila).
   * Dawn for this calculation is 72 minutes before {@link #getSunrise() sunrise} or {@link #getSeaLevelSunrise() sea level
     * sunrise} (depending on the {@link #isUseElevation()} elevation setting) and dusk is 72 minutes after {@link #getSunset
     * sunset} or {@link #getSeaLevelSunset() sea level sunset} (depending on the {@link #isUseElevation()} elevation setting).
   * This day is split into 12 equal parts with each part being a <em>shaah zmanis</em>. Alternate methods of calculating a
   * <em>shaah zmanis</em> according to the Magen Avraham (MGA) are available in the subclass {@link ComplexZmanimCalendar}.
   *
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getShaahZmanisMGA() {
    return this.getTemporalHour(this.getAlos72(), this.getTzais72());
  }
  /**
   * Default constructor will set a default {@link GeoLocation#GeoLocation()}, a default
   * {@link AstronomicalCalculator#getDefault() AstronomicalCalculator} and default the calendar to the current date.
   *
   * @see AstronomicalCalendar#AstronomicalCalendar()
   */
  /*
      public ZmanimCalendar() {
          super();
      }
  */
  /**
   * A constructor that takes a {@link GeoLocation} as a parameter.
   *
   * @param location
   *            the location
   */
  /*
  constructor(location?: GeoLocation) {
    super(location);
  }
  */
  /**
   * A method to get the offset in minutes before {@link AstronomicalCalendar#getSeaLevelSunset() sea level sunset} which
   * is used in calculating candle lighting time. The default time used is 18 minutes before sea level sunset. Some
   * calendars use 15 minutes, while the custom in Jerusalem is to use a 40 minute offset. Please check the local custom
   * for candle lighting time.
   *
   * @return Returns the currently set candle lighting offset in minutes.
   * @see #getCandleLighting()
   * @see #setCandleLightingOffset(double)
   */
  getCandleLightingOffset() {
    return this.candleLightingOffset;
  }
  /**
   * A method to set the offset in minutes before {@link AstronomicalCalendar#getSeaLevelSunset() sea level sunset} that is
   * used in calculating candle lighting time. The default time used is 18 minutes before sunset. Some calendars use 15
   * minutes, while the custom in Jerusalem is to use a 40 minute offset.
   *
   * @param candleLightingOffset
   *            The candle lighting offset to set in minutes.
   * @see #getCandleLighting()
   * @see #getCandleLightingOffset()
   */
  setCandleLightingOffset(candleLightingOffset) {
    this.candleLightingOffset = candleLightingOffset;
  }
  // eslint-disable-next-line class-methods-use-this
  getClassName() {
    return "com.kosherjava.zmanim.ZmanimCalendar";
  }
  /**
   * This is a utility method to determine if the current Date (date-time) passed in has a <em>melacha</em> (work) prohibition.
   * Since there are many opinions on the time of <em>tzais</em>, the <em>tzais</em> for the current day has to be passed to this
   * class. Sunset is the classes current day's {@link #getElevationAdjustedSunset() elevation adjusted sunset} that observes the
   * {@link #isUseElevation()} settings. The {@link JewishCalendar#getInIsrael()} will be set by the inIsrael parameter.
   *
   * @param currentTime the current time
   * @param tzais the time of tzais
   * @param inIsrael whether to use Israel holiday scheme or not
   *
   * @return true if <em>melacha</em> is prohibited or false if it is not.
   *
   * @see JewishCalendar#isAssurBemelacha()
   * @see JewishCalendar#hasCandleLighting()
   * @see JewishCalendar#setInIsrael(boolean)
   */
  isAssurBemlacha(currentTime, tzais, inIsrael) {
    const jewishCalendar = new JewishCalendar();
    const date = this.getDate();
    jewishCalendar.setGregorianDate(date.year, date.month - 1, date.day);
    jewishCalendar.setInIsrael(inIsrael);
    const sunset = this.getElevationAdjustedSunset();
    if (!sunset)
      throw new NullPointerException();
    if (jewishCalendar.hasCandleLighting() && currentTime >= sunset) {
      return true;
    }
    return jewishCalendar.isAssurBemelacha() && currentTime <= tzais;
  }
  /**
   * A generic utility method for calculating any <em>shaah zmanis</em> (temporal hour) based <em>zman</em> with the
   * day defined as the start and end of day (or night) and the number of <em>shaahos zmaniyos</em> passed to the
   * method. This simplifies the code in other methods such as {@link #getPlagHamincha(Date, Date)} and cuts down on
   * code replication. As an example, passing {@link #getSunrise() sunrise} and {@link #getSunset sunset} or {@link
    * #getSeaLevelSunrise() sea level sunrise} and {@link #getSeaLevelSunset() sea level sunset} (depending on the
   * {@link #isUseElevation()} elevation setting) and 10.75 hours to this method will return <em>plag mincha</em>
   * according to the opinion of the <em><a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a></em>.
   *
   * @param startOfDay
   *            the start of day for calculating the <em>zman</em>. This can be sunrise or any <em>alos</em> passed
   *            to this method.
   * @param endOfDay
   *            the end of day for calculating the <em>zman</em>. This can be sunrise or any <em>alos</em> passed to
   *            this method.
   * @param hours
   *            the number of <em>shaahos zmaniyos</em> (temporal hours) to offset from the start of day
   * @return the <code>Date</code> of the time of <em>zman</em> with the <em>shaahos zmaniyos</em> (temporal hours)
   *         in the day offset from the start of day passed to this method. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a null will be  returned. See detailed explanation on top of the {@link
    *         AstronomicalCalendar} documentation.
   */
  getShaahZmanisBasedZman(startOfDay, endOfDay, hours) {
    const shaahZmanis = this.getTemporalHour(startOfDay, endOfDay);
    return _ZmanimCalendar.getTimeOffset(startOfDay, shaahZmanis * hours);
  }
};
/**
* The zenith of 16.1&deg; below geometric zenith (90&deg;). This calculation is used for determining <em>alos</em>
* (dawn) and <em>tzais</em> (nightfall) in some opinions. It is based on the calculation that the time between dawn
* and sunrise (and sunset to nightfall) is 72 minutes, the time that is takes to walk 4 <em>mil</em> at 18 minutes
* a mil (<em><a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a></em> and others). The sun's position at
* 72 minutes before {@link #getSunrise sunrise} in Jerusalem <a href=
* "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> is
* 16.1&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
* 
* @see #getAlosHashachar()
* @see ComplexZmanimCalendar#getAlos16Point1Degrees()
* @see ComplexZmanimCalendar#getTzais16Point1Degrees()
* @see ComplexZmanimCalendar#getSofZmanShmaMGA16Point1Degrees()
* @see ComplexZmanimCalendar#getSofZmanTfilaMGA16Point1Degrees()
* @see ComplexZmanimCalendar#getMinchaGedola16Point1Degrees()
* @see ComplexZmanimCalendar#getMinchaKetana16Point1Degrees()
* @see ComplexZmanimCalendar#getPlagHamincha16Point1Degrees()
* @see ComplexZmanimCalendar#getPlagAlos16Point1ToTzaisGeonim7Point083Degrees()
* @see ComplexZmanimCalendar#getSofZmanShmaAlos16Point1ToSunset()
*/
__publicField$a(_ZmanimCalendar, "ZENITH_16_POINT_1", _ZmanimCalendar.GEOMETRIC_ZENITH + 16.1);
/**
* The zenith of 8.5&deg; below geometric zenith (90&deg;). This calculation is used for calculating <em>alos</em>
* (dawn) and <em>tzais</em> (nightfall) in some opinions. This calculation is based on the position of the sun 36
* minutes after {@link #getSunset sunset} in Jerusalem <a href=
* "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, which
* is 8.5&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}. The <em><a href=
* "https://www.worldcat.org/oclc/29283612">Ohr Meir</a></em> considers this the time that 3 small stars are visible,
* which is later than the required 3 medium stars.
* 
* @see #getTzais()
* @see ComplexZmanimCalendar#getTzaisGeonim8Point5Degrees()
*/
__publicField$a(_ZmanimCalendar, "ZENITH_8_POINT_5", _ZmanimCalendar.GEOMETRIC_ZENITH + 8.5);
let ZmanimCalendar = _ZmanimCalendar;

var __defProp$9 = Object.defineProperty;
var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$9 = (obj, key, value) => {
  __defNormalProp$9(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _ComplexZmanimCalendar = class _ComplexZmanimCalendar extends ZmanimCalendar {
  constructor() {
    super(...arguments);
    /**
     * The offset in minutes (defaults to 40) after sunset used for <em>tzeit</em> based on calculations of
     * <em>Chacham</em> Yosef Harari-Raful of Yeshivat Ateret Torah. 
     * @see #getTzaisAteretTorah()
     * @see #getAteretTorahSunsetOffset()
     * @see #setAteretTorahSunsetOffset(double)
     */
    __publicField$9(this, "ateretTorahSunsetOffset", 40);
  }
  /*
  constructor(location?: GeoLocation) {
    super(location);
  }
  */
  /**
   * Default constructor will set a default {@link GeoLocation#GeoLocation()}, a default
   * {@link AstronomicalCalculator#getDefault() AstronomicalCalculator} and default the calendar to the current date.
   *
   * @see AstronomicalCalendar#AstronomicalCalendar()
   */
  /*
      public ComplexZmanimCalendar() {
          super();
      }
  */
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) calculated using a 19.8&deg; dip. This calculation
   * divides the day based on the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen
   * Avraham (MGA)</a> that the day runs from dawn to dusk. Dawn for this calculation is when the sun is 19.8&deg;
   * below the eastern geometric horizon before sunrise. Dusk for this is when the sun is 19.8&deg; below the western
   * geometric horizon after sunset. This day is split into 12 equal parts with each part being a <em>shaah zmanis</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a {@link Long#MIN_VALUE}
   *         will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getShaahZmanis19Point8Degrees() {
    return this.getTemporalHour(this.getAlos19Point8Degrees(), this.getTzais19Point8Degrees());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) calculated using a 18&deg; dip. This calculation divides
   * the day based on the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham
   * (MGA)</a> that the day runs from dawn to dusk. Dawn for this calculation is when the sun is 18&deg; below the
   * eastern geometric horizon before sunrise. Dusk for this is when the sun is 18&deg; below the western geometric
   * horizon after sunset. This day is split into 12 equal parts with each part being a <em>shaah zmanis</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a {@link Long#MIN_VALUE}
   *         will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getShaahZmanis18Degrees() {
    return this.getTemporalHour(this.getAlos18Degrees(), this.getTzais18Degrees());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) calculated using a dip of 26&deg;. This calculation
   * divides the day based on the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen
   * Avraham (MGA)</a> that the day runs from dawn to dusk. Dawn for this calculation is when the sun is
   * {@link #getAlos26Degrees() 26&deg;} below the eastern geometric horizon before sunrise. Dusk for this is when
   * the sun is {@link #getTzais26Degrees() 26&deg;} below the western geometric horizon after sunset. This day is
   * split into 12 equal parts with each part being a <em>shaah zmanis</em>. Since <em>zmanim</em> that use this
   * method are extremely late or early and at a point when the sky is a long time past the 18&deg; point where the
   * darkest point is reached, <em>zmanim</em> that use this should only be used <em>lechumra</em>, such as
   * delaying the start of nighttime <em>mitzvos</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a {@link Long#MIN_VALUE}
   *         will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis120Minutes()
   */
  getShaahZmanis26Degrees() {
    return this.getTemporalHour(this.getAlos26Degrees(), this.getTzais26Degrees());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) calculated using a dip of 16.1&deg;. This calculation
   * divides the day based on the opinion that the day runs from dawn to dusk. Dawn for this calculation is when the
   * sun is 16.1&deg; below the eastern geometric horizon before sunrise and dusk is when the sun is 16.1&deg; below
   * the western geometric horizon after sunset. This day is split into 12 equal parts with each part being a
   * <em>shaah zmanis</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a {@link Long#MIN_VALUE}
   *         will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getAlos16Point1Degrees()
   * @see #getTzais16Point1Degrees()
   * @see #getSofZmanShmaMGA16Point1Degrees()
   * @see #getSofZmanTfilaMGA16Point1Degrees()
   * @see #getMinchaGedola16Point1Degrees()
   * @see #getMinchaKetana16Point1Degrees()
   * @see #getPlagHamincha16Point1Degrees()
   */
  getShaahZmanis16Point1Degrees() {
    return this.getTemporalHour(this.getAlos16Point1Degrees(), this.getTzais16Point1Degrees());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (solar hour) according to the opinion of the <a href=
   * "https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a>. This calculation
   * divides the day based on the opinion of the MGA that the day runs from dawn to dusk. Dawn for this calculation is
   * 60 minutes before sunrise and dusk is 60 minutes after sunset. This day is split into 12 equal parts with each
   * part being a <em>shaah zmanis</em>. Alternate methods of calculating a <em>shaah zmanis</em> are available in the
   * subclass {@link ComplexZmanimCalendar}.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #getAlos60()
   * @see #getTzais60()
   * @see #getPlagHamincha60Minutes()
   */
  getShaahZmanis60Minutes() {
    return this.getTemporalHour(this.getAlos60(), this.getTzais60());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (solar hour) according to the opinion of the <a href=
   * "https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a>. This calculation divides the day
   * based on the opinion of the MGA that the day runs from dawn to dusk. Dawn for this calculation is 72 minutes
   * before sunrise and dusk is 72 minutes after sunset. This day is split into 12 equal parts with each part
   * being a <em>shaah zmanis</em>. Alternate methods of calculating a <em>shaah zmanis</em> are available in the
   * subclass {@link ComplexZmanimCalendar}.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getShaahZmanis72Minutes() {
    return this.getShaahZmanisMGA();
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) according to the opinion of the <a href=
   * "https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em> being
   * {@link #getAlos72Zmanis() 72} minutes <em>zmaniyos</em> before {@link #getSunrise() sunrise}. This calculation
   * divides the day based on the opinion of the MGA that the day runs from dawn to dusk. Dawn for this calculation
   * is 72 minutes <em>zmaniyos</em> before sunrise and dusk is 72 minutes <em>zmaniyos</em> after sunset. This day
   * is split into 12 equal parts with each part being a <em>shaah zmanis</em>. This is identical to 1/10th of the day
   * from {@link #getSunrise() sunrise} to {@link #getSunset() sunset}.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getAlos72Zmanis()
   * @see #getTzais72Zmanis()
   */
  getShaahZmanis72MinutesZmanis() {
    return this.getTemporalHour(this.getAlos72Zmanis(), this.getTzais72Zmanis());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) calculated using a dip of 90 minutes. This calculation
   * divides the day based on the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen
   * Avraham (MGA)</a> that the day runs from dawn to dusk. Dawn for this calculation is 90 minutes before sunrise
   * and dusk is 90 minutes after sunset. This day is split into 12 equal parts with each part being a <em>shaah zmanis</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getShaahZmanis90Minutes() {
    return this.getTemporalHour(this.getAlos90(), this.getTzais90());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) according to the opinion of the <a href=
   * "https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em> being
   * {@link #getAlos90Zmanis() 90} minutes <em>zmaniyos</em> before {@link #getSunrise() sunrise}. This calculation divides
   * the day based on the opinion of the MGA that the day runs from dawn to dusk. Dawn for this calculation is 90 minutes
   * <em>zmaniyos</em> before sunrise and dusk is 90 minutes <em>zmaniyos</em> after sunset. This day is split into 12 equal
   * parts with each part being a <em>shaah zmanis</em>. This is 1/8th of the day from {@link #getSunrise() sunrise} to
   * {@link #getSunset() sunset}.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getAlos90Zmanis()
   * @see #getTzais90Zmanis()
   */
  getShaahZmanis90MinutesZmanis() {
    return this.getTemporalHour(this.getAlos90Zmanis(), this.getTzais90Zmanis());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) according to the opinion of the <a href=
   * "https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em> being {@link
    * #getAlos96Zmanis() 96} minutes <em>zmaniyos</em> before {@link #getSunrise() sunrise}. This calculation divides the
    * day based on the opinion of the MGA that the day runs from dawn to dusk. Dawn for this calculation is 96 minutes
    * <em>zmaniyos</em> before sunrise and dusk is 96 minutes <em>zmaniyos</em> after sunset. This day is split into 12
    * equal parts with each part being a <em>shaah zmanis</em>. This is identical to 1/7.5th of the day from
    * {@link #getSunrise() sunrise} to {@link #getSunset() sunset}.
    * 
    * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
    *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
    *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
    *         {@link AstronomicalCalendar} documentation.
    * @see #getAlos96Zmanis()
    * @see #getTzais96Zmanis()
    */
  getShaahZmanis96MinutesZmanis() {
    return this.getTemporalHour(this.getAlos96Zmanis(), this.getTzais96Zmanis());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) according to the opinion of the
   * <em>Chacham</em> Yosef Harari-Raful of Yeshivat Ateret Torah calculated with <em>alos</em> being 1/10th
   * of sunrise to sunset day, or {@link #getAlos72Zmanis() 72} minutes <em>zmaniyos</em> of such a day before
   * {@link #getSunrise() sunrise}, and <em>tzais</em> is usually calculated as {@link #getTzaisAteretTorah() 40
   * minutes} (configurable to any offset via {@link #setAteretTorahSunsetOffset(double)}) after {@link #getSunset()
   * sunset}. This day is split into 12 equal parts with each part being a <em>shaah zmanis</em>. Note that with this
   * system, <em>chatzos</em> (mid-day) will not be the point that the sun is {@link #getSunTransit() halfway across
   * the sky}.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getAlos72Zmanis()
   * @see #getTzaisAteretTorah()
   * @see #getAteretTorahSunsetOffset()
   * @see #setAteretTorahSunsetOffset(double)
   */
  getShaahZmanisAteretTorah() {
    return this.getTemporalHour(this.getAlos72Zmanis(), this.getTzaisAteretTorah());
  }
  /**
  * Method to return a <em>shaah zmanis</em> (temporal hour) used by some <em>zmanim</em> according to the opinion of
  * <a href="https://en.wikipedia.org/wiki/Yaakov_Moshe_Hillel">Rabbi Yaakov Moshe Hillel</a> as published in the
  * <em>luach</em> of the Bais Horaah of Yeshivat Chevrat Ahavat Shalom that is based on a day starting 72 minutes before
  * sunrise in degrees {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ending 14 minutes after sunset in
  * degrees {@link #getTzaisGeonim3Point8Degrees() <em>tzais</em> 3.8&deg;}. This day is split into 12 equal parts with
  * each part being a <em>shaah zmanis</em>. Note that with this system, <em>chatzos</em> (mid-day) will not be the point
  * that the sun is {@link #getSunTransit() halfway across the sky}. These <em>shaos zmaniyos</em> are used for <em>Mincha
  * Ketana</em> and <em>Plag Hamincha</em>. The 14 minutes are based on 3/4 of an 18 minute <em>mil</em>, with half a minute
  * added for Rav Yosi.
  * 
  * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
  *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
  *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  * 
  * @see #getMinchaKetanaAhavatShalom()
  * @see #getPlagAhavatShalom()
  */
  getShaahZmanisAlos16Point1ToTzais3Point8() {
    return this.getTemporalHour(this.getAlos16Point1Degrees(), this.getTzaisGeonim3Point8Degrees());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) used by some <em>zmanim</em> according to the opinion of
   * <a href="https://en.wikipedia.org/wiki/Yaakov_Moshe_Hillel">Rabbi Yaakov Moshe Hillel</a> as published in the
   * <em>luach</em> of the Bais Horaah of Yeshivat Chevrat Ahavat Shalom that is based on a day starting 72 minutes before
   * sunrise in degrees {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ending 13.5 minutes after sunset in
   * degrees {@link #getTzaisGeonim3Point7Degrees() <em>tzais</em> 3.7&deg;}. This day is split into 12 equal parts with
   * each part being a <em>shaah zmanis</em>. Note that with this system, <em>chatzos</em> (mid-day) will not be the point
   * that the sun is {@link #getSunTransit() halfway across the sky}. These <em>shaos zmaniyos</em> are used for <em>Mincha
   * Gedola</em> calculation.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #getMinchaGedolaAhavatShalom()
   */
  getShaahZmanisAlos16Point1ToTzais3Point7() {
    return this.getTemporalHour(this.getAlos16Point1Degrees(), this.getTzaisGeonim3Point7Degrees());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) calculated using a dip of 96 minutes. This calculation
   * divides the day based on the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen
   * Avraham (MGA)</a> that the day runs from dawn to dusk. Dawn for this calculation is 96 minutes before sunrise
   * and dusk is 96 minutes after sunset. This day is split into 12 equal parts with each part being a <em>shaah
   * zmanis</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getShaahZmanis96Minutes() {
    return this.getTemporalHour(this.getAlos96(), this.getTzais96());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) calculated using a dip of 120 minutes. This calculation
   * divides the day based on the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen
   * Avraham (MGA)</a> that the day runs from dawn to dusk. Dawn for this calculation is 120 minutes before sunrise and
   * dusk is 120 minutes after sunset. This day is split into 12 equal parts with each part being a <em>shaah zmanis</em>.
   * Since <em>zmanim</em> that use this method are extremely late or early and at a point when the sky is a long time
   * past the 18&deg; point where the darkest point is reached, <em>zmanim</em> that use this should only be used
   * <em>lechumra</em> only, such as delaying the start of nighttime <em>mitzvos</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis26Degrees()
   */
  getShaahZmanis120Minutes() {
    return this.getTemporalHour(this.getAlos120(), this.getTzais120());
  }
  /**
   * Method to return a <em>shaah zmanis</em> (temporal hour) according to the opinion of the <a href=
   * "https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em> being {@link
   * #getAlos120Zmanis() 120} minutes <em>zmaniyos</em> before {@link #getSunrise() sunrise}. This calculation divides
   * the day based on the opinion of the MGA that the day runs from dawn to dusk. Dawn for this calculation is
   * 120 minutes <em>zmaniyos</em> before sunrise and dusk is 120 minutes <em>zmaniyos</em> after sunset. This day is
   * split into 12 equal parts with each part being a <em>shaah zmanis</em>. This is identical to 1/6th of the day from
   * {@link #getSunrise() sunrise} to {@link #getSunset() sunset}. Since <em>zmanim</em> that use this method are
   * extremely late or early and at a point when the sky is a long time past the 18&deg; point where the darkest point
   * is reached, <em>zmanim</em> that use this should only be used <em>lechumra</em> such as delaying the start of
   * nighttime <em>mitzvos</em>.
   * 
   * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em>. If the calculation can't be computed
   *         such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
   *         where it does not set, a {@link Long#MIN_VALUE} will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getAlos120Zmanis()
   * @see #getTzais120Zmanis()
   */
  getShaahZmanis120MinutesZmanis() {
    return this.getTemporalHour(this.getAlos120Zmanis(), this.getTzais120Zmanis());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> based on sunrise
   * being 120 minutes <em>zmaniyos</em> or 1/6th of the day before sunrise. This is calculated as 10.75 hours after
   * {@link #getAlos120Zmanis() dawn}. The formula used is 10.75 * {@link #getShaahZmanis120MinutesZmanis()} after
   * {@link #getAlos120Zmanis() dawn}. Since the <em>zman</em> based on an extremely early <em>alos</em> and a very
   * late <em>tzais</em>, it should only be used <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis120MinutesZmanis()
   * @see #getAlos120()
   * @see #getTzais120()
   * @see #getPlagHamincha26Degrees()
   * @see #getPlagHamincha120Minutes()
   */
  getPlagHamincha120MinutesZmanis() {
    return this.getPlagHamincha(this.getAlos120Zmanis(), this.getTzais120Zmanis());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> according to the
   * Magen Avraham with the day starting 120 minutes before sunrise and ending 120 minutes after sunset. This is
   * calculated as 10.75 hours after {@link #getAlos120() dawn 120 minutes}. The formula used is 10.75 {@link
    * #getShaahZmanis120Minutes()} after {@link #getAlos120()}. Since the <em>zman</em> based on an extremely early
    * <em>alos</em> and a very late <em>tzais</em>, it should only be used <em>lechumra</em>.
    * 
    * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
    *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
    *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
    * 
    * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
    *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
    *         does not set, a null will be returned. See detailed explanation on top of the
    *         {@link AstronomicalCalendar} documentation.
    * 
    * @see #getShaahZmanis120Minutes()
    * @see #getPlagHamincha26Degrees()
    */
  getPlagHamincha120Minutes() {
    return this.getPlagHamincha(this.getAlos120(), this.getTzais120());
  }
  /**
   * Method to return <em>alos</em> (dawn) calculated as 60 minutes before sunrise. This is the time to walk the 
   * distance of 4 <em>Mil</em> at 15 minutes a <em>Mil</em>. This seems to be the opinion of the <a href=
   * "https://en.wikipedia.org/wiki/Yair_Bacharach">Chavas Yair</a> in the Mekor Chaim, Orach Chaim Ch.
   * 90, though  the Mekor Chaim in Ch. 58 and in the <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=45193&pgnum=214">Chut Hashani Cha 97</a> states that
   * a a person walks 3 and a 1/3 <em>mil</em> in an hour, or an 18-minute <em>mil</em>. Also see the <a href=
   * "https://he.wikipedia.org/wiki/%D7%9E%D7%9C%D7%9B%D7%99%D7%90%D7%9C_%D7%A6%D7%91%D7%99_%D7%98%D7%A0%D7%A0%D7%91%D7%95%D7%99%D7%9D"
   * >Divrei Malkiel</a> <a href="https://hebrewbooks.org/pdfpager.aspx?req=803&pgnum=33">Vol. 4, Ch. 20, page 34</a>) who
   * mentions the 15 minute <em>mil</em> lechumra by baking matzos. Also see the <a href=
   * "https://en.wikipedia.org/wiki/Joseph_Colon_Trabotto">Maharik</a> <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=1142&pgnum=216">Ch. 173</a> where the questioner quoting the
   * <a href="https://en.wikipedia.org/wiki/Eliezer_ben_Nathan">Ra'avan</a> is of the opinion that the time to walk a
   * <em>mil</em> is 15 minutes (5 <em>mil</em> in a little over an hour). There are many who believe that there is a
   * <em>ta'us sofer</em> (scribe's error) in the Ra'avan, and it should 4 <em>mil</em> in a little over an hour, or an
   * 18-minute <em>mil</em>. Time based offset calculations are based on the opinion of the
   * <em><a href="https://en.wikipedia.org/wiki/Rishonim">Rishonim</a></em> who stated that the time of the <em>neshef</em>
   * (time between dawn and sunrise) does not vary by the time of year or location but purely depends on the time it takes to
   * walk the distance of 4* <em>mil</em>. {@link #getTzaisGeonim9Point75Degrees()} is a related <em>zman</em> that is a
   * degree-based calculation based on 60 minutes.
   * 
   * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
   *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
   *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}.
   *         documentation.
   *
   * @see #getTzais60()
   * @see #getPlagHamincha60Minutes()
   * @see #getShaahZmanis60Minutes()
   */
  getAlos60() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getSunrise(), -60 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * Method to return <em>alos</em> (dawn) calculated using 72 minutes <em>zmaniyos</em> or 1/10th of the day before
   * sunrise. This is based on an 18-minute <em>Mil</em> so the time for 4 <em>Mil</em> is 72 minutes which is 1/10th
   * of a day (12 * 60 = 720) based on the a day being from {@link #getSeaLevelSunrise() sea level sunrise} to
   * {@link #getSeaLevelSunrise sea level sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset}
   * (depending on the {@link #isUseElevation()} setting).
   * The actual calculation is {@link #getSeaLevelSunrise()} - ({@link #getShaahZmanisGra()} * 1.2). This calculation
   * is used in the calendars published by the <a href=
   * "https://en.wikipedia.org/wiki/Central_Rabbinical_Congress">Hisachdus Harabanim D'Artzos Habris Ve'Canada</a>.
   * 
   * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
   *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
   *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * @see #getShaahZmanisGra()
   */
  getAlos72Zmanis() {
    return this.getZmanisBasedOffset(-1.2);
  }
  /**
   * Method to return <em>alos</em> (dawn) calculated using 96 minutes before before {@link #getSunrise() sunrise} or
   * {@link #getSeaLevelSunrise() sea level sunrise} (depending on the {@link #isUseElevation()} setting) that is based
   * on the time to walk the distance of 4 <em>Mil</em> at 24 minutes a <em>Mil</em>. Time based offset
   * calculations for <em>alos</em> are based on the opinion of the <em><a href="https://en.wikipedia.org/wiki/Rishonim"
   * >Rishonim</a></em> who stated that the time of the <em>Neshef</em> (time between dawn and sunrise) does not vary
   * by the time of year or location but purely depends on the time it takes to walk the distance of 4 <em>Mil</em>.
   * 
   * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
   *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
   *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   */
  getAlos96() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunrise(), -96 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * Method to return <em>alos</em> (dawn) calculated using 90 minutes <em>zmaniyos</em> or 1/8th of the day before
   * {@link #getSunrise() sunrise} or {@link #getSeaLevelSunrise() sea level sunrise} (depending on the {@link
    * #isUseElevation()} setting). This is based on a 22.5-minute <em>Mil</em> so the time for 4 <em>Mil</em> is 90
    * minutes which is 1/8th of a day (12 * 60) / 8 = 90
    * The day is calculated from {@link #getSeaLevelSunrise() sea level sunrise} to {@link #getSeaLevelSunrise sea level
    * sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset} (depending on the {@link #isUseElevation()}.
    * The actual calculation used is {@link #getSunrise()} - ({@link #getShaahZmanisGra()} * 1.5).
    * 
    * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
    *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
    *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
    *         documentation.
    * @see #getShaahZmanisGra()
    */
  getAlos90Zmanis() {
    return this.getZmanisBasedOffset(-1.5);
  }
  /**
   * This method returns <em>alos</em> (dawn) calculated using 96 minutes <em>zmaniyos</em> or 1/7.5th of the day before
   * {@link #getSunrise() sunrise} or {@link #getSeaLevelSunrise() sea level sunrise} (depending on the {@link
    * #isUseElevation()} setting). This is based on a 24-minute <em>Mil</em> so the time for 4 <em>Mil</em> is 96
    * minutes which is 1/7.5th of a day (12 * 60 / 7.5 = 96).
    * The day is calculated from {@link #getSeaLevelSunrise() sea level sunrise} to {@link #getSeaLevelSunrise sea level
    * sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset} (depending on the {@link #isUseElevation()}.
    * The actual calculation used is {@link #getSunrise()} - ({@link #getShaahZmanisGra()} * 1.6).
    * 
    * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
    *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
    *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
    *         documentation.
    * @see #getShaahZmanisGra()
    */
  getAlos96Zmanis() {
    return this.getZmanisBasedOffset(-1.6);
  }
  /**
   * Method to return <em>alos</em> (dawn) calculated using 90 minutes before {@link #getSeaLevelSunrise() sea level
    * sunrise} based on the time to walk the distance of 4 <em>Mil</em> at 22.5 minutes a <em>Mil</em>. Time based
    * offset calculations for <em>alos</em> are based on the opinion of the <em><a href=
    * "https://en.wikipedia.org/wiki/Rishonim">Rishonim</a></em> who stated that the time of the <em>Neshef</em>
    * (time between dawn and sunrise) does not vary by the time of year or location but purely depends on the time it
    * takes to walk the distance of 4 <em>Mil</em>.
    * 
    * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
    *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
    *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
    *         documentation.
    */
  getAlos90() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunrise(), -90 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method should be used <em>lechumra</em> only and returns <em>alos</em> (dawn) calculated using 120 minutes
   * before {@link #getSeaLevelSunrise() sea level sunrise} (no adjustment for elevation is made) based on the time
   * to walk the distance of 5 <em>Mil</em>(<em>Ula</em>) at 24 minutes a <em>Mil</em>. Time based offset calculations
   * for <em>alos</em> are based on the* opinion of the <em><a href="https://en.wikipedia.org/wiki/Rishonim">Rishonim</a>
   * </em> who stated that the time of the <em>neshef</em> (time between dawn and sunrise) does not vary by the time of
   * year or location but purely depends on the time it takes to walk the distance of 5 <em>Mil</em>(<em>Ula</em>). Since
   * this time is extremely early, it should only be used <em>lechumra</em>, such as not eating after this time on a fast
   * day, and not as the start time for <em>mitzvos</em> that can only be performed during the day.
   * 
   * @deprecated This method should be used <em>lechumra</em> only (such as stopping to eat at this time on a fast day),
   *         since it returns a very early time, and if used <em>lekula</em> can result in doing <em>mitzvos hayom</em>
   *         too early according to most opinions. There is no current plan to remove this method from the API, and this
   *         deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
   *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
   *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * 
   * @see #getTzais120()
   * @see #getAlos26Degrees()
   */
  getAlos120() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunrise(), -120 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method should be used <em>lechumra</em> only and  method returns <em>alos</em> (dawn) calculated using
   * 120 minutes <em>zmaniyos</em> or 1/6th of the day before {@link #getSunrise() sunrise} or {@link
    * #getSeaLevelSunrise() sea level sunrise} (depending on the {@link #isUseElevation()} setting). This is based
    * on a 24-minute <em>Mil</em> so the time for 5 <em>Mil</em> is 120 minutes which is 1/6th of a day (12 * 60 /
    * 6 = 120). The day is calculated from {@link #getSeaLevelSunrise() sea level sunrise} to {@link
    * #getSeaLevelSunrise sea level sunset} or {@link #getSunrise() sunrise} to {@link #getSunset() sunset} (depending
    * on the {@link #isUseElevation()}. The actual calculation used is {@link #getSunrise()} - ({@link
    * #getShaahZmanisGra()} * 2). Since this time is extremely early, it should only be used <em>lechumra</em>, such
    * as not eating after this time on a fast day, and not as the start time for <em>mitzvos</em> that can only be
    * performed during the day.
    * 
    * @deprecated This method should be used <em>lechumra</em> only (such as stopping to eat at this time on a fast day),
    *         since it returns a very early time, and if used <em>lekula</em> can result in doing <em>mitzvos hayom</em>
    *         too early according to most opinions. There is no current plan to remove this method from the API, and this
    *         deprecation is intended to alert developers of the danger of using it.
    * 
    * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
    *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
    *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
    *         documentation.
    * @see #getAlos120()
    * @see #getAlos26Degrees()
    */
  getAlos120Zmanis() {
    return this.getZmanisBasedOffset(-2);
  }
  /**
   * This method should be used <em>lechumra</em> only and returns <em>alos</em> (dawn) calculated when the sun is {@link
    * #ZENITH_26_DEGREES 26&deg;} below the eastern geometric horizon before sunrise. This calculation is based on the same
    * calculation of {@link #getAlos120() 120 minutes} but uses a degree-based calculation instead of 120 exact minutes. This
    * calculation is based on the position of the sun 120 minutes before sunrise in Jerusalem <a href=
    * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, which
    * calculates to 26&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}. Since this time is extremely early, it should
    * only be used <em>lechumra</em> only, such as not eating after this time on a fast day, and not as the start time for
    * <em>mitzvos</em> that can only be performed during the day.
    * 
    * @deprecated This method should be used <em>lechumra</em> only (such as stopping to eat at this time on a fast day),
    *         since it returns a very early time, and if used <em>lekula</em> can result in doing <em>mitzvos hayom</em>
    *         too early according to most opinions. There is no current plan to remove this  method from the API, and this
    *         deprecation is intended to alert developers of the danger of using it.
    * 
    * @return the <code>Date</code> representing <em>alos</em>. If the calculation can't be computed such as northern
    *         and southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun
    *         may not reach low enough below the horizon for this calculation, a null will be returned. See detailed
    *         explanation on top of the {@link AstronomicalCalendar} documentation.
    * @see #ZENITH_26_DEGREES
    * @see #getAlos120()
    * @see #getTzais120()
    * @see #getTzais26Degrees()
    */
  getAlos26Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_26_DEGREES);
  }
  /**
   * A method to return <em>alos</em> (dawn) calculated when the sun is {@link #ASTRONOMICAL_ZENITH 18&deg;} below the
   * eastern geometric horizon before sunrise.
   * 
   * @return the <code>Date</code> representing <em>alos</em>. If the calculation can't be computed such as northern
   *         and southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun
   *         may not reach low enough below the horizon for this calculation, a null will be returned. See detailed
   *         explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ASTRONOMICAL_ZENITH
   */
  getAlos18Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ASTRONOMICAL_ZENITH);
  }
  /**
   * A method to return <em>alos</em> (dawn) calculated when the sun is {@link #ZENITH_19_DEGREES 19&deg;} below the
   * eastern geometric horizon before sunrise. This is the <a href="https://en.wikipedia.org/wiki/Maimonides"
   * >Rambam</a>'s <em>alos</em> according to Rabbi Moshe Kosower's <a href=
   * "https://www.worldcat.org/oclc/145454098">Maaglei Tzedek</a>, page 88, <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=33464&pgnum=13">Ayeles Hashachar Vol. I, page 12</a>, <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=55960&pgnum=258">Yom Valayla Shel Torah, Ch. 34, p. 222</a> and 
   * Rabbi Yaakov Shakow's <a href="https://www.worldcat.org/oclc/1043573513">Luach Ikvei Hayom</a>.
   * 
   * @return the <code>Date</code> representing <em>alos</em>. If the calculation can't be computed such as northern
   *         and southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun
   *         may not reach low enough below the horizon for this calculation, a null will be returned. See detailed
   *         explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ASTRONOMICAL_ZENITH
   */
  getAlos19Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_19_DEGREES);
  }
  /**
   * Method to return <em>alos</em> (dawn) calculated when the sun is {@link #ZENITH_19_POINT_8 19.8&deg;} below the
   * eastern geometric horizon before sunrise. This calculation is based on the same calculation of
   * {@link #getAlos90() 90 minutes} but uses a degree-based calculation instead of 90 exact minutes. This calculation
   * is based on the position of the sun 90 minutes before sunrise in Jerusalem <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, which
   * calculates to 19.8&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
   * 
   * @return the <code>Date</code> representing <em>alos</em>. If the calculation can't be computed such as northern
   *         and southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun
   *         may not reach low enough below the horizon for this calculation, a null will be returned. See detailed
   *         explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_19_POINT_8
   * @see #getAlos90()
   */
  getAlos19Point8Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_19_POINT_8);
  }
  /**
   * Method to return <em>alos</em> (dawn) calculated when the sun is {@link #ZENITH_16_POINT_1 16.1&deg;} below the
   * eastern geometric horizon before sunrise. This calculation is based on the same calculation of
   * {@link #getAlos72() 72 minutes} but uses a degree-based calculation instead of 72 exact minutes. This calculation
   * is based on the position of the sun 72 minutes before sunrise in Jerusalem <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, which
   * calculates to 16.1&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
   * 
   * @return the <code>Date</code> representing <em>alos</em>. If the calculation can't be computed such as northern
   *         and southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun
   *         may not reach low enough below the horizon for this calculation, a null will be returned. See detailed
   *         explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_16_POINT_1
   * @see #getAlos72()
   */
  getAlos16Point1Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_16_POINT_1);
  }
  /**
   * This method returns <em>misheyakir</em> based on the position of the sun when it is {@link #ZENITH_11_DEGREES
    * 11.5&deg;} below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for calculating
    * <em>misheyakir</em> according to some opinions. This calculation is based on the position of the sun 52 minutes
    * before {@link #getSunrise sunrise} in Jerusalem <a href=
    * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>,
    * which calculates to 11.5&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
    * @todo recalculate.
    * 
    * @return the <code>Date</code> of <em>misheyakir</em>. If the calculation can't be computed such as northern and
    *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may
    *         not reach low enough below the horizon for this calculation, a null will be returned. See detailed
    *         explanation on top of the {@link AstronomicalCalendar} documentation.
    * @see #ZENITH_11_POINT_5
    */
  getMisheyakir11Point5Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_11_POINT_5);
  }
  /**
   * This method returns <em>misheyakir</em> based on the position of the sun when it is {@link #ZENITH_11_DEGREES
    * 11&deg;} below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for calculating
    * <em>misheyakir</em> according to some opinions. This calculation is based on the position of the sun 48 minutes
    * before {@link #getSunrise sunrise} in Jerusalem d<a href=
    * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>,
    * which calculates to 11&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
    * 
    * @return If the calculation can't be computed such as northern and southern locations even south of the Arctic
    *         Circle and north of the Antarctic Circle where the sun may not reach low enough below the horizon for
    *         this calculation, a null will be returned. See detailed explanation on top of the
    *         {@link AstronomicalCalendar} documentation.
    * @see #ZENITH_11_DEGREES
    */
  getMisheyakir11Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_11_DEGREES);
  }
  /**
   * This method returns <em>misheyakir</em> based on the position of the sun when it is {@link #ZENITH_10_POINT_2
   * 10.2&deg;} below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for calculating
   * <em>misheyakir</em> according to some opinions. This calculation is based on the position of the sun 45 minutes
   * before {@link #getSunrise sunrise} in Jerusalem <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox</a> which calculates
   * to 10.2&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
   * 
   * @return the <code>Date</code> of <em>misheyakir</em>. If the calculation can't be computed such as
   *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
   *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
   *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_10_POINT_2
   */
  getMisheyakir10Point2Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_10_POINT_2);
  }
  /**
   * This method returns <em>misheyakir</em> based on the position of the sun when it is {@link #ZENITH_7_POINT_65
   * 7.65&deg;} below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). The degrees are based on a 35/36 minute
   * <em>zman</em> <a href="https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the
   * equinox / equilux</a>, when the <em>neshef</em> (twilight) is the shortest. This time is based on <a href=
   * "https://en.wikipedia.org/wiki/Moshe_Feinstein">Rabbi Moshe Feinstein</a> who writes in <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=14677&pgnum=7">Ohr Hachaim Vol. 4, Ch. 6</a>)
   * that <em>misheyakir</em> in New York is 35-40 minutes before sunset, something that is a drop less than 8&deg;.
   * <a href="https://en.wikipedia.org/wiki/Yisroel_Taplin">Rabbi Yisroel Taplin</a> in <a href=
   * "https://www.worldcat.org/oclc/889556744">Zmanei Yisrael</a> (page 117) notes that <a href=
   * "https://en.wikipedia.org/wiki/Yaakov_Kamenetsky">Rabbi Yaakov Kamenetsky</a> stated that it is not less than 36
   * minutes before sunrise (maybe it is 40 minutes). Sefer Yisrael Vehazmanim (p. 7) quotes the Tamar Yifrach
   * in the name of the <a href="https://en.wikipedia.org/wiki/Joel_Teitelbaum">Satmar Rov</a> that one should be stringent
   * not consider <em>misheyakir</em> before 36 minutes. This is also the accepted <a href=
   * "https://en.wikipedia.org/wiki/Minhag">minhag</a> in <a href=
   * "https://en.wikipedia.org/wiki/Lakewood_Township,_New_Jersey">Lakewood</a> that is used in the <a href=
   * "https://en.wikipedia.org/wiki/Beth_Medrash_Govoha">Yeshiva</a>. This follows the opinion of <a href=
   * "https://en.wikipedia.org/wiki/Shmuel_Kamenetsky">Rabbi Shmuel Kamenetsky</a> who provided the time of 35/36 minutes,
   * but did not provide a degree-based time. Since this <em>zman</em> depends on the level of light, Rabbi Yaakov Shakow
   * presented this degree-based calculations to Rabbi Kamenetsky who agreed to them.
   * 
   * @return the <code>Date</code> of <em>misheyakir</em>. If the calculation can't be computed such as
   *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
   *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
   *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #ZENITH_7_POINT_65
   * @see #getMisheyakir9Point5Degrees()
   */
  getMisheyakir7Point65Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_7_POINT_65);
  }
  /**
   * This method returns <em>misheyakir</em> based on the position of the sun when it is {@link #ZENITH_9_POINT_5
   * 9.5&deg;} below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is based on Rabbi Dovid Kronglass's
   * Calculation of 45 minutes in Baltimore as mentioned in <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=20287&pgnum=29">Divrei Chachamim No. 24</a> brought down by the <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=50535&pgnum=87">Birur Halacha, Tinyana, Ch. 18</a>. This calculates to
   * 9.5&deg;. Also see <a href="https://en.wikipedia.org/wiki/Jacob_Isaac_Neiman">Rabbi Yaakov Yitzchok Neiman</a> in Kovetz
   * Eitz Chaim Vol. 9, p. 202 that the Vya'an Yosef did not want to rely on times earlier than 45 minutes in New York. This
   * <em>zman</em> is also used in the calendars published by Rabbi Hershel Edelstein. As mentioned in Yisroel Vehazmanim,
   * Rabbi Edelstein who was given the 45 minute <em>zman</em> by Rabbi Bick. The calendars published by the <em><a href=
   * "https://en.wikipedia.org/wiki/Mizrahi_Jews">Edot Hamizrach</a></em> communities also use this <em>zman</em>. This also
   * follows the opinion of <a href="https://en.wikipedia.org/wiki/Shmuel_Kamenetsky">Rabbi Shmuel Kamenetsky</a> who provided
   * the time of 36 and 45 minutes, but did not provide a degree-based time. Since this <em>zman</em> depends on the level of
   * light, Rabbi Yaakov Shakow presented these degree-based times to Rabbi Shmuel Kamenetsky who agreed to them.
   * 
   * @return the <code>Date</code> of <em>misheyakir</em>. If the calculation can't be computed such as
   *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
   *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
   *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #ZENITH_9_POINT_5
   * @see #getMisheyakir7Point65Degrees()
   */
  getMisheyakir9Point5Degrees() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_9_POINT_5);
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos19Point8Degrees() 19.8&deg;} before {@link #getSunrise() sunrise}. This
   * time is 3 {@link #getShaahZmanis19Point8Degrees() <em>shaos zmaniyos</em>} (solar hours) after {@link
   * #getAlos19Point8Degrees() dawn} based on the opinion of the MGA that the day is calculated from dawn to nightfall
   * with both being 19.8&deg; below sunrise or sunset. This returns the time of 3 *
   * {@link #getShaahZmanis19Point8Degrees()} after {@link #getAlos19Point8Degrees() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis19Point8Degrees()
   * @see #getAlos19Point8Degrees()
   */
  getSofZmanShmaMGA19Point8Degrees() {
    return this.getSofZmanShma(this.getAlos19Point8Degrees(), this.getTzais19Point8Degrees());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based
   * on <em>alos</em> being {@link #getAlos16Point1Degrees() 16.1&deg;} before {@link #getSunrise() sunrise}. This time
   * is 3 {@link #getShaahZmanis16Point1Degrees() <em>shaos zmaniyos</em>} (solar hours) after
   * {@link #getAlos16Point1Degrees() dawn} based on the opinion of the MGA that the day is calculated from
   * dawn to nightfall with both being 16.1&deg; below sunrise or sunset. This returns the time of
   * 3 * {@link #getShaahZmanis16Point1Degrees()} after {@link #getAlos16Point1Degrees() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis16Point1Degrees()
   * @see #getAlos16Point1Degrees()
   */
  getSofZmanShmaMGA16Point1Degrees() {
    return this.getSofZmanShma(this.getAlos16Point1Degrees(), this.getTzais16Point1Degrees());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based
   * on <em>alos</em> being {@link #getAlos18Degrees() 18&deg;} before {@link #getSunrise() sunrise}. This time is 3
   * {@link #getShaahZmanis18Degrees() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos18Degrees() dawn}
   * based on the opinion of the MGA that the day is calculated from dawn to nightfall with both being 18&deg;
   * below sunrise or sunset. This returns the time of 3 * {@link #getShaahZmanis18Degrees()} after
   * {@link #getAlos18Degrees() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis18Degrees()
   * @see #getAlos18Degrees()
   */
  getSofZmanShmaMGA18Degrees() {
    return this.getSofZmanShma(this.getAlos18Degrees(), this.getTzais18Degrees());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos72() 72} minutes before {@link #getSunrise() sunrise}. This time is 3 {@link
   * #getShaahZmanis72Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos72() dawn} based on the opinion
   * of the MGA that the day is calculated from a {@link #getAlos72() dawn} of 72 minutes before sunrise to
   * {@link #getTzais72() nightfall} of 72 minutes after sunset. This returns the time of 3 * {@link
   * #getShaahZmanis72Minutes()} after {@link #getAlos72() dawn}. This class returns an identical time to {@link
   * #getSofZmanShmaMGA()} and is repeated here for clarity.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis72Minutes()
   * @see #getAlos72()
   * @see #getSofZmanShmaMGA()
   */
  getSofZmanShmaMGA72Minutes() {
    return this.getSofZmanShmaMGA();
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite <em>Shema</em> in the morning) according
   * to the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based
   * on <em>alos</em> being {@link #getAlos72Zmanis() 72} minutes <em>zmaniyos</em>, or 1/10th of the day before
   * {@link #getSunrise() sunrise}. This time is 3 {@link #getShaahZmanis90MinutesZmanis() <em>shaos zmaniyos</em>}
   * (solar hours) after {@link #getAlos72Zmanis() dawn} based on the opinion of the MGA that the day is calculated
   * from a {@link #getAlos72Zmanis() dawn} of 72 minutes <em>zmaniyos</em>, or 1/10th of the day before
   * {@link #getSeaLevelSunrise() sea level sunrise} to {@link #getTzais72Zmanis() nightfall} of 72 minutes
   * <em>zmaniyos</em> after {@link #getSeaLevelSunset() sea level sunset}. This returns the time of 3 *
   * {@link #getShaahZmanis72MinutesZmanis()} after {@link #getAlos72Zmanis() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis72MinutesZmanis()
   * @see #getAlos72Zmanis()
   */
  getSofZmanShmaMGA72MinutesZmanis() {
    return this.getSofZmanShma(this.getAlos72Zmanis(), this.getTzais72Zmanis());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite <em>Shema</em> in the morning) according
   * to the opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos90() 90} minutes before {@link #getSunrise() sunrise}. This time is 3
   * {@link #getShaahZmanis90Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos90() dawn} based on
   * the opinion of the MGA that the day is calculated from a {@link #getAlos90() dawn} of 90 minutes before sunrise to
   * {@link #getTzais90() nightfall} of 90 minutes after sunset. This returns the time of 3 *
   * {@link #getShaahZmanis90Minutes()} after {@link #getAlos90() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis90Minutes()
   * @see #getAlos90()
   */
  getSofZmanShmaMGA90Minutes() {
    return this.getSofZmanShma(this.getAlos90(), this.getTzais90());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based
   * on <em>alos</em> being {@link #getAlos90Zmanis() 90} minutes <em>zmaniyos</em> before {@link #getSunrise()
   * sunrise}. This time is 3 {@link #getShaahZmanis90MinutesZmanis() <em>shaos zmaniyos</em>} (solar hours) after
   * {@link #getAlos90Zmanis() dawn} based on the opinion of the MGA that the day is calculated from a {@link
   * #getAlos90Zmanis() dawn} of 90 minutes <em>zmaniyos</em> before sunrise to {@link #getTzais90Zmanis() nightfall}
   * of 90 minutes <em>zmaniyos</em> after sunset. This returns the time of 3 * {@link #getShaahZmanis90MinutesZmanis()}
   * after {@link #getAlos90Zmanis() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis90MinutesZmanis()
   * @see #getAlos90Zmanis()
   */
  getSofZmanShmaMGA90MinutesZmanis() {
    return this.getSofZmanShma(this.getAlos90Zmanis(), this.getTzais90Zmanis());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based
   * on <em>alos</em> being {@link #getAlos96() 96} minutes before {@link #getSunrise() sunrise}. This time is 3
   * {@link #getShaahZmanis96Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos96() dawn} based on
   * the opinion of the MGA that the day is calculated from a {@link #getAlos96() dawn} of 96 minutes before
   * sunrise to {@link #getTzais96() nightfall} of 96 minutes after sunset. This returns the time of 3 * {@link
   * #getShaahZmanis96Minutes()} after {@link #getAlos96() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis96Minutes()
   * @see #getAlos96()
   */
  getSofZmanShmaMGA96Minutes() {
    return this.getSofZmanShma(this.getAlos96(), this.getTzais96());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based
   * on <em>alos</em> being {@link #getAlos90Zmanis() 96} minutes <em>zmaniyos</em> before {@link #getSunrise()
   * sunrise}. This time is 3 {@link #getShaahZmanis96MinutesZmanis() <em>shaos zmaniyos</em>} (solar hours) after
   * {@link #getAlos96Zmanis() dawn} based on the opinion of the MGA that the day is calculated from a {@link
   * #getAlos96Zmanis() dawn} of 96 minutes <em>zmaniyos</em> before sunrise to {@link #getTzais90Zmanis() nightfall}
   * of 96 minutes <em>zmaniyos</em> after sunset. This returns the time of 3 * {@link #getShaahZmanis96MinutesZmanis()}
   * after {@link #getAlos96Zmanis() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis96MinutesZmanis()
   * @see #getAlos96Zmanis()
   */
  getSofZmanShmaMGA96MinutesZmanis() {
    return this.getSofZmanShma(this.getAlos96Zmanis(), this.getTzais96Zmanis());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite <em>Shema</em> in the morning) calculated
   * as 3 hours (regular clock hours and not <em>sha'os zmaniyos</em>) before {@link ZmanimCalendar#getChatzos()}.
   * Generally known as part of the "Komarno" <em>zmanim</em> after <a href=
   * "https://en.wikipedia.org/wiki/Komarno_(Hasidic_dynasty)#Rabbi_Yitzchak_Eisik_Safrin">Rav Yitzchak Eizik of
   * Komarno</a>, a proponent of this calculation, it actually predates him a lot. It is the opinion of the 
   * <em>Shach</em> in the Nekudas Hakesef (Yoreh Deah 184), <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=21638&st=&pgnum=30">Rav Moshe Lifshitz</a> in his commentary
   * <a href="https://hebrewbooks.org/pdfpager.aspx?req=21638&st=&pgnum=50">Lechem Mishneh on Brachos 1:2</a>. It is
   * next brought down about 100 years later by the <a href="https://en.wikipedia.org/wiki/Jacob_Emden">Yaavetz</a>
   * (in his <em>siddur</em>, <a href="https://hebrewbooks.org/pdfpager.aspx?req=7920&st=&pgnum=6">Mor Uktziah Orach
   * Chaim 1</a>, <a href="https://hebrewbooks.org/pdfpager.aspx?req=22309&st=&pgnum=30">Lechem Shamayim, Brachos 1:2</a>
   * and <a href="https://hebrewbooks.org/pdfpager.aspx?req=1408&st=&pgnum=69">She'elos Yaavetz vol. 1 no. 40</a>),
   * Rav Yitzchak Eizik of Komarno in the Ma'aseh Oreg on Mishnayos Brachos 11:2, Shevus Yaakov, Chasan Sofer and others.
   * See Yisrael Vehazmanim <a href="https://hebrewbooks.org/pdfpager.aspx?req=9765&st=&pgnum=83">vol. 1 7:3, page 55 -
   * 62</a>. A variant of this calculation {@link #getSofZmanShmaFixedLocal()} uses {@link #getFixedLocalChatzos() fixed
   * local <em>chatzos</em>} for calculating this type of <em>zman</em>.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see ZmanimCalendar#getChatzos()
   * @see #getSofZmanShmaFixedLocal()
   * @see #getSofZmanTfila2HoursBeforeChatzos()
   */
  getSofZmanShma3HoursBeforeChatzos() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getChatzos(), -180 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based
   * on <em>alos</em> being {@link #getAlos120() 120} minutes or 1/6th of the day before {@link #getSunrise() sunrise}.
   * This time is 3 {@link #getShaahZmanis120Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos120()
   * dawn} based on the opinion of the MGA that the day is calculated from a {@link #getAlos120() dawn} of 120 minutes
   * before sunrise to {@link #getTzais120() nightfall} of 120 minutes after sunset. This returns the time of 3
   * {@link #getShaahZmanis120Minutes()} after {@link #getAlos120() dawn}. This is an extremely early <em>zman</em> that
   * is very much a <em>chumra</em>.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis120Minutes()
   * @see #getAlos120()
   */
  getSofZmanShmaMGA120Minutes() {
    return this.getSofZmanShma(this.getAlos120(), this.getTzais120());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite <em>Shema</em> in the morning) based
   * on the opinion that the day starts at {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ends at
   * {@link #getSeaLevelSunset() sea level sunset}. This is the opinion of the <a href=
   * "https://hebrewbooks.org/40357">\u05D7\u05D9\u05D3\u05D5\u05E9\u05D9
   * \u05D5\u05DB\u05DC\u05DC\u05D5\u05EA \u05D4\u05E8\u05D6\u05F4\u05D4</a> and the <a href=
   * "https://hebrewbooks.org/14799">\u05DE\u05E0\u05D5\u05E8\u05D4 \u05D4\u05D8\u05D4\u05D5\u05E8\u05D4</a> as
   * mentioned by Yisrael Vehazmanim <a href="https://hebrewbooks.org/pdfpager.aspx?req=9765&pgnum=81">vol 1, sec. 7,
   * ch. 3 no. 16</a>. Three <em>shaos zmaniyos</em> are calculated based on this day and added to {@link
   * #getAlos16Point1Degrees() <em>alos</em>} to reach this time. This time is 3 <em>shaos zmaniyos</em> (solar hours)
   * after {@link #getAlos16Point1Degrees() dawn} based on the opinion that the day is calculated from a {@link
   * #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} to {@link #getSeaLevelSunset() sea level sunset}.
   * <b>Note:</b> Based on this calculation <em>chatzos</em> will not be at midday.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em> based on this day. If the calculation can't
   *         be computed such as northern and southern locations even south of the Arctic Circle and north of the
   *         Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a null
   *         will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getAlos16Point1Degrees()
   * @see #getSeaLevelSunset()
   */
  getSofZmanShmaAlos16Point1ToSunset() {
    return this.getSofZmanShma(this.getAlos16Point1Degrees(), this.getElevationAdjustedSunset());
  }
  /**
   * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) based on the
   * opinion that the day starts at {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ends at
   * {@link #getTzaisGeonim7Point083Degrees() <em>tzais</em> 7.083&deg;}. 3 <em>shaos zmaniyos</em> are calculated
   * based on this day and added to {@link #getAlos16Point1Degrees() <em>alos</em>} to reach this time. This time is 3
   * <em>shaos zmaniyos</em> (temporal hours) after {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} based on
   * the opinion that the day is calculated from a {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} to
   * {@link #getTzaisGeonim7Point083Degrees() <em>tzais</em> 7.083&deg;}.
   * <b>Note: </b> Based on this calculation <em>chatzos</em> will not be at midday.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em> based on this calculation. If the
   *         calculation can't be computed such as northern and southern locations even south of the Arctic Circle and
   *         north of the Antarctic Circle where the sun may not reach low enough below the horizon for this
   *         calculation, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * @see #getAlos16Point1Degrees()
   * @see #getTzaisGeonim7Point083Degrees()
   */
  getSofZmanShmaAlos16Point1ToTzaisGeonim7Point083Degrees() {
    return this.getSofZmanShma(this.getAlos16Point1Degrees(), this.getTzaisGeonim7Point083Degrees());
  }
  /**
   * From the GRA in Kol Eliyahu on Berachos #173 that states that <em>zman krias shema</em> is calculated as half the
   * time from {@link #getSeaLevelSunrise() sea level sunrise} to {@link #getFixedLocalChatzos() fixed local chatzos}.
   * The GRA himself seems to contradict this when he stated that <em>zman krias shema</em> is 1/4 of the day from
   * sunrise to sunset. See <em>Sarah Lamoed</em> #25 in Yisroel Vehazmanim Vol. III page 1016.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em> based on this calculation. If the
   *         calculation can't be computed such as in the Arctic Circle where there is at least one day a year where
   *         the sun does not rise, and one where it does not set, a null will be returned. See detailed explanation
   *         on top of the {@link AstronomicalCalendar} documentation.
   * @see #getFixedLocalChatzos()
   * 
   * @deprecated As per a conversation Rabbi Yisroel Twerski had with Rabbi Harfenes, this <em>zman</em> published in
   *         the Yisrael Vehazmanim was based on a misunderstanding and should not be used. This deprecated method
   *         will be removed (likely in KosherJava v3.0) pending confirmation from Rabbi Harfenes.
   */
  getSofZmanShmaKolEliyahu() {
    const chatzos = this.getFixedLocalChatzos();
    if (chatzos === null || this.getSunrise() === null) {
      return null;
    }
    const diff = (chatzos.valueOf() - this.getElevationAdjustedSunrise().valueOf()) / 2;
    return _ComplexZmanimCalendar.getTimeOffset(chatzos, -diff);
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) according to the opinion
   * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos19Point8Degrees() 19.8&deg;} before {@link #getSunrise() sunrise}. This time
   * is 4 {@link #getShaahZmanis19Point8Degrees() <em>shaos zmaniyos</em>} (solar hours) after {@link
   * #getAlos19Point8Degrees() dawn} based on the opinion of the MGA that the day is calculated from dawn to
   * nightfall with both being 19.8&deg; below sunrise or sunset. This returns the time of 4 * {@link
   * #getShaahZmanis19Point8Degrees()} after {@link #getAlos19Point8Degrees() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis19Point8Degrees()
   * @see #getAlos19Point8Degrees()
   */
  getSofZmanTfilaMGA19Point8Degrees() {
    return this.getSofZmanTfila(this.getAlos19Point8Degrees(), this.getTzais19Point8Degrees());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) according to the opinion
   * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos16Point1Degrees() 16.1&deg;} before {@link #getSunrise() sunrise}. This time
   * is 4 {@link #getShaahZmanis16Point1Degrees() <em>shaos zmaniyos</em>} (solar hours) after {@link
   * #getAlos16Point1Degrees() dawn} based on the opinion of the MGA that the day is calculated from dawn to
   * nightfall with both being 16.1&deg; below sunrise or sunset. This returns the time of 4 * {@link
   * #getShaahZmanis16Point1Degrees()} after {@link #getAlos16Point1Degrees() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis16Point1Degrees()
   * @see #getAlos16Point1Degrees()
   */
  getSofZmanTfilaMGA16Point1Degrees() {
    return this.getSofZmanTfila(this.getAlos16Point1Degrees(), this.getTzais16Point1Degrees());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) according to the opinion
   * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos18Degrees() 18&deg;} before {@link #getSunrise() sunrise}. This time is 4
   * {@link #getShaahZmanis18Degrees() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos18Degrees() dawn}
   * based on the opinion of the MGA that the day is calculated from dawn to nightfall with both being 18&deg;
   * below sunrise or sunset. This returns the time of 4 * {@link #getShaahZmanis18Degrees()} after
   * {@link #getAlos18Degrees() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis18Degrees()
   * @see #getAlos18Degrees()
   */
  getSofZmanTfilaMGA18Degrees() {
    return this.getSofZmanTfila(this.getAlos18Degrees(), this.getTzais18Degrees());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) according to the opinion
   * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos72() 72} minutes before {@link #getSunrise() sunrise}. This time is 4
   * {@link #getShaahZmanis72Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos72() dawn} based on
   * the opinion of the MGA that the day is calculated from a {@link #getAlos72() dawn} of 72 minutes before
   * sunrise to {@link #getTzais72() nightfall} of 72 minutes after sunset. This returns the time of 4 *
   * {@link #getShaahZmanis72Minutes()} after {@link #getAlos72() dawn}. This class returns an identical time to
   * {@link #getSofZmanTfilaMGA()} and is repeated here for clarity.
   * 
   * @return the <code>Date</code> of the latest <em>zman tfila</em>. If the calculation can't be computed such as in
   *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis72Minutes()
   * @see #getAlos72()
   * @see #getSofZmanShmaMGA()
   */
  getSofZmanTfilaMGA72Minutes() {
    return this.getSofZmanTfilaMGA();
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to the morning prayers) according to the opinion of the
   * <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em>
   * being {@link #getAlos72Zmanis() 72} minutes <em>zmaniyos</em> before {@link #getSunrise() sunrise}. This time is 4
   * {@link #getShaahZmanis72MinutesZmanis() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos72Zmanis() dawn}
   * based on the opinion of the MGA that the day is calculated from a {@link #getAlos72Zmanis() dawn} of 72
   * minutes <em>zmaniyos</em> before sunrise to {@link #getTzais72Zmanis() nightfall} of 72 minutes <em>zmaniyos</em>
   * after sunset. This returns the time of 4 * {@link #getShaahZmanis72MinutesZmanis()} after {@link #getAlos72Zmanis() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis72MinutesZmanis()
   * @see #getAlos72Zmanis()
   */
  getSofZmanTfilaMGA72MinutesZmanis() {
    return this.getSofZmanTfila(this.getAlos72Zmanis(), this.getTzais72Zmanis());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) according to the opinion
   * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos90() 90} minutes before {@link #getSunrise() sunrise}. This time is 4
   * {@link #getShaahZmanis90Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos90() dawn} based on
   * the opinion of the MGA that the day is calculated from a {@link #getAlos90() dawn} of 90 minutes before sunrise to
   * {@link #getTzais90() nightfall} of 90 minutes after sunset. This returns the time of 4 *
   * {@link #getShaahZmanis90Minutes()} after {@link #getAlos90() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman tfila</em>. If the calculation can't be computed such as in
   *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis90Minutes()
   * @see #getAlos90()
   */
  getSofZmanTfilaMGA90Minutes() {
    return this.getSofZmanTfila(this.getAlos90(), this.getTzais90());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to the morning prayers) according to the opinion of the
   * <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em>
   * being {@link #getAlos90Zmanis() 90} minutes <em>zmaniyos</em> before {@link #getSunrise() sunrise}. This time is
   * 4 {@link #getShaahZmanis90MinutesZmanis() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos90Zmanis()
   * dawn} based on the opinion of the MGA that the day is calculated from a {@link #getAlos90Zmanis() dawn}
   * of 90 minutes <em>zmaniyos</em> before sunrise to {@link #getTzais90Zmanis() nightfall} of 90 minutes
   * <em>zmaniyos</em> after sunset. This returns the time of 4 * {@link #getShaahZmanis90MinutesZmanis()} after
   * {@link #getAlos90Zmanis() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis90MinutesZmanis()
   * @see #getAlos90Zmanis()
   */
  getSofZmanTfilaMGA90MinutesZmanis() {
    return this.getSofZmanTfila(this.getAlos90Zmanis(), this.getTzais90Zmanis());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) according to the opinion
   * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos96() 96} minutes before {@link #getSunrise() sunrise}. This time is 4
   * {@link #getShaahZmanis96Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos96() dawn} based on
   * the opinion of the MGA that the day is calculated from a {@link #getAlos96() dawn} of 96 minutes before
   * sunrise to {@link #getTzais96() nightfall} of 96 minutes after sunset. This returns the time of 4 *
   * {@link #getShaahZmanis96Minutes()} after {@link #getAlos96() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman tfila</em>. If the calculation can't be computed such as in
   *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis96Minutes()
   * @see #getAlos96()
   */
  getSofZmanTfilaMGA96Minutes() {
    return this.getSofZmanTfila(this.getAlos96(), this.getTzais96());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to the morning prayers) according to the opinion of the
   * <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em>
   * being {@link #getAlos96Zmanis() 96} minutes <em>zmaniyos</em> before {@link #getSunrise() sunrise}. This time is
   * 4 {@link #getShaahZmanis96MinutesZmanis() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos96Zmanis()
   * dawn} based on the opinion of the MGA that the day is calculated from a {@link #getAlos96Zmanis() dawn}
   * of 96 minutes <em>zmaniyos</em> before sunrise to {@link #getTzais96Zmanis() nightfall} of 96 minutes
   * <em>zmaniyos</em> after sunset. This returns the time of 4 * {@link #getShaahZmanis96MinutesZmanis()} after
   * {@link #getAlos96Zmanis() dawn}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis90MinutesZmanis()
   * @see #getAlos90Zmanis()
   */
  getSofZmanTfilaMGA96MinutesZmanis() {
    return this.getSofZmanTfila(this.getAlos96Zmanis(), this.getTzais96Zmanis());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) according to the opinion
   * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on
   * <em>alos</em> being {@link #getAlos120() 120} minutes before {@link #getSunrise() sunrise} . This time is 4
   * {@link #getShaahZmanis120Minutes() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos120() dawn}
   * based on the opinion of the MGA that the day is calculated from a {@link #getAlos120() dawn} of 120
   * minutes before sunrise to {@link #getTzais120() nightfall} of 120 minutes after sunset. This returns the time of
   * 4 * {@link #getShaahZmanis120Minutes()} after {@link #getAlos120() dawn}. This is an extremely early <em>zman</em>
   * that is very much a <em>chumra</em>.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis120Minutes()
   * @see #getAlos120()
   */
  getSofZmanTfilaMGA120Minutes() {
    return this.getSofZmanTfila(this.getAlos120(), this.getTzais120());
  }
  /**
   * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) calculated as 2 hours
   * before {@link ZmanimCalendar#getChatzos()}. This is based on the opinions that calculate
   * <em>sof zman krias shema</em> as {@link #getSofZmanShma3HoursBeforeChatzos()}. This returns the time of 2 hours
   * before {@link ZmanimCalendar#getChatzos()}.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where
   *         it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see ZmanimCalendar#getChatzos()
   * @see #getSofZmanShma3HoursBeforeChatzos()
   */
  getSofZmanTfila2HoursBeforeChatzos() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getChatzos(), -120 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method returns <em>mincha gedola</em> calculated as 30 minutes after {@link #getChatzos() <em>chatzos</em>}
   * and not 1/2 of a {@link #getShaahZmanisGra() <em>shaah zmanis</em>} after {@link #getChatzos() <em>chatzos</em>} as
   * calculated by {@link #getMinchaGedola}. Some use this time to delay the start of <em>mincha</em> in the winter when
   * 1/2 of a {@link #getShaahZmanisGra() <em>shaah zmanis</em>} is less than 30 minutes. See
   * {@link #getMinchaGedolaGreaterThan30()} for a convenience method that returns the later of the 2 calculations. One
   * should not use this time to start <em>mincha</em> before the standard {@link #getMinchaGedola() <em>mincha gedola</em>}.
   * See Shulchan Aruch <a href="https://hebrewbooks.org/pdfpager.aspx?req=49624&st=&pgnum=291">Orach Chayim 234:1</a> and
   * the Shaar Hatziyon <em>seif katan ches</em>.
   * 
   * @return the <code>Date</code> of 30 minutes after <em>chatzos</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getMinchaGedola()
   * @see #getMinchaGedolaGreaterThan30()
   */
  getMinchaGedola30Minutes() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getChatzos(), _ComplexZmanimCalendar.MINUTE_MILLIS * 30);
  }
  /**
   * This method returns the time of <em>mincha gedola</em> according to the Magen Avraham with the day starting 72
   * minutes before sunrise and ending 72 minutes after sunset. This is the earliest time to pray <em>mincha</em>. For
   * more information on this see the documentation on {@link #getMinchaGedola() <em>mincha gedola</em>}. This is
   * calculated as 6.5 {@link #getTemporalHour() solar hours} after <em>alos</em>. The calculation used is 6.5 *
   * {@link #getShaahZmanis72Minutes()} after {@link #getAlos72() <em>alos</em>}.
   * 
   * @see #getAlos72()
   * @see #getMinchaGedola()
   * @see #getMinchaKetana()
   * @see ZmanimCalendar#getMinchaGedola()
   * @return the <code>Date</code> of the time of <em>mincha gedola</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   */
  getMinchaGedola72Minutes() {
    return this.getMinchaGedola(this.getAlos72(), this.getTzais72());
  }
  /**
   * This method returns the time of <em>mincha gedola</em> according to the Magen Avraham with the day starting and
   * ending 16.1&deg; below the horizon. This is the earliest time to pray <em>mincha</em>. For more information on
   * this see the documentation on {@link #getMinchaGedola() <em>mincha gedola</em>}. This is calculated as 6.5
   * {@link #getTemporalHour() solar hours} after <em>alos</em>. The calculation used is 6.5 *
   * {@link #getShaahZmanis16Point1Degrees()} after {@link #getAlos16Point1Degrees() <em>alos</em>}.
   * 
   * @see #getShaahZmanis16Point1Degrees()
   * @see #getMinchaGedola()
   * @see #getMinchaKetana()
   * @return the <code>Date</code> of the time of <em>mincha gedola</em>. If the calculation can't be computed such as
   *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
   *         the sun  may not reach low enough below the horizon for this calculation, a null will be returned. See
   *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getMinchaGedola16Point1Degrees() {
    return this.getMinchaGedola(this.getAlos16Point1Degrees(), this.getTzais16Point1Degrees());
  }
  /**
  * This method returns the time of <em>mincha gedola</em> based on the opinion of <a href=
  * "https://en.wikipedia.org/wiki/Yaakov_Moshe_Hillel">Rabbi Yaakov Moshe Hillel</a> as published in the <em>luach</em>
  * of the Bais Horaah of Yeshivat Chevrat Ahavat Shalom that <em>mincha gedola</em> is calculated as half a <em>shaah
  * zmanis</em> after <em>chatzos</em> with <em>shaos zmaniyos</em> calculated based on a day starting 72 minutes befoe sunrise
  * {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ending 13.5 minutes after sunset {@link
   * #getTzaisGeonim3Point7Degrees() <em>tzais</em> 3.7&deg;}. <em>Mincha gedola</em> is the earliest time to pray <em>mincha</em>.
   * The later of this time or 30 clock minutes after <em>chatzos</em> is returned. See {@link #getMinchaGedolaGreaterThan30()}
   * (though that calculation is based on <em>mincha gedola</em> GRA).
   * For more information about <em>mincha gedola</em> see the documentation on {@link #getMinchaGedola() <em>mincha gedola</em>}.
   * 
   * @return the <code>Date</code> of the <em>mincha gedola</em>. If the calculation can't be computed such as northern and
   *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not
   *         reach low enough below the horizon for this calculation, a null will be returned. See detailed explanation
   *         on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getAlos16Point1Degrees()
   * @see #getTzaisGeonim3Point7Degrees()
   * @see #getShaahZmanisAlos16Point1ToTzais3Point7()
   * @see #getMinchaGedolaGreaterThan30()
   */
  getMinchaGedolaAhavatShalom() {
    if (!this.getMinchaGedola30Minutes() || !this.getMinchaGedola()) {
      return null;
    }
    return DateTime.max(this.getMinchaGedola30Minutes(), _ComplexZmanimCalendar.getTimeOffset(this.getChatzos(), this.getShaahZmanisAlos16Point1ToTzais3Point7() / 2));
  }
  /**
   * This is a convenience method that returns the later of {@link #getMinchaGedola()} and
   * {@link #getMinchaGedola30Minutes()}. In the winter when 1/2 of a {@link #getShaahZmanisGra() <em>shaah zmanis</em>} is
   * less than 30 minutes {@link #getMinchaGedola30Minutes()} will be returned, otherwise {@link #getMinchaGedola()}
   * will be returned.
   *
   * @return the <code>Date</code> of the later of {@link #getMinchaGedola()} and {@link #getMinchaGedola30Minutes()}.
   *         If the calculation can't be computed such as in the Arctic Circle where there is at least one day a year
   *         where the sun does not rise, and one where it does not set, a null will be returned. See detailed
   *         explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getMinchaGedolaGreaterThan30() {
    if (this.getMinchaGedola30Minutes() === null || this.getMinchaGedola() === null) {
      return null;
    }
    return DateTime.max(this.getMinchaGedola30Minutes(), this.getMinchaGedola());
  }
  /**
   * This method returns the time of <em>mincha ketana</em> according to the Magen Avraham with the day starting and
   * ending 16.1&deg; below the horizon. This is the preferred earliest time to pray <em>mincha</em> according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> and others. For more information on
   * this see the documentation on {@link #getMinchaGedola() <em>mincha gedola</em>}. This is calculated as 9.5
   * {@link #getTemporalHour() solar hours} after <em>alos</em>. The calculation used is 9.5 *
   * {@link #getShaahZmanis16Point1Degrees()} after {@link #getAlos16Point1Degrees() <em>alos</em>}.
   * 
   * @see #getShaahZmanis16Point1Degrees()
   * @see #getMinchaGedola()
   * @see #getMinchaKetana()
   * @return the <code>Date</code> of the time of <em>mincha ketana</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getMinchaKetana16Point1Degrees() {
    return this.getMinchaKetana(this.getAlos16Point1Degrees(), this.getTzais16Point1Degrees());
  }
  /**
  * This method returns the time of <em>mincha ketana</em> based on the opinion of <a href=
  * "https://en.wikipedia.org/wiki/Yaakov_Moshe_Hillel">Rabbi Yaakov Moshe Hillel</a> as published in the <em>luach</em>
  * of the Bais Horaah of Yeshivat Chevrat Ahavat Shalom that <em>mincha ketana</em> is calculated as 2.5 <em>shaos
  * zmaniyos</em> before {@link #getTzaisGeonim3Point8Degrees() <em>tzais</em> 3.8&deg;} with <em>shaos zmaniyos</em>
  * calculated based on a day starting at {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ending at
  * <em>tzais</em> 3.8&deg;. <em>Mincha ketana</em> is the preferred earliest time to pray <em>mincha</em> according to
  * the opinion of the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> and others. For more information
  * on this see the documentation on {@link #getMinchaKetana() <em>mincha ketana</em>}. 
  * 
  * @return the the <code>Date</code> of the time of <em>mincha ketana</em>. If the calculation can't be computed such as northern
  *         and southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not
  *         reach low enough below the horizon for this calculation, a null will be returned. See detailed explanation
  *         on top of the {@link AstronomicalCalendar} documentation.
  * 
  * @see #getShaahZmanisAlos16Point1ToTzais3Point8()
  * @see #getMinchaGedolaAhavatShalom()
  * @see #getPlagAhavatShalom()
  */
  getMinchaKetanaAhavatShalom() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getTzaisGeonim3Point8Degrees(), -this.getShaahZmanisAlos16Point1ToTzais3Point8() * 2.5);
  }
  /**
   * This method returns the time of <em>mincha ketana</em> according to the Magen Avraham with the day
   * starting 72 minutes before sunrise and ending 72 minutes after sunset. This is the preferred earliest time to pray
   * <em>mincha</em> according to the opinion of the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a>
   * and others. For more information on this see the documentation on {@link #getMinchaGedola() <em>mincha gedola</em>}.
   * This is calculated as 9.5 {@link #getShaahZmanis72Minutes()} after <em>alos</em>. The calculation used is 9.5 *
   * {@link #getShaahZmanis72Minutes()} after {@link #getAlos72() <em>alos</em>}.
   * 
   * @see #getShaahZmanis16Point1Degrees()
   * @see #getMinchaGedola()
   * @see #getMinchaKetana()
   * @return the <code>Date</code> of the time of <em>mincha ketana</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   */
  getMinchaKetana72Minutes() {
    return this.getMinchaKetana(this.getAlos72(), this.getTzais72());
  }
  /**
   * This method returns the time of <em>plag hamincha</em> according to the Magen Avraham with the day starting 60
   * minutes before sunrise and ending 60 minutes after sunset. This is calculated as 10.75 hours after
   * {@link #getAlos60() dawn}. The formula used is 10.75 {@link #getShaahZmanis60Minutes()} after {@link #getAlos60()}.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis60Minutes()
   * @see #getAlos60()
   * @see #getTzais60()
   */
  getPlagHamincha60Minutes() {
    return this.getPlagHamincha(this.getAlos60(), this.getTzais60());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> according to the
   * Magen Avraham with the day starting 72 minutes before sunrise and ending 72 minutes after sunset. This is calculated
   * as 10.75 hours after {@link #getAlos72() dawn}. The formula used is 10.75 {@link #getShaahZmanis72Minutes()} after
   * {@link #getAlos72()}. Since <em>plag</em> by this calculation can occur after sunset, it should only be used
   * <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis72Minutes()
   */
  getPlagHamincha72Minutes() {
    return this.getPlagHamincha(this.getAlos72(), this.getTzais72());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> according to the
   * Magen Avraham with the day starting 90 minutes before sunrise and ending 90 minutes after sunset. This is calculated
   * as 10.75 hours after {@link #getAlos90() dawn}. The formula used is 10.75 {@link #getShaahZmanis90Minutes()} after
   * {@link #getAlos90()}. Since <em>plag</em> by this calculation can occur after sunset, it should only be used
   * <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis90Minutes()
   */
  getPlagHamincha90Minutes() {
    return this.getPlagHamincha(this.getAlos90(), this.getTzais90());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> according to the Magen
   * Avraham with the day starting 96 minutes before sunrise and ending 96 minutes after sunset. This is calculated as 10.75
   * hours after {@link #getAlos96() dawn}. The formula used is 10.75 {@link #getShaahZmanis96Minutes()} after
   * {@link #getAlos96()}. Since <em>plag</em> by this calculation can occur after sunset, it should only be used
   * <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * @see #getShaahZmanis96Minutes()
   */
  getPlagHamincha96Minutes() {
    return this.getPlagHamincha(this.getAlos96(), this.getTzais96());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em>. This is calculated
   * as 10.75 hours after {@link #getAlos96Zmanis() dawn}. The formula used is 10.75 * {@link
   * #getShaahZmanis96MinutesZmanis()} after {@link #getAlos96Zmanis() dawn}. Since <em>plag</em> by this calculation can
   * occur after sunset, it should only be used <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getPlagHamincha96MinutesZmanis() {
    return this.getPlagHamincha(this.getAlos96Zmanis(), this.getTzais96Zmanis());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em>. This is calculated
   * as 10.75 hours after {@link #getAlos90Zmanis() dawn}. The formula used is 10.75 * {@link
   * #getShaahZmanis90MinutesZmanis()} after {@link #getAlos90Zmanis() dawn}. Since <em>plag</em> by this calculation can
   * occur after sunset, it should only be used <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getPlagHamincha90MinutesZmanis() {
    return this.getPlagHamincha(this.getAlos90Zmanis(), this.getTzais90Zmanis());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em>. This is calculated as
   * 10.75 hours after {@link #getAlos72Zmanis()}. The formula used is 10.75 * {@link #getShaahZmanis72MinutesZmanis()} after
   * {@link #getAlos72Zmanis() dawn}. Since <em>plag</em> by this calculation can occur after sunset, it should only be used
   * <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getPlagHamincha72MinutesZmanis() {
    return this.getPlagHamincha(this.getAlos72Zmanis(), this.getTzais72Zmanis());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> based on the
   * opinion that the day starts at {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ends at {@link
    * #getTzais16Point1Degrees() <em>tzais</em> 16.1&deg;}. This is calculated as 10.75 hours <em>zmaniyos</em>
    * after {@link #getAlos16Point1Degrees() dawn}. The formula used is 10.75 * {@link #getShaahZmanis16Point1Degrees()}
    * after {@link #getAlos16Point1Degrees()}. Since <em>plag</em> by this calculation can occur after sunset, it
    * should only be used <em>lechumra</em>.
    * 
    * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
    *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
    *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
    * 
    * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
    *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
    *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
    *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
    * 
    * @see #getShaahZmanis16Point1Degrees()
    */
  getPlagHamincha16Point1Degrees() {
    return this.getPlagHamincha(this.getAlos16Point1Degrees(), this.getTzais16Point1Degrees());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> based on the
   * opinion that the day starts at {@link #getAlos19Point8Degrees() <em>alos</em> 19.8&deg;} and ends at {@link
    * #getTzais19Point8Degrees() <em>tzais</em> 19.8&deg;}. This is calculated as 10.75 hours <em>zmaniyos</em>
    * after {@link #getAlos19Point8Degrees() dawn}. The formula used is 10.75 * {@link
    * #getShaahZmanis19Point8Degrees()} after {@link #getAlos19Point8Degrees()}. Since <em>plag</em> by this
    * calculation can occur after sunset, it should only be used <em>lechumra</em>.
    * 
    * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
    *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
    *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
    * 
    * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
    *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
    *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
    *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
    * 
    * @see #getShaahZmanis19Point8Degrees()
    */
  getPlagHamincha19Point8Degrees() {
    return this.getPlagHamincha(this.getAlos19Point8Degrees(), this.getTzais19Point8Degrees());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> based on the
   * opinion that the day starts at {@link #getAlos26Degrees() <em>alos</em> 26&deg;} and ends at {@link
    * #getTzais26Degrees() <em>tzais</em> 26&deg;}. This is calculated as 10.75 hours <em>zmaniyos</em> after {@link
    * #getAlos26Degrees() dawn}. The formula used is 10.75 * {@link #getShaahZmanis26Degrees()} after {@link
    * #getAlos26Degrees()}. Since the <em>zman</em> based on an extremely early <em>alos</em> and a very late
    * <em>tzais</em>, it should only be used <em>lechumra</em>.
    * 
    * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
    *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
    *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
    * 
    * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
    *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
    *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
    *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
    * 
    * @see #getShaahZmanis26Degrees()
    * @see #getPlagHamincha120Minutes()
    */
  getPlagHamincha26Degrees() {
    return this.getPlagHamincha(this.getAlos26Degrees(), this.getTzais26Degrees());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> based on the
   * opinion that the day starts at {@link #getAlos18Degrees() <em>alos</em> 18&deg;} and ends at {@link
   * #getTzais18Degrees() <em>tzais</em> 18&deg;}. This is calculated as 10.75 hours <em>zmaniyos</em> after {@link
   * #getAlos18Degrees() dawn}. The formula used is 10.75 * {@link #getShaahZmanis18Degrees()} after {@link
   * #getAlos18Degrees()}. Since <em>plag</em> by this calculation can occur after sunset, it should only be used
   * <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
   *         northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
   *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
   *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getShaahZmanis18Degrees()
   */
  getPlagHamincha18Degrees() {
    return this.getPlagHamincha(this.getAlos18Degrees(), this.getTzais18Degrees());
  }
  /**
   * This method should be used <em>lechumra</em> only and returns the time of <em>plag hamincha</em> based on the opinion
   * that the day starts at {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ends at {@link #getSunset() sunset}.
   * 10.75 <em>shaos zmaniyos</em> are calculated based on this day and added to {@link #getAlos16Point1Degrees()
   * <em>alos</em>} to reach this time. This time is 10.75 <em>shaos zmaniyos</em> (temporal hours) after {@link
   * #getAlos16Point1Degrees() dawn} based on the opinion that the day is calculated from a {@link #getAlos16Point1Degrees()
   * dawn} of 16.1 degrees before sunrise to {@link #getSeaLevelSunset() sea level sunset}. This returns the time of 10.75 *
   * the calculated <em>shaah zmanis</em> after {@link #getAlos16Point1Degrees() dawn}. Since <em>plag</em> by this
   * calculation can occur after sunset, it should only be used <em>lechumra</em>.
   * 
   * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
   *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
   *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
   * 
   * @return the <code>Date</code> of the <em>plag</em>. If the calculation can't be computed such as northern and southern
   *         locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not reach
   *         low enough below the horizon for this calculation, a null will be returned. See detailed explanation on
   *         top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getAlos16Point1Degrees()
   * @see #getSeaLevelSunset()
   */
  getPlagAlosToSunset() {
    return this.getPlagHamincha(this.getAlos16Point1Degrees(), this.getElevationAdjustedSunset());
  }
  /**
   * This method returns the time of <em>plag hamincha</em> based on the opinion that the day starts at
   * {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and ends at {@link #getTzaisGeonim7Point083Degrees()
   * <em>tzais</em>}. 10.75 <em>shaos zmaniyos</em> are calculated based on this day and added to {@link
   * #getAlos16Point1Degrees() <em>alos</em>} to reach this time. This time is 10.75 <em>shaos zmaniyos</em> (temporal
   * hours) after {@link #getAlos16Point1Degrees() dawn} based on the opinion that the day is calculated from a
   * {@link #getAlos16Point1Degrees() dawn} of 16.1 degrees before sunrise to
   * {@link #getTzaisGeonim7Point083Degrees() <em>tzais</em>} . This returns the time of 10.75 * the calculated
   * <em>shaah zmanis</em> after {@link #getAlos16Point1Degrees() dawn}.
   * 
   * @return the <code>Date</code> of the <em>plag</em>. If the calculation can't be computed such as northern and
   *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not
   *         reach low enough below the horizon for this calculation, a null will be returned. See detailed explanation
   *         on top of the {@link AstronomicalCalendar} documentation.
   * 
   * @see #getAlos16Point1Degrees()
   * @see #getTzaisGeonim7Point083Degrees()
   */
  getPlagAlos16Point1ToTzaisGeonim7Point083Degrees() {
    return this.getPlagHamincha(this.getAlos16Point1Degrees(), this.getTzaisGeonim7Point083Degrees());
  }
  /**
  * This method returns the time of <em>plag hamincha</em> (the earliest time that Shabbos can be started) based on the
  * opinion of <a href="https://en.wikipedia.org/wiki/Yaakov_Moshe_Hillel">Rabbi Yaakov Moshe Hillel</a> as published in
  * the <em>luach</em> of the Bais Horaah of Yeshivat Chevrat Ahavat Shalom that that <em>plag hamincha</em> is calculated
  * as 1.25 <em>shaos zmaniyos</em> before {@link #getTzaisGeonim3Point8Degrees() <em>tzais</em> 3.8&deg;} with <em>shaos
  * zmaniyos</em> calculated based on a day starting at {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;} and
  * ending at <em>tzais</em> 3.8&deg;.
  * 
  * @return the <code>Date</code> of the <em>plag</em>. If the calculation can't be computed such as northern and
  *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not
  *         reach low enough below the horizon for this calculation, a null will be returned. See detailed explanation
  *         on top of the {@link AstronomicalCalendar} documentation.
  * 
  * @see #getShaahZmanisAlos16Point1ToTzais3Point8()
  * @see #getMinchaGedolaAhavatShalom()
  * @see #getMinchaKetanaAhavatShalom()
  */
  getPlagAhavatShalom() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getTzaisGeonim3Point8Degrees(), -this.getShaahZmanisAlos16Point1ToTzais3Point8() * 1.25);
  }
  /**
   * Method to return the beginning of <em>bain hashmashos</em> of Rabbeinu Tam calculated when the sun is
   * {@link #ZENITH_13_POINT_24 13.24&deg;} below the western {@link #GEOMETRIC_ZENITH geometric horizon} (90&deg;)
   * after sunset. This calculation is based on the same calculation of {@link #getBainHashmashosRT58Point5Minutes()
   * <em>bain hashmashos</em> Rabbeinu Tam 58.5 minutes} but uses a degree-based calculation instead of 58.5 exact
   * minutes. This calculation is based on the position of the sun 58.5 minutes after sunset in Jerusalem <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>,
   * which calculates to 13.24&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
   * NOTE: As per Yisrael Vehazmanim Vol. III page 1028, No. 50, a dip of slightly less than 13&deg; should be used.
   * Calculations show that the proper dip to be 13.2456&deg; (truncated to 13.24 that provides about 1.5 second
   * earlier (<em>lechumra</em>) time) below the horizon at that time. This makes a difference of 1 minute and 10
   * seconds in Jerusalem during the Equinox, and 1 minute 29 seconds during the solstice as compared to the proper
   * 13.24&deg; versus 13&deg;. For NY during the solstice, the difference is 1 minute 56 seconds.
   * @todo recalculate the above based on equilux/equinox calculations.
   * 
   * @return the <code>Date</code> of the sun being 13.24&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}
   *         (90&deg;). If the calculation can't be computed such as northern and southern locations even south of the
   *         Arctic Circle and north of the Antarctic Circle where the sun may not reach low enough below the horizon
   *         for this calculation, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #ZENITH_13_POINT_24
   * @see #getBainHashmashosRT58Point5Minutes()
   */
  getBainHashmashosRT13Point24Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_13_POINT_24);
  }
  /**
   * This method returns the beginning of <em>Bain hashmashos</em> of Rabbeinu Tam calculated as a 58.5
   * minute offset after sunset. <em>bain hashmashos</em> is 3/4 of a <em>Mil</em> before <em>tzais</em> or 3 1/4
   * <em>Mil</em> after sunset. With a <em>Mil</em> calculated as 18 minutes, 3.25 * 18 = 58.5 minutes.
   * 
   * @return the <code>Date</code> of 58.5 minutes after sunset. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * 
   */
  getBainHashmashosRT58Point5Minutes() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), 58.5 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> based on the calculation of 13.5 minutes (3/4 of an
   * 18-minute <em>Mil</em>) before <em>shkiah</em> calculated as {@link #getTzaisGeonim7Point083Degrees() 7.083&deg;}.
   * 
   * @return the <code>Date</code> of the <em>bain hashmashos</em> of Rabbeinu Tam in this calculation. If the
   *         calculation can't be computed such as northern and southern locations even south of the Arctic Circle and
   *         north of the Antarctic Circle where the sun may not reach low enough below the horizon for this
   *         calculation, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * @see #getTzaisGeonim7Point083Degrees()
   */
  getBainHashmashosRT13Point5MinutesBefore7Point083Degrees() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_7_POINT_083), -13.5 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> of Rabbeinu Tam calculated according to the
   * opinion of the <em>Divrei Yosef</em> (see Yisrael Vehazmanim) calculated 5/18th (27.77%) of the time between
   * <em>alos</em> (calculated as 19.8&deg; before sunrise) and sunrise. This is added to sunset to arrive at the time
   * for <em>bain hashmashos</em> of Rabbeinu Tam.
   * 
   * @return the <code>Date</code> of <em>bain hashmashos</em> of Rabbeinu Tam for this calculation. If the
   *         calculation can't be computed such as northern and southern locations even south of the Arctic Circle and
   *         north of the Antarctic Circle where the sun may not reach low enough below the horizon for this
   *         calculation, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   */
  getBainHashmashosRT2Stars() {
    const alos19Point8 = this.getAlos19Point8Degrees();
    const sunrise = this.getElevationAdjustedSunrise();
    if (alos19Point8 === null || sunrise === null) {
      return null;
    }
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), (sunrise.valueOf() - alos19Point8.valueOf()) * (5 / 18));
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> (twilight) according to the <a href=
   * "https://en.wikipedia.org/wiki/Eliezer_ben_Samuel">Yereim (Rabbi Eliezer of Metz)</a> calculated as 18 minutes
   * or 3/4 of a 24-minute <em>Mil</em> before sunset. According to the Yereim, <em>bain hashmashos</em> starts 3/4
   * of a <em>Mil</em> before sunset and <em>tzais</em> or nightfall starts at sunset. 
   * 
   * @return the <code>Date</code> of 18 minutes before sunset. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * @see #getBainHashmashosYereim3Point05Degrees()
   */
  getBainHashmashosYereim18Minutes() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), -18 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> (twilight) according to the <a href=
   * "https://en.wikipedia.org/wiki/Eliezer_ben_Samuel">Yereim (Rabbi Eliezer of Metz)</a> calculated as the sun's
   * position 3.05&deg; above the horizon <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>,
   * its position 18 minutes or 3/4 of an 24-minute <em>mil</em> before sunset. According to the Yereim, <em>bain
   * hashmashos</em> starts 3/4 of a <em>Mil</em> before sunset and <em>tzais</em> or nightfall starts at sunset.
   * Note that <em>lechumra</em> (of about 14 seconds) a refraction value of 0.5166&deg; as opposed to the traditional
   * 0.566&deg; is used. This is more inline with the actual refraction in <em>Eretz Yisrael</em> and is brought down
   * by <a href=
   * "http://beinenu.com/rabbis/%D7%94%D7%A8%D7%91-%D7%99%D7%93%D7%99%D7%93%D7%99%D7%94-%D7%9E%D7%A0%D7%AA">Rabbi
   * Yedidya Manet</a> in his <a href="https://www.nli.org.il/en/books/NNL_ALEPH002542826/NLI">Zmanei Halacha
   * Lema’aseh</a> (p. 11). That is the first source that I am aware of that calculates degree-based Yereim
   * <em>zmanim</em>. The 0.5166&deg; refraction is also used by the <a href="https://zmanim.online/">Luach Itim
   * Lebinah</a>. Calculating the Yereim's <em>bain hashmashos</em> using 18-minute based degrees is also suggested
   * in the upcoming 8th edition of the zmanim Kehilchasam. For more details, see the article <a href=
   * "https://kosherjava.com/2020/12/07/the-yereims-bein-hashmashos/">The Yereim’s <em>Bein Hashmashos</em></a>.
   * 
   * @todo recalculate based on equinox/equilux
   * @return the <code>Date</code> of the sun's position 3.05&deg; minutes before sunset. If the calculation can't
   *         be computed such as in the Arctic Circle where there is at least one day a year where the sun does not
   *         rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #ZENITH_MINUS_3_POINT_05
   * @see #getBainHashmashosYereim18Minutes()
   * @see #getBainHashmashosYereim2Point8Degrees()
   * @see #getBainHashmashosYereim2Point1Degrees()
   */
  getBainHashmashosYereim3Point05Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_MINUS_3_POINT_05);
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> (twilight) according to the <a href=
   * "https://en.wikipedia.org/wiki/Eliezer_ben_Samuel">Yereim (Rabbi Eliezer of Metz)</a> calculated as 16.875
   * minutes or 3/4 of a 22.5-minute <em>Mil</em> before sunset. According to the Yereim, <em>bain hashmashos</em>
   * starts 3/4 of a <em>Mil</em> before sunset and <em>tzais</em> or nightfall starts at sunset. 
   * 
   * @return the <code>Date</code> of 16.875 minutes before sunset. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * 
   * @see #getBainHashmashosYereim2Point8Degrees()
   */
  getBainHashmashosYereim16Point875Minutes() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), -16.875 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> (twilight) according to the <a href=
   * "https://en.wikipedia.org/wiki/Eliezer_ben_Samuel">Yereim (Rabbi Eliezer of Metz)</a> calculated as the sun's
   * position 2.8&deg; above the horizon <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>,
   * its position 16.875 minutes or 3/4 of an 18-minute <em>Mil</em> before sunset. According to the Yereim, <em>bain
   * hashmashos</em> starts 3/4 of a <em>Mil</em> before sunset and <em>tzais</em> or nightfall starts at sunset.
   * Details, including how the degrees were calculated can be seen in the documentation of
   * {@link #getBainHashmashosYereim3Point05Degrees()}.
   * 
   * @return the <code>Date</code> of the sun's position 2.8&deg; minutes before sunset. If the calculation can't
   *         be computed such as in the Arctic Circle where there is at least one day a year where the sun does not
   *         rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #ZENITH_MINUS_2_POINT_8
   * @see #getBainHashmashosYereim16Point875Minutes()
   * @see #getBainHashmashosYereim3Point05Degrees()
   * @see #getBainHashmashosYereim2Point1Degrees()
   */
  getBainHashmashosYereim2Point8Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_MINUS_2_POINT_8);
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> (twilight) according to the <a href=
   * "https://en.wikipedia.org/wiki/Eliezer_ben_Samuel">Yereim (Rabbi Eliezer of Metz)</a> calculated as 13.5 minutes
   * or 3/4 of an 18-minute <em>Mil</em> before sunset. According to the Yereim, <em>bain hashmashos</em> starts 3/4 of
   * a <em>Mil</em> before sunset and <em>tzais</em> or nightfall starts at sunset.
   * 
   * @return the <code>Date</code> of 13.5 minutes before sunset. If the calculation can't be computed such as in the
   *         Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
   *         not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * 
   * @see #getBainHashmashosYereim2Point1Degrees()
   */
  getBainHashmashosYereim13Point5Minutes() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), -13.5 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * This method returns the beginning of <em>bain hashmashos</em> according to the <a href=
   * "https://en.wikipedia.org/wiki/Eliezer_ben_Samuel">Yereim (Rabbi Eliezer of Metz)</a> calculated as the sun's
   * position 2.1&deg; above the horizon <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> in
   * Yerushalayim, its position 13.5 minutes or 3/4 of an 18-minute <em>Mil</em> before sunset. According to the Yereim,
   * <em>bain hashmashos</em> starts 3/4 of a <em>mil</em> before sunset and <em>tzais</em> or nightfall starts at sunset.
   * Details, including how the degrees were calculated can be seen in the documentation of
   * {@link #getBainHashmashosYereim3Point05Degrees()}.
   * 
   * @return the <code>Date</code> of the sun's position 2.1&deg; minutes before sunset. If the calculation can't
   *         be computed such as in the Arctic Circle where there is at least one day a year where the sun does not
   *         rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   * 
   * @see #ZENITH_MINUS_2_POINT_1
   * @see #getBainHashmashosYereim13Point5Minutes()
   * @see #getBainHashmashosYereim2Point8Degrees()
   * @see #getBainHashmashosYereim3Point05Degrees()
   */
  getBainHashmashosYereim2Point1Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_MINUS_2_POINT_1);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated at the
   * sun's position at {@link #ZENITH_3_POINT_7 3.7&deg;} below the western horizon.
   * 
   * @return the <code>Date</code> representing the time when the sun is 3.7&deg; below sea level.
   * @see #ZENITH_3_POINT_7
   */
  getTzaisGeonim3Point7Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_3_POINT_7);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated at the
   * sun's position at {@link #ZENITH_3_POINT_8 3.8&deg;} below the western horizon.
   * 
   * @return the <code>Date</code> representing the time when the sun is 3.8&deg; below sea level.
   * @see #ZENITH_3_POINT_8
   */
  getTzaisGeonim3Point8Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_3_POINT_8);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated at the
   * sun's position at {@link #ZENITH_5_POINT_95 5.95&deg;} below the western horizon.
   * 
   * @return the <code>Date</code> representing the time when the sun is 5.95&deg; below sea level. If the calculation
   *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
   *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
   *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_5_POINT_95
   */
  getTzaisGeonim5Point95Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_5_POINT_95);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 3/4
   * of a <a href= "https://en.wikipedia.org/wiki/Biblical_and_Talmudic_units_of_measurement" >Mil</a> based on an 18
   * minute Mil, or 13.5 minutes. It is the sun's position at {@link #ZENITH_3_POINT_65 3.65&deg;} below the western
   * horizon. This is a very early <em>zman</em> and should not be relied on without Rabbinical guidance.
   * 
   * @return the <code>Date</code> representing the time when the sun is 3.65&deg; below sea level. If the calculation
   *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
   *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
   *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_3_POINT_65
   */
  getTzaisGeonim3Point65Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_3_POINT_65);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 3/4
   * of a <a href= "https://en.wikipedia.org/wiki/Biblical_and_Talmudic_units_of_measurement" >Mil</a> based on an 18
   * minute Mil, or 13.5 minutes. It is the sun's position at {@link #ZENITH_3_POINT_676 3.676&deg;} below the western
   * horizon based on the calculations of Stanley Fishkind. This is a very early <em>zman</em> and should not be
   * relied on without Rabbinical guidance.
   * 
   * @return the <code>Date</code> representing the time when the sun is 3.676&deg; below sea level. If the
   *         calculation can't be computed such as northern and southern locations even south of the Arctic Circle and
   *         north of the Antarctic Circle where the sun may not reach low enough below the horizon for this
   *         calculation, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * @see #ZENITH_3_POINT_676
   */
  getTzaisGeonim3Point676Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_3_POINT_676);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 3/4
   * of a <em><a href= "https://en.wikipedia.org/wiki/Biblical_and_Talmudic_units_of_measurement" >mil</a></em> based
   * on a 24-minute Mil, or 18 minutes. It is the sun's position at {@link #ZENITH_4_POINT_61 4.61&deg;} below the
   * western horizon. This is a very early <em>zman</em> and should not be relied on without Rabbinical guidance.
   * 
   * @return the <code>Date</code> representing the time when the sun is 4.61&deg; below sea level. If the calculation
   *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
   *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
   *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_4_POINT_61
   */
  getTzaisGeonim4Point61Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_4_POINT_61);
  }
  /**
  * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 3/4
  * of a <a href= "https://en.wikipedia.org/wiki/Biblical_and_Talmudic_units_of_measurement" >Mil</a>, based on a 22.5
  * minute Mil, or 16 7/8 minutes. It is the sun's position at {@link #ZENITH_4_POINT_37 4.37&deg;} below the western
  * horizon. This is a very early <em>zman</em> and should not be relied on without Rabbinical guidance.
  * 
  * @return the <code>Date</code> representing the time when the sun is 4.37&deg; below sea level. If the calculation
  *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
  *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
  *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #ZENITH_4_POINT_37
  */
  getTzaisGeonim4Point37Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_4_POINT_37);
  }
  /**
  * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 3/4
  * of a 24-minute <em><a href= "https://en.wikipedia.org/wiki/Biblical_and_Talmudic_units_of_measurement" >Mil</a></em>,
  * based on a <em>Mil</em> being 24 minutes, and is calculated as 18 + 2 + 4 for a total of 24 minutes. It is the
  * sun's position at {@link #ZENITH_5_POINT_88 5.88&deg;} below the western horizon. This is a very early
  * <em>zman</em> and should not be relied on without Rabbinical guidance.
  * 
  * @todo Additional detailed documentation needed.
  * @return the <code>Date</code> representing the time when the sun is 5.88&deg; below sea level. If the calculation
  *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
  *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
  *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #ZENITH_5_POINT_88
  */
  getTzaisGeonim5Point88Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_5_POINT_88);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 3/4
   * of a <a href= "https://en.wikipedia.org/wiki/Biblical_and_Talmudic_units_of_measurement" >Mil</a> based on the
   * sun's position at {@link #ZENITH_4_POINT_8 4.8&deg;} below the western horizon. This is based on Rabbi Leo Levi's
   * calculations. This is the This is a very early <em>zman</em> and should not be relied on without Rabbinical guidance.
   * @todo Additional documentation needed.
   * 
   * @return the <code>Date</code> representing the time when the sun is 4.8&deg; below sea level. If the calculation
   *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
   *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
   *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_4_POINT_8
   */
  getTzaisGeonim4Point8Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_4_POINT_8);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> as calculated by
   * <a href="https://en.wikipedia.org/wiki/Yechiel_Michel_Tucazinsky">Rabbi Yechiel Michel Tucazinsky</a>. It is
   * based on of the position of the sun no later than {@link #getTzaisGeonim6Point45Degrees() 31 minutes} after sunset
   * in Jerusalem the height of the summer solstice and is 28 minutes after <em>shkiah</em> <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>. This
   * computes to 6.45&deg; below the western horizon.
   * @todo Additional documentation details needed.
   * 
   * @return the <code>Date</code> representing the time when the sun is 6.45&deg; below sea level. If the
   *         calculation can't be computed such as northern and southern locations even south of the Arctic Circle and
   *         north of the Antarctic Circle where the sun may not reach low enough below the horizon for this
   *         calculation, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * @see #ZENITH_6_POINT_45
   */
  getTzaisGeonim6Point45Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_6_POINT_45);
  }
  /**
  * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated when the
  * sun's position {@link #ZENITH_7_POINT_083 7.083&deg; (or 7&deg; 5\u2032}) below the western horizon. This is often
  * referred to as 7&deg;5' or 7&deg; and 5 minutes. This calculation is based on the observation of 3 medium sized
  * stars by Dr. Baruch (Berthold) Cohn in his <em>luach</em> <a href=
  * "https://sammlungen.ub.uni-frankfurt.de/freimann/content/titleinfo/983088">Tabellen enthaltend die Zeitangaben für
  * den Beginn der Nacht und des Tages für die Breitengrade + 66 bis -38</a> published in Strasbourg, France in 1899.
  * This calendar was very popular in Europe, and many other calendars based their time on it. <a href=
  * "https://en.wikipedia.org/wiki/David_Zvi_Hoffmann">Rav Dovid Tzvi Hoffman</a> in his
  * <a href="https://hebrewbooks.org/1053">Sh"Ut Melamed Leho'il</a> in an exchange of letters with Baruch Cohn in <a href=
  * "https://hebrewbooks.org/pdfpager.aspx?req=1053&st=&pgnum=37">Orach Chaim 30</a> agreed to this <em>zman</em> (page 36),
  * as did the Sh"Ut Bnei Tziyon and the Tenuvas Sadeh. It is very close to the time of the <a href=
  * "https://hebrewbooks.org/22044">Mekor Chesed</a> of the Sefer chasidim. It is close to the position of the sun 30 minutes
  * after sunset in Jerusalem <a href=
  * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, but not
  * Exactly. The actual position of the sun 30 minutes after sunset in Jerusalem at the equilux is 7.205&deg; and 7.199&deg;
  * at the equinox. See Hazmanim Bahalacha vol 2, pages 520-521 for more details.
  * 
  * @return the <code>Date</code> representing the time when the sun is 7.083&deg; below sea level. If the
  *         calculation can't be computed such as northern and southern locations even south of the Arctic Circle and
  *         north of the Antarctic Circle where the sun may not reach low enough below the horizon for this
  *         calculation, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #ZENITH_7_POINT_083
  */
  getTzaisGeonim7Point083Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_7_POINT_083);
  }
  /**
  * This method returns <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 45 minutes
  * after sunset during the summer solstice in New York, when the <em>neshef</em> (twilight) is the longest. The sun's
  * position at this time computes to {@link #ZENITH_7_POINT_67 7.75&deg;} below the western horizon. See <a href=
  * "https://hebrewbooks.org/pdfpager.aspx?req=921&pgnum=149">Igros Moshe Even Haezer 4, Ch. 4</a> (regarding
  * <em>tzais</em> for <em>krias Shema</em>). It is also mentioned in Rabbi Heber's <a href=
  * "https://hebrewbooks.org/53000">Shaarei Zmanim</a> on in
  * <a href="https://hebrewbooks.org/pdfpager.aspx?req=53055&pgnum=101">chapter 10 (page 87)</a> and
  * <a href="https://hebrewbooks.org/pdfpager.aspx?req=53055&pgnum=122">chapter 12 (page 108)</a>. Also see the
  * time of 45 minutes in <a href="https://en.wikipedia.org/wiki/Simcha_Bunim_Cohen">Rabbi Simcha Bunim Cohen's</a> <a
  * href="https://www.worldcat.org/oclc/179728985">The radiance of Shabbos</a> as the earliest <em>zman</em> for New York.
  * This <em>zman</em> is also listed in the <a href="https://hebrewbooks.org/pdfpager.aspx?req=1927&pgnum=90">Divrei
  * Shalom Vol. III, chapter 75</a>, and <a href="https://hebrewbooks.org/pdfpager.aspx?req=892&pgnum=431">Bais Av"i
  * Vol. III, chapter 117</a>. This <em>zman</em> is also listed in the Divrei Shalom etc. chapter 177 (FIXME - could not
  * be located). Since this <em>zman</em> depends on the level of light, Rabbi Yaakov Shakow presented this degree-based
  * calculation to Rabbi <a href="https://en.wikipedia.org/wiki/Shmuel_Kamenetsky">Rabbi Shmuel Kamenetsky</a> who agreed
  * to it.
  * @todo add hyperlinks to source of Divrei Shalom.
  * @return the <code>Date</code> representing the time when the sun is 7.67&deg; below sea level. If the
  *         calculation can't be computed such as northern and southern locations even south of the Arctic Circle and
  *         north of the Antarctic Circle where the sun may not reach low enough below the horizon for this
  *         calculation, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #ZENITH_7_POINT_67
  */
  getTzaisGeonim7Point67Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_7_POINT_67);
  }
  /**
  * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated at the
  * sun's position at {@link #ZENITH_8_POINT_5 8.5&deg;} below the western horizon.
  * 
  * @return the <code>Date</code> representing the time when the sun is 8.5&deg; below sea level. If the calculation
  *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
  *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
  *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #ZENITH_8_POINT_5
  */
  getTzaisGeonim8Point5Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_8_POINT_5);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the calculations used in the <a href=
   * "https://www.worldcat.org/oclc/243303103">Luach Itim Lebinah</a> as the stringent time for <em>tzais</em>.  It is
   * calculated at the sun's position at {@link #ZENITH_9_POINT_3 9.3&deg;} below the western horizon.
   * 
   * @return the <code>Date</code> representing the time when the sun is 9.3&deg; below sea level. If the calculation
   *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
   *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
   *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getTzaisGeonim9Point3Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_9_POINT_3);
  }
  /**
   * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> calculated as 60
   * minutes after sunset <a href=
   * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, the
   * day that a solar hour is 60 minutes in New York. The sun's position at this time computes to
   * {@link #ZENITH_9_POINT_75 9.75&deg;} below the western horizon. This is the opinion of <a href=
   * "https://en.wikipedia.org/wiki/Yosef_Eliyahu_Henkin">Rabbi Eliyahu Henkin</a>.  This also follows the opinion of
   * <a href="https://en.wikipedia.org/wiki/Shmuel_Kamenetsky">Rabbi Shmuel Kamenetsky</a>. Rabbi Yaakov Shakow presented
   * these degree-based times to Rabbi Shmuel Kamenetsky who agreed to them.
   * 
   * @todo recalculate based on equinox / equilux.
   * @return the <code>Date</code> representing the time when the sun is 9.75&deg; below sea level. If the calculation
   *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of
   *         the Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a
   *         null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   *
   * @see #getTzais60()
   */
  getTzaisGeonim9Point75Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_9_POINT_75);
  }
  /**
  * This method returns the <em>tzais</em> (nightfall) based on the opinion of the <a href=
  * "https://en.wikipedia.org/wiki/Yair_Bacharach">Chavas Yair</a> and <a href=
  * "https://he.wikipedia.org/wiki/%D7%9E%D7%9C%D7%9B%D7%99%D7%90%D7%9C_%D7%A6%D7%91%D7%99_%D7%98%D7%A0%D7%A0%D7%91%D7%95%D7%99%D7%9D"
  * >Divrei Malkiel</a> that the time to walk the distance of a <em>Mil</em> is 15 minutes for a total of 60 minutes
  * for 4 <em>Mil</em> after {@link #getSeaLevelSunset() sea level sunset}. See detailed documentation explaining the
  * 60 minute concept at {@link #getAlos60()}.
  * 
  * @return the <code>Date</code> representing 60 minutes after sea level sunset. If the calculation can't be
  *         computed such as in the Arctic Circle where there is at least one day a year where the sun does not rise,
  *         and one where it does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  * 
  * @see #getAlos60()
  * @see #getPlagHamincha60Minutes()
  * @see #getShaahZmanis60Minutes()
  */
  getTzais60() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), 60 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * This method returns <em>tzais</em> usually calculated as 40 minutes (configurable to any offset via
  * {@link #setAteretTorahSunsetOffset(double)}) after sunset. Please note that <em>Chacham</em> Yosef Harari-Raful
  * of Yeshivat Ateret Torah who uses this time, does so only for calculating various other <em>zmanai hayom</em>
  * such as <em>Sof Zman Krias Shema</em> and <em>Plag Hamincha</em>. His calendars do not publish a <em>zman</em>
  * for <em>Tzais</em>. It should also be noted that <em>Chacham</em> Harari-Raful provided a 25 minute <em>zman</em>
  * for Israel. This API uses 40 minutes year round in any place on the globe by default. This offset can be change
  *  by calling {@link #setAteretTorahSunsetOffset(double)}.
  * 
  * @return the <code>Date</code> representing 40 minutes (configurable via {@link #setAteretTorahSunsetOffset})
  *         after sea level sunset. If the calculation can't be computed such as in the Arctic Circle where there is
  *         at least one day a year where the sun does not rise, and one where it does not set, a null will be
  *         returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #getAteretTorahSunsetOffset()
  * @see #setAteretTorahSunsetOffset(double)
  */
  getTzaisAteretTorah() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), this.getAteretTorahSunsetOffset() * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * Returns the offset in minutes after sunset used to calculate <em>tzais</em> based on the calculations of
  * <em>Chacham</em> Yosef Harari-Raful of Yeshivat Ateret Torah calculations. The default value is 40 minutes.
  * This affects most <em>zmanim</em>, since almost all zmanim use subset as part of their calculation.
  * 
  * @return the number of minutes after sunset for <em>Tzait</em>.
  * @see #setAteretTorahSunsetOffset(double)
  */
  getAteretTorahSunsetOffset() {
    return this.ateretTorahSunsetOffset;
  }
  /**
  * Allows setting the offset in minutes after sunset for the Ateret Torah <em>zmanim</em>. The default if unset is
  * 40 minutes. <em>Chacham</em> Yosef Harari-Raful of Yeshivat Ateret Torah uses 40 minutes globally with the exception
  * of Israel where a 25 minute offset is used. This 40 minute (or any other) offset can be overridden by this method.
  * This offset impacts all Ateret Torah <em>zmanim</em>.
  * 
  * @param ateretTorahSunsetOffset
  *            the number of minutes after sunset to use as an offset for the Ateret Torah <em>tzais</em>
  * @see #getAteretTorahSunsetOffset()
  */
  setAteretTorahSunsetOffset(ateretTorahSunsetOffset) {
    this.ateretTorahSunsetOffset = ateretTorahSunsetOffset;
  }
  /**
  * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) based on the
  * calculation of <em>Chacham</em> Yosef Harari-Raful of Yeshivat Ateret Torah, that the day starts
  * {@link #getAlos72Zmanis() 1/10th of the day} before sunrise and is usually calculated as ending
  * {@link #getTzaisAteretTorah() 40 minutes after sunset} (configurable to any offset via
  * {@link #setAteretTorahSunsetOffset(double)}). <em>shaos zmaniyos</em> are calculated based on this day and added
  * to {@link #getAlos72Zmanis() <em>alos</em>} to reach this time. This time is 3
  * {@link #getShaahZmanisAteretTorah() <em>shaos zmaniyos</em>} (temporal hours) after
  * {@link #getAlos72Zmanis() <em>alos</em> 72 <em>zmaniyos</em>}. <b>Note: </b> Based on this calculation <em>chatzos</em>
  * will not be at midday.
  * 
  * @return the <code>Date</code> of the latest <em>zman krias shema</em> based on this calculation. If the
  *         calculation can't be computed such as in the Arctic Circle where there is at least one day a year where
  *         the sun does not rise, and one where it does not set, a null will be returned. See detailed explanation
  *         on top of the {@link AstronomicalCalendar} documentation.
  * @see #getAlos72Zmanis()
  * @see #getTzaisAteretTorah()
  * @see #getAteretTorahSunsetOffset()
  * @see #setAteretTorahSunsetOffset(double)
  * @see #getShaahZmanisAteretTorah()
  */
  getSofZmanShmaAteretTorah() {
    return this.getSofZmanShma(this.getAlos72Zmanis(), this.getTzaisAteretTorah());
  }
  /**
  * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) based on the calculation
  * of <em>Chacham</em> Yosef Harari-Raful of Yeshivat Ateret Torah, that the day starts {@link #getAlos72Zmanis()
  * 1/10th of the day} before sunrise and is usually calculated as ending {@link #getTzaisAteretTorah() 40 minutes
  * after sunset} (configurable to any offset via {@link #setAteretTorahSunsetOffset(double)}). <em>shaos zmaniyos</em>
  * are calculated based on this day and added to {@link #getAlos72Zmanis() <em>alos</em>} to reach this time. This time
  * is 4 * {@link #getShaahZmanisAteretTorah() <em>shaos zmaniyos</em>} (temporal hours) after
  * {@link #getAlos72Zmanis() <em>alos</em> 72 zmaniyos}.
  * <b>Note: </b> Based on this calculation <em>chatzos</em> will not be at midday.
  * 
  * @return the <code>Date</code> of the latest <em>zman krias shema</em> based on this calculation. If the
  *         calculation can't be computed such as in the Arctic Circle where there is at least one day a year where
  *         the sun does not rise, and one where it does not set, a null will be returned. See detailed explanation
  *         on top of the {@link AstronomicalCalendar} documentation.
  * @see #getAlos72Zmanis()
  * @see #getTzaisAteretTorah()
  * @see #getShaahZmanisAteretTorah()
  * @see #setAteretTorahSunsetOffset(double)
  */
  getSofZmanTfilahAteretTorah() {
    return this.getSofZmanTfila(this.getAlos72Zmanis(), this.getTzaisAteretTorah());
  }
  /**
  * This method returns the time of <em>mincha gedola</em> based on the calculation of <em>Chacham</em> Yosef
  * Harari-Raful of Yeshivat Ateret Torah, that the day starts {@link #getAlos72Zmanis() 1/10th of the day}
  * before sunrise and is usually calculated as ending {@link #getTzaisAteretTorah() 40 minutes after sunset}
  * (configurable to any offset via {@link #setAteretTorahSunsetOffset(double)}). This is the preferred earliest
  * time to pray <em>mincha</em> according to the opinion of the <a href="https://en.wikipedia.org/wiki/Maimonides"
  * >Rambam</a> and others. For more information on this see the documentation on {@link #getMinchaGedola() <em>mincha
  * gedola</em>}. This is calculated as 6.5 {@link #getShaahZmanisAteretTorah()  solar hours} after <em>alos</em>. The
  * calculation used is 6.5 * {@link #getShaahZmanisAteretTorah()} after {@link #getAlos72Zmanis() <em>alos</em>}.
  * 
  * @see #getAlos72Zmanis()
  * @see #getTzaisAteretTorah()
  * @see #getShaahZmanisAteretTorah()
  * @see #getMinchaGedola()
  * @see #getMinchaKetanaAteretTorah()
  * @see ZmanimCalendar#getMinchaGedola()
  * @see #getAteretTorahSunsetOffset()
  * @see #setAteretTorahSunsetOffset(double)
  * 
  * @return the <code>Date</code> of the time of <em>mincha gedola</em>. If the calculation can't be computed such as
  *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  */
  getMinchaGedolaAteretTorah() {
    return this.getMinchaGedola(this.getAlos72Zmanis(), this.getTzaisAteretTorah());
  }
  /**
  * This method returns the time of <em>mincha ketana</em> based on the calculation of
  * <em>Chacham</em> Yosef Harari-Raful of Yeshivat Ateret Torah, that the day starts
  * {@link #getAlos72Zmanis() 1/10th of the day} before sunrise and is usually calculated as ending
  * {@link #getTzaisAteretTorah() 40 minutes after sunset} (configurable to any offset via
  * {@link #setAteretTorahSunsetOffset(double)}). This is the preferred earliest time to pray <em>mincha</em>
  * according to the opinion of the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> and others.
  * For more information on this see the documentation on {@link #getMinchaGedola() <em>mincha gedola</em>}. This is
  * calculated as 9.5 {@link #getShaahZmanisAteretTorah() solar hours} after {@link #getAlos72Zmanis() <em>alos</em>}.
  * The calculation used is 9.5 * {@link #getShaahZmanisAteretTorah()} after {@link #getAlos72Zmanis() <em>alos</em>}.
  * 
  * @see #getAlos72Zmanis()
  * @see #getTzaisAteretTorah()
  * @see #getShaahZmanisAteretTorah()
  * @see #getAteretTorahSunsetOffset()
  * @see #setAteretTorahSunsetOffset(double)
  * @see #getMinchaGedola()
  * @see #getMinchaKetana()
  * @return the <code>Date</code> of the time of <em>mincha ketana</em>. If the calculation can't be computed such as
  *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  */
  getMinchaKetanaAteretTorah() {
    return this.getMinchaKetana(this.getAlos72Zmanis(), this.getTzaisAteretTorah());
  }
  /**
  * This method returns the time of <em>plag hamincha</em> based on the calculation of <em>Chacham</em> Yosef Harari-Raful
  * of Yeshivat Ateret Torah, that the day starts {@link #getAlos72Zmanis() 1/10th of the day} before sunrise and is
  * usually calculated as ending {@link #getTzaisAteretTorah() 40 minutes after sunset} (configurable to any offset
  * via {@link #setAteretTorahSunsetOffset(double)}). <em>shaos zmaniyos</em> are calculated based on this day and
  * added to {@link #getAlos72Zmanis() <em>alos</em>} to reach this time. This time is 10.75
  * {@link #getShaahZmanisAteretTorah() <em>shaos zmaniyos</em>} (temporal hours) after {@link #getAlos72Zmanis()
  * dawn}.
  * 
  * @return the <code>Date</code> of the <em>plag</em>. If the calculation can't be computed such as in the Arctic Circle
  *         where there is at least one day a year where the sun does not rise, and one where it does not set, a null
  *         will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #getAlos72Zmanis()
  * @see #getTzaisAteretTorah()
  * @see #getShaahZmanisAteretTorah()
  * @see #setAteretTorahSunsetOffset(double)
  * @see #getAteretTorahSunsetOffset()
  */
  getPlagHaminchaAteretTorah() {
    return this.getPlagHamincha(this.getAlos72Zmanis(), this.getTzaisAteretTorah());
  }
  /**
   * This method returns the time of <em>misheyakir</em> based on the common calculation of the Syrian community in NY
   * that the <em>alos</em> is a fixed minute offset from day starting {@link #getAlos72Zmanis() 1/10th of the day}
   * before sunrise. The common offsets are 6 minutes (based on the <em>Pri Megadim</em>, but not linked to the
   * calculation of <em>Alos</em> as 1/10th of the day), 8 and 18 minutes (possibly attributed to
   * <em>Chacham Baruch Ben Haim</em>). Since there is no universal accepted offset, the user of this API will have to
   * <em><a href="https://en.wikipedia.org/wiki/Baruch_Ben_Haim">Chacham Baruch Ben Haim</a></em>). Since there is no
   * universal accepted offset, the user of this API will have to specify one. <em>Chacham Yosef Harari-Raful</em> of
   * <em>Yeshivat Ateret Torah</em> does not supply any <em>zman</em> for <em>misheyakir</em> and does not endorse any
   * specific calculation for <em>misheyakir</em>. For that reason, this method is not a public method.
   *
   * @param minutes
   *            the number of minutes after <em>alos</em> calculated as {@link #getAlos72Zmanis() 1/10th of the day}
   * @return the <code>Date</code> of <em>misheyakir</em>. If the calculation can't be computed such as in the Arctic
   *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
   *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * @see #getAlos72Zmanis()
   */
  // private Date getMesheyakirAteretTorah(double minutes) {
  // return getTimeOffset(getAlos72Zmanis(), minutes * MINUTE_MILLIS);
  // }
  /**
  * Method to return <em>tzais</em> (dusk) calculated as 72 minutes zmaniyos, or 1/10th of the day after
  * {@link #getSeaLevelSunset() sea level sunset}. This is the way that the <a href=
  * "https://en.wikipedia.org/wiki/Abraham_Cohen_Pimentel">Minchas Cohen</a> in Ma'amar 2:4 calculates Rebbeinu Tam's
  * time of <em>tzeis</em>. It should be noted that this calculation results in the shortest time from sunset to
  * <em>tzais</em> being during the winter solstice, the longest at the summer solstice and 72 clock minutes at the
  * equinox. This does not match reality, since there is no direct relationship between the length of the day and
  * twilight. The shortest twilight is during the equinox, the longest is during the the summer solstice, and in the
  * winter with the shortest daylight, the twilight period is longer than during the equinoxes.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #getAlos72Zmanis()
  */
  getTzais72Zmanis() {
    return this.getZmanisBasedOffset(1.2);
  }
  getZmanisBasedOffset(hours) {
    const shaahZmanis = this.getShaahZmanisGra();
    if (shaahZmanis === Long_MIN_VALUE || hours === 0) {
      return null;
    }
    return hours > 0 ? _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), shaahZmanis * hours) : _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunrise(), shaahZmanis * hours);
  }
  /**
  * Method to return <em>tzais</em> (dusk) calculated using 90 minutes zmaniyos or 1/8th of the day after {@link
  * #getSeaLevelSunset() sea level sunset}. This time is known in Yiddish as the <em>achtel</em> (an eighth)
  * <em>zman</em>.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #getAlos90Zmanis()
  */
  getTzais90Zmanis() {
    return this.getZmanisBasedOffset(1.5);
  }
  /**
  * Method to return <em>tzais</em> (dusk) calculated using 96 minutes <em>zmaniyos</em> or 1/7.5 of the day after
  * {@link #getSeaLevelSunset() sea level sunset}.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #getAlos96Zmanis()
  */
  getTzais96Zmanis() {
    return this.getZmanisBasedOffset(1.6);
  }
  /**
  * Method to return <em>tzais</em> (dusk) calculated as 90 minutes after sea level sunset. This method returns
  * <em>tzais</em> (nightfall) based on the opinion of the Magen Avraham that the time to walk the distance of a
  * <em>Mil</em> according to the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a>'s opinion
  * is 18 minutes for a total of 90 minutes based on the opinion of Ula who calculated <em>tzais</em> as 5
  * <em>Mil</em> after sea level <em>shkiah</em> (sunset). A similar calculation {@link #getTzais19Point8Degrees()}
  * uses solar position calculations based on this time.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #getTzais19Point8Degrees()
  * @see #getAlos90()
  */
  getTzais90() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), 90 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * This method should be used <em>lechumra</em> only and returns <em>tzais</em> (nightfall) based on the calculations
  * of <a href="https://en.wikipedia.org/wiki/Avraham_Chaim_Naeh">Rav Chaim Naeh</a> that the time to walk the
  * distance of a <em>Mil</em> according to the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a>'s opinion
  * is 2/5 of an hour (24 minutes) for a total of 120 minutes based on the opinion of <em>Ula</em> who calculated
  * <em>tzais</em> as 5 <em>Mil</em> after sea level <em>shkiah</em> (sunset). A similar calculation {@link
  * #getTzais26Degrees()} uses degree-based calculations based on this 120 minute calculation. Since the <em>zman</em>
  * is extremely late and at a point that is long past the 18&deg; point where the darkest point is
  * reached, it should only be used <em>lechumra</em>, such as delaying the start of nighttime <em>mitzvos</em>.
  * 
  * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
  *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
  *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}.
  *         documentation.
  * @see #getTzais26Degrees()
  * @see #getAlos120()
  */
  getTzais120() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), 120 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * This method should be used <em>lechumra</em> only and returns <em>tzais</em> (dusk) calculated using 120 minutes
  * <em>zmaniyos</em> after {@link #getSeaLevelSunset() sea level sunset}. Since the <em>zman</em>
  * is extremely late and at a point when the it is long past the 18&deg; point where the darkest point is
  * reached, it should only be used <em>lechumra</em>, such as delaying the start of nighttime <em>mitzvos</em>.
  * 
  * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
  *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
  *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #getAlos120Zmanis()
  * @see #getTzais120()
  * @see #getTzais26Degrees()
  */
  getTzais120Zmanis() {
    return this.getZmanisBasedOffset(2);
  }
  /**
  * This calculates the time of <em>tzais</em> at the point when the sun is 16.1&deg; below the horizon. This is
  * the sun's dip below the horizon 72 minutes after sunset according Rabbeinu Tam's calculation of <em>tzais</em>
  * <a href=
  * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> in
  * Jerusalem. The question of equinox VS equilux is complex, with Rabbi Meir Posen in the <a href=
  * "https://www.worldcat.org/oclc/956316270">Ohr Meir</a> of the opinion that the equilux should be used. See
  * Yisrael Vehazmanim vol I, 34:1:4. Rabbi Yedidya Manet in his <a href=
  * "https://www.nli.org.il/en/books/NNL_ALEPH002542826/NLI">Zmanei Halacha Lema'aseh</a> (4th edition part 2, pages
  * and 22 and 24) and Rabbi Yonah Metzbuch (in a letter published by Rabbi Manet) are of the opinion that the
  * astronomical equinox should be used. The difference adds up to about 9 seconds, too trivial to make much of a
  * difference. For information on how this is calculated see the comments on {@link #getAlos16Point1Degrees()}.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as northern and
  *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may
  *         not reach low enough below the horizon for this calculation, a null will be returned. See detailed
  *         explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #getTzais72()
  * @see #getAlos16Point1Degrees() for more information on this calculation.
  */
  getTzais16Point1Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_16_POINT_1);
  }
  /**
  * This method should be used <em>lechumra</em> only and returns <em>tzais</em> based on when the sun is 26&deg;
  * below the horizon.For information on how this is calculated see the comments on {@link #getAlos26Degrees()}.
  * Since the <em>zman</em> is extremely late and at a point when it is long past the 18&deg; point where the
  * darkest point is reached, it should only be used <em>lechumra</em> such as delaying the start of nighttime
  * <em>mitzvos</em>.
  * 
  * @deprecated This method should be used <em>lechumra</em> only since it returns a very late time, and if used
  *         <em>lekula</em> can result in <em>chillul Shabbos</em> etc. There is no current plan to remove this
  *         method from the API, and this deprecation is intended to alert developers of the danger of using it.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as northern and
  *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may
  *         not reach low enough below the horizon for this calculation, a null will be returned. See detailed
  *         explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #getTzais120()
  * @see #getAlos26Degrees()
  */
  getTzais26Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_26_DEGREES);
  }
  /**
  * For information on how this is calculated see the comments on {@link #getAlos18Degrees()}
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as northern and
  *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may
  *         not reach low enough below the horizon for this calculation, a null will be returned. See detailed
  *         explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #getAlos18Degrees()
  */
  getTzais18Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ASTRONOMICAL_ZENITH);
  }
  /**
  * For information on how this is calculated see the comments on {@link #getAlos19Point8Degrees()}
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as northern and
  *         southern locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may
  *         not reach low enough below the horizon for this calculation, a null will be returned. See detailed
  *         explanation on top of the {@link AstronomicalCalendar} documentation.
  * @see #getTzais90()
  * @see #getAlos19Point8Degrees()
  */
  getTzais19Point8Degrees() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_19_POINT_8);
  }
  /**
  * A method to return <em>tzais</em> (dusk) calculated as 96 minutes after sea level sunset. For information on how
  * this is calculated see the comments on {@link #getAlos96()}.
  * 
  * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
  *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
  *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  * @see #getAlos96()
  */
  getTzais96() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), 96 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * A method that returns the local time for fixed <em>chatzos</em>. This time is noon and midnight adjusted from
  * standard time to account for the local latitude. The 360&deg; of the globe divided by 24 calculates to 15&deg;
  * per hour with 4 minutes per degree, so at a longitude of 0 , 15, 30 etc... <em>Chatzos</em> is at exactly 12:00
  * noon. This is the time of <em>chatzos</em> according to the <a href=
  * "https://en.wikipedia.org/wiki/Aruch_HaShulchan">Aruch Hashulchan</a> in <a href=
  * "https://hebrewbooks.org/pdfpager.aspx?req=7705&pgnum=426">Orach Chaim 233:14</a> and <a href=
  * "https://en.wikipedia.org/wiki/Moshe_Feinstein">Rabbi Moshe Feinstein</a> in Igros Moshe <a href=
  * "https://hebrewbooks.org/pdfpager.aspx?req=916&st=&pgnum=67">Orach Chaim 1:24</a> and <a href=
  * "https://hebrewbooks.org/pdfpager.aspx?req=14675&pgnum=191">2:20</a>.
  * Lakewood, N.J., with a longitude of -74.2094, is 0.7906 away from the closest multiple of 15 at -75&deg;. This
  * is multiplied by 4 to yield 3 minutes and 10 seconds for a <em>chatzos</em> of 11:56:50. This method is not tied
  * to the theoretical 15&deg; timezones, but will adjust to the actual timezone and <a
  * href="https://en.wikipedia.org/wiki/Daylight_saving_time">Daylight saving time</a>.
  * 
  * @return the Date representing the local <em>chatzos</em>
  * @see GeoLocation#getLocalMeanTimeOffset()
  */
  getFixedLocalChatzos() {
    const geoLocation = this.getGeoLocation();
    const rawOffsetHours = TimeZone.getRawOffset(geoLocation.getTimeZone()) / _ComplexZmanimCalendar.HOUR_MILLIS;
    return _ComplexZmanimCalendar.getTimeOffset(
      this.getDateFromTime(12 - rawOffsetHours, true),
      -geoLocation.getLocalMeanTimeOffset()
    );
  }
  /**
  * A method that returns the latest <em>zman krias shema</em> (time to recite Shema in the morning) calculated as 3
  * clock hours before {@link #getFixedLocalChatzos()}. Note that there are opinions brought down in Yisrael Vehazmanim
  * <a href="https://hebrewbooks.org/pdfpager.aspx?req=9765&st=&pgnum=85">page 57</a> and Rav Yitzchak Silber's <a href=
  * "https://www.worldcat.org/oclc/811253716">Sha'aos Shavos Balalacha</a> that this calculation is a mistake and regular
  * <em>chatzos</em> shoud be used for clock-hour calculations as opposed to fixed local <em>chatzos</em>. According to
  * these opinions it should be 3 clock hours before regular <em>chatzos</em> as calculated in {@link
  * #getSofZmanShma3HoursBeforeChatzos()}.
  * 
  * @return the <code>Date</code> of the latest <em>zman krias shema</em> calculated as 3 clock hours before
  *         {@link #getFixedLocalChatzos()}.
  * @see #getFixedLocalChatzos()
  * @see #getSofZmanShma3HoursBeforeChatzos()
  * @see #getSofZmanTfilaFixedLocal()
  *         
  * @deprecated This method of calculating <em>sof zman Shma</em> is considered a mistaken understanding of the proper
  *         calculation of this <em>zman</em> in the opinion of Rav Yitzchak Silber's <a href=
  *         "https://www.worldcat.org/oclc/811253716">Sha'aos Shavos Balalacha</a>. On pages 316-318 he discusses Rav Yisrael
  *         Harfenes's calculations and points to his seeming agreement that using fixed local <em>chatzos</em> as the focal
  *         point is problematic. See Yisrael Vehazmanim <a href=
  *         "https://hebrewbooks.org/pdfpager.aspx?req=9765&st=&pgnum=85">page 57</a>. While the Yisrael Vehazmanim mentions
  *         this issue in vol. 1, it was not corrected in the calculations in vol. 3 and other parts of the <em>sefer</em>.
  *         A competent rabbinical authority should be consulted before using this <em>zman</em>. Instead, the use of {@link
  *         #getSofZmanShma3HoursBeforeChatzos()} should be used to calculate <em>sof zman Tfila</em> using 3 fixed clock hours.
  *         This will likely be removed in v3.0.
  */
  getSofZmanShmaFixedLocal() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getFixedLocalChatzos(), -180 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * This method returns the latest <em>zman tfila</em> (time to recite the morning prayers) calculated as 2 hours
  * before {@link #getFixedLocalChatzos()}. See the documentation on {@link #getSofZmanShmaFixedLocal()} showing
  * differing opinions on how the <em>zman</em> is calculated. According to many opinions {@link
  * #getSofZmanTfila2HoursBeforeChatzos()} should be used as opposed to this <em>zman</em>.
  * 
  * @return the <code>Date</code> of the latest <em>zman tfila</em>.
  * @see #getFixedLocalChatzos()
  * @see #getSofZmanShmaFixedLocal()
  * @see #getSofZmanTfila2HoursBeforeChatzos()
  *         
  * @deprecated This method of calculating <em>sof zman Tfila</em> is considered a mistaken understanding of the proper
  *         calculation of this <em>zman</em> in the opinion of Rav Yitzchak Silber's <a href=
  *         "https://www.worldcat.org/oclc/811253716">Sha'aos Shavos Balalacha</a>. On pages 316-318 he discusses Rav Yisrael
  *         Harfenes's calculations and points to his seeming agreement that using fixed local <em>chatzos</em> as the focal
  *         point is problematic. See Yisrael Vehazmanim <a href=
  *         "https://hebrewbooks.org/pdfpager.aspx?req=9765&st=&pgnum=85">page 57</a>. While the Yisrael Vehazmanim mentions
  *         this issue in vol. 1, it was not corrected in the calculations in vol. 3 and other parts of the <em>sefer</em>.
  *         A competent rabbinical authority should be consulted before using this <em>zman</em>. Instead, the use of {@link
  *         #getSofZmanTfila2HoursBeforeChatzos()} should be used to calculate <em>sof zman Tfila</em> using 2 fixed
  *         clock hours. This will likely be removed in v3.0.
  */
  getSofZmanTfilaFixedLocal() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getFixedLocalChatzos(), -120 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
  * Returns the latest time of <em>Kidush Levana</em> according to the <a
  * href="https://en.wikipedia.org/wiki/Yaakov_ben_Moshe_Levi_Moelin">Maharil's</a> opinion that it is calculated as
  * halfway between <em>molad</em> and <em>molad</em>. This adds half the 29 days, 12 hours and 793 chalakim time
  * between <em>molad</em> and <em>molad</em> (14 days, 18 hours, 22 minutes and 666 milliseconds) to the month's <em>molad</em>.
  * If the time of <em>sof zman Kiddush Levana</em> occurs during the day (between the <em>alos</em> and <em>tzais</em> passed in
  * as parameters), it returns the <em>alos</em> passed in. If a null <em>alos</em> or <em>tzais</em> are passed to this method,
  * the non-daytime adjusted time will be returned.
  * 
  * @param alos
  *            the beginning of the Jewish day. If <em>Kidush Levana</em> occurs during the day (starting at <em>alos</em> and
  *            ending at <em>tzais</em>), the time returned will be <em>alos</em>. If either the <em>alos</em> or <em>tzais</em>
  *            parameters are null, no daytime adjustment will be made.
  * @param tzais
  *            the end of the Jewish day. If Kidush Levana occurs during the day (starting at <em>alos</em> and ending at
  *            <em>tzais</em>), the time returned will be <em>alos</em>. If either the <em>alos</em> or <em>tzais</em> parameter
  *            are null, no daytime adjustment will be made.
  * @return the Date representing the moment halfway between molad and molad. If the time occurs between
  *         <em>alos</em> and <em>tzais</em>, <em>alos</em> will be returned
  * @see #getSofZmanKidushLevanaBetweenMoldos()
  * @see #getSofZmanKidushLevana15Days(Date, Date)
  * @see JewishCalendar#getSofZmanKidushLevanaBetweenMoldos()
  */
  getSofZmanKidushLevanaBetweenMoldos(alos, tzais) {
    const jewishCalendar = new JewishCalendar(this.getDate());
    if (jewishCalendar.getJewishDayOfMonth() < 11 || jewishCalendar.getJewishDayOfMonth() > 16) {
      return null;
    }
    return this.getMoladBasedTime(jewishCalendar.getSofZmanKidushLevanaBetweenMoldos(), alos, tzais, false);
  }
  /**
  * Returns the Date of the <em>molad</em> based time if it occurs on the current date. Since <em>Kiddush Levana</em>
  * can only be said during the day, there are parameters to limit it to between <em>alos</em> and <em>tzais</em>. If
  * the time occurs between <em>alos</em> and <em>tzais</em>, <em>tzais</em> will be returned.
  * 
  * @param moladBasedTime
  *            the <em>molad</em> based time such as <em>molad</em>, <em>tchilas</em> and <em>sof zman Kiddush Levana</em>
  * @param alos
  *            optional start of day to limit <em>molad</em> times to the end of the night before or beginning of the next night.
  *            Ignored if either <em>alos</em> or <em>tzais</em> are null.
  * @param tzais
  *            optional end of day to limit <em>molad</em> times to the end of the night before or beginning of the next night.
  *            Ignored if either <em>tzais</em> or <em>alos</em> are null
  * @param techila
  *            is it the start of <em>Kiddush Levana</em> time or the end? If it is start roll it to the next <em>tzais</em>, and
  *            and if it is the end, return the end of the previous night (<em>alos</em> passed in). Ignored if either
  *            <em>alos</em> or <em>tzais</em> are null.
  * @return the <em>molad</em> based time. If the <em>zman</em> does not occur during the current date, null will be returned. 
  */
  getMoladBasedTime(moladBasedTime, alos, tzais, techila) {
    const lastMidnight = this.getMidnightLastNight();
    const midnightTonight = this.getMidnightTonight();
    if (!(moladBasedTime < lastMidnight || moladBasedTime > midnightTonight)) {
      if (alos !== null || tzais !== null) {
        return techila && !(moladBasedTime < tzais || moladBasedTime > alos) ? tzais : alos;
      }
      return moladBasedTime;
    }
    return null;
  }
  /**
  * Returns the latest time of <em>Kiddush Levana</em> calculated as 15 days after the <em>molad</em>. This is the
  * opinion brought down in the Shulchan Aruch (Orach Chaim 426). It should be noted that some opinions hold that the
  * <a href="https://en.wikipedia.org/wiki/Moses_Isserles">Rema</a> who brings down the opinion of the <a
  * href="https://en.wikipedia.org/wiki/Yaakov_ben_Moshe_Levi_Moelin">Maharil's</a> of calculating
  * {@link #getSofZmanKidushLevanaBetweenMoldos(Date, Date) half way between <em>molad</em> and <em>molad</em>} is of
  * the opinion that the Mechaber agrees to his opinion. Also see the Aruch Hashulchan. For additional details on the subject,
  * see Rabbi Dovid Heber's very detailed write-up in <em>Siman Daled</em> (chapter 4) of <a href=
  * "https://hebrewbooks.org/53000">Shaarei Zmanim</a>. If the time of <em>sof zman Kiddush Levana</em> occurs during
  * the day (between the <em>alos</em> and <em>tzais</em> passed in as parameters), it returns the <em>alos</em> passed in. If a
  * null <em>alos</em> or <em>tzais</em> are passed to this method, the non-daytime adjusted time will be returned.
  * 
  * @param alos
  *            the beginning of the Jewish day. If <em>Kidush Levana</em> occurs during the day (starting at <em>alos</em> and
  *            ending at <em>tzais</em>), the time returned will be <em>alos</em>. If either the <em>alos</em> or <em>tzais</em>
  *            parameters are null, no daytime adjustment will be made.
  * @param tzais
  *            the end of the Jewish day. If <em>Kidush Levana</em> occurs during the day (starting at <em>alos</em> and ending at
  *            <em>tzais</em>), the time returned will be <em>alos</em>. If either the <em>alos</em> or <em>tzais</em> parameters
  *            are null, no daytime adjustment will be made.
  *
  * @return the Date representing the moment 15 days after the molad. If the time occurs between <em>alos</em> and
  *         <em>tzais</em>, <em>alos</em> will be returned
  * 
  * @see #getSofZmanKidushLevanaBetweenMoldos(Date, Date)
  * @see JewishCalendar#getSofZmanKidushLevana15Days()
  */
  getSofZmanKidushLevana15Days(alos = null, tzais = null) {
    const jewishCalendar = new JewishCalendar(this.getDate());
    if (jewishCalendar.getJewishDayOfMonth() < 11 || jewishCalendar.getJewishDayOfMonth() > 17) {
      return null;
    }
    return this.getMoladBasedTime(jewishCalendar.getSofZmanKidushLevana15Days(), alos, tzais, false);
  }
  /**
  * Returns the earliest time of <em>Kiddush Levana</em> according to <a href=
  * "https://en.wikipedia.org/wiki/Yonah_Gerondi">Rabbeinu Yonah</a>'s opinion that it can be said 3 days after the <em>molad</em>.
  * If the time of <em>tchilas zman Kiddush Levana</em> occurs during the day (between <em>alos</em> and <em>tzais</em> passed to
  * this method) it will return the following <em>tzais</em>. If null is passed for either <em>alos</em> or <em>tzais</em>, the actual
  * <em>tchilas zman Kiddush Levana</em> will be returned, regardless of if it is during the day or not.
  * 
  * @param alos
  *            the beginning of the Jewish day. If Kidush Levana occurs during the day (starting at <em>alos</em> and ending
  *            at <em>tzais</em>), the time returned will be <em>tzais</em>. If either the <em>alos</em> or <em>tzais</em> parameters
  *            are null, no daytime adjustment will be made.
  * @param tzais
  *            the end of the Jewish day. If <em>Kidush Levana</em> occurs during the day (starting at <em>alos</em> and ending at
  *            <em>tzais</em>), the time returned will be <em>tzais</em>. If either the <em>alos</em> or <em>tzais</em> parameters
  *            are null, no daytime adjustment will be made.
  *
  * @return the Date representing the moment 3 days after the molad. If the time occurs between <em>alos</em> and
  *         <em>tzais</em>, <em>tzais</em> will be returned
  * @see #getTchilasZmanKidushLevana3Days()
  * @see #getTchilasZmanKidushLevana7Days(Date, Date)
  * @see JewishCalendar#getTchilasZmanKidushLevana3Days()
  */
  getTchilasZmanKidushLevana3Days(alos = null, tzais = null) {
    const jewishCalendar = new JewishCalendar();
    jewishCalendar.setGregorianDate(this.getDate().year, this.getDate().month - 1, this.getDate().day);
    if (jewishCalendar.getJewishDayOfMonth() > 5 && jewishCalendar.getJewishDayOfMonth() < 30) {
      return null;
    }
    let zman = this.getMoladBasedTime(jewishCalendar.getTchilasZmanKidushLevana3Days(), alos, tzais, true);
    if (zman === null && jewishCalendar.getJewishDayOfMonth() === 30) {
      jewishCalendar.forward(Calendar.MONTH, 1);
      zman = this.getMoladBasedTime(jewishCalendar.getTchilasZmanKidushLevana3Days(), null, null, true);
    }
    return zman;
  }
  /**
  * Returns the point in time of <em>Molad</em> as a <code>Date</code> Object. For the traditional day of week, hour,
  * minute and chalakim, {@link JewishCalendar#getMoladAsDate()} and the not yet completed
  * {@link HebrewDateFormatter} that will have formatting for this.
  * 
  * @return the Date representing the moment of the molad. If the molad does not occur on this day, a null will be returned.
  * 
  * @see #getTchilasZmanKidushLevana3Days()
  * @see #getTchilasZmanKidushLevana7Days(Date, Date)
  * @see JewishCalendar#getMoladAsDate()
  */
  getZmanMolad() {
    const jewishCalendar = new JewishCalendar();
    jewishCalendar.setGregorianDate(this.getDate().year, this.getDate().month - 1, this.getDate().day);
    if (jewishCalendar.getJewishDayOfMonth() > 2 && jewishCalendar.getJewishDayOfMonth() < 27) {
      return null;
    }
    let molad = this.getMoladBasedTime(jewishCalendar.getMoladAsDate(), null, null, true);
    if (molad === null && jewishCalendar.getJewishDayOfMonth() > 26) {
      jewishCalendar.forward(Calendar.MONTH, 1);
      molad = this.getMoladBasedTime(jewishCalendar.getMoladAsDate(), null, null, true);
    }
    return molad;
  }
  /**
  * Used by Molad based <em>zmanim</em> to determine if <em>zmanim</em> occur during the current day.
  * @see #getMoladBasedTime(Date, Date, Date, boolean)
  * @return previous midnight
  */
  getMidnightLastNight() {
    return this.getDate().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0
    });
  }
  /**
  * Used by Molad based <em>zmanim</em> to determine if <em>zmanim</em> occur during the current day.
  * @see #getMoladBasedTime(Date, Date, Date, boolean)
  * @return following midnight
  */
  getMidnightTonight() {
    return this.getDate().plus({ days: 1 }).set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0
    });
  }
  /**
  * Returns the earliest time of <em>Kiddush Levana</em> according to the opinions that it should not be said until 7
  * days after the <em>molad</em>. If the time of <em>tchilas zman Kiddush Levana</em> occurs during the day (between
  * {@link ZmanimCalendar#getAlos72() <em>alos</em>} and {@link ZmanimCalendar#getTzais72() <em>tzais</em>}) it
  * return the next <em>tzais</em>.
  * 
  * @param alos
  *            the beginning of the Jewish day. If <em>Kidush Levana</em> occurs during the day (starting at <em>alos</em>
  *            and ending at <em>tzais</em>), the time returned will be <em>tzais</em>. If either the <em>alos</em> or
  *            <em>tzais</em> parameters are null, no daytime adjustment will be made.
  * @param tzais
  *            the end of the Jewish day. If <em>Kidush Levana</em> occurs during the day (starting at <em>alos</em> and
  *            ending at <em>tzais</em>), the time returned will be <em>tzais</em>. If either the <em>alos</em> or
  *            <em>tzais</em> parameters are null, no daytime adjustment will be made.
  *
  * @return the Date representing the moment 7 days after the molad. If the time occurs between <em>alos</em> and
  *         <em>tzais</em>, <em>tzais</em> will be returned
  * @see #getTchilasZmanKidushLevana3Days(Date, Date)
  * @see #getTchilasZmanKidushLevana7Days()
  * @see JewishCalendar#getTchilasZmanKidushLevana7Days()
  */
  getTchilasZmanKidushLevana7Days(alos = null, tzais = null) {
    const jewishCalendar = new JewishCalendar(this.getDate());
    if (jewishCalendar.getJewishDayOfMonth() < 4 || jewishCalendar.getJewishDayOfMonth() > 9) {
      return null;
    }
    return this.getMoladBasedTime(jewishCalendar.getTchilasZmanKidushLevana7Days(), alos, tzais, true);
  }
  /**
   * This method returns the latest time one is allowed eating <em>chametz</em> on <em>Erev Pesach</em> according to
   * the opinion of the<a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a>. This time is identical to the {@link
   * #getSofZmanTfilaGRA() <em>Sof zman tfilah</em> GRA} and is provided as a convenience method for those who are
   * unaware how this <em>zman</em> is calculated. This time is 4 hours into the day based on the opinion of the
   * <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> that the day is calculated from sunrise to sunset.
   * This returns the time 4 * {@link #getShaahZmanisGra()} after {@link #getSeaLevelSunrise() sea level sunrise}.
   * 
   * @see ZmanimCalendar#getShaahZmanisGra()
   * @see ZmanimCalendar#getSofZmanTfilaGRA()
   * @return the <code>Date</code> one is allowed eating <em>chametz</em> on <em>Erev Pesach</em>. If the calculation
   *         can't be computed such as in the Arctic Circle where there is at least one day a year where the sun does
   *         not rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
   *         {@link AstronomicalCalendar} documentation.
   */
  getSofZmanAchilasChametzGRA() {
    return this.getSofZmanTfilaGRA();
  }
  /**
  * This method returns the latest time one is allowed eating <em>chametz</em> on <em>Erev Pesach</em> according to the
  * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em>
  * being {@link #getAlos72() 72} minutes before {@link #getSunrise() sunrise}. This time is identical to the
  * {@link #getSofZmanTfilaMGA72Minutes() <em>Sof zman tfilah</em> MGA 72 minutes}. This time is 4 {@link #getShaahZmanisMGA()
  * <em>shaos zmaniyos</em>} (temporal hours) after {@link #getAlos72() dawn} based on the opinion of the MGA that the day is
  * calculated from a {@link #getAlos72() dawn} of 72 minutes before sunrise to {@link #getTzais72() nightfall} of 72 minutes
  * after sunset. This returns the time of 4 * {@link #getShaahZmanisMGA()} after {@link #getAlos72() dawn}.
  * 
  * @return the <code>Date</code> of the latest time of eating <em>chametz</em>. If the calculation can't be computed such as
  *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set), a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  * @see #getShaahZmanisMGA()
  * @see #getAlos72()
  * @see #getSofZmanTfilaMGA72Minutes()
  */
  getSofZmanAchilasChametzMGA72Minutes() {
    return this.getSofZmanTfilaMGA72Minutes();
  }
  /**
  * This method returns the latest time one is allowed eating <em>chametz</em> on <em>Erev Pesach</em> according to the
  * opinion of the<a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em>
  * being {@link #getAlos16Point1Degrees() 16.1&deg;} before {@link #getSunrise() sunrise}. This time is 4 {@link
  * #getShaahZmanis16Point1Degrees() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos16Point1Degrees() dawn}
  * based on the opinion of the MGA that the day is calculated from dawn to nightfall with both being 16.1&deg;
  * below sunrise or sunset. This returns the time of 4 {@link #getShaahZmanis16Point1Degrees()} after
  * {@link #getAlos16Point1Degrees() dawn}.
  * 
  * @return the <code>Date</code> of the latest time of eating <em>chametz</em>. If the calculation can't be computed such
  *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle where
  *         the sun may not reach low enough below the horizon for this calculation, a null will be returned. See
  *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * 
  * @see #getShaahZmanis16Point1Degrees()
  * @see #getAlos16Point1Degrees()
  * @see #getSofZmanTfilaMGA16Point1Degrees()
  */
  getSofZmanAchilasChametzMGA16Point1Degrees() {
    return this.getSofZmanTfilaMGA16Point1Degrees();
  }
  /**
  * This method returns the latest time for burning <em>chametz</em> on <em>Erev Pesach</em> according to the opinion
  * of the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a>. This time is 5 hours into the day based on the
  * opinion of the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> that the day is calculated from
  * sunrise to sunset. This returns the time 5 * {@link #getShaahZmanisGra()} after {@link #getSeaLevelSunrise() sea
  * level sunrise}.
  * 
  * @see ZmanimCalendar#getShaahZmanisGra()
  * @return the <code>Date</code> of the latest time for burning <em>chametz</em> on <em>Erev Pesach</em>. If the
  *         calculation can't be computed such as in the Arctic Circle where there is at least one day a year where
  *         the sun does not rise, and one where it does not set, a null will be returned. See detailed explanation on
  *         top of the {@link AstronomicalCalendar} documentation.
  */
  getSofZmanBiurChametzGRA() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunrise(), this.getShaahZmanisGra() * 5);
  }
  /**
  * This method returns the latest time for burning <em>chametz</em> on <em>Erev Pesach</em> according to the opinion of
  * the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em>
  * being {@link #getAlos72() 72} minutes before {@link #getSunrise() sunrise}. This time is 5 {@link
  * #getShaahZmanisMGA() <em>shaos zmaniyos</em>} (temporal hours) after {@link #getAlos72() dawn} based on the opinion of
  * the MGA that the day is calculated from a {@link #getAlos72() dawn} of 72 minutes before sunrise to {@link
  * #getTzais72() nightfall} of 72 minutes after sunset. This returns the time of 5 * {@link #getShaahZmanisMGA()} after
  * {@link #getAlos72() dawn}.
  * 
  * @return the <code>Date</code> of the latest time for burning <em>chametz</em> on <em>Erev Pesach</em>. If the calculation
  *         can't be computed such as in the Arctic Circle where there is at least one day a year where the sun does not rise,
  *         and one where it does not set), a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  * @see #getShaahZmanisMGA()
  * @see #getAlos72()
  */
  getSofZmanBiurChametzMGA72Minutes() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getAlos72(), this.getShaahZmanisMGA() * 5);
  }
  /**
  * This method returns the latest time for burning <em>chametz</em> on <em>Erev Pesach</em> according to the opinion
  * of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> based on <em>alos</em>
  * being {@link #getAlos16Point1Degrees() 16.1&deg;} before {@link #getSunrise() sunrise}. This time is 5
  * {@link #getShaahZmanis16Point1Degrees() <em>shaos zmaniyos</em>} (solar hours) after {@link #getAlos16Point1Degrees()
  * dawn} based on the opinion of the MGA that the day is calculated from dawn to nightfall with both being 16.1&deg;
  * below sunrise or sunset. This returns the time of 5 {@link #getShaahZmanis16Point1Degrees()} after
  * {@link #getAlos16Point1Degrees() dawn}.
  * 
  * @return the <code>Date</code> of the latest time for burning <em>chametz</em> on <em>Erev Pesach</em>. If the calculation
  *         can't be computed such as northern and southern locations even south of the Arctic Circle and north of the
  *         Antarctic Circle where the sun may not reach low enough below the horizon for this calculation, a null
  *         will be returned. See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * 
  * @see #getShaahZmanis16Point1Degrees()
  * @see #getAlos16Point1Degrees()
  */
  getSofZmanBiurChametzMGA16Point1Degrees() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getAlos16Point1Degrees(), this.getShaahZmanis16Point1Degrees() * 5);
  }
  /**
  * A method that returns "solar" midnight, or the time when the sun is at its <a
  * href="https://en.wikipedia.org/wiki/Nadir">nadir</a>.
  * <b>Note:</b> this method is experimental and might be removed.
  * 
  * @return the <code>Date</code> of Solar Midnight (chatzos layla). If the calculation can't be computed such as in
  *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  */
  getSolarMidnight() {
    const clonedCal = new ComplexZmanimCalendar(this.getGeoLocation());
    clonedCal.setDate(this.getDate().plus({ days: 1 }));
    return _ComplexZmanimCalendar.getTimeOffset(this.getChatzos(), (clonedCal.getChatzos().toMillis() - this.getChatzos().toMillis()) / 2);
  }
  /**
  * A method that returns the <a href="https://en.wikipedia.org/wiki/Shneur_Zalman_of_Liadi">Baal Hatanya</a>'s
  * <em>netz amiti</em> (sunrise) without {@link AstronomicalCalculator#getElevationAdjustment(double)
  * elevation adjustment}. This forms the base for the Baal Hatanya's dawn-based calculations that are
  * calculated as a dip below the horizon before sunrise.
  *
  * According to the Baal Hatanya, <em>netz amiti</em>, or true (halachic) sunrise, is when the top of the sun's
  * disk is visible at an elevation similar to the mountains of Eretz Yisrael. The time is calculated as the point at which
  * the center of the sun's disk is 1.583&deg; below the horizon. This degree-based calculation can be found in Rabbi Shalom
  * DovBer Levine's commentary on The <a href="https://www.chabadlibrary.org/books/pdf/Seder-Hachnosas-Shabbos.pdf">Baal
  * Hatanya's Seder Hachnasas Shabbos</a>. From an elevation of 546 meters, the top of <a href=
  * "https://en.wikipedia.org/wiki/Mount_Carmel">Har Hacarmel</a>, the sun disappears when it is 1&deg; 35' or 1.583&deg;
  * below the sea level horizon. This in turn is based on the Gemara <a href=
  * "https://hebrewbooks.org/shas.aspx?mesechta=2&daf=35">Shabbos 35a</a>. There are other opinions brought down by
  * Rabbi Levine, including Rabbi Yosef Yitzchok Feigelstock who calculates it as the degrees below the horizon 4 minutes after
  * sunset in Yerushalayim (on the equinox). That is brought down as 1.583&deg;. This is identical to the 1&deg; 35' <em>zman</em>
  * and is probably a typo and should be 1.683&deg;. These calculations are used by most <a href=
  * "https://en.wikipedia.org/wiki/Chabad">Chabad</a> calendars that use the Baal Hatanya's <em>zmanim</em>. See
  * <a href="https://www.chabad.org/library/article_cdo/aid/3209349/jewish/About-Our-Zmanim-Calculations.htm">About Our
  * <em>Zmanim</em> Calculations @ Chabad.org</a>.
  *
  * Note: <em>netz amiti</em> is used only for calculating certain <em>zmanim</em>, and is intentionally unpublished. For
  * practical purposes, daytime <em>mitzvos</em> like <em>shofar</em> and <em>lulav</em> should not be done until after the
  * published time for <em>netz</em> / sunrise.
  * 
  * @return the <code>Date</code> representing the exact sea-level <em>netz amiti</em> (sunrise) time. If the calculation can't be
  *         computed such as in the Arctic Circle where there is at least one day a year where the sun does not rise, and one
  *         where it does not set, a null will be returned. See detailed explanation on top of the page.
  * 
  * @see #getSunrise()
  * @see #getSeaLevelSunrise()
  * @see #getSunsetBaalHatanya()
  * @see #ZENITH_1_POINT_583
  */
  getSunriseBaalHatanya() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_1_POINT_583);
  }
  /**
  * A method that returns the <a href="https://en.wikipedia.org/wiki/Shneur_Zalman_of_Liadi">Baal Hatanya</a>'s
  * <em>shkiah amiti</em> (sunset) without {@link AstronomicalCalculator#getElevationAdjustment(double)
  * elevation adjustment}. This forms the base for the Baal Hatanya's dusk-based calculations that are calculated
  * as a dip below the horizon after sunset.
  * 
  * According to the Baal Hatanya, <em>shkiah amiti</em>, true (<em>halachic</em>) sunset, is when the top of the 
  * sun's disk disappears from view at an elevation similar to the mountains of <em>Eretz Yisrael</em>.
  * This time is calculated as the point at which the center of the sun's disk is 1.583 degrees below the horizon.
  *
  * Note: <em>shkiah amiti</em> is used only for calculating certain <em>zmanim</em>, and is intentionally unpublished. For
  * practical purposes, all daytime mitzvos should be completed before the published time for <em>shkiah</em> / sunset.
  *
  * For further explanation of the calculations used for the Baal Hatanya's <em>zmanim</em> in this library, see
  * <a href="https://www.chabad.org/library/article_cdo/aid/3209349/jewish/About-Our-Zmanim-Calculations.htm">About Our
  * <em>Zmanim</em> Calculations @ Chabad.org</a>.
  * 
  * @return the <code>Date</code> representing the exact sea-level <em>shkiah amiti</em> (sunset) time. If the calculation
  *         can't be computed such as in the Arctic Circle where there is at least one day a year where the sun does not
  *         rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  * 
  * @see #getSunset()
  * @see #getSeaLevelSunset()
  * @see #getSunriseBaalHatanya()
  * @see #ZENITH_1_POINT_583
  */
  getSunsetBaalHatanya() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_1_POINT_583);
  }
  /**
  * A method that returns the <a href="https://en.wikipedia.org/wiki/Shneur_Zalman_of_Liadi">Baal Hatanya</a>'s
  * a <em>shaah zmanis</em> ({@link #getTemporalHour(Date, Date) temporal hour}). This forms the base for the
  * Baal Hatanya's  day  based calculations that are calculated as a 1.583&deg; dip below the horizon after sunset. 
  * According to the Baal Hatanya, <em>shkiah amiti</em>, true (halachic) sunset, is when the top of the 
  * sun's disk disappears from view at an elevation similar to the mountains of Eretz Yisrael.
  * This time is calculated as the point at which the center of the sun's disk is 1.583 degrees below the horizon.
  * A method that returns a <em>shaah zmanis</em> ({@link #getTemporalHour(Date, Date) temporal hour}) calculated 
  * based on the <a href="https://en.wikipedia.org/wiki/Shneur_Zalman_of_Liadi">Baal Hatanya</a>'s <em>netz
  * amiti</em> and <em>shkiah amiti</em> using a dip of 1.583&deg; below the sea level horizon. This calculation divides
  * the day based on the opinion of the Baal Hatanya that the day runs from {@link #getSunriseBaalHatanya() netz amiti}
  * to {@link #getSunsetBaalHatanya() <em>shkiah amiti</em>}. The calculations are based on a day from {@link
  * #getSunriseBaalHatanya() sea level <em>netz amiti</em>} to {@link #getSunsetBaalHatanya() sea level <em>shkiah amiti</em>}.
  * The day is split into 12 equal parts with each one being a <em>shaah zmanis</em>. This method is similar to {@link
  * #getTemporalHour}, but all calculations are based on a sea level sunrise and sunset.
  * @return the <code>long</code> millisecond length of a <em>shaah zmanis</em> calculated from
  *         {@link #getSunriseBaalHatanya() <em>netz amiti</em> (sunrise)} to {@link #getSunsetBaalHatanya() <em>shkiah amiti</em>
  *         ("real" sunset)}. If the calculation can't be computed such as in the Arctic Circle where there is at least one day a
  *         year where the sun does not rise, and one where it does not set, {@link Long#MIN_VALUE} will be returned. See
  *         detailed explanation on top of the {@link AstronomicalCalendar} documentation.
  * 
  * @see #getTemporalHour(Date, Date)
  * @see #getSunriseBaalHatanya()
  * @see #getSunsetBaalHatanya()
  * @see #ZENITH_1_POINT_583
  */
  getShaahZmanisBaalHatanya() {
    return this.getTemporalHour(this.getSunriseBaalHatanya(), this.getSunsetBaalHatanya());
  }
  /**
  * Returns the <a href="https://en.wikipedia.org/wiki/Shneur_Zalman_of_Liadi">Baal Hatanya</a>'s <em>alos</em>
  * (dawn) calculated as the time when the sun is 16.9&deg; below the eastern {@link #GEOMETRIC_ZENITH geometric horizon}
  * before {@link #getSunrise sunrise}. For more information the source of 16.9&deg; see {@link #ZENITH_16_POINT_9}.
  * 
  * @see #ZENITH_16_POINT_9
  * @return The <code>Date</code> of dawn. If the calculation can't be computed such as northern and southern
  *         locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not reach
  *         low enough below the horizon for this calculation, a null will be returned. See detailed explanation on
  *         top of the {@link AstronomicalCalendar} documentation.
  */
  getAlosBaalHatanya() {
    return this.getSunriseOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_16_POINT_9);
  }
  /**
  * This method returns the latest <em>zman krias shema</em> (time to recite Shema in the morning). This time is 3
  * {@link #getShaahZmanisBaalHatanya() <em>shaos zmaniyos</em>} (solar hours) after {@link #getSunriseBaalHatanya() 
  * <em>netz amiti</em> (sunrise)} based on the opinion of the Baal Hatanya that the day is calculated from
  * sunrise to sunset. This returns the time 3 * {@link #getShaahZmanisBaalHatanya()} after {@link #getSunriseBaalHatanya() 
  * <em>netz amiti</em> (sunrise)}.
  * 
  * @see ZmanimCalendar#getSofZmanShma(Date, Date)
  * @see #getShaahZmanisBaalHatanya()
  * @return the <code>Date</code> of the latest <em>zman shema</em> according to the Baal Hatanya. If the calculation
  *         can't be computed such as in the Arctic Circle where there is at least one day a year where the sun does
  *         not rise, and one where it does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  */
  getSofZmanShmaBaalHatanya() {
    return this.getSofZmanShma(this.getSunriseBaalHatanya(), this.getSunsetBaalHatanya());
  }
  /**
  * This method returns the latest <em>zman tfilah</em> (time to recite the morning prayers). This time is 4
  * hours into the day based on the opinion of the Baal Hatanya that the day is
  * calculated from sunrise to sunset. This returns the time 4 * {@link #getShaahZmanisBaalHatanya()} after
  * {@link #getSunriseBaalHatanya() <em>netz amiti</em> (sunrise)}.
  * 
  * @see ZmanimCalendar#getSofZmanTfila(Date, Date)
  * @see #getShaahZmanisBaalHatanya()
  * @return the <code>Date</code> of the latest <em>zman tfilah</em>. If the calculation can't be computed such as in
  *         the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it does
  *         not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  */
  getSofZmanTfilaBaalHatanya() {
    return this.getSofZmanTfila(this.getSunriseBaalHatanya(), this.getSunsetBaalHatanya());
  }
  /**
  * This method returns the latest time one is allowed eating <em>chametz</em> on <em>Erev Pesach</em> according to the
  * opinion of the Baal Hatanya. This time is identical to the {@link #getSofZmanTfilaBaalHatanya() <em>Sof zman tfilah</em>
  * Baal Hatanya}. This time is 4 hours into the day based on the opinion of the Baal Hatanya that the day is calculated
  * from sunrise to sunset. This returns the time 4 {@link #getShaahZmanisBaalHatanya()} after
  * {@link #getSunriseBaalHatanya() <em>netz amiti</em> (sunrise)}.
  * 
  * @see #getShaahZmanisBaalHatanya()
  * @see #getSofZmanTfilaBaalHatanya()
  * @return the <code>Date</code> one is allowed eating <em>chametz</em> on <em>Erev Pesach</em>. If the calculation can't
  *         be computed such as in the Arctic Circle where there is at least one day a year where the sun does not rise,
  *         and one where it does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  */
  getSofZmanAchilasChametzBaalHatanya() {
    return this.getSofZmanTfilaBaalHatanya();
  }
  /**
  * This method returns the latest time for burning <em>chametz</em> on <em>Erev Pesach</em> according to the opinion of
  * the Baal Hatanya. This time is 5 hours into the day based on the opinion of the Baal Hatanya that the day is calculated
  * from sunrise to sunset. This returns the time 5 * {@link #getShaahZmanisBaalHatanya()} after
  * {@link #getSunriseBaalHatanya() <em>netz amiti</em> (sunrise)}.
  * 
  * @see #getShaahZmanisBaalHatanya()
  * @return the <code>Date</code> of the latest time for burning <em>chametz</em> on <em>Erev Pesach</em>. If the calculation
  *         can't be computed such as in the Arctic Circle where there is at least one day a year where the sun does not rise,
  *         and one where it does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  */
  getSofZmanBiurChametzBaalHatanya() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getSunriseBaalHatanya(), this.getShaahZmanisBaalHatanya() * 5);
  }
  /**
  * This method returns the time of <em>mincha gedola</em>. <em>Mincha gedola</em> is the earliest time one can pray
  * <em>mincha</em>. The <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> is of the opinion that it is
  * better to delay <em>mincha</em> until {@link #getMinchaKetanaBaalHatanya() <em>mincha ketana</em>} while the
  * <a href="https://en.wikipedia.org/wiki/Asher_ben_Jehiel">Ra"sh</a>,
  * <a href="https://en.wikipedia.org/wiki/Jacob_ben_Asher">Tur</a>, <a href=
  * "https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> and others are of the opinion that <em>mincha</em> can be prayed
  * <em>lechatchila</em> starting at <em>mincha gedola</em>. This is calculated as 6.5 {@link #getShaahZmanisBaalHatanya()
  * sea level solar hours} after {@link #getSunriseBaalHatanya() <em>netz amiti</em> (sunrise)}. This calculation is based
  * on the opinion of the Baal Hatanya that the day is calculated from sunrise to sunset. This returns the time 6.5
  * * {@link #getShaahZmanisBaalHatanya()} after {@link #getSunriseBaalHatanya() <em>netz amiti</em> ("real" sunrise)}.
  * 
  * @see #getMinchaGedola(Date, Date)
  * @see #getShaahZmanisBaalHatanya()
  * @see #getMinchaKetanaBaalHatanya()
  * @return the <code>Date</code> of the time of <em>mincha gedola</em>. If the calculation can't be computed such as
  *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  */
  getMinchaGedolaBaalHatanya() {
    return this.getMinchaGedola(this.getSunriseBaalHatanya(), this.getSunsetBaalHatanya());
  }
  /**
  * This is a convenience method that returns the later of {@link #getMinchaGedolaBaalHatanya()} and
  * {@link #getMinchaGedola30Minutes()}. In the winter when 1/2 of a {@link #getShaahZmanisBaalHatanya()
  * <em>shaah zmanis</em>} is less than 30 minutes {@link #getMinchaGedola30Minutes()} will be returned, otherwise
  * {@link #getMinchaGedolaBaalHatanya()} will be returned.
  * 
  * @return the <code>Date</code> of the later of {@link #getMinchaGedolaBaalHatanya()} and {@link #getMinchaGedola30Minutes()}.
  *         If the calculation can't be computed such as in the Arctic Circle where there is at least one day a year
  *         where the sun does not rise, and one where it does not set, a null will be returned. See detailed
  *         explanation on top of the {@link AstronomicalCalendar} documentation.
  */
  getMinchaGedolaBaalHatanyaGreaterThan30() {
    if (this.getMinchaGedola30Minutes() === null || this.getMinchaGedolaBaalHatanya() === null) {
      return null;
    }
    return DateTime.max(this.getMinchaGedola30Minutes(), this.getMinchaGedolaBaalHatanya());
  }
  /**
  * This method returns the time of <em>mincha ketana</em>. This is the preferred earliest time to pray
  * <em>mincha</em> in the opinion of the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> and others.
  * For more information on this see the documentation on {@link #getMinchaGedolaBaalHatanya() <em>mincha gedola</em>}.
  * This is calculated as 9.5 {@link #getShaahZmanisBaalHatanya()  sea level solar hours} after {@link #getSunriseBaalHatanya()
  * <em>netz amiti</em> (sunrise)}. This calculation is calculated based on the opinion of the Baal Hatanya that the
  * day is calculated from sunrise to sunset. This returns the time 9.5 * {@link #getShaahZmanisBaalHatanya()} after {@link
  * #getSunriseBaalHatanya() <em>netz amiti</em> (sunrise)}.
  * 
  * @see #getMinchaKetana(Date, Date)
  * @see #getShaahZmanisBaalHatanya()
  * @see #getMinchaGedolaBaalHatanya()
  * @return the <code>Date</code> of the time of <em>mincha ketana</em>. If the calculation can't be computed such as
  *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
  *         documentation.
  */
  getMinchaKetanaBaalHatanya() {
    return this.getMinchaKetana(this.getSunriseBaalHatanya(), this.getSunsetBaalHatanya());
  }
  /**
  * This method returns the time of <em>plag hamincha</em>. This is calculated as 10.75 hours after sunrise. This
  * calculation is based on the opinion of the Baal Hatanya that the day is calculated
  * from sunrise to sunset. This returns the time 10.75 * {@link #getShaahZmanisBaalHatanya()} after
  * {@link #getSunriseBaalHatanya() <em>netz amiti</em> (sunrise)}.
  * 
  * @see #getPlagHamincha(Date, Date)
  * @return the <code>Date</code> of the time of <em>plag hamincha</em>. If the calculation can't be computed such as
  *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
  *         does not set, a null will be returned. See detailed explanation on top of the
  *         {@link AstronomicalCalendar} documentation.
  */
  getPlagHaminchaBaalHatanya() {
    return this.getPlagHamincha(this.getSunriseBaalHatanya(), this.getSunsetBaalHatanya());
  }
  /**
   * A method that returns <em>tzais</em> (nightfall) when the sun is 6&deg; below the western geometric horizon
   * (90&deg;) after {@link #getSunset sunset}. For information on the source of this calculation see
   * {@link #ZENITH_6_DEGREES}.
   *
   * @return The <code>Date</code> of nightfall. If the calculation can't be computed such as northern and southern
   *         locations even south of the Arctic Circle and north of the Antarctic Circle where the sun may not reach
   *         low enough below the horizon for this calculation, a null will be returned. See detailed explanation on
   *         top of the {@link AstronomicalCalendar} documentation.
   * @see #ZENITH_6_DEGREES
   */
  getTzaisBaalHatanya() {
    return this.getSunsetOffsetByDegrees(_ComplexZmanimCalendar.ZENITH_6_DEGREES);
  }
  /**
  * A utility methos to calculate zmanim based on <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe
  * Feinstein</a> as calculated in <a href="https://en.wikipedia.org/wiki/Mesivtha_Tifereth_Jerusalem">MTJ</a>, <a href=
  * "https://en.wikipedia.org/wiki/Mesivtha_Tifereth_Jerusalem">Yeshiva of Staten Island</a>, and Camp Yeshiva
  * of Staten Island. The day is split in two, from <em>alos</em> / sunrise to fixed local <em>chatzos</em>, and the
  * second half of the day, from fixed local <em>chatzos</em> to sunset / <em>tzais</em>. Morning based times are calculated
  * based on the first 6 hours, and afternoon times based on the second half of the day.
  * 
  * @param startOfHalfDay
  *            The start of the half day. This would be <em>alos</em> or sunrise for morning based times and fixed
  *            local <em>chatzos</em> for the second half of the day.
  * @param endOfHalfDay
  *            The end of the half day. This would be fixed local <em>chatzos</em> for morning based times and sunset
  *            or <em>tzais</em> for afternoon based times.
  * @param hours
  *            the number of hours to offset the beginning of the first or second half of the day
  * 
  * @return the <code>Date</code> of the later of {@link #getMinchaGedolaBaalHatanya()} and {@link #getMinchaGedola30Minutes()}.
  *         If the calculation can't be computed such as in the Arctic Circle where there is at least one day a year
  *         where the sun does not rise, and one where it does not set, a null will be returned. See detailed
  *         explanation on top of the {@link AstronomicalCalendar} documentation.
  *
  * @see ComplexZmanimCalendar#getFixedLocalChatzos()
  */
  getFixedLocalChatzosBasedZmanim(startOfHalfDay, endOfHalfDay, hours) {
    if (startOfHalfDay == null || endOfHalfDay == null) {
      return null;
    }
    const shaahZmanis = (endOfHalfDay.valueOf() - startOfHalfDay.valueOf()) / 6;
    return startOfHalfDay.plus({ milliseconds: shaahZmanis * hours });
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion of the
   * calculation of <em>sof zman krias shema</em> (latest time to recite <em>Shema</em> in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> that the
   * day is calculated from dawn to nightfall, but calculated using the first half of the day only. The half a day starts
   * at <em>alos</em> defined as {@link #getAlos18Degrees() 18&deg;} and ends at {@link #getFixedLocalChatzos() fixed local
   * chatzos}. <em>Sof Zman Shema</em> is 3 <em>shaos zmaniyos</em> (solar hours) after <em>alos</em> or half of this half-day.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getAlos18Degrees()
   * @see #getFixedLocalChatzos()
   * @see #getFixedLocalChatzosBasedZmanim(Date, Date, double)
   */
  getSofZmanShmaMGA18DegreesToFixedLocalChatzos() {
    return this.getFixedLocalChatzosBasedZmanim(this.getAlos18Degrees(), this.getFixedLocalChatzos(), 3);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion of the
   * calculation of <em>sof zman krias shema</em> (latest time to recite <em>Shema</em> in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> that the
   * day is calculated from dawn to nightfall, but calculated using the first half of the day only. The half a day starts
   * at <em>alos</em> defined as {@link #getAlos16Point1Degrees() 16.1&deg;} and ends at {@link #getFixedLocalChatzos() fixed local
   * chatzos}. <em>Sof Zman Shema</em> is 3 <em>shaos zmaniyos</em> (solar hours) after this <em>alos</em> or half of this half-day.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getAlos16Point1Degrees()
   * @see #getFixedLocalChatzos()
   * @see #getFixedLocalChatzosBasedZmanim(Date, Date, double)
   */
  getSofZmanShmaMGA16Point1DegreesToFixedLocalChatzos() {
    return this.getFixedLocalChatzosBasedZmanim(this.getAlos16Point1Degrees(), this.getFixedLocalChatzos(), 3);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion of the
   * calculation of <em>sof zman krias shema</em> (latest time to recite <em>Shema</em> in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> that the
   * day is calculated from dawn to nightfall, but calculated using the first half of the day only. The half a day starts
   * at <em>alos</em> defined as {@link #getAlos90() 90 minutes before sunrise} and ends at {@link #getFixedLocalChatzos()
   * fixed local chatzos}. <em>Sof Zman Shema</em> is 3 <em>shaos zmaniyos</em> (solar hours) after this <em>alos</em> or
   * half of this half-day.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getAlos90()
   * @see #getFixedLocalChatzos()
   * @see #getFixedLocalChatzosBasedZmanim(Date, Date, double)
   */
  getSofZmanShmaMGA90MinutesToFixedLocalChatzos() {
    return this.getFixedLocalChatzosBasedZmanim(this.getAlos90(), this.getFixedLocalChatzos(), 3);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion of the
   * calculation of <em>sof zman krias shema</em> (latest time to recite <em>Shema</em> in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Avraham_Gombinern">Magen Avraham (MGA)</a> that the
   * day is calculated from dawn to nightfall, but calculated using the first half of the day only. The half a day starts
   * at <em>alos</em> defined as {@link #getAlos72() 72 minutes before sunrise} and ends at {@link #getFixedLocalChatzos()
   * fixed local chatzos}. <em>Sof Zman Shema</em> is 3 <em>shaos zmaniyos</em> (solar hours) after this <em>alos</em> or
   * half of this half-day.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getAlos72()
   * @see #getFixedLocalChatzos()
   * @see #getFixedLocalChatzosBasedZmanim(Date, Date, double)
   */
  getSofZmanShmaMGA72MinutesToFixedLocalChatzos() {
    return this.getFixedLocalChatzosBasedZmanim(this.getAlos72(), this.getFixedLocalChatzos(), 3);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion of the
   * calculation of <em>sof zman krias shema</em> (latest time to recite <em>Shema</em> in the morning) according to the
   * opinion of the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> that the day is calculated from
   * sunrise to sunset, but calculated using the first half of the day only. The half a day starts at {@link #getSunrise()
   * sunrise} and ends at {@link #getFixedLocalChatzos() fixed local chatzos}. <em>Sof zman Shema</em> is 3 <em>shaos
   * zmaniyos</em> (solar hours) after sunrise or half of this half-day.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getSunrise()
   * @see #getFixedLocalChatzos()
   * @see #getFixedLocalChatzosBasedZmanim(Date, Date, double)
   */
  getSofZmanShmaGRASunriseToFixedLocalChatzos() {
    return this.getFixedLocalChatzosBasedZmanim(this.getSunrise(), this.getFixedLocalChatzos(), 3);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion of the
   * calculation of <em>sof zman tfila</em> (<em>zman tfilah</em> (the latest time to recite the morning prayers))
   * according to the opinion of the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> that the day is
   * calculated from sunrise to sunset, but calculated using the first half of the day only. The half a day starts at
   * {@link #getSunrise() sunrise} and ends at {@link #getFixedLocalChatzos() fixed local chatzos}. <em>Sof zman tefila</em>
   * is 4 <em>shaos zmaniyos</em> (solar hours) after sunrise or 2/3 of this half-day.
   * 
   * @return the <code>Date</code> of the latest <em>zman krias shema</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   * @see #getSunrise()
   * @see #getFixedLocalChatzos()
   * @see #getFixedLocalChatzosBasedZmanim(Date, Date, double)
   */
  getSofZmanTfilaGRASunriseToFixedLocalChatzos() {
    return this.getFixedLocalChatzosBasedZmanim(this.getSunrise(), this.getFixedLocalChatzos(), 4);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion of
   * the calculation of <em>mincha gedola</em>, the earliest time one can pray <em>mincha</em> <a href=
   * "https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a>that is 30 minutes after {@link #getFixedLocalChatzos() fixed
   * local chatzos}.
   * 
   * @return the <code>Date</code> of the time of <em>mincha gedola</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   * 
   * @see #getMinchaGedola()
   * @see #getFixedLocalChatzos()
   * @see #getMinchaKetanaGRAFixedLocalChatzosToSunset
   */
  getMinchaGedolaGRAFixedLocalChatzos30Minutes() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getFixedLocalChatzos(), _ComplexZmanimCalendar.MINUTE_MILLIS * 30);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion
   * of the calculation of <em>mincha ketana</em> (the preferred time to recite the <em>mincha prayers</em> according to
   * the opinion of the <a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> and others) calculated according
   * to the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> that is 3.5 <em>shaos zmaniyos</em> (solar
   * hours) after {@link #getFixedLocalChatzos() fixed local chatzos}.
   * 
   * @return the <code>Date</code> of the time of <em>mincha gedola</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   *         
   * @see #getMinchaGedola()
   * @see #getFixedLocalChatzos()
   * @see #getMinchaGedolaGRAFixedLocalChatzos30Minutes
   */
  getMinchaKetanaGRAFixedLocalChatzosToSunset() {
    return this.getFixedLocalChatzosBasedZmanim(this.getFixedLocalChatzos(), this.getSunset(), 3.5);
  }
  /**
   * This method returns <a href="https://en.wikipedia.org/wiki/Moshe_Feinstein">Rav Moshe Feinstein's</a> opinion
   * of the calculation of <em>plag hamincha</em>. This method returns <em>plag hamincha</em> calculated according to the
   * <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> that the day ends at sunset and is 4.75 <em>shaos
   * zmaniyos</em> (solar hours) after {@link #getFixedLocalChatzos() fixed local chatzos}.
   * 
   * @return the <code>Date</code> of the time of <em>mincha gedola</em>. If the calculation can't be computed such as
   *         in the Arctic Circle where there is at least one day a year where the sun does not rise, and one where it
   *         does not set, a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   *         
   * @see #getPlagHamincha()
   * @see #getFixedLocalChatzos()
   * @see #getMinchaKetanaGRAFixedLocalChatzosToSunset
   * @see #getMinchaGedolaGRAFixedLocalChatzos30Minutes
   */
  getPlagHaminchaGRAFixedLocalChatzosToSunset() {
    return this.getFixedLocalChatzosBasedZmanim(this.getFixedLocalChatzos(), this.getSunset(), 4.75);
  }
  /**
   * Method to return <em>tzais</em> (dusk) calculated as 50 minutes after sea level sunset. This method returns
   * <em>tzais</em> (nightfall) based on the opinion of Rabbi Moshe Feinstein for the New York area. This time should
   * not be used for latitudes different than the NY area.
   * 
   * @return the <code>Date</code> representing the time. If the calculation can't be computed such as in the Arctic
   *         Circle where there is at least one day a year where the sun does not rise, and one where it does not set,
   *         a null will be returned. See detailed explanation on top of the {@link AstronomicalCalendar}
   *         documentation.
   */
  getTzais50() {
    return _ComplexZmanimCalendar.getTimeOffset(this.getElevationAdjustedSunset(), 50 * _ComplexZmanimCalendar.MINUTE_MILLIS);
  }
  /**
   * A method for calculating <em>samuch lemincha ketana</em>, / near <em>mincha ketana</em> time that is half an hour before
   * {@link #getMinchaKetana()} or is 9 * {@link #getShaahZmanisGra() <em>shaos zmaniyos</em>} (solar hours) after {@link
   * #getSunrise() sunrise} or {@link #getSeaLevelSunrise() sea level sunrise} (depending on the {@link #isUseElevation()}
   * setting), calculated according to the <a href="https://en.wikipedia.org/wiki/Vilna_Gaon">GRA</a> using a day starting at
   * sunrise and ending at sunset. This is the time that eating or other activity can't begin prior to praying <em>mincha</em>.
   * The calculation used is 9 * {@link #getShaahZmanis16Point1Degrees()} after {@link #getAlos16Point1Degrees() <em>alos</em>
   * 16.1&deg;}. See the <a href="https://hebrewbooks.org/pdfpager.aspx?req=60387&st=&pgnum=294">Mechaber and Mishna Berurah
   * 232</a> for details.
   * 
   * @see #getShaahZmanisGra()
   * @see #getSamuchLeMinchaKetana16Point1Degrees()
   * @return the <code>Date</code> of the time of <em>samuch lemincha ketana</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getSamuchLeMinchaKetanaGRA() {
    return this.getSamuchLeMinchaKetana(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
  }
  /**
   * A method for calculating <em>samuch lemincha ketana</em>, / near <em>mincha ketana</em> time that is half an hour before
   * {@link #getMinchaGedola16Point1Degrees()}  or 9 * <em>shaos zmaniyos</em> (temporal hours) after the start of the day,
   * calculated using a day starting and ending 16.1&deg; below the horizon. This is the time that eating or other activity
   * can't begin prior to praying <em>mincha</em>. The calculation used is 9 * {@link #getShaahZmanis16Point1Degrees()} after
   * {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;}. See the <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=60387&st=&pgnum=294">Mechaber and Mishna Berurah 232</a>.
   * 
   * @see #getShaahZmanis16Point1Degrees()
   * @return the <code>Date</code> of the time of <em>samuch lemincha ketana</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getSamuchLeMinchaKetana16Point1Degrees() {
    return this.getSamuchLeMinchaKetana(this.getAlos16Point1Degrees(), this.getTzais16Point1Degrees());
  }
  /**
   * A method for calculating <em>samuch lemincha ketana</em>, / near <em>mincha ketana</em> time that is half an hour before
   * {@link #getMinchaKetana72Minutes()}  or 9 * <em>shaos zmaniyos</em> (temporal hours) after the start of the day,
   * calculated using a day starting 72 minutes before sunrise and ending 72 minutes after sunset. This is the time that eating
   * or other activity can't begin prior to praying <em>mincha</em>. The calculation used is 9 * {@link
   * #getShaahZmanis16Point1Degrees()} after {@link #getAlos16Point1Degrees() <em>alos</em> 16.1&deg;}. See the <a href=
   * "https://hebrewbooks.org/pdfpager.aspx?req=60387&st=&pgnum=294">Mechaber and Mishna Berurah 232</a>.
   * 
   * @see #getShaahZmanis16Point1Degrees()
   * @return the <code>Date</code> of the time of <em>samuch lemincha ketana</em>. If the calculation can't be computed such
   *         as northern and southern locations even south of the Arctic Circle and north of the Antarctic Circle
   *         where the sun may not reach low enough below the horizon for this calculation, a null will be returned.
   *         See detailed explanation on top of the {@link AstronomicalCalendar} documentation.
   */
  getSamuchLeMinchaKetana72Minutes() {
    return this.getSamuchLeMinchaKetana(this.getAlos72(), this.getTzais72());
  }
};
/**
 * The zenith of 3.7&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> that <em>tzais</em> is the
 * time it takes to walk 3/4 of a <em>Mil</em> at 18 minutes a <em>Mil</em>, or 13.5 minutes after sunset. The sun
 * is 3.7&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} at this time in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>.
 * 
 * @see #getTzaisGeonim3Point7Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_3_POINT_7", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 3.7);
/**
 * The zenith of 3.8&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) based on the opinion of the <em>Geonim</em> that <em>tzais</em> is the
 * time it takes to walk 3/4 of a <em>Mil</em> at 18 minutes a <em>Mil</em>, or 13.5 minutes after sunset. The sun
 * is 3.8&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} at this time in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>.
 * 
 * @see #getTzaisGeonim3Point8Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_3_POINT_8", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 3.8);
/**
 * The zenith of 5.95&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) according to some opinions. This calculation is based on the position of
 * the sun 24 minutes after sunset in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>,
 * which calculates to 5.95&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * 
 * @see #getTzaisGeonim5Point95Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_5_POINT_95", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 5.95);
/**
 * The zenith of 7.083&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This is often referred to as
 * 7&deg;5' or 7&deg; and 5 minutes. This calculation is used for calculating <em>alos</em> (dawn) and
 * <em>tzais</em> (nightfall) according to some opinions. This calculation is based on observation of 3 medium sized
 * stars by Dr. Baruch Cohen in his calendar published in in 1899 in Strasbourg, France. This calculates to
 * 7.0833333&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}. The <a href="https://hebrewbooks.org/1053">Sh"Ut
 * Melamed Leho'il</a> in Orach Chaim 30 agreed to this <em>zman</em>, as did the Sh"Ut Bnei Tziyon, Tenuvas Sadeh and
 * it is very close to the time of the <a href="https://hebrewbooks.org/22044">Mekor Chesed</a> of the Sefer chasidim.
 * It is close to the position of the sun 30 minutes after sunset in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, but not
 * Exactly. The actual position of the sun 30 minutes after sunset in Jerusalem at the equilux is 7.205&deg; and
 * 7.199&deg; at the equinox. See Hazmanim Bahalacha vol 2, pages 520-521 for details.
 * @todo Hyperlink the proper sources.
 * 
 * @see #getTzaisGeonim7Point083Degrees()
 * @see #getBainHashmashosRT13Point5MinutesBefore7Point083Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_7_POINT_083", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 7 + 5 / 60);
/**
 * The zenith of 10.2&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>misheyakir</em> according to some opinions. This calculation is based on the position of the sun
 * 45 minutes before {@link #getSunrise sunrise} in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> which
 * calculates to 10.2&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * 
 * @see #getMisheyakir10Point2Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_10_POINT_2", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 10.2);
/**
 * The zenith of 11&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>misheyakir</em> according to some opinions. This calculation is based on the position of the sun
 * 48 minutes before {@link #getSunrise sunrise} in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, which
 * calculates to 11&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * 
 * @see #getMisheyakir11Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_11_DEGREES", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 11);
/**
 * The zenith of 11.5&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>misheyakir</em> according to some opinions. This calculation is based on the position of the sun
 * 52 minutes before {@link #getSunrise sunrise} in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>, which
 * calculates to 11.5&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * 
 * @see #getMisheyakir11Point5Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_11_POINT_5", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 11.5);
/**
 * The zenith of 13.24&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating Rabbeinu Tam's <em>bain hashmashos</em> according to some opinions.
 * NOTE: See comments on {@link #getBainHashmashosRT13Point24Degrees} for additional details about the degrees.
 * 
 * @see #getBainHashmashosRT13Point24Degrees
 * 
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_13_POINT_24", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 13.24);
/**
 * The zenith of 19&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>alos</em> according to some opinions.
 * 
 * @see #getAlos19Degrees()
 * @see #ZENITH_19_POINT_8
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_19_DEGREES", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 19);
/**
 * The zenith of 19.8&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>alos</em> (dawn) and <em>tzais</em> (nightfall) according to some opinions. This calculation is
 * based on the position of the sun 90 minutes after sunset in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> which
 * calculates to 19.8&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * 
 * @see #getTzais19Point8Degrees()
 * @see #getAlos19Point8Degrees()
 * @see #getAlos90()
 * @see #getTzais90()
 * @see #ZENITH_19_DEGREES
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_19_POINT_8", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 19.8);
/**
 * The zenith of 26&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>alos</em> (dawn) and <em>tzais</em> (nightfall) according to some opinions. This calculation is
 * based on the position of the sun {@link #getAlos120() 120 minutes} after sunset in Jerusalem o<a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> which
 * calculates to 26&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}. Since the level of darkness when the sun is
 * 26&deg; and at a point when the level of darkness is long past the 18&deg; point where the darkest point is reached,
 * it should only be used <em>lechumra</em> such as delaying the start of nighttime <em>mitzvos</em> or avoiding eating
 * this early on a fast day.
 * 
 * @see #getAlos26Degrees()
 * @see #getTzais26Degrees()
 * @see #getAlos120()
 * @see #getTzais120()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_26_DEGREES", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 26);
/**
 * The zenith of 4.37&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) according to some opinions. This calculation is based on the position of
 * the sun {@link #getTzaisGeonim4Point37Degrees() 16 7/8 minutes} after sunset (3/4 of a 22.5-minute <em>Mil</em>)
 * in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a>,
 * which calculates to 4.37&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * 
 * @see #getTzaisGeonim4Point37Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_4_POINT_37", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 4.37);
/**
 * The zenith of 4.61&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) according to some opinions. This calculation is based on the position of
 * the sun {@link #getTzaisGeonim4Point37Degrees() 18 minutes} after sunset (3/4 of a 24-minute <em>Mil</em>) in
 * Jerusalem <a href="https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox
 * / equilux</a>, which calculates to 4.61&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * @todo add documentation links
 * 
 * @see #getTzaisGeonim4Point61Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_4_POINT_61", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 4.61);
/**
 * The zenith of 4.8&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;).
 * @todo Add more documentation.
 * @see #getTzaisGeonim4Point8Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_4_POINT_8", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 4.8);
/**
 * The zenith of 3.65&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) according to some opinions. This calculation is based on the position of
 * the sun {@link #getTzaisGeonim3Point65Degrees() 13.5 minutes} after sunset (3/4 of an 18-minute <em>Mil</em>)
 * in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> which
 * calculates to 3.65&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 * 
 * @see #getTzaisGeonim3Point65Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_3_POINT_65", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 3.65);
/**
 * The zenith of 3.676&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;).
 * @todo Add more documentation.
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_3_POINT_676", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 3.676);
/**
 * The zenith of 5.88&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;).
 * @todo Add more documentation.
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_5_POINT_88", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 5.88);
/**
 * The zenith of 1.583&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>netz amiti</em> (sunrise) and <em>shkiah amiti</em> (sunset) based on the opinion of the
 * <a href="https://en.wikipedia.org/wiki/Shneur_Zalman_of_Liadi">Baal Hatanya</a>.
 *
 * @see #getSunriseBaalHatanya()
 * @see #getSunsetBaalHatanya()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_1_POINT_583", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 1.583);
/**
 * The zenith of 16.9&deg; below geometric zenith (90&deg;). This calculation is used for determining <em>alos</em>
 * (dawn) based on the opinion of the Baal Hatanya. It is based on the calculation that the time between dawn
 * and <em>netz amiti</em> (sunrise) is 72 minutes, the time that is takes to walk 4 <em>mil</em> at 18 minutes
 * a <em>mil</em> (<a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> and others). The sun's position at 72
 * minutes before {@link #getSunriseBaalHatanya <em>netz amiti</em> (sunrise)} in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> is
 * 16.9&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 *
 * @see #getAlosBaalHatanya()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_16_POINT_9", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 16.9);
/**
 * The zenith of 16.9&deg; below geometric zenith (90&deg;). This calculation is used for determining <em>alos</em>
 * (dawn) based on the opinion of the Baal Hatanya. It is based on the calculation that the time between dawn
 * and <em>netz amiti</em> (sunrise) is 72 minutes, the time that is takes to walk 4 <em>mil</em> at 18 minutes
 * a <em>mil</em> (<a href="https://en.wikipedia.org/wiki/Maimonides">Rambam</a> and others). The sun's position at 72
 * minutes before {@link #getSunriseBaalHatanya <em>netz amiti</em> (sunrise)} in Jerusalem <a href=
 * "https://kosherjava.com/2022/01/12/equinox-vs-equilux-zmanim-calculations/">around the equinox / equilux</a> is
 * 16.9&deg; below {@link #GEOMETRIC_ZENITH geometric zenith}.
 *
 * @see #getAlosBaalHatanya()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_6_DEGREES", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 6);
/**
 * The zenith of 6.45&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) according to some opinions. This is based on the calculations of <a href=
 * "https://en.wikipedia.org/wiki/Yechiel_Michel_Tucazinsky">Rabbi Yechiel Michel Tucazinsky</a> of the position of
 * the sun no later than {@link #getTzaisGeonim6Point45Degrees() 31 minutes} after sunset in Jerusalem, and at the
 * height of the summer solstice, this <em>zman</em> is 28 minutes after <em>shkiah</em>. This computes to 6.45&deg;
 * below {@link #GEOMETRIC_ZENITH geometric zenith}. This calculation is found in the <a href=
 * "https://hebrewbooks.org/pdfpager.aspx?req=50536&st=&pgnum=51">Birur Halacha Yoreh Deah 262</a> it the commonly
 * used <em>zman</em> in Israel. It should be noted that this differs from the 6.1&deg;/6.2&deg; calculation for
 * Rabbi Tucazinsky's time as calculated by the Hazmanim Bahalacha Vol II chapter 50:7 (page 515).
 * 
 * @see #getTzaisGeonim6Point45Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_6_POINT_45", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 6.45);
/**
 * The zenith of 7.65&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>misheyakir</em> according to some opinions.
 * 
 * @see #getMisheyakir7Point65Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_7_POINT_65", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 7.65);
/**
 * The zenith of 7.67&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> according to some opinions.
 * 
 * @see #getTzaisGeonim7Point67Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_7_POINT_67", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 7.67);
/**
 * The zenith of 9.3&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>tzais</em> (nightfall) according to some opinions.
 * 
 * @see #getTzaisGeonim9Point3Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_9_POINT_3", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 9.3);
/**
 * The zenith of 9.5&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>misheyakir</em> according to some opinions.
 * 
 * @see #getMisheyakir9Point5Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_9_POINT_5", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 9.5);
/**
 * The zenith of 9.75&deg; below {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating <em>alos</em> (dawn) and <em>tzais</em> (nightfall) according to some opinions.
 * 
 * @see #getTzaisGeonim9Point75Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_9_POINT_75", _ComplexZmanimCalendar.GEOMETRIC_ZENITH + 9.75);
/**
 * The zenith of 2.1&deg; above {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating the start of <em>bain hashmashos</em> (twilight) of 13.5 minutes before sunset converted to degrees
 * according to the Yereim. As is traditional with degrees below the horizon, this is calculated without refraction
 * and from the center of the sun. It would be 0.833&deg; less without this. 
 * 
 * @see #getBainHashmashosYereim2Point1Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_MINUS_2_POINT_1", _ComplexZmanimCalendar.GEOMETRIC_ZENITH - 2.1);
/**
 * The zenith of 2.8&deg; above {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating the start of <em>bain hashmashos</em> (twilight) of 16.875 minutes before sunset converted to degrees
 * according to the Yereim. As is traditional with degrees below the horizon, this is calculated without refraction
 * and from the center of the sun. It would be 0.833&deg; less without this.
 * 
 * @see #getBainHashmashosYereim2Point8Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_MINUS_2_POINT_8", _ComplexZmanimCalendar.GEOMETRIC_ZENITH - 2.8);
/**
 * The zenith of 3.05&deg; above {@link #GEOMETRIC_ZENITH geometric zenith} (90&deg;). This calculation is used for
 * calculating the start of <em>bain hashmashos</em> (twilight) of 18 minutes before sunset converted to degrees
 * according to the Yereim. As is traditional with degrees below the horizon, this is calculated without refraction
 * and from the center of the sun. It would be 0.833&deg; less without this.
 * 
 * @see #getBainHashmashosYereim3Point05Degrees()
 */
__publicField$9(_ComplexZmanimCalendar, "ZENITH_MINUS_3_POINT_05", _ComplexZmanimCalendar.GEOMETRIC_ZENITH - 3.05);
let ComplexZmanimCalendar = _ComplexZmanimCalendar;

var __defProp$8 = Object.defineProperty;
var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$8 = (obj, key, value) => {
  __defNormalProp$8(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _Time = class _Time {
  /**
   * A constructor with 2 overloads:
   * - A constructor that sets the time by milliseconds.
   *   The milliseconds are converted to hours, minutes, seconds and milliseconds. If the
   *   milliseconds are negative it will call {@link #setIsNegative(boolean)}.
   * - A constructor with parameters for the hours, minutes, seconds and millisecods.
   * @param hoursOrMillis
   * @param minutes
   * @param seconds
   * @param milliseconds
   */
  constructor(hoursOrMillis, minutes, seconds = 0, milliseconds = 0) {
    /**
     * @see #getHours()
     */
    __publicField$8(this, "hours", 0);
    /**
     * @see #getMinutes()
     */
    __publicField$8(this, "minutes", 0);
    /**
     * @see #getSeconds()
     */
    __publicField$8(this, "seconds", 0);
    /**
     * @see #getMilliseconds()
     */
    __publicField$8(this, "milliseconds", 0);
    /**
     * @see #isNegative()
     * @see #setIsNegative(boolean)
     */
    __publicField$8(this, "negative", false);
    if (minutes) {
      this.hours = hoursOrMillis;
      this.minutes = minutes;
      this.seconds = seconds;
      this.milliseconds = milliseconds;
    } else {
      let adjustedMillis = hoursOrMillis;
      if (adjustedMillis < 0) {
        this.negative = true;
        adjustedMillis = Math.abs(adjustedMillis);
      }
      this.hours = Math.trunc(adjustedMillis / _Time.HOUR_MILLIS);
      adjustedMillis = adjustedMillis - this.hours * _Time.HOUR_MILLIS;
      this.minutes = Math.trunc(adjustedMillis / _Time.MINUTE_MILLIS);
      adjustedMillis = adjustedMillis - this.minutes * _Time.MINUTE_MILLIS;
      this.seconds = Math.trunc(adjustedMillis / _Time.SECOND_MILLIS);
      adjustedMillis = adjustedMillis - this.seconds * _Time.SECOND_MILLIS;
      this.milliseconds = adjustedMillis;
    }
  }
  /*
        public Time(millis: number) {
            this((int) millis);
        }
  
        public Time(millis: number) {
            adjustedMillis: number = millis;
            if (adjustedMillis < 0) {
                this.isNegative = true;
                adjustedMillis = Math.abs(adjustedMillis);
            }
            this.hours = adjustedMillis / HOUR_MILLIS;
            adjustedMillis = adjustedMillis - this.hours * HOUR_MILLIS;
  
            this.minutes = adjustedMillis / MINUTE_MILLIS;
            adjustedMillis = adjustedMillis - this.minutes * MINUTE_MILLIS;
  
            this.seconds = adjustedMillis / SECOND_MILLIS;
            adjustedMillis = adjustedMillis - this.seconds * SECOND_MILLIS;
  
            this.milliseconds = adjustedMillis;
        }
    */
  /**
   * Does the time represent a negative time 9such as using this to subtract time from another Time.
   * @return if the time is negative.
   */
  isNegative() {
    return this.negative;
  }
  /**
   * Set this to represent a negative time.
   * @param isNegative that the Time represents negative time
   */
  setIsNegative(isNegative) {
    this.negative = isNegative;
  }
  /**
   * @return Returns the hour.
   */
  getHours() {
    return this.hours;
  }
  /**
   * @param hours
   *            The hours to set.
   */
  setHours(hours) {
    this.hours = hours;
  }
  /**
   * @return Returns the minutes.
   */
  getMinutes() {
    return this.minutes;
  }
  /**
   * @param minutes
   *            The minutes to set.
   */
  setMinutes(minutes) {
    this.minutes = minutes;
  }
  /**
   * @return Returns the seconds.
   */
  getSeconds() {
    return this.seconds;
  }
  /**
   * @param seconds
   *            The seconds to set.
   */
  setSeconds(seconds) {
    this.seconds = seconds;
  }
  /**
   * @return Returns the milliseconds.
   */
  getMilliseconds() {
    return this.milliseconds;
  }
  /**
   * @param milliseconds
   *            The milliseconds to set.
   */
  setMilliseconds(milliseconds) {
    this.milliseconds = milliseconds;
  }
  /**
   * Returns the time in milliseconds by converting hours, minutes and seconds into milliseconds.
   * @return the time in milliseconds
   */
  getTime() {
    return this.hours * _Time.HOUR_MILLIS + this.minutes * _Time.MINUTE_MILLIS + this.seconds * _Time.SECOND_MILLIS + this.milliseconds;
  }
  /**
   * @deprecated This depends on a circular dependency. Use <pre>new ZmanimFormatter(TimeZone.getTimeZone("UTC")).format(time)</pre> instead.
   */
  // eslint-disable-next-line class-methods-use-this
  toString() {
    throw new UnsupportedError("This method is deprecated, due to the fact that it depends on a circular dependency. Use `new ZmanimFormatter(TimeZone.getTimeZone('UTC')).format(time)` instead");
  }
};
/** milliseconds in a second. */
__publicField$8(_Time, "SECOND_MILLIS", 1e3);
/** milliseconds in a minute. */
__publicField$8(_Time, "MINUTE_MILLIS", _Time.SECOND_MILLIS * 60);
/** milliseconds in an hour. */
__publicField$8(_Time, "HOUR_MILLIS", _Time.MINUTE_MILLIS * 60);
let Time = _Time;

var __defProp$7 = Object.defineProperty;
var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$7 = (obj, key, value) => {
  __defNormalProp$7(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Zman {
  constructor(dateOrDuration, label) {
    /**
     * The name / label of the <em>zman</em>.
     */
    __publicField$7(this, "label");
    /**
     * The {@link Date} of the <em>zman</em>
     */
    __publicField$7(this, "zman");
    /**
     * The duration if the <em>zman</em> is  a {@link AstronomicalCalendar#getTemporalHour() temporal hour} (or the various
     * <em>shaah zmanis</em> base times such as {@link ZmanimCalendar#getShaahZmanisGra()  <em>shaah Zmanis GRA</em>} or
     * {@link ComplexZmanimCalendar#getShaahZmanis16Point1Degrees() <em>shaah Zmanis 16.1&deg;</em>}).
     */
    __publicField$7(this, "duration");
    /**
     * A longer description or explanation of a <em>zman</em>.
     */
    __publicField$7(this, "description");
    this.label = label;
    if (DateTime.isDateTime(dateOrDuration)) {
      this.zman = dateOrDuration;
    } else if (typeof dateOrDuration === "number") {
      this.duration = dateOrDuration;
    }
  }
  /**
   * A {@link Comparator} that will compare and sort <em>zmanim</em> by date/time order. Compares its two arguments by the zman's date/time
   * order. Returns a negative integer, zero, or a positive integer as the first argument is less than, equal to, or greater
   * than the second.
   * Please note that this class will handle cases where either the {@code Zman} is a null or {@link #getZman()} returns a null.
   */
  static compareDateOrder(zman1, zman2) {
    var _a, _b;
    const firstMillis = ((_a = zman1.zman) == null ? void 0 : _a.valueOf()) || 0;
    const secondMillis = ((_b = zman2.zman) == null ? void 0 : _b.valueOf()) || 0;
    return IntegerUtils.compare(firstMillis, secondMillis);
  }
  /**
   * A {@link Comparator} that will compare and sort zmanim by zmanim label order. Compares its two arguments by the zmanim label
   * name order. Returns a negative integer, zero, or a positive integer as the first argument is less than, equal to, or greater
   * than the second.
   * Please note that this class will will sort cases where either the {@code Zman} is a null or {@link #label} returns a null
   * as empty {@code String}s.
   */
  static compareNameOrder(zman1, zman2) {
    return StringUtils.compareTo(zman1.label || "", zman2.label || "");
  }
  /**
   * A {@link Comparator} that will compare and sort duration based <em>zmanim</em>  such as
   * {@link AstronomicalCalendar#getTemporalHour() temporal hour} (or the various <em>shaah zmanis</em> times
   * such as <em>{@link ZmanimCalendar#getShaahZmanisGra() shaah zmanis GRA}</em> or
   * {@link ComplexZmanimCalendar#getShaahZmanis16Point1Degrees() <em>shaah zmanis 16.1&deg;</em>}). Returns a negative
   * integer, zero, or a positive integer as the first argument is less than, equal to, or greater than the second.
   * Please note that this class will will sort cases where {@code Zman} is a null.
   */
  static compareDurationOrder(zman1, zman2) {
    return IntegerUtils.compare(zman1.duration || 0, zman2.duration || 0);
  }
  toString() {
    return `
Label:			${this.label}`.concat(`
Zman:			${this.zman}`).concat(`
Duration:			${this.duration}`).concat(`
Description:			${this.description}`);
  }
}

var __defProp$6 = Object.defineProperty;
var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$6 = (obj, key, value) => {
  __defNormalProp$6(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const methodBlacklist = [
  "getAdjustedDate",
  "getDate",
  "getElevationAdjustedSunrise",
  "getElevationAdjustedSunset",
  "getMidnightLastNight",
  "getMidnightTonight",
  "getSunriseBaalHatanya",
  "getSunsetBaalHatanya"
];
const methodWhitelist = [
  // These methods have parameters, but have default values.
  "getMinchaGedola",
  "getMinchaKetana",
  "getPlagHamincha",
  "getSofZmanKidushLevana15Days",
  "getSofZmanKidushLevanaBetweenMoldos",
  "getSunTransit",
  "getTchilasZmanKidushLevana3Days",
  "getTchilasZmanKidushLevana7Days",
  "getTemporalHour"
];
const _ZmanimFormatter = class _ZmanimFormatter {
  constructor(formatOrTimeZone, dateFormat, timeZoneId) {
    /**
     * Setting to prepent a zero to single digit hours.
     * @see #setSettings(boolean, boolean, boolean)
     */
    __publicField$6(this, "prependZeroHours", false);
    /**
     * @see #setSettings(boolean, boolean, boolean)
     */
    __publicField$6(this, "useSeconds", false);
    /**
     * @see #setSettings(boolean, boolean, boolean)
     */
    __publicField$6(this, "useMillis", false);
    /**
     * the formatter for hours.
     */
    __publicField$6(this, "hourNF");
    /**
     * @see #setDateFormat(SimpleDateFormat)
     */
    __publicField$6(this, "dateFormat");
    /**
     * @see #setTimeZone(TimeZone)
     */
    __publicField$6(this, "timeZoneId");
    /**
     * Defaults to {@link #SEXAGESIMAL_XSD_FORMAT}.
     * @see #setTimeFormat(int)
     */
    __publicField$6(this, "timeFormat", _ZmanimFormatter.SEXAGESIMAL_XSD_FORMAT);
    let format;
    if (dateFormat) {
      format = formatOrTimeZone;
    } else {
      format = 0;
      dateFormat = "h:mm:ss";
      timeZoneId = formatOrTimeZone;
    }
    this.setTimeZone(timeZoneId);
    if (this.prependZeroHours) {
      this.hourNF = 2;
    }
    this.setTimeFormat(format);
    this.setDateFormat(dateFormat);
  }
  // TimeZone.getTimeZone("UTC");
  /**
   * @return the timeZone
   */
  getTimeZone() {
    return this.timeZoneId;
  }
  /**
   * @param timeZoneId
   *            the timeZone to set
   */
  setTimeZone(timeZoneId) {
    this.timeZoneId = timeZoneId;
  }
  /**
   * Sets the format to use for formatting.
   *
   * @param format
   *            int the format constant to use.
   */
  setTimeFormat(format) {
    this.timeFormat = format;
    switch (format) {
      case _ZmanimFormatter.SEXAGESIMAL_XSD_FORMAT:
        this.setSettings(true, true, true);
        break;
      case _ZmanimFormatter.SEXAGESIMAL_FORMAT:
        this.setSettings(false, false, false);
        break;
      case _ZmanimFormatter.SEXAGESIMAL_SECONDS_FORMAT:
        this.setSettings(false, true, false);
        break;
      case _ZmanimFormatter.SEXAGESIMAL_MILLIS_FORMAT:
        this.setSettings(false, true, true);
        break;
    }
  }
  /**
   * Sets the SimpleDateFormat Object
   * @param dateFormat the SimpleDateFormat Object to set
   */
  setDateFormat(dateFormat) {
    this.dateFormat = dateFormat;
  }
  /**
   * returns the SimpleDateFormat Object
   * @return the SimpleDateFormat Object
   */
  getDateFormat() {
    return this.dateFormat;
  }
  /**
   * Sets various format settings.
   * @param prependZeroHours  if to prepend a zero for single digit hours (so that 1 'oclock is displayed as 01)
   * @param useSeconds should seconds be used in the time format
   * @param useMillis should milliseconds be used informatting time.
   */
  setSettings(prependZeroHours, useSeconds, useMillis) {
    this.prependZeroHours = prependZeroHours;
    this.useSeconds = useSeconds;
    this.useMillis = useMillis;
  }
  /**
   * A method that formats milliseconds into a time format.
   *
   * @param milliseconds
   *            The time in milliseconds.
   * @return String The formatted <code>String</code>
   */
  /*
      public format(milliseconds: number): string {
          return this.format(milliseconds);
      }
  */
  /**
   * A method that formats milliseconds into a time format.
   *
   * @param millis
   *            The time in milliseconds.
   * @return String The formatted <code>String</code>
   */
  /*
      public format(millis: number): string {
          return format(new Time(millis));
      }
  */
  /**
   * A method that formats {@link Time}objects.
   *
   * @param time
   *            The time <code>Object</code> to be formatted.
   * @return String The formatted <code>String</code>
   */
  format(timeOrMillis) {
    let time;
    if (timeOrMillis instanceof Time) {
      time = timeOrMillis;
    } else {
      time = new Time(timeOrMillis);
    }
    if (this.timeFormat === _ZmanimFormatter.XSD_DURATION_FORMAT) {
      return _ZmanimFormatter.formatXSDDurationTime(time);
    }
    let sb = padZeros(time.getHours(), this.hourNF).concat(":").concat(padZeros(time.getMinutes(), _ZmanimFormatter.minuteSecondNF));
    if (this.useSeconds) {
      sb = sb.concat(":").concat(padZeros(time.getSeconds(), _ZmanimFormatter.minuteSecondNF));
    }
    if (this.useMillis) {
      sb = sb.concat(".").concat(padZeros(time.getMilliseconds(), _ZmanimFormatter.milliNF));
    }
    return sb;
  }
  /**
   * Formats a date using this class's {@link #getDateFormat() date format}.
   *
   * @param dateTime - the date to format
   * @return the formatted String
   */
  formatDateTime(dateTime) {
    const _dateTime = dateTime.setZone(this.getTimeZone());
    if (this.dateFormat === _ZmanimFormatter.XSD_DATE_FORMAT) {
      return this.getXSDateTime(_dateTime);
    }
    return _dateTime.toFormat(this.dateFormat);
  }
  /**
   * The date:date-time function returns the current date and time as a date/time string. The date/time string that's
   * returned must be a string in the format defined as the lexical representation of xs:dateTime in <a
   * href="http://www.w3.org/TR/xmlschema11-2/#dateTime">[3.3.8 dateTime]</a> of <a
   * href="http://www.w3.org/TR/xmlschema11-2/">[XML Schema 1.1 Part 2: Datatypes]</a>. The date/time format is
   * basically CCYY-MM-DDThh:mm:ss, although implementers should consult <a
   * href="http://www.w3.org/TR/xmlschema11-2/">[XML Schema 1.1 Part 2: Datatypes]</a> and <a
   * href="http://www.iso.ch/markete/8601.pdf">[ISO 8601]</a> for details. The date/time string format must include a
   * time zone, either a Z to indicate Coordinated Universal Time or a + or - followed by the difference between the
   * difference from UTC represented as hh:mm.
   * @param dateTime - the UTC Date Object
   * @return the XSD dateTime
   */
  getXSDateTime(dateTime) {
    return dateTime.setZone(this.getTimeZone()).toFormat(_ZmanimFormatter.XSD_DATE_FORMAT.concat("ZZ"));
  }
  /**
   * Represent the hours and minutes with two-digit strings.
   *
   * @param digits
   *            hours or minutes.
   * @return two-digit String representation of hrs or minutes.
   */
  static formatDigits(digits) {
    const dd = Math.abs(digits).toString();
    return dd.length === 1 ? `0${dd}` : dd;
  }
  /**
   * This returns the xml representation of an xsd:duration object.
   *
   * @param millis
   *            the duration in milliseconds
   * @return the xsd:duration formatted String
   */
  /*
      public formatXSDDurationTime(millis: number): string {
          return formatXSDDurationTime(new Time(millis));
      }
  */
  /**
   * This returns the xml representation of an xsd:duration object.
   *
   * @param time
   *            the duration as a Time object
   * @return the xsd:duration formatted String
   */
  static formatXSDDurationTime(timeOrMillis) {
    let time;
    if (timeOrMillis instanceof Time) {
      time = timeOrMillis;
    } else {
      time = new Time(timeOrMillis);
    }
    let duration;
    if (time.getHours() !== 0 || time.getMinutes() !== 0 || time.getSeconds() !== 0 || time.getMilliseconds() !== 0) {
      duration = "P".concat("T");
      if (time.getHours() !== 0)
        duration = duration.concat(`${time.getHours()}H`);
      if (time.getMinutes() !== 0)
        duration = duration.concat(`${time.getMinutes()}M`);
      if (time.getSeconds() !== 0 || time.getMilliseconds() !== 0) {
        duration = duration.concat(`${time.getSeconds()}.${padZeros(time.getMilliseconds(), _ZmanimFormatter.milliNF)}`);
        duration = duration.concat("S");
      }
      if (duration.length === 1)
        duration.concat("T0S");
      if (time.isNegative()) {
        duration = "-" + duration;
      }
    }
    return duration.toString();
  }
  static formatDecimal(num) {
    const hasDecimal = num - Math.trunc(num) > 0;
    return hasDecimal ? num.toString() : num.toFixed(1);
  }
  /**
   * A method that returns an XML formatted <code>String</code> representing the serialized <code>Object</code>. The
   * format used is:
   *
   * <pre>
   *  &lt;AstronomicalTimes date=&quot;1969-02-08&quot; type=&quot;AstronomicalCalendar algorithm=&quot;US Naval Almanac Algorithm&quot; location=&quot;Lakewood, NJ&quot; latitude=&quot;40.095965&quot; longitude=&quot;-74.22213&quot; elevation=&quot;31.0&quot; timeZoneName=&quot;Eastern Standard Time&quot; timeZoneID=&quot;America/New_York&quot; timeZoneOffset=&quot;-5&quot;&gt;
   *     &lt;Sunrise&gt;2007-02-18T06:45:27-05:00&lt;/Sunrise&gt;
   *     &lt;TemporalHour&gt;PT54M17.529S&lt;/TemporalHour&gt;
   *     ...
   *   &lt;/AstronomicalTimes&gt;
   * </pre>
   *
   * Note that the output uses the <a href="http://www.w3.org/TR/xmlschema11-2/#dateTime">xsd:dateTime</a> format for
   * times such as sunrise, and <a href="http://www.w3.org/TR/xmlschema11-2/#duration">xsd:duration</a> format for
   * times that are a duration such as the length of a
   * {@link AstronomicalCalendar#getTemporalHour() temporal hour}. The output of this method is
   * returned by the {@link #toString() toString}.
   *
   * @param astronomicalCalendar the AstronomicalCalendar Object
   *
   * @return The XML formatted <code>String</code>. The format will be:
   *
   *         <pre>
   *  &lt;AstronomicalTimes date=&quot;1969-02-08&quot; type=&quot;AstronomicalCalendar algorithm=&quot;US Naval Almanac Algorithm&quot; location=&quot;Lakewood, NJ&quot; latitude=&quot;40.095965&quot; longitude=&quot;-74.22213&quot; elevation=&quot;31.0&quot; timeZoneName=&quot;Eastern Standard Time&quot; timeZoneID=&quot;America/New_York&quot; timeZoneOffset=&quot;-5&quot;&gt;
   *     &lt;Sunrise&gt;2007-02-18T06:45:27-05:00&lt;/Sunrise&gt;
   *     &lt;TemporalHour&gt;PT54M17.529S&lt;/TemporalHour&gt;
   *     ...
   *  &lt;/AstronomicalTimes&gt;
   * </pre>
   *
   *         TODO: add proper schema, and support for nulls. XSD duration (for solar hours), should probably return
   *         nil and not P
   * @deprecated
   */
  static toXML() {
    throw new UnsupportedError("This method is not supported.");
  }
  /**
   * A method that returns a JSON formatted <code>String</code> representing the serialized <code>Object</code>. The
   * format used is:
   * <pre>
   * {
   *    &quot;metadata&quot;:{
   *      &quot;date&quot;:&quot;1969-02-08&quot;,
   *      &quot;type&quot;:&quot;AstronomicalCalendar&quot;,
   *      &quot;algorithm&quot;:&quot;US Naval Almanac Algorithm&quot;,
   *      &quot;location&quot;:&quot;Lakewood, NJ&quot;,
   *      &quot;latitude&quot;:&quot;40.095965&quot;,
   *      &quot;longitude&quot;:&quot;-74.22213&quot;,
   *      &quot;elevation:&quot;31.0&quot;,
   *      &quot;timeZoneName&quot;:&quot;Eastern Standard Time&quot;,
   *      &quot;timeZoneID&quot;:&quot;America/New_York&quot;,
   *      &quot;timeZoneOffset&quot;:&quot;-5&quot;},
   *    &quot;AstronomicalTimes&quot;:{
   *     &quot;Sunrise&quot;:&quot;2007-02-18T06:45:27-05:00&quot;,
   *     &quot;TemporalHour&quot;:&quot;PT54M17.529S&quot;
   *     ...
   *     }
   * }
   * </pre>
   *
   * Note that the output uses the <a href="http://www.w3.org/TR/xmlschema11-2/#dateTime">xsd:dateTime</a> format for
   * times such as sunrise, and <a href="http://www.w3.org/TR/xmlschema11-2/#duration">xsd:duration</a> format for
   * times that are a duration such as the length of a
   * {@link AstronomicalCalendar#getTemporalHour() temporal hour}.
   *
   * @param astronomicalCalendar the AstronomicalCalendar Object
   *
   * @return The JSON formatted <code>String</code>. The format will be:
   * <pre>
   * {
   *    &quot;metadata&quot;:{
   *      &quot;date&quot;:&quot;1969-02-08&quot;,
   *      &quot;type&quot;:&quot;AstronomicalCalendar&quot;,
   *      &quot;algorithm&quot;:&quot;US Naval Almanac Algorithm&quot;,
   *      &quot;location&quot;:&quot;Lakewood, NJ&quot;,
   *      &quot;latitude&quot;:&quot;40.095965&quot;,
   *      &quot;longitude&quot;:&quot;-74.22213&quot;,
   *      &quot;elevation:&quot;31.0&quot;,
   *      &quot;timeZoneName&quot;:&quot;Eastern Standard Time&quot;,
   *      &quot;timeZoneID&quot;:&quot;America/New_York&quot;,
   *      &quot;timeZoneOffset&quot;:&quot;-5&quot;},
   *    &quot;AstronomicalTimes&quot;:{
   *     &quot;Sunrise&quot;:&quot;2007-02-18T06:45:27-05:00&quot;,
   *     &quot;TemporalHour&quot;:&quot;PT54M17.529S&quot;
   *     ...
   *     }
   * }
   * </pre>
   */
  static toJSON(astronomicalCalendar) {
    const json = {
      metadata: _ZmanimFormatter.getOutputMetadata(astronomicalCalendar)
    };
    const key = _ZmanimFormatter.getOutputKey(astronomicalCalendar);
    json[key] = _ZmanimFormatter.getZmanimOutput(astronomicalCalendar);
    return json;
  }
  static getOutputKey(astronomicalCalendar) {
    switch (true) {
      case astronomicalCalendar instanceof ComplexZmanimCalendar:
        return "Zmanim";
      case astronomicalCalendar instanceof ZmanimCalendar:
        return "BasicZmanim";
      case astronomicalCalendar instanceof AstronomicalCalendar:
      default:
        return "AstronomicalTimes";
    }
  }
  static getOutputMetadata(astronomicalCalendar) {
    const df = "yyyy-MM-dd";
    return {
      date: astronomicalCalendar.getDate().toFormat(df),
      type: astronomicalCalendar.getClassName(),
      algorithm: astronomicalCalendar.getAstronomicalCalculator().getCalculatorName(),
      location: astronomicalCalendar.getGeoLocation().getLocationName(),
      latitude: astronomicalCalendar.getGeoLocation().getLatitude().toString(),
      longitude: astronomicalCalendar.getGeoLocation().getLongitude().toString(),
      elevation: _ZmanimFormatter.formatDecimal(astronomicalCalendar.getGeoLocation().getElevation()),
      timeZoneName: TimeZone.getDisplayName(astronomicalCalendar.getGeoLocation().getTimeZone(), astronomicalCalendar.getDate()),
      timeZoneID: astronomicalCalendar.getGeoLocation().getTimeZone(),
      timeZoneOffset: _ZmanimFormatter.formatDecimal(TimeZone.getOffset(
        astronomicalCalendar.getGeoLocation().getTimeZone(),
        astronomicalCalendar.getDate().valueOf()
      ) / _ZmanimFormatter.HOUR_MILLIS)
    };
  }
  static getZmanimOutput(astronomicalCalendar) {
    const formatter = new _ZmanimFormatter(
      _ZmanimFormatter.XSD_DURATION_FORMAT,
      _ZmanimFormatter.XSD_DATE_FORMAT,
      astronomicalCalendar.getGeoLocation().getTimeZone()
    );
    const dateList = [];
    let durationList = [];
    const otherList = [];
    Utils.getAllMethodNames(astronomicalCalendar, true).filter((method) => includeMethod(method, astronomicalCalendar)).map((method) => ({
      methodName: method,
      value: astronomicalCalendar[method]
    })).filter((methodObj) => DateTime.isDateTime(methodObj.value) || typeof methodObj.value === "number" || methodObj.value === null).forEach((methodObj) => {
      const tagName = methodObj.methodName.substring(3);
      if (DateTime.isDateTime(methodObj.value)) {
        const zman = {
          zman: methodObj.value,
          label: tagName
        };
        dateList.push(zman);
      } else if (typeof methodObj.value === "number") {
        const zman = {
          duration: methodObj.value,
          label: tagName
        };
        durationList.push(zman);
      } else {
        otherList.push(tagName);
      }
    });
    dateList.sort(Zman.compareDateOrder);
    durationList = durationList.filter((zman) => zman.duration > 1e3).sort(Zman.compareDurationOrder);
    const timesData = Object.assign(
      {},
      Object.fromEntries(dateList.map((zman) => [zman.label, formatter.formatDateTime(zman.zman)])),
      Object.fromEntries(durationList.map((zman) => [zman.label, formatter.format(Math.trunc(zman.duration))])),
      Object.fromEntries(otherList.map((tagName) => [tagName, "N/A"]))
    );
    return timesData;
  }
};
/**
 * the formatter for minutes as seconds.
 */
__publicField$6(_ZmanimFormatter, "minuteSecondNF", 2);
/**
 * the formatter for minutes as milliseconds.
 */
__publicField$6(_ZmanimFormatter, "milliNF", 3);
/**
 * Format using hours, minutes, seconds and milliseconds using the xsd:time format. This format will return
 * 00.00.00.0 when formatting 0.
 */
__publicField$6(_ZmanimFormatter, "SEXAGESIMAL_XSD_FORMAT", 0);
/**
 * Format using standard decimal format with 5 positions after the decimal.
 */
__publicField$6(_ZmanimFormatter, "DECIMAL_FORMAT", 1);
/** Format using hours and minutes. */
__publicField$6(_ZmanimFormatter, "SEXAGESIMAL_FORMAT", 2);
/** Format using hours, minutes and seconds. */
__publicField$6(_ZmanimFormatter, "SEXAGESIMAL_SECONDS_FORMAT", 3);
/** Format using hours, minutes, seconds and milliseconds. */
__publicField$6(_ZmanimFormatter, "SEXAGESIMAL_MILLIS_FORMAT", 4);
/** constant for milliseconds in a minute (60,000) */
__publicField$6(_ZmanimFormatter, "MINUTE_MILLIS", 60 * 1e3);
/** constant for milliseconds in an hour (3,600,000) */
__publicField$6(_ZmanimFormatter, "HOUR_MILLIS", _ZmanimFormatter.MINUTE_MILLIS * 60);
/**
 * Format using the XSD Duration format. This is in the format of PT1H6M7.869S (P for period (duration), T for time,
 * H, M and S indicate hours, minutes and seconds.
 */
__publicField$6(_ZmanimFormatter, "XSD_DURATION_FORMAT", 5);
__publicField$6(_ZmanimFormatter, "XSD_DATE_FORMAT", "yyyy-LL-dd'T'HH:mm:ss");
let ZmanimFormatter = _ZmanimFormatter;
function includeMethod(method, astronomicalCalendar) {
  if (method in methodWhitelist)
    return true;
  return !(method in methodBlacklist) && astronomicalCalendar[method].length === 0 && method.startsWith("get");
}

var __defProp$5 = Object.defineProperty;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$5 = (obj, key, value) => {
  __defNormalProp$5(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _GeoLocationUtils = class _GeoLocationUtils {
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
    return _GeoLocationUtils.vincentyFormula(location, destination, _GeoLocationUtils.INITIAL_BEARING);
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
    return _GeoLocationUtils.vincentyFormula(location, destination, _GeoLocationUtils.FINAL_BEARING);
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
    return _GeoLocationUtils.vincentyFormula(location, destination, _GeoLocationUtils.DISTANCE);
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
    const a = 6378137;
    const b = 63567523142e-4;
    const f = 1 / 298.257223563;
    const L = MathUtils.degreesToRadians(destination.getLongitude() - location.getLongitude());
    const U1 = Math.atan((1 - f) * Math.tan(MathUtils.degreesToRadians(location.getLatitude())));
    const U2 = Math.atan((1 - f) * Math.tan(MathUtils.degreesToRadians(destination.getLatitude())));
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
      sinSigma = Math.sqrt(cosU2 * sinLambda * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
      if (sinSigma === 0)
        return 0;
      cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
      sigma = Math.atan2(sinSigma, cosSigma);
      sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
      cosSqAlpha = 1 - sinAlpha * sinAlpha;
      cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
      if (Number.isNaN(cos2SigmaM))
        cos2SigmaM = 0;
      C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
      lambdaP = lambda;
      lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    }
    if (iterLimit === 0)
      return Number.NaN;
    const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    const distance = b * A * (sigma - deltaSigma);
    const fwdAz = MathUtils.radiansToDegrees(Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
    const revAz = MathUtils.radiansToDegrees(Math.atan2(cosU1 * sinLambda, -sinU1 * cosU2 + cosU1 * sinU2 * cosLambda));
    if (formula === _GeoLocationUtils.DISTANCE) {
      return distance;
    } else if (formula === _GeoLocationUtils.INITIAL_BEARING) {
      return fwdAz;
    } else if (formula === _GeoLocationUtils.FINAL_BEARING) {
      return revAz;
    }
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
    const dPhi = Math.log(Math.tan(MathUtils.degreesToRadians(destination.getLatitude()) / 2 + Math.PI / 4) / Math.tan(MathUtils.degreesToRadians(location.getLatitude()) / 2 + Math.PI / 4));
    if (Math.abs(dLon) > Math.PI)
      dLon = dLon > 0 ? -(2 * Math.PI - dLon) : 2 * Math.PI + dLon;
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
    const earthRadius = 6378137;
    const dLat = MathUtils.degreesToRadians(location.getLatitude()) - MathUtils.degreesToRadians(destination.getLatitude());
    let dLon = Math.abs(MathUtils.degreesToRadians(location.getLongitude()) - MathUtils.degreesToRadians(destination.getLongitude()));
    const dPhi = Math.log(Math.tan(MathUtils.degreesToRadians(location.getLatitude()) / 2 + Math.PI / 4) / Math.tan(MathUtils.degreesToRadians(destination.getLatitude()) / 2 + Math.PI / 4));
    let q = dLat / dPhi;
    if (!Number.isFinite(q)) {
      q = Math.cos(MathUtils.degreesToRadians(destination.getLatitude()));
    }
    if (dLon > Math.PI) {
      dLon = 2 * Math.PI - dLon;
    }
    const d = Math.sqrt(dLat * dLat + q * q * dLon * dLon);
    return d * earthRadius;
  }
};
/**
 * Constant for a distance type calculation.
 * @see #getGeodesicDistance(GeoLocation, GeoLocation)
 */
__publicField$5(_GeoLocationUtils, "DISTANCE", 0);
/**
 * Constant for a initial bearing type calculation.
 * @see #getGeodesicInitialBearing(GeoLocation, GeoLocation)
 */
__publicField$5(_GeoLocationUtils, "INITIAL_BEARING", 1);
/**
 * Constant for a final bearing type calculation.
 * @see #getGeodesicFinalBearing(GeoLocation, GeoLocation)
 */
__publicField$5(_GeoLocationUtils, "FINAL_BEARING", 2);
let GeoLocationUtils = _GeoLocationUtils;

var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$4 = (obj, key, value) => {
  __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _SunTimesCalculator = class _SunTimesCalculator extends AstronomicalCalculator {
  /**
   * @see AstronomicalCalculator#getCalculatorName()
   */
  // eslint-disable-next-line class-methods-use-this
  getCalculatorName() {
    return "US Naval Almanac Algorithm";
  }
  /**
   * @see AstronomicalCalculator#getUTCSunrise(Calendar, GeoLocation, double, boolean)
   */
  getUTCSunrise(date, geoLocation, zenith, adjustForElevation) {
    const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
    const adjustedZenith = this.adjustZenith(zenith, elevation);
    const doubleTime = _SunTimesCalculator.getTimeUTC(
      date,
      geoLocation.getLongitude(),
      geoLocation.getLatitude(),
      adjustedZenith,
      true
    );
    return doubleTime;
  }
  /**
   * @see AstronomicalCalculator#getUTCSunset(Calendar, GeoLocation, double, boolean)
   */
  getUTCSunset(date, geoLocation, zenith, adjustForElevation) {
    const elevation = adjustForElevation ? geoLocation.getElevation() : 0;
    const adjustedZenith = this.adjustZenith(zenith, elevation);
    const doubleTime = _SunTimesCalculator.getTimeUTC(
      date,
      geoLocation.getLongitude(),
      geoLocation.getLatitude(),
      adjustedZenith,
      false
    );
    return doubleTime;
  }
  /**
   * sin of an angle in degrees
   */
  static sinDeg(deg) {
    return Math.sin(MathUtils.degreesToRadians(deg));
  }
  /**
   * acos of an angle, result in degrees
   */
  static acosDeg(x) {
    return MathUtils.radiansToDegrees(Math.acos(x));
  }
  /**
   * asin of an angle, result in degrees
   */
  static asinDeg(x) {
    return MathUtils.radiansToDegrees(Math.asin(x));
  }
  /**
   * tan of an angle in degrees
   */
  static tanDeg(deg) {
    return Math.tan(MathUtils.degreesToRadians(deg));
  }
  /**
   * Calculate cosine of the angle in degrees
   *
   * @param deg degrees
   * @return cosine of the angle in degrees
   */
  static cosDeg(deg) {
    return Math.cos(MathUtils.degreesToRadians(deg));
  }
  /**
   * Get time difference between location's longitude and the Meridian, in hours. West of Meridian has a negative time
   * difference
   */
  static getHoursFromMeridian(longitude) {
    return longitude / _SunTimesCalculator.DEG_PER_HOUR;
  }
  /**
   * Calculate the approximate time of sunset or sunrise in days since midnight Jan 1st, assuming 6am and 6pm events. We
   * need this figure to derive the Sun's mean anomaly.
   *
   * @param dayOfYear the day of year
   * @param hoursFromMeridian hours from the meridian
   * @param isSunrise true for sunrise and false for sunset
   *
   * @return the approximate time of sunset or sunrise in days since midnight Jan 1st, assuming 6am and 6pm events. We
   * need this figure to derive the Sun's mean anomaly.
   */
  static getApproxTimeDays(dayOfYear, hoursFromMeridian, isSunrise) {
    if (isSunrise) {
      return dayOfYear + (6 - hoursFromMeridian) / 24;
    }
    return dayOfYear + (18 - hoursFromMeridian) / 24;
  }
  /**
   * Calculate the Sun's mean anomaly in degrees, at sunrise or sunset, given the longitude in degrees
   *
   * @param dayOfYear the day of the year
   * @param longitude longitude
   * @param isSunrise true for sunrise and false for sunset
   * @return the Sun's mean anomaly in degrees
   */
  static getMeanAnomaly(dayOfYear, longitude, isSunrise) {
    return 0.9856 * _SunTimesCalculator.getApproxTimeDays(dayOfYear, _SunTimesCalculator.getHoursFromMeridian(longitude), isSunrise) - 3.289;
  }
  /**
   * Calculates the Sun's true longitude in degrees. The result is an angle gte 0 and lt 360. Requires the Sun's mean
   * anomaly, also in degrees
   */
  static getSunTrueLongitude(sunMeanAnomaly) {
    let l = sunMeanAnomaly + 1.916 * _SunTimesCalculator.sinDeg(sunMeanAnomaly) + 0.02 * _SunTimesCalculator.sinDeg(2 * sunMeanAnomaly) + 282.634;
    if (l >= 360) {
      l = l - 360;
    }
    if (l < 0) {
      l = l + 360;
    }
    return l;
  }
  /**
   * Calculates the Sun's right ascension in hours, given the Sun's true longitude in degrees. Input and output are
   * angles gte 0 and lt 360.
   */
  static getSunRightAscensionHours(sunTrueLongitude) {
    const a = 0.91764 * _SunTimesCalculator.tanDeg(sunTrueLongitude);
    let ra = 360 / (2 * Math.PI) * Math.atan(a);
    const lQuadrant = Math.floor(sunTrueLongitude / 90) * 90;
    const raQuadrant = Math.floor(ra / 90) * 90;
    ra += lQuadrant - raQuadrant;
    return ra / _SunTimesCalculator.DEG_PER_HOUR;
  }
  /**
   * Calculate the cosine of the Sun's local hour angle
   *
   * @param sunTrueLongitude the sun's true longitude
   * @param latitude the latitude
   * @param zenith the zenith
   * @return the cosine of the Sun's local hour angle
   */
  static getCosLocalHourAngle(sunTrueLongitude, latitude, zenith) {
    const sinDec = 0.39782 * _SunTimesCalculator.sinDeg(sunTrueLongitude);
    const cosDec = _SunTimesCalculator.cosDeg(_SunTimesCalculator.asinDeg(sinDec));
    return (_SunTimesCalculator.cosDeg(zenith) - sinDec * _SunTimesCalculator.sinDeg(latitude)) / (cosDec * _SunTimesCalculator.cosDeg(latitude));
  }
  /**
   * Calculate local mean time of rising or setting. By `local' is meant the exact time at the location, assuming that
   * there were no time zone. That is, the time difference between the location and the Meridian depended entirely on
   * the longitude. We can't do anything with this time directly; we must convert it to UTC and then to a local time.
   * The result is expressed as a fractional number of hours since midnight
   *
   * @param localHour the local hour
   * @param sunRightAscensionHours the sun's right ascention in hours
   * @param approxTimeDays approximate time days
   *
   * @return the fractional number of hours since midnight as a double
   */
  static getLocalMeanTime(localHour, sunRightAscensionHours, approxTimeDays) {
    return localHour + sunRightAscensionHours - 0.06571 * approxTimeDays - 6.622;
  }
  /**
   * Get sunrise or sunset time in UTC, according to flag.
   *
   * @param year
   *            4-digit year
   * @param month
   *            month, 1-12 (not the zero based Java month
   * @param day
   *            day of month, 1-31
   * @param longitude
   *            in degrees, longitudes west of Meridian are negative
   * @param latitude
   *            in degrees, latitudes south of equator are negative
   * @param zenith
   *            Sun's zenith, in degrees
   * @param type
   *            type of calculation to carry out {@link #TYPE_SUNRISE} or {@link #TYPE_SUNRISE}.
   *
   * @return the time as a double. If an error was encountered in the calculation (expected behavior for some
   *         locations such as near the poles, {@link Double.NaN} will be returned.
   */
  static getTimeUTC(date, longitude, latitude, zenith, isSunrise) {
    const dayOfYear = date.ordinal;
    const sunMeanAnomaly = _SunTimesCalculator.getMeanAnomaly(dayOfYear, longitude, isSunrise);
    const sunTrueLong = _SunTimesCalculator.getSunTrueLongitude(sunMeanAnomaly);
    const sunRightAscensionHours = _SunTimesCalculator.getSunRightAscensionHours(sunTrueLong);
    const cosLocalHourAngle = _SunTimesCalculator.getCosLocalHourAngle(sunTrueLong, latitude, zenith);
    let localHourAngle;
    if (isSunrise) {
      localHourAngle = 360 - _SunTimesCalculator.acosDeg(cosLocalHourAngle);
    } else {
      localHourAngle = _SunTimesCalculator.acosDeg(cosLocalHourAngle);
    }
    const localHour = localHourAngle / _SunTimesCalculator.DEG_PER_HOUR;
    const localMeanTime = _SunTimesCalculator.getLocalMeanTime(
      localHour,
      sunRightAscensionHours,
      _SunTimesCalculator.getApproxTimeDays(dayOfYear, _SunTimesCalculator.getHoursFromMeridian(longitude), isSunrise)
    );
    let processedTime = localMeanTime - _SunTimesCalculator.getHoursFromMeridian(longitude);
    while (processedTime < 0) {
      processedTime += 24;
    }
    while (processedTime >= 24) {
      processedTime -= 24;
    }
    return processedTime;
  }
};
/**
 * The number of degrees of longitude that corresponds to one hour time difference.
 */
__publicField$4(_SunTimesCalculator, "DEG_PER_HOUR", 360 / 24);
let SunTimesCalculator = _SunTimesCalculator;

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => {
  __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _Daf = class _Daf {
  /**
   * Constructor that creates a Daf setting the {@link #setMasechtaNumber(int) masechta Number} and
   * {@link #setDaf(int) daf Number}
   *
   * @param masechtaNumber the masechtaNumber in the order of the Daf Yomi to set
   * @param daf the daf (page) number to set
   */
  constructor(masechtaNumber, daf) {
    /**
     * {@link #getMasechtaNumber()} and {@link #setMasechtaNumber(int)}.
     */
    __publicField$3(this, "masechtaNumber");
    /**
     * See {@link #getDaf()} and {@link #setDaf(int)}.
     */
    __publicField$3(this, "daf");
    this.masechtaNumber = masechtaNumber;
    this.daf = daf;
  }
  /**
   * gets the masechta number of the currently set Daf. The sequence is: Berachos, Shabbos, Eruvin, Pesachim,
   * Shekalim, Yoma, Sukkah, Beitzah, Rosh Hashana, Taanis, Megillah, Moed Katan, Chagigah, Yevamos, Kesubos, Nedarim,
   * Nazir, Sotah, Gitin, Kiddushin, Bava Kamma, Bava Metzia, Bava Basra, Sanhedrin, Makkos, Shevuos, Avodah Zarah,
   * Horiyos, Zevachim, Menachos, Chullin, Bechoros, Arachin, Temurah, Kerisos, Meilah, Kinnim, Tamid, Midos and
   * Niddah.
   * @return the masechtaNumber
   * @see #setMasechtaNumber(int)
   */
  getMasechtaNumber() {
    return this.masechtaNumber;
  }
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
  setMasechtaNumber(masechtaNumber) {
    this.masechtaNumber = masechtaNumber;
  }
  /**
   * Returns the daf (page number) of the Daf Yomi
   * @return the daf (page number) of the Daf Yomi
   */
  getDaf() {
    return this.daf;
  }
  /**
   * Sets the daf (page number) of the Daf Yomi
   * @param daf the daf (page) number
   */
  setDaf(daf) {
    this.daf = daf;
  }
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
  getMasechtaTransliterated() {
    return _Daf.masechtosBavliTransliterated[this.masechtaNumber];
  }
  /**
   * Setter method to allow overriding of the default list of masechtos transliterated into into Latin chars. The default
   * uses Ashkenazi American English transliteration.
   *
   * @param masechtosBavliTransliterated the list of transliterated Bavli masechtos to set.
   * @see #getMasechtaTransliterated()
   */
  static setMasechtaTransliterated(masechtosBavliTransliterated) {
    _Daf.masechtosBavliTransliterated = masechtosBavliTransliterated;
  }
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
  getMasechta() {
    return _Daf.masechtosBavli[this.masechtaNumber];
  }
  /**
   * Returns the transliterated name of the masechta (tractate) of the Daf Yomi in Yerushalmi. The list of mashechtos
   * is: Berachos, Pe'ah, Demai, Kilayim, Shevi'is, Terumos, Ma'asros, Ma'aser Sheni, Chalah, Orlah, Bikurim, Shabbos,
   * Eruvin, Pesachim, Beitzah, Rosh Hashanah, Yoma, Sukah, Ta'anis, Shekalim, Megilah, Chagigah, Moed Katan, Yevamos,
   * Kesuvos, Sotah, Nedarim, Nazir, Gitin, Kidushin, Bava Kama, Bava Metzia, Bava Basra, Sanhedrin, Makos, Shevuos,
   * Avodah Zarah, Horayos, Nidah, and No Daf Today.
   *
   * @return the transliterated name of the masechta (tractate) of the Daf Yomi such as Berachos.
   */
  getYerushlmiMasechtaTransliterated() {
    return _Daf.masechtosYerushalmiTransliterated[this.masechtaNumber];
  }
  /**
   * Setter method to allow overriding of the default list of Yerushalmi masechtos transliterated into into Latin chars.
   * The default uses Ashkenazi American English transliteration.
   *
   * @param masechtosYerushalmiTransliterated the list of transliterated Yerushalmi masechtos to set.
   */
  static setYerushlmiMasechtaTransliterated(masechtosYerushalmiTransliterated) {
    _Daf.masechtosYerushalmiTransliterated = masechtosYerushalmiTransliterated;
  }
  /**
   * Returns the Yerushlmi masechta (tractate) of the Daf Yomi in Hebrew, It will return
   * &#x05D1;&#x05E8;&#x05DB;&#x05D5;&#x05EA; for Berachos.
   *
   * @return the Yerushalmi masechta (tractate) of the Daf Yomi in Hebrew, It will return
   *         &#x05D1;&#x05E8;&#x05DB;&#x05D5;&#x05EA; for Berachos.
   */
  getYerushalmiMasechta() {
    return _Daf.masechtosYerushlmi[this.masechtaNumber];
  }
};
/**
 * See {@link #getMasechtaTransliterated()} and {@link #setMasechtaTransliterated(String[])}.
 */
__publicField$3(_Daf, "masechtosBavliTransliterated", [
  "Berachos",
  "Shabbos",
  "Eruvin",
  "Pesachim",
  "Shekalim",
  "Yoma",
  "Sukkah",
  "Beitzah",
  "Rosh Hashana",
  "Taanis",
  "Megillah",
  "Moed Katan",
  "Chagigah",
  "Yevamos",
  "Kesubos",
  "Nedarim",
  "Nazir",
  "Sotah",
  "Gitin",
  "Kiddushin",
  "Bava Kamma",
  "Bava Metzia",
  "Bava Basra",
  "Sanhedrin",
  "Makkos",
  "Shevuos",
  "Avodah Zarah",
  "Horiyos",
  "Zevachim",
  "Menachos",
  "Chullin",
  "Bechoros",
  "Arachin",
  "Temurah",
  "Kerisos",
  "Meilah",
  "Kinnim",
  "Tamid",
  "Midos",
  "Niddah"
]);
/**
 * See {@link #getMasechta()}.
 */
__publicField$3(_Daf, "masechtosBavli", [
  "\u05D1\u05E8\u05DB\u05D5\u05EA",
  "\u05E9\u05D1\u05EA",
  "\u05E2\u05D9\u05E8\u05D5\u05D1\u05D9\u05DF",
  "\u05E4\u05E1\u05D7\u05D9\u05DD",
  "\u05E9\u05E7\u05DC\u05D9\u05DD",
  "\u05D9\u05D5\u05DE\u05D0",
  "\u05E1\u05D5\u05DB\u05D4",
  "\u05D1\u05D9\u05E6\u05D4",
  "\u05E8\u05D0\u05E9 \u05D4\u05E9\u05E0\u05D4",
  "\u05EA\u05E2\u05E0\u05D9\u05EA",
  "\u05DE\u05D2\u05D9\u05DC\u05D4",
  "\u05DE\u05D5\u05E2\u05D3 \u05E7\u05D8\u05DF",
  "\u05D7\u05D2\u05D9\u05D2\u05D4",
  "\u05D9\u05D1\u05DE\u05D5\u05EA",
  "\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA",
  "\u05E0\u05D3\u05E8\u05D9\u05DD",
  "\u05E0\u05D6\u05D9\u05E8",
  "\u05E1\u05D5\u05D8\u05D4",
  "\u05D2\u05D9\u05D8\u05D9\u05DF",
  "\u05E7\u05D9\u05D3\u05D5\u05E9\u05D9\u05DF",
  "\u05D1\u05D1\u05D0 \u05E7\u05DE\u05D0",
  "\u05D1\u05D1\u05D0 \u05DE\u05E6\u05D9\u05E2\u05D0",
  "\u05D1\u05D1\u05D0 \u05D1\u05EA\u05E8\u05D0",
  "\u05E1\u05E0\u05D4\u05D3\u05E8\u05D9\u05DF",
  "\u05DE\u05DB\u05D5\u05EA",
  "\u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
  "\u05E2\u05D1\u05D5\u05D3\u05D4 \u05D6\u05E8\u05D4",
  "\u05D4\u05D5\u05E8\u05D9\u05D5\u05EA",
  "\u05D6\u05D1\u05D7\u05D9\u05DD",
  "\u05DE\u05E0\u05D7\u05D5\u05EA",
  "\u05D7\u05D5\u05DC\u05D9\u05DF",
  "\u05D1\u05DB\u05D5\u05E8\u05D5\u05EA",
  "\u05E2\u05E8\u05DB\u05D9\u05DF",
  "\u05EA\u05DE\u05D5\u05E8\u05D4",
  "\u05DB\u05E8\u05D9\u05EA\u05D5\u05EA",
  "\u05DE\u05E2\u05D9\u05DC\u05D4",
  "\u05E7\u05D9\u05E0\u05D9\u05DD",
  "\u05EA\u05DE\u05D9\u05D3",
  "\u05DE\u05D9\u05D3\u05D5\u05EA",
  "\u05E0\u05D3\u05D4"
]);
/**
 * See {@link #getYerushlmiMasechtaTransliterated()}.
 */
__publicField$3(_Daf, "masechtosYerushalmiTransliterated", [
  "Berachos",
  "Pe'ah",
  "Demai",
  "Kilayim",
  "Shevi'is",
  "Terumos",
  "Ma'asros",
  "Ma'aser Sheni",
  "Chalah",
  "Orlah",
  "Bikurim",
  "Shabbos",
  "Eruvin",
  "Pesachim",
  "Beitzah",
  "Rosh Hashanah",
  "Yoma",
  "Sukah",
  "Ta'anis",
  "Shekalim",
  "Megilah",
  "Chagigah",
  "Moed Katan",
  "Yevamos",
  "Kesuvos",
  "Sotah",
  "Nedarim",
  "Nazir",
  "Gitin",
  "Kidushin",
  "Bava Kama",
  "Bava Metzia",
  "Bava Basra",
  "Sanhedrin",
  "Makos",
  "Shevuos",
  "Avodah Zarah",
  "Horayos",
  "Nidah",
  "No Daf Today"
]);
/**
 * See {@link #getYerushalmiMasechta()}.
 */
__publicField$3(_Daf, "masechtosYerushlmi", [
  "\u05D1\u05E8\u05DB\u05D5\u05EA",
  "\u05E4\u05D9\u05D0\u05D4",
  "\u05D3\u05DE\u05D0\u05D9",
  "\u05DB\u05DC\u05D0\u05D9\u05D9\u05DD",
  "\u05E9\u05D1\u05D9\u05E2\u05D9\u05EA",
  "\u05EA\u05E8\u05D5\u05DE\u05D5\u05EA",
  "\u05DE\u05E2\u05E9\u05E8\u05D5\u05EA",
  "\u05DE\u05E2\u05E9\u05E8 \u05E9\u05E0\u05D9",
  "\u05D7\u05DC\u05D4",
  "\u05E2\u05D5\u05E8\u05DC\u05D4",
  "\u05D1\u05D9\u05DB\u05D5\u05E8\u05D9\u05DD",
  "\u05E9\u05D1\u05EA",
  "\u05E2\u05D9\u05E8\u05D5\u05D1\u05D9\u05DF",
  "\u05E4\u05E1\u05D7\u05D9\u05DD",
  "\u05D1\u05D9\u05E6\u05D4",
  "\u05E8\u05D0\u05E9 \u05D4\u05E9\u05E0\u05D4",
  "\u05D9\u05D5\u05DE\u05D0",
  "\u05E1\u05D5\u05DB\u05D4",
  "\u05EA\u05E2\u05E0\u05D9\u05EA",
  "\u05E9\u05E7\u05DC\u05D9\u05DD",
  "\u05DE\u05D2\u05D9\u05DC\u05D4",
  "\u05D7\u05D2\u05D9\u05D2\u05D4",
  "\u05DE\u05D5\u05E2\u05D3 \u05E7\u05D8\u05DF",
  "\u05D9\u05D1\u05DE\u05D5\u05EA",
  "\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA",
  "\u05E1\u05D5\u05D8\u05D4",
  "\u05E0\u05D3\u05E8\u05D9\u05DD",
  "\u05E0\u05D6\u05D9\u05E8",
  "\u05D2\u05D9\u05D8\u05D9\u05DF",
  "\u05E7\u05D9\u05D3\u05D5\u05E9\u05D9\u05DF",
  "\u05D1\u05D1\u05D0 \u05E7\u05DE\u05D0",
  "\u05D1\u05D1\u05D0 \u05DE\u05E6\u05D9\u05E2\u05D0",
  "\u05D1\u05D1\u05D0 \u05D1\u05EA\u05E8\u05D0",
  "\u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
  "\u05DE\u05DB\u05D5\u05EA",
  "\u05E1\u05E0\u05D4\u05D3\u05E8\u05D9\u05DF",
  "\u05E2\u05D1\u05D5\u05D3\u05D4 \u05D6\u05E8\u05D4",
  "\u05D4\u05D5\u05E8\u05D9\u05D5\u05EA",
  "\u05E0\u05D9\u05D3\u05D4",
  "\u05D0\u05D9\u05DF \u05D3\u05E3 \u05D4\u05D9\u05D5\u05DD"
]);
let Daf = _Daf;

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => {
  __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _YomiCalculator = class _YomiCalculator {
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
  static getDafYomiBavli(calendar) {
    const blattPerMasechta = [
      64,
      157,
      105,
      121,
      22,
      88,
      56,
      40,
      35,
      31,
      32,
      29,
      27,
      122,
      112,
      91,
      66,
      49,
      90,
      82,
      119,
      119,
      176,
      113,
      24,
      49,
      76,
      14,
      120,
      110,
      142,
      61,
      34,
      34,
      28,
      22,
      4,
      9,
      5,
      73
    ];
    const date = calendar.getDate();
    let dafYomi;
    const julianDay = this.getJulianDay(date);
    let cycleNo = 0;
    let dafNo = 0;
    if (date < _YomiCalculator.dafYomiStartDate) {
      throw new IllegalArgumentException(`${calendar} is prior to organized Daf Yomi Bavli cycles that started on ${_YomiCalculator.dafYomiStartDate}`);
    }
    if (date > _YomiCalculator.shekalimChangeDate || date.equals(_YomiCalculator.shekalimChangeDate)) {
      cycleNo = 8 + (julianDay - _YomiCalculator.shekalimJulianChangeDay) / 2711;
      dafNo = (julianDay - _YomiCalculator.shekalimJulianChangeDay) % 2711;
    } else {
      cycleNo = 1 + (julianDay - _YomiCalculator.dafYomiJulianStartDay) / 2702;
      dafNo = (julianDay - _YomiCalculator.dafYomiJulianStartDay) % 2702;
    }
    let total = 0;
    let masechta = -1;
    let blatt = 0;
    if (cycleNo <= 7) {
      blattPerMasechta[4] = 13;
    } else {
      blattPerMasechta[4] = 22;
    }
    for (const blattInMasechta of blattPerMasechta) {
      masechta++;
      total = total + blattInMasechta - 1;
      if (dafNo < total) {
        blatt = 1 + blattInMasechta - (total - dafNo);
        if (masechta === 36) {
          blatt += 21;
        } else if (masechta === 37) {
          blatt += 24;
        } else if (masechta === 38) {
          blatt += 32;
        }
        dafYomi = new Daf(masechta, blatt);
        break;
      }
    }
    return dafYomi;
  }
  /**
   * Return the <a href="http://en.wikipedia.org/wiki/Julian_day">Julian day</a> from a Java Date.
   *
   * @param date
   *            The Java Date
   * @return the Julian day number corresponding to the date
   */
  static getJulianDay(date) {
    let { year, month } = date;
    const { day } = date;
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const a = Math.trunc(year / 100);
    const b = 2 - a + Math.trunc(a / 4);
    return Math.trunc(Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5);
  }
};
/**
 * The start date of the first Daf Yomi Bavli cycle of September 11, 1923 / Rosh Hashana 5684.
 */
__publicField$2(_YomiCalculator, "dafYomiStartDate", DateTime.fromObject({
  year: 1923,
  month: Calendar.SEPTEMBER + 1,
  day: 11
}));
/** The start date of the first Daf Yomi Bavli cycle in the Julian calendar. Used internally for claculations. */
__publicField$2(_YomiCalculator, "dafYomiJulianStartDay", _YomiCalculator.getJulianDay(_YomiCalculator.dafYomiStartDate));
/**
 * The date that the pagination for the Daf Yomi <em>Maseches Shekalim</em> changed to use the commonly used Vilna
 * Shas pagination from the no longer commonly available Zhitomir / Slavuta Shas used by Rabbi Meir Shapiro.
 */
__publicField$2(_YomiCalculator, "shekalimChangeDate", DateTime.fromObject({ year: 1975, month: Calendar.JUNE + 1, day: 24 }));
/** The Julian date that the cycle for Shekalim changed.
 * @see #getDafYomiBavli(JewishCalendar) for details.
 */
__publicField$2(_YomiCalculator, "shekalimJulianChangeDay", _YomiCalculator.getJulianDay(_YomiCalculator.shekalimChangeDate));
let YomiCalculator = _YomiCalculator;

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _YerushalmiYomiCalculator = class _YerushalmiYomiCalculator {
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
   *             if the date is prior to the February 2, 1980, the start date of the first Daf Yomi Yerushalmi cycle
   */
  static getDafYomiYerushalmi(jewishCalendar) {
    let nextCycle = _YerushalmiYomiCalculator.DAF_YOMI_START_DAY;
    let prevCycle = _YerushalmiYomiCalculator.DAF_YOMI_START_DAY;
    const requested = jewishCalendar.getDate();
    let masechta = 0;
    let dafYomi;
    if (jewishCalendar.getYomTovIndex() === JewishCalendar.YOM_KIPPUR || jewishCalendar.getYomTovIndex() === JewishCalendar.TISHA_BEAV) {
      return new Daf(39, 0);
    }
    if (requested < _YerushalmiYomiCalculator.DAF_YOMI_START_DAY) {
      throw new IllegalArgumentException(`${requested} is prior to organized Daf Yomi Yerushlmi cycles that started on ${_YerushalmiYomiCalculator.DAF_YOMI_START_DAY}`);
    }
    while (requested > nextCycle) {
      prevCycle = nextCycle;
      nextCycle = nextCycle.plus({ days: _YerushalmiYomiCalculator.WHOLE_SHAS_DAFS });
      nextCycle = nextCycle.plus({ days: _YerushalmiYomiCalculator.getNumOfSpecialDays(prevCycle, nextCycle) });
    }
    const dafNo = requested.diff(prevCycle, ["days"]).days;
    const specialDays = _YerushalmiYomiCalculator.getNumOfSpecialDays(prevCycle, requested);
    let total = dafNo - specialDays;
    for (let i = 0; i < _YerushalmiYomiCalculator.BLATT_PER_MASECHTA.length; i++) {
      if (total <= _YerushalmiYomiCalculator.BLATT_PER_MASECHTA[i]) {
        dafYomi = new Daf(masechta, total + 1);
        break;
      }
      total -= _YerushalmiYomiCalculator.BLATT_PER_MASECHTA[i];
      masechta++;
    }
    return dafYomi;
  }
  /**
   * Return the number of special days (Yom Kippur and Tisha B'Av) on which there is no daf, between the two given dates
   *
   * @param start - start date to calculate
   * @param end - end date to calculate
   * @return the number of special days
   */
  static getNumOfSpecialDays(start, end) {
    const jewishStartYear = new JewishCalendar(start).getJewishYear();
    const jewishEndYear = new JewishCalendar(end).getJewishYear();
    let specialDays = 0;
    const yomKippur = new JewishCalendar(jewishStartYear, 7, 10);
    const tishaBeav = new JewishCalendar(jewishStartYear, 5, 9);
    for (let i = jewishStartYear; i <= jewishEndYear; i++) {
      yomKippur.setJewishYear(i);
      tishaBeav.setJewishYear(i);
      const interval = Interval.fromDateTimes(start, end);
      if (interval.contains(yomKippur.getDate()))
        specialDays++;
      if (interval.contains(tishaBeav.getDate()))
        specialDays++;
    }
    return specialDays;
  }
};
/**
 * The start date of the first Daf Yomi Yerushalmi cycle of February 2, 1980 / 15 Shevat, 5740.
 */
__publicField$1(_YerushalmiYomiCalculator, "DAF_YOMI_START_DAY", DateTime.fromObject({
  year: 1980,
  month: Calendar.FEBRUARY + 1,
  day: 2
}));
/** The number of pages in the Talmud Yerushalmi. */
__publicField$1(_YerushalmiYomiCalculator, "WHOLE_SHAS_DAFS", 1554);
/** The number of pages per <em>masechta</em> (tractate). */
__publicField$1(_YerushalmiYomiCalculator, "BLATT_PER_MASECHTA", [
  68,
  37,
  34,
  44,
  31,
  59,
  26,
  33,
  28,
  20,
  13,
  92,
  65,
  71,
  22,
  22,
  42,
  26,
  26,
  33,
  34,
  22,
  19,
  85,
  72,
  47,
  40,
  47,
  54,
  48,
  44,
  37,
  34,
  44,
  9,
  57,
  37,
  19,
  13
]);
let YerushalmiYomiCalculator = _YerushalmiYomiCalculator;

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _HebrewDateFormatter = class _HebrewDateFormatter {
  constructor() {
    /**
     * See {@link #isHebrewFormat()} and {@link #setHebrewFormat(boolean)}.
     */
    __publicField(this, "hebrewFormat", false);
    /**
     * See {@link #isUseLongHebrewYears()} and {@link #setUseLongHebrewYears(boolean)}.
     */
    __publicField(this, "useLonghebrewYears", false);
    /**
     * See {@link #isUseGershGershayim()} and {@link #setUseGershGershayim(boolean)}.
     */
    __publicField(this, "useGershGershayim", true);
    /**
     * See {@link #isLongWeekFormat()} and {@link #setLongWeekFormat(boolean)}.
     */
    __publicField(this, "longWeekFormat", true);
    /**
     * See {@link #isUseFinalFormLetters()} and {@link #setUseFinalFormLetters(boolean)}.
     */
    __publicField(this, "useFinalFormLetters", false);
    /**
     * The internal DateFormat.&nbsp; See {@link #isLongWeekFormat()} and {@link #setLongWeekFormat(boolean)}.
     */
    __publicField(this, "weekFormat", null);
    /**
     * List of transliterated parshiyos using the default <em>Ashkenazi</em> pronounciation.&nbsp; The formatParsha method uses this
     * for transliterated <em>parsha</em> formatting.&nbsp; This list can be overridden (for <em>Sephardi</em> English transliteration for
     * example) by setting the {@link #setTransliteratedParshiosList(EnumMap)}.&nbsp; The list includes double and special
     * <em>parshiyos</em> is set as "<em>Bereshis, Noach, Lech Lecha, Vayera, Chayei Sara, Toldos, Vayetzei, Vayishlach, Vayeshev, Miketz,
     * Vayigash, Vayechi, Shemos, Vaera, Bo, Beshalach, Yisro, Mishpatim, Terumah, Tetzaveh, Ki Sisa, Vayakhel, Pekudei,
     * Vayikra, Tzav, Shmini, Tazria, Metzora, Achrei Mos, Kedoshim, Emor, Behar, Bechukosai, Bamidbar, Nasso, Beha'aloscha,
     * Sh'lach, Korach, Chukas, Balak, Pinchas, Matos, Masei, Devarim, Vaeschanan, Eikev, Re'eh, Shoftim, Ki Seitzei, Ki Savo,
     * Nitzavim, Vayeilech, Ha'Azinu, Vezos Habracha, Vayakhel Pekudei, Tazria Metzora, Achrei Mos Kedoshim, Behar Bechukosai,
     * Chukas Balak, Matos Masei, Nitzavim Vayeilech, Shekalim, Zachor, Parah, Hachodesh</em>".
     *
     * @see #formatParsha(JewishCalendar)
     */
    __publicField(this, "transliteratedParshaMap", {
      [Parsha.NONE]: "",
      [Parsha.BERESHIS]: "Bereshis",
      [Parsha.NOACH]: "Noach",
      [Parsha.LECH_LECHA]: "Lech Lecha",
      [Parsha.VAYERA]: "Vayera",
      [Parsha.CHAYEI_SARA]: "Chayei Sara",
      [Parsha.TOLDOS]: "Toldos",
      [Parsha.VAYETZEI]: "Vayetzei",
      [Parsha.VAYISHLACH]: "Vayishlach",
      [Parsha.VAYESHEV]: "Vayeshev",
      [Parsha.MIKETZ]: "Miketz",
      [Parsha.VAYIGASH]: "Vayigash",
      [Parsha.VAYECHI]: "Vayechi",
      [Parsha.SHEMOS]: "Shemos",
      [Parsha.VAERA]: "Vaera",
      [Parsha.BO]: "Bo",
      [Parsha.BESHALACH]: "Beshalach",
      [Parsha.YISRO]: "Yisro",
      [Parsha.MISHPATIM]: "Mishpatim",
      [Parsha.TERUMAH]: "Terumah",
      [Parsha.TETZAVEH]: "Tetzaveh",
      [Parsha.KI_SISA]: "Ki Sisa",
      [Parsha.VAYAKHEL]: "Vayakhel",
      [Parsha.PEKUDEI]: "Pekudei",
      [Parsha.VAYIKRA]: "Vayikra",
      [Parsha.TZAV]: "Tzav",
      [Parsha.SHMINI]: "Shmini",
      [Parsha.TAZRIA]: "Tazria",
      [Parsha.METZORA]: "Metzora",
      [Parsha.ACHREI_MOS]: "Achrei Mos",
      [Parsha.KEDOSHIM]: "Kedoshim",
      [Parsha.EMOR]: "Emor",
      [Parsha.BEHAR]: "Behar",
      [Parsha.BECHUKOSAI]: "Bechukosai",
      [Parsha.BAMIDBAR]: "Bamidbar",
      [Parsha.NASSO]: "Nasso",
      [Parsha.BEHAALOSCHA]: "Beha'aloscha",
      [Parsha.SHLACH]: "Sh'lach",
      [Parsha.KORACH]: "Korach",
      [Parsha.CHUKAS]: "Chukas",
      [Parsha.BALAK]: "Balak",
      [Parsha.PINCHAS]: "Pinchas",
      [Parsha.MATOS]: "Matos",
      [Parsha.MASEI]: "Masei",
      [Parsha.DEVARIM]: "Devarim",
      [Parsha.VAESCHANAN]: "Vaeschanan",
      [Parsha.EIKEV]: "Eikev",
      [Parsha.REEH]: "Re'eh",
      [Parsha.SHOFTIM]: "Shoftim",
      [Parsha.KI_SEITZEI]: "Ki Seitzei",
      [Parsha.KI_SAVO]: "Ki Savo",
      [Parsha.NITZAVIM]: "Nitzavim",
      [Parsha.VAYEILECH]: "Vayeilech",
      [Parsha.HAAZINU]: "Ha'Azinu",
      [Parsha.VZOS_HABERACHA]: "Vezos Habracha",
      [Parsha.VAYAKHEL_PEKUDEI]: "Vayakhel Pekudei",
      [Parsha.TAZRIA_METZORA]: "Tazria Metzora",
      [Parsha.ACHREI_MOS_KEDOSHIM]: "Achrei Mos Kedoshim",
      [Parsha.BEHAR_BECHUKOSAI]: "Behar Bechukosai",
      [Parsha.CHUKAS_BALAK]: "Chukas Balak",
      [Parsha.MATOS_MASEI]: "Matos Masei",
      [Parsha.NITZAVIM_VAYEILECH]: "Nitzavim Vayeilech",
      [Parsha.SHKALIM]: "Shekalim",
      [Parsha.ZACHOR]: "Zachor",
      [Parsha.PARA]: "Parah",
      [Parsha.HACHODESH]: "Hachodesh"
    });
    /**
     * Unicode {@link Record} of Hebrew <em>parshiyos</em>.&nbsp; The list includes double and special <em>parshiyos</em> and
     * contains <code>"&#x05D1;&#x05E8;&#x05D0;&#x05E9;&#x05D9;&#x05EA;, &#x05E0;&#x05D7;, &#x05DC;&#x05DA; &#x05DC;&#x05DA;,
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
     *  &#x05DB;&#x05D9; &#x05EA;&#x05D1;&#x05D5;&#x05D0;, &#5D9;&#x05E6;&#x05D1;&#x05D9;&#x05DD;, &#x05D5;&#x05D9;&#x05DC;&#x05DA;,
     *  &#x05D4;&#x05D0;&#x05D6;&#x05D9;&#x05E0;&#x05D5;, &#x05D5;&#x05D6;&#x05D0;&#x05EA; &#x05D4;&#x05D1;&#x05E8;&#x05DB;&#x05D4;,
     *  &#x05D5;&#x05D9;&#x05E7;&#x05D4;&#x05DC; &#x05E4;&#x05E7;&#x05D5;&#x05D3;&#x05D9;, &#x05EA;&#x05D6;&#x05E8;&#x05D9;&#x05E2;
     *  &#x05DE;&#x05E6;&#x05E8;&#x05E2;, &#x05D0;&#x05D7;&#x05E8;&#x05D9; &#x05DE;&#x05D5;&#x05EA;
     *  &#x05E7;&#x05D3;&#x05D5;&#x05E9;&#x05D9;&#x05DD;, &#x05D1;&#x05D4;&#x05E8; &#x05D1;&#x05D7;&#x05E7;&#x05EA;&#x05D9;,
     *  &#x05D7;&#x05D5;&#x05E7;&#x05EA; &#x05D1;&#x05DC;&#x05E7;, &#x05DE;&#x05D8;&#x05D5;&#x05EA; &#x05DE;&#x05E1;&#x05E2;&#x05D9;,
     *  &#x05E0;&#x05E6;&#x05D1;&#x05D9;&#x05DD; &#x05D5;&#x05D9;&#x05DC;&#x05DA;, &#x05E9;&#x05E7;&#x05DC;&#x05D9;&#x05DD;,
     *  &#x05D6;&#x05DB;&#x05D5;&#x05E8;, &#x05E4;&#x05E8;&#x05D4;, &#x05D4;&#x05D7;&#x05D3;&#x05E9;"</code>
     */
    __publicField(this, "hebrewParshaMap", {
      [Parsha.NONE]: "",
      [Parsha.BERESHIS]: "\u05D1\u05E8\u05D0\u05E9\u05D9\u05EA",
      [Parsha.NOACH]: "\u05E0\u05D7",
      [Parsha.LECH_LECHA]: "\u05DC\u05DA \u05DC\u05DA",
      [Parsha.VAYERA]: "\u05D5\u05D9\u05E8\u05D0",
      [Parsha.CHAYEI_SARA]: "\u05D7\u05D9\u05D9 \u05E9\u05E8\u05D4",
      [Parsha.TOLDOS]: "\u05EA\u05D5\u05DC\u05D3\u05D5\u05EA",
      [Parsha.VAYETZEI]: "\u05D5\u05D9\u05E6\u05D0",
      [Parsha.VAYISHLACH]: "\u05D5\u05D9\u05E9\u05DC\u05D7",
      [Parsha.VAYESHEV]: "\u05D5\u05D9\u05E9\u05D1",
      [Parsha.MIKETZ]: "\u05DE\u05E7\u05E5",
      [Parsha.VAYIGASH]: "\u05D5\u05D9\u05D2\u05E9",
      [Parsha.VAYECHI]: "\u05D5\u05D9\u05D7\u05D9",
      [Parsha.SHEMOS]: "\u05E9\u05DE\u05D5\u05EA",
      [Parsha.VAERA]: "\u05D5\u05D0\u05E8\u05D0",
      [Parsha.BO]: "\u05D1\u05D0",
      [Parsha.BESHALACH]: "\u05D1\u05E9\u05DC\u05D7",
      [Parsha.YISRO]: "\u05D9\u05EA\u05E8\u05D5",
      [Parsha.MISHPATIM]: "\u05DE\u05E9\u05E4\u05D8\u05D9\u05DD",
      [Parsha.TERUMAH]: "\u05EA\u05E8\u05D5\u05DE\u05D4",
      [Parsha.TETZAVEH]: "\u05EA\u05E6\u05D5\u05D4",
      [Parsha.KI_SISA]: "\u05DB\u05D9 \u05EA\u05E9\u05D0",
      [Parsha.VAYAKHEL]: "\u05D5\u05D9\u05E7\u05D4\u05DC",
      [Parsha.PEKUDEI]: "\u05E4\u05E7\u05D5\u05D3\u05D9",
      [Parsha.VAYIKRA]: "\u05D5\u05D9\u05E7\u05E8\u05D0",
      [Parsha.TZAV]: "\u05E6\u05D5",
      [Parsha.SHMINI]: "\u05E9\u05DE\u05D9\u05E0\u05D9",
      [Parsha.TAZRIA]: "\u05EA\u05D6\u05E8\u05D9\u05E2",
      [Parsha.METZORA]: "\u05DE\u05E6\u05E8\u05E2",
      [Parsha.ACHREI_MOS]: "\u05D0\u05D7\u05E8\u05D9 \u05DE\u05D5\u05EA",
      [Parsha.KEDOSHIM]: "\u05E7\u05D3\u05D5\u05E9\u05D9\u05DD",
      [Parsha.EMOR]: "\u05D0\u05DE\u05D5\u05E8",
      [Parsha.BEHAR]: "\u05D1\u05D4\u05E8",
      [Parsha.BECHUKOSAI]: "\u05D1\u05D7\u05E7\u05EA\u05D9",
      [Parsha.BAMIDBAR]: "\u05D1\u05DE\u05D3\u05D1\u05E8",
      [Parsha.NASSO]: "\u05E0\u05E9\u05D0",
      [Parsha.BEHAALOSCHA]: "\u05D1\u05D4\u05E2\u05DC\u05EA\u05DA",
      [Parsha.SHLACH]: "\u05E9\u05DC\u05D7 \u05DC\u05DA",
      [Parsha.KORACH]: "\u05E7\u05E8\u05D7",
      [Parsha.CHUKAS]: "\u05D7\u05D5\u05E7\u05EA",
      [Parsha.BALAK]: "\u05D1\u05DC\u05E7",
      [Parsha.PINCHAS]: "\u05E4\u05D9\u05E0\u05D7\u05E1",
      [Parsha.MATOS]: "\u05DE\u05D8\u05D5\u05EA",
      [Parsha.MASEI]: "\u05DE\u05E1\u05E2\u05D9",
      [Parsha.DEVARIM]: "\u05D3\u05D1\u05E8\u05D9\u05DD",
      [Parsha.VAESCHANAN]: "\u05D5\u05D0\u05EA\u05D7\u05E0\u05DF",
      [Parsha.EIKEV]: "\u05E2\u05E7\u05D1",
      [Parsha.REEH]: "\u05E8\u05D0\u05D4",
      [Parsha.SHOFTIM]: "\u05E9\u05D5\u05E4\u05D8\u05D9\u05DD",
      [Parsha.KI_SEITZEI]: "\u05DB\u05D9 \u05EA\u05E6\u05D0",
      [Parsha.KI_SAVO]: "\u05DB\u05D9 \u05EA\u05D1\u05D5\u05D0",
      [Parsha.NITZAVIM]: "\u05E0\u05E6\u05D1\u05D9\u05DD",
      [Parsha.VAYEILECH]: "\u05D5\u05D9\u05DC\u05DA",
      [Parsha.HAAZINU]: "\u05D4\u05D0\u05D6\u05D9\u05E0\u05D5",
      [Parsha.VZOS_HABERACHA]: "\u05D5\u05D6\u05D0\u05EA \u05D4\u05D1\u05E8\u05DB\u05D4 ",
      [Parsha.VAYAKHEL_PEKUDEI]: "\u05D5\u05D9\u05E7\u05D4\u05DC \u05E4\u05E7\u05D5\u05D3\u05D9",
      [Parsha.TAZRIA_METZORA]: "\u05EA\u05D6\u05E8\u05D9\u05E2 \u05DE\u05E6\u05E8\u05E2",
      [Parsha.ACHREI_MOS_KEDOSHIM]: "\u05D0\u05D7\u05E8\u05D9 \u05DE\u05D5\u05EA \u05E7\u05D3\u05D5\u05E9\u05D9\u05DD",
      [Parsha.BEHAR_BECHUKOSAI]: "\u05D1\u05D4\u05E8 \u05D1\u05D7\u05E7\u05EA\u05D9",
      [Parsha.CHUKAS_BALAK]: "\u05D7\u05D5\u05E7\u05EA \u05D1\u05DC\u05E7",
      [Parsha.MATOS_MASEI]: "\u05DE\u05D8\u05D5\u05EA \u05DE\u05E1\u05E2\u05D9",
      [Parsha.NITZAVIM_VAYEILECH]: "\u05E0\u05E6\u05D1\u05D9\u05DD \u05D5\u05D9\u05DC\u05DA",
      [Parsha.SHKALIM]: "\u05E9\u05E7\u05DC\u05D9\u05DD",
      [Parsha.ZACHOR]: "\u05D6\u05DB\u05D5\u05E8",
      [Parsha.PARA]: "\u05E4\u05E8\u05D4",
      [Parsha.HACHODESH]: "\u05D4\u05D7\u05D3\u05E9"
    });
    /**
     * Transliterated month names.&nbsp; Defaults to ["Nissan", "Iyar", "Sivan", "Tammuz", "Av", "Elul", "Tishrei", "Cheshvan",
     * "Kislev", "Teves", "Shevat", "Adar", "Adar II", "Adar I" ].
     * @see #getTransliteratedMonthList()
     * @see #setTransliteratedMonthList(String[])
     */
    __publicField(this, "transliteratedMonths", [
      "Nissan",
      "Iyar",
      "Sivan",
      "Tammuz",
      "Av",
      "Elul",
      "Tishrei",
      "Cheshvan",
      "Kislev",
      "Teves",
      "Shevat",
      "Adar",
      "Adar II",
      "Adar I"
    ]);
    /**
     * The Hebrew omer prefix charachter. It defaults to &#x05D1; producing &#x05D1;&#x05E2;&#x05D5;&#x05DE;&#x05E8;,
     * but can be set to &#x05DC; to produce &#x05DC;&#x05E2;&#x05D5;&#x05DE;&#x05E8; (or any other prefix).
     * @see #getHebrewOmerPrefix()
     * @see #setHebrewOmerPrefix(String)
     */
    __publicField(this, "hebrewOmerPrefix", "\u05D1");
    /**
     * The default value for formatting Shabbos (Saturday).&nbsp; Defaults to Shabbos.
     * @see #getTransliteratedShabbosDayOfWeek()
     * @see #setTransliteratedShabbosDayOfWeek(String)
     */
    __publicField(this, "transliteratedShabbosDayOfweek", "Shabbos");
    /**
     * See {@link #getTransliteratedHolidayList()} and {@link #setTransliteratedHolidayList(String[])}.
     */
    __publicField(this, "transliteratedHolidays", [
      "Erev Pesach",
      "Pesach",
      "Chol Hamoed Pesach",
      "Pesach Sheni",
      "Erev Shavuos",
      "Shavuos",
      "Seventeenth of Tammuz",
      "Tishah B'Av",
      "Tu B'Av",
      "Erev Rosh Hashana",
      "Rosh Hashana",
      "Fast of Gedalyah",
      "Erev Yom Kippur",
      "Yom Kippur",
      "Erev Succos",
      "Succos",
      "Chol Hamoed Succos",
      "Hoshana Rabbah",
      "Shemini Atzeres",
      "Simchas Torah",
      "Erev Chanukah",
      "Chanukah",
      "Tenth of Teves",
      "Tu B'Shvat",
      "Fast of Esther",
      "Purim",
      "Shushan Purim",
      "Purim Katan",
      "Rosh Chodesh",
      "Yom HaShoah",
      "Yom Hazikaron",
      "Yom Ha'atzmaut",
      "Yom Yerushalayim",
      "Lag B'Omer",
      "Shushan Purim Katan"
    ]);
    /**
     * Unicode list of Hebrew months in the following format <code>["\u05E0\u05D9\u05E1\u05DF","\u05D0\u05D9\u05D9\u05E8",
     * "\u05E1\u05D9\u05D5\u05DF","\u05EA\u05DE\u05D5\u05D6","\u05D0\u05D1","\u05D0\u05DC\u05D5\u05DC",
     * "\u05EA\u05E9\u05E8\u05D9","\u05D7\u05E9\u05D5\u05DF","\u05DB\u05E1\u05DC\u05D5","\u05D8\u05D1\u05EA",
     * "\u05E9\u05D1\u05D8","\u05D0\u05D3\u05E8","\u05D0\u05D3\u05E8 \u05D1","\u05D0\u05D3\u05E8 \u05D0"]</code>
     *
     * @see #formatMonth(JewishDate)
     */
    __publicField(this, "hebrewMonths", [
      "\u05E0\u05D9\u05E1\u05DF",
      "\u05D0\u05D9\u05D9\u05E8",
      "\u05E1\u05D9\u05D5\u05DF",
      "\u05EA\u05DE\u05D5\u05D6",
      "\u05D0\u05D1",
      "\u05D0\u05DC\u05D5\u05DC",
      "\u05EA\u05E9\u05E8\u05D9",
      "\u05D7\u05E9\u05D5\u05DF",
      "\u05DB\u05E1\u05DC\u05D5",
      "\u05D8\u05D1\u05EA",
      "\u05E9\u05D1\u05D8",
      "\u05D0\u05D3\u05E8",
      "\u05D0\u05D3\u05E8 \u05D1",
      "\u05D0\u05D3\u05E8 \u05D0"
    ]);
  }
  /**
   * returns if the {@link #formatDayOfWeek(JewishDate)} will use the long format such as
   * &#x05E8;&#x05D0;&#x05E9;&#x05D5;&#x05DF; or short such as &#x05D0; when formatting the day of week in
   * {@link #isHebrewFormat() Hebrew}.
   *
   * @return the longWeekFormat
   * @see #setLongWeekFormat(boolean)
   * @see #formatDayOfWeek(JewishDate)
   */
  isLongWeekFormat() {
    return this.longWeekFormat;
  }
  /**
   * Setting to control if the {@link #formatDayOfWeek(JewishDate)} will use the long format such as
   * &#x05E8;&#x05D0;&#x05E9;&#x05D5;&#x05DF; or short such as &#x05D0; when formatting the day of week in
   * {@link #isHebrewFormat() Hebrew}.
   *
   * @param longWeekFormat
   *            the longWeekFormat to set
   */
  setLongWeekFormat(longWeekFormat) {
    this.longWeekFormat = longWeekFormat;
    this.weekFormat = {
      weekday: longWeekFormat ? "long" : "short"
    };
  }
  /**
   * Returns the day of Shabbos transliterated into Latin chars. The default uses Ashkenazi pronunciation "Shabbos".
   * This can be overwritten using the {@link #setTransliteratedShabbosDayOfWeek(String)}
   *
   * @return the transliteratedShabbos. The default list of months uses Ashkenazi pronunciation "Shabbos".
   * @see #setTransliteratedShabbosDayOfWeek(String)
   * @see #formatDayOfWeek(JewishDate)
   */
  getTransliteratedShabbosDayOfWeek() {
    return this.transliteratedShabbosDayOfweek;
  }
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
  setTransliteratedShabbosDayOfWeek(transliteratedShabbos) {
    this.transliteratedShabbosDayOfweek = transliteratedShabbos;
  }
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
  getTransliteratedHolidayList() {
    return this.transliteratedHolidays;
  }
  /**
   * Sets the list of holidays transliterated into Latin chars. This is used by the
   * {@link #formatYomTov(JewishCalendar)} when formatting the Yom Tov String.
   *
   * @param transliteratedHolidays
   *            the transliteratedHolidays to set. Ensure that the sequence exactly matches the list returned by the
   *            default
   */
  setTransliteratedHolidayList(transliteratedHolidays) {
    this.transliteratedHolidays = transliteratedHolidays;
  }
  /**
   * Formats the Yom Tov (holiday) in Hebrew or transliterated Latin characters.
   *
   * @param jewishCalendar the JewishCalendar
   * @return the formatted holiday or an empty String if the day is not a holiday.
   * @see #isHebrewFormat()
   */
  formatYomTov(jewishCalendar) {
    const index = jewishCalendar.getYomTovIndex();
    if (index === JewishCalendar.CHANUKAH) {
      const dayOfChanukah = jewishCalendar.getDayOfChanukah();
      return this.hebrewFormat ? `${this.formatHebrewNumber(dayOfChanukah)} ${_HebrewDateFormatter.hebrewHolidays[index]}` : `${this.transliteratedHolidays[index]} ${dayOfChanukah}`;
    }
    if (index === -1)
      return "";
    return this.hebrewFormat ? _HebrewDateFormatter.hebrewHolidays[index] : this.transliteratedHolidays[index];
  }
  /**
   * Formats a day as Rosh Chodesh in the format of in the format of &#x05E8;&#x05D0;&#x05E9;
   * &#x05D7;&#x05D5;&#x05D3;&#x05E9; &#x05E9;&#x05D1;&#x05D8; or Rosh Chodesh Shevat. If it
   * is not Rosh Chodesh, an empty <code>String</code> will be returned.
   * @param jewishCalendar the JewishCalendar
   * @return The formatted <code>String</code> in the format of &#x05E8;&#x05D0;&#x05E9;
   * &#x05D7;&#x05D5;&#x05D3;&#x05E9; &#x05E9;&#x05D1;&#x05D8; or Rosh Chodesh Shevat. If it
   * is not Rosh Chodesh, an empty <code>String</code> will be returned.
   */
  formatRoshChodesh(jewishCalendar) {
    if (!jewishCalendar.isRoshChodesh())
      return "";
    let formattedRoshChodesh;
    let month = jewishCalendar.getJewishMonth();
    if (jewishCalendar.getJewishDayOfMonth() === 30) {
      if (month < JewishCalendar.ADAR || month === JewishCalendar.ADAR && jewishCalendar.isJewishLeapYear()) {
        month++;
      } else {
        month = JewishCalendar.NISSAN;
      }
    }
    const _jewishCalendar = jewishCalendar.clone();
    _jewishCalendar.setJewishMonth(month);
    formattedRoshChodesh = this.hebrewFormat ? _HebrewDateFormatter.hebrewHolidays[JewishCalendar.ROSH_CHODESH] : this.transliteratedHolidays[JewishCalendar.ROSH_CHODESH];
    formattedRoshChodesh += ` ${this.formatMonth(_jewishCalendar)}`;
    return formattedRoshChodesh;
  }
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
  isHebrewFormat() {
    return this.hebrewFormat;
  }
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
  setHebrewFormat(hebrewFormat) {
    this.hebrewFormat = hebrewFormat;
  }
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
  getHebrewOmerPrefix() {
    return this.hebrewOmerPrefix;
  }
  /**
   * Method to set the Hebrew Omer prefix. By default it is the letter &#x5D1;, but this allows setting it to a
   * &#x5DC; (or any other prefix).
   *
   * @param hebrewOmerPrefix
   *            the hebrewOmerPrefix to set. You can use the Unicode &#92;u05DC to set it to &#x5DC;.
   * @see #getHebrewOmerPrefix()
   * @see #formatOmer(JewishCalendar)
   */
  setHebrewOmerPrefix(hebrewOmerPrefix) {
    this.hebrewOmerPrefix = hebrewOmerPrefix;
  }
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
  getTransliteratedMonthList() {
    return this.transliteratedMonths;
  }
  /**
   * Setter method to allow overriding of the default list of months transliterated into into Latin chars. The default
   * uses Ashkenazi American English transliteration.
   *
   * @param transliteratedMonths
   *            an array of 14 month names that defaults to ["Nissan", "Iyar", "Sivan", "Tamuz", "Av", "Elul", "Tishrei",
   *            "Heshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II", "Adar I"].
   * @see #getTransliteratedMonthList()
   */
  setTransliteratedMonthList(transliteratedMonths) {
    this.transliteratedMonths = transliteratedMonths;
  }
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
  formatDayOfWeek(jewishDate) {
    if (this.hebrewFormat) {
      if (this.isLongWeekFormat()) {
        return _HebrewDateFormatter.hebrewDaysOfWeek[jewishDate.getDayOfWeek() - 1];
      }
      if (jewishDate.getDayOfWeek() === 7) {
        return this.formatHebrewNumber(300);
      }
      return this.formatHebrewNumber(jewishDate.getDayOfWeek());
    }
    if (jewishDate.getDayOfWeek() === 7) {
      if (this.isLongWeekFormat()) {
        return this.getTransliteratedShabbosDayOfWeek();
      }
      return this.getTransliteratedShabbosDayOfWeek().substring(0, 3);
    }
    const dateTime = jewishDate.getDate();
    return this.weekFormat ? dateTime.toLocaleString(this.weekFormat) : dateTime.toISO();
  }
  /**
   * Returns whether the class is set to use the Geresh &#x5F3; and Gershayim &#x5F4; in formatting Hebrew dates and
   * numbers. When true and output would look like &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x5DB;
   * (or &#x5DB;&#x5F4;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5F4;&#x5DA;). When set to false, this output
   * would display as &#x5DB;&#x5D0; &#x5E9;&#x5D1;&#x5D8; &#x5EA;&#x5E9;&#x5DB;.
   *
   * @return true if set to use the Geresh &#x5F3; and Gershayim &#x5F4; in formatting Hebrew dates and numbers.
   */
  isUseGershGershayim() {
    return this.useGershGershayim;
  }
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
  setUseGershGershayim(useGershGershayim) {
    this.useGershGershayim = useGershGershayim;
  }
  /**
   * Returns whether the class is set to use the &#x05DE;&#x05E0;&#x05E6;&#x05E4;&#x05F4;&#x05DA; letters when
   * formatting years ending in 20, 40, 50, 80 and 90 to produce &#x05EA;&#x05E9;&#x05F4;&#x05E4; if false or
   * or &#x05EA;&#x05E9;&#x05F4;&#x05E3; if true. Traditionally non-final form letters are used, so the year
   * 5780 would be formatted as &#x05EA;&#x05E9;&#x05F4;&#x05E4; if the default false is used here. If this returns
   * true, the format &#x05EA;&#x05E9;&#x05F4;&#x05E3; would be used.
   *
   * @return true if set to use final form letters when formatting Hebrew years. The default value is false.
   */
  isUseFinalFormLetters() {
    return this.useFinalFormLetters;
  }
  /**
   * When formatting a Hebrew Year, traditionally years ending in 20, 40, 50, 80 and 90 are formatted using non-final
   * form letters for example &#x05EA;&#x05E9;&#x05F4;&#x05E4; for the year 5780. Setting this to true (the default
   * is false) will use the final form letters for &#x05DE;&#x05E0;&#x05E6;&#x05E4;&#x05F4;&#x05DA; and will format
   * the year 5780 as &#x05EA;&#x05E9;&#x05F4;&#x05E3;.
   *
   * @param useFinalFormLetters
   *            Set this to true to use final form letters when formatting Hebrew years.
   */
  setUseFinalFormLetters(useFinalFormLetters) {
    this.useFinalFormLetters = useFinalFormLetters;
  }
  /**
   * Returns whether the class is set to use the thousands digit when formatting. When formatting a Hebrew Year,
   * traditionally the thousands digit is omitted and output for a year such as 5729 (1969 Gregorian) would be
   * calculated for 729 and format as &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;. When set to true the long format year such
   * as &#x5D4;&#x5F3; &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8; for 5729/1969 is returned.
   *
   * @return true if set to use the thousands digit when formatting Hebrew dates and numbers.
   */
  isUseLongHebrewYears() {
    return this.useLonghebrewYears;
  }
  /**
   * When formatting a Hebrew Year, traditionally the thousands digit is omitted and output for a year such as 5729
   * (1969 Gregorian) would be calculated for 729 and format as &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;. This method
   * allows setting this to true to return the long format year such as &#x5D4;&#x5F3;
   * &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8; for 5729/1969.
   *
   * @param useLongHebrewYears
   *            Set this to true to use the long formatting
   */
  setUseLongHebrewYears(useLongHebrewYears) {
    this.useLonghebrewYears = useLongHebrewYears;
  }
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
  format(jewishDate) {
    if (this.isHebrewFormat()) {
      return `${this.formatHebrewNumber(jewishDate.getJewishDayOfMonth())} ${this.formatMonth(jewishDate)} ${this.formatHebrewNumber(jewishDate.getJewishYear())}`;
    }
    return `${jewishDate.getJewishDayOfMonth()} ${this.formatMonth(jewishDate)}, ${jewishDate.getJewishYear()}`;
  }
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
  formatMonth(jewishDate) {
    const month = jewishDate.getJewishMonth();
    if (this.isHebrewFormat()) {
      if (jewishDate.isJewishLeapYear() && month === JewishDate.ADAR) {
        return this.hebrewMonths[13] + (this.useGershGershayim ? _HebrewDateFormatter.GERESH : "");
      } else if (jewishDate.isJewishLeapYear() && month === JewishDate.ADAR_II) {
        return this.hebrewMonths[12] + (this.useGershGershayim ? _HebrewDateFormatter.GERESH : "");
      }
      return this.hebrewMonths[month - 1];
    }
    if (jewishDate.isJewishLeapYear() && month === JewishDate.ADAR) {
      return this.transliteratedMonths[13];
    }
    return this.transliteratedMonths[month - 1];
  }
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
  formatOmer(jewishCalendar) {
    const omer = jewishCalendar.getDayOfOmer();
    if (omer === -1) {
      return "";
    }
    if (this.hebrewFormat) {
      return `${this.formatHebrewNumber(omer)} ${this.hebrewOmerPrefix}\u05E2\u05D5\u05DE\u05E8`;
    }
    if (omer === 33) {
      return this.transliteratedHolidays[33];
    }
    return `Omer ${omer}`;
  }
  /**
   * Formats a molad.
   * TODO: Experimental and incomplete
   *
   * @param moladChalakim - the chalakim of the molad
   * @return the formatted molad. FIXME: define proper format in English and Hebrew.
   */
  static formatMolad(moladChalakim) {
    let adjustedChalakim = moladChalakim;
    const MINUTE_CHALAKIM = 18;
    const HOUR_CHALAKIM = 1080;
    const DAY_CHALAKIM = 24 * HOUR_CHALAKIM;
    let days = adjustedChalakim / DAY_CHALAKIM;
    adjustedChalakim -= days * DAY_CHALAKIM;
    const hours = Math.trunc(adjustedChalakim / HOUR_CHALAKIM);
    if (hours >= 6) {
      days += 1;
    }
    adjustedChalakim -= hours * HOUR_CHALAKIM;
    const minutes = Math.trunc(adjustedChalakim / MINUTE_CHALAKIM);
    adjustedChalakim -= minutes * MINUTE_CHALAKIM;
    return `Day: ${days % 7} hours: ${hours}, minutes: ${minutes}, chalakim: ${adjustedChalakim}`;
  }
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
  getFormattedKviah(jewishYear) {
    const jewishDate = new JewishDate(jewishYear, JewishDate.TISHREI, 1);
    const kviah = jewishDate.getCheshvanKislevKviah();
    const roshHashanaDayOfweek = jewishDate.getDayOfWeek();
    let returnValue = this.formatHebrewNumber(roshHashanaDayOfweek);
    returnValue += kviah === JewishDate.CHASERIM ? "\u05D7" : kviah === JewishDate.SHELAIMIM ? "\u05E9" : "\u05DB";
    jewishDate.setJewishDate(jewishYear, JewishDate.NISSAN, 15);
    const pesachDayOfweek = jewishDate.getDayOfWeek();
    returnValue += this.formatHebrewNumber(pesachDayOfweek);
    returnValue = returnValue.replace(new RegExp(_HebrewDateFormatter.GERESH, "g"), "");
    return returnValue;
  }
  /**
   * Formats the <a href="https://en.wikipedia.org/wiki/Daf_Yomi">Daf Yomi</a> Bavli in the format of
   * "&#x05E2;&#x05D9;&#x05E8;&#x05D5;&#x05D1;&#x05D9;&#x05DF; &#x05E0;&#x05F4;&#x05D1;" in {@link #isHebrewFormat() Hebrew},
   * or the transliterated format of "Eruvin 52".
   * @param daf the Daf to be formatted.
   * @return the formatted daf.
   */
  formatDafYomiBavli(daf) {
    if (this.hebrewFormat) {
      return `${daf.getMasechta()} ${this.formatHebrewNumber(daf.getDaf())}`;
    }
    return `${daf.getMasechtaTransliterated()} ${daf.getDaf()}`;
  }
  /**
   * Formats the <a href="https://en.wikipedia.org/wiki/Jerusalem_Talmud#Daf_Yomi_Yerushalmi">Daf Yomi Yerushalmi</a> in the format
   * of "&#x05E2;&#x05D9;&#x05E8;&#x05D5;&#x05D1;&#x05D9;&#x05DF; &#x05E0;&#x05F4;&#x05D1;" in {@link #isHebrewFormat() Hebrew}, or
   * the transliterated format of "Eruvin 52".
   *
   * @param daf the Daf to be formatted.
   * @return the formatted daf.
   */
  formatDafYomiYerushalmi(daf) {
    if (this.hebrewFormat) {
      const dafName2 = daf.getDaf() === 0 ? "" : ` ${this.formatHebrewNumber(daf.getDaf())}`;
      return daf.getYerushalmiMasechta() + dafName2;
    }
    const dafName = daf.getDaf() === 0 ? "" : ` ${daf.getDaf()}`;
    return daf.getYerushlmiMasechtaTransliterated() + dafName;
  }
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
  formatHebrewNumber(num) {
    if (num !== Math.trunc(num))
      throw new IllegalArgumentException("number must be an integer.");
    if (num < 0) {
      throw new IllegalArgumentException("negative numbers can't be formatted");
    } else if (num > 9999) {
      throw new IllegalArgumentException("numbers > 9999 can't be formatted");
    }
    const ALAFIM = "\u05D0\u05DC\u05E4\u05D9\u05DD";
    const EFES = "\u05D0\u05E4\u05E1";
    const jHundreds = [
      "",
      "\u05E7",
      "\u05E8",
      "\u05E9",
      "\u05EA",
      "\u05EA\u05E7",
      "\u05EA\u05E8",
      "\u05EA\u05E9",
      "\u05EA\u05EA",
      "\u05EA\u05EA\u05E7"
    ];
    const jTens = [
      "",
      "\u05D9",
      "\u05DB",
      "\u05DC",
      "\u05DE",
      "\u05E0",
      "\u05E1",
      "\u05E2",
      "\u05E4",
      "\u05E6"
    ];
    const jTenEnds = [
      "",
      "\u05D9",
      "\u05DA",
      "\u05DC",
      "\u05DD",
      "\u05DF",
      "\u05E1",
      "\u05E2",
      "\u05E3",
      "\u05E5"
    ];
    const tavTaz = ["\u05D8\u05D5", "\u05D8\u05D6"];
    const jOnes = [
      "",
      "\u05D0",
      "\u05D1",
      "\u05D2",
      "\u05D3",
      "\u05D4",
      "\u05D5",
      "\u05D6",
      "\u05D7",
      "\u05D8"
    ];
    if (num === 0) {
      return EFES;
    }
    const shortNumber = num % 1e3;
    const singleDigitNumber = shortNumber < 11 || shortNumber < 100 && shortNumber % 10 === 0 || shortNumber <= 400 && shortNumber % 100 === 0;
    const thousands = Math.trunc(num / 1e3);
    let sb = "";
    if (num % 1e3 === 0) {
      sb = sb.concat(jOnes[thousands]);
      if (this.isUseGershGershayim()) {
        sb = sb.concat(_HebrewDateFormatter.GERESH);
      }
      sb = sb.concat(" ");
      sb = sb.concat(ALAFIM);
      return sb;
    } else if (this.useLonghebrewYears && num >= 1e3) {
      sb = sb.concat(jOnes[thousands]);
      if (this.isUseGershGershayim()) {
        sb = sb.concat(_HebrewDateFormatter.GERESH);
      }
      sb = sb.concat(" ");
    }
    num = num % 1e3;
    const hundreds = Math.trunc(num / 100);
    sb = sb.concat(jHundreds[hundreds]);
    num = num % 100;
    if (num === 15) {
      sb = sb.concat(tavTaz[0]);
    } else if (num === 16) {
      sb = sb.concat(tavTaz[1]);
    } else {
      const tens = Math.trunc(num / 10);
      if (num % 10 === 0) {
        if (!singleDigitNumber) {
          if (this.isUseFinalFormLetters()) {
            sb = sb.concat(jTenEnds[tens]);
          } else {
            sb = sb.concat(jTens[tens]);
          }
        } else {
          sb = sb.concat(jTens[tens]);
        }
      } else {
        sb = sb.concat(jTens[tens]);
        num = num % 10;
        sb = sb.concat(jOnes[num]);
      }
    }
    if (this.isUseGershGershayim()) {
      if (singleDigitNumber) {
        sb = sb.concat(_HebrewDateFormatter.GERESH);
      } else {
        sb = sb.substr(0, sb.length - 1).concat(_HebrewDateFormatter.GERSHAYIM).concat(sb.substr(sb.length - 1, 1));
      }
    }
    return sb;
  }
  /**
   * Returns the list of transliterated parshiyos used by this formatter.
   *
   * @return the list of transliterated Parshios
   */
  getTransliteratedParshiosList() {
    return this.transliteratedParshaMap;
  }
  /**
   * Setter method to allow overriding of the default list of parshiyos transliterated into into Latin chars. The
   * default uses Ashkenazi American English transliteration.
   *
   * @param transliteratedParshaMap
   *            the transliterated Parshios as an EnumMap to set
   * @see #getTransliteratedParshiosList()
   */
  setTransliteratedParshiosList(transliteratedParshaMap) {
    this.transliteratedParshaMap = transliteratedParshaMap;
  }
  /**
   * Returns a String with the name of the current parsha(ios). If the formatter is set to format in Hebrew, returns
   * a string of the current parsha(ios) in Hebrew for example &#x05D1;&#x05E8;&#x05D0;&#x05E9;&#x05D9;&#x05EA; or
   * &#x05E0;&#x05E6;&#x05D1;&#x05D9;&#x05DD; &#x05D5;&#x05D9;&#x05DC;&#x05DA; or an empty string if there
   * are none. If not set to Hebrew, it returns a string of the parsha(ios) transliterated into Latin chars. The
   * default uses Ashkenazi pronunciation in typical American English spelling, for example Bereshis or
   * Nitzavim Vayeilech or an empty string if there are none.
   *
   * @param jewishCalendar the JewishCalendar Object
   * @return today's parsha(ios) in Hebrew for example, if the formatter is set to format in Hebrew, returns a string
   *         of the current parsha(ios) in Hebrew for example &#x05D1;&#x05E8;&#x05D0;&#x05E9;&#x05D9;&#x05EA; or
   *         &#x05E0;&#x05E6;&#x05D1;&#x05D9;&#x05DD; &#x05D5;&#x05D9;&#x05DC;&#x05DA; or an empty string if
   *         there are none. If not set to Hebrew, it returns a string of the parsha(ios) transliterated into Latin
   *         chars. The default uses Ashkenazi pronunciation in typical American English spelling, for example
   *         Bereshis or Nitzavim Vayeilech or an empty string if there are none.
   */
  formatParsha(jewishCalendar) {
    const parsha = jewishCalendar.getParsha();
    return this.hebrewFormat ? this.hebrewParshaMap[parsha] || "" : this.transliteratedParshaMap[parsha] || "";
  }
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
  formatSpecialParsha(jewishCalendar) {
    const specialParsha = jewishCalendar.getSpecialShabbos();
    return this.hebrewFormat ? this.hebrewParshaMap[specialParsha] || "" : this.transliteratedParshaMap[specialParsha] || "";
  }
};
/**
 * The <a href="https://en.wikipedia.org/wiki/Geresh#Punctuation_mark">gersh</a> character is the &#x05F3; char
 * that is similar to a single quote and is used in formatting Hebrew numbers.
 */
__publicField(_HebrewDateFormatter, "GERESH", "\u05F3");
/**
 * The <a href="https://en.wikipedia.org/wiki/Gershayim#Punctuation_mark">gershyim</a> character is the &#x05F4; char
 * that is similar to a double quote and is used in formatting Hebrew numbers.
 */
__publicField(_HebrewDateFormatter, "GERSHAYIM", "\u05F4");
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
__publicField(_HebrewDateFormatter, "hebrewHolidays", [
  "\u05E2\u05E8\u05D1 \u05E4\u05E1\u05D7",
  "\u05E4\u05E1\u05D7",
  "\u05D7\u05D5\u05DC \u05D4\u05DE\u05D5\u05E2\u05D3 \u05E4\u05E1\u05D7",
  "\u05E4\u05E1\u05D7 \u05E9\u05E0\u05D9",
  "\u05E2\u05E8\u05D1 \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
  "\u05E9\u05D1\u05D5\u05E2\u05D5\u05EA",
  "\u05E9\u05D1\u05E2\u05D4 \u05E2\u05E9\u05E8 \u05D1\u05EA\u05DE\u05D5\u05D6",
  "\u05EA\u05E9\u05E2\u05D4 \u05D1\u05D0\u05D1",
  "\u05D8\u05F4\u05D5 \u05D1\u05D0\u05D1",
  "\u05E2\u05E8\u05D1 \u05E8\u05D0\u05E9 \u05D4\u05E9\u05E0\u05D4",
  "\u05E8\u05D0\u05E9 \u05D4\u05E9\u05E0\u05D4",
  "\u05E6\u05D5\u05DD \u05D2\u05D3\u05DC\u05D9\u05D4",
  "\u05E2\u05E8\u05D1 \u05D9\u05D5\u05DD \u05DB\u05D9\u05E4\u05D5\u05E8",
  "\u05D9\u05D5\u05DD \u05DB\u05D9\u05E4\u05D5\u05E8",
  "\u05E2\u05E8\u05D1 \u05E1\u05D5\u05DB\u05D5\u05EA",
  "\u05E1\u05D5\u05DB\u05D5\u05EA",
  "\u05D7\u05D5\u05DC \u05D4\u05DE\u05D5\u05E2\u05D3 \u05E1\u05D5\u05DB\u05D5\u05EA",
  "\u05D4\u05D5\u05E9\u05E2\u05E0\u05D0 \u05E8\u05D1\u05D4",
  "\u05E9\u05DE\u05D9\u05E0\u05D9 \u05E2\u05E6\u05E8\u05EA",
  "\u05E9\u05DE\u05D7\u05EA \u05EA\u05D5\u05E8\u05D4",
  "\u05E2\u05E8\u05D1 \u05D7\u05E0\u05D5\u05DB\u05D4",
  "\u05D7\u05E0\u05D5\u05DB\u05D4",
  "\u05E2\u05E9\u05E8\u05D4 \u05D1\u05D8\u05D1\u05EA",
  "\u05D8\u05F4\u05D5 \u05D1\u05E9\u05D1\u05D8",
  "\u05EA\u05E2\u05E0\u05D9\u05EA \u05D0\u05E1\u05EA\u05E8",
  "\u05E4\u05D5\u05E8\u05D9\u05DD",
  "\u05E4\u05D5\u05E8\u05D9\u05DD \u05E9\u05D5\u05E9\u05DF",
  "\u05E4\u05D5\u05E8\u05D9\u05DD \u05E7\u05D8\u05DF",
  "\u05E8\u05D0\u05E9 \u05D7\u05D5\u05D3\u05E9",
  "\u05D9\u05D5\u05DD \u05D4\u05E9\u05D5\u05D0\u05D4",
  "\u05D9\u05D5\u05DD \u05D4\u05D6\u05D9\u05DB\u05E8\u05D5\u05DF",
  "\u05D9\u05D5\u05DD \u05D4\u05E2\u05E6\u05DE\u05D0\u05D5\u05EA",
  "\u05D9\u05D5\u05DD \u05D9\u05E8\u05D5\u05E9\u05DC\u05D9\u05DD",
  "\u05DC\u05F4\u05D2 \u05D1\u05E2\u05D5\u05DE\u05E8",
  "\u05E4\u05D5\u05E8\u05D9\u05DD \u05E9\u05D5\u05E9\u05DF \u05E7\u05D8\u05DF"
]);
/**
 * Unicode list of Hebrew days of week in the format of <code>["&#x05E8;&#x05D0;&#x05E9;&#x05D5;&#x05DF;",
 * "&#x05E9;&#x05E0;&#x05D9;","&#x05E9;&#x05DC;&#x05D9;&#x05E9;&#x05D9;","&#x05E8;&#x05D1;&#x05D9;&#x05E2;&#x05D9;",
 * "&#x05D7;&#x05DE;&#x05D9;&#x05E9;&#x05D9;","&#x05E9;&#x05E9;&#x05D9;","&#x05E9;&#x05D1;&#x05EA;"]</code>
 */
__publicField(_HebrewDateFormatter, "hebrewDaysOfWeek", [
  "\u05E8\u05D0\u05E9\u05D5\u05DF",
  "\u05E9\u05E0\u05D9",
  "\u05E9\u05DC\u05D9\u05E9\u05D9",
  "\u05E8\u05D1\u05D9\u05E2\u05D9",
  "\u05D7\u05DE\u05D9\u05E9\u05D9",
  "\u05E9\u05E9\u05D9",
  "\u05E9\u05D1\u05EA"
]);
let HebrewDateFormatter = _HebrewDateFormatter;

function getZmanimJson(options) {
  const geoLocation = new GeoLocation(
    options.locationName || null,
    options.latitude,
    options.longitude,
    options.elevation || 0,
    options.timeZoneId
  );
  const zmanimCalendar = options.complexZmanim ? new ComplexZmanimCalendar(geoLocation) : new ZmanimCalendar(geoLocation);
  zmanimCalendar.setDate(options.date || DateTime.local());
  return ZmanimFormatter.toJSON(zmanimCalendar);
}
const Luxon = _Luxon;

export { AstronomicalCalendar, Calendar, ComplexZmanimCalendar, Daf, GeoLocation, GeoLocationUtils, HebrewDateFormatter, IntegerUtils, JewishCalendar, JewishDate, Long_MIN_VALUE, Luxon, MathUtils, NOAACalculator, Parsha, StringUtils, SunTimesCalculator, Time, TimeZone, Utils, YerushalmiYomiCalculator, YomiCalculator, Zman, ZmanimCalendar, ZmanimFormatter, getZmanimJson, padZeros };
//# sourceMappingURL=bundle.js.map
