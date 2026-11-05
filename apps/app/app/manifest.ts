import type { MetadataRoute } from 'next';

// Installable on phones (Add to Home Screen) and desktop Chrome/Edge.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Roam Access — pilot',
    short_name: 'Roam Access',
    description: 'Find places around Manly that actually work for you — reviewed by people with lived experience.',
    lang: 'en-AU',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF9F6',
    theme_color: '#FAF9F6',
    categories: ['travel', 'lifestyle', 'navigation'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Search by voice', url: '/#/voice', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Saved places', url: '/#/saved', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
