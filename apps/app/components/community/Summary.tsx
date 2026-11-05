import { SUMMARY_LABEL, type SummaryKind, type VenueSummary } from '@/lib/data/summary';

const ICON = { works: '✓', check: '!', barrier: '✗' } as const;
const PILL_ICON: Record<SummaryKind, string> = { works: '✓', check: '!', barrier: '✗', unknown: '?' };

/** Verdict pill, same colours as the app's: icon + colour + words. */
export function Pill({ kind }: { kind: SummaryKind }) {
  return (
    <span className={`pub-pill ${kind}`}>
      <span className="pub-pill-ico" aria-hidden="true">{PILL_ICON[kind]}</span>
      {SUMMARY_LABEL[kind]}
    </span>
  );
}

const KIND_WORD = { works: 'Works', check: 'Check first', barrier: 'Barrier' } as const;

/** One row per need group: icon + colour + words, never colour alone. */
export function NeedList({ s, compact = false }: { s: VenueSummary; compact?: boolean }) {
  return (
    <ul className="pub-list">
      {s.needs.map(n => (
        <li key={n.id} className="pub-need">
          <strong>{n.group}</strong>
          <Pill kind={n.kind}/>
          {!compact && <span className="why">{n.why}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Key facts with their source: the community, or OpenStreetMap (unconfirmed). */
export function FactList({ s, max }: { s: VenueSummary; max?: number }) {
  const facts = max ? s.facts.slice(0, max) : s.facts;
  if (!facts.length) return <p className="pub-muted">Nothing confirmed yet.</p>;
  return (
    <ul className="pub-list">
      {facts.map(({ kind, fact }) => (
        <li key={fact.t} className="pub-fact">
          <span className={`pub-ico ${kind}`} aria-hidden="true">{ICON[kind]}</span>
          <span>
            <span className="ra-sr-only">{KIND_WORD[kind]}: </span>
            {fact.t}
            <span className="pub-src">
              {fact.src === 'community' ? 'Source: people in the Roam Access pilot' : 'Source: OpenStreetMap — not yet confirmed'}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
