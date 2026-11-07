import type { T } from '@/lib/i18n/core';
import { fmtDay } from './types';

// Shown to the venue when the pilot team has hidden one of its posts.
export function HiddenNotice({ t, post, what }: { t: T; post: { hidden: boolean; hiddenAt: Date | null; hiddenNote: string | null } | null; what: 'statement' | 'reply' | 'notice' | 'photo' }) {
  if (!post?.hidden) return null;
  return (
    <div className="flash err" role="note" style={{ marginTop: '0.75rem', fontWeight: 400 }}>
      <strong>{post.hiddenAt ? t('business.hidden.on', { date: fmtDay(post.hiddenAt) }) : t('business.hidden.title')}</strong>{' '}
      {t(`business.hidden.${what}`)}
      {post.hiddenNote ? <> {t('business.hidden.reason', { reason: post.hiddenNote })}</> : null}
      {' '}{t(what === 'notice' || what === 'photo' ? 'business.hidden.contactShort' : 'business.hidden.contact')}
    </div>
  );
}
