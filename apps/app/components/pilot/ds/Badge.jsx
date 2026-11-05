'use client';

import React from 'react';
import { F2 } from '../ui/palette';
import { Icon } from './Icon';
import { RADIUS, tone as toneOf } from './tokens';
import { formatDate, plural, timeAgo } from './format';

const TONE_ICON = { info: 'info', success: 'success', warn: 'warn', danger: 'error', teal: null, neutral: null };

// Badge — a small, non-interactive status label. Coloured badges carry an
// icon by default (pass icon={null} only when the words alone are clear).
function Badge({ children, tone = 'neutral', icon, size = 'md', style, ...rest }) {
  const t = toneOf(tone);
  const ic = icon === undefined ? TONE_ICON[tone] : icon;
  const sm = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: sm ? 4 : 6, flexShrink: 0,
      padding: sm ? '3px 8px' : '5px 10px', borderRadius: RADIUS.pill,
      background: t.bg, color: t.fg, fontFamily: F2, fontWeight: 700,
      fontSize: sm ? 13 : 13.5, lineHeight: 1.2, whiteSpace: 'nowrap', ...style,
    }} {...rest}>
      {ic && <Icon name={ic} size={sm ? 14 : 16} strokeWidth={2.2}/>}
      {children}
    </span>
  );
}

// SourceBadge — WHERE a fact comes from. Presentation only: it never changes
// a verdict. Honesty rules (AGENTS.md): only `community` can back "Works for
// you"; `osm` is always "unconfirmed"; `venue` claims are labelled as claims.
//   <SourceBadge source="community" count={3} date={lastReviewAt}/>
//   <SourceBadge source="osm"/>   <SourceBadge source="venue"/>
const SOURCES = {
  community: { tone: 'teal',    icon: 'users',    label: ({ count }) => (typeof count === 'number' ? `From ${plural(count, 'review')}` : 'Community reviews') },
  osm:       { tone: 'warn',    icon: 'question', label: () => 'OpenStreetMap · unconfirmed' },
  venue:     { tone: 'neutral', icon: 'flag',     label: () => 'Venue says' },
  partner:   { tone: 'info',    icon: 'success',  label: ({ name }) => (name ? `${name} member` : 'Partner programme') },
  photo:     { tone: 'teal',    icon: 'camera',   label: ({ count }) => (typeof count === 'number' ? plural(count, 'photo') : 'Photo') },
};

function SourceBadge({ source = 'community', count, name, date, size = 'sm', children, style }) {
  const s = SOURCES[source] || SOURCES.community;
  const when = date ? ` · ${timeAgo(date)}` : '';
  return (
    <Badge tone={s.tone} icon={s.icon} size={size} style={style}>
      {children || s.label({ count, name })}
      {date && <><span aria-hidden="true">{when}</span><span className="ra-sr-only">, {formatDate(date)}</span></>}
    </Badge>
  );
}

// "Last confirmed 3 weeks ago" with the exact date for screen readers.
function Freshness({ date, prefix = 'Last confirmed', tone = 'neutral', size = 'sm' }) {
  if (!date) return <Badge tone="neutral" icon="clock" size={size}>Not confirmed yet</Badge>;
  return (
    <Badge tone={tone} icon="clock" size={size}>
      <span aria-hidden="true">{prefix} {timeAgo(date)}</span>
      <span className="ra-sr-only">{prefix} {formatDate(date)}</span>
    </Badge>
  );
}

export { Badge, SourceBadge, Freshness, SOURCES };
