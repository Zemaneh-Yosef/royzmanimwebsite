// @ts-check

import * as KosherZmanim from '../../libraries/kosherZmanim/kosher-zmanim.js';
import { Temporal, Parsha } from '../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteLimudCalendar from '../WebsiteLimudCalendar.js';
import { parseHTML } from '../../libraries/linkedom/linkedom.js'
import { HebrewNumberFormatter, daysForLocale, getOrdinal, monthForLocale } from '../WebsiteCalendar.js';
import { ZemanFunctions, methodNames, zDTFromFunc } from '../ROYZmanim.js';
import n2wordsOrdinal from '../misc/n2wordsOrdinal.js';
import makamObj from '../makamObj.js';

const icons = {
	havdalah: '<svg viewBox="0 0 100 100" class="flipImageRTL"><use href="/assets/images/havdalah.svg#Layer_1"/></svg>',
	candle: '<i class="bi bi-fire"></i>',
	netz: '<i class="bi bi-sunrise-fill"></i>',
	wine: '<img src="/assets/images/icons8-wine-bar-64.png">',
	dispose: '<i class="bi bi-trash-fill" style="float: inline-start; margin-bottom: 2ch; margin-inline-end: .25rem;"></i>',
	hatzot: '🌕',
	bedika: '<i class="bi bi-search"></i>'
}

const hNum = new HebrewNumberFormatter();

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
	allShitot: [string, 'earlier'|'later'][];
	month: number;
	candleTime: number;
	shabbatOnly: boolean;
	oneYear: boolean;
	mergeTzet: boolean;
	pocket: boolean;
  }} singlePageParams */

// "date" of param will have to be in the iso8601 calendar
/**
  * @param {MessageEvent<singlePageParams>} x
 */
function messageHandler(x) {
	const geoLocation = new KosherZmanim.GeoLocation(...x.data.geoCoordinates);

	const { document } = parseHTML(x.data.htmlElems);
	const flexWorkAround = document.createElement("span");
	flexWorkAround.classList.add("flexElemWorkaround")

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

	const amPMStrs = [
		new Temporal.Instant(0n),
		new Temporal.Instant(0n).add({ hours: 12 })
	].map(inst => inst.toLocaleString(defaulTF[0], { hour12: true, hour: 'numeric' }).split(' ').pop());

	let plainDate = Temporal.PlainDate.from(x.data.date)
	let plainDateForceCal = plainDate.withCalendar("iso8601");
	const jCal = new WebsiteLimudCalendar();
	jCal.setDate(plainDateForceCal)
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
			"en-et": "Ḥol HaMoedh",
			en: "Intermediary"
		},
		[KosherZmanim.JewishCalendar.HOSHANA_RABBA]: {
			hb: "הושנה רבה",
			"en-et": "Hoshanah Rabba",
			en: "Hoshana Rabba"
		},

		// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
		// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
		[KosherZmanim.JewishCalendar.SHEMINI_ATZERES]: {
			hb: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
			en: "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : ""),
			"en-et": "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : "")
		},
		[KosherZmanim.JewishCalendar.SIMCHAS_TORAH]: {
			hb: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
			en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Tora",
			"en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Tora"
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

	const allShitotNames = x.data.allShitot.map(shita => shita[0]);

	function handleShita(/** @type {string} */ shita, /** @type {'earlier'|'later'} */ round) {
		const omerSpan = document.createElement("span");
		omerSpan.classList.add("omerText");
		if (jCal.tomorrow().getDayOfOmer() > 0) {
			omerSpan.innerHTML = (x.data.lang == 'hb'
				? hNum.formatHebrewNumber(jCal.tomorrow().getDayOfOmer()) + " לעומר"
				: getOrdinal(jCal.tomorrow().getDayOfOmer(), true) + " of omer");
		}

		const div = document.createElement('div');
		div.classList.add('tableCell')

		/**
		 * @param {Temporal.ZonedDateTime} zDT
		 * @param {'earlier'|'later'} round
		 * @param {{dtF: typeof defaulTF; icon?: string, hideAMPM: boolean, appendText?: string}} config
		 */
		function renderZmanInDiv(zDT, round, config = { dtF: defaulTF, icon: undefined, hideAMPM: true }) {
			/** @type {HTMLSpanElement} */
			// @ts-ignore
			const timeElem = flexWorkAround.cloneNode(true);
			if (zDT.dayOfYear !== jCal.getDate().dayOfYear) {
				const dayElem = document.createElement("span");
				div.classList.add('tableCellHasIcon');
				dayElem.appendChild(document.createTextNode('⤵️'));

				if (jCal.getDate().dayOfYear > zDT.dayOfYear) {
					dayElem.style.display = 'inline-block';
					dayElem.style.transform = 'scale(-1, 1)';
				}

				timeElem.appendChild(dayElem)
			}

			if (config.icon)
				timeElem.innerHTML += config.icon + " ";

			let timeStr = handleRound(zDT, ('second' in config.dtF[1] ? 'noRound' : round)).toLocaleString(...config.dtF)
			if (config.hideAMPM) {
				for (const amPMStr of amPMStrs)
					timeStr = timeStr.replace(amPMStr, '').trim();
			}

			if (config.appendText)
				timeStr += config.appendText;

			timeElem.appendChild(document.createTextNode(timeStr.trim()));
			div.appendChild(timeElem)
		}

		div.setAttribute('data-time-for-shita', shita)

		if (shita.startsWith('misheyakir-')) {
			const [portion, complete] = shita
				.replace('misheyakir-', '')
				.split('/')
				.map(str => parseInt(str))

			renderZmanInDiv(zmanCalc.getMisheyakir(portion / complete), 'later')
			return div;
		}

		switch (shita) {
			case 'getMolad':
				if (jCal.isShabbosMevorchim()) {
					const shabbatMevarchin = flexWorkAround.cloneNode(true);
					shabbatMevarchin.appendChild(document.createTextNode({
						'hb': "שבת מברכים " + jCal.getDate().withCalendar('hebrew').add({ months: 1 }).toLocaleString('he-u-ca-hebrew', { month: 'long' }),
						"en-et": "Shabbath Mevorachim " + jCal.getDate().withCalendar('hebrew').add({ months: 1 }).toLocaleString('en-u-ca-hebrew', { month: 'long' }),
						'en': "New month - " + jCal.getDate().withCalendar('hebrew').add({ months: 1 }).toLocaleString('en-u-ca-hebrew', { month: 'long' })
					}[x.data.lang]));

					div.appendChild(shabbatMevarchin);

					const rhDays = [jCal.getDate().withCalendar('hebrew').add({ months: 1 }).with({ day: 1 }).dayOfWeek];
					if (jCal.getDaysInJewishMonth() == 30) {
						rhDays.push(rhDays[0]);
						rhDays[0] = jCal.getDate().withCalendar('hebrew').with({ day: 30 }).dayOfWeek;
					}
					const rhHebrewDisplay = rhDays.map(day => "ביום" + n2hebDateOrdinal(day, true));

					const daysDisplay = flexWorkAround.cloneNode(true);
					// @ts-ignore
					daysDisplay.classList.add("omerText");
					daysDisplay.appendChild(document.createTextNode(rhHebrewDisplay.join(" ומחרתו ")));
					if (x.data.lang !== 'hb')
						daysDisplay.appendChild(document.createTextNode("/" + rhDays.map(num => daysForLocale('en')[num]).join(" & ")));

					div.appendChild(daysDisplay);
				}

				if (jCal.getDate().dayOfYear == jCal.tomorrow().tomorrow().getMoladAsDate().withTimeZone(geoLocation.getTimeZone()).dayOfYear)
					div.classList.add('tableCellHasIcon');
				renderZmanInDiv(
					jCal.tomorrow().tomorrow().getMoladAsDate().withTimeZone(geoLocation.getTimeZone()),
					'earlier', // unused
					{
						dtF: [defaulTF[0], { ...defaulTF[1], timeZoneName: "short", second: '2-digit' }],
						icon: "🌑",
						hideAMPM: false
					}
				);

				if (jCal.getDate().dayOfYear == jCal.getTchilasZmanKidushLevana3Days().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getTchilasZmanKidushLevana3Days().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashahar(), time, bLzmanCalc.getTzet()))
						time = bLzmanCalc.getTzet();

					div.classList.add('tableCellHasIcon');
					renderZmanInDiv(time, 'later', { dtF: defaulTF, icon: "🌘", hideAMPM: false, appendText: " (עיקר הדין)" })
				}

				if (jCal.getDate().dayOfYear == jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashahar(), time, bLzmanCalc.getTzet()))
						time = bLzmanCalc.getTzet();

					div.classList.add('tableCellHasIcon');
					renderZmanInDiv(time, 'later', { dtF: defaulTF, icon: "🌗", hideAMPM: false, appendText: " (לכתחילה)" })
				}

				let sameTime = false;
				if (jCal.getDate().dayOfYear == jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashahar(), time, bLzmanCalc.getTzet()))
						time = bLzmanCalc.getAlotHashahar();

					if (time.withCalendar("hebrew").day == 15 && time.equals(bLzmanCalc.getAlotHashahar()))
						sameTime = true;

					div.classList.add('tableCellHasIcon');
					renderZmanInDiv(time, 'earlier', { dtF: defaulTF, icon: "🌕", hideAMPM: false, appendText: (sameTime ? undefined : " (לכתחילה)") })
				}

				if (jCal.getJewishDayOfMonth() == 15 && !sameTime) {
					let time = zmanCalc.getAlotHashahar();
					div.classList.add('tableCellHasIcon');
					renderZmanInDiv(time, 'earlier', { dtF: defaulTF, icon: "🌕", hideAMPM: false, appendText: " (זמן מרן)" })
				}
				break;
			case 'special':
			case 'min-special':
				if (jCal.getDayOfWeek() === 7 && jCal.getParshah() in WebsiteLimudCalendar.hebrewParshaMap && WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]) {
					const shabElem = flexWorkAround.cloneNode(true);
					shabElem.appendChild(document.createTextNode(WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]));
					div.appendChild(shabElem)
				}
				if (jCal.isRoshChodesh()) {
					const rHelem = flexWorkAround.cloneNode(true);
					rHelem.appendChild(document.createTextNode({
						'hb': "ראש חדש",
						"en-et": "Rosh Ḥodesh",
						'en': "New Month"
					}[x.data.lang]));
					if (jCal.isChanukah())
						// @ts-ignore
						rHelem.style.fontSize = ".8em";

					div.appendChild(rHelem);
					div.style.fontWeight = "bold";
				}

				if (jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY
					&& jCal.getJewishMonth() == KosherZmanim.JewishDate[(jCal.isJewishLeapYear() ? "ADAR_II" : "ADAR")]
					&& jCal.getJewishDayOfMonth() == 16) {
					const pur3TitleElem = flexWorkAround.cloneNode(true);
					pur3TitleElem.appendChild(document.createTextNode(x.data.lang == "hb" ? "פורים משולש" : "Purim Meshulash"));
					div.appendChild(pur3TitleElem);
				}

				if (jCal.tomorrow().getDayOfChanukah() !== -1) {
					const hanTitleElem = flexWorkAround.cloneNode(true);
					hanTitleElem.appendChild(document.createTextNode({
						"hb": (jCal.getDayOfChanukah() == -1 ? "ערב " : "") + "חנוכה",
						"en": "Ḥanuka" + (jCal.getDayOfChanukah() == -1 ? " Eve" : ""),
						"en-et": (jCal.getDayOfChanukah() == -1 ? "Erev " : "") + "Ḥanuka"
					}[x.data.lang]));
					div.appendChild(hanTitleElem);

					if (!x.data.pocket) {
						const hanNightElem = flexWorkAround.cloneNode(true);
						// @ts-ignore
						hanNightElem.classList.add("omerText");
						// @ts-ignore
						hanNightElem.innerHTML = "(" +
							(x.data.lang == "hb" ? "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()]
								: getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night") + ")";
						div.appendChild(hanNightElem);
					}

					div.style.fontWeight = "bold";
				} else if (jCal.getDayOfChanukah() == 8) {
					const hanTitleElem = flexWorkAround.cloneNode(true);
					hanTitleElem.appendChild(document.createTextNode({
						"hb": "זאת חנוכה",
						"en": "Ḥanuka Day",
						"en-et": "Yom Ḥanuka"
					}[x.data.lang]));
					div.appendChild(hanTitleElem);
				}

				if (jCal.isBirkasHachamah()) {
					const rHelem = flexWorkAround.cloneNode(true);
					rHelem.appendChild(document.createTextNode({
						'hb': "ברכת החמה",
						"en-et": "Birkath Haḥama",
						'en': "Blessing of the Sun"
					}[x.data.lang]));

					div.appendChild(rHelem);
					div.style.fontWeight = "bold";
				}

				if (jCal.getYomTovIndex() in yomTovObj) {
					let text = yomTovObj[jCal.getYomTovIndex()][x.data.lang];
					if (shita == 'min-special')
						text = text.replace("Intermediary", "חול המועד");

					const yomTovElem = flexWorkAround.cloneNode(true);
					yomTovElem.appendChild(document.createTextNode(text))
					div.appendChild(yomTovElem);

					div.style.fontWeight = "bold";
				} else if (jCal.isTaanis()) {
					const taanitElem = flexWorkAround.cloneNode(true);
					taanitElem.appendChild(document.createTextNode(
						shita == 'min-special'
							? taanitYomTovNames[jCal.getYomTovIndex()]
							: (x.data.lang == 'hb' ? "צום" : "Fast")))

					div.appendChild(taanitElem);
					div.style.fontWeight = "bold";
				}

				break;
			case 'date':
			case 'datePri':
			case 'dateSec':
				let primaryDate = flexWorkAround.cloneNode(true);
				let secondaryDate = flexWorkAround.cloneNode(true);
				switch (x.data.lang) {
					case 'en':
						// @ts-ignore
						primaryDate.innerHTML =
							x.data.shabbatOnly ? jCal.formatFancyDate({ dayLength: "short", monthLength: "short", ordinal: false}) : (
								jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
								jCal.getDate().toLocaleString('en', { day: 'numeric' }))
							;
						secondaryDate.appendChild(document.createTextNode(
							hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " +
							jCal.getDate().toLocaleString('he-u-ca-hebrew', { month: 'long' })
						));
						break;
					case 'en-et':
						primaryDate.appendChild(document.createTextNode(
							jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
							jCal.getDate().toLocaleString('en-u-ca-hebrew', { month: 'long', day: "numeric" })
						));
						secondaryDate.appendChild(document.createTextNode(jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })));
						break;
					case 'hb':
						primaryDate.appendChild(document.createTextNode(
							n2hebDateOrdinal(jCal.getDate().dayOfWeek) + " - " + hNum.formatHebrewNumber(jCal.getJewishDayOfMonth())
						));
						secondaryDate.appendChild(document.createTextNode(jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })));
				}
				if (shita !== 'dateSec')
					div.appendChild(primaryDate);

				if (shita !== 'datePri')
					div.appendChild(secondaryDate);

				if (jCal.isRoshChodesh() || jCal.getYomTovIndex() in yomTovObj || jCal.isBirkasHachamah())
					div.style.fontWeight = "bold";

				break;
			case 'candleLighting':
			case 'candleLightingRT':
				if (jCal.hasCandleLighting()) {
					const candleConfig = { dtF: defaulTF, icon: icons.candle, hideAMPM: true }
					if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
						renderZmanInDiv(zmanCalc.getCandleLighting(), 'earlier', candleConfig);
					else if (jCal.getDayOfWeek() === 7)
						renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later', candleConfig);
					else if (x.data.mergeTzet && zmanCalc)
						renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', candleConfig);
					else
						return false;
				}

				if (allShitotNames.includes('getTzetHumra') && jCal.isTaanis() && jCal.getJewishMonth() == WebsiteLimudCalendar.AV && jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY)
					return false;

				if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
					renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later', { dtF: defaulTF, icon: icons.havdalah, hideAMPM: true });

					if (x.data.mergeTzet && jCal.tomorrow().getDayOfOmer() !== -1) {
						omerSpan.style.marginTop = '.1rem';
						div.appendChild(omerSpan);
					}

					if (shita == 'candleLightingRT') {
						renderZmanInDiv(zmanCalc.getTzetRT(), 'later', {
							dtF: defaulTF, icon: {
								'hb': 'ר"ת:',
								"en-et": 'R"T:',
								'en': 'R"T:'
							}[x.data.lang], hideAMPM: true
						});
						if (x.data.mergeTzet && jCal.tomorrow().getDayOfOmer() !== -1) {
							const attachedRT = document.createElement("span");
							attachedRT.classList.add("omerText");
							attachedRT.innerHTML = "/" + div.lastElementChild.innerHTML;
							div.lastElementChild.remove();
							div.firstElementChild.appendChild(attachedRT);
						} else {
							// @ts-ignore
							div.lastElementChild.style.marginTop = '.1rem';
							div.lastElementChild.classList.add("omerText");
						}
					}
				}

				break;
			case 'getTzet':
				if (jCal.hasCandleLighting() || !jCal.isAssurBemelacha()) {
					const potForCandle = zmanCalc.config.fixedMil && jCal.hasCandleLighting() && jCal.getDayOfWeek() !== 6 && jCal.isAssurBemelacha() && jCal.getDayOfWeek() !== 7;
					renderZmanInDiv(zmanCalc.getTzet(), 'later', potForCandle ? { dtF: defaulTF, icon: icons.candle, hideAMPM: true } : undefined)
					if (potForCandle && allShitotNames.some(shita => ['candleLighting', 'candleLightingRT'].includes(shita))) {
						div.style.gridColumnEnd = "span 2";
					}

					if (jCal.tomorrow().getDayOfOmer() !== -1) {
						div.appendChild(omerSpan);
					}

					if (jCal.tomorrow().getDayOfChanukah() !== -1 && jCal.getDayOfWeek() !== 6 && !x.data.pocket) {
						div.classList.add('tableCellHasIcon');
						renderZmanInDiv(zmanCalc.getTzet().add({ minutes: 30 }), 'earlier', {
							dtF: defaulTF, icon: "🕎" + {
								'hb': " לפני",
								"en-et": " before",
								'en': " before"
							}[x.data.lang], hideAMPM: true
						})
						div.lastElementChild.classList.add("omerText");
					}

					if (x.data.mergeTzet && jCal.isTaanis() && !jCal.isYomKippur()) {
						renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', {
							dtF: defaulTF, icon: {
								'hb': "צאת הצום",
								"en-et": "Fast Ends",
								'en': "Fast Ends"
							}[x.data.lang], hideAMPM: true
						})
						div.lastElementChild.classList.add("omerText");
						// @ts-ignore
						div.lastElementChild.style.fontWeight = "bold";
					}
				}
				break;
			case 'getTzetHumra':
				// Only on Amudeh Hora'ah
				const potForCandle = jCal.hasCandleLighting() && jCal.getDayOfWeek() !== 6 && jCal.isAssurBemelacha() && jCal.getDayOfWeek() !== 7;
				const havdalahOnWine = jCal.isTaanis() && jCal.getJewishMonth() == WebsiteLimudCalendar.AV && jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY;

				const iconParams =
					potForCandle ? { dtF: defaulTF, icon: icons.candle, hideAMPM: true } :
						havdalahOnWine ? { dtF: defaulTF, icon: icons.wine, hideAMPM: true } :
							undefined;

				renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', iconParams)
				if (jCal.isTaanis() && !jCal.isYomKippur()) {
					div.style.fontWeight = "bold";
				}

				if ((potForCandle || havdalahOnWine) && allShitotNames.some(shita => ['candleLighting', 'candleLightingRT', 'netaneli-candleLighting'].includes(shita))) {
					div.style.gridColumnEnd = "span 2";
				}

				if (jCal.tomorrow().getDayOfOmer() !== -1 && !(jCal.hasCandleLighting() || !jCal.isAssurBemelacha())) {
					div.appendChild(omerSpan);
				}

				break;
			case 'getAlotHashahar':
			case 'getTallAlotHashacharWKorbanot':
			case 'netaneliDawn':
				renderZmanInDiv(zmanCalc.getAlotHashahar(), 'earlier');
				if (jCal.isTaanis() && jCal.getJewishMonth() !== WebsiteLimudCalendar.AV && !jCal.isYomKippur())
					// @ts-ignore
					div.firstElementChild.style.fontWeight = "bold";

				if (shita == 'getTallAlotHashacharWKorbanot') {
					renderZmanInDiv(zmanCalc.customDawn(), 'earlier', {
						dtF: defaulTF, icon: `(${{
							'hb': "קרבנות",
							"en-et": "Korbanot",
							'en': "Korbanot"
						}[x.data.lang]}:`, appendText: ")", hideAMPM: true
					});
					div.lastElementChild.classList.add("omerText");
				} else if (shita == 'netaneliDawn') {
					renderZmanInDiv(
						zmanCalc.coreZC.getSunriseOffsetByDegrees(106.04), 'earlier',
						{ dtF: defaulTF, icon: `(מעלות:`, appendText: ")", hideAMPM: true }
					);
					div.lastElementChild.classList.add("omerText");
				}
				break;
			case 'getTallMisheyakir':
				renderZmanInDiv(zmanCalc.getMisheyakir(), 'later');
				renderZmanInDiv(zmanCalc.getMisheyakir(11 / 12), 'later', {
					dtF: defaulTF, icon: `(${{
						'hb': "מקדם",
						"en-et": "Early",
						'en': "Early"
					}[x.data.lang]}:`, appendText: ")", hideAMPM: true
				});
				div.lastElementChild.classList.add("omerText");
				break;
			case 'getNetz':
				const rZIDoptions = { dtF: defaulTF, hideAMPM: true };

				let sunriseTime = zmanCalc.getNetz();
				if (!(sunriseTime instanceof Temporal.ZonedDateTime)) {
					rZIDoptions.dtF = [defaulTF[0], { ...defaulTF[1], second: '2-digit' }];
					sunriseTime = sunriseTime.time;
				}

				renderZmanInDiv(sunriseTime, 'later', rZIDoptions);
				break;
			case 'getSofZemanShemaGRA':
				renderZmanInDiv(zmanCalc.getSofZemanShemaGRA(), 'earlier')

				if (jCal.isBirkasHachamah()) {
					div.style.fontWeight = "bold";
					const hanukahSpan = flexWorkAround.cloneNode(true);
					// @ts-ignore
					hanukahSpan.classList.add("omerText");
					hanukahSpan.appendChild(document.createTextNode({
						'hb': "(סוף זמן ברכת החמה)",
						"en-et": "(Sof Zeman Birkath Haḥama)",
						'en': "(Birkath Haḥama end time)"
					}[x.data.lang]));

					div.appendChild(hanukahSpan);
				}
				break;
			case 'getShkiya':
				renderZmanInDiv(zmanCalc.getShkiya(), 'earlier');
				if (jCal.tomorrow().getYomTovIndex() == KosherZmanim.JewishCalendar.TISHA_BEAV)
					div.style.fontWeight = "bold";

				break;

			case 'min-shema':
				renderZmanInDiv(zmanCalc.getSofZemanShemaMGA(), 'earlier');
				renderZmanInDiv(zmanCalc.getSofZemanShemaGRA(), 'earlier', { dtF: defaulTF, icon: "(GRA) ", hideAMPM: true });
				div.lastElementChild.classList.add("omerText");
				break;
			case 'min-minha':
				renderZmanInDiv(zmanCalc.getMinchaKetana(), 'later');
				renderZmanInDiv(zmanCalc.getMinhaGedolah(), 'later', { dtF: defaulTF, icon: "(Early) ", hideAMPM: true });
				div.lastElementChild.classList.add("omerText");
				break;
			case 'min-pelag':
				renderZmanInDiv(zmanCalc.getPlagHaminhaHalachaBrurah(), 'later');
				renderZmanInDiv(
					zmanCalc.timeRange.current.dawn.add(
						zmanCalc.fixedToSeasonal(
							Temporal.Duration.from({ hours: 10, minutes: 45 }),
							zmanCalc.timeRange.current.dawn.until(zmanCalc.timeRange.current.nightfall)
						)), 'later', { dtF: defaulTF, icon: "(YY) ", hideAMPM: true });
				div.lastElementChild.classList.add("omerText");
				break;
			case 'min-tzet':
				renderZmanInDiv(zmanCalc.getTzetHumra(), 'later');
				renderZmanInDiv(zmanCalc.getTzet(), 'later', { dtF: defaulTF, icon: '(13.5s) ', hideAMPM: true });
				div.lastElementChild.classList.add("omerText");
				break;
			case 'getPlagHaminhaTT':
				renderZmanInDiv(zmanCalc.timeRange.current.dawn.add(
					zmanCalc.fixedToSeasonal(Temporal.Duration.from({ hours: 10, minutes: 45 }), zmanCalc.timeRange.current.ranges.mga)
				), 'later');
				break;
			case 'testSunriseHBWorking':
				renderZmanInDiv(zmanCalc.testSunriseHBWorking(), 'earlier', { dtF: [defaulTF[0], { ...defaulTF[1], second: '2-digit' }], hideAMPM: true });
				break;
			case 'netaneli-rt':
				renderZmanInDiv(zmanCalc.timeRange.current.tzethakokhavim, 'later');
				renderZmanInDiv(
					zmanCalc.coreZC.getSunsetOffsetByDegrees(106.04), 'later',
					{ dtF: defaulTF, icon: `(מעלות:`, appendText: ")", hideAMPM: true }
				);
				div.lastElementChild.classList.add("omerText");
				break;
			case 'forceSeaLevelSunrise':
				renderZmanInDiv(zmanCalc.coreZC.getSeaLevelSunrise(), 'later', { dtF: [defaulTF[0], { ...defaulTF[1], second: '2-digit' }], hideAMPM: true });
				break;
			case 'netaneli-minhaGedola':
				renderZmanInDiv(zmanCalc.getMinhaGedolah(), 'later');
				renderZmanInDiv(
					zmanCalc.timeRange.current.sunrise.add(
						zmanCalc.fixedToSeasonal(
							Temporal.Duration.from({ hours: 6, minutes: 30 }),
							zmanCalc.timeRange.current.sunrise.until(zmanCalc.timeRange.current.nightfall)
						)), 'later', { dtF: defaulTF, icon: '(או"ל ', hideAMPM: true, appendText: ')' }
				);
				div.lastElementChild.classList.add("omerText");
				break;
			case 'netaneli-candleLighting':
				if (jCal.hasCandleLighting()) {
					const candleConfig = { dtF: defaulTF, icon: icons.candle, hideAMPM: true }
					if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
						renderZmanInDiv(zmanCalc.getCandleLighting(), 'earlier', candleConfig);
					else if (jCal.getDayOfWeek() === 7)
						renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha({ degree: 8.1, minutes: 30 })), 'later', candleConfig);
					else if (x.data.mergeTzet && zmanCalc)
						renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', candleConfig);
					else
						return false;
				}

				if (allShitotNames.includes('getTzetHumra') && jCal.isTaanis() && jCal.getJewishMonth() == WebsiteLimudCalendar.AV && jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY)
					return false;

				if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
					renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later', { dtF: defaulTF, icon: icons.havdalah, hideAMPM: true });

					if (x.data.mergeTzet && jCal.tomorrow().getDayOfOmer() !== -1) {
						omerSpan.style.marginTop = '.1rem';
						div.appendChild(omerSpan);
					}
				}

				break;

			case 'blank':
				break;
			default:
				let time = null;
				try {
					// @ts-ignore
					time = zmanCalc[shita]();
				} catch (e) {
					if (!(shita in methodNames))
						throw new Error("Unknown zman " + shita);
					else
						throw e;
				}
				renderZmanInDiv(time, round)
		}

		return div;
	}

	const monthTable = document.getElementsByClassName('tableGrid')[0];
	const dateSel = monthTable.querySelector('[data-zyData="date"]') || monthTable.querySelector('[data-zyData="datePri"]')

	if (dateSel && !x.data.shabbatOnly) {
		dateSel.appendChild(document.createTextNode(
			jCal.getDate()
				.toLocaleString(
					x.data.lang == "en" ? 'en' : x.data.lang.replace('hb', 'he') + '-u-ca-hebrew',
					{ month: "long" }
				)
		));
		if (!x.data.oneYear) {
			dateSel.appendChild(document.createTextNode(' ' +
				x.data.lang == 'hb'
				? ` (${hNum.formatHebrewNumber(jCal.getJewishYear())})`
				: " '" + plainDate.withCalendar(x.data.calendar).year.toString().slice(-2)
			));
		}
	}

	/** @typedef {{ datesToZman: Map<Temporal.PlainDate, Record<string, Temporal.ZonedDateTime>>; extra?: string } & ({ytI: number; title?: string} | { title: string })} highlightedZman */
	/** @type {highlightedZman[]} */
	let highlightZmanim = [];

	function populateHighlightZmanim() {
		if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH || (jCal.getYomTovIndex() == WebsiteLimudCalendar.PESACH && jCal.getJewishDayOfMonth() < 18 && x.data.pocket)) {
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
		} else if (x.data.pocket) {
			if (jCal.isTaanis() && !jCal.isYomKippur() || (jCal.tomorrow().isTaanis() && !jCal.tomorrow().isYomKippur())) {
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
						.map(mak => (typeof mak == "number" ? makamObj['makamNameMap' + (x.data.lang == 'hb' ? 'Heb' : 'Eng')][mak] : mak))
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
			}

			if (jCal.tomorrow().isChanukah()) {
				/** @type {highlightedZman} */
				let hanukahObj = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.CHANUKAH);
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
			}
		}
	}

	/** @type {HTMLElement} */
	// @ts-ignore
	const backupMonthTable = monthTable.cloneNode(true);

	plainDate = plainDate.withCalendar(x.data.calendar).with({ day: 1 });
	plainDateForceCal = plainDate.withCalendar('iso8601');
	let initTekuf = zmanCalc.nextTekufa(zmanCalc.config.fixedMil);
	let halfDaysInMonth = plainDate.daysInMonth;
	if (x.data.shabbatOnly) {
		if (plainDate.add({ months: 1 }).year == plainDate.year)
			halfDaysInMonth += plainDate.add({ months: 1 }).daysInMonth;
	} else if (x.data.pocket) {
		halfDaysInMonth = Math.floor(plainDate.daysInMonth / 2);
	}

	/** @type {Map<string, number[]>} */
	const jewishMonthsInSecMonth = new Map();
	const dayMinusOne = plainDate.subtract({ days: 1 });
	const dayMinusOneForceCal = plainDateForceCal.subtract({ days: 1 });

	for (let index = 1; index <= halfDaysInMonth; index++) {
		plainDate = dayMinusOne.add({ days: index });
		plainDateForceCal = dayMinusOneForceCal.add({ days: index });
		jCal.setDate(plainDateForceCal)
		zmanCalc.setDate(plainDateForceCal)

		populateHighlightZmanim();

		if (x.data.shabbatOnly && !jCal.isAssurBemelacha() && !jCal.tomorrow().isAssurBemelacha() && !jCal.isTaanis() && !jCal.isPurim()) continue;

		if (jCal.getJewishDayOfMonth() <= 14 && jCal.getJewishDayOfMonth() >= 7 && (!x.data.shabbatOnly || (jCal.isAssurBemelacha() && !jCal.tomorrow().isAssurBemelacha()))) {
			const bLevIndex = jCal.getJewishMonth() + '-' + jCal.getJewishYear();
			if (jewishMonthsInSecMonth.has(bLevIndex))
				jewishMonthsInSecMonth.get(bLevIndex).push(jCal.getJewishDayOfMonth())
			else
				jewishMonthsInSecMonth.set(bLevIndex, [jCal.getJewishDayOfMonth()])
		}

		const newWeekSeparator = !x.data.shabbatOnly && index !== halfDaysInMonth && jCal.getDayOfWeek() == 7;

		for (const [shitaName, shitaRound] of x.data.allShitot) {
			const cell = handleShita(shitaName, shitaRound);
			if (!cell) continue;

			if (shitaName !== 'blank') {
				if (newWeekSeparator)
					cell.classList.add('lastRow')
				else if (index !== halfDaysInMonth)
					cell.classList.add('borderRow');
			}

			monthTable.appendChild(cell)
		}
	}

	function handleSingleBL(hanukaForTevet = false) {
		if (!jewishMonthsInSecMonth.size)
			return;

		const jMonthForBLevana = [...jewishMonthsInSecMonth.entries()].sort((a, b) => b[1].length - a[1].length)[0][0]
		const jCalBMoon = jCal.clone();
		jCalBMoon.setJewishDate(parseInt(jMonthForBLevana.split('-')[1]), parseInt(jMonthForBLevana.split('-')[0]), 14);

		if (jCalBMoon.getJewishMonth() == KosherZmanim.JewishDate.TISHREI || (!x.data.pocket && jCalBMoon.getJewishMonth() == KosherZmanim.JewishDate.NISSAN))
			return;

		const bLContain = document.createElement("div");
		const bLTitl = document.createElement("h5");

		const blTimes = {
			start: jCalBMoon.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()),
			end: jCalBMoon.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone())
		}

		const bLTimesDispl = document.createElement("p");
		bLTimesDispl.classList.add('mb-0');

		bLContain.appendChild(bLTitl);
		bLContain.appendChild(bLTimesDispl);

		const tachanunAffectedMonths = [
			WebsiteLimudCalendar.KISLEV,
			WebsiteLimudCalendar.SHEVAT,
			WebsiteLimudCalendar.ADAR,
			WebsiteLimudCalendar.ADAR_II,
			WebsiteLimudCalendar.IYAR,
			WebsiteLimudCalendar.SIVAN,
			WebsiteLimudCalendar.ELUL
		]

		if (jCalBMoon.getJewishMonth() == KosherZmanim.JewishDate.NISSAN) {
			bLTitl.innerHTML = {
				hb: "הלכות תפילה לחודש " + jCalBMoon.formatJewishMonth().he,
				en: "Month of " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer",
				"en-et": "Ḥodesh " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];

			if (Temporal.ZonedDateTime.compare(blTimes.end, zDTFromFunc(zmanCalc.chainDate(jCalBMoon.getDate()).getNetz())) == -1) {
				bLTimesDispl.appendChild(document.createTextNode({
					"hb": "טווח זמן לברכת הלבנה (מומלץ): ",
					"en": "Range for (recommended) ברכת הלבנה: ",
					"en-et": "Range for (recommended) Birkath Ha'Levana: ",
				}[x.data.lang] + blTimes.start.toLocaleString(...dtFBLevana) + " - " + blTimes.end.toLocaleString(...dtFBLevana)));
			} else {
				bLTimesDispl.appendChild(document.createTextNode({
					"en": "Recommended start time for Birkath Ha'Levana: ",
					"hb": "זמן מומלץ לתחילת ברכת הלבנה: ",
					"en-et": "Recommended start time for ברכת הלבנה: ",
				}[x.data.lang] + blTimes.start.toLocaleString(...dtFBLevana)));
				bLTimesDispl.appendChild(document.createElement("br"));
				bLTimesDispl.appendChild(document.createTextNode({
					"hb": "מועד אחרון: זמן הנץ של ערב חג",
					"en": "Deadline: before the holiday (sunrise of the previous day)",
					"en-et": "Deadline: before the holiday (sunrise of the previous day)"
				}[x.data.lang]));

				bLContain.appendChild(document.createElement("hr"));

				const blTefilaRule = document.createElement("p");
				blTefilaRule.classList.add('mb-0');
				blTefilaRule.innerHTML = {
					"en": "No Taḥanun said throughout the month",
					"hb": "אין אומרים תחנון כל חודש ניסן",
					"en-et": "No Taḥanun said throughout the month"
				}[x.data.lang];
				bLContain.appendChild(blTefilaRule);
			}
		} else if (x.data.pocket && jCalBMoon.getJewishMonth() == KosherZmanim.JewishCalendar.AV) {
			bLTitl.innerHTML = {
				hb: "הלכות תפילה לחודש " + jCalBMoon.formatJewishMonth().he,
				en: "Month of " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer",
				"en-et": "Ḥodesh " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];

			bLTimesDispl.appendChild(document.createTextNode({
				"hb": "טווח זמן לברכת הלבנה: ",
				"en": "Range for ברכת הלבנה: ",
				"en-et": "Range for Birkath Ha'Levana: ",
			}[x.data.lang] + blTimes.start.toLocaleString(...dtFBLevana) + " - " + blTimes.end.toLocaleString(...dtFBLevana)));
			bLTimesDispl.appendChild(document.createElement("br"));
			bLTimesDispl.appendChild(document.createTextNode({
				"hb": "(מומלץ להמתין לאחר הצום)",
				"en": "(Recommended to wait until after the fast)",
				"en-et": "(Recommended to wait until after the fast)",
			}[x.data.lang]));

			bLContain.appendChild(document.createElement("hr"));

			const tishaBeavJCal = jCal.chainYomTovIndex(WebsiteLimudCalendar.TISHA_BEAV);
			const tuBeavJCal = jCal.chainYomTovIndex(WebsiteLimudCalendar.TU_BEAV);

			const blTefilaRule = document.createElement("p");
			blTefilaRule.classList.add('mb-0');
			blTefilaRule.innerHTML = {
				"en": "No Taḥanun said on " + tishaBeavJCal.formatFancyDate().en + " (9<sup>th</sup> of Av) and " + tuBeavJCal.formatFancyDate().en + " (15<sup>th</sup> of Av)",
				"hb": "אין אומרים תחנון בתשעה באב ובט״ו באב",
				"en-et": "No Taḥanun said on " + tishaBeavJCal.formatFancyDate().en + " (Tish'a B'Av) and " + tuBeavJCal.formatFancyDate().en + " (Tu B'Av)",
			}[x.data.lang];
			bLContain.appendChild(blTefilaRule);
		} else if (x.data.pocket
			&& (tachanunAffectedMonths.includes(jCalBMoon.getJewishMonth())
				|| jCalBMoon.getJewishMonth() == KosherZmanim.JewishCalendar.TEVES && hanukaForTevet)) {
			bLTitl.innerHTML = {
				hb: "הלכות תפילה לחודש " + jCalBMoon.formatJewishMonth().he,
				en: "Month of " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer",
				"en-et": "Ḥodesh " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];

			bLTimesDispl.appendChild(document.createTextNode({
				"hb": "טווח זמן לברכת הלבנה: ",
				"en": "Range for ברכת הלבנה: ",
				"en-et": "Range for Birkath Ha'Levana: ",
			}[x.data.lang] + blTimes.start.toLocaleString(...dtFBLevana) + " - " + blTimes.end.toLocaleString(...dtFBLevana)));
			bLTimesDispl.appendChild(document.createElement("br"));

			const tuBishvat = jCalBMoon.chainYomTovIndex(WebsiteLimudCalendar.TU_BESHVAT);
			const purimKatan = jCalBMoon.chainYomTovIndex(WebsiteLimudCalendar.PURIM_KATAN);
			const purim = jCalBMoon.chainYomTovIndex(WebsiteLimudCalendar.PURIM);
			const pesahSheni = jCalBMoon.chainYomTovIndex(WebsiteLimudCalendar.PESACH_SHENI);
			const lagBaomer = jCalBMoon.chainYomTovIndex(WebsiteLimudCalendar.LAG_BAOMER);
			const lastDayOfNoTachanunSivan = jCalBMoon.chainJewishDate(jCalBMoon.getJewishYear(), WebsiteLimudCalendar.SIVAN, 12);
			const erevRH = jCalBMoon.chainYomTovIndex(WebsiteLimudCalendar.EREV_ROSH_HASHANA);
			bLTimesDispl.insertAdjacentHTML('beforeend', {
				[WebsiteLimudCalendar.KISLEV]: {
					"hb": "אין אומרים תחנון בחנוכה",
					"en": "No Taḥanun said throughout Ḥanuka",
					"en-et": "No Taḥanun said throughout Ḥanuka",
				},
				[WebsiteLimudCalendar.TEVES]: {
					"hb": "אין אומרים תחנון בחנוכה",
					"en": "No Taḥanun said throughout Ḥanuka",
					"en-et": "No Taḥanun said throughout Ḥanuka",
				},
				[WebsiteLimudCalendar.SHEVAT]: {
					"hb": "אין אומרים תחנון בט״ו בשבט",
					"en": "No Taḥanun said on " + tuBishvat.formatFancyDate().en + " (15<sup>th</sup> of Shevat)",
					"en-et": "No Taḥanun said on " + tuBishvat.formatFancyDate().en + " (Tu Bi'Shevat)",
				},
				[WebsiteLimudCalendar.ADAR]: {
					"hb": "אין אומרים תחנון בפורים",
					"en": "No Taḥanun said on "
						+ purimKatan.formatFancyDate().en + ` (Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""}) & `
						+ purimKatan.tomorrow().formatFancyDate().en + ` (Shushan Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})`,
					"en-et": "No Taḥanun said on "
						+ purimKatan.formatFancyDate().en + ` (Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""}) & `
						+ purimKatan.tomorrow().formatFancyDate().en + ` (Shushan Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})`,
				},
				[WebsiteLimudCalendar.ADAR_II]: {
					"hb": "אין אומרים תחנון בפורים",
					"en": "No Taḥanun said on "
						+ purim.formatFancyDate().en + ` (${yomTovObj[purim.getYomTovIndex()].en}) & `
						+ purim.tomorrow().formatFancyDate().en + ` (${yomTovObj[purim.tomorrow().getYomTovIndex()].en})`,
					"en-et": "No Taḥanun said on "
						+ purim.formatFancyDate().en + ` (${yomTovObj[purim.getYomTovIndex()].en}) & `
						+ purim.tomorrow().formatFancyDate().en + ` (${yomTovObj[purim.tomorrow().getYomTovIndex()].en})`,
				},
				[WebsiteLimudCalendar.IYAR]: {
					"hb": "אין אומרים תחנון בפסח שני ולג בעומר",
					"en": "No Taḥanun said on "
						+ pesahSheni.formatFancyDate().en + ` (${yomTovObj[pesahSheni.getYomTovIndex()].en}) & `
						+ lagBaomer.formatFancyDate().en + ` (${yomTovObj[lagBaomer.getYomTovIndex()].en})`,
					"en-et": "No Taḥanun said on"
						+ pesahSheni.formatFancyDate().en + ` (${yomTovObj[pesahSheni.getYomTovIndex()].en}) & `
						+ lagBaomer.formatFancyDate().en + ` (${yomTovObj[lagBaomer.getYomTovIndex()].en})`,
				},
				[WebsiteLimudCalendar.SIVAN]: {
					"hb": "אין אומרים תחנון מראש חודש עד י״ב בסיון)",
					"en": "No Taḥanun said from Rosh Ḥodesh until " + lastDayOfNoTachanunSivan.formatFancyDate().en + ` (12<sup>th</sup> of Sivan)`,
					"en-et": "No Taḥanun said from Rosh Ḥodesh until " + lastDayOfNoTachanunSivan.formatFancyDate().en + ` (12<sup>th</sup> of Sivan)`,
				},
				[WebsiteLimudCalendar.ELUL]: {
					"hb": "אין אומרים תחנון בערב ראש השנה",
					"en": "No Taḥanun said on " + erevRH.formatFancyDate().en + " (Erev Rosh Ha'Shana)",
					"en-et": "No Taḥanun said on " + erevRH.formatFancyDate().en + " (Erev Rosh Ha'Shana)",
				}
			}[jCalBMoon.getJewishMonth()][x.data.lang]);
		} else {
			bLTitl.innerHTML = {
				hb: "ברכת הלבנה - חודש " + jCalBMoon.formatJewishMonth().he,
				en: "Moon-Blessing - Month of " + jCalBMoon.formatJewishMonth().en,
				"en-et": "Birkath Ha'Levana - Ḥodesh " + jCalBMoon.formatJewishMonth().en
			}[x.data.lang];

			bLTimesDispl.appendChild(document.createTextNode({
				"hb": "תחילת: ",
				"en": "Beginning: ",
				"en-et": "Beginning: "
			}[x.data.lang] + jCalBMoon.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()).toLocaleString(...dtFBLevana)));
			bLTimesDispl.appendChild(document.createElement("br"));
			bLTimesDispl.appendChild(document.createTextNode({
				"hb": 'סוף (רמ"א): ',
				"en": 'End (Rama): ',
				"en-et": "End (Rama): "
			}[x.data.lang] + jCalBMoon.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()).toLocaleString(...dtFBLevana)));
		}

		return bLContain;
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

		if ((nextTekufaJDate.getJewishMonth() == KosherZmanim.JewishDate.TISHREI && !x.data.israel)
			|| (thisMonthFooter && thisMonthFooter.lastElementChild.childElementCount < 2)
			|| x.data.pocket) {
			tekufaTitle.innerHTML += " - " + tekufaDate;
		} else {
			tekufaTimingDiv.innerHTML = tekufaDate;
			tekufaTimingDiv.appendChild(document.createElement("br"));
		}
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
				"en": "Switch to ברך עלינו " + (x.data.pocket ? "at the night prayer of " : "on "),
				"hb": "תחליף לברך עלינו " + (x.data.pocket ? "בתפילת ערבית של " : "ביום "),
				"en-et": "Switch to ברך עלינו " + (x.data.pocket ? "at Tefilat Arvit of " : "on ")
			}[x.data.lang] + WebsiteLimudCalendar.formatFancyDate(initTekuf.toPlainDate().add({ days: 59 }), {
				dayLength: 'long',
				monthLength: 'short',
				ordinal: true
			})
		}

		tekufaContainer.appendChild(tekufaTitle);
		tekufaContainer.appendChild(tekufaTimingDiv);

		return tekufaContainer;
	}

	/** @type {HTMLDivElement} */
	// @ts-ignore
	let thisMonthFooter = document.getElementsByClassName("zyCalFooter")[0];
	if (thisMonthFooter) {
		const erevPesah = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.PESACH && high.datesToZman.entries().find(([date, data]) => 'sofZemanAhilathHametz' in data));
		const yomKippur = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.YOM_KIPPUR);
		if (erevPesah && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-hametz')) {
			const zmanimOfErev = erevPesah.datesToZman.entries().find(([date, data]) => 'sofZemanAhilathHametz' in data);
			const hamesName = WebsiteLimudCalendar.formatFancyDate(zmanimOfErev[0])[x.data.lang];
			const hametzContainer = document.createElement("div");
			const hametzTitle = document.createElement("h5");
			hametzTitle.innerHTML = {
				hb: "ערב פסח",
				en: "Passover Eve's Ḥametz Times - " + hamesName,
				"en-et": "Erev Pesaḥ for Ḥametz - " + hamesName
			}[x.data.lang];

			const hametzTiming = document.createElement("p");
			hametzTiming.classList.add('mb-0');
			hametzTiming.appendChild(document.createTextNode({
				"hb": "סןף זמן אחילת חמץ: ",
				"en": "Stop eating by ",
				"en-et": "Stop eating by "
			}[x.data.lang] + zmanimOfErev[1].sofZemanAhilathHametz.toLocaleString(...defaulTF)));
			hametzTiming.appendChild(document.createElement("br"));
			hametzTiming.appendChild(document.createTextNode({
				"hb": "זמן ביעור חמץ עד ",
				"en": "Dispose by ",
				"en-et": "Dispose by "
			}[x.data.lang] + zmanimOfErev[1].sofZemanBiurHametz.toLocaleString(...defaulTF)));

			if (!x.data.shabbatOnly) {
				const hr = document.createElement("hr");
				hr.style.margin = ".5rem 0";
				hametzTiming.appendChild(hr);

				const nissanJCal = jCal.clone();
				nissanJCal.setDate(zmanimOfErev[0]);

				hametzTiming.appendChild(document.createTextNode({
					"hb": "זמן ברכת הלבנה לכתחילה לפני",
					"en": "Say Birkat Ha'Levana before the holiday",
					"en-et": "Say Birkat Ha'Levana before the holiday"
				}[x.data.lang]));
				hametzTiming.appendChild(document.createElement("br"));
				hametzTiming.appendChild(document.createTextNode({
					"hb": "תחילת זמן (לכתחילה): ",
					"en": "Earliest (preferable) time: ",
					"en-et": "Earliest (preferable) time: "
				}[x.data.lang] + nissanJCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()).toLocaleString(...dtFBLevana)));
			}

			hametzContainer.appendChild(hametzTitle);
			hametzContainer.appendChild(hametzTiming);
			thisMonthFooter.lastElementChild.appendChild(hametzContainer);
		} else if (yomKippur && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-yomkippur')) {
			const zmanimOfYK = yomKippur.datesToZman.entries().find(([date, data]) => 'birkatKohanim' in data);

			const yKName = WebsiteLimudCalendar.formatFancyDate(zmanimOfYK[0])[x.data.lang];
			const yKContainer = document.createElement("div");
			const yKTitle = document.createElement("h5");
			yKTitle.innerHTML = {
				hb: "יום כיפור",
				en: "Yom Kippur Times - " + yKName,
				"en-et": "Yom Kippur - " + yKName
			}[x.data.lang];

			const yKTiming = document.createElement("p");
			yKTiming.classList.add('mb-0');
			yKTiming.appendChild(document.createTextNode({
				"hb": "תתחיל מוסף לפני ",
				"en": "Start מוסף before ",
				"en-et": "Start מוסף before "
			}[x.data.lang] + zmanimOfYK[1].musaf.toLocaleString(...defaulTF)));
			yKTiming.appendChild(document.createElement("br"));
			yKTiming.appendChild(document.createTextNode({
				"hb": "ברכת כהנים לפני ",
				"en": "Finish ברכת כהנים before ",
				"en-et": "Finish ברכת כהנים before "
			}[x.data.lang] + zmanimOfYK[1].birkatKohanim.toLocaleString(...defaulTF)));

			const tishriJCal = jCal.clone();
			tishriJCal.setDate(zmanimOfYK[0]);
			const tishriBLEnd = tishriJCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone());
			if (!x.data.shabbatOnly && Temporal.ZonedDateTime.compare(tishriBLEnd, zDTFromFunc(zmanCalc.chainDate(zmanimOfYK[0].add({ days: 4 })).getNetz())) == -1) {
				const hr = document.createElement("hr");
				hr.style.margin = ".5rem 0";
				yKTiming.appendChild(hr);

				yKTiming.appendChild(document.createTextNode({
					"hb": "זמן ברכת הלבנה לכתחילה לפני ",
					"en": "Preferable time for Birkat Ha'Levana before ",
					"en-et": "Preferable time for Birkat Ha'Levana before "
				}[x.data.lang] + tishriBLEnd.toLocaleString(...dtFBLevana)));
			}

			yKContainer.appendChild(yKTitle);
			yKContainer.appendChild(yKTiming);
			thisMonthFooter.lastElementChild.appendChild(yKContainer);
		}

		if (thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-levana')) {
			if (!x.data.shabbatOnly) {
				const bLContain = handleSingleBL();
				if (bLContain)
					thisMonthFooter.lastElementChild.appendChild(bLContain);
			} else {
				const bLContain = document.createElement("div");
				const bLTitl = document.createElement("h5");
				bLTitl.innerHTML = {
					hb: "מוצאי שבת ויו\"ט לברכת הלבנה",
					en: "Shabbat & YT for Birkath Ha'Levana",
					"en-et": "Shabbat & YT for Birkath Ha'Levana"
				}[x.data.lang];

				const bLTimes = document.createElement("p");
				bLTimes.classList.add('mb-0');

				for (const jMonthForBLevana of jewishMonthsInSecMonth.keys()) {
					const jCalBMoon = jCal.clone();
					jCalBMoon.setJewishDate(parseInt(jMonthForBLevana.split('-')[1]), parseInt(jMonthForBLevana.split('-')[0]), 15);

					let bLShabDays = jewishMonthsInSecMonth.get(jMonthForBLevana).join(', ')
					if (x.data.lang == "en") {
						bLShabDays = jewishMonthsInSecMonth.get(jMonthForBLevana)
							.map((num, i, curArray) => {
								jCalBMoon.setJewishDayOfMonth(num)
								if (i == 0)
									return monthForLocale('en', "short")[jCalBMoon.getDate().month] + " " + getOrdinal(jCalBMoon.getGregorianDayOfMonth(), true)

								const curGregMonth = jCalBMoon.getGregorianMonth()
								jCalBMoon.setJewishDayOfMonth(curArray[i - 1])
								const pastGregMonth = jCalBMoon.getGregorianMonth();
								jCalBMoon.setJewishDayOfMonth(num);

								if (curGregMonth == pastGregMonth)
									return getOrdinal(jCalBMoon.getGregorianDayOfMonth(), true)
								else
									return monthForLocale('en', "short")[jCalBMoon.getDate().month] + " " + getOrdinal(jCalBMoon.getGregorianDayOfMonth(), true)
							})
							.join(', ')
					}

					bLTimes.insertAdjacentHTML('beforeend', jCalBMoon.formatJewishMonth()[x.data.lang == "hb" ? "he" : "en"] + " - " + bLShabDays);
					bLTimes.appendChild(document.createElement('br'));
				}

				bLContain.appendChild(bLTitl);
				bLContain.appendChild(bLTimes);
				thisMonthFooter.lastElementChild.appendChild(bLContain);
			}
		}

		if (thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-tekufa')) {
			const tekufaContainer = handleTekufa(thisMonthFooter.lastElementChild.getAttribute('data-zyfooter-tekufa') == 'beforeHatzot');
			if (tekufaContainer)
				thisMonthFooter.lastElementChild.appendChild(tekufaContainer);
		}

		return { month: x.data.month, htmlContent: [monthTable.outerHTML, thisMonthFooter.outerHTML] };
	} else {
		const secondSide = document.getElementsByClassName('secondSide')[0];

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
					dateElem.innerHTML = WebsiteLimudCalendar.formatFancyDate(dateRange[0], { dayLength: "short", monthLength: "short", ordinal: true})["en"]
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
					dateText += WebsiteLimudCalendar.formatFancyDate(dateRange[0], { dayLength: "short", monthLength: "short", ordinal: true})[x.data.lang]
					dateText += " - ";
					dateText += WebsiteLimudCalendar.formatFancyDate(dateRange[dateRange.length - 1], { dayLength: "short", monthLength: "short", ordinal: true})[x.data.lang]
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
										innerRow[0] += ` (${getOrdinal(candleLightIndex++, true)} night):`;
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

			const bLContain = handleSingleBL(ssFH.classList.contains('hanukahSplitter'));
			if (bLContain)
				miscTimes.appendChild(bLContain);

			if (!bLContain && !tekufaContainer) {
				miscTimes.parentElement.removeChild(miscTimes);
				ssFH.classList.remove('miscTimesSplitter');
			}

			return ssFH;
		}

		const firstSideClone = handleSecondSide();

		highlightZmanim = [];
		initTekuf = zmanCalc.nextTekufa(zmanCalc.config.fixedMil);
		jewishMonthsInSecMonth.clear();
		for (let index = halfDaysInMonth + 1; index <= plainDate.daysInMonth; index++) {
			plainDate = dayMinusOne.add({ days: index })
			plainDateForceCal = plainDate.withCalendar("iso8601");
			jCal.setDate(plainDateForceCal)
			zmanCalc.setDate(plainDateForceCal)

			populateHighlightZmanim();

			if (x.data.shabbatOnly && !jCal.isAssurBemelacha() && !jCal.tomorrow().isAssurBemelacha() && !jCal.isTaanis() && !jCal.isPurim()) continue;

			if (jCal.getJewishDayOfMonth() <= 14 && jCal.getJewishDayOfMonth() >= 7 && (!x.data.shabbatOnly || (jCal.isAssurBemelacha() && !jCal.tomorrow().isAssurBemelacha()))) {
				const bLevIndex = jCal.getJewishMonth() + '-' + jCal.getJewishYear();
				if (jewishMonthsInSecMonth.has(bLevIndex))
					jewishMonthsInSecMonth.get(bLevIndex).push(jCal.getJewishDayOfMonth())
				else
					jewishMonthsInSecMonth.set(bLevIndex, [jCal.getJewishDayOfMonth()])
			}

			const newWeekSeparator = !x.data.shabbatOnly && index !== plainDate.daysInMonth && jCal.getDayOfWeek() == 7;

			for (const [shitaName, shitaRound] of x.data.allShitot) {
				const cell = handleShita(shitaName, shitaRound);
				if (!cell) continue;

				if (shitaName !== 'blank') {
					if (newWeekSeparator)
						cell.classList.add('lastRow')
					else if (index !== plainDate.daysInMonth)
						cell.classList.add('borderRow');
				}

				backupMonthTable.appendChild(cell)
			}
		}

		const secondSideClone = handleSecondSide();

		return { month: x.data.month, htmlContent: [monthTable.outerHTML, firstSideClone.outerHTML, backupMonthTable.outerHTML, secondSideClone.outerHTML] };
	}
}

if (Worker) {
	addEventListener('message', (eventData) => postMessage(messageHandler(eventData)));
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
function n2hebDateOrdinal(dayOfWeek, prefixForShabbat=false) {
	const numResult = (dayOfWeek + 1) % 7;
	return (numResult == 0 ? (prefixForShabbat ? "ה" : "") + "שבת" : n2wordsOrdinal[numResult])
}

export default messageHandler;