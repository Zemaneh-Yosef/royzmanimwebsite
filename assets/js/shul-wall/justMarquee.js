// @ts-check

/**
 * @param {HTMLElement} container
 * @param {{length?: string; gap?: string;}} cssProperties
 */
export default function marqueeDuplicate(container, cssProperties = {}) {
  const isRTL = window.getComputedStyle(container).direction === 'rtl';
  
  container.style.display = 'flex';
  container.style.gap = cssProperties.gap || '1rem';
  
  // Measure the actual rendered width of original content
  const singleSetWidth = container.scrollWidth;
  const gapString = cssProperties.gap || '1rem';
  const gapValue = gapString.endsWith('rem') 
    ? parseFloat(gapString) * parseFloat(getComputedStyle(document.documentElement).fontSize)
    : parseFloat(gapString);
  
  const items = Array.from(container.children);
  items.forEach(item => {
    container.appendChild(item.cloneNode(true));
  });
  
  container.style.animation = `scrollX ${cssProperties.length || '35s'} linear infinite`;
  
  const distance = isRTL ? (singleSetWidth + gapValue) : -(singleSetWidth + gapValue);
  container.style.setProperty('--marquee-distance', `${distance}px`);
  
  console.log('Original scrollWidth:', singleSetWidth, 'Distance:', distance);
}