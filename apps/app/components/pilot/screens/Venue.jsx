'use client';

import React from 'react';
import { V2Shell } from '../ui/Shell';
import { C2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2Verdict } from '@/lib/pilot/match';
import { verdictSourceT } from '@/lib/trust/labels';
import { kindLabel, verdictLabel } from '@/lib/i18n/data';
import { ReadAloud, useFormat, useT } from '../i18n';
import { factText } from '../trust/text';
import { StillRight } from '../trust/StillRight';
import { useVenueSays } from './VenueSays';
import { useTrackVenueView } from '../track';
import { useDirections } from '../arrival/directions';
import { EntranceCard } from '../arrival/EntranceCard';
import { KeyFacts } from '../venue/KeyFacts';
import { TodayBlock } from '../venue/TodayBlock';
import { PlaceReviews } from '../venue/PlaceReviews';
import { VenueMore } from '../venue/VenueMore';
import { ActionRow, Button, GUTTER, SPACE, ScreenHeader, TYPE, VerdictCard } from '../ds';

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
// PLACE — the answer first: the verdict and why (with the date), five
// actions, Today (temporary problems + "Report a problem today"), For your
// needs, Getting there, Reviews, then "More about this place" folded away.
// One main action at the bottom: "Tell us how it was".
// ─────────────────────────────────────────────────────────────
function V2VenueView({ app }) {
  const t = useT();
  const fmt = useFormat();
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('venue-' + v.id);
  const needs = app.user?.needs || [];
  const verdict = ra2Verdict(v, needs);
  const saved = app.world.saved.includes(v.id);

  React.useEffect(() => { app.markVisited(v.id); }, [v.id]); // eslint-disable-line
  useTrackVenueView(v.id);
  const says = useVenueSays(v.id);
  // Directions go to the step-free entrance when someone marked one (I1).
  const dir = useDirections(v, needs);

  // "3 community reviews and 2 quick answers"
  const quick = v.quick || 0;
  const revPart = t('venue.from.reviews', { count: v.verified });
  const quickPart = t('venue.from.quick', { count: quick });
  const from = v.verified && quick ? t('venue.from.both', { reviews: revPart, quick: quickPart }) : quick ? quickPart : revPart;
  const community = v.verified > 0 || quick > 0;
  const sentence = t(`place.verdict.${verdict.kind}`);
  const source = verdict.kind === 'unknown' && !community ? null
    : community
      ? (v.lastConfirmed ? t('place.source.community', { from, date: fmt.date(v.lastConfirmed) }) : t('place.source.communityNoDate', { from }))
      : t('place.source.osm');

  // Read aloud: the place, its verdict, the sentence, the source, the facts.
  const readText = () => {
    const list = fs => fmt.list(fs.slice(0, 3).map(f => factText(t, f)));
    return [
      t('venue.read.place', { name: v.name }),
      t('venue.read.verdict', { verdict: verdictLabel(t, verdict.kind) }),
      sentence,
      source || verdictSourceT(t, fmt, v, verdict, needs) + '.',
      verdict.barriers.length ? t('venue.read.barriers', { list: list(verdict.barriers) }) : '',
      verdict.works.length ? t('venue.read.works', { list: list(verdict.works) }) : '',
      verdict.checks.length ? t('venue.read.checks', { list: list(verdict.checks) }) : '',
    ].filter(Boolean).join(' ');
  };

  // The venue's own phone / website when it gave one ("Venue says"); the
  // OpenStreetMap ones stay listed under More → Place details.
  const phone = says?.corrections?.phone || v.phone;
  const website = says?.corrections?.website || v.website;
  const actions = [
    { id: 'dir', label: t('venue.action.directions'), icon: 'directions', primary: true, external: true,
      href: dir.href, ariaLabel: dir.ariaLabel },
    { id: 'save', label: saved ? t('venue.action.saved') : t('venue.action.save'), icon: 'bookmark', pressed: saved, onClick: () => app.toggleSave(v.id),
      ariaLabel: saved ? t('venue.action.unsaveAria', { name: v.name }) : t('venue.action.saveAria', { name: v.name }) },
    phone && { id: 'call', label: t('venue.action.call'), icon: 'phone', href: 'tel:' + phone.replace(/[^+\d]/g, ''), ariaLabel: t('venue.action.callAria', { name: v.name }) },
    website && { id: 'web', label: t('venue.action.website'), icon: 'globe', href: website, external: true, ariaLabel: t('venue.action.websiteAria', { name: v.name }) },
    { id: 'share', label: t('venue.action.share'), icon: 'share', onClick: () => shareVenue(app, v, t), ariaLabel: t('venue.action.shareAria', { name: v.name }) },
  ];

  // The one main action, always at the bottom.
  const bar = (
    <div style={{
      padding: `${SPACE.sm}px ${GUTTER}px calc(var(--ra-tabs-pad) + 6px)`, background: C2.paper,
      borderTop: `1px solid ${C2.hair}`, flexShrink: 0,
    }}>
      <Button full size="lg" icon="edit" onClick={() => app.goto('review', v.id)} aria-label={t('place.tellUsAria', { name: v.name })}>
        {t('place.tellUs')}
      </Button>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <ScreenHeader headingRef={h} title={v.name}
        back={{ label: t('common.back'), onClick: () => app.goto(app.venueOrigin) }}
        subtitle={[kindLabel(t, v.kind), v.address ? t('venue.subtitleAddress', { address: v.address, area: v.area }) : v.area, t('common.minWalk', { mins: v.mins })].join(' · ')}/>

      <div style={{ padding: `${SPACE.sm}px ${GUTTER}px ${SPACE.xl}px` }}>
        <VerdictCard kind={verdict.kind} heading={t('place.verdict.h')} sentence={sentence} source={source}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.xs, marginTop: SPACE.xs }}>
            <ReadAloud text={readText} what={t('venue.read.what', { name: v.name })} variant="outline"/>
            <a href="/how-it-works" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 6px', color: C2.teal, ...TYPE.callout, fontWeight: 700, textUnderlineOffset: 3 }}>
              {t('place.howWeDecide')}
            </a>
          </div>
          <StillRight key={'still-' + v.id} app={app} venue={v}/>
        </VerdictCard>

        <ActionRow label={t('venue.actions', { name: v.name })} actions={actions} style={{ marginTop: SPACE.sm }}/>
        {dir.toEntrance && (
          <p style={{ ...TYPE.footnote, color: C2.char, margin: `${SPACE.xs}px 0 0`, textAlign: 'center' }}>
            {t('arrival.dir.caption', { where: t(`arrival.kind.${dir.entrance.kind}.short`), app: dir.appName })}
          </p>
        )}

        <TodayBlock app={app} venue={v}/>
        <KeyFacts app={app} venue={v}/>
        <EntranceCard app={app} venue={v}/>
        <PlaceReviews app={app} venue={v}/>
        <VenueMore app={app} venue={v} says={says}/>
      </div>
    </V2Shell>
  );
}

export { V2VenueView };
