// @ts-check
import './zman-schedule.js'

import { scheduleSettings } from "./base.js";
import { parse as parseIni } from "../../libraries/ini.js";
import * as xlsx from "../../libraries/xlsx.mjs";

/** @param {string | URL | Request} url */
export async function loadIniSchedule(url, silent=false) {
	const iniText = await (await fetch(url)).text();
	const iniObj = parseIni(iniText);

	return await loadSchedule(iniObj, silent);
}

/** @param {string | URL | Request} url */
export async function loadJsonSchedule(url, silent=false) {
	const jsonText = await (await fetch(url)).json();
	return await loadSchedule(jsonText, silent);
}

/**
 * @param {string | URL | Request} url
 */
export async function loadExcelSchedule(url, silent=false) {
	const iniText = await (await fetch(url)).arrayBuffer();
	const workbook = xlsx.read(iniText, { type: "array" });

	return await loadSchedule(mapSheetColumns(workbook.Sheets), silent);
}

/**
 * @param {Record<string, string | Record<string, string>>} data
 */
export async function loadSchedule(data, silentFail = false) {
    /** @type {Record<string, any>} */
    const unprocessedEntries = {};

    for (const [sectionKey, value] of Object.entries(data)) {

		if (typeof value == "string" || typeof value == "number") {
			document.getElementById(sectionKey).innerHTML = String(value);
			continue;
		} else if (Array.isArray(value)) {
			unprocessedEntries[sectionKey] = value;
			continue;
		}

        // 1. Split section key
        const parts = sectionKey.split(" ");
        const elemId = parts.shift();          // "shabbat"
        const titleOverride = parts.join(" "); // "Schedule"

        const elem = document.getElementById(elemId);

        if (!elem) {
            if (!silentFail) {
                console.warn(`Element with id "${elemId}" (from section [${sectionKey}]) not found`);
            }
            unprocessedEntries[sectionKey] = value;
            continue;
        }

        // 2. Update header above the element
        if (titleOverride.length) {
            const card = elem.closest(".card");
            let headerElem = card ? card.previousElementSibling : null;

            if (headerElem && headerElem.hasAttribute("data-zfreplace")) {
                headerElem = headerElem.previousElementSibling;
            }

            if (headerElem && headerElem.tagName === "H1") {
                headerElem.innerHTML = titleOverride;
            }
        }

        // 3. Pass data to the custom element
        if ("data" in elem) {
            // @ts-ignore
            elem.data = value;
            continue;
        }

        // 4. If it's not a custom element, it's an error now
        console.error(`Element #${elemId} is not a <zman-schedule>. Migration required.`);
    }

    return unprocessedEntries;
}


/**
 * Convert any sheet-like object containing A# / B# column pairs
 * into a simple { key: value } mapping, using each entry's "w" field.
 *
 * @param {Object} sheetData - The full input object containing one or more sheets.
 * @returns {Record<string, Record<string, string>>} A new object where each sheet is mapped to { title: time }.
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

(async () => {
	if ("schedule" in scheduleSettings && scheduleSettings.schedule !== "manual") {
		if (scheduleSettings.schedule.type === "ini") {
			await loadIniSchedule(scheduleSettings.schedule.url);
		} else if (scheduleSettings.schedule.type === "json") {
			await loadJsonSchedule(scheduleSettings.schedule.url);
		} else if (scheduleSettings.schedule.type === "excel") {
			await loadExcelSchedule(scheduleSettings.schedule.url);
		}
	}
})();