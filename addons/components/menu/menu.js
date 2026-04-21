// Dopamine Fluid — Menu Component
// Open/close with ESC key and click-outside support.
// API: dopamine.menu.open(el), .close(el), .toggle(el)
// Events: dp:menu:open, dp:menu:close (bubble from .menu)

(function () {
  // Lock body scroll only when the drawer is actually in drawer mode (position: fixed) —
  // on desktop the drawer becomes static and nothing needs locking.
  function inDrawerMode(menu) {
    const drawer = menu.querySelector('.menu__drawer');
    return !!drawer && getComputedStyle(drawer).position === 'fixed';
  }

  function lockScroll(menu) {
    if (menu.dataset.menuLocked === '1') return;
    if (!window.dopamine || !window.dopamine.scrollLock) return;
    if (!inDrawerMode(menu)) return;
    window.dopamine.scrollLock.lock();
    menu.dataset.menuLocked = '1';
  }

  function unlockScroll(menu) {
    if (menu.dataset.menuLocked !== '1') return;
    if (!window.dopamine || !window.dopamine.scrollLock) return;
    window.dopamine.scrollLock.unlock();
    menu.dataset.menuLocked = '0';
  }

  function open(menu) {
    if (!menu || menu.classList.contains('menu--open')) return;
    menu.classList.add('menu--open');
    lockScroll(menu);
    menu.dispatchEvent(new CustomEvent('dp:menu:open', { bubbles: true }));
  }

  function close(menu) {
    if (!menu || !menu.classList.contains('menu--open')) return;
    menu.classList.remove('menu--open');
    unlockScroll(menu);
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

  // If the viewport crosses above the drawer breakpoint while the menu is open,
  // close it — otherwise the body scroll lock stays held and the `.menu--open`
  // state is visually irrelevant on desktop.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.querySelectorAll('.menu--open').forEach(menu => {
        if (!inDrawerMode(menu)) close(menu);
      });
    }, 250);
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.menu = { open, close, toggle };
})();
