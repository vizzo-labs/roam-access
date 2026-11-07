import type { getVenueDashboard } from '@/lib/data/business';
import type { T } from '@/lib/i18n/core';

export type Dash = NonNullable<Awaited<ReturnType<typeof getVenueDashboard>>>;
export type TabProps = { t: T; d: Dash; readOnly: boolean; since: Date | null };

export const TABS = ['overview', 'reviews', 'updates', 'photos', 'profile', 'cards'] as const;
export type Tab = typeof TABS[number];

/** "6 November 2026" (Sydney). */
export const fmtDay = (d: Date | string | null) => d
  ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' })
  : '';

export const tabHref = (venueId: string, tab: Tab, extra = '') => `/business/${encodeURIComponent(venueId)}?tab=${tab}${extra}`;
