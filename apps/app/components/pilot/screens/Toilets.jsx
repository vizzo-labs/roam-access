'use client';

import React from 'react';
import { V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { Button, ChipGroup, EmptyState, FilterChip, GUTTER, List, SkeletonList, SPACE, TYPE } from '../ds';
import { FacilityRow, ListedNote, ToiletAttribution } from '../layers/bits';
import { distanceLabel, hoursLabel, metres, toiletTags, reportType } from '../layers/layerUtils';

// ─────────────────────────────────────────────────────────────
// TOILETS — the list equivalent of the map's toilet layer
// ─────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'accessible', label: 'Accessible', test: d => d.accessible || d.adultChange || d.changingPlaces },
  { id: 'mlak', label: 'MLAK key', test: d => d.mlak24 || d.mlakAfterHours },
  { id: 'adult', label: 'Adult change or Changing Places', test: d => d.adultChange || d.changingPlaces },
];

function V2Toilets({ app }) {
  const h = useV2Heading('toilets');
  const L = app.layers;
  const [on, setOn] = React.useState(['accessible']);
  const [limit, setLimit] = React.useState(20);
  const set = (id, sel) => { setOn(xs => (sel ? [...xs, id] : xs.filter(x => x !== id))); setLimit(20); };

  const list = L.facilities
    .filter(f => f.kind === 'toilet')
    .filter(f => FILTERS.filter(x => on.includes(x.id)).every(x => x.test(f.details || {})))
    .map(f => ({ f, m: metres(app.origin, f) }))
    .sort((a, b) => a.m - b.m);
  const shown = list.slice(0, limit);

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: `10px ${GUTTER}px 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to="home" label="Back to home"/>
        {!app.wide && (
          <Button variant="ghost" size="sm" icon="map" onClick={() => { L.setShown('toilets', true); app.goto('map'); }}>Show on map</Button>
        )}
      </div>
      <div style={{ padding: `18px ${GUTTER}px 24px` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: '0 0 6px' }}>
          Accessible toilets<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ ...TYPE.callout, color: C2.slate, margin: `0 0 ${SPACE.md}px` }}>
          Public toilets around Manly, plus Changing Places further out. Nearest first, from {app.origin.name}.
        </p>
        <ListedNote>Listed on the National Public Toilet Map — not yet confirmed by the community. Check opening hours before you go.</ListedNote>

        <ChipGroup label="Filter toilets" wrap>
          {FILTERS.map(x => <FilterChip key={x.id} selected={on.includes(x.id)} onChange={sel => set(x.id, sel)}>{x.label}</FilterChip>)}
        </ChipGroup>
        <p role="status" style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.sm}px 0` }}>
          {!L.loaded ? '' : L.failed ? 'Couldn’t load toilets — check your connection.' : `${list.length} ${list.length === 1 ? 'toilet' : 'toilets'}`}
        </p>

        {!L.loaded && <SkeletonList label="Loading toilets…" count={4} padX={0}/>}
        {shown.length > 0 && (
          <List label="Toilets, nearest first" inset>
            {shown.map(({ f }) => {
              const d = f.details || {};
              const hrs = hoursLabel(d);
              const rep = L.reportsFor('facility', f.id).find(r => !reportType(r.type)?.positive);
              return (
                <FacilityRow key={f.id} app={app} f={f}
                  subtitle={`${f.suburb ? `${f.suburb} · ` : ''}${distanceLabel(app.origin, f)}${hrs ? ` · ${hrs}` : ''}`}
                  tags={toiletTags(d)} alert={rep ? reportType(rep.type)?.banner : null}/>
              );
            })}
          </List>
        )}
        {list.length > shown.length && (
          <Button variant="ghost" full onClick={() => setLimit(l => l + 20)} style={{ marginTop: SPACE.sm }}>
            Show {Math.min(20, list.length - shown.length)} more
          </Button>
        )}
        {L.loaded && !L.failed && !list.length && (
          <EmptyState compact icon="filter" title="No toilets match all of those"
            body="Try turning a filter off." action={{ label: 'Show all accessible toilets', onClick: () => setOn(['accessible']) }}/>
        )}
        <ToiletAttribution/>
      </div>
    </V2Shell>
  );
}

export { V2Toilets };
