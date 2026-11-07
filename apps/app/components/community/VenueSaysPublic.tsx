// Public summary (/v/[id]) · what the venue itself says (business portal v2):
// its live updates ("Venue says · 6 November 2026") and its photos ("From the
// venue"). Kept in its own section, after the community's facts, and never
// part of the verdict. Venue photos are public; review photos stay in the app.
import type { T } from '@/lib/i18n/core';
import type { NoticeVM, VenuePhotoVM } from '@/lib/data/owners';
import { auDate } from '@/lib/data/summary';

export function VenueSaysPublic({ t, name, notices, photos }: { t: T; name: string; notices: NoticeVM[]; photos: VenuePhotoVM[] }) {
  if (!notices.length && !photos.length) return null;
  return (
    <section aria-labelledby="pub-venue-says">
      <h2 id="pub-venue-says">{t('owner.notice.title', { name })}</h2>
      <p className="pub-muted">{t('owner.public.desc')}</p>
      {notices.length > 0 && (
        <ul className="pub-card" style={{ listStyle: 'none', margin: '0 0 16px', borderStyle: 'dashed' }}>
          {notices.map((n, i) => (
            <li key={n.id} style={{ padding: '8px 0', borderTop: i ? '1px solid #E5E2DA' : 0 }}>
              <strong>{t('owner.notice.badge', { date: auDate(new Date(n.at)) })}</strong>
              <p style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>{n.body}</p>
              {n.endsOn && <p className="pub-muted" style={{ margin: '2px 0 0' }}>{t('owner.notice.until', { date: auDate(new Date(n.endsOn)) })}</p>}
            </li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <>
          <h3>{t('owner.photo.title')}</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {photos.map(p => (
              <li key={p.id} style={{ width: 160 }}>
                <a href={p.src} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- served from the private store through a check */}
                  <img src={p.thumb} alt={p.alt} width={160} height={120} loading="lazy"
                    style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 12, display: 'block', border: '1.5px solid #8A8680' }}/>
                  <span className="ra-sr-only"> {t('common.opensNewTab')}</span>
                </a>
                <span className="pub-muted" style={{ fontSize: 14 }}>{t('owner.photo.kind', { kind: t(`photos.kind.${p.kind}`) })}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
