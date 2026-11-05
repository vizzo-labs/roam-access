import { Suspense } from 'react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getUserId, isAdmin } from '@/lib/auth';
import {
  getLayersAdmin, removeBadge, saveBeachItem, setReportHidden, upsertBadge, type BeachEdit,
} from '@/lib/data/layers';
import { BADGES, FACILITY_KINDS, reportType } from '@/lib/layers/defs';

export const metadata = { title: 'Access layers · Admin · Roam Access pilot' };

const C = { teal: '#0A4F4F', rust: '#9C2D0E', char: '#1A1A1A', slate: '#5A5651', line: '#8A8680', hair: '#E5E2DA', paper: '#FAF9F6', stone: '#EDEAE2' };
const fmt = (d: Date | null) => d ? d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Australia/Sydney' }) : '—';
const str = (f: FormData, k: string) => String(f.get(k) ?? '');

async function guard() {
  if (!(await isAdmin())) throw new Error('Not allowed');
}

async function addBadgeAction(f: FormData) {
  'use server';
  await guard();
  const r = await upsertBadge({ venueId: str(f, 'venueId'), badge: str(f, 'badge'), sourceUrl: str(f, 'sourceUrl'), note: str(f, 'note'), addedBy: (await getUserId()) ?? '' });
  if ('error' in r && r.error) throw new Error(r.error);
  revalidatePath('/admin/layers');
}

async function removeBadgeAction(f: FormData) {
  'use server';
  await guard();
  await removeBadge(str(f, 'venueId'), str(f, 'badge'));
  revalidatePath('/admin/layers');
}

async function saveBeachAction(f: FormData) {
  'use server';
  await guard();
  const e: BeachEdit = {
    id: str(f, 'id') || undefined, kind: str(f, 'kind'), name: str(f, 'name'), suburb: str(f, 'suburb'), address: str(f, 'address'),
    lat: Number(str(f, 'lat')), lng: Number(str(f, 'lng')), description: str(f, 'description'),
    bookingUrl: str(f, 'bookingUrl'), bookingPhone: str(f, 'bookingPhone'), source: str(f, 'source'), sourceUrl: str(f, 'sourceUrl'),
    features: str(f, 'features').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12),
    mattingQuestion: f.get('mattingQuestion') === 'on', active: f.get('active') === 'on', sort: Number(str(f, 'sort')) || 0,
  };
  const r = await saveBeachItem(e);
  if ('error' in r && r.error) throw new Error(r.error);
  revalidatePath('/admin/layers');
}

async function hideReportAction(f: FormData) {
  'use server';
  await guard();
  await setReportHidden(str(f, 'id'), f.get('hidden') === 'true');
  revalidatePath('/admin/layers');
}

export default function LayersAdminPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px', fontFamily: 'Inter, system-ui, sans-serif', color: C.char }}>
      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: C.slate, margin: 0 }}>
        Roam Access · pilot admin · <Link href="/admin" style={{ color: C.teal }}>Overview</Link>
      </p>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <LayersAdmin/>
      </Suspense>
    </main>
  );
}

const input = { minHeight: 44, padding: '8px 10px', fontSize: 16, borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.paper, color: C.char, boxSizing: 'border-box', width: '100%', fontFamily: 'inherit' } as const;
const label = { display: 'block', fontSize: 14, fontWeight: 700, margin: '0 0 4px' } as const;
const btn = (primary = true) => ({ minHeight: 44, padding: '0 16px', borderRadius: 999, border: `1.5px solid ${C.teal}`, background: primary ? C.teal : C.paper, color: primary ? C.paper : C.teal, fontWeight: 700, fontSize: 15, cursor: 'pointer' }) as const;
const th = { textAlign: 'left', padding: '10px 12px', fontSize: 13, color: C.slate, borderBottom: `2px solid ${C.hair}`, whiteSpace: 'nowrap' } as const;
const td = { padding: '10px 12px', fontSize: 15, borderBottom: `1px solid ${C.hair}`, verticalAlign: 'top' } as const;

async function LayersAdmin() {
  if (!(await isAdmin())) {
    return (
      <>
        <h1 style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Not available</h1>
        <p style={{ fontSize: 17, color: C.slate }}>This page is for the pilot team. <Link href="/" style={{ color: C.teal }}>Back to the app</Link></p>
      </>
    );
  }
  const { badges, beach, toilets, reports, venues } = await getLayersAdmin();

  return (
    <>
      <h1 style={{ fontSize: 36, letterSpacing: '-0.03em', margin: '6px 0 8px' }}>Access layers<span style={{ color: C.rust }}>.</span></h1>
      <p style={{ fontSize: 16, color: C.slate, margin: '0 0 28px', lineHeight: 1.5 }}>
        Partner badges, beach access items and temporary reports. None of these change a verdict — badges are shown as the partner’s claim,
        listings as “not yet confirmed”. {toilets.live} of {toilets.n} toilets are live (National Public Toilet Map, re-import with <code>npm run layers:import</code>).
      </p>

      {/* ── Partner badges ── */}
      <section aria-labelledby="badges-h" style={{ marginBottom: 40 }}>
        <h2 id="badges-h" style={{ fontSize: 24, margin: '0 0 8px' }}>Partner badges</h2>
        <p style={{ fontSize: 14.5, color: C.slate, margin: '0 0 14px' }}>Every badge needs a source URL (the partner’s directory listing or the venue’s certificate).</p>
        <form action={addBadgeAction} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 2fr 1.6fr auto', gap: 10, alignItems: 'end', background: C.stone, padding: 16, borderRadius: 14, marginBottom: 14 }}>
          <div>
            <label htmlFor="b-venue" style={label}>Venue</label>
            <select id="b-venue" name="venueId" required style={input}>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name} · {v.kind}{v.suburb ? `, ${v.suburb}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="b-badge" style={label}>Badge</label>
            <select id="b-badge" name="badge" required style={input}>
              {BADGES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="b-src" style={label}>Source URL</label>
            <input id="b-src" name="sourceUrl" type="url" required placeholder="https://…" style={input}/>
          </div>
          <div>
            <label htmlFor="b-note" style={label}>Note (optional, public)</label>
            <input id="b-note" name="note" maxLength={300} style={input}/>
          </div>
          <button type="submit" style={btn()}>Add badge</button>
        </form>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr><th style={th}>Venue</th><th style={th}>Badge</th><th style={th}>Source</th><th style={th}>Note</th><th style={th}>Updated</th><th style={th}><span className="ra-sr-only">Remove</span></th></tr></thead>
            <tbody>
              {badges.map(b => (
                <tr key={b.venueId + b.badge}>
                  <td style={td}>{b.venueName}</td>
                  <td style={td}>{BADGES.find(x => x.id === b.badge)?.label ?? b.badge}</td>
                  <td style={{ ...td, maxWidth: 260, overflowWrap: 'anywhere' }}><a href={b.sourceUrl} style={{ color: C.teal }} target="_blank" rel="noopener noreferrer">{b.sourceUrl}</a></td>
                  <td style={td}>{b.note || '—'}</td>
                  <td style={td}>{fmt(b.updatedAt)}</td>
                  <td style={td}>
                    <form action={removeBadgeAction}>
                      <input type="hidden" name="venueId" value={b.venueId}/>
                      <input type="hidden" name="badge" value={b.badge}/>
                      <button type="submit" style={btn(false)} aria-label={`Remove ${b.badge} badge from ${b.venueName}`}>Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!badges.length && <tr><td style={td} colSpan={6}>No badges yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Beach access items ── */}
      <section aria-labelledby="beach-h" style={{ marginBottom: 40 }}>
        <h2 id="beach-h" style={{ fontSize: 24, margin: '0 0 8px' }}>Beach access items</h2>
        <p style={{ fontSize: 14.5, color: C.slate, margin: '0 0 14px' }}>Seeded from council, NPWS and Transport for NSW pages (sources kept per item). Untick “Live” to hide an item.</p>
        {beach.map(f => (
          <details key={f.id} style={{ border: `1.5px solid ${C.line}`, borderRadius: 14, marginBottom: 10, padding: '4px 16px' }}>
            <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              {f.name} <span style={{ fontWeight: 500, color: C.slate, marginLeft: 8 }}>· {FACILITY_KINDS.find(k => k.id === f.kind)?.label} · {f.active ? 'live' : 'hidden'}</span>
            </summary>
            <BeachForm f={f}/>
          </details>
        ))}
        <details style={{ border: `1.5px dashed ${C.line}`, borderRadius: 14, padding: '4px 16px' }}>
          <summary style={{ minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 700, cursor: 'pointer', color: C.teal }}>Add a beach access item</summary>
          <BeachForm/>
        </details>
      </section>

      {/* ── Temporary reports ── */}
      <section aria-labelledby="reports-h">
        <h2 id="reports-h" style={{ fontSize: 24, margin: '0 0 8px' }}>Temporary reports (last 14 days)</h2>
        <p style={{ fontSize: 14.5, color: C.slate, margin: '0 0 14px' }}>Reporters aren’t shown here or anywhere. Hide anything abusive or with personal details.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr><th style={th}>Reported</th><th style={th}>Place</th><th style={th}>Problem</th><th style={th}>Note</th><th style={th}>Still there</th><th style={th}>Status</th><th style={th}>Visible</th></tr></thead>
            <tbody>
              {reports.map(r => {
                const status = r.hidden ? 'Hidden' : r.resolvedAt ? `Cleared ${fmt(r.resolvedAt)}` : r.expired ? `Expired ${fmt(r.expiresAt)}` : `Live until ${fmt(r.expiresAt)}`;
                return (
                  <tr key={r.id} style={r.hidden ? { opacity: 0.6 } : undefined}>
                    <td style={td}>{fmt(r.createdAt)}</td>
                    <td style={td}>{r.targetName}</td>
                    <td style={td}>{reportType(r.type)?.label ?? r.type}</td>
                    <td style={{ ...td, maxWidth: 300 }}>{r.note || '—'}</td>
                    <td style={td}>{r.confirmations}</td>
                    <td style={td}>{status}</td>
                    <td style={td}>
                      <form action={hideReportAction}>
                        <input type="hidden" name="id" value={r.id}/>
                        <input type="hidden" name="hidden" value={r.hidden ? 'false' : 'true'}/>
                        <button type="submit" style={btn(r.hidden)}>{r.hidden ? 'Show' : 'Hide'}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!reports.length && <tr><td style={td} colSpan={7}>No reports in the last 14 days.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

type BeachRow = Awaited<ReturnType<typeof getLayersAdmin>>['beach'][number];

function BeachForm({ f }: { f?: BeachRow }) {
  const p = f?.id ?? 'new';
  const d = (f?.details ?? {}) as { features?: string[]; mattingQuestion?: boolean };
  const field = (name: string, text: string, value: string | number | null | undefined, opts: { type?: string; required?: boolean; step?: string } = {}) => (
    <div>
      <label htmlFor={`${p}-${name}`} style={label}>{text}</label>
      <input id={`${p}-${name}`} name={name} defaultValue={value ?? ''} type={opts.type ?? 'text'} required={opts.required} step={opts.step} style={input}/>
    </div>
  );
  return (
    <form action={saveBeachAction} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, padding: '8px 0 16px' }}>
      {f && <input type="hidden" name="id" value={f.id}/>}
      <div>
        <label htmlFor={`${p}-kind`} style={label}>Kind</label>
        <select id={`${p}-kind`} name="kind" defaultValue={f?.kind ?? 'beach'} style={input}>
          {FACILITY_KINDS.filter(k => k.layer === 'beach').map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
      </div>
      {field('name', 'Name', f?.name, { required: true })}
      {field('suburb', 'Suburb', f?.suburb)}
      {field('address', 'Address', f?.address)}
      {field('lat', 'Latitude', f?.lat, { type: 'number', required: true, step: 'any' })}
      {field('lng', 'Longitude', f?.lng, { type: 'number', required: true, step: 'any' })}
      {field('bookingUrl', 'Booking URL', f?.bookingUrl, { type: 'url' })}
      {field('bookingPhone', 'Booking phone', f?.bookingPhone)}
      {field('source', 'Source (who says so)', f?.source, { required: true })}
      {field('sourceUrl', 'Source URL', f?.sourceUrl, { type: 'url' })}
      {field('sort', 'Order', f?.sort ?? 0, { type: 'number' })}
      <div style={{ gridColumn: '1 / -1' }}>
        <label htmlFor={`${p}-description`} style={label}>Description</label>
        <textarea id={`${p}-description`} name="description" defaultValue={f?.description ?? ''} rows={2} style={input}/>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label htmlFor={`${p}-features`} style={label}>What’s listed here (one per line)</label>
        <textarea id={`${p}-features`} name="features" defaultValue={(d.features ?? []).join('\n')} rows={4} style={input}/>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, fontSize: 15, fontWeight: 600 }}>
        <input type="checkbox" name="mattingQuestion" defaultChecked={!!d.mattingQuestion} style={{ width: 22, height: 22 }}/> Ask “Is there matting today?”
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, fontSize: 15, fontWeight: 600 }}>
        <input type="checkbox" name="active" defaultChecked={f ? f.active : true} style={{ width: 22, height: 22 }}/> Live
      </label>
      <div style={{ gridColumn: '1 / -1' }}>
        <button type="submit" style={btn()}>{f ? `Save ${f.name}` : 'Add item'}</button>
      </div>
    </form>
  );
}
