// @ts-check
import * as xlsx from "../../libraries/xlsx.mjs";
import { methodNames } from "../ROYZmanim.js";

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

/** @param {string} url */
export default async function onlineSchedule(url, silent = false) {
	const iniText = await (await fetch(url)).arrayBuffer();
	const workbook = xlsx.read(iniText, { type: "array" });

	console.log(workbook)

	let autoSchedule = false;

	const formattedIniObj = Object.entries(mapSheetColumns(workbook.Sheets));

	for (const formattedIniIndex in formattedIniObj) {
		const [tableKey, value] = formattedIniObj[formattedIniIndex];

		const elemTitle = tableKey.split(" ");
		const elemId = elemTitle.shift(); // Fixes elemTitle as it gets the id

		if (!document.getElementById(elemId)) {
			if (!silent)
				throw new Error(`Table with id ${tableKey} (simple: ${elemId}) not found`);

			continue;
		}

		if (typeof value == "string") {
			document.getElementById(elemId).innerHTML = value;
			continue;
		}

		if (elemTitle.length) {
			let titleElem = document.getElementById(elemId).parentElement.previousElementSibling;
			if (titleElem.hasAttribute('data-zfreplace'))
				titleElem = titleElem.previousElementSibling;

			titleElem.innerHTML = elemTitle.join(" ")
		}

		for (const element of document.querySelectorAll(`#${elemId} li`))
			if (!element.hasAttribute("data-keep"))
				element.remove();

		const regex = new RegExp(`(we|sh|eSh|nWe)\\|(${methodNames.filter(str => str.startsWith('get')).join("|")})\\|(\\+|-)(\\d{2}):(\\d{2})(r(?:05|10|15|30)|e)`);

		/** @type {[string, string][]} */
		const table = Object.entries(value);
		for (const [rowTitle, rowTime] of table) {
			const fullWidthDescription = rowTitle.startsWith('fullWidthDescription');
			const rowTitleKey = fullWidthDescription ? rowTitle.split('|')[1] : rowTitle;
			let localizedName = rowTitleKey;
			if (rowTitleKey.startsWith('preFormatTitle-') && localizedIndividual[rowTitleKey.replace('preFormatTitle-', '')]) {
				localizedName =
					Object.entries(localizedIndividual[rowTitleKey.replace('preFormatTitle-', '')])
						.map(([lang, text]) => `<span class="langTV lang-${lang}">
							<b>${text.split('<br>')[0]}</b>
							${text.includes('<br>') ? '<br>' + text.split('<br>')[1] : ''}
						</span>`).join("");
			}

			const rowGroup = document.createElement("li");
			rowGroup.classList.add("list-group-item", (fullWidthDescription ? 'schedule-entry-grid' : "d-flex"), "justify-content-between", "align-items-center");

			const nameDiv = document.createElement("div");
			nameDiv.innerHTML = localizedName;
			rowGroup.appendChild(nameDiv);

			const timeDiv = document.createElement("div");
			if (regex.test(rowTime)) {
				autoSchedule = true;
				const matchers = rowTime.match(regex);
				timeDiv.setAttribute("data-autoschedule-type", matchers[1]);
				timeDiv.setAttribute("data-autoschedule-function", matchers[2]);
				timeDiv.setAttribute("data-autoschedule-plusorminus", matchers[3]);
				timeDiv.setAttribute("data-autoschedule-hours", matchers[4]);
				timeDiv.setAttribute("data-autoschedule-minutes", matchers[5]);
				timeDiv.setAttribute('data-autoschedule-round', matchers[6]);
			} else
				timeDiv.innerHTML = rowTime;
			rowGroup.appendChild(timeDiv);

			document.getElementById(elemId).appendChild(rowGroup);

			if (fullWidthDescription) {
				const descriptionDiv = document.createElement("div");
				descriptionDiv.innerHTML = rowTitle.split('|')[2]
				rowGroup.appendChild(descriptionDiv);
			}
		}

		// Delete the key from the ini object so we know it's been processed
		delete formattedIniObj[formattedIniIndex];
	}

	if (autoSchedule)
		await import("./auto-schedule.js").then(({ default: autoSchedule }) => autoSchedule());

	return formattedIniObj
}

/**
 * Convert any sheet-like object containing A# / B# column pairs
 * into a simple { key: value } mapping, using each entry's "w" field.
 *
 * @param {Object} sheetData - The full input object containing one or more sheets.
 * @returns {Object} A new object where each sheet is mapped to { title: time }.
 */
function mapSheetColumns(sheetData) {
	/** @type {Record<string, Record<string, string>>} */
	const output = {};

	for (const [sheetName, sheet] of Object.entries(sheetData)) {
		/** @type {Record<string, string>} */
		const mapped = {};

		for (const [key, cell] of Object.entries(sheet)) {
			if (key.startsWith("A")) {
				const index = key.slice(1);
				const title = cell?.w;
				const time = sheet[`B${index}`]?.w;

				if (title && time) {
					mapped[title] = time;
				}
			}
		}

		output[sheetName] = mapped;
	}

	return output;
}
