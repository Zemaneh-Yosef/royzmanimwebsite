// @ts-check
/**
 * refraction-snapshot.js — the worker-safe half of the refraction plumbing.
 *
 * No network, no localStorage, and its only import is royzmanim-spa-corrections.js (which ROYZmanim.js
 * loads anyway), so a print worker importing this pulls in nothing extra. The fetching side, with the
 * forecast modules, lives in refraction-data.js and runs on the main thread only.
 */

import { chainProviders, monthlyClimate } from "../libraries/kosherZmanim/royzmanim-spa-corrections.js";

/** @typedef {import("../libraries/kosherZmanim/royzmanim-spa-corrections.js").AtmosphereSpec} AtmosphereSpec */
/** @typedef {import("../libraries/kosherZmanim/royzmanim-spa-corrections.js").HorizonSet} HorizonSet */
/** @typedef {import("../libraries/kosherZmanim/royzmanim-spa-corrections.js").VisibleOptions} VisibleOptions */
/** @typedef {import("../libraries/kosherZmanim/horizon-client.js").AreaInfo} AreaInfo */
/** @typedef {import("../libraries/kosherZmanim/horizon-client.js").MoonHorizon} MoonHorizon */
/** @typedef {'sunrise'|'sunset'} SolarEvent */

/**
 * What ROYSPACalculator.setAtmosphereProvider accepts.
 * @typedef {(date: Temporal.PlainDate, event: SolarEvent, geo?: any) => AtmosphereSpec | null | undefined} AtmosphereProvider
 */

/**
 * moon: the composite moonrise / moonset horizon, when it was asked for (loadRefraction's moon option).
 * @typedef {HorizonSet & { area?: AreaInfo | null, areaNote?: string, moon?: MoonHorizon | null }} Horizon
 */
/** @typedef {{ minC: number[], meanC: number[], pressureMb?: number, heightM?: number }} Normals */

/**
 * Provider results for a date range, keyed "YYYY-MM-DD|sunrise" / "YYYY-MM-DD|sunset".
 * Plain JSON: safe for postMessage and JSON.stringify.
 * @typedef {Record<string, AtmosphereSpec>} ProviderSnapshot
 */

/**
 * A provider built from monthly normals only: no network, available synchronously.
 * @param {Normals | null | undefined} normals
 * @returns {AtmosphereProvider | null}
 */
export function providerFromNormals(normals) {
	return normals ? monthlyClimate(normals) : null;
}

/**
 * ISO key for a date in any calendar.
 * @param {Temporal.PlainDate} date @param {SolarEvent} event
 */
function snapshotKey(date, event) {
	return `${date.withCalendar("iso8601").toString({ calendarName: "never" })}|${event}`;
}

/**
 * Evaluate a provider for every sunrise / sunset in a range and keep the plain results.
 * The result can be posted to a worker (the provider itself cannot: it is a closure).
 * @param {AtmosphereProvider} provider
 * @param {any} geo the GeoLocation the calculator will use (some providers read it)
 * @param {Temporal.PlainDate} from first date (any calendar)
 * @param {number} days
 * @returns {ProviderSnapshot}
 */
export function snapshotProvider(provider, geo, from, days) {
	/** @type {ProviderSnapshot} */
	const table = {};
	const start = from.withCalendar("iso8601");
	for (let i = 0; i < days; i++) {
		const date = start.add({ days: i });
		for (const event of /** @type {SolarEvent[]} */ (["sunrise", "sunset"])) {
			const spec = provider(date, event, geo);
			if (spec) table[snapshotKey(date, event)] = spec;
		}
	}
	return table;
}

/**
 * Rebuild a provider inside a worker from a snapshot, falling back to the normals for dates outside it.
 * @param {ProviderSnapshot | null | undefined} table
 * @param {Normals | null | undefined} normals
 * @returns {AtmosphereProvider}
 */
export function providerFromSnapshot(table, normals) {
	/** @type {AtmosphereProvider} */
	const fromTable = (date, event) => table?.[snapshotKey(date, event)] ?? null;
	return chainProviders(fromTable, providerFromNormals(normals));
}
