'use client';

import React from 'react';
import { Icon, ListRow, SPACE } from '../ds';

// Me → links to the business and council areas (separate pages, not app
// screens). Venue owners and council staff get their dashboards; everyone
// else gets the free "claim your business" link. Rows for a <List>.
// Pass `t` from useT(). (These pages are in English for now.)
function usePortalRows(t) {
  const [access, setAccess] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/me/portals').then(r => (r.ok ? r.json() : null)).then(setAccess, () => {});
  }, []);
  const rows = [];
  if (access?.council) rows.push({ href: '/council', l: t('me.portal.council'), m: t('me.portal.council.sub'), icon: 'map' });
  if (access?.venues) rows.push({ href: '/business', l: t('me.portal.venues', { count: access.venues }), m: t('me.portal.venues.sub'), icon: 'home' });
  else if (access?.pendingClaims) rows.push({ href: '/business', l: t('me.portal.claim'), m: t('me.portal.claim.sub'), icon: 'clock' });
  else rows.push({ href: '/business', l: t('me.portal.own'), m: t('me.portal.own.sub'), icon: 'flag' });
  return rows.map(r => (
    <ListRow key={r.href + r.l} href={r.href} padX={SPACE.md} title={r.l} subtitle={r.m}
      leading={<Icon name={r.icon} size={22}/>}/>
  ));
}

export { usePortalRows };
