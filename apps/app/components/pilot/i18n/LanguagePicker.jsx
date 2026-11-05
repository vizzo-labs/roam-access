'use client';
// Language switch (#21) — in Accessibility settings and on Me. Real radio
// buttons; each language's name is written in that language and marked with
// its lang, so a screen reader pronounces it properly. Saved on this device.

import React from 'react';
import { C2 } from '../ui/palette';
import { RADIUS, SPACE, TARGET, TYPE } from '../ds';
import { LOCALES } from '@/lib/i18n/locales';
import { useLocale } from './I18nProvider';

export function LanguagePicker({ idBase = 'lang', compact = false }) {
  const { locale, setLocale, t, machine } = useLocale();
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <legend style={{ ...TYPE.label, fontSize: 15.5, color: C2.char, padding: 0, marginBottom: 2 }}>
        {t('common.language.title')}
      </legend>
      {!compact && <p style={{ ...TYPE.footnote, color: C2.slate, margin: '0 0 8px' }}>{t('common.language.hint')}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: SPACE.xs, marginTop: compact ? SPACE.xs : 0 }}>
        {LOCALES.map(l => {
          const on = l.id === locale;
          const id = `${idBase}-${l.id}`;
          return (
            <label key={l.id} htmlFor={id} style={{
              display: 'flex', alignItems: 'center', gap: SPACE.xs, minHeight: TARGET.std, boxSizing: 'border-box',
              padding: `${SPACE.xs}px ${SPACE.sm}px`, borderRadius: RADIUS.md, cursor: 'pointer',
              border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`, background: on ? C2.tealSoft : C2.paper,
            }}>
              <input type="radio" id={id} name={`${idBase}-locale`} value={l.id} checked={on}
                onChange={() => setLocale(l.id)} style={{ width: 20, height: 20, margin: 0, accentColor: C2.teal, flexShrink: 0 }}/>
              <span style={{ minWidth: 0 }}>
                <span lang={l.html} style={{ ...TYPE.body, display: 'block', fontWeight: on ? 700 : 600, color: C2.char, lineHeight: 1.25 }}>{l.native}</span>
                {l.id !== 'en-AU' && <span lang="en" style={{ ...TYPE.caption, display: 'block', color: C2.slate, fontWeight: 500 }}>{l.english}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {machine && (
        <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xs}px 0 0` }}>{t('common.language.machine')}</p>
      )}
    </fieldset>
  );
}
