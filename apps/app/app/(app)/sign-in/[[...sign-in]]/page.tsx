import { Suspense } from 'react';
import { AuthShell } from '../../auth-shell';
import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign in · Roam Access pilot' };

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="ra-loading" role="status">Loading…</p>}>
        <SignIn/>
      </Suspense>
    </AuthShell>
  );
}
