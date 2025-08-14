// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.js";
import { reload } from "./reload.js";
import preSettings from "./preSettings.js";

if (!('timers' in window))
    // @ts-ignore
    window.timers = {}

const curTime = Temporal.Now.zonedDateTimeISO(preSettings.location.timezone());
const tomTime = curTime.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0, millisecond: 0 })

// @ts-ignore
window.timers.dayReload =
    setTimeout(async () => await reload(), curTime.until(tomTime).total('milliseconds') + 2000)