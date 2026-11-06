'use client';
// Getting there 2 (I2) · what the Facility screen shows for an 'arrival'
// listing (accessible parking, drop-off, accessible stop, wharf): the tags
// OpenStreetMap has, as "unconfirmed", plus attribution and a fix link.

import React from 'react';
import { COUNCIL_ACCESS_MAP, OSM } from '@/lib/arrival/places';
import { C2, M2 } from '../ui/palette';
import { Banner, Card, List, ListRow, SectionHeader, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { ExtLink, withParts } from '../layers/bits';

function Mark({ ok }) {
  const sym = ok === true ? '✓' : ok === false ? '✗' : 'i';
  const bg = ok === true ? C2.teal : ok === false ? C2.red : '#475569';
  return (
    <span aria-hidden="true" style={{
      width: 22, height: 22, borderRadius: 999, background: bg, color: C2.paper, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
    }}>{sym}</span>
  );
}

/** The listed tags as lines: { ok: true|false|null, t, lang? }. */
export function arrivalFacts(f, t) {
  const d = f.details || {};
  const out = [];
  const add = (ok, text, lang) => out.push({ ok, t: text, lang });
  if (f.kind === 'accessible_parking') {
    add(true, d.spaces ? t('nearby.fact.spaces', { count: d.spaces }) : t('nearby.fact.spacesUnknown'));
    if (d.fee === 'yes') add(null, t('nearby.fact.fee'));
    if (d.fee === 'no') add(true, t('nearby.fact.free'));
    if (d.maxstay) add(null, t('nearby.fact.maxstay', { time: d.maxstay }));
    if (d.operator) add(null, t('nearby.fact.operator', { name: d.operator }));
    add(null, t('nearby.fact.permit'));
  }
  if (f.kind === 'drop_off') {
    add(null, d.dropOff === 'taxi_rank' ? t('nearby.fact.taxi') : t('nearby.fact.dropOff'));
  }
  if (f.kind === 'accessible_stop' || f.kind === 'wharf') {
    add(d.wheelchair === 'limited' ? null : true, d.wheelchair === 'limited' ? t('nearby.fact.wheelchairLimited') : t('nearby.fact.wheelchair'));
    if (d.ref) add(null, t('nearby.fact.ref', { ref: d.ref }));
    if (d.shelter != null) add(d.shelter, d.shelter ? t('nearby.fact.shelter') : t('nearby.fact.noShelter'));
    if (d.bench != null) add(d.bench, d.bench ? t('nearby.fact.bench') : t('nearby.fact.noBench'));
    if (d.tactilePaving != null) add(d.tactilePaving, d.tactilePaving ? t('nearby.fact.tactile') : t('nearby.fact.noTactile'));
  }
  return out;
}

export function ArrivalFacilityDetails({ app, f }) {
  const t = useT();
  const d = f.details || {};
  const facts = arrivalFacts(f, t);
  const title = t('nearby.fact.title');
  return (
    <>
      <Card padding={0} style={{ marginBottom: SPACE.sm }}>
        <SectionHeader size="sm" title={title} style={{ padding: `${SPACE.md}px ${SPACE.md}px 0`, marginBottom: 4 }}/>
        <List label={title}>
          {facts.map(x => (
            <ListRow key={x.t} dense padX={SPACE.md} leading={<Mark ok={x.ok}/>}
              title={<span style={{ fontWeight: 500 }}>{x.ok === false && <span className="ra-sr-only">{t('layers.fact.no')}</span>}{x.t}</span>}/>
          ))}
        </List>
      </Card>
      {d.lowTideNote && (
        <Banner tone="info" style={{ marginBottom: SPACE.sm }}>
          {f.description ? <span lang="en-AU">{f.description}</span> : t('nearby.fact.lowTide')}
          {d.rampFacilityId && app.layers.facilityById(d.rampFacilityId) && (
            <>{' '}<button type="button" onClick={() => app.goto('facility', d.rampFacilityId)} style={{
              background: 'none', border: 0, padding: '12px 0', margin: 0, font: 'inherit', fontWeight: 700,
              color: C2.teal, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
            }}>{t('nearby.fact.rampLink')}</button></>
          )}
        </Banner>
      )}
      {f.kind === 'accessible_parking' && (
        <p style={{ ...TYPE.footnote, color: C2.slate, lineHeight: 1.55, margin: `0 0 ${SPACE.sm}px` }}>
          {withParts(t('nearby.council'), { link: <ExtLink href={COUNCIL_ACCESS_MAP.url} lang="en-AU">{COUNCIL_ACCESS_MAP.name}</ExtLink> })}
        </p>
      )}
    </>
  );
}

export function ArrivalAttribution({ f }) {
  const t = useT();
  const osm = (f.details || {}).osm || [];
  return (
    <div style={{ ...TYPE.footnote, color: C2.slate, lineHeight: 1.55, margin: `${SPACE.lg}px 0 0` }}>
      <p style={{ margin: '0 0 4px' }}>
        {withParts(t('nearby.attribution'), {
          osm: <ExtLink href={OSM.copyrightUrl} lang="en">{OSM.credit}</ExtLink>,
          licence: <ExtLink href={OSM.licenceUrl} lang="en">{OSM.licence}</ExtLink>,
        })}
      </p>
      {osm[0] && (
        <p style={{ margin: 0 }}>
          {withParts(t('nearby.fix'), { link: <ExtLink href={OSM.fixUrl(osm[0])}>{t('nearby.fixLink')}</ExtLink> })}
        </p>
      )}
    </div>
  );
}

