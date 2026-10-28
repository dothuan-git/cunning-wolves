/**
 * Keeps `--scrollbar` on the root element equal to the width the page scrollbar takes up: 0 on
 * phones, where it floats over the page, and about 10–17px on desktops while the page scrolls.
 * The screen's right edge gives up that room (`.page` in index.css), so content keeps its width and
 * nothing is pushed past the right edge when the scrollbar comes and goes. CSS alone cannot tell
 * this width to elements inside the page, so it is measured here.
 */
export function trackScrollbar() {
  const root = document.documentElement;
  const measure = () => {
    const width = Math.max(0, window.innerWidth - root.clientWidth);
    root.style.setProperty('--scrollbar', `${String(width)}px`);
  };
  measure();
  window.addEventListener('resize', measure);
  // The scrollbar appears and goes as the content grows and shrinks, not only on resize.
  new ResizeObserver(measure).observe(document.body);
}
