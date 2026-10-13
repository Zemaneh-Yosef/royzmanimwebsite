// Dynamic viewport units (dvh, svh, lvh, dvw, …) only work from Chrome 108 and Safari 15.4. Where a
// declaration uses one, a copy using the plain unit (vh, vw, …) is put right before it: older browsers
// keep that one and skip the line they don't understand, newer ones use the second.

import postcss from "postcss";

const VIEWPORT_UNIT = /(\d|\.)([dsl])v(h|w|i|b|min|max)\b/g;

/**
 * @param {string} css a stylesheet, or the body of a <style> element
 * @param {string} from where it came from, for error messages
 * @returns {string} the stylesheet with fallbacks added (unchanged if none were needed)
 */
export function addViewportFallbacks(css, from) {
	if (!/\d[dsl]v(h|w|i|b|min|max)\b/.test(css)) return css;
	const root = postcss.parse(css, { from });
	let changed = false;
	root.walkDecls((decl) => {
		if (!VIEWPORT_UNIT.test(decl.value)) return;
		VIEWPORT_UNIT.lastIndex = 0;
		const fallback = decl.value.replace(VIEWPORT_UNIT, "$1v$3");
		const previous = decl.prev();
		if (previous && previous.type === "decl" && previous.prop === decl.prop && previous.value === fallback) return;
		decl.cloneBefore({ value: fallback });
		changed = true;
	});
	return changed ? root.toString() : css;
}
