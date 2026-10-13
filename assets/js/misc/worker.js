// @ts-check

/**
 * Starts one of the site's module workers. Browsers without module workers (Chrome < 80,
 * Firefox < 114, Safari < 15) get the self-contained classic copy the build writes next to it
 * ("name.classic.js", see scripts/legacy/config.mjs) — so add new workers to WORKERS there.
 *
 * A browser only reads the `type` option if it knows about module workers, which is how this tells
 * them apart without a test worker.
 * @param {string | URL} url
 */
export function spawnWorker(url) {
	let readsType = false;
	try {
		const worker = new Worker(url, { get type() { readsType = true; return /** @type {const} */ ("module"); } });
		if (readsType)
			return worker;
		worker.terminate();
	} catch {
		// Knows the option but can't run module workers
	}
	return new Worker(String(url).replace(/\.js$/, ".classic.js"));
}
