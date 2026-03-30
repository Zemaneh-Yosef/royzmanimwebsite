// @ts-check

import * as KosherZmanim from "../../../libraries/kosherZmanim/kosher-zmanim.js";
import {Temporal} from "../../../libraries/kosherZmanim/kosher-zmanim.js";
import { methodNames, zDTFromFunc } from "../../ROYZmanim.js";
import { reload } from "../reload.js";
import { currentZDT, jCal, zmanCalc, dtF, scheduleSettings } from "../base.js";

export default class zmanimListUpdater {
	constructor() {
		/** @type {null|Temporal.ZonedDateTime} */
		this.nextUpcomingZman = null;

		/** @type {null|NodeJS.Timeout} */ // It's not node but whatever
		this.countdownToNextDay = null;

		/** @type {Parameters<typeof jCal.getZmanimInfo>[2]} */
		this.zmanimList = Object.fromEntries(Array.from(document.querySelector('[data-zfFind="calendarFormatter"]').children)
			.map(timeSlot => [timeSlot.getAttribute('data-zmanid'), Object.freeze({
				function: timeSlot.getAttribute('data-timeGetter'),
				yomTovInclusive: timeSlot.getAttribute('data-yomTovInclusive'),
				luachInclusive: timeSlot.getAttribute('data-luachInclusive'),
				condition: timeSlot.getAttribute('data-condition'),
				round: timeSlot.getAttribute('data-round'),
				title: {
					'hb': timeSlot.querySelector('span.langTV.lang-hb').innerHTML,
					'en': timeSlot.querySelector('span.langTV.lang-en').innerHTML,
					'en-et': timeSlot.querySelector('span.langTV.lang-et').innerHTML
				}
			})])
			.filter(
				arrayEntry =>
					arrayEntry[0] !== null
					// @ts-ignore
				&& (arrayEntry[0] == 'candleLighting' || (arrayEntry[1].function && methodNames.includes(arrayEntry[1].function)))
			));

		this.resetCalendar();
	}

	resetCalendar() {
		this.timeoutToChangeDate = null;

		this.setNextUpcomingZman();
		this.changeDate(jCal.getDate())
	}

    setNextUpcomingZman() {
        /** @type {KosherZmanim.Temporal.ZonedDateTime[]} */
        const zmanim = [];
        const currentSelectedDate = zmanCalc.coreZC.getDate();

        for (const days of [0, 1]) {
            this.changeDate(Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone).toPlainDate().add({ days }), true);
            zmanim.push(
                ...Object.values(jCal.getZmanimInfo(false,zmanCalc,this.zmanimList, dtF))
                    .filter(obj => obj.display == 1)
                    .map(time => time.zDTObj)
            );
        }

        this.changeDate(currentSelectedDate, true); //reset the date to the current date
        zmanim.sort(KosherZmanim.Temporal.ZonedDateTime.compare);
        this.nextUpcomingZman = zmanim.find(zman => Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone).until(zman).total({ unit: "milliseconds" }) > 0)

        setTimeout(() => {
            this.setNextUpcomingZman();
            this.updateZmanimList()
        }, Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone).until(this.nextUpcomingZman).total({ unit: "milliseconds" }));
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
				this.timeoutToChangeDate = setTimeout(async () => await reload(), Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone).until(tomorrow).total('milliseconds'));
			} else {
				this.timeoutToChangeDate = null
			}
		}
	}

	updateZmanimList() {
        const lastZmanEntry = Object.entries(this.zmanimList).at(-1);
        /** @type {Temporal.ZonedDateTime} */
        // @ts-ignore
        const lastZman = zmanCalc.chainDate(Temporal.Now.plainDateISO(scheduleSettings.location.timezone))[lastZmanEntry[1].function]();

        let todOrTomJCal, todOrTomZmanCalc;
        if (lastZman.since(Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone)).total('nanoseconds') < 0) {
            todOrTomJCal = jCal.tomorrow();
            todOrTomZmanCalc = zmanCalc.tomorrow();
            document.querySelector('[data-zfFind="whichZemanimDay"]').innerHTML =
                `<span class="langTV lang-hb">זמנים של מחר</span>
                <span class="langTV lang-en">Tomorrow's Zemanim</span>`;
        } else {
            todOrTomJCal = jCal;
            todOrTomZmanCalc = zmanCalc;
            document.querySelector('[data-zfFind="whichZemanimDay"]').innerHTML =
                `<span class="langTV lang-hb">זמנים של היום</span>
                <span class="langTV lang-en">Today's Zemanim</span>`;
        }
		const zmanInfo = todOrTomJCal.getZmanimInfo(false, todOrTomZmanCalc, this.zmanimList, dtF);
		for (const calendarContainer of document.querySelectorAll('[data-zfFind="calendarFormatter"]')) {
			for (const timeSlot of calendarContainer.children) {
				if (!(timeSlot instanceof HTMLElement))
					continue;

				if (!timeSlot.hasAttribute('data-zmanid')) {
					timeSlot.style.setProperty('display', 'none', 'important');
					continue;
				}

				let zmanId = timeSlot.getAttribute('data-zmanid');
				if (!(zmanId in zmanInfo) || zmanInfo[zmanId].display == -1) {
					timeSlot.style.setProperty('display', 'none', 'important');
					continue;
				}

				const timeDisplay = timeSlot.getElementsByClassName('timeDisplay')[0]
				if (zmanInfo[zmanId].display == -2) {
					timeSlot.style.removeProperty("display");
					timeDisplay.lastElementChild.innerHTML = "XX:XX"
					continue;
				}

				timeDisplay.lastElementChild.innerHTML = zmanInfo[zmanId].zDTObj.toLocaleString(...zmanInfo[zmanId].dtF)

                if (zmanInfo[zmanId].title.hb)
                    timeSlot.querySelector('.lang-hb').innerHTML = zmanInfo[zmanId].title.hb

                if (zmanInfo[zmanId].title.en)
                    timeSlot.querySelector('.lang-en').innerHTML = zmanInfo[zmanId].title.en

                if (zmanInfo[zmanId].title["en-et"])
                    timeSlot.querySelector('.lang-et').innerHTML = zmanInfo[zmanId].title["en-et"];

				// Calculate but hide! Can be derived via Inspect Element
				if (!zmanInfo[zmanId].display)
					timeSlot.style.setProperty('display', 'none', 'important');
				else {
					timeSlot.style.removeProperty('display')
				}
			}
			calendarContainer.classList.remove("loading")
		}
	}

	/**
	 * @param {KosherZmanim.Temporal.ZonedDateTime} zman
	 */
	isNextUpcomingZman(zman) {
		return !(this.nextUpcomingZman == null || !(zman.equals(this.nextUpcomingZman)))
	};
}

const zmanimListUpdater2 = new zmanimListUpdater()

// @ts-ignore
window.zmanimListUpdater2 = zmanimListUpdater2;
// @ts-ignore
window.KosherZmanim = KosherZmanim;