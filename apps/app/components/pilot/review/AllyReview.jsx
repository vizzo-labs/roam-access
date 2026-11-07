'use client';

import React from 'react';
import { featureText } from '@/lib/i18n/data';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { V2Dictate } from '../ui/Dictate';
import { Banner, Button, Disclosure, GUTTER, SPACE, TYPE, TextArea, YesNoNotSure } from '../ds';
import { useT } from '../i18n';
import { ReviewPhotos, useReviewPhotos } from '../photos/ReviewPhotos';
import { ShownAs } from './ShownAs';

const FIRST = ['stepfree', 'bathroom', 'seats', 'quiet', 'simple'];
const MORE = ['calm', 'hearing', 'vision'];

// ─────────────────────────────────────────────────────────────
// ALLY — "What did you notice at Hugos?": one screen, no verdict. Yes / No /
// Not sure for what they saw, a photo, a few words. Saved as an observation
// ("Observed by an ally") that never sets or changes a verdict.
// ─────────────────────────────────────────────────────────────
function AllyReview({ app, venue: v, headingRef }) {
  const t = useT();
  const [features, setFeatures] = React.useState({});
  const [note, setNote] = React.useState('');
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const photos = useReviewPhotos(v.id);
  const answers = Object.fromEntries(Object.entries(features).filter(([, val]) => val === 'yes' || val === 'no'));
  const photoBlock = photos.busy
    ? t('review.hint.photosBusy')
    : photos.needsAlt.length ? t('review.hint.describe', { count: photos.needsAlt.length }) : null;
  const ready = Object.keys(answers).length > 0 || !!note.trim() || photos.photos.length > 0;

  async function send() {
    if (!ready || sending || photoBlock) return;
    setSending(true);
    const ok = await app.submitReview({ venueId: v.id, verdict: null, features: answers, note, photos: photos.payload });
    if (ok) app.goto('thanks', v.id, { replace: true });
    else setSending(false);
  }
  const q = id => (
    <YesNoNotSure key={id} id={`aq-${id}`} question={featureText(t, id, 'question')} value={features[id]}
      onChange={val => setFeatures(f => ({ ...f, [id]: val }))}/>
  );

  return (
    <V2Shell>
      <div style={{ padding: `10px ${GUTTER}px ${SPACE.xl}px` }}>
        <Button variant="plain" icon="back" style={{ textDecoration: 'none', padding: '0 12px 0 4px', marginLeft: -4, minHeight: 48 }}
          onClick={() => app.goto('venue', v.id)} aria-label={t('steps.backTo', { name: v.name })}>{t('steps.back')}</Button>
        <ShownAs app={app} ally style={{ marginTop: SPACE.xs }}/>
        <h1 ref={headingRef} tabIndex={-1} style={{ ...TYPE.title1, margin: `${SPACE.md}px 0 0`, color: C2.char }}>
          {t('contrib.review.ally.title', { name: v.name })}
        </h1>
        <Banner tone="info" style={{ marginTop: SPACE.sm }}>{t('steps.ally.banner')}</Banner>
        <p style={{ ...TYPE.body, color: C2.char, margin: `${SPACE.sm}px 0 ${SPACE.xs}px` }}>{t('steps.ally.lead')}</p>

        {FIRST.map(q)}
        <Disclosure title={t('steps.ally.more', { count: MORE.length })} open={moreOpen} onToggle={setMoreOpen}>
          {MORE.map(q)}
        </Disclosure>

        <p style={{ ...TYPE.headline, margin: `${SPACE.lg}px 0 ${SPACE.xs}px` }}>{t('steps.ally.extras')}</p>
        <ReviewPhotos venueName={v.name} state={photos}/>
        <div style={{ marginTop: SPACE.md }}>
          <label htmlFor="ally-note" style={{ display: 'block', ...TYPE.headline, marginBottom: SPACE.xs }}>
            {t('review.note.label')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
          </label>
          <TextArea id="ally-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={1000}
            placeholder={t('review.note.placeholder')}/>
          <V2Dictate onText={words => setNote(n => (n ? n.trimEnd() + ' ' : '') + words)}/>
        </div>

        <div style={{ marginTop: SPACE.lg }}>
          <Button full size="lg" onClick={send} disabled={!ready || sending || !!photoBlock} aria-describedby="ally-hint">
            {sending ? t('common.sending') : t('contrib.review.ally.send')}
          </Button>
          <p id="ally-hint" style={{ ...TYPE.footnote, color: C2.slate, textAlign: 'center', margin: `${SPACE.xs}px 0 0` }}>
            {!ready ? t('contrib.review.ally.choose') : photoBlock || t('steps.ally.sent')}
          </p>
        </div>
      </div>
    </V2Shell>
  );
}

export { AllyReview };
