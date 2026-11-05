'use client';
// Design tokens for the pilot UI. Built on the LIVE palette C2 (ui/palette):
// everything colour-related is a function or is read at render time, so the
// "Higher contrast" setting (which swaps C2 values in place) keeps working.
//
//   import { TYPE, SPACE, RADIUS, TARGET, elevation, tone, DURATION } from '../ds';
//
// Contrast (WCAG 2.2 AA) — every text pair here is ≥ 4.5:1 on its background,
// every boundary of an operable thing ≥ 3:1. The /ds page shows the live table.

import React from 'react';
import { C2, C2_HIGH, F2, M2, RA2_INPUT_FONT } from '../ui/palette';
import './ds.css';

// ── Type scale ────────────────────────────────────────────────────────────
// px values; the in-app text size setting scales everything via CSS zoom.
// Nothing smaller than 13px; inputs are 16px (RA2_INPUT_FONT) so iOS won't zoom.
const TYPE = {
  display:  { fontFamily: F2, fontSize: 34, lineHeight: 1.08, fontWeight: 700, letterSpacing: '-0.03em' },
  title1:   { fontFamily: F2, fontSize: 28, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.025em' },
  title2:   { fontFamily: F2, fontSize: 22, lineHeight: 1.2,  fontWeight: 700, letterSpacing: '-0.02em' },
  title3:   { fontFamily: F2, fontSize: 18, lineHeight: 1.3,  fontWeight: 700, letterSpacing: '-0.015em' },
  headline: { fontFamily: F2, fontSize: 16.5, lineHeight: 1.35, fontWeight: 700, letterSpacing: '-0.01em' },
  body:     { fontFamily: F2, fontSize: 16, lineHeight: 1.5,  fontWeight: 400 },
  callout:  { fontFamily: F2, fontSize: 15, lineHeight: 1.45, fontWeight: 400 },
  footnote: { fontFamily: F2, fontSize: 14, lineHeight: 1.4,  fontWeight: 400 },
  caption:  { fontFamily: F2, fontSize: 13, lineHeight: 1.35, fontWeight: 600 },
  label:    { fontFamily: F2, fontSize: 15, lineHeight: 1.2,  fontWeight: 600 },
  overline: { fontFamily: M2, fontSize: 11.5, lineHeight: 1.3, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' },
  input:    { fontFamily: F2, fontSize: RA2_INPUT_FONT, lineHeight: 1.4 },
};

// ── Spacing (4-based) ─────────────────────────────────────────────────────
const SPACE = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 };
const GUTTER = 22; // side padding of every phone screen

// ── Radii ─────────────────────────────────────────────────────────────────
const RADIUS = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

// ── Target sizes (WCAG 2.5.8 needs 24; we hold ourselves to 44+) ─────────
const TARGET = { min: 44, std: 48, lg: 56, xl: 60 };

// ── Colour helpers (read C2 at call time) ────────────────────────────────
const isHighContrast = () => C2.line === C2_HIGH.line;

// Tones for Badge, Banner, Chip … fg on bg is ≥ 5.2:1 in every tone.
// `edge` is a boundary colour (≥ 3:1 on paper) for outlined variants.
function tone(name = 'neutral') {
  switch (name) {
    case 'teal':    return { fg: C2.teal,  bg: C2.tealSoft, edge: C2.teal };
    case 'info':    return { fg: C2.blue,  bg: C2.blueBg,   edge: C2.blue };
    case 'success': return { fg: C2.green, bg: C2.greenBg,  edge: C2.green };
    case 'warn':    return { fg: C2.amber, bg: C2.amberBg,  edge: C2.amber };
    case 'danger':  return { fg: C2.red,   bg: C2.redBg,    edge: C2.red };
    case 'inverse': return { fg: C2.paper, bg: C2.char,     edge: C2.char };
    case 'brand':   return { fg: C2.paper, bg: C2.teal,     edge: C2.teal };
    default:        return { fg: C2.char,  bg: C2.stone,    edge: C2.line };
  }
}
const TONES = ['neutral', 'teal', 'info', 'success', 'warn', 'danger'];

// ── Elevation ─────────────────────────────────────────────────────────────
// 0 flat · 1 card · 2 floating (sheet peek, map controls) · 3 overlay (dialog).
// In high contrast a shadow is not a boundary: it becomes a 2px border.
function elevation(level = 1) {
  if (level <= 0) return { boxShadow: 'none' };
  if (isHighContrast()) return { boxShadow: `0 0 0 2px ${C2.line}` };
  const s = {
    1: '0 1px 2px rgba(26,26,26,0.06), 0 2px 8px rgba(26,26,26,0.05)',
    2: '0 2px 6px rgba(26,26,26,0.08), 0 8px 24px rgba(26,26,26,0.10)',
    3: '0 6px 16px rgba(26,26,26,0.12), 0 18px 48px rgba(26,26,26,0.18)',
  }[Math.min(3, level)];
  return { boxShadow: s };
}

// Border for anything operable (≥ 3:1). Decorative dividers use C2.hair.
const edge = (width = 1.5) => `${width}px solid ${C2.line}`;
const divider = () => `1px solid ${C2.hair}`;

// ── Motion ────────────────────────────────────────────────────────────────
// CSS transitions are already cut to ~0 by globals.css when motion is reduced
// (OS setting or the in-app switch). Use these for JS-driven motion too.
const DURATION = { fast: 120, base: 200, slow: 300 };
const EASE = { standard: 'cubic-bezier(0.2, 0, 0, 1)', exit: 'cubic-bezier(0.3, 0, 1, 1)' };

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.dataset.raMotion === 'reduce') return true;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
const dur = (name = 'base') => (prefersReducedMotion() ? 0 : DURATION[name] ?? name);
const transition = (props = ['all'], name = 'base') =>
  props.map(p => `${p} ${DURATION[name] ?? name}ms ${EASE.standard}`).join(', ');

// Re-renders when the in-app switch or the OS setting changes.
function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const update = () => setReduced(prefersReducedMotion());
    update();
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    mq?.addEventListener?.('change', update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ra-motion'] });
    return () => { mq?.removeEventListener?.('change', update); mo.disconnect(); };
  }, []);
  return reduced;
}

// Scroll something into view without animating it for people who opted out.
function scrollIntoViewSafe(el, opts = {}) {
  if (!el) return;
  el.scrollIntoView({ block: 'nearest', ...opts, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

// ── Contrast maths (used by /ds to show the live table) ───────────────────
function luminance(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export {
  TYPE, SPACE, GUTTER, RADIUS, TARGET,
  tone, TONES, elevation, edge, divider, isHighContrast,
  DURATION, EASE, dur, transition, prefersReducedMotion, useReducedMotion, scrollIntoViewSafe,
  luminance, contrastRatio,
};
