'use client';

import React from 'react';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Search, ra2ParseQuery, ra2QueryLabel } from '@/lib/pilot/match';
import { useTrackSearch } from '../track';
import { BadgeFilter, useBadgeFilter } from '../layers/BadgeFilter';
import { Button, EmptyState, GUTTER, List, SPACE, SearchField, SegmentedControl, TYPE, scrollIntoViewSafe } from '../ds';
import { ExploreFilters } from '../explore/ExploreFilters';
import { PlaceRow } from '../explore/PlaceRow';
import { CLEAR_FILTERS, applyFilters, countsLine, filtersOn, verdictCounts } from '../explore/filters';
import { useT } from '../i18n';
import { needText } from '@/lib/i18n/data';
import { EnglishSearchNote } from '../explore/EnglishSearchNote';

const PAGE = 25;

// ─────────────────────────────────────────────────────────────
// RESULTS — persistent search, filter chips, one verdict per row
// ─────────────────────────────────────────────────────────────
function V2Results({ app }) {
  const t = useT();
  const query = app.query || { cats: [], tags: [], label: 'All places', raw: '' };
  const h = useV2Heading('results-' + query.label);
  const needs = app.user?.needs || [];
  const badgeFilter = useBadgeFilter(app);
  const searched = badgeFilter.apply(ra2Search(app.venues, query, needs));
  const all = applyFilters(searched, app.filters);
  const queryLabel = ra2QueryLabel(query, t);
  const counts = verdictCounts(searched);
  const [limit, setLimit] = React.useState(PAGE);
  const results = all.slice(0, limit);
  useTrackSearch(all);
  const needShorts = needs.map(id => needText(t, id, 'short'));

  const initialText = query.raw || (query.cats.length || query.tags.length ? queryLabel : '');
  const [text, setText] = React.useState(initialText);
  // A new search resets the box and the page (adjusting state while rendering,
  // not in an effect, so there's no flash of the old text).
  const [shownFor, setShownFor] = React.useState(initialText);
  if (shownFor !== initialText) { setShownFor(initialText); setText(initialText); setLimit(PAGE); }

  // Coming back from a place: mark it and bring it into view.
  const listRef = React.useRef(null);
  React.useEffect(() => {
    const row = app.lastVenueId && listRef.current?.querySelector(`[data-place="${CSS.escape(app.lastVenueId)}"]`);
    if (row) scrollIntoViewSafe(row, { block: 'center' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filtersOn(app.filters);
  const clearFilters = () => app.setFilters(CLEAR_FILTERS);

  return (
    <V2Shell scroll={false} tabs app={app} active="home">
      {/* fixed top: search + filters never scroll away */}
      <div style={{ paddingTop: 'var(--ra-shell-top)', background: C2.paper, borderBottom: `1px solid ${C2.hair}`, flexShrink: 0 }}>
        <div style={{ padding: `10px ${GUTTER}px ${SPACE.sm}px` }}>
          <SearchField id="results-search" label={t('ds.search.label')} value={text} onChange={setText}
            dirty={text.trim() !== initialText.trim() && !!text.trim()}
            placeholder={t('explore.search.tryPlaceholder')}
            onSubmit={t => app.runSearch(ra2ParseQuery(t))}
            onVoice={() => app.goto('voice')}
            back={{ label: t('explore.backHome'), onClick: () => app.goto('home') }}/>
          <EnglishSearchNote/>
        </div>
        <div style={{ padding: `0 ${GUTTER}px ${SPACE.sm}px` }}>
          <ExploreFilters app={app} counts={counts}/>
        </div>
      </div>

      <div className="v2-scroll" style={{ paddingTop: 0 }} ref={listRef}>
        <div style={{ padding: `${SPACE.lg}px ${GUTTER}px ${SPACE.sm}px` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm }}>
            <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title2, margin: 0, color: C2.char }}>
              {t('common.places', { count: all.length })}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
              <span className="ra-sr-only"> {queryLabel}</span>
            </h1>
            {!app.wide && (
              <SegmentedControl label={t('explore.showAs')} value="list" onChange={v => v === 'map' && app.goto('map', null, { replace: true })}
                options={[{ value: 'list', label: t('explore.list'), icon: 'list' }, { value: 'map', label: t('explore.map'), icon: 'map' }]}/>
            )}
          </div>
          {searched.length > 0 && <p style={{ ...TYPE.callout, color: C2.char, margin: '6px 0 0' }}>{countsLine(counts, t)}</p>}
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '6px 0 0' }}>
            {needShorts.length ? t('explore.matchedNeeds', { needs: needShorts.join(' + ') }) : t('explore.generalAccess')}
          </p>
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span>{t('explore.walkingFrom', { origin: app.origin.name })}</span>
            {!app.origin.mine && <Button variant="plain" size="sm" onClick={app.locateMe} style={{ padding: '0 4px' }}>{t('explore.useLocation')}</Button>}
          </p>
          {all.length > 1 && (
            <SegmentedControl label={t('explore.sort.label')} value={app.filters.sort} onChange={v => app.setFilters({ sort: v })}
              style={{ marginTop: SPACE.sm }}
              options={[{ value: 'match', label: t('explore.sort.match') }, { value: 'near', label: t('explore.sort.near') }]}/>
          )}
          <div style={{ marginTop: SPACE.md }}>
            <BadgeFilter filter={badgeFilter}/>
          </div>
        </div>

        {results.length > 0 && (
          <List label={t('explore.placesList', { query: queryLabel })}>
            {results.map(r => (
              <PlaceRow key={r.id} app={app} place={r} selected={r.id === app.lastVenueId}/>
            ))}
          </List>
        )}

        {all.length > results.length && (
          <div style={{ padding: `${SPACE.md}px ${GUTTER}px` }}>
            <Button full variant="ghost" onClick={() => setLimit(l => l + PAGE)}>
              {t('explore.showMore', { n: Math.min(PAGE, all.length - results.length), rest: all.length - results.length })}
            </Button>
          </div>
        )}

        {!results.length && (filtered && searched.length ? (
          <EmptyState icon="filter" title={t('explore.empty.filtersTitle')}
            body={t('explore.empty.filtersBody', { count: searched.length, query: queryLabel })}
            action={{ label: t('explore.empty.showAll', { count: searched.length }), onClick: clearFilters }}/>
        ) : (
          <EmptyState icon="search" title={t('explore.empty.noneTitle', { query: queryLabel })}
            body={t('explore.empty.noneBody')}
            action={{ label: t('explore.showAllPlaces'), onClick: () => app.runSearch({ cats: [], tags: [], label: 'All places', raw: '' }) }}
            secondary={{ label: t('explore.backHome'), onClick: () => app.goto('home') }}/>
        ))}
        <div style={{ height: SPACE.xl }}/>
      </div>
    </V2Shell>
  );
}

export { V2Results };
