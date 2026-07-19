// Stamp a content-derived version onto the app script/font URLs in app/index.html.
// GitHub Pages caches assets for 10 minutes; without this, a deploy can pair new
// HTML with stale cached JS at the same URL and break the page mid-cache-window.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const hash = createHash('sha256');
for (const f of readdirSync('app/js').sort()) hash.update(readFileSync(`app/js/${f}`));
const v = hash.digest('hex').slice(0, 10);

const p = 'app/index.html';
const html = readFileSync(p, 'utf8').replace(
  /(src="(?:js|vendor)\/[^"?]+)(?:\?v=[^"]*)?"/g,
  `$1?v=${v}"`,
);
writeFileSync(p, html);
console.log(`stamped ?v=${v}`);
