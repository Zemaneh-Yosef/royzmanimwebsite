// @ts-check

/*
import * as KosherZmanim from "./libraries/kosherzmanim/kosher-zmanim.js"
import luxon from "./libraries/luxon/index.js";
import { n2words } from "./libraries/n2words";
export default
// */

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
			((this.getJewishDayOfMonth() === 14 &&
				this.getDayOfWeek() !== 7) ||
				(this.getJewishDayOfMonth() === 12 &&
					this.getDayOfWeek() === 5))
		);
	}

	getYomTov() {
		const yomTovObj = Object.fromEntries([
			// Holidays
			[KosherZmanim.JewishCalendar.PESACH, "Pesach"],
			[KosherZmanim.JewishCalendar.CHOL_HAMOED_PESACH, "Chol HaMoed Pesach"],
			[KosherZmanim.JewishCalendar.SHAVUOS, "Shavuoth"],
			[KosherZmanim.JewishCalendar.ROSH_HASHANA, "Rosh Hashana"],
			[KosherZmanim.JewishCalendar.YOM_KIPPUR, "Yom Kippur"],
			[KosherZmanim.JewishCalendar.SUCCOS, "Sukkoth"],
			[KosherZmanim.JewishCalendar.CHOL_HAMOED_SUCCOS, "Hol HaMoed Sukkoth"],
			[KosherZmanim.JewishCalendar.HOSHANA_RABBA, "7th day of Sukkoth (Hoshana Rabba)"],
		
			// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
			// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
			[KosherZmanim.JewishCalendar.SHEMINI_ATZERES, "Shemini Atzereth" + (this.getInIsrael() ? " & Simchath Torah" : "")],
			[KosherZmanim.JewishCalendar.SIMCHAS_TORAH, (this.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah"],
		
			// Semi-Holidays & Fasts
			[KosherZmanim.JewishCalendar.PESACH_SHENI, "Pesach Sheni"],
			[KosherZmanim.JewishCalendar.LAG_BAOMER, "Lag B'Omer"],
			[KosherZmanim.JewishCalendar.SEVENTEEN_OF_TAMMUZ, "17<sup>th</sup> of Tammuz Fast"],
			[KosherZmanim.JewishCalendar.TISHA_BEAV, "Tisha Be'Av"],
			[KosherZmanim.JewishCalendar.TU_BEAV, "Tu Be'Av"],
			[KosherZmanim.JewishCalendar.FAST_OF_GEDALYAH, "Tzom Gedalya"],
			[KosherZmanim.JewishCalendar.TENTH_OF_TEVES, "Fast of Asarah Be'Tevet"],
			[KosherZmanim.JewishCalendar.TU_BESHVAT, "Tu Be'Shevat"],
			[KosherZmanim.JewishCalendar.PURIM_KATAN, "Purim Katan"],
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN, "Shushan Purim Katan"],
			[KosherZmanim.JewishCalendar.FAST_OF_ESTHER, "Ta'anith Ester"],
			[KosherZmanim.JewishCalendar.PURIM, "Purim"],
			[KosherZmanim.JewishCalendar.SHUSHAN_PURIM, "Shushan Purim"],
		
			[KosherZmanim.JewishCalendar.ROSH_CHODESH, "Rosh Hodesh"],
		
			// Modern-Day Celebrations
			[KosherZmanim.JewishCalendar.YOM_HASHOAH, "Yom Hashoah"],
			[KosherZmanim.JewishCalendar.YOM_HAZIKARON, "Yom Hazikaron"],
			[KosherZmanim.JewishCalendar.YOM_HAATZMAUT, "Yom Haatzmauth"], // Tachanun is said
			[KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM, "Yom Yerushalayim"],
		]);
		return yomTovObj[this.getYomTovIndex()];
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

	getTitleDayOfOmer() {
		return getOrdinal(super.getDayOfOmer())
	}

	getHebrewParasha() {
		return [
			this.dateFormatter.hebrew.formatParsha(this.shabbat()) || "No Parasha this week",
			this.dateFormatter.hebrew.formatSpecialParsha(this.shabbat())
		].filter(Boolean)
	}

	getUlchaparatPesha() {
		if (!this.isRoshChodesh())
			throw new Error("Call to 'getUlchaparatPesha()' function without being Rosh Hodesh");
	
		return (this.isJewishLeapYear()
			&& [
				KosherZmanim.JewishDate.CHESHVAN,
				KosherZmanim.JewishDate.KISLEV,
				KosherZmanim.JewishDate.TEVES,
				KosherZmanim.JewishDate.SHEVAT,
				KosherZmanim.JewishDate.ADAR,
				KosherZmanim.JewishDate.ADAR_II
			].includes(this.getJewishMonth())
		);
	}

	getTachanun() {
		var yomTovIndex = this.getYomTovIndex();
		if (this.isRoshChodesh() ||
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
		) {
			return "There is no Tachanun today";
		}
		var yomTovIndexForNextDay = this.tomorrow().getYomTovIndex();
		if (this.getDayOfWeek() == 6 ||
			yomTovIndex == KosherZmanim.JewishCalendar.FAST_OF_ESTHER ||
			[
				KosherZmanim.JewishCalendar.TISHA_BEAV,
				KosherZmanim.JewishCalendar.TU_BEAV,
				KosherZmanim.JewishCalendar.TU_BESHVAT,
				KosherZmanim.JewishCalendar.LAG_BAOMER,
				KosherZmanim.JewishCalendar.PESACH_SHENI,
				KosherZmanim.JewishCalendar.PURIM_KATAN
			].includes(yomTovIndexForNextDay) ||
			this.isErevRoshChodesh()
		) {
			return "There is only Tachanun in the morning";
		}
		if (this.getDayOfWeek() == 7) {
			return "צדקתך";
		}
		return "There is Tachanun today";
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
            english: [...tekufaMonths].map(month => this.dateFormatter.english.getTransliteratedMonthList()[month]),
            hebrew: [...tekufaMonths].map(month => {
                jewishDate.setJewishMonth(month);
                return this.dateFormatter.hebrew.formatMonth(jewishDate)
            })
        }

        return Object.fromEntries(
            Object.entries(tekufaName)
                .map(([key, array]) => [key, array[tekufaID]])
        )
    }

	getTekufaAsDate() {
		const hours = this.getTekufa() - 6;
		const minutes = Math.floor((hours - Math.floor(hours)) * 60);
		const date = luxon.DateTime.fromObject({
			year: this.getGregorianYear(),
			month: this.getGregorianMonth() + 1,
			day: this.getGregorianDayOfMonth(),
			hour: 0,
			minute: 0,
			second: 0,
			millisecond: 0,
		},
			{ zone: "Asia/Jerusalem" }
		).plus({ hours: hours, minutes: minutes });
		if (date.isInDST) {
			date.plus({ hours: -1 });
		}
		return date.toJSDate();
	}

	getHallel() {
		var yomTovIndex = this.getYomTovIndex();
		if (
			(this.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
				this.getJewishDayOfMonth() == 15) || //First day of Pesach
			(!this.getInIsrael() &&
				this.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
				this.getJewishDayOfMonth() == 16) || //First day of Pesach outside of israel
			[
				KosherZmanim.JewishCalendar.SHAVUOS,
				KosherZmanim.JewishCalendar.SUCCOS,
				KosherZmanim.JewishCalendar.SHEMINI_ATZERES
			].includes(yomTovIndex) ||
			this.isCholHamoedSuccos() ||
			this.isChanukah()
		) {
			return "הלל שלם";
		} else if (
			this.isRoshChodesh() ||
			this.isCholHamoedPesach() ||
			(this.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
				this.getJewishDayOfMonth() == 21) ||
			(!this.getInIsrael() &&
				this.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
				this.getJewishDayOfMonth() == 22)
		) {
			return "חצי הלל";
		} else {
			return false;
		}
	}

	getSeasonalPrayers() {
		var result = [];
		var startDateForMashivHaruach = new KosherZmanim.JewishDate(this.getJewishYear(), KosherZmanim.JewishDate.TISHREI, 22);
		var endDateForMashivHaruach = new KosherZmanim.JewishDate(this.getJewishYear(), KosherZmanim.JewishDate.NISSAN, 15);
		if (
			this.compareTo(startDateForMashivHaruach) > 0 &&
			this.compareTo(endDateForMashivHaruach) < 0
		) {
			result.push("משיב הרוח");
		} else {
			result.push("מוריד הטל");
		}
	
		if (this.isBarechAleinu()) {
			result.push("ברך עלינו");
		} else {
			result.push("ברכנו");
		}
		return result.join(" / ");
	}

	getTekufaID() {
		var INITIAL_TEKUFA_OFFSET = 12.625; // the number of days Tekufas Tishrei occurs before JEWISH_EPOCH

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

	isMourningPeriod() {
		const validSefira = this.getDayOfOmer() !== -1;
		const validTamuz = (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17);
		const validAv = (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 9);

		return validAv || validTamuz || validSefira
	}

	/*
	* If an attribute returns true, that means the mourning customs are in effect
	*/
	mourningHalachot() {
		return {
			music: (
				(this.getDayOfOmer() >= 8 && this.getDayOfOmer() <= 32)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 9)
			),
			haircuts: (
				(this.getDayOfOmer() <= 34)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 9)
			),
			wedding: (
				(this.getDayOfOmer() <= 34)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 9)
			),
			clothing: (
				(this.getDayOfOmer() <= 34)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17)
				|| (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 9)
			)
		}
	}

	musicPermission() {
		return !(
			(this.getDayOfOmer() >= 8 && this.getDayOfOmer() <= 32)
			|| (this.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && this.getJewishDayOfMonth() >= 17)
			|| (this.getJewishMonth() == KosherZmanim.JewishDate.AV && this.getJewishDayOfMonth() <= 9)
		);
	}
}

function getOrdinal (/** @type {number} */ n) {
	return n.toString() + { e: "st", o: "nd", w: "rd", h: "th" }[new Intl.PluralRules("en", { type: "ordinal" }).select(n)[2]]
}