'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button, Sheet, SPACE, TYPE } from '../ds';
import { useT } from '../i18n';
import { isLegacy } from './authorText';

// One-time prompt for accounts from before reviews showed names (Brief L).
// Their reviews were written under "never by your name", so nothing changes
// unless they choose: "Choose how I appear" opens the settings; "Keep my
// reviews as they are", Escape or the close button just remember the answer.
function NamePrompt({ app }) {
  const t = useT();
  const u = app.user;
  const [open, setOpen] = React.useState(() => !!u?.done && isLegacy(u.pub) && !u.pub?.prompted);
  if (!open) return null;
  const close = () => { setOpen(false); app.markPrompted(); };
  return (
    <Sheet open={open} onClose={close} title={t('contrib.prompt.title')}
      footer={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
          <Button full size="lg" onClick={() => { close(); app.goto('profile'); }}>{t('contrib.prompt.choose')}</Button>
          <Button full size="lg" variant="ghost" onClick={close}>{t('contrib.prompt.keep')}</Button>
        </div>
      )}>
      <p style={{ ...TYPE.body, color: C2.char, margin: 0 }}>{t('contrib.prompt.body')}</p>
    </Sheet>
  );
}

export { NamePrompt };
