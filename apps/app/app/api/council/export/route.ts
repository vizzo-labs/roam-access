import { getUserId } from '@/lib/auth';
import { canSeeCouncil } from '@/lib/roles';
import { getCouncilMetrics } from '@/lib/council/metrics';

// CSV for the council dashboard, in "long" format (one number per row) so it
// pivots cleanly in Excel or Sheets. Same numbers as /council and the report.
const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export async function GET() {
  if (!(await canSeeCouncil(await getUserId()))) return Response.json({ error: 'Council access required' }, { status: 403 });
  const m = await getCouncilMetrics();
  const rows: (string | number)[][] = [['section', 'area', 'need_or_category', 'metric', 'value']];
  const add = (section: string, area: string, need: string, metric: string, value: number | string) => rows.push([section, area, need, metric, value]);

  for (const [k, v] of Object.entries(m.summary)) add('summary', 'pilot area', '', k, v);
  for (const n of m.byNeed) for (const k of ['venues', 'covered', 'gap', 'gapPct', 'works', 'barriers', 'demand', 'unmetDemand'] as const) add('need', 'pilot area', n.label, k, n[k]);
  for (const s of m.bySuburb) {
    add('suburb', s.suburb, '', 'venues', s.venues);
    add('suburb', s.suburb, '', 'reviewed', s.reviewed);
    add('suburb', s.suburb, '', 'reviewedPct', s.reviewedPct);
    for (const n of s.needs) for (const k of ['covered', 'gap', 'gapPct', 'demand', 'unmetDemand', 'barriers'] as const) add('suburb_need', s.suburb, n.label, k, n[k]);
  }
  for (const a of m.byAtic) for (const k of ['covered', 'gap', 'gapPct'] as const) add('atic', 'pilot area', a.label, k, a[k]);
  for (const t of m.trends) for (const k of ['reviews', 'newTesters', 'venuesCoveredToDate', 'coveredPctToDate'] as const) add('trend', `week of ${t.week}`, '', k, t[k]);
  for (const [k, v] of Object.entries(m.business)) add('business', 'pilot area', '', k, v);
  for (const c of m.grid) for (const [need, gaps] of Object.entries(c.gaps)) add('grid', `${c.suburb} [${c.bounds.map(x => x.toFixed(4)).join(' ')}]`, need, 'withoutInfo', `${gaps}/${c.venues}`);

  const day = new Date(m.generatedAt).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }); // YYYY-MM-DD
  const csv = '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n') + '\r\n';
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="roam-access-council-${day}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
