// @ts-check

/**
 * The calendar (/calendar, /applecal, /handasi-hazeman): the shared list (zmanim-list.js), set up from the
 * visitor's settings, and everything else on the page.
 */

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { zDTFromFunc } from "./ROYZmanim.js";
import ZmanimList, { queryAllElements } from "./zmanim-list.js";
import { settings } from "./settings/handler.js";
import LocationModal, { isValidTimeZone } from "./location-modal.js";
import { renderSolarIcons } from "./solar-icons.js";
import { buildZemanimConfig } from "./core/zmanimCore.js";
import makamObj from "./makamObj.js";

import exportFriendly from "./features/export.js";
import { ZmanNotificationScheduler, plainText } from "./features/zmanNotifications.js";
import { calendarChanged } from "./features/notificationsModal.js";
import { placeKey } from "./core/notificationText.js";

const harHabait = new KosherZmanim.GeoLocation('Jerusalem, Israel', 31.778, 35.2354, "Asia/Jerusalem");

const hiloulahIndex = new KosherZmanim.HiloulahYomiCalculator();

/** @typedef {import("./zmanim-list.js").ZmanimDisplay} ZmanimDisplay */

export default class zmanimListUpdater extends ZmanimList {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		super(Temporal.Now.plainDateISO(geoLocation.getTimeZone()));
		this.exportManager = new exportFriendly();

		this.midDownload = false;

		/** Sends the notifications chosen in the settings modal (Notifications tab), fed by setNextUpcomingZman */
		this.notifier = new ZmanNotificationScheduler(() => ({
			language: settings.language(),
			locationName: settings.location.name(),
			placeKey: placeKey(this.geoLocation.getLatitude(), this.geoLocation.getLongitude())
		}));

		/** @type {null|ReturnType<typeof setTimeout>} */
		this.countdownToNextDay = null;

		// Bind modal handlers to stable references for add/remove event listeners
		this._boundOpenLocationModal = this.openLocationModal.bind(this);
		this._boundCloseLocationModal = this.closeLocationModal.bind(this);

		this._initButtons();

		/** The location modal: direction & map, technical details, editing */
		this.locationModalUI = new LocationModal(this);

		/**
		 * The Birkat Halevana card (/calendar only): loaded on demand, since it pulls in the moon library.
		 * @type {import("./features/levanaWeb.js").default | null}
		 */
		this.levanaCard = null;
		const levanaRoot = /** @type {HTMLElement | null} */ (document.querySelector('[data-zfFind="LevanaCard"]'));
		if (levanaRoot)
			import("./features/levanaWeb.js")
				.then(({ default: LevanaCard }) => {
					this.levanaCard = new LevanaCard(levanaRoot);
					if (this.zmanCalc) this.levanaCard.render(this);
				})
				.catch(e => console.error("Birkat Halevana card failed to load", e));

		this.start(geoLocation);
	}

	// ─── What the shared list asks of the calendar ────────────────────────────

	/**
	 * The visitor's rulings (core/zmanimCore.js, shared with the notification server)
	 * @param {import("./zmanim-list.js").Refraction} refraction
	 */
	zemanimConfig(refraction) {
		const result = buildZemanimConfig(this.geoLocation, settings, refraction);

		// which luach the rulings follow
		const [shown, hidden] = result.config.fixedMil
			? ['luachOhrHachaim', 'luachAmudehHoraah']
			: ['luachAmudehHoraah', 'luachOhrHachaim'];
		queryAllElements(`[data-zfFind="${shown}"]`).forEach((ind) => ind.style.removeProperty('display'));
		queryAllElements(`[data-zfFind="${hidden}"]`).forEach((ind) => ind.style.display = 'none');

		return result;
	}

	language() {
		return settings.language();
	}

	refractionOptions() {
		return { humidity: settings.refraction.humidity() };
	}

	locationShown() {
		this._teardownLocationModal();
		this._updateLocationDisplay();
	}

	calendarReset() {
		this.locationModalUI.refresh({ redrawMap: true });
		// a new setting: a subscribed place keeps what its calendar shows, and the notification server gets it
		calendarChanged();
	}

	/** @param {boolean} changed */
	refractionLoaded(changed) {
		if (!changed)
			this.levanaCard?.onRefraction(this); // it may still want the moon's horizon
		this.locationModalUI.refresh();
	}

	/**
	 * @param {HTMLElement} timeSlot @param {string} zmanId
	 * @param {import("./zmanim-list.js").ZmanInfo} [info]
	 */
	rowRendered(timeSlot, zmanId, info) {
		if (info && (zmanId == 'sunrise' || zmanId == 'sunset'))
			renderSolarIcons(timeSlot, zmanId, info.solar);

		if (timeSlot.hasAttribute('data-specialDropdownContent')) {
			const description = timeSlot.querySelector('.accordianContent');
			description.innerHTML = description.innerHTML
				.split('${getAteretTorahSunsetOffset()}').join(settings.customTimes.tzeithIssurMelakha(this.jCal.getInIsrael()).minutes.toString())
				.split('${getCandleLightingOffset()}').join(this.zmanCalc.coreZC.getCandleLightingOffset().toString());
		}
	}

	/** The notifications chosen in the settings modal, for the times shown @param {[string, import("./zmanim-list.js").ZmanInfo][]} rows */
	upcomingRows(rows) {
		const language = settings.language();
		this.notifier.schedule(rows.map(([zmanId, zman]) => ({
			key: zmanId,
			// notify by the time as it's shown: to the minute, unless seconds are displayed
			time: 'second' in zman.dtF[1] ? zman.zDTObj : zman.zDTObj.with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 }),
			title: plainText(zman.title[language] || this.zmanimList[zmanId].title[language]),
			timeText: zman.zDTObj.toLocaleString(...zman.dtF)
		})));
	}

	// ─── Location Modal ───────────────────────────────────────────────────────

	/** The location modal was opened: draw the map and fill in the current data */
	openLocationModal() {
		this.locationModalUI.open();
	}

	/** The location modal was closed: drop the map */
	closeLocationModal() {
		this.locationModalUI.close();
	}

	// ─── Initialization ───────────────────────────────────────────────────────

	/**
	 * Initialize one-time button event listeners
	 * @private
	 */
	_initButtons() {
		const downloadBtn = document.getElementById('downloadModalBtn');
		if (downloadBtn) {
			downloadBtn.addEventListener('click', async () => {
				await this.exportManager.handleICS(this);
			});
		}

		const spreadSheetBtn = document.getElementById('spreadSheetBtn');
		if (spreadSheetBtn) {
			spreadSheetBtn.addEventListener('click', async () => {
				await this.exportManager.handleExcel(this);
			});
		}

		const clipboardBtn = document.getElementById('clipboardDownload');
		if (clipboardBtn) {
			if ('clipboard' in navigator) {
				clipboardBtn.addEventListener('click', async () => {
					await this.clipboardCopy();
				});
			} else {
				clipboardBtn.setAttribute('disabled', '');
			}
		}
	}

	/**
	 * Remove modal event listeners using stable bound references
	 * @private
	 */
	_teardownLocationModal() {
		const locationModal = document.getElementById('locationModal');
		if (locationModal) {
			locationModal.removeEventListener('shown.bs.modal', this._boundOpenLocationModal);
			locationModal.removeEventListener('hidden.bs.modal', this._boundCloseLocationModal);
		}
	}

	/**
	 * Attach modal event listeners using stable bound references
	 * @private
	 */
	_attachLocationModal() {
		const locationModal = document.getElementById('locationModal');
		if (locationModal) {
			locationModal.addEventListener('shown.bs.modal', this._boundOpenLocationModal);
			locationModal.addEventListener('hidden.bs.modal', this._boundCloseLocationModal);
		}
	}

	/**
	 * Update all DOM elements that display location-related information and titles.
	 * Extracted from resetCalendar for readability.
	 */
	_updateLocationDisplay() {
		const locationModal = document.getElementById('locationModal');
		const locationName = this.geoLocation.getLocationName() || "unknown";
		const pageTitleName = this.geoLocation.getLocationName() || "No location name provided";

		document.title = {
			"he": "זמנים ל" + locationName + " - זמני יוסף",
			"en": "Halachic Times for " + locationName + " - Zemaneh Yosef/זמני יוסף",
			"he-Latn": "Zemanim for " + locationName + " - Zemaneh Yosef/זמני יוסף"
		}[settings.language()];

		const shareIcon = document.createElement('i');
		shareIcon.classList.add("fa", "fa-share-alt");
		const shareData = {
			title: {
				"he": "זמנים ל",
				"en": "Halachic Times for ",
				"he-Latn": "Zemanim for "
			}[settings.language()] + locationName,
			text: {
				"he": "כל הזמנים לפי שיטת מרן עובדיה יוסף זצ'ל, רק על זמני יוסף",
				"en": "Get all the Halachic times according to Rav Ovadia Yosef ZT'L, only on Zemaneh Yosef",
				"he-Latn": "Get all the Zemanim according to Rav Ovadia Yosef ZT'L, only on Zemaneh Yosef"
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
		};

		document.querySelectorAll('[data-zfReplace="LocationName"]')
			.forEach(locationNameElem => {
				while (locationNameElem.firstChild)
					locationNameElem.firstChild.remove();

				if (locationModal.contains(locationNameElem)) {
					if (locationNameElem.parentElement.firstElementChild.tagName == "I")
						locationNameElem.parentElement.firstElementChild.remove();

					if ('canShare' in navigator && navigator.canShare(shareData)) {
						const modalShareIcon = shareIcon.cloneNode();
						modalShareIcon.addEventListener("click", shareFunction);
						locationNameElem.parentElement.insertBefore(modalShareIcon, locationNameElem.parentElement.firstChild);
					}

					locationNameElem.appendChild(document.createTextNode(locationName));
				} else {
					if ('canShare' in navigator && navigator.canShare(shareData)) {
						const documentShareIcon = shareIcon.cloneNode();
						documentShareIcon.addEventListener("click", shareFunction);
						locationNameElem.appendChild(documentShareIcon);
						locationNameElem.appendChild(document.createTextNode(" "));
					}

					const locationTextElem = document.createElement("span");
					locationTextElem.classList.add('text-decoration-underline');
					locationTextElem.appendChild(document.createTextNode(pageTitleName));
					locationNameElem.appendChild(locationTextElem);
				}
			});

		document.querySelectorAll('[data-zfFind="LocationYerushalayimLine"]')
			.forEach(jerusalemLine => {
				if (jerusalemLine.lastChild.nodeType == Node.TEXT_NODE)
					jerusalemLine.lastChild.remove();

				jerusalemLine.appendChild(
					document.createTextNode(this.zmanCalc.coreZC.getGeoLocation().getRhumbLineBearing(harHabait).toFixed(2) + "°")
				);
			});

		this._attachLocationModal();
	}

	/** Times in the visitor's language, 12 / 24 hours, with or without seconds */
	timeFormat() {
		let local = settings.language() == 'he' ? 'he' : 'en';
		if (navigator.languages.find(lang => lang.startsWith(local)))
			local = navigator.languages.find(lang => lang.startsWith(local));

		/** @type {import("./zmanim-list.js").TimeFormat} */
		const dtF = [local, {
			hourCycle: settings.timeFormat(),
			hour: 'numeric',
			minute: '2-digit'
		}];

		if (settings.seconds())
			dtF[1].second = '2-digit';
		return dtF;
	}

	// ─── Clipboard ────────────────────────────────────────────────────────────

	async clipboardCopy() {
		// FIX: Use a template literal for clarity
		const copyText = `${this.geoLocation.getLocationName()}\n\n`
			+ `${this.jCal.formatFancyDate({ monthLength: 'long', dayLength: 'long', ordinal: false }).en}, ${this.jCal.getDate().year}\n`
			+ `${this.jCal.formatJewishFullDate().hebrew}\n\n`
			+ Object.values(this.jCal.getZmanimInfo(true, this.zmanCalc, this.zmanimList, this.dtF))
				.filter(entry => entry.display == 1)
				.map(entry => `${entry.title[settings.language()]}: ${entry.zDTObj.toLocaleString(...entry.dtF)}`)
				.join('\n');

		await navigator.clipboard.writeText(copyText);
	}

	// ─── Render: Parasha Bar ──────────────────────────────────────────────────

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
			this.lastData.parsha = parashaText;
			for (const parashaElem of parashaBar.querySelectorAll('[data-zfReplace="Parasha"]'))
				parashaElem.innerHTML = this.lastData.parsha;
		}

		const haftara = KosherZmanim.Haftara.getThisWeeksHaftarah(this.jCal.shabbat());
		parashaBar.querySelector('[data-zfReplace="Haftara"]').innerHTML
			= `<b>${haftara.text}</b> (${haftara.source})`;

		switch (this.jCal.getDate().dayOfWeek) {
			case 5:
			case 6: {
				/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
				const shabTF = [this.dtF[0], { ...this.dtF[1] }];
				delete shabTF[1].second;

				for (const candleLighting of parashaBar.querySelectorAll('[data-zfReplace="CandleLighting"]')) {
					candleLighting.parentElement.style.removeProperty("display");
					candleLighting.innerHTML =
						(this.jCal.getDate().dayOfWeek == 5 ? this.zmanCalc : this.zmanCalc.chainDate(this.jCal.getDate().subtract({ days: 1 })))
						.getCandleLighting().toLocaleString(...shabTF);
				}

				for (const tzetShabbat of parashaBar.querySelectorAll('[data-zfReplace="TzetShabbat"]')) {
					tzetShabbat.parentElement.style.removeProperty("display");
					tzetShabbat.innerHTML = zDTFromFunc(this.zmanCalc.chainDate(this.jCal.shabbat().getDate()).getTzetMelakha()).toLocaleString(...shabTF);
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
					tzetShabbat.parentElement.style.display = "none";

				break;
			}
		}

		const makamIndex = new KosherZmanim.Makam(makamObj.sefarimList);
		const shabbatMakam = makamIndex.getTodayMakam(this.jCal.shabbat());

		const makamElems = {
			"summaryResult": parashaBar.querySelector('[data-zfReplace="makamot"]'),
			"summaryTitle": parashaBar.querySelector('[data-zfReplace="makamot"]').previousElementSibling,
			"details": parashaBar.querySelector('[data-zfFind="makamot"]')
		};

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
					.join(" / "))}</dd>`;
			}).join('');
	}

	// ─── Render: Fast Index ───────────────────────────────────────────────────

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
			const cond = (inverse ? !todayFast : todayFast);
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
				(fastJCal.getYomTovIndex() == KosherZmanim.JewishCalendar.YOM_KIPPUR ? erevCalc.getCandleLighting() : erevCalc.getShkiya());
			erevTzom.appendChild(document.createTextNode(timeOnErev.toLocaleString(...this.dtF)));

			const yomTzom = timeList.multiDay.lastElementChild;
			hideErev(yomTzom, true);
			if (yomTzom.lastChild.nodeType == Node.TEXT_NODE)
				yomTzom.lastChild.remove();

			if (fastJCal.isYomKippur()) {
				yomTzom.appendChild(document.createTextNode(zDTFromFunc(fastCalc.getTzetMelakha()).toLocaleString(...this.dtF)));
			} else {
				yomTzom.appendChild(document.createTextNode(fastCalc.getTzetHumra().toLocaleString(...this.dtF)));
			}
		} else {
			timeList.multiDay.style.display = "none";
			timeList.oneDay.style.removeProperty("display");
			if (timeList.oneDay.lastChild.nodeType == Node.TEXT_NODE)
				timeList.oneDay.lastChild.remove();

			timeList.oneDay.appendChild(document.createTextNode(
				fastCalc.getAlotHashahar().toLocaleString(...this.dtF) + ' - ' + fastCalc.getTzetHumra().toLocaleString(...this.dtF)
			));
		}
	}

	// ─── Render: Mourning Period ──────────────────────────────────────────────

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
				const finalDayAdjust = (this.jCal.tomorrow().getDayOfOmer() == -1 ? "add" : "remove");
				elem.lastElementChild.classList[finalDayAdjust]("d-none");
				elem.lastElementChild.previousElementSibling.classList[finalDayAdjust]("mb-0");

				for (const completeCount of elem.querySelectorAll('[data-zfReplace="completeCount"]')) {
					const jCalOmer = (completeCount.getAttribute('data-omerDay') == 'tomorrow' ? this.jCal.tomorrow() : this.jCal);
					// @ts-ignore
					completeCount.innerHTML = jCalOmer.getOmerInfo().title[lang].mainCount;
				}

				for (const indCount of elem.querySelectorAll('[data-zfReplace="indCount"]')) {
					const jCalOmer = (indCount.getAttribute('data-omerDay') == 'tomorrow' ? this.jCal.tomorrow() : this.jCal);
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
			const omerRules = mourningDiv.querySelector('[data-zfFind="omerRules"]');
			if (Object.values(this.jCal.mourningHalachot()).every(elem => elem == false)) {
				omerRules.style.display = "none";
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
				([nineDaysText, threeWeeksText]).flat().forEach((elem) => elem.style.display = "none");
			} else if (this.jCal.getJewishMonth() == KosherZmanim.JewishCalendar.AV) {
				nineDaysText.forEach((elem) => elem.style.removeProperty("display"));
				([weekOfText, threeWeeksText]).flat().forEach((elem) => elem.style.display = "none");
			} else {
				threeWeeksText.forEach((elem) => elem.style.removeProperty("display"));
				([weekOfText, nineDaysText]).flat().forEach((elem) => elem.style.display = "none");
			}
		}

		for (const [key, value] of Object.entries(this.jCal.mourningHalachot())) {
			/** @type {HTMLElement} */
			const halachaIndex = mourningDiv.querySelector(`[data-zfFind="${key}"]`);

			if (value)
				halachaIndex.style.removeProperty("display");
			else
				halachaIndex.style.display = "none";
		}
	}

	// ─── Render: the rest of the page ─────────────────────────────────────────

	/** Everything on /calendar besides the date and the rows (zmanim-list.js draws those) */
	renderPage() {
		for (const fastContainer of queryAllElements('[data-zfFind="FastDays"]'))
			this.renderFastIndex(fastContainer);

		for (const parashaElem of queryAllElements('[data-zfFind="Parasha"]'))
			this.renderParashaBar(parashaElem);

		const dayText = /** @type {('en'|'he')[]} */ (['en', 'he'])
			.map((lang) => this.jCal.getDayOfTheWeek()[lang]).join(" / ");
		if (this.lastData.day !== dayText) {
			this.lastData.day = dayText;
			for (const dayElem of queryAllElements('[data-zfReplace="Day"]'))
				dayElem.innerHTML = dayText;
		}

		const specialDayText = this.jCal.listOfSpecialDays().join(" / ");
		if (this.lastData.specialDay !== specialDayText) {
			this.lastData.specialDay = specialDayText;
			for (const specialDay of queryAllElements('[data-zfReplace="SpecialDay"]')) {
				if (!specialDayText) {
					specialDay.style.display = "none";
				} else {
					specialDay.style.removeProperty("display");
					specialDay.innerHTML = specialDayText;
				}
			}
		}

		for (const mourningDiv of queryAllElements('[data-zfFind="MourningPeriod"]'))
			this.writeMourningPeriod(mourningDiv);

		this._renderUlchaparat();
		this._renderChamah();
		this._renderTachanun();
		this._renderHallel();
		this._renderTekufa();
		this.levanaCard?.render(this);
		this._renderDafYomi();
		this._renderSeasonalPrayers();
		this._renderShaotZmaniyot();

		this.renderHiloulot();
	}

	// ─── Render: Tefilah-rule sub-renders ─────────────────────────────────────

	_renderUlchaparat() {
		const tefilaRules = this.jCal.tefilahRules();
		queryAllElements('[data-zfReplace="Ulchaparat"]').forEach((ulchaparat) => {
			if (this.jCal.isRoshChodesh()) {
				ulchaparat.style.removeProperty("display");
				ulchaparat.innerHTML = (tefilaRules.amidah.ulChaparatPesha ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע");
			} else {
				ulchaparat.style.display = "none";
			}
		});
	}

	_renderChamah() {
		queryAllElements('[data-zfFind="Chamah"]').forEach((chamah) => {
			if (this.jCal.isBirkasHachamah())
				chamah.style.removeProperty("display");
			else
				chamah.style.display = "none";
		});
	}

	_renderTachanun() {
		const tefilaRules = this.jCal.tefilahRules();
		queryAllElements('[data-zfFind="Tachanun"]').forEach((tachanun) => {
			if (this.jCal.isYomTovAssurBemelacha()) {
				tachanun.style.display = "none";
				return;
			}

			tachanun.style.removeProperty("display");
			let tachanunId = tefilaRules.tachanun;
			if (this.jCal.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY)
				tachanunId = Math.min(tachanunId + 3, 4);

			for (const tachanunDiv of tachanun.children) {
				if (!(tachanunDiv instanceof HTMLElement))
					continue;

				if (tachanunDiv.getAttribute("data-zfFind") == tachanunId.toString())
					tachanunDiv.style.removeProperty("display");
				else
					tachanunDiv.style.display = "none";
			}
		});
	}

	_renderHallel() {
		const hallelText = this.jCal.tefilahRules().hallel;
		queryAllElements('[data-zfReplace="Hallel"]').forEach((/**@type {HTMLElement} */hallel) => {
			if (!hallelText) {
				hallel.style.display = "none";
			} else {
				hallel.style.removeProperty("display");
				hallel.innerHTML = hallelText == 2 ? "הלל שלם (עם ברכה)" : "חצי הלל (בלי ברכה)";
			}
		});
	}

	_renderTekufa() {
		const nextTekufa = this.zmanCalc.nextTekufa(settings.calendarToggle.tekufaMidpoint() !== "hatzoth").round('minute');
		const tekufaRange = /** @type {('add' | 'subtract')[]} */ (['subtract', 'add'])
			.map((act) => nextTekufa[act]({ minutes: 30 }));

		if ([...new Set(tekufaRange.map(range => range.toPlainDate()))].some(tekTime => tekTime.equals(this.jCal.getDate()))) {
			/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
			const tekufaTF = [this.dtF[0], { ...this.dtF[1] }];
			delete tekufaTF[1].second;

			const nextTekufaJDate = [1, 4, 7, 10]
				.map(month => new KosherZmanim.JewishDate(this.jCal.getJewishYear(), month, 15))
				.sort((jDateA, jDateB) => {
					const durationA = this.jCal.getDate().until(jDateA.getDate());
					const durationB = this.jCal.getDate().until(jDateB.getDate());
					return Math.abs(durationA.total('days')) - Math.abs(durationB.total('days'));
				})[0];

			/** @type {{en: string; he: string}} */
			// @ts-ignore
			const nextTekufotNames = ['en', 'he']
				.map(locale => [locale, nextTekufaJDate.getDate().toLocaleString(locale + '-u-ca-hebrew', { month: 'long' })])
				.reduce(function (obj, [key, val]) {
					//@ts-ignore
					obj[key] = val;
					return obj;
				}, {});

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
			queryAllElements('[data-zfFind="Tekufa"]').forEach((tekufa) => tekufa.style.display = "none");
		}
	}

	_renderDafYomi() {
		for (let dafContainer of document.querySelectorAll('[data-zfFind="DafYomi"]')) {
			if (!(dafContainer instanceof HTMLElement))
				continue;

			for (const [key, value] of Object.entries(this.jCal.getAllLearning()))
				if (dafContainer.querySelector(`[data-zfReplace="${key}"]`) instanceof HTMLElement)
					dafContainer.querySelector(`[data-zfReplace="${key}"]`).innerHTML = value;
		}
	}

	_renderSeasonalPrayers() {
		for (let seasonalRuleContainer of document.querySelectorAll('[data-zfFind="SeasonalPrayers"]')) {
			if (seasonalRuleContainer instanceof HTMLElement)
				this.renderSeasonalRules(seasonalRuleContainer);
		}
	}

	_renderShaotZmaniyot() {
		for (let shaahZmanitCont of document.querySelectorAll('[data-zfFind="shaahZmanit"]')) {
			if (shaahZmanitCont instanceof HTMLElement)
				this.shaahZmanits(shaahZmanitCont);
		}
	}

	// ─── Render: Hiloulot ─────────────────────────────────────────────────────

	async renderHiloulot() {
		const leilouNishmat = await hiloulahIndex.getHiloulah(this.jCal);
		for (let leilouNishmatList of document.querySelectorAll('[data-zfFind="hiloulah"]')) {
			while (leilouNishmatList.firstElementChild)
				leilouNishmatList.firstElementChild.remove();

			/** @type {'en'|'he'} */
			// @ts-ignore
			const hLang = leilouNishmatList.getAttribute('data-zfIndex');
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
				li.appendChild(name);

				if (neshama.src) {
					if (neshama.src.startsWith('http'))
						li.innerHTML += ` (<a href="${neshama.src}">${new URL(neshama.src).hostname}</a>)`;
					else
						li.appendChild(document.createTextNode(` (${neshama.src})`));
				}

				leilouNishmatList.appendChild(li);
			}
		}
	}

	// ─── Render: Seasonal Rules ───────────────────────────────────────────────

	/** @param {HTMLElement} [tefilahRuleContainer] */
	renderSeasonalRules(tefilahRuleContainer) {
		/** @type {import('./WebsiteCalendar.js').default} */
		let calForRules = this.jCal;
		if (this.jCal.getDate().equals(Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()))
		 && Temporal.ZonedDateTime.compare(this.zmanCalc.getTzet(), Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone())) < 1) {
			calForRules = this.jCal.tomorrow();
		}

		const seasonalRules = [
			calForRules.tefilahRules().amidah.mechayehHametim,
			calForRules.tefilahRules().amidah.mevarechHashanim
		];

		tefilahRuleContainer.querySelector('[data-zfReplace="SeasonalPrayers"]').innerHTML = seasonalRules.filter(Boolean).join(" / ");

		let shemaKolenu = this.geoLocation.getLatitude() < 0;
		if (settings.calendarToggle.tekufaCalc() == 'adabaravah') {
			const talUmatarRAda = this.zmanCalc.tekufaCalc.calculateTekufotRAda()[0].toPlainDate().add({ days: 60 });
			shemaKolenu = shemaKolenu
			|| (
				Temporal.PlainDate.compare(talUmatarRAda, this.jCal.getDate()) == -1
			&& calForRules.getDate().withCalendar('hebrew').month < 7);
		}

		/** @type {HTMLUListElement} */
		const shemaKolenuElem = tefilahRuleContainer.querySelector('[data-zfFind="ShemaKolenu"]');
		if (this.jCal.tefilahRules().amidah.mevarechHashanim == "ברכנו" && shemaKolenu)
			shemaKolenuElem.style.removeProperty("display");
		else
			shemaKolenuElem.style.display = "none";
	}

	// ─── Render: Sha'ot Zmaniyot ──────────────────────────────────────────────

	/**
	 * @param {HTMLElement} [shaotZmaniyotCont]
	 */
	shaahZmanits(shaotZmaniyotCont) {
		const psakArray = this.zmanCalc.timeRange.current.ranges;
		Object.entries(psakArray).forEach(([ID, shaahTemporal]) => {
			const duration = this.zmanCalc.fixedToSeasonal(Temporal.Duration.from({ hours: 1 }), shaahTemporal);

			// FIX: Use total minutes and derive hours/minutes manually to avoid % 60 on hours
			// (avoids wrong output if duration ever exceeds 60 hours)
			const totalMinutes = Math.trunc(duration.total("minute"));
			const hours = Math.trunc(totalMinutes / 60);
			const minutes = totalMinutes % 60;
			const formatTime = [hours, minutes]
				.map(unit => String(unit).padStart(2, '0'))
				.join(":");

			shaotZmaniyotCont.querySelector(`[data-zfReplace="${ID}ShaahZmanit"]`).innerHTML = formatTime;
		});
	}

}

// ─── Module Init ──────────────────────────────────────────────────────────────

if (isNaN(settings.location.lat()) || isNaN(settings.location.long()) || !isValidTimeZone(settings.location.timezone())) {
	window.location.href = "/";
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc());
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const zmanimListUpdater2 = new zmanimListUpdater(geoLocation);

// @ts-ignore
window.zmanimListUpdater2 = zmanimListUpdater2;
// @ts-ignore
window.KosherZmanim = KosherZmanim;
