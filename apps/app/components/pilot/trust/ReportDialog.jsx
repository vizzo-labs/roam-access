'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { useRA2Dialog } from '../ui/useDialog';

// "Report a problem" — closed, moved, wrong location, duplicate, info wrong
// (+ an optional note). Goes to the pilot team's queue in /admin.
// Keep in sync with ISSUE_KINDS in lib/data/trust.ts. Mount it only while
// open (state starts fresh each time; unmounting restores focus).
const KINDS = [
  { id: 'closed',         label: 'It has closed',           hint: 'Closed for good, not just today' },
  { id: 'moved',          label: 'It has moved',            hint: 'Tell us the new address if you know it' },
  { id: 'wrong_location', label: 'Wrong spot on the map',   hint: 'The pin or address is in the wrong place' },
  { id: 'duplicate',      label: 'It’s listed twice',        hint: 'Tell us the other listing’s name' },
  { id: 'info_wrong',     label: 'Something here is wrong', hint: 'Access info, name, phone or website' },
];

function ReportDialog({ open, onClose, venue, initialKind = null, onSent, onReview }) {
  const ref = useRA2Dialog(open, onClose);
  const [kind, setKind] = React.useState(initialKind);
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  if (!open) return null;

  async function send(e) {
    e.preventDefault();
    if (!kind || sending) { if (!kind) setError('Choose what’s wrong first.'); return; }
    setSending(true); setError('');
    try {
      const res = await fetch(`/api/venues/${encodeURIComponent(venue.id)}/issues`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, note }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onSent();
    } catch {
      setSending(false);
      setError('Couldn’t send your report — check your connection and try again.');
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="report-h" aria-describedby="report-d" tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: C2.paper, borderRadius: '22px 22px 0 0', padding: '20px 22px',
          paddingBottom: 'calc(var(--ra-tabs-pad) + 16px)',
          maxHeight: '88%', overflowY: 'auto', boxSizing: 'border-box', fontFamily: F2, color: C2.char,
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 id="report-h" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Report a problem</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: 0, cursor: 'pointer', width: 48, height: 48, margin: -12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
              <path d="M1 1l12 12M13 1L1 13" stroke={C2.char} strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </button>
        </div>
        <p id="report-d" style={{ fontSize: 15, color: C2.slate, margin: '4px 0 14px', lineHeight: 1.45 }}>
          About {venue.name}. The pilot team checks every report.
        </p>

        <form onSubmit={send} noValidate>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 8, padding: 0 }}>What’s wrong?</legend>
            {KINDS.map(k => {
              const on = kind === k.id;
              return (
                <label key={k.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, minHeight: 60, padding: '8px 14px', marginBottom: 8,
                  borderRadius: 14, cursor: 'pointer', boxSizing: 'border-box',
                  border: on ? `2.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
                  background: on ? C2.tealSoft : C2.paper,
                }}>
                  <input type="radio" name="report-kind" value={k.id} checked={on}
                    onChange={() => { setKind(k.id); setError(''); }}
                    style={{ width: 22, height: 22, margin: 0, accentColor: C2.teal, flexShrink: 0 }}/>
                  <span>
                    <span style={{ display: 'block', fontSize: 16.5, fontWeight: 700 }}>{k.label}</span>
                    <span style={{ display: 'block', fontSize: 14, color: C2.slate, lineHeight: 1.35 }}>{k.hint}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {kind === 'info_wrong' && onReview && (
            <p style={{ fontSize: 15, lineHeight: 1.45, margin: '4px 0 8px' }}>
              Access changed since the last review?{' '}
              <button type="button" onClick={onReview} style={{
                minHeight: 44, padding: '0 2px', border: 0, background: 'transparent', color: C2.teal,
                fontFamily: F2, fontSize: 15, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
              }}>Share your experience instead</button>
              {' '}— it updates the verdict straight away.
            </p>
          )}

          <label htmlFor="report-note" style={{ display: 'block', fontSize: 16.5, fontWeight: 700, margin: '10px 0 6px' }}>
            Tell us more <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
          </label>
          <textarea id="report-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500}
            placeholder="e.g. Closed since October; now a bakery"
            style={{
              width: '100%', boxSizing: 'border-box', borderRadius: 14, border: `1.5px solid ${C2.line}`,
              padding: 12, fontSize: RA2_INPUT_FONT, fontFamily: F2, lineHeight: 1.45, color: C2.char,
              background: C2.paper, resize: 'vertical',
            }}/>
          <p style={{ fontSize: 13.5, color: C2.slate, margin: '6px 0 0', lineHeight: 1.4 }}>
            Please don’t include anyone’s name or health details.
          </p>

          <p role="alert" style={{ minHeight: error ? 'auto' : 0, margin: error ? '12px 0 0' : 0, color: C2.red, fontWeight: 700, fontSize: 15 }}>{error}</p>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <V2BigBtn kind="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</V2BigBtn>
            <V2BigBtn kind="primary" type="submit" disabled={sending} style={{ flex: 1.4 }}>
              {sending ? 'Sending…' : 'Send report'}
            </V2BigBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

export { ReportDialog };
