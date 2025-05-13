// @ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteCalendar from '../WebsiteCalendar.js';
import { zDTFromFunc, ZemanFunctions } from '../ROYZmanim.js';
import preSettings from './preSettings.js';

export default async function autoSchedule() {
	/** @type {[string, number, number, number, string]} */
	// @ts-ignore
	const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
	const geoL = new GeoLocation(...glArgs);

	const jCalShab = new WebsiteCalendar(Temporal.Now.plainDateISO(preSettings.location.timezone())).shabbat();
	jCalShab.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))
	const jCalWeekday = jCalShab.clone();
	jCalWeekday.setDate(jCalShab.getDate().subtract({ days: 6 }))

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
		hourCycle: preSettings.timeFormat(),
		hour: 'numeric',
		minute: '2-digit'
	}];

	const zmanCalc = new ZemanFunctions(geoL, {
		elevation: jCalWeekday.getInIsrael(),
		rtKulah: preSettings.calendarToggle.rtKulah(),
		candleLighting: preSettings.customTimes.candleLighting(),
		fixedMil: preSettings.calendarToggle.forceSunSeasonal() || jCalWeekday.getInIsrael(),
		melakha: preSettings.customTimes.tzeithIssurMelakha()
	})

	for (const autoSchedule of document.querySelectorAll('[data-autoschedule-type]')) {
		const jCal = autoSchedule.getAttribute('data-autoschedule-type') == 'sh' ? jCalShab : jCalWeekday;
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