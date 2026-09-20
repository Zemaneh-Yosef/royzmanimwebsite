// @ts-check
import { createMoonCalc, AstronomyImp } from '../../../libraries/mooncalc/moonRiseSetCalc.js';
import * as KosherZmanim from '../../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteCalendar from '../../WebsiteCalendar.js';


/**
 * @param {ReturnType<typeof createMoonCalc>} calc
 * @param {AstronomyImp.Observer} observer
 * @param {Temporal.TimeZoneLike} tz
 * @param {Temporal.PlainDate} gDate
 */
function computeRowMoonTimes(calc, observer, tz, gDate) {
	const midnightMs = gDate.toZonedDateTime({ timeZone: tz, plainTime: "00:00" }).epochMilliseconds;

	// Rise: next moonrise within this specific civil day (same "does not occur" semantics as moon.html).
	const riseTime = calc.nextMoonRise(new Date(midnightMs), observer, { mode: 'lit', limitDays: 1 });
	if (!riseTime)
		return { rise: null, set: null };

	// Set: the moonset that completes THIS rise's arc — searched forward from the rise itself,
	// not re-anchored to a civil-day midnight. This is what was missing before.
	const setTime = calc.nextMoonSet(riseTime, observer, { mode: 'lit', limitDays: 2 });

	const toEvent = (/** @type {AstronomyImp.AstroTime} */ astroTime) => astroTime
		? { zdt: astroTime.date.getTime() }
		: null;

	return { rise: toEvent(riseTime), set: toEvent(setTime) };
}

/**
 * @param {{geoCoordinates: [string, number, number, number, string]; months: {year: number; month: number}[]}} x
 */
function messageHandler(x) {
	const geoLocation = new KosherZmanim.GeoLocation(...x.geoCoordinates);
	const tz = geoLocation.getTimeZone();
	const baseCal = new WebsiteCalendar();
	const observer = new AstronomyImp.Observer(geoLocation.getLatitude(), geoLocation.getLongitude(), geoLocation.getElevation());
	const calc = createMoonCalc();

	return x.months.map(({ year, month }) => {
		const monthCal = baseCal.chainJewishDate(year, month, 15);
		const rangeStart = monthCal.getTchilasZmanKidushLevana7Days().withTimeZone(tz).toPlainDate();
		const rangeEnd = monthCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(tz).toPlainDate();
		const dayCount = rangeStart.until(rangeEnd).days + 1;

		const rows = [];
		for (let i = 0; i < dayCount; i++) {
			const gDate = rangeStart.add({ days: i });
			const dayCal = baseCal.chainDate(gDate);
			const { rise, set } = computeRowMoonTimes(calc, observer, tz, gDate);
			rows.push({ jewishDay: dayCal.getJewishDayOfMonth(), rise, set });
		}

		return { year, month, titleHe: monthCal.formatJewishMonth().he, titleEn: monthCal.formatJewishMonth().en, rows };
	});
}

addEventListener('message', async (message) => {
	try {
		if (!('Temporal' in globalThis)) {
			const { Temporal } = await import('https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.2/+esm');
			globalThis.Temporal = Temporal;
		}
		postMessage(messageHandler(message.data));
	} catch (err) {
		console.error('moon-birkat-worker failed:', err);
		throw err;
	}
});