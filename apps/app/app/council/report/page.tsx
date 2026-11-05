import { Suspense } from 'react';
import { Portal, NotAllowed } from '@/components/portal/Portal';
import { PrintButton } from '@/components/portal/PrintButton';
import { AticTable, BusinessTable, NeedsTable, SuburbTable, SummaryStats, TrendTable } from '@/components/portal/CouncilTables';
import { getUserId } from '@/lib/auth';
import { canSeeCouncil } from '@/lib/roles';
import { getCouncilMetrics } from '@/lib/council/metrics';

export const metadata = { title: 'DIAP evidence report · Roam Access pilot' };

export default function ReportPage() {
  return (
    <Portal area="for councils" current="council">
      <Suspense fallback={<p role="status">Preparing the report…</p>}>
        <Inner/>
      </Suspense>
    </Portal>
  );
}

async function Inner() {
  if (!(await canSeeCouncil(await getUserId()))) return <NotAllowed title="DIAP report">This report is for council staff working with the pilot.</NotAllowed>;
  const m = await getCouncilMetrics();
  const date = new Date(m.generatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' });
  const worstSuburbs = [...m.bySuburb].sort((a, b) => a.reviewedPct - b.reviewedPct).slice(0, 3);
  const worstNeeds = [...m.byNeed].sort((a, b) => b.gapPct - a.gapPct).slice(0, 3);
  const b = m.business;
  return (
    <article>
      <div className="btn-row no-print" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
        <PrintButton/>
        <a className="btn outline" href="/api/council/export" download>Download CSV</a>
        <a className="btn ghost" href="/council">Back to the dashboard</a>
      </div>
      <p className="pt-eyebrow">Evidence for the Northern Beaches DIAP 2026–2030</p>
      <h1>Access information in Manly &amp; surrounds<span className="dot">.</span></h1>
      <p className="lead">Roam Access pilot · report generated {date}</p>

      <h2>Summary</h2>
      <SummaryStats m={m}/>
      <ul>
        <li>{m.summary.reviewedPct}% of the {m.summary.venues} places in the pilot area have any community access information ({m.summary.venuesReviewed} places, {m.summary.reviews} reviews by {m.summary.reviewers} people with disability).</li>
        <li>Biggest gaps by need: {worstNeeds.map(n => `${n.label} (${n.gapPct}% of places without information)`).join('; ')}.</li>
        <li>Suburbs with the least information: {worstSuburbs.map(s => `${s.suburb} (${s.reviewedPct}% of ${s.venues} places)`).join('; ')}.</li>
        <li>{b.claimedVenues} local {b.claimedVenues === 1 ? 'business has' : 'businesses have'} joined; {b.reviewsReplied} of {b.reviewsAtClaimed} reviews at those places have a public reply; {b.cardsSent} pre-arrival needs {b.cardsSent === 1 ? 'card was' : 'cards were'} sent to businesses.</li>
      </ul>

      <h2>Action 2.22 — Access Your Area map</h2>
      <p>
        Action 2.22 commits Council to “review and update the Access Your Area map on Council website” (years 1–4). Today that map covers
        Council facilities only. This section shows where community-verified information on local businesses and places is still
        missing, so updates can be targeted. A place counts as having information for a need when a person with that need reviewed it,
        or a reviewer answered a question that matters for it. OpenStreetMap tags are not counted.
      </p>
      <SuburbTable m={m}/>
      <NeedsTable m={m}/>

      <h2>Town and village centres — business inclusion</h2>
      <p>
        The DIAP continues Council’s work “with businesses and the broader community to identify barriers to access in town and village
        centres”. These measures show how businesses engage when people with disability report barriers.
      </p>
      <BusinessTable m={m}/>

      <h2>Trends</h2>
      <TrendTable m={m}/>

      <h2>Alignment with ATIC accessible tourism categories</h2>
      <AticTable m={m}/>

      <h2>Method and data notes</h2>
      <ul>
        <li>Places: {m.summary.venues} venues from OpenStreetMap in Manly, Fairlight, Queenscliff, Balgowlah, Manly Vale and Clontarf.</li>
        <li>Information comes only from community reviews by pilot testers with disability. Hidden (moderated) reviews are excluded.</li>
        <li>Demand is anonymous: views and search appearances of each place, counted by the viewer’s access needs, over the last {m.demandDays} days. No individual is identifiable from these counts.</li>
        <li>Business replies and statements are shown to the public as “Venue says” and never change a place’s verdict.</li>
        <li>Place data © OpenStreetMap contributors (ODbL). Venue accessibility data is available as open data (A11yJSON, ODbL) at /api/open-data/venues.</li>
      </ul>
    </article>
  );
}
