/**
 * Marks the root element with `data-pointer` after a tap or click and clears it when Tab is
 * pressed. Text boxes and dropdowns always match `:focus-visible`, so CSS alone cannot tell a
 * tap from keyboard use; `index.css` drops their focus ring only while `data-pointer` is set.
 */
export function trackPointer() {
  const root = document.documentElement;
  window.addEventListener(
    'pointerdown',
    () => {
      root.dataset.pointer = '';
    },
    true,
  );
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab') delete root.dataset.pointer;
    },
    true,
  );
}
