// @ts-check

import * as KosherZmanim from '../../libraries/kosherZmanim/kosher-zmanim.esm.js';
import { Temporal } from '../../libraries/kosherZmanim/kosher-zmanim.esm.js';
import WebsiteLimudCalendar from '../WebsiteLimudCalendar.js';
import { parseHTML } from '../../libraries/linkedom/linkedom.js'
import { HebrewNumberFormatter, daysForLocale, getOrdinal, monthForLocale } from '../WebsiteCalendar.js';
import { AmudehHoraahZmanim, OhrHachaimZmanim } from '../ROYZmanim.js';
import n2wordsOrdinal from '../misc/n2wordsOrdinal.js';

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
  }} singlePageParams */

// "date" of param will have to be in the iso8601 calendar
/**
  * @param {MessageEvent<singlePageParams>} x
 */
async function messageHandler (x) {
	const geoLocation = new KosherZmanim.GeoLocation(...x.data.geoCoordinates);
	const vNetz = x.data.netz.map((/** @type {number} */ value) => Temporal.Instant
		.fromEpochSeconds(value)
		.toZonedDateTimeISO(geoLocation.getTimeZone())
	);

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
	].map(inst => inst.toLocaleString(defaulTF[0], { hour12: true, hour: 'numeric'}).split(' ').at(-1))

	const havdalahIcon = await (await fetch('/assets/images/havdalah.svg')).text();
	const candleIcon = '<i class="fa fa-fire" aria-hidden="true"></i>';

	let plainDate = Temporal.PlainDate.from(x.data.date)
	const jCal = new WebsiteLimudCalendar();
	jCal.setDate(plainDate)
	jCal.setInIsrael(x.data.israel);

	const zmanCalc = (
		x.data.israel || x.data.hourCalculator == "seasonal"
			? new OhrHachaimZmanim(geoLocation, true)
			: new AmudehHoraahZmanim(geoLocation)
		);
	zmanCalc.configSettings(x.data.rtKulah, x.data.tzetMelakha)
	zmanCalc.coreZC.setCandleLightingOffset(x.data.candleTime)
	zmanCalc.setDate(jCal.getDate())

	const yomTovObj = {
		// Holidays
		[KosherZmanim.JewishCalendar.PESACH]: {
			hb: "פסח",
			"en-et": "Pesach",
			en: "Passover",
		},
		[KosherZmanim.JewishCalendar.CHOL_HAMOED_PESACH]: {
			en: "Intermediary",
			"en-et": "Ḥol HaMoedh",
			hb: "חול המועד"
		},
		[KosherZmanim.JewishCalendar.SHAVUOS]: {
			en: "Shavuoth",
			hb: "שבועות",
			"en-et": "Shavuoth"
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
			en: "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simchath Torah" : ""),
			"en-et": "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simchath Torah" : "")
		},
		[KosherZmanim.JewishCalendar.SIMCHAS_TORAH]: {
			hb: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
			en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah",
			"en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah"
		},
	
		// Semi-Holidays & Fasts
		[KosherZmanim.JewishCalendar.PESACH_SHENI]: {
			hb: "פסח שני",
			en: "Pesach Sheni",
			"en-et": "Pesach Sheni"
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
				dayElem.style.filter = 'grayscale(1)';
	
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
					timeStr = timeStr.replace(amPMStr, '');
			}

			if (config.appendText)
				timeStr += " " + config.appendText;

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

					if (rangeTimes(bLzmanCalc.getAlotHashachar(), time, bLzmanCalc.getTzait()))
						time = bLzmanCalc.getTzait();

					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌘", hideAMPM: false, appendText: "(עיקר הדין)" })
				}

				if (jCal.getDate().dayOfYear == jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashachar(), time, bLzmanCalc.getTzait()))
						time = bLzmanCalc.getTzait();

					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌗", hideAMPM: false, appendText: "(לחתחילה)" })
				}

				let sameTime = false;
				if (jCal.getDate().dayOfYear == jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()).dayOfYear) {
					let time = jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone());
					const bLzmanCalc = zmanCalc.chainDate(time.toPlainDate());

					if (rangeTimes(bLzmanCalc.getAlotHashachar(), time, bLzmanCalc.getTzait()))
						time = bLzmanCalc.getAlotHashachar();

					if (time.withCalendar("hebrew").day == 15 && time.equals(bLzmanCalc.getAlotHashachar()))
						sameTime = true;

					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌕", hideAMPM: false, appendText: (sameTime ? undefined : "(לחתחילה)") })
				}

				if (jCal.getJewishDayOfMonth() == 15 && !sameTime) {
					let time = zmanCalc.getAlotHashachar();
					renderZmanInDiv(time, { dtF: defaulTF, icon: "🌕", hideAMPM: false, appendText: "(זמן מרן)" })
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
	
				if (jCal.tomorrow().getDayOfChanukah() !== -1) {
					const hanTitleElem = flexWorkAround.cloneNode(true);
					hanTitleElem.appendChild(document.createTextNode({
						"hb": (jCal.getDayOfChanukah() == -1 ? "ערב " : "") + "חנוכה",
						"en": "Ḥanukah" + (jCal.getDayOfChanukah() == -1 ? " Eve" : ""),
						"en-et": (jCal.getDayOfChanukah() == -1 ? "Erev " : "") + "Ḥanukah"
					}[x.data.lang]));
					div.appendChild(hanTitleElem);
	
					const hanNightElem = flexWorkAround.cloneNode(true);
					// @ts-ignore
					hanNightElem.classList.add("omerText");
					// @ts-ignore
					hanNightElem.innerHTML = "(" + {
						"hb": "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()],
						"en": getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night",
						"en-et": getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night"
					}[x.data.lang] + ")";
					div.appendChild(hanNightElem);
	
					div.style.fontWeight = "bold";
				} else if (jCal.getDayOfChanukah() == 8) {
					const hanTitleElem = flexWorkAround.cloneNode(true);
					hanTitleElem.appendChild(document.createTextNode({
						"hb": "זאת חנוכה",
						"en": "Ḥanukah Day",
						"en-et": "Yom Ḥanukah"
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
	
					switch (jCal.getYomTovIndex()) {
						case WebsiteLimudCalendar.FAST_OF_ESTHER:
							taanitElem.appendChild(document.createTextNode({
								'hb': "תענית אסתר",
								"en-et": "Fast of Ester",
								'en': "Fast of Ester"
							}[x.data.lang]));
							break;
						case WebsiteLimudCalendar.FAST_OF_GEDALYAH:
							taanitElem.appendChild(document.createTextNode({
								'hb': "צום גדליה",
								"en-et": "Fast of Gedalia",
								'en': "Fast of Gedalia"
							}[x.data.lang]));
							break;
						case WebsiteLimudCalendar.YOM_KIPPUR:
							taanitElem.appendChild(document.createTextNode({
								"hb": "יום כיפור",
								"en": "Yom Kippur",
								"en-et": "Yom Kippur"
							}[x.data.lang]));
							break;
						default:
							taanitElem.appendChild(document.createTextNode({
								'hb': "צום",
								"en-et": "Fast",
								'en': "Fast"
							}[x.data.lang]));
					}
	
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
					if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
						renderZmanInDiv(zmanCalc.getCandleLighting(), {dtF: defaulTF, icon: candleIcon, hideAMPM: true});
					else if (jCal.getDayOfWeek() === 7)
						renderZmanInDiv(zmanCalc.getTzaitShabbath(), {dtF: defaulTF, icon: candleIcon, hideAMPM: true});
					else
						return false;
				}
	
				if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
					renderZmanInDiv(zmanCalc.getTzaitShabbath(), {dtF: defaulTF, icon: havdalahIcon, hideAMPM: true});
	
					if (jCal.tomorrow().getDayOfOmer() !== -1) {
						div.appendChild(omerSpan);
					}

					if (shita == 'candleLightingRT') {
						let rtElem = flexWorkAround.cloneNode(true);
						// @ts-ignore
						rtElem.classList.add("omerText");
						// @ts-ignore
						rtElem.style.marginTop = '.1rem';
						rtElem.appendChild(document.createTextNode(
							{
								'hb': 'ר"ת: ',
								"en-et": 'R"T: ',
								'en': 'R"T: '
							}[x.data.lang] + zmanCalc.getTzaitRT().toLocaleString(...defaulTF)
						));

						div.appendChild(rtElem)
					}
				}
	
				break;
			case 'getTzait':
				if (!jCal.isAssurBemelacha()) {
					renderZmanInDiv(zmanCalc.getTzait())
	
					if (jCal.tomorrow().getDayOfOmer() !== -1) {
						div.appendChild(omerSpan);
					}
	
					if (jCal.tomorrow().getDayOfChanukah() !== -1 && jCal.getDayOfWeek() !== 6) {
						const hanukahSpan = flexWorkAround.cloneNode(true);
						// @ts-ignore
						hanukahSpan.classList.add("omerText");
						hanukahSpan.appendChild(document.createTextNode(
							{
								'hb': "תדליק לפני ",
								"en-et": "Light before ",
								'en': "Light before "
							}[x.data.lang] + zmanCalc.getTzait().add({ minutes: 30 }).toLocaleString(...defaulTF)
						));
	
						div.appendChild(hanukahSpan);
					}
				}
				break;
			case 'getTzaitLechumra':
				let appear = false;
				const potForCandle = jCal.hasCandleLighting() && jCal.getDayOfWeek() !== 6 && jCal.isAssurBemelacha() && jCal.getDayOfWeek() !== 7;
				if (zmanCalc instanceof OhrHachaimZmanim) {
					if (jCal.isTaanis() && !jCal.isYomKippur()) {
						appear = true;
						renderZmanInDiv(zmanCalc.getTzait().add({ minutes: 20 }), potForCandle ? {dtF: defaulTF, icon: candleIcon, hideAMPM: true} : undefined)
						div.style.fontWeight = "bold";
					}
				} else {
					appear = true;
					renderZmanInDiv(zmanCalc.getTzaitLechumra(), potForCandle ? {dtF: defaulTF, icon: candleIcon, hideAMPM: true} : undefined)
	
					if (jCal.isTaanis() && !jCal.isYomKippur()) {
						div.style.fontWeight = "bold";
					}
				}
	
				if (appear && potForCandle) {
					div.style.gridColumnEnd = "span 2";
					if (jCal.tomorrow().getDayOfOmer() !== -1) {
						div.appendChild(omerSpan);
					}
				}
	
				break;
			case 'getAlotHashachar':
				renderZmanInDiv(zmanCalc.getAlotHashachar());
				if (jCal.isTaanis() && jCal.getJewishMonth() !== WebsiteLimudCalendar.AV && !jCal.isYomKippur())
					div.style.fontWeight = "bold";
				break;
			case 'getNetz':
				let seeSun;
				if (vNetz)
					seeSun = vNetz.find(zDT => Math.abs(zmanCalc.getNetz().until(zDT).total('minutes')) <= 6)
	
				if (seeSun)
					renderZmanInDiv(seeSun, {dtF: [defaulTF[0], {...defaulTF[1], second: '2-digit'}], hideAMPM: true})
				else
					renderZmanInDiv(zmanCalc.getNetz())
	
				break;
			case 'getSofZmanShmaGRA':
				renderZmanInDiv(zmanCalc.getSofZmanShmaGRA())
	
				if (jCal.isBirkasHachamah()) {
					div.style.fontWeight = "bold";
					const hanukahSpan = flexWorkAround.cloneNode(true);
					// @ts-ignore
					hanukahSpan.classList.add("omerText");
					hanukahSpan.appendChild(document.createTextNode({
						'hb': "(סוף זמן ברכת החמה)",
						"en-et": "(Sof Zman Birkath Haḥama)",
						'en': "(Birkath Haḥama end time)"
					}[x.data.lang]));
	
					div.appendChild(hanukahSpan);
				}
				break;
			case 'getHatzoth':
				renderZmanInDiv(zmanCalc.getHatzoth());
				if (jCal.isYomKippur()) {
					const musafSpan = flexWorkAround.cloneNode(true);
					// @ts-ignore
					musafSpan.classList.add("omerText");
					musafSpan.appendChild(document.createTextNode(
						{
							'hb': "(תסיים מוסף לפני ",
							"en-et": "(Finish Musaf before ",
							'en': "(Finish Musaf before "
						}[x.data.lang]
						+ zmanCalc.getNetz().add(zmanCalc.fixedToSeasonal(Temporal.Duration.from({ hours: 7 }))).toLocaleString(...defaulTF)
						+ ")"
					));
	
					div.appendChild(musafSpan);
				}
				break;
			default:
				// @ts-ignore
				renderZmanInDiv(zmanCalc[shita]())
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
			dateSel.appendChild(document.createTextNode(` (${
				x.data.lang == 'hb'
					? hNum.formatHebrewNumber(jCal.getJewishYear())
					: plainDate.withCalendar(x.data.calendar).year
			})`));
		}
	}

	plainDate = plainDate.withCalendar(x.data.calendar).with({ day: 1 })
	const initTekuf = zmanCalc.nextTekufa(zmanCalc instanceof OhrHachaimZmanim);
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

		if (!x.data.shabbatOnly || jCal.getJewishDayOfMonth() <= 18) {
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
	if (!initTekuf.equals(zmanCalc.nextTekufa(zmanCalc instanceof OhrHachaimZmanim).withTimeZone(geoLocation.getTimeZone()))
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

			let tekufaDate;
			switch (x.data.lang) {
				default:
					tekufaDate = `${daysForLocale('en')[initTekuf.dayOfWeek]}, ${monthForLocale('en')[initTekuf.month]} ${getOrdinal(initTekuf.day, true)}`;
			}
			const tekufaTimingDiv = document.createElement("p");
			tekufaTimingDiv.innerHTML = tekufaDate;
			tekufaTimingDiv.appendChild(document.createElement("br"));
			tekufaTimingDiv.appendChild(document.createTextNode({
				"hb": "אל תשתה מים בין ",
				"en": "Do not drink water between ",
				"en-et": "Do not drink water between "
			}[x.data.lang] + [
				initTekuf.round("minute").subtract({ minutes: 30 }).toLocaleString(...defaulTF),
				initTekuf.round("minute").add({ minutes: 30 }).toLocaleString(...defaulTF),
			].join('-')));

			tekufaContainer.appendChild(tekufaTitle);
			tekufaContainer.appendChild(tekufaTimingDiv);
			thisMonthFooter.lastElementChild.appendChild(tekufaContainer);
		}
	}

	if (hamesDate && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-hametz')) {
		const hamesName = `${daysForLocale('en')[hamesDate.dayOfWeek]}, ${monthForLocale('en')[hamesDate.month]} ${getOrdinal(hamesDate.day, true)}`;
		const hametzContainer = document.createElement("div");
		const hametzTitle = document.createElement("h5");
		hametzTitle.innerHTML = {
			hb: "ערב פסח",
			en: "Pesaḥ Eve for Ḥametz - " + hamesName,
			"en-et": "Erev Pesaḥ for Ḥametz - " + hamesName
		}[x.data.lang];

		const hametzTiming = document.createElement("p");
		hametzTiming.appendChild(document.createTextNode({
			"hb": "סןף זמן אחילת חמץ: ",
			"en": "Stop eating by ",
			"en-et": "Stop eating by "
		}[x.data.lang] + zmanCalc.chainDate(hamesDate).getSofZmanAchilathHametz().toLocaleString(...defaulTF)));
		hametzTiming.appendChild(document.createElement("br"));
		hametzTiming.appendChild(document.createTextNode({
			"hb": "זמן ביעור חמץ עד ",
			"en": "Dispose by ",
			"en-et": "Dispose by "
		}[x.data.lang] + zmanCalc.chainDate(hamesDate).getSofZmanBiurHametz().toLocaleString(...defaulTF)));

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
				hb: "ברכת הלבנה - חדש " + jCalBMoon.formatJewishMonth().he,
				en: "Moon-Blessing - Month of " + jCalBMoon.formatJewishMonth().en,
				"en-et": "Birkat Halevana - Month of " + jCalBMoon.formatJewishMonth().en
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