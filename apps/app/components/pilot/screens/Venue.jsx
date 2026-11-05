'use client';

import React from 'react';
import { useVenueReviews } from './useVenueReviews';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META, V2Verdict } from '../ui/Verdict';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict } from '@/lib/pilot/match';
import { verdictSource } from '@/lib/trust/labels';
import { FactList } from '../trust/FactList';
import { Freshness } from '../trust/Freshness';
import { SourceLine } from '../trust/SourceLine';
import { VenuePhotos } from '../photos/VenuePhotos';
import { AskPlace } from '../ask/AskPlace';
import { useVenueSays, VenueSays, VenueFooterLinks } from './VenueSays';
import { useTrackVenueView } from '../track';
import { VenueAccessExtras, VenueReportsBanner } from '../layers/VenueAccessExtras';
import { SensorySummary } from '../sensory/SensorySummary';
import { WhatToExpect } from '../sensory/WhatToExpect';
import {
  ActionRow, Button, Card, Freshness as FreshnessBadge, GUTTER, RADIUS, SPACE,
  ScreenHeader, SectionHeader, SkeletonText, TYPE,
} from '../ds';

// Share the public summary page (/v/<id>): works for people without an
// account, e.g. a carer or a friend you're meeting there.
async function shareVenue(app, v) {
  const url = `${window.location.origin}/v/${encodeURIComponent(v.id)}`;
  try {
    if (navigator.share) { await navigator.share({ title: `${v.name} · Roam Access`, text: `Access information for ${v.name}`, url }); return; }
    await navigator.clipboard.writeText(url);
    app.toast('Link copied — paste it anywhere to share this place.');
  } catch { /* share sheet dismissed */ }
}

// ─────────────────────────────────────────────────────────────
// VENUE — summary first (verdict, sources, last confirmed), then
// the action row, then clear sections. Detail on demand.
// ─────────────────────────────────────────────────────────────
function V2VenueView({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('venue-' + v.id);
  const needs = app.user?.needs || [];
  const verdict = ra2Verdict(v, needs);
  const saved = app.world.saved.includes(v.id);
  const meta = V2_VERDICT_META[verdict.kind];
  const { reviews: loaded, error: reviewsError } = useVenueReviews(app, v.id);
  const written = v.verified;
  const firstReview = loaded && loaded[0];

  React.useEffect(() => { app.markVisited(v.id); }, [v.id]); // eslint-disable-line
  useTrackVenueView(v.id);
  const says = useVenueSays(v.id);

  const quick = v.quick || 0;
  const nRev = [
    v.verified || !quick ? `${v.verified} community ${v.verified === 1 ? 'review' : 'reviews'}` : null,
    quick ? `${quick} quick ${quick === 1 ? 'answer' : 'answers'}` : null,
  ].filter(Boolean).join(' and ');
  const verdictLead = {
    works: `What works for your needs, from ${nRev}.`,
    check: v.verified || quick
      ? `Things to know before you go, from ${nRev}.`
      : 'Not yet confirmed by anyone in the pilot. Check before you go — then tell us how it was.',
    barrier: `People in the pilot have flagged real barriers here, from ${nRev}.`,
    unknown: 'Nobody with your access needs has reviewed this place yet. Your visit could be the first data point.',
  }[verdict.kind];

  const saveLabel = saved ? `Remove ${v.name} from saved` : `Save ${v.name}`;
  const actions = [
    { id: 'dir', label: 'Directions', icon: 'directions', primary: true, external: true,
      href: `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`,
      ariaLabel: `Directions to ${v.name} (opens Google Maps)` },
    v.phone && { id: 'call', label: 'Call', icon: 'phone', href: 'tel:' + v.phone.replace(/[^+\d]/g, ''), ariaLabel: `Call ${v.name}` },
    v.website && { id: 'web', label: 'Website', icon: 'globe', href: v.website, external: true, ariaLabel: `${v.name} website (opens in a new tab)` },
    { id: 'save', label: saved ? 'Saved' : 'Save', icon: 'bookmark', pressed: saved, onClick: () => app.toggleSave(v.id), ariaLabel: saveLabel },
    { id: 'share', label: 'Share', icon: 'share', onClick: () => shareVenue(app, v), ariaLabel: `Share ${v.name}` },
  ];

  // The community loop stays one tap away at the bottom of the screen.
  const bar = (
    <div style={{
      padding: `${SPACE.sm}px ${GUTTER}px calc(var(--ra-tabs-pad) + 6px)`, background: C2.paper,
      borderTop: `1px solid ${C2.hair}`, flexShrink: 0,
    }}>
      <Button full size="lg" icon="edit" onClick={() => app.goto('review', v.id)}>
        {written > 0 ? 'Share your experience' : 'Be the first to review'}
      </Button>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <ScreenHeader headingRef={h} title={v.name}
        back={{ label: 'Back', onClick: () => app.goto(app.venueOrigin) }}
        subtitle={`${v.kind} · ${v.address ? `${v.address}, ` : ''}${v.area} · ${v.mins} min walk`}/>

      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px` }}>
        {/* today's temporary problems (F3) — prominent, but never a verdict */}
        <VenueReportsBanner app={app} venue={v}/>

        {/* SUMMARY — the verdict, why, from whom, how recently */}
        <section aria-label="Summary" style={{ background: meta.bg, borderRadius: RADIUS.lg, padding: 20, marginBottom: SPACE.md }}>
          <V2Verdict kind={verdict.kind} big/>
          <p style={{ ...TYPE.body, fontSize: 16.5, color: C2.char, margin: '12px 0 0' }}>{verdictLead}</p>
          <SourceLine src={verdict.kind === 'unknown' ? 'none' : (v.ev?.length ? 'community' : 'osm')}
            text={verdictSource(v, verdict, needs)} style={{ marginTop: 10, color: C2.char }}/>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.xs, marginTop: SPACE.sm }}>
            <FreshnessBadge date={v.lastConfirmed}/>
            <a href="/how-it-works" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 4px', color: C2.teal, ...TYPE.footnote, fontWeight: 700, textUnderlineOffset: 3 }}>
              How we decide verdicts
            </a>
          </div>
        </section>

        <ActionRow label={`Actions for ${v.name}`} actions={actions} style={{ marginBottom: SPACE.lg }}/>

        {/* barriers first when they exist; every fact with its source + recency */}
        <FactList kind="barrier" facts={verdict.barriers}/>
        <FactList kind="works" facts={verdict.works}/>
        <FactList kind="check" facts={verdict.checks} style={{ marginBottom: SPACE.md }}/>

        <Freshness key={v.id} app={app} venue={v}/>

        {/* sensory content (F6 #17) — describes the place, never the verdict */}
        <WhatToExpect key={'story-' + v.id} app={app} venue={v}/>
        <SensorySummary key={'sensory-' + v.id} app={app} venue={v}/>

        <VenuePhotos app={app} venueId={v.id}/>

        {/* community voice */}
        <section aria-labelledby="community-h" style={{ marginBottom: SPACE.md }}>
          <SectionHeader id="community-h" title="From the community" size="sm"
            description={written > 0 ? `${written} ${written === 1 ? 'review' : 'reviews'} from people in the pilot` : 'No reviews yet'}
            action={written > 0 ? { label: 'Read all', ariaLabel: `Read all ${written} ${written === 1 ? 'review' : 'reviews'} of ${v.name}`, onClick: () => app.goto('reviews', v.id) } : null}/>
          {written > 0 && !loaded && !reviewsError && <Card variant="filled"><SkeletonText lines={3}/><span className="ra-sr-only" role="status">Loading reviews…</span></Card>}
          {firstReview && (
            <Card variant="filled">
              <p style={{ ...TYPE.body, margin: '0 0 10px' }}>“{firstReview.text}”</p>
              <p style={{ ...TYPE.caption, color: C2.slate, margin: 0 }}>{firstReview.who} · {firstReview.when}</p>
            </Card>
          )}
          {written === 0 && (
            <Card variant="filled">
              <p style={{ ...TYPE.callout, margin: 0 }}>Been here? One tap tells people with the same needs whether it worked for you.</p>
            </Card>
          )}
        </section>

        <AskPlace key={v.id} app={app} venue={v}/>
        {/* "Venue says" — separate from community facts; never changes the verdict */}
        <VenueSays app={app} venue={v} says={says}/>

        {/* partner programs, nearest accessible toilet, report a problem (F3) */}
        <VenueAccessExtras app={app} venue={v}/>

        <VenueFooterLinks venue={v} says={says}/>
        <p style={{ ...TYPE.footnote, textAlign: 'center', margin: '8px 0 0' }}>
          <a href={`/v/${encodeURIComponent(v.id)}/share`} target="_blank" rel="noopener" style={{ color: C2.teal, fontWeight: 600, display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
            Share or print this place’s access summary<span className="ra-sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </V2Shell>
  );
}

export { V2VenueView };
