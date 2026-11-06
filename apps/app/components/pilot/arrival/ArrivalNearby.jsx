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
import { metres, nearestToilet, toiletTagLabels, walkMins } from '../layers/layerUtils';
import { mapsAppName, useMapsApp } from './directions';
import { arrivalDetails, arrivalName, directionsHref, distanceText, isNearby, nearestOf } from './nearbyUtils';

const TOILET_MAX_MINS = 40;

function Row({ app, venueName, f, from, to, label, title, details, source, alert }) {
  const t = useT();
  const [mapsApp] = useMapsApp();
  const appName = mapsAppName(t, mapsApp);
  const mins = walkMins(from, f);
  const walk = mins <= TOILET_MAX_MINS ? t('common.minWalk', { mins }) : null;
  const sub = [walk, distanceText(t, metres(from, f)), ...details].filter(Boolean).join(' · ');
  const walking = f.kind === 'accessible_stop' || f.kind === 'wharf';
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

  const parking = nearestOf(F, from, ['accessible_parking']);
  const dropOff = nearestOf(F, from, ['drop_off']);
  const stop = nearestOf(F, from, ['accessible_stop']);
  const wharf = nearestOf(F, from, ['wharf']);
  const toilet = nearestToilet(F, from);

  const osm = <SourceBadge source="osm"/>;
  const rows = [];
  const missing = [];
  const add = (n, kind, extra = {}) => {
    const f = n.facility;
    rows.push(
      <Row key={f.id} app={app} venueName={venue.name} f={f} from={from} to={to}
        label={t(`nearby.label.${kind}`)} title={arrivalName(t, f)}
        details={arrivalDetails(t, f)} source={osm}
        alert={L.reportsFor('facility', f.id).length ? <Badge tone="warn" size="sm">{t('nearby.reported')}</Badge> : null}
        {...extra}/>,
    );
  };
  if (isNearby(parking)) add(parking, 'parking'); else missing.push(t('nearby.missing.parking'));
  if (isNearby(dropOff)) add(dropOff, 'dropOff'); else missing.push(t('nearby.missing.dropOff'));
  if (isNearby(stop)) add(stop, 'stop');
  if (isNearby(wharf)) add(wharf, 'wharf');
  if (!isNearby(stop) && !isNearby(wharf)) missing.push(t('nearby.missing.stop'));
  if (toilet && walkMins(from, toilet.facility) <= TOILET_MAX_MINS) {
    const f = toilet.facility;
    const closed = L.reportsFor('facility', f.id).some(r => r.type === 'toilet_closed');
    rows.push(
      <Row key={f.id} app={app} venueName={venue.name} f={f} from={from} to={to}
        label={t('nearby.label.toilet')} title={f.name} details={toiletTagLabels(f.details || {}, t, ['accessible'])}
        source={<Badge tone="neutral" icon="info" size="sm">{t('nearby.source.toiletMap')}</Badge>}
        alert={closed ? <Badge tone="warn" size="sm">{t('layers.nearest.closed')}</Badge> : null}/>,
    );
  }

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

