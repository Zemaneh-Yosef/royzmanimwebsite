// @ts-check

/**
 * Which fast day the fast box is about (today's, or tomorrow's when today is not one) and its start and end times.
 * Shared by the calendar (pages/calendar.js) and the shul-wall sidebar; each draws its own markup.
 * No DOM or settings here: the caller passes the calendar day and the zmanim calculator.
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { zDTFromFunc } from "./ROYZmanim.js";

/**
 * @typedef {Object} FastDayInfo
 * @property {boolean} isToday        the fast is today (else tomorrow's)
 * @property {import('./WebsiteCalendar.js').default} fastJCal  the day of the fast
 * @property {number} nameIndex       what the fast's heading is looked up by: 0 for Taanis Bechoros, else the yom tov index
 * @property {boolean} multiDay       Tisha Be'Av / Yom Kippur: starts the evening before
 * @property {Temporal.ZonedDateTime | null} startErev  multiDay only: the evening before (candle lighting on Yom Kippur, shkiya on Tisha Be'Av)
 * @property {Temporal.ZonedDateTime | null} startDay   one-day fasts only: alot hashachar
 * @property {Temporal.ZonedDateTime} end  Yom Kippur: tzet melakha; any other fast: tzet humra
 */

/**
 * @param {import('./WebsiteCalendar.js').default} jCal
 * @param {import('./ROYZmanim.js').ZemanFunctions} zmanCalc  for jCal's day
 * @returns {FastDayInfo | null}  null when neither today nor tomorrow is a fast
 */
export function fastDayInfo(jCal, zmanCalc) {
	const isToday = jCal.isTaanis() || jCal.isTaanisBechoros();
	if (!isToday && !jCal.tomorrow().isTaanis() && !jCal.tomorrow().isTaanisBechoros())
		return null;

	const fastJCal = isToday ? jCal : jCal.tomorrow();
	const fastCalc = zmanCalc.chainDate(fastJCal.getDate());
	const index = fastJCal.getYomTovIndex();
	const multiDay = [KosherZmanim.JewishCalendar.TISHA_BEAV, KosherZmanim.JewishCalendar.YOM_KIPPUR].includes(index);

	/** @type {Temporal.ZonedDateTime | null} */
	let startErev = null;
	/** @type {Temporal.ZonedDateTime | null} */
	let startDay = null;
	/** @type {Temporal.ZonedDateTime} */
	let end;

	if (multiDay) {
		const erevCalc = zmanCalc.chainDate(fastJCal.getDate().subtract({ days: 1 }));
		startErev = index == KosherZmanim.JewishCalendar.YOM_KIPPUR ? erevCalc.getCandleLighting() : erevCalc.getShkiya();
		end = fastJCal.isYomKippur() ? zDTFromFunc(fastCalc.getTzetMelakha()) : fastCalc.getTzetHumra();
	} else {
		startDay = fastCalc.getAlotHashahar();
		end = fastCalc.getTzetHumra();
	}

	return {
		isToday, fastJCal,
		nameIndex: fastJCal.isTaanisBechoros() ? 0 : index,
		multiDay, startErev, startDay, end
	};
}
