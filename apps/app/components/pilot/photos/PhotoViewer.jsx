'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useRA2Dialog } from '../ui/useDialog';
import { C2, F2, M2 } from '../ui/palette';

// Accessible photo viewer: a real modal dialog (focus moves in, is trapped,
// Escape closes, focus returns to the thumbnail). Every photo shows its
// description as visible text too, not only as alt text. ← / → step through.
function PhotoViewer({ photos, index, onIndex, onClose }) {
  const open = index != null && !!photos[index];
  const ref = useRA2Dialog(open, onClose);
  const n = photos.length;
  React.useEffect(() => {
    if (!open || n < 2) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); onIndex((index + 1) % n); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onIndex((index - 1 + n) % n); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, index, n, onIndex]);
  if (!open || typeof document === 'undefined') return null;
  const p = photos[index];

  const btn = {
    minHeight: 48, minWidth: 48, padding: '0 18px', borderRadius: 999, cursor: 'pointer',
    border: `2px solid ${C2.paper}`, background: 'transparent', color: C2.paper,
    fontFamily: F2, fontSize: 16, fontWeight: 700,
  };
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#111111', display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="ra-photo-title" aria-describedby="ra-photo-desc"
        data-ra-oncolor="" tabIndex={-1}
        style={{ width: '100%', maxWidth: 980, display: 'flex', flexDirection: 'column', color: C2.paper, fontFamily: F2, padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <h2 id="ra-photo-title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {p.kindLabel}{n > 1 ? <span style={{ fontWeight: 500 }}> · photo {index + 1} of {n}</span> : null}
          </h2>
          <button type="button" onClick={onClose} style={btn} aria-label="Close photo">Close</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={p.id} src={p.src} alt={p.alt}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, background: '#222' }}/>
        </div>
        <div style={{ paddingTop: 12 }}>
          <p id="ra-photo-desc" style={{ margin: '0 0 6px', fontSize: 16, lineHeight: 1.5 }}>{p.alt}</p>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#D9D6CF' }}>
            From a review · {p.who} · {p.when}
          </p>
          {n > 1 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={{ ...btn, flex: 1 }} onClick={() => onIndex((index - 1 + n) % n)}>← Previous</button>
              <button type="button" style={{ ...btn, flex: 1 }} onClick={() => onIndex((index + 1) % n)}>Next →</button>
            </div>
          )}
          <span className="ra-sr-only" aria-live="polite">{`Photo ${index + 1} of ${n}: ${p.kindLabel}`}</span>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, fontFamily: M2, color: '#D9D6CF' }} aria-hidden="true">
            {n > 1 ? '← → to move · Esc to close' : 'Esc to close'}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CameraIcon({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" stroke={color || C2.teal} strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="3.2" stroke={color || C2.teal} strokeWidth="2"/>
    </svg>
  );
}

// Row of thumbnail buttons; each opens the viewer at that photo.
function PhotoThumbs({ photos, onOpen, size = 88, showKind = true }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {photos.map((p, i) => (
        <li key={p.id} style={{ width: size }}>
          <button type="button" onClick={() => onOpen(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length}: ${p.kindLabel}. ${p.alt}`}
            style={{
              width: size, height: size, padding: 0, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
              border: `1.5px solid ${C2.line}`, background: C2.stone, display: 'block',
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb} alt="" loading="lazy" width={size} height={size}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
          </button>
          {showKind && <span aria-hidden="true" style={{ display: 'block', fontSize: 12.5, color: C2.slate, marginTop: 4, fontFamily: F2, lineHeight: 1.25 }}>{p.kindLabel}</span>}
        </li>
      ))}
    </ul>
  );
}

// "With photo" marker on a review — icon + words, never icon alone.
function WithPhotoMarker({ count }) {
  if (!count) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C2.teal,
      background: C2.tealSoft, border: `1px solid ${C2.teal}`, borderRadius: 999, padding: '4px 10px', fontFamily: F2,
    }}>
      <CameraIcon size={15}/>{count === 1 ? 'With photo' : `With ${count} photos`}
    </span>
  );
}

export { PhotoViewer, PhotoThumbs, WithPhotoMarker, CameraIcon };
