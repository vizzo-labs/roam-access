// Headless Chrome over the DevTools protocol, no npm packages (Node 22+).
//
//   node chrome.mjs shot <url> <out.png> <width> <height> [scale]   waits for document.title === 'READY'
//   node chrome.mjs pdf  <url> <out.pdf>                             A4, print backgrounds, CSS page size
//
// Used by render_maps.sh to turn maps/render.html into static zone maps, and to print
// kit.html / flyer.html to PDF. Mapping-day kit only: not part of the app.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [mode, url, out, w = '1000', h = '780', scale = '2'] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 600);
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'md-chrome-'))}`,
  'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}

const ws = new WebSocket(await target());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });

try {
  await send('Page.enable');
  if (mode === 'shot') await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: +scale, mobile: false });
  await send('Page.navigate', { url });
  const until = Date.now() + 60000;
  for (;;) {
    const { result } = await send('Runtime.evaluate', { expression: mode === 'shot' ? 'document.title' : 'document.readyState' });
    if (result.value === (mode === 'shot' ? 'READY' : 'complete')) break;
    if (Date.now() > until) throw new Error('Timed out waiting for the page');
    await sleep(250);
  }
  await sleep(mode === 'shot' ? 600 : 1500);
  if (mode === 'shot') {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(out, Buffer.from(data, 'base64'));
  } else {
    // Stream the PDF back in chunks: a long document in one message can stall the socket.
    const { stream } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, paperWidth: 8.27, paperHeight: 11.69, transferMode: 'ReturnAsStream' });
    const parts = [];
    for (;;) {
      const r = await send('IO.read', { handle: stream, size: 1 << 20 });
      parts.push(Buffer.from(r.data, r.base64Encoded ? 'base64' : 'utf8'));
      if (r.eof) break;
    }
    await send('IO.close', { handle: stream });
    writeFileSync(out, Buffer.concat(parts));
  }
  console.log(out);
} finally {
  ws.close(); proc.kill();
}
