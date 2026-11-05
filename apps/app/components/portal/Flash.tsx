'use client';
import { useEffect, useRef } from 'react';

// A result message after a form posts and the page reloads: moves focus to
// itself so screen readers announce it, and keyboard users start from it.
export function Flash({ kind = 'ok', children }: { kind?: 'ok' | 'err'; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <div ref={ref} tabIndex={-1} role={kind === 'err' ? 'alert' : 'status'} className={`flash ${kind}`}>{children}</div>;
}
