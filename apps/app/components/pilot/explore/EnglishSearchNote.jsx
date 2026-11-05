'use client';
// Search and voice search understand English words for now (the parser in
// lib/pilot/match.js). In other languages, say so once, plainly.

import React from 'react';
import { C2 } from '../ui/palette';
import { TYPE } from '../ds';
import { useLocale } from '../i18n';

function EnglishSearchNote({ onColor = false, style }) {
  const { locale, t } = useLocale();
  if (locale === 'en-AU') return null;
  return (
    <p style={{ ...TYPE.footnote, color: onColor ? 'rgba(250,249,246,0.85)' : C2.slate, margin: '6px 0 0', ...style }}>
      {t('explore.englishOnly')}
    </p>
  );
}

export { EnglishSearchNote };
