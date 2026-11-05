'use client';

import React from 'react';
import { RA2_FEATURES } from '@/lib/pilot-data';
import { V2BigBtn } from '../ui/Buttons';
import { V2Dictate } from '../ui/Dictate';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META } from '../ui/Verdict';
import { C2, F2, M2, RA2_INPUT_FONT, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2NeedTags } from '@/lib/pilot/match';
import { EntranceQuestion } from '../trust/EntranceQuestion';

// ─────────────────────────────────────────────────────────────
// REVIEW — one tap required, everything else optional
// ─────────────────────────────────────────────────────────────
function V2ReviewView({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('review-' + v.id);
  const [choice, setChoice] = React.useState(null);
  const [features, setFeatures] = React.useState({});
  const [note, setNote] = React.useState('');
  const [entranceAlt, setEntranceAlt] = React.useState(null);
  const [entranceNote, setEntranceNote] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Questions that touch this tester's own needs come first.
  const mine = ra2NeedTags(app.user?.needs || []);
  const questions = [...RA2_FEATURES].sort((x, y) => (mine.includes(y.id) ? 1 : 0) - (mine.includes(x.id) ? 1 : 0));

  const options = [
    { kind: 'works',   label: 'It worked for me',  sub: 'I could get in, get around, and enjoy it' },
    { kind: 'check',   label: 'Some barriers',     sub: 'I managed, but with workarounds' },
    { kind: 'barrier', label: "It didn't work",    sub: "I couldn't use the venue as I needed" },
  ];

  // Tapping the selected answer again clears it ("not sure").
  const setFeature = (id, val) => setFeatures(f => {
    const next = { ...f };
    if (next[id] === val) delete next[id]; else next[id] = val;
    return next;
  });

  async function send() {
    if (!choice || sending) return;
    setSending(true);
    // The entrance follow-up only counts when the main way in has steps.
    const entrance = features.stepfree === 'no' && entranceAlt
      ? { entranceAlt, entranceNote: entranceAlt === 'none' ? '' : entranceNote } : {};
    const ok = await app.submitReview({ venueId: v.id, verdict: choice, features, note, ...entrance });
    if (ok) app.goto('thanks', v.id, { replace: true }); // Back must not reopen a sent form
    else setSending(false);
  }

  return (
    <V2Shell>
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => app.goto('venue', v.id)} style={{
          minHeight: 48, padding: '0 18px', borderRadius: 999, border: 0,
          background: 'transparent', color: C2.slate, fontFamily: F2, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: 4,
        }}>Skip</button>
      </div>

      <div style={{ padding: '14px 24px 24px' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 10px' }}>
          Your experience
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, lineHeight: 1.1, marginBottom: 8 }}>
          How was {v.name}<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 26px', fontFamily: F2 }}>
          One tap helps other people plan their day. Everything else is optional.
        </p>

        {options.map(o => {
          const meta = V2_VERDICT_META[o.kind];
          const on = choice === o.kind;
          return (
            <button key={o.kind} onClick={() => setChoice(o.kind)} aria-pressed={on} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
              minHeight: 84, borderRadius: 18, padding: '12px 18px', marginBottom: 10,
              border: on ? `2.5px solid ${meta.fg}` : `1.5px solid ${C2.line}`,
              background: on ? meta.bg : C2.paper, cursor: 'pointer',
              fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span aria-hidden="true" style={{
                width: 44, height: 44, borderRadius: 999, background: meta.fg, color: meta.bg, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 19, fontWeight: 800, fontFamily: M2,
              }}>{meta.icon}</span>
              <span>
                <span style={{ display: 'block', fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3, color: C2.char }}>{o.label}</span>
                <span style={{ display: 'block', fontSize: 14.5, color: C2.slate, lineHeight: 1.35 }}>{o.sub}</span>
              </span>
            </button>
          );
        })}

        <section aria-labelledby="rev-more" style={{ marginTop: 22 }}>
          <h2 id="rev-more" style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', fontFamily: F2 }}>
            Tell us more <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
          </h2>
          <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 10px', lineHeight: 1.45, fontFamily: F2 }}>
            Answer only what you noticed. Tap an answer again to clear it.
          </p>
          {questions.map(q => (
            <React.Fragment key={q.id}>
            <div role="group" aria-labelledby={`q-${q.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: `1px solid ${C2.hair}`,
            }}>
              <span id={`q-${q.id}`} style={{ flex: 1, fontSize: 15.5, lineHeight: 1.35, fontWeight: 600, fontFamily: F2, color: C2.char }}>{q.question}</span>
              {['yes', 'no'].map(val => {
                const on = features[q.id] === val;
                return (
                  <button key={val} type="button" aria-pressed={on} onClick={() => setFeature(q.id, val)} style={{
                    minWidth: 58, minHeight: 44, borderRadius: 999, flexShrink: 0,
                    border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
                    background: on ? C2.teal : C2.paper, color: on ? C2.paper : C2.char,
                    fontWeight: 700, fontSize: 15, fontFamily: F2, cursor: 'pointer',
                  }}>{val === 'yes' ? 'Yes' : 'No'}</button>
                );
              })}
            </div>
            {q.id === 'stepfree' && features.stepfree === 'no' && (
              <EntranceQuestion value={entranceAlt} note={entranceNote} onChange={setEntranceAlt} onNote={setEntranceNote}/>
            )}
            </React.Fragment>
          ))}
        </section>

        <div style={{ marginTop: 18 }}>
          <label htmlFor="rev-note" style={{ display: 'block', fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: F2 }}>
            Anything else? <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
          </label>
          <textarea id="rev-note" value={note} onChange={e => setNote(e.target.value)} rows={4} maxLength={1000}
            placeholder="e.g. The ramp is round the side; staff were great"
            style={{
              width: '100%', boxSizing: 'border-box', borderRadius: 16, border: `1.5px solid ${C2.line}`,
              padding: 14, fontSize: RA2_INPUT_FONT, fontFamily: F2, lineHeight: 1.45, color: C2.char,
              background: C2.paper, resize: 'vertical',
            }}/>
          <V2Dictate onText={t => setNote(n => (n ? n.trimEnd() + ' ' : '') + t)}/>
        </div>

        <div style={{ marginTop: 20 }}>
          <V2BigBtn kind="primary" onClick={send} disabled={!choice || sending} ariaDescribedBy="rev-hint">
            {sending ? 'Sending…' : 'Send it →'}
          </V2BigBtn>
        </div>
        <p id="rev-hint" style={{ fontSize: 13.5, color: C2.slate, textAlign: 'center', marginTop: 12, lineHeight: 1.4, fontFamily: F2 }}>
          {choice ? 'Shown with your lived experience — never your name.' : 'Choose one of the three options above to send.'}
        </p>
      </div>
    </V2Shell>
  );
}

export { V2ReviewView };
