// Public policy page: how verdicts are made, where information comes from and
// how it's labelled, "payment never changes a verdict", and a privacy summary.
// Static (no data, no sign-in). Linked from Welcome, the venue page and Me.

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Roam Access works · Roam Access pilot',
  description: 'How verdicts are made, where the information comes from, why payment never changes a verdict, and how we look after your information.',
};

const C = {
  teal: '#0A4F4F', rust: '#9C2D0E', char: '#1A1A1A', slate: '#5A5651', line: '#8A8680', hair: '#E5E2DA',
  paper: '#FAF9F6', stone: '#EDEAE2',
  blue: '#1E5F8B', blueBg: '#E5EEF5', amber: '#854D0E', amberBg: '#F6ECDD', red: '#9C2D0E', redBg: '#F6E2DA',
};
const F = 'Inter, -apple-system, system-ui, sans-serif';
const M = '"JetBrains Mono", ui-monospace, monospace';

const VERDICTS = [
  { icon: '✓', label: 'Works for you', fg: C.blue, bg: C.blueBg,
    text: 'People in the pilot confirmed the things that matter for your needs, and nobody reported a barrier for them. Only community reviews can give this verdict.' },
  { icon: '!', label: 'Check first', fg: C.amber, bg: C.amberBg,
    text: 'Something is worth knowing before you go — mixed reports, a workaround, or information nobody has confirmed yet.' },
  { icon: '✗', label: 'Has barriers', fg: C.red, bg: C.redBg,
    text: 'People reported a real barrier for your needs, such as steps with no other way in. We list the specific reasons and how many people reported each.' },
  { icon: '?', label: 'No info yet', fg: '#475569', bg: '#E7EAEF',
    text: 'Nobody has told us anything about this place that touches your needs. We never guess.' },
];

const SOURCES = [
  { name: 'Community', example: 'Based on 3 wheelchair or mobility aid users · latest 6 weeks ago',
    text: 'Reviews from people taking part in the pilot. We show how many people stand behind each fact and how recent the latest report is. This is the only source that can make a place “Works for you”.' },
  { name: 'OpenStreetMap (unconfirmed)', example: 'Listed as wheelchair accessible on OpenStreetMap — not yet confirmed by the community',
    text: 'Place names, addresses and some access tags come from OpenStreetMap, an open map anyone can edit. We always show these as “Check first — not yet confirmed”, never as a fact.' },
  { name: 'Venue says (coming later)', example: 'Venue says: accessible bathroom (not checked by the community)',
    text: 'Venues will be able to add their own information. It will always be labelled as the venue’s claim, and it can never make a place “Works for you” on its own.' },
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} style={{ fontSize: 24, letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.2 }}>{children}</h2>;
}
const p = { fontSize: 17, lineHeight: 1.6, margin: '0 0 14px' } as const;
const section = { marginTop: 40 } as const;
const li = { fontSize: 17, lineHeight: 1.6, marginBottom: 8 } as const;

export default function HowItWorks() {
  return (
    <div style={{ background: C.paper, minHeight: '100vh', color: C.char, fontFamily: F }}>
      <a href="#how-main" className="ra-skip">Skip to main content</a>
      <header style={{ borderBottom: `1px solid ${C.hair}`, padding: '12px 22px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48, color: C.teal, fontWeight: 700, fontSize: 17, textUnderlineOffset: 4 }}>
            ← Back to Roam Access
          </Link>
          <span style={{ fontFamily: M, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.slate }}>Manly pilot</span>
        </div>
      </header>

      <main id="how-main" tabIndex={-1} style={{ maxWidth: 720, margin: '0 auto', padding: '32px 22px 64px', outline: 'none' }}>
        <p style={{ fontFamily: M, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.slate, margin: '0 0 12px' }}>
          Our rules, in plain words
        </p>
        <h1 style={{ fontSize: 40, lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
          How Roam Access works<span style={{ color: C.rust }}>.</span>
        </h1>
        <p style={{ ...p, fontSize: 19 }}>
          Roam Access tells you whether a place will work for <strong>you</strong>, from reviews by people with the same needs.
          Here is how we decide, where the information comes from, and what we will never do.
        </p>

        <nav aria-label="On this page" style={{ background: C.stone, borderRadius: 16, padding: '14px 18px', margin: '20px 0 0' }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {[['verdicts', 'How a verdict is made'], ['sources', 'Where information comes from'], ['fresh', 'Keeping it up to date'],
              ['payment', 'Payment never changes a verdict'], ['privacy', 'Your privacy']].map(([id, t]) => (
              <li key={id} style={{ fontSize: 16.5, lineHeight: 1.4 }}>
                <a href={`#${id}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: C.teal, fontWeight: 600, textUnderlineOffset: 3 }}>{t}</a>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="verdicts" style={section}>
          <H2 id="verdicts">How a verdict is made</H2>
          <p style={p}>
            When you join, you tell us what you need — for example “I use a wheelchair” or “Calm, low-stress places help me”.
            Every place then gets one verdict <strong>for you</strong>, worked out only from what people reported about the
            things that matter to your needs. A step doesn’t stop a deaf person; loud music doesn’t stop a wheelchair user.
          </p>
          <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0 }}>
            {VERDICTS.map(v => (
              <li key={v.label} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', alignItems: 'flex-start', padding: '14px 0', borderTop: `1px solid ${C.hair}` }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, background: v.bg, color: v.fg, fontWeight: 700,
                  fontSize: 15, padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  <span aria-hidden="true" style={{
                    width: 20, height: 20, borderRadius: 999, background: v.fg, color: v.bg, fontFamily: M, fontWeight: 800,
                    fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{v.icon}</span>
                  {v.label}
                </span>
                <span style={{ fontSize: 16.5, lineHeight: 1.55, flex: '1 1 260px' }}>{v.text}</span>
              </li>
            ))}
          </ul>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={li}>A barrier for your needs outweighs everything else. When reports are evenly split, we choose the more cautious verdict.</li>
            <li style={li}>A step at the main door doesn’t hide a ramp round the side: if people report another step-free way in, we say where.</li>
            <li style={li}>When something is missing, we say so specifically — for example “No accessible loo — 2 reports” — not just “Has barriers”.</li>
          </ul>
        </section>

        <section aria-labelledby="sources" style={section}>
          <H2 id="sources">Where information comes from</H2>
          <p style={p}>Every verdict and every fact shows its source, and how recent it is, so you can decide how far to trust it.</p>
          {SOURCES.map(s => (
            <div key={s.name} style={{ border: `1.5px solid ${C.line}`, borderRadius: 16, padding: '16px 18px', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, margin: '0 0 6px' }}>{s.name}</h3>
              <p style={{ ...p, fontSize: 16.5, margin: '0 0 8px' }}>{s.text}</p>
              <p style={{ fontSize: 15, color: C.slate, margin: 0, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>Shown as:</span> “{s.example}”
              </p>
            </div>
          ))}
        </section>

        <section aria-labelledby="fresh" style={section}>
          <H2 id="fresh">Keeping it up to date</H2>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={li}>Every place shows when it was <strong>last confirmed</strong> by someone in the pilot.</li>
            <li style={li}>If you’ve been lately, tap <strong>“Still accurate?”</strong>. A “yes” updates the date — it never changes the verdict. Only reviews do that.</li>
            <li style={li}>Use <strong>“Report a problem”</strong> if a place has closed, moved, is in the wrong spot on the map, or is listed twice. The pilot team checks every report.</li>
          </ul>
        </section>

        <section aria-labelledby="payment" style={{ ...section, background: C.stone, borderRadius: 18, padding: '22px 22px 10px' }}>
          <H2 id="payment">Payment never changes a verdict</H2>
          <p style={p}>
            In the future, venues, councils or sponsors may pay us — for example to reply to reviews, to see what visitors need,
            or to be featured. <strong>None of that will ever change a verdict</strong>, the order of places by verdict, or which
            reviews you see. A paid listing may look different, and will be clearly labelled, but a place that doesn’t work
            for you will still say so.
          </p>
          <p style={p}>Using Roam Access is free for people with disability. Always.</p>
        </section>

        <section aria-labelledby="privacy" style={section}>
          <H2 id="privacy">Your privacy</H2>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={li}>Your access needs are sensitive information under the Privacy Act. We use them only to personalise verdicts and to label your reviews.</li>
            <li style={li}>Reviews are shown by lived experience — for example “Wheelchair user” — <strong>never by your name</strong>.</li>
            <li style={li}>We never sell your information or share your needs with venues, councils or advertisers.</li>
            <li style={li}>Me → Delete my account removes your needs, reviews, saved places, confirmations and reports. It can’t be undone.</li>
          </ul>
          <p style={p}>
            Read the full{' '}
            <a href="https://roamaccess.com.au/privacy.html" style={{ color: C.teal, fontWeight: 600, textUnderlineOffset: 3 }}>privacy policy</a>
            {' '}or email{' '}
            <a href="mailto:helloroamaccess@gmail.com" style={{ color: C.teal, fontWeight: 600, textUnderlineOffset: 3 }}>helloroamaccess@gmail.com</a>.
          </p>
        </section>

        <p style={{ marginTop: 40 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 56, padding: '0 24px',
            borderRadius: 16, background: C.teal, color: C.paper, fontWeight: 700, fontSize: 17, textDecoration: 'none',
          }}>Back to Roam Access</Link>
        </p>
        <p style={{ fontSize: 13.5, color: C.slate, margin: '24px 0 0' }}>Place data © OpenStreetMap contributors.</p>
      </main>
    </div>
  );
}
