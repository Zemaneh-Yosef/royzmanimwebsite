// @ts-check
/**
 * print-shared.js — pieces both print workers use (print-web-worker.js for the monthly print,
 * weeklyPrint/print-web-worker.js for the weekly one). Worker-safe: no DOM, no localStorage.
 */

/** @typedef {[locales?: string | string[], options?: Intl.DateTimeFormatOptions]} TimeFormat */

/** Per format object (the weekly print's fixed formats) @type {WeakMap<TimeFormat, Map<string, Intl.DateTimeFormat | null>>} */
const byFormat = new WeakMap();
/** Per format's content (formats built afresh for each call) @type {Map<string, Map<string, Intl.DateTimeFormat | null>>} */
const byFormatText = new Map();

/**
 * zDT.toLocaleString(...tf), but with the Intl.DateTimeFormat cached per format + time zone.
 * toLocaleString builds a new formatter on every call, which dominated the prints' run time.
 * Falls back to toLocaleString for anything but an ISO ZonedDateTime, or zones Intl can't take.
 * @param {Temporal.ZonedDateTime} zdt
 * @param {TimeFormat} tf
 */
export function fmt(zdt, tf) {
	if (!(zdt instanceof Temporal.ZonedDateTime) || zdt.calendarId !== 'iso8601')
		return zdt.toLocaleString(...tf);

	let byZone = byFormat.get(tf);
	if (!byZone) {
		const text = JSON.stringify(tf);
		byZone = byFormatText.get(text);
		if (!byZone) byFormatText.set(text, byZone = new Map());
		byFormat.set(tf, byZone);
	}

	const zone = zdt.timeZoneId;
	let formatter = byZone.get(zone);
	if (formatter === undefined) {
		try {
			formatter = new Intl.DateTimeFormat(tf[0], { ...tf[1], timeZone: zone });
		} catch {
			formatter = null;
		}
		byZone.set(zone, formatter);
	}

	return formatter ? formatter.format(zdt.epochMilliseconds) : zdt.toLocaleString(...tf);
}

/** @typedef {import("../day-cards.js").DayCard} DayCard */
/** @typedef {import("../day-cards.js").CardLanguage} CardLanguage */

/**
 * The first days of Pesaḥ: finish Hallel by midnight, and the prayer changes from Musaf
 * @param {DayCard} card (pesachFirstDays())
 * @param {CardLanguage} lang
 * @param {TimeFormat} tf
 */
export function hallelNotice(card, lang, tf) {
	return (lang == 'he' ? "תשלים הלל לפני " : "Conclude Hallel before ")
		+ fmt(/** @type {any} */ (card.hallelBefore), tf)
		+ '<br>'
		+ (lang == 'he' ? "ממוסף ואילך, אומרים מוריד הטל וברכנו" : "From Mussaf onwards, we say מוריד הטל and ברכנו");
}

/**
 * The Shabbat's makam, and on Shabbat Mevarchim the coming Rosh Ḥodesh
 * @param {DayCard} card (shabbat())
 * @param {CardLanguage} lang
 * @param {import("../WebsiteLimudCalendar.js").default} shabbatJCal the Shabbat
 * @param {import("../../libraries/kosherZmanim/kosher-zmanim.js").Makam} makamIndex
 * @param {typeof import("../makamObj.js").default} makamObj
 * @param {(n: number) => string} hebrewOrdinal a day of the week in Hebrew ("ראשון"…)
 */
export function shabbatExtra(card, lang, shabbatJCal, makamIndex, makamObj, hebrewOrdinal) {
	let extra = `<i class="bi bi-music-note-beamed"></i> ${lang == 'he' ? 'מקאם' : 'Makam'}: ` + makamIndex.getTodayMakam(shabbatJCal).makam
		.map((/** @type {number | string} */ mak) => (typeof mak == "number" ? makamObj[lang == 'he' ? 'makamNameMapHeb' : 'makamNameMapEng'][mak] : mak))
		.join(" / ");

	if (card.roshHodesh) {
		const { month, days } = card.roshHodesh;
		extra += lang == 'he'
			? "<br> <i class='bi bi-moon-fill'></i> ראש חודש " + month.he
				+ " ביום " + days.map(day => hebrewOrdinal(day.dayOfWeek)).join(" ו")
			: "<br> <i class='bi bi-moon-fill'></i> New month " + month.en
				+ " on " + days.map(day => shabbatJCal.chainDate(day).getDayOfTheWeek().en).join(" / ");
	}
	return extra;
}
