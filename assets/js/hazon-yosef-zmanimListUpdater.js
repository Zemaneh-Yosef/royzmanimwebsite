// @ts-check

import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.js";
import { Parsha, Temporal } from "../libraries/kosherZmanim/kosher-zmanim.js";
import { ZemanFunctions, methodNames, zDTFromFunc } from "./ROYZmanim.js";
import { HebrewNumberFormatter } from "./WebsiteCalendar.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";

/** @type {Record<string, number[]>} */
const allChaiTablesData = {};

/** @typedef {{ datesToZman: Map<Temporal.PlainDate, Record<string, Temporal.ZonedDateTime>>; extra?: string } & ({ytI: number; title?: string} | { title: string })} highlightedZman */

export default class zmanimListUpdater {
	constructor() {
		/** @type {import('@material/web/select/outlined-select.js').MdOutlinedSelect} */
		// @ts-ignore
		const matLocSelect = document.getElementById("locationSelector");

		if (isValidJSON(localStorage.getItem('hycal-customLocation'))) {
			/** @type {import('@material/web/select/select-option.js').MdSelectOption} */
			const header = document.createElement("md-select-option");
			header.disabled = true;

			const headerDiv = document.createElement("div");
			headerDiv.setAttribute("slot", "headline");
			headerDiv.style.fontWeight = "600";
			headerDiv.style.opacity = "0.7";
			headerDiv.style.padding = "6px 0";
			headerDiv.appendChild(document.createTextNode("מיקום מותאם אישית"));
			header.appendChild(headerDiv);
			matLocSelect.appendChild(header);

			for (const customOption of JSON.parse(localStorage.getItem('hycal-customLocation'))) {
				/** @type {import('@material/web/select/select-option.js').MdSelectOption} */
				const optionElem = document.createElement("md-select-option");

				optionElem.setAttribute('value', JSON.stringify({
					lat: customOption.lat,
					lng: customOption.lng,
					elevation: customOption.elevation,
					timezone: customOption.timeZone
				}));

				const optionDiv = document.createElement("div");
				optionDiv.setAttribute("slot", "headline");
				optionDiv.appendChild(document.createTextNode(customOption.name));

				optionElem.displayText = customOption.name;

				optionElem.appendChild(optionDiv);
				matLocSelect.appendChild(optionElem);
			}
		}

		if (localStorage.getItem('hycal-selectedLocation')) {
			const selectedOption = [...matLocSelect.options].find(option => option.textContent == localStorage.getItem('hycal-selectedLocation'));
			if (selectedOption) {
				matLocSelect.select(selectedOption.value);
			}
		}

		const locationGeoList = Array.from(matLocSelect.options).map(option => {
			if (option.disabled)
				return null;

			const geoLData = JSON.parse(option.value)
			return new KosherZmanim.GeoLocation(
				option.textContent,
				geoLData.lat,
				geoLData.lng,
				geoLData.elevation,
				geoLData.timezone
			);
		});

		this.jCal = new WebsiteLimudCalendar(Temporal.Now.plainDateISO(locationGeoList[matLocSelect.selectedIndex].getTimeZone()));
		this.jCal.setUseModernHolidays(true);

		matLocSelect.addEventListener('change', (chngEvnt) => {
			let sameDayEnsure = this.jCal.getDate().equals(Temporal.Now.plainDateISO(locationGeoList[matLocSelect.selectedIndex].getTimeZone()));
			this.resetCalendar(locationGeoList[matLocSelect.selectedIndex]);
			localStorage.setItem('hycal-selectedLocation', matLocSelect.options[matLocSelect.selectedIndex].textContent);

			if (sameDayEnsure)
				this.changeDate(Temporal.Now.plainDateISO(locationGeoList[matLocSelect.selectedIndex].getTimeZone()));
		});

		//this.weekPlainDate = getStartOfWeek(Temporal.Now.plainDateISO(locationGeoList[matLocSelect.selectedIndex].getTimeZone()));
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
		if (this.geoLocation.getLocationName() in allChaiTablesData) {
			availableVS = allChaiTablesData[this.geoLocation.getLocationName()];
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
		if (!availableVS.length && [
			"אלעד",
			"אשדוד",
			"באר שבע",
			"בית שמש",
			"ביתר עילית",
			"בני ברק",
			"גבעת זאב",
			"חיפה",
			"טבריה",
			"ירושלים",
			"מודיעין",
			"מירון",
			"נתיבות",
			"עמנואל",
			"צפת",
			"קרית יערים",
			"תל אביב"
		].includes(this.geoLocation.getLocationName()))
			this.getCurLocaleNetz()
				.then(() => this.resetCalendar())
	}

	async getCurLocaleNetz() {
		const fetchedDate = await (await fetch(`/assets/hazon-yosef-data/${this.geoLocation.getLocationName().replaceAll(" ", "_")}.json`)).json()
		allChaiTablesData[this.geoLocation.getLocationName()] = fetchedDate.times;
		console.log(fetchedDate)
	}

	updateWeekListing(date = this.weekPlainDate) {
		const hNum = new HebrewNumberFormatter();
		const weekContainer = document.getElementsByClassName('week-strip')[0];

		const start = getStartOfWeek(date);

		for (let i = 0; i < 7; i++) {
			const date = start.add({ days: i });
			const dateElem = weekContainer.children[i];

			dateElem.setAttribute('data-zyDate', date.toString());

			const gregDate = dateElem.getElementsByClassName("gregorian")[0];
			gregDate.innerHTML = "";
			gregDate.appendChild(document.createTextNode(date.toLocaleString("he-IL", {
				day: "numeric",
				month: "numeric"
			})));

			if (date.year !== Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()).year) {
				gregDate.appendChild(document.createElement("br"));
				gregDate.appendChild(document.createTextNode("(" + date.toLocaleString("he-IL", {
					year: "numeric"
				}) + ")"));
			}

			const hebDateElem = dateElem.getElementsByClassName("hebrew-date")[0];
			hebDateElem.innerHTML =
				hNum.formatHebrewNumber(date.withCalendar("hebrew").day) + " " +
				date.toLocaleString("he-IL-u-ca-hebrew", { month: "long" });

			if (date.withCalendar("hebrew").year != Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()).withCalendar("hebrew").year) {
				hebDateElem.appendChild(document.createElement("br"));
				hebDateElem.appendChild(document.createTextNode("(" + date.toLocaleString("he-IL-u-ca-hebrew", {
					year: "numeric"
				}) + ")"));
			}

			if (date.equals(this.jCal.getDate())) {
				dateElem.classList.add("current");
			} else {
				dateElem.classList.remove("current");
			}
		}
	}

	updateSpecialZmanim() {
		const hNum = new HebrewNumberFormatter();
		this.weekImportantZmanim = [];
		this.generateDayImportantZmanim(this.weekImportantZmanim);

		// We have an element on the page with the ID "weekSpecial"
		// Clear all of its contents, then repopulate them with the Zemanim from this.weekImportantZmanim
		// Title will be an <h1> tag, then the rest will be part of a list

		const weekSpecialElem = document.getElementById("weekSpecial");
		for (const child of Array.from(weekSpecialElem.children)) {
			weekSpecialElem.removeChild(child);
		}

		for (const highlightZman of this.weekImportantZmanim) {
			// Make a container element for all the sub elements
			const containerElem = document.createElement("div");

			const titleElem = document.createElement("h1");
			titleElem.classList.add("text-center");
			titleElem.innerHTML = !('title' in highlightZman) ? this.jCal.getYomTovObject()[highlightZman.ytI]["hebrew"] : highlightZman.title;
			containerElem.appendChild(titleElem);

			const datesElem = document.createElement('h6');
			datesElem.classList.add("text-center");
			const datesList = [...highlightZman.datesToZman.keys()].sort(Temporal.PlainDate.compare);

			if (datesList.length == 1)
				datesElem.innerHTML =
					hNum.formatHebrewNumber(datesList[0].withCalendar("hebrew").day)
					+ " "
					+ datesList[0].toLocaleString("he-IL-u-ca-hebrew", { month: "long" });
			else {
				datesElem.innerHTML =
					hNum.formatHebrewNumber(datesList[0].withCalendar("hebrew").day)
					+ " "
					+ datesList[0].toLocaleString("he-IL-u-ca-hebrew", { month: "long" })
					+ " - "
					+ hNum.formatHebrewNumber(datesList[datesList.length - 1].withCalendar("hebrew").day)
					+ " "
					+ datesList[datesList.length - 1].toLocaleString("he-IL-u-ca-hebrew", { month: "long" })
			}

			containerElem.appendChild(datesElem);

			const zmanListElem = document.createElement("ul");
			const multipleCandleLightings = [...highlightZman.datesToZman.values()]
				.filter(zmanMap => 'candleLighting' in zmanMap)
				.length > 1;
			let candleLightIndex = 1;

			for (const zmanTimes of highlightZman.datesToZman.values()) {
				const zmanEntries = Object.entries(zmanTimes);
				zmanEntries.forEach(([zmanKey, zmanTime], index) => {
					if (zmanKey == 'rabbenuTam' && zmanEntries[index - 1] && zmanEntries[index - 1][0] == 'candleLighting') {
						// Append to previous candle lighting entry as its own span element
						const prevZmanItem = zmanListElem.lastElementChild;

						const rtAdendumSpan = document.createElement("span");
						rtAdendumSpan.innerHTML = ` (ר"ת: ${zmanTime.toLocaleString(...this.dtF)})`;

						prevZmanItem.appendChild(rtAdendumSpan);
						return;
					}

					const zmanItemElem = document.createElement("li");

					if (zmanKey == 'candleLighting') {
						if (multipleCandleLightings) {
							zmanItemElem.innerHTML += "הדלקת נרות (ליל " + hNum.formatHebrewNumber(candleLightIndex++) + "): ";
						} else {
							zmanItemElem.innerHTML += "הדלקת נרות: ";
						}
					} else if (zmanKey == 'tzetMelakha') {
						zmanItemElem.innerHTML += "צאת מלאכה: ";
					} else if (zmanKey == 'sofZemanBiurHametz') {
						zmanItemElem.innerHTML += "סוף זמן ביעור חמץ עד: ";
					} else if (zmanKey == "fastStarts") {
						zmanItemElem.innerHTML += "תחילת הצום: ";
					} else if (zmanKey == "fastEnds") {
						zmanItemElem.innerHTML += "סיום הצום: ";
					} else if (zmanKey == "musaf") {
						zmanItemElem.innerHTML += "תחילת מוסף לפני: ";
					} else if (zmanKey == "birkatKohanim") {
						zmanItemElem.innerHTML += "סיום ברכת כהנים לפני: ";
					} else if (zmanKey == "mikva") {
						zmanItemElem.innerHTML += "טבילה במקוה לאחר: ";
					} else if (zmanKey == 'netz') {
						zmanItemElem.innerHTML += "הנץ החמה: ";
					} else if (zmanKey == 'bedikatHametz') {
						zmanItemElem.innerHTML += "בדיקת חמץ בליל " + zmanTime.toLocaleString('he-IL', { weekday: 'short' }) + ": ";
					} else if (zmanKey == 'hatzotLayla') {
						zmanItemElem.innerHTML += "חצות הלילה: ";
					} else if (zmanKey == 'rabbenuTam') {
						zmanItemElem.innerHTML += "רבינו תם: ";
					} else {
						zmanItemElem.innerHTML += zmanKey + ": ";
					}
					zmanItemElem.innerHTML = `<b>${zmanItemElem.innerHTML}</b>` + zmanTime.toLocaleString(...this.dtF);
					zmanListElem.appendChild(zmanItemElem);
				})
			}
			containerElem.appendChild(zmanListElem);

			if (highlightZman.extra) {
				const extraElem = document.createElement("p");
				extraElem.innerHTML = highlightZman.extra;
				containerElem.appendChild(extraElem);
			}

			weekSpecialElem.appendChild(containerElem);
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
			this.updateSpecialZmanim();
			if (date.equals(Temporal.Now.plainDateISO(this.geoLocation.getTimeZone()))) {
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
		if (parashaText == "No Parasha this week" && this.jCal.shabbat().isCholHamoed())
			parashaText = "חול המועד " + (this.jCal.getDate().withCalendar("hebrew").month == 1 ? "סוכות" : "פסח")
		else if (parashaText == "No Parasha this week" && this.jCal.shabbat().isYomTov())
			parashaText = "שבת" + " " + this.jCal.getYomTovObject()[this.jCal.shabbat().getYomTovIndex()].hebrew
		else
			parashaText = "פרשת " + parashaText;

		if (this.lastData.parsha !== parashaText) {
			this.lastData.parsha = parashaText
			for (const parashaElem of document.querySelectorAll('[data-zfReplace="Parasha"]'))
				parashaElem.innerHTML = this.lastData.parsha
		}

		for (const jewishYear of document.querySelectorAll('[data-zfReplace="jewishYear"]'))
			jewishYear.innerHTML = this.jCal.shabbat().formatJewishYear().hebrew;
	}

	updateZmanimList() {
		this.updateWeekListing();
		this.renderParashaBar();

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
		const tzomYomTovNames = {
			[WebsiteLimudCalendar.TISHA_BEAV]: "תשעה באב",
			[WebsiteLimudCalendar.SEVENTEEN_OF_TAMMUZ]: ("שבעה עשר בתמוז"),
			[WebsiteLimudCalendar.TENTH_OF_TEVES]: "עשרה בטבת",
			[WebsiteLimudCalendar.FAST_OF_GEDALYAH]: "גדליה",
		}

		const taanitYomTovNames = {
			[WebsiteLimudCalendar.FAST_OF_ESTHER]: "תענית אסתר",
			[WebsiteLimudCalendar.YOM_KIPPUR]: "יום כיפור",
		}

		if (this.jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH || (this.jCal.getYomTovIndex() == WebsiteLimudCalendar.PESACH && this.jCal.getJewishDayOfMonth() < 18)) {
			const hametzDate = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_PESACH).getDate();
			/** @type {highlightedZman} */
			const highlightPesah = {ytI: WebsiteLimudCalendar.PESACH, datesToZman: new Map()};

			let nightErev = hametzDate.subtract({ days: 1 });
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
				const ykDate = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.YOM_KIPPUR).getDate();

				highlightZmanim.push({
					ytI: WebsiteLimudCalendar.YOM_KIPPUR,
					title: "יום כיפור",
					datesToZman: new Map([[ykDate.subtract({ days: 1 }), {
						mikva: handleRound(this.zmanCalc.chainDate(ykDate.subtract({ days: 1 })).getSofZemanBiurHametz(), 'later'),
						candleLighting: handleRound(this.zmanCalc.chainDate(ykDate.subtract({ days: 1 })).getCandleLighting(), 'earlier'),
					}], [ykDate, {
						musaf: handleRound(this.zmanCalc.chainDate(ykDate).getHatzoth(), 'earlier'),
						birkatKohanim: handleRound(this.zmanCalc.chainDate(ykDate).getTzet(), 'earlier'),

						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(ykDate).getTzetMelakha()), 'earlier'),
						rabbenuTam: handleRound(this.zmanCalc.chainDate(ykDate).getTzetRT(), 'later')
					}]])
				});
			}
		} else if ([WebsiteLimudCalendar.EREV_SHAVUOS, WebsiteLimudCalendar.SHAVUOS].includes(this.jCal.getYomTovIndex())
			|| this.jCal.getDayOfWeek() == 7 && this.jCal.chainDate(this.jCal.getDate().subtract({ days: 1 })).getYomTovIndex() == WebsiteLimudCalendar.SHAVUOS) {
			const erevDate = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_SHAVUOS).getDate();

			/** @type {highlightedZman} */
			const shavuotObj = {
				ytI: WebsiteLimudCalendar.SHAVUOS,
				datesToZman: new Map([[erevDate, {candleLighting: handleRound(this.zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier')}]])
			};

			if (erevDate.dayOfWeek == 5) {
				shavuotObj.title = "שבת " + this.jCal.getHebrewParasha()[0] + "<br>+ " + this.jCal.getYomTovObject()[WebsiteLimudCalendar.SHAVUOS].hebrew
				shavuotObj.datesToZman.set(
					erevDate.subtract({ days: 1 }),
					{
						candleLighting: handleRound(this.zmanCalc.chainDate(erevDate.subtract({ days: 1 })).getCandleLighting(), 'earlier')
					}
				);
				shavuotObj.datesToZman.get(erevDate).candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(erevDate).getTzetMelakha()), 'later');
				shavuotObj.datesToZman.get(erevDate).rabbenuTam = handleRound(this.zmanCalc.chainDate(erevDate).getTzetRT(), 'later');
			}

			const shavuotDate = erevDate.add({ days: 1 });

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
		} else if ([WebsiteLimudCalendar.EREV_ROSH_HASHANA, WebsiteLimudCalendar.ROSH_HASHANA].includes(this.jCal.getYomTovIndex())) {
			const erevRoshHashanaDate = this.jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_ROSH_HASHANA
				? this.jCal.getDate()
				: this.jCal.chainJewishDate(this.jCal.getJewishYear() - 1, WebsiteLimudCalendar.ELUL, 29).getDate();
			const roshHashanaDate = erevRoshHashanaDate.add({ days: 1 });

			/** @type {highlightedZman} */
			const roshHashanaObj = {
				ytI: WebsiteLimudCalendar.ROSH_HASHANA,
				datesToZman: new Map([
					[erevRoshHashanaDate, {
						mikva: handleRound(this.zmanCalc.chainDate(erevRoshHashanaDate).getSofZemanBiurHametz(), 'later'),
						candleLighting: handleRound(this.zmanCalc.chainDate(erevRoshHashanaDate).getCandleLighting(), 'earlier')
					}],
					[roshHashanaDate, {
						candleLighting: handleRound(this.zmanCalc.chainDate(roshHashanaDate).getTzetHumra(), 'later')
					}]
				])
			};

			if (erevRoshHashanaDate.dayOfWeek == 3) {
				roshHashanaObj.title = this.jCal.getYomTovObject()[WebsiteLimudCalendar.ROSH_HASHANA] + "<br>שבת שובה" + this.jCal.getHebrewParasha()[0];
				roshHashanaObj.datesToZman.set(erevRoshHashanaDate.add({ days: 2 }), {
					candleLighting: handleRound(this.zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 2 })).getCandleLighting(), 'earlier')
				})
				roshHashanaObj.datesToZman.set(erevRoshHashanaDate.add({ days: 3 }), {
					tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 3 })).getTzetMelakha()), 'later'),
					rabbenuTam: handleRound(this.zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 3 })).getTzetRT(), 'later')
				})
			} else {
				if (erevRoshHashanaDate.dayOfWeek == 5) {
					const shabbatObj = roshHashanaObj.datesToZman.get(roshHashanaDate);
					shabbatObj.candleLighting = handleRound(zDTFromFunc(this.zmanCalc.chainDate(roshHashanaDate).getTzetMelakha()), 'later');
					shabbatObj.rabbenuTam = handleRound(this.zmanCalc.chainDate(roshHashanaDate).getTzetRT(), 'later');
				}

				roshHashanaObj.datesToZman.set(erevRoshHashanaDate.add({ days: 2 }), {
					tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 2 })).getTzetMelakha()), 'later')
					//rabbenuTam: zmanCalc.chainDate(this.jCal.getDate().add({ days: 2 })).getTzetRT()
				});
			}

			highlightZmanim.push(roshHashanaObj);
		} else if ([WebsiteLimudCalendar.EREV_SUCCOS, WebsiteLimudCalendar.SUCCOS].includes(this.jCal.getYomTovIndex())) {
			const erevDate = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_SUCCOS).getDate();

			/** @type {highlightedZman} */
			const sukkothObj = {
				ytI: WebsiteLimudCalendar.SUCCOS,
				datesToZman: new Map([[erevDate, {
					candleLighting: handleRound(this.zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier')
				}]])
			};

			const sukkothDate = erevDate.add({ days: 1 });
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
				const erevDate = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.HOSHANA_RABBA).getDate();

				/** @type {highlightedZman} */
				const sheminiObj = {
					ytI: WebsiteLimudCalendar.SHEMINI_ATZERES,
					datesToZman: new Map([[erevDate, {
						candleLighting: handleRound(this.zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier')
					}]])
				};

				const sheminiDate = this.jCal.chainYomTovIndex(WebsiteLimudCalendar.SHEMINI_ATZERES).getDate();
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
		} else if ((this.jCal.isErevYomTov() && this.jCal.isCholHamoedPesach()) || (this.jCal.getYomTovIndex() == WebsiteLimudCalendar.PESACH && this.jCal.getJewishDayOfMonth() > 18)) {
			// Handle second day Yom Tov. We find Erev Yom Tov of Pesach by checking for the last day of Chol Hamoed Pesach
			const erevDate = this.jCal.chainJewishDate(this.jCal.getJewishYear(), WebsiteLimudCalendar.NISSAN, 20).getDate();

			/** @type {highlightedZman} */
			const pesahObj = {
				ytI: WebsiteLimudCalendar.PESACH,
				title: this.jCal.getYomTovObject()[WebsiteLimudCalendar.PESACH].hebrew
					+ "<br>(אחרון)",
				datesToZman: new Map([[erevDate, {
					candleLighting: handleRound(this.zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier')
				}]])
			};

			const yomTovDate = erevDate.add({ days: 1 });
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
		}

		if (this.jCal.isTaanis() && !this.jCal.isYomKippur() || (this.jCal.tomorrow().isTaanis() && !this.jCal.tomorrow().isYomKippur())) {
			const taanitCal = (this.jCal.isTaanis() ? this.jCal : this.jCal.tomorrow());
			const taanitDay = taanitCal.getDate();

			highlightZmanim.push({
				ytI: taanitCal.getYomTovIndex(),
				title: (taanitCal.getYomTovIndex() in taanitYomTovNames
					? taanitYomTovNames[taanitCal.getYomTovIndex()]
					: "צום " + tzomYomTovNames[taanitCal.getYomTovIndex()]),
				datesToZman: new Map(
					this.jCal.getJewishMonth() == WebsiteLimudCalendar.AV
						? [[taanitDay.subtract({ days: 1 }), {
							fastStarts: handleRound(this.zmanCalc.chainDate(taanitDay.subtract({ days: 1 })).getShkiya(), 'earlier')
						}], [taanitDay, {
							fastEnds: handleRound(this.zmanCalc.chainDate(taanitDay).getTzetHumra(), 'later')
						}]]
						: [[taanitDay, {
							fastStarts: handleRound(this.zmanCalc.chainDate(taanitDay).getAlotHashahar(), 'earlier'),
							fastEnds: handleRound(this.zmanCalc.chainDate(taanitDay).getTzetHumra(), 'later')
						}]]
					)
			});
		}

		if
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

					let dayOfWeek = roshHodeshJCal.getDayOfTheWeek().hb;
					roshHodeshJCal.setDate(roshHodeshJCal.getDate().subtract({ days: 1 }));
					if (roshHodeshJCal.getJewishDayOfMonth() == 30)
						dayOfWeek = roshHodeshJCal.getDayOfTheWeek().hb + " / " + dayOfWeek;

					extra += "<i class='bi bi-moon-fill'></i> מברכים חודש "
						+ shabbatJCal.chainDate(shabbatJCal.getDate().add({ weeks: 2 })).formatJewishMonth().he
						+ " ב" + dayOfWeek;
				}

				highlightZmanim.push({
					title,
					extra,
					datesToZman: new Map([[shabbatJCal.getDate().subtract({ days: 1 }), {
						candleLighting: handleRound(this.zmanCalc.chainDate(shabbatJCal.getDate().subtract({days: 1})).getCandleLighting(), 'earlier')
					}], [shabbatJCal.getDate(), {
						tzetMelakha: handleRound(zDTFromFunc(this.zmanCalc.chainDate(shabbatJCal.getDate()).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(this.zmanCalc.chainDate(shabbatJCal.getDate()).getTzetRT(), 'later')
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
	if (!str) return false;
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