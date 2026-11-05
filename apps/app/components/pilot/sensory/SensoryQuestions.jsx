'use client';
// Review form (#17): noise, light and crowds — all optional. Open by default
// for people whose needs make it matter most; one tap away for everyone else.

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, TYPE } from '../ds';
import { CROWD_IDS, DAY_KIND_IDS, LIGHT_IDS, NOISE_IDS, SLOT_IDS } from '@/lib/sensory/defs';
import { useT } from '../i18n';
import { ChoiceRow, dimOptions } from './bits';

export const EMPTY_SENSORY = { noise: null, light: null, crowd: null, slot: null, dayKind: null, quietTimes: [] };
const SENSITIVE = ['autism', 'mental'];
const DIMS = [['noise', NOISE_IDS], ['light', LIGHT_IDS], ['crowd', CROWD_IDS]];
const hasAny = v => !!(v.noise || v.light || v.crowd || v.slot || v.dayKind || v.quietTimes.length);

export function SensoryQuestions({ value, onChange, needs = [] }) {
  const t = useT();
  const [open, setOpen] = React.useState(() => needs.some(n => SENSITIVE.includes(n)) || hasAny(value));
  const firstRef = React.useRef(null);
  // Functional update: quick successive taps never drop an answer.
  const set = (k, x) => onChange(v => ({ ...v, [k]: typeof x === 'function' ? x(v[k]) : x }));
  const slots = SLOT_IDS.map(id => ({ id, label: t(`sensory.slot.${id}.label`) }));

  return (
    <section aria-labelledby="rev-sensory" style={{ marginTop: 22 }}>
      <h2 id="rev-sensory" style={{ ...TYPE.headline, fontSize: 17, color: C2.char, margin: '0 0 4px' }}>
        {t('sensory.form.title')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
      </h2>
      <p style={{ ...TYPE.callout, fontSize: 14.5, color: C2.slate, margin: '0 0 6px' }}>{t('sensory.form.intro')}</p>
      {!open ? (
        <Button variant="outline" size="sm" aria-expanded={false} aria-controls="rev-sensory-body"
          onClick={() => { setOpen(true); requestAnimationFrame(() => firstRef.current?.querySelector('button')?.focus()); }}>
          {t('sensory.form.add')}
        </Button>
      ) : (
        <div id="rev-sensory-body" ref={firstRef}>
          {DIMS.map(([dim, ids], i) => (
            <ChoiceRow key={dim} id={`rev-s-${dim}`} first={i === 0} question={t(`sensory.dim.${dim}.question`)}
              options={dimOptions(t, dim, ids)} value={value[dim]} onChange={x => set(dim, x)}/>
          ))}
          <ChoiceRow id="rev-s-day" question={t('sensory.form.when')} hint={t('sensory.form.whenHint')}
            options={DAY_KIND_IDS.map(id => ({ id, label: t(`sensory.day.${id}.label`) }))}
            value={value.dayKind} onChange={x => set('dayKind', x)}/>
          <div style={{ marginTop: -8 }}>
            <ChoiceRow id="rev-s-slot" first question={t('sensory.form.timeOfDay')} options={slots}
              value={value.slot} onChange={x => set('slot', x)}/>
          </div>
          <ChoiceRow id="rev-s-quiet" multi question={t('sensory.form.usuallyQuiet')} hint={t('sensory.form.chooseAny')}
            options={slots} value={value.quietTimes} onChange={x => set('quietTimes', x)}/>
        </div>
      )}
    </section>
  );
}
