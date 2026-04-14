// Dopamine Fluid — Tabs Component
// Click a [data-tab-target="#id"] button inside .tabs to show that panel; siblings hide.
// API: dopamine.tabs.activate(panelIdOrEl)   // "p1", "#p1", or the panel element
// Events: dp:tabs:change on .tabs, detail: { panel, trigger }

(function () {
  function resolvePanel(target) {
    if (!target) return null;
    if (typeof target !== 'string') return target;
    return document.querySelector(target.startsWith('#') ? target : '#' + target);
  }

  function activate(target) {
    const panel = resolvePanel(target);
    if (!panel) return;

    const tabs = panel.closest('.tabs');
    if (!tabs) return;

    const trigger = tabs.querySelector(`[data-tab-target="#${panel.id}"]`);

    tabs.querySelectorAll('[data-tab-target]').forEach(b => b.classList.remove('tab__btn--active'));
    tabs.querySelectorAll('.tab__panel').forEach(p => p.classList.remove('tab__panel--active'));

    if (trigger) trigger.classList.add('tab__btn--active');
    panel.classList.add('tab__panel--active');

    tabs.dispatchEvent(new CustomEvent('dp:tabs:change', {
      bubbles: true,
      detail: { panel, trigger }
    }));
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-tab-target]');
    if (!trigger) return;
    const tabs = trigger.closest('.tabs');
    const panel = tabs && tabs.querySelector(trigger.dataset.tabTarget);
    if (panel) activate(panel);
  });

  window.dopamine = window.dopamine || {};
  window.dopamine.tabs = { activate };
})();
