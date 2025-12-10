//@ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { settings } from "../settings/handler.js";
import { HebrewNumberFormatter } from "../WebsiteCalendar.js";
import { Previewer } from "../../libraries/paged.js"
import fitty from "../../libraries/fitty.js";
import QrCode from "../../libraries/qrCode.js";

import * as ol from "../../libraries/OpenLayers/index.js"
import StadiaMaps from "https://cdn.skypack.dev/ol/source/StadiaMaps";

const printParam = new URLSearchParams(window.location.search);
if (printParam.has('lessContrast')) {
	document.documentElement.style.setProperty('--bs-body-bg', 'snow');
	document.documentElement.style.setProperty('--bs-body-color', '#1A0033');
}

const cal = settings.language() == 'en' ? 'iso8601' : 'hebrew';
const dateForCal = {
	month: (printParam.has('currentMonth') && !printParam.has('year') ? Temporal.Now.plainDateISO().withCalendar(cal).month : 1),
	year: (printParam.has('year') ? parseInt(printParam.get('year')) : Temporal.Now.plainDateISO().withCalendar(cal).year),
}

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new GeoLocation(...glArgs);

const useOhrHachaim = (geoLocation.getLocationName() || "").toLowerCase().includes('israel') || settings.calendarToggle.forceSunSeasonal()
const amudehHoraahIndicators = [...document.querySelectorAll('[data-zfFind="luachAmudehHoraah"]')].filter(elem => elem instanceof HTMLElement);
const ohrHachaimIndicators = [...document.querySelectorAll('[data-zfFind="luachOhrHachaim"]')].filter(elem => elem instanceof HTMLElement);
if (useOhrHachaim) {
	amudehHoraahIndicators.forEach(elem => elem.remove());
} else {
	ohrHachaimIndicators.forEach(elem => elem.remove());
}

/** @type {HTMLElement} */
// @ts-ignore
const baseTable = document.getElementsByClassName('tableGrid')[0];

if (useOhrHachaim || printParam.has('mergeTzet')) {
	const humraTzet = baseTable.querySelector('[data-zyData="getTzetHumra"]');
	if (humraTzet) {
		/** @type {HTMLElement} */
		// @ts-ignore
		const headerTzet = humraTzet.previousElementSibling.previousElementSibling;
		headerTzet.removeAttribute('data-zyHeaderContainer');
		headerTzet.setAttribute('data-zyData', 'getTzet');
		headerTzet.style.removeProperty('grid-column-end');
		headerTzet.style.gridRow = '1 / span 2';

		humraTzet.previousElementSibling.remove();
		humraTzet.remove();
	}
}

const listAllShitot = Array.from(baseTable.querySelectorAll('[data-zyData]')).map(elem => [elem.getAttribute('data-zyData'), elem.getAttribute('data-round')])
baseTable.style.gridTemplateColumns = Array.from(document.getElementsByClassName('tableHeader'))
	.filter(elem => !elem.hasAttribute('data-zyHeaderContainer'))
	.map((/** @type {HTMLElement} */elem) => {
		if (elem.hasAttribute('data-wide-column'))
			return '1.25fr';
		else if (elem.getAttribute('data-zyData') == 'blank')
			return '4.5fr';

		if (printParam.has('shabbatOnly')) {
			if (['date', 'candleLightingRT'].includes(elem.getAttribute('data-zyData')))
				return '1fr';

			return (elem.style.gridRow == '1 / span 2' ? '.8fr' : '.6fr');
		} else {
			return (elem.style.gridRow == '1 / span 2' ? '1fr' : '.85fr');
		}
	})
	.join(" ");


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

let local = settings.language() == 'hb' ? 'he' : 'en'
if (navigator.languages.find(lang => lang.startsWith(local)))
	local = navigator.languages.find(lang => lang.startsWith(local));

const vsRadius = document.querySelector('[data-zyReplace="sunriseRadius"]');
const vsRNumber = (availableVS.length > 0
	? new Intl.NumberFormat(local, { style: "unit", unit: "kilometer"})
		.format(parseFloat(new URL(JSON.parse(localStorage.getItem('ctNetz')).url).searchParams.get("cgi_searchradius"))) : "N/A");
vsRadius.appendChild(document.createTextNode(vsRNumber))

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
	const stadiaSource = new StadiaMaps({
		layer: 'stamen_terrain',
		retina: true,
	});

	stadiaSource.setAttributions("");
	new ol.Map({
		controls: [],
		target: locationMapElem,
		layers: [new ol.layer.Tile({ source: stadiaSource }) ],
		view: new ol.View({
			center: ol.proj.fromLonLat([geoLocation.getLongitude(), geoLocation.getLatitude()]),
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
for (const genDate of document.getElementsByClassName("genDate"))
	genDate.appendChild(document.createTextNode([today.year, today.month, today.day].map(num=>num.toString().padStart(2, '0')).join("/")))

const secondSide = document.getElementsByClassName("secondSide")[0];

let plainDateForLoop = Temporal.Now.plainDateISO()
	.withCalendar(cal)
	.with({ month: dateForCal.month, day: 1, year: dateForCal.year })
const monthsForCal = plainDateForLoop.monthsInYear + (printParam.has('continueToNext') ? plainDateForLoop.add({ years: 1 }).monthsInYear : 0);
const yearsForDisplay = [...new Set([plainDateForLoop.year, plainDateForLoop.with({ month: 1 }).add({ months: monthsForCal - 1 }).year])]
	.map(year => settings.language() == "hb" ? new HebrewNumberFormatter().formatHebrewNumber(year) : year)
	.join(" - ")

const title = geoLocation.getLocationName() + ` (${yearsForDisplay})`
document.title = title + " - " + document.title;
for (const locName of document.querySelectorAll("[data-zyLocationText]"))
	locName.appendChild(document.createTextNode(title))

/** @type {Record<string, number>} */
const jewishYears = {};

let expectedReceive = 0;
let actualReceive = 0;
/** @type {Record<string, string[]>} */
let receiveData = {}
/** @type {import('./print-web-worker.js').singlePageParams[]} */
const arrayOfFuncParams = [];
for (let mIndex = plainDateForLoop.month; mIndex <= monthsForCal; (printParam.has('shabbatOnly') ? mIndex += 2 : mIndex++)) {
	const jewishYear = plainDateForLoop.with({ month: 1 }).add({ months: mIndex - 1 }).withCalendar('hebrew').year.toString();

	if (!(jewishYear in jewishYears))
		jewishYears[jewishYear] = 1;
	else
		jewishYears[jewishYear] += 1;

	expectedReceive += 1;
	arrayOfFuncParams.push({
		israel: (geoLocation.getLocationName() || "").toLowerCase().includes('israel'),
		geoCoordinates: glArgs,
		netz: availableVS,
		htmlElems: baseTable.outerHTML + (footer ? footer.outerHTML : "") + (secondSide ? secondSide.outerHTML : ""),
		calendar: cal,
		hourCalculator: settings.calendarToggle.forceSunSeasonal() ? "seasonal" : "degrees",
		date: plainDateForLoop.with({ month: 1 }).add({ months: mIndex - 1 }).toString(),
		oneYear: plainDateForLoop.year == plainDateForLoop.with({ month: 1 }).add({ months: monthsForCal - 1 }).year,
		rtKulah: settings.calendarToggle.rtKulah(),
		tzetMelakha: settings.customTimes.tzeithIssurMelakha(),
		timeFormat: settings.timeFormat(),
		lang: settings.language(),
		// @ts-ignore
		allShitot: listAllShitot,
		month: mIndex,
		candleTime: settings.customTimes.candleLighting(),
		shabbatOnly: printParam.has('shabbatOnly'),
		mergeTzet: printParam.has('mergeTzet') || useOhrHachaim,
		pocket: location.pathname.includes('pocket')
	})
}

for (const monthData of arrayOfFuncParams) {
	const webWorker = new Worker('/assets/js/features/print-web-worker.js', { type: 'module' });
	webWorker.addEventListener("message", async (/** @type {MessageEvent<ReturnType<import('./print-web-worker.js').default>>} */msg) => {
		actualReceive += 1;

		const respData = await msg.data;
		receiveData[respData.month] = respData.htmlContent
		if (actualReceive == expectedReceive) {
			const sortedObject = Object.fromEntries(Object.keys(receiveData)
				.sort()
				.map(key => [key, receiveData[key]]));

			for (const htmlData of Object.values(sortedObject)) {
				baseTable.parentElement.insertAdjacentHTML('beforeend', htmlData.join(''));
			}

			if (footer)
				footer.remove();
			else if (secondSide)
				secondSide.remove();
			baseTable.remove();

			await preparePrint();
		}
	})
	webWorker.addEventListener("error", (err) => {
		console.error(err);
	})

	webWorker.postMessage(monthData)
}

async function preparePrint() {
	const importantCardTitleText = document.getElementsByClassName('importantCardTitleText');

	if (importantCardTitleText.length) {
		const fittyElems = [...importantCardTitleText];

		if (document.getElementById('intTitleLocation'))
			fittyElems.push(document.getElementById('intTitleLocation'));

		// @ts-ignore
		window.fittyElem = fitty(fittyElems, { multiLine: true })
	}

	// Generate QR Code for ChaiTables
	// Use the jewishYears object to get the Jewish year with the most months covered in our calendar

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

	const fundamentalTable = document.querySelector('[data-zyFind="adjustmentsTable"]');
	if (fundamentalTable) {
		if (useOhrHachaim) {
			fundamentalTable.remove();
		} else {
			const { ZemanFunctions, zDTFromFunc } = await import("../ROYZmanim.js");
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

			fundamentalTable.querySelector('[data-zyReplace="dawnTzet"]').innerHTML = zmanCalc.timeRange.equinox.dawn.total("minutes").toFixed(2)
			fundamentalTable.querySelector('[data-zyReplace="nightfall"]').innerHTML = zmanCalc.timeRange.equinox.nightfall.total("minutes").toFixed(2)
			fundamentalTable.querySelector('[data-zyReplace="stringentNightfall"]').innerHTML = zmanCalc.timeRange.equinox.stringentNightfall.total("minutes").toFixed(2)
			fundamentalTable.querySelector('[data-zyReplace="tzetShabbat"]').innerHTML = [
				equinox.getShkiya().until(zDTFromFunc(equinox.getTzetMelakha())).total("minutes"),
				winterSolstice.getShkiya().until(zDTFromFunc(winterSolstice.getTzetMelakha())).total("minutes"),
				summerSolstice.getShkiya().until(zDTFromFunc(summerSolstice.getTzetMelakha())).total("minutes")
			].map((minutes, index) =>
				'~' + (new Intl.NumberFormat(local, { style: "unit", unit: "minute", maximumFractionDigits: 0 }))
					.format(minutes)
				+ " "
				+ ["(Spring/Fall)", "(Winter)", "(Summer)"][index]).join("<br>")
		}
	}

	/** @type {HTMLElement} */
	const finalExplanation = document.querySelector('[data-printFind]');
	if (!finalExplanation){
		if (!location.pathname.includes('pocket'))
			window.print();
		return;
	}

	for (const toExtract of document.querySelectorAll('[data-lang-extract]')) {
		const childFromExtract = Array.from(toExtract.children);
		const selectedLangChild = childFromExtract
			.find(langElem => langElem.classList.contains(`lang-${settings.language().replace('en-et', 'et')}`))

		childFromExtract.splice(childFromExtract.indexOf(selectedLangChild), 1); // Deletes the elem from the array
		for (const otherLang of childFromExtract)
			otherLang.remove();

		while (selectedLangChild.firstChild) {
			if ((!(selectedLangChild.firstChild instanceof HTMLParagraphElement)
			 && !(selectedLangChild.firstChild instanceof HTMLUListElement))
			 || selectedLangChild.hasAttribute('data-force-regAppend')) {
				toExtract.appendChild(selectedLangChild.firstChild);
				continue;
			}

			if (selectedLangChild.firstChild instanceof HTMLParagraphElement) {
				if (selectedLangChild.firstChild.textContent.trim() !== "") {
					const newParagraph = selectedLangChild.firstChild.cloneNode();
					while (selectedLangChild.firstChild.firstChild) {
						if (selectedLangChild.firstChild.firstChild.nodeType !== selectedLangChild.TEXT_NODE) {
							newParagraph.appendChild(selectedLangChild.firstChild.firstChild)
							continue;
						}

						const words = selectedLangChild.firstChild.firstChild.textContent.split(" ")
						for (let index = 0; index < words.length; index++) {
							if (words[index].trim() === "")
								continue;

							newParagraph.appendChild(document.createTextNode(
								(index == 1 && words[0].trim() === "" ? " " : "")
								+ words[index]
								+ (index + 1 == words.length ? "" : " ")))
							if (index + 1 !== words.length)
								newParagraph.appendChild(document.createElement("span"));
						}
						selectedLangChild.firstChild.firstChild.remove()
					}
					toExtract.appendChild(newParagraph);
				}
			}

			if (selectedLangChild.firstChild instanceof HTMLUListElement) {
				console.log("Detected List", selectedLangChild.firstChild);
				const newList = selectedLangChild.firstChild.cloneNode();
				while (selectedLangChild.firstChild.firstChild) {
					const ogListItem = selectedLangChild.firstChild.firstChild;
					if (ogListItem.nodeType == selectedLangChild.TEXT_NODE) {
						if (ogListItem.textContent.trim() === "") {
							ogListItem.remove();
							continue;
						}

						throw new Error("Invalid HTML structure, expected <li> element inside <ul> or <ol>.");
					}

					if (!(ogListItem instanceof HTMLLIElement)) {
						console.log(ogListItem);
						throw new Error("Invalid HTML sturcture, expected <li> element inside <ul> or <ol>.");
					}

					const newListItem = ogListItem.cloneNode();
					const elementToScan =
						ogListItem.childElementCount == 1
						&& ogListItem.firstElementChild instanceof HTMLParagraphElement
							? ogListItem.firstElementChild
							: ogListItem;

					while (elementToScan.firstChild) {
						if (elementToScan.firstChild.nodeType !== selectedLangChild.TEXT_NODE) {
							newListItem.appendChild(elementToScan.firstChild)
							continue;
						}

						const words = elementToScan.firstChild.textContent.split(" ")
						for (let index = 0; index < words.length; index++) {
							if (words[index].trim() === "")
								continue;

							newListItem.appendChild(document.createTextNode(
								(index == 1 && words[0].trim() === "" ? " " : "")
								+ words[index]
								+ (index + 1 == words.length ? "" : " ")))
							if (index + 1 !== words.length)
								newListItem.appendChild(document.createElement("span"));
						}
						elementToScan.firstChild.remove()
					}
					selectedLangChild.firstChild.firstChild.remove()
					newList.appendChild(newListItem);
				}
				toExtract.appendChild(newList);
			}

			selectedLangChild.firstChild.remove()
		}
		selectedLangChild.remove()
	}

	if (settings.language() == 'hb') {
		document.body.removeAttribute('dir');
		document.getElementsByTagName('main')[0].setAttribute('dir', 'rtl');
	}

	await sleep();

	const paged = new Previewer();
	const flow = await paged.preview(finalExplanation, ["/assets/css/footnotes.css"], finalExplanation.parentElement);
	console.log("Rendered", flow.total, "pages.");

	finalExplanation.style.display = "none";

	await sleep();

	for (const pagedJSPage of document.getElementsByClassName('pagedjs_page')) {
		if (!(pagedJSPage instanceof HTMLElement))
			continue;

		//const lastPage = pagedJSPage.getAttribute('data-page-number') == pagedJSPage.parentElement.style.getPropertyValue('--pagedjs-page-count')

		//if (!lastPage) {
			//pagedJSPage.style.height = 'unset';
		//}

		const pageSheet = pagedJSPage.firstElementChild;
		if (!(pageSheet instanceof HTMLElement))
			continue;

		//if (!lastPage) {
			//pageSheet.style.height = 'unset';
		//}
		pageSheet.style.overflow = 'unset';

		[
			'pagedjs_margin-top-left-corner-holder',
			'pagedjs_margin-top',
			'pagedjs_margin-top-right-corner-holder',
			'pagedjs_margin-right',
			'pagedjs_margin-left',
			'pagedjs_margin-bottom-left-corner-holder',
			'pagedjs_margin-bottom',
			'pagedjs_margin-bottom-right-corner-holder',
			'pagedjs_bleed'
		]
			.flatMap(className => Array.from(pageSheet.getElementsByClassName(className)))
			.forEach(elem => elem.remove());

		const pageBox = pageSheet.firstElementChild;
		if (!(pageBox instanceof HTMLElement))
			continue;

		//pageBox.style.height = 'unset';
		['top', 'right', 'left', 'bottom']
			.forEach(dir => pageBox.style.setProperty(`--pagedjs-margin-${dir}`, '0'));

		const pageContent = pageBox.getElementsByClassName('pagedjs_page_content')[0];
		if (!(pageContent instanceof HTMLElement))
			continue;

		pageContent.style.columnWidth = 'unset';
		pageContent.style.height = 'unset';
		pageContent.style.flex = '1 1';

		for (const pageContentChild of pageContent.children) {
			if (!(pageContentChild instanceof HTMLDivElement))
				continue;

			pageContentChild.style.height = 'unset';
		}

		if (pageContent.nextElementSibling && pageContent.nextElementSibling.classList.contains('pagedjs_footnote_area')) {
			// @ts-ignore
			pageContent.nextElementSibling.style.height = 'unset'
			// @ts-ignore
			pageContent.nextElementSibling.style.overflow = 'unset';
		}
	}

	await sleep();

	if (settings.language() == 'hb') {
		Array.from(document.getElementsByClassName('pagedjs_area')).forEach(pageArea => pageArea.setAttribute('dir', 'rtl'));
		await sleep();
	}

	window.print();
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