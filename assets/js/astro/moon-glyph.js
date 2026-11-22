// @ts-check
/**
 * moon-glyph.js — the small SVG of the moon's lit part (what the Birkat Halevana card and the weekly print show
 * at moonrise / moonset). Kept apart from moon.js so a page can draw the glyph without loading the moon library.
 * Same drawing as moonGlyphSvg in assets/libraries/mooncalc (from the moonrise repository), which moon.js
 * re-exports from here.
 */

/**
 * @typedef {Object} MoonGlyphOptions
 * @property {number} [size=48]
 * @property {string} [darkFill='#2a2440']
 * @property {string} [litFill='#d8b26a']
 * @property {string} [strokeColor='#6b5a8a']
 * @property {string} [horizonColor='#9c98a8']
 * @property {string} [label='Moon orientation at event']
 * @property {boolean} [horizon=true]  true: the moon sits above a horizon line; false: larger, centred, no horizon
 */

/**
 * Boundary of the projected lit region of the disk, sampled in polar form around the sky frame
 * (x = horizontal, y = up); a crescent's dark centre and a gibbous's bulge both come out right.
 * @param {number} thetaDeg
 * @param {number} phaseAngleDeg
 * @param {number} [samples]
 * @returns {{outer: [number, number][], inner: [number, number][]}} unit-disk points, up positive
 */
function litRegionBoundary(thetaDeg, phaseAngleDeg, samples = 96) {
	const DEG = Math.PI / 180;
	const th = thetaDeg * DEG;
	const i = phaseAngleDeg * DEG;
	const sinI = Math.sin(i);
	const cosI = Math.cos(i);
	const HALF_PI = Math.PI / 2;

	/** @type {[number, number][]} */
	const outer = [];
	/** @type {[number, number][]} */
	const inner = [];
	for (let k = 0; k < samples; k++) {
		const psi = (k / samples) * 2 * Math.PI;
		const a = sinI * Math.sin(psi + th);
		const phi = Math.atan2(cosI, a);
		let litLo = Math.max(0, -phi);
		let litHi = Math.min(HALF_PI, Math.PI - phi);
		if (litHi <= litLo) { litLo = 0; litHi = 0; }
		const rOuter = Math.sin(litHi);
		const rInner = Math.sin(litLo);
		outer.push([rOuter * Math.cos(psi), rOuter * Math.sin(psi)]);
		inner.push([rInner * Math.cos(psi), rInner * Math.sin(psi)]);
	}
	return { outer, inner };
}

/**
 * @param {number} thetaDeg angle of the bright limb from the vertical
 * @param {number} phaseAngleDeg 0 = full, 180 = new
 * @param {MoonGlyphOptions} [opts]
 * @returns {string} a self-contained `<svg>...</svg>` string
 */
export function moonGlyphSvg(thetaDeg, phaseAngleDeg, opts = {}) {
	const size = opts.size ?? 48;
	const darkFill = opts.darkFill ?? "#2a2440";
	const litFill = opts.litFill ?? "#d8b26a";
	const strokeColor = opts.strokeColor ?? "#6b5a8a";
	const horizonColor = opts.horizonColor ?? "#9c98a8";
	const label = opts.label ?? "Moon orientation at event";
	const horizon = opts.horizon ?? true;
	const r = size * (horizon ? 0.32 : 0.4);
	const cx = size / 2;
	const cy = horizon ? size * 0.42 : size / 2;
	const { outer, inner } = litRegionBoundary(thetaDeg, phaseAngleDeg);
	const toScreen = (/** @type {[number, number]} */ [x, y]) => `${(cx + x * r).toFixed(2)},${(cy - y * r).toFixed(2)}`;
	const litPathD = `M ${outer.map(toScreen).join(" L ")} Z M ${inner.map(toScreen).join(" L ")} Z`;
	const horizonY = (cy + r + 4).toFixed(2);
	const horizonLine = horizon
		? `<line x1="1" y1="${horizonY}" x2="${size - 1}" y2="${horizonY}" stroke="${horizonColor}" stroke-width="1.5"/>`
		: "";
	return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"><circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="${darkFill}" stroke="${strokeColor}" stroke-width="1"/><path d="${litPathD}" fill="${litFill}" fill-rule="evenodd"/>${horizonLine}</svg>`;
}
