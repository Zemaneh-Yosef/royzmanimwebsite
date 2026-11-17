// @ts-check

/**
 * The Hazon Yosef page: the shared list (zmanim-list.js) with the rulings of Hazon Yosef, which never follow
 * the calendar's settings, its place selector (hazon-yosef/selector.js), week strip and parasha title, and
 * its Shabbat and holiday cards (hazon-yosef/cards.js, drawn on each render).
 */

import * as KosherZmanim from "../../libraries/kosherZmanim/kosher-zmanim.js";
import ZmanimList from "../ui/zmanim-list.js";
import { HebrewNumberFormatter } from "../core/WebsiteCalendar.js";
import { isInIsrael } from "../misc/israel.js";
import { setUpLocationSelector } from "./selector.js";
import "./cards.js";

const urlParams = new URLSearchParams(window.location.search);

/** The Sunday a week starts on */
function getStartOfWeek(date = Temporal.Now.plainDateISO()) {
	return date.subtract({ days: date.dayOfWeek % 7 });
}

class HazonYosefList extends ZmanimList {
	/**
	 * @param {KosherZmanim.GeoLocation} geoLocation
	 * @param {() => boolean} isCustomPlace a place the visitor added (it isn't shared)
	 */
	constructor(geoLocation, isCustomPlace) {
		super(Temporal.Now.plainDateISO(geoLocation.getTimeZone()));
		this.isCustomPlace = isCustomPlace;

		/** The week the strip shows */
		this.weekPlainDate = getStartOfWeek();

		for (const weekButtonElem of document.querySelectorAll('[data-zyWeek]')) {
			weekButtonElem.addEventListener('click', () => {
				const weekOffset = parseInt(weekButtonElem.getAttribute('data-zyWeek'));
				this.weekPlainDate = this.weekPlainDate.add({ weeks: weekOffset });
				this.updateWeekListing();
			});
		}

		for (const dayBox of document.getElementsByClassName('day-box')) {
			dayBox.addEventListener('click', () => this.changeDate(Temporal.PlainDate.from(dayBox.getAttribute('data-zyDate'))));
		}

		document.getElementById("shareIcon").addEventListener('click', async () => {
			try {
				if ('share' in navigator)
					await navigator.share(this.shareData);
			} catch (e) {
				console.error(e);
			}
		});

		document.getElementById("embedPage").addEventListener('click', async () => {
			await navigator.clipboard.writeText(`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0"></iframe>`);
			alert("קוד הטמעה הועתק ללוח");
		});

		this.start(geoLocation);
	}

	/**
	 * Hazon Yosef's rulings: Ohr Haḥaim's fixed hours, nightfall 30 fixed minutes in Israel and 7.165° elsewhere,
	 * elevation in Israel (?useElevation= overrides); the evening's haze never moves nightfall here
	 * @param {import("../ui/zmanim-list.js").Refraction} refraction
	 */
	zemanimConfig(refraction) {
		const inIsrael = isInIsrael(this.geoLocation.getLatitude(), this.geoLocation.getLongitude());
		return {
			inIsrael,
			config: {
				elevation: (urlParams.get("useElevation") || inIsrael.toString()) == "true",
				fixedMil: true,
				rtKulah: false,
				candleLighting: 20,
				melakha: /** @type {import("../core/ROYZmanim.js").ZemanimConfig['melakha']} */ (inIsrael ? { minutes: 30, degree: null } : { minutes: null, degree: 7.165 }),
				hazeTzet: false,
				...refraction
			}
		};
	}

	locationShown() {
		this.shareData = {
			title: "זמנים ל" + this.geoLocation.getLocationName(),
			text: 'כל הזמנים לפי שיטת הראש"ל הרב יצחק יוסף רק על זמני יוסף',
			url: window.location.href
		};

		const shareIcon = document.getElementById("shareIcon");
		if ('canShare' in navigator && navigator.canShare(this.shareData) && !this.isCustomPlace())
			shareIcon.style.removeProperty('display');
		else
			shareIcon.style.display = 'none';
	}

	/** midnight can be up next too; the Ḥatzoth card marks it */
	upcomingExtras() {
		return [this.zmanCalc.getSolarMidnight()];
	}

	/** @param {string} zmanId @param {import("../ui/zmanim-list.js").ZmanInfo} info */
	isUpNext(zmanId, info) {
		return super.isUpNext(zmanId, info) || (zmanId == 'hatzoth' && this.isNextUpcomingZman(this.zmanCalc.getSolarMidnight()));
	}

	renderPage() {
		this.updateWeekListing();
		this.renderParashaTitle();
	}

	updateWeekListing(date = this.weekPlainDate) {
		const hNum = new HebrewNumberFormatter();
		const weekContainer = document.getElementsByClassName('week-strip')[0];
		const start = getStartOfWeek(date);
		const today = Temporal.Now.plainDateISO(this.geoLocation.getTimeZone());

		for (let i = 0; i < 7; i++) {
			const day = start.add({ days: i });
			const dateElem = weekContainer.children[i];

			dateElem.setAttribute('data-zyDate', day.toString());

			const gregDate = dateElem.getElementsByClassName("gregorian")[0];
			gregDate.innerHTML = "";
			gregDate.appendChild(document.createTextNode(day.toLocaleString("he-IL", { day: "numeric", month: "numeric" })));

			if (day.year !== today.year) {
				gregDate.appendChild(document.createElement("br"));
				gregDate.appendChild(document.createTextNode("(" + day.toLocaleString("he-IL", { year: "numeric" }) + ")"));
			}

			const hebDateElem = dateElem.getElementsByClassName("hebrew-date")[0];
			hebDateElem.innerHTML =
				hNum.formatHebrewNumber(day.withCalendar("hebrew").day) + " " +
				day.toLocaleString("he-IL-u-ca-hebrew", { month: "long" });

			if (day.withCalendar("hebrew").year != today.withCalendar("hebrew").year) {
				hebDateElem.appendChild(document.createElement("br"));
				hebDateElem.appendChild(document.createTextNode("(" + day.toLocaleString("he-IL-u-ca-hebrew", { year: "numeric" }) + ")"));
			}

			dateElem.classList.toggle("current", day.equals(this.jCal.getDate()));
		}
	}

	renderParashaTitle() {
		let parashaText = this.jCal.getHebrewParasha().join(" - ");
		if (parashaText == "No Parasha this week" && this.jCal.shabbat().isCholHamoed())
			parashaText = "חול המועד " + (this.jCal.getDate().withCalendar("hebrew").month == 1 ? "סוכות" : "פסח");
		else if (parashaText == "No Parasha this week" && this.jCal.shabbat().isYomTov())
			parashaText = "שבת " + this.jCal.getYomTovObject()[this.jCal.shabbat().getYomTovIndex()].hebrew;
		else
			parashaText = "פרשת " + parashaText;

		if (this.lastData.parsha !== parashaText) {
			this.lastData.parsha = parashaText;
			for (const parashaElem of document.querySelectorAll('[data-zfReplace="Parasha"]'))
				parashaElem.innerHTML = parashaText;
		}

		for (const jewishYear of document.querySelectorAll('[data-zfReplace="jewishYear"]'))
			jewishYear.innerHTML = this.jCal.shabbat().formatJewishYear().hebrew;
	}
}

/** @type {HazonYosefList} */
let zmanimListUpdater2;
const places = setUpLocationSelector({
	async onChange(newLocation) {
		// showing the new place's today: stay on its today
		const wasToday = zmanimListUpdater2.jCal.getDate().equals(Temporal.Now.plainDateISO(newLocation.getTimeZone()));
		// renders once the stored data for the new place is read
		await zmanimListUpdater2.resetCalendar(newLocation);
		if (wasToday && zmanimListUpdater2.geoLocation === newLocation)
			zmanimListUpdater2.changeDate(Temporal.Now.plainDateISO(newLocation.getTimeZone()));
	}
});
zmanimListUpdater2 = new HazonYosefList(places.geoLocation, places.isCustom);

// @ts-ignore
window.zmanimListUpdater2 = zmanimListUpdater2;
// @ts-ignore
window.KosherZmanim = KosherZmanim;
