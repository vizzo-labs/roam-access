'use client';
// Small shared pieces for the sensory components (#17).

import React from 'react';
import { C2 } from '../ui/palette';
import { FilterChip, SPACE, TYPE, divider } from '../ds';

// Line icons for noise / light / crowds / time (decorative; the words carry it).
const PATHS = {
  noise: ['M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z', 'M15.5 9a4 4 0 0 1 0 6', 'M18 6.5a7.5 7.5 0 0 1 0 11'],
  light: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M12 2.8v2', 'M12 19.2v2', 'M2.8 12h2', 'M19.2 12h2', 'm5.5 5.5 1.4 1.4', 'm17.1 17.1 1.4 1.4', 'm5.5 18.5 1.4-1.4', 'm17.1 6.9 1.4-1.4'],
  crowd: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M3 19.5c1-3 3.3-4.5 6-4.5s5 1.5 6 4.5', 'M15.5 5.3a3 3 0 0 1 0 5.4', 'M17.5 15.3c1.6.6 2.8 2 3.5 4.2'],
  time: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7.5V12l3 2'],
};

export function SensoryIcon({ name, size = 20, color = 'currentColor' }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      {d.map((p, i) => <path key={i} d={p} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>)}
    </svg>
  );
}

// One question with chip answers. Single choice by default (tap the chosen
// answer again to clear it); `multi` for "choose any" — then onChange gets
// an updater function (prev => next), as React's setState accepts.
export function ChoiceRow({ id, question, hint, options, value, onChange, multi = false, first = false }) {
  const isOn = o => (multi ? (value || []).includes(o.id) : value === o.id);
  // Multi: pass an updater so quick successive taps all count.
  const toggle = (o, sel) => {
    if (!multi) onChange(sel ? o.id : null);
    else onChange(prev => (sel ? [...new Set([...(prev || []), o.id])] : (prev || []).filter(x => x !== o.id)));
  };
  return (
    <div role="group" aria-labelledby={id} aria-describedby={hint ? `${id}-hint` : undefined}
      style={{ padding: `${SPACE.sm}px 0`, borderTop: first ? 0 : divider() }}>
      <p id={id} style={{ ...TYPE.label, fontSize: 15.5, lineHeight: 1.35, color: C2.char, margin: 0 }}>{question}</p>
      {hint && <p id={`${id}-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0' }}>{hint}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.xs }}>
        {options.map(o => (
          <FilterChip key={o.id} selected={isOn(o)} onChange={sel => toggle(o, sel)}>{o.label}</FilterChip>
        ))}
      </div>
    </div>
  );
}

// Re-render every minute so "20 minutes ago" and "quiet now" stay true.
export function useNow(everyMs = 60000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

export function minsAgo(at, now = Date.now()) {
  const m = Math.max(0, Math.round((now - +new Date(at)) / 60000));
  if (m < 2) return 'just now';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  return h === 1 ? '1 hour ago' : `${h} hours ago`;
}
