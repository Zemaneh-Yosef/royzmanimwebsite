// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
import n2words from "../libraries/n2words.js";

export default
class WebsiteCalendar extends KosherZmanim.JewishCalendar {
    setUpDateFormatter() {
        this.dateFormatter = {
            english: new KosherZmanim.HebrewDateFormatter(),
            hebrew: new KosherZmanim.HebrewDateFormatter()
        }

        this.dateFormatter.hebrew.setHebrewFormat(true);
        this.dateFormatter.english.setTransliteratedMonthList(["Nissan", "Iyar", "Sivan", "Tamuz", "Av", "Elul", "Tishri", "Heshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II", "Adar I"])
    }

	formatJewishDate() {
		return {
			english: this.dateFormatter.english.format(this),
			hebrew: this.dateFormatter.hebrew.format(this)
		}
	}

	getDayOfTheWeek() {
		return {
			english: this.getDate().toJSDate().toLocaleDateString("en-US", { weekday: "long" }),
			hebrew: "יום " + this.dateFormatter.hebrew.formatDayOfWeek(this)
		}
	}

	tomorrow() {
		const currentDate = this.getDate().toJSDate()
		const followingDate = new Date(currentDate)
		followingDate.setDate(currentDate.getDate() + 1);

		const nextJewishCalendar = new WebsiteCalendar(followingDate);
        this.setUpDateFormatter();
		if (this.isUseModernHolidays())
			nextJewishCalendar.setUseModernHolidays(true);

		return nextJewishCalendar
	}

	shabbat() {
		const currentDate = this.getDate().toJSDate()
		const shabbatDate = new Date(currentDate)
		shabbatDate.setDate(currentDate.getDate() + ((6 + (7 - currentDate.getDay())) % 7));

		const shabbatJewishCalendar = new WebsiteCalendar(shabbatDate);
		if (this.isUseModernHolidays())
			shabbatJewishCalendar.setUseModernHolidays(true);

		return shabbatJewishCalendar
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

		if (this.isRoshChodesh())
			result.push(this.dateFormatter.english.formatRoshChodesh(this))
		else if (this.tomorrow().isRoshChodesh())
			result.push("Erev " + this.dateFormatter.english.formatRoshChodesh(this.tomorrow()))

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
			this.dateFormatter.hebrew.formatParsha(this.shabbat()) || "No Parasha this week",
			this.dateFormatter.hebrew.formatSpecialParsha(this.shabbat())
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
		if (!this.dateFormatter)
			this.setUpDateFormatter();

        const tekufaMonths = [6,9,0,3];
        const jewishDate = new KosherZmanim.JewishDate();

        const tekufaName = {
            english: [...tekufaMonths].map(month => this.dateFormatter.english.getTransliteratedMonthList()[month]),
            hebrew: [...tekufaMonths].map(month => {
                jewishDate.setJewishMonth(month + 1);
                return this.dateFormatter.hebrew.formatMonth(jewishDate)
            })
        }

        return Object.fromEntries(
            Object.entries(tekufaName)
                .map(([key, array]) => [key, array[tekufaID]])
        )
    }

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getTekufaAsDate(amudehHoraah) {
		const hours = this.getTekufa() - 6;
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
		).plus({ hours: hours, minutes: minutes }).minus({minute: 30});
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