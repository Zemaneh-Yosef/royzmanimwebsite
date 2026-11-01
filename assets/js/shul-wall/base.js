// @ts-check

import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions } from "../ROYZmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { isInIsrael } from "../misc/israel.js";
import { languageTag } from "../misc/language.js";
import { loadRefraction, readCachedRefraction, providerFromCache } from "../refraction-data.js";

/**
 * How long the first render waits for fresh refraction data, only when nothing usable is stored yet
 * (a new TV, or cleared storage). Every module on the page waits for this one, so the screen is blank meanwhile.
 */
const REFRACTION_WAIT_MS = 8000;
/** How long reading the stored refraction data may take before the page goes on without it. */
const REFRACTION_CACHE_WAIT_MS = 4000;

/** @typedef {{
    seconds: boolean;
    timeFormat: "h11" | "h12" | "h23" | "h24";
    language: "he" | "en" | "he-Latn";
    location: {
        name: string;
        lat: number;
        long: number;
        elevation: number;
        timezone: string;
    };
    calendarToggle: {
        rtKulah: boolean;
        tekufaMidpoint?: "hatzoth" | "arbitrary";
        tekufaCalc: "shemuel" | "adabaravah";
        forceSunSeasonal: boolean;
        elevation?: boolean;
    },
    customTimes: {
        candleLighting: number,
        tzeithIssurMelakha: { minutes: number, degree?: number }
    },
    schedule?: "manual" | {
        url: string;
        type: "excel" | "ini" | "json" | "toml";
        forUpcoming?: boolean;
        arrayBehavior: "return"|"newline"|"comma"
    }
}} ScheduleSettings */

/** @type {ScheduleSettings} */
let scheduleSettings;
/** @type {GeoLocation} */
let geoLocation;
/** @type {Temporal.ZonedDateTime} */
let currentZDT;
/** @type {WebsiteLimudCalendar} */
let jCal;
/** @type {ZemanFunctions} */
let zmanCalc;
/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
let dtF;

/**
 * Reads the page's config and today's date again; reload.js runs it before a soft swap re-runs the page's scripts.
 * @param {string} configText
 */
async function refreshBase(configText = document.getElementById("zy-scheduleScreen-config").textContent) {
	scheduleSettings = JSON.parse(configText)
	scheduleSettings.language = languageTag(scheduleSettings.language) ?? "en";

	/** @type {[string, number, number, number, string]} */
	// @ts-ignore
	const glArgs = Object.values(scheduleSettings.location)
	geoLocation = new GeoLocation(...glArgs);

	currentZDT = Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone);

	jCal = new WebsiteLimudCalendar(currentZDT.toPlainDate());
	jCal.setInIsrael(isInIsrael(geoLocation.getLatitude(), geoLocation.getLongitude()))
	scheduleSettings.calendarToggle.tekufaMidpoint ??= jCal.getInIsrael() ? "arbitrary" : "hatzoth";
	scheduleSettings.calendarToggle.elevation ??= jCal.getInIsrael();

	// ─── Refraction (forecast air + terrain horizon), same source as the website and weekly print ───
	// Every other module on the page imports this one, so nothing at all is drawn until this finishes.
	// Render from what's stored (instant, works offline) whenever there is any air data stored, and let
	// the network load carry on in the background: it fills the store (IndexedDB), and the screen reloads
	// itself often enough (after each zeman passes, transition.js; at midnight, reset.js) that the next
	// load shows it. Only a screen with nothing stored waits, and then only for a few seconds.
	const lat = geoLocation.getLatitude(), lon = geoLocation.getLongitude();
	/** @type {import("../refraction-data.js").CachedRefraction | null} */
	const cachedRefraction = await Promise.race([
		readCachedRefraction(lat, lon).catch(() => null),
		new Promise((resolve) => setTimeout(() => resolve(null), REFRACTION_CACHE_WAIT_MS))
	]);
	/** @type {Pick<import("../ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} */
	let refraction = {
		atmosphereProvider: providerFromCache(cachedRefraction),
		horizon: cachedRefraction?.horizon ?? null,
		haze: cachedRefraction?.haze ?? null
	};

	const freshLoad = loadRefraction(lat, lon)
		.then((fresh) => {
			if (fresh.notes.length)
				console.info("Refraction:", fresh.notes);
			return fresh;
		})
		.catch((e) => { console.error("Refraction data failed to load", e); return null; });

	if (!refraction.atmosphereProvider) {
		/** @type {import("../refraction-data.js").RefractionData | null} */
		const freshRefraction = await Promise.race([
			freshLoad,
			new Promise((resolve) => setTimeout(() => resolve(null), REFRACTION_WAIT_MS))
		]);
		if (freshRefraction)
			refraction = { atmosphereProvider: freshRefraction.provider, horizon: freshRefraction.horizon, haze: freshRefraction.haze };
	}

	zmanCalc = new ZemanFunctions(geoLocation, {
		elevation: scheduleSettings.calendarToggle.elevation,
		rtKulah: scheduleSettings.calendarToggle.rtKulah,
		candleLighting: scheduleSettings.customTimes.candleLighting,
		fixedMil: scheduleSettings.calendarToggle.forceSunSeasonal || jCal.getInIsrael(),
		melakha: scheduleSettings.customTimes.tzeithIssurMelakha,
		// getNetz() now ray-traces the visible sunrise from the horizon (replaces the ChaiTables 'ctNetz' data)
		atmosphereProvider: refraction.atmosphereProvider,
		horizon: refraction.horizon,
		haze: refraction.haze
	})
	zmanCalc.setDate(currentZDT.toPlainDate());

	dtF = [scheduleSettings.language == 'he' ? 'he' : 'en', {
		hourCycle: scheduleSettings.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];
}
await refreshBase();

export { scheduleSettings, geoLocation, currentZDT, jCal, zmanCalc, dtF, refreshBase };

