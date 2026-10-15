// @ts-check

import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions } from "../ROYZmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { isInIsrael } from "../misc/israel.js";
import { loadRefraction, readCachedRefraction, providerFromCache } from "../refraction-data.js";

/** How long the first render waits for fresh refraction data before using what's stored (offline TVs). */
const REFRACTION_WAIT_MS = 8000;

/** @typedef {{
    seconds: boolean;
    timeFormat: "h11" | "h12" | "h23" | "h24";
    language: "hb" | "en" | "en-et";
    location: {
        name: string;
        lat: number;
        long: number;
        elevation: number;
        timezone: string;
    };
    calendarToggle: {
        rtKulah: boolean;
        tekufaMidpoint: "hatzoth" | "arbitrary";
        tekufaCalc: "shemuel" | "adabaravah";
        forceSunSeasonal: boolean;
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

	/** @type {[string, number, number, number, string]} */
	// @ts-ignore
	const glArgs = Object.values(scheduleSettings.location)
	geoLocation = new GeoLocation(...glArgs);

	currentZDT = Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone);

	jCal = new WebsiteLimudCalendar(currentZDT.toPlainDate());
	jCal.setInIsrael(isInIsrael(geoLocation.getLatitude(), geoLocation.getLongitude()))

	// ─── Refraction (forecast air + terrain horizon), same source as the website and weekly print ───
	// The screen reloads itself daily (reload.js), and this module runs again each time, so each day starts
	// with current data. Start from what's stored (instant, works offline); give the network a few seconds
	// to bring something fresher. If it's slower than that, it keeps loading in the background and fills
	// the stored data (IndexedDB), so the next reload gets it.
	const lat = geoLocation.getLatitude(), lon = geoLocation.getLongitude();
	const cachedRefraction = await readCachedRefraction(lat, lon);
	/** @type {Pick<import("../ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} */
	let refraction = {
		atmosphereProvider: providerFromCache(cachedRefraction),
		horizon: cachedRefraction?.horizon ?? null,
		haze: cachedRefraction?.haze ?? null
	};

	/** @type {import("../refraction-data.js").RefractionData | null} */
	const freshRefraction = await Promise.race([
		loadRefraction(lat, lon).catch((e) => { console.error("Refraction data failed to load", e); return null; }),
		new Promise((resolve) => setTimeout(() => resolve(null), REFRACTION_WAIT_MS))
	]);
	if (freshRefraction) {
		if (freshRefraction.notes.length)
			console.info("Refraction:", freshRefraction.notes);
		refraction = { atmosphereProvider: freshRefraction.provider, horizon: freshRefraction.horizon, haze: freshRefraction.haze };
	}

	zmanCalc = new ZemanFunctions(geoLocation, {
		elevation: jCal.getInIsrael(),
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

	dtF = [scheduleSettings.language == 'hb' ? 'he' : 'en', {
		hourCycle: scheduleSettings.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];
}
await refreshBase();

export { scheduleSettings, geoLocation, currentZDT, jCal, zmanCalc, dtF, refreshBase };

