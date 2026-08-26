// @ts-check

import * as KosherZmanim from '../../../libraries/kosherZmanim/kosher-zmanim.js';
import { Parsha } from '../../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteLimudCalendar from '../../WebsiteLimudCalendar.js';
import { parseHTML } from '../../../libraries/linkedom/linkedom.mjs'
import { daysForLocale, monthForLocale } from '../../WebsiteCalendar.js';
import { ZemanFunctions, methodNames, zDTFromFunc } from '../../ROYZmanim.js';
import n2wordsOrdinal from '../../misc/n2wordsOrdinal.js';
import makamObj from '../../makamObj.js';

const icons = {
	havdalah: '<svg viewBox="0 0 100 100" class="flipImageRTL"><use href="/assets/images/havdalah.svg#Layer_1"/></svg>',
	candle: '<i class="bi bi-fire"></i>',
	netz: '<i class="bi bi-sunrise-fill"></i>',
	wine: '<img src="/assets/images/icons8-wine-bar-64.png">',
	dispose: '<i class="bi bi-trash-fill" style="float: inline-start; margin-bottom: 2ch; margin-inline-end: .25rem;"></i>',
	hatzot: '🌕',
	bedika: '<i class="bi bi-search"></i>'
}

const hNum = new KosherZmanim.HebrewDateFormatter();
hNum.setHebrewFormat(true);
hNum.setUseGershGershayim(true);
hNum.setUseFinalFormLetters(true);

/** @typedef {{
	israel: boolean;
	geoCoordinates: [string, number, number, number, string];
	netz: number[]
	htmlElems: string;
	calendar: 'iso8601'|'hebrew';
	hourCalculator: "seasonal"|"degrees";
	date: string;
	rtKulah: boolean;
	tzetMelakha: {
		minutes: number;
		degree: number;
	};
	timeFormat: 'h11'|'h12'|'h23'|'h24';
	lang: "hb"|"en-et"|"en";
	week: number;
	candleTime: number;
	addedZemanim: string[];
  }} singlePageParams */

// "date" of param will have to be in the iso8601 calendar
/**
  * @param {MessageEvent<singlePageParams>} x
 */
function messageHandler(x) {
	const geoLocation = new KosherZmanim.GeoLocation(...x.data.geoCoordinates);

	const { document } = parseHTML(x.data.htmlElems);

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const defaulTF = [x.data.lang == 'hb' ? 'he' : 'en', {
		hourCycle: x.data.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];
	/** @type {[locales?: string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtFBLevana = [x.data.lang == 'hb' ? 'he' : 'en', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hourCycle: x.data.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}]

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const sunriseTF = [defaulTF[0], { ...defaulTF[1], second: '2-digit' }];

	const baseDate = Temporal.PlainDate.from(x.data.date);

	const jCal = new WebsiteLimudCalendar();
	jCal.setDate(baseDate.withCalendar("iso8601"))
	jCal.setInIsrael(x.data.israel);

	const zmanCalc = new ZemanFunctions(geoLocation, {
		elevation: x.data.israel,
		melakha: x.data.tzetMelakha,
		fixedMil: x.data.israel || x.data.hourCalculator == "seasonal",
		candleLighting: x.data.candleTime,
		rtKulah: x.data.rtKulah
	});
	zmanCalc.setDate(jCal.getDate())
	zmanCalc.setVisualSunrise(x.data.netz);

	// @ts-ignore
	const makamIndex = new KosherZmanim.Makam(makamObj.sefarimList);

	const yomTovObj = {
		// Holidays
		[KosherZmanim.JewishCalendar.PESACH]: {
			hb: "פסח",
			"en-et": "Pesaḥ",
			en: "Passover",
		},
		[KosherZmanim.JewishCalendar.CHOL_HAMOED_PESACH]: {
			en: "Intermediary",
			"en-et": "Ḥol HaMoedh",
			hb: "חול המועד"
		},
		[KosherZmanim.JewishCalendar.SHAVUOS]: {
			en: "Shavu'oth",
			hb: "שבועות",
			"en-et": "Shavu'oth"
		},
		[KosherZmanim.JewishCalendar.ROSH_HASHANA]: {
			hb: "ראש השנה",
			en: "Rosh Ha'Shana",
			"en-et": "Rosh Ha'Shana"
		},
		[KosherZmanim.JewishCalendar.SUCCOS]: {
			hb: "סוכות",
			en: "Sukkoth",
			"en-et": "Sukkoth"
		},
		[KosherZmanim.JewishCalendar.CHOL_HAMOED_SUCCOS]: {
			hb: "חול המועד",
			"en-et": "Ḥol Ha'Moed",
			en: "Intermediary"
		},
		[KosherZmanim.JewishCalendar.HOSHANA_RABBA]: {
			hb: "הושענא רבה",
			"en-et": "Hosh'ana Rabba",
			en: "Hosh'ana Rabba"
		},

		// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
		// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
		[KosherZmanim.JewishCalendar.SHEMINI_ATZERES]: {
			hb: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
			en: "Shemini 'Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : ""),
			"en-et": "Shemini 'Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : "")
		},
		[KosherZmanim.JewishCalendar.SIMCHAS_TORAH]: {
			hb: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
			en: (jCal.getInIsrael() ? "Shemini 'Atzereth & " : "") + "Simḥath Torah",
			"en-et": (jCal.getInIsrael() ? "Shemini 'Atzereth & " : "") + "Simḥath Torah"
		},

		// Semi-Holidays & Fasts
		[KosherZmanim.JewishCalendar.PESACH_SHENI]: {
			hb: "פסח שני",
			en: "Pesaḥ Sheni",
			"en-et": "Pesaḥ Sheni"
		},
		[KosherZmanim.JewishCalendar.LAG_BAOMER]: {
			hb: "לג בעומר",
			en: "Lag Ba'Omer",
			"en-et": "Lag Ba'Omer"
		},
		[KosherZmanim.JewishCalendar.TU_BEAV]: {
			hb: 'ט"ו באב',
			en: "Tu Be'av",
			"en-et": "Tu Be'av"
		},
		[KosherZmanim.JewishCalendar.TU_BESHVAT]: {
			hb: 'ט"ו בשבת',
			en: "Tu Bishvath",
			"en-et": "Tu Bishvath"
		},
		[KosherZmanim.JewishCalendar.PURIM_KATAN]: {
			hb: "פורים קתן",
			en: "Purim Katan",
			"en-et": "Purim Katan"
		},
		[KosherZmanim.JewishCalendar.SHUSHAN_PURIM_KATAN]: {
			hb: "שושן פורים קתן",
			en: "Shushan Purim Katan",
			"en-et": "Shushan Purim Katan"
		},
		[KosherZmanim.JewishCalendar.PURIM]: {
			hb: "פורים",
			en: "Purim",
			"en-et": "Purim"
		},
		[KosherZmanim.JewishCalendar.SHUSHAN_PURIM]: {
			hb: "שושן פורים",
			en: "Shushan Purim",
			"en-et": "Shushan Purim"
		},

		/*
		Rabbi Leeor Dahan doesn't include these. I'm not getting involved
		// Modern-Day Celebrations
		[KosherZmanim.JewishCalendar.YOM_HASHOAH]: {
			hb: "יום השועה",
			"en-et": "Yom Hashoa",
			en: "Holocaust Memorial Day"
		},
		[KosherZmanim.JewishCalendar.YOM_HAZIKARON]: {
			hb: "יום הזכרון",
			"en-et": "Yom Hazikaron",
			en: "Day of Rememberance"
		},
		[KosherZmanim.JewishCalendar.YOM_HAATZMAUT]: {
			hb: "יום האצמעות",
			"en-et": "Yom Haatzmauth",
			en: "Yom Haatzmauth"
		}, // Tachanun is said
		[KosherZmanim.JewishCalendar.YOM_YERUSHALAYIM]: {
			hb: "יום ירושלים",
			"en-et": "Yom Yerushalayim",
			en: "Jerusalem Day"
		},
		*/

		[WebsiteLimudCalendar.FAST_OF_ESTHER]: {
			hb: "תענית אסתר",
			en: "Fast of Esther",
			"en-et": "Ta'anit Esther"
		},
		[WebsiteLimudCalendar.FAST_OF_GEDALYAH]: {
			hb: "צום גדליה",
			en: "Fast of Gedalyah",
			"en-et": "Tzom Gedalyah"
		},
		[WebsiteLimudCalendar.YOM_KIPPUR]: {
			"hb": "יום כיפור",
			"en": "Yom Kippur",
			"en-et": "Yom Kippur"
		}
	}

	const taanitYomTovNames = {
		[WebsiteLimudCalendar.TISHA_BEAV]:
			(x.data.lang == 'hb' ? "תשעה באב" : "Tisha B'Av"),
		[WebsiteLimudCalendar.SEVENTEEN_OF_TAMMUZ]:
			(x.data.lang == 'hb' ? "שבעה עשר בתמוז" : "Seventeenth of Tammuz"),
		[WebsiteLimudCalendar.TENTH_OF_TEVES]:
			(x.data.lang == 'hb' ? "עשרה בטבת" : "Tenth of Tevet"),
	}

	/**
	 * @param {Temporal.ZonedDateTime} zDT
	 * @param {'earlier'|'later'|'noRound'} round
	 */
	function handleRound(zDT, round) {
		if (round === 'noRound')
			return zDT;

		if (zDT.second > 40 || (zDT.second >= 20 && round == 'later'))
			return zDT.add({ minutes: 1 }).with({ second: 0 });
		else
			return zDT.with({ second: 0 });
	}

	function handleShita(/** @type {Element} */zmanRow) {
		const shita = zmanRow.getAttribute("data-zydata")

		/** @type {'earlier'|'later'} */
		// @ts-expect-error
		const round = zmanRow.getAttribute("data-round")

		const div = zmanRow.lastElementChild
		/**
		 * @param {Temporal.ZonedDateTime} zDT
		 * @param {'earlier'|'later'} round
		 * @param {{dtF: typeof defaulTF; icon?: string, appendText?: string}} config
		 */
		function renderZmanInDiv(zDT, round, config = { dtF: defaulTF, icon: undefined }) {
			/** @type {HTMLSpanElement} */
			// @ts-ignore
			if (zDT.dayOfYear !== jCal.getDate().dayOfYear) {
				const dayElem = document.createElement("span");
				div.classList.add('tableCellHasIcon');
				dayElem.appendChild(document.createTextNode('⤵️'));

				div.appendChild(dayElem)
			}

			if (config.icon)
				div.innerHTML += config.icon + " ";

			let timeStr = handleRound(zDT, ('second' in config.dtF[1] ? 'noRound' : round)).toLocaleString(...config.dtF)

			const timeSpan = document.createElement("span")
			timeSpan.classList.add("zman-time")
			timeSpan.appendChild(document.createTextNode(timeStr.trim()))
			div.appendChild(timeSpan);

			if (config.appendText)
				div.innerHTML += config.appendText;
		}

		switch (shita) {
			case 'getTzet':
				if (jCal.hasCandleLighting() || !jCal.isAssurBemelacha()) {
					renderZmanInDiv(zmanCalc.getTzet(), round)
				}

				if (zmanRow.hasAttribute('data-zytzetstrict'))
					renderZmanInDiv(zmanCalc.getTzetHumra(), round, { dtF: defaulTF, icon: x.data.lang == 'hb' ? ' (חומרה: ' : ' (Strict:', appendText: ')' })

				const tzetInUse = [...zmanRow.getElementsByClassName("zman-time")].at(-1)
				if (!tzetInUse) {
					break;
				}

				if (jCal.isTaanis() && !jCal.isYomKippur()) {
					tzetInUse.style.fontWeight = "bold";
				}

				const potForCandle = jCal.hasCandleLighting() && jCal.getDayOfWeek() !== 6 && jCal.isAssurBemelacha() && jCal.getDayOfWeek() !== 7;
				const havdalahOnWine = jCal.isTaanis() && jCal.getJewishMonth() == WebsiteLimudCalendar.AV && jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY;

				if (potForCandle)
					tzetInUse.insertAdjacentHTML('beforebegin', icons.candle)
				else if (havdalahOnWine)
					tzetInUse.insertAdjacentHTML('beforebegin', icons.wine)
				break;
			case 'getAlotHashahar':
				renderZmanInDiv(zmanCalc.getAlotHashahar(), round);
				if (jCal.isTaanis() && jCal.getJewishMonth() !== WebsiteLimudCalendar.AV && !jCal.isYomKippur()) {
					div.lastElementChild.style.fontWeight = "bold"
				}
				break;
			case 'getNetz':
				const rZIDoptions = { dtF: defaulTF };

				let sunriseTime = zmanCalc.getNetz();
				if (!(sunriseTime instanceof Temporal.ZonedDateTime)) {
					rZIDoptions.dtF = sunriseTF;
					sunriseTime = sunriseTime.time;
				}

				renderZmanInDiv(sunriseTime, round, rZIDoptions);
				break;
			case 'getShkiya':
				renderZmanInDiv(zmanCalc.getShkiya(), round);
				if (jCal.getJewishMonth() == KosherZmanim.JewishDate.AV
					&& ((jCal.getJewishDayOfMonth() == 9 && jCal.getDayOfWeek() == KosherZmanim.Calendar.SATURDAY)
						|| (jCal.getJewishDayOfMonth() == 8 && jCal.getDayOfWeek() !== KosherZmanim.Calendar.FRIDAY))) { div.lastElementChild.style.fontWeight = "bold" }

				break;
			default:
				let time = null;
				try {
					// @ts-ignore
					time = zmanCalc[shita]();
				} catch (e) {
					if (!(shita in methodNames)) {
						if (shita == null)
							console.log(zmanRow);
						throw new Error("Unknown zman " + shita);
					} else
						throw e;
				}
				renderZmanInDiv(time, round)
		}
	}


	/** @typedef {{ datesToZman: Map<Temporal.PlainDate, Record<string, Temporal.ZonedDateTime>>; extra?: string } & ({ytI: number; title?: string} | { title: string })} highlightedZman */
	/** @type {highlightedZman[]} */
	let highlightZmanim = [];

	function populateHighlightZmanim() {
		if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH || (jCal.getYomTovIndex() == WebsiteLimudCalendar.PESACH && jCal.getJewishDayOfMonth() < 18)) {
			const hametzDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_PESACH).getDate();

			if (!highlightZmanim.some(hz => hz.datesToZman.keys().find(d => Temporal.PlainDate.compare(d, hametzDate) == 0))) {
				/** @type {highlightedZman} */
				const highlightPesah = { ytI: WebsiteLimudCalendar.PESACH, datesToZman: new Map() };

				let nightErev = hametzDate.subtract({ days: 1 });
				if (hametzDate.dayOfWeek == 6)
					nightErev = nightErev.subtract({ days: 1 });

				highlightPesah.datesToZman.set(hametzDate, {
					bedikatHametz: handleRound(zmanCalc.chainDate(nightErev).getTzet(), 'later'),
					sofZemanBiurHametz: handleRound(zmanCalc.chainDate(hametzDate).getSofZemanBiurHametz(), 'earlier'),
					sofZemanAhilathHametz: handleRound(zmanCalc.chainDate(hametzDate).getSofZemanAhilathHametz(), 'earlier'),
					candleLighting: handleRound(zmanCalc.chainDate(hametzDate).getCandleLighting(), 'earlier'),
				});
				const firstDayYTObj = highlightPesah.datesToZman.get(hametzDate);

				if (hametzDate.dayOfWeek == 6) {
					highlightPesah.title = 'שבת ' + jCal.getHebrewParasha()[0] + ' (הגדול)<br>+ פסח';
					highlightPesah.datesToZman.set(hametzDate.subtract({ days: 1 }), { candleLighting: handleRound(zmanCalc.chainDate(hametzDate.subtract({ days: 1 })).getCandleLighting(), 'earlier') });

					firstDayYTObj.candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(hametzDate).getTzetMelakha()), 'later');
					firstDayYTObj.rabbenuTam = handleRound(zmanCalc.chainDate(hametzDate).getTzetRT(), 'later');
				}

				let hatzotTime = zmanCalc.chainDate(hametzDate).getSolarMidnight().toPlainTime();

				if (x.data.israel) {
					const pesahDate = hametzDate.add({ days: 1 });
					highlightPesah.datesToZman.set(pesahDate,
						pesahDate.dayOfWeek == 5 ?
							{ candleLighting: handleRound(zmanCalc.chainDate(pesahDate).getCandleLighting(), 'earlier') }
							: { tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(pesahDate).getTzetMelakha()), 'later'), rabbenuTam: handleRound(zmanCalc.chainDate(pesahDate).getTzetRT(), 'later') });

					if (pesahDate.dayOfWeek == 5) {
						highlightPesah.datesToZman.set(pesahDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(pesahDate.add({ days: 1 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(pesahDate.add({ days: 1 })).getTzetRT(), 'later')
						});
					}
				} else {
					const pesahDate = hametzDate.add({ days: 1 });
					highlightPesah.datesToZman.set(pesahDate, {
						candleLighting: pesahDate.dayOfWeek == 5 ?
							handleRound(zmanCalc.chainDate(pesahDate).getCandleLighting(), 'earlier') :
							handleRound(zmanCalc.chainDate(pesahDate).getTzetHumra(), 'later')
					});
					const secondDayYTObj = highlightPesah.datesToZman.get(pesahDate);
					if (pesahDate.dayOfWeek == 6) {
						secondDayYTObj.candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(pesahDate).getTzetMelakha()), 'later');
						secondDayYTObj.rabbenuTam = handleRound(zmanCalc.chainDate(pesahDate).getTzetRT(), 'later');
					}

					if (Temporal.PlainTime.compare(hatzotTime, zmanCalc.chainDate(pesahDate).getSolarMidnight().toPlainTime()) == 1)
						hatzotTime = zmanCalc.chainDate(pesahDate).getSolarMidnight().toPlainTime();

					highlightPesah.datesToZman.set(pesahDate.add({ days: 1 }),
						pesahDate.add({ days: 1 }).dayOfWeek == 5
							? { candleLighting: handleRound(zmanCalc.chainDate(pesahDate.add({ days: 1 })).getCandleLighting(), 'earlier') }
							: { tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(pesahDate.add({ days: 1 })).getTzetMelakha()), 'later') });

					if (pesahDate.add({ days: 1 }).dayOfWeek == 5) {
						highlightPesah.title = yomTovObj[WebsiteLimudCalendar.PESACH][x.data.lang]
							+ "<br>+ "
							+ (x.data.lang == 'hb' ? "שבת חול המועד" : "Shabbat Chol Hamoed");
						highlightPesah.datesToZman.set(pesahDate.add({ days: 2 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(pesahDate.add({ days: 2 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(pesahDate.add({ days: 2 })).getTzetRT(), 'later')
						});
					}
				}

				highlightPesah.extra =
					(x.data.lang == 'hb' ? "תשלים הלל לפני " : "Conclude Hallel before ")
					+ hatzotTime.toLocaleString(...defaulTF)
					+ '<br>'
					+ (x.data.lang == 'hb' ? "ממוסף ואילך, אומרים מוריד הטל וברכנו" : "From Mussaf onwards, we say מוריד הטל and ברכנו");

				highlightZmanim.push(highlightPesah);
			}
		} else if ([WebsiteLimudCalendar.EREV_YOM_KIPPUR, WebsiteLimudCalendar.YOM_KIPPUR].includes(jCal.getYomTovIndex())) {
			if (!highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === WebsiteLimudCalendar.YOM_KIPPUR)) {
				const ykDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.YOM_KIPPUR).getDate();

				highlightZmanim.push({
					ytI: WebsiteLimudCalendar.YOM_KIPPUR,
					datesToZman: new Map([[ykDate.subtract({ days: 1 }), {
						mikva: handleRound(zmanCalc.chainDate(ykDate.subtract({ days: 1 })).getSofZemanBiurHametz(), 'later'),
						candleLighting: handleRound(zmanCalc.chainDate(ykDate.subtract({ days: 1 })).getCandleLighting(), 'earlier'),
					}], [ykDate, {
						musaf: handleRound(zmanCalc.chainDate(ykDate).getHatzoth(), 'earlier'),
						birkatKohanim: handleRound(zmanCalc.chainDate(ykDate).getTzet(), 'earlier'),

						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(ykDate).getTzetMelakha()), 'earlier'),
						rabbenuTam: handleRound(zmanCalc.chainDate(ykDate).getTzetRT(), 'later')
					}]])
				});
			}
		} else if (jCal.isTaanis() && !jCal.isYomKippur() || (jCal.tomorrow().isTaanis() && !jCal.tomorrow().isYomKippur())) {
			const taanitCal = (jCal.isTaanis() ? jCal : jCal.tomorrow())
			const taanitDay = taanitCal.getDate();

			if (!highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === taanitCal.getYomTovIndex()))
				highlightZmanim.push({
					ytI: taanitCal.getYomTovIndex(),
					title: (taanitCal.getYomTovIndex() in yomTovObj
						? yomTovObj[taanitCal.getYomTovIndex()][x.data.lang]
						: taanitYomTovNames[taanitCal.getYomTovIndex()]),
					datesToZman: new Map(
						jCal.getJewishMonth() == WebsiteLimudCalendar.AV
							? [[taanitDay.subtract({ days: 1 }), {
								fastStarts: handleRound(zmanCalc.chainDate(taanitDay.subtract({ days: 1 })).getShkiya(), 'earlier')
							}], [taanitDay, {
								fastEnds: handleRound(zmanCalc.chainDate(taanitDay).getTzetHumra(), 'later')
							}]]
							: [[taanitDay, {
								fastStarts: handleRound(zmanCalc.chainDate(taanitDay).getAlotHashahar(), 'earlier'),
								fastEnds: handleRound(zmanCalc.chainDate(taanitDay).getTzetHumra(), 'later')
							}]]
					)
				});
		} else if (([WebsiteLimudCalendar.EREV_SHAVUOS, WebsiteLimudCalendar.SHAVUOS].includes(jCal.getYomTovIndex())
			|| (jCal.getDayOfWeek() == 7 && jCal.chainDate(jCal.getDate().subtract({ days: 1 })).getYomTovIndex() == WebsiteLimudCalendar.SHAVUOS))
			&& !highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === WebsiteLimudCalendar.SHAVUOS)) {

			const erevDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_SHAVUOS).getDate();

			/** @type {highlightedZman} */
			const shavuotObj = {
				ytI: WebsiteLimudCalendar.SHAVUOS,
				datesToZman: new Map([[erevDate, { candleLighting: handleRound(zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier') }]])
			};

			if (erevDate.dayOfWeek == 5) {
				shavuotObj.title = "שבת " + jCal.getHebrewParasha()[0] + "<br>+ " + yomTovObj[WebsiteLimudCalendar.SHAVUOS][x.data.lang]
				shavuotObj.datesToZman.set(
					erevDate.subtract({ days: 1 }),
					{
						candleLighting: handleRound(zmanCalc.chainDate(erevDate.subtract({ days: 1 })).getCandleLighting(), 'earlier')
					}
				);
				shavuotObj.datesToZman.get(erevDate).candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(erevDate).getTzetMelakha()), 'later');
				shavuotObj.datesToZman.get(erevDate).rabbenuTam = handleRound(zmanCalc.chainDate(erevDate).getTzetRT(), 'later');
			}

			const shavuotDate = erevDate.add({ days: 1 });

			const shavuotNetz = zmanCalc.chainDate(shavuotDate).getNetz();
			const shavuotNetzFormat = handleRound(zDTFromFunc(shavuotNetz), shavuotNetz instanceof Temporal.ZonedDateTime ? 'later' : 'noRound')

			if (jCal.getInIsrael()) {
				shavuotObj.datesToZman.set(shavuotDate,
					shavuotDate.dayOfWeek == 5 ?
						{
							netz: shavuotNetzFormat,
							candleLighting: handleRound(zmanCalc.chainDate(shavuotDate).getCandleLighting(), 'earlier')
						} : {
							netz: shavuotNetzFormat,
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(shavuotDate).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(shavuotDate).getTzetRT(), 'later')
						}
				);

				if (shavuotDate.dayOfWeek == 5) {
					shavuotObj.title = yomTovObj[WebsiteLimudCalendar.SHAVUOS][x.data.lang] + "<br>+ שבת " + jCal.getHebrewParasha()[0]
					shavuotObj.datesToZman.set(shavuotDate.add({ days: 1 }), {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(shavuotDate.add({ days: 1 })).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(zmanCalc.chainDate(shavuotDate.add({ days: 1 })).getTzetRT(), 'later')
					});
				}
			} else {
				shavuotObj.datesToZman.set(shavuotDate, {
					netz: shavuotNetzFormat,
					candleLighting: shavuotDate.dayOfWeek == 5 ?
						handleRound(zmanCalc.chainDate(shavuotDate).getCandleLighting(), 'earlier') :
						handleRound(zmanCalc.chainDate(shavuotDate).getTzetHumra(), 'later')
				});
				if (shavuotDate.dayOfWeek == 6) {
					const shabObj = shavuotObj.datesToZman.get(shavuotDate);
					shabObj.candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(shavuotDate).getTzetMelakha()), 'later');
					shabObj.rabbenuTam = handleRound(zmanCalc.chainDate(shavuotDate).getTzetRT(), 'later');
				}

				const secondDayShavuotDate = shavuotDate.add({ days: 1 });
				const dayTShavNetz = zmanCalc.chainDate(secondDayShavuotDate).getNetz();
				const dayTShavNetzFormat = handleRound(zDTFromFunc(dayTShavNetz), dayTShavNetz instanceof Temporal.ZonedDateTime ? 'later' : 'noRound')

				shavuotObj.datesToZman.set(secondDayShavuotDate,
					secondDayShavuotDate.dayOfWeek == 5 ?
						{
							netz: dayTShavNetzFormat,
							candleLighting: handleRound(zmanCalc.chainDate(secondDayShavuotDate).getCandleLighting(), 'earlier')
						} : {
							netz: dayTShavNetzFormat,
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(secondDayShavuotDate).getTzetMelakha()), 'later')
						});

				if (secondDayShavuotDate.dayOfWeek == 6)
					shavuotObj.datesToZman.get(secondDayShavuotDate).rabbenuTam = handleRound(zmanCalc.chainDate(secondDayShavuotDate).getTzetRT(), 'later');
				else if (secondDayShavuotDate.dayOfWeek == 5) {
					shavuotObj.title = yomTovObj[WebsiteLimudCalendar.SHAVUOS][x.data.lang] + "<br>+ שבת " + jCal.getHebrewParasha()[0]
					shavuotObj.datesToZman.set(shavuotDate.add({ days: 2 }), {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(shavuotDate.add({ days: 2 })).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(zmanCalc.chainDate(shavuotDate.add({ days: 2 })).getTzetRT(), 'later')
					});
				}
			}

			highlightZmanim.push(shavuotObj);
		} else if ([WebsiteLimudCalendar.EREV_ROSH_HASHANA, WebsiteLimudCalendar.ROSH_HASHANA].includes(jCal.getYomTovIndex())
			&& !highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === WebsiteLimudCalendar.ROSH_HASHANA)) {
			const erevRoshHashanaDate = jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_ROSH_HASHANA
				? jCal.getDate()
				: jCal.chainJewishDate(jCal.getJewishYear() - 1, WebsiteLimudCalendar.ELUL, 29).getDate();
			const roshHashanaDate = erevRoshHashanaDate.add({ days: 1 });

			/** @type {highlightedZman} */
			const roshHashanaObj = {
				ytI: WebsiteLimudCalendar.ROSH_HASHANA,
				datesToZman: new Map([
					[erevRoshHashanaDate, {
						mikva: handleRound(zmanCalc.chainDate(erevRoshHashanaDate).getSofZemanBiurHametz(), 'later'),
						candleLighting: handleRound(zmanCalc.chainDate(erevRoshHashanaDate).getCandleLighting(), 'earlier')
					}],
					[roshHashanaDate, {
						candleLighting: handleRound(zmanCalc.chainDate(roshHashanaDate).getTzetHumra(), 'later')
					}]
				])
			};

			if (erevRoshHashanaDate.dayOfWeek == 3) {
				roshHashanaObj.title = yomTovObj[WebsiteLimudCalendar.ROSH_HASHANA] + "<br>שבת שובה" + jCal.getHebrewParasha()[0];
				roshHashanaObj.datesToZman.set(erevRoshHashanaDate.add({ days: 2 }), {
					candleLighting: handleRound(zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 2 })).getCandleLighting(), 'earlier')
				})
				roshHashanaObj.datesToZman.set(erevRoshHashanaDate.add({ days: 3 }), {
					tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 3 })).getTzetMelakha()), 'later'),
					rabbenuTam: handleRound(zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 3 })).getTzetRT(), 'later')
				})
			} else {
				if (erevRoshHashanaDate.dayOfWeek == 5) {
					const shabbatObj = roshHashanaObj.datesToZman.get(roshHashanaDate);
					shabbatObj.candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(roshHashanaDate).getTzetMelakha()), 'later');
					shabbatObj.rabbenuTam = handleRound(zmanCalc.chainDate(roshHashanaDate).getTzetRT(), 'later');
				}

				roshHashanaObj.datesToZman.set(erevRoshHashanaDate.add({ days: 2 }), {
					tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 2 })).getTzetMelakha()), 'later')
					//rabbenuTam: zmanCalc.chainDate(erevRoshHashanaDate.add({ days: 2 })).getTzetRT()
				});
			}

			highlightZmanim.push(roshHashanaObj);
		} else if ([WebsiteLimudCalendar.EREV_SUCCOS, WebsiteLimudCalendar.SUCCOS].includes(jCal.getYomTovIndex())
			&& !highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === WebsiteLimudCalendar.SUCCOS)) {
			const erevDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_SUCCOS).getDate();

			/** @type {highlightedZman} */
			const sukkothObj = {
				ytI: WebsiteLimudCalendar.SUCCOS,
				datesToZman: new Map([[erevDate, {
					candleLighting: handleRound(zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier')
				}]])
			};

			const sukkothDate = erevDate.add({ days: 1 });
			if (jCal.getInIsrael()) {
				sukkothObj.datesToZman.set(sukkothDate, {
					tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(sukkothDate).getTzetMelakha()), 'later'),
					rabbenuTam: handleRound(zmanCalc.chainDate(sukkothDate).getTzetRT(), 'later')
				})
			} else {
				sukkothObj.datesToZman.set(sukkothDate, {
					candleLighting: handleRound(zmanCalc.chainDate(sukkothDate).getTzetHumra(), 'later')
				});

				if (sukkothDate.dayOfWeek == 5) {
					sukkothObj.title = yomTovObj[WebsiteLimudCalendar.SUCCOS][x.data.lang]
						+ "<br>+ "
						+ (x.data.lang == 'hb' ? "שבת חול המועד" : "Shabbat Chol Hamoed");

					sukkothObj.datesToZman.set(sukkothDate.add({ days: 1 }), {
						candleLighting: handleRound(zmanCalc.chainDate(sukkothDate.add({ days: 1 })).getCandleLighting(), 'earlier')
					});
					sukkothObj.datesToZman.set(sukkothDate.add({ days: 2 }), {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(sukkothDate.add({ days: 2 })).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(zmanCalc.chainDate(sukkothDate.add({ days: 2 })).getTzetRT(), 'later')
					});
				} else {
					if (sukkothDate.dayOfWeek == 6) {
						sukkothObj.datesToZman.get(sukkothDate).candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(sukkothDate).getTzetMelakha()), 'later');
						sukkothObj.datesToZman.get(sukkothDate).rabbenuTam = handleRound(zmanCalc.chainDate(sukkothDate).getTzetRT(), 'later')
					}
					sukkothObj.datesToZman.set(sukkothDate.add({ days: 1 }), {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(sukkothDate.add({ days: 1 })).getTzetMelakha()), 'later')
					});
				}
			}

			highlightZmanim.push(sukkothObj);
		} else if ([
			WebsiteLimudCalendar.HOSHANA_RABBA,
			WebsiteLimudCalendar.SHEMINI_ATZERES,
			WebsiteLimudCalendar.SIMCHAS_TORAH
		].includes(jCal.getYomTovIndex())) {
			if (!highlightZmanim.some(hz => 'ytI' in hz && hz.ytI === WebsiteLimudCalendar.SHEMINI_ATZERES)) {
				const erevDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.HOSHANA_RABBA).getDate();

				/** @type {highlightedZman} */
				const sheminiObj = {
					ytI: WebsiteLimudCalendar.SHEMINI_ATZERES,
					datesToZman: new Map([[erevDate, {
						candleLighting: handleRound(zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier')
					}]])
				};

				const sheminiDate = jCal.chainYomTovIndex(WebsiteLimudCalendar.SHEMINI_ATZERES).getDate();
				if (jCal.getInIsrael()) {
					sheminiObj.datesToZman.set(sheminiDate, {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(sheminiDate).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(zmanCalc.chainDate(sheminiDate).getTzetRT(), 'later')
					})
				} else {
					sheminiObj.datesToZman.set(sheminiDate, {
						candleLighting: handleRound(zmanCalc.chainDate(sheminiDate).getTzetHumra(), 'later')
					});

					if (sheminiDate.dayOfWeek == 5) {
						sheminiObj.title = yomTovObj[WebsiteLimudCalendar.SUCCOS][x.data.lang]
							+ "<br>+ "
							+ "שבת בראשית";

						sheminiObj.datesToZman.set(sheminiDate.add({ days: 1 }), {
							candleLighting: handleRound(zmanCalc.chainDate(sheminiDate.add({ days: 1 })).getCandleLighting(), 'earlier')
						});
						sheminiObj.datesToZman.set(sheminiDate.add({ days: 2 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(sheminiDate.add({ days: 2 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(sheminiDate.add({ days: 2 })).getTzetRT(), 'later')
						});
					} else {
						if (sheminiDate.dayOfWeek == 6) {
							sheminiObj.datesToZman.get(sheminiDate).candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(sheminiDate).getTzetMelakha()), 'later');
							sheminiObj.datesToZman.get(sheminiDate).rabbenuTam = handleRound(zmanCalc.chainDate(sheminiDate).getTzetRT(), 'later');
						}
						sheminiObj.datesToZman.set(sheminiDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(sheminiDate.add({ days: 1 })).getTzetMelakha()), 'later')
						});
					}
				}

				highlightZmanim.push(sheminiObj);
			}
		} else if ((jCal.isErevYomTov() && jCal.isCholHamoedPesach()) || (jCal.getYomTovIndex() == WebsiteLimudCalendar.PESACH && jCal.getJewishDayOfMonth() > 18)) {
			// Handle second day Yom Tov. We find Erev Yom Tov of Pesach by checking for the last day of Chol Hamoed Pesach
			const erevDate = jCal.chainJewishDate(jCal.getJewishYear(), WebsiteLimudCalendar.NISSAN, 20).getDate();

			if (!highlightZmanim.some(hz => hz.datesToZman.keys().find(d => Temporal.PlainDate.compare(d, erevDate) == 0))) {
				/** @type {highlightedZman} */
				const pesahObj = {
					ytI: WebsiteLimudCalendar.PESACH,
					title: yomTovObj[WebsiteLimudCalendar.PESACH][x.data.lang]
						+ "<br>("
						+ (x.data.lang == 'hb' ? "אחרון" : "Last Days") + ")",
					datesToZman: new Map([[erevDate, {
						candleLighting: handleRound(zmanCalc.chainDate(erevDate).getCandleLighting(), 'earlier')
					}]])
				};

				const yomTovDate = erevDate.add({ days: 1 });
				if (jCal.getInIsrael()) {
					if (yomTovDate.dayOfWeek == 5) {
						pesahObj.title = yomTovObj[WebsiteLimudCalendar.PESACH][x.data.lang]
							+ "<br>+ "
							+ "שבת " + jCal.getHebrewParasha()[0];
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(zmanCalc.chainDate(yomTovDate).getCandleLighting(), 'earlier')
						});

						pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetRT(), 'later')
						});
					} else {
						pesahObj.datesToZman.set(yomTovDate, {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(yomTovDate).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(yomTovDate).getTzetRT(), 'later')
						});
					}
				} else {
					if (yomTovDate.dayOfWeek == 6) {
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(zDTFromFunc(zmanCalc.chainDate(yomTovDate).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(yomTovDate).getTzetRT(), 'later')
						});
						pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later'),
						});
					} else if (yomTovDate.dayOfWeek == 5) {
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(zmanCalc.chainDate(yomTovDate).getCandleLighting(), 'earlier')
						});
						pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetRT(), 'later')
						});
					} else {
						pesahObj.datesToZman.set(yomTovDate, {
							candleLighting: handleRound(zmanCalc.chainDate(yomTovDate).getTzetHumra(), 'later')
						});

						if (yomTovDate.dayOfWeek == 4) {
							pesahObj.title = yomTovObj[WebsiteLimudCalendar.PESACH][x.data.lang]
								+ "<br>+ "
								+ "שבת " + jCal.getHebrewParasha()[0];
							pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
								candleLighting: handleRound(zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getCandleLighting(), 'earlier')
							});
							pesahObj.datesToZman.set(yomTovDate.add({ days: 2 }), {
								tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(yomTovDate.add({ days: 2 })).getTzetMelakha()), 'later'),
								rabbenuTam: handleRound(zmanCalc.chainDate(yomTovDate.add({ days: 2 })).getTzetRT(), 'later')
							});
						} else {
							pesahObj.datesToZman.set(yomTovDate.add({ days: 1 }), {
								tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(yomTovDate.add({ days: 1 })).getTzetMelakha()), 'later')
							});
						}
					}
				}

				highlightZmanim.push(pesahObj);
			}
		} else if
			((jCal.getDayOfWeek() === 7 && !jCal.isYomTovAssurBemelacha() && !jCal.isErevYomTov() && !jCal.chainDate(jCal.getDate().subtract({ days: 1 })).isYomTovAssurBemelacha())
			|| jCal.getDayOfWeek() === 6 && !jCal.isYomTovAssurBemelacha() && !jCal.tomorrow().isErevYomTov() && !jCal.tomorrow().isYomTovAssurBemelacha()) {
			const shabbatJCal = jCal.shabbat();
			const title =
				"שבת "
				+ (shabbatJCal.isCholHamoed() ? "חול המועד" : jCal.getHebrewParasha()[0])
				+ (![Parsha.NONE, Parsha.NACHAMU, Parsha.CHAZON, Parsha.SHIRA].includes(shabbatJCal.getSpecialShabbos())
					? ("<div class='specialShabPar'>(" + jCal.getHebrewParasha()[1] + ")</div>") : "")

			if (!highlightZmanim.some(high => high.title === title)) {
				let extra = `<i class="bi bi-music-note-beamed"></i> ${x.data.lang == 'hb' ? 'מקאם' : 'Makam'}: ` + makamIndex.getTodayMakam(shabbatJCal).makam
					.map(mak => (typeof mak == "number" ? makamObj[(x.data.lang == 'hb' ? 'makamNameMapHeb' : 'makamNameMapEng')][mak] : mak))
					.join(" / ");

				if (shabbatJCal.isShabbosMevorchim()) {
					const roshHodeshJCal = shabbatJCal.clone();
					roshHodeshJCal.setDate(roshHodeshJCal.getDate().add({ weeks: 2 }));
					roshHodeshJCal.setJewishDayOfMonth(1);

					if (x.data.lang == 'hb') {
						let dayOfWeek = n2hebDateOrdinal(roshHodeshJCal.getDate().dayOfWeek);
						roshHodeshJCal.setDate(roshHodeshJCal.getDate().subtract({ days: 1 }));
						if (roshHodeshJCal.getJewishDayOfMonth() == 30)
							dayOfWeek = n2hebDateOrdinal(roshHodeshJCal.getDate().dayOfWeek) + " ו" + dayOfWeek;

						extra += "<br> <i class='bi bi-moon-fill'></i> ראש חודש "
							+ shabbatJCal.chainDate(shabbatJCal.getDate().add({ weeks: 2 })).formatJewishMonth().he
							+ " ביום " + dayOfWeek;
					} else {
						let dayOfWeek = roshHodeshJCal.getDayOfTheWeek().en;
						roshHodeshJCal.setDate(roshHodeshJCal.getDate().subtract({ days: 1 }));
						if (roshHodeshJCal.getJewishDayOfMonth() == 30)
							dayOfWeek = roshHodeshJCal.getDayOfTheWeek().en + " / " + dayOfWeek;

						extra += "<br> <i class='bi bi-moon-fill'></i> New month "
							+ shabbatJCal.chainDate(shabbatJCal.getDate().add({ weeks: 2 })).formatJewishMonth().en
							+ " on " + dayOfWeek;
					}
				}

				highlightZmanim.push({
					title,
					extra,
					datesToZman: new Map([[shabbatJCal.getDate().subtract({ days: 1 }), {
						candleLighting: handleRound(zmanCalc.chainDate(shabbatJCal.getDate().subtract({ days: 1 })).getCandleLighting(), 'earlier')
					}], [shabbatJCal.getDate(), {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(shabbatJCal.getDate()).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(zmanCalc.chainDate(shabbatJCal.getDate()).getTzetRT(), 'later')
					}]])
				});
			}

			//if (jCal.tomorrow().isChanukah()) {
			/** @type {highlightedZman} */
			/*let hanukahObj = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.CHANUKAH);
			if (!hanukahObj) {
				hanukahObj = {
					ytI: WebsiteLimudCalendar.CHANUKAH,
					datesToZman: new Map()
				}
				highlightZmanim.push(hanukahObj);
			}

			if (plainDateForceCal.dayOfWeek == 6)
				hanukahObj.datesToZman.set(plainDateForceCal, {
					candleLighting: handleRound(zDTFromFunc(zmanCalc.chainDate(plainDateForceCal).getTzetMelakha()), 'later'),
					rabbenuTam: handleRound(zmanCalc.chainDate(plainDateForceCal).getTzetRT(), 'later')
				})
			else if (plainDateForceCal.dayOfWeek == 5)
				hanukahObj.datesToZman.set(plainDateForceCal, {
					candleLighting: handleRound(zmanCalc.chainDate(plainDateForceCal).getCandleLighting(), 'earlier')
				});
			else
				hanukahObj.datesToZman.set(plainDateForceCal, {
					candleLighting: handleRound(zmanCalc.chainDate(plainDateForceCal).getTzet(), 'later')
				});
		} */
		}
	}

	let initTekuf = zmanCalc.nextTekufa(zmanCalc.config.fixedMil);

	const addedZemanim = Object.fromEntries(x.data.addedZemanim.map(str => [str.split('|')[0], {}]))

	const weekdayList = [...document.getElementsByClassName('templateZmanimWeekDay')];
	weekdayList.forEach((weekdayElem, index) => {
		const plainDate = baseDate.add({ days: index });
		jCal.setDate(plainDate.withCalendar("iso8601"))
		zmanCalc.setDate(plainDate.withCalendar("iso8601"));

		populateHighlightZmanim();

		const dateText = [jCal.getDate().toLocaleString('en', { month: "long" }) + " " +
			getOrdinal(jCal.getGregorianDayOfMonth(), "html"),
		hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " +
		jCal.getDate().toLocaleString('he-u-ca-hebrew', { month: 'long' })];
		if (x.data.lang == "hb")
			dateText.reverse()

		const dateTextElem = weekdayElem.querySelector('.templateDateInner')
		dateTextElem.innerHTML = dateText.join("<br>")

		const specialElems = [];

		if (jCal.getDayOfWeek() === 7 && jCal.getParshah() in WebsiteLimudCalendar.hebrewParshaMap && WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]) {
			specialElems.push(WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]);
		}

		if (jCal.isRoshChodesh()) {
			specialElems.push({
				'hb': "ראש חדש",
				"en-et": "Rosh Ḥodesh",
				'en': "New Month"
			}[x.data.lang])
		}

		if (jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY
			&& jCal.getJewishMonth() == KosherZmanim.JewishDate[(jCal.isJewishLeapYear() ? "ADAR_II" : "ADAR")]
			&& jCal.getJewishDayOfMonth() == 16) {
			specialElems.push(x.data.lang == "hb" ? "פורים משולש" : "Purim Meshulash");
		}

		if (jCal.tomorrow().getDayOfChanukah() !== -1) {
			specialElems.push(
				x.data.lang == "hb" ? "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()] + " של חנוכה"
					: getOrdinal(jCal.tomorrow().getDayOfChanukah(), 'svg') + " night of חנוכה");
		} else if (jCal.getDayOfChanukah() == 8) {
			specialElems.push({
				"hb": "זאת חנוכה",
				"en": "Ḥanuka Day",
				"en-et": "Yom Ḥanuka"
			}[x.data.lang]);

		}

		if (jCal.isBirkasHachamah()) {
			specialElems.push({
				'hb': "ברכת החמה",
				"en-et": "Birkath Haḥama",
				'en': "Blessing of the Sun"
			}[x.data.lang]);
		}

		if (jCal.getYomTovIndex() in yomTovObj) {
			specialElems.push(yomTovObj[jCal.getYomTovIndex()][x.data.lang]);
		} else if (jCal.isTaanis()) {
			specialElems.push(x.data.lang == 'hb' ? "צום" : "Fast")
		}

		const specialText = weekdayElem.querySelector('text.specialDaysText')
		const svg = weekdayElem.querySelector('svg.templateDate')

		// Generate arc paths dynamically
		specialElems
			.sort((aStr, bStr) => bStr.replace(/<\/?tspan\b[^>]*>/gi, '').length - aStr.replace(/<\/?tspan\b[^>]*>/gi, '').length)
			.forEach((elem, i) => {
				// Create a new path for each line
				const arcPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				const arcId = `arcBottom-${weekdayElem.dataset.dayIndex}-${i}`;

				// Adjust y position and radius for each line
				const yPos = 74 - (i * 8);
				const radius = 38 + (i * 2);

				arcPath.setAttribute('id', arcId);
				arcPath.setAttribute('d', `M ${15 - i},${yPos} A ${radius},${radius} 0 0,0 ${85 + i},${yPos}`);
				arcPath.setAttribute('fill', 'none');

				svg.appendChild(arcPath);

				// Create textPath pointing to this arc
				const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
				textPath.setAttribute('href', `#${arcId}`);
				textPath.setAttribute('startOffset', '50%');
				textPath.setAttribute('text-anchor', 'middle');
				textPath.innerHTML = specialElems.length == 1 ? elem : elem.replace(/<\/?tspan\b[^>]*>/gi, '');

				specialText.appendChild(textPath);
			});

		for (const zmanRow of weekdayElem.getElementsByClassName("zman-row")) {
			handleShita(zmanRow);
		}

		for (const shitaFull of x.data.addedZemanim) {
			const [shita, round] = shitaFull.split("|")
			if (shitaFull == "get72Seasonal")
				addedZemanim[shitaFull][plainDate.toString()] = handleRound(zmanCalc.timeRange.current.tzethakokhavim, "later").toLocaleString(...defaulTF);
			else if (shitaFull == "rambamYomi") {
				const rambamLimud = KosherZmanim.DailyMishnehTorah.getDailyLearning(plainDate.withCalendar("iso8601"))
				addedZemanim[shitaFull][plainDate.toString()] =
					"<b>" + rambamLimud.bookName + "</b>"
					+ " - "
					+ rambamLimud.chapters
					.map(num => x.data.lang == "hb" ? hNum.formatHebrewNumber(num) : num)
					.join('-')
			} else
				addedZemanim[shita][plainDate.toString()] = handleRound(zmanCalc[shita](), round).toLocaleString(...(round == "noRound" ? sunriseTF : defaulTF))
		}
	})

	const dateRangeHeaderElem = document.getElementsByClassName('secondPageHeader')[0]

	// Helper to check if a date is the first day of its year
	const isFirstDayOfYear = (/** @type {Temporal.PlainDate} */ date) => date.dayOfYear === 1;

	// Helper to check if a date is the last day of its year
	const isLastDayOfYear = (/** @type {Temporal.PlainDate} */ date) => date.dayOfYear === date.daysInYear;

	const dateRange = [0, weekdayList.length - 1]
		.map(num => baseDate.add({ days: num }).withCalendar('iso8601'));

	const startIsFirstDay = isFirstDayOfYear(dateRange[0]);
	const endIsLastDay = isLastDayOfYear(dateRange[1]);
	const yearChanged = dateRange[0].year !== dateRange[1].year;

	if (dateRange[0].month == dateRange[1].month) {
		dateRangeHeaderElem.firstElementChild.innerHTML =
			dateRange[1].toLocaleString('en', { month: 'long' })
			+ " "
			+ getOrdinal(dateRange[0].day, "html")
			+ "-"
			+ getOrdinal(dateRange[1].day, "html")
			+ (yearChanged || startIsFirstDay || endIsLastDay ? ` ${dateRange[1].year}` : '');
	} else if (dateRange[0].year == dateRange[1].year && !startIsFirstDay && !endIsLastDay) {
		dateRangeHeaderElem.firstElementChild.innerHTML =
			dateRange[0].toLocaleString('en', { month: 'short' })
			+ ". "
			+ getOrdinal(dateRange[0].day, "html")
			+ " - "
			+ dateRange[1].toLocaleString('en', { month: 'long' })
			+ " "
			+ getOrdinal(dateRange[1].day, "html");
	} else {
		// Year changed, or first day of year, or last day of year
		dateRangeHeaderElem.firstElementChild.innerHTML =
			dateRange[0].toLocaleString('en', { month: 'short' })
			+ ". "
			+ getOrdinal(dateRange[0].day, "html")
			+ (startIsFirstDay || yearChanged ? ` ${dateRange[0].year}` : '')
			+ " - "
			+ dateRange[1].toLocaleString('en', { month: 'long' })
			+ " "
			+ getOrdinal(dateRange[1].day, "html")
			+ (yearChanged || endIsLastDay ? ` ${dateRange[1].year}` : '');
	}

	const dateRangeHeb = [...dateRange].map(plainDate => plainDate.withCalendar("hebrew"));

	const startIsFirstDayHeb = isFirstDayOfYear(dateRangeHeb[0]);
	const endIsLastDayHeb = isLastDayOfYear(dateRangeHeb[1]);
	const yearChangedHeb = dateRangeHeb[0].year !== dateRangeHeb[1].year;

	if (dateRangeHeb[0].month == dateRangeHeb[1].month) {
		dateRangeHeaderElem.lastElementChild.innerHTML =
			hNum.formatHebrewNumber(dateRangeHeb[0].day)
			+ "-"
			+ hNum.formatHebrewNumber(dateRangeHeb[1].day)
			+ " "
			+ dateRangeHeb[1].toLocaleString('he-u-ca-hebrew', { month: 'long' })
			+ (yearChangedHeb || startIsFirstDayHeb || endIsLastDayHeb ? " " + hNum.formatHebrewNumber(dateRangeHeb[1].year) : '');
	} else if (dateRangeHeb[0].year == dateRangeHeb[1].year && !startIsFirstDayHeb && !endIsLastDayHeb) {
		dateRangeHeaderElem.lastElementChild.innerHTML =
			hNum.formatHebrewNumber(dateRangeHeb[0].day)
			+ " "
			+ dateRangeHeb[0].toLocaleString('he-u-ca-hebrew', { month: 'long' })
			+ " - "
			+ hNum.formatHebrewNumber(dateRangeHeb[1].day)
			+ " "
			+ dateRangeHeb[1].toLocaleString('he-u-ca-hebrew', { month: 'long' });
	} else {
		// Year changed, or first day of year, or last day of year
		dateRangeHeaderElem.lastElementChild.innerHTML =
			hNum.formatHebrewNumber(dateRangeHeb[0].day)
			+ " "
			+ dateRangeHeb[0].toLocaleString('he-u-ca-hebrew', { month: 'long' })
			+ (startIsFirstDayHeb || yearChangedHeb ? " " + hNum.formatHebrewNumber(dateRangeHeb[0].year) : '')
			+ " - "
			+ hNum.formatHebrewNumber(dateRangeHeb[1].day)
			+ " "
			+ dateRangeHeb[1].toLocaleString('he-u-ca-hebrew', { month: 'long' })
			+ (yearChangedHeb || endIsLastDayHeb ? " " + hNum.formatHebrewNumber(dateRangeHeb[1].year) : '');
	}

	const bavliFinder = document.querySelector('[data-learningInsert=bavli]')
	if (bavliFinder)
		bavliFinder.appendChild(document.createTextNode(hNum.formatDafYomiRange(
			KosherZmanim.DafYomiCalculator.getDafYomiRange(new KosherZmanim.JewishDate(dateRange[0]), new KosherZmanim.JewishDate(dateRange[1]))
		)))

	const yerushalmiFinder = document.querySelector('[data-learningInsert=yerushalmi]')
	if (yerushalmiFinder)
		yerushalmiFinder.appendChild(document.createTextNode(hNum.formatDafYerushalmiYomiRange(
			...Object.values(KosherZmanim.YerushalmiYomiCalculator.formatDafRange(new KosherZmanim.JewishDate(dateRange[0]), new KosherZmanim.JewishDate(dateRange[1])))
		)))

	const halachaFinder = document.querySelector('[data-learningInsert=halacha]')
	if (halachaFinder)
		halachaFinder.insertAdjacentHTML('beforeend',
			KosherZmanim.HalachaYomi.getWeeklyCompact(jCal.chainDate(dateRange[0]))
				.replaceAll('שו"ע - או"ח', 'שו"ע <span style="font-size: .7em">(או"ח)</span>')
		);

	const mishnaFinder = document.querySelector('[data-learningInsert=mishna]')
	if (mishnaFinder)
		mishnaFinder.appendChild(document.createTextNode(
			KosherZmanim.MishnaYomi.getMishnaRangeSummary(new KosherZmanim.JewishDate(dateRange[0]), new KosherZmanim.JewishDate(dateRange[1]), true)
		));

	const tuBishvat = jCal.chainYomTovIndex(WebsiteLimudCalendar.TU_BESHVAT);
	const purimKatan = jCal.chainYomTovIndex(WebsiteLimudCalendar.PURIM_KATAN);
	const purim = jCal.chainYomTovIndex(WebsiteLimudCalendar.PURIM);
	const pesahSheni = jCal.chainYomTovIndex(WebsiteLimudCalendar.PESACH_SHENI);
	const lagBaomer = jCal.chainYomTovIndex(WebsiteLimudCalendar.LAG_BAOMER);
	const lastDayOfNoTachanunSivan = jCal.chainJewishDate(jCal.getJewishYear(), WebsiteLimudCalendar.SIVAN, 12);
	const tishaBeavJCal = jCal.chainYomTovIndex(WebsiteLimudCalendar.TISHA_BEAV);
	const tuBeavJCal = jCal.chainYomTovIndex(WebsiteLimudCalendar.TU_BEAV);
	const erevRH = jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_ROSH_HASHANA);
	const tachanunAffectedMonths = [
		{
			month: WebsiteLimudCalendar.KISLEV,
			message: (x.data.lang == "hb" ? "אין אומרים תחנון בחנוכה" : "No Taḥanun said throughout Ḥanukka"),
			endDay: jCal.isKislevShort() ? 29 : 30,
			startDay: 17
		},
		{
			month: WebsiteLimudCalendar.TEVES,
			message: (x.data.lang == "hb" ? "אין אומרים תחנון בחנוכה" : "No Taḥanun said throughout Ḥanukka"),
			endDay: jCal.isKislevShort() ? 3 : 2,
			startDay: 0
		},
		{
			month: WebsiteLimudCalendar.SHEVAT,
			message: {
				"hb": "אין אומרים תחנון בט״ו בשבט",
				"en": "No Taḥanun said on " + tuBishvat.formatFancyDate().en + " (15<sup>th</sup> of Shevat)",
				"en-et": "No Taḥanun said on " + tuBishvat.formatFancyDate().en + " (Tu Bi'Shevat)",
			}[x.data.lang],
			endDay: 15,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.ADAR,
			message: {
				"hb": "אין אומרים תחנון בפורים",
				"en": "No Taḥanun said on "
					+ purimKatan.formatFancyDate().en + ` (Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})<br>& `
					+ purimKatan.tomorrow().formatFancyDate().en + ` (Shushan Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})`,
				"en-et": "No Taḥanun said on "
					+ purimKatan.formatFancyDate().en + ` (Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})<br>& `
					+ purimKatan.tomorrow().formatFancyDate().en + ` (Shushan Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})`,
			}[x.data.lang],
			endDay: 15,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.ADAR_II,
			message: {
				"hb": "אין אומרים תחנון בפורים",
				"en": "No Taḥanun said on "
					+ purim.formatFancyDate().en + ` (${yomTovObj[purim.getYomTovIndex()].en})<br>& `
					+ purim.tomorrow().formatFancyDate().en + ` (${yomTovObj[purim.tomorrow().getYomTovIndex()].en})`,
				"en-et": "No Taḥanun said on "
					+ purim.formatFancyDate().en + ` (${yomTovObj[purim.getYomTovIndex()].en})<br>& `
					+ purim.tomorrow().formatFancyDate().en + ` (${yomTovObj[purim.tomorrow().getYomTovIndex()].en})`,
			}[x.data.lang],
			endDay: 15,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.NISSAN,
			message: (x.data.lang == "hb" ? "אין אומרים תחנון כל החודש" : "No Taḥanun said throughout the month"),
			endDay: 30,
			startDay: 0
		},
		{
			month: WebsiteLimudCalendar.IYAR,
			message: {
				"hb": "אין אומרים תחנון בפסח שני ולג בעומר",
				"en": "No Taḥanun said on "
					+ pesahSheni.formatFancyDate().en + ` (${yomTovObj[pesahSheni.getYomTovIndex()].en}) & `
					+ lagBaomer.formatFancyDate().en + ` (${yomTovObj[lagBaomer.getYomTovIndex()].en})`,
				"en-et": "No Taḥanun said on"
					+ pesahSheni.formatFancyDate().en + ` (${yomTovObj[pesahSheni.getYomTovIndex()].en}) & `
					+ lagBaomer.formatFancyDate().en + ` (${yomTovObj[lagBaomer.getYomTovIndex()].en})`,
			}[x.data.lang],
			endDay: 18,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.SIVAN,
			message: {
				"hb": "אין אומרים תחנון מראש חודש עד י״ב בסיון)",
				"en": "No Taḥanun said from Rosh Ḥodesh until " + lastDayOfNoTachanunSivan.formatFancyDate().en + ` (12<sup>th</sup> of Sivan)`,
				"en-et": "No Taḥanun said from Rosh Ḥodesh until " + lastDayOfNoTachanunSivan.formatFancyDate().en + ` (12<sup>th</sup> of Sivan)`,
			}[x.data.lang],
			endDay: 12,
			startDay: 0
		},
		{
			month: WebsiteLimudCalendar.AV,
			message: {
				"en": "No Taḥanun said on " + tishaBeavJCal.formatFancyDate().en + " (9<sup>th</sup> of Av) and " + tuBeavJCal.formatFancyDate().en + " (15<sup>th</sup> of Av)",
				"hb": "אין אומרים תחנון בתשעה באב ובט״ו באב",
				"en-et": "No Taḥanun said on " + tishaBeavJCal.formatFancyDate().en + " (Tish'a B'Av) and " + tuBeavJCal.formatFancyDate().en + " (Tu B'Av)",
			}[x.data.lang],
			endDay: 15,
			startDay: 2,
		},
		{
			month: WebsiteLimudCalendar.ELUL,
			message: {
				"hb": "אין אומרים תחנון בערב ראש השנה",
				"en": "No Taḥanun said on " + erevRH.formatFancyDate().en + " (Erev Rosh Ha'Shana)",
				"en-et": "No Taḥanun said on " + erevRH.formatFancyDate().en + " (Erev Rosh Ha'Shana)",
			}[x.data.lang],
			endDay: 29,
			startDay: 21
		}
	]

	/**
	 * @param {Temporal.PlainDate[]} dateRange - Array of dates for the week
	 * @returns {string|null} - The tachanun message, or null if no applicable restriction
	 */
	function checkTachanunRestriction(dateRange, localJCal = jCal) {
		const restriction = tachanunAffectedMonths.find(restriction =>
			dateRange.some(date => {
				const dateCal = localJCal.chainDate(date);
				const jewishMonth = dateCal.getJewishMonth();
				const jewishDay = dateCal.getJewishDayOfMonth();
				const startDay = restriction.startDay === 0 ? 1 : restriction.startDay;

				return jewishMonth === restriction.month &&
					jewishDay >= startDay &&
					jewishDay <= restriction.endDay;
			})
		);

		return restriction?.message ?? null;
	}

	const isRoshHodeshWeek = (
		dateRangeHeb[0].month !== dateRangeHeb[1].month
		|| dateRangeHeb[0].day == 1
		|| dateRangeHeb[1].day == 30
	)
	function handleRoshHodesh() {
		const newMonthCal = jCal.clone();
		newMonthCal.setDate(newMonthCal.getDate().add({ weeks: 1 }));
		newMonthCal.setJewishDayOfMonth(1);

		const molad = newMonthCal.getMoladAsDate().withTimeZone(geoLocation.getTimeZone()).withCalendar("iso8601")

		const rHElems = {
			container: document.createElement("div"),
			title: document.createElement("h5"),
			specialList: document.createElement("ul")
		}
		rHElems.container.appendChild(rHElems.title);
		rHElems.container.appendChild(rHElems.specialList);

		rHElems.title.classList.add("mb-0")
		if (x.data.lang == 'hb') {
			let dayOfWeek = n2hebDateOrdinal(newMonthCal.getDate().dayOfWeek);
			if (newMonthCal.getDate().subtract({ days: 1 }).withCalendar("hebrew").day == 30)
				dayOfWeek = n2hebDateOrdinal(newMonthCal.getDate().subtract({ days: 1 }).dayOfWeek) + " ו" + dayOfWeek;

			rHElems.title.innerHTML = "ראש חודש " + newMonthCal.formatJewishMonth().he + " - " + dayOfWeek;
		} else {
			let dayOfWeek = newMonthCal.formatFancyDate().en;
			const potentialTDayRH = newMonthCal.getDate().subtract({ days: 1 });
			if (potentialTDayRH.withCalendar("hebrew").day == 30)
				dayOfWeek = "<br><span style='font-size: .8em'>"
					+ WebsiteLimudCalendar.formatFancyDate(potentialTDayRH).en + " & " + dayOfWeek
					+ "</span>";

			rHElems.title.innerHTML = (x.data.lang == "en" ? "New Month of " : "Rosh Ḥodesh ")
				+ newMonthCal.formatJewishMonth().en
				+ " - "
				+ dayOfWeek;
		}

		const moladListItem = document.createElement("li");
		moladListItem.classList.add("rec")
		moladListItem.appendChild(document.createTextNode("Molad: " + molad.toLocaleString(...dtFBLevana)))
		rHElems.specialList.appendChild(moladListItem);

		let erevHodesh = newMonthCal.getDate().withCalendar("hebrew").subtract({ days: 1 });
		if (erevHodesh.day == 30)
			erevHodesh = erevHodesh.subtract({ days: 1 });
		erevHodesh = erevHodesh.withCalendar("iso8601")

		const tikkunHatzotRange = [
			zmanCalc.chainDate(erevHodesh.subtract({ days: 1 })).getSolarMidnight(),
			zmanCalc.chainDate(erevHodesh).getAlotHashahar()
		]

		const eRHCal = jCal.chainDate(erevHodesh);
		if (eRHCal.tefilahRules().tachanun == 1 && eRHCal.getDayOfWeek() !== 7 && Temporal.ZonedDateTime.compare(molad, tikkunHatzotRange[1]) < 0) {
			// Add main entry
			const li = document.createElement("li");
			li.innerHTML = `Omit תיקון רחל on Erev Rosh Ḥodesh (${eRHCal.formatFancyDate().en})`;
			rHElems.specialList.appendChild(li);

			if (!(Temporal.ZonedDateTime.compare(molad, tikkunHatzotRange[0]) < 0)) {
				// Add the range info as a sub-item or separate entry
				const rangeLi = document.createElement("li");
				rangeLi.classList.add("rec")
				rangeLi.textContent = `Permissible Range: ${tikkunHatzotRange[0].toLocaleString(...defaulTF)} - ${molad.toLocaleString(...defaulTF)}`;
				rHElems.specialList.appendChild(rangeLi);
			}
		}

		if (newMonthCal.getJewishMonth() == WebsiteLimudCalendar.TEVES) {
			const fullHallel = document.createElement("li");
			fullHallel.appendChild(document.createTextNode("הלל שלם"))
			rHElems.specialList.appendChild(fullHallel);
		}

		const ulChaparatPesha = document.createElement("li");
		if (newMonthCal.tefilahRules().amidah.ulChaparatPesha) {
			ulChaparatPesha.appendChild(document.createTextNode("Ensure ולכפרת פשע is said during Mussaf"))
		} else {
			ulChaparatPesha.appendChild(document.createTextNode("Omit ולכפרת פשע during Mussaf"))
		}
		rHElems.specialList.appendChild(ulChaparatPesha);

		if (checkTachanunRestriction(dateRange)) {
			rHElems.container.insertAdjacentHTML("beforeend", "<hr><div>" + checkTachanunRestriction(dateRange) + "</div>")
		}

		return rHElems.container;
	}

	function handleSingleBL() {
		const blCal = jCal.chainJewishDate(jCal.getJewishYear(), jCal.getJewishMonth(), 15);

		const useEarlyTimes = blCal.isAssurBemelacha();
		const blTimes = {
			start: jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()),
			endStretch: zmanCalc.chainDate(blCal.getDate()).timeRange.current.sunrise,
			endIkar: zmanCalc.chainDate(blCal.getDate()).getAlotHashahar(),
			endStrict: jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()),
			endEarlyIkar: zmanCalc.chainDate(blCal.getDate().subtract({ days: 1 })).getAlotHashahar(),
			endEarlyStretch: zmanCalc.chainDate(blCal.getDate().subtract({ days: 1 })).timeRange.current.sunrise
		}

		// Determine effective end (later of endStretch or endStrict)
		const effectiveEnd = Temporal.ZonedDateTime.compare(blTimes.endStretch, blTimes.endStrict) > 0
			? blTimes.endStretch
			: blTimes.endStrict;

		// Check if any day in the week overlaps with the Birkat Levana time window
		const hasBLOverlap = dateRange.some(date => {
			const dayStart = date.toZonedDateTime({ timeZone: geoLocation.getTimeZone(), plainTime: "00:00" });
			const dayEnd = date.toZonedDateTime({ timeZone: geoLocation.getTimeZone(), plainTime: "23:59" });

			return Temporal.ZonedDateTime.compare(dayStart, effectiveEnd) <= 0 &&
				Temporal.ZonedDateTime.compare(blTimes.start, dayEnd) <= 0;
		});

		const blElems = {
			container: document.createElement("div"),
			title: document.createElement("h5"),
			blList: document.createElement("ul")
		}
		blElems.container.appendChild(blElems.title);
		blElems.container.appendChild(blElems.blList);

		if (hasBLOverlap) {
			blElems.title.innerHTML = {
				hb: "ברכת הלבנה - חודש " + blCal.formatJewishMonth().he,
				en: "Moon-Blessing - Month of " + blCal.formatJewishMonth().en,
				"en-et": "Birkath Ha'Levana - Ḥodesh " + blCal.formatJewishMonth().en
			}[x.data.lang];

			const startTime = document.createElement("li");
			startTime.appendChild(document.createTextNode({
				"hb": "תחילת: ",
				"en": "Beginning: ",
				"en-et": "Beginning: "
			}[x.data.lang] + blTimes.start.toLocaleString(...dtFBLevana)));

			blElems.blList.appendChild(startTime)

			if (jCal.getJewishMonth() == WebsiteLimudCalendar.AV) {
				startTime.classList.add("text-strike");

				const recommendedStart = document.createElement("li");
				recommendedStart.classList.add("rec")
				recommendedStart.appendChild(document.createTextNode({
					"hb": "תחילת: ",
					"en": "Recommendation: ",
					"en-et": "Recommendation: "
				}[x.data.lang] + zmanCalc.chainDate(jCal.chainYomTovIndex(WebsiteLimudCalendar.TISHA_BEAV).getDate()).getTzetHumra().toLocaleString(...dtFBLevana)))

				blElems.blList.appendChild(recommendedStart)
			}

			const endTime = document.createElement("li");
			endTime.innerHTML = (x.data.lang == "hb" ? 'סוף: ' : "End: ")
				+ blTimes.endIkar.toLocaleString(...dtFBLevana)
				+ ` <s style="font-size: .8em">(${blTimes.endStretch.toLocaleString(...defaulTF)})</s>`

			blElems.blList.appendChild(endTime);

			const endStrict = document.createElement("li");
			endStrict.classList.add("rec")
			const endStrictLabel = Temporal.ZonedDateTime.compare(blTimes.endStrict, blTimes.endIkar) > 0 ? "Rema: " : "Strict: ";
			endStrict.appendChild(document.createTextNode(
				(x.data.lang == "hb" ? "סוף " : endStrictLabel) + blTimes.endStrict.toLocaleString(...dtFBLevana)
			));

			if (useEarlyTimes) {
				const earlyEndLabel = x.data.lang == "hb" ? "סוף מוקדם: " : "Early End: ";
				const earlyEndTime = blTimes.endEarlyIkar.toLocaleString(...dtFBLevana)
					+ ` <s style="font-size: .8em">(${blTimes.endStretch.toLocaleString(...defaulTF)})</s>`;

				if (Temporal.ZonedDateTime.compare(blTimes.endStrict, blTimes.endEarlyIkar) < 0) {
					// Rema is earlier than early time - append to endTime with <br>
					const strikeSpan = document.createElement("div");
					strikeSpan.className = "text-strike";
					strikeSpan.innerHTML = endTime.innerHTML;
					endTime.innerHTML = "";
					endTime.appendChild(strikeSpan);
					endTime.innerHTML += `${earlyEndLabel}${earlyEndTime}`;
					blElems.blList.appendChild(endStrict);
				} else {
					endTime.classList.add("text-strike");
					// Rema is later than early time - strike out endStrict and add early time separately
					endStrict.classList.add("text-strike");
					blElems.blList.appendChild(endStrict);
					const earlyEndLi = document.createElement("li");
					earlyEndLi.innerHTML = earlyEndLabel + earlyEndTime;
					blElems.blList.appendChild(earlyEndLi);
				}
			} else {
				blElems.blList.appendChild(endStrict);
			}

			if (checkTachanunRestriction(dateRange)) {
				blElems.blList.insertAdjacentElement('afterend', document.createElement("hr"))
			}
		} else {
			blElems.blList.remove()
		}

		if (checkTachanunRestriction(dateRange)) {
			blElems.title.innerHTML = {
				hb: "הלכות תפילה לחודש " + blCal.formatJewishMonth().he,
				en: "Month of " + blCal.formatJewishMonth().en + " - Laws of Prayer",
				"en-et": "Ḥodesh " + blCal.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];
			blElems.container.insertAdjacentHTML("beforeend", "<div>" + checkTachanunRestriction(dateRange) + "</div>")
		}

		if (blElems.title.innerHTML !== "")
			return blElems.container;
	}

	function handleTekufa(beforeHatzotOnly = false) {
		if (initTekuf.equals(zmanCalc.nextTekufa(zmanCalc.config.fixedMil).withTimeZone(geoLocation.getTimeZone())))
			return;

		if (beforeHatzotOnly && Temporal.ZonedDateTime.compare(initTekuf, zmanCalc.chainDate(initTekuf.toPlainDate()).getHatzoth()) != -1)
			return;

		const nextTekufaJDate = [1, 4, 7, 10]
			.map(month => new KosherZmanim.JewishDate(jCal.getJewishYear(), month, 15))
			.sort((jDateA, jDateB) => {
				const durationA = initTekuf.until(jDateA.getDate().toZonedDateTime("+02:00").withTimeZone(geoLocation.getTimeZone()))
				const durationB = initTekuf.until(jDateB.getDate().toZonedDateTime("+02:00").withTimeZone(geoLocation.getTimeZone()))

				return Math.abs(durationA.total('days')) - Math.abs(durationB.total('days'))
			})[0]

		/** @type {{en: string; he: string}} */
		// @ts-ignore
		const tekufaMonth = ['en', 'he']
			.map(locale => [locale, nextTekufaJDate.getDate().toLocaleString(locale + '-u-ca-hebrew', { month: 'long' })])
			.reduce(function (obj, [key, val]) {
				//@ts-ignore
				obj[key] = val
				return obj
			}, {})

		const tekufaContainer = document.createElement("div");
		const tekufaTitle = document.createElement("h5");
		tekufaTitle.appendChild(document.createTextNode({
			hb: "תקופת " + tekufaMonth.he,
			en: tekufaMonth.en + " Season",
			"en-et": "Tekufath " + tekufaMonth.en
		}[x.data.lang]));

		const tekufaDate = WebsiteLimudCalendar.formatFancyDate(initTekuf)[x.data.lang];
		const tekufaTimingDiv = document.createElement("p");
		tekufaTimingDiv.classList.add('mb-0');

		tekufaTitle.innerHTML += " - " + tekufaDate;
		tekufaTimingDiv.appendChild(document.createTextNode({
			"hb": "אל תשתה מים בין ",
			"en": "Refrain from water between ",
			"en-et": "Refrain from water between "
		}[x.data.lang] + [
			initTekuf.round("minute").subtract({ minutes: 30 }).toLocaleString(...defaulTF),
			initTekuf.round("minute").add({ minutes: 30 }).toLocaleString(...defaulTF),
		].join(' - ')));

		if (nextTekufaJDate.getJewishMonth() == KosherZmanim.JewishDate.TISHREI && !x.data.israel) {
			tekufaTimingDiv.appendChild(document.createElement("br"));
			tekufaTimingDiv.innerHTML += {
				"en": "Switch to ברך עלינו " + "at the night prayer of ",
				"hb": "תחליף לברך עלינו " + "בתפילת ערבית של ",
				"en-et": "Switch to ברך עלינו " + "at Tefilat Arvit of "
			}[x.data.lang] + WebsiteLimudCalendar.formatFancyDate(initTekuf.toPlainDate().add({ days: 59 }), {
				dayLength: 'long',
				monthLength: 'short',
				ordinal: true
			}).en
		}

		tekufaContainer.appendChild(tekufaTitle);
		tekufaContainer.appendChild(tekufaTimingDiv);

		return tekufaContainer;
	}

	const whiteTekufotMonth = document.getElementsByClassName('whiteTekufotMonths')[0]
	if (dateRangeHeb[1].month !== 1) {
		if (isRoshHodeshWeek) {
			whiteTekufotMonth.appendChild(handleRoshHodesh())
		} else {
			const tefilaContainer = handleSingleBL();
			if (tefilaContainer)
				whiteTekufotMonth.appendChild(tefilaContainer);
		}
	}

	const tekufaContainer = handleTekufa(false);
	if (tekufaContainer)
		whiteTekufotMonth.appendChild(tekufaContainer);

	function handleSecondSide() {
		/** @type {Element} */
		// @ts-ignore
		const ssFH = secondSide.cloneNode(true);

		const hanukah = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.CHANUKAH);
		if (hanukah) {
			const hanukahContainer = ssFH.getElementsByClassName('hanukahRow')[0];
			const hanukahCount = hanukah.datesToZman.size;
			for (let i = hanukahCount; i < 8; i++) {
				hanukahContainer.removeChild(hanukahContainer.lastElementChild);
			}

			for (let i = 0; i < hanukahContainer.childElementCount; i++) {
				const hanukahElem = hanukahContainer.children[i];
				const [hanukahDate, hanukahZmanim] = [...hanukah.datesToZman.entries()][i];

				const letterForNumber = [
					"", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח"
				]
				hanukahElem.getElementsByClassName('HanukaDay')[0].innerHTML = "ליל " + letterForNumber[jCal.chainDate(hanukahDate).tomorrow().getDayOfChanukah()] + "׳";
				hanukahElem.getElementsByClassName('DateOfHanuka')[0].innerHTML = (
					hanukahDate.toLocaleString('en', { weekday: "short" }) + ". " +
					hanukahDate.toLocaleString('en', { day: 'numeric' }));
				hanukahElem.getElementsByClassName('hanukaLightTime')[0].innerHTML = hanukahZmanim.candleLighting.toLocaleString(...defaulTF);
			}
		} else {
			ssFH.firstElementChild.remove();
			ssFH.classList.remove('hanukahSplitter');
		}

		removeItem(highlightZmanim, hanukah);

		const importantCards = ssFH.getElementsByClassName('importantCard');
		let highlightIndex = "";
		for (highlightIndex in highlightZmanim) {
			const highlight = highlightZmanim[highlightIndex];
			const highlightCard = importantCards[highlightIndex];

			if (highlight.extra) {
				highlightCard.getElementsByClassName("importantCardContentText")[0].innerHTML += highlight.extra;
			}

			const timesBox = highlightCard.getElementsByClassName("importantCardTimes")[0];

			if (!('title' in highlight) && !(highlight.ytI in yomTovObj)) {
				console.error(highlight)
				throw new Error("Unknown yom tov index in highlight zmanim: " + highlight.ytI);
			}

			highlightCard.getElementsByClassName("importantCardTitleText")[0].innerHTML =
				!('title' in highlight) ? yomTovObj[highlight.ytI][x.data.lang] : highlight.title;

			const dateRange = [...highlight.datesToZman.keys()].sort(Temporal.PlainDate.compare);
			const dateElem = highlightCard.getElementsByClassName("importantCardDates")[0];
			if (dateRange.length == 1) {
				dateElem.innerHTML = WebsiteLimudCalendar.formatFancyDate(dateRange[0], { dayLength: "short", monthLength: "short", ordinal: true })["en"]
			} else if (x.data.lang == 'hb'
				&& dateRange.length == 2
				&& dateRange[0].until(dateRange[1]).total('days') == 1
				&& Object.values(highlight.datesToZman.get(dateRange[0])).length == 1
				&& 'candleLighting' in highlight.datesToZman.get(dateRange[0])) {
				dateElem.innerHTML =
					hNum.formatHebrewNumber(dateRange[1].withCalendar("hebrew").day)
					+ " " + dateRange[1].toLocaleString('he-u-ca-hebrew', { month: 'long' })

				if (!(highlight.title && highlight.title.startsWith("שבת")))
					dateElem.innerHTML = dateRange[1].toLocaleString('he-u-ca-hebrew', { weekday: 'long' }) + ", " + dateElem.innerHTML
			} else {
				let dateText = "";
				dateText += WebsiteLimudCalendar.formatFancyDate(dateRange[0], { dayLength: "short", monthLength: "short", ordinal: true })[x.data.lang]
				dateText += " - ";
				dateText += WebsiteLimudCalendar.formatFancyDate(dateRange[dateRange.length - 1], { dayLength: "short", monthLength: "short", ordinal: true })[x.data.lang]
				dateElem.innerHTML = dateText;
			}

			const allTimes = highlight.datesToZman.values();
			const allCandleLightings = [...highlight.datesToZman.values()]
				.filter(zmanMap => 'candleLighting' in zmanMap);
			let candleLightIndex = 1;
			for (const zmanOfDay of allTimes) {
				for (const [zmanName, zmanTime] of Object.entries(zmanOfDay)) {
					if (zmanName == 'rabbenuTam') {
						const rtElem = document.createElement("span");
						rtElem.innerHTML = ` (${x.data.lang == 'hb' ? 'ר"ת' : 'R"T'}: ${zmanTime.toLocaleString(...defaulTF)})`;
						rtElem.classList.add('rabbenuTamAppend');

						timesBox.lastElementChild.appendChild(rtElem);
						continue;
					} else if (zmanName == 'sofZemanAhilathHametz') {
						const ahilaElement = document.createElement("div");
						ahilaElement.innerHTML = `(${x.data.lang == 'hb' ? "סוף זמן אכילת חמץ:" : "Eat before "} ${zmanTime.toLocaleString(...defaulTF)})`;
						ahilaElement.classList.add('rabbenuTamAppend');

						timesBox.lastElementChild.appendChild(ahilaElement);
						timesBox.appendChild(document.createElement("hr"))
						continue;
					}

					const zmanRow = document.createElement("div");
					zmanRow.classList.add('zmanRow');

					const innerRow = [zmanName + ":"];
					switch (zmanName) {
						case 'candleLighting':
							innerRow[0] = icons.candle;

							if (allCandleLightings.length > 1) {
								if (x.data.lang !== 'hb')
									innerRow[0] += ` (${getOrdinal(candleLightIndex++, 'html')} night):`;
								else {
									const erevTitleJCal = jCal.chainDate(zmanTime.toPlainDate());
									const titleJCal = erevTitleJCal.tomorrow();

									if (erevTitleJCal.isYomTovAssurBemelacha() && titleJCal.isYomTovAssurBemelacha())
										innerRow[0] += ' ליו"ט שני:'
									else if (titleJCal.isYomTovAssurBemelacha() && titleJCal.tomorrow().isYomTovAssurBemelacha())
										innerRow[0] += ' ליו"ט ראשון:'
									else if (!titleJCal.isYomTovAssurBemelacha())
										innerRow[0] += ' לשבת:'
									else
										innerRow[0] += ' ליו"ט:'
								}
							}
							break;
						case 'tzetMelakha':
							innerRow[0] = icons.havdalah;
							break;
						case 'sofZemanBiurHametz':
							innerRow[0] = icons.dispose + (x.data.lang == 'hb' ? " השבתת חמץ לפני" : " Dispose Ḥametz by");
							break;
						case 'fastStarts':
							innerRow[0] = "Fast starts:"
							break;
						case 'fastEnds':
							innerRow[0] = "Fast ends:";
							break;
						case 'musaf':
							innerRow[0] = "Start מוסף before";
							break;
						case 'birkatKohanim':
							innerRow[0] = "Finish ברכת כהנים before";
							break;
						case 'mikva':
							innerRow[0] = "טבילה במקוה after";
							break;
						case 'netz':
							innerRow[0] = icons.netz;
							if (!x.data.israel || allCandleLightings.length > 1)
								innerRow[1] = "<hr>";
							break;
						case 'bedikatHametz':
							innerRow[0] = icons.bedika + " " +
								(x.data.lang == 'hb' ? "בדיקה בליל " + n2hebDateOrdinal(zmanTime.dayOfWeek) + ":"
									: "Bedika on " + daysForLocale('en', 'short')[zmanTime.dayOfWeek] + " night:");
							break;
						case 'hatzotLayla':
							innerRow[0] = icons.hatzot;
							zmanRow.classList.add('tableCellHasIcon');
							break;
					}

					/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
					const bottomTF = [defaulTF[0], { ...defaulTF[1] }];
					if (zmanTime.second)
						bottomTF[1].second = '2-digit';

					innerRow[0] += " " + zmanTime.toLocaleString(...bottomTF);
					zmanRow.innerHTML = innerRow.join('');
					timesBox.appendChild(zmanRow);
				}

				if ("ytI" in highlight && highlight.ytI == WebsiteLimudCalendar.YOM_KIPPUR) {
					timesBox.appendChild(document.createElement("hr"));
					highlightCard.classList.add("yomKippurTimes");
				}
			}

			if (timesBox.lastElementChild.tagName.toLowerCase() == 'hr') {
				timesBox.removeChild(timesBox.lastElementChild);
			}

			if (timesBox.childElementCount > 3 || (timesBox.childElementCount > 2 && allCandleLightings.length > 1 && allCandleLightings.find(zmanMap => 'rabbenuTam' in zmanMap))) {
				timesBox.classList.add("complexTimes")
			}

			//timesBox.innerHTML = JSON.stringify([...highlight.datesToZman.entries()]);
		}

		if (Number(highlightIndex) + 1 < importantCards.length) {
			for (let i = importantCards.length - 1; i > Number(highlightIndex); i--) {
				importantCards[i].parentElement.removeChild(importantCards[i]);
			}
		}

		importantCards[0].parentElement.setAttribute('data-importantItems', (Number(highlightIndex) + 1).toString());

		if (Number(highlightIndex) + 1 == 3 && importantCards[0].getElementsByClassName("importantCardTimes")[0].classList.contains("complexTimes")) {
			importantCards[0].classList.add("tallImportantCard");
			importantCards[0].parentElement.classList.add("tallImportantCardContainer");
		}

		const miscTimes = ssFH.getElementsByClassName('miscTimes')[0];

		const tekufaContainer = handleTekufa(false);
		if (tekufaContainer)
			miscTimes.appendChild(tekufaContainer);

		/*const bLContain = handleSingleBL(ssFH.classList.contains('hanukahSplitter'));
		if (bLContain)
			miscTimes.appendChild(bLContain); */

		/*if (!bLContain && !tekufaContainer) {
			miscTimes.parentElement.removeChild(miscTimes);
			ssFH.classList.remove('miscTimesSplitter');
		}*/

		return ssFH;
	}


	return { week: x.data.week, htmlContent: [...document.getElementsByClassName("page")].map(elem => elem.outerHTML), addedZemanim, monthPrefix: (dateRangeHeb[0].day == 1 || dateRangeHeb[0].month !== dateRangeHeb[1].month) ? (new WebsiteLimudCalendar(dateRangeHeb[1])).getJewishMonth() : null }
}

if (Worker) {
	addEventListener('message', async (message) => {
		if (!('Temporal' in globalThis)) {
			const { Temporal } = await import('https://cdn.jsdelivr.net/npm/temporal-polyfill@0.3.2/+esm');
			globalThis.Temporal = Temporal;
		}
		postMessage(messageHandler(message))
	})
	addEventListener('error', (e) => console.error(e));
}

/**
 * @param {Temporal.ZonedDateTime} start
 * @param {Temporal.ZonedDateTime} middle
 * @param {Temporal.ZonedDateTime} end
 */
function rangeTimes(start, middle, end, inclusive = true) {
	const acceptedValues = [1];
	if (inclusive)
		acceptedValues.push(0);

	return acceptedValues.includes(Temporal.ZonedDateTime.compare(middle, start)) && acceptedValues.includes(Temporal.ZonedDateTime.compare(end, middle))
};

/**
 * @param {any[]} array
 * @param {any} itemToRemove
 */
function removeItem(array, itemToRemove) {
	const index = array.indexOf(itemToRemove);

	if (index !== -1) {
		array.splice(index, 1);
	}
}

/**
 * @param {number} dayOfWeek
 * @param {boolean} prefixForShabbat
 */
function n2hebDateOrdinal(dayOfWeek, prefixForShabbat = false) {
	const numResult = (dayOfWeek + 1) % 7;
	return (numResult == 0 ? (prefixForShabbat ? "ה" : "") + "שבת" : n2wordsOrdinal[numResult])
}

/**
 * @param {number} n
 * @param {'none'|'html'|'svg'} formating
 */
function getOrdinal(n, formating = 'none') {
	return n.toString()
		+ (formating == 'html' ? "<sup>" : formating == 'svg' ? '<tspan baseline-shift="super" font-size="0.7em">' : "")
		+ { e: "st", o: "nd", w: "rd", h: "th" }[new Intl.PluralRules("en", { type: "ordinal" }).select(n)[2]]
		+ (formating == 'html' ? "</sup>" : formating == 'svg' ? '</tspan>' : "")
}

export default messageHandler;