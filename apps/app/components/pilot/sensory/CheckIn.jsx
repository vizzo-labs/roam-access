'use client';
// "How is it right now?" (#17) — a 2-tap sensory check-in from the venue page.
// A new check-in within 2 hours replaces your previous one for the place.

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, SPACE, TYPE } from '../ds';
import { CROWD_IDS, LIGHT_IDS, NOISE_IDS } from '@/lib/sensory/defs';
import { useT } from '../i18n';
import { ChoiceRow, dimOptions } from './bits';

// Noise and crowds first: they change through the day. Light rarely does.
const DIMS = [['noise', NOISE_IDS], ['crowd', CROWD_IDS], ['light', LIGHT_IDS]];

export function CheckIn({ app, venue }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [val, setVal] = React.useState({ noise: null, crowd: null, light: null });
  const [sending, setSending] = React.useState(false);
  const toggleRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  const any = val.noise || val.crowd || val.light;

  const close = () => {
    setOpen(false);
    setVal({ noise: null, crowd: null, light: null });
    requestAnimationFrame(() => toggleRef.current?.focus());
  };

  async function send() {
    if (!any || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/venues/${encodeURIComponent(venue.id)}/sensory`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(val),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { venue: fresh } = await res.json();
      if (fresh) app.updateVenue(fresh);
      app.toast(t('sensory.checkin.thanks'));
      close();
    } catch {
      app.toast(t('sensory.checkin.failed'));
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button ref={toggleRef} variant="outline" size="sm" aria-expanded={false} aria-controls={`checkin-${venue.id}`}
        onClick={() => { setOpen(true); requestAnimationFrame(() => bodyRef.current?.querySelector('button')?.focus()); }}
        style={{ marginTop: SPACE.sm, whiteSpace: 'normal' }}>
        {t('sensory.checkin.open')}
      </Button>
    );
  }
  return (
    <div id={`checkin-${venue.id}`} ref={bodyRef} role="group" aria-labelledby={`checkin-h-${venue.id}`}
      style={{ marginTop: SPACE.sm, padding: SPACE.md, borderRadius: 14, background: C2.stone }}>
      <h3 id={`checkin-h-${venue.id}`} style={{ ...TYPE.headline, color: C2.char, margin: 0 }}>{t('sensory.checkin.title')}</h3>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 4px' }}>{t('sensory.checkin.hint')}</p>
      {DIMS.map(([dim, ids], i) => (
        <ChoiceRow key={dim} id={`checkin-${dim}-${venue.id}`} first={i === 0}
          question={t(`sensory.dim.${dim}.questionNow`)}
          options={dimOptions(t, dim, ids)} value={val[dim]} onChange={x => setVal(v => ({ ...v, [dim]: x }))}/>
      ))}
      <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap', marginTop: SPACE.sm }}>
        <Button variant="primary" size="sm" onClick={send} disabled={!any || sending} aria-describedby={!any ? `checkin-hint-${venue.id}` : undefined}>
          {sending ? t('common.sending') : t('common.send')}
        </Button>
        <Button variant="ghost" size="sm" onClick={close}>{t('common.cancel')}</Button>
      </div>
      {!any && <p id={`checkin-hint-${venue.id}`} style={{ ...TYPE.footnote, color: C2.slate, margin: '8px 0 0' }}>{t('sensory.checkin.chooseOne')}</p>}
    </div>
  );
}
