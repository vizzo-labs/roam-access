import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserId, isAdmin } from '@/lib/auth';
import {
  decideReviewReport, listNoticesForAdmin, listReviewReportsForAdmin, listVenuePhotosForAdmin,
  setNoticeHidden, setVenuePhotoHidden,
} from '@/lib/data/owners';

// Business portal v2 moderation (pilot team only; English like the rest of
// /admin): reports venues made about reviews, venues' updates and photos.
// Hiding a review is the existing review moderation — a report alone never
// hides anything.

const fmt = (d: Date | null) => d ? d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' }) : '—';
const fmtDay = (d: string | null) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' }) : '';
const REASON: Record<string, string> = {
  personal: 'Shares personal information', offensive: 'Offensive or abusive', 'wrong-place': 'About a different place',
  fake: 'Looks fake or paid for', other: 'Something else',
};
const VERDICT: Record<string, string> = { works: '✓ Worked', check: '! Some barriers', barrier: '✗ Didn’t work' };

async function guard() {
  if (!(await isAdmin())) throw new Error('Not allowed');
  return (await getUserId())!;
}

async function decideReport(form: FormData) {
  'use server';
  const admin = await guard();
  const decision = form.get('decision') === 'hidden' ? 'hidden' : 'kept';
  await decideReviewReport(String(form.get('id')), decision, admin);
  revalidatePath('/admin/venues');
  redirect(`/admin/venues?ok=report-${decision}#review-reports`);
}

async function toggleNotice(form: FormData) {
  'use server';
  await guard();
  const hidden = form.get('hidden') === 'true';
  await setNoticeHidden(String(form.get('id')), hidden, String(form.get('note') || ''));
  revalidatePath('/admin/venues');
  redirect(`/admin/venues?ok=${hidden ? 'notice-hidden' : 'notice-shown'}#venue-updates`);
}

async function togglePhoto(form: FormData) {
  'use server';
  await guard();
  const hidden = form.get('hidden') === 'true';
  await setVenuePhotoHidden(String(form.get('id')), hidden, String(form.get('note') || ''));
  revalidatePath('/admin/venues');
  redirect(`/admin/venues?ok=${hidden ? 'vphoto-hidden' : 'vphoto-shown'}#venue-photos`);
}

export const OWNER_MSG: Record<string, string> = {
  'report-hidden': 'Review hidden — it no longer shows anywhere. The report is closed.',
  'report-kept': 'Review kept as it is. The report is closed.',
  'notice-hidden': 'Update hidden — it no longer shows in the app or on the public page.',
  'notice-shown': 'Update shown again (if it hasn’t ended).',
  'vphoto-hidden': 'Photo hidden — it no longer shows anywhere.',
  'vphoto-shown': 'Photo shown again.',
};

function HideForm({ action, id, hidden, what }: { action: (f: FormData) => Promise<void>; id: string; hidden: boolean; what: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id}/><input type="hidden" name="hidden" value={hidden ? 'false' : 'true'}/>
      {!hidden && <>
        <label htmlFor={`hide-${id}`} className="small" style={{ margin: '0 0 0.25rem' }}>Reason (the venue sees it)</label>
        <input id={`hide-${id}`} name="note" type="text" maxLength={300} style={{ minWidth: '12rem', marginBottom: '0.4rem' }}/>
      </>}
      <button className="btn ghost" type="submit">{hidden ? 'Show' : 'Hide'}<span className="pt-sr"> {what}</span></button>
    </form>
  );
}

export async function OwnerModeration() {
  const [reports, notices, photos] = await Promise.all([listReviewReportsForAdmin(), listNoticesForAdmin(), listVenuePhotosForAdmin()]);
  const open = reports.filter(r => r.status === 'open');
  return (
    <>
      <h2 id="review-reports">Reports about reviews{open.length ? ` (${open.length} open)` : ''}</h2>
      <p className="muted">A venue asked us to look at these. Hide a review only if it breaks the rules (personal information, abuse, the wrong place, clearly fake). A bad review is not a reason. Venues see only what everyone sees: the name the reviewer chose, or “Roam Access member” — never their account or email.</p>
      <div className="pt-table-wrap">
        <table>
          <thead><tr><th scope="col">Place</th><th scope="col">Review</th><th scope="col">Reason</th><th scope="col">Reported</th><th scope="col"><span className="pt-sr">Decision</span></th></tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} style={r.status !== 'open' ? { opacity: 0.6 } : undefined}>
                <td>{r.venueName}</td>
                <td style={{ maxWidth: '24rem', whiteSpace: 'pre-line' }}>{r.reviewVerdict ? VERDICT[r.reviewVerdict] ?? r.reviewVerdict : 'Ally observation (no verdict)'} · {fmt(r.reviewCreatedAt)}<br/>{r.reviewNote || <span className="muted">(no written note)</span>}{r.reviewHidden ? <span className="muted small"><br/>Review is hidden</span> : null}</td>
                <td>{REASON[r.reason] ?? r.reason}{r.note ? <span className="small" style={{ display: 'block', whiteSpace: 'pre-line' }}>“{r.note}”</span> : null}</td>
                <td>{fmt(r.createdAt)}</td>
                <td>
                  {r.status === 'open' ? (
                    <form action={decideReport}>
                      <input type="hidden" name="id" value={r.id}/>
                      <div className="btn-row" style={{ marginTop: 0 }}>
                        <button className="btn rust" type="submit" name="decision" value="hidden">Hide review<span className="pt-sr"> reported at {r.venueName}</span></button>
                        <button className="btn ghost" type="submit" name="decision" value="kept">Keep it<span className="pt-sr"> (review at {r.venueName})</span></button>
                      </div>
                    </form>
                  ) : <span className="small">{r.status === 'hidden' ? 'Hidden' : 'Kept'} · {fmt(r.decidedAt)}</span>}
                </td>
              </tr>
            ))}
            {!reports.length && <tr><td colSpan={5}>No reports.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 id="venue-updates">Venue updates — latest</h2>
      <p className="muted">Short notices venues post (“Lift out of service until Friday”). They show as “Venue says” on the place, its map card, its public page and to people who saved it. Hide anything misleading, abusive or that isn’t about the place.</p>
      <div className="pt-table-wrap">
        <table>
          <thead><tr><th scope="col">Place</th><th scope="col">Update</th><th scope="col">Posted</th><th scope="col">Shows until</th><th scope="col"><span className="pt-sr">Action</span></th></tr></thead>
          <tbody>
            {notices.map(n => (
              <tr key={n.id} style={n.hidden || n.expired ? { opacity: 0.6 } : undefined}>
                <td>{n.venueName}</td>
                <td style={{ maxWidth: '26rem', whiteSpace: 'pre-line' }}>{n.body}{n.hidden && n.hiddenNote ? <span className="muted small"><br/>Hidden: {n.hiddenNote}</span> : null}</td>
                <td>{fmt(n.createdAt)}</td>
                <td>{n.endsOn ? `${fmtDay(n.endsOn)}${n.expired ? ' (ended)' : ''}` : 'Until removed'}</td>
                <td><HideForm action={toggleNotice} id={n.id} hidden={n.hidden} what={`update from ${n.venueName}`}/></td>
              </tr>
            ))}
            {!notices.length && <tr><td colSpan={5}>Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 id="venue-photos">Photos from venues — latest</h2>
      <p className="muted">Public, labelled “From the venue”, always after community photos and never the cover. Hide one that shows a person’s face, private information, or isn’t about access.</p>
      <div className="pt-table-wrap">
        <table>
          <thead><tr><th scope="col">Photo</th><th scope="col">Place</th><th scope="col">Description</th><th scope="col">Added</th><th scope="col"><span className="pt-sr">Action</span></th></tr></thead>
          <tbody>
            {photos.map(p => (
              <tr key={p.id} style={p.hidden ? { opacity: 0.6 } : undefined}>
                <td>
                  <a href={`/api/venue-photos/${p.id}`} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/venue-photos/${p.id}?size=thumb`} alt={p.alt} width={96} height={72} style={{ objectFit: 'cover', borderRadius: 8, display: 'block' }}/>
                    <span className="small">Full size<span className="pt-sr"> (opens in a new tab)</span></span>
                  </a>
                </td>
                <td>{p.venueName}</td>
                <td style={{ maxWidth: '22rem' }}>{p.kind} · {p.alt}{p.hidden && p.hiddenNote ? <span className="muted small"><br/>Hidden: {p.hiddenNote}</span> : null}</td>
                <td>{fmt(p.createdAt)}</td>
                <td><HideForm action={togglePhoto} id={p.id} hidden={p.hidden} what={`photo: ${p.alt}`}/></td>
              </tr>
            ))}
            {!photos.length && <tr><td colSpan={5}>No photos yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
