// @ts-check
import { parse } from "../../libraries/ini.js";
import { methodNames } from "../ROYZmanim.js";

/** @type {Record<string, string>} */
const localization = {
	"selihot1R": `<b>
		<span class="langTV lang-hb">1<sup>st</sup> Seliḥot</span>
		<span class="langTV lang-ru">1-й Селихот</span>
	</b>`,
	"shacharit1R": `<b>
		<span class="langTV lang-hb">1<sup>st</sup> Shaḥarit</span>
		<span class="langTV lang-ru">1-й Шахарит</span>
	</b>`,
	"selihot2R": `<b>
		<span class="langTV lang-hb">2<sup>nd</sup> Seliḥot</span>
		<span class="langTV lang-ru">2-й Селихот</span>
	</b>`,
	"shacharit2R": `<b>
		<span class="langTV lang-hb">2<sup>nd</sup> Shaḥarit</span>
		<span class="langTV lang-ru">2-й Шахарит</span>
	</b>`,
	"shacharitR": `<b>
		<span class="langTV lang-hb">Shaḥarit</span>
		<span class="langTV lang-ru">Шахарит</span>
	</b>`,
	"minchaR": `<b>
		<span class="langTV lang-hb">Minḥa</span>
		<span class="langTV lang-ru">Минха</span>
	</b>`,
	"minchaArvitR": `<b>
		<span class="langTV lang-hb">Minḥa & Arvit</span>
		<span class="langTV lang-ru">Минха и Арвит</span>
	</b>`,
	"arvitR": `<b>
		<span class="langTV lang-hb">Arvit</span>
		<span class="langTV lang-ru">Арвит</span>
	</b>`,
	"seudatShlishitMinchaR": `<b>
		<span class="langTV lang-hb">Minḥa + Seudat Shelishit</span>
		<span class="langTV lang-ru">Минха + Сеудат Шелишит</span>
	</b>`,
	"hachnasatShabbatR":
		`<span class="langTV lang-hb"><b>Hakhnasat Shabbat</b><br>(Minḥa, Kabbalat Shabbat & Arvit)</span>
		<span class="langTV lang-ru"><b>Встреча Шаббата</b><br>(Минха, Каббалат Шаббат и Арвит)</span>`,
	"earlyMinchaR": `<b>
		<span class="langTV lang-hb">Early Minḥa</span>
		<span class="langTV lang-ru">Ранняя Минха</span>
	</b>`,
	"afternoonShiurR": `<b>
		<span class="langTV lang-hb">Afternoon Shiur</span>
		<span class="langTV lang-ru">Послеполуденный Шиур</span>
	</b>`,
	"morningShiurR": `<b>
		<span class="langTV lang-hb">Morning Shiur</span>
		<span class="langTV lang-ru">Утренний Шиур</span>
	</b>`,
	"mainShaharitR": `<b>
		<span class="langTV lang-hb">Main Shaḥarit</span>
		<span class="langTV lang-ru">Основной Шахарит</span>
	</b>`,
	"youthShaharitR": `<b>
		<span class="langTV lang-hb">Youth Shaḥarit</span>
		<span class="langTV lang-ru">Шахарит для молодежи</span>
	</b>`,
}

/** @param {string} url */
export default async function onlineSchedule(url, silent=false) {
	const iniText = await (await fetch(url)).text();
	const iniObj = parse(iniText);

	let autoSchedule = false;

	for (const [tableKey, value] of Object.entries(iniObj)) {
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
			document.getElementById(elemId).parentElement.previousElementSibling.innerHTML = elemTitle.join(" ")
		}

		for (const element of document.querySelectorAll(`#${elemId} li`))
			if (!element.hasAttribute("data-keep"))
				element.remove();

		const regex = new RegExp(`(we|sh)\\|(${methodNames.filter(str => str.startsWith('get')).join("|")})\\|(\\+|-)(\\d{2}):(\\d{2})(r(?:05|10|15|30)|e)`);

		/** @type {[string, string][]} */
		const table = Object.entries(value);
		for (const [rowTitle, rowTime] of table) {
			let localizedName = localization[rowTitle] || rowTitle;
			const fullWidthDescription = localizedName.startsWith('fullWidthDescription');
			if (fullWidthDescription)
				localizedName = localizedName.split('|')[1];

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
				descriptionDiv.innerHTML = (localization[rowTitle] || rowTitle).split('|')[2]
				rowGroup.appendChild(descriptionDiv);
			}
		}
	}

	if (autoSchedule)
		await import("./auto-schedule.js").then(({ default: autoSchedule }) => autoSchedule());
}
