'use client';

import React from 'react';
import { C2_BASE, M2 } from './palette';

// Verdict — THE core pattern. One clear answer: icon + colour + words.
const V2_VERDICT_META = {
  works:   { bg: C2_BASE.blueBg,  fg: C2_BASE.blue,  icon: '✓', label: 'Works for you' },
  check:   { bg: C2_BASE.amberBg, fg: C2_BASE.amber, icon: '!', label: 'Check first' },
  barrier: { bg: C2_BASE.redBg,   fg: C2_BASE.red,   icon: '✗', label: 'Has barriers' },
  unknown: { bg: '#E7EAEF',       fg: '#475569',     icon: '?', label: 'No info yet' }, // 6.28:1
};

function V2Verdict({ kind, big = false, label = null }) {
  const s = V2_VERDICT_META[kind] || V2_VERDICT_META.check;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: big ? 10 : 7,
      background: s.bg, color: s.fg, fontWeight: 700, whiteSpace: 'nowrap',
      fontSize: big ? 17 : 13.5, padding: big ? '10px 16px' : '6px 12px',
      borderRadius: 999, letterSpacing: '-0.01em', flexShrink: 0,
    }}>
      <span aria-hidden="true" style={{
        width: big ? 24 : 18, height: big ? 24 : 18, borderRadius: 999,
        background: s.fg, color: s.bg, fontFamily: M2, fontWeight: 800,
        fontSize: big ? 13 : 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{s.icon}</span>
      {label || s.label}
    </span>
  );
}

export { V2_VERDICT_META, V2Verdict };
