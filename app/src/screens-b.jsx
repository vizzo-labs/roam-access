// Roam Access pilot v2 — screens: Map, Venue, AllReviews, Review, Thanks, Saved, Me, A11ySheet.

// ─────────────────────────────────────────────────────────────
// MAP — verdict-coded pins, one card at a time
// ─────────────────────────────────────────────────────────────
function V2MapView({ app }) {
  const query = app.query || { cats: [], tags: [], label: 'All places' };
  const results = ra2Search(query, app.user?.needs || []).slice(0, 6);
  const [selId, setSelId] = React.useState(results[0]?.id || null);
  const sel = results.find(r => r.id === selId) || results[0];
  const h = useV2Heading('map');
  const pinColor = { works: C2.blue, check: C2.amber, barrier: C2.red, unknown: '#475569' };
  const pinIcon = { works: '✓', check: '!', barrier: '✗', unknown: '?' };
  // Remap data coords into the band clear of the floating search chrome above
  // and the selected card below, so no pin ever renders under either.
  const pinX = x => `${(0.06 + x * 0.88) * 100}%`;
  const pinY = y => `${(0.2 + y * 0.5) * 100}%`;
  const legendKinds = [...new Set(results.map(r => r.verdict.kind))];

  return (
    <V2Shell scroll={false} tabs app={app} active="home">
      <h1 ref={h} tabIndex={-1} className="ra-sr-only">Map of results — {query.label}</h1>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* map field */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background:
            `radial-gradient(circle at 30% 55%, #DCE7E1 0 14%, transparent 14%),
             radial-gradient(circle at 75% 25%, #DCE7E1 0 11%, transparent 11%),
             repeating-linear-gradient(45deg, transparent 0 24px, ${C2.hair} 24px 25px),
             ${C2.stone}`,
        }}/>

        {/* top: search pill + list toggle */}
        <div style={{ position: 'absolute', top: 'var(--ra-shell-top)', left: 18, right: 18, display: 'flex', gap: 8, zIndex: 3 }}>
          <button onClick={() => app.goto('results')} style={{
            flex: 1, minWidth: 0, minHeight: 54, borderRadius: 999, border: `1.5px solid ${C2.line}`,
            background: C2.paper, padding: '0 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: F2, fontSize: 15.5, fontWeight: 600, color: C2.char, textAlign: 'left',
            boxSizing: 'border-box',
          }} aria-label={`Back to list. Current search: ${query.label}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M15 5l-7 7 7 7" stroke={C2.char} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.label}</span>
            <V2Mic size={18} color={C2.teal}/>
          </button>
          <button onClick={() => app.goto('results')} aria-label="Show as list" style={{
            minHeight: 54, minWidth: 54, borderRadius: 999, border: `1.5px solid ${C2.line}`,
            background: C2.paper, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M4 6h16M4 12h16M4 18h16" stroke={C2.char} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* pins */}
        <div role="group" aria-label="Map of results">
          {results.map(r => {
            const on = r.id === selId;
            return (
              <button key={r.id}
                onClick={() => setSelId(r.id)}
                aria-label={`${r.name}, ${r.kind}, ${V2_VERDICT_META[r.verdict.kind].label}`}
                aria-pressed={on}
                style={{
                  position: 'absolute', left: pinX(r.coords[0]), top: pinY(r.coords[1]),
                  transform: 'translate(-50%,-100%)', background: 'transparent', border: 0,
                  cursor: 'pointer', padding: 0, zIndex: on ? 2 : 1,
                }}>
                <span aria-hidden="true" style={{
                  width: on ? 52 : 44, height: on ? 52 : 44, borderRadius: 999,
                  background: pinColor[r.verdict.kind], color: C2.paper,
                  border: `3px solid ${C2.paper}`, boxShadow: `0 0 0 1px ${C2.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: M2, fontWeight: 800, fontSize: on ? 20 : 15,
                }}>{pinIcon[r.verdict.kind]}</span>
                <span aria-hidden="true" style={{
                  display: 'block', width: 0, height: 0, margin: '-2px auto 0',
                  borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                  borderTop: `8px solid ${pinColor[r.verdict.kind]}`,
                }}/>
              </button>
            );
          })}
        </div>

        {/* legend */}
        <div style={{
          position: 'absolute', top: 'calc(var(--ra-shell-top) + 66px)', left: 18, zIndex: 2,
          background: C2.paper, border: `1px solid ${C2.line}`, borderRadius: 12,
          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6,
          fontFamily: F2, fontSize: 12.5, fontWeight: 600, color: C2.char,
        }}>
          {[['works', 'Works for you'], ['check', 'Check first'], ['barrier', 'Has barriers'], ['unknown', 'No info yet']]
            .filter(([k]) => k !== 'unknown' || legendKinds.includes('unknown'))
            .map(([v, l]) => (
              <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 999, background: pinColor[v] }}/>{l}
              </span>
            ))}
        </div>

        <p style={{
          position: 'absolute', right: 18, bottom: sel ? 172 : 20, zIndex: 2, margin: 0,
          background: C2.paper, border: `1px solid ${C2.line}`, borderRadius: 10,
          padding: '6px 10px', fontFamily: M2, fontSize: 10, color: C2.slate, letterSpacing: '0.06em',
        }}>DEMO MAP</p>

        {/* selected card */}
        {sel && (
          <div style={{
            position: 'absolute', bottom: 16, left: 18, right: 18, zIndex: 3,
            background: C2.paper, borderRadius: 20, border: `1.5px solid ${C2.line}`,
            padding: 18, boxShadow: '0 12px 32px rgba(26,26,26,0.10)', boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: F2, fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>{sel.name}</div>
                <div style={{ fontFamily: F2, fontSize: 14, color: C2.slate }}>{sel.kind} · {sel.mins} min away</div>
              </div>
              <V2Verdict kind={sel.verdict.kind}/>
            </div>
            <div style={{ fontFamily: F2, fontSize: 14.5, color: C2.char, lineHeight: 1.45, marginBottom: 14 }}>
              {sel.verdict.why}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => app.goto('venue', sel.id)} style={{
                flex: 1, minHeight: 50, borderRadius: 12, border: 0, background: C2.teal, color: C2.paper,
                fontFamily: F2, fontSize: 15.5, fontWeight: 700, cursor: 'pointer',
              }}>See details</button>
              <button onClick={() => app.toggleSave(sel.id)}
                aria-label={app.world.saved.includes(sel.id) ? `Remove ${sel.name} from saved` : `Save ${sel.name}`}
                aria-pressed={app.world.saved.includes(sel.id)}
                style={{
                  minHeight: 50, minWidth: 50, borderRadius: 12, border: `1.5px solid ${C2.line}`,
                  background: app.world.saved.includes(sel.id) ? C2.tealSoft : C2.paper,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill={app.world.saved.includes(sel.id) ? C2.teal : 'none'} aria-hidden="true" focusable="false">
                  <path d="M6 4h12v17l-6-4-6 4V4Z" stroke={app.world.saved.includes(sel.id) ? C2.teal : C2.char} strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// VENUE — verdict first, plain language, detail on demand
// ─────────────────────────────────────────────────────────────
function V2VenueView({ app }) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('venue-' + v.id);
  const verdict = ra2Verdict(v, app.user?.needs || []);
  const saved = app.world.saved.includes(v.id);
  const meta = V2_VERDICT_META[verdict.kind];
  const myReviews = (app.world.myReviews[v.id] || []);
  // Written reviews and quick community check-ins are different numbers —
  // never let a button promise reviews the next screen doesn't show.
  const written = v.reviews.length + myReviews.length;

  React.useEffect(() => { app.markVisited(v.id); }, [v.id]); // eslint-disable-line

  const verdictLead = {
    works: `${verdict.works.slice(0, 3).map(f => f.s).join(', ')} — confirmed by ${v.verified} community check-ins.`,
    check: `Mostly good, with things to know before you go. Based on ${v.verified} community check-ins.`,
    barrier: `The community has flagged real barriers here, from ${v.verified} check-ins.`,
    unknown: `Nobody with your access needs has checked this venue yet. Your visit could be the first data point.`,
  }[verdict.kind];

  const bar = (
    <div style={{
      padding: '14px 22px calc(var(--ra-tabs-pad) + 8px)', background: C2.paper,
      borderTop: `1px solid ${C2.hair}`, display: 'flex', gap: 10, flexShrink: 0,
    }}>
      <V2BigBtn kind="primary" style={{ flex: 1.5 }} onClick={() => app.toast('Demo only — this opens Maps in the real app.')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" stroke={C2.paper} strokeWidth="2"/>
          <circle cx="12" cy="10" r="2.5" stroke={C2.paper} strokeWidth="2"/>
        </svg>
        Directions
      </V2BigBtn>
      <V2BigBtn kind="outline" style={{ flex: 1 }} onClick={() => app.toast('Demo only — this dials the venue in the real app.')}>Call</V2BigBtn>
    </div>
  );

  return (
    <V2Shell bar={bar}>
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <V2Back app={app} to={app.venueOrigin} label="Back"/>
        <V2RoundBtn onClick={() => app.toggleSave(v.id)} pressed={saved}
          ariaLabel={saved ? `Remove ${v.name} from saved` : `Save ${v.name}`}
          style={saved ? { background: C2.tealSoft, borderColor: C2.teal } : {}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? C2.teal : 'none'} aria-hidden="true" focusable="false">
            <path d="M6 4h12v17l-6-4-6 4V4Z" stroke={saved ? C2.teal : C2.char} strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </V2RoundBtn>
      </div>

      <div style={{ padding: '16px 22px 24px' }}>
        <V2Plate style={{ marginBottom: 16 }}/>

        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, lineHeight: 1.05, marginBottom: 4 }}>
          {v.name}<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15, color: C2.slate, margin: '0 0 16px', fontFamily: F2 }}>{v.kind} · {v.area} · {v.mins} min away</p>

        {/* THE verdict */}
        <div style={{ background: meta.bg, borderRadius: 18, padding: 20, marginBottom: 10 }}>
          <V2Verdict kind={verdict.kind} big/>
          <p style={{ fontSize: 16.5, lineHeight: 1.5, color: C2.char, margin: '12px 0 0', fontFamily: F2 }}>
            {verdictLead}
          </p>
        </div>

        {/* barriers — first when they exist */}
        {verdict.barriers.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.red, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>BARRIERS</h2>
            {verdict.barriers.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.red, color: C2.redBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
                }}>✗</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* what works */}
        {verdict.works.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 10 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.blue, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>WHAT WORKS</h2>
            {verdict.works.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.blue, color: C2.blueBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, fontFamily: M2,
                }}>✓</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* check before you go */}
        {verdict.checks.length > 0 && (
          <section style={{ borderRadius: 18, border: `1.5px solid ${C2.line}`, overflow: 'hidden', marginBottom: 16 }}>
            <h2 style={{ padding: '16px 18px 6px', fontSize: 14, fontWeight: 700, color: C2.amber, margin: 0, fontFamily: F2, letterSpacing: '0.02em' }}>CHECK BEFORE YOU GO</h2>
            {verdict.checks.map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start', borderTop: `1px solid ${C2.hair}` }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, background: C2.amber, color: C2.amberBg, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, fontFamily: M2,
                }}>!</span>
                <span style={{ fontSize: 16, lineHeight: 1.45, fontFamily: F2 }}>{f.t}</span>
              </div>
            ))}
          </section>
        )}

        {/* community voice */}
        {v.reviews[0] && (
          <div style={{ background: C2.stone, borderRadius: 18, padding: 18, marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C2.slate, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: M2, margin: '0 0 10px' }}>From the community</h2>
            <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 10px', fontFamily: F2 }}>
              “{v.reviews[0].text}”
            </p>
            <p style={{ fontSize: 13.5, color: C2.slate, fontWeight: 600, margin: 0, fontFamily: F2 }}>{v.reviews[0].who} · {v.reviews[0].when}</p>
          </div>
        )}

        {written > 0 ? (
          <V2BigBtn kind="ghost" onClick={() => app.goto('reviews', v.id)}>
            Read all {written} {written === 1 ? 'review' : 'reviews'}
          </V2BigBtn>
        ) : (
          <V2BigBtn kind="ghost" onClick={() => app.goto('review', v.id)}>
            No written reviews yet — add yours
          </V2BigBtn>
        )}
        <div style={{ height: 10 }}/>
        <V2BigBtn kind="outline" onClick={() => app.goto('review', v.id)}>
          Share your experience
        </V2BigBtn>

        <p style={{ fontFamily: M2, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C2.slate, textAlign: 'center', margin: '16px 0 0' }}>
          Fictional venue · pilot sample data
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// ALL REVIEWS — filter by lived experience
// ─────────────────────────────────────────────────────────────
function V2AllReviews({ app }) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('reviews-' + v.id);
  const [filter, setFilter] = React.useState('All');
  const [helped, setHelped] = React.useState({});
  const mine = (app.world.myReviews[v.id] || []).map(r => ({ ...r, mineFlag: true }));
  const all = [...mine, ...v.reviews];
  const filters = ['All', 'Wheelchair', 'Blind / low vision', 'Deaf', 'Autistic', 'Chronic illness'];
  const shown = filter === 'All' ? all : all.filter(r => r.tag === filter);

  return (
    <V2Shell tabs app={app} active="home">
      <div style={{ padding: '10px 22px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <V2Back app={app} to="venue" id={v.id} label={`Back to ${v.name}`}/>
        <div>
          <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 19, letterSpacing: '-0.015em' }}>{v.name} reviews</h1>
          <p style={{ fontSize: 13.5, color: C2.slate, margin: 0, fontFamily: F2 }}>
            {all.length} written · {v.verified} quick check-ins
          </p>
        </div>
      </div>

      <div style={{ padding: '18px 22px 0', display: 'flex', gap: 7, flexWrap: 'wrap' }} role="group" aria-label="Filter reviews by lived experience">
        {filters.map(f => {
          const on = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={on} style={{
              minHeight: 44, padding: '0 16px', borderRadius: 999, cursor: 'pointer',
              border: on ? `1.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
              background: on ? C2.teal : C2.paper,
              color: on ? C2.paper : C2.char,
              fontFamily: F2, fontSize: 14.5, fontWeight: 600,
            }}>{f}</button>
          );
        })}
      </div>

      <div style={{ padding: '18px 22px 24px' }}>
        {shown.map((r, i) => (
          <article key={r.id || i} style={{
            border: `1.5px solid ${C2.hair}`, borderRadius: 18, padding: 18, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C2.teal, fontFamily: F2 }}>{r.who}</span>
              <V2Verdict kind={r.v}/>
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.5, margin: '0 0 12px', color: C2.char, fontFamily: F2 }}>{r.text}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>
                {r.when}{r.mineFlag ? ' · yours, on this device' : ''}
              </span>
              {!r.mineFlag && (
                <button onClick={() => setHelped(prev => ({ ...prev, [r.id]: !prev[r.id] }))} aria-pressed={!!helped[r.id]} style={{
                  minHeight: 44, padding: '0 14px', borderRadius: 999,
                  border: `1.5px solid ${helped[r.id] ? C2.teal : C2.line}`,
                  background: helped[r.id] ? C2.tealSoft : C2.paper,
                  cursor: 'pointer', fontFamily: F2, fontSize: 13.5, fontWeight: 600,
                  color: helped[r.id] ? C2.teal : C2.char,
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <path d="M7 11v9M7 11l4-8a2 2 0 0 1 2 2v4h6l-2 9a2 2 0 0 1-2 2H7M7 11H4v9h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Helpful · {(r.helpful || 0) + (helped[r.id] ? 1 : 0)}
                </button>
              )}
            </div>
          </article>
        ))}
        {!shown.length && (
          <p style={{ padding: 24, textAlign: 'center', color: C2.slate, fontSize: 15, border: `1.5px dashed ${C2.line}`, borderRadius: 16, fontFamily: F2 }}>
            No reviews from this lived experience yet — yours could be the first.
          </p>
        )}
        <V2BigBtn kind="primary" onClick={() => app.goto('review', v.id)}>Share your experience</V2BigBtn>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// REVIEW — three taps, done
// ─────────────────────────────────────────────────────────────
function V2ReviewView({ app }) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('review-' + v.id);
  const [choice, setChoice] = React.useState(null);

  const options = [
    { kind: 'works',   label: 'It worked for me',  sub: 'I could get in, get around, and enjoy it' },
    { kind: 'check',   label: 'Some barriers',     sub: 'I managed, but with workarounds' },
    { kind: 'barrier', label: "It didn't work",    sub: "I couldn't use the venue as I needed" },
  ];

  function send() {
    if (!choice) return;
    app.addReview(v.id, choice);
    app.goto('thanks', v.id, { replace: true }); // Back must not reopen a sent form
  }

  return (
    <V2Shell>
      <div style={{ padding: '10px 22px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => app.goto('venue', v.id)} style={{
          minHeight: 48, padding: '0 18px', borderRadius: 999, border: 0,
          background: 'transparent', color: C2.slate, fontFamily: F2, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: 4,
        }}>Skip</button>
      </div>

      <div style={{ padding: '14px 24px 24px' }}>
        <p style={{ fontFamily: M2, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C2.slate, margin: '0 0 10px' }}>
          You visited recently
        </p>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, lineHeight: 1.1, marginBottom: 8 }}>
          How was {v.name}<span style={{ color: C2.rust }}>?</span>
        </h1>
        <p style={{ fontSize: 16.5, color: C2.char, lineHeight: 1.5, margin: '0 0 26px', fontFamily: F2 }}>
          One tap helps thousands of people plan their day. That's it — details are optional.
        </p>

        {options.map(o => {
          const meta = V2_VERDICT_META[o.kind];
          const on = choice === o.kind;
          return (
            <button key={o.kind} onClick={() => setChoice(o.kind)} aria-pressed={on} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
              minHeight: 84, borderRadius: 18, padding: '12px 18px', marginBottom: 10,
              border: on ? `2.5px solid ${meta.fg}` : `1.5px solid ${C2.line}`,
              background: on ? meta.bg : C2.paper, cursor: 'pointer',
              fontFamily: F2, textAlign: 'left', boxSizing: 'border-box',
            }}>
              <span aria-hidden="true" style={{
                width: 44, height: 44, borderRadius: 999, background: meta.fg, color: meta.bg, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 19, fontWeight: 800, fontFamily: M2,
              }}>{meta.icon}</span>
              <span>
                <span style={{ display: 'block', fontSize: 18.5, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3, color: C2.char }}>{o.label}</span>
                <span style={{ display: 'block', fontSize: 14.5, color: C2.slate, lineHeight: 1.35 }}>{o.sub}</span>
              </span>
            </button>
          );
        })}

        {/* voice note */}
        <button onClick={() => app.toast('Voice notes aren’t in this pilot demo yet.')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center',
          minHeight: 60, borderRadius: 16, marginTop: 14,
          border: `1.5px dashed ${C2.teal}`, background: C2.tealSoft, cursor: 'pointer', fontFamily: F2,
        }}>
          <V2Mic size={22} color={C2.teal}/>
          <span style={{ fontSize: 16.5, fontWeight: 700, color: C2.teal }}>Prefer to talk? Record a voice note</span>
        </button>

        <div style={{ marginTop: 20 }}>
          <V2BigBtn kind="primary" onClick={send} disabled={!choice} ariaDescribedBy="rev-hint">Send it →</V2BigBtn>
        </div>
        <p id="rev-hint" style={{ fontSize: 13.5, color: C2.slate, textAlign: 'center', marginTop: 12, lineHeight: 1.4, fontFamily: F2 }}>
          {choice ? 'Shown with your lived experience — never your name.' : 'Choose one of the three options above to send.'}
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// THANKS — the community loop, made visible
// ─────────────────────────────────────────────────────────────
function V2Thanks({ app }) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('thanks');
  const name = app.user?.name;
  return (
    <V2Shell bg={C2.teal}>
      <div style={{ padding: '56px 26px 0', textAlign: 'center' }} data-ra-oncolor="">
        <div aria-hidden="true" style={{
          width: 88, height: 88, borderRadius: 999, margin: '0 auto 26px',
          background: 'rgba(250,249,246,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="40" height="32" viewBox="0 0 16 12" fill="none"><path d="M1 6l5 5L15 1" stroke={C2.paper} strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1.1, color: C2.paper, marginBottom: 12 }}>
          Thanks{name ? `, ${name}` : ''}<span style={{ color: 'rgba(250,249,246,0.55)' }}>.</span>
        </h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.5, color: 'rgba(250,249,246,0.9)', margin: '0 auto', maxWidth: 300, fontFamily: F2 }}>
          Your review of {v.name} is live. Here's what your voice does:
        </p>
      </div>

      <div style={{ padding: '30px 26px 0' }}>
        {[
          { n: '~1,200', l: 'people search this area every month' },
          { n: '14', l: `people saved ${v.name} after reviews like yours` },
          { n: String(app.user?.stats?.helped ?? 38), l: 'places you’ve helped make findable' },
        ].map(s => (
          <div key={s.l} style={{
            display: 'flex', alignItems: 'baseline', gap: 14,
            padding: '16px 18px', borderRadius: 16, marginBottom: 10,
            background: 'rgba(250,249,246,0.09)',
          }}>
            <span style={{ fontFamily: M2, fontSize: 26, fontWeight: 700, color: C2.paper, whiteSpace: 'nowrap' }}>{s.n}</span>
            <span style={{ fontSize: 15, color: 'rgba(250,249,246,0.88)', lineHeight: 1.4, fontFamily: F2 }}>{s.l}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 26px 30px' }} data-ra-oncolor="">
        <V2BigBtn kind="rust" onClick={() => app.goto('home')}>Done</V2BigBtn>
        <button onClick={() => app.toast('Details and photos aren’t in this pilot demo yet.')} style={{
          width: '100%', minHeight: 54, marginTop: 8, borderRadius: 16, border: 0,
          background: 'transparent', color: C2.paper, fontFamily: F2, fontSize: 16, fontWeight: 600,
          cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4,
        }}>Add details or photos</button>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// SAVED — plan your day out
// ─────────────────────────────────────────────────────────────
function V2SavedView({ app }) {
  const h = useV2Heading('saved');
  const places = RA2_VENUES.filter(v => app.world.saved.includes(v.id));
  return (
    <V2Shell tabs app={app} active="saved">
      <div style={{ padding: '16px 22px 24px' }}>
        <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 30, marginBottom: 6 }}>
          Saved<span style={{ color: C2.rust }}>.</span>
        </h1>
        <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 18px', lineHeight: 1.45, fontFamily: F2 }}>
          Your places. We'll tell you if their access changes.
        </p>

        {places.map(p => {
          const verdict = ra2Verdict(p, app.user?.needs || []);
          return (
            <button key={p.id} onClick={() => app.goto('venue', p.id)} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F2,
              background: C2.paper, border: `1.5px solid ${C2.line}`, borderRadius: 18,
              padding: 18, marginBottom: 12, display: 'block', boxSizing: 'border-box',
            }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', color: C2.char, marginBottom: 3 }}>{p.name}</span>
                  <span style={{ display: 'block', fontSize: 13.5, color: C2.slate }}>{p.kind} · {p.area}</span>
                </span>
                <V2Verdict kind={verdict.kind}/>
              </span>
              <span style={{ fontSize: 14.5, color: C2.char, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden="true" style={{ color: C2.rust, fontWeight: 700 }}>/</span>{p.note}
              </span>
            </button>
          );
        })}

        {!places.length && (
          <div style={{ padding: 28, textAlign: 'center', border: `1.5px dashed ${C2.line}`, borderRadius: 18 }}>
            <p style={{ fontSize: 15.5, color: C2.slate, margin: '0 0 16px', fontFamily: F2 }}>
              Nothing saved yet. Find somewhere that works and keep it here.
            </p>
            <V2BigBtn kind="primary" onClick={() => app.goto('home')}>Explore places</V2BigBtn>
          </div>
        )}
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// ME — profile, needs, impact, settings
// ─────────────────────────────────────────────────────────────
function V2Me({ app }) {
  const h = useV2Heading('me');
  const name = app.user?.name;
  const needChips = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => n.chip);
  const stats = app.user?.stats || RA2_DEFAULT_STATS;

  const rows = [
    { l: 'Accessibility settings', m: 'Text size · contrast · motion · voice', hi: true, fn: () => app.openA11y() },
    { l: 'My reviews', m: `${stats.reviews} shared`, fn: () => app.toast('Full review history isn’t in this pilot demo.') },
    { l: 'Notifications', m: 'Access changes at saved places', fn: () => app.toast('Notifications aren’t in this pilot demo.') },
    { l: 'Privacy & my data', m: 'You control everything', fn: () => app.toast('This pilot stores everything on your device only.') },
    { l: 'Invite a friend', m: 'Every new voice makes the map better', fn: () => app.toast('Invites aren’t in this pilot demo.') },
    { l: 'Restart the demo', m: 'Clear this device and start fresh', fn: () => app.resetDemo() },
  ];

  return (
    <V2Shell tabs app={app} active="me">
      <div style={{ padding: '16px 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <span aria-hidden="true" style={{
            width: 64, height: 64, borderRadius: 999, background: C2.teal, color: C2.paper,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, fontFamily: F2,
          }}>{(name || 'You').charAt(0).toUpperCase()}</span>
          <div>
            <h1 ref={h} tabIndex={-1} style={{ ...V2_H1, fontSize: 24, letterSpacing: '-0.02em' }}>
              {name || 'You'}<span style={{ color: C2.rust }}>.</span>
            </h1>
            <p style={{ fontSize: 14, color: C2.slate, margin: 0, fontFamily: F2 }}>Sydney · pilot demo member</p>
          </div>
        </div>

        {/* my needs */}
        <section style={{ background: C2.stone, borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: 0, fontFamily: F2 }}>What I need</h2>
            <button onClick={() => app.goto('setup')} style={{
              minHeight: 44, padding: '0 14px', borderRadius: 999, border: 0, background: 'transparent',
              color: C2.teal, fontFamily: F2, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 4,
            }}>Edit</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {needChips.length ? needChips.map(t => (
              <span key={t} style={{
                fontSize: 13.5, fontWeight: 600, padding: '8px 13px', borderRadius: 999,
                background: C2.paper, color: C2.char, border: `1px solid ${C2.line}`, fontFamily: F2,
              }}>{t}</span>
            )) : (
              <span style={{ fontSize: 14, color: C2.slate, fontFamily: F2 }}>Nothing set — showing general access for now.</span>
            )}
          </div>
        </section>

        {/* impact */}
        <section style={{ background: C2.teal, borderRadius: 18, padding: 18, marginBottom: 18, color: C2.paper }} data-ra-oncolor="">
          <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 12px', fontFamily: F2 }}>Your impact</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {[[String(stats.reviews), 'reviews'], [String(stats.helped), 'places helped'], [String(stats.votes), 'helpful votes']].map(([n, l]) => (
              <div key={l} style={{ flex: 1, background: 'rgba(250,249,246,0.1)', borderRadius: 12, padding: '12px 10px' }}>
                <div style={{ fontFamily: M2, fontSize: 24, fontWeight: 700, marginBottom: 3 }}>{n}</div>
                <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.3, fontFamily: F2 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* settings rows */}
        {rows.map(r => (
          <button key={r.l} onClick={r.fn} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            minHeight: 66, padding: '10px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
            borderRadius: 16, fontFamily: F2, boxSizing: 'border-box',
            border: r.hi ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
            background: r.hi ? C2.tealSoft : C2.paper,
          }}>
            <span>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: C2.char, marginBottom: 2 }}>{r.l}</span>
              <span style={{ display: 'block', fontSize: 13, color: C2.slate }}>{r.m}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke={C2.slate} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}

        <p style={{ fontFamily: M2, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: C2.slate, textAlign: 'center', margin: '16px 0 0' }}>
          Pilot demo · fictional sample data · roamaccess.com.au
        </p>
      </div>
    </V2Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// ACCESSIBILITY SHEET — text size, contrast, motion (all real)
// ─────────────────────────────────────────────────────────────
function V2A11ySheet({ open, onClose, prefs, onChange }) {
  const ref = useRA2Dialog(open, onClose);
  const scaleRefs = React.useRef([]);
  const SCALES = [
    { v: 1, label: 'Default text size' },
    { v: 1.125, label: 'Large text size, 112%' },
    { v: 1.25, label: 'Larger text size, 125%' },
    { v: 1.5, label: 'Largest text size, 150%' },
  ];
  if (!open) return null;

  function onScaleKey(e, i) {
    const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (i + d + SCALES.length) % SCALES.length;
    onChange({ scale: SCALES[next].v });
    const el = scaleRefs.current[next];
    if (el) el.focus();
  }

  const row = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingTop: 14, marginTop: 12, borderTop: `1px solid ${C2.hair}`,
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="a11y-h" tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: C2.paper, borderRadius: '22px 22px 0 0', padding: '20px 22px',
          paddingBottom: 'calc(var(--ra-tabs-pad) + 16px)',
          maxHeight: '82%', overflowY: 'auto', boxSizing: 'border-box',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 id="a11y-h" style={{ fontSize: 19, fontWeight: 700, margin: 0, fontFamily: F2 }}>Accessibility</h2>
          <button onClick={onClose} aria-label="Close accessibility settings" style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 14, margin: -14, lineHeight: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">
              <path d="M1 1l12 12M13 1L1 13" stroke={C2.char} strokeWidth="2" strokeLinecap="square"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 13.5, color: C2.slate, margin: '4px 0 6px', fontFamily: F2 }}>
          Adjust how the app works for you. Saved on this device.
        </p>

        <div style={row}>
          <div>
            <div id="a11y-scale-label" style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Text size</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Scales the whole app.</div>
          </div>
          <div role="radiogroup" aria-labelledby="a11y-scale-label" style={{
            display: 'inline-flex', border: `1px solid ${C2.line}`, borderRadius: 999, padding: 2, gap: 2, flexShrink: 0,
          }}>
            {SCALES.map((s, i) => {
              const on = prefs.scale === s.v;
              return (
                <button key={s.v} type="button" role="radio" aria-checked={on} aria-label={s.label}
                  ref={el => { scaleRefs.current[i] = el; }}
                  tabIndex={on ? 0 : -1}
                  onKeyDown={e => onScaleKey(e, i)}
                  onClick={() => onChange({ scale: s.v })}
                  style={{
                    minWidth: 44, minHeight: 44, padding: '0 6px',
                    fontSize: 11 + (s.v - 1) * 8, fontWeight: 600, borderRadius: 999, cursor: 'pointer',
                    background: on ? C2.char : 'transparent',
                    color: on ? C2.paper : C2.char, border: 0, fontFamily: F2,
                  }}><span aria-hidden="true">A</span></button>
              );
            })}
          </div>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Higher contrast</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Darkens borders and secondary text.</div>
          </div>
          <V2Switch checked={prefs.contrast} onChange={() => onChange({ contrast: !prefs.contrast })} label="Higher contrast"/>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Reduce motion</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Disables animation and movement.</div>
          </div>
          <V2Switch checked={prefs.motion} onChange={() => onChange({ motion: !prefs.motion })} label="Reduce motion"/>
        </div>

        <div style={row}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, fontFamily: F2 }}>Voice</div>
            <div style={{ fontSize: 13, color: C2.slate, fontFamily: F2, maxWidth: 220 }}>
              Search and reviews work by voice wherever you see the mic.
            </div>
          </div>
          <V2Mic size={24} color={C2.teal}/>
        </div>

        <div style={{ ...row, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: C2.slate, fontFamily: F2 }}>Saved on this device</span>
          <button onClick={() => onChange({ scale: 1, contrast: false, motion: false })} style={{
            fontSize: 14, color: C2.teal, fontWeight: 700, background: 'transparent', border: 0,
            padding: '10px 6px', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: F2,
          }}>Reset</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { V2MapView, V2VenueView, V2AllReviews, V2ReviewView, V2Thanks, V2SavedView, V2Me, V2A11ySheet });
