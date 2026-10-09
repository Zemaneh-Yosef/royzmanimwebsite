// @ts-check

import WebsiteCalendar, { HebrewNumberFormatter } from "../../WebsiteCalendar.js";

/**
 * Month grid for the moon (month-introduction) pages: a Sunday-first, 7-column calendar of the Hebrew month,
 * placed above the moonrise / moonset grid. Adapted from the Ohel Michael print's bottom page, without its
 * minyan schedules, sponsorships and dedications.
 *
 * The per-day contents (titles, candle lighting, havdalah, fasts) come from the weekly workers
 * (print-web-worker.js → monthGridDays), so the times match the weekly pages, refraction included.
 * Days no weekly worker covered (a month that starts before, or ends after, the printed weeks) still
 * get their Hebrew and Gregorian dates.
 */

/** @typedef {import('./print-web-worker.js').GridDay} GridDay */

const DAY_LABELS = {
	en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	hb: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת']
};

const ICONS = {
	candle: '<i class="bi bi-fire"></i>',
	havdalah: '<svg viewBox="0 0 108.81511 287.75458" class="flipImageRTL"><use href="/assets/images/havdala.svg#layer1"/></svg>'
};

const TIME_LABELS = {
	en: { fastStart: 'Fast ', fastEnd: 'Ends ' },
	hb: { fastStart: 'צום ', fastEnd: 'סוף ' }
};

const hNum = new HebrewNumberFormatter();

/**
 * @param {GridDay['times'][number]} entry
 * @param {typeof TIME_LABELS['en']} labels
 */
function timeHtml(entry, labels) {
	switch (entry.kind) {
		case 'candle': return ICONS.candle + ' ' + entry.time;
		case 'havdalah': return ICONS.havdalah + ' ' + entry.time;
		case 'fastStart': return labels.fastStart + entry.time;
		case 'fastEnd': return labels.fastEnd + entry.time;
		default: return entry.time; // fastRange: the title already names the fast
	}
}

/**
 * @param {number} year   Hebrew year
 * @param {number} month  Hebrew month, KosherZmanim numbering (Nisan = 1, Tishri = 7)
 * @param {string} lang
 * @param {Record<string, GridDay>} days  keyed by ISO date
 */
export function buildMonthGrid(year, month, lang, days) {
	const l = lang == 'hb' ? 'hb' : 'en';
	const first = new WebsiteCalendar().chainJewishDate(year, month, 1).getDate().withCalendar('iso8601');
	const daysInMonth = first.withCalendar('hebrew').daysInMonth;
	const offset = first.dayOfWeek % 7; // Sunday first

	let html = DAY_LABELS[l]
		.map((name, i) => `<div class="mgLabel${i == 6 ? ' shabbat' : ''}">${name}</div>`)
		.join('');

	html += '<div class="mgCell empty"></div>'.repeat(offset);

	for (let d = 1; d <= daysInMonth; d++) {
		const date = first.add({ days: d - 1 });
		const data = days[date.toString()];

		const classes = ['mgCell'];
		if (date.dayOfWeek == 6) classes.push('shabbat');
		if (data?.bold) classes.push('bold');

		const hebDay = l == 'hb' ? hNum.formatHebrewNumber(d) : d;
		// Month name on the first cell and wherever the Gregorian month changes
		const gregDay = d == 1 || date.day == 1
			? date.toLocaleString('en', { month: 'short', day: 'numeric' })
			: date.day;

		const titles = data?.titles ?? [];
		const times = data?.times ?? [];

		html += `<div class="${classes.join(' ')}">`
			+ `<div class="mgTop"><span class="mgHeb">${hebDay}</span><span class="mgGreg">${gregDay}</span></div>`
			+ `<div class="mgTitles${titles.length > 1 ? ' many' : ''}">${titles.join('<br>')}</div>`
			+ `<div class="mgTimes">${times.map(entry => timeHtml(entry, TIME_LABELS[l])).join('<br>')}</div>`
			+ `</div>`;
	}

	html += '<div class="mgCell empty"></div>'.repeat((7 - (offset + daysInMonth) % 7) % 7);

	return `<div class="monthGrid" dir="${l == 'hb' ? 'rtl' : 'ltr'}">${html}</div>`;
}

/**
 * Puts a month grid on every moon month page, right above its moonrise / moonset grid.
 * Call after MoonRender.monthPagesReady and after every weekly worker has reported.
 * @param {string} lang
 * @param {Record<string, GridDay>} days
 */
export function insertMonthGrids(lang, days) {
	for (const page of document.querySelectorAll('.birkatLevanaMoonPage[data-monthPrefix][data-monthYear]')) {
		const moonGrid = page.querySelector('.moonGrid');
		if (!moonGrid || page.querySelector('.monthGrid'))
			continue;

		moonGrid.insertAdjacentHTML('beforebegin', buildMonthGrid(
			Number(page.getAttribute('data-monthYear')),
			Number(page.getAttribute('data-monthPrefix')),
			lang,
			days
		));
	}
}