// @ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import WebsiteCalendar from '../WebsiteCalendar.js';
import { AmudehHoraahZmanim, OhrHachaimZmanim } from '../ROYZmanim.js';
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

	const zmanCalc = (preSettings.calendarToggle.hourCalculators() == "seasonal" || jCalShab.getInIsrael() ?
			new OhrHachaimZmanim(geoL, true) :
			new AmudehHoraahZmanim(geoL));
	zmanCalc.configSettings(preSettings.calendarToggle.rtKulah(), preSettings.customTimes.tzeithIssurMelakha());
	zmanCalc.coreZC.setCandleLightingOffset(preSettings.customTimes.candleLighting())
	zmanCalc.setDate(jCalShab.getDate());

	for (const autoSchedule of document.querySelectorAll('[data-autoschedule-type]')) {
        const jCal = autoSchedule.getAttribute('data-autoschedule-type') == 'sh' ? jCalShab : jCalWeekday;
        zmanCalc.setDate(jCal.getDate());

        const autoScheduleShita = autoSchedule.getAttribute('data-autoschedule-function');
        // @ts-ignore
        const autoScheduleTime = zmanCalc[autoScheduleShita]()
            [(autoSchedule.getAttribute('data-autoschedule-plusorminus') == '+' ? 'add' : 'subtract')]({
                hours: parseInt(autoSchedule.getAttribute('data-autoschedule-hours')),
                minutes: parseInt(autoSchedule.getAttribute('data-autoschedule-minutes'))
            })
        const autoScheduleTimeRounded = autoScheduleTime.with({ minute: Math.floor(autoScheduleTime.minute / 5) * 5 });

        autoSchedule.innerHTML = autoScheduleTimeRounded.toLocaleString(...dtF);
    }
}