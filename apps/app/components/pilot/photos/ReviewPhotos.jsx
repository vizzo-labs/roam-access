'use client';

import React from 'react';
import { ALT_MAX, ALT_MIN, MAX_PHOTOS_PER_REVIEW, PHOTO_KINDS, SUGGESTABLE } from '@/lib/photos/kinds';
import { RA2_FEATURES } from '@/lib/pilot-data';
import { preparePhoto } from './resize';
import { C2 } from '../ui/palette';
import { Banner, Button, Card, Icon, SectionHeader, SPACE, TYPE, RADIUS, edge, tone } from '../ds';
import { UserText, useT } from '../i18n';
import { featureText } from '@/lib/i18n/data';

// Photos in the review form (#3) + suggestions from them (#16).
// Each photo: resized and stripped of location data in the browser, uploaded
// as a draft, then (optionally) looked at by an AI model that suggests a
// description and yes/no answers. Suggestions are never applied by
// themselves: the description must be confirmed or edited, and each answer
// has its own "Use this answer" button in the questions below.

let seq = 0;

/** Photo state is owned by the review form; this hook holds the actions. */
function useReviewPhotos(venueId) {
  const t = useT();
  const [photos, setPhotos] = React.useState([]);
  const [announce, setAnnounce] = React.useState('');
  const photosRef = React.useRef(photos);
  React.useEffect(() => { photosRef.current = photos; });
  const patch = React.useCallback((key, p) => setPhotos(ps => ps.map(x => (x.key === key ? { ...x, ...(typeof p === 'function' ? p(x) : p) } : x))), []);

  const suggest = React.useCallback(async (key, id) => {
    patch(key, { suggestStatus: 'loading' });
    try {
      const kind = photosRef.current.find(x => x.key === key)?.kind || 'other';
      const r = await fetch(`/api/photos/${id}/suggest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.suggestion) { patch(key, { suggestStatus: r.status === 429 ? 'limit' : 'unavailable' }); return; }
      const s = d.suggestion;
      const n = SUGGESTABLE.filter(f => s.answers?.[f]?.answer === 'yes' || s.answers?.[f]?.answer === 'no').length;
      patch(key, x => ({
        suggestStatus: 'done', suggestion: s,
        // Pre-fill the description only if the reviewer hasn't written one.
        ...(x.alt.trim() ? {} : { alt: s.alt, altSource: 'ai', altConfirmed: false }),
      }));
      setAnnounce(n ? t('photos.say.readyAnswers', { count: n }) : t('photos.say.ready'));
    } catch {
      patch(key, { suggestStatus: 'unavailable' });
    }
  }, [patch, t]);

  const upload = React.useCallback(async (key, prepared, kind) => {
    patch(key, { status: 'uploading' });
    const fd = new FormData();
    fd.append('venueId', venueId);
    fd.append('kind', kind);
    fd.append('photo', prepared.photo, 'photo.jpg');
    fd.append('thumb', prepared.thumb, 'thumb.jpg');
    try {
      const r = await fetch('/api/photos', { method: 'POST', body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'upload failed');
      patch(key, { status: 'ready', id: d.photo.id });
      setAnnounce(t('photos.say.added'));
      suggest(key, d.photo.id);
    } catch {
      // Server errors are English: show our own (translated) message.
      patch(key, { status: 'failed', error: null });
      setAnnounce(t('photos.say.uploadFailed'));
    }
  }, [venueId, patch, suggest, t]);

  const add = React.useCallback(async (files) => {
    const room = MAX_PHOTOS_PER_REVIEW - photos.length;
    const list = Array.from(files || []).slice(0, Math.max(0, room));
    for (const file of list) {
      const key = `p${++seq}`;
      setPhotos(ps => [...ps, { key, status: 'preparing', id: null, preview: null, prepared: null, kind: 'other', alt: '', altSource: null, altConfirmed: false, suggestion: null, suggestStatus: 'idle' }]);
      setAnnounce(t('photos.say.preparing'));
      try {
        const prepared = await preparePhoto(file);
        const preview = URL.createObjectURL(prepared.thumb);
        patch(key, { preview, prepared });
        await upload(key, prepared, 'other');
      } catch {
        patch(key, { status: 'failed', error: 'unreadable' });
        setAnnounce(t('photos.say.unreadable'));
      }
    }
  }, [photos.length, upload, patch, t]);

  const remove = React.useCallback((key) => {
    setPhotos(ps => {
      const p = ps.find(x => x.key === key);
      if (p?.id) fetch(`/api/photos/${p.id}`, { method: 'DELETE' }).catch(() => {});
      if (p?.preview) URL.revokeObjectURL(p.preview);
      return ps.filter(x => x.key !== key);
    });
    setAnnounce(t('photos.say.removed'));
  }, [t]);

  const retry = React.useCallback((key) => {
    const p = photos.find(x => x.key === key);
    if (p?.prepared) upload(key, p.prepared, p.kind);
  }, [photos, upload]);

  // Suggested yes/no answers, merged across photos. Disagreeing photos cancel out.
  const suggestions = React.useMemo(() => {
    const out = {};
    for (const f of SUGGESTABLE) {
      const votes = photos.map(p => p.suggestion?.answers?.[f]).filter(a => a && (a.answer === 'yes' || a.answer === 'no'));
      if (!votes.length || votes.some(v => v.answer !== votes[0].answer)) continue;
      out[f] = { value: votes[0].answer, reason: votes[0].reason };
    }
    return out;
  }, [photos]);

  const busy = photos.some(p => p.status === 'preparing' || p.status === 'uploading');
  const ready = photos.filter(p => p.status === 'ready');
  const needsAlt = ready.filter(p => p.alt.trim().length < ALT_MIN || !p.altConfirmed);
  const payload = ready.map(p => ({ id: p.id, kind: p.kind, alt: p.alt.trim() }));

  return { photos, patch, add, remove, retry, suggestions, busy, needsAlt, payload, announce };
}

function ReviewPhotos({ venueName, state }) {
  const t = useT();
  const { photos, patch, add, remove, retry, announce } = state;
  const input = React.useRef(null);
  const full = photos.length >= MAX_PHOTOS_PER_REVIEW;

  return (
    <section aria-labelledby="rev-photos" style={{ marginTop: 22 }}>
      <SectionHeader id="rev-photos" size="sm" title={<>{t('photos.add.title')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span></>}
        description={t('photos.add.description', { max: MAX_PHOTOS_PER_REVIEW })}/>

      <div className="ra-sr-only" role="status" aria-live="polite">{announce}</div>

      {photos.map((p, i) => (
        <PhotoCard key={p.key} p={p} n={i + 1} venueName={venueName} patch={patch} remove={remove} retry={retry}/>
      ))}

      <input ref={input} type="file" accept="image/*" multiple hidden tabIndex={-1} aria-hidden="true"
        onChange={e => { add(e.target.files); e.target.value = ''; }}/>
      <Button variant="secondary" full icon="camera" disabled={full} onClick={() => input.current?.click()}>
        {full ? t('photos.add.full', { max: MAX_PHOTOS_PER_REVIEW }) : photos.length ? t('photos.add.another') : t('photos.add.first')}
      </Button>
    </section>
  );
}

const fieldLabel = { ...TYPE.headline, fontSize: 15.5, display: 'block', margin: `${SPACE.md}px 0 6px` };

function PhotoCard({ p, n, venueName, patch, remove, retry }) {
  const t = useT();
  const altId = `alt-${p.key}`, kindId = `kind-${p.key}`, hintId = `alt-hint-${p.key}`;
  const statusText = { preparing: t('photos.preparing'), uploading: t('photos.uploading') }[p.status];
  const aiPending = p.altSource === 'ai' && !p.altConfirmed;

  return (
    <Card role="group" aria-label={t('photos.card', { n })} style={{ marginBottom: SPACE.sm }}>
      <div style={{ display: 'flex', gap: SPACE.sm, alignItems: 'flex-start' }}>
        <div style={{ width: 84, height: 84, borderRadius: RADIUS.md - 2, overflow: 'hidden', background: C2.stone, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.preview && <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...TYPE.headline, margin: '0 0 6px' }}>{t('photos.card', { n })}</p>
          {statusText && <p style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.xs}px` }}>{statusText}</p>}
          <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
            {p.status === 'failed' && p.prepared && <Button size="sm" variant="ghost" icon="refresh" onClick={() => retry(p.key)} aria-label={t('photos.retryAria', { n })}>{t('photos.retry')}</Button>}
            <Button size="sm" variant="ghost" icon="close" onClick={() => remove(p.key)} aria-label={t('photos.removeAria', { n })}>{t('photos.remove')}</Button>
          </div>
        </div>
      </div>

      {p.status === 'failed' && (
        <Banner tone="danger" style={{ marginTop: SPACE.sm }}>{p.error === 'unreadable' ? t('photos.unreadable') : t('photos.uploadFailed')}</Banner>
      )}

      {p.status !== 'failed' && (
        <>
          <label htmlFor={kindId} style={fieldLabel}>{t('photos.whatShows')}</label>
          <select id={kindId} value={p.kind} onChange={e => patch(p.key, { kind: e.target.value })} style={{
            ...TYPE.input, width: '100%', minHeight: 48, borderRadius: RADIUS.md - 2, border: edge(), padding: '0 12px',
            background: C2.paper, color: C2.char,
          }}>
            {PHOTO_KINDS.map(k => <option key={k.id} value={k.id}>{t(`photos.kind.${k.id}`)}</option>)}
          </select>

          <label htmlFor={altId} style={{ ...fieldLabel, marginBottom: 2 }}>
            {t('photos.describe')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('photos.required')}</span>
          </label>
          <p id={hintId} style={{ ...TYPE.footnote, color: C2.slate, margin: '0 0 6px' }}>
            {aiPending
              ? t('photos.describeSuggested')
              : p.suggestStatus === 'loading' ? t('photos.describeLoading')
              : t('photos.describeExample', { name: venueName })}
          </p>
          <textarea id={altId} rows={2} maxLength={ALT_MAX} value={p.alt} aria-describedby={hintId} aria-required="true"
            onChange={e => patch(p.key, { alt: e.target.value, altSource: 'user', altConfirmed: true })}
            style={{
              ...TYPE.input, width: '100%', boxSizing: 'border-box', borderRadius: RADIUS.md - 2, padding: SPACE.sm, resize: 'vertical',
              border: aiPending ? `2px solid ${C2.amber}` : edge(), color: C2.char, background: C2.paper,
            }}/>
          {aiPending && (
            <Button size="sm" variant="outline" icon="check" style={{ marginTop: SPACE.xs }}
              disabled={p.alt.trim().length < ALT_MIN} onClick={() => patch(p.key, { altConfirmed: true })}>
              {t('photos.confirm')}
            </Button>
          )}
          {p.suggestStatus === 'unavailable' && (
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: '6px 0 0' }}>{t('photos.suggestUnavailable')}</p>
          )}
          {p.suggestStatus === 'limit' && (
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: '6px 0 0' }}>{t('photos.suggestLimit')}</p>
          )}
        </>
      )}
    </Card>
  );
}

// Under a yes/no question: what the photo suggests, and a button to use it.
function PhotoSuggestion({ featureId, suggestion, onUse }) {
  const tr = useT();
  if (!suggestion) return null;
  const f = RA2_FEATURES.find(x => x.id === featureId);
  const word = suggestion.value === 'yes' ? tr('common.yes') : tr('common.no');
  const t = tone('warn');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm - 2, flexWrap: 'wrap', margin: `0 0 ${SPACE.sm - 2}px`, padding: `${SPACE.xs}px ${SPACE.sm}px`, borderRadius: RADIUS.md - 2, background: t.bg }}>
      <span style={{ ...TYPE.footnote, flex: 1, minWidth: 160, color: C2.char, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <span style={{ color: t.fg, flexShrink: 0 }}><Icon name="camera" size={16}/></span>
        <span>{tr('photos.suggests', { answer: word })}{suggestion.reason ? <> — <UserText>{suggestion.reason}</UserText></> : ''}</span>
      </span>
      <Button size="sm" variant="outline" onClick={() => onUse(featureId, suggestion.value)}
        aria-label={tr('photos.useAnswerAria', { answer: word, question: f ? featureText(tr, f.id, 'question') : '' })}>
        {tr('photos.useAnswer')}
      </Button>
    </div>
  );
}

export { ReviewPhotos, useReviewPhotos, PhotoSuggestion };
