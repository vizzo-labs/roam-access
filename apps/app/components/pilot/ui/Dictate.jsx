'use client';

import React from 'react';
import { V2Mic } from './Mic';
import { C2, F2 } from './palette';

// Dictation into a text field. Hidden where the browser has no speech engine.
function V2Dictate({ onText }) {
  const [state, setState] = React.useState('idle'); // idle | listening | unsupported
  const recRef = React.useRef(null);
  const onTextRef = React.useRef(onText);
  onTextRef.current = onText;

  React.useEffect(() => {
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) setState('unsupported');
    return () => { try { if (recRef.current) recRef.current.abort(); } catch (e) {} };
  }, []);

  if (state === 'unsupported') return null;

  function toggle() {
    if (state === 'listening') { try { recRef.current.stop(); } catch (e) {} return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'en-AU';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      if (t) onTextRef.current(t);
    };
    rec.onend = () => setState('idle');
    rec.onerror = () => setState('idle');
    try { rec.start(); setState('listening'); } catch (e) { setState('idle'); }
  }

  const on = state === 'listening';
  return (
    <button type="button" onClick={toggle} aria-pressed={on} style={{
      marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      minHeight: 52, borderRadius: 14, border: `1.5px dashed ${C2.teal}`,
      background: on ? C2.teal : C2.tealSoft, color: on ? C2.paper : C2.teal,
      fontFamily: F2, fontSize: 16, fontWeight: 700, cursor: 'pointer',
    }}>
      <V2Mic size={20} color={on ? C2.paper : C2.teal}/>
      {on ? 'Listening… tap to stop' : 'Prefer to talk? Dictate instead'}
    </button>
  );
}

export { V2Dictate };
