'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { Pressable } from './Button';
import { RADIUS, SPACE, elevation, transition } from './tokens';

function variantStyle(variant, interactive) {
  switch (variant) {
    case 'filled': return { background: C2.stone, border: '1.5px solid transparent' };
    case 'tint':   return { background: C2.tealSoft, border: `1.5px solid ${interactive ? C2.teal : C2.tealSoft}` };
    case 'raised': return { background: C2.paper, border: `1px solid ${C2.hair}`, ...elevation(1) };
    case 'brand':  return { background: C2.teal, color: C2.paper, border: 0 };
    // outline: an operable card needs a ≥ 3:1 boundary; a static one may be softer.
    default:       return { background: C2.paper, border: `1.5px solid ${interactive ? C2.line : C2.hair}` };
  }
}

// Card — a surface. Static by default; pass onClick (button) or href (link)
// to make the WHOLE card one control. Put only ONE action in an interactive
// card: nested buttons inside a button are invalid. For a card with several
// actions, keep it static and put Buttons inside.
// `selected` draws a 2px teal ring (pair it with aria-current / aria-pressed).
// `media` renders edge-to-edge on top (e.g. a photo, with its own alt text).
const Card = React.forwardRef(function Card({
  children, variant = 'outline', padding = SPACE.md, onClick, href, external, selected = false,
  media = null, as: As = 'div', style, className = '', ...rest
}, ref) {
  const interactive = !!(onClick || href);
  const base = {
    display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'left',
    borderRadius: RADIUS.lg, overflow: 'hidden', color: C2.char, fontFamily: F2, fontSize: 16, lineHeight: 1.45,
    textDecoration: 'none', position: 'relative',
    transition: transition(['border-color', 'box-shadow', 'background-color'], 'fast'),
    ...variantStyle(variant, interactive),
    ...(selected ? { border: `2px solid ${C2.teal}`, boxShadow: `0 0 0 2px ${C2.teal}` } : null),
    ...style,
  };
  // An interactive card is a <button>, which only allows phrasing content:
  // its wrappers are spans, and its children must be spans too.
  const W = interactive ? 'span' : 'div';
  const body = (
    <>
      {media && <W style={{ display: 'block', lineHeight: 0 }}>{media}</W>}
      <W style={{ padding, display: 'block' }}>{children}</W>
    </>
  );
  if (interactive) {
    return (
      <Pressable ref={ref} onClick={onClick} href={href} external={external}
        className={`ds-row-link ${className}`.trim()} style={{ ...base, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', cursor: 'pointer', margin: 0 }} {...rest}>
        {body}
      </Pressable>
    );
  }
  return <As ref={ref} className={className} style={base} {...rest}>{body}</As>;
});

export { Card };
