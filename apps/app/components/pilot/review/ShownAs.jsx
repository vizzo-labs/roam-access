'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { previewLine } from '../contrib/authorText';

// "Shown as: Alex K. · Lived experience · Wheelchair user [Change]" on every
// review step — what readers will see (the server's withAuthor() decides the
// same), so nobody has to remember what they chose in Me.
function ShownAs({ app, needs, ally = false, style }) {
  const t = useT();
  const who = ally ? `${previewLine(t, app.user?.pub, [])}` : previewLine(t, app.user?.pub, needs);
  return (
    <p style={{ ...TYPE.footnote, color: C2.slate, margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: SPACE.xs, ...style }}>
      <span>{t('steps.shownAs')} <strong style={{ color: C2.char }}>{who}</strong></span>
      <Button variant="plain" size="sm" onClick={() => app.goto('profile')} aria-label={t('steps.changeAria')} style={{ padding: '0 4px' }}>
        {t('steps.change')}
      </Button>
    </p>
  );
}

export { ShownAs };
