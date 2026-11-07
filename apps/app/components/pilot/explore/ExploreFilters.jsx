'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { ChipGroup, FilterChip, Icon, RADIUS, TARGET } from '../ds';
import { useT } from '../i18n';
import { MoreFiltersSheet } from './MoreFiltersSheet';

// The chips above the results: "Works for me (n)" (hidden while no place
// works for this person), "Nearest first", and "More filters" (a dialog with
// the rest). They wrap, so none is ever cut off. Filters only narrow or
// re-order by the person's own choice; they never change a verdict.
// `counts` = verdict counts of the current search (before these filters);
// `searched` = that search's places, so the dialog can say how many are left.
function ExploreFilters({ app, counts, searched, badgeFilter, style }) {
  const t = useT();
  const f = app.filters;
  const [open, setOpen] = React.useState(false);
  const more = [f.hideBarriers, f.quietNow, f.quietTimes].filter(Boolean).length + (badgeFilter?.on.length || 0);
  const nearest = on => {
    app.setFilters({ sort: on ? 'near' : 'match' });
    if (on && !app.origin.mine) app.locateMe();
  };
  return (
    <>
      <ChipGroup label={t('explore.filters.label')} wrap style={style}>
        {(counts?.works > 0 || f.works) && (
          <FilterChip selected={f.works} count={counts?.works} onChange={on => app.setFilters({ works: on })}>{t('explore.filters.works')}</FilterChip>
        )}
        <FilterChip selected={f.sort === 'near'} onChange={nearest}>{t('find.filters.nearest')}</FilterChip>
        <button type="button" className="ds-press" aria-haspopup="dialog" onClick={() => setOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: TARGET.min, maxWidth: '100%', boxSizing: 'border-box',
          padding: '6px 16px', borderRadius: RADIUS.pill, border: `1.5px solid ${more ? C2.teal : C2.line}`,
          background: more ? C2.tealSoft : C2.paper, color: more ? C2.teal : C2.char, cursor: 'pointer',
          fontFamily: F2, fontSize: 15, fontWeight: 600, lineHeight: 1.2, textAlign: 'left',
        }}>
          <Icon name="sliders" size={18}/>
          <span>{t('find.filters.more')}</span>
          {more > 0 && (
            <span style={{ minWidth: 22, padding: '1px 7px', borderRadius: RADIUS.pill, fontSize: 13, fontWeight: 700, textAlign: 'center', background: C2.teal, color: C2.paper, flexShrink: 0 }}>
              <span className="ra-sr-only">, {t('find.filters.moreOn', { count: more })}</span><span aria-hidden="true">{more}</span>
            </span>
          )}
        </button>
      </ChipGroup>
      <MoreFiltersSheet open={open} onClose={() => setOpen(false)} app={app} counts={counts} searched={searched} badgeFilter={badgeFilter}/>
    </>
  );
}

export { ExploreFilters };
