// Dopamine Fluid — Modal Component
// Open/close with ESC and click-outside support. Traps focus and restores to the trigger on close.
// API: dopamine.modal.open(id|el), .close(id|el), .toggle(id|el)
// Events: dp:modal:open, dp:modal:close (bubble from .modal)

(function () {
  const resolve = m => typeof m === 'string' ? document.getElementById(m) : m;
  const triggerRegistry = new WeakMap();

  function focusableWithin(modal) {
    return modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  function trapTab(modal, e) {
    const nodes = focusableWithin(modal);
    if (!nodes.length) { e.preventDefault(); modal.focus(); return; }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }

  function open(target, triggerEl) {
    const modal = resolve(target);
    if (!modal || modal.classList.contains('modal--open')) return;

    triggerRegistry.set(modal, triggerEl || document.activeElement);

    modal.classList.add('modal--open');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('tabindex', '-1');

    if (window.dopamine && window.dopamine.scrollLock) window.dopamine.scrollLock.lock();

    const focusable = focusableWithin(modal);
    (focusable[0] || modal).focus({ preventScroll: true });

    modal.dispatchEvent(new CustomEvent('dp:modal:open', { bubbles: true }));
  }

  function close(target) {
    const modal = resolve(target);
    if (!modal || !modal.classList.contains('modal--open')) return;

    modal.classList.remove('modal--open');
    modal.removeAttribute('role');
    modal.removeAttribute('aria-modal');

    if (window.dopamine && window.dopamine.scrollLock) window.dopamine.scrollLock.unlock();

    const trigger = triggerRegistry.get(modal);
    triggerRegistry.delete(modal);
    if (trigger && typeof trigger.focus === 'function') {
      trigger.focus({ preventScroll: true });
    }

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
      open(openBtn.dataset.modalOpen, openBtn);
      return;
    }
    if (e.target.closest('[data-modal-close]') || e.target.classList.contains('modal__overlay')) {
      close(e.target.closest('.modal'));
    }
  });

  document.addEventListener('keydown', e => {
    const openModal = document.querySelector('.modal--open');
    if (!openModal) return;
    if (e.key === 'Escape') { close(openModal); return; }
    if (e.key === 'Tab') trapTab(openModal, e);
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.modal = { open, close, toggle };
})();
