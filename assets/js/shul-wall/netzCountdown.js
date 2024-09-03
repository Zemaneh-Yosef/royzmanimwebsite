// @ts-check
/** @import {gsap as tsGsap} from 'gsap' */

import { gsap as jsGsap } from "../../libraries/gsap.js";

import { GeoLocation, Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js";
import { AmudehHoraahZmanim, OhrHachaimZmanim } from "../ROYZmanim.js";
import preSettings from "./preSettings.js";

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

/** @type {[string, number, number, number, string]} */
// @ts-ignore
const glArgs = Object.values(preSettings.location).map(numberFunc => numberFunc())
const geoL = new GeoLocation(...glArgs);

const zmanCalc =
    (preSettings.calendarToggle.hourCalculators() == "seasonal" || (geoL.getLocationName() || "").toLowerCase().includes('israel') ?
        new OhrHachaimZmanim(geoL, true) :
        new AmudehHoraahZmanim(geoL));

const timerEl = document.getElementsByClassName('timer--clock')[0];
const hebDate = zmanCalc.coreZC.getDate().withCalendar("hebrew");

class CountDown {
	/**
	 * @param {Element} timerElem
	 */
	constructor(timerElem, timezoneOrigin = preSettings.location.timezone()) {
		this.countDownElems = [
			timerElem.firstElementChild,
			timerElem.lastElementChild
		].map(contEl => contEl.children)
		this.tzOrigin = timezoneOrigin;
	}

	countdownFinished() {
		gsap.to(timerEl, { opacity: 0.2, duration: 1 });
	}

	/**
	 * @param {Temporal.ZonedDateTime} zDT
	 */
	updateTimer(zDT) {
		timerEl.style.removeProperty('display');
		if (Temporal.ZonedDateTime.compare(Temporal.Now.zonedDateTimeISO(this.tzOrigin), zDT) == 1)
			return this.countdownFinished();

		const dur = Temporal.Now.zonedDateTimeISO(this.tzOrigin).until(zDT);
		const minutes = Math.floor(dur.total('minutes')).toString().padStart(2, '0');
		const seconds = dur.seconds.toString().padStart(2, '0');

		/** @type {[string, string, string, string]} */
		// @ts-ignore
		const timeNumbers = (minutes + seconds).split('');
		this.updateTimerDisplay(timeNumbers);

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

const counter = new CountDown(timerEl);
if ([hebDate.monthsInYear, 1].includes(hebDate.month)) {
	if (zmanCalc.chainDate(zmanCalc.coreZC.getDate().subtract({ days: 1 })).getSolarMidnight().dayOfYear
		== Temporal.Now.plainDateISO(preSettings.location.timezone()).dayOfYear
		&& Temporal.ZonedDateTime.compare(
			Temporal.Now.zonedDateTimeISO(preSettings.location.timezone()),
			zmanCalc.chainDate(zmanCalc.coreZC.getDate().subtract({ days: 1 })).getSolarMidnight())
		< 1) {
		requestAnimationFrame(() => counter.updateTimer(zmanCalc.chainDate(zmanCalc.coreZC.getDate().subtract({ days: 1 })).getSolarMidnight()))
	} else if (zmanCalc.getSolarMidnight().dayOfYear == Temporal.Now.plainDateISO(preSettings.location.timezone()).dayOfYear
		&& Temporal.ZonedDateTime.compare(
			Temporal.Now.zonedDateTimeISO(preSettings.location.timezone()),
			zmanCalc.getSolarMidnight())
		< 1) {
		if (Temporal.ZonedDateTime.compare(
			Temporal.Now.zonedDateTimeISO(preSettings.location.timezone()),
			zmanCalc.getSolarMidnight().subtract({ minutes: 15 })
		) == 1) {
			// @ts-ignore
			window.timers.hatzotLaylah = setTimeout(() => {
				requestAnimationFrame(() => counter.updateTimer(zmanCalc.getSolarMidnight()))
			}, Temporal.Now.zonedDateTimeISO(preSettings.location.timezone()).until(zmanCalc.getSolarMidnight().subtract({ minutes: 15 })).total('milliseconds'))
		} else {
			requestAnimationFrame(() => counter.updateTimer(zmanCalc.getSolarMidnight()))
		}
	}
}