// Dynamic viewport units (dvh, svh, lvh, dvw, …) only work from Chrome 108 and Safari 15.4. Where a
// declaration uses one, a copy using the plain unit (vh, vw, …) is put right before it: older browsers
// keep that one and skip the line they don't understand, newer ones use the second.
// Custom properties accept any value, so older browsers would keep the second one too; theirs go in an
// `@supports not (height: 1dvh)` copy of the rule instead.

import postcss from "postcss";

const VIEWPORT_UNIT = /(\d|\.)([dsl])v(h|w|i|b|min|max)\b/g;
const SUPPORTS_NO_DVH = "not (height: 1dvh)";

/**
 * @param {string} css a stylesheet, or the body of a <style> element
 * @param {string} from where it came from, for error messages
 * @returns {string} the stylesheet with fallbacks added (unchanged if none were needed)
 */
export function addViewportFallbacks(css, from) {
	if (!/\d[dsl]v(h|w|i|b|min|max)\b/.test(css)) return css;
	const root = postcss.parse(css, { from });
	let changed = false;
	/** @type {Map<import("postcss").Rule, import("postcss").Declaration[]>} */
	const customFallbacks = new Map();
	root.walkDecls((decl) => {
		if (!VIEWPORT_UNIT.test(decl.value)) return;
		VIEWPORT_UNIT.lastIndex = 0;
		const fallback = decl.value.replace(VIEWPORT_UNIT, "$1v$3");
		if (decl.prop.startsWith("--") && decl.parent?.type === "rule") {
			const rule = /** @type {import("postcss").Rule} */ (decl.parent);
			if (!customFallbacks.has(rule)) customFallbacks.set(rule, []);
			customFallbacks.get(rule).push(decl.clone({ value: fallback }));
			return;
		}
		const previous = decl.prev();
		if (previous && previous.type === "decl" && previous.prop === decl.prop && previous.value === fallback) return;
		decl.cloneBefore({ value: fallback });
		changed = true;
	});
	for (const [rule, decls] of customFallbacks) {
		const next = rule.next();
		if (next && next.type === "atrule" && next.name === "supports" && next.params === SUPPORTS_NO_DVH) continue;
		rule.after(postcss.atRule({ name: "supports", params: SUPPORTS_NO_DVH, nodes: [rule.clone().removeAll().append(decls)] }));
		changed = true;
	}
	return changed ? root.toString() : css;
}
