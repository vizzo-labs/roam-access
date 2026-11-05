'use client';

import React from 'react';
import { C2, F2 } from './palette';

function V2Logo({ size = 18, fill, slashFill }) {
  return (
    <svg width={size * 4.18} height={size} viewBox="0 0 920 220" role="img" aria-label="Roam Access" focusable="false">
      <title>Roam Access</title>
      <g transform="translate(110,150)">
        <text fontFamily={F2} fontWeight="700" fontSize="110" fill={fill || C2.teal} letterSpacing="-5" x="0" y="0">roam</text>
        <text fontFamily={F2} fontWeight="700" fontSize="110" fill={slashFill || C2.rust} x="293" y="0">/</text>
        <text fontFamily={F2} fontWeight="700" fontSize="110" fill={fill || C2.teal} letterSpacing="-5" x="338" y="0">access</text>
      </g>
    </svg>
  );
}

export { V2Logo };
