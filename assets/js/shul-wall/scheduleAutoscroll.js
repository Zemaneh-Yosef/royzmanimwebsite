// Auto-scrolls any element whose content overflows its box, in a seamless
// loop: the content is copied once and the pair slides by one copy's length.
// Uses the Web Animations API, so each element can have its own speed / hold
// without per-element @keyframes.
//
//   axis 'y' (default): a zman-schedule's list scrolls up, pausing at the top.
//     Its items move into a track (and a copy of it) inside the element.
//   axis 'x': a strip of items (the shul walls' #times) slides along its
//     reading direction. Its items stay where they are (the zemanim code fills
//     them in, and the page styles them as the strip's children): copies go
//     after them, and the strip itself moves.
//
// The decision is not made once. Schedules arrive over the network
// (scheduleOnline.js fetches + parses a spreadsheet), web fonts load late,
// and autoSchedule / the zemanim fill in times asynchronously - on a slow TV
// any of these can land well after the page calls us. So each element is
// watched: whenever its content or size changes, the scroller is torn down
// and the overflow is measured again from scratch.
export default function autoscrollSchedules(selector = '.templeBGInner zman-schedule', opts = {}) {
  const {
    axis        = 'y',
    pxPerSecond = 26,   // scroll speed while actually moving
    seconds     = 0,    // or: one loop's scroll time, whatever the length
    holdStart   = axis === 'y' ? 2.5 : 0, // seconds paused at the start, readable before it moves
    holdEnd     = axis === 'y' ? 1 : 0,   // seconds paused at the end before it loops
    gap         = '.75rem', // 'y': the gap between list items (the strip of 'x' keeps its own CSS gap)
  } = opts;
  const horizontal = axis === 'x';

  const els = document.querySelectorAll(selector);
  els.forEach(watch);
  return els;

  function watch(el) {
    if (el.dataset.autoscrollWatched) return;
    el.dataset.autoscrollWatched = '1';

    let pending = 0;
    let animation = null;
    let wrapper = null;   // 'y': the track and its copy
    let copies = [];      // 'x': the copies after the items
    let measuredContent = -1;
    let resumeAt = 0;     // 'x': where the last loop was, so a rebuild carries on from there
                          // ('y' starts again at the top, so a new list is read from its start)

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
      mutations.observe(el, { childList: true, subtree: true, characterData: true, attributes: horizontal, attributeFilter: horizontal ? ['style', 'class'] : undefined });

    // The box itself can change size (viewport, fonts changing the header
    // above it), and so can its content without any DOM mutation (fonts).
    const resizes = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          if (contentSize() !== measuredContent) schedule();
        })
      : null;

    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

    observeMutations();
    if (resizes) resizes.observe(el);
    refresh();

    /** The items themselves (not the copies) */
    function originals() {
      return [...el.children].filter(child => !child.hasAttribute('data-autoscroll-copy'));
    }

    function contentSize() {
      if (horizontal) {
        // from the first shown item's start to the last one's end
        const boxes = originals().map(item => item.getBoundingClientRect()).filter(box => box.width);
        if (!boxes.length) return 0;
        return Math.round(Math.max(...boxes.map(b => b.right)) - Math.min(...boxes.map(b => b.left)));
      }
      // While scrolling, one copy of the list is the track; otherwise the
      // content is el's own children.
      const track = wrapper && wrapper.firstElementChild;
      return Math.round(track ? track.getBoundingClientRect().height : el.scrollHeight);
    }

    function teardown() {
      if (animation) {
        resumeAt = Number(animation.currentTime) || 0;
        animation.cancel();
        animation = null;
      }
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
      for (const copy of copies) copy.remove();
      copies = [];
      el.style.overflowY = '';
      delete el.dataset.autoscrollReady;
    }

    function refresh() {
      mutations.disconnect();
      try {
        teardown();
        if (horizontal) buildHorizontal(); else build();
      } finally {
        mutations.takeRecords();
        observeMutations();
      }
    }

    /** @param {number} distance px one loop moves */
    function animate(target, keyframe, distance) {
      const scrollSeconds = seconds || Math.max(distance / pxPerSecond, 4);
      const total = holdStart + scrollSeconds + holdEnd;
      animation = target.animate(
        [
          { transform: keyframe(0),        offset: 0 },
          { transform: keyframe(0),        offset: holdStart / total },
          { transform: keyframe(distance), offset: (holdStart + scrollSeconds) / total },
          { transform: keyframe(distance), offset: 1 },
        ],
        { duration: total * 1000, iterations: Infinity, easing: 'linear' }
      );
      if (horizontal) animation.currentTime = resumeAt % (total * 1000);
    }

    function build() {
      measuredContent = Math.round(el.scrollHeight);
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
      measuredContent = Math.round(trackHeight);
      animate(wrapper, (px) => `translateY(-${px}px)`, trackHeight + gapPx);

      // Content height can now change without a DOM mutation (late fonts);
      // watch the real copy of the list for that.
      if (resizes) resizes.observe(track);
    }

    function buildHorizontal() {
      measuredContent = contentSize();
      if (el.scrollWidth - el.clientWidth <= 4) return; // fits — leave it alone

      el.dataset.autoscrollReady = '1';

      const items = originals();
      copies = items.map(item => {
        const copy = item.cloneNode(true);
        copy.setAttribute('data-autoscroll-copy', '');
        copy.setAttribute('aria-hidden', 'true');
        copy.removeAttribute('id');
        el.appendChild(copy);
        return copy;
      });

      // One loop: from an item to its copy (the strip's own gap included);
      // right to left on an RTL strip
      const first = items.find(item => item.getBoundingClientRect().width);
      if (!first) return;
      const copy = copies[items.indexOf(first)];
      const shift = copy.getBoundingClientRect().left - first.getBoundingClientRect().left;
      animate(el, (px) => `translateX(${-Math.sign(shift) * px}px)`, Math.abs(shift));
    }
  }
}
