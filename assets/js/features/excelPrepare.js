// @ts-check

import { ZemanFunctions } from "../core/ROYZmanim.js";
import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteLimudCalendar from "../core/WebsiteLimudCalendar.js";
import { providerFromSnapshot } from "../core/refraction-snapshot.js";
import { loadWorkerPolyfills } from "../misc/worker-polyfills.js";

/**
 * Refraction data for an export worker (see workerCalcInputs in export.js).
 * @typedef {{ table: import("../core/refraction-snapshot.js").ProviderSnapshot, normals: import("../core/refraction-snapshot.js").Normals | null }} ExportRefraction
 */

/** @typedef {T[keyof T]} ValueOf<T> */
/**
 * @typedef {{ DATE: import("../../libraries/xlsx.js").CellObject } & Record<string, import("../../libraries/xlsx.js").CellObject>} SpreadsheetRow
 */

/** @typedef {Parameters<typeof spreadSheetExport> extends [any, any, ...infer Rest] ? Rest : never} SharedParams the parameters after the dates, the same for every chunk of a range */

/**
 * The rows for `dayCount` days from the start date.
 * @param {ConstructorParameters<typeof Temporal.PlainDate>} plainDateParams the first day
 * @param {number} dayCount how many days to go through
 * @param {[string, number, number, number, string]} geoLocationData
 * @param {ConstructorParameters<typeof ZemanFunctions>[1]} config
 * @param {boolean} isIsrael
 * @param {Parameters<import("../core/WebsiteCalendar.js").default["getZmanimInfo"]>[2]} zmanList
 * @param {boolean} isTimelyView
 * @param {string[]} selectedLimudim
 * @param {{ language: "he-Latn" | "en" | "he"; timeFormat: "h11" | "h12" | "h23" | "h24"; seconds: boolean; refraction?: ExportRefraction }} funcSettings
 */
export default function spreadSheetExport(plainDateParams, dayCount, geoLocationData, config, isIsrael, zmanList, isTimelyView, selectedLimudim, funcSettings) {
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
	/** @param {Temporal.ZonedDateTime} time */
	const timeSerial = (time) => (time.hour * 3600 + time.minute * 60 + time.second) / 86400

	/** @type {{ zemanim: SpreadsheetRow[]; limudim: SpreadsheetRow[]}} */
	const events = { zemanim: [], limudim: [] };

	for (let index = 0; index < dayCount; index++) {
		const isoDate = new Date(`${jCal.getDate().year}-${String(jCal.getDate().month).padStart(2, "0")}-${String(jCal.getDate().day).padStart(2, "0")}`);
		const baseRow = [
			['DATE', { t: "d", v: isoDate, f: `=DATE(${jCal.getDate().year}, ${jCal.getDate().month}, ${jCal.getDate().day})`, z: "yyyy-mm-dd" }],
		];

		const dailyZmanim = Object.entries(jCal.getZmanimInfo(true, calc, zmanList, [null, funcSettings.seconds ? {second: '2-digit'} : {}]))
			.filter(entry => entry[1].display == 1)
			.map(entry => [
				entry[0],
				{
					t: "n", v: timeSerial(entry[1].zDTObj),
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

// The page (export.js) posts the refraction and the constant parameters once per worker, then a
// [startDateParams, dayCount] for every task. A message that is a whole parameter list still works.
if ("WorkerGlobalScope" in globalThis) {
	/** @type {ExportRefraction | undefined} */
	let refraction;
	/** @type {any[] | undefined} geoLocationData, config, isIsrael, zmanList, isTimelyView, selectedLimudim, funcSettings */
	let constants;

	addEventListener('message', async (message) => {
		const data = message.data;
		if (data?.type === 'refraction') {
			refraction = { table: data.tableJson ? JSON.parse(data.tableJson) : data.table, normals: data.normals ?? null };
			return;
		}
		if (data?.type === 'init') {
			constants = data.params;
			return;
		}

		try {
			await loadWorkerPolyfills();
			if (!constants)
				return postMessage(spreadSheetExport.apply(spreadSheetExport, data));
			const [geo, config, isIsrael, zmanList, isTimelyView, selectedLimudim, funcSettings] = constants;
			postMessage(spreadSheetExport(data[0], data[1], geo, config, isIsrael, zmanList, isTimelyView, selectedLimudim, { ...funcSettings, refraction }))
		} catch (error) {
			postMessage({ error: String(error?.stack ?? error) })
		}
	})
}