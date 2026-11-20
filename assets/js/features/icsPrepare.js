// @ts-check

import { getOrdinal, HebrewNumberFormatter } from "../core/WebsiteCalendar.js";
import { ZemanFunctions, zDTFromFunc } from "../core/ROYZmanim.js";
import { GeoLocation, Calendar, HiloulahYomiCalculator } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import YihudCalendar from "../core/WebsiteLimudCalendar.js";
import { providerFromSnapshot } from "../core/refraction-snapshot.js";
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";
import { he as n2heWords } from "../../libraries/n2words.esm.js";
import { loadWorkerPolyfills } from "../misc/worker-polyfills.js";
import { holidayNames, holidayCards, dayCards, addCards, hanukkahNight, needsEruvTavshilin, shabbat as shabbatCard } from "../core/day-cards.js";
import { levanaWindow, strictLabel as levanaStrictLabel, TEXT as levanaText } from "./levanaWindow.js";

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

/** @typedef {Parameters<typeof icsExport> extends [any, any, ...infer Rest] ? Rest : never} SharedParams the parameters after the dates, the same for every chunk of a range */

/**
 * The events for `dayCount` days from the start date. An event belongs to the day it begins on (the evening
 * of a holiday's eve is the eve's), so the day range alone decides what is included.
 * @param {ConstructorParameters<typeof Temporal.PlainDate>} plainDateParams the first day
 * @param {number} dayCount how many days to go through
 * @param {[string, number, number, number, string]} geoLocationData
 * @param {ConstructorParameters<typeof ZemanFunctions>[1]} config
 * @param {boolean} isIsrael
 * @param {Parameters<import("../core/WebsiteCalendar.js").default["getZmanimInfo"]>[2]} zmanList
 * @param {boolean} monthView
 * @param {{ language: "he-Latn" | "en" | "he"; events: string[]; timeFormat: "h11" | "h12" | "h23" | "h24"; seconds: boolean; fasts: Record<string, string>; tahanun: Record<string, string>; refraction?: import("./excelPrepare.js").ExportRefraction; learningTitle: Record<string, { "he-Latn": string; en: string; he: string; }>; }} funcSettings
 */
export default async function icsExport (plainDateParams, dayCount, geoLocationData, config, isIsrael, zmanList, monthView=true, funcSettings) {
	const baseDate = new Temporal.PlainDate(...plainDateParams)
	const geoLocation = new GeoLocation(...geoLocationData);

	const jCal = new YihudCalendar(baseDate);
	jCal.setInIsrael(isIsrael)
	const calc = new ZemanFunctions(geoLocation, {
		...config,
		atmosphereProvider: funcSettings.refraction
			? providerFromSnapshot(funcSettings.refraction.table, funcSettings.refraction.normals)
			: null
	});
	calc.setDate(baseDate);

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = [funcSettings.language == "he" ? "he" : "en", {
		hourCycle: funcSettings.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];

	if (funcSettings.seconds) {
		dtF[1].second = '2-digit'
	}

	/** the kinds of event chosen in the export modal (its exporteventid-<key> checkboxes) */
	const enabled = new Set(funcSettings.events);
	/** @param {string} key */
	const on = key => enabled.has(key);
	// the names, occasions and times are the ones the printouts and Hazon Yosef show (core/day-cards.js)
	const yomTovObj = holidayNames(jCal.getInIsrael());
	/** @type {import("../core/day-cards.js").CardContext} */
	const cardContext = { jCal, zc: date => calc.chainDate(date), lang: funcSettings.language };

	/** @param {YihudCalendar} cal any day near Pesaḥ's start */
	const pesachFirstDaysCard = cal => holidayCards.pesachFirst({ ...cardContext, jCal: cal });

	const minorHolidays = [YihudCalendar.PESACH_SHENI, YihudCalendar.LAG_BAOMER, YihudCalendar.TU_BEAV,
		YihudCalendar.TU_BESHVAT, YihudCalendar.PURIM_KATAN, YihudCalendar.SHUSHAN_PURIM_KATAN];

	/** @type {Record<string, import("../core/day-cards.js").LangText>} */
	const timeLabels = {
		candleLighting: { he: "הדלקת נרות", "he-Latn": "Candle lighting", en: "Candle lighting" },
		tzetMelakha: { he: "צאת מלאכה", "he-Latn": "Ends", en: "Ends" },
		rabbenuTam: { he: 'ר"ת', "he-Latn": 'R"T', en: 'R"T' },
		netz: { he: "הנץ החמה", "he-Latn": "Sunrise", en: "Sunrise" },
		musaf: { he: "תחילת מוסף לפני", "he-Latn": "Start Musaf before", en: "Start Musaf before" },
		birkatKohanim: { he: "סיום ברכת כהנים לפני", "he-Latn": "Finish Birkath Kohanim before", en: "Finish Birkath Kohanim before" },
		mikva: { he: "טבילה במקוה לאחר", "he-Latn": "Immersion in a mikva after", en: "Immersion in a mikva after" },
		bedikatHametz: { he: "בדיקת חמץ לאחר", "he-Latn": "Search for ḥametz after", en: "Search for ḥametz after" },
		sofZemanBiurHametz: { he: "סוף זמן ביעור חמץ", "he-Latn": "Dispose of ḥametz by", en: "Dispose of ḥametz by" },
		sofZemanAhilathHametz: { he: "סוף זמן אכילת חמץ", "he-Latn": "Last time to eat ḥametz", en: "Last time to eat ḥametz" },
		fastStarts: { he: "תחילת הצום", "he-Latn": "Fast starts", en: "Fast starts" },
		fastEnds: { he: "סיום הצום", "he-Latn": "Fast ends", en: "Fast ends" },
	};

	/** @type {Record<string, import("../core/day-cards.js").LangText>} */
	const factLabels = {
		hallel: { he: "תשלים הלל לפני ", "he-Latn": "Conclude Hallel before ", en: "Conclude Hallel before " },
		roshHodesh: { he: "ראש חודש ", "he-Latn": "Rosh Ḥodesh ", en: "Rosh Ḥodesh " },
		eruv: { he: "עושים עירוב תבשילין", "he-Latn": "Make an eruv tavshilin", en: "Make an eruv tavshilin" },
	};

	/** @type {Record<string, import("../core/day-cards.js").LangText>} */
	const hametzLabels = {
		bedika: { he: "בדיקת חמץ", "he-Latn": "Bedikath Ḥametz", en: "Search for Ḥametz" },
		erev: { he: "ערב פסח", "he-Latn": "Erev Pesaḥ", en: "Passover Eve" },
		eruv: { he: "עירוב תבשילין", "he-Latn": "Eruv Tavshilin", en: "Eruv Tavshilin" },
		zot: { he: "זאת חנוכה", "he-Latn": "Yom Ḥanuka", en: "Ḥanuka Day" },
	};

	/** @param {Temporal.PlainDate} date */
	const fancyDateOf = date =>
		jCal.chainDate(date).formatFancyDate({ ordinal: false, monthLength: "long", dayLength: "long" })[funcSettings.language];

	/** @param {string} html a card's title with its line breaks as " + " */
	const plainTitle = html => html
		.replace(/<br\s*\/?>\s*(?:\+\s*)?(?=\()/gi, " ")
		.replace(/<br\s*\/?>\s*(?:\+\s*)?/gi, " + ")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	/**
	 * Which day of its holiday a Yom Tov day is (the days before it that are Yom Tov or Ḥol HaMoed count back to the first)
	 * @param {YihudCalendar} cal
	 */
	const dayOfHoliday = cal => {
		const before = cal.chainDate(cal.getDate());
		while (before.isYomTovAssurBemelacha() || before.isCholHamoed())
			before.setDate(before.getDate().subtract({ days: 1 }));
		return before.getDate().until(cal.getDate()).days;
	};

	/**
	 * A card's days as events: one per Jewish day, each in its own category (a Shabbat in a Yom Tov's card is
	 * Shabbat's), titled for the day, with the times listed on the day it begins and the day it is.
	 * @param {import("../core/day-cards.js").DayCard} card
	 * @returns {{ category: string; event: import('ics').EventAttributes }[]}
	 */
	const cardDayEvents = card => {
		const days = card.icsDays ?? [];
		const timesOn = (/** @type {Temporal.PlainDate} */ date) =>
			[...card.datesToZman].find(([cardDate]) => cardDate.equals(date))?.[1];
		const dayNames = days.map(day => {
			const cal = jCal.chainDate(day.date);
			return cal.isYomTovAssurBemelacha() && !cal.isYomKippur() ? yomTovObj[cal.getYomTovIndex()]?.[funcSettings.language] : undefined;
		});

		return days.map((day, index) => {
			const cal = jCal.chainDate(day.date);
			const isFast = card.id.startsWith("fast-") || card.id.startsWith("yomKippur-");
			const isYomTov = !isFast && cal.isYomTovAssurBemelacha();
			const category = isFast ? "fasts" : isYomTov ? "yomtov" : "shabbat";

			let title;
			if (isYomTov) {
				title = dayNames[index] ?? plainTitle(card.title);
				// a holiday of several days is numbered, Pesaḥ's from its first day
				if (cal.isPesach() || dayNames.filter(name => name === dayNames[index]).length > 1) {
					const number = dayOfHoliday(cal);
					title += " - " + (funcSettings.language == "he"
						? "יום " + new HebrewNumberFormatter().formatHebrewNumber(number)
						: "Day " + romanize(number));
				}
			} else if (category == "shabbat" && card.id.startsWith("shabbat-"))
				title = plainTitle(card.title);
			else if (category == "shabbat")
				title = plainTitle(shabbatCard({ ...cardContext, jCal: cal }).title);
			else
				title = plainTitle(card.title);

			// the candle lighting that starts the day, and the day's own times; what comes before the first day goes with it
			const timeLines = (/** @type {Temporal.PlainDate} */ date, /** @type {(key: string) => boolean} */ keep) =>
				Object.entries(timesOn(date) ?? {})
					.filter(([key]) => keep(key))
					.map(([key, time]) => timeLabels[key]?.[funcSettings.language] + ": " + time.toLocaleString(...dtF));
			const eve = day.date.subtract({ days: 1 });
			const eveIsADay = days.some(other => other.date.equals(eve));
			const lines = [
				...timeLines(eve, key => key == "candleLighting" || !eveIsADay),
				...timeLines(day.date, key => key != "candleLighting")
			];

			if (index == 0) {
				if (card.hallelBefore)
					lines.push(factLabels.hallel[funcSettings.language] + card.hallelBefore.toLocaleString(...dtF));
				if (card.roshHodesh)
					lines.push(factLabels.roshHodesh[funcSettings.language]
						+ card.roshHodesh.month[funcSettings.language == "he" ? "he" : "en"] + ": "
						+ card.roshHodesh.days.map(fancyDateOf).join(" & "));
				if (needsEruvTavshilin(card, jCal))
					lines.push(factLabels.eruv[funcSettings.language]);
			}

			return {
				category,
				event: {
					start: day.start.epochMilliseconds,
					end: day.end.epochMilliseconds,
					title,
					description: [fancyDateOf(day.date), ...lines].join('\n')
				}
			};
		});
	};

	/** @type {import("../core/day-cards.js").DayCard[]} each Shabbat, Yom Tov and fast once, by its id */
	const cards = [];
	const cardEvents = on("shabbat") || on("yomtov") || on("fasts");

	const hiloulahCalc = on("hiloulot") ? await initialisedHiloulah() : null;

	/** @type {import('ics').EventAttributes[]} */
	const events = [];
	/** @type {import('./levanaWindow.js').LevanaWindow | undefined} */
	let levana;
	for (let index = 0; index < dayCount; index++) {
		if (on("zmanim")) {
			const dailyZmanim = Object.values(jCal.getZmanimInfo(true, calc, zmanList, dtF))
				.filter(entry => entry.display == 1)
				.map(entry => `${entry.title[funcSettings.language]}: ${entry.zDTObj.toLocaleString(...entry.dtF)}`)
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
		}

		if (on("hiloulot")) {
			const todayHiloulot = await /** @type {HiloulahYomiCalculator} */ (hiloulahCalc).getHiloulah(jCal);
			events.push({
				start: exportDate(jCal.getDate()),
				end: exportDate(jCal.getDate().add({ days: 1 })),
				title: funcSettings.language == "he" ? `הלולות יומי (${todayHiloulot.he.length})` : `Today's Hiloulot (${todayHiloulot.en.length})`,
				// @ts-ignore
				description: todayHiloulot[funcSettings.language == "he" ? "he" : "en"]
					.map((/** @type {typeof todayHiloulot.en[0] & {desc?: string}} */ hiloulahRet) =>
						hiloulahRet.name + "\n" + hiloulahRet.desc)
					.join('\n\n')
			})
		}

		if (on("levana") && jCal.getJewishDayOfMonth() <= 15) {
			if (levana?.month !== jCal.getJewishMonth())
				levana = levanaWindow(jCal, calc);

			const validFrom = levana.recommendedStart ?? levana.start;
			if (Temporal.PlainDate.compare(validFrom.toPlainDate(), jCal.getDate()) == 0) {
				const t = levanaText[funcSettings.language];
				/** @param {Temporal.ZonedDateTime} zDT */
				const fmt = zDT => zDT.toLocaleString(dtF[0], { weekday: 'short', month: 'short', day: 'numeric', ...dtF[1] });
				const strictLine = levanaStrictLabel(levana, t) + ": " + fmt(levana.endStrict);
				const earlyLine = t.earlyEnd(levana.fifteenthIsShabbat) + ": " + fmt(levana.endEarlyIkar);
				const endLines = !levana.useEarlyTimes ? [t.ends + ": " + fmt(levana.endIkar), strictLine]
					: Temporal.ZonedDateTime.compare(levana.endStrict, levana.endEarlyIkar) < 0 ? [earlyLine, strictLine]
					: [earlyLine];

				events.push({
					start: levana.validFromMs,
					end: levana.effectiveEndMs,
					title: t.title(funcSettings.language == "he" ? levana.monthNames.he : levana.monthNames.en),
					description: [t.molad + ": " + fmt(levana.molad), ...endLines].join('\n')
				})
			}
		}

		const count = jCal.tomorrow().getDayOfOmer();
		if (on("omer") && count !== -1) {
			const omerInfo = jCal.tomorrow().getOmerInfo();
			const calendarEvent = {
				start: calc.getTzet().epochMilliseconds,
				end: monViewNight(monthView, calc),
				title: {
					"he": "ספירת העומר - ליל " + (count in n2wordsOrdinal ? n2wordsOrdinal[count] : n2heWords(count)),
					"en": "Sefirath Ha'Omer - Night " + count,
					"he-Latn": "Sefirath Ha'Omer - Night " + count
				}[funcSettings.language],
				description: `היום ${omerInfo.title.he.mainCount} לעומר`
			};

			if (count >= 7)
				calendarEvent.description += `, שהם ${omerInfo.title.he.subCount.toString()}`;

			events.push(calendarEvent)
		}

		if (on("holhamoed") && !jCal.isCholHamoed() && jCal.tomorrow().isCholHamoed()) {
			let endHolHamoed = jCal.tomorrow();
			let holHamoedDay = 1;
			const fancyDate = (/** @type {YihudCalendar} */ cal) =>
				cal.formatFancyDate({ ordinal: false, monthLength: "long", dayLength: "long" })[funcSettings.language];
			let dateList = [getOrdinal(1, false) + " day: " + fancyDate(endHolHamoed)]
			do {
				endHolHamoed = endHolHamoed.tomorrow();
				holHamoedDay++;

				dateList.push(
					(endHolHamoed.isHoshanaRabba() ? yomTovObj[YihudCalendar.HOSHANA_RABBA][funcSettings.language] + " - " : "")
					+ getOrdinal(holHamoedDay, false) + " day"
					+ ": " + fancyDate(endHolHamoed)
				)
			} while (endHolHamoed.tomorrow().isCholHamoed())

			events.push({
				start: zDTFromFunc(calc.getTzetMelakha()).epochMilliseconds,
				end: calc.chainDate(endHolHamoed.getDate()).getShkiya().epochMilliseconds,
				title: {
					"he": "חול המועד " + (jCal.isPesach() ? "פסח" : "סוכות"),
					"he-Latn": "Ḥol HaMoedh " + (jCal.isPesach() ? "Pesah" : "Sukkot"),
					"en": (jCal.isPesach() ? "Passover" : "Sukkoth") + " - Intermediate Days"
				}[funcSettings.language],
				description: dateList.join('\n')
			});
		}

		if (on("hanukka") && jCal.tomorrow().isChanukah()) {
			const title = {
				"he": "חנוכה - ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()],
				"en": "Ḥanuka - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night",
				"he-Latn": "Ḥanuka - " + getOrdinal(jCal.tomorrow().getDayOfChanukah()) + " night"
			}[funcSettings.language];

			// Friday's candles are lit before Shabbat, Shabbat's after it (the card's own times)
			const night = hanukkahNight(cardContext, jCal.getDate());
			events.push({
				start: night.candleLighting.epochMilliseconds,
				end: jCal.getDayOfWeek() == Calendar.SATURDAY
					? monViewNight(monthView, calc)
					: night.candleLighting.add({ minutes: 30 }).epochMilliseconds,
				title,
				...(night.rabbenuTam ? { description: timeLabels.rabbenuTam[funcSettings.language] + ": " + night.rabbenuTam.toLocaleString(...dtF) } : {})
			})
		}

		if (on("roshchodesh") && jCal.tomorrow().isRoshChodesh() && !jCal.isRoshChodesh()) {
			const definiteDayOfNextMonth = (jCal.tomorrow().tomorrow().isRoshChodesh() ? calc.tomorrow().tomorrow() : calc.tomorrow());
			events.push({
				start: calc.getShkiya().epochMilliseconds,
				end: definiteDayOfNextMonth.getShkiya().epochMilliseconds,
				title: {
					"he": "ראש חודש " + definiteDayOfNextMonth.coreZC.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'}),
					"en": "Rosh Ḥodesh " + definiteDayOfNextMonth.coreZC.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long'}),
					"he-Latn": "Rosh Ḥodesh " + definiteDayOfNextMonth.coreZC.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long'})
				}[funcSettings.language]
			});
		}

		if (on("purim")) {
			const tomorrow = jCal.tomorrow();
			const purimTitle = [YihudCalendar.PURIM, YihudCalendar.SHUSHAN_PURIM].includes(tomorrow.getYomTovIndex())
				? yomTovObj[tomorrow.getYomTovIndex()]
				: null;
			if (purimTitle) {
				// from nightfall to the end of the day (a Friday Purim ends at candle lighting, a Shabbat one at Shabbat's end)
				const tomorrowCalc = calc.tomorrow();
				const dayOfWeek = tomorrow.getDayOfWeek();
				events.push({
					start: (jCal.getDayOfWeek() == Calendar.FRIDAY ? zDTFromFunc(calc.getCandleLighting()) : calc.getTzet()).epochMilliseconds,
					end: zDTFromFunc(dayOfWeek == Calendar.FRIDAY ? tomorrowCalc.getCandleLighting()
						: dayOfWeek == Calendar.SATURDAY ? tomorrowCalc.getTzetMelakha()
						: tomorrowCalc.getTzet()).epochMilliseconds,
					title: purimTitle[funcSettings.language]
				})
			}

			// Shushan Purim on Shabbat: Purim (Friday), Shushan Purim (Shabbat), and Purim Meshulash (Sunday) is
			// the third day, as the prints mark it
			if (tomorrow.getDayOfWeek() == Calendar.SUNDAY
				&& tomorrow.getJewishMonth() == YihudCalendar[tomorrow.isJewishLeapYear() ? "ADAR_II" : "ADAR"]
				&& tomorrow.getJewishDayOfMonth() == 16) {
				events.push({
					start: zDTFromFunc(calc.getTzetMelakha()).epochMilliseconds,
					end: calc.tomorrow().getTzet().epochMilliseconds,
					title: funcSettings.language == "he" ? "פורים משולש" : "Purim Meshulash"
				})
			}
		}

		if (on("minor") && minorHolidays.includes(jCal.getYomTovIndex())) {
			events.push({
				start: exportDate(jCal.getDate()),
				end: exportDate(jCal.getDate().add({ days: 1 })),
				title: yomTovObj[jCal.getYomTovIndex()][funcSettings.language]
			})
		}

		if (on("hanukka") && jCal.getDayOfChanukah() == 8) {
			events.push({
				start: exportDate(jCal.getDate()),
				end: exportDate(jCal.getDate().add({ days: 1 })),
				title: hametzLabels.zot[funcSettings.language]
			})
		}

		if (on("yomtov") && jCal.isEruvTavshilimMadeToday()) {
			events.push({
				start: exportDate(jCal.getDate()),
				end: exportDate(jCal.getDate().add({ days: 1 })),
				title: hametzLabels.eruv[funcSettings.language],
				description: (funcSettings.language == "he" ? "הדלקת נרות: " : "Candle lighting: ") + calc.getCandleLighting().toLocaleString(...dtF)
			})
		}

		if (on("yomtov")) {
			// the search for ḥametz is the night before Erev Pesaḥ (two nights before, when Erev Pesaḥ is Shabbat)
			for (const ahead of [1, 2]) {
				const erev = jCal.chainDate(jCal.getDate().add({ days: ahead }));
				if (erev.getYomTovIndex() != YihudCalendar.EREV_PESACH
					|| !erev.getDate().subtract({ days: erev.getDayOfWeek() == Calendar.SATURDAY ? 2 : 1 }).equals(jCal.getDate()))
					continue;

				const times = [...pesachFirstDaysCard(erev).datesToZman].find(([date]) => date.equals(erev.getDate()))?.[1];
				if (times?.bedikatHametz)
					events.push({
						start: times.bedikatHametz.epochMilliseconds,
						end: times.bedikatHametz.add({ minutes: 30 }).epochMilliseconds,
						title: hametzLabels.bedika[funcSettings.language]
					})
			}

			if (jCal.getYomTovIndex() == YihudCalendar.EREV_PESACH) {
				const times = [...pesachFirstDaysCard(jCal).datesToZman].find(([date]) => date.equals(jCal.getDate()))?.[1];
				events.push({
					start: exportDate(jCal.getDate()),
					end: exportDate(jCal.getDate().add({ days: 1 })),
					title: hametzLabels.erev[funcSettings.language],
					description: [
						times?.sofZemanAhilathHametz && timeLabels.sofZemanAhilathHametz[funcSettings.language] + ": " + times.sofZemanAhilathHametz.toLocaleString(...dtF),
						times?.sofZemanBiurHametz && timeLabels.sofZemanBiurHametz[funcSettings.language] + ": " + times.sofZemanBiurHametz.toLocaleString(...dtF)
					].filter(Boolean).join('\n')
				})
			}
		}

		if (on("birkathachama") && jCal.isBirkasHachamah()) {
			events.push({
				start: zDTFromFunc(calc.getNetz()).epochMilliseconds,
				end: calc.getSofZemanShemaGRA().epochMilliseconds,
				title: {
					'he': "ברכת החמה",
					"he-Latn": "Birkath Haḥama",
					'en': "Blessing of the Sun"
				}[funcSettings.language]
			})
		}

		if (cardEvents)
			addCards(cards, ...dayCards(cardContext));

		jCal.setDate(jCal.getDate().add({ days: 1 }));
		calc.setDate(calc.coreZC.getDate().add({ days: 1 }))
	}

	// one event per Jewish day of each Shabbat, Yom Tov and fast (the same from whichever chunk of days finds it)
	for (const card of cards)
		for (const { category, event } of cardDayEvents(card))
			if (on(category))
				events.push(event);

	return events;
}


/** @type {Promise<HiloulahYomiCalculator> | undefined} */
let hiloulahReady;
/** The Hiloulot calculator, loaded once per page or worker (its init fetches the data). */
function initialisedHiloulah() {
	return hiloulahReady ??= (async () => {
		const calculator = new HiloulahYomiCalculator("/assets/libraries/kosherZmanim/withDesc/");
		await calculator.init();
		return calculator;
	})().catch(error => { hiloulahReady = undefined; throw error; });
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

// The page (export.js) posts the refraction and the constant parameters once per worker, then a
// [startDateParams, dayCount] for every task. A message that is a whole parameter list still works.
if ("WorkerGlobalScope" in globalThis) {
	/** @type {{ table: any, normals: any } | undefined} */
	let refraction;
	/** @type {any[] | undefined} geoLocationData, config, isIsrael, zmanList, monthView, funcSettings */
	let constants;

	addEventListener('message', async (message) => {
		const data = message.data;
		// handled before any await, so they are in place before the first task
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
				return postMessage(await icsExport.apply(icsExport, data));
			const [geo, config, isIsrael, zmanList, monthView, funcSettings] = constants;
			postMessage(await icsExport(data[0], data[1], geo, config, isIsrael, zmanList, monthView, { ...funcSettings, refraction }))
		} catch (error) {
			postMessage({ error: String(error?.stack ?? error) })
		}
	})
}