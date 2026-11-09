// @ts-check

/**
 * The live list of the day's zemanim, shared by the calendar (zmanimListUpdater.js) and the Hazon Yosef page
 * (hazon-yosef-calendar.js). It owns the place, the date, the calculator and its weather / horizon data, the
 * "up next" marker and the move to the next day at midnight, and fills in the page's
 * [data-zfFind="calendarFormatter"] rows. Everything that differs between the pages comes from a subclass:
 * the rulings and time format (the calendar's follow the visitor's settings, Hazon Yosef's never do; this
 * file imports no settings), and the rest of what each page draws.
 *
 * After every render it fires `zmanimRendered` on the document (detail: the list), for what a page draws
 * beside it from the same calculator (Hazon Yosef's Shabbat and holiday cards, /handasi-hazeman's notices).
 */

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions, methodNamesOf, seedVisiblePlaceholders, hasCachedVisibleSunrise } from "./ROYZmanim.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import { loadRefraction, readCachedRefraction, providerFromCache, refractionRecheckMs } from "./refraction-data.js";
import { notBeforeEarliest, atNextDay } from "./misc/util.js";
import { showListLoadingAfterDelay } from "./list-loading.js";
import VisibleSunriseClient from "./visible-sunrise-client.js";

/**
 * A row of the list, read from the page
 * @typedef {Object} ZmanimDisplay
 * @property {string} function - Method name from ZemanFunctions
 * @property {boolean} yomTovInclusive - Include if Yom Tov
 * @property {boolean} luachInclusive - Include if in Hebrew calendar
 * @property {string|null} condition - Custom condition
 * @property {string|null} round - Rounding strategy
 * @property {{he: string; en: string; 'he-Latn': string}} title - Display titles
 * @property {boolean} [ignoreNextUpcoming] - never marked "up next"
 */

/** @typedef {Pick<import("./ROYZmanim.js").ZemanimConfig, 'atmosphereProvider' | 'horizon' | 'haze'>} Refraction */
/** @typedef {[string | string[], options?: Intl.DateTimeFormatOptions]} TimeFormat */
/** @typedef {ReturnType<WebsiteLimudCalendar['getZmanimInfo']>[string]} ZmanInfo */

export default class ZmanimList {
	/**
	 * Reads the page's rows; nothing is computed until start()
	 * @param {Temporal.PlainDate} today the first date shown
	 */
	constructor(today) {
		this.jCal = new WebsiteLimudCalendar(today);
		this.jCal.setUseModernHolidays(true);

		/** @type {KosherZmanim.GeoLocation} */
		this.geoLocation = undefined;
		/** @type {import("./ROYZmanim.js").ZemanFunctions} */
		this.zmanCalc = undefined;
		/** @type {TimeFormat} */
		this.dtF = ['he', { hour: 'numeric', minute: '2-digit' }];

		/** Latest full refraction data (forecast + horizon); null until the first load finishes. @type {import("./refraction-data.js").RefractionData | null} */
		this.refraction = null;
		/** When the forecast currently on screen was downloaded (null = normals only), to skip no-op re-renders. @type {number | null} */
		this._shownForecastAt = null;
		/** Bumped on every location change, so a slow load for an old location is dropped. */
		this._refractionToken = 0;
		/** Bumped on every resetCalendar, so a slow read of stored data for an old location is dropped. */
		this._resetGen = 0;
		/** Cancels the pending loading shimmer of the last resetCalendar. */
		this._stopListLoading = () => {};
		/** Next check for a newer forecast. @type {ReturnType<typeof setTimeout> | null} */
		this._refractionRefresh = null;
		/** @type {null|ReturnType<typeof setTimeout>} */
		this.timeoutToChangeDate = null;
		/** Cancels the idle-time precomputation of the days around the shown one. */
		this._cancelPrewarm = () => {};

		/** @type {null|Temporal.ZonedDateTime} */
		this.nextUpcomingZman = null;
		/** @type {null|ReturnType<typeof setTimeout>} */
		this.nextUpcomingZmanTimeout = null;

		/** Text shown last (parasha, day…), to skip rewriting what hasn't changed @type {Record<string, string | undefined>} */
		this.lastData = {};

		/**
		 * Visible sunrise (terrain ray tracing, up to ~100 ms a day) runs in a worker; the netz row shows
		 * sea-level sunrise until it answers. null where module workers aren't available: computed inline then.
		 * @type {VisibleSunriseClient | null}
		 */
		this.netzWorker = null;
		try {
			this.netzWorker = new VisibleSunriseClient((date) => this._onVisibleSunrise(date));
		} catch (e) {
			console.warn("Visible sunrise worker unavailable; computing on the main thread", e);
		}

		/**
		 * The calculator class. A page can put its own rulings in place of ZY's by setting window.zemanClass to a
		 * subclass of ZemanFunctions (in a module script before this one); without it, ZemanFunctions.
		 * @type {typeof ZemanFunctions}
		 */
		// @ts-ignore
		this.ZemanClass = window.zemanClass ?? ZemanFunctions;
		const methodNames = methodNamesOf(this.ZemanClass);

		/** The rows, from every [data-zfFind="calendarFormatter"] on the page @type {Record<string, ZmanimDisplay>} */
		this.zmanimList = {};
		for (const calendarContainer of document.querySelectorAll('[data-zfFind="calendarFormatter"]')) {
			for (const timeSlot of calendarContainer.children) {
				const id = timeSlot.getAttribute('data-zmanid');
				const getter = timeSlot.getAttribute('data-timeGetter');
				if (id === null || !(id == 'candleLighting' || (getter && methodNames.includes(getter))))
					continue;

				// one name (Hazon Yosef), or one per language
				const single = timeSlot.querySelector('.zmanTitleText');
				this.zmanimList[id] = Object.freeze({
					function: getter,
					yomTovInclusive: /** @type {any} */ (timeSlot.getAttribute('data-yomTovInclusive')),
					luachInclusive: /** @type {any} */ (timeSlot.getAttribute('data-luachInclusive')),
					condition: timeSlot.getAttribute('data-condition'),
					round: timeSlot.getAttribute('data-round'),
					title: single
						? { he: single.innerHTML, en: "", 'he-Latn': "" }
						: {
							he: timeSlot.querySelector('span.lang.lang-he')?.innerHTML ?? "",
							en: timeSlot.querySelector('span.lang.lang-en')?.innerHTML ?? "",
							'he-Latn': timeSlot.querySelector('span.lang.lang-he-Latn')?.innerHTML ?? ""
						},
					ignoreNextUpcoming: timeSlot.hasAttribute('data-ignoreNextUpcoming')
				});
			}
		}
	}

	/**
	 * Show a place (the first one, once the subclass is set up)
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	start(geoLocation) {
		/** Settles once the first location is rendered (from stored data, or without it). */
		this.ready = this.resetCalendar(geoLocation);
		return this.ready;
	}

	// ─── What a page supplies ─────────────────────────────────────────────────

	/**
	 * The calculator's configuration for this.geoLocation
	 * @param {Refraction} refraction
	 * @returns {{ config: import("./ROYZmanim.js").ZemanimConfig; inIsrael: boolean }}
	 */
	// eslint-disable-next-line no-unused-vars
	zemanimConfig(refraction) {
		throw new Error("ZmanimList: zemanimConfig() is the page's");
	}

	/** How times are shown @returns {TimeFormat} */
	timeFormat() {
		return ['he', { hourCycle: 'h23', hour: 'numeric', minute: '2-digit' }];
	}

	/** The page's language @returns {'he' | 'en' | 'he-Latn'} */
	language() {
		return 'he';
	}

	/** Options for loading the weather (refraction-data.js) @returns {{ humidity?: boolean }} */
	refractionOptions() {
		return {};
	}

	/** A place is being shown (the calculator is already for it; its stored data is still being read) */
	locationShown() {}

	/** The calendar has been reset for a place, and rendered */
	calendarReset() {}

	/**
	 * Refraction data came in
	 * @param {boolean} changed whether it changed what's shown (then the page was rendered again)
	 */
	// eslint-disable-next-line no-unused-vars
	refractionLoaded(changed) {}

	/** Everything the page draws besides the rows and the date (called on every render) */
	renderPage() {}

	/**
	 * A row was filled in
	 * @param {HTMLElement} timeSlot @param {string} zmanId
	 * @param {ZmanInfo} [info] (none for a row of several opinions)
	 */
	// eslint-disable-next-line no-unused-vars
	rowRendered(timeSlot, zmanId, info) {}

	/**
	 * Times of today and tomorrow that can be "up next" besides the shown rows (the calculator is on the day)
	 * @returns {Temporal.ZonedDateTime[]}
	 */
	upcomingExtras() {
		return [];
	}

	/**
	 * The shown rows of today and tomorrow, in order of day (for notifications)
	 * @param {[string, ZmanInfo][]} rows
	 */
	// eslint-disable-next-line no-unused-vars
	upcomingRows(rows) {}

	/**
	 * Whether a row gets the "up next" marker
	 * @param {string} zmanId @param {ZmanInfo} info
	 */
	isUpNext(zmanId, info) {
		return this.isNextUpcomingZman(info.zDTObj);
	}

	// ─── Place ────────────────────────────────────────────────────────────────

	/**
	 * Reset the calendar for a place. Renders as soon as what previous visits stored (forecast snapshot,
	 * terrain horizon, monthly normals) is read; fetches a new forecast only if the stored one is stale. For
	 * the same place (a setting changed) the data already on screen is reused, with no wait.
	 * Never rejects. `zmanCalc` is for the new place as soon as this is called; the list is rendered when
	 * the returned promise settles (a newer call before then takes over, and this one renders nothing).
	 * @param {KosherZmanim.GeoLocation} [geoLocation]
	 * @returns {Promise<void>}
	 */
	async resetCalendar(geoLocation = this.geoLocation) {
		const gen = ++this._resetGen;
		this._stopListLoading();
		if (this.timeoutToChangeDate !== null)
			clearTimeout(this.timeoutToChangeDate);
		this.timeoutToChangeDate = null;

		const previous = this.geoLocation;
		const loaded = this.refraction;
		const samePlace = loaded !== null && previous !== undefined
			&& previous.getLatitude() === geoLocation.getLatitude() && previous.getLongitude() === geoLocation.getLongitude();
		this.geoLocation = geoLocation;

		if (!samePlace) {
			// drop a load still running for the old place (it would apply the old place's data)
			this._refractionToken++;
			if (this._refractionRefresh !== null) {
				clearTimeout(this._refractionRefresh);
				this._refractionRefresh = null;
			}
			this.refraction = null;
			// a calculator for the new place right away (no refraction yet), so nothing that runs while the
			// stored data is read computes for the old place
			this._setupZmanCalc({ atmosphereProvider: null, horizon: null, haze: null });
		}
		this.dtF = this.timeFormat();
		this.locationShown();

		/** @type {Refraction} */
		let refraction;
		if (samePlace) {
			const data = /** @type {import("./refraction-data.js").RefractionData} */ (loaded);
			this._shownForecastAt = data.forecastFetchedAt;
			refraction = { atmosphereProvider: data.provider, horizon: data.horizon, haze: data.haze };
		} else {
			const stopLoading = this._stopListLoading = showListLoadingAfterDelay();
			const cached = await readCachedRefraction(geoLocation.getLatitude(), geoLocation.getLongitude());
			stopLoading();
			if (gen !== this._resetGen)
				return; // another location (or setting) came in while this was read

			this._shownForecastAt = cached?.forecast?.fetchedAt ?? null;
			refraction = {
				atmosphereProvider: providerFromCache(cached),
				horizon: cached?.horizon ?? null,
				haze: cached?.haze ?? null
			};
		}
		// same place: its visible sunrises stay on screen until the worker computes them again
		this._setupZmanCalc(refraction, samePlace ? this.zmanCalc.config : undefined);

		this.lastData = {};
		this.setNextUpcomingZman();
		this.changeDate(this.jCal.getDate());

		this._loadRefraction();
		this.calendarReset();
	}

	/**
	 * Get current refraction data (from storage when fresh, else the network), re-render only if it
	 * differs from what's shown, and schedule the next check for when the forecast goes stale.
	 * Failures are logged, never thrown: the page keeps the stored / default model.
	 * @param {{ force?: boolean }} [options] force: download a new forecast even if the stored one is fresh
	 *   (the location modal's "Refresh forecast")
	 * @returns {Promise<boolean>} whether a new forecast was downloaded
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
				...this.refractionOptions(),
				force: options.force === true
			});
		} catch (e) {
			console.error("Refraction data failed to load", e);
			return false;
		}
		if (token !== this._refractionToken)
			return false; // the location changed while we were loading

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
		this.refractionLoaded(changed);

		this._refractionRefresh = setTimeout(() => this._loadRefraction(), refractionRecheckMs(data));
		return !data.fromCache && data.forecastFetchedAt !== null;
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
	 * The calculator for the current geoLocation
	 * @param {Refraction} refraction
	 * @param {import("./ROYZmanim.js").ZemanimConfig} [replacing] the config this one replaces for the SAME
	 *   place: its visible sunrises stay on screen until the worker computes the new ones
	 * @private
	 */
	_setupZmanCalc(refraction, replacing) {
		const { config, inIsrael } = this.zemanimConfig(refraction);
		this.jCal.setInIsrael(inIsrael);

		if (this.netzWorker && refraction.horizon) {
			const netzWorker = this.netzWorker;
			config.deferVisibleSunrise = (date) => netzWorker.request(date);
			netzWorker.configure(config, this.geoLocation);
			seedVisiblePlaceholders(config, replacing);
		}

		this.zmanCalc = new this.ZemanClass(this.geoLocation, config);
	}

	/**
	 * A visible sunrise arrived from the worker (already in the calculator's cache). Only what shows sunrise
	 * depends on it, so a re-render is enough; today / tomorrow also feed the "up next" marker.
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

	// ─── Date ─────────────────────────────────────────────────────────────────

	/**
	 * @param {Temporal.PlainDate} date
	 * @param {boolean} internal only move the calculator and calendar (no render)
	 */
	changeDate(date, internal = false) {
		// nothing before the Gregorian calendar (15 October 1582)
		date = notBeforeEarliest(date);
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
			// showing today: move on to tomorrow at midnight
			if (date.equals(Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()))) {
				this.timeoutToChangeDate = atNextDay(this.geoLocation.getTimeZone(), day => this.changeDate(day));
			} else {
				this.timeoutToChangeDate = null;
			}
		}
	}

	// ─── Render ───────────────────────────────────────────────────────────────

	updateZmanimList() {
		for (const dateContainer of queryAllElements('[data-zfFind="dateContainer"]'))
			this.renderDateContainer(dateContainer);

		this._renderCalendarFormatter();
		this.renderPage();

		document.dispatchEvent(new CustomEvent("zmanimRendered", { detail: this }));
	}

	/**
	 * The date, its arrows and the date picker
	 * @param {HTMLElement} dateContainer
	 */
	renderDateContainer(dateContainer) {
		const date = this.jCal.dateRenderer(this.language());

		/** @type {(keyof date)[]} */
		// @ts-ignore
		const dateKeys = Object.keys(date);
		for (const dateName of dateKeys) {
			const dateDisplay = dateContainer.querySelector(`[data-zfReplace="${dateName}Date"]`);
			dateDisplay.setAttribute('dir', date[dateName].dir);
			dateDisplay.innerHTML = date[dateName].text;
		}

		const boldDateHandler = (this.jCal.getDate().equals(Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()))) ? 'add' : 'remove';
		dateContainer.classList[boldDateHandler]("text-bold");

		// wired once per container
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

		// the date picker (misc/date-picker.js) opens on the date shown
		for (const calendarBtn of dateContainer.getElementsByTagName('input'))
			calendarBtn.setAttribute("date-value", this.jCal.getDate().withCalendar("iso8601").toString());
	}

	/**
	 * Set a row's name (a ruling can rename it): one name, or one per language
	 * @param {HTMLElement} timeSlot @param {ZmanInfo['title']} title
	 * @param {string} [scope] where the language spans are
	 */
	_setRowTitle(timeSlot, title, scope = '') {
		const single = timeSlot.querySelector('.zmanTitleText');
		if (single) {
			if (title.he)
				single.innerHTML = title.he;
			return;
		}
		for (const lang of /** @type {const} */ (['he', 'en', 'he-Latn']))
			if (title[lang])
				timeSlot.querySelector(scope + '.lang-' + lang).innerHTML = title[lang];
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

				const zmanId = timeSlot.getAttribute('data-zmanid');
				const timeDisplay = timeSlot.getElementsByClassName('timeDisplay')[0];
				if (!(zmanId in zmanInfo)) {
					// a row of several opinions: data-subZmanId entries "<row>-<opinion>"
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

						const completeName = zmanId + '-' + shita.getAttribute('data-subZmanId');
						const info = zmanInfo[completeName];

						if (info.display == -1) {
							shita.style.setProperty('display', 'none', 'important');
							continue;
						}

						if (info.display == -2) {
							allRowsHidden = false;
							timeSlot.style.removeProperty("display");
							timeDisplay.lastElementChild.innerHTML = "XX:XX";
							continue;
						}

						/** @type {HTMLElement} */
						// @ts-ignore
						const upNextElem = shita.firstElementChild;
						if (this.isUpNext(completeName, info))
							upNextElem.style.removeProperty("display");
						else
							upNextElem.style.display = "none";

						shita.lastElementChild.innerHTML = info.zDTObj.toLocaleString(...info.dtF);

						const merged = 'merge_title' in info ? /** @type {any} */ (info).merge_title : {};
						this._setRowTitle(timeSlot, {
							he: merged.he || info.title.he,
							en: merged.en || info.title.en,
							'he-Latn': merged["he-Latn"] || info.title["he-Latn"]
						});

						if (!info.display) {
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

					this.rowRendered(timeSlot, zmanId);
				} else {
					const info = zmanInfo[zmanId];
					if (info.display == -1) {
						timeSlot.style.setProperty('display', 'none', 'important');
						continue;
					}

					if (info.display == -2) {
						timeSlot.style.removeProperty("display");
						timeDisplay.lastElementChild.innerHTML = "XX:XX";
						continue;
					}

					if (!this.zmanimList[zmanId]?.ignoreNextUpcoming) {
						/** @type {HTMLElement} */
						// @ts-ignore
						const upNextElem = timeDisplay.firstElementChild;
						if (this.isUpNext(zmanId, info))
							upNextElem.style.removeProperty("display");
						else
							upNextElem.style.display = "none";
					}

					timeDisplay.lastElementChild.innerHTML = info.zDTObj.toLocaleString(...info.dtF);

					// the name's own spans: sunrise / sunset have language-switched icons in front of them
					this._setRowTitle(timeSlot, info.title, '.accordianText > ');

					if (!info.display)
						timeSlot.style.setProperty('display', 'none', 'important');
					else
						timeSlot.style.removeProperty('display');

					this.rowRendered(timeSlot, zmanId, info);
				}
			}
			calendarContainer.classList.remove("loading");
		}
	}

	// ─── Next Upcoming Zman ───────────────────────────────────────────────────

	setNextUpcomingZman() {
		if (this.nextUpcomingZmanTimeout !== null) {
			clearTimeout(this.nextUpcomingZmanTimeout);
			this.nextUpcomingZmanTimeout = null;
		}

		/** @type {Temporal.ZonedDateTime[]} */
		const zmanim = [];
		/** @type {[string, ZmanInfo][]} */
		const rows = [];
		// the calendar has the date shown (a calculator just set up for a place starts on today)
		const currentSelectedDate = this.jCal.getDate().withCalendar("iso8601");

		for (const days of [0, 1]) {
			this.changeDate(Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()).add({ days }), true);
			for (const [zmanId, zman] of Object.entries(this.jCal.getZmanimInfo(false, this.zmanCalc, this.zmanimList, this.dtF))) {
				if (zman.display != 1)
					continue;
				zmanim.push(zman.zDTObj);
				if (zman.zDTObj)
					rows.push([zmanId, zman]);
			}
			zmanim.push(...this.upcomingExtras());
		}

		this.changeDate(currentSelectedDate, true);
		this.upcomingRows(rows);
		zmanim.sort(Temporal.ZonedDateTime.compare);
		const now = Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone());
		this.nextUpcomingZman = zmanim.find(zman => now.until(zman).total({ unit: "milliseconds" }) > 0) ?? null;

		if (this.nextUpcomingZman)
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
		return this.nextUpcomingZman !== null && !!zman && zman.equals(this.nextUpcomingZman);
	}
}

/**
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} selector
 * @returns {Array<T>}
 */
export function queryAllElements(selector) {
	/** @type {NodeListOf<T>} */
	const allNodes = (document.querySelectorAll(selector));
	return [...allNodes].filter(node => node instanceof HTMLElement);
}
