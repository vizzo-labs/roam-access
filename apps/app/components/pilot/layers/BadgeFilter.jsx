'use client';
// Results: narrow the list to places in a partner program. Filtering keeps
// the verdict order exactly as it was — a badge never moves a place up.

import React from 'react';
import { BADGES } from '@/lib/layers/defs';
import { C2, F2 } from '../ui/palette';
import { Chip } from './bits';

export function useBadgeFilter(app) {
  const [on, setOn] = React.useState([]);
  const present = BADGES.filter(b => Object.values(app.layers.badges).some(list => list.some(x => x.badge === b.id)));
  const apply = list => (on.length ? list.filter(v => on.every(id => app.layers.badgesFor(v.id).some(x => x.badge === id))) : list);
  const toggle = id => setOn(xs => (xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]));
  return { on, present, apply, toggle };
}

export function BadgeFilter({ filter }) {
  if (!filter.present.length) return null;
  return (
    <div role="group" aria-labelledby="badge-filter-h" style={{ margin: '0 0 16px', fontFamily: F2 }}>
      <p id="badge-filter-h" style={{ fontSize: 14, fontWeight: 700, color: C2.char, margin: '0 0 6px' }}>
        Partner programs <span style={{ fontWeight: 500, color: C2.slate }}>— the partner’s claim; doesn’t change verdicts</span>
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filter.present.map(b => <Chip key={b.id} on={filter.on.includes(b.id)} onClick={() => filter.toggle(b.id)}>{b.short}</Chip>)}
      </div>
    </div>
  );
}
