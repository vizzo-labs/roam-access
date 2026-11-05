'use client';

import React from 'react';
import { C2, F2 } from './palette';

function V2BigBtn({ children, kind = 'primary', onClick, style = {}, disabled = false, type = 'button', ariaLabel, ariaDescribedBy }) {
  const kinds = {
    primary: { background: C2.teal, color: C2.paper, border: 0 },
    rust:    { background: C2.rust, color: C2.paper, border: 0 },
    outline: { background: C2.paper, color: C2.teal, border: `2.5px solid ${C2.teal}` },
    ghost:   { background: C2.paper, color: C2.char, border: `1.5px solid ${C2.line}` },
  };
  const off = disabled ? { background: C2.stone, color: C2.slate, border: 0 } : null;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      aria-label={ariaLabel} aria-describedby={ariaDescribedBy}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', minHeight: 60, borderRadius: 16,
        fontFamily: F2, fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...kinds[kind], ...off, ...style,
      }}>{children}</button>
  );
}

// Round icon button (back, save) — 48px circle.
function V2RoundBtn({ children, onClick, ariaLabel, pressed, style = {} }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel} aria-pressed={pressed}
      style={{
        width: 48, height: 48, borderRadius: 999, border: `1.5px solid ${C2.line}`,
        background: C2.paper, cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}>{children}</button>
  );
}

function V2Back({ app, to = 'home', id = null, label = 'Back' }) {
  return (
    <V2RoundBtn onClick={() => app.goto(to, id)} ariaLabel={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </V2RoundBtn>
  );
}

export { V2BigBtn, V2RoundBtn, V2Back };
