import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/community/PublicShell';
import { FactList, NeedList } from '@/components/community/Summary';
import { auDate, basisLine, getVenueSummary } from '@/lib/data/summary';
import { getBestEntrances } from '@/lib/data/entrances';
import { GettingTherePublic } from '@/components/community/GettingThere';

// Public, read-only access summary of one place. No login, no personal data.
export async function generateMetadata({ params }: PageProps<'/v/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const s = await getVenueSummary(id);
  return {
    title: s ? `${s.venue.name}: access summary · Roam Access` : 'Place not found · Roam Access',
    robots: { index: false, follow: false },
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
  const [s, entrances] = await Promise.all([getVenueSummary(id), getBestEntrances(id)]);
  if (!s) notFound();
  const v = s.venue;
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

      <GettingTherePublic venue={v} entrance={entrances.get(id) ?? null}/>

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
