// Roam Access — primary views.
// Each view receives { app } — the central state bag plus mutators.

const RA_LIVED_EXPERIENCE = [
  'wheelchair user',
  'walking-aid user',
  'blind / low vision',
  'deaf / hard of hearing',
  'autistic person',
  'person with chronic illness',
  'person with mental health condition',
  'prefer not to say',
];

// Move focus to a view's heading when the view changes, so keyboard and screen
// reader users land in the new context instead of being dropped on <body>.
// Deliberately inert on first paint: stealing focus on load would skip past the
// skip link and the sample-data notice before anyone had read them.
function useHeadingFocus(dep) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!window.RA_NAVIGATED) return;
    if (ref.current) ref.current.focus();
  }, [dep]);
  return ref;
}

// ─────────────────────────────────────────────────────────────
// Onboarding (multi-step wizard)
// ─────────────────────────────────────────────────────────────
function RAOnboarding({ app }) {
  const [step, setStepRaw] = React.useState(0);
  // Moving between steps is a navigation as far as focus is concerned.
  const setStep = (n) => { window.RA_NAVIGATED = true; setStepRaw(n); };
  const [name, setName] = React.useState(app.user.name);
  const [city, setCity] = React.useState(app.user.city);
  const [profile, setProfile] = React.useState(new Set(app.user.accessProfile));
  const [le, setLe] = React.useState(app.user.livedExperience);
  const headingRef = useHeadingFocus(step);

  function toggleCat(id) {
    const next = new Set(profile);
    next.has(id) ? next.delete(id) : next.add(id);
    setProfile(next);
  }
  function finish() {
    app.setUser({
      ...app.user,
      signedIn: true, name, city,
      accessProfile: Array.from(profile),
      livedExperience: le,
    });
    app.goto('discover');
    app.toast('Welcome — your profile is saved on this device.');
  }

  const steps = ['About you', 'Access profile', 'Lived experience'];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }} aria-hidden="true">
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= step ? RA_C.teal : RA_C.line,
          }}/>
        ))}
      </div>
      <RAEyebrow style={{ marginBottom: 10 }}>Step {step + 1} of {steps.length} · {steps[step]}</RAEyebrow>

      {step === 0 && (
        <>
          <h1 style={H1} tabIndex={-1} ref={headingRef}>Tell us who's roaming<span style={{ color: RA_C.rust }}>.</span></h1>
          <p style={LEAD}>Just so we can personalise your map. Real name not required — pick whatever you'd like to be called.</p>

          <label htmlFor="onb-name" style={LABEL}>Your name</label>
          <input id="onb-name" style={INPUT} value={name} onChange={e => setName(e.target.value)} autoComplete="nickname" />

          <label htmlFor="onb-city" style={{ ...LABEL, marginTop: 16 }}>City</label>
          <select id="onb-city" style={INPUT} value={city} onChange={e => setCity(e.target.value)}>
            <option>Sydney</option>
            <option>Melbourne</option>
            <option>Brisbane</option>
            <option>Adelaide</option>
            <option>Perth</option>
          </select>

          <div style={ROW}>
            <RABtn kind="ghost" onClick={() => app.goto('discover')}>Skip for now</RABtn>
            <RABtn kind="primary" onClick={() => setStep(1)}>Continue →</RABtn>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 style={H1} tabIndex={-1} ref={headingRef}>Set your access profile<span style={{ color: RA_C.rust }}>.</span></h1>
          <p style={LEAD}>
            Which kinds of access matter to you? We'll filter and rank venues so the ones that work for you show up first — and we'll call out the ones that don't.
          </p>

          <div className="ra-cat-grid" style={{ marginTop: 18 }}>
            {RA_CATEGORIES.map(c => {
              const on = profile.has(c.id);
              return (
                // One control per row. The switch beside it is decoration —
                // a real switch nested in a button would be invalid HTML and
                // would give a single setting two conflicting tab stops.
                <button key={c.id} type="button" onClick={() => toggleCat(c.id)} aria-pressed={on} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: 14, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                  border: `1.5px solid ${on ? RA_C.teal : RA_C.line}`,
                  background: on ? RA_C.tealSoft : RA_C.paper,
                }}>
                  <span aria-hidden="true" style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: on ? RA_C.teal : RA_C.stone,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <RACatIcon name={c.id} size={20} color={on ? RA_C.paper : RA_C.teal}/>
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{c.title}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: RA_C.slate, lineHeight: 1.4 }}>{c.sub}</span>
                  </span>
                  <RAToggle checked={on} presentational />
                </button>
              );
            })}
          </div>

          <div style={{ ...HELP, marginTop: 18 }}>
            <RASlash size={18}/>
            <div>
              <strong style={{ fontWeight: 600 }}>You can change this anytime.</strong>{' '}
              We use this only to filter venues for you. Never shared. Never used for ads.
              Nothing here has to be filled in — skip it and we'll show general access information instead.
            </div>
          </div>

          <div style={ROW}>
            <RABtn kind="ghost" onClick={() => setStep(0)}>← Back</RABtn>
            <RABtn kind="primary" onClick={() => setStep(2)}>Continue →</RABtn>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={H1} tabIndex={-1} ref={headingRef}>Add lived-experience context<span style={{ color: RA_C.rust }}>.</span></h1>
          <p style={LEAD}>
            When you review a venue, you can share which lived experience you're speaking from. Reviews with context are far more useful to others. Totally optional.
          </p>

          <label htmlFor="onb-le" style={LABEL}>Default context (you can change per review)</label>
          <select id="onb-le" style={INPUT} value={le} onChange={e => setLe(e.target.value)}>
            {RA_LIVED_EXPERIENCE.map(o => <option key={o}>{o}</option>)}
          </select>

          <div style={{ ...HELP, marginTop: 18 }}>
            <RASlash size={18}/>
            <div>
              You stay anonymous publicly. Only the context label (e.g. "wheelchair user") is shown on your reviews. Your name is never attached.
            </div>
          </div>

          <div style={ROW}>
            <RABtn kind="ghost" onClick={() => setStep(1)}>← Back</RABtn>
            <RABtn kind="primary" onClick={finish}>Finish &amp; explore →</RABtn>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Discover — list plus demo map
// ─────────────────────────────────────────────────────────────
function RADiscover({ app }) {
  const headingRef = useHeadingFocus('discover');
  const accessProfile = app.user.accessProfile;

  const venues = React.useMemo(() => {
    const q = (app.search || '').trim().toLowerCase();
    return app.venues
      .filter(v => !q || [v.name, v.area, v.kind].some(x => x.toLowerCase().includes(q)))
      .map(v => ({ ...v, ...RAScore(v, accessProfile) }))
      .sort((a, b) => b.score - a.score);
  }, [app.search, accessProfile, app.venues]);

  const personalised = accessProfile.length > 0;
  const [hoverId, setHoverId] = React.useState(null);

  return (
    <div className="ra-discover-grid">
      <div className="ra-discover-list" style={{ padding: '28px 20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <RAEyebrow>Sydney · {venues.length} venues</RAEyebrow>
          <span style={{ fontSize: 12, color: RA_C.slate }}>
            {personalised ? 'Ranked by match with your profile' : 'Ranked by general access'}
          </span>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 12px', lineHeight: 1.05 }}
            tabIndex={-1} ref={headingRef}>
          What works for you today<span style={{ color: RA_C.rust }}>?</span>
        </h1>

        {!personalised && (
          <div style={{
            border: `1.5px solid ${RA_C.teal}`, background: RA_C.tealSoft,
            borderRadius: 14, padding: 16, marginBottom: 18,
          }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 4px' }}>Ranking by general access</h2>
            <p style={{ fontSize: 13.5, color: RA_C.char, margin: '0 0 12px', lineHeight: 1.5 }}>
              Tell us which kinds of access matter to you and every venue gets scored against your needs instead.
            </p>
            <RABtn kind="primary" size="sm" onClick={() => app.goto('onboarding')}>Set up my access profile →</RABtn>
          </div>
        )}

        <h2 className="ra-sr-only">Filter by access category</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {RA_CATEGORIES.map(c => (
            <RACatChip key={c.id} id={c.id} label={c.title.split(' / ')[0]}
              active={accessProfile.includes(c.id)}
              size="sm"
              onToggle={() => {
                const next = new Set(accessProfile);
                next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                app.setUser({ ...app.user, accessProfile: Array.from(next) });
              }}/>
          ))}
        </div>
        <p style={{ fontSize: 12, color: RA_C.slate, margin: '0 0 20px' }}>
          Choose a category to include it in your matching profile.{' '}
          <button onClick={() => app.goto('profile')} style={LINK}>Edit full profile →</button>
        </p>

        <h2 className="ra-sr-only">Venues</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {venues.map(v => {
            const tone = RAScoreTone(v.score);
            const hot = hoverId === v.id;
            return (
              <li key={v.id}>
                <button
                  onMouseEnter={() => setHoverId(v.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onFocus={() => setHoverId(v.id)}
                  onBlur={() => setHoverId(null)}
                  onClick={() => app.openVenue(v.id)}
                  style={{
                    textAlign: 'left', width: '100%',
                    background: hot ? RA_C.tealSoft : RA_C.paper,
                    border: `1.5px solid ${hot ? RA_C.teal : RA_C.line}`,
                    borderRadius: 14, padding: 14, cursor: 'pointer',
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                  }}>
                  <RAPlate w={84} h={84} style={{ padding: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{v.name}</span>
                      <span style={{ fontFamily: RA_FONT_MONO, fontSize: 11, color: RA_C.slate, flexShrink: 0 }}>{v.dist}</span>
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: RA_C.slate, marginBottom: 8 }}>{v.area} · {v.kind}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: RA_FONT_MONO, fontSize: 11, fontWeight: 600,
                        color: tone.fg, background: tone.bg,
                        padding: '3px 9px', borderRadius: 999,
                      }}>{v.score}/10 {personalised ? 'match' : 'access'}</span>
                      <span style={{ fontSize: 11, color: RA_C.slate }}>· {v.verified} verifications</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!venues.length && (
          <p style={{ padding: 28, textAlign: 'center', color: RA_C.slate, fontSize: 14 }}>
            No venues match your search. Try different words.
          </p>
        )}
      </div>

      <RADiscoverMap venues={venues} hoverId={hoverId} setHoverId={setHoverId} app={app} personalised={personalised}/>
    </div>
  );
}

function RADiscoverMap({ venues, hoverId, setHoverId, app, personalised }) {
  return (
    <div className="ra-map">
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background:
          `radial-gradient(circle at 30% 60%, #DCE7E1 0 12%, transparent 12%),
           radial-gradient(circle at 70% 30%, #DCE7E1 0 10%, transparent 10%),
           radial-gradient(circle at 50% 80%, #DCE7E1 0 9%, transparent 9%),
           repeating-linear-gradient(45deg, transparent 0 28px, ${RA_C.hair} 28px 29px),
           ${RA_C.stone}`,
      }}/>

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.16 }} aria-hidden="true" focusable="false">
        <path d="M0,60 Q220,200 420,140 T720,160" stroke={RA_C.teal} strokeWidth="40" fill="none"/>
      </svg>

      {/* The map duplicates the list above it, so it is labelled as a
          supplementary group rather than presented as new information. */}
      <div role="group" aria-label="Demo map of the same venues">
        {venues.map(v => {
          const tone = RAScoreTone(v.score);
          const on = hoverId === v.id;
          return (
            <button key={v.id}
              onMouseEnter={() => setHoverId(v.id)}
              onMouseLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(v.id)}
              onBlur={() => setHoverId(null)}
              onClick={() => app.openVenue(v.id)}
              aria-label={`${v.name}, ${v.area}, ${v.score} out of 10 ${personalised ? 'match for your profile' : 'general access'}`}
              style={{
                position: 'absolute',
                left: `${v.coords[0] * 100}%`, top: `${v.coords[1] * 100}%`,
                transform: 'translate(-50%, -100%)',
                background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
                filter: hoverId && !on ? 'opacity(0.55)' : 'none',
                zIndex: on ? 2 : 1,
              }}>
              <span aria-hidden="true" style={{
                width: on ? 44 : 36, height: on ? 44 : 36, borderRadius: 999,
                background: tone.pin, color: RA_C.paper,
                border: `3px solid ${RA_C.paper}`,
                boxShadow: `0 0 0 1px ${RA_C.line}`,
                fontWeight: 700, fontSize: on ? 14 : 12, fontFamily: RA_FONT_MONO,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{v.score}</span>
              <span aria-hidden="true" style={{
                display: 'block', width: 0, height: 0,
                borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                borderTop: `7px solid ${tone.pin}`, margin: '-2px auto 0',
              }}/>
              {on && (
                <span aria-hidden="true" style={{
                  position: 'absolute', left: '50%', top: 'calc(100% + 4px)',
                  transform: 'translateX(-50%)',
                  background: RA_C.char, color: RA_C.paper,
                  padding: '6px 10px', borderRadius: 8, whiteSpace: 'nowrap',
                  fontSize: 12, fontWeight: 600,
                }}>{v.name} · {v.area}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        position: 'absolute', left: 20, bottom: 20,
        background: RA_C.paper, border: `1px solid ${RA_C.line}`, borderRadius: 12,
        padding: '12px 14px', fontSize: 12.5, color: RA_C.char,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{personalised ? 'Match for your profile' : 'General access'}</div>
        {[10, 5, 1].map(s => {
          const tone = RAScoreTone(s);
          return (
            <div key={tone.band} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: tone.pin, flexShrink: 0 }}/>
              {tone.band}
            </div>
          );
        })}
      </div>

      <p style={{
        position: 'absolute', right: 20, top: 20, margin: 0,
        background: RA_C.paper, border: `1px solid ${RA_C.line}`, borderRadius: 12,
        padding: '8px 12px', fontFamily: RA_FONT_MONO, fontSize: 11, color: RA_C.slate,
        letterSpacing: 0.06,
      }}>SYD · 4 KM RADIUS · DEMO MAP</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Venue Detail
// ─────────────────────────────────────────────────────────────
function RAVenue({ app }) {
  const v = app.venues.find(x => x.id === app.selectedVenueId) || app.venues[0];
  const headingRef = useHeadingFocus(v.id);
  const accessProfile = app.user.accessProfile;
  const saved = app.user.savedIds.includes(v.id);
  const [openCat, setOpenCat] = React.useState('mobility');

  const { score, accessible, partial, total, cats, personalised } = RAScore(v, accessProfile);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 20px 60px' }}>
      <button onClick={() => app.goto('discover')} style={{
        background: 'transparent', border: 0, padding: '10px 0', cursor: 'pointer',
        color: RA_C.teal, fontWeight: 600, fontSize: 13.5, marginBottom: 8,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>← Back to Discover</button>

      <div className="ra-two-col">
        <div>
          <RAPlate h={300} label={`${v.name} · supplied photo`} style={{ marginBottom: 20 }} />
          <RAEyebrow style={{ marginBottom: 6 }}>{v.kind} · {v.area}</RAEyebrow>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px', lineHeight: 1.02 }}
              tabIndex={-1} ref={headingRef}>
            {v.name}<span style={{ color: RA_C.rust }}>.</span>
          </h1>
          <p style={{ fontSize: 15, color: RA_C.slate, margin: '0 0 20px' }}>{v.addr} · {v.dist} away</p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
            <RABtn kind="primary" onClick={() => app.openReview(v.id)}>Write a review</RABtn>
            <RABtn kind="outline" onClick={() => app.toggleSave(v.id)}>
              {saved ? '✓ Saved' : 'Save place'}
            </RABtn>
            <RABtn kind="ghost" onClick={() => app.toast('Thanks — flagged for the community team to check.')}>
              Report inaccurate info
            </RABtn>
          </div>

          <h2 style={SECTION_H}>Access by category</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RA_CATEGORIES.map(c => {
              const open = openCat === c.id;
              const inProfile = accessProfile.includes(c.id);
              return (
                <div key={c.id} style={{
                  background: RA_C.paper, border: `1px solid ${open ? RA_C.teal : RA_C.line}`,
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  <h3 style={{ margin: 0 }}>
                    <button onClick={() => setOpenCat(open ? null : c.id)}
                      aria-expanded={open} aria-controls={`cat-${c.id}`} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', background: 'transparent', border: 0, cursor: 'pointer',
                        textAlign: 'left', font: 'inherit',
                      }}>
                      <span aria-hidden="true" style={{
                        width: 36, height: 36, borderRadius: 10, background: RA_C.stone,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <RACatIcon name={c.id} size={18}/>
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15.5, fontWeight: 600 }}>{c.title}</span>
                          {inProfile && (
                            <span style={{
                              fontFamily: RA_FONT_MONO, fontSize: 10, fontWeight: 600,
                              color: RA_C.teal, background: RA_C.tealSoft, padding: '2px 6px', borderRadius: 4,
                            }}>YOUR PROFILE</span>
                          )}
                        </span>
                        <span style={{ display: 'block', fontSize: 12.5, color: RA_C.slate, lineHeight: 1.4, fontWeight: 400 }}>{c.sub}</span>
                      </span>
                      <RAStatusBadge kind={v.status[c.id]} compact/>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
                           style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
                        <path d="M9 5l7 7-7 7" stroke={RA_C.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </h3>
                  {open && (
                    <p id={`cat-${c.id}`} style={{ margin: 0, padding: '0 16px 14px 66px', fontSize: 14, color: RA_C.char, lineHeight: 1.5 }}>
                      {v.notes[c.id]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <h2 style={{ ...SECTION_H, marginTop: 32 }}>Reviews · {v.reviews.length}</h2>
          {v.reviews.length === 0 && (
            <p style={{
              border: `1px dashed ${RA_C.line}`, borderRadius: 14, padding: 20,
              fontSize: 14, color: RA_C.slate, textAlign: 'center', margin: 0,
            }}>
              No reviews yet — <button onClick={() => app.openReview(v.id)} style={LINK}>be the first to share</button>.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {v.reviews.map(r => (
              <article key={r.id} style={{
                background: RA_C.paper, border: `1px solid ${RA_C.hair}`, borderRadius: 14, padding: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span aria-hidden="true" style={{
                      width: 32, height: 32, borderRadius: 999, background: RA_C.tealSoft,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <RACatIcon name={r.cat} size={16}/>
                    </span>
                    <span>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{r.who}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: RA_C.slate }}>
                        {r.when} · {RA_CATEGORIES.find(c => c.id === r.cat)?.title}
                      </span>
                    </span>
                  </div>
                  <RAStatusBadge kind={r.rating} compact/>
                </div>
                <p style={{ margin: 0, fontSize: 14.5, color: RA_C.char, lineHeight: 1.55 }}>{r.text}</p>
                <RAPilotNote style={{ marginTop: 10 }}>
                  {r.mine ? 'Your review · stored on this device only' : 'Sample content · not a real review'}
                </RAPilotNote>
              </article>
            ))}
          </div>
        </div>

        <div className="ra-sticky-aside">
          <div data-ra-oncolor style={{
            background: RA_C.teal, color: RA_C.paper, borderRadius: 18, padding: 22, marginBottom: 16,
          }}>
            <RAEyebrow as="h2" style={{ color: 'rgba(250,249,246,0.82)', marginBottom: 10 }}>
              {personalised ? 'Your match' : 'General access'}
            </RAEyebrow>
            <p style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '0 0 6px' }}>
              <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: RA_FONT_MONO }}>{score}</span>
              <span style={{ fontSize: 22, fontWeight: 500 }}>/ 10</span>
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.45, margin: '0 0 18px' }}>
              {personalised
                ? `${accessible} of ${total} of your access needs fully met. ${partial} partial.`
                : `${accessible} of ${total} access categories fully met. ${partial} partial. Set an access profile to score this against your own needs.`}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cats.map(c => (
                <li key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <RACatIcon name={c} size={14} color={RA_C.paper}/>
                    {RA_CATEGORIES.find(x => x.id === c)?.title}
                  </span>
                  <RAStatusBadge kind={v.status[c]} compact/>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ border: `1px solid ${RA_C.hair}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>
              <RASlash size={18}/> Community verification
            </h2>
            <p style={{ fontSize: 13, color: RA_C.char, lineHeight: 1.5, margin: '0 0 8px' }}>
              In the live product, every access detail is confirmed by community members with relevant lived experience before it is shown.
            </p>
            <RAPilotNote>Not running in this pilot · the {v.verified} count is illustrative</RAPilotNote>
          </div>

          <div style={{ background: RA_C.stone, borderRadius: 14, padding: 16 }}>
            <RAEyebrow as="h2" style={{ marginBottom: 8 }}>Hours &amp; contact</RAEyebrow>
            <p style={{ fontSize: 13.5, color: RA_C.char, lineHeight: 1.5, margin: '0 0 8px' }}>
              Opening hours and contact details are not collected in this pilot.
            </p>
            <RAPilotNote>Placeholder · no real venue data</RAPilotNote>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Add Review (full page)
// ─────────────────────────────────────────────────────────────
function RAReview({ app }) {
  const v = app.venues.find(x => x.id === app.selectedVenueId) || app.venues[0];
  const headingRef = useHeadingFocus(v.id);
  const [cats, setCats] = React.useState(new Set(['mobility']));
  const [rating, setRating] = React.useState('partial');
  const [text, setText] = React.useState('');
  const [le, setLe] = React.useState(app.user.livedExperience);

  function toggleCat(id) {
    const next = new Set(cats);
    next.has(id) ? next.delete(id) : next.add(id);
    setCats(next);
  }
  function submit() {
    app.addReview(v.id, {
      who: le, cat: Array.from(cats)[0] || 'mobility',
      rating, text: text.trim(), when: 'just now',
    });
    app.openVenue(v.id);
    app.toast('Posted — your review is on the venue page.');
  }

  const RATINGS = [
    { id: 'accessible', label: 'Accessible',           sub: 'No barriers — I could fully use the venue' },
    { id: 'partial',    label: 'Partially accessible', sub: 'Some access — but with workarounds' },
    { id: 'notAccess',  label: 'Not accessible',       sub: 'I could not use the venue as needed' },
  ];

  const incomplete = !cats.size || !text.trim();

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
      <button onClick={() => app.openVenue(v.id)} style={{
        background: 'transparent', border: 0, padding: '10px 0', cursor: 'pointer',
        color: RA_C.teal, fontWeight: 600, fontSize: 13.5, marginBottom: 8,
      }}>← Back to {v.name}</button>

      <RAEyebrow style={{ marginBottom: 6 }}>You're reviewing</RAEyebrow>
      <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 4px', lineHeight: 1.05 }}
          tabIndex={-1} ref={headingRef}>
        {v.name}<span style={{ color: RA_C.rust }}>.</span>
      </h1>
      <p style={{ fontSize: 14, color: RA_C.slate, margin: '0 0 28px' }}>{v.area} · {v.kind}</p>

      <div style={{
        background: RA_C.tealSoft, border: `1.5px solid ${RA_C.teal}`,
        borderRadius: 14, padding: 16, marginBottom: 28,
      }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px', fontSize: 14.5, fontWeight: 600 }}>
          <RASlash size={18}/> Reviewing as: {le}
        </h2>
        <p style={{ fontSize: 13, color: RA_C.char, lineHeight: 1.5, margin: '0 0 8px' }}>
          Lived experience makes reviews useful. Your name is never shown — only the context label appears on your review.
        </p>
        <label htmlFor="rev-le" className="ra-sr-only">Lived-experience context for this review</label>
        <select id="rev-le" value={le} onChange={e => setLe(e.target.value)} style={{ ...INPUT, marginTop: 4 }}>
          {RA_LIVED_EXPERIENCE.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      <fieldset style={FIELDSET}>
        <legend style={LEGEND}>1 · Which access did you experience?</legend>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RA_CATEGORIES.map(c => (
            <RACatChip key={c.id} id={c.id} label={c.title} active={cats.has(c.id)} onToggle={() => toggleCat(c.id)}/>
          ))}
        </div>
      </fieldset>

      <fieldset style={FIELDSET}>
        <legend style={LEGEND}>2 · How accessible was it?</legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RATINGS.map(o => {
            const on = rating === o.id;
            return (
              // A native radio drives this: one tab stop, arrow keys move
              // between options, and the group reports itself correctly.
              <label key={o.id} className="ra-radio-card" style={{
                display: 'flex', gap: 14, padding: 16, alignItems: 'flex-start',
                borderRadius: 12, border: `2px solid ${on ? RA_C.teal : RA_C.line}`,
                background: on ? RA_C.tealSoft : RA_C.paper, cursor: 'pointer',
              }}>
                <input type="radio" name="ra-rating" value={o.id} checked={on}
                       onChange={() => setRating(o.id)} className="ra-sr-only" />
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 999, marginTop: 2,
                  border: `2px solid ${on ? RA_C.teal : RA_C.line}`,
                  background: on ? RA_C.teal : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {on && <span style={{ width: 8, height: 8, borderRadius: 999, background: RA_C.paper }}/>}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600 }}>{o.label}</span>
                    <RAStatusBadge kind={o.id} compact/>
                  </span>
                  <span style={{ display: 'block', fontSize: 13, color: RA_C.slate, lineHeight: 1.4 }}>{o.sub}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div style={{ marginBottom: 28 }}>
        <label htmlFor="rev-text" style={{ ...LEGEND, display: 'block' }}>3 · What worked, what didn't?</label>
        <textarea
          id="rev-text"
          value={text} onChange={e => setText(e.target.value)}
          aria-describedby="rev-text-help"
          placeholder="Hearing loop worked at the counter. Music was loud at the back — had to ask for it down. Bathroom is step-free but the door is heavy."
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: 140,
            border: `1.5px solid ${RA_C.line}`, borderRadius: 12,
            padding: 14, fontSize: RA_INPUT_FONT, color: RA_C.char, lineHeight: 1.55,
            fontFamily: RA_FONT_SANS, resize: 'vertical', background: RA_C.paper,
          }}
        />
        <p id="rev-text-help" style={{ fontSize: 12.5, color: RA_C.slate, margin: '6px 0 0' }}>
          Concrete details help other people plan ahead. Required.
        </p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ ...LEGEND, display: 'block' }}>4 · Photos (optional)</h2>
        <RAPilotNote>Photo upload is not available in this pilot</RAPilotNote>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <RABtn kind="ghost" onClick={() => app.openVenue(v.id)}>Cancel</RABtn>
        <RABtn kind="primary" onClick={submit} disabled={incomplete} ariaDescribedBy="rev-submit-help">Post review</RABtn>
      </div>
      <p id="rev-submit-help" style={{ fontSize: 12.5, color: RA_C.slate, marginTop: 8 }}>
        {incomplete
          ? 'Choose at least one access category and describe what happened to post.'
          : 'Your review will appear on the venue page on this device.'}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Saved
// ─────────────────────────────────────────────────────────────
function RASaved({ app }) {
  const headingRef = useHeadingFocus('saved');
  const saved = app.venues.filter(v => app.user.savedIds.includes(v.id));
  const personalised = app.user.accessProfile.length > 0;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 60px' }}>
      <RAEyebrow style={{ marginBottom: 6 }}>Your places</RAEyebrow>
      <h1 style={H1} tabIndex={-1} ref={headingRef}>Saved<span style={{ color: RA_C.rust }}>.</span></h1>
      <p style={LEAD}>The venues you've kept for later. Open any to revisit access info or write a review.</p>

      {saved.length === 0 ? (
        <p style={{ border: `1px dashed ${RA_C.line}`, borderRadius: 14, padding: 32, textAlign: 'center', color: RA_C.slate, marginTop: 20 }}>
          Nothing saved yet. <button onClick={() => app.goto('discover')} style={LINK}>Explore the map →</button>
        </p>
      ) : (
        <ul className="ra-card-grid" style={{ listStyle: 'none', margin: '20px 0 0', padding: 0 }}>
          {saved.map(v => {
            const { score } = RAScore(v, app.user.accessProfile);
            const tone = RAScoreTone(score);
            return (
              <li key={v.id} style={{
                background: RA_C.paper, border: `1px solid ${RA_C.line}`, borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
              }}>
                <button onClick={() => app.openVenue(v.id)} aria-label={`Open ${v.name}`} style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left',
                }}>
                  <RAPlate h={120} label={v.cover} style={{ borderRadius: 0 }}/>
                  <span style={{ display: 'block', padding: '14px 14px 6px' }}>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{v.name}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: RA_C.slate }}>{v.area} · {v.kind}</span>
                  </span>
                </button>
                <div style={{
                  padding: '6px 14px 10px', marginTop: 'auto',
                  display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontFamily: RA_FONT_MONO, fontSize: 11, fontWeight: 600,
                    color: tone.fg, background: tone.bg,
                    padding: '3px 9px', borderRadius: 999,
                  }}>{score}/10 {personalised ? 'match' : 'access'}</span>
                  <button onClick={() => app.toggleSave(v.id)} aria-label={`Remove ${v.name} from saved`} style={{
                    background: 'transparent', border: 0, cursor: 'pointer', color: RA_C.slate,
                    fontSize: 12, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3,
                    padding: '12px 8px', margin: '-6px -8px',
                  }}>Remove</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// My reviews
// ─────────────────────────────────────────────────────────────
function RAReviews({ app }) {
  const headingRef = useHeadingFocus('reviews');
  const mine = app.venues.flatMap(v => v.reviews.filter(r => r.mine).map(r => ({ ...r, venue: v })));

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }}>
      <RAEyebrow style={{ marginBottom: 6 }}>{mine.length} reviews · {app.user.livedExperience}</RAEyebrow>
      <h1 style={H1} tabIndex={-1} ref={headingRef}>Your contributions<span style={{ color: RA_C.rust }}>.</span></h1>
      <p style={LEAD}>Reviews you've shared. Each one helps another person plan their day.</p>

      {mine.length === 0 ? (
        <p style={{ border: `1px dashed ${RA_C.line}`, borderRadius: 14, padding: 32, textAlign: 'center', color: RA_C.slate, marginTop: 20 }}>
          You haven't written a review yet. <button onClick={() => app.goto('discover')} style={LINK}>Find a venue →</button>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
          {mine.map((r, i) => (
            <article key={`${r.venue.id}-${r.id}-${i}`} style={{
              background: RA_C.paper, border: `1px solid ${RA_C.hair}`, borderRadius: 14, padding: 18,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <button onClick={() => app.openVenue(r.venue.id)} style={{
                  background: 'transparent', border: 0, padding: '4px 0', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: RA_C.teal, textDecoration: 'underline', textUnderlineOffset: 3 }}>{r.venue.name}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: RA_C.slate }}>
                    {r.venue.area} · {RA_CATEGORIES.find(c => c.id === r.cat)?.title}
                  </span>
                </button>
                <RAStatusBadge kind={r.rating} compact/>
              </div>
              <p style={{ margin: 0, fontSize: 14.5, color: RA_C.char, lineHeight: 1.55 }}>{r.text}</p>
              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, color: RA_C.slate }}>{r.when}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────
function RAProfile({ app }) {
  const headingRef = useHeadingFocus('profile');
  const u = app.user;
  const myReviewCount = app.venues.reduce((n, v) => n + v.reviews.filter(r => r.mine).length, 0);

  function toggleCat(id) {
    const next = new Set(u.accessProfile);
    next.has(id) ? next.delete(id) : next.add(id);
    app.setUser({ ...u, accessProfile: Array.from(next) });
  }

  const SETTINGS = [
    { label: 'Accessibility settings', meta: 'Text · Contrast · Motion', onClick: () => app.openA11y() },
    { label: 'Lived-experience context', meta: u.livedExperience, onClick: () => app.goto('onboarding') },
    { label: 'Notifications', meta: 'Not in this pilot' },
    { label: 'Privacy & data', meta: 'Not in this pilot' },
    { label: 'Download my data', meta: 'Not in this pilot' },
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px 60px' }}>
      {u.signedIn ? (
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <span aria-hidden="true" style={{
            width: 76, height: 76, borderRadius: 999, background: RA_C.teal, color: RA_C.paper,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', flexShrink: 0,
          }}>{u.initials}</span>
          <div>
            <RAEyebrow>{u.city} · Member since {u.memberSince}</RAEyebrow>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: '4px 0 0' }}
                tabIndex={-1} ref={headingRef}>
              {u.name}<span style={{ color: RA_C.rust }}>.</span>
            </h1>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13.5, color: RA_C.slate }}>{u.livedExperience}</p>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <RAEyebrow>Not signed in</RAEyebrow>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', margin: '4px 0 8px' }}
              tabIndex={-1} ref={headingRef}>
            Your profile<span style={{ color: RA_C.rust }}>.</span>
          </h1>
          <p style={{ ...LEAD, marginBottom: 14 }}>
            Your access profile is kept on this device and works without an account. Signing in would sync it across devices in the live product.
          </p>
          <RABtn kind="primary" onClick={() => app.goto('onboarding')}>Set up my access profile →</RABtn>
        </div>
      )}

      <h2 className="ra-sr-only">Your activity</h2>
      <div className="ra-stat-grid" style={{ marginBottom: 28 }}>
        {[
          { n: myReviewCount, l: 'Reviews shared' },
          { n: u.savedIds.length, l: 'Saved places' },
          { n: u.accessProfile.length, l: 'Access needs set' },
        ].map(s => (
          <div key={s.l} style={{
            background: RA_C.paper, border: `1px solid ${RA_C.hair}`, borderRadius: 14, padding: '18px 16px',
          }}>
            <div style={{ fontFamily: RA_FONT_MONO, fontSize: 36, fontWeight: 700, color: RA_C.teal, lineHeight: 1, marginBottom: 6 }}>{s.n}</div>
            <div style={{ fontSize: 13, color: RA_C.slate, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="ra-two-col">
        <div style={{ background: RA_C.paper, border: `1px solid ${RA_C.hair}`, borderRadius: 16, padding: 22 }}>
          <RAEyebrow style={{ marginBottom: 6 }}>Your access profile</RAEyebrow>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.015em' }}>
            What we use to filter venues for you.
          </h2>
          <p style={{ fontSize: 13.5, color: RA_C.slate, margin: '0 0 14px' }}>
            Toggle any category. We only use this to rank and filter — never shared, never used for ads.
          </p>
          <div className="ra-cat-grid">
            {RA_CATEGORIES.map(c => {
              const on = u.accessProfile.includes(c.id);
              return (
                <button key={c.id} type="button" onClick={() => toggleCat(c.id)} aria-pressed={on} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 12, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: `1.5px solid ${on ? RA_C.teal : RA_C.line}`,
                  background: on ? RA_C.tealSoft : RA_C.paper,
                }}>
                  <span aria-hidden="true" style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: on ? RA_C.teal : RA_C.stone,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <RACatIcon name={c.id} size={16} color={on ? RA_C.paper : RA_C.teal}/>
                  </span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.title}</span>
                  <RAToggle checked={on} presentational />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="ra-sr-only">Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SETTINGS.map(r => {
              // Rows with nothing behind them render as text, not as buttons
              // that look actionable, take a tab stop and do nothing.
              if (!r.onClick) {
                return (
                  <div key={r.label} style={{ ...SETTING_ROW, background: RA_C.paper, border: `1px solid ${RA_C.hair}`, color: RA_C.slate }}>
                    <span>
                      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{r.label}</span>
                      <span style={{ display: 'block', fontSize: 12.5, marginTop: 2 }}>{r.meta}</span>
                    </span>
                  </div>
                );
              }
              return (
                <button key={r.label} onClick={r.onClick} style={{
                  ...SETTING_ROW, cursor: 'pointer', textAlign: 'left',
                  background: RA_C.paper, border: `1px solid ${RA_C.line}`,
                }}>
                  <span>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{r.label}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: RA_C.slate, marginTop: 2 }}>{r.meta}</span>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
                    <path d="M9 5l7 7-7 7" stroke={RA_C.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              );
            })}

            {u.signedIn && (
              <RABtn kind="ghost" fullWidth onClick={() => app.signOut()}>Sign out</RABtn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared local styles
// ─────────────────────────────────────────────────────────────
const H1 = { fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.02 };
const LEAD = { fontSize: 17, color: RA_C.char, lineHeight: 1.5, margin: 0, maxWidth: '60ch' };
const LABEL = { display: 'block', fontSize: 13, fontWeight: 600, color: RA_C.char, marginBottom: 6, marginTop: 18 };
const SECTION_H = { fontFamily: RA_FONT_MONO, fontWeight: 500, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: RA_C.slate, margin: '0 0 10px' };
const LEGEND = { fontFamily: RA_FONT_MONO, fontWeight: 500, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: RA_C.slate, padding: 0, marginBottom: 10 };
const FIELDSET = { border: 0, padding: 0, margin: '0 0 28px', minWidth: 0 };
const INPUT = {
  width: '100%', boxSizing: 'border-box', background: RA_C.paper, color: RA_C.char,
  border: `1.5px solid ${RA_C.line}`, borderRadius: 10,
  padding: '12px 14px', fontSize: RA_INPUT_FONT, fontFamily: RA_FONT_SANS,
};
const ROW = { display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28, flexWrap: 'wrap' };
const HELP = {
  display: 'flex', gap: 10, alignItems: 'flex-start',
  background: RA_C.stone, borderRadius: 14, padding: 14,
  fontSize: 13.5, color: RA_C.char, lineHeight: 1.5,
};
const LINK = {
  background: 'transparent', border: 0, padding: '6px 0', cursor: 'pointer',
  color: RA_C.teal, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3,
  fontSize: 'inherit', fontFamily: 'inherit',
};
const SETTING_ROW = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '14px 16px', borderRadius: 12, minHeight: 44, boxSizing: 'border-box',
};

Object.assign(window, { RAOnboarding, RADiscover, RAVenue, RAReview, RASaved, RAReviews, RAProfile, RA_LIVED_EXPERIENCE });
