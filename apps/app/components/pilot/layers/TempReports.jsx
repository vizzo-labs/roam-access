'use client';
// Temporary reports: the banner on a venue / beach / toilet, the "Still
// there?" buttons, and the sheet to report a problem. A report is today's
// news, not a verdict — it expires on its own.

import React from 'react';
import { REPORT_NOTE_MAX } from '@/lib/layers/defs';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { Banner, Button, RADIUS, Sheet, SPACE, TYPE } from '../ds';
import { ago, until, reportType, reportTypesFor } from './layerUtils';

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
    <section aria-label={`Reported recently at ${placeName}`} style={{ marginBottom: SPACE.sm, ...style }}>
      {reports.map(r => {
        const t = reportType(r.type);
        const positive = !!t?.positive;
        const label = t?.banner || 'Temporary problem reported';
        const people = r.confirmations > 0 ? ` · still there, say ${r.confirmations + 1} people` : '';
        return (
          <Banner key={r.id} tone={positive ? 'success' : 'warn'}
            title={<><span className="ra-sr-only">{positive ? 'Community report: ' : 'Temporary problem: '}</span>{label}</>}
            style={{ marginBottom: SPACE.xs, borderLeftWidth: 8 }}>
            {r.note && <p style={{ margin: '2px 0 0' }}>“{r.note}”</p>}
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: '6px 0 0' }}>
              Reported {ago(r.createdAt, L.now)}{people}. From the community, not yet checked. Shows until {until(r.expiresAt)}.
            </p>
            <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap', alignItems: 'center', marginTop: SPACE.sm }}>
              <span style={{ ...TYPE.headline, fontSize: 15 }}>Still there?</span>
              <Button size="sm" onClick={() => act(r, 'confirm')} disabled={!!busy || r.confirmedByMe}
                aria-label={r.confirmedByMe ? `You confirmed: ${label}` : `Yes, still there: ${label}`}>
                {r.confirmedByMe ? 'You confirmed' : 'Yes'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(r, 'gone')} disabled={!!busy}
                aria-label={`No, it’s gone: ${label}`}>No, it’s gone</Button>
            </div>
          </Banner>
        );
      })}
    </section>
  );
}

// "Report a temporary problem" → a sheet with the types that apply here.
export function ReportButton({ app, target, style = {} }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="ghost" size="lg" full icon="warn" onClick={() => setOpen(true)} style={style}>
        Report a temporary problem
      </Button>
      {open && <ReportSheet app={app} target={target} onClose={() => setOpen(false)}/>}
    </>
  );
}

function ReportSheet({ app, target, onClose }) {
  const types = reportTypesFor(target.where);
  const [type, setType] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const formId = React.useId();

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
      setError(err.status === 400 ? 'That report couldn’t be saved here.' : 'Couldn’t send your report — check your connection and try again.');
      setSending(false);
    }
  }

  const row = on => ({
    display: 'flex', alignItems: 'center', gap: SPACE.sm, minHeight: 52, padding: `6px ${SPACE.md - 2}px`, marginBottom: SPACE.xs,
    borderRadius: RADIUS.md, border: `${on ? 2.5 : 1.5}px solid ${on ? C2.teal : C2.line}`, boxSizing: 'border-box',
    background: on ? C2.tealSoft : C2.paper, cursor: 'pointer', fontFamily: F2, fontSize: 16, fontWeight: on ? 700 : 600, color: C2.char,
  });

  return (
    <Sheet open onClose={onClose} title={`What’s wrong at ${target.name} today?`} closeLabel="Close without reporting"
      description="For problems that won’t last — it shows on the map and here, then disappears by itself. It doesn’t change anyone’s verdict."
      footer={<Button type="submit" form={formId} full size="lg" disabled={sending}>{sending ? 'Sending…' : 'Report it'}</Button>}>
      <form id={formId} onSubmit={submit}>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ra-sr-only">Kind of problem</legend>
          {types.map(t => (
            <label key={t.id} style={row(type === t.id)}>
              <input type="radio" name="report-type" value={t.id} checked={type === t.id}
                onChange={() => { setType(t.id); setError(''); }}
                style={{ width: 22, height: 22, margin: 0, accentColor: C2.teal, flexShrink: 0 }}/>
              <span style={{ flex: 1 }}>{t.label}</span>
              <span style={{ ...TYPE.caption, color: C2.slate }}>{t.hours} h</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor={`${formId}-note`} style={{ display: 'block', ...TYPE.headline, fontSize: 15, margin: `${SPACE.sm}px 0 6px` }}>
          Anything else? <span style={{ fontWeight: 500, color: C2.slate }}>(optional)</span>
        </label>
        <textarea id={`${formId}-note`} value={note} onChange={e => setNote(e.target.value)} maxLength={REPORT_NOTE_MAX}
          rows={3} aria-describedby={`${formId}-hint`} placeholder="e.g. “Side entrance on Pine St is open”"
          style={{
            width: '100%', boxSizing: 'border-box', borderRadius: RADIUS.md, border: `1.5px solid ${C2.line}`,
            padding: SPACE.sm, fontFamily: F2, fontSize: RA2_INPUT_FONT, color: C2.char, background: C2.paper, resize: 'vertical',
          }}/>
        <p id={`${formId}-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0' }}>
          Everyone can see this. Don’t include names or personal details.
        </p>
        {error && <Banner tone="danger" live="assertive" style={{ marginTop: SPACE.sm }}>{error}</Banner>}
      </form>
    </Sheet>
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
    <div role="group" aria-labelledby={qid} style={{ marginTop: SPACE.sm }}>
      <p id={qid} style={{ ...TYPE.headline, fontSize: 15.5, margin: '0 0 4px' }}>Is there beach matting today?</p>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.xs}px` }}>
        {current
          ? `${current.type === 'matting_down' ? 'Yes — matting is down' : 'No matting'}, reported ${ago(current.lastConfirmedAt, L.now)}. Been there since?`
          : 'Nobody has said today. Matting isn’t confirmed at any Northern Beaches beach — if you’re there, tell us.'}
      </p>
      <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => answer('matting_down')}
          aria-label={`Yes, there’s matting at ${facility.name} today`}>Yes, it’s down</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => answer('matting_missing')}
          aria-label={`No matting at ${facility.name} today`}>No matting</Button>
      </div>
    </div>
  );
}
