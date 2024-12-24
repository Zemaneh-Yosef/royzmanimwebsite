// @ts-check

import { AmudehHoraahZmanim, OhrHachaimZmanim } from "../ROYZmanim.js";
import { Temporal, GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteCalendar from "../WebsiteCalendar.js";

/**
 * @param {boolean} amudehHoraahZman
 * @param {[number, number, number, string | Temporal.CalendarProtocol]} plainDateParams
 * @param {[string, number, number, number, string]} geoLocationData
 * @param {boolean} useElevation
 * @param {boolean} isIsrael
 * @param {{ [s: string]: { function: string|null; yomTovInclusive: string|null; luachInclusive: "degrees"|"seasonal"|null; condition: string|null; title: { "en-et": string; en: string; hb: string; }}; }} zmanList
 * @param {boolean} monthView
 * @param {{ language: "en-et" | "en" | "he"; timeFormat: "h11" | "h12" | "h23" | "h24"; seconds: boolean; zmanInfoSettings: Parameters<typeof jCal.getZmanimInfo>[3]; calcConfig: Parameters<OhrHachaimZmanim["configSettings"]>; netzTimes: number[] }} funcSettings
 */
export default function spreadSheetExport (amudehHoraahZman, plainDateParams, geoLocationData, useElevation, isIsrael, zmanList, monthView=true, funcSettings) {
	const baseDate = new Temporal.PlainDate(...plainDateParams).with({ day: 1 })
	const geoLocation = new GeoLocation(...geoLocationData);

	const jCal = new WebsiteCalendar(baseDate);
	jCal.setInIsrael(isIsrael)
	const calc = (amudehHoraahZman ? new AmudehHoraahZmanim(geoLocation) : new OhrHachaimZmanim(geoLocation, useElevation));
	calc.setDate(baseDate);
	calc.configSettings(...funcSettings.calcConfig);

	const vNetz = funcSettings.netzTimes.map((/** @type {number} */ value) => Temporal.Instant
		.fromEpochSeconds(value)
		.toZonedDateTimeISO(geoLocation.getTimeZone())
	);

	const events = [];
	for (let index = 1; index <= jCal.getDate().daysInMonth; index++) {
		const regularNetz = calc.getNetz();

		// @ts-ignore
		let seeSun;
		if (vNetz)
			seeSun = vNetz.find(zDT => Math.abs(regularNetz.until(zDT).total('minutes')) <= 6)

		// @ts-ignore
		function formatTime(entry) {
			// @ts-ignore
			const time = (entry.function == 'getNetz' && seeSun ? seeSun : entry.luxonObj)
			return '=TIME(' + [time.hour, time.minute, time.second].join(', ') + ')'
		}

		const dailyZmanim = Object.values(jCal.getZmanimInfo(true, calc, zmanList, funcSettings.zmanInfoSettings))
			.filter(entry => entry.display == 1)
			.map(entry => [
				entry.function || (entry.title["en"].startsWith("Candle Lighting") ? "getCandleLighting" : ""),
				{t: "d", v: new Date(entry.luxonObj.epochMilliseconds),
				f: formatTime(entry), z:
					"h" + (["h23", "h24"].includes(funcSettings.timeFormat) ? "h" : "")
					// @ts-ignore
					+ ":mm" + (funcSettings.seconds || (entry.function == "getNetz" && seeSun) ? ":ss" : "")
					+ (["h11", "h12"].includes(funcSettings.timeFormat) ? " AM/PM" : "")}
			])

		const row = Object.fromEntries(
			[['DATE', {t: "s", v: "date", f: `=DATE(${jCal.getDate().year}, ${jCal.getDate().month}, ${jCal.getDate().day})`, z: "yyyy-mm-dd"}]]
			// @ts-ignore
			.concat(dailyZmanim)
		);

		events.push(row);

		jCal.setDate(jCal.getDate().add({ days: 1 }));
		calc.setDate(calc.coreZC.getDate().add({ days: 1 }))
	}

	return events;
}

if (Worker)
	addEventListener('message', (message) => postMessage(spreadSheetExport.apply(spreadSheetExport, message.data)))