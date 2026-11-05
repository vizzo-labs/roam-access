'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { FilterChip, RADIUS, SPACE, TYPE } from '../ds';
import { ENTRANCE_ALTS, ENTRANCE_NOTE_MAX } from '@/lib/trust/entrance';
import { useT } from '../i18n';

// Shown right after "Step-free way in? No": is there another way in without
// steps, and where? One answer at most; tap it again to clear it.
function EntranceQuestion({ value, note, onChange, onNote }) {
  const t = useT();
  return (
    <div style={{
      margin: `0 0 6px`, padding: '12px 14px', borderRadius: RADIUS.md, background: C2.tealSoft, border: `1.5px solid ${C2.line}`,
    }}>
      <div role="group" aria-labelledby="q-entrance">
        <p id="q-entrance" style={{ ...TYPE.label, fontSize: 15.5, lineHeight: 1.35, color: C2.char, margin: `0 0 ${SPACE.sm}px` }}>
          {t('trust.entrance.question')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs }}>
          {ENTRANCE_ALTS.map(a => (
            <FilterChip key={a.id} selected={value === a.id} onChange={on => onChange(on ? a.id : null)}>{t(`trust.entrance.${a.id}.label`)}</FilterChip>
          ))}
        </div>
      </div>
      {value && value !== 'none' && (
        <div style={{ marginTop: SPACE.sm }}>
          <label htmlFor="q-entrance-where" style={{ ...TYPE.headline, fontSize: 15, display: 'block', marginBottom: 6 }}>
            {t('trust.entrance.where')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
          </label>
          <input id="q-entrance-where" type="text" value={note} maxLength={ENTRANCE_NOTE_MAX}
            onChange={e => onNote(e.target.value)} placeholder={t('trust.entrance.placeholder')}
            style={{
              ...TYPE.input, width: '100%', boxSizing: 'border-box', minHeight: 48, borderRadius: RADIUS.sm,
              border: `1.5px solid ${C2.line}`, padding: '0 12px', color: C2.char, background: C2.paper,
            }}/>
        </div>
      )}
    </div>
  );
}

export { EntranceQuestion };
