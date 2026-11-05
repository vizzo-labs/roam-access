'use client';

import React from 'react';
import { V2BigBtn, V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { Chip, FacilityRow, ListedNote, ToiletAttribution } from '../layers/bits';
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
  const toggle = id => { setOn(xs => (xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id])); setLimit(20); };

  const all = L.facilities.filter(f => f.kind === 'toilet');
  const list = all
    .filter(f => FILTERS.filter(x => on.includes(x.id)).every(x => x.test(f.details || {})))
    .map(f => ({ f, m: metres(app.origin, f) }))
    .sort((a, b) => a.m - b.m);
  const shown = list.slice(0, limit);

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to="home" label="Back to home"/>
        {!app.wide && (
          <button type="button" onClick={() => { L.setShown('toilets', true); app.goto('map'); }} style={{
            minHeight: 48, padding: '0 16px', borderRadius: 999, border: `1.5px solid ${C2.line}`, background: C2.paper,
            fontFamily: F2, fontSize: 15, fontWeight: 700, color: C2.char, cursor: 'pointer',
          }}>Show on map</button>
        )}
      </div>
      <div style={{ padding: '18px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 28, marginBottom: 6 }}>
          Accessible toilets<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 14px', lineHeight: 1.45, fontFamily: F2 }}>
          Public toilets around Manly, plus Changing Places further out. Nearest first, from {app.origin.name}.
        </p>
        <ListedNote>Listed on the National Public Toilet Map — not yet confirmed by the community. Check opening hours before you go.</ListedNote>

        <div role="group" aria-label="Filter toilets" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {FILTERS.map(x => <Chip key={x.id} on={on.includes(x.id)} onClick={() => toggle(x.id)}>{x.label}</Chip>)}
        </div>
        <p role="status" style={{ fontSize: 14, color: C2.slate, margin: '8px 0 12px', fontFamily: F2 }}>
          {!L.loaded ? 'Loading toilets…' : L.failed ? 'Couldn’t load toilets — check your connection.' : `${list.length} ${list.length === 1 ? 'toilet' : 'toilets'}`}
        </p>

        {shown.map(({ f }) => {
          const d = f.details || {};
          const hrs = hoursLabel(d);
          const rep = L.reportsFor('facility', f.id).find(r => !reportType(r.type)?.positive);
          return (
            <FacilityRow key={f.id} app={app} f={f}
              meta={`${f.suburb || ''}${f.suburb ? ' · ' : ''}${distanceLabel(app.origin, f)}${hrs ? ` · ${hrs}` : ''}`}
              tags={toiletTags(d)}
              alert={rep ? reportType(rep.type)?.banner : null}/>
          );
        })}
        {list.length > shown.length && (
          <V2BigBtn kind="ghost" onClick={() => setLimit(l => l + 20)}>Show {Math.min(20, list.length - shown.length)} more</V2BigBtn>
        )}
        {L.loaded && !L.failed && !list.length && (
          <p style={{ padding: 20, textAlign: 'center', color: C2.slate, fontSize: 15, border: `1.5px dashed ${C2.line}`, borderRadius: 16, fontFamily: F2 }}>
            No toilets match all of those. Try turning a filter off.
          </p>
        )}
        <ToiletAttribution/>
      </div>
    </V2Shell>
  );
}

export { V2Toilets };
