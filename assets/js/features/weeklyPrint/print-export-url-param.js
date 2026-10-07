//@ts-check

import { GeoLocation } from "../../../libraries/kosherZmanim/kosher-zmanim.js";
import { settings } from "../../settings/handler.js";
import { getOrdinal, HebrewNumberFormatter } from "../../WebsiteCalendar.js";
import fitty from "../../../libraries/fitty.js";
import QrCode from "../../../libraries/qrCode.js";
import { analyzeCycle as analyzeTimeZoneCycle } from "../../../libraries/dst-transition.js";

import { ZemanFunctions, zDTFromFunc } from "../../ROYZmanim.js";
import { loadRefraction, snapshotProvider } from "../../refraction-data.js";

import * as ol from "../../../libraries/OpenLayers/ol.js"

import { fetchLightPollution } from "../../../libraries/light-pollution-client.js";
import MoonRender from "./moon-render.js";

const WORKER_URL = '/assets/js/features/weeklyPrint/print-web-worker.js';

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

const inIsrael = ['israel', 'ישראל'].some(isrName => (geoLocation.getLocationName() || "").toLowerCase().includes(isrName));
const useOhrHachaim = inIsrael || settings.calendarToggle.forceSunSeasonal()
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

// Not awaited: nothing else depends on it, so it no longer holds up the rest of the page
const lightPol = document.querySelector('[data-zyReplace="light-pollution"]')
if (lightPol)
	fetchLightPollution("https://hanetz.royzmanim.com/selfhost", geoLocation.getLatitude(), geoLocation.getLongitude())
		.then(result => lightPol.appendChild(document.createTextNode(result.artificialMcdM2.toFixed(2) + " mcd/m²")))
		.catch(err => console.warn("Light pollution:", err));


/** @type {HTMLElement} */
const locationMapElem = document.querySelector('[data-zyFind="locationMap"]')
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

// Workers start once the refraction data is in (mRender.start below)
const mRender = new MoonRender(geoLocation, {
	language: settings.language(),
	timeFormat: settings.timeFormat(),
	hourCalculator: settings.calendarToggle.forceSunSeasonal() ? "seasonal" : "degrees",
}, baseDate, endDate);

const weeksForLoop = baseDateForLoop.until(endDateForLoop).total({ unit: 'week', relativeTo: baseDateForLoop });

// ─── Week worker pool ────────────────────────────────────────────────────────
// Spawned now so the module loads (and the Temporal polyfill import) overlap with the refraction fetch.
// Nothing is posted until the refraction data and the template are ready. One core is left for the main
// thread and one for the moon workers; never more workers than weeks.
const poolSize = Math.max(1, Math.min(
	weeksForLoop,
	(navigator.hardwareConcurrency || 4) - 2
));

/** @type {Worker[]} */
const pool = Array.from({ length: poolSize }, () => new Worker(WORKER_URL, { type: 'module' }));
/** @type {ErrorEvent | null} */
let earlyWorkerError = null;
const recordEarlyWorkerError = (/** @type {ErrorEvent} */ e) => { earlyWorkerError ??= e; };
pool.forEach(worker => worker.addEventListener('error', recordEarlyWorkerError));

// ─── Refraction data ─────────────────────────────────────────────────────────
// This page is the main thread, so loadRefraction() can use localStorage (horizon + normals are
// shared with the web page's cache). Workers can't receive the provider (a closure), so we evaluate it
// here for every sunrise / sunset in range and post the plain results; dates outside the snapshot fall
// back to the monthly normals inside the worker. The moon workers get the same snapshot, so it also spans
// their nights: the first Hebrew month can start up to a month before the printed range.
const SNAPSHOT_MARGIN_DAYS = 14; // holiday boxes look a few days before / after their week
const moonNights = mRender.nightRange();
const earlier = (/** @type {Temporal.PlainDate} */ a, /** @type {Temporal.PlainDate | undefined} */ b) => b && Temporal.PlainDate.compare(b, a) < 0 ? b : a;
const later = (/** @type {Temporal.PlainDate} */ a, /** @type {Temporal.PlainDate | undefined} */ b) => b && Temporal.PlainDate.compare(b, a) > 0 ? b : a;
const snapshotStart = earlier(baseDateForLoop.withCalendar("iso8601").subtract({ days: SNAPSHOT_MARGIN_DAYS }), moonNights?.from);
const snapshotEnd = later(endDateForLoop.withCalendar("iso8601").add({ days: SNAPSHOT_MARGIN_DAYS }), moonNights?.to);
const snapshotDays = snapshotStart.until(snapshotEnd, { largestUnit: "day" }).days + 1;

const refraction = await loadRefraction(geoLocation.getLatitude(), geoLocation.getLongitude(), {
	prefetch: { from: snapshotStart, days: snapshotDays },
	moon: true // the moon pages' visible moonrise / moonset (horizon.moon); the sun's part is unchanged
});
if (refraction.notes.length)
	console.info("Refraction:", refraction.notes);

/** @type {import('./print-web-worker.js').RefractionInit} */
const refractionInit = {
	type: "refraction",
	table: snapshotProvider(refraction.provider, geoLocation, snapshotStart, snapshotDays),
	normals: refraction.normals,
	horizon: refraction.horizon
};

// The moon workers take the same message as the weekly ones
mRender.start(refractionInit);

const yearsForDisplay = [dateForCal.year];
if (printParam.has('continueToNext')) {
	yearsForDisplay.push(dateForCal.year + 1);
	if (baseDate.month == baseDate.monthsInYear)
		yearsForDisplay.shift();
}
const displayYears = yearsForDisplay.map(year => year > 3000 ? new HebrewNumberFormatter().formatHebrewNumber(year) : year)

const title = geoLocation.getLocationName() + ` (${displayYears.join('-')})`
document.title = title + " - " + document.title;
for (const locName of document.querySelectorAll("[data-zyLocationText]"))
	locName.appendChild(document.createTextNode(title))

function renderGoldPlaques() {
	const fontSize = 28, fontWeight = 700;
	const fontFamily = getComputedStyle(document.documentElement)
		.getPropertyValue('--body-font') || 'serif';
	const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
	const strokeWidth = 2.5, padX = 6, padY = 5;
	const scale = 4; // supersample so it stays crisp at print resolution

	// One measuring context for every plaque
	const measureCtx = document.createElement('canvas').getContext('2d');
	measureCtx.font = font;

	document.querySelectorAll('.plaque').forEach(plaque => {
		const source = plaque.querySelector('.goldPlaqueSourceText');
		/** @type {HTMLImageElement} */
		const img = plaque.querySelector('.goldPlaqueImg');
		if (!source || !img) return;
		const text = source.textContent;

		// Measure first
		const m = measureCtx.measureText(text);
		const ascent = m.actualBoundingBoxAscent || fontSize * 0.8;
		const descent = m.actualBoundingBoxDescent || fontSize * 0.3;
		const cw = Math.ceil(m.width + padX * 2 + strokeWidth * 2);
		const ch = Math.ceil(ascent + descent + padY * 2 + strokeWidth * 2);

		// Draw at supersampled resolution
		const canvas = document.createElement('canvas');
		canvas.width = cw * scale;
		canvas.height = ch * scale;
		const ctx = canvas.getContext('2d');
		ctx.scale(scale, scale);
		ctx.font = font;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const cx = cw / 2, cy = ch / 2;
		const grad = ctx.createLinearGradient(0, cy - ascent, 0, cy + descent);
		grad.addColorStop(0.0, '#c7972f');
		grad.addColorStop(0.2, '#916718');
		grad.addColorStop(0.4, '#fde97d');
		grad.addColorStop(0.6, '#d9a941');
		grad.addColorStop(0.8, '#fddd8b');
		grad.addColorStop(1.0, '#f3c14b');

		ctx.lineJoin = 'round';
		ctx.strokeStyle = 'black';
		ctx.lineWidth = strokeWidth;
		ctx.strokeText(text, cx, cy);   // stroke first, mimicking paint-order
		ctx.fillStyle = grad;
		ctx.fillText(text, cx, cy);    // gold fill on top

		img.src = canvas.toDataURL('image/png');
		img.width = cw;
		img.height = ch;
	});
}

async function readyThenRender() {
	const fontFamily = getComputedStyle(document.documentElement)
		.getPropertyValue('--body-font') || 'serif';
	await Promise.all([
		document.fonts.load(`700 26px ${fontFamily}`),
		document.fonts.ready
	]);
	await new Promise(res => {
		if (document.readyState === 'complete') res();
		else window.addEventListener('load', res, { once: true });
	});
	renderGoldPlaques();
}

readyThenRender();

for (const locName of document.querySelectorAll('[data-zylocationname]'))
	locName.appendChild(document.createTextNode(geoLocation.getLocationName()))

const prayerAngle = document.querySelector('[data-zy-prayer-angle]')
if (prayerAngle) {
	const harHabait = new GeoLocation('Jerusalem, Israel', 31.778, 35.2354, "Asia/Jerusalem");
	prayerAngle.appendChild(document.createTextNode(geoLocation.getRhumbLineBearing(harHabait).toFixed(2) + "°"))
}

const timezoneTrans = analyzeTimeZoneCycle(baseDate.withCalendar("iso8601"), endDate.withCalendar("iso8601"), geoLocation.getTimeZone());
const dstText = document.querySelector('[data-zyFind="timeZoneOutlier"]');

dstText.innerHTML = dstText.innerHTML.split("|")[timezoneTrans.bracketing.isDST ? 1 : 0];
document.querySelector('[data-zyReplace="timezoneStartDate"]').innerHTML =
	timezoneTrans.outlier.start.toLocaleString(undefined, { 'month': "short" })
	+ ". "
	+ getOrdinal(timezoneTrans.outlier.start.day, true)

document.querySelector('[data-zyReplace="timezoneEndDate"]').innerHTML =
	timezoneTrans.outlier.end.toLocaleString(undefined, { 'month': "short" })
	+ ". "
	+ getOrdinal(timezoneTrans.outlier.end.day, true)

// Everything that is the same for every week goes to each worker once; the weeks only carry their date.
// Built here (not earlier) so the template HTML includes the location / date text filled in above.
/** @type {import('./print-web-worker.js').WorkerInit} */
const weekInit = {
	type: "init",
	israel: inIsrael,
	geoCoordinates: glArgs,
	htmlElems: baseTable.outerHTML + secondSide.outerHTML,
	calendar: cal,
	hourCalculator: settings.calendarToggle.forceSunSeasonal() ? "seasonal" : "degrees",
	rtKulah: settings.calendarToggle.rtKulah(),
	tzetMelakha: settings.customTimes.tzeithIssurMelakha(),
	timeFormat: settings.timeFormat(),
	lang: settings.language(),
	candleTime: settings.customTimes.candleLighting(),
	addedZemanim: [...document.querySelectorAll('[data-zmanToCapture]')].map(elem => elem.getAttribute('data-zmantocapture'))
};

/** @type {import('./print-web-worker.js').singlePageParams[]} */
const arrayOfFuncParams = Array.from({ length: weeksForLoop }, (_, week) => ({
	week,
	date: baseDateForLoop.add({ weeks: week }).toString()
}));

const fundamentalTable = document.querySelector('[data-zyFind="adjustmentsTable"]');
if (fundamentalTable) {
	if (useOhrHachaim) {
		fundamentalTable.remove();
	} else {
		const zmanCalc = new ZemanFunctions(geoLocation, {
			elevation: weekInit.israel,
			melakha: weekInit.tzetMelakha,
			fixedMil: weekInit.israel || settings.calendarToggle.forceSunSeasonal(),
			candleLighting: settings.customTimes.candleLighting(),
			rtKulah: settings.calendarToggle.rtKulah(),
			atmosphereProvider: refraction.provider,
			horizon: refraction.horizon
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

		const minuteFormatter = new Intl.NumberFormat(local, { style: "unit", unit: "minute", maximumFractionDigits: 0 });
		fundamentalTable.querySelector('[data-zyReplace="candleLighting"]').innerHTML = settings.customTimes.candleLighting().toString()
		fundamentalTable.querySelector('[data-zyReplace="tzetShabbat"]').innerHTML = [
			equinox.getShkiya().until(zDTFromFunc(equinox.getTzetMelakha())).total("minutes"),
			winterSolstice.getShkiya().until(zDTFromFunc(winterSolstice.getTzetMelakha())).total("minutes"),
			summerSolstice.getShkiya().until(zDTFromFunc(summerSolstice.getTzetMelakha())).total("minutes")
		].map((minutes, index) =>
			'~' + minuteFormatter.format(minutes)
			+ ". "
			+ "<span style='font-size: .8em'>" + ["(Spring/Fall)", "(Winter)", "(Summer)"][index] + "</span>").join("<br>")
	}
}

/** @type {Record<string, Record<string, Record<string, string>>>} */
const addedZemanim = {};

/** Visible minus sea-level sunrise per date (ms), reported by the workers for the sunrise table. @type {Record<string, number>} */
const sunriseOffsets = {};

const properPaging = document.querySelector('[data-insertBefore]');

/** @type {ReturnType<import('./print-web-worker.js').default>[]} */
const weekResults = new Array(arrayOfFuncParams.length);

await new Promise((resolve, reject) => {
	let nextTask = 0;
	let completed = 0;
	let failed = false;

	const failAll = (/** @type {any} */ err) => {
		if (failed) return;
		failed = true;
		pool.forEach(w => w.terminate());
		reject(err);
	};

	if (earlyWorkerError)
		return failAll(earlyWorkerError);

	for (const worker of pool) {
		worker.removeEventListener('error', recordEarlyWorkerError);
		worker.addEventListener('error', failAll);

		// Once per worker, before any week: messages are handled in order, so both are in place in time
		worker.postMessage(refractionInit);
		worker.postMessage(weekInit);

		const dispatch = () => {
			if (nextTask < arrayOfFuncParams.length)
				worker.postMessage(arrayOfFuncParams[nextTask++]);
			else
				worker.terminate(); // queue drained, free the thread
		};

		worker.addEventListener('message', (/** @type {MessageEvent<any>} */ msg) => {
			if (msg.data.error)
				return failAll(new Error(`Week ${msg.data.week}: ${msg.data.error}`));

			weekResults[msg.data.week] = msg.data;
			addedZemanim[msg.data.week] = msg.data.addedZemanim;
			Object.assign(sunriseOffsets, msg.data.sunriseOffsets);

			if (++completed === arrayOfFuncParams.length)
				resolve();
			dispatch();
		});

		dispatch();
	}
});

// Results are already indexed by week, so no string-key sorting is needed
const lastWeek = arrayOfFuncParams.at(-1).week;

// ─── Month prefix pages ──────────────────────────────────────────────────────
// Each week that starts a Hebrew month gets an invisible marker (a comment, so it doesn't count as a
// page for CSS) right before its pages, and the month's prefix pages are moved there.
//
// The moon (Birkat Ha'Levana) month pages are prefix pages too, but MoonRender's own workers build them,
// and those can finish after the weekly ones; a page that wasn't in the document yet was never moved.
// So this waits for them, then places everything in one pass in document order, which keeps a month's
// moon page ahead of its static prefix pages (MoonRender puts them all before the Tishrei one).
//
// The same month can start twice in one print (a Gregorian year spans two Hebrew years; continueToNext
// covers two years):
//  - a page with data-monthYear (the moon pages) belongs to that year only, so it goes to that start
//  - a page without it (the static ones) goes to every start: a copy to the earlier ones, the original
//    to the last

/** @type {{ month: number, year: number, marker: Comment }[]} */
const prefixSlots = [];

for (const weekData of weekResults) {
	if (weekData.monthPrefix && weekData.week !== lastWeek) {
		const marker = document.createComment(` ${weekData.monthPrefixYear}-${weekData.monthPrefix} `);
		properPaging.before(marker);
		prefixSlots.push({ month: weekData.monthPrefix, year: weekData.monthPrefixYear, marker });
	}

	// One HTML parse per week instead of one per page
	properPaging.insertAdjacentHTML('beforebegin', weekData.htmlContent.join(''));
}

await mRender.monthPagesReady;

// A static list, so the copies inserted below are never picked up again
for (const page of document.querySelectorAll('[data-monthPrefix]')) {
	const month = Number(page.getAttribute('data-monthPrefix'));
	const year = page.hasAttribute('data-monthYear') ? Number(page.getAttribute('data-monthYear')) : null;
	const slots = prefixSlots.filter(slot => slot.month === month && (year === null || slot.year === year));
	if (!slots.length)
		continue; // its month doesn't start in this print: left where it is, as before

	slots.forEach((slot, index) => {
		let placed = page;
		if (index < slots.length - 1) {
			placed = /** @type {Element} */ (page.cloneNode(true));
			// ids must stay unique; the original keeps them
			placed.removeAttribute('id');
			placed.querySelectorAll('[id]').forEach(elem => elem.removeAttribute('id'));
		}
		slot.marker.before(placed); // after the month's pages already placed, so document order is kept
	});
}

if (footer)
	footer.remove();
else if (secondSide)
	secondSide.remove();
baseTable.remove();

insertBackZemanim();
await preparePrint();

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

	// Month names in the calendar the columns are actually in (Gregorian columns used to get Hebrew names)
	const monthNameLocale = (settings.language() == 'hb' ? 'he' : 'en') + '-u-ca-' + (cal == 'hebrew' ? 'hebrew' : 'gregory');

	// Get all unique zeman names
	const zemanNames = Object.keys(formattedBackZemanim);

	// For each zeman, create a table
	zemanNames.forEach(zemanName => {
		const dateMap = formattedBackZemanim[zemanName];

		if (!dateMap || dateMap.size === 0) return;

		// Group dates by month
		/** @type {Map<string, Map<number, any>>} */
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

		let insertAfterElement = [...document.querySelectorAll(`[data-zmanToCapture]`)]
			.find(elem => (elem instanceof HTMLElement) && elem.getAttribute('data-zmantocapture').startsWith(zemanName));

		const zemanTitle = zemanName
			.replace("get72Seasonal", "Full-Length Rabbenu Tam")
			.replace("getPlagHaminhaMaamarMordechi", "Pelag Ha'Minḥa - Ma'amar Mordekhi")
			.replace("testSunriseHBWorking", "Full Solar-Sphere Sunrise (H\"B)")

		// Create a table for each chunk
		monthChunks.forEach((monthChunk, chunkIndex) => {
			// Each month's name and length computed once, instead of a try/catch date build per cell
			const months = monthChunk.map(monthKey => {
				const [year, month] = monthKey.split('-').map(Number);
				const firstDay = Temporal.PlainDate.from({ year, month, day: 1, calendar: cal });
				return {
					name: firstDay.toLocaleString(monthNameLocale, { month: 'short' }),
					daysInMonth: firstDay.daysInMonth,
					values: monthData.get(monthKey)
				};
			});
			const maxDays = Math.max(...months.map(m => m.daysInMonth));

			const tableWrapper = document.createElement('div');
			tableWrapper.classList.add('zemanim-table-wrapper');

			// Table title (zeman name + page number if multiple pages)
			const title = document.createElement('div');
			title.classList.add('zemanim-table-title');
			title.textContent = monthChunks.length > 1
				? `${zemanTitle} (${chunkIndex + 1}/${monthChunks.length})`
				: zemanTitle;
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
			for (const { name } of months) {
				const th = document.createElement('th');
				th.textContent = name;
				headerRow.appendChild(th);
			}
			thead.appendChild(headerRow);
			table.appendChild(thead);

			// Body rows: as many days as the longest month in the chunk (30 Hebrew, 31 Gregorian)
			const tbody = document.createElement('tbody');

			for (let day = 1; day <= maxDays; day++) {
				const row = document.createElement('tr');

				// Day cell
				const dayCell = document.createElement('td');
				dayCell.classList.add('day-cell');
				dayCell.textContent = day.toString();
				row.appendChild(dayCell);

				// Data cells for each month in this chunk
				for (const { daysInMonth, values } of months) {
					const cell = document.createElement('td');

					if (day > daysInMonth) {
						// Day doesn't exist in this month (e.g. Feb 30)
						cell.classList.add('empty-cell');
					} else if (values && values.has(day)) {
						cell.innerHTML = values.get(day);
						cell.classList.add('data-cell');
					} else {
						cell.textContent = '—';
						cell.classList.add('no-data-cell');
					}

					row.appendChild(cell);
				}

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
	await sleep();

	const resizeElems = /** @type {HTMLElement[]} */ ([...document.getElementsByClassName('secondPageHeader')]
		.map(elem => [elem.firstElementChild, elem.lastElementChild])
		.flat())

	/**
	 * Shrinks every header until its text fits on one line. All elements are bisected together on a
	 * 0.5px grid, writing every size first and then reading every height, so each round costs one layout
	 * for the whole document (about 7 rounds) instead of one layout per element per 0.5px step.
	 */
	function fitHeaders() {
		for (const el of resizeElems)
			el.style.fontSize = '';  // Reset to CSS default

		const fitsOneLine = (/** @type {{ el: HTMLElement, lineHeight: number }} */ s) => s.el.scrollHeight <= s.lineHeight * 1.1;

		let pending = resizeElems
			.map(el => {
				const style = getComputedStyle(el);
				return { el, lineHeight: parseFloat(style.lineHeight), lo: 4, hi: parseFloat(style.fontSize), mid: 0 };
			})
			.filter(s => s.hi > s.lo && !fitsOneLine(s));

		while (pending.length) {
			for (const s of pending) // writes
				s.el.style.fontSize = (s.mid = Math.floor(s.lo + s.hi) / 2) + 'px';

			for (const s of pending) { // reads
				if (fitsOneLine(s)) s.lo = s.mid;
				else s.hi = s.mid;
			}

			pending = pending.filter(s => {
				const done = Math.floor(s.lo + s.hi) / 2 <= s.lo;
				if (done)
					s.el.style.fontSize = s.lo + 'px';
				return !done;
			});
		}
	}

	const parshaNames = document.getElementsByClassName('parshaName');

	if (parshaNames.length) {
		const fittyElems = [...parshaNames];

		// @ts-ignore
		window.fittyElem = fitty(fittyElems, { multiLine: true, minSize: 8 })
	}

	// Once layout has settled, again once fonts are in, and on resize (at most once per frame)
	requestAnimationFrame(() => requestAnimationFrame(fitHeaders));
	document.fonts.ready.then(fitHeaders);

	let resizeQueued = false;
	window.addEventListener('resize', () => {
		if (resizeQueued) return;
		resizeQueued = true;
		requestAnimationFrame(() => {
			resizeQueued = false;
			fitHeaders();
		});
	});

	// Visible-sunrise summary: the extremes of (visible - sea-level sunrise) over the printed range,
	// from the offsets the workers reported. Replaces the ChaiTables-based table and its QR code.
	const vsTable = document.querySelector('[data-zyFind="vsTable"]');
	const offsetEntries = Object.entries(sunriseOffsets)
		.filter(([date]) => {
			const plainDate = Temporal.PlainDate.from(date);
			return Temporal.PlainDate.compare(plainDate, baseDate) >= 0
				&& Temporal.PlainDate.compare(plainDate, endDate) <= 0;
		});

	if (vsTable && refraction.horizon && offsetEntries.length) {
		// "radius" now describes the area the server searched for the best vantage points
		const radiusElem = vsTable.querySelector('[data-zyReplace="sunriseRadius"]');
		const areaRadius = refraction.horizon.area?.radiusKm;
		if (radiusElem && areaRadius) {
			radiusElem.innerHTML = new Intl.NumberFormat(local, { style: "unit", unit: "kilometer", maximumFractionDigits: 1 })
				.format(areaRadius);
		} else if (radiusElem) {
			radiusElem.previousElementSibling?.remove();
			radiusElem.remove();
		}

		/** @type {{ earliest: { msDiff: number, date: string | null }, latest: { msDiff: number, date: string | null } }} */
		const diffs = {
			earliest: { msDiff: 0, date: null },
			latest: { msDiff: 0, date: null }
		};

		for (const [date, msDiff] of offsetEntries) {
			if (msDiff < 0 && (diffs.earliest.date === null || msDiff < diffs.earliest.msDiff))
				diffs.earliest = { msDiff, date };
			else if (msDiff > 0 && (diffs.latest.date === null || msDiff > diffs.latest.msDiff))
				diffs.latest = { msDiff, date };
		}

		for (const [which, slot] of /** @type {const} */ ([['earliestOffset', diffs.earliest], ['latestOffset', diffs.latest]])) {
			const cell = vsTable.querySelector(`[data-zyReplace="${which}"]`);
			if (!cell) continue;
			if (slot.date === null) {
				cell.innerHTML = "N/A";
			} else {
				const dur = Temporal.Duration.from({ milliseconds: Math.abs(slot.msDiff) }).round({ smallestUnit: "second" });
				cell.innerHTML = formatDuration(dur) + `<div style='font-size:.8em;'>(${slot.date})</div>`;
			}
		}
	} else if (vsTable) {
		vsTable.remove();
	}

	// The ChaiTables QR code has nothing to point to any more
	document.getElementById('qrCodeVisualSunrise')?.remove();

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

async function sleep() {
	return new Promise(requestAnimationFrame);
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