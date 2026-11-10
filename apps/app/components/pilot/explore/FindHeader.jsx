'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, GUTTER, RemovableChip, SPACE, SearchField, SegmentedControl, TYPE } from '../ds';
import { useT } from '../i18n';
import { ra2ParseQuery } from '@/lib/pilot/match';
import { countsLine } from './filters';
import { ExploreFilters } from './ExploreFilters';
import { EnglishSearchNote } from './EnglishSearchNote';

// The top of Find when a search or category is on: Back (to Find), the
// search box with the words, then "24 places." (the screen's h1, focused on
// arrival), one summary line, the chips, and "Show as List · Map" on phones.
// `area` (after "Search this area"): a chip says the list is limited to the
// map area; removing it shows places everywhere again.
function FindHeader({ app, headingRef, queryLabel, initialText, total, counts, searched, badgeFilter, view = 'list', onView, area = null }) {
  const t = useT();
  const [text, setText] = React.useState(initialText);
  // A new search resets the box (adjusting state while rendering, so the
  // old words never flash).
  const [shownFor, setShownFor] = React.useState(initialText);
  if (shownFor !== initialText) { setShownFor(initialText); setText(initialText); }
  const line = searched.length ? countsLine(counts, t) : '';
  return (
    <div style={{ padding: `10px ${GUTTER}px 0` }}>
      <Button variant="plain" icon="back" onClick={() => app.goto('find')} aria-label={t('find.results.backLabel')}
        style={{ textDecoration: 'none', padding: '0 12px 0 4px', marginLeft: -4, minHeight: 48 }}>
        {t('find.results.back')}
      </Button>
      <SearchField id="results-search" label={t('find.search.label')} value={text} onChange={setText}
        dirty={text.trim() !== initialText.trim() && !!text.trim()}
        placeholder={t('find.search.placeholder')}
        onSubmit={words => app.runSearch(ra2ParseQuery(words))}
        onVoice={() => app.goto('voice')} style={{ marginTop: 4 }}/>
      <EnglishSearchNote/>

      <h1 ref={headingRef} tabIndex={-1} style={{ ...TYPE.title2, margin: `${SPACE.md}px 0 0`, color: C2.char }}>
        {t('common.places', { count: total })}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
        <span className="ra-sr-only"> {area ? t('find.results.srForArea', { query: queryLabel }) : t('find.results.srFor', { query: queryLabel })}</span>
      </h1>
      <p style={{ ...TYPE.footnote, color: C2.char, margin: '4px 0 0' }}>
        {line && <>{line}. </>}
        <span style={{ color: C2.slate }}>{t('find.walkingFrom', { origin: app.origin.name })}</span>
      </p>

      {area && (
        <RemovableChip onRemove={app.clearArea} removeLabel={t('find.area.clear')} style={{ marginTop: SPACE.sm }}>
          {t('find.area.chip')}
        </RemovableChip>
      )}

      <ExploreFilters app={app} counts={counts} searched={searched} badgeFilter={badgeFilter} style={{ marginTop: SPACE.sm }}/>

      {!app.wide && onView && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.xs, marginTop: SPACE.sm }}>
          <span aria-hidden="true" style={{ ...TYPE.headline, color: C2.char }}>{t('find.showAs')}</span>
          <SegmentedControl label={t('find.showAs')} value={view} onChange={onView}
            options={[{ value: 'list', label: t('explore.list'), icon: 'list' }, { value: 'map', label: t('explore.map'), icon: 'map' }]}/>
        </div>
      )}
    </div>
  );
}

export { FindHeader };
