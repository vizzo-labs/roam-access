'use client';
// Small building blocks for the access-layer screens, on the design system.

import React from 'react';
import { NPTM, CHANGING_PLACES_FINDER } from '@/lib/layers/defs';
import { C2 } from '../ui/palette';
import { facilitySvg } from '../PilotMap';
import { Badge, Banner, Chip, ListRow, SectionHeader, SPACE, TYPE } from '../ds';
import { FACILITY_ICON } from './layerUtils';

// An inline text link that opens a new tab and says so.
export function ExtLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C2.teal, fontWeight: 600 }}>
      {children}<span className="ra-sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function SectionHead({ children, sub, id }) {
  return <SectionHeader id={id} title={children} description={sub} style={{ marginTop: SPACE.xl }}/>;
}

// The square facility pin, same as on the map (decorative).
export function FacilityPin({ f, size = 26 }) {
  return (
    <span aria-hidden="true" style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: facilitySvg({
      w: size, icon: FACILITY_ICON[f.kind] || 'water',
      muted: f.kind === 'toilet' && !f.details?.accessible && !f.details?.adultChange,
    }) }}/>
  );
}

// One facility in a List: pin, name, distance, tags, today's problem.
export function FacilityRow({ app, f, subtitle, tags = [], alert = null }) {
  const meta = (tags.length || alert) ? (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {alert && <Badge tone="warn" size="sm">{alert}</Badge>}
      {tags.map(t => <Chip key={t} style={{ minHeight: 28, padding: '3px 10px', fontSize: 13, whiteSpace: 'normal', flexShrink: 1 }}>{t}</Chip>)}
    </span>
  ) : null;
  return (
    <ListRow title={f.name} subtitle={subtitle} meta={meta} leading={<FacilityPin f={f}/>}
      onClick={() => app.goto('facility', f.id)} padX={SPACE.md}/>
  );
}

export function ToiletAttribution({ facilityUrl }) {
  return (
    <p style={{ ...TYPE.footnote, color: C2.slate, lineHeight: 1.55, margin: `${SPACE.lg}px 0 0` }}>
      Toilet details from the{' '}
      <ExtLink href={NPTM.siteUrl}>{NPTM.name}</ExtLink>, {NPTM.owner},{' '}
      licensed under <ExtLink href={NPTM.licenceUrl}>{NPTM.licence}</ExtLink>.
      {facilityUrl
        ? <> Something wrong? <ExtLink href={facilityUrl}>Update it on the Toilet Map</ExtLink>.</>
        : <> More Changing Places: <ExtLink href={CHANGING_PLACES_FINDER}>Changing Places finder</ExtLink>.</>}
    </p>
  );
}

// "Listed by … — not yet confirmed by the community."
export function ListedNote({ children, style }) {
  return <Banner tone="neutral" style={{ marginBottom: SPACE.md, ...style }}>{children}</Banner>;
}
