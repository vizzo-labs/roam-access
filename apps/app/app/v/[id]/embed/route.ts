import type { NextRequest } from 'next/server';
import { RA2_NEEDS } from '@/lib/pilot-data';
import { publicOrigin } from '@/lib/site-url';
import { SUMMARY_LABEL, auDate, basisLine, getVenueSummary, type SummaryKind } from '@/lib/data/summary';

// The embeddable widget: a tiny, self-contained HTML page for an <iframe> on a
// venue's own website. No scripts, no cookies, no app shell — just real text.
// Framing is allowed from anywhere (that's the point); nothing personal is in it.

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

// Same palette as the app's verdict pills (all ≥ 4.5:1).
const PILL: Record<SummaryKind, { bg: string; fg: string; icon: string }> = {
  works:   { bg: '#E5EEF5', fg: '#1E5F8B', icon: '✓' },
  check:   { bg: '#F6ECDD', fg: '#854D0E', icon: '!' },
  barrier: { bg: '#F6E2DA', fg: '#9C2D0E', icon: '✗' },
  unknown: { bg: '#E7EAEF', fg: '#475569', icon: '?' },
};

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors *",
  'X-Robots-Tag': 'noindex',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

export async function GET(req: NextRequest, ctx: RouteContext<'/v/[id]/embed'>) {
  const { id } = await ctx.params;
  const s = await getVenueSummary(id);
  const origin = publicOrigin(req.nextUrl.origin);
  if (!s) {
    return new Response(page('Place not found', `<p>This place isn’t in Roam Access. <a href="${origin}/" target="_blank" rel="noopener">Visit Roam Access<span class="sr"> (opens in a new tab)</span></a></p>`), { status: 404, headers: HEADERS });
  }
  const v = s.venue;
  const full = `${origin}/v/${encodeURIComponent(v.id)}`;
  const rows = s.needs.map(n => {
    const p = PILL[n.kind];
    const need = RA2_NEEDS.find(x => x.id === n.id)!;
    return `<li><span class="need">${esc(need.chip)}</span><span class="pill" style="background:${p.bg};color:${p.fg}"><span class="ico" aria-hidden="true" style="background:${p.fg};color:${p.bg}">${p.icon}</span>${esc(SUMMARY_LABEL[n.kind])}</span></li>`;
  }).join('');
  const body = `
    <p class="eyebrow">Accessibility · from people who’ve been here</p>
    <h1>${esc(v.name)}</h1>
    <ul>${rows}</ul>
    <p class="basis">${esc(basisLine(s))}${s.updated ? ` Updated ${esc(auDate(s.updated))}.` : ''}</p>
    <p class="more"><a href="${full}" target="_blank" rel="noopener">Full access summary on Roam Access<span class="sr"> (opens in a new tab)</span></a></p>`;
  return new Response(page(`${v.name}: access summary`, body), { headers: HEADERS });
}

function page(title: string, body: string) {
  return `<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)} · Roam Access</title>
<style>
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; padding: 16px 18px; background: #FAF9F6; color: #1A1A1A; font: 16px/1.45 Inter, -apple-system, system-ui, "Segoe UI", sans-serif; border: 1.5px solid #8A8680; border-radius: 16px; box-sizing: border-box; min-height: 100vh; }
  .eyebrow { margin: 0 0 4px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #5A5651; font-weight: 600; }
  h1 { margin: 0 0 10px; font-size: 21px; line-height: 1.2; letter-spacing: -0.015em; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 0; border-top: 1px solid #E5E2DA; flex-wrap: wrap; }
  li:first-child { border-top: 0; }
  .need { font-weight: 600; font-size: 15px; }
  .pill { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13.5px; padding: 4px 10px 4px 5px; border-radius: 999px; white-space: nowrap; }
  .ico { width: 18px; height: 18px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
  .basis { margin: 10px 0 6px; font-size: 14px; color: #5A5651; }
  .more { margin: 0; }
  a { color: #0A4F4F; font-weight: 700; text-underline-offset: 3px; display: inline-block; padding: 10px 0; }
  a:focus-visible { outline: 3px solid #1A1A1A; outline-offset: 2px; border-radius: 4px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (prefers-contrast: more) { body { border-color: #1A1A1A; } .basis, .eyebrow { color: #3A3733; } }
</style></head>
<body>${body}</body></html>`;
}
