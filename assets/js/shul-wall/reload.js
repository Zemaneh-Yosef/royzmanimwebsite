// @ts-check

export async function reload() {
	if (!navigator.onLine) {
		window.addEventListener('online', reload)
		return;
	}

	window.removeEventListener('online', reload);
	window.location.reload();

	await waitFor(6000);
	sleep();

	const pageFetch = await fetch(window.location.href);
	const pageText = await pageFetch.text();

	if ('timers' in window) {
		Object.values(window.timers).forEach(timeout => {clearTimeout(timeout); delete window.timers[timeout]});
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
			scrUrl.searchParams.delete('v')
			scrUrl.searchParams.append('v', getRandomIntInclusive(1, 99999).toString());

			newScript.src = scrUrl.href;
		}

		if (baseScript.innerHTML) {
			newScript.innerHTML = '// ' + new Date().toString() + '\n' + baseScript.innerHTML
		}
		newScrs.push(newScript);

		baseScript.remove();
	}

	for (const oldScr of document.getElementsByTagName('script'))
		oldScr.remove();

	document.replaceChild(newDoc.documentElement, document.documentElement);

	await waitFor(200);
	for (const newScr of newScrs)
		document.head.appendChild(newScr)
}

/** @param {number} delay  */
function waitFor (delay) { return new Promise(resolve => setTimeout(resolve, delay)) }
async function sleep() {
	return new Promise(requestAnimationFrame);
}

/**
 * @param {number} min
 * @param {number} max
 */
function getRandomIntInclusive(min, max) {
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}