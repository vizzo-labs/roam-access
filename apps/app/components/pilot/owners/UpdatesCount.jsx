'use client';

import React from 'react';
import { C2, F2 } from '../ui/palette';
import { useT } from '../i18n';

// The unread count on "Saved" (tab bar and web header): new updates from
// saved places. The number is visual; screen readers hear "3 new updates".
// `sr={false}` draws only the number: put <UpdatesCountSr> after the label
// so it reads "Saved, 3 new updates".
function UpdatesCountSr({ count }) {
  const t = useT();
  if (!count) return null;
  return <span className="ra-sr-only">, {t('owner.updates.newSr', { count })}</span>;
}

function UpdatesCount({ count, style, sr = true }) {
  const t = useT();
  if (!count) return null;
  return (
    <>
      <span aria-hidden="true" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, padding: '0 6px',
        borderRadius: 999, background: C2.rust, color: C2.paper, fontFamily: F2, fontSize: 12.5, fontWeight: 800, lineHeight: 1,
        boxSizing: 'border-box', ...style,
      }}>{count > 9 ? '9+' : count}</span>
      {sr && <span className="ra-sr-only">{t('owner.updates.newSr', { count })}</span>}
    </>
  );
}

export { UpdatesCount, UpdatesCountSr };
