'use client';

import React from 'react';
import { V2Mic } from '../ui/Mic';
import { V2Switch } from '../ui/Switch';
import { C2, F2 } from '../ui/palette';
import { useRA2Dialog } from '../ui/useDialog';
import { LanguagePicker, ReadAloudSettings, useT } from '../i18n';

// ─────────────────────────────────────────────────────────────
// ACCESSIBILITY SHEET — text size, contrast, motion (all real)
// ─────────────────────────────────────────────────────────────
function V2A11ySheet({ open, onClose, prefs, onChange }) {
  const ref = useRA2Dialog(open, onClose);
  const t = useT();
  const scaleRefs = React.useRef([]);
  const SCALES = [
    { v: 1, label: t('me.a11y.scale.default') },
    { v: 1.125, label: t('me.a11y.scale.large') },
    { v: 1.25, label: t('me.a11y.scale.larger') },
    { v: 1.5, label: t('me.a11y.scale.largest') },
  ];
  if (!open) return null;

  function onScaleKey(e, i) {
    const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (i + d + SCALES.length) % SCALES.length;
    onChange({ scale: SCALES[next].v });
    const el = scaleRefs.current[next];
    if (el) el.focus();
  }

  const row = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingTop: 14, marginTop: 12, borderTop: `1px solid ${C2.hair}`,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="a11y-h" tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: C2.paper, borderRadius: '22px 22px 0 0', padding: '20px 22px',
          paddingBottom: 'calc(var(--ra-tabs-pad) + 16px)',
          maxHeight: '82%', overflowY: 'auto', boxSizing: 'border-box',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 id="a11y-h" style={{ fontSize: 19, fontWeight: 700, margin: 0, fontFamily: F2 }}>{t('me.a11y.title')}</h2>
          <button onClick={onClose} aria-label={t('me.a11y.close')} style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 14, margin: -14, lineHeight: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
              <path d="M1 1l12 12M13 1L1 13" stroke={C2.char} strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 13.5, color: C2.slate, margin: '4px 0 6px', fontFamily: F2 }}>
          {t('me.a11y.lead')}
        </p>

        <div style={row}>
          <div>
            <div id="a11y-scale-label" style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>{t('me.a11y.textSize')}</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>{t('me.a11y.textSize.hint')}</div>
          </div>
          <div role="radiogroup" aria-labelledby="a11y-scale-label" style={{
            display: 'inline-flex', border: `1px solid ${C2.line}`, borderRadius: 999, padding: 2, gap: 2, flexShrink: 0,
          }}>
            {SCALES.map((s, i) => {
              const on = prefs.scale === s.v;
              return (
                <button key={s.v} type="button" role="radio" aria-checked={on} aria-label={s.label}
                  ref={el => { scaleRefs.current[i] = el; }}
                  tabIndex={on ? 0 : -1}
                  onKeyDown={e => onScaleKey(e, i)}
                  onClick={() => onChange({ scale: s.v })}
                  style={{
                    minWidth: 44, minHeight: 44, padding: '0 6px',
                    fontSize: 11 + (s.v - 1) * 8, fontWeight: 600, borderRadius: 999, cursor: 'pointer',
                    background: on ? C2.char : 'transparent',
                    color: on ? C2.paper : C2.char, border: 0, fontFamily: F2,
                  }}><span aria-hidden="true">A</span></button>
              );
            })}
          </div>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>{t('me.a11y.contrast')}</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>{t('me.a11y.contrast.hint')}</div>
          </div>
          <V2Switch checked={prefs.contrast} onChange={() => onChange({ contrast: !prefs.contrast })} label={t('me.a11y.contrast')}/>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>{t('me.a11y.motion')}</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>{t('me.a11y.motion.hint')}</div>
          </div>
          <V2Switch checked={prefs.motion} onChange={() => onChange({ motion: !prefs.motion })} label={t('me.a11y.motion')}/>
        </div>

        {/* read aloud (#21): on/off and speed — saved on this device */}
        <div style={{ ...row, display: 'block' }}>
          <ReadAloudSettings/>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>{t('me.a11y.voice')}</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2, maxWidth: 220 }}>
              {t('me.a11y.voice.hint')}
            </div>
          </div>
          <V2Mic size={24} color={C2.teal}/>
        </div>

        {/* language (#21) — Reset below leaves it as it is */}
        <div style={{ ...row, display: 'block' }}>
          <LanguagePicker idBase="a11y-lang"/>
        </div>

        <div style={{ ...row, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>{t('me.a11y.saved')}</span>
          <button onClick={() => onChange({ scale: 1, contrast: false, motion: false })} style={{
            fontSize: 14, color: C2.teal, fontWeight: 700, background: 'transparent', border: 0,
            padding: '10px 6px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: F2,
          }} aria-label={t('me.a11y.reset.label')}>{t('me.a11y.reset')}</button>
        </div>
      </div>
    </div>
  );
}

export { V2A11ySheet };
