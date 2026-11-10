import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { PwaInit } from '@/components/pilot/pwa';
import { metadataOrigin } from '@/lib/site-url';
import './globals.css';

export const metadata: Metadata = {
  // Absolute URLs in link previews (og:url): the public address when one is
  // set (NEXT_PUBLIC_SITE_URL), else this deployment's own.
  metadataBase: new URL(metadataOrigin()),
  title: 'Roam Access pilot',
  description: 'Find places in Manly that actually work for you — a pilot built with the disability community.',
  // Pilot with sign-in and reviews of real businesses: keep it out of search.
  robots: { index: false, follow: false },
  applicationName: 'Roam Access',
  appleWebApp: { capable: true, title: 'Roam Access', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  openGraph: { type: 'website', siteName: 'Roam Access', locale: 'en_AU' },
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#FAF9F6',
};

// Clerk's own screens, in the brand's palette and type.
const clerkAppearance = {
  variables: {
    colorPrimary: '#0A4F4F', colorPrimaryForeground: '#FAF9F6', colorDanger: '#9C2D0E',
    colorForeground: '#1A1A1A', colorMutedForeground: '#5A5651', colorBackground: '#FAF9F6',
    colorInput: '#FAF9F6', colorInputForeground: '#1A1A1A', colorBorder: '#8A8680',
    fontFamily: 'Inter, -apple-system, system-ui, sans-serif', fontSize: '16px', borderRadius: '12px',
  },
  elements: {
    rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
    cardBox: { boxShadow: 'none', border: 'none', width: '100%', maxWidth: '393px' },
    card: { boxShadow: 'none', border: 'none', background: 'transparent' },
    formButtonPrimary: { minHeight: '52px', fontSize: '17px', fontWeight: 700 },
    formFieldInput: { minHeight: '52px', fontSize: '16px' },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // lang follows the chosen language on the client (#21) — set before paint.
    <html lang="en-AU" dir="ltr" suppressHydrationWarning>
      <body>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/" appearance={clerkAppearance}>
          {children}
        </ClerkProvider>
        <PwaInit/>
      </body>
    </html>
  );
}
