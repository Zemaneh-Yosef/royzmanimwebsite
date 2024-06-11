//@ts-check

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { OhrHachaimZmanim, AmudehHoraahZmanim } from "../ROYZmanim.js";
import { HebrewNumberFormatter, daysForLocale, getOrdinal, monthForLocale } from "../WebsiteCalendar.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { settings } from "../settings/handler.js";
import n2wordsOrdinal from "../misc/n2wordsOrdinal.js";
import { Previewer } from "../../libraries/paged.js"

const printParam = new URLSearchParams(window.location.search);
if (printParam.has('lessContrast')) {
	document.documentElement.style.setProperty('--bs-body-bg', 'snow');
	document.documentElement.style.setProperty('--bs-body-color', '#1A0033');
}
const calcMonthStart = (printParam.has('currentMonth') ?
	KosherZmanim.Temporal.Now.plainDateISO().withCalendar(settings.language() == 'en' ? 'iso8601' : 'hebrew').month
	: 1
);

const hNum = new HebrewNumberFormatter();

if (isNaN(settings.location.lat()) && isNaN(settings.location.long())) {
	window.location.href = "/"
}

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())
const geoLocation = new KosherZmanim.GeoLocation(...glArgs);

const jCal = new WebsiteLimudCalendar();
jCal.setDate(jCal.getDate().with({ day: 1, month: calcMonthStart }))
jCal.setInIsrael((geoLocation.getLocationName() || "").toLowerCase().includes('israel'));
const zmanCalc = (
	!jCal.getInIsrael() && settings.calendarToggle.hourCalculators() == "degrees"
		? new AmudehHoraahZmanim(geoLocation)
		: new OhrHachaimZmanim(geoLocation, true)
	);
zmanCalc.configSettings(settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha())
zmanCalc.setDate(jCal.getDate())

const listAllShitot = Array.from(document.querySelectorAll('[data-zyData]')).map(elem => elem.getAttribute('data-zyData'))
/** @type {HTMLElement} */
// @ts-ignore
const baseTable = document.getElementsByClassName('tableGrid')[0];
baseTable.style.gridTemplateColumns = Array.from(document.getElementsByClassName('tableHeader'))
	.filter(elem => !elem.hasAttribute('data-zyHeaderContainer'))
	.map((/** @type {HTMLElement} */elem) => (elem.style.gridRow == '1 / span 2' ? '1fr' : '.75fr'))
	.join(" ");

/** @type {false|KosherZmanim.Temporal.ZonedDateTime[]} */
let availableVS = false;
if (typeof localStorage !== "undefined" && localStorage.getItem('ctNetz') && isValidJSON(localStorage.getItem('ctNetz'))) {
	const ctNetz = JSON.parse(localStorage.getItem('ctNetz'))
	if (ctNetz.lat == zmanCalc.coreZC.getGeoLocation().getLatitude()
	 && ctNetz.lng == zmanCalc.coreZC.getGeoLocation().getLongitude())
		availableVS = ctNetz.times
			.map((/** @type {number} */ value) => KosherZmanim.Temporal.Instant
				.fromEpochSeconds(value)
				.toZonedDateTimeISO(zmanCalc.coreZC.getGeoLocation().getTimeZone())
			)
}

// Cloned WebsiteCalendar.getYomTov() for two reasons
// 1. I wanted shorter titles since the PDF is already aiming to be small
// 2. We will soon delete the function as part of our gradual move to HTML
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

const flexWorkAround = document.createElement("span");
flexWorkAround.classList.add("flexElemWorkaround")

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const defaulTF = [settings.language() == 'hb' ? 'he' : 'en', {
	hourCycle: 'h24',
	hour: 'numeric',
	minute: '2-digit'
}];

function handleShita (/** @type {string} */ shita) {
	const omerSpan = document.createElement("span");
	omerSpan.classList.add("omerText");
	omerSpan.innerHTML = getOrdinal(jCal.tomorrow().getDayOfOmer(), true) + " of omer";

	const div = document.createElement('div');
	div.classList.add('tableCell')

	/**
	 * @param {KosherZmanim.Temporal.ZonedDateTime} zDT
	 */
	function renderZmanInDiv (zDT, dtF=defaulTF) {
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

		timeElem.appendChild(document.createTextNode(zDT.toLocaleString(...dtF)));
		div.appendChild(timeElem)
	}

	switch (shita) {
		case 'special':
			div.classList.add("specialDay");

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
				}[settings.language()]));

				div.appendChild(rHelem);
				div.style.fontWeight = "bold";
			}

			if (jCal.tomorrow().getDayOfChanukah() !== -1) {
				const hanTitleElem = flexWorkAround.cloneNode(true);
				hanTitleElem.appendChild(document.createTextNode({
					"hb": (jCal.getDayOfChanukah() == -1 ? "ערב " : "") + "חנוכה",
					"en": "Ḥanukah" + (jCal.getDayOfChanukah() == -1 ? " Eve" : ""),
					"en-et": (jCal.getDayOfChanukah() == -1 ? "Erev " : "") + "Ḥanukah"
				}[settings.language()]));
				div.appendChild(hanTitleElem);

				const hanNightElem = flexWorkAround.cloneNode(true);
				// @ts-ignore
				hanNightElem.classList.add("omerText");
				// @ts-ignore
				hanNightElem.innerHTML = "(" + {
					"hb": "ליל " + n2wordsOrdinal[jCal.tomorrow().getDayOfChanukah()],
					"en": getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night",
					"en-et": getOrdinal(jCal.tomorrow().getDayOfChanukah(), true) + " night"
				}[settings.language()] + ")";
				div.appendChild(hanNightElem);

				div.style.fontWeight = "bold";
			} else if (jCal.getDayOfChanukah() == 8) {
				const hanTitleElem = flexWorkAround.cloneNode(true);
				hanTitleElem.appendChild(document.createTextNode({
					"hb": "זאת חנוכה",
					"en": "Ḥanukah Day",
					"en-et": "Yom Ḥanukah"
				}[settings.language()]));
				div.appendChild(hanTitleElem);
			}

			if (jCal.isBirkasHachamah()) {
				const rHelem = flexWorkAround.cloneNode(true);
				rHelem.appendChild(document.createTextNode({
					'hb': "ברכת החמה",
					"en-et": "Birkath Haḥama",
					'en': "Blessing of the Sun"
				}[settings.language()]));

				div.appendChild(rHelem);
				div.style.fontWeight = "bold";
			}

			if (jCal.getYomTovIndex() in yomTovObj) {
				const yomTovElem = flexWorkAround.cloneNode(true);
				yomTovElem.appendChild(document.createTextNode(yomTovObj[jCal.getYomTovIndex()][settings.language()]))
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
						}[settings.language()]));
						break;
					case WebsiteLimudCalendar.FAST_OF_GEDALYAH:
						taanitElem.appendChild(document.createTextNode({
							'hb': "צום גדליה",
							"en-et": "Fast of Gedalia",
							'en': "Fast of Gedalia"
						}[settings.language()]));
						break;
					case WebsiteLimudCalendar.YOM_KIPPUR:
						taanitElem.appendChild(document.createTextNode({
							"hb": "יום כיפור",
							"en": "Yom Kippur",
							"en-et": "Yom Kippur"
						}[settings.language()]));
					default:
						taanitElem.appendChild(document.createTextNode({
							'hb': "צום",
							"en-et": "Fast",
							'en': "Fast"
						}[settings.language()]));
				}

				div.appendChild(taanitElem);
				div.style.fontWeight = "bold";
			}

			break;
		case 'date':
			let primaryDate = flexWorkAround.cloneNode(true);
			let secondaryDate = flexWorkAround.cloneNode(true);
			switch (settings.language()) {
				case 'en':
					primaryDate.appendChild(document.createTextNode(
						jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
						jCal.getDate().toLocaleString('en', { day: 'numeric' })
					));
					secondaryDate.appendChild(document.createTextNode(
						hNum.formatHebrewNumber(jCal.getJewishDayOfMonth()) + " " +
						jCal.getDate().toLocaleString('he-u-ca-hebrew', {month: 'long'})
					));
					break;
				case 'en-et':
					primaryDate.appendChild(document.createTextNode(
						jCal.getDate().toLocaleString('en', { weekday: "short" }) + ". " +
						this.getDate().toLocaleString('en-u-ca-hebrew', {month: 'long', day: "numeric"})
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
			div.appendChild(primaryDate);
			div.appendChild(secondaryDate);

			if (jCal.isRoshChodesh() || jCal.getYomTovIndex() in yomTovObj || jCal.isBirkasHachamah())
				div.style.fontWeight = "bold";

			break;
		case 'candleLighting':
			if (jCal.hasCandleLighting()) {
				if (jCal.getDayOfWeek() === 6 || !jCal.isAssurBemelacha())
					renderZmanInDiv(zmanCalc.getCandleLighting());
				else if (jCal.getDayOfWeek() === 7)
					renderZmanInDiv(zmanCalc.getTzaitShabbath());
				else
					return false;
			}
			break;
		case 'getTzaitShabbath':
			if (!jCal.hasCandleLighting() && jCal.isAssurBemelacha()) {
				renderZmanInDiv(zmanCalc.getTzaitShabbath());

				if (jCal.tomorrow().getDayOfOmer() !== -1) {
					div.appendChild(omerSpan);
				}
			}
			break;
		case 'getTzait':
			if (!jCal.isAssurBemelacha()) {
				renderZmanInDiv(zmanCalc.getTzait())

				if (jCal.tomorrow().getDayOfOmer() !== -1) {
					div.appendChild(omerSpan);
				}

				if (jCal.tomorrow().getDayOfChanukah() !== -1) {
					const hanukahSpan = flexWorkAround.cloneNode(true);
					// @ts-ignore
					hanukahSpan.classList.add("omerText");
					hanukahSpan.appendChild(document.createTextNode(
						"Light before " + zmanCalc.getTzait().add({ minutes: 30 }).toLocaleString(...defaulTF)
					));

					div.appendChild(hanukahSpan);
				}
			}
			break;
		case 'getTzaitLechumra':
			let appear = false;
			if (zmanCalc instanceof OhrHachaimZmanim) {
				if (jCal.isTaanis() && !jCal.isYomKippur()) {
					appear = true;
					renderZmanInDiv(zmanCalc.getTzait().add({ minutes: 20 }))
					div.style.fontWeight = "bold";
				}
			} else {
				appear = true;
				renderZmanInDiv(zmanCalc.getTzaitLechumra())

				if (jCal.isTaanis() && !jCal.isYomKippur()) {
					div.style.fontWeight = "bold";
				}
			}

			if (appear && jCal.hasCandleLighting() && jCal.getDayOfWeek() !== 6 && jCal.isAssurBemelacha() && jCal.getDayOfWeek() !== 7) {
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
			if (availableVS)
				seeSun = availableVS.find(zDT => Math.abs(zmanCalc.getNetz().until(zDT).total('minutes')) <= 6)

			if (seeSun)
				renderZmanInDiv(seeSun, [defaulTF[0], {...defaulTF[1], second: '2-digit'}])
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
				}[settings.language()]));

				div.appendChild(hanukahSpan);
			}
			break;
		default:
			// @ts-ignore
			renderZmanInDiv(zmanCalc[shita]())
	}

	return div;
}

const locationElem = document.querySelector("[data-zyLocationText]");
locationElem.appendChild(document.createTextNode(geoLocation.getLocationName()));

const footer = document.createElement("div");
footer.classList.add("zyCalFooter");

const locationSection = document.createElement("div");
locationSection.classList.add("sides")
locationSection.appendChild(locationElem);
locationSection.appendChild(document.createTextNode(`(${geoLocation.getLatitude()}, ${geoLocation.getLongitude()}${
	zmanCalc instanceof OhrHachaimZmanim ? ", ↑" + geoLocation.getElevation : ""
})`));
locationSection.appendChild(document.createElement("br"))
locationSection.appendChild(document.createTextNode("Current Calendar: " + (zmanCalc instanceof OhrHachaimZmanim ? "Ohr Hachaim" : "Amudeh Hora'ah")))
locationSection.appendChild(document.createElement("br"))
locationSection.appendChild(document.createTextNode("Current Timezone: " + geoLocation.getTimeZone()))
footer.appendChild(locationSection)

footer.appendChild(document.querySelector('[data-zyBranding]').cloneNode(true));

const rightSide = document.createElement("div");
rightSide.classList.add("sides", "rightside")
footer.appendChild(rightSide);

let plainDateForLoop = jCal.getDate().withCalendar(settings.language() == 'en' ? 'iso8601' : 'hebrew').with({ month: calcMonthStart, day: 1 })
for (let mIndex = plainDateForLoop.month; mIndex <= plainDateForLoop.monthsInYear; mIndex++) {
	plainDateForLoop = plainDateForLoop.with({ month: mIndex });
	jCal.setDate(plainDateForLoop.withCalendar("iso8601"));

	/** @type {Element} */
	// @ts-ignore
	const tableFirstHalf = baseTable.cloneNode(true);
	tableFirstHalf.querySelector('[data-zyData="date"]')
		.appendChild(document.createTextNode(
			plainDateForLoop
				.toLocaleString(
					settings.language() == "en" ? 'en' : settings.language().replace('hb', 'he') + '-u-ca-hebrew',
					{ month: "long" }
				)
		));

	const initTekuf = zmanCalc.nextTekufa(zmanCalc instanceof OhrHachaimZmanim);
	const halfDaysInMonth = plainDateForLoop.daysInMonth; //Math.floor(plainDateForLoop.daysInMonth / 2);
	let hamesDate = null;
	/** @type {Map<number, number>} */
	const jewishMonthsInSecMonth = new Map();
	for (let index = 1; index <= halfDaysInMonth; index++) {
		plainDateForLoop = plainDateForLoop.with({ day: index })
		jCal.setDate(plainDateForLoop.withCalendar("iso8601"))
		zmanCalc.setDate(plainDateForLoop.withCalendar("iso8601"))

		if (jCal.getYomTovIndex() == WebsiteLimudCalendar.EREV_PESACH)
			hamesDate = jCal.getDate();

		const counterIncrease = (jewishMonthsInSecMonth.has(jCal.getJewishMonth())
			? jewishMonthsInSecMonth.get(jCal.getJewishMonth()) + 1
			: 1);
		jewishMonthsInSecMonth.set(jCal.getJewishMonth(), counterIncrease);

		for (const shita of listAllShitot) {
			const cell = handleShita(shita);

			if (!cell)
				continue;

			if (index !== halfDaysInMonth)
				cell.style.borderBottom = '1px solid #21252922';

			tableFirstHalf.appendChild(cell)
		}
	}
	baseTable.parentElement.appendChild(tableFirstHalf);

	jCal.getDate().withCalendar("hebrew");

	/** @type {HTMLDivElement} */
	// @ts-ignore
	const thisMonthFooter = footer.cloneNode(true);
	if (!initTekuf.equals(zmanCalc.nextTekufa(zmanCalc instanceof OhrHachaimZmanim).withTimeZone(geoLocation.getTimeZone()))) {
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
		}[settings.language()]));

		let tekufaDate;
		switch (settings.language()) {
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
		}[settings.language()] + [
			initTekuf.round("minute").subtract({ minutes: 30 }).toLocaleString(...defaulTF),
			initTekuf.round("minute").add({ minutes: 30 }).toLocaleString(...defaulTF),
		].join('-')));

		tekufaContainer.appendChild(tekufaTitle);
		tekufaContainer.appendChild(tekufaTimingDiv);
		thisMonthFooter.lastElementChild.appendChild(tekufaContainer);
	}
	if (hamesDate) {
		const hamesName = `${daysForLocale('en')[hamesDate.dayOfWeek]}, ${monthForLocale('en')[hamesDate.month]} ${getOrdinal(hamesDate.day, true)}`;
		const hametzContainer = document.createElement("div");
		const hametzTitle = document.createElement("h5");
		hametzTitle.innerHTML = {
			hb: "ערב פסח",
			en: "Pesaḥ Eve - " + hamesName,
			"en-et": "Erev Pesaḥ - " + hamesName
		}[settings.language()];

		const hametzTiming = document.createElement("p");
		hametzTiming.appendChild(document.createTextNode({
			"hb": "סןף זמן אחילת חמץ: ",
			"en": "Stop eating Hametz by ",
			"en-et": "Stop eating Hametz by "
		}[settings.language()] + zmanCalc.chainDate(hamesDate).getSofZmanAchilathHametz().toLocaleString(...defaulTF)));
		hametzTiming.appendChild(document.createElement("br"));
		hametzTiming.appendChild(document.createTextNode({
			"hb": "זמן ביעור חמץ עד ",
			"en": "Burn Ḥametz by ",
			"en-et": "Burn Ḥametz by "
		}[settings.language()] + zmanCalc.chainDate(hamesDate).getSofZmanBiurHametz().toLocaleString(...defaulTF)));

		hametzContainer.appendChild(hametzTitle);
		hametzContainer.appendChild(hametzTiming);
		thisMonthFooter.lastElementChild.appendChild(hametzContainer);
	}

	/** @type {[locales?: string | string[], options?: Intl.DateTimeFormatOptions]} */
	const dtFBLevana = [settings.language() == 'hb' ? 'he' : 'en', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hourCycle: settings.timeFormat(),
		hour: 'numeric',
		minute: '2-digit'
	}]

	const jMonthForBLevana = [...jewishMonthsInSecMonth.entries()].sort((a, b) => b[1] - a[1])[0][0]
	const jCalBMoon = jCal.clone();
	jCalBMoon.setJewishMonth(jMonthForBLevana);
	
	const bLContain = document.createElement("div");
	const bLTitl = document.createElement("h5");
	bLTitl.innerHTML = {
		hb: "ברכת הלבנה - חדש " + jCalBMoon.formatJewishMonth().he,
		en: "Moon-Blessing - Month of " + jCalBMoon.formatJewishMonth().en,
		"en-et": "Birkat Halevana - Month of " + jCalBMoon.formatJewishMonth().en
	}[settings.language()];

	const bLTimes = document.createElement("p");
	bLTimes.appendChild(document.createTextNode({
		"hb": "תחילת: ",
		"en": "Beginning: ",
		"en-et": "Beginning: "
	}[settings.language()] + jCalBMoon.getTchilasZmanKidushLevana7Days().toLocaleString(...dtFBLevana)));
	bLTimes.appendChild(document.createElement("br"));
	bLTimes.appendChild(document.createTextNode({
		"hb": 'סוף (רמ"א): ',
		"en": 'End (Rama): ',
		"en-et": "End (Rama): "
	}[settings.language()] + jCalBMoon.getSofZmanKidushLevanaBetweenMoldos().toLocaleString(...dtFBLevana)));

	bLContain.appendChild(bLTitl);
	bLContain.appendChild(bLTimes);
	thisMonthFooter.lastElementChild.appendChild(bLContain);

	baseTable.parentElement.appendChild(thisMonthFooter);

	//baseTable.parentElement.appendChild(header.parentElement.cloneNode(true))
	/** @type {Element} */
	// @ts-ignore
	/* const tableSecondHalf = baseTable.cloneNode(true);
	tableSecondHalf.querySelector('[data-zyData="date"]')
		.appendChild(document.createTextNode(
			plainDateForLoop
				.toLocaleString(
					settings.language() == "en" ? 'en' : settings.language().replace('hb', 'he') + '-u-ca-hebrew',
					{ month: "long" }
				)
		))

	const lastDayOfMonth = plainDateForLoop.daysInMonth;
	for (let index = Math.ceil(plainDateForLoop.daysInMonth / 2); index <= lastDayOfMonth; index++) {
		plainDateForLoop = plainDateForLoop.with({ day: index })
		jCal.setDate(plainDateForLoop.withCalendar("iso8601"))
		zmanCalc.setDate(plainDateForLoop.withCalendar("iso8601"))

		for (const shita of listAllShitot) {
			const cell = handleShita(shita);

			if (!cell)
				continue;

			if (index !== lastDayOfMonth)
				cell.style.borderBottom = '1px solid #21252922';

			tableSecondHalf.appendChild(cell)
		}
	}
	baseTable.parentElement.appendChild(tableSecondHalf); */
}

locationElem.remove();
document.querySelector('[data-zyBranding]').remove();
baseTable.remove();

document.documentElement.setAttribute('forceLight', '')
document.documentElement.removeAttribute('data-bs-theme');

/** @type {HTMLElement} */
const finalExplanation = document.querySelector('[data-printFind]');

let paged = new Previewer();
let flow = await paged.preview(finalExplanation, ["/assets/css/footnotes.css"], finalExplanation.parentElement);
console.log("Rendered", flow.total, "pages.");

finalExplanation.style.display = "none";

const elems = [
	'pagedjs_margin-top-left-corner-holder',
	'pagedjs_margin-top',
	'pagedjs_margin-top-right-corner-holder',
	'pagedjs_margin-right',
	'pagedjs_margin-left',
	'pagedjs_margin-bottom-left-corner-holder',
	'pagedjs_margin-bottom',
	'pagedjs_margin-bottom-right-corner-holder',
	'pagedjs_pagebox'
]
	.map(className => Array.from(document.getElementsByClassName(className)))
	.flat();

['top', 'right', 'left', 'bottom']
	.forEach(dir => elems.forEach((/** @type {HTMLElement} */elem) => elem.style.setProperty(`--pagedjs-margin-${dir}`, '0')));

Array.from(document.querySelectorAll('.pagedjs_pagebox > .pagedjs_area'))
	.forEach((/** @type {HTMLElement} */pageArea) => {
		pageArea.style.gridRow = 'unset';
		[...pageArea.children]
			.filter(child => child.classList.contains('pagedjs_page_content'))
			.forEach((/** @type {HTMLElement} */pageContent) => {
				pageContent.style.columnWidth = 'unset';
				[...pageContent.children]
					.filter(child => child.nodeName == "DIV")
					.forEach((/** @type {HTMLElement} */pageContentChild) => pageContentChild.style.height = 'unset')
			})
	})

window.print();

/**
 * @param {string} str
 */
function isValidJSON(str) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}