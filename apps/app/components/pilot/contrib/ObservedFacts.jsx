'use client';

import React from 'react';
import { C2, M2 } from '../ui/palette';
import { RADIUS, SourceBadge, TYPE } from '../ds';
import { useT } from '../i18n';
import { factShort, factText } from '../trust/text';

// "Observed by allies" (Brief L): facts from allies' observations. Kept apart
// from Barriers / What works / Check first because they NEVER set or change a
// verdict — the verdict engine doesn't read them (VenueVM.observed).
// Each fact: a ✓ / ✗ / ? mark AND words, and how many allies said it.
const MARK = { feature: '✓', entrance: '✓', absence: '✗', mixed: '?' };

function ObservedFacts({ venue, style }) {
  const t = useT();
  const facts = venue.observed || [];
  if (!facts.length) return null;
  return (
    <section aria-labelledby="observed-h" style={{ borderRadius: RADIUS.lg, border: `1.5px dashed ${C2.line}`, padding: '16px 18px 6px', marginBottom: 10, ...style }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <h2 id="observed-h" style={{ ...TYPE.headline, margin: 0, color: C2.char }}>{t('contrib.observedFacts.title')}</h2>
        <SourceBadge source="ally"/>
      </div>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: '0 0 6px' }}>{t('contrib.observedFacts.lead')}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {facts.map(f => (
          <li key={f.t} style={{ display: 'flex', gap: 12, padding: '10px 0', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
            <span aria-hidden="true" style={{
              width: 22, height: 22, borderRadius: 999, border: `1.5px solid ${C2.slate}`, color: C2.char, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
            }}>{MARK[f.kind] || '•'}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ ...TYPE.callout, display: 'block', color: C2.char }}>{factText(t, f)}</span>
              <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>{factShort(t, f)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { ObservedFacts };
