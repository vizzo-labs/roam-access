'use client';

import React from 'react';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { cardLines, cardText, formatVisitDate, NOTE_MAX } from '@/lib/needs-card';
import { V2BigBtn, V2Back } from '../ui/Buttons';
import { V2Shell } from '../ui/Shell';
import { V2Dictate } from '../ui/Dictate';
import { C2, F2, M2, V2_H1, RA2_INPUT_FONT } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { useRA2Dialog } from '../ui/useDialog';
import { useVenueSays } from './VenueSays';

// ─────────────────────────────────────────────────────────────
// MY NEEDS CARD — tell a place what you need before you arrive.
// Share it by text, email or copy; send it in-app to a claimed venue (the
// venue sees needs, note and date — never your name).
// ─────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || `${res.status}`), { status: res.status });
  return body;
}

const STATUS = {
  sent: 'Sent — not opened yet',
  seen: 'Seen by the venue',
  replied: 'The venue replied',
};

function V2NeedsCard({ app }) {
  const venue = app.selectedId ? app.venueById(app.selectedId) : null;
  const h = useV2Heading('card-' + (venue?.id || ''));
  const says = useVenueSays(venue?.id || null);
  const [loaded, setLoaded] = React.useState(null);
  const [needs, setNeeds] = React.useState(app.user?.needs || []);
  const [note, setNote] = React.useState('');
  const [visitOn, setVisitOn] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [big, setBig] = React.useState(false);

  React.useEffect(() => {
    api('/api/cards').then(d => {
      setLoaded(d);
      setNeeds(d.card.needs);
      setNote(d.card.note || '');
      setVisitOn(d.card.visitOn || '');
    }, () => setLoaded({ card: null, sent: [], failed: true }));
  }, []);

  const card = { needs, note, visitOn: visitOn || null, venueName: venue?.name || null };
  const lines = cardLines(card);
  const text = cardText(card);
  const subject = venue ? `Visiting ${venue.name} — what helps me` : 'Visiting soon — what helps me';
  const claimed = !!(venue && says?.claimed);
  const phone = venue?.phone ? venue.phone.replace(/[^+\d]/g, '') : '';

  const toggle = id => setNeeds(n => (n.includes(id) ? n.filter(x => x !== id) : [...n, id]));
  const say = msg => { setStatus(''); setTimeout(() => setStatus(msg), 30); };

  async function save(quiet) {
    try {
      const d = await api('/api/cards', { method: 'PUT', body: JSON.stringify({ needs, note, visitOn: visitOn || null }) });
      setLoaded(d);
      if (!quiet) say('Card saved.');
      return true;
    } catch {
      say('Couldn’t save your card — check your connection.');
      return false;
    }
  }

  async function copy() {
    save(true);
    try { await navigator.clipboard.writeText(text); say('Copied. Paste it into a message or email.'); }
    catch { say('Couldn’t copy — select the card text and copy it instead.'); }
  }

  async function share() {
    save(true);
    try { await navigator.share({ title: subject, text }); } catch { /* dismissed */ }
  }

  async function send() {
    if (!venue) return;
    setBusy(true);
    try {
      const d = await api('/api/cards/send', { method: 'POST', body: JSON.stringify({ venueId: venue.id, needs, note, visitOn: visitOn || null }) });
      setLoaded(d);
      say(`Sent to ${d.venueName}. You’ll see here when they’ve read it.`);
    } catch (e) {
      say(e.message && e.status === 400 ? e.message : 'Couldn’t send your card — check your connection and try again.');
    } finally { setBusy(false); }
  }

  const h2 = { fontSize: 18, fontWeight: 700, margin: '26px 0 10px', fontFamily: F2, letterSpacing: '-0.01em' };
  const fieldLabel = { display: 'block', fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: F2, color: C2.char };
  const hint = { fontSize: 14, color: C2.slate, margin: '0 0 8px', fontFamily: F2, lineHeight: 1.45 };
  const input = {
    width: '100%', boxSizing: 'border-box', fontSize: RA2_INPUT_FONT, fontFamily: F2, color: C2.char,
    border: `1.5px solid ${C2.line}`, borderRadius: 14, padding: '12px 14px', background: C2.paper,
  };
  const linkBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', minHeight: 56, borderRadius: 16,
    fontFamily: F2, fontWeight: 700, fontSize: 17, textDecoration: 'none', boxSizing: 'border-box',
    background: C2.paper, color: C2.teal, border: `2.5px solid ${C2.teal}`,
  };

  return (
    <V2Shell tabs app={app} active="me">
      <div style={{ padding: '10px 22px 0' }}>
        <V2Back app={app} to={venue ? 'venue' : 'me'} id={venue ? venue.id : null} label={venue ? `Back to ${venue.name}` : 'Back to your profile'}/>
      </div>
      <div style={{ padding: '14px 22px 28px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 28, marginBottom: 6 }}>
          My needs card<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: C2.slate, margin: '0 0 16px', fontFamily: F2 }}>
          Tell a place what helps you before you arrive — so you don’t have to explain on the spot.
          {venue ? ` This card is for ${venue.name}.` : ''}
        </p>

        {/* the card itself */}
        <section aria-labelledby="card-preview-h" style={{ border: `2.5px solid ${C2.teal}`, borderRadius: 20, padding: '18px 20px', background: C2.tealSoft }}>
          <h2 id="card-preview-h" style={{ fontSize: 13, fontWeight: 700, color: C2.teal, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: M2, margin: '0 0 10px' }}>
            Your card
          </h2>
          {lines.map((l, i) => (
            <p key={i} style={{ fontSize: 19, lineHeight: 1.45, margin: '0 0 8px', fontFamily: F2, color: C2.char, fontWeight: i === 0 ? 700 : 400 }}>{l}</p>
          ))}
        </section>
        <div style={{ height: 10 }}/>
        <V2BigBtn kind="ghost" onClick={() => setBig(true)}>Show it full screen</V2BigBtn>

        <div role="status" aria-live="polite" style={{ minHeight: 24, margin: '14px 0 0', fontSize: 16, fontWeight: 700, color: C2.teal, fontFamily: F2 }}>{status}</div>

        {/* edit */}
        <h2 style={h2}>What to include</h2>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={hint}>Tick what you want this card to say. Your profile needs are ticked to start.</legend>
          {RA2_NEEDS.map(n => {
            const on = needs.includes(n.id);
            return (
              <label key={n.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '8px 14px', marginBottom: 8, cursor: 'pointer',
                border: on ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`, borderRadius: 14, background: on ? C2.tealSoft : C2.paper,
                fontFamily: F2, fontSize: 16, color: C2.char, boxSizing: 'border-box',
              }}>
                <input type="checkbox" checked={on} onChange={() => toggle(n.id)} style={{ width: 24, height: 24, accentColor: C2.teal, flexShrink: 0 }}/>
                {n.label}
              </label>
            );
          })}
        </fieldset>

        <label htmlFor="card-note" style={{ ...fieldLabel, marginTop: 16 }}>Anything else? (optional)</label>
        <p id="card-note-hint" style={hint}>For example: “I need a table near the door.” Don’t add your name unless you want the venue to see it.</p>
        <textarea id="card-note" aria-describedby="card-note-hint" value={note} maxLength={NOTE_MAX} rows={3}
          onChange={e => setNote(e.target.value)} style={{ ...input, resize: 'vertical', lineHeight: 1.45 }}/>
        <V2Dictate onText={t => setNote(n => (n ? `${n} ${t}` : t).slice(0, NOTE_MAX))}/>

        <label htmlFor="card-date" style={{ ...fieldLabel, marginTop: 16 }}>When are you going? (optional)</label>
        <input id="card-date" type="date" value={visitOn} onChange={e => setVisitOn(e.target.value)} style={{ ...input, minHeight: 52 }}/>
        {visitOn && <p style={{ ...hint, marginTop: 6 }}>{formatVisitDate(visitOn)}</p>}

        <div style={{ height: 14 }}/>
        <V2BigBtn kind="primary" onClick={() => save(false)}>Save my card</V2BigBtn>

        {/* send in-app to a claimed venue */}
        {venue && (
          <>
            <h2 style={h2}>Send it to {venue.name}</h2>
            {claimed ? (
              <>
                <p style={hint}>{venue.name} uses Roam Access. They’ll see your card — not your name — and can reply here.</p>
                <V2BigBtn kind="rust" onClick={send} disabled={busy || (!needs.length && !note.trim())}>
                  {busy ? 'Sending…' : `Send to ${venue.name}`}
                </V2BigBtn>
              </>
            ) : (
              <p style={hint}>
                {venue.name} hasn’t joined Roam Access yet, so it can’t get cards in the app. Send it by text or email below
                {phone ? ' — the text button goes to their listed number.' : '.'}
              </p>
            )}
          </>
        )}

        {/* share anywhere */}
        <h2 style={h2}>Share it</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {typeof navigator !== 'undefined' && navigator.share && (
            <V2BigBtn kind="outline" onClick={share}>Share…</V2BigBtn>
          )}
          <a href={`sms:${phone}?&body=${encodeURIComponent(text)}`} onClick={() => save(true)} style={linkBtn}>
            Send as a text message{phone && venue ? <span className="ra-sr-only"> to {venue.name}</span> : null}
          </a>
          <a href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`} onClick={() => save(true)} style={linkBtn}>
            Send as an email
          </a>
          <V2BigBtn kind="ghost" onClick={copy}>Copy the text</V2BigBtn>
        </div>

        {/* sent cards */}
        {loaded?.sent?.length > 0 && (
          <>
            <h2 style={h2}>Cards you’ve sent</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {loaded.sent.map(c => (
                <li key={c.id} style={{ border: `1.5px solid ${C2.hair}`, borderRadius: 16, padding: 16, marginBottom: 10, fontFamily: F2 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C2.char }}>{c.venueName}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C2.slate }}>
                    Sent {new Date(c.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {c.visitOn ? ` · visiting ${formatVisitDate(c.visitOn)}` : ''}
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 700, color: c.status === 'sent' ? C2.slate : C2.teal }}>
                    {c.status === 'sent' ? '○' : '✓'} {STATUS[c.status] || c.status}
                  </p>
                  {c.venueResponse && (
                    <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.5, color: C2.char, background: C2.stone, borderRadius: 10, padding: '10px 12px' }}>
                      “{c.venueResponse}”
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        {loaded?.failed && <p style={hint}>Couldn’t load your saved card — you can still share this one.</p>}
      </div>
      <CardFullScreen open={big} onClose={() => setBig(false)} lines={lines}/>
    </V2Shell>
  );
}

// Large-print view to show at the counter.
function CardFullScreen({ open, onClose, lines }) {
  const ref = useRA2Dialog(open, onClose);
  if (!open) return null;
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="card-big-h" style={{
      position: 'fixed', inset: 0, zIndex: 50, background: C2.paper, overflowY: 'auto',
      padding: '24px 24px calc(24px + env(safe-area-inset-bottom))', boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <V2BigBtn kind="primary" onClick={onClose}>Close</V2BigBtn>
        <h2 id="card-big-h" className="ra-sr-only">My needs card</h2>
        <div style={{ marginTop: 20 }}>
          {lines.map((l, i) => (
            <p key={i} style={{ fontSize: 30, lineHeight: 1.35, margin: '0 0 18px', fontFamily: F2, color: C2.char, fontWeight: i === 0 ? 700 : 500 }}>{l}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export { V2NeedsCard };
