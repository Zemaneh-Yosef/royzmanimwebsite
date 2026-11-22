// @ts-check

import { fastDayInfo } from "../core/fastDays.js";
import { mourningInfo, tachanunChoice, calendarForRules } from "../core/dayRules.js";
import { nextTekufaInfo, tekufaMonthNames } from "../core/tekufot.js";
import { scheduleSettings, geoLocation, jCal, zmanCalc, dtF, onZmanimUpdate } from "./base.js";

/** @param {HTMLElement} [fastContainer] */
function renderFastIndex(fastContainer) {
	const fast = fastDayInfo(jCal, zmanCalc);
	if (!fast) {
		fastContainer.style.display = "none";
		return;
	}
	fastContainer.style.removeProperty("display");

	const todayFast = fast.isToday;

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

	const nameElements = [...fastContainer.getElementsByTagName("h5")];
	nameElements.forEach(element => element.style.display = "none");

	const ourFast = nameElements.find(fastElm => fastElm.getAttribute("data-zfFind") == fast.nameIndex.toString());
	hideErev(ourFast);
	ourFast.style.removeProperty("display");

	/** @type {Record<'multiDay' | 'oneDay', HTMLElement>} */
	const timeList = {
		multiDay: fastContainer.querySelector('[data-zfFind="twoDayTimes"]'),
		oneDay: fastContainer.querySelector('[data-zfFind="oneDayTimes"]')
	};

	if (fast.multiDay) {
		timeList.oneDay.style.display = "none";
		timeList.multiDay.style.removeProperty("display");

		const erevTzom = timeList.multiDay.firstElementChild;
		hideErev(erevTzom);
		if (erevTzom.lastChild.nodeType == Node.TEXT_NODE) {
			erevTzom.lastChild.remove();
		}

		erevTzom.appendChild(document.createTextNode(fast.startErev.toLocaleString(...dtF)));

		const yomTzom = timeList.multiDay.lastElementChild;
		hideErev(yomTzom, true);
		if (yomTzom.lastChild.nodeType == Node.TEXT_NODE)
			yomTzom.lastChild.remove();

		yomTzom.appendChild(document.createTextNode(fast.end.toLocaleString(...dtF)));
	} else {
		timeList.multiDay.style.display = "none";
		timeList.oneDay.style.removeProperty("display")
		if (timeList.oneDay.lastChild.nodeType == Node.TEXT_NODE) {
			timeList.oneDay.lastChild.remove();
		}

		timeList.oneDay.appendChild(document.createTextNode(
			fast.startDay.toLocaleString(...dtF) + ' - ' + fast.end.toLocaleString(...dtF)
		))
	}
}

/** @param {HTMLElement} [mourningDiv] */
function writeMourningPeriod(mourningDiv) {
	const mourning = mourningInfo(jCal);
	if (!mourning) {
		mourningDiv.style.display = "none";
		return;
	}
	mourningDiv.style.removeProperty("display");

	/** @type {HTMLElement} */
	const sefirathHaomer = mourningDiv.querySelector('[data-zfFind="SefirathHaomer"]');

	/** @type {HTMLElement} */
	const threeWeeks = mourningDiv.querySelector('[data-zfFind="ThreeWeeksHeader"]');
	if (mourning.kind == 'omer') {
		sefirathHaomer.style.removeProperty("display");
		threeWeeks.style.display = "none";

		const eachLang = Object.fromEntries(Array.from(sefirathHaomer.children)
			.filter(elem => elem.tagName == "DIV")
			.map(elem => [Array.from(elem.classList)[1].replace('lang-', ''), elem]));

		for (const [lang, elem] of Object.entries(eachLang)) {
			const finalDayAdjust = (mourning.lastOmerDay ? "add" : "remove")
			elem.lastElementChild.classList[finalDayAdjust]("d-none");
			elem.lastElementChild.previousElementSibling.classList[finalDayAdjust]("mb-0")

			for (const completeCount of elem.querySelectorAll('[data-zfReplace="completeCount"]')) {
				const jCalOmer = (completeCount.getAttribute('data-omerDay') == 'tomorrow' ? mourning.tomorrow : mourning.today)
				// @ts-ignore
				completeCount.innerHTML = jCalOmer.getOmerInfo().title[lang].mainCount
			}

			for (const indCount of elem.querySelectorAll('[data-zfReplace="indCount"]')) {
				const jCalOmer = (indCount.getAttribute('data-omerDay') == 'tomorrow' ? mourning.tomorrow : mourning.today)
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
		if (!mourning.showOmerRules) {
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

		if (mourning.threeWeeksPhase == 'weekOf') {
			weekOfText.forEach((elem) => elem.style.removeProperty("display"));

			([nineDaysText, threeWeeksText]).flat()
				.forEach((elem) => elem.style.display = "none")
		} else if (mourning.threeWeeksPhase == 'nineDays') {
			nineDaysText.forEach((elem) => elem.style.removeProperty("display"));

			([weekOfText, threeWeeksText]).flat()
				.forEach((elem) => elem.style.display = "none")
		} else {
			threeWeeksText.forEach((elem) => elem.style.removeProperty("display"));

			([weekOfText, nineDaysText]).flat()
				.forEach((elem) => elem.style.display = "none")
		}
	}

	for (const [key, value] of Object.entries(mourning.halachot)) {
		mourningDiv.querySelectorAll(`[data-zfFind="${key}"]`)
			.forEach((halachaIndex) => {
				if (!(halachaIndex instanceof HTMLElement))
					return;

				if (value)
					halachaIndex.style.removeProperty("display")
				else
					halachaIndex.style.display = "none"
			})
	}
}

/** Fills in the sidebar (fast times, special days, Tekufa, seasonal prayers...). Safe to run again. */
function renderSidebar() {
	for (const fastContainer of queryAllElements('[data-zfFind="FastDays"]'))
		renderFastIndex(fastContainer)

	const specialDayText = jCal.listOfSpecialDays().join(" / ");
	for (const specialDay of queryAllElements('[data-zfReplace="SpecialDay"]')) {
		if (!specialDayText) {
			specialDay.style.display = "none";
		} else {
			specialDay.style.removeProperty("display");
			specialDay.innerHTML = specialDayText;
		}
	}

	for (const mourningDiv of queryAllElements('[data-zfFind="MourningPeriod"]')) {
		writeMourningPeriod(mourningDiv);
	}

	queryAllElements('[data-zfReplace="Ulchaparat"]').forEach((ulchaparat) => {
		if (jCal.isRoshChodesh()) {
			ulchaparat.style.removeProperty("display");
			ulchaparat.innerHTML = (jCal.tefilahRules().amidah.ulChaparatPesha ? "Say וּלְכַפָּרַת פֶּשַׁע" : "Do not say וּלְכַפָּרַת פֶּשַׁע")
		} else {
			ulchaparat.style.display = "none";
		}
	})

	queryAllElements('[data-zfFind="Chamah"]').forEach((chamah) => {
		if (jCal.isBirkasHachamah()) {
			chamah.style.removeProperty("display");
		} else {
			chamah.style.display = "none";
		}
	})

	queryAllElements('[data-zfFind="BirchatHalevana"]').forEach((birchatHalevana) => {
		const birLev = jCal.birkathHalevanaCheck(zmanCalc);
		if (!birLev.current) {
			birchatHalevana.style.display = "none";
			return;
		}

		birchatHalevana.style.removeProperty("display");
		birchatHalevana.querySelectorAll('[data-zfReplace="date-en-end"]').forEach(
			endDate => endDate.innerHTML = birLev.data.end.toLocaleString("en", {day: 'numeric', month: 'short'})
		)

		const bhHeb = birchatHalevana.querySelector('[data-zfReplace="date-hb-end"]')
		if (bhHeb)
			bhHeb.innerHTML = birLev.data.end.toLocaleString("he", {day: 'numeric', month: 'short'})

		const bhRus = birchatHalevana.querySelector('[data-zfReplace="date-ru-end"]')
		if (bhRus)
			bhRus.innerHTML = birLev.data.end.toLocaleString("ru", {day: 'numeric', month: 'short'})

		if (birLev.data.start.dayOfYear == jCal.getDate().dayOfYear) {
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

		if (birLev.data.end.dayOfYear == jCal.getDate().dayOfYear) {
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
	})

	/** @param {HTMLElement} [tefilahRuleContainer] */
	function renderSeasonalRules(tefilahRuleContainer) {
		const calForRules = calendarForRules(jCal, zmanCalc, geoLocation.getTimeZone());
		const seasonalRules = [
			calForRules.tefilahRules().amidah.mechayehHametim,
			calForRules.tefilahRules().amidah.mevarechHashanim
		];

		tefilahRuleContainer.querySelector('[data-zfReplace="SeasonalPrayers"]').innerHTML = seasonalRules.filter(Boolean).join(" / ");
	}

	const tachanunId = tachanunChoice(jCal);
	queryAllElements('[data-zfReplace="Tachanun"]').forEach((tachanun) => {
		if (tachanunId === null) {
			tachanun.style.display = "none";
			return;
		}

		tachanun.style.removeProperty("display");

		for (const tachanunDiv of tachanun.children) {
			if (!(tachanunDiv instanceof HTMLElement))
				continue;

			if (tachanunDiv.getAttribute("data-zfFind") == tachanunId.toString()) {
				tachanunDiv.style.removeProperty("display");
			} else {
				tachanunDiv.style.display = "none";
			}
		}
	})

	const hallelText = jCal.tefilahRules().hallel;
	queryAllElements('[data-zfReplace="Hallel"]').forEach((hallel) => {
		if (!hallelText) {
			hallel.style.display = "none";
		} else {
			hallel.style.removeProperty("display");
			hallel.innerHTML = hallelText == 2 ? "הלל שלם (עם ברכה)" : "חצי הלל (בלי ברכה)";
		}
	})

	const tekufa = nextTekufaInfo(zmanCalc, scheduleSettings.calendarToggle.tekufaMidpoint !== "hatzoth");
	if (tekufa && jCal.getDate().toZonedDateTime(geoLocation.getTimeZone()).until(tekufa.exact).total('days') < 1) {
		/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
		const tekufaTF = [dtF[0], { ...dtF[1] }]
		delete tekufaTF[1].second

		const nextTekufotNames = tekufaMonthNames(jCal)

		for (let tekufaElem of document.querySelectorAll('[data-zfFind="Tekufa"]')) {
			if (!(tekufaElem instanceof HTMLElement))
				continue;

			tekufaElem.style.removeProperty("display");

			Array.from(tekufaElem.querySelectorAll('[data-zfReplace="tekufaTime"]'))
				.forEach(element => element.innerHTML = tekufa.time.toLocaleString(...tekufaTF));
			Array.from(tekufaElem.querySelectorAll('[data-zfReplace="tekufaFastTime"]'))
				.forEach(element => element.innerHTML =
					[
						tekufa.fastStart.toLocaleString(...tekufaTF),
						tekufa.fastEnd.toLocaleString(...tekufaTF),
					].join('-')
				);

			Array.from(tekufaElem.querySelectorAll('[data-zfReplace="tekufaName-en"]'))
				.forEach(element => element.innerHTML = nextTekufotNames.en);
			tekufaElem.querySelector('[data-zfReplace="tekufaName-hb"]').innerHTML = nextTekufotNames.he;
		}
	} else {
		queryAllElements('[data-zfFind="Tekufa"]').forEach((tekufa) => tekufa.style.display = "none")
	}

	for (let seasonalRuleContainer of document.querySelectorAll('[data-zfFind="SeasonalPrayers"]')) {
		if (seasonalRuleContainer instanceof HTMLElement)
			renderSeasonalRules(seasonalRuleContainer);
	}
}

renderSidebar();
// better refraction data arrived after the first draw
onZmanimUpdate("sidebar", renderSidebar);

/**
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} selector
 * @returns {Array<T>}
 */
function queryAllElements(selector) {
	/** @type {NodeListOf<T>} */
    const allNodes = (document.querySelectorAll(selector))
	return [...allNodes].filter(node => node instanceof HTMLElement)
}