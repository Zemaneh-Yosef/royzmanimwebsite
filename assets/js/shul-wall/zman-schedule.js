// @ts-check

import { methodNames } from "../ROYZmanim.js";
import autoSchedule from "./auto-schedule.js";

/** @type {Record<string, Partial<{ ru: string; et: string; en: string; hb: string; }>>} */
const localizedIndividual = {
	"selihot": {
		hb: "סליחות",
		en: "Selichot",
		et: "Seliḥot",
		ru: "Селихот"
	},
	"shacharit": {
		hb: "שחרית",
		en: "Shacharit",
		et: "Shaḥarit",
		ru: "Шахарит"
	},
	"mincha": {
		hb: "מנחה",
		en: "Mincha",
		et: "Minḥa",
		ru: "Минха"
	},
	"minchaArvit": {
		hb: "מנחה וערבית",
		en: "Mincha & Arvit",
		et: "Minḥa & Arvit",
		ru: "Минха и Арвит"
	},
	"arvit": {
		hb: "ערבית",
		en: "Arvit",
		et: "Arvit",
		ru: "Арвит"
	},

	"seudatShlishitMincha": {
		hb: "מנחה + סעודת שלישית",
		en: "Mincha + Seudat Shelishit",
		et: "Minḥa + Seudat Shelishit",
		ru: "Минха + Сеудат Шелишит"
	},
	"hachnasatShabbat": {
		hb: "הכנסת שבת<br>(מנחה, קבלת שבת וערבית)",
		en: "Hakhnasat Shabbat<br>(Mincha, Kabbalat Shabbat & Arvit)",
		et: "Hakhnasat Shabbat<br>(Minḥa, Kabbalat Shabbat & Arvit)",
		ru: "Встреча Шаббата<br>(Минха, Каббалат Шаббат и Арвит)"
	},

	"earlyMincha": {
		hb: "מנחה מוקדמת",
		en: "Early Mincha",
		et: "Early Minḥa",
		ru: "Ранняя Минха"
	},

	"afternoonShiur": {
		hb: "שיעור אחר הצהריים",
		en: "Afternoon Shiur",
		et: "Afternoon Shiur",
		ru: "Послеполуденный Шиур"
	},
	"morningShiur": {
		hb: "שיעור בוקר",
		en: "Morning Shiur",
		et: "Morning Shiur",
		ru: "Утренний Шиур"
	},

	"mainShaharit": {
		hb: "שחרית ראשית",
		en: "Main Shacharit",
		et: "Main Shaḥarit",
		ru: "Основной Шахарит"
	},
	"youthShaharit": {
		hb: "שחרית לנערים",
		en: "Youth Shacharit",
		et: "Youth Shaḥarit",
		ru: "Шахарит для молодежи"
	},

	"selichot1": {
		hb: "סליחות ראשונות",
		en: "1st Selichot",
		et: "1st Seliḥot",
		ru: "1-й Селихот"
	},
	"shacharit1": {
		hb: "שחרית ראשונה",
		en: "1st Shacharit",
		et: "1st Shaḥarit",
		ru: "1-й Шахарит"
	},
	"selichot2": {
		hb: "סליחות שניות",
		en: "2nd Selichot",
		et: "2nd Seliḥot",
		ru: "2-й Селихот"
	},
	"shacharit2": {
		hb: "שחרית שנייה",
		en: "2nd Shacharit",
		et: "2nd Shaḥarit",
		ru: "2-й Шахарит"
	}
}

const intervalTokens = ["05", "10", "15", "30"];
const methodPattern = methodNames.filter(m => m.startsWith("get")).join("|");
const typePattern = ["we", "sh", "eSh", "nWe", "uCh"].join("|");

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

            if (typeof rowTime === "string" && this.isAutoSchedule(rowTime)) {
                this.applyAutoScheduleAttributes(timeDiv, rowTime);
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

    // -------------------------------
    //  Title Rendering Logic
    // -------------------------------
    /**
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

    // -------------------------------
    //  Autoschedule Metadata
    // -------------------------------
    /**
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