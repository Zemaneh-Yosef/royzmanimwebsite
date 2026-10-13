//@ts-check

/**
 * print-config.js — the one place the weekly print reads its settings from.
 *
 * Two sources, same shape out:
 *  - `?config=<name>` loads /assets/weeklyConfig/<name>.json
 *  - otherwise the config is built from the site settings (localStorage / URL params), exactly what
 *    print-export-url-param.js used to read, so the old links keep working
 *
 * Every weekly-print module (the main loader, hiloulot-add.js, the inline scripts on the page) imports
 * `printConfig`; ES modules are evaluated once per page, so the JSON is fetched once.
 */

/**
 * @typedef {Object} TzeithIssurMelakha
 * @property {number} minutes - Offset duration in minutes.
 * @property {number} degree - Solar depression angle in degrees.
 */

/**
 * @typedef {Object} CustomTimes
 * @property {number} candleLighting - Minutes before sunset for candle lighting.
 * @property {TzeithIssurMelakha} tzeithIssurMelakha - Parameters for nightfall/end of forbidden work.
 */

/**
 * @typedef {Object} CalendarToggle
 * @property {boolean} rtKulah - Toggles Rabbeinu Tam leniency calculation.
 * @property {string} [tekufaMidpoint] - Midpoint reference method (e.g., "hatzoth").
 * @property {string} [tekufaCalc] - Calculation method used for season changes (e.g., "shemuel").
 * @property {boolean} forceSunSeasonal - Forces seasonal calculations based directly on the sun.
 */

/**
 * @typedef {Object} WeeklyPrint
 * @property {number} [year] - Year to print; above 4000 is read as a Hebrew year.
 * @property {number|"current"} [month] - Month to start from (default 1); "current" = this month.
 * @property {'iso8601'|'hebrew'} [yearType] - Overrides the calendar the year/month are in.
 * @property {boolean} [continueToNext] - Print through the end of the following year too.
 * @property {boolean} [noTzetStrict] - Drop the stringent nightfall next to the regular one.
 * @property {string} [nationality] - Hiloulot: community whose entries are preferred (e.g. "Syrian").
 * @property {number} [addExtraHiloulot] - Hiloulot: number of "additional hiloulot" pages.
 * @property {boolean} [skipMonthPages] - Hiloulot: skip the per-month hiloulot pages.
 */

/**
 * @typedef {Object} LocationConfig
 * @property {string} name - Name of the location.
 * @property {number} lat - Latitude.
 * @property {number} long - Longitude.
 * @property {number} [elevation] - Elevation in meters above sea level.
 * @property {string} timezone - IANA timezone identifier; every location must share the same one.
 */

/**
 * @typedef {Object} PrintConfig
 * @property {boolean} seconds
 * @property {'h11'|'h12'|'h23'|'h24'} timeFormat
 * @property {'hb'|'en'|'en-et'} language
 * @property {CalendarToggle} calendarToggle
 * @property {CustomTimes} customTimes
 * @property {WeeklyPrint} weeklyPrint
 * @property {LocationConfig[]} location - One or more nearby locations. With several, the zemanim are
 *   averaged across them and the visible sunrise is listed per location.
 * @property {string} [title] - Printed name; defaults to the location names joined.
 * @property {boolean} [israel] - Overrides the "Israel" detection from the location names.
 * @property {'json'|'url'} source - Where the config came from (set by the loader).
 */

const params = new URLSearchParams(window.location.search);

/** @returns {Promise<PrintConfig>} */
async function loadPrintConfig() {
	/** @type {PrintConfig} */
	let config;

	if (params.has('config')) {
		const name = params.get('config');
		if (!/^[\w.-]+$/.test(name) || name.includes('..'))
			throw new Error(`Invalid config name "${name}"`);

		const response = await fetch(`/assets/weeklyConfig/${name}.json`);
		if (!response.ok)
			throw new Error(`Could not load /assets/weeklyConfig/${name}.json (${response.status})`);
		config = { ...(await response.json()), source: 'json' };
	} else {
		config = await configFromSettings();
	}

	return normalize(config);
}

/**
 * The old URL-param print, expressed as a config
 * @returns {Promise<PrintConfig>}
 */
async function configFromSettings() {
	const { settings } = await import("../../settings/handler.js");

	const lat = settings.location.lat(), long = settings.location.long();
	if (isNaN(lat) && isNaN(long)) {
		window.location.href = "/";
		throw new Error("No location set");
	}

	/** @type {WeeklyPrint} */
	const weeklyPrint = {};
	if (params.has('year'))
		weeklyPrint.year = parseInt(params.get('year'));
	if (params.has('month'))
		weeklyPrint.month = parseInt(params.get('month'));
	else if (params.has('currentMonth') && !params.has('year'))
		weeklyPrint.month = "current";
	if (['iso8601', 'hebrew'].includes(params.get('yearType')))
		weeklyPrint.yearType = /** @type {'iso8601'|'hebrew'} */ (params.get('yearType'));
	else
		// The URL page always went by the language when no yearType was given
		weeklyPrint.yearType = settings.language() == 'en' ? 'iso8601' : 'hebrew';
	weeklyPrint.continueToNext = params.has('continueToNext');
	weeklyPrint.noTzetStrict = params.has('noTzetStrict');
	if (params.has('nationality'))
		weeklyPrint.nationality = params.get('nationality');
	if (params.has('addExtraHiloulot'))
		weeklyPrint.addExtraHiloulot = parseInt(params.get('addExtraHiloulot')) || 0;

	return {
		seconds: settings.seconds(),
		timeFormat: settings.timeFormat(),
		language: settings.language(),
		calendarToggle: {
			rtKulah: settings.calendarToggle.rtKulah(),
			tekufaMidpoint: settings.calendarToggle.tekufaMidpoint(),
			tekufaCalc: settings.calendarToggle.tekufaCalc(),
			forceSunSeasonal: settings.calendarToggle.forceSunSeasonal()
		},
		customTimes: {
			candleLighting: settings.customTimes.candleLighting(),
			tzeithIssurMelakha: settings.customTimes.tzeithIssurMelakha()
		},
		weeklyPrint,
		location: [{
			name: settings.location.name(),
			lat,
			long,
			elevation: settings.location.elevation(),
			timezone: settings.location.timezone()
		}],
		source: 'url'
	};
}

/**
 * Fills in defaults and checks the locations
 * @param {PrintConfig} config
 * @returns {PrintConfig}
 */
function normalize(config) {
	// A single location object (the old shape) is still accepted
	/** @type {LocationConfig[]} */
	const locations = Array.isArray(config.location) ? config.location : config.location ? [config.location] : [];
	if (!locations.length)
		throw new Error("The print config has no locations");

	for (const [index, loc] of locations.entries()) {
		if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.long))
			throw new Error(`Location ${index + 1} (${loc.name ?? "unnamed"}) needs a numeric lat and long`);
		if (!loc.timezone)
			throw new Error(`Location ${index + 1} (${loc.name ?? "unnamed"}) needs a timezone`);
		loc.elevation = Number.isFinite(loc.elevation) ? loc.elevation : 0;
		loc.name ??= `Location ${index + 1}`;
	}

	const zones = [...new Set(locations.map(loc => loc.timezone))];
	if (zones.length > 1)
		throw new Error(`Every location must share one timezone; found ${zones.join(", ")}`);

	const language = ['hb', 'en', 'en-et'].includes(config.language) ? config.language : 'en';

	return {
		...config,
		seconds: !!config.seconds,
		timeFormat: ['h11', 'h12', 'h23', 'h24'].includes(config.timeFormat) ? config.timeFormat : 'h12',
		language,
		calendarToggle: {
			rtKulah: true,
			forceSunSeasonal: false,
			...config.calendarToggle
		},
		customTimes: {
			candleLighting: 20,
			tzeithIssurMelakha: { minutes: 30, degree: 7.165 },
			...config.customTimes
		},
		weeklyPrint: { ...config.weeklyPrint },
		location: locations,
		title: config.title || locations.map(loc => loc.name).join(" · ")
	};
}

/**
 * The calendar the year / month are counted in
 * @param {PrintConfig} config
 * @returns {'iso8601'|'hebrew'}
 */
export function printCalendar(config) {
	if (config.weeklyPrint.yearType)
		return config.weeklyPrint.yearType;
	if (typeof config.weeklyPrint.year == "number")
		return config.weeklyPrint.year > 4000 ? "hebrew" : "iso8601";
	return config.language == 'en' ? 'iso8601' : 'hebrew';
}

/**
 * The Hebrew year the month (hiloulot) pages belong to: the printed year itself when it is a Hebrew
 * year, else the one whose Adar falls in the printed Gregorian year
 * @param {PrintConfig} config
 */
export function printHebrewYear(config) {
	const cal = printCalendar(config);
	const year = config.weeklyPrint.year ?? Temporal.Now.plainDateISO().withCalendar(cal).year;
	return cal == 'hebrew' ? year : year + 3760;
}

/** @type {Promise<PrintConfig>} */
export const printConfig = loadPrintConfig();

// A failed config would otherwise only show up as a blank page
printConfig.catch(err => {
	console.error(err);
	const banner = document.createElement("div");
	banner.style.cssText = "position:fixed;inset:0 0 auto;padding:1rem;background:#b91c1c;color:white;font:600 14px/1.4 sans-serif;z-index:9999";
	banner.textContent = "Print config error: " + (err instanceof Error ? err.message : String(err));
	(document.body ?? document.documentElement).appendChild(banner);
});
