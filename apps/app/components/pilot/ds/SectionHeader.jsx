'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button } from './Button';
import { SPACE, TYPE } from './tokens';

// SectionHeader — a real heading (h2 by default) so screen-reader users can
// jump between sections, with an optional short description and ONE action
// ("See all 12 reviews"). Give the action a full name, not just "See all".
// Use `id` + aria-labelledby on the <section> it heads.
function SectionHeader({ title, level = 2, id, overline, description, action, size = 'md', style }) {
  const H = `h${Math.min(6, Math.max(2, level))}`;
  const type = size === 'lg' ? TYPE.title2 : size === 'sm' ? { ...TYPE.headline, fontSize: 15.5 } : TYPE.title3;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACE.sm, marginBottom: SPACE.sm, ...style }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {overline && <p style={{ ...TYPE.overline, color: C2.slate, margin: '0 0 6px' }}>{overline}</p>}
        <H id={id} style={{ ...type, color: C2.char, margin: 0 }}>{title}</H>
        {description && <p style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0' }}>{description}</p>}
      </div>
      {action && (
        <Button variant="plain" size="sm" onClick={action.onClick} href={action.href}
          aria-label={action.ariaLabel} style={{ padding: '0 6px', flexShrink: 0 }}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { SectionHeader };
