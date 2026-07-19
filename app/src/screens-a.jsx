// Roam Access pilot v2 — screens: Welcome, Setup (needs, name), Home, Voice, Results.

// ─────────────────────────────────────────────────────────────
// WELCOME
// ─────────────────────────────────────────────────────────────
function V2Welcome({ app }) {
  const h = useV2Heading('welcome');
  return (
    <V2Shell>
      <div style={{ padding: '22px 26px 0' }}>
        <V2Logo size={20}/>
      </div>
      <div style={{ padding: '48px 26px 0' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 18px' }}>
          For people with disability
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 40, lineHeight: 1.06, marginBottom: 18 }}>
          Find places that actually work for you<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, color: C2.char, margin: 0, maxWidth: 320 }}>
          Real accessibility, checked by people with lived experience — not what venues claim.
        </p>
      </div>

      <div style={{ padding: '32px 26px 0' }}>
        {[
          'Built with the disability community',
          'Every disability — not just wheelchair access',
          'Free for you. Always.',
        ].map(t => (
          <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <span aria-hidden="true" style={{
              width: 26, height: 26, borderRadius: 999, background: C2.tealSoft, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="10" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.teal} strokeWidth="2.5" strokeLinecap="round"/></svg>
            </span>
            <span style={{ fontSize: 16.5, fontWeight: 600, color: C2.char }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '30px 26px 24px' }}>
        <V2BigBtn kind="primary" onClick={() => app.goto('setup')}>Get started</V2BigBtn>
        <button onClick={() => { app.toast('Accounts aren’t in this pilot demo — let’s set you up fresh.'); app.goto('setup'); }}
          style={{
            width: '100%', minHeight: 56, marginTop: 8, borderRadius: 16, border: 0,
            background: 'transparent', color: C2.teal, fontFamily: F2, fontSize: 17, fontWeight: 700,
            cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4,
          }}>I already have an account</button>
        <p style={{ fontSize: 12.5, color: C2.slate, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.45 }}>
          Pilot demo — venues and reviews are fictional examples.
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// SETUP · step 2 — first-person needs
// ─────────────────────────────────────────────────────────────
function V2Setup({ app }) {
  const h = useV2Heading('setup');
  const [needs, setNeeds] = React.useState(new Set(app.user?.needs || []));

  function toggle(id) {
    setNeeds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const bar = (
    <div style={{ padding: '14px 24px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0 }}>
      <V2BigBtn kind="primary" onClick={() => {
        app.setUser({ ...(app.user || {}), needs: Array.from(needs) });
        app.goto('setup-name');
      }}>Continue →</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }} aria-hidden="true">
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.line }}/>
        </div>
        <p className="ra-sr-only">Step 2 of 3</p>

        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
          What do you need to enjoy a place<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
          Pick as many as you like. We'll rank places by what fits — you can change this anytime, or skip it.
        </p>

        {RA2_NEEDS.map(n => {
          const on = needs.has(n.id);
          return (
            <button key={n.id} onClick={() => toggle(n.id)} aria-pressed={on} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              minHeight: 68, borderRadius: 16, padding: '10px 16px', marginBottom: 10,
              border: on ? `2.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.tealSoft : C2.paper,
              cursor: 'pointer', fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span aria-hidden="true" style={{
                width: 30, height: 30, borderRadius: 999, flexShrink: 0,
                border: on ? 0 : `2px solid ${C2.line}`,
                background: on ? C2.teal : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxSizing: 'border-box',
              }}>
                {on && <svg width="15" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.paper} strokeWidth="2.5" strokeLinecap="round"/></svg>}
              </span>
              <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, color: C2.char }}>{n.label}</span>
            </button>
          );
        })}

        <p style={{ fontSize: 14, color: C2.slate, lineHeight: 1.5, marginTop: 14, marginBottom: 0 }}>
          Private to you. Never shared, never used for ads.
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// SETUP · step 3 — name
// ─────────────────────────────────────────────────────────────
function V2SetupName({ app }) {
  const h = useV2Heading('setup-name');
  const [name, setName] = React.useState(app.user?.name || '');

  function finish() {
    app.setUser({ ...(app.user || {}), name: name.trim(), needs: app.user?.needs || [], done: true });
    app.goto('home');
    app.toast('You’re set. Everything here is yours to explore.');
  }

  const bar = (
    <div style={{ padding: '14px 24px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper, borderTop: `1px solid ${C2.hair}`, flexShrink: 0 }}>
      <V2BigBtn kind="primary" onClick={finish}>Finish →</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '14px 24px 24px' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }} aria-hidden="true">
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: C2.teal }}/>
        </div>
        <p className="ra-sr-only">Step 3 of 3</p>

        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 29, lineHeight: 1.12, marginBottom: 10 }}>
          What should we call you<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 22px' }}>
          Totally optional — pick anything. Your reviews never show your name, only your lived experience.
        </p>

        <label htmlFor="setup-name" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Your name</label>
        <input id="setup-name" value={name} onChange={e => setName(e.target.value)}
          autoComplete="nickname" placeholder="e.g. Naomi"
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: 60,
            border: `1.5px solid ${C2.line}`, borderRadius: 16, padding: '0 18px',
            fontSize: RA2_INPUT_FONT + 1, fontFamily: F2, color: C2.char, background: C2.paper,
          }}/>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME — one question, voice first
// ─────────────────────────────────────────────────────────────
function V2Home({ app }) {
  const h = useV2Heading('home');
  const [typing, setTyping] = React.useState(false);
  const [typed, setTyped] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (typing && inputRef.current) inputRef.current.focus(); }, [typing]);

  const name = app.user?.name;
  const visited = RA2_VENUES.find(v => v.id === app.world.visitedId);
  const showPrompt = visited && !app.world.reviewed.includes(visited.id);
  const nearby = RA2_VENUES.find(v => v.id === 'foundry');
  const nearbyVerdict = ra2Verdict(nearby, app.user?.needs || []);

  function runTyped(e) {
    e.preventDefault();
    if (!typed.trim()) return;
    app.runSearch(ra2ParseQuery(typed.trim()));
  }

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: '10px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <V2Logo size={16}/>
        <button onClick={() => app.goto('me')} aria-label="Open your profile" style={{
          width: 44, height: 44, borderRadius: 999, background: C2.teal, color: C2.paper,
          border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: F2,
        }}>{(name || 'You').charAt(0).toUpperCase()}</button>
      </div>

      <div style={{ padding: '26px 22px 0' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 24 }}>
          {name ? <>Hi {name}.<br/></> : <>Hi.<br/></>}
          Where do you want to go today<span style={{ color: C2.rust }}>?</span>
        </h1>

        {/* Voice — the primary action */}
        <button onClick={() => app.goto('voice')} style={{
          width: '100%', minHeight: 92, borderRadius: 20, border: 0,
          background: C2.teal, color: C2.paper, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px',
          textAlign: 'left', fontFamily: F2, boxSizing: 'border-box',
        }}>
          <span aria-hidden="true" style={{
            width: 56, height: 56, borderRadius: 999, background: 'rgba(250,249,246,0.14)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><V2Mic size={30}/></span>
          <span>
            <span style={{ display: 'block', fontSize: 19, fontWeight: 700, marginBottom: 3 }}>Tap and speak</span>
            <span style={{ display: 'block', fontSize: 14, opacity: 0.88, lineHeight: 1.35 }}>"Find a quiet cafe with step-free entry"</span>
          </span>
        </button>

        {/* Type instead */}
        {!typing ? (
          <button onClick={() => setTyping(true)} style={{
            width: '100%', minHeight: 58, borderRadius: 16, marginTop: 10,
            background: C2.stone, border: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px',
            fontFamily: F2, fontSize: 16.5, color: C2.slate, textAlign: 'left',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="6.5" stroke={C2.slate} strokeWidth="2"/>
              <path d="m20 20-4-4" stroke={C2.slate} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Or type what you're looking for
          </button>
        ) : (
          <form onSubmit={runTyped} style={{
            display: 'flex', gap: 8, marginTop: 10,
          }}>
            <label htmlFor="home-search" className="ra-sr-only">Search for places</label>
            <input id="home-search" ref={inputRef} value={typed} onChange={e => setTyped(e.target.value)}
              placeholder="Try “quiet cafe with step-free entry”"
              style={{
                flex: 1, minWidth: 0, minHeight: 58, borderRadius: 16,
                border: `1.5px solid ${C2.line}`, padding: '0 16px',
                fontSize: RA2_INPUT_FONT, fontFamily: F2, color: C2.char, background: C2.paper,
                boxSizing: 'border-box',
              }}/>
            <button type="submit" aria-label="Search" style={{
              minHeight: 58, minWidth: 58, borderRadius: 16, border: 0, background: C2.teal,
              color: C2.paper, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2"/>
                <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </form>
        )}
      </div>

      {/* 1-tap review prompt — the community loop */}
      {showPrompt && (
        <div style={{ padding: '26px 22px 0' }}>
          <button onClick={() => app.goto('review', visited.id)} style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
            background: C2.tealSoft, border: `2px solid ${C2.teal}`, borderRadius: 18,
            padding: 18, display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box',
          }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: M2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, marginBottom: 6 }}>1-tap review</span>
              <span style={{ display: 'block', fontSize: 17.5, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>
                How was {visited.name}?
              </span>
              <span style={{ display: 'block', fontSize: 14, color: C2.slate, lineHeight: 1.4 }}>One tap helps thousands of people plan their day.</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke={C2.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Browse tiles */}
      <div style={{ padding: '26px 22px 0' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: F2 }}>Or browse</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {RA2_TILES.map(t => (
            <button key={t.id} onClick={() => app.runSearch({ cats: t.cats, tags: [], label: t.label, raw: '' })} style={{
              minHeight: 104, borderRadius: 16, border: `1.5px solid ${C2.line}`,
              background: C2.paper, cursor: 'pointer', fontFamily: F2,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              justifyContent: 'space-between', padding: 16, boxSizing: 'border-box',
            }}>
              <V2TileIcon id={t.id}/>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: C2.char, letterSpacing: '-0.01em', textAlign: 'left' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nearby */}
      <div style={{ padding: '26px 22px 24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em', fontFamily: F2 }}>Works for you, nearby</h2>
        <button onClick={() => app.goto('venue', nearby.id)} style={{
          width: '100%', borderRadius: 16, border: `1.5px solid ${C2.line}`, padding: 16,
          display: 'flex', alignItems: 'center', gap: 14, background: C2.paper,
          cursor: 'pointer', fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
        }}>
          <span aria-hidden="true" style={{
            width: 54, height: 54, borderRadius: 12, flexShrink: 0,
            background: `repeating-linear-gradient(135deg, ${C2.hair} 0 1px, transparent 1px 10px), ${C2.stone}`,
          }}/>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 16.5, fontWeight: 700, marginBottom: 3, color: C2.char }}>{nearby.name}</span>
            <span style={{ display: 'block', fontSize: 13.5, color: C2.slate }}>{nearby.kind} · {nearby.mins} min away</span>
          </span>
          <V2Verdict kind={nearbyVerdict.kind}/>
        </button>
      </div>
    </V2Shell>
  );
}

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

    const startDemo = () => {
      if (done || demoRunning) return;
      demoRunning = true;
      if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
      setMode('demo');
      const q = RA2_DEMO_QUERY;
      if (document.documentElement.dataset.raMotion === 'reduce') {
        setTranscript(q);
        later(() => finalize(q), 900);
        return;
      }
      // Elapsed-time typing: throttled timers (background tabs) catch up in one tick.
      const start = Date.now() + 350;
      const tick = () => {
        if (done) return;
        const n = Math.max(0, Math.floor((Date.now() - start) / 42));
        setTranscript(q.slice(0, n));
        if (n < q.length) later(tick, 42);
        else later(() => finalize(q), 750);
      };
      later(tick, 60);
    };

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const forceDemo = new URLSearchParams(window.location.search).get('voice') === 'demo';

    if (!SR || forceDemo) {
      startDemo();
    } else {
      let latest = '';
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
        if (final && latest) later(() => finalize(latest), 500);
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
    }

    return () => {
      done = true;
      if (rec) { try { rec.abort(); } catch (e) {} }
      timers.forEach(clearTimeout);
    };
  }, []); // eslint-disable-line

  const finalize = (text) => finalizeRef.current(text);

  const statusLabel = mode === 'listening' ? 'Listening…' : mode === 'demo' ? 'Demo — watch how it works' : 'Getting ready…';
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
            <span key={i} className={mode !== 'starting' ? 'ra-bar' : ''} style={{
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
          {transcript ? `“${transcript}”` : ' '}
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

// ─────────────────────────────────────────────────────────────
// RESULTS — one verdict per card
// ─────────────────────────────────────────────────────────────
function V2Results({ app }) {
  const h = useV2Heading('results-' + (app.query?.label || ''));
  const query = app.query || { cats: [], tags: [], label: 'All places' };
  const results = ra2Search(query, app.user?.needs || []);
  const needShorts = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => n.short);

  return (
    <V2Shell tabs app={app} active="home">
      {/* what you asked */}
      <div style={{ padding: '10px 22px 0', display: 'flex', gap: 8 }}>
        <button onClick={() => app.goto('home')} style={{
          display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
          minHeight: 56, borderRadius: 999, border: `1.5px solid ${C2.line}`,
          background: C2.paper, padding: '0 18px', cursor: 'pointer',
          fontFamily: F2, fontSize: 16, fontWeight: 600, color: C2.char, textAlign: 'left',
          boxSizing: 'border-box',
        }} aria-label={`Back to home. Current search: ${query.label}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
            <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.label}</span>
        </button>
        <V2RoundBtn onClick={() => app.goto('voice')} ariaLabel="Search again by voice" style={{ width: 56, height: 56 }}>
          <V2Mic size={22} color={C2.teal}/>
        </V2RoundBtn>
        <V2RoundBtn onClick={() => app.goto('map')} ariaLabel="Show results on the map" style={{ width: 56, height: 56 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14" stroke={C2.char} strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </V2RoundBtn>
      </div>

      <div style={{ padding: '20px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 24, marginBottom: 4 }}>
          {results.length} {results.length === 1 ? 'place' : 'places'} found<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 16px', lineHeight: 1.45, fontFamily: F2 }}>
          {needShorts.length
            ? `Matched to your needs: ${needShorts.join(' + ')}.`
            : 'Showing general access — set your needs to personalise.'}
        </p>

        {results.map(r => (
          <button key={r.id} onClick={() => app.goto('venue', r.id)} style={{
            width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
            background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 18,
            padding: 18, marginBottom: 12, display: 'block', boxSizing: 'border-box',
          }}>
            <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 3, color: C2.char }}>{r.name}</span>
                <span style={{ display: 'block', fontSize: 14, color: C2.slate }}>{r.kind} · {r.mins} min away</span>
              </span>
              <V2Verdict kind={r.verdict.kind}/>
            </span>
            <span style={{ display: 'block', fontSize: 15, color: C2.char, lineHeight: 1.5 }}>{r.verdict.why}</span>
          </button>
        ))}

        {!results.length && (
          <p style={{ padding: 24, textAlign: 'center', color: C2.slate, fontSize: 15, border: `1.5px dashed ${C2.line}`, borderRadius: 16 }}>
            Nothing matched that. Try “quiet cafe” or browse from Home.
          </p>
        )}
      </div>
    </V2Shell>
  );
}

Object.assign(window, { V2Welcome, V2Setup, V2SetupName, V2Home, V2Voice, V2Results });
