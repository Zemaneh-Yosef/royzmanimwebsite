// @ts-check

import { getOrdinal } from "../WebsiteCalendar.js";
import { ZemanFunctions, zDTFromFunc } from "../ROYZmanim.js";
import { Temporal, GeoLocation, Calendar, HiloulahYomiCalculator, Parsha } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import YihudCalendar from "../WebsiteLimudCalendar.js";
import { HebrewNumberFormatter as hebNumFormat } from "../WebsiteCalendar.js"
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";
import { he as n2heWords } from "../../libraries/n2words.esm.js";

/**
 * @param {Temporal.PlainDate|Temporal.ZonedDateTime} date
 * @returns {[number, number, number]}
*/
const exportDate = (date) => [date.year, date.month, date.day]

/**
 * @param {boolean} monthView
 * @param {ZemanFunctions} calc
 * @returns {number}
 */
const monViewNight = (monthView, calc) =>
	(monthView ? calc.getTzet().with({ hour: 23, minute: 59, second: 59 }) : calc.tomorrow().getAlotHashahar()).epochMilliseconds

/**
 * @param {ConstructorParameters<typeof Temporal.PlainDate>} plainDateParams
 * @param {[string, number, number, number, string]} geoLocationData
 * @param {ConstructorParameters<typeof ZemanFunctions>[1]} config
 * @param {boolean} isIsrael
 * @param {Parameters<import("../WebsiteCalendar.js").default["getZmanimInfo"]>[2]} zmanList
 * @param {boolean} monthView
 * @param {{ language: "en-et" | "en" | "he"; timeFormat: "h11" | "h12" | "h23" | "h24"; seconds: boolean; fasts: Record<string, { "en-et": string; en: string; he: string; }>; tahanun: Record<string, string | { "en-et": string; en: string; he: string; }>; netzTimes: number[]; learningTitle: Record<string, { "en-et": string; en: string; he: string; }>; }} funcSettings
 */
export default async function icsExport (plainDateParams, geoLocationData, config, isIsrael, zmanList, monthView=true, funcSettings) {
	const baseDate = new Temporal.PlainDate(...plainDateParams)
	const geoLocation = new GeoLocation(...geoLocationData);

	const jCal = new YihudCalendar(baseDate);
	jCal.setInIsrael(isIsrael)
	const calc = new ZemanFunctions(geoLocation, config);
	calc.setDate(baseDate);
	calc.setVisualSunrise(funcSettings.netzTimes)

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = [funcSettings.language, {
		hourCycle: funcSettings.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];

	if (funcSettings.seconds) {
		dtF[1].second = '2-digit'
	}

	const yomTovObj = Object.freeze({
		// Holidays
		[YihudCalendar.PESACH]: {
			he: "פסח",
			"en-et": "Pesaḥ",
			en: "Passover",
		},
		[YihudCalendar.SHAVUOS]: {
			en: "Shavu'oth",
			he: "שבועות",
			"en-et": "Shavu'oth"
		},
		[YihudCalendar.ROSH_HASHANA]: {
			he: "ראש השנה",
			en: "Rosh Hashana",
			"en-et": "Rosh Hashana"
		},
		[YihudCalendar.SUCCOS]: {
			he: "סוכות",
			en: "Sukkoth",
			"en-et": "Sukkoth"
		},
		[YihudCalendar.HOSHANA_RABBA]: {
			he: "הושנה רבה",
			"en-et": "Hoshana Rabba",
			en: "Hoshana Rabba"
		},

		// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
		// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
		[YihudCalendar.SHEMINI_ATZERES]: {
			he: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
			en: "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : ""),
			"en-et": "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : "")
		},
		[YihudCalendar.SIMCHAS_TORAH]: {
			he: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
			en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Torah",
			"en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Torah"
		},
	})

	const hiloulahCalc = new HiloulahYomiCalculator("/assets/libraries/kosherZmanim/withDesc/");
	await hiloulahCalc.init();

	/** @type {import('ics').EventAttributes[]} */
	const events = [];
	for (let index = 1; index <= jCal.getDate().daysInMonth; index++) {
		const dailyZmanim = Object.values(jCal.getZmanimInfo(true, calc, zmanList, dtF))
			.filter(entry => entry.display == 1)
			.map(entry => `${entry.title[funcSettings.language == "he" ? "hb" : funcSettings.language]}: ${entry.zDTObj.toLocaleString(...entry.dtF)}`)
			.join('\n')

		const tachanun = funcSettings.tahanun[jCal.tefilahRules().tachanun.toString()];

		events.push({
			start: exportDate(jCal.getDate()),
			end: exportDate(jCal.getDate().add({ days: 1 })),
			title: jCal.formatJewishFullDate().hebrew,
			description: [
				(typeof tachanun == "string" ? tachanun : tachanun[funcSettings.language]),
				dailyZmanim,
				Object.entries(jCal.getAllLearning())
					.map(([key, value]) => funcSettings.learningTitle[key][funcSettings.language] + ": " + value)
					.join('\n')
			].join('\n\n')
		})

		const todayHiloulot = hiloulahCalc.getHiloulah(jCal);
		events.push({
			start: exportDate(jCal.getDate()),
			end: exportDate(jCal.getDate().add({ days: 1 })),
			title: funcSettings.language == "he" ? `הלולות יומי (${todayHiloulot.he.length})` : `Today's Hiloulot (${todayHiloulot.en.length})`,
			// @ts-ignore
			description: todayHiloulot[funcSettings.language == "he" ? "he" : "en"]
				.map((/** @type {typeof todayHiloulot.en[0] & {desc: string}} */ hiloulahRet) =>
					hiloulahRet.name + "\n" + hiloulahRet.desc)
				.join('\n\n')
		})

		const birkLev = jCal.birkathHalevanaCheck(calc)
		if (birkLev.data.start.dayOfYear == jCal.getDate().dayOfYear) {
			const jMonth = jCal.formatJewishMonth()
			events.push({
				start: calc.getShkiya().epochMilliseconds,
				end: calc.chainDate(jCal.getDate().withCalendar("hebrew").with({ day: 15 })).getAlotHashahar().epochMilliseconds,
				title: funcSettings.language == "he" ? "ברכת הלבנה - חדש " + jMonth.he : "Birkat Halevana - Month of " + jMonth.en,
				description: "End-time of the Rama (Stringent): " + birkLev.data.end.toLocaleString()
			})
		}

		const count = jCal.tomorrow().getDayOfOmer();
		if (count !== -1) {
			const omerInfo = jCal.tomorrow().getOmerInfo();
			const calendarEvent = {
				start: calc.getTzet().epochMilliseconds,
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
			let shabTitle = "שבת";
			if (jCal.getSpecialShabbos() in YihudCalendar.hebrewParshaMap && jCal.getSpecialShabbos() != Parsha.NONE)
				shabTitle += " " + YihudCalendar.hebrewParshaMap[jCal.getSpecialShabbos()];
			else if (jCal.isShabbosMevorchim())
				shabTitle += " מברכים " + jCal.getDate().withCalendar('hebrew').add({ months: 1 }).toLocaleString('he-u-ca-hebrew', { month: 'long' });
			else if (jCal.getYomTovIndex() in yomTovObj)
				shabTitle += " " + yomTovObj[jCal.getYomTovIndex()].he;

			if (jCal.getParshah() in YihudCalendar.hebrewParshaMap && jCal.getParshah() != Parsha.NONE)
				shabTitle += " | פרשת " + YihudCalendar.hebrewParshaMap[jCal.getParshah()];

			if (jCal.tomorrow().isChanukah())
				shabTitle += " | " + {
					"he": "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()] + " של חנוכה",
					"en": getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night of Ḥanuka",
					"en-et": getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night of Ḥanuka"
				}[funcSettings.language];

			events.push({
				title: shabTitle,
				start: calc.getCandleLighting().epochMilliseconds,
				end: zDTFromFunc(calc.tomorrow().getTzetMelakha()).epochMilliseconds,
				description: (funcSettings.language == "he" ? 'ר"ת: ' : 'R"T: ') + calc.tomorrow().getTzetRT().toLocaleString(...dtF)
			})
		}

		if (!jCal.isCholHamoed() && jCal.tomorrow().isCholHamoed()) {
			let endHolHamoed = jCal.tomorrow();
			let holHamoedDay = 1;
			let dateList = [getOrdinal(1, false) + " day: " + jCal.formatFancyDate('long', false)]
			do {
				endHolHamoed = endHolHamoed.tomorrow();
				holHamoedDay++;

				dateList.push(
					(endHolHamoed.isHoshanaRabba() ? yomTovObj[YihudCalendar.HOSHANA_RABBA][funcSettings.language] + " - " : "")
					+ getOrdinal(holHamoedDay, false) + " day"
					+ ": " + endHolHamoed.formatFancyDate()
				)
			} while (endHolHamoed.tomorrow().isCholHamoed())

			events.push({
				start: zDTFromFunc(calc.getTzetMelakha()).epochMilliseconds,
				end: calc.chainDate(endHolHamoed.getDate()).getShkiya().epochMilliseconds,
				title: {
					"he": "חול המועד " + (jCal.isPesach() ? "פסח" : "סוכות"),
					"en-et": "Ḥol HaMoedh " + (jCal.isPesach() ? "Pesah" : "Sukkot"),
					"en": (jCal.isPesach() ? "Passover" : "Sukkoth") + " - Intermediate Days"
				}[funcSettings.language],
				description: dateList.join('\n')
			});
		}

		if (jCal.tomorrow().isChanukah()) {
			const title = {
				"he": "חנוכה - ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()],
				"en": "Ḥanuka - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night",
				"en-et": "Ḥanuka - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night"
			}[funcSettings.language];

			if (jCal.getDayOfWeek() == Calendar.SATURDAY) {
				events.push({
					start: zDTFromFunc(calc.getTzetMelakha()).epochMilliseconds,
					end: monViewNight(monthView, calc),
					title
				})
			} else if (jCal.getDayOfWeek() !== Calendar.FRIDAY)
				events.push({
					start: calc.getTzet().epochMilliseconds,
					end: calc.getTzet().add({ minutes: 30 }).epochMilliseconds,
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
			const endTime = calc.chainDate(lastDayYT.getDate())
				[lastDayYT.getDayOfWeek() == Calendar.FRIDAY ? "getCandleLighting" : "getTzetMelakha"]();

			const calOfTheHag = lastDayYT;
			while (calOfTheHag.isYomTovAssurBemelacha() || calOfTheHag.isCholHamoed())
				calOfTheHag.setDate(calOfTheHag.getDate().subtract({ days: 1 }))

			if (twoDayYomTov) {
				const transitionTime = {
					[Calendar.FRIDAY]: calc.tomorrow().getTzetMelakha(),
					[Calendar.THURSDAY]: calc.tomorrow().getCandleLighting()
				}[jCal.getDayOfWeek()] || (calc.config.fixedMil ? calc.tomorrow().getTzet() : calc.tomorrow().getTzetHumra());

				if (JSON.stringify(yomTovObj[jCal.tomorrow().getYomTovIndex()])
				!== JSON.stringify(yomTovObj[jCal.tomorrow().tomorrow().getYomTovIndex()])) {
					events.push({
						start: calc.getCandleLighting().epochMilliseconds,
						end: zDTFromFunc(transitionTime).epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language]
					},
					{
						start: zDTFromFunc(transitionTime).epochMilliseconds,
						end: zDTFromFunc(endTime).epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().tomorrow().getYomTovIndex()][funcSettings.language]
					})
				} else {
					events.push({
						start: calc.getCandleLighting().epochMilliseconds,
						end: zDTFromFunc(transitionTime).epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language] + " - " + {
							he: "יום " + new hebNumFormat().formatHebrewNumber(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days')),
							en: "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days')),
							"en-et": "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days'))
						}[funcSettings.language]
					},
					{
						start: zDTFromFunc(transitionTime).epochMilliseconds,
						end: zDTFromFunc(endTime).epochMilliseconds,
						title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language] + " - " + {
							he: "יום " + new hebNumFormat().formatHebrewNumber(calOfTheHag.getDate().until(jCal.tomorrow().tomorrow().getDate()).total('days')),
							en: "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().tomorrow().getDate()).total('days')),
							"en-et": "Day " + romanize(calOfTheHag.getDate().until(jCal.tomorrow().tomorrow().getDate()).total('days'))
						}[funcSettings.language]
					})
				}
			} else {
				events.push({
					start: calc.getCandleLighting().epochMilliseconds,
					end: zDTFromFunc(endTime).epochMilliseconds,
					title: yomTovObj[jCal.tomorrow().getYomTovIndex()][funcSettings.language] + (jCal.tomorrow().isPesach() ? " - " + {
						he: "יום " + new hebNumFormat().formatHebrewNumber(calOfTheHag.getDate().until(jCal.tomorrow().getDate()).total('days')),
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
					end: zDTFromFunc(calc.tomorrow().getTzetMelakha()).epochMilliseconds,
					title: funcSettings.fasts[jCal.tomorrow().getYomTovIndex().toString()][funcSettings.language],
					description: (funcSettings.language == "he" ? 'ר"ת: ' : 'R"T: ') + calc.tomorrow().getTzetRT().toLocaleString(...dtF)
				})
			else
				events.push({
					start:
						(jCal.getJewishMonth() == YihudCalendar.AV
							? calc.getShkiya()
							: calc.tomorrow().getAlotHashahar()).epochMilliseconds,
					end: calc.tomorrow().getTzetHumra().epochMilliseconds,
					title: funcSettings.fasts[jCal.tomorrow().getYomTovIndex().toString()][funcSettings.language]
				})
		}

		if (jCal.isBirkasHachamah()) {
			events.push({
				start: zDTFromFunc(calc.getNetz()).epochMilliseconds,
				end: calc.getSofZemanShemaGRA().epochMilliseconds,
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
	addEventListener('message', async (message) => postMessage(await icsExport.apply(icsExport, message.data)))