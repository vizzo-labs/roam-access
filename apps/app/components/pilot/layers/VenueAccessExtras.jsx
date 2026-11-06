'use client';
// What the access layers add to a venue page: today's reports (banner),
// partner programs (the partner's claim), the nearest accessible toilet, and
// "Report a temporary problem". None of it changes the verdict.

import React from 'react';
import { C2 } from '../ui/palette';
import { Badge, Card, List, ListRow, SectionHeader, SourceBadge, SPACE, TYPE } from '../ds';
import { UserText, useT } from '../i18n';
import { TempReportBanner, ReportButton } from './TempReports';
import { FacilityPin } from './bits';
import { badgeDef, badgeText, distanceLabel, nearestToilet, toiletTagLabels, walkMins } from './layerUtils';

export function VenueReportsBanner({ app, venue }) {
  return <TempReportBanner app={app} reports={app.layers.reportsFor('venue', venue.id)} placeName={venue.name}/>;
}

export function PartnerBadges({ badges }) {
  const t = useT();
  const defs = (badges || []).map(b => ({ b, d: badgeDef(b.badge) })).filter(x => x.d);
  if (!defs.length) return null;
  return (
    <Card padding={0} style={{ marginBottom: 10 }}>
      <section aria-labelledby="partner-h">
        <SectionHeader id="partner-h" size="sm" title={t('layers.badges.title')}
          description={t('layers.badges.desc')}
          style={{ padding: `${SPACE.md}px ${SPACE.md}px 0` }}/>
        <List label={t('layers.badges.title')}>
          {defs.map(({ b, d }) => (
            <ListRow key={b.badge} padX={SPACE.md} leading={<BadgeMark/>} title={badgeText(t, d.id, 'label')}
              subtitle={<>{badgeText(t, d.id, 'what')}{b.note ? <> <UserText>{b.note}</UserText></> : null}</>}
              meta={
                <span style={{ display: 'flex', gap: SPACE.xs, alignItems: 'center', flexWrap: 'wrap' }}>
                  <SourceBadge source="partner">{t('layers.badges.claim', { partner: d.partner })}</SourceBadge>
                  <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={t('layers.badges.sourceFor', { label: badgeText(t, d.id, 'label') })}
                    style={{ ...TYPE.footnote, color: C2.teal, fontWeight: 600, padding: '12px 0' }}>
                    {t('layers.badges.source')}
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
  const t = useT();
  const near = nearestToilet(app.layers.facilities, venue);
  if (!near) return null;
  const f = near.facility;
  const tags = toiletTagLabels(f.details || {}, t, ['accessible']);
  const closed = app.layers.reportsFor('facility', f.id).some(r => r.type === 'toilet_closed');
  const mins = walkMins(venue, f);
  return (
    <List label={t('layers.nearest.title')} inset style={{ marginBottom: 10 }}>
      <ListRow padX={SPACE.md} leading={<FacilityPin f={f}/>} onClick={() => app.goto('facility', f.id)}
        title={<><span style={{ display: 'block', ...TYPE.caption, color: C2.slate, marginBottom: 2 }}>{t('layers.nearest.listed')}</span>{f.name}</>}
        subtitle={`${mins <= 40 ? t('layers.nearest.walkFromHere', { mins }) : distanceLabel(venue, f, t)}${tags.length ? ` · ${tags.join(' · ')}` : ''}`}
        meta={closed ? <Badge tone="warn" size="sm">{t('layers.nearest.closed')}</Badge> : null}/>
    </List>
  );
}

// The venue page's block: badges, nearest toilet, report button.
// `nearestToilet={false}` when Getting there already lists it (I2).
export function VenueAccessExtras({ app, venue, nearestToilet = true }) {
  return (
    <>
      <PartnerBadges badges={app.layers.badgesFor(venue.id)}/>
      {nearestToilet && <NearestToilet app={app} venue={venue}/>}
      <ReportButton app={app} target={{ type: 'venue', id: venue.id, where: 'venue', name: venue.name }} style={{ marginBottom: 10 }}/>
    </>
  );
}
