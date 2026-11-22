// @ts-check

/**
 * What applies on a day, as data: the mourning period (Omer / Three Weeks), Tachanun, and which day's
 * prayer rules apply after nightfall. Shared by the calendar (pages/calendar.js) and the shul-wall sidebar;
 * each draws its own markup. No DOM or settings here.
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";

/**
 * @typedef {Object} MourningInfo
 * @property {'omer' | 'threeWeeks'} kind
 * @property {import('./WebsiteCalendar.js').default} today
 * @property {import('./WebsiteCalendar.js').default} tomorrow  (getOmerInfo() of today / tomorrow gives the count texts)
 * @property {boolean} lastOmerDay                         tomorrow is no longer in the Omer
 * @property {boolean} showOmerRules                       omer only: some custom is in effect
 * @property {'weekOf' | 'nineDays' | 'threeWeeks' | null} threeWeeksPhase  threeWeeks only
 * @property {ReturnType<import('./WebsiteCalendar.js').default['mourningHalachot']>} halachot
 */

/**
 * @param {import('./WebsiteCalendar.js').default} jCal
 * @returns {MourningInfo | null}  null when it is not a mourning period
 */
export function mourningInfo(jCal) {
	if (!jCal.isMourningPeriod())
		return null;

	const halachot = jCal.mourningHalachot();
	const tomorrow = jCal.tomorrow();
	if (jCal.getDayOfOmer() !== -1) {
		return {
			kind: 'omer', today: jCal, tomorrow, halachot,
			lastOmerDay: tomorrow.getDayOfOmer() == -1,
			showOmerRules: !Object.values(halachot).every(value => value == false),
			threeWeeksPhase: null
		};
	}

	return {
		kind: 'threeWeeks', today: jCal, tomorrow, halachot,
		lastOmerDay: false,
		showOmerRules: false,
		threeWeeksPhase: jCal.isShvuaShechalBo() ? 'weekOf'
			: jCal.getJewishMonth() == KosherZmanim.JewishCalendar.AV ? 'nineDays' : 'threeWeeks'
	};
}

/**
 * Which Tachanun text applies (the number tefilahRules().tachanun, moved up on Shabbat), or null when there is
 * no Tachanun line at all (a yom tov on which work is forbidden).
 * @param {import('./WebsiteCalendar.js').default} jCal
 * @returns {number | null}
 */
export function tachanunChoice(jCal) {
	if (jCal.isYomTovAssurBemelacha())
		return null;

	let id = jCal.tefilahRules().tachanun;
	if (jCal.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY)
		id = Math.min(id + 3, 4);
	return id;
}

/**
 * The day whose seasonal prayer rules (mashiv haruach, veten tal umatar...) apply right now: after tzet on
 * the real current day it is already tomorrow's; on any other displayed day, that day's.
 * @param {import('./WebsiteCalendar.js').default} jCal
 * @param {import('./ROYZmanim.js').ZemanFunctions} zmanCalc  for jCal's day
 * @param {string} timeZone
 * @returns {import('./WebsiteCalendar.js').default}
 */
export function calendarForRules(jCal, zmanCalc, timeZone) {
	if (jCal.getDate().equals(Temporal.Now.plainDateISO(timeZone))
		&& Temporal.ZonedDateTime.compare(zmanCalc.getTzet(), Temporal.Now.zonedDateTimeISO(timeZone)) < 1) {
		return jCal.tomorrow();
	}
	return jCal;
}
