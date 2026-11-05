'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2, F2 } from '../ui/palette';
import { Button } from './Button';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { RADIUS, SPACE, tone as toneOf } from './tokens';

const ICON = { info: 'info', success: 'success', warn: 'warn', danger: 'error', neutral: 'info', teal: 'sparkle', offline: 'offline' };

// Banner — an inline message in the page flow (offline, an error, a tip, a
// note like "You're outside the pilot area"). Always icon + words.
// `live`: 'polite' (role=status) when it appears after something happened,
// 'assertive' (role=alert) only for errors that block the task, false for
// static notes present on page load.
function Banner({ tone = 'info', title, children, icon, action, onDismiss, dismissLabel, live = false, style }) {
  const tr = useT();
  const t = toneOf(tone === 'offline' ? 'neutral' : tone);
  const role = live === 'assertive' ? 'alert' : live ? 'status' : undefined;
  return (
    <div role={role} style={{
      display: 'flex', gap: SPACE.sm, alignItems: 'flex-start', boxSizing: 'border-box',
      background: t.bg, color: C2.char, borderRadius: RADIUS.md,
      borderLeft: `4px solid ${t.edge === C2.line ? C2.char : t.edge}`,
      padding: `${SPACE.sm}px ${onDismiss ? SPACE.xs : SPACE.md}px ${SPACE.sm}px ${SPACE.md - 2}px`,
      fontFamily: F2, ...style,
    }}>
      <span style={{ color: t.fg, paddingTop: 1 }}><Icon name={icon || ICON[tone] || 'info'} size={22}/></span>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        {title && <p style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: t.fg }}>{title}</p>}
        {children && <div style={{ margin: title ? '2px 0 0' : 0, fontSize: 15, lineHeight: 1.45, color: C2.char }}>{children}</div>}
        {action && (
          <Button variant="plain" size="sm" onClick={action.onClick} href={action.href} external={action.external}
            style={{ padding: 0, minHeight: 44, justifyContent: 'flex-start' }}>{action.label}</Button>
        )}
      </div>
      {onDismiss && <IconButton icon="close" label={dismissLabel || tr('ds.dismiss')} variant="ghost" size="sm" onClick={onDismiss} style={{ marginTop: -8, marginBottom: -8 }}/>}
    </div>
  );
}

export { Banner };
