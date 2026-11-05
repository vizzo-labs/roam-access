'use client';

import React from 'react';
import { useVenueReviews } from './useVenueReviews';
import { V2Shell } from '../ui/Shell';
import { V2_VERDICT_META, V2Verdict } from '../ui/Verdict';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict } from '@/lib/pilot/match';
import { verdictSourceT } from '@/lib/trust/labels';
import { kindLabel, verdictLabel } from '@/lib/i18n/data';
import { ReadAloud, UserText, useFormat, useT } from '../i18n';
import { factText, reviewText, reviewWhen, reviewWho } from '../trust/text';
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
async function shareVenue(app, v, t) {
  const url = `${window.location.origin}/v/${encodeURIComponent(v.id)}`;
  try {
    if (navigator.share) { await navigator.share({ title: t('venue.shareTitle', { name: v.name }), text: t('venue.shareText', { name: v.name }), url }); return; }
    await navigator.clipboard.writeText(url);
    app.toast(t('venue.shareCopied'));
  } catch { /* share sheet dismissed */ }
}

// ─────────────────────────────────────────────────────────────
// VENUE — summary first (verdict, sources, last confirmed), then
// the action row, then clear sections. Detail on demand.
// ─────────────────────────────────────────────────────────────
function V2VenueView({ app }) {
  const t = useT();
  const fmt = useFormat();
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
  const revPart = t('venue.from.reviews', { count: v.verified });
  const quickPart = t('venue.from.quick', { count: quick });
  const from = v.verified && quick ? t('venue.from.both', { reviews: revPart, quick: quickPart }) : quick ? quickPart : revPart;
  const verdictLead = {
    works: t('venue.lead.works', { from }),
    check: v.verified || quick ? t('venue.lead.check', { from }) : t('venue.lead.checkNone'),
    barrier: t('venue.lead.barrier', { from }),
    unknown: t('venue.lead.unknown'),
  }[verdict.kind];
  const sourceText = verdictSourceT(t, fmt, v, verdict, needs);

  // Read aloud: the place, its verdict, why, and the top facts — built when
  // pressed, in the reader's language.
  const readText = () => {
    const list = fs => fmt.list(fs.slice(0, 3).map(f => factText(t, f)));
    return [
      t('venue.read.place', { name: v.name }),
      t('venue.read.verdict', { verdict: verdictLabel(t, verdict.kind) }),
      verdictLead,
      sourceText + '.',
      verdict.barriers.length ? t('venue.read.barriers', { list: list(verdict.barriers) }) : '',
      verdict.works.length ? t('venue.read.works', { list: list(verdict.works) }) : '',
      verdict.checks.length ? t('venue.read.checks', { list: list(verdict.checks) }) : '',
    ].filter(Boolean).join(' ');
  };

  const actions = [
    { id: 'dir', label: t('venue.action.directions'), icon: 'directions', primary: true, external: true,
      href: `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`,
      ariaLabel: t('venue.action.directionsAria', { name: v.name }) },
    v.phone && { id: 'call', label: t('venue.action.call'), icon: 'phone', href: 'tel:' + v.phone.replace(/[^+\d]/g, ''), ariaLabel: t('venue.action.callAria', { name: v.name }) },
    v.website && { id: 'web', label: t('venue.action.website'), icon: 'globe', href: v.website, external: true, ariaLabel: t('venue.action.websiteAria', { name: v.name }) },
    { id: 'save', label: saved ? t('venue.action.saved') : t('venue.action.save'), icon: 'bookmark', pressed: saved, onClick: () => app.toggleSave(v.id),
      ariaLabel: saved ? t('venue.action.unsaveAria', { name: v.name }) : t('venue.action.saveAria', { name: v.name }) },
    { id: 'share', label: t('venue.action.share'), icon: 'share', onClick: () => shareVenue(app, v, t), ariaLabel: t('venue.action.shareAria', { name: v.name }) },
  ];

  // The community loop stays one tap away at the bottom of the screen.
  const bar = (
    <div style={{
      padding: `${SPACE.sm}px ${GUTTER}px calc(var(--ra-tabs-pad) + 6px)`, background: C2.paper,
      borderTop: `1px solid ${C2.hair}`, flexShrink: 0,
    }}>
      <Button full size="lg" icon="edit" onClick={() => app.goto('review', v.id)}>
        {written > 0 ? t('venue.writeReview') : t('venue.writeFirst')}
      </Button>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <ScreenHeader headingRef={h} title={v.name}
        back={{ label: t('common.back'), onClick: () => app.goto(app.venueOrigin) }}
        subtitle={[kindLabel(t, v.kind), v.address ? t('venue.subtitleAddress', { address: v.address, area: v.area }) : v.area, t('common.minWalk', { mins: v.mins })].join(' · ')}/>

      <div style={{ padding: `${SPACE.md}px ${GUTTER}px ${SPACE.xl}px` }}>
        {/* today's temporary problems (F3) — prominent, but never a verdict */}
        <VenueReportsBanner app={app} venue={v}/>

        {/* SUMMARY — the verdict, why, from whom, how recently */}
        <section aria-label={t('venue.summary')} style={{ background: meta.bg, borderRadius: RADIUS.lg, padding: 20, marginBottom: SPACE.md }}>
          <V2Verdict kind={verdict.kind} big/>
          <p style={{ ...TYPE.body, fontSize: 16.5, color: C2.char, margin: '12px 0 0' }}>{verdictLead}</p>
          <SourceLine src={verdict.kind === 'unknown' ? 'none' : (v.ev?.length ? 'community' : 'osm')}
            text={sourceText} style={{ marginTop: 10, color: C2.char }}/>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.xs, marginTop: SPACE.sm }}>
            <FreshnessBadge date={v.lastConfirmed}/>
            <a href="/how-it-works" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 4px', color: C2.teal, ...TYPE.footnote, fontWeight: 700, textUnderlineOffset: 3 }}>
              {t('venue.howWeDecide')}
            </a>
            <ReadAloud text={readText} what={t('venue.read.what', { name: v.name })} variant="ghost"/>
          </div>
        </section>

        <ActionRow label={t('venue.actions', { name: v.name })} actions={actions} style={{ marginBottom: SPACE.lg }}/>

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
          <SectionHeader id="community-h" title={t('venue.community.title')} size="sm"
            description={written > 0 ? t('venue.community.count', { count: written }) : t('venue.community.none')}
            action={written > 0 ? { label: t('venue.community.readAll'), ariaLabel: t('venue.community.readAllAria', { count: written, name: v.name }), onClick: () => app.goto('reviews', v.id) } : null}/>
          {written > 0 && !loaded && !reviewsError && <Card variant="filled"><SkeletonText lines={3}/><span className="ra-sr-only" role="status">{t('venue.community.loading')}</span></Card>}
          {firstReview && (
            <Card variant="filled">
              <p style={{ ...TYPE.body, margin: '0 0 10px' }}>“{firstReview.own === false ? reviewText(t, firstReview) : <UserText>{firstReview.text}</UserText>}”</p>
              <p style={{ ...TYPE.caption, color: C2.slate, margin: 0 }}>{reviewWho(t, firstReview)} · {reviewWhen(fmt, firstReview)}</p>
            </Card>
          )}
          {written === 0 && (
            <Card variant="filled">
              <p style={{ ...TYPE.callout, margin: 0 }}>{t('venue.community.empty')}</p>
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
            {t('venue.shareSummary')}<span className="ra-sr-only"> {t('common.opensNewTab')}</span>
          </a>
        </p>
      </div>
    </V2Shell>
  );
}

export { V2VenueView };
