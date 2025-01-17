// @ts-check
import { parse } from "../../libraries/ini.js";

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
export default async function onlineSchedule(url, callback = async () => {}) {
	const iniText = await (await fetch(url)).text();
	const iniObj = parse(iniText);

	let autoSchedule = false;

	for (const [tableKey, value] of Object.entries(iniObj)) {
		if (typeof value == "string") {
			document.getElementById(tableKey).innerHTML = value;
			continue;
		}

		for (const element of document.querySelectorAll(`#${tableKey} li`))
			if (!element.hasAttribute("data-keep"))
				element.remove();

		const regex = /(we|sh)\|(.*)\|(\+|\-)(\d{2}):(\d{2})/;

		/** @type {[string, string][]} */
		const table = Object.entries(value);
		for (const [rowTitle, rowTime] of table) {
			const localizedName = localization[rowTitle] || rowTitle;

			const rowGroup = document.createElement("li");
			rowGroup.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

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
			} else
				timeDiv.innerHTML = rowTime;
			rowGroup.appendChild(timeDiv);

			document.getElementById(tableKey).appendChild(rowGroup);
		}
	}

	if (autoSchedule)
		await import("./auto-schedule.js").then(({ default: autoSchedule }) => autoSchedule());
}