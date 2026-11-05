'use client';

import React from 'react';
import { V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { Button, ChipGroup, EmptyState, FilterChip, GUTTER, List, SkeletonList, SPACE, TYPE } from '../ds';
import { FacilityRow, ListedNote, ToiletAttribution } from '../layers/bits';
import { distanceLabel, hoursLabel, metres, reportBanner, reportType, toiletTagLabels } from '../layers/layerUtils';
import { useT } from '../i18n';

// ─────────────────────────────────────────────────────────────
// TOILETS — the list equivalent of the map's toilet layer
// ─────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'accessible', label: 'layers.toilets.f.accessible', test: d => d.accessible || d.adultChange || d.changingPlaces },
  { id: 'mlak', label: 'layers.toilets.f.mlak', test: d => d.mlak24 || d.mlakAfterHours },
  { id: 'adult', label: 'layers.toilets.f.adult', test: d => d.adultChange || d.changingPlaces },
];

function V2Toilets({ app }) {
  const t = useT();
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
        <V2Back app={app} to="home" label={t('layers.backHome')}/>
        {!app.wide && (
          <Button variant="ghost" size="sm" icon="map" onClick={() => { L.setShown('toilets', true); app.goto('map'); }}>{t('layers.showOnMap')}</Button>
        )}
      </div>
      <div style={{ padding: `18px ${GUTTER}px 24px` }}>
        <h1 ref={h} tabIndex={-1} style={{ ...TYPE.title1, margin: '0 0 6px' }}>
          {t('layers.toilets.title')}<span aria-hidden="true" style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ ...TYPE.callout, color: C2.slate, margin: `0 0 ${SPACE.md}px` }}>
          {t('layers.toilets.intro', { origin: app.origin.mine ? t('data.yourLocation') : app.origin.name })}
        </p>
        <ListedNote>{t('layers.toilets.listed')}</ListedNote>

        <ChipGroup label={t('layers.toilets.filter')} wrap>
          {FILTERS.map(x => <FilterChip key={x.id} selected={on.includes(x.id)} onChange={sel => set(x.id, sel)} style={{ whiteSpace: 'normal' }}>{t(x.label)}</FilterChip>)}
        </ChipGroup>
        <p role="status" style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.sm}px 0` }}>
          {!L.loaded ? '' : L.failed ? t('layers.toilets.loadFailed') : t('layers.toilets.count', { count: list.length })}
        </p>

        {!L.loaded && <SkeletonList label={t('layers.toilets.loading')} count={4} padX={0}/>}
        {shown.length > 0 && (
          <List label={t('layers.toilets.list')} inset>
            {shown.map(({ f }) => {
              const d = f.details || {};
              const hrs = hoursLabel(d);
              const rep = L.reportsFor('facility', f.id).find(r => !reportType(r.type)?.positive);
              return (
                <FacilityRow key={f.id} app={app} f={f}
                  subtitle={`${f.suburb ? `${f.suburb} · ` : ''}${distanceLabel(app.origin, f, t)}${hrs ? ` · ${hrs}` : ''}`}
                  tags={toiletTagLabels(d, t)} alert={rep ? reportBanner(t, rep.type) : null}/>
              );
            })}
          </List>
        )}
        {list.length > shown.length && (
          <Button variant="ghost" full onClick={() => setLimit(l => l + 20)} style={{ marginTop: SPACE.sm }}>
            {t('layers.toilets.more', { count: Math.min(20, list.length - shown.length) })}
          </Button>
        )}
        {L.loaded && !L.failed && !list.length && (
          <EmptyState compact icon="filter" title={t('layers.toilets.none')}
            body={t('layers.toilets.noneBody')} action={{ label: t('layers.toilets.showAll'), onClick: () => setOn(['accessible']) }}/>
        )}
        <ToiletAttribution/>
      </div>
    </V2Shell>
  );
}

export { V2Toilets };
