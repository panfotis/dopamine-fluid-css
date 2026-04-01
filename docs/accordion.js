// Dopamine Fluid — Accordion Component
// Handles close animation for <details> elements.
// Without this, closing snaps instantly (browser removes [open] immediately).

document.querySelectorAll('.accordion__item').forEach(item => {
  const summary = item.querySelector('.accordion__title');
  const body = item.querySelector('.accordion__body');
  if (!summary || !body) return;

  summary.addEventListener('click', e => {
    if (!item.open) return; // opening — let the browser handle it

    e.preventDefault();
    body.style.gridTemplateRows = '0fr';

    body.addEventListener('transitionend', () => {
      body.style.gridTemplateRows = '';
      item.open = false;
    }, { once: true });
  });
});
