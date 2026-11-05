'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';

// Me → links to the business and council areas (separate pages, not app
// screens). Venue owners and council staff get their dashboards; everyone
// else gets the free "claim your business" link.
function MePortals() {
  const [access, setAccess] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/me/portals').then(r => (r.ok ? r.json() : null)).then(setAccess, () => {});
  }, []);

  const rows = [];
  if (access?.council) rows.push({ href: '/council', l: 'Council dashboard', m: 'Gaps, unmet needs and DIAP reporting' });
  if (access?.venues) rows.push({ href: '/business', l: access.venues === 1 ? 'Your venue dashboard' : 'Your venue dashboards', m: 'Views, reviews, replies and needs cards' });
  else if (access?.pendingClaims) rows.push({ href: '/business', l: 'Your business claim', m: 'Waiting for the pilot team to check it' });
  else rows.push({ href: '/business', l: 'Own or run a venue?', m: 'Claim it free — reply to reviews and get guests’ needs cards' });

  return rows.map(r => (
    <a key={r.href + r.l} href={r.href} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      minHeight: 66, padding: '10px 16px', marginBottom: 8, textAlign: 'left', textDecoration: 'none',
      borderRadius: 16, fontFamily: F2, boxSizing: 'border-box', border: `1.5px solid ${C2.line}`, background: C2.paper,
    }}>
      <span>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C2.char, marginBottom: 2 }}>{r.l}</span>
        <span style={{ display: 'block', fontSize: 13, color: C2.slate }}>{r.m}</span>
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
        <path d="M9 5l7 7-7 7" stroke={C2.slate} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  ));
}

export { MePortals };
