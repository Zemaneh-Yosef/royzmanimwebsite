// @ts-check
import './zman-schedule.js'

import { scheduleSettings } from "./base.js";
import { parse as parseIni } from "../../libraries/ini.js";
import { parse as parseToml } from "../../libraries/toml.mjs";
import * as xlsx from "../../libraries/xlsx.js";
import JSZip from "../../libraries/jszip/jszip.js";

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
 * Loads an Excel schedule. Cell text comes from your regular (unpatched,
 * latest) SheetJS build; cell styling (font/fill) is read independently,
 * straight out of the underlying OOXML, via readXlsxStyles()/styleForCell()
 * below — no dependency on SheetJS's Pro-only cellStyles read support.
 *
 * @param {string | URL | Request} url
 * @param {"return"|"comma"|"newline"} arrayBehavior
 */
export async function loadExcelSchedule(url, silent=false, arrayBehavior="return") {
	const buf = await (await fetch(url)).arrayBuffer();
	const workbook = xlsx.read(buf, { type: "array" });
	const styleData = await readXlsxStyles(buf);

	return await loadSchedule(mapSheetColumns(workbook.Sheets, styleData), silent, arrayBehavior);
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
 * Convert any sheet into a simple mapping, supporting:
 * - 1–2 columns → old behavior ({ key: value } or string[])
 * - 3+ columns  → first row = headers, column A = primary key,
 *                 columns B… → nested object mapped to that primary key
 *
 * Cell text comes from `sheet_to_json`-equivalent raw cell access; cell
 * styling (if styleData is supplied) is looked up per cell ref and baked
 * in as an inline-styled <span>, so it flows straight through loadSchedule()
 * and <zman-schedule>'s existing `.innerHTML = value` rendering untouched.
 *
 * @param {xlsx.WorkSheet} sheetData - The full workbook object.
 * @param {XlsxStyleData} [styleData] - Optional style lookup from readXlsxStyles().
 * @returns {Record<string, Record<string, string> | string[]>}
 */
function mapSheetColumns(sheetData, styleData) {
    /** @type {Record<string, Record<string, string> | string[]>} */
    const output = {};

    for (const [sheetName, sheet] of Object.entries(sheetData)) {
        if (!sheet["!ref"]) {
            output[sheetName] = {};
            continue;
        }
        const range = xlsx.utils.decode_range(sheet["!ref"]);

        /** @type {any[][]} */
        const rows = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
            const row = [];
            for (let c = range.s.c; c <= range.e.c; c++) {
                row.push(sheet[xlsx.utils.encode_cell({ r, c })] || null);
            }
            rows.push(row);
        }

        // Renders a cell's text, wrapped in a styled <span> if styleData
        // has anything for its ref.
        const cellHtml = (cellObj, r, c) => {
            if (!cellObj) return "";
            const text = cellObj.w !== undefined ? cellObj.w : (cellObj.v !== undefined ? String(cellObj.v) : "");
            if (!styleData) return String(text);
            const ref = xlsx.utils.encode_cell({ r, c });
            const css = resolvedStyleToCss(styleForCell(styleData, sheetName, ref));
            return css ? `<span data-zy-inserted-style style="${css}">${text}</span>` : String(text);
        };

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

            for (let r = 0; r < rows.length; r++) {
                const row = rows[r];
                const keyCell = row[0];
                const valCell = row[1];
                const key = keyCell ? String(keyCell.w ?? keyCell.v ?? "").trim() : "";
                if (!key) continue;

                if (valCell) {
                    pairs[key] = cellHtml(valCell, r, 1);
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
            const cell = headerRow[c];
            const h = cell ? String(cell.w ?? cell.v ?? "").trim() : "";
            headerMap[c] = h || `Column${c}`;
        }

        const result = {};

        // Process each data row (starting at index 1)
        for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length === 0) continue;

            const primaryCell = row[0];
            const primaryKey = primaryCell ? String(primaryCell.w ?? primaryCell.v ?? "").trim() : "";
            if (!primaryKey) continue;

            const rowData = {};
            for (let c = 1; c < Math.min(row.length, headerRow.length); c++) {
                const header = headerMap[c];
                const cell = row[c];
                const val = cell ? cellHtml(cell, r, c) : "";
                if (val !== "") rowData[header] = val;
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

// =====================================================================
// OOXML cell-style reading — independent of whatever xlsx/SheetJS build
// you use for values above. Reads font/fill straight out of the .xlsx's
// underlying XML, so it works with the latest patched SheetJS CE (no
// Pro-only cellStyles read support needed) and doesn't rot when that
// library's internals change. Uses JSZip for unzip/inflate; everything
// else is DOMParser, which browsers already have.
// =====================================================================

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<XlsxStyleData>}
 */
async function readXlsxStyles(arrayBuffer) {
	const zip = await JSZip.loadAsync(arrayBuffer);
	const parser = new DOMParser();

	const xml = async (path) => {
		const file = zip.file(path);
		if (!file) return null;
		return parser.parseFromString(await file.async("string"), "application/xml");
	};

	// 1. Map sheet name -> worksheet XML path, via workbook.xml + its rels.
	const workbookXml = await xml("xl/workbook.xml");
	const relsXml = await xml("xl/_rels/workbook.xml.rels");
	if (!workbookXml || !relsXml) {
		throw new Error("Not a valid .xlsx: missing xl/workbook.xml or its rels");
	}

	/** @type {Record<string, string>} */
	const relIdToTarget = {};
	for (const rel of Array.from(relsXml.getElementsByTagName("Relationship"))) {
		relIdToTarget[rel.getAttribute("Id")] = rel.getAttribute("Target");
	}

	/** @type {Record<string, string>} */
	const sheetNameToPath = {};
	for (const sheetEl of Array.from(workbookXml.getElementsByTagName("sheet"))) {
		const name = sheetEl.getAttribute("name");
		// r:id attribute — namespaced, so read it via getAttributeNS with the
		// standard OOXML relationships namespace to avoid prefix assumptions.
		const rId =
			sheetEl.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ||
			sheetEl.getAttribute("r:id");
		const target = relIdToTarget[rId];
		if (name && target) {
			sheetNameToPath[name] = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
		}
	}

	// 2. Parse styles.xml: fonts[], fills[], cellXfs[] (style index -> {fontId, fillId, ...}).
	const stylesXml = await xml("xl/styles.xml");
	const fonts = stylesXml ? parseFonts(stylesXml) : [];
	const fills = stylesXml ? parseFills(stylesXml) : [];
	const cellXfs = stylesXml ? parseCellXfs(stylesXml) : [];

	// 3. Per sheet, map cell ref -> style index (only cells with an explicit s="N").
	/** @type {Record<string, Record<string, number>>} */
	const sheetCellStyleIndex = {};
	for (const [sheetName, path] of Object.entries(sheetNameToPath)) {
		const sheetXml = await xml(path);
		if (!sheetXml) continue;
		/** @type {Record<string, number>} */
		const cellMap = {};
		for (const c of Array.from(sheetXml.getElementsByTagName("c"))) {
			const s = c.getAttribute("s");
			const ref = c.getAttribute("r");
			if (s != null && ref) cellMap[ref] = parseInt(s, 10);
		}
		sheetCellStyleIndex[sheetName] = cellMap;
	}

	return { fonts, fills, cellXfs, sheetCellStyleIndex };
}

/**
 * @param {XlsxStyleData} styleData
 * @param {string} sheetName
 * @param {string} cellRef - e.g. "B3"
 * @returns {ResolvedCellStyle | null}
 */
function styleForCell(styleData, sheetName, cellRef) {
	const idx = styleData.sheetCellStyleIndex[sheetName]?.[cellRef];
	if (idx == null) return null;

	const xf = styleData.cellXfs[idx];
	if (!xf) return null;

	return {
		font: xf.fontId != null ? styleData.fonts[xf.fontId] || null : null,
		fill: xf.fillId != null ? styleData.fills[xf.fillId] || null : null,
	};
}

/** @param {ResolvedCellStyle | null} style */
function resolvedStyleToCss(style) {
	if (!style) return "";
	const css = [];

	if (style.font) {
		const { bold, italic, underline, strike, rgb, sz, name } = style.font;
		if (bold) css.push("font-weight:bold");
		if (italic) css.push("font-style:italic");
		if (underline) css.push("text-decoration:underline");
		if (strike) css.push("text-decoration:line-through");
		if (rgb) css.push(`color:#${rgb.length === 8 ? rgb.slice(2) : rgb}`);
		if (sz) css.push(`font-size:${sz}pt`);
		if (name) css.push(`font-family:'${name}'`);
	}

	if (style.fill && style.fill.patternType === "solid" && style.fill.fgRgb) {
		const rgb = style.fill.fgRgb;
		css.push(`background-color:#${rgb.length === 8 ? rgb.slice(2) : rgb}`);
	}

	return css.join(";");
}

// ---- styles.xml parsing helpers ----
// Note: theme-indexed colors (<color theme="1" tint="..."/>) aren't resolved
// to RGB here — only explicit <color rgb="..."/> values are. Add
// xl/theme/theme1.xml parsing if your sheets rely on the theme palette.

/** @param {Document} stylesXml */
function parseFonts(stylesXml) {
	const fontsEl = stylesXml.getElementsByTagName("fonts")[0];
	if (!fontsEl) return [];
	return Array.from(fontsEl.getElementsByTagName("font")).map((fontEl) => {
		const colorEl = fontEl.getElementsByTagName("color")[0];
		const nameEl = fontEl.getElementsByTagName("name")[0];
		const szEl = fontEl.getElementsByTagName("sz")[0];
		return {
			bold: !!fontEl.getElementsByTagName("b")[0],
			italic: !!fontEl.getElementsByTagName("i")[0],
			underline: !!fontEl.getElementsByTagName("u")[0],
			strike: !!fontEl.getElementsByTagName("strike")[0],
			rgb: colorEl ? colorEl.getAttribute("rgb") : null,
			sz: szEl ? szEl.getAttribute("val") : null,
			name: nameEl ? nameEl.getAttribute("val") : null,
		};
	});
}

/** @param {Document} stylesXml */
function parseFills(stylesXml) {
	const fillsEl = stylesXml.getElementsByTagName("fills")[0];
	if (!fillsEl) return [];
	return Array.from(fillsEl.getElementsByTagName("fill")).map((fillEl) => {
		const patternEl = fillEl.getElementsByTagName("patternFill")[0];
		if (!patternEl) return { patternType: "none", fgRgb: null };
		const fgColorEl = patternEl.getElementsByTagName("fgColor")[0];
		return {
			patternType: patternEl.getAttribute("patternType") || "none",
			fgRgb: fgColorEl ? fgColorEl.getAttribute("rgb") : null,
		};
	});
}

/** @param {Document} stylesXml */
function parseCellXfs(stylesXml) {
	const cellXfsEl = stylesXml.getElementsByTagName("cellXfs")[0];
	if (!cellXfsEl) return [];
	// Only direct children of <cellXfs>, not nested <xf> under <cellStyleXfs>.
	return Array.from(cellXfsEl.children)
		.filter((el) => el.tagName === "xf")
		.map((xfEl) => ({
			fontId: xfEl.hasAttribute("fontId") ? parseInt(xfEl.getAttribute("fontId"), 10) : null,
			fillId: xfEl.hasAttribute("fillId") ? parseInt(xfEl.getAttribute("fillId"), 10) : null,
		}));
}

/**
 * @typedef {Object} XlsxStyleData
 * @property {any[]} fonts
 * @property {any[]} fills
 * @property {{fontId: number|null, fillId: number|null}[]} cellXfs
 * @property {Record<string, Record<string, number>>} sheetCellStyleIndex
 */

/**
 * @typedef {Object} ResolvedCellStyle
 * @property {any} font
 * @property {any} fill
 */

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