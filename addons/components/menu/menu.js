// Dopamine Fluid — Menu Component
// Open/close with ESC key and click-outside support.
// API: dopamine.menu.open(el), .close(el), .toggle(el)
// Events: dp:menu:open, dp:menu:close (bubble from .menu)

(function () {
  function open(menu) {
    if (!menu || menu.classList.contains('menu--open')) return;
    menu.classList.add('menu--open');
    menu.dispatchEvent(new CustomEvent('dp:menu:open', { bubbles: true }));
  }

  function close(menu) {
    if (!menu || !menu.classList.contains('menu--open')) return;
    menu.classList.remove('menu--open');
    menu.dispatchEvent(new CustomEvent('dp:menu:close', { bubbles: true }));
  }

  function toggle(menu) {
    if (!menu) return;
    menu.classList.contains('menu--open') ? close(menu) : open(menu);
  }

  document.addEventListener('click', e => {
    if (e.target.closest('.menu__toggle')) {
      toggle(e.target.closest('.menu'));
      return;
    }
    if (e.target.classList.contains('menu__overlay') || e.target.closest('.menu__close')) {
      close(e.target.closest('.menu'));
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.menu--open').forEach(close);
    }
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.menu = { open, close, toggle };
})();
