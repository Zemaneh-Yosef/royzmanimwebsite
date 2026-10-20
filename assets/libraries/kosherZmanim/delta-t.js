// @ts-check
/**
 * delta-t.js
 *
 * Delta-T = TT - UT1 in seconds, from the Earth's measured rotation rather than a long-term formula.
 * Every quarter (1 January, 1 April, 1 July, 1 October) from 2000.0: 32.184 s + (TAI - UTC) - (UT1 - UTC),
 * with UT1 - UTC from IERS finals2000A.all (final values to July 2025, Bulletin A predictions to July 2026),
 * interpolated linearly. The Espenak-Meeus polynomials SPACalculator and Astronomy Engine use put 2026 at
 * 75.6 s instead of 69.1 s; Meeus's (10.2) puts it at 104 s.
 *
 * After the table it goes on at the table's average rate (0.21 s a year since 2000) plus the slow
 * acceleration of tidal braking (the 32 s per century squared of the Espenak-Meeus parabola). Before 2000 it is
 * Espenak-Meeus. Nobody can predict Delta-T years ahead; add a row each year from IERS Bulletin A
 * (https://www.iers.org) to keep it current.
 */

const TABLE_START = 2000;
const TABLE_STEP = 0.25;
/** Delta-T (s) every quarter from 2000.0 */
const TABLE = [
	63.83, 63.91, 63.98, 64.01, 64.09, 64.16, 64.21, 64.22,
	64.30, 64.37, 64.41, 64.42, 64.47, 64.53, 64.55, 64.54,
	64.57, 64.62, 64.65, 64.64, 64.69, 64.76, 64.80, 64.79,
	64.85, 64.92, 64.99, 65.04, 65.15, 65.25, 65.34, 65.37,
	65.46, 65.54, 65.63, 65.68, 65.78, 65.86, 65.95, 65.98,
	66.07, 66.17, 66.24, 66.24, 66.32, 66.40, 66.47, 66.51,
	66.60, 66.69, 66.77, 66.81, 66.91, 67.03, 67.13, 67.17,
	67.28, 67.39, 67.49, 67.54, 67.64, 67.76, 67.86, 67.95,
	68.10, 68.27, 68.40, 68.46, 68.59, 68.71, 68.82, 68.87,
	68.97, 69.05, 69.11, 69.14, 69.22, 69.30, 69.36, 69.34,
	69.36, 69.41, 69.42, 69.36, 69.36, 69.36, 69.35, 69.29,
	69.29, 69.28, 69.25, 69.19, 69.20, 69.21, 69.22, 69.17,
	69.18, 69.20, 69.19, 69.12, 69.14, 69.15, 69.14, 69.10,
	69.12, 69.13, 69.12,
];
const TABLE_END = TABLE_START + (TABLE.length - 1) * TABLE_STEP;

const TABLE_RATE = (TABLE[TABLE.length - 1] - TABLE[0]) / (TABLE_END - TABLE_START);

/** Espenak and Meeus (2006) polynomials before 2000, s. @param {number} y decimal year */
function espenakMeeus(y) {
	if (y >= 1986 && y < 2005) {
		const t = y - 2000;
		return 63.86 + t * (0.3345 + t * (-0.060374 + t * (0.0017275 + t * (0.000651814 + t * 0.00002373599))));
	}
	if (y >= 1961 && y < 1986) { const t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718; }
	return -20 + 32 * ((y - 1820) / 100) ** 2;
}

/**
 * Delta-T in seconds.
 * @param {number} jd Julian day (UT)
 */
export function deltaT(jd) {
	const y = 2000 + (jd - 2451544.5) / 365.25;
	if (y < TABLE_START) return espenakMeeus(y);
	if (y >= TABLE_END) {
		const dy = y - TABLE_END;
		return TABLE[TABLE.length - 1] + TABLE_RATE * dy + 0.0032 * dy * dy;
	}
	const x = (y - TABLE_START) / TABLE_STEP, i = Math.floor(x);
	return TABLE[i] + (TABLE[i + 1] - TABLE[i]) * (x - i);
}
