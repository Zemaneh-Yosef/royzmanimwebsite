// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim, methodNames } from "./ROYZmanim.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import { settings } from "./settings/handler.js";
import { ChaiTables } from "./chaiTables.js";
import * as leaflet from "../libraries/leaflet/leaflet.js"

import icsExport from "./icsHandler.js";
import { HebrewNumberFormatter } from "./WebsiteCalendar.js";

const harHabait = new KosherZmanim.GeoLocation('Jerusalem, Israel', 31.778, 35.2354, "Asia/Jerusalem");

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
		this.midDownload = false;

		/** @type {null|NodeJS.Timeout} */ // It's not node but whatever
		this.countdownToNextDay = null;

		this.zmanimList = Array.from(document.querySelector('[data-zfFind="calendarFormatter"]').children)
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
			)
			.reduce(function (obj, [key, val]) {
				//@ts-ignore
				obj[key] = val
				return obj
			}, {})

		this.resetCalendar(geoLocation);

		// this.updateZmanimList();
	}

	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	resetCalendar(geoLocation = this.geoLocation) {
		this.zmanInfoSettings = {
			hourCalculator: settings.calendarToggle.hourCalculators(),
			tzeithIssurMelakha: settings.customTimes.tzeithIssurMelakha(),
			tzeitTaanitHumra: settings.calendarToggle.tzeitTaanitHumra()
		};

		this.geoLocation = geoLocation;
		const locationModal = document.getElementById('locationModal')

		const locationTitles = {
			modal: geoLocation.getLocationName() || "unknown",
			pageTitle: geoLocation.getLocationName() || "No location name provided"
		};

		const shareIcon = document.createElement('i');
		shareIcon.classList.add("fa", "fa-share-alt");
		const shareData = {
			title: "Zemanim for " + locationTitles.modal,
			text: "Find all the Zemanim on Zemaneh Yosef",
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
		if (!this.jCal.getInIsrael() && settings.calendarToggle.hourCalculators() == "degrees") {
			amudehHoraahIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.removeProperty('display'))
			ohrHachaimIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.display = 'none');
			this.zmanFuncs = new AmudehHoraahZmanim(geoLocation)
		} else {
			ohrHachaimIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.removeProperty('display'))
			amudehHoraahIndicators.forEach((/** @type {HTMLElement} */ ind) => ind.style.display = 'none');
			this.zmanFuncs = new OhrHachaimZmanim(geoLocation, true)
		}

		this.zmanFuncs.configSettings(settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha())

		document.querySelectorAll('[data-zfFind="LocationYerushalayimLine"]')
			.forEach(jerusalemLine =>
				jerusalemLine.appendChild(
					document.createTextNode(this.zmanFuncs.coreZC.getGeoLocation().getRhumbLineBearing(harHabait).toFixed(2) + "°")
				)
			)

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

		/** @type {HTMLElement} */
		const locationMapElem = locationModal.querySelector('[data-zfFind="locationMap"]')

		this.locationMap = null;
		locationModal.addEventListener('shown.bs.modal', () => {
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
		})
		locationModal.addEventListener('hidden.bs.modal', () => {
			this.locationMap.remove();
			this.locationMap = null
		});

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
			const dateDisplay = dateContainer.querySelector(`[data-zfReplace="${dateName}Date"]`);
			dateDisplay.setAttribute('dir', date[dateName].dir);
			dateDisplay.innerHTML = date[dateName].text;
		}

		const boldDateHandler = (this.jCal.getDate().equals(KosherZmanim.Temporal.Now.plainDateISO())) ? 'add' : 'remove'
		dateContainer.classList[boldDateHandler]("text-bold");

		if (!this.buttonsInit) {
			const downloadBtn = document.getElementById("downloadModalBtn");
			downloadBtn.style.removeProperty("display")
			downloadBtn.addEventListener('click', () => {
				if (this.midDownload)
					return;

				this.midDownload = true;

				const geoLocationParams = [
					this.geoLocation.getLocationName(),
					this.geoLocation.getLatitude(),
					this.geoLocation.getLongitude(),
					this.geoLocation.getElevation(),
					this.geoLocation.getTimeZone()
				];
	
				const { isoDay, isoMonth, isoYear, calendar: isoCalendar } = this.zmanFuncs.coreZC.getDate().getISOFields()

				const icsParams = [
					this.zmanFuncs instanceof AmudehHoraahZmanim,
					[isoYear, isoMonth, isoDay, isoCalendar],
					// @ts-ignore
					geoLocationParams,
					this.zmanFuncs.coreZC.isUseElevation(),
					this.jCal.getInIsrael(),
					this.zmanimList,
					true,
					{
						language: settings.language() == "hb" ? "he" : settings.language(),
						timeFormat: settings.timeFormat(), seconds: settings.seconds(),
						zmanInfoSettings: this.zmanInfoSettings,
						calcConfig: [settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha()],
						fasts: Object.fromEntries([...document.querySelector('[data-zfFind="FastDays"]').getElementsByTagName("h5")]
							.map(ogHeading => {
								/** @type {HTMLHeadingElement} */
								// @ts-ignore
								const heading = ogHeading.cloneNode(true);
								const [ he, et, en ] = [...heading.children]
									.map(langElem => {
										while (langElem.querySelector('[data-zfFind="erevTzom"]'))
											langElem.querySelector('[data-zfFind="erevTzom"]').remove()

										return langElem.innerHTML.replace(/<.*?>/gm, '');
									})

								return [heading.getAttribute("data-zfFind"), { he, "en-et": et, en }]
							}))
					}
				]

				if (window.Worker) {
					const myWorker = new Worker("/assets/js/icsHandler.js", { type: "module" });
					myWorker.postMessage(icsParams)
					myWorker.addEventListener("message", (message) => {
						console.log("received message from other thread")
						const element = document.createElement('a');
						element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(message.data));
						element.setAttribute('download', (this.zmanFuncs instanceof AmudehHoraahZmanim ? 'Amudeh Horaah' : 'Ohr Hachaim') + ` (${isoYear}) - ` + this.geoLocation.getLocationName() + ".ics");

						element.style.display = 'none';
						document.body.appendChild(element);

						element.click();

						document.body.removeChild(element);
						this.midDownload = false;
					})
				} else {
					const icsData = icsExport.apply(icsExport, icsParams)
					const element = document.createElement('a');
					element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(icsData));
					element.setAttribute('download', (this.zmanFuncs instanceof AmudehHoraahZmanim ? 'Amudeh Horaah' : 'Ohr Hachaim') + ` (${isoYear}) - ` + this.geoLocation.getLocationName() + ".ics");

					element.style.display = 'none';
					document.body.appendChild(element);

					element.click();

					document.body.removeChild(element);
					this.midDownload = false;
				}
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
	 * @param {HTMLElement} [parashaBar]
	 */
	renderParashaBar(parashaBar) {
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

		switch (this.jCal.getDate().dayOfWeek) {
			case 5:
			case 6: {
				/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
				const shabTF = [this.dtF[0], { ...this.dtF[1] }]
				delete shabTF[1].second

				for (const candleLighting of parashaBar.querySelectorAll('[data-zfReplace="CandleLighting"]')) {
					candleLighting.parentElement.style.removeProperty("display")
					candleLighting.innerHTML =
						(this.jCal.getDate().dayOfWeek == 5 ? this.zmanFuncs : this.zmanFuncs.chainDate(this.jCal.getDate().subtract({ days: 1 })))
						.getCandleLighting().toLocaleString(...shabTF)
				}

				for (const tzetShabbat of parashaBar.querySelectorAll('[data-zfReplace="TzetShabbat"]')) {
					tzetShabbat.parentElement.style.removeProperty("display")
					tzetShabbat.innerHTML = this.zmanFuncs.chainDate(this.jCal.shabbat().getDate()).getTzaitShabbath().toLocaleString(...shabTF)
				}

				for (const tzetRT of parashaBar.querySelectorAll('[data-zfReplace="TzetRT"]')) {
					tzetRT.parentElement.style.removeProperty("display");
					tzetRT.innerHTML = this.zmanFuncs.chainDate(this.jCal.shabbat().getDate()).getTzaitRT().toLocaleString(...shabTF);
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

	/**
	 * @param {HTMLElement} [fastContainer]
	 */
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

		const fastJCal = this.jCal.isTaanis() || this.jCal.isTaanisBechoros() ? this.jCal : this.jCal.tomorrow();
		const fastCalc = this.zmanFuncs.chainDate(fastJCal.getDate());
		const nameElements = [...fastContainer.getElementsByTagName("h5")];
		nameElements.forEach(element => element.style.display = "none");
		
		const ourFast = nameElements.find(element => element.getAttribute("data-zfFind") == fastJCal.getYomTovIndex().toString());
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
			if (erevTzom.lastChild.nodeType == Node.TEXT_NODE) {
				erevTzom.lastChild.remove();
			}

			const erevCalc = this.zmanFuncs.chainDate(fastJCal.getDate().subtract({ days: 1 }));
			const timeOnErev =
				(fastJCal.getYomTovIndex() == KosherZmanim.JewishCalendar.YOM_KIPPUR ? erevCalc.getCandleLighting() : erevCalc.getShkiya())
			erevTzom.appendChild(document.createTextNode(timeOnErev.toLocaleString(...this.dtF)));

			const yomTzom = timeList.multiDay.lastElementChild;
			hideErev(yomTzom, true);
			if (yomTzom.lastChild.nodeType == Node.TEXT_NODE)
				yomTzom.lastChild.remove();

			if (fastJCal.getYomTovIndex() == KosherZmanim.JewishCalendar.YOM_KIPPUR) {
				yomTzom.appendChild(document.createTextNode(
					fastCalc.getTzaitShabbath().toLocaleString(...this.dtF) + ` (R"T: ${fastCalc.getTzaitRT().toLocaleString(...this.dtF)})`
				));
			} else {
				yomTzom.appendChild(document.createTextNode(fastCalc.getTzaitLechumra().toLocaleString(...this.dtF)))
			}
		} else {
			timeList.multiDay.style.display = "none";
			timeList.oneDay.style.removeProperty("display")
			if (timeList.oneDay.lastChild.nodeType == Node.TEXT_NODE) {
				timeList.oneDay.lastChild.remove();
			}

			timeList.oneDay.appendChild(document.createTextNode(
				fastCalc.getAlotHashachar().toLocaleString(...this.dtF) + ' - ' + fastCalc.getTzaitLechumra().toLocaleString(...this.dtF)
			))
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
				enDescription.style.removeProperty("display");
				enDescription.innerHTML = omerInfo.title.en.subCount.toString();
			} else {
				enDescription.style.display = 'none';
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
					.forEach(element => element.innerHTML = tekufaDate.toLocaleString(...tekufaTF));
				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaFastTime"]'))
					.forEach(element => element.innerHTML =
						[
							tekufaDate.subtract({ minutes: 30 }).toLocaleString(...tekufaTF),
							tekufaDate.add({ minutes: 30 }).toLocaleString(...tekufaTF),
						].join('-')
					);

				Array.from(tekufa.querySelectorAll('[data-zfReplace="tekufaName-en"]'))
					//@ts-ignore
					.forEach(element => element.innerHTML = nextTekufotNames.en);

				//@ts-ignore
				tekufa.querySelector('[data-zfReplace="tekufaName-hb"]').innerHTML = nextTekufotNames.he;
			}
		} else {
			document.querySelectorAll('[data-zfFind="Tekufa"]').forEach(
				(/**@type {HTMLElement} */ tekufa) => tekufa.style.display = "none"
			)
		}

		const zmanInfo = this.jCal.getZmanimInfo(false, this.zmanFuncs, this.zmanimList, this.zmanInfoSettings);
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
						.split('${getCandleLightingOffset()}').join(this.zmanFuncs.coreZC.getCandleLightingOffset().toString())
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
			zmanim.push(...Object.values(this.jCal.getZmanimInfo(false,this.zmanFuncs,this.zmanimList,this.zmanInfoSettings)).filter(obj => obj.display == 1).map(time => time.luxonObj));
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