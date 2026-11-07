'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Badge, Button, Card, SPACE, SectionHeader, TYPE } from '../ds';
import { useT } from '../i18n';
import { NoticeItem } from './VenueNotices';

// "Updates from your saved places" on Saved: live updates a saved place
// posted, newest unseen first, each with "Mark as seen". In the app only —
// email and push would hook in at lib/notify.
function SavedUpdates({ app }) {
  const t = useT();
  const headRef = React.useRef(null);
  const list = [...app.updates].sort((a, b) => Number(a.seen) - Number(b.seen));
  if (!list.length) return null;
  const unseen = list.filter(u => !u.seen);
  const mark = (ids) => {
    app.markUpdatesSeen(ids);
    app.toast(t('owner.updates.marked', { count: ids.length }));
    // The button just went away: keep the keyboard in this section.
    requestAnimationFrame(() => headRef.current?.focus());
  };
  return (
    <Card as="section" aria-labelledby="saved-updates-h" style={{ marginBottom: SPACE.md, border: `1.5px dashed ${C2.line}` }}>
      <div ref={headRef} tabIndex={-1} style={{ outline: 'none' }}>
        <SectionHeader id="saved-updates-h" title={t('owner.updates.title')}
          description={unseen.length ? t('owner.updates.newCount', { count: unseen.length }) : t('owner.updates.allSeen')}
          action={unseen.length > 1 ? { label: t('owner.updates.markAll'), onClick: () => mark(unseen.map(u => u.id)) } : null}/>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {list.map((u, i) => (
          <li key={u.id} style={{ padding: `${SPACE.sm}px 0`, borderTop: i ? `1px solid ${C2.hair}` : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, flexWrap: 'wrap', marginBottom: SPACE.xxs }}>
              <a href={`#/venue/${encodeURIComponent(u.venueId)}`}
                onClick={e => { e.preventDefault(); app.goto('venue', u.venueId); }}
                style={{ ...TYPE.headline, color: C2.teal, display: 'inline-flex', alignItems: 'center', minHeight: 44, textUnderlineOffset: 3 }}>
                {u.venueName}
              </a>
              {!u.seen && <Badge tone="teal" size="sm">{t('owner.updates.new')}</Badge>}
            </div>
            <NoticeItem notice={u}/>
            {!u.seen && (
              <Button size="sm" variant="outline" icon="check" onClick={() => mark([u.id])}
                aria-label={t('owner.updates.markAria', { name: u.venueName })} style={{ marginTop: SPACE.xs }}>
                {t('owner.updates.mark')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p style={{ ...TYPE.caption, color: C2.slate, margin: `${SPACE.xs}px 0 0` }}>{t('owner.updates.footer')}</p>
    </Card>
  );
}

export { SavedUpdates };
