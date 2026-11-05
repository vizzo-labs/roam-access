'use client';

import React from 'react';
import { C2, F2, M2 } from '../ui/palette';
import { SourceLine } from './SourceLine';
import { factSource } from '@/lib/trust/labels';

// One section of the venue page (Barriers / What works / Check before you go):
// every fact with its source and how recent it is.
const KIND = {
  barrier: { title: 'Barriers',            icon: '✗', fg: () => C2.red,   bg: () => C2.redBg },
  works:   { title: 'What works',          icon: '✓', fg: () => C2.blue,  bg: () => C2.blueBg },
  check:   { title: 'Check before you go', icon: '!', fg: () => C2.amber, bg: () => C2.amberBg },
};

function FactList({ kind, facts, style = {} }) {
  if (!facts.length) return null;
  const k = KIND[kind];
  const id = `facts-${kind}`;
  return (
    <section aria-labelledby={id} style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10, ...style }}>
      <h2 id={id} style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: k.fg(), margin: 0, fontFamily: F2, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{k.title}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {facts.map(f => (
          <li key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
            <span aria-hidden="true" style={{
              width: 22, height: 22, borderRadius: 999, background: k.fg(), color: k.bg(), flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
            }}>{k.icon}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 16, lineHeight: 1.45, fontFamily: F2, color: C2.char }}>{f.t}</span>
              {f.quote && (
                <span style={{ display: 'block', fontSize: 15, lineHeight: 1.45, fontFamily: F2, color: C2.char, margin: '2px 0 0' }}>
                  “{f.quote}”
                </span>
              )}
              <SourceLine as="span" compact src={f.src} text={factSource(f)} style={{ marginTop: 4 }}/>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export { FactList };
