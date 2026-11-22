// @ts-check

/**
 * The rows of a zemanim list in the page's markup: reading them (which zman, its rulings, its names) and
 * filling one in with a calculated time. Shared by the website's list (ui/zmanim-list.js) and the shul-wall
 * screens (shul-wall/zemanim/transition.js, daySpotlight.js), whose markup differs only in where the names
 * are and how a name is written back. Reads no settings.
 */

/**
 * @template {Record<string, string>} T
 * @typedef {Readonly<{ function: string | null, yomTovInclusive: any, luachInclusive: any, condition: string | null,
 *   round: any, title: T, ignoreNextUpcoming: boolean }>} ZmanRow
 *   what WebsiteCalendar.getZmanimInfo reads of a row
 */

/**
 * A row's names on the website: one (Hazon Yosef's `.zmanTitleText`, kept as Hebrew), else one per language.
 * @param {Element} timeSlot
 * @returns {{ he: string, en: string, 'he-Latn': string }}
 */
export function siteTitles(timeSlot) {
	const single = timeSlot.querySelector('.zmanTitleText');
	return single
		? { he: single.innerHTML, en: "", 'he-Latn': "" }
		: {
			he: timeSlot.querySelector('span.lang.lang-he')?.innerHTML ?? "",
			en: timeSlot.querySelector('span.lang.lang-en')?.innerHTML ?? "",
			'he-Latn': timeSlot.querySelector('span.lang.lang-he-Latn')?.innerHTML ?? ""
		};
}

/**
 * A row's names on the shul-wall screens: the languages the row has.
 * @param {Element} timeSlot
 * @returns {Record<string, string>}
 */
export function wallTitles(timeSlot) {
	return Object.fromEntries(['he', 'en', 'he-Latn', 'ru'].flatMap(lang => {
		const span = timeSlot.querySelector(`span.langTV.lang-${lang}`);
		return span ? [[lang, span.innerHTML]] : [];
	}));
}

/**
 * The rows among a container's children that are zemanim this page can calculate (a data-zmanid with a
 * data-timeGetter the calculator has, and the candle lighting).
 * @template {Record<string, string>} T
 * @param {Iterable<Element>} children
 * @param {{ methodNames: { includes(name: string): boolean }, titles: (timeSlot: Element) => T }} options
 *   methodNames: the calculator's methods (methodNamesOf / methodNames); titles: siteTitles or wallTitles
 * @returns {Record<string, ZmanRow<T>>} by data-zmanid
 */
export function readRows(children, { methodNames, titles }) {
	/** @type {Record<string, ZmanRow<T>>} */
	const rows = {};
	for (const timeSlot of children) {
		const id = timeSlot.getAttribute('data-zmanid');
		const getter = timeSlot.getAttribute('data-timeGetter');
		if (id === null || !(id == 'candleLighting' || (getter && methodNames.includes(getter))))
			continue;

		rows[id] = Object.freeze({
			function: getter,
			yomTovInclusive: timeSlot.getAttribute('data-yomTovInclusive'),
			luachInclusive: timeSlot.getAttribute('data-luachInclusive'),
			condition: timeSlot.getAttribute('data-condition'),
			round: timeSlot.getAttribute('data-round'),
			title: titles(timeSlot),
			ignoreNextUpcoming: timeSlot.hasAttribute('data-ignoreNextUpcoming')
		});
	}
	return rows;
}

/**
 * Fill in a row of one opinion: hidden (display -1), "XX:XX" (-2), or its time and names, hidden anyway when its
 * display is 0 (calculated but not shown; still there to inspect) and shown when 1.
 * @param {HTMLElement} timeSlot
 * @param {{ display: number, zDTObj: Temporal.ZonedDateTime, dtF: [string | string[], Intl.DateTimeFormatOptions?],
 *   title: Record<string, string | undefined> } | undefined} info  none: hidden
 * @param {(timeSlot: HTMLElement, title: any) => void} setTitles writes the row's names
 * @param {Temporal.ZonedDateTime} [time] shown instead of the row's own time
 * @returns {boolean} whether the row got its time (display 0 or 1), for what the caller adds to such rows
 */
export function fillRow(timeSlot, info, setTitles, time) {
	if (!info || info.display == -1) {
		timeSlot.style.setProperty('display', 'none', 'important');
		return false;
	}

	const timeDisplay = timeSlot.getElementsByClassName('timeDisplay')[0];
	if (info.display == -2) {
		timeSlot.style.removeProperty("display");
		timeDisplay.lastElementChild.innerHTML = "XX:XX";
		return false;
	}

	timeDisplay.lastElementChild.innerHTML = (time ?? info.zDTObj).toLocaleString(...info.dtF);
	setTitles(timeSlot, info.title);

	// Calculate but hide! Can be derived via Inspect Element
	if (!info.display)
		timeSlot.style.setProperty('display', 'none', 'important');
	else
		timeSlot.style.removeProperty('display');
	return true;
}
