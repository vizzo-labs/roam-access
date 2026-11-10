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
import { Button, Card, EmptyState, GUTTER, Icon, List, SPACE, SearchField, SegmentedControl, TYPE, scrollIntoViewSafe } from '../ds';
import { PlaceRow } from '../explore/PlaceRow';
import { BrowseGrid, ALL } from '../explore/BrowseGrid';
import { FindHeader } from '../explore/FindHeader';
import { EnglishSearchNote } from '../explore/EnglishSearchNote';
import { MapSection } from '../explore/MapSection';
import { CLEAR_FILTERS, PAGE, applyFilters, filtersOn, inArea, nearPlaces, verdictCounts } from '../explore/filters';
import { useShowOnMap } from '../explore/useShowOnMap';

const NEAR_ROWS = 5;

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
  const near = nearPlaces(app.venues, needs, NEAR_ROWS, ra2Verdict);
  const mapOn = !app.wide && app.exploreView === 'map';
  // Desktop: the map beside the panel shows these same places.
  useShowOnMap(app, near, `near:${app.origin.lat},${app.origin.lng}`, true);

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
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.xs }}>
            <h2 id="near-h" style={{ ...TYPE.title3, fontSize: 20, margin: 0, color: C2.char }}>{t('find.near.title')}</h2>
            {!app.wide && <ShowAs app={app}/>}
          </div>
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 6 }}>
            <span>{t('find.walkingFrom', { origin: app.origin.name })}</span>
            {!app.origin.mine && (
              <Button variant="plain" size="sm" onClick={app.locateMe} style={{ padding: '0 4px', marginLeft: -4 }}>{t('explore.useLocation')}</Button>
            )}
          </p>
        </div>
        {mapOn && (
          <div style={{ marginTop: SPACE.sm }}>
            <MapSection app={app} places={near} everything={app.venuesWithVerdict} listHeadingId="near-list-h"/>
            <h3 id="near-list-h" tabIndex={-1} style={{ ...TYPE.headline, margin: `${SPACE.md}px ${GUTTER}px 0`, color: C2.char }}>{t('find.map.onThisMap')}</h3>
          </div>
        )}
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
  const area = app.area;
  // After "Search this area" the heading takes focus again (the new list).
  const h = useV2Heading('results-' + query.label + (area ? '@' + area.seq : ''));
  const needs = app.user?.needs || [];
  const badgeFilter = useBadgeFilter(app);
  const pool = area ? app.venues.filter(v => inArea(area, v)) : app.venues;
  const searched = badgeFilter.apply(ra2Search(pool, query, needs));
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
  // The map view shows one page at a time: these ≤ 10 places are its pins.
  const [mapPage, setMapPage] = React.useState(backTo >= 0 ? Math.floor(backTo / PAGE) : 0);
  const listFor = initialText + (area ? '@' + area.seq : '');
  const [shownFor, setShownFor] = React.useState(listFor);
  if (shownFor !== listFor) { setShownFor(listFor); setLimit(PAGE); setMapPage(0); }
  const results = all.slice(0, limit);
  const mapOn = !app.wide && app.exploreView === 'map';
  const page = Math.min(mapPage, Math.max(0, Math.ceil(all.length / PAGE) - 1));
  const pageRows = all.slice(page * PAGE, (page + 1) * PAGE);
  // Desktop: the map beside the panel shows the rows on screen. It frames
  // them for a new search or filter, never after "Search this area".
  const fitKey = `${listFor}|${JSON.stringify(app.filters)}|${badgeFilter.on.join(',')}`;
  // The map shows EVERY place of this search and these filters, from
  // anywhere (not only the area or the page): it already shows all, so
  // "Search this area" only narrows the list.
  const needsKey = needs.join(','), filtersKey = JSON.stringify(app.filters), badgeKey = badgeFilter.on.join(',');
  const mapAll = React.useMemo(() => applyFilters(badgeFilter.apply(ra2Search(app.venues, query, needs)), app.filters),
    [app.venues, query, needsKey, filtersKey, badgeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useShowOnMap(app, results, fitKey, !area, mapAll);
  // "Search this area": say how many places it found (once per search).
  React.useEffect(() => {
    if (area && app.takeAreaAnnouncement(area.seq)) app.toast(t('find.area.found', { count: all.length }));
  }, [area?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <FindHeader app={app} headingRef={h} queryLabel={queryLabel} initialText={initialText} area={area}
          total={all.length} counts={counts} searched={searched} badgeFilter={badgeFilter}
          view={mapOn ? 'map' : 'list'} onView={app.setExploreView}/>

        {mapOn && pageRows.length > 0 && (
          <div style={{ marginTop: SPACE.md }}>
            <MapSection app={app} places={pageRows} everything={mapAll} listHeadingId="map-list-h"/>
            <h2 id="map-list-h" tabIndex={-1} style={{ ...TYPE.title3, margin: `${SPACE.lg}px ${GUTTER}px 0`, color: C2.char }}>{t('find.map.onThisMap')}</h2>
            <List label={t('find.map.onThisMap')} style={{ marginTop: SPACE.xs }}>
              {pageRows.map(r => <PlaceRow key={'map-' + r.id} app={app} place={r} selected={r.id === app.lastVenueId}/>)}
            </List>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs, padding: `${SPACE.sm}px ${GUTTER}px 0` }}>
              {(page + 1) * PAGE < all.length && (
                <Button full variant="secondary" onClick={() => setMapPage(page + 1)}>
                  {t('find.map.next', { count: Math.min(PAGE, all.length - (page + 1) * PAGE) })}
                </Button>
              )}
              {page > 0 && (
                <Button full variant="ghost" onClick={() => setMapPage(page - 1)}>{t('find.map.prev', { count: PAGE })}</Button>
              )}
            </div>
          </div>
        )}

        {!mapOn && results.length > 0 && (
          <List label={t('explore.placesList', { query: queryLabel })} style={{ marginTop: SPACE.md }}>
            {results.map(r => <PlaceRow key={r.id} app={app} place={r} selected={r.id === app.lastVenueId}/>)}
          </List>
        )}

        {!mapOn && rest > 0 && (
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

// "Show as List · Map" (phones): the map is a view above the same list.
function ShowAs({ app }) {
  const t = useT();
  return (
    <SegmentedControl label={t('find.showAs')} value={app.exploreView} onChange={app.setExploreView}
      options={[{ value: 'list', label: t('explore.list'), icon: 'list' }, { value: 'map', label: t('explore.map'), icon: 'map' }]}/>
  );
}

export { V2Find };
