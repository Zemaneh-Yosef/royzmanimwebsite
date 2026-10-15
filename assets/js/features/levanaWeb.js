// @ts-check

/**
 * Birkat Halevana card for the web calendar (/calendar).
 *
 * The same pieces the weekly print uses: moon-birkat-worker.js computes, for every night of the month's
 * Birkat Halevana range, when the moon is up inside the halachic night (clipped to shkiya -> netz,
 * lechatchila tzet -> alot), with the terrain-aware moon horizon when the refraction server sent one.
 * The glyphs are the print's (moonGlyphSvg), and the begin / end / strict / early-end lines follow the
 * print's handleSingleBL() (features/weeklyPrint/print-web-worker.js).
 */

import { moonGlyphSvg } from "../../libraries/mooncalc/moonRiseSetCalc.js";
import { HebrewNumberFormatter } from "../WebsiteCalendar.js";
import { spawnWorker } from "../misc/worker.js";
import { settings } from "../settings/handler.js";
import { loadRefraction, snapshotProvider } from "../refraction-data.js";
import { EN, TEXT, levanaWindow, strictLabel as levanaStrictLabel } from "./levanaWindow.js";

/** @typedef {import('./weeklyPrint/moon-birkat-worker.js').MonthResult} MonthResult */
/** @typedef {import('./weeklyPrint/moon-birkat-worker.js').BirkatRow} BirkatRow */
/** @typedef {import('./weeklyPrint/moon-birkat-worker.js').MoonEvent} MoonEvent */
/** @typedef {import('./weeklyPrint/print-web-worker.js').RefractionInit} RefractionInit */
/** @typedef {import('../zmanimListUpdater.js').default} ZmanimListUpdater */
/** @typedef {import('./levanaWindow.js').Lang} Lang */

const WORKER_URL = '/assets/js/features/weeklyPrint/moon-birkat-worker.js';
const GLYPH_SIZE = 40;
/** Results kept per location / month / refraction state; a page visit rarely needs more than a few. */
const MAX_CACHED = 12;

/**
 * @typedef {Object} TonightContext
 * @property {string} monthName
 * @property {number} tonightDay                     Hebrew day the night beginning this evening belongs to
 * @property {boolean} lastNight                     tonight is the last night
 * @property {number} tonightTzet                    nightfall this evening
 * @property {number} tonightAlot                    dawn the next morning
 */
/** @typedef {import('./levanaWindow.js').LevanaWindow & TonightContext} MonthContext */

export default class LevanaCard {
	hNum = new HebrewNumberFormatter();

	/** @type {Map<string, { result?: MonthResult, error?: unknown, promise: Promise<MonthResult> }>} */
	results = new Map();

	/** The signature the card is showing (or waiting for). */
	shownSig = '';

	/** Moon horizon fetched by this card, per place ("lat,lon"). @type {Map<string, import('../refraction-snapshot.js').Horizon | null>} */
	moonHorizons = new Map();

	/** Places whose moon horizon fetch already started. @type {Set<string>} */
	moonHorizonRequested = new Set();

	/** @type {ZmanimListUpdater | null} */
	updater = null;

	/** @param {HTMLElement} root the [data-zfFind="LevanaCard"] element */
	constructor(root) {
		this.root = root;
	}

	// ─── Entry points ───────────────────────────────────────────────────────

	/**
	 * Called after every list render (date change, new location, new refraction data).
	 * @param {ZmanimListUpdater} updater
	 */
	render(updater) {
		this.updater = updater;
		const ctx = this.monthContext(updater);
		if (!ctx) {
			this.setVisible(false);
			this.shownSig = '';
			return;
		}

		const lang = /** @type {Lang} */ (settings.language());
		const t = TEXT[lang] ?? EN;

		/** @type {HTMLElement} */ (this.root.querySelector('[data-zfReplace="levanaTitle"]')).textContent =
			t.title(ctx.monthName);
		/** @type {HTMLElement} */ (this.root.querySelector('[data-zfReplace="levanaMolad"]')).textContent =
			`${t.molad}: ${this.formatDateTime(ctx.molad, lang, updater, ctx.month)}`;
		this.renderTimes(ctx, lang, updater);
		this.renderNightInfo(ctx, lang, updater);
		this.maybeFetchMoonHorizon(updater);

		const { sig, run } = this.prepareCompute(ctx, updater);
		this.shownSig = sig;

		const cached = this.results.get(sig);
		if (cached?.result) {
			// No moon during the valid part of tonight: nothing to say tonight, so no card
			this.setVisible(this.renderTonight(ctx, cached.result, lang, updater));
			return;
		}
		if (cached?.error) {
			// the dates still hold; only the moon is missing
			this.renderMessage(t.failed);
			this.setVisible(true);
			return;
		}

		// Whether tonight gets a card depends on the moon, so the card waits for it. A refined version
		// of the night already on screen (e.g. after a forecast refresh) keeps it showing meanwhile.
		const stillSameNight = this.root.style.display !== 'none'
			&& this.root.querySelector(`[data-levana-night="${ctx.year}-${ctx.month}-${ctx.tonightDay}"]`);
		if (!stillSameNight)
			this.setVisible(false);

		const entry = cached ?? this.startCompute(sig, run);
		entry.promise.then(() => {
			if (this.shownSig === sig && this.updater) this.render(this.updater);
		}, () => {
			if (this.shownSig === sig && this.updater) this.render(this.updater);
		});
	}

	/**
	 * The page's refraction load finished (whether or not the list re-rendered).
	 * @param {ZmanimListUpdater} updater
	 */
	onRefraction(updater) {
		this.render(updater);
	}

	// ─── Month data (main thread, cheap) ────────────────────────────────────

	/**
	 * The Birkat Halevana month for the selected date, or null unless Birkat Halevana can be said on the
	 * night that begins this evening (from 7 days after the molad, or the Av / Tishrei recommendation,
	 * until the end people go by).
	 * @param {ZmanimListUpdater} updater
	 * @returns {MonthContext | null}
	 */
	monthContext(updater) {
		const jCal = updater.jCal;
		const day = jCal.getJewishDayOfMonth();
		if (day > 15)
			return null;

		const win = levanaWindow(jCal, updater.zmanCalc);
		const { month, effectiveEndMs, validFromMs } = win;
		const zc = (/** @type {Temporal.PlainDate} */ d) => updater.zmanCalc.chainDate(d.withCalendar('iso8601'));

		// Tonight: the selected date's sunset to the next sunrise
		const selected = jCal.getDate().withCalendar('iso8601');
		const tonightStart = zc(selected).getShkiya().epochMilliseconds;
		const tonightEnd = zc(selected.add({ days: 1 })).timeRange.current.sunrise.epochMilliseconds;
		if (tonightStart >= effectiveEndMs || tonightEnd <= validFromMs)
			return null;
		const tonightCal = jCal.chainDate(selected.add({ days: 1 }));
		const tonightDay = tonightCal.getJewishMonth() === month ? tonightCal.getJewishDayOfMonth() : 0;
		const lastNight = zc(selected.add({ days: 1 })).getShkiya().epochMilliseconds >= effectiveEndMs;
		const tonightTzet = zc(selected).getTzet().epochMilliseconds;
		const tonightAlot = zc(selected.add({ days: 1 })).getAlotHashahar().epochMilliseconds;

		return {
			...win, tonightDay, lastNight, tonightTzet, tonightAlot,
			monthName: settings.language() == 'he' ? win.monthNames.he : win.monthNames.en
		};
	}

	// ─── Worker ─────────────────────────────────────────────────────────────

	/**
	 * What the worker needs for this month with the refraction data the page has now, and a signature
	 * that changes whenever the result would.
	 * @param {MonthContext} ctx
	 * @param {ZmanimListUpdater} updater
	 */
	prepareCompute(ctx, updater) {
		const geo = updater.geoLocation;
		const placeKey = `${geo.getLatitude()},${geo.getLongitude()}`;
		const config = updater.zmanCalc.config;
		const israel = updater.jCal.getInIsrael();
		const elevation = config.elevation;
		const hourCalculator = settings.calendarToggle.forceSunSeasonal() ? 'seasonal' : 'degrees';

		const horizon = this.moonHorizons.get(placeKey) ?? updater.refraction?.horizon ?? config.horizon ?? null;
		const normals = updater.refraction?.normals ?? null;
		const provider = config.atmosphereProvider ?? null;
		const haze = config.haze ?? null;
		const forecastAt = updater._shownForecastAt ?? null;

		const sig = [
			placeKey, geo.getElevation(), geo.getTimeZone(), israel, elevation, hourCalculator, ctx.year, ctx.month,
			forecastAt, provider ? 'p' : '-', normals ? 'n' : '-',
			horizon ? (horizon.moon ? 'moon' : 'sun') : 'none', haze?.forecastFetchedAt ?? (haze ? 'h' : '-')
		].join('|');

		const run = () => {
			/** @type {RefractionInit | null} */
			let init = null;
			if (provider || horizon || normals) {
				// Every night the worker computes: the evening before the 1st to the morning after the 15th
				const from = updater.jCal.chainJewishDate(ctx.year, ctx.month, 1).getDate().withCalendar('iso8601').subtract({ days: 1 });
				init = {
					type: 'refraction',
					table: provider ? snapshotProvider(provider, geo, from, 18) : {},
					normals, horizon, haze
				};
			}

			/** @type {[string, number, number, number, string]} */
			const geoCoordinates = [geo.getLocationName(), geo.getLatitude(), geo.getLongitude(), geo.getElevation(), geo.getTimeZone()];
			return {
				init,
				params: { geoCoordinates, months: [{ year: ctx.year, month: ctx.month }], israel, elevation, hourCalculator }
			};
		};

		return { sig, run };
	}

	/**
	 * @param {string} sig
	 * @param {() => { init: RefractionInit | null, params: import('./weeklyPrint/moon-birkat-worker.js').birkatWorkerParam }} run
	 */
	startCompute(sig, run) {
		/** @type {{ result?: MonthResult, error?: unknown, promise: Promise<MonthResult> }} */
		const entry = { promise: Promise.resolve(/** @type {any} */ (null)) };
		entry.promise = new Promise((resolve, reject) => {
			let worker;
			try {
				const { init, params } = run();
				worker = spawnWorker(WORKER_URL);
				worker.addEventListener('message', ({ data }) => {
					worker.terminate();
					if (Array.isArray(data) && data[0]) resolve(data[0]);
					else reject(new Error(data?.error ?? 'No result'));
				});
				worker.addEventListener('error', err => {
					worker.terminate();
					reject(err);
				});
				if (init) worker.postMessage(init);
				worker.postMessage(params);
			} catch (e) {
				worker?.terminate();
				reject(e);
			}
		});
		entry.promise.then(
			result => { entry.result = result; },
			error => { entry.error = error; console.error('Birkat Halevana moon worker failed:', error); }
		);

		this.results.set(sig, entry);
		while (this.results.size > MAX_CACHED)
			this.results.delete(/** @type {string} */ (this.results.keys().next().value));
		return entry;
	}

	/**
	 * The page's own refraction load asks for the sun's horizon only. Once it's in, fetch the moon's
	 * (moonrise / moonset over the terrain) for this place, once; it is stored with the place's data,
	 * so later visits have it right away.
	 * @param {ZmanimListUpdater} updater
	 */
	maybeFetchMoonHorizon(updater) {
		if (!updater.refraction) return; // after the page's load, so the two never fetch the forecast twice
		const geo = updater.geoLocation;
		const placeKey = `${geo.getLatitude()},${geo.getLongitude()}`;
		if (updater.refraction.horizon?.moon || this.moonHorizonRequested.has(placeKey))
			return;

		this.moonHorizonRequested.add(placeKey);
		loadRefraction(geo.getLatitude(), geo.getLongitude(), {
			moon: true,
			haze: false,
			humidity: settings.refraction.humidity()
		}).then(data => {
			if (!data.horizon?.moon) return;
			this.moonHorizons.set(placeKey, data.horizon);
			if (this.updater) this.render(this.updater);
		}).catch(e => console.warn('Moon horizon unavailable; using the flat horizon', e));
	}

	// ─── Rendering ──────────────────────────────────────────────────────────

	/** @param {ZmanimListUpdater} updater */
	formats(updater) {
		const locale = updater.dtF[0];
		/** @type {Intl.DateTimeFormatOptions} */
		const time = { hourCycle: settings.timeFormat(), hour: 'numeric', minute: '2-digit' };
		return {
			locale,
			time,
			/** @type {Intl.DateTimeFormatOptions} */
			dateTime: { weekday: 'short', month: 'short', day: 'numeric', ...time },
			/** @type {Intl.DateTimeFormatOptions} */
			date: { weekday: 'short', month: 'short', day: 'numeric' }
		};
	}

	/**
	 * @param {MonthContext} ctx
	 * @param {Lang} lang
	 * @param {ZmanimListUpdater} updater
	 */
	renderTimes(ctx, lang, updater) {
		const t = TEXT[lang] ?? EN;
		const f = this.formats(updater);
		const fmt = (/** @type {Temporal.ZonedDateTime} */ z) => this.formatDateTime(z, lang, updater, ctx.month);
		const list = /** @type {HTMLElement} */ (this.root.querySelector('[data-zfFind="levanaTimes"]'));

		/** @type {string[]} */
		const items = [];
		const li = (/** @type {string} */ html, cls = '') => items.push(`<li class="list-group-item${cls ? ' ' + cls : ''}">${html}</li>`);
		const row = (/** @type {string} */ label, /** @type {string} */ value) =>
			`<span class="levanaLabel">${label}</span><span class="levanaValue">${value}</span>`;
		const struck = (/** @type {string} */ s) => `<s class="levanaStruck">${s}</s>`;

		// The start isn't a row: on a day view it only matters when it falls inside tonight (renderNightInfo)
		const endMain = `${fmt(ctx.endIkar)} <s class="levanaStruck small">(${ctx.endStretch.toLocaleString(f.locale, f.time)})</s>`;
		const strictLabel = this.strictLabel(ctx, t);
		const earlyLabel = t.earlyEnd(ctx.fifteenthIsShabbat);
		const earlyEnd = `${fmt(ctx.endEarlyIkar)} <s class="levanaStruck small">(${ctx.endEarlyStretch.toLocaleString(f.locale, f.time)})</s>`;

		if (!ctx.useEarlyTimes) {
			li(row(t.ends, endMain));
			li(row(strictLabel, fmt(ctx.endStrict)), 'levanaRec');
		} else if (Temporal.ZonedDateTime.compare(ctx.endStrict, ctx.endEarlyIkar) < 0) {
			// Rema is earlier than the early end: the regular end is struck, the early end replaces it
			li(row(t.ends, struck(endMain)));
			li(row(earlyLabel, earlyEnd));
			li(row(strictLabel, fmt(ctx.endStrict)), 'levanaRec');
		} else {
			// Rema is later than the early end: both the regular end and Rema are struck
			li(row(t.ends, struck(endMain)));
			li(row(strictLabel, struck(fmt(ctx.endStrict))), 'levanaRec');
			li(row(earlyLabel, earlyEnd));
		}

		list.innerHTML = items.join('');
	}

	/**
	 * "Rema" when the half-way-between-moladot end is later than the regular end, else "Strict".
	 * @param {MonthContext} ctx
	 * @param {typeof EN} t
	 */
	strictLabel(ctx, t) {
		return levanaStrictLabel(ctx, t);
	}

	/**
	 * A date and time. English: the civil date. Hebrew: the Hebrew date, as the halachic day it falls in
	 * (after sunset it is already the next day's night), without the month when it is the card's month:
	 * "יום ב׳ ט״ו, 6:07", "ליל ט״ו, 21:44".
	 * @param {Temporal.ZonedDateTime} z
	 * @param {Lang} lang
	 * @param {ZmanimListUpdater} updater
	 * @param {number} cardMonth
	 */
	formatDateTime(z, lang, updater, cardMonth) {
		const f = this.formats(updater);
		const time = z.toLocaleString(f.locale, f.time);
		if (lang != 'he')
			return `${z.toLocaleString(f.locale, f.date)}, ${time}`;

		const civil = z.toPlainDate().withCalendar('iso8601');
		const zc = updater.zmanCalc.chainDate(civil);
		const ms = z.epochMilliseconds;
		let night = false;
		let day = civil;
		if (ms < zc.getAlotHashahar().epochMilliseconds) night = true;            // after midnight: this date's night
		else if (ms >= zc.getShkiya().epochMilliseconds) { night = true; day = civil.add({ days: 1 }); }

		const cal = updater.jCal.chainDate(day);
		const dayNum = this.hNum.formatHebrewNumber(cal.getJewishDayOfMonth());
		const month = cal.getJewishMonth() === cardMonth ? '' : ' ' + cal.formatJewishMonth().he;
		const weekday = ['', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת', 'א׳'][day.dayOfWeek];
		const prefix = night ? 'ליל' : day.dayOfWeek == 6 ? 'שבת' : `יום ${weekday}`;
		return `${prefix} ${dayNum}${month}, ${time}`;
	}

	/**
	 * Under tonight's moon: the wait for the start when it falls inside tonight, and tonight's range.
	 * @param {MonthContext} ctx
	 * @param {Lang} lang
	 * @param {ZmanimListUpdater} updater
	 */
	renderNightInfo(ctx, lang, updater) {
		const t = TEXT[lang] ?? EN;
		const box = /** @type {HTMLElement} */ (this.root.querySelector('[data-zfFind="levanaNightInfo"]'));
		const time = (/** @type {number} */ ms) => this.time(ms, updater);

		let html = '';
		if (ctx.validFromMs > ctx.tonightTzet)
			html += `<div class="levanaWait">${t.wait} <b>${time(ctx.validFromMs)}</b></div>`;
		html += `<div class="levanaRange"><span class="levanaTimeLabel">${t.nightRange}</span>`
			+ `<span>${time(ctx.tonightTzet)} – ${time(ctx.tonightAlot)}</span></div>`;
		box.innerHTML = html;
	}

	/**
	 * @param {number} ms
	 * @param {ZmanimListUpdater} updater
	 */
	time(ms, updater) {
		const f = this.formats(updater);
		return Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(updater.geoLocation.getTimeZone()).toLocaleString(f.locale, f.time);
	}

	/** @param {boolean} visible */
	setVisible(visible) {
		if (visible) this.root.firstElementChild.style.removeProperty('display');
		else this.root.firstElementChild.style.display = 'none';
	}

	/** @param {string} text */
	renderMessage(text) {
		const box = /** @type {HTMLElement} */ (this.root.querySelector('[data-zfFind="levanaTonight"]'));
		box.removeAttribute('data-levana-night');
		box.innerHTML = `<p class="levanaMessage mb-0">${text}</p>`;
	}

	/**
	 * Tonight's moon only: the night that begins on the selected date's evening. The next night's
	 * moon is on the next day's page. Returns false when the moon isn't up during the part of tonight
	 * Birkat Halevana can be said in (e.g. it sets before the start): that day gets no card.
	 * @param {MonthContext} ctx
	 * @param {MonthResult} result
	 * @param {Lang} lang
	 * @param {ZmanimListUpdater} updater
	 */
	renderTonight(ctx, result, lang, updater) {
		const t = TEXT[lang] ?? EN;
		const box = /** @type {HTMLElement} */ (this.root.querySelector('[data-zfFind="levanaTonight"]'));
		const tonightDay = /** @type {number} */ (ctx.tonightDay);
		const row = result.rows.find(r => r.jewishDay === tonightDay);
		if (!row) {
			box.removeAttribute('data-levana-night');
			box.innerHTML = '';
			return false;
		}
		box.setAttribute('data-levana-night', `${ctx.year}-${ctx.month}-${tonightDay}`);

		const time = (/** @type {number} */ ms) => this.time(ms, updater);
		const { rise, set, mid } = row.events;
		/** @type {MoonEvent | null} */
		let glyphEvent;
		let horizon = false;
		let label;
		let times;
		switch (row.coverage) {
			case 'both':
				glyphEvent = rise; label = 'Moon in the night sky';
				times = `<span class="levanaTime" title="${t.rises}">↑ ${time(/** @type {MoonEvent} */ (rise).ms)}</span>`
					+ `<span class="levanaTime" title="${t.sets}">↓ ${time(/** @type {MoonEvent} */ (set).ms)}</span>`;
				break;
			case 'from':
				glyphEvent = rise; horizon = true; label = 'Moon at rise';
				times = `<span class="levanaTimeLabel">${t.from}</span><span class="levanaTime">${time(/** @type {MoonEvent} */ (rise).ms)}</span>`;
				break;
			case 'until':
				glyphEvent = set; horizon = true; label = 'Moon at set';
				times = `<span class="levanaTimeLabel">${t.until}</span><span class="levanaTime">${time(/** @type {MoonEvent} */ (set).ms)}</span>`;
				break;
			default:
				glyphEvent = mid; label = 'Moon in the night sky';
				times = `<span class="levanaTime">${t.all}</span>`;
		}

		const glyph = glyphEvent
			? moonGlyphSvg(glyphEvent.thetaDeg, glyphEvent.phaseAngleDeg, { size: GLYPH_SIZE, horizon, label })
			: '';

		const strictLabel = this.strictLabel(ctx, t);

		/** @type {string[]} */
		const tags = [];
		if (ctx.lastNight) tags.push(`<span class="badge text-bg-warning">${t.lastNight}</span>`);
		if (row.bediavadOnly) tags.push(`<span class="levanaTag" title="${t.twilightNote}">${t.twilight}</span>`);
		if (row.marks?.endStrict && row.marks.endStrict.position !== 'day')
			tags.push(`<span class="levanaTag">${strictLabel}: ${t.upTo} ${time(row.marks.endStrict.time)}</span>`);

		box.innerHTML = `<div class="levanaGlyph">${glyph}</div>`
			+ `<div class="levanaTimes">${times}</div>`
			+ (tags.length ? `<div class="levanaTags">${tags.join('')}</div>` : '');
		return true;
	}
}
