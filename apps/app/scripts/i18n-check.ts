// npm run i18n:check — translation health for the pilot app (#21).
//  · keys used in code (t('…')) that English doesn't have        → error
//  · translations with keys English doesn't have                  → error
//  · {placeholders} that differ from English                       → error
//  · missing translations (fall back to English) per language      → listed
//  · machine-translated vs human-reviewed counts per language      → listed
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import en from '../lib/i18n/messages/en';
import zh from '../lib/i18n/messages/zh-Hans';
import ja from '../lib/i18n/messages/ja';
import ko from '../lib/i18n/messages/ko';
import es from '../lib/i18n/messages/es';
import { meta as zhMeta } from '../lib/i18n/messages/zh-Hans/_meta';
import { meta as jaMeta } from '../lib/i18n/messages/ja/_meta';
import { meta as koMeta } from '../lib/i18n/messages/ko/_meta';
import { meta as esMeta } from '../lib/i18n/messages/es/_meta';
import type { Dict, Msg } from '../lib/i18n/core';

const ROOT = join(__dirname, '..');
const verbose = process.argv.includes('--missing');
let errors = 0;
const err = (s: string) => { errors++; console.error('  ✗ ' + s); };

const holes = (m: Msg) => {
  const all = typeof m === 'string' ? m : Object.values(m).join(' ');
  return [...new Set(all.match(/\{\w+\}/g) || [])].sort().join(',');
};

// 1 · keys used in code
const files: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (f !== 'node_modules' && f !== 'messages') walk(p); }
    else if (/\.(jsx?|tsx?)$/.test(f)) files.push(p);
  }
};
['components/pilot', 'lib', 'app/(app)'].forEach(d => walk(join(ROOT, d)));
const used = new Set<string>();
for (const f of files) {
  // Comments may show example keys: skip them.
  const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z][\w.-]*\.[\w.-]+)'/g)) used.add(m[1]);
}
console.log(`English: ${Object.keys(en).length} strings · ${used.size} literal keys used in code`);
for (const k of used) if (!(k in en)) err(`code uses '${k}', which isn't in English`);

// 2 · each translation
const langs: [string, Dict, { reviewedAll: boolean; reviewed: string[] }][] = [
  ['zh-Hans', zh, zhMeta], ['ja', ja, jaMeta], ['ko', ko, koMeta], ['es', es, esMeta],
];
for (const [id, dict, meta] of langs) {
  const missing = Object.keys(en).filter(k => !(k in dict));
  for (const k of Object.keys(dict)) {
    if (!(k in en)) { err(`${id}: '${k}' isn't in English`); continue; }
    if (holes(dict[k]) !== holes(en[k])) err(`${id}: '${k}' placeholders ${holes(dict[k]) || '(none)'} ≠ English ${holes(en[k]) || '(none)'}`);
    if (typeof en[k] !== 'string' && typeof dict[k] === 'string') err(`${id}: '${k}' must have plural forms like English`);
  }
  const reviewed = meta.reviewedAll ? Object.keys(dict).length : meta.reviewed.filter(k => k in dict).length;
  console.log(`${id.padEnd(8)} ${Object.keys(dict).length} translated · ${missing.length} missing (English shown) · ${reviewed} reviewed by a person, ${Object.keys(dict).length - reviewed} machine-translated`);
  if (verbose && missing.length) console.log('    missing: ' + missing.join(', '));
}

if (errors) { console.error(`\n${errors} problem(s).`); process.exit(1); }
console.log('\ni18n — ok');
