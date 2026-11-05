'use client';
// Results (#17): narrow the list to places that are quiet now or have known
// quiet times. Filtering keeps the verdict order exactly as it was.

import React from 'react';
import { C2 } from '../ui/palette';
import { ChipGroup, FilterChip, SPACE, TYPE } from '../ds';
import { hasQuietTimes, isQuietNow } from '@/lib/sensory/summary';
import { useNow } from './bits';

const TESTS = { now: isQuietNow, times: (vm) => hasQuietTimes(vm) };

export function useQuietFilter() {
  const now = useNow();
  const [on, setOn] = React.useState([]);
  const test = (id, v) => (id === 'now' ? TESTS.now(v.sensory, now) : TESTS.times(v.sensory));
  const apply = list => (on.length ? list.filter(v => on.every(id => test(id, v))) : list);
  const count = (list, id) => list.filter(v => test(id, v)).length;
  const set = (id, sel) => setOn(xs => (sel ? [...xs, id] : xs.filter(x => x !== id)));
  return { on, apply, count, set };
}

export function QuietFilter({ filter, list }) {
  // Only offer it once someone has reported sensory details somewhere.
  if (!list.some(v => v.sensory) && !filter.on.length) return null;
  return (
    <div style={{ margin: `0 0 ${SPACE.md}px` }}>
      <p style={{ ...TYPE.footnote, fontWeight: 700, color: C2.char, margin: '0 0 6px' }}>
        Quiet times <span style={{ fontWeight: 400, color: C2.slate }}>— from people in the pilot; doesn’t change verdicts</span>
      </p>
      <ChipGroup label="Filter by quiet times" wrap>
        <FilterChip selected={filter.on.includes('now')} count={filter.count(list, 'now')} onChange={sel => filter.set('now', sel)}>Quiet now</FilterChip>
        <FilterChip selected={filter.on.includes('times')} count={filter.count(list, 'times')} onChange={sel => filter.set('times', sel)}>Has quiet times</FilterChip>
      </ChipGroup>
    </div>
  );
}
