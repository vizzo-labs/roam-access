import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { isAdmin } from '@/lib/auth';
import { DsPreview } from '@/components/pilot/ds/DsPreview';

// The design-system preview. Open in local and Preview builds; admin-only in
// production. Never indexed.
export const metadata: Metadata = {
  title: 'Design system · Roam Access pilot',
  robots: { index: false, follow: false },
};

export default function DsPage() {
  return (
    <Suspense fallback={<p role="status" style={{ padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>Loading…</p>}>
      <Gate/>
    </Suspense>
  );
}

async function Gate() {
  if (process.env.VERCEL_ENV === 'production' && !(await isAdmin())) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px', fontFamily: 'Inter, system-ui, sans-serif', color: '#1A1A1A' }}>
        <h1 style={{ fontSize: 32, letterSpacing: '-0.02em' }}>Not available</h1>
        <p style={{ fontSize: 17, color: '#5A5651' }}>This page is for the pilot team. <Link href="/" style={{ color: '#0A4F4F' }}>Back to the app</Link></p>
      </main>
    );
  }
  return <DsPreview/>;
}
