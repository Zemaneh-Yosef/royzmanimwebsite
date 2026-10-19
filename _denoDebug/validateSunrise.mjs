// Compares computed visible sunrises / sunsets with observed ones. Run with Node or Deno:
//
//     node _denoDebug/validateSunrise.mjs --obs druk.csv --tz Asia/Jerusalem --horizon armon.json \
//          --profiles era5=era5.json --profiles flat=era5-no-terrain.json --normals jerusalem-normals.json
//
// --obs        CSV with a header naming at least `date` (YYYY-MM-DD) and `time` (local HH:MM[:SS]), and
//              optionally `event` (sunrise / sunset; default --event). Lines starting with # are skipped.
// --tz         the observations' IANA time zone.
// --horizon    the observer's HorizonSet: /v1/horizon?lat=..&lon=..&height=.. or make_horizon.py's output.
//              Its point gives the place and eye height; --lat / --lon / --height override them.
// --profiles   label=file, repeatable: path profiles (/v1/path-profiles, or zemaneh-shamayim's
//              era5_profiles.py for past dates). Each is run as its own atmosphere provider.
// --normals    label=file or file: a monthlyClimate() input ({ minC: [12], meanC: [12], ... }), run as a
//              provider too, with and without Keller & Hall's inversion rule (inversionCorrection).
// --humidity   use the water vapour the data carries (setHumidity(true)).
// --csv FILE   every observation with each provider's computed time and difference.
//
// Always runs "standard" too: no provider, the 34.48' average refraction. Differences are observed minus
// computed, in seconds (positive: the Sun was seen later than computed). The summary gives, per provider,
// the mean, mean absolute and rms differences overall and by month - what Keller & Hall (2022) report, so
// the numbers compare directly with their ±15 s.

import "../assets/libraries/temporal-polyfill/global.min.js";
import { readFileSync, writeFileSync } from "node:fs";
import ROYSPACalculator, { monthlyClimate } from "../assets/libraries/kosherZmanim/royzmanim-spa-corrections.js";
import { GeoLocation } from "../assets/libraries/kosherZmanim/kosher-zmanim.js";

const args = parseArgs(process.argv.slice(2));
if (!args.obs || !args.tz || !args.horizon) {
	console.error("usage: node _denoDebug/validateSunrise.mjs --obs FILE --tz ZONE --horizon FILE " +
		"[--profiles label=FILE ...] [--normals [label=]FILE] [--event sunrise|sunset] [--humidity] [--csv FILE]");
	process.exit(2);
}

const horizon = JSON.parse(readFileSync(args.horizon, "utf8"));
const point = horizon.points?.[0] ?? {};
const lat = num(args.lat) ?? point.lat ?? horizon.params?.lat;
const lon = num(args.lon) ?? point.lon ?? horizon.params?.lon;
const height = num(args.height) ?? point.height ?? 0;
if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("no lat / lon: pass --lat / --lon");
const geo = new GeoLocation("observer", lat, lon, Math.max(0, height), args.tz);
const observations = readObservations(args.obs, args.event?.[0] ?? "sunrise", args.tz);

/** @type {{ label: string, provider: any, options: any }[]} */
const runs = [{ label: "standard", provider: null, options: {} }];
for (const spec of args.profiles ?? []) {
	const [label, file] = spec.includes("=") ? spec.split(/=(.*)/s) : [spec, spec];
	const body = JSON.parse(readFileSync(file, "utf8"));
	const byKey = new Map();
	for (const e of body.events ?? []) if (e.profiles?.length) byKey.set(`${e.date}|${e.event}`, e);
	runs.push({
		label, options: {},
		provider: (date, event) => {
			const e = byKey.get(`${date.toString()}|${event}`);
			return e ? { path: e.profiles, key: `${label}|${e.date}|${e.event}` } : null;
		},
	});
}
for (const spec of args.normals ?? []) {
	const [label, file] = spec.includes("=") ? spec.split(/=(.*)/s) : ["normals", spec];
	const provider = monthlyClimate(JSON.parse(readFileSync(file, "utf8")));
	runs.push({ label, provider, options: {} });
	runs.push({ label: `${label}+inversion`, provider, options: { inversionCorrection: true } });
}

const rows = observations.map(o => ({ ...o, computed: {} }));
for (const run of runs) {
	const calc = new ROYSPACalculator();
	calc.configureForLocation(geo);
	if (args.humidity) calc.setHumidity(true);
	if (run.provider) calc.setAtmosphereProvider(run.provider);
	for (const r of rows) {
		// a provider without data for the date is not that provider's answer: leave the date out for it
		if (run.provider && !run.provider(r.date, r.event, geo)) continue;
		const ms = r.event === "sunrise" ? calc.getVisibleSunrise(r.date, geo, horizon, run.options)
			: calc.getVisibleSunset(r.date, geo, horizon, run.options);
		if (Number.isFinite(ms)) r.computed[run.label] = ms;
	}
}

console.log(`${rows.length} observations at ${lat.toFixed(4)}, ${lon.toFixed(4)}, eye ${height} m (${args.tz})`);
console.log("observed - computed, seconds\n");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
console.log(pad("provider", 22) + pad("n", 6) + pad("mean", 8) + pad("|mean|", 8) + pad("rms", 8) + "  rms by month (n)");
for (const run of runs) {
	const d = rows.filter(r => r.computed[run.label] != null).map(r => ({ m: r.date.month - 1, s: (r.observedMs - r.computed[run.label]) / 1000 }));
	if (!d.length) { console.log(pad(run.label, 22) + "no dates"); continue; }
	const s = stats(d.map(x => x.s));
	const byMonth = months.map((name, m) => {
		const x = d.filter(v => v.m === m).map(v => v.s);
		return x.length ? `${name} ${stats(x).rms.toFixed(0)} (${x.length})` : null;
	}).filter(Boolean).join(", ");
	console.log(pad(run.label, 22) + pad(String(d.length), 6) + pad(s.mean.toFixed(1), 8) + pad(s.mae.toFixed(1), 8) +
		pad(s.rms.toFixed(1), 8) + "  " + byMonth);
}

if (args.csv) {
	const labels = runs.map(r => r.label);
	const lines = [["date", "event", "observed", ...labels.flatMap(l => [`${l}`, `${l}_diff_s`])].join(",")];
	for (const r of rows) {
		lines.push([r.date.toString(), r.event, iso(r.observedMs), ...labels.flatMap(l => r.computed[l] != null
			? [iso(r.computed[l]), ((r.observedMs - r.computed[l]) / 1000).toFixed(1)] : ["", ""])].join(","));
	}
	writeFileSync(args.csv[0], lines.join("\n") + "\n");
	console.log(`\nper observation: ${args.csv[0]}`);
}

function readObservations(file, defaultEvent, tz) {
	const lines = readFileSync(file, "utf8").split(/\r?\n/).filter(l => l.trim() && !l.startsWith("#"));
	const head = lines.shift().split(",").map(h => h.trim().toLowerCase());
	const col = name => head.indexOf(name);
	if (col("date") < 0 || col("time") < 0) throw new Error(`${file}: the header needs date and time columns`);
	return lines.map(l => {
		const c = l.split(",").map(v => v.trim());
		const date = Temporal.PlainDate.from(c[col("date")]);
		const [hh, mm, ss = "0"] = c[col("time")].split(":");
		const zdt = date.toZonedDateTime({ timeZone: tz, plainTime: new Temporal.PlainTime(+hh, +mm, Math.floor(+ss)) });
		const event = col("event") >= 0 && c[col("event")] ? c[col("event")].toLowerCase() : defaultEvent;
		return { date, event, observedMs: zdt.epochMilliseconds + (+ss % 1) * 1000 };
	});
}

function stats(x) {
	const n = x.length, mean = x.reduce((a, b) => a + b, 0) / n;
	return { mean, mae: x.reduce((a, b) => a + Math.abs(b), 0) / n, rms: Math.sqrt(x.reduce((a, b) => a + b * b, 0) / n) };
}

function parseArgs(argv) {
	/** @type {Record<string, any>} */
	const out = {};
	for (let i = 0; i < argv.length; i++) {
		const k = argv[i].replace(/^--/, "");
		if (k === "humidity") { out.humidity = true; continue; }
		(out[k] ??= []).push(argv[++i]);
	}
	for (const k of ["obs", "tz", "horizon", "lat", "lon", "height"]) if (out[k]) out[k] = out[k][0];
	return out;
}

function num(v) { return v == null ? undefined : Number(v); }
function pad(s, n) { return String(s).padEnd(n); }
function iso(ms) { return new Date(ms).toISOString(); }
