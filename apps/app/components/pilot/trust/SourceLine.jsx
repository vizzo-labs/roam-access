'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';

// Source + confidence line under a verdict or a fact: who said it and how
// recently. Icon (aria-hidden) + words — the words carry the meaning.
//   community → people icon · osm/venue → "unconfirmed" outline icon
function SourceIcon({ src, size }) {
  const c = C2.slate;
  if (src === 'community') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="9" cy="8" r="3.2" stroke={c} strokeWidth="2"/>
        <path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" stroke={c} strokeWidth="2" strokeLinecap="round"/>
        <path d="M15.5 5.2a3 3 0 0 1 0 5.6M18 14.4c1.4.7 2.5 2.3 3 4.6" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (src === 'none') return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" strokeDasharray="3 2.6"/>
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.3M12 16.6v.1" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function SourceLine({ text, src = 'community', compact = false, as = 'p', style = {} }) {
  const Tag = as;
  const size = compact ? 14 : 16;
  return (
    <Tag style={{
      display: 'flex', alignItems: 'flex-start', gap: 6, margin: 0,
      fontFamily: F2, fontSize: compact ? 13.5 : 14, lineHeight: 1.4, color: C2.slate, fontWeight: 500,
      ...style,
    }}>
      <SourceIcon src={src} size={size}/>
      <span>{text}</span>
    </Tag>
  );
}

export { SourceLine, SourceIcon };
