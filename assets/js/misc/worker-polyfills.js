// @ts-check

/** @type {Promise<void> | undefined} */
let loading;

/**
 * Loads what a worker needs that the browser might lack: the Temporal polyfill, plus the core set the
 * pages get from _includes/polyfills.html (keep these checks in sync with it). Classic workers already
 * have both preloaded by the build, so this finishes at once there.
 * @returns {Promise<void>}
 */
export function loadWorkerPolyfills() {
	return loading ??= (async () => {
		const needsCore = !Array.prototype.at || !String.prototype.at || !Array.prototype.flat || !Object.fromEntries
			|| !Object.hasOwn || !Promise.allSettled || !String.prototype.replaceAll || typeof globalThis === "undefined"
			// @ts-ignore -- Iterator is newer than the TS lib in use
			|| typeof Iterator === "undefined" || !Iterator.prototype.toArray || typeof Intl.Locale === "undefined";

		// Plain scripts that install globals; importing them just runs them. Core goes first so
		// Temporal's formatting picks up its Intl fixes.
		if (needsCore)
			// @ts-ignore -- no type declarations
			await import("/assets/libraries/polyfills/core.min.js");
		if (!("Temporal" in globalThis))
			// @ts-ignore -- no type declarations
			await import("/assets/libraries/temporal-polyfill/global.min.js");
	})();
}
