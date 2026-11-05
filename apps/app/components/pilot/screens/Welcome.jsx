'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { V2Logo } from '../ui/Logo';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';

// ─────────────────────────────────────────────────────────────
// WELCOME
// ─────────────────────────────────────────────────────────────
function V2Welcome({ app }) {
  const h = useV2Heading('welcome');
  return (
    <V2Shell>
      {!app.wide && (
        <div style={{ padding: '22px 26px 0' }}>
          <V2Logo size={30}/>
        </div>
      )}
      <div style={{ padding: '48px 26px 0' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 18px' }}>
          For people with disability
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 40, lineHeight: 1.06, marginBottom: 18 }}>
          Find places that actually work for you<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, color: C2.char, margin: 0, maxWidth: 320 }}>
          Real accessibility, checked by people with lived experience — not what venues claim.
        </p>
      </div>

      <div style={{ padding: '32px 26px 0' }}>
        {[
          'Built with the disability community',
          'Every disability — not just wheelchair access',
          'Free for you. Always.',
        ].map(t => (
          <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <span aria-hidden="true" style={{
              width: 26, height: 26, borderRadius: 999, background: C2.tealSoft, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="10" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.teal} strokeWidth="2.5" strokeLinecap="round"/></svg>
            </span>
            <span style={{ fontSize: 16.5, fontWeight: 600, color: C2.char }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '30px 26px 24px' }}>
        <V2BigBtn kind="primary" onClick={() => app.signUp()}>Join the pilot</V2BigBtn>
        <button onClick={() => app.signIn()}
          style={{
            width: '100%', minHeight: 56, marginTop: 8, borderRadius: 16, border: 0,
            background: 'transparent', color: C2.teal, fontFamily: F2, fontSize: 17, fontWeight: 700,
            cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4,
          }}>I already have an account</button>
        <p style={{ fontSize: 12.5, color: C2.slate, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.45 }}>
          Pilot in Manly & surrounds — real places, reviewed by the people taking part.
        </p>
      </div>
    </V2Shell>
  );
}

export { V2Welcome };
