// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import {Temporal} from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { ZemanFunctions, methodNames, zDTFromFunc } from "./ROYZmanim.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import { settings } from "./settings/handler.js";
import ChaiTables from "./features/chaiTables.js";
import * as leaflet from "../libraries/leaflet/leaflet.js"

import { HebrewNumberFormatter } from "./WebsiteCalendar.js";
import exportFriendly from "./features/export.js";

const harHabait = new KosherZmanim.GeoLocation('Jerusalem, Israel', 31.778, 35.2354, "Asia/Jerusalem");
const hiloulahIndex = new KosherZmanim.HiloulahYomiCalculator();

export default class zmanimListUpdater {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.exportManager = new exportFriendly();

		this.jCal = new WebsiteLimudCalendar();
		this.jCal.setUseModernHolidays(true);

		/** @type {null|Temporal.ZonedDateTime} */
		this.nextUpcomingZman = null;

		this.buttonsInit = false;
		this.midDownload = false;

		/** @type {null|NodeJS.Timeout} */ // It's not node but whatever
		this.countdownToNextDay = null;

		/** @type {Parameters<typeof this.jCal.getZmanimInfo>[2]} */
		this.zmanimList = Object.fromEntries(Array.from(document.querySelector('[data-zfFind="calendarFormatter"]').children)
			.map(timeSlot => [timeSlot.getAttribute('data-zmanid'), Object.freeze({
				function: timeSlot.getAttribute('data-timeGetter'),
				yomTovInclusive: timeSlot.getAttribute('data-yomTovInclusive'),
				luachInclusive: timeSlot.getAttribute('data-luachInclusive'),
				condition: timeSlot.getAttribute('data-condition'),
				round: timeSlot.getAttribute('data-round'),
				title: {
					'hb': timeSlot.querySelector('span.lang.lang-hb').innerHTML,
					'en': timeSlot.querySelector('span.lang.lang-en').innerHTML,
					'en-et': timeSlot.querySelector('span.lang.lang-et').innerHTML
				}
			})])
			.filter(
				arrayEntry =>
					arrayEntry[0] !== null
					// @ts-ignore
				&& (arrayEntry[0] == 'candleLighting' || (arrayEntry[1].function && methodNames.includes(arrayEntry[1].function)))
			));

		this.resetCalendar(geoLocation);

		// this.updateZmanimList();
	}

	openLocationModal() {
		/** @type {HTMLElement} */
		const locationMapElem = document.querySelector('#locationModal [data-zfFind="locationMap"]')

		this.locationMap = leaflet.map(locationMapElem, {
			dragging: false,
			minZoom: 16,
			touchZoom: 'center',
			scrollWheelZoom: 'center'
		}).setView([geoLocation.getLatitude(), geoLocation.getLongitude()], 13);
		leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(this.locationMap);
		leaflet.polyline([
			[geoLocation.getLatitude(), geoLocation.getLongitude()],
			[harHabait.getLatitude(), harHabait.getLongitude()]
		], { color: 'red' }).addTo(this.locationMap)
	}

	closeLocationModal() {
		this.locationMap.remove();
		this.locationMap = null
	}

	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	resetCalendar(geoLocation = this.geoLocation) {
		this.timeoutToChangeDate = null;
		this.geoLocation = geoLocation;

		const locationModal = document.getElementById('locationModal');
		locationModal.removeEventListener('shown.bs.modal', this.openLocationModal);
		locationModal.removeEventListener('hidden.bs.modal', this.closeLocationModal);
		this.locationMap = null;

		/** @type {number[]} */
		let availableVS = [];
		if (typeof localStorage !== "undefined" && localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
			const ctNetz = JSON.parse(localStorage.getItem('ctNetz'))
			if (ctNetz.lat == geoLocation.getLatitude()
			&& ctNetz.lng == geoLocation.getLongitude())
				availableVS = ctNetz.times
		}

		const locationTitles = {
			modal: geoLocation.getLocationName() || "unknown",
			pageTitle: geoLocation.getLocationName() || "No location name provided"
		};

		document.title = {
			"hb": "זמנים ל" + locationTitles.modal + " - זמני יוסף",
			"en": "Halachic Times for " + locationTitles.modal + " - Zemaneh Yosef/זמני יוסף",
			"en-et": "Zemanim for " + locationTitles.modal + " - Zemaneh Yosef/זמני יוסף"
		}[settings.language()]

		const shareIcon = document.createElement('i');
		shareIcon.classList.add("fa", "fa-share-alt");
		const shareData = {
			title: {
				"hb": "זמנים ל",
				"en": "Halachic Times for ",
				"en-et": "Zemanim for "
			}[settings.language()] + locationTitles.modal,
			text: {
				"hb": "כל הזמנים לפי שיטת מרן עובדיה יוסף זצ'ל, רק על זמני יוסף",
				"en": "Get all the Halachic times according to Rav Ovadia Yosef ZT'L, only on Zemaneh Yosef",
				"en-et": "Get all the Zemanim according to Rav Ovadia Yosef ZT'L, only on Zemaneh Yosef"
			}[settings.language()],
			url: window.location.href
		};
		const shareFunction = async () => {
			try {
				if ('share' in navigator)
					await navigator.share(shareData);
			} catch (e) {
				console.error(e);
			}
		}

		this.jCal.setInIsrael(locationTitles.modal.toLowerCase().includes('israel'));
		document.querySelectorAll('[data-zfReplace="LocationName"]')
			.forEach(locationNameElem => {
				while (locationNameElem.firstChild)
					locationNameElem.firstChild.remove();

				if (locationModal.contains(locationNameElem)) {
					// We want to preserve the "Location name for" text
					if (locationNameElem.parentElement.firstElementChild.tagName == "I")
						locationNameElem.parentElement.firstElementChild.remove();

					if ('canShare' in navigator && navigator.canShare(shareData)) {
						const modalShareIcon = shareIcon.cloneNode();
						modalShareIcon.addEventListener("click", shareFunction)
						locationNameElem.parentElement.insertBefore(modalShareIcon, locationNameElem.parentElement.firstChild);
					}

					locationNameElem.appendChild(document.createTextNode(locationTitles.modal));
				} else {
					if ('canShare' in navigator && navigator.canShare(shareData)) {
						const documentShareIcon = shareIcon.cloneNode();
						documentShareIcon.addEventListener("click", shareFunction)
						locationNameElem.appendChild(documentShareIcon);
						locationNameElem.appendChild(document.createTextNode(" "));
					}

					const locationTextElem = document.createElement("span");
					locationTextElem.classList.add('text-decoration-underline');
					locationTextElem.appendChild(document.createTextNode(locationTitles.pageTitle))
					locationNameElem.appendChild(locationTextElem)
				}
			});

		const amudehHoraahIndicators = [...document.querySelectorAll('[data-zfFind="luachAmudehHoraah"]')].filter(elem => elem instanceof HTMLElement);
		const ohrHachaimIndicators = [...document.querySelectorAll('[data-zfFind="luachOhrHachaim"]')].filter(elem => elem instanceof HTMLElement);

		let fixedMil = false;
		if (this.jCal.getInIsrael() || settings.calendarToggle.forceSunSeasonal()) {
			ohrHachaimIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.removeProperty('display'))
			amudehHoraahIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.display = 'none');
			fixedMil = true;
		} else {
			amudehHoraahIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.removeProperty('display'))
			ohrHachaimIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.display = 'none');
		}

		this.zmanCalc = new ZemanFunctions(geoLocation, {
			elevation: fixedMil,
			fixedMil,
			rtKulah: settings.calendarToggle.rtKulah(),
			candleLighting: settings.customTimes.candleLighting(),
			melakha: settings.customTimes.tzeithIssurMelakha()
		})
		this.zmanCalc.setVisualSunrise(availableVS);

		document.querySelectorAll('[data-zfFind="LocationYerushalayimLine"]')
			.forEach(jerusalemLine => {
				if (jerusalemLine.lastChild.nodeType == Node.TEXT_NODE)
					jerusalemLine.lastChild.remove();

				jerusalemLine.appendChild(
					document.createTextNode(this.zmanCalc.coreZC.getGeoLocation().getRhumbLineBearing(harHabait).toFixed(2) + "°")
				)
			})

		locationModal.querySelector('[data-zfReplace="locationLat"]').innerHTML = geoLocation.getLatitude().toString()
		locationModal.querySelector('[data-zfReplace="locationLng"]').innerHTML = geoLocation.getLongitude().toString()

		locationModal.querySelectorAll('[data-zfFind="locationElev"]').forEach(elevElem => {
			if (elevElem.nextSibling.nodeType == Node.TEXT_NODE)
				elevElem.nextSibling.remove();

			elevElem.insertAdjacentText('afterend', geoLocation.getElevation().toFixed(1))
		})
		locationModal.querySelectorAll('[data-zfFind="locationTimeZone"]').forEach(tzElem => {
			if (tzElem.nextSibling.nodeType == Node.TEXT_NODE)
				tzElem.nextSibling.remove();

			tzElem.insertAdjacentText('afterend', geoLocation.getTimeZone())
		})

		locationModal.addEventListener('shown.bs.modal', this.openLocationModal)
		locationModal.addEventListener('hidden.bs.modal', this.closeLocationModal);

		/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
		this.dtF = [settings.language() == 'hb' ? 'he' : 'en', {
			hourCycle: settings.timeFormat(),
			hour: 'numeric',
            minute: '2-digit'
		}];
		
		if (settings.seconds()) {
			this.dtF[1].second = '2-digit'
		}

		this.chaiTableInfo = new ChaiTables();
		this.chaiTableInfo.initForm(this);

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
	 * @param {Temporal.PlainDate} date
	 * @param {boolean} internal 
	 */
	changeDate(date, internal=false) {
		this.zmanCalc.setDate(date)
		this.jCal.setDate(date);

		if (!internal) {
			this.updateZmanimList();
			if (date.equals(Temporal.Now.plainDateISO())) {
				const tomorrow = Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone())
					.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0, millisecond: 0 })
				this.timeoutToChangeDate = setTimeout(
					() => this.changeDate(tomorrow.toPlainDate()),
					Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone())
						.until(tomorrow)
						.total('milliseconds')
				);
			} else {
				this.timeoutToChangeDate = null
			}
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
			const dateDisplay = dateContainer.querySelector(`[data-zfReplace="${dateName}Date"]`);
			dateDisplay.setAttribute('dir', date[dateName].dir);
			dateDisplay.innerHTML = date[dateName].text;
		}

		const boldDateHandler = (this.jCal.getDate().equals(KosherZmanim.Temporal.Now.plainDateISO())) ? 'add' : 'remove'
		dateContainer.classList[boldDateHandler]("text-bold");

		if (!this.buttonsInit) {
			const downloadBtn = document.getElementById("downloadModalBtn");
			downloadBtn.addEventListener('click', async () => {await this.exportManager.handleICS(this)})

			const spreadSheetBtn = document.getElementById("spreadSheetBtn");
			spreadSheetBtn.addEventListener('click', async () => {await this.exportManager.handleExcel(this)})

			const clipboardBtn = document.getElementById('clipboardDownload');
			if ('clipboard' in navigator)
				clipboardBtn.addEventListener('click', async () => {await this.clipboardCopy()})
			else
				clipboardBtn.setAttribute('disabled', '')

			for (const dateChanger of Array.from(dateContainer.getElementsByTagName('button')).filter(btn => btn.hasAttribute('data-dateAlter'))) {
				const days = parseInt(dateChanger.getAttribute("data-dateAlter"))
				if (isNaN(days))
					continue;

				dateChanger.addEventListener("click", () => this.changeDate(this.zmanCalc.coreZC.getDate().add({ days })))
			}

			for (const calendarBtn of dateContainer.getElementsByTagName('input')) {
				calendarBtn.addEventListener('calendarInsert',
					() => this.changeDate(KosherZmanim.Temporal.PlainDate.from(calendarBtn.getAttribute("date-value")))
				)
			}

			this.buttonsInit = true;
		}
	}

	async clipboardCopy() {
		const copyText = this.geoLocation.getLocationName() + "\n\n"
		+ this.jCal.formatFancyDate(undefined, false) + ", " + this.jCal.getDate().year
		+ "\n" + this.jCal.formatJewishFullDate().hebrew + "\n\n"
		+ Object.values(this.jCal.getZmanimInfo(true, this.zmanCalc, this.zmanimList, this.dtF))
		.filter(entry => entry.display == 1)
		.map(entry => `${entry.title[settings.language()]}: ${entry.zDTObj.toLocaleString(...entry.dtF)}`)
		.join('\n')

		await navigator.clipboard.writeText(copyText);
	}

	/**
	 * @param {HTMLElement} [parashaBar]
	 */
	async renderParashaBar(parashaBar) {
		let parashaText = this.jCal.getHebrewParasha().join(" / ");
		if (parashaText == "No Parasha this week"
		 && [5,6].includes(this.jCal.getDate().dayOfWeek)
		 && [KosherZmanim.JewishCalendar.NISSAN, KosherZmanim.JewishCalendar.TISHREI].includes(this.jCal.getJewishMonth()))
			parashaText = "חול המועד " + (this.jCal.getDate().withCalendar("hebrew").month == 1 ? "סוכות" : "פסח");

		if (this.lastData.parsha !== parashaText) {
			this.lastData.parsha = parashaText
			for (const parashaElem of parashaBar.querySelectorAll('[data-zfReplace="Parasha"]'))
				parashaElem.innerHTML = this.lastData.parsha
		}

		const haftara = KosherZmanim.Haftara.getThisWeeksHaftarah(this.jCal.shabbat())
		parashaBar.querySelector('[data-zfReplace="Haftara"]').innerHTML
			= `<b>${haftara.text}</b> (${haftara.source})`;

		try {
			fetch("/assets/js/makamObj.json")
				.then(res => res.json())
				.then(makamObj => {
					const makamIndex = new KosherZmanim.Makam(makamObj.sefarimList);
					const shabbatMakam = makamIndex.getTodayMakam(this.jCal.shabbat());

					const makamElems = {
						"summaryResult": parashaBar.querySelector('[data-zfReplace="makamot"]'),
						"summaryTitle": parashaBar.querySelector('[data-zfReplace="makamot"]').previousElementSibling,
						"details": parashaBar.querySelector('[data-zfFind="makamot"]')
					}

					makamElems.summaryResult.innerHTML =
						shabbatMakam.makam
							.map(mak => (typeof mak == "number" ? makamObj.makamNameMapEng[mak] : mak))
							.join(" / ");

					if (makamElems.summaryTitle.lastChild.nodeType == Node.TEXT_NODE)
						makamElems.summaryTitle.lastChild.remove();

					makamElems.summaryTitle.appendChild(document.createTextNode(" (" + shabbatMakam.title + ")"));

					makamElems.details.classList.remove("noContent");
					makamElems.details.classList.add("smallContent");

					if (!makamElems.details.lastElementChild.classList.contains("accordianContent")) {
						makamElems.details.appendChild(document.createElement("dl")).classList.add("accordianContent");
					}

					makamElems.details.lastElementChild.innerHTML = Object.entries(KosherZmanim.Makam.getMakamData(this.jCal.shabbat()))
						.map(([key, value]) => {
							return `<dt>${key}</dt><dd>${(value.map(mak => (typeof mak == "number" ? makamObj.makamNameMapEng[mak] : mak))
								.join(" / "))}</dd>`
						}).join('');
				})
		} catch (e) {
			parashaBar.querySelector('[data-zfReplace="makamot"]').innerHTML = "N/A";
		}

		switch (this.jCal.getDate().dayOfWeek) {
			case 5:
			case 6: {
				/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
				const shabTF = [this.dtF[0], { ...this.dtF[1] }]
				delete shabTF[1].second

				for (const candleLighting of parashaBar.querySelectorAll('[data-zfReplace="CandleLighting"]')) {
					candleLighting.parentElement.style.removeProperty("display")
					candleLighting.innerHTML =
						(this.jCal.getDate().dayOfWeek == 5 ? this.zmanCalc : this.zmanCalc.chainDate(this.jCal.getDate().subtract({ days: 1 })))
						.getCandleLighting().toLocaleString(...shabTF)
				}

				for (const tzetShabbat of parashaBar.querySelectorAll('[data-zfReplace="TzetShabbat"]')) {
					tzetShabbat.parentElement.style.removeProperty("display")
					tzetShabbat.innerHTML = zDTFromFunc(this.zmanCalc.chainDate(this.jCal.shabbat().getDate()).getTzetMelakha()).toLocaleString(...shabTF)
				}

				for (const tzetRT of parashaBar.querySelectorAll('[data-zfReplace="TzetRT"]')) {
					tzetRT.parentElement.style.removeProperty("display");
					tzetRT.innerHTML = this.zmanCalc.chainDate(this.jCal.shabbat().getDate()).getTzetRT().toLocaleString(...shabTF);
				}

				break;
			}
			default: {
				for (const candleLighting of parashaBar.querySelectorAll('[data-zfReplace="CandleLighting"]'))
					candleLighting.parentElement.style.display = "none";

				for (const tzetShabbat of parashaBar.querySelectorAll('[data-zfReplace="TzetShabbat"]'))
					tzetShabbat.parentElement.style.display = "none"

				break;
			}
		}
	}

	/** @param {HTMLElement} [fastContainer] */
	renderFastIndex(fastContainer) {
		const todayFast = this.jCal.isTaanis() || this.jCal.isTaanisBechoros();
		if (!todayFast && !this.jCal.tomorrow().isTaanis() && !this.jCal.tomorrow().isTaanisBechoros()) {
			fastContainer.style.display = "none";
			return;
		}
		fastContainer.style.removeProperty("display");

		/**
		 * @param {Element} contElem
		 */
		function hideErev(contElem, inverse=false) {
			const cond = (inverse ? !todayFast : todayFast)
			contElem.querySelectorAll('[data-zfFind="erevTzom"]')
				.forEach(elem => {
					if (!(elem instanceof HTMLElement))
						return;

					if (cond)
						elem.style.display = "none";
					else
						elem.style.removeProperty("display");
				});
		}

		const fastJCal = todayFast ? this.jCal : this.jCal.tomorrow();
		const fastCalc = this.zmanCalc.chainDate(fastJCal.getDate());
		const nameElements = [...fastContainer.getElementsByTagName("h5")];
		nameElements.forEach(element => element.style.display = "none");

		const ourFast = nameElements.find(fastElm =>
			fastElm.getAttribute("data-zfFind") == (fastJCal.isTaanisBechoros() ? 0 : fastJCal.getYomTovIndex()).toString()
		);
		hideErev(ourFast);
		ourFast.style.removeProperty("display");

		/** @type {Record<'multiDay' | 'oneDay', HTMLElement>} */
		const timeList = {
			multiDay: fastContainer.querySelector('[data-zfFind="twoDayTimes"]'),
			oneDay: fastContainer.querySelector('[data-zfFind="oneDayTimes"]')
		};

		if ([KosherZmanim.JewishCalendar.TISHA_BEAV, KosherZmanim.JewishCalendar.YOM_KIPPUR].includes(fastJCal.getYomTovIndex())) {
			timeList.oneDay.style.display = "none";
			timeList.multiDay.style.removeProperty("display");

			const erevTzom = timeList.multiDay.firstElementChild;
			hideErev(erevTzom);
			if (erevTzom.lastChild.nodeType == Node.TEXT_NODE)
				erevTzom.lastChild.remove();

			const erevCalc = this.zmanCalc.chainDate(fastJCal.getDate().subtract({ days: 1 }));
			const timeOnErev =
				(fastJCal.getYomTovIndex() == KosherZmanim.JewishCalendar.YOM_KIPPUR ? erevCalc.getCandleLighting() : erevCalc.getShkiya())
			erevTzom.appendChild(document.createTextNode(timeOnErev.toLocaleString(...this.dtF)));

			const yomTzom = timeList.multiDay.lastElementChild;
			hideErev(yomTzom, true);
			if (yomTzom.lastChild.nodeType == Node.TEXT_NODE)
				yomTzom.lastChild.remove();

			if (this.jCal.isYomKippur()) {
				yomTzom.appendChild(document.createTextNode(
					zDTFromFunc(fastCalc.getTzetMelakha()).toLocaleString(...this.dtF) + ` (R"T: ${fastCalc.getTzetRT().toLocaleString(...this.dtF)})`
				));
			} else {
				yomTzom.appendChild(document.createTextNode(fastCalc.getTzetHumra().toLocaleString(...this.dtF)))
			}
		} else {
			timeList.multiDay.style.display = "none";
			timeList.oneDay.style.removeProperty("display")
			if (timeList.oneDay.lastChild.nodeType == Node.TEXT_NODE)
				timeList.oneDay.lastChild.remove();

			timeList.oneDay.appendChild(document.createTextNode(
				fastCalc.getAlotHashahar().toLocaleString(...this.dtF) + ' - ' + fastCalc.getTzetHumra().toLocaleString(...this.dtF)
			))
		}
	}

	/** @param {HTMLElement} [mourningDiv] */
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

			const eachLang = Object.fromEntries(Array.from(sefirathHaomer.children)
				.filter(elem => elem.tagName == "DIV")
				.map(elem => [Array.from(elem.classList)[1].replace('lang-', ''), elem]));

			for (const [lang, elem] of Object.entries(eachLang)) {
				const finalDayAdjust = (this.jCal.tomorrow().getDayOfOmer() == -1 ? "add" : "remove")
				elem.lastElementChild.classList[finalDayAdjust]("d-none");
				elem.lastElementChild.previousElementSibling.classList[finalDayAdjust]("mb-0")

				for (const completeCount of elem.querySelectorAll('[data-zfReplace="completeCount"]')) {
					const jCalOmer = (completeCount.getAttribute('data-omerDay') == 'tomorrow' ? this.jCal.tomorrow() : this.jCal)
					// @ts-ignore
					completeCount.innerHTML = jCalOmer.getOmerInfo().title[lang].mainCount
				}

				for (const indCount of elem.querySelectorAll('[data-zfReplace="indCount"]')) {
					const jCalOmer = (indCount.getAttribute('data-omerDay') == 'tomorrow' ? this.jCal.tomorrow() : this.jCal)
					if (jCalOmer.getDayOfOmer() >= 7) {
						indCount.parentElement.style.removeProperty("display");
						// @ts-ignore
						indCount.innerHTML = jCalOmer.getOmerInfo().title[lang].subCount.toString();
					} else {
						indCount.parentElement.style.display = 'none';
					}
				}
			}

			/** @type {HTMLElement} */
			const omerRules = mourningDiv.querySelector('[data-zfFind="omerRules"]')
			if (Object.values(this.jCal.mourningHalachot()).every(elem => elem == false)) {
				omerRules.style.display = "none"
			} else {
				omerRules.style.removeProperty("display");
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
		for (const dateContainer of document.querySelectorAll('[data-zfFind="dateContainer"]'))
			if (dateContainer instanceof HTMLElement)
				this.renderDateContainer(dateContainer);

		for (const fastContainer of document.querySelectorAll('[data-zfFind="FastDays"]'))
			if (fastContainer instanceof HTMLElement)
				this.renderFastIndex(fastContainer)

		for (const parashaElem of document.querySelectorAll('[data-zfFind="Parasha"]'))
			if (parashaElem instanceof HTMLElement)
				this.renderParashaBar(parashaElem);

		const dayText = ['en', 'hb'].map((/** @type {'en'|'hb'} */lang) => this.jCal.getDayOfTheWeek()[lang]).join(" / ");
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
					continue;
	
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

		const tefilaRules = this.jCal.tefilahRules();
		document.querySelectorAll('[data-zfReplace="Ulchaparat"]').forEach(
			(/**@type {HTMLElement} */ulchaparat) => {
				if (this.jCal.isRoshChodesh()) {
					ulchaparat.style.removeProperty("display");
					ulchaparat.innerHTML = (tefilaRules.amidah.ulChaparatPesha ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע")
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
				const birLev = this.jCal.birkathHalevanaCheck(this.zmanCalc);
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

				if (birLev.data.start.dayOfYear == this.jCal.getDate().dayOfYear) {
					birchatHalevana.querySelectorAll('[data-zfFind="starts-tonight"]').forEach(
						//@ts-ignore
						startsToday => startsToday.style.removeProperty("display")
					)
				} else {
					birchatHalevana.querySelectorAll('[data-zfFind="starts-tonight"]').forEach(
						//@ts-ignore
						startsToday => startsToday.style.display = "none"
					)
				}

				if (birLev.data.end.dayOfYear == this.jCal.getDate().dayOfYear) {
					birchatHalevana.querySelectorAll('[data-zfFind="ends-tonight"]').forEach(
						//@ts-ignore
						endsToday => endsToday.style.removeProperty("display")
					)
				} else {
					birchatHalevana.querySelectorAll('[data-zfFind="ends-tonight"]').forEach(
						//@ts-ignore
						endsToday => endsToday.style.display = "none"
					)
				}
			}
		)

		document.querySelectorAll('[data-zfFind="Tachanun"]').forEach(
			(/**@type {HTMLElement} */tachanun) => {
				if (this.jCal.isYomTovAssurBemelacha()) {
					tachanun.style.display = "none";
					return;
				}

				tachanun.style.removeProperty("display");
				let tachanunId = tefilaRules.tachanun;
				if (this.jCal.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY) {
					tachanunId = Math.min(tachanunId + 3, 4)
				}
				
				for (const tachanunDiv of tachanun.children) {
					if (!(tachanunDiv instanceof HTMLElement))
						continue;

					if (tachanunDiv.getAttribute("data-zfFind") == tachanunId.toString()) {
						tachanunDiv.style.removeProperty("display");
					} else {
						tachanunDiv.style.display = "none";
					}
				}
			}
		)

		const hallelText = tefilaRules.hallel;
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

		const nextTekufa = this.zmanCalc.nextTekufa(settings.calendarToggle.tekufaMidpoint() !== "hatzoth").round('minute')
		const tekufaRange = ['add', 'subtract']
			.map((/** @type {'add' | 'subtract'} */ act) => nextTekufa[act]({ minutes: 30 }))
		if (new Set(tekufaRange.map(range=>range.toPlainDate())).keys().some(tekTime => tekTime.equals(this.jCal.getDate()))) {
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

			/** @type {{en: string; he: string}} */
			// @ts-ignore
			const nextTekufotNames = ['en', 'he']
				.map(locale => [locale, nextTekufaJDate.getDate().toLocaleString(locale + '-u-ca-hebrew', { month: 'long' })])
				.reduce(function (obj, [key, val]) {
					//@ts-ignore
					obj[key] = val
					return obj
				}, {})

			for (let tekufa of document.querySelectorAll('[data-zfFind="Tekufa"]')) {
				if (!(tekufa instanceof HTMLElement))
					continue;

				tekufa.style.removeProperty("display");

				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaTime"]'))
					.forEach(element => element.innerHTML = nextTekufa.toLocaleString(...tekufaTF));
				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaFastTime"]'))
					.forEach(element => element.innerHTML = tekufaRange.map(time => time.toLocaleString(...tekufaTF)).join('-'));

				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaName-en"]'))
					.forEach(element => element.innerHTML = nextTekufotNames.en);
				tekufa.querySelector('[data-zfReplace="tekufaName-hb"]').innerHTML = nextTekufotNames.he;
			}
		} else {
			document.querySelectorAll('[data-zfFind="Tekufa"]').forEach(
				(/**@type {HTMLElement} */ tekufa) => tekufa.style.display = "none"
			)
		}

		const zmanInfo = this.jCal.getZmanimInfo(false, this.zmanCalc, this.zmanimList, this.dtF);
		for (const calendarContainer of document.querySelectorAll('[data-zfFind="calendarFormatter"]')) {
			for (const timeSlot of calendarContainer.children) {
				if (!(timeSlot instanceof HTMLElement))
					continue;

				if (!timeSlot.hasAttribute('data-zmanid')) {
					timeSlot.style.setProperty('display', 'none', 'important');
					continue;
				}

				let zmanId = timeSlot.getAttribute('data-zmanid');
				const timeDisplay = timeSlot.getElementsByClassName('timeDisplay')[0]
				if (!(zmanId in zmanInfo)) {
					if (!Object.keys(zmanInfo).find((value) => value.startsWith(zmanId))) {
						timeSlot.style.setProperty('display', 'none', 'important');
						continue;
					}

					// Now we know it's a proper sub-function, but we need to now determine how to display each sub-function
					let allRowsHidden = true;
					let firstAlreadyGone = false;
					let invalidShitot = 0;
					const shitot = timeDisplay.querySelectorAll('[data-subZmanId]')
					for (const shita of shitot) {
						if (!(shita instanceof HTMLElement))
							return;

						const completeName = timeSlot.getAttribute('data-zmanid') + '-' + shita.getAttribute('data-subZmanId');

						if (zmanInfo[completeName].display == -1) {
							shita.style.setProperty('display', 'none', 'important');
							continue;
						}

						if (zmanInfo[completeName].display == -2) {
							allRowsHidden = false;
							timeSlot.style.removeProperty("display");
							timeDisplay.lastElementChild.innerHTML = "XX:XX"
							continue;
						}

						/** @type {HTMLElement} */
						// @ts-ignore
						const upNextElem = shita.firstElementChild;
						if (this.isNextUpcomingZman(zmanInfo[completeName].zDTObj)) {
							upNextElem.style.removeProperty("display")
						} else {
							upNextElem.style.display = "none";
						}

						shita.lastElementChild.innerHTML = zmanInfo[completeName].zDTObj.toLocaleString(...zmanInfo[completeName].dtF)

						const validMergeTitle = 'merge_title' in zmanInfo[completeName];
						// We're going to affect the main row title since the only time we actually change the title for multi-row is tzet for fasts
						if (validMergeTitle && zmanInfo[completeName].merge_title.hb)
							timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[completeName].merge_title.hb
						else if (zmanInfo[completeName].title.hb)
							timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[completeName].title.hb

						if (validMergeTitle && zmanInfo[completeName].merge_title.en)
							timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[completeName].merge_title.en
						else if (zmanInfo[completeName].title.en)
							timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[completeName].title.en

						if (validMergeTitle && zmanInfo[completeName].merge_title["en-et"])
							timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[completeName].merge_title["en-et"]
						else if (zmanInfo[completeName].title["en-et"])
							timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[completeName].title["en-et"]

						// Calculate but hide! Can be derived via Inspect Element
						if (!zmanInfo[completeName].display) {
							shita.style.setProperty('display', 'none', 'important');
							invalidShitot++;
						} else {
							allRowsHidden = false;
							shita.style.removeProperty('display');

							if (!firstAlreadyGone) {
								firstAlreadyGone = true;
								shita.classList.remove("leftBorderForShita");

								if (invalidShitot == 1 && shitot.length == 2) {
									shita.style.gridColumn = "span 2"
								}
							} else {
								shita.classList.add("leftBorderForShita")
								shita.style.removeProperty('grid-column')
							}
						}
					}

					// Calculate but hide! Can be derived via Inspect Element
					if (allRowsHidden)
						timeSlot.style.setProperty('display', 'none', 'important');
					else {
						timeSlot.style.removeProperty('display')
					}
				} else {
					if (zmanInfo[zmanId].display == -1) {
						timeSlot.style.setProperty('display', 'none', 'important');
						continue;
					}

					if (zmanInfo[zmanId].display == -2) {
						timeSlot.style.removeProperty("display");
						timeDisplay.lastElementChild.innerHTML = "XX:XX"
						continue;
					}

					/** @type {HTMLElement} */
					// @ts-ignore
					const upNextElem = timeDisplay.firstElementChild;
					if (this.isNextUpcomingZman(zmanInfo[zmanId].zDTObj)) {
						upNextElem.style.removeProperty("display")
					} else {
						upNextElem.style.display = "none";
					}

					timeDisplay.lastElementChild.innerHTML = zmanInfo[zmanId].zDTObj.toLocaleString(...zmanInfo[zmanId].dtF)

					if (zmanInfo[zmanId].title.hb)
						timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[zmanId].title.hb

					if (zmanInfo[zmanId].title.en)
						timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[zmanId].title.en

					if (zmanInfo[zmanId].title["en-et"])
						timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[zmanId].title["en-et"];

					// Calculate but hide! Can be derived via Inspect Element
					if (!zmanInfo[zmanId].display)
						timeSlot.style.setProperty('display', 'none', 'important');
					else {
						timeSlot.style.removeProperty('display')
					}
				}

				if (timeSlot.hasAttribute('data-specialDropdownContent')) {
					const description = timeSlot.querySelector('.accordianContent');
					description.innerHTML = description.innerHTML
						.split('${getAteretTorahSunsetOffset()}').join(settings.customTimes.tzeithIssurMelakha().minutes.toString())
						.split('${getCandleLightingOffset()}').join(this.zmanCalc.coreZC.getCandleLightingOffset().toString())
				}
			}
			calendarContainer.classList.remove("loading")
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

		hiloulahIndex.getHiloulah(this.jCal)
			.then(leilouNishmat => {
				for (let leilouNishmatList of document.querySelectorAll('[data-zfFind="hiloulah"]')) {
					while (leilouNishmatList.firstElementChild) {
						leilouNishmatList.firstElementChild.remove()
					}
		
					/** @type {'en'|'he'} */
					// @ts-ignore
					const hLang = leilouNishmatList.getAttribute('data-zfIndex')
					if (!leilouNishmat[hLang].length) {
						const li = document.createElement('li');
						li.classList.add('list-group-item');
						li.appendChild(document.createTextNode(leilouNishmatList.getAttribute('data-fillText')));
						leilouNishmatList.appendChild(li);
		
						continue;
					}
		
					for (const neshama of leilouNishmat[hLang]) {
						const li = document.createElement('li');
						li.classList.add('list-group-item');
		
						const name = document.createElement("b");
						name.appendChild(document.createTextNode(neshama.name));
						li.appendChild(name)

						if (neshama.src) {
							if (neshama.src.startsWith('http'))
								li.innerHTML += ` (<a href="${neshama.src}">${new URL(neshama.src).hostname}</a>)`
							else
								li.appendChild(document.createTextNode(` (${neshama.src})`));
						}
		
						leilouNishmatList.appendChild(li);
					}
				}
			})
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
		dafContainer.querySelector('[data-zfReplace="ccYomi"]').innerHTML = (chafetzChayimYomi.title + (chafetzChayimYomi.section ? (": " + chafetzChayimYomi.section) : "")) || "N/A";

		dafContainer.querySelector('[data-zfReplace="TehilimShvui"]').innerHTML
			= KosherZmanim.TehilimYomi.byWeek(this.jCal).map(num => num.toString()).join(' - ');
		dafContainer.querySelector('[data-zfReplace="TehilimHodshi"]').innerHTML
			= KosherZmanim.TehilimYomi.byDayOfMonth(this.jCal).map(met => met.toString()).join(' - ');

		const mishna = KosherZmanim.MishnaYomi.getMishnaForDate(this.jCal, true);
		dafContainer.querySelector('[data-zfReplace="MishnaYomi"]').innerHTML = mishna || "N/A";
	}

	/** @param {HTMLElement} [tefilahRuleContainer] */
	renderSeasonalRules(tefilahRuleContainer) {
		/** @type {import('./WebsiteCalendar.js').default} */
		let calForRules = this.jCal;
		if (this.jCal.getDate().equals(KosherZmanim.Temporal.Now.plainDateISO())
		 && Temporal.ZonedDateTime.compare(this.zmanCalc.getTzet(), KosherZmanim.Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone())) < 1) {
			calForRules = this.jCal.tomorrow();
		}
		const seasonalRules = [
			calForRules.tefilahRules().amidah.mechayehHametim,
			calForRules.tefilahRules().amidah.mevarechHashanim
		];

		tefilahRuleContainer.querySelector('[data-zfReplace="SeasonalPrayers"]').innerHTML = seasonalRules.filter(Boolean).join(" / ");

		let shemaKolenu = this.geoLocation.getLatitude() < 0;
		if (settings.calendarToggle.tekufaCalc() == 'adabaravah') {
			const talUmatarRAda = this.zmanCalc.tekufaCalc.calculateTekufotRAda()[0].toPlainDate().add({ days: 60 })
			shemaKolenu = shemaKolenu
			|| (
				KosherZmanim.Temporal.PlainDate.compare(talUmatarRAda, this.jCal.getDate()) == -1
			&& calForRules.getDate().withCalendar('hebrew').month < 7)
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
		const psakArray = this.zmanCalc.timeRange.current.ranges;
		Object.entries(psakArray).forEach(([ID, shaahTemporal]) => {
			const duration = this.zmanCalc.fixedToSeasonal(KosherZmanim.Temporal.Duration.from({ hours: 1 }), shaahTemporal)

			/** @type {KosherZmanim.Temporal.DurationTotalOf[]} */
			const formatTimeStrings = ["hours", "minutes"];
			const formatTime = formatTimeStrings
				.map(timeUnit => String(Math.trunc(duration.total(timeUnit)) % 60).padStart(2, '0'))
				.join(":")
			shaotZmaniyotCont.querySelector(`[data-zfReplace="${ID}ShaahZmanit"]`).innerHTML = formatTime;
		})
	}

	setNextUpcomingZman() {
		/** @type {KosherZmanim.Temporal.ZonedDateTime[]} */
		const zmanim = [];
		const currentSelectedDate = this.zmanCalc.coreZC.getDate();

		for (const days of [0, 1]) {
			this.changeDate(KosherZmanim.Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()).add({ days }), true);
			zmanim.push(...Object.values(this.jCal.getZmanimInfo(false,this.zmanCalc,this.zmanimList, this.dtF)).filter(obj => obj.display == 1).map(time => time.zDTObj));
		}

		this.changeDate(currentSelectedDate, true); //reset the date to the current date
		zmanim.sort(KosherZmanim.Temporal.ZonedDateTime.compare);
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
		return !(this.nextUpcomingZman == null || !(zman.equals(this.nextUpcomingZman)))
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

/**
 * @param {string} str
 */
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}