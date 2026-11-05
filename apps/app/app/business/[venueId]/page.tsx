import { Suspense } from 'react';
import Link from 'next/link';
import { Portal, NotAllowed, Stat, VerdictPill } from '@/components/portal/Portal';
import { Flash } from '@/components/portal/Flash';
import { getUserId, isAdmin } from '@/lib/auth';
import { managesVenue } from '@/lib/roles';
import { getVenueDashboard, REPLY_MAX } from '@/lib/data/business';
import { cardLines, formatVisitDate } from '@/lib/needs-card';
import { cardAction, replyAction, statementAction } from '../actions';

export const metadata = { title: 'Venue dashboard · Roam Access pilot' };

const OK: Record<string, string> = {
  statement: 'Your access statement is live. It shows as “Venue says”, apart from community facts.',
  'statement-removed': 'Your access statement has been removed.',
  reply: 'Your reply is live under the review.',
  'reply-removed': 'Your reply has been removed.',
  card: 'Thanks — the guest can see you’ve read their card.',
  'still-hidden': 'Saved — but the pilot team has hidden this post, so it still doesn’t show in the app.',
};

const fmtDay = (d: Date | null) => d ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' }) : '';

// Shown to the venue when the pilot team has hidden one of its posts.
function HiddenNotice({ post, what }: { post: { hidden: boolean; hiddenAt: Date | null; hiddenNote: string | null } | null; what: string }) {
  if (!post?.hidden) return null;
  return (
    <div className="flash err" role="note" style={{ marginTop: '0.75rem', fontWeight: 400 }}>
      <strong>Hidden by the pilot team{post.hiddenAt ? ` on ${fmtDay(post.hiddenAt)}` : ''}.</strong> This {what} doesn’t show in the app.
      {post.hiddenNote ? <> Reason: {post.hiddenNote}</> : null}
      {' '}Editing it won’t make it visible again — contact the Roam Access pilot team if you think this is a mistake.
    </div>
  );
}

export default function VenueDashboardPage({ params, searchParams }: PageProps<'/business/[venueId]'>) {
  return (
    <Portal area="for businesses" current="business">
      <Suspense fallback={<p role="status">Loading your dashboard…</p>}>
        <Inner params={params} searchParams={searchParams}/>
      </Suspense>
    </Portal>
  );
}

async function Inner({ params, searchParams }: Pick<PageProps<'/business/[venueId]'>, 'params' | 'searchParams'>) {
  const [{ venueId }, sp, userId] = await Promise.all([params, searchParams, getUserId()]);
  const manages = await managesVenue(userId, venueId);
  if (!manages && !(await isAdmin())) {
    return <NotAllowed title="Not your place">This dashboard is for the venue’s verified staff. <Link href="/business">Claim a place</Link> to get your own.</NotAllowed>;
  }
  const d = await getVenueDashboard(venueId);
  if (!d) return <NotAllowed title="Place not found">We couldn’t find that place.</NotAllowed>;
  const readOnly = !manages; // admins can look, not post as the venue
  const reviewLink = `/#/venue/${encodeURIComponent(d.venue.id)}`;
  const ok = typeof sp.ok === 'string' ? OK[sp.ok] : null;

  return (
    <>
      {ok && <Flash>{ok}</Flash>}
      {sp.err && <Flash kind="err">That didn’t save — please try again.</Flash>}
      <p className="pt-eyebrow">Venue dashboard · free</p>
      <h1>{d.venue.name}<span className="dot">.</span></h1>
      <p className="lead">{d.venue.kind} · {[d.venue.address, d.venue.suburb].filter(Boolean).join(', ')}</p>
      {d.hiddenCount > 0 && (
        <p className="flash err" role="note">
          The pilot team has hidden {d.hiddenCount === 1 ? 'one of your posts' : `${d.hiddenCount} of your posts`}. {d.hiddenCount === 1 ? 'It doesn’t' : 'They don’t'} show in the app — see the notes below.
        </p>
      )}
      {readOnly && <p className="flash err" role="note">You’re viewing as an admin. Replies and statements can only be posted by the venue.</p>}

      <h2 style={{ marginTop: '1.5rem' }}>Last {d.days} days</h2>
      <div className="pt-grid">
        <Stat n={d.totals.views} label="times your page was opened"/>
        <Stat n={d.totals.searches} label="times you showed in search results"/>
        <Stat n={d.totals.reviews} label={d.totals.reviews === 1 ? 'community review (all time)' : 'community reviews (all time)'}/>
        <Stat n={d.totals.cards} label={d.totals.cards === 1 ? 'needs card from a guest' : 'needs cards from guests'}/>
      </div>
      <p className="muted small">Counts are anonymous: we never record who looked, only how many people with each access need did.</p>

      <h2>Who’s looking, and what they still need to know</h2>
      <div className="pt-table-wrap">
        <table>
          <caption className="pt-sr">Views and search appearances by access need, last {d.days} days</caption>
          <thead><tr><th scope="col">Access need</th><th scope="col" className="num">Page views</th><th scope="col" className="num">In search results</th><th scope="col">Community information</th></tr></thead>
          <tbody>
            {d.byNeed.map(n => (
              <tr key={n.id}>
                <th scope="row">{n.label}</th>
                <td className="num">{n.views}</td>
                <td className="num">{n.searches}</td>
                <td>{n.covered ? <span className="pill works"><i aria-hidden="true">✓</i>Yes</span> : <span className="pill check"><i aria-hidden="true">!</i>Nothing yet</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Unmet needs</h3>
      {d.unmet.length ? (
        <ul>
          {d.unmet.map(n => (
            <li key={n.id}><strong>{n.label}:</strong> {n.who} looked at your place {n.views + n.searches} {n.views + n.searches === 1 ? 'time' : 'times'}, but nobody has reviewed it for them yet.</li>
          ))}
        </ul>
      ) : <p className="muted">None right now — everyone who looked could find community information for their needs, or nobody has looked yet.</p>}
      {d.missing.length > 0 && (
        <>
          <h3>Questions nobody has answered yet</h3>
          <p className="muted small">Most wanted first. You can’t answer these for the community — but you can explain them in your access statement, and invite customers to review.</p>
          <ul>{d.missing.map(m => <li key={m.id}>{m.question}{m.demand ? ` — ${m.demand} ${m.demand === 1 ? 'view or search' : 'views or searches'} by people who need this` : ''}</li>)}</ul>
        </>
      )}

      <h2>What the community says</h2>
      <p className="muted">These come only from reviews by people with disability. You can’t edit them, and nothing you write or pay changes them.</p>
      {[...d.facts.barriers.map(f => ['barrier', f] as const), ...d.facts.works.map(f => ['works', f] as const), ...d.facts.check.map(f => ['check', f] as const)].length ? (
        <ul className="pt-list">
          {d.facts.barriers.map(f => <li key={f.t}><VerdictPill kind="barrier"/> {f.t}</li>)}
          {d.facts.works.map(f => <li key={f.t}><VerdictPill kind="works"/> {f.t}</li>)}
          {d.facts.check.map(f => <li key={f.t}><VerdictPill kind="check"/> {f.t}{f.src === 'osm' ? ' (from OpenStreetMap)' : ''}</li>)}
        </ul>
      ) : <p className="muted">No community facts yet.</p>}

      <h2 id="statement">Your access statement</h2>
      <HiddenNotice post={d.statement} what="statement"/>
      <p className="muted">Tell people what to expect: entrances, toilets, quiet times, seating, staff help. It shows on your page as “Venue says — not checked by the community”.</p>
      {readOnly ? (
        <div className="says">{d.statement?.body || <span className="muted">No statement yet.</span>}</div>
      ) : (
        <form action={statementAction} className="pt-card">
          <input type="hidden" name="venueId" value={d.venue.id}/>
          <label htmlFor="statement-body" style={{ marginTop: 0 }}>Venue says</label>
          <p className="hint" id="statement-hint">Plain words, short sentences. Leave it empty and save to remove it.{d.statement ? ` Last updated ${d.statement.when}.` : ''}</p>
          <textarea id="statement-body" name="body" maxLength={REPLY_MAX} aria-describedby="statement-hint" defaultValue={d.statement?.body ?? ''}
            placeholder="For example: Our side door on Darley Road is step-free. Quietest before 11am."/>
          <div className="btn-row"><button className="btn" type="submit">Save statement</button></div>
        </form>
      )}

      <h2 id="reviews">Reviews ({d.reviews.length})</h2>
      <p className="muted">Reply publicly to say thanks, explain, or say what you’ll fix. Reviewers are shown by lived experience, never by name.</p>
      {d.reviews.length ? d.reviews.map(r => (
        <article key={r.id} className="pt-card" aria-labelledby={`rv-${r.id}`}>
          <div className="pt-row">
            <strong id={`rv-${r.id}`}>{r.who}</strong>
            <VerdictPill kind={r.v} label={{ works: 'It worked', check: 'Some barriers', barrier: 'Didn’t work' }[r.v]}/>
          </div>
          <p style={{ margin: '0.6rem 0 0.3rem' }}>{r.text}</p>
          {r.details && <p className="muted small" style={{ margin: 0 }}>{r.details}</p>}
          <p className="muted small" style={{ margin: '0.3rem 0 0' }}>{r.when}</p>
          <HiddenNotice post={r.reply} what="reply"/>
          {readOnly ? (r.reply && <div className="says"><strong>Venue says:</strong> {r.reply.body}</div>) : (
            <details open={!!r.reply}>
              <summary>{r.reply ? 'Your reply' : 'Reply publicly'}<span className="pt-sr"> to the review by a {r.who}</span></summary>
              <form action={replyAction}>
                <input type="hidden" name="venueId" value={d.venue.id}/>
                <input type="hidden" name="reviewId" value={r.id}/>
                <label htmlFor={`reply-${r.id}`} style={{ marginTop: '0.25rem' }}>Your public reply</label>
                <textarea id={`reply-${r.id}`} name="body" maxLength={REPLY_MAX} defaultValue={r.reply?.body ?? ''}/>
                <div className="btn-row">
                  <button className="btn" type="submit">{r.reply ? 'Update reply' : 'Post reply'}</button>
                  {r.reply && <button className="btn ghost" type="submit" name="remove" value="1">Remove reply</button>}
                </div>
              </form>
            </details>
          )}
        </article>
      )) : <p className="muted">No reviews yet.</p>}
      <div className="pt-card dashed">
        <strong>Ask your customers for reviews</strong>
        <p style={{ margin: '0.4rem 0 0' }}>Share this link: <a href={reviewLink}>{`roam-access.vercel.app${reviewLink}`}</a>. Please don’t offer rewards for reviews — we remove reviews that look paid for.</p>
      </div>

      <h2 id="cards">Needs cards from guests ({d.cards.length})</h2>
      <p className="muted">Guests send these before they visit so they don’t have to explain at the door. They’re anonymous — the guest chooses what to tell you.</p>
      {d.cards.length ? d.cards.map(c => (
        <article key={c.id} className="pt-card teal" aria-label={`Needs card received ${new Date(c.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' })}`}>
          <div className="pt-row">
            <strong>{c.visitOn ? `Visiting ${formatVisitDate(c.visitOn)}` : 'Visiting soon'}</strong>
            <span className={`pill ${c.status === 'sent' ? 'check' : 'works'}`}><i aria-hidden="true">{c.status === 'sent' ? '!' : '✓'}</i>{c.status === 'sent' ? 'New' : c.status === 'replied' ? 'Replied' : 'Read'}</span>
          </div>
          {cardLines({ needs: c.needs, note: c.note, visitOn: null }).slice(1, -1).map((l, i) => <p key={i} style={{ margin: '0.4rem 0' }}>{l}</p>)}
          <p className="muted small" style={{ margin: '0.3rem 0 0' }}>Received {new Date(c.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' })}</p>
          {c.venueResponse && <div className="says"><strong>Your reply:</strong> {c.venueResponse}</div>}
          {!readOnly && (
            <form action={cardAction}>
              <input type="hidden" name="venueId" value={d.venue.id}/>
              <input type="hidden" name="cardId" value={c.id}/>
              <label htmlFor={`card-${c.id}`}>Reply to the guest (optional)</label>
              <p className="hint" id={`card-${c.id}-hint`}>For example: “Thanks — we’ll keep the table by the door free for you.”</p>
              <textarea id={`card-${c.id}`} name="response" maxLength={500} aria-describedby={`card-${c.id}-hint`} defaultValue={c.venueResponse ?? ''}/>
              <div className="btn-row">
                <button className="btn" type="submit">{c.venueResponse ? 'Update reply' : 'Send reply'}</button>
                {c.status === 'sent' && <button className="btn ghost" type="submit" name="markRead" value="1">Mark as read</button>}
              </div>
            </form>
          )}
        </article>
      )) : <p className="muted">No needs cards yet. Guests can send one from your page in the app once you’re verified.</p>}
    </>
  );
}
