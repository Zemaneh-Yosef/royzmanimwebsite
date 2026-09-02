// Auto-scrolls any zman-schedule whose content overflows its box.
// Duplicates the list so the loop is seamless, and uses the Web
// Animations API so each element can have its own duration/hold
// without needing per-element @keyframes.
export default function autoscrollSchedules(selector = '.templeBGInner zman-schedule', opts = {}) {
  const {
    pxPerSecond = 26,   // scroll speed while actually moving
    holdStart   = 2.5,  // seconds paused at the top, readable before it moves
    holdEnd     = 1,    // seconds paused at the bottom before it loops
    gap         = '.75rem', // must match the visual gap between list items
  } = opts;

  const els = document.querySelectorAll(selector);
  els.forEach(setupOne);
  return els;

  function setupOne(el) {
    // Wait two frames so dynamically-injected content (autoSchedule /
    // scheduleOnline) has actually laid out before we measure it.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (el.dataset.autoscrollReady) return;
      if (el.scrollHeight - el.clientHeight <= 4) return; // fits — leave it alone

      el.dataset.autoscrollReady = '1';
      el.style.overflowY = 'hidden'; // JS drives motion now, not native scroll

      const wrapper = document.createElement('div');
      wrapper.className = 'schedule-marquee-wrapper';
      wrapper.style.cssText = `display:flex;flex-direction:column;gap:${gap};`;

      const track = document.createElement('div');
      track.className = 'schedule-marquee-track';
      track.style.cssText = `display:flex;flex-direction:column;gap:${gap};`;
      while (el.firstChild) track.appendChild(el.firstChild);

      const clone = track.cloneNode(true);
      wrapper.append(track, clone);
      el.appendChild(wrapper);

      const gapPx = parseFloat(getComputedStyle(wrapper).rowGap || gap);
      const distance = track.getBoundingClientRect().height + gapPx;
      const scrollSeconds = Math.max(distance / pxPerSecond, 4);
      const total = holdStart + scrollSeconds + holdEnd;

      wrapper.animate(
        [
          { transform: 'translateY(0)',              offset: 0 },
          { transform: 'translateY(0)',              offset: holdStart / total },
          { transform: `translateY(-${distance}px)`, offset: (holdStart + scrollSeconds) / total },
          { transform: `translateY(-${distance}px)`, offset: 1 },
        ],
        { duration: total * 1000, iterations: Infinity, easing: 'linear' }
      );
    }));
  }
}