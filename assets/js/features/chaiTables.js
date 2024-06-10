//@ts-check

import "../../libraries/materialComp/materialweb.js"
import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"
export { ChaiTables }

class ChaiTables {
	/**
	 * @param {KosherZmanim.GeoLocation} geoL
	 */
	constructor(geoL) {
		this.geoL = geoL;
		this.modal = new window.bootstrap.Modal(document.getElementById("ctModal"));
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
	 */
	getChaiTablesLink(searchradius, type, jewishCalendar, userId) {
		if (type < 0 || type > 5) {
			throw new Error("type of tables must be between 0 and 5");
		}

		const urlParams = {
			'country': this.selectedCountry,
			USAcities2: 0,
			eroshgt: 0.0,
			geotz:
				KosherZmanim.Temporal.Duration.from({
					nanoseconds: KosherZmanim.TimeZone.getRawOffset(this.geoL.getTimeZone())
				}).total('hour'),
			DST: "ON",
			exactcoord: "OFF",
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

		if (this.selectedCountry == "Eretz_Yisroel") {
			Object.assign(urlParams, {
				'TableType': "BY",
				'USAcities1': 1,
				MetroArea: this.indexOfMetroArea
			});
		} else {
			Object.assign(urlParams, {
				TableType: "Chai",
				USAcities1: this.indexOfMetroArea,
				searchradius: this.selectedCountry == "Israel" ? 2 : searchradius,
				eroslatitude: this.geoL.getLatitude(),
				eroslongitude: -this.geoL.getLongitude(),
				MetroArea: "jerusalem"
			});
		}

		const url = new URL("http://chaitables.com/cgi-bin/ChaiTables.cgi/")
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

		for (let rowIndexString of Object.keys(zmanTable.rows)) {
			let rowIndex = parseInt(rowIndexString);

			if (rowIndex == 0)
				continue;

			for (let monthIndexString of Object.keys(zmanTable.rows[rowIndex].cells)) {
				let monthIndex = parseInt(monthIndexString);
				if (monthIndex == 0 || monthIndex == zmanTable.rows[rowIndex].cells.length - 1)
					continue;

				const zmanTime = zmanTable.rows[rowIndex].cells[monthIndex].innerText.trim()
				if (!zmanTime) {
					console.log('skipping', zmanTime)
					continue;
				}

				loopCal.setDate(
					loopCal.getDate()
						.withCalendar("hebrew")
						.with({ month: monthIndex, day: parseInt(zmanTable.rows[rowIndex].cells[0].innerText) })
						.withCalendar("iso8601")
				);

				if (zmanTable.rows[rowIndex].cells[monthIndex].innerHTML.toLowerCase().includes("<u") && loopCal.getDate().dayOfWeek !== 6) {
					console.error("non-Shabbat underline. Something must be wrong", {
						jDate: loopCal.getDate().toString({ calendarName: "always" }),
						ctScrapeMonth: zmanTable.rows[0].cells[monthIndex].innerText,
						ctScrapeDay: parseInt(zmanTable.rows[rowIndex].cells[0].innerText)

					})
					continue;
				}

				const [hour, minute, second] = zmanTime.split(":").map(time => parseInt(time))
				const time = loopCal.getDate().toZonedDateTime(this.geoL.getTimeZone()).with({ hour, minute, second })
				times.push(time.epochSeconds)
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

		for (const yearloop = calendar.clone(); yearloop.getJewishYear() !== calendar.getJewishYear() + 2; yearloop.setJewishYear(yearloop.getJewishYear() + 1)) {
			const ctLink = this.getChaiTablesLink(8, 0, yearloop, 413);

			const ctFetch = await fetch('https://ctscrape.torahquickie.xyz/' + ctLink.toString().replace(/https?:\/\//g, ''));
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

		const selectors = Array.from(document.getElementsByTagName("md-outlined-select")).map((/** @type {HTMLSelectElement} */elem) => elem);

		const MASubFormEvent = () => submitBtn.removeAttribute('disabled');

		const primaryIndex = selectors.find(select => select.id == 'MAIndex');
		const hideAllForms = () => {
			if (!submitBtn.hasAttribute('disabled'))
				submitBtn.setAttribute('disabled', '')

			const previouslySelectedMASel = selectors.find(selector => selector.id.endsWith('MetroArea') && selector.style.display !== 'none');
			if (previouslySelectedMASel)
				previouslySelectedMASel.removeEventListener('change', MASubFormEvent)

			selectors.filter(selector => selector.id.endsWith('MetroArea')).forEach(selector=>selector.style.display = 'none')
		}

		hideAllForms();
		primaryIndex.addEventListener('change', (/** @type {Event & { target: HTMLSelectElement }} */chngEvnt) => {
			hideAllForms();

			const highlightedSelector = selectors.find(select => select.id == chngEvnt.target.value + "MetroArea");
			highlightedSelector.style.removeProperty('display');
			highlightedSelector.addEventListener('change', MASubFormEvent)
			highlightedSelector.focus();
		})

		submitBtn.addEventListener('click', async () => {
			const selectedMASel = selectors.find(selector => selector.id.endsWith('MetroArea') && selector.style.display !== 'none');
			this.setOtherData(selectors[0].value, selectors[selectors.indexOf(selectedMASel)].selectedIndex);
			const ctData = await this.formatInterfacer();

			if (!ctData.times.length) {
				const toastBootstrap = window.bootstrap.Toast.getOrCreateInstance(document.getElementById('ctFailToast'))
				toastBootstrap.show();
				return;
			}

			localStorage.setItem("ctNetz", JSON.stringify(ctData));
			this.modal.hide();
		});
	}
}