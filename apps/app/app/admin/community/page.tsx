/* eslint-disable @next/next/no-html-link-for-pages -- links into the app need a full page load (its layout script sets up the phone shell) */
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getUserId, isAdmin } from '@/lib/auth';
import { createEvent, getRecentMicroAnswers, listEvents, setMicroAnswerHidden } from '@/lib/data/community';
import { eventWhen, STATUS_WORD } from '@/lib/community/format';
import { QUICK_QUESTIONS } from '@/lib/community/questions';
import type { FeatureId } from '@/lib/pilot-data';
import { PublicShell } from '@/components/community/PublicShell';

export const metadata = { title: 'Community · Admin · Roam Access pilot', robots: { index: false, follow: false } };

async function create(formData: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  const adminId = (await getUserId())!;
  const r = await createEvent(adminId, Object.fromEntries(['name', 'area', 'date', 'start', 'end', 'code'].map(k => [k, formData.get(k)])));
  revalidatePath('/admin/community');
  if ('error' in r) redirect(`/admin/community?error=${encodeURIComponent(r.error!)}`);
  redirect(`/admin/community?created=${encodeURIComponent(r.event.code)}`);
}

async function toggleAnswer(formData: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  await setMicroAnswerHidden(String(formData.get('id')), formData.get('hidden') === 'true');
  revalidatePath('/admin/community');
}

export default function Page({ searchParams }: PageProps<'/admin/community'>) {
  return (
    <PublicShell tag="Pilot admin">
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Admin searchParams={searchParams}/>
      </Suspense>
    </PublicShell>
  );
}

async function Admin({ searchParams }: Pick<PageProps<'/admin/community'>, 'searchParams'>) {
  if (!(await isAdmin())) {
    return <><h1>Not available<span className="dot">.</span></h1><p>This page is for the pilot team. <a href="/">Back to the app</a></p></>;
  }
  const [sp, events, answers] = await Promise.all([searchParams, listEvents(), getRecentMicroAnswers()]);
  const err = typeof sp.error === 'string' ? sp.error : null;
  const created = typeof sp.created === 'string' ? sp.created : null;
  return (
    <>
      <p className="pub-eyebrow"><Link href="/admin">Pilot overview</Link> · Community</p>
      <h1>Mapping days and quick answers<span className="dot">.</span></h1>

      <h2>New mapping day</h2>
      {err && <p role="alert" className="pub-alert">{err}</p>}
      {created && <p role="status" className="pub-ok">Created. Join code <strong>{created}</strong> — <a href={`/events/${encodeURIComponent(created)}/kit`}>open the organiser kit</a>.</p>}
      <form action={create} className="pub-form pub-card">
        <label htmlFor="ev-name">Name</label>
        <input id="ev-name" type="text" name="name" required maxLength={80} placeholder="Map Manly day"/>
        <label htmlFor="ev-area">Area</label>
        <input id="ev-area" type="text" name="area" maxLength={120} placeholder="The Corso and Manly beachfront"/>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div><label htmlFor="ev-date">Date</label><input id="ev-date" type="date" name="date" required/></div>
          <div><label htmlFor="ev-start">Starts (Sydney time)</label><input id="ev-start" type="time" name="start" required defaultValue="09:30"/></div>
          <div><label htmlFor="ev-end">Ends</label><input id="ev-end" type="time" name="end" required defaultValue="13:00"/></div>
        </div>
        <label htmlFor="ev-code">Join code <span className="pub-muted" style={{ fontWeight: 500 }}>(optional — we’ll make one, like MANLY-7K2Q)</span></label>
        <input id="ev-code" type="text" name="code" maxLength={24} autoCapitalize="characters"/>
        <div className="pub-actions" style={{ marginTop: 18 }}><button type="submit" className="pub-btn primary">Create mapping day</button></div>
      </form>

      <h2>Mapping days</h2>
      {events.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="pub-table">
            <thead><tr><th scope="col">Name</th><th scope="col">When</th><th scope="col">Code</th><th scope="col" className="num">Mappers</th><th scope="col">Links</th></tr></thead>
            <tbody>
              {events.map(e => {
                const enc = encodeURIComponent(e.code);
                return (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong><br/><span className="pub-muted pub-small">{STATUS_WORD[e.status]}{e.area ? ` · ${e.area}` : ''}</span></td>
                    <td>{eventWhen(e)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{e.code}</td>
                    <td className="num">{e.members}</td>
                    <td><a href={`/join/${enc}`}>Join page</a><br/><a href={`/events/${enc}`}>Leaderboard</a><br/><a href={`/events/${enc}/kit`}>Organiser kit</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <p>No mapping days yet.</p>}

      <h2>Latest quick answers</h2>
      <p className="pub-muted pub-small">Hidden answers stop counting toward a place’s facts.</p>
      {answers.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="pub-table">
            <thead><tr><th scope="col">When</th><th scope="col">Place</th><th scope="col">Question</th><th scope="col">Answer</th><th scope="col">Visible</th></tr></thead>
            <tbody>
              {answers.map(a => (
                <tr key={a.id} style={a.hidden ? { opacity: 0.6 } : undefined}>
                  <td>{a.updatedAt.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' })}</td>
                  <td>{a.venueName}</td>
                  <td>{QUICK_QUESTIONS[a.feature as FeatureId] ?? a.feature}</td>
                  <td>{a.answer === 'yes' ? 'Yes' : 'No'}</td>
                  <td>
                    <form action={toggleAnswer}>
                      <input type="hidden" name="id" value={a.id}/>
                      <input type="hidden" name="hidden" value={a.hidden ? 'false' : 'true'}/>
                      <button type="submit" className="pub-btn" style={{ minHeight: 44, fontSize: 15 }}>{a.hidden ? 'Show' : 'Hide'}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p>No quick answers yet.</p>}
    </>
  );
}
