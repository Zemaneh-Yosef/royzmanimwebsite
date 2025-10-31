// @ts-check

// states
const DrawState = {
    IDLE: 0,
    DIRTY_CONTENT: 1,
    DIRTY_LAYOUT: 2,
    DIRTY: 3,
};

/** @typedef {{
    minSize: number;
    maxSize: number;
    multiLine: boolean;
    observeMutations: {
        subtree: boolean;
        childList: boolean;
        characterData: boolean;
    };
} & {
    element: HTMLElement;
    active: boolean;
    observer?: MutationObserver;
    originalStyle?: {
        whiteSpace: string;
        display: string;
        fontSize: string;
    };
    currentFontSize?: number;
    availableWidth?: number;
    currentWidth?: number;
    availableHeight?: number;
    currentHeight?: number;
    preStyleTestCompleted?: boolean;
    previousFontSize?: number;
    styleComputed?: boolean;
    dirty?: number;
    display?: string;
    whiteSpace?: string;
    newbie?: boolean;
}} fitty */

// all active fitty elements
/** @type {fitty[]} */
let fitties = [];

// group all redraw calls till next frame, we cancel each frame request when a new one comes in. If no support for request animation frame, this is an empty function and supports for fitty stops.
/** @type {number} */
let redrawFrame = null;
const requestRedraw =
    'requestAnimationFrame' in window
        ? (options = { sync: false }) => {
                window.cancelAnimationFrame(redrawFrame);

                const redrawFn = () => redraw(fitties.filter((f) => f.dirty && f.active));

                if (options.sync) return redrawFn();

                redrawFrame = window.requestAnimationFrame(redrawFn);
            }
        : () => {};

// sets all fitties to dirty so they are redrawn on the next redraw loop, then calls redraw
/** @param {number} type
 *  @return {TimerHandler}
 */
const redrawAll = (type) => (/** @type {{sync: boolean}} */options) => {
    fitties.forEach((f) => (f.dirty = type));
    requestRedraw(options);
};

// redraws fitties so they nicely fit their parent container
const redraw = (/** @type {fitty[]} */fitties) => {
    // getting info from the DOM at this point should not trigger a reflow, let's gather as much intel as possible before triggering a reflow

    // check if styles of all fitties have been computed
    fitties
        .filter((f) => !f.styleComputed)
        .forEach((f) => {
            f.styleComputed = computeStyle(f);
        });

    // restyle elements that require pre-styling, this triggers a reflow, please try to prevent by adding CSS rules (see docs)
    fitties.filter(shouldPreStyle).forEach(applyStyle);

    // we now determine which fitties should be redrawn
    const fittiesToRedraw = fitties.filter(shouldRedraw);

    // we calculate final styles for these fitties
    fittiesToRedraw.forEach(calculateStyles);

    console.log('Redrawing', fittiesToRedraw.length);

    // now we apply the calculated styles from our previous loop
    fittiesToRedraw.forEach((f) => {
        applyStyle(f);
        markAsClean(f);
    });

    // now we dispatch events for all restyled fitties
    fittiesToRedraw.forEach(dispatchFitEvent);
};

const markAsClean = (/** @type {fitty} */f) => (f.dirty = DrawState.IDLE);

const calculateStyles = (/** @type {fitty} */ f) => {
    const isVertical = getComputedStyle(f.element).writingMode.startsWith('sideways');

    if (isVertical) {
        f.availableHeight = Math.floor(f.element.parentNode.getBoundingClientRect().height);
        f.currentHeight = f.element.scrollHeight;

        f.previousFontSize = f.currentFontSize;
        f.currentFontSize = Math.min(
            Math.max(f.minSize, (f.availableHeight / f.currentHeight) * f.previousFontSize),
            f.maxSize
        );
    } else {
        f.availableWidth = f.element.parentNode.getBoundingClientRect().width;
        f.currentWidth = f.element.scrollWidth;

        f.previousFontSize = f.currentFontSize;
        f.currentFontSize = Math.min(
            Math.max(f.minSize, (f.availableWidth / f.currentWidth) * f.previousFontSize),
            f.maxSize
        );
    }

    // if allows wrapping, only wrap when at minimum font size (otherwise would break container)
    f.whiteSpace = f.multiLine && f.currentFontSize === f.minSize ? 'normal' : 'nowrap';
};

// should always redraw if is not dirty layout, if is dirty layout, only redraw if size has changed
const shouldRedraw = (/** @type {fitty} */ f) =>
    f.dirty !== DrawState.DIRTY_LAYOUT ||
    (f.dirty === DrawState.DIRTY_LAYOUT &&
        f.element.parentNode.clientWidth !== f.availableWidth);

// every fitty element is tested for invalid styles
const computeStyle = (/** @type {fitty} */ f) => {
    // get style properties
    const style = window.getComputedStyle(f.element, null);

    // get current font size in pixels (if we already calculated it, use the calculated version)
    f.currentFontSize = parseFloat(style.getPropertyValue('font-size'));

    // get display type and wrap mode
    f.display = style.getPropertyValue('display');
    f.whiteSpace = style.getPropertyValue('white-space');

    // styles computed
    return true;
};

// determines if this fitty requires initial styling, can be prevented by applying correct styles through CSS
const shouldPreStyle = (/** @type {fitty} */f) => {
    let preStyle = false;

    // if we already tested for prestyling we don't have to do it again
    if (f.preStyleTestCompleted) return false;

    // should have an inline style, if not, apply
    if (!/inline-/.test(f.display)) {
        preStyle = true;
        f.display = 'inline-block';
    }

    // to correctly calculate dimensions the element should have whiteSpace set to nowrap
    if (f.whiteSpace !== 'nowrap') {
        preStyle = true;
        f.whiteSpace = 'nowrap';
    }

    // we don't have to do this twice
    f.preStyleTestCompleted = true;

    return preStyle;
};

// apply styles to single fitty
const applyStyle = (/** @type {fitty} */f) => {
    f.element.style.whiteSpace = f.whiteSpace;
    f.element.style.display = f.display;
    f.element.style.fontSize = Math.floor(f.currentFontSize - 6) + 'px';
};

// dispatch a fit event on a fitty
const dispatchFitEvent = (/** @type {fitty} */f) => {
    f.element.dispatchEvent(
        new CustomEvent('fit', {
            detail: {
                oldValue: f.previousFontSize,
                newValue: f.currentFontSize,
                scaleFactor: f.currentFontSize / f.previousFontSize,
            },
        })
    );
};

// fit method, marks the fitty as dirty and requests a redraw (this will also redraw any other fitty marked as dirty)
/**
 * @param {fitty} f
 * @param {number} type
 * @return {MutationCallback}
 */
const fit = (f, type) => () => {
    f.dirty = type;
    if (!f.active) return;
    requestRedraw();
};

const init = (/** @type {fitty} */ f) => {
    // save some of the original CSS properties before we change them
    f.originalStyle = {
        whiteSpace: f.element.style.whiteSpace,
        display: f.element.style.display,
        fontSize: f.element.style.fontSize,
    };

    // should we observe DOM mutations
    observeMutations(f);

    // this is a new fitty so we need to validate if it's styles are in order
    f.newbie = true;

    // because it's a new fitty it should also be dirty, we want it to redraw on the first loop
    f.dirty = DrawState.DIRTY;

    // we want to be able to update this fitty
    fitties.push(f);
};

const destroy = (/** @type {fitty} */ f) => () => {
    // remove from fitties array
    fitties = fitties.filter((_) => _.element !== f.element);

    // stop observing DOM
    if (f.observeMutations) f.observer.disconnect();

    // reset the CSS properties we changes
    f.element.style.whiteSpace = f.originalStyle.whiteSpace;
    f.element.style.display = f.originalStyle.display;
    f.element.style.fontSize = f.originalStyle.fontSize;
};

// add a new fitty, does not redraw said fitty
const subscribe = (/** @type {fitty} */ f) => () => {
    if (f.active) return;
    f.active = true;
    requestRedraw();
};

// remove an existing fitty
const unsubscribe = (/** @type {fitty} */ f) => () => (f.active = false);

const observeMutations = (/** @type {fitty} */ f) => {
    // no observing?
    if (!f.observeMutations) return;

    // start observing mutations
    f.observer = new MutationObserver(fit(f, DrawState.DIRTY_CONTENT));

    // start observing
    f.observer.observe(f.element, f.observeMutations);
};

// default mutation observer settings
const mutationObserverDefaultSetting = {
    subtree: true,
    childList: true,
    characterData: true,
};

// default fitty options
const defaultOptions = {
    minSize: 16,
    maxSize: 512,
    multiLine: true,
    observeMutations: mutationObserverDefaultSetting,
};

// array of elements in, fitty instances out
function fittyCreate(/** @type {HTMLElement[]} */elements, /** @type {Partial<typeof defaultOptions>} */options) {
    // set options object
    const fittyOptions = Object.assign(
        {},

        // expand default options
        defaultOptions,

        // override with custom options
        options
    );

    // create fitties
    const publicFitties = elements.map((element) => {
        // create fitty instance
        const f = Object.assign({}, fittyOptions, {
            // internal options for this fitty
            element,
            active: true,
        });

        // initialise this fitty
        init(f);

        // expose API
        return {
            element,
            fit: fit(f, DrawState.DIRTY),
            unfreeze: subscribe(f),
            freeze: unsubscribe(f),
            unsubscribe: destroy(f),
        };
    });

    // call redraw on newly initiated fitties
    requestRedraw();

    // expose fitties
    return publicFitties;
}

// fitty creation function
function fitty(/** @type {HTMLElement[]|string|HTMLElement} */target, /** @type {Partial<typeof defaultOptions>} */options = {}) {
    // if target is a string
    return typeof target === 'string'
        ? // treat it as a querySelector
            fittyCreate(Array.from(document.querySelectorAll(target)), options)
        : Array.isArray(target) ? fittyCreate(target, options) : fittyCreate([target], options)[0];
}

// handles viewport changes, redraws all fitties, but only does so after a timeout
/** @type {number} */
let resizeDebounce = null;
const onWindowResized = () => {
    window.clearTimeout(resizeDebounce);
    resizeDebounce = window.setTimeout(redrawAll(DrawState.DIRTY_LAYOUT), fitty.observeWindowDelay);
};

// define observe window property, so when we set it to true or false events are automatically added and removed
const events = ['resize', 'orientationchange'];
Object.defineProperty(fitty, 'observeWindow', {
    set: (enabled) => {
        for (const e of events)
            window[enabled ? 'addEventListener' : 'removeEventListener'](e, onWindowResized);
    },
});

// fitty global properties (by setting observeWindow to true the events above get added)
fitty.observeWindow = true;
fitty.observeWindowDelay = 100;

// public fit all method, will force redraw no matter what
fitty.fitAll = redrawAll(DrawState.DIRTY);

// export our fitty function, we don't want to keep it to our selves
export default fitty;