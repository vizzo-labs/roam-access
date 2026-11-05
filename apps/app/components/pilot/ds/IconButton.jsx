'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Icon } from './Icon';
import { Pressable } from './Button';
import { RADIUS, TARGET, elevation, transition } from './tokens';

const SIZE = { sm: TARGET.min, md: TARGET.std, lg: TARGET.lg };

function variantStyle(variant, pressed) {
  if (pressed) return { background: C2.tealSoft, color: C2.teal, border: `2px solid ${C2.teal}` };
  switch (variant) {
    case 'filled':  return { background: C2.teal, color: C2.paper, border: 0 };
    case 'tonal':   return { background: C2.stone, color: C2.char, border: '1.5px solid transparent' };
    case 'ghost':   return { background: 'transparent', color: C2.char, border: '1.5px solid transparent' };
    case 'onColor': return { background: 'rgba(250,249,246,0.14)', color: C2.paper, border: '1.5px solid rgba(250,249,246,0.6)' };
    case 'floating': return { background: C2.paper, color: C2.char, border: `1.5px solid ${C2.line}`, ...elevation(2) };
    default:        return { background: C2.paper, color: C2.char, border: `1.5px solid ${C2.line}` };
  }
}

// IconButton — an icon-only control. `label` is REQUIRED: it is the accessible
// name (and should name the thing: "Save Hugos", not just "Save").
// `pressed` makes it a toggle (aria-pressed) — e.g. save/unsave.
// Variants: outline (default) | filled | tonal | ghost | floating (over a map) | onColor (on teal).
const IconButton = React.forwardRef(function IconButton({
  icon, label, onClick, href, external, size = 'md', variant = 'outline', shape = 'circle',
  pressed, filledWhenPressed = true, disabled, iconSize, style, children, ...rest
}, ref) {
  if (process.env.NODE_ENV !== 'production' && !label) console.warn('[ds] IconButton needs a label');
  const px = SIZE[size] || SIZE.md;
  return (
    <Pressable ref={ref} href={href} external={external} onClick={onClick} disabled={disabled}
      aria-label={label} aria-pressed={typeof pressed === 'boolean' ? pressed : undefined}
      style={{
        width: px, height: px, minWidth: px, padding: 0, flexShrink: 0, boxSizing: 'border-box',
        borderRadius: shape === 'circle' ? RADIUS.pill : RADIUS.md,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer', textDecoration: 'none',
        transition: transition(['background-color', 'border-color', 'color'], 'fast'),
        ...variantStyle(variant, pressed), ...(disabled ? { opacity: 0.55 } : null), ...style,
      }} {...rest}>
      <Icon name={icon} size={iconSize || (size === 'lg' ? 24 : 20)} strokeWidth={2.1}
        filled={pressed && filledWhenPressed}/>
      {children}
    </Pressable>
  );
});

export { IconButton };
