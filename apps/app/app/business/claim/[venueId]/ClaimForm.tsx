'use client';
import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { claimAction, type ClaimState } from '../../actions';

const ROLES = [
  { id: 'owner', label: 'I own it' },
  { id: 'manager', label: 'I manage it' },
  { id: 'staff', label: 'I work there' },
];

export function ClaimForm({ venueId, venueName, defaults }: { venueId: string; venueName: string; defaults: { name: string; email: string } }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimAction, {});
  const err = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error) err.current?.focus(); }, [state]);
  const v = state.values || {};
  return (
    <form action={action} noValidate>
      {state.error && <div ref={err} tabIndex={-1} role="alert" className="flash err">{state.error}</div>}
      <input type="hidden" name="venueId" value={venueId}/>

      <fieldset>
        <legend>How are you connected to {venueName}?</legend>
        {ROLES.map((r, i) => (
          <label key={r.id} className="check">
            <input type="radio" name="role" value={r.id} defaultChecked={(v.role || 'owner') === r.id} required={i === 0}/>
            {r.label}
          </label>
        ))}
      </fieldset>

      <label htmlFor="contactName">Your name</label>
      <p className="hint" id="contactName-hint">Only the pilot team sees this. It’s never shown with reviews.</p>
      <input id="contactName" name="contactName" type="text" autoComplete="name" required aria-describedby="contactName-hint" defaultValue={v.contactName ?? defaults.name}/>

      <label htmlFor="contactEmail">Work email</label>
      <p className="hint" id="contactEmail-hint">An address on the venue’s own website domain is the quickest way to verify.</p>
      <input id="contactEmail" name="contactEmail" type="email" autoComplete="email" required aria-describedby="contactEmail-hint" defaultValue={v.contactEmail ?? defaults.email}/>

      <label htmlFor="contactPhone">Phone (optional)</label>
      <input id="contactPhone" name="contactPhone" type="tel" autoComplete="tel" defaultValue={v.contactPhone ?? ''}/>

      <label htmlFor="evidence">How can we check you’re with the venue? (optional)</label>
      <p className="hint" id="evidence-hint">For example: “Call the venue and ask for Sam”, or a link to a page that names you.</p>
      <textarea id="evidence" name="evidence" maxLength={1000} aria-describedby="evidence-hint" defaultValue={v.evidence ?? ''}/>

      <label className="check" style={{ marginTop: '1.25rem' }}>
        <input type="checkbox" name="agree" value="yes" defaultChecked={v.agree === 'yes'}/>
        <span>I understand that claiming {venueName} never changes its reviews, its verdict or its place in results, and that what I write shows as “Venue says”.</span>
      </label>

      <div className="btn-row">
        <button className="btn" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send my claim'}</button>
        <Link className="btn ghost" href="/business">Cancel</Link>
      </div>
    </form>
  );
}
