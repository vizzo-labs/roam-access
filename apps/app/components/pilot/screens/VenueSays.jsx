'use client';

import React from 'react';
import { V2BigBtn } from '../ui/Buttons';
import { C2, F2, M2 } from '../ui/palette';

// "Venue says" — what a claimed venue tells us, kept apart from community
// facts and clearly labelled. It never changes the verdict (honesty rule).
const cache = {};

function useVenueSays(id) {
  const [says, setSays] = React.useState(() => (id && cache[id]) || null);
  React.useEffect(() => {
    if (!id) return undefined;
    let live = true;
    fetch(`/api/venues/${encodeURIComponent(id)}/says`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) cache[id] = d; if (live && d) setSays(d); })
      .catch(() => {});
    return () => { live = false; };
  }, [id]);
  return says;
}

const label = {
  fontSize: 13, fontWeight: 700, color: C2.slate, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: M2, margin: 0,
};

function VenueSaysBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, fontFamily: F2,
      color: C2.char, background: C2.stone, border: `1px solid ${C2.line}`, borderRadius: 999, padding: '3px 10px',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M4 5h16v11H9l-5 4V5Z" stroke={C2.char} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      Venue says
    </span>
  );
}

// A venue's public reply under one review.
function VenueReply({ reply, venueName }) {
  if (!reply) return null;
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', borderLeft: `4px solid ${C2.line}`, background: C2.stone, borderRadius: '0 12px 12px 0' }}>
      <p style={{ margin: '0 0 6px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <VenueSaysBadge/>
        <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Reply from {venueName} · {reply.when}</span>
      </p>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, fontFamily: F2, color: C2.char, whiteSpace: 'pre-line' }}>{reply.body}</p>
    </div>
  );
}

// On the venue screen: the venue's own access statement, the needs-card
// shortcut for claimed places, and the "claim this place" link for owners.
function VenueSays({ app, venue, says }) {
  if (!says) return null;
  return (
    <>
      {says.statement && (
        <section aria-labelledby="venue-says-h" style={{ borderRadius: 18, border: `1.5px dashed ${C2.line}`, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <h2 id="venue-says-h" style={label}>From the venue</h2>
            <VenueSaysBadge/>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 10px', fontFamily: F2, color: C2.char, whiteSpace: 'pre-line' }}>{says.statement.body}</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.45, color: C2.slate, margin: 0, fontFamily: F2 }}>
            Written by {venue.name}, updated {says.statement.when}. Not checked by the community — it doesn’t change the verdict.
          </p>
        </section>
      )}
      {says.claimed && (
        <div style={{ marginBottom: 10 }}>
          <V2BigBtn kind="outline" onClick={() => app.goto('card', venue.id)}>
            Send my needs card to {venue.name}
          </V2BigBtn>
        </div>
      )}
    </>
  );
}

// Footer links: correct the base data on OpenStreetMap; claim the place.
function VenueFooterLinks({ venue, says }) {
  const claimed = !says || says.claimed; // don't offer a claim before we know
  const link = { color: C2.teal, fontWeight: 600 };
  const la = venue.lat.toFixed(6), lo = venue.lng.toFixed(6);
  return (
    <p style={{ fontSize: 13.5, color: C2.slate, textAlign: 'center', margin: '18px 0 0', lineHeight: 1.6, fontFamily: F2 }}>
      Place details from{' '}
      <a href={venue.osmUrl} target="_blank" rel="noopener noreferrer" style={link}>
        OpenStreetMap<span className="ra-sr-only"> (opens in a new tab)</span>
      </a>. Wrong name, address or location?{' '}
      <a href={`https://www.openstreetmap.org/note/new?lat=${la}&lon=${lo}#map=19/${la}/${lo}`} target="_blank" rel="noopener noreferrer" style={link}>
        Suggest a correction on OpenStreetMap<span className="ra-sr-only"> (opens in a new tab)</span>
      </a>. Access problems? Say so in your review.{' '}
      <a href="/how-it-works" style={link}>How Roam Access works</a>
      {!claimed && (
        <>
          <br/>
          <a href={`/business/claim/${encodeURIComponent(venue.id)}`} style={link}>Is this your business? Claim it — it’s free</a>
        </>
      )}
    </p>
  );
}

export { useVenueSays, VenueSays, VenueReply, VenueSaysBadge, VenueFooterLinks };
