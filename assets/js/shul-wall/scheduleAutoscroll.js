// Auto-scrolls any zman-schedule whose content overflows its box.
// Duplicates the list so the loop is seamless, and uses the Web
// Animations API so each element can have its own duration/hold
// without needing per-element @keyframes.
//
// The decision is not made once. Schedules arrive over the network
// (scheduleOnline.js fetches + parses a spreadsheet), web fonts load late,
// and autoSchedule fills in times asynchronously - on a slow TV any of
// these can land well after the page calls us. So each element is watched:
// whenever its content or size changes, the scroller is torn down and the
// overflow is measured again from scratch.
export default function autoscrollSchedules(selector = '.templeBGInner zman-schedule', opts = {}) {
  const {
    pxPerSecond = 26,   // scroll speed while actually moving
    holdStart   = 2.5,  // seconds paused at the top, readable before it moves
    holdEnd     = 1,    // seconds paused at the bottom before it loops
    gap         = '.75rem', // must match the visual gap between list items
  } = opts;

  const els = document.querySelectorAll(selector);
  els.forEach(watch);
  return els;

  function watch(el) {
    if (el.dataset.autoscrollWatched) return;
    el.dataset.autoscrollWatched = '1';

    let pending = 0;
    let animation = null;
    let wrapper = null;
    let measuredContentHeight = -1;

    const schedule = () => {
      clearTimeout(pending);
      // Debounced so a burst of mutations (a full re-render, autoSchedule
      // filling every row) settles into one re-measure.
      pending = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(refresh)), 250);
    };

    // refresh() disconnects this while it rebuilds, so anything seen here
    // came from someone else (a re-render, autoSchedule filling in a time).
    const mutations = new MutationObserver(schedule);
    const observeMutations = () =>
      mutations.observe(el, { childList: true, subtree: true, characterData: true });

    // The box itself can change size (viewport, fonts changing the header
    // above it), and so can its content without any DOM mutation (fonts).
    const resizes = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          const h = contentHeight();
          if (h !== measuredContentHeight) schedule();
        })
      : null;

    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

    observeMutations();
    if (resizes) resizes.observe(el);
    refresh();

    function contentHeight() {
      // While scrolling, one copy of the list is the track; otherwise the
      // content is el's own children.
      const track = wrapper && wrapper.firstElementChild;
      return Math.round(track ? track.getBoundingClientRect().height : el.scrollHeight);
    }

    function teardown() {
      if (animation) { animation.cancel(); animation = null; }
      if (wrapper) {
        const track = wrapper.firstElementChild;
        if (resizes && track) resizes.unobserve(track);
        if (wrapper.parentNode === el) {
          // Put the real items back where the wrapper was; drop the clone.
          if (track) while (track.firstChild) el.insertBefore(track.firstChild, wrapper);
          wrapper.remove();
        }
        wrapper = null;
      }
      el.style.overflowY = '';
      delete el.dataset.autoscrollReady;
    }

    function refresh() {
      mutations.disconnect();
      try {
        teardown();
        build();
      } finally {
        mutations.takeRecords();
        observeMutations();
      }
    }

    function build() {
      measuredContentHeight = Math.round(el.scrollHeight);
      if (el.scrollHeight - el.clientHeight <= 4) return; // fits — leave it alone

      el.dataset.autoscrollReady = '1';
      el.style.overflowY = 'hidden'; // JS drives motion now, not native scroll

      wrapper = document.createElement('div');
      wrapper.className = 'schedule-marquee-wrapper';
      wrapper.style.cssText = `display:flex;flex-direction:column;gap:${gap};`;

      const track = document.createElement('div');
      track.className = 'schedule-marquee-track';
      track.style.cssText = `display:flex;flex-direction:column;gap:${gap};`;
      while (el.firstChild) track.appendChild(el.firstChild);

      const clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      wrapper.append(track, clone);
      el.appendChild(wrapper);

      const gapPx = parseFloat(getComputedStyle(wrapper).rowGap || gap) || 0;
      const trackHeight = track.getBoundingClientRect().height;
      measuredContentHeight = Math.round(trackHeight);
      const distance = trackHeight + gapPx;
      const scrollSeconds = Math.max(distance / pxPerSecond, 4);
      const total = holdStart + scrollSeconds + holdEnd;

      animation = wrapper.animate(
        [
          { transform: 'translateY(0)',              offset: 0 },
          { transform: 'translateY(0)',              offset: holdStart / total },
          { transform: `translateY(-${distance}px)`, offset: (holdStart + scrollSeconds) / total },
          { transform: `translateY(-${distance}px)`, offset: 1 },
        ],
        { duration: total * 1000, iterations: Infinity, easing: 'linear' }
      );

      // Content height can now change without a DOM mutation (late fonts);
      // watch the real copy of the list for that.
      if (resizes) resizes.observe(track);
    }
  }
}
