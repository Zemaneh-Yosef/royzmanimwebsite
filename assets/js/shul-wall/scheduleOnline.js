// @ts-check
import './zman-schedule.js'

import { scheduleSettings } from "./base.js";
import { parse as parseIni } from "../../libraries/ini.js";
import { parse as parseToml } from "../../libraries/toml.mjs";
import * as xlsx from "../../libraries/xlsx.js";

/**
 * @param {string | URL | Request} url
 * @param {"return"|"comma"|"newline"} arrayBehavior
 */
export async function loadIniSchedule(url, silent=false, arrayBehavior="return") {
	const iniText = await (await fetch(url)).text();
	const iniObj = parseIni(iniText);

	return await loadSchedule(iniObj, silent, arrayBehavior);
}

/**
 * @param {string | URL | Request} url
 * @param {"return"|"comma"|"newline"} arrayBehavior
 */
export async function loadTomlSchedule(url, silent=false, arrayBehavior="return") {
	const tomlText = await (await fetch(url)).text();
	const tomlObj = parseToml(tomlText);

	return await loadSchedule(tomlObj, silent, arrayBehavior);
}

/**
 * @param {string | URL | Request} url
 * @param {"return"|"comma"|"newline"} arrayBehavior
 */
export async function loadJsonSchedule(url, silent=false, arrayBehavior="return") {
	const jsonText = await (await fetch(url)).json();
	return await loadSchedule(jsonText, silent, arrayBehavior);
}

/**
 * @param {string | URL | Request} url
 * @param {"return"|"comma"|"newline"} arrayBehavior
 */
export async function loadExcelSchedule(url, silent=false, arrayBehavior="return") {
	const iniText = await (await fetch(url)).arrayBuffer();
	const workbook = xlsx.read(iniText, { type: "array" });

	return await loadSchedule(mapSheetColumns(workbook.Sheets), silent, arrayBehavior);
}

/**
 * @param {Record<string, string | Record<string, string> | string[]>} data
 * @param {"return"|"comma"|"newline"} arrayBehavior
 */
export async function loadSchedule(data, silentFail = false, arrayBehavior = "return") {
    /** @type {Record<string, any>} */
    const unprocessedEntries = {};

    for (const [sectionKey, value] of Object.entries(data)) {
        const elemForSimpID = document.getElementById(sectionKey);
        if (typeof value == "string" || typeof value == "number") {
            if (!elemForSimpID) {
                if (silentFail) {
                    console.warn(`Element with id "${elemForSimpID}" (from section [${sectionKey}]) not found`);
                } else {
                    throw new Error(`Element with id "${elemForSimpID}" (from section [${sectionKey}]) not found`)
                }
            } else {
                document.getElementById(sectionKey).innerHTML = String(value);
            }
            continue;
        } else if (Array.isArray(value)) {
            if (!elemForSimpID) {
                if (silentFail) {
                    console.warn(`Element with id "${elemForSimpID}" (from section [${sectionKey}]) not found`);
                } else {
                    throw new Error(`Element with id "${elemForSimpID}" (from section [${sectionKey}]) not found`)
                }
            } else {
                switch (arrayBehavior) {
                    case 'comma':
                        document.getElementById(sectionKey).innerHTML = value.join(", ");
                        break;
                    case 'newline':
                        document.getElementById(sectionKey).innerHTML = value.join("<br>")
                        break;
                    case 'return':
                    default:
                        unprocessedEntries[sectionKey] = value;
                        break;
                }
            }
            continue;
        }

        // 1. Split section key
        const parts = sectionKey.split(" ");
        const elemId = parts.shift();          // "shabbat"
        const titleOverride = parts.join(" "); // optional title

        const elem = document.getElementById(elemId);

        if (!elem) {
            if (silentFail) {
                console.warn(`Element with id "${elemId}" (from section [${sectionKey}]) not found`);
            } else {
                throw new Error(`Element with id "${elemId}" (from section [${sectionKey}]) not found`)
            }
            unprocessedEntries[sectionKey] = value;
            continue;
        }

        // 2. Update header above the element (if a title override is given)
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

        // 3. Prepare the data object, extracting CSS variable keys
        let dataToAssign = value; // default
        if (typeof value === "object" && !Array.isArray(value)) {
            // Create a shallow copy so we don't mutate the original
            dataToAssign = { ...value };
            // Find all keys that look like var(--something)
            const varKeys = Object.keys(dataToAssign).filter(key => /^var\(--.+\)$/.test(key));
            for (const varKey of varKeys) {
                const varName = varKey.slice(4, -1); // extract "--something" from "var(--something)"
                const varValue = String(dataToAssign[varKey]);
                // Apply the CSS variable to this specific element
                elem.style.setProperty(varName, varValue);
                // Remove the key from the data object
                delete dataToAssign[varKey];
            }
        }

        // 4. Pass the (filtered) data to the custom element
        if ("data" in elem) {
            // @ts-ignore
            elem.data = dataToAssign;
            continue;
        }

        // 5. If it's not a custom element, it's an error now
        console.error(`Element #${elemId} is not a <zman-schedule>. Migration required.`);
    }

    return unprocessedEntries;
}


/**
 * Convert any sheet-like object containing A# / B# column pairs
 * into a simple { key: value } mapping, using each entry's "w" field.
 *
 * @param {xlsx.WorkSheet} sheetData - The full input object containing one or more sheets.
 * @returns {Record<string, Record<string, string>|string[]>} A new object where each sheet is mapped to { title: time }.
 */
/**
 * Convert any sheet into a simple mapping, supporting:
 * - 1–2 columns → old behavior ({ key: value } or string[])
 * - 3+ columns  → first row = headers, column A = primary key,
 *                 columns B… → nested object mapped to that primary key
 *
 * @param {xlsx.WorkSheet} sheetData - The full workbook object.
 * @returns {Record<string, Record<string, string> | string[]>}
 */
function mapSheetColumns(sheetData) {
    /** @type {Record<string, Record<string, string> | string[]>} */
    const output = {};

    for (const [sheetName, sheet] of Object.entries(sheetData)) {
        // Convert sheet to a 2D array (empty cells become '')
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rows.length === 0) {
            output[sheetName] = {};
            continue;
        }

        // Find the maximum number of columns in any row
        let maxCols = 0;
        for (const row of rows) {
            if (row.length > maxCols) maxCols = row.length;
        }

        // --- Case 1: 1 or 2 columns → original key‑value logic ---
        if (maxCols <= 2) {
            /** @type {Record<string, string>} */
            const pairs = {};
            const titles = [];

            for (const row of rows) {
                const key = String(row[0] || '').trim();
                const val = row[1] !== undefined ? String(row[1]).trim() : undefined;

                if (!key) continue;

                if (val) {
                    pairs[key] = val;
                } else {
                    titles.push(key);
                }
            }

            output[sheetName] = Object.keys(pairs).length > 0 ? pairs : titles;
            continue;
        }

        // --- Case 2: 3+ columns → tabular with headers ---
        // First row = headers (columns B, C, D, …)
        const headerRow = rows[0] || [];
        const headerMap = {};
        for (let c = 1; c < headerRow.length; c++) {
            const h = String(headerRow[c] || `Column${c}`).trim();
            headerMap[c] = h || `Column${c}`;
        }

        const result = {};

        // Process each data row (starting at index 1)
        for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length === 0) continue;

            const primaryKey = String(row[0] || '').trim();
            if (!primaryKey) continue;

            const rowData = {};
            for (let c = 1; c < Math.min(row.length, headerRow.length); c++) {
                const header = headerMap[c];
                const val = row[c] !== undefined ? String(row[c]).trim() : '';
                if (val !== '') {
                    rowData[header] = val;
                }
            }

            // Only store if there is at least one non‑empty value
            if (Object.keys(rowData).length > 0) {
                result[primaryKey] = rowData;
            }
        }

        output[sheetName] = result;
    }

    return output;
}


(async () => {
	if ("schedule" in scheduleSettings && scheduleSettings.schedule !== "manual") {
        ({
            "ini": loadIniSchedule,
            "json": loadJsonSchedule,
            "excel": loadExcelSchedule,
            "toml": loadTomlSchedule,
        })[scheduleSettings.schedule.type](scheduleSettings.schedule.url, undefined, scheduleSettings.schedule.arrayBehavior);
	}
})();