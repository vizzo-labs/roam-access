// Fails when two sibling JSX elements share the same `key` expression, e.g.
//
//   <Freshness key={v.id} …/>  …  <AskPlace key={v.id} …/>
//
// React's keyed reconciliation keeps siblings in a map by key, so a duplicate
// overwrites the other entry: when the key changes, the old child is never
// removed and its DOM piles up (the repeated "Last confirmed" cards on the
// venue page). React only warns about it in development, so check statically.
//
//   npm run check:keys            # every .jsx/.tsx under app/ and components/
//   npx tsx scripts/check-jsx-keys.ts --self-test
//
// Runs before `npm run build` (prebuild). Prefix keys to keep them unique:
// key={'fresh-' + v.id}, key={'ask-' + v.id}.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOTS = ['app', 'components'];

export type DuplicateKey = { line: number; key: string };

/** The `key` expression of a JSX child, as source text, or null. */
function keyOf(node: ts.Node, sf: ts.SourceFile): string | null {
  // `cond && <X key/>` occupies one slot; its key is the element's.
  if (ts.isJsxExpression(node) && node.expression) return keyOf(node.expression, sf);
  if (ts.isParenthesizedExpression(node)) return keyOf(node.expression, sf);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return keyOf(node.right, sf);
  const attrs = ts.isJsxElement(node) ? node.openingElement.attributes
    : ts.isJsxSelfClosingElement(node) ? node.attributes : null;
  if (!attrs) return null;
  for (const a of attrs.properties) {
    if (!ts.isJsxAttribute(a) || a.name.getText(sf) !== 'key' || !a.initializer) continue;
    const init = a.initializer;
    const expr = ts.isJsxExpression(init) ? init.expression : init;
    if (!expr) return null;
    // Normalise "x" vs {'x'} vs {"x"} so literal duplicates match too.
    if (ts.isStringLiteralLike(expr)) return JSON.stringify(expr.text);
    return expr.getText(sf).replace(/\s+/g, ' ');
  }
  return null;
}

export function findDuplicateKeys(source: string, fileName = 'x.tsx'): DuplicateKey[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true,
    fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const found: DuplicateKey[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const seen = new Map<string, true>();
      for (const child of node.children) {
        const key = keyOf(child, sf);
        if (key === null) continue;
        if (seen.has(key)) found.push({ line: sf.getLineAndCharacterOfPosition(child.getStart(sf)).line + 1, key });
        else seen.set(key, true);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function* walk(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(jsx|tsx)$/.test(e.name)) yield p;
  }
}

function selfTest() {
  const cases: [string, number][] = [
    ['<div><A key={v.id}/><B key={v.id}/></div>', 1],
    ["<div><A key={'a-' + v.id}/><B key={'b-' + v.id}/></div>", 0],
    ['<><A key="x"/>{ok && <B key={"x"}/>}</>', 1],
    ['<div>{ok ? <A key={k}/> : <B key={k}/>}</div>', 0], // one slot, not siblings
    ['<ul>{xs.map(x => <li key={x.id}/>)}</ul>', 0],
    ['<div><p><A key={k}/></p><p><B key={k}/></p></div>', 0], // cousins, not siblings
  ];
  let ok = true;
  for (const [src, want] of cases) {
    const got = findDuplicateKeys(`const el = ${src};`).length;
    if (got !== want) { ok = false; console.error(`✗ ${src}: expected ${want}, got ${got}`); }
  }
  if (!ok) process.exit(1);
  console.log(`check-jsx-keys self-test: ${cases.length} cases pass`);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const base = path.resolve(__dirname, '..');
  let files = 0, problems = 0;
  for (const root of ROOTS) {
    for (const file of walk(path.join(base, root))) {
      files++;
      for (const d of findDuplicateKeys(fs.readFileSync(file, 'utf8'), file)) {
        problems++;
        console.error(`${path.relative(base, file)}:${d.line}  sibling elements share key={${d.key}} — prefix it so each is unique`);
      }
    }
  }
  if (problems) {
    console.error(`\n${problems} duplicate sibling key(s). React leaves the old element in the page when such a key changes.`);
    process.exit(1);
  }
  console.log(`check-jsx-keys: no duplicate sibling keys in ${files} files`);
}

main();
