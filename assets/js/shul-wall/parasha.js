// @ts-check

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { ZemanFunctions, zDTFromFunc } from "../ROYZmanim.js";
import preSettings from "./preSettings.js";

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
const geoL = new GeoLocation(...glArgs);

let dateForSet = Temporal.Now.plainDateISO(preSettings.location.timezone());
if (dateForSet.year < 2025)
	dateForSet = dateForSet.with({ year: 2025, month: 4, day: 12 });

const jCal = new WebsiteLimudCalendar(dateForSet);
jCal.setInIsrael((geoL.getLocationName() || "").toLowerCase().includes('israel'))

let dateHighlight = jCal.shabbat();
for (; !jCal.getDate().equals(dateHighlight.getDate()); jCal.forward(5, 1)) {
	if (jCal.isAssurBemelacha()) {
		dateHighlight = jCal.clone();
		break;
	}
}
jCal.setDate(dateForSet);

const zmanCalc = new ZemanFunctions(geoL, {
	elevation: jCal.getInIsrael(),
	rtKulah: preSettings.calendarToggle.rtKulah(),
	candleLighting: preSettings.customTimes.candleLighting(),
	fixedMil: preSettings.calendarToggle.forceSunSeasonal() || jCal.getInIsrael(),
	melakha: preSettings.customTimes.tzeithIssurMelakha()
})
zmanCalc.setDate(dateForSet);

/** @type {[string | string[], options?: Intl.DateTimeFormatOptions]} */
const dtF = [preSettings.language() == 'hb' ? 'he' : 'en', {
	hourCycle: preSettings.timeFormat(),
	hour: 'numeric',
	minute: '2-digit'
}];

const yomTovObj = {
	// Holidays
	[WebsiteLimudCalendar.PESACH]: {
		hb: "פסח",
		"en-et": "Pesaḥ",
		en: "Passover",
	},
	[WebsiteLimudCalendar.CHOL_HAMOED_PESACH]: {
		en: "Shabbat Intermediary",
		"en-et": "Shabbath Ḥol HaMoedh",
		hb: "שבת חול המועד"
	},
	[WebsiteLimudCalendar.SHAVUOS]: {
		en: "Shavuoth",
		hb: "שבועות",
		"en-et": "Shavuoth"
	},
	[WebsiteLimudCalendar.ROSH_HASHANA]: {
		hb: "ראש השנה",
		en: "Rosh Hashana",
		"en-et": "Rosh Hashana"
	},
	[WebsiteLimudCalendar.SUCCOS]: {
		hb: "סוכות",
		en: "Sukkoth",
		"en-et": "Sukkoth"
	},
	[WebsiteLimudCalendar.CHOL_HAMOED_SUCCOS]: {
		hb: "שבת חול המועד",
		"en-et": "Shabbath Ḥol HaMoedh",
		en: "Shabbath Intermediary"
	},

	// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
	// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
	[WebsiteLimudCalendar.SHEMINI_ATZERES]: {
		hb: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
		en: "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : ""),
		"en-et": "Shemini Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : "")
	},
	[WebsiteLimudCalendar.SIMCHAS_TORAH]: {
		hb: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
		en: (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah",
		"en-et": (jCal.getInIsrael() ? "Shemini Atzereth & " : "") + "Simchath Torah"
	},

	// YK is the only Fast considered a YT
	[WebsiteLimudCalendar.YOM_KIPPUR]: {
		"hb": "יום כיפור",
		"en": "Yom Kippur",
		"en-et": "Yom Kippur"
	}
}

const titleElem = document.querySelector('[data-parasha]')
if (dateHighlight.isYomTov() && dateHighlight.getYomTovIndex() in yomTovObj) {
	if (titleElem.hasAttribute('data-prefix')) {
		titleElem.innerHTML = {
			"en-ru": `<span class="langTV lang-en">${yomTovObj[dateHighlight.getYomTovIndex()]["en"]}</span>
			<span class="langTV lang-ru">${yomTovObj[dateHighlight.getYomTovIndex()]["hb"]}</span> - `,
			"en-et-hb":
				`<span class="langTV lang-en-et">${yomTovObj[dateHighlight.getYomTovIndex()]["en-et"]}</span>
				<span class="langTV lang-hb">${yomTovObj[dateHighlight.getYomTovIndex()]["hb"]}</span>`,
			"en-hb":
				`<span class="langTV lang-en">${yomTovObj[dateHighlight.getYomTovIndex()]["en"]}</span>
				<span class="langTV lang-hb">${yomTovObj[dateHighlight.getYomTovIndex()]["hb"]}</span>`,
			"hb": yomTovObj[dateHighlight.getYomTovIndex()]["hb"]
		}[titleElem.getAttribute('data-prefix')]
	} else
		titleElem.innerHTML = yomTovObj[dateHighlight.getYomTovIndex()][preSettings.language()]
} else if (titleElem.hasAttribute('data-prefix')) {
	titleElem.innerHTML = {
		"hb-ru": `<span class="langTV lang-hb">שבת ${jCal.getHebrewParasha().join(" / ")} ${dateHighlight.isChanukah() ? "(חנוכה)" : ""}</span>
		<span class="langTV lang-ru">Шаббат ${dateHighlight.isChanukah() ? "Ханука" : ""} ${jCal.getHebrewParasha().join(" / ")}</span>`,
		"en-ru": `<span class="langTV lang-en">Shabbat ${dateHighlight.isRoshChodesh() ? "R\"Ḥ" : ""} ${dateHighlight.isChanukah() ? "Ḥanuka" : ""}</span>
		<span class="langTV lang-ru">Шаббат ${dateHighlight.isChanukah() ? "Ханука" : ""}</span> - `
			+ jCal.getHebrewParasha().join(" / "),
		"en-et-hb":
			`<span class="langTV lang-en-et">Shabbath ${dateHighlight.isRoshChodesh() ? "R\"Ḥ" : ""} ${dateHighlight.isChanukah() ? "Ḥanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-hb">שבת ${jCal.getHebrewParasha().join(" / ")} ${dateHighlight.isChanukah() ? "(חנוכה)" : ""}</span>`,
		"en-hb":
			`<span class="langTV lang-en">Shabbat ${dateHighlight.isRoshChodesh() ? "R\"Ḥ" : ""} ${dateHighlight.isChanukah() ? "Chanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-hb">שבת ${jCal.getHebrewParasha().join(" / ")} ${dateHighlight.isChanukah() ? "(חנוכה)" : ""}</span>`,
		"hb": `שבת ${jCal.getHebrewParasha().join(" / ")} ${dateHighlight.isChanukah() ? "(חנוכה)" : ""}`
	}[titleElem.getAttribute('data-prefix')]
} else
	titleElem.innerHTML = jCal.getHebrewParasha().join(" / ") + (dateHighlight.isChanukah() ? " (חנוכה)" : "");

const lightCand = document.querySelector('[data-lightingCandles]');
if (dateHighlight.hasCandleLighting()) {
	const dayLoop = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	/** @type {Element} */
	// @ts-ignore
	const lightCand2 = lightCand.cloneNode(true);
	lightCand2.innerHTML += `(${dayLoop[dateHighlight.getDayOfWeek()]}. night): ` +
		zDTFromFunc(zmanCalc.chainDate(dateHighlight.getDate())
			[(dateHighlight.getDayOfWeek() == 6 ? 'getCandleLighting' :
				dateHighlight.getDayOfWeek() == 7 ? 'getTzetMelakha' : 'getTzetHumra')]())
			.toLocaleString(...dtF);
	lightCand.insertAdjacentElement('afterend', lightCand2);

	if (dateHighlight.tomorrow().hasCandleLighting()) {
		/** @type {Element} */
		// @ts-ignore
		const lightCand3 = lightCand.cloneNode(true);
		lightCand3.innerHTML += `(${dayLoop[dateHighlight.getDayOfWeek() + 1]}. night): ` +
			zDTFromFunc(zmanCalc.chainDate(dateHighlight.tomorrow().getDate())
			[(dateHighlight.getDayOfWeek() == 5 ? 'getCandleLighting' : 'getTzetHumra')]())
			.toLocaleString(...dtF);

		lightCand2.insertAdjacentElement('afterend', lightCand3);
	}

	lightCand.innerHTML += `(${dayLoop[dateHighlight.getDayOfWeek() - 1]}. night): `;
}

const jCalErev = dateHighlight.clone();
jCalErev.back();
lightCand.innerHTML += zDTFromFunc(zmanCalc.chainDate(jCalErev.getDate())
	[((jCalErev.getDayOfWeek() == 6 || !jCalErev.isAssurBemelacha()) ? 'getCandleLighting' :
		jCalErev.getDayOfWeek() == 7 ? 'getTzetMelakha' : 'getTzetHumra')]())
	.toLocaleString(...dtF);

const tzet = dateHighlight.clone();
do {
	tzet.forward(5, 1)
} while (tzet.isAssurBemelacha())
tzet.back(); // last day of assur bemelacha

// Figuring out whether this is Rabbinic or Biblical
tzet.back();
const rabbinic = tzet.getDayOfWeek() !== 6 && tzet.isErevYomTovSheni()
tzet.forward(5, 1);

const tzetTimes = {
	ikar: zDTFromFunc(zmanCalc.chainDate(tzet.getDate()).getTzetMelakha()).toLocaleString(...dtF),
	rt: zmanCalc.chainDate(tzet.getDate()).getTzetRT().toLocaleString(...dtF)
}

const tzetElem = document.querySelector('[data-tzetShab]');
let tzetText;
if (tzetElem.hasAttribute('data-ikar-text')) {
	tzetText = (rabbinic
		? tzetTimes.ikar
		: tzetTimes.rt + ` (${tzetElem.getAttribute('data-ikar-text')}: ${tzetTimes.ikar})`)
} else {
	tzetText = tzetTimes.ikar;
	if (!rabbinic && tzetElem.hasAttribute('data-rt-text'))
		tzetText += ` (${tzetElem.getAttribute('data-rt-text')}: ${tzetTimes.rt})`
}
tzetElem.appendChild(document.createTextNode(tzetText))