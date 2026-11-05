'use client';

import React from 'react';
import { useT } from '../i18n/I18nProvider';
import { C2 } from '../ui/palette';
import { IconButton } from './IconButton';
import { GUTTER, SPACE, TYPE } from './tokens';

// ScreenHeader — the same top of every app screen: an optional Back button
// (always top-left, always 48px, always named "Back to …"), optional actions
// top-right (IconButtons), then the screen's ONE <h1>.
// Pass the heading ref from useV2Heading so focus lands on the title after
// navigation. `compact` puts a short title on the same row as Back.
//   <ScreenHeader back={{ label: 'Back to results', onClick }} headingRef={h}
//     title="Hugos" subtitle="Restaurant · Manly · 1 min walk" actions={<IconButton …/>}/>
function ScreenHeader({
  back, title, headingRef, subtitle, overline, actions, compact = false,
  size = 'title1', dot = true, padX = GUTTER, style, children,
}) {
  const t = useT();
  const h1 = (
    <h1 ref={headingRef} tabIndex={-1} style={{
      ...(compact ? TYPE.title3 : TYPE[size] || TYPE.title1), color: C2.char, margin: 0,
      minWidth: 0, overflowWrap: 'anywhere',
    }}>
      {title}{dot && !compact && <span aria-hidden="true" style={{ color: C2.rust }}>.</span>}
    </h1>
  );
  const hasRow = back || actions || compact;
  return (
    <div style={{ padding: `${hasRow ? 10 : SPACE.md}px ${padX}px 0`, ...style }}>
      {hasRow && (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm, minHeight: 48 }}>
          {back && <IconButton icon="back" label={back.label || t('common.back')} onClick={back.onClick} href={back.href}/>}
          {compact ? <div style={{ flex: 1, minWidth: 0 }}>{h1}</div> : <div style={{ flex: 1 }}/>}
          {actions && <div style={{ display: 'flex', gap: SPACE.xs, flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      {!compact && (
        <div style={{ marginTop: hasRow ? SPACE.md : 0 }}>
          {overline && <p style={{ ...TYPE.overline, color: C2.slate, margin: '0 0 8px' }}>{overline}</p>}
          {h1}
          {subtitle && <p style={{ ...TYPE.callout, color: C2.slate, margin: '6px 0 0' }}>{subtitle}</p>}
        </div>
      )}
      {compact && subtitle && <p style={{ ...TYPE.footnote, color: C2.slate, margin: '4px 0 0 60px' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export { ScreenHeader };
