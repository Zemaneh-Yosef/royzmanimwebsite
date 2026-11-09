// @ts-check

// The settings that change the zemanim, read without a page (no localStorage, no URL): settings/handler.js
// runs on this, and so does the notification server through core/zmanimCore.js. Kept apart from the
// calculator so that every page (which loads handler.js) doesn't also load ROYZmanim.js.

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";

/**
 * The stored settings (localStorage keys, also accepted as URL parameters) that change which zemanim are
 * shown or their times. A client that hands the calculation to someone else (the notification server)
 * sends exactly these.
 */
export const ZMANIM_SETTING_KEYS = Object.freeze([
	"useElevation", "rtKulah", "forceSunSeasonal", "candles", "tzeithIMmin", "tzeithIMdeg", "tzeithIMdegMin",
	"hazeTzet", "hazeMaxDelay", "refrHumidity", "seaSurfaceLayer"
]);

/**
 * Where settings come from: `get` is the value in effect (as the page's `urlParams.get(key) ||
 * localStorage.getItem(key)`), `has` whether one was set at all.
 * @typedef {{ get: (key: string) => string | null; has: (key: string) => boolean }} SettingSource
 */

/**
 * A SettingSource over a plain object (the notification server's stored copy of a user's settings)
 * @param {Record<string, string | null | undefined>} values
 * @returns {SettingSource}
 */
export function settingSourceFrom(values) {
	const clean = (/** @type {string} */ key) => {
		const value = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
		return typeof value === "string" && value !== "" ? value : null;
	};
	return { get: clean, has: (key) => clean(key) !== null };
}

/** @typedef {{ minutes: number; degree: number }} MelakhaTzet */

/**
 * The degrees below the horizon that Tzet Melakha's minutes come to at Rav Ovadia's house on the equinox
 * @param {number} minutes
 */
export function melakhaDegreeFromMinutes(minutes) {
	const geoLocation = new KosherZmanim.GeoLocation("R Ovadia's house", 31.7898742, 35.1771491, 776, "UTC");
	const aCalendar = new KosherZmanim.AstronomicalCalendar(geoLocation);
	aCalendar.setDate(Temporal.Now.plainDateISO().with({ month: 3, day: 20 }));
	return aCalendar.getSunsetSolarDipFromOffset({ minutes });
}

/**
 * The settings that change the zemanim, read the same way the calendar always has
 * (see settings/handler.js, which runs on this).
 * @param {SettingSource} source
 * @param {{ remember?: (key: string, value: string) => void; savedDegree?: (minutes: number) => string | null }} [options]
 *   remember: keep a value worked out here for next time (the page saves the Tzet Melakha degree);
 *   savedDegree: the Tzet Melakha degree already worked out for these minutes (default: tzeithIMdeg when
 *   tzeithIMdegMin is these minutes)
 */
export function zemanimSettings(source, options = {}) {
	/** @param {string} key @param {string} [fallback] */
	const withDefault = (key, fallback) => source.has(key) ? source.get(key) : fallback;

	const calendarToggle = Object.freeze({
		rtKulah: () => withDefault("rtKulah", "true") == "true",
		forceSunSeasonal: () => withDefault("forceSunSeasonal") == "true",
		/** use the location's elevation for sunrise / sunset; on by default in Israel */
		useElevation: (/** @type {boolean} */ inIsrael) => withDefault("useElevation", inIsrael.toString()) == "true",
	});

	const refraction = Object.freeze({
		/** move Tzet Melakha by degrees by the evening's haze (star-visibility nightfall); on by default */
		hazeTzet: () => withDefault("hazeTzet", "true") == "true",
		/** @returns {number | null} largest haze delay either way in minutes; null = no cap */
		hazeMaxDelay: () => {
			const raw = source.get("hazeMaxDelay");
			if (raw == "none")
				return null;
			const minutes = parseFloat(raw);
			return Number.isFinite(minutes) && minutes >= 0 ? minutes : 15;
		},
		/** include water vapour in the refraction; off by default */
		humidity: () => withDefault("refrHumidity", "false") == "true",
		/** model the sea surface layer over water; off by default (unvalidated) */
		seaSurfaceLayer: () => withDefault("seaSurfaceLayer", "false") == "true",
	});

	const customTimes = Object.freeze({
		candleLighting: () => parseInt(source.get("candles")) || 20,
		/** @returns {MelakhaTzet} */
		tzeithIssurMelakha: (/** @type {boolean} */ inIsrael) => {
			if (!(source.get("tzeithIMmin") || "").trim() || isNaN(parseInt(source.get("tzeithIMmin")))) {
				const retObj = { minutes: 30, degree: 7.165 };
				if (calendarToggle.forceSunSeasonal() && !inIsrael)
					retObj.minutes = 40;
				return retObj;
			}

			const minutes = parseInt(source.get("tzeithIMmin"));
			// a degree is only kept for the minutes it was worked out from
			const savedDegree = options.savedDegree ? options.savedDegree(minutes)
				: source.get("tzeithIMdegMin") == minutes.toString() ? source.get("tzeithIMdeg") : null;
			if (!(savedDegree || "").trim()) {
				const degree = melakhaDegreeFromMinutes(minutes);
				if (options.remember) {
					options.remember("tzeithIMdeg", degree.toString());
					options.remember("tzeithIMdegMin", minutes.toString());
				}
				return { minutes, degree };
			}

			return { minutes, degree: parseFloat(savedDegree) };
		}
	});

	return Object.freeze({ calendarToggle, refraction, customTimes });
}

/** @typedef {ReturnType<typeof zemanimSettings>} ZemanimSettings */

/**
 * The refraction settings as plain values, as a print or shul-wall config keeps them (all optional there;
 * a missing one takes the calendar's default)
 * @typedef {{ humidity: boolean; seaSurfaceLayer: boolean; hazeTzet: boolean; hazeMaxDelay: number | null }} RefractionSettings
 */

/**
 * Everything the calculator takes from the settings, as plain values: ROYZmanim's ZemanimConfig without the
 * place's refraction data (zemanimConfigFrom adds that). Plain, so a page can post it to its workers.
 * @typedef {{
	elevation: boolean;
	fixedMil: boolean;
	rtKulah: boolean;
	candleLighting: number;
	melakha: import("../ROYZmanim.js").ZemanimConfig['melakha'];
	humidity: boolean;
	seaSurfaceLayer: boolean;
	hazeTzet: boolean;
	hazeMaxDelayMinutes: number | null;
  }} ZemanimOptions
 */

/**
 * The calculator's options from the visitor's settings: what the calendar, the prints and the notifications use
 * @param {ZemanimSettings} settings
 * @param {boolean} inIsrael
 * @returns {ZemanimOptions}
 */
export function zemanimOptions(settings, inIsrael) {
	return {
		elevation: settings.calendarToggle.useElevation(inIsrael),
		// Ohr HaChaim (fixed mil) in Israel or when chosen; Amudeh Hora'ah (degrees) elsewhere
		fixedMil: inIsrael || settings.calendarToggle.forceSunSeasonal(),
		rtKulah: settings.calendarToggle.rtKulah(),
		candleLighting: settings.customTimes.candleLighting(),
		melakha: settings.customTimes.tzeithIssurMelakha(inIsrael),
		humidity: settings.refraction.humidity(),
		seaSurfaceLayer: settings.refraction.seaSurfaceLayer(),
		hazeTzet: settings.refraction.hazeTzet(),
		hazeMaxDelayMinutes: settings.refraction.hazeMaxDelay()
	};
}

/**
 * The same from a plain config (a weekly print's or a shul wall's JSON), whose values were read from the
 * settings when it was made. A missing elevation or refraction value takes the calendar's default.
 * @param {{
	calendarToggle: { rtKulah: boolean; forceSunSeasonal: boolean; elevation?: boolean };
	customTimes: { candleLighting: number; tzeithIssurMelakha: { minutes: number; degree?: number } };
	refraction?: Partial<RefractionSettings>;
  }} config
 * @param {boolean} inIsrael
 * @returns {ZemanimOptions}
 */
export function zemanimOptionsFromConfig(config, inIsrael) {
	const refraction = config.refraction ?? {};
	return {
		elevation: config.calendarToggle.elevation ?? inIsrael,
		fixedMil: inIsrael || config.calendarToggle.forceSunSeasonal,
		rtKulah: config.calendarToggle.rtKulah,
		candleLighting: config.customTimes.candleLighting,
		melakha: config.customTimes.tzeithIssurMelakha,
		humidity: refraction.humidity ?? false,
		seaSurfaceLayer: refraction.seaSurfaceLayer ?? false,
		hazeTzet: refraction.hazeTzet ?? true,
		hazeMaxDelayMinutes: refraction.hazeMaxDelay === undefined ? 15 : refraction.hazeMaxDelay
	};
}

/**
 * The refraction settings in effect, to keep in a config that zemanimOptionsFromConfig reads later
 * @param {ZemanimSettings} settings
 * @returns {RefractionSettings}
 */
export function refractionSettings(settings) {
	return {
		humidity: settings.refraction.humidity(),
		seaSurfaceLayer: settings.refraction.seaSurfaceLayer(),
		hazeTzet: settings.refraction.hazeTzet(),
		hazeMaxDelay: settings.refraction.hazeMaxDelay()
	};
}

/**
 * The options part of a calculator's configuration (without its refraction data, which can't be posted)
 * @param {import("../ROYZmanim.js").ZemanimConfig} config
 * @returns {ZemanimOptions}
 */
export function optionsOf({ elevation, fixedMil, rtKulah, candleLighting, melakha, humidity, seaSurfaceLayer, hazeTzet, hazeMaxDelayMinutes }) {
	return { elevation, fixedMil, rtKulah, candleLighting, melakha, humidity, seaSurfaceLayer, hazeTzet, hazeMaxDelayMinutes };
}

/**
 * The calculator's configuration: the options plus the place's refraction data (refraction-data.js; in a
 * worker, rebuilt with providerFromSnapshot). Without data the calculator uses its standard air.
 * @param {ZemanimOptions} options
 * @param {{ atmosphereProvider?: import("../ROYZmanim.js").ZemanimConfig['atmosphereProvider']; horizon?: import("../ROYZmanim.js").ZemanimConfig['horizon']; haze?: import("../ROYZmanim.js").ZemanimConfig['haze'] }} [refraction]
 * @returns {import("../ROYZmanim.js").ZemanimConfig}
 */
export function zemanimConfigFrom(options, refraction = {}) {
	return {
		...options,
		atmosphereProvider: refraction.atmosphereProvider ?? null,
		horizon: refraction.horizon ?? null,
		haze: refraction.haze ?? null
	};
}

/**
 * The two shitot the flyers print side by side, the same for every visitor (not from the settings).
 *  - Ohr HaChaim: Tzet Melakha 30 fixed minutes after sunset.
 *  - Amudeh Hora'ah: 6.75° (27 minutes at Rav Ovadia's house on the equinox) rounded up to the next 5 minutes,
 *    but never past 7.165° (30 minutes there): getTzetMelakha's "PRETTY" handling of the two entries.
 * Each read gives a fresh object: getTzetMelakha sorts a melakha array in place.
 */
export const FLYER_SHITOT = Object.freeze({
	get ohrHachaim() {
		return { elevation: true, fixedMil: true, rtKulah: false, candleLighting: 20, melakha: { minutes: 30, degree: 7.165 } };
	},
	get amudehHoraah() {
		return { elevation: false, fixedMil: false, rtKulah: true, candleLighting: 20,
			melakha: [{ minutes: 27, degree: 6.75 }, { minutes: 30, degree: 7.165 }] };
	}
});
