// @ts-check

/** Resolves on the next animation frame, after the browser has had a chance to lay out and paint. */
export const nextFrame = () => new Promise(requestAnimationFrame);

/**
 * Calls back at the start of the next day in a time zone (midnight, or the first moment of a day that skips it)
 * @param {string} timeZone
 * @param {(date: Temporal.PlainDate) => void} callback gets the new day
 * @returns {ReturnType<typeof setTimeout>}
 */
export function atNextDay(timeZone, callback) {
	const now = Temporal.Now.zonedDateTimeISO(timeZone);
	const next = now.toPlainDate().add({ days: 1 }).toZonedDateTime(timeZone);
	return setTimeout(() => callback(next.toPlainDate()), now.until(next).total('milliseconds'));
}

/**
 * The first day of the Gregorian calendar, 15 October 1582: the site's dates start there. Before it the
 * civil calendar was the Julian one, which Temporal (proleptic Gregorian) and the tekufot don't follow.
 */
export const EARLIEST_DATE = "1582-10-15";

/**
 * The date, or the earliest date the site shows if it's before that
 * @param {Temporal.PlainDate} date (in any calendar; returned in the same one)
 */
export function notBeforeEarliest(date) {
	const earliest = Temporal.PlainDate.from(EARLIEST_DATE);
	return Temporal.PlainDate.compare(date.withCalendar("iso8601"), earliest) < 0
		? earliest.withCalendar(date.calendarId)
		: date;
}

/**
 * The first whole year of a calendar the site can show (civil 1583, Hebrew 5344)
 * @param {'iso8601' | 'hebrew'} calendar
 */
export function earliestYear(calendar) {
	const first = Temporal.PlainDate.from(EARLIEST_DATE).withCalendar(calendar);
	return first.dayOfYear == 1 ? first.year : first.year + 1;
}

/**
 * Whether a string is JSON that can be parsed (null and empty strings aren't)
 * @param {string | null | undefined} str
 */
export function isValidJSON(str) {
	if (!str) return false;
	try {
		JSON.parse(str);
		return true;
	} catch {
		return false;
	}
}
