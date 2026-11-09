// @ts-check

import * as KosherZmanim from '../../../libraries/kosherZmanim/kosher-zmanim.js';
import WebsiteLimudCalendar from '../../WebsiteLimudCalendar.js';
import { parseHTML } from '../../../libraries/linkedom/linkedom.mjs'
import { daysForLocale, roundsUp } from '../../WebsiteCalendar.js';
import { ZemanFunctions, methodNames, zDTFromFunc } from '../../ROYZmanim.js';
import { providerFromSnapshot } from '../../refraction-snapshot.js';
import { zemanimConfigFrom } from '../../core/zmanimSettings.js';
import n2wordsOrdinal, { n2hebDateOrdinal } from '../../misc/n2wordsOrdinal.js';
import makamObj from '../../makamObj.js';
import { fmt, hallelNotice, shabbatExtra } from '../print-shared.js';
import { holidayNames, fastNames, holidayKind, holidayCards, roshHashana, fast, fastDay, isShabbatCardDay, shabbat,
	hanukkahNight, needsEruvTavshilin } from '../../day-cards.js';
import { loadWorkerPolyfills } from '../../misc/worker-polyfills.js';
import { mergeCalcs, roundAcrossLocations } from './multi-zeman.js';

const icons = {
	havdalah: '<svg viewBox="0 0 108.81511 287.75458" class="flipImageRTL"><use href="/assets/images/havdala.svg#layer1"/></svg>',
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

/** @typedef {{ week: number; date: string; }} singlePageParams One week; "date" is the week's first day (in the print calendar) */

/**
 * Sent once per worker, after the RefractionInit(s) and before any week (see print-export-weekly.js).
 * Everything in it is the same for every week.
 *
 * `locations` are the places the zemanim are computed for: with more than one, every zeman is averaged
 * across them (multi-zeman.js) and the sunrise table, when the page has one, lists each one's sunrise.
 * `geoCoordinates` is their centre (time zone, molad...); with one location it is that location.
 * @typedef {{
	type: 'init';
	israel: boolean;
	zemanim: import('../../core/zmanimSettings.js').ZemanimOptions;
	geoCoordinates: [string, number, number, number, string];
	locations: [string, number, number, number, string][];
	htmlElems: string;
	calendar: 'iso8601'|'hebrew';
	tekufaMidpoint: 'hatzoth'|'arbitrary';
	timeFormat: 'h11'|'h12'|'h23'|'h24';
	lang: "he"|"he-Latn"|"en";
	addedZemanim: string[];
  }} WorkerInit */

/**
 * Sent once per worker and location, before any week (see print-export-weekly.js). Workers have no
 * localStorage and can't receive the provider closure, so they get the provider's plain results instead.
 * `index` is the location's position in WorkerInit.locations (0 when omitted; the moon workers take the
 * same message without it). The weekly workers may get the table as `tableJson` instead (see
 * print-export-weekly.js): one string is far cheaper to post than the same table as objects.
 * @typedef {{
	type: 'refraction';
	index?: number;
	table?: import('../../refraction-snapshot.js').ProviderSnapshot;
	tableJson?: string;
	normals: import('../../refraction-snapshot.js').Normals | null;
	horizon: import('../../refraction-snapshot.js').Horizon | null;
	haze?: import('../../astro/star-nightfall.js').HazeData | null;
  }} RefractionInit */

/** @typedef {[string, Intl.DateTimeFormatOptions]} TimeFormat */
/** @typedef {Record<'he'|'en'|'he-Latn', string>} LangText */

/**
 * One day of the month grid on the moon pages (see month-grid.js). Times are pre-formatted, without AM/PM.
 * @typedef {{
	titles: string[];
	times: { kind: 'candle'|'havdalah'|'fastStart'|'fastEnd'|'fastRange'; time: string }[];
	bold: boolean;
  }} GridDay */

/** @typedef {{ provider: import('../../refraction-snapshot.js').AtmosphereProvider | null, horizon: import('../../refraction-snapshot.js').Horizon | null, haze: import('../../astro/star-nightfall.js').HazeData | null }} LocationRefraction */

/** Set by the RefractionInit messages, one per location. @type {LocationRefraction[]} */
const refractions = [];

/** @param {number} index @returns {LocationRefraction} */
const refractionFor = (index) => refractions[index] ?? { provider: null, horizon: null, haze: null };

// ─── Per-worker state, set once by the WorkerInit message ─────────────────────
/** @type {WorkerInit} */
let workerInit;
/** The template, parsed once; every week resets it from pristine clones instead of re-parsing. @type {any} */
let templateDoc;
/** @type {any[]} */
let pristineNodes = [];
/** Stable tuples, so the formatter cache below hits across weeks. @type {{ default: TimeFormat, sunrise: TimeFormat, levana: TimeFormat }} */
let formats;
/** @type {Record<number, LangText>} */
let yomTovObj;
/** @type {Record<number, string>} */
let taanitYomTovNames;
/** Built lazily on the first week (after Temporal is guaranteed). @type {any} */
let makamIndex = null;

const ordinalRules = new Intl.PluralRules("en", { type: "ordinal" });


/** @type {Map<string, Intl.DateTimeFormat | null>} */
const shortFormatterCache = new Map();

/**
 * A time without AM/PM (the month grid; the sunrise table, with seconds)
 * @param {Temporal.ZonedDateTime} zdt
 */
function fmtShort(zdt, seconds = false) {
	const key = zdt.timeZoneId + (seconds ? "|s" : "");
	let formatter = shortFormatterCache.get(key);
	if (formatter === undefined) {
		try {
			formatter = new Intl.DateTimeFormat(workerInit.lang == 'he' ? 'he' : 'en',
				{ hourCycle: workerInit.timeFormat, hour: 'numeric', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}), timeZone: zdt.timeZoneId });
		} catch {
			formatter = null;
		}
		shortFormatterCache.set(key, formatter);
	}
	if (!formatter) return fmt(zdt, formats.default);
	return formatter.formatToParts(zdt.epochMilliseconds)
		.filter(part => part.type !== 'dayPeriod')
		.map(part => part.value).join('').trim();
}

/** Resets the parsed template to its original state and returns it. */
function freshDocument() {
	const doc = templateDoc;
	while (doc.firstChild)
		doc.removeChild(doc.firstChild);
	for (const node of pristineNodes)
		doc.appendChild(node.cloneNode(true));
	return doc;
}

/**
 * Each location's calculator config, made once per worker rather than once per week: ROYZmanim.js keys
 * its caches by the config object (the shared astronomical calculator with its ray traces, the visible
 * sunrises, the equinox hours, the haze delays), so a config kept for the worker's lifetime lets every
 * week reuse what earlier weeks computed (the holiday boxes reach into neighbouring weeks), and saves
 * setting up a calculator per location per week.
 * @type {import('../../ROYZmanim.js').ZemanimConfig[]}
 */
let locationConfigs = [];

/**
 * @param {WorkerInit} init @param {number} index the location's position in init.locations
 * @returns {import('../../ROYZmanim.js').ZemanimConfig}
 */
function locationConfig(init, index) {
	return locationConfigs[index] ??= (() => {
		const locRefraction = refractionFor(index);
		return zemanimConfigFrom(init.zemanim,
			{ atmosphereProvider: locRefraction.provider, horizon: locRefraction.horizon, haze: locRefraction.haze });
	})();
}

/** @param {WorkerInit} init */
function initWorker(init) {
	workerInit = init;
	locationConfigs = [];

	templateDoc = parseHTML(init.htmlElems).document;
	pristineNodes = [...templateDoc.childNodes].map(node => node.cloneNode(true));

	const locale = init.lang == 'he' ? 'he' : 'en';
	/** @type {Intl.DateTimeFormatOptions} */
	const timeOpts = { hourCycle: init.timeFormat, hour: 'numeric', minute: '2-digit' };
	formats = {
		default: [locale, timeOpts],
		sunrise: [locale, { ...timeOpts, second: '2-digit' }],
		levana: [locale, { weekday: 'short', month: 'short', day: 'numeric', ...timeOpts }]
	};

	yomTovObj = holidayNames(init.israel);
	taanitYomTovNames = Object.fromEntries(Object.entries(fastNames).map(([index, names]) => [index, names[init.lang]]));
}

// "date" of param will have to be in the iso8601 calendar
/**
  * @param {{ data: singlePageParams & WorkerInit }} x
 */
function messageHandler(x) {
	const geoLocation = new KosherZmanim.GeoLocation(...x.data.geoCoordinates);

	const document = freshDocument();

	const defaulTF = formats.default;
	const dtFBLevana = formats.levana;
	const sunriseTF = formats.sunrise;

	const baseDate = Temporal.PlainDate.from(x.data.date);

	const jCal = new WebsiteLimudCalendar();
	jCal.setDate(baseDate.withCalendar("iso8601"))
	jCal.setInIsrael(x.data.israel);

	// One calculator per location (each with its own air and horizon); zmanCalc stands for all of them,
	// averaging what they return (see multi-zeman.js). With one location it is that location's calculator.
	const locationArgs = x.data.locations?.length ? x.data.locations : [x.data.geoCoordinates];
	const calcs = locationArgs.map((args, index) =>
		new ZemanFunctions(new KosherZmanim.GeoLocation(...args), locationConfig(x.data, index)));
	const multiLocation = calcs.length > 1;
	const zmanCalc = mergeCalcs(calcs);
	zmanCalc.setDate(jCal.getDate())

	/** zmanCalc.chainDate, memoized per date for this week (the holiday boxes ask for the same day many times) */
	const chainCache = new Map();
	/** @param {Temporal.PlainDate} date @returns {ReturnType<typeof zmanCalc.chainDate>} */
	const zc = (date) => {
		const key = date.withCalendar("iso8601").toString();
		let calc = chainCache.get(key);
		if (!calc)
			chainCache.set(key, calc = zmanCalc.chainDate(date));
		return calc;
	};

	/** Per location: visible minus sea-level sunrise (ms) per ISO date, for the summary table on the main page. @type {Record<string, number>[]} */
	const sunriseOffsets = calcs.map(() => ({}));

	/** The multi-location pages' sunrise table (only they compute its cells) */
	const sunriseTable = document.querySelector('[data-zyFind="sunriseTable"]');

	/** Per location, per day of the week: the sunrise-table cell (sunrise, and the full solar sphere under it). @type {{ text: string; full: string; seaLevel: boolean }[][]} */
	const sunriseCells = calcs.map(() => []);

	/** Per-day contents for the month grids on the moon pages, keyed by ISO date. @type {Record<string, GridDay>} */
	const monthGridDays = {};

	// @ts-ignore
	makamIndex ??= new KosherZmanim.Makam(makamObj.sefarimList);

	/**
	 * @param {Temporal.ZonedDateTime} zDT
	 * @param {'earlier'|'later'|'noRound'} round
	 */
	function handleRound(zDT, round) {
		if (round === 'noRound')
			return zDT;

		// An averaged time is rounded per location first, then averaged (see multi-zeman.js)
		return roundAcrossLocations(zDT, round, roundOne);
	}

	/**
	 * @param {Temporal.ZonedDateTime} zDT
	 * @param {'earlier'|'later'} round
	 */
	function roundOne(zDT, round) {
		const minute = zDT.with({ second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 });
		if (roundsUp(zDT, round))
			return minute.add({ minutes: 1 });
		else
			return minute;
	}

	function handleShita(/** @type {Element} */zmanRow) {
		const shita = zmanRow.getAttribute("data-zydata")

		/** @type {'earlier'|'later'} */
		// @ts-expect-error
		const round = zmanRow.getAttribute("data-round")

		const div = /** @type {HTMLElement} */ (zmanRow.lastElementChild)
		/**
		 * @param {Temporal.ZonedDateTime} zDT
		 * @param {'earlier'|'later'} round
		 * @param {{dtF: TimeFormat; icon?: string, appendText?: string}} config
		 */
		function renderZmanInDiv(zDT, round, config = { dtF: defaulTF, icon: undefined }) {
			if (zDT.dayOfYear !== jCal.getDate().dayOfYear) {
				const dayElem = document.createElement("span");
				div.classList.add('tableCellHasIcon');
				dayElem.appendChild(document.createTextNode('⤵️'));

				div.appendChild(dayElem)
			}

			if (config.icon)
				div.insertAdjacentHTML('beforeend', config.icon + " ");

			const timeStr = fmt(handleRound(zDT, ('second' in config.dtF[1] ? 'noRound' : round)), config.dtF)

			const timeSpan = document.createElement("span")
			timeSpan.classList.add("zman-time")
			timeSpan.appendChild(document.createTextNode(timeStr.trim()))
			div.appendChild(timeSpan);

			if (config.appendText)
				div.insertAdjacentHTML('beforeend', config.appendText);
		}

		switch (shita) {
			case 'getTzet':
				if (jCal.hasCandleLighting() || !jCal.isAssurBemelacha()) {
					renderZmanInDiv(zmanCalc.getTzet(), round)
				}

				if (zmanRow.hasAttribute('data-zytzetstrict'))
					renderZmanInDiv(zmanCalc.getTzetHumra(), round, { dtF: defaulTF, icon: x.data.lang == 'he' ? ' (חומרה: ' : ' (Strict:', appendText: ')' })

				const tzetInUse = /** @type {HTMLElement | undefined} */ ([...zmanRow.getElementsByClassName("zman-time")].at(-1))
				if (!tzetInUse) {
					break;
				}

				if (jCal.isTaanis() && !jCal.isYomKippur()) {
					tzetInUse.style.fontWeight = "800";
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
					/** @type {HTMLElement} */ (div.lastElementChild).style.fontWeight = "800"
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
						|| (jCal.getJewishDayOfMonth() == 8 && jCal.getDayOfWeek() !== KosherZmanim.Calendar.FRIDAY))) { /** @type {HTMLElement} */ (div.lastElementChild).style.fontWeight = "800" }

				break;
			default:
				let time = null;
				try {
					// @ts-ignore
					time = zmanCalc[shita]();
				} catch (e) {
					if (!methodNames.includes(shita)) {
						if (shita == null)
							console.log(zmanRow);
						throw new Error("Unknown zman " + shita);
					} else
						throw e;
				}
				renderZmanInDiv(time, round)
		}

		// Two zemanim in one row ("[Gedola] / [Ketana]"): data-zyDataSecond / data-roundSecond
		const secondShita = zmanRow.getAttribute("data-zydatasecond");
		if (secondShita) {
			if (!methodNames.includes(secondShita))
				throw new Error("Unknown zman " + secondShita);
			/** @type {'earlier'|'later'} */
			// @ts-expect-error
			const secondRound = zmanRow.getAttribute("data-roundsecond") || round;
			div.appendChild(document.createTextNode(" / "));
			// @ts-ignore
			renderZmanInDiv(zmanCalc[secondShita](), secondRound);
		}
	}

	const whiteTekufotMonth = document.getElementsByClassName('whiteTekufotMonths')[0]

	const omerStartDate = jCal.chainJewishDate(jCal.getJewishYear(), WebsiteLimudCalendar.NISSAN, 15).getDate();
	/** @typedef {import('../../day-cards.js').DayCard} highlightedZman */
	/** @type {highlightedZman[]} */
	let highlightZmanim = [];

	/** What the Shabbat / Yom Tov / fast cards (day-cards.js) are built from: rounded across the locations */
	/** @type {import('../../day-cards.js').CardContext} */
	const cardCtx = { jCal, zc, round: handleRound, lang: x.data.lang };

	/**
	 * The eve's notices for Rosh Hashana and Yom Kippur (the immersion goes here rather than in the times)
	 * @param {highlightedZman} card @param {number} ytI
	 */
	function erevNotice(card, ytI) {
		const erev = [...card.datesToZman.keys()][0];
		delete card.datesToZman.get(erev).mikva;
		card.topNotice = [
			`On Erev ${yomTovObj[ytI][x.data.lang]}:`,
			"Omit Taḥanun after " + fmt(handleRound(zDTFromFunc(zc(erev).getNetz()), 'later'), defaulTF),
			"Immerse in a Mikva after " + fmt(handleRound(zc(erev).getSofZemanBiurHametz(), 'later'), defaulTF)
		].join('<br>');
	}

	/** @param {highlightedZman} card */
	function addHighlight(card) {
		if (highlightZmanim.some(other => other.id === card.id))
			return;

		if (card.ytI !== undefined && card.ytI !== WebsiteLimudCalendar.YOM_KIPPUR && needsEruvTavshilin(card, jCal))
			card.extra = "Eruv Tavshilin is made before the holiday";

		if (card.hallelBefore)
			card.bottomNotice = hallelNotice(card, x.data.lang, defaulTF);
		else if (card.ytI === WebsiteLimudCalendar.YOM_KIPPUR || card.ytI === WebsiteLimudCalendar.ROSH_HASHANA)
			erevNotice(card, card.ytI);
		else if (card.ytI === undefined) {
			// Shabbat: Rabbenu Tam goes with the earliest time, under the times
			const [friday, shabbatDate] = [...card.datesToZman.keys()];
			const erevZmanCal = zc(friday);
			const rabbenuTam = card.datesToZman.get(shabbatDate).rabbenuTam;
			delete card.datesToZman.get(shabbatDate).rabbenuTam;

			card.extra = shabbatExtra(card, x.data.lang, jCal.shabbat(), makamIndex, makamObj, n2hebDateOrdinal);
			card.topNotice =
				"Refrain from starting a meal after " + fmt(handleRound(erevZmanCal.getSofZemanSeuda(), 'earlier'), defaulTF)
				+ "<br>Prohibited to work from " + fmt(handleRound(erevZmanCal.getSofZemanMelakha(), 'earlier'), defaulTF) + " onwards";
			card.bottomNotice =
				"Earliest time: " + fmt(handleRound(erevZmanCal.getPlagHaminhaHalachaBrurah(), 'later'), defaulTF)
				+ " <span class='fs-sm'>H\"B</span> / "
				+ fmt(handleRound(erevZmanCal.getPlagHaminhaYalkutYosef(), 'later'), defaulTF)
				+ " <span class='fs-sm'>O\"H</span><br>"
				+ "Rabbenu Tam <span class='fs-sm'>(after Shabbat)</span>: "
				+ fmt(rabbenuTam, defaulTF);
		}

		highlightZmanim.push(card);
	}

	/** The cards for the day jCal is on (day-cards.js), and the week's Ḥanukka and Sefirat Ha'Omer */
	function populateHighlightZmanim() {
		const kind = holidayKind(jCal);
		const fastJCal = fastDay(jCal);

		if (kind == 'roshHashana') {
			// with the fast of Gedalyah after it (the 3rd of Tishri, or the 4th when that's Shabbat)
			const card = roshHashana(cardCtx);
			if (!highlightZmanim.some(other => other.id === card.id)) {
				addHighlight(card);
				const firstDay = jCal.chainDate([...card.datesToZman.keys()][0].add({ days: 1 }));
				const gedalyah = [3, 4]
					.map(day => firstDay.chainJewishDate(firstDay.getJewishYear(), WebsiteLimudCalendar.TISHREI, day))
					.find(day => day.isTaanis());
				if (gedalyah)
					addHighlight(fast(cardCtx, gedalyah));
			}
		} else if (kind == 'pesachFirst' || kind == 'yomKippur')
			addHighlight(holidayCards[kind](cardCtx));
		else if (fastJCal)
			addHighlight(fast(cardCtx, fastJCal));
		else if (kind)
			addHighlight(holidayCards[kind](cardCtx));
		else if (isShabbatCardDay(jCal))
			addHighlight(shabbat(cardCtx));

		if ((jCal.isChanukah() || jCal.tomorrow().isChanukah()) && !highlightZmanim.find(high => high.ytI == WebsiteLimudCalendar.CHANUKAH)) {
			/** @type {highlightedZman} */
			const hanukahObj = {
				id: "hanukkah",
				ytI: WebsiteLimudCalendar.CHANUKAH,
				title: x.data.lang == "he" ? "חנוכה" : "Ḥanoukka",
				topNotice: "[Ideally] light during the following half hour <span class='fs-sm'>(Fri-Shab excluded)</span>",
				bottomNotice: "Recite the text of על הנסים during Birkat Hamazon/Tefila<br>Replace תחנון with הלל שלם in Tefila",
				datesToZman: new Map()
			};
			highlightZmanim.push(hanukahObj);

			const hanuJCal = jCal.chainJewishDate(jCal.getJewishYear(), WebsiteLimudCalendar.KISLEV, 24);
			for (let i = 0; i < 8; i++) {
				const hanDay = hanuJCal.getDate().add({ days: i });
				hanukahObj.datesToZman.set(hanDay, hanukkahNight(cardCtx, hanDay));
			}
		}

		for (let week = 1; week <= 7; week++) {
			const weekTitle = "Sefirat Ha'Omer - Week " + romanize(week);
			if (highlightZmanim.some(high => high.title?.startsWith(weekTitle))) continue;

			const weekStart = omerStartDate.add({ days: 7 * (week - 1) });
			const weekEnd = weekStart.add({ days: 8 }); // 7 days of the count + the night starting the next one

			if (!rangeTemporal(weekStart, jCal.getDate(), weekEnd, true)) continue;

			/** @type {highlightedZman} */
			const sefiraObj = { id: "omer-" + week, title: weekTitle, datesToZman: new Map() };

			for (let i = 0; i < 7; i++) {
				const d = weekStart.add({ days: i });
				sefiraObj.datesToZman.set(d, { omerCount: zc(d).getTzet() });
			}

			highlightZmanim.push(sefiraObj);
		}
	}

	let initTekuf = zmanCalc.nextTekufa(x.data.tekufaMidpoint !== "hatzoth");

	const addedZemanim = Object.fromEntries(x.data.addedZemanim.map(str => [str.split('|')[0], {}]))

	const weekdayList = [...document.getElementsByClassName('templateZmanimWeekDay')];
	weekdayList.forEach((weekdayElem, index) => {
		const plainDate = baseDate.add({ days: index });
		jCal.setDate(plainDate.withCalendar("iso8601"))
		zmanCalc.setDate(plainDate.withCalendar("iso8601"));

		// Each location's own sunrise: the offsets for the main page's summary, and the sunrise table's cells.
		// A visible sunrise keeps its seconds; a location without one shows sea-level sunrise, rounded like
		// the Sunrise row (no seconds) and marked.
		// The full solar sphere (H"B) goes under it, in the same form: seconds when traced over the terrain.
		calcs.forEach((calc, index) => {
			const netz = calc.getNetz();
			const seaLevel = calc.coreZC.getSeaLevelSunrise();
			if (netz && !(netz instanceof Temporal.ZonedDateTime))
				sunriseOffsets[index][plainDate.withCalendar("iso8601").toString({ calendarName: "never" })] =
					netz.time.epochMilliseconds - seaLevel.epochMilliseconds;

			if (!sunriseTable)
				return;

			if (!netz) {
				sunriseCells[index].push({ text: "—", full: "", seaLevel: false });
				return;
			}
			const visible = !(netz instanceof Temporal.ZonedDateTime);
			/** @type {Temporal.ZonedDateTime | null} */
			let full = null;
			try {
				full = calc.testSunriseHBWorking();
			} catch (e) {
				console.error("Full solar-sphere sunrise failed", e);
			}
			const show = (/** @type {Temporal.ZonedDateTime} */ zdt) => visible ? fmtShort(zdt, true) : fmtShort(roundOne(zdt, 'later'));
			sunriseCells[index].push({
				text: show(zDTFromFunc(netz)),
				full: full ? show(full) : "",
				seaLevel: !visible
			});
		});

		// ─── Month grid (moon pages) ───
		{
			/** @type {GridDay} */
			const gridDay = { titles: [], times: [], bold: false };
			const lang = x.data.lang;

			if (jCal.getDayOfWeek() === 7 && WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()])
				gridDay.titles.push(WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]);
			if (jCal.isRoshChodesh())
				gridDay.titles.push({ 'he': "ראש חדש", "he-Latn": "Rosh Ḥodesh", 'en': "New Month" }[lang]);
			if (jCal.getYomTovIndex() in yomTovObj)
				gridDay.titles.push(yomTovObj[jCal.getYomTovIndex()][lang]);
			else if (jCal.isTaanis())
				gridDay.titles.push(taanitYomTovNames[jCal.getYomTovIndex()] ?? (lang == 'he' ? "צום" : "Fast"));
			if (jCal.getDayOfChanukah() !== -1)
				gridDay.titles.push(lang == 'he'
					? "חנוכה " + hNum.formatHebrewNumber(jCal.getDayOfChanukah())
					: "Ḥanukka " + jCal.getDayOfChanukah());

			gridDay.bold = jCal.isAssurBemelacha() || jCal.isRoshChodesh() || jCal.getYomTovIndex() in yomTovObj;

			// Same rules as the Ohel Michael grid / the weekly cards
			if (jCal.hasCandleLighting()) {
				const dow = jCal.getDayOfWeek();
				const candle = dow === 6 || !jCal.isAssurBemelacha()
					? handleRound(zmanCalc.getCandleLighting(), 'earlier')
					: dow === 7
						? handleRound(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later')
						: handleRound(zmanCalc.getTzetHumra(), 'later');
				gridDay.times.push({ kind: 'candle', time: fmtShort(candle) });
			} else if (jCal.isAssurBemelacha()) {
				gridDay.times.push({ kind: 'havdalah', time: fmtShort(handleRound(zDTFromFunc(zmanCalc.getTzetMelakha()), 'later')) });
			}

			if (jCal.tomorrow().getYomTovIndex() === WebsiteLimudCalendar.TISHA_BEAV)
				gridDay.times.push({ kind: 'fastStart', time: fmtShort(handleRound(zmanCalc.getShkiya(), 'earlier')) });
			if (jCal.isTaanis() && !jCal.isYomKippur()) {
				if (jCal.getYomTovIndex() === WebsiteLimudCalendar.TISHA_BEAV)
					gridDay.times.push({ kind: 'fastEnd', time: fmtShort(handleRound(zmanCalc.getTzetHumra(), 'later')) });
				else
					gridDay.times.push({
						kind: 'fastRange',
						time: fmtShort(handleRound(zmanCalc.getAlotHashahar(), 'earlier')) + '–' + fmtShort(handleRound(zmanCalc.getTzetHumra(), 'later'))
					});
			}

			monthGridDays[plainDate.withCalendar("iso8601").toString()] = gridDay;
		}

		populateHighlightZmanim();

		const dateText = [jCal.getDate().toLocaleString('en', { month: "long" }) + " " +
			getOrdinal(jCal.getGregorianDayOfMonth(), "html"),
		hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " +
		jCal.getDate().toLocaleString('he-u-ca-hebrew', { month: 'long' })];
		if (x.data.lang == "he")
			dateText.reverse()

		const dateTextElem = weekdayElem.querySelector('.templateDateInner')
		dateTextElem.innerHTML = dateText.join("<br>")

		const specialElems = [];

		if (jCal.getDayOfWeek() === 7 && jCal.getParshah() in WebsiteLimudCalendar.hebrewParshaMap && WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]) {
			specialElems.push(WebsiteLimudCalendar.hebrewParshaMap[jCal.getParshah()]);
		}

		if (jCal.isRoshChodesh()) {
			specialElems.push({
				'he': "ראש חדש",
				"he-Latn": "Rosh Ḥodesh",
				'en': "New Month"
			}[x.data.lang])
		}

		if (jCal.getDayOfWeek() == KosherZmanim.Calendar.SUNDAY
			&& jCal.getJewishMonth() == KosherZmanim.JewishDate[(jCal.isJewishLeapYear() ? "ADAR_II" : "ADAR")]
			&& jCal.getJewishDayOfMonth() == 16) {
			specialElems.push(x.data.lang == "he" ? "פורים משולש" : "Purim Meshulash");
		}

		if (jCal.tomorrow().getDayOfChanukah() !== -1) {
			specialElems.push(
				x.data.lang == "he" ? "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()] + " של חנוכה"
					: getOrdinal(jCal.tomorrow().getDayOfChanukah(), 'svg') + " night of חנוכה");
		} else if (jCal.getDayOfChanukah() == 8) {
			specialElems.push({
				"he": "זאת חנוכה",
				"en": "Ḥanuka Day",
				"he-Latn": "Yom Ḥanuka"
			}[x.data.lang]);

		}

		if (jCal.isBirkasHachamah()) {
			specialElems.push({
				'he': "ברכת החמה",
				"he-Latn": "Birkath Haḥama",
				'en': "Blessing of the Sun"
			}[x.data.lang]);
		}

		if (jCal.getYomTovIndex() in yomTovObj) {
			specialElems.push(yomTovObj[jCal.getYomTovIndex()][x.data.lang]);
		} else if (jCal.isTaanis()) {
			specialElems.push(x.data.lang == 'he' ? "צום" : "Fast")
		}

		const specialText = weekdayElem.querySelector('text.specialDaysText')
		const svg = weekdayElem.querySelector('svg.templateDate')

		// Generate arc paths dynamically
		specialElems
			.sort((aStr, bStr) => bStr.replace(/<\/?tspan\b[^>]*>/gi, '').length - aStr.replace(/<\/?tspan\b[^>]*>/gi, '').length)
			.forEach((elem, i) => {
				const arcPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				const arcId = `arcBottom-${weekdayElem.dataset.dayIndex}-${i}`;

				const yPos = 74 - (i * 8);
				const radius = 46 + (i * 2);   // was 38 + i*2 — widened to match top arc's span

				arcPath.setAttribute('id', arcId);
				arcPath.setAttribute('d', `M ${10 - i},${yPos} A ${radius},${radius} 0 0,0 ${90 + i},${yPos}`); // was 15-i / 85+i
				arcPath.setAttribute('fill', 'none');

				svg.appendChild(arcPath);

				const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
				textPath.setAttribute('href', `#${arcId}`);
				textPath.setAttribute('startOffset', '50%');
				textPath.setAttribute('text-anchor', 'middle');
				textPath.innerHTML = elem;

				specialText.appendChild(textPath);
			});

		for (const zmanRow of weekdayElem.getElementsByClassName("zman-row")) {
			handleShita(zmanRow);
		}

		for (const shitaFull of x.data.addedZemanim) {
			const [shita, roundAttr] = shitaFull.split("|")
			const round = /** @type {'earlier'|'later'|'noRound'} */ (roundAttr)
			if (shitaFull == "get72Seasonal")
				addedZemanim[shitaFull][plainDate.toString()] = fmt(handleRound(zmanCalc.timeRange.current.tzethakokhavim, "later"), defaulTF);
			else if (shitaFull == "rambamYomi") {
				const rambamLimud = KosherZmanim.DailyMishnehTorah.getDailyLearning(plainDate.withCalendar("iso8601"))
				addedZemanim[shitaFull][plainDate.toString()] =
					"<b>" + rambamLimud.bookName + "</b>"
					+ " - "
					+ rambamLimud.chapters
						.map(num => x.data.lang == "he" ? hNum.formatHebrewNumber(num) : num)
						.join('-')
			} else
				addedZemanim[shita][plainDate.toString()] = fmt(handleRound(zmanCalc[shita](), round), round == "noRound" ? sunriseTF : defaulTF)
		}
	})

	// ─── Sunrise table (pages that have one, in place of the learning cycles) ───
	// Columns are the days of the week, rows the locations.
	if (sunriseTable) {
		const locale = x.data.lang == 'he' ? 'he' : 'en';
		const headRow = sunriseTable.querySelector('thead tr');
		weekdayList.forEach((_, index) => {
			const day = baseDate.add({ days: index }).withCalendar("iso8601");
			const th = document.createElement("th");
			// One line ("Sun 6"), to keep the table short
			th.innerHTML = day.toLocaleString(locale, { weekday: 'short' }) + " "
				+ (x.data.lang == 'he' ? hNum.formatHebrewNumber(day.withCalendar("hebrew").day) : day.day);
			headRow.appendChild(th);
		});

		const tbody = sunriseTable.querySelector('tbody');
		locationArgs.forEach((args, index) => {
			const row = document.createElement("tr");
			const name = document.createElement("th");
			name.setAttribute("scope", "row");
			name.appendChild(document.createTextNode(args[0]));
			row.appendChild(name);

			for (const cell of sunriseCells[index]) {
				const td = document.createElement("td");
				td.appendChild(document.createTextNode(cell.text));
				if (cell.seaLevel) {
					td.classList.add("seaLevelSunrise");
					td.insertAdjacentHTML('beforeend', "<sup>*</sup>");
				}
				if (cell.full) {
					const full = document.createElement("span");
					full.className = "fullSphereSunrise";
					full.appendChild(document.createTextNode(cell.full));
					td.appendChild(full);
				}
				row.appendChild(td);
			}
			tbody.appendChild(row);
		});

		// The footnote is only for weeks that need it
		if (!sunriseCells.some(cells => cells.some(cell => cell.seaLevel)))
			document.querySelector('[data-zyFind="sunriseTableNote"]')?.remove();
	}

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
			...yerushalmiRange(KosherZmanim.YerushalmiYomiCalculator.formatDafRange(new KosherZmanim.JewishDate(dateRange[0]), new KosherZmanim.JewishDate(dateRange[1])))
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

		/** @param {import('../../WebsiteCalendar.js').default} dayCal */
	const fancyCal = (dayCal) => dayCal.formatFancyDate({ dayLength: "long", monthLength: "short", ordinal: true }).en;
	/** @param {Temporal.PlainDate} date */
	const fancyDate = (date) => WebsiteLimudCalendar.formatFancyDate(date, { dayLength: "long", monthLength: "short", ordinal: true }).en;

	// Messages are built only for the month that actually matches (previously all were built every week)
	/** @type {{ month: number; message: () => string; endDay: number; startDay: number }[]} */
	const tachanunAffectedMonths = [
		/*{
			month: WebsiteLimudCalendar.KISLEV,
			message: () => (x.data.lang == "he" ? "אין אומרים תחנון בחנוכה" : "No Taḥanun said throughout Ḥanukka"),
			endDay: jCal.isKislevShort() ? 29 : 30,
			startDay: 17
		}, */
		/* {
			month: WebsiteLimudCalendar.TEVES,
			message: () => (x.data.lang == "he" ? "אין אומרים תחנון בחנוכה" : "No Taḥanun said throughout Ḥanukka"),
			endDay: jCal.isKislevShort() ? 3 : 2,
			startDay: 0
		}, */
		{
			month: WebsiteLimudCalendar.SHEVAT,
			message: () => {
				const tuBishvat = jCal.chainYomTovIndex(WebsiteLimudCalendar.TU_BESHVAT);
				return {
					"he": "אין אומרים תחנון בט״ו בשבט",
					"en": "No Taḥanun said on " + fancyCal(tuBishvat) + " (15<sup>th</sup> of Shevat)",
					"he-Latn": "No Taḥanun said on " + fancyCal(tuBishvat) + " (Tu Bi'Shevat)",
				}[x.data.lang];
			},
			endDay: 15,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.ADAR,
			message: () => {
				const purimKatan = jCal.chainYomTovIndex(WebsiteLimudCalendar.PURIM_KATAN);
				const katan = purimKatan.isJewishLeapYear() ? " Katan" : "";
				const en = "No Taḥanun said on "
					+ fancyCal(purimKatan) + ` (Purim${katan}) & `
					+ fancyDate(purimKatan.getDate().add({ days: 1 }))
					+ ` (Shushan Purim${katan})`;
				return {
					"he": "אין אומרים תחנון בפורים",
					"en": en,
					"he-Latn": en,
				}[x.data.lang];
			},
			endDay: 15,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.ADAR_II,
			message: () => {
				const purim = jCal.chainYomTovIndex(WebsiteLimudCalendar.PURIM);
				const en = "No Taḥanun said on "
					+ fancyCal(purim) + ` (${yomTovObj[WebsiteLimudCalendar.PURIM].en}) & `
					+ fancyDate(purim.getDate().add({ days: 1 }))
					+ ` (${yomTovObj[WebsiteLimudCalendar.SHUSHAN_PURIM].en})`;
				return {
					"he": "אין אומרים תחנון בפורים",
					"en": en,
					"he-Latn": en,
				}[x.data.lang];
			},
			endDay: 15,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.NISSAN,
			message: () => (x.data.lang == "he" ? "אין אומרים תחנון כל החודש" : "No Taḥanun said throughout the month"),
			endDay: 30,
			startDay: 0
		},
		{
			month: WebsiteLimudCalendar.IYAR,
			message: () => {
				const pesahSheni = jCal.chainYomTovIndex(WebsiteLimudCalendar.PESACH_SHENI);
				const en = "No Taḥanun said on "
					+ fancyCal(pesahSheni) + ` (${yomTovObj[pesahSheni.getYomTovIndex()].en}) & `
					+ fancyDate(pesahSheni.getDate().add({ days: 3 }))
					+ ` (${yomTovObj[WebsiteLimudCalendar.LAG_BAOMER].en})`;
				return {
					"he": "אין אומרים תחנון בפסח שני ולג בעומר",
					"en": en,
					"he-Latn": en,
				}[x.data.lang];
			},
			endDay: 18,
			startDay: 7
		},
		{
			month: WebsiteLimudCalendar.SIVAN,
			message: () => {
				const en = "No Taḥanun said from Rosh Ḥodesh until "
					+ fancyCal(jCal.chainJewishDate(jCal.getJewishYear(), WebsiteLimudCalendar.SIVAN, 12))
					+ ` (12<sup>th</sup> of Sivan)`;
				return {
					"he": "אין אומרים תחנון מראש חודש עד י״ב בסיון",
					"en": en,
					"he-Latn": en,
				}[x.data.lang];
			},
			endDay: 12,
			startDay: 0
		},
		{
			month: WebsiteLimudCalendar.AV,
			message: () => {
				const tishaBeav = fancyCal(jCal.chainYomTovIndex(WebsiteLimudCalendar.TISHA_BEAV));
				const tuBeav = fancyCal(jCal.chainYomTovIndex(WebsiteLimudCalendar.TU_BEAV));
				return {
					"en": "No Taḥanun said on " + tishaBeav + " (9<sup>th</sup> of Av) and " + tuBeav + " (15<sup>th</sup> of Av)",
					"he": "אין אומרים תחנון בתשעה באב ובט״ו באב",
					"he-Latn": "No Taḥanun said on " + tishaBeav + " (Tish'a B'Av) and " + tuBeav + " (Tu B'Av)",
				}[x.data.lang];
			},
			endDay: 15,
			startDay: 2,
		},
		{
			month: WebsiteLimudCalendar.ELUL,
			message: () => {
				const en = "No Taḥanun said on " + fancyCal(jCal.chainYomTovIndex(WebsiteLimudCalendar.EREV_ROSH_HASHANA)) + " (Erev Rosh Ha'Shana)";
				return {
					"he": "אין אומרים תחנון בערב ראש השנה",
					"en": en,
					"he-Latn": en,
				}[x.data.lang];
			},
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

		return restriction ? restriction.message() : null;
	}

	// Computed once; it was re-evaluated up to three times per week
	const tachanunMsg = checkTachanunRestriction(dateRange);

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
		if (x.data.lang == 'he') {
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
		moladListItem.appendChild(document.createTextNode("Molad: " + fmt(molad, dtFBLevana)))
		rHElems.specialList.appendChild(moladListItem);

		let erevHodesh = newMonthCal.getDate().withCalendar("hebrew").subtract({ days: 1 });
		if (erevHodesh.day == 30)
			erevHodesh = erevHodesh.subtract({ days: 1 });
		erevHodesh = erevHodesh.withCalendar("iso8601")

		const tikkunHatzotRange = [
			zc(erevHodesh.subtract({ days: 1 })).getSolarMidnight(),
			zc(erevHodesh).getAlotHashahar()
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
				rangeLi.textContent = `Permissible Range: ${fmt(tikkunHatzotRange[0], defaulTF)} - ${fmt(molad, defaulTF)}`;
				rHElems.specialList.appendChild(rangeLi);
			}
		}

		/* if (newMonthCal.getJewishMonth() == WebsiteLimudCalendar.TEVES) {
			const fullHallel = document.createElement("li");
			fullHallel.appendChild(document.createTextNode("הלל שלם"))
			rHElems.specialList.appendChild(fullHallel);
		} */

		const ulChaparatPesha = document.createElement("li");
		if (newMonthCal.tefilahRules().amidah.ulChaparatPesha) {
			ulChaparatPesha.appendChild(document.createTextNode("Ensure ולכפרת פשע is said during Mussaf"))
		} else {
			ulChaparatPesha.appendChild(document.createTextNode("Omit ולכפרת פשע during Mussaf"))
		}
		rHElems.specialList.appendChild(ulChaparatPesha);

		if (tachanunMsg) {
			rHElems.container.insertAdjacentHTML("beforeend", "<hr><div>" + tachanunMsg + "</div>")
		}

		return rHElems.container;
	}

	function handleSingleBL() {
		const blCal = jCal.chainJewishDate(jCal.getJewishYear(), jCal.getJewishMonth(), 15);

		const useEarlyTimes = blCal.isAssurBemelacha();
		const blTimes = {
			start: jCal.getTchilasZmanKidushLevana7Days().withTimeZone(geoLocation.getTimeZone()),
			endStretch: zc(blCal.getDate()).timeRange.current.sunrise,
			endIkar: zc(blCal.getDate()).getAlotHashahar(),
			endStrict: jCal.getSofZmanKidushLevanaBetweenMoldos().withTimeZone(geoLocation.getTimeZone()),
			endEarlyIkar: zc(blCal.getDate().subtract({ days: 1 })).getAlotHashahar(),
			endEarlyStretch: zc(blCal.getDate().subtract({ days: 1 })).timeRange.current.sunrise
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
				he: "ברכת הלבנה - חודש " + blCal.formatJewishMonth().he,
				en: "Moon-Blessing - Month of " + blCal.formatJewishMonth().en,
				"he-Latn": "Birkath Ha'Levana - Ḥodesh " + blCal.formatJewishMonth().en
			}[x.data.lang];

			const startTime = document.createElement("li");
			startTime.appendChild(document.createTextNode({
				"he": "תחילת: ",
				"en": "Beginning: ",
				"he-Latn": "Beginning: "
			}[x.data.lang] + fmt(blTimes.start, dtFBLevana)));

			blElems.blList.appendChild(startTime)

			if (jCal.getJewishMonth() == WebsiteLimudCalendar.AV) {
				startTime.classList.add("text-strike");

				const recommendedStart = document.createElement("li");
				recommendedStart.classList.add("rec")
				recommendedStart.appendChild(document.createTextNode({
					"he": "המלצה: ",
					"en": "Recommendation: ",
					"he-Latn": "Recommendation: "
				}[x.data.lang] + fmt(zc(jCal.chainYomTovIndex(WebsiteLimudCalendar.TISHA_BEAV).getDate()).getTzetHumra(), dtFBLevana)))

				blElems.blList.appendChild(recommendedStart)
			}

			const endTime = document.createElement("li");
			endTime.innerHTML = (x.data.lang == "he" ? 'סוף: ' : "End: ")
				+ fmt(blTimes.endIkar, dtFBLevana)
				+ ` <s style="font-size: .8em">(${fmt(blTimes.endStretch, defaulTF)})</s>`

			blElems.blList.appendChild(endTime);

			const endStrict = document.createElement("li");
			endStrict.classList.add("rec")
			const endStrictLabel = Temporal.ZonedDateTime.compare(blTimes.endStrict, blTimes.endIkar) > 0 ? "Rema: " : "Strict: ";
			endStrict.appendChild(document.createTextNode(
				(x.data.lang == "he" ? "סוף " : endStrictLabel) + fmt(blTimes.endStrict, dtFBLevana)
			));

			if (useEarlyTimes) {
				const earlyEndLabel = x.data.lang == "he" ? "סוף מוקדם: " : "Early End: ";
				const earlyEndTime = fmt(blTimes.endEarlyIkar, dtFBLevana)
					+ ` <s style="font-size: .8em">(${fmt(blTimes.endStretch, defaulTF)})</s>`;

				if (Temporal.ZonedDateTime.compare(blTimes.endStrict, blTimes.endEarlyIkar) < 0) {
					// Rema is earlier than early time - append to endTime with <br>
					const strikeSpan = document.createElement("div");
					strikeSpan.className = "text-strike";
					strikeSpan.innerHTML = endTime.innerHTML;
					endTime.innerHTML = "";
					endTime.appendChild(strikeSpan);
					endTime.insertAdjacentHTML('beforeend', `${earlyEndLabel}${earlyEndTime}`);
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

			if (tachanunMsg) {
				blElems.blList.insertAdjacentElement('afterend', document.createElement("hr"))
			}
		} else {
			blElems.blList.remove()
		}

		if (tachanunMsg) {
			blElems.title.innerHTML = {
				he: "הלכות תפילה לחודש " + blCal.formatJewishMonth().he,
				en: "Month of " + blCal.formatJewishMonth().en + " - Laws of Prayer",
				"he-Latn": "Ḥodesh " + blCal.formatJewishMonth().en + " - Laws of Prayer"
			}[x.data.lang];
			blElems.container.insertAdjacentHTML("beforeend", "<div>" + tachanunMsg + "</div>")
		}

		if (blElems.title.innerHTML !== "")
			return blElems.container;
	}

	function handleTekufa(beforeHatzotOnly = false) {
		if (initTekuf.equals(zmanCalc.nextTekufa(x.data.tekufaMidpoint !== "hatzoth").withTimeZone(geoLocation.getTimeZone())))
			return;

		if (beforeHatzotOnly && Temporal.ZonedDateTime.compare(initTekuf, zc(initTekuf.toPlainDate()).getHatzoth()) != -1)
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

		tekufaTitle.insertAdjacentHTML('beforeend', " - " + tekufaDate);
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
			tekufaTimingDiv.insertAdjacentHTML('beforeend', {
				"en": "Switch to ברך עלינו " + "at the night prayer of ",
				"he": "תחליף לברך עלינו " + "בתפילת ערבית של ",
				"he-Latn": "Switch to ברך עלינו " + "at Tefilat Arvit of "
			}[x.data.lang] + WebsiteLimudCalendar.formatFancyDate(initTekuf.toPlainDate().add({ days: 59 }), {
				dayLength: 'long',
				monthLength: 'short',
				ordinal: true
			}).en);
		}

		tekufaContainer.appendChild(tekufaTitle);
		tekufaContainer.appendChild(tekufaTimingDiv);

		return tekufaContainer;
	}

	if (dateRangeHeb[1].month !== 1) {
		if (isRoshHodeshWeek) {
			whiteTekufotMonth.appendChild(handleRoshHodesh())
		} else {
			const tefilaContainer = handleSingleBL();
			if (tefilaContainer)
				whiteTekufotMonth.appendChild(tefilaContainer);
		}
	}

	function handleSecondSide() {
		const templateCard = document.getElementsByClassName("shabbat-card")[0];
		if (highlightZmanim.some(elem => 'ytI' in elem && elem.ytI == WebsiteLimudCalendar.CHANUKAH))
			templateCard.parentElement.classList.add("hasChanuka");

		for (const highlight of highlightZmanim) {
			if ('title' in highlight && highlight.title.startsWith("Sefirat Ha'Omer")) {
				templateCard.parentElement.classList.add("hasOmer");
				const multiSefira = highlightZmanim.filter(high => 'title' in high && high.title.startsWith("Sefirat Ha'Omer"))

				const omerContainer = document.createElement("div");
				const omerTitle = document.createElement("h5");
				omerTitle.appendChild(document.createTextNode(
					highlight.title
						.replace(multiSefira.length == 2 && highlight == multiSefira[0] ? "Week" : "@", "Remaining of Week")
				));
				omerContainer.appendChild(omerTitle);

				let omerTimingDiv = document.createElement("p");
				omerTimingDiv.classList.add('omerDesc');
				omerContainer.appendChild(omerTimingDiv);
				// Built as a string and written once per paragraph instead of innerHTML += per line
				let omerHTML = "";

				for (const [day, zemanCont] of highlight.datesToZman) {
					const omerCount = omerStartDate.until(day.add({ days: 1 })).total('day');

					if (multiSefira.length == 2
						&& ((highlight == multiSefira[0]
							&& Temporal.PlainDate.compare(dateRange[0], day.subtract({ days: 1 })) > 0)
							|| (highlight == multiSefira[1]
								&& Temporal.PlainDate.compare(dateRange[1], day) == -1
								&& (omerCount % 7) == 0
							)))
						continue;

					omerHTML +=
						WebsiteLimudCalendar.formatFancyDate(day.add({ days: 1 }), { dayLength: "short", "monthLength": "short", ordinal: true }).en
						+ " "
						+ `<span class='fs-sm'>(Night of ${day.toLocaleString(defaulTF[0], { weekday: 'narrow', day: "numeric" })}`
						+ (Temporal.PlainDate.compare(dateRange[1], day) >= 0 ? ` - ${fmt(zemanCont.omerCount, defaulTF)}` : '')
						+ ')</span>: '
						+ getOrdinal(omerCount, 'html') + ((Temporal.PlainDate.compare(dateRange[1], day) >= 0) ? " day" : '')
						+ " of the Omer";

					if (omerCount >= 7) {
						let subOmerInfo = (Temporal.PlainDate.compare(dateRange[1], day) >= 0) ?
							Math.floor(omerCount / 7) + ' week' + (Math.floor(omerCount / 7) > 1 ? 's' : '')
							+ (omerCount % 7 ? ' + ' + omerCount % 7 + ' day' + (omerCount % 7 ? 's' : '') : '')
							: (omerCount % 7 ? getOrdinal(omerCount % 7, 'html') + " day" : '');

						omerHTML += ' <span class="fs-sm">(' + subOmerInfo + ')</span>';
					}

					if (Temporal.PlainDate.compare(dateRange[1], day) == 0) {
						omerTimingDiv.innerHTML = omerHTML;
						omerHTML = "";
						omerContainer.appendChild(document.createElement("hr"));
						omerTimingDiv = document.createElement("p");
						omerTimingDiv.classList.add('omerDesc');
						omerContainer.appendChild(omerTimingDiv);
					} else {
						omerHTML += "<br>"
					}
				}
				omerTimingDiv.innerHTML = omerHTML;

				whiteTekufotMonth.appendChild(omerContainer)
				continue;

			}
			/** @type {HTMLDivElement} */
			const highlightCard = templateCard.cloneNode(true);

			highlightCard.getElementsByClassName("extras")[0].innerHTML = highlight.extra || "";
			highlightCard.getElementsByClassName("topNotice")[0].innerHTML = highlight.topNotice || "";
			highlightCard.getElementsByClassName("bottomNotice")[0].innerHTML = highlight.bottomNotice || "";

			highlightCard.getElementsByClassName("parshaName")[0].innerHTML = highlight.title;

			if ('ytI' in highlight && [
				WebsiteLimudCalendar.SEVENTEEN_OF_TAMMUZ,
				WebsiteLimudCalendar.TISHA_BEAV,
				WebsiteLimudCalendar.FAST_OF_GEDALYAH,
				WebsiteLimudCalendar.FAST_OF_ESTHER,
				WebsiteLimudCalendar.TENTH_OF_TEVES
			].includes(highlight.ytI))
				highlightCard.classList.add('fastCard')

			const cardDateRange = [...highlight.datesToZman.keys()].sort(Temporal.PlainDate.compare);
			const dateElem = highlightCard.getElementsByClassName("cardDate")[0];
			if (cardDateRange.length == 1) {
				dateElem.innerHTML = WebsiteLimudCalendar.formatFancyDate(cardDateRange[0], { dayLength: "short", monthLength: "short", ordinal: true })["en"]
			} else if (x.data.lang == 'he'
				&& cardDateRange.length == 2
				&& cardDateRange[0].until(cardDateRange[1]).total('days') == 1
				&& Object.values(highlight.datesToZman.get(cardDateRange[0])).length == 1
				&& 'candleLighting' in highlight.datesToZman.get(cardDateRange[0])) {
				dateElem.innerHTML =
					hNum.formatHebrewNumber(cardDateRange[1].withCalendar("hebrew").day)
					+ " " + cardDateRange[1].toLocaleString('he-u-ca-hebrew', { month: 'long' })

				if (!(highlight.title && highlight.title.startsWith("שבת")))
					dateElem.innerHTML = cardDateRange[1].toLocaleString('he-u-ca-hebrew', { weekday: 'long' }) + ", " + dateElem.innerHTML
			} else if (true || !(highlight.title && highlight.title.startsWith("שבת"))) {
				let dateText = "";
				dateText += WebsiteLimudCalendar.formatFancyDate(cardDateRange[0], { dayLength: "short", monthLength: "short", ordinal: true })[x.data.lang]
				dateText += " - ";
				dateText += WebsiteLimudCalendar.formatFancyDate(cardDateRange[cardDateRange.length - 1], { dayLength: "short", monthLength: "short", ordinal: true })[x.data.lang]
				dateElem.innerHTML = dateText;
			}

			const timesBox = highlightCard.getElementsByClassName("mainTimes")[0];

			const allTimes = highlight.datesToZman.values();
			const allCandleLightings = [...highlight.datesToZman.values()]
				.filter(zmanMap => 'candleLighting' in zmanMap);
			let candleLightIndex = 1;
			for (const zmanOfDay of allTimes) {
				for (const [zmanName, zmanTime] of Object.entries(zmanOfDay)) {
					// Sunrise isn't averaged across locations: the sunrise table lists each one's
					if (zmanName == 'netz' && multiLocation) {
						if (!x.data.israel || allCandleLightings.length > 1)
							timesBox.appendChild(document.createElement("hr"));
						continue;
					}

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

							if ('ytI' in highlight && highlight.ytI == WebsiteLimudCalendar.CHANUKAH) {
								innerRow[0] = `<img src="/assets/images/hanukah/menorah-${candleLightIndex++}.png">`
							} else if (allCandleLightings.length > 1) {
								if (x.data.lang !== 'he')
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

					// Stable tuples (instead of a fresh options object per row) so the formatter cache hits
					innerRow[0] += " " + fmt(zmanTime, zmanTime.second ? sunriseTF : defaulTF);
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

			timesBox.setAttribute('data-item-count', timesBox.childElementCount.toString())


			//timesBox.innerHTML = JSON.stringify([...highlight.datesToZman.entries()]);

			templateCard.parentElement.appendChild(highlightCard)
		}

		templateCard.parentElement.setAttribute('data-scard-amount', highlightZmanim.length.toString())
		templateCard.remove()
	}

	const tekufaContainer = handleTekufa(false);
	if (tekufaContainer)
		whiteTekufotMonth.appendChild(tekufaContainer);

	handleSecondSide()
	whiteTekufotMonth.setAttribute('data-events', whiteTekufotMonth.childElementCount.toString())
	const startsMonth = dateRangeHeb[0].day == 1 || dateRangeHeb[0].month !== dateRangeHeb[1].month;
	return {
		week: x.data.week,
		sunriseOffsets,
		monthGridDays,
		htmlContent: [...document.getElementsByClassName("page")].map(elem => elem.outerHTML),
		addedZemanim,
		monthPrefix: startsMonth ? (new WebsiteLimudCalendar(dateRangeHeb[1])).getJewishMonth() : null,
		// Hebrew year of that month, so year-specific prefix pages (the moon pages) find the right start
		monthPrefixYear: startsMonth ? dateRangeHeb[1].year : null
	}
}

// Only register when running as a worker (there is no window there)
if (typeof window === 'undefined') {
	addEventListener('message', async (/** @type {MessageEvent<singlePageParams | RefractionInit | WorkerInit>} */ message) => {
		const data = message.data;

		// Both init messages are handled before any await, so they are in place before the first week runs
		if ('type' in data) {
			if (data.type === 'refraction') {
				refractions[data.index ?? 0] = {
					provider: providerFromSnapshot(data.tableJson ? JSON.parse(data.tableJson) : data.table, data.normals),
					horizon: data.horizon,
					haze: data.haze ?? null
				};
				locationConfigs = [];
			} else if (data.type === 'init') {
				initWorker(data);
			}
			return;
		}

		try {
			await loadWorkerPolyfills();
			postMessage(messageHandler({ data: { ...workerInit, ...data } }));
		} catch (err) {
			// The main thread reports this with the week number instead of a bare ErrorEvent
			console.error(err);
			postMessage({ week: data.week, error: err instanceof Error ? (err.stack || err.message) : String(err) });
		}
	})
	addEventListener('error', (e) => console.error(e));
}

/**
 * @template {Temporal.ZonedDateTime | Temporal.PlainDate} T
 * @param {T} start
 * @param {T} middle
 * @param {T} end
 * @param {boolean} [inclusive=true]
 * @returns {boolean}
 */
function rangeTemporal(start, middle, end, inclusive = true) {
	const acceptedValues = [1];
	if (inclusive)
		acceptedValues.push(0);

	const compare = start instanceof Temporal.ZonedDateTime
		? Temporal.ZonedDateTime.compare
		: Temporal.PlainDate.compare;

	return acceptedValues.includes(compare(/** @type {any} */ (middle), /** @type {any} */ (start)))
		&& acceptedValues.includes(compare(/** @type {any} */ (end), /** @type {any} */ (middle)));
}

/**
 * @param {number} n
 * @param {'none'|'html'|'svg'} formating
 */
function getOrdinal(n, formating = 'none') {
	return n.toString()
		+ (formating == 'html' ? "<sup>" : formating == 'svg' ? '<tspan baseline-shift="40%" font-size="0.55em">' : "")
		+ { e: "st", o: "nd", w: "rd", h: "th" }[ordinalRules.select(n)[2]]
		+ (formating == 'html' ? "</sup>" : formating == 'svg' ? '</tspan>' : "")
}

/**
 * @param {number} num
 */
function romanize(num) {
	if (isNaN(num))
		return NaN;
	var digits = String(+num).split(""),
		key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
			"", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
			"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
		roman = "",
		i = 3;
	while (i--)
		roman = (key[+digits.pop() + (i * 10)] || "") + roman;
	return Array(+digits.join("") + 1).join("M") + roman;
}

/**
 * formatDafRange's result as the argument pair formatDafYerushalmiYomiRange takes
 * @param {{ firstDaf: any, lastDaf: any }} range
 * @returns {[any, any]}
 */
function yerushalmiRange(range) {
	return [range.firstDaf, range.lastDaf];
}

export default messageHandler;
