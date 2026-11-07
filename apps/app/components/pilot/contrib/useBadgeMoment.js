'use client';
// The "New badge" moment (Brief L). Earned badge ids come from the server
// (bootstrap, and each sent review); the ones this device has already
// celebrated are kept in localStorage. The first load on a device only
// records what's there — nothing pops up for badges earned before.
import { useCallback, useEffect, useRef, useState } from 'react';

const keyOf = userId => `ra-contrib-badges-${userId}`;
const read = key => { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(v) ? v : null; } catch (e) { return null; } };
const write = (key, ids) => { try { localStorage.setItem(key, JSON.stringify(ids)); } catch (e) {} };

/** Badges in `earned` this device hasn't celebrated yet (and remember them). */
function takeFresh(key, earned) {
  if (!Array.isArray(earned)) return [];
  const seen = read(key);
  write(key, [...new Set([...(seen || []), ...earned])]);
  return seen ? earned.filter(id => !seen.includes(id)) : [];
}

export function useBadgeMoment(userId, initialEarned, toast, t) {
  const key = keyOf(userId);
  const [pending, setPending] = useState(() => takeFresh(key, initialEarned));
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const say = useCallback(ids => {
    const tt = tRef.current;
    toast(tt('contrib.newBadge.toast', { name: ids.map(id => tt(`contrib.badge.${id}`)).join(', ') }));
  }, [toast]);

  // Earned since this device last looked (e.g. arrival steps, a mapping day):
  // a toast (a live region) says so; Me shows the card.
  const first = useRef(pending);
  useEffect(() => { if (first.current.length) say(first.current); }, [say]);

  // After a review: shown on the Thanks screen (quiet: no toast).
  const update = useCallback((earned, { quiet = false } = {}) => {
    const fresh = takeFresh(key, earned);
    if (!fresh.length) return;
    setPending(p => [...new Set([...p, ...fresh])]);
    if (!quiet) say(fresh);
  }, [key, say]);

  const clear = useCallback(() => setPending([]), []);
  return { pending, update, clear };
}
