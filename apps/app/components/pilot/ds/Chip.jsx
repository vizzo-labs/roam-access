'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2 } from '../ui/palette';
import { Icon } from './Icon';
import { GUTTER, RADIUS, TARGET, tone as toneOf, transition } from './tokens';

const chipBase = {
  display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, boxSizing: 'border-box',
  borderRadius: RADIUS.pill, fontFamily: F2, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.2,
};

// Chip — a static label (a need, a tag). Not operable.
function Chip({ children, icon, tone = 'neutral', outline = false, style }) {
  const t = toneOf(tone);
  return (
    <span style={{
      ...chipBase, minHeight: 32, padding: '5px 12px', fontSize: 14,
      background: outline ? C2.paper : t.bg, color: t.fg,
      border: `1.5px solid ${outline ? t.edge : 'transparent'}`, ...style,
    }}>
      {icon && <Icon name={icon} size={16}/>}
      {children}
    </span>
  );
}

// FilterChip — a toggle button (aria-pressed). Selected = filled teal AND a
// check mark, so the state never relies on colour. `count` is read as part of
// the name: "Works for me, 12".
function FilterChip({ children, selected = false, onChange, icon, count, disabled = false, style, ...rest }) {
  return (
    <button type="button" className="ds-press" aria-pressed={selected} disabled={disabled}
      onClick={() => onChange && onChange(!selected)}
      style={{
        ...chipBase, minHeight: TARGET.min, padding: selected ? '0 16px 0 12px' : '0 16px', fontSize: 15,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: selected ? C2.teal : C2.paper, color: selected ? C2.paper : C2.char,
        border: `1.5px solid ${selected ? C2.teal : C2.line}`,
        transition: transition(['background-color', 'border-color', 'color'], 'fast'),
        ...(disabled ? { opacity: 0.55 } : null), ...style,
      }} {...rest}>
      {selected ? <Icon name="check" size={18} strokeWidth={2.4}/> : icon ? <Icon name={icon} size={18}/> : null}
      <span>{children}</span>
      {typeof count === 'number' && (
        <span style={{
          minWidth: 22, padding: '1px 7px', borderRadius: RADIUS.pill, fontSize: 13, fontWeight: 700, textAlign: 'center',
          background: selected ? 'rgba(250,249,246,0.18)' : C2.stone, color: selected ? C2.paper : C2.char,
        }}><span className="ra-sr-only">, </span>{count}</span>
      )}
    </button>
  );
}

// RemovableChip — an applied filter you can clear. One button: "Remove filter: Cafés".
function RemovableChip({ children, onRemove, removeLabel, style }) {
  const t = useT();
  return (
    <button type="button" className="ds-press" onClick={onRemove}
      aria-label={removeLabel || (typeof children === 'string' ? t('ds.removeFilter', { name: children }) : undefined)}
      style={{
        ...chipBase, minHeight: TARGET.min, padding: '0 10px 0 16px', fontSize: 15, cursor: 'pointer',
        background: C2.tealSoft, color: C2.teal, border: `1.5px solid ${C2.teal}`, ...style,
      }}>
      <span>{children}</span>
      <Icon name="close" size={18} strokeWidth={2.4}/>
    </button>
  );
}

// ChipGroup — a labelled row of chips. Scrolls sideways by default (`wrap`
// to wrap instead — use wrap when every option must be visible at once).
// `bleed` lets the row run to the screen edges inside a GUTTER-padded screen.
function ChipGroup({ label, children, wrap = false, bleed = false, gap = 8, style }) {
  const edge = bleed ? { marginLeft: -GUTTER, marginRight: -GUTTER, paddingLeft: GUTTER, paddingRight: GUTTER } : null;
  return (
    <div role="group" aria-label={label} className={wrap ? undefined : 'ds-scroll-x'}
      style={{ display: 'flex', gap, flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: 'center', ...edge, ...style }}>
      {children}
      {!wrap && bleed && <span aria-hidden="true" style={{ flex: `0 0 ${GUTTER - gap}px` }}/>}
    </div>
  );
}

export { Chip, FilterChip, RemovableChip, ChipGroup };
