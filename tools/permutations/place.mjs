// One place, every configuration: run inside a worker thread by run.mjs (one per CPU core).
import { parentPort } from 'node:worker_threads';
import { slug, replayFetch, readManifest, setClock, SERVER, SERVER_DAYS, OPEN_METEO, NORMALS_OPTIONS, USER_AGENT, localDate, lib,
	ROYSPACalculator, chainProviders, monthlyClimate, createOpenMeteoPathAtmosphere, createOpenMeteoAtmosphere,
	fetchOpenMeteoNormals, createNwsAtmosphere, createServerPathAtmosphere, fetchHorizonForArea } from './common.mjs';
import { CONFIGS, key, wantsVisible, hAboveBase, datesFor } from './configs.mjs';

// the site reports weather data it refuses through console.warn: count them, keep the console readable
let refused = 0;
console.warn = () => { refused++; };
const safe = async (/** @type {() => Promise<any>} */ fn) => { try { return await fn(); } catch { return null; } };

async function computePlace(/** @type {any} */ p, /** @type {boolean} */ quick, /** @type {boolean} */ noVisible, /** @type {(f: number) => void} */ progress) {
	const id = slug(p.name), m = readManifest(id);
	refused = 0;
	setClock(m.fetchedAt);
	const rf = replayFetch(id);
	const path = m.ok.path ? await safe(() => createOpenMeteoPathAtmosphere(p.lat, p.lon, { fetch: rf, ...OPEN_METEO })) : null;
	const partial = /not recorded/.test(String(path?.lastError?.message)) ? ['path (partly: fetch again)'] : [];
	const single = m.ok.single ? await safe(() => createOpenMeteoAtmosphere(p.lat, p.lon, { fetch: rf, ...OPEN_METEO })) : null;
	const nws = m.ok.nws ? await safe(() => createNwsAtmosphere(p.lat, p.lon, { fetch: rf, userAgent: USER_AGENT })) : null;
	const normals = m.ok.normals ? await safe(() => fetchOpenMeteoNormals(p.lat, p.lon, { fetch: rf, ...NORMALS_OPTIONS })) : null;
	const server = m.ok.server ? await safe(async () => {
		const s = await createServerPathAtmosphere(SERVER, p.lat, p.lon, { days: 31, fetch: rf });
		await s.prefetch(Temporal.PlainDate.from(new Date(m.fetchedAt).toISOString().slice(0, 10)), SERVER_DAYS);
		return s;
	}) : null;
	const horizon = m.ok.horizon ? await safe(() => fetchHorizonForArea(SERVER, p.lat, p.lon, { fetch: rf })) : null;
	const providers = {
		site: chainProviders(path?.provider ?? single?.provider, server?.provider, normals ? monthlyClimate(normals) : null),
		path: path?.provider ?? null, single: single?.provider ?? null, nws: nws?.provider ?? null,
		server: server?.provider ?? null, normals: normals ? monthlyClimate(normals) : null, standard: null,
	};
	const have = Object.entries({ path, single, nws, normals, server, horizon }).filter(([, v]) => v).map(([k]) => k);
	const missing = [...Object.entries(m.ok).filter(([k, v]) => v && !have.includes(k)).map(([k]) => k), ...partial];

	const eye = Math.max(p.ground, 0);
	const dates = datesFor(localDate(m.fetchedAt, p.tz), quick);
	const list = [...CONFIGS.values()].filter(c => c.weather === 'standard' || providers[c.weather]);
	const rows = [];
	let k = 0;
	for (const c of list) {
		const geo = new lib.GeoLocation(p.name, p.lat, p.lon, eye, p.tz);
		const calc = new ROYSPACalculator();
		calc.setAtmosphereProvider(providers[c.weather]);
		calc.setHumidity(c.humidity);
		calc.setSeaSurfaceLayer(c.sea);
		calc.setRefractionAtRealHeights(c.real);
		calc.configureForLocation(geo);
		const visible = !noVisible && wantsVisible(c) && horizon;
		for (const { date, window } of dates) {
			for (const ev of /** @type {const} */ (['sunrise', 'sunset'])) {
				// a single source only on the dates it has air for (else the calculator falls back to standard air)
				if (c.weather !== 'standard' && c.weather !== 'site' && !providers[c.weather](date, ev, geo)) continue;
				const h = hAboveBase(p, c.base, ev, date);
				const he = h === null ? 0 : Math.max(0, eye - h);
				if (ev === 'sunrise') geo.setHorizonElevationAtSunrise(he); else geo.setHorizonElevationAtSunset(he);
				const r = ev === 'sunrise' ? calc.getSunrises(date, geo, null) : calc.getSunsets(date, geo, null);
				const vis = visible ? (ev === 'sunrise' ? calc.getVisibleSunrise(date, geo, horizon) : calc.getVisibleSunset(date, geo, horizon)) : NaN;
				rows.push([p.name, p.israel, date.toString(), window, ev, key(c), r.elevated, vis]);
			}
		}
		progress(++k / list.length);
	}
	setClock(null);
	return { rows, have, missing, refused };
}

parentPort?.on('message', async ({ place, quick, noVisible }) => {
	try {
		const out = await computePlace(place, quick, noVisible, f => parentPort.postMessage({ type: 'progress', name: place.name, f }));
		parentPort.postMessage({ type: 'done', name: place.name, ...out });
	} catch (e) {
		parentPort.postMessage({ type: 'error', name: place.name, message: e?.stack ?? String(e) });
	}
});
