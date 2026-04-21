// Dopamine Fluid — Menu Drawer Component
// Turns every <li> inside `ul.menu.menu-level-0` whose direct child is `.menu-dropdown-0`
// into a right-sliding drawer on mobile/tablet (<= $menu-drawer-bp, default 991).
// API: dopamine.menuDrawer.open(li), .close(li), .closeAll(), .toggle(li), .isOpen(li), .refresh()
// Events: df:menu-drawer:open, df:menu-drawer:close (bubble from .menu-dropdown-0)
//
// Requires menu.js (the outer burger) to be loaded on the page. It's the integration
// point for `df:menu:close` (cascade-close on burger close) and owns the body scroll
// lock while the burger is open on mobile.

(function () {
  const ROOT_SELECTOR = 'ul.menu.menu-level-0';
  const BP_DEFAULT = 991;

  const bp = () => window.DOPE_MENU_DRAWER_BP || BP_DEFAULT;
  const isMobile = () => window.innerWidth <= bp();

  function getDirectChild(parent, selector) {
    return Array.from(parent.children).find(el => el.matches && el.matches(selector)) || null;
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function rootOf(li) {
    const root = li.closest(ROOT_SELECTOR);
    return (root && li.parentElement === root) ? root : null;
  }

  function closeLi(li) {
    if (!li || !li.classList.contains('menu-drawer--open')) return;
    const trigger = getDirectChild(li, 'a, span');
    const drawer = getDirectChild(li, '.menu-dropdown-0');
    if (!trigger || !drawer) return;
    li.classList.remove('menu-drawer--open');
    trigger.setAttribute('aria-expanded', 'false');
    // Mobile dialog attributes are only present when opened in drawer mode — strip them.
    drawer.removeAttribute('role');
    drawer.removeAttribute('aria-modal');
    drawer.removeAttribute('aria-hidden');
    drawer.dispatchEvent(new CustomEvent('df:menu-drawer:close', { bubbles: true }));
  }

  function closeAll(rootUl) {
    const roots = rootUl ? [rootUl] : document.querySelectorAll(ROOT_SELECTOR);
    roots.forEach(root => {
      Array.from(root.children)
        .filter(li => li.classList.contains('menu-drawer--open'))
        .forEach(closeLi);
    });
  }

  function titleFor(trigger) {
    if (trigger.dataset.menuDrawerTitle) return trigger.dataset.menuDrawerTitle.trim();
    return Array.from(trigger.childNodes)
      .filter(n => n.nodeType === 3 || (n.nodeType === 1 && n.getAttribute('aria-hidden') !== 'true'))
      .map(n => n.textContent)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function ensureEnhanced(li) {
    if (li.dataset.drawerEnhanced === '1') return;

    const trigger = getDirectChild(li, 'a, span');
    const drawer = getDirectChild(li, '.menu-dropdown-0');
    if (!trigger || !drawer) return;

    const drawerId = drawer.id || ('menu-drawer-' + Math.random().toString(36).slice(2));
    const triggerId = trigger.id || ('menu-trigger-' + Math.random().toString(36).slice(2));
    drawer.id = drawerId;
    trigger.id = triggerId;

    drawer.setAttribute('tabindex', '-1');
    trigger.setAttribute('aria-controls', drawerId);
    trigger.setAttribute('aria-expanded', 'false');

    let header = drawer.querySelector('.menu-drawer-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'menu-drawer-header';
      header.innerHTML =
        '<button type="button" class="menu-drawer-back-btn" aria-label="Back">' +
          '<span class="menu-drawer-back-icon" aria-hidden="true">\u2190</span>' +
          '<span class="menu-drawer-title"></span>' +
        '</button>';
      header.querySelector('.menu-drawer-title').textContent = titleFor(trigger);
      drawer.prepend(header);
    }

    const backBtn = header.querySelector('.menu-drawer-back-btn');
    if (backBtn && backBtn.dataset.drawerBackBound !== '1') {
      backBtn.addEventListener('click', () => {
        closeLi(li);
        trigger.focus({ preventScroll: true });
      });
      backBtn.dataset.drawerBackBound = '1';
    }

    drawer.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const btn = drawer.querySelector('.menu-drawer-back-btn');
        if (btn) btn.click();
        return;
      }
      // Tab trap — only while the drawer is in modal-dialog state (mobile open).
      if (e.key === 'Tab' && drawer.getAttribute('aria-modal') === 'true') {
        const nodes = drawer.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), ' +
          'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!nodes.length) return;
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
    });

    li.dataset.drawerEnhanced = '1';
  }

  function sizeDrawerToViewport(drawer) {
    const topVar = getComputedStyle(drawer).getPropertyValue('--menu-drawer-top').trim();
    const offsetVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--drupal-displace-offset-top').trim();
    const top = parseInt(topVar, 10) || 0;
    const offset = parseInt(offsetVar, 10) || 0;
    const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    drawer.style.setProperty('--menu-drawer-height', (vh - top - offset) + 'px');
  }

  function resizeOpenDrawers() {
    if (!isMobile()) return;
    document.querySelectorAll('.menu.menu-level-0 > li.menu-item.menu-drawer--open > .menu-dropdown-0')
      .forEach(sizeDrawerToViewport);
  }

  function open(li) {
    const root = rootOf(li);
    if (!root) return;
    const trigger = getDirectChild(li, 'a, span');
    const drawer = getDirectChild(li, '.menu-dropdown-0');
    if (!trigger || !drawer) return;

    ensureEnhanced(li);
    closeAll(root);

    li.classList.add('menu-drawer--open');
    trigger.setAttribute('aria-expanded', 'true');

    if (isMobile()) {
      // Promote the drawer to a modal dialog while it's the viewport-covering drawer.
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      sizeDrawerToViewport(drawer);
      const focusable = drawer.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      (focusable || drawer).focus({ preventScroll: true });
    }

    drawer.dispatchEvent(new CustomEvent('df:menu-drawer:open', { bubbles: true }));
  }

  function attach(root) {
    if (root.dataset.drawerAttached === '1') return;
    root.dataset.drawerAttached = '1';

    root.addEventListener('click', e => {
      if (e.target.closest('.menu-dropdown-0')) return;

      const headerEl = e.target.closest('a, span');
      if (!headerEl) return;
      const li = headerEl.closest('li.menu-item');
      if (!li || li.parentElement !== root) return;
      if (!getDirectChild(li, '.menu-dropdown-0')) return;

      e.preventDefault();
      if (li.classList.contains('menu-drawer--open')) {
        closeLi(li);
      } else {
        open(li);
      }
    });
  }

  function refresh() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(attach);
  }

  window.addEventListener('resize', debounce(() => {
    if (!isMobile()) closeAll();
    else resizeOpenDrawers();
  }, 250));

  // visualViewport fires on orientation change and when the iOS URL bar shows/hides.
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debounce(resizeOpenDrawers, 100));
  }

  document.addEventListener('df:menu:close', () => closeAll());

  // Click outside any .menu-level-0 closes open desktop dropdowns.
  // On mobile the drawer covers the viewport so this is effectively a no-op.
  document.addEventListener('click', e => {
    if (!e.target.closest('.menu.menu-level-0')) closeAll();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }

  function toggle(li) {
    if (!li) return;
    li.classList.contains('menu-drawer--open') ? closeLi(li) : open(li);
  }
  function isOpen(li) {
    return !!(li && li.classList.contains('menu-drawer--open'));
  }

  window.dopamine = window.dopamine || {};
  window.dopamine.menuDrawer = { open, close: closeLi, closeAll, toggle, isOpen, refresh };
})();
