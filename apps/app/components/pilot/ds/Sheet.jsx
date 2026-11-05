'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2 } from '../ui/palette';
import { useRA2Dialog } from '../ui/useDialog';
import { IconButton } from './IconButton';
import { DURATION, EASE, GUTTER, RADIUS, SPACE, TYPE, elevation, useReducedMotion } from './tokens';

const WIDE_QUERY = '(min-width: 960px)';
function useWideViewport() {
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

function Handle({ style }) {
  return <span aria-hidden="true" style={{ display: 'block', width: 40, height: 5, borderRadius: RADIUS.pill, background: C2.line, margin: '0 auto', ...style }}/>;
}

// ─────────────────────────────────────────────────────────────────────────
// Sheet — a MODAL panel: bottom sheet on phones, centred dialog from 960px.
// Focus moves in and is trapped; Escape, the close button, the scrim or a
// downward drag on the handle close it; focus returns to what opened it.
// Positioned inside the nearest positioned ancestor (the screen), like the
// accessibility sheet; pass position="fixed" to cover the viewport.
//   <Sheet open={open} onClose={close} title="Filters" footer={<Button full onClick={apply}>Show 12 places</Button>}>…</Sheet>
// ─────────────────────────────────────────────────────────────────────────
function Sheet({ open, onClose, title, description, children, footer, closeLabel, position = 'absolute', maxWidth = 520, id }) {
  const t = useT();
  const ref = useRA2Dialog(open, onClose);
  const wide = useWideViewport();
  const [drag, setDrag] = React.useState(0);
  const start = React.useRef(null);
  const autoId = React.useId();
  const hid = id || `sheet-${autoId}`;
  if (!open) return null;

  const onPointerDown = (e) => { start.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); };
  const onPointerMove = (e) => { if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current)); };
  const onPointerUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (drag > 90) onClose();
    setDrag(0);
  };

  const panel = wide ? {
    position: 'relative', margin: 'auto', width: '100%', maxWidth, maxHeight: '86%',
    borderRadius: RADIUS.xl,
  } : {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%',
    borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
    transform: drag ? `translateY(${drag}px)` : undefined,
  };

  return (
    <div className="ds-scrim" onClick={onClose} style={{
      position, inset: 0, zIndex: 150, background: 'rgba(26,26,26,0.5)',
      display: wide ? 'flex' : 'block', padding: wide ? SPACE.xl : 0, boxSizing: 'border-box',
    }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`${hid}-title`}
        aria-describedby={description ? `${hid}-desc` : undefined} tabIndex={-1}
        className="ds-sheet-in" onClick={e => e.stopPropagation()}
        style={{
          ...panel, background: C2.paper, color: C2.char, fontFamily: F2, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', ...elevation(3),
        }}>
        {!wide && (
          <div className="ds-snap-handle" onPointerDown={onPointerDown} onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            style={{ padding: '10px 0 4px', cursor: 'grab', flexShrink: 0 }}>
            <Handle/>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.sm, padding: `${wide ? SPACE.lg : SPACE.xs}px ${GUTTER - 8}px 0 ${GUTTER}px`, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 10 }}>
            <h2 id={`${hid}-title`} style={{ ...TYPE.title3, fontSize: 20, margin: 0 }}>{title}</h2>
            {description && <p id={`${hid}-desc`} style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0' }}>{description}</p>}
          </div>
          <IconButton icon="close" variant="ghost" label={closeLabel || t('ds.sheet.closeNamed', { title })} onClick={onClose}/>
        </div>
        <div style={{ overflowY: 'auto', padding: `${SPACE.sm}px ${GUTTER}px ${footer ? SPACE.sm : SPACE.xl}px`, flex: '1 1 auto', minHeight: 0 }}>
          {children}
        </div>
        {footer && (
          <div style={{ flexShrink: 0, padding: `${SPACE.sm}px ${GUTTER}px`, paddingBottom: wide ? SPACE.lg : `calc(var(--ra-tabs-pad, 12px) + ${SPACE.xs}px)`, borderTop: `1px solid ${C2.hair}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SnapSheet — a PERSISTENT (non-modal) sheet over a map, with three heights:
// peek · half · full (Google/Apple Maps). The list inside stays the primary,
// screen-reader-friendly view: it's always in the DOM and reading order.
//
// Not drag-only: the handle is a real button.
//   click / Enter / Space → next size up (full → back to peek)
//   ArrowUp / ArrowDown   → bigger / smaller,  Home / End → peek / full
// The new size is announced. Focus moving into the hidden part of the list
// opens it to half, so keyboard users never tab into something they can't see.
//
//   const [snap, setSnap] = useState('half');
//   <div style={{ position: 'relative', height: '100%' }}>
//     <Map/>
//     <SnapSheet label="Places" snap={snap} onSnapChange={setSnap} header={<Summary/>}>{list}</SnapSheet>
//   </div>
// ─────────────────────────────────────────────────────────────────────────
const SNAPS = ['peek', 'half', 'full'];

function SnapSheet({
  label, snap = 'half', onSnapChange, header, children,
  peekHeight = 132, halfRatio = 0.5, topGap = 72, bottomInset = 0, style,
}) {
  const t = useT();
  const word = s => t(`ds.snap.${s}`);
  const sheetRef = React.useRef(null);
  const handleRef = React.useRef(null);
  const reduced = useReducedMotion();
  const [dragH, setDragH] = React.useState(null);
  const [announce, setAnnounce] = React.useState('');
  const drag = React.useRef(null);

  const heights = () => {
    const parentH = sheetRef.current?.parentElement?.clientHeight || 700;
    return {
      peek: peekHeight + bottomInset,
      half: Math.round(parentH * halfRatio),
      full: parentH - topGap,
    };
  };
  const heightCss = { peek: `${peekHeight + bottomInset}px`, half: `${halfRatio * 100}%`, full: `calc(100% - ${topGap}px)` }[snap];

  const go = (next) => {
    if (!SNAPS.includes(next) || next === snap) return;
    onSnapChange?.(next);
    setAnnounce(t('ds.snap.announce', { label, size: word(next) }));
  };
  const step = (d) => go(SNAPS[Math.min(SNAPS.length - 1, Math.max(0, SNAPS.indexOf(snap) + d))]);

  const onKeyDown = (e) => {
    const map = { ArrowUp: () => step(1), ArrowDown: () => step(-1), Home: () => go('peek'), End: () => go('full') };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  };
  const onClick = () => {
    if (drag.current?.moved) { drag.current = null; return; } // that was a drag, not a press
    go(snap === 'full' ? 'peek' : SNAPS[SNAPS.indexOf(snap) + 1]);
  };

  // Pointer drag on the handle strip (and header, outside its own controls).
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input, select, textarea, [role="radio"], [role="tab"]') && !e.target.closest('.ds-snap-grip')) return;
    drag.current = { y: e.clientY, h: sheetRef.current.getBoundingClientRect().height, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    // Capture only once it's really a drag, so a plain tap still clicks the grip.
    if (!d.moved && Math.abs(dy) > 6) { d.moved = true; e.currentTarget.setPointerCapture(e.pointerId); }
    if (!d.moved) return;
    const hs = heights();
    setDragH(Math.max(hs.peek * 0.8, Math.min(hs.full, d.h - dy)));
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved) { drag.current = null; return; }
    const hs = heights();
    const h = d.h - (e.clientY - d.y);
    const nearest = SNAPS.reduce((best, s) => (Math.abs(hs[s] - h) < Math.abs(hs[best] - h) ? s : best), 'peek');
    setDragH(null);
    go(nearest);
    // keep d.moved so the click that follows pointerup is ignored
    setTimeout(() => { drag.current = null; }, 0);
  };

  const onFocusCapture = (e) => {
    if (snap === 'peek' && !e.currentTarget.querySelector('.ds-snap-top')?.contains(e.target)) go('half');
  };

  const next = snap === 'full' ? t('ds.snap.collapse') : t('ds.snap.expand');
  return (
    <section ref={sheetRef} aria-label={label} onFocusCapture={onFocusCapture}
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
        height: dragH !== null ? `${dragH}px` : heightCss,
        transition: dragH !== null || reduced ? 'none' : `height ${DURATION.slow}ms ${EASE.standard}`,
        background: C2.paper, borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box',
        borderTop: `1px solid ${C2.hair}`, ...elevation(2), fontFamily: F2, ...style,
      }}>
      <div className="ds-snap-top" onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{ flexShrink: 0 }}>
        <button ref={handleRef} type="button" className="ds-snap-grip ds-snap-handle" onClick={onClick} onKeyDown={onKeyDown}
          aria-label={t('ds.snap.handle', { label, size: word(snap), action: next })}
          style={{
            display: 'block', width: '100%', minHeight: 44, padding: '12px 0', border: 0,
            background: 'transparent', cursor: 'grab', borderRadius: `${RADIUS.xl}px ${RADIUS.xl}px 0 0`,
          }}>
          <Handle/>
        </button>
        {header && <div style={{ padding: `0 ${GUTTER}px ${SPACE.sm}px` }}>{header}</div>}
      </div>
      <div className="ds-snap-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', paddingBottom: bottomInset, borderTop: `1px solid ${C2.hair}` }}>
        {children}
      </div>
      <div className="ra-sr-only" role="status" aria-live="polite">{announce}</div>
    </section>
  );
}

export { Sheet, SnapSheet, SNAPS };
