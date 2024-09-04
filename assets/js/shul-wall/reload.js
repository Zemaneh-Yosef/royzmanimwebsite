// @ts-check

export async function reload() {
    window.location.reload();

    await waitFor(6000);
    sleep();

    const pageFetch = await fetch(window.location.href);
    const pageText = await pageFetch.text();

    if ('timers' in window) {
        Object.values(window.timers).forEach(clearTimeout);
        window.timers = {};
    }

    var newDoc = new DOMParser().parseFromString(pageText, "text/html");
    const newScrs = [];
    for (const script of newDoc.querySelectorAll('script')) {
        console.log(script);

        const newScript = document.createElement('script');
        if (script.type)
            newScript.type = script.type;

        if (script.src) {
            const scrUrl = new URL(script.src);
            scrUrl.searchParams.delete('v')
            scrUrl.searchParams.append('v', getRandomIntInclusive(1, 99999).toString());

            newScript.src = scrUrl.href;
        }

        if (script.innerHTML) {
            newScript.innerHTML = '// ' + new Date().toString() + '\n' + script.innerHTML
        }
        newScrs.push(newScript);

        script.remove();
    }

    document.replaceChild(
        document.importNode(newDoc.documentElement, true),
        document.documentElement
    );    

    /* for (const child of document.documentElement.childNodes)
        child.remove();

    await waitFor(2000);

    document.documentElement.insertAdjacentHTML('afterbegin', pageText); */

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