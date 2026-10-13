// Built into /assets/libraries/polyfills/core.min.js by `pnpm build:polyfills`.
// Pages load it only when `needsCorePolyfills()` in _includes/polyfills.html says so; classic workers
// always load it (only browsers that are this old get classic workers). It must stay safe to run in a
// worker, so nothing here may touch the DOM — DOM fixes go in dom.js.
//
// Each core-js module checks for the native feature first and does nothing when it's there.
// To add one: import it here, add its check to _includes/polyfills.html and
// assets/js/misc/worker-polyfills.js, then run `pnpm build:polyfills`.

import "core-js/modules/es.global-this.js";
import "core-js/modules/es.symbol.description.js";

import "core-js/modules/es.array.at.js";
import "core-js/modules/es.string.at-alternative.js";
import "core-js/modules/es.array.flat.js";
import "core-js/modules/es.array.flat-map.js";
import "core-js/modules/es.array.unscopables.flat.js";
import "core-js/modules/es.array.unscopables.flat-map.js";
// Chrome < 70 sorts unstably; core-js only replaces sort() where that's the case.
import "core-js/modules/es.array.sort.js";

import "core-js/modules/es.object.from-entries.js";
import "core-js/modules/es.object.has-own.js";
import "core-js/modules/es.promise.all-settled.js";
import "core-js/modules/es.string.replace-all.js";

// Iterator helpers (map.keys().some(…), etc.) — also missing from Safari < 18.4 and Chrome < 122.
import "core-js/modules/es.iterator.constructor.js";
import "core-js/modules/es.iterator.drop.js";
import "core-js/modules/es.iterator.every.js";
import "core-js/modules/es.iterator.filter.js";
import "core-js/modules/es.iterator.find.js";
import "core-js/modules/es.iterator.flat-map.js";
import "core-js/modules/es.iterator.for-each.js";
import "core-js/modules/es.iterator.map.js";
import "core-js/modules/es.iterator.reduce.js";
import "core-js/modules/es.iterator.some.js";
import "core-js/modules/es.iterator.take.js";
import "core-js/modules/es.iterator.to-array.js";

import "./intl.js";
