// @ts-check

// The wording of zeman notifications ("Sunset in 15 minutes"), shared by the page's own notifications and the
// notification server (Zemaneh-Yosef/website-notif), so both say the same thing. No DOM: the server runs it.

/**
 * "in 15 minutes", "בעוד שעה ו-5 דקות", "now"
 * @param {'he'|'en'|'he-Latn'} language
 * @param {number} minutes
 */
export function leadText(language, minutes) {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;

	if (language == "he") {
		if (minutes == 0) return "עכשיו";
		const hePart = (/** @type {number} */ n, /** @type {string[]} */ [one, two, many]) =>
			n == 1 ? one : n == 2 ? two : `${n} ${many}`;
		const parts = [];
		if (hours) parts.push(hePart(hours, ["שעה", "שעתיים", "שעות"]));
		if (rest) parts.push(hePart(rest, ["דקה", "שתי דקות", "דקות"]));
		if (parts.length == 2)
			parts[1] = (/^\d/.test(parts[1]) ? "ו-" : "ו") + parts[1];
		return "בעוד " + parts.join(" ");
	}

	if (minutes == 0) return "now";
	const parts = [];
	if (hours) parts.push(`${hours} hour${hours == 1 ? "" : "s"}`);
	if (rest) parts.push(`${rest} minute${rest == 1 ? "" : "s"}`);
	return "in " + parts.join(" and ");
}

/**
 * A notification's title and body
 * @param {{ title: string; timeText: string }} zman the zeman's name (plain text) and its time as written
 * @param {number} minutes how long until it
 * @param {'he'|'en'|'he-Latn'} language
 * @param {string | null} [locationName]
 */
export function notificationText(zman, minutes, language, locationName) {
	return {
		title: `${zman.title}${minutes == 0 ? " — " : " "}${leadText(language, minutes)}`,
		body: [zman.timeText, locationName].filter(Boolean).join(" · ")
	};
}

/**
 * A zeman's title as plain text: its names can hold a little markup (<sup>th</sup>)
 * @param {string} html
 */
export function plainText(html) {
	return String(html)
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
		.replace(/\s+/g, " ").trim();
}

/**
 * The notification `tag` for one zeman on one day: the page and the server use the same one, so a
 * notification shown by one is replaced (not doubled) by the other
 * @param {string} key @param {Temporal.ZonedDateTime} time
 */
export function notificationTag(key, time) {
	return `zman-${key}-${time.toPlainDate().toString()}`;
}
