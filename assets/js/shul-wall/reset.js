// @ts-check

import { reload } from "./reload.js";
import { scheduleSettings } from "./base.js";

if (!('timers' in window))
    // @ts-ignore
    window.timers = {}

// Computed live (not imported from base.js) so this stays correct even after
// a soft DOM-swap reload, where base.js's own currentZDT never re-runs and
// would otherwise stay frozen at the page's original load time forever.
const now = Temporal.Now.zonedDateTimeISO(scheduleSettings.location.timezone);
const tomTime = now.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0, millisecond: 0 })

// @ts-ignore
window.timers.dayReload =
    setTimeout(async () => await reload(), now.until(tomTime).total('milliseconds') + 2000)

/**
 * The other way a wall reloads: because somebody asked it to.
 *
 * The signage image manager cannot reach a television. All it can do is commit
 * to `extras`, which GitHub Pages publishes. So its "refresh this screen now"
 * button writes a timestamp into one small file there, and this watches it:
 *
 *     https://zemaneh-yosef.github.io/extras/refresh.json
 *     { "beth-aharon": "2026-08-26T14:03:11.000Z" }
 *
 * The value is never read, only compared with the one this page started with.
 * The first poll records it and does nothing; a later poll seeing a different
 * value reloads. It fails quiet - a wall that cannot reach GitHub keeps playing
 * what it has, which is the only acceptable failure for a screen nobody is
 * standing next to.
 *
 * This lives here rather than in each wall page because every page that builds
 * a carousel already loads reset.js, and this is the same kind of decision the
 * file already makes.
 */

const REFRESH_SOURCE = "https://zemaneh-yosef.github.io/extras/refresh.json"
const REFRESH_EVERY_MS = 20000

const carouselFolder = {
    "beth-aharon": "beth-aharon",
    "charm-circle": "charm-circle/flyer",
    "charm-circle-bvp": "charm-circle/flyer",
    "ish-matzliach-bk": "ish-matzliach-events",
    "ish-matzliach-bk-merge": "ish-matzliach-events",
    "ish-matzliach-bk-pesah": "ish-matzliach-events",
    "ish-matzliach-bk-small": "ish-matzliach-events",
    "ish-matzliach-bk-women": "ish-matzliach-events",
    "shaare-tefila-queens-big": "shaare-tefila-marquee",
    "sha'areh-tefila-queens-big": "shaare-tefila-marquee",
    "ateret-marjan": "ateret-marjan/events",
}

const wallPage = decodeURIComponent(location.pathname.split("/").pop() || "").replace(/\.html$/, "")
// @ts-ignore
const wallFolder = carouselFolder[wallPage]

/** undefined until the first poll answers; then the value to compare against. */
let lastAsked
let reloadingNow = false

const checkRefresh = async () => {
    if (reloadingNow || !navigator.onLine) return

    try {
        // Pages caches hard, and the point is to notice within seconds, so
        // the URL has to differ every time.
        const response = await fetch(REFRESH_SOURCE + "?t=" + Date.now(), { cache: "no-store" })
        if (!response.ok) return

        const asked = await response.json()
        // A page not in the table watches the whole file instead, so a wall
        // added later still answers the button before this list is updated.
        const token = wallFolder ? (asked[wallFolder] ?? null) : JSON.stringify(asked)

        if (lastAsked === undefined) {
            lastAsked = token
            return
        }

        if (token !== lastAsked) {
            reloadingNow = true
            try {
                await reload()
            } finally {
                reloadingNow = false
            }
        }
    } catch {
        // Offline, or a deploy in flight. Try again on the next tick.
    }
}

checkRefresh()

// @ts-ignore
window.timers.refreshWatch = setInterval(checkRefresh, REFRESH_EVERY_MS)