// @ts-check

const RETRY_FIRST_MS = 15000;
const RETRY_MAX_MS = 15 * 60 * 1000;

let waitingForOnline = false;
let reloadInFlight = false;
let retryDelay = RETRY_FIRST_MS;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let retryTimer;

function retryLater() {
	clearTimeout(retryTimer);
	retryTimer = setTimeout(reload, retryDelay);
	retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
}

export async function reload() {
	// A reload is already underway somewhere (dayReload, checkRefresh, or
	// date-and-time.js's own hour-boundary check) — let it finish instead of
	// racing it with a second concurrent fetch + DOM swap.
	if (reloadInFlight) return;
	clearTimeout(retryTimer);

	if (!navigator.onLine) {
		if (!waitingForOnline) {
			waitingForOnline = true;
			window.addEventListener('online', reload);
		}
		retryLater();
		return;
	}

	waitingForOnline = false;
	window.removeEventListener('online', reload);

	reloadInFlight = true;
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000);

		let pageFetch;
		try {
			pageFetch = await fetch(window.location.href, { signal: controller.signal });
		} catch {
			retryLater();
			return;
		} finally {
			clearTimeout(timeoutId);
		}

		if (!pageFetch.ok) {
			retryLater();
			return;
		}

		window.location.reload();

		// If reload() didn't navigate away within 6s, assume we're in a WebView
		// that doesn't support location.reload() and fall through to manual DOM swap.
		await waitFor(6000);
		await sleep();

		const pageText = await pageFetch.text();
		const newDoc = new DOMParser().parseFromString(pageText, "text/html");

		const { refreshBase } = await import('./base.js');
		await refreshBase(newDoc.getElementById('zy-scheduleScreen-config').textContent);

		if ('timers' in window) {
			Object.entries(window.timers).forEach(([key, timeout]) => {
				clearTimeout(timeout);
				delete window.timers[key];
			});
			window.timers = {};
		}

		const newScrs = [];

		const oldScripts = newDoc.getElementsByTagName('script');
		while (oldScripts.length > 0) {
			const baseScript = oldScripts.item(0);

			const newScript = document.createElement('script');
			if (baseScript.id)
				newScript.id = baseScript.id;
			if (baseScript.type)
				newScript.type = baseScript.type;

			if (baseScript.src) {
				const scrUrl = new URL(baseScript.src);
				scrUrl.searchParams.delete('v');
				scrUrl.searchParams.append('v', Date.now().toString());
				newScript.src = scrUrl.href;
			}

			if (baseScript.type == 'application/json') {
				newScript.textContent = baseScript.textContent;
			} else if (baseScript.textContent) {
				newScript.textContent = '// ' + new Date().toString() + '\n' + baseScript.textContent;
			}

			newScrs.push(newScript);
			baseScript.remove();
		}

		for (const oldScr of document.getElementsByTagName('script'))
			oldScr.remove();

		document.replaceChild(newDoc.documentElement, document.documentElement);

		await waitFor(200);
		for (const newScr of newScrs)
			document.head.appendChild(newScr);
		retryDelay = RETRY_FIRST_MS;
	} catch (e) {
		console.error("Soft reload failed", e);
		retryLater();
	} finally {
		// Always release the lock, even if fetch failed, timed out, or came
		// back non-OK — otherwise one bad network blip permanently blocks
		// every future reload attempt for the life of this page.
		reloadInFlight = false;
	}
}

/**
 * Runs a loading step now and, until it succeeds, again every 5 minutes, so a wall that starts while a host is down fills in later.
 * @param {string} timerKey
 * @param {() => Promise<unknown>} step
 */
export async function keepTrying(timerKey, step) {
	try {
		await step();
	} catch (e) {
		console.error(e);
		if (!('timers' in window))
			// @ts-ignore
			window.timers = {}
		// @ts-ignore
		window.timers[timerKey] = setTimeout(() => keepTrying(timerKey, step), 5 * 60 * 1000);
	}
}

/** @param {string | URL | Request} url */
export async function fetchOk(url) {
	const response = await fetch(url);
	if (!response.ok)
		throw new Error(`${response.status} ${response.statusText} from ${response.url}`);
	return response;
}

/** @param {number} delay  */
function waitFor (delay) { return new Promise(resolve => setTimeout(resolve, delay)) }
async function sleep() {
	return new Promise(requestAnimationFrame);
}