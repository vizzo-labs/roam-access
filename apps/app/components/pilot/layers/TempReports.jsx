'use client';
// Temporary reports: the banner on a venue / beach / toilet, the "Still
// there?" buttons, and the sheet to report a problem. A report is today's
// news, not a verdict — it expires on its own.

import React from 'react';
import { REPORT_NOTE_MAX } from '@/lib/layers/defs';
import { C2, F2, RA2_INPUT_FONT } from '../ui/palette';
import { Banner, Button, RADIUS, Sheet, SPACE, TYPE } from '../ds';
import { UserText, useLocale } from '../i18n';
import { until, reportBanner, reportLabel, reportType, reportTypesFor } from './layerUtils';

// The banner: every live report for one place, most recent first.
export function TempReportBanner({ app, reports, placeName, style = {} }) {
  const { t, fmt, def } = useLocale();
  const [busy, setBusy] = React.useState(null);
  if (!reports || !reports.length) return null;
  const L = app.layers;

  async function act(r, kind) {
    setBusy(r.id + kind);
    try {
      if (kind === 'confirm') {
        await L.confirm(r.id);
        app.toast(t('layers.report.confirmed', { count: reportType(r.type)?.hours || 24 }));
      } else {
        await L.gone(r.id);
        app.toast(t('layers.report.cleared'));
      }
    } catch (e) {
      app.toast(e.status === 400 ? t('layers.report.expired') : t('layers.report.sendFailed'));
      L.reload();
    } finally { setBusy(null); }
  }

  return (
    <section aria-label={t('layers.report.region', { name: placeName })} style={{ marginBottom: SPACE.sm, ...style }}>
      {reports.map(r => {
        const positive = !!reportType(r.type)?.positive;
        const label = reportBanner(t, r.type);
        const people = r.confirmations > 0 ? ' ' + t('layers.report.stillThereCount', { count: r.confirmations + 1 }) : '';
        return (
          <Banner key={r.id} tone={positive ? 'success' : 'warn'}
            title={<><span className="ra-sr-only">{positive ? t('layers.report.srCommunity') : t('layers.report.srProblem')}</span>{label}</>}
            style={{ marginBottom: SPACE.xs, borderLeftWidth: 8 }}>
            {r.note && <p style={{ margin: '2px 0 0' }}>“<UserText>{r.note}</UserText>”</p>}
            <p style={{ ...TYPE.footnote, color: C2.slate, margin: '6px 0 0' }}>
              {t('layers.report.meta', { ago: fmt.ago(r.createdAt, L.now), people, until: until(r.expiresAt, def.intl) })}
            </p>
            <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap', alignItems: 'center', marginTop: SPACE.sm }}>
              <span style={{ ...TYPE.headline, fontSize: 15 }}>{t('layers.report.stillThere')}</span>
              <Button size="sm" onClick={() => act(r, 'confirm')} disabled={!!busy || r.confirmedByMe}
                aria-label={r.confirmedByMe ? t('layers.report.youConfirmedLabel', { label }) : t('layers.report.yesLabel', { label })}>
                {r.confirmedByMe ? t('layers.report.youConfirmed') : t('common.yes')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(r, 'gone')} disabled={!!busy}
                aria-label={t('layers.report.goneLabel', { label })}>{t('layers.report.gone')}</Button>
            </div>
          </Banner>
        );
      })}
    </section>
  );
}

// "Report a temporary problem" → a sheet with the types that apply here.
export function ReportButton({ app, target, style = {} }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="ghost" size="lg" full icon="warn" onClick={() => setOpen(true)} style={{ whiteSpace: 'normal', ...style }}>
        {t('layers.report.button')}
      </Button>
      {open && <ReportSheet app={app} target={target} onClose={() => setOpen(false)}/>}
    </>
  );
}

function ReportSheet({ app, target, onClose }) {
  const { t } = useLocale();
  const types = reportTypesFor(target.where);
  const [type, setType] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const formId = React.useId();

  async function submit(e) {
    e.preventDefault();
    if (!type) { setError(t('layers.report.chooseFirst')); return; }
    setSending(true); setError('');
    try {
      const r = await app.layers.report({ targetType: target.type, targetId: target.id, type, note });
      app.toast(r.merged ? t('layers.report.merged') : t('layers.report.thanks', { count: reportType(type).hours }));
      onClose();
    } catch (err) {
      setError(err.status === 400 ? t('layers.report.cantSave') : t('layers.report.failed'));
      setSending(false);
    }
  }

  const row = on => ({
    display: 'flex', alignItems: 'center', gap: SPACE.sm, minHeight: 52, padding: `6px ${SPACE.md - 2}px`, marginBottom: SPACE.xs,
    borderRadius: RADIUS.md, border: `${on ? 2.5 : 1.5}px solid ${on ? C2.teal : C2.line}`, boxSizing: 'border-box',
    background: on ? C2.tealSoft : C2.paper, cursor: 'pointer', fontFamily: F2, fontSize: 16, fontWeight: on ? 700 : 600, color: C2.char,
  });

  return (
    <Sheet open onClose={onClose} title={t('layers.report.sheetTitle', { name: target.name })} closeLabel={t('layers.report.sheetClose')}
      description={t('layers.report.sheetDesc')}
      footer={<Button type="submit" form={formId} full size="lg" disabled={sending}>{sending ? t('common.sending') : t('layers.report.submit')}</Button>}>
      <form id={formId} onSubmit={submit}>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="ra-sr-only">{t('layers.report.kind')}</legend>
          {types.map(rt => (
            <label key={rt.id} style={row(type === rt.id)}>
              <input type="radio" name="report-type" value={rt.id} checked={type === rt.id}
                onChange={() => { setType(rt.id); setError(''); }}
                style={{ width: 22, height: 22, margin: 0, accentColor: C2.teal, flexShrink: 0 }}/>
              <span style={{ flex: 1 }}>{reportLabel(t, rt.id)}</span>
              <span style={{ ...TYPE.caption, color: C2.slate, flexShrink: 0 }}>{t('layers.report.hours', { hours: rt.hours })}</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor={`${formId}-note`} style={{ display: 'block', ...TYPE.headline, fontSize: 15, margin: `${SPACE.sm}px 0 6px` }}>
          {t('layers.report.note')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
        </label>
        <textarea id={`${formId}-note`} value={note} onChange={e => setNote(e.target.value)} maxLength={REPORT_NOTE_MAX}
          rows={3} aria-describedby={`${formId}-hint`} placeholder={t('layers.report.notePlaceholder')}
          style={{
            width: '100%', boxSizing: 'border-box', borderRadius: RADIUS.md, border: `1.5px solid ${C2.line}`,
            padding: SPACE.sm, fontFamily: F2, fontSize: RA2_INPUT_FONT, color: C2.char, background: C2.paper, resize: 'vertical',
          }}/>
        <p id={`${formId}-hint`} style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0' }}>
          {t('layers.report.noteHint')}
        </p>
        {error && <Banner tone="danger" live="assertive" style={{ marginTop: SPACE.sm }}>{error}</Banner>}
      </form>
    </Sheet>
  );
}

// "Is there matting today?" — the two answers are short-lived reports.
export function MattingQuestion({ app, facility }) {
  const { t, fmt } = useLocale();
  const L = app.layers;
  const [busy, setBusy] = React.useState(false);
  const current = L.reportsFor('facility', facility.id).find(r => r.type === 'matting_down' || r.type === 'matting_missing');
  async function answer(type) {
    setBusy(true);
    try {
      await L.report({ targetType: 'facility', targetId: facility.id, type, note: '' });
      app.toast(t('layers.matting.thanks'));
    } catch { app.toast(t('layers.report.sendFailed')); }
    finally { setBusy(false); }
  }
  const qid = `matting-${facility.id}`;
  return (
    <div role="group" aria-labelledby={qid} style={{ marginTop: SPACE.sm }}>
      <p id={qid} style={{ ...TYPE.headline, fontSize: 15.5, margin: '0 0 4px' }}>{t('layers.matting.question')}</p>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: `0 0 ${SPACE.xs}px` }}>
        {current
          ? t(current.type === 'matting_down' ? 'layers.matting.yesNow' : 'layers.matting.noNow', { ago: fmt.ago(current.lastConfirmedAt, L.now) })
          : t('layers.matting.unknown')}
      </p>
      <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap' }}>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => answer('matting_down')}
          aria-label={t('layers.matting.yesLabel', { name: facility.name })}>{t('layers.matting.yes')}</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => answer('matting_missing')}
          aria-label={t('layers.matting.noLabel', { name: facility.name })}>{t('layers.matting.no')}</Button>
      </div>
    </div>
  );
}
