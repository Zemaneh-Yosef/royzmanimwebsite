// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions, methodNames, zDTFromFunc, seedVisiblePlaceholders, hasCachedVisibleSunrise } from "./ROYZmanim.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import { settings } from "./settings/handler.js";
import ChaiTables from "./features/chaiTables.js";
import LocationModal from "./location-modal.js";
import { loadRefraction, readCachedRefraction, providerFromCache, FORECAST_TTL_MS } from "./refraction-data.js";
import VisibleSunriseClient from "./visible-sunrise-client.js";

/** Floor for the next refraction check, so a clock or storage oddity can't cause a request loop. */
const MIN_REFRACTION_RECHECK_MS = 60 * 1000;

import exportFriendly from "./features/export.js";

const harHabait = new KosherZmanim.GeoLocation('Jerusalem, Israel', 31.778, 35.2354, "Asia/Jerusalem");

const hiloulahIndex = new KosherZmanim.HiloulahYomiCalculator();

/**
 * @typedef {Object} ZmanimDisplay
 * @property {string} function - Method name from ZemanFunctions
 * @property {boolean} yomTovInclusive - Include if Yom Tov
 * @property {boolean} luachInclusive - Include if in Hebrew calendar
 * @property {string|null} condition - Custom condition
 * @property {string|null} round - Rounding strategy
 * @property {{hb: string; en: string; 'en-et': string}} title - Display titles
 */

export default class zmanimListUpdater {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	constructor(geoLocation) {
		this.exportManager = new exportFriendly();

		this.jCal = new WebsiteLimudCalendar();
		this.jCal.setUseModernHolidays(true);

		/** Latest full refraction data (forecast + horizon); null until the first load finishes. @type {import("./refraction-data.js").RefractionData | null} */
		this.refraction = null;
		/** When the forecast currently on screen was downloaded (null = normals only), to skip no-op re-renders. @type {number | null} */
		this._shownForecastAt = null;
		/** Bumped on every location change, so a slow load for an old location is dropped. */
		this._refractionToken = 0;
		/** Next check for a newer forecast. @type {ReturnType<typeof setTimeout> | null} */
		this._refractionRefresh = null;
		/** @type {null|ReturnType<typeof setTimeout>} */
		this.timeoutToChangeDate = null;
		/** Cancels the idle-time precomputation of the days around the shown one. */
		this._cancelPrewarm = () => {};

		/**
		 * Visible sunrise (terrain ray tracing, up to ~100 ms a day) runs in a worker; the netz cell shows
		 * sea-level sunrise until it answers. null where module workers aren't available: computed inline then.
		 * @type {VisibleSunriseClient | null}
		 */
		this.netzWorker = null;
		try {
			this.netzWorker = new VisibleSunriseClient((date) => this._onVisibleSunrise(date));
		} catch (e) {
			console.warn("Visible sunrise worker unavailable; computing on the main thread", e);
		}

		/** @type {null|Temporal.ZonedDateTime} */
		this.nextUpcomingZman = null;

		/** @type {null|ReturnType<typeof setTimeout>} */
		this.nextUpcomingZmanTimeout = null;

		this.midDownload = false;

		/** @type {null|ReturnType<typeof setTimeout>} */
		this.countdownToNextDay = null;

		// Bind modal handlers to stable references for add/remove event listeners
		this._boundOpenLocationModal = this.openLocationModal.bind(this);
		this._boundCloseLocationModal = this.closeLocationModal.bind(this);

		/** @type {Record<string, ZmanimDisplay>} */
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

		// FIX: Initialize buttons in the constructor instead of lazily inside renderDateContainer
		this._initButtons();

		/** The location modal: direction & map, technical details, editing */
		this.locationModalUI = new LocationModal(this);

		this._makamObjPromise = fetch("/assets/js/makamObj.json")
			.then(res => res.json())
			.catch(e => { console.error("Failed to load makamObj.json", e); return null; });

		this.resetCalendar(geoLocation);
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

	// ─── Calendar Reset ───────────────────────────────────────────────────────

	/**
	 * Reset calendar for a new location. Renders right away from what previous visits stored (forecast
	 * snapshot, terrain horizon, monthly normals); fetches a new forecast only if the stored one is stale.
	 * @param {KosherZmanim.GeoLocation} [geoLocation]
	 */
	resetCalendar(geoLocation = this.geoLocation) {
		if (this.timeoutToChangeDate !== null)
			clearTimeout(this.timeoutToChangeDate);
		this.timeoutToChangeDate = null;
		this.geoLocation = geoLocation;

		this._teardownLocationModal();

		const cached = readCachedRefraction(geoLocation.getLatitude(), geoLocation.getLongitude());
		this.refraction = null;
		this._shownForecastAt = cached?.forecast?.fetchedAt ?? null;
		this._setupZmanCalc({
			atmosphereProvider: providerFromCache(cached),
			horizon: cached?.horizon ?? null,
			haze: cached?.haze ?? null
		});
		this._updateLocationDisplay();
		this._setupLocaleFormat();
		this.locationModalUI.refresh({ redrawMap: true });

		// TODO: ChaiTables' scraped sunrises are no longer read (getNetz() computes the visible sunrise
		// from the refraction server's horizon). Remove this and its UI once nothing else depends on it.
		this.chaiTableInfo = new ChaiTables(this);

		this.lastData = {
			parsha: undefined,
			day: undefined,
			specialDay: undefined,
			hamah: undefined,
			levana: undefined
		};

		this.setNextUpcomingZman();
		this.changeDate(this.jCal.getDate());

		this._loadRefraction();
	}

	/**
	 * Get current refraction data (from storage when fresh, else the network), re-render only if it
	 * differs from what's shown, and schedule the next check for when the forecast goes stale.
	 * Failures are logged, never thrown: the page keeps the stored / default model.
	 * @param {{ force?: boolean }} [options] force: download a new forecast even if the stored one is fresh
	 *   (the location modal's "Refresh forecast")
	 */
	async _loadRefraction(options = {}) {
		const token = ++this._refractionToken;
		if (this._refractionRefresh !== null) {
			clearTimeout(this._refractionRefresh);
			this._refractionRefresh = null;
		}

		/** @type {import("./refraction-data.js").RefractionData} */
		let data;
		try {
			data = await loadRefraction(this.geoLocation.getLatitude(), this.geoLocation.getLongitude(), {
				force: options.force === true,
				humidity: settings.refraction.humidity()
			});
		} catch (e) {
			console.error("Refraction data failed to load", e);
			return;
		}
		if (token !== this._refractionToken)
			return; // the location changed while we were loading

		if (data.notes.length)
			console.info("Refraction:", data.notes);
		this.refraction = data;

		// Same forecast and horizon as on screen (the usual case on a reload): nothing to redo
		const shownHaze = this.zmanCalc.config.haze ?? null;
		const changed = data.forecastFetchedAt !== this._shownForecastAt
			|| !!data.horizon !== !!this.zmanCalc.config.horizon
			|| !!data.haze !== !!shownHaze
			|| (data.haze?.forecastFetchedAt ?? null) !== (shownHaze?.forecastFetchedAt ?? null);
		if (changed)
			this._applyRefraction();
		this.locationModalUI.refresh();

		// Next look: when this forecast turns stale (another tab may have refreshed storage by then,
		// in which case no request is made). Without a forecast (offline), try again after a TTL.
		const staleIn = data.forecastFetchedAt !== null
			? data.forecastFetchedAt + FORECAST_TTL_MS - Date.now()
			: FORECAST_TTL_MS;
		this._refractionRefresh = setTimeout(() => this._loadRefraction(), Math.max(MIN_REFRACTION_RECHECK_MS, staleIn));
	}

	/**
	 * Rebuild the calculator with the latest refraction data and re-render the selected date.
	 * @private
	 */
	_applyRefraction() {
		if (!this.refraction)
			return;

		const selectedDate = this.zmanCalc.coreZC.getDate();
		this._shownForecastAt = this.refraction.forecastFetchedAt;
		this._setupZmanCalc({
			atmosphereProvider: this.refraction.provider,
			horizon: this.refraction.horizon,
			haze: this.refraction.haze
		}, this.zmanCalc.config);
		this.setNextUpcomingZman();
		this.changeDate(selectedDate);
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
	 * Initialise ZemanFunctions for the current geoLocation.
	 * @param {Pick<import("./ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} refraction
	 * @param {import("./ROYZmanim.js").ZemanimConfig} [replacing] the config this one replaces for the SAME
	 *   place: its visible sunrises stay on screen until the worker computes the new ones
	 * @private
	 */
	_setupZmanCalc(refraction, replacing) {
		const amudehHoraahIndicators = queryAllElements('[data-zfFind="luachAmudehHoraah"]');
		const ohrHachaimIndicators = queryAllElements('[data-zfFind="luachOhrHachaim"]');

		this.jCal.setInIsrael(['israel', 'ישראל'].some(isrName =>
			(this.geoLocation.getLocationName() || '').toLowerCase().includes(isrName)
		));

		let fixedMil = false;
		if (this.jCal.getInIsrael() || settings.calendarToggle.forceSunSeasonal()) {
			ohrHachaimIndicators.forEach((ind) => ind.style.removeProperty('display'));
			amudehHoraahIndicators.forEach((ind) => ind.style.display = 'none');
			fixedMil = true;
		} else {
			amudehHoraahIndicators.forEach((ind) => ind.style.removeProperty('display'));
			ohrHachaimIndicators.forEach((ind) => ind.style.display = 'none');
		}

		/** @type {import("./ROYZmanim.js").ZemanimConfig} */
		const config = {
			elevation: fixedMil,
			fixedMil,
			rtKulah: settings.calendarToggle.rtKulah(),
			candleLighting: settings.customTimes.candleLighting(),
			melakha: settings.customTimes.tzeithIssurMelakha(),
			atmosphereProvider: refraction.atmosphereProvider,
			horizon: refraction.horizon,
			haze: refraction.haze ?? null,
			humidity: settings.refraction.humidity(),
			seaSurfaceLayer: settings.refraction.seaSurfaceLayer(),
			hazeTzet: settings.refraction.hazeTzet(),
			hazeMaxDelayMinutes: settings.refraction.hazeMaxDelay()
		};
		if (this.netzWorker && refraction.horizon) {
			const netzWorker = this.netzWorker;
			config.deferVisibleSunrise = (date) => netzWorker.request(date);
			netzWorker.configure(config, this.geoLocation);
			seedVisiblePlaceholders(config, replacing);
		}

		this.zmanCalc = new ZemanFunctions(this.geoLocation, config);
	}

	/**
	 * A visible sunrise arrived from the worker (already in the calculator's cache). Only the netz cell
	 * depends on it, so a list re-render is enough; today / tomorrow also feed the "up next" marker.
	 * @param {Temporal.PlainDate} date
	 * @private
	 */
	_onVisibleSunrise(date) {
		// marker first: updateZmanimList() draws it
		const today = Temporal.Now.plainDateISO(this.geoLocation.getTimeZone());
		if (date.equals(today) || date.equals(today.add({ days: 1 })))
			this.setNextUpcomingZman();

		if (date.equals(this.jCal.getDate().withCalendar("iso8601")))
			this.updateZmanimList();
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
			"hb": "זמנים ל" + locationName + " - זמני יוסף",
			"en": "Halachic Times for " + locationName + " - Zemaneh Yosef/זמני יוסף",
			"en-et": "Zemanim for " + locationName + " - Zemaneh Yosef/זמני יוסף"
		}[settings.language()];

		const shareIcon = document.createElement('i');
		shareIcon.classList.add("fa", "fa-share-alt");
		const shareData = {
			title: {
				"hb": "זמנים ל",
				"en": "Halachic Times for ",
				"en-et": "Zemanim for "
			}[settings.language()] + locationName,
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

	/**
	 * Set up the Intl date/time format tuple for the current locale and settings.
	 * Extracted from resetCalendar for readability.
	 */
	_setupLocaleFormat() {
		let local = settings.language() == 'hb' ? 'he' : 'en';
		if (navigator.languages.find(lang => lang.startsWith(local)))
			local = navigator.languages.find(lang => lang.startsWith(local));

		/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
		this.dtF = [local, {
			hourCycle: settings.timeFormat(),
			hour: 'numeric',
			minute: '2-digit'
		}];

		if (settings.seconds()) {
			this.dtF[1].second = '2-digit';
		}
	}

	// ─── Date Navigation ──────────────────────────────────────────────────────

	/**
	 * @param {Temporal.PlainDate} date
	 * @param {boolean} internal
	 */
	changeDate(date, internal=false) {
		this.zmanCalc.setDate(date);
		this.jCal.setDate(date);

		if (!internal) {
			// re-renders (e.g. after a forecast refresh) must not stack midnight timers
			if (this.timeoutToChangeDate !== null)
				clearTimeout(this.timeoutToChangeDate);
			this._cancelPrewarm();
			this.updateZmanimList();
			// With forecast refraction each new day costs ~100 ms of ray tracing; do the neighbours while
			// the user reads this one, so the next / previous click is instant
			this._cancelPrewarm = this.zmanCalc.prewarm(date);
			// Visible sunrises for the surrounding week, queued in the worker behind the day on screen
			if (this.netzWorker && this.zmanCalc.config.deferVisibleSunrise)
				this.netzWorker.prefetchAround(date.withCalendar("iso8601"), 7,
					(d) => hasCachedVisibleSunrise(this.zmanCalc.config, d));
			if (date.equals(Temporal.Now.plainDateISO())) {
				const tomorrow = Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone())
					.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0, millisecond: 0 });
				this.timeoutToChangeDate = setTimeout(
					() => this.changeDate(tomorrow.toPlainDate()),
					Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone())
						.until(tomorrow)
						.total('milliseconds')
				);
			} else {
				this.timeoutToChangeDate = null;
			}
		}
	}

	// ─── Render: Date Container ───────────────────────────────────────────────

	/**
	 * @param {HTMLElement} [dateContainer]
	 */
	renderDateContainer(dateContainer) {
		const date = this.jCal.dateRenderer(settings.language());

		/** @type {(keyof date)[]} */
		// @ts-ignore
		const dateKeys = Object.keys(date);
		for (const dateName of dateKeys) {
			const dateDisplay = dateContainer.querySelector(`[data-zfReplace="${dateName}Date"]`);
			dateDisplay.setAttribute('dir', date[dateName].dir);
			dateDisplay.innerHTML = date[dateName].text;
		}

		const boldDateHandler = (this.jCal.getDate().equals(Temporal.Now.plainDateISO())) ? 'add' : 'remove';
		dateContainer.classList[boldDateHandler]("text-bold");

		// FIX: Date-changer buttons are now wired here per container (not behind a one-time flag)
		// Safe to call on every render since the date used is always fresh from this.zmanCalc.
		// Buttons are only wired once per container element via a sentinel attribute.
		if (!dateContainer.dataset.buttonsWired) {
			for (const dateChanger of Array.from(dateContainer.getElementsByTagName('button')).filter(btn => btn.hasAttribute('data-dateAlter'))) {
				const days = parseInt(dateChanger.getAttribute("data-dateAlter"));
				if (isNaN(days))
					continue;

				dateChanger.addEventListener("click", () => this.changeDate(this.zmanCalc.coreZC.getDate().add({ days })));
			}

			for (const calendarBtn of dateContainer.getElementsByTagName('input')) {
				calendarBtn.addEventListener('calendarInsert',
					() => this.changeDate(Temporal.PlainDate.from(calendarBtn.getAttribute("date-value")))
				);
			}

			dateContainer.dataset.buttonsWired = "true";
		}
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

		// FIX: Properly await the fetch chain so errors are caught by the outer try/catch
		const makamObj = await this._makamObjPromise;

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

			if (this.jCal.isYomKippur()) {
				yomTzom.appendChild(document.createTextNode(
					zDTFromFunc(fastCalc.getTzetMelakha()).toLocaleString(...this.dtF) + ` (R"T: ${fastCalc.getTzetRT().toLocaleString(...this.dtF)})`
				));
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

	// ─── Render: Zmanim List (main) ───────────────────────────────────────────

	updateZmanimList() {
		for (const dateContainer of queryAllElements('[data-zfFind="dateContainer"]'))
			this.renderDateContainer(dateContainer);

		for (const fastContainer of queryAllElements('[data-zfFind="FastDays"]'))
			this.renderFastIndex(fastContainer);

		for (const parashaElem of queryAllElements('[data-zfFind="Parasha"]'))
			this.renderParashaBar(parashaElem);

		const dayText = /** @type {('en'|'hb')[]} */ (['en', 'hb'])
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
		this._renderBirchatHalevana();
		this._renderTachanun();
		this._renderHallel();
		this._renderTekufa();
		this._renderCalendarFormatter();
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

	_renderBirchatHalevana() {
		queryAllElements('[data-zfFind="BirchatHalevana"]').forEach((birchatHalevana) => {
			const birLev = this.jCal.birkathHalevanaCheck(this.zmanCalc);
			if (!birLev.current) {
				birchatHalevana.style.display = "none";
				return;
			}

			birchatHalevana.style.removeProperty("display");
			birchatHalevana.querySelectorAll('[data-zfReplace="date-en-end"]').forEach(
				endDate => endDate.innerHTML = birLev.data.end.toLocaleString("en", {day: 'numeric', month: 'short'})
			);
			birchatHalevana.querySelector('[data-zfReplace="date-hb-end"]').innerHTML =
				birLev.data.end.toLocaleString("he", {day: 'numeric', month: 'short'});

			/** @type {NodeListOf<HTMLElement>} */ (birchatHalevana.querySelectorAll('[data-zfFind="starts-tonight"]')).forEach(
				startsToday => {
					if (birLev.data.start.dayOfYear == this.jCal.getDate().dayOfYear)
						startsToday.style.removeProperty("display");
					else
						startsToday.style.display = "none";
				}
			);

			/** @type {NodeListOf<HTMLElement>} */ (birchatHalevana.querySelectorAll('[data-zfFind="ends-tonight"]')).forEach(
				endsToday => {
					if (birLev.data.end.dayOfYear == this.jCal.getDate().dayOfYear)
						endsToday.style.removeProperty("display");
					else
						endsToday.style.display = "none";
				}
			);
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
		const tekufaRange = /** @type {('add' | 'subtract')[]} */ (['add', 'subtract'])
			.map((act) => nextTekufa[act]({ minutes: 30 }));

		if (new Set(tekufaRange.map(range => range.toPlainDate())).keys().some(tekTime => tekTime.equals(this.jCal.getDate()))) {
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

	_renderCalendarFormatter() {
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
				const timeDisplay = timeSlot.getElementsByClassName('timeDisplay')[0];
				if (!(zmanId in zmanInfo)) {
					if (!Object.keys(zmanInfo).find((value) => value.startsWith(zmanId))) {
						timeSlot.style.setProperty('display', 'none', 'important');
						continue;
					}

					let allRowsHidden = true;
					let firstAlreadyGone = false;
					let invalidShitot = 0;
					const shitot = timeDisplay.querySelectorAll('[data-subZmanId]');
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
							timeDisplay.lastElementChild.innerHTML = "XX:XX";
							continue;
						}

						/** @type {HTMLElement} */
						// @ts-ignore
						const upNextElem = shita.firstElementChild;
						if (this.isNextUpcomingZman(zmanInfo[completeName].zDTObj))
							upNextElem.style.removeProperty("display");
						else
							upNextElem.style.display = "none";

						shita.lastElementChild.innerHTML = zmanInfo[completeName].zDTObj.toLocaleString(...zmanInfo[completeName].dtF);

						const validMergeTitle = 'merge_title' in zmanInfo[completeName];
						if (validMergeTitle && zmanInfo[completeName].merge_title.hb)
							timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[completeName].merge_title.hb;
						else if (zmanInfo[completeName].title.hb)
							timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[completeName].title.hb;

						if (validMergeTitle && zmanInfo[completeName].merge_title.en)
							timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[completeName].merge_title.en;
						else if (zmanInfo[completeName].title.en)
							timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[completeName].title.en;

						if (validMergeTitle && zmanInfo[completeName].merge_title["en-et"])
							timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[completeName].merge_title["en-et"];
						else if (zmanInfo[completeName].title["en-et"])
							timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[completeName].title["en-et"];

						if (!zmanInfo[completeName].display) {
							shita.style.setProperty('display', 'none', 'important');
							invalidShitot++;
						} else {
							allRowsHidden = false;
							shita.style.removeProperty('display');

							if (!firstAlreadyGone) {
								firstAlreadyGone = true;
								shita.classList.remove("leftBorderForShita");

								if (invalidShitot == 1 && shitot.length == 2)
									shita.style.gridColumn = "span 2";
							} else {
								shita.classList.add("leftBorderForShita");
								shita.style.removeProperty('grid-column');
							}
						}
					}

					if (allRowsHidden)
						timeSlot.style.setProperty('display', 'none', 'important');
					else
						timeSlot.style.removeProperty('display');
				} else {
					if (zmanInfo[zmanId].display == -1) {
						timeSlot.style.setProperty('display', 'none', 'important');
						continue;
					}

					if (zmanInfo[zmanId].display == -2) {
						timeSlot.style.removeProperty("display");
						timeDisplay.lastElementChild.innerHTML = "XX:XX";
						continue;
					}

					/** @type {HTMLElement} */
					// @ts-ignore
					const upNextElem = timeDisplay.firstElementChild;
					if (this.isNextUpcomingZman(zmanInfo[zmanId].zDTObj))
						upNextElem.style.removeProperty("display");
					else
						upNextElem.style.display = "none";

					timeDisplay.lastElementChild.innerHTML = zmanInfo[zmanId].zDTObj.toLocaleString(...zmanInfo[zmanId].dtF);

					if (zmanInfo[zmanId].title.hb)
						timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[zmanId].title.hb;

					if (zmanInfo[zmanId].title.en)
						timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[zmanId].title.en;

					if (zmanInfo[zmanId].title["en-et"])
						timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[zmanId].title["en-et"];

					if (!zmanInfo[zmanId].display)
						timeSlot.style.setProperty('display', 'none', 'important');
					else
						timeSlot.style.removeProperty('display');
				}

				if (timeSlot.hasAttribute('data-specialDropdownContent')) {
					const description = timeSlot.querySelector('.accordianContent');
					description.innerHTML = description.innerHTML
						.split('${getAteretTorahSunsetOffset()}').join(settings.customTimes.tzeithIssurMelakha().minutes.toString())
						.split('${getCandleLightingOffset()}').join(this.zmanCalc.coreZC.getCandleLightingOffset().toString());
				}
			}
			calendarContainer.classList.remove("loading");
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
		if (this.jCal.getDate().equals(Temporal.Now.plainDateISO())
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

	// ─── Next Upcoming Zman ───────────────────────────────────────────────────

	setNextUpcomingZman() {
		// FIX: Clear any existing timeout before scheduling a new one to prevent accumulation
		if (this.nextUpcomingZmanTimeout !== null) {
			clearTimeout(this.nextUpcomingZmanTimeout);
			this.nextUpcomingZmanTimeout = null;
		}

		/** @type {Temporal.ZonedDateTime[]} */
		const zmanim = [];
		const currentSelectedDate = this.zmanCalc.coreZC.getDate();

		for (const days of [0, 1]) {
			this.changeDate(Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()).add({ days }), true);
			zmanim.push(...Object.values(this.jCal.getZmanimInfo(false, this.zmanCalc, this.zmanimList, this.dtF)).filter(obj => obj.display == 1).map(time => time.zDTObj));
		}

		this.changeDate(currentSelectedDate, true);
		zmanim.sort(Temporal.ZonedDateTime.compare);
		this.nextUpcomingZman = zmanim.find(zman =>
			Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone()).until(zman).total({ unit: "milliseconds" }) > 0
		);

		// FIX: Store the timeout ID so it can be cleared on the next call
		this.nextUpcomingZmanTimeout = setTimeout(
			() => { this.setNextUpcomingZman(); this.updateZmanimList(); },
			Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone())
				.until(this.nextUpcomingZman)
				.total({ unit: "milliseconds" })
		);
	}

	/**
	 * @param {Temporal.ZonedDateTime} zman
	 */
	isNextUpcomingZman(zman) {
		return !(this.nextUpcomingZman == null || !(zman.equals(this.nextUpcomingZman)));
	}
}

// ─── Module Init ──────────────────────────────────────────────────────────────

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
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

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} selector
 * @returns {Array<T>}
 */
function queryAllElements(selector) {
	/** @type {NodeListOf<T>} */
	const allNodes = (document.querySelectorAll(selector));
	return [...allNodes].filter(node => node instanceof HTMLElement);
}