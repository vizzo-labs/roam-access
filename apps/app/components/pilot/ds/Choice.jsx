'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Icon } from './Icon';
import { RADIUS, SPACE, TARGET, TYPE } from './tokens';

// ─────────────────────────────────────────────────────────────────────────
// ChoiceGroup — pick ONE of a few labelled options: native radio inputs in a
// <fieldset> with a <legend>, so screen readers say "Which describes you?,
// radio group, 1 of 4" and arrow keys move between options. Each option is
// one ≥ 56px target (the whole row is the label) with an optional second line.
//   <ChoiceGroup legend="Which describes you?" hint="Self-described" name="rel"
//     value={rel} onChange={setRel} options={[{ value: 'lived', label: '…', sub: '…' }]}/>
//
// CheckRow — one native checkbox with a label and an optional hint, as a
// ≥ 56px row. For an explicit opt-in (never pre-ticked for sensitive data).
//   <CheckRow checked={on} onChange={setOn} label="Post anonymously" hint="…"/>
//
// The selected state is shown by the control's own mark AND a thicker teal
// border, never colour alone. Focus: the native control's ring.
// ─────────────────────────────────────────────────────────────────────────

function Mark({ type, on }) {
  const round = type === 'radio';
  return (
    <span aria-hidden="true" style={{
      width: 26, height: 26, flexShrink: 0, marginTop: 1, boxSizing: 'border-box',
      borderRadius: round ? RADIUS.pill : 7,
      border: `2px solid ${on ? C2.teal : C2.slate}`,
      background: on && !round ? C2.teal : C2.paper,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {on && round && <span style={{ width: 12, height: 12, borderRadius: RADIUS.pill, background: C2.teal }}/>}
      {on && !round && (
        <svg width="14" height="11" viewBox="0 0 16 12" fill="none"><path d="M1.5 6l4.5 4.5L14.5 1.5" stroke={C2.paper} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )}
    </span>
  );
}

function rowStyle(on, disabled) {
  return {
    position: 'relative', display: 'flex', alignItems: 'flex-start', gap: SPACE.sm,
    minHeight: TARGET.lg, boxSizing: 'border-box', padding: '14px 16px',
    borderRadius: RADIUS.lg, cursor: disabled ? 'default' : 'pointer',
    border: on ? `2.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
    background: on ? C2.tealSoft : C2.paper, opacity: disabled ? 0.6 : 1,
  };
}

// The native input sits over the whole row (transparent), so it is the thing
// that gets focus, clicks and keys; `.ds-choice` draws its focus ring on the row.
const inputStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'inherit' };

function Text({ label, sub, id, big = false }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span style={{ ...TYPE.label, ...(big ? { fontSize: 17, fontWeight: 700 } : null), display: 'block', lineHeight: 1.35, color: C2.char }}>{label}</span>
      {sub && <span id={id} style={{ ...TYPE.footnote, display: 'block', color: C2.slate, marginTop: 3 }}>{sub}</span>}
    </span>
  );
}

function ChoiceGroup({ legend, hint, name, value, onChange, options, style }) {
  const base = React.useId();
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0, ...style }} aria-describedby={hint ? `${base}-hint` : undefined}>
      <legend style={{ ...TYPE.headline, padding: 0, marginBottom: hint ? 4 : SPACE.xs, color: C2.char }}>{legend}</legend>
      {hint && <p id={`${base}-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.xs}px` }}>{hint}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
        {options.map(o => {
          const on = value === o.value;
          const subId = o.sub ? `${base}-${o.value}-sub` : undefined;
          return (
            <label key={o.value} className="ds-choice" style={rowStyle(on)}>
              <input type="radio" name={name || base} value={o.value} checked={on}
                onChange={() => onChange(o.value)} aria-describedby={subId} style={inputStyle}/>
              <Mark type="radio" on={on}/>
              <Text label={o.label} sub={o.sub} id={subId}/>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// `icon` (set-up's needs): a 72px row with the icon beside the words.
function CheckRow({ checked, onChange, label, hint, disabled, icon, style }) {
  const id = React.useId();
  return (
    <label className="ds-choice" style={{ ...rowStyle(checked, disabled), ...(icon ? { minHeight: 72, alignItems: 'center' } : null), ...style }}>
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={e => onChange(e.target.checked)}
        aria-describedby={hint ? id : undefined} style={inputStyle}/>
      <Mark type="checkbox" on={!!checked}/>
      {icon && <span style={{ color: C2.teal, display: 'inline-flex', flexShrink: 0 }}><Icon name={icon} size={26}/></span>}
      <Text label={label} sub={hint} id={id} big={!!icon}/>
    </label>
  );
}

export { ChoiceGroup, CheckRow };
