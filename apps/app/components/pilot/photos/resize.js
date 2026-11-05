'use client';

import { PHOTO_MAX_EDGE, THUMB_MAX_EDGE } from '@/lib/photos/kinds';

// Resize + compress a photo in the browser before it is uploaded. Drawing it
// on a canvas and re-encoding as JPEG keeps only the pixels: EXIF data —
// including GPS location, camera and time — is not copied. The photo is
// rotated the way it was taken first (EXIF orientation), so nothing looks
// sideways once that data is gone.

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall back */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(source, w, h, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // transparent PNGs become white, not black
  ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, cw, ch);
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality);
  });
}

/** → { photo: Blob, thumb: Blob, width, height } — both JPEG, metadata-free. */
export async function preparePhoto(file) {
  if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('not an image');
  const src = await decode(file);
  const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
  if (!w || !h) throw new Error('unreadable image');
  let photo = await encode(src, w, h, PHOTO_MAX_EDGE, 0.82);
  if (photo.size > 2_000_000) photo = await encode(src, w, h, 1280, 0.72);
  const thumb = await encode(src, w, h, THUMB_MAX_EDGE, 0.75);
  if (typeof src.close === 'function') src.close();
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(w, h));
  return { photo, thumb, width: Math.round(w * scale), height: Math.round(h * scale) };
}
