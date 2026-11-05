'use client';

import React from 'react';
import { C2 } from '../ui/palette';
import { Button } from './Button';
import { Icon } from './Icon';
import { RADIUS, SPACE, TYPE } from './tokens';

// EmptyState — nothing to show, and ONE clear next step. Never a dead end:
// always pass an `action` (e.g. "Remove filters", "Explore places").
//   <EmptyState icon="bookmark" title="Nothing saved yet"
//     body="Save places that work for you and find them here."
//     action={{ label: 'Explore places', onClick }}/>
function EmptyState({ icon = 'search', title, body, action, secondary, headingLevel = 2, compact = false, style }) {
  const H = `h${headingLevel}`;
  return (
    <div style={{
      textAlign: 'center', padding: compact ? `${SPACE.lg}px ${SPACE.md}px` : `${SPACE.xxl}px ${SPACE.lg}px`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', ...style,
    }}>
      <span aria-hidden="true" style={{
        width: compact ? 52 : 64, height: compact ? 52 : 64, borderRadius: RADIUS.pill, background: C2.tealSoft, color: C2.teal,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.md,
      }}><Icon name={icon} size={compact ? 24 : 28}/></span>
      <H style={{ ...TYPE.title3, fontSize: compact ? 17 : 19, color: C2.char, margin: '0 0 6px' }}>{title}</H>
      {body && <p style={{ ...TYPE.callout, color: C2.slate, margin: 0, maxWidth: 340 }}>{body}</p>}
      {(action || secondary) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs, marginTop: SPACE.lg, width: '100%', maxWidth: 300 }}>
          {action && <Button full icon={action.icon} onClick={action.onClick} href={action.href}>{action.label}</Button>}
          {secondary && <Button full variant="plain" size="sm" onClick={secondary.onClick} href={secondary.href}>{secondary.label}</Button>}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
