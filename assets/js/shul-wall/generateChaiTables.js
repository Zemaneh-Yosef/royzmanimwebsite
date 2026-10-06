// @ts-check
/**
 * Retired: the screen's netz now comes from the refraction server (base.js passes the terrain horizon
 * to ZemanFunctions, and getNetz() computes the visible sunrise), so ChaiTables is no longer scraped.
 * The exports stay as no-ops so pages that still call them keep working; remove those calls, then
 * this file.
 */

/**
 * @param {string} [_selectedCountry]
 * @param {string} [_indexOfMetroArea]
 */
export async function validNetzAssert(_selectedCountry, _indexOfMetroArea) {
	// nothing to do ('ctNetz' is left alone: the website's ChaiTables panel still writes and reads it)
}

/**
 * @param {string} [_selectedCountry]
 * @param {string} [_indexOfMetroArea]
 */
export async function scrapeChaiTables(_selectedCountry, _indexOfMetroArea) {
	return true;
}
