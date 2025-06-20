// @ts-check

import * as KosherZmanim from '../../libraries/kosherZmanim/kosher-zmanim.esm.js';
import { Temporal } from '../../libraries/kosherZmanim/kosher-zmanim.esm.js';
import WebsiteLimudCalendar from '../WebsiteLimudCalendar.js';
import { parseHTML } from '../../libraries/linkedom/linkedom.js'
import { HebrewNumberFormatter, daysForLocale, getOrdinal, monthForLocale } from '../WebsiteCalendar.js';
import { ZemanFunctions, zDTFromFunc } from '../ROYZmanim.js';
import n2wordsOrdinal from '../misc/n2wordsOrdinal.js';

const icons = {
	havdalah: '<svg viewBox="0 0 100 100"><use href="/assets/images/havdalah.svg#Layer_1"/></svg>',
	candle: '<i class="bi bi-fire"></i>',
	wine: '<img src="/assets/images/icons8-wine-bar-64.png">'
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
	allShitot: string[];
	month: number;
	candleTime: number;
	shabbatOnly: boolean;
	oneYear: boolean;
	mergeTzet: boolean;
  }} singlePageParams */

// "date" of param will have to be in the iso8601 calendar
/**
  * @param {MessageEvent<singlePageParams>} x
 */
function messageHandler (x) {
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

	const amPMStrs = [
		new Temporal.Instant(0n),
		new Temporal.Instant(0n).add({ hours: 12 })
	].map(inst => inst.toLocaleString(defaulTF[0], { hour12: true, hour: 'numeric'}).split(' ').pop());

	let plainDate = Temporal.PlainDate.from(x.data.date)
	const jCal = new WebsiteLimudCalendar();
	jCal.setDate(plainDate)
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
			en: "Rosh Hashana",
			"en-et": "Rosh Hashana"
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
			en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Torah",
			"en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simḥath Torah"
		},

		// Semi-Holidays & Fasts
		[KosherZmanim.JewishCalendar.PESACH_SHENI]: {
			hb: "פסח שני",
			en: "Pesaḥ Sheni",
			"en-et": "Pesaḥ Sheni"
		},
		[KosherZmanim.JewishCalendar.LAG_BAOMER]: {
			hb: "לג בעומר",
			en: "Lag Baomer",
			"en-et": "Lag Baomer"
		},
		[KosherZmanim.JewishCalendar.TU_BEAV]: {
			"he": 'ט"ו באב',
			en: "Tu Be'av",
			"en-et": "Tu Be'av"
		},
		[KosherZmanim.JewishCalendar.TU_BESHVAT]: {
			"he": 'ט"ו בשבת',
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
	}

	function handleShita (/** @type {string} */ shita) {
		const omerSpan = document.createElement("span");
		omerSpan.classList.add("omerText");
		omerSpan.innerHTML = getOrdinal(jCal.tomorrow().getDayOfOmer(), true) + " of omer";

		const div = document.createElement('div');
		div.classList.add('tableCell')

		/**
		 * @param {Temporal.ZonedDateTime} zDT
		 * @param {{dtF: typeof defaulTF; icon?: string, hideAMPM: boolean, appendText?: string}} config
		 */
		function renderZmanInDiv (zDT, config={dtF:defaulTF, icon: undefined, hideAMPM: true}) {
			/** @type {HTMLSpanElement} */
			// @ts-ignore
			const timeElem = flexWorkAround.cloneNode(true);
			if (zDT.dayOfYear !== jCal.getDate().dayOfYear) {
				const dayElem = document.createElement("span");
				dayElem.appendChild(document.createTextNode('⤵️'));

				if (jCal.getDate().dayOfYear > zDT.dayOfYear) {
					dayElem.style.display = 'inline-block';
					dayElem.style.transform = 'scale(-1, 1)';
				}

				timeElem.appendChild(dayElem)
			}

			if (config.icon)
				timeElem.innerHTML += config.icon + " ";

			let timeStr = zDT.toLocaleString(...config.dtF)
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

			renderZmanInDiv(zmanCalc.getMisheyakir(portion / complete))
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
					const rhHebrewDisplay = rhDays.map(day => {
						const numResult = (day + 1) % 7;
						return "ביום " + (numResult == 0 ? "השבת" : n2wordsOrdinal[(day + 1) % 7])
					});

					const daysDisplay = flexWorkAround.cloneNode(true);
					// @ts-ignore
					daysDisplay.classList.add("omerText");
					daysDisplay.appendChild(document.createTextNode(rhHebrewDisplay.join(" ומחרתו ")));
					if (x.data.lang !== 'hb')
						daysDisplay.appendChild(document.createTextNode("/" + rhDays.map(num => daysForLocale('en')[num]).join(" & ")));

					div.appendChild(daysDisplay);
				}

				if (jCal.getDate().dayOfYear == jCal.tomorrow().tomorrow().getMoladAsDate().withTimeZone(geoLocation.getTimeZone()).dayOfYear)
					renderZmanInDiv(
						jCal.tomorrow().tomorrow().getMoladAsDate().withTimeZone(geoLocation.getTimeZone()),
						{
							dtF: [defaulTF[0], {...defaulTF[1], timeZoneName: "short" }],
							icon: "🌑",
							hideAMPM: false
						}
					);

				if (jCal.getDate().dayOfYear == jCal.getTchilasZmanKidushLevana3Days().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getTchilasZmanKidushLevana3Days().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashahar(), time, bLzmanCalc.getTzet()))
						time = bLzmanCalc.getTzet();

					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌘", hideAMPM: false, appendText: " (עיקר הדין)" })
				}

				if (jCal.getDate().dayOfYear == jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashahar(), time, bLzmanCalc.getTzet()))
						time = bLzmanCalc.getTzet();

					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌗", hideAMPM: false, appendText: " (לכתחילה)" })
				}

				let sameTime = false;
				if (jCal.getDate().dayOfYear == jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashahar(), time, bLzmanCalc.getTzet()))
						time = bLzmanCalc.getAlotHashahar();

					if (time.withCalendar("hebrew").day == 15 && time.equals(bLzmanCalc.getAlotHashahar()))
						sameTime = true;

					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌕", hideAMPM: false, appendText: (sameTime ? undefined : " (לכתחילה)") })
				}

				if (jCal.getJewishDayOfMonth() == 15 && !sameTime) {
					let time = zmanCalc.getAlotHashahar();
					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌕", hideAMPM: false, appendText: " (זמן מרן)" })
				}
				break;
			case 'special':
				if (jCal.getDayOfWeek() === 7) {
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

					const hanNightElem = flexWorkAround.cloneNode(true);
					// @ts-ignore
					hanNightElem.classList.add("omerText");
					// @ts-ignore
					hanNightElem.innerHTML = "(" +
						(x.data.lang == "hb" ? "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()]
							: getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night") + ")";
					div.appendChild(hanNightElem);

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
					const yomTovElem = flexWorkAround.cloneNode(true);
					yomTovElem.appendChild(document.createTextNode(yomTovObj[jCal.getYomTovIndex()][x.data.lang]))
					div.appendChild(yomTovElem);

					div.style.fontWeight = "bold";
				}

				if (jCal.isTaanis()) {
					const taanitElem = flexWorkAround.cloneNode(true);
					taanitElem.appendChild(document.createTextNode({
						[WebsiteLimudCalendar.FAST_OF_ESTHER]:
							(x.data.lang == 'hb' ? "תענית אסתר" : "Fast of Esther"),
						[WebsiteLimudCalendar.FAST_OF_GEDALYAH]:
							(x.data.lang == 'hb' ? "צום גדליה" : "Fast of Gedalia"),
						[WebsiteLimudCalendar.YOM_KIPPUR]:
							(x.data.lang == 'hb' ? "יום כיפור" : "Yom Kippur")
					}[jCal.getYomTovIndex()] || (x.data.lang == 'hb' ? "צום" : "Fast")))

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
							x.data.shabbatOnly ? jCal.formatFancyDate('short', false) : (
							jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
							jCal.getDate().toLocaleString('en', { day: 'numeric' }))
						;
						secondaryDate.appendChild(document.createTextNode(
							hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " +
							jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})
						));
						break;
					case 'en-et':
						primaryDate.appendChild(document.createTextNode(
							jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
							jCal.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long', day: "numeric"})
						));
						secondaryDate.appendChild(document.createTextNode(jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })));
						break;
					case 'hb':
						primaryDate.appendChild(document.createTextNode(
							(jCal.getDayOfWeek() == 7 ? "שבת" : n2wordsOrdinal[jCal.getDayOfWeek()]) + " - " +
							hNum.formatHebrewNumber(jCal.getJewishDayOfMonth())
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
					const candleConfig = {dtF: defaulTF, icon: icons.candle, hideAMPM: true}
					if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
						renderZmanInDiv(zmanCalc.getCandleLighting(), candleConfig);
					else if (jCal.getDayOfWeek() === 7)
						renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha()), candleConfig);
					else if (x.data.mergeTzet && zmanCalc)
						renderZmanInDiv(zmanCalc.getTzetHumra(), candleConfig);
					else
						return false;
				}

				if (x.data.allShitot.includes('getTzetHumra') && jCal.isTaanis() && jCal.getJewishMonth() == WebsiteLimudCalendar.AV && jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY)
					return false;

				if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
					renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha()), {dtF: defaulTF, icon: icons.havdalah, hideAMPM: true});

					if (x.data.mergeTzet && jCal.tomorrow().getDayOfOmer() !== -1) {
						omerSpan.style.marginTop = '.1rem';
						div.appendChild(omerSpan);
					}

					if (shita == 'candleLightingRT') {
						renderZmanInDiv(zmanCalc.getTzetRT(), {dtF: defaulTF, icon: {
							'hb': 'ר"ת:',
							"en-et": 'R"T:',
							'en': 'R"T:'
						}[x.data.lang], hideAMPM: true});
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
					renderZmanInDiv(zmanCalc.getTzet(), potForCandle ? {dtF: defaulTF, icon: icons.candle, hideAMPM: true} : undefined)
					if (potForCandle) {
						div.style.gridColumnEnd = "span 2";
					}

					if (jCal.tomorrow().getDayOfOmer() !== -1) {
						div.appendChild(omerSpan);
					}

					if (jCal.tomorrow().getDayOfChanukah() !== -1 && jCal.getDayOfWeek() !== 6) {
						renderZmanInDiv(zmanCalc.getTzet().add({ minutes: 30 }), {dtF: defaulTF, icon: {
							'hb': "תדליק לפני",
							"en-et": "Light before",
							'en': "Light before"
						}[x.data.lang], hideAMPM: true})
						div.lastElementChild.classList.add("omerText");
					}

					if (x.data.mergeTzet && jCal.isTaanis() && !jCal.isYomKippur()) {
						renderZmanInDiv(zmanCalc.getTzetHumra(), {dtF: defaulTF, icon: {
							'hb': "צאת הצום",
							"en-et": "Fast Ends",
							'en': "Fast Ends"
						}[x.data.lang], hideAMPM: true})
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
					potForCandle ? {dtF: defaulTF, icon: icons.candle, hideAMPM: true} :
					havdalahOnWine ? {dtF: defaulTF, icon: icons.wine, hideAMPM: true} :
					undefined;

				renderZmanInDiv(zmanCalc.getTzetHumra(), iconParams)
				if (jCal.isTaanis() && !jCal.isYomKippur()) {
					div.style.fontWeight = "bold";
				}

				if (potForCandle || havdalahOnWine) {
					div.style.gridColumnEnd = "span 2";
				}

				if (jCal.tomorrow().getDayOfOmer() !== -1 && !(jCal.hasCandleLighting() || !jCal.isAssurBemelacha())) {
					div.appendChild(omerSpan);
				}

				break;
			case 'getAlotHashahar':
			case 'getTallAlotHashacharWKorbanot':
				renderZmanInDiv(zmanCalc.getAlotHashahar());
				if (jCal.isTaanis() && jCal.getJewishMonth() !== WebsiteLimudCalendar.AV && !jCal.isYomKippur())
					// @ts-ignore
					div.firstElementChild.style.fontWeight = "bold";

				if (shita == 'getTallAlotHashacharWKorbanot') {
					renderZmanInDiv(zmanCalc.customDawn(), {dtF: defaulTF, icon: `(${{
						'hb': "קרבנות",
						"en-et": "Korbanot",
						'en': "Korbanot"
					}[x.data.lang]}:`, appendText: ")", hideAMPM: true});
					div.lastElementChild.classList.add("omerText");
				}
				break;
			case 'getTallMisheyakir':
				renderZmanInDiv(zmanCalc.getMisheyakir());
				renderZmanInDiv(zmanCalc.getMisheyakir(11/12), {dtF: defaulTF, icon: `(${{
					'hb': "מקדם",
					"en-et": "Early",
					'en': "Early"
				}[x.data.lang]}:`, appendText: ")", hideAMPM: true});
				div.lastElementChild.classList.add("omerText");
				break;
			case 'getNetz':
				const rZIDoptions = {dtF: defaulTF, hideAMPM: true};

				let sunriseTime = zmanCalc.getNetz();
				if (!(sunriseTime instanceof Temporal.ZonedDateTime)) {
					rZIDoptions.dtF = [defaulTF[0], {...defaulTF[1], second: '2-digit'}];
					sunriseTime = sunriseTime.time;
				}

				renderZmanInDiv(sunriseTime, rZIDoptions);
				break;
			case 'getSofZemanShemaGRA':
				renderZmanInDiv(zmanCalc.getSofZemanShemaGRA())

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
			case 'getHatzoth':
				renderZmanInDiv(zmanCalc.getHatzoth());
				if (jCal.isYomKippur()) {
					renderZmanInDiv(zmanCalc.timeRange.current.sunrise.add(zmanCalc.fixedToSeasonal(Temporal.Duration.from({ hours: 7 }))), {dtF: defaulTF, icon: '(' + {
						'hb': "תסיים מוסף לפני ",
						"en-et": "Finish Musaf before ",
						'en': "Finish Musaf before "
					}[x.data.lang], appendText: ")", hideAMPM: true});
					div.lastElementChild.classList.add("omerText");
				}
				break;
			case 'getShkiya':
				renderZmanInDiv(zmanCalc.getShkiya());
				if (jCal.tomorrow().getYomTovIndex() == KosherZmanim.JewishCalendar.TISHA_BEAV)
					div.style.fontWeight = "bold";

				break;
			default:
				// @ts-ignore
				renderZmanInDiv(zmanCalc[shita]())
		}

		if (div.childElementCount == 1 && div.firstElementChild.childNodes.length <= 2) {
			div.style.fontSize = '2.75ex';
			div.style.paddingTop = '.2em'
		}
		return div;
	}

	const monthTable = document.getElementsByClassName('tableGrid')[0]
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

	plainDate = plainDate.withCalendar(x.data.calendar).with({ day: 1 })
	const initTekuf = zmanCalc.nextTekufa(zmanCalc.config.fixedMil);
	let halfDaysInMonth = plainDate.daysInMonth;
	if (x.data.shabbatOnly) {
		if (plainDate.add({ months: 1 }).year == plainDate.year)
			halfDaysInMonth += plainDate.add({ months: 1 }).daysInMonth;
	}
	let hamesDate = null;
	/** @type {Map<string, number>} */
	const jewishMonthsInSecMonth = new Map();
	const dayMinusOne = plainDate.subtract({ days: 1 })
	for (let index = 1; index <= halfDaysInMonth; index++) {
		plainDate = dayMinusOne.add({ days: index })
		jCal.setDate(plainDate.withCalendar("iso8601"))
		zmanCalc.setDate(plainDate.withCalendar("iso8601"))

		if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH)
			hamesDate = jCal.getDate();

		if (!x.data.shabbatOnly || jCal.getJewishDayOfMonth() <= 16) {
			const bLevIndex = jCal.getJewishMonth() + '-' + jCal.getJewishYear();
			const counterIncrease = (jewishMonthsInSecMonth.has(bLevIndex)
				? jewishMonthsInSecMonth.get(bLevIndex) + 1
				: 1);
			jewishMonthsInSecMonth.set(bLevIndex, counterIncrease);
		}

		if (x.data.shabbatOnly && !jCal.isAssurBemelacha() && !jCal.tomorrow().isAssurBemelacha() && !jCal.isTaanis() && !jCal.isPurim()) continue;

		for (const shita of x.data.allShitot) {
			const cell = handleShita(shita);
			if (!cell) continue;

			cell.classList.add(index == halfDaysInMonth ? 'lastRow' : 'borderRow');
			monthTable.appendChild(cell)
		}
	}

	/** @type {HTMLDivElement} */
	// @ts-ignore
	const thisMonthFooter = document.getElementsByClassName("zyCalFooter")[0];
	if (!initTekuf.equals(zmanCalc.nextTekufa(zmanCalc.config.fixedMil).withTimeZone(geoLocation.getTimeZone()))
	 && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-tekufa')) {
		const tekufaZmanCalc = zmanCalc.chainDate(initTekuf.toPlainDate())
		if (!thisMonthFooter.lastElementChild.getAttribute('data-zyfooter-tekufa').length
		 || (thisMonthFooter.lastElementChild.getAttribute('data-zyfooter-tekufa') == 'beforeHatzot'
			 && Temporal.ZonedDateTime.compare(initTekuf, tekufaZmanCalc.getHatzoth()) == -1)) {
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

			const tekufaDate = formatDate(initTekuf);
			const tekufaTimingDiv = document.createElement("p");

			if (nextTekufaJDate.getJewishMonth() == KosherZmanim.JewishDate.TISHREI && !x.data.israel) {
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
			].join('-')));

			if (nextTekufaJDate.getJewishMonth() == KosherZmanim.JewishDate.TISHREI && !x.data.israel) {
				tekufaTimingDiv.appendChild(document.createElement("br"));
				tekufaTimingDiv.appendChild(document.createTextNode({
					"en": "Switch to ברך עלינו on ",
					"hb": "תחליף לברך עלינו ביום ",
					"en-et": "Switch to ברך עלינו on "
				}[x.data.lang] + formatDate(initTekuf.add({ days: 60 }))))
			}

			tekufaContainer.appendChild(tekufaTitle);
			tekufaContainer.appendChild(tekufaTimingDiv);
			thisMonthFooter.lastElementChild.appendChild(tekufaContainer);
		}
	}

	if (hamesDate && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-hametz')) {
		const hamesName = formatDate(hamesDate);
		const hametzContainer = document.createElement("div");
		const hametzTitle = document.createElement("h5");
		hametzTitle.innerHTML = {
			hb: "ערב פסח",
			en: "Passover Eve's Ḥametz Times - " + hamesName,
			"en-et": "Erev Pesaḥ for Ḥametz - " + hamesName
		}[x.data.lang];

		const hametzTiming = document.createElement("p");
		hametzTiming.appendChild(document.createTextNode({
			"hb": "סןף זמן אחילת חמץ: ",
			"en": "Stop eating by ",
			"en-et": "Stop eating by "
		}[x.data.lang] + zmanCalc.chainDate(hamesDate).getSofZemanAhilathHametz().toLocaleString(...defaulTF)));
		hametzTiming.appendChild(document.createElement("br"));
		hametzTiming.appendChild(document.createTextNode({
			"hb": "זמן ביעור חמץ עד ",
			"en": "Dispose by ",
			"en-et": "Dispose by "
		}[x.data.lang] + zmanCalc.chainDate(hamesDate).getSofZemanBiurHametz().toLocaleString(...defaulTF)));

		hametzContainer.appendChild(hametzTitle);
		hametzContainer.appendChild(hametzTiming);
		thisMonthFooter.lastElementChild.appendChild(hametzContainer);
	}

	if (thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-levana')) {
		/** @type {[locales?: string | string[], options?: Intl.DateTimeFormatOptions]} */
		const dtFBLevana = [x.data.lang == 'hb' ? 'he' : 'en', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hourCycle: x.data.timeFormat,
			hour: 'numeric',
			minute: '2-digit'
		}]

		const jMonthsForBLevana = x.data.shabbatOnly
			? jewishMonthsInSecMonth.keys()
			: [[...jewishMonthsInSecMonth.entries()].sort((a, b) => b[1] - a[1])[0][0]]
		for (const jMonthForBLevana of jMonthsForBLevana) {
			const jCalBMoon = jCal.clone();
			jCalBMoon.setJewishDate(parseInt(jMonthForBLevana.split('-')[1]), parseInt(jMonthForBLevana.split('-')[0]), 15);

			const bLContain = document.createElement("div");
			const bLTitl = document.createElement("h5");
			bLTitl.innerHTML = {
				hb: "ברכת הלבנה - חודש " + jCalBMoon.formatJewishMonth().he,
				en: "Moon-Blessing - Month of " + jCalBMoon.formatJewishMonth().en,
				"en-et": "Birkath Halevana - Ḥodesh " + jCalBMoon.formatJewishMonth().en
			}[x.data.lang];

			const bLTimes = document.createElement("p");
			bLTimes.appendChild(document.createTextNode({
				"hb": "תחילת: ",
				"en": "Beginning: ",
				"en-et": "Beginning: "
			}[x.data.lang] + jCalBMoon.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()).toLocaleString(...dtFBLevana)));
			bLTimes.appendChild(document.createElement("br"));
			bLTimes.appendChild(document.createTextNode({
				"hb": 'סוף (רמ"א): ',
				"en": 'End (Rama): ',
				"en-et": "End (Rama): "
			}[x.data.lang] + jCalBMoon.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()).toLocaleString(...dtFBLevana)));

			bLContain.appendChild(bLTitl);
			bLContain.appendChild(bLTimes);
			thisMonthFooter.lastElementChild.appendChild(bLContain);
		}
	}

	postMessage({ month: x.data.month, data: { monthHTML: monthTable.outerHTML, footerHTML: thisMonthFooter.outerHTML } })
}
addEventListener('message', messageHandler)

/**
 * @param {Temporal.ZonedDateTime} start
 * @param {Temporal.ZonedDateTime} middle
 * @param {Temporal.ZonedDateTime} end
 */
function rangeTimes(start, middle, end, inclusive=true) {
	const acceptedValues = [1];
	if (inclusive)
		acceptedValues.push(0);

	return acceptedValues.includes(Temporal.ZonedDateTime.compare(middle, start)) && acceptedValues.includes(Temporal.ZonedDateTime.compare(end, middle))
};

/** @param {Temporal.ZonedDateTime|Temporal.PlainDate} date */
function formatDate(date) {
	return `${daysForLocale('en')[date.dayOfWeek]}, ${monthForLocale('en')[date.month]} ${getOrdinal(date.day, true)}`
}