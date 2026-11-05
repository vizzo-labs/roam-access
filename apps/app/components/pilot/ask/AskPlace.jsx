'use client';

import React from 'react';
import { V2Dictate } from '../ui/Dictate';
import { V2Verdict } from '../ui/Verdict';
import { C2 } from '../ui/palette';
import { Banner, Button, Card, SectionHeader, SourceBadge, SPACE, TYPE, RADIUS, edge } from '../ds';
import { UserText, useFormat, useLocale } from '../i18n';
import { reviewText, reviewWhen, reviewWho } from '../trust/text';

// #15 — "Ask about this place". Typed or dictated. Answered only from this
// place's Roam reviews (and their photo descriptions), with the reviews it
// used listed underneath. If the reviews don't say, it says so.

const QUESTION_MAX = 300;

function AskPlace({ app, venue }) {
  const { t, locale } = useLocale();
  const fmt = useFormat();
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, locale }),
      });
      const d = await r.json().catch(() => ({}));
      if (typeof d.remaining === 'number') setRemaining(d.remaining);
      if (!r.ok) { setState({ status: 'error', key: d.error === 'limit' ? 'ask.limit' : d.error === 'unavailable' ? 'ask.unavailable' : 'ask.error' }); return; }
      setState({ status: 'done', result: d.result });
    } catch {
      setState({ status: 'error', key: 'ask.offline' });
    }
  }

  const res = state.status === 'done' ? state.result : null;
  const out = remaining === 0;

  return (
    <Card as="section" aria-labelledby="ask-h" style={{ marginBottom: SPACE.md }}>
      <SectionHeader id="ask-h" title={t('ask.title')} size="sm"
        description={t('ask.description', { name: venue.name })}/>

      {!venue.verified ? (
        <p style={{ ...TYPE.callout, color: C2.char, margin: 0 }}>
          {t('ask.noReviewsYet')}
        </p>
      ) : (
        <form onSubmit={ask}>
          <label htmlFor="ask-q" style={{ ...TYPE.headline, display: 'block', marginBottom: 6 }}>{t('ask.label')}</label>
          <textarea id="ask-q" value={q} rows={2} maxLength={QUESTION_MAX} aria-describedby="ask-left"
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) ask(e); }}
            placeholder={t('ask.placeholder')}
            style={{
              ...TYPE.input, width: '100%', boxSizing: 'border-box', borderRadius: RADIUS.md, border: edge(),
              padding: SPACE.sm, color: C2.char, background: C2.paper, resize: 'vertical',
            }}/>
          <V2Dictate onText={said => setQ(x => (x ? x.trimEnd() + ' ' : '') + said)}/>
          <Button type="submit" full style={{ marginTop: SPACE.sm }} disabled={q.trim().length < 3 || state.status === 'loading' || out}>
            {state.status === 'loading' ? t('ask.reading') : t('ask.submit')}
          </Button>
          <p id="ask-left" style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.xs}px 0 0`, textAlign: 'center' }}>
            {remaining == null ? '' : out ? t('ask.out') : t('ask.left', { count: remaining })}
          </p>
        </form>
      )}

      <div aria-live="polite" aria-busy={state.status === 'loading'}>
        {state.status === 'error' && (
          <Banner tone="danger" style={{ marginTop: SPACE.sm }}>{t(state.key)}</Banner>
        )}
        {res && res.answered && (
          <Card variant="tint" style={{ marginTop: SPACE.sm }}>
            <h3 style={{ ...TYPE.overline, color: C2.slate, margin: '0 0 6px' }}>{t('ask.from', { count: res.citations.length })}</h3>
            <p style={{ ...TYPE.body, fontSize: 16.5, color: C2.char, margin: `0 0 ${SPACE.sm}px` }}><UserText>{res.answer}</UserText></p>
            <h4 style={{ ...TYPE.headline, fontSize: 15, margin: `0 0 ${SPACE.xs}px` }}>{t('ask.basedOn')}</h4>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {res.citations.map(c => (
                <li key={c.id} style={{ marginBottom: SPACE.xs }}>
                  <Card padding={SPACE.sm}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ ...TYPE.label, fontWeight: 700, color: C2.teal }}>{reviewWho(t, c)}</span>
                      <V2Verdict kind={c.v} label={t(`review.v.${c.v}`)}/>
                      {c.withPhoto && <SourceBadge source="photo">{t('ask.withPhoto')}</SourceBadge>}
                    </div>
                    <p style={{ ...TYPE.callout, margin: '0 0 4px' }}>“{c.own === false ? reviewText(t, c) : <UserText>{c.text}</UserText>}”</p>
                    <p style={{ ...TYPE.caption, fontWeight: 500, color: C2.slate, margin: 0 }}>{reviewWhen(fmt, c)}</p>
                  </Card>
                </li>
              ))}
            </ol>
            <Button variant="ghost" full onClick={() => app.goto('reviews', id)}>{t('ask.readAll')}</Button>
          </Card>
        )}
        {res && !res.answered && (
          <Banner tone="neutral" icon="question" title={t('ask.notTitle')} style={{ marginTop: SPACE.sm }}
            action={{ label: t('ask.notAction'), onClick: () => app.goto('review', id) }}>
            {res.answerKey ? t(res.answerKey) : <UserText>{res.answer}</UserText>}
          </Banner>
        )}
      </div>
    </Card>
  );
}

export { AskPlace };
