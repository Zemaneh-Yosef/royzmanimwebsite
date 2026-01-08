// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js"
import { he as n2heWords, he_rt as n2ruWords } from "../libraries/n2words.esm.js";
import { zDTFromFunc } from "./ROYZmanim.js";

/** @typedef {{ hb?: string, en?: string, "en-et"?: string; "ru"?: string; }} langType */
/** @typedef {{display: -2|-1|0|1, code: string[], zDTObj: KosherZmanim.Temporal.ZonedDateTime, title: langType, merge_title: langType; function: string; dtF: [string | string[], options?: Intl.DateTimeFormatOptions] }} zmanData */
/** @typedef {{ function: string|null; yomTovInclusive: string|null; luachInclusive: "degrees"|"seasonal"|null; condition: string|null; title: { "en-et": string; en: string; hb: string; ru?: string; }; round: "earlier"|"later"|"exact"; ignoreNextUpcoming?: boolean}} zmanInfoList */

export default
class WebsiteCalendar extends KosherZmanim.JewishCalendar {
	formatJewishFullDate() {
		const hNum = new HebrewNumberFormatter();
		return {
			english: this.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long', year: "numeric", day: "numeric"}),
			hebrew: [
				hNum.formatHebrewNumber(this.getJewishDayOfMonth()),
				this.formatJewishMonth().he + ',',
				hNum.formatHebrewNumber(this.getJewishYear()),
			].join(' ')
		}
	}

	formatJewishYear() {
		const hNum = new HebrewNumberFormatter();
		return {
			english: this.getJewishYear(),
			hebrew: hNum.formatHebrewNumber(this.getJewishYear())
		}
	}

	/** @returns {{en: string; he: string}} */
	formatJewishMonth() {
		// @ts-ignore
		return ['en', 'he']
			.map(locale => [locale, this.getDate().toLocaleString(locale + '-u-ca-hebrew', { month: 'long' })])
			.reduce(function (obj, [key, val]) {
				//@ts-ignore
				obj[key] = val
				return obj
			}, {})
	}

	/** @param {"long" | "short" | "narrow"} [length='long']  */
	formatFancyDate(length='long', ordinal=true) {
		return `${daysForLocale('en', length)[this.getDate().dayOfWeek]}, ${monthForLocale('en', length)[this.getDate().month]} ${ordinal ? getOrdinal(this.getDate().day, true) : this.getDate().day}`.trim()
	}

	/**
	 * @param {'hb'|'en'|'en-et'|'fr'} lang
	 */
	dateRenderer(lang) {
		const en = {
			text: `${monthForLocale('en')[this.getDate().month]} ${getOrdinal(this.getDate().day, true)}, ${this.getDate().year}`,
			dir: 'ltr'
		}
		const fr = {
			text: `${monthForLocale('fr')[this.getDate().month]} ${getFrenchOrdinal(this.getDate().day, false)}, ${this.getDate().year}`,
			dir: 'ltr'
		}
		const et = {
			text: this.formatJewishFullDate().english,
			dir: 'ltr'
		}
		const hb = {
			text: this.formatJewishFullDate().hebrew,
			dir: 'rtl'
		}

		let date;
		switch (lang) {
			case 'hb':
			default:
				date = { primary: hb, secondary: en, other: et }
				break;
			case 'en-et':
				date = { primary: et, secondary: en, other: hb }
				break;
			case 'en':
				date = { primary: en, secondary: et, other: hb }
				break;
			case 'fr':
				date = { primary: fr, secondary: en, other: hb }
				break;
		}

		return date;
	}

	getDayOfTheWeek() {
		return {
			en: daysForLocale('en')[this.getDate().dayOfWeek],
			fr: daysForLocale('fr')[this.getDate().dayOfWeek],
			hb: daysForLocale('he-u-ca-hebrew')[this.getDate().dayOfWeek]
		}
	}

	tomorrow() {
		const nextJewishCalendar = this.clone();
		nextJewishCalendar.setDate(nextJewishCalendar.getDate().add({ days: 1 }))

		return nextJewishCalendar
	}

	shabbat() {
		const nextJewishCalendar = this.clone();

		for (let index = 0; index < 7; index++) {
			if (nextJewishCalendar.getDate().dayOfWeek == 6)
				break;

			nextJewishCalendar.setDate(nextJewishCalendar.getDate().add({ days: 1 }));
		}

		return nextJewishCalendar
	}

	/**
	 * @param {boolean} independent
	 * @param {import("./ROYZmanim.js").ZemanFunctions} zmanCalc
	 * @param {Record<string, zmanInfoList>} zmanList
	 * @param {[string | string[], options?: Intl.DateTimeFormatOptions]} dtF
	 */
	getZmanimInfo(independent, zmanCalc, zmanList, dtF) {
		/** @type {Record<string, zmanData & {ignoreNextUpcoming?: boolean; }>} */
		const calculatedZmanim = {}

		for (const [zmanId, zmanInfo] of Object.entries(zmanList)) {
			/** @type {zmanData & {ignoreNextUpcoming?: boolean; funcRet?: KosherZmanim.Temporal.ZonedDateTime | ({time: KosherZmanim.Temporal.ZonedDateTime; } & ({isVisual: boolean;} | { degree: number; minutes: number;}))}} */
			const calculatedZman = {
				function: zmanInfo.function,
				display: 1,
				code: [],
				zDTObj: null,
				funcRet: null,
				title: {},
				merge_title: {},
				dtF: [dtF[0], Object.assign({}, dtF[1])]
			}

			if (independent) {
				calculatedZman.title.hb = zmanInfo.title.hb
				calculatedZman.title.en = zmanInfo.title.en
				calculatedZman.title['en-et'] = zmanInfo.title['en-et']
				calculatedZman.title.ru = zmanInfo.title.ru
			}

			if (zmanInfo.ignoreNextUpcoming)
				calculatedZman.ignoreNextUpcoming = true;

			if (zmanInfo.yomTovInclusive) {
				// @ts-ignore
				if (this.getYomTovIndex() !== KosherZmanim.JewishCalendar[zmanInfo.yomTovInclusive])
					calculatedZman.display = 0;
					calculatedZman.code.push('non-proper Yom Tov day')
			}

			if (zmanInfo.luachInclusive) {
				if (!['degrees', 'seasonal'].includes(zmanInfo.luachInclusive)
				 || ((zmanCalc.config.fixedMil ? "seasonal" : "degrees") !== zmanInfo.luachInclusive)
				 || (zmanInfo.luachInclusive == 'degrees' && this.getInIsrael())) {
					calculatedZman.display = -1;
					calculatedZman.code.push('wrong luach')
				}
			}

			if (zmanInfo.function) {
				// @ts-ignore
				calculatedZman.funcRet = zmanCalc[zmanInfo.function]()
				calculatedZman.zDTObj = zDTFromFunc(calculatedZman.funcRet)
			}

			/* Hardcoding below - Thankfully managed to condense this entire project away from the 2700 lines of JS it was before, but some of it still needed to stay */
			switch (zmanId) {
				case 'sunrise':
					calculatedZman.title.hb = 'הנץ';
					calculatedZman.title['en-et'] = 'HaNetz';
					calculatedZman.title.en = 'Sunrise';

					if (calculatedZman.funcRet instanceof KosherZmanim.Temporal.ZonedDateTime) {
						calculatedZman.title.hb += ' (משור)';
						calculatedZman.title['en-et'] += ' (Mishor)';
						calculatedZman.title.en += ' (Sea Level)';
					} else {
						calculatedZman.dtF[1].second = '2-digit'
					}

					break;
				case 'candleLighting':
					if (!this.hasCandleLighting()) {
						calculatedZman.display = -1;
						calculatedZman.code.push('not-shabbat')
						break;
					} else {
						if (this.getDayOfWeek() === 6 || !this.isAssurBemelacha())
							calculatedZman.zDTObj = zmanCalc.getCandleLighting();
						else if (this.getDayOfWeek() === 7)
							calculatedZman.zDTObj = zDTFromFunc(zmanCalc.getTzetMelakha())
						else
							calculatedZman.zDTObj = zmanCalc.getTzetHumra();
					}

					break;
				case 'tzeitShabbat':
					if (!this.isAssurBemelacha() || this.hasCandleLighting()){
						calculatedZman.display = 0;
						calculatedZman.code.push("Not a day with Tzet Melakha")
						break;
					}

					if (this.isYomTovAssurBemelacha() && this.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY) {
						calculatedZman.title.hb = `צאת שבת וחג`;
						calculatedZman.title['en-et'] = `Tzet Shabbat & Yom Tov`;
						calculatedZman.title.en = `Shabbat & Yom Tov Ends`;
						calculatedZman.title.ru = `Конец Шаббата и Праздника`;
					} else if (this.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY) {
						calculatedZman.title.hb = `צאת שבת`;
						calculatedZman.title['en-et'] = `Tzet Shabbat`;
						calculatedZman.title.en = `Shabbat Ends`;
						calculatedZman.title.ru = `Конец Шаббата`;
					} else {
						calculatedZman.title.hb = `צאת חג`;
						calculatedZman.title['en-et'] = `Tzet Yom Tov`;
						calculatedZman.title.en = `Yom Tov Ends`;
						calculatedZman.title.ru = `Конец Праздника`;
					}

					if (!(calculatedZman.funcRet instanceof KosherZmanim.Temporal.ZonedDateTime) && !("isVisual" in calculatedZman.funcRet)) {
						/** @type {string[]} */
						const elements = [];

						if (calculatedZman.funcRet.minutes)
							elements.push(calculatedZman.funcRet.minutes + "m");

						if (calculatedZman.funcRet.degree)
							elements.push(calculatedZman.funcRet.degree + "°");

						if (elements.length)
							['hb', 'en-et', 'en']
								.forEach((/** @type {'hb'|'en-et'|'en'} */lang) =>
									calculatedZman.title[lang] += ` (${elements.join('/')})`
								)
					}
					break;
				case 'tzeit-regular':
					if (this.isAssurBemelacha() && !this.hasCandleLighting()) {
						calculatedZman.display = 0;
						calculatedZman.code.push("Isur Melacha Tzet")
					}
					break;
				case 'tzeit-humra':
					if (this.isTaanis() && !this.isYomKippur()) {
						calculatedZman.merge_title.hb = "צאת תענית (צאת הכוכבים)";
						calculatedZman.merge_title['en-et'] = "Tzet Ta'anit (Tzet Ha'Kokhavim)";
						calculatedZman.merge_title.en = "Fast Ends (Nightfall)";

						calculatedZman.title.hb = calculatedZman.merge_title.hb
						calculatedZman.title['en-et'] = calculatedZman.merge_title['en-et']
						calculatedZman.title.en = calculatedZman.merge_title.en
					} else {
						calculatedZman.merge_title.hb = "צאת הכוכבים";
						calculatedZman.merge_title['en-et'] = "Tzet Ha'Kokhavim";
						calculatedZman.merge_title.en = "Nightfall";

						calculatedZman.title.hb = calculatedZman.merge_title.hb + " - חומרא";
						calculatedZman.title['en-et'] = calculatedZman.merge_title['en-et'] + " - Ḥumra";
						calculatedZman.title.en = calculatedZman.merge_title.en + " - Stringent";

						if (zmanCalc.config.fixedMil) {
							calculatedZman.display = 0;
							calculatedZman.code.push("Not a day with stringent-needed Tzet")
						}
					}
					break;
				case 'rt':
					if (KosherZmanim.Temporal.ZonedDateTime.compare(calculatedZman.zDTObj, zmanCalc.timeRange.current.tzethakokhavim) == 0) {
						calculatedZman.title.hb = 'ר"ת (זמנית)';
						calculatedZman.title['en-et'] = "Rabbenu Tam (Zemanit)";
						calculatedZman.title.en = "Rabbenu Tam (Seasonal)";
					} else {
						calculatedZman.title.hb = 'ר"ת (קבוע)';
						calculatedZman.title['en-et'] = "Rabbenu Tam (Kavuah)";
						calculatedZman.title.en = "Rabbenu Tam (Fixed)";
					}
			}

			if (zmanInfo.condition) {
				switch (zmanInfo.condition) {
					// Default: isTaanis - Cannot use that method because we're supposed to exclude YomKippur
					case 'isTaanit':
						if (!(this.isTaanis() && !this.isYomKippur())) {
							calculatedZman.display = 0;
							calculatedZman.code.push("Not a fast day")
						}
						break;
					case 'LATE_NIGHT':
						const selichot = this.getDayOfWeek() !== KosherZmanim.Calendar.FRIDAY
							&& (this.getJewishMonth() == KosherZmanim.JewishDate.ELUL && this.getJewishDayOfMonth() !== 29
							|| (this.getJewishMonth() == KosherZmanim.JewishDate.TISHREI && this.getJewishDayOfMonth() < 10 && this.getJewishDayOfMonth() !== 1));
						let pesah = this.getJewishMonth() == KosherZmanim.JewishDate.NISSAN && this.getJewishDayOfMonth() == 14;
						if (!this.getInIsrael())
							pesah = pesah || this.getJewishMonth() == KosherZmanim.JewishDate.NISSAN && this.getJewishDayOfMonth() == 14;

						if (!selichot && !pesah) {
							calculatedZman.display = 0;
							calculatedZman.code.push("No one is staying up this late")
						}
						break;
					case 'ALL_NIGHT':
						if (!this.isShavuos() && !this.isHoshanaRabba()) {
							calculatedZman.display = 0;
							calculatedZman.code.push("No one is up this early")
						}
						break;
					case 'TZET_MELAKHA':
						if (this.hasCandleLighting() || !this.isAssurBemelacha()) {
							calculatedZman.display = 0;
							calculatedZman.code.push("Not a day with Tzet-Melakha")
						}
				}
			}

			if (!calculatedZman.zDTObj) {
				calculatedZman.display = calculatedZman.display == -1 ? -1 : -2;
				calculatedZman.code.push("Invalid Date");
			} else {
				if (calculatedZman.dtF[0] !== null && !('second' in calculatedZman.dtF[1])
					&& (calculatedZman.zDTObj.second > 40 || (calculatedZman.zDTObj.second > 20 && zmanInfo.round == 'later'))) {
						calculatedZman.zDTObj = calculatedZman.zDTObj.with({ second: 0, millisecond: 0 }).add({ minutes: 1 });
					}
			}

			calculatedZmanim[zmanId] = calculatedZman;
		}

		return calculatedZmanim;
	}

	getYomTovObject() {
		return {
			// Holidays
			[KosherZmanim.JewishCalendar.PESACH]: {
				hebrew: "פסח",
				"english-translated": "Pesach",
				english: "Passover",
			},
			[KosherZmanim.JewishCalendar.CHOL_HAMOED_PESACH]: {
				english: "Passover: Intermediary",
				"english-translated": "Chol HaMoed Pesach",
				hebrew: "פסח (חול המועד)"
			},
			[KosherZmanim.JewishCalendar.SHAVUOS]: {
				english: "Shavuoth",
				hebrew: "שבועות"
			},
			[KosherZmanim.JewishCalendar.ROSH_HASHANA]: {
				"hebrew": "ראש השנה",
				"english": "Rosh Hashana"
			},
			[KosherZmanim.JewishCalendar.SUCCOS]: {
				"hebrew": "סוכות",
				"english": "Sukkoth"
			},
			[KosherZmanim.JewishCalendar.CHOL_HAMOED_SUCCOS]: {
				"hebrew": "סוכות (חול המועד)",
				"english-translated": "Hol HaMoed Sukkoth",
				"english": "Sukkoth: Intermediary"
			},
			[KosherZmanim.JewishCalendar.HOSHANA_RABBA]: {
				"hebrew": "הושנה רבה - שביעי של סוכות",
				"english-translated": "Hoshanah Rabba - 7th day of Sukkoth",
				"english": "7th day of Sukkoth (Hoshana Rabba)"
			},

			// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
			// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
			[KosherZmanim.JewishCalendar.SHEMINI_ATZERES]: {
				"hebrew": "שמיני עצרת" + (this.getInIsrael() ? " & שמחת תורה" : ""),
				"english": "Shemini Atzereth" + (this.getInIsrael() ? " & Simchath Torah" : "")
			},
			[KosherZmanim.JewishCalendar.SIMCHAS_TORAH]: {
				"hebrew": (this.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
				"english": (this.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah"
			},

			// Semi-Holidays
			[KosherZmanim.JewishCalendar.PESACH_SHENI]: {
				"hebrew": "פסח שני",
				"english": "Pesach Sheni"
			},
			[KosherZmanim.JewishCalendar.LAG_BAOMER]: {
				"hebrew": "לג בעומר",
				"english": "Lag Ba'Omer"
			},
			[KosherZmanim.JewishCalendar.TU_BEAV]: {
				"hebrew": 'ט"ו באב',
				"english": "Tu Be'av"
			},
			[KosherZmanim.JewishCalendar.TU_BESHVAT]: {
				"hebrew": 'ט"ו בשבט',
				"english": "Tu Bishvat"
			},
			[KosherZmanim.JewishCalendar.PURIM_KATAN]: {
				"hebrew": "פורים קתן",
				"english": "Purim Katan",
			},
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN]: {
				"hebrew": "שושן פורים קתן",
				"english": "Shushan Purim Katan"
			},
			[KosherZmanim.JewishCalendar.PURIM]: {
				"hebrew": "פורים",
				"english": "Purim",
			},
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM]: {
				"hebrew": "שושן פורים",
				"english": "Shushan Purim"
			},
	
			// Modern-Day Celebrations
			[KosherZmanim.JewishCalendar.YOM_HASHOAH]: {
				hebrew: "יום השועה",
				"english-translated": "Yom Hashoa",
				english: "Holocaust Memorial Day"
			},
			[KosherZmanim.JewishCalendar.YOM_HAZIKARON]: {
				"hebrew": "יום הזכרון",
				"english-translated": "Yom Hazikaron",
				"english": "Day of Rememberance"
			},
			[KosherZmanim.JewishCalendar.YOM_HAATZMAUT]: {
				"hebrew": "יום האצמעות",
				"english-translated": "Yom Haatzmauth",
				"english": "Yom Haatzmauth"
			}, // Tachanun is said
			[KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM]: {
				"hebrew": "יום ירושלים",
				"english-translated": "Yom Yerushalayim",
				"english": "Jerusalem Day"
			},
		};
	}

	getYomTov(language='english-translated') {
		if (!this.getYomTovObject()[this.getYomTovIndex()])
			return null;

		// @ts-ignore
		return yomTovObj[this.getYomTovIndex()][language] || yomTovObj[this.getYomTovIndex()]["english"];
	}

	listOfSpecialDays() {
		const result = [];

		const yomTovOfToday = this.getYomTov();
		const yomTovOfNextDay = this.tomorrow().getYomTov();

		if (yomTovOfToday || yomTovOfNextDay) {
			let yomTovTitle = [];

			if (yomTovOfToday)
				yomTovTitle.push(yomTovOfToday);

			if (yomTovOfNextDay && !yomTovOfNextDay.includes(yomTovOfToday))
				yomTovTitle.push("Erev " + yomTovOfNextDay);

			result.push(yomTovTitle.join(" / "))
		}

		if (this.isRoshChodesh() || this.tomorrow().isRoshChodesh() || this.tomorrow().isRoshChodesh()) {
			if (!(!this.isRoshChodesh() && !this.tomorrow().isRoshChodesh())) {
				const erevRoshHodesh = (!this.isRoshChodesh() && this.tomorrow().isRoshChodesh())

				const definiteRoshHodeshDay = this.tomorrow().tomorrow().isRoshChodesh() ?
					this.tomorrow().tomorrow()
					: this.tomorrow();

				result.push((erevRoshHodesh ? "Erev " : "") + "Rosh Ḥodesh " + definiteRoshHodeshDay.formatJewishMonth().en)
			}
		}

		const dayOfChanukah = this.getDayOfChanukah();
		if (dayOfChanukah != -1) {
			result.push(getOrdinal(dayOfChanukah) + " day of Ḥanukah");
		}
		return result;
	}

	getOmerInfo() {
		const weeks = Math.floor(this.getDayOfOmer() / 7);
		const days = this.getDayOfOmer() % 7;

		// Hebrew Attributes
		const hbDayWords = ["יוֹם", "יָמִים"]
		const hbTitle = [n2heWords(this.getDayOfOmer()), hbDayWords[(this.getDayOfOmer() >= 2 && this.getDayOfOmer() <= 10 ? 1 : 0)]];
		if (this.getDayOfOmer() == 1)
			hbTitle.reverse()

		const hbWeeksCount = [n2heWords(weeks)]
		if (weeks == 1) {
			hbWeeksCount.push("שָׁבוּעַ")
			hbWeeksCount.reverse()
		} else {
			hbWeeksCount.push("שָׁבוּעוֹת")
		}

		const hbDayCount = [n2heWords(days)]
		if (days == 1) {
			hbDayCount.push(hbDayWords[0])
			hbDayCount.reverse()
		} else {
			hbDayCount.push(hbDayWords[1])
		}

		// Hebrew Attributes
		const ruDayWords = ["ём", "ямим"]
		const ruTitle = [n2ruWords(this.getDayOfOmer()), ruDayWords[(this.getDayOfOmer() >= 2 && this.getDayOfOmer() <= 10 ? 1 : 0)]];
		if (this.getDayOfOmer() == 1)
			ruTitle.reverse()

		const ruWeeksCount = [n2ruWords(weeks)]
		if (weeks == 1) {
			ruWeeksCount.push("шавуа")
			ruWeeksCount.reverse()
		} else {
			ruWeeksCount.push("шавуóт")
		}

		const ruDayCount = [n2ruWords(days)]
		if (days == 1) {
			ruDayCount.push(ruDayWords[0])
			ruDayCount.reverse()
		} else {
			ruDayCount.push(ruDayWords[1])
		}

		/**
		 * @param {{ days: any; weeks: any; toString?: (() => string) | (() => string) | (() => string); }} data
		 * @param {string} connector
		 */
		function fullSubCount (data, connector) {
			return (!weeks ? "" :[data.weeks].concat(days ? [data.days] : []).join(connector));
		}

		return {
			info: {
				days,
				weeks
			},
			title: {
				en: {
					mainCount: getOrdinal(super.getDayOfOmer(), true),
					subCount: {
						days: getOrdinal(days, true) + " day",
						weeks: getOrdinal(weeks, true) + " week",
						toString: function () { return fullSubCount(this, " • "); }
					}
				},
				fr: {
					mainCount: getFrenchOrdinal(super.getDayOfOmer(), false),
					subCount: {
						days: getFrenchOrdinal(days, false) + " jour",
						weeks: getFrenchOrdinal(weeks, false) + " semaine",
						toString: function () { return fullSubCount(this, " • "); }
					}
				},
				et: {
					mainCount: this.getDayOfOmer() + " day" + (this.getDayOfOmer() >= 2 ? "s" : ''),
					subCount: {
						days: (days == 1 ? "a day" : days + " days"),
						weeks: (weeks == 1 ? "is a week" : "are " + weeks + " weeks"),
						toString: function () { return fullSubCount(this, " and "); }
					}
				},
				hb: {
					mainCount: hbTitle.join(" "),
					subCount: {
						days: hbDayCount.join(" "),
						weeks: hbWeeksCount.join(" "),
						toString: function () {
							let connectParam = " ";
							switch (days) {
								case 2:
								case 3:
									connectParam += "וּ";
									break;
								case 5:
									connectParam += "וַ";
									break;
								default:
									connectParam += 'וְ';
									break;
							}

							return fullSubCount(this, connectParam);
						}
					}
				},
				ru: {
					mainCount: ruTitle.join(" "),
					subCount: {
						days: ruDayCount.join(" "),
						weeks: ruWeeksCount.join(" "),
						toString: function () {
							let connectParam = " ";
							switch (days) {
								case 2:
								case 3:
									connectParam += "у";
									break;
								case 5:
									connectParam += "ва";
									break;
								default:
									connectParam += 'ве';
									break;
							}

							return fullSubCount(this, connectParam);
						}
					}
				}
			}
		}
	}

	tefilahRules(checkErevTachanun=true) {
		const tefilaRule = new KosherZmanim.TefilaRules();
		const yomTovIndex = this.getYomTovIndex();

		const normalAmidah = !(this.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY || [
			KosherZmanim.JewishCalendar.SHAVUOS,
			KosherZmanim.JewishCalendar.PESACH,
			KosherZmanim.JewishCalendar.SUCCOS,
			KosherZmanim.JewishCalendar.SHEMINI_ATZERES,
			KosherZmanim.JewishCalendar.SIMCHAS_TORAH,
			KosherZmanim.JewishCalendar.ROSH_HASHANA,
			KosherZmanim.JewishCalendar.YOM_KIPPUR
		].includes(yomTovIndex));

		const ulChaparatPesha = (this.isJewishLeapYear()
			&& this.getDate().withCalendar("hebrew").month <= 7);

		const todaysTachanun = (this.isRoshChodesh() ||
			[
				KosherZmanim.JewishCalendar.PESACH_SHENI,
				KosherZmanim.JewishCalendar.LAG_BAOMER,
				KosherZmanim.JewishCalendar.TISHA_BEAV,
				KosherZmanim.JewishCalendar.TU_BEAV,
				KosherZmanim.JewishCalendar.EREV_ROSH_HASHANA,
				KosherZmanim.JewishCalendar.ROSH_HASHANA,
				KosherZmanim.JewishCalendar.EREV_YOM_KIPPUR,
				KosherZmanim.JewishCalendar.YOM_KIPPUR,
				KosherZmanim.JewishCalendar.TU_BESHVAT,
				KosherZmanim.JewishCalendar.PURIM_KATAN,
				KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN,
				KosherZmanim.JewishCalendar.PURIM,
				KosherZmanim.JewishCalendar.SHUSHAN_PURIM,
				KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM
			].includes(yomTovIndex) ||
			this.isChanukah() ||
			this.getJewishMonth() == KosherZmanim.JewishDate.NISSAN ||
			(this.getJewishMonth() == KosherZmanim.JewishDate.SIVAN &&
				this.getJewishDayOfMonth() <= 12) ||
			(this.getJewishMonth() == KosherZmanim.JewishDate.TISHREI &&
				this.getJewishDayOfMonth() >= 11)
		)

		const firstDayOfPessach = new KosherZmanim.JewishDate(this.getJewishYear(), KosherZmanim.JewishDate.NISSAN, 15);
		const secondDayOfPessach = new KosherZmanim.JewishDate(this.getJewishYear(), KosherZmanim.JewishDate.NISSAN, 16);

		let hallel = 0;
		if (this.compareTo(firstDayOfPessach) == 0 || (!this.getInIsrael() && this.compareTo(secondDayOfPessach) == 0)
		 || [
				KosherZmanim.JewishCalendar.SHAVUOS,
				KosherZmanim.JewishCalendar.SUCCOS,
				KosherZmanim.JewishCalendar.SHEMINI_ATZERES,
				KosherZmanim.JewishCalendar.SIMCHAS_TORAH,
				KosherZmanim.JewishCalendar.CHANUKAH,
				KosherZmanim.JewishCalendar.CHOL_HAMOED_SUCCOS
			].includes(yomTovIndex)
		)
			hallel = 2;
		else
			hallel = Number([
				KosherZmanim.JewishCalendar.ROSH_CHODESH,
				KosherZmanim.JewishCalendar.PESACH,
				KosherZmanim.JewishCalendar.CHOL_HAMOED_PESACH,
			].includes(yomTovIndex))

		const tefilahRuleObj = {
			alHanissim: [KosherZmanim.JewishCalendar.CHANUKAH, KosherZmanim.JewishCalendar.PURIM].includes(yomTovIndex),
			yaalehVeyavo: [
				KosherZmanim.JewishCalendar.SHAVUOS,
				KosherZmanim.JewishCalendar.PESACH,
				KosherZmanim.JewishCalendar.SUCCOS,
				KosherZmanim.JewishCalendar.SHEMINI_ATZERES,
				KosherZmanim.JewishCalendar.SIMCHAS_TORAH,
				KosherZmanim.JewishCalendar.ROSH_CHODESH,
				KosherZmanim.JewishCalendar.ROSH_HASHANA
			].includes(yomTovIndex),
			hallel: hallel,
			tachanun: todaysTachanun ? 2 : 0,
			amidah: {
				"mechayehHametim": (tefilaRule.isMashivHaruachRecited(this) ? "משיב הרוח" : "מוריד הטל"),
				"mevarechHashanim": (!normalAmidah ? null :
					(tefilaRule.isVeseinBerachaRecited(this) ? "ברכנו" : "ברך עלינו")),
				"ulChaparatPesha": (!this.isRoshChodesh() ? null : ulChaparatPesha)
			}
		}

		if (checkErevTachanun && !todaysTachanun) {
			tefilahRuleObj.tachanun = Number(this.tomorrow().tefilahRules(false).tachanun && ![
				KosherZmanim.JewishCalendar.EREV_ROSH_HASHANA,
				KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM
			].includes(this.tomorrow().getYomTovIndex()))
		}

		return tefilahRuleObj;
	}

	isShvuaShechalBo() {
		//shevua shechal bo happens on the whole week that tisha beav falls out on
		if (this.getJewishMonth() !== KosherZmanim.JewishDate.AV || this.getJewishDayOfMonth() >= 10)
			return false;

		if ([6, 7].includes(this.getDate().withCalendar("hebrew").with({ day: 9 }).dayOfWeek))
			return false;//there is no shevua shechal bo if tisha beav falls out on a sunday or shabbat

		const daysOfShvuaShechalBo = [];
		for (
			const tishaBeav = new KosherZmanim.JewishDate(this.getJewishYear(), KosherZmanim.JewishDate.AV, 8);
			tishaBeav.getDayOfWeek() != 7;
			tishaBeav.setJewishDayOfMonth(tishaBeav.getJewishDayOfMonth() - 1)
		)
			daysOfShvuaShechalBo.push(tishaBeav.getJewishDayOfMonth());// add which days are in the week of tisha beav

		return daysOfShvuaShechalBo.includes(this.getJewishDayOfMonth());
	}

	isMourningPeriod() {
		const validSefira = this.getDayOfOmer() !== -1;
		const validTamuz = (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17);
		const validAv = (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 10);

		return validAv || validTamuz || validSefira
	}

	/*
	* If an attribute returns true, that means the mourning customs are in effect
	*/
	mourningHalachot() {
		const validAv = this.getJewishMonth() == KosherZmanim.JewishDate.AV
					 && this.getJewishDayOfMonth() >= 2
					 && this.getJewishDayOfMonth() <= 8;
		const fullAv = this.getJewishMonth() == KosherZmanim.JewishDate.AV
					 && this.getJewishDayOfMonth() <= 8;
		const tenAv = this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() == 10;

		const threeWeeks = fullAv || (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17);
		const validOmer = (this.getDayOfOmer() <= 34 && this.getDayOfOmer() !== -1)

		const allDaysOfMourning = validOmer || threeWeeks;
		const noHolHamoed = (this.getDayOfOmer() >= 8 && this.getDayOfOmer() <= 32) || threeWeeks;

		return {
			music: noHolHamoed,
			haircuts: validOmer || this.isShvuaShechalBo(),
			wedding: validOmer || fullAv,
			purchaseClothing: validAv,
			swimming: this.isShvuaShechalBo(),
			construction: this.isShvuaShechalBo(),
			meat: (validAv && this.getDayOfWeek() !== 7) || tenAv,
			showering: this.isShvuaShechalBo(),
			laundry: this.isShvuaShechalBo(),
			wearingClothing: validAv,
			shechiyanu: (threeWeeks && (this.getDayOfWeek() !== 7 || (this.getDayOfWeek() == 7 && !validAv))) || tenAv
		}
	}

	clone() {
		const clonedCal = new WebsiteCalendar(this.getDate())
		clonedCal.setInIsrael(this.getInIsrael())
		clonedCal.setUseModernHolidays(this.isUseModernHolidays())
		clonedCal.setIsMukafChoma(this.getIsMukafChoma())

		return clonedCal;
	}

	/**
	 * @param {KosherZmanim.Temporal.PlainDate} plainDate
	 */
	chainDate(plainDate) {
		const newCal = this.clone();
		newCal.setDate(plainDate);
		return newCal;
	}

	/**
	 * @param {number} jewishYear
	 * @param {number} jewishMonth
	 * @param {number} jewishDay
	 */
	chainJewishDate(jewishYear, jewishMonth, jewishDay) {
		const newCal = this.clone();
		newCal.setJewishDate(jewishYear, jewishMonth, jewishDay);
		return newCal;
	}

	/**
	 * @param {number} yomTovIndex
	 */
	chainYomTovIndex(yomTovIndex) {
		const yomTovDateObj = {
			[KosherZmanim.JewishCalendar.PESACH]: { month: KosherZmanim.JewishDate.NISSAN, day: 15 },
			[KosherZmanim.JewishCalendar.SHAVUOS]: { month: KosherZmanim.JewishDate.SIVAN, day: 6 },
			[KosherZmanim.JewishCalendar.PURIM]: { month: KosherZmanim.JewishDate[this.isJewishLeapYear() ? 'ADAR_II' : 'ADAR'], day: 14 },
			[KosherZmanim.JewishCalendar.ROSH_HASHANA]: { month: KosherZmanim.JewishDate.TISHREI, day: 1 },
			[KosherZmanim.JewishCalendar.SUCCOS]: { month: KosherZmanim.JewishDate.TISHREI, day: 15 },
			[KosherZmanim.JewishCalendar.SHEMINI_ATZERES]: { month: KosherZmanim.JewishDate.TISHREI, day: 22 },
			[KosherZmanim.JewishCalendar.SIMCHAS_TORAH]: { month: KosherZmanim.JewishDate.TISHREI, day: 23 },
			[KosherZmanim.JewishCalendar.CHANUKAH]: { month: KosherZmanim.JewishDate.KISLEV, day: 25 },
			[KosherZmanim.JewishCalendar.TU_BESHVAT]: { month: KosherZmanim.JewishDate.SHEVAT, day: 15 },
			[KosherZmanim.JewishCalendar.YOM_HASHOAH]: { month: KosherZmanim.JewishDate.NISSAN, day: 27 },
			[KosherZmanim.JewishCalendar.YOM_HAZIKARON]: { month: KosherZmanim.JewishDate.IYAR, day: 4 },
			[KosherZmanim.JewishCalendar.YOM_HAATZMAUT]: { month: KosherZmanim.JewishDate.IYAR, day: 5 },
			[KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM]: { month: KosherZmanim.JewishDate.IYAR, day: 28 },
			[KosherZmanim.JewishCalendar.PURIM_KATAN]: { month: KosherZmanim.JewishDate.ADAR, day: 14 },
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN]: { month: KosherZmanim.JewishDate.ADAR, day: 15 },
			[KosherZmanim.JewishCalendar.LAG_BAOMER]: { month: KosherZmanim.JewishDate.IYAR, day: 18 },
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM]: { month: KosherZmanim.JewishDate[this.isJewishLeapYear() ? 'ADAR_II' : 'ADAR'], day: 15 },
			[KosherZmanim.JewishCalendar.TISHA_BEAV]: { month: KosherZmanim.JewishDate.AV, day: 9 },
			[KosherZmanim.JewishCalendar.EREV_PESACH]: { month: KosherZmanim.JewishDate.NISSAN, day: 14 },
			[KosherZmanim.JewishCalendar.EREV_SHAVUOS]: { month: KosherZmanim.JewishDate.SIVAN, day: 5 },
			[KosherZmanim.JewishCalendar.EREV_ROSH_HASHANA]: { month: KosherZmanim.JewishDate.ELUL, day: 29 },
			[KosherZmanim.JewishCalendar.EREV_YOM_KIPPUR]: { month: KosherZmanim.JewishDate.TISHREI, day: 9 },
			[KosherZmanim.JewishCalendar.EREV_SUCCOS]: { month: KosherZmanim.JewishDate.TISHREI, day: 14 },
			[KosherZmanim.JewishCalendar.FAST_OF_ESTHER]: { month: KosherZmanim.JewishDate[this.isJewishLeapYear() ? 'ADAR_II' : 'ADAR'], day: 13 },
			[KosherZmanim.JewishCalendar.FAST_OF_GEDALYAH]: { month: KosherZmanim.JewishDate.TISHREI, day: 3 },
			[KosherZmanim.JewishCalendar.SEVENTEEN_OF_TAMMUZ]: { month: KosherZmanim.JewishDate.TAMMUZ, day: 17 },
			[KosherZmanim.JewishCalendar.TENTH_OF_TEVES]: { month: KosherZmanim.JewishDate.TEVES, day: 10 },
			[KosherZmanim.JewishCalendar.TU_BEAV]: { month: KosherZmanim.JewishDate.AV, day: 15 },
			[KosherZmanim.JewishCalendar.PESACH_SHENI]: { month: KosherZmanim.JewishDate.IYAR, day: 14 },
			[KosherZmanim.JewishCalendar.YOM_KIPPUR]: { month: KosherZmanim.JewishDate.TISHREI, day: 10 }
		}

		if (yomTovIndex in yomTovDateObj) {
			const newCal = this.chainJewishDate(
				this.getJewishYear(),
				yomTovDateObj[yomTovIndex].month,
				yomTovDateObj[yomTovIndex].day
			);

			const fasts = [
				KosherZmanim.JewishCalendar.SEVENTEEN_OF_TAMMUZ,
				KosherZmanim.JewishCalendar.FAST_OF_GEDALYAH,
				KosherZmanim.JewishCalendar.TISHA_BEAV
			];
			if (fasts.includes(yomTovIndex) && newCal.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY) {
				newCal.setJewishDayOfMonth(newCal.getJewishDayOfMonth() + 1);
			}

			return newCal;
		}
	}

	/**
	 * @param {import("./ROYZmanim.js").ZemanFunctions} zmanCalc
	 */
	birkathHalevanaCheck(zmanCalc) {
		const dateObjs = {
			start: this.getTchilasZmanKidushLevana7Days().withTimeZone(zmanCalc.coreZC.getGeoLocation().getTimeZone()),
			current: this.getDate().toZonedDateTime(zmanCalc.coreZC.getGeoLocation().getTimeZone()).with({ hour: 11, minute: 59 }),
			end: this.getSofZmanKidushLevana15Days().withTimeZone(zmanCalc.coreZC.getGeoLocation().getTimeZone())
		}

		if ([KosherZmanim.JewishCalendar.AV, KosherZmanim.JewishCalendar.TISHREI].includes(this.getJewishMonth())) {
			const monthCalc = new KosherZmanim.ZmanimCalendar(zmanCalc.coreZC.getGeoLocation());
			monthCalc.setUseElevation(zmanCalc.coreZC.isUseElevation())

			switch (this.getJewishMonth()) {
				case KosherZmanim.JewishCalendar.AV:
					const tishaBeav = this.clone();
					tishaBeav.setJewishDayOfMonth(9);
					if (tishaBeav.getDayOfWeek() == 7)
						tishaBeav.setJewishDayOfMonth(10);

					monthCalc.setDate(tishaBeav.getDate());
					break;
				case KosherZmanim.JewishCalendar.TISHREI:
					const yomKippur = this.clone();
					yomKippur.setJewishDayOfMonth(10);

					monthCalc.setDate(yomKippur.getDate());
					break;
			}

			dateObjs.start = (monthCalc.isUseElevation() ? monthCalc.getSunset() : monthCalc.getSeaLevelSunset());
		}

		return {
			current: rangeDates(dateObjs.start, dateObjs.current, dateObjs.end, true),
			data: dateObjs
		}
	}
}

/**
 * @param {number} n
 * @param {boolean} [htmlSup]
 */
export function getOrdinal (n, htmlSup=false) {
	return n.toString()
		+ (htmlSup ? "<sup>" : "")
		+ { e: "st", o: "nd", w: "rd", h: "th" }[new Intl.PluralRules("en", { type: "ordinal" }).select(n)[2]]
		+ (htmlSup ? "</sup>" : "")
}

/**
 * @param {number} n 
 * @param {boolean} [htmlSup]
 */
export function getFrenchOrdinal (n, htmlSup=false) {
	return n.toString()
		+ (htmlSup ? "<sup>" : "")
		+ { e: "er", h: "e" }[new Intl.PluralRules("fr", { type: "ordinal" }).select(n)[2]]
		+ (htmlSup ? "</sup>" : "")
}

/**
 * @param {string | string[]} localeName
 * @param {"short" | "long" | "narrow"} [weekday]
 */
export function daysForLocale(localeName, weekday = 'long', calendar = 'iso8601') {
	const baseDate = KosherZmanim.Temporal.PlainDate.from({ year: 2024, month: 1, day: 1 }).withCalendar(calendar);
	const dayLocale = [...Array(baseDate.daysInWeek).keys()]
		.map((day) => baseDate.with({ day: day + 1 }).toLocaleString(localeName, { weekday }));

	dayLocale.unshift(undefined);
	return dayLocale;
}

/**
 * @param {string | string[]} localeName
 * @param {"short" | "long" | "narrow" | "numeric" | "2-digit"} [month] 
 */
export function monthForLocale(localeName, month = 'long', calendar = 'iso8601', year=2024) {
	const baseDate = KosherZmanim.Temporal.PlainDate.from({ year, month: 1, day: 1 }).withCalendar(calendar);
	const monthLocale = [...Array(baseDate.monthsInYear).keys()]
		.map((monthNum) => baseDate.with({ month: monthNum + 1 }).toLocaleString(localeName, { month }));

	monthLocale.unshift(undefined);
	return monthLocale;
}

export class HebrewNumberFormatter {
	static GERESH = '\u05F3';
	static GERSHAYIM = '\u05F4';

	constructor() {
		this.finalFormLetters = true;
		this.gershGershayim = true;
		this.useLonghebrewYears = false;
	}

	/**
   * Returns a Hebrew formatted string of a number. The method can calculate from 0 - 9999.
   * <ul>
   * <li>Single digit numbers such as 3, 30 and 100 will be returned with a &#x5F3; (<a
   * href="https://en.wikipedia.org/wiki/Geresh">Geresh</a>) appended as at the end. For example &#x5D2;&#x5F3;,
   * &#x5DC;&#x5F3; and &#x5E7;&#x5F3;</li>
   * <li>multi digit numbers such as 21 and 769 will be returned with a &#x5F4; (<a
   * href="https://en.wikipedia.org/wiki/Gershayim">Gershayim</a>) between the second to last and last letters. For
   * example &#x5DB;&#x5F4;&#x5D0;, &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;</li>
   * <li>15 and 16 will be returned as &#x5D8;&#x5F4;&#x5D5; and &#x5D8;&#x5F4;&#x5D6;</li>
   * <li>Single digit numbers (years assumed) such as 6000 (%1000=0) will be returned as &#x5D5;&#x5F3;
   * &#x5D0;&#x5DC;&#x5E4;&#x5D9;&#x5DD;</li>
   * <li>0 will return &#x5D0;&#x5E4;&#x05E1;</li>
   * </ul>
   *
   * @param {number} num
   *            the number to be formatted. It will trow an IllegalArgumentException if the number is &lt; 0 or &gt; 9999.
   * @return the Hebrew formatted number such as &#x5EA;&#x5E9;&#x5DB;&#x5F4;&#x5D8;
   */
	formatHebrewNumber(num) {
		if (num !== Math.trunc(num)) throw new Error('number must be an integer.');
	
		if (num < 0) {
		  throw new Error('negative numbers can\'t be formatted');
		} else if (num > 9999) {
		  throw new Error('numbers > 9999 can\'t be formatted');
		}
	
		const ALAFIM = 'אלפים';
		const EFES = 'אפס';

		const jHundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
		const jTens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"]
		const jTenEnds = ["", "י", "ך", "ל", "ם", "ן", "ס", "ע", "ף", "ץ"];
		const tavTaz = ["טו", "טז"];
		const jOnes = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
	
		if (num === 0) { // do we really need this? Should it be applicable to a date?
		  return EFES;
		}
		const shortNumber = num % 1000; // discard thousands
		// next check for all possible single Hebrew digit years
		const singleDigitNumber = (shortNumber < 11 || (shortNumber < 100 && shortNumber % 10 === 0) || (shortNumber <= 400 && shortNumber % 100 === 0));
		const thousands = Math.trunc(num / 1000); // get # thousands
		let sb = '';
		// append thousands to String
		if (num % 1000 === 0) { // in year is 5000, 4000 etc
		  sb = sb.concat(jOnes[thousands]);
		  if (this.gershGershayim) {
			sb = sb.concat(HebrewNumberFormatter.GERESH);
		  }
		  sb = sb.concat(' ');
		  sb = sb.concat(ALAFIM); // add # of thousands plus word thousand (overide alafim boolean)
		  return sb;
		} else if (this.useLonghebrewYears && num >= 1000) { // if alafim boolean display thousands
		  sb = sb.concat(jOnes[thousands]);
		  if (this.gershGershayim) {
			sb = sb.concat(HebrewNumberFormatter.GERESH); // append thousands quote
		  }
		  sb = sb.concat(' ');
		}
		num = num % 1000; // remove 1000s
		const hundreds = Math.trunc(num / 100); // # of hundreds
		sb = sb.concat(jHundreds[hundreds]); // add hundreds to String
		num = num % 100; // remove 100s
		if (num === 15) { // special case 15
		  sb = sb.concat(tavTaz[0]);
		} else if (num === 16) { // special case 16
		  sb = sb.concat(tavTaz[1]);
		} else {
		  const tens = Math.trunc(num / 10);
		  if (num % 10 === 0) { // if evenly divisable by 10
			if (!singleDigitNumber) {
			  if (this.finalFormLetters) {
				sb = sb.concat(jTenEnds[tens]); // years like 5780 will end with a final form &#x05E3;
			  } else {
				sb = sb.concat(jTens[tens]); // years like 5780 will end with a regular &#x05E4;
			  }
			} else {
			  sb = sb.concat(jTens[tens]); // standard letters so years like 5050 will end with a regular nun
			}
		  } else {
			sb = sb.concat(jTens[tens]);
			num = num % 10;
			sb = sb.concat(jOnes[num]);
		  }
		}
		if (this.gershGershayim) {
		  if (singleDigitNumber) {
			sb = sb.concat(HebrewNumberFormatter.GERESH); // append single quote
		  } else { // append double quote before last digit
			sb = sb.substr(0, sb.length - 1)
			  .concat(HebrewNumberFormatter.GERSHAYIM)
			  .concat(sb.substr(sb.length - 1, 1));
		  }
		}
		return sb;
	}
}

/**
 * @param {KosherZmanim.Temporal.ZonedDateTime} start
 * @param {KosherZmanim.Temporal.ZonedDateTime} middle
 * @param {KosherZmanim.Temporal.ZonedDateTime} end
 */
function rangeDates(start, middle, end, inclusive=true) {
	const acceptedValues = [1];
	if (inclusive)
		acceptedValues.push(0);

	return acceptedValues.includes(KosherZmanim.Temporal.ZonedDateTime.compare(middle, start)) && acceptedValues.includes(KosherZmanim.Temporal.ZonedDateTime.compare(end, middle))
};