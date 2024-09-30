// @ts-check
import { parse } from "../../libraries/ini.js";

/** @param {string} url */
export default async function onlineSchedule(url) {
    const iniText = await (await fetch(url)).text();
    const iniObj = parse(iniText);

    for (const [tableKey, value] of Object.entries(iniObj)) {
        if (tableKey == "sponsor") {
            document.getElementById("sponsor").innerHTML = value;
            continue;
        }

        for (const [rowTitle, rowTime] of Object.entries(value)) {
            const localizedName = {
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
            }[rowTitle] || rowTitle;
            document.getElementById(tableKey).innerHTML +=
                `<li class="list-group-item d-flex justify-content-between align-items-center"><div>${localizedName}</div><div>${rowTime}</div></li>`;
        }
    }
}