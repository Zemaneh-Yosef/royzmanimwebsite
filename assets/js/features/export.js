// @ts-check

import { settings } from "../settings/handler.js";
import WebsiteCalendar from "../core/WebsiteCalendar.js";
import TekufahCalculator from "../core/tekufot.js";
import { snapshotProvider, atmosphereSourceOf } from "../core/refraction-snapshot.js";
import { loadRefraction, printNeedsTypicalAir, lastForecastDay } from "../astro/refraction-data.js";
import { createPool } from "../misc/worker.js";
import { attachDatePicker } from "../misc/date-picker.js";
import { Input } from "../../libraries/mdbootstrap/mdb.js";
import { KINDS, AIRS, LANGS, icon, tri } from "../ui/solar-icons.js";

/**
 * The days an export covers, in the ISO calendar (both ends included).
 * @typedef {{ start: Temporal.PlainDate; end: Temporal.PlainDate; label: string }} ExportRange
 */

/** days of calculation either side of the exported range (some zmanim look at neighbouring days) */
const RANGE_MARGIN_DAYS = 14;
/** the longest range an export takes (about two years) */
const MAX_RANGE_DAYS = 740;
/** how long "Done" stays up after an export */
const DONE_SHOWN_MS = 1800;

class ExportRangeError extends Error {}

/** @param {string} he @param {string} en */
const localized = (he, en) => settings.language() == "he" ? he : en;

/** a text in the three languages (en = he-Latn) @param {string} he @param {string} en @returns {import("../ui/solar-icons.js").Tri} */
const T = (he, en) => ({ he, "he-Latn": en, en });
/** @param {import("../ui/solar-icons.js").Tri} text */
const inPageLanguage = text => text[/** @type {keyof typeof text} */ (settings.language())] ?? text["he-Latn"];

const startInput = () => /** @type {HTMLInputElement | null} */ (document.getElementById("exportrange-start"));
const endInput = () => /** @type {HTMLInputElement | null} */ (document.getElementById("exportrange-end"));

/**
 * A date as the range inputs show it: both calendars, the Hebrew date in Hebrew when the page is.
 * @param {Temporal.PlainDate} iso
 */
function dateText(iso) {
	const he = settings.language() == "he";
	const civil = iso.toLocaleString(he ? "he" : "en", { dateStyle: "medium", calendar: "gregory" });
	const hebrew = iso.toLocaleString(he ? "he-u-ca-hebrew" : "en-u-ca-hebrew", { dateStyle: "medium" });
	return `${civil} · ${hebrew}`;
}

/**
 * Sets a range input: its ISO date (what readRange reads) and the text shown. MDB's floating label is told
 * (the notch is measured, and a hidden modal measures nothing, so it is updated again when the modal is shown).
 * @param {HTMLInputElement} input @param {Temporal.PlainDate} iso
 */
function setRangeDate(input, iso) {
	input.setAttribute("date-value", iso.toString());
	input.value = dateText(iso);
	refreshOutline(input);
}

/** @param {HTMLInputElement} input */
function refreshOutline(input) {
	const outline = input.closest(".form-outline");
	if (!outline)
		return;
	try {
		new Input(outline).update();
	} catch (error) {
		console.warn("MDB input update failed:", error);
	}
}

/** @param {HTMLInputElement} input */
const dateOf = input => {
	const value = input.getAttribute("date-value");
	return value ? Temporal.PlainDate.from(value) : null;
};

/**
 * The whole Hebrew (Tishrei 1 to the end of Elul) or Gregorian year the date is in.
 * @param {Temporal.PlainDate} shown ISO
 * @param {"hebrew" | "gregorian"} kind
 * @returns {{ start: Temporal.PlainDate, end: Temporal.PlainDate }}
 */
function yearAround(shown, kind) {
	if (kind == "hebrew") {
		const yearStart = shown.withCalendar("hebrew").with({ month: 1, day: 1 });
		return {
			start: yearStart.withCalendar("iso8601"),
			end: yearStart.add({ years: 1 }).subtract({ days: 1 }).withCalendar("iso8601")
		};
	}
	return { start: shown.with({ month: 1, day: 1 }), end: shown.with({ month: 12, day: 31 }) };
}

/** The year the inputs start out as: the Hebrew one on the Hebrew page, else the Gregorian one @returns {"hebrew" | "gregorian"} */
const defaultYearKind = () => settings.language() == "he" ? "hebrew" : "gregorian";

/**
 * What the range inputs ask for.
 * @returns {ExportRange}
 * @throws {ExportRangeError} with the message to show when the range can't be used
 */
function readRange() {
	const startEl = startInput(), endEl = endInput();
	const start = startEl && dateOf(startEl), end = endEl && dateOf(endEl);
	if (!start || !end)
		throw new ExportRangeError(localized("יש לבחור תאריך התחלה ותאריך סיום.", "Please choose a start date and an end date."));

	if (Temporal.PlainDate.compare(end, start) < 0)
		throw new ExportRangeError(localized("תאריך הסיום חייב להיות אחרי תאריך ההתחלה.", "The end date can't be before the start date."));
	if (start.until(end, { largestUnit: "days" }).days + 1 > MAX_RANGE_DAYS)
		throw new ExportRangeError(localized("אפשר לייצא עד שנתיים בכל פעם.", "The range can be two years at most."));

	return { start, end, label: rangeLabel(start, end) };
}

/**
 * The range as a name: the year when it is a whole Gregorian or Hebrew year, else the two dates.
 * @param {Temporal.PlainDate} start
 * @param {Temporal.PlainDate} end
 */
function rangeLabel(start, end) {
	if (start.month == 1 && start.day == 1 && end.month == 12 && end.day == 31 && start.year == end.year)
		return String(start.year);

	const hebrewStart = start.withCalendar("hebrew"), hebrewEnd = end.withCalendar("hebrew");
	if (hebrewStart.month == 1 && hebrewStart.day == 1
		&& hebrewEnd.year == hebrewStart.year && hebrewEnd.month == hebrewEnd.monthsInYear && hebrewEnd.day == hebrewEnd.daysInMonth)
		return String(hebrewStart.year);

	return `${start.toString()} – ${end.toString()}`;
}

/**
 * The range cut into one task per ISO month for the workers' shared queue: [first day, number of days].
 * The first and last may be partial months. Small tasks keep the cores evenly busy.
 * @param {ExportRange} range
 * @returns {[[number, number, number, string], number][]}
 */
function rangeChunks(range) {
	/** @type {[[number, number, number, string], number][]} */
	const chunks = [];
	let first = range.start;
	while (Temporal.PlainDate.compare(first, range.end) <= 0) {
		const monthEnd = first.with({ day: first.daysInMonth });
		const last = Temporal.PlainDate.compare(monthEnd, range.end) < 0 ? monthEnd : range.end;
		chunks.push([[first.year, first.month, first.day, "iso8601"], first.until(last, { largestUnit: "days" }).days + 1]);
		first = last.add({ days: 1 });
	}
	return chunks;
}

/**
 * What air the export uses: the one decision behind both workerCalcInputs and the modal's data note, so they
 * can't disagree. `typical` = the range (and the day after it, which is looked at too: tonight's events, next
 * day's times) runs past the forecast, so every day gets typical air and the times have no step where the
 * forecast ends, as in the prints. Without any provider (no weather data at all) there is nothing to replace.
 * @param {import('../pages/calendar.js').default} zmanLister
 * @param {ExportRange} range
 */
function exportAirPlan(zmanLister, range) {
	const lon = zmanLister.geoLocation.getLongitude();
	/** what the page uses now: the loaded refraction, else what was read from storage */
	const provider = zmanLister.refraction?.provider ?? zmanLister.zmanCalc.config.atmosphereProvider ?? null;
	const normals = zmanLister.refraction?.normals ?? null;
	return {
		provider,
		normals,
		typical: !!provider && printNeedsTypicalAir(range.end.add({ days: 1 }), lon),
		/** the last day the forecast reaches */
		forecastLastDay: lastForecastDay(lon)
	};
}

/**
 * The calculator setup for the export workers. postMessage can't carry the page's config as-is (its
 * atmosphere provider and deferVisibleSunrise are functions), so the workers get a plain copy of it and
 * the provider's results for the exported range; they rebuild the provider with providerFromSnapshot().
 * The terrain horizon is plain data and stays in the config, so the workers compute the same visible
 * sunrise as the page. Whether the range uses the forecast or typical air is exportAirPlan's call.
 * @param {import('../pages/calendar.js').default} zmanLister
 * @param {ExportRange} range
 * @returns {Promise<{ config: import("../core/ROYZmanim.js").ZemanimConfig, refraction: import("./excelPrepare.js").ExportRefraction }>}
 */
async function workerCalcInputs(zmanLister, range) {
	const { atmosphereProvider: _provider, deferVisibleSunrise: _deferred, ...config } = zmanLister.zmanCalc.config;
	// the range plus a little on each side (some zmanim look at neighbouring days)
	const from = range.start.subtract({ days: RANGE_MARGIN_DAYS });
	const days = from.until(range.end.add({ days: RANGE_MARGIN_DAYS }), { largestUnit: "days" }).days + 1;
	const geo = zmanLister.geoLocation;
	const plan = exportAirPlan(zmanLister, range);
	let { provider, normals } = plan;
	if (plan.typical) {
		const typical = await loadRefraction(geo.getLatitude(), geo.getLongitude(), {
			typical: true, haze: false, prefetch: { from: from.withCalendar("iso8601"), days }
		});
		if (typical.notes.length)
			console.info("Refraction (export):", typical.notes);
		provider = typical.provider;
		normals = typical.normals ?? normals;
	}
	return {
		config,
		refraction: {
			table: provider ? snapshotProvider(provider, geo, from, days) : {},
			normals
		}
	};
}

/**
 * The sunrise and sunset kinds the export's config gives, as the page shows them: a horizon set makes the
 * sunrise the visible one, else sea level (getNetz); the sunset is the elevated one when elevation is used and
 * above 0 (WebsiteCalendar's solar info).
 * @param {import('../pages/calendar.js').default} zmanLister
 * @returns {{ sunrise: 'visible' | 'sea-level', sunset: 'elevated' | 'sea-level' }}
 */
function exportSolarKinds(zmanLister) {
	const config = zmanLister.zmanCalc.config;
	return {
		sunrise: config.horizon ? "visible" : "sea-level",
		sunset: config.elevation && zmanLister.geoLocation.getElevation() > 0 ? "elevated" : "sea-level"
	};
}

/**
 * The air sources the export will have, best first: typical air for every day when the plan says so, else what the
 * page's provider gives at the first, middle and last day (a range can run from the forecast into the monthly averages).
 * @param {import('../pages/calendar.js').default} zmanLister
 * @param {ExportRange} range
 * @returns {import("../core/refraction-snapshot.js").AtmosphereSource[]}
 */
function exportAirSources(zmanLister, range) {
	const plan = exportAirPlan(zmanLister, range);
	if (plan.typical)
		return ["climatology"];
	/** @type {import("../core/refraction-snapshot.js").AtmosphereSource} */
	const fallback = plan.normals ? "normals" : "standard";
	if (!plan.provider)
		return [fallback];

	const middle = range.start.add({ days: Math.floor(range.start.until(range.end, { largestUnit: "days" }).days / 2) });
	/** @type {Set<import("../core/refraction-snapshot.js").AtmosphereSource>} */
	const sources = new Set();
	for (const date of [range.start, middle, range.end]) {
		try {
			const spec = plan.provider(date, "sunrise", zmanLister.geoLocation);
			sources.add(spec ? atmosphereSourceOf(spec) : fallback);
		} catch {
			sources.add(fallback);
		}
	}
	const order = Object.keys(AIRS);
	return [...sources].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * Fills the modal's data note: which air and which sunrise / sunset the export will use, and why when the
 * forecast is replaced by typical air. Empty while the range can't be read.
 * @param {import('../pages/calendar.js').default} zmanLister
 */
function renderDataNote(zmanLister) {
	const note = document.getElementById("export-data-note");
	if (!note || !zmanLister.geoLocation || !zmanLister.zmanCalc)
		return;
	/** @type {ExportRange} */
	let range;
	try {
		range = readRange();
	} catch (error) {
		if (!(error instanceof ExportRangeError))
			throw error;
		note.replaceChildren();
		return;
	}

	/** @param {string} iconName @param {import("../ui/solar-icons.js").Tri} text */
	const line = (iconName, text) => {
		const span = document.createElement("span");
		span.append(icon(iconName, text), " ", tri(text));
		return span;
	};
	/** @type {Node[]} */
	const lines = [];
	const kinds = exportSolarKinds(zmanLister);
	lines.push(line(KINDS[kinds.sunrise].icon, KINDS[kinds.sunrise].sunrise));
	if (kinds.sunset == "elevated")
		lines.push(line(KINDS.elevated.icon, KINDS.elevated.sunset));
	for (const source of exportAirSources(zmanLister, range))
		lines.push(line(AIRS[source].icon, AIRS[source].text));

	const plan = exportAirPlan(zmanLister, range);
	if (plan.typical) {
		// a range may end on the day before the forecast's last day: the day after it is looked at too
		const lastEnd = plan.forecastLastDay.subtract({ days: 1 });
		const lastEndText =lastEnd.toLocaleString(settings.language() == "he" ? "he" : "en", { weekday: "short", month: "short", day: "numeric" });
		const why = document.createElement("span");
		why.append(tri(T(
			`התחזית מגיעה עד ⁦${lastEndText}⁩; טווח שמסתיים אחריו משתמש באוויר אופייני בכל הימים, כדי שלא יהיה קפיצה בזמנים.`,
			`The forecast reaches ${lastEndText}; ranges ending after it use typical air for every day so the times have no jump.`)));
		lines.push(why);
	}

	note.replaceChildren(...lines.flatMap((node, index) => index ? [document.createElement("br"), node] : [node]));
}

/** The status line's texts of an export at work */
const STAGES = {
	weather: T("טוען נתוני מזג אוויר…", "Loading weather data…"),
	building: T("בונה את הקובץ…", "Building the file…"),
	done: T("הסתיים", "Done"),
	/** @param {number} done @param {number} total */
	calculating: (done, total) => T(`מחשב: ${done} / ${total} ${total == 1 ? "חודש" : "חודשים"}`, `Calculating: ${done} / ${total} ${total == 1 ? "month" : "months"}`)
};

/**
 * Shows an export at work in the modal: both buttons disabled, a spinner on the clicked one, a progress bar and a
 * status line (aria-live). One export at a time (midDownload guards that).
 * @param {string} clickedId id of the button that was pressed
 */
function startFeedback(clickedId) {
	const buttons = ["downloadModalBtn", "spreadSheetBtn"].map(id => /** @type {HTMLButtonElement | null} */ (document.getElementById(id)));
	const wrap = document.getElementById("export-progress-wrap");
	const bar = document.getElementById("export-progress-bar");
	const status = document.getElementById("export-status");
	const spinner = document.createElement("span");
	spinner.className = "spinner-border spinner-border-sm me-1";
	spinner.setAttribute("aria-hidden", "true");

	for (const button of buttons)
		if (button) {
			button.disabled = true;
			if (button.id == clickedId)
				button.prepend(spinner);
		}
	wrap?.classList.remove("d-none");

	/** @param {import("../ui/solar-icons.js").Tri} text @param {number | null} fraction null: no known progress */
	const show = (text, fraction) => {
		if (status)
			status.textContent = inPageLanguage(text);
		if (!bar || !wrap)
			return;
		const percent = Math.round((fraction ?? 1) * 100);
		bar.classList.remove("bg-success");
		bar.classList.toggle("progress-bar-animated", fraction === null);
		bar.classList.toggle("progress-bar-striped", fraction === null);
		bar.style.width = `${percent}%`;
		wrap.setAttribute("aria-valuenow", String(percent));
	};

	const reset = () => {
		wrap?.classList.add("d-none");
		bar?.classList.remove("bg-success");
		if (status)
			status.textContent = "";
	};
	/** @param {boolean} ok */
	const finish = ok => {
		spinner.remove();
		for (const button of buttons)
			if (button)
				button.disabled = false;
		if (ok) {
			show(STAGES.done, 1);
			bar?.classList.add("bg-success");
			// a new export in the meantime takes the bar over: its first update removes this timer's effect
			const timer = window.setTimeout(() => { if (status?.textContent == inPageLanguage(STAGES.done)) reset(); }, DONE_SHOWN_MS);
			return timer;
		}
		reset();
	};

	show(STAGES.weather, null);
	return {
		weather: () => show(STAGES.weather, null),
		/** @param {number} done @param {number} total */
		calculating: (done, total) => show(STAGES.calculating(done, total), total ? done / total : 0),
		building: () => show(STAGES.building, null),
		finish
	};
}

export default class exportFriendly {
	constructor() {
		this.midDownload = false;
	}

	/** @param {import('../pages/calendar.js').default} zmanLister  */
	async handleICS(zmanLister) {
		if (this.midDownload)
			return;

		const range = this.chosenRange(zmanLister);
		if (!range)
			return;

		this.midDownload = true;
		const feedback = startFeedback("downloadModalBtn");
		let succeeded = false;

		const chunks = rangeChunks(range);
		// started now, so the workers load while the refraction data is fetched
		const pool = window.Worker ? createPool("/assets/js/features/icsPrepare.js", chunks.length) : null;

		try {
			const exportZmanList = Object.fromEntries(Object.entries(zmanLister.zmanimList)
				// @ts-ignore
				.filter(([key, value]) => document.getElementById(`exportzmanid-${key}`).checked))

			/** the kinds of event ticked in the Holiday Selection tab (exporteventid-<key>) */
			const enabledEvents = [...document.querySelectorAll('input[id^="exporteventid-"]')]
				.filter(/** @param {HTMLInputElement} box */ box => box.checked)
				.map(box => box.id.replace("exporteventid-", ""));

			/** @type {[string, number, number, number, string]} */
			// @ts-ignore
			const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())

			const calcInputs = await workerCalcInputs(zmanLister, range);

			/** @type {import('./icsPrepare.js').SharedParams} the parameters every chunk shares */
			const icsParams = [
				glArgs,
				calcInputs.config,
				zmanLister.jCal.getInIsrael(),
				exportZmanList,
				true,
				{
					// @ts-ignore
					language: settings.language(),
					events: enabledEvents,
					timeFormat: settings.timeFormat(), seconds: settings.seconds(),
					calcConfig: [settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha(zmanLister.jCal.getInIsrael())],
					fasts: Object.fromEntries([...document.querySelector('[data-zfFind="FastDays"]').getElementsByTagName("h5")]
						.map(ogHeading => {
							/** @type {HTMLHeadingElement} */
							// @ts-ignore
							const heading = ogHeading.cloneNode(true);
							const [ he, heLatn, en ] = [...heading.children]
								.map(langElem => {
									while (langElem.querySelector('[data-zfFind="erevTzom"]'))
										langElem.querySelector('[data-zfFind="erevTzom"]').remove()

									return langElem.innerHTML.replace(/<.*?>/gm, '');
								})

							return [heading.getAttribute("data-zfFind"), { he, "he-Latn": heLatn, en }[settings.language()]]
						})),
					tahanun: Object.fromEntries([...document.querySelector('[data-zfFind="Tachanun"]').children]
						.map(/** @returns {[string, string]} */
							tachObj =>
							[
							tachObj.getAttribute('data-zfFind'),
							tachObj.childElementCount == 0
								? tachObj.innerHTML
								: [...tachObj.children]
									.find(langElem =>
										[...langElem.classList].find(cl => cl.startsWith('lang-')).replace('lang-', '') == settings.language())
									.innerHTML
							]
					)),
					learningTitle: Object.fromEntries(
						Object.keys(zmanLister.jCal.getAllLearning())
						.map(/** @returns {[string, {"he": string; "he-Latn": string; "en": string}]} */
							learnFind =>
							[learnFind,
								// @ts-ignore
								Object.fromEntries([...document.querySelector(`[data-zfReplace="${learnFind}"]`)
								.parentElement
								.getElementsByTagName("dt")]
								.map(titleElem => [
									[...titleElem.classList].find(cl => cl.startsWith('lang-')).replace('lang-', ''),
									titleElem.innerHTML
								]))
							]
						))
				}
			]

			/** @type {import('../../libraries/ics/ics.esm.js').ics.EventAttributes[]} */
			let receiveData = [];

			const postDataReceive = async () => {
				feedback.building();
				const ics = (await import('../../libraries/ics/ics.esm.js')).ics;

				receiveData = receiveData.flat();

				// keep what overlaps the range: a Shabbat or Yom Tov found from a day in it may begin the evening before
				const timeZone = zmanLister.geoLocation.getTimeZone();
				const rangeStartMs = range.start.toZonedDateTime(timeZone).epochMilliseconds;
				const rangeEndMs = range.end.add({ days: 1 }).toZonedDateTime(timeZone).epochMilliseconds;
				receiveData = receiveData.filter(event => {
					if (Array.isArray(event.start)) {
						// all-day events: by their date
						const date = new Temporal.PlainDate(event.start[0], event.start[1], event.start[2]);
						return Temporal.PlainDate.compare(date, range.start) >= 0 && Temporal.PlainDate.compare(date, range.end) <= 0;
					}
					const startMs = /** @type {number} */ (event.start);
					const endMs = typeof event.end == "number" ? event.end : startMs;
					return endMs > rangeStartMs && startMs < rangeEndMs;
				});
				// each Hebrew year has four tekufot (Tishrei, Teves, Nissan, Tammuz) within it; the years the range touches
				const firstHebrewYear = range.start.withCalendar("hebrew").year, lastHebrewYear = range.end.withCalendar("hebrew").year;
				Array.from({ length: lastHebrewYear - firstHebrewYear + 1 }, (_, offset) => firstHebrewYear + offset)
					.flatMap(hebrewYear => new TekufahCalculator(hebrewYear).calculateTekufotShemuel(settings.calendarToggle.tekufaMidpoint() !== "hatzoth").slice(0, 4))
					.forEach((tekufa, index) => {
						if (!enabledEvents.includes("tekufot"))
							return;

						const time = tekufa.toZonedDateTime("+02:00").withTimeZone(zmanLister.geoLocation.getTimeZone())
						const timeDate = time.toPlainDate();
						if (Temporal.PlainDate.compare(timeDate, range.start) < 0 || Temporal.PlainDate.compare(timeDate, range.end) > 0)
							return;

						const tekufaMonth = [
							WebsiteCalendar.TISHREI,
							WebsiteCalendar.TEVES,
							WebsiteCalendar.NISSAN,
							WebsiteCalendar.TAMMUZ,
							WebsiteCalendar.TISHREI,
							WebsiteCalendar.TEVES,
						]
							.map(month => (new WebsiteCalendar(zmanLister.jCal.getJewishYear(), month, 15)).formatJewishMonth())
							[index % 4]

						receiveData.push({
							start: time.subtract({ minutes: 30 }).epochMilliseconds,
							end: time.add({ minutes: 30 }).epochMilliseconds,
							title: {
								he: "תקופת " + tekufaMonth.he,
								en: tekufaMonth.en + " Season",
								"he-Latn": "Tekufath " + tekufaMonth.en
							}[settings.language()]
						})
					})

				const calName = (!zmanLister.zmanCalc.config.fixedMil ? "Amudeh Hora'ah" : "Ohr Hachaim")
					+ ` Calendar (${range.label}) - ` + zmanLister.geoLocation.getLocationName();

				const labeledEvents = this.dedupICSEntries(receiveData);
				for (const lEvent of labeledEvents) {
					lEvent.calName = calName;
					lEvent.startInputType = "utc";
					lEvent.endInputType = "utc";
				}

				const icsRespond = ics.createEvents(labeledEvents)
				if (icsRespond.error)
					throw icsRespond.error;

				const element = document.createElement('a');
				element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(icsRespond.value));
				element.setAttribute('download', calName + ".ics");

				element.style.display = 'none';
				document.body.appendChild(element);

				element.click();

				document.body.removeChild(element);
			}

			receiveData = await this.runChunks(pool, () => import('./icsPrepare.js'), calcInputs.refraction, icsParams, chunks, feedback.calculating);
			await postDataReceive();
			succeeded = true;
		} catch (error) {
			this.reportFailure(error);
		} finally {
			pool?.terminate();
			this.midDownload = false;
			feedback.finish(succeeded);
		}
	}

	/**
	 * What the range inputs ask for, or null (after telling the user why) when it can't be used
	 * @param {import('../pages/calendar.js').default} zmanLister
	 * @returns {ExportRange | null}
	 */
	chosenRange(zmanLister) {
		try {
			return readRange();
		} catch (error) {
			if (!(error instanceof ExportRangeError))
				throw error;
			alert(error.message);
			return null;
		}
	}

	/**
	 * Wires the export modal's range block: the two date inputs use the site's date picker (inside the modal, so
	 * Bootstrap's focus trap leaves it alone), the year buttons reset them, they are filled when the modal opens
	 * unless the user typed dates, and the data note follows every change.
	 * @param {import('../pages/calendar.js').default} zmanLister
	 */
	bindModal(zmanLister) {
		const modal = document.getElementById("exportModal");
		const start = startInput(), end = endInput();
		if (!modal || !start || !end)
			return;

		/** what the inputs were last filled with, to tell dates the user picked from ours */
		let filled = { start: "", end: "" };
		const refreshNote = () => renderDataNote(zmanLister);

		/** @param {"hebrew" | "gregorian"} kind */
		const fillYear = kind => {
			const year = yearAround(zmanLister.jCal.getDate().withCalendar("iso8601"), kind);
			setRangeDate(start, year.start);
			setRangeDate(end, year.end);
			filled = { start: year.start.toString(), end: year.end.toString() };
			refreshNote();
		};

		const containerForPicker = /** @type {HTMLElement | undefined} */ (modal.querySelector(".modal-content") ?? undefined);
		for (const input of [start, end]) {
			attachDatePicker(input, { container: containerForPicker });
			input.addEventListener("calendarInsert", () => {
				const picked = dateOf(input);
				if (picked)
					setRangeDate(input, picked);
				refreshNote();
			});
			// a readonly text input doesn't click on Enter / Space by itself
			input.addEventListener("keydown", event => {
				if (event.key == "Enter" || event.key == " ") {
					event.preventDefault();
					input.click();
				}
			});
		}
		modal.querySelectorAll("[data-exportrange-preset]").forEach(button =>
			button.addEventListener("click", () => fillYear(/** @type {"hebrew" | "gregorian"} */ (button.getAttribute("data-exportrange-preset")))));

		/** labels and order that follow the page's language, which can change between openings */
		const localizeInputs = () => {
			start.setAttribute("aria-label", inPageLanguage(T("תאריך התחלה", "Start date")));
			end.setAttribute("aria-label", inPageLanguage(T("תאריך סיום", "End date")));
			// the language's default year first
			const first = defaultYearKind();
			modal.querySelectorAll("[data-exportrange-preset]").forEach(button =>
				/** @type {HTMLElement} */ (button).style.order = button.getAttribute("data-exportrange-preset") == first ? "0" : "1");
		};

		modal.addEventListener("show.bs.modal", () => {
			localizeInputs();
			const untouched = (/** @type {HTMLInputElement} */ input, /** @type {string} */ last) =>
				!input.getAttribute("date-value") || input.getAttribute("date-value") == last;
			if (untouched(start, filled.start) && untouched(end, filled.end))
				fillYear(defaultYearKind());
			else {
				// the texts show the language of the moment
				for (const input of [start, end]) {
					const date = dateOf(input);
					if (date)
						setRangeDate(input, date);
				}
				refreshNote();
			}
		});
		// MDB measures the floating label's notch when it is set up, and a closed modal measures nothing
		modal.addEventListener("shown.bs.modal", () => [start, end].forEach(refreshOutline));
		// the page's data (weather, refraction) can arrive after the modal opened: refresh the note, never the dates
		document.addEventListener("zmanimRendered", () => {
			if (modal.classList.contains("show"))
				refreshNote();
		});
		localizeInputs();
	}

	/**
	 * Runs the export function once per chunk of days: in the pool's workers when the browser has workers
	 * (the refraction and the shared parameters go to each worker once, a chunk is only its dates), else here.
	 * Rejects as soon as one chunk fails; the caller terminates the pool.
	 * @param {ReturnType<typeof createPool> | null} pool
	 * @param {() => Promise<{ default: Function }>} load the same module, for browsers without workers
	 * @param {import("./excelPrepare.js").ExportRefraction} refraction
	 * @param {any[]} params the parameters after the dates; the last is the settings object, without its refraction
	 * @param {[any, number][]} chunks
	 * @param {(completed: number, total: number) => void} [onProgress] called with (0, total) first, then after each chunk
	 * @returns {Promise<any[]>} one result per chunk, in order
	 */
	async runChunks(pool, load, refraction, params, chunks, onProgress) {
		if (!pool) {
			const exportFunc = (await load()).default;
			const settingsWithRefraction = { ...params.at(-1), refraction };
			const results = [];
			onProgress?.(0, chunks.length);
			for (const [firstDay, dayCount] of chunks) {
				results.push(await exportFunc(firstDay, dayCount, ...params.slice(0, -1), settingsWithRefraction));
				onProgress?.(results.length, chunks.length);
				// let the page paint the bar between months
				await new Promise(resolve => setTimeout(resolve));
			}
			return results;
		}

		// One JSON string is copied by postMessage; the table's object graph would be walked once per worker.
		// The snapshot is plain JSON (refraction-snapshot.js), so nothing is lost.
		const { table, normals } = refraction;
		return pool.run([{ type: "refraction", tableJson: JSON.stringify(table), normals }, { type: "init", params }], chunks, onProgress);
	}

	/** @param {unknown} error */
	reportFailure(error) {
		console.error("Export failed:", error);
		alert(settings.language() == "he" ? "הייצוא נכשל. נא לנסות שוב." : "The export failed. Please try again.");
	}


	/**
	 * @function
	 * @template {any[]} A
	 * @param {A} values
	 * @returns {A}
	 */
	dedupICSEntries(values) {
		const setFromValues = new Set(values.map(value => JSON.stringify(value)));

		// @ts-ignore
		return [...setFromValues].map(value => JSON.parse(value));
	}

	/** @param {import('../pages/calendar.js').default} zmanLister  */
	async handleExcel(zmanLister) {
		if (this.midDownload)
			return;

		const range = this.chosenRange(zmanLister);
		if (!range)
			return;

		this.midDownload = true;
		const feedback = startFeedback("spreadSheetBtn");
		let succeeded = false;

		const chunks = rangeChunks(range);
		// started now, so the workers load while the refraction data is fetched
		const pool = window.Worker ? createPool("/assets/js/features/excelPrepare.js", chunks.length) : null;

		try {
			const exportZmanList = Object.fromEntries(Object.entries(zmanLister.zmanimList)
				// @ts-ignore
				.filter(([key]) => document.getElementById(`exportzmanid-${key}`).checked))

			/** @type {[string, number, number, number, string]} */
			// @ts-ignore
			const glArgs = Object.values(settings.location).map(numberFunc => numberFunc())

			const calcInputs = await workerCalcInputs(zmanLister, range);

			/** @type {import('./excelPrepare.js').SharedParams} the parameters every chunk shares */
			const excelParams = [
				glArgs,
				calcInputs.config,
				zmanLister.jCal.getInIsrael(),
				exportZmanList,
				false,
				Object.keys(zmanLister.jCal.getAllLearning())
					// @ts-expect-error
					.filter(learn => document.getElementById(`exportlimudid-${learn}`).checked),
				{
					// @ts-ignore
					language: settings.language(),
					calcConfig: [settings.calendarToggle.rtKulah(), settings.customTimes.tzeithIssurMelakha(zmanLister.jCal.getInIsrael())],
					seconds: settings.seconds(),
					timeFormat: settings.timeFormat()
				}
			]

			/** @type {ReturnType<import("./excelPrepare.js").default>[]} */
			let workerData = [];

			const title = (!zmanLister.zmanCalc.config.fixedMil ? "Amudeh Hora'ah" : "Ohr Hachaim")
					+ ` Calendar (${range.label}) - ` + zmanLister.geoLocation.getLocationName();

			const postDataReceive = async () => {
				feedback.building();
				const { utils, writeFile } = (await import('../../libraries/xlsx.js'));
				const wb = utils.book_new();

				if (settings.language() === 'he') {
					wb.Workbook = { Views: [{ RTL: true }] };
				}

				const headerZemanimRow = Object.fromEntries(
					[['DATE', {'he': "יום", en: 'DATE', "he-Latn": "DATE"}[settings.language()]]]
						.concat(Object.entries(exportZmanList).map(entry => [entry[0], entry[1].title[settings.language()]]))
				);

				const zemanimTableData = [...new Set(workerData.flatMap(workerData => workerData.zemanim).flat().map(field => JSON.stringify(field)))]
					.map(field => JSON.parse(field))
					.sort((a, b) => {
						const aDate = new Date(a.DATE.v).getTime();
						const bDate = new Date(b.DATE.v).getTime();
						return aDate - bDate;
					});

				const zemanimWs = utils.json_to_sheet([headerZemanimRow].concat(zemanimTableData), { skipHeader: true });
				utils.book_append_sheet(wb, zemanimWs, "Zemanim");

				const limudimHeaders = Object.fromEntries(
					[['DATE', {'he': "יום", en: 'DATE', "he-Latn": "DATE"}[settings.language()]]]
					.concat([...document.querySelector('[data-zffind="DafYomi"]').children]
					.map(limud => [
						limud.querySelector('[data-zfreplace]').getAttribute('data-zfreplace'),
						limud.querySelector(`.lang-${settings.language()}`).innerHTML
					])
					.filter(learn => document.getElementById(`exportlimudid-${learn[0]}`).checked))
				)

				const limudimTableData = [...new Set(workerData.flatMap(workerData => workerData.limudim).flat().map(field => JSON.stringify(field)))]
					.map(field => JSON.parse(field))
					.sort((a, b) => {
						const aDate = new Date(a.DATE.v).getTime();
						const bDate = new Date(b.DATE.v).getTime();
						return aDate - bDate;
					});

				const limudimWs = utils.json_to_sheet([limudimHeaders].concat(limudimTableData), { skipHeader: true });
				utils.book_append_sheet(wb, limudimWs, "Limudim");

				writeFile(wb, title + ".xlsx");
			}

			workerData = await this.runChunks(pool, () => import('./excelPrepare.js'), calcInputs.refraction, excelParams, chunks, feedback.calculating);
			await postDataReceive();
			succeeded = true;
		} catch (error) {
			this.reportFailure(error);
		} finally {
			pool?.terminate();
			this.midDownload = false;
			feedback.finish(succeeded);
		}
	}
}