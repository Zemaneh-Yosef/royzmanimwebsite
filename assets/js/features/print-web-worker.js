// @ts-check

import * as KosherZmanim from '../../libraries/kosherZmanim/kosher-zmanim.js';
import { Temporal } from '../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteLimudCalendar from '../WebsiteLimudCalendar.js';
import { parseHTML } from '../../libraries/linkedom/linkedom.js'
import { HebrewNumberFormatter, daysForLocale, getOrdinal, monthForLocale } from '../WebsiteCalendar.js';
import { ZemanFunctions, methodNames, zDTFromFunc } from '../ROYZmanim.js';
import n2wordsOrdinal from '../misc/n2wordsOrdinal.js';
import makamObj from '../makamObj.js';

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

	/**
	 * @param {Temporal.ZonedDateTime} zDT
	 * @param {'earlier'|'later'|'noRound'} round
	 */
	function handleRound(zDT, round) {
		return round === 'noRound' || zDT.second < 20 || (zDT.second < 40 && round == 'earlier') ? zDT : zDT.add({ minutes: 1 }).with({ second: 0 });
	}

	const allShitotNames = x.data.allShitot.map(shita => shita[0]);

	function handleShita (/** @type {string} */ shita, /** @type {'earlier'|'later'} */ round) {
		const omerSpan = document.createElement("span");
		omerSpan.classList.add("omerText");
		omerSpan.innerHTML = getOrdinal(jCal.tomorrow().getDayOfOmer(), true) + " of omer";

		const div = document.createElement('div');
		div.classList.add('tableCell')

		/**
		 * @param {Temporal.ZonedDateTime} zDT
		 * @param {'earlier'|'later'} round
		 * @param {{dtF: typeof defaulTF; icon?: string, hideAMPM: boolean, appendText?: string}} config
		 */
		function renderZmanInDiv (zDT, round, config={dtF:defaulTF, icon: undefined, hideAMPM: true}) {
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

			let timeStr = handleRound(zDT, ('second' in config ? 'noRound' : round)).toLocaleString(...config.dtF)
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
					div.classList.add('tableCellHasIcon');
					renderZmanInDiv(
						jCal.tomorrow().tomorrow().getMoladAsDate().withTimeZone(geoLocation.getTimeZone()),
						'earlier', // unused
						{
							dtF: [defaulTF[0], {...defaulTF[1], timeZoneName: "short", second: '2-digit' }],
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
					renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later', {dtF: defaulTF, icon: icons.havdalah, hideAMPM: true});

					if (x.data.mergeTzet && jCal.tomorrow().getDayOfOmer() !== -1) {
						omerSpan.style.marginTop = '.1rem';
						div.appendChild(omerSpan);
					}

					if (shita == 'candleLightingRT') {
						renderZmanInDiv(zmanCalc.getTzetRT(), 'later', {dtF: defaulTF, icon: {
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
					renderZmanInDiv(zmanCalc.getTzet(), 'later', potForCandle ? {dtF: defaulTF, icon: icons.candle, hideAMPM: true} : undefined)
					if (potForCandle && allShitotNames.some(shita => ['candleLighting', 'candleLightingRT'].includes(shita))) {
						div.style.gridColumnEnd = "span 2";
					}

					if (jCal.tomorrow().getDayOfOmer() !== -1) {
						div.appendChild(omerSpan);
					}

					if (jCal.tomorrow().getDayOfChanukah() !== -1 && jCal.getDayOfWeek() !== 6 && !x.data.pocket) {
						div.classList.add('tableCellHasIcon');
						renderZmanInDiv(zmanCalc.getTzet().add({ minutes: 30 }), 'earlier', {dtF: defaulTF, icon: "🕎" + {
							'hb': " לפני",
							"en-et": " before",
							'en': " before"
						}[x.data.lang], hideAMPM: true})
						div.lastElementChild.classList.add("omerText");
					}

					if (x.data.mergeTzet && jCal.isTaanis() && !jCal.isYomKippur()) {
						renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', {dtF: defaulTF, icon: {
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

				renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', iconParams)
				if (jCal.isTaanis() && !jCal.isYomKippur()) {
					div.style.fontWeight = "bold";
				}

				if ((potForCandle || havdalahOnWine) && allShitotNames.some(shita => ['candleLighting', 'candleLightingRT'].includes(shita))) {
					div.style.gridColumnEnd = "span 2";
				}

				if (jCal.tomorrow().getDayOfOmer() !== -1 && !(jCal.hasCandleLighting() || !jCal.isAssurBemelacha())) {
					div.appendChild(omerSpan);
				}

				break;
			case 'getAlotHashahar':
			case 'getTallAlotHashacharWKorbanot':
				renderZmanInDiv(zmanCalc.getAlotHashahar(), 'earlier');
				if (jCal.isTaanis() && jCal.getJewishMonth() !== WebsiteLimudCalendar.AV && !jCal.isYomKippur())
					// @ts-ignore
					div.firstElementChild.style.fontWeight = "bold";

				if (shita == 'getTallAlotHashacharWKorbanot') {
					renderZmanInDiv(zmanCalc.customDawn(), 'earlier', {dtF: defaulTF, icon: `(${{
						'hb': "קרבנות",
						"en-et": "Korbanot",
						'en': "Korbanot"
					}[x.data.lang]}:`, appendText: ")", hideAMPM: true});
					div.lastElementChild.classList.add("omerText");
				}
				break;
			case 'getTallMisheyakir':
				renderZmanInDiv(zmanCalc.getMisheyakir(), 'later');
				renderZmanInDiv(zmanCalc.getMisheyakir(11/12), 'later', {dtF: defaulTF, icon: `(${{
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
				renderZmanInDiv(zmanCalc.getSofZemanShemaGRA(), 'earlier', {dtF: defaulTF, icon: "(GRA) ", hideAMPM: true});
				div.lastElementChild.classList.add("omerText");
				break;
			case 'min-minha':
				renderZmanInDiv(zmanCalc.getMinchaKetana(), 'later');
				renderZmanInDiv(zmanCalc.getMinhaGedolah(), 'later', {dtF: defaulTF, icon: "(Early) ", hideAMPM: true});
				div.lastElementChild.classList.add("omerText");
				break;
			case 'min-pelag':
				renderZmanInDiv(zmanCalc.getPlagHaminhaHalachaBrurah(), 'later');
				renderZmanInDiv(
					zmanCalc.timeRange.current.dawn.add(
						zmanCalc.fixedToSeasonal(
							Temporal.Duration.from({ hours: 10, minutes: 45 }),
							zmanCalc.timeRange.current.dawn.until(zmanCalc.timeRange.current.nightfall)
					)), 'later', {dtF: defaulTF, icon: "(YY) ", hideAMPM: true});
				div.lastElementChild.classList.add("omerText");
				break;
			case 'min-tzet':
				renderZmanInDiv(zmanCalc.getTzetHumra(), 'later');
				renderZmanInDiv(zmanCalc.getTzet(), 'later', {dtF: defaulTF, icon: '(13.5s) ', hideAMPM: true});
				div.lastElementChild.classList.add("omerText");
				break;
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
					yomTovElem.appendChild(document.createTextNode(yomTovObj[jCal.getYomTovIndex()][x.data.lang].replace("Intermediary", "חול המועד")))
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
							(x.data.lang == 'hb' ? "יום כיפור" : "Yom Kippur"),
						[WebsiteLimudCalendar.TISHA_BEAV]:
							(x.data.lang == 'hb' ? "תשעה באב" : "Tisha B'Av"),
						[WebsiteLimudCalendar.SEVENTEEN_OF_TAMMUZ]:
							(x.data.lang == 'hb' ? "שבעה עשר בתמוז" : "Seventeenth of Tammuz"),
						[WebsiteLimudCalendar.TENTH_OF_TEVES]:
							(x.data.lang == 'hb' ? "עשרה בטבת" : "Tenth of Tevet"),
					}[jCal.getYomTovIndex()] || (x.data.lang == 'hb' ? "צום" : "Fast")))

					div.appendChild(taanitElem);
					div.style.fontWeight = "bold";
				}

				break;

			case 'getPlagHaminhaTT':
				renderZmanInDiv(zmanCalc.timeRange.current.dawn.add(
					zmanCalc.fixedToSeasonal(Temporal.Duration.from({ hours: 10, minutes: 45 }), zmanCalc.timeRange.current.ranges.mga)
				), 'later');
				break;
			case 'testSunriseHBWorking':
				renderZmanInDiv(zmanCalc.testSunriseHBWorking(), 'earlier', {dtF: [defaulTF[0], {...defaulTF[1], second: '2-digit'}], hideAMPM: true});
				break;
			case 'netaneli-rt':
				renderZmanInDiv(zmanCalc.timeRange.current.tzethakokhavim, 'later')
				break;
			case 'netaneli-minhaGedola':
				renderZmanInDiv(zmanCalc.getMinhaGedolah(), 'later');
				renderZmanInDiv(
					zmanCalc.timeRange.current.sunrise.add(
						zmanCalc.fixedToSeasonal(
							Temporal.Duration.from({ hours: 6, minutes: 30 }),
							zmanCalc.timeRange.current.sunrise.until(zmanCalc.timeRange.current.nightfall)
					)), 'later'
				);
				div.lastElementChild.classList.add("omerText");
				break;
			case 'netaneli-candleLighting':
				if (jCal.hasCandleLighting()) {
					const candleConfig = {dtF: defaulTF, icon: icons.candle, hideAMPM: true}
					if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
						renderZmanInDiv(zmanCalc.getCandleLighting(), 'earlier', candleConfig);
					else if (jCal.getDayOfWeek() === 7)
						renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha({ degree: 8.1, minutes: 30})), 'later', candleConfig);
					else if (x.data.mergeTzet && zmanCalc)
						renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', candleConfig);
					else
						return false;
				}

				if (allShitotNames.includes('getTzetHumra') && jCal.isTaanis() && jCal.getJewishMonth() == WebsiteLimudCalendar.AV && jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY)
					return false;

				if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
					renderZmanInDiv(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later', {dtF: defaulTF, icon: icons.havdalah, hideAMPM: true});

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
		if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH) {
			const hametzDate = plainDate;
			/** @type {highlightedZman} */
			const highlightPesah = {ytI: WebsiteLimudCalendar.PESACH, datesToZman: new Map()};

			highlightPesah.datesToZman.set(hametzDate, {
				sofZemanAhilathHametz: handleRound(zmanCalc.chainDate(hametzDate).getSofZemanAhilathHametz(), 'earlier'),
				sofZemanBiurHametz: handleRound(zmanCalc.chainDate(hametzDate).getSofZemanBiurHametz(), 'earlier'),
				candleLighting: handleRound(zmanCalc.chainDate(hametzDate).getCandleLighting(), 'earlier')
			});

			if (hametzDate.dayOfWeek == 6) {
				highlightPesah.title = 'שבת הגדול ' + jCal.getHebrewParasha()[0] + ' - ערב פסח';
				highlightPesah.datesToZman.set(hametzDate.subtract({ days: 1 }), { candleLighting: handleRound(zmanCalc.chainDate(hametzDate.subtract({ days: 1 })).getCandleLighting(), 'earlier')  });

				const shabbatElem = highlightPesah.datesToZman.get(hametzDate);
				shabbatElem.candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(hametzDate).getTzetMelakha()), 'later');
				shabbatElem.rabbenuTam = handleRound(zmanCalc.chainDate(hametzDate).getTzetRT(), 'later');
			}
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
				if (pesahDate.dayOfWeek == 6) {
					const shabObj = highlightPesah.datesToZman.get(pesahDate);
					shabObj.candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(pesahDate).getTzetMelakha()), 'later');
					shabObj.rabbenuTam = handleRound(zmanCalc.chainDate(pesahDate).getTzetRT(), 'later');
				}
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

			highlightZmanim.push(highlightPesah);
		} else if ([WebsiteLimudCalendar.EREV_YOM_KIPPUR, WebsiteLimudCalendar.YOM_KIPPUR].includes(jCal.getYomTovIndex())) {
			const title = (x.data.lang == 'hb' ? "יום כיפור" : "Yom Kippur");

			if (!highlightZmanim.some(hz => hz.title === title)) {
				const ykJcal = jCal.chainDate(jCal.getDate().withCalendar("hebrew").with({ day: 10 }).withCalendar("iso8601"));

				highlightZmanim.push({
					ytI: WebsiteLimudCalendar.YOM_KIPPUR,
					title,
					datesToZman: new Map([[ykJcal.getDate().subtract({ days: 1 }), {
						candleLighting: handleRound(zmanCalc.chainDate(ykJcal.getDate().subtract({ days: 1 })).getCandleLighting(), 'earlier'),
					}], [plainDate.add({ days: 1 }), {
						musaf: handleRound(zmanCalc.chainDate(ykJcal.getDate()).getHatzoth(), 'earlier'),
						birkatKohanim: handleRound(zmanCalc.chainDate(ykJcal.getDate()).getTzet(), 'earlier'),

						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(ykJcal.getDate()).getTzetMelakha()), 'earlier'),
						rabbenuTam: handleRound(zmanCalc.chainDate(ykJcal.getDate()).getTzetRT(), 'later')
					}]])
				});
			}
		} else if (x.data.pocket) {
			if (jCal.isTaanis() && !jCal.isYomKippur()) {
				highlightZmanim.push({
					ytI: jCal.getYomTovIndex(),
					title: {
						[WebsiteLimudCalendar.FAST_OF_ESTHER]:
							(x.data.lang == 'hb' ? "תענית אסתר" : "Fast of Esther"),
						[WebsiteLimudCalendar.FAST_OF_GEDALYAH]:
							(x.data.lang == 'hb' ? "צום גדליה" : "Fast of Gedalia"),
						[WebsiteLimudCalendar.TISHA_BEAV]:
							(x.data.lang == 'hb' ? "תשעה באב" : "Tisha B'Av"),
						[WebsiteLimudCalendar.SEVENTEEN_OF_TAMMUZ]:
							(x.data.lang == 'hb' ? "שבעה עשר בתמוז" : "Seventeenth of Tammuz"),
						[WebsiteLimudCalendar.TENTH_OF_TEVES]:
							(x.data.lang == 'hb' ? "עשרה בטבת" : "Tenth of Tevet"),
					}[jCal.getYomTovIndex()],
					datesToZman: new Map(
						jCal.getJewishMonth() == WebsiteLimudCalendar.AV
							? [[plainDate.subtract({ days: 1 }), {
								fastStarts: handleRound(zmanCalc.chainDate(jCal.getDate().subtract({ days: 1 })).getShkiya(), 'earlier')
							}], [plainDate, {
								fastEnds: handleRound(zmanCalc.getTzetHumra(), 'later')
							}]]
							: [[plainDate, {
								fastStarts: handleRound(zmanCalc.getAlotHashahar(), 'earlier'),
								fastEnds: handleRound(zmanCalc.getTzetHumra(), 'later')
							}]]
					)
				});
			} else if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_SHAVUOS) {
				/** @type {highlightedZman} */
				const shavuotObj = {
					ytI: WebsiteLimudCalendar.SHAVUOS,
					title: (x.data.lang == 'hb' ? "שבועות" : "Shavuot"),
					datesToZman: new Map([[plainDate, {candleLighting: handleRound(zmanCalc.chainDate(plainDate).getCandleLighting(), 'earlier')}]])
				};

				if (jCal.getDayOfWeek() == 6) {
					shavuotObj.datesToZman.set(
						plainDate.subtract({ days: 1 }),
						{
							candleLighting: handleRound(zmanCalc.chainDate(plainDate.subtract({ days: 1 })).getCandleLighting(), 'earlier')
						}
					);
					shavuotObj.datesToZman.get(plainDate).candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(plainDate).getTzetMelakha()), 'later');
					shavuotObj.datesToZman.get(plainDate).rabbenuTam = handleRound(zmanCalc.chainDate(plainDate).getTzetRT(), 'later');
				}

				const shavuotDate = plainDate.add({ days: 1 });
				if (jCal.getInIsrael()) {
					shavuotObj.datesToZman.set(shavuotDate,
						shavuotDate.dayOfWeek == 5 ?
							{ candleLighting: handleRound(zmanCalc.chainDate(shavuotDate).getCandleLighting(), 'earlier') }	:
							{
								tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(shavuotDate).getTzetMelakha()), 'later'),
								rabbenuTam: handleRound(zmanCalc.chainDate(shavuotDate).getTzetRT(), 'later')
							}
					);

					if (shavuotDate.dayOfWeek == 5) {
						shavuotObj.datesToZman.set(shavuotDate.add({ days: 1 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(shavuotDate.add({ days: 1 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(shavuotDate.add({ days: 1 })).getTzetRT(), 'later')
						});
					}
				} else {
					shavuotObj.datesToZman.set(shavuotDate, {
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
					shavuotObj.datesToZman.set(secondDayShavuotDate,
						secondDayShavuotDate.dayOfWeek == 5
							? { candleLighting: handleRound(zmanCalc.chainDate(secondDayShavuotDate).getCandleLighting(), 'earlier') }
							: { tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(secondDayShavuotDate).getTzetMelakha()), 'later') });

					if (secondDayShavuotDate.dayOfWeek == 6)
						shavuotObj.datesToZman.get(secondDayShavuotDate).rabbenuTam = handleRound(zmanCalc.chainDate(secondDayShavuotDate).getTzetRT(), 'later');
					else if (secondDayShavuotDate.dayOfWeek == 5) {
						shavuotObj.datesToZman.set(shavuotDate.add({ days: 2 }), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(shavuotDate.add({ days: 2 })).getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.chainDate(shavuotDate.add({ days: 2 })).getTzetRT(), 'later')
						});
					}
				}

				highlightZmanim.push(shavuotObj);
			} else if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_ROSH_HASHANA) {
				const roshHashanaDate = plainDate.add({ days: 1 });

				/** @type {highlightedZman} */
				const roshHashanaObj = {
					ytI: WebsiteLimudCalendar.ROSH_HASHANA,
					title: (x.data.lang == 'hb' ? "ראש השנה" : "Rosh Ha'Shana"),
					datesToZman: new Map([
						[plainDate, {
							candleLighting: handleRound(zmanCalc.getCandleLighting(), 'earlier')
						}],
						[roshHashanaDate, {
							candleLighting: handleRound(zmanCalc.chainDate(roshHashanaDate).getTzetHumra(), 'later')
						}]
					])
				};

				if (plainDate.dayOfWeek == 3) {
					roshHashanaObj.title += " - שבת שובה" + jCal.getHebrewParasha()[0];
					roshHashanaObj.datesToZman.set(plainDate.add({ days: 2 }), {
						candleLighting: handleRound(zmanCalc.chainDate(plainDate.add({ days: 2 })).getCandleLighting(), 'earlier')
					})
					roshHashanaObj.datesToZman.set(plainDate.add({ days: 3 }), {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(plainDate.add({ days: 3 })).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(zmanCalc.chainDate(plainDate.add({ days: 3 })).getTzetRT(), 'later')
					})
				} else {
					if (plainDate.dayOfWeek == 5) {
						const shabbatObj = roshHashanaObj.datesToZman.get(roshHashanaDate);
						shabbatObj.candleLighting = handleRound(zDTFromFunc(zmanCalc.chainDate(roshHashanaDate).getTzetMelakha()), 'later');
						shabbatObj.rabbenuTam = handleRound(zmanCalc.chainDate(roshHashanaDate).getTzetRT(), 'later');
					}

					roshHashanaObj.datesToZman.set(plainDate.add({ days: 2 }), {
						tzetMelakha: handleRound(zDTFromFunc(zmanCalc.chainDate(plainDate.add({ days: 2 })).getTzetMelakha()), 'later')
						//rabbenuTam: zmanCalc.chainDate(plainDate.add({ days: 2 })).getTzetRT()
					});
				}

				highlightZmanim.push(roshHashanaObj);
			} else if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_SUCCOS) {
				const sukkothDate = plainDate.add({ days: 1 });

				/** @type {highlightedZman} */
				const sukkothObj = {
					ytI: WebsiteLimudCalendar.SUCCOS,
					datesToZman: new Map([[plainDate, {
						candleLighting: handleRound(zmanCalc.getCandleLighting(), 'earlier')
					}]])
				};

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
			} else if (jCal.getYomTovIndex() == WebsiteLimudCalendar.HOSHANA_RABBA) {
				const sheminiDate = plainDate.add({ days: 1 });

				/** @type {highlightedZman} */
				const sheminiObj = {
					ytI: WebsiteLimudCalendar.SHEMINI_ATZERES,
					datesToZman: new Map([[plainDate, {
						candleLighting: handleRound(zmanCalc.getCandleLighting(), 'earlier')
					}]])
				};

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
							+ (x.data.lang == 'hb' ? "שבת מברכים בראשית" : "Shabbat Bereshit");

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
			} else if (jCal.isErevYomTov() && jCal.isCholHamoedPesach()) {
				// Handle second day Yom Tov. We find Erev Yom Tov of Pesach by checking for the last day of Chol Hamoed Pesach
				/** @type {highlightedZman} */
				const pesahObj = {
					ytI: WebsiteLimudCalendar.PESACH,
					datesToZman: new Map([[plainDate, {
						candleLighting: handleRound(zmanCalc.getCandleLighting(), 'earlier')
					}]])
				};

				const yomTovDate = plainDate.add({ days: 1 });
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
			} else if
				((jCal.getDayOfWeek() === 7 && !jCal.isYomTovAssurBemelacha() && !jCal.isErevYomTov() && !jCal.chainDate(jCal.getDate().subtract({ days: 1 })).isYomTovAssurBemelacha())
				|| jCal.getDayOfWeek() === 6 && !jCal.isYomTovAssurBemelacha() && !jCal.tomorrow().isErevYomTov() && !jCal.tomorrow().isYomTovAssurBemelacha()) {
				const title = "שבת " + (jCal.isCholHamoed() ? "חול המועד" : jCal.getHebrewParasha()[0]);

				if (!highlightZmanim.some(high => high.title === title)) {
					const shabbatJCal = jCal.shabbat();
					highlightZmanim.push({
						title,
						extra: "🎵 Makam: " + makamIndex.getTodayMakam(shabbatJCal).makam
							.map(mak => (typeof mak == "number" ? makamObj.makamNameMapEng[mak] : mak))
							.join(" / "),
						datesToZman: new Map([[shabbatJCal.getDate().subtract({ days: 1 }), {
							candleLighting: handleRound(zmanCalc.chainDate(jCal.shabbat().getDate().subtract({days: 1})).getCandleLighting(), 'earlier')
						}], [shabbatJCal.getDate(), {
							tzetMelakha: handleRound(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later'),
							rabbenuTam: handleRound(zmanCalc.getTzetRT(), 'later')
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
						title: (x.data.lang == 'hb' ? "חנוכה" : "Ḥanuka"),
						datesToZman: new Map()
					}
					highlightZmanim.push(hanukahObj);
				}

				if (plainDate.dayOfWeek == 6)
					hanukahObj.datesToZman.set(plainDate, {
						candleLighting: handleRound(zDTFromFunc(zmanCalc.chainDate(plainDate).getTzetMelakha()), 'later'),
						rabbenuTam: handleRound(zmanCalc.chainDate(plainDate).getTzetRT(), 'later')
					})
				else if (plainDate.dayOfWeek == 5)
					hanukahObj.datesToZman.set(plainDate, {
						candleLighting: handleRound(zmanCalc.chainDate(plainDate).getCandleLighting(), 'earlier')
					});
				else
					hanukahObj.datesToZman.set(plainDate, {
						candleLighting: handleRound(zmanCalc.chainDate(plainDate).getTzet(), 'later')
					});
			}
		}
	}

	/** @type {HTMLElement} */
	// @ts-ignore
	const backupMonthTable = monthTable.cloneNode(true);

	plainDate = plainDate.withCalendar(x.data.calendar).with({ day: 1 })
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

	for (let index = 1; index <= halfDaysInMonth; index++) {
		plainDate = dayMinusOne.add({ days: index })
		jCal.setDate(plainDate.withCalendar("iso8601"))
		zmanCalc.setDate(plainDate.withCalendar("iso8601"))

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

	/** @type {[locales?: string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtFBLevana = [x.data.lang == 'hb' ? 'he' : 'en', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hourCycle: x.data.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}]
	function handleSingleBL() {
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
					"hb": "מועד אחרון: לפני החג (זריחה של היום הקודם)",
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

		const tekufaDate = formatDate(initTekuf, x.data.lang);
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
		].join('-')));

		if (nextTekufaJDate.getJewishMonth() == KosherZmanim.JewishDate.TISHREI && !x.data.israel) {
			tekufaTimingDiv.appendChild(document.createElement("br"));
			tekufaTimingDiv.innerHTML += {
				"en": "Switch to ברך עלינו " + (x.data.pocket ? "at the night prayer of " : "on "),
				"hb": "תחליף לברך עלינו " + (x.data.pocket ? "בתפילת ערבית של " : "ביום "),
				"en-et": "Switch to ברך עלינו " + (x.data.pocket ? "at Tefilat Arvit of " : "on ")
			}[x.data.lang] + formatDate(initTekuf.toPlainDate().add({ days: 59 }), x.data.lang, false)
		}

		tekufaContainer.appendChild(tekufaTitle);
		tekufaContainer.appendChild(tekufaTimingDiv);

		return tekufaContainer;
	}

	/** @type {HTMLDivElement} */
	// @ts-ignore
	let thisMonthFooter = document.getElementsByClassName("zyCalFooter")[0];
	if (thisMonthFooter) {
		const erevPesah = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.PESACH);
		const yomKippur = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.YOM_KIPPUR);
		if (erevPesah && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-hametz')) {
			const zmanimOfErev = erevPesah.datesToZman.entries().find(([date, data]) => 'sofZemanAhilathHametz' in data);
			const hamesName = formatDate(zmanimOfErev[0], x.data.lang);
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

			const yKName = formatDate(zmanimOfYK[0], x.data.lang);
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
					jCal.setDate(dateRange[0]);
					dateElem.innerHTML = jCal.formatFancyDate('short');
				} else {
					let dateText = "";
					jCal.setDate(dateRange[0]);
					dateText += jCal.formatFancyDate('short');
					dateText += " - ";
					jCal.setDate(dateRange[dateRange.length - 1]);
					dateText += jCal.formatFancyDate('short');
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
							rtElem.innerHTML = " (R\"T: " + zmanTime.toLocaleString(...defaulTF) + ")";
							rtElem.classList.add('rabbenuTamAppend');

							timesBox.lastElementChild.appendChild(rtElem);
							continue;
						}

						const zmanRow = document.createElement("div");
						zmanRow.classList.add('zmanRow');
						if (zmanName == 'candleLighting') {
							if (allCandleLightings.length > 1) {
								zmanRow.innerHTML += icons.candle + " (" + getOrdinal(candleLightIndex++, true) + " night): ";
							} else {
								zmanRow.innerHTML += icons.candle + " ";
							}
						} else if (zmanName == 'tzetMelakha') {
							zmanRow.innerHTML += icons.havdalah + " ";
						} else if (zmanName == 'sofZemanAhilathHametz') {
							zmanRow.innerHTML += "Finish eating by ";
						} else if (zmanName == 'sofZemanBiurHametz') {
							zmanRow.innerHTML += "Dispose by ";
						} else if (zmanName == "fastStarts") {
							zmanRow.innerHTML += "Fast starts: ";
						} else if (zmanName == "fastEnds") {
							zmanRow.innerHTML += "Fast ends: ";
						} else if (zmanName == "musaf") {
							zmanRow.innerHTML += "Start מוסף before ";
						} else if (zmanName == "birkatKohanim") {
							zmanRow.innerHTML += "Finish ברכת כהנים before ";
						} else {
							zmanRow.innerHTML += zmanName + ": ";
						}

						zmanRow.innerHTML += zmanTime.toLocaleString(...defaulTF);
						timesBox.appendChild(zmanRow);
					}
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

			const bLContain = handleSingleBL();
			if (bLContain)
				miscTimes.appendChild(bLContain);

			return ssFH;
		}

		const firstSideClone = handleSecondSide();

		highlightZmanim = [];
		initTekuf = zmanCalc.nextTekufa(zmanCalc.config.fixedMil);
		jewishMonthsInSecMonth.clear();
		for (let index = halfDaysInMonth + 1; index <= plainDate.daysInMonth; index++) {
			plainDate = dayMinusOne.add({ days: index })
			jCal.setDate(plainDate.withCalendar("iso8601"))
			zmanCalc.setDate(plainDate.withCalendar("iso8601"))

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

		return { month: x.data.month, htmlContent: [monthTable.outerHTML, firstSideClone.outerHTML, backupMonthTable.outerHTML, secondSideClone.outerHTML ] };
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
function rangeTimes(start, middle, end, inclusive=true) {
	const acceptedValues = [1];
	if (inclusive)
		acceptedValues.push(0);

	return acceptedValues.includes(Temporal.ZonedDateTime.compare(middle, start)) && acceptedValues.includes(Temporal.ZonedDateTime.compare(end, middle))
};

/**
 * @param {Temporal.ZonedDateTime|Temporal.PlainDate} date
 * @param {"hb"|"en"|"en-et"} locale
*/
function formatDate(date, locale, title=true) {
	const hebCal = date.withCalendar('hebrew');
	return {
		en: `${daysForLocale('en')[date.dayOfWeek]}, ${monthForLocale('en', title ? "short" : "long")[date.month]} ${getOrdinal(date.day, true)}`,
		"en-et": `${daysForLocale('en')[hebCal.dayOfWeek]}, ${monthForLocale('en-u-ca-hebrew', title ? "short" : "long")[hebCal.month]} ${getOrdinal(hebCal.day, true)}`,
		hb: `${n2wordsOrdinal[date.dayOfWeek]} - ${hNum.formatHebrewNumber(hebCal.day)} ${monthForLocale('he')[hebCal.month]}`
	}[locale]
}

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

export default messageHandler;