'use client';

import React from 'react';
import { C2 } from './palette';

// Category tile icons (from the design).
function V2TileIcon({ id, size = 26 }) {
  const p = { stroke: C2.teal, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const paths = {
    food:  <path d="M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.5 1-2.5 3-2.5 6v3h3v9" {...p}/>,
    parks: <path d="M12 3 6 12h4l-4 7h12l-4-7h4L12 3ZM12 19v2" {...p}/>,
    arts:  <path d="M4 10 12 4l8 6M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16" {...p}/>,
    music: <path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" {...p}/>,
    stay:  <path d="M3 6v13M3 14h18M21 19v-5a3 3 0 0 0-3-3h-8v3M6.5 11.5a1.5 1.5 0 1 0 0-.01" {...p}/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[id]}</svg>;
}

export { V2TileIcon };
