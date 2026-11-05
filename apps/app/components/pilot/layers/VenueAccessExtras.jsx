'use client';
// What the access layers add to a venue page: today's reports (banner),
// partner programs (the partner's claim), the nearest accessible toilet, and
// "Report a temporary problem". None of it changes the verdict.

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { TempReportBanner, ReportButton } from './TempReports';
import { badgeDef, nearestToilet, walkMins, toiletTags, distanceLabel } from './layerUtils';

export function VenueReportsBanner({ app, venue }) {
  return <TempReportBanner app={app} reports={app.layers.reportsFor('venue', venue.id)} placeName={venue.name}/>;
}

export function PartnerBadges({ badges, style = {} }) {
  if (!badges || !badges.length) return null;
  return (
    <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10, fontFamily: F2, ...style }}>
      <h2 style={{ padding: '16px 18px 4px', fontSize: 14, fontWeight: 700, color: C2.teal, margin: 0, letterSpacing: '0.02em' }}>PARTNER PROGRAMS</h2>
      <p style={{ padding: '0 18px 8px', margin: 0, fontSize: 13.5, color: C2.slate, lineHeight: 1.45 }}>
        What partner programs say about this place. Not a community review — it doesn’t change the verdict.
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {badges.map(b => {
          const d = badgeDef(b.badge);
          if (!d) return null;
          return (
            <li key={b.badge} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
              <BadgeMark/>
              <span style={{ fontSize: 15.5, lineHeight: 1.45, color: C2.char }}>
                <strong style={{ display: 'block' }}>{d.label}</strong>
                <span style={{ display: 'block' }}>{d.what}</span>
                {b.note && <span style={{ display: 'block', color: C2.slate }}>{b.note}</span>}
                <span style={{ display: 'block', fontSize: 13.5, color: C2.slate, marginTop: 2 }}>
                  {d.partner}’s claim ·{' '}
                  <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: C2.teal, fontWeight: 600 }}>
                    Source<span className="ra-sr-only"> for {d.label} (opens in a new tab)</span>
                  </a>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Rosette: a partner's mark, deliberately not a verdict shape or colour.
export function BadgeMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0, marginTop: 1 }}>
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
    <button type="button" onClick={() => app.goto('facility', f.id)} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 10,
      background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 16,
    }}>
      <ToiletIcon/>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C2.slate, letterSpacing: '0.02em' }}>NEAREST ACCESSIBLE TOILET (LISTED)</span>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C2.char }}>{f.name}</span>
        <span style={{ display: 'block', fontSize: 14, color: C2.slate, lineHeight: 1.4 }}>
          {mins <= 40 ? `${mins} min walk from here` : distanceLabel(venue, f)}{tags.length ? ` · ${tags.join(' · ')}` : ''}
        </span>
        {closed && <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C2.char, marginTop: 2 }}>⚠ Reported closed today</span>}
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
        <path d="M9 5l7 7-7 7" stroke={C2.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

export function ToiletIcon({ size = 28, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d={TOILET_PATH} stroke={color || C2.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export const TOILET_PATH = 'M6 3h5v7H6zM4 10h15v1.5A6.5 6.5 0 0 1 12.5 18h-2A6.5 6.5 0 0 1 4 11.5V10ZM9 18l-1 3h7l-1-3';

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
