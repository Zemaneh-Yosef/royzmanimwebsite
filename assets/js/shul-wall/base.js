// @ts-check

import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions } from "../ROYZmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
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
const scheduleSettings = JSON.parse(document.getElementById("zy-scheduleScreen-config").textContent)

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(scheduleSettings.location)
const geoLocation = new GeoLocation(...glArgs);

const currentZDT = Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone);

const jCal = new WebsiteLimudCalendar(currentZDT.toPlainDate());
jCal.setInIsrael(['israel', 'ישראל'].some(isrName => (geoLocation.getLocationName() || "").toLowerCase().includes(isrName)))

// ─── Refraction (forecast air + terrain horizon), same source as the website and weekly print ───
// The screen reloads itself daily (reload.js), and this module runs again each time, so each day starts
// with current data. Start from what's stored (instant, works offline); give the network a few seconds
// to bring something fresher. If it's slower than that, it keeps loading in the background and fills
// localStorage, so the next reload gets it.
const lat = geoLocation.getLatitude(), lon = geoLocation.getLongitude();
const cachedRefraction = readCachedRefraction(lat, lon);
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

const zmanCalc = new ZemanFunctions(geoLocation, {
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

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const dtF = [scheduleSettings.language == 'hb' ? 'he' : 'en', {
    hourCycle: scheduleSettings.timeFormat,
    hour: 'numeric',
    minute: '2-digit'
}];

export { scheduleSettings, geoLocation, currentZDT, jCal, zmanCalc, dtF };

