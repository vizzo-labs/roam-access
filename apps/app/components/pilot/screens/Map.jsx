'use client';

import React from 'react';
import { PilotMap, MapLegend } from '../PilotMap';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META } from '../ui/Verdict';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Search, ra2ParseQuery } from '@/lib/pilot/match';
import { LayerMenu, layerExtras } from '../layers/LayerToggles';
import { FacilityCard } from '../layers/FacilityCard';
import { Button, GUTTER, IconButton, List, SPACE, SearchField, SegmentedControl, SnapSheet, TYPE } from '../ds';
import { ExploreFilters } from '../explore/ExploreFilters';
import { PlaceRow } from '../explore/PlaceRow';
import { applyFilters, countsLine, verdictCounts } from '../explore/filters';

const PEEK = 132;
const SHEET_ROWS = 50;

// ─────────────────────────────────────────────────────────────
// MAP (phones) — the map with a draggable list sheet over it
// (Google/Apple Maps). The list stays the primary, accessible view:
// the sheet's handle is a button, and List/Map switches to the full list.
// ─────────────────────────────────────────────────────────────
function V2MapView({ app }) {
  const query = app.query || { cats: [], tags: [], label: 'All places', raw: '' };
  const searched = ra2Search(app.venues, query, app.user?.needs || []);
  const results = applyFilters(searched, app.filters);
  const counts = verdictCounts(searched);
  const [selId, setSelId] = React.useState(null);
  const [snap, setSnap] = React.useState('half');
  // Access layers (F3): a facility pin replaces the place list while selected.
  const [extraId, setExtraId] = React.useState(null);
  const extras = layerExtras(app.layers);
  const extra = extraId && extras.some(x => x.id === extraId) ? app.layers.facilityById(extraId) : null;
  const sel = extra ? null : results.find(r => r.id === selId) || null;
  const h = useV2Heading('map');
  const pinColor = { works: C2.blue, check: C2.amber, barrier: C2.red, unknown: '#475569' };
  const pinIcon = { works: '✓', check: '!', barrier: '✗', unknown: '?' };
  const labels = Object.fromEntries(Object.entries(V2_VERDICT_META).map(([k, m]) => [k, m.label]));
  const legendKinds = [...new Set(results.map(r => r.verdict.kind))];

  const initialText = query.raw || (query.cats.length || query.tags.length ? query.label : '');
  const [text, setText] = React.useState(initialText);
  const [shownFor, setShownFor] = React.useState(initialText);
  if (shownFor !== initialText) { setShownFor(initialText); setText(initialText); }

  const sheetBody = React.useRef(null);
  function selectPin(id) {
    setExtraId(null);
    setSelId(id);
    if (snap === 'peek') setSnap('half');
    // The selected place shows at the top of the sheet: scroll the sheet there.
    requestAnimationFrame(() => sheetBody.current?.parentElement?.scrollTo({ top: 0 }));
  }
  function selectExtra(id) { setExtraId(id); setSnap('peek'); }

  const others = sel ? results.filter(r => r.id !== sel.id) : results;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const sheetPx = snap === 'peek' ? PEEK : snap === 'half' ? Math.round(vh * 0.5) : vh;

  return (
    <V2Shell scroll={false} tabs app={app} active="home">
      <h1 ref={h} tabIndex={-1} className="ra-sr-only">Map of places — {query.label}</h1>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <PilotMap results={results} selectedId={extra ? null : selId} onSelect={selectPin} origin={app.origin}
          extras={extras} selectedExtraId={extra?.id || null} onSelectExtra={selectExtra} alertIds={app.layers.alertIds}
          colors={pinColor} icons={pinIcon} labels={labels} topPad={190} bottomPad={Math.min(sheetPx, vh * 0.5) + 30}
          onLocate={app.locateFromMap} onLocateError={app.locateError} autoLocate={app.origin.mine}
          locateStyle={snap === 'full' ? { display: 'none' } : { right: 18, bottom: snap === 'peek' ? PEEK + 14 : 'calc(50% + 14px)' }}/>

        {/* top: the same search + filters as the list */}
        <div style={{ position: 'absolute', top: 'var(--ra-shell-top)', left: 0, right: 0, zIndex: 6, padding: `0 ${GUTTER - 4}px`, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <SearchField id="map-search" label="Search places" value={text} onChange={setText} floating
              dirty={text.trim() !== initialText.trim() && !!text.trim()}
              placeholder="Search places"
              onSubmit={t => { app.setQuery(ra2ParseQuery(t)); }}
              onVoice={() => app.goto('voice')}
              back={{ label: 'Back to home', onClick: () => app.goto('home') }}/>
          </div>
          <div style={{ pointerEvents: 'auto', marginTop: SPACE.xs }}>
            <ExploreFilters app={app} counts={counts} bleed={false}/>
          </div>
        </div>

        {/* Legend left, layers right; they wrap instead of overlapping at large text sizes. */}
        <div style={{
          position: 'absolute', top: 'calc(var(--ra-shell-top) + 128px)', left: 18, right: 18, zIndex: 5,
          display: 'flex', flexWrap: 'wrap-reverse', justifyContent: 'space-between', alignItems: 'flex-start', gap: SPACE.xs, pointerEvents: 'none',
        }}>
          <MapLegend compact kinds={legendKinds} colors={pinColor} icons={pinIcon} labels={labels}
            style={{ position: 'relative', pointerEvents: 'auto' }}/>
          <LayerMenu shown={app.layers.shown} onChange={app.layers.setShown}
            style={{ position: 'relative', pointerEvents: 'auto', marginLeft: 'auto' }}/>
        </div>

        {extra && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: PEEK, height: 0, zIndex: 21 }}>
            <FacilityCard app={app} f={extra}/>
          </div>
        )}

        <SnapSheet label="Places list" snap={snap} onSnapChange={setSnap} peekHeight={PEEK} topGap={8}
          header={(
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm }}>
              <div style={{ minWidth: 0, flex: '1 1 140px' }}>
                <h2 style={{ ...TYPE.title3, margin: 0 }}>{results.length} {results.length === 1 ? 'place' : 'places'}</h2>
                <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {searched.length ? countsLine(counts) : 'Nothing matched'}
                </p>
              </div>
              <SegmentedControl label="Show results as" value="map" onChange={v => v === 'list' && app.goto('results', null, { replace: true })}
                options={[{ value: 'list', label: 'List', icon: 'list' }, { value: 'map', label: 'Map', icon: 'map' }]}/>
            </div>
          )}>
          <div ref={sheetBody}>
            {sel && (
              <div style={{ borderBottom: `6px solid ${C2.stone}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.sm}px ${GUTTER - 8}px 0 ${GUTTER}px` }}>
                  <p style={{ ...TYPE.overline, color: C2.slate, margin: 0 }}>Selected on the map</p>
                  <IconButton icon="close" variant="ghost" size="sm" label={`Clear selection: ${sel.name}`} onClick={() => setSelId(null)}/>
                </div>
                <PlaceRow app={app} place={sel} reasons={3} selected/>
                <div style={{ display: 'flex', gap: SPACE.xs, padding: `0 ${GUTTER}px ${SPACE.md}px` }}>
                  <Button style={{ flex: 1 }} onClick={() => app.goto('venue', sel.id)} iconRight="forward">See details</Button>
                  <IconButton icon="bookmark" pressed={app.world.saved.includes(sel.id)} size="lg"
                    label={app.world.saved.includes(sel.id) ? `Remove ${sel.name} from saved` : `Save ${sel.name}`}
                    onClick={() => app.toggleSave(sel.id)} style={{ width: 52, height: 52 }}/>
                </div>
              </div>
            )}
            {others.length > 0 && (
              <List label={`Places: ${query.label}`}>
                {others.slice(0, SHEET_ROWS).map(r => <PlaceRow key={r.id} app={app} place={r} reasons={1}/>)}
              </List>
            )}
            {others.length > SHEET_ROWS && (
              <div style={{ padding: `${SPACE.md}px ${GUTTER}px` }}>
                <Button full variant="ghost" onClick={() => app.goto('results', null, { replace: true })}>
                  See all {results.length} in the list
                </Button>
              </div>
            )}
            {!results.length && (
              <div style={{ padding: `${SPACE.lg}px ${GUTTER}px` }}>
                <p style={{ ...TYPE.callout, margin: '0 0 12px' }}>No places match. Try removing a filter above.</p>
                {(app.filters.works || app.filters.hideBarriers) && (
                  <Button variant="ghost" onClick={() => app.setFilters({ works: false, hideBarriers: false })}>Clear filters</Button>
                )}
              </div>
            )}
            <div style={{ height: SPACE.lg }}/>
          </div>
        </SnapSheet>
      </div>
    </V2Shell>
  );
}

export { V2MapView };
