import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Clerk reads the session on every request. API routes check the user
// themselves (401 JSON); the admin, business and council pages redirect to sign-in.
const isProtected = createRouteMatcher(['/admin(.*)', '/business(.*)', '/council(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
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
