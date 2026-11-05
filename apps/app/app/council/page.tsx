import { Suspense } from 'react';
import { Portal, NotAllowed } from '@/components/portal/Portal';
import { GapHeatmap } from '@/components/portal/GapHeatmap';
import { AticTable, BusinessTable, NeedsTable, SuburbTable, SummaryStats, TrendChart, TrendTable } from '@/components/portal/CouncilTables';
import { getUserId } from '@/lib/auth';
import { canSeeCouncil } from '@/lib/roles';
import { getCouncilMetrics } from '@/lib/council/metrics';
import { RA2_NEEDS } from '@/lib/pilot-data';

export const metadata = { title: 'Council dashboard · Roam Access pilot' };

export default function CouncilPage() {
  return (
    <Portal area="for councils" current="council">
      <Suspense fallback={<p role="status">Loading the dashboard…</p>}>
        <Inner/>
      </Suspense>
    </Portal>
  );
}

async function Inner() {
  if (!(await canSeeCouncil(await getUserId()))) {
    return <NotAllowed title="Council dashboard">This dashboard is for council staff working with the pilot. Ask the Roam Access team for access.</NotAllowed>;
  }
  const m = await getCouncilMetrics();
  const generated = new Date(m.generatedAt).toLocaleString('en-AU', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Australia/Sydney' });
  return (
    <>
      <p className="pt-eyebrow">Northern Beaches · Manly pilot</p>
      <h1>Council dashboard<span className="dot">.</span></h1>
      <p className="lead">
        Where people with disability still can’t find reliable access information, what they’re looking for, and how local
        businesses are responding — evidence for the Disability Inclusion Action Plan 2026–2030.
      </p>
      <div className="btn-row no-print" style={{ marginBottom: '1rem' }}>
        <a className="btn" href="/council/report">Printable DIAP report</a>
        <a className="btn outline" href="/api/council/export" download>Download CSV</a>
      </div>
      <p className="muted small">Updated {generated}. Aggregates only — no names, no individual needs. Only community reviews count as information; OpenStreetMap tags don’t.</p>

      <SummaryStats m={m}/>

      <h2>Gap heatmap</h2>
      <p className="muted">DIAP action 2.22 (Access Your Area map): which parts of the pilot area have places with no community information.</p>
      <GapHeatmap grid={m.grid} needs={RA2_NEEDS.map(n => ({ id: n.id, label: n.chip }))}/>

      <h2>Unmet needs by suburb</h2>
      <p className="muted">“Unmet demand” counts views and search appearances, by people with that need, of places with no information for it (last {m.demandDays} days).</p>
      <SuburbTable m={m}/>
      <NeedsTable m={m}/>

      <h2>Review and coverage trends</h2>
      <TrendChart m={m}/>
      <details><summary>Trends as a table</summary><TrendTable m={m}/></details>

      <h2>Business inclusion</h2>
      <p className="muted">DIAP: “work with businesses and the broader community to identify barriers to access in town and village centres”.</p>
      <BusinessTable m={m}/>

      <h2>ATIC accessible tourism categories</h2>
      <p className="muted">The same coverage, grouped by the Australian Tourism Industry Council’s five accessibility categories.</p>
      <AticTable m={m}/>
    </>
  );
}
