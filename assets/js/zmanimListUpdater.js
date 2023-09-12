// @ts-check

import * as KosherZmanim from "./libraries/kosher-zmanim.esm.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim, methodNames } from "./ROYZmanim.js";
import WebsiteCalendar from "./WebsiteCalendar.js";
import { settings } from "./settings/handler.js";
import { ChaiTables } from "./chaiTables.js";

class zmanimListUpdater {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.jewishCalendar = new WebsiteCalendar();
		this.jewishCalendar.setUseModernHolidays(true);
		this.jewishCalendar.setUpDateFormatter();

		this.resetCalendar(geoLocation);

		/**
		 * @type {null|luxon.DateTime}
		 */
		this.nextUpcomingZman = null;

		this.buttonsInit = false;

		// this.updateZmanimList();
	}

	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	resetCalendar(geoLocation = this.geoLocation) {
		this.geoLocation = geoLocation;

		document.querySelectorAll('[zfReplace="LocationName"]')
			.forEach(locationName => locationName.innerHTML = geoLocation.getLocationName() || "No Location Name Provided");

		this.jewishCalendar.setInIsrael(geoLocation.getLocationName().toLowerCase().includes('israel'));

		if (!this.jewishCalendar.getInIsrael() && settings.calendarToggle.hourCalculators() == "degrees") {
			document.querySelector('[zfFind="luachAmudehHoraah"]').style.removeProperty('display')
			document.querySelector('[zfFind="luachOhrHachaim"]').style.display = 'none';
			this.zmanMethods = new AmudehHoraahZmanim(geoLocation)
		} else {
			document.querySelector('[zfFind="luachOhrHachaim"]').style.removeProperty('display')
			document.querySelector('[zfFind="luachAmudehHoraah"]').style.display = 'none';
			this.zmanMethods = new OhrHachaimZmanim(geoLocation, true)
		}

		this.zmanMethods.coreCZC.setCandleLightingOffset(settings.candleLighting());

		this.zmanMethods.coreCZC.setDate(this.jewishCalendar.getDate());

        this.dtF = new Intl.DateTimeFormat(settings.language() == 'hb' ? 'he' : 'en', {
			hourCycle: settings.timeFormat(),
			timeStyle: settings.seconds() ? "medium" : "short",
			timeZone: geoLocation.getTimeZone()
		});

		this.chaiTableInfo = new ChaiTables(this.geoLocation);
		this.chaiTableInfo.initForm();

		this.setNextUpcomingZman();
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
		/** @type {{primary: string|null; secondary: string|null; other: string|null}} */
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

		/** @type {(keyof date)[]} */
		// @ts-ignore
		const dateKeys = Object.keys(date);
		for (const dateName of dateKeys) {
			dateContainer.querySelector(`[zfReplace="${dateName}Date"]`).innerHTML = date[dateName]
		}

		const boldDateHandler = this.zmanMethods.coreCZC.getDate().hasSame(window.luxon.DateTime.local(), "day").toString() ? 'add' : 'remove'
		dateContainer.classList[boldDateHandler]("text-bold");

		if (!this.buttonsInit) {
			for (const dateChanger of Array.from(dateContainer.getElementsByTagName('button')).filter(btn => btn.hasAttribute('dateAlter'))) {
				dateChanger.addEventListener("click", () => {
					this.changeDate(this.jewishCalendar.clone().getDate().plus({ days: parseInt(dateChanger.getAttribute("dateAlter")) }))
					this.updateZmanimList();
				})
			}

			for (const calendarBtn of dateContainer.getElementsByTagName('input')) {
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
		for (const mourningDiv of document.querySelectorAll('[zfFind="MourningPeriod"]')) {
			if (!(mourningDiv instanceof HTMLElement))
				continue;

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

				const omerInfo = this.jewishCalendar.getOmerInfo();

				// Hebrew
				mourningDiv.querySelector('[zfReplace="hbOmerDate"]').innerHTML =
					omerInfo.title.hb.mainCount;

				const hbDescription = mourningDiv.querySelector('[zfReplace="hbOmerDays"]');
				if (this.jewishCalendar.getDayOfOmer() >= 7) {
					hbDescription.parentElement.style.removeProperty("display");
					hbDescription.innerHTML = omerInfo.title.hb.subCount.toString();
				} else {
					hbDescription.parentElement.style.display = 'none';
				}

				// English
				mourningDiv.querySelector('[zfReplace="etNumOmerCount"]').innerHTML =
					omerInfo.title.et.mainCount;
				const etDescription = mourningDiv.querySelector('[zfReplace="etOmer"]');
				if (this.jewishCalendar.getDayOfOmer() >= 7) {
					etDescription.parentElement.style.removeProperty("display");
					etDescription.innerHTML = omerInfo.title.et.subCount.toString();
				} else {
					etDescription.parentElement.style.display = 'none';
				}

				mourningDiv.querySelector('[zfReplace="enOrdOmerCount"]').innerHTML =
					omerInfo.title.en.mainCount;

				/** @type {HTMLElement} */
				const enDescription = mourningDiv.querySelector('[zfReplace="enOmer"]');
				if (this.jewishCalendar.getDayOfOmer() >= 7) {
					enDescription.parentElement.style.removeProperty("display");
					enDescription.innerHTML = omerInfo.title.en.subCount.toString();
				} else {
					enDescription.style.display = 'none';
				}

				/** @type {HTMLElement} */
				const omerRules = mourningDiv.querySelector('[zfFind="omerRules"]')
				if (Object.values(this.jewishCalendar.mourningHalachot()).every(elem => elem == false)) {
					omerRules.style.display = "none"
					enDescription.classList.add("mb-0")
					etDescription.parentElement.classList.add("mb-0")
					hbDescription.parentElement.classList.add("mb-0")
				} else {
					omerRules.style.removeProperty("display")
					enDescription.classList.remove("mb-0")
					etDescription.parentElement.classList.remove("mb-0")
					hbDescription.parentElement.classList.remove("mb-0")
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
		/** @type {Record<string, {display: -2|-1|0|1, code: string[], luxonObj: luxon.DateTime, title: { hb: string, en: string, "en-et": string }}>} */
		const zmanimInfo = {}

		for (const timeSlot of document.querySelector("[calendarFormatter]").children) {
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
				/** @typedef {{
					 [K in keyof typeof KosherZmanim.JewishCalendar]: typeof KosherZmanim.JewishCalendar[K] extends number ? K : never;
					}[keyof typeof KosherZmanim.JewishCalendar]} FilteredNumberType */

				/** @type {keyof Pick<typeof KosherZmanim.JewishCalendar, FilteredNumberType>} */
				// @ts-ignore
				const yomTovInclusive = timeSlot.getAttribute("yomtovInclusive")
				if (this.jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar[yomTovInclusive])
					zmanimInfo[zmanid].display = 0;
					zmanimInfo[zmanid].code.push('non-proper Yom Tov day')
			}

			if (timeSlot.hasAttribute('luachInclusive')) {
				if (!['degrees', 'seasonal'].includes(timeSlot.getAttribute('luachInclusive'))
				 || settings.calendarToggle.hourCalculators() !== timeSlot.getAttribute('luachInclusive')) {
					zmanimInfo[zmanid].display = -1;
					zmanimInfo[zmanid].code.push('wrong luach')
					continue;
				}
			}

			/** @type {luxon.DateTime} */
			if (timeSlot.hasAttribute('timeGetter')) {
				/** @typedef {{
					 [K in keyof typeof this.zmanMethods]: typeof this.zmanMethods[K] extends Function ? K : never;
					}[keyof typeof this.zmanMethods]} FilteredType */

				/** @type {keyof Pick<typeof this.zmanMethods, FilteredType>} */
				// @ts-ignore
				const getFunction = timeSlot.getAttribute('timeGetter');
				zmanimInfo[zmanid].luxonObj = this.zmanMethods[getFunction]()
			}

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
					if ((this.jewishCalendar.isAssurBemelacha() && !this.jewishCalendar.hasCandleLighting()) || this.jewishCalendar.isTaanis()) {
						zmanimInfo[zmanid].display = 0;
						zmanimInfo[zmanid].code.push("Isur Melacha Tzet")
					}
					break;
				case 'tzeitLechumra':
					if (this.jewishCalendar.isTaanis() && this.jewishCalendar.getYomTovIndex() !== KosherZmanim.JewishCalendar.YOM_KIPPUR) {
						zmanimInfo[zmanid].title.hb = "צאת תענית (צאת הכוכבים)";
						zmanimInfo[zmanid].title['en-et'] = "Tzeit Ta'anith (Tzeit Hakochavim)";
						zmanimInfo[zmanid].title.en = "Fast Ends (Nightfall)";
					} else {
						zmanimInfo[zmanid].title.hb = "צאת הכוכבים לחומרא";
						zmanimInfo[zmanid].title['en-et'] = "Tzait Hakokhavim LeKhumra";
						zmanimInfo[zmanid].title.en = "Nightfall (Stringent)";
					}
					break;
				case 'tzeitTaanitLChumra':
					if (!settings.calendarToggle.tzeitTaanitHumra()) {
						zmanimInfo[zmanid].display = 0;
						zmanimInfo[zmanid].code.push("Settings-Hidden")
					}
					break;
				case 'rt':
					if (zmanimInfo[zmanid].luxonObj?.isValid) {
						if (zmanimInfo[zmanid].luxonObj.toMillis() == this.zmanMethods.getTzait72Zmanit().toMillis()) {
							zmanimInfo[zmanid].title.hb = 'ר"ת (זמנית)';
							zmanimInfo[zmanid].title['en-et'] = "Rabbeinu Tam (Zmanit)";
							zmanimInfo[zmanid].title.en = "Rabbeinu Tam (Seasonal)";
						} else {
							zmanimInfo[zmanid].title.hb = 'ר"ת (קבוע)';
							zmanimInfo[zmanid].title['en-et'] = "Rabbeinu Tam (Kavuah)";
							zmanimInfo[zmanid].title.en = "Rabbeinu Tam (Fixed)";
						}
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

			if (!zmanimInfo[zmanid].luxonObj || !zmanimInfo[zmanid].luxonObj.isValid) {
				zmanimInfo[zmanid].display = -2;
				if (zmanimInfo[zmanid].luxonObj)
					zmanimInfo[zmanid].code.push(
						'LUXON: ' + zmanimInfo[zmanid].luxonObj.invalidReason,
						'LUXON: ' + zmanimInfo[zmanid].luxonObj.invalidExplanation
					);
				else
					zmanimInfo[zmanid].code.push("Invalid Date");
			}
		}

		return zmanimInfo;
	}

	updateZmanimList() {
		for (let dateContainer of document.querySelectorAll('[zfFind="dateContainer"]')) {
			if (dateContainer instanceof HTMLElement)
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

		const tekufaToday = this.jewishCalendar.getTekufa();
		const tekufaNextDay = this.jewishCalendar.tomorrow().getTekufa();
		if (
			(!tekufaToday && !tekufaNextDay) || //if no tekufa today or tomorrow
			(!tekufaToday &&
				this.jewishCalendar.tomorrow().getTekufaAsDate(settings.calendarToggle.tekufa() == "hatzoth").toJSDate().toLocaleDateString() !==
				this.jewishCalendar.getDate().toJSDate().toLocaleDateString()) || //if no tekufa today but there is one tomorrow and it's not today
			(!tekufaNextDay &&
				this.jewishCalendar.getTekufaAsDate(settings.calendarToggle.tekufa() == "hatzoth").toJSDate().toLocaleDateString() !==
				this.jewishCalendar.getDate().toJSDate().toLocaleDateString())
		) {
			// if no tekufa tomorrow but there is one today and it's not today
			document.querySelectorAll('[zfFind="Tekufa"]').forEach(
				(/**@type {HTMLElement} */tekufa) => tekufa.style.display = "none"
			)
		} else {
			const timeBase = (
				tekufaToday !== null &&
					this.jewishCalendar.getTekufaAsDate(settings.calendarToggle.tekufa() == "hatzoth").toJSDate().toLocaleDateString() ===
					this.jewishCalendar.getDate().toJSDate().toLocaleDateString()
					? this.jewishCalendar.getTekufaAsDate(settings.calendarToggle.tekufa() == "hatzoth") : this.jewishCalendar.tomorrow().getTekufaAsDate(settings.calendarToggle.tekufa() == "hatzoth"));

			//0 for Tishrei, 1 for Tevet, 2, for Nissan, 3 for Tammuz
			const tekufaID = this.jewishCalendar.getTekufaID() || this.jewishCalendar.tomorrow().getTekufaID()

			for (let tekufa of document.querySelectorAll('[zfFind="Tekufa"]')) {
				if (!(tekufa instanceof HTMLElement))
					continue;

				tekufa.style.removeProperty("display");

				Array.from(tekufa.querySelectorAll('[zfReplace="tekufaTime"]')).forEach(element => element.innerHTML = timeBase.toJSDate().toLocaleTimeString());

				Array.from(tekufa.querySelectorAll('[zfReplace="tekufaName-en"]')).forEach(element => element.innerHTML = this.jewishCalendar.getTekufaName(tekufaID).english);
				tekufa.querySelector('[zfReplace="tekufaName-hb"]').innerHTML = this.jewishCalendar.getTekufaName(tekufaID).hebrew;
			}
		}

		const zmanInfo = this.getZmanimInfo();
		for (const calendarContainer of document.querySelectorAll('[calendarFormatter]')) {
			for (const timeSlot of calendarContainer.children) {
				if (!(timeSlot instanceof HTMLElement))
					continue;

				if (!timeSlot.hasAttribute('zmanid')) {
					timeSlot.style.display = 'none';
					continue;
				}

				const zmanId = timeSlot.getAttribute('zmanid');
				if (zmanInfo[zmanId].display == -1) {
					timeSlot.style.display = 'none';
					continue;
				}

				if (zmanInfo[zmanId].display == -2) {
					timeSlot.style.removeProperty("display");
					timeSlot.querySelector('.timeDisplay').innerHTML = "XX:XX"
					continue;
				}

				const actionToClass = (this.isNextUpcomingZman(zmanInfo[zmanId].luxonObj) ? "add" : "remove")
				timeSlot.classList[actionToClass]("nextZman")

				timeSlot.querySelector('.timeDisplay').innerHTML = this.dtF.format(zmanInfo[zmanId].luxonObj.toJSDate())

				/* if (timeSlot.hasAttribute('specialDropdownContent')) {
					const description = timeSlot.querySelector('.accordianContent');
					description.innerHTML = description.innerHTML
						.replaceAll('${getAteretTorahSunsetOffset()}', this.zmanMethods.coreCZC.getAteretTorahSunsetOffset().toString())
						.replaceAll('${getCandleLightingOffset()}', this.zmanMethods.coreCZC.getCandleLightingOffset().toString())
				} */

				if (zmanInfo[zmanId].title.hb)
					timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[zmanId].title.hb

				if (zmanInfo[zmanId].title.en)
					timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[zmanId].title.en

				if (zmanInfo[zmanId].title["en-et"])
					timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[zmanId].title["en-et"]

				// Calculate but hide! Can be derived via Inspect Element
				if (!zmanInfo[zmanId].display)
					timeSlot.style.display = 'none';
				else
					timeSlot.style.removeProperty('display')
			}
		}

		for (let dafContainer of document.querySelectorAll('[zfFind="DafYomi"]')) {
			if (dafContainer instanceof HTMLElement)
				this.renderDafYomi(dafContainer);
		}

		const seasonalRules = [
			this.jewishCalendar.tefilahRules().amidah.mechayehHametim,
			this.jewishCalendar.tefilahRules().amidah.mevarechHashanim
		];
		document.querySelectorAll('[zfReplace="SeasonalPrayers"]').forEach((seasonal) => seasonal.innerHTML = seasonalRules.filter(Boolean).join(" / "))
		
		this.shaahZmanits();
	}

	/**
	 * @param {HTMLElement} [dafContainer]
	 */
	renderDafYomi(dafContainer) {
		const daf = dafContainer.querySelector('[zfReplace="dafBavli"]');
		const dafYerushalmi = dafContainer.querySelector('[zfReplace="DafYerushalmi"]');

		if (this.jewishCalendar.getJewishYear() < 5684) {
			daf.innerHTML = "N/A. Daf Yomi (Bavli) was only created on Rosh Hashanah 5684 and continues onto this day"
		} else {
			const dafObject = KosherZmanim.YomiCalculator.getDafYomiBavli(this.jewishCalendar);
			daf.innerHTML =
				dafObject.getMasechta() + " " +
				numberToHebrew(dafObject.getDaf());
		}

		var dafYerushalmiObject = KosherZmanim.YerushalmiYomiCalculator.getDafYomiYerushalmi(this.jewishCalendar);
		if (dafYerushalmiObject.getDaf() == 0 || !dafYerushalmiObject) {
			dafYerushalmi.innerHTML = "N/A";
		} else {
			dafYerushalmi.innerHTML = dafYerushalmiObject.getYerushalmiMasechta() + " " + numberToHebrew(dafYerushalmiObject.getDaf());
		}
	}

	shaahZmanits() {
		const zmanimFormatter = new KosherZmanim.ZmanimFormatter(geoLocation.getTimeZone());
		zmanimFormatter.setTimeFormat(KosherZmanim.ZmanimFormatter.SEXAGESIMAL_FORMAT);

		document.querySelectorAll('[zfReplace="mgaShaahZmanit"]')
			.forEach(mgaLi => mgaLi.innerHTML = zmanimFormatter.format(this.zmanMethods.coreCZC.getTemporalHour(this.zmanMethods.getAlotHashachar(), this.zmanMethods.getTzait72Zmanit())));

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
			zmanim.push(...Object.values(this.getZmanimInfo()).filter(obj => obj.display == 1 && obj.luxonObj && obj.luxonObj.isValid).map(time => time.luxonObj));
		}

		this.changeDate(currentSelectedDate); //reset the date to the current date

		this.nextUpcomingZman = zmanim.find(zman => zman.toMillis() > window.luxon.DateTime.now().toMillis())

		//call back this function 1 second after the nextUpcomingZman passes
		setTimeout(
			() => {this.setNextUpcomingZman(); this.updateZmanimList()},
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

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const zmanimListUpdater2 = new zmanimListUpdater(geoLocation)
zmanimListUpdater2.updateZmanimList()

window.zmanimListUpdater2 = zmanimListUpdater2;