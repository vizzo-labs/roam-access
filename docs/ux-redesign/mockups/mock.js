// Roam Access — mockup helpers (design phase). Injects the icon sprite, the
// demo bar (text size 100 / 150 / 200 %) and small interactions: toggle
// buttons, segmented controls, dialogs. No framework, no network.
(function () {
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    forward: '<path d="M9 5l7 7-7 7"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M4 12.5l5 5L20 7"/>',
    home: '<path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4V4Z"/>',
    user: '<path d="M12 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 12 11ZM4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5"/>',
    directions: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4M5 13v6h14v-6"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    food: '<path d="M6 3v7a3 3 0 0 0 3 3v8M9 3v7M12 3v7M18 3c-2 0-3 3-3 6v3h3v9"/>',
    park: '<path d="M12 3 6 11h3l-4 6h5v4h4v-4h5l-4-6h3L12 3Z"/>',
    arts: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.3"/><circle cx="12" cy="7.5" r="1.3"/><circle cx="15.5" cy="10" r="1.3"/><path d="M12 21c0-3-2-4-2-6a2 2 0 0 1 4 0"/>',
    bed: '<path d="M3 18V8M3 13h18v5M7 13V9h7a4 4 0 0 1 4 4"/>',
    toilet: '<path d="M7 3h8v7H7zM5 10h14a7 7 0 0 1-14 0ZM10 17v4M14 17v4"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4ZM13 7l4 4"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4V8Z"/><circle cx="12" cy="13" r="3.5"/>',
    warn: '<path d="M12 3 2 21h20L12 3ZM12 10v5M12 18v.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.5"/>',
    speaker: '<path d="M4 10v4h4l5 4V6L8 10H4ZM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    a11y: '<circle cx="12" cy="4.5" r="1.8"/><path d="M4 9c5 1 11 1 16 0M12 10v5M12 15l-3 6M12 15l3 6"/>',
    language: '<path d="M4 6h10M9 4v2c0 5-3 8-6 10M6 6c1 5 4 8 8 10M13 20l4-9 4 9M14.5 17h5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c1.3-3.2 4-4.6 6.5-4.6s5.2 1.4 6.5 4.6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 15.2c2.3 0 4.6 1.3 5.8 4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    star: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.5 6.4 20.4l1.1-6.3L3 9.7l6.2-.9L12 3Z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"/>',
    parking: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 17v-10h4a3 3 0 0 1 0 6H9"/>',
    bus: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M7 17v3M17 17v3"/>',
    door: '<path d="M5 21V4h11v17M16 8h3v13M12.5 12.5v.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7V14M12 17v.5"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2ZM10 21h4"/>',
    ear: '<path d="M6 10a6 6 0 0 1 12 0c0 3-2 4-2 7a3 3 0 0 1-6 0M9 10a3 3 0 0 1 6 0"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    wheelchair: '<circle cx="14" cy="4.5" r="1.8"/><path d="M13 8v6h5l2 5M13 8h-3M7 13a5 5 0 1 0 7 6"/>',
    leaf: '<path d="M4 20c0-9 5-14 16-16-1 10-6 15-14 16M4 20l8-8"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0V7a3 3 0 0 0-3-3ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 0V7a3 3 0 0 1 3-3Z"/>',
    seat: '<path d="M6 12V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7M4 12h16v4H4zM6 16v5M18 16v5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/>',
  };
  function sprite() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('style', 'display:none'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = Object.entries(ICONS).map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${d}</symbol>`).join('');
    document.body.prepend(s);
  }
  function demoBar() {
    const bar = document.createElement('div');
    bar.className = 'demo-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Mockup controls (not part of the app)');
    const here = location.pathname.split('/').pop();
    bar.innerHTML = `<a href="index.html">All screens</a><span class="sep">·</span>
      <span>Text size:</span>
      <button type="button" data-zoom="1" aria-pressed="true">100%</button>
      <button type="button" data-zoom="1.5" aria-pressed="false">150%</button>
      <button type="button" data-zoom="2" aria-pressed="false">200%</button>
      <span class="sep">·</span><span>${document.title.replace(' · Roam Access mockup', '')}</span>`;
    bar.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
      document.documentElement.style.setProperty('--zoom', b.dataset.zoom);
      bar.querySelectorAll('[data-zoom]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      try { localStorage.setItem('ra-mock-zoom', b.dataset.zoom); } catch (e) {}
    }));
    document.body.prepend(bar);
    try {
      const z = localStorage.getItem('ra-mock-zoom');
      if (z) { const b = bar.querySelector(`[data-zoom="${z}"]`); if (b) b.click(); }
    } catch (e) {}
    void here;
  }
  function wire() {
    // aria-pressed toggles (chips, Save, yes/no)
    document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
      const group = b.dataset.toggle;
      if (group && group !== 'self') {
        document.querySelectorAll(`[data-toggle="${group}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b && x.getAttribute('aria-pressed') !== 'true')));
      } else b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      document.dispatchEvent(new CustomEvent('ra-toggle', { detail: b }));
    }));
    // radiogroups with roving tabindex (segmented controls)
    document.querySelectorAll('[role="radiogroup"].seg').forEach(g => {
      const items = [...g.querySelectorAll('[role="radio"]')];
      const select = i => {
        items.forEach((x, j) => { x.setAttribute('aria-checked', String(i === j)); x.tabIndex = i === j ? 0 : -1; });
        items[i].focus();
        document.dispatchEvent(new CustomEvent('ra-seg', { detail: items[i] }));
      };
      items.forEach((x, i) => {
        x.tabIndex = x.getAttribute('aria-checked') === 'true' ? 0 : -1;
        x.addEventListener('click', () => select(i));
        x.addEventListener('keydown', e => {
          const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -i, End: items.length - 1 - i }[e.key];
          if (d === undefined) return; e.preventDefault(); select((i + d + items.length) % items.length);
        });
      });
    });
    // dialogs
    document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      const d = document.getElementById(b.dataset.open); if (d) { d.showModal(); d.querySelector('[autofocus], h2')?.focus(); }
    }));
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog')?.close()));
    // live status
    window.raSay = msg => { let s = document.getElementById('ra-status'); if (!s) { s = document.createElement('div'); s.id = 'ra-status'; s.className = 'sr-only'; s.setAttribute('role', 'status'); s.setAttribute('aria-live', 'polite'); document.body.append(s); } s.textContent = ''; setTimeout(() => { s.textContent = msg; }, 50); };
  }
  document.addEventListener('DOMContentLoaded', () => { sprite(); demoBar(); wire(); });
})();
