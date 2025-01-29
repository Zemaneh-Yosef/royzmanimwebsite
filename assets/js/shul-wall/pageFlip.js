// @ts-check

if (!('timers' in window))
	// @ts-ignore
	window.timers = {}

const swap = () => {
	// @ts-ignore
	if ('timers' in window && 'swapTime' in window.timers) {
		// @ts-ignore
		clearTimeout(window.timers.swapTime)
		delete window.timers.swapTime
	}

	const container = document.getElementById("content");

    const pageCount = parseInt(container.getAttribute("data-page-count"));
    const currentPage = parseInt(container.getAttribute("data-current-page"));
    container.setAttribute("data-current-page", (currentPage == pageCount ? 1 : currentPage + 1).toString());

	// @ts-ignore
	window.timers.swapTime =
		setTimeout(() => requestAnimationFrame(() => swap()), parseInt(container.getAttribute("data-swap-time") || "8000") || 8000);
}

requestAnimationFrame(() => swap())