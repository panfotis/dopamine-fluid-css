// Dopamine Fluid — Dropdown Component
// Click [data-dropdown-toggle] inside .dropdown to open. Click-outside or ESC closes all.
// Multiple dropdowns can be open at once.
// API: dopamine.dropdown.open(el), .close(el), .toggle(el), .closeAll()
// Events: dp:dropdown:open, dp:dropdown:close (bubble from .dropdown)

(function () {
  function open(dropdown) {
    if (!dropdown || dropdown.classList.contains('dropdown--open')) return;
    dropdown.classList.add('dropdown--open');
    dropdown.dispatchEvent(new CustomEvent('dp:dropdown:open', { bubbles: true }));
  }

  function close(dropdown) {
    if (!dropdown || !dropdown.classList.contains('dropdown--open')) return;
    dropdown.classList.remove('dropdown--open');
    dropdown.dispatchEvent(new CustomEvent('dp:dropdown:close', { bubbles: true }));
  }

  function toggle(dropdown) {
    if (!dropdown) return;
    dropdown.classList.contains('dropdown--open') ? close(dropdown) : open(dropdown);
  }

  function closeAll() {
    document.querySelectorAll('.dropdown--open').forEach(close);
  }

  document.addEventListener('click', e => {
    const triggerBtn = e.target.closest('[data-dropdown-toggle]');
    if (triggerBtn) {
      toggle(triggerBtn.closest('.dropdown'));
      return;
    }
    if (!e.target.closest('.dropdown__menu')) closeAll();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.dropdown = { open, close, toggle, closeAll };
})();
