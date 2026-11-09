// @ts-check
/**
 * ensemble.js
 *
 * A zman computed once per member of an ensemble of atmospheres, and summed up. The refraction server's
 * path profiles carry one with { ensemble: true } (path-atmosphere.js, paths.members(date, event)):
 *
 *   kind 'gefs'         a forecast date: every member of the GFS ensemble. Their spread is how sure the
 *                       forecast is - a few seconds when the members agree on the morning's air, more
 *                       when an inversion may or may not form.
 *   kind 'climatology'  a date from the server's climatology: the typical air and its strongest
 *                       variations (+-2 standard deviations along each), with weights. Refraction grows
 *                       faster than linearly with an inversion's strength, so the sunrise of the typical
 *                       air is not the typical sunrise; the weighted mean of these is (to second order),
 *                       and their spread is how far a given year's morning strays from it.
 *
 *     import { ensembleTimes } from './ensemble.js';
 *     const r = ensembleTimes(calc, paths.members(date, 'sunrise'),
 *                             () => calc.getVisibleSunrise(date, geo, horizon));
 *     r.mean;            // epoch ms: the weighted mean time (NaN if no member gave one)
 *     r.sd;              // seconds: the weighted standard deviation
 *     r.quantile(0.9);   // epoch ms: 90% of the weight is at or before it (meaningful for 'gefs';
 *                        // for 'climatology', with its few weighted members, prefer mean + z * sd)
 *     r.members;         // [{ member, weight, ms }]
 *
 * The calculator's own provider is set to each member's in turn and restored afterwards (also on error).
 * Each member's atmosphere is cached under its own key, so the members don't disturb the main profile.
 */

/**
 * @param {{ getAtmosphereProvider(): any, setAtmosphereProvider(p: any): void }} calc a ROYSPACalculator
 * @param {{ member: string, weight: number, provider: any }[]} members
 * @param {() => number} compute the zman with the calculator as it is set (epoch ms or NaN)
 */
export function ensembleTimes(calc, members, compute) {
	const saved = calc.getAtmosphereProvider();
	/** @type {{ member: string, weight: number, ms: number }[]} */
	const out = [];
	try {
		for (const m of members) {
			calc.setAtmosphereProvider(m.provider);
			out.push({ member: m.member, weight: m.weight, ms: compute() });
		}
	} finally {
		calc.setAtmosphereProvider(saved);
	}
	return summarize(out);
}

/**
 * Weighted mean, standard deviation and quantiles of member times; members without a time are left out
 * and the rest re-weighted.
 * @param {{ member: string, weight: number, ms: number }[]} members
 */
export function summarize(members) {
	const ok = members.filter(m => Number.isFinite(m.ms) && m.weight > 0);
	const W = ok.reduce((a, m) => a + m.weight, 0);
	const mean = W > 0 ? ok.reduce((a, m) => a + m.weight * m.ms, 0) / W : NaN;
	const sd = W > 0 ? Math.sqrt(ok.reduce((a, m) => a + m.weight * (m.ms - mean) ** 2, 0) / W) / 1000 : NaN;
	const sorted = [...ok].sort((a, b) => a.ms - b.ms);
	return {
		members, mean, sd, count: ok.length,
		/** @param {number} q 0..1 @returns {number} epoch ms */
		quantile(q) {
			let acc = 0;
			for (const m of sorted) {
				acc += m.weight / W;
				if (acc >= q - 1e-9) return m.ms;
			}
			return sorted.length ? sorted[sorted.length - 1].ms : NaN;
		},
	};
}
