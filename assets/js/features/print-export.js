//@ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { settings } from "../settings/handler.js";
import { Previewer } from "../../libraries/paged.js"

const printParam = new URLSearchParams(window.location.search);
if (printParam.has('lessContrast')) {
	document.documentElement.style.setProperty('--bs-body-bg', 'snow');
	document.documentElement.style.setProperty('--bs-body-color', '#1A0033');
}
const calcMonthStart = (printParam.has('currentMonth') ?
	Temporal.Now.plainDateISO().withCalendar(settings.language() == 'en' ? 'iso8601' : 'hebrew').month
	: 1
);

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new GeoLocation(...glArgs);
const useOhrHachaim = (geoLocation.getLocationName() || "").toLowerCase().includes('israel') || settings.calendarToggle.hourCalculators() == "seasonal"

const listAllShitot = Array.from(document.querySelectorAll('[data-zyData]')).map(elem => elem.getAttribute('data-zyData'))
/** @type {HTMLElement} */
// @ts-ignore
const baseTable = document.getElementsByClassName('tableGrid')[0];
baseTable.style.gridTemplateColumns = Array.from(document.getElementsByClassName('tableHeader'))
	.filter(elem => !elem.hasAttribute('data-zyHeaderContainer'))
	.map((/** @type {HTMLElement} */elem) => {
		if (elem.hasAttribute('data-wide-column'))
			return '1.25fr';

		if (printParam.has('shabbatOnly')) {
			if (['date', 'candleLightingRT'].includes(elem.getAttribute('data-zyData')))
				return '1fr';

			return (elem.style.gridRow == '1 / span 2' ? '.8fr' : '.6fr');
		} else {
			return (elem.style.gridRow == '1 / span 2' ? '1fr' : '.75fr');
		}
	})
	.join(" ");

/** @type {number[]} */
let availableVS = [];
if (typeof localStorage !== "undefined" && localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
	const ctNetz = JSON.parse(localStorage.getItem('ctNetz'))
	if (ctNetz.lat == geoLocation.getLatitude()
	 && ctNetz.lng == geoLocation.getLongitude())
		availableVS = ctNetz.times
}

const footer = document.getElementsByClassName("zyCalFooter")[0];
footer.querySelector("[data-geoCoordinates]")
	.appendChild(document.createTextNode(`(${geoLocation.getLatitude()}, ${geoLocation.getLongitude()}${
		useOhrHachaim ? ", ↑" + geoLocation.getElevation : ""
	})`));
footer.querySelector("[data-calendar]")
	.appendChild(document.createTextNode(
		(useOhrHachaim ? {
			"en": "Ohr Hachaim",
			"en-et": "Ohr Hachaim",
			"hb": "אור החיים"
		}[settings.language()] : {
			"en": "Amudeh Hora'ah",
			"en-et": "Amudeh Hora'ah",
			"hb": "עמודי הוראה"
		}[settings.language()])))
footer.querySelector("[data-timeZone]")
	.appendChild(document.createTextNode(geoLocation.getTimeZone()))

const today = Temporal.Now.plainDateISO()
footer.getElementsByClassName("genDate")[0]
	.appendChild(document.createTextNode([today.year, today.month, today.day].map(num=>num.toString().padStart(2, '0')).join("/")))

let plainDateForLoop = Temporal.Now.plainDateISO()
	.with({ month: calcMonthStart, day: 1 })
	.withCalendar(settings.language() == 'en' ? 'iso8601' : 'hebrew')
	.with({ month: calcMonthStart, day: 1 })

for (const locName of document.querySelectorAll("[data-zyLocationText]"))
	locName.appendChild(document.createTextNode(geoLocation.getLocationName() + ` (${plainDateForLoop.year})`))

let expectedReceive = 0;
let actualReceive = 0;
let receiveData = {}
/** @type {import('./print-web-worker.js').singlePageParams[]} */
const arrayOfFuncParams = [];
for (let mIndex = plainDateForLoop.month; mIndex <= plainDateForLoop.monthsInYear; (printParam.has('shabbatOnly') ? mIndex += 2 : mIndex++)) {
	expectedReceive += 1;
	arrayOfFuncParams.push({
		israel: (geoLocation.getLocationName() || "").toLowerCase().includes('israel'),
		geoCoordinates: glArgs,
		netz: availableVS,
		htmlElems: baseTable.outerHTML + footer.outerHTML,
		calendar: settings.language() == 'en' ? 'iso8601' : 'hebrew',
		hourCalculator: settings.calendarToggle.hourCalculators(),
		date: plainDateForLoop.with({ month: mIndex }).toString(),
		rtKulah: settings.calendarToggle.rtKulah(),
		tzetMelakha: settings.customTimes.tzeithIssurMelakha(),
		timeFormat: settings.timeFormat(),
		lang: settings.language(),
		allShitot: listAllShitot,
		month: mIndex,
		candleTime: settings.customTimes.candleLighting(),
		shabbatOnly: printParam.has('shabbatOnly')
	})
}

for (const monthData of arrayOfFuncParams) {
	const webWorker = new Worker('/assets/js/features/print-web-worker.js', { type: 'module' });
	webWorker.postMessage(monthData)
	webWorker.addEventListener("message", async (msg) => {
		actualReceive += 1;
		// @ts-ignore
		receiveData[msg.data.month] = msg.data.data
		if (actualReceive == expectedReceive) {
			const sortedObject = Object.keys(receiveData)
				.sort()
				.reduce((acc, key) => {
					// @ts-ignore
					acc[key] = receiveData[key];
					return acc;
				}, {});

			for (const htmlData of Object.values(sortedObject)) {
				baseTable.parentElement.insertAdjacentHTML('beforeend', htmlData.monthHTML);
				baseTable.parentElement.insertAdjacentHTML('beforeend', htmlData.footerHTML);
			}

			footer.remove();
			baseTable.remove();

			document.documentElement.setAttribute('forceLight', '')
			document.documentElement.removeAttribute('data-bs-theme');

			await preparePrint();
		}
	})
}

async function preparePrint() {
	/** @type {HTMLElement} */
	const finalExplanation = document.querySelector('[data-printFind]');

	Array.from(document.getElementById('explanationCont').children)
		.filter(langElem => !langElem.classList.contains(`lang-${settings.language().replace('en-et', 'et')}`))
		.forEach(otherLang => otherLang.remove())

	while (document.getElementById('explanationCont').firstElementChild.childElementCount > 0) {
		document.getElementById('explanationCont').appendChild(document.getElementById('explanationCont').firstElementChild.firstElementChild)
	}

	document.getElementById('explanationCont').firstElementChild.remove()

	await sleep();

	let paged = new Previewer();
	let flow = await paged.preview(finalExplanation, ["/assets/css/footnotes.css"], finalExplanation.parentElement);
	console.log("Rendered", flow.total, "pages.");

	finalExplanation.style.display = "none";

	await sleep();

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
		.map(className => Array.from(document.getElementsByClassName(className)))
		.flat()
		.forEach(elem => elem.remove());

	for (const pageBox of document.getElementsByClassName('pagedjs_pagebox'))
		['top', 'right', 'left', 'bottom']
			// @ts-ignore
			.forEach(dir => pageBox.style.setProperty(`--pagedjs-margin-${dir}`, '0'));

	Array.from(document.getElementsByClassName('pagedjs_page_content'))
		.forEach((/** @type {HTMLElement} */pageContent) => {
			pageContent.style.columnWidth = 'unset';
			pageContent.style.height = 'unset';
			pageContent.style.flex = '1 1';

			[...pageContent.children]
				.filter(child => child.nodeName == "DIV")
				.forEach((/** @type {HTMLDivElement} */pageContentChild) => pageContentChild.style.height = 'unset')

			if (pageContent.nextElementSibling && pageContent.nextElementSibling.classList.contains('pagedjs_footnote_area'))
				// @ts-ignore
				pageContent.nextElementSibling.style.height = 'unset'
		})

	/* Array.from(document.getElementsByClassName('pagedjs_page'))
		.forEach((/** @type {HTMLDivElement} * / page) => {
			page.style.setProperty('--pagedjs-pagebox-width', '100%');
			page.style.setProperty('--pagedjs-width-' + (page.classList.contains('pagedjs_right_page') ? 'right' : 'left'), '100%')
		}) */

	await sleep();
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