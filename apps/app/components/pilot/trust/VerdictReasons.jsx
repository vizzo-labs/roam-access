'use client';

import React from 'react';
import { C2, M2 } from '../ui/palette';
import { TYPE } from '../ds';
import { SourceLine } from './SourceLine';
import { verdictSourceShort } from '@/lib/trust/labels';

// The specific reasons behind a verdict, for result cards and the map card:
// "✗ No accessible loo — 2 reports". Spans only, so it can sit inside the
// card's <button>. Icons are aria-hidden; the hidden prefix says the same.
const MARK = {
  barrier: { icon: '✗', sr: 'Barrier: ', fg: () => C2.red },
  check:   { icon: '!', sr: 'Check: ',   fg: () => C2.amber },
  works:   { icon: '✓', sr: 'Works: ',   fg: () => C2.blue },
};

function reasonsFor(verdict, max) {
  const tag = kind => f => ({ f, kind });
  if (verdict.kind === 'barrier') return [...verdict.barriers.map(tag('barrier')), ...verdict.checks.map(tag('check'))].slice(0, max);
  if (verdict.kind === 'check') return [...verdict.checks.map(tag('check')), ...verdict.works.map(tag('works'))].slice(0, max);
  if (verdict.kind === 'works') return verdict.works.map(tag('works')).slice(0, max);
  return [];
}

function VerdictReasons({ venue, verdict, needs = [], max = 3, fontSize = 15 }) {
  const items = reasonsFor(verdict, max);
  return (
    <span style={{ display: 'block' }}>
      {items.length ? items.map(({ f, kind }) => {
        const m = MARK[kind];
        return (
          <span key={kind + f.t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4, ...TYPE.callout, fontSize, lineHeight: 1.4, color: C2.char }}>
            <span aria-hidden="true" style={{
              width: 18, height: 18, borderRadius: 999, background: m.fg(), color: C2.paper, flexShrink: 0, marginTop: 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: M2,
            }}>{m.icon}</span>
            <span><span className="ra-sr-only">{m.sr}</span>{f.s}</span>
          </span>
        );
      }) : (
        <span style={{ ...TYPE.callout, display: 'block', fontSize, lineHeight: 1.4, color: C2.char, marginBottom: 4 }}>{verdict.why}</span>
      )}
      {verdict.kind !== 'unknown' && (
        <SourceLine as="span" compact src={venue.ev?.length ? 'community' : 'osm'}
          text={verdictSourceShort(venue, verdict, needs)} style={{ marginTop: 6 }}/>
      )}
    </span>
  );
}

export { VerdictReasons };
