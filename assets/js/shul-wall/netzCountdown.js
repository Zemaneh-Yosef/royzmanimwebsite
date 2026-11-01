// @ts-check

/** @import {gsap as tsGsap} from 'gsap' */
import { gsap as jsGsap } from "../../libraries/gsap.js";

import { zDTFromFunc } from "../ROYZmanim.js";
import { scheduleSettings, zmanCalc, onZmanimUpdate } from "./base.js";

if (!('timers' in window))
    // @ts-ignore
    window.timers = {}

/** @type {tsGsap} */
// @ts-ignore
const gsap = jsGsap;

gsap.defaults({
	ease: "expo.inOut",
	duration: 1
});

/** @type {HTMLElement} */
// @ts-ignore
const timerEl = document.getElementsByClassName('timer--clock')[0];
const hebDate = zmanCalc.coreZC.getDate().withCalendar("hebrew");

class CountDown {
	/**
	 * @param {Element} timerElem
	 */
	constructor(timerElem, timezoneOrigin = scheduleSettings.location.timezone) {
		this.countDownElems = [
			timerElem.firstElementChild,
			timerElem.lastElementChild
		].map(contEl => contEl.children)
		this.tzOrigin = timezoneOrigin;
		/** @type {Temporal.ZonedDateTime | null} the time being counted down to; anything else stops ticking */
		this.target = null;
		this.finished = false;
	}

	/** @param {Temporal.ZonedDateTime} zDT */
	start(zDT) {
		if (this.finished) {
			// faded out for a time that, with newer data, hasn't come yet
			gsap.set(timerEl, { clearProps: "opacity" });
			this.finished = false;
		}
		this.target = zDT;
		requestAnimationFrame(() => this.updateTimer(zDT));
	}

	/** Stops counting (the next tick of the old countdown sees it's no longer the target). */
	stop() {
		this.target = null;
	}

	countdownFinished() {
		this.finished = true;
		gsap.to(timerEl, { opacity: 0.2, duration: 1 });
	}

	/**
	 * @param {Temporal.ZonedDateTime} zDT
	 */
	updateTimer(zDT) {
		if (zDT !== this.target)
			return;
		timerEl.style.removeProperty('display');
		if (Temporal.ZonedDateTime.compare(Temporal.Now.zonedDateTimeISO(this.tzOrigin), zDT) == 1)
			return this.countdownFinished();

		const dur = Temporal.Now.zonedDateTimeISO(this.tzOrigin).until(zDT);
		const seconds = dur.seconds.toString().padStart(2, '0');
		let minutes = Math.floor(dur.total('minutes')).toString().padStart(2, '0');
		minutes = {
			'100': '0C',
			'101': 'CI'
		}[minutes] || minutes;

		/** @type {[string, string, string, string]} */
		// @ts-ignore
		const timeNumbers = (minutes + seconds).split('').slice(-4);
		this.updateTimerDisplay(timeNumbers);

		// @ts-ignore
		window.timers.countDownTillNextSec =
			setTimeout(
				() => requestAnimationFrame(() => this.updateTimer(zDT)),
				Temporal.Now.zonedDateTimeISO(this.tzOrigin)
					.until(Temporal.Now.zonedDateTimeISO(this.tzOrigin).add({ seconds: 1 }).with({ nanosecond: 0, microsecond: 0, millisecond: 0}))
					.total('milliseconds')
			);
	}

	/** * @param {[string, string, string, string]} arr */
	updateTimerDisplay(arr) {
		this.animateNum(this.countDownElems[0][0], arr[0]);
		this.animateNum(this.countDownElems[0][1], arr[1]);
		this.animateNum(this.countDownElems[1][0], arr[2]);
		this.animateNum(this.countDownElems[1][1], arr[3]);
	}

	/**
	 * @param {Element} group
	 * @param {string} arrayValue
	 */
	animateNum(group, arrayValue) {
		gsap.timeline().killTweensOf(group.getElementsByClassName('number-grp-wrp')[0]);
		gsap.to(group.getElementsByClassName('number-grp-wrp')[0], {
			y: -group.getElementsByClassName('num-' + arrayValue)[0].offsetTop,
			duration: 1
		});
	}
}

// Four environments exist that need countdown
// 1. Poalim - From 90 minute Alot -> Regular Alot, Alot->Misheyakir
// 2. Netz Minyanim - Netz
// 3. Factory Minyanim - Sof Zman Tefila
// 4. Hatzot Layla Selihot - S&P repellent


const counter = new CountDown(timerEl);

/** Starts (or schedules) whichever countdown applies now. Safe to run again. */
function startCountdowns() {
	const wasCounting = counter.target !== null;
	counter.stop();
	let scheduled = false;
	// @ts-ignore
	for (const key of ['countDownTillNextSec', 'hatzotLaylah', 'untilNetzCountdown']) clearTimeout(window.timers[key]);

	if (hebDate.month == hebDate.monthsInYear || (hebDate.month == 1 && hebDate.day >= 2 && hebDate.day < 10)) {
		if (zmanCalc.chainDate(zmanCalc.coreZC.getDate().subtract({ days: 1 })).getSolarMidnight().dayOfYear
			== Temporal.Now.plainDateISO(scheduleSettings.location.timezone).dayOfYear
			&& Temporal.ZonedDateTime.compare(
				Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone),
				zmanCalc.chainDate(zmanCalc.coreZC.getDate().subtract({ days: 1 })).getSolarMidnight())
			< 1
			&& hebDate.dayOfWeek !== 6) {
			counter.start(zmanCalc.chainDate(zmanCalc.coreZC.getDate().subtract({ days: 1 })).getSolarMidnight())
		} else if (zmanCalc.getSolarMidnight().dayOfYear == Temporal.Now.plainDateISO(scheduleSettings.location.timezone).dayOfYear
			&& Temporal.ZonedDateTime.compare(
				Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone),
				zmanCalc.getSolarMidnight())
			< 1
			&& hebDate.dayOfWeek !== 5) {
			if (Temporal.ZonedDateTime.compare(
				Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone),
				zmanCalc.getSolarMidnight().subtract({ minutes: 15 })
			) == 1) {
				scheduled = true;
				// @ts-ignore
				window.timers.hatzotLaylah = setTimeout(() => {
					counter.start(zmanCalc.getSolarMidnight())
				}, Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone).until(zmanCalc.getSolarMidnight().subtract({ minutes: 15 })).total('milliseconds'))
			} else {
				counter.start(zmanCalc.getSolarMidnight())
			}
		}
	}

	const netz = zDTFromFunc(zmanCalc.getNetz())
	if (rangeDates(zmanCalc.getMisheyakir(), Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone), netz)) {
		const launchCountdown = () => counter.start(netz)
		const untilCountdown = Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone)
			.until(netz.subtract({ minutes: 101 }))
			.total('milliseconds');

		scheduled = true;
		// @ts-ignore
		window.timers.untilNetzCountdown = setTimeout(launchCountdown, Math.max(untilCountdown, 500));
	}

	// it was counting down to a time the new data says has passed
	if (wasCounting && counter.target === null && !scheduled)
		counter.countdownFinished();
}

startCountdowns();
// better refraction data arrived after the first draw
onZmanimUpdate("netzCountdown", startCountdowns);

/**
 * @param {Temporal.ZonedDateTime} start
 * @param {Temporal.ZonedDateTime} middle
 * @param {Temporal.ZonedDateTime} end
 */
function rangeDates(start, middle, end, inclusive=true) {
	const acceptedValues = [1];
	if (inclusive)
	  acceptedValues.push(0);

	return acceptedValues.includes(Temporal.ZonedDateTime.compare(middle, start)) && acceptedValues.includes(Temporal.ZonedDateTime.compare(end, middle))
};