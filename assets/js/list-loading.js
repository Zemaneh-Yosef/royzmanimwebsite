// @ts-check
/**
 * The zemanim list's loading shimmer (the `loading` class: accordian.css for the accordian list, core.css
 * for the others). Shown only when a load takes longer than LOADING_DELAY_MS: reading a stored place
 * usually takes a frame or two, and a shimmer that flashes for that long looks worse than none.
 * Rendering the list removes the class (updateZmanimList), so nothing has to remember to clear it.
 */

/** How long a load may take before the list shows that it is loading. */
export const LOADING_DELAY_MS = 120;

/**
 * Mark the zemanim lists as loading unless the returned function is called within LOADING_DELAY_MS.
 * @returns {() => void} call it when the data is in (before rendering)
 */
export function showListLoadingAfterDelay() {
	const timer = setTimeout(() => {
		for (const list of document.querySelectorAll('[data-zfFind="calendarFormatter"]'))
			list.classList.add("loading");
	}, LOADING_DELAY_MS);
	return () => clearTimeout(timer);
}
