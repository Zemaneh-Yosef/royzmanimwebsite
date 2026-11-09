// @ts-check

/**
 * Hazon Yosef's cards for the day shown (#weekSpecial): its holiday's, its fast's (or the next day's) and
 * the coming Shabbat's times, from day-cards.js (which the printouts share). Drawn again after every render
 * of the list (the `zmanimRendered` event of zmanim-list.js).
 */

import { HebrewNumberFormatter } from "./WebsiteCalendar.js";
import { dayCards } from "./day-cards.js";

/** The name each time is listed under */
const LABELS = {
	tzetMelakha: "צאת מלאכה",
	sofZemanBiurHametz: "סוף זמן ביעור חמץ עד",
	sofZemanAhilathHametz: "סוף זמן אכילת חמץ",
	fastStarts: "תחילת הצום",
	fastEnds: "סיום הצום",
	musaf: "תחילת מוסף לפני",
	birkatKohanim: "סיום ברכת כהנים לפני",
	mikva: "טבילה במקוה לאחר",
	netz: "הנץ החמה",
	hatzotLayla: "חצות הלילה",
	rabbenuTam: "רבינו תם"
};

/** @param {Temporal.PlainDate} date @param {HebrewNumberFormatter} hNum */
const hebrewDay = (date, hNum) =>
	hNum.formatHebrewNumber(date.withCalendar("hebrew").day) + " " + date.toLocaleString("he-IL-u-ca-hebrew", { month: "long" });

/**
 * @param {import("./zmanim-list.js").default} list
 */
function renderCards(list) {
	const weekSpecialElem = document.getElementById("weekSpecial");
	if (!weekSpecialElem)
		return;

	const hNum = new HebrewNumberFormatter();
	const dtF = list.dtF;
	const cards = dayCards({ jCal: list.jCal, zc: (date) => list.zmanCalc.chainDate(date), lang: 'he' });

	weekSpecialElem.replaceChildren(...cards.map(card => {
		const containerElem = document.createElement("div");

		const titleElem = document.createElement("h1");
		titleElem.classList.add("text-center");
		titleElem.innerHTML = card.title;
		containerElem.appendChild(titleElem);

		const datesElem = document.createElement('h6');
		datesElem.classList.add("text-center");
		const datesList = [...card.datesToZman.keys()].sort(Temporal.PlainDate.compare);
		datesElem.innerHTML = datesList.length == 1
			? hebrewDay(datesList[0], hNum)
			: hebrewDay(datesList[0], hNum) + " - " + hebrewDay(datesList[datesList.length - 1], hNum);
		containerElem.appendChild(datesElem);

		const zmanListElem = document.createElement("ul");
		const multipleCandleLightings = [...card.datesToZman.values()].filter(zmanMap => 'candleLighting' in zmanMap).length > 1;
		let candleLightIndex = 1;

		for (const zmanTimes of card.datesToZman.values()) {
			const zmanEntries = Object.entries(zmanTimes);
			zmanEntries.forEach(([zmanKey, zmanTime], index) => {
				if (zmanKey == 'rabbenuTam' && zmanEntries[index - 1]?.[0] == 'candleLighting') {
					// after candle lighting at the end of a Shabbat: on its line
					const rtAddendum = document.createElement("span");
					rtAddendum.innerHTML = ` (ר"ת: ${zmanTime.toLocaleString(...dtF)})`;
					zmanListElem.lastElementChild.appendChild(rtAddendum);
					return;
				}

				let label;
				if (zmanKey == 'candleLighting')
					label = multipleCandleLightings ? "הדלקת נרות (ליל " + hNum.formatHebrewNumber(candleLightIndex++) + ")" : "הדלקת נרות";
				else if (zmanKey == 'bedikatHametz')
					label = "בדיקת חמץ בליל " + zmanTime.toLocaleString('he-IL', { weekday: 'short' });
				else
					label = LABELS[/** @type {keyof LABELS} */ (zmanKey)] ?? zmanKey;

				const zmanItemElem = document.createElement("li");
				zmanItemElem.innerHTML = `<b>${label}: </b>` + zmanTime.toLocaleString(...dtF);
				zmanListElem.appendChild(zmanItemElem);
			});
		}
		containerElem.appendChild(zmanListElem);

		let extra = "";
		if (card.hallelBefore)
			extra = "תשלים הלל לפני " + card.hallelBefore.toLocaleString(...dtF) + '<br>' + "ממוסף ואילך, אומרים מוריד הטל וברכנו";
		else if (card.roshHodesh)
			extra = "<i class='bi bi-moon-fill'></i> מברכים חודש " + card.roshHodesh.month.he
				+ " ב" + card.roshHodesh.days.map(day => list.jCal.chainDate(day).getDayOfTheWeek().he).join(" / ");

		if (extra) {
			const extraElem = document.createElement("p");
			extraElem.innerHTML = extra;
			containerElem.appendChild(extraElem);
		}

		return containerElem;
	}));
}

document.addEventListener("zmanimRendered", (event) => renderCards(/** @type {CustomEvent} */ (event).detail));
