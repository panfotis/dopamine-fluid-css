// Dopamine Fluid — Collapse Component
// Click [data-collapse-target="#id"] to toggle the target element open/closed.
// Works in both default (inline, height animation) and .collapse--absolute modes.
// API: dopamine.collapse.open(idOrEl), .close(idOrEl), .toggle(idOrEl)
// Events: dp:collapse:open, dp:collapse:close (bubble from the target element)

(function () {
  const resolve = t => {
    if (!t) return null;
    if (typeof t !== 'string') return t;
    return document.querySelector(t.startsWith('#') ? t : '#' + t);
  };

  function open(target) {
    const el = resolve(target);
    if (!el || el.classList.contains('collapse--open')) return;
    el.classList.add('collapse--open');
    el.dispatchEvent(new CustomEvent('dp:collapse:open', { bubbles: true }));
  }

  function close(target) {
    const el = resolve(target);
    if (!el || !el.classList.contains('collapse--open')) return;
    el.classList.remove('collapse--open');
    el.dispatchEvent(new CustomEvent('dp:collapse:close', { bubbles: true }));
  }

  function toggle(target) {
    const el = resolve(target);
    if (!el) return;
    el.classList.contains('collapse--open') ? close(el) : open(el);
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-collapse-target]');
    if (!trigger) return;
    toggle(trigger.dataset.collapseTarget);
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.collapse = { open, close, toggle };
})();
