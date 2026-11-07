'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { Pressable } from './Button';
import { Icon } from './Icon';
import { RADIUS, TARGET, transition } from './tokens';

// TileButton — a big icon + word choice for a 2-wide grid (Find's browse
// buttons). The whole tile is one button (or a link with href); the icon is
// decorative, the word names it. `wide` spans the row and lays the icon
// beside the word (used for the first, most common choice). ≥ 96px tall
// (wide ≥ 64px); the word wraps at large text sizes.
//   <TileButton icon="food" label="Food & drink" onClick={…}/>
//   <TileButton wide icon="locate" label="Near me now" onClick={…}/>
function TileButton({ icon, label, onClick, href, wide = false, style, ...rest }) {
  return (
    <Pressable onClick={onClick} href={href} className="ds-row-link" style={{
      display: 'flex', flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start',
      justifyContent: wide ? 'flex-start' : 'space-between', gap: wide ? 14 : 10,
      gridColumn: wide ? '1 / -1' : undefined, width: '100%', boxSizing: 'border-box',
      minHeight: wide ? TARGET.row : 96, padding: wide ? '10px 18px' : '14px 16px',
      borderRadius: RADIUS.lg, border: `2px solid ${C2.line}`, background: C2.paper, color: C2.char,
      fontFamily: F2, fontSize: 17.5, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em',
      textAlign: 'left', textDecoration: 'none', cursor: 'pointer', overflowWrap: 'break-word',
      transition: transition(['border-color', 'background-color'], 'fast'), ...style,
    }} {...rest}>
      <span style={{ color: C2.teal, display: 'inline-flex' }}><Icon name={icon} size={28} strokeWidth={2.1}/></span>
      <span style={{ minWidth: 0 }}>{label}</span>
    </Pressable>
  );
}

export { TileButton };
