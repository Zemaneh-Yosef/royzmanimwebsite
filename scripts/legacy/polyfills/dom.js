// Built into /assets/libraries/polyfills/dom.min.js by `pnpm build:polyfills`.
// Pages load it only when `needsDomPolyfills()` in _includes/polyfills.html says so. Main thread only.

// ElementInternals (Chrome < 77, Safari < 16.4) — Material Web's <md-*> components call
// attachInternals() in their constructors and won't render without it.
import "element-internals-polyfill";

// replaceChildren() (Chrome < 86)
for (const proto of [Element.prototype, Document.prototype, DocumentFragment.prototype]) {
	if (!("replaceChildren" in proto)) {
		Object.defineProperty(proto, "replaceChildren", {
			value: function replaceChildren(...nodes) {
				while (this.lastChild) this.removeChild(this.lastChild);
				this.append(...nodes);
			},
			writable: true,
			configurable: true
		});
	}
}
