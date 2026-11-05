import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Clerk reads the session on every request. API routes check the user
// themselves (401 JSON); the admin page redirects to sign-in.
const isAdmin = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdmin(req)) await auth.protect();
}, { signInUrl: '/sign-in', signUpUrl: '/sign-up' });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params.
    // Also skip /v/… — public venue summaries and the embeddable widget need no
    // session, and Clerk's handshake redirect would break them inside an iframe.
    '/((?!_next|v/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
