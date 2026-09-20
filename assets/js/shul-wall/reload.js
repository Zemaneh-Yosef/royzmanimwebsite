// @ts-check

let waitingForOnline = false;
let reloadInFlight = false;

export async function reload() {
	// A reload is already underway somewhere (dayReload, checkRefresh, or
	// date-and-time.js's own hour-boundary check) — let it finish instead of
	// racing it with a second concurrent fetch + DOM swap.
	if (reloadInFlight) return;

	if (!navigator.onLine) {
		if (!waitingForOnline) {
			waitingForOnline = true;
			window.addEventListener('online', reload);
		}
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
			return;
		} finally {
			clearTimeout(timeoutId);
		}

		if (!pageFetch.ok) return;

		window.location.reload();

		// If reload() didn't navigate away within 6s, assume we're in a WebView
		// that doesn't support location.reload() and fall through to manual DOM swap.
		await waitFor(6000);
		await sleep();

		const pageText = await pageFetch.text();

		if ('timers' in window) {
			Object.entries(window.timers).forEach(([key, timeout]) => {
				clearTimeout(timeout);
				delete window.timers[key];
			});
			window.timers = {};
		}

		const newDoc = new DOMParser().parseFromString(pageText, "text/html");
		const newScrs = [];

		const oldScripts = newDoc.getElementsByTagName('script');
		while (oldScripts.length > 0) {
			const baseScript = oldScripts.item(0);

			const newScript = document.createElement('script');
			if (baseScript.type)
				newScript.type = baseScript.type;

			if (baseScript.src) {
				const scrUrl = new URL(baseScript.src);
				scrUrl.searchParams.delete('v');
				scrUrl.searchParams.append('v', Date.now().toString());
				newScript.src = scrUrl.href;
			}

			if (baseScript.textContent) {
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
	} finally {
		// Always release the lock, even if fetch failed, timed out, or came
		// back non-OK — otherwise one bad network blip permanently blocks
		// every future reload attempt for the life of this page.
		reloadInFlight = false;
	}
}

/** @param {number} delay  */
function waitFor (delay) { return new Promise(resolve => setTimeout(resolve, delay)) }
async function sleep() {
	return new Promise(requestAnimationFrame);
}