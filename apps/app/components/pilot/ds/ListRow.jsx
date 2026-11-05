'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { Pressable } from './Button';
import { Icon } from './Icon';
import { GUTTER, RADIUS, SPACE, TARGET, divider, transition } from './tokens';

// List — a real <ul>; wraps each child in <li>. `inset` draws it as one
// rounded group (iOS-style); otherwise rows are full-bleed with dividers.
// `label` names the list for screen readers ("Places that work for you").
function List({ children, label, inset = false, dividers = true, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <ul aria-label={label} style={{
      listStyle: 'none', margin: 0, padding: 0,
      ...(inset ? { border: `1.5px solid ${C2.hair}`, borderRadius: RADIUS.lg, overflow: 'hidden', background: C2.paper } : null),
      ...style,
    }}>
      {items.map((child, i) => (
        <li key={child.key ?? i} style={{ borderTop: dividers && i > 0 ? divider() : 0 }}>{child}</li>
      ))}
    </ul>
  );
}

// ListRow — one row: [leading] title / subtitle / meta [trailing] [chevron].
// Interactive with onClick (button) or href (link); the whole row is one
// target ≥ 56px. Don't put other buttons inside an interactive row — use
// `after` for a separate control beside it (e.g. a save IconButton).
// `selected` marks the row that's selected on the map (pair with aria-current).
function ListRow({
  title, subtitle, meta, leading, trailing, after, onClick, href, external, chevron,
  selected = false, padX = GUTTER, dense = false, titleAs: TitleTag = 'span',
  onMouseEnter, onMouseLeave, onFocus, onBlur, style, ...rest
}) {
  const interactive = !!(onClick || href);
  const showChevron = chevron ?? interactive;
  const W = interactive ? 'span' : 'div';
  const inner = (
    <>
      {leading && <W style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{leading}</W>}
      <W style={{ flex: 1, minWidth: 0, display: 'block' }}>
        <TitleTag className="ds-row-title" style={{ display: 'block', fontSize: dense ? 16 : 16.5, fontWeight: 700, letterSpacing: '-0.01em', color: C2.char, lineHeight: 1.3, margin: 0 }}>{title}</TitleTag>
        {subtitle && <span style={{ display: 'block', fontSize: 14, color: C2.slate, lineHeight: 1.4, marginTop: 2 }}>{subtitle}</span>}
        {meta && <span style={{ display: 'block', fontSize: 14, color: C2.char, lineHeight: 1.4, marginTop: 6 }}>{meta}</span>}
      </W>
      {trailing && <W style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>{trailing}</W>}
      {showChevron && <span style={{ color: C2.slate, flexShrink: 0 }}><Icon name={external ? 'external' : 'forward'} size={18}/></span>}
    </>
  );
  const rowStyle = {
    display: 'flex', alignItems: 'center', gap: SPACE.sm, width: '100%', boxSizing: 'border-box',
    minHeight: dense ? TARGET.std : TARGET.lg, padding: `${dense ? 10 : 14}px ${padX}px`,
    fontFamily: F2, textAlign: 'left', textDecoration: 'none', color: C2.char,
    background: selected ? C2.tealSoft : 'transparent', border: 0, margin: 0,
    boxShadow: selected ? `inset 4px 0 0 ${C2.teal}` : 'none',
    transition: transition(['background-color'], 'fast'),
  };
  const hover = { onMouseEnter, onMouseLeave, onFocus, onBlur };
  // With `after`, the row sits in a flex wrapper that owns the background.
  const own = after
    ? { ...rowStyle, background: 'transparent', boxShadow: 'none', paddingRight: SPACE.xs }
    : { ...rowStyle, ...style };
  const row = interactive ? (
    <Pressable onClick={onClick} href={href} external={external} className="ds-row-link"
      style={{ ...own, cursor: 'pointer' }} {...hover} {...rest}>{inner}</Pressable>
  ) : (
    <div style={own} {...hover} {...rest}>{inner}</div>
  );
  if (!after) return row;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: padX, background: rowStyle.background, boxShadow: rowStyle.boxShadow, ...style }}>
      <div style={{ flex: 1, minWidth: 0 }}>{row}</div>
      {after}
    </div>
  );
}

export { List, ListRow };
