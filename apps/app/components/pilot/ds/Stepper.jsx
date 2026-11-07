'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { SPACE } from './tokens';

// Stepper — progress through a short flow (review: 3 steps, set-up: 2): one
// 8px segment per step, filled up to the current one. Decorative: pair it
// with a visible or sr-only "Step n of m" (and announce it when it changes).
//   <Stepper step={2} total={3}/>
function Stepper({ step, total, style }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: 6, margin: `${SPACE.xs}px 0`, ...style }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < step ? C2.teal : C2.stone, boxShadow: i < step ? 'none' : `inset 0 0 0 1px ${C2.line}` }}/>
      ))}
    </div>
  );
}

export { Stepper };
