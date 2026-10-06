// @ts-check
/**
 * print-refraction.js — main-thread refraction setup shared by the print pages that weren't built around
 * it (monthly print, Yonah print, weekly print from a JSON config). Same steps as
 * weeklyPrint/print-export-url-param.js:
 *
 *   const { refraction, refractionInit } = await loadPrintRefraction(geo, firstDate, lastDate);
 *   new ZemanFunctions(geo, { ...config, atmosphereProvider: refraction.provider, horizon: refraction.horizon });
 *   worker.postMessage(refractionInit);   // once per worker, before its first job
 *   ...workers report { sunriseOffsets } (visible minus sea-level sunrise, ms, per ISO date)...
 *   fillVisibleSunriseTable(vsTable, offsets, firstDate, lastDate, refraction.horizon, locale);
 */

import { loadRefraction, snapshotProvider } from "../refraction-data.js";

/** @typedef {import("../refraction-data.js").RefractionData} RefractionData */

/**
 * What a print worker gets once, before any page: workers have no localStorage and can't receive the
 * provider (a closure), so they get its plain results and rebuild it with providerFromSnapshot().
 * @typedef {{
	type: 'refraction';
	table: import('../refraction-snapshot.js').ProviderSnapshot;
	normals: import('../refraction-snapshot.js').Normals | null;
	horizon: import('../refraction-snapshot.js').Horizon | null;
  }} RefractionInit */

/** Holiday boxes and "next Shabbat" lookups reach a little outside the printed range. */
const SNAPSHOT_MARGIN_DAYS = 14;

/**
 * Load refraction data for a printed range and build the message for the workers.
 * Never throws: on failure the print uses the calculator's standard model (and sea-level netz).
 * @param {import("../../libraries/kosherZmanim/kosher-zmanim.js").GeoLocation} geoLocation
 * @param {Temporal.PlainDate} first first printed date (any calendar)
 * @param {Temporal.PlainDate} last last printed date (any calendar)
 * @returns {Promise<{ refraction: RefractionData | null, refractionInit: RefractionInit }>}
 */
export async function loadPrintRefraction(geoLocation, first, last) {
	const from = first.withCalendar("iso8601").subtract({ days: SNAPSHOT_MARGIN_DAYS });
	const to = last.withCalendar("iso8601").add({ days: SNAPSHOT_MARGIN_DAYS });
	const days = from.until(to, { largestUnit: "day" }).days + 1;

	/** @type {RefractionData | null} */
	let refraction = null;
	try {
		refraction = await loadRefraction(geoLocation.getLatitude(), geoLocation.getLongitude(), {
			prefetch: { from, days }
		});
		if (refraction.notes.length)
			console.info("Refraction:", refraction.notes);
	} catch (e) {
		console.error("Refraction data failed to load; printing with the standard model", e);
	}

	return {
		refraction,
		refractionInit: {
			type: "refraction",
			table: refraction ? snapshotProvider(refraction.provider, geoLocation, from, days) : {},
			normals: refraction?.normals ?? null,
			horizon: refraction?.horizon ?? null
		}
	};
}

/**
 * The visible-sunrise summary box: the extremes of (visible - sea-level sunrise) over the printed range.
 * Removes the box when there's nothing to show, and always removes the old ChaiTables QR code.
 * @param {Element | null} vsTable the [data-zyFind="vsTable"] element
 * @param {Record<string, number>} sunriseOffsets ms per ISO date, as the workers report them
 * @param {Temporal.PlainDate} first @param {Temporal.PlainDate} last printed range (any calendar)
 * @param {import('../refraction-snapshot.js').Horizon | null | undefined} horizon
 * @param {string} locale
 */
export function fillVisibleSunriseTable(vsTable, sunriseOffsets, first, last, horizon, locale) {
	// The ChaiTables QR code has nothing to point to any more
	document.getElementById('qrCodeVisualSunrise')?.remove();
	if (!vsTable)
		return;

	const from = first.withCalendar("iso8601"), to = last.withCalendar("iso8601");
	const entries = Object.entries(sunriseOffsets).filter(([date]) => {
		const d = Temporal.PlainDate.from(date);
		return Temporal.PlainDate.compare(d, from) >= 0 && Temporal.PlainDate.compare(d, to) <= 0;
	});
	if (!horizon || !entries.length) {
		vsTable.remove();
		return;
	}

	// "radius" now describes the area the server searched for the best vantage points
	const radiusElem = vsTable.querySelector('[data-zyReplace="sunriseRadius"]');
	const areaRadius = horizon.area?.radiusKm;
	if (radiusElem && areaRadius) {
		radiusElem.innerHTML = new Intl.NumberFormat(locale, { style: "unit", unit: "kilometer", maximumFractionDigits: 1 })
			.format(areaRadius);
	} else if (radiusElem) {
		radiusElem.previousElementSibling?.remove();
		radiusElem.remove();
	}

	/** @type {{ earliest: { msDiff: number, date: string | null }, latest: { msDiff: number, date: string | null } }} */
	const diffs = {
		earliest: { msDiff: 0, date: null },
		latest: { msDiff: 0, date: null }
	};
	for (const [date, msDiff] of entries) {
		if (msDiff < 0 && (diffs.earliest.date === null || msDiff < diffs.earliest.msDiff))
			diffs.earliest = { msDiff, date };
		else if (msDiff > 0 && (diffs.latest.date === null || msDiff > diffs.latest.msDiff))
			diffs.latest = { msDiff, date };
	}

	for (const [which, slot] of /** @type {const} */ ([['earliestOffset', diffs.earliest], ['latestOffset', diffs.latest]])) {
		const cell = vsTable.querySelector(`[data-zyReplace="${which}"]`);
		if (!cell) continue;
		if (slot.date === null) {
			cell.innerHTML = "N/A";
		} else {
			const dur = Temporal.Duration.from({ milliseconds: Math.abs(slot.msDiff) }).round({ smallestUnit: "second" });
			cell.innerHTML = formatDuration(dur, locale) + `<div style='font-size:.8em;'>(${slot.date})</div>`;
		}
	}
}

/** @param {Temporal.Duration} duration @param {string} locale */
function formatDuration(duration, locale) {
	const totalSeconds = Math.round(duration.total("seconds"));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	// @ts-ignore
	if (typeof Intl.DurationFormat !== "undefined") {
		// @ts-ignore
		return new Intl.DurationFormat(locale, { minute: "short", second: "short" }).format({ minutes, seconds });
	}
	return `${minutes}m ${seconds}s`;
}
