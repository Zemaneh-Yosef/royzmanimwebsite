// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { Temporal } from "../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions, methodNames, zDTFromFunc } from "./ROYZmanim.js";
import { HebrewNumberFormatter } from "./WebsiteCalendar.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
//import { settings } from "./settings/handler.js";

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
					}
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

		const locationTitles = {
			modal: geoLocation.getLocationName() || "unknown",
			pageTitle: geoLocation.getLocationName() || "No location name provided"
		};

		this.jCal.setInIsrael(locationTitles.modal.toLowerCase().includes('israel'));

		let fixedMil = this.jCal.getInIsrael();

		this.zmanCalc = new ZemanFunctions(geoLocation, {
			elevation: fixedMil,
			fixedMil,
			rtKulah: !fixedMil,
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

				/** @type {HTMLElement} */
				// @ts-ignore
				const upNextElem = timeDisplay.firstElementChild;
				if (this.isNextUpcomingZman(zmanInfo[zmanId].zDTObj) || (zmanId == 'hatzoth' && this.isNextUpcomingZman(this.zmanCalc.getSolarMidnight()))) {
					upNextElem.style.removeProperty("display")
				} else {
					upNextElem.style.display = "none";
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