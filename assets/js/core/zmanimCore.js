// @ts-check

// The zmanim calendar without a page: everything that decides which zemanim a day has and at what time,
// with no DOM, no localStorage and no window. The calendar (zmanimListUpdater.js, settings/handler.js)
// runs on it, and so does the notification server (Zemaneh-Yosef/website-notif), which imports these files
// at a pinned commit of this repository. Keep it free of browser-only APIs: the server runs it in Deno.
//
// Needs a global Temporal (the site's polyfill: assets/libraries/temporal-polyfill/global.min.js).

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions, methodNamesOf } from "../ROYZmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { isInIsrael } from "../misc/israel.js";

export { ZMANIM_SETTING_KEYS, settingSourceFrom, melakhaDegreeFromMinutes, zemanimSettings } from "./zmanimSettings.js";
/** @typedef {import("./zmanimSettings.js").ZemanimSettings} ZemanimSettings */
/** @typedef {import("./zmanimSettings.js").SettingSource} SettingSource */


/**
 * The calculator's configuration for a place, as the calendar builds it
 * @param {KosherZmanim.GeoLocation} geoLocation
 * @param {ZemanimSettings} settings
 * @param {Pick<import("../ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} refraction
 *   from refraction-data.js (loadRefraction / readCachedRefraction); all null = none
 * @returns {{ config: import("../ROYZmanim.js").ZemanimConfig; inIsrael: boolean }}
 */
export function buildZemanimConfig(geoLocation, settings, refraction) {
	const inIsrael = isInIsrael(geoLocation.getLatitude(), geoLocation.getLongitude());
	// Ohr HaChaim (fixed mil) in Israel or when chosen; Amudeh Hora'ah (degrees) elsewhere
	const fixedMil = inIsrael || settings.calendarToggle.forceSunSeasonal();

	return {
		inIsrael,
		config: {
			elevation: settings.calendarToggle.useElevation(inIsrael),
			fixedMil,
			rtKulah: settings.calendarToggle.rtKulah(),
			candleLighting: settings.customTimes.candleLighting(),
			melakha: settings.customTimes.tzeithIssurMelakha(inIsrael),
			atmosphereProvider: refraction.atmosphereProvider,
			horizon: refraction.horizon,
			haze: refraction.haze ?? null,
			humidity: settings.refraction.humidity(),
			seaSurfaceLayer: settings.refraction.seaSurfaceLayer(),
			hazeTzet: settings.refraction.hazeTzet(),
			hazeMaxDelayMinutes: settings.refraction.hazeMaxDelay()
		}
	};
}

/** @typedef {import("../WebsiteCalendar.js").zmanInfoList} ZmanListEntry */

/**
 * The calendar's list of zemanim from `_data/zmanim.yml`: one entry per shita ("latestShma-mga") or per
 * zeman without shitot ("sunset"), the same entries pages/calendar.html renders and the page reads back.
 * @param {any[]} zmanimData the parsed zmanim.yml
 * @param {typeof ZemanFunctions} [ZemanClass]
 * @returns {Record<string, Readonly<ZmanListEntry>>}
 */
export function zmanimListFromData(zmanimData, ZemanClass = ZemanFunctions) {
	const methodNames = methodNamesOf(ZemanClass);
	/** @param {any} value */
	const attr = (value) => value === undefined || value === null || value === "" ? null : String(value);

	/** @type {[string, Readonly<ZmanListEntry>][]} */
	const entries = [];
	for (const item of zmanimData) {
		const rows = item.shitot
			? item.shitot.map((/** @type {any} */ shita) => ({
				id: `${item.id}-${shita.id}`,
				source: shita,
				title: {
					he: `${item.names.he} - ${shita.names.he}`,
					en: `${item.names.en} - ${shita.names.en}`,
					'he-Latn': `${item.names["he-Latn"]} - ${shita.names["he-Latn"]}`
				}
			}))
			: [{ id: item.id, source: item, title: { he: item.names.he, en: item.names.en, 'he-Latn': item.names["he-Latn"] } }];

		for (const { id, source, title } of rows) {
			const fn = attr(source.timeGetter);
			if (!(id == 'candleLighting' || (fn && methodNames.includes(fn))))
				continue;
			const attributes = source.attributes || {};
			entries.push([id, Object.freeze({
				function: fn,
				yomTovInclusive: attr(attributes.yomTovInclusive),
				luachInclusive: /** @type {any} */ (attr(attributes.luachInclusive)),
				condition: attr(attributes.condition),
				round: /** @type {any} */ (attr(source.round)),
				title
			})]);
		}
	}
	return Object.fromEntries(entries);
}

/**
 * How times are written, as the calendar does it
 * @param {{ language: 'he'|'en'|'he-Latn'; hourCycle: 'h11'|'h12'|'h23'; seconds?: boolean; locale?: string }} options
 *   locale: the exact locale to format in (the page picks one from navigator.languages); default 'he' or 'en'
 * @returns {[string, Intl.DateTimeFormatOptions]}
 */
export function timeFormat({ language, hourCycle, seconds = false, locale }) {
	/** @type {Intl.DateTimeFormatOptions} */
	const options = { hourCycle, hour: 'numeric', minute: '2-digit' };
	if (seconds)
		options.second = '2-digit';
	return [locale || (language == 'he' ? 'he' : 'en'), options];
}

/**
 * A calculator for one place: the calendar's ZemanFunctions and Hebrew calendar, set up as the page sets
 * them up. Move it between days with `setDate`; `zemanim()` gives the current day's.
 */
export class ZmanimDay {
	/**
	 * @param {Object} options
	 * @param {KosherZmanim.GeoLocation} options.geoLocation
	 * @param {ZemanimSettings} options.settings
	 * @param {Record<string, Readonly<ZmanListEntry>>} options.zmanimList
	 * @param {[string, Intl.DateTimeFormatOptions]} options.dtF
	 * @param {Pick<import("../ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} [options.refraction]
	 * @param {Temporal.PlainDate} [options.date] default today at the place
	 * @param {typeof ZemanFunctions} [options.ZemanClass]
	 */
	constructor({ geoLocation, settings, zmanimList, dtF, refraction, date, ZemanClass = ZemanFunctions }) {
		this.geoLocation = geoLocation;
		this.zmanimList = zmanimList;
		this.dtF = dtF;
		const start = date ?? Temporal.Now.plainDateISO(geoLocation.getTimeZone());

		const { config, inIsrael } = buildZemanimConfig(geoLocation, settings,
			refraction ?? { atmosphereProvider: null, horizon: null, haze: null });
		this.config = config;
		this.jCal = new WebsiteLimudCalendar(start);
		this.jCal.setUseModernHolidays(true);
		this.jCal.setInIsrael(inIsrael);
		this.zmanCalc = new ZemanClass(geoLocation, config);
		this.setDate(start);
	}

	/** @param {Temporal.PlainDate} date */
	setDate(date) {
		this.zmanCalc.setDate(date);
		this.jCal.setDate(date);
	}

	/**
	 * The current day's zemanim, keyed like the list: what getZmanimInfo gives the calendar
	 * (display 1 = shown, 0 = not today, -1 = never for this place, -2 = can't be computed).
	 */
	zemanim() {
		return this.jCal.getZmanimInfo(false, this.zmanCalc, this.zmanimList, this.dtF);
	}

	/**
	 * The zemanim shown on a day, with their titles in a language, in time order
	 * @param {Temporal.PlainDate} date
	 * @param {'he'|'en'|'he-Latn'} language
	 * @returns {{ key: string; time: Temporal.ZonedDateTime; title: string; timeText: string }[]}
	 */
	shownOn(date, language) {
		this.setDate(date);
		const shown = [];
		for (const [key, zman] of Object.entries(this.zemanim())) {
			if (zman.display != 1 || !zman.zDTObj)
				continue;
			shown.push({
				key,
				// the time as written: to the minute, unless seconds are shown
				time: 'second' in zman.dtF[1] ? zman.zDTObj : zman.zDTObj.with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }),
				title: zman.title[language] || this.zmanimList[key].title[language],
				timeText: zman.zDTObj.toLocaleString(...zman.dtF)
			});
		}
		return shown.sort((a, b) => Temporal.ZonedDateTime.compare(a.time, b.time));
	}
}
