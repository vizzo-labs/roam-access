import type { VenuePhoto } from '@/lib/db/schema-owners';
import { MAX_VENUE_PHOTOS, VENUE_PHOTO_KINDS } from '@/lib/data/owners';
import { ALT_MAX, ALT_MIN } from '@/lib/photos/kinds';
import { removePhotoAction } from '@/app/business/actions';
import { PhotoUpload } from './PhotoUpload';
import { HiddenNotice } from './HiddenNotice';
import { fmtDay, type TabProps } from './types';

type Extra = { photos: VenuePhoto[] };

// Photos from the venue: up to 10, each with a required description (the
// alt text). Public, labelled "From the venue", always after the
// community's photos and never the cover photo.
export function PhotosTab({ t, d, readOnly, photos }: TabProps & Extra) {
  const left = MAX_VENUE_PHOTOS - photos.length;
  const kinds = VENUE_PHOTO_KINDS.map(k => ({ id: k, label: t(`photos.kind.${k}`) }));
  return (
    <>
      <h2 id="tab-h" tabIndex={-1}>{t('business.tab.photosCount', { count: photos.length, max: MAX_VENUE_PHOTOS })}</h2>
      <p className="muted">{t('business.photos.intro')}</p>
      {!readOnly && (left > 0 ? (
        <PhotoUpload venueId={d.venue.id} kinds={kinds} altMin={ALT_MIN} altMax={ALT_MAX} labels={{
          title: t('business.photos.addTitle'), file: t('business.photos.file'), fileHint: t('business.photos.fileHint'),
          kind: t('business.photos.kind'), alt: t('business.photos.alt'), altHint: t('business.photos.altHint', { min: ALT_MIN }),
          altPlaceholder: t('business.photos.altPlaceholder'), upload: t('business.photos.upload'), uploading: t('business.photos.uploading'),
          left: t('business.photos.left', { count: left }), done: t('business.photos.done'),
          errAlt: t('business.err.photo-alt'), errFile: t('business.photos.errFile'), errUpload: t('business.photos.errUpload'),
          errLimit: t('business.err.photo-limit'),
        }}/>
      ) : <p className="flash err" role="note" style={{ fontWeight: 400 }}>{t('business.err.photo-limit')}</p>)}

      <h3>{t('business.photos.yours')}</h3>
      {photos.length ? (
        <ul className="pt-photos">
          {photos.map(p => (
            <li key={p.id} className="pt-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- served from the private store through a check */}
              <img src={`/api/venue-photos/${p.id}?size=thumb`} alt={p.alt} width={240} height={180}/>
              <p style={{ margin: '0.5rem 0 0.2rem' }}><strong>{t(`photos.kind.${p.kind}`)}</strong>{p.hidden ? <> · <span className="pill barrier"><i aria-hidden="true">✗</i>{t('business.photos.hiddenPill')}</span></> : null}</p>
              <p className="small" style={{ margin: 0 }}>{p.alt}</p>
              <p className="muted small" style={{ margin: '0.2rem 0 0' }}>{t('business.photos.added', { date: fmtDay(p.createdAt) })}</p>
              <HiddenNotice t={t} post={p} what="photo"/>
              {!readOnly && (
                <form action={removePhotoAction}>
                  <input type="hidden" name="venueId" value={d.venue.id}/>
                  <input type="hidden" name="id" value={p.id}/>
                  <div className="btn-row"><button className="btn ghost" type="submit">{t('business.photos.remove')}<span className="pt-sr">: {p.alt}</span></button></div>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="muted">{t('business.photos.none')}</p>}
    </>
  );
}
