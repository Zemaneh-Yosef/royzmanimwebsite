// @ts-check

// Comment the following few lines before going live
import * as KosherZmanim from "./libraries/dev/bundle.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim, methodNames } from "./ROYZmanim.js";
import WebsiteCalendar from "./WebsiteCalendar.js";
import n2words from "./libraries/n2wordsrollup.js";

const settings = {
	calendarSource: () => localStorage.getItem("calendarSource"),
	seconds: () => localStorage.getItem("seconds") == "true",
	timeFormat: () => localStorage.getItem("timeFormat"),
	language: () => localStorage.getItem("zmanimLanguage"),
	candleLighting: () => parseInt(localStorage.getItem("candles")) || 20,
	tzeith: () => parseInt(localStorage.getItem("tzeith")) || 40
}

class zmanimListUpdater {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.geoLocation = geoLocation;
		document.getElementById("LocationName").innerHTML = geoLocation.getLocationName() || "No Location Name Provided";

		this.zmanimCalendar = (settings.calendarSource() == "amudehHoraah" ? new AmudehHoraahZmanim(geoLocation) : new OhrHachaimZmanim(geoLocation, true));
		this.zmanimCalendar.ComplexZmanimCalendar.setCandleLightingOffset(settings.candleLighting());
		this.zmanimCalendar.ComplexZmanimCalendar.setAteretTorahSunsetOffset(settings.tzeith());

		this.jewishCalendar = new WebsiteCalendar();
		this.jewishCalendar.setUseModernHolidays(true);
		this.jewishCalendar.setUpDateFormatter();

		if (geoLocation.getTimeZone() == "Asia/Jerusalem") {
			//if the timezone is Asia/Jerusalem, then the location is probably very close to the Israel or in Israel, so we set the jewish calendar to inIsrael mode
			//we should change this behavior to ask the user if he is in israel or not and adjust accordingly
			this.jewishCalendar.setInIsrael(true);
		}

		/**
		 * @type {null|luxon.DateTime}
		 */
		this.nextUpcomingZman = null;

		this.handleLanguage();
		this.setupButtons();
		this.setNextUpcomingZman();
		// this.updateZmanimList(); //Note: if there are no parameters, this method will crash because there is no timezone set. However, it will be recalled in the getJson method
	}

	handleLanguage() {
		const zmanimLanguage = settings.language();
		switch (zmanimLanguage) {
			case 'hb':
			default:
				document.body.classList.remove("lang-en", "lang-en-et");
				document.body.classList.add("lang-hb");

				document.getElementById("mdb").setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.rtl.min.css")
				document.getElementById("mdbd").setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.dark.rtl.min.css")
				break;
			case 'en-et':
				document.body.classList.remove("lang-hb", "lang-en");
				document.body.classList.add("lang-en-et");

				document.getElementById("mdb").setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.min.css")
				document.getElementById("mdbd").setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.dark.min.css")
				break;
			case 'en':
				document.body.classList.remove("lang-hb", "lang-en-et");
				document.body.classList.add("lang-en");

				document.getElementById("mdb").setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.min.css")
				document.getElementById("mdbd").setAttribute("href", "/assets/libraries/mdbootstrap/css/mdb.dark.min.css")
				break;
		}
	}

	/**
	 * @param {luxon.DateTime} date
	 */
	changeDate(date) {
		this.zmanimCalendar.ComplexZmanimCalendar.setDate(date)
		this.jewishCalendar.setDate(date)
	}

	setupButtons() {
		const forwardButton = document.getElementById("forwardDay")
		forwardButton.addEventListener("click", () => {
			this.changeDate(this.jewishCalendar.clone().getDate().plus({ days: 1 }))
			this.updateZmanimList();
		})

		const backwardButton = document.getElementById("backwardDay")
		backwardButton.addEventListener("click", () => {
			this.changeDate(this.jewishCalendar.clone().getDate().minus({ days: 1 }))
			this.updateZmanimList();
		});

		const date = document.getElementById("date");
		date.addEventListener('calendarInsert', () => {
			// @ts-ignore
			const dateObject = luxon.DateTime.fromFormat(date.getAttribute("date-value"), "MM/dd/yyyy");

			this.changeDate(dateObject);
			this.updateZmanimList();
		})
	}

	writeMourningPeriod() {
		const mourningDiv = document.getElementById("MourningPeriod");
		if (!this.jewishCalendar.isMourningPeriod()) {
			mourningDiv.style.display = "none";
			return;
		}
		mourningDiv.style.removeProperty("display");

		const sefirathHaomer = document.getElementById("SefirathHaomer");
		const threeWeeks = document.getElementById("ThreeWeeksHeader")
		if (this.jewishCalendar.getDayOfOmer() !== -1) {
			sefirathHaomer.style.removeProperty("display");
			threeWeeks.style.display = "none";

			const weeks = Math.floor(this.jewishCalendar.getDayOfOmer() / 7);
			const days = this.jewishCalendar.getDayOfOmer() % 7;

			// Hebrew Attributes
			const hbName = n2words(this.jewishCalendar.getDayOfOmer());
			const hbNameElem = document.getElementById("hbOmerDate");

			const dayWords = ["יום", "ימים"]
			const verb = dayWords[(this.jewishCalendar.getDayOfOmer() >= 2 && this.jewishCalendar.getDayOfOmer() <= 10 ? 1 : 0)];

			const hbTitle = [hbName, verb];
			if (this.jewishCalendar.getDayOfOmer() == 1)
				hbTitle.reverse()

			hbNameElem.innerHTML = hbTitle.join(" ")

			const hbDescription = document.getElementById("hbOmerDays");
			if (this.jewishCalendar.getDayOfOmer() >= 7) {
				hbDescription.parentElement.style.removeProperty("display");

				const weeksCount = [n2words(weeks), "שבוע" + (weeks >= 2 ? "ות" : "")]
				if (weeks == 1)
					weeksCount.reverse()

				hbDescription.innerHTML = weeksCount.join(" ")

				if (days) {
					const dayCount = [n2words(days), dayWords[days == 1 ? 0 : 1]]
					if (days == 1)
						dayCount.reverse()

					hbDescription.innerHTML += " ו" + dayCount.join(" ")
				}
			} else {
				hbDescription.parentElement.style.display = 'none';
			}

			// English
			document.getElementById("etNumOmerCount").innerHTML =
				this.jewishCalendar.getDayOfOmer() + " day" + (this.jewishCalendar.getDayOfOmer() >= 2 ? "s" : '');
			const etDescription = document.getElementById("etOmer");
			if (this.jewishCalendar.getDayOfOmer() >= 7) {
				etDescription.parentElement.style.removeProperty("display");

				etDescription.innerHTML = (weeks == 1 ? "is a week" : "are " + weeks + " weeks")
				if (days)
					etDescription.innerHTML += " and " + (days == 1 ? "a day" : days + " days");
			} else {
				etDescription.parentElement.style.display = 'none';
			}
	
			document.getElementById("enOrdOmerCount").innerHTML = this.jewishCalendar.getTitleDayOfOmer();
			const enDescription = document.getElementById("enOmer");
			if (this.jewishCalendar.getDayOfOmer() >= 7) {
				enDescription.parentElement.style.removeProperty("display");

				const descEngText = [weeks + " week" + (weeks !== 1 ? "s" : "")];
				if (days)
					descEngText.push(days + " day" + (days !== 1 ? "s" :""))

				enDescription.innerHTML = descEngText.join(" • ")
			} else {
				enDescription.style.display = 'none';
			}
		} else {
			sefirathHaomer.style.display = 'none';
			threeWeeks.style.removeProperty("display");

			const threeWeeksText = Array.from(threeWeeks.getElementsByClassName("threeWeeks"));
			const nineDaysText = Array.from(threeWeeks.getElementsByClassName("nineDays"));
			const weekOfText = Array.from(threeWeeks.getElementsByClassName("weekOf"));

			if (this.jewishCalendar.isShvuaShechalBo()) {
				weekOfText.forEach((/** @type {HTMLElement} */ elem) => elem.style.removeProperty("display"))
				nineDaysText.forEach((/** @type {HTMLElement} */ elem) => elem.style.display = "none")
				threeWeeksText.forEach((/** @type {HTMLElement} */ elem) => elem.style.display = "none")
			} else if (this.jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.AV) {
				weekOfText.forEach((/** @type {HTMLElement} */ elem) => elem.style.display = "none")
				nineDaysText.forEach((/** @type {HTMLElement} */ elem) => elem.style.removeProperty("display"))
				threeWeeksText.forEach((/** @type {HTMLElement} */ elem) => elem.style.display = "none")
			} else {
				weekOfText.forEach((/** @type {HTMLElement} */ elem) => elem.style.display = "none")
				nineDaysText.forEach((/** @type {HTMLElement} */ elem) => elem.style.display = "none")
				threeWeeksText.forEach((/** @type {HTMLElement} */ elem) => elem.style.removeProperty("display"))
			}
		}

		for (const [key, value] of Object.entries(this.jewishCalendar.mourningHalachot())) {
			if (value)
				document.getElementById(key).style.removeProperty("display")
			else
				document.getElementById(key).style.display = "none"
		}

		if (Object.values(this.jewishCalendar.mourningHalachot()).every(elem => elem == false))
			document.getElementById("omerRules").style.display = "none"
		else
			document.getElementById("omerRules").style.removeProperty("display")
	}

	updateZmanimList() {
		let primaryDate, secondaryDate, otherDate;

		switch (settings.language()) {
			case 'hb':
			default:
				primaryDate = this.jewishCalendar.formatJewishDate().hebrew;
				secondaryDate = this.jewishCalendar.getDate().toLocaleString(window.luxon.DateTime.DATE_FULL);
				otherDate = this.jewishCalendar.formatJewishDate().english;
				break;
			case 'en-et':
				primaryDate = this.jewishCalendar.formatJewishDate().english;
				secondaryDate = this.jewishCalendar.getDate().toLocaleString(window.luxon.DateTime.DATE_FULL);
				otherDate = this.jewishCalendar.formatJewishDate().hebrew;
				break;
			case 'en':
				primaryDate = this.jewishCalendar.getDate().toLocaleString(window.luxon.DateTime.DATE_FULL);
				secondaryDate = this.jewishCalendar.formatJewishDate().english;
				otherDate = this.jewishCalendar.formatJewishDate().hebrew;
				break;
		}

		document.getElementById("priorityDate").innerText = primaryDate;
		document.getElementById("secondaryDate").innerText = secondaryDate;
		document.getElementById("otherDate").innerText = otherDate;
		if (this.zmanimCalendar.ComplexZmanimCalendar.getDate().hasSame(window.luxon.DateTime.local(), "day")) {
			document.getElementById("dateContainer").classList.add("text-bold");
		}

		var parasha = document.getElementById("Parasha");
		parasha.innerHTML = this.jewishCalendar.getHebrewParasha().join(" / ")

		var day = document.getElementById("Day");
		//day of week should show the day of the week in English and Hebrew for example: Sunday / ראשון
		day.innerHTML = Object.values(this.jewishCalendar.getDayOfTheWeek()).join(" / ");

		var specialDay = document.getElementById("SpecialDay");
		var specialDayText = this.jewishCalendar.listOfSpecialDays();
		if (!specialDayText.length) {
			specialDay.style.display = "none";
		} else {
			specialDay.style.removeProperty("display");
			specialDay.innerHTML = specialDayText.join(" / ");
		}

		this.writeMourningPeriod();

		const ulchaparat = document.getElementById("Ulchaparat");
		if (this.jewishCalendar.isRoshChodesh()) {
			ulchaparat.style.removeProperty("display");
			ulchaparat.innerHTML = (this.jewishCalendar.tefilahRules().amidah.ulChaparatPesha ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע")
		} else {
			ulchaparat.style.display = "none";
		}

		var chamah = document.getElementById("Chamah");
		if (this.jewishCalendar.isBirkasHachamah()) {
			chamah.style.removeProperty("display");
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
		if (this.jewishCalendar.getDayOfWeek() == 7) {
			tachanun.innerHTML = this.jewishCalendar.tefilahRules().tachanun == 0 ? "צדקתך" : "יהי שם"
		} else {
			switch (this.jewishCalendar.tefilahRules().tachanun) {
				case 2:
					tachanun.innerHTML = "No Tachanun";
					break;
				case 1:
					tachanun.innerHTML = "Only Tachanun at Shacharit";
					break;
				case 0:
					tachanun.innerHTML = "Calendar-Tachanun Day";
			}
		}

		var hallel = document.getElementById("Hallel");
		var hallelText = this.jewishCalendar.tefilahRules().hallel;
		if (!hallelText) {
			hallel.style.display = "none";
		} else {
			hallel.style.removeProperty("display");
			hallel.innerHTML = hallelText == 2 ? "הלל שלם (עם ברכה)" : "חצי הלל (בלי ברכה)";
		}

		var tekufa = document.getElementById("Tekufa");
		var tekufaToday = this.jewishCalendar.getTekufa();
		var tekufaNextDay = this.jewishCalendar.tomorrow().getTekufa();
		if (
			(!tekufaToday && !tekufaNextDay) || //if no tekufa today or tomorrow
			(!tekufaToday &&
				this.jewishCalendar.tomorrow().getTekufaAsDate(settings.calendarSource() == "amudehHoraah").toLocaleDateString() !==
				this.jewishCalendar.getDate().toJSDate().toLocaleDateString()) || //if no tekufa today but there is one tomorrow and it's not today
			(!tekufaNextDay &&
				this.jewishCalendar.getTekufaAsDate(settings.calendarSource() == "amudehHoraah").toLocaleDateString() !==
				this.jewishCalendar.getDate().toJSDate().toLocaleDateString())
		) {
			//if no tekufa tomorrow but there is one today and it's not today
			tekufa.style.display = "none";
		} else {
			tekufa.style.removeProperty("display");

			const timeBase = (
				tekufaToday !== null &&
					this.jewishCalendar.getTekufaAsDate(settings.calendarSource() == "amudehHoraah").toLocaleDateString() ===
					this.jewishCalendar.getDate().toJSDate().toLocaleDateString()
					? this.jewishCalendar.getTekufaAsDate(settings.calendarSource() == "amudehHoraah") : this.jewishCalendar.tomorrow().getTekufaAsDate(settings.calendarSource() == "amudehHoraah"));

			//0 for Tishrei, 1 for Tevet, 2, for Nissan, 3 for Tammuz
			const tekufaID = this.jewishCalendar.getTekufaID() || this.jewishCalendar.tomorrow().getTekufaID()

			Array.from(tekufa.getElementsByClassName('tekufaName-en')).forEach(element => element.innerHTML = this.jewishCalendar.getTekufaName(tekufaID).english);
			Array.from(tekufa.getElementsByClassName('tekufaTime')).forEach(element => element.innerHTML = timeBase.toLocaleTimeString());
			tekufa.querySelector('#tekufaName-hb').innerHTML = this.jewishCalendar.getTekufaName(tekufaID).hebrew;
		}

		let timeFormat;
		if (settings.timeFormat() == "12")
			timeFormat = (!settings.seconds() ? "h:mm a" : "h:mm:ss a");
		else
			timeFormat = "HH:mm" + (settings.seconds() ? ":ss" : '')

		const indContainers = Array.from(document.getElementById("calendarFormatter").children)
			.map(el => /** @type {HTMLElement} */(el));

		for (const timeSlot of indContainers) {
			if ((!timeSlot.hasAttribute('timeGetter')
			 || !methodNames.includes(timeSlot.getAttribute('timeGetter'))) && timeSlot.id !== 'candleLighting') {
				timeSlot.style.display = "none";
				console.log(timeSlot.getAttribute('timeGetter'), methodNames)
				continue;
			}

			if (timeSlot.hasAttribute('yomTovInclusive')) {
				if (this.jewishCalendar.getYomTovIndex() == KosherZmanim.JewishCalendar[timeSlot.getAttribute("yomtovInclusive")])
					timeSlot.style.removeProperty("display");
				else
					timeSlot.style.display = "none"
			}

			if (timeSlot.hasAttribute('luachInclusive')) {
				if (!['amudehHoraah', 'ohrHachaim'].includes(timeSlot.getAttribute('luachInclusive'))
				 || settings.calendarSource() !== timeSlot.getAttribute('luachInclusive')) {
					timeSlot.style.display = "none";
					continue;
				}
			}

			/** @type {luxon.DateTime} */
			let dateTimeForZman;
			if (timeSlot.hasAttribute('timeGetter'))
				dateTimeForZman = this.zmanimCalendar[timeSlot.getAttribute('timeGetter')]()

			/* Hardcoding below - Thankfully managed to condense this entire project away from the 2700 lines of JS it was before, but some of it still needed to stay */
			switch (timeSlot.id) {
				case 'candleLighting':
					const tzetCandle = (this.jewishCalendar.hasCandleLighting() && this.jewishCalendar.isAssurBemelacha() && this.jewishCalendar.getDayOfWeek() !== 6);
					const shabbatCandles = ((this.jewishCalendar.hasCandleLighting() && !this.jewishCalendar.isAssurBemelacha()) || this.jewishCalendar.getDayOfWeek() === 6);

					if (!tzetCandle && !shabbatCandles) {
						timeSlot.style.display = "none";
						continue;
					} else {
						timeSlot.style.removeProperty("display");

						if (tzetCandle)
							dateTimeForZman = this.zmanimCalendar.getTzait()
						else if (shabbatCandles)
							dateTimeForZman = this.zmanimCalendar.getCandleLighting();
					}
					break;
				case 'tzeitShabbat':
					if (this.jewishCalendar.isAssurBemelacha() && !this.jewishCalendar.hasCandleLighting()) {
						timeSlot.style.removeProperty("display");

						if (this.jewishCalendar.isYomTovAssurBemelacha() && this.jewishCalendar.getDayOfWeek() == 7) {
							timeSlot.querySelector('.lang.lang-hb').innerHTML = "צאת השבת וחג";
							timeSlot.querySelector('.lang.lang-et').innerHTML = "Tzait Shabbat & Yom Tov";
							timeSlot.querySelector('.lang.lang-en').innerHTML = "Shabbat & Yom Tov Ends";
						} else if (this.jewishCalendar.getDayOfWeek() == 7) {
							timeSlot.querySelector('.lang.lang-hb').innerHTML = "צאת השבת";
							timeSlot.querySelector('.lang.lang-et').innerHTML = "Tzait Shabbat";
							timeSlot.querySelector('.lang.lang-en').innerHTML = "Shabbat Ends";
						} else {
							timeSlot.querySelector('.lang.lang-hb').innerHTML = "צאת חג";
							timeSlot.querySelector('.lang.lang-et').innerHTML = "Tzait Yom Tov";
							timeSlot.querySelector('.lang.lang-en').innerHTML = "Yom Tov Ends";
						}
					} else {
						timeSlot.style.display = "none";
					}
					break;
				case 'rt':
					if (!settings.seconds() && dateTimeForZman.second !== 0)
						dateTimeForZman = dateTimeForZman.set({second: 0}).plus({minutes: 1})
					break;
				case 'tzeit':
					if (this.jewishCalendar.isAssurBemelacha() && !this.jewishCalendar.hasCandleLighting()) {
						timeSlot.style.display = "none";
					} else {
						timeSlot.style.removeProperty("display");
					}
			}

			if (timeSlot.hasAttribute('condition')) {
				switch (timeSlot.getAttribute('condition')) {
					// Default: isTaanis - Cannot use that method because we're supposed to exclude YomKippur
					case 'isTaanit':
						if (this.jewishCalendar.isTaanis() && this.jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_KIPPUR)
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
					.replaceAll('${getAteretTorahSunsetOffset()}', this.zmanimCalendar.ComplexZmanimCalendar.getAteretTorahSunsetOffset().toString())
					.replaceAll('${getCandleLightingOffset()}', this.zmanimCalendar.ComplexZmanimCalendar.getCandleLightingOffset().toString())
			}
		}

		var daf = document.getElementById("dafBavli");
		var dafYerushalmi = document.getElementById("DafYerushalmi");
		var shaahZmanit = document.getElementById("ShaahZmanit");

		var dafObject = KosherZmanim.YomiCalculator.getDafYomiBavli(this.jewishCalendar);
		daf.innerHTML =
			dafObject.getMasechta() + " " +
			numberToHebrew(dafObject.getDaf());

		var dafYerushalmiObject = KosherZmanim.YerushalmiYomiCalculator.getDafYomiYerushalmi(this.jewishCalendar);
		if (dafYerushalmiObject.getDaf() == 0) {
			dafYerushalmi.innerHTML = "N/A";
		} else {
			dafYerushalmi.innerHTML = dafYerushalmiObject.getYerushalmiMasechta() + " " + numberToHebrew(dafYerushalmiObject.getDaf());
		}

		var seasonal = document.getElementById("SeasonalPrayers");
		seasonal.innerHTML = [
			this.jewishCalendar.tefilahRules().amidah.mechayehHametim,
			this.jewishCalendar.tefilahRules().amidah.mevarechHashanim
		].filter(Boolean).join(" / ");
		shaahZmanit.innerHTML = this.shaahZmanits();
	}

	shaahZmanits() {
		const zmanimFormatter = new KosherZmanim.ZmanimFormatter(geoLocation.getTimeZone());
		zmanimFormatter.setTimeFormat(KosherZmanim.ZmanimFormatter.SEXAGESIMAL_FORMAT);

		return `Shaah Zmanith GR'A: ${zmanimFormatter.format(this.zmanimCalendar.ComplexZmanimCalendar.getShaahZmanisGra())}
		/ MG'A: ${zmanimFormatter.format(this.zmanimCalendar.ComplexZmanimCalendar.getShaahZmanis72MinutesZmanis())}`.replace('\n', ' ')
	}

	getIsTonightStartOrEndBirchatLevana() {
		var startTimeSevenDays = this.jewishCalendar.getTchilasZmanKidushLevana7Days();
		var endTimeFifteenDays = this.jewishCalendar.getSofZmanKidushLevana15Days();

		if (this.jewishCalendar.getDate().hasSame(startTimeSevenDays, "day")) {
			return "Birchat HaLevana starts tonight";
		}
		if (this.jewishCalendar.getDate().hasSame(endTimeFifteenDays, "day")) {
			return "Last night for Birchat HaLevana";
		}
		return false;
	}

	setNextUpcomingZman() {
		const zmanim = [];
		const currentSelectedDate = this.jewishCalendar.getDate();

		for (const time of [-1, 0, 1]) {
			this.changeDate(window.luxon.DateTime.now().plus({ days: time }));
			this.addZmanim(zmanim);
		}

		this.changeDate(currentSelectedDate); //reset the date to the current date

		this.nextUpcomingZman = zmanim.find(zman => zman !== null &&
			zman.toMillis() > window.luxon.DateTime.now().toMillis() &&
			(this.nextUpcomingZman === null ||
				zman.toMillis() < this.nextUpcomingZman.toMillis()))

		this.updateZmanimList();
		//call back this function 1 second after the nextUpcomingZman passes
		setTimeout(
			this.setNextUpcomingZman,
			this.nextUpcomingZman.toMillis() - window.luxon.DateTime.now().toMillis() + 1000
		); //TODO test
	}

	initUpdaterForZmanim() {
		//at 12:00 AM the next day, update the zmanim to the next day's zmanim
		var tomorrow = window.luxon.DateTime.now().plus({ days: 1 });
		tomorrow = tomorrow.set({ hour: 0, minute: 0, second: 2, millisecond: 0 });
		var timeUntilTomorrow = tomorrow.diffNow().as("milliseconds");
		setTimeout(() => {
			var date = window.luxon.DateTime.now();
			this.jewishCalendar.setDate(date);
			this.updateZmanimList();
			this.initUpdaterForZmanim();
		}, timeUntilTomorrow);
	}

	/**
	 * @param {luxon.DateTime} zman
	 */
	isNextUpcomingZman(zman) {
		return !(this.nextUpcomingZman == null || !(zman.toMillis() == this.nextUpcomingZman.toMillis()))
	};

	/**
	 * @param {luxon.DateTime[]} zmanim
	 */
	addZmanim(zmanim) {
		const indContainers = Array.from(document.getElementById("calendarFormatter").children)
			.map(el => /** @type {HTMLElement} */(el));

		for (const timeSlot of indContainers) {
			if ((!timeSlot.hasAttribute('timeGetter')
			 || !methodNames.includes(timeSlot.getAttribute('timeGetter'))) && timeSlot.id !== 'candleLighting') {
				continue;
			}

			if (timeSlot.hasAttribute('yomTovInclusive')
			&& this.jewishCalendar.getYomTovIndex() != KosherZmanim.JewishCalendar[timeSlot.getAttribute("yomtovInclusive")]) {
				continue;
			}

			if (timeSlot.hasAttribute('luachInclusive')) {
				if (!['amudehHoraah', 'ohrHachaim'].includes(timeSlot.getAttribute('luachInclusive'))
				 || settings.calendarSource() !== timeSlot.getAttribute('luachInclusive')) {
					timeSlot.style.display = "none";
					continue;
				}
			}

			/** @type {luxon.DateTime} */
			let dateTimeForZman;
			if (timeSlot.hasAttribute('timeGetter'))
				dateTimeForZman = this.zmanimCalendar[timeSlot.getAttribute('timeGetter')]()

			/* Hardcoding below - Thankfully managed to condense this entire project away from the 2700 lines of JS it was before, but some of it still needed to stay */
			switch (timeSlot.id) {
				case 'candleLighting':
					const tzetCandle = (this.jewishCalendar.hasCandleLighting() && this.jewishCalendar.isAssurBemelacha() && this.jewishCalendar.getDayOfWeek() !== 6);
					const shabbatCandles = ((this.jewishCalendar.hasCandleLighting() && !this.jewishCalendar.isAssurBemelacha()) || this.jewishCalendar.getDayOfWeek() === 6);
	
					if (!tzetCandle && !shabbatCandles)
						continue;
	
					if (tzetCandle)
						dateTimeForZman = this.zmanimCalendar.getTzait()
					else if (shabbatCandles)
						dateTimeForZman = this.zmanimCalendar.getCandleLighting();
					break;
				case 'rt':
					dateTimeForZman = dateTimeForZman.set({second: 0}).plus({minutes: 1})
			}

			if (timeSlot.hasAttribute('condition')) {
				switch (timeSlot.getAttribute('condition')) {
					// Default: isTaanis - Cannot use that method because we're supposed to exclude YomKippur
					case 'isTaanit':
						if (!(this.jewishCalendar.isTaanis() && this.jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_KIPPUR))
							continue;
				}
			}

			zmanim.push(dateTimeForZman);
		}
	}
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

const geoLocation = new KosherZmanim.GeoLocation(
	geoLocationBase.locationName,
	geoLocationBase.lat,
	geoLocationBase.long,
	geoLocationBase.elevation,
	geoLocationBase.timezone
);

const zmanimListUpdater2 = new zmanimListUpdater(geoLocation)
zmanimListUpdater2.updateZmanimList()

