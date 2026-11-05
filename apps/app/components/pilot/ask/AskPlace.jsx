'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { V2Dictate } from '../ui/Dictate';
import { V2Verdict } from '../ui/Verdict';
import { WithPhotoMarker } from '../photos/PhotoViewer';
import { C2, F2, M2, RA2_INPUT_FONT } from '../ui/palette';

// #15 — "Ask about this place". Typed or dictated. Answered only from this
// place's Roam reviews (and their photo descriptions), with the reviews it
// used listed underneath. If the reviews don't say, it says so.

const QUESTION_MAX = 300;
const VERDICT_SHORT = { works: 'It worked', check: 'Some barriers', barrier: 'Didn’t work' };

function AskPlace({ app, venue }) {
  const [q, setQ] = React.useState('');
  const [state, setState] = React.useState({ status: 'idle' }); // idle | loading | done | error
  const [remaining, setRemaining] = React.useState(null);
  const id = venue.id;

  React.useEffect(() => {
    if (!venue.verified) return;
    let live = true;
    fetch(`/api/venues/${encodeURIComponent(id)}/ask`).then(r => (r.ok ? r.json() : null)).then(d => { if (live && d) setRemaining(d.remaining); }, () => {});
    return () => { live = false; };
  }, [id, venue.verified]);

  async function ask(e) {
    e.preventDefault();
    const question = q.trim();
    if (question.length < 3 || state.status === 'loading') return;
    setState({ status: 'loading' });
    try {
      const r = await fetch(`/api/venues/${encodeURIComponent(id)}/ask`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }),
      });
      const d = await r.json().catch(() => ({}));
      if (typeof d.remaining === 'number') setRemaining(d.remaining);
      if (!r.ok) { setState({ status: 'error', message: d.message || d.error || 'Something went wrong — try again.' }); return; }
      setState({ status: 'done', question, result: d.result });
    } catch {
      setState({ status: 'error', message: 'Couldn’t reach Roam Access — check your connection.' });
    }
  }

  const res = state.status === 'done' ? state.result : null;
  const out = remaining === 0;

  return (
    <section aria-labelledby="ask-h" style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, padding: '16px 18px 18px', marginBottom: 16 }}>
      <h2 id="ask-h" style={{ fontSize: 14, fontWeight: 700, color: C2.teal, margin: '0 0 4px', fontFamily: F2, letterSpacing: '0.02em' }}>
        ASK ABOUT THIS PLACE
      </h2>
      <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 12px', fontFamily: F2, lineHeight: 1.45 }}>
        Answers come only from Roam reviews of {venue.name} — never the internet, never a guess.
      </p>

      {!venue.verified ? (
        <p style={{ fontSize: 15.5, color: C2.char, margin: 0, fontFamily: F2, lineHeight: 1.5 }}>
          Nobody has reviewed this place yet, so there’s nothing to answer from. Been there? Your review is the first step.
        </p>
      ) : (
        <form onSubmit={ask}>
          <label htmlFor="ask-q" style={{ display: 'block', fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: F2 }}>Your question</label>
          <textarea id="ask-q" value={q} rows={2} maxLength={QUESTION_MAX} aria-describedby="ask-left"
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) ask(e); }}
            placeholder="e.g. Is there a ramp at the front?"
            style={{
              width: '100%', boxSizing: 'border-box', borderRadius: 14, border: `1.5px solid ${C2.line}`,
              padding: 12, fontSize: RA2_INPUT_FONT, fontFamily: F2, lineHeight: 1.45, color: C2.char, background: C2.paper, resize: 'vertical',
            }}/>
          <V2Dictate onText={t => setQ(x => (x ? x.trimEnd() + ' ' : '') + t)}/>
          <div style={{ marginTop: 10 }}>
            <V2BigBtn kind="primary" type="submit" disabled={q.trim().length < 3 || state.status === 'loading' || out}>
              {state.status === 'loading' ? 'Reading the reviews…' : 'Ask'}
            </V2BigBtn>
          </div>
          <p id="ask-left" style={{ fontSize: 13.5, color: C2.slate, margin: '8px 0 0', fontFamily: F2, textAlign: 'center' }}>
            {remaining == null ? '' : out ? 'You’ve used today’s questions — you can ask again tomorrow.' : `${remaining} ${remaining === 1 ? 'question' : 'questions'} left today`}
          </p>
        </form>
      )}

      <div aria-live="polite" aria-busy={state.status === 'loading'}>
        {state.status === 'error' && (
          <p role="alert" style={{ margin: '12px 0 0', fontSize: 15, color: C2.red, fontFamily: F2 }}>{state.message}</p>
        )}
        {res && res.answered && (
          <div style={{ marginTop: 14, background: C2.tealSoft, borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 13, fontFamily: M2, letterSpacing: '0.08em', textTransform: 'uppercase', color: C2.slate }}>
              From {res.citations.length} {res.citations.length === 1 ? 'review' : 'reviews'}
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 16.5, lineHeight: 1.5, color: C2.char, fontFamily: F2 }}>{res.answer}</p>
            <h4 style={{ margin: '0 0 8px', fontSize: 14.5, fontWeight: 700, fontFamily: F2 }}>Reviews this is based on</h4>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {res.citations.map(c => (
                <li key={c.id} style={{ background: C2.paper, border: `1px solid ${C2.hair}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C2.teal, fontFamily: F2 }}>{c.who}</span>
                    <V2Verdict kind={c.v} label={VERDICT_SHORT[c.v]}/>
                    <WithPhotoMarker count={c.withPhoto ? 1 : 0}/>
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 15, lineHeight: 1.45, fontFamily: F2 }}>“{c.text}”</p>
                  <p style={{ margin: 0, fontSize: 13, color: C2.slate, fontFamily: F2 }}>{c.when}</p>
                </li>
              ))}
            </ol>
            <V2BigBtn kind="ghost" onClick={() => app.goto('reviews', id)} style={{ minHeight: 52, fontSize: 16 }}>Read all reviews</V2BigBtn>
          </div>
        )}
        {res && !res.answered && (
          <div style={{ marginTop: 14, background: C2.stone, borderRadius: 14, padding: 16 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16.5, fontWeight: 700, fontFamily: F2 }}>The reviews don’t answer this yet</h3>
            <p style={{ margin: '0 0 12px', fontSize: 15.5, lineHeight: 1.5, color: C2.char, fontFamily: F2 }}>{res.answer}</p>
            <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.5, color: C2.char, fontFamily: F2 }}>
              If you’ve been, your review could answer it for the next person.
            </p>
            <V2BigBtn kind="outline" onClick={() => app.goto('review', id)} style={{ minHeight: 52, fontSize: 16 }}>Share your experience</V2BigBtn>
          </div>
        )}
      </div>
    </section>
  );
}

export { AskPlace };
