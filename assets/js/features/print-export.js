//@ts-check

import { GeoLocation } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { settings } from "../settings/handler.js";
import { HebrewNumberFormatter } from "../WebsiteCalendar.js";
import { Previewer } from "../../libraries/paged.js"
import fitty from "../../libraries/fitty.js";
import QrCode from "../../libraries/qrCode.js";

import { ZemanFunctions, zDTFromFunc } from "../ROYZmanim.js";
import { loadPrintRefraction, fillVisibleSunriseTable } from "./print-refraction.js";

import * as ol from "../../libraries/OpenLayers/ol.js"
import { spawnWorker } from "../misc/worker.js";
import { isInIsrael } from "../misc/israel.js";
import { detectJit } from "../misc/detect-jit.js";

// paged.js lays the pages out on screen, and printing keeps that layout, so it mustn't depend on the screen.
// Bootstrap Reboot grows h1-h4 with the window's width below 1200px (and the root font follows the browser's
// font-size setting), which moved the page breaks on smaller or zoomed windows. Pin them to their desktop
// sizes, and keep the light colours: in dark mode the text would print light grey.
// Added at the end of <head>: after Bootstrap, before the page's own styles, which still win.
const fixedLayoutStyle = document.createElement("style");
fixedLayoutStyle.textContent = `
	:root {
		font-size: 16px;
		color-scheme: light;
		--bs-body-color: #212529;
		--bs-body-color-rgb: 33, 37, 41;
		--bs-body-bg: #fff;
		--bs-body-bg-rgb: 255, 255, 255;
		--bs-emphasis-color: #000;
		--bs-secondary-color: rgba(33, 37, 41, 0.75);
		--bs-link-color: #0d6efd;
		--bs-link-color-rgb: 13, 110, 253;
		--bs-border-color: #dee2e6;
	}
	h1 { font-size: 2.5rem; }
	h2 { font-size: 2rem; }
	h3 { font-size: 1.75rem; }
	h4, legend { font-size: 1.5rem; }`;
document.head.appendChild(fixedLayoutStyle);

/**
 * A status line pinned to the top of the screen (never printed) while the print is built, so a slow year or a
 * failure shows on the page and not only in the console.
 */
const progress = (() => {
	const bar = document.createElement("div");
	bar.setAttribute("data-zyFind", "printProgress");
	bar.style.cssText = "position:fixed;top:0;inset-inline:0;z-index:9999;padding:.4rem .8rem;"
		+ "font:600 13px/1.4 system-ui,sans-serif;background:#1f2937;color:white;text-align:center";
	const status = document.createElement("div");
	/** a second line that stays while the status changes (see warn) */
	const warning = document.createElement("div");
	warning.style.cssText = "font-weight:400;color:#fde68a;margin-top:.2rem";
	warning.hidden = true;
	bar.append(status, warning);
	const style = document.createElement("style");
	style.textContent = "@media print { [data-zyFind=printProgress] { display: none !important; } }";
	document.head.appendChild(style);
	document.body.appendChild(bar);

	return {
		/** @param {string} text */
		set(text) { status.textContent = text; },
		/** @param {string} text */
		fail(text) { bar.style.background = "#b91c1c"; status.textContent = text; },
		/** @param {string} text */
		warn(text) { warning.textContent = text; warning.hidden = false; },
		done() { bar.remove(); style.remove(); }
	};
})();

// Some browsers run the site without their JavaScript optimizer (Edge's "Enhance your security on the web"),
// which makes the visible-sunrise ray tracing ~30x slower. Only checked in Chromium browsers: the check is
// calibrated on their engine (V8), and that's where the setting is. See print-export-weekly.js.
// @ts-ignore -- userAgentData isn't in the TS lib in use
if (navigator.userAgentData?.brands?.some((/** @type {{ brand: string }} */ b) => b.brand === "Chromium")) setTimeout(() => {
	try {
		const { jit, ratio } = detectJit();
		if (!jit) {
			console.warn(`JavaScript optimization seems to be off in this browser (loop/sort ratio ${ratio})`);
			progress.warn("Your browser has JavaScript optimization turned off for this site (for example, Microsoft Edge's "
				+ "“Enhance your security on the web”), so this calendar will take much longer to calculate. "
				+ "Adding royzmanim.com to the browser's exceptions for that setting fixes it.");
		}
	} catch (e) {
		console.error("JIT check failed", e);
	}
});

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

const inIsrael = isInIsrael(geoLocation.getLatitude(), geoLocation.getLongitude());
const useOhrHachaim = inIsrael || settings.calendarToggle.forceSunSeasonal()
const useElevation = settings.calendarToggle.useElevation(inIsrael);
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

let local = settings.language() == 'he' ? 'he' : 'en'
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
		geoLocation.getElevation() == 0 || !useElevation
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
		layers: [new ol.layer.Tile({ source: stadiaSource }) ],
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
			useElevation ? "↑" + meterFormatter.format(geoLocation.getElevation()) : ""
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
	.map(year => settings.language() == "he" ? new HebrewNumberFormatter().formatHebrewNumber(year) : year)
	.join(" - ")

const title = geoLocation.getLocationName() + ` (${yearsForDisplay})`
document.title = title + " - " + document.title;
for (const locName of document.querySelectorAll("[data-zyLocationText]"))
	locName.appendChild(document.createTextNode(title))

/** @type {Record<string, number>} */
const jewishYears = {};

const firstYearMonths = plainDateForLoop.monthsInYear;
/** @type {number[]} */
const monthsToPrint = [];
for (let mIndex = plainDateForLoop.month; mIndex <= monthsForCal;
	mIndex = !printParam.has('shabbatOnly') ? mIndex + 1
		: mIndex <= firstYearMonths && mIndex + 2 > firstYearMonths + 1 ? firstYearMonths + 1 : mIndex + 2) {
	const jewishYear = plainDateForLoop.with({ month: 1 }).add({ months: mIndex - 1 }).withCalendar('hebrew').year.toString();

	if (!(jewishYear in jewishYears))
		jewishYears[jewishYear] = 1;
	else
		jewishYears[jewishYear] += 1;

	monthsToPrint.push(mIndex);
}

// ─── Month worker pool ───────────────────────────────────────────────────────
// Spawned now so the module loads (and the Temporal polyfill import) overlap with the refraction fetch.
// Nothing is posted until the refraction data is in. One core is left for this thread; never more workers
// than months. Each worker takes the next month as soon as it finishes one.
const WORKER_URL = '/assets/js/features/print-web-worker.js';
const poolSize = Math.max(1, Math.min(monthsToPrint.length, (navigator.hardwareConcurrency || 4) - 1));
/** @type {Worker[]} */
const pool = Array.from({ length: poolSize }, () => spawnWorker(WORKER_URL));
/** @type {ErrorEvent | null} */
let earlyWorkerError = null;
const recordEarlyWorkerError = (/** @type {ErrorEvent} */ e) => { earlyWorkerError ??= e; };
pool.forEach(worker => worker.addEventListener('error', recordEarlyWorkerError));

// ─── Refraction data (forecast air + terrain horizon), as on the web page ───
progress.set("Loading the horizon and weather data…");
const firstPrintedDate = plainDateForLoop;
const lastPrintedDate = plainDateForLoop.with({ month: 1 }).add({ months: monthsForCal }).subtract({ days: 1 });
const { refraction, refractionInit } = await loadPrintRefraction(geoLocation, firstPrintedDate, lastPrintedDate);

// A range of path profiles is a large object graph, and postMessage clones it once for every worker, all on
// this thread before the first month is sent. As one JSON string (made once, parsed in the worker) it is
// copied, not walked. The snapshot is plain JSON (refraction-snapshot.js), so nothing is lost.
const { table: refractionTable, ...refractionRest } = refractionInit;
/** @type {import('./print-refraction.js').RefractionInit} */
const refractionMessage = { ...refractionRest, tableJson: JSON.stringify(refractionTable) };

// Everything that is the same for every month goes to each worker once; the months only carry their date.
/** @type {import('./print-web-worker.js').WorkerInit} */
const workerInit = {
	type: "init",
	israel: inIsrael,
	elevation: useElevation,
	geoCoordinates: glArgs,
	htmlElems: baseTable.outerHTML + (footer ? footer.outerHTML : "") + (secondSide ? secondSide.outerHTML : ""),
	calendar: cal,
	hourCalculator: settings.calendarToggle.forceSunSeasonal() ? "seasonal" : "degrees",
	oneYear: plainDateForLoop.year == plainDateForLoop.with({ month: 1 }).add({ months: monthsForCal - 1 }).year,
	rtKulah: settings.calendarToggle.rtKulah(),
	tekufaMidpoint: settings.calendarToggle.tekufaMidpoint(),
	tzetMelakha: settings.customTimes.tzeithIssurMelakha(inIsrael),
	timeFormat: settings.timeFormat(),
	lang: settings.language(),
	// @ts-ignore
	allShitot: listAllShitot,
	candleTime: settings.customTimes.candleLighting(),
	shabbatOnly: printParam.has('shabbatOnly'),
	mergeTzet: printParam.has('mergeTzet') || useOhrHachaim,
	pocket: location.pathname.includes('pocket')
};

/** @type {Pick<import('./print-web-worker.js').singlePageParams, 'month'|'date'>[]} */
const arrayOfFuncParams = monthsToPrint.map(month => ({
	month,
	date: plainDateForLoop.with({ month: 1 }).add({ months: month - 1 }).toString()
}));

/** Visible minus sea-level sunrise per ISO date (ms), reported by the workers. @type {Record<string, number>} */
const sunriseOffsets = {};

const fundamentalTable = document.querySelector('[data-zyFind="adjustmentsTable"]');
if (fundamentalTable) {
	if (useOhrHachaim) {
		fundamentalTable.remove();
	} else {
		const zmanCalc = new ZemanFunctions(geoLocation, {
			elevation: useElevation,
			melakha: workerInit.tzetMelakha,
			fixedMil: workerInit.israel || settings.calendarToggle.forceSunSeasonal(),
			candleLighting: settings.customTimes.candleLighting(),
			rtKulah: settings.calendarToggle.rtKulah(),
			atmosphereProvider: refraction?.provider ?? null,
			horizon: refraction?.horizon ?? null,
			haze: refraction?.haze ?? null
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

/** The months' HTML, in print order. @type {string[][]} */
const monthResults = new Array(arrayOfFuncParams.length);

const monthsStarted = performance.now();
progress.set(`Calculating months: 0 / ${arrayOfFuncParams.length}`);

try {
	await new Promise((resolve, reject) => {
		let nextTask = 0;
		let completed = 0;
		let failed = false;

		const failAll = (/** @type {any} */ err) => {
			if (failed) return;
			failed = true;
			pool.forEach(worker => worker.terminate());
			reject(err);
		};

		if (earlyWorkerError)
			return failAll(earlyWorkerError);

		for (const worker of pool) {
			worker.removeEventListener('error', recordEarlyWorkerError);
			worker.addEventListener('error', failAll);

			// Once per worker, before any month: messages are handled in order, so both are in place in time
			worker.postMessage(refractionMessage);
			worker.postMessage(workerInit);

			/** Index (in arrayOfFuncParams) of the month the worker is on: it gets the next one once it answers */
			let current = -1;
			const dispatch = () => {
				if (nextTask < arrayOfFuncParams.length) {
					current = nextTask++;
					worker.postMessage(arrayOfFuncParams[current]);
				} else {
					worker.terminate(); // queue drained, free the thread
				}
			};

			worker.addEventListener("message", (/** @type {MessageEvent<ReturnType<import('./print-web-worker.js').default>>} */msg) => {
				const respData = msg.data;
				if ('error' in respData)
					return failAll(new Error(`Month ${respData.month}: ${respData.error}`));

				monthResults[current] = respData.htmlContent;
				Object.assign(sunriseOffsets, respData.sunriseOffsets);

				completed++;
				const seconds = (performance.now() - monthsStarted) / 1000;
				progress.set(`Calculating months: ${completed} / ${arrayOfFuncParams.length}`);
				if (completed === arrayOfFuncParams.length) {
					console.info(`Full print: ${arrayOfFuncParams.length} months in ${seconds.toFixed(1)} s on ${poolSize} worker(s)`);
					resolve();
				}
				dispatch();
			});

			dispatch();
		}
	});
} catch (err) {
	// A worker's ErrorEvent says little in the console; spell it out on the page too
	const message = err instanceof ErrorEvent
		? `${err.message || "Worker failed to load"} (${err.filename || "worker"}${err.lineno ? ":" + err.lineno : ""})`
		: err instanceof Error ? err.message : String(err);
	console.error(err);
	progress.fail("The calendar could not be calculated: " + message.split("\n")[0]);
	throw err;
}

progress.set("Laying out the pages…");
// One HTML parse per month instead of one per page
for (const htmlData of monthResults)
	baseTable.parentElement.insertAdjacentHTML('beforeend', htmlData.join(''));

if (footer)
	footer.remove();
else if (secondSide)
	secondSide.remove();
baseTable.remove();

await preparePrint();

async function preparePrint() {
	const importantCardTitleText = document.getElementsByClassName('importantCardTitleText');

	if (importantCardTitleText.length) {
		const fittyElems = [...importantCardTitleText];

		if (document.getElementById('intTitleLocation'))
			fittyElems.push(document.getElementById('intTitleLocation'));

		// @ts-ignore
		window.fittyElem = fitty(fittyElems, { multiLine: true })
	}

	fillVisibleSunriseTable(document.querySelector('[data-zyFind="vsTable"]'), sunriseOffsets,
		firstPrintedDate, lastPrintedDate, refraction?.horizon, local);

	const currentPage = new URL(location.href);
	currentPage.pathname = '/calendar';
	currentPage.hostname = 'royzmanim.com';
	currentPage.port = '';
	console.log(currentPage.toString());

	const qrCodeDigitalView = document.getElementById('qrCodeDigitalView');
	if (qrCodeDigitalView) {
		qrCodeDigitalView.setAttribute('src', QrCode.render('svg-uri', QrCode.generate(currentPage.toString())));
	}

	/** @type {HTMLElement} */
	const finalExplanation = document.querySelector('[data-printFind]');
	if (!finalExplanation){
		progress.done();
		if (!location.pathname.includes('pocket'))
			window.print();
		return;
	}

	for (const toExtract of document.querySelectorAll('[data-lang-extract]')) {
		const childFromExtract = Array.from(toExtract.children);
		const selectedLangChild = childFromExtract
			.find(langElem => langElem.classList.contains(`lang-${settings.language()}`))

		childFromExtract.splice(childFromExtract.indexOf(selectedLangChild), 1); // Deletes the elem from the array
		for (const otherLang of childFromExtract)
			otherLang.remove();
		if (selectedLangChild.dir)
			toExtract.dir = selectedLangChild.dir;

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

	if (settings.language() == 'he') {
		document.body.removeAttribute('dir');
		document.getElementsByTagName('main')[0].setAttribute('dir', 'rtl');
	}

	await sleep();

	// paged.js rounds on-screen positions (relative to the window) all through its page breaking, so where its
	// pages sat moved the breaks: below the month tables and the source text, both as tall as the window's width
	// makes them, and scrolled by however much (in steps of the screen's pixel size). So they are laid out at the
	// very top of the page, with the source out of the way and the page unscrolled, the same on every screen,
	// and moved back afterwards.
	// paged.js copies the content's ancestors (attributes and all) into every page, so none of this may be an
	// inline style: the rules only match the real document (:root), never those copies.
	const renderTo = finalExplanation.parentElement;
	const renderToPlace = { parent: renderTo.parentNode, next: renderTo.nextSibling };
	const measuringStyle = document.createElement("style");
	measuringStyle.textContent = `
		:root { overflow: hidden; }
		:root > body > [data-zyPagedHost] > [data-printFind] { display: none; }`;
	document.head.appendChild(measuringStyle);
	renderTo.setAttribute('data-zyPagedHost', '');
	document.body.prepend(renderTo);
	window.scrollTo(0, 0);

	const paged = new Previewer();
	const flow = await paged.preview(finalExplanation, ["/assets/css/footnotes.css"], renderTo);
	console.log("Rendered", flow.total, "pages.");

	// The layout is final: without this, every resize below (moving the pages back, unsetting their heights)
	// would have paged.js re-check the pages a frame later and move content between them, or throw doing so
	for (const page of flow.pages)
		page.removeListeners();

	renderToPlace.parent.insertBefore(renderTo, renderToPlace.next);
	renderTo.removeAttribute('data-zyPagedHost');
	measuringStyle.remove();

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

	if (settings.language() == 'he') {
		Array.from(document.getElementsByClassName('pagedjs_area')).forEach(pageArea => pageArea.setAttribute('dir', 'rtl'));
		await sleep();
	}

	progress.done();
	window.print();
}

async function sleep() {
    return new Promise(requestAnimationFrame);
}

