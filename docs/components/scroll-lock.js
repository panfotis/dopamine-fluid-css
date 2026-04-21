// Dopamine Fluid — Scroll Lock
// Cross-browser body scroll lock for dialogs, drawers, and modals.
// Ref-counted so multiple components (modal, menu-drawer, ...) can lock concurrently.
// API: dopamine.scrollLock.lock(), .unlock(), .isLocked()

(function () {
  let count = 0;
  let savedScrollY = 0;
  let savedInline = {};

  function capture(body, keys) {
    const saved = {};
    keys.forEach(k => { saved[k] = body.style[k] || ''; });
    return saved;
  }

  function restore(body, saved) {
    Object.keys(saved).forEach(k => { body.style[k] = saved[k]; });
  }

  function lock() {
    if (count++ > 0) return;

    const body = document.body;
    const html = document.documentElement;

    savedScrollY = window.scrollY || window.pageYOffset || 0;
    savedInline = capture(body, ['position', 'top', 'left', 'right', 'width', 'overflow', 'paddingRight']);

    // Compensate for the scrollbar we're about to hide (desktop Windows / Firefox).
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    if (scrollbarWidth > 0) {
      const existing = parseInt(getComputedStyle(body).paddingRight, 10) || 0;
      body.style.paddingRight = (existing + scrollbarWidth) + 'px';
    }

    // iOS-safe lock: `overflow: hidden` alone doesn't stop Safari — we also pin the body.
    body.style.position = 'fixed';
    body.style.top = '-' + savedScrollY + 'px';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }

  function unlock() {
    if (count === 0) return;
    if (--count > 0) return;

    const body = document.body;
    restore(body, savedInline);
    savedInline = {};

    // `position: fixed` scrolled the body to the top — restore where the user was.
    window.scrollTo(0, savedScrollY);
  }

  function isLocked() {
    return count > 0;
  }

  window.dopamine = window.dopamine || {};
  window.dopamine.scrollLock = { lock, unlock, isLocked };
})();
