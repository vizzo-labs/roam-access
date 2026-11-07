'use client';
import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { preparePhoto } from '@/components/pilot/photos/resize';

type Labels = Record<'title' | 'file' | 'fileHint' | 'kind' | 'alt' | 'altHint' | 'altPlaceholder' | 'upload' | 'uploading' | 'left' | 'done' | 'errAlt' | 'errFile' | 'errUpload' | 'errLimit', string>;

// Upload one venue photo. The browser resizes it and re-encodes it as JPEG
// (which drops EXIF/GPS), exactly like review photos; the server checks and
// strips it again. Strings come translated from the server page.
export function PhotoUpload({ venueId, kinds, altMin, altMax, labels: L }: {
  venueId: string; kinds: { id: string; label: string }[]; altMin: number; altMax: number; labels: Labels;
}) {
  const id = useId();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLTextAreaElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fail(msg: string, focus?: HTMLElement | null) {
    setError(msg); setBusy(false);
    requestAnimationFrame(() => (focus ?? errRef.current)?.focus());
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    const alt = String(form.get('alt') || '').replace(/\s+/g, ' ').trim();
    if (!file) return fail(L.errFile, fileRef.current);
    if (alt.length < altMin) return fail(L.errAlt, altRef.current);
    setBusy(true); setError(null);
    try {
      const p = await preparePhoto(file);
      const body = new FormData();
      body.set('photo', p.photo, 'photo.jpg');
      body.set('thumb', p.thumb, 'thumb.jpg');
      body.set('kind', String(form.get('kind') || 'other'));
      body.set('alt', alt);
      const r = await fetch(`/api/business/venues/${encodeURIComponent(venueId)}/photos`, { method: 'POST', body });
      if (!r.ok) {
        const code = (await r.json().catch(() => ({}))).error;
        return fail(code === 'photo-limit' ? L.errLimit : code === 'photo-alt' ? L.errAlt : L.errUpload);
      }
      e.currentTarget?.reset?.();
      setBusy(false);
      router.push(`/business/${encodeURIComponent(venueId)}?tab=photos&ok=photo`);
    } catch {
      fail(L.errFile, fileRef.current);
    }
  }

  return (
    <form onSubmit={submit} className="pt-card" noValidate>
      <h3 style={{ marginTop: 0 }}>{L.title}</h3>
      <p className="hint">{L.left}</p>
      {error && <p ref={errRef} tabIndex={-1} role="alert" className="flash err">{error}</p>}
      <label htmlFor={`${id}-file`}>{L.file}</label>
      <p className="hint" id={`${id}-file-hint`}>{L.fileHint}</p>
      <input ref={fileRef} id={`${id}-file`} name="file" type="file" accept="image/*" required aria-describedby={`${id}-file-hint`}
        className="pt-file"/>
      <label htmlFor={`${id}-kind`}>{L.kind}</label>
      <select id={`${id}-kind`} name="kind" defaultValue="entrance" style={{ maxWidth: '20rem' }}>
        {kinds.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
      </select>
      <label htmlFor={`${id}-alt`}>{L.alt}</label>
      <p className="hint" id={`${id}-alt-hint`}>{L.altHint}</p>
      <textarea ref={altRef} id={`${id}-alt`} name="alt" required minLength={altMin} maxLength={altMax}
        aria-describedby={`${id}-alt-hint`} placeholder={L.altPlaceholder}/>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={busy} aria-disabled={busy}>{busy ? L.uploading : L.upload}</button>
      </div>
      {busy && <p className="pt-sr" role="status">{L.uploading}</p>}
    </form>
  );
}
