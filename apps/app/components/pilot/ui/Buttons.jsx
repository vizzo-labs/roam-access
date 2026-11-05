'use client';

// Legacy button names, now thin wrappers over the design system (ds/Button,
// ds/IconButton) so every screen shares one implementation: same sizes,
// hover/pressed states and focus. New code: import Button / IconButton from '../ds'.

import React from 'react';
import { Button } from '../ds/Button';
import { IconButton } from '../ds/IconButton';

const KIND = { primary: 'primary', rust: 'rust', outline: 'outline', ghost: 'ghost' };

function V2BigBtn({ children, kind = 'primary', onClick, style = {}, disabled = false, type = 'button', ariaLabel, ariaDescribedBy }) {
  return (
    <Button full size="lg" variant={KIND[kind] || 'primary'} onClick={onClick} disabled={disabled} type={type}
      aria-label={ariaLabel} aria-describedby={ariaDescribedBy} style={style}>
      {children}
    </Button>
  );
}

// Round icon button (back, save) — 48px circle. `children` is the icon.
function V2RoundBtn({ children, onClick, ariaLabel, pressed, style = {} }) {
  return (
    <IconButton icon={null} label={ariaLabel} pressed={pressed} onClick={onClick} style={style}>
      {children}
    </IconButton>
  );
}

function V2Back({ app, to = 'home', id = null, label = 'Back' }) {
  return <IconButton icon="back" label={label} onClick={() => app.goto(to, id)}/>;
}

export { V2BigBtn, V2RoundBtn, V2Back };
