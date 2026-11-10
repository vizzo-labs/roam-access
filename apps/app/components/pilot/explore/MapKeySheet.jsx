'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { CheckRow, SPACE, Sheet, TYPE } from '../ds';
import { useT } from '../i18n';
import { PLACE_ICONS, PLACE_ICON_LEGEND, dotSvg, markSvg, pinSvg } from '../PilotMap';
import { PIN, pinLabels } from '../WebLayout';

// "Key" on the phone map: what the pins mean, in a dialog — so no legend
// ever covers the map. Verdict = colour + mark + words; the picture inside a
// pin is the kind of place.
// Zoomed out, the verdict is also the SHAPE (circle · diamond · octagon), so
// each row shows the shape and the pin. `onShowUnknown` adds the opt-in for
// "No info yet" dots at every zoom.
function MapKeySheet({ open, onClose, showUnknown = false, onShowUnknown = null }) {
  const t = useT();
  const labels = pinLabels(t);
  const row = { display: 'flex', alignItems: 'center', gap: SPACE.sm, ...TYPE.body, color: C2.char };
  return (
    <Sheet open={open} onClose={onClose} title={t('find.map.keyTitle')} position="fixed">
      <p style={{ ...TYPE.callout, color: C2.char, margin: `0 0 ${SPACE.md}px` }}>{t('find.map.keyLead')}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
        {['works', 'check', 'barrier', 'unknown'].map(k => (
          <li key={k} style={row}>
            <span aria-hidden="true" style={{ lineHeight: 0, flexShrink: 0, display: 'inline-flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, width: 64 }} dangerouslySetInnerHTML={{ __html: k === 'unknown'
              ? dotSvg({ w: 16, fill: PIN.colors.unknown }) + pinSvg({ w: 32, fill: C2.paper, stroke: PIN.colors.unknown, iconColor: PIN.colors.unknown, icon: 'food', badge: PIN.icons.unknown, badgeColor: PIN.colors.unknown })
              : markSvg({ w: 24, kind: k, fill: PIN.colors[k], icon: 'food' }) + pinSvg({ w: 32, fill: PIN.colors[k], stroke: C2.paper, iconColor: C2.paper, icon: 'food', badge: PIN.icons[k], badgeColor: PIN.colors[k] }) }}/>
            <span style={{ fontWeight: 700 }}>{labels[k]}</span>
          </li>
        ))}
      </ul>
      <p style={{ ...TYPE.callout, color: C2.char, margin: `${SPACE.sm}px 0 0` }}>{t('find.map.shapes')}</p>
      {onShowUnknown && (
        <CheckRow checked={showUnknown} onChange={onShowUnknown} label={t('find.map.showUnknown')} hint={t('find.map.showUnknownHint')}
          style={{ marginTop: SPACE.md }}/>
      )}
      <p style={{ ...TYPE.callout, color: C2.char, margin: `${SPACE.lg}px 0 ${SPACE.xs}px` }}>{t('find.map.symbols')}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 9em), 1fr))', gap: `${SPACE.xs}px ${SPACE.md}px` }}>
        {PLACE_ICON_LEGEND.map(([id]) => (
          <li key={id} style={{ ...row, ...TYPE.callout }}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d={PLACE_ICONS[id]} fill="none" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t(`app.map.legend.${id}`)}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export { MapKeySheet };
