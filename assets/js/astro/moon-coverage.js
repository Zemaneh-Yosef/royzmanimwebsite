// @ts-check
/**
 * moon-coverage.js — when the moon is up inside a Birkat Halevana night, from any source of moonrise / moonset
 * times: the exact calculator in the moon worker (print/weekly/moon-birkat-worker.js) or the quick estimate on the
 * page (moon-estimate.js). No imports, so both can load it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Next moonrise / moonset at or after an instant (epoch ms), or null if none within the search horizon.
 * @typedef {{ rise: (epochMs: number) => number | null, set: (epochMs: number) => number | null }} MoonEvents
 */

/**
 * Clips [start, end] (epoch ms) to [minStart, maxEnd]. Returns null if the result is empty.
 * @param {number} start
 * @param {number} end
 * @param {number} minStart
 * @param {number} maxEnd
 * @returns {[number, number] | null}
 */
export function clip(start, end, minStart, maxEnd) {
	const s = Math.max(start, minStart);
	const e = Math.min(end, maxEnd);
	return s < e ? [s, e] : null;
}

/**
 * How the moon covers the night window [winStart, winEnd) (epoch ms).
 *  'both'  - rises and sets inside the window
 *  'from'  - rises inside the window, still up when it ends
 *  'until' - already up when the window opens, sets inside it
 *  'all'   - up for the whole window
 * @param {{rise: number | null, set: number | null}} moon
 * @param {number} winStart
 * @param {number} winEnd
 * @returns {'both'|'from'|'until'|'all'}
 */
export function classifyCoverage(moon, winStart, winEnd) {
	const within = (/** @type {number | null} */ t) => t !== null && t >= winStart && t < winEnd;
	const riseIn = within(moon.rise), setIn = within(moon.set);
	if (riseIn && setIn) return 'both';
	if (riseIn) return 'from';
	if (setIn) return 'until';
	return 'all';
}

/**
 * Finds the moon-up interval (rise -> set) that overlaps the window [winStart, winEnd], in epoch ms.
 *
 * The moon may already be up when the window opens (e.g. it rose in the afternoon and is still up
 * after tzet, which is the normal case around the full moon), so the search is NOT anchored to a
 * civil day. Rules:
 *  - Moon already up at winStart: interval is [the rise before winStart, the next set].
 *  - Moon not up at winStart: interval is [the next rise, the set after it], but only if that rise
 *    occurs before winEnd. Otherwise the moon is not in the sky at any point of the window -> null.
 *
 * `events` decides what rise / set mean (visible over the terrain, the lit limb on the flat horizon, or an estimate).
 * rise or set is null only if none is found within the search horizon.
 *
 * @param {MoonEvents} events
 * @param {number} winStart
 * @param {number} winEnd
 * @returns {{rise: number | null, set: number | null} | null}
 */
export function findMoonUp(events, winStart, winEnd) {
	const nextRise = events.rise(winStart);
	const nextSet = events.set(winStart);

	// A set that comes before the next rise means the moon is currently up.
	// (Condition is inlined, not stored in a boolean, so TS narrows nextSet to number inside.)
	if (nextSet !== null && (nextRise === null || nextSet < nextRise)) {
		// Walk forward from 2 days back to find the last rise before that set.
		let rise = null;
		let cursor = winStart - 2 * DAY_MS;
		for (let i = 0; i < 4; i++) {
			const r = events.rise(cursor);
			if (r === null || r >= nextSet) break;
			rise = r;
			cursor = r + 60 * 1000;
		}
		return { rise, set: nextSet };
	}

	if (nextRise === null || nextRise >= winEnd)
		return null;

	// The set that completes THIS rise's arc, searched from the rise itself.
	return { rise: nextRise, set: events.set(nextRise) };
}

/**
 * The moon in one night: the moon-up interval over the whole night window (shkiya -> netz, clipped), how it
 * covers it, and whether it is up at any point of the lechatchila range (tzet -> alot, clipped).
 * Null when the moon isn't up at any point of the night window.
 * @param {MoonEvents} events
 * @param {[number, number]} bediavad     the night window, epoch ms
 * @param {[number, number] | null} lechatchila
 * @returns {{ moon: {rise: number | null, set: number | null}, coverage: 'both'|'from'|'until'|'all', bediavadOnly: boolean } | null}
 */
export function nightMoon(events, bediavad, lechatchila) {
	const moon = findMoonUp(events, bediavad[0], bediavad[1]);
	if (!moon)
		return null;
	const moonRise = moon.rise ?? -Infinity;
	const moonSet = moon.set ?? Infinity;
	const moonInLechatchila = lechatchila !== null && moonRise < lechatchila[1] && moonSet > lechatchila[0];
	return { moon, coverage: classifyCoverage(moon, bediavad[0], bediavad[1]), bediavadOnly: !moonInLechatchila };
}
