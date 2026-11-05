'use client';

import React from 'react';
import { RA2_VOICE_EXAMPLES } from '@/lib/pilot-data';
import { V2Mic } from '../ui/Mic';
import { V2Shell } from '../ui/Shell';
import { C2, F2, M2 } from '../ui/palette';
import { useV2Heading } from '../ui/useHeading';
import { ra2ParseQuery } from '@/lib/pilot/match';

// ─────────────────────────────────────────────────────────────
// VOICE — real speech recognition, seamless scripted fallback
// ─────────────────────────────────────────────────────────────
function V2Voice({ app }) {
  const [mode, setMode] = React.useState('starting'); // starting | listening | demo
  const [transcript, setTranscript] = React.useState('');
  // Set by the effect below; lets the example chips finish the flow too.
  const finalizeRef = React.useRef(() => {});

  // One self-contained lifecycle, mounted once per visit. Everything —
  // recognition, scripted fallback, timers — lives and dies inside it, so no
  // re-render can strand the screen. The demo can never dead-end: no mic, no
  // permission, no speech, and even a hung permission prompt all fall through
  // to the scripted search.
  React.useEffect(() => {
    let done = false;
    let demoRunning = false;
    let rec = null;
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

    const finalize = (text) => {
      if (done) return;
      done = true;
      if (rec) { try { rec.abort(); } catch (e) {} }
      app.runSearch(ra2ParseQuery(text));
    };
    finalizeRef.current = finalize;

    // No speech engine, no permission, or nothing heard: say so plainly and
    // offer the examples or typing — never invent a query for the tester.
    const startDemo = () => {
      if (done || demoRunning) return;
      demoRunning = true;
      if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
      setMode('unavailable');
    };

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      startDemo();
    } else {
      let latest = '';
      let silence = null;
      rec = new SR();
      rec.lang = 'en-AU';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => { if (!done && !demoRunning) setMode('listening'); };
      rec.onresult = (e) => {
        if (done || demoRunning) return;
        let text = '';
        let final = false;
        for (const res of e.results) {
          text += res[0].transcript;
          if (res.isFinal) final = true;
        }
        latest = text.trim();
        setTranscript(latest);
        // Some engines (iOS Safari) never send a final result or onend; a
        // short silence after the last words finalizes instead.
        if (silence) clearTimeout(silence);
        if (final && latest) later(() => finalize(latest), 500);
        else if (latest) silence = later(() => finalize(latest), 2000);
      };
      rec.onerror = () => { if (!latest) startDemo(); };
      rec.onend = () => {
        if (done || demoRunning) return;
        if (latest) finalize(latest);
        else startDemo();
      };
      try { rec.start(); } catch (e) { startDemo(); }
      // Safety net: mic silent, permission hung, anything — 7s then demo.
      later(() => { if (!latest) startDemo(); }, 7000);
      // Hard cap: whatever was heard by now is the query.
      later(() => { if (latest) finalize(latest); }, 15000);
    }

    return () => {
      done = true;
      if (rec) { try { rec.abort(); } catch (e) {} }
      timers.forEach(clearTimeout);
    };
  }, []); // eslint-disable-line

  const finalize = (text) => finalizeRef.current(text);

  const statusLabel = mode === 'listening' ? 'Listening…' : mode === 'unavailable' ? 'Couldn’t hear you' : 'Getting ready…';
  const h = useV2Heading('voice');

  return (
    <V2Shell bg={C2.teal}>
      <h1 ref={h} tabIndex={-1} className="ra-sr-only">Voice search</h1>
      <div data-ra-oncolor="" style={{ padding: '14px 22px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => app.goto('home')} style={{
          minHeight: 48, padding: '0 20px', borderRadius: 999, border: '1.5px solid rgba(250,249,246,0.45)',
          background: 'transparent', color: C2.paper, fontFamily: F2, fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}>Cancel</button>
      </div>

      <div style={{ padding: '34px 26px 0', textAlign: 'center' }} data-ra-oncolor="">
        <div aria-hidden="true" style={{
          width: 120, height: 120, borderRadius: 999, margin: '0 auto 14px',
          background: 'rgba(250,249,246,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className={mode === 'listening' ? 'ra-pulse' : ''} style={{
            width: 84, height: 84, borderRadius: 999, background: C2.rust,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <V2Mic size={38}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 26, height: 32, alignItems: 'center' }} aria-hidden="true">
          {[10, 22, 14, 30, 18, 26, 12].map((hh, i) => (
            <span key={i} className={mode === 'listening' ? 'ra-bar' : ''} style={{
              width: 5, height: hh, borderRadius: 3, background: 'rgba(250,249,246,0.65)',
              animationDelay: `${i * 0.12}s`,
            }}/>
          ))}
        </div>

        <p role="status" style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.14em', color: 'rgba(250,249,246,0.7)', textTransform: 'uppercase', margin: '0 0 16px' }}>
          {statusLabel}
        </p>

        {/* Deliberately NOT a live region: the typewriter and interim speech
            results mutate this dozens of times — a live region here would
            announce every keystroke. The route announcer covers arrival on
            the results screen. */}
        <p style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25,
          color: C2.paper, margin: '0 auto', maxWidth: 300, minHeight: 96, fontFamily: F2,
        }}>
          {transcript ? `“${transcript}”` : mode === 'unavailable'
            ? <span style={{ display: 'block', fontSize: 18, fontWeight: 500, letterSpacing: 0, lineHeight: 1.45 }}>Voice isn’t available here, or the mic wasn’t allowed. Tap an example below, or go back and type.</span>
            : ' '}
        </p>
      </div>

      <div data-ra-oncolor="" style={{ padding: '20px 26px 30px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(250,249,246,0.75)', margin: '0 0 12px', fontFamily: F2 }}>
          You can ask for things like
        </h2>
        {RA2_VOICE_EXAMPLES.map(s => (
          <button key={s} onClick={() => finalize(s.replace(/[“”]/g, ''))} style={{
            width: '100%', textAlign: 'left', fontSize: 15.5, color: C2.paper, padding: '14px 16px',
            borderRadius: 12, background: 'rgba(250,249,246,0.1)', marginBottom: 8, lineHeight: 1.4,
            border: 0, cursor: 'pointer', fontFamily: F2, boxSizing: 'border-box',
          }}>{s}</button>
        ))}
      </div>
    </V2Shell>
  );
}

export { V2Voice };
