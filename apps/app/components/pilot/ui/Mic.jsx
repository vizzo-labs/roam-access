'use client';

import React from 'react';
import { C2 } from './palette';

function V2Mic({ size = 28, color = C2.paper }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="2"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export { V2Mic };
