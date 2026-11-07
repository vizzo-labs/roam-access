'use client';

import React from 'react';
import { useT } from '../i18n';
import { V2Logo } from '../ui/Logo';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2ParseQuery, ra2QueryLabel, ra2Search, ra2Verdict } from '@/lib/pilot/match';
import { useTrackSearch } from '../track';
import { useBadgeFilter } from '../layers/BadgeFilter';
import { Button, Card, EmptyState, GUTTER, Icon, List, SPACE, SearchField, TYPE, scrollIntoViewSafe } from '../ds';
import { PlaceRow } from '../explore/PlaceRow';
import { BrowseGrid, ALL } from '../explore/BrowseGrid';
import { FindHeader } from '../explore/FindHeader';
import { EnglishSearchNote } from '../explore/EnglishSearchNote';
import { CLEAR_FILTERS, PAGE, applyFilters, filtersOn, verdictCounts } from '../explore/filters';

const NEAR_ROWS = 5;
const hasCommunityFact = v => [...v.works, ...v.check, ...v.barriers].some(f => f.src === 'community');

// ─────────────────────────────────────────────────────────────
// FIND — one screen for finding a place (Home + Results merged).
// Without a search: "Find a place." · search (mic inside) · Near me now ·
// four big buttons · at most one prompt · the nearest places.
// With a search or category (route `results`): the results header, then the
// list. The list is the answer; the map is an optional view of it.
// ─────────────────────────────────────────────────────────────
function V2Find({ app }) {
  return app.view === 'results' ? <FindResults app={app}/> : <FindHome app={app}/>;
}

function FindHome({ app }) {
  const t = useT();
  const h = useV2Heading('find');
  const [typed, setTyped] = React.useState('');
  const needs = app.user?.needs || [];

  const visited = app.venueById(app.world.visitedId);
  const showPrompt = visited && !app.world.reviewed.includes(visited.id);
  // Nearest places that anyone in the pilot has said something about; the
  // rest of the five are simply the nearest.
  const byDistance = app.venues.map(v => ({ ...v, verdict: ra2Verdict(v, needs) })).sort((a, b) => a.mins - b.mins);
  const known = byDistance.filter(hasCommunityFact).slice(0, NEAR_ROWS);
  const near = [...known, ...byDistance.filter(v => !known.includes(v))].slice(0, NEAR_ROWS);

  return (
    <V2Shell tabs app={app} active="find">
      {!app.wide && <div style={{ padding: `10px ${GUTTER}px 0` }}><V2Logo size={24}/></div>}
      <div style={{ padding: `${SPACE.md}px ${GUTTER}px 0` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: 0, color: C2.char }}>
          {t('find.title')}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ ...TYPE.body, color: C2.char, margin: `6px 0 ${SPACE.md}px` }}>{t('find.lead')}</p>
        <SearchField id="find-search" label={t('find.search.label')} value={typed} onChange={setTyped}
          placeholder={t('find.search.placeholder')}
          onSubmit={text => app.runSearch(ra2ParseQuery(text))}
          onVoice={() => app.goto('voice')}/>
        <EnglishSearchNote/>
        <BrowseGrid app={app} style={{ marginTop: SPACE.sm }}/>
      </div>

      {showPrompt && (
        <div style={{ padding: `${SPACE.lg}px ${GUTTER}px 0` }}>
          <Card variant="tint" onClick={() => app.goto('review', visited.id)} padding={SPACE.md} style={{ border: `2px solid ${C2.teal}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ color: C2.teal }}><Icon name="edit" size={22}/></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...TYPE.headline, fontSize: 17.5, display: 'block', color: C2.char }}>{t('find.prompt', { name: visited.name })}</span>
                <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate, marginTop: 2 }}>{t('find.promptHint')}</span>
              </span>
              <span style={{ color: C2.teal }}><Icon name="forward" size={20} strokeWidth={2.4}/></span>
            </span>
          </Card>
        </div>
      )}

      <section aria-labelledby="near-h" style={{ padding: `${SPACE.xl}px 0 ${SPACE.xl}px` }}>
        <div style={{ padding: `0 ${GUTTER}px` }}>
          <h2 id="near-h" style={{ ...TYPE.title3, fontSize: 20, margin: 0, color: C2.char }}>{t('find.near.title')}</h2>
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 6 }}>
            <span>{t('find.walkingFrom', { origin: app.origin.name })}</span>
            {!app.origin.mine && (
              <Button variant="plain" size="sm" onClick={app.locateMe} style={{ padding: '0 4px', marginLeft: -4 }}>{t('explore.useLocation')}</Button>
            )}
          </p>
        </div>
        <List label={t('find.near.list')} style={{ marginTop: SPACE.xs }}>
          {near.map(v => <PlaceRow key={v.id} app={app} place={v}/>)}
        </List>
        <div style={{ padding: `${SPACE.sm}px ${GUTTER}px 0` }}>
          <Button full variant="secondary" onClick={() => app.runSearch(ALL)}>{t('find.seeAll', { count: app.venues.length })}</Button>
        </div>
      </section>
    </V2Shell>
  );
}

function FindResults({ app }) {
  const t = useT();
  const query = app.query || ALL;
  const h = useV2Heading('results-' + query.label);
  const needs = app.user?.needs || [];
  const badgeFilter = useBadgeFilter(app);
  const searched = badgeFilter.apply(ra2Search(app.venues, query, needs));
  const all = applyFilters(searched, app.filters);
  const counts = verdictCounts(searched);
  const queryLabel = ra2QueryLabel(query, t);
  useTrackSearch(all);

  // Coming back from a place: show enough pages to include it, mark it and
  // bring it into view.
  const backTo = app.lastVenueId ? all.findIndex(v => v.id === app.lastVenueId) : -1;
  const firstPage = backTo >= PAGE ? Math.ceil((backTo + 1) / PAGE) * PAGE : PAGE;
  const [limit, setLimit] = React.useState(firstPage);
  const initialText = query.raw || (query.cats.length || query.tags.length ? queryLabel : '');
  const [shownFor, setShownFor] = React.useState(initialText);
  if (shownFor !== initialText) { setShownFor(initialText); setLimit(PAGE); }
  const results = all.slice(0, limit);

  const listRef = React.useRef(null);
  React.useEffect(() => {
    const row = app.lastVenueId && listRef.current?.querySelector(`[data-place="${CSS.escape(app.lastVenueId)}"]`);
    if (row) scrollIntoViewSafe(row, { block: 'center' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filtersOn(app.filters) || badgeFilter.on.length > 0;
  const clearFilters = () => { app.setFilters(CLEAR_FILTERS); badgeFilter.on.forEach(id => badgeFilter.set(id, false)); };
  const rest = all.length - results.length;
  const beach = query.cats.includes('parks');

  return (
    <V2Shell tabs app={app} active="find">
      <div ref={listRef}>
        <FindHeader app={app} headingRef={h} queryLabel={queryLabel} initialText={initialText}
          total={all.length} counts={counts} searched={searched} badgeFilter={badgeFilter}
          view="list" onView={v => v === 'map' && app.goto('map', null, { replace: true })}/>

        {results.length > 0 && (
          <List label={t('explore.placesList', { query: queryLabel })} style={{ marginTop: SPACE.md }}>
            {results.map(r => <PlaceRow key={r.id} app={app} place={r} selected={r.id === app.lastVenueId}/>)}
          </List>
        )}

        {rest > 0 && (
          <div style={{ padding: `${SPACE.sm}px ${GUTTER}px 0` }}>
            <Button full variant="secondary" onClick={() => setLimit(l => l + PAGE)}>
              {t('find.showMore', { n: Math.min(PAGE, rest), rest })}
            </Button>
          </div>
        )}

        {!results.length && (filtered && searched.length ? (
          <EmptyState icon="filter" title={t('explore.empty.filtersTitle')}
            body={t('explore.empty.filtersBody', { count: searched.length, query: queryLabel })}
            action={{ label: t('explore.empty.showAll', { count: searched.length }), onClick: clearFilters }}/>
        ) : (
          <EmptyState icon="search" title={t('explore.empty.noneTitle', { query: queryLabel })}
            body={t('find.empty.body')}
            action={{ label: t('find.empty.seeAll'), onClick: () => app.runSearch(ALL) }}
            secondary={filtered ? { label: t('explore.clearFilters'), onClick: clearFilters } : undefined}/>
        ))}

        {/* Parks & beaches: beach access (mats, beach wheelchairs) is a listing, not a verdict. */}
        {beach && (
          <div style={{ padding: `${SPACE.lg}px ${GUTTER}px 0` }}>
            <Card onClick={() => app.goto('beach')} padding={SPACE.md}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ color: C2.teal }}><Icon name="tree" size={24}/></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ ...TYPE.headline, display: 'block', color: C2.char }}>{t('layers.home.beach')}</span>
                  <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>{t('layers.home.beachSub')}</span>
                </span>
                <span style={{ color: C2.slate }}><Icon name="forward" size={18}/></span>
              </span>
            </Card>
          </div>
        )}
        <div style={{ height: SPACE.xl }}/>
      </div>
    </V2Shell>
  );
}

export { V2Find };
