'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { Icon } from './Icon';
import { RADIUS, TARGET, transition } from './tokens';

// TabBar — the phone's main navigation (Find · Saved · Me). Each tab is one
// ≥ 64px button with an icon AND a 14px word; the current tab has
// aria-current="page", a bar above it, a heavier icon and teal words, so the
// state never relies on colour. `count` draws a pip on the icon (visual
// only); `countSr` is what a screen reader hears after the label
// ("Saved, 2 new updates").
//   <TabBar label="Main" active="saved" onSelect={id => go(id)}
//     items={[{ id: 'find', label: 'Find', icon: 'search' }, …]}/>
function TabBar({ label, items, active, onSelect, style }) {
  return (
    <nav aria-label={label} style={{
      display: 'flex', flexShrink: 0, background: C2.paper, borderTop: `1px solid ${C2.hair}`,
      paddingBottom: 'calc(var(--ra-tabs-pad) - 8px)', ...style,
    }}>
      {items.map(it => {
        const on = it.id === active;
        const col = on ? C2.teal : C2.slate;
        return (
          <button key={it.id} type="button" onClick={() => onSelect(it.id)} aria-current={on ? 'page' : undefined}
            className="ds-press"
            style={{
              position: 'relative', flex: 1, minWidth: 0, minHeight: TARGET.row,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              padding: '8px 4px 6px', background: 'transparent', border: 0, cursor: 'pointer',
              fontFamily: F2, color: col, transition: transition(['color'], 'fast'),
            }}>
            <span aria-hidden="true" style={{
              position: 'absolute', top: 0, left: '22%', right: '22%', height: 3,
              borderRadius: '0 0 3px 3px', background: on ? C2.teal : 'transparent',
            }}/>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Icon name={it.icon} size={26} strokeWidth={on ? 2.4 : 1.9}/>
              {!!it.count && (
                <span aria-hidden="true" style={{
                  position: 'absolute', top: -7, left: 17, minWidth: 22, height: 22, padding: '0 6px', boxSizing: 'border-box',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.pill,
                  background: C2.rust, color: C2.paper, border: `2px solid ${C2.paper}`,
                  fontSize: 13, fontWeight: 800, lineHeight: 1,
                }}>{it.count > 9 ? '9+' : it.count}</span>
              )}
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.2, fontWeight: on ? 800 : 700, textAlign: 'center', overflowWrap: 'anywhere' }}>
              {it.label}
              {!!it.count && it.countSr && <span className="ra-sr-only">, {it.countSr}</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export { TabBar };
