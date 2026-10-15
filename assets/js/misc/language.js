// @ts-check

/** @typedef {'he'|'en'|'he-Latn'} Language */

/** The values used before the BCP 47 tags, still found in saved links, settings and configs */
export const legacyLanguages = Object.freeze({ hb: 'he', 'en-et': 'he-Latn' });

/**
 * The language tag for a stored or linked value, old or new; null if it is neither
 * @param {string | null | undefined} value
 * @returns {Language | null}
 */
export function languageTag(value) {
	const tag = Object.prototype.hasOwnProperty.call(legacyLanguages, value) ? legacyLanguages[value] : value;
	return ['he', 'en', 'he-Latn'].includes(tag) ? tag : null;
}
