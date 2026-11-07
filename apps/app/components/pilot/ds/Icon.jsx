'use client';

import React from 'react';

// Stroke icons on a 24px grid, drawn in currentColor. ALWAYS decorative: the
// control or text next to an icon carries the meaning (aria-hidden here).
const PATHS = {
  search:   ['M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z', 'm20 20-4.2-4.2'],
  mic:      ['M12 3.5a3 3 0 0 0-3 3V12a3 3 0 0 0 6 0V6.5a3 3 0 0 0-3-3Z', 'M6 11.5a6 6 0 0 0 12 0', 'M12 17.5V21'],
  back:     ['M15 5l-7 7 7 7'],
  forward:  ['M9 5l7 7-7 7'],
  down:     ['M5 9l7 7 7-7'],
  up:       ['M5 15l7-7 7 7'],
  close:    ['M6 6l12 12', 'M18 6 6 18'],
  check:    ['M5 12.5l4.5 4.5L19 7.5'],
  plus:     ['M12 5v14', 'M5 12h14'],
  info:     ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5.5', 'M12 7.6v.1'],
  warn:     ['M12 3.8 2.8 19.5h18.4L12 3.8Z', 'M12 10v4.5', 'M12 17.2v.1'],
  error:    ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm9 9 6 6', 'm15 9-6 6'],
  success:  ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm8 12.3 2.8 2.8L16.2 9.6'],
  question: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5', 'M12 16.6v.1'],
  directions: ['M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'],
  pin:      ['M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'],
  phone:    ['M5 4.5h3.2l1.6 4-2 1.3a10.5 10.5 0 0 0 6.4 6.4l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z'],
  globe:    ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M3 12h18', 'M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z'],
  bookmark: ['M6 4h12v17l-6-4-6 4V4Z'],
  share:    ['M12 15V3.5', 'm7.5 8 4.5-4.5L16.5 8', 'M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5'],
  map:      ['M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2Z', 'M9 4.5v13', 'M15 6.5v13'],
  list:     ['M8.5 6.5H20', 'M8.5 12H20', 'M8.5 17.5H20', 'M4 6.5h.1', 'M4 12h.1', 'M4 17.5h.1'],
  filter:   ['M4 6.5h16', 'M7 12h10', 'M10 17.5h4'],
  sliders:  ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', 'M15 4.5v5', 'M9 14.5v5'],
  clock:    ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7.5V12l3 2'],
  camera:   ['M4 8h3l1.6-2.5h6.8L17 8h3v11H4V8Z', 'M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z'],
  locate:   ['M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z', 'M12 2.5v3', 'M12 18.5v3', 'M2.5 12h3', 'M18.5 12h3', 'M12 13.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z'],
  user:     ['M12 11a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 12 11Z', 'M4.5 20c1.5-3.5 4.5-5 7.5-5s6 1.5 7.5 5'],
  users:    ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M3 19.5c1-3 3.3-4.5 6-4.5s5 1.5 6 4.5', 'M15.5 5.3a3 3 0 0 1 0 5.4', 'M17.5 15.3c1.6.6 2.8 2 3.5 4.2'],
  home:     ['M4 11.5 12 4l8 7.5', 'M6 10v9h12v-9'],
  refresh:  ['M19.5 12a7.5 7.5 0 1 1-2.2-5.3', 'M19.5 4.5v4h-4'],
  offline:  ['M3 3l18 18', 'M8.5 16.2a5 5 0 0 1 6.3-.6', 'M5 12.6a10 10 0 0 1 4.1-2.3', 'M14.3 10.1A10 10 0 0 1 19 12.6', 'M2 9.2a14.5 14.5 0 0 1 4.3-2.6', 'M10.7 5.5A14.5 14.5 0 0 1 22 9.2', 'M12 20h.1'],
  external: ['M14 4.5h5.5V10', 'M19.5 4.5 11 13', 'M17 14v5.5H4.5V7H10'],
  edit:     ['M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z', 'm13.5 6.5 4 4'],
  flag:     ['M5 21V4.5', 'M5 4.5h12l-2.5 4 2.5 4H5'],
  heart:    ['M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z'],
  star:     ['m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8L12 3.8Z'],
  sparkle:  ['M12 3.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5Z', 'M18.5 16v4', 'M16.5 18h4'],
  more:     ['M5.5 12h.1', 'M12 12h.1', 'M18.5 12h.1'],
  a11y:     ['M12 6.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z', 'M5 8.5c2.3.7 4.6 1 7 1s4.7-.3 7-1', 'M12 9.5v4.5', 'm8.5 21 3.5-7 3.5 7'],
  speaker:  ['M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z', 'M15.5 9a4 4 0 0 1 0 6', 'M18 6.5a7.5 7.5 0 0 1 0 11'],
  stop:     ['M7 7h10v10H7z'],
  language: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M3.5 9h17', 'M3.5 15h17', 'M12 3c-2.4 2.6-3.6 5.6-3.6 9s1.2 6.4 3.6 9', 'M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9'],
};

const ICON_NAMES = Object.keys(PATHS);

// Filled variants where "on" is a fill (e.g. a saved bookmark). The state is
// still carried by aria-pressed / text — the fill only reinforces it.
const FILLED = new Set(['bookmark', 'star']);

function Icon({ name, size = 20, strokeWidth = 2, filled = false, color = 'currentColor', style }) {
  const d = PATHS[name];
  if (!d) return null;
  const dots = name === 'more' || name === 'list';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
      style={{ flexShrink: 0, display: 'block', ...style }}>
      {d.map((p, i) => (
        <path key={i} d={p} stroke={color} strokeWidth={dots && /h\.1$/.test(p) ? strokeWidth * 1.6 : strokeWidth}
          strokeLinecap="round" strokeLinejoin="round"
          fill={filled && FILLED.has(name) && i === 0 ? color : 'none'}/>
      ))}
    </svg>
  );
}

export { Icon, ICON_NAMES };
