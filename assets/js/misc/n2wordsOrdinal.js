// @ts-check
const n2wordsOrdinal = [
    null,
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "ששי",
    "שבעי",
    "שמונה",
    "תשעה",
    "עשרי"
]
export default n2wordsOrdinal;

/**
 * The Hebrew name of a weekday: "ראשון" … "ששי", or "שבת" ("השבת" with prefixForShabbat)
 * @param {number} dayOfWeek Temporal's (1 = Monday … 7 = Sunday)
 * @param {boolean} [prefixForShabbat]
 */
export function n2hebDateOrdinal(dayOfWeek, prefixForShabbat = false) {
	const numResult = (dayOfWeek + 1) % 7;
	return (numResult == 0 ? (prefixForShabbat ? "ה" : "") + "שבת" : n2wordsOrdinal[numResult]);
}
