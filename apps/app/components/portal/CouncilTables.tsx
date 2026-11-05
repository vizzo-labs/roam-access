// Council tables and charts — rendered by both the dashboard and the
// printable DIAP report from the same CouncilMetrics, so they always agree.
import type { CouncilMetrics } from '@/lib/council/metrics';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { Stat } from './Portal';

const SHORT: Record<string, string> = Object.fromEntries(RA2_NEEDS.map(n => [n.id, n.chip]));
const pc = (n: number) => `${n}%`;

export function SummaryStats({ m }: { m: CouncilMetrics }) {
  return (
    <div className="pt-grid">
      <Stat n={m.summary.venues} label="places in the pilot area"/>
      <Stat n={pc(m.summary.reviewedPct)} label={`have community information (${m.summary.venuesReviewed})`}/>
      <Stat n={m.summary.reviews} label="community reviews"/>
      <Stat n={m.summary.testers} label="testers with disability"/>
      <Stat n={m.summary.demand} label={`place views + search appearances, last ${m.demandDays} days`}/>
    </div>
  );
}

export function NeedsTable({ m }: { m: CouncilMetrics }) {
  return (
    <div className="pt-table-wrap">
      <table>
        <caption>Information gaps and verdicts by access need — whole pilot area (verdicts as a person with only that need sees them)</caption>
        <thead><tr>
          <th scope="col">Access need</th><th scope="col" className="num">Places with info</th><th scope="col" className="num">Without info</th>
          <th scope="col" className="num">Gap</th><th scope="col" className="num">“Works for you”</th><th scope="col" className="num">“Has barriers”</th>
          <th scope="col" className="num">Demand ({m.demandDays} days)</th><th scope="col" className="num">Unmet demand</th>
        </tr></thead>
        <tbody>
          {m.byNeed.map(n => (
            <tr key={n.need}>
              <th scope="row">{n.label}</th><td className="num">{n.covered}</td><td className="num">{n.gap}</td><td className="num">{pc(n.gapPct)}</td>
              <td className="num">{n.works}</td><td className="num">{n.barriers}</td><td className="num">{n.demand}</td><td className="num">{n.unmetDemand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SuburbTable({ m }: { m: CouncilMetrics }) {
  return (
    <div className="pt-table-wrap">
      <table>
        <caption>Places without community information, by suburb and need (share of places in the suburb)</caption>
        <thead><tr>
          <th scope="col">Suburb</th><th scope="col" className="num">Places</th><th scope="col" className="num">Any info</th>
          {RA2_NEEDS.map(n => <th key={n.id} scope="col" className="num">{SHORT[n.id]}</th>)}
          <th scope="col" className="num">Unmet demand</th>
        </tr></thead>
        <tbody>
          {m.bySuburb.map(s => (
            <tr key={s.suburb}>
              <th scope="row">{s.suburb}</th><td className="num">{s.venues}</td><td className="num">{pc(s.reviewedPct)}</td>
              {s.needs.map(n => <td key={n.need} className="num">{pc(n.gapPct)} <span className="muted small">({n.gap})</span></td>)}
              <td className="num">{s.unmetDemand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AticTable({ m }: { m: CouncilMetrics }) {
  return (
    <div className="pt-table-wrap">
      <table>
        <caption>Coverage by ATIC accessible tourism category</caption>
        <thead><tr><th scope="col">ATIC category</th><th scope="col" className="num">Places with info</th><th scope="col" className="num">Without info</th><th scope="col" className="num">Gap</th></tr></thead>
        <tbody>
          {m.byAtic.map(a => (
            <tr key={a.id}><th scope="row">{a.label}</th><td className="num">{a.covered}</td><td className="num">{a.gap}</td><td className="num">{pc(a.gapPct)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const fmtWeek = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function TrendChart({ m }: { m: CouncilMetrics }) {
  const W = 720, H = 220, P = { l: 36, r: 44, t: 16, b: 36 };
  const n = m.trends.length;
  const maxR = Math.max(1, ...m.trends.map(t => t.reviews));
  const bw = (W - P.l - P.r) / n;
  const y = (v: number) => P.t + (H - P.t - P.b) * (1 - v / maxR);
  const y2 = (p: number) => P.t + (H - P.t - P.b) * (1 - p / 100);
  const line = m.trends.map((t, i) => `${i ? 'L' : 'M'}${P.l + bw * i + bw / 2},${y2(t.coveredPctToDate)}`).join(' ');
  return (
    <figure style={{ margin: '0 0 1rem' }}>
      <svg className="pt-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="trend-cap">
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="#8A8680"/>
        {m.trends.map((t, i) => (
          <g key={t.week}>
            <rect x={P.l + bw * i + bw * 0.18} width={bw * 0.64} y={y(t.reviews)} height={H - P.b - y(t.reviews)} fill="#0A4F4F" rx="3"/>
            {t.reviews > 0 && <text x={P.l + bw * i + bw / 2} y={y(t.reviews) - 4} textAnchor="middle" fontSize="11" fill="#1A1A1A">{t.reviews}</text>}
            {(i % 2 === n % 2 || i === n - 1) && <text x={P.l + bw * i + bw / 2} y={H - P.b + 16} textAnchor="middle" fontSize="11" fill="#5A5651">{fmtWeek(t.week)}</text>}
          </g>
        ))}
        <path d={line} fill="none" stroke="#9C2D0E" strokeWidth="2.5"/>
        {m.trends.map((t, i) => <circle key={t.week} cx={P.l + bw * i + bw / 2} cy={y2(t.coveredPctToDate)} r="3.5" fill="#9C2D0E"/>)}
        <text x={W - P.r + 4} y={y2(m.trends[n - 1]?.coveredPctToDate ?? 0) + 4} fontSize="11" fill="#9C2D0E">{m.trends[n - 1]?.coveredPctToDate ?? 0}%</text>
      </svg>
      <figcaption id="trend-cap" className="small muted">
        <span style={{ color: '#0A4F4F', fontWeight: 700 }}>■ Bars:</span> community reviews per week.{' '}
        <span style={{ color: '#9C2D0E', fontWeight: 700 }}>● Line:</span> share of places with any community information, to date.
        The table has the same numbers.
      </figcaption>
    </figure>
  );
}

export function TrendTable({ m }: { m: CouncilMetrics }) {
  return (
    <div className="pt-table-wrap">
      <table>
        <caption>Weekly trends (weeks start Monday, Sydney time)</caption>
        <thead><tr><th scope="col">Week of</th><th scope="col" className="num">Reviews</th><th scope="col" className="num">New testers</th><th scope="col" className="num">Places with info (to date)</th><th scope="col" className="num">Coverage</th></tr></thead>
        <tbody>
          {m.trends.map(t => (
            <tr key={t.week}><th scope="row">{fmtWeek(t.week)}</th><td className="num">{t.reviews}</td><td className="num">{t.newTesters}</td><td className="num">{t.venuesCoveredToDate}</td><td className="num">{pc(t.coveredPctToDate)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BusinessTable({ m }: { m: CouncilMetrics }) {
  const b = m.business;
  const rows: [string, string | number][] = [
    ['Places claimed and verified by their business', `${b.claimedVenues} (${pc(b.claimedPct)})`],
    ['Claims waiting for verification', b.claimsPending],
    ['Businesses with a public access statement', b.venuesWithStatement],
    ['Reviews at claimed places answered publicly', `${b.reviewsReplied} of ${b.reviewsAtClaimed} (${pc(b.replyRatePct)})`],
    ['“Didn’t work” reviews at claimed places answered', `${b.barrierReviewsReplied} of ${b.barrierReviewsAtClaimed}`],
    ['Places with a barrier reported by the community', b.venuesWithBarriers],
    ['… of which the business has joined', b.venuesWithBarriersClaimed],
    ['Pre-arrival needs cards sent to businesses', b.cardsSent],
    ['Needs cards read or answered by the business', `${b.cardsAnswered} (${pc(b.cardsAnsweredPct)})`],
  ];
  return (
    <div className="pt-table-wrap">
      <table>
        <caption>Business inclusion</caption>
        <thead><tr><th scope="col">Measure</th><th scope="col" className="num">Value</th></tr></thead>
        <tbody>{rows.map(([l, v]) => <tr key={l}><th scope="row">{l}</th><td className="num">{v}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
