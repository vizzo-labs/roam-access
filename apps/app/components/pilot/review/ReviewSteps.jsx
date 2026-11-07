'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { featureText, needText } from '@/lib/i18n/data';
import { featuresFor } from '@/lib/pilot/key-facts';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META } from '../ui/Verdict';
import { C2, F2, M2 } from '../ui/palette';
import { V2Dictate } from '../ui/Dictate';
import { Button, GUTTER, SPACE, Stepper, TYPE, TextArea, YesNoNotSure } from '../ds';
import { useT } from '../i18n';
import { EntranceQuestion } from '../trust/EntranceQuestion';
import { EntranceMarker } from '../arrival/EntranceMarker';
import { entrancePayload, entranceShown } from '../arrival/entranceForm';
import { ReviewStepsEntry } from '../arrival/ReviewStepsEntry';
import { ReviewPhotos, useReviewPhotos, PhotoSuggestion } from '../photos/ReviewPhotos';
import { SensoryQuestions, EMPTY_SENSORY } from '../sensory/SensoryQuestions';
import { ShownAs } from './ShownAs';

const TOTAL = 3;

// ─────────────────────────────────────────────────────────────
// REVIEW — three short steps; Send on every step; only the verdict is
// required. 1 "How was Hugos?" (three big choices) · 2 the questions for
// THIS person's needs (max 3; Yes / No / Not sure) · 3 "Anything else?"
// (photo, a few words, noise and crowds, steps from the street).
// Carers answer about the person they were with ("It worked for them",
// "Whose needs?"). Allies use review/AllyReview (no verdict).
// ─────────────────────────────────────────────────────────────
function ReviewSteps({ app, venue: v, carer = false, headingRef }) {
  const t = useT();
  const [step, setStep] = React.useState(1);
  const [whose, setWhose] = React.useState(() => new Set(app.user?.needs || []));
  const [choice, setChoice] = React.useState(null);
  const [features, setFeatures] = React.useState({});
  const [note, setNote] = React.useState('');
  const [entranceAlt, setEntranceAlt] = React.useState(null);
  const [entranceNote, setEntranceNote] = React.useState('');
  const [altMap, setAltMap] = React.useState(false);
  const [mark, setMark] = React.useState({ kind: 'main', pin: null, note: '' });
  const [markOpen, setMarkOpen] = React.useState(false);
  const [sensoryOpen, setSensoryOpen] = React.useState(false);
  const [sensory, setSensory] = React.useState(EMPTY_SENSORY);
  const [sending, setSending] = React.useState(false);
  const photos = useReviewPhotos(v.id);
  const photoBlock = photos.busy
    ? t('review.hint.photosBusy')
    : photos.needsAlt.length ? t('review.hint.describe', { count: photos.needsAlt.length }) : null;

  // Only the questions for this person's needs (a carer: the person's), in
  // the order that helps most people; nobody with needs set gets two.
  const needs = carer ? [...whose] : app.user?.needs || [];
  const questions = featuresFor(needs).slice(0, needs.length ? 3 : 2);
  const optKey = carer ? 'contrib.review.carer.opt' : 'review.opt';
  const titles = {
    1: t('review.title', { name: v.name }),
    2: t('steps.q.title', { count: questions.length }),
    3: t('steps.x.title'),
  };

  // Each step: focus its h1 and say "Step 2 of 3. 2 quick questions."
  const [said, setSaid] = React.useState('');
  const shownStep = React.useRef(step);
  React.useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    headingRef.current?.focus();
    setSaid(t('steps.announce', { step, total: TOTAL, title: titles[step] }));
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFeature = (id, val) => setFeatures(f => ({ ...f, [id]: val }));
  const toggleWhose = id => setWhose(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function send() {
    if (!choice || sending || photoBlock) return;
    setSending(true);
    const answers = Object.fromEntries(Object.entries(features).filter(([, val]) => val === 'yes' || val === 'no'));
    const entrance = answers.stepfree === 'no' && entranceAlt
      ? { entranceAlt, entranceNote: entranceAlt === 'none' ? '' : entranceNote } : {};
    const door = entrancePayload({ features: answers, entranceAlt, entranceNote, mark, markOpen, photos: photos.photos });
    const ok = await app.submitReview({
      venueId: v.id, verdict: choice, features: answers, note, ...entrance, entrance: door, photos: photos.payload,
      sensory: sensoryOpen ? sensory : EMPTY_SENSORY, ...(carer ? { needs: [...whose] } : {}),
    });
    if (ok) app.goto('thanks', v.id, { replace: true }); // Back must not reopen a sent form
    else setSending(false);
  }

  const hintId = `rev-hint-${step}`;
  const sendBlock = (
    <div style={{ marginTop: SPACE.lg }}>
      <Button full size="lg" onClick={send} disabled={!choice || sending || !!photoBlock} aria-describedby={hintId}>
        {sending ? t('common.sending') : t('steps.send')}
      </Button>
      <p id={hintId} style={{ ...TYPE.footnote, color: C2.slate, textAlign: 'center', margin: `${SPACE.xs}px 0 0` }}>
        {!choice ? t('steps.v.hint') : photoBlock || ''}
      </p>
    </div>
  );

  return (
    <V2Shell>
      <div style={{ padding: `10px ${GUTTER}px ${SPACE.xl}px` }}>
        <Button variant="plain" icon="back" style={{ textDecoration: 'none', padding: '0 12px 0 4px', marginLeft: -4, minHeight: 48 }}
          onClick={() => (step === 1 ? app.goto('venue', v.id) : setStep(step - 1))}
          aria-label={step === 1 ? t('steps.backTo', { name: v.name }) : t('steps.backStep')}>
          {step === 1 ? t('steps.back') : t('steps.backStep')}
        </Button>
        <Stepper step={step} total={TOTAL}/>
        <p className="ra-sr-only" role="status" aria-live="polite">{said}</p>
        <ShownAs app={app} needs={needs} style={{ marginTop: SPACE.xs }}/>

        <section aria-labelledby="rev-step-h" style={{ marginTop: SPACE.md }}>
          <h1 id="rev-step-h" ref={headingRef} tabIndex={-1} style={{ ...TYPE.title1, margin: 0, color: C2.char }}>
            <span className="ra-sr-only">{t('onboarding.step', { step, total: TOTAL })}. </span>{titles[step]}
          </h1>

          {step === 1 && (
            <>
              <p style={{ ...TYPE.body, color: C2.char, margin: `${SPACE.xs}px 0 ${SPACE.md}px` }}>{carer ? t('steps.v.leadCarer') : t('steps.v.lead')}</p>
              <div role="group" aria-label={t('steps.v.group')} style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
                {['works', 'check', 'barrier'].map(kind => {
                  const meta = V2_VERDICT_META[kind];
                  const on = choice === kind;
                  return (
                    <button key={kind} type="button" onClick={() => setChoice(kind)} aria-pressed={on} className="ds-press" style={{
                      width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px',
                      minHeight: 84, borderRadius: 18, padding: '12px 16px', boxSizing: 'border-box',
                      border: on ? `3px solid ${meta.fg}` : `1.5px solid ${C2.line}`,
                      background: on ? meta.bg : C2.paper, cursor: 'pointer', fontFamily: F2, textAlign: 'left',
                    }}>
                      <span aria-hidden="true" style={{
                        width: 44, height: 44, borderRadius: 999, background: meta.fg, color: meta.bg, flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, fontFamily: M2,
                      }}>{meta.icon}</span>
                      <span style={{ flex: '1 1 7em', minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 18.5, fontWeight: 700, color: C2.char, lineHeight: 1.25 }}>{t(`${optKey}.${kind}.label`)}</span>
                        <span style={{ display: 'block', ...TYPE.footnote, color: C2.slate, marginTop: 2 }}>{t(`${optKey}.${kind}.sub`)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {sendBlock}
              <Button full variant="secondary" onClick={() => setStep(2)} style={{ marginTop: SPACE.xs }}>
                {t('steps.more', { count: questions.length })}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p style={{ ...TYPE.body, color: C2.char, margin: `${SPACE.xs}px 0 ${SPACE.md}px` }}>{carer ? t('steps.q.leadCarer') : t('steps.q.lead')}</p>
              {carer && (
                <div style={{ marginBottom: SPACE.md }}>
                  <p id="rev-whose" style={{ ...TYPE.headline, margin: '0 0 4px' }}>{t('contrib.review.carer.needs.title')}</p>
                  <div role="group" aria-labelledby="rev-whose" style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs }}>
                    {RA2_NEEDS.map(n => {
                      const on = whose.has(n.id);
                      return (
                        <button key={n.id} type="button" aria-pressed={on} onClick={() => toggleWhose(n.id)} className="ds-press" style={{
                          minHeight: 44, padding: '8px 14px', borderRadius: 22, cursor: 'pointer', fontFamily: F2, fontSize: 15, fontWeight: 600,
                          border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`, background: on ? C2.tealSoft : C2.paper, color: C2.char,
                          display: 'inline-flex', alignItems: 'center', gap: 6, textAlign: 'left',
                        }}>{on && <span aria-hidden="true">✓</span>}{needText(t, n.id, 'chip')}</button>
                      );
                    })}
                  </div>
                </div>
              )}
              {questions.map(id => (
                <YesNoNotSure key={id} id={`q-${id}`} question={featureText(t, id, 'question')} value={features[id]}
                  onChange={val => setFeature(id, val)}>
                  {id === 'stepfree' && features.stepfree === 'no' && (
                    <EntranceQuestion value={entranceAlt} note={entranceNote} onChange={setEntranceAlt} onNote={setEntranceNote}>
                      {entranceAlt && entranceAlt !== 'none' && (altMap
                        ? <EntranceMarker venue={v} value={{ ...mark, kind: entranceAlt }} onChange={setMark} photos={photos}/>
                        : <Button variant="plain" icon="pin" onClick={() => setAltMap(true)} style={{ padding: '0 4px' }}>{t('steps.q.map')}</Button>)}
                    </EntranceQuestion>
                  )}
                  {id === 'stepfree' && features.stepfree === 'yes' && (markOpen
                    ? <EntranceMarker venue={v} value={mark} onChange={setMark} showKinds showNote photos={photos}/>
                    : <Button variant="plain" icon="pin" onClick={() => setMarkOpen(true)} style={{ padding: '0 4px', marginTop: SPACE.xs }}>{t('arrival.mark.open')}</Button>)}
                  {(features[id] === undefined || features[id] === 'unsure') && (
                    <PhotoSuggestion featureId={id} suggestion={photos.suggestions[id]} onUse={setFeature}/>
                  )}
                </YesNoNotSure>
              ))}
              {sendBlock}
              <Button full variant="secondary" onClick={() => setStep(3)} style={{ marginTop: SPACE.xs }}>{t('steps.q.toExtras')}</Button>
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ ...TYPE.body, color: C2.char, margin: `${SPACE.xs}px 0 ${SPACE.md}px` }}>{t('steps.x.lead')}</p>
              <ReviewPhotos venueName={v.name} state={photos} hideTag={entranceShown(features, entranceAlt, markOpen || altMap) ? 'entrance' : null}/>
              <div style={{ marginTop: SPACE.md }}>
                <label htmlFor="rev-note" style={{ display: 'block', ...TYPE.headline, marginBottom: SPACE.xs }}>
                  {t('review.note.label')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
                </label>
                <TextArea id="rev-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={1000}
                  placeholder={t('review.note.placeholder')}/>
                <V2Dictate onText={words => setNote(n => (n ? n.trimEnd() + ' ' : '') + words)}/>
              </div>
              <p style={{ ...TYPE.headline, margin: `${SPACE.lg}px 0 ${SPACE.xs}px` }}>{t('steps.x.addMore')}</p>
              {sensoryOpen
                ? <SensoryQuestions value={sensory} onChange={setSensory} needs={app.user?.needs || []}/>
                : <Button variant="outline" full onClick={() => setSensoryOpen(true)} aria-expanded={false}>{t('steps.x.sensory')}</Button>}
              <ReviewStepsEntry venue={v}/>
              {sendBlock}
            </>
          )}
        </section>
      </div>
    </V2Shell>
  );
}

export { ReviewSteps };
