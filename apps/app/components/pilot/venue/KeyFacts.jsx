'use client';

import React from 'react';
import { C2, M2 } from '../ui/palette';
import { Button, SPACE, TYPE } from '../ds';
import { useFormat, useT } from '../i18n';
import { factText } from '../trust/text';
import { ObservedFacts } from '../contrib/ObservedFacts';
import { keyFacts } from '@/lib/pilot/key-facts';

// "For your needs": up to 3 facts about what THIS person needs, each a mark
// (✓ ! ✗ ?) with a hidden word for screen readers, the fact, and where it
// comes from ("3 reviews · last one 2 November 2026", or "On OpenStreetMap ·
// not checked"). Allies' observations follow, labelled — never a verdict.
const MARK = {
  yes:         { icon: '✓', fg: () => C2.blue,  sr: 'place.mark.yes' },
  no:          { icon: '✗', fg: () => C2.red,   sr: 'place.mark.no' },
  mixed:       { icon: '!', fg: () => C2.amber, sr: 'place.mark.check' },
  alt:         { icon: '!', fg: () => C2.amber, sr: 'place.mark.check' },
  unconfirmed: { icon: '?', fg: () => C2.slate, sr: 'place.mark.unconfirmed' },
};

// The fact behind one key fact (for its words, count and date).
function factFor(v, feature, state) {
  const about = (list, kinds, src) => list.find(x => x.tags.includes(feature) && kinds.includes(x.kind || '') && x.src === src);
  if (state === 'yes') return about(v.works, ['feature', 'entrance'], 'community');
  if (state === 'no') return about(v.barriers, ['absence'], 'community') || about(v.check, ['absence'], 'community');
  if (state === 'mixed') return about(v.check, ['mixed'], 'community');
  if (state === 'alt') return about(v.works, ['entrance'], 'community');
  return about(v.check, ['hint'], 'osm');
}

function KeyFacts({ app, venue: v }) {
  const t = useT();
  const fmt = useFormat();
  const needs = app.user?.needs || [];
  const facts = needs.length ? keyFacts(v, needs, 3) : [];
  return (
    <section aria-labelledby="needs-h" style={{ marginTop: SPACE.lg }}>
      <h2 id="needs-h" style={{ ...TYPE.title3, fontSize: 20, margin: `0 0 ${SPACE.xs}px`, color: C2.char }}>{t('place.needs.title')}</h2>
      {!needs.length && (
        <Button variant="plain" onClick={() => app.goto('setup')} style={{ padding: '0 2px', textAlign: 'left' }}>{t('place.needs.setNeeds')}</Button>
      )}
      {needs.length > 0 && !facts.length && <p style={{ ...TYPE.callout, color: C2.char, margin: 0 }}>{t('place.needs.none')}</p>}
      {facts.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
          {facts.map(({ feature, state }) => {
            const m = MARK[state];
            const f = factFor(v, feature, state);
            const community = state !== 'unconfirmed' && !!f;
            const meta = state === 'unconfirmed' ? t('place.needs.osm')
              : f?.n && f.last ? t('place.needs.meta', { count: f.n, date: fmt.date(f.last) })
              : f?.n ? t('venue.from.reviews', { count: f.n }) : null;
            return (
              <li key={feature} style={{ display: 'flex', gap: SPACE.sm, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{
                  width: 26, height: 26, borderRadius: 999, background: m.fg(), color: C2.paper, flexShrink: 0, marginTop: 1,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: M2, fontSize: 14, fontWeight: 800,
                }}>{m.icon}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ ...TYPE.body, display: 'block', fontWeight: 600, color: C2.char }}>
                    <span className="ra-sr-only">{t(m.sr)} </span>
                    {community ? factText(t, f) : t(`place.feature.${feature}`)}
                  </span>
                  {meta && <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>{meta}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <ObservedFacts venue={v} style={{ marginTop: SPACE.md }}/>
    </section>
  );
}

export { KeyFacts };
