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
		he: "פסח",
		"he-Latn": "Pesaḥ",
		en: "Passover",
	},
	[WebsiteLimudCalendar.CHOL_HAMOED_PESACH]: {
		en: "Shabbat Intermediary",
		"he-Latn": "Shabbath Ḥol HaMoedh",
		he: "שבת חול המועד"
	},
	[WebsiteLimudCalendar.SHAVUOS]: {
		en: "Shavuoth",
		he: "שבועות",
		"he-Latn": "Shavuoth"
	},
	[WebsiteLimudCalendar.ROSH_HASHANA]: {
		he: "ראש השנה",
		en: "Rosh Hashana",
		"he-Latn": "Rosh Hashana"
	},
	[WebsiteLimudCalendar.SUCCOS]: {
		he: "סוכות",
		en: "Sukkoth",
		"he-Latn": "Sukkoth"
	},
	[WebsiteLimudCalendar.CHOL_HAMOED_SUCCOS]: {
		he: "שבת חול המועד",
		"he-Latn": "Shabbath Ḥol HaMoedh",
		en: "Shabbath Intermediary"
	},

	// This is interesting, because I would assume it would take after the first one, thereby the second case doesn't need to be implemented
	// I will leave the logic the same, though, only going as far as to fix the obvious misinfo (Simcha Torah would return Shmini Atzereth in Shmutz Laaretz pre-my edits)
	[WebsiteLimudCalendar.SHEMINI_ATZERES]: {
		he: "שמיני עצרת" + (jCal.getInIsrael() ? " & שמחת תורה" : ""),
		en: "Shemini 'Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : ""),
		"he-Latn": "Shemini 'Atzereth" + (jCal.getInIsrael() ? " & Simḥath Torah" : "")
	},
	[WebsiteLimudCalendar.SIMCHAS_TORAH]: {
		he: (jCal.getInIsrael() ? "שמיני עצרת & " : "") + "שמחת תורה",
		en: (jCal.getInIsrael() ? "Shemini 'Atzereth & " : "") + "Simchath Torah",
		"he-Latn": (jCal.getInIsrael() ? "Shemini 'Atzereth & " : "") + "Simchath Torah"
	},

	// YK is the only Fast considered a YT
	[WebsiteLimudCalendar.YOM_KIPPUR]: {
		"he": "יום כיפור",
		"en": "Yom Kippur",
		"he-Latn": "Yom Kippur"
	}
}

const titleElem = document.querySelector('[data-parasha]')
if (melakhaJCal.isYomTov() && melakhaJCal.getYomTovIndex() in yomTovObj) {
	if (titleElem.hasAttribute('data-prefix')) {
		titleElem.innerHTML = {
			"en-ru": `<span class="langTV lang-en">${yomTovObj[melakhaJCal.getYomTovIndex()]["en"]}</span>
			<span class="langTV lang-ru">${yomTovObj[melakhaJCal.getYomTovIndex()]["he"]}</span> - `,
			"he-Latn-he":
				`<span class="langTV lang-he-Latn">${yomTovObj[melakhaJCal.getYomTovIndex()]["he-Latn"]}</span>
				<span class="langTV lang-he">${yomTovObj[melakhaJCal.getYomTovIndex()]["he"]}</span>`,
			"en-he":
				`<span class="langTV lang-en">${yomTovObj[melakhaJCal.getYomTovIndex()]["en"]}</span>
				<span class="langTV lang-he">${yomTovObj[melakhaJCal.getYomTovIndex()]["he"]}</span>`,
			"he": yomTovObj[melakhaJCal.getYomTovIndex()]["he"]
		}[titleElem.getAttribute('data-prefix')]
	} else
		titleElem.innerHTML = yomTovObj[melakhaJCal.getYomTovIndex()][scheduleSettings.language]
} else if (titleElem.hasAttribute('data-prefix')) {
	titleElem.innerHTML = {
		"he-ru": `<span class="langTV lang-he">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>
		<span class="langTV lang-ru">Шаббат ${melakhaJCal.isChanukah() ? "Ханука" : ""} ${jCal.getHebrewParasha().join(" / ")}</span>`,
		"en-ru": `<span class="langTV lang-en">Shabbat ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Ḥanuka" : ""}</span>
		<span class="langTV lang-ru">Шаббат ${melakhaJCal.isChanukah() ? "Ханука" : ""}</span> - `
			+ jCal.getHebrewParasha().join(" / "),
		"he-en-ru": `
			<span class="langTV lang-he">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>
			<span class="langTV lang-en">Shabbat ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Chanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-ru">Шаббат ${melakhaJCal.isChanukah() ? "Ханука" : ""} ${jCal.getHebrewParasha().join(" / ")}</span>`,
		"he-Latn-he":
			`<span class="langTV lang-he-Latn">Shabbath ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Ḥanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-he">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>`,
		"en-he":
			`<span class="langTV lang-en">Shabbat ${melakhaJCal.isRoshChodesh() ? "R\"Ḥ" : ""} ${melakhaJCal.isChanukah() ? "Chanuka" : ""} - ${jCal.getHebrewParasha().join(" / ")}</span>
			<span class="langTV lang-he">שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}</span>`,
		"he": `שבת ${jCal.getHebrewParasha().join(" / ")} ${melakhaJCal.isChanukah() ? "(חנוכה)" : ""}`
	}[titleElem.getAttribute('data-prefix')]
} else
	titleElem.innerHTML = jCal.getHebrewParasha().join(" / ") + (melakhaJCal.isChanukah() ? " (חנוכה)" : "");

const lightCand = document.querySelector('[data-lightingCandles]');
if (lightCand) {
	if (melakhaJCal.hasCandleLighting()) {
		if (lightCand.hasAttribute('data-onlyRegShab')) {
			lightCand.remove()
		} else {
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
	}

	const jCalErev = melakhaJCal.clone();
	jCalErev.back();
	if (lightCand) {
		let behavior = lightCand.hasAttribute('data-timeInsert') ? lightCand.getAttribute('data-timeInsert') : 'append';
		switch (behavior) {
			case 'append':
				lightCand.innerHTML += zDTFromFunc(zmanCalc.chainDate(jCalErev.getDate())
				[((jCalErev.getDayOfWeek() == 6 || !jCalErev.isAssurBemelacha()) ? 'getCandleLighting' :
					jCalErev.getDayOfWeek() == 7 ? 'getTzetMelakha' : 'getTzetHumra')]())
					.toLocaleString(...dtF);
				break;
			case 'insertAdjacent':
				const timeElem = document.createElement('div');
				timeElem.innerHTML = zDTFromFunc(zmanCalc.chainDate(jCalErev.getDate())
				[((jCalErev.getDayOfWeek() == 6 || !jCalErev.isAssurBemelacha()) ? 'getCandleLighting' :
					jCalErev.getDayOfWeek() == 7 ? 'getTzetMelakha' : 'getTzetHumra')]())
					.toLocaleString(...dtF);
				lightCand.insertAdjacentElement('afterend', timeElem)
		}
	}
}

const tzetElem = document.querySelector('[data-tzetShab]');
if (tzetElem) {
	const tzet = melakhaJCal.clone();
	do {
		tzet.forward(5, 1)
	} while (tzet.isAssurBemelacha())
	tzet.back(); // last day of assur bemelacha

	// Figuring out whether this is Rabbinic or Biblical
	tzet.back();
	const rabbinic = tzet.getDayOfWeek() !== 6 && tzet.isErevYomTovSheni()
	tzet.forward(5, 1);

	console.log(zmanCalc.config.melakha)
	const tzetTimes = {
		ikar: zDTFromFunc(zmanCalc.chainDate(tzet.getDate()).getTzetMelakha(undefined, tzetElem.getAttribute('data-multiHandle') || "PRETTY")),
		rt: zmanCalc.chainDate(tzet.getDate()).getTzetRT()
	}

	for (const tzetKey of Object.keys(tzetTimes)) {
		/** @type {keyof typeof tzetTimes} */
		// @ts-ignore
		const tzetIndex = tzetKey;

		if (tzetTimes[tzetIndex].second > 20)
			tzetTimes[tzetIndex] = tzetTimes[tzetIndex].add({ minutes: 1 }).with({ second: 0 });
	}

	let tzetText;
	if (tzetElem.hasAttribute('data-ikar-text')) {
		tzetText = (rabbinic
			? tzetTimes.ikar.toLocaleString(...dtF)
			: tzetTimes.rt.toLocaleString(...dtF) + ` <span class="altTzetMelakhaTime">(${tzetElem.getAttribute('data-ikar-text')}: ${tzetTimes.ikar.toLocaleString(...dtF)})</span>`)
	} else {
		tzetText = tzetTimes.ikar.toLocaleString(...dtF);
		if (!rabbinic && tzetElem.hasAttribute('data-rt-text'))
			tzetText += ` <span class="altTzetMelakhaTime">(${tzetElem.getAttribute('data-rt-text')}: ${tzetTimes.rt.toLocaleString(...dtF)})</span>`
	}
	tzetElem.innerHTML += tzetText;
}