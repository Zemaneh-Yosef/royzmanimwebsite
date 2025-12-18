// @ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteCalendar from '../WebsiteCalendar.js';
import { zDTFromFunc, ZemanFunctions } from '../ROYZmanim.js';
import preSettings from './preSettings.js';

export default async function autoSchedule() {
	/** @type {[string, number, number, number, string]} */
	// @ts-ignore
	const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
	const geoL = new GeoLocation(...glArgs);

	/** @type {{shabbat: WebsiteCalendar; yomChol: WebsiteCalendar; erevShabbat: WebsiteCalendar; nextWeek: WebsiteCalendar}} */
	// @ts-ignore
	const jCalDates = {
		shabbat: new WebsiteCalendar(Temporal.Now.plainDateISO(preSettings.location.timezone())).shabbat()
	}
	jCalDates.shabbat.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))

	jCalDates.yomChol = jCalDates.shabbat.clone();
	jCalDates.yomChol.setDate(jCalDates.shabbat.getDate().subtract({ days: 6 }))

	jCalDates.erevShabbat = jCalDates.shabbat.clone();
	jCalDates.erevShabbat.setDate(jCalDates.shabbat.getDate().subtract({ days: 1 }))

	jCalDates.nextWeek = jCalDates.shabbat.clone();
	jCalDates.nextWeek.setDate(jCalDates.shabbat.getDate().add({ days: 1 }));

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
		hourCycle: preSettings.timeFormat(),
		hour: 'numeric',
		minute: '2-digit'
	}];

	const zmanCalc = new ZemanFunctions(geoL, {
		elevation: jCalDates.shabbat.getInIsrael(),
		rtKulah: preSettings.calendarToggle.rtKulah(),
		candleLighting: preSettings.customTimes.candleLighting(),
		fixedMil: preSettings.calendarToggle.forceSunSeasonal() || jCalDates.shabbat.getInIsrael(),
		melakha: preSettings.customTimes.tzeithIssurMelakha()
	})

	const mapJCalTypeToDate = {
		'sh': jCalDates.shabbat,
		'we': jCalDates.yomChol,
		'eSh': jCalDates.erevShabbat,
		'nWe': jCalDates.nextWeek
	}
	for (const autoSchedule of document.querySelectorAll('[data-autoschedule-type]')) {
		/** @type {WebsiteCalendar} */
		// @ts-ignore
		const jCal = mapJCalTypeToDate[autoSchedule.getAttribute('data-autoschedule-type')];
		zmanCalc.setDate(jCal.getDate());

		// @ts-ignore
		let autoScheduleTime = zDTFromFunc(zmanCalc[autoSchedule.getAttribute('data-autoschedule-function')]())
			[(autoSchedule.getAttribute('data-autoschedule-plusorminus') == '+' ? 'add' : 'subtract')]({
				hours: parseInt(autoSchedule.getAttribute('data-autoschedule-hours')),
				minutes: parseInt(autoSchedule.getAttribute('data-autoschedule-minutes'))
			})

		if (autoSchedule.getAttribute('data-autoschedule-round') !== 'e') {
			const roundTime = parseInt(autoSchedule.getAttribute('data-autoschedule-round').split('r')[1]);
			autoScheduleTime = autoScheduleTime.with({ minute: Math.floor(autoScheduleTime.minute / roundTime) * roundTime });
		}

		autoSchedule.innerHTML = autoScheduleTime.toLocaleString(...dtF);
	}
}