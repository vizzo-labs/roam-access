import { Suspense } from 'react';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { Portal, NotAllowed } from '@/components/portal/Portal';
import { getVenueRow } from '@/lib/data/business';
import { ClaimForm } from './ClaimForm';

export const metadata = { title: 'Claim your place · Roam Access pilot' };

export default function ClaimPage({ params }: PageProps<'/business/claim/[venueId]'>) {
  return (
    <Portal area="for businesses" current="business">
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Inner params={params}/>
      </Suspense>
    </Portal>
  );
}

async function Inner({ params }: { params: PageProps<'/business/claim/[venueId]'>['params'] }) {
  const { venueId } = await params;
  const [venue, user] = await Promise.all([getVenueRow(venueId), currentUser()]);
  if (!venue) return <NotAllowed title="Place not found">We couldn’t find that place in the pilot area. <Link href="/business#claim">Search again</Link>.</NotAllowed>;
  return (
    <>
      <p className="pt-eyebrow">Claim your place · free</p>
      <h1>{venue.name}<span className="dot">.</span></h1>
      <p className="lead">{venue.kind} · {[venue.address, venue.suburb].filter(Boolean).join(', ')}</p>
      <div className="pt-card dashed" style={{ maxWidth: '46rem' }}>
        <p style={{ margin: 0 }}>
          The pilot team checks every claim before it goes live — usually by matching your email to the venue’s website,
          or by calling the venue on its listed number{venue.phone ? ` (${venue.phone})` : ''}.
        </p>
      </div>
      <ClaimForm venueId={venue.id} venueName={venue.name} defaults={{
        name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
        email: user?.primaryEmailAddress?.emailAddress ?? '',
      }}/>
    </>
  );
}
