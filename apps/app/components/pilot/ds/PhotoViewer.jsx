'use client';

import React from 'react';
import { useT, UserText } from '../i18n/I18nProvider';
import { createPortal } from 'react-dom';
import { C2 } from '../ui/palette';
import { useRA2Dialog } from '../ui/useDialog';
import { IconButton } from './IconButton';
import { RADIUS, SPACE, TYPE, edge } from './tokens';

// ─────────────────────────────────────────────────────────────────────────
// PhotoGrid — thumbnails that open a PhotoViewer. Each thumbnail is ONE
// button named "Open photo 2 of 5: Entrance. <description>"; the kind label
// under it is visual only (it's already in the name).
//   photos: [{ id, src, thumb, alt, kindLabel, who?, when? }]
// ─────────────────────────────────────────────────────────────────────────
function PhotoGrid({ photos, onOpen, size = 88, showKind = true }) {
  const t = useT();
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: SPACE.sm - 2 }}>
      {photos.map((p, i) => (
        <li key={p.id} style={{ width: size }}>
          <button type="button" onClick={() => onOpen(i)} className="ds-press"
            aria-label={t('ds.photo.open', { n: i + 1, total: photos.length, kind: p.kindLabel, alt: p.alt })}
            style={{
              width: size, height: size, padding: 0, borderRadius: RADIUS.md - 2, overflow: 'hidden', cursor: 'pointer',
              border: edge(), background: C2.stone, display: 'block',
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumb} alt="" loading="lazy" width={size} height={size}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
          </button>
          {showKind && <span aria-hidden="true" style={{ ...TYPE.caption, display: 'block', color: C2.slate, marginTop: SPACE.xxs }}>{p.kindLabel}</span>}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PhotoViewer — full-screen, modal photo viewer (a real dialog: focus moves
// in and is trapped, Escape closes, focus returns to the thumbnail). The
// description is shown as text as well as alt text. ← / → or the buttons
// move between photos; the position is announced.
//   <PhotoViewer photos={photos} index={i} onIndex={setI} onClose={() => setI(null)}/>
// ─────────────────────────────────────────────────────────────────────────
function PhotoViewer({ photos, index, onIndex, onClose }) {
  const t = useT();
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
  const soft = '#D9D6CF'; // on #111: 13.5:1

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#111111', display: 'flex', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="ds-photo-title" aria-describedby="ds-photo-desc"
        data-ra-oncolor="" tabIndex={-1}
        style={{ width: '100%', maxWidth: 980, display: 'flex', flexDirection: 'column', color: C2.paper, boxSizing: 'border-box',
          padding: `${SPACE.sm}px ${SPACE.md}px calc(${SPACE.md}px + env(safe-area-inset-bottom))` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm, marginBottom: SPACE.sm }}>
          <h2 id="ds-photo-title" style={{ ...TYPE.title3, margin: 0 }}>
            {p.kindLabel}{n > 1 ? <span style={{ fontWeight: 500 }}> · {t('ds.photo.count', { n: index + 1, total: n })}</span> : null}
          </h2>
          <IconButton icon="close" label={t('ds.photo.close')} variant="onColor" onClick={onClose}/>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm }}>
          {n > 1 && <IconButton icon="back" label={t('ds.photo.prev')} variant="onColor" onClick={() => onIndex((index - 1 + n) % n)}/>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={p.id} src={p.src} alt={p.alt}
            style={{ minWidth: 0, maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: RADIUS.md, background: '#222' }}/>
          {n > 1 && <IconButton icon="forward" label={t('ds.photo.next')} variant="onColor" onClick={() => onIndex((index + 1) % n)}/>}
        </div>
        <div style={{ paddingTop: SPACE.sm }}>
          <UserText as="p" id="ds-photo-desc" style={{ ...TYPE.body, margin: '0 0 6px' }}>{p.alt}</UserText>
          {(p.who || p.when) && (
            <p style={{ ...TYPE.footnote, margin: 0, color: soft }}>
              {t('ds.photo.fromReview')}{p.who ? ` · ${p.who}` : ''}{p.when ? ` · ${p.when}` : ''}
            </p>
          )}
          <span className="ra-sr-only" aria-live="polite">{t('ds.photo.position', { n: index + 1, total: n, kind: p.kindLabel })}</span>
          <p aria-hidden="true" style={{ ...TYPE.caption, fontWeight: 500, margin: `${SPACE.xs}px 0 0`, color: soft }}>
            {n > 1 ? t('ds.photo.keysMany') : t('ds.photo.keysOne')}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export { PhotoGrid, PhotoViewer };
