// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import n2words from "../libraries/n2words.js";

export default
class WebsiteCalendar extends KosherZmanim.JewishCalendar {
	static hebrewParshaMap = {
		[KosherZmanim.Parsha.NONE]: '',
		[KosherZmanim.Parsha.BERESHIS]: '\u05D1\u05E8\u05D0\u05E9\u05D9\u05EA',
		[KosherZmanim.Parsha.NOACH]: '\u05E0\u05D7',
		[KosherZmanim.Parsha.LECH_LECHA]: '\u05DC\u05DA \u05DC\u05DA',
		[KosherZmanim.Parsha.VAYERA]: '\u05D5\u05D9\u05E8\u05D0',
		[KosherZmanim.Parsha.CHAYEI_SARA]: '\u05D7\u05D9\u05D9 \u05E9\u05E8\u05D4',
		[KosherZmanim.Parsha.TOLDOS]: '\u05EA\u05D5\u05DC\u05D3\u05D5\u05EA',
		[KosherZmanim.Parsha.VAYETZEI]: '\u05D5\u05D9\u05E6\u05D0',
		[KosherZmanim.Parsha.VAYISHLACH]: '\u05D5\u05D9\u05E9\u05DC\u05D7',
		[KosherZmanim.Parsha.VAYESHEV]: '\u05D5\u05D9\u05E9\u05D1',
		[KosherZmanim.Parsha.MIKETZ]: '\u05DE\u05E7\u05E5',
		[KosherZmanim.Parsha.VAYIGASH]: '\u05D5\u05D9\u05D2\u05E9',
		[KosherZmanim.Parsha.VAYECHI]: '\u05D5\u05D9\u05D7\u05D9',
		[KosherZmanim.Parsha.SHEMOS]: '\u05E9\u05DE\u05D5\u05EA',
		[KosherZmanim.Parsha.VAERA]: '\u05D5\u05D0\u05E8\u05D0',
		[KosherZmanim.Parsha.BO]: '\u05D1\u05D0',
		[KosherZmanim.Parsha.BESHALACH]: '\u05D1\u05E9\u05DC\u05D7',
		[KosherZmanim.Parsha.YISRO]: '\u05D9\u05EA\u05E8\u05D5',
		[KosherZmanim.Parsha.MISHPATIM]: '\u05DE\u05E9\u05E4\u05D8\u05D9\u05DD',
		[KosherZmanim.Parsha.TERUMAH]: '\u05EA\u05E8\u05D5\u05DE\u05D4',
		[KosherZmanim.Parsha.TETZAVEH]: '\u05EA\u05E6\u05D5\u05D4',
		[KosherZmanim.Parsha.KI_SISA]: '\u05DB\u05D9 \u05EA\u05E9\u05D0',
		[KosherZmanim.Parsha.VAYAKHEL]: '\u05D5\u05D9\u05E7\u05D4\u05DC',
		[KosherZmanim.Parsha.PEKUDEI]: '\u05E4\u05E7\u05D5\u05D3\u05D9',
		[KosherZmanim.Parsha.VAYIKRA]: '\u05D5\u05D9\u05E7\u05E8\u05D0',
		[KosherZmanim.Parsha.TZAV]: '\u05E6\u05D5',
		[KosherZmanim.Parsha.SHMINI]: '\u05E9\u05DE\u05D9\u05E0\u05D9',
		[KosherZmanim.Parsha.TAZRIA]: '\u05EA\u05D6\u05E8\u05D9\u05E2',
		[KosherZmanim.Parsha.METZORA]: '\u05DE\u05E6\u05E8\u05E2',
		[KosherZmanim.Parsha.ACHREI_MOS]: '\u05D0\u05D7\u05E8\u05D9 \u05DE\u05D5\u05EA',
		[KosherZmanim.Parsha.KEDOSHIM]: '\u05E7\u05D3\u05D5\u05E9\u05D9\u05DD',
		[KosherZmanim.Parsha.EMOR]: '\u05D0\u05DE\u05D5\u05E8',
		[KosherZmanim.Parsha.BEHAR]: '\u05D1\u05D4\u05E8',
		[KosherZmanim.Parsha.BECHUKOSAI]: '\u05D1\u05D7\u05E7\u05EA\u05D9',
		[KosherZmanim.Parsha.BAMIDBAR]: '\u05D1\u05DE\u05D3\u05D1\u05E8',
		[KosherZmanim.Parsha.NASSO]: '\u05E0\u05E9\u05D0',
		[KosherZmanim.Parsha.BEHAALOSCHA]: '\u05D1\u05D4\u05E2\u05DC\u05EA\u05DA',
		[KosherZmanim.Parsha.SHLACH]: '\u05E9\u05DC\u05D7 \u05DC\u05DA',
		[KosherZmanim.Parsha.KORACH]: '\u05E7\u05E8\u05D7',
		[KosherZmanim.Parsha.CHUKAS]: '\u05D7\u05D5\u05E7\u05EA',
		[KosherZmanim.Parsha.BALAK]: '\u05D1\u05DC\u05E7',
		[KosherZmanim.Parsha.PINCHAS]: '\u05E4\u05D9\u05E0\u05D7\u05E1',
		[KosherZmanim.Parsha.MATOS]: '\u05DE\u05D8\u05D5\u05EA',
		[KosherZmanim.Parsha.MASEI]: '\u05DE\u05E1\u05E2\u05D9',
		[KosherZmanim.Parsha.DEVARIM]: '\u05D3\u05D1\u05E8\u05D9\u05DD',
		[KosherZmanim.Parsha.VAESCHANAN]: '\u05D5\u05D0\u05EA\u05D7\u05E0\u05DF',
		[KosherZmanim.Parsha.EIKEV]: '\u05E2\u05E7\u05D1',
		[KosherZmanim.Parsha.REEH]: '\u05E8\u05D0\u05D4',
		[KosherZmanim.Parsha.SHOFTIM]: '\u05E9\u05D5\u05E4\u05D8\u05D9\u05DD',
		[KosherZmanim.Parsha.KI_SEITZEI]: '\u05DB\u05D9 \u05EA\u05E6\u05D0',
		[KosherZmanim.Parsha.KI_SAVO]: '\u05DB\u05D9 \u05EA\u05D1\u05D5\u05D0',
		[KosherZmanim.Parsha.NITZAVIM]: '\u05E0\u05E6\u05D1\u05D9\u05DD',
		[KosherZmanim.Parsha.VAYEILECH]: '\u05D5\u05D9\u05DC\u05DA',
		[KosherZmanim.Parsha.HAAZINU]: '\u05D4\u05D0\u05D6\u05D9\u05E0\u05D5',
		[KosherZmanim.Parsha.VZOS_HABERACHA]: '\u05D5\u05D6\u05D0\u05EA \u05D4\u05D1\u05E8\u05DB\u05D4 ',
		[KosherZmanim.Parsha.VAYAKHEL_PEKUDEI]: '\u05D5\u05D9\u05E7\u05D4\u05DC \u05E4\u05E7\u05D5\u05D3\u05D9',
		[KosherZmanim.Parsha.TAZRIA_METZORA]: '\u05EA\u05D6\u05E8\u05D9\u05E2 \u05DE\u05E6\u05E8\u05E2',
		[KosherZmanim.Parsha.ACHREI_MOS_KEDOSHIM]: '\u05D0\u05D7\u05E8\u05D9 \u05DE\u05D5\u05EA \u05E7\u05D3\u05D5\u05E9\u05D9\u05DD',
		[KosherZmanim.Parsha.BEHAR_BECHUKOSAI]: '\u05D1\u05D4\u05E8 \u05D1\u05D7\u05E7\u05EA\u05D9',
		[KosherZmanim.Parsha.CHUKAS_BALAK]: '\u05D7\u05D5\u05E7\u05EA \u05D1\u05DC\u05E7',
		[KosherZmanim.Parsha.MATOS_MASEI]: '\u05DE\u05D8\u05D5\u05EA \u05DE\u05E1\u05E2\u05D9',
		[KosherZmanim.Parsha.NITZAVIM_VAYEILECH]: '\u05E0\u05E6\u05D1\u05D9\u05DD \u05D5\u05D9\u05DC\u05DA',
		[KosherZmanim.Parsha.SHKALIM]: '\u05E9\u05E7\u05DC\u05D9\u05DD',
		[KosherZmanim.Parsha.ZACHOR]: '\u05D6\u05DB\u05D5\u05E8',
		[KosherZmanim.Parsha.PARA]: '\u05E4\u05E8\u05D4',
		[KosherZmanim.Parsha.HACHODESH]: '\u05D4\u05D7\u05D3\u05E9',
		[KosherZmanim.Parsha.SHUVA]: '\u05E9\u05D5\u05D1\u05D4',
		[KosherZmanim.Parsha.SHIRA]: '\u05E9\u05D9\u05E8\u05D4',
		[KosherZmanim.Parsha.HAGADOL]: '\u05D4\u05D2\u05D3\u05D5\u05DC',
		[KosherZmanim.Parsha.CHAZON]: '\u05D7\u05D6\u05D5\u05DF',
		[KosherZmanim.Parsha.NACHAMU]: '\u05E0\u05D7\u05DE\u05D5',
	  };

	formatJewishFullDate() {
		const hNum = new HebrewNumberFormatter();
		return {
			english: (new Intl.DateTimeFormat('en-u-ca-hebrew', {month: 'long', year: "numeric", day: "numeric"})).format(this.getDate().toJSDate()),
			hebrew: [
				hNum.formatHebrewNumber(this.getJewishDayOfMonth()),
				new Intl.DateTimeFormat('he-u-ca-hebrew', {month: 'long'}).format(this.getDate().toJSDate()) + ',',
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

	getDayOfTheWeek() {
		let dayOfWeek = this.getDate().weekday
		if (dayOfWeek == 7)
			dayOfWeek = 0;

		return {
			english: daysForLocale('en')[dayOfWeek],
			hebrew: daysForLocale('he-u-ca-hebrew')[dayOfWeek]
		}
	}

	tomorrow() {
		const nextJewishCalendar = new WebsiteCalendar(this.getDate());
		nextJewishCalendar.setDate(nextJewishCalendar.getDate().plus({ day: 1 }))
		if (this.isUseModernHolidays())
			nextJewishCalendar.setUseModernHolidays(true);

		return nextJewishCalendar
	}

	shabbat() {
		const nextJewishCalendar = new WebsiteCalendar(this.getDate());
		if (this.isUseModernHolidays())
			nextJewishCalendar.setUseModernHolidays(true);

		nextJewishCalendar.setDate(nextJewishCalendar.getDate().set({ weekday: 6 }))

		return nextJewishCalendar
	}

	isTaanitBechorot() {
		return (
			this.getJewishMonth() === KosherZmanim.JewishDate.NISSAN &&
			((this.getJewishDayOfMonth() === 14 && this.getDayOfWeek() !== 7) ||
			 (this.getJewishDayOfMonth() === 12 && this.getDayOfWeek() === 5))
		);
	}

	getYomTov() {
		const yomTovObj = {
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
			[KosherZmanim.JewishCalendar.YOM_KIPPUR]: {
				"hebrew": "יום קיפור",
				"english": "Yom Kippur",
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
		
			// Semi-Holidays & Fasts
			[KosherZmanim.JewishCalendar.PESACH_SHENI]: {
				"hebrew": "פסח שני",
				"english": "Pesach Sheni"
			},
			[KosherZmanim.JewishCalendar.LAG_BAOMER]: {
				"hebrew": "לג בעומר",
				"english": "Lag Baomer"
			},
			[KosherZmanim.JewishCalendar.SEVENTEEN_OF_TAMMUZ]: {
				"hebrew": "צום הרביעי",
				"english": "Fast of the 4<sup>th</sup> month"
			},
			[KosherZmanim.JewishCalendar.TISHA_BEAV]: {
				"hebrew": "צום החמישי",
				"english": "Fast of the 5<sup>th</sup> month"
			},
			[KosherZmanim.JewishCalendar.TU_BEAV]: {
				"hebrew": 'ט"ו באב',
				"english": "Tu Be'av"
			},
			[KosherZmanim.JewishCalendar.FAST_OF_GEDALYAH]: {
				"hebrew": 'צום גדליע (השבעי)',
				"english-translated": "Tzom Gedalia (7<sup>th</sup> month)",
				"english": "Fast of the 5<sup>th</sup> month"
			},
			[KosherZmanim.JewishCalendar.TENTH_OF_TEVES]: {
				"hebrew": 'צום העשירי',
				"english": "Fast of the 10<sup>th</sup> month"
			},
			[KosherZmanim.JewishCalendar.TU_BESHVAT]: {
				"hebrew": 'ט"ו בשבת',
				"english": "Tu Bishvath"
			},
			[KosherZmanim.JewishCalendar.PURIM_KATAN]: {
				"hebrew": "פורים קתן",
				"english": "Purim Katan",
			},
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN]: {
				"hebrew": "שושן פורים קתן",
				"english": "Shushan Purim Katan"
			},
			[KosherZmanim.JewishCalendar.FAST_OF_ESTHER]: {
				"hebrew": "תענית אסתר",
				"english-translated": "Ta'anith Ester",
				"english": "Fast of Ester"
			},
			[KosherZmanim.JewishCalendar.PURIM]: {
				"hebrew": "פורים",
				"english": "Purim",
			},
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM]: {
				"hebrew": "שושן פורים",
				"english": "Shushan Purim"
			},
		
			[KosherZmanim.JewishCalendar.ROSH_CHODESH]: {
				"hebrew": "ראש חודש",
				english: "Rosh Hodesh"
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
		}
		if (!yomTovObj[this.getYomTovIndex()])
			return null;

		return yomTovObj[this.getYomTovIndex()]["english-translated"] || yomTovObj[this.getYomTovIndex()]["english"];
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

		if (this.isTaanitBechorot())
			result.push("Ta'anit Bechorot");
		else if (this.tomorrow().isTaanitBechorot())
			result.push("Erev Ta'anit Bechorot")

		const dateFormatter = (new Intl.DateTimeFormat('en-u-ca-hebrew', { month: "long" }))
		if (this.isRoshChodesh())
			result.push("Rosh Hodesh " + dateFormatter.format(this.getDate().toJSDate()))
		else if (this.tomorrow().isRoshChodesh())
			result.push("Erev Rosh Hodesh " + dateFormatter.format(this.getDate().toJSDate()))

		const dayOfChanukah = this.getDayOfChanukah();
		if (dayOfChanukah != -1) {
			result.push(getOrdinal(dayOfChanukah) + " day of Hanukah");
		}
		return result;
	}

	getOmerInfo() {
		const weeks = Math.floor(this.getDayOfOmer() / 7);
		const days = this.getDayOfOmer() % 7;

		// Hebrew Attributes
		const hbName = n2words(this.getDayOfOmer());

		const dayWords = ["יום", "ימים"]
		const verb = dayWords[(this.getDayOfOmer() >= 2 && this.getDayOfOmer() <= 10 ? 1 : 0)];

		const hbTitle = [hbName, verb];
		if (this.getDayOfOmer() == 1)
			hbTitle.reverse()

		const weeksCount = [n2words(weeks), "שבוע" + (weeks >= 2 ? "ות" : "")]
		if (weeks == 1)
			weeksCount.reverse()

		const dayCount = [n2words(days), dayWords[days == 1 ? 0 : 1]]
		if (days == 1)
			dayCount.reverse()

		return {
			info: {
				days,
				weeks
			},
			title: {
				en: {
					mainCount: getOrdinal(super.getDayOfOmer()) + "day",
					subCount: {
						days: getOrdinal(days) + " day",
						weeks: getOrdinal(weeks) + " week",
						toString: function () { return (!weeks ? "" :[this.weeks].concat(days ? [this.days] : []).join(" • ")); }
					}
				},
				et: {
					mainCount: this.getDayOfOmer() + " day" + (this.getDayOfOmer() >= 2 ? "s" : ''),
					subCount: {
						days: (days == 1 ? "a day" : days + " days"),
						weeks: (weeks == 1 ? "is a week" : "are " + weeks + " weeks"),
						toString: function () { return (!weeks ? "" : [this.weeks].concat(days ? [this.days] : []).join(" and ")) }
					}
				},
				hb: {
					mainCount: hbTitle.join(),
					subCount: {
						days: dayCount.join(" "),
						weeks: weeksCount.join(" "),
						toString: function () { return (!weeks ? "" : [this.weeks].concat(days ? [this.days] : []).join(" ו")) }
					}
				}
			}
		}
	}

	getHebrewParasha() {
		return [
			WebsiteCalendar.hebrewParshaMap[this.shabbat().getParshah()] || "No Parasha this week",
			WebsiteCalendar.hebrewParshaMap[this.shabbat().getSpecialShabbos()]
		].filter(Boolean)
	}

	tefilahRules(checkErevTachanun=true) {
		const yomTovIndex = this.getYomTovIndex();

		const mashivHarush = {
			start: new KosherZmanim.JewishDate(this.getJewishYear(), KosherZmanim.JewishDate.TISHREI, 22),
			end: new KosherZmanim.JewishDate(this.getJewishYear(), KosherZmanim.JewishDate.NISSAN, 15)
		}

		const normalAmidah = !(this.getDayOfWeek() == 7 || [
			KosherZmanim.JewishCalendar.SHAVUOS,
			KosherZmanim.JewishCalendar.PESACH,
			KosherZmanim.JewishCalendar.SUCCOS,
			KosherZmanim.JewishCalendar.SHEMINI_ATZERES,
			KosherZmanim.JewishCalendar.SIMCHAS_TORAH,
			KosherZmanim.JewishCalendar.ROSH_HASHANA,
			KosherZmanim.JewishCalendar.YOM_KIPPUR
		].includes(yomTovIndex));

		const ulChaparatPesha = (this.isJewishLeapYear()
			&& [
				KosherZmanim.JewishDate.CHESHVAN,
				KosherZmanim.JewishDate.KISLEV,
				KosherZmanim.JewishDate.TEVES,
				KosherZmanim.JewishDate.SHEVAT,
				KosherZmanim.JewishDate.ADAR,
				KosherZmanim.JewishDate.ADAR_II
			].includes(this.getJewishMonth())
		);

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
				"mechayehHametim": (this.isInBetween(mashivHarush.start, mashivHarush.end) ? "משיב הרוח" : "מוריד הטל"),
				"mevarechHashanim": (!normalAmidah ? null :
					(this.isBarechAleinu() ? "ברך עלינו" : "ברכנו")),
				"ulChaparatPesha": (!this.isRoshChodesh() ? null : ulChaparatPesha)
			}
		}

		if (checkErevTachanun && !todaysTachanun) {
			tefilahRuleObj.tachanun = Number(this.tomorrow().tefilahRules(false).tachanun && this.tomorrow().getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM)
		}

		return tefilahRuleObj;
	}

	getTekufa() {
		var INITIAL_TEKUFA_OFFSET = 12.625; // the number of days Tekufas Tishrei occurs before JEWISH_EPOCH
		const jewishDate = new KosherZmanim.JewishDate(this.getJewishYear(), this.getJewishMonth(), this.getJewishDayOfMonth());
	
		var days =
			KosherZmanim.JewishDate.getJewishCalendarElapsedDays(this.getJewishYear()) +
			jewishDate.getDaysSinceStartOfJewishYear() +
			INITIAL_TEKUFA_OFFSET -
			1; // total days since first Tekufas Tishrei event
	
		var solarDaysElapsed = days % 365.25; // total days elapsed since start of solar year
		var tekufaDaysElapsed = solarDaysElapsed % 91.3125; // the number of days that have passed since a tekufa event
		if (tekufaDaysElapsed > 0 && tekufaDaysElapsed <= 1) {
			// if the tekufa happens in the upcoming 24 hours
			return ((1.0 - tekufaDaysElapsed) * 24.0) % 24; // rationalize the tekufa event to number of hours since start of jewish day
		} else {
			return null;
		}
	}

    /**
     * @param {number} tekufaID
     */
    getTekufaName(tekufaID) {
        const tekufaMonths = [6,9,0,3];
        const jewishDate = new KosherZmanim.JewishDate();

        const tekufaName = {
			// @ts-ignore
            english: [],
			// @ts-ignore
            hebrew: []
        };

		const dateFormatterEn = new Intl.DateTimeFormat('en-u-ca-hebrew', { month: "long" })
		const dateFormatterHb = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: "long" })
		tekufaMonths.forEach(month => {
			jewishDate.setJewishMonth(month + 1)
			tekufaName.english.push(dateFormatterEn.format(jewishDate.getDate().toJSDate()))
			tekufaName.hebrew.push(dateFormatterHb.format(jewishDate.getDate().toJSDate()))
		})

        return Object.fromEntries(
            Object.entries(tekufaName)
                .map(([key, array]) => [key, array[tekufaID]])
        )
    }

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getTekufaAsDate(amudehHoraah) {
		const hours = Math.trunc(this.getTekufa() - 6);
		let minutes = Math.floor((hours - Math.floor(hours)) * 60);

		if (amudehHoraah)
			minutes -= 21;

		const date = window.luxon.DateTime.fromObject({
			year: this.getGregorianYear(),
			month: this.getGregorianMonth() + 1,
			day: this.getGregorianDayOfMonth(),
			hour: 0,
			minute: 0,
			second: 0,
			millisecond: 0,
		},
			{ zone: "UTC+2" }
		).plus({ hours: hours, minutes: minutes });
		return date;
	}

	getTekufaID() {
		const INITIAL_TEKUFA_OFFSET = 12.625; // the number of days Tekufas Tishrei occurs before JEWISH_EPOCH

		const jewishDate = new KosherZmanim.JewishDate(this.getJewishYear(), this.getJewishMonth(), this.getJewishDayOfMonth());
		var days =
			KosherZmanim.JewishDate.getJewishCalendarElapsedDays(this.getJewishYear()) +
			jewishDate.getDaysSinceStartOfJewishYear() +
			INITIAL_TEKUFA_OFFSET -
			1; // total days since first Tekufas Tishrei event

		var solarDaysElapsed = days % 365.25; // total days elapsed since start of solar year
		var currentTekufaNumber = Math.floor(solarDaysElapsed / 91.3125); // the number of days that have passed since a tekufa event
		var tekufaDaysElapsed = solarDaysElapsed % 91.3125; // the number of days that have passed since a tekufa event
		return ((tekufaDaysElapsed > 0 && tekufaDaysElapsed <= 1) ? currentTekufaNumber : null); //0 for Tishrei, 1 for Tevet, 2, for Nissan, 3 for Tammuz
	}

	isBarechAleinu() {
		if (
			this.getJewishMonth() === KosherZmanim.JewishDate.NISSAN &&
			this.getJewishDayOfMonth() < 15
		) {
			return true;
		}
		if (this.getJewishMonth() < KosherZmanim.JewishDate.CHESHVAN) {
			return false;
		}
		if (this.getInIsrael()) {
			return (
				this.getJewishMonth() !==
				KosherZmanim.JewishDate.CHESHVAN ||
				this.getJewishDayOfMonth() >= 7
			);
		} else {
			const jewishDate = new KosherZmanim.JewishDate(this.getJewishYear(), this.getJewishMonth(), this.getJewishDayOfMonth());
			var tekufatTishriElapsedDays =
				KosherZmanim.JewishDate.getJewishCalendarElapsedDays(this.getJewishYear()) +
				(jewishDate.getDaysSinceStartOfJewishYear() - 1) + 0.5;
			var solar = (this.getJewishYear() - 1) * 365.25;
			tekufatTishriElapsedDays = Math.floor(tekufatTishriElapsedDays - solar);
	
			return tekufatTishriElapsedDays >= 47;
		}
	}

	isShvuaShechalBo() {
		//shevua shechal bo happens on the whole week that tisha beav falls out on
		if (this.getJewishMonth() !== KosherZmanim.JewishDate.AV)
			return false;
		
		const currentDate = this.getDate();
		this.setJewishDayOfMonth(9);//set to the 9th of Av
		if (this.getDayOfWeek() == 1 || this.getDayOfWeek() == 7) {
			return false;//there is no shevua shechal bo if tisha beav falls out on a sunday or shabbat
		}
		this.setDate(currentDate);//reset the date

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
		const validAv = (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 8);

		return validAv || validTamuz || validSefira
	}

	/**
	 * @param {KosherZmanim.JewishDate} startDate
	 * @param {KosherZmanim.JewishDate} endDate
	 */
	isInBetween(startDate, endDate) {
		return (this.compareTo(startDate) > 0 && this.compareTo(endDate) < 0);
	}

	/*
	* If an attribute returns true, that means the mourning customs are in effect
	*/
	mourningHalachot() {
		const validAv = this.getJewishMonth() == KosherZmanim.JewishDate.AV
					 && this.getJewishDayOfMonth() >= 2
					 && this.getJewishDayOfMonth() <= 8;

		const threeWeeks = validAv || (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17);
		const validOmer = (this.getDayOfOmer() <= 34 && this.getDayOfOmer() !== -1)

		const allDaysOfMourning = validOmer || threeWeeks;
		const noHolHamoed = (this.getDayOfOmer() >= 8 && this.getDayOfOmer() <= 32) || threeWeeks;

		return {
			music: noHolHamoed,
			haircuts: validOmer || this.isShvuaShechalBo(),
			wedding: validOmer || validAv,
			purchaseClothing: validOmer || validAv,
			swimming: this.isShvuaShechalBo(),
			construction: this.isShvuaShechalBo(),
			meat: validAv && this.getDayOfWeek() !== 7,
			showering: this.isShvuaShechalBo(),
			laundry: this.isShvuaShechalBo(),
			wearingClothing: validAv,
			shechiyanu: threeWeeks && (this.getDayOfWeek() !== 7 || (this.getDayOfWeek() == 7 && !validAv))
		}
	}
}

function getOrdinal (/** @type {number} */ n) {
	return n.toString() + { e: "st", o: "nd", w: "rd", h: "th" }[new Intl.PluralRules("en", { type: "ordinal" }).select(n)[2]]
}

/**
 * @param {string | string[]} localeName
 * @param {"short" | "long" | "narrow"} [weekday] 
 */
function daysForLocale(localeName, weekday = 'long') {
	const {format} = new Intl.DateTimeFormat(localeName, { weekday });
	return [...Array(7).keys()]
	  .map((day) => format(new Date(Date.UTC(2021, 5, day))));
}

class HebrewNumberFormatter {
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
	
		const ALAFIM = '\u05D0\u05DC\u05E4\u05D9\u05DD';
		const EFES = '\u05D0\u05E4\u05E1';
	
		const jHundreds = ['', '\u05E7', '\u05E8', '\u05E9', '\u05EA', '\u05EA\u05E7', '\u05EA\u05E8',
		  '\u05EA\u05E9', '\u05EA\u05EA', '\u05EA\u05EA\u05E7'];
		const jTens = ['', '\u05D9', '\u05DB', '\u05DC', '\u05DE', '\u05E0', '\u05E1', '\u05E2',
		  '\u05E4', '\u05E6'];
		const jTenEnds = ['', '\u05D9', '\u05DA', '\u05DC', '\u05DD', '\u05DF', '\u05E1', '\u05E2',
		  '\u05E3', '\u05E5'];
		const tavTaz = ['\u05D8\u05D5', '\u05D8\u05D6'];
		const jOnes = ['', '\u05D0', '\u05D1', '\u05D2', '\u05D3', '\u05D4', '\u05D5', '\u05D6',
		  '\u05D7', '\u05D8'];
	
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