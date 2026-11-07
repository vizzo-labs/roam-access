'use client';

import React from 'react';
import { RA2_FEATURES } from '@/lib/pilot-data';
import { V2BigBtn } from '../ui/Buttons';
import { Button } from '../ds';
import { V2Dictate } from '../ui/Dictate';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META } from '../ui/Verdict';
import { C2, F2, M2, RA2_INPUT_FONT, V2_H1 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2NeedTags } from '@/lib/pilot/match';
import { EntranceQuestion } from '../trust/EntranceQuestion';
import { EntranceMarker } from '../arrival/EntranceMarker';
import { entrancePayload, entranceShown } from '../arrival/entranceForm';
import { ReviewStepsEntry } from '../arrival/ReviewStepsEntry';
import { ReviewPhotos, useReviewPhotos, PhotoSuggestion } from '../photos/ReviewPhotos';
import { SensoryQuestions, EMPTY_SENSORY } from '../sensory/SensoryQuestions';
import { useT } from '../i18n';
import { featureText, needText } from '@/lib/i18n/data';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { previewLine } from '../contrib/authorText';

// ─────────────────────────────────────────────────────────────
// REVIEW — one tap required, everything else optional.
// Adapts to who is writing (Me → How I appear on reviews, Brief L):
// - lived experience / prefer not to say / never chosen: this form as always;
// - carer: the same steps about the person they were with ("It worked for
//   them"), plus "Whose needs?" (from the profile, editable for this visit);
// - ally: NO verdict question. It opens at "What did you notice?" (the yes/no
//   questions, photos, the entrance pin, sensory, a note, arrival steps) and is
//   saved as an observation that never sets or changes a verdict.
// ─────────────────────────────────────────────────────────────
function V2ReviewView({ app }) {
  const t = useT();
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('review-' + v.id);
  const rel = app.user?.pub?.relationship;
  const mode = rel === 'ally' ? 'ally' : rel === 'carer' ? 'carer' : 'lived';
  const [whose, setWhose] = React.useState(() => new Set(app.user?.needs || []));
  const [choice, setChoice] = React.useState(null);
  const [features, setFeatures] = React.useState({});
  const [note, setNote] = React.useState('');
  const [entranceAlt, setEntranceAlt] = React.useState(null);
  const [entranceNote, setEntranceNote] = React.useState('');
  // Getting there (I1): where the step-free door is. `kind` is used only on
  // the "Step-free way in? Yes" path (the "No" path's answer is the kind).
  const [mark, setMark] = React.useState({ kind: 'main', pin: null, note: '' });
  const [markOpen, setMarkOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sensory, setSensory] = React.useState(EMPTY_SENSORY);
  const photos = useReviewPhotos(v.id);
  const photoBlock = photos.busy
    ? t('review.hint.photosBusy')
    : photos.needsAlt.length ? t('review.hint.describe', { count: photos.needsAlt.length }) : null;

  // Questions that touch this tester's own needs (a carer: the person's) come first.
  const mine = ra2NeedTags(mode === 'carer' ? [...whose] : app.user?.needs || []);
  const questions = [...RA2_FEATURES].sort((x, y) => (mine.includes(y.id) ? 1 : 0) - (mine.includes(x.id) ? 1 : 0));

  const optKey = mode === 'carer' ? 'contrib.review.carer.opt' : 'review.opt';
  const options = mode === 'ally' ? [] : ['works', 'check', 'barrier'].map(kind => ({
    kind, label: t(`${optKey}.${kind}.label`), sub: t(`${optKey}.${kind}.sub`),
  }));
  // An ally sends once they've answered something; everyone else picks a verdict.
  const answered = Object.keys(features).length > 0 || !!entranceAlt || !!note.trim() || photos.photos.length > 0
    || !!(sensory.noise || sensory.light || sensory.crowd || sensory.quietTimes?.length) || (markOpen && !!mark.pin);
  const ready = mode === 'ally' ? answered : !!choice;
  const toggleWhose = id => setWhose(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // Tapping the selected answer again clears it ("not sure").
  const setFeature = (id, val) => setFeatures(f => {
    const next = { ...f };
    if (next[id] === val) delete next[id]; else next[id] = val;
    return next;
  });

  async function send() {
    if (!ready || sending || photoBlock) return;
    setSending(true);
    // The entrance follow-up only counts when the main way in has steps.
    const entrance = features.stepfree === 'no' && entranceAlt
      ? { entranceAlt, entranceNote: entranceAlt === 'none' ? '' : entranceNote } : {};
    const door = entrancePayload({ features, entranceAlt, entranceNote, mark, markOpen, photos: photos.photos });
    const ok = await app.submitReview({
      venueId: v.id, verdict: mode === 'ally' ? null : choice, features, note, ...entrance, entrance: door, photos: photos.payload, sensory,
      ...(mode === 'carer' ? { needs: [...whose] } : {}),
    });
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
        }}>{t('review.skip')}</button>
      </div>

      <div style={{ padding: '14px 24px 24px' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 10px' }}>
          {mode === 'ally' ? t('contrib.observed.label') : t('review.overline')}
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, lineHeight: 1.1, marginBottom: 8 }}>
          {mode === 'ally' ? t('contrib.review.ally.title', { name: v.name }) : t('review.title', { name: v.name })}
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 26px', fontFamily: F2 }}>
          {mode === 'ally' ? t('contrib.review.ally.intro') : mode === 'carer' ? t('contrib.review.carer.intro') : t('review.intro')}
        </p>

        {mode === 'carer' && (
          <section aria-labelledby="rev-whose" style={{ marginBottom: 22 }}>
            <h2 id="rev-whose" style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', fontFamily: F2 }}>{t('contrib.review.carer.needs.title')}</h2>
            <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 10px', lineHeight: 1.45, fontFamily: F2 }}>{t('contrib.review.carer.needs.hint')}</p>
            <div role="group" aria-label={t('contrib.review.carer.needs.group')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RA2_NEEDS.map(n => {
                const on = whose.has(n.id);
                return (
                  <button key={n.id} type="button" aria-pressed={on} onClick={() => toggleWhose(n.id)} style={{
                    minHeight: 44, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: F2, fontSize: 15, fontWeight: 600,
                    border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`, background: on ? C2.tealSoft : C2.paper, color: C2.char,
                    display: 'inline-flex', alignItems: 'center', gap: 6, textAlign: 'left',
                  }}>
                    {on && <span aria-hidden="true">✓</span>}{needText(t, n.id, 'chip')}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {options.map(o => {
          const meta = V2_VERDICT_META[o.kind];
          const on = choice === o.kind;
          return (
            <button key={o.kind} onClick={() => setChoice(o.kind)} aria-pressed={on} style={{
              width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px',
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
              <span style={{ flex: '1 1 7em', minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3, color: C2.char }}>{o.label}</span>
                <span style={{ display: 'block', fontSize: 14.5, color: C2.slate, lineHeight: 1.35 }}>{o.sub}</span>
              </span>
            </button>
          );
        })}

        {/* An ally starts at "What did you notice?"; photos come after it. */}
        {mode !== 'ally' && <ReviewPhotos venueName={v.name} state={photos} hideTag={entranceShown(features, entranceAlt, markOpen) ? 'entrance' : null}/>}

        <section aria-labelledby="rev-more" style={{ marginTop: mode === 'ally' ? 0 : 22 }}>
          <h2 id="rev-more" style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', fontFamily: F2 }}>
            {mode === 'ally' ? t('contrib.review.ally.more') : <>{t('review.more.title')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span></>}
          </h2>
          <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 10px', lineHeight: 1.45, fontFamily: F2 }}>
            {mode === 'ally' ? t('contrib.review.ally.moreHint') : t('review.more.hint')}
          </p>
          {questions.map(q => (
            <React.Fragment key={q.id}>
            <div role="group" aria-labelledby={`q-${q.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderTop: `1px solid ${C2.hair}`,
            }}>
              <span id={`q-${q.id}`} style={{ flex: 1, fontSize: 15.5, lineHeight: 1.35, fontWeight: 600, fontFamily: F2, color: C2.char }}>{featureText(t, q.id, 'question')}</span>
              {['yes', 'no'].map(val => {
                const on = features[q.id] === val;
                return (
                  <button key={val} type="button" aria-pressed={on} onClick={() => setFeature(q.id, val)} style={{
                    minWidth: 58, minHeight: 44, borderRadius: 999, flexShrink: 0,
                    border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
                    background: on ? C2.teal : C2.paper, color: on ? C2.paper : C2.char,
                    fontWeight: 700, fontSize: 15, fontFamily: F2, cursor: 'pointer',
                  }}>{val === 'yes' ? t('common.yes') : t('common.no')}</button>
                );
              })}
            </div>
            {q.id === 'stepfree' && features.stepfree === 'no' && (
              <EntranceQuestion value={entranceAlt} note={entranceNote} onChange={setEntranceAlt} onNote={setEntranceNote}>
                {entranceAlt && entranceAlt !== 'none' && (
                  <EntranceMarker venue={v} value={{ ...mark, kind: entranceAlt }} onChange={setMark} photos={photos}/>
                )}
              </EntranceQuestion>
            )}
            {q.id === 'stepfree' && features.stepfree === 'yes' && (
              markOpen
                ? <EntranceMarker venue={v} value={mark} onChange={setMark} showKinds showNote photos={photos}/>
                : (
                  <div style={{ margin: '0 0 8px' }}>
                    <Button variant="outline" size="sm" icon="pin" full onClick={() => setMarkOpen(true)}>{t('arrival.mark.open')}</Button>
                  </div>
                )
            )}
            {features[q.id] === undefined && (
              <PhotoSuggestion featureId={q.id} suggestion={photos.suggestions[q.id]} onUse={setFeature}/>
            )}
            </React.Fragment>
          ))}
        </section>

        {mode === 'ally' && <ReviewPhotos venueName={v.name} state={photos} hideTag={entranceShown(features, entranceAlt, markOpen) ? 'entrance' : null}/>}

        <SensoryQuestions value={sensory} onChange={setSensory} needs={app.user?.needs || []}/>

        <div style={{ marginTop: 18 }}>
          <label htmlFor="rev-note" style={{ display: 'block', fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: F2 }}>
            {t('review.note.label')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
          </label>
          <textarea id="rev-note" value={note} onChange={e => setNote(e.target.value)} rows={4} maxLength={1000}
            placeholder={t('review.note.placeholder')}
            style={{
              width: '100%', boxSizing: 'border-box', borderRadius: 16, border: `1.5px solid ${C2.line}`,
              padding: 14, fontSize: RA2_INPUT_FONT, fontFamily: F2, lineHeight: 1.45, color: C2.char,
              background: C2.paper, resize: 'vertical',
            }}/>
          <V2Dictate onText={t => setNote(n => (n ? n.trimEnd() + ' ' : '') + t)}/>
        </div>

        {/* Getting there (I4): optional, saved on its own — never blocks Send. */}
        <ReviewStepsEntry venue={v}/>

        <div style={{ marginTop: 20 }}>
          <V2BigBtn kind="primary" onClick={send} disabled={!ready || sending || !!photoBlock} ariaDescribedBy="rev-hint">
            {sending ? t('common.sending') : mode === 'ally' ? t('contrib.review.ally.send') : t('review.send')}
          </V2BigBtn>
        </div>
        <p id="rev-hint" style={{ fontSize: 13.5, color: C2.slate, textAlign: 'center', marginTop: 12, lineHeight: 1.4, fontFamily: F2 }}>
          {!ready ? t(mode === 'ally' ? 'contrib.review.ally.choose' : 'review.hint.choose')
            : photoBlock || (app.user?.pub?.relationship
              // How this review will be credited (Brief L); older accounts keep the old promise.
              ? t('contrib.review.shownAs', { who: previewLine(t, app.user.pub, mode === 'carer' ? [...whose] : app.user?.needs) })
              : t('review.hint.private'))}
        </p>
      </div>
    </V2Shell>
  );
}

export { V2ReviewView };
