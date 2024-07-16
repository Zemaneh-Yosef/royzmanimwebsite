// @ts-check

import { Temporal } from "../../libraries/kosherZmanim/kosher-zmanim.esm.js"
import preSettings from "./preSettings.js";

const curTime = Temporal.Now.zonedDateTimeISO(preSettings.location.timezone());
const tomTime = curTime.add({ days: 1 }).with({ hour: 0, minute: 0, second: 0, millisecond: 0 })

setTimeout(() => window.location.reload(), curTime.until(tomTime).total('milliseconds') + 2000)