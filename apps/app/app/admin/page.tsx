import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';
import { clerkClient } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/auth';
import { getAdminOverview, setReviewHidden } from '@/lib/data';
import { RA2_FEATURES, RA2_NEEDS } from '@/lib/pilot-data';
import { IssuesQueue } from './IssuesQueue';

export const metadata = { title: 'Admin · Roam Access pilot' };

const C = { teal: '#0A4F4F', rust: '#9C2D0E', char: '#1A1A1A', slate: '#5A5651', line: '#E5E2DA', paper: '#FAF9F6', stone: '#EDEAE2' };
const VERDICT = { works: '✓ Worked', check: '! Some barriers', barrier: '✗ Didn’t work' } as Record<string, string>;
const needLabel = (ids: string[]) => ids.map(id => RA2_NEEDS.find(n => n.id === id)?.chip ?? id).join(', ') || '—';
const fmt = (d: Date | null) => d ? d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' }) : '—';

async function toggleHidden(formData: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  await setReviewHidden(String(formData.get('id')), formData.get('hidden') === 'true');
  revalidatePath('/admin');
}

export default function AdminPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px', fontFamily: 'Inter, system-ui, sans-serif', color: C.char }}>
      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: C.slate, margin: 0 }}>
        Roam Access · pilot admin
      </p>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Admin/>
      </Suspense>
    </main>
  );
}

async function Admin() {
  if (!(await isAdmin())) {
    return (
      <>
        <h1 style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Not available</h1>
        <p style={{ fontSize: 17, color: C.slate }}>This page is for the pilot team. <a href="/" style={{ color: C.teal }}>Back to the app</a></p>
      </>
    );
  }
  const { pilot, testers, recent } = await getAdminOverview();
  const emails = new Map<string, string>();
  if (testers.length) {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({ userId: testers.map(t => t.userId), limit: 500 });
    for (const u of data) emails.set(u.id, u.primaryEmailAddress?.emailAddress ?? '');
  }

  const card = { background: C.stone, borderRadius: 16, padding: '16px 18px', flex: '1 1 160px' } as const;
  const th = { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: C.slate, borderBottom: `2px solid ${C.line}`, whiteSpace: 'nowrap' } as const;
  const td = { padding: '10px 12px', fontSize: 15, borderBottom: `1px solid ${C.line}`, verticalAlign: 'top' } as const;

  return (
    <>
      <h1 style={{ fontSize: 36, letterSpacing: '-0.03em', margin: '6px 0 20px' }}>Pilot overview<span style={{ color: C.rust }}>.</span></h1>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
        {[[pilot.testers, 'testers onboarded'], [testers.length, 'accounts created'], [pilot.reviews, 'visible reviews'], [pilot.placesReviewed, 'places reviewed']].map(([n, l]) => (
          <div key={String(l)} style={card}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 30, fontWeight: 700 }}>{n}</div>
            <div style={{ fontSize: 14, color: C.slate }}>{l}</div>
          </div>
        ))}
      </div>

      <IssuesQueue emails={emails}/>

      <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>Testers</h2>
      <p style={{ fontSize: 14, color: C.slate, margin: '0 0 12px' }}>Needs are sensitive information — don’t copy them out of this page.</p>
      <div style={{ overflowX: 'auto', marginBottom: 36 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Needs</th><th style={th}>Reviews</th><th style={th}>Joined</th><th style={th}>Onboarded</th></tr></thead>
          <tbody>
            {testers.map(t => (
              <tr key={t.userId}>
                <td style={td}>{t.name || '—'}</td>
                <td style={td}>{emails.get(t.userId) || '—'}</td>
                <td style={td}>{needLabel(t.needs)}</td>
                <td style={td}>{t.reviews}</td>
                <td style={td}>{fmt(t.createdAt)}</td>
                <td style={td}>{t.onboardedAt ? 'Yes' : 'Not yet'}</td>
              </tr>
            ))}
            {!testers.length && <tr><td style={td} colSpan={6}>No testers yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 22, margin: '0 0 12px' }}>Latest reviews</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr><th style={th}>When</th><th style={th}>Place</th><th style={th}>Verdict</th><th style={th}>Reviewer’s needs</th><th style={th}>Details</th><th style={th}>Note</th><th style={th}>Visible</th></tr></thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.id} style={r.hidden ? { opacity: 0.55 } : undefined}>
                <td style={td}>{fmt(r.createdAt)}</td>
                <td style={td}>{r.venueName}</td>
                <td style={td}>{VERDICT[r.verdict] ?? r.verdict}</td>
                <td style={td}>{needLabel(r.needs)}</td>
                <td style={td}>{RA2_FEATURES.filter(f => r.features?.[f.id]).map(f => `${r.features[f.id] === 'yes' ? '✓' : '✗'} ${f.yesShort}`).join(' · ') || '—'}</td>
                <td style={{ ...td, maxWidth: 320 }}>{r.note || '—'}</td>
                <td style={td}>
                  <form action={toggleHidden}>
                    <input type="hidden" name="id" value={r.id}/>
                    <input type="hidden" name="hidden" value={r.hidden ? 'false' : 'true'}/>
                    <button type="submit" style={{ minHeight: 40, padding: '0 14px', borderRadius: 999, border: `1.5px solid ${C.teal}`, background: r.hidden ? C.teal : C.paper, color: r.hidden ? C.paper : C.teal, fontWeight: 700, cursor: 'pointer' }}>
                      {r.hidden ? 'Show' : 'Hide'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!recent.length && <tr><td style={td} colSpan={7}>No reviews yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
