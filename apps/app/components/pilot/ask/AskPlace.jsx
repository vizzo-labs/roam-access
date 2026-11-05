'use client';

import React from 'react';
import { V2Dictate } from '../ui/Dictate';
import { V2Verdict } from '../ui/Verdict';
import { C2 } from '../ui/palette';
import { Banner, Button, Card, SectionHeader, SourceBadge, SPACE, TYPE, RADIUS, edge, plural } from '../ds';

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
      setState({ status: 'done', result: d.result });
    } catch {
      setState({ status: 'error', message: 'Couldn’t reach Roam Access — check your connection.' });
    }
  }

  const res = state.status === 'done' ? state.result : null;
  const out = remaining === 0;

  return (
    <Card as="section" aria-labelledby="ask-h" style={{ marginBottom: SPACE.md }}>
      <SectionHeader id="ask-h" title="Ask about this place" size="sm"
        description={`Answers come only from Roam reviews of ${venue.name} — never the internet, never a guess.`}/>

      {!venue.verified ? (
        <p style={{ ...TYPE.callout, color: C2.char, margin: 0 }}>
          Nobody has reviewed this place yet, so there’s nothing to answer from. Been there? Your review is the first step.
        </p>
      ) : (
        <form onSubmit={ask}>
          <label htmlFor="ask-q" style={{ ...TYPE.headline, display: 'block', marginBottom: 6 }}>Your question</label>
          <textarea id="ask-q" value={q} rows={2} maxLength={QUESTION_MAX} aria-describedby="ask-left"
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) ask(e); }}
            placeholder="e.g. Is there a ramp at the front?"
            style={{
              ...TYPE.input, width: '100%', boxSizing: 'border-box', borderRadius: RADIUS.md, border: edge(),
              padding: SPACE.sm, color: C2.char, background: C2.paper, resize: 'vertical',
            }}/>
          <V2Dictate onText={t => setQ(x => (x ? x.trimEnd() + ' ' : '') + t)}/>
          <Button type="submit" full style={{ marginTop: SPACE.sm }} disabled={q.trim().length < 3 || state.status === 'loading' || out}>
            {state.status === 'loading' ? 'Reading the reviews…' : 'Ask'}
          </Button>
          <p id="ask-left" style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xs}px 0 0`, textAlign: 'center' }}>
            {remaining == null ? '' : out ? 'You’ve used today’s questions — you can ask again tomorrow.' : `${plural(remaining, 'question')} left today`}
          </p>
        </form>
      )}

      <div aria-live="polite" aria-busy={state.status === 'loading'}>
        {state.status === 'error' && (
          <Banner tone="danger" style={{ marginTop: SPACE.sm }}>{state.message}</Banner>
        )}
        {res && res.answered && (
          <Card variant="tint" style={{ marginTop: SPACE.sm }}>
            <h3 style={{ ...TYPE.overline, color: C2.slate, margin: '0 0 6px' }}>From {plural(res.citations.length, 'review')}</h3>
            <p style={{ ...TYPE.body, fontSize: 16.5, color: C2.char, margin: `0 0 ${SPACE.sm}px` }}>{res.answer}</p>
            <h4 style={{ ...TYPE.headline, fontSize: 15, margin: `0 0 ${SPACE.xs}px` }}>Reviews this is based on</h4>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {res.citations.map(c => (
                <li key={c.id} style={{ marginBottom: SPACE.xs }}>
                  <Card padding={SPACE.sm}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ ...TYPE.label, fontWeight: 700, color: C2.teal }}>{c.who}</span>
                      <V2Verdict kind={c.v} label={VERDICT_SHORT[c.v]}/>
                      {c.withPhoto && <SourceBadge source="photo">With photo</SourceBadge>}
                    </div>
                    <p style={{ ...TYPE.callout, margin: '0 0 4px' }}>“{c.text}”</p>
                    <p style={{ ...TYPE.caption, fontWeight: 500, color: C2.slate, margin: 0 }}>{c.when}</p>
                  </Card>
                </li>
              ))}
            </ol>
            <Button variant="ghost" full onClick={() => app.goto('reviews', id)}>Read all reviews</Button>
          </Card>
        )}
        {res && !res.answered && (
          <Banner tone="neutral" icon="question" title="The reviews don’t answer this yet" style={{ marginTop: SPACE.sm }}
            action={{ label: 'Been there? Share your experience', onClick: () => app.goto('review', id) }}>
            {res.answer}
          </Banner>
        )}
      </div>
    </Card>
  );
}

export { AskPlace };
