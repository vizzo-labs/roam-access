import Link from 'next/link';
import type { ReactNode } from 'react';
import { V2Logo } from '@/components/pilot/ui/Logo';
import './portal.css';

const Logo = V2Logo as unknown as (p: { size: number }) => React.ReactElement;

// Page frame for the business, council and admin-venues pages.
export function Portal({ area, current, children }: { area: string; current?: 'business' | 'council' | 'admin'; children: ReactNode }) {
  const nav = [
    { id: 'app', href: '/', label: 'Back to the app' },
    { id: 'business', href: '/business', label: 'Businesses' },
    { id: 'council', href: '/council', label: 'Council' },
  ];
  return (
    <div className="pt">
      <a className="pt-skip" href="#pt-main">Skip to main content</a>
      <header className="pt-head">
        <div className="pt-head-in">
          <Link href="/" className="pt-brand" aria-label="Roam Access — open the app">
            <Logo size={36}/>
          </Link>
          <span className="pt-brand"><span>{area}</span></span>
          <nav className="pt-nav" aria-label="Sections">
            {nav.map(n => <a key={n.id} href={n.href} aria-current={current === n.id ? 'page' : undefined}>{n.label}</a>)}
          </nav>
        </div>
      </header>
      <main id="pt-main" className="pt-main" tabIndex={-1}>{children}</main>
    </div>
  );
}

export function Stat({ n, label }: { n: ReactNode; label: string }) {
  return <div className="pt-stat"><b>{n}</b><span>{label}</span></div>;
}

const VERDICT_PILL = {
  works: { icon: '✓', label: 'Works' },
  check: { icon: '!', label: 'Check first' },
  barrier: { icon: '✗', label: 'Barrier' },
} as const;

export function VerdictPill({ kind, label }: { kind: 'works' | 'check' | 'barrier'; label?: string }) {
  const m = VERDICT_PILL[kind];
  return <span className={`pill ${kind}`}><i aria-hidden="true">{m.icon}</i>{label ?? m.label}</span>;
}

export function NotAllowed({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h1>{title}<span className="dot">.</span></h1>
      <p className="lead">{children}</p>
      <p><Link href="/">Back to the app</Link></p>
    </>
  );
}
