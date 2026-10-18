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
