import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clerkClient } from '@clerk/nextjs/server';
import { Portal, NotAllowed } from '@/components/portal/Portal';
import { Flash } from '@/components/portal/Flash';
import { getUserId, isAdmin } from '@/lib/auth';
import { decideClaim, domainMatches, listClaimsForAdmin, listRecentReplies, setReplyHidden, VERIFICATIONS } from '@/lib/data/business';
import { grantRole, listRoleHolders, revokeRole } from '@/lib/data/roles-admin';
import type { ClaimStatus } from '@/lib/db/schema-venues';
import { OWNER_MSG, OwnerModeration } from './OwnerModeration';

export const metadata = { title: 'Venue claims & roles · Roam Access admin' };

const fmt = (d: Date | null) => d ? d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' }) : '—';

async function decide(form: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  const admin = (await getUserId())!;
  const r = await decideClaim(String(form.get('id')), String(form.get('status')) as ClaimStatus, admin, String(form.get('verification') || '') || null, String(form.get('note') || '') || null);
  revalidatePath('/admin/venues');
  redirect(`/admin/venues?${'error' in r ? 'err=verify' : `ok=${form.get('status')}`}`);
}

async function grant(form: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  const admin = (await getUserId())!;
  const email = String(form.get('email') || '').trim().toLowerCase();
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ emailAddress: [email], limit: 1 });
  if (!data[0]) redirect('/admin/venues?err=nouser');
  await grantRole(data[0].id, 'council', String(form.get('org') || ''), admin);
  revalidatePath('/admin/venues');
  redirect('/admin/venues?ok=granted');
}

async function revoke(form: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  await revokeRole(String(form.get('userId')), 'council');
  revalidatePath('/admin/venues');
  redirect('/admin/venues?ok=revoked-role');
}

async function toggleReply(form: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  await setReplyHidden(String(form.get('id')), form.get('hidden') === 'true', String(form.get('note') || ''));
  revalidatePath('/admin/venues');
  redirect(`/admin/venues?ok=${form.get('hidden') === 'true' ? 'reply-hidden' : 'reply-shown'}#venue-says`);
}

const MSG: Record<string, string> = {
  'reply-hidden': 'Hidden — it no longer shows in the app.', 'reply-shown': 'Shown again in the app.',
  approved: 'Claim approved — the venue dashboard is now open to them.', rejected: 'Claim rejected.', revoked: 'Claim revoked.',
  pending: 'Claim moved back to pending.', granted: 'Council role granted.', 'revoked-role': 'Council role removed.',
};

export default function AdminVenuesPage({ searchParams }: PageProps<'/admin/venues'>) {
  return (
    <Portal area="pilot admin" current="admin">
      <p className="pt-eyebrow"><a href="/admin">Pilot admin</a> · venues &amp; roles</p>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Inner searchParams={searchParams}/>
      </Suspense>
    </Portal>
  );
}

async function Inner({ searchParams }: { searchParams: PageProps<'/admin/venues'>['searchParams'] }) {
  if (!(await isAdmin())) return <NotAllowed title="Not available">This page is for the pilot team.</NotAllowed>;
  const sp = await searchParams;
  const [claims, holders, replies] = await Promise.all([listClaimsForAdmin(), listRoleHolders(), listRecentReplies()]);
  const ids = [...new Set([...claims.map(c => c.userId), ...holders.map(h => h.userId)])];
  const emails = new Map<string, string>();
  if (ids.length) {
    const { data } = await (await clerkClient()).users.getUserList({ userId: ids, limit: 500 });
    for (const u of data) emails.set(u.id, u.primaryEmailAddress?.emailAddress ?? '');
  }
  const ok = typeof sp.ok === 'string' ? (MSG[sp.ok] ?? OWNER_MSG[sp.ok] ?? null) : null;
  const err = sp.err === 'verify' ? 'Choose how you verified the claim before approving it.' : sp.err === 'nouser' ? 'No account with that email — ask them to sign in to the app once first.' : null;
  const pending = claims.filter(c => c.status === 'pending');

  return (
    <>
      {ok && <Flash>{ok}</Flash>}
      {err && <Flash kind="err">{err}</Flash>}
      <h1>Venue claims<span className="dot">.</span></h1>
      <p className="lead">{pending.length ? `${pending.length} waiting for a decision.` : 'Nothing waiting.'} Check the evidence before approving: an email on the venue’s website domain, or a call to the venue’s listed number.</p>

      {claims.map(c => {
        const signInEmail = emails.get(c.userId) || '';
        const match = domainMatches(c.contactEmail, c.venueWebsite) || domainMatches(signInEmail, c.venueWebsite);
        return (
          <article key={c.id} className={`pt-card${c.status === 'pending' ? ' teal' : ''}`} aria-labelledby={`cl-${c.id}`}>
            <div className="pt-row">
              <h2 id={`cl-${c.id}`} style={{ margin: 0, fontSize: '1.2rem' }}>{c.venueName} <span className="muted small">· {c.suburb}</span></h2>
              <span className={`pill ${c.status === 'approved' ? 'works' : c.status === 'pending' ? 'check' : 'barrier'}`}>{c.status}</span>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.3rem 1rem', margin: '0.75rem 0' }}>
              <dt className="muted">Person</dt><dd style={{ margin: 0 }}>{c.contactName} ({c.role})</dd>
              <dt className="muted">Work email</dt><dd style={{ margin: 0 }}>{c.contactEmail}{match ? <> <span className="pill works"><i aria-hidden="true">✓</i>matches the venue website</span></> : null}</dd>
              <dt className="muted">Sign-in email</dt><dd style={{ margin: 0 }}>{signInEmail || '—'}</dd>
              <dt className="muted">Phone given</dt><dd style={{ margin: 0 }}>{c.contactPhone || '—'}</dd>
              <dt className="muted">Venue listed</dt><dd style={{ margin: 0 }}>{c.venuePhone ? <a href={`tel:${c.venuePhone.replace(/[^+\d]/g, '')}`}>{c.venuePhone}</a> : 'no phone'} · {c.venueWebsite ? <a href={c.venueWebsite} target="_blank" rel="noopener noreferrer">{c.venueWebsite}<span className="pt-sr"> (opens in a new tab)</span></a> : 'no website'}</dd>
              <dt className="muted">Evidence</dt><dd style={{ margin: 0, whiteSpace: 'pre-line' }}>{c.evidence || '—'}</dd>
              <dt className="muted">Asked</dt><dd style={{ margin: 0 }}>{fmt(c.createdAt)}</dd>
              {c.decidedAt && <><dt className="muted">Decided</dt><dd style={{ margin: 0 }}>{fmt(c.decidedAt)} · {VERIFICATIONS.find(v => v.id === c.verification)?.label ?? '—'}{c.adminNote ? ` · ${c.adminNote}` : ''}</dd></>}
            </dl>
            <form action={decide}>
              <input type="hidden" name="id" value={c.id}/>
              {c.status === 'pending' && (
                <>
                  <label htmlFor={`ver-${c.id}`}>How did you verify it?</label>
                  <select id={`ver-${c.id}`} name="verification" defaultValue={match ? 'domain-email' : ''}>
                    <option value="">Choose…</option>
                    {VERIFICATIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                  <label htmlFor={`note-${c.id}`}>Note (optional)</label>
                  <input id={`note-${c.id}`} name="note" type="text" maxLength={500}/>
                </>
              )}
              <div className="btn-row">
                {c.status === 'pending' && <button className="btn" type="submit" name="status" value="approved">Approve</button>}
                {c.status === 'pending' && <button className="btn ghost" type="submit" name="status" value="rejected">Reject</button>}
                {c.status === 'approved' && <button className="btn ghost" type="submit" name="status" value="revoked">Revoke access</button>}
                {(c.status === 'rejected' || c.status === 'revoked') && <button className="btn ghost" type="submit" name="status" value="pending">Reopen</button>}
              </div>
            </form>
          </article>
        );
      })}
      {!claims.length && <p className="muted">No claims yet.</p>}

      <h2 id="venue-says">“Venue says” — latest</h2>
      <p className="muted">Statements and replies venues have posted. Hide anything abusive, misleading or that names a reviewer. The venue sees on its dashboard that it was hidden, with your reason.</p>
      <div className="pt-table-wrap">
        <table>
          <thead><tr><th scope="col">Place</th><th scope="col">Type</th><th scope="col">Text</th><th scope="col">Updated</th><th scope="col"><span className="pt-sr">Action</span></th></tr></thead>
          <tbody>
            {replies.map(r => (
              <tr key={r.id} style={r.hidden ? { opacity: 0.6 } : undefined}>
                <td>{r.venueName}</td><td>{r.reviewId ? 'Reply to a review' : 'Access statement'}</td>
                <td style={{ maxWidth: '28rem', whiteSpace: 'pre-line' }}>{r.body}{r.hidden && r.hiddenNote ? <span className="muted small"><br/>Hidden: {r.hiddenNote}</span> : null}</td><td>{fmt(r.updatedAt)}</td>
                <td>
                  <form action={toggleReply}>
                    <input type="hidden" name="id" value={r.id}/><input type="hidden" name="hidden" value={r.hidden ? 'false' : 'true'}/>
                    {!r.hidden && <>
                      <label htmlFor={`hide-note-${r.id}`} className="small" style={{ margin: '0 0 0.25rem' }}>Reason (the venue sees it)</label>
                      <input id={`hide-note-${r.id}`} name="note" type="text" maxLength={300} style={{ minWidth: '12rem', marginBottom: '0.4rem' }}/>
                    </>}
                    <button className="btn ghost" type="submit">{r.hidden ? 'Show' : 'Hide'}<span className="pt-sr"> {r.reviewId ? 'reply' : 'statement'} from {r.venueName}</span></button>
                  </form>
                </td>
              </tr>
            ))}
            {!replies.length && <tr><td colSpan={5}>Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <OwnerModeration/>

      <h2>Council access</h2>
      <p className="muted">People with the council role can open the council dashboard and its DIAP export. Aggregates only — no names, no individual needs.</p>
      <form action={grant} className="pt-card">
        <label htmlFor="grant-email" style={{ marginTop: 0 }}>Their sign-in email</label>
        <p className="hint">They need to have signed in to the app once.</p>
        <input id="grant-email" name="email" type="email" required/>
        <label htmlFor="grant-org">Organisation (optional)</label>
        <input id="grant-org" name="org" type="text" placeholder="Northern Beaches Council"/>
        <div className="btn-row"><button className="btn" type="submit">Give council access</button></div>
      </form>
      <div className="pt-table-wrap">
        <table>
          <thead><tr><th scope="col">Email</th><th scope="col">Organisation</th><th scope="col">Since</th><th scope="col"><span className="pt-sr">Action</span></th></tr></thead>
          <tbody>
            {holders.filter(h => h.role === 'council').map(h => (
              <tr key={h.userId}>
                <td>{emails.get(h.userId) || h.userId}</td><td>{h.org || '—'}</td><td>{fmt(h.createdAt)}</td>
                <td>
                  <form action={revoke}><input type="hidden" name="userId" value={h.userId}/>
                    <button className="btn ghost" type="submit">Remove<span className="pt-sr"> council access for {emails.get(h.userId) || h.userId}</span></button>
                  </form>
                </td>
              </tr>
            ))}
            {!holders.some(h => h.role === 'council') && <tr><td colSpan={4}>Nobody has council access yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
