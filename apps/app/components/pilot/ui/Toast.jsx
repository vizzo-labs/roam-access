'use client';

import React from 'react';
import { C2, F2 } from './palette';

// Toast — live region always mounted, only the text swaps.
function V2Toast({ message }) {
  return (
    <div role="status" aria-live="polite" style={{
      position: 'absolute', left: '50%', bottom: 'calc(var(--ra-tabs-pad) + 76px)',
      transform: 'translateX(-50%)', zIndex: 200, width: 'max-content', maxWidth: '86%',
      pointerEvents: 'none',
    }}>
      {message && (
        <div style={{
          background: C2.char, color: C2.paper, padding: '12px 18px',
          borderRadius: 999, fontSize: 14, fontWeight: 600, fontFamily: F2,
          boxShadow: '0 6px 20px rgba(26,26,26,0.28)', textAlign: 'center', lineHeight: 1.35,
        }}>{message}</div>
      )}
    </div>
  );
}

export { V2Toast };
