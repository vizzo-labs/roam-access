'use client';

import React from 'react';
import { PilotMap, MapLegend } from '../PilotMap';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Search, ra2ParseQuery, ra2QueryLabel } from '@/lib/pilot/match';
import { LayerMenu, layerExtras } from '../layers/LayerToggles';
import { FacilityCard } from '../layers/FacilityCard';
import { Button, GUTTER, List, SPACE, SearchField, SegmentedControl, SnapSheet, TYPE } from '../ds';
import { ExploreFilters } from '../explore/ExploreFilters';
import { PlaceRow } from '../explore/PlaceRow';
import { CLEAR_FILTERS, applyFilters, countsLine, filtersOn, verdictCounts } from '../explore/filters';
import { useT } from '../i18n';
import { pinLabels } from '../WebLayout';
import { PlacePreviewCard } from '../explore/PlacePreviewCard';
import { invalidateGaps } from '../community/gapsStore';

const PEEK = 132;
const SHEET_ROWS = 50;

// ─────────────────────────────────────────────────────────────
// MAP (phones) — the map with a draggable list sheet over it
// (Google/Apple Maps). The list stays the primary, accessible view:
// the sheet's handle is a button, and List/Map switches to the full list.
// ─────────────────────────────────────────────────────────────
function V2MapView({ app }) {
  const t = useT();
  const query = app.query || { cats: [], tags: [], label: 'All places', raw: '' };
  const searched = ra2Search(app.venues, query, app.user?.needs || []);
  const results = applyFilters(searched, app.filters);
  const counts = verdictCounts(searched);
  const [selId, setSelId] = React.useState(null);
  const [snap, setSnap] = React.useState('half');
  // Access layers (F3): a facility pin replaces the place list while selected.
  const [extraId, setExtraId] = React.useState(null);
  const extras = layerExtras(app.layers, { t });
  const extra = extraId && extras.some(x => x.id === extraId) ? app.layers.facilityById(extraId) : null;
  const sel = extra ? null : results.find(r => r.id === selId) || null;
  const h = useV2Heading('map');
  const pinColor = { works: C2.blue, check: C2.amber, barrier: C2.red, unknown: '#475569' };
  const pinIcon = { works: '✓', check: '!', barrier: '✗', unknown: '?' };
  const labels = pinLabels(t);
  const queryLabel = ra2QueryLabel(query, t);
  const legendKinds = [...new Set(results.map(r => r.verdict.kind))];

  const initialText = query.raw || (query.cats.length || query.tags.length ? queryLabel : '');
  const [text, setText] = React.useState(initialText);
  const [shownFor, setShownFor] = React.useState(initialText);
  if (shownFor !== initialText) { setShownFor(initialText); setText(initialText); }

  const sheetBody = React.useRef(null);
  const mapApi = React.useRef(null);
  const area = React.useRef(null);
  const cardRef = React.useRef(null);
  const cardBox = React.useRef(null);
  // Place preview card: tapping a pin snaps the sheet to its peek, which is
  // exactly as tall as the card (capped; the card scrolls inside past that).
  const [cardH, setCardH] = React.useState(260);
  const [areaH, setAreaH] = React.useState(700);
  function selectPin(id) {
    setExtraId(null);
    setSelId(id);
    setSnap('peek');
    requestAnimationFrame(() => {
      sheetBody.current?.parentElement?.scrollTo({ top: 0 });
      cardRef.current?.focus({ preventScroll: true });
    });
  }
  function closeCard() {
    const pin = mapApi.current?.pinEl(selId);
    setSelId(null);
    setSnap('half');
    if (pin) requestAnimationFrame(() => pin.focus());
  }
  function selectExtra(id) { setExtraId(id); setSelId(null); setSnap('peek'); }
  React.useLayoutEffect(() => {
    if (!sel) return;
    const measure = () => {
      if (cardBox.current) setCardH(cardBox.current.offsetHeight);
      if (area.current) setAreaH(area.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (cardBox.current) ro.observe(cardBox.current);
    if (area.current) ro.observe(area.current);
    return () => ro.disconnect();
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const cardMax = Math.round(areaH * 0.62) - 56; // 44px handle + 12px under the header
  const peekH = sel ? Math.min(cardH, cardMax) + 56 : PEEK;

  const others = sel ? results.filter(r => r.id !== sel.id) : results;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const sheetPx = snap === 'peek' ? peekH : snap === 'half' ? Math.round(vh * 0.5) : vh;

  const countsHeader = (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm }}>
      <div style={{ minWidth: 0, flex: '1 1 140px' }}>
        <h2 style={{ ...TYPE.title3, margin: 0 }}>{t('common.places', { count: results.length })}</h2>
        <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {searched.length ? countsLine(counts, t) : t('explore.nothingMatched')}
        </p>
      </div>
      <SegmentedControl label={t('explore.showAs')} value="map" onChange={v => v === 'list' && app.goto('results', null, { replace: true })}
        options={[{ value: 'list', label: t('explore.list'), icon: 'list' }, { value: 'map', label: t('explore.map'), icon: 'map' }]}/>
    </div>
  );

  return (
    <V2Shell scroll={false} tabs app={app} active="home">
      <h1 ref={h} tabIndex={-1} className="ra-sr-only">{t('explore.mapHeading', { query: queryLabel })}</h1>
      <div ref={area} style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <PilotMap results={results} selectedId={extra ? null : selId} onSelect={selectPin} origin={app.origin}
          apiRef={mapApi} onMapClick={() => sel && closeCard()}
          extras={extras} selectedExtraId={extra?.id || null} onSelectExtra={selectExtra} alertIds={app.layers.alertIds}
          colors={pinColor} icons={pinIcon} labels={labels} topPad={190} bottomPad={Math.min(sheetPx, vh * 0.5) + 30}
          onLocate={app.locateFromMap} onLocateError={app.locateError} autoLocate={app.origin.mine}
          locateStyle={snap === 'full' ? { display: 'none' } : { right: 18, bottom: snap === 'peek' ? peekH + 14 : 'calc(50% + 14px)' }}/>

        {/* top: the same search + filters as the list */}
        <div style={{ position: 'absolute', top: 'var(--ra-shell-top)', left: 0, right: 0, zIndex: 6, padding: `0 ${GUTTER - 4}px`, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <SearchField id="map-search" label={t('ds.search.label')} value={text} onChange={setText} floating
              dirty={text.trim() !== initialText.trim() && !!text.trim()}
              placeholder={t('ds.search.label')}
              onSubmit={t => { app.setQuery(ra2ParseQuery(t)); }}
              onVoice={() => app.goto('voice')}
              back={{ label: t('explore.backHome'), onClick: () => app.goto('home') }}/>
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

        <SnapSheet label={t('explore.placesSheet')} snap={snap} onSnapChange={setSnap} peekHeight={peekH} topGap={8}
          header={sel ? (
            <div ref={cardBox}>
              <PlacePreviewCard ref={cardRef} variant="sheet" place={sel} needs={app.user?.needs || []}
                saved={app.world.saved.includes(sel.id)} onToggleSave={() => app.toggleSave(sel.id)}
                onClose={closeCard}
                onDetails={() => app.goto('venue', sel.id)}
                onAddPhoto={() => app.goto('review', sel.id)}
                onAnswer={async (feature, answer) => {
                  const ok = await app.answerQuick({ venueId: sel.id, feature, answer });
                  if (ok) invalidateGaps();
                  return ok;
                }}
                reports={app.layers.reportsFor('venue', sel.id)}
                onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); closeCard(); } }}
                style={{ maxHeight: cardMax, overflowY: 'auto' }}/>
            </div>
          ) : countsHeader}>
          <div ref={sheetBody}>
            {sel && <div style={{ padding: `${SPACE.sm}px ${GUTTER}px` }}>{countsHeader}</div>}
            {others.length > 0 && (
              <List label={t('explore.placesList', { query: queryLabel })}>
                {others.slice(0, SHEET_ROWS).map(r => <PlaceRow key={r.id} app={app} place={r} reasons={1}/>)}
              </List>
            )}
            {others.length > SHEET_ROWS && (
              <div style={{ padding: `${SPACE.md}px ${GUTTER}px` }}>
                <Button full variant="ghost" onClick={() => app.goto('results', null, { replace: true })}>
                  {t('explore.seeAllInList', { count: results.length })}
                </Button>
              </div>
            )}
            {!results.length && (
              <div style={{ padding: `${SPACE.lg}px ${GUTTER}px` }}>
                <p style={{ ...TYPE.callout, margin: '0 0 12px' }}>{t('explore.noMatchMap')}</p>
                {filtersOn(app.filters) && (
                  <Button variant="ghost" onClick={() => app.setFilters(CLEAR_FILTERS)}>{t('explore.clearFilters')}</Button>
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
