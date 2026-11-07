'use client';

import React from 'react';
import { useV2Heading } from '../ui/useHeading';
import { ReviewSteps } from '../review/ReviewSteps';
import { AllyReview } from '../review/AllyReview';

// ─────────────────────────────────────────────────────────────
// REVIEW — adapts to who is writing (Me → How I appear on reviews):
// lived experience / prefer not to say / never chosen → three steps;
// carer → the same steps about the person they were with;
// ally → "What did you notice?" (no verdict; an observation only).
// ─────────────────────────────────────────────────────────────
function V2ReviewView({ app }) {
  const v = app.venueById(app.selectedId);
  const h = useV2Heading('review-' + v.id);
  const rel = app.user?.pub?.relationship;
  if (rel === 'ally') return <AllyReview key={v.id} app={app} venue={v} headingRef={h}/>;
  return <ReviewSteps key={v.id} app={app} venue={v} carer={rel === 'carer'} headingRef={h}/>;
}

export { V2ReviewView };
