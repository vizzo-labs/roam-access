'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, Card, SPACE, SkeletonText, SourceBadge, TYPE } from '../ds';
import { UserText, useFormat, useT } from '../i18n';
import { reviewText, reviewWhen } from '../trust/text';
import { ReviewAuthor } from '../contrib/ReviewAuthor';
import { HelpedButton } from '../contrib/HelpedButton';
import { useVenueReviews } from '../screens/useVenueReviews';

// "Reviews (n)": the newest review — quote, who wrote it (the server decides
// what may show), when, "This helped me" — then "Read all n reviews".
// Allies' observations are labelled and never count toward a verdict.
function PlaceReviews({ app, venue: v }) {
  const t = useT();
  const fmt = useFormat();
  const { reviews, error } = useVenueReviews(app, v.id);
  const written = v.verified + (v.observations || 0);
  const r = reviews && reviews[0];
  return (
    <section aria-labelledby="rev-h" style={{ marginTop: SPACE.lg }}>
      <h2 id="rev-h" style={{ ...TYPE.title3, fontSize: 20, margin: `0 0 ${SPACE.xs}px`, color: C2.char }}>{t('place.reviews.title', { count: written })}</h2>
      {written === 0 && <p style={{ ...TYPE.callout, color: C2.char, margin: 0 }}>{t('place.reviews.none')}</p>}
      {written > 0 && !reviews && !error && (
        <Card variant="filled"><SkeletonText lines={3}/><span className="ra-sr-only" role="status">{t('venue.community.loading')}</span></Card>
      )}
      {r && (
        <Card variant="filled">
          <p style={{ ...TYPE.body, margin: `0 0 ${SPACE.xs}px` }}>“{r.own === false ? reviewText(t, r) : <UserText>{r.text}</UserText>}”</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 10px' }}>
            <ReviewAuthor r={r}/>
            {!r.v && <SourceBadge source="ally"/>}
            <span style={{ ...TYPE.footnote, color: C2.slate }}>{reviewWhen(fmt, r)}</span>
            <span style={{ marginLeft: 'auto' }}><HelpedButton r={r} app={app}/></span>
          </div>
        </Card>
      )}
      {written > 0 && (
        <Button full variant="secondary" onClick={() => app.goto('reviews', v.id)} style={{ marginTop: SPACE.sm }}>
          {t('place.reviews.readAll', { count: written })}
        </Button>
      )}
    </section>
  );
}

export { PlaceReviews };
