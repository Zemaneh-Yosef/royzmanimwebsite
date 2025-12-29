// @ts-check

import WebsiteLimudCalendar from "../WebsiteLimudCalendar.js";
import { zDTFromFunc } from "../ROYZmanim.js";
import { scheduleSettings, jCal, dtF, zmanCalc } from "./base.js";

let melakhaJCal = jCal.shabbat();
for (const loopJCal = jCal.clone(); !loopJCal.getDate().equals(melakhaJCal.getDate()); loopJCal.forward(5, 1)) {
	if (loopJCal.isAssurBemelacha()) {
		melakhaJCal = loopJCal.clone();
		break;
	}
}

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
if (melakhaJCal.isYomTov() && melakhaJCal.getYomTovIndex() in yomTovObj) {
	if (titleElem.hasAttribute('data-prefix')) {
		titleElem.innerHTML = {
			"en-ru": `<span class="langTV lang-en">${yomTovObj[melakhaJCal.getYomTovIndex()]["en"]}</span>
			<span class="langTV lang-ru">${yomTovObj[melakhaJCal.getYomTovIndex()]["hb"]}</span> - `,
			"en-et-hb":
				`<span class="langTV lang-en-et">${yomTovObj[melakhaJCal.getYomTovIndex()]["en-et"]}</span>
				<span class="langTV lang-hb">${yomTovObj[melakhaJCal.getYomTovIndex()]["hb"]}</span>`,
			"en-hb":
				`<span class="langTV lang-en">${yomTovObj[melakhaJCal.getYomTovIndex()]["en"]}</span>
				<span class="langTV lang-hb">${yomTovObj[melakhaJCal.getYomTovIndex()]["hb"]}</span>`,
			"hb": yomTovObj[melakhaJCal.getYomTovIndex()]["hb"]
		}[titleElem.getAttribute('data-prefix')]
	} else
		titleElem.innerHTML = yomTovObj[melakhaJCal.getYomTovIndex()][scheduleSettings.language]
} else if (titleElem.hasAttribute('data-prefix')) {
	titleElem.innerHTML = {
		"hb-ru": `<span class="langTV lang-hb">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>
		<span class="langTV lang-ru">Шаббат ${melakhaJCal.isChanukah() ? "Ханука" : ""} ${jCal.getHebrewParasha().join(" / ")}</span>`,
		"en-ru": `<span class="langTV lang-en">Shabbat ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Ḥanuka" : ""}</span>
		<span class="langTV lang-ru">Шаббат ${melakhaJCal.isChanukah() ? "Ханука" : ""}</span> - `
			+ jCal.getHebrewParasha().join(" / "),
		"hb-en-ru": `
			<span class="langTV lang-hb">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>
			<span class="langTV lang-en">Shabbat ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Chanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-ru">Шаббат ${melakhaJCal.isChanukah() ? "Ханука" : ""} ${jCal.getHebrewParasha().join(" / ")}</span>`,
		"en-et-hb":
			`<span class="langTV lang-en-et">Shabbath ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Ḥanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-hb">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>`,
		"en-hb":
			`<span class="langTV lang-en">Shabbat ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Chanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-hb">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>`,
		"hb": `שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}`
	}[titleElem.getAttribute('data-prefix')]
} else
	titleElem.innerHTML = jCal.getHebrewParasha().join(" / ") + (melakhaJCal.isChanukah() ? " (חנוכה)" : "");

const lightCand = document.querySelector('[data-lightingCandles]');
if (melakhaJCal.hasCandleLighting()) {
	const dayLoop = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	/** @type {Element} */
	// @ts-ignore
	const lightCand2 = lightCand.cloneNode(true);
	let candLight2Time = zDTFromFunc(zmanCalc.chainDate(melakhaJCal.getDate())
	[(melakhaJCal.getDayOfWeek() == 6 ? 'getCandleLighting' :
		melakhaJCal.getDayOfWeek() == 7 ? 'getTzetMelakha' : 'getTzetHumra')]());

	if (candLight2Time.second > (melakhaJCal.getDayOfWeek() == 6 ? 40 : 20))
		candLight2Time = candLight2Time.add({ minutes: 1 }).with({ second: 0 });

	lightCand2.innerHTML += `(${dayLoop[melakhaJCal.getDayOfWeek()]}. night): ` +
		candLight2Time.toLocaleString(...dtF);
	lightCand.insertAdjacentElement('afterend', lightCand2);

	if (melakhaJCal.tomorrow().hasCandleLighting()) {
		/** @type {Element} */
		// @ts-ignore
		const lightCand3 = lightCand.cloneNode(true);

		let candLight3Time = zDTFromFunc(zmanCalc.chainDate(melakhaJCal.tomorrow().getDate())
			[(melakhaJCal.getDayOfWeek() == 5 ? 'getCandleLighting' : 'getTzetHumra')]());

		if (candLight3Time.second > (melakhaJCal.getDayOfWeek() == 5 ? 40 : 20))
			candLight3Time = candLight3Time.add({ minutes: 1 }).with({ second: 0 });

		lightCand3.innerHTML += `(${dayLoop[melakhaJCal.getDayOfWeek() + 1]}. night): ` +
			candLight3Time.toLocaleString(...dtF);

		lightCand2.insertAdjacentElement('afterend', lightCand3);
	}

	lightCand.innerHTML += `(${dayLoop[melakhaJCal.getDayOfWeek() - 1]}. night): `;
}

const jCalErev = melakhaJCal.clone();
jCalErev.back();
lightCand.innerHTML += zDTFromFunc(zmanCalc.chainDate(jCalErev.getDate())
	[((jCalErev.getDayOfWeek() == 6 || !jCalErev.isAssurBemelacha()) ? 'getCandleLighting' :
		jCalErev.getDayOfWeek() == 7 ? 'getTzetMelakha' : 'getTzetHumra')]())
	.toLocaleString(...dtF);

const tzet = melakhaJCal.clone();
do {
	tzet.forward(5, 1)
} while (tzet.isAssurBemelacha())
tzet.back(); // last day of assur bemelacha

// Figuring out whether this is Rabbinic or Biblical
tzet.back();
const rabbinic = tzet.getDayOfWeek() !== 6 && tzet.isErevYomTovSheni()
tzet.forward(5, 1);

const tzetTimes = {
	ikar: zDTFromFunc(zmanCalc.chainDate(tzet.getDate()).getTzetMelakha()),
	rt: zmanCalc.chainDate(tzet.getDate()).getTzetRT()
}

for (const tzetKey of Object.keys(tzetTimes)) {
	/** @type {keyof typeof tzetTimes} */
	// @ts-ignore
	const tzetIndex = tzetKey;

	if (tzetTimes[tzetIndex].second > 20)
		tzetTimes[tzetIndex] = tzetTimes[tzetIndex].add({ minutes: 1 }).with({ second: 0 });
}

const tzetElem = document.querySelector('[data-tzetShab]');
let tzetText;
if (tzetElem.hasAttribute('data-ikar-text')) {
	tzetText = (rabbinic
		? tzetTimes.ikar.toLocaleString(...dtF)
		: tzetTimes.rt.toLocaleString(...dtF) + ` (${tzetElem.getAttribute('data-ikar-text')}: ${tzetTimes.ikar.toLocaleString(...dtF)})`)
} else {
	tzetText = tzetTimes.ikar.toLocaleString(...dtF);
	if (!rabbinic && tzetElem.hasAttribute('data-rt-text'))
		tzetText += ` (${tzetElem.getAttribute('data-rt-text')}: ${tzetTimes.rt.toLocaleString(...dtF)})`
}
tzetElem.appendChild(document.createTextNode(tzetText))