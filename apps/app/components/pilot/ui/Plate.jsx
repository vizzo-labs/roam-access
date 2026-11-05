'use client';

import React from 'react';
import { C2, M2 } from './palette';
import { useT } from '../i18n/I18nProvider';

// Placeholder photo plate.
function V2Plate({ h = 150, label, style = {} }) {
  const t = useT();
  return (
    <div aria-hidden="true" style={{
      height: h, borderRadius: 18,
      background: `repeating-linear-gradient(135deg, ${C2.hair} 0 1px, transparent 1px 12px), ${C2.stone}`,
      display: 'flex', alignItems: 'flex-end', padding: 12,
      fontFamily: M2, fontSize: 11, color: C2.slate, textTransform: 'uppercase', letterSpacing: '0.08em',
      boxSizing: 'border-box', ...style,
    }}>{label || t('app.photoPlaceholder')}</div>
  );
}

export { V2Plate };
