// Clerk's sign-in / sign-up, centred under the brand on any screen size.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="ra-main" tabIndex={-1} className="ra-auth-scroll">
      <a href="/" className="ra-auth-brand" aria-label="Roam Access pilot — back to start">
        <svg width="168" height="40" viewBox="0 0 920 220" aria-hidden="true" focusable="false">
          <g transform="translate(110,150)" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="110">
            <text fill="#0A4F4F" letterSpacing="-5" x="0" y="0">roam</text>
            <text fill="#9C2D0E" x="293" y="0">/</text>
            <text fill="#0A4F4F" letterSpacing="-5" x="338" y="0">access</text>
          </g>
        </svg>
      </a>
      {children}
    </main>
  );
}
