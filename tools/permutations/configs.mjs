// The decisions, their levels, and which combinations are tried (shared by run.mjs and place.mjs).

export const WEATHER = ['site', 'path', 'single', 'nws', 'server', 'normals', 'standard'];
export const WEATHER_LABEL = { site: 'site order (path > server > normals)', path: 'path forecast only', single: 'single-point Open-Meteo only',
	nws: 'NWS only (US)', server: 'refraction server only', normals: 'monthly normals only', standard: 'no weather (standard air)' };
export const BASES = ['none', '20', '40', '60', '80', '100', '120'];
/** What the site would do with the report's recommendations; every other setting is measured against it. */
export const BASE = { weather: 'site', base: '80', real: true, humidity: false, sea: false };
export const FACTOR_LABEL = { weather: 'weather source', base: 'terrain base', real: 'refraction at real heights', humidity: 'humidity', sea: 'sea-surface layer' };
export const LEVELS = { weather: WEATHER, base: BASES, real: [true, false], humidity: [false, true], sea: [false, true] };
/** Pairs whose interaction is measured: does the first decision's effect depend on the second? */
export const PAIRS = [['base', 'real'], ['weather', 'base'], ['weather', 'real'], ['weather', 'sea'], ['weather', 'humidity']];

/** @typedef {{ weather: string, base: string, real: boolean, humidity: boolean, sea: boolean }} Config */
export const key = (/** @type {Config} */ c) => `${c.weather}|${c.base}|${c.real ? 'R' : 'r'}|${c.humidity ? 'H' : 'h'}|${c.sea ? 'S' : 's'}`;

/** @type {Map<string, Config>} */
export const CONFIGS = new Map();
const add = (/** @type {Partial<Config>} */ d) => { const c = { ...BASE, ...d }; CONFIGS.set(key(c), c); };
add({});
for (const w of WEATHER) add({ weather: w });
for (const b of BASES) add({ base: b });
add({ real: false }); add({ humidity: true }); add({ sea: true });
for (const b of BASES) add({ base: b, real: false });
for (const w of WEATHER) for (const b of ['none', '40', '120']) add({ weather: w, base: b });
for (const w of WEATHER) { add({ weather: w, real: false }); add({ weather: w, sea: true }); add({ weather: w, humidity: true }); }

/** The visible time doesn't use the base or real heights, so it is traced only where those are at their base level. */
export const wantsVisible = (/** @type {Config} */ c) => c.base === BASE.base && c.real === BASE.real;

/** Height above the base on a date: the report's Dec / Mar-Sep / Jun values, by the sun's declination. */
export function hAboveBase(/** @type {any} */ p, /** @type {string} */ width, /** @type {'sunrise'|'sunset'} */ ev, /** @type {any} */ d) {
	if (width === 'none') return null;
	const v = p.hAboveBase[width][ev];
	const dec = 23.44 * Math.sin(2 * Math.PI * (d.dayOfYear - 80) / 365.25);
	const t = Math.abs(dec) / 23.44, far = dec < 0 ? v.Dec : v.Jun;
	return v['Mar/Sep'] + (far - v['Mar/Sep']) * t;
}

/** Dates: forecast days 0..15 from the fetch, and the 15th of each month for a year after them. */
export function datesFor(/** @type {any} */ d0, /** @type {boolean} */ quick) {
	const out = [];
	for (let k = 0; k <= 15; k += quick ? 3 : 1) out.push({ date: d0.add({ days: k }), window: 'forecast' });
	const first = d0.add({ days: 17 });
	for (let k = 0; k < 12; k += quick ? 2 : 1) {
		const m = first.add({ months: k });
		out.push({ date: Temporal.PlainDate.from({ year: m.year, month: m.month, day: 15 }), window: 'later' });
	}
	return out;
}
