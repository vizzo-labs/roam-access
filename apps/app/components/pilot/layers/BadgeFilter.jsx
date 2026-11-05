'use client';
// Results: narrow the list to places in a partner program. Filtering keeps
// the verdict order exactly as it was — a badge never moves a place up.

import React from 'react';
import { BADGES } from '@/lib/layers/defs';
import { C2 } from '../ui/palette';
import { ChipGroup, FilterChip, SPACE, TYPE } from '../ds';

export function useBadgeFilter(app) {
  const [on, setOn] = React.useState([]);
  const present = BADGES.filter(b => Object.values(app.layers.badges).some(list => list.some(x => x.badge === b.id)));
  const apply = list => (on.length ? list.filter(v => on.every(id => app.layers.badgesFor(v.id).some(x => x.badge === id))) : list);
  const set = (id, sel) => setOn(xs => (sel ? [...xs, id] : xs.filter(x => x !== id)));
  return { on, present, apply, set };
}

export function BadgeFilter({ filter }) {
  if (!filter.present.length) return null;
  return (
    <div style={{ margin: `0 0 ${SPACE.md}px` }}>
      <p style={{ ...TYPE.footnote, fontWeight: 700, color: C2.char, margin: '0 0 6px' }}>
        Partner programs <span style={{ fontWeight: 400, color: C2.slate }}>— the partner’s claim; doesn’t change verdicts</span>
      </p>
      <ChipGroup label="Filter by partner program" wrap>
        {filter.present.map(b => (
          <FilterChip key={b.id} selected={filter.on.includes(b.id)} onChange={sel => filter.set(b.id, sel)}>{b.short}</FilterChip>
        ))}
      </ChipGroup>
    </div>
  );
}
