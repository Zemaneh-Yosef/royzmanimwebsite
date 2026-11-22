// @ts-check

import * as KosherZmanim from "../../../libraries/kosherZmanim/kosher-zmanim.js";
import { methodNames } from "../../core/ROYZmanim.js";
import { reload } from "../reload.js";
import { jCal, zmanCalc, dtF, scheduleSettings, onZmanimUpdate } from "../base.js";
import { readRows, wallTitles, fillRow } from "../../ui/zmanim-rows.js";

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

export default class zmanimListUpdater {
	constructor() {
		/** @type {null|NodeJS.Timeout} */ // It's not node but whatever
		this.countdownToNextDay = null;

		/** @type {Parameters<typeof jCal.getZmanimInfo>[2]} */
		// @ts-ignore
		this.zmanimList = readRows(document.querySelector('[data-zfFind="calendarFormatter"]').children, { methodNames, titles: wallTitles });

		this.resetCalendar();
	}

	resetCalendar() {
		this.timeoutToChangeDate = null;
		this.changeDate(jCal.getDate())
	}

	/**
	 * @param {Temporal.PlainDate} date
	 * @param {boolean} internal
	 */
	changeDate(date, internal=false) {
		zmanCalc.setDate(date)
		jCal.setDate(date);

		if (!internal) {
			this.updateZmanimList();
			if (date.equals(Temporal.Now.plainDateISO(scheduleSettings.location.timezone))) {
				const tomorrow = Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone)
					.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0, millisecond: 0 })
				// @ts-ignore
				this.timeoutToChangeDate = window.timers.spotlightDayChange = setTimeout(async () => await reload(), Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone).until(tomorrow).total('milliseconds'));
			} else {
				this.timeoutToChangeDate = null
			}
		}
	}

	/**
	 * Which list is up, by the time of day:
	 *  - "today": today's zemanim, until chatzot hayom
	 *  - "blend": today's afternoon first, then tonight's chatzot, then (under a divider) tomorrow's morning
	 *  - "tomorrow": tomorrow's zemanim, after the day's last zman
	 * The cards stay where the page put them (morning, the wide chatzot card, afternoon); the blend only
	 * reorders them with CSS `order` and fills the morning cards from tomorrow.
	 */
	updateZmanimList() {
		const tz = scheduleSettings.location.timezone;
		const now = Temporal.Now.zonedDateTimeISO(tz);
		const today = now.toPlainDate();
		const todayCalc = zmanCalc.chainDate(today);

		const lastZmanEntry = Object.entries(this.zmanimList).at(-1);
		/** @type {Temporal.ZonedDateTime} */
		// @ts-ignore
		const lastZman = todayCalc[lastZmanEntry[1].function]();
		/** @type {Temporal.ZonedDateTime} */
		const hatzot = todayCalc.getHatzoth();

		/** @type {"today" | "blend" | "tomorrow"} */
		const mode = Temporal.ZonedDateTime.compare(now, lastZman) >= 0 ? "tomorrow"
			: Temporal.ZonedDateTime.compare(now, hatzot) >= 0 ? "blend"
			: "today";

		document.querySelector('[data-zfFind="whichZemanimDay"]').innerHTML = mode == "tomorrow"
			? `<span class="langTV lang-he">זמנים של מחר</span>
				<span class="langTV lang-en">Tomorrow's Zemanim</span>`
			: `<span class="langTV lang-he">זמנים של היום</span>
				<span class="langTV lang-en">Today's Zemanim</span>`;

		const todayInfo = jCal.getZmanimInfo(false, zmanCalc, this.zmanimList, dtF);
		const tomorrowInfo = jCal.tomorrow().getZmanimInfo(false, zmanCalc.tomorrow(), this.zmanimList, dtF);

		for (const calendarContainer of document.querySelectorAll('[data-zfFind="calendarFormatter"]')) {
			if (!(calendarContainer instanceof HTMLElement))
				continue;
			const divider = this.blendDivider(calendarContainer);
			divider.style.display = mode == "blend" ? "" : "none";

			let afterHatzot = false;
			for (const timeSlot of calendarContainer.children) {
				if (!(timeSlot instanceof HTMLElement) || timeSlot === divider)
					continue;

				if (!timeSlot.hasAttribute('data-zmanid')) {
					timeSlot.style.setProperty('display', 'none', 'important');
					continue;
				}

				const zmanId = timeSlot.getAttribute('data-zmanid');
				const isHatzot = zmanId == 'hatzot';
				const morning = !afterHatzot && !isHatzot;
				if (isHatzot)
					afterHatzot = true;

				if (mode != "blend") {
					timeSlot.style.removeProperty('order');
					this.renderSlot(timeSlot, (mode == "tomorrow" ? tomorrowInfo : todayInfo)[zmanId]);
					continue;
				}

				// blend: afternoon (1), tonight's chatzot (2), the divider (3), tomorrow's morning (4)
				timeSlot.style.order = morning ? "4" : isHatzot ? "2" : "1";
				if (isHatzot)
					this.renderSlot(timeSlot, todayInfo[zmanId], todayCalc.getSolarMidnight());
				else
					this.renderSlot(timeSlot, (morning ? tomorrowInfo : todayInfo)[zmanId]);
			}
			calendarContainer.classList.remove("loading")
		}

		// Reload when each zman passes (as the other walls do), so the schedules and flyers stay current. Draw
		// first, so the list is right even while the reload waits for the network.
		const upcoming = [...Object.values(todayInfo), ...Object.values(tomorrowInfo)]
			.filter(info => info.display == 1 && info.zDTObj && Temporal.ZonedDateTime.compare(info.zDTObj, now) > 0)
			.map(info => info.zDTObj)
			.sort(Temporal.ZonedDateTime.compare);
		// @ts-ignore
		clearTimeout(window.timers.spotlightNextZman);
		if (upcoming.length)
			// @ts-ignore
			window.timers.spotlightNextZman = setTimeout(async () => {
				this.updateZmanimList();
				await reload();
			}, now.until(upcoming[0]).total('milliseconds') + 1000);
	}

	/**
	 * The line between today's afternoon and tomorrow's morning in the blend, labelled like the list's
	 * heading. Made once, from the heading, so it takes each page's own look.
	 * @param {HTMLElement} calendarContainer
	 */
	blendDivider(calendarContainer) {
		/** @type {HTMLElement | null} */
		let divider = calendarContainer.querySelector(':scope > [data-zfFind="blendDivider"]');
		if (divider)
			return divider;

		divider = document.createElement('div');
		divider.setAttribute('data-zfFind', 'blendDivider');
		divider.style.gridColumn = '1 / -1';
		divider.style.order = '3';
		divider.appendChild(document.createElement('hr'));
		const heading = /** @type {HTMLElement} */ (document.querySelector('[data-zfFind="whichZemanimDay"]').cloneNode(false));
		heading.removeAttribute('data-zfFind');
		heading.innerHTML = `<span class="langTV lang-he">זמנים של מחר</span>
			<span class="langTV lang-en">Tomorrow's Zemanim</span>`;
		divider.appendChild(heading);
		calendarContainer.appendChild(divider);
		return divider;
	}

	/**
	 * @param {HTMLElement} timeSlot
	 * @param {ReturnType<typeof jCal.getZmanimInfo>[string] | undefined} info
	 * @param {Temporal.ZonedDateTime} [time] shown instead of the row's own time (tonight's chatzot)
	 */
	renderSlot(timeSlot, info, time) {
		fillRow(timeSlot, info, (slot, title) => {
			for (const lang of /** @type {const} */ (['he', 'en', 'he-Latn'])) {
				const titleElem = slot.querySelector(`.lang-${lang}`);
				if (title[lang] && titleElem)
					titleElem.innerHTML = title[lang];
			}
		}, time);
	}
}

const zmanimListUpdater2 = new zmanimListUpdater()

// better refraction data arrived after the first draw
onZmanimUpdate("daySpotlight", () => {
	// @ts-ignore
	clearTimeout(window.timers.spotlightNextZman);
	// @ts-ignore
	clearTimeout(window.timers.spotlightDayChange);
	zmanimListUpdater2.resetCalendar();
});

// @ts-ignore
window.zmanimListUpdater2 = zmanimListUpdater2;
// @ts-ignore
window.KosherZmanim = KosherZmanim;