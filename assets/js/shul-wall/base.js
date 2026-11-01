// @ts-check

import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions } from "../ROYZmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { isInIsrael } from "../misc/israel.js";
import { languageTag } from "../misc/language.js";
import { loadRefraction, readCachedRefraction, providerFromCache } from "../refraction-data.js";

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

/** @type {Map<string, () => void>} */
const zmanimListeners = new Map();
/** Counts refreshBase runs, so a download started by an earlier one can't replace a newer day's calculator. */
let baseGeneration = 0;

/**
 * Run `render` again whenever the zemanim change after the page first drew them (better refraction data
 * arrived from the network). `render` must be safe to run more than once: it should replace what it drew
 * the time before (and its timers), not add to it.
 * Keyed by name: a soft reload (reload.js) runs the page's scripts again, and their new copies replace the
 * old ones' entries; modules imported by other modules aren't run again, and keep theirs.
 * @param {string} name @param {() => void} render
 */
function onZmanimUpdate(name, render) {
	zmanimListeners.set(name, render);
}

/** @param {Pick<import("../ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} refraction */
function buildZmanCalc(refraction) {
	const calc = new ZemanFunctions(geoLocation, {
		elevation: scheduleSettings.calendarToggle.elevation,
		rtKulah: scheduleSettings.calendarToggle.rtKulah,
		candleLighting: scheduleSettings.customTimes.candleLighting,
		fixedMil: scheduleSettings.calendarToggle.forceSunSeasonal || jCal.getInIsrael(),
		melakha: scheduleSettings.customTimes.tzeithIssurMelakha,
		// getNetz() ray-traces the visible sunrise from the horizon (replaces the ChaiTables 'ctNetz' data)
		atmosphereProvider: refraction.atmosphereProvider,
		horizon: refraction.horizon,
		haze: refraction.haze
	});
	calc.setDate(currentZDT.toPlainDate());
	return calc;
}

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
	// Every other module on the page imports this one, so nothing is drawn until this finishes: never wait
	// on the network here. Draw from what's stored (instant, works offline), or with standard refraction when
	// nothing is stored yet. The download runs in the background; when it arrives, the calculator is rebuilt
	// with it and every part of the screen that shows a time draws itself again (onZmanimUpdate). It also
	// fills the store (IndexedDB) for the next load.
	const generation = ++baseGeneration;
	const lat = geoLocation.getLatitude(), lon = geoLocation.getLongitude();
	/** @type {import("../refraction-data.js").CachedRefraction | null} */
	const cachedRefraction = await Promise.race([
		readCachedRefraction(lat, lon).catch(() => null),
		new Promise((resolve) => setTimeout(() => resolve(null), REFRACTION_CACHE_WAIT_MS))
	]);
	zmanCalc = buildZmanCalc({
		atmosphereProvider: providerFromCache(cachedRefraction),
		horizon: cachedRefraction?.horizon ?? null,
		haze: cachedRefraction?.haze ?? null
	});

	loadRefraction(lat, lon)
		.then((fresh) => {
			if (fresh.notes.length)
				console.info("Refraction:", fresh.notes);
			if (generation !== baseGeneration)
				return;
			zmanCalc = buildZmanCalc({ atmosphereProvider: fresh.provider, horizon: fresh.horizon, haze: fresh.haze });
			for (const render of zmanimListeners.values()) {
				try {
					render();
				} catch (e) {
					console.error("Redrawing with the new refraction data failed", e);
				}
			}
		})
		.catch((e) => console.error("Refraction data failed to load", e));

	dtF = [scheduleSettings.language == 'he' ? 'he' : 'en', {
		hourCycle: scheduleSettings.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];
}
await refreshBase();

export { scheduleSettings, geoLocation, currentZDT, jCal, zmanCalc, dtF, refreshBase, onZmanimUpdate };

