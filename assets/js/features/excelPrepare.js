// @ts-check

import { ZemanFunctions } from "../ROYZmanim.js";
import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { providerFromSnapshot } from "../refraction-snapshot.js";

/**
 * Refraction data for an export worker (see workerCalcInputs in export.js).
 * @typedef {{ table: import("../refraction-snapshot.js").ProviderSnapshot, normals: import("../refraction-snapshot.js").Normals | null }} ExportRefraction
 */

/** @typedef {T[keyof T]} ValueOf<T> */
/**
 * @typedef {{ DATE: import("../../libraries/xlsx.js").CellObject } & Record<string, import("../../libraries/xlsx.js").CellObject>} SpreadsheetRow
 */

/**
 * @param {ConstructorParameters<typeof Temporal.PlainDate>} plainDateParams
 * @param {[string, number, number, number, string]} geoLocationData
 * @param {ConstructorParameters<typeof ZemanFunctions>[1]} config
 * @param {boolean} isIsrael
 * @param {Parameters<import("../WebsiteCalendar.js").default["getZmanimInfo"]>[2]} zmanList
 * @param {boolean} isTimelyView
 * @param {string[]} selectedLimudim
 * @param {{ language: "en-et" | "en" | "he"; timeFormat: "h11" | "h12" | "h23" | "h24"; seconds: boolean; refraction?: ExportRefraction }} funcSettings
 */
export default function spreadSheetExport(plainDateParams, geoLocationData, config, isIsrael, zmanList, isTimelyView, selectedLimudim, funcSettings) {
	const baseDate = new Temporal.PlainDate(...plainDateParams)
	const geoLocation = new GeoLocation(...geoLocationData);

	const jCal = new WebsiteLimudCalendar(baseDate);
	jCal.setInIsrael(isIsrael)
	const calc = new ZemanFunctions(geoLocation, {
		...config,
		atmosphereProvider: funcSettings.refraction
			? providerFromSnapshot(funcSettings.refraction.table, funcSettings.refraction.normals)
			: null
	});
	calc.setDate(baseDate);

	/** @param {Temporal.ZonedDateTime} time */
	const formatTime = (time) => '=TIME(' + [time.hour, time.minute, time.second].join(', ') + ')'

	/** @type {{ zemanim: SpreadsheetRow[]; limudim: SpreadsheetRow[]}} */
	const events = { zemanim: [], limudim: [] };

	for (let index = 1; index <= jCal.getDate().daysInMonth; index++) {
		const isoDate = new Date(`${jCal.getDate().year}-${String(jCal.getDate().month).padStart(2, "0")}-${String(jCal.getDate().day).padStart(2, "0")}`);
		const baseRow = [
			['DATE', { t: "d", v: isoDate, f: `=DATE(${jCal.getDate().year}, ${jCal.getDate().month}, ${jCal.getDate().day})`, z: "yyyy-mm-dd" }],
		];

		const dailyZmanim = Object.entries(jCal.getZmanimInfo(true, calc, zmanList, [null, funcSettings.seconds ? {second: '2-digit'} : {}]))
			.filter(entry => entry[1].display == 1)
			.map(entry => [
				entry[0],
				{
					t: "d", v: new Date(entry[1].zDTObj.epochMilliseconds),
					f: formatTime(entry[1].zDTObj), z:
						"h" + (["h23", "h24"].includes(funcSettings.timeFormat) ? "h" : "")
						+ ":mm" + ('second' in entry[1].dtF[1] ? ":ss" : "")
						+ (["h11", "h12"].includes(funcSettings.timeFormat) ? " AM/PM" : "")
				}
			])

		const dailyLimudim = baseRow
			.concat(Object.entries(jCal.getAllLearning()).filter(([learnID]) => selectedLimudim.includes(learnID)))
		events.limudim.push(Object.fromEntries(dailyLimudim))

		const zemanimRow = Object.fromEntries(baseRow.concat(dailyZmanim));
		events.zemanim.push(zemanimRow);

		jCal.setDate(jCal.getDate().add({ days: 1 }));
		calc.setDate(calc.coreZC.getDate().add({ days: 1 }))
	}

	return events;
}

if (Worker)
	addEventListener('message', async (message) => {
		if (!('Temporal' in globalThis)) {
			const { Temporal } = await import('https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.2/+esm');
			globalThis.Temporal = Temporal;
		}
		postMessage(spreadSheetExport.apply(spreadSheetExport, message.data))
	})