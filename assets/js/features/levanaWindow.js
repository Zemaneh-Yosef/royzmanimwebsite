// @ts-check

/**
 * The Birkat Halevana window and labels shared by the calendar card (levanaWeb.js) and the ICS export
 * (icsPrepare.js). No DOM or settings here, so the export workers can import it.
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";

/** @typedef {'hb'|'en'|'en-et'} Lang */

export const EN = {
	title: (/** @type {string} */ m) => `Blessing of the Moon - Month of ${m}`,
	ends: 'End', strict: 'Strict', rema: 'Rema',
	earlyEnd: (/** @type {boolean} */ shabbat) => `Early End (${shabbat ? 'Shabbat' : 'Yom Tov'})`, molad: 'Molad',
	wait: 'Recommended to wait until', nightRange: 'Nightfall – dawn',
	lastNight: 'Last night', twilight: 'Twilight only',
	from: 'Visible from', until: 'Visible until', upTo: 'until', all: 'Visible all night', rises: 'Rises', sets: 'Sets',
	failed: 'The moon times could not be calculated.',
	twilightNote: 'Twilight only: the moon is up only between sunset and nightfall, or between dawn and sunrise.'
};

/** @type {Record<Lang, typeof EN>} */
export const TEXT = {
	en: EN,
	'en-et': {
		...EN,
		title: m => `Birkath Ha'Levana - Ḥodesh ${m}`,
		earlyEnd: shabbat => `Early End (${shabbat ? 'Shabbat' : 'Yom Tov'})`,
		nightRange: 'Tzet – Alot',
		twilightNote: 'Twilight only: the moon is up only between Sheqi\'a and Tzet, or between Alot and Hanetz.'
	},
	hb: {
		title: m => `ברכת הלבנה - חודש ${m}`,
		ends: 'סוף', strict: 'סוף לחומרא', rema: 'סוף לרמ״א',
		earlyEnd: shabbat => `סוף מוקדם (מפני ${shabbat ? 'שבת' : 'יום טוב'})`, molad: 'מולד',
		wait: 'מומלץ להמתין עד', nightRange: 'צאת הכוכבים – עלות השחר',
		lastNight: 'לילה אחרון', twilight: 'בין השמשות בלבד',
		from: 'נראית משעה', until: 'נראית עד', upTo: 'עד', all: 'נראית כל הלילה', rises: 'זורחת', sets: 'שוקעת',
		failed: 'לא ניתן לחשב את זמני הלבנה.',
		twilightNote: 'בין השמשות בלבד: הלבנה נראית רק בין השקיעה לצאת הכוכבים, או בין עלות השחר להנץ.'
	}
};

/**
 * @typedef {Object} LevanaWindow
 * @property {number} year
 * @property {number} month
 * @property {{ en: string, he: string }} monthNames
 * @property {Temporal.ZonedDateTime} molad
 * @property {Temporal.ZonedDateTime} start          7 days after the molad
 * @property {Temporal.ZonedDateTime | null} recommendedStart  after Tisha Be'Av / Yom Kippur
 * @property {Temporal.ZonedDateTime} endIkar        alot of the 15th
 * @property {Temporal.ZonedDateTime} endStretch     sunrise of the 15th
 * @property {Temporal.ZonedDateTime} endStrict      half-way between moladot
 * @property {Temporal.ZonedDateTime} endEarlyIkar   alot of the 14th (15th is Shabbat / Yom Tov)
 * @property {Temporal.ZonedDateTime} endEarlyStretch
 * @property {boolean} useEarlyTimes                 the 15th is Shabbat / Yom Tov
 * @property {number} effectiveEndMs                 the end people go by (lechatchila)
 * @property {number} validFromMs                    7 days after the molad, or the Av / Tishrei recommendation
 * @property {boolean} fifteenthIsShabbat            why the early end applies (else Yom Tov)
 */

/**
 * The Birkat Halevana window of jCal's Hebrew month.
 * @param {import('../WebsiteCalendar.js').default} jCal
 * @param {import('../ROYZmanim.js').ZemanFunctions} zmanCalc
 * @returns {LevanaWindow}
 */
export function levanaWindow(jCal, zmanCalc) {
	const tz = zmanCalc.coreZC.getGeoLocation().getTimeZone();
	const zc = (/** @type {Temporal.PlainDate} */ d) => zmanCalc.chainDate(d.withCalendar('iso8601'));
	const year = jCal.getJewishYear(), month = jCal.getJewishMonth();
	const monthCal = jCal.chainJewishDate(year, month, 1);
	const blCal = jCal.chainJewishDate(year, month, 15);
	const date15 = blCal.getDate();

	/** @type {Temporal.ZonedDateTime | null} */
	let recommendedStart = null;
	if (month == KosherZmanim.JewishCalendar.AV) {
		const tishaBeav = jCal.chainJewishDate(year, month, 9);
		const fast = tishaBeav.getDayOfWeek() == 7 ? jCal.chainJewishDate(year, month, 10) : tishaBeav;
		recommendedStart = zc(fast.getDate()).getTzetHumra();
	} else if (month == KosherZmanim.JewishCalendar.TISHREI) {
		recommendedStart = zc(jCal.chainJewishDate(year, month, 10).getDate()).getTzetHumra();
	}

	const endIkar = zc(date15).getAlotHashahar();
	const endEarlyIkar = zc(date15.subtract({ days: 1 })).getAlotHashahar();
	const useEarlyTimes = blCal.isAssurBemelacha();

	const effectiveEndMs = (useEarlyTimes ? endEarlyIkar : endIkar).epochMilliseconds;
	const start = monthCal.getTchilasZmanKidushLevana7Days().withTimeZone(tz);
	const validFromMs = (recommendedStart ?? start).epochMilliseconds;

	return {
		year, month, validFromMs,
		fifteenthIsShabbat: blCal.getDayOfWeek() == 7,
		monthNames: monthCal.formatJewishMonth(),
		molad: monthCal.getMoladAsDate().withTimeZone(tz).withCalendar('iso8601'),
		start,
		recommendedStart,
		endIkar,
		endStretch: zc(date15).timeRange.current.sunrise,
		endStrict: monthCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(tz),
		endEarlyIkar,
		endEarlyStretch: zc(date15.subtract({ days: 1 })).timeRange.current.sunrise,
		useEarlyTimes,
		effectiveEndMs
	};
}

/**
 * "Rema" when the half-way-between-moladot end is later than the regular end, else "Strict".
 * @param {LevanaWindow} win
 * @param {typeof EN} t
 */
export function strictLabel(win, t) {
	return Temporal.ZonedDateTime.compare(win.endStrict, win.endIkar) > 0 ? t.rema : t.strict;
}
