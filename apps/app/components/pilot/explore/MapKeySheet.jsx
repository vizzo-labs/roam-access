'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { CheckRow, SPACE, Sheet, TYPE } from '../ds';
import { useT } from '../i18n';
import { PLACE_ICONS, PLACE_ICON_LEGEND, legendSymbols } from '../PilotMap';
import { PIN, pinLabels } from '../WebLayout';

// "Key" on the phone map: what the markers mean, in a dialog — so no legend
// ever covers the map. Every place in view is on the map: zoomed out it's a
// dot, closer in a shape with the kind of place, at street zoom a pin. The
// verdict is colour AND shape (circle · diamond · octagon) and, on a pin, a
// mark; grey = no info yet. `onShowUnknown` adds the "No info yet" switch.
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
            <span aria-hidden="true" style={{ lineHeight: 0, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, width: 86 }}
              dangerouslySetInnerHTML={{ __html: legendSymbols(k, PIN.colors, PIN.icons, { dot: 1.4, mark: 24, pin: 32 }) }}/>
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
