// @ts-check

import { GeoLocation, Temporal } from "../../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteCalendar from '../../WebsiteCalendar.js';
import { AmudehHoraahZmanim, OhrHachaimZmanim } from '../../ROYZmanim.js';
import preSettings from '../preSettings.js';

export default async function autoSchedule() {
	/** @type {[string, number, number, number, string]} */
	// @ts-ignore
	const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
	const geoL = new GeoLocation(...glArgs);

	const jCalShab = new WebsiteCalendar(Temporal.Now.plainDateISO(preSettings.location.timezone())).shabbat();
	jCalShab.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
		hourCycle: preSettings.timeFormat(),
		hour: 'numeric',
		minute: '2-digit'
	}];

	const zmanCalc =
		(preSettings.calendarToggle.hourCalculators() == "seasonal" || jCalShab.getInIsrael() ?
			new OhrHachaimZmanim(geoL, true) :
			new AmudehHoraahZmanim(geoL));
	zmanCalc.configSettings(preSettings.calendarToggle.rtKulah(), preSettings.customTimes.tzeithIssurMelakha());
	zmanCalc.coreZC.setCandleLightingOffset(preSettings.customTimes.candleLighting())
	zmanCalc.setDate(jCalShab.getDate());

	const friCL = zmanCalc.chainDate(jCalShab.getDate().subtract({ days: 1 })).getCandleLighting();

	const shirHashirim = friCL.subtract({ minutes: 20 });
	document.getElementById('shirHashirim').lastElementChild.innerHTML = shirHashirim.with({ minute: Math.floor(shirHashirim.minute / 5) * 5 }).toLocaleString(...dtF);
	document.getElementById('minchaErev').lastElementChild.innerHTML = friCL.with({ minute: Math.floor(friCL.minute / 5) * 5 }).toLocaleString(...dtF);

	let arvitMS = zmanCalc.getTzaitShabbath().subtract({ minutes: 5 });
	if (Math.trunc(arvitMS.with({ minute: Math.floor(arvitMS.minute / 5) * 5 }).until(arvitMS).total('minutes')) < 2)
		arvitMS = arvitMS.with({ minute: Math.floor(arvitMS.minute / 5) * 5 });
	document.getElementById('arvitMS').lastElementChild.innerHTML = arvitMS.toLocaleString(...dtF);
	document.getElementById('minchaS').lastElementChild.innerHTML = "3:50 PM";//arvitMS.with({ minute: Math.floor(arvitMS.minute / 10) * 10 }).subtract({ hours: 1 }).toLocaleString(...dtF);

	const flyerURLs = (await (await fetch('https://zemaneh-yosef.github.io/extras/ls.txt')).text())
		.split('\n')
		.filter(str => str.startsWith('./ish-matzliach-events/'))

	const carousel = document.getElementById('ishMatzliachSlide');
	carousel.firstElementChild.innerHTML = flyerURLs
		.map((url, index) =>
			`<div class="carousel-item ${index == 0 ? "active" : ''}"><img src="${url.replace('./', 'https://zemaneh-yosef.github.io/extras/')}" class="d-block w-100"></div>`)
		.join('');
}