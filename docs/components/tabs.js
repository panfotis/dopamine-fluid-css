// Dopamine Fluid — Tabs Component
// Click a [data-tab-target="#id"] button inside .tabs to show that panel; siblings hide.
// Arrow-key navigation (Left/Right/Home/End) + full WAI-ARIA tablist wiring.
// API: dopamine.tabs.activate(panelIdOrEl)   // "p1", "#p1", or the panel element
// Events: dp:tabs:change on .tabs, detail: { panel, trigger }

(function () {
  function resolvePanel(target) {
    if (!target) return null;
    if (typeof target !== 'string') return target;
    return document.querySelector(target.startsWith('#') ? target : '#' + target);
  }

  function enhance(tabs) {
    if (tabs.dataset.tabsEnhanced === '1') return;
    tabs.dataset.tabsEnhanced = '1';

    const btnList = tabs.querySelector('.tab__buttons');
    if (btnList) btnList.setAttribute('role', 'tablist');

    const triggers = tabs.querySelectorAll('[data-tab-target]');
    triggers.forEach(btn => {
      const panel = tabs.querySelector(btn.dataset.tabTarget);
      if (!panel) return;
      if (!btn.id) btn.id = 'tab-btn-' + Math.random().toString(36).slice(2);
      if (!panel.id) panel.id = 'tab-panel-' + Math.random().toString(36).slice(2);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', btn.id);
      panel.setAttribute('tabindex', '0');
    });
    // Seed aria-selected / tabindex from the current active state.
    syncAria(tabs);
  }

  function syncAria(tabs) {
    tabs.querySelectorAll('[data-tab-target]').forEach(btn => {
      const isActive = btn.classList.contains('tab__btn--active');
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  function activate(target) {
    const panel = resolvePanel(target);
    if (!panel) return;

    const tabs = panel.closest('.tabs');
    if (!tabs) return;
    enhance(tabs);

    const trigger = tabs.querySelector(`[data-tab-target="#${panel.id}"]`);

    tabs.querySelectorAll('[data-tab-target]').forEach(b => b.classList.remove('tab__btn--active'));
    tabs.querySelectorAll('.tab__panel').forEach(p => p.classList.remove('tab__panel--active'));

    if (trigger) trigger.classList.add('tab__btn--active');
    panel.classList.add('tab__panel--active');
    syncAria(tabs);

    tabs.dispatchEvent(new CustomEvent('dp:tabs:change', {
      bubbles: true,
      detail: { panel, trigger }
    }));
  }

  function focusTrigger(trigger) {
    if (!trigger) return;
    // Activate + focus — roving tabindex makes this the only focusable tab.
    trigger.click();
    trigger.focus();
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-tab-target]');
    if (!trigger) return;
    const tabs = trigger.closest('.tabs');
    if (!tabs) return;
    enhance(tabs);
    const panel = tabs.querySelector(trigger.dataset.tabTarget);
    if (panel) activate(panel);
  });

  document.addEventListener('keydown', e => {
    const trigger = e.target.closest('[role="tab"]');
    if (!trigger) return;
    const tablist = trigger.closest('[role="tablist"]');
    if (!tablist) return;

    const triggers = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const index = triggers.indexOf(trigger);
    if (index === -1) return;

    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = triggers[(index + 1) % triggers.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = triggers[(index - 1 + triggers.length) % triggers.length];
    } else if (e.key === 'Home') {
      next = triggers[0];
    } else if (e.key === 'End') {
      next = triggers[triggers.length - 1];
    }
    if (next) {
      e.preventDefault();
      focusTrigger(next);
    }
  });

  // Initialize every .tabs on load so ARIA is correct even before first interaction.
  function initAll() {
    document.querySelectorAll('.tabs').forEach(enhance);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.dopamine = window.dopamine || {};
  window.dopamine.tabs = { activate };
})();
