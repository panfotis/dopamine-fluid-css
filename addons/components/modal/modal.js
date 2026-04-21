// Dopamine Fluid — Modal Component
// Open/close with ESC and click-outside support.
// API: dopamine.modal.open(id|el), .close(id|el), .toggle(id|el)
// Events: dp:modal:open, dp:modal:close (bubble from .modal)

(function () {
  const resolve = m => typeof m === 'string' ? document.getElementById(m) : m;

  function open(target) {
    const modal = resolve(target);
    if (!modal || modal.classList.contains('modal--open')) return;
    modal.classList.add('modal--open');
    if (window.dopamine && window.dopamine.scrollLock) window.dopamine.scrollLock.lock();
    modal.dispatchEvent(new CustomEvent('dp:modal:open', { bubbles: true }));
  }

  function close(target) {
    const modal = resolve(target);
    if (!modal || !modal.classList.contains('modal--open')) return;
    modal.classList.remove('modal--open');
    if (window.dopamine && window.dopamine.scrollLock) window.dopamine.scrollLock.unlock();
    modal.dispatchEvent(new CustomEvent('dp:modal:close', { bubbles: true }));
  }

  function toggle(target) {
    const modal = resolve(target);
    if (!modal) return;
    modal.classList.contains('modal--open') ? close(modal) : open(modal);
  }

  document.addEventListener('click', e => {
    const openBtn = e.target.closest('[data-modal-open]');
    if (openBtn) {
      open(openBtn.dataset.modalOpen);
      return;
    }
    if (e.target.closest('[data-modal-close]') || e.target.classList.contains('modal__overlay')) {
      close(e.target.closest('.modal'));
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close(document.querySelector('.modal--open'));
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.modal = { open, close, toggle };
})();
