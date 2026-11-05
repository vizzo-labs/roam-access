'use client';
// Venue page (#17): noise, light and crowds from people in the pilot, quiet
// times, "quiet now", and a check-in. Community reports only; it describes
// the place and never changes the verdict.

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Card, SectionHeader, SPACE, TYPE, divider } from '../ds';
import { CROWD_IDS, LIGHT_IDS, NOISE_IDS } from '@/lib/sensory/defs';
import { dimSummaries, quietHours, quietNow, slotReadings } from '@/lib/sensory/summary';
import { ReadAloud, useFormat, useT } from '../i18n';
import { CheckIn } from './CheckIn';
import { SensoryIcon, optionFact, slotLabel, useNow, whenText } from './bits';

const IDS = { noise: NOISE_IDS, light: LIGHT_IDS, crowd: CROWD_IDS };

/** One line per dimension: heading "Noise", text "Usually quiet", meta "3 of 4 reports". */
export function sensoryLines(vm, t, fmt) {
  return dimSummaries(vm).map(s => {
    const text = s.id
      ? t(`sensory.${s.dim}.${s.id}.${s.n >= 2 ? 'usually' : 'fact'}`)
      : t('sensory.summary.mixed', {
        list: fmt.list(IDS[s.dim].filter(id => s.counts[id]).map(id =>
          t('sensory.summary.mixedItem', { what: optionFact(t, s.dim, id).toLocaleLowerCase(t.locale), count: s.counts[id] }))),
      });
    const meta = s.id
      ? (s.total > 1 ? t('sensory.summary.ofReports', { n: s.n, total: s.total }) : t('common.reports', { count: 1 }))
      : t('common.reports', { count: s.total });
    return { dim: s.dim, heading: t(`sensory.dim.${s.dim}.heading`), text, meta };
  });
}

/** "Usually quiet before 10am on weekdays" */
export function quietHourText(h, t) {
  return t(h.usually ? 'sensory.quiet.usually' : 'sensory.quiet.once', { when: whenText(t, h.slot, h.day) });
}

/** The quiet-now banner's title, body and tone (null when there's nothing to say). */
function nowMessage(q, t, fmt, now) {
  if (!q) return null;
  if (q.kind === 'live') {
    const what = [optionFact(t, 'noise', q.check.noise), optionFact(t, 'crowd', q.check.crowd)]
      .filter(Boolean).map(x => x.toLocaleLowerCase(t.locale));
    const ago = fmt.ago(q.at, now);
    return {
      tone: { quiet: 'success', some: 'info', busy: 'warn' }[q.reading],
      title: t(`sensory.now.${q.reading}`),
      body: what.length ? t('sensory.now.checkedInWhat', { ago, what: fmt.list(what) }) : t('sensory.now.checkedIn', { ago }),
    };
  }
  if (q.kind === 'usually-quiet') {
    return { tone: 'success', title: t('sensory.now.usuallyQuiet'),
      body: t('sensory.now.usuallyQuietBody', { count: q.hour.n, when: whenText(t, q.hour.slot, q.hour.day) }) };
  }
  return { tone: 'warn', title: t('sensory.now.usuallyBusy'),
    body: t('sensory.now.usuallyBusyBody', { count: q.n, when: whenText(t, q.slot) }) };
}

export function SensorySummary({ app, venue }) {
  const t = useT();
  const fmt = useFormat();
  const vm = venue.sensory;
  const now = useNow();
  const lines = sensoryLines(vm, t, fmt);
  const hours = quietHours(vm);
  const day = slotReadings(vm);
  const msg = nowMessage(quietNow(vm, now), t, fmt, now);
  const empty = !lines.length && !hours.length;

  // Everything shown, in reading order, for "Read aloud".
  const spoken = () => [
    msg && `${msg.title}. ${msg.body}`,
    ...hours.map(h => `${quietHourText(h, t)}, ${t('common.reports', { count: h.n })}.`),
    ...lines.map(l => t('sensory.read.lines', { heading: l.heading, text: l.text, meta: l.meta })),
    t('sensory.summary.from'),
  ].filter(Boolean).join(' ');

  return (
    <Card as="section" aria-labelledby={`sensory-h-${venue.id}`} style={{ marginBottom: SPACE.md }}>
      <SectionHeader id={`sensory-h-${venue.id}`} title={t('sensory.summary.title')} size="sm"
        description={empty ? t('sensory.summary.empty') : t('sensory.summary.from')}/>
      {!empty && (
        <ReadAloud text={spoken} what={t('sensory.readWhat', { name: venue.name })} style={{ marginBottom: SPACE.sm }}/>
      )}
      {msg && <Banner tone={msg.tone} title={msg.title} style={{ marginBottom: SPACE.sm }}>{msg.body}</Banner>}

      {hours.length > 0 && (
        <ul style={{ listStyle: 'none', margin: `0 0 ${SPACE.sm}px`, padding: 0 }}>
          {hours.map(h => (
            <li key={h.slot} style={{ display: 'flex', gap: SPACE.xs, alignItems: 'flex-start', ...TYPE.body, fontWeight: 700, color: C2.char, margin: '0 0 4px' }}>
              <span style={{ color: C2.green, paddingTop: 2 }}><SensoryIcon name="time"/></span>
              <span>{quietHourText(h, t)} <span style={{ fontWeight: 400, color: C2.slate }}>— {t('common.reports', { count: h.n })}</span></span>
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
          <h3 style={{ ...TYPE.headline, fontSize: 15.5, color: C2.char, margin: `${SPACE.sm}px 0 ${SPACE.xxs}px` }}>{t('sensory.throughDay')}</h3>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, max-content) minmax(0, 1fr)', columnGap: SPACE.md, rowGap: 2 }}>
            {day.map(d => (
              <React.Fragment key={d.slot}>
                <dt style={{ ...TYPE.footnote, color: C2.slate, fontWeight: 600 }}>{slotLabel(t, d.slot)}</dt>
                <dd style={{ ...TYPE.footnote, color: C2.char, margin: 0 }}>
                  {t('sensory.readingLine', { reading: t(`sensory.reading.${d.reading}`), reports: t('common.reports', { count: d.total }) })}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </>
      )}

      <CheckIn app={app} venue={venue}/>
    </Card>
  );
}
