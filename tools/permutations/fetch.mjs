// Step 1 (needs the internet): download, once, everything the site would download for each place, and save it
// under cache/. Safe to stop and run again: finished places are skipped (pass --refetch to redo them).
//   node fetch.mjs                      every place in places.json
//   node fetch.mjs Jerusalem Denver     only places whose name starts with these
import { setClock, replayFetch, PLACES, slug, recordingFetch, readManifest, writeManifest, SERVER, SERVER_DAYS, OPEN_METEO, NORMALS_OPTIONS, USER_AGENT, isUS,
	createOpenMeteoPathAtmosphere, createOpenMeteoAtmosphere, fetchOpenMeteoNormals, createNwsAtmosphere,
	createServerPathAtmosphere, fetchHorizonForArea, HorizonPendingError, OpenMeteoRateLimitError } from './common.mjs';

const args = process.argv.slice(2);
const refetch = args.includes('--refetch');
/** --skip-open-meteo: only the refraction server's data (for testing this script when Open-Meteo is out of reach) */
const skipOM = args.includes('--skip-open-meteo');
const only = args.filter(a => !a.startsWith('--'));
// the site reports weather data it refuses through console.warn: count it instead of filling the screen
let refused = 0;
console.warn = () => { refused++; };
const sleep = (/** @type {number} */ s) => new Promise(r => setTimeout(r, s * 1000));
const log = (/** @type {string} */ s) => console.log(`${new Date().toISOString().slice(11, 19)}  ${s}`);

/** Run fn; on Open-Meteo's "over the limit" wait as long as it says (at most an hour) and try again. */
async function withLimits(/** @type {string} */ what, /** @type {() => Promise<any>} */ fn) {
	for (let k = 0; k < 6; k++) {
		try { return await fn(); }
		catch (e) {
			if (e instanceof OpenMeteoRateLimitError || /429|limit reached/.test(String(e?.message))) {
				const s = Math.min(Math.max(e.retryAfterS ?? 60, 30), 3600);
				log(`  ${what}: Open-Meteo's limit reached, waiting ${s} s`); await sleep(s); continue;
			}
			throw e;
		}
	}
	throw new Error(`${what}: still over Open-Meteo's limit; run again later`);
}

const todo = PLACES.filter(p => !only.length || only.some(o => p.name.toLowerCase().startsWith(o.toLowerCase())));
let n = 0, fetched = 0;
const t0 = Date.now();
const mmss = (/** @type {number} */ s) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;
for (const p of todo) {
	n++;
	const id = slug(p.name);
	const old = readManifest(id);
	if (old?.complete && !refetch) { log(`${n}/${todo.length} ${p.name}: already done`); continue; }
	const el = (Date.now() - t0) / 1000, left = todo.length - n + 1;
	log(`${n}/${todo.length} ${p.name}  [${'#'.repeat(Math.round((n - 1) / todo.length * 20)).padEnd(20, '.')}] ${mmss(el)} elapsed${fetched ? `, ~${mmss(el / fetched * left)} left` : ''}`);
	const f = recordingFetch(id);
	const fetchedAt = Date.now();
	const m = { name: p.name, fetchedAt, ok: {}, notes: [] };
	const step = async (/** @type {string} */ key, /** @type {() => Promise<any>} */ fn, required = true) => {
		try { await fn(); m.ok[key] = true; }
		catch (e) { m.ok[key] = false; m.notes.push(`${key}: ${e.message}`); log(`  ${key} failed: ${e.message}`); if (required) m.failed = true; }
	};

	if (!skipOM) await step('path', () => withLimits('path forecast', async () => {
		const a = await createOpenMeteoPathAtmosphere(p.lat, p.lon, { fetch: f, ...OPEN_METEO });
		if (a.lastError) m.notes.push(`path (partly): ${a.lastError.message}`);
	}));
	if (!skipOM) await step('single', () => withLimits('single forecast', () => createOpenMeteoAtmosphere(p.lat, p.lon, { fetch: f, ...OPEN_METEO })));
	if (isUS(p)) await step('nws', () => createNwsAtmosphere(p.lat, p.lon, { fetch: f, userAgent: USER_AGENT }), false);
	if (!skipOM) await step('normals', () => withLimits('normals', () => fetchOpenMeteoNormals(p.lat, p.lon, { fetch: f, ...NORMALS_OPTIONS })));
	await step('server', async () => {
		for (let k = 0; ; k++) {
			const s = await createServerPathAtmosphere(SERVER, p.lat, p.lon, { days: 31, fetch: f });
			await s.prefetch(Temporal.PlainDate.from(new Date(fetchedAt).toISOString().slice(0, 10)), SERVER_DAYS);
			if (!s.lastError && s.eventCount > 0) return;
			if (k >= 5) throw s.lastError ?? new Error('no profiles for this place');
			log(`  server: ${s.lastError?.message ?? 'no profiles yet'}; asking again in 60 s`); await sleep(60);
		}
	}, false);
	await step('horizon', async () => {
		for (let k = 0; ; k++) {
			try { await fetchHorizonForArea(SERVER, p.lat, p.lon, { fetch: f }); return; }
			catch (e) {
				if (!(e instanceof HorizonPendingError) || k >= 20) throw e;
				const s = Math.min(Math.max(e.retryAfterS ?? 30, 15), 180);
				log(`  horizon still being computed on the server; asking again in ${s} s`); await sleep(s);
			}
		}
	}, false);


	// check at once that everything saved replays (the clock set to when it was fetched, as run.mjs does)
	setClock(fetchedAt);
	const rf = replayFetch(id), bad = [];
	const tries = {
		path: () => createOpenMeteoPathAtmosphere(p.lat, p.lon, { fetch: rf, ...OPEN_METEO }),
		single: () => createOpenMeteoAtmosphere(p.lat, p.lon, { fetch: rf, ...OPEN_METEO }),
		nws: () => createNwsAtmosphere(p.lat, p.lon, { fetch: rf, userAgent: USER_AGENT }),
		normals: () => fetchOpenMeteoNormals(p.lat, p.lon, { fetch: rf, ...NORMALS_OPTIONS }),
		server: async () => { const s = await createServerPathAtmosphere(SERVER, p.lat, p.lon, { days: 31, fetch: rf, throwOnError: true });
			await s.prefetch(Temporal.PlainDate.from(new Date(fetchedAt).toISOString().slice(0, 10)), SERVER_DAYS); },
		horizon: () => fetchHorizonForArea(SERVER, p.lat, p.lon, { fetch: rf }),
	};
	for (const [k, fn] of Object.entries(tries)) if (m.ok[k]) { try { await fn(); } catch (e) { bad.push(`${k} (${e.message.slice(0, 100)})`); m.ok[k] = false; } }
	setClock(null);
	if (bad.length) { m.notes.push(`does not replay: ${bad.join('; ')}`); log(`  WARNING, saved but does not replay: ${bad.join('; ')}`); }
	fetched++;
	m.complete = !m.failed && !skipOM;
	m.refused = refused; refused = 0;
	writeManifest(id, m);
	log(`  ${m.complete ? 'done' : 'INCOMPLETE (run again later)'}: ${Object.entries(m.ok).map(([k, v]) => `${k} ${v ? 'ok' : 'failed'}`).join(', ')}${m.refused ? `; ${m.refused} events of weather data refused by the site's checks` : ''}`);
	await sleep(3);
}
const bad = todo.filter(p => !readManifest(slug(p.name))?.complete).map(p => p.name);
log(`finished in ${mmss((Date.now() - t0) / 1000)}. ${bad.length ? `Incomplete (run fetch.mjs again later to finish them): ${bad.join('; ')}` : 'Every place is complete.'} Next: node run.mjs`);
