// @ts-check
import WebsiteCalendar from "../../WebsiteCalendar.js";

/**
 * @typedef {Object} Hiloula
 * @property {string} name
 * @property {string} desc
 * @property {string} short_desc
 * @property {string} nationality
 * @property {string} src
 * @property {number} month
 * @property {number} day
 */

document.addEventListener('DOMContentLoaded', async () => {
	let hiloulotCount = 0;

	// --------------------------------------------------------------
	// 1. Fetch JSON
	// --------------------------------------------------------------
	const response = await fetch('/assets/libraries/kosherZmanim/withDesc/hiloulah-en.json');
	const jsonData = await response.json();

	// Wait for any @font-face fonts to finish loading before we measure
	// anything. DOMContentLoaded does NOT wait for fonts - if the fit-check
	// below runs while text is still rendering in a fallback font, every
	// measurement comes back smaller than the page will actually be once
	// the real font swaps in, and entries that "fit" during measurement
	// end up overflowing once the real font is applied.
	if (document.fonts && document.fonts.ready) {
		await document.fonts.ready;
	}

	// --------------------------------------------------------------
	// 2. Helpers
	// --------------------------------------------------------------
	/**
	 * @param {any[]} arr
	 */
	function shuffle(arr) {
		const a = arr.slice();
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	/**
	 * Build a round‑robin list (one from each nationality, then repeat)
	 * @param {Hiloula[]} entries
	 * @param {Record<string, number>} globalCounts
	 * @param {Set<string>} [excludeNats] - nationalities to skip
	 * @param {number} [limit] - maximum number of entries to return
	 * @returns {Hiloula[]}
	 */
	function buildBalancedList(entries, globalCounts, excludeNats = new Set(), limit = Infinity) {
		/** @type {Record<string, Hiloula[]>} */
		const group = {};
		for (const e of entries) {
			if (excludeNats.has(e.nationality)) continue;
			if (!group[e.nationality]) group[e.nationality] = [];
			group[e.nationality].push(e);
		}
		const sortedNats = Object.keys(group).sort((a, b) => {
			const diff = globalCounts[a] - globalCounts[b];
			if (diff !== 0) return diff;
			return group[b].length - group[a].length;
		});

		const result = [];
		let remaining = true;
		while (remaining && result.length < limit) {
			remaining = false;
			for (const nat of sortedNats) {
				if (group[nat].length === 0) continue;
				const idx = Math.floor(Math.random() * group[nat].length);
				result.push(group[nat].splice(idx, 1)[0]);
				remaining = true;
				if (result.length >= limit) break;
			}
		}
		return result;
	}

	/**
	 * Given a pool of candidate entries for a page, build the final ordered
	 * candidate list following the "guaranteed one per nationality, then
	 * balanced extras" rule. Shared by both the per-month pages and the
	 * extra overflow pages so they follow identical selection rules.
	 * @param {Hiloula[]} pool
	 * @param {Record<string, number>} globalCounts
	 * @param {Set<string>} preferredNats
	 * @returns {Hiloula[]}
	 */
	function pickCandidates(pool, globalCounts, preferredNats) {
		// Step a: preferred nationality entries (shuffled)
		let priorityEntries = [];
		let remainingPool = pool.slice();
		if (preferredNats.size > 0) {
			priorityEntries = shuffle(
				pool.filter(e => preferredNats.has(e.nationality))
			);
			const prioritySet = new Set(priorityEntries);
			remainingPool = pool.filter(e => !prioritySet.has(e));
		}

		// Step b: one random entry from each other nationality, sorted by global count asc
		const nationalitiesInPool = new Set(remainingPool.map(e => e.nationality));
		const sortedNats = Array.from(nationalitiesInPool).sort((a, b) => {
			const diff = globalCounts[a] - globalCounts[b];
			if (diff !== 0) return diff;
			const countA = remainingPool.filter(e => e.nationality === a).length;
			const countB = remainingPool.filter(e => e.nationality === b).length;
			return countB - countA;
		});

		const onePerNat = [];
		const usedEntries = new Set();
		for (const nat of sortedNats) {
			const candidates = remainingPool.filter(e => e.nationality === nat && !usedEntries.has(e));
			if (candidates.length > 0) {
				const picked = candidates[Math.floor(Math.random() * candidates.length)];
				onePerNat.push(picked);
				usedEntries.add(picked);
			}
		}

		// Step c: balanced extras from the leftovers
		const usedSet = new Set([...priorityEntries, ...onePerNat]);
		const leftover = remainingPool.filter(e => !usedSet.has(e));
		//
		// NOTE: `leftover` already has the *specific* entries used by
		// priorityEntries/onePerNat removed (via usedSet). Do NOT also pass
		// `sortedNats` as an exclude list here - sortedNats is every
		// nationality that got a guaranteed slot in onePerNat, and
		// buildBalancedList's excludeNats drops an entry by NATIONALITY, not
		// by specific entry. Passing sortedNats meant "Ashkenaz already got
		// its one guaranteed pick" turned into "no more Ashkenazim this
		// month, period" - even when 6 more were sitting right there in
		// leftover with room on the page to spare. onePerNat is a floor, not
		// a ceiling; extras should be free to pull more from any nationality
		// still in leftover.
		const extras = buildBalancedList(leftover, globalCounts, preferredNats, Infinity);

		return [...priorityEntries, ...onePerNat, ...extras];
	}

	/**
	 * Build the DOM node for a single hiloulah entry.
	 * @param {Hiloula} entry
	 * @param {string} rightText - pre-formatted date label for this entry
	 */
	function createEntryElement(entry, rightText) {
		const entryDiv = document.createElement('div');

		const row = document.createElement('div');
		row.classList.add('nameRow');

		const left = document.createElement('span');
		left.innerHTML = `<strong>${entry.name}</strong> ${entry.nationality ? `(${entry.nationality})` : ""}`;

		const right = document.createElement('span');
		right.innerHTML = rightText;

		row.appendChild(left);
		row.appendChild(right);
		entryDiv.appendChild(row);

		const desc = document.createElement('div');
		desc.innerHTML = entry.short_desc;
		desc.style.marginTop = '0.25em';
		entryDiv.appendChild(desc);

		return entryDiv;
	}

	// --------------------------------------------------------------
	// 3. Build filtered allEntries
	// --------------------------------------------------------------
	/** @type {Hiloula[]} */
	const allEntries = [];
	for (const [key, entries] of Object.entries(jsonData)) {
		const month = parseInt(key.slice(0, 2), 10);
		const day = parseInt(key.slice(2), 10);
		for (const entry of entries) {
			// Not just "key exists" - the sample data has entries like
			// Nadav and Avihu with `"nationality": ""`, present but blank.
			// We want entries that actually HAVE a non-blank value.
			const hasNationality = 'nationality' in entry;
			const hasShortDesc = 'short_desc' in entry;
			if (hasNationality && hasShortDesc) {
				allEntries.push({
					...entry,
					month,
					day,
					nationality: entry.nationality.trim()
				});
			}
		}
	}

	// --------------------------------------------------------------
	// 4. Global counts
	// --------------------------------------------------------------
	/** @type {Record<string, number>} */
	const globalCounts = {};
	for (const e of allEntries) {
		globalCounts[e.nationality] = (globalCounts[e.nationality] || 0) + 1;
	}

	// --------------------------------------------------------------
	// 5. Leap year (5787)
	// --------------------------------------------------------------
	const TARGET_HEBREW_YEAR = 5787;
	const isLeapYear = [0, 3, 6, 8, 11, 14, 17].includes(TARGET_HEBREW_YEAR % 19);

	// --------------------------------------------------------------
	// 6. URL params
	// --------------------------------------------------------------
	const urlParams = new URLSearchParams(window.location.search);
	const preferredNationality = urlParams.has('nationality')
		? new Set([urlParams.get('nationality')])
		: new Set();
	const extraPagesCount = Math.max(0, parseInt(urlParams.get('addExtraHiloulot') ?? '0', 10) || 0);

	// --------------------------------------------------------------
	// 7. Process containers
	// --------------------------------------------------------------
	const containers = document.querySelectorAll('[data-monthPrefix]');

	// Tracks every entry that has been placed on a main month page, so that
	// the "additional hiloulot" pages (built below) never repeat a hiloulah
	// that's already appeared in the book.
	const globallyUsedEntries = new Set();

	// The book's actual month ordering (e.g. Tishri -> Elul) comes from the
	// order [data-monthPrefix] containers appear in the DOM - NOT from the
	// raw month numbers in the data, which follow the Nissan -> Adar II
	// biblical numbering. Extra-hiloulot chunking/sorting needs to follow
	// the book's order, so we record it here as we walk the containers.
	const monthOrder = [];

	for (const container of containers) {
		const prefix = container.getAttribute('data-monthPrefix');
		const monthNum = parseInt(prefix, 10);
		if (isNaN(monthNum)) continue;

		let monthKeys = [monthNum];
		if (monthNum === 12 && !isLeapYear) {
			monthKeys = [12, 13];
		} else if (monthNum === 13 && !isLeapYear) {
			continue;
		}

		// Record this month's position in the book's real ordering even if
		// it turns out to have zero entries below - it's still a real month
		// occupying a real slot in the year.
		monthOrder.push(monthNum);

		let monthEntries = allEntries.filter(e => monthKeys.includes(e.month));
		if (monthEntries.length === 0) continue;

		// --------------------------------------------------------------
		// 8. Build candidate list with guaranteed one-per-nationality
		// --------------------------------------------------------------
		const finalCandidates = pickCandidates(monthEntries, globalCounts, preferredNationality);

		// --------------------------------------------------------------
		// 9. Create and fill div dynamically, then reorder chronologically
		// --------------------------------------------------------------
		const newDiv = document.createElement('div');
		newDiv.setAttribute('data-monthPrefix', prefix);
		newDiv.classList.add('page', 'hiloulot');

		const h1 = document.createElement('h1');
		const jCal = new WebsiteCalendar(TARGET_HEBREW_YEAR, monthNum, 1);
		h1.textContent = `Hiloulot of ${jCal.getDate().withCalendar('hebrew').toLocaleString('en-u-ca-hebrew', { month: 'long' })}`;
		newDiv.appendChild(h1);

		container.parentNode.insertBefore(newDiv, container.nextSibling);

		const maxHeight = newDiv.clientHeight;
		/** @type {{ entry: Hiloula, element: HTMLElement }[]} */
		const selected = [];

		for (const entry of finalCandidates) {
			jCal.setJewishDayOfMonth(entry.day);
			const rightText = `${jCal.getDate().withCalendar('hebrew').toLocaleString('en-u-ca-hebrew', { month: 'short', day: 'numeric' })} | ${jCal.formatFancyDate().en}`;
			const entryDiv = createEntryElement(entry, rightText);

			// Append to test height
			newDiv.appendChild(entryDiv);
			if (newDiv.scrollHeight > maxHeight) {
				// This candidate doesn't fit - remove it and try the NEXT one.
				// Using `break` here would stop the whole page after the first
				// oversized candidate, even if later (possibly much shorter)
				// candidates would have fit fine - that was leaving pages mostly
				// empty. `continue` lets us keep filling the remaining space.
				newDiv.removeChild(entryDiv);
				continue;
			} else {
				selected.push({ entry, element: entryDiv });
			}
		}

		// --------------------------------------------------------------
		// 10. Re‑order selected entries chronologically (by day)
		// --------------------------------------------------------------
		if (selected.length > 0) {
			// Sort by (month, day) – in case of merged Adar we might have both 12 and 13
			selected.sort((a, b) => {
				if (a.entry.month !== b.entry.month) return a.entry.month - b.entry.month;
				return a.entry.day - b.entry.day;
			});

			// Remove all child elements after the header
			while (newDiv.children.length > 1) {
				newDiv.removeChild(newDiv.lastChild);
			}

			// Re‑append in sorted order
			for (const { element } of selected) {
				newDiv.appendChild(element);
			}

			// Safety net: reordering can legitimately change the real rendered
			// height (margins collapse differently between different neighbor
			// pairs than they did in nationality-priority order during the fit
			// loop above), and this also catches any residual mismatch from
			// fonts/layout settling after the fit loop ran. Re-measure the real,
			// final page now and trim from the end (the chronologically-latest
			// entry) until it actually fits.
			while (selected.length > 0 && newDiv.scrollHeight > maxHeight) {
				const removed = selected.pop();
				newDiv.removeChild(removed.element);
			}

			hiloulotCount += selected.length;

			for (const { entry } of selected) {
				globallyUsedEntries.add(entry);
			}
		}
	}

	// --------------------------------------------------------------
	// 11. Additional hiloulot pages ("addExtraHiloulot" param)
	// --------------------------------------------------------------
	if (extraPagesCount > 0) {
		const insertBeforeElem = document.querySelector('[data-insertBefore]');

		if (insertBeforeElem) {
			const leftoverEntries = allEntries.filter(e => !globallyUsedEntries.has(e));

			// Map each month number to its position in the book's real
			// (Tishri -> Elul) order, so extra-page chunking and sorting
			// follow that order rather than the raw Nissan -> Adar II numbers.
			const monthOrderIndex = new Map(monthOrder.map((m, i) => [m, i]));

			/**
			 * Split an array into `n` contiguous chunks, as evenly as possible
			 * by element count. When it doesn't divide evenly, the earlier
			 * chunks get the extra element(s).
			 * @param {number[]} arr
			 * @param {number} n
			 */
			function splitIntoChunks(arr, n) {
				const len = arr.length;
				const base = Math.floor(len / n);
				let rem = len % n;
				const chunks = [];
				let idx = 0;
				for (let i = 0; i < n; i++) {
					const size = base + (rem > 0 ? 1 : 0);
					if (rem > 0) rem--;
					chunks.push(arr.slice(idx, idx + size));
					idx += size;
				}
				return chunks;
			}

			// Chunk by the book's actual month order, not by numeric month value.
			const monthChunks = splitIntoChunks(monthOrder, extraPagesCount);

			let insertionAnchor = insertBeforeElem;
			let extraPageIndex = 0;

			for (const chunk of monthChunks) {
				if (chunk.length === 0) continue;
				extraPageIndex++;

				const rawMonthKeys = [];
				for (const m of chunk) {
					if (m === 12 && !isLeapYear) {
						rawMonthKeys.push(12, 13);
					} else {
						rawMonthKeys.push(m);
					}
				}

				const chunkEntries = leftoverEntries.filter(e => rawMonthKeys.includes(e.month));
				if (chunkEntries.length === 0) continue;

				const finalCandidates = pickCandidates(chunkEntries, globalCounts, preferredNationality);

				const newDiv = document.createElement('div');
				newDiv.classList.add('page', 'hiloulot');
				if (extraPageIndex % 2 === 1) {
					newDiv.classList.add('verso');
				}

				const h1 = document.createElement('h1');
				h1.classList.add("mb-0")
				h1.textContent = 'Additional Hiloulot';
				newDiv.appendChild(h1);

				const firstMonthName = new WebsiteCalendar(TARGET_HEBREW_YEAR, chunk[0], 1)
					.getDate().withCalendar('hebrew').toLocaleString('en-u-ca-hebrew', { month: 'long' });
				const lastMonthName = new WebsiteCalendar(TARGET_HEBREW_YEAR, chunk[chunk.length - 1], 1)
					.getDate().withCalendar('hebrew').toLocaleString('en-u-ca-hebrew', { month: 'long' });

				const h2 = document.createElement('h2');
				h2.textContent = chunk.length > 1 ? `${firstMonthName} – ${lastMonthName}` : firstMonthName;
				newDiv.appendChild(h2);

				insertionAnchor.parentNode.insertBefore(newDiv, insertionAnchor.nextSibling);
				insertionAnchor = newDiv;

				const maxHeight = newDiv.clientHeight;
				const selected = [];

				for (const entry of finalCandidates) {
					const entryCal = new WebsiteCalendar(TARGET_HEBREW_YEAR, entry.month, entry.day);
					const rightText = `${entryCal.getDate().withCalendar('hebrew').toLocaleString('en-u-ca-hebrew', { month: 'short', day: 'numeric' })} | ${entryCal.formatFancyDate().en}`;
					const entryDiv = createEntryElement(entry, rightText);

					newDiv.appendChild(entryDiv);
					if (newDiv.scrollHeight > maxHeight) {
						newDiv.removeChild(entryDiv);
						continue;
					} else {
						selected.push({ entry, element: entryDiv });
					}
				}

				if (selected.length > 0) {
					// Sort by the book's actual month order (Tishri -> Elul),
					// not by raw month number - a chunk can span the Tishri/
					// Nissan boundary where raw numbers don't stay monotonic.
					selected.sort((a, b) => {
						const orderA = monthOrderIndex.get(a.entry.month);
						const orderB = monthOrderIndex.get(b.entry.month);
						if (orderA !== orderB) return orderA - orderB;
						return a.entry.day - b.entry.day;
					});

					while (newDiv.children.length > 2) {
						newDiv.removeChild(newDiv.lastChild);
					}

					for (const { element } of selected) {
						newDiv.appendChild(element);
					}

					while (selected.length > 0 && newDiv.scrollHeight > maxHeight) {
						const removed = selected.pop();
						newDiv.removeChild(removed.element);
					}

					hiloulotCount += selected.length;

					for (const { entry } of selected) {
						globallyUsedEntries.add(entry);
					}
				} else {
					newDiv.remove();
					insertionAnchor = insertionAnchor === newDiv ? insertBeforeElem : insertionAnchor;
				}
			}
		} else {
			console.warn('addExtraHiloulot was requested but no [data-insertBefore] element was found to anchor the extra pages.');
		}
	}

	console.log(hiloulotCount);
});