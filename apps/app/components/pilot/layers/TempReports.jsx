'use client';
// Temporary reports: the banner on a venue / beach / toilet, the "Still
// there?" buttons, and the dialog to report a problem. A report is today's
// news, not a verdict — it expires on its own.

import React from 'react';
import { REPORT_NOTE_MAX } from '@/lib/layers/defs';
import { C2, F2, M2, RA2_INPUT_FONT } from '../ui/palette';
import { useRA2Dialog } from '../ui/useDialog';
import { V2BigBtn } from '../ui/Buttons';
import { ago, until, reportType, reportTypesFor } from './layerUtils';

const smallBtn = (primary) => ({
  minHeight: 44, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontFamily: F2,
  fontSize: 14.5, fontWeight: 700,
  border: `2px solid ${C2.char}`, background: primary ? C2.char : C2.paper, color: primary ? C2.paper : C2.char,
});

function WarnIcon({ positive, size = 22 }) {
  return positive ? (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: 999, background: C2.green, color: C2.paper, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: M2, fontWeight: 800, fontSize: size * 0.5,
    }}>✓</span>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d="M12 2.5 23 21.5H1L12 2.5Z" fill={C2.char}/>
      <path d="M12 9v6" stroke={C2.paper} strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="12" cy="18.2" r="1.4" fill={C2.paper}/>
    </svg>
  );
}

// The banner: every live report for one place, most recent first.
export function TempReportBanner({ app, reports, placeName, style = {} }) {
  const [busy, setBusy] = React.useState(null);
  if (!reports || !reports.length) return null;
  const L = app.layers;

  async function act(r, kind) {
    setBusy(r.id + kind);
    try {
      if (kind === 'confirm') {
        await L.confirm(r.id);
        app.toast(`Thanks — it now shows for at least ${reportType(r.type)?.hours || 24} more hours.`);
      } else {
        await L.gone(r.id);
        app.toast('Thanks — the report is cleared for everyone.');
      }
    } catch (e) {
      app.toast(e.status === 400 ? 'That report has already expired or been cleared.' : 'Couldn’t send that — check your connection.');
      L.reload();
    } finally { setBusy(null); }
  }

  return (
    <section aria-label={`Reported recently at ${placeName}`} style={{ marginBottom: 12, ...style }}>
      {reports.map(r => {
        const t = reportType(r.type);
        const positive = !!t?.positive;
        const label = t?.banner || 'Temporary problem reported';
        const people = r.confirmations > 0 ? ` · still there, say ${r.confirmations + 1} people` : '';
        return (
          <div key={r.id} style={{
            border: `2px solid ${positive ? C2.green : C2.char}`, borderLeftWidth: 8, borderRadius: 16,
            background: positive ? C2.greenBg : C2.paper, padding: '14px 16px', marginBottom: 8, fontFamily: F2,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <WarnIcon positive={positive}/>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C2.char, lineHeight: 1.3 }}>
                  <span className="ra-sr-only">{positive ? 'Community report: ' : 'Temporary problem: '}</span>{label}
                </p>
                {r.note && <p style={{ margin: '4px 0 0', fontSize: 15.5, lineHeight: 1.45, color: C2.char }}>“{r.note}”</p>}
                <p style={{ margin: '6px 0 0', fontSize: 13.5, color: C2.slate, lineHeight: 1.45 }}>
                  Reported {ago(r.createdAt, L.now)}{people}. From the community, not yet checked. Shows until {until(r.expiresAt)}.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ alignSelf: 'center', fontSize: 14.5, fontWeight: 600, color: C2.char, marginRight: 2 }}>Still there?</span>
              <button type="button" onClick={() => act(r, 'confirm')} disabled={!!busy || r.confirmedByMe}
                aria-label={r.confirmedByMe ? `You confirmed: ${label}` : `Yes, still there: ${label}`}
                style={{ ...smallBtn(true), opacity: r.confirmedByMe ? 0.6 : 1 }}>
                {r.confirmedByMe ? 'You confirmed' : 'Yes'}
              </button>
              <button type="button" onClick={() => act(r, 'gone')} disabled={!!busy}
                aria-label={`No, it’s gone: ${label}`} style={smallBtn(false)}>No, it’s gone</button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// "Report a temporary problem" → dialog with the types that apply here.
export function ReportButton({ app, target, style = {} }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <V2BigBtn kind="ghost" onClick={() => setOpen(true)} style={style}>
        <WarnIcon size={20}/> Report a temporary problem
      </V2BigBtn>
      {open && <ReportDialog app={app} target={target} onClose={() => setOpen(false)}/>}
    </>
  );
}

function ReportDialog({ app, target, onClose }) {
  const ref = useRA2Dialog(true, onClose);
  const types = reportTypesFor(target.where);
  const [type, setType] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(e) {
    e.preventDefault();
    if (!type) { setError('Choose what’s wrong first.'); return; }
    setSending(true); setError('');
    try {
      const r = await app.layers.report({ targetType: target.type, targetId: target.id, type, note });
      const t = reportType(type);
      app.toast(r.merged
        ? 'Someone already reported that — we’ve added your confirmation.'
        : `Thanks — we’ll show it for ${t.hours} hours unless someone says it’s gone.`);
      onClose();
    } catch (err) {
      setError('Couldn’t send your report — check your connection and try again.');
      setSending(false);
    }
  }

  const row = on => ({
    display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '6px 14px', marginBottom: 8,
    borderRadius: 14, border: `${on ? 2.5 : 1.5}px solid ${on ? C2.teal : C2.line}`,
    background: on ? C2.tealSoft : C2.paper, cursor: 'pointer', fontSize: 16, fontWeight: on ? 700 : 600, color: C2.char,
  });

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="report-h" tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '90%', overflowY: 'auto',
          background: C2.paper, borderRadius: '22px 22px 0 0', padding: '20px 22px',
          paddingBottom: 'calc(var(--ra-tabs-pad) + 16px)', boxSizing: 'border-box', fontFamily: F2,
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h2 id="report-h" style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>
            What’s wrong at {target.name} today?
          </h2>
          <button type="button" onClick={onClose} aria-label="Close without reporting" style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 14, margin: -12, lineHeight: 0, flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
              <path d="M1 1l12 12M13 1L1 13" stroke={C2.char} strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 14.5, color: C2.slate, margin: '6px 0 14px', lineHeight: 1.45 }}>
          For problems that won’t last — it shows on the map and here, then disappears by itself.
          It doesn’t change anyone’s verdict.
        </p>
        <form onSubmit={submit}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="ra-sr-only">Kind of problem</legend>
            {types.map(t => (
              <label key={t.id} style={row(type === t.id)}>
                <input type="radio" name="report-type" value={t.id} checked={type === t.id}
                  onChange={() => { setType(t.id); setError(''); }}
                  style={{ width: 22, height: 22, margin: 0, accentColor: C2.teal, flexShrink: 0 }}/>
                <span style={{ flex: 1 }}>{t.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C2.slate }}>{t.hours} h</span>
              </label>
            ))}
          </fieldset>
          <label htmlFor="report-note" style={{ display: 'block', fontSize: 15, fontWeight: 700, margin: '10px 0 6px' }}>
            Anything else? <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
          </label>
          <textarea id="report-note" value={note} onChange={e => setNote(e.target.value)} maxLength={REPORT_NOTE_MAX}
            rows={3} aria-describedby="report-note-hint" placeholder="e.g. “Side entrance on Pine St is open”"
            style={{
              width: '100%', boxSizing: 'border-box', borderRadius: 14, border: `1.5px solid ${C2.line}`,
              padding: 12, fontFamily: F2, fontSize: RA2_INPUT_FONT, color: C2.char, background: C2.paper, resize: 'vertical',
            }}/>
          <p id="report-note-hint" style={{ fontSize: 13, color: C2.slate, margin: '4px 0 14px' }}>
            Everyone can see this. Don’t include names or personal details.
          </p>
          {error && <p role="alert" style={{ color: C2.red, fontWeight: 700, fontSize: 15, margin: '0 0 12px' }}>{error}</p>}
          <V2BigBtn type="submit" kind="primary" disabled={sending}>{sending ? 'Sending…' : 'Report it'}</V2BigBtn>
        </form>
      </div>
    </div>
  );
}

// "Is there matting today?" — the two answers are short-lived reports.
export function MattingQuestion({ app, facility }) {
  const L = app.layers;
  const [busy, setBusy] = React.useState(false);
  const current = L.reportsFor('facility', facility.id).find(r => r.type === 'matting_down' || r.type === 'matting_missing');
  async function answer(type) {
    setBusy(true);
    try {
      await L.report({ targetType: 'facility', targetId: facility.id, type, note: '' });
      app.toast('Thanks — your answer shows for 12 hours.');
    } catch (e) { app.toast('Couldn’t send that — check your connection.'); }
    finally { setBusy(false); }
  }
  const qid = `matting-${facility.id}`;
  return (
    <div role="group" aria-labelledby={qid} style={{ fontFamily: F2, marginTop: 12 }}>
      <p id={qid} style={{ margin: '0 0 4px', fontSize: 15.5, fontWeight: 700, color: C2.char }}>Is there beach matting today?</p>
      <p style={{ margin: '0 0 8px', fontSize: 13.5, color: C2.slate, lineHeight: 1.45 }}>
        {current
          ? `${current.type === 'matting_down' ? 'Yes — matting is down' : 'No matting'}, reported ${ago(current.lastConfirmedAt, L.now)}. Been there since?`
          : 'Nobody has said today. Matting isn’t confirmed at any Northern Beaches beach — if you’re there, tell us.'}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" disabled={busy} onClick={() => answer('matting_down')} style={smallBtn(false)}
          aria-label={`Yes, there’s matting at ${facility.name} today`}>Yes, it’s down</button>
        <button type="button" disabled={busy} onClick={() => answer('matting_missing')} style={smallBtn(false)}
          aria-label={`No matting at ${facility.name} today`}>No matting</button>
      </div>
    </div>
  );
}
