import { Suspense } from 'react';
import { Portal } from '@/components/portal/Portal';
import { Flash } from '@/components/portal/Flash';
import { getUserId } from '@/lib/auth';
import { getMyClaims, searchVenues } from '@/lib/data/business';

export const metadata = { title: 'For businesses · Roam Access pilot' };

const STATUS: Record<string, string> = {
  pending: 'Waiting for the pilot team to check it',
  approved: 'Verified — you manage this place',
  rejected: 'Not approved',
  revoked: 'No longer managed by you',
};

export default function BusinessPage({ searchParams }: PageProps<'/business'>) {
  return (
    <Portal area="for businesses" current="business">
      <p className="pt-eyebrow">Roam Access · for businesses</p>
      <h1>Welcome people with disability — and hear from them<span className="dot">.</span></h1>
      <p className="lead">
        Claim your place for free. See how many people with each access need look at it and what they still need to know,
        reply publicly to reviews, and receive guests’ needs cards before they arrive.
      </p>
      <div className="pt-card dashed">
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>Our promise</h2>
        <p style={{ margin: 0 }}>
          Claiming, replying or paying never changes your verdict, your place in results, or which reviews are shown.
          Only reviews from people with disability decide whether a place works for someone. What you write shows as
          “Venue says”, separate from community facts.
        </p>
      </div>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Inner searchParams={searchParams}/>
      </Suspense>
    </Portal>
  );
}

async function Inner({ searchParams }: { searchParams: PageProps<'/business'>['searchParams'] }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const userId = await getUserId();
  const [claims, results] = await Promise.all([userId ? getMyClaims(userId) : [], searchVenues(q)]);
  return (
    <>
      {sp.ok === 'claimed' && (
        <Flash>Thanks — we’ve got your claim. The pilot team will check it (usually by email or a call to the venue) and let you know.</Flash>
      )}
      <h2>Your places</h2>
      {claims.length ? (
        <ul className="pt-list">
          {claims.map(c => (
            <li key={c.id} className="pt-card">
              <div className="pt-row">
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{c.venueName}</strong>
                  <div className="muted small">{c.kind} · {c.suburb || 'Manly'}</div>
                  <div className="small" style={{ marginTop: 4 }}>
                    <span className={`pill ${c.status === 'approved' ? 'works' : c.status === 'pending' ? 'neutral' : 'barrier'}`}>
                      <i aria-hidden="true">{c.status === 'approved' ? '✓' : c.status === 'pending' ? '…' : '✗'}</i>{STATUS[c.status]}
                    </span>
                  </div>
                </div>
                {c.status === 'approved' && <a className="btn" href={`/business/${encodeURIComponent(c.venueId)}`}>Open dashboard<span className="pt-sr"> for {c.venueName}</span></a>}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="muted">You haven’t claimed a place yet.</p>}

      <h2 id="claim">Claim your place</h2>
      <form method="get" action="/business#claim" role="search" aria-label="Find your place">
        <label htmlFor="q">Your venue’s name or street</label>
        <p className="hint" id="q-hint">Places in the Manly pilot area: Manly, Fairlight, Queenscliff, Balgowlah, Manly Vale and Clontarf.</p>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <input id="q" name="q" type="search" defaultValue={q} aria-describedby="q-hint" autoComplete="organization" style={{ flex: '1 1 18rem' }}/>
          <button className="btn" type="submit">Find</button>
        </div>
      </form>
      {q && (
        <div aria-live="polite">
          <p className="muted" style={{ marginTop: '1rem' }}>{results.length ? `${results.length} ${results.length === 1 ? 'place' : 'places'} found for “${q}”.` : `Nothing found for “${q}”. Try part of the name.`}</p>
          <ul className="pt-list">
            {results.map(v => (
              <li key={v.id} className="pt-card">
                <div className="pt-row">
                  <div>
                    <strong>{v.name}</strong>
                    <div className="muted small">{v.kind} · {[v.address, v.suburb].filter(Boolean).join(', ')}</div>
                  </div>
                  <a className="btn outline" href={`/business/claim/${encodeURIComponent(v.id)}`}>Claim<span className="pt-sr"> {v.name}</span></a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted small" style={{ marginTop: '2rem' }}>
        Not in the list? We use OpenStreetMap for places — add it there, or email the pilot team.
      </p>
    </>
  );
}
