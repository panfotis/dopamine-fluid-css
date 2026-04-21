// Dopamine Fluid — Accordion Component
// Smooth open/close animation for <details> elements (browser otherwise snaps instantly).
// API: dopamine.accordion.open(detailsEl), .close(detailsEl), .toggle(detailsEl)
// Events: dp:accordion:open, dp:accordion:close (bubble from the <details> item)

(function () {
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function open(item) {
    if (!item || item.open) return;
    const body = item.querySelector('.accordion__body');
    if (!body || prefersReducedMotion()) {
      item.open = true;
      item.dispatchEvent(new CustomEvent('dp:accordion:open', { bubbles: true }));
      return;
    }
    // Commit the 0fr state BEFORE the [open] flip so iOS Safari has a transition start frame.
    body.style.gridTemplateRows = '0fr';
    item.open = true;
    void body.offsetHeight;                          // force reflow
    body.style.gridTemplateRows = '1fr';
    body.addEventListener('transitionend', () => {
      body.style.gridTemplateRows = '';              // hand back to CSS
    }, { once: true });
    item.dispatchEvent(new CustomEvent('dp:accordion:open', { bubbles: true }));
  }

  function close(item) {
    if (!item || !item.open) return;
    const body = item.querySelector('.accordion__body');
    const finalize = () => {
      item.open = false;
      item.dispatchEvent(new CustomEvent('dp:accordion:close', { bubbles: true }));
    };
    if (!body || prefersReducedMotion()) {
      finalize();
      return;
    }
    body.style.gridTemplateRows = '0fr';
    body.addEventListener('transitionend', () => {
      body.style.gridTemplateRows = '';
      finalize();
    }, { once: true });
  }

  function toggle(item) {
    if (!item) return;
    item.open ? close(item) : open(item);
  }

  document.addEventListener('click', e => {
    const summary = e.target.closest('.accordion__title');
    if (!summary) return;
    const item = summary.closest('.accordion__item');
    if (!item) return;
    e.preventDefault();
    item.open ? close(item) : open(item);
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.accordion = { open, close, toggle };
})();
