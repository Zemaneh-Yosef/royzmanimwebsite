// Small stand-ins for the Intl features the site uses that older engines lack. Each one is only
// installed when the browser doesn't already support it, so newer browsers keep their native Intl.
// Part of core.min.js; loaded before the Temporal polyfill so Temporal's toLocaleString() goes
// through these too.

const hasHourCycle = (() => {
	try {
		return new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23" }).resolvedOptions().hourCycle === "h23";
	} catch (e) {
		return false;
	}
})();

const hasDateStyle = (() => {
	try {
		return new Intl.DateTimeFormat("en", { dateStyle: "short" }).resolvedOptions().dateStyle === "short";
	} catch (e) {
		return false;
	}
})();

const hasUnitStyle = (() => {
	try {
		new Intl.NumberFormat("en", { style: "unit", unit: "meter" });
		return true;
	} catch (e) {
		return false;
	}
})();

// ─── DateTimeFormat: hourCycle and "-u-hc-" (Chrome < 73), dateStyle/timeStyle (Chrome < 76, Safari < 14.1) ───

const DATE_STYLES = {
	full: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
	long: { year: "numeric", month: "long", day: "numeric" },
	medium: { year: "numeric", month: "short", day: "numeric" },
	short: { year: "2-digit", month: "numeric", day: "numeric" }
};
const TIME_STYLES = {
	full: { hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" },
	long: { hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" },
	medium: { hour: "numeric", minute: "2-digit", second: "2-digit" },
	short: { hour: "numeric", minute: "2-digit" }
};

// Read options by name rather than copying own keys: the Temporal polyfill passes a Proxy that only
// answers property reads.
const DATE_TIME_OPTIONS = ["localeMatcher", "calendar", "numberingSystem", "timeZone", "hour12", "hourCycle",
	"formatMatcher", "weekday", "era", "year", "month", "day", "dayPeriod", "hour", "minute", "second",
	"fractionalSecondDigits", "timeZoneName", "dateStyle", "timeStyle"];

/** The hour cycle requested through a "-u-hc-" locale extension, as the Temporal polyfill does ("en-u-hc-h23"). */
function localeHourCycle(locales) {
	const tag = Array.isArray(locales) ? locales[0] : locales;
	const match = typeof tag === "string" && tag.match(/-u-(?:[a-z0-9]{2,8}-)*?hc-(h11|h12|h23|h24)\b/i);
	return match ? match[1].toLowerCase() : undefined;
}

/** Rewrite options into the older vocabulary. h11/h12 → 12-hour, h23/h24 → 24-hour. */
function adaptDateTimeOptions(options, locales) {
	if (options != null && typeof options !== "object") return options;
	const hourCycle = options && options.hourCycle || localeHourCycle(locales);
	const needsHour12 = !hasHourCycle && hourCycle && !(options && options.hour12 !== undefined);
	const needsStyles = !hasDateStyle && options && (options.dateStyle || options.timeStyle);
	if (!needsHour12 && !needsStyles) return options;

	const adapted = {};
	if (options)
		for (const name of DATE_TIME_OPTIONS)
			if (options[name] !== undefined) adapted[name] = options[name];
	if (needsHour12) adapted.hour12 = hourCycle === "h11" || hourCycle === "h12";
	if (needsStyles) {
		Object.assign(adapted, DATE_STYLES[options.dateStyle], TIME_STYLES[options.timeStyle]);
		delete adapted.dateStyle;
		delete adapted.timeStyle;
	}
	return adapted;
}

if (!hasHourCycle || !hasDateStyle) {
	const NativeDateTimeFormat = Intl.DateTimeFormat;
	const DateTimeFormat = function DateTimeFormat(locales, options) {
		return new NativeDateTimeFormat(locales, adaptDateTimeOptions(options, locales));
	};
	DateTimeFormat.prototype = NativeDateTimeFormat.prototype;
	DateTimeFormat.supportedLocalesOf = NativeDateTimeFormat.supportedLocalesOf;
	Object.defineProperty(Intl, "DateTimeFormat", { value: DateTimeFormat, writable: true, configurable: true });

	for (const method of ["toLocaleString", "toLocaleDateString", "toLocaleTimeString"]) {
		const native = Date.prototype[method];
		Object.defineProperty(Date.prototype, method, {
			value: function (locales, options) {
				return native.call(this, locales, adaptDateTimeOptions(options, locales));
			},
			writable: true,
			configurable: true
		});
	}
}

// ─── NumberFormat style: "unit" (Chrome < 77, Safari < 14.1) ───
// Covers the units the site formats; anything else falls back to "<number> <unit>".

const UNIT_LABELS = {
	en: { degree: ["°", " deg"], meter: ["m", " m"], kilometer: ["km", " km"], minute: ["m", " min"] },
	he: { degree: ["°", "°"], meter: ["מ׳", " מ׳"], kilometer: ["ק״מ", " ק״מ"], minute: ["ד׳", " דק׳"] }
};

if (!hasUnitStyle) {
	const NativeNumberFormat = Intl.NumberFormat;
	const NumberFormat = function NumberFormat(locales, options) {
		if (!options || options.style !== "unit")
			return new NativeNumberFormat(locales, options);

		const unit = options.unit;
		const display = options.unitDisplay || "short";
		const numberOptions = Object.assign({}, options);
		delete numberOptions.style;
		delete numberOptions.unit;
		delete numberOptions.unitDisplay;
		const numbers = new NativeNumberFormat(locales, numberOptions);

		const language = numbers.resolvedOptions().locale.split("-")[0] === "he" ? "he" : "en";
		const label = (UNIT_LABELS[language][unit] || [unit, " " + unit])[display === "narrow" ? 0 : 1];

		const formatter = Object.create(NativeNumberFormat.prototype);
		Object.defineProperties(formatter, {
			format: { value: (value) => numbers.format(value) + label },
			formatToParts: { value: (value) => numbers.formatToParts(value).concat([{ type: "unit", value: label.trim() }]) },
			resolvedOptions: { value: () => Object.assign(numbers.resolvedOptions(), { style: "unit", unit, unitDisplay: display }) }
		});
		return formatter;
	};
	NumberFormat.prototype = NativeNumberFormat.prototype;
	NumberFormat.supportedLocalesOf = NativeNumberFormat.supportedLocalesOf;
	Object.defineProperty(Intl, "NumberFormat", { value: NumberFormat, writable: true, configurable: true });
}

// ─── Intl.Locale (Chrome < 74) ───
// Just enough for settings/handler.js, which reads the -u-hc- (hour cycle) extension of a language tag.

if (typeof Intl.Locale !== "function") {
	const Locale = function Locale(tag) {
		if (!(this instanceof Locale)) throw new TypeError("Constructor Intl.Locale requires 'new'");
		const text = String(tag);
		const [base] = text.split(/-u-/i);
		const parts = base.split("-");
		const hourCycle = (text.match(/-u-(?:[a-z0-9]{2,8}-)*?hc-(h11|h12|h23|h24)\b/i) || [])[1];
		this.baseName = base;
		this.language = parts[0].toLowerCase();
		this.region = parts.slice(1).find((part) => /^([a-z]{2}|\d{3})$/i.test(part));
		this.hourCycle = hourCycle && hourCycle.toLowerCase();
		this.toString = () => text;
	};
	Object.defineProperty(Intl, "Locale", { value: Locale, writable: true, configurable: true });
}
