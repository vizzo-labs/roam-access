'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Search, ra2ParseQuery } from '@/lib/pilot/match';
import { useTrackSearch } from '../track';
import { BadgeFilter, useBadgeFilter } from '../layers/BadgeFilter';
import { QuietFilter, useQuietFilter } from '../sensory/QuietFilter';
import { Button, EmptyState, GUTTER, List, SPACE, SearchField, SegmentedControl, TYPE, scrollIntoViewSafe } from '../ds';
import { ExploreFilters } from '../explore/ExploreFilters';
import { PlaceRow } from '../explore/PlaceRow';
import { applyFilters, countsLine, verdictCounts } from '../explore/filters';

const PAGE = 25;

// ─────────────────────────────────────────────────────────────
// RESULTS — persistent search, filter chips, one verdict per row
// ─────────────────────────────────────────────────────────────
function V2Results({ app }) {
  const query = app.query || { cats: [], tags: [], label: 'All places', raw: '' };
  const h = useV2Heading('results-' + query.label);
  const needs = app.user?.needs || [];
  const badgeFilter = useBadgeFilter(app);
  const quietFilter = useQuietFilter();
  const matched = badgeFilter.apply(ra2Search(app.venues, query, needs));
  const searched = quietFilter.apply(matched);
  const all = applyFilters(searched, app.filters);
  const counts = verdictCounts(searched);
  const [limit, setLimit] = React.useState(PAGE);
  const results = all.slice(0, limit);
  useTrackSearch(all);
  const needShorts = RA2_NEEDS.filter(n => needs.includes(n.id)).map(n => n.short);

  const initialText = query.raw || (query.cats.length || query.tags.length ? query.label : '');
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

  const filtered = app.filters.works || app.filters.hideBarriers;
  const clearFilters = () => app.setFilters({ works: false, hideBarriers: false });

  return (
    <V2Shell scroll={false} tabs app={app} active="home">
      {/* fixed top: search + filters never scroll away */}
      <div style={{ paddingTop: 'var(--ra-shell-top)', background: C2.paper, borderBottom: `1px solid ${C2.hair}`, flexShrink: 0 }}>
        <div style={{ padding: `10px ${GUTTER}px ${SPACE.sm}px` }}>
          <SearchField id="results-search" label="Search places" value={text} onChange={setText}
            dirty={text.trim() !== initialText.trim() && !!text.trim()}
            placeholder="Try “quiet cafe with step-free entry”"
            onSubmit={t => app.runSearch(ra2ParseQuery(t))}
            onVoice={() => app.goto('voice')}
            back={{ label: 'Back to home', onClick: () => app.goto('home') }}/>
        </div>
        <div style={{ padding: `0 ${GUTTER}px ${SPACE.sm}px` }}>
          <ExploreFilters app={app} counts={counts}/>
        </div>
      </div>

      <div className="v2-scroll" style={{ paddingTop: 0 }} ref={listRef}>
        <div style={{ padding: `${SPACE.lg}px ${GUTTER}px ${SPACE.sm}px` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm }}>
            <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title2, margin: 0, color: C2.char }}>
              {all.length} {all.length === 1 ? 'place' : 'places'}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
              <span className="ra-sr-only"> {query.label}</span>
            </h1>
            {!app.wide && (
              <SegmentedControl label="Show results as" value="list" onChange={v => v === 'map' && app.goto('map', null, { replace: true })}
                options={[{ value: 'list', label: 'List', icon: 'list' }, { value: 'map', label: 'Map', icon: 'map' }]}/>
            )}
          </div>
          {searched.length > 0 && <p style={{ ...TYPE.callout, color: C2.char, margin: '6px 0 0' }}>{countsLine(counts)}</p>}
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '6px 0 0' }}>
            {needShorts.length ? `Matched to your needs: ${needShorts.join(' + ')}.` : 'Showing general access — set your needs in Me to personalise.'}
          </p>
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span>Walking times from {app.origin.name}.</span>
            {!app.origin.mine && <Button variant="plain" size="sm" onClick={app.locateMe} style={{ padding: '0 4px' }}>Use my location</Button>}
          </p>
          {all.length > 1 && (
            <SegmentedControl label="Sort places" value={app.filters.sort} onChange={v => app.setFilters({ sort: v })}
              style={{ marginTop: SPACE.sm }}
              options={[{ value: 'match', label: 'Best for me' }, { value: 'near', label: 'Nearest' }]}/>
          )}
          <div style={{ marginTop: SPACE.md }}>
            <BadgeFilter filter={badgeFilter}/>
            <QuietFilter filter={quietFilter} list={matched}/>
          </div>
        </div>

        {results.length > 0 && (
          <List label={`Places: ${query.label}`}>
            {results.map(r => (
              <PlaceRow key={r.id} app={app} place={r} selected={r.id === app.lastVenueId}/>
            ))}
          </List>
        )}

        {all.length > results.length && (
          <div style={{ padding: `${SPACE.md}px ${GUTTER}px` }}>
            <Button full variant="ghost" onClick={() => setLimit(l => l + PAGE)}>
              Show {Math.min(PAGE, all.length - results.length)} more of {all.length - results.length}
            </Button>
          </div>
        )}

        {!results.length && (filtered && searched.length ? (
          <EmptyState icon="filter" title="No places match your filters"
            body={`${searched.length} ${searched.length === 1 ? 'place matches' : 'places match'} “${query.label}” without them.`}
            action={{ label: `Show all ${searched.length}`, onClick: clearFilters }}/>
        ) : (
          <EmptyState icon="search" title={`Nothing matched ${query.raw ? `“${query.raw}”` : query.label}`}
            body="Try fewer words, like “quiet cafe”, or browse everything nearby."
            action={{ label: 'Show all places', onClick: () => app.runSearch({ cats: [], tags: [], label: 'All places', raw: '' }) }}
            secondary={{ label: 'Back to home', onClick: () => app.goto('home') }}/>
        ))}
        <div style={{ height: SPACE.xl }}/>
      </div>
    </V2Shell>
  );
}

export { V2Results };
