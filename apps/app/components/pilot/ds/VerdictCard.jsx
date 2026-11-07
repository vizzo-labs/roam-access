'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { V2_VERDICT_META, V2Verdict } from '../ui/Verdict';
import { RADIUS, SPACE, TYPE, isHighContrast } from './tokens';

// VerdictCard — the top of a place: the big verdict pill (glyph + colour +
// words), ONE bold sentence, one source line with the date, then whatever the
// screen adds (Read aloud, How we decide, "Still right?"). A section named by
// a visually hidden h2 ("Does it work for you?"). The verdict comes from the
// caller (ra2Verdict) — this card never decides one.
//   <VerdictCard kind="works" heading="Does it work for you?" sentence="…" source="From 3 community reviews. Last checked 2 November 2026.">…</VerdictCard>
function VerdictCard({ kind, heading, headingId = 'verdict-h', sentence, source, children, style }) {
  const meta = V2_VERDICT_META[kind] || V2_VERDICT_META.unknown;
  return (
    <section aria-labelledby={headingId} style={{
      background: meta.bg, borderRadius: RADIUS.lg, padding: SPACE.md,
      border: isHighContrast() ? `2px solid ${C2.line}` : 0, ...style,
    }}>
      <h2 id={headingId} className="ra-sr-only">{heading}</h2>
      <V2Verdict kind={kind} big/>
      {sentence && <p style={{ ...TYPE.body, fontWeight: 700, color: C2.char, margin: `${SPACE.sm}px 0 0` }}>{sentence}</p>}
      {source && <p style={{ ...TYPE.footnote, color: C2.char, margin: `${SPACE.xs}px 0 0` }}>{source}</p>}
      {children}
    </section>
  );
}

export { VerdictCard };
