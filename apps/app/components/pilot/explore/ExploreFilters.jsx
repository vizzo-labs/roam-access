'use client';

import React from 'react';
import { ChipGroup, FilterChip } from '../ds';
import { CATEGORY_CHIPS, tileOn, toggleTile } from './filters';

// The filter chips under the search bar: "Works for me", "Hide barriers",
// then the categories. One tap each; every chip is a real toggle button.
// `counts` = verdict counts of the current search (before these filters).
function ExploreFilters({ app, counts, bleed = true, style }) {
  const f = app.filters;
  const q = app.query || { cats: [], tags: [], label: 'All places', raw: '' };
  return (
    <ChipGroup label="Filter places" bleed={bleed} style={style}>
      <FilterChip selected={f.works} count={counts?.works} icon="success"
        onChange={on => app.setFilters({ works: on })}>Works for me</FilterChip>
      {!f.works && (
        <FilterChip selected={f.hideBarriers} onChange={on => app.setFilters({ hideBarriers: on })}>Hide barriers</FilterChip>
      )}
      {CATEGORY_CHIPS.map(t => (
        <FilterChip key={t.id} selected={tileOn(q, t)} onChange={on => app.setQuery(toggleTile(q, t, on))}>{t.label}</FilterChip>
      ))}
    </ChipGroup>
  );
}

export { ExploreFilters };
