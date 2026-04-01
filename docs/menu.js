// Dopamine Fluid — Menu Component
// Tiny script for open/close. Supports ESC key and click-outside.

document.addEventListener('click', e => {
  // Toggle
  if (e.target.closest('.menu__toggle')) {
    const menu = e.target.closest('.menu');
    if (menu) menu.classList.toggle('menu--open');
  }

  // Close via overlay or close button
  if (e.target.classList.contains('menu__overlay') || e.target.closest('.menu__close')) {
    const menu = e.target.closest('.menu');
    if (menu) menu.classList.remove('menu--open');
  }
});

// ESC key closes the open menu
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelector('.menu--open')?.classList.remove('menu--open');
  }
});
