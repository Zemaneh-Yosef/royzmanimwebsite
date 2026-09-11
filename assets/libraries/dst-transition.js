// @ts-check


/**
 * dst-detect.mjs
 * 
 * Detect DST <-> Standard Time transitions inside a 12-month cycle using the
 * Temporal API, and identify which of the two offsets is the "outlier"
 * (i.e. covers fewer days in that particular cycle).
 * 
 * "Outlier" is defined POSITIONALLY: it's whichever offset is NOT in effect
 * on day 1 of the cycle, so it shows up as a single contiguous block inside
 * the cycle instead of being split across the two ends. This is why the
 * same time zone flips which offset is the outlier depending on the start
 * month, exactly as you'd expect:
 *   - Sept -> Sept  (standard time is the interior/outlier block)
 *   - Jan  -> Jan   (DST is the interior/outlier block instead)
 * Get the UTC offset (in minutes) for a given calendar date in a time zone,
 * sampled at local noon to sidestep the ambiguous/skipped-hour edge cases
 * that occur right at the transition instant itself.
 * @param {Temporal.PlainDate} plainDate
 * @param {Temporal.TimeZoneLike} timeZone
 */
function offsetMinutesForDate(plainDate, timeZone) {
    const zdt = plainDate.toZonedDateTime({
        timeZone,
        plainTime: Temporal.PlainTime.from('12:00'),
    });
    return zdt.offsetNanoseconds / 1e9 / 60;
}

/**
 * Walk every day in [startDate, startDate + 1 year) and return:
 *   - the list of transitions (date + old/new offset)
 *   - a day count per distinct offset
 * 
 * startDate: a Temporal.PlainDate marking the first day of the cycle.
 * timeZone: an IANA zone name, e.g. 'America/New_York'.
 * @param {Temporal.PlainDate} startDate
 * @param {Temporal.PlainDate} endDate
 * @param {Temporal.TimeZoneLike} timeZone
 */
function scanYearForTransitions(startDate, endDate, timeZone) {
    const totalDays = startDate.until(endDate, { largestUnit: 'days' }).days;

    const transitions = [];
    const dayCountByOffset = new Map();

    let cursor = startDate;
    let prevOffset = offsetMinutesForDate(cursor, timeZone);
    dayCountByOffset.set(prevOffset, 1);

    for (let i = 1; i < totalDays; i++) {
        cursor = cursor.add({ days: 1 });
        const offset = offsetMinutesForDate(cursor, timeZone);

        dayCountByOffset.set(offset, (dayCountByOffset.get(offset) ?? 0) + 1);

        if (offset !== prevOffset) {
            transitions.push({
                date: cursor,               // the first day the new offset is in effect (approx.)
                fromOffsetMinutes: prevOffset,
                toOffsetMinutes: offset,
            });
            prevOffset = offset;
        }
    }

    return { transitions, dayCountByOffset, totalDays };
}

/**
 * "Outlier" is defined POSITIONALLY, not by day count:
 * 
 *   The offset in effect on day 1 of the cycle is the "bracketing" offset --
 *   it necessarily also covers the last day of the cycle (a 12-month cycle
 *   returns to the same season it started in), so if a transition away from
 *   it happens mid-cycle, it gets split into two pieces at the seams.
 * 
 *   The OTHER offset -- whichever one is NOT in effect on day 1 -- is the
 *   "outlier": it shows up as a single contiguous block sitting entirely
 *   inside the cycle.
 * 
 * This is why Sept->Sept and Jan->Jan flip which one is the outlier for the
 * exact same time zone: Sept 1 in America/New_York is DST, so standard time
 * is the interior outlier block. Jan 1 is standard time, so DST becomes the
 * interior outlier block instead. Day counts (which offset covers more of
 * the year) are irrelevant to this and are reported only as extra context.
 * @param {any[] | Map<any, any>} dayCountByOffset
 * @param {number} startOffsetMinutes
 */
function classifyOffsets(dayCountByOffset, startOffsetMinutes) {
    const entries = [...dayCountByOffset.entries()];

    if (entries.length === 0) {
        return null; // no data
    }
    if (entries.length === 1) {
        return {
            hasTransition: false,
            bracketingOffsetMinutes: entries[0][0],
            bracketingDays: entries[0][1],
            outlierOffsetMinutes: null,
            outlierDays: 0,
        };
    }

    const bracketing = entries.find(([offset]) => offset === startOffsetMinutes);
    const outlier = entries.find(([offset]) => offset !== startOffsetMinutes);

    return {
        hasTransition: true,
        bracketingOffsetMinutes: bracketing[0],
        bracketingDays: bracketing[1],
        outlierOffsetMinutes: outlier[0],
        outlierDays: outlier[1],
    };
}

/**
 * Find the contiguous block of dates that belong to the outlier offset
 * (the one not in effect on day 1). By construction this should be a
 * single interior block for any normal DST-observing zone/cycle. The
 * wrap-merging logic at the end is a safety net in case a zone has an
 * unusual number of transitions in the window (e.g. a mid-cycle law
 * change), which would otherwise show up as extra split fragments.
 * @param {Temporal.PlainDate} startDate
 * @param {any} timeZone
 * @param {number} totalDays
 * @param {number} outlierOffsetMinutes
 */
function findOutlierBlocks(startDate, timeZone, totalDays, outlierOffsetMinutes) {
    const blocks = [];
    let blockStart = null;
    let cursor = startDate;
    let prevWasOutlier = false;

    for (let i = 0; i < totalDays; i++) {
        const isOutlier = offsetMinutesForDate(cursor, timeZone) === outlierOffsetMinutes;

        if (isOutlier && !prevWasOutlier) {
            blockStart = cursor;
        }
        if (!isOutlier && prevWasOutlier) {
            blocks.push({ start: blockStart, end: cursor.subtract({ days: 1 }) });
        }
        prevWasOutlier = isOutlier;
        cursor = cursor.add({ days: 1 });
    }

    // If the cycle ends while still inside an outlier block, close it at the
    // last day, and if it also started inside one, merge wrap-around halves.
    if (prevWasOutlier) {
        blocks.push({ start: blockStart, end: cursor.subtract({ days: 1 }) });
    }
    if (blocks.length === 2) {
        const first = blocks[0];
        const last = blocks[blocks.length - 1];
        if (first.start.equals(startDate) && last.end.equals(startDate.add({ years: 1 }).subtract({ days: 1 }))) {
            blocks.length = 0;
            blocks.push({ start: last.start, end: first.end, wraps: true });
        }
    }

    return blocks;
}

/**
 * @param {number} minutes
 */
function formatOffset(minutes) {
    const sign = minutes <= 0 ? '-' : '+';
    const abs = Math.abs(minutes);
    const h = String(Math.floor(abs / 60)).padStart(2, '0');
    const m = String(abs % 60).padStart(2, '0');
    return `UTC${sign}${h}:${m}`;
}

/**
 * @typedef {Object} TransitionInfo
 * @property {string} date
 * @property {number} fromOffsetMinutes
 * @property {number} toOffsetMinutes
 * @property {string} fromOffsetFormatted
 * @property {string} toOffsetFormatted
 */

/**
 * @typedef {Object} OffsetInfo
 * @property {number} offsetMinutes
 * @property {string} offsetFormatted
 * @property {number} days
 * @property {boolean} isDST
 */

/**
 * @typedef {Object} OutlierBlockInfo
 * @property {Temporal.PlainDate} start
 * @property {Temporal.PlainDate} end
 * @property {boolean} wraps
 */

/**
 * @typedef {Object} OutlierInfo
 * @property {number} offsetMinutes
 * @property {string} offsetFormatted
 * @property {number} days
 * @property {boolean} isDST
 * @property {Temporal.PlainDate | null} start
 * @property {Temporal.PlainDate | null} end
 * @property {boolean} wraps
 * @property {OutlierBlockInfo[]} blocks
 */

/**
 * @typedef {Object} CycleAnalysis
 * @property {string} timeZone
 * @property {string} cycleStart
 * @property {string} cycleEnd
 * @property {number} totalDays
 * @property {boolean} hasTransition
 * @property {OffsetInfo | null} bracketing
 * @property {OutlierInfo | null} outlier
 * @property {TransitionInfo[]} transitions
 */

/**
 * Main entry point: analyze a time zone's cycle and return a structured result.
 * @param {Temporal.PlainDate} startDate
 * @param {Temporal.PlainDate} endDate
 * @param {string} timeZone
 * @returns {CycleAnalysis}
 */
function analyzeCycle(startDate, endDate, timeZone) {
    const startOffsetMinutes = offsetMinutesForDate(startDate, timeZone);
    const { transitions, dayCountByOffset, totalDays } = scanYearForTransitions(startDate, endDate, timeZone);
    const classification = classifyOffsets(dayCountByOffset, startOffsetMinutes);

    /** @type {CycleAnalysis} */
    const base = {
        timeZone,
        cycleStart: startDate.toString(),
        cycleEnd: endDate.toString(),
        totalDays,
        hasTransition: false,
        bracketing: null,
        outlier: null,
        transitions: transitions.map((t) => ({
            date: t.date.toString(),
            fromOffsetMinutes: t.fromOffsetMinutes,
            toOffsetMinutes: t.toOffsetMinutes,
            fromOffsetFormatted: formatOffset(t.fromOffsetMinutes),
            toOffsetFormatted: formatOffset(t.toOffsetMinutes),
        })),
    };

    if (!classification || !classification.hasTransition) {
        return base;
    }

    const outlierBlocks = findOutlierBlocks(
        startDate,
        timeZone,
        totalDays,
        classification.outlierOffsetMinutes
    );

    const [primaryBlock] = outlierBlocks;

    // DST is always the algebraically larger offset ("spring forward"),
    // regardless of hemisphere or whether the base offset is positive or
    // negative. So whichever of the two offsets is bigger is DST; the
    // other is standard time.
    const outlierIsDST = classification.outlierOffsetMinutes > classification.bracketingOffsetMinutes;

    return {
        ...base,
        hasTransition: true,
        bracketing: {
            offsetMinutes: classification.bracketingOffsetMinutes,
            offsetFormatted: formatOffset(classification.bracketingOffsetMinutes),
            days: classification.bracketingDays,
            isDST: !outlierIsDST,
        },
        outlier: {
            offsetMinutes: classification.outlierOffsetMinutes,
            offsetFormatted: formatOffset(classification.outlierOffsetMinutes),
            days: classification.outlierDays,
            isDST: outlierIsDST,
            start: primaryBlock ? primaryBlock.start : null,
            end: primaryBlock ? primaryBlock.end : null,
            wraps: primaryBlock ? Boolean(primaryBlock.wraps) : false,
            blocks: outlierBlocks.map((b) => ({
                start: b.start,
                end: b.end,
                wraps: Boolean(b.wraps),
            })),
        },
    };
}

// --- Demo: same zone, two different 12-month windows ---
const sepResult = analyzeCycle(
    Temporal.PlainDate.from('2025-09-01'),
    Temporal.PlainDate.from('2026-09-01'),
    'America/New_York'
); // Sept -> Sept: standard time is the outlier

const janResult = analyzeCycle(
    Temporal.PlainDate.from('2026-01-01'),
    Temporal.PlainDate.from('2027-01-01'),
    'America/New_York'
); // Jan -> Jan: DST is the outlier

console.log(sepResult.outlier.start, '->', sepResult.outlier.end);
console.log(janResult.outlier.start, '->', janResult.outlier.end);

export { scanYearForTransitions, classifyOffsets, findOutlierBlocks, analyzeCycle };