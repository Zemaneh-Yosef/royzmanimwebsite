// @ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js"
import { zDTFromFunc, ZemanFunctions } from "../ROYZmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { HebrewNumberFormatter } from "../WebsiteCalendar.js";

const jCal = new WebsiteLimudCalendar(KosherZmanim.Temporal.Now.plainDateISO());
jCal.setInIsrael(false);

if (new URLSearchParams(window.location.search).has('sefiraDay')) {
	jCal.setJewishDate(jCal.getJewishYear(), KosherZmanim.JewishCalendar.NISSAN, 14);
	jCal.setDate(jCal.getDate().add({ days: parseInt(new URLSearchParams(window.location.search).get('sefiraDay')) }));
}

for (const dateRender of document.querySelectorAll("[data-zfDateRender]")) {
	const lang = dateRender.getAttribute('data-zfDateRender');
	dateRender.innerHTML += (lang !== "hb" ? jCal.getDayOfTheWeek()[lang] + ", " : "") + jCal.dateRenderer(lang).primary.text
}

const omerjCal = jCal.tomorrow();
//document.getElementById("omerCount").appendChild(document.createTextNode(omerjCal.getDayOfOmer().toString().padStart(2, "0")));

for (const omerElem of document.querySelectorAll("[data-omer-count]")) {
	/** @type {'en'|'hb'|'fr'} */
	// @ts-ignore
	const lang = omerElem.getAttribute('data-omer-count');

	omerElem.querySelector('[data-zfReplace="completeCount"]').innerHTML =
		omerjCal.getOmerInfo().title[lang].mainCount

	const indCount = omerElem.querySelector('[data-zfReplace="indCount"]');
	if (omerjCal.getDayOfOmer() >= 7) {
		indCount.parentElement.style.removeProperty("display");
		indCount.innerHTML = omerjCal.getOmerInfo().title[lang].subCount.toString()
			.replace(" • ", " & ");
	} else {
		indCount.parentElement.style.display = 'none';
	}
}

if (document.querySelector('[data-omer-day]')) {
	document.querySelector('[data-omer-day]').innerHTML = (new HebrewNumberFormatter()).formatHebrewNumber(omerjCal.getDayOfOmer());
}

const fallbackGL = new KosherZmanim.GeoLocation("null", 0,0,0, "UTC");
const ohrHachaimCal = new ZemanFunctions(fallbackGL, { elevation: true, melakha: {minutes: 30, degree: 7.165}, rtKulah: false, fixedMil: true, candleLighting: 20 });
ohrHachaimCal.setDate(jCal.getDate())
const amudehHoraahCal = new ZemanFunctions(fallbackGL, { elevation: false, melakha: {minutes: 30, degree: 7.165}, rtKulah: true, fixedMil: false, candleLighting: 20 });
amudehHoraahCal.setDate(jCal.getDate());

if ((jCal.getDate().dayOfWeek == 6 || jCal.isAssurBemelacha()) && !window.location.href.includes("forceShabbat")) {
	document.getElementById("gridElement").remove();
	document.getElementById("earliestTimeAlert").remove();
} else {
	if (jCal.getDate().dayOfWeek == 6 || jCal.isAssurBemelacha()) {
		document.getElementById("earliestTimeAlert").innerHTML = "Proper time of night"
	}
	if (jCal.hasCandleLighting()) {
		[document.getElementById("menorah"), document.getElementById('wallText')]
			.forEach(imgToReplace => imgToReplace.setAttribute("src", imgToReplace.getAttribute("src").replace("digital", "print")));
	}
	const elems = document.getElementsByClassName('timecalc');
	for (const elem of elems) {
		const currentCalc = (elem.getAttribute('data-timezone') == 'Asia/Jerusalem' ? ohrHachaimCal : amudehHoraahCal);
		const elevation = (elem.hasAttribute('data-elevation') ? parseInt(elem.getAttribute('data-elevation')) : 0);

		const geoLocationsParams = [
			"null",
			parseFloat(elem.getAttribute("data-lat")),
			parseFloat(elem.getAttribute('data-lng')),
			elevation,
			elem.getAttribute('data-timezone')
		]
		// @ts-ignore
		currentCalc.setGeoLocation(new KosherZmanim.GeoLocation(...geoLocationsParams));

		/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
		const dtF = ['en', {
			// @ts-ignore
			hourCycle: elem.getAttribute("data-format"),
			hour: 'numeric',
			minute: '2-digit'
		}];

		const times = ((jCal.getDate().dayOfWeek == 6 || jCal.isAssurBemelacha()) ? [zDTFromFunc(currentCalc.getTzetMelakha())] : [elem.hasAttribute('data-shkiya') ? currentCalc.getShkiya() : currentCalc.getTzet()])
			.map(time => time.add({ minutes: (!elem.hasAttribute('data-humra') ? 0 : parseInt(elem.getAttribute('data-humra')) )}));

		const timeElem = elem.lastElementChild;
		timeElem.innerHTML =
			times[0].toLocaleString(...dtF)
			+ (jCal.getDate().dayOfWeek == 6 ? `<br><span style="font-size: .5em;">(R"T: ${times[1].toLocaleString(...dtF)})</span>` : "");
	}
}