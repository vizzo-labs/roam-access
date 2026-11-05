import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';
import { getAdminPhotos, kindLabel, setPhotoHidden } from '@/lib/data/photos';

// F2 · Photo moderation: hide/show one photo without hiding its review.
// Hidden photos disappear from the venue gallery, reviews and "Ask" sources.

const C = { teal: '#0A4F4F', char: '#1A1A1A', slate: '#5A5651', line: '#E5E2DA', paper: '#FAF9F6' };
const fmt = (d: Date) => d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' });

async function togglePhotoHidden(formData: FormData) {
  'use server';
  if (!(await isAdmin())) throw new Error('Not allowed');
  await setPhotoHidden(String(formData.get('id')), formData.get('hidden') === 'true');
  revalidatePath('/admin');
}

export async function AdminPhotos() {
  const photos = await getAdminPhotos();
  const th = { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: C.slate, borderBottom: `2px solid ${C.line}`, whiteSpace: 'nowrap' } as const;
  const td = { padding: '10px 12px', fontSize: 15, borderBottom: `1px solid ${C.line}`, verticalAlign: 'top' } as const;
  return (
    <>
      <h2 style={{ fontSize: 22, margin: '36px 0 8px' }}>Latest photos</h2>
      <p style={{ fontSize: 14, color: C.slate, margin: '0 0 12px' }}>Hide a photo that shows someone’s face, private information, or isn’t about access.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr><th style={th}>Photo</th><th style={th}>When</th><th style={th}>Place</th><th style={th}>Shows</th><th style={th}>Description</th><th style={th}>Visible</th></tr></thead>
          <tbody>
            {photos.map(p => (
              <tr key={p.id} style={p.hidden || p.reviewHidden ? { opacity: 0.55 } : undefined}>
                <td style={td}>
                  <a href={`/api/photos/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ color: C.teal }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/photos/${p.id}?size=thumb`} alt={p.alt} width={96} height={96} style={{ objectFit: 'cover', borderRadius: 8, display: 'block' }}/>
                    <span style={{ fontSize: 13 }}>Full size<span style={{ position: 'absolute', left: -9999 }}> (opens in a new tab)</span></span>
                  </a>
                </td>
                <td style={td}>{fmt(p.createdAt)}</td>
                <td style={td}>{p.venueName}</td>
                <td style={td}>{kindLabel(p.kind)}</td>
                <td style={{ ...td, maxWidth: 320 }}>{p.alt}{p.reviewHidden ? <em style={{ display: 'block', color: C.slate, fontSize: 13 }}>Its review is hidden</em> : null}</td>
                <td style={td}>
                  <form action={togglePhotoHidden}>
                    <input type="hidden" name="id" value={p.id}/>
                    <input type="hidden" name="hidden" value={p.hidden ? 'false' : 'true'}/>
                    <button type="submit" aria-label={`${p.hidden ? 'Show' : 'Hide'} photo: ${p.alt}`} style={{ minHeight: 44, padding: '0 14px', borderRadius: 999, border: `1.5px solid ${C.teal}`, background: p.hidden ? C.teal : C.paper, color: p.hidden ? C.paper : C.teal, fontWeight: 700, cursor: 'pointer' }}>
                      {p.hidden ? 'Show' : 'Hide'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!photos.length && <tr><td style={td} colSpan={6}>No photos yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
