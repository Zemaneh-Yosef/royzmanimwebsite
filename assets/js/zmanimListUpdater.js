// @ts-check

// Uncomment these lines when developing
// import * as KosherZmanim from "./libraries/kosherzmanim/kosher-zmanim.js"
// import luxon, { DateTime } from "./libraries/luxon/index.js";

const settings = {
	amudehHoraah: () => localStorage.getItem("amudehHoraah") == "true",
	seconds: () => localStorage.getItem("seconds") == "true",
	timeFormat: () => localStorage.getItem("timeFormat"),
	language: () => localStorage.getItem("zmanimLanguage")
}
const getOrdinal = (/** @type {number} */ n) => n.toString() + { e: "st", o: "nd", w: "rd", h: "th" }[new Intl.PluralRules("en", { type: "ordinal" }).select(n)[2]]

var jewishCalendar = new KosherZmanim.JewishCalendar();
jewishCalendar.setUseModernHolidays(true);
const dateFormatter = {
	english: new KosherZmanim.HebrewDateFormatter(),
	hebrew: new KosherZmanim.HebrewDateFormatter()
}
dateFormatter.hebrew.setHebrewFormat(true);
dateFormatter.english.setTransliteratedMonthList(["Nissan", "Iyar", "Sivan", "Tamuz", "Av", "Elul", "Tishri", "Heshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II", "Adar I"])

/**
 * @param {{ [x: string]: any; }} toCheck
 */
function getAllMethods (toCheck) {
	const props = [];
    let obj = toCheck;
    do {
        props.push(...Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));
    
    return props.sort().filter((e, i, arr) => { 
       if (e!=arr[i+1] && typeof toCheck[e] == 'function') return true;
    });
}

class ROZmanim extends KosherZmanim.ComplexZmanimCalendar {
	//custom zmanim class, RO stands for Rabbi Ovadia
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		super(geoLocation);
		this.setCandleLightingOffset(20);
		this.setUseElevation(true);
	}

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getAlos72Zmanis(amudehHoraah) {
		if (!amudehHoraah)
			return super.getAlos72Zmanis()

		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunrise = this.getSeaLevelSunrise();
		const alotBy16point1Degrees = this.getAlos16Point1Degrees();
		const numberOfMinutes = ((sunrise.toMillis() - alotBy16point1Degrees.toMillis()) / 60_000);
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;

		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunrise(), -(numberOfMinutes * dakahZmanit))
	}

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getEarliestTalitAndTefilin(amudehHoraah) {
		if (amudehHoraah) {
			const originalDate = this.getDate()
			this.setDate(new Date("March 17 " + originalDate.year.toString())); // Set the Calendar to the equinox
			const sunrise = this.getSeaLevelSunrise();
			const alotBy16point1Degrees = this.getAlos16Point1Degrees(); // 16.1 degrees is 72 minutes before sunrise in Netanya on the equinox, so no adjustment is needed
			const numberOfMinutes = ((sunrise.toMillis() - alotBy16point1Degrees.toMillis()) / 60_000);
			this.setDate(originalDate);

			const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
			const dakahZmanit = shaahZmanit / 60;

			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunrise(), -(numberOfMinutes * dakahZmanit * 5 / 6));
		} else {
			var shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
			var dakahZmanit = shaahZmanit / 60;
			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
				this.getAlos72Zmanis(),
				6 * dakahZmanit
			);
		}
	}

	//TODO Netz

	getSofZmanShmaMGA72MinutesZmanis(amudehHoraah) {
        return this.getSofZmanShma(this.getAlos72Zmanis(amudehHoraah), this.getTzais72Zmanis(amudehHoraah));
    }

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getSofZmanAchilatChametzMGA(amudehHoraah) {
		return this.getSofZmanTfila(this.getAlos72Zmanis(amudehHoraah), this.getTzais72Zmanis(amudehHoraah));
	}

	/**
	 * @param {boolean} [amudehHoraah]
	 */
	getSofZmanBiurChametzMGA(amudehHoraah) {
		var shaahZmanit = this.getTemporalHour(
			this.getAlos72Zmanis(amudehHoraah),
			this.getTzais72Zmanis(amudehHoraah)
		);
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getAlos72Zmanis(amudehHoraah),
			shaahZmanit * 5
		);
	}

	/**
	 * Workaround for passing an invalid argument
	 * {@link KosherZmanim.ComplexZmanimCalendar.getMinchaKetana}
	 */
	getMinhaKetana() {
		return this.getMinchaKetana();
	}
	/**
	 * @param {luxon.DateTime} time
	 * @param {boolean} amudehHoraah
	 */
	plagHaminchaCore(time, amudehHoraah) {
		let sunrise, sunset;
		if (amudehHoraah) {
			sunrise = this.getSeaLevelSunrise();
			sunset = this.getSeaLevelSunset();
		} else {
			sunrise = this.getElevationAdjustedSunrise();
			sunset = this.getElevationAdjustedSunset();
		}

		const shaahZmanit = this.getTemporalHour(sunrise, sunset);
		const dakahZmanit = shaahZmanit / 60;
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			time,
			-(shaahZmanit + 15 * dakahZmanit)
		);

	}

	/**
 * @param {boolean} [amudehHoraah]
 */
	getPlagHaminchaYalkutYosef(amudehHoraah) {
		return this.plagHaminchaCore(this.getTzait(amudehHoraah), amudehHoraah);
	}

	/**
 * @param {boolean} [amudehHoraah]
 */
	getPlagHaminchaHalachaBrurah(amudehHoraah) {
		return this.plagHaminchaCore(this.getSunset(), amudehHoraah);
	}

	getCandleLighting() {
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getElevationAdjustedSunset(),
			-(this.getCandleLightingOffset() * 60_000)
		);
	}

	/**
	 * @param {boolean} [degreeShaotZmaniot]
	 */
	getTzait(degreeShaotZmaniot) {
		if (degreeShaotZmaniot) {
			const originalDate = this.getDate()
			this.setDate(new Date("March 17 " + originalDate.year.toString()))
			const sunset = this.getSeaLevelSunset();
			const tzaitBy3point86degrees = this.getSunsetOffsetByDegrees(KosherZmanim.AstronomicalCalendar.GEOMETRIC_ZENITH + 3.86);
			const numberOfMinutes = ((tzaitBy3point86degrees.toMillis() - sunset.toMillis()) / 60_000);
			this.setDate(originalDate);

			const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
			const dakahZmanit = shaahZmanit / 60;

			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), numberOfMinutes * dakahZmanit);
		} else {
			const shaahZmanit = this.getTemporalHour(this.getElevationAdjustedSunrise(), this.getElevationAdjustedSunset());
			const dakahZmanit = shaahZmanit / 60;
			return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
				this.getElevationAdjustedSunset(),
				13 * dakahZmanit + dakahZmanit / 2
			);
		}
	}

	getTzaitLChumra() {
		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunset = this.getSeaLevelSunset();
		const tzaitBy5point054degrees = this.getSunriseOffsetByDegrees(90.0 + 5.054);
		const numberOfMinutes = ((tzaitBy5point054degrees.toMillis() - sunset.toMillis()) / 60_000);
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;

		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), numberOfMinutes * dakahZmanit);
	}

	getTzaitTaanit() {
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getElevationAdjustedSunset(),
			20 * 60_000
		);
	}

	getTzaitTaanitLChumra() {
		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(
			this.getElevationAdjustedSunset(),
			30 * 60_000
		);
	}

	getTzaitShabbatAmudehHoraah() {
		return this.getSunsetOffsetByDegrees(90.0 + 7.18);
	}

	/**
 * @param {boolean} [amudehHoraah]
 */
	getTzais72Zmanis(amudehHoraah) {
		if (!amudehHoraah)
			return super.getTzais72Zmanis();

		const originalDate = this.getDate()
		this.setDate(new Date("March 17 " + originalDate.year.toString()))
		const sunset = this.getSeaLevelSunset();
		const tzaitBy16Degrees = this.getSunriseOffsetByDegrees(90.0 + 16.0);
		const numberOfMinutes = ((tzaitBy16Degrees.toMillis() - sunset.toMillis()) / 60_000);
		this.setDate(originalDate);

		const shaahZmanit = this.getTemporalHour(this.getSeaLevelSunrise(), this.getSeaLevelSunset());
		const dakahZmanit = shaahZmanit / 60;

		return KosherZmanim.ComplexZmanimCalendar.getTimeOffset(this.getSeaLevelSunset(), (numberOfMinutes * dakahZmanit))
	}

		/**
 * @param {boolean} [amudehHoraah]
 */
	getTzais72ZmanisLKulah(amudehHoraah) {
		if (this.getTzais72().toMillis() > this.getTzais72Zmanis(amudehHoraah).toMillis()) {
			return this.getTzais72Zmanis(amudehHoraah);
		} else {
			return this.getTzais72();
		}
	}
}

class zmanimListUpdater {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.geoLocation = geoLocation
		this.zmanimCalendar = new ROZmanim(geoLocation);
		document.getElementById("LocationName").innerHTML = geoLocation.getLocationName() || "No Location Name Provided";

		/**
		 * @type {null|DateTime}
		 */
		this.nextUpcomingZman = null;

		this.handleLanguage();
		this.setupButtons();
		this.setNextUpcomingZman();
		this.updateZmanimList(); //Note: if there are no parameters, this method will crash because there is no timezone set. However, it will be recalled in the getJson method
	}

	handleLanguage() {
		const zmanimLanguage = settings.language();
		switch (zmanimLanguage) {
			case 'hb':
			default:
				document.body.classList.remove("lang-en", "lang-en-et");
				document.body.classList.add("lang-hb");
				break;
			case 'en-et':
				document.body.classList.remove("lang-hb", "lang-en");
				document.body.classList.add("lang-en-et");
				break;
			case 'en':
				document.body.classList.remove("lang-hb", "lang-en-et");
				document.body.classList.add("lang-en");
				break;
		}
	}

	/**
	 * @param {DateTime} date
	 */
	changeDate(date) {
		this.zmanimCalendar.setDate(date)
		jewishCalendar.setDate(date)
	}

	setupButtons() {
		const forwardButton = document.getElementById("forwardDay")
		forwardButton.addEventListener("click", () => {
			this.changeDate(jewishCalendar.clone().getDate().plus({ days: 1 }))
			this.updateZmanimList();
		})

		const backwardButton = document.getElementById("backwardDay")
		backwardButton.addEventListener("click", () => {
			this.changeDate(jewishCalendar.clone().getDate().minus({ days: 1 }))
			this.updateZmanimList();
		});

		const date = document.getElementById("date");
		date.addEventListener('calendarInsert', () => {
			const dateObject = luxon.DateTime.fromFormat(date.getAttribute("date-value"), "MM/dd/yyyy");

			this.changeDate(dateObject);
			this.updateZmanimList();
		})
	}

	updateZmanimList() {
		let primaryDate, secondaryDate, otherDate;

		const zmanimLanguage = localStorage.getItem("zmanimLanguage");
		switch (zmanimLanguage) {
			case 'hb':
			default:
				primaryDate = dateFormatter.hebrew.format(jewishCalendar);
				secondaryDate = jewishCalendar.getDate().toLocaleString(luxon.DateTime.DATE_FULL);
				otherDate = dateFormatter.english.format(jewishCalendar);
				break;
			case 'en-et':
				primaryDate = dateFormatter.english.format(jewishCalendar);
				secondaryDate = jewishCalendar.getDate().toLocaleString(luxon.DateTime.DATE_FULL);
				otherDate = dateFormatter.hebrew.format(jewishCalendar);
				break;
			case 'en':
				primaryDate = jewishCalendar.getDate().toLocaleString(luxon.DateTime.DATE_FULL);
				secondaryDate = dateFormatter.english.format(jewishCalendar);
				otherDate = dateFormatter.hebrew.format(jewishCalendar);
				break;
		}

		document.getElementById("priorityDate").innerText = primaryDate;
		document.getElementById("secondaryDate").innerText = secondaryDate;
		document.getElementById("otherDate").innerText = otherDate;
		if (this.zmanimCalendar.getDate().hasSame(luxon.DateTime.local(), "day")) {
			document.getElementById("dateContainer").classList.add("text-bold");
		}

		var parasha = document.getElementById("Parasha");

		var currentDay = jewishCalendar.getDate(); //save the current day
		var s = daysUntilDay(currentDay.toJSDate(), 6); // 6 = saturday

		jewishCalendar.setDate(luxon.DateTime.fromJSDate(s));
		if (dateFormatter.hebrew.formatParsha(jewishCalendar) !== "") {
			parasha.innerHTML = dateFormatter.hebrew.formatParsha(jewishCalendar);
		} else {
			parasha.innerHTML = "No Parasha this week";
		}
		if (dateFormatter.hebrew.formatSpecialParsha(jewishCalendar) !== "") {
			parasha.innerHTML +=
				" / " + dateFormatter.hebrew.formatSpecialParsha(jewishCalendar);
		}
		jewishCalendar.setDate(currentDay); //reset to current day

		var day = document.getElementById("Day");
		//day of week should show the day of the week in English and Hebrew for example: Sunday / ראשון
		day.innerHTML = [
			currentDay.toJSDate().toLocaleDateString("en-US", { weekday: "long" }),
			"יום " + dateFormatter.hebrew.formatDayOfWeek(jewishCalendar)
		].join(" / ");

		var specialDay = document.getElementById("SpecialDay");
		var specialDayText = getSpecialDay();
		if (specialDayText === "") {
			specialDay.style.display = "none";
		} else {
			specialDay.style.removeProperty("display");
			specialDay.innerHTML = specialDayText;
		}

		var isOkayToListenToMusic = musicPermission();
		var music = document.getElementById("Music");
		if (isOkayToListenToMusic) {
			music.style.display = "none";
		} else {
			music.style.removeProperty("display");
			music.innerHTML = "No music";
		}

		const ulchaparat = document.getElementById("Ulchaparat");
		if (jewishCalendar.isRoshChodesh()) {
			ulchaparat.style.removeProperty("display");
			ulchaparat.innerHTML = (getUlchaparatPesha() ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע")
		} else {
			ulchaparat.style.display = "none";
		}

		var chamah = document.getElementById("Chamah");
		if (jewishCalendar.isBirkasHachamah()) {
			chamah.style.removeProperty("display");
			chamah.innerHTML = "Birchat HaChamah is said today";
		} else {
			chamah.style.display = "none";
		}

		var birchatHalevana = document.getElementById("BirchatHalevana");
		var birchatHalevanaText = this.getIsTonightStartOrEndBirchatLevana();
		if (!birchatHalevanaText) {
			birchatHalevana.style.display = "none";
		} else {
			birchatHalevana.style.removeProperty("display");
			birchatHalevana.innerHTML = birchatHalevanaText;
		}

		var tachanun = document.getElementById("Tachanun");
		tachanun.innerHTML = getTachanun();

		var hallel = document.getElementById("Hallel");
		var hallelText = getHallel();
		if (!hallelText) {
			hallel.style.display = "none";
		} else {
			hallel.style.removeProperty("display");
			hallel.innerHTML = hallelText;
		}

		var tekufa = document.getElementById("Tekufa");
		var tekufaToday = getTekufa();
		var tekufaNextDay = getTekufaForNextDay();
		if (
			(!tekufaToday && !tekufaNextDay) || //if no tekufa today or tomorrow
			(!tekufaToday &&
				getTekufaForNextDayAsDate().toLocaleDateString() !==
				currentDay.toJSDate().toLocaleDateString()) || //if no tekufa today but there is one tomorrow and it's not today
			(!tekufaNextDay &&
				getTekufaAsDate().toLocaleDateString() !==
				currentDay.toJSDate().toLocaleDateString())
		) {
			//if no tekufa tomorrow but there is one today and it's not today
			tekufa.style.display = "none";
		} else {
			const timeBase = (
				tekufaToday !== null &&
					getTekufaAsDate().toLocaleDateString() ===
					currentDay.toJSDate().toLocaleDateString()
					? getTekufaAsDate() : getTekufaForNextDayAsDate());

			tekufa.style.removeProperty("display");
			tekufa.innerHTML = `Tekufa ${getTekufaName()} is today at ${timeBase.toLocaleTimeString()}`;
		}

		let timeFormat;
		if (settings.timeFormat() == "12")
			timeFormat = (!settings.seconds() ? "h:mm a" : "h:mm:ss a");
		else
			timeFormat = "HH:mm" + (settings.seconds() ? ":ss" : '')

		const indContainers = Array.from(document.getElementById("calendarFormatter").children)
			.map(el => /** @type {HTMLElement} */(el));

		for (const timeSlot of indContainers) {
			if (!timeSlot.hasAttribute('timeGetter')
			 || !getAllMethods(ROZmanim.prototype).includes(timeSlot.getAttribute('timeGetter'))) {
				timeSlot.style.display = "none";
				continue;
			}

			if (timeSlot.hasAttribute('yomTovInclusive')) {
				if (jewishCalendar.getYomTovIndex() == KosherZmanim.JewishCalendar[timeSlot.getAttribute("yomtovInclusive")])
					timeSlot.style.removeProperty("display");
				else
					timeSlot.style.display = "none"
			}

			if (timeSlot.hasAttribute('luachInclusive')) {
				const diffLuachs = {
					'amudehHoraah': settings.amudehHoraah(),
					'ohrHachaim': !settings.amudehHoraah()
				};
				for (let [key, implementation] of Object.entries(diffLuachs)) {
					if (timeSlot.getAttribute('luachInclusive') !== key)
						continue;

					if (implementation)
						timeSlot.style.removeProperty("display");
					else
						timeSlot.style.display = "none"
				}
			}

			/** @type {DateTime} */
			let dateTimeForZman = this.zmanimCalendar[timeSlot.getAttribute('timeGetter')](settings.amudehHoraah())

			/* Hardcoding below - Thankfully managed to condense this entire project away from the 2700 lines of JS it was before, but some of it still needed to stay */
			switch (timeSlot.id) {
				case 'candleLighting':
					const tzetCandle = (jewishCalendar.hasCandleLighting() && jewishCalendar.isAssurBemelacha() && jewishCalendar.getDayOfWeek() !== 6);
					const shabbatCandles = ((jewishCalendar.hasCandleLighting() && !jewishCalendar.isAssurBemelacha()) || jewishCalendar.getDayOfWeek() === 6);
	
					if (!tzetCandle && !shabbatCandles)
						timeSlot.style.display = "none";
					else {
						timeSlot.style.removeProperty("display");
	
						if (tzetCandle)
							dateTimeForZman = this.zmanimCalendar.getTzait(settings.amudehHoraah())
						else if (shabbatCandles) {
							this.zmanimCalendar.setCandleLightingOffset(parseInt(getCookie("candleLightingTime")) || 20);
							dateTimeForZman = this.zmanimCalendar.getCandleLighting();
						}
					}
					break;
				case 'tzeitShabbat':
					if (jewishCalendar.isYomTovAssurBemelacha() && jewishCalendar.getDayOfWeek() == 7) {
						timeSlot.querySelector('.lang.lang-hb').innerHTML = "צאת השבת וחג";
						timeSlot.querySelector('.lang.lang-et').innerHTML = "Tzait Shabbat & Yom Tov";
						timeSlot.querySelector('.lang.lang-en').innerHTML = "Shabbat & Yom Tov Ends";
					} else if (jewishCalendar.getDayOfWeek() == 7) {
						timeSlot.querySelector('.lang.lang-hb').innerHTML = "צאת השבת";
						timeSlot.querySelector('.lang.lang-et').innerHTML = "Tzait Shabbat";
						timeSlot.querySelector('.lang.lang-en').innerHTML = "Shabbat Ends";
					} else {
						timeSlot.querySelector('.lang.lang-hb').innerHTML = "צאת חג";
						timeSlot.querySelector('.lang.lang-et').innerHTML = "Tzait Yom Tov";
						timeSlot.querySelector('.lang.lang-en').innerHTML = "Yom Tov Ends";
					}
					break;
				case 'rt':
					dateTimeForZman = dateTimeForZman.set({second: 0}).plus({minutes: 1})
			}

			if (timeSlot.hasAttribute('condition')) {
				switch (timeSlot.getAttribute('condition')) {
					// Default: isTaanis - Cannot use that method because we're supposed to exclude YomKippur
					case 'isTaanit':
						if (jewishCalendar.isTaanis() && jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_KIPPUR)
							timeSlot.style.removeProperty("display");
						else
							timeSlot.style.display = "none"
				}
			}

			const actionToClass = (this.isNextUpcomingZman(dateTimeForZman) ? "add" : "remove")
			timeSlot.classList[actionToClass]("nextZman")

			timeSlot.querySelector('.timeDisplay').innerHTML = dateTimeForZman.setZone(geoLocation.getTimeZone()).toFormat(timeFormat)

			if (timeSlot.hasAttribute('specialDropdownContent')) {
				const description = timeSlot.querySelector('.accordianContent');
				description.innerHTML = description.innerHTML
					.replaceAll('${getAteretTorahSunsetOffset()}', this.zmanimCalendar.getAteretTorahSunsetOffset().toString())
					.replaceAll('${getCandleLightingOffset()}', this.zmanimCalendar.getCandleLightingOffset().toString())
			}
		}

		var daf = document.getElementById("dafBavli");
		var dafYerushalmi = document.getElementById("DafYerushalmi");
		var seasonal = document.getElementById("SeasonalPrayers");
		var shaahZmanit = document.getElementById("ShaahZmanit");

		var dafObject = KosherZmanim.YomiCalculator.getDafYomiBavli(jewishCalendar);
		daf.innerHTML =
			dafObject.getMasechta() + " " +
			numberToHebrew(dafObject.getDaf());

		var dafYerushalmiObject = KosherZmanim.YerushalmiYomiCalculator.getDafYomiYerushalmi(jewishCalendar);
		if (dafYerushalmiObject.getDaf() == 0) {
			dafYerushalmi.innerHTML = "N/A";
		} else {
			dafYerushalmi.innerHTML = dafYerushalmiObject.getYerushalmiMasechta() + " " + numberToHebrew(dafYerushalmiObject.getDaf());
		}

		seasonal.innerHTML = getSeasonalPrayers();
		shaahZmanit.innerHTML = this.shaahZmanits();
	}

	shaahZmanits() {
		var zmanimFormatter = new KosherZmanim.ZmanimFormatter(geoLocation.getTimeZone());
		zmanimFormatter.setTimeFormat(KosherZmanim.ZmanimFormatter.SEXAGESIMAL_FORMAT);
		return `Shaah Zmanith GR'A: ${zmanimFormatter.format(this.zmanimCalendar.getShaahZmanisGra())}
		/ MG'A: ${zmanimFormatter.format(this.zmanimCalendar.getShaahZmanis72MinutesZmanis())}`.replace('\n', ' ')
	}

	getIsTonightStartOrEndBirchatLevana() {
		var startTimeSevenDays = jewishCalendar.getTchilasZmanKidushLevana7Days();
		var endTimeFifteenDays = jewishCalendar.getSofZmanKidushLevana15Days();

		if (this.zmanimCalendar.getDate().hasSame(startTimeSevenDays, "day")) {
			return "Birchat HaLevana starts tonight";
		}
		if (this.zmanimCalendar.getDate().hasSame(endTimeFifteenDays, "day")) {
			return "Last night for Birchat HaLevana";
		}
		return false;
	}

	saveCandleLightingSetting() {
		var candleLightingTime = document.getElementById("candleMinutes")["value"];
		this.zmanimCalendar.setCandleLightingOffset(candleLightingTime);
		setCookie("candleLightingTime", candleLightingTime, 36500); //100 years
		this.updateZmanimList();
	}

	saveTzeitShabbatSetting() {
		var tzeitShabbatTime = document.getElementById("tzeitShabbatMinutes")["value"];
		this.zmanimCalendar.setAteretTorahSunsetOffset(tzeitShabbatTime);
		setCookie("tzeitShabbatTime", tzeitShabbatTime, 36500); //100 years
		this.updateZmanimList();
	}

	setNextUpcomingZman() {
		const zmanim = [];
		const currentSelectedDate = jewishCalendar.getDate();

		for (const time of [-1, 0, 1]) {
			this.changeDate(luxon.DateTime.now().plus({ days: time }));
			this.addZmanim(zmanim);
		}

		this.changeDate(currentSelectedDate); //reset the date to the current date

		this.nextUpcomingZman = zmanim.find(zman => zman !== null &&
			zman.toMillis() > luxon.DateTime.now().toMillis() &&
			(this.nextUpcomingZman === null ||
				zman.toMillis() < this.nextUpcomingZman.toMillis()))

		this.updateZmanimList();
		//call back this function 1 second after the nextUpcomingZman passes
		setTimeout(
			this.setNextUpcomingZman,
			this.nextUpcomingZman.toMillis() - luxon.DateTime.now().toMillis() + 1000
		); //TODO test
	}

	initUpdaterForZmanim() {
		//at 12:00 AM the next day, update the zmanim to the next day's zmanim
		var tomorrow = luxon.DateTime.now().plus({ days: 1 });
		tomorrow = tomorrow.set({ hour: 0, minute: 0, second: 2, millisecond: 0 });
		var timeUntilTomorrow = tomorrow.diffNow().as("milliseconds");
		setTimeout(function () {
			var date = luxon.DateTime.now();
			jewishCalendar.setDate(date);
			this.updateZmanimList();
			this.initUpdaterForZmanim();
		}, timeUntilTomorrow);
	}

	/**
	 * @param {DateTime} zman
	 */
	isNextUpcomingZman(zman) {
		console.log(this.nextUpcomingZman, zman);
		return !(this.nextUpcomingZman == null || !(zman.toMillis() == this.nextUpcomingZman.toMillis()))
	};

	/**
	 * @param {DateTime[]} zmanim
	 */
	addZmanim(zmanim) {
		const indContainers = Array.from(document.getElementById("calendarFormatter").children)
			.map(el => /** @type {HTMLElement} */(el));

		for (const timeSlot of indContainers) {
			if (!timeSlot.hasAttribute('timeGetter')
			 || !getAllMethods(ROZmanim.prototype).includes(timeSlot.getAttribute('timeGetter'))) {
				continue;
			}

			if (timeSlot.hasAttribute('yomTovInclusive') && jewishCalendar.getYomTovIndex() != KosherZmanim.JewishCalendar[timeSlot.getAttribute("yomtovInclusive")]) {
				continue;
			}

			if (timeSlot.hasAttribute('luachInclusive')) {
				const diffLuachs = {
					'amudehHoraah': settings.amudehHoraah(),
					'ohrHachaim': !settings.amudehHoraah()
				};
				for (let [key, implementation] of Object.entries(diffLuachs)) {
					if (timeSlot.getAttribute('luachInclusive') !== key || (timeSlot.getAttribute('luachInclusive') == key && !implementation))
						continue;
				}
			}

			/** @type {DateTime} */
			let dateTimeForZman = this.zmanimCalendar[timeSlot.getAttribute('timeGetter')](settings.amudehHoraah())

			/* Hardcoding below - Thankfully managed to condense this entire project away from the 2700 lines of JS it was before, but some of it still needed to stay */
			switch (timeSlot.id) {
				case 'candleLighting':
					const tzetCandle = (jewishCalendar.hasCandleLighting() && jewishCalendar.isAssurBemelacha() && jewishCalendar.getDayOfWeek() !== 6);
					const shabbatCandles = ((jewishCalendar.hasCandleLighting() && !jewishCalendar.isAssurBemelacha()) || jewishCalendar.getDayOfWeek() === 6);
	
					if (!tzetCandle && !shabbatCandles)
						continue;
	
					if (tzetCandle)
						dateTimeForZman = this.zmanimCalendar.getTzait(settings.amudehHoraah())
					else if (shabbatCandles) {
						this.zmanimCalendar.setCandleLightingOffset(parseInt(getCookie("candleLightingTime")) || 20);
						dateTimeForZman = this.zmanimCalendar.getCandleLighting();
					}
					break;
				case 'rt':
					dateTimeForZman = dateTimeForZman.set({second: 0}).plus({minutes: 1})
			}

			if (timeSlot.hasAttribute('condition')) {
				switch (timeSlot.getAttribute('condition')) {
					// Default: isTaanis - Cannot use that method because we're supposed to exclude YomKippur
					case 'isTaanit':
						if (!(jewishCalendar.isTaanis() && jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_KIPPUR))
							continue;
				}
			}

			zmanim.push(dateTimeForZman);
		}
	}
}

/**
 * @param {Date} d
 * @param {number} dow
 */
function daysUntilDay(d, dow) {
	d.setDate(d.getDate() + ((dow + (7 - d.getDay())) % 7));
	return d;
}

function getSpecialDay() {
	var result = [];
	var yomTovOfToday = getYomTov(jewishCalendar);
	var yomTovOfNextDay = getYomTovForNextDay();

	if (!yomTovOfToday && !yomTovOfNextDay) {
		//if no yom tov today or tomorrow, do nothing to the result array
	} else if (!yomTovOfToday && yomTovOfNextDay && !yomTovOfNextDay.startsWith("Erev")) {
		//if next day has yom tov
		result.push("Erev " + yomTovOfNextDay);
	} else if (
		yomTovOfNextDay &&
		!yomTovOfNextDay.startsWith("Erev") &&
		yomTovOfToday &&
		!yomTovOfToday.endsWith(yomTovOfNextDay)
	) {
		//if today and the next day have yom tov
		result.push(yomTovOfToday + " / Erev " + yomTovOfNextDay);
	} else {
		result.push(yomTovOfToday);
	}
	result = addTaanitBechorot(result);
	result = addRoshChodesh(result);
	result = addDayOfOmer(result);
	result = addDayOfChanukah(result);
	return result.join(" / ");
}

/**
 * @param {string[]} result
 */
function addTaanitBechorot(result) {
	if (tomorrowIsTaanitBechorot()) {
		//edge case
		result.push("Erev Ta'anit Bechorot");
	}
	if (isTaanisBechoros(jewishCalendar)) {
		result.push("Ta'anit Bechorot");
	}
	return result;
}

function tomorrowIsTaanitBechorot() {
	var nextDay = jewishCalendar.getDate().toJSDate();
	nextDay.setDate(nextDay.getDate() + 1);
	var nextJewishCalendar = new KosherZmanim.JewishCalendar(nextDay);
	return isTaanisBechoros(nextJewishCalendar);
}

/**
 * @param {KosherZmanim.JewishCalendar} jewishCalendar
 */
function isTaanisBechoros(jewishCalendar) {
	return (
		jewishCalendar.getJewishMonth() === KosherZmanim.JewishDate.NISSAN &&
		((jewishCalendar.getJewishDayOfMonth() === 14 &&
			jewishCalendar.getDayOfWeek() !== 7) ||
			(jewishCalendar.getJewishDayOfMonth() === 12 &&
				jewishCalendar.getDayOfWeek() === 5))
	);
}

/**
 * @param {string[]} result
 */
function addRoshChodesh(result) {
	var roshChodeshOrErevRoshChodesh = getRoshChodeshOrErevRoshChodesh();
	if (roshChodeshOrErevRoshChodesh) {
		result.push(roshChodeshOrErevRoshChodesh);
	}
	return result;
}

function getRoshChodeshOrErevRoshChodesh() {
	if (!jewishCalendar.isRoshChodesh() && !jewishCalendar.isErevRoshChodesh())
		return false;

	let prefix = "";
	let roshHodeshFormatCalendar = jewishCalendar;

	if (jewishCalendar.isErevRoshChodesh()) {
		prefix = "Erev ";
		roshHodeshFormatCalendar = new KosherZmanim.JewishCalendar(jewishCalendar.clone().getDate().plus({ day: 1 }))
	}

	return prefix + dateFormatter.english.formatRoshChodesh(roshHodeshFormatCalendar);
}

/**
 * @param {string[]} result
 */
function addDayOfOmer(result) {
	var dayOfOmer = jewishCalendar.getDayOfOmer();
	if (dayOfOmer != -1) {
		result.push(getOrdinal(dayOfOmer) + " day of Omer");
	}
	return result;
}

/**
 * @param {string[]} result
 */
function addDayOfChanukah(result) {
	var dayOfChanukah = jewishCalendar.getDayOfChanukah();
	if (dayOfChanukah != -1) {
		result.splice(result.indexOf("Chanukah"), 1); //remove Chanukah from the list to avoid duplication
		result.push(getOrdinal(dayOfChanukah) + " day of Chanukah");
	}
	return result;
}

function getSeasonalPrayers() {
	var result = [];
	var startDateForMashivHaruach = new KosherZmanim.JewishDate(jewishCalendar.getJewishYear(), KosherZmanim.JewishDate.TISHREI, 22);
	var endDateForMashivHaruach = new KosherZmanim.JewishDate(jewishCalendar.getJewishYear(), KosherZmanim.JewishDate.NISSAN, 15);
	if (
		jewishCalendar.compareTo(startDateForMashivHaruach) > 0 &&
		jewishCalendar.compareTo(endDateForMashivHaruach) < 0
	) {
		result.push("משיב הרוח");
	} else {
		result.push("מוריד הטל");
	}

	if (isBarechAleinu()) {
		result.push("ברך עלינו");
	} else {
		result.push("ברכנו");
	}
	return result.join(" / ");
}

function getHallel() {
	var yomTovIndex = jewishCalendar.getYomTovIndex();
	if (
		(jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
			jewishCalendar.getJewishDayOfMonth() == 15) || //First day of Pesach
		(!jewishCalendar.getInIsrael() &&
			jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
			jewishCalendar.getJewishDayOfMonth() == 16) || //First day of Pesach outside of israel
		[
			KosherZmanim.JewishCalendar.SHAVUOS,
			KosherZmanim.JewishCalendar.SUCCOS,
			KosherZmanim.JewishCalendar.SHEMINI_ATZERES
		].includes(yomTovIndex) ||
		jewishCalendar.isCholHamoedSuccos() ||
		jewishCalendar.isChanukah()
	) {
		return "הלל שלם";
	} else if (
		jewishCalendar.isRoshChodesh() ||
		jewishCalendar.isCholHamoedPesach() ||
		(jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
			jewishCalendar.getJewishDayOfMonth() == 21) ||
		(!jewishCalendar.getInIsrael() &&
			jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.NISSAN &&
			jewishCalendar.getJewishDayOfMonth() == 22)
	) {
		return "חצי הלל";
	} else {
		return false;
	}
}

function getTekufaForNextDay() {
	var nextDay = jewishCalendar.getDate().toJSDate();
	nextDay.setDate(nextDay.getDate() + 1);
	jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
	var tekufa = getTekufa();
	nextDay.setDate(nextDay.getDate() - 1);
	jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
	return tekufa;
}

function getTekufaForNextDayAsDate() {
	var nextDay = jewishCalendar.getDate().toJSDate();
	nextDay.setDate(nextDay.getDate() + 1);
	jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
	var tekufaDate = getTekufaAsDate();
	nextDay.setDate(nextDay.getDate() - 1);
	jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
	return tekufaDate;
}

function getTekufa() {
	var INITIAL_TEKUFA_OFFSET = 12.625; // the number of days Tekufas Tishrei occurs before JEWISH_EPOCH
	const jewishDate = new KosherZmanim.JewishDate(jewishCalendar.getJewishYear(), jewishCalendar.getJewishMonth(), jewishCalendar.getJewishDayOfMonth());

	var days =
		KosherZmanim.JewishDate.getJewishCalendarElapsedDays(jewishCalendar.getJewishYear()) +
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

function getTekufaName() {
	var tekufaNameForToday = getTekufaType();
	if (tekufaNameForToday !== -1)
		return tekufaNameForToday;

	jewishCalendar.setDate(jewishCalendar.getDate().plus({ days: 1 }));
	var tekufaNameForTomorrow = getTekufaType();
	jewishCalendar.setDate(jewishCalendar.getDate().minus({ days: 1 }));
	return tekufaNameForTomorrow;

	function getTekufaType() {
		var tekufaNames = ["Tishri", "Tevet", "Nissan", "Tammuz"];
		var INITIAL_TEKUFA_OFFSET = 12.625; // the number of days Tekufas Tishrei occurs before JEWISH_EPOCH

		const jewishDate = new KosherZmanim.JewishDate(jewishCalendar.getJewishYear(), jewishCalendar.getJewishMonth(), jewishCalendar.getJewishDayOfMonth());
		var days =
			KosherZmanim.JewishDate.getJewishCalendarElapsedDays(
				jewishCalendar.getJewishYear()
			) +
			jewishDate.getDaysSinceStartOfJewishYear() +
			INITIAL_TEKUFA_OFFSET -
			1; // total days since first Tekufas Tishrei event

		var solarDaysElapsed = days % 365.25; // total days elapsed since start of solar year
		var currentTekufaNumber = Math.floor(solarDaysElapsed / 91.3125); // the number of days that have passed since a tekufa event
		var tekufaDaysElapsed = solarDaysElapsed % 91.3125; // the number of days that have passed since a tekufa event
		return ((tekufaDaysElapsed > 0 && tekufaDaysElapsed <= 1) ? tekufaNames[currentTekufaNumber] : -1); //0 for Tishrei, 1 for Tevet, 2, for Nissan, 3 for Tammuz
	}
}

function getTekufaAsDate() {
	const hours = getTekufa() - 6;
	const minutes = Math.floor((hours - Math.floor(hours)) * 60);
	const date = luxon.DateTime.fromObject({
		year: jewishCalendar.getGregorianYear(),
		month: jewishCalendar.getGregorianMonth() + 1,
		day: jewishCalendar.getGregorianDayOfMonth(),
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

function isBarechAleinu() {
	if (
		jewishCalendar.getJewishMonth() === KosherZmanim.JewishDate.NISSAN &&
		jewishCalendar.getJewishDayOfMonth() < 15
	) {
		return true;
	}
	if (jewishCalendar.getJewishMonth() < KosherZmanim.JewishDate.CHESHVAN) {
		return false;
	}
	if (jewishCalendar.getInIsrael()) {
		return (
			jewishCalendar.getJewishMonth() !==
			KosherZmanim.JewishDate.CHESHVAN ||
			jewishCalendar.getJewishDayOfMonth() >= 7
		);
	} else {
		const jewishDate = new KosherZmanim.JewishDate(jewishCalendar.getJewishYear(), jewishCalendar.getJewishMonth(), jewishCalendar.getJewishDayOfMonth());
		var tekufatTishriElapsedDays =
			KosherZmanim.JewishDate.getJewishCalendarElapsedDays(jewishCalendar.getJewishYear()) +
			(jewishDate.getDaysSinceStartOfJewishYear() - 1) + 0.5;
		var solar = (jewishCalendar.getJewishYear() - 1) * 365.25;
		tekufatTishriElapsedDays = Math.floor(tekufatTishriElapsedDays - solar);

		return tekufatTishriElapsedDays >= 47;
	}
}

const yomTovObj = Object.fromEntries([
	// Erev Holidays
	[KosherZmanim.JewishCalendar.EREV_PESACH, "Erev Pesach"],
	[KosherZmanim.JewishCalendar.EREV_SHAVUOS, "Erev Shavuoth"],
	[KosherZmanim.JewishCalendar.EREV_ROSH_HASHANA, "Erev Rosh Hashana"],
	[KosherZmanim.JewishCalendar.EREV_YOM_KIPPUR, "Erev Yom Kippur"],
	[KosherZmanim.JewishCalendar.EREV_SUCCOS, "Erev Sukkoth"],

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
	[KosherZmanim.JewishCalendar.SHEMINI_ATZERES, "Shemini Atzereth" + (jewishCalendar.getInIsrael() ? " & Simchath Torah" : "")],
	[KosherZmanim.JewishCalendar.SIMCHAS_TORAH, (jewishCalendar.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah"],

	// Semi-Holidays & Fasts
	// "Yom Tov Index 20 was Erev Hanukah, which was deleted" (leaving note from the original)
	[KosherZmanim.JewishCalendar.PESACH_SHENI, "Pesach Sheni"],
	[KosherZmanim.JewishCalendar.LAG_BAOMER, "Lag B'Omer"],
	[KosherZmanim.JewishCalendar.SEVENTEEN_OF_TAMMUZ, "17<sup>th</sup> of Tammuz Fast"],
	[KosherZmanim.JewishCalendar.TISHA_BEAV, "Tisha Be'Av"],
	[KosherZmanim.JewishCalendar.TU_BEAV, "Tu Be'Av"],
	[KosherZmanim.JewishCalendar.FAST_OF_GEDALYAH, "Tzom Gedalya"],
	[KosherZmanim.JewishCalendar.CHANUKAH, "Hanukah"],
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
const getYomTov = (/** @type {KosherZmanim.JewishCalendar} */ jewishCalendar) => yomTovObj[jewishCalendar.getYomTovIndex()];

function getYomTovForNextDay() {
	var nextDay = jewishCalendar.getDate().toJSDate();
	nextDay.setDate(nextDay.getDate() + 1);
	var nextJewishCalendar = new KosherZmanim.JewishCalendar(nextDay);
	nextJewishCalendar.setUseModernHolidays(true);
	return getYomTov(nextJewishCalendar);
}

function getTachanun() {
	var yomTovIndex = jewishCalendar.getYomTovIndex();
	if (jewishCalendar.isRoshChodesh() ||
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
		jewishCalendar.isChanukah() ||
		jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.NISSAN ||
		(jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.SIVAN &&
			jewishCalendar.getJewishDayOfMonth() <= 12) ||
		(jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.TISHREI &&
			jewishCalendar.getJewishDayOfMonth() >= 11)
	) {
		return "There is no Tachanun today";
	}
	var yomTovIndexForNextDay = getYomTovIndexForNextDay();
	if (jewishCalendar.getDayOfWeek() == 6 ||
		yomTovIndex == KosherZmanim.JewishCalendar.FAST_OF_ESTHER ||
		[
			KosherZmanim.JewishCalendar.TISHA_BEAV,
			KosherZmanim.JewishCalendar.TU_BEAV,
			KosherZmanim.JewishCalendar.TU_BESHVAT,
			KosherZmanim.JewishCalendar.LAG_BAOMER,
			KosherZmanim.JewishCalendar.PESACH_SHENI,
			KosherZmanim.JewishCalendar.PURIM_KATAN
		].includes(yomTovIndexForNextDay) ||
		jewishCalendar.isErevRoshChodesh()
	) {
		return "There is only Tachanun in the morning";
	}
	if (jewishCalendar.getDayOfWeek() == 7) {
		return "צדקתך";
	}
	return "There is Tachanun today";
}

function getYomTovIndexForNextDay() {
	var nextDay = jewishCalendar.getDate().toJSDate();
	nextDay.setDate(nextDay.getDate() + 1);

	jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));
	var yomTovIndex = jewishCalendar.getYomTovIndex();

	nextDay.setDate(nextDay.getDate() - 1); //reset the date to the original date
	jewishCalendar.setDate(luxon.DateTime.fromJSDate(nextDay));

	return yomTovIndex;
}

/**
 * @param {number} num
 */
function numberToHebrew(num) {
	var buffer = [];
	if (num <= 0 || num >= 6000) return null; // only support 1-5999 for now, since that's all we need, but could be extended
	var let1000 = [" א'", " ב'", " ג'", " ד'", " ה'"];
	var let100 = ["ק", "ר", "ש", "ת"];
	var let10 = ["י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
	var let1 = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];

	if (num >= 100) {
		if (num >= 1000) {
			buffer.push(let1000[Math.floor(num) / 1000 - 1]);
			num %= 1000;
		}

		if (num < 500) {
			buffer.push(let100[Math.floor(num) / 100 - 1]);
		} else if (num < 900) {
			buffer.push("ת");
			buffer.push(let100[(Math.floor(num) - 400) / 100 - 1]);
		} else {
			buffer.push("תת");
			buffer.push(let100[(Math.floor(num) - 800) / 100 - 1]);
		}

		num %= 100;
	}
	switch (num) {
		// Avoid letter combinations from the Tetragrammaton
		case 16:
			buffer.push("טז");
			break;
		case 15:
			buffer.push("טו");
			break;
		default:
			if (num >= 10) {
				buffer.push(let10[Math.floor(num / 10) - 1]);
				num %= 10;
			}
			if (num > 0) {
				buffer.push(let1[Math.floor(num) - 1]);
			}
			break;
	}
	return buffer.join("");
}

function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(";");
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

function eraseCookie(name) {
	document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

const musicPermission = () => !(
	(jewishCalendar.getDayOfOmer() >= 8 && jewishCalendar.getDayOfOmer() <= 32)
	|| (jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.TAMMUZ && jewishCalendar.getJewishDayOfMonth() >= 17)
	|| (jewishCalendar.getJewishMonth() == KosherZmanim.JewishDate.AV && jewishCalendar.getJewishDayOfMonth() <= 9)
);

function getUlchaparatPesha() {
	if (!jewishCalendar.isRoshChodesh())
		throw new Error("Call to 'getUlchaparatPesha()' function without being Rosh Hodesh");

	return (jewishCalendar.isJewishLeapYear()
		&& [
			KosherZmanim.JewishDate.CHESHVAN,
			KosherZmanim.JewishDate.KISLEV,
			KosherZmanim.JewishDate.TEVES,
			KosherZmanim.JewishDate.SHEVAT,
			KosherZmanim.JewishDate.ADAR,
			KosherZmanim.JewishDate.ADAR_II
		].includes(jewishCalendar.getJewishMonth())
	);
	//return "Say וּלְכַפָּרַת פֶּשַׁע";
	//return "Do not say וּלְכַפָּרַת פֶּשַׁע";
}

//get the location details from the query string and create the zmanim calendar
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const geoLocationBase = {
	locationName: urlParams.get("locationName"),
	lat: parseFloat(urlParams.get("lat")),
	long: parseFloat(urlParams.get("long")),
	elevation: parseFloat(urlParams.get("elevation")),
	timezone: urlParams.get("timeZone") || undefined
}
if (isNaN(geoLocationBase.elevation)) {
	geoLocationBase.elevation = 0;
}
if (isNaN(geoLocationBase.lat) && isNaN(geoLocationBase.long)) {
	window.location.href = "/"
}

if (geoLocationBase.timezone == "Asia/Jerusalem") {
	//if the timezone is Asia/Jerusalem, then the location is probably very close to the Israel or in Israel, so we set the jewish calendar to inIsrael mode
	//we should change this behavior to ask the user if he is in israel or not and adjust accordingly
	jewishCalendar.setInIsrael(true);
}

const geoLocation = new KosherZmanim.GeoLocation(
	geoLocationBase.locationName,
	geoLocationBase.lat,
	geoLocationBase.long,
	geoLocationBase.elevation,
	geoLocationBase.timezone
);
const zmanimListUpdater2 = new zmanimListUpdater(geoLocation)