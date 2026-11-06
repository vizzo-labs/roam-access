import { Suspense } from 'react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';
import { getArrivalStepsAdmin, setArrivalStepsHidden } from '@/lib/data/arrival-steps';

export const metadata = { title: 'Arrival steps · Admin · Roam Access pilot' };

const C = { teal: '#0A4F4F', char: '#1A1A1A', slate: '#5A5651', hair: '#E5E2DA', paper: '#FAF9F6' };
const fmt = (d: Date) => d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' });
const btn = (primary = true) => ({ minHeight: 44, padding: '0 16px', borderRadius: 999, border: `1.5px solid ${C.teal}`, background: primary ? C.teal : C.paper, color: primary ? C.paper : C.teal, fontWeight: 700, fontSize: 15, cursor: 'pointer' }) as const;
const th = { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: C.slate, borderBottom: `2px solid ${C.hair}`, whiteSpace: 'nowrap' } as const;
const td = { padding: '10px 12px', fontSize: 15, borderBottom: `1px solid ${C.hair}`, verticalAlign: 'top' } as const;

async function hideAction(f: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  await setArrivalStepsHidden(String(f.get('id') ?? ''), f.get('hidden') === 'true');
  revalidatePath('/admin/arrival');
}

export default function ArrivalAdminPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px', fontFamily: 'Inter, system-ui, sans-serif', color: C.char }}>
      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: C.slate, margin: 0 }}>
        Roam Access · pilot admin · <Link href="/admin" style={{ color: C.teal }}>Overview</Link>
      </p>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <ArrivalAdmin/>
      </Suspense>
    </main>
  );
}

async function ArrivalAdmin() {
  if (!(await isAdmin())) return <h1 style={{ fontSize: 28 }}>Admins only</h1>;
  const rows = await getArrivalStepsAdmin();
  return (
    <>
      <h1 style={{ fontSize: 32, margin: '8px 0 8px' }}>Arrival steps</h1>
      <p style={{ fontSize: 15, color: C.slate, margin: '0 0 18px', maxWidth: 720 }}>
        Step-by-step arrival from the community (Getting there). Who wrote them isn’t shown here or anywhere.
        Hide anything abusive, wrong on purpose, or with personal details — hiding also hides the photo.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr><th style={th}>Added</th><th style={th}>Place</th><th style={th}>Steps</th><th style={th}>Photo</th><th style={th}>Worked for</th><th style={th}>Visible</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={r.hidden ? { opacity: 0.6 } : undefined}>
                <td style={td}>{fmt(r.createdAt)}</td>
                <td style={td}>{r.venueName}</td>
                <td style={{ ...td, maxWidth: 420 }}>
                  {r.fromPlace && <p style={{ margin: '0 0 4px', fontWeight: 700 }}>From {r.fromPlace}</p>}
                  <ol style={{ margin: 0, paddingLeft: 20 }}>{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </td>
                <td style={td}>{r.photoId ? <a href={`/api/photos/${r.photoId}`} target="_blank" rel="noopener noreferrer" style={{ color: C.teal }}>{r.photoAlt || 'Photo'}</a> : '—'}</td>
                <td style={td}>{r.confirmations}</td>
                <td style={td}>
                  <form action={hideAction}>
                    <input type="hidden" name="id" value={r.id}/>
                    <input type="hidden" name="hidden" value={r.hidden ? 'false' : 'true'}/>
                    <button type="submit" style={btn(r.hidden)}>{r.hidden ? 'Show' : 'Hide'}</button>
                  </form>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td style={td} colSpan={6}>No arrival steps yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
