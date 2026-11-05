import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/community/PublicShell';
import { CopyField } from '@/components/community/CopyField';
import { QR } from '@/components/community/QR';
import { siteOrigin } from '@/components/community/site';
import { getVenueSummary } from '@/lib/data/summary';

export const metadata: Metadata = { title: 'Share an access summary · Roam Access', robots: { index: false, follow: false } };

export default function Page({ params }: PageProps<'/v/[id]/share'>) {
  return (
    <PublicShell>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Share params={params}/>
      </Suspense>
    </PublicShell>
  );
}

async function Share({ params }: { params: PageProps<'/v/[id]/share'>['params'] }) {
  const { id } = await params;
  const [s, origin] = await Promise.all([getVenueSummary(id), siteOrigin()]);
  if (!s) notFound();
  const v = s.venue;
  const path = `/v/${encodeURIComponent(v.id)}`;
  const url = origin + path;
  const title = `Accessibility of ${v.name}, from Roam Access`;
  const iframe = `<iframe src="${url}/embed" title="${title.replace(/"/g, '&quot;')}" width="100%" height="470" style="border:0;max-width:420px" loading="lazy"></iframe>`;
  return (
    <>
      <p className="pub-eyebrow">Share</p>
      <h1>Share the access summary for {v.name}<span className="dot">.</span></h1>
      <p>
        The summary updates itself as people review the place. It shows the community’s verdict for each access need
        and nothing personal: no names, no review text.
      </p>

      <h2>Link</h2>
      <CopyField label="Link to the summary" value={url}/>
      <p><a href={path}>Open the summary</a></p>

      <h2>Add it to your website</h2>
      <p>Paste this code into your web page. It shows a small, accessible summary with a link to the full page.</p>
      <CopyField label="Embed code" value={iframe} rows={4}/>
      <h3>Preview</h3>
      <iframe src={`${path}/embed`} title={title} width="100%" height={470} style={{ border: 0, maxWidth: 420, display: 'block' }} loading="lazy"/>

      <h2>Print a card for your counter or door</h2>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <QR url={url} label={`QR code that opens the access summary for ${v.name}`} size={150}/>
        <div>
          <p>The card lists the verdict for each access need, the key facts, and a QR code to the latest summary.</p>
          <div className="pub-actions" style={{ marginTop: 0 }}>
            <a className="pub-btn primary" href={`${path}/card?size=a5`}>A5 card</a>
            <a className="pub-btn" href={`${path}/card?size=a4`}>A4 poster</a>
          </div>
        </div>
      </div>
    </>
  );
}
