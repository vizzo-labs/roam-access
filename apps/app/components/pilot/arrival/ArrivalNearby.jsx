'use client';
// Getting there 2 (I2) · "Parking & transport nearby" — a Getting there slot
// (./slots.js): the nearest accessible parking, drop-off point, accessible
// stop and wharf (OpenStreetMap, always "unconfirmed"), and the nearest
// accessible toilet (National Public Toilet Map). Each row opens the listing;
// the button beside it opens directions. Listings only — never a verdict.

import React from 'react';
import { COUNCIL_ACCESS_MAP, NEARBY_WALK_MINS, OSM } from '@/lib/arrival/places';
import { C2 } from '../ui/palette';
import { Badge, IconButton, List, ListRow, SectionHeader, SkeletonList, SourceBadge, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { ExtLink, FacilityPin, withParts } from '../layers/bits';
import { metres, toiletTagLabels, walkMins } from '../layers/layerUtils';
import { mapsAppName, useMapsApp } from './directions';
import { TOILET_MAX_MINS, arrivalDetails, arrivalName, directionsHref, distanceText, isWalkFrom, nearbyPicks } from './nearbyUtils';

function Row({ app, venueName, f, from, to, label, title, details, source, alert }) {
  const t = useT();
  const [mapsApp] = useMapsApp();
  const appName = mapsAppName(t, mapsApp);
  const mins = walkMins(from, f);
  const walk = mins <= TOILET_MAX_MINS ? t('common.minWalk', { mins }) : null;
  const sub = [walk, distanceText(t, metres(from, f)), ...details].filter(Boolean).join(' · ');
  const walking = isWalkFrom(f);
  return (
    <ListRow padX={SPACE.md} leading={<FacilityPin f={f}/>} onClick={() => app.goto('facility', f.id)} chevron={false}
      title={<><span style={{ display: 'block', ...TYPE.caption, color: C2.slate, marginBottom: 2 }}>{label}</span>{title}</>}
      subtitle={sub}
      meta={<span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{alert}{source}</span>}
      after={
        <IconButton icon="directions" external href={directionsHref(f, to, mapsApp)}
          label={walking ? t('nearby.walkFromLabel', { from: title, to: venueName, app: appName }) : t('nearby.directionsLabel', { name: title, app: appName })}/>
      }/>
  );
}

export function ArrivalNearby({ app, venue, arrival }) {
  const t = useT();
  const L = app.layers;
  const to = arrival?.destination || { lat: venue.lat, lng: venue.lng };
  const from = venue;
  const F = L.facilities;

  const { picks, missing: gaps } = nearbyPicks(F, from);
  const osm = <SourceBadge source="osm"/>;
  const rows = picks.map(({ kind, facility: f }) => {
    const reported = L.reportsFor('facility', f.id);
    if (kind === 'toilet') {
      const closed = reported.some(r => r.type === 'toilet_closed');
      return (
        <Row key={f.id} app={app} venueName={venue.name} f={f} from={from} to={to}
          label={t('nearby.label.toilet')} title={f.name} details={toiletTagLabels(f.details || {}, t, ['accessible'])}
          source={<Badge tone="neutral" icon="info" size="sm">{t('nearby.source.toiletMap')}</Badge>}
          alert={closed ? <Badge tone="warn" size="sm">{t('layers.nearest.closed')}</Badge> : null}/>
      );
    }
    return (
      <Row key={f.id} app={app} venueName={venue.name} f={f} from={from} to={to}
        label={t(`nearby.label.${kind}`)} title={arrivalName(t, f)}
        details={arrivalDetails(t, f)} source={osm}
        alert={reported.length ? <Badge tone="warn" size="sm">{t('nearby.reported')}</Badge> : null}/>
    );
  });
  const missing = gaps.map(k => t(`nearby.missing.${k}`));

  return (
    <section aria-labelledby={`nearby-h-${venue.id}`} style={{ marginBottom: SPACE.md }}>
      <SectionHeader id={`nearby-h-${venue.id}`} level={3} size="sm" title={t('nearby.title')}
        description={t('nearby.desc', { mins: NEARBY_WALK_MINS })}/>
      {!L.loaded ? <SkeletonList count={3} label={t('common.loading')}/> : (
        <>
          {rows.length > 0 && <List label={t('nearby.title')} inset>{rows}</List>}
          {missing.length > 0 && (
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xs}px 0 0` }}>
              {t('nearby.missingLine', { list: missing.join(' · ') })}
            </p>
          )}
          <p style={{ ...TYPE.footnote, color: C2.slate, lineHeight: 1.55, margin: `${SPACE.xs}px 0 0` }}>
            {withParts(t('nearby.council'), {
              link: <ExtLink href={COUNCIL_ACCESS_MAP.url} lang="en-AU">{COUNCIL_ACCESS_MAP.name}</ExtLink>,
            })}
          </p>
          <p style={{ ...TYPE.footnote, color: C2.slate, lineHeight: 1.55, margin: `${SPACE.xs}px 0 0` }}>
            {withParts(t('nearby.attribution'), {
              osm: <ExtLink href={OSM.copyrightUrl} lang="en">{OSM.credit}</ExtLink>,
              licence: <ExtLink href={OSM.licenceUrl} lang="en">{OSM.licence}</ExtLink>,
            })}
          </p>
        </>
      )}
    </section>
  );
}

