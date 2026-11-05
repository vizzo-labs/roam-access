'use client';
// Review form (#17): noise, light and crowds — all optional. Open by default
// for people whose needs make it matter most; one tap away for everyone else.

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, SPACE, TYPE } from '../ds';
import { DAY_KINDS, SENSORY_DIMS, SLOTS } from '@/lib/sensory/defs';
import { ChoiceRow } from './bits';

export const EMPTY_SENSORY = { noise: null, light: null, crowd: null, slot: null, dayKind: null, quietTimes: [] };
const SENSITIVE = ['autism', 'mental'];
const hasAny = v => !!(v.noise || v.light || v.crowd || v.slot || v.dayKind || v.quietTimes.length);

export function SensoryQuestions({ value, onChange, needs = [] }) {
  const [open, setOpen] = React.useState(() => needs.some(n => SENSITIVE.includes(n)) || hasAny(value));
  const firstRef = React.useRef(null);
  // Functional update: quick successive taps never drop an answer.
  const set = (k, x) => onChange(v => ({ ...v, [k]: typeof x === 'function' ? x(v[k]) : x }));

  return (
    <section aria-labelledby="rev-sensory" style={{ marginTop: 22 }}>
      <h2 id="rev-sensory" style={{ ...TYPE.headline, fontSize: 17, color: C2.char, margin: '0 0 4px' }}>
        Noise, light and crowds <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
      </h2>
      <p style={{ ...TYPE.callout, fontSize: 14.5, color: C2.slate, margin: '0 0 6px' }}>
        Helps autistic and sensory-sensitive people choose when to go.
      </p>
      {!open ? (
        <Button variant="outline" size="sm" aria-expanded={false} aria-controls="rev-sensory-body"
          onClick={() => { setOpen(true); requestAnimationFrame(() => firstRef.current?.querySelector('button')?.focus()); }}>
          Add noise, light and crowds
        </Button>
      ) : (
        <div id="rev-sensory-body" ref={firstRef}>
          {SENSORY_DIMS.map((d, i) => (
            <ChoiceRow key={d.id} id={`rev-s-${d.id}`} first={i === 0} question={d.question}
              options={d.options} value={value[d.id]} onChange={x => set(d.id, x)}/>
          ))}
          <ChoiceRow id="rev-s-day" question="When were you there?" hint="So people can see quiet and busy times."
            options={DAY_KINDS} value={value.dayKind} onChange={x => set('dayKind', x)}/>
          <div style={{ marginTop: -SPACE.xs }}>
            <ChoiceRow id="rev-s-slot" first question="What time of day?" options={SLOTS}
              value={value.slot} onChange={x => set('slot', x)}/>
          </div>
          <ChoiceRow id="rev-s-quiet" multi question="When is it usually quiet? (if you know)" hint="Choose any."
            options={SLOTS} value={value.quietTimes} onChange={x => set('quietTimes', x)}/>
        </div>
      )}
    </section>
  );
}
