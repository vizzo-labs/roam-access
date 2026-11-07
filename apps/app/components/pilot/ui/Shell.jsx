'use client';

import React from 'react';
import { C2 } from './palette';
import { useT } from '../i18n/I18nProvider';
import { TabBar } from '../ds/TabBar';

// ── Screen scaffold ───────────────────────────────────────────────────────
// Flex column: scrollable content + fixed chrome (action bar, tabs) below it,
// so nothing ever hides under the chrome and the chrome never scrolls away.
function V2Shell({ children, bg = null, scroll = true, bar = null, tabs = null, app = null, active = 'find' }) {
  return (
    <div className="v2-screen" style={{ background: bg || C2.paper }}>
      {scroll
        ? <div className="v2-scroll">{children}</div>
        : <div className="v2-fixed">{children}</div>}
      {bar}
      {tabs && app && <V2TabBar active={active} app={app}/>}
    </div>
  );
}

// Find · Saved · Me (ds/TabBar). `active` is the tab id ('home' is an old
// name for 'find').
function V2TabBar({ active, app }) {
  const t = useT();
  if (app.wide) return null; // the web layout's header carries navigation
  const items = [
    { id: 'find',  label: t('app.nav.find'),  icon: 'search' },
    { id: 'saved', label: t('app.nav.saved'), icon: 'bookmark', count: app.unseenUpdates, countSr: app.unseenUpdates ? t('owner.updates.newSr', { count: app.unseenUpdates }) : null },
    { id: 'me',    label: t('app.nav.me'),    icon: 'user' },
  ];
  return <TabBar label={t('app.nav.primary')} items={items} active={active === 'home' ? 'find' : active} onSelect={id => app.goto(id)}/>;
}

export { V2Shell, V2TabBar };
