// @ts-check

import { getOrdinal } from "../WebsiteCalendar.js";
import { AmudehHoraahZmanim, OhrHachaimZmanim } from "../ROYZmanim.js";
import { Temporal, GeoLocation, Calendar } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { HebrewNumberFormatter } from "../WebsiteCalendar.js"
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";
import { he as n2heWords } from "../../libraries/n2words.esm.js";

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
 * @param {Parameters<import("../WebsiteCalendar.js").default["getZmanimInfo"]>[2]} zmanList
 * @param {boolean} monthView
 * @param {{ language: "en-et" | "en" | "he"; timeFormat: "h11" | "h12" | "h23" | "h24"; seconds: boolean; zmanInfoSettings: Parameters<typeof jCal.getZmanimInfo>[3]; calcConfig: Parameters<OhrHachaimZmanim["configSettings"]>; fasts: Record<string, { "en-et": string; en: string; he: string; }>; tahanun: Record<string, string | { "en-et": string; en: string; he: string; }> }} funcSettings
 */
export default function icsExport (amudehHoraahZman, plainDateParams, geoLocationData, useElevation, isIsrael, zmanList, monthView=true, funcSettings) {
	const baseDate = new Temporal.PlainDate(...plainDateParams).with({ day: 1 })
	const geoLocation = new GeoLocation(...geoLocationData);

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

	const yomTovObj = {
		// Holidays
		[WebsiteLimudCalendar.PESACH]: {
			he: "פסח",
			"en-et": "Pesaḥ",
			en: "Passover",
		},
		[WebsiteLimudCalendar.SHAVUOS]: {
			en: "Shavu'oth",
			he: "שבועות",
			"en-et": "Shavu'oth"
		},
		[WebsiteLimudCalendar.ROSH_HASHANA]: {
			he: "ראש השנה",
			en: "Rosh Hashana",
			"en-et": "Rosh Hashana"
		},
		[WebsiteLimudCalendar.SUCCOS]: {
			he: "סוכות",
			en: "Sukkoth",
			"en-et": "Sukkoth"
		},
		[WebsiteLimudCalendar.HOSHANA_RABBA]: {
			he: "הושנה רבה",
			"en-et": "Hoshanah Rabba",
			en: "Hoshana Rabba"
		},

		// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
		// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
		[WebsiteLimudCalendar.SHEMINI_ATZERES]: {
			hb: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
			en: "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : ""),
			"en-et": "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : "")
		},
		[WebsiteLimudCalendar.SIMCHAS_TORAH]: {
			hb: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
			en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Torah",
			"en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Torah"
		},
	}

	/** @type {import('ics').EventAttributes[]} */
	const events = [];
	for (let index = 1; index <= jCal.getDate().daysInMonth; index++) {
		const dailyZmanim = Object.values(jCal.getZmanimInfo(true, calc, zmanList, funcSettings.zmanInfoSettings))
			.filter(entry => entry.display == 1)
			.map(entry => `${entry.title[funcSettings.language == "he" ? "hb" : funcSettings.language]}: ${entry.luxonObj.toLocaleString(...dtF)}`)
			.join('\n')

		const tachanun = funcSettings.tahanun[jCal.tefilahRules().tachanun.toString()];

		events.push({
			start: exportDate(jCal.getDate()),
			end: exportDate(jCal.getDate().add({ days: 1 })),
			title: jCal.formatJewishFullDate().hebrew,
			description: (typeof tachanun == "string" ? tachanun : tachanun[funcSettings.language]) + "\n\n" + dailyZmanim
		})

		const birkLev = jCal.birkathHalevanaCheck(calc)
		if (birkLev.data.start.dayOfYear == jCal.getDate().dayOfYear) {
			const jMonth = jCal.formatJewishMonth()
			events.push({
				start: calc.getShkiya().epochMilliseconds,
				end: calc.chainDate(jCal.getDate().withCalendar("hebrew").with({ day: 15 })).getAlotHashachar().epochMilliseconds,
				title: funcSettings.language == "he" ? "ברכת הלבנה - חדש " + jMonth.he : "Birkat Halevana - Month of " + jMonth.en,
				description: "End-time of the Rama (Stringent): " + birkLev.data.end.withTimeZone(geoLocation.getTimeZone()).toLocaleString()
			})
		}

		const count = jCal.tomorrow().getDayOfOmer();
		if (count !== -1) {
			const omerInfo = jCal.tomorrow().getOmerInfo();
			const calendarEvent = {
				start: calc.getTzait().epochMilliseconds,
				end: monViewNight(monthView, calc),
				title: {
					"he": "ספירת העומר - ליל " + (count in n2wordsOrdinal ? n2wordsOrdinal[count] : n2heWords(count)),
					"en": "Sefirath Ha'Omer - Night " + count,
					"en-et": "Sefirath Ha'Omer - Night " + count
				}[funcSettings.language],
				description: `היום ${omerInfo.title.hb.mainCount} לעומר`
			};

			if (count >= 7)
				calendarEvent.description += `, שהם ${omerInfo.title.hb.subCount.toString()}`;

			events.push(calendarEvent)
		}

		if (jCal.getDayOfWeek() == Calendar.FRIDAY && !jCal.tomorrow().isYomTovAssurBemelacha() && !jCal.tomorrow().isYomKippur()) {
			const parasha = jCal.getHebrewParasha().join(" / ");
			events.push({
				title: "שבת " + (parasha == "No Parasha this week" ? jCal.tomorrow().getYomTov() : parasha)
					+ (jCal.tomorrow().isChanukah() ? " | " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night of Ḥanuka" : ""),
				start: calc.getCandleLighting().epochMilliseconds,
				end: calc.tomorrow().getTzaitShabbath().epochMilliseconds,
				description: (funcSettings.language == "he" ? 'ר"ת: ' : 'R"T: ') + calc.tomorrow().getTzaitRT().toLocaleString(...dtF)
			})
		}

		if (!jCal.isCholHamoed() && jCal.tomorrow().isCholHamoed()) {
			let endHolHamoed = jCal.tomorrow();
			let holHamoedDay = 1;
			let dateList = getOrdinal(1, false) + " day: " + jCal.formatFancyDate()
			do {
				endHolHamoed = endHolHamoed.tomorrow();
				holHamoedDay++;
				dateList += "\n" + getOrdinal(holHamoedDay, false) + " day: " + endHolHamoed.formatFancyDate()
			} while (endHolHamoed.tomorrow().isCholHamoed())

			events.push({
				start: calc.getTzaitShabbath().epochMilliseconds,
				end: calc.chainDate(endHolHamoed.getDate()).getShkiya().epochMilliseconds,
				title: {
					"he": "חול המועד " + (jCal.isPesach() ? "פסח" : "סוכות"),
					"en-et": "Ḥol HaMoedh " + (jCal.isPesach() ? "Pesah" : "Sukkot"),
					"en": (jCal.isPesach() ? "Passover" : "Sukkoth") + " - Intermediate Days"
				}[funcSettings.language],
				description: dateList
			});
		}

		if (jCal.tomorrow().isChanukah()) {
			const title = {
				"he": "חנוכה - ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()],
				"en": "Ḥanuka - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night",
				"en-et": "Ḥanuka - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night"
			}[funcSettings.language];

			if (jCal.getDayOfWeek() == Calendar.SATURDAY)
				events.push({
					start: calc.getTzaitShabbath().epochMilliseconds,
					end: monViewNight(monthView, calc),
					title
				})
			else if (jCal.getDayOfWeek() !== Calendar.FRIDAY)
				events.push({
					start: calc.getTzait().epochMilliseconds,
					end: calc.getTzait().add({ minutes: 30 }).epochMilliseconds,
					title
				})
		}

		if (jCal.tomorrow().isRoshChodesh() && !jCal.isRoshChodesh()) {
			const definiteDayOfNextMonth = (jCal.tomorrow().tomorrow().isRoshChodesh() ? calc.tomorrow().tomorrow() : calc.tomorrow());
			events.push({
				start: calc.getShkiya().epochMilliseconds,
				end: definiteDayOfNextMonth.getShkiya().epochMilliseconds,
				title: {
					"he": "ראש חודש " + definiteDayOfNextMonth.coreZC.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'}),
					"en": "Rosh Ḥodesh " + definiteDayOfNextMonth.coreZC.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long'}),
					"en-et": "Rosh Ḥodesh " + definiteDayOfNextMonth.coreZC.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long'})
				}[funcSettings.language]
			});
		}

		if (jCal.tomorrow().isYomTovAssurBemelacha() && !jCal.isYomTovAssurBemelacha() && !jCal.tomorrow().isYomKippur()) {
			const twoDayYomTov = jCal.tomorrow().tomorrow().isYomTovAssurBemelacha();
			const lastDayYT = twoDayYomTov ? jCal.tomorrow().tomorrow() : jCal.tomorrow();
			const endTime = lastDayYT.getDayOfWeek() == Calendar.FRIDAY
				? calc.chainDate(lastDayYT.getDate()).getCandleLighting()
				: calc.chainDate(lastDayYT.getDate()).getTzaitShabbath();

			const calOfTheHag = lastDayYT;
			while (calOfTheHag.isYomTovAssurBemelacha() || calOfTheHag.isCholHamoed())
				calOfTheHag.setDate(calOfTheHag.getDate().subtract({ days: 1 }))

			if (twoDayYomTov) {
				const transitionTime = {
					[Calendar.FRIDAY]: calc.tomorrow().getTzaitShabbath(),
					[Calendar.THURSDAY]: calc.tomorrow().getCandleLighting()
				}[jCal.getDayOfWeek()] || (calc instanceof OhrHachaimZmanim ? calc.tomorrow().getTzait() : calc.tomorrow().getTzaitLechumra());

				if (JSON.stringify(yomTovObj[jCal.tomorrow().getYomTovIndex()])
				!== JSON.stringify(yomTovObj[jCal.tomorrow().tomorrow().getYomTovIndex()])) {
					events.push({
						start: calc.getCandleLighting().epochMilliseconds,
						end: transitionTime.epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language]
					},
					{
						start: transitionTime.epochMilliseconds,
						end: endTime.epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().tomorrow().getYomTovIndex()][funcSettings.language]
					})
				} else {
					events.push({
						start: calc.getCandleLighting().epochMilliseconds,
						end: transitionTime.epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language] + " - " + {
							he: "יום " + new HebrewNumberFormatter().formatHebrewNumber(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days')),
							en: "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days')),
							"en-et": "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days'))
						}[funcSettings.language]
					},
					{
						start: transitionTime.epochMilliseconds,
						end: endTime.epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language] + " - " + {
							he: "יום " + new HebrewNumberFormatter().formatHebrewNumber(calOfTheHag.getDate().until(jCal.tomorrow().tomorrow().getDate()).total('days')),
							en: "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().tomorrow().getDate()).total('days')),
							"en-et": "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().tomorrow().getDate()).total('days'))
						}[funcSettings.language]
					})
				}
			} else {
				events.push({
					start: calc.getCandleLighting().epochMilliseconds,
					end: endTime.epochMilliseconds,
					title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language] + ([WebsiteLimudCalendar.PESACH, WebsiteLimudCalendar.SUCCOS].includes(jCal.tomorrow().getYomTovIndex()) ? " - " + {
						he: "יום " + new HebrewNumberFormatter().formatHebrewNumber(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days')),
						en: "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days')),
						"en-et": "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days'))
					}[funcSettings.language] : "")
				})
			}
		}

		if (jCal.tomorrow().isTaanis()) {
			if (jCal.tomorrow().isYomKippur())
				events.push({
					start: calc.getCandleLighting().epochMilliseconds,
					end: calc.tomorrow().getTzaitShabbath().epochMilliseconds,
					title: funcSettings.fasts[jCal.tomorrow().getYomTovIndex().toString()][funcSettings.language],
					description: (funcSettings.language == "he" ? 'ר"ת: ' : 'R"T: ') + calc.tomorrow().getTzaitRT().toLocaleString(...dtF)
				})
			else
				events.push({
					start:
						(jCal.getJewishMonth() == WebsiteLimudCalendar.AV
							? calc.getShkiya()
							: calc.tomorrow().getAlotHashachar()).epochMilliseconds,
					end: calc.tomorrow().getTzaitLechumra().epochMilliseconds,
					title: funcSettings.fasts[jCal.tomorrow().getYomTovIndex().toString()][funcSettings.language]
				})
		}

		if (jCal.isBirkasHachamah()) {
			events.push({
				start: calc.getNetz().epochMilliseconds,
				end: calc.getSofZmanShmaGRA().epochMilliseconds,
				title: {
					'he': "ברכת החמה",
					"en-et": "Birkath Haḥama",
					'en': "Blessing of the Sun"
				}[funcSettings.language]
			})
		}

		jCal.setDate(jCal.getDate().add({ days: 1 }));
		calc.setDate(calc.coreZC.getDate().add({ days: 1 }))
	}

	return events;
}

/**
 * @param {number} num
 */
function romanize (num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

if (Worker)
	addEventListener('message', (message) => postMessage(icsExport.apply(icsExport, message.data)))