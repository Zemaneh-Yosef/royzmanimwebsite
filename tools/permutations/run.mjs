// Step 2 (offline): replay what fetch.mjs saved through the site's own code under every setting, one decision at a
// time and in pairs, on all CPU cores, and write results/summary.md (+ summary.json, rows.csv).
//   node run.mjs                 every fetched place: each forecast day + the 15th of each month for a year
//   node run.mjs --quick         every third forecast day + every second month (about 3x faster)
//   node run.mjs --no-visible    skip the visible sunrise / sunset (the slow part: ~1 s each)
//   node run.mjs --threads 4     how many places at once (default: CPU cores - 1)
//   node run.mjs Jerusalem ...   only places whose name starts with these
import { Worker } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, PLACES, slug, readManifest } from './common.mjs';
import { CONFIGS, BASE, LEVELS, PAIRS, WEATHER_LABEL, FACTOR_LABEL, key } from './configs.mjs';

const args = process.argv.slice(2);
const quick = args.includes('--quick');
const noVisible = args.includes('--no-visible');
const ti = args.indexOf('--threads');
const threads = ti >= 0 ? Math.max(1, +args[ti + 1] || 1) : Math.max(1, availableParallelism() - 1);
const only = args.filter((a, i) => !a.startsWith('--') && !(ti >= 0 && i === ti + 1));
const OUT = join(HERE, 'results');
mkdirSync(OUT, { recursive: true });

const places = PLACES.filter(p => !only.length || only.some(o => p.name.toLowerCase().startsWith(o.toLowerCase())))
	.filter(p => { const ok = !!readManifest(slug(p.name)); if (!ok) console.log(`skipped ${p.name}: not fetched yet (node fetch.mjs)`); return ok; });
if (!places.length) { console.log('Nothing to run: fetch some places first (node fetch.mjs).'); process.exit(1); }

// ── Progress ──
const t0 = Date.now();
const share = new Map();            // place -> fraction done
const mmss = (/** @type {number} */ s) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;
let lastLine = 0;
function showProgress(force = false) {
	const now = Date.now();
	if (!force && now - lastLine < 1000) return;
	lastLine = now;
	const done = [...share.values()].reduce((a, b) => a + b, 0), total = places.length;
	const el = (now - t0) / 1000, eta = done > 0.05 ? el / done * (total - done) : NaN;
	const running = [...share].filter(([, f]) => f > 0 && f < 1).map(([n, f]) => `${n.split(',')[0]} ${Math.round(f * 100)}%`).join(', ');
	const bar = '#'.repeat(Math.round(done / total * 30)).padEnd(30, '.');
	const line = `[${bar}] ${(done / total * 100).toFixed(0)}%  ${Math.floor(done)}/${total} places  ${mmss(el)} elapsed` +
		`${Number.isFinite(eta) ? `, ~${mmss(eta)} left` : ''}${running ? `  | ${running}` : ''}`;
	if (process.stdout.isTTY) process.stdout.write('\r' + line.slice(0, (process.stdout.columns || 160) - 1).padEnd((process.stdout.columns || 160) - 1));
	else console.log(line);
}
const say = (/** @type {string} */ s) => { if (process.stdout.isTTY) process.stdout.write('\r' + ' '.repeat((process.stdout.columns || 160) - 1) + '\r'); console.log(s); showProgress(true); };

console.log(`${places.length} places, ${CONFIGS.size} settings each, ${quick ? 'quick' : 'full'} dates${noVisible ? ', no visible times' : ''}, ${Math.min(threads, places.length)} at once.`);

// ── Workers: one place at a time each ──
/** @type {any[]} */ const rows = [];
/** @type {Record<string, any>} */ const info = {};
await new Promise((resolve) => {
	const queue = [...places];
	let active = 0;
	const next = (/** @type {Worker} */ w) => {
		const p = queue.shift();
		if (!p) { w.terminate(); if (--active === 0) resolve(null); return; }
		share.set(p.name, 0.001);
		w.postMessage({ place: p, quick, noVisible });
	};
	for (let i = 0; i < Math.min(threads, places.length); i++) {
		const w = new Worker(new URL('./place.mjs', import.meta.url));
		active++;
		w.on('message', (msg) => {
			if (msg.type === 'progress') { share.set(msg.name, Math.min(0.999, msg.f)); showProgress(); return; }
			share.set(msg.name, 1);
			if (msg.type === 'done') {
				rows.push(...msg.rows.map(([place, israel, date, window, event, config, elevated, visible]) => ({ place, israel, date, window, event, config, elevated, visible })));
				info[msg.name] = { have: msg.have, missing: msg.missing, refused: msg.refused };
				say(`done  ${msg.name}: ${msg.have.join(', ') || 'no data'}${msg.missing.length ? ` (FAILED to replay: ${msg.missing.join(', ')})` : ''}`);
			} else say(`ERROR ${msg.name}: ${msg.message}`);
			next(w);
		});
		w.on('error', (e) => { say(`worker crashed: ${e.stack ?? e}`); if (--active === 0) resolve(null); });
		next(w);
	}
});
if (process.stdout.isTTY) process.stdout.write('\n');
console.log(`computed ${rows.length} times in ${mmss((Date.now() - t0) / 1000)}; writing the summary...`);

// ── Analysis ──
const at = new Map(rows.map(r => [`${r.place}|${r.date}|${r.event}|${r.config}`, r]));
const stats = (/** @type {number[]} */ v) => {
	const a = v.filter(Number.isFinite).map(Math.abs).sort((x, y) => x - y);
	if (!a.length) return null;
	const q = (/** @type {number} */ f) => a[Math.min(a.length - 1, Math.floor(f * a.length))];
	return { n: a.length, median: q(0.5), p95: q(0.95), max: a[a.length - 1] };
};
/** @type {Record<string, (r: any) => boolean>} */
const GROUPS = { all: () => true, Israel: r => r.israel, abroad: r => !r.israel, 'forecast days': r => r.window === 'forecast', 'later dates': r => r.window === 'later' };
const baseRows = rows.filter(r => r.config === key(BASE));
const diffs = (/** @type {any} */ c, /** @type {any} */ b, /** @type {'elevated'|'visible'} */ kind) => {
	const out = [];
	for (const r of baseRows) {
		const a = at.get(`${r.place}|${r.date}|${r.event}|${key(c)}`), z = at.get(`${r.place}|${r.date}|${r.event}|${key(b)}`);
		if (a && z) out.push({ r, d: (a[kind] - z[kind]) / 1000 });
	}
	return out;
};
const cell = (/** @type {any} */ s) => s ? `${s.median.toFixed(1)} / ${s.p95.toFixed(1)} / ${s.max.toFixed(1)} (${s.n})` : '—';
const worst = (/** @type {{ r: any, d: number }[]} */ ds) => {
	const by = new Map();
	for (const { r, d } of ds) if (Number.isFinite(d)) by.set(r.place, Math.max(by.get(r.place) ?? 0, Math.abs(d)));
	return [...by].sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([, v]) => v >= 0.5).map(([n, v]) => `${n} ${v.toFixed(0)}`).join('; ');
};
const levelName = (/** @type {string} */ f, /** @type {any} */ l) => f === 'weather' ? WEATHER_LABEL[l] : f === 'base' ? (l === 'none' ? 'none (sea level, as today)' : `C ${l} km`) : (l ? 'on' : 'off');
const groupCells = (/** @type {{ r: any, d: number }[]} */ ds) => Object.values(GROUPS).map(g => cell(stats(ds.filter(x => g(x.r)).map(x => x.d))));

const md = [], json = { base: BASE, quick, places: info, single: [], visible: [], pairs: [] };
md.push('# Permutation test', '',
	`${Object.keys(info).length} places, ${rows.length} times (${quick ? 'quick' : 'full'} run), ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.`, '',
	`**Base setting:** ${WEATHER_LABEL[BASE.weather]}; terrain base C ${BASE.base} km; real heights on; humidity off; sea-surface layer off.`,
	'Every cell is in seconds: **median / 95th percentile / largest (count)**, over places x dates x sunrise and sunset.',
	'"Forecast days" are the 16 days the forecast covers; "later dates" are the 15th of each month after that.', '');
const header = '| decision | changed to | all | Israel | abroad | forecast days | later dates | most affected (s) |\n|---|---|---|---|---|---|---|---|';

md.push('## 1. Each decision alone: elevated sunrise and sunset', '', 'How far the time moves when one decision changes and everything else stays at the base setting.', '', header);
for (const [f, ls] of Object.entries(LEVELS)) for (const l of ls) {
	if (l === BASE[f]) continue;
	const ds = diffs({ ...BASE, [f]: l }, BASE, 'elevated');
	md.push(`| ${FACTOR_LABEL[f]} | ${levelName(f, l)} | ${groupCells(ds).join(' | ')} | ${worst(ds)} |`);
	json.single.push({ factor: f, level: l, ...Object.fromEntries(Object.entries(GROUPS).map(([g, fn]) => [g, stats(ds.filter(x => fn(x.r)).map(x => x.d))])) });
}

md.push('', '## 2. Visible sunrise and sunset (over the terrain)', '', 'The terrain base and real heights don\'t enter the visible time; the weather and its settings do.', '', header);
for (const f of ['weather', 'humidity', 'sea']) for (const l of LEVELS[f]) {
	if (l === BASE[f]) continue;
	const ds = diffs({ ...BASE, [f]: l }, BASE, 'visible');
	md.push(`| ${FACTOR_LABEL[f]} | ${levelName(f, l)} | ${groupCells(ds).join(' | ')} | ${worst(ds)} |`);
	json.visible.push({ factor: f, level: l, all: stats(ds.map(x => x.d)) });
}

md.push('', '## 3. Decisions that change each other', '',
	'For each pair: how much the first decision\'s effect changes when the second one is set differently (its effect with the',
	'second changed, minus its effect at the base setting). Near 0: the two can be decided separately. Large: decide them together.', '',
	'| first decision | changed to | while second | is set to | all | Israel | abroad | most affected (s) |', '|---|---|---|---|---|---|---|---|');
for (const [f, g] of PAIRS) for (const c of CONFIGS.values()) {
	if (Object.keys(BASE).some(k => k !== f && k !== g && c[k] !== BASE[k]) || c[f] === BASE[f] || c[g] === BASE[g]) continue;
	const atBase = new Map(diffs({ ...BASE, [f]: c[f] }, BASE, 'elevated').map(x => [`${x.r.place}|${x.r.date}|${x.r.event}`, x.d]));
	const ds = diffs(c, { ...BASE, [g]: c[g] }, 'elevated').map(x => ({ r: x.r, d: x.d - (atBase.get(`${x.r.place}|${x.r.date}|${x.r.event}`) ?? NaN) }));
	const s = [GROUPS.all, GROUPS.Israel, GROUPS.abroad].map(fn => cell(stats(ds.filter(x => fn(x.r)).map(x => x.d))));
	md.push(`| ${FACTOR_LABEL[f]} | ${levelName(f, c[f])} | ${FACTOR_LABEL[g]} | ${levelName(g, c[g])} | ${s.join(' | ')} | ${worst(ds)} |`);
	json.pairs.push({ first: f, firstLevel: c[f], second: g, secondLevel: c[g], all: stats(ds.map(x => x.d)) });
}

md.push('', '## 4. Data behind each place', '', '| place | replayed | failed to replay | weather data the site refused |', '|---|---|---|---|');
for (const [n, v] of Object.entries(info)) md.push(`| ${n} | ${v.have.join(', ')} | ${v.missing.join(', ') || ''} | ${v.refused || ''} |`);

writeFileSync(join(OUT, 'summary.md'), md.join('\n') + '\n');
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(json, null, 1));
const iso = (/** @type {number} */ ms) => Number.isFinite(ms) ? new Date(ms).toISOString() : '';
writeFileSync(join(OUT, 'rows.csv'), 'place,israel,date,window,event,config,elevatedUtc,visibleUtc\n'
	+ rows.map(r => [JSON.stringify(r.place), r.israel, r.date, r.window, r.event, r.config, iso(r.elevated), iso(r.visible)].join(',')).join('\n') + '\n');
console.log(`Wrote results/summary.md (the tables), summary.json and rows.csv in ${mmss((Date.now() - t0) / 1000)}.`);
