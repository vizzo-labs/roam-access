'use client';
// PWA plumbing: service worker registration + the install prompt.
// `beforeinstallprompt` can fire before any screen mounts, so it is captured
// once, globally, and screens subscribe to changes.
import { useEffect, useState } from 'react';

let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

export function initPwa() {
  if (typeof window === 'undefined' || window.__raPwa) return;
  window.__raPwa = true;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; notify(); });
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
  }
}

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return {
    standalone,
    ios,
    canPrompt: !!deferred,
    prompt: async () => {
      if (!deferred) return false;
      const e = deferred;
      deferred = null;
      e.prompt();
      const { outcome } = await e.userChoice;
      notify();
      return outcome === 'accepted';
    },
  };
}

export function PwaInit() {
  useEffect(() => { initPwa(); }, []);
  return null;
}
