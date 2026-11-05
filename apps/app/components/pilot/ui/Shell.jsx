'use client';

import React from 'react';
import { C2, F2 } from './palette';

// ── Screen scaffold ───────────────────────────────────────────────────────
// Flex column: scrollable content + fixed chrome (action bar, tabs) below it,
// so nothing ever hides under the chrome and the chrome never scrolls away.
function V2Shell({ children, bg = null, scroll = true, bar = null, tabs = null, app = null, active = 'home' }) {
  return (
    <div className="v2-screen" style={{ background: bg || C2.paper }}>
      {scroll
        ? <div className="v2-scroll">{children}</div>
        : <div className="v2-fixed">{children}</div>}
      {bar}
      {tabs && app && <V2TabBar active={active} app={app}/>}
    </div>
  );
}

function V2TabBar({ active, app }) {
  if (app.wide) return null; // the web layout's header carries navigation
  const items = [
    { id: 'home',  label: 'Home',  d: 'M4 11.5 12 4l8 7.5M6 10v9h12v-9' },
    { id: 'saved', label: 'Saved', d: 'M6 4h12v17l-6-4-6 4V4Z' },
    { id: 'me',    label: 'Me',    d: 'M12 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 12 11ZM4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5' },
  ];
  return (
    <nav aria-label="Primary" style={{
      paddingTop: 8, paddingBottom: 'var(--ra-tabs-pad)',
      background: C2.paper, borderTop: `1px solid ${C2.hair}`,
      display: 'flex', flexShrink: 0,
    }}>
      {items.map(it => {
        const on = it.id === active;
        const col = on ? C2.teal : C2.slate;
        return (
          <button key={it.id} onClick={() => app.goto(it.id)} aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minHeight: 54, padding: '4px 0', background: 'transparent', border: 0,
              cursor: 'pointer', fontFamily: F2,
            }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d={it.d} stroke={col} strokeWidth={on ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12.5, fontWeight: on ? 700 : 600, color: col }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export { V2Shell, V2TabBar };
