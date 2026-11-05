'use client';

import React from 'react';
import { ChipGroup, FilterChip } from '../ds';
import { useT } from '../i18n';
import { tileLabel } from '@/lib/i18n/data';
import { CATEGORY_CHIPS, tileOn, toggleTile } from './filters';

// The filter chips under the search bar: "Works for me", "Hide barriers",
// "Quiet now" / "Has quiet times" (once anyone has reported sensory details),
// then the categories. One tap each; every chip is a real toggle button.
// `counts` = verdict counts of the current search (before these filters).
function ExploreFilters({ app, counts, bleed = true, style }) {
  const t = useT();
  const f = app.filters;
  const q = app.query || { cats: [], tags: [], label: 'All places', raw: '' };
  const sensory = (counts?.sensory ?? 0) > 0 || f.quietNow || f.quietTimes;
  return (
    <ChipGroup label={t('explore.filters.label')} bleed={bleed} style={style}>
      <FilterChip selected={f.works} count={counts?.works} icon="success"
        onChange={on => app.setFilters({ works: on })}>{t('explore.filters.works')}</FilterChip>
      {!f.works && (
        <FilterChip selected={f.hideBarriers} onChange={on => app.setFilters({ hideBarriers: on })}>{t('explore.filters.hideBarriers')}</FilterChip>
      )}
      {sensory && (
        <FilterChip selected={f.quietNow} count={counts?.quietNow} icon="clock"
          onChange={on => app.setFilters({ quietNow: on })}>{t('explore.filters.quietNow')}</FilterChip>
      )}
      {sensory && (
        <FilterChip selected={f.quietTimes} count={counts?.quietTimes}
          onChange={on => app.setFilters({ quietTimes: on })}>{t('explore.filters.quietTimes')}</FilterChip>
      )}
      {CATEGORY_CHIPS.map(c => (
        <FilterChip key={c.id} selected={tileOn(q, c)} onChange={on => app.setQuery(toggleTile(q, c, on))}>{tileLabel(t, c.id)}</FilterChip>
      ))}
    </ChipGroup>
  );
}

export { ExploreFilters };
