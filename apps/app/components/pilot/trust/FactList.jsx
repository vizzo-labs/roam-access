'use client';

import React from 'react';
import { C2, M2 } from '../ui/palette';
import { RADIUS, TYPE } from '../ds';
import { SourceLine } from './SourceLine';
import { factSourceT } from '@/lib/trust/labels';
import { useFormat, useT, UserText } from '../i18n';
import { factText } from './text';

// One section of the venue page (Barriers / What works / Check before you go):
// every fact with its source and how recent it is.
const KIND = {
  barrier: { icon: '✗', fg: () => C2.red,   bg: () => C2.redBg },
  works:   { icon: '✓', fg: () => C2.blue,  bg: () => C2.blueBg },
  check:   { icon: '!', fg: () => C2.amber, bg: () => C2.amberBg },
};

function FactList({ kind, facts, style = {} }) {
  const t = useT();
  const fmt = useFormat();
  if (!facts.length) return null;
  const k = KIND[kind];
  const id = `facts-${kind}`;
  return (
    <section aria-labelledby={id} style={{ borderRadius: RADIUS.lg, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10, ...style }}>
      <h2 id={id} style={{ ...TYPE.caption, fontSize: 14, fontWeight: 700, padding: '16px 18px 6px', color: k.fg(), margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{t(`trust.list.${kind}`)}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {facts.map(f => (
          <li key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
            <span aria-hidden="true" style={{
              width: 22, height: 22, borderRadius: 999, background: k.fg(), color: k.bg(), flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
            }}>{k.icon}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ ...TYPE.body, display: 'block', color: C2.char }}>{factText(t, f)}</span>
              {f.quote && (
                <span style={{ ...TYPE.callout, display: 'block', color: C2.char, margin: '2px 0 0' }}>
                  “<UserText>{f.quote}</UserText>”
                </span>
              )}
              <SourceLine as="span" compact src={f.src} text={factSourceT(t, fmt, f)} style={{ marginTop: 4 }}/>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { FactList };
