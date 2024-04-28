// @ts-check

import { getOrdinal } from "./WebsiteCalendar.js";
import { AmudehHoraahZmanim, OhrHachaimZmanim } from "./ROYZmanim.js";
import { ics } from "../libraries/ics/ics.esm.js"
import { Temporal, GeoLocation } from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";

/**
 * @param {Temporal.PlainDate|Temporal.ZonedDateTime} date
 * @returns {[number, number, number]}
*/
const exportDate = (date) => [date.year, date.month, date.day]

/**
 * @param {boolean} monthView 
 * @param {AmudehHoraahZmanim | OhrHachaimZmanim} calc 
 * @returns {number} 
 */
const monViewNight = (monthView, calc) =>
	(monthView ? calc.getTzait().with({ hour: 23, minute: 59, second: 59 }) : calc.tomorrow().getAlotHashachar()).epochMilliseconds

/**
 * @param {boolean} amudehHoraahZman
 * @param {[number, number, number, string | Temporal.CalendarProtocol]} plainDateParams
 * @param {[string, number, number, number, string]} geoLocationData
 * @param {boolean} useElevation
 * @param {boolean} isIsrael
 * @param {{ [s: string]: { function: string|null; yomTovInclusive: string|null; luachInclusive: "degrees"|"seasonal"|null; condition: string|null; title: { "en-et": string; en: string; hb: string; }}; }} zmanList
 * @param {boolean} monthView
 * @param {{ language: "en-et" | "en" | "he"; timeFormat: "h11" | "h12" | "h23" | "h24"; seconds: boolean; zmanInfoSettings: Parameters<typeof jCal.getZmanimInfo>[3]; calcConfig: Parameters<OhrHachaimZmanim["configSettings"]>; fasts: Record<string, { "en-et": string; en: string; he: string; }> }} funcSettings
 */
export default function icsExport (amudehHoraahZman, plainDateParams, geoLocationData, useElevation, isIsrael, zmanList, monthView=true, funcSettings) {
	const baseDate = new Temporal.PlainDate(...plainDateParams).with({ day: 1, month: 1 })
	const geoLocation = new GeoLocation(...geoLocationData);

	console.log(funcSettings)

	const jCal = new WebsiteLimudCalendar(baseDate);
	jCal.setInIsrael(isIsrael)
	const calc = (amudehHoraahZman ? new AmudehHoraahZmanim(geoLocation) : new OhrHachaimZmanim(geoLocation, useElevation));
	calc.setDate(baseDate);
	calc.configSettings(...funcSettings.calcConfig);

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = [funcSettings.language, {
		hourCycle: funcSettings.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];

	if (funcSettings.seconds) {
		dtF[1].second = '2-digit'
	}

	/** @type {ics.EventAttributes[]} */
	const events = [];
	for (let index = 0; index < jCal.getDate().daysInYear; index++) {
		const dailyZmanim = Object.values(jCal.getZmanimInfo(true, calc, zmanList, funcSettings.zmanInfoSettings))
			.filter(entry => entry.display == 1)
			.map(entry => `${entry.title[funcSettings.language == "he" ? "hb" : funcSettings.language]}: ${entry.luxonObj.toLocaleString(...dtF)}`)
			.join('\n')

		events.push({
			start: exportDate(jCal.getDate()),
			end: exportDate(jCal.getDate().add({ days: 1 })),
			title: jCal.formatJewishFullDate().hebrew,
			description: dailyZmanim
		})

		const birkLev = jCal.birkathHalevanaCheck(calc)
		if (birkLev.data.start.dayOfYear == jCal.getDate().dayOfYear) {
			const jMonth = jCal.formatJewishMonth()
			events.push({
				start: calc.getShkiya().epochMilliseconds,
				end: calc.chainDate(jCal.getDate().withCalendar("hebrew").with({ day: 15 })).getAlotHashachar().epochMilliseconds,
				// @ts-ignore
				title: funcSettings.language == "he" ? "ברכת הלבנה - חדש " + jMonth.he : "Birkat Halevana - Month of " + jMonth.en,
				description: "End-time of the Rama (Stringent): " + birkLev.data.end.toLocaleString()
			})
		}

		if (jCal.tomorrow().getDayOfOmer() !== -1) {
			const omerInfo = jCal.tomorrow().getOmerInfo();
			const calendarEvent = {
				start: calc.getTzait().epochMilliseconds,
				end: monViewNight(monthView, calc),
				title: "Sefirat Haomer - Night " + jCal.tomorrow().getDayOfOmer(),
				description: `היום ${omerInfo.title.hb.mainCount} לעומר`
			};

			if (jCal.tomorrow().getDayOfOmer() >= 7)
				calendarEvent.description += `, שהם ${omerInfo.title.hb.subCount.toString()}`;

			events.push(calendarEvent)
		}

		if (jCal.getDate().dayOfWeek == 5 && !jCal.tomorrow().isYomTovAssurBemelacha()) {
			console.log(jCal.getDate().toLocaleString())
			const parasha = jCal.getHebrewParasha().join(" / ");
			events.push({
				title: "שבת " + (parasha == "No Parasha this week" ? jCal.tomorrow().getYomTov() : parasha)
					+ (jCal.tomorrow().isChanukah() ? " | " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night of Hanukah" : ""),
				start: calc.getCandleLighting().epochMilliseconds,
				end: calc.tomorrow().getTzaitShabbath().epochMilliseconds,
				description: (funcSettings.language == "he" ? 'ר"ת: ' : 'R"T: ') + calc.tomorrow().getTzaitRT().toLocaleString(...dtF)
			})
		}

		if (jCal.tomorrow().isChanukah()) {
			if (jCal.getDate().dayOfWeek == 6)
				events.push({
					start: calc.getTzaitShabbath().epochMilliseconds,
					end: monViewNight(monthView, calc),
					title: "Hanukah - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night of Hanukah"
				})
			else if (jCal.getDate().dayOfWeek !== 5)
				events.push({
					start: calc.getTzait().epochMilliseconds,
					end: calc.getTzait().add({ minutes: 30 }).epochMilliseconds,
					title: "Hanukah - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night of Hanukah"
				})
		}

		if (jCal.tomorrow().isRoshChodesh() && !jCal.isRoshChodesh()) {
			const definiteDayOfNextMonth = (jCal.tomorrow().tomorrow().isRoshChodesh() ? calc.tomorrow().tomorrow() : calc.tomorrow());
			events.push({
				start: calc.getShkiya().epochMilliseconds,
				end: definiteDayOfNextMonth.getShkiya().epochMilliseconds,
				title: "Rosh Hodesh " + definiteDayOfNextMonth.coreZC.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long'})
			});
		}

		if (jCal.tomorrow().isRoshHashana() && !jCal.isRoshHashana()) {
			events.push({
				start: calc.getCandleLighting().epochMilliseconds,
				end: calc.tomorrow().tomorrow().getTzaitShabbath().epochMilliseconds,
				title: "Rosh Hashanah"
			})
		}

		if (jCal.tomorrow().isTaanis()) {
			if (jCal.tomorrow().isYomKippur())
				events.push({
					start: calc.getCandleLighting().epochMilliseconds,
					end: calc.tomorrow().getTzaitShabbath().epochMilliseconds,
					title: "Yom Kippur",
					description: (funcSettings.language == "he" ? 'ר"ת: ' : 'R"T: ') + calc.tomorrow().getTzaitRT().toLocaleString(...dtF)
				})
			else if (jCal.getJewishMonth() == WebsiteLimudCalendar.AV)
				events.push({
					start: calc.getShkiya().epochMilliseconds,
					end: calc.tomorrow().getTzait().epochMilliseconds,
					title: "Tisha Be'av"
				})
			else
				events.push({
					start: calc.tomorrow().getAlotHashachar().epochMilliseconds,
					end: calc.tomorrow().getTzait().epochMilliseconds,
					title: funcSettings.fasts[jCal.tomorrow().getYomTovIndex().toString()][funcSettings.language]
				})
		}

		jCal.setDate(jCal.getDate().add({ days: 1 }));
		calc.setDate(calc.coreZC.getDate().add({ days: 1 }))
	}

	const labeledEvents = events.map(obj => ({
		...obj,
		calName:
			(calc instanceof AmudehHoraahZmanim ? "Amudeh Hora'ah Calendar" : "Ohr Hachaim Calendar")
			+ ` (${baseDate.year}) - ` + calc.coreZC.getGeoLocation().getLocationName(),
		startInputType: "utc",
		endInputType: "utc"
	}));

	// @ts-ignore
	const icsRespond = ics.createEvents(labeledEvents)
	if (icsRespond.error)
		throw icsRespond.error;

	return icsRespond.value;
}

if (Worker)
	addEventListener('message', (message) => postMessage(icsExport.apply(icsExport, message.data)))