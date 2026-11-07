'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, Card, Icon, IconButton, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { BADGES } from '@/lib/contributors/badges';

// The small "New badge" moment (Brief L): after a review (Thanks screen) or on
// Me, when the server says a contributor badge was just earned. A polite
// status message with an icon and words; dismissable; one next step.
function NewBadge({ app, showLink = true, style }) {
  const t = useT();
  const ids = app.newBadges || [];
  if (!ids.length) return null;
  const icon = id => BADGES.find(b => b.id === id)?.icon || 'star';
  return (
    <div role="status" style={style}>
      <Card variant="raised" as="section" aria-labelledby="new-badge-h">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.sm }}>
          <span aria-hidden="true" style={{
            width: 44, height: 44, borderRadius: 999, background: C2.rust, color: C2.paper, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name={icon(ids[0])} size={22}/></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="new-badge-h" style={{ ...TYPE.headline, margin: '0 0 2px', color: C2.char }}>{t('contrib.newBadge.title', { count: ids.length })}</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {ids.map(id => (
                <li key={id} style={{ ...TYPE.callout, color: C2.char }}>
                  {t('contrib.newBadge.item', { name: t(`contrib.badge.${id}`), desc: t(`contrib.badge.${id}.desc`) })}
                </li>
              ))}
            </ul>
            {showLink && (
              <Button variant="plain" size="sm" onClick={() => { app.clearNewBadges(); app.goto('me'); }} style={{ padding: 0, minHeight: 44 }}>
                {t('contrib.newBadge.see')}
              </Button>
            )}
          </div>
          <IconButton icon="close" variant="ghost" size="sm" label={t('contrib.newBadge.dismiss')} onClick={app.clearNewBadges}/>
        </div>
      </Card>
    </div>
  );
}

export { NewBadge };
