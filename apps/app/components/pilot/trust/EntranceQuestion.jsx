'use client';

import React from 'react';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { ENTRANCE_ALTS, ENTRANCE_NOTE_MAX } from '@/lib/trust/entrance';

// Shown right after "Step-free way in? No": is there another way in without
// steps, and where? Tap an answer again to clear it.
function EntranceQuestion({ value, note, onChange, onNote }) {
  return (
    <div role="group" aria-labelledby="q-entrance" style={{
      margin: '0 0 6px', padding: '12px 14px', borderRadius: 14, background: C2.tealSoft, border: `1.5px solid ${C2.line}`,
    }}>
      <p id="q-entrance" style={{ fontSize: 15.5, lineHeight: 1.35, fontWeight: 600, fontFamily: F2, color: C2.char, margin: '0 0 10px' }}>
        Step-free way in through another entrance?
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ENTRANCE_ALTS.map(a => {
          const on = value === a.id;
          return (
            <button key={a.id} type="button" aria-pressed={on} onClick={() => onChange(on ? null : a.id)} style={{
              minHeight: 44, padding: '0 14px', borderRadius: 999,
              border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.teal : C2.paper, color: on ? C2.paper : C2.char,
              fontWeight: 700, fontSize: 15, fontFamily: F2, cursor: 'pointer',
            }}>{a.label}</button>
          );
        })}
      </div>
      {value && value !== 'none' && (
        <div style={{ marginTop: 12 }}>
          <label htmlFor="q-entrance-where" style={{ display: 'block', fontSize: 15, fontWeight: 700, fontFamily: F2, color: C2.char, marginBottom: 6 }}>
            Where? <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
          </label>
          <input id="q-entrance-where" type="text" value={note} maxLength={ENTRANCE_NOTE_MAX}
            onChange={e => onNote(e.target.value)} placeholder="e.g. Ramp on the laneway side"
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 48, borderRadius: 12, border: `1.5px solid ${C2.line}`,
              padding: '0 12px', fontSize: RA2_INPUT_FONT, fontFamily: F2, color: C2.char, background: C2.paper,
            }}/>
        </div>
      )}
    </div>
  );
}

export { EntranceQuestion };
