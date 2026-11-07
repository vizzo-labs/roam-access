'use client';

import React from 'react';
import { C2_BASE, M2 } from './palette';
import { useT } from '../i18n/I18nProvider';

// Verdict — THE core pattern. One clear answer: icon + colour + words.
// `label` here is the English fallback; the pill shows data.verdict.* (#21).
const V2_VERDICT_META = {
  works:   { bg: C2_BASE.blueBg,  fg: C2_BASE.blue,  icon: '✓', label: 'Works for you' },
  check:   { bg: C2_BASE.amberBg, fg: C2_BASE.amber, icon: '!', label: 'Check first' },
  barrier: { bg: C2_BASE.redBg,   fg: C2_BASE.red,   icon: '✗', label: 'Has barriers' },
  unknown: { bg: '#E7EAEF',       fg: '#475569',     icon: '?', label: 'No info yet' }, // 6.28:1
};

// The pill wraps its words (never "Works for y…") at large text sizes; the
// glyph keeps its size and stays beside the first line.
function V2Verdict({ kind, big = false, label = null }) {
  const t = useT();
  const k = V2_VERDICT_META[kind] ? kind : 'check';
  const s = V2_VERDICT_META[k];
  const glyph = big ? 32 : 24;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: big ? 10 : 8, maxWidth: '100%', boxSizing: 'border-box',
      background: s.bg, color: s.fg, fontWeight: 700, whiteSpace: 'normal', lineHeight: 1.25,
      fontSize: big ? 19 : 15, padding: big ? '8px 18px 8px 8px' : '5px 13px 5px 5px',
      borderRadius: big ? 28 : 18, letterSpacing: '-0.01em', flexShrink: 0,
    }}>
      <span aria-hidden="true" style={{
        width: glyph, height: glyph, minWidth: glyph, borderRadius: 999, flexShrink: 0,
        background: s.fg, color: s.bg, fontFamily: M2, fontWeight: 800,
        fontSize: big ? 17 : 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{s.icon}</span>
      <span style={{ minWidth: 0 }}>{label || t(`data.verdict.${k}`)}</span>
    </span>
  );
}

export { V2_VERDICT_META, V2Verdict };
