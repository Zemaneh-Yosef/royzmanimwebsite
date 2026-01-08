// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { Parsha, Temporal } from "../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions, methodNames, zDTFromFunc } from "./ROYZmanim.js";
import { HebrewNumberFormatter } from "./WebsiteCalendar.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";

/** @typedef {{ datesToZman: Map<Temporal.PlainDate, Record<string, Temporal.ZonedDateTime>>; extra?: string } & ({ytI: number; title?: string} | { title: string })} highlightedZman */

export default class zmanimListUpdater {
	constructor() {
		/** @type {HTMLSelectElement} */
		// @ts-ignore
		const matLocSelect = document.getElementById("locationSelector");

		const locationGeoList = Array.from(matLocSelect.options).map(option => {
			const geoLData = JSON.parse(option.value)
			return new KosherZmanim.GeoLocation(
				option.text,
				geoLData.lat,
				geoLData.lng,
				geoLData.elevation,
				geoLData.timezone
			);
		});
		matLocSelect.addEventListener('change', (chngEvnt) => {
			let sameDayEnsure = this.jCal.getDate().equals(Temporal.Now.plainDateISO(locationGeoList[matLocSelect.selectedIndex].getTimeZone()));
			this.resetCalendar(locationGeoList[matLocSelect.selectedIndex]);

			if (sameDayEnsure)
				this.changeDate(Temporal.Now.plainDateISO(locationGeoList[matLocSelect.selectedIndex].getTimeZone()));
		});

		this.jCal = new WebsiteLimudCalendar(Temporal.Now.plainDateISO(locationGeoList[matLocSelect.selectedIndex].getTimeZone()));
		this.jCal.setUseModernHolidays(true);

		this.weekPlainDate = getStartOfWeek();

		/** @type {null|Temporal.ZonedDateTime} */
		this.nextUpcomingZman = null;

		this.buttonsInit = false;
		this.midDownload = false;

		/** @type {null|NodeJS.Timeout} */ // It's not node but whatever
		this.countdownToNextDay = null;

		/** @type {Parameters<typeof this.jCal.getZmanimInfo>[2]} */
		this.zmanimList = {};

		// Switch this to a loop that will query _all_ calendarFormatter instances
		for (const calendarContainer of document.querySelectorAll('[data-zfFind="calendarFormatter"]')) {
			Object.assign(this.zmanimList, Object.fromEntries(Array.from(calendarContainer.children)
				.map(timeSlot => [timeSlot.getAttribute('data-zmanid'), Object.freeze({
					function: timeSlot.getAttribute('data-timeGetter'),
					yomTovInclusive: timeSlot.getAttribute('data-yomTovInclusive'),
					luachInclusive: timeSlot.getAttribute('data-luachInclusive'),
					condition: timeSlot.getAttribute('data-condition'),
					round: timeSlot.getAttribute('data-round'),
					title: {
						'hb': timeSlot.querySelector('.zmanTitleText').innerHTML,
						'en': "",
						'en-et': ""
					},
					ignoreNextUpcoming: timeSlot.hasAttribute('data-ignoreNextUpcoming')
				})])
				.filter(
					arrayEntry =>
						arrayEntry[0] !== null
						// @ts-ignore
						&& (arrayEntry[0] == 'candleLighting' || (arrayEntry[1].function && methodNames.includes(arrayEntry[1].function)))
				)));
		}

		for (const weekButtonElem of document.querySelectorAll('[data-zyWeek]')) {
			weekButtonElem.addEventListener('click', (event) => {
				const weekOffset = parseInt(weekButtonElem.getAttribute('data-zyWeek'));
				this.weekPlainDate = this.weekPlainDate[weekOffset > 0 ? 'add' : 'subtract']({ weeks: Math.abs(weekOffset) });
				this.updateWeekListing();
			});
		}

		for (const weekButtonElem of document.getElementsByClassName('day-box')) {
			weekButtonElem.addEventListener('click', (event) => {
				const zyDate = weekButtonElem.getAttribute('data-zyDate');
				this.changeDate(Temporal.PlainDate.from(zyDate));
				this.updateWeekListing();
			});
		}

		this.resetCalendar(locationGeoList[matLocSelect.selectedIndex]);
	}

	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 */
	resetCalendar(geoLocation = this.geoLocation) {
		/** @type {highlightedZman[]} */
		this.weekImportantZmanim = [];

		/** @type {Temporal.PlainDate} */
		this.startZman = null;

		this.timeoutToChangeDate = null;
		this.geoLocation = geoLocation;

		/** @type {number[]} */
		let availableVS = [];
		if (typeof localStorage !== "undefined" && localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
			const ctNetz = JSON.parse(localStorage.getItem('ctNetz'))
			if ('url' in ctNetz) {
				const ctNetzLink = new URL(ctNetz.url);

				if (ctNetzLink.searchParams.get('cgi_eroslatitude') == geoLocation.getLatitude().toFixed(6)
					&& ctNetzLink.searchParams.get('cgi_eroslongitude') == (-geoLocation.getLongitude()).toFixed(6))
					availableVS = ctNetz.times
			}
		}

		this.jCal.setInIsrael(geoLocation.getTimeZone() == 'Asia/Jerusalem');

		this.zmanCalc = new ZemanFunctions(geoLocation, {
			elevation: this.jCal.getInIsrael(),
			fixedMil: this.jCal.getInIsrael(),
			rtKulah: !this.jCal.getInIsrael(),
			candleLighting: 20,
			melakha: { minutes: 30, degree: 7.14 }
		})
		this.zmanCalc.setVisualSunrise(availableVS);

		/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
		this.dtF = ['he', {
			hourCycle: 'h23',
			hour: 'numeric',
			minute: '2-digit'
		}];

		/*if (settings.seconds()) {
			this.dtF[1].second = '2-digit'
		} */

		this.lastData = {
			'parsha': undefined,
			'day': undefined,
			'specialDay': undefined,
			'hamah': undefined,
			'levana': undefined
		}

		this.setNextUpcomingZman();
		this.changeDate(this.jCal.getDate());
	}

	updateWeekListing(date = this.weekPlainDate) {
		const hNum = new HebrewNumberFormatter();
		const weekContainer = document.getElementsByClassName('week-strip')[0];

		const start = getStartOfWeek(date);

		for (let i = 0; i < 7; i++) {
			const date = start.add({ days: i });
			const dateElem = weekContainer.children[i];

			dateElem.setAttribute('data-zyDate', date.toString());

			dateElem.getElementsByClassName("gregorian")[0].innerHTML = date.toLocaleString("he-IL", {
				day: "numeric",
				month: "numeric"
			});

			dateElem.getElementsByClassName("hebrew-date")[0].innerHTML =
				hNum.formatHebrewNumber(date.withCalendar("hebrew").day) + " " +
				date.toLocaleString("he-IL-u-ca-hebrew", { month: "long" });

			if (date.equals(this.jCal.getDate())) {
				dateElem.classList.add("current");
			} else {
				dateElem.classList.remove("current");
			}
		}

		if (start !== this.startZman) {
			this.weekImportantZmanim = [];

			// Backup important zmanim for the week
			const resetDate = this.jCal.getDate();
			for (let i = 0; i < 7; i++) {
				const date = start.add({ days: i });
				this.jCal.setDate(date);
				this.zmanCalc.setDate(date);

				this.generateDayImportantZmanim(this.weekImportantZmanim);
			}
			this.jCal.setDate(resetDate);
			this.zmanCalc.setDate(resetDate);

			// We have an element on the page with the ID "weekSpecial"
			// Clear all of its contents, then repopulate them with the Zemanim from this.weekImportantZmanim
			// Title will be an <h1> tag, then the rest will be part of a list

			const weekSpecialElem = document.getElementById("weekSpecial");
			for (const child of Array.from(weekSpecialElem.children)) {
				weekSpecialElem.removeChild(child);
			}
			for (const highlightZman of this.weekImportantZmanim) {
				const titleElem = document.createElement("h1");
				titleElem.innerHTML = highlightZman.title;
				weekSpecialElem.appendChild(titleElem);

				const zmanListElem = document.createElement("ul");
				for (const [zmanDate, zmanTimes] of highlightZman.datesToZman.entries()) {
					const dateHeaderElem = document.createElement("h2");
					dateHeaderElem.innerHTML = zmanDate.toLocaleString("he-IL-u-ca-hebrew", {
						day: "numeric",
						month: "long",
						year: "numeric"
					});
					weekSpecialElem.appendChild(dateHeaderElem);

					for (const [zmanKey, zmanTime] of Object.entries(zmanTimes)) {
						const zmanItemElem = document.createElement("li");
						zmanItemElem.innerHTML = `${zmanKey}: ${zmanTime.toLocaleString(...this.dtF)}`;
						zmanListElem.appendChild(zmanItemElem);
					}
				}
				weekSpecialElem.appendChild(zmanListElem);

				if (highlightZman.extra) {
					const extraElem = document.createElement("p");
					extraElem.innerHTML = highlightZman.extra;
					weekSpecialElem.appendChild(extraElem);
				}
			}

			this.startZman = start;
		}

	}

	/**
	 * @param {Temporal.PlainDate} date
	 * @param {boolean} internal
	 */
	changeDate(date, internal = false) {
		this.zmanCalc.setDate(date)
		this.jCal.setDate(date);

		if (!internal) {
			this.updateWeekListing();
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

	async renderParashaBar() {
		let parashaText = this.jCal.getHebrewParasha().join(" - ");
		if (parashaText == "No Parasha this week"
			&& [5, 6].includes(this.jCal.getDate().dayOfWeek)
			&& [KosherZmanim.JewishCalendar.NISSAN, KosherZmanim.JewishCalendar.TISHREI].includes(this.jCal.getJewishMonth()))
			parashaText = "חול המועד " + (this.jCal.getDate().withCalendar("hebrew").month == 1 ? "סוכות" : "פסח")
		else
			parashaText = "פרשת " + parashaText;

		if (this.lastData.parsha !== parashaText) {
			this.lastData.parsha = parashaText
			for (const parashaElem of document.querySelectorAll('[data-zfReplace="Parasha"]'))
				parashaElem.innerHTML = this.lastData.parsha
		}

		for (const jewishYear of document.querySelectorAll('[data-zfReplace="jewishYear"]'))
			jewishYear.innerHTML = this.jCal.formatJewishYear().hebrew;
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
		function hideErev(contElem, inverse = false) {
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

	updateZmanimList() {
		this.updateWeekListing();
		this.renderParashaBar();

		/*for (const fastContainer of document.querySelectorAll('[data-zfFind="FastDays"]'))
			if (fastContainer instanceof HTMLElement)
				this.renderFastIndex(fastContainer) */

		/*const specialDayText = this.jCal.listOfSpecialDays().join(" / ");
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
		} */

		/*document.querySelectorAll('[data-zfFind="Chamah"]').forEach(
			(/**@type {HTMLElement} /chamah) => {
				if (this.jCal.isBirkasHachamah()) {
					chamah.style.removeProperty("display");
				} else {
					chamah.style.display = "none";
				}
			}
		)*/

		/*document.querySelectorAll('[data-zfFind="BirchatHalevana"]').forEach(
			(/**@type {HTMLElement} /birchatHalevana) => {
				const birLev = this.jCal.birkathHalevanaCheck(this.zmanCalc);
				if (!birLev.current) {
					birchatHalevana.style.display = "none";
					return;
				}

				birchatHalevana.style.removeProperty("display");
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
		) */

		/*const nextTekufa = this.zmanCalc.nextTekufa(settings.calendarToggle.tekufaMidpoint() !== "hatzoth").round('minute')
		const tekufaRange = ['add', 'subtract']
			.map((/** @type {'add' | 'subtract'} / act) => nextTekufa[act]({ minutes: 30 }))
		if (new Set(tekufaRange.map(range=>range.toPlainDate())).keys().some(tekTime => tekTime.equals(this.jCal.getDate()))) {
			/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} /
			const tekufaTF = [this.dtF[0], { ...this.dtF[1] }]
			delete tekufaTF[1].second

			const nextTekufaJDate = [1, 4, 7, 10]
				.map(month => new KosherZmanim.JewishDate(this.jCal.getJewishYear(), month, 15))
				.sort((jDateA, jDateB) => {
					const durationA = this.jCal.getDate().until(jDateA.getDate())
					const durationB = this.jCal.getDate().until(jDateB.getDate())

					return Math.abs(durationA.total('days')) - Math.abs(durationB.total('days'))
				})[0]

			/** @type {{en: string; he: string}} /
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
				(/**@type {HTMLElement} / tekufa) => tekufa.style.display = "none"
			)
		} */

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
				if (!(zmanId in zmanInfo) || zmanInfo[zmanId].display == -1) {
					timeSlot.style.setProperty('display', 'none', 'important');
					continue;
				}

				const timeDisplay = timeSlot.getElementsByClassName('timeDisplay')[0]
				if (zmanInfo[zmanId].display == -2) {
					timeSlot.style.removeProperty("display");
					timeDisplay.lastElementChild.innerHTML = "XX:XX"
					continue;
				}

				if (!zmanInfo[zmanId].ignoreNextUpcoming) {
					/** @type {HTMLElement} */
					// @ts-ignore
					const upNextElem = timeDisplay.firstElementChild;
					if (this.isNextUpcomingZman(zmanInfo[zmanId].zDTObj) || (zmanId == 'hatzoth' && this.isNextUpcomingZman(this.zmanCalc.getSolarMidnight()))) {
						upNextElem.style.removeProperty("display")
					} else {
						upNextElem.style.display = "none";
					}
				}

				timeDisplay.lastElementChild.innerHTML = zmanInfo[zmanId].zDTObj.toLocaleString(...zmanInfo[zmanId].dtF)

				if (zmanInfo[zmanId].title.hb)
					timeSlot.querySelector('.zmanTitleText').innerHTML = zmanInfo[zmanId].title.hb

				// Calculate but hide! Can be derived via Inspect Element
				if (!zmanInfo[zmanId].display)
					timeSlot.style.setProperty('display', 'none', 'important');
				else {
					timeSlot.style.removeProperty('display')
				}
			}
			calendarContainer.classList.remove("loading")
		}
	}

	/** @param {highlightedZman[]} highlightZmanim  */
	generateDayImportantZmanim(highlightZmanim) {
		const taanitYomTovNames = {
			[WebsiteLimudCalendar.TISHA_BEAV]: "תשעה באב",
			[WebsiteLimudCalendar.SEVENTEEN_OF_TAMMUZ]: ("שבעה עשר בתמוז"),
			[WebsiteLimudCalendar.TENTH_OF_TEVES]: ("עשרה בטבת"),
		}

		if (this.jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH) {
			const hametzDate = this.jCal.getDate();
			/** @type {highlightedZman} */
			const highlightPesah = {ytI: WebsiteLimudCalendar.PESACH, datesToZman: new Map()};

			let nightErev = this.jCal.getDate().subtract({ days: 1 });
			if (hametzDate.dayOfWeek == 6)
				nightErev = nightErev.subtract({ days: 1 });

			highlightPesah.datesToZman.set(hametzDate, {
				bedikatHametz: handleRound(this.zmanCalc.chainDate(nightErev).getTzet(), 'later'),
				sofZemanBiurHametz: handleRound(this.zmanCalc.chainDate(hametzDate).getSofZemanBiurHametz(), 'earlier'),
				sofZemanAhilathHametz: handleRound(this.zmanCalc.chainDate(hametzDate).getSofZemanAhilathHametz(), 'earlier'),
				candleLighting: handleRound(this.zmanCalc.chainDate(hametzDate).getCandleLighting(), 'earlier'),
			});
			const firstDayYTObj = highlightPesah.datesToZman.get(hametzDate);

			if (hametzDate.dayOfWeek == 6) {
				highlightPesah.title = 'שבת ' + this.jCal.getHebrewParasha()[0] + ' (הגדול)<br>+ פסח';
				highlightPesah.datesToZman.set(hametzDate.subtract({ days: 1 }), { candleLighting: handleRound(this.zmanCalc.chainDate(hametzDate.subtract({ days: 1 })).getCandleLighting(), 'earlier')  });

				firstDayYTObj.candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(hametzDate).getTzetMelakha()), 'later');
				firstDayYTObj.rabbenuTam = handleRound(this.zmanCalc.chainDate(hametzDate).getTzetRT(), 'later');
			}

			let hatzotTime = this.zmanCalc.chainDate(hametzDate).getSolarMidnight().toPlainTime();

			if (this.jCal.getInIsrael()) {
				const pesahDate = hametzDate.add({ days: 1 });
				highlightPesah.datesToZman.set(pesahDate,
					pesahDate.dayOfWeek == 5 ?
						{ candleLighting: handleRound(this.zmanCalc.chainDate(pesahDate).getCandleLighting(), 'earlier') }
						: { tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(pesahDate).getTzetMelakha()), 'later'), rabbenuTam: handleRound(this.zmanCalc.chainDate(pesahDate).getTzetRT(), 'later') });

				if (pesahDate.dayOfWeek == 5) {
					highlightPesah.datesToZman.set(pesahDate.add({ days: 1 }), {
						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(pesahDate.add({ days: 1 })).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(this.zmanCalc.chainDate(pesahDate.add({ days: 1 })).getTzetRT(), 'later')
					});
				}
			} else {
				const pesahDate = hametzDate.add({ days: 1 });
				highlightPesah.datesToZman.set(pesahDate, {
					candleLighting: pesahDate.dayOfWeek == 5 ?
						handleRound(this.zmanCalc.chainDate(pesahDate).getCandleLighting(), 'earlier') :
						handleRound(this.zmanCalc.chainDate(pesahDate).getTzetHumra(), 'later')
				});
				const secondDayYTObj = highlightPesah.datesToZman.get(pesahDate);
				if (pesahDate.dayOfWeek == 6) {
					secondDayYTObj.candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(pesahDate).getTzetMelakha()), 'later');
					secondDayYTObj.rabbenuTam = handleRound(this.zmanCalc.chainDate(pesahDate).getTzetRT(), 'later');
				}

				if (Temporal.PlainTime.compare(hatzotTime, this.zmanCalc.chainDate(pesahDate).getSolarMidnight().toPlainTime()) == 1)
					hatzotTime = this.zmanCalc.chainDate(pesahDate).getSolarMidnight().toPlainTime();

				highlightPesah.datesToZman.set(pesahDate.add({ days: 1 }),
					pesahDate.add({ days: 1 }).dayOfWeek == 5
						? { candleLighting: handleRound(this.zmanCalc.chainDate(pesahDate.add({ days: 1 })).getCandleLighting(), 'earlier') }
						: { tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(pesahDate.add({ days: 1 })).getTzetMelakha()), 'later') });

				if (pesahDate.add({ days: 1 }).dayOfWeek == 5) {
					highlightPesah.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.PESACH].hebrew
						+ "<br>+ שבת חול המועד";
					highlightPesah.datesToZman.set(pesahDate.add({ days: 2 }), {
						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(pesahDate.add({ days: 2 })).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(this.zmanCalc.chainDate(pesahDate.add({ days: 2 })).getTzetRT(), 'later')
					});
				}
			}

			highlightPesah.extra = "תשלים הלל לפני "
				+ hatzotTime.toLocaleString(...this.dtF)
				+ '<br>'
				+ ("ממוסף ואילך, אומרים מוריד הטל וברכנו");

			highlightZmanim.push(highlightPesah);
		} else if ([WebsiteLimudCalendar.EREV_YOM_KIPPUR, WebsiteLimudCalendar.YOM_KIPPUR].includes(this.jCal.getYomTovIndex())) {
			if (!highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === WebsiteLimudCalendar.YOM_KIPPUR)) {
				const ykJcal = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.YOM_KIPPUR);

				highlightZmanim.push({
					ytI: WebsiteLimudCalendar.YOM_KIPPUR,
					datesToZman: new Map([[ykJcal.getDate().subtract({ days: 1 }), {
						mikva: handleRound(this.zmanCalc.chainDate(ykJcal.getDate().subtract({ days: 1 })).getSofZemanBiurHametz(), 'later'),
						candleLighting: handleRound(this.zmanCalc.chainDate(ykJcal.getDate().subtract({ days: 1 })).getCandleLighting(), 'earlier'),
					}], [this.jCal.getDate().add({ days: 1 }), {
						musaf: handleRound(this.zmanCalc.chainDate(ykJcal.getDate()).getHatzoth(), 'earlier'),
						birkatKohanim: handleRound(this.zmanCalc.chainDate(ykJcal.getDate()).getTzet(), 'earlier'),

						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(ykJcal.getDate()).getTzetMelakha()), 'earlier'),
						rabbenuTam: handleRound(this.zmanCalc.chainDate(ykJcal.getDate()).getTzetRT(), 'later')
					}]])
				});
			}
		} else if (this.jCal.isTaanis() && !this.jCal.isYomKippur()) {
				highlightZmanim.push({
					ytI: this.jCal.getYomTovIndex(),
					title: (this.jCal.getYomTovIndex() in this.jCal.getYomTovObject()
						? this.jCal.getYomTovObject()[this.jCal.getYomTovIndex()].hebrew
						: taanitYomTovNames[this.jCal.getYomTovIndex()]),
					datesToZman: new Map(
						this.jCal.getJewishMonth() == WebsiteLimudCalendar.AV
							? [[this.jCal.getDate().subtract({ days: 1 }), {
								fastStarts: handleRound(this.zmanCalc.chainDate(this.jCal.getDate().subtract({ days: 1 })).getShkiya(), 'earlier')
							}], [this.jCal.getDate(), {
								fastEnds: handleRound(this.zmanCalc.getTzetHumra(), 'later')
							}]]
							: [[this.jCal.getDate(), {
								fastStarts: handleRound(this.zmanCalc.getAlotHashahar(), 'earlier'),
								fastEnds: handleRound(this.zmanCalc.getTzetHumra(), 'later')
							}]]
					)
				});
			} else if (this.jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_SHAVUOS) {
				/** @type {highlightedZman} */
				const shavuotObj = {
					ytI: WebsiteLimudCalendar.SHAVUOS,
					datesToZman: new Map([[this.jCal.getDate(), {candleLighting: handleRound(this.zmanCalc.chainDate(this.jCal.getDate()).getCandleLighting(), 'earlier')}]])
				};

				if (this.jCal.getDayOfWeek() == 6) {
					shavuotObj.title = "שבת " + this.jCal.getHebrewParasha()[0] + "<br>+ " + this.jCal.getYomTovObject()[WebsiteLimudCalendar.SHAVUOS].hebrew
					shavuotObj.datesToZman.set(
						this.jCal.getDate().subtract({ days: 1 }),
						{
							candleLighting: handleRound(this.zmanCalc.chainDate(this.jCal.getDate().subtract({ days: 1 })).getCandleLighting(), 'earlier')
						}
					);
					shavuotObj.datesToZman.get(this.jCal.getDate()).candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(this.jCal.getDate()).getTzetMelakha()), 'later');
					shavuotObj.datesToZman.get(this.jCal.getDate()).rabbenuTam = handleRound(this.zmanCalc.chainDate(this.jCal.getDate()).getTzetRT(), 'later');
				}

				const shavuotDate = this.jCal.getDate().add({ days: 1 });

				const shavuotNetz = this.zmanCalc.chainDate(shavuotDate).getNetz();
				const shavuotNetzFormat = handleRound(zDTFromFunc(shavuotNetz), shavuotNetz instanceof Temporal.ZonedDateTime ? 'later' : 'noRound')

				if (this.jCal.getInIsrael()) {
					shavuotObj.datesToZman.set(shavuotDate,
						shavuotDate.dayOfWeek == 5 ?
							{
								netz: shavuotNetzFormat,
								candleLighting: handleRound(this.zmanCalc.chainDate(shavuotDate).getCandleLighting(), 'earlier')
							} :	{
								netz: shavuotNetzFormat,
								tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(shavuotDate).getTzetMelakha()), 'later'),
								rabbenuTam: handleRound(this.zmanCalc.chainDate(shavuotDate).getTzetRT(), 'later')
							}
					);

					if (shavuotDate.dayOfWeek == 5) {
						shavuotObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.SHAVUOS].hebrew + "<br>+ שבת " + this.jCal.getHebrewParasha()[0]
						shavuotObj.datesToZman.set(shavuotDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(shavuotDate.add({ days: 1 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(shavuotDate.add({ days: 1 })).getTzetRT(), 'later')
						});
					}
				} else {
					shavuotObj.datesToZman.set(shavuotDate, {
						netz: shavuotNetzFormat,
						candleLighting: shavuotDate.dayOfWeek == 5 ?
							handleRound(this.zmanCalc.chainDate(shavuotDate).getCandleLighting(), 'earlier') :
							handleRound(this.zmanCalc.chainDate(shavuotDate).getTzetHumra(), 'later')
					});
					if (shavuotDate.dayOfWeek == 6) {
						const shabObj = shavuotObj.datesToZman.get(shavuotDate);
						shabObj.candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(shavuotDate).getTzetMelakha()), 'later');
						shabObj.rabbenuTam = handleRound(this.zmanCalc.chainDate(shavuotDate).getTzetRT(), 'later');
					}

					const secondDayShavuotDate = shavuotDate.add({ days: 1 });
					const dayTShavNetz = this.zmanCalc.chainDate(secondDayShavuotDate).getNetz();
					const dayTShavNetzFormat = handleRound(zDTFromFunc(dayTShavNetz), dayTShavNetz instanceof Temporal.ZonedDateTime ? 'later' : 'noRound')

					shavuotObj.datesToZman.set(secondDayShavuotDate,
						secondDayShavuotDate.dayOfWeek == 5 ?
							{
								netz: dayTShavNetzFormat,
								candleLighting: handleRound(this.zmanCalc.chainDate(secondDayShavuotDate).getCandleLighting(), 'earlier')
							} : {
								netz: dayTShavNetzFormat,
								tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(secondDayShavuotDate).getTzetMelakha()), 'later')
							});

					if (secondDayShavuotDate.dayOfWeek == 6)
						shavuotObj.datesToZman.get(secondDayShavuotDate).rabbenuTam = handleRound(this.zmanCalc.chainDate(secondDayShavuotDate).getTzetRT(), 'later');
					else if (secondDayShavuotDate.dayOfWeek == 5) {
						shavuotObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.SHAVUOS].hebrew + "<br>+ שבת " + this.jCal.getHebrewParasha()[0]
						shavuotObj.datesToZman.set(shavuotDate.add({ days: 2 }), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(shavuotDate.add({ days: 2 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(shavuotDate.add({ days: 2 })).getTzetRT(), 'later')
						});
					}
				}

				highlightZmanim.push(shavuotObj);
			} else if (this.jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_ROSH_HASHANA) {
				const roshHashanaDate = this.jCal.getDate().add({ days: 1 });

				/** @type {highlightedZman} */
				const roshHashanaObj = {
					ytI: WebsiteLimudCalendar.ROSH_HASHANA,
					datesToZman: new Map([
						[this.jCal.getDate(), {
							mikva: handleRound(this.zmanCalc.getSofZemanBiurHametz(), 'later'),
							candleLighting: handleRound(this.zmanCalc.getCandleLighting(), 'earlier')
						}],
						[roshHashanaDate, {
							candleLighting: handleRound(this.zmanCalc.chainDate(roshHashanaDate).getTzetHumra(), 'later')
						}]
					])
				};

				if (this.jCal.getDate().dayOfWeek == 3) {
					roshHashanaObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.ROSH_HASHANA] + "<br>שבת שובה" + this.jCal.getHebrewParasha()[0];
					roshHashanaObj.datesToZman.set(this.jCal.getDate().add({ days: 2 }), {
						candleLighting: handleRound(this.zmanCalc.chainDate(this.jCal.getDate().add({ days: 2 })).getCandleLighting(), 'earlier')
					})
					roshHashanaObj.datesToZman.set(this.jCal.getDate().add({ days: 3 }), {
						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(this.jCal.getDate().add({ days: 3 })).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(this.zmanCalc.chainDate(this.jCal.getDate().add({ days: 3 })).getTzetRT(), 'later')
					})
				} else {
					if (this.jCal.getDate().dayOfWeek == 5) {
						const shabbatObj = roshHashanaObj.datesToZman.get(roshHashanaDate);
						shabbatObj.candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(roshHashanaDate).getTzetMelakha()), 'later');
						shabbatObj.rabbenuTam = handleRound(this.zmanCalc.chainDate(roshHashanaDate).getTzetRT(), 'later');
					}

					roshHashanaObj.datesToZman.set(this.jCal.getDate().add({ days: 2 }), {
						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(this.jCal.getDate().add({ days: 2 })).getTzetMelakha()), 'later')
						//rabbenuTam: zmanCalc.chainDate(this.jCal.getDate().add({ days: 2 })).getTzetRT()
					});
				}

				highlightZmanim.push(roshHashanaObj);
			} else if (this.jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_SUCCOS) {
				const sukkothDate = this.jCal.getDate().add({ days: 1 });

				/** @type {highlightedZman} */
				const sukkothObj = {
					ytI: WebsiteLimudCalendar.SUCCOS,
					datesToZman: new Map([[this.jCal.getDate(), {
						candleLighting: handleRound(this.zmanCalc.getCandleLighting(), 'earlier')
					}]])
				};

				if (this.jCal.getInIsrael()) {
					sukkothObj.datesToZman.set(sukkothDate, {
						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(sukkothDate).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(this.zmanCalc.chainDate(sukkothDate).getTzetRT(), 'later')
					})
				} else {
					sukkothObj.datesToZman.set(sukkothDate, {
						candleLighting: handleRound(this.zmanCalc.chainDate(sukkothDate).getTzetHumra(), 'later')
					});

					if (sukkothDate.dayOfWeek == 5) {
						sukkothObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.SUCCOS].hebrew
							+ "<br>+ שבת חול המועד";

						sukkothObj.datesToZman.set(sukkothDate.add({ days: 1 }), {
							candleLighting: handleRound(this.zmanCalc.chainDate(sukkothDate.add({ days: 1 })).getCandleLighting(), 'earlier')
						});
						sukkothObj.datesToZman.set(sukkothDate.add({ days: 2 }), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(sukkothDate.add({ days: 2 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(sukkothDate.add({ days: 2 })).getTzetRT(), 'later')
						});
					} else {
						if (sukkothDate.dayOfWeek == 6) {
							sukkothObj.datesToZman.get(sukkothDate).candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(sukkothDate).getTzetMelakha()), 'later');
							sukkothObj.datesToZman.get(sukkothDate).rabbenuTam = handleRound(this.zmanCalc.chainDate(sukkothDate).getTzetRT(), 'later')
						}
						sukkothObj.datesToZman.set(sukkothDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(sukkothDate.add({ days: 1 })).getTzetMelakha()), 'later')
						});
					}
				}

				highlightZmanim.push(sukkothObj);
			} else if ([
				WebsiteLimudCalendar.HOSHANA_RABBA,
				WebsiteLimudCalendar.SHEMINI_ATZERES,
				WebsiteLimudCalendar.SIMCHAS_TORAH
			].includes(this.jCal.getYomTovIndex())) {
				if (!highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === WebsiteLimudCalendar.SHEMINI_ATZERES)) {
					const sheminiDate = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.SHEMINI_ATZERES).getDate();

					/** @type {highlightedZman} */
					const sheminiObj = {
						ytI: WebsiteLimudCalendar.SHEMINI_ATZERES,
						datesToZman: new Map([[this.jCal.getDate(), {
							candleLighting: handleRound(this.zmanCalc.getCandleLighting(), 'earlier')
						}]])
					};

					if (this.jCal.getInIsrael()) {
						sheminiObj.datesToZman.set(sheminiDate, {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(sheminiDate).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(sheminiDate).getTzetRT(), 'later')
						})
					} else {
						sheminiObj.datesToZman.set(sheminiDate, {
							candleLighting: handleRound(this.zmanCalc.chainDate(sheminiDate).getTzetHumra(), 'later')
						});

						if (sheminiDate.dayOfWeek == 5) {
							sheminiObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.SUCCOS].hebrew
								+ "<br>+ "
								+ "שבת בראשית";

							sheminiObj.datesToZman.set(sheminiDate.add({ days: 1 }), {
								candleLighting: handleRound(this.zmanCalc.chainDate(sheminiDate.add({ days: 1 })).getCandleLighting(), 'earlier')
							});
							sheminiObj.datesToZman.set(sheminiDate.add({ days: 2 }), {
								tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(sheminiDate.add({ days: 2 })).getTzetMelakha()), 'later'),
								rabbenuTam: handleRound(this.zmanCalc.chainDate(sheminiDate.add({ days: 2 })).getTzetRT(), 'later')
							});
						} else {
							if (sheminiDate.dayOfWeek == 6) {
								sheminiObj.datesToZman.get(sheminiDate).candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(sheminiDate).getTzetMelakha()), 'later');
								sheminiObj.datesToZman.get(sheminiDate).rabbenuTam = handleRound(this.zmanCalc.chainDate(sheminiDate).getTzetRT(), 'later');
							}
							sheminiObj.datesToZman.set(sheminiDate.add({ days: 1 }), {
								tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(sheminiDate.add({ days: 1 })).getTzetMelakha()), 'later')
							});
						}
					}

					highlightZmanim.push(sheminiObj);
				}
			} else if (this.jCal.isErevYomTov() && this.jCal.isCholHamoedPesach()) {
				// Handle second day Yom Tov. We find Erev Yom Tov of Pesach by checking for the last day of Chol Hamoed Pesach
				/** @type {highlightedZman} */
				const pesahObj = {
					ytI: WebsiteLimudCalendar.PESACH,
					title: this.jCal.getYomTovObject()[WebsiteLimudCalendar.PESACH].hebrew
						+ "<br>(אחרון)",
					datesToZman: new Map([[this.jCal.getDate(), {
						candleLighting: handleRound(this.zmanCalc.getCandleLighting(), 'earlier')
					}]])
				};

				const yomTovDate = this.jCal.getDate().add({ days: 1 });
				if (this.jCal.getInIsrael()) {
					if (yomTovDate.dayOfWeek == 5) {
						pesahObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.PESACH].hebrew
							+ "<br>+ "
							+ "שבת " + this.jCal.getHebrewParasha()[0];
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(this.zmanCalc.chainDate(yomTovDate).getCandleLighting(), 'earlier')
						});

						pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetRT(), 'later')
						});
					} else {
						pesahObj.datesToZman.set(yomTovDate, {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(yomTovDate).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(yomTovDate).getTzetRT(), 'later')
						});
					}
				} else {
					if (yomTovDate.dayOfWeek == 6) {
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(zDTFromFunc(this.zmanCalc.chainDate(yomTovDate).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(yomTovDate).getTzetRT(), 'later')
						});
						pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later'),
						});
					} else if (yomTovDate.dayOfWeek == 5) {
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(this.zmanCalc.chainDate(yomTovDate).getCandleLighting(), 'earlier')
						});
						pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetRT(), 'later')
						});
					} else {
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(this.zmanCalc.chainDate(yomTovDate).getTzetHumra(), 'later')
						});

						if (yomTovDate.dayOfWeek == 4) {
							pesahObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.PESACH].hebrew
								+ "<br>+ "
								+ "שבת " + this.jCal.getHebrewParasha()[0];
							pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
								candleLighting: handleRound(this.zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getCandleLighting(), 'earlier')
							});
							pesahObj.datesToZman.set(yomTovDate.add({ days: 2 }), {
								tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(yomTovDate.add({ days: 2 })).getTzetMelakha()), 'later'),
								rabbenuTam: handleRound(this.zmanCalc.chainDate(yomTovDate.add({ days: 2 })).getTzetRT(), 'later')
							});
						} else {
							pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
								tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later')
							});
						}
					}
				}

				highlightZmanim.push(pesahObj);
			} else if
				((this.jCal.getDayOfWeek() === 7 && !this.jCal.isYomTovAssurBemelacha() && !this.jCal.isErevYomTov() && !this.jCal.chainDate(this.jCal.getDate().subtract({ days: 1 })).isYomTovAssurBemelacha())
				|| this.jCal.getDayOfWeek() === 6 && !this.jCal.isYomTovAssurBemelacha() && !this.jCal.tomorrow().isErevYomTov() && !this.jCal.tomorrow().isYomTovAssurBemelacha()) {
				const shabbatJCal = this.jCal.shabbat();
				const title =
					"שבת "
						+ (shabbatJCal.isCholHamoed() ? "חול המועד" : this.jCal.getHebrewParasha()[0])
						+ (![Parsha.NONE, Parsha.NACHAMU, Parsha.CHAZON, Parsha.SHIRA].includes(shabbatJCal.getSpecialShabbos())
							? ("<div class='specialShabPar'>(" + this.jCal.getHebrewParasha()[1] + ")</div>") : "")

				if (!highlightZmanim.some(high => high.title === title)) {
					let extra = "";

					if (shabbatJCal.isShabbosMevorchim()) {
						const roshHodeshJCal = shabbatJCal.clone();
						roshHodeshJCal.setDate(roshHodeshJCal.getDate().add({ weeks: 2 }));
						roshHodeshJCal.setJewishDayOfMonth(1);

						let dayOfWeek = roshHodeshJCal.getDayOfTheWeek().en;
						roshHodeshJCal.setDate(roshHodeshJCal.getDate().subtract({ days: 1 }));
						if (roshHodeshJCal.getJewishDayOfMonth() == 30)
							dayOfWeek = roshHodeshJCal.getDayOfTheWeek().en + " / " + dayOfWeek;

						extra += "<br> <i class='bi bi-moon-fill'></i> New month "
							+ shabbatJCal.chainDate(shabbatJCal.getDate().add({ weeks: 2 })).formatJewishMonth().en
							+ " on " + dayOfWeek;
					}

					highlightZmanim.push({
						title,
						extra,
						datesToZman: new Map([[shabbatJCal.getDate().subtract({ days: 1 }), {
							candleLighting: handleRound(this.zmanCalc.chainDate(this.jCal.shabbat().getDate().subtract({days: 1})).getCandleLighting(), 'earlier')
						}], [shabbatJCal.getDate(), {
							tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(this.zmanCalc.getTzetRT(), 'later')
						}]])
					});
				}
			}
	}

	setNextUpcomingZman() {
		/** @type {KosherZmanim.Temporal.ZonedDateTime[]} */
		const zmanim = [];
		const currentSelectedDate = this.zmanCalc.coreZC.getDate();

		for (const days of [0, 1]) {
			this.changeDate(KosherZmanim.Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()).add({ days }), true);
			zmanim.push(...Object.values(this.jCal.getZmanimInfo(false, this.zmanCalc, this.zmanimList, this.dtF)).filter(obj => obj.display == 1).map(time => time.zDTObj));
			zmanim.push(this.zmanCalc.getSolarMidnight());
		}

		this.changeDate(currentSelectedDate, true); //reset the date to the current date
		zmanim.sort(KosherZmanim.Temporal.ZonedDateTime.compare);
		this.nextUpcomingZman = zmanim.find(zman => KosherZmanim.Temporal.Now.zonedDateTimeISO(this.geoLocation.getTimeZone()).until(zman).total({ unit: "milliseconds" }) > 0)

		setTimeout(
			() => { this.setNextUpcomingZman(); this.updateZmanimList() },
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

const zmanimListUpdater2 = new zmanimListUpdater()

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

function getStartOfWeek(date = Temporal.Now.plainDateISO()) {
	const dayIndex = date.dayOfWeek % 7; // Sunday = 0
	return date.subtract({ days: dayIndex });
}

/**
 * @param {Temporal.ZonedDateTime} zDT
 * @param {'earlier'|'later'|'noRound'} round
 */
function handleRound(zDT, round) {
	if (round === 'noRound')
		return zDT;

	if (zDT.second > 40 || (zDT.second >= 20 && round == 'later'))
		return zDT.add({ minutes: 1 }).with({ second: 0 });
	else
		return zDT.with({ second: 0 });
}