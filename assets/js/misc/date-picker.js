// @ts-check
/**
 * date-picker.js — a date picker that shows the civil and the Hebrew calendar (replaces jQuery UI + flexcal).
 *
 *   import { attachDatePicker } from "/assets/js/misc/date-picker.js";
 *   attachDatePicker(button);
 *
 * Clicking the button opens a month grid under it, in one of three views: the civil calendar, the Hebrew
 * calendar with English names, or the Hebrew calendar in Hebrew. Picking a day sets the button's `date-value`
 * to the ISO date and fires a `calendarInsert` event on it (what zmanimListUpdater listens for). It opens on
 * the button's own `date-value` (the page keeps it on the date shown), else today. Nothing before the
 * Gregorian calendar (15 October 1582, misc/util.js EARLIEST_DATE) can be picked.
 *
 * Keyboard: arrows move a day / a week, PageUp / PageDown a month, with Shift a year, Home / End the start /
 * end of the week, Enter or Space picks, Escape closes. Left and right follow the page's direction.
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { HebrewNumberFormatter } from "../WebsiteCalendar.js";
import { EARLIEST_DATE, notBeforeEarliest } from "./util.js";

/** @typedef {'gregorian' | 'hebrew-en' | 'hebrew-he'} View */
const VIEWS = /** @type {const} */ (['gregorian', 'hebrew-en', 'hebrew-he']);
const VIEW_KEY = "datePickerView";
/** A Sunday, for the weekday names */
const SUNDAY = Temporal.PlainDate.from("2026-11-08");

const hNum = new HebrewNumberFormatter();

const pageIsHebrew = () => document.body.classList.contains("lang-he");
const pageIsRtl = () => getComputedStyle(document.body).direction == "rtl";

/** @returns {View} */
function savedView() {
	try {
		const view = localStorage.getItem(VIEW_KEY);
		if (VIEWS.includes(/** @type {View} */ (view)))
			return /** @type {View} */ (view);
	} catch { /* no storage: use the default */ }
	return pageIsHebrew() ? 'hebrew-he' : 'gregorian';
}

/** @param {View} view */
function saveView(view) {
	try { localStorage.setItem(VIEW_KEY, view); } catch { /* not kept: fine */ }
}

/** @param {View} view */
const isHebrewView = view => view != 'gregorian';

/**
 * The date in the calendar the view counts in
 * @param {Temporal.PlainDate} iso @param {View} view
 */
const inView = (iso, view) => isHebrewView(view) ? iso.withCalendar("hebrew") : iso;

/**
 * The picker's own labels, in the page's language; the month and weekday names follow the view
 * @param {View} view
 */
function labels(view) {
	const he = pageIsHebrew();
	return {
		/** for the month and weekday names */
		locale: view == 'hebrew-he' || (he && view == 'gregorian') ? 'he' : 'en',
		previousMonth: he ? "החודש הקודם" : "Previous month",
		nextMonth: he ? "החודש הבא" : "Next month",
		dialog: he ? "בחירת תאריך" : "Choose a date",
		views: /** @type {Record<View, string>} */ ({ gregorian: he ? "לועזי" : "Civil", 'hebrew-en': "Hebrew", 'hebrew-he': "עברי" })
	};
}

/**
 * The month's title, e.g. "November 2026", "Kislev 5787" or "כסלו תשפ״ז"
 * @param {Temporal.PlainDate} first the month's first day, in the view's calendar
 * @param {View} view
 */
function monthTitle(first, view) {
	switch (view) {
		case 'gregorian':
			return first.toLocaleString(labels(view).locale, { month: 'long', year: 'numeric', calendar: 'gregory' });
		case 'hebrew-en':
			return first.toLocaleString('en-u-ca-hebrew', { month: 'long', year: 'numeric' });
		case 'hebrew-he':
			return first.toLocaleString('he-u-ca-hebrew', { month: 'long' }) + " " + hNum.formatHebrewNumber(first.year);
	}
}

/**
 * The day's number in a cell: digits, or Hebrew letters in the Hebrew view
 * @param {number} day @param {boolean} letters
 */
const dayText = (day, letters) => letters ? hNum.formatHebrewNumber(day) : String(day);

/** What makes a day stand out: Yom Tov, Rosh Hodesh or a fast @param {Temporal.PlainDate} iso */
function specialDay(iso) {
	const jCal = new KosherZmanim.JewishCalendar(iso);
	jCal.setInIsrael(false);
	if (jCal.isYomTov() && jCal.isAssurBemelacha()) return 'yomtov';
	if (jCal.isRoshChodesh()) return 'roshchodesh';
	if (jCal.isTaanis()) return 'fast';
	return null;
}

let styleAdded = false;
function addStyle() {
	if (styleAdded) return;
	styleAdded = true;
	const style = document.createElement("style");
	style.textContent = `
.zy-datepicker {
	position: absolute; z-index: 1080; width: 20rem; max-width: calc(100vw - 32px); padding: .5rem;
	color: var(--bs-body-color); background: var(--bs-body-bg);
	border: var(--bs-border-width) solid var(--bs-border-color); border-radius: var(--bs-border-radius-lg);
	box-shadow: var(--bs-box-shadow); font-family: var(--bs-body-font-family);
}
.zy-datepicker[hidden] { display: none; }
.zy-dp-views { display: flex; gap: .25rem; margin-bottom: .5rem; }
.zy-dp-views .btn { flex: 1; }
.zy-dp-head { display: flex; align-items: center; justify-content: space-between; gap: .25rem; margin-bottom: .25rem; }
.zy-dp-title { font-weight: 600; text-align: center; flex: 1; }
.zy-dp-grid { width: 100%; border-collapse: separate; border-spacing: 2px; table-layout: fixed; }
.zy-dp-grid th { font-size: .75rem; font-weight: 500; text-align: center; color: var(--bs-secondary-color); padding-bottom: .125rem; }
.zy-dp-grid th:last-child { font-weight: 700; }
.zy-dp-day {
	width: 100%; aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
	line-height: 1.05; padding: 0; color: inherit; background: transparent; border: 0; border-radius: var(--bs-border-radius);
	position: relative;
}
.zy-dp-day:hover:not(:disabled) { background: var(--bs-tertiary-bg); }
.zy-dp-day:disabled { opacity: .35; }
.zy-dp-day:focus-visible { outline: 2px solid var(--bs-primary); outline-offset: 1px; }
.zy-dp-day small { font-size: .62em; opacity: .65; }
.zy-dp-day.zy-dp-today { box-shadow: inset 0 0 0 1px var(--bs-primary); }
.zy-dp-day[aria-selected="true"] { color: var(--bs-white, #fff); background: var(--bs-primary); }
.zy-dp-day[aria-selected="true"] small { opacity: .85; }
.zy-dp-day[data-special]::after {
	content: ""; position: absolute; bottom: 12%; width: .3rem; height: .3rem; border-radius: 50%; background: var(--bs-warning);
}
.zy-dp-day[data-special="yomtov"]::after { background: var(--bs-danger); }
.zy-dp-day[data-special="fast"]::after { background: var(--bs-secondary-color); }
`;
	document.head.appendChild(style);
}

/** The picker that's open, if any (one at a time) @type {(() => void) | null} */
let closeOpen = null;

/**
 * Adds the picker to a button
 * @param {HTMLElement} button
 */
export function attachDatePicker(button) {
	if (button.dataset.datePicker) return;
	button.dataset.datePicker = "on";
	button.setAttribute("aria-haspopup", "dialog");
	button.setAttribute("aria-expanded", "false");
	button.addEventListener("click", () => {
		if (button.getAttribute("aria-expanded") == "true") closeOpen?.();
		else open(button);
	});
}

/**
 * Adds the picker to every button in a page's date boxes
 * @param {Iterable<HTMLElement>} buttons
 */
export function attachDatePickers(buttons) {
	for (const button of buttons)
		attachDatePicker(button);
}

/** @param {HTMLElement} button */
function open(button) {
	closeOpen?.();
	addStyle();

	const today = Temporal.Now.plainDateISO();
	const shown = button.getAttribute("date-value");
	/** The date the page shows: the one picked so far */
	const earliest = Temporal.PlainDate.from(EARLIEST_DATE);
	const selected = notBeforeEarliest(shown ? Temporal.PlainDate.from(shown).withCalendar("iso8601") : today);
	let focused = selected;
	let view = savedView();

	const popup = document.createElement("div");
	popup.className = "zy-datepicker";
	popup.setAttribute("role", "dialog");
	popup.dir = pageIsRtl() ? "rtl" : "ltr";

	const views = document.createElement("div");
	views.className = "zy-dp-views";
	const head = document.createElement("div");
	head.className = "zy-dp-head";
	const prev = document.createElement("button");
	const next = document.createElement("button");
	const title = document.createElement("div");
	title.className = "zy-dp-title";
	title.setAttribute("aria-live", "polite");
	for (const [btn, icon] of [[prev, "bi-chevron-left"], [next, "bi-chevron-right"]]) {
		btn.type = "button";
		btn.className = "btn btn-sm btn-outline-secondary";
		// the chevrons point the way time goes on the page: flipped when it reads right to left
		btn.innerHTML = `<i class="bi ${popup.dir == "rtl" ? (icon == "bi-chevron-left" ? "bi-chevron-right" : "bi-chevron-left") : icon}" aria-hidden="true"></i>`;
	}
	head.append(prev, title, next);

	const grid = document.createElement("table");
	grid.className = "zy-dp-grid";
	grid.setAttribute("role", "grid");
	popup.append(views, head, grid);
	document.body.appendChild(popup);

	function render() {
		const text = labels(view);
		popup.setAttribute("aria-label", text.dialog);
		prev.setAttribute("aria-label", text.previousMonth);
		next.setAttribute("aria-label", text.nextMonth);

		views.replaceChildren(...VIEWS.map(v => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "btn btn-sm " + (v == view ? "btn-primary" : "btn-outline-secondary");
			btn.textContent = text.views[v];
			btn.setAttribute("aria-pressed", String(v == view));
			if (v == 'hebrew-he') btn.lang = "he";
			btn.addEventListener("click", () => { view = v; saveView(v); render(); focusDay(); });
			return btn;
		}));

		const first = inView(focused, view).with({ day: 1 });
		title.textContent = monthTitle(first, view);
		// no month before the one the Gregorian calendar starts in
		prev.disabled = Temporal.PlainDate.compare(first.withCalendar("iso8601"), earliest) <= 0;
		title.lang = view == 'hebrew-he' ? "he" : labels(view).locale;

		const headRow = document.createElement("tr");
		for (let i = 0; i < 7; i++) {
			const th = document.createElement("th");
			const day = SUNDAY.add({ days: i });
			th.textContent = day.toLocaleString(text.locale, { weekday: view == 'hebrew-he' ? 'narrow' : 'short' });
			th.setAttribute("abbr", day.toLocaleString(text.locale, { weekday: 'long' }));
			th.scope = "col";
			headRow.appendChild(th);
		}

		const rows = [headRow];
		const lead = first.dayOfWeek % 7;   // Temporal: Monday 1 ... Sunday 7; the grid starts on Sunday
		let row = document.createElement("tr");
		for (let i = 0; i < lead; i++) row.appendChild(document.createElement("td"));
		for (let day = 1; day <= first.daysInMonth; day++) {
			const date = first.with({ day });
			const iso = date.withCalendar("iso8601");
			const hebrew = iso.withCalendar("hebrew");
			const cell = document.createElement("td");
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "zy-dp-day";
			btn.dataset.date = iso.toString();
			btn.tabIndex = iso.equals(focused) ? 0 : -1;
			btn.setAttribute("aria-selected", String(iso.equals(selected)));
			if (iso.equals(today)) {
				btn.classList.add("zy-dp-today");
				btn.setAttribute("aria-current", "date");
			}

			const main = document.createElement("span");
			const small = document.createElement("small");
			if (view == 'gregorian') {
				main.textContent = String(iso.day);
				small.textContent = dayText(hebrew.day, pageIsHebrew());
			} else {
				main.textContent = dayText(hebrew.day, view == 'hebrew-he');
				small.textContent = String(iso.day);
			}
			btn.append(main, small);

			const special = specialDay(iso);
			if (special) btn.dataset.special = special;
			btn.setAttribute("aria-label", iso.toLocaleString(text.locale, { dateStyle: 'full', calendar: view == 'gregorian' ? 'gregory' : 'hebrew' }));
			if (Temporal.PlainDate.compare(iso, earliest) < 0) {
				btn.disabled = true;
				btn.setAttribute("aria-disabled", "true");
			} else btn.addEventListener("click", () => pick(iso));

			cell.appendChild(btn);
			row.appendChild(cell);
			if ((lead + day) % 7 == 0) { rows.push(row); row = document.createElement("tr"); }
		}
		if (row.children.length) rows.push(row);
		grid.replaceChildren(...rows);
	}

	function focusDay() {
		/** @type {HTMLButtonElement | null} */
		const btn = grid.querySelector(`[data-date="${focused}"]`);
		btn?.focus();
	}

	/** @param {Temporal.PlainDate} iso */
	function moveTo(iso) {
		iso = notBeforeEarliest(iso);
		const sameMonth = inView(iso, view).with({ day: 1 }).equals(inView(focused, view).with({ day: 1 }));
		focused = iso;
		if (sameMonth) {
			for (const btn of grid.querySelectorAll(".zy-dp-day"))
				/** @type {HTMLButtonElement} */ (btn).tabIndex = /** @type {HTMLButtonElement} */ (btn).dataset.date == iso.toString() ? 0 : -1;
		} else render();
		focusDay();
	}

	/** The focused day moved by whole months of the view's calendar (Adar II to Adar in a common year) */
	const byMonths = (/** @type {number} */ months) =>
		notBeforeEarliest(inView(focused, view).add({ months }, { overflow: 'constrain' }).withCalendar("iso8601"));

	prev.addEventListener("click", () => { focused = byMonths(-1); render(); });
	next.addEventListener("click", () => { focused = byMonths(1); render(); });

	grid.addEventListener("keydown", event => {
		const rtl = popup.dir == "rtl";
		/** @type {Temporal.PlainDate | null} */
		let to = null;
		switch (event.key) {
			case "ArrowLeft": to = focused.add({ days: rtl ? 1 : -1 }); break;
			case "ArrowRight": to = focused.add({ days: rtl ? -1 : 1 }); break;
			case "ArrowUp": to = focused.subtract({ weeks: 1 }); break;
			case "ArrowDown": to = focused.add({ weeks: 1 }); break;
			case "PageUp": to = byMonths(event.shiftKey ? -12 : -1); break;
			case "PageDown": to = byMonths(event.shiftKey ? 12 : 1); break;
			case "Home": to = focused.subtract({ days: focused.dayOfWeek % 7 }); break;
			case "End": to = focused.add({ days: 6 - focused.dayOfWeek % 7 }); break;
			case "Enter":
			case " ":
				event.preventDefault();
				pick(focused);
				return;
			default: return;
		}
		event.preventDefault();
		moveTo(to);
	});

	/** @param {Temporal.PlainDate} iso */
	function pick(iso) {
		close();
		button.setAttribute("date-value", iso.toString());
		button.dispatchEvent(new Event("calendarInsert"));
	}

	function place() {
		const rect = button.getBoundingClientRect();
		const width = popup.offsetWidth;
		const gutter = 16;
		const start = popup.dir == "rtl" ? rect.right - width : rect.left;
		const left = Math.min(Math.max(start, gutter), document.documentElement.clientWidth - width - gutter);
		popup.style.left = `${left + window.scrollX}px`;
		popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
	}

	/** @param {PointerEvent} event */
	const outside = event => {
		const target = /** @type {Node} */ (event.target);
		if (!popup.contains(target) && !button.contains(target)) close();
	};
	/** @param {KeyboardEvent} event */
	const escape = event => {
		if (event.key == "Escape") { close(); button.focus(); }
	};

	function close() {
		popup.remove();
		button.setAttribute("aria-expanded", "false");
		document.removeEventListener("pointerdown", outside, true);
		document.removeEventListener("keydown", escape);
		window.removeEventListener("resize", close);
		closeOpen = null;
	}

	render();
	place();
	button.setAttribute("aria-expanded", "true");
	document.addEventListener("pointerdown", outside, true);
	document.addEventListener("keydown", escape);
	window.addEventListener("resize", close);
	closeOpen = close;
	focusDay();
}
