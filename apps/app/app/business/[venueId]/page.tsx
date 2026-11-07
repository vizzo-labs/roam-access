import { Suspense } from 'react';
import Link from 'next/link';
import { Portal, NotAllowed } from '@/components/portal/Portal';
import { Flash } from '@/components/portal/Flash';
import { getUserId, isAdmin } from '@/lib/auth';
import { managesVenue } from '@/lib/roles';
import { getVenueDashboard, getVenueRow } from '@/lib/data/business';
import { getCorrections, getSavesByNeed, listOwnNotices, listOwnPhotos, openReportsForVenue, touchOwnerVisit } from '@/lib/data/owners';
import { serverT } from '@/lib/i18n/server';
import { TABS, tabHref, type Tab } from '@/components/portal/dashboard/types';
import { Overview } from '@/components/portal/dashboard/Overview';
import { ReviewsTab } from '@/components/portal/dashboard/ReviewsTab';
import { UpdatesTab } from '@/components/portal/dashboard/UpdatesTab';
import { PhotosTab } from '@/components/portal/dashboard/PhotosTab';
import { ProfileTab } from '@/components/portal/dashboard/ProfileTab';
import { CardsTab } from '@/components/portal/dashboard/CardsTab';
import { TabFocus } from '@/components/portal/dashboard/TabFocus';

export const metadata = { title: 'Venue dashboard · Roam Access pilot' };

// Result codes from app/business/actions.ts → messages.
const OK = ['statement', 'statement-removed', 'reply', 'reply-removed', 'card', 'still-hidden', 'report', 'notice', 'notice-removed', 'photo', 'photo-removed', 'details', 'details-removed'];
const ERR = ['save', 'not-yours', 'notice-empty', 'notice-date', 'notice-limit', 'photo-alt', 'photo-limit', 'report-reason', 'report-note', 'report-review', 'phone', 'website'];

export default function VenueDashboardPage({ params, searchParams }: PageProps<'/business/[venueId]'>) {
  const t = serverT();
  return (
    <Portal area="for businesses" current="business">
      <Suspense fallback={<p role="status">{t('business.loading')}</p>}>
        <Inner params={params} searchParams={searchParams}/>
      </Suspense>
    </Portal>
  );
}

async function Inner({ params, searchParams }: Pick<PageProps<'/business/[venueId]'>, 'params' | 'searchParams'>) {
  const t = serverT();
  const [{ venueId }, sp, userId] = await Promise.all([params, searchParams, getUserId()]);
  const manages = await managesVenue(userId, venueId);
  if (!manages && !(await isAdmin())) {
    return <NotAllowed title={t('business.notYours.title')}>{t('business.notYours.body')} <Link href="/business">{t('business.notYours.claim')}</Link></NotAllowed>;
  }
  const tab: Tab = TABS.find(x => x === sp.tab) ?? 'overview';
  const [d, saves, since, notices, photos, corrections, reports, row] = await Promise.all([
    getVenueDashboard(venueId),
    getSavesByNeed(venueId),
    manages && userId ? touchOwnerVisit(userId, venueId) : Promise.resolve(null),
    listOwnNotices(venueId),
    listOwnPhotos(venueId),
    getCorrections(venueId),
    openReportsForVenue(venueId),
    getVenueRow(venueId),
  ]);
  if (!d || !row) return <NotAllowed title={t('business.notFound.title')}>{t('business.notFound.body')}</NotAllowed>;
  const readOnly = !manages; // admins can look, not post as the venue
  const ok = typeof sp.ok === 'string' && OK.includes(sp.ok) ? t(`business.ok.${sp.ok}`) : null;
  const err = typeof sp.err === 'string' ? t(`business.err.${ERR.includes(sp.err) ? sp.err : 'save'}`) : null;
  const props = { t, d, readOnly, since };
  const live = notices.filter(n => n.status === 'live').length;
  const counts: Partial<Record<Tab, number>> = { reviews: d.reviews.length, updates: live, photos: photos.length, cards: d.cards.filter(c => c.status === 'sent').length };
  const osm = { phone: row.phone, website: row.website, hours: row.osmTags?.opening_hours ?? null };
  const hidden = d.hiddenCount + notices.filter(n => n.status === 'hidden').length + photos.filter(p => p.hidden).length;

  return (
    <>
      {ok && <Flash>{ok}</Flash>}
      {err && <Flash kind="err">{err}</Flash>}
      <p className="pt-eyebrow">{t('business.eyebrow')}</p>
      <h1>{d.venue.name}<span className="dot">.</span></h1>
      <p className="lead">{d.venue.kind} · {[d.venue.address, d.venue.suburb].filter(Boolean).join(', ')}</p>
      {hidden > 0 && <p className="flash err" role="note">{t('business.hiddenCount', { count: hidden })}</p>}
      {readOnly && <p className="flash err" role="note">{t('business.adminView')}</p>}
      <p className="small">
        <a href={`/v/${encodeURIComponent(d.venue.id)}`}>{t('business.publicPage')}</a>
        {' · '}<a href={`/#/venue/${encodeURIComponent(d.venue.id)}`}>{t('business.appPage')}</a>
      </p>

      <nav aria-label={t('business.tabs.label')} className="pt-tabs">
        <ul>
          {TABS.map(x => (
            <li key={x}>
              <a href={tabHref(d.venue.id, x)} aria-current={x === tab ? 'page' : undefined}>
                {t(`business.tab.${x}`)}
                {counts[x] ? <span className="pt-count"><span aria-hidden="true">{counts[x]}</span><span className="pt-sr"> ({t(`business.tabCount.${x}`, { count: counts[x] })})</span></span> : null}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* On a tab change (not after a form post), focus moves to the tab's heading. */}
      {!ok && !err && sp.tab ? <TabFocus/> : null}

      <section aria-labelledby="tab-h">
        {tab === 'overview' && <Overview {...props} saves={saves}/>}
        {tab === 'reviews' && <ReviewsTab {...props} reports={reports}/>}
        {tab === 'updates' && <UpdatesTab {...props} notices={notices}/>}
        {tab === 'photos' && <PhotosTab {...props} photos={photos}/>}
        {tab === 'profile' && <ProfileTab {...props} corrections={corrections} osm={osm}/>}
        {tab === 'cards' && <CardsTab {...props}/>}
      </section>

      <div className="pt-card dashed" style={{ marginTop: '2.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>{t('business.promise.title')}</h2>
        <p style={{ margin: 0 }}>{t('business.promise.body')}</p>
      </div>
    </>
  );
}
