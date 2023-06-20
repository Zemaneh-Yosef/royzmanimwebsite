// @ts-check

// Comment the following few lines before going live
import * as KosherZmanim from "./libraries/dev/bundle.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim, methodNames } from "./ROYZmanim.js";
import WebsiteCalendar from "./WebsiteCalendar.js";
import n2words from "./libraries/n2wordsrollup.js";
import { settings } from "./settings.js";

class zmanimListUpdater {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		document.querySelectorAll('[zfReplace="LocationName"]')
			.forEach(locationName => locationName.innerHTML = geoLocation.getLocationName() || "No Location Name Provided");

		this.zmanMethods = (settings.calendarSource() == "amudehHoraah" ? new AmudehHoraahZmanim(geoLocation) : new OhrHachaimZmanim(geoLocation, true));
		this.zmanMethods.coreCZC.setCandleLightingOffset(settings.candleLighting());
		this.zmanMethods.coreCZC.setAteretTorahSunsetOffset(settings.tzeith());

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

		this.buttonsInit = false;

		this.setNextUpcomingZman();
		// this.updateZmanimList();
	}

	/**
	 * @param {luxon.DateTime} date
	 */
	changeDate(date) {
		this.zmanMethods.coreCZC.setDate(date)
		this.jewishCalendar.setDate(date)
	}

	/**
	 * @param {HTMLElement} [dateContainer]
	 */
	renderDateContainer(dateContainer) {
		let date = {primary: null, secondary: null, other: null}

		switch (settings.language()) {
			case 'hb':
			default:
				date.primary = this.jewishCalendar.formatJewishDate().hebrew;
				date.secondary = this.jewishCalendar.getDate().toLocaleString(window.luxon.DateTime.DATE_FULL);
				date.other = this.jewishCalendar.formatJewishDate().english;
				break;
			case 'en-et':
				date.primary = this.jewishCalendar.formatJewishDate().english;
				date.secondary = this.jewishCalendar.getDate().toLocaleString(window.luxon.DateTime.DATE_FULL);
				date.other = this.jewishCalendar.formatJewishDate().hebrew;
				break;
			case 'en':
				date.primary = this.jewishCalendar.getDate().toLocaleString(window.luxon.DateTime.DATE_FULL);
				date.secondary = this.jewishCalendar.formatJewishDate().english;
				date.other = this.jewishCalendar.formatJewishDate().hebrew;
				break;
		}

		for (const dateName of Object.keys(date)) {
			console.log(dateName);
			dateContainer.querySelector(`[zfReplace="${dateName}Date"]`).innerHTML = date[dateName]
		}

		const boldDateHandler = this.zmanMethods.coreCZC.getDate().hasSame(window.luxon.DateTime.local(), "day").toString() ? 'add' : 'remove'
		dateContainer.classList[boldDateHandler]("text-bold");

		if (!this.buttonsInit) {
			for (const dateChanger of document.getElementsByTagName('button')) {
				dateChanger.addEventListener("click", () => {
					this.changeDate(this.jewishCalendar.clone().getDate().plus({ days: parseInt(dateChanger.getAttribute("dateAlter")) }))
					this.updateZmanimList();
				})
			}

			for (const calendarBtn of document.getElementsByTagName('input')) {
				calendarBtn.addEventListener('calendarInsert', () => {
					const dateObject = window.luxon.DateTime.fromFormat(calendarBtn.getAttribute("date-value"), "MM/dd/yyyy");
		
					this.changeDate(dateObject);
					this.updateZmanimList();
				})
			}

			this.buttonsInit = true;
		}
	}

	writeMourningPeriod() {
		const mourningDisplays = Array.from(document.querySelectorAll('[zfFind="MourningPeriod"]'))
			.map(el => /** @type {HTMLElement} */(el));

		for (const mourningDiv of mourningDisplays) {
			if (!this.jewishCalendar.isMourningPeriod()) {
				mourningDiv.style.display = "none";
				return;
			}
			mourningDiv.style.removeProperty("display");

			/** @type {HTMLElement} */
			const sefirathHaomer = mourningDiv.querySelector('[zfFind="SefirathHaomer"]');

			/** @type {HTMLElement} */
			const threeWeeks = mourningDiv.querySelector('[zfFind="ThreeWeeksHeader"]');
			if (this.jewishCalendar.getDayOfOmer() !== -1) {
				sefirathHaomer.style.removeProperty("display");
				threeWeeks.style.display = "none";

				const weeks = Math.floor(this.jewishCalendar.getDayOfOmer() / 7);
				const days = this.jewishCalendar.getDayOfOmer() % 7;

				// Hebrew Attributes
				const hbName = n2words(this.jewishCalendar.getDayOfOmer());

				/** @type {HTMLElement} */
				const hbNameElem = mourningDiv.querySelector('[zfReplace="hbOmerDate"]');

				const dayWords = ["יום", "ימים"]
				const verb = dayWords[(this.jewishCalendar.getDayOfOmer() >= 2 && this.jewishCalendar.getDayOfOmer() <= 10 ? 1 : 0)];

				const hbTitle = [hbName, verb];
				if (this.jewishCalendar.getDayOfOmer() == 1)
					hbTitle.reverse()

				hbNameElem.innerHTML = hbTitle.join(" ")

				/** @type {HTMLElement} */
				const hbDescription = mourningDiv.querySelector('[zfReplace="hbOmerDays"]');
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
				mourningDiv.querySelector('[zfReplace="etNumOmerCount"]').innerHTML =
					this.jewishCalendar.getDayOfOmer() + " day" + (this.jewishCalendar.getDayOfOmer() >= 2 ? "s" : '');
				const etDescription = mourningDiv.querySelector('[zfReplace="etOmer"]');
				if (this.jewishCalendar.getDayOfOmer() >= 7) {
					etDescription.parentElement.style.removeProperty("display");

					etDescription.innerHTML = (weeks == 1 ? "is a week" : "are " + weeks + " weeks")
					if (days)
						etDescription.innerHTML += " and " + (days == 1 ? "a day" : days + " days");
				} else {
					etDescription.parentElement.style.display = 'none';
				}

				mourningDiv.querySelector('[zfReplace="enOrdOmerCount"]').innerHTML = this.jewishCalendar.getTitleDayOfOmer();

				/** @type {HTMLElement} */
				const enDescription = mourningDiv.querySelector('[zfReplace="enOmer"]');
				if (this.jewishCalendar.getDayOfOmer() >= 7) {
					enDescription.parentElement.style.removeProperty("display");

					const descEngText = [weeks + " week" + (weeks !== 1 ? "s" : "")];
					if (days)
						descEngText.push(days + " day" + (days !== 1 ? "s" :""))

					enDescription.innerHTML = descEngText.join(" • ")
				} else {
					enDescription.style.display = 'none';
				}

				/** @type {HTMLElement} */
				const omerRules = mourningDiv.querySelector('[zfFind="enOmer"]')
				if (Object.values(this.jewishCalendar.mourningHalachot()).every(elem => elem == false)) {
					omerRules.style.display = "none"
					enDescription.classList.add("pb-0")
					etDescription.parentElement.classList.add("pb-0")
					hbDescription.parentElement.classList.add("pb-0")
				} else {
					omerRules.style.removeProperty("display")
					enDescription.classList.remove("pb-0")
					etDescription.parentElement.classList.remove("pb-0")
					hbDescription.parentElement.classList.remove("pb-0")
				}
			} else {
				sefirathHaomer.style.display = 'none';
				threeWeeks.style.removeProperty("display");

				/** @type {HTMLElement[]} */
				const threeWeeksText = Array.from(threeWeeks.querySelectorAll('[zfFind="threeWeeks"]'));
				/** @type {HTMLElement[]} */
				const nineDaysText = Array.from(threeWeeks.querySelectorAll('[zfFind="nineDays"]'));
				/** @type {HTMLElement[]} */
				const weekOfText = Array.from(threeWeeks.querySelectorAll('[zfFind="weekOf"]'));

				if (this.jewishCalendar.isShvuaShechalBo()) {
					weekOfText.forEach((elem) => elem.style.removeProperty("display"));

					([nineDaysText, threeWeeksText]).flat()
						.forEach((elem) => elem.style.display = "none")
				} else if (this.jewishCalendar.getJewishMonth() == KosherZmanim.JewishCalendar.AV) {
					nineDaysText.forEach((elem) => elem.style.removeProperty("display"));

					([weekOfText, threeWeeksText]).flat()
						.forEach((elem) => elem.style.display = "none")
				} else {
					threeWeeksText.forEach((elem) => elem.style.removeProperty("display"));

					([weekOfText, nineDaysText]).flat()
						.forEach((elem) => elem.style.display = "none")
				}
			}


			for (const [key, value] of Object.entries(this.jewishCalendar.mourningHalachot())) {
				/** @type {HTMLElement} */
				const halachaIndex = mourningDiv.querySelector(`[zfFind="${key}"]`);

				if (value)
					halachaIndex.style.removeProperty("display")
				else
					halachaIndex.style.display = "none"
			}
		}
	}

	getZmanimInfo() {
		/** @type {Record<string, {display: -1|0|1, code: string[], luxonObj: luxon.DateTime, title: { hb: string, en: string, "en-et": string }}>} */
		const zmanimInfo = {}

		const indContainers = Array.from(document.querySelector("[calendarFormatter]").children)
			.map(el => /** @type {HTMLElement} */(el));

		for (const timeSlot of indContainers) {
			if (!timeSlot.hasAttribute("zmanid"))
				continue;

			const zmanid = timeSlot.getAttribute('zmanid');

			zmanimInfo[zmanid] = {
				display: 1,
				code: [],
				luxonObj: null,
				title: {
					hb: null,
					en: null,
					"en-et": null
				}
			}

			if ((!timeSlot.hasAttribute('timeGetter')
			 || !methodNames.includes(timeSlot.getAttribute('timeGetter'))) && zmanid !== 'candleLighting') {
				zmanimInfo[zmanid].display = -1;
				zmanimInfo[zmanid].code.push('timeGetter unfound');
				continue;
			}

			if (timeSlot.hasAttribute('yomTovInclusive')) {
				if (this.jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar[timeSlot.getAttribute("yomtovInclusive")])
					zmanimInfo[zmanid].display = 0;
					zmanimInfo[zmanid].code.push('non-proper Yom Tov day')
			}

			if (timeSlot.hasAttribute('luachInclusive')) {
				if (!['amudehHoraah', 'ohrHachaim'].includes(timeSlot.getAttribute('luachInclusive'))
				 || settings.calendarSource() !== timeSlot.getAttribute('luachInclusive')) {
					zmanimInfo[zmanid].display = -1;
					zmanimInfo[zmanid].code.push('wrong luach')
					continue;
				}
			}

			/** @type {luxon.DateTime} */
			if (timeSlot.hasAttribute('timeGetter'))
				zmanimInfo[zmanid].luxonObj = this.zmanMethods[timeSlot.getAttribute('timeGetter')]()

			/* Hardcoding below - Thankfully managed to condense this entire project away from the 2700 lines of JS it was before, but some of it still needed to stay */
			switch (zmanid) {
				case 'candleLighting':
					const tzetCandle = (this.jewishCalendar.hasCandleLighting() && this.jewishCalendar.isAssurBemelacha() && this.jewishCalendar.getDayOfWeek() !== 6);
					const shabbatCandles = ((this.jewishCalendar.hasCandleLighting() && !this.jewishCalendar.isAssurBemelacha()) || this.jewishCalendar.getDayOfWeek() === 6);

					if (!tzetCandle && !shabbatCandles) {
						zmanimInfo[zmanid].display = -1;
						zmanimInfo[zmanid].code.push('not-shabbat')
						continue;
					} else
						zmanimInfo[zmanid].luxonObj = this.zmanMethods[(tzetCandle ? "getTzait" : "getCandleLighting")]()

					break;
				case 'tzeitShabbat':
					if (this.jewishCalendar.isAssurBemelacha() && !this.jewishCalendar.hasCandleLighting()) {
						if (this.jewishCalendar.isYomTovAssurBemelacha() && this.jewishCalendar.getDayOfWeek() == 7) {
							zmanimInfo[zmanid].title.hb = "צאת השבת וחג";
							zmanimInfo[zmanid].title['en-et'] = "Tzait Shabbat & Yom Tov";
							zmanimInfo[zmanid].title.en = "Shabbat & Yom Tov Ends";
						} else if (this.jewishCalendar.getDayOfWeek() == 7) {
							zmanimInfo[zmanid].title.hb = "צאת השבת";
							zmanimInfo[zmanid].title['en-et'] = "Tzait Shabbat";
							zmanimInfo[zmanid].title.en = "Shabbat Ends";
						} else {
							zmanimInfo[zmanid].title.hb = "צאת חג";
							zmanimInfo[zmanid].title['en-et'] = "Tzait Yom Tov";
							zmanimInfo[zmanid].title.en = "Yom Tov Ends";
						}
					} else {
						zmanimInfo[zmanid].display = 0;
						zmanimInfo[zmanid].code.push("Not a day with Tzet")
					}
					break;
				case 'tzeit':
					if (this.jewishCalendar.isAssurBemelacha() && !this.jewishCalendar.hasCandleLighting()) {
						zmanimInfo[zmanid].display = 0;
						zmanimInfo[zmanid].code.push("Isur Melacha Tzet")
					}
			}

			if (timeSlot.hasAttribute('condition')) {
				switch (timeSlot.getAttribute('condition')) {
					// Default: isTaanis - Cannot use that method because we're supposed to exclude YomKippur
					case 'isTaanit':
						if (!(this.jewishCalendar.isTaanis() && this.jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_KIPPUR)) {
							zmanimInfo[zmanid].display = 0;
							zmanimInfo[zmanid].code.push("Not a fast day")
						}
				}
			}
		}

		return zmanimInfo;
	}

	updateZmanimList() {
		const dateContainers = Array.from(document.querySelectorAll('[zfFind="dateContainer"]'))
			.map(elem => /** @type {HTMLElement} */(elem));
	
		for (let dateContainer of dateContainers) {
			this.renderDateContainer(dateContainer);
		}

		document.querySelectorAll('[zfReplace="Parasha"]').forEach(
			(/**@type {HTMLElement} */ elem) => elem.innerHTML = this.jewishCalendar.getHebrewParasha().join(" / ")
		);

		document.querySelectorAll('[zfReplace="Day"]').forEach(
			(/**@type {HTMLElement} */ elem) => elem.innerHTML = Object.values(this.jewishCalendar.getDayOfTheWeek()).join(" / ")
		)

		const specialDayText = this.jewishCalendar.listOfSpecialDays();
		document.querySelectorAll('[zfReplace="SpecialDay"]').forEach(
			(/**@type {HTMLElement} */specialDay) => {
				if (!specialDayText.length) {
					specialDay.style.display = "none";
				} else {
					specialDay.style.removeProperty("display");
					specialDay.innerHTML = specialDayText.join(" / ");
				}
			}
		)

		this.writeMourningPeriod();

		document.querySelectorAll('[zfReplace="Ulchaparat"]').forEach(
			(/**@type {HTMLElement} */ulchaparat) => {
				if (this.jewishCalendar.isRoshChodesh()) {
					ulchaparat.style.removeProperty("display");
					ulchaparat.innerHTML = (this.jewishCalendar.tefilahRules().amidah.ulChaparatPesha ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע")
				} else {
					ulchaparat.style.display = "none";
				}
			}
		)

		document.querySelectorAll('[zfFind="Chamah"]').forEach(
			(/**@type {HTMLElement} */chamah) => {
				if (this.jewishCalendar.isBirkasHachamah()) {
					chamah.style.removeProperty("display");
				} else {
					chamah.style.display = "none";
				}
			}
		)

		document.querySelectorAll('[zfFind="BirchatHalevana"]').forEach(
			(/**@type {HTMLElement} */birchatHalevana) => {
				if (this.birkathHalevanaCheck()) {
					birchatHalevana.style.removeProperty("display");
				} else {
					birchatHalevana.style.display = "none";
				}
			}
		)

		document.querySelectorAll('[zfReplace="Tachanun"]').forEach(
			(/**@type {HTMLElement} */tachanun) => {
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
			}
		)

		const hallelText = this.jewishCalendar.tefilahRules().hallel;
		document.querySelectorAll('[zfReplace="Hallel"]').forEach(
			(/**@type {HTMLElement} */hallel) => {
				if (!hallelText) {
					hallel.style.display = "none";
				} else {
					hallel.style.removeProperty("display");
					hallel.innerHTML = hallelText == 2 ? "הלל שלם (עם ברכה)" : "חצי הלל (בלי ברכה)";
				}
			}
		)

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
			document.querySelectorAll('[zfReplace="Tekufa"]').forEach(
				(/**@type {HTMLElement} */tekufa) => tekufa.style.display = "none"
			)
		} else {
			const timeBase = (
				tekufaToday !== null &&
					this.jewishCalendar.getTekufaAsDate(settings.calendarSource() == "amudehHoraah").toLocaleDateString() ===
					this.jewishCalendar.getDate().toJSDate().toLocaleDateString()
					? this.jewishCalendar.getTekufaAsDate(settings.calendarSource() == "amudehHoraah") : this.jewishCalendar.tomorrow().getTekufaAsDate(settings.calendarSource() == "amudehHoraah"));

			//0 for Tishrei, 1 for Tevet, 2, for Nissan, 3 for Tammuz
			const tekufaID = this.jewishCalendar.getTekufaID() || this.jewishCalendar.tomorrow().getTekufaID()

			document.querySelectorAll('[zfReplace="Tekufa"]').forEach(
				(/**@type {HTMLElement} */tekufa) => {
					tekufa.style.removeProperty("display");

					Array.from(tekufa.getElementsByClassName('tekufaName-en')).forEach(element => element.innerHTML = this.jewishCalendar.getTekufaName(tekufaID).english);
					Array.from(tekufa.getElementsByClassName('tekufaTime')).forEach(element => element.innerHTML = timeBase.toLocaleTimeString());
					tekufa.querySelector('#tekufaName-hb').innerHTML = this.jewishCalendar.getTekufaName(tekufaID).hebrew;
				}
			)
		}

		let timeFormat = "HH:mm" + (settings.seconds() ? ":ss" : '');
		if (settings.timeFormat() == "12")
			timeFormat = timeFormat.replace('HH', 'h') + ' a';

		const zmanInfo = this.getZmanimInfo();
		for (const calendarContainer of document.querySelectorAll('[calendarFormatter]')) {
			for (const timeSlot of Array.from(calendarContainer.children).map(el => /** @type {HTMLElement} */(el))) {
				if (!timeSlot.hasAttribute('zmanid')) {
					timeSlot.style.display = 'none';
					continue;
				}

				const zmanId = timeSlot.getAttribute('zmanid');
				if (zmanInfo[zmanId].display == -1) {
					timeSlot.style.display = 'none';
					continue;
				}

				const actionToClass = (this.isNextUpcomingZman(zmanInfo[zmanId].luxonObj) ? "add" : "remove")
				timeSlot.classList[actionToClass]("nextZman")

				timeSlot.querySelector('.timeDisplay').innerHTML = zmanInfo[zmanId].luxonObj.setZone(geoLocation.getTimeZone()).toFormat(timeFormat)

				if (timeSlot.hasAttribute('specialDropdownContent')) {
					const description = timeSlot.querySelector('.accordianContent');
					description.innerHTML = description.innerHTML
						.replaceAll('${getAteretTorahSunsetOffset()}', this.zmanMethods.coreCZC.getAteretTorahSunsetOffset().toString())
						.replaceAll('${getCandleLightingOffset()}', this.zmanMethods.coreCZC.getCandleLightingOffset().toString())
				}

				// Calculate but hide! Can be derived via 
				if (!zmanInfo[zmanId].display)
					timeSlot.style.display = 'none';
			}
		}

		const dafYomiContainers = Array.from(document.querySelectorAll('[zfFind="DafYomi"]'))
			.map(elem => /** @type {HTMLElement} */(elem));
	
		for (let dafContainer of dafYomiContainers) {
			this.renderDafYomi(dafContainer);
		}

		const seasonalRules = [
			this.jewishCalendar.tefilahRules().amidah.mechayehHametim,
			this.jewishCalendar.tefilahRules().amidah.mevarechHashanim
		];
		document.querySelectorAll('[zfReplace="SeasonalPrayers"]').forEach(
			(/**@type {HTMLElement} */seasonal) => 
				seasonal.innerHTML = seasonalRules.filter(Boolean).join(" / ")
		)
		
		this.shaahZmanits();
	}

	/**
	 * @param {HTMLElement} [dafContainer]
	 */
	renderDafYomi(dafContainer) {
		var daf = dafContainer.querySelector('[zfReplace="dafBavli"]');
		var dafYerushalmi = dafContainer.querySelector('[zfReplace="DafYerushalmi"]');

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
	}

	shaahZmanits() {
		const zmanimFormatter = new KosherZmanim.ZmanimFormatter(geoLocation.getTimeZone());
		zmanimFormatter.setTimeFormat(KosherZmanim.ZmanimFormatter.SEXAGESIMAL_FORMAT);

		document.querySelectorAll('[zfReplace="mgaShaahZmanit"]')
			.forEach(mgaLi => mgaLi.innerHTML = zmanimFormatter.format(this.zmanMethods.coreCZC.getShaahZmanis72MinutesZmanis()));

		document.querySelectorAll('[zfReplace="graShaahZmanit"]')
			.forEach(graLi => graLi.innerHTML = zmanimFormatter.format(this.zmanMethods.coreCZC.getShaahZmanisGra()));
	}

	birkathHalevanaCheck() {
		const dateObjs = {
			start: this.jewishCalendar.getTchilasZmanKidushLevana7Days(),
			end: this.jewishCalendar.getSofZmanKidushLevana15Days(),
			current: this.jewishCalendar.getDate()
		}

		const geoLocation = this.zmanMethods.coreCZC.getGeoLocation()
		const monthCalc = (this.zmanMethods instanceof AmudehHoraahZmanim ? new AmudehHoraahZmanim(geoLocation) : new OhrHachaimZmanim(geoLocation, true));
		monthCalc.coreCZC.setCandleLightingOffset(settings.candleLighting());
		monthCalc.coreCZC.setAteretTorahSunsetOffset(settings.tzeith());

		switch (this.jewishCalendar.getJewishMonth()) {
			case KosherZmanim.JewishCalendar.AV:
				const tishaBeav = this.jewishCalendar.clone()
				tishaBeav.setJewishDayOfMonth(9)
				if (tishaBeav.getDayOfWeek() == 7)
					tishaBeav.setJewishDayOfMonth(10);

				monthCalc.coreCZC.setDate(tishaBeav.getDate())
				dateObjs.start = monthCalc.getShkiya();
				break;
			case KosherZmanim.JewishCalendar.TISHREI:
				const yomKippur = this.jewishCalendar.clone()
				yomKippur.setJewishDayOfMonth(10)

				monthCalc.coreCZC.setDate(yomKippur.getDate())
				dateObjs.start = monthCalc.getShkiya();
				break;
		}

		const inBetween = dateObjs.current.toMillis() >= dateObjs.start.toMillis() && dateObjs.current.toMillis() <= dateObjs.end.toMillis()
		return inBetween;
	}

	setNextUpcomingZman() {
		/** @type {luxon.DateTime[]} */
		const zmanim = [];
		const currentSelectedDate = this.jewishCalendar.getDate();

		for (const time of [-1, 0, 1]) {
			this.changeDate(window.luxon.DateTime.now().plus({ days: time }));
			zmanim.push(...Object.values(this.getZmanimInfo()).filter(obj => obj.display == 1).map(time => time.luxonObj));
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

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

// @ts-ignore
const geoLocation = new KosherZmanim.GeoLocation(...Object.values(settings.location).map(numberFunc => numberFunc()));

const zmanimListUpdater2 = new zmanimListUpdater(geoLocation)
zmanimListUpdater2.updateZmanimList()

