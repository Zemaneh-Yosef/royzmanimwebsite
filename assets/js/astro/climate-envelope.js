// @ts-check
/**
 * The refraction server's climate envelope (/v1/climate-envelope): for a 5 degree cell and each month, the lowest
 * and highest near-surface air in NOAA's 1991-2020 long-term means, at sea level. atmosphere-guard.js's anomaly
 * check uses it as the reference where the place's monthly normals did not download, so a broken forecast
 * (-50 C in a New York July) is still refused. refraction-data.js fetches and stores it; this module only holds
 * what was loaded, for the guard to read synchronously.
 */

/**
 * @typedef {{ cell: { south: number, west: number, res: number },
 *             seaLevelC: { min: number[], max: number[] }, lapseKPerM: number }} ClimateEnvelope
 */

/** @type {Map<string, ClimateEnvelope>} */
const loaded = new Map();

const RES = 5;

/** The id of the cell holding a place (the server's 5 degree grid). @param {number} lat @param {number} lon */
export function envelopeCellId(lat, lon) {
	const south = -90 + RES * Math.min(180 / RES - 1, Math.floor((lat + 90) / RES));
	const west = -180 + RES * (((Math.floor((lon + 180) / RES)) % (360 / RES) + 360 / RES) % (360 / RES));
	return `${south},${west}`;
}

/**
 * Whether an answer is a usable envelope. @param {any} e @returns {e is ClimateEnvelope}
 */
export function isClimateEnvelope(e) {
	const ok = (/** @type {any} */ a) => Array.isArray(a) && a.length === 12 && a.every(Number.isFinite);
	return !!e && Number.isFinite(e.cell?.south) && Number.isFinite(e.cell?.west) && e.cell?.res === RES
		&& ok(e.seaLevelC?.min) && ok(e.seaLevelC?.max) && Number.isFinite(e.lapseKPerM)
		&& e.seaLevelC.min.every((/** @type {number} */ v, /** @type {number} */ i) => v <= e.seaLevelC.max[i]);
}

/** Hold an envelope for its cell. @param {ClimateEnvelope} e */
export function setClimateEnvelope(e) {
	if (isClimateEnvelope(e)) loaded.set(`${e.cell.south},${e.cell.west}`, e);
}

/**
 * [lo, hi] (C) at height h (m) for a place and month, widened by the neighbouring months (a date near a month's
 * edge), or null when its cell's envelope isn't loaded.
 * @param {number} lat @param {number} lon @param {number} month 1..12 @param {number} h
 * @returns {[number, number] | null}
 */
export function envelopeAt(lat, lon, month, h) {
	if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(month)) return null;
	const e = loaded.get(envelopeCellId(lat, lon));
	if (!e) return null;
	let lo = Infinity, hi = -Infinity;
	for (const m of [month - 2, month - 1, month]) {         // 0-based: previous, this, next
		const k = (m + 12) % 12;
		lo = Math.min(lo, e.seaLevelC.min[k]);
		hi = Math.max(hi, e.seaLevelC.max[k]);
	}
	const drop = e.lapseKPerM * (Number.isFinite(h) ? h : 0);
	return [lo - drop, hi - drop];
}
