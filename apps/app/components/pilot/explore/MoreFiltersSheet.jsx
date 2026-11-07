'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, CheckRow, SPACE, Sheet, TYPE } from '../ds';
import { useT } from '../i18n';
import { badgeText } from '../layers/layerUtils';
import { CLEAR_FILTERS, applyFilters } from './filters';

// "More filters" (a dialog): the filters that used to crowd the results as
// chips. Real checkboxes; the footer says how many places are left. Filters
// only narrow the list — never a verdict, and partner badges never move a
// place up (they only narrow too).
function MoreFiltersSheet({ open, onClose, app, counts, searched, badgeFilter }) {
  const t = useT();
  const f = app.filters;
  const sensory = (counts?.sensory ?? 0) > 0 || f.quietNow || f.quietTimes;
  const left = searched ? (badgeFilter ? badgeFilter.apply(applyFilters(searched, f)) : applyFilters(searched, f)).length : null;
  const anyOn = !!(f.hideBarriers || f.quietNow || f.quietTimes || badgeFilter?.on.length);
  return (
    <Sheet open={open} onClose={onClose} title={t('find.filters.more')} position="fixed"
      footer={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
          <Button full size="lg" onClick={onClose}>{left == null ? t('common.done') : t('find.more.show', { count: left })}</Button>
          {anyOn && (
            <Button full variant="ghost" onClick={() => { app.setFilters({ ...CLEAR_FILTERS, works: f.works }); badgeFilter?.on.forEach(id => badgeFilter.set(id, false)); }}>
              {t('explore.clearFilters')}
            </Button>
          )}
        </div>
      )}>
      <p style={{ ...TYPE.callout, color: C2.char, margin: `0 0 ${SPACE.md}px` }}>{t('find.more.lead')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
        <CheckRow checked={f.hideBarriers || f.works} disabled={f.works} onChange={on => app.setFilters({ hideBarriers: on })}
          label={t('find.more.hideBarriers')}/>
        {sensory && (
          <CheckRow checked={f.quietNow} onChange={on => app.setFilters({ quietNow: on })}
            label={t('explore.filters.quietNow')}/>
        )}
        {sensory && (
          <CheckRow checked={f.quietTimes} onChange={on => app.setFilters({ quietTimes: on })}
            label={t('explore.filters.quietTimes')}/>
        )}
      </div>
      {badgeFilter?.present.length > 0 && (
        <fieldset style={{ border: 0, margin: `${SPACE.lg}px 0 0`, padding: 0, minWidth: 0 }}>
          <legend style={{ ...TYPE.headline, padding: 0, marginBottom: SPACE.xs }}>
            {t('layers.badges.filterTitle')} <span style={{ ...TYPE.footnote, color: C2.slate }}>{t('layers.badges.filterNote')}</span>
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
            {badgeFilter.present.map(b => (
              <CheckRow key={b.id} checked={badgeFilter.on.includes(b.id)} onChange={on => badgeFilter.set(b.id, on)}
                label={badgeText(t, b.id, 'short')}/>
            ))}
          </div>
        </fieldset>
      )}
    </Sheet>
  );
}

export { MoreFiltersSheet };
