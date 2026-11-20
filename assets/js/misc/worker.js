// @ts-check

/**
 * Starts one of the site's module workers. Browsers without module workers (Chrome < 80,
 * Firefox < 114, Safari < 15) get the self-contained classic copy the build writes next to it
 * ("name.classic.js", see scripts/legacy/config.mjs) — so add new workers to WORKERS there.
 * So do browsers without a native Temporal (_includes/polyfills.html marks the page): the module
 * workers import kosher-zmanim.js, which uses Temporal as it loads, before they can polyfill it.
 *
 * A browser only reads the `type` option if it knows about module workers, which is how this tells
 * them apart without a test worker.
 * @param {string | URL} url
 */
export function spawnWorker(url) {
	if (!("Temporal" in globalThis) || "temporalPolyfilled" in globalThis)
		return new Worker(String(url).replace(/\.js$/, ".classic.js"));
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

/**
 * A pool of module workers sharing one task queue (the pattern of the monthly print, see
 * print/monthly/export.js). Create it as soon as the task count is known so the workers' module loading
 * overlaps whatever the page still has to fetch, then call run() once the data is ready.
 *
 * The pool is one core short of the machine's (this thread keeps one) and never larger than the number
 * of tasks. Worker errors before run() are kept and rethrown by it.
 * @param {string | URL} url the worker script (see spawnWorker)
 * @param {number} taskCount
 */
export function createPool(url, taskCount) {
	const size = Math.max(1, Math.min(taskCount, (navigator.hardwareConcurrency || 4) - 1));
	const workers = Array.from({ length: size }, () => spawnWorker(url));
	/** @type {ErrorEvent | null} */
	let earlyError = null;
	const recordEarlyError = (/** @type {ErrorEvent} */ e) => { earlyError ??= e; };
	workers.forEach(worker => worker.addEventListener("error", recordEarlyError));

	const terminate = () => workers.forEach(worker => worker.terminate());

	return {
		size,
		/** Stops every worker. Safe to call at any time, any number of times. */
		terminate,
		/**
		 * Posts `init` to each worker once (in order, before any task), then hands the tasks out: a worker
		 * gets the next one as soon as it answers and is terminated when the queue is empty. A worker
		 * that answers `{ error }`, or fails, terminates all and rejects. The pool is spent afterwards.
		 * @param {any[]} init messages every worker needs before its first task
		 * @param {any[]} tasks one message each
		 * @param {(completed: number, total: number) => void} [onProgress] called with (0, total) when the run starts, then after each answered task
		 * @returns {Promise<any[]>} the answers, in task order
		 */
		run(init, tasks, onProgress) {
			return new Promise((resolve, reject) => {
				/** @type {any[]} */
				const results = new Array(tasks.length);
				let next = 0, completed = 0, failed = false;

				const failAll = (/** @type {any} */ err) => {
					if (failed) return;
					failed = true;
					terminate();
					reject(err);
				};

				if (earlyError)
					return failAll(earlyError);
				onProgress?.(0, tasks.length);
				if (!tasks.length) {
					terminate();
					return resolve(results);
				}

				for (const worker of workers) {
					worker.removeEventListener("error", recordEarlyError);
					worker.addEventListener("error", failAll);
					worker.addEventListener("messageerror", failAll);
					for (const message of init)
						worker.postMessage(message);

					/** index of the task the worker is on */
					let current = -1;
					const dispatch = () => {
						if (next < tasks.length) {
							current = next++;
							worker.postMessage(tasks[current]);
						} else
							worker.terminate();
					};

					worker.addEventListener("message", (/** @type {MessageEvent} */ message) => {
						if (failed) return;
						if (message.data?.error)
							return failAll(new Error(message.data.error));
						results[current] = message.data;
						completed++;
						try { onProgress?.(completed, tasks.length); } catch (e) { console.error(e); }
						if (completed === tasks.length) {
							terminate();
							return resolve(results);
						}
						dispatch();
					});
					dispatch();
				}
			});
		}
	};
}
