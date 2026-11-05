'use client';

import React from 'react';
import { Icon, ListRow, SPACE } from '../ds';

// Me → links to the business and council areas (separate pages, not app
// screens). Venue owners and council staff get their dashboards; everyone
// else gets the free "claim your business" link. Rows for a <List>.
function usePortalRows() {
  const [access, setAccess] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/me/portals').then(r => (r.ok ? r.json() : null)).then(setAccess, () => {});
  }, []);
  const rows = [];
  if (access?.council) rows.push({ href: '/council', l: 'Council dashboard', m: 'Gaps, unmet needs and DIAP reporting', icon: 'map' });
  if (access?.venues) rows.push({ href: '/business', l: access.venues === 1 ? 'Your venue dashboard' : 'Your venue dashboards', m: 'Views, reviews, replies and needs cards', icon: 'home' });
  else if (access?.pendingClaims) rows.push({ href: '/business', l: 'Your business claim', m: 'Waiting for the pilot team to check it', icon: 'clock' });
  else rows.push({ href: '/business', l: 'Own or run a venue?', m: 'Claim it free — reply to reviews and get guests’ needs cards', icon: 'flag' });
  return rows.map(r => (
    <ListRow key={r.href + r.l} href={r.href} padX={SPACE.md} title={r.l} subtitle={r.m}
      leading={<Icon name={r.icon} size={22}/>}/>
  ));
}

export { usePortalRows };
