import { Suspense } from 'react';
import { AuthShell } from '../../auth-shell';
import { SignUp } from '@clerk/nextjs';

export const metadata = { title: 'Join the pilot · Roam Access' };

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="ra-loading" role="status">Loading…</p>}>
        <SignUp/>
      </Suspense>
    </AuthShell>
  );
}
