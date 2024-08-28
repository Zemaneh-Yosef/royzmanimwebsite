// @ts-check

const swap = () => {
	const container = document.getElementById("content");

    const pageCount = parseInt(container.getAttribute("data-page-count"));
    const currentPage = parseInt(container.getAttribute("data-current-page"));
    container.setAttribute("data-current-page", (currentPage == pageCount ? 1 : currentPage + 1).toString());

	// @ts-ignore
	window.timers.swapTime =
		setTimeout(() => requestAnimationFrame(() => swap()), 5000)
}

requestAnimationFrame(() => swap())