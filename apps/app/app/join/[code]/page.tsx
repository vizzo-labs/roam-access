/* eslint-disable @next/next/no-html-link-for-pages -- links into the app need a full page load (its layout script sets up the phone shell) */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getUserId } from '@/lib/auth';
import { getEventByCode, getMembership, getProfileName } from '@/lib/data/community';
import { eventWhen, STATUS_WORD } from '@/lib/community/format';
import { PublicShell } from '@/components/community/PublicShell';
import { JoinForm } from '@/components/community/JoinForm';
import { leaveEventAction } from '@/components/community/eventActions';

export const metadata: Metadata = { title: 'Join a mapping day · Roam Access', robots: { index: false, follow: false } };

// Testers arrive here from the event's link or QR code.
export default function Page({ params, searchParams }: PageProps<'/join/[code]'>) {
  return (
    <PublicShell tag="Mapping day">
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Join params={params} searchParams={searchParams}/>
      </Suspense>
    </PublicShell>
  );
}

async function Join({ params, searchParams }: Pick<PageProps<'/join/[code]'>, 'params' | 'searchParams'>) {
  const [{ code }, sp] = await Promise.all([params, searchParams]);
  const event = await getEventByCode(code);
  if (!event) {
    return (
      <>
        <h1>We can’t find that mapping day<span className="dot">.</span></h1>
        <p>Check the code with the organiser — it looks like <strong>MANLY-7K2Q</strong>.</p>
        <p><a href="/">Open Roam Access</a></p>
      </>
    );
  }
  const userId = await getUserId();
  const member = userId ? await getMembership(event.id, userId) : null;
  const here = `/join/${encodeURIComponent(event.code)}`;
  const board = `/events/${encodeURIComponent(event.code)}`;

  return (
    <>
      <p className="pub-eyebrow">Mapping day · {STATUS_WORD[event.status]}</p>
      <h1>{event.name}<span className="dot">.</span></h1>
      <p><strong>{eventWhen(event)}</strong>{event.area && <><br/>{event.area}</>}</p>
      <p>
        Together we check places around Manly and record what works for people with disability.
        Every review and quick answer you make during the day counts toward the event.
      </p>

      {sp.saved === '1' && member && <p role="status" className="pub-ok"><strong>You’re in.</strong> Your contributions during the day will count for {event.name}.</p>}
      {sp.left === '1' && !member && <p role="status" className="pub-ok">You’ve left this mapping day. Your reviews stay in the app.</p>}

      {event.status === 'ended' ? (
        <p className="pub-stone">This mapping day has finished. Thank you to everyone who came. <a href={board}>See the leaderboard</a></p>
      ) : !userId ? (
        <>
          <p className="pub-stone">Sign in or create a free account to join. It takes about a minute.</p>
          <div className="pub-actions">
            <a className="pub-btn primary" href={`/sign-up?redirect_url=${encodeURIComponent(here)}`}>Create an account</a>
            <a className="pub-btn" href={`/sign-in?redirect_url=${encodeURIComponent(here)}`}>Sign in</a>
          </div>
        </>
      ) : member ? (
        <>
          <div className="pub-actions">
            <a className="pub-btn primary" href="/#/gaps">Start mapping</a>
            <a className="pub-btn" href={board}>See the leaderboard</a>
          </div>
          <h2>How you appear</h2>
          <JoinForm code={event.code} joined showName={member.showName} defaultName={member.displayName || await getProfileName(userId)} submit="Save"/>
          <form action={leaveEventAction} style={{ marginTop: 18 }}>
            <input type="hidden" name="code" value={event.code}/>
            <button type="submit" className="pub-btn">Leave this mapping day</button>
          </form>
        </>
      ) : (
        <JoinForm code={event.code} joined={false} showName={false} defaultName={await getProfileName(userId)} submit={`Join ${event.name}`}/>
      )}
    </>
  );
}
