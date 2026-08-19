//@ts-check

import { GeoLocation } from "../../../libraries/kosherZmanim/kosher-zmanim.js";
import { settings } from "../../settings/handler.js";
import { HebrewNumberFormatter } from "../../WebsiteCalendar.js";
import QrCode from "../../../libraries/qrCode.js";

import { ZemanFunctions, zDTFromFunc } from "../../ROYZmanim.js";

import * as ol from "../../../libraries/OpenLayers/ol.js"

const printParam = new URLSearchParams(window.location.search);
/** @type {'iso8601'|'hebrew'} */
// @ts-expect-error
const cal = printParam.has('yearType') && ['iso8601', 'hebrew'].includes(printParam.get('yearType')) ? printParam.get('yearType') : settings.language() == 'en' ? 'iso8601' : 'hebrew';

/** @type {{month: number; year: number}} */
const dateForCal = {
	month: undefined,
	year: (printParam.has('year') ? parseInt(printParam.get('year')) : Temporal.Now.plainDateISO().withCalendar(cal).year),
}

if (printParam.has("month"))
	dateForCal.month = parseInt(printParam.get('month'))
else if (printParam.has('currentMonth') && !printParam.has('year'))
	dateForCal.month = Temporal.Now.plainDateISO().withCalendar(cal).month
else
	dateForCal.month = 1

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new GeoLocation(...glArgs);

const useOhrHachaim = ['israel', 'ישראל'].some(isrName => (geoLocation.getLocationName() || "").toLowerCase().includes(isrName)) || settings.calendarToggle.forceSunSeasonal()
const amudehHoraahIndicators = [...document.querySelectorAll('[data-zfFind="luachAmudehHoraah"]')];
const ohrHachaimIndicators = [...document.querySelectorAll('[data-zfFind="luachOhrHachaim"]')];
if (useOhrHachaim) {
	amudehHoraahIndicators.forEach(elem => elem.remove());
} else {
	ohrHachaimIndicators.forEach(elem => elem.remove());
}

/** @type {HTMLElement} */
const baseTable = document.getElementById('templateZmanim');
baseTable.removeAttribute("id")

if (useOhrHachaim || printParam.has('noTzetStrict')) {
	const humraTzetList = baseTable.querySelectorAll('[data-zyTzetStrict]');
	for (const humraTzet of humraTzetList)
		humraTzet.removeAttribute("data-zyTzetStrict")
}


const ctNetzRaw = localStorage.getItem('ctNetz');
const ctNetz = ctNetzRaw && isValidJSON(ctNetzRaw) ? JSON.parse(ctNetzRaw) : {};
const ctNetzURL = ctNetz?.url ? new URL(ctNetz.url) : null;

/** @type {number[]} */
const availableVS = [];
if (ctNetzURL) {
	if (ctNetzURL.searchParams.get('cgi_eroslatitude') == geoLocation.getLatitude().toFixed(6)
		&& ctNetzURL.searchParams.get('cgi_eroslongitude') == (-geoLocation.getLongitude()).toFixed(6))
		availableVS.push(...ctNetz.times)
	else if (ctNetzURL.searchParams.get('cgi_country') == 'Eretz_Yisroel'
		&& ctNetzURL.searchParams.get('cgi_TableType') == 'BY'
		&& capitalizeFirstLetter(geoLocation.getLocationName().toLowerCase())
			.startsWith(capitalizeFirstLetter(ctNetzURL.searchParams.get('cgi_MetroArea'))))
		availableVS.push(...ctNetz.times)
}

let local = settings.language() == 'hb' ? 'he' : 'en'
if (navigator.languages.find(lang => lang.startsWith(local)))
	local = navigator.languages.find(lang => lang.startsWith(local));

const degreeFormatter = new Intl.NumberFormat(local, { style: "unit", unit: "degree", unitDisplay: "narrow", maximumFractionDigits: 5 });
const meterFormatter = new Intl.NumberFormat(local, { style: "unit", unit: "meter", maximumFractionDigits: 0 });

if (document.querySelector('[data-zyReplace="latitude"]'))
	document.querySelector('[data-zyReplace="latitude"]')
		.appendChild(document.createTextNode(degreeFormatter.format(geoLocation.getLatitude())));
if (document.querySelector('[data-zyReplace="longitude"]'))
	document.querySelector('[data-zyReplace="longitude"]')
		.appendChild(document.createTextNode(degreeFormatter.format(geoLocation.getLongitude())));

const elevation = document.querySelector('[data-zyReplace="elevation"]');
if (elevation) {
	elevation.appendChild(document.createTextNode(
		geoLocation.getElevation() == 0 || !useOhrHachaim
			? "Disabled"
			: meterFormatter.format(geoLocation.getElevation())
	));
}


/** @type {HTMLElement} */
const locationMapElem = document.querySelector('[data-zfFind="locationMap"]')
if (locationMapElem) {
	const stadiaSource = new ol.StadiaMaps({
		layer: 'stamen_terrain',
		retina: true,
	});

	new ol.Map({
		controls: [],
		target: locationMapElem,
		layers: [new ol.layer.Tile({ source: stadiaSource })],
		view: new ol.View({
			center: ol.fromLonLat([geoLocation.getLongitude(), geoLocation.getLatitude()]),
			zoom: 11
		})
	});
}

const footer = document.getElementsByClassName("zyCalFooter")[0];
if (footer) {
	const geoCoordinates = footer.querySelector("[data-geoCoordinates]");
	if (geoCoordinates)
		geoCoordinates
			.appendChild(document.createTextNode(`(${[
				degreeFormatter.format(geoLocation.getLatitude()),
				degreeFormatter.format(geoLocation.getLongitude()),
				useOhrHachaim ? "↑" + meterFormatter.format(geoLocation.getElevation()) : ""
			].filter(Boolean).join(", ")})`));
	const tz = footer.querySelector("[data-timeZone]")
	if (tz)
		tz.appendChild(document.createTextNode(geoLocation.getTimeZone()))
}

const today = Temporal.Now.plainDateISO()
for (const genDate of document.querySelectorAll("[data-zydategenerated]"))
	genDate.appendChild(document.createTextNode([today.year, today.month, today.day].map(num => num.toString().padStart(2, '0')).join("-")))

/** @type {HTMLElement} */
const secondSide = document.getElementById('templateSecondPage');
secondSide.removeAttribute("id")

const baseDate = Temporal.Now.plainDateISO()
	.withCalendar(cal)
	.with({ month: dateForCal.month, day: 1, year: dateForCal.year })
const baseDateForLoop = baseDate.subtract({ days: baseDate.dayOfWeek % 7 })

const endDate = Temporal.Now.plainDateISO()
	.withCalendar(cal)
	.with({ month: 1, day: 1, year: dateForCal.year + (printParam.has('continueToNext') ? 2 : 1) })
	.subtract({ days: 1 })
const endDateForLoop = endDate.add({ days: (7 - endDate.dayOfWeek) % 7 })

const weeksForLoop = baseDateForLoop.until(endDateForLoop).total({ unit: 'week', relativeTo: baseDateForLoop })
/* const yearsForDisplay = [...new Set([plainDateForLoop.year, plainDateForLoop.with({ month: 1 }).add({ months: monthsForCal - 1 }).year])]
	.map(year => settings.language() == "hb" ? new HebrewNumberFormatter().formatHebrewNumber(year) : year)
	.join(" - ")

const title = geoLocation.getLocationName() + ` (${yearsForDisplay})`
document.title = title + " - " + document.title;
for (const locName of document.querySelectorAll("[data-zyLocationText]"))
	locName.appendChild(document.createTextNode(title)) */

for (const locName of document.querySelectorAll('[data-zylocationname]'))
	locName.appendChild(document.createTextNode(geoLocation.getLocationName()))

/** @type {Record<string, number>} */
const jewishYears = {};

let expectedReceive = 0;
let actualReceive = 0;
/** @type {Record<string, { htmlContent: string[]; monthForIntro: number }>} */
let receiveData = {}
/** @type {import('./print-web-worker').singlePageParams[]} */
const arrayOfFuncParams = [];
for (let wIndex = 0; wIndex < weeksForLoop; wIndex++) {
	const jewishYear = baseDateForLoop.add({ weeks: wIndex }).withCalendar('hebrew').year.toString();

	if (!(jewishYear in jewishYears))
		jewishYears[jewishYear] = 1;
	else
		jewishYears[jewishYear] += 1;

	expectedReceive += 1;
	arrayOfFuncParams.push({
		israel: ['israel', 'ישראל'].some(isrName => (geoLocation.getLocationName() || "").toLowerCase().includes(isrName)),
		geoCoordinates: glArgs,
		netz: availableVS,
		htmlElems: baseTable.outerHTML + secondSide.outerHTML,
		calendar: cal,
		hourCalculator: settings.calendarToggle.forceSunSeasonal() ? "seasonal" : "degrees",
		date: baseDateForLoop.add({ weeks: wIndex }).toString(),
		rtKulah: settings.calendarToggle.rtKulah(),
		tzetMelakha: settings.customTimes.tzeithIssurMelakha(),
		timeFormat: settings.timeFormat(),
		lang: settings.language(),
		week: wIndex,
		candleTime: settings.customTimes.candleLighting(),
		addedZemanim: [...document.querySelectorAll('[data-zmanToCapture]')].map(elem => elem.getAttribute('data-zmantocapture'))
	})
}

const fundamentalTable = document.querySelector('[data-zyFind="adjustmentsTable"]');
if (fundamentalTable) {
	if (useOhrHachaim) {
		fundamentalTable.remove();
	} else {
		const zmanCalc = new ZemanFunctions(geoLocation, {
			elevation: arrayOfFuncParams[0].israel,
			melakha: arrayOfFuncParams[0].tzetMelakha,
			fixedMil: arrayOfFuncParams[0].israel || settings.calendarToggle.forceSunSeasonal(),
			candleLighting: settings.customTimes.candleLighting(),
			rtKulah: settings.calendarToggle.rtKulah()
		});

		const winterSolstice = zmanCalc.chainDate(zmanCalc.coreZC.getDate().with({ day: 21, month: 12 }))
		const summerSolstice = zmanCalc.chainDate(zmanCalc.coreZC.getDate().with({ day: 21, month: 6 }))
		const equinox = zmanCalc.chainDate(zmanCalc.coreZC.getDate().with({ day: 20, month: 3 }))

		fundamentalTable.querySelector('[data-zylengthofmil]').insertAdjacentText(
			'afterbegin',
			`${zmanCalc.timeRange.equinox.milLength.total("minutes").toFixed(2)}-seasonal-minute mil`
		);

		['dawn', 'nightfall', 'stringentNightfall']
			.forEach(zman => fundamentalTable.querySelector(`[data-zyReplace="${zman}"]`)
				.insertAdjacentText(
					'afterbegin',
					zmanCalc.timeRange.equinox[zman].total("minutes").toFixed(2)
				))

		fundamentalTable.querySelector('[data-zyReplace="tzetShabbat"]').innerHTML = [
			equinox.getShkiya().until(zDTFromFunc(equinox.getTzetMelakha())).total("minutes"),
			winterSolstice.getShkiya().until(zDTFromFunc(winterSolstice.getTzetMelakha())).total("minutes"),
			summerSolstice.getShkiya().until(zDTFromFunc(summerSolstice.getTzetMelakha())).total("minutes")
		].map((minutes, index) =>
			'~' + (new Intl.NumberFormat(local, { style: "unit", unit: "minute", maximumFractionDigits: 0 }))
				.format(minutes)
			+ ". "
			+ "<span style='font-size: .8em'>" + ["(Spring/Fall)", "(Winter)", "(Summer)"][index] + "</span>").join("<br>")
	}
}

/** @type {Record<string, Record<string, Record<string, string>>>} */
const addedZemanim = {};

const properPaging = document.querySelector('[data-insertBefore]');

for (const monthData of arrayOfFuncParams) {
	const webWorker = new Worker('/assets/js/features/weeklyPrint/print-web-worker.js', { type: 'module' });
	webWorker.addEventListener("message", async (/** @type {MessageEvent<ReturnType<import('./print-web-worker.js').default>>} */msg) => {
		actualReceive += 1;

		const respData = msg.data;
		receiveData[respData.week] = { htmlContent: respData.htmlContent, monthForIntro: respData.monthPrefix };
		addedZemanim[respData.week] = respData.addedZemanim;
		if (actualReceive == expectedReceive) {
			const sortedObject = Object.fromEntries(Object.keys(receiveData)
				.sort()
				.map(key => [key, receiveData[key]]));

			for (const [weekNum, weekData] of Object.entries(sortedObject)) {
				if (weekData.monthForIntro && arrayOfFuncParams.at(-1).week !== parseInt(weekNum)) {
					const prefixMonths = document.querySelectorAll(`[data-monthPrefix="${weekData.monthForIntro}"]`)
					if (prefixMonths.length)
						for (const prefixElem of prefixMonths)
							properPaging.insertAdjacentElement('beforebegin', prefixElem)
				}

				for (const htmlPages of weekData.htmlContent) {
					properPaging.insertAdjacentHTML('beforebegin', htmlPages)
				}
			}

			if (footer)
				footer.remove();
			else if (secondSide)
				secondSide.remove();
			baseTable.remove();

			insertBackZemanim();
			await preparePrint();
		}
	})
	webWorker.addEventListener("error", (err) => {
		console.error(err);
	})

	webWorker.postMessage(monthData)
}

function insertBackZemanim() {
	/**
	 * @type {Record<string, Map<Temporal.PlainDate, any>>}
	 */
	const formattedBackZemanim = Object.values(addedZemanim).reduce((acc, item) => {
		Object.entries(item).forEach(([key, value]) => {
			if (!acc[key]) acc[key] = new Map();
			Object.entries(value).forEach(([k, v]) => {
				const dateKey = Temporal.PlainDate.from(k);
				if (Temporal.PlainDate.compare(dateKey, baseDate) >= 0 &&
					Temporal.PlainDate.compare(dateKey, endDate) <= 0) {
					acc[key].set(dateKey, v);
				}
			});
		});
		return acc;
	}, /** @type {Record<string, Map<Temporal.PlainDate, any>>} */({}));

	// Get all unique zeman names
	const zemanNames = Object.keys(formattedBackZemanim);

	// For each zeman, create a table
	zemanNames.forEach(zemanName => {
		const dateMap = formattedBackZemanim[zemanName];

		if (!dateMap || dateMap.size === 0) return;

		// Group dates by month
		const monthData = new Map();
		dateMap.forEach((value, date) => {
			const monthKey = `${date.year}-${String(date.month).padStart(2, '0')}`;
			if (!monthData.has(monthKey)) {
				monthData.set(monthKey, new Map());
			}
			monthData.get(monthKey).set(date.day, value);
		});

		// Sort month keys chronologically
		const sortedMonths = Array.from(monthData.keys()).sort();

		if (sortedMonths.length === 0) return;

		// Split months into two chunks (or one if only a few months)
		const chunkCount = zemanName == 'rambamYomi' ? 3 : 2;

		const monthChunks = (sortedMonths.length <= endDate.monthsInYear / 4)
			? [sortedMonths]
			: Array.from({ length: chunkCount }, (_, i) => {
				const start = Math.ceil(i * sortedMonths.length / chunkCount);
				const end = Math.ceil((i + 1) * sortedMonths.length / chunkCount);
				return sortedMonths.slice(start, end);
			});

		console.log(zemanName)
		let insertAfterElement = [...document.querySelectorAll(`[data-zmanToCapture]`)]
			.find(elem => (elem instanceof HTMLElement) && elem.getAttribute('data-zmantocapture').startsWith(zemanName));

		// Create a table for each chunk
		monthChunks.forEach((monthChunk, chunkIndex) => {
			const tableWrapper = document.createElement('div');
			tableWrapper.classList.add('zemanim-table-wrapper');

			// Table title (zeman name + page number if multiple pages)
			const title = document.createElement('div');
			title.classList.add('zemanim-table-title');
			title.textContent = monthChunks.length > 1
				? `${zemanName} (${chunkIndex + 1}/${monthChunks.length})`
				: zemanName;
			tableWrapper.appendChild(title);

			// Create the table
			const table = document.createElement('table');
			table.classList.add('zemanim-table');

			// Header row with months
			const thead = document.createElement('thead');
			const headerRow = document.createElement('tr');

			// Corner cell
			const cornerCell = document.createElement('th');
			cornerCell.classList.add('corner-cell');
			cornerCell.textContent = 'Day';
			headerRow.appendChild(cornerCell);

			// Month headers for this chunk only
			monthChunk.forEach(monthKey => {
				const [year, month] = monthKey.split('-').map(Number);
				const date = Temporal.PlainDate.from({ year, month, day: 1, calendar: cal });
				const monthName = date.toLocaleString((settings.language() == 'hb' ? 'he' : 'en') + '-u-ca-hebrew', { month: 'short' });

				const th = document.createElement('th');
				th.textContent = monthName;
				headerRow.appendChild(th);
			});
			thead.appendChild(headerRow);
			table.appendChild(thead);

			// Body rows (days 1-31)
			const tbody = document.createElement('tbody');

			for (let day = 1; day <= 30; day++) {
				const row = document.createElement('tr');

				// Day cell
				const dayCell = document.createElement('td');
				dayCell.classList.add('day-cell');
				dayCell.textContent = day.toString();
				row.appendChild(dayCell);

				// Data cells for each month in this chunk
				monthChunk.forEach(monthKey => {
					const cell = document.createElement('td');

					const monthMap = monthData.get(monthKey);
					const [year, month] = monthKey.split('-').map(Number);

					// Check if this day exists in this month
					let dateValid = false;
					try {
						Temporal.PlainDate.from({ year, month, day, calendar: cal });
						dateValid = true;
					} catch (e) {
						// Invalid date (e.g., Feb 30)
					}

					if (!dateValid) {
						cell.textContent = '';
						cell.classList.add('empty-cell');
					} else if (monthMap && monthMap.has(day)) {
						cell.innerHTML = monthMap.get(day);
						cell.classList.add('data-cell');
					} else {
						cell.textContent = '—';
						cell.classList.add('no-data-cell');
					}

					row.appendChild(cell);
				});

				tbody.appendChild(row);
			}
			table.appendChild(tbody);
			tableWrapper.appendChild(table);

			const zemanTablePage = document.createElement("div")
			zemanTablePage.classList.add("page")
			if (!(chunkIndex % 2))
				zemanTablePage.classList.add("verso")
			zemanTablePage.appendChild(tableWrapper);

			insertAfterElement.insertAdjacentElement('afterend', zemanTablePage);
			insertAfterElement = zemanTablePage;
		});
	});
}

async function preparePrint() {
	/*const importantCardTitleText = document.getElementsByClassName('importantCardTitleText');

	if (importantCardTitleText.length) {
		const fittyElems = [...importantCardTitleText];

		if (document.getElementById('intTitleLocation'))
			fittyElems.push(document.getElementById('intTitleLocation'));

		// @ts-ignore
		window.fittyElem = fitty(fittyElems, { multiLine: true })
	} */

	await sleep();

	const fittyElems = [...document.getElementsByClassName('secondPageHeader')].map(elem => [elem.firstElementChild, elem.lastElementChild]).flat()

	function shrinkToFit(el) {
		const lineHeight = parseFloat(getComputedStyle(el).lineHeight);

		// Keep shrinking until text fits on one line
		while (el.scrollHeight > lineHeight * 1.1) {
			const current = parseFloat(getComputedStyle(el).fontSize);
			el.style.fontSize = (current - 0.5) + 'px';
			if (current <= 4) break;  // Safety limit
		}
	}

	// Run once on init
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			fittyElems.forEach(shrinkToFit);
		})
	});

	// Re-run if window resizes
	window.addEventListener('resize', () => {
		fittyElems.forEach(el => {
			el.style.fontSize = '';  // Reset to CSS default
			shrinkToFit(el);
		});
	});

	// Run once on init
	fittyElems.forEach(shrinkToFit);

	// Re-run if window resizes
	window.addEventListener('resize', () => {
		fittyElems.forEach(el => {
			el.style.fontSize = '';  // Reset to CSS default
			shrinkToFit(el);
		});
	});

	// Generate QR Code for ChaiTables
	// Use the jewishYears object to get the Jewish year with the most months covered in our calendar

	const vsTable = document.querySelector('[data-zyFind="vsTable"]');
	if (vsTable) {
		if (availableVS.length == 0) {
			vsTable.remove();
		} else {
			const radiusElem = vsTable.querySelector('[data-zyReplace="sunriseRadius"]')
			if (!ctNetzURL.searchParams.has("cgi_searchradius")) {
				radiusElem.previousElementSibling.remove()
				radiusElem.remove()
			} else {
				const vsRNumber = new Intl.NumberFormat(local, { style: "unit", unit: "kilometer" })
					.format(parseFloat(ctNetzURL.searchParams.get("cgi_searchradius")));
				radiusElem.innerHTML = vsRNumber;
			}

			const earliestCalendarDay = Temporal.PlainDate.from(arrayOfFuncParams[0].date);
			const latestCalendarDay = Temporal.PlainDate.from(arrayOfFuncParams[arrayOfFuncParams.length - 1].date).add({ months: 1 }).subtract({ days: 1 });

			// Convert all the ints of availableVS (second form) to Temporal.PlainDate
			const availableVSDates = availableVS.map(vsInt => {
				const vsDate = Temporal.Instant.fromEpochMilliseconds(vsInt * 1000);
				return vsDate.toZonedDateTimeISO(geoLocation.getTimeZone());
			});

			// Use Temporal Compare function to determine whether the date is within the calendar range
			const filteredVSDates = availableVSDates.filter(vsDate =>
				Temporal.PlainDate.compare(vsDate.toPlainDate(), earliestCalendarDay) >= 0
				&& Temporal.PlainDate.compare(vsDate.toPlainDate(), latestCalendarDay) <= 0);

			const zmanCalc = new ZemanFunctions(geoLocation, {
				elevation: arrayOfFuncParams[0].israel,
				melakha: arrayOfFuncParams[0].tzetMelakha,
				fixedMil: arrayOfFuncParams[0].israel || settings.calendarToggle.forceSunSeasonal(),
				candleLighting: settings.customTimes.candleLighting(),
				rtKulah: settings.calendarToggle.rtKulah()
			});

			/** @type {{
			 * earliest: {msDiff: number; date: Temporal.PlainDate}
			 * latest: {msDiff: number; date: Temporal.PlainDate}}} */
			let diffs = {
				earliest: { msDiff: 0, date: null },
				latest: { msDiff: 0, date: null }
			};

			for (const vsDate of filteredVSDates) {
				zmanCalc.setDate(vsDate.toPlainDate());
				const sunriseTime = zDTFromFunc(zmanCalc.getNetz());
				const msDiff = vsDate.epochMilliseconds - sunriseTime.epochMilliseconds;

				if (msDiff < 0 && (diffs.earliest.date === null || msDiff < diffs.earliest.msDiff)) {
					diffs.earliest = { msDiff, date: vsDate.toPlainDate() };
				} else if (msDiff > 0 && (diffs.latest.date === null || msDiff > diffs.latest.msDiff)) {
					diffs.latest = { msDiff, date: vsDate.toPlainDate() };
				}
			}

			if (diffs.earliest.date == null) {
				vsTable.querySelector('[data-zyReplace="earliestOffset"]').innerHTML = "N/A";
			} else {
				const dur = Temporal.Duration.from({ milliseconds: Math.abs(diffs.earliest.msDiff) }).round({ smallestUnit: "second" });
				vsTable.querySelector('[data-zyReplace="earliestOffset"]').innerHTML =
					formatDuration(dur) + `<div style='font-size:.8em;'>(${diffs.earliest.date})</div>`;
			}

			if (diffs.latest.date == null) {
				vsTable.querySelector('[data-zyReplace="latestOffset"]').innerHTML = "N/A";
			} else {
				const dur = Temporal.Duration.from({ milliseconds: Math.abs(diffs.latest.msDiff) }).round({ smallestUnit: "second" });
				vsTable.querySelector('[data-zyReplace="latestOffset"]').innerHTML =
					formatDuration(dur) + `<div style='font-size:.8em;'>(${diffs.latest.date})</div>`;
			}
		}
	}

	if (availableVS.length) {
		const qrCodeNetzElem = document.getElementById('qrCodeVisualSunrise');
		if (qrCodeNetzElem) {
			const jewishYearForQR = Object.entries(jewishYears).sort((a, b) => b[1] - a[1])[0][0];

			const fixedNetzURL = new URL(JSON.parse(localStorage.getItem('ctNetz')).url);
			fixedNetzURL.searchParams.set('cgi_yrheb', jewishYearForQR);
			qrCodeNetzElem.setAttribute('src', QrCode.render('svg-uri', QrCode.generate(fixedNetzURL.toString())));

			document.querySelector('[data-zyReplace="zyVSHebYear"]').innerHTML = jewishYearForQR;
		}
	}

	const currentPage = new URL(location.href);
	currentPage.pathname = '/calendar';
	currentPage.hostname = 'royzmanim.com';
	currentPage.port = '';
	console.log(currentPage.toString());

	const qrCodeDigitalView = document.getElementById('qrCodeDigitalView');
	if (qrCodeDigitalView) {
		qrCodeDigitalView.setAttribute('src', QrCode.render('svg-uri', QrCode.generate(currentPage.toString())));
	}
}

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

async function sleep() {
	return new Promise(requestAnimationFrame);
}

/**
 * @param {string} val
 */
function capitalizeFirstLetter(val) {
	return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

/** @param {Temporal.Duration} duration */
function formatDuration(duration) {
	const totalSeconds = Math.round(duration.total("seconds"));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	// Use Intl.DurationFormat when available, fallback otherwise
	// @ts-ignore
	if (typeof Intl.DurationFormat !== "undefined") {
		// @ts-ignore
		return new Intl.DurationFormat(local, { minute: "short", second: "short" })
			.format({ minutes, seconds });
	}
	return `${minutes}m ${seconds}s`; // safe fallback
}