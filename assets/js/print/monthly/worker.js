// @ts-check

import * as KosherZmanim from '../../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteLimudCalendar from '../../core/WebsiteLimudCalendar.js';
import { parseHTML } from '../../../libraries/linkedom/linkedom.mjs'
import { HebrewNumberFormatter, daysForLocale, getOrdinal, monthForLocale } from '../../core/WebsiteCalendar.js';
import { ZemanFunctions, methodNames, zDTFromFunc } from '../../core/ROYZmanim.js';
import { providerFromSnapshot } from '../../core/refraction-snapshot.js';
import { zemanimConfigFrom } from '../../core/zmanimSettings.js';
import n2wordsOrdinal, { n2hebDateOrdinal } from '../../misc/n2wordsOrdinal.js';
import makamObj from '../../core/makamObj.js';
import { fmt, hallelNotice, shabbatExtra } from '../shared.js';
import { handleRound, holidayNames, fastNames, holidayKind, holidayCards, pesachFirstDays, yomKippur, fast, fastDay,
	isShabbatCardDay, shabbat, hanukkahNight, addCards } from '../../core/day-cards.js';
import { loadWorkerPolyfills } from '../../misc/worker-polyfills.js';

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
	zemanim: import('../../core/zmanimSettings.js').ZemanimOptions;
	geoCoordinates: [string, number, number, number, string];
	htmlElems: string;
	calendar: 'iso8601'|'hebrew';
	date: string;
	tekufaMidpoint: 'hatzoth'|'arbitrary';
	timeFormat: 'h11'|'h12'|'h23'|'h24';
	lang: "he"|"he-Latn"|"en";
	allShitot: [string, 'earlier'|'later'][];
	month: number;
	shabbatOnly: boolean;
	oneYear: boolean;
	mergeTzet: boolean;
	pocket: boolean;
  }} singlePageParams */

/**
 * Sent once per worker, after the RefractionInit and before any month (see print/monthly/export.js): everything in
 * singlePageParams that is the same for every month. The months then only carry `month` and `date`.
 * @typedef {Omit<singlePageParams, 'month'|'date'> & { type: 'init' }} WorkerInit */

/** @type {Omit<singlePageParams, 'month'|'date'> | null} */
let workerInit = null;

/** The template, parsed once; every month resets it from pristine clones instead of re-parsing. */
let template = { html: '', /** @type {any} */ doc: null, /** @type {any[]} */ pristine: [] };

/** @param {string} html @returns {any} the parsed template, as it was before any month changed it */
function templateDocument(html) {
	if (template.html !== html) {
		const doc = parseHTML(html).document;
		template = { html, doc, pristine: [...doc.childNodes].map(node => node.cloneNode(true)) };
		return doc;
	}

	const doc = template.doc;
	while (doc.firstChild)
		doc.removeChild(doc.firstChild);
	for (const node of template.pristine)
		doc.appendChild(node.cloneNode(true));
	return doc;
}

/** Built lazily on the first month (after Temporal is guaranteed). @type {any} */
let makamIndex = null;

// "date" of param will have to be in the iso8601 calendar
/**
 * Set by the RefractionInit message the page sends before any month (see print/refraction.js).
 * @type {{ provider: import('../../core/refraction-snapshot.js').AtmosphereProvider | null, horizon: import('../../core/refraction-snapshot.js').Horizon | null, haze: import('../../astro/star-nightfall.js').HazeData | null }}
 */
const refraction = { provider: null, horizon: null, haze: null };

/**
  * @param {{ data: singlePageParams }} x
 */
function messageHandler(x) {
	const geoLocation = new KosherZmanim.GeoLocation(...x.data.geoCoordinates);

	const document = templateDocument(x.data.htmlElems);
	const flexWorkAround = document.createElement("span");
	flexWorkAround.classList.add("flexElemWorkaround")

	/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
	const defaulTF = [x.data.lang == 'he' ? 'he' : 'en', {
		hourCycle: x.data.timeFormat,
		hour: 'numeric',
		minute: '2-digit'
	}];
	/** @type {[locales?: string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtFBLevana = [x.data.lang == 'he' ? 'he' : 'en', {
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

	const zmanCalc = new ZemanFunctions(geoLocation, zemanimConfigFrom(x.data.zemanim,
		{ atmosphereProvider: refraction.provider, horizon: refraction.horizon, haze: refraction.haze }));
	zmanCalc.setDate(jCal.getDate())

	/** Visible minus sea-level sunrise (ms) per ISO date, for the summary table on the main page. @type {Record<string, number>} */
	const sunriseOffsets = {};

	// @ts-ignore
	makamIndex ??= new KosherZmanim.Makam(makamObj.sefarimList);

	const yomTovObj = holidayNames(x.data.israel);
	/** @type {Record<number, string>} */
	const taanitYomTovNames = Object.fromEntries(Object.entries(fastNames).map(([index, names]) => [index, names[x.data.lang]]));

	/** What the Shabbat / Yom Tov / fast cards (day-cards.js) are built from */
	/** @type {import('../../core/day-cards.js').CardContext} */
	const cardCtx = { jCal, zc: (date) => zmanCalc.chainDate(date), lang: x.data.lang };

	const allShitotNames = x.data.allShitot.map(shita => shita[0]);

	function handleShita(/** @type {string} */ shita, /** @type {'earlier'|'later'} */ round) {
		const omerSpan = document.createElement("span");
		omerSpan.classList.add("omerText");
		if (jCal.tomorrow().getDayOfOmer() > 0) {
			omerSpan.innerHTML = (x.data.lang == 'he'
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

			let timeStr = fmt(handleRound(zDT, ('second' in config.dtF[1] ? 'noRound' : round)), config.dtF)
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
						'he': "שבת מברכים " + jCal.getDate().withCalendar('hebrew').add({ months: 1 }).toLocaleString('he-u-ca-hebrew', { month: 'long' }),
						"he-Latn": "Shabbath Mevorachim " + jCal.getDate().withCalendar('hebrew').add({ months: 1 }).toLocaleString('en-u-ca-hebrew', { month: 'long' }),
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
					if (x.data.lang !== 'he')
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
						'he': "ראש חדש",
						"he-Latn": "Rosh Ḥodesh",
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
					pur3TitleElem.appendChild(document.createTextNode(x.data.lang == "he" ? "פורים משולש" : "Purim Meshulash"));
					div.appendChild(pur3TitleElem);
				}

				if (jCal.tomorrow().getDayOfChanukah() !== -1) {
					const hanTitleElem = flexWorkAround.cloneNode(true);
					hanTitleElem.appendChild(document.createTextNode({
						"he": (jCal.getDayOfChanukah() == -1 ? "ערב " : "") + "חנוכה",
						"en": "Ḥanuka" + (jCal.getDayOfChanukah() == -1 ? " Eve" : ""),
						"he-Latn": (jCal.getDayOfChanukah() == -1 ? "Erev " : "") + "Ḥanuka"
					}[x.data.lang]));
					div.appendChild(hanTitleElem);

					if (!x.data.pocket) {
						const hanNightElem = flexWorkAround.cloneNode(true);
						// @ts-ignore
						hanNightElem.classList.add("omerText");
						// @ts-ignore
						hanNightElem.innerHTML = "(" +
							(x.data.lang == "he" ? "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()]
								: getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night") + ")";
						div.appendChild(hanNightElem);
					}

					div.style.fontWeight = "bold";
				} else if (jCal.getDayOfChanukah() == 8) {
					const hanTitleElem = flexWorkAround.cloneNode(true);
					hanTitleElem.appendChild(document.createTextNode({
						"he": "זאת חנוכה",
						"en": "Ḥanuka Day",
						"he-Latn": "Yom Ḥanuka"
					}[x.data.lang]));
					div.appendChild(hanTitleElem);
				}

				if (jCal.isBirkasHachamah()) {
					const rHelem = flexWorkAround.cloneNode(true);
					rHelem.appendChild(document.createTextNode({
						'he': "ברכת החמה",
						"he-Latn": "Birkath Haḥama",
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
							: (x.data.lang == 'he' ? "צום" : "Fast")))

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
							x.data.shabbatOnly ? jCal.formatFancyDate({ dayLength: "short", monthLength: "short", ordinal: false}).en : (
								jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
								jCal.getDate().toLocaleString('en', { day: 'numeric' }))
							;
						secondaryDate.appendChild(document.createTextNode(
							hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " +
							jCal.getDate().toLocaleString('he-u-ca-hebrew', { month: 'long' })
						));
						break;
					case 'he-Latn':
						primaryDate.appendChild(document.createTextNode(
							jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
							jCal.getDate().toLocaleString('en-u-ca-hebrew', { month: 'long', day: "numeric" })
						));
						secondaryDate.appendChild(document.createTextNode(jCal.getDate().toLocaleString('en', { month: "short", day: "numeric" })));
						break;
					case 'he':
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
								'he': 'ר"ת:',
								"he-Latn": 'R"T:',
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
								'he': " לפני",
								"he-Latn": " before",
								'en': " before"
							}[x.data.lang], hideAMPM: true
						})
						div.lastElementChild.classList.add("omerText");
					}

					if (x.data.mergeTzet && jCal.isTaanis() && !jCal.isYomKippur()) {
						renderZmanInDiv(zmanCalc.getTzetHumra(), 'later', {
							dtF: defaulTF, icon: {
								'he': "צאת הצום",
								"he-Latn": "Fast Ends",
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
							'he': "קרבנות",
							"he-Latn": "Korbanot",
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
						'he': "מקדם",
						"he-Latn": "Early",
						'en': "Early"
					}[x.data.lang]}:`, appendText: ")", hideAMPM: true
				});
				div.lastElementChild.classList.add("omerText");
				break;
			case 'getNetz':
				const rZIDoptions = { dtF: defaulTF, hideAMPM: true };

				let sunriseTime = zmanCalc.getNetz();
				if (!(sunriseTime instanceof Temporal.ZonedDateTime)) {
					sunriseOffsets[zmanCalc.coreZC.getDate().withCalendar("iso8601").toString({ calendarName: "never" })] =
						sunriseTime.time.epochMilliseconds - zmanCalc.coreZC.getSeaLevelSunrise().epochMilliseconds;
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
						'he': "(סוף זמן ברכת החמה)",
						"he-Latn": "(Sof Zeman Birkath Haḥama)",
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
					zmanCalc.coreZC.getSunsetOffsetByDegrees(106.04) ?? zmanCalc.getSolarMidnight(), 'later',
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
					if (!methodNames.includes(shita))
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
					x.data.lang == "he" ? 'he-u-ca-hebrew' : x.data.lang == "he-Latn" ? 'en-u-ca-hebrew' : 'en',
					{ month: "long" }
				)
		));
		if (!x.data.oneYear) {
			dateSel.appendChild(document.createTextNode(
				x.data.lang == 'he'
				? ` (${hNum.formatHebrewNumber(jCal.getJewishYear())})`
				: " '" + plainDate.withCalendar(x.data.calendar).year.toString().slice(-2)
			));
		}
	}

	/** @typedef {import('../../core/day-cards.js').DayCard} highlightedZman */
	/** @type {highlightedZman[]} */
	let highlightZmanim = [];

	/**
	 * The cards for the day jCal is on (day-cards.js). Every print has Erev Pesaḥ and Yom Kippur; the pocket
	 * one also the other holidays, fasts, Shabbatot and Ḥanukka (one card a day, in its few slots).
	 */
	function populateHighlightZmanim() {
		const kind = holidayKind(jCal);
		if (kind == 'pesachFirst' && (x.data.pocket || jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH)) {
			const card = pesachFirstDays(cardCtx);
			card.extra = hallelNotice(card, x.data.lang, defaulTF);
			addCards(highlightZmanim, card);
		} else if (kind == 'yomKippur') {
			addCards(highlightZmanim, yomKippur(cardCtx));
		} else if (x.data.pocket) {
			const fastJCal = fastDay(jCal);
			if (fastJCal)
				addCards(highlightZmanim, fast(cardCtx, fastJCal));
			else if (kind)
				addCards(highlightZmanim, holidayCards[kind](cardCtx));
			else if (isShabbatCardDay(jCal)) {
				const card = shabbat(cardCtx);
				card.extra = shabbatExtra(card, x.data.lang, jCal.shabbat(), makamIndex, makamObj, n2hebDateOrdinal);
				addCards(highlightZmanim, card);
			}

			// Ḥanukka: the nights in this half of the month (its own row, not a card)
			if (jCal.tomorrow().isChanukah()) {
				let hanukahObj = highlightZmanim.find(high => high.ytI == WebsiteLimudCalendar.CHANUKAH);
				if (!hanukahObj)
					highlightZmanim.push(hanukahObj = {
						id: "hanukkah",
						ytI: WebsiteLimudCalendar.CHANUKAH,
						title: x.data.lang == 'he' ? "חנוכה" : "Ḥanukka",
						datesToZman: new Map()
					});

				hanukahObj.datesToZman.set(plainDateForceCal, hanukkahNight(cardCtx, plainDateForceCal));
			}
		}
	}

	/** @type {HTMLElement} */
	// @ts-ignore
	const backupMonthTable = monthTable.cloneNode(true);

	plainDate = plainDate.withCalendar(x.data.calendar).with({ day: 1 });
	plainDateForceCal = plainDate.withCalendar('iso8601');
	let initTekuf = zmanCalc.nextTekufa(x.data.tekufaMidpoint !== "hatzoth");
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
		const jCalBMoon = jCal.chainJewishDate(parseInt(jMonthForBLevana.split('-')[1]), parseInt(jMonthForBLevana.split('-')[0]), 14);

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
				he: "הלכות תפילה לחודש " + jCalBMoon.formatJewishMonth().he,
				en: "Month of " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer",
				"he-Latn": "Ḥodesh " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];

			if (Temporal.ZonedDateTime.compare(blTimes.end, zDTFromFunc(zmanCalc.chainDate(jCalBMoon.getDate()).getNetz())) == -1) {
				bLTimesDispl.appendChild(document.createTextNode({
					"he": "טווח זמן לברכת הלבנה (מומלץ): ",
					"en": "Range for (recommended) ברכת הלבנה: ",
					"he-Latn": "Range for (recommended) Birkath Ha'Levana: ",
				}[x.data.lang] + fmt(blTimes.start, dtFBLevana) + " - " + fmt(blTimes.end, dtFBLevana)));
			} else {
				bLTimesDispl.appendChild(document.createTextNode({
					"en": "Recommended start time for Birkath Ha'Levana: ",
					"he": "זמן מומלץ לתחילת ברכת הלבנה: ",
					"he-Latn": "Recommended start time for ברכת הלבנה: ",
				}[x.data.lang] + fmt(blTimes.start, dtFBLevana)));
				bLTimesDispl.appendChild(document.createElement("br"));
				bLTimesDispl.appendChild(document.createTextNode({
					"he": "מועד אחרון: זמן הנץ של ערב חג",
					"en": "Deadline: before the holiday (sunrise of the previous day)",
					"he-Latn": "Deadline: before the holiday (sunrise of the previous day)"
				}[x.data.lang]));

				bLContain.appendChild(document.createElement("hr"));

				const blTefilaRule = document.createElement("p");
				blTefilaRule.classList.add('mb-0');
				blTefilaRule.innerHTML = {
					"en": "No Taḥanun said throughout the month",
					"he": "אין אומרים תחנון כל חודש ניסן",
					"he-Latn": "No Taḥanun said throughout the month"
				}[x.data.lang];
				bLContain.appendChild(blTefilaRule);
			}
		} else if (x.data.pocket && jCalBMoon.getJewishMonth() == KosherZmanim.JewishCalendar.AV) {
			bLTitl.innerHTML = {
				he: "הלכות תפילה לחודש " + jCalBMoon.formatJewishMonth().he,
				en: "Month of " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer",
				"he-Latn": "Ḥodesh " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];

			bLTimesDispl.appendChild(document.createTextNode({
				"he": "טווח זמן לברכת הלבנה: ",
				"en": "Range for ברכת הלבנה: ",
				"he-Latn": "Range for Birkath Ha'Levana: ",
			}[x.data.lang] + fmt(blTimes.start, dtFBLevana) + " - " + fmt(blTimes.end, dtFBLevana)));
			bLTimesDispl.appendChild(document.createElement("br"));
			bLTimesDispl.appendChild(document.createTextNode({
				"he": "(מומלץ להמתין לאחר הצום)",
				"en": "(Recommended to wait until after the fast)",
				"he-Latn": "(Recommended to wait until after the fast)",
			}[x.data.lang]));

			bLContain.appendChild(document.createElement("hr"));

			const tishaBeavJCal = jCal.chainYomTovIndex(WebsiteLimudCalendar.TISHA_BEAV);
			const tuBeavJCal = jCal.chainYomTovIndex(WebsiteLimudCalendar.TU_BEAV);

			const blTefilaRule = document.createElement("p");
			blTefilaRule.classList.add('mb-0');
			blTefilaRule.innerHTML = {
				"en": "No Taḥanun said on " + tishaBeavJCal.formatFancyDate().en + " (9<sup>th</sup> of Av) and " + tuBeavJCal.formatFancyDate().en + " (15<sup>th</sup> of Av)",
				"he": "אין אומרים תחנון בתשעה באב ובט״ו באב",
				"he-Latn": "No Taḥanun said on " + tishaBeavJCal.formatFancyDate().en + " (Tish'a B'Av) and " + tuBeavJCal.formatFancyDate().en + " (Tu B'Av)",
			}[x.data.lang];
			bLContain.appendChild(blTefilaRule);
		} else if (x.data.pocket
			&& (tachanunAffectedMonths.includes(jCalBMoon.getJewishMonth())
				|| jCalBMoon.getJewishMonth() == KosherZmanim.JewishCalendar.TEVES && hanukaForTevet)) {
			bLTitl.innerHTML = {
				he: "הלכות תפילה לחודש " + jCalBMoon.formatJewishMonth().he,
				en: "Month of " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer",
				"he-Latn": "Ḥodesh " + jCalBMoon.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];

			bLTimesDispl.appendChild(document.createTextNode({
				"he": "טווח זמן לברכת הלבנה: ",
				"en": "Range for ברכת הלבנה: ",
				"he-Latn": "Range for Birkath Ha'Levana: ",
			}[x.data.lang] + fmt(blTimes.start, dtFBLevana) + " - " + fmt(blTimes.end, dtFBLevana)));
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
					"he": "אין אומרים תחנון בחנוכה",
					"en": "No Taḥanun said throughout Ḥanuka",
					"he-Latn": "No Taḥanun said throughout Ḥanuka",
				},
				[WebsiteLimudCalendar.TEVES]: {
					"he": "אין אומרים תחנון בחנוכה",
					"en": "No Taḥanun said throughout Ḥanuka",
					"he-Latn": "No Taḥanun said throughout Ḥanuka",
				},
				[WebsiteLimudCalendar.SHEVAT]: {
					"he": "אין אומרים תחנון בט״ו בשבט",
					"en": "No Taḥanun said on " + tuBishvat.formatFancyDate().en + " (15<sup>th</sup> of Shevat)",
					"he-Latn": "No Taḥanun said on " + tuBishvat.formatFancyDate().en + " (Tu Bi'Shevat)",
				},
				[WebsiteLimudCalendar.ADAR]: {
					"he": "אין אומרים תחנון בפורים",
					"en": "No Taḥanun said on "
						+ purimKatan.formatFancyDate().en + ` (Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""}) & `
						+ purimKatan.tomorrow().formatFancyDate().en + ` (Shushan Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})`,
					"he-Latn": "No Taḥanun said on "
						+ purimKatan.formatFancyDate().en + ` (Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""}) & `
						+ purimKatan.tomorrow().formatFancyDate().en + ` (Shushan Purim${purimKatan.isJewishLeapYear() ? " Katan" : ""})`,
				},
				[WebsiteLimudCalendar.ADAR_II]: {
					"he": "אין אומרים תחנון בפורים",
					"en": "No Taḥanun said on "
						+ purim.formatFancyDate().en + ` (${yomTovObj[purim.getYomTovIndex()].en}) & `
						+ purim.tomorrow().formatFancyDate().en + ` (${yomTovObj[purim.tomorrow().getYomTovIndex()].en})`,
					"he-Latn": "No Taḥanun said on "
						+ purim.formatFancyDate().en + ` (${yomTovObj[purim.getYomTovIndex()].en}) & `
						+ purim.tomorrow().formatFancyDate().en + ` (${yomTovObj[purim.tomorrow().getYomTovIndex()].en})`,
				},
				[WebsiteLimudCalendar.IYAR]: {
					"he": "אין אומרים תחנון בפסח שני ולג בעומר",
					"en": "No Taḥanun said on "
						+ pesahSheni.formatFancyDate().en + ` (${yomTovObj[pesahSheni.getYomTovIndex()].en}) & `
						+ lagBaomer.formatFancyDate().en + ` (${yomTovObj[lagBaomer.getYomTovIndex()].en})`,
					"he-Latn": "No Taḥanun said on"
						+ pesahSheni.formatFancyDate().en + ` (${yomTovObj[pesahSheni.getYomTovIndex()].en}) & `
						+ lagBaomer.formatFancyDate().en + ` (${yomTovObj[lagBaomer.getYomTovIndex()].en})`,
				},
				[WebsiteLimudCalendar.SIVAN]: {
					"he": "אין אומרים תחנון מראש חודש עד י״ב בסיון)",
					"en": "No Taḥanun said from Rosh Ḥodesh until " + lastDayOfNoTachanunSivan.formatFancyDate().en + ` (12<sup>th</sup> of Sivan)`,
					"he-Latn": "No Taḥanun said from Rosh Ḥodesh until " + lastDayOfNoTachanunSivan.formatFancyDate().en + ` (12<sup>th</sup> of Sivan)`,
				},
				[WebsiteLimudCalendar.ELUL]: {
					"he": "אין אומרים תחנון בערב ראש השנה",
					"en": "No Taḥanun said on " + erevRH.formatFancyDate().en + " (Erev Rosh Ha'Shana)",
					"he-Latn": "No Taḥanun said on " + erevRH.formatFancyDate().en + " (Erev Rosh Ha'Shana)",
				}
			}[jCalBMoon.getJewishMonth()][x.data.lang]);
		} else {
			bLTitl.innerHTML = {
				he: "ברכת הלבנה - חודש " + jCalBMoon.formatJewishMonth().he,
				en: "Moon-Blessing - Month of " + jCalBMoon.formatJewishMonth().en,
				"he-Latn": "Birkath Ha'Levana - Ḥodesh " + jCalBMoon.formatJewishMonth().en
			}[x.data.lang];

			bLTimesDispl.appendChild(document.createTextNode({
				"he": "תחילת: ",
				"en": "Beginning: ",
				"he-Latn": "Beginning: "
			}[x.data.lang] + fmt(jCalBMoon.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()), dtFBLevana)));
			bLTimesDispl.appendChild(document.createElement("br"));
			bLTimesDispl.appendChild(document.createTextNode({
				"he": 'סוף (רמ"א): ',
				"en": 'End (Rama): ',
				"he-Latn": "End (Rama): "
			}[x.data.lang] + fmt(jCalBMoon.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()), dtFBLevana)));
		}

		return bLContain;
	}

	function handleTekufa(beforeHatzotOnly = false) {
		if (initTekuf.equals(zmanCalc.nextTekufa(x.data.tekufaMidpoint !== "hatzoth").withTimeZone(geoLocation.getTimeZone())))
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
			he: "תקופת " + tekufaMonth.he,
			en: tekufaMonth.en + " Season",
			"he-Latn": "Tekufath " + tekufaMonth.en
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
			"he": "אל תשתה מים בין ",
			"en": "Refrain from water between ",
			"he-Latn": "Refrain from water between "
		}[x.data.lang] + [
			fmt(initTekuf.round("minute").subtract({ minutes: 30 }), defaulTF),
			fmt(initTekuf.round("minute").add({ minutes: 30 }), defaulTF),
		].join(' - ')));

		if (nextTekufaJDate.getJewishMonth() == KosherZmanim.JewishDate.TISHREI && !x.data.israel) {
			tekufaTimingDiv.appendChild(document.createElement("br"));
			tekufaTimingDiv.innerHTML += {
				"en": "Switch to ברך עלינו " + (x.data.pocket ? "at the night prayer of " : "on "),
				"he": "תחליף לברך עלינו " + (x.data.pocket ? "בתפילת ערבית של " : "ביום "),
				"he-Latn": "Switch to ברך עלינו " + (x.data.pocket ? "at Tefilat Arvit of " : "on ")
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
		const erevPesah = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.PESACH && [...high.datesToZman.entries()].find(([date, data]) => 'sofZemanAhilathHametz' in data));
		const yomKippur = highlightZmanim.find(high => 'ytI' in high && high.ytI == WebsiteLimudCalendar.YOM_KIPPUR);
		if (erevPesah && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-hametz')) {
			const zmanimOfErev = [...erevPesah.datesToZman.entries()].find(([date, data]) => 'sofZemanAhilathHametz' in data);
			const hamesName = WebsiteLimudCalendar.formatFancyDate(zmanimOfErev[0])[x.data.lang];
			const hametzContainer = document.createElement("div");
			const hametzTitle = document.createElement("h5");
			hametzTitle.innerHTML = {
				he: "ערב פסח",
				en: "Passover Eve's Times - " + hamesName,
				"he-Latn": "Erev Pesaḥ - " + hamesName
			}[x.data.lang];

			const hametzTiming = document.createElement("p");
			hametzTiming.classList.add('mb-0');
			hametzTiming.appendChild(document.createTextNode({
				"he": "סןף זמן אחילת חמץ: ",
				"en": "Stop eating Ḥametz by ",
				"he-Latn": "Stop eating Ḥametz by "
			}[x.data.lang] + fmt(zmanimOfErev[1].sofZemanAhilathHametz, defaulTF)));
			hametzTiming.appendChild(document.createTextNode({
				"he": "; זמן ביעור חמץ עד ",
				"en": "; Dispose by ",
				"he-Latn": "; Dispose by "
			}[x.data.lang] + fmt(zmanimOfErev[1].sofZemanBiurHametz, defaulTF)));

			hametzContainer.appendChild(hametzTitle);
			if (!x.data.shabbatOnly) {
				hametzContainer.appendChild(hametzTiming);

				const hr = document.createElement("hr");
				hr.style.margin = ".5rem 0";
				hametzContainer.appendChild(hr);

				const nissanJCal = jCal.clone();
				nissanJCal.setDate(zmanimOfErev[0]);

				const blTiming = document.createElement("p");
				blTiming.classList.add('mb-0');

				blTiming.appendChild(document.createTextNode({
					"he": "זמן ברכת הלבנה לכתחילה לפני",
					"en": "Say Birkat Ha'Levana before the holiday",
					"he-Latn": "Say Birkat Ha'Levana before the holiday"
				}[x.data.lang]));

				const blEndTime = nissanJCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone());
				if (Temporal.ZonedDateTime.compare(blEndTime, zDTFromFunc(zmanCalc.chainDate(zmanimOfErev[0]).getNetz())) < 0) {
					blTiming.appendChild(document.createElement("br"));
					blTiming.appendChild(document.createTextNode({
						"he": "תחילת זמן (לכתחילה): ",
						"en": "Earliest (preferable) time: ",
						"he-Latn": "Earliest (preferable) time: "
					}[x.data.lang] + fmt(blEndTime, dtFBLevana)));
				}

				hametzContainer.appendChild(blTiming)
			} else {
				hametzContainer.appendChild(hametzTiming);
			}

			thisMonthFooter.lastElementChild.appendChild(hametzContainer);
		} else if (yomKippur && thisMonthFooter.lastElementChild.hasAttribute('data-zyfooter-yomkippur')) {
			const zmanimOfYK = [...yomKippur.datesToZman.entries()].find(([date, data]) => 'birkatKohanim' in data);

			const yKName = WebsiteLimudCalendar.formatFancyDate(zmanimOfYK[0])[x.data.lang];
			const yKContainer = document.createElement("div");
			const yKTitle = document.createElement("h5");
			yKTitle.innerHTML = {
				he: "יום כיפור",
				en: "Yom Kippur Times - " + yKName,
				"he-Latn": "Yom Kippur - " + yKName
			}[x.data.lang];

			const yKTiming = document.createElement("p");
			yKTiming.classList.add('mb-0');
			yKTiming.appendChild(document.createTextNode({
				"he": "תתחיל מוסף לפני ",
				"en": "Start מוסף before ",
				"he-Latn": "Start מוסף before "
			}[x.data.lang] + fmt(zmanimOfYK[1].musaf, defaulTF)));
			yKTiming.appendChild(document.createElement("br"));
			yKTiming.appendChild(document.createTextNode({
				"he": "ברכת כהנים לפני ",
				"en": "Finish ברכת כהנים before ",
				"he-Latn": "Finish ברכת כהנים before "
			}[x.data.lang] + fmt(zmanimOfYK[1].birkatKohanim, defaulTF)));

			const tishriJCal = jCal.clone();
			tishriJCal.setDate(zmanimOfYK[0]);
			const tishriBLEnd = tishriJCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone());
			if (!x.data.shabbatOnly && Temporal.ZonedDateTime.compare(tishriBLEnd, zDTFromFunc(zmanCalc.chainDate(zmanimOfYK[0].add({ days: 4 })).getNetz())) == -1) {
				const hr = document.createElement("hr");
				hr.style.margin = ".5rem 0";
				yKTiming.appendChild(hr);

				yKTiming.appendChild(document.createTextNode({
					"he": "זמן ברכת הלבנה לכתחילה לפני ",
					"en": "Preferable time for Birkat Ha'Levana before ",
					"he-Latn": "Preferable time for Birkat Ha'Levana before "
				}[x.data.lang] + fmt(tishriBLEnd, dtFBLevana)));
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
					he: "מוצאי שבת ויו\"ט לברכת הלבנה",
					en: "Shabbat & YT for Birkath Ha'Levana",
					"he-Latn": "Shabbat & YT for Birkath Ha'Levana"
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

					bLTimes.insertAdjacentHTML('beforeend', jCalBMoon.formatJewishMonth()[x.data.lang == "he" ? "he" : "en"] + " - " + bLShabDays);
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

		return { month: x.data.month, sunriseOffsets, htmlContent: [monthTable.outerHTML, thisMonthFooter.outerHTML] };
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
					hanukahElem.getElementsByClassName('hanukaLightTime')[0].innerHTML = fmt(hanukahZmanim.candleLighting, defaulTF);
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

				highlightCard.getElementsByClassName("importantCardTitleText")[0].innerHTML = highlight.title;

				const dateRange = [...highlight.datesToZman.keys()].sort(Temporal.PlainDate.compare);
				const dateElem = highlightCard.getElementsByClassName("importantCardDates")[0];
				if (dateRange.length == 1) {
					dateElem.innerHTML = WebsiteLimudCalendar.formatFancyDate(dateRange[0], { dayLength: "short", monthLength: "short", ordinal: true})["en"]
				} else if (x.data.lang == 'he'
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
							rtElem.innerHTML = ` (${x.data.lang == 'he' ? 'ר"ת' : 'R"T'}: ${fmt(zmanTime, defaulTF)})`;
							rtElem.classList.add('rabbenuTamAppend');

							timesBox.lastElementChild.appendChild(rtElem);
							continue;
						} else if (zmanName == 'sofZemanAhilathHametz') {
							const ahilaElement = document.createElement("div");
							ahilaElement.innerHTML = `(${x.data.lang == 'he' ? "סוף זמן אכילת חמץ:" : "Eat before "} ${fmt(zmanTime, defaulTF)})`;
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
									if (x.data.lang !== 'he')
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
								innerRow[0] = icons.dispose + (x.data.lang == 'he' ? " השבתת חמץ לפני" : " Dispose Ḥametz by");
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
									(x.data.lang == 'he' ? "בדיקה בליל " + n2hebDateOrdinal(zmanTime.dayOfWeek) + ":"
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

						innerRow[0] += " " + fmt(zmanTime, bottomTF);
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
		initTekuf = zmanCalc.nextTekufa(x.data.tekufaMidpoint !== "hatzoth");
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

		return { month: x.data.month, sunriseOffsets, htmlContent: [monthTable.outerHTML, firstSideClone.outerHTML, backupMonthTable.outerHTML, secondSideClone.outerHTML] };
	}
}

if (Worker) {
	addEventListener('message', async (message) => {
		// Both init messages are handled before any await, so they are in place before the first month runs
		if (message.data && message.data.type === 'refraction') {
			// The page may send the table as one JSON string: far cheaper to post than the same table as objects
			const table = message.data.tableJson ? JSON.parse(message.data.tableJson) : message.data.table;
			refraction.provider = providerFromSnapshot(table, message.data.normals);
			refraction.horizon = message.data.horizon;
			refraction.haze = message.data.haze ?? null;
			return;
		}
		if (message.data && message.data.type === 'init') {
			const { type, ...init } = message.data;
			workerInit = init;
			return;
		}

		try {
			await loadWorkerPolyfills();
			postMessage(messageHandler(workerInit ? { data: { ...workerInit, ...message.data } } : message))
		} catch (err) {
			console.error(err);
			postMessage({ month: message.data.month, error: err instanceof Error ? (err.stack || err.message) : String(err) });
		}
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

export default messageHandler;
