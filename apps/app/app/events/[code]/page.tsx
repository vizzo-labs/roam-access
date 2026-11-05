/* eslint-disable @next/next/no-html-link-for-pages -- links into the app need a full page load (its layout script sets up the phone shell) */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getUserId } from '@/lib/auth';
import { getEventByCode, getLeaderboard, getMembership } from '@/lib/data/community';
import { eventWhen, STATUS_WORD } from '@/lib/community/format';
import { PublicShell } from '@/components/community/PublicShell';
import { AutoRefresh } from '@/components/community/AutoRefresh';

export const metadata: Metadata = { title: 'Mapping day leaderboard · Roam Access', robots: { index: false, follow: false } };

// Anonymous by default; names only for members who opted in. No needs, ever.
// ?screen=1 refreshes every minute for a big screen at the event.
export default function Page({ params, searchParams }: PageProps<'/events/[code]'>) {
  return (
    <PublicShell tag="Mapping day">
      <Suspense fallback={<p role="status">Loading the leaderboard…</p>}>
        <Board params={params} searchParams={searchParams}/>
      </Suspense>
    </PublicShell>
  );
}

async function Board({ params, searchParams }: Pick<PageProps<'/events/[code]'>, 'params' | 'searchParams'>) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const event = await getEventByCode(code);
  if (!event) {
    return <><h1>We can’t find that mapping day<span className="dot">.</span></h1><p><a href="/">Open Roam Access</a></p></>;
  }
  const userId = await getUserId();
  const [{ rows, totals }, member] = await Promise.all([
    getLeaderboard(event, userId),
    userId ? getMembership(event.id, userId) : null,
  ]);
  const enc = encodeURIComponent(event.code);
  return (
    <>
      {sp.screen === '1' && event.status !== 'ended' && <AutoRefresh/>}
      <p className="pub-eyebrow">Leaderboard · {STATUS_WORD[event.status]}</p>
      <h1>{event.name}<span className="dot">.</span></h1>
      <p><strong>{eventWhen(event)}</strong>{event.area && <><br/>{event.area}</>}</p>
      {sp.saved === '1' && <p role="status" className="pub-ok">Saved.</p>}

      <ul className="pub-stats" aria-label="Totals">
        <li><b>{totals.places}</b>{totals.places === 1 ? 'place mapped' : 'places mapped'}</li>
        <li><b>{totals.reviews}</b>{totals.reviews === 1 ? 'review' : 'reviews'}</li>
        <li><b>{totals.answers}</b>{totals.answers === 1 ? 'quick answer' : 'quick answers'}</li>
        <li><b>{totals.members}</b>{totals.members === 1 ? 'mapper' : 'mappers'}</li>
      </ul>

      {rows.length ? (
        <div style={{ overflowX: 'auto' }} tabIndex={0} role="region" aria-label="Leaderboard (scrolls sideways on small screens)">
          <table className="pub-table">
            <caption className="ra-sr-only">Mappers ranked by contributions during the event</caption>
            <thead>
              <tr><th scope="col">Rank</th><th scope="col">Mapper</th><th scope="col" className="num">Places</th><th scope="col" className="num">Reviews</th><th scope="col" className="num">Quick answers</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.you ? 'you' : undefined}>
                  <td className="num" style={{ textAlign: 'left' }}>{r.rank}</td>
                  <th scope="row" style={{ textAlign: 'left', fontWeight: r.you ? 700 : 600, padding: '12px 10px', borderBottom: '1px solid #E5E2DA' }}>
                    {r.label}{r.you && <> (you)</>}
                  </th>
                  <td className="num">{r.places}</td>
                  <td className="num">{r.reviews}</td>
                  <td className="num">{r.answers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="pub-stone">Nobody has joined yet. Be the first!</p>}

      <p className="pub-muted pub-small" style={{ marginTop: 16 }}>
        Counts are reviews and quick answers made during the event. Mappers are anonymous unless they chose to show a name.
        The leaderboard never changes any place’s verdict.
      </p>

      <div className="pub-actions pub-noprint">
        {userId && member ? (
          <>
            <a className="pub-btn primary" href="/#/gaps">Keep mapping</a>
            <a className="pub-btn" href={`/join/${enc}`}>Change how I appear</a>
          </>
        ) : event.status !== 'ended' ? (
          <a className="pub-btn primary" href={`/join/${enc}`}>Join this mapping day</a>
        ) : null}
        <a className="pub-btn" href={`/events/${enc}/kit`}>Organiser kit</a>
      </div>
    </>
  );
}
