'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Icon, TYPE } from '../ds';

// Source + confidence line under a verdict or a fact: who said it and how
// recently. Icon (decorative) + words — the words carry the meaning.
//   community → people · osm → question mark ("unconfirmed") · venue → flag (a claim)
const ICON = { community: 'users', osm: 'question', venue: 'flag' };

function SourceLine({ text, src = 'community', compact = false, as = 'p', style = {} }) {
  const Tag = as;
  const icon = ICON[src];
  return (
    <Tag style={{
      ...(compact ? TYPE.caption : TYPE.footnote), fontWeight: 500,
      display: 'flex', alignItems: 'flex-start', gap: 6, margin: 0, color: C2.slate,
      ...style,
    }}>
      {icon && <span style={{ flexShrink: 0, display: 'inline-flex', marginTop: 1 }}><Icon name={icon} size={compact ? 15 : 16}/></span>}
      <span>{text}</span>
    </Tag>
  );
}

export { SourceLine };
