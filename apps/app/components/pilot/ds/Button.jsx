'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2 } from '../ui/palette';
import { Icon } from './Icon';
import { RADIUS, TARGET, transition } from './tokens';

// A link when it navigates (href), a button when it acts (onClick). External
// links open in a new tab and say so to screen readers.
const Pressable = React.forwardRef(function Pressable(
  { href, external = false, onClick, disabled, type = 'button', className = '', children, ...rest }, ref,
) {
  const t = useT();
  const cls = `ds-press ${className}`.trim();
  if (href && !disabled) {
    return (
      <a ref={ref} href={href} onClick={onClick} className={cls}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
        {children}
        {external && <span className="ra-sr-only"> {t('common.opensNewTab')}</span>}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} onClick={onClick} disabled={disabled} className={cls} {...rest}>
      {children}
    </button>
  );
});

// Labels wrap (never clip) at large text sizes: the vertical padding keeps a
// two-line label inside the button; short labels stay one line at 100 %.
const SIZES = {
  sm: { minHeight: TARGET.min, padding: '6px 14px', fontSize: 15, gap: 6, radius: RADIUS.md, icon: 18 },
  md: { minHeight: TARGET.std + 4, padding: '8px 18px', fontSize: 16.5, gap: 8, radius: RADIUS.md, icon: 20 },
  lg: { minHeight: TARGET.xl, padding: '10px 22px', fontSize: 18, gap: 10, radius: RADIUS.lg - 2, icon: 22 },
};

function variantStyle(variant) {
  switch (variant) {
    case 'secondary': return { background: C2.tealSoft, color: C2.teal, border: `1.5px solid ${C2.teal}` };
    case 'outline':   return { background: C2.paper, color: C2.teal, border: `2px solid ${C2.teal}` };
    case 'ghost':     return { background: 'transparent', color: C2.char, border: `1.5px solid ${C2.line}` };
    case 'plain':     return { background: 'transparent', color: C2.teal, border: '1.5px solid transparent', textDecoration: 'underline', textUnderlineOffset: 3 };
    case 'danger':    return { background: C2.paper, color: C2.red, border: `2px solid ${C2.red}` };
    case 'rust':      return { background: C2.rust, color: C2.paper, border: 0 };
    default:          return { background: C2.teal, color: C2.paper, border: 0 };
  }
}

// Button — primary | secondary | outline | ghost | plain | danger | rust; sm 44 · md 52 · lg 60.
// The label wraps to a second line at large text sizes instead of clipping.
const Button = React.forwardRef(function Button({
  children, variant = 'primary', size = 'md', icon, iconRight, full = false,
  href, external, onClick, disabled = false, type, style, ...rest
}, ref) {
  const s = SIZES[size] || SIZES.md;
  const off = disabled ? { background: C2.stone, color: C2.slate, border: `1.5px solid ${C2.stone}`, textDecoration: 'none' } : null;
  return (
    <Pressable ref={ref} href={href} external={external} onClick={onClick} disabled={disabled} type={type}
      className="ds-btn" style={{
        display: full ? 'flex' : 'inline-flex', width: full ? '100%' : undefined,
        alignItems: 'center', justifyContent: 'center', gap: s.gap, boxSizing: 'border-box',
        minHeight: s.minHeight, padding: s.padding, borderRadius: s.radius,
        fontFamily: F2, fontWeight: 700, fontSize: s.fontSize, letterSpacing: '-0.01em', lineHeight: 1.25,
        whiteSpace: 'normal', overflowWrap: 'break-word', maxWidth: '100%',
        textAlign: 'center', textDecoration: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: transition(['background-color', 'border-color', 'color'], 'fast'),
        ...variantStyle(variant), ...off, ...style,
      }} {...rest}>
      {icon && <span className={children ? 'ds-btn-icon' : undefined} style={{ display: 'inline-flex' }}><Icon name={icon} size={s.icon}/></span>}
      {children}
      {iconRight && <span className={children ? 'ds-btn-icon' : undefined} style={{ display: 'inline-flex' }}><Icon name={iconRight} size={s.icon}/></span>}
    </Pressable>
  );
});

export { Button, Pressable };
