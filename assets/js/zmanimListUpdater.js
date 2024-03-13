// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim, methodNames } from "./ROYZmanim.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import { settings } from "./settings/handler.js";
import { ChaiTables } from "./chaiTables.js";

import icsExport from "./icsHandler.js";
import { HebrewNumberFormatter } from "./WebsiteCalendar.js";

class zmanimListUpdater {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.jCal = new WebsiteLimudCalendar();
		this.jCal.setUseModernHolidays(true);

		/**
		 * @type {null|KosherZmanim.Temporal.ZonedDateTime}
		 */
		this.nextUpcomingZman = null;

		this.buttonsInit = false;

		/** @type {null|NodeJS.Timeout} */ // It's not node but whatever
		this.countdownToNextDay = null;

		this.zmanimList = Object.fromEntries(Array.from(document.querySelector('[data-zfFind="calendarFormatter"]').children)
			.map(timeSlot => [timeSlot.getAttribute('data-zmanid'), {
				function: timeSlot.getAttribute('data-timeGetter'),
				yomTovInclusive: timeSlot.getAttribute('data-yomTovInclusive'),
				luachInclusive: timeSlot.getAttribute('data-luachInclusive'),
				condition: timeSlot.getAttribute('data-condition'),
				title: {
					'hb': timeSlot.querySelector('span.lang.lang-hb').innerHTML,
					'en': timeSlot.querySelector('span.lang.lang-en').innerHTML,
					'en-et': timeSlot.querySelector('span.lang.lang-et').innerHTML
				}
			}])
			.filter(
				arrayEntry =>
					arrayEntry[0] !== null
					// @ts-ignore
				&& (arrayEntry[0] == 'candleLighting' || (arrayEntry[1].function && methodNames.includes(arrayEntry[1].function)))
			))

		this.resetCalendar(geoLocation);

		// this.updateZmanimList();
	}

	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	resetCalendar(geoLocation = this.geoLocation) {
		this.geoLocation = geoLocation;

		if (geoLocation.getLocationName()) {
			document.querySelectorAll('[data-zfReplace="LocationName"]')
				.forEach(locationName => locationName.innerHTML = geoLocation.getLocationName());

			this.jCal.setInIsrael(geoLocation.getLocationName().toLowerCase().includes('israel'));
		} else {
			document.querySelectorAll('[data-zfReplace="LocationName"]')
				.forEach(locationName => locationName.innerHTML = "No location name provided")
		}

		const amudehHoraahIndicators = [...document.querySelectorAll('[data-zfFind="luachAmudehHoraah"]')].filter(elem => elem instanceof HTMLElement);
		const ohrHachaimIndicators = [...document.querySelectorAll('[data-zfFind="luachOhrHachaim"]')].filter(elem => elem instanceof HTMLElement);
		if (!this.jCal.getInIsrael() && settings.calendarToggle.hourCalculators() == "degrees") {
			amudehHoraahIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.removeProperty('display'))
			ohrHachaimIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.display = 'none');
			this.zmanFuncs = new AmudehHoraahZmanim(geoLocation)
		} else {
			ohrHachaimIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.removeProperty('display'))
			amudehHoraahIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.display = 'none');
			this.zmanFuncs = new OhrHachaimZmanim(geoLocation, true)
		}

		this.zmanFuncs.coreZC.setCandleLightingOffset(settings.candleLighting());

		/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
		this.dtF = [settings.language() == 'hb' ? 'he' : 'en', {
			hourCycle: settings.timeFormat(),
			hour: 'numeric',
            minute: '2-digit'
		}];
		
		if (settings.seconds()) {
			this.dtF[1].second = '2-digit'
		}

		this.chaiTableInfo = new ChaiTables(this.geoLocation);
		this.chaiTableInfo.initForm();

		this.lastData = {
			'parsha': undefined,
			'day': undefined,
			'specialDay': undefined,
			'hamah': undefined,
			'levana': undefined
		}

		this.setNextUpcomingZman();
		this.changeDate(this.jCal.getDate())
	}

	/**
	 * @param {KosherZmanim.Temporal.PlainDate} date
	 * @param {boolean} internal 
	 */
	changeDate(date, internal=false) {
		this.zmanFuncs.setDate(date)
		this.jCal.setDate(date);

		if (!internal) {
			this.updateZmanimList();
		}
	}

	/**
	 * @param {HTMLElement} [dateContainer]
	 */
	renderDateContainer(dateContainer) {
		const date = this.jCal.dateRenderer(settings.language())

		/** @type {(keyof date)[]} */
		// @ts-ignore
		const dateKeys = Object.keys(date);
		for (const dateName of dateKeys) {
			dateContainer.querySelector(`[data-zfReplace="${dateName}Date"]`).innerHTML = date[dateName]
		}

		const boldDateHandler = (this.jCal.getDate().equals(KosherZmanim.Temporal.Now.plainDateISO())) ? 'add' : 'remove'
		dateContainer.classList[boldDateHandler]("text-bold");

		if (!this.buttonsInit) {
			const downloadBtn = document.getElementById("downloadModalBtn");
			downloadBtn.style.removeProperty("display")
			downloadBtn.addEventListener('click', () => {
				const geoLocationParams = [
					this.geoLocation.getLocationName(),
					this.geoLocation.getLatitude(),
					this.geoLocation.getLongitude(),
					this.geoLocation.getElevation(),
					this.geoLocation.getTimeZone()
				];
	
				const { isoDay, isoMonth, isoYear, calendar: isoCalendar } = this.zmanFuncs.coreZC.getDate().getISOFields()
	
				const icsData = icsExport(
					this.zmanFuncs instanceof AmudehHoraahZmanim,
					[isoYear, isoMonth, isoDay, isoCalendar],
					// @ts-ignore
					geoLocationParams,
					this.zmanFuncs.coreZC.isUseElevation(),
					this.jCal.getInIsrael(),
					this.zmanimList
				)
				const element = document.createElement('a');
				element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(icsData));
				element.setAttribute('download', (this.zmanFuncs instanceof AmudehHoraahZmanim ? 'Amudeh Horaah' : 'Ohr Hachaim') + ` (${isoYear}) - ` + this.geoLocation.getLocationName() + ".ics");

				element.style.display = 'none';
				document.body.appendChild(element);

				element.click();

				document.body.removeChild(element);
			})

			for (const dateChanger of Array.from(dateContainer.getElementsByTagName('button')).filter(btn => btn.hasAttribute('data-dateAlter'))) {
				const days = parseInt(dateChanger.getAttribute("data-dateAlter"))
				if (isNaN(days))
					continue;

				dateChanger.addEventListener("click", (e) => this.changeDate(this.zmanFuncs.coreZC.getDate().add({ days })))
			}

			for (const calendarBtn of dateContainer.getElementsByTagName('input')) {
				calendarBtn.addEventListener('calendarInsert',
					() => this.changeDate(KosherZmanim.Temporal.PlainDate
						.from(calendarBtn.getAttribute("date-value"))
					)
				)
			}

			this.buttonsInit = true;
		}
	}

	/**
	 * @param {HTMLElement} [mourningDiv]
	 */
	writeMourningPeriod(mourningDiv) {
		if (!this.jCal.isMourningPeriod()) {
			mourningDiv.style.display = "none";
			return;
		}
		mourningDiv.style.removeProperty("display");

		/** @type {HTMLElement} */
		const sefirathHaomer = mourningDiv.querySelector('[data-zfFind="SefirathHaomer"]');

		/** @type {HTMLElement} */
		const threeWeeks = mourningDiv.querySelector('[data-zfFind="ThreeWeeksHeader"]');
		if (this.jCal.getDayOfOmer() !== -1) {
			sefirathHaomer.style.removeProperty("display");
			threeWeeks.style.display = "none";

			const omerInfo = this.jCal.getOmerInfo();

			// Hebrew
			mourningDiv.querySelector('[data-zfReplace="hbOmerDate"]').innerHTML =
				omerInfo.title.hb.mainCount;

			const hbDescription = mourningDiv.querySelector('[data-zfReplace="hbOmerDays"]');
			if (this.jCal.getDayOfOmer() >= 7) {
				hbDescription.parentElement.style.removeProperty("display");
				hbDescription.innerHTML = omerInfo.title.hb.subCount.toString();
			} else {
				hbDescription.parentElement.style.display = 'none';
			}

			// English
			mourningDiv.querySelector('[data-zfReplace="etNumOmerCount"]').innerHTML =
				omerInfo.title.et.mainCount;
			const etDescription = mourningDiv.querySelector('[data-zfReplace="etOmer"]');
			if (this.jCal.getDayOfOmer() >= 7) {
				etDescription.parentElement.style.removeProperty("display");
				etDescription.innerHTML = omerInfo.title.et.subCount.toString();
			} else {
				etDescription.parentElement.style.display = 'none';
			}

			mourningDiv.querySelector('[data-zfReplace="enOrdOmerCount"]').innerHTML =
				omerInfo.title.en.mainCount;

			/** @type {HTMLElement} */
			const enDescription = mourningDiv.querySelector('[data-zfReplace="enOmer"]');
			if (this.jCal.getDayOfOmer() >= 7) {
				enDescription.parentElement.style.removeProperty("display");
				enDescription.innerHTML = omerInfo.title.en.subCount.toString();
			} else {
				enDescription.style.display = 'none';
			}

			/** @type {HTMLElement} */
			const omerRules = mourningDiv.querySelector('[data-zfFind="omerRules"]')
			if (Object.values(this.jCal.mourningHalachot()).every(elem => elem == false)) {
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
			const threeWeeksText = Array.from(threeWeeks.querySelectorAll('[data-zfFind="threeWeeks"]'));
			/** @type {HTMLElement[]} */
			const nineDaysText = Array.from(threeWeeks.querySelectorAll('[data-zfFind="nineDays"]'));
			/** @type {HTMLElement[]} */
			const weekOfText = Array.from(threeWeeks.querySelectorAll('[data-zfFind="weekOf"]'));

			if (this.jCal.isShvuaShechalBo()) {
				weekOfText.forEach((elem) => elem.style.removeProperty("display"));

				([nineDaysText, threeWeeksText]).flat()
					.forEach((elem) => elem.style.display = "none")
			} else if (this.jCal.getJewishMonth() == KosherZmanim.JewishCalendar.AV) {
				nineDaysText.forEach((elem) => elem.style.removeProperty("display"));

				([weekOfText, threeWeeksText]).flat()
					.forEach((elem) => elem.style.display = "none")
			} else {
				threeWeeksText.forEach((elem) => elem.style.removeProperty("display"));

				([weekOfText, nineDaysText]).flat()
					.forEach((elem) => elem.style.display = "none")
			}
		}

		for (const [key, value] of Object.entries(this.jCal.mourningHalachot())) {
			/** @type {HTMLElement} */
			const halachaIndex = mourningDiv.querySelector(`[data-zfFind="${key}"]`);

			if (value)
				halachaIndex.style.removeProperty("display")
			else
				halachaIndex.style.display = "none"
		}
	}

	updateZmanimList() {
		for (let dateContainer of document.querySelectorAll('[data-zfFind="dateContainer"]')) {
			if (dateContainer instanceof HTMLElement)
				this.renderDateContainer(dateContainer);
		}

		const parashaText = this.jCal.getHebrewParasha().join(" / ");
		if (this.lastData.parsha !== parashaText) {
			this.lastData.parsha = parashaText
			for (const parashaElem of document.querySelectorAll('[data-zfReplace="Parasha"]'))
				parashaElem.innerHTML = parashaText
		}

		const dayText = Object.values(this.jCal.getDayOfTheWeek()).join(" / ");
		if (this.lastData.day !== dayText) {
			this.lastData.day = dayText
			for (const dayElem of document.querySelectorAll('[data-zfReplace="Day"]'))
				dayElem.innerHTML = dayText;
		}

		const specialDayText = this.jCal.listOfSpecialDays().join(" / ");
		if (this.lastData.specialDay !== specialDayText) {
			this.lastData.specialDay = specialDayText;
			for (const specialDay of document.querySelectorAll('[data-zfReplace="SpecialDay"]')) {
				if (!(specialDay instanceof HTMLElement))
					return;
	
				if (!specialDayText) {
					specialDay.style.display = "none";
				} else {
					specialDay.style.removeProperty("display");
					specialDay.innerHTML = specialDayText;
				}
			}
		}

		for (const mourningDiv of document.querySelectorAll('[data-zfFind="MourningPeriod"]')) {
			if (mourningDiv instanceof HTMLElement)
				this.writeMourningPeriod(mourningDiv);
		}

		document.querySelectorAll('[data-zfReplace="Ulchaparat"]').forEach(
			(/**@type {HTMLElement} */ulchaparat) => {
				if (this.jCal.isRoshChodesh()) {
					ulchaparat.style.removeProperty("display");
					ulchaparat.innerHTML = (this.jCal.tefilahRules().amidah.ulChaparatPesha ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע")
				} else {
					ulchaparat.style.display = "none";
				}
			}
		)

		document.querySelectorAll('[data-zfFind="Chamah"]').forEach(
			(/**@type {HTMLElement} */chamah) => {
				if (this.jCal.isBirkasHachamah()) {
					chamah.style.removeProperty("display");
				} else {
					chamah.style.display = "none";
				}
			}
		)

		document.querySelectorAll('[data-zfFind="BirchatHalevana"]').forEach(
			(/**@type {HTMLElement} */birchatHalevana) => {
				const birLev = this.jCal.birkathHalevanaCheck(this.zmanFuncs);
				if (!birLev.current) {
					birchatHalevana.style.display = "none";
					return;
				}

				birchatHalevana.style.removeProperty("display");
				birchatHalevana.querySelectorAll('[data-zfReplace="date-en-end"]').forEach(
					endDate => endDate.innerHTML = birLev.data.end.toLocaleString("en", {day: 'numeric', month: 'short'})
				)
				birchatHalevana.querySelector('[data-zfReplace="date-hb-end"]').innerHTML =
					birLev.data.end.toLocaleString("he", {day: 'numeric', month: 'short'})

				console.log(birLev.data.start.dayOfYear, this.jCal.getDate().dayOfYear)
				if (birLev.data.start.dayOfYear == this.jCal.getDate().dayOfYear) {
					birchatHalevana.querySelectorAll('[data-zfFind="starts-tonight"]').forEach(
						startsToday => startsToday.style.removeProperty("display")
					)
				} else {
					birchatHalevana.querySelectorAll('[data-zfFind="starts-tonight"]').forEach(
						startsToday => startsToday.style.display = "none"
					)
				}

				if (birLev.data.end.dayOfYear == this.jCal.getDate().dayOfYear) {
					birchatHalevana.querySelectorAll('[data-zfFind="ends-tonight"]').forEach(
						endsToday => endsToday.style.removeProperty("display")
					)
				} else {
					birchatHalevana.querySelectorAll('[data-zfFind="ends-tonight"]').forEach(
						endsToday => endsToday.style.display = "none"
					)
				}
			}
		)

		document.querySelectorAll('[data-zfReplace="Tachanun"]').forEach(
			(/**@type {HTMLElement} */tachanun) => {
				if (this.jCal.isYomTovAssurBemelacha()) {
					tachanun.style.display = "none";
					return;
				}

				tachanun.style.removeProperty("display");
				if (this.jCal.getDayOfWeek() == 7) {
					tachanun.innerHTML = this.jCal.tefilahRules().tachanun == 0 ? "צדקתך" : "יהי שם"
				} else {
					switch (this.jCal.tefilahRules().tachanun) {
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

		const hallelText = this.jCal.tefilahRules().hallel;
		document.querySelectorAll('[data-zfReplace="Hallel"]').forEach(
			(/**@type {HTMLElement} */hallel) => {
				if (!hallelText) {
					hallel.style.display = "none";
				} else {
					hallel.style.removeProperty("display");
					hallel.innerHTML = hallelText == 2 ? "הלל שלם (עם ברכה)" : "חצי הלל (בלי ברכה)";
				}
			}
		)

		const tekufaDate = this.zmanFuncs.nextTekufa(settings.calendarToggle.tekufaMidpoint() !== "hatzoth");
		if (this.jCal.getDate().toZonedDateTime(this.zmanFuncs.coreZC.getGeoLocation().getTimeZone()).until(tekufaDate).total('days') < 1) {
			/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
			const tekufaTF = [this.dtF[0], { ...this.dtF[1] }]
			delete tekufaTF[1].second

			const nextTekufaJDate = [1, 4, 7, 10]
				.map(month => new KosherZmanim.JewishDate(this.jCal.getJewishYear(), month, 15))
				.sort((jDateA, jDateB) => {
					const durationA = this.jCal.getDate().until(jDateA.getDate())
					const durationB = this.jCal.getDate().until(jDateB.getDate())

					return Math.abs(durationA.total('days')) - Math.abs(durationB.total('days'))
				})[0]

			const nextTekufotNames = Object.fromEntries(
				['en', 'he']
					.map(locale => [locale, nextTekufaJDate.getDate().toLocaleString(locale + '-u-ca-hebrew', { month: 'long' })])
			);
			for (let tekufa of document.querySelectorAll('[data-zfFind="Tekufa"]')) {
				if (!(tekufa instanceof HTMLElement))
					continue;

				tekufa.style.removeProperty("display");

				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaTime"]'))
					.forEach(element => element.innerHTML = tekufaDate.toLocaleString(...tekufaTF));
				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaFastTime"]'))
					.forEach(element => element.innerHTML =
						[
							tekufaDate.subtract({ minutes: 30 }).toLocaleString(...tekufaTF),
							tekufaDate.add({ minutes: 30 }).toLocaleString(...tekufaTF),
						].join('-')
					);

				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaName-en"]'))
					.forEach(element => element.innerHTML = nextTekufotNames.en);
				tekufa.querySelector('[data-zfReplace="tekufaName-hb"]').innerHTML = nextTekufotNames.he;
			}
		} else {
			document.querySelectorAll('[data-zfFind="Tekufa"]').forEach(
				(/**@type {HTMLElement} */ tekufa) => tekufa.style.display = "none"
			)
		}

		const zmanInfo = this.jCal.getZmanimInfo(false,this.zmanFuncs,this.zmanimList);
		for (const calendarContainer of document.querySelectorAll('[data-zfFind="calendarFormatter"]')) {
			for (const timeSlot of calendarContainer.children) {
				if (!(timeSlot instanceof HTMLElement))
					continue;

				if (!timeSlot.hasAttribute('data-zmanid')) {
					timeSlot.style.display = 'none';
					continue;
				}

				const zmanId = timeSlot.getAttribute('data-zmanid');
				if (!(zmanId in zmanInfo) || zmanInfo[zmanId].display == -1) {
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

				timeSlot.querySelector('.timeDisplay').innerHTML = zmanInfo[zmanId].luxonObj.toLocaleString(...this.dtF)

				if (timeSlot.hasAttribute('data-specialDropdownContent')) {
					const description = timeSlot.querySelector('.accordianContent');
					description.innerHTML = description.innerHTML
						.split('${getAteretTorahSunsetOffset()}').join(settings.customTimes.tzeithIssurMelakha().minutes.toString())
						.split('${getCandleLightingOffset()}').join(settings.customTimes.candleLighting().toString())
				}

				if (zmanInfo[zmanId].title.hb)
					timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[zmanId].title.hb

				if (zmanInfo[zmanId].title.en)
					timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[zmanId].title.en

				if (zmanInfo[zmanId].title["en-et"])
					timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[zmanId].title["en-et"]

				// Calculate but hide! Can be derived via Inspect Element
				if (!zmanInfo[zmanId].display)
					timeSlot.style.display = 'none';
				else {
					timeSlot.style.removeProperty('display')
					timeSlot.classList.remove('loading')
				}
			}
		}

		for (let dafContainer of document.querySelectorAll('[data-zfFind="DafYomi"]')) {
			if (dafContainer instanceof HTMLElement)
				this.renderDafYomi(dafContainer);
		}

		for (let seasonalRuleContainer of document.querySelectorAll('[data-zfFind="SeasonalPrayers"]')) {
			if (seasonalRuleContainer instanceof HTMLElement)
				this.renderSeasonalRules(seasonalRuleContainer);
		}

		for (let shaahZmanitCont of document.querySelectorAll('[data-zfFind="shaahZmanit"]')) {
			if (shaahZmanitCont instanceof HTMLElement)
				this.shaahZmanits(shaahZmanitCont);
		}
		
	}

	/**
	 * @param {HTMLElement} [dafContainer]
	 */
	renderDafYomi(dafContainer) {
		const hNum = new HebrewNumberFormatter();

		const daf = dafContainer.querySelector('[data-zfReplace="dafBavli"]');
		const dafYerushalmi = dafContainer.querySelector('[data-zfReplace="DafYerushalmi"]');

		if (this.jCal.getJewishYear() < 5684) {
			daf.innerHTML = "N/A. Daf Yomi (Bavli) was only created on Rosh Hashanah 5684 and continues onto this day"
		} else {
			const dafObject = this.jCal.getDafYomiBavli();
			daf.innerHTML =
				dafObject.getMasechta() + " " +
				hNum.formatHebrewNumber(dafObject.getDaf());
		}

		const dafYerushalmiObject = this.jCal.getDafYomiYerushalmi();
		if (!dafYerushalmiObject || dafYerushalmiObject.getDaf() == 0) {
			dafYerushalmi.innerHTML = "N/A";
		} else {
			dafYerushalmi.innerHTML = dafYerushalmiObject.getMasechta() + " " + hNum.formatHebrewNumber(dafYerushalmiObject.getDaf());
		}

		const chafetzChayimYomi = this.jCal.getChafetzChayimYomi();
		dafContainer.querySelector('[data-zfReplace="ccYomi"]').innerHTML = (chafetzChayimYomi.title + (chafetzChayimYomi.section ? (": " + chafetzChayimYomi.section) : "")) || "N/A"
	}

	/**
	 * @param {HTMLElement} [tefilahRuleContainer]
	 */
	renderSeasonalRules(tefilahRuleContainer) {
		/** @type {import('./WebsiteCalendar.js').default} */
		let calForRules = this.jCal;
		if (this.jCal.getDate().equals(KosherZmanim.Temporal.Now.plainDateISO())
		 && this.zmanFuncs.getTzait().epochMilliseconds <= KosherZmanim.Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone()).epochMilliseconds) {
			calForRules = this.jCal.tomorrow();
		}
		const seasonalRules = [
			this.jCal.tefilahRules().amidah.mechayehHametim,
			this.jCal.tefilahRules().amidah.mevarechHashanim
		];

		tefilahRuleContainer.querySelector('[data-zfReplace="SeasonalPrayers"]').innerHTML = seasonalRules.filter(Boolean).join(" / ");

		let shemaKolenu = this.geoLocation.getLatitude() < 0;
		if (settings.calendarToggle.tekufaCalc() == 'adabaravah') {
			const talUmatarRAda = this.zmanFuncs.tekufaCalc.calculateTekufotRAda()[0].toPlainDate().add({ days: 60 })
			shemaKolenu = shemaKolenu || KosherZmanim.Temporal.PlainDate.compare(talUmatarRAda, this.jCal.getDate()) !== -1
		}

		/** @type {HTMLUListElement} */
		const shemaKolenuElem = tefilahRuleContainer.querySelector('[data-zfFind="ShemaKolenu"]');
		if (this.jCal.tefilahRules().amidah.mevarechHashanim == "ברכנו" && shemaKolenu) {
			shemaKolenuElem.style.removeProperty("display")
		} else {
			shemaKolenuElem.style.display = "none";
		}
	}

	/**
	 * @param {HTMLElement} [shaotZmaniyotCont]
	 */
	shaahZmanits(shaotZmaniyotCont) {
		/** @type {['gra', 'mga']} */
		const psakArray = ['gra', 'mga'];
		psakArray.forEach(shaahTemporal => {
			const duration = this.zmanFuncs.fixedToSeasonal(KosherZmanim.Temporal.Duration.from({ hours: 1 }), shaahTemporal)

			/** @type {KosherZmanim.Temporal.DurationTotalOf[]} */
			const formatTimeStrings = ["hours", "minutes"];
			const formatTime = formatTimeStrings
				.map(timeUnit => String(Math.trunc(duration.total(timeUnit)) % 60).padStart(2, '0'))
				.join(":")
			shaotZmaniyotCont.querySelector(`[data-zfReplace="${shaahTemporal}ShaahZmanit"]`).innerHTML = formatTime;
		})
	}

	setNextUpcomingZman() {
		/** @type {KosherZmanim.Temporal.ZonedDateTime[]} */
		const zmanim = [];
		const currentSelectedDate = this.zmanFuncs.coreZC.getDate();

		for (const time of [0, 1]) {
			this.changeDate(KosherZmanim.Temporal.Now.plainDateISO().add({ days: time }), true);
			zmanim.push(...Object.values(this.jCal.getZmanimInfo(false,this.zmanFuncs,this.zmanimList)).filter(obj => obj.display == 1).map(time => time.luxonObj));
		}

		this.changeDate(currentSelectedDate, true); //reset the date to the current date
		zmanim.sort(KosherZmanim.Temporal.ZonedDateTime.compare)
		this.nextUpcomingZman = zmanim.find(zman => KosherZmanim.Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone()).until(zman).total({ unit: "milliseconds" }) > 0)

		setTimeout(
			() => {this.setNextUpcomingZman(); this.updateZmanimList()},
			KosherZmanim.Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone()).until(this.nextUpcomingZman).total({ unit: "milliseconds" })
		);
	}

	/**
	 * @param {KosherZmanim.Temporal.ZonedDateTime} zman
	 */
	isNextUpcomingZman(zman) {
		return !(this.nextUpcomingZman == null || !(zman.epochMilliseconds == this.nextUpcomingZman.epochMilliseconds))
	};
}

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const zmanimListUpdater2 = new zmanimListUpdater(geoLocation)

// @ts-ignore
window.zmanimListUpdater2 = zmanimListUpdater2;
// @ts-ignore
window.KosherZmanim = KosherZmanim;