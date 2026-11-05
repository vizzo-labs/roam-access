'use client';
// Read aloud (#21): Web Speech API helpers. Never autoplays — speech starts
// only from a button press (iOS Safari also requires that), and the whole
// feature can be switched off in Accessibility settings.

import React from 'react';

const KEY = 'ra-speech';
const DEFAULTS = { enabled: true, rate: 1 };
let prefs = null;
const subs = new Set();

function load() {
  if (prefs) return prefs;
  try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { prefs = { ...DEFAULTS }; }
  return prefs;
}
export function setSpeechPrefs(partial) {
  prefs = { ...load(), ...partial };
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* private mode */ }
  if (!prefs.enabled) stopSpeaking();
  subs.forEach(f => f());
}
/** { enabled, rate } — saved on this device. */
export function useSpeechPrefs() {
  return React.useSyncExternalStore(
    f => { subs.add(f); return () => subs.delete(f); },
    () => load(),
    () => DEFAULTS,
  );
}

export const speechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

const noSubscribe = () => () => {};
/** false on the server and during hydration, then whether speech works here. */
export const useSpeechSupported = () => React.useSyncExternalStore(noSubscribe, speechSupported, () => false);

// Voices load asynchronously in Chrome (voiceschanged) and are ready
// synchronously in Safari. Keep the latest list.
let voices = [];
function refreshVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch { voices = []; } }
export function warmVoices() {
  if (!speechSupported()) return;
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

const norm = l => (l || '').replace('_', '-').toLowerCase();
/** The best installed voice for a BCP 47 language: exact match, then same
 *  language (zh-CN for zh-Hans), preferring the default, then local voices. */
export function pickVoice(lang) {
  if (!voices.length) refreshVoices();
  const want = norm(lang);
  const base = want.split('-')[0];
  const score = v => {
    const l = norm(v.lang);
    let s = 0;
    if (l === want) s += 100;
    else if (l.split('-')[0] === base) s += 50;
    else return -1;
    if (base === 'zh' && /hant|tw|hk/.test(l)) s -= 30;  // Simplified Chinese, not Taiwan/HK voices
    if (base === 'en' && /en-(au|gb)/.test(l)) s += 5;  // closer to en-AU than en-US
    if (v.default) s += 3;
    if (v.localService) s += 2;
    if (/enhanced|premium|natural/i.test(v.name)) s += 4;
    return s;
  };
  return voices.map(v => [v, score(v)]).filter(([, s]) => s >= 0).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

/** Split into sentence-sized chunks: Chrome stops long utterances after ~15 s. */
export function chunks(text, max = 180) {
  const parts = String(text).replace(/\s+/g, ' ').trim().match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [];
  const out = [];
  for (const p of parts) {
    const s = p.trim();
    if (!s) continue;
    if (out.length && (out[out.length - 1] + ' ' + s).length <= max) out[out.length - 1] += ' ' + s;
    else if (s.length <= max) out.push(s);
    else for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max));
  }
  return out;
}

let current = null; // the onDone of whatever is speaking now
export function stopSpeaking() {
  if (!speechSupported()) return;
  const done = current; current = null;
  window.speechSynthesis.cancel();
  done?.();
}

/** Speak `text` in `lang`. Must be called from a user gesture. Returns false
 *  if speech isn't available. onDone runs once when it ends or is stopped. */
export function speak(text, lang, { rate = 1, onDone } = {}) {
  if (!speechSupported()) return false;
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) stopSpeaking();
  const list = chunks(text);
  if (!list.length) return false;
  const voice = pickVoice(lang);
  let finished = false;
  const finish = () => { if (finished) return; finished = true; if (current === finish) current = null; onDone?.(); };
  current = finish;
  list.forEach((c, i) => {
    const u = new window.SpeechSynthesisUtterance(c);
    u.lang = voice?.lang || lang;
    if (voice) u.voice = voice;
    u.rate = rate;
    if (i === list.length - 1) { u.onend = finish; u.onerror = finish; }
    synth.speak(u);
  });
  // Safari can leave the queue paused after a previous cancel.
  if (synth.paused) synth.resume();
  return true;
}
