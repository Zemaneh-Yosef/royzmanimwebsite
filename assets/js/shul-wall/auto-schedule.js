// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteCalendar from '../WebsiteCalendar.js';
import { zDTFromFunc } from '../ROYZmanim.js';
import { jCal, zmanCalc, dtF } from "./base.js";

/**
 * @param {NodeListOf<HTMLElement>} nodes
 */
export default async function autoSchedule(nodes) {
	/** @type {{shabbat: WebsiteCalendar; yomChol: WebsiteCalendar; erevShabbat: WebsiteCalendar; nextWeek: WebsiteCalendar}} */
	// @ts-ignore
	const jCalDates = {
		shabbat: jCal.shabbat()
	}
	jCalDates.yomChol = jCalDates.shabbat.clone();
	jCalDates.yomChol.setDate(jCalDates.shabbat.getDate().subtract({ days: 6 }))

	jCalDates.erevShabbat = jCalDates.shabbat.clone();
	jCalDates.erevShabbat.setDate(jCalDates.shabbat.getDate().subtract({ days: 1 }))

	jCalDates.nextWeek = jCalDates.shabbat.clone();
	jCalDates.nextWeek.setDate(jCalDates.shabbat.getDate().add({ days: 1 }));

	const mapJCalTypeToDate = {
		'sh': jCalDates.shabbat,
		'we': jCalDates.yomChol,
		'eSh': jCalDates.erevShabbat,
		'nWe': jCalDates.nextWeek
	}
	for (const el of nodes) {
		const type = el.dataset.autoscheduleType;
		const method = el.dataset.autoscheduleFunction;
		const sign = el.dataset.autoschedulePlusorminus;
		const hours = parseInt(el.dataset.autoscheduleHours);
		const minutes = parseInt(el.dataset.autoscheduleMinutes);

		/** @type {WebsiteCalendar} */
		// @ts-ignore
		const jCal = mapJCalTypeToDate[type];
		zmanCalc.setDate(jCal.getDate());

		// @ts-ignore
		let autoScheduleTime = zDTFromFunc(zmanCalc[method]())
			[(sign == '+' ? 'add' : 'subtract')]({
				hours,
				minutes
			})

		if (el.dataset.autoscheduleRoundinterval) {
			autoScheduleTime = roundDateTime(autoScheduleTime, parseInt(el.dataset.autoscheduleRoundinterval), el.dataset.autoscheduleRoundmode);
		}

		el.innerHTML = autoScheduleTime.toLocaleString(...dtF);
	}
}

/**
 * @param {Temporal.ZonedDateTime} dt
 * @param {number} interval
 * @param {string} mode
 */
function roundDateTime(dt, interval, mode) {
    const minute = dt.minute;
    const ratio = minute / interval;

    let rounded;

    switch (mode) {
        case "rl": // round later (up)
            rounded = Math.ceil(ratio) * interval;
            break;

        case "rc": // round closer
		case "rn": // round nearest
            rounded = Math.round(ratio) * interval;
            break;

        case "re":
        default: // round earlier (down)
            rounded = Math.floor(ratio) * interval;
            break;
    }

    // --- FIX: handle hour rollover safely ---
    // Convert to total minutes since start of hour
    const totalMinutes = dt.hour * 60 + rounded;

    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;

    // Temporal.with() cannot set hour > 23, so we use add()
    const hourDelta = newHour - dt.hour;

    return dt.add({ hours: hourDelta }).with({ minute: newMinute });
}
