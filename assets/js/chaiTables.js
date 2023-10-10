//@ts-check

import { MDCSelect } from "../libraries/materialComp/selector.js"
import * as KosherZmanim from "../libraries/kosherZmanim/kosher-zmanim.esm.js"
export { ChaiTables }

class ChaiTables {
	/**
	 * @param {KosherZmanim.GeoLocation} geoL
	 */
	constructor(geoL) {
		this.geoL = geoL;
	}

	/**
	 * @param {String} selectedCountry
	 * @param {Number} indexOfMetroArea
	 */
	setOtherData(selectedCountry, indexOfMetroArea) {
		this.selectedCountry = selectedCountry;
		this.indexOfMetroArea = indexOfMetroArea;
	}

	/**
	 * STEP 3
	 * Returns the full chaitables url after everything has been setup. See {@link #selectCountry(ChaiTablesCountries)} and {@link #selectMetropolitanArea(String)}
	 * @return the full link directly to the chai tables for the chosen neighborhood
	 *
	 * @param {Number} searchradius The search radius in kilometers.
	 * @param {0|1|2|3|4|5} type the type of table you want.
	 *             0 is visible sunrise,
	 *             1 is visible sunset,
	 *             2 is mishor sunrise,
	 *             3 is astronomical sunrise,
	 *             4 is mishor sunset,
	 *             5 is astronomical sunset.
	 * @param {KosherZmanim.JewishDate} jewishCalendar the desired hebrew year for the chaitable link
	 * @param {Number} userId the user id for the chaitables link
	 * @param {Boolean} switchLongitude
	 */
	getChaiTablesLink(searchradius, type, jewishCalendar, userId, switchLongitude) {
		if (type < 0 || type > 5) {
			throw new Error("type of tables must be between 0 and 5");
		}

		const isIsraelCities = this.selectedCountry == "Eretz_Yisroel";

		const urlParams = {
			'TableType': (isIsraelCities ? "BY" : "Chai"),
			'country': this.selectedCountry,
			'USAcities1': (isIsraelCities ? 1 : this.indexOfMetroArea),
			USAcities2: 0,
			searchradius: (isIsraelCities ? "" : this.selectedCountry == "Israel" ? 2 : searchradius),
			"eroslatitude": (isIsraelCities ? 0.0 : this.geoL.getLatitude()),
			"eroslongitude": (isIsraelCities ? 0.0 : switchLongitude ? -this.geoL.getLongitude() : this.geoL.getLongitude()),
			eroshgt: 0.0,
			geotz: KosherZmanim.TimeZone.getRawOffset(this.geoL.getTimeZone()) / (1000 * 60 * 60),
			DST: jewishCalendar.getDate().isInDST ? "ON" : "OFF",
			exactcoord: "OFF",
			MetroArea: (isIsraelCities ? this.indexOfMetroArea : "jerusalem"),
			types: type,
			RoundSecond: -1,
			AddCushion: 0,
			"24hr": "",
			typezman: -1,
			yrheb: jewishCalendar.getJewishYear(),
			optionheb: 1,
			UserNumber: userId,
			Language: "English",
			AllowShaving: "OFF"
		};

		const url = new URL("http://www.chaitables.com/cgi-bin/ChaiTables.cgi/")
		for (let [key, value] of Object.entries(urlParams)) {
			if (typeof value !== "string") {
				value = value.toString()
			}

			url.searchParams.set("cgi_" + key, value)
		}

		return url;
	}


	/**
	 * @param {Document} domParsed
	 * @param {KosherZmanim.JewishDate} JewishCalendar
	 */
	extractTimes (domParsed, JewishCalendar) {
		const loopCal = JewishCalendar.clone();
		const times = [];

		const zmanTable = Array.from(domParsed.getElementsByTagName('table'))
			.find(table=>[14,15].includes(table.rows[0].cells.length));

		if (!zmanTable)
			return;

		const isLeapYear = loopCal.isJewishLeapYear();
		const monthIndexers = (!isLeapYear ? [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6] : [8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6, 7])
		for (let rowIndexString of Object.keys(zmanTable.rows)) {
			let rowIndex = parseInt(rowIndexString);

			if (rowIndex == 0)
				continue;

			for (let [monthValue, monthCellIndex] of monthIndexers.entries()) {
				const zmanTime = zmanTable.rows[rowIndex].cells[monthCellIndex].innerText.trim()
				if (!zmanTime) {
					console.log('skipping', zmanTime)
					continue;
				}
				const [hour, minute, second] = zmanTime.split(":").map(time=> parseInt(time))

				loopCal.setJewishDate(loopCal.getJewishYear(), 1+monthValue, parseInt(zmanTable.rows[rowIndex].cells[0].innerText))
				const time = loopCal.getDate().set({ hour, minute, second }).setZone(this.geoL.getTimeZone())
				times.push(time.toMillis())
			}
		}

		return times;
	}

	async formatInterfacer() {
		const calendar = new KosherZmanim.JewishDate();

		/** @type {{lng: number; lat: number; times: number[]}} */
		const data = {
			lng: this.geoL.getLongitude(),
			lat: this.geoL.getLatitude(),
			times: []
		}

		for (const yearloop = calendar.clone(); yearloop.getJewishYear() !== calendar.getJewishYear() + 1; yearloop.setJewishYear(yearloop.getJewishYear() + 1)) {
			const ctLink = this.getChaiTablesLink(8, 0, yearloop, 413, true);

			const ctFetch = await fetch('http://localhost:8080/' + ctLink.toString());
			const ctResponse = await ctFetch.text()
			const ctDoc = (new DOMParser()).parseFromString(ctResponse, "text/html");

			if (!ctDoc.getElementsByTagName('table').length) {
				continue;
			}

			data.times.push(...this.extractTimes(ctDoc, yearloop))
		}

		return data;
	}

	initForm() {
		const submitBtn = document.getElementById('gctnd');

		const selectors = Array.from(document.getElementsByClassName("mdc-select")).map((/** @type {HTMLSelectElement} */elem) => elem);
		const MDCSelectors = selectors.map(selectElem => new MDCSelect(selectElem))

		let MASubFormEvent = () => submitBtn.removeAttribute('disabled');

		const primaryIndex = selectors.find(select => select.id == 'MAIndex');
		const hideAllForms = () => {
			if (!submitBtn.hasAttribute('disabled'))
				submitBtn.setAttribute('disabled', '')

			const previouslySelectedMASel = selectors.find(selector => selector.id.endsWith('MetroArea') && selector.style.display !== 'none');
			if (previouslySelectedMASel)
				previouslySelectedMASel.removeEventListener('MDCSelect:change', MASubFormEvent)

			selectors.filter(selector => selector.id.endsWith('MetroArea')).forEach(selector=>selector.style.display = 'none')
		}

		hideAllForms();
		primaryIndex.addEventListener('MDCSelect:change', (/** @type {Event & { detail: { value: string; index: number }}} */chngEvnt) => {
			hideAllForms();

			const highlightedSelector = selectors.find(select => select.id == chngEvnt.detail.value + "MetroArea");
			highlightedSelector.style.removeProperty('display');
			highlightedSelector.addEventListener('MDCSelect:change', MASubFormEvent)
		})

		submitBtn.addEventListener('click', async () => {
			const selectedMASel = selectors.find(selector => selector.id.endsWith('MetroArea') && selector.style.display !== 'none');
			this.setOtherData(MDCSelectors[0].value, MDCSelectors[selectors.indexOf(selectedMASel)].selectedIndex);
			const ctData = await this.formatInterfacer();

			if (!ctData.times.length) {
				const toastBootstrap = window.bs.Toast.getOrCreateInstance(document.getElementById('ctFailToast'))
				toastBootstrap.show();
				return;
			}

			localStorage.setItem("ctNetz", JSON.stringify(ctData))
		});
	}
}