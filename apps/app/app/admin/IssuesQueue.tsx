// "Reports to check": problems testers reported from a venue page (closed,
// moved, wrong location, duplicate, info wrong). Resolve, or hide the place
// from the app (mark inactive). Server component; actions in issue-actions.ts.

import { getIssueQueue, ISSUE_KINDS } from '@/lib/data/trust';
import { markInactiveAction, reactivateVenueAction, resolveIssueAction } from './issue-actions';

const C = { teal: '#0A4F4F', rust: '#9C2D0E', char: '#1A1A1A', slate: '#5A5651', line: '#E5E2DA', paper: '#FAF9F6', stone: '#EDEAE2' };
const fmt = (d: Date | null) => d ? d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' }) : '—';
const kindLabel = (k: string) => ISSUE_KINDS.find(x => x.id === k)?.label ?? k;
const RESOLUTION: Record<string, string> = { fixed: 'Fixed', no_change: 'No change needed', venue_inactive: 'Place hidden (inactive)' };

const th = { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: C.slate, borderBottom: `2px solid ${C.line}`, whiteSpace: 'nowrap' } as const;
const td = { padding: '10px 12px', fontSize: 15, borderBottom: `1px solid ${C.line}`, verticalAlign: 'top' } as const;
const btn = (primary: boolean) => ({
  minHeight: 44, padding: '0 14px', borderRadius: 999, border: `1.5px solid ${primary ? C.teal : C.rust}`,
  background: C.paper, color: primary ? C.teal : C.rust, fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap',
} as const);

export async function IssuesQueue({ emails }: { emails: Map<string, string> }) {
  const { open, resolved } = await getIssueQueue();
  return (
    <section aria-labelledby="issues-h" style={{ marginBottom: 36 }}>
      <h2 id="issues-h" style={{ fontSize: 22, margin: '0 0 8px' }}>
        Reports to check <span style={{ fontFamily: '"JetBrains Mono", monospace', color: open.length ? C.rust : C.slate }}>({open.length})</span>
      </h2>
      <p style={{ fontSize: 14, color: C.slate, margin: '0 0 12px' }}>
        From “Report a problem” on a place. Hiding a place removes it from the app (its reviews stay in the database).
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr><th style={th}>When</th><th style={th}>Place</th><th style={th}>Problem</th><th style={th}>Note</th><th style={th}>Reported by</th><th style={th}>Action</th></tr></thead>
          <tbody>
            {open.map(i => (
              <tr key={i.id}>
                <td style={td}>{fmt(i.createdAt)}</td>
                <td style={td}>
                  <strong>{i.venueName}</strong>
                  <div style={{ fontSize: 13, color: C.slate }}>{[i.venueAddress, i.venueSuburb].filter(Boolean).join(', ') || '—'}{i.venueActive ? '' : ' · hidden'}</div>
                  <a href={`https://www.openstreetmap.org/${i.osmType}/${i.osmId}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.teal }}>
                    OpenStreetMap<span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}> (opens in a new tab)</span>
                  </a>
                </td>
                <td style={td}>{kindLabel(i.kind)}</td>
                <td style={{ ...td, maxWidth: 300 }}>{i.note || '—'}</td>
                <td style={td}>{emails.get(i.userId) || 'Tester'}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <form action={resolveIssueAction}>
                      <input type="hidden" name="id" value={i.id}/>
                      <input type="hidden" name="resolution" value="fixed"/>
                      <button type="submit" style={btn(true)} aria-label={`Resolve: fixed — ${kindLabel(i.kind)}, ${i.venueName}`}>Resolve: fixed</button>
                    </form>
                    <form action={resolveIssueAction}>
                      <input type="hidden" name="id" value={i.id}/>
                      <input type="hidden" name="resolution" value="no_change"/>
                      <button type="submit" style={btn(true)} aria-label={`Resolve: no change needed — ${kindLabel(i.kind)}, ${i.venueName}`}>No change needed</button>
                    </form>
                    {i.venueActive && (
                      <form action={markInactiveAction}>
                        <input type="hidden" name="id" value={i.id}/>
                        <button type="submit" style={btn(false)} aria-label={`Mark ${i.venueName} inactive and resolve its reports`}>Mark place inactive</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!open.length && <tr><td style={td} colSpan={6}>Nothing to check.</td></tr>}
          </tbody>
        </table>
      </div>

      {resolved.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 700, minHeight: 44, display: 'flex', alignItems: 'center' }}>
            Recently resolved ({resolved.length})
          </summary>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr><th style={th}>Resolved</th><th style={th}>Place</th><th style={th}>Problem</th><th style={th}>Note</th><th style={th}>Outcome</th></tr></thead>
              <tbody>
                {resolved.map(i => (
                  <tr key={i.id}>
                    <td style={td}>{fmt(i.resolvedAt)}</td>
                    <td style={td}>{i.venueName}</td>
                    <td style={td}>{kindLabel(i.kind)}</td>
                    <td style={{ ...td, maxWidth: 300 }}>{i.note || '—'}</td>
                    <td style={td}>
                      {RESOLUTION[i.resolution ?? ''] ?? '—'}
                      {!i.venueActive && (
                        <form action={reactivateVenueAction} style={{ marginTop: 6 }}>
                          <input type="hidden" name="venueId" value={i.venueId}/>
                          <button type="submit" style={btn(true)} aria-label={`Show ${i.venueName} in the app again`}>Show place again</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
