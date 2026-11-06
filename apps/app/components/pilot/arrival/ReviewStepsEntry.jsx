'use client';
// Getting there 4 (I4) · the review form's optional way into the step-by-step
// arrival (./ArrivalSteps.jsx). One block at the end of the form: it opens
// the same "How I got into …" sheet the venue page uses. Never required —
// the review sends without it — and saving the steps is separate from the
// review (they save straight away), so the form says so.

import React from 'react';
import { C2 } from '../ui/palette';
import { Banner, Button, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { StepsSheet } from './ArrivalSteps';

export function ReviewStepsEntry({ venue }) {
  const t = useT();
  const [mine, setMine] = React.useState(null); // your existing set, if any
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(null); // null | 'added' | 'updated'

  // Whether you've already added steps here: the button then says "Change".
  React.useEffect(() => {
    let live = true;
    fetch(`/api/arrival?venue=${encodeURIComponent(venue.id)}`)
      .then(r => (r.ok ? r.json() : { steps: [] }))
      .then(d => { if (live) setMine((d.steps || []).find(s => s.mine) || null); }, () => {});
    return () => { live = false; };
  }, [venue.id]);

  return (
    <section aria-labelledby="rev-steps-h" style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${C2.hair}` }}>
      <h2 id="rev-steps-h" style={{ ...TYPE.headline, fontSize: 17, margin: '0 0 4px', color: C2.char }}>
        {t('nearby.review.title')} <span style={{ fontWeight: 500, color: C2.slate }}>{t('common.optional')}</span>
      </h2>
      <p style={{ ...TYPE.callout, color: C2.slate, margin: `0 0 ${SPACE.sm}px` }}>{t('nearby.review.hint')}</p>
      {saved && (
        <Banner tone="success" live="polite" style={{ marginBottom: SPACE.sm }}>
          {saved === 'updated' ? t('nearby.review.savedUpdated') : t('nearby.review.saved')}
        </Banner>
      )}
      <Button variant="outline" size="sm" icon={mine ? 'edit' : 'plus'} full onClick={() => setOpen(true)}>
        {mine ? t('nearby.steps.edit') : t('nearby.review.add')}
      </Button>
      {open && (
        <StepsSheet venue={venue} initial={mine} onClose={() => setOpen(false)}
          onSaved={(steps, replaced) => {
            setMine((steps || []).find(s => s.mine) || null);
            setSaved(replaced ? 'updated' : 'added');
            setOpen(false);
          }}/>
      )}
    </section>
  );
}
