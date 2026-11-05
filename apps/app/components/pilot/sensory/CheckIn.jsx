'use client';
// "How is it right now?" (#17) — a 2-tap sensory check-in from the venue page.
// A new check-in within 2 hours replaces your previous one for the place.

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, SPACE, TYPE } from '../ds';
import { SENSORY_DIMS } from '@/lib/sensory/defs';
import { ChoiceRow } from './bits';

export function CheckIn({ app, venue }) {
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
      app.toast('Thanks — that helps people decide when to go.');
      close();
    } catch (e) {
      app.toast('Couldn’t send that — check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button ref={toggleRef} variant="outline" size="sm" aria-expanded={false} aria-controls={`checkin-${venue.id}`}
        onClick={() => { setOpen(true); requestAnimationFrame(() => bodyRef.current?.querySelector('button')?.focus()); }}
        style={{ marginTop: SPACE.sm }}>
        I’m here — how is it right now?
      </Button>
    );
  }
  // Noise and crowds first: they change through the day. Light rarely does.
  const dims = ['noise', 'crowd', 'light'].map(id => SENSORY_DIMS.find(d => d.id === id));
  return (
    <div id={`checkin-${venue.id}`} ref={bodyRef} role="group" aria-labelledby={`checkin-h-${venue.id}`}
      style={{ marginTop: SPACE.sm, padding: SPACE.md, borderRadius: 14, background: C2.stone }}>
      <h3 id={`checkin-h-${venue.id}`} style={{ ...TYPE.headline, color: C2.char, margin: 0 }}>How is it right now?</h3>
      <p style={{ ...TYPE.footnote, color: C2.slate, margin: '2px 0 4px' }}>Answer one or more. Shown with the time, never your name.</p>
      {dims.map((d, i) => (
        <ChoiceRow key={d.id} id={`checkin-${d.id}-${venue.id}`} first={i === 0}
          question={d.id === 'light' ? 'Lighting (optional)' : d.question.replace(' was it', ' is it')}
          options={d.options} value={val[d.id]} onChange={x => setVal(v => ({ ...v, [d.id]: x }))}/>
      ))}
      <div style={{ display: 'flex', gap: SPACE.xs, flexWrap: 'wrap', marginTop: SPACE.sm }}>
        <Button variant="primary" size="sm" onClick={send} disabled={!any || sending} aria-describedby={!any ? `checkin-hint-${venue.id}` : undefined}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
        <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
      </div>
      {!any && <p id={`checkin-hint-${venue.id}`} style={{ ...TYPE.footnote, color: C2.slate, margin: '8px 0 0' }}>Choose at least one answer to send.</p>}
    </div>
  );
}
