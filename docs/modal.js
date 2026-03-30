// Dopamine Fluid — Modal Component
// Tiny script for open/close. Supports ESC key and click-outside.

document.addEventListener('click', e => {
  // Open
  const openBtn = e.target.closest('[data-modal-open]');
  if (openBtn) {
    const modal = document.getElementById(openBtn.dataset.modalOpen);
    if (modal) modal.classList.add('modal--open');
  }

  // Close — via button or overlay click
  if (e.target.closest('[data-modal-close]') || e.target.classList.contains('modal__overlay')) {
    const modal = e.target.closest('.modal');
    if (modal) modal.classList.remove('modal--open');
  }
});

// ESC key closes the open modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelector('.modal--open')?.classList.remove('modal--open');
  }
});
