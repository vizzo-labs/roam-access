// Import public toilets for the pilot area from the National Public Toilet
// Map (Australian Government Department of Health, Disability and Ageing,
// data.gov.au, licence CC BY 3.0 AU — attribution shown in the app), plus the
// beach access items in lib/layers/beach-seed.ts.
//
//   npm run layers:import                      upsert into the DEV database
//   npm run layers:import -- --dry             print what would be imported
//   npm run layers:import -- --csv file.csv    use a downloaded export
//   npm run layers:import -- --sql out.sql     write a seed migration instead
//
// Kept: every toilet in (and just around) the pilot area, Changing Places
// within 16 km of Manly Wharf, and adult change rooms within 10 km.
// Toilets are refreshed in place (same id = 'nptm-<FacilityID>'); beach items
// are only inserted when missing, so admin edits are never overwritten.
// Writes to the database lib/db/url.ts picks — never point it at production.

import { readFileSync, writeFileSync } from 'node:fs';
import { BEACH_SEED } from '../lib/layers/beach-seed';
import { NPTM, type ToiletDetails } from '../lib/layers/defs';
import { connectPg } from './lib/pg';

const PACKAGE = 'https://data.gov.au/data/api/3/action/package_show?id=national-public-toilet-map';
// The venue area (scripts/seed-osm.ts) plus ~1 km, and North Head.
const BBOX = { south: -33.8300, west: 151.2450, north: -33.7700, east: 151.3100 };
const ORIGIN = { lat: -33.8003, lng: 151.2843 }; // Manly Wharf
const CHANGING_PLACES_KM = 16;
const ADULT_CHANGE_KM = 10;

type Row = Record<string, string>;

// RFC 4180 CSV: quoted fields may hold commas, quotes ("") and newlines.
function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  const keys = head.map(h => h.replace(/^﻿/, '').trim());
  return body.filter(r => r.length > 1).map(r => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const yes = (v: string | undefined) => v === 'True';
const txt = (v: string | undefined) => (v && v.trim() ? v.replace(/\s+\n/g, '\n').trim().slice(0, 1000) : null);

async function loadCsv(): Promise<{ text: string; url: string; modified: string }> {
  const i = process.argv.indexOf('--csv');
  if (i > 0) return { text: readFileSync(process.argv[i + 1], 'utf8'), url: process.argv[i + 1], modified: 'local file' };
  const pkg = await fetch(PACKAGE).then(r => r.json()) as { result: { resources: { format: string; url: string; last_modified: string }[] } };
  const res = pkg.result.resources.find(r => r.format === 'CSV');
  if (!res) throw new Error('No CSV resource on data.gov.au');
  const text = await fetch(res.url).then(r => { if (!r.ok) throw new Error(`${r.status} ${res.url}`); return r.text(); });
  return { text, url: res.url, modified: res.last_modified };
}

type FacilityRow = {
  id: string; layer: string; kind: string; name: string; suburb: string | null; address: string | null;
  lat: number; lng: number; details: object; description: string | null;
  booking_url: string | null; booking_phone: string | null;
  source: string; source_url: string | null; source_licence: string | null; sort: number;
};

function toToilet(r: Row): FacilityRow {
  const details: ToiletDetails = {
    accessible: yes(r.Accessible), ambulant: yes(r.Ambulant), unisex: yes(r.Unisex) || yes(r.AllGender),
    mlak24: yes(r.MLAK24), mlakAfterHours: yes(r.MLAKAfterHours), keyRequired: yes(r.KeyRequired),
    paymentRequired: yes(r.PaymentRequired),
    adultChange: yes(r.AdultChange), changingPlaces: yes(r.ChangingPlaces), byoSling: yes(r.BYOSling),
    acShower: yes(r.ACShower), shower: yes(r.Shower), babyChange: yes(r.BabyChange),
    parkingAccessible: yes(r.ParkingAccessible), lhTransfer: yes(r.LHTransfer), rhTransfer: yes(r.RHTransfer),
    openingHours: txt(r.OpeningHours), openingHoursNote: txt(r.OpeningHoursNote),
    accessNote: txt(r.AccessNote), toiletNote: txt(r.ToiletNote), adultChangeNote: txt(r.AdultChangeNote),
    facilityType: txt(r.FacilityType),
  };
  return {
    id: `nptm-${r.FacilityID}`, layer: 'toilets', kind: 'toilet',
    name: r.Name.trim(), suburb: txt(r.Town), address: txt(r.Address1),
    lat: Number(r.Latitude), lng: Number(r.Longitude), details, description: null,
    booking_url: null, booking_phone: null,
    source: NPTM.name, source_url: r.URL || `${NPTM.siteUrl}/facility/${r.FacilityID}`, source_licence: NPTM.licence,
    sort: 0,
  };
}

function beachRows(): FacilityRow[] {
  return BEACH_SEED.map(b => ({
    id: b.id, layer: 'beach', kind: b.kind, name: b.name, suburb: b.suburb, address: b.address ?? null,
    lat: b.lat, lng: b.lng, details: b.details, description: b.description,
    booking_url: b.bookingUrl ?? null, booking_phone: b.bookingPhone ?? null,
    source: b.source, source_url: b.sourceUrl, source_licence: null, sort: b.sort,
  }));
}

const COLS = ['id', 'layer', 'kind', 'name', 'suburb', 'address', 'lat', 'lng', 'details', 'description',
  'booking_url', 'booking_phone', 'source', 'source_url', 'source_licence', 'sort'] as const;
// Refreshed from the source on re-import (toilets only).
const REFRESH = ['name', 'suburb', 'address', 'lat', 'lng', 'details', 'source_url', 'source_licence'];

const lit = (v: unknown) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return `'${s.replace(/'/g, "''")}'` + (typeof v === 'object' ? '::jsonb' : '');
};

function toSql(toilets: FacilityRow[], beach: FacilityRow[], meta: { url: string; modified: string }) {
  const values = (rows: FacilityRow[]) => rows.map(r => `  (${COLS.map(c => lit(r[c])).join(', ')})`).join(',\n');
  return `-- F3 · Seed data for the access layers. Generated by scripts/import-toilets.ts
-- (npm run layers:import -- --sql). Insert-only (ON CONFLICT DO NOTHING):
-- re-running never overwrites admin edits or newer imports.
--
-- Toilets: ${NPTM.name}, ${NPTM.owner}.
-- Licence ${NPTM.licence} (${NPTM.licenceUrl}) — attributed in the app.
-- Export: ${meta.url} (last modified ${meta.modified}).
-- ${toilets.length} toilets: the pilot area, Changing Places within ${CHANGING_PLACES_KM} km and
-- adult change rooms within ${ADULT_CHANGE_KM} km of Manly Wharf.
--
-- Beach access items: lib/layers/beach-seed.ts (sources in each row's details).

INSERT INTO facilities (${COLS.join(', ')}) VALUES
${values([...toilets, ...beach])}
ON CONFLICT (id) DO NOTHING;
`;
}

async function main() {
  const dry = process.argv.includes('--dry');
  const sqlOut = process.argv.includes('--sql') ? process.argv[process.argv.indexOf('--sql') + 1] : null;
  const csv = await loadCsv();
  const all = parseCsv(csv.text);
  const toilets = all
    .map(r => ({ r, lat: Number(r.Latitude), lng: Number(r.Longitude) }))
    .filter(({ r, lat, lng }) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !r.FacilityID || !r.Name) return false;
      const inArea = lat >= BBOX.south && lat <= BBOX.north && lng >= BBOX.west && lng <= BBOX.east;
      const d = km(ORIGIN, { lat, lng });
      return inArea || (yes(r.ChangingPlaces) && d <= CHANGING_PLACES_KM) || (yes(r.AdultChange) && d <= ADULT_CHANGE_KM);
    })
    .map(({ r }) => toToilet(r))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  const beach = beachRows();
  const accessible = toilets.filter(t => (t.details as ToiletDetails).accessible).length;
  const cp = toilets.filter(t => (t.details as ToiletDetails).changingPlaces).length;
  console.log(`[layers] ${all.length} toilets nationally → ${toilets.length} kept (${accessible} accessible, ${cp} Changing Places) · ${beach.length} beach items`);

  if (sqlOut) {
    writeFileSync(sqlOut, toSql(toilets, beach, csv));
    console.log(`[layers] wrote ${sqlOut}`);
    return;
  }
  if (dry) {
    for (const t of toilets) console.log(`  ${t.id.padEnd(12)} ${t.name} · ${t.suburb}`);
    return;
  }

  const { client, target, host } = await connectPg();
  console.log(`[layers] writing to the ${target} database (${host})`);
  if (target === 'production') throw new Error('Refusing to write to production — imports reach production through a migration.');
  try {
    const upsert = async (rows: FacilityRow[], refresh: boolean) => {
      for (const r of rows) {
        const vals = COLS.map(c => (c === 'details' ? JSON.stringify(r[c]) : r[c]));
        const conflict = refresh
          ? `DO UPDATE SET ${REFRESH.map(c => `${c} = EXCLUDED.${c}`).join(', ')}, updated_at = now()`
          : 'DO NOTHING';
        await client.query(
          `INSERT INTO facilities (${COLS.join(', ')}) VALUES (${COLS.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT (id) ${conflict}`,
          vals,
        );
      }
    };
    await upsert(toilets, true);
    await upsert(beach, false);
    console.log('[layers] done.');
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(`[layers] ${(e as Error).message}`); process.exit(1); });
