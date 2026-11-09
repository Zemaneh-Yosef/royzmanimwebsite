// @ts-check

/**
 * The Shabbat, Yom Tov and fast cards: which times a holiday (or Shabbat, or fast) needs, on which days.
 * Shared by the Hazon Yosef page and the monthly and weekly printouts; each of those chooses which cards to
 * make on which day (and how many it has room for) and words them, so what's here is only the dates and
 * times, a title, and facts a card may mention (the Hallel deadline, the Rosh Ḥodesh days announced, an
 * eruv tavshilin). No DOM: the printouts run this in a worker.
 */

import { Parsha } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteLimudCalendar from "./WebsiteLimudCalendar.js";
import { zDTFromFunc } from "./ROYZmanim.js";
import { roundsUp } from "./WebsiteCalendar.js";

/** @typedef {'he' | 'en' | 'he-Latn'} CardLanguage */
/** @typedef {Record<CardLanguage, string>} LangText */
/** @typedef {'earlier' | 'later' | 'noRound'} RoundMode */

/**
 * A card: the times of each day it covers, in the order they're listed.
 * @typedef {Object} DayCard
 * @property {string} id the occasion and its first day, to keep one card per occasion when days are walked through
 * @property {number} [ytI] the Yom Tov index (none on a Shabbat card)
 * @property {string} title HTML
 * @property {Map<Temporal.PlainDate, Record<string, Temporal.ZonedDateTime>>} datesToZman
 * @property {string} [extra] HTML a page adds
 * @property {string} [topNotice] HTML a page adds
 * @property {string} [bottomNotice] HTML a page adds
 * @property {Temporal.PlainTime} [hallelBefore] first days of Pesaḥ: the Hallel of the night ends by midnight
 * @property {{ month: { he: string; en: string }; days: Temporal.PlainDate[] }} [roshHodesh] Shabbat Mevarchim:
 *   the month announced, and its Rosh Ḥodesh days (one or two, in order)
 */

/**
 * What the builders work from
 * @typedef {Object} CardContext
 * @property {WebsiteLimudCalendar} jCal set to the day being looked at (also gives Israel or not, and the parasha)
 * @property {(date: Temporal.PlainDate) => import("./ROYZmanim.js").ZemanFunctions} zc the calculator for a date
 * @property {(zDT: Temporal.ZonedDateTime, round: RoundMode) => Temporal.ZonedDateTime} [round] how a time is
 *   rounded to the minute (default handleRound; the weekly printout rounds across its locations)
 * @property {CardLanguage} lang
 */

/**
 * A time rounded to the minute it's shown at: 'later' rounds up from 21 seconds, 'earlier' from 41
 * @param {Temporal.ZonedDateTime} zDT
 * @param {RoundMode} round
 */
export function handleRound(zDT, round) {
	if (round === 'noRound')
		return zDT;

	if (roundsUp(zDT, round))
		return zDT.add({ minutes: 1 }).with({ second: 0 });
	else
		return zDT.with({ second: 0 });
}

/**
 * The names of the holidays and fasts
 * @param {boolean} inIsrael (Shemini 'Atzereth and Simḥath Torah are one day there)
 * @returns {Record<number, LangText>}
 */
export function holidayNames(inIsrael) {
	return {
		// Holidays
		[WebsiteLimudCalendar.PESACH]: { he: "פסח", "he-Latn": "Pesaḥ", en: "Passover" },
		[WebsiteLimudCalendar.CHOL_HAMOED_PESACH]: { he: "חול המועד", "he-Latn": "Ḥol Hamo'ed", en: "Intermediary" },
		[WebsiteLimudCalendar.SHAVUOS]: { he: "שבועות", "he-Latn": "Shavu'oth", en: "Shavu'oth" },
		[WebsiteLimudCalendar.ROSH_HASHANA]: { he: "ראש השנה", "he-Latn": "Rosh Ha'Shana", en: "Rosh Ha'Shana" },
		[WebsiteLimudCalendar.SUCCOS]: { he: "סוכות", "he-Latn": "Sukkoth", en: "Sukkoth" },
		[WebsiteLimudCalendar.CHOL_HAMOED_SUCCOS]: { he: "חול המועד", "he-Latn": "Ḥol Hamo'ed", en: "Intermediary" },
		[WebsiteLimudCalendar.HOSHANA_RABBA]: { he: "הושענא רבה", "he-Latn": "Hosh'ana Rabba", en: "Hosh'ana Rabba" },
		[WebsiteLimudCalendar.SHEMINI_ATZERES]: {
			he: "שמיני עצרת" + (inIsrael ? " & שמחת תורה" : ""),
			en: "Shemini 'Atzereth" + (inIsrael ? " & Simḥath Torah" : ""),
			"he-Latn": "Shemini 'Atzereth" + (inIsrael ? " & Simḥath Torah" : "")
		},
		[WebsiteLimudCalendar.SIMCHAS_TORAH]: {
			he: (inIsrael ? "שמיני עצרת & " : "") + "שמחת תורה",
			en: (inIsrael ? "Shemini 'Atzereth & " : "") + "Simḥath Torah",
			"he-Latn": (inIsrael ? "Shemini 'Atzereth & " : "") + "Simḥath Torah"
		},

		// Semi-Holidays
		[WebsiteLimudCalendar.PESACH_SHENI]: { he: "פסח שני", "he-Latn": "Pesaḥ Sheni", en: "Pesaḥ Sheni" },
		[WebsiteLimudCalendar.LAG_BAOMER]: { he: "לג בעומר", "he-Latn": "Lag Ba'Omer", en: "Lag Ba'Omer" },
		[WebsiteLimudCalendar.TU_BEAV]: { he: 'ט"ו באב', "he-Latn": "Tu Be'av", en: "Tu Be'av" },
		[WebsiteLimudCalendar.TU_BESHVAT]: { he: 'ט"ו בשבט', "he-Latn": "Tu Bishvath", en: "Tu Bishvath" },
		[WebsiteLimudCalendar.PURIM_KATAN]: { he: "פורים קטן", "he-Latn": "Purim Katan", en: "Purim Katan" },
		[WebsiteLimudCalendar.SHUSHAN_PURIM_KATAN]: { he: "שושן פורים קטן", "he-Latn": "Shushan Purim Katan", en: "Shushan Purim Katan" },
		[WebsiteLimudCalendar.PURIM]: { he: "פורים", "he-Latn": "Purim", en: "Purim" },
		[WebsiteLimudCalendar.SHUSHAN_PURIM]: { he: "שושן פורים", "he-Latn": "Shushan Purim", en: "Shushan Purim" },

		// Fasts
		[WebsiteLimudCalendar.FAST_OF_ESTHER]: { he: "תענית אסתר", "he-Latn": "Ta'anit Esther", en: "Fast of Esther" },
		[WebsiteLimudCalendar.FAST_OF_GEDALYAH]: { he: "צום גדליה", "he-Latn": "Tzom Gedalyah", en: "Fast of Gedalyah" },
		[WebsiteLimudCalendar.YOM_KIPPUR]: { he: "יום כיפור", "he-Latn": "Yom Kippur", en: "Yom Kippur" }
	};
}

/**
 * The fasts holidayNames() leaves out: the printouts' day grid has no title for them, only the fast's times
 * @type {Record<number, LangText>}
 */
export const fastNames = {
	[WebsiteLimudCalendar.TISHA_BEAV]: { he: "תשעה באב", "he-Latn": "Tisha B'Av", en: "Tisha B'Av" },
	[WebsiteLimudCalendar.SEVENTEEN_OF_TAMMUZ]: { he: "שבעה עשר בתמוז", "he-Latn": "Seventeenth of Tammuz", en: "Seventeenth of Tammuz" },
	[WebsiteLimudCalendar.TENTH_OF_TEVES]: { he: "עשרה בטבת", "he-Latn": "Tenth of Tevet", en: "Tenth of Tevet" }
};

/** @type {LangText} */
const SHABBAT_HOL_HAMOED = { he: "שבת חול המועד", "he-Latn": "Shabbat Ḥol Hamo'ed", en: "Shabbat Ḥol Hamo'ed" };
/** @type {LangText} */
const LAST_DAYS = { he: "אחרון", "he-Latn": "Last Days", en: "Last Days" };

/**
 * The holiday a day belongs to, for a card: from its eve to its end (Pesaḥ's first and last days apart).
 * Days are matched by their own Yom Tov index, so a page walking through days meets each holiday on
 * several of them; the card's id tells them apart.
 * @param {WebsiteLimudCalendar} jCal
 * @returns {'pesachFirst' | 'yomKippur' | 'shavuot' | 'roshHashana' | 'sukkot' | 'sheminiAtzeret' | 'pesachLast' | null}
 */
export function holidayKind(jCal) {
	const index = jCal.getYomTovIndex();
	if (index == WebsiteLimudCalendar.EREV_PESACH || (index == WebsiteLimudCalendar.PESACH && jCal.getJewishDayOfMonth() < 18))
		return 'pesachFirst';
	if (index == WebsiteLimudCalendar.EREV_YOM_KIPPUR || index == WebsiteLimudCalendar.YOM_KIPPUR)
		return 'yomKippur';
	if (index == WebsiteLimudCalendar.EREV_SHAVUOS || index == WebsiteLimudCalendar.SHAVUOS
		|| (jCal.getDayOfWeek() == 7 && jCal.chainDate(jCal.getDate().subtract({ days: 1 })).getYomTovIndex() == WebsiteLimudCalendar.SHAVUOS))
		return 'shavuot';
	if (index == WebsiteLimudCalendar.EREV_ROSH_HASHANA || index == WebsiteLimudCalendar.ROSH_HASHANA)
		return 'roshHashana';
	if (index == WebsiteLimudCalendar.EREV_SUCCOS || index == WebsiteLimudCalendar.SUCCOS)
		return 'sukkot';
	if ([WebsiteLimudCalendar.HOSHANA_RABBA, WebsiteLimudCalendar.SHEMINI_ATZERES, WebsiteLimudCalendar.SIMCHAS_TORAH].includes(index))
		return 'sheminiAtzeret';
	if ((jCal.isErevYomTov() && jCal.isCholHamoedPesach()) || (index == WebsiteLimudCalendar.PESACH && jCal.getJewishDayOfMonth() > 18))
		return 'pesachLast';
	return null;
}

/**
 * The fast of the day or of the next one (Yom Kippur has its own card), or null
 * @param {WebsiteLimudCalendar} jCal
 */
export function fastDay(jCal) {
	if (jCal.isTaanis() && !jCal.isYomKippur())
		return jCal;
	const tomorrow = jCal.tomorrow();
	if (tomorrow.isTaanis() && !tomorrow.isYomKippur())
		return tomorrow;
	return null;
}

/**
 * Whether the day gets a Shabbat card: Friday or Shabbat, unless a Yom Tov is next to it (its card has the Shabbat)
 * @param {WebsiteLimudCalendar} jCal
 */
export function isShabbatCardDay(jCal) {
	if (jCal.isYomTovAssurBemelacha())
		return false;
	if (jCal.getDayOfWeek() === 7)
		return !jCal.isErevYomTov() && !jCal.chainDate(jCal.getDate().subtract({ days: 1 })).isYomTovAssurBemelacha();
	if (jCal.getDayOfWeek() === 6)
		return !jCal.tomorrow().isErevYomTov() && !jCal.tomorrow().isYomTovAssurBemelacha();
	return false;
}

/**
 * The times builders take for a date
 * @param {CardContext} ctx
 */
function timesOf(ctx) {
	const round = ctx.round ?? handleRound;
	/** @param {Temporal.PlainDate} date */
	const zc = (date) => ctx.zc(date);
	return {
		/** candle lighting before sunset */
		candles: (/** @type {Temporal.PlainDate} */ date) => round(zc(date).getCandleLighting(), 'earlier'),
		/** the end of Shabbat or Yom Tov (also candle lighting from an existing flame after a Shabbat) */
		havdalah: (/** @type {Temporal.PlainDate} */ date, /** @type {RoundMode} */ mode = 'later') => round(zDTFromFunc(zc(date).getTzetMelakha()), mode),
		/** Rabbenu Tam */
		rt: (/** @type {Temporal.PlainDate} */ date) => round(zc(date).getTzetRT(), 'later'),
		/** candle lighting for a second night of Yom Tov (after nightfall, from an existing flame) */
		secondNight: (/** @type {Temporal.PlainDate} */ date) => round(zc(date).getTzetHumra(), 'later'),
		/** sunrise (visible when there's a horizon; a sea-level fallback isn't rounded) */
		netz: (/** @type {Temporal.PlainDate} */ date) => {
			const netz = zc(date).getNetz();
			return round(zDTFromFunc(netz), netz instanceof Temporal.ZonedDateTime ? 'later' : 'noRound');
		},
		round,
		zc
	};
}

/** @param {CardContext} ctx @param {number} ytI */
const nameOf = (ctx, ytI) => holidayNames(ctx.jCal.getInIsrael())[ytI][ctx.lang];

/** @param {string} kind @param {Temporal.PlainDate} date */
const cardId = (kind, date) => kind + "-" + date.withCalendar("iso8601").toString();

/**
 * A Shabbat's own parasha in Hebrew (the day a card is built on may be in the week after it)
 * @param {WebsiteLimudCalendar} jCal @param {Temporal.PlainDate} shabbatDate
 */
const parashaOf = (jCal, shabbatDate) => jCal.chainDate(shabbatDate).getHebrewParasha()[0];

/**
 * The card with its days in order (a Friday may be added after the Shabbat it leads into)
 * @param {DayCard} card
 */
function inOrder(card) {
	card.datesToZman = new Map([...card.datesToZman].sort(([a], [b]) => Temporal.PlainDate.compare(a, b)));
	return card;
}

/**
 * Erev Pesaḥ (bedika, the ḥametz deadlines) through the first days
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function pesachFirstDays(ctx) {
	const { jCal } = ctx;
	const t = timesOf(ctx);
	const inIsrael = jCal.getInIsrael();
	const hametzDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_PESACH).getDate();

	/** @type {DayCard} */
	const card = { id: cardId("pesachFirst", hametzDate), ytI: WebsiteLimudCalendar.PESACH, title: nameOf(ctx, WebsiteLimudCalendar.PESACH), datesToZman: new Map() };

	// the search is the night before; when that's Shabbat, the night before it
	let nightErev = hametzDate.subtract({ days: 1 });
	if (hametzDate.dayOfWeek == 6)
		nightErev = nightErev.subtract({ days: 1 });

	card.datesToZman.set(hametzDate, {
		bedikatHametz: t.round(t.zc(nightErev).getTzet(), 'later'),
		sofZemanBiurHametz: t.round(t.zc(hametzDate).getSofZemanBiurHametz(), 'earlier'),
		sofZemanAhilathHametz: t.round(t.zc(hametzDate).getSofZemanAhilathHametz(), 'earlier'),
		candleLighting: t.candles(hametzDate),
	});
	const firstDay = card.datesToZman.get(hametzDate);

	if (hametzDate.dayOfWeek == 6) {
		card.title = 'שבת ' + parashaOf(jCal, hametzDate) + ' (הגדול)<br>+ פסח';
		card.datesToZman.set(hametzDate.subtract({ days: 1 }), { candleLighting: t.candles(hametzDate.subtract({ days: 1 })) });

		firstDay.candleLighting = t.havdalah(hametzDate);
		firstDay.rabbenuTam = t.rt(hametzDate);
	}

	let hatzotTime = t.zc(hametzDate).getSolarMidnight().toPlainTime();
	const pesahDate = hametzDate.add({ days: 1 });

	if (inIsrael) {
		card.datesToZman.set(pesahDate,
			pesahDate.dayOfWeek == 5
				? { candleLighting: t.candles(pesahDate) }
				: { tzetMelakha: t.havdalah(pesahDate), rabbenuTam: t.rt(pesahDate) });

		if (pesahDate.dayOfWeek == 5) {
			const shabbat = pesahDate.add({ days: 1 });
			card.datesToZman.set(shabbat, { tzetMelakha: t.havdalah(shabbat), rabbenuTam: t.rt(shabbat) });
		}
	} else {
		card.datesToZman.set(pesahDate, {
			candleLighting: pesahDate.dayOfWeek == 5 ? t.candles(pesahDate) : t.secondNight(pesahDate)
		});
		const secondNight = card.datesToZman.get(pesahDate);
		if (pesahDate.dayOfWeek == 6) {
			secondNight.candleLighting = t.havdalah(pesahDate);
			secondNight.rabbenuTam = t.rt(pesahDate);
		}

		// the second Seder's Hallel too
		if (Temporal.PlainTime.compare(hatzotTime, t.zc(pesahDate).getSolarMidnight().toPlainTime()) == 1)
			hatzotTime = t.zc(pesahDate).getSolarMidnight().toPlainTime();

		const secondDay = pesahDate.add({ days: 1 });
		card.datesToZman.set(secondDay,
			secondDay.dayOfWeek == 5
				? { candleLighting: t.candles(secondDay) }
				: { tzetMelakha: t.havdalah(secondDay) });

		if (secondDay.dayOfWeek == 5) {
			card.title = nameOf(ctx, WebsiteLimudCalendar.PESACH) + "<br>+ " + SHABBAT_HOL_HAMOED[ctx.lang];
			const shabbat = pesahDate.add({ days: 2 });
			card.datesToZman.set(shabbat, { tzetMelakha: t.havdalah(shabbat), rabbenuTam: t.rt(shabbat) });
		}
	}

	card.hallelBefore = hatzotTime;
	return inOrder(card);
}

/**
 * Erev Yom Kippur (immersion, candle lighting) and the day (Musaf, Birkat Kohanim, its end)
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function yomKippur(ctx) {
	const t = timesOf(ctx);
	const ykDate = ctx.jCal.chainYomTovIndex(WebsiteLimudCalendar.YOM_KIPPUR).getDate();
	const erev = ykDate.subtract({ days: 1 });

	return {
		id: cardId("yomKippur", erev),
		ytI: WebsiteLimudCalendar.YOM_KIPPUR,
		title: nameOf(ctx, WebsiteLimudCalendar.YOM_KIPPUR),
		datesToZman: new Map([[erev, {
			mikva: t.round(t.zc(erev).getSofZemanBiurHametz(), 'later'),
			candleLighting: t.candles(erev),
		}], [ykDate, {
			musaf: t.round(t.zc(ykDate).getHatzoth(), 'earlier'),
			birkatKohanim: t.round(t.zc(ykDate).getTzet(), 'earlier'),
			tzetMelakha: t.havdalah(ykDate, 'earlier'),
			rabbenuTam: t.rt(ykDate)
		}]])
	};
}

/**
 * Shavu'oth, with sunrise (the night is spent learning), and a Shabbat before or after it
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function shavuot(ctx) {
	const { jCal } = ctx;
	const t = timesOf(ctx);
	const name = nameOf(ctx, WebsiteLimudCalendar.SHAVUOS);
	const erevDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_SHAVUOS).getDate();

	/** @type {DayCard} */
	const card = {
		id: cardId("shavuot", erevDate),
		ytI: WebsiteLimudCalendar.SHAVUOS,
		title: name,
		datesToZman: new Map([[erevDate, { candleLighting: t.candles(erevDate) }]])
	};

	// the eve is Shabbat: candles on Friday, and for Yom Tov after Shabbat ends
	if (erevDate.dayOfWeek == 6) {
		card.title = "שבת " + parashaOf(jCal, erevDate) + "<br>+ " + name;
		card.datesToZman.set(erevDate.subtract({ days: 1 }), { candleLighting: t.candles(erevDate.subtract({ days: 1 })) });
		card.datesToZman.get(erevDate).candleLighting = t.havdalah(erevDate);
		card.datesToZman.get(erevDate).rabbenuTam = t.rt(erevDate);
	}

	const shavuotDate = erevDate.add({ days: 1 });
	if (jCal.getInIsrael()) {
		card.datesToZman.set(shavuotDate,
			shavuotDate.dayOfWeek == 5
				? { netz: t.netz(shavuotDate), candleLighting: t.candles(shavuotDate) }
				: { netz: t.netz(shavuotDate), tzetMelakha: t.havdalah(shavuotDate), rabbenuTam: t.rt(shavuotDate) });

		if (shavuotDate.dayOfWeek == 5) {
			const shabbat = shavuotDate.add({ days: 1 });
			card.title = name + "<br>+ שבת " + parashaOf(jCal, shabbat);
			card.datesToZman.set(shabbat, { tzetMelakha: t.havdalah(shabbat), rabbenuTam: t.rt(shabbat) });
		}
	} else {
		card.datesToZman.set(shavuotDate, {
			netz: t.netz(shavuotDate),
			candleLighting: shavuotDate.dayOfWeek == 5 ? t.candles(shavuotDate) : t.secondNight(shavuotDate)
		});
		if (shavuotDate.dayOfWeek == 6) {
			const shabbat = card.datesToZman.get(shavuotDate);
			shabbat.candleLighting = t.havdalah(shavuotDate);
			shabbat.rabbenuTam = t.rt(shavuotDate);
		}

		const secondDay = shavuotDate.add({ days: 1 });
		card.datesToZman.set(secondDay,
			secondDay.dayOfWeek == 5
				? { netz: t.netz(secondDay), candleLighting: t.candles(secondDay) }
				: { netz: t.netz(secondDay), tzetMelakha: t.havdalah(secondDay) });

		if (secondDay.dayOfWeek == 6)
			card.datesToZman.get(secondDay).rabbenuTam = t.rt(secondDay);
		else if (secondDay.dayOfWeek == 5) {
			const shabbat = shavuotDate.add({ days: 2 });
			card.title = name + "<br>+ שבת " + parashaOf(jCal, shabbat);
			card.datesToZman.set(shabbat, { tzetMelakha: t.havdalah(shabbat), rabbenuTam: t.rt(shabbat) });
		}
	}

	return inOrder(card);
}

/**
 * Erev Rosh Hashana (immersion, candle lighting) through the end of the holiday, or of Shabbat Shuva after it
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function roshHashana(ctx) {
	const { jCal } = ctx;
	const t = timesOf(ctx);
	const name = nameOf(ctx, WebsiteLimudCalendar.ROSH_HASHANA);
	const erevDate = jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_ROSH_HASHANA
		? jCal.getDate()
		: jCal.chainJewishDate(jCal.getJewishYear() - 1, WebsiteLimudCalendar.ELUL, 29).getDate();
	const roshHashanaDate = erevDate.add({ days: 1 });

	/** @type {DayCard} */
	const card = {
		id: cardId("roshHashana", erevDate),
		ytI: WebsiteLimudCalendar.ROSH_HASHANA,
		title: name,
		datesToZman: new Map([
			[erevDate, { mikva: t.round(t.zc(erevDate).getSofZemanBiurHametz(), 'later'), candleLighting: t.candles(erevDate) }],
			[roshHashanaDate, { candleLighting: t.secondNight(roshHashanaDate) }]
		])
	};

	if (erevDate.dayOfWeek == 3) {
		// Thursday and Friday, then Shabbat Shuva
		const friday = erevDate.add({ days: 2 }), shabbat = erevDate.add({ days: 3 });
		card.title = name + "<br>שבת שובה " + parashaOf(jCal, shabbat);
		card.datesToZman.set(friday, { candleLighting: t.candles(friday) });
		card.datesToZman.set(shabbat, { tzetMelakha: t.havdalah(shabbat), rabbenuTam: t.rt(shabbat) });
	} else {
		if (erevDate.dayOfWeek == 5) {
			const shabbat = card.datesToZman.get(roshHashanaDate);
			shabbat.candleLighting = t.havdalah(roshHashanaDate);
			shabbat.rabbenuTam = t.rt(roshHashanaDate);
		}

		const secondDay = erevDate.add({ days: 2 });
		card.datesToZman.set(secondDay, { tzetMelakha: t.havdalah(secondDay) });
	}

	return inOrder(card);
}

/**
 * Sukkoth's first days, and Shabbat Ḥol Hamo'ed right after them (outside Israel)
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function sukkot(ctx) {
	const { jCal } = ctx;
	const t = timesOf(ctx);
	const erevDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_SUCCOS).getDate();

	/** @type {DayCard} */
	const card = {
		id: cardId("sukkot", erevDate),
		ytI: WebsiteLimudCalendar.SUCCOS,
		title: nameOf(ctx, WebsiteLimudCalendar.SUCCOS),
		datesToZman: new Map([[erevDate, { candleLighting: t.candles(erevDate) }]])
	};

	const sukkotDate = erevDate.add({ days: 1 });
	if (jCal.getInIsrael()) {
		card.datesToZman.set(sukkotDate, { tzetMelakha: t.havdalah(sukkotDate), rabbenuTam: t.rt(sukkotDate) });
	} else {
		card.datesToZman.set(sukkotDate, { candleLighting: t.secondNight(sukkotDate) });

		// Thursday: the second day is Friday, then Shabbat Ḥol Hamo'ed
		if (sukkotDate.dayOfWeek == 4) {
			card.title = nameOf(ctx, WebsiteLimudCalendar.SUCCOS) + "<br>+ " + SHABBAT_HOL_HAMOED[ctx.lang];
			const friday = sukkotDate.add({ days: 1 }), shabbat = sukkotDate.add({ days: 2 });
			card.datesToZman.set(friday, { candleLighting: t.candles(friday) });
			card.datesToZman.set(shabbat, { tzetMelakha: t.havdalah(shabbat), rabbenuTam: t.rt(shabbat) });
		} else {
			if (sukkotDate.dayOfWeek == 6) {
				card.datesToZman.get(sukkotDate).candleLighting = t.havdalah(sukkotDate);
				card.datesToZman.get(sukkotDate).rabbenuTam = t.rt(sukkotDate);
			}
			const secondDay = sukkotDate.add({ days: 1 });
			card.datesToZman.set(secondDay, { tzetMelakha: t.havdalah(secondDay) });
		}
	}

	return inOrder(card);
}

/**
 * Hosh'ana Rabba's evening through Shemini 'Atzereth (and Simḥath Torah, and Shabbat Bereshith after them)
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function sheminiAtzeret(ctx) {
	const { jCal } = ctx;
	const t = timesOf(ctx);
	const erevDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.HOSHANA_RABBA).getDate();

	/** @type {DayCard} */
	const card = {
		id: cardId("sheminiAtzeret", erevDate),
		ytI: WebsiteLimudCalendar.SHEMINI_ATZERES,
		title: nameOf(ctx, WebsiteLimudCalendar.SHEMINI_ATZERES),
		datesToZman: new Map([[erevDate, { candleLighting: t.candles(erevDate) }]])
	};

	const sheminiDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.SHEMINI_ATZERES).getDate();
	if (jCal.getInIsrael()) {
		card.datesToZman.set(sheminiDate, { tzetMelakha: t.havdalah(sheminiDate), rabbenuTam: t.rt(sheminiDate) });
	} else {
		card.datesToZman.set(sheminiDate, { candleLighting: t.secondNight(sheminiDate) });

		// Thursday: Simḥath Torah is Friday, then Shabbat Bereshith
		if (sheminiDate.dayOfWeek == 4) {
			card.title = nameOf(ctx, WebsiteLimudCalendar.SHEMINI_ATZERES) + "<br>+ שבת בראשית";
			const friday = sheminiDate.add({ days: 1 }), shabbat = sheminiDate.add({ days: 2 });
			card.datesToZman.set(friday, { candleLighting: t.candles(friday) });
			card.datesToZman.set(shabbat, { tzetMelakha: t.havdalah(shabbat), rabbenuTam: t.rt(shabbat) });
		} else {
			if (sheminiDate.dayOfWeek == 6) {
				card.datesToZman.get(sheminiDate).candleLighting = t.havdalah(sheminiDate);
				card.datesToZman.get(sheminiDate).rabbenuTam = t.rt(sheminiDate);
			}
			const simhatTorah = sheminiDate.add({ days: 1 });
			card.datesToZman.set(simhatTorah, { tzetMelakha: t.havdalah(simhatTorah) });
		}
	}

	return inOrder(card);
}

/**
 * Pesaḥ's last days. The seventh day falls on Monday, Wednesday, Friday or Shabbat (and the eighth, outside
 * Israel, on Tuesday, Thursday, Shabbat or Sunday): a Shabbat is either the seventh day, or the day after it.
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function pesachLastDays(ctx) {
	const { jCal } = ctx;
	const t = timesOf(ctx);
	const erevDate = jCal.chainJewishDate(jCal.getJewishYear(), WebsiteLimudCalendar.NISSAN, 20).getDate();

	/** @type {DayCard} */
	const card = {
		id: cardId("pesachLast", erevDate),
		ytI: WebsiteLimudCalendar.PESACH,
		title: nameOf(ctx, WebsiteLimudCalendar.PESACH) + "<br>(" + LAST_DAYS[ctx.lang] + ")",
		datesToZman: new Map([[erevDate, { candleLighting: t.candles(erevDate) }]])
	};

	const yomTovDate = erevDate.add({ days: 1 });
	const nextDay = yomTovDate.add({ days: 1 });
	if (yomTovDate.dayOfWeek == 5) {
		card.datesToZman.set(yomTovDate, { candleLighting: t.candles(yomTovDate) });
		card.datesToZman.set(nextDay, { tzetMelakha: t.havdalah(nextDay), rabbenuTam: t.rt(nextDay) });

		if (jCal.getInIsrael())
			card.title = card.title.replace('<br>', ' ') + "<br>+ שבת " + parashaOf(jCal, nextDay);
	} else if (!jCal.getInIsrael()) {
		card.datesToZman.set(yomTovDate, yomTovDate.dayOfWeek == 6
			? { candleLighting: t.havdalah(yomTovDate), rabbenuTam: t.rt(yomTovDate) }
			: { candleLighting: t.secondNight(yomTovDate) });
		card.datesToZman.set(nextDay, { tzetMelakha: t.havdalah(nextDay) });
	} else {
		card.datesToZman.set(yomTovDate, { tzetMelakha: t.havdalah(yomTovDate), rabbenuTam: t.rt(yomTovDate) });
	}

	return inOrder(card);
}

/** The builders holidayKind() names */
export const holidayCards = Object.freeze({ pesachFirst: pesachFirstDays, yomKippur, shavuot, roshHashana, sukkot, sheminiAtzeret, pesachLast: pesachLastDays });

/**
 * A fast: from dawn (Tisha B'Av: the sunset before) to nightfall
 * @param {CardContext} ctx
 * @param {WebsiteLimudCalendar} fastJCal the fast's day (see fastDay())
 * @returns {DayCard}
 */
export function fast(ctx, fastJCal) {
	const t = timesOf(ctx);
	const taanitDay = fastJCal.getDate();
	const index = fastJCal.getYomTovIndex();

	return {
		id: cardId("fast", taanitDay),
		ytI: index,
		title: (holidayNames(fastJCal.getInIsrael())[index] ?? fastNames[index])[ctx.lang],
		datesToZman: new Map(fastJCal.getJewishMonth() == WebsiteLimudCalendar.AV
			? [[taanitDay.subtract({ days: 1 }), {
				fastStarts: t.round(t.zc(taanitDay.subtract({ days: 1 })).getShkiya(), 'earlier')
			}], [taanitDay, {
				fastEnds: t.round(t.zc(taanitDay).getTzetHumra(), 'later')
			}]]
			: [[taanitDay, {
				fastStarts: t.round(t.zc(taanitDay).getAlotHashahar(), 'earlier'),
				fastEnds: t.round(t.zc(taanitDay).getTzetHumra(), 'later')
			}]])
	};
}

/**
 * The coming Shabbat (see isShabbatCardDay()): its candle lighting and end, and the month announced on a
 * Shabbat Mevarchim
 * @param {CardContext} ctx
 * @returns {DayCard}
 */
export function shabbat(ctx) {
	const { jCal } = ctx;
	const t = timesOf(ctx);
	const shabbatJCal = jCal.shabbat();
	const shabbatDate = shabbatJCal.getDate();
	const friday = shabbatDate.subtract({ days: 1 });

	const parasha = shabbatJCal.getHebrewParasha();

	/** @type {DayCard} */
	const card = {
		id: cardId("shabbat", shabbatDate),
		title: "שבת "
			+ (shabbatJCal.isCholHamoed() ? "חול המועד" : parasha[0])
			+ (![Parsha.NONE, Parsha.NACHAMU, Parsha.CHAZON, Parsha.SHIRA].includes(shabbatJCal.getSpecialShabbos())
				? ("<div class='specialShabPar'>(" + parasha[1] + ")</div>") : ""),
		datesToZman: new Map([
			[friday, { candleLighting: t.candles(friday) }],
			[shabbatDate, { tzetMelakha: t.havdalah(shabbatDate), rabbenuTam: t.rt(shabbatDate) }]
		])
	};

	if (shabbatJCal.isShabbosMevorchim()) {
		const nextMonth = shabbatJCal.chainDate(shabbatDate.add({ weeks: 2 }));
		const first = nextMonth.chainJewishDate(nextMonth.getJewishYear(), nextMonth.getJewishMonth(), 1);
		const dayBefore = first.chainDate(first.getDate().subtract({ days: 1 }));
		card.roshHodesh = {
			month: nextMonth.formatJewishMonth(),
			days: dayBefore.getJewishDayOfMonth() == 30 ? [dayBefore.getDate(), first.getDate()] : [first.getDate()]
		};
	}

	return card;
}

/**
 * Candle lighting for a night of Ḥanukka (Friday's before Shabbat, Shabbat's after it)
 * @param {CardContext} ctx
 * @param {Temporal.PlainDate} date
 * @returns {Record<string, Temporal.ZonedDateTime>}
 */
export function hanukkahNight(ctx, date) {
	const t = timesOf(ctx);
	if (date.dayOfWeek == 6)
		return { candleLighting: t.havdalah(date), rabbenuTam: t.rt(date) };
	if (date.dayOfWeek == 5)
		return { candleLighting: t.candles(date) };
	return { candleLighting: t.round(t.zc(date).getTzet(), 'later') };
}

/**
 * Whether an eruv tavshilin is made for the card's holiday (it runs into a Shabbat)
 * @param {DayCard} card
 * @param {WebsiteLimudCalendar} jCal any day (for the calendar)
 */
export function needsEruvTavshilin(card, jCal) {
	return [...card.datesToZman.keys()].some(date => jCal.chainDate(date).isEruvTavshilimMadeToday());
}

/**
 * Add the cards not already in the list (by id)
 * @param {DayCard[]} list
 * @param {...(DayCard | null | undefined)} cards
 */
export function addCards(list, ...cards) {
	for (const card of cards)
		if (card && !list.some(other => other.id === card.id))
			list.push(card);
	return list;
}

/**
 * Every card a single day shows (Hazon Yosef's week view): its holiday's, its fast's (or the next day's),
 * and the coming Shabbat's
 * @param {CardContext} ctx
 * @returns {DayCard[]}
 */
export function dayCards(ctx) {
	const kind = holidayKind(ctx.jCal);
	const fastJCal = fastDay(ctx.jCal);
	return addCards([],
		kind && holidayCards[kind](ctx),
		fastJCal && fast(ctx, fastJCal),
		isShabbatCardDay(ctx.jCal) ? shabbat(ctx) : null);
}
