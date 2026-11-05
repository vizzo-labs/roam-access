'use client';

import React from 'react';
import { ALT_MAX, ALT_MIN, MAX_PHOTOS_PER_REVIEW, PHOTO_KINDS, SUGGESTABLE } from '@/lib/photos/kinds';
import { RA2_FEATURES } from '@/lib/pilot-data';
import { preparePhoto } from './resize';
import { CameraIcon } from './PhotoViewer';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';

// Photos in the review form (#3) + suggestions from them (#16).
// Each photo: resized and stripped of location data in the browser, uploaded
// as a draft, then (optionally) looked at by an AI model that suggests a
// description and yes/no answers. Suggestions are never applied by
// themselves: the description must be confirmed or edited, and each answer
// has its own "Use this answer" button in the questions below.

let seq = 0;

/** Photo state is owned by the review form; this hook holds the actions. */
function useReviewPhotos(venueId) {
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
      setAnnounce(`Suggestions ready from your photo: a description to check${n ? `, and answers to ${n} ${n === 1 ? 'question' : 'questions'} below` : ''}. Nothing is used until you confirm it.`);
    } catch {
      patch(key, { suggestStatus: 'unavailable' });
    }
  }, [patch]);

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
      setAnnounce('Photo added. Now describe it.');
      suggest(key, d.photo.id);
    } catch (e) {
      patch(key, { status: 'failed', error: e.message });
      setAnnounce('Couldn’t upload that photo.');
    }
  }, [venueId, patch, suggest]);

  const add = React.useCallback(async (files) => {
    const room = MAX_PHOTOS_PER_REVIEW - photos.length;
    const list = Array.from(files || []).slice(0, Math.max(0, room));
    for (const file of list) {
      const key = `p${++seq}`;
      setPhotos(ps => [...ps, { key, status: 'preparing', id: null, preview: null, prepared: null, kind: 'other', alt: '', altSource: null, altConfirmed: false, suggestion: null, suggestStatus: 'idle' }]);
      setAnnounce('Preparing photo…');
      try {
        const prepared = await preparePhoto(file);
        const preview = URL.createObjectURL(prepared.thumb);
        patch(key, { preview, prepared });
        await upload(key, prepared, 'other');
      } catch {
        patch(key, { status: 'failed', error: 'That file isn’t a photo we can read.' });
        setAnnounce('Couldn’t read that photo.');
      }
    }
  }, [photos.length, upload, patch]);

  const remove = React.useCallback((key) => {
    setPhotos(ps => {
      const p = ps.find(x => x.key === key);
      if (p?.id) fetch(`/api/photos/${p.id}`, { method: 'DELETE' }).catch(() => {});
      if (p?.preview) URL.revokeObjectURL(p.preview);
      return ps.filter(x => x.key !== key);
    });
    setAnnounce('Photo removed.');
  }, []);

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
  const { photos, patch, add, remove, retry, announce } = state;
  const input = React.useRef(null);
  const full = photos.length >= MAX_PHOTOS_PER_REVIEW;

  return (
    <section aria-labelledby="rev-photos" style={{ marginTop: 22 }}>
      <h2 id="rev-photos" style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px', fontFamily: F2 }}>
        Add photos <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
      </h2>
      <p style={{ fontSize: 14.5, color: C2.slate, margin: '0 0 10px', lineHeight: 1.45, fontFamily: F2 }}>
        The entrance, a step, the toilet or seating help most. Up to {MAX_PHOTOS_PER_REVIEW}. We remove the location
        from your photos. Please avoid people’s faces.
      </p>

      <div className="ra-sr-only" role="status" aria-live="polite">{announce}</div>

      {photos.map((p, i) => (
        <PhotoCard key={p.key} p={p} n={i + 1} venueName={venueName} patch={patch} remove={remove} retry={retry}/>
      ))}

      <input ref={input} type="file" accept="image/*" multiple hidden tabIndex={-1} aria-hidden="true"
        onChange={e => { add(e.target.files); e.target.value = ''; }}/>
      <button type="button" disabled={full} onClick={() => input.current?.click()} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        minHeight: 52, borderRadius: 14, border: full ? `1.5px solid ${C2.line}` : `1.5px dashed ${C2.teal}`,
        background: full ? C2.stone : C2.tealSoft, color: full ? C2.slate : C2.teal,
        fontFamily: F2, fontSize: 16, fontWeight: 700, cursor: full ? 'not-allowed' : 'pointer',
      }}>
        <CameraIcon size={20} color={full ? C2.slate : C2.teal}/>
        {full ? `${MAX_PHOTOS_PER_REVIEW} photos added — the most for one review` : photos.length ? 'Add another photo' : 'Add a photo'}
      </button>
    </section>
  );
}

function PhotoCard({ p, n, venueName, patch, remove, retry }) {
  const altId = `alt-${p.key}`, kindId = `kind-${p.key}`, hintId = `alt-hint-${p.key}`;
  const statusText = {
    preparing: 'Preparing your photo…',
    uploading: 'Uploading…',
    ready: null,
    failed: p.error || 'Couldn’t upload this photo.',
  }[p.status];
  const aiPending = p.altSource === 'ai' && !p.altConfirmed;
  const smallBtn = {
    minHeight: 44, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontFamily: F2, fontSize: 15, fontWeight: 700,
    border: `1.5px solid ${C2.line}`, background: C2.paper, color: C2.char,
  };

  return (
    <div role="group" aria-label={`Photo ${n}`} style={{ border: `1.5px solid ${C2.line}`, borderRadius: 16, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', background: C2.stone, flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.preview && <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 15.5, fontFamily: F2 }}>Photo {n}</p>
          {statusText && <p style={{ margin: '0 0 8px', fontSize: 14.5, color: p.status === 'failed' ? C2.red : C2.slate, fontFamily: F2 }}>{statusText}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {p.status === 'failed' && p.prepared && <button type="button" style={smallBtn} onClick={() => retry(p.key)}>Try again</button>}
            <button type="button" style={smallBtn} onClick={() => remove(p.key)} aria-label={`Remove photo ${n}`}>Remove</button>
          </div>
        </div>
      </div>

      {p.status !== 'failed' && (
        <>
          <label htmlFor={kindId} style={{ display: 'block', fontSize: 15.5, fontWeight: 700, margin: '14px 0 6px', fontFamily: F2 }}>What does it show?</label>
          <select id={kindId} value={p.kind} onChange={e => patch(p.key, { kind: e.target.value })} style={{
            width: '100%', minHeight: 48, borderRadius: 12, border: `1.5px solid ${C2.line}`, padding: '0 12px',
            fontSize: RA2_INPUT_FONT, fontFamily: F2, background: C2.paper, color: C2.char,
          }}>
            {PHOTO_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>

          <label htmlFor={altId} style={{ display: 'block', fontSize: 15.5, fontWeight: 700, margin: '14px 0 2px', fontFamily: F2 }}>
            Describe it for people who can’t see it <span style={{ fontWeight: 500, color: C2.slate }}>(required)</span>
          </label>
          <p id={hintId} style={{ fontSize: 14, color: C2.slate, margin: '0 0 6px', lineHeight: 1.4, fontFamily: F2 }}>
            {aiPending
              ? 'Suggested from your photo — check it’s right, then confirm or edit it.'
              : p.suggestStatus === 'loading' ? 'Looking at your photo to suggest a description…'
              : `e.g. “Two steps up to the front door of ${venueName}, no handrail”`}
          </p>
          <textarea id={altId} rows={2} maxLength={ALT_MAX} value={p.alt} aria-describedby={hintId} aria-required="true"
            onChange={e => patch(p.key, { alt: e.target.value, altSource: 'user', altConfirmed: true })}
            style={{
              width: '100%', boxSizing: 'border-box', borderRadius: 12, padding: 12, resize: 'vertical',
              border: aiPending ? `2px solid ${C2.amber}` : `1.5px solid ${C2.line}`,
              fontSize: RA2_INPUT_FONT, fontFamily: F2, lineHeight: 1.45, color: C2.char, background: C2.paper,
            }}/>
          {aiPending && (
            <button type="button" onClick={() => patch(p.key, { altConfirmed: true })}
              disabled={p.alt.trim().length < ALT_MIN}
              style={{ ...smallBtn, marginTop: 8, border: `2px solid ${C2.teal}`, color: C2.teal }}>
              ✓ This description is right
            </button>
          )}
          {p.suggestStatus === 'unavailable' && (
            <p style={{ fontSize: 13.5, color: C2.slate, margin: '6px 0 0', fontFamily: F2 }}>Suggestions aren’t available right now — write your own description.</p>
          )}
          {p.suggestStatus === 'limit' && (
            <p style={{ fontSize: 13.5, color: C2.slate, margin: '6px 0 0', fontFamily: F2 }}>You’ve used today’s photo suggestions — write your own description.</p>
          )}
        </>
      )}
    </div>
  );
}

// Under a yes/no question: what the photo suggests, and a button to use it.
function PhotoSuggestion({ featureId, suggestion, onUse }) {
  if (!suggestion) return null;
  const f = RA2_FEATURES.find(x => x.id === featureId);
  const word = suggestion.value === 'yes' ? 'Yes' : 'No';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '0 0 10px', padding: '8px 12px', borderRadius: 12, background: C2.amberBg }}>
      <span style={{ flex: 1, minWidth: 160, fontSize: 14, color: C2.char, fontFamily: F2, lineHeight: 1.4 }}>
        <CameraIcon size={15} color={C2.amber}/> Your photo suggests <strong>{word}</strong>
        {suggestion.reason ? ` — ${suggestion.reason}` : ''}
      </span>
      <button type="button" onClick={() => onUse(featureId, suggestion.value)}
        aria-label={`Use the photo’s suggestion: ${word} for “${f?.question}”`}
        style={{ minHeight: 44, padding: '0 14px', borderRadius: 999, border: `2px solid ${C2.amber}`, background: C2.paper, color: C2.amber, fontWeight: 700, fontSize: 14.5, fontFamily: F2, cursor: 'pointer' }}>
        Use this answer
      </button>
    </div>
  );
}

export { ReviewPhotos, useReviewPhotos, PhotoSuggestion };
