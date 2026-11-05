'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Button, RADIUS, SPACE, Sheet, TYPE } from '../ds';
import { useT } from '../i18n';

// "Report a problem" — closed, moved, wrong location, duplicate, info wrong
// (+ an optional note). Goes to the pilot team's queue in /admin.
// Keep in sync with ISSUE_KINDS in lib/data/trust.ts. Mount it only while
// open (state starts fresh each time; the Sheet restores focus on close).
const KINDS = ['closed', 'moved', 'wrong_location', 'duplicate', 'info_wrong'];

function ReportDialog({ onClose, venue, initialKind = null, onSent, onReview }) {
  const t = useT();
  const [kind, setKind] = React.useState(initialKind);
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  async function send(e) {
    e?.preventDefault();
    if (sending) return;
    if (!kind) { setError(t('trust.report.chooseFirst')); return; }
    setSending(true); setError('');
    try {
      const res = await fetch(`/api/venues/${encodeURIComponent(venue.id)}/issues`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, note }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onSent();
    } catch {
      setSending(false);
      setError(t('trust.report.failed'));
    }
  }

  const footer = (
    <div style={{ display: 'flex', gap: SPACE.xs }}>
      <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>{t('common.cancel')}</Button>
      <Button type="submit" form="report-form" disabled={sending} style={{ flex: 1.4 }}>
        {sending ? t('common.sending') : t('trust.report.send')}
      </Button>
    </div>
  );

  return (
    <Sheet open onClose={onClose} title={t('trust.report.title')} closeLabel={t('trust.report.close')}
      description={t('trust.report.about', { name: venue.name })} footer={footer}>
      <form id="report-form" onSubmit={send} noValidate>
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ ...TYPE.headline, marginBottom: SPACE.xs, padding: 0 }}>{t('trust.report.whatsWrong')}</legend>
          {KINDS.map(id => {
            const k = { id, label: t(`trust.report.${id}.label`), hint: t(`trust.report.${id}.hint`) };
            const on = kind === k.id;
            return (
              <label key={k.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, minHeight: 60, padding: '8px 14px', marginBottom: SPACE.xs,
                borderRadius: RADIUS.md, cursor: 'pointer', boxSizing: 'border-box',
                border: on ? `2.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
                background: on ? C2.tealSoft : C2.paper,
              }}>
                <input type="radio" name="report-kind" value={k.id} checked={on}
                  onChange={() => { setKind(k.id); setError(''); }}
                  style={{ width: 22, height: 22, margin: 0, accentColor: C2.teal, flexShrink: 0 }}/>
                <span>
                  <span style={{ ...TYPE.headline, display: 'block' }}>{k.label}</span>
                  <span style={{ ...TYPE.footnote, display: 'block', color: C2.slate }}>{k.hint}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {kind === 'info_wrong' && onReview && (
          <div style={{ margin: '4px 0 8px' }}>
            <p style={{ ...TYPE.callout, margin: 0 }}>{t('trust.report.accessChanged')}</p>
            <Button variant="plain" size="sm" onClick={onReview} style={{ padding: '0 2px' }}>{t('trust.report.reviewInstead')}</Button>
          </div>
        )}

        <label htmlFor="report-note" style={{ ...TYPE.headline, display: 'block', margin: '10px 0 6px' }}>
          {t('trust.report.tellMore')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
        </label>
        <textarea id="report-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500}
          aria-describedby="report-note-hint" placeholder={t('trust.report.notePlaceholder')}
          style={{
            ...TYPE.input, width: '100%', boxSizing: 'border-box', borderRadius: RADIUS.md, border: `1.5px solid ${C2.line}`,
            padding: 12, color: C2.char, background: C2.paper, resize: 'vertical',
          }}/>
        <p id="report-note-hint" style={{ ...TYPE.footnote, color: C2.slate, margin: '6px 0 0' }}>
          {t('trust.report.noteHint')}
        </p>
        {error && <Banner tone="danger" live="assertive" style={{ marginTop: SPACE.sm }}>{error}</Banner>}
      </form>
    </Sheet>
  );
}

export { ReportDialog };
