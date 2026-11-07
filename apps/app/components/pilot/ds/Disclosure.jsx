'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { Icon } from './Icon';
import { RADIUS, SPACE, TYPE } from './tokens';

// Disclosure — "more detail, one tap deeper", the same way every time. A
// native <details>/<summary> (screen readers announce collapsed/expanded; no
// script needed to open it), a ≥ 60px summary with an icon, the title and a
// chevron. The body mounts only while open, so closed sections cost nothing.
// `emptyText` shows when the body renders nothing (a section with no data).
// Use useDisclosures(key) to remember which ones are open for the session.
//   const more = useDisclosures('place');
//   <Disclosure id="photos" icon="photo" title="Photos" {...more.props('photos')}>…</Disclosure>
function Disclosure({ title, icon, open = false, onToggle, emptyText, children, style }) {
  return (
    <details open={open} onToggle={e => { if (e.currentTarget.open !== open) onToggle?.(e.currentTarget.open); }}
      className="ds-disc" style={{ borderTop: `1px solid ${C2.hair}`, ...style }}>
      <summary className="ds-disc-summary" style={{
        display: 'flex', alignItems: 'center', gap: SPACE.sm, minHeight: 60, padding: `8px ${SPACE.xs}px`, boxSizing: 'border-box',
        cursor: 'pointer', listStyle: 'none', borderRadius: RADIUS.sm,
        fontFamily: F2, fontSize: 17, fontWeight: 700, lineHeight: 1.3, color: C2.char,
      }}>
        {icon && <span style={{ color: C2.teal, display: 'inline-flex' }}><Icon name={icon} size={22}/></span>}
        <span style={{ flex: 1, minWidth: 0 }}>{title}</span>
        <span className="ds-disc-chev" style={{ color: C2.slate, display: 'inline-flex' }}><Icon name="down" size={20}/></span>
      </summary>
      {open && (
        <div style={{ padding: `${SPACE.xxs}px ${SPACE.xs}px ${SPACE.lg}px` }}>
          <div className="ds-disc-body">{children}</div>
          {emptyText && <p className="ds-disc-empty" style={{ ...TYPE.callout, color: C2.slate, margin: 0 }}>{emptyText}</p>}
        </div>
      )}
    </details>
  );
}

// Which disclosures are open, remembered for this browser session.
function useDisclosures(key) {
  const store = `ra-disc-${key}`;
  const [open, setOpen] = React.useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem(store) || '[]')); } catch { return new Set(); }
  });
  const toggle = (id, on) => setOpen(prev => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    try { sessionStorage.setItem(store, JSON.stringify([...next])); } catch { /* private mode */ }
    return next;
  });
  return { props: id => ({ open: open.has(id), onToggle: on => toggle(id, on) }) };
}

export { Disclosure, useDisclosures };
