import 'server-only';

// Server-side defence in depth for uploaded photos. The client already
// re-encodes every photo through a canvas (which drops EXIF/GPS), but we never
// trust the client: this checks the file really is a baseline/progressive JPEG,
// reads its size, and removes every metadata segment (APP1–APP15: EXIF, GPS,
// XMP, ICC, maker notes…; COM comments) before it is stored.

export type JpegInfo = { width: number; height: number };

export function sanitiseJpeg(input: Uint8Array): { bytes: Uint8Array; info: JpegInfo } | null {
  const b = input;
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const out: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  let info: JpegInfo | null = null;
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    let marker = b[i + 1];
    // Fill bytes (0xFF padding) are allowed between segments.
    while (marker === 0xff && i + 2 < b.length) { i++; marker = b[i + 1]; }
    if (marker === 0xd9) { out.push(b.subarray(i, i + 2)); i += 2; break; } // EOI
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { out.push(b.subarray(i, i + 2)); i += 2; continue; }
    if (i + 4 > b.length) return null;
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2 || i + 2 + len > b.length) return null;
    const seg = b.subarray(i, i + 2 + len);
    const isApp = marker >= 0xe1 && marker <= 0xef; // keep APP0 (JFIF) only
    const isCom = marker === 0xfe;
    // SOF0–SOF15 except DHT (C4), JPG (C8), DAC (CC) carry the dimensions.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker) && len >= 7) {
      info = { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
    }
    if (!isApp && !isCom) out.push(seg);
    i += 2 + len;
    if (marker === 0xda) {
      // Start of scan: entropy-coded data runs to the next real marker.
      let j = i;
      while (j + 1 < b.length) {
        if (b[j] === 0xff && b[j + 1] !== 0x00 && !(b[j + 1] >= 0xd0 && b[j + 1] <= 0xd7)) break;
        j++;
      }
      out.push(b.subarray(i, j));
      i = j;
    }
  }
  if (!info || !info.width || !info.height) return null;
  const total = out.reduce((n, s) => n + s.length, 0);
  const bytes = new Uint8Array(total);
  let o = 0;
  for (const s of out) { bytes.set(s, o); o += s.length; }
  return { bytes, info };
}
