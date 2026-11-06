'use client';
// Getting there 2 (I2) · "Step by step from the street" — a Getting there
// slot (./slots.js). Short arrival steps from people who've been ("From The
// Corso turn into the laneway; ramp on the left"), most-confirmed set first,
// with an optional photo. Others say "This worked for me". Shown by lived
// experience and date, never by name; never part of a verdict.

import React from 'react';
import {
  ARRIVAL_FROM_MAX, ARRIVAL_STEP_MAX, ARRIVAL_STEP_MIN, ARRIVAL_STEPS_MAX,
} from '@/lib/arrival/places';
import { ALT_MAX, ALT_MIN } from '@/lib/photos/kinds';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import {
  Banner, Badge, Button, Card, IconButton, PhotoGrid, PhotoViewer, SectionHeader, Sheet,
  SkeletonText, SourceBadge, SPACE, RADIUS, TYPE,
} from '../ds';
import { UserText, useFormat, useT } from '../i18n';
import { whoText } from '../trust/text';
import { preparePhoto } from '../photos/resize';

async function call(path, body) {
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(json.error || `${res.status}`); e.status = res.status; throw e; }
  return json;
}

function useArrivalSteps(venueId) {
  const [list, setList] = React.useState(null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    call(`/api/arrival?venue=${encodeURIComponent(venueId)}`)
      .then(d => { if (live) setList(d.steps || []); }, () => { if (live) { setList([]); setFailed(true); } });
    return () => { live = false; };
  }, [venueId]);
  return { list, setList, failed };
}

// One set of steps: an ordered list, its photo, who and when.
function StepSet({ set, onConfirm, busy, headingId }) {
  const t = useT();
  const fmt = useFormat();
  const [open, setOpen] = React.useState(null);
  const photos = set.photo ? [{ ...set.photo, kindLabel: t('nearby.steps.photoKind') }] : [];
  return (
    <div>
      <p id={headingId} style={{ ...TYPE.headline, fontSize: 16, margin: `0 0 ${SPACE.xs}px` }}>
        {set.fromPlace ? <>{t('nearby.steps.from')} <UserText>{set.fromPlace}</UserText></> : t('nearby.steps.fromStreet')}
      </p>
      <ol aria-labelledby={headingId} style={{ margin: 0, paddingLeft: 26, ...TYPE.body }}>
        {set.steps.map((s, i) => <li key={i} style={{ padding: '3px 0' }}><UserText>{s}</UserText></li>)}
      </ol>
      {photos.length > 0 && (
        <div style={{ marginTop: SPACE.sm }}>
          <PhotoGrid photos={photos} onOpen={setOpen} showKind={false}/>
          <PhotoViewer photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)}/>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.xs, marginTop: SPACE.sm }}>
        <SourceBadge source="community">{whoText(t, set.whoNeed, set.whoMore)}</SourceBadge>
        <span style={{ ...TYPE.footnote, color: C2.slate }}>
          <span aria-hidden="true">{fmt.timeAgo(set.createdAt)}</span>
          <span className="ra-sr-only">{t('nearby.steps.addedOn', { date: fmt.date(set.createdAt) })}</span>
        </span>
        {set.confirmations > 0 && (
          <Badge tone="teal" icon="check" size="sm">{t('nearby.steps.confirmed', { count: set.confirmations })}</Badge>
        )}
      </div>
      <div style={{ marginTop: SPACE.sm }}>
        {set.mine ? (
          <Badge tone="neutral" icon="user" size="sm">{t('nearby.steps.yours')}</Badge>
        ) : (
          <Button size="sm" variant={set.confirmedByMe ? 'secondary' : 'outline'} icon="check" data-confirm={set.id}
            aria-pressed={set.confirmedByMe} aria-disabled={busy || set.confirmedByMe || undefined}
            // aria-disabled, not disabled: keyboard focus stays on the button.
            onClick={() => { if (!busy && !set.confirmedByMe) onConfirm(set); }}>
            {set.confirmedByMe ? t('nearby.steps.workedDone') : t('nearby.steps.worked')}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ArrivalSteps({ app, venue }) {
  const t = useT();
  const { list, setList, failed } = useArrivalSteps(venue.id);
  const [adding, setAdding] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [say, setSay] = React.useState('');
  const hid = `steps-h-${venue.id}`;
  // Confirming can re-order the sets (most-confirmed first), which remounts
  // the button: put keyboard focus back on it.
  const refocus = React.useRef(null);
  React.useEffect(() => {
    if (!refocus.current) return;
    document.querySelector(`[data-confirm="${refocus.current}"]`)?.focus();
    refocus.current = null;
  }, [list]);
  const mine = list?.find(s => s.mine) || null;
  const [top, ...rest] = list || [];

  async function confirm(set) {
    setBusy(true);
    try {
      const d = await call(`/api/arrival/${encodeURIComponent(set.id)}`, { action: 'confirm' });
      refocus.current = set.id;
      setList(d.steps);
      setSay(t('nearby.steps.thanksConfirm'));
    } catch { app.toast(t('nearby.steps.failed')); }
    finally { setBusy(false); }
  }

  return (
    <section aria-labelledby={hid} style={{ marginBottom: SPACE.md }}>
      <SectionHeader id={hid} level={3} size="sm" title={t('nearby.steps.title')} description={t('nearby.steps.desc')}/>
      <span className="ra-sr-only" role="status">{say}</span>
      {list === null ? (
        <Card variant="filled"><SkeletonText lines={3}/><span className="ra-sr-only" role="status">{t('common.loading')}</span></Card>
      ) : (
        <Card variant="filled">
          {failed && <Banner tone="warn" style={{ marginBottom: SPACE.sm }}>{t('nearby.steps.loadFailed')}</Banner>}
          {top ? (
            <StepSet set={top} onConfirm={confirm} busy={busy} headingId={`${hid}-top`}/>
          ) : !failed && (
            <p style={{ ...TYPE.callout, margin: 0 }}>{t('nearby.steps.none')}</p>
          )}
          {rest.length > 0 && (
            <div style={{ marginTop: SPACE.md }}>
              <Button size="sm" variant="plain" icon={showAll ? 'up' : 'down'} aria-expanded={showAll}
                aria-controls={`${hid}-more`} onClick={() => setShowAll(x => !x)}>
                {showAll ? t('nearby.steps.hideOthers') : t('nearby.steps.showOthers', { count: rest.length })}
              </Button>
              {showAll && (
                <ul id={`${hid}-more`} style={{ listStyle: 'none', margin: `${SPACE.sm}px 0 0`, padding: 0 }}>
                  {rest.map((s, i) => (
                    <li key={s.id} style={{ borderTop: `1px solid ${C2.hair}`, paddingTop: SPACE.sm, marginTop: SPACE.sm }}>
                      <StepSet set={s} onConfirm={confirm} busy={busy} headingId={`${hid}-o${i}`}/>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div style={{ marginTop: SPACE.md }}>
            <Button size="sm" variant="outline" icon={mine ? 'edit' : 'plus'} onClick={() => setAdding(true)}>
              {mine ? t('nearby.steps.edit') : top ? t('nearby.steps.addYours') : t('nearby.steps.addFirst')}
            </Button>
          </div>
        </Card>
      )}
      {adding && (
        <StepsSheet venue={venue} initial={mine} onClose={() => setAdding(false)}
          onSaved={(steps, replaced) => {
            setList(steps); setAdding(false);
            app.toast(replaced ? t('nearby.steps.thanksUpdated') : t('nearby.steps.thanks'));
          }}/>
      )}
    </section>
  );
}

// ── Add / edit sheet ─────────────────────────────────────────────────────
const field = {
  width: '100%', boxSizing: 'border-box', borderRadius: RADIUS.md, border: `1.5px solid ${C2.line}`,
  padding: '10px 12px', fontFamily: F2, fontSize: RA2_INPUT_FONT, color: C2.char, background: C2.paper,
};
const labelStyle = { display: 'block', ...TYPE.headline, fontSize: 15, margin: `${SPACE.sm}px 0 6px` };

function StepsSheet({ venue, initial, onClose, onSaved }) {
  const t = useT();
  const formId = React.useId();
  const [fromPlace, setFrom] = React.useState(initial?.fromPlace || '');
  const [steps, setSteps] = React.useState(() => (initial?.steps?.length ? [...initial.steps] : ['', '']));
  const [photo, setPhoto] = React.useState(null); // { status, id, preview, alt }
  const [error, setError] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [say, setSay] = React.useState('');
  const stepRefs = React.useRef([]);
  const fileRef = React.useRef(null);
  const focusStep = React.useRef(null);
  React.useEffect(() => {
    if (focusStep.current != null) { stepRefs.current[focusStep.current]?.focus(); focusStep.current = null; }
  });

  const setStep = (i, v) => setSteps(s => s.map((x, j) => (j === i ? v : x)));
  const addStep = () => { focusStep.current = steps.length; setSteps(s => [...s, '']); setSay(t('nearby.form.stepAdded', { n: steps.length + 1 })); };
  const removeStep = i => {
    focusStep.current = Math.max(0, i - 1);
    setSteps(s => s.filter((_, j) => j !== i));
    setSay(t('nearby.form.stepRemoved', { n: i + 1 }));
  };

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhoto({ status: 'uploading', id: null, preview: null, alt: '' });
    setSay(t('photos.say.preparing'));
    try {
      const prepared = await preparePhoto(file);
      const preview = URL.createObjectURL(prepared.thumb);
      const fd = new FormData();
      fd.append('venueId', venue.id); fd.append('kind', 'entrance');
      fd.append('photo', prepared.photo, 'photo.jpg'); fd.append('thumb', prepared.thumb, 'thumb.jpg');
      const r = await fetch('/api/photos', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'upload failed');
      setPhoto({ status: 'ready', id: d.photo.id, preview, alt: '' });
      setSay(t('photos.say.added'));
    } catch {
      setPhoto(null);
      setSay(t('photos.say.uploadFailed'));
      setError(t('photos.say.uploadFailed'));
    }
  }
  function removePhoto() {
    if (photo?.id) fetch(`/api/photos/${photo.id}`, { method: 'DELETE' }).catch(() => {});
    if (photo?.preview) URL.revokeObjectURL(photo.preview);
    setPhoto(null);
    setSay(t('photos.say.removed'));
  }

  async function submit(e) {
    e.preventDefault();
    const clean = steps.map(s => s.trim()).filter(s => s.length >= ARRIVAL_STEP_MIN);
    if (!clean.length) { setError(t('nearby.form.needStep')); stepRefs.current[0]?.focus(); return; }
    if (photo?.status === 'uploading') { setError(t('nearby.form.waitPhoto')); return; }
    if (photo?.id && photo.alt.trim().length < ALT_MIN) { setError(t('nearby.form.needAlt')); return; }
    setSending(true); setError('');
    try {
      const d = await call('/api/arrival', {
        venueId: venue.id, fromPlace, steps: clean,
        photo: photo?.id ? { id: photo.id, alt: photo.alt } : null,
      });
      onSaved(d.steps, d.replaced);
    } catch { setError(t('nearby.steps.failed')); }
    finally { setSending(false); }
  }

  return (
    <Sheet open onClose={onClose} title={t('nearby.form.title', { name: venue.name })} closeLabel={t('nearby.form.close')}
      description={t('nearby.form.desc')}
      footer={<Button type="submit" form={formId} full size="lg" disabled={sending}>{sending ? t('common.sending') : t('nearby.form.submit')}</Button>}>
      <form id={formId} onSubmit={submit} noValidate>
        <span className="ra-sr-only" role="status">{say}</span>
        <label htmlFor={`${formId}-from`} style={{ ...labelStyle, marginTop: 0 }}>
          {t('nearby.form.from')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
        </label>
        <input id={`${formId}-from`} value={fromPlace} onChange={e => setFrom(e.target.value)} maxLength={ARRIVAL_FROM_MAX}
          placeholder={t('nearby.form.fromPlaceholder')} autoComplete="off" style={field}/>

        <fieldset style={{ border: 0, padding: 0, margin: `${SPACE.md}px 0 0` }}>
          <legend style={{ ...TYPE.headline, fontSize: 15, padding: 0, marginBottom: 2 }}>{t('nearby.form.steps')}</legend>
          <p id={`${formId}-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: '0 0 6px' }}>{t('nearby.form.stepsHint')}</p>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: SPACE.xs, marginBottom: SPACE.xs }}>
                <span aria-hidden="true" style={{ width: 22, textAlign: 'right', fontWeight: 700, color: C2.slate, flexShrink: 0 }}>{i + 1}.</span>
                <input ref={el => { stepRefs.current[i] = el; }} value={s} onChange={e => setStep(i, e.target.value)}
                  maxLength={ARRIVAL_STEP_MAX} aria-label={t('nearby.form.stepLabel', { n: i + 1 })}
                  aria-describedby={`${formId}-hint`} autoComplete="off"
                  placeholder={i === 0 ? t('nearby.form.stepPlaceholder1') : i === 1 ? t('nearby.form.stepPlaceholder2') : ''}
                  style={{ ...field, flex: 1, minWidth: 0 }}/>
                {steps.length > 1 && (
                  <IconButton icon="close" size="sm" variant="ghost" label={t('nearby.form.removeStep', { n: i + 1 })} onClick={() => removeStep(i)}/>
                )}
              </li>
            ))}
          </ol>
          {steps.length < ARRIVAL_STEPS_MAX && (
            <Button size="sm" variant="plain" icon="plus" onClick={addStep}>{t('nearby.form.addStep')}</Button>
          )}
        </fieldset>

        <div style={{ marginTop: SPACE.md }}>
          <p style={{ ...TYPE.headline, fontSize: 15, margin: '0 0 2px' }}>
            {t('nearby.form.photo')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
          </p>
          <p style={{ ...TYPE.footnote, color: C2.slate, margin: '0 0 6px' }}>{t('nearby.form.photoHint')}</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} hidden tabIndex={-1} aria-hidden="true"/>
          {!photo ? (
            <Button size="sm" variant="outline" icon="camera" onClick={() => fileRef.current?.click()}>{t('nearby.form.addPhoto')}</Button>
          ) : (
            <div style={{ display: 'flex', gap: SPACE.sm, alignItems: 'flex-start' }}>
              {photo.preview
                // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
                ? <img src={photo.preview} alt="" width={72} height={72} style={{ objectFit: 'cover', borderRadius: RADIUS.sm, flexShrink: 0 }}/>
                : <span style={{ width: 72, height: 72, borderRadius: RADIUS.sm, background: C2.stone, flexShrink: 0 }}/>}
              <div style={{ flex: 1, minWidth: 0 }}>
                {photo.status === 'uploading' ? <p style={{ ...TYPE.footnote, margin: 0 }}>{t('nearby.form.uploading')}</p> : (
                  <>
                    <label htmlFor={`${formId}-alt`} style={{ ...labelStyle, marginTop: 0 }}>{t('nearby.form.alt')}</label>
                    <input id={`${formId}-alt`} value={photo.alt} maxLength={ALT_MAX} autoComplete="off"
                      onChange={e => setPhoto(p => ({ ...p, alt: e.target.value }))}
                      placeholder={t('nearby.form.altPlaceholder')} style={field}/>
                  </>
                )}
                <Button size="sm" variant="plain" icon="close" onClick={removePhoto} style={{ marginTop: 4 }}>{t('nearby.form.removePhoto')}</Button>
              </div>
            </div>
          )}
        </div>
        <p style={{ ...TYPE.footnote, color: C2.slate, margin: `${SPACE.md}px 0 0` }}>{t('nearby.form.privacy')}</p>
        {error && <Banner tone="danger" live="assertive" style={{ marginTop: SPACE.sm }}>{error}</Banner>}
      </form>
    </Sheet>
  );
}
