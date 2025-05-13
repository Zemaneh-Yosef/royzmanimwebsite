//@ts-check

import "../../libraries/materialComp/materialweb.js"
import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"

export default class ChaiTables {
	constructor() {
		/** @type {KosherZmanim.GeoLocation} */
		this.geoL = null;
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
			RoundSecond: 1,
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
	 * @param {KosherZmanim.JewishDate} jDate
	 */
	extractTimes (domParsed, jDate) {
		const loopCal = jDate.clone();
		const times = [];

		const zmanTable = Array.from(domParsed.getElementsByTagName('table'))
			.find(table=>[14,15].includes(table.rows[0].cells.length));

		if (!zmanTable)
			throw Error("No zman table found: " + domParsed.getElementById('fetchURLInject').innerHTML);

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

				if (KosherZmanim.Temporal.ZonedDateTime.compare(time, jDate.getDate().toZonedDateTime(this.geoL.getTimeZone()).with({ hour: 0, minute: 0, second: 0 })) == 1)
					times.push(time.epochMilliseconds / 1000)
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
			if (calendar.getJewishYear() !== yearloop.getJewishYear()) {
				yearloop.setJewishMonth(KosherZmanim.JewishCalendar.TISHREI);
				yearloop.setJewishDayOfMonth(1);
			}
			const ctLink = this.getChaiTablesLink(8, 0, yearloop, 413);
			console.log(ctLink.toString())

			const ctFetch = await fetch('https://ctscrape.torahquickie.xyz/' + ctLink.toString().replace(/https?:\/\//g, ''));
			const ctResponse = await ctFetch.text()
			const ctDoc = (new DOMParser()).parseFromString(ctResponse, "text/html");

			const inputInject = document.createElement('script')
			inputInject.id = 'fetchURLInject'
			inputInject.innerHTML = `// CTScrapeOriginalURL: ${ctLink.toString()};`
			ctDoc.head.appendChild(inputInject)

			if (!ctDoc.getElementsByTagName('table').length) {
				continue;
			}

			data.times.push(...this.extractTimes(ctDoc, yearloop))
		}

		return data;
	}

	/** @param {import('../zmanimListUpdater.js').default} zmanLister  */
	initForm(zmanLister) {
		this.geoL = zmanLister.geoLocation;

		window.addEventListener('load', () => {
			const submitBtn = document.getElementById('gctnd');

			const selectors = Array.from(document.getElementsByTagName("md-outlined-select")).map((/** @type {HTMLSelectElement} */elem) => elem);
			selectors.forEach(selector => {
				// @ts-ignore
				selector.reset();

				/* const options = Array.from(selector.options);
				options.shift()
				options.forEach(option => {
					if (option.disabled)
						option.disabled = false;

					const bounds = JSON.parse(option.getAttribute('data-bounds'));
					if (Array.isArray(bounds)) {
						if (bounds.length == 1 && bounds[0].n == 0)
							return;

						console.log(option.value, bounds, this.geoL.getLatitude(), this.geoL.getLongitude())
						option.disabled = !isInsideBoundingBox(this.geoL.getLatitude(), this.geoL.getLongitude(), bounds);;
					} else {
						if (bounds.n == 0)
							return;

						option.disabled = !isInsideBoundingBox(this.geoL.getLatitude(), this.geoL.getLongitude(), [bounds]);
					}
				}) */
			});

			const MASubFormEvent = () => {
				submitBtn.removeAttribute('disabled');
				window.requestAnimationFrame(() => submitBtn.focus());
			}

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
				//window.requestAnimationFrame(() => highlightedSelector.focus())
				highlightedSelector.shadowRoot.getElementById("field").click()
			})

			submitBtn.addEventListener('click', async () => {
				submitBtn.setAttribute('disabled', '')
				submitBtn.classList.add("sbmitl")
				const selectedMASel = selectors.find(selector => selector.id.endsWith('MetroArea') && selector.style.display !== 'none');
				this.setOtherData(selectors[0].value, parseInt(selectors[selectors.indexOf(selectedMASel)].selectedOptions.item(0).value));
				const ctData = await this.formatInterfacer();

				if (!ctData.times.length) {
					const toastBootstrap = window.bootstrap.Toast.getOrCreateInstance(document.getElementById('ctFailToast'))
					toastBootstrap.show();
					return;
				}

				localStorage.setItem("ctNetz", JSON.stringify(ctData));
				this.modal.hide();

				const prevDate = zmanLister.jCal.getDate();
				zmanLister.resetCalendar();
				zmanLister.changeDate(prevDate);

				submitBtn.classList.remove("sbmitl");
			});
		})
	}
}

/**
 * @param {number} lat
 * @param {number} long
 * @param {{ n: number; s: number; e: number; w: number; }[]} bounds
 */
function isInsideBoundingBox(lat, long, bounds) {
    return bounds.some(b => {
        // Convert all values to floats with fixed precision
        const north = Number(parseFloat(`${b.n}`).toFixed(10));
        const south = Number(parseFloat(`${b.s}`).toFixed(10));
        const east = Number(parseFloat(`${b.e}`).toFixed(10));
        const west = Number(parseFloat(`${b.w}`).toFixed(10));
        const fixedLat = Number(parseFloat(`${lat}`).toFixed(10));
        const fixedLong = Number(parseFloat(`${long}`).toFixed(10));

        // Normalize latitude to handle crossing the poles
        const normalizedLat = (fixedLat + 90) % 180 - 90;

        // Handle cases where longitude wraps around
        if (west > east) {
            return (
                north > normalizedLat && south < normalizedLat &&
                (fixedLong > west || fixedLong < east)
            );
        } else {
            return (
                north > normalizedLat && south < normalizedLat &&
                west < fixedLong && east > fixedLong
            );
        }
    });
}