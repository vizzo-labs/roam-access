'use client';

import React from 'react';
import { PlacePreviewCard } from './PlacePreviewCard';
import { dur } from '../ds';
import { invalidateGaps } from '../community/gapsStore';

// The place preview card anchored to its pin on the desktop map. Above the
// pin by default; below, right or left when the map edge is too close; and if
// it fits nowhere, the map eases (instantly with reduced motion) so neither
// the card nor the pin is clipped. One card at a time.
//
// Focus: into the card on open, back to the pin on close (Escape, ✕ or a
// click on the map). A NON-modal dialog — the map and panel stay usable.

const M = 12;         // margin from the map edge
const GAP = 10;       // between pin and card
const PIN_H = 58;     // the selected pin is 46×58, its tip on the place
const PIN_HALF_W = 23;
const CARD_W = 400;

const scaleNow = () => {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ra-scale'));
  return v > 0 ? v : 1;
};

// Where the card goes for each side, and whether it fits there.
function sides(p, w, h, W, H) {
  const clampX = x => Math.max(M, Math.min(W - w - M, x));
  const clampY = y => Math.max(M, Math.min(H - h - M, y));
  const top = p.y - PIN_H;
  const midY = clampY(p.y - PIN_H / 2 - h / 2);
  const wide = w <= W - 2 * M;
  return {
    above: { x: clampX(p.x - w / 2), y: top - GAP - h, fits: wide && top - GAP - h >= M },
    below: { x: clampX(p.x - w / 2), y: p.y + GAP, fits: wide && p.y + GAP + h <= H - M },
    right: { x: p.x + PIN_HALF_W + GAP, y: midY, fits: p.x + PIN_HALF_W + GAP + w <= W - M && h <= H - 2 * M },
    left:  { x: p.x - PIN_HALF_W - GAP - w, y: midY, fits: p.x - PIN_HALF_W - GAP - w >= M && h <= H - 2 * M },
  };
}
const ORDER = ['above', 'below', 'right', 'left'];

export function MapPlacePreview({ app, place, mapApi, onClose }) {
  const wrap = React.useRef(null);
  const card = React.useRef(null);
  const side = React.useRef('above');
  const [max, setMax] = React.useState(null); // { w, h } in the card's own (zoomed) px

  // Position from the pin's current screen point; `choose` re-picks the side.
  const layout = React.useCallback((choose) => {
    const map = mapApi.current?.map;
    const el = wrap.current;
    if (!map || !el) return;
    const { clientWidth: W, clientHeight: H } = map.getContainer();
    const { width: w, height: h } = el.getBoundingClientRect();
    const p = map.project([place.lng, place.lat]);
    const all = sides(p, w, h, W, H);
    if (choose) side.current = ORDER.find(s => all[s].fits) || side.current;
    const s = all[side.current];
    el.style.transform = `translate(${Math.round(s.x)}px, ${Math.round(s.y)}px)`;
    el.style.visibility = 'visible';
    return { all, p, w, h, W, H };
  }, [mapApi, place.lng, place.lat]);

  // Open (or another place): cap the height to the map, place it, ease the
  // map once if nothing fits, then move focus into the card.
  React.useEffect(() => {
    const map = mapApi.current?.map;
    if (!map) return;
    const fit = () => {
      const box = map.getContainer(), k = scaleNow();
      setMax({ w: Math.max(240, (box.clientWidth - 2 * M) / k), h: Math.max(200, (box.clientHeight - 2 * M) / k) });
    };
    const raf = requestAnimationFrame(() => {
      fit();
      const r = layout(true);
      if (r && !ORDER.some(s => r.all[s].fits)) {
        // Room above the pin: move the pin down (and inside the edges) until the card fits.
        const needY = r.h + GAP + PIN_H + M;
        let dy = 0, dx = 0;
        if (needY + M <= r.H) {
          dy = Math.max(0, needY - r.p.y);
          dx = r.p.x < M + r.w / 2 ? r.p.x - (M + r.w / 2) : r.p.x > r.W - M - r.w / 2 ? r.p.x - (r.W - M - r.w / 2) : 0;
          side.current = 'above';
        } else {
          // Too tall for above/below (big text): beside the pin, with room on the right.
          dx = Math.max(0, r.p.x + PIN_HALF_W + GAP + r.w + M - r.W);
          side.current = 'right';
        }
        map.panBy([dx, -dy], { duration: dur('slow') });
      }
      card.current?.focus({ preventScroll: true });
    });
    const onMove = () => layout(false);
    const onEnd = () => layout(true);
    const onResize = () => { fit(); layout(true); };
    map.on('move', onMove);
    map.on('moveend', onEnd);
    window.addEventListener('resize', onResize);
    // The card grows with bigger text or a question: re-place it.
    const ro = new ResizeObserver(() => layout(true));
    if (wrap.current) ro.observe(wrap.current);
    return () => {
      cancelAnimationFrame(raf);
      map.off('move', onMove);
      map.off('moveend', onEnd);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [place.id, layout, mapApi]);

  const close = (returnFocus = true) => onClose(returnFocus);
  const saved = app.world.saved.includes(place.id);

  return (
    <div ref={wrap} style={{ position: 'absolute', left: 0, top: 0, zIndex: 10, visibility: 'hidden', willChange: 'transform' }}>
      <PlacePreviewCard ref={card} place={place} needs={app.user?.needs || []}
        saved={saved} onToggleSave={() => app.toggleSave(place.id)}
        onClose={() => close(true)}
        onDetails={() => { close(false); app.goto('venue', place.id); }}
        onAddPhoto={() => { close(false); app.goto('review', place.id); }}
        onAnswer={async (feature, answer) => {
          const ok = await app.answerQuick({ venueId: place.id, feature, answer });
          if (ok) invalidateGaps();
          return ok;
        }}
        reports={app.layers.reportsFor('venue', place.id)}
        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(true); } }}
        style={{
          zoom: 'var(--ra-scale)', width: CARD_W, maxWidth: max?.w, maxHeight: max?.h, overflowY: 'auto',
        }}/>
    </div>
  );
}
