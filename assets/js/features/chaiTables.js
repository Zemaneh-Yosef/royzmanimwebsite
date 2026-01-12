//@ts-check

import "../../libraries/materialComp/materialweb.js"
import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js"

const searchRadius = [
	"0",
	"0.1",
	"0.2",
	"0.3",
	"0.4",
	"0.5",
	"0.6",
	"0.7",
	"0.8",
	"0.9",
	"1",
	"1.1",
	"1.2",
	"1.3",
	"1.4",
	"1.5",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"11",
	"12",
	"13",
	"14",
	"15"
]

export default class ChaiTables {
	/** @param {import('../zmanimListUpdater.js').default|{geoLocation: KosherZmanim.GeoLocation; jCal: import('../WebsiteCalendar.js').default}} zmanLister  */
	constructor(zmanLister) {
		this.zmanLister = zmanLister;
		this.geoL = zmanLister.geoLocation;

		if (document.getElementById("ctModal")) {
			this.modal = new window.bootstrap.Modal(document.getElementById("ctModal"));
			this.initForm();
		}
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
	 * @param {String} searchradius The search radius in kilometers.
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
			AddCushion: 2,
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
				searchradius,
				TableType: "Chai",
				USAcities1: this.indexOfMetroArea,
				eroslatitude: this.geoL.getLatitude().toFixed(6),
				eroslongitude: (-this.geoL.getLongitude()).toFixed(6),
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
	extractTimes(domParsed, jDate) {
		const loopCal = jDate.clone();
		const times = [];

		const zmanTable = Array.from(domParsed.getElementsByTagName('table'))
			.find(table => [14, 15].includes(table.rows[0].cells.length));

		if (!zmanTable)
			throw Error("No zman table found: " + domParsed.getElementById('fetchURLInject').innerHTML);

		let compareDate = jDate.getDate().toZonedDateTime(this.geoL.getTimeZone()).with({ hour: 0, minute: 0, second: 0 });
		compareDate = [compareDate.with({ day: 1 }), compareDate.withCalendar('hebrew').with({ day: 1 })]
			.sort(KosherZmanim.Temporal.ZonedDateTime.compare)[0]

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

				/* console.log({
					jDate: loopCal.getDate().toString({ calendarName: "always" }),
					ctScrapeMonth: zmanTable.rows[0].cells[monthIndex].innerText.trim(),
					ctScrapeDay: parseInt(zmanTable.rows[rowIndex].cells[0].innerText),
					zmanTime,
					time: time.toLocaleString()
				}) */

				// ensure that we're not adding times from the previous days
				// unless it's from the beginning of either the jewish or secular month (whichever is earlier)
				if (KosherZmanim.Temporal.ZonedDateTime.compare(time, compareDate) == 1)
					times.push(time.epochMilliseconds / 1000)
			}
		}

		return times;
	}

	async formatInterfacer() {
		const calendar = new KosherZmanim.JewishDate(
			this.zmanLister.jCal.getJewishYear(),
			this.zmanLister.jCal.getJewishMonth(),
			this.zmanLister.jCal.getJewishDayOfMonth()
		);

		/** @type {{url: string; times: number[]}} */
		const data = {
			times: [],
			url: ''
		}

		let smallestRadius;
		/** @type {Record<string, Document>} */
		const radiusData = {};

		const forceAlternativeRadius = [
			{ key: ["Israel", null], value: "2" },
			{
				key: ["USA", 32], value: (this.zmanLister.geoLocation.getLatitude() == 34.09777065545882
					&& this.zmanLister.geoLocation.getLongitude() == -118.42699812743257)
					? "14"
					: "8"
			}
		]

		const findForceAlternativeRadius = forceAlternativeRadius.find(item =>
			item.key[0] == this.selectedCountry
			&& (item.key[1] === null || item.key[1] == this.indexOfMetroArea)
		);

		if (findForceAlternativeRadius)
			smallestRadius = findForceAlternativeRadius.value;
		else {
			const ctBiggestRadius = this.getChaiTablesLink(searchRadius[searchRadius.length - 1], 0, calendar, 413);
			const ctBiggestFetch = await fetch('https://ctscrape.torahquickie.xyz/' + ctBiggestRadius.toString().replace(/https?:\/\//g, ''));
			const ctBiggestResponse = await ctBiggestFetch.text()
			const ctBiggestDoc = (new DOMParser()).parseFromString(ctBiggestResponse, "text/html");

			const inputInject = document.createElement('script')
			inputInject.id = 'fetchURLInject'
			inputInject.innerHTML = `// CTScrapeOriginalURL: ${ctBiggestRadius.toString()};`
			ctBiggestDoc.head.appendChild(inputInject)

			const biggestZmanTable = Array.from(ctBiggestDoc.getElementsByTagName('table'))
				.find(table => [14, 15].includes(table.rows[0].cells.length));

			if (!biggestZmanTable)
				return data;

			radiusData[searchRadius[searchRadius.length - 1] + '-' + calendar.getJewishYear()] = ctBiggestDoc;

			for (const radius of searchRadius) {
				if (radius === searchRadius[searchRadius.length - 1]) {
					smallestRadius = radius;
					break;
				}

				const ctLink = this.getChaiTablesLink(radius, 0, calendar, 413);

				const ctFetch = await fetch('https://ctscrape.torahquickie.xyz/' + ctLink.toString().replace(/https?:\/\//g, ''));
				const ctResponse = await ctFetch.text()
				const ctDoc = (new DOMParser()).parseFromString(ctResponse, "text/html");

				const zmanTable = Array.from(ctDoc.getElementsByTagName('table'))
					.find(table => [14, 15].includes(table.rows[0].cells.length));

				if (zmanTable) {
					smallestRadius = radius;
					radiusData[radius + '-' + calendar.getJewishYear()] = ctDoc;

					const inputInject = document.createElement('script')
					inputInject.id = 'fetchURLInject'
					inputInject.innerHTML = `// CTScrapeOriginalURL: ${ctLink.toString()};`
					ctDoc.head.appendChild(inputInject)

					break;
				}
			}
		}

		const urlNoYear = this.getChaiTablesLink(smallestRadius, 0, calendar, 413);
		urlNoYear.searchParams.delete('cgi_yrheb');
		data.url = urlNoYear.toString();

		for (const yearloop = calendar.clone(); yearloop.getJewishYear() !== calendar.getJewishYear() + 2; yearloop.setJewishYear(yearloop.getJewishYear() + 1)) {
			if (calendar.getJewishYear() !== yearloop.getJewishYear()) {
				yearloop.setJewishMonth(KosherZmanim.JewishCalendar.TISHREI);
				yearloop.setJewishDayOfMonth(1);
			}

			let ctDoc;
			if (radiusData[smallestRadius + '-' + yearloop.getJewishYear()]) {
				ctDoc = radiusData[smallestRadius + '-' + yearloop.getJewishYear()];
			} else {
				const ctLink = this.getChaiTablesLink(smallestRadius, 0, yearloop, 413);

				const ctFetch = await fetch('https://ctscrape.torahquickie.xyz/' + ctLink.toString().replace(/https?:\/\//g, ''));
				const ctResponse = await ctFetch.text()
				ctDoc = (new DOMParser()).parseFromString(ctResponse, "text/html");

				const inputInject = document.createElement('script')
				inputInject.id = 'fetchURLInject'
				inputInject.innerHTML = `// CTScrapeOriginalURL: ${ctLink.toString()};`
				ctDoc.head.appendChild(inputInject)
			}

			const zmanTable = Array.from(ctDoc.getElementsByTagName('table'))
				.find(table => [14, 15].includes(table.rows[0].cells.length));

			if (!zmanTable)
				continue;

			data.times.push(...this.extractTimes(ctDoc, yearloop))
		}

		data.times.sort();
		return data;
	}

	initForm() {
		const submitBtn = document.getElementById('gctnd');
		/** @type {HTMLInputElement} */
		// @ts-ignore
		const bboxToggle = document.getElementById("enableBBox");

		const selectors = Array.from(document.getElementsByTagName("md-outlined-select"))
		.map((/** @type {HTMLSelectElement} */elem) => elem);

		bboxToggle.addEventListener("change", () => { this.initForm(); }); // reinitialize modal with new filtering state

		const MASubFormEvent = () => {
			submitBtn.removeAttribute('disabled');
			window.requestAnimationFrame(() => submitBtn.focus());
		}

		// @ts-ignore
		const dataAlert = this.modal._element.querySelector('.alert');

		const primaryIndex = selectors.find(select => select.id == 'MAIndex');

		/** @type {HTMLSelectElement} */
		// @ts-ignore
		const usaStateSel = document.getElementById('USAStateSelector');

		/** @type {HTMLSelectElement} */
		// @ts-ignore
		const usaMetroSel = document.getElementById('USAMetroSelector');

		const allUSAMetroOptions = Array.from(usaMetroSel.options).slice(1); // skip blank

		const hideAllForms = () => {
			if (!submitBtn.hasAttribute('disabled')) {
				submitBtn.setAttribute('disabled', '');
				submitBtn.classList.remove("sbmitl");
			}

			dataAlert.style.setProperty('display', 'none', 'important');

			const previouslySelectedMASel = selectors.find(selector =>
				selector.id.endsWith('MetroArea') && selector.style.display !== 'none'
			);
			if (previouslySelectedMASel)
				previouslySelectedMASel.removeEventListener('change', MASubFormEvent);

			// Hide all non-USA metro selectors
			selectors
				.filter(selector => selector.id.endsWith('MetroArea'))
				.forEach(selector => selector.style.display = 'none');

			// Hide USA selectors
			usaStateSel.style.display = 'none';
			usaMetroSel.style.display = 'none';
		};

		hideAllForms();

		// USA state → metro handler
		const onStateChange = () => {
			const state = usaStateSel.value;

			// Reset metro selector
			// @ts-ignore
			usaMetroSel.reset();

			// Hide all metros
			allUSAMetroOptions.forEach(opt => opt.style.display = "none");

			// Show only metros for this state
			allUSAMetroOptions
				.filter(opt => opt.dataset.state === state)
				.forEach(opt => opt.style.display = "");

			usaMetroSel.style.removeProperty("display");
			usaMetroSel.addEventListener("change", MASubFormEvent);
			usaMetroSel.shadowRoot.getElementById("field").click();
		};

		/** @param {Event & { target: HTMLSelectElement }} chngEvnt */
		const primaryIndexChange = (chngEvnt) => {
			hideAllForms();

			const country = chngEvnt.target.value;
			this.selectedCountry = country;

			if (country === "USA") {
				// Reset USA selectors
				// @ts-ignore
				usaStateSel.reset();
				// @ts-ignore
				usaMetroSel.reset();
				allUSAMetroOptions.forEach(opt => opt.style.display = "none");

				usaStateSel.style.removeProperty("display");

				usaStateSel.shadowRoot.getElementById("field").click();

				// Prevent duplicate listeners
				usaStateSel.removeEventListener("change", onStateChange);
				usaStateSel.addEventListener("change", onStateChange);

				return;
			}

			// Non-USA behavior
			const highlightedSelector = selectors.find(select =>
				select.id == country + "MetroArea"
			);

			highlightedSelector.style.removeProperty('display');
			highlightedSelector.addEventListener('change', MASubFormEvent);
			highlightedSelector.shadowRoot.getElementById("field").click();
		}

		for (const selector of selectors) {
			// @ts-ignore
			selector.reset();

			for (const option of Array.from(selector.options).slice(1)) {
				if (option.disabled)
					option.disabled = false;

				if (bboxToggle.checked && !selector.id.endsWith("StateSelector")) {
					const bounds = JSON.parse(option.getAttribute('data-bounds'));
					if (Array.isArray(bounds)) {
						if (bounds.length == 1 && bounds[0].n == 0)
							continue;

						console.log(option.value, bounds, this.geoL.getLatitude(), this.geoL.getLongitude())
						option.disabled = !isInsideBoundingBox(this.geoL.getLatitude(), this.geoL.getLongitude(), bounds);;
					} else {
						if (bounds.n == 0)
							continue;

						option.disabled = !isInsideBoundingBox(this.geoL.getLatitude(), this.geoL.getLongitude(), [bounds]);
					}
				}
			}

			sortOptionsByAvailability(selector);
			const enabled = getEnabledOptions(selector);

			if (bboxToggle.checked && enabled.length === 1) {
				selector.value = enabled[0].value;

				// Trigger your existing change handler
				if (selector.id == 'MAIndex') {
					// @ts-ignore
					primaryIndexChange({ target: selector });
				}
			}

		}

		primaryIndex.addEventListener('change', primaryIndexChange);

		submitBtn.addEventListener('click', async () => {
			submitBtn.setAttribute('disabled', '');
			submitBtn.classList.add("sbmitl");

			let selectedMASel;

			if (this.selectedCountry === "USA") {
				selectedMASel = usaMetroSel;
			} else {
				selectedMASel = selectors.find(selector =>
					selector.id.endsWith("MetroArea") && selector.style.display !== "none"
				);
			}

			this.setOtherData(
				selectors[0].value,
				parseInt(selectedMASel.selectedOptions[0].value)
			);

			const ctData = await this.formatInterfacer();

			if (!ctData.times.length) {
				dataAlert.style.removeProperty('display');
				submitBtn.classList.remove("sbmitl");
				submitBtn.removeAttribute('disabled');
				return;
			}

			localStorage.setItem("ctNetz", JSON.stringify(ctData));
			this.modal.hide();

			const prevDate = this.zmanLister.jCal.getDate();
			if ('resetCalendar' in this.zmanLister)
				this.zmanLister.resetCalendar();

			if ('changeDate' in this.zmanLister)
				this.zmanLister.changeDate(prevDate);

			submitBtn.classList.remove("sbmitl");
		});
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

/** @param {HTMLSelectElement} selector */
function sortOptionsByAvailability(selector) {
    const options = Array.from(selector.options).slice(1); // skip blank

    const available = [];
    const unavailable = [];

    for (const opt of options) {
        if (opt.disabled) unavailable.push(opt);
        else available.push(opt);
    }

    // Re-append in sorted order
    for (const opt of [...available, ...unavailable]) {
        selector.appendChild(opt);
    }
}

/** @param {HTMLSelectElement} selector */
function getEnabledOptions(selector) {
    return Array.from(selector.options).filter(opt => !opt.disabled && opt.value !== "");
}