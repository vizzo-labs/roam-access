'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Card, SPACE, SectionHeader, SourceBadge, TYPE } from '../ds';
import { UserText, useFormat, useT } from '../i18n';

// Updates a verified venue posts ("Lift out of service until Friday").
// Always labelled "Venue says · <date>" and kept apart from community facts:
// they never change the verdict (honesty rule). Expired or hidden ones never
// reach the app (lib/data/owners.ts → getLiveNotices).

function NoticeItem({ notice, compact = false }) {
  const t = useT();
  const fmt = useFormat();
  return (
    <div>
      <SourceBadge source="venue">{t('owner.notice.badge', { date: fmt.date(notice.at) })}</SourceBadge>
      <p style={{ ...(compact ? TYPE.footnote : TYPE.body), color: C2.char, margin: `${SPACE.xxs + 2}px 0 0`, whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
        <UserText>{notice.body}</UserText>
      </p>
      {notice.endsOn && (
        <p style={{ ...TYPE.caption, color: C2.slate, margin: '2px 0 0' }}>{t('owner.notice.until', { date: fmt.date(notice.endsOn) })}</p>
      )}
    </div>
  );
}

// The venue page: every live update, newest first.
function VenueNotices({ venue, style }) {
  const t = useT();
  const notices = venue.notices || [];
  if (!notices.length) return null;
  const id = `venue-notices-h-${venue.id}`;
  return (
    <Card as="section" aria-labelledby={id} style={{ border: `1.5px dashed ${C2.line}`, marginBottom: SPACE.md, ...style }}>
      <SectionHeader id={id} title={t('owner.notice.title', { name: venue.name })} size="sm" description={t('owner.notice.desc')}/>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
        {notices.map(n => <li key={n.id}><NoticeItem notice={n}/></li>)}
      </ul>
    </Card>
  );
}

// The map preview card: the newest update, and how many more.
function NoticeLine({ venue, style }) {
  const t = useT();
  const notices = venue.notices || [];
  if (!notices.length) return null;
  return (
    <div style={{ borderLeft: `4px solid ${C2.line}`, background: C2.stone, borderRadius: '0 12px 12px 0', padding: '8px 12px', ...style }}>
      <NoticeItem notice={notices[0]} compact/>
      {notices.length > 1 && <p style={{ ...TYPE.caption, color: C2.slate, margin: '4px 0 0' }}>{t('owner.notice.more', { count: notices.length - 1 })}</p>}
    </div>
  );
}

export { VenueNotices, NoticeLine, NoticeItem };
