'use client';
// Venue page (#17): noise, light and crowds from people in the pilot, quiet
// times, "quiet now", and a check-in. Community reports only; it describes
// the place and never changes the verdict.

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Card, SectionHeader, SPACE, TYPE, divider, plural } from '../ds';
import { DAY_KINDS, SENSORY_DIMS, SLOTS, optionOf } from '@/lib/sensory/defs';
import { dimSummaries, quietHours, quietNow, slotReadings } from '@/lib/sensory/summary';
import { CheckIn } from './CheckIn';
import { SensoryIcon, minsAgo, useNow } from './bits';

const USUALLY = {
  noise: { quiet: 'Usually quiet', some: 'Usually some noise', loud: 'Often loud' },
  light: { soft: 'Usually soft or natural light', bright: 'Usually bright light', harsh: 'Often harsh or flickering light' },
  crowd: { few: 'Usually few people', some: 'Usually some people', busy: 'Often crowded' },
};
const READING = { quiet: 'Quiet', some: 'Some noise or people', busy: 'Busy or loud', mixed: 'Mixed reports' };
const slot = id => SLOTS.find(s => s.id === id);
const dayPhrase = d => (d ? ' ' + DAY_KINDS.find(x => x.id === d).phrase : '');

/** One sentence per dimension: "Usually quiet" + "3 of 4 reports". */
export function sensoryLines(vm) {
  return dimSummaries(vm).map(s => {
    const dim = SENSORY_DIMS.find(d => d.id === s.dim);
    const text = s.id
      ? (s.n >= 2 ? USUALLY[s.dim][s.id] : optionOf(s.dim, s.id).fact)
      : `Mixed reports: ${dim.options.filter(o => s.counts[o.id]).map(o => `${o.fact.toLowerCase()} (${s.counts[o.id]})`).join(', ')}`;
    return { dim: s.dim, heading: dim.heading, text, meta: s.id ? (s.total > 1 ? `${s.n} of ${s.total} reports` : '1 report') : plural(s.total, 'report') };
  });
}

/** "Usually quiet before 10am — 3 reports" */
export function quietHourText(h) {
  return `${h.usually ? 'Usually quiet' : 'Quiet'} ${slot(h.slot).phrase}${dayPhrase(h.day)}`;
}

function NowBanner({ q, now }) {
  if (!q) return null;
  if (q.kind === 'live') {
    const what = [optionOf('noise', q.check.noise)?.fact, optionOf('crowd', q.check.crowd)?.fact].filter(Boolean).join(', ').toLowerCase();
    const t = { quiet: ['success', 'Quiet right now'], some: ['info', 'Some noise or people right now'], busy: ['warn', 'Busy right now'] }[q.reading];
    return <Banner tone={t[0]} title={t[1]} style={{ marginBottom: SPACE.sm }}>Someone checked in {minsAgo(q.at, now)}{what ? `: ${what}` : ''}.</Banner>;
  }
  if (q.kind === 'usually-quiet') {
    return (
      <Banner tone="success" title="Usually quiet at this time" style={{ marginBottom: SPACE.sm }}>
        {plural(q.hour.n, 'report')} say it’s quiet {slot(q.hour.slot).phrase}{dayPhrase(q.hour.day)}.
      </Banner>
    );
  }
  return (
    <Banner tone="warn" title="Usually busy at this time" style={{ marginBottom: SPACE.sm }}>
      {plural(q.n, 'report')} say it’s busy or loud {slot(q.slot).phrase}.
    </Banner>
  );
}

export function SensorySummary({ app, venue }) {
  const vm = venue.sensory;
  const now = useNow();
  const lines = sensoryLines(vm);
  const hours = quietHours(vm);
  const day = slotReadings(vm);
  const q = quietNow(vm, now);
  const empty = !lines.length && !hours.length;

  return (
    <Card as="section" aria-labelledby={`sensory-h-${venue.id}`} style={{ marginBottom: SPACE.md }}>
      <SectionHeader id={`sensory-h-${venue.id}`} title="Noise, light and crowds" size="sm"
        description={empty ? 'No one has described this yet.' : 'From people in the pilot. This doesn’t change the verdict.'}/>
      <NowBanner q={q} now={now}/>

      {hours.length > 0 && (
        <ul style={{ listStyle: 'none', margin: `0 0 ${SPACE.sm}px`, padding: 0 }}>
          {hours.map(h => (
            <li key={h.slot} style={{ display: 'flex', gap: SPACE.xs, alignItems: 'flex-start', ...TYPE.body, fontWeight: 700, color: C2.char, margin: '0 0 4px' }}>
              <span style={{ color: C2.green, paddingTop: 2 }}><SensoryIcon name="time"/></span>
              <span>{quietHourText(h)} <span style={{ fontWeight: 400, color: C2.slate }}>— {plural(h.n, 'report')}</span></span>
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {lines.map(l => (
            <li key={l.dim} style={{ display: 'flex', gap: SPACE.sm, alignItems: 'flex-start', padding: `${SPACE.xs}px 0`, borderTop: divider() }}>
              <span style={{ color: C2.teal, paddingTop: 2 }}><SensoryIcon name={l.dim}/></span>
              <span style={{ minWidth: 0 }}>
                <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate, fontWeight: 600 }}>{l.heading}</span>
                <span style={{ ...TYPE.body, display: 'block', color: C2.char }}>{l.text}</span>
                <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>{l.meta}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {day.length > 0 && (
        <>
          <h3 style={{ ...TYPE.headline, fontSize: 15.5, color: C2.char, margin: `${SPACE.sm}px 0 ${SPACE.xxs}px` }}>Through the day</h3>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, max-content) minmax(0, 1fr)', columnGap: SPACE.md, rowGap: 2 }}>
            {day.map(d => (
              <React.Fragment key={d.slot}>
                <dt style={{ ...TYPE.footnote, color: C2.slate, fontWeight: 600 }}>{slot(d.slot).label}</dt>
                <dd style={{ ...TYPE.footnote, color: C2.char, margin: 0 }}>{READING[d.reading]} · {plural(d.total, 'report')}</dd>
              </React.Fragment>
            ))}
          </dl>
        </>
      )}

      <CheckIn app={app} venue={venue}/>
    </Card>
  );
}
