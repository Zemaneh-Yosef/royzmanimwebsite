// @ts-check

/**
 * Birkat Halevana card for the web calendar (/calendar).
 *
 * The card's elements and labels are in pages/calendar.html (one span per language, the page shows the one
 * in its language); this fills in the values and shows or hides rows.
 *
 * Like the zmanim list, it shows what it can at once and refines it later: the month's dates come from the
 * main thread, tonight's moon first from the small estimate (astro/moon-estimate.js, marked as approximate),
 * then from moon-birkat-worker.js (the one the weekly print uses), which computes, for every night of the
 * month's Birkat Halevana range, when the moon is up inside the halachic night (clipped to shkiya -> netz,
 * lechatchila tzet -> alot), with the terrain-aware moon horizon when the refraction server sent one.
 * The glyphs are the print's (moonGlyphSvg), and the begin / end / strict / early-end lines follow the
 * print's handleSingleBL() (print/weekly/worker.js).
 */

import { moonGlyphSvg } from "../astro/moon-glyph.js";
import { clip, nightMoon } from "../astro/moon-coverage.js";
import { estimatedMoonEvents, estimatedMoonLook } from "../astro/moon-estimate.js";
import { HebrewNumberFormatter } from "../core/WebsiteCalendar.js";
import { requestMoon } from "../astro/visible-horizon-client.js";
import { settings } from "../settings/handler.js";
import { loadRefraction, snapshotProvider, MIN_REFRACTION_RECHECK_MS } from "../astro/refraction-data.js";
import { optionsOf } from "../core/zmanimSettings.js";
import { levanaWindow, strictKind } from "./levanaWindow.js";

/** @typedef {import('../print/weekly/moon-birkat-worker.js').MonthResult} MonthResult */
/** @typedef {import('../print/weekly/moon-birkat-worker.js').BirkatRow} BirkatRow */
/** @typedef {import('../print/weekly/moon-birkat-worker.js').MoonEvent} MoonEvent */
/** @typedef {import('../print/weekly/worker.js').RefractionInit} RefractionInit */
/** @typedef {import('../pages/calendar.js').default} ZmanimListUpdater */
/** @typedef {import('./levanaWindow.js').Lang} Lang */
/** What the card needs of a night's moon: the worker's row, or the estimate's. @typedef {Pick<BirkatRow, 'coverage' | 'events' | 'bediavadOnly' | 'marks'>} TonightRow */

const GLYPH_SIZE = 40;
/** Results kept per location / month / refraction state; a page visit rarely needs more than a few. */
const MAX_CACHED = 12;
/** The card's labels in the markup, one span per language: the month name is filled in each. @type {Lang[]} */
const LANGS = ['he', 'he-Latn', 'en'];

/**
 * @typedef {Object} TonightContext
 * @property {string} monthName
 * @property {number} tonightDay                     Hebrew day the night beginning this evening belongs to
 * @property {boolean} lastNight                     tonight is the last night
 * @property {number} tonightShkiya                  sunset this evening
 * @property {number} tonightTzet                    nightfall this evening
 * @property {number} tonightAlot                    dawn the next morning
 * @property {number} tonightNetz                    sunrise the next morning
 */
/** @typedef {import('./levanaWindow.js').LevanaWindow & TonightContext} MonthContext */

export default class LevanaCard {
	hNum = new HebrewNumberFormatter();

	/** @type {Map<string, { result?: MonthResult, error?: unknown, promise: Promise<MonthResult> }>} */
	results = new Map();

	/** The signature the card is showing (or waiting for). */
	shownSig = '';

	/** Which night (place, month, day) the moon slot shows exact worker data for; '' when it shows the estimate. */
	exactNight = '';

	/** Moon horizon fetched by this card, per place ("lat,lon"). @type {Map<string, import('../core/refraction-snapshot.js').Horizon | null>} */
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
			this.exactNight = '';
			return;
		}

		const lang = /** @type {Lang} */ (settings.language());
		this.renderHeader(ctx, lang, updater);
		this.renderTimes(ctx, lang, updater);
		this.renderNightInfo(ctx, updater);
		this.maybeFetchMoonHorizon(updater);

		const { sig, run, placeKey, moonKey } = this.prepareCompute(ctx, updater);
		this.shownSig = sig;
		const nightKey = `${placeKey}|${ctx.year}-${ctx.month}-${ctx.tonightDay}`;

		const cached = this.results.get(sig);
		if (cached?.result) {
			// No moon during the valid part of tonight: nothing to say tonight, so no card
			const row = cached.result.rows.find(r => r.jewishDay === ctx.tonightDay) ?? null;
			const visible = this.renderTonight(ctx, row, 'exact', updater);
			this.exactNight = visible ? nightKey : '';
			this.setVisible(visible);
			return;
		}
		if (cached?.error) {
			// the dates still hold; only the exact moon is missing
			this.exactNight = '';
			this.setVisible(this.renderTonight(ctx, this.estimateRow(ctx, updater), 'failed', updater));
			return;
		}

		// The estimate right away. A refined version of the night already on screen (e.g. after a forecast
		// refresh) keeps showing meanwhile instead of stepping back to it.
		const stillSameNight = this.exactNight === nightKey && /** @type {HTMLElement} */ (this.root.firstElementChild).style.display !== 'none';
		if (!stillSameNight) {
			this.exactNight = '';
			this.setVisible(this.renderTonight(ctx, this.estimateRow(ctx, updater), 'estimate', updater));
		}

		const entry = cached ?? this.startCompute(sig, moonKey, run);
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
		const tonightEnd = zc(selected.add({ days: 1 })).timeRange.current.listedSunrise.epochMilliseconds;
		if (tonightStart >= effectiveEndMs || tonightEnd <= validFromMs)
			return null;
		const tonightCal = jCal.chainDate(selected.add({ days: 1 }));
		const tonightDay = tonightCal.getJewishMonth() === month ? tonightCal.getJewishDayOfMonth() : 0;
		const lastNight = zc(selected.add({ days: 1 })).getShkiya().epochMilliseconds >= effectiveEndMs;
		const tonightTzet = zc(selected).getTzet().epochMilliseconds;
		const tonightAlot = zc(selected.add({ days: 1 })).getAlotHashahar().epochMilliseconds;

		return {
			...win, tonightDay, lastNight, tonightShkiya: tonightStart, tonightTzet, tonightAlot, tonightNetz: tonightEnd,
			monthName: settings.language() == 'he' ? win.monthNames.he : win.monthNames.en
		};
	}

	// ─── Tonight's moon, estimated (main thread, cheap) ─────────────────────

	/**
	 * Tonight's row the way the worker would build it (same windows, same coverage rules), from the quick moon
	 * estimate. Null when the moon isn't up during the part of tonight Birkat Halevana can be said in.
	 * @param {MonthContext} ctx
	 * @param {ZmanimListUpdater} updater
	 * @returns {TonightRow | null}
	 */
	estimateRow(ctx, updater) {
		if (!(ctx.tonightDay >= 1 && ctx.tonightDay <= 15))
			return null;
		const lat = updater.geoLocation.getLatitude(), lon = updater.geoLocation.getLongitude();
		const start = ctx.start.epochMilliseconds;
		// as in moon-birkat-worker.js: shkiya -> netz and tzet -> alot, from the start (7 days after the molad) to the 15th
		const bediavad = clip(ctx.tonightShkiya, ctx.tonightNetz, start, ctx.endStretch.epochMilliseconds);
		if (!bediavad)
			return null;
		const lechatchila = clip(ctx.tonightTzet, ctx.tonightAlot, start, ctx.endIkar.epochMilliseconds);
		const night = nightMoon(estimatedMoonEvents(lat, lon), bediavad, lechatchila);
		if (!night)
			return null;

		const { moon, coverage, bediavadOnly } = night;
		const look = (/** @type {number | null} */ ms) => ms === null ? null : estimatedMoonLook(ms, lat, lon);
		const strictMs = ctx.endStrict.epochMilliseconds;
		return {
			coverage,
			events: {
				rise: coverage === 'both' || coverage === 'from' ? look(moon.rise) : null,
				set: coverage === 'both' || coverage === 'until' ? look(moon.set) : null,
				mid: coverage === 'all' ? look(Math.round(bediavad[0] + (bediavad[1] - bediavad[0]) / 2)) : null
			},
			bediavadOnly,
			// the strict end falls inside tonight (the worker puts it on the row it falls in)
			...(strictMs >= ctx.tonightShkiya && strictMs < ctx.tonightNetz
				? { marks: { endStrict: { time: strictMs, position: strictMs < ctx.tonightTzet ? 'shkiyaToTzet' : strictMs < ctx.tonightAlot ? 'lechatchila' : 'alotToNetz' } } }
				: {})
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
		// the calendar's own options, so the moon's netz / shkiya match the times on the page
		const zemanim = optionsOf(config);

		const horizon = this.moonHorizons.get(placeKey) ?? updater.refraction?.horizon ?? config.horizon ?? null;
		const normals = updater.refraction?.normals ?? null;
		const provider = config.atmosphereProvider ?? null;
		const haze = config.haze ?? null;
		const forecastAt = updater._shownForecastAt ?? null;

		const sig = [
			placeKey, geo.getElevation(), geo.getTimeZone(), JSON.stringify(zemanim), ctx.year, ctx.month,
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
				params: { geoCoordinates, months: [{ year: ctx.year, month: ctx.month }], zemanim }
			};
		};

		// a newer request for the same place and month replaces one still waiting in the shared worker's queue
		const moonKey = `${placeKey}|${ctx.year}-${ctx.month}`;

		return { sig, run, placeKey, moonKey };
	}

	/**
	 * Runs the month in the page's shared worker (astro/visible-horizon-client.js).
	 * @param {string} sig
	 * @param {string} moonKey place + year + month: a newer request with the same key replaces one still waiting
	 * @param {() => { init: RefractionInit | null, params: import('../print/weekly/moon-birkat-worker.js').birkatWorkerParam }} run
	 */
	startCompute(sig, moonKey, run) {
		/** @type {{ result?: MonthResult, error?: unknown, promise: Promise<MonthResult> }} */
		const entry = { promise: Promise.resolve(/** @type {any} */ (null)) };
		entry.promise = new Promise((resolve, reject) => {
			try {
				const { init, params } = run();
				requestMoon(moonKey, init, params).then(resolve, reject);
			} catch (e) {
				reject(e);
			}
		});
		entry.promise.then(
			result => { entry.result = result; },
			error => {
				// replaced before it ran (the forecast arrived): not a failure, just forget it
				if (/** @type {any} */ (error)?.superseded) {
					if (this.results.get(sig) === entry) this.results.delete(sig);
					return;
				}
				entry.error = error;
				console.error('Birkat Halevana moon worker failed:', error);
			}
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
			humidity: settings.refraction.humidity(),
			seaSurface: settings.refraction.seaSurfaceLayer()
		}).then(data => {
			if (!data.horizon?.moon) {
				// the server is still computing this place's horizon: ask again when it says to
				if (data.horizonRetryS)
					setTimeout(() => {
						this.moonHorizonRequested.delete(placeKey);
						if (this.updater) this.maybeFetchMoonHorizon(this.updater);
					}, Math.max(MIN_REFRACTION_RECHECK_MS, data.horizonRetryS * 1000));
				return;
			}
			this.moonHorizons.set(placeKey, data.horizon);
			if (this.updater) this.render(this.updater);
		}).catch(e => console.warn('Moon horizon unavailable; using the flat horizon', e));
	}

	// ─── Rendering (values into the markup) ─────────────────────────────────

	/** @param {string} name  a [data-zfFind] element of the card */
	find(name) {
		return /** @type {HTMLElement} */ (this.root.querySelector(`[data-zfFind="${name}"]`));
	}

	/**
	 * Sets every [data-zfReplace] element of that name (the markup repeats a value for each language where needed).
	 * @param {string} name
	 * @param {string} text
	 */
	replace(name, text) {
		for (const el of this.root.querySelectorAll(`[data-zfReplace="${name}"]`))
			el.textContent = text;
	}

	/**
	 * @param {Element | null} el
	 * @param {boolean} visible
	 */
	show(el, visible) {
		if (!el) return;
		if (visible) /** @type {HTMLElement} */ (el).style.removeProperty('display');
		else /** @type {HTMLElement} */ (el).style.display = 'none';
	}

	/**
	 * Shows the one variant out of several in the markup (e.g. data-levanaKind="strict" | "rema").
	 * @param {string} attribute
	 * @param {string} value
	 */
	showVariant(attribute, value) {
		for (const el of this.root.querySelectorAll(`[${attribute}]`))
			this.show(el, el.getAttribute(attribute) === value);
	}

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
	 * Title (the month's name in each language's span) and the molad.
	 * @param {MonthContext} ctx
	 * @param {Lang} lang
	 * @param {ZmanimListUpdater} updater
	 */
	renderHeader(ctx, lang, updater) {
		for (const l of LANGS)
			this.replace(`levanaMonth-${l}`, l == 'he' ? ctx.monthNames.he : ctx.monthNames.en);
		this.replace('levanaMolad', this.formatDateTime(ctx.molad, lang, updater, ctx.month));
	}

	/**
	 * The end rows: the regular end and the strict / Rema end, and the early end when the 15th is Shabbat
	 * or Yom Tov (it replaces the regular end, and sometimes Rema too: those are struck).
	 * @param {MonthContext} ctx
	 * @param {Lang} lang
	 * @param {ZmanimListUpdater} updater
	 */
	renderTimes(ctx, lang, updater) {
		const f = this.formats(updater);
		const fmt = (/** @type {Temporal.ZonedDateTime} */ z) => this.formatDateTime(z, lang, updater, ctx.month);
		const stretch = (/** @type {Temporal.ZonedDateTime} */ z) => z.toLocaleString(f.locale, f.time);

		// The start isn't a row: on a day view it only matters when it falls inside tonight (renderNightInfo)
		this.replace('levanaEnd', fmt(ctx.endIkar));
		this.replace('levanaEndStretch', stretch(ctx.endStretch));
		this.replace('levanaStrict', fmt(ctx.endStrict));
		this.replace('levanaEarlyEnd', fmt(ctx.endEarlyIkar));
		this.replace('levanaEarlyStretch', stretch(ctx.endEarlyStretch));
		this.showVariant('data-levanaKind', strictKind(ctx));
		this.showVariant('data-levanaEarly', ctx.fifteenthIsShabbat ? 'shabbat' : 'yomtov');

		const rows = {
			end: this.find('levanaRowEnd'),
			strict: this.find('levanaRowStrict'),
			early: this.find('levanaRowEarly')
		};
		/** Rema is earlier than the early end: the early end replaces the regular end. Later: it replaces Rema as well. */
		const remaEarlier = Temporal.ZonedDateTime.compare(ctx.endStrict, ctx.endEarlyIkar) < 0;
		this.show(rows.early, ctx.useEarlyTimes);
		this.find('levanaEndValue').classList.toggle('levanaStruck', ctx.useEarlyTimes);
		this.find('levanaStrictValue').classList.toggle('levanaStruck', ctx.useEarlyTimes && !remaEarlier);
		// the list is a flex column: the order the rows read in
		rows.end.style.order = '0';
		rows.strict.style.order = ctx.useEarlyTimes && remaEarlier ? '2' : '1';
		rows.early.style.order = ctx.useEarlyTimes && remaEarlier ? '1' : '2';
		const visible = Object.values(rows).filter(r => r.style.display !== 'none').sort((a, b) => +a.style.order - +b.style.order);
		for (const r of Object.values(rows))
			r.classList.toggle('levanaLast', r === visible[visible.length - 1]);
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
	 * @param {ZmanimListUpdater} updater
	 */
	renderNightInfo(ctx, updater) {
		const time = (/** @type {number} */ ms) => this.time(ms, updater);
		const wait = ctx.validFromMs > ctx.tonightTzet;
		this.show(this.find('levanaWait'), wait);
		if (wait) this.replace('levanaWaitTime', time(ctx.validFromMs));
		this.replace('levanaTzet', time(ctx.tonightTzet));
		this.replace('levanaAlot', time(ctx.tonightAlot));
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
		this.show(this.root.firstElementChild, visible);
	}

	/**
	 * Tonight's moon only: the night that begins on the selected date's evening. The next night's
	 * moon is on the next day's page. Returns false when there is nothing to show: the moon isn't up
	 * during the part of tonight Birkat Halevana can be said in (e.g. it sets before the start), so that day gets no card.
	 * @param {MonthContext} ctx
	 * @param {TonightRow | null} row
	 * @param {'exact' | 'estimate' | 'failed'} mode  'exact': the worker's row; 'estimate': the estimate's row, marked
	 *   approximate; 'failed': the estimate's row (if any) and a note that the worker failed
	 * @param {ZmanimListUpdater} updater
	 */
	renderTonight(ctx, row, mode, updater) {
		const box = this.find('levanaTonight');
		const failed = mode == 'failed';
		const estimated = mode != 'exact';
		this.show(this.find('levanaFailed'), failed);
		if (!row && !failed)
			return false;

		box.classList.toggle('levanaEstimate', estimated && !!row);
		this.show(this.find('levanaEstimateMark'), estimated && !!row);
		const time = (/** @type {number} */ ms) => this.time(ms, updater);

		/** @type {MoonEvent | null} */
		let glyphEvent = null;
		let horizon = false;
		let label = 'Moon in the night sky';
		for (const el of this.root.querySelectorAll('[data-levanaCover]'))
			this.show(el, !!row && el.getAttribute('data-levanaCover') === row.coverage);
		if (row) {
			const { rise, set, mid } = row.events;
			switch (row.coverage) {
				case 'both':
					glyphEvent = rise;
					this.replace('levanaRise', time(/** @type {MoonEvent} */ (rise).ms));
					this.replace('levanaSet', time(/** @type {MoonEvent} */ (set).ms));
					break;
				case 'from':
					glyphEvent = rise; horizon = true; label = 'Moon at rise';
					this.replace('levanaFrom', time(/** @type {MoonEvent} */ (rise).ms));
					break;
				case 'until':
					glyphEvent = set; horizon = true; label = 'Moon at set';
					this.replace('levanaUntil', time(/** @type {MoonEvent} */ (set).ms));
					break;
				default:
					glyphEvent = mid;
			}
		}
		const glyph = /** @type {HTMLElement} */ (this.root.querySelector('[data-zfReplace="levanaGlyph"]'));
		this.show(glyph, !!glyphEvent);
		glyph.innerHTML = glyphEvent
			? moonGlyphSvg(glyphEvent.thetaDeg, glyphEvent.phaseAngleDeg, { size: GLYPH_SIZE, horizon, label })
			: '';

		const strictMark = row?.marks?.endStrict;
		const showStrict = !!strictMark && strictMark.position !== 'day';
		if (strictMark && showStrict) this.replace('levanaStrictUntil', time(strictMark.time));
		this.show(this.find('levanaLastNight'), ctx.lastNight && !!row);
		this.show(this.find('levanaTwilight'), !!row?.bediavadOnly);
		this.show(this.find('levanaStrictTag'), showStrict);
		this.show(this.find('levanaTags'), !!row && (ctx.lastNight || row.bediavadOnly || showStrict));
		return true;
	}
}
