/* eslint-disable @next/next/no-html-link-for-pages -- links into the app need a full page load (its layout script sets up the phone shell) */
import './public.css';
import { V2Logo } from '@/components/pilot/ui/Logo';

// Frame for public pages: skip link, logo home, main landmark, footer.
export function PublicShell({ children, tag = 'Manly pilot', foot = null }: { children: React.ReactNode; tag?: string; foot?: React.ReactNode }) {
  return (
    <div className="pub">
      <a className="ra-skip" href="#main">Skip to main content</a>
      <header className="pub-head">
        <a href="/" aria-label="Roam Access — open the app"><V2Logo size={26} fill={undefined} slashFill={undefined}/></a>
        <span className="pub-tag">{tag}</span>
      </header>
      <main id="main" tabIndex={-1} className="pub-main">{children}</main>
      <footer className="pub-foot">
        {foot}
        <p style={{ margin: 0 }}>
          Roam Access helps people with disability find places that work for them, from reviews by people with the same needs.
          Place details © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>.
        </p>
      </footer>
    </div>
  );
}
