'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2 } from '../ui/palette';
import { Pressable } from './Button';
import { Icon } from './Icon';
import { RADIUS, transition } from './tokens';

// ActionRow — the venue's quick actions, always in the same order and place:
// Directions · Call · Website · Save · Share (Google/Apple Maps pattern).
// Each action is ONE target (icon + visible label, ≥ 64×72px).
//   actions = [
//     { id: 'dir', label: 'Directions', icon: 'directions', primary: true, href, external: true,
//       ariaLabel: 'Directions to Hugos (opens Google Maps)' },
//     { id: 'save', label: saved ? 'Saved' : 'Save', icon: 'bookmark', pressed: saved, onClick },
//   ]
// Leave out actions that don't apply (no phone → no Call); don't disable them.
function ActionRow({ actions, label, style }) {
  const t = useT();
  return (
    <div role="group" aria-label={label || t('ds.actions')} className="ds-scroll-x" style={{ display: 'flex', gap: 4, ...style }}>
      {actions.filter(Boolean).map(a => {
        const on = a.pressed === true;
        const circle = a.primary
          ? { background: C2.teal, color: C2.paper, border: `1.5px solid ${C2.teal}` }
          : on
            ? { background: C2.tealSoft, color: C2.teal, border: `2px solid ${C2.teal}` }
            : { background: C2.paper, color: C2.teal, border: `1.5px solid ${C2.line}` };
        return (
          <Pressable key={a.id || a.label} href={a.href} external={a.external} onClick={a.onClick}
            aria-label={a.ariaLabel} aria-pressed={typeof a.pressed === 'boolean' ? a.pressed : undefined}
            style={{
              flex: '1 0 64px', minWidth: 64, minHeight: 76, padding: '4px 2px', boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'transparent', border: 0, borderRadius: RADIUS.md, cursor: 'pointer',
              fontFamily: F2, textDecoration: 'none', color: C2.char,
            }}>
            <span aria-hidden="true" style={{
              width: 48, height: 48, borderRadius: RADIUS.pill, boxSizing: 'border-box',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              transition: transition(['background-color', 'border-color'], 'fast'), ...circle,
            }}><Icon name={a.icon} size={22} strokeWidth={2.1} filled={on}/></span>
            <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.2, textAlign: 'center', color: a.primary || on ? C2.teal : C2.char }}>{a.label}</span>
          </Pressable>
        );
      })}
    </div>
  );
}

export { ActionRow };
