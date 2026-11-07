'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Card, SPACE, SectionHeader, SourceBadge, TYPE } from '../ds';
import { UserText, useFormat, useT } from '../i18n';

// The venue's own phone, website and opening hours ("Venue says"). What
// OpenStreetMap lists stays underneath — nothing is overwritten. Contact
// details only: never part of a verdict.
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

function Row({ label, value, osm, href, external }) {
  const t = useT();
  if (!value) return null;
  const link = { color: C2.teal, fontWeight: 700, display: 'inline-flex', alignItems: 'center', minHeight: 44, overflowWrap: 'anywhere' };
  return (
    <div style={{ padding: `${SPACE.xs}px 0`, borderTop: `1px solid ${C2.hair}` }}>
      <dt style={{ ...TYPE.footnote, fontWeight: 700, color: C2.slate }}>{label}</dt>
      <dd style={{ margin: 0, ...TYPE.body, color: C2.char, whiteSpace: 'pre-line' }}>
        {href ? (
          <a href={href} style={link} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {value}{external && <span className="ra-sr-only"> {t('common.opensNewTab')}</span>}
          </a>
        ) : <UserText>{value}</UserText>}
        {osm && osm !== value && (
          <span style={{ display: 'block', ...TYPE.caption, color: C2.slate }}>{t('owner.fix.osm', { value: osm })}</span>
        )}
      </dd>
    </div>
  );
}

function VenueCorrections({ venue, corrections: c }) {
  const t = useT();
  const fmt = useFormat();
  if (!c || !(c.phone || c.website || c.hours)) return null;
  const id = `venue-fix-h-${venue.id}`;
  return (
    <Card as="section" aria-labelledby={id} style={{ border: `1.5px dashed ${C2.line}`, marginBottom: SPACE.md }}>
      <SectionHeader id={id} title={t('owner.fix.title')} size="sm"/>
      <div style={{ marginBottom: SPACE.xs }}><SourceBadge source="venue">{t('owner.notice.badge', { date: fmt.date(c.at) })}</SourceBadge></div>
      <dl style={{ margin: 0 }}>
        <Row label={t('owner.fix.phone')} value={c.phone} osm={c.osm?.phone} href={c.phone ? 'tel:' + c.phone.replace(/[^+\d]/g, '') : null}/>
        <Row label={t('owner.fix.website')} value={c.website ? host(c.website) : null} osm={c.osm?.website ? host(c.osm.website) : null} href={c.website} external/>
        <Row label={t('owner.fix.hours')} value={c.hours} osm={c.osm?.hours}/>
      </dl>
    </Card>
  );
}

export { VenueCorrections };
