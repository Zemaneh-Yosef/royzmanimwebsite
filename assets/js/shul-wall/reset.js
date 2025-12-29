// @ts-check

import { reload } from "./reload.js";
import { currentZDT } from "./base.js";

if (!('timers' in window))
    // @ts-ignore
    window.timers = {}

const tomTime = currentZDT.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0, millisecond: 0 })

// @ts-ignore
window.timers.dayReload =
    setTimeout(async () => await reload(), currentZDT.until(tomTime).total('milliseconds') + 2000)