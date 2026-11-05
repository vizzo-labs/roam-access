/* eslint-disable @next/next/no-html-link-for-pages -- links into the app need a full page load (its layout script sets up the phone shell) */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getEventByCode } from '@/lib/data/community';
import { eventWhen } from '@/lib/community/format';
import { PublicShell } from '@/components/community/PublicShell';
import { PrintButton } from '@/components/community/CopyField';
import { QR } from '@/components/community/QR';
import { siteOrigin } from '@/components/community/site';

export const metadata: Metadata = { title: 'Mapping day organiser kit · Roam Access', robots: { index: false, follow: false } };

// How to run a "Map Manly" day: join poster, checklist, run sheet, briefing
// script, and how to make the event itself accessible. Prints cleanly.
export default function Page({ params }: PageProps<'/events/[code]/kit'>) {
  return (
    <PublicShell tag="Organiser kit">
      <Suspense fallback={<p role="status">Loading the kit…</p>}>
        <Kit params={params}/>
      </Suspense>
    </PublicShell>
  );
}

const box = <span aria-hidden="true" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #1A1A1A', borderRadius: 4, marginRight: 10, verticalAlign: '-3px', flexShrink: 0 }}/>;

function Checklist({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="pub-list">
      {items.map((it, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', breakInside: 'avoid' }}>{box}<span>{it}</span></li>)}
    </ul>
  );
}

async function Kit({ params }: { params: PageProps<'/events/[code]/kit'>['params'] }) {
  const { code } = await params;
  const [event, origin] = await Promise.all([getEventByCode(code), siteOrigin()]);
  if (!event) {
    return <><h1>We can’t find that mapping day<span className="dot">.</span></h1><p><a href="/">Open Roam Access</a></p></>;
  }
  const enc = encodeURIComponent(event.code);
  const joinUrl = `${origin}/join/${enc}`;
  const boardUrl = `${origin}/events/${enc}?screen=1`;
  const area = event.area || 'your area';

  return (
    <>
      <p className="pub-eyebrow">Organiser kit</p>
      <h1>How to run {event.name}<span className="dot">.</span></h1>
      <p><strong>{eventWhen(event)}</strong>{event.area && <><br/>{event.area}</>}</p>
      <div className="pub-actions pub-noprint" style={{ marginTop: 6 }}>
        <PrintButton>Print the kit</PrintButton>
        <a className="pub-btn" href={`/events/${enc}`}>Leaderboard</a>
      </div>

      <h2>Contents</h2>
      <ol>
        <li><a href="#poster">Join poster</a> (print a few, put one at the welcome table)</li>
        <li><a href="#before">Before the day</a></li>
        <li><a href="#run">On the day: run sheet</a></li>
        <li><a href="#script">Briefing script</a></li>
        <li><a href="#access">Making the event itself accessible</a></li>
        <li><a href="#after">After the day</a></li>
      </ol>

      <section id="poster" aria-labelledby="poster-h" className="pub-break" style={{ textAlign: 'center', marginTop: 32 }}>
        <div className="pub-card" style={{ padding: '28px 20px' }}>
          <p className="pub-eyebrow">Roam Access mapping day</p>
          <h2 id="poster-h" style={{ fontSize: 34, margin: '0 0 6px' }}>Join {event.name}</h2>
          <p style={{ fontSize: 19 }}>{eventWhen(event)}</p>
          <QR url={joinUrl} label={`QR code that opens the page to join ${event.name}`} size={240}/>
          <p style={{ fontSize: 20, marginTop: 14 }}><strong>Scan to join</strong>, or go to</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, wordBreak: 'break-all' }}>{joinUrl.replace(/^https?:\/\//, '')}</p>
          <p style={{ fontSize: 20 }}>Join code: <strong style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>{event.code}</strong></p>
          <p className="pub-muted">Ask any organiser if you’d like help joining.</p>
        </div>
      </section>

      <section id="before" aria-labelledby="before-h" className="pub-break">
        <h2 id="before-h">Before the day</h2>
        <Checklist items={[
          <>Pick a compact area with 20 to 40 places — {area}. Walk it first: note step-free routes, kerb ramps, steep bits and accessible toilets.</>,
          <>Choose an accessible base: step-free entry, accessible toilet, seats, shade, a quiet corner, close to the ferry or accessible buses.</>,
          <>Invite a mix of people. People with disability lead the day; pair them with volunteers or students if they’d like company.</>,
          <>When people register, ask what they need to take part — an Auslan interpreter, captions, a support worker, large print, a quiet space, food needs. Never ask for a diagnosis.</>,
          <>Send the join link a few days ahead so people can create their account and set their needs at home: <strong>{joinUrl.replace(/^https?:\/\//, '')}</strong></>,
          <>Plan routes of about 30, 60 and 90 minutes, each with rest stops and a step-free way back to base.</>,
          <>Print join posters and this kit. Bring power banks, water, sunscreen, hats and a first-aid kit.</>,
          <>Check the forecast and have a wet-weather plan (an indoor route, or a shorter day).</>,
          <>Optional: let venues on the routes know people may visit. Never promise them a good review — reviews stay independent.</>,
        ]}/>
      </section>

      <section id="run" aria-labelledby="run-h">
        <h2 id="run-h">On the day: run sheet</h2>
        <ol className="pub-list" style={{ listStyle: 'none' }}>
          {[
            ['Start', 'Welcome people as they arrive. Help anyone who hasn’t joined yet: scan the poster, sign in, set their needs.'],
            ['+10 min', 'Acknowledge the Traditional Custodians of the land. Read the briefing script (below). Check everyone can see the event name in the app.'],
            ['+25 min', 'Form small groups of two to four, each with a route. Swap phone numbers. Agree a time to be back.'],
            ['+30 min', 'Mapping. Review each place you visit. Between places, use “Help fill the gaps” on the Home screen for quick yes-or-no answers.'],
            ['Every 30 min', 'Rest stop. Water, shade, a sit-down. Nobody needs to finish a route.'],
            ['Last 30 min', 'Back at base. Put the leaderboard on a screen, share what people found, and thank everyone.'],
          ].map(([t, d]) => (
            <li key={t} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, breakInside: 'avoid' }}>
              <strong>{t}</strong><span>{d}</span>
            </li>
          ))}
        </ol>
        <p className="pub-small">
          Leaderboard for a big screen (refreshes every minute):{' '}
          <span style={{ fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>{boardUrl.replace(/^https?:\/\//, '')}</span>
        </p>
      </section>

      <section id="script" aria-labelledby="script-h" className="pub-break">
        <h2 id="script-h">Briefing script</h2>
        <p className="pub-muted pub-small">About five minutes. Read it as it is, or in your own words. Face the group, use a microphone if there is one, and pause for the interpreter.</p>
        <div className="pub-stone" style={{ fontSize: 18 }}>
          <p>Welcome, and thank you for coming. Today we’re mapping {area}.</p>
          <p>Roam Access tells people with disability whether a place will work for them, using reviews from people with the same needs. Right now most places around here have no information at all. Today we change that.</p>
          <p>Here’s how it works. Open the app. On the Home screen you’ll see “Help fill the gaps”: one yes-or-no question about a place near you. Tap Yes or No. That’s it. If you go inside a place, write a review: one tap for how it was, and anything else you noticed.</p>
          <p>Three rules. One: only record what you experienced yourself, today. Two: if you’re not sure, skip — a wrong answer is worse than no answer. Three: be kind to staff. We’re not inspecting anyone. If they ask, say you’re sharing access information for the community.</p>
          <p>Your reviews show your lived experience, like “wheelchair user”, never your name. The leaderboard is anonymous unless you choose to show a name. It’s for fun, not a race.</p>
          <p>Look after yourself. Take breaks, drink water, and stop whenever you want — every single answer helps. If you need anything, find me or another organiser.</p>
          <p>Any questions? Let’s go.</p>
        </div>
      </section>

      <section id="access" aria-labelledby="access-h">
        <h2 id="access-h">Making the event itself accessible</h2>
        <h3>The base</h3>
        <Checklist items={[
          'Step-free entry, an accessible toilet, plenty of seats, shade, good lighting.',
          'Accessible parking and a drop-off point; close to public transport.',
          'A quiet space anyone can use, with no need to explain why.',
        ]}/>
        <h3>Communication</h3>
        <Checklist items={[
          'Auslan interpreter when anyone asks for one; captions or written notes for the briefing.',
          'Large-print copies of the briefing and routes. Speak clearly and face the group.',
          'Give instructions more than one way: said, written, and shown on a phone.',
        ]}/>
        <h3>Pace and roles</h3>
        <Checklist items={[
          'Short routes and frequent rests. Nobody has to walk or roll far to take part.',
          'Seated roles: answer quick questions from base, welcome people, help with sign-in.',
          'Avoid the busiest times; warn people about noisy or crowded spots on the routes.',
        ]}/>
        <h3>Support and respect</h3>
        <Checklist items={[
          'Support workers and carers come free. Assistance animals are welcome (bring water bowls).',
          'Have first aid, an emergency contact list and a phone-charging station.',
          'Pay or reimburse disabled participants for their time and travel where you can.',
          'Don’t photograph people without asking. Never write down anyone’s disability.',
        ]}/>
      </section>

      <section id="after" aria-labelledby="after-h">
        <h2 id="after-h">After the day</h2>
        <Checklist items={[
          'Send everyone a thank-you with the totals from the leaderboard.',
          'Ask for feedback in more than one way: a short form, a call, or a reply by email.',
          'Note the places you didn’t reach — they’re the start of the next mapping day.',
        ]}/>
      </section>
    </>
  );
}
