// @ts-check
/**
 * moon.js — the moon calculator (assets/libraries/mooncalc, built from the moonrise repository) as the site
 * uses it. Import the moon from here rather than from the library: this sets Astronomy Engine up once.
 *
 *  - Delta-T from the Earth's measured rotation (delta-t.js; 69.1 s in 2026), as the sun calculator uses,
 *    instead of Astronomy Engine's Espenak-Meeus extrapolation (75.6 s). Without it moonrise / moonset
 *    come out about 6.5 s off from the sun times beside them.
 *  - Weather-aware moonrise / moonset: moonHorizonTarget (moon-refraction.js) and createVisibleMoon
 *    (moon-visible.js) take the same air and horizon as the sun.
 */

import { createMoonCalc, moonGlyphSvg, AstronomyImp } from "../../libraries/mooncalc/moonRiseSetCalc.js";
import { deltaT } from "./delta-t.js";

AstronomyImp.SetDeltaTFunction(ut => deltaT(ut + 2451545));

export { createMoonCalc, moonGlyphSvg, AstronomyImp };
export { moonHorizonTarget, airAt } from "./moon-refraction.js";
export { createVisibleMoon } from "./moon-visible.js";
