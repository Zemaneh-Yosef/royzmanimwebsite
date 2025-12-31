// @ts-check

/**
 * @param {HTMLElement} container
 */
export default function marqueeDuplicate (container, cssProperties = {}) {
	// Grab the existing rendered children (with populated <zman-schedule>)
	const originalChildren = Array.from(container.childNodes);

	// Create marquee shell
	const marquee = document.createElement("div");
	marquee.className = "marquee";
    for (const [key, value] of Object.entries(cssProperties)) {
        marquee.style.setProperty('--' + key, value);
    }

	// First copy
	const c1 = document.createElement("div");
	c1.className = "marquee__content";
	c1.append(...originalChildren.map(node => node.cloneNode(true)));

	// Second copy (aria-hidden)
	const c2 = document.createElement("div");
	c2.className = "marquee__content";
	c2.setAttribute("aria-hidden", "true");
	c2.append(...originalChildren.map(node => node.cloneNode(true)));

	// Replace content
	container.innerHTML = "";
	marquee.append(c1, c2);
	container.appendChild(marquee);

}