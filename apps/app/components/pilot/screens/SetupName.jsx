'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { C2, F2, RA2_INPUT_FONT, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { V2Verdict } from '../ui/Verdict';
import { Card, SPACE, TYPE } from '../ds';

const VERDICT_HELP = [
  ['works', 'People with needs like yours say it worked.'],
  ['check', 'Something to know first — or it isn’t confirmed yet.'],
  ['barrier', 'People with needs like yours hit a real barrier.'],
  ['unknown', 'Nobody has reviewed it for your needs yet.'],
];

// ─────────────────────────────────────────────────────────────
// SETUP · step 3 — name
// ─────────────────────────────────────────────────────────────
function V2SetupName({ app }) {
  const h = useV2Heading('setup-name');
  const [name, setName] = React.useState(app.user?.name || '');

  function finish() {
    app.setUser({ ...(app.user || {}), name: name.trim(), needs: app.user?.needs || [], done: true });
    app.goto('home');
    app.toast('You’re set. Thanks for joining the pilot.');
  }

  const bar = (
    <div style={{ padding: '14px 24px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0 }}>
      <V2BigBtn kind="primary" onClick={finish}>Finish →</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }} aria-hidden="true">
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
        </div>
        <p className="ra-sr-only">Step 3 of 3</p>

        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
          What should we call you<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
          Totally optional — pick anything. Your reviews never show your name, only your lived experience.
        </p>

        <label htmlFor="setup-name" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Your name</label>
        <input id="setup-name" value={name} onChange={e => setName(e.target.value)}
          autoComplete="nickname" placeholder="e.g. Naomi"
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: 60,
            border: `1.5px solid ${C2.line}`, borderRadius: 16, padding: '0 18px',
            fontSize: RA2_INPUT_FONT + 1, fontFamily: F2, color: C2.char, background: C2.paper,
          }}/>

        {/* First time only: what the answers will look like, before the first search. */}
        {!app.user?.done && (
          <Card variant="filled" as="section" aria-labelledby="verdicts-h" style={{ marginTop: SPACE.xl }}>
            <h2 id="verdicts-h" style={{ ...TYPE.headline, margin: '0 0 4px' }}>How you’ll see places</h2>
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.sm}px` }}>
              Every place gets one answer for your needs. Only reviews from people in the pilot can say “Works for you”.
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
              {VERDICT_HELP.map(([kind, text]) => (
                <li key={kind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <V2Verdict kind={kind}/>
                  <span style={{ ...TYPE.footnote, color: C2.char }}>{text}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </V2Shell>
  );
}

export { V2SetupName };
