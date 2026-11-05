import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/community/PublicShell';
import { PrintButton } from '@/components/community/CopyField';
import { FactList, NeedList } from '@/components/community/Summary';
import { QR } from '@/components/community/QR';
import { siteOrigin } from '@/components/community/site';
import { auDate, basisLine, getVenueSummary } from '@/lib/data/summary';

export const metadata: Metadata = { title: 'Printable access card · Roam Access', robots: { index: false, follow: false } };

// A5 card (counter) or A4 poster (door). Real text throughout, so it can be
// read aloud, enlarged and re-flowed; the QR code always opens the latest.
export default function Page({ params, searchParams }: PageProps<'/v/[id]/card'>) {
  return (
    <PublicShell>
      <Suspense fallback={<p role="status">Loading the card…</p>}>
        <Card params={params} searchParams={searchParams}/>
      </Suspense>
    </PublicShell>
  );
}

async function Card({ params, searchParams }: Pick<PageProps<'/v/[id]/card'>, 'params' | 'searchParams'>) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const size = sp.size === 'a4' ? 'a4' : 'a5';
  const [s, origin] = await Promise.all([getVenueSummary(id), siteOrigin()]);
  if (!s) notFound();
  const v = s.venue;
  const path = `/v/${encodeURIComponent(v.id)}`;
  const url = origin + path;
  const a4 = size === 'a4';
  return (
    <>
      <style>{`
        @page { size: ${a4 ? 'A4' : 'A5'} portrait; margin: ${a4 ? 14 : 10}mm; }
        .card { max-width: ${a4 ? 720 : 520}px; margin: 0 auto; border: 2px solid #1A1A1A; border-radius: 20px; padding: ${a4 ? 32 : 22}px; background: #FFFFFF; }
        .card h1 { font-size: ${a4 ? 44 : 32}px; }
        .card .pub-need strong { font-size: ${a4 ? 19 : 16}px; }
        .card .pub-list > li { padding: ${a4 ? 10 : 7}px 0; }
        .card-foot { display: flex; gap: 18px; align-items: center; margin-top: 18px; border-top: 2px solid #1A1A1A; padding-top: 16px; }
        @media print {
          .pub { font-size: ${a4 ? 17 : 13.5}px; }
          .card { border: 0; padding: 0; max-width: none; border-radius: 0; }
          .card h1 { font-size: ${a4 ? 40 : 24}px; margin-bottom: 4px; }
          .card h2 { font-size: ${a4 ? 20 : 15}px; margin: ${a4 ? 14 : 8}px 0 4px !important; }
          .card .pub-eyebrow { font-size: ${a4 ? 12 : 10}px; margin-bottom: 4px; }
          .card .pub-small { font-size: ${a4 ? 15 : 12}px; margin-bottom: 4px; }
          .card .pub-need strong { font-size: ${a4 ? 18 : 13.5}px; }
          .card .pub-pill { font-size: ${a4 ? 14.5 : 12}px; padding: ${a4 ? '6px 12px 6px 6px' : '3px 9px 3px 4px'}; }
          .card .pub-list > li { padding: ${a4 ? 9 : 4}px 0; }
          .card .pub-src { font-size: ${a4 ? 14 : 11}px; }
          .card-foot { margin-top: ${a4 ? 18 : 10}px; padding-top: ${a4 ? 16 : 8}px; gap: 12px; }
          .card .pub-list > li { break-inside: avoid; }
          .card-foot { break-inside: avoid; }
        }
      `}</style>
      <div className="pub-noprint" style={{ marginBottom: 20 }}>
        <p className="pub-eyebrow">Printable card · {a4 ? 'A4 poster' : 'A5 card'}</p>
        <div className="pub-actions" style={{ marginTop: 0 }}>
          <PrintButton>Print this card</PrintButton>
          <a className="pub-btn" href={`${path}/card?size=${a4 ? 'a5' : 'a4'}`}>Switch to {a4 ? 'A5 card' : 'A4 poster'}</a>
          <a className="pub-btn" href={`${path}/share`}>Back to sharing</a>
        </div>
      </div>

      <article className="card" aria-labelledby="card-title">
        <p className="pub-eyebrow">Accessibility, from people who’ve been here</p>
        <h1 id="card-title">{v.name}<span className="dot">.</span></h1>
        <p className="pub-muted pub-small">{basisLine(s)}{s.updated && <> Last updated {auDate(s.updated)}.</>}</p>
        <h2 style={{ marginTop: 14 }}>By access need</h2>
        <NeedList s={s} compact/>
        {s.facts.length > 0 && <>
          <h2 style={{ marginTop: 14 }}>Key facts</h2>
          <FactList s={s} max={a4 ? 6 : 2}/>
        </>}
        <div className="card-foot">
          <QR url={url} label={`QR code: scan for the latest access summary of ${v.name}`} size={a4 ? 170 : 96}/>
          <p style={{ margin: 0 }}>
            <strong>Scan for the latest</strong>, or visit<br/>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, wordBreak: 'break-all' }}>{url.replace(/^https?:\/\//, '')}</span><br/>
            <span className="pub-small pub-muted">Printed {auDate(new Date())}. Roam Access — reviews by people with disability.</span>
          </p>
        </div>
      </article>
    </>
  );
}
