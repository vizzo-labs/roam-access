// Validate the open-data endpoint against the A11yJSON PlaceInfo schema.
//
//   npm i --no-save @sozialhelden/a11yjson@31     (validator only — not an app dependency)
//   npx tsx scripts/validate-a11yjson.ts http://localhost:3456/api/open-data/venues
//
// Strict: no cleaning, so unknown keys and wrong types fail.

async function main() {
  const url = process.argv[2];
  if (!url) throw new Error('usage: validate-a11yjson <url of /api/open-data/venues>');
  let a11y: { getPlaceInfoSchemaDefinition: () => object };
  let SimpleSchema: new (def: object, opts?: object) => { newContext(): { validate(v: unknown): void; isValid(): boolean; validationErrors(): unknown[] } };
  try {
    a11y = await import('@sozialhelden/a11yjson' as string);
    SimpleSchema = (await import('@sozialhelden/simpl-schema' as string)).default;
  } catch {
    throw new Error('Install the validator first: npm i --no-save @sozialhelden/a11yjson@31');
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const body = await res.json() as { features?: unknown[]; place?: unknown; license?: string };
  const places = body.features ?? (body.place ? [body.place] : []);
  if (!body.license) throw new Error('missing licence (ODbL attribution)');
  const schema = new SimpleSchema(a11y.getPlaceInfoSchemaDefinition(), { humanizeAutoLabels: false });
  let bad = 0, withAccess = 0;
  for (const p of places) {
    const ctx = schema.newContext();
    ctx.validate(p);
    if (!ctx.isValid()) { bad++; if (bad <= 5) console.error(JSON.stringify((p as { properties: { originalId: string } }).properties.originalId), ctx.validationErrors()); }
    if ((p as { properties: { accessibility?: unknown } }).properties.accessibility) withAccess++;
  }
  console.log(`${places.length} places · ${withAccess} with community accessibility · ${bad} invalid · licence ${body.license}`);
  if (bad) process.exit(1);
}

main().catch(e => { console.error((e as Error).message); process.exit(1); });
