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

  // --------------------------------------------------------------
  // 7. Process containers
  // --------------------------------------------------------------
  const containers = document.querySelectorAll('[data-monthPrefix]');

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

    let monthEntries = allEntries.filter(e => monthKeys.includes(e.month));
    if (monthEntries.length === 0) continue;

    // --------------------------------------------------------------
    // 8. Build candidate list with guaranteed one-per-nationality
    // --------------------------------------------------------------
    // Step 8a: preferred nationality entries (shuffled)
    let priorityEntries = [];
    let remainingPool = monthEntries.slice();
    if (preferredNationality.size > 0) {
      priorityEntries = shuffle(
        monthEntries.filter(e => preferredNationality.has(e.nationality))
      );
      const prioritySet = new Set(priorityEntries);
      remainingPool = monthEntries.filter(e => !prioritySet.has(e));
    }

    // Step 8b: one random entry from each other nationality, sorted by global count asc
    const nationalitiesInMonth = new Set(remainingPool.map(e => e.nationality));
    const sortedNats = Array.from(nationalitiesInMonth).sort((a, b) => {
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

    // Step 8c: balanced extras from the leftovers
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
    const extras = buildBalancedList(leftover, globalCounts, preferredNationality, Infinity);

    // Final candidate order for fitting: priority first, then onePerNat, then extras
    const finalCandidates = [...priorityEntries, ...onePerNat, ...extras];

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
      // Build entry element
      const entryDiv = document.createElement('div');

      const row = document.createElement('div');
      row.classList.add('nameRow');

      const left = document.createElement('span');
      left.innerHTML = `<strong>${entry.name}</strong> (${entry.nationality})`;

      const right = document.createElement('span');
      jCal.setJewishDayOfMonth(entry.day);
      right.innerHTML = `${jCal.getDate().withCalendar('hebrew').toLocaleString('en-u-ca-hebrew', { month: 'short', day: 'numeric' })} | ${jCal.formatFancyDate().en}`;

      row.appendChild(left);
      row.appendChild(right);
      entryDiv.appendChild(row);

      const desc = document.createElement('div');
      desc.textContent = entry.short_desc;
      desc.style.marginTop = '0.25em';
      entryDiv.appendChild(desc);

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
    }
  }
});