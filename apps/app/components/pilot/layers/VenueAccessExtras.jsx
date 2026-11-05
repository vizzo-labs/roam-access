'use client';
// What the access layers add to a venue page: today's reports (banner),
// partner programs (the partner's claim), the nearest accessible toilet, and
// "Report a temporary problem". None of it changes the verdict.

import React from 'react';
import { C2 } from '../ui/palette';
import { Badge, Card, List, ListRow, SectionHeader, SourceBadge, SPACE, TYPE } from '../ds';
import { TempReportBanner, ReportButton } from './TempReports';
import { FacilityPin } from './bits';
import { badgeDef, distanceLabel, nearestToilet, toiletTags, walkMins } from './layerUtils';

export function VenueReportsBanner({ app, venue }) {
  return <TempReportBanner app={app} reports={app.layers.reportsFor('venue', venue.id)} placeName={venue.name}/>;
}

export function PartnerBadges({ badges }) {
  const defs = (badges || []).map(b => ({ b, d: badgeDef(b.badge) })).filter(x => x.d);
  if (!defs.length) return null;
  return (
    <Card padding={0} style={{ marginBottom: 10 }}>
      <section aria-labelledby="partner-h">
        <SectionHeader id="partner-h" size="sm" title="Partner programs"
          description="What partner programs say about this place. Not a community review — it doesn’t change the verdict."
          style={{ padding: `${SPACE.md}px ${SPACE.md}px 0` }}/>
        <List label="Partner programs">
          {defs.map(({ b, d }) => (
            <ListRow key={b.badge} padX={SPACE.md} leading={<BadgeMark/>} title={d.label}
              subtitle={<>{d.what}{b.note ? ` ${b.note}` : ''}</>}
              meta={
                <span style={{ display: 'flex', gap: SPACE.xs, alignItems: 'center', flexWrap: 'wrap' }}>
                  <SourceBadge source="partner">{d.partner}’s claim</SourceBadge>
                  <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ ...TYPE.footnote, color: C2.teal, fontWeight: 600, padding: '12px 0' }}>
                    Source<span className="ra-sr-only"> for {d.label} (opens in a new tab)</span>
                  </a>
                </span>
              }/>
          ))}
        </List>
      </section>
    </Card>
  );
}

// Rosette: a partner's mark, deliberately not a verdict shape.
export function BadgeMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="9.5" r="7" fill="none" stroke={C2.teal} strokeWidth="2"/>
      <path d="M8 15.5 6.5 22l5.5-3 5.5 3-1.5-6.5" fill="none" stroke={C2.teal} strokeWidth="2" strokeLinejoin="round"/>
      <path d="m9 9.5 2 2 4-4" fill="none" stroke={C2.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function NearestToilet({ app, venue }) {
  const near = nearestToilet(app.layers.facilities, venue);
  if (!near) return null;
  const f = near.facility;
  const tags = toiletTags(f.details || {}).filter(t => t !== 'Accessible');
  const closed = app.layers.reportsFor('facility', f.id).some(r => r.type === 'toilet_closed');
  const mins = walkMins(venue, f);
  return (
    <List label="Nearest accessible toilet" inset style={{ marginBottom: 10 }}>
      <ListRow padX={SPACE.md} leading={<FacilityPin f={f}/>} onClick={() => app.goto('facility', f.id)}
        title={<><span style={{ display: 'block', ...TYPE.caption, color: C2.slate, marginBottom: 2 }}>Nearest accessible toilet (listed)</span>{f.name}</>}
        subtitle={`${mins <= 40 ? `${mins} min walk from here` : distanceLabel(venue, f)}${tags.length ? ` · ${tags.join(' · ')}` : ''}`}
        meta={closed ? <Badge tone="warn" size="sm">Reported closed today</Badge> : null}/>
    </List>
  );
}

// The venue page's block: badges, nearest toilet, report button.
export function VenueAccessExtras({ app, venue }) {
  return (
    <>
      <PartnerBadges badges={app.layers.badgesFor(venue.id)}/>
      <NearestToilet app={app} venue={venue}/>
      <ReportButton app={app} target={{ type: 'venue', id: venue.id, where: 'venue', name: venue.name }} style={{ marginBottom: 10 }}/>
    </>
  );
}
