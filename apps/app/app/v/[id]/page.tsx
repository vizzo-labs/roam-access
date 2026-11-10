import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/community/PublicShell';
import { FactList, NeedList } from '@/components/community/Summary';
import { auDate, basisLine, getVenueSummary } from '@/lib/data/summary';
import { getBestEntrances } from '@/lib/data/entrances';
import { GettingTherePublic } from '@/components/community/GettingThere';
import { NearbyPublic } from '@/components/community/NearbyPublic';
import { getNearbyListings } from '@/lib/data/arrival-nearby';
import { serverT } from '@/lib/i18n/server';
import { VenueSaysPublic } from '@/components/community/VenueSaysPublic';
import { getLiveNotices, getPublicVenuePhotos } from '@/lib/data/owners';

// Public, read-only access summary of one place. No login, no personal data.
export async function generateMetadata({ params }: PageProps<'/v/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const s = await getVenueSummary(id);
  const title = s ? `${s.venue.name}: access summary · Roam Access` : 'Place not found · Roam Access';
  return {
    title,
    robots: { index: false, follow: false },
    // The link preview when someone shares this page (chat apps, email).
    openGraph: s ? { title, description: basisLine(s), url: `/v/${encodeURIComponent(s.venue.id)}`, siteName: 'Roam Access', locale: 'en_AU', type: 'website' } : undefined,
  };
}

export default function Page({ params }: PageProps<'/v/[id]'>) {
  return (
    <PublicShell>
      <Suspense fallback={<p role="status">Loading the summary…</p>}>
        <Summary params={params}/>
      </Suspense>
    </PublicShell>
  );
}

async function Summary({ params }: { params: PageProps<'/v/[id]'>['params'] }) {
  const { id } = await params;
  const [s, entrances, notices, venuePhotos] = await Promise.all([getVenueSummary(id), getBestEntrances(id), getLiveNotices(id), getPublicVenuePhotos(id)]);
  if (!s) notFound();
  const v = s.venue;
  const listings = await getNearbyListings(v);
  const entrance = entrances.get(id) ?? null;
  return (
    <>
      <p className="pub-eyebrow">Access summary</p>
      <h1>{v.name}<span className="dot">.</span></h1>
      <p className="pub-muted">{v.kind} · {v.address ? `${v.address}, ` : ''}{v.area}</p>
      <p>
        {basisLine(s)}
        {s.updated && <> Last updated {auDate(s.updated)}.</>}
      </p>

      <h2>By access need</h2>
      <div className="pub-card"><NeedList s={s}/></div>

      <h2>What people found</h2>
      <div className="pub-card"><FactList s={s}/></div>

      <VenueSaysPublic t={serverT()} name={v.name} notices={notices.get(id) ?? []} photos={venuePhotos}/>

      <GettingTherePublic venue={v} entrance={entrance}/>
      <NearbyPublic t={serverT()} venue={v} entrance={entrance} listings={listings}/>

      <h2>How this works</h2>
      <p>
        Only reviews from people in the Roam Access pilot can say a place works. OpenStreetMap listings are
        shown as “not yet confirmed”. Quick answers are one yes-or-no answer from someone who has been there.
        Nobody can pay to change what this page says.
      </p>

      <div className="pub-actions">
        <a className="pub-btn primary" href={`/#/venue/${encodeURIComponent(v.id)}`}>Open in the Roam Access app</a>
        <a className="pub-btn" href={`/v/${encodeURIComponent(v.id)}/share`}>Share or print this summary</a>
      </div>
    </>
  );
}
