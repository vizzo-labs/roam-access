'use client';

import React from 'react';
import { C2 } from './palette';

// Standalone switch — a real role="switch". Only used where it is NOT inside
// another control.
function V2Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      style={{
        width: 52, height: 32, borderRadius: 999, padding: 0, position: 'relative',
        background: checked ? C2.teal : C2.paper,
        border: `2px solid ${checked ? C2.teal : C2.line}`,
        cursor: 'pointer', flexShrink: 0, transition: 'background-color .15s, border-color .15s',
        boxSizing: 'border-box',
      }}>
      <span style={{
        position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: 999,
        background: checked ? C2.paper : C2.line,
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform .15s, background-color .15s',
      }}/>
    </button>
  );
}

export { V2Switch };
