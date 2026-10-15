// @ts-check

import { methodNames } from "../ROYZmanim.js";
import autoSchedule from "./auto-schedule.js";

const STYLED_SPAN_RE = /^<span data-zy-inserted-style style="([^"]*)">([\s\S]*)<\/span>$/;

/** @type {Record<string, Partial<{ ru: string; "he-Latn": string; en: string; he: string; }>>} */
const localizedIndividual = {
	"selihot": {
		he: "סליחות",
		en: "Selichot",
		"he-Latn": "Seliḥot",
		ru: "Селихот"
	},
	"shacharit": {
		he: "שחרית",
		en: "Shacharit",
		"he-Latn": "Shaḥarit",
		ru: "Шахарит"
	},
	"mincha": {
		he: "מנחה",
		en: "Mincha",
		"he-Latn": "Minḥa",
		ru: "Минха"
	},
	"minchaArvit": {
		he: "מנחה וערבית",
		en: "Mincha & Arvit",
		"he-Latn": "Minḥa & Arvit",
		ru: "Минха и Арвит"
	},
	"arvit": {
		he: "ערבית",
		en: "Arvit",
		"he-Latn": "Arvit",
		ru: "Арвит"
	},

	"seudatShlishitMincha": {
		he: "מנחה + סעודת שלישית",
		en: "Mincha + Seudat Shelishit",
		"he-Latn": "Minḥa + Seudat Shelishit",
		ru: "Минха + Сеудат Шелишит"
	},
	"hachnasatShabbat": {
		he: "הכנסת שבת<br>(מנחה, קבלת שבת וערבית)",
		en: "Hakhnasat Shabbat<br>(Mincha, Kabbalat Shabbat & Arvit)",
		"he-Latn": "Hakhnasat Shabbat<br>(Minḥa, Kabbalat Shabbat & Arvit)",
		ru: "Встреча Шаббата<br>(Минха, Каббалат Шаббат и Арвит)"
	},

	"earlyMincha": {
		he: "מנחה מוקדמת",
		en: "Early Mincha",
		"he-Latn": "Early Minḥa",
		ru: "Ранняя Минха"
	},

	"afternoonShiur": {
		he: "שיעור אחר הצהריים",
		en: "Afternoon Shiur",
		"he-Latn": "Afternoon Shiur",
		ru: "Послеполуденный Шиур"
	},
	"morningShiur": {
		he: "שיעור בוקר",
		en: "Morning Shiur",
		"he-Latn": "Morning Shiur",
		ru: "Утренний Шиур"
	},

	"mainShaharit": {
		he: "שחרית ראשית",
		en: "Main Shacharit",
		"he-Latn": "Main Shaḥarit",
		ru: "Основной Шахарит"
	},
	"youthShaharit": {
		he: "שחרית לנערים",
		en: "Youth Shacharit",
		"he-Latn": "Youth Shaḥarit",
		ru: "Шахарит для молодежи"
	},

	"selichot1": {
		he: "סליחות ראשונות",
		en: "1st Selichot",
		"he-Latn": "1st Seliḥot",
		ru: "1-й Селихот"
	},
	"shacharit1": {
		he: "שחרית ראשונה",
		en: "1st Shacharit",
		"he-Latn": "1st Shaḥarit",
		ru: "1-й Шахарит"
	},
	"selichot2": {
		he: "סליחות שניות",
		en: "2nd Selichot",
		"he-Latn": "2nd Seliḥot",
		ru: "2-й Селихот"
	},
	"shacharit2": {
		he: "שחרית שנייה",
		en: "2nd Shacharit",
		"he-Latn": "2nd Shaḥarit",
		ru: "2-й Шахарит"
	}
}

const intervalTokens = ["05", "10", "15", "30"];
const methodPattern = methodNames.filter(m => m.startsWith("get")).join("|");
const typePattern = ["we", "sh", "eSh", "nWe", "uCh", "sUM"].join("|");

const regex = new RegExp(
	`^(?<type>${typePattern})\\|` +
	`(?<method>${methodPattern})\\|` +
	`(?<sign>[+-])` +
	`(?<hours>\\d{2}):(?<minutes>\\d{2})` +
	`(?<mode>re|rl|rc|rx|ex)(?<interval>${intervalTokens.join("|")})?$`
);

class ZmanSchedule extends HTMLElement {
	constructor() {
		super();
		/** @type {Record<string, string>} */
		this._data = null;
	}

	set data(value) {
		this._data = value;
		this.render();
	}

	get data() {
		return this._data;
	}

	connectedCallback() {
		if (this._data) this.render();
	}

	/**
	 * If html is exactly a style span the Excel loader inserted, returns
	 * its style string and inner text separately. Otherwise passes html
	 * through unchanged.
	 * @param {string} html
	 */
	unwrapStyledSpan(html) {
		const match = STYLED_SPAN_RE.exec(html);
		if (!match) return { style: null, inner: html };
		return { style: match[1], inner: match[2] };
	}

	render() {
		if (!this._data) return;

		// Clear existing content except data-keep
		for (const li of this.querySelectorAll("li")) {
			if (!li.hasAttribute("data-keep")) li.remove();
		}

		const frag = document.createDocumentFragment();

		for (const [rowTitle, rowTime] of Object.entries(this._data)) {
			const fullWidth = rowTitle.startsWith("fullWidthDescription");

			const li = document.createElement("li");
			li.classList.add(
				"list-group-item",
				fullWidth ? "schedule-entry-grid" : "d-flex",
				"justify-content-between",
				"align-items-center"
			);

			// -------------------------------
			//  Title Rendering
			// -------------------------------
			const titleDiv = document.createElement("div");
			titleDiv.innerHTML = this.renderTitle(rowTitle, fullWidth);
			li.appendChild(titleDiv);

			// -------------------------------
			//  Time Rendering
			// -------------------------------
			const timeDiv = document.createElement("div");

			if (typeof rowTime === "string") {
				const { style: cellStyle, inner: rawTime } = this.unwrapStyledSpan(rowTime);

				if (this.isAutoSchedule(rawTime)) {
					// The autoscheduler owns timeDiv's contents from here on, so any
					// Excel-provided style moves to the container instead of a nested
					// span that would just get clobbered.
					if (cellStyle) timeDiv.setAttribute("style", cellStyle);
					this.applyAutoScheduleAttributes(timeDiv, rawTime);
				} else {
					timeDiv.innerHTML = rowTime; // literal text — the styled span (if any) renders as-is
				}
			} else {
				timeDiv.innerHTML = rowTime;
			}

			li.appendChild(timeDiv);

			// -------------------------------
			//  Full-width description
			// -------------------------------
			if (fullWidth) {
				const desc = document.createElement("div");
				desc.innerHTML = rowTitle.split("|")[2];
				li.appendChild(desc);
			}

			frag.appendChild(li);
		}

		this.appendChild(frag);

		this.runAutoSchedule();
	}

	/**
	 * @param {string} rowTime
	 */
	isAutoSchedule(rowTime) {
		return regex.test(rowTime);
	}

	/**
	 * Title Rendering Logic
	 * @param {string} rowTitle
	 * @param {boolean} fullWidth
	 */
	renderTitle(rowTitle, fullWidth) {
		if (fullWidth) {
			rowTitle = rowTitle.split("|")[1];
		}

		if (!rowTitle.startsWith("preFormatTitle-"))
			return rowTitle;

		const [key, suffix] = rowTitle.replace("preFormatTitle-", "").split(" ");

		const localized = localizedIndividual[key];
		if (!localized) return rowTitle;

		// Build multilingual spans wrapped in <b>
		const spans = Object.entries(localized)
			.map(([lang, text]) =>
				`<span class="langTV lang-${lang}"><b>${text}</b></span>`
			)
			.join("");

		return `${spans}${suffix || ""}`;
	}

	/**
	 * Autoschedule Metadata Applier
	 * @param {HTMLDivElement} elem
	 * @param {string} expr
	 */
	applyAutoScheduleAttributes(elem, expr) {
		const { groups } = expr.match(regex);

		elem.dataset.autoscheduleType = groups.type;
		elem.dataset.autoscheduleFunction = groups.method;
		elem.dataset.autoschedulePlusorminus = groups.sign;
		elem.dataset.autoscheduleHours = groups.hours;
		elem.dataset.autoscheduleMinutes = groups.minutes;

		if (groups.interval) {
			elem.dataset.autoscheduleRoundinterval = groups.interval;
			elem.dataset.autoscheduleRoundmode = groups.mode;
		} else {
			elem.dataset.autoscheduleRoundmode = groups.mode;
		}
	}

	// -------------------------------
	//  Autoschedule Runner
	// -------------------------------
	async runAutoSchedule() {
		const autos = this.querySelectorAll("[data-autoschedule-type]");
		if (!autos.length) {
			console.log(`ZmanSchedule ${this.id}: No autoschedule entries found.`);
			return;
		}

		autoSchedule(autos);
	}
}

customElements.define("zman-schedule", ZmanSchedule);
export default ZmanSchedule;
export { localizedIndividual };