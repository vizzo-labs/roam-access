// Roam Access pilot v2 — screens: Map, Venue, AllReviews, Review, Thanks, Saved, Me, A11ySheet.

// ─────────────────────────────────────────────────────────────
// MAP — verdict-coded pins, one card at a time
// ─────────────────────────────────────────────────────────────
function V2MapView({
  app
}) {
  const query = app.query || {
    cats: [],
    tags: [],
    label: 'All places'
  };
  const results = ra2Search(query, app.user?.needs || []).slice(0, 6);
  const [selId, setSelId] = React.useState(results[0]?.id || null);
  const sel = results.find(r => r.id === selId) || results[0];
  const h = useV2Heading('map');
  const pinColor = {
    works: C2.blue,
    check: C2.amber,
    barrier: C2.red,
    unknown: '#475569'
  };
  const pinIcon = {
    works: '✓',
    check: '!',
    barrier: '✗',
    unknown: '?'
  };
  // Remap data coords into the band clear of the floating search chrome above
  // and the selected card below, so no pin ever renders under either.
  const pinX = x => `${(0.06 + x * 0.88) * 100}%`;
  const pinY = y => `${(0.2 + y * 0.5) * 100}%`;
  const legendKinds = [...new Set(results.map(r => r.verdict.kind))];
  return /*#__PURE__*/React.createElement(V2Shell, {
    scroll: false,
    tabs: true,
    app: app,
    active: "home"
  }, /*#__PURE__*/React.createElement("h1", {
    ref: h,
    tabIndex: -1,
    className: "ra-sr-only"
  }, "Map of results \u2014 ", query.label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 1,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(circle at 30% 55%, #DCE7E1 0 14%, transparent 14%),
             radial-gradient(circle at 75% 25%, #DCE7E1 0 11%, transparent 11%),
             repeating-linear-gradient(45deg, transparent 0 24px, ${C2.hair} 24px 25px),
             ${C2.stone}`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'var(--ra-shell-top)',
      left: 18,
      right: 18,
      display: 'flex',
      gap: 8,
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => app.goto('results'),
    style: {
      flex: 1,
      minWidth: 0,
      minHeight: 54,
      borderRadius: 999,
      border: `1.5px solid ${C2.line}`,
      background: C2.paper,
      padding: '0 18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: F2,
      fontSize: 15.5,
      fontWeight: 600,
      color: C2.char,
      textAlign: 'left',
      boxSizing: 'border-box'
    },
    "aria-label": `Back to list. Current search: ${query.label}`
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 5l-7 7 7 7",
    stroke: C2.char,
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, query.label), /*#__PURE__*/React.createElement(V2Mic, {
    size: 18,
    color: C2.teal
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => app.goto('results'),
    "aria-label": "Show as list",
    style: {
      minHeight: 54,
      minWidth: 54,
      borderRadius: 999,
      border: `1.5px solid ${C2.line}`,
      background: C2.paper,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 6h16M4 12h16M4 18h16",
    stroke: C2.char,
    strokeWidth: "2",
    strokeLinecap: "round"
  })))), /*#__PURE__*/React.createElement("div", {
    role: "group",
    "aria-label": "Map of results"
  }, results.map(r => {
    const on = r.id === selId;
    return /*#__PURE__*/React.createElement("button", {
      key: r.id,
      onClick: () => setSelId(r.id),
      "aria-label": `${r.name}, ${r.kind}, ${V2_VERDICT_META[r.verdict.kind].label}`,
      "aria-pressed": on,
      style: {
        position: 'absolute',
        left: pinX(r.coords[0]),
        top: pinY(r.coords[1]),
        transform: 'translate(-50%,-100%)',
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        padding: 0,
        zIndex: on ? 2 : 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        width: on ? 52 : 44,
        height: on ? 52 : 44,
        borderRadius: 999,
        background: pinColor[r.verdict.kind],
        color: C2.paper,
        border: `3px solid ${C2.paper}`,
        boxShadow: `0 0 0 1px ${C2.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: M2,
        fontWeight: 800,
        fontSize: on ? 20 : 15
      }
    }, pinIcon[r.verdict.kind]), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        display: 'block',
        width: 0,
        height: 0,
        margin: '-2px auto 0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `8px solid ${pinColor[r.verdict.kind]}`
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(var(--ra-shell-top) + 66px)',
      left: 18,
      zIndex: 2,
      background: C2.paper,
      border: `1px solid ${C2.line}`,
      borderRadius: 12,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: F2,
      fontSize: 12.5,
      fontWeight: 600,
      color: C2.char
    }
  }, [['works', 'Works for you'], ['check', 'Check first'], ['barrier', 'Has barriers'], ['unknown', 'No info yet']].filter(([k]) => k !== 'unknown' || legendKinds.includes('unknown')).map(([v, l]) => /*#__PURE__*/React.createElement("span", {
    key: v,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 11,
      height: 11,
      borderRadius: 999,
      background: pinColor[v]
    }
  }), l))), /*#__PURE__*/React.createElement("p", {
    style: {
      position: 'absolute',
      right: 18,
      bottom: sel ? 172 : 20,
      zIndex: 2,
      margin: 0,
      background: C2.paper,
      border: `1px solid ${C2.line}`,
      borderRadius: 10,
      padding: '6px 10px',
      fontFamily: M2,
      fontSize: 10,
      color: C2.slate,
      letterSpacing: '0.06em'
    }
  }, "DEMO MAP"), sel && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 16,
      left: 18,
      right: 18,
      zIndex: 3,
      background: C2.paper,
      borderRadius: 20,
      border: `1.5px solid ${C2.line}`,
      padding: 18,
      boxShadow: '0 12px 32px rgba(26,26,26,0.10)',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: F2,
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: '-0.015em',
      color: C2.char,
      marginBottom: 3
    }
  }, sel.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: F2,
      fontSize: 14,
      color: C2.slate
    }
  }, sel.kind, " \xB7 ", sel.mins, " min away")), /*#__PURE__*/React.createElement(V2Verdict, {
    kind: sel.verdict.kind
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: F2,
      fontSize: 14.5,
      color: C2.char,
      lineHeight: 1.45,
      marginBottom: 14
    }
  }, sel.verdict.why), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => app.goto('venue', sel.id),
    style: {
      flex: 1,
      minHeight: 50,
      borderRadius: 12,
      border: 0,
      background: C2.teal,
      color: C2.paper,
      fontFamily: F2,
      fontSize: 15.5,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "See details"), /*#__PURE__*/React.createElement("button", {
    onClick: () => app.toggleSave(sel.id),
    "aria-label": app.world.saved.includes(sel.id) ? `Remove ${sel.name} from saved` : `Save ${sel.name}`,
    "aria-pressed": app.world.saved.includes(sel.id),
    style: {
      minHeight: 50,
      minWidth: 50,
      borderRadius: 12,
      border: `1.5px solid ${C2.line}`,
      background: app.world.saved.includes(sel.id) ? C2.tealSoft : C2.paper,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: app.world.saved.includes(sel.id) ? C2.teal : 'none',
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 4h12v17l-6-4-6 4V4Z",
    stroke: app.world.saved.includes(sel.id) ? C2.teal : C2.char,
    strokeWidth: "2",
    strokeLinejoin: "round"
  })))))));
}

// ─────────────────────────────────────────────────────────────
// VENUE — verdict first, plain language, detail on demand
// ─────────────────────────────────────────────────────────────
function V2VenueView({
  app
}) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('venue-' + v.id);
  const verdict = ra2Verdict(v, app.user?.needs || []);
  const saved = app.world.saved.includes(v.id);
  const meta = V2_VERDICT_META[verdict.kind];
  const myReviews = app.world.myReviews[v.id] || [];
  // Written reviews and quick community check-ins are different numbers —
  // never let a button promise reviews the next screen doesn't show.
  const written = v.reviews.length + myReviews.length;
  React.useEffect(() => {
    app.markVisited(v.id);
  }, [v.id]); // eslint-disable-line

  const verdictLead = {
    works: `${verdict.works.slice(0, 3).map(f => f.s).join(', ')} — confirmed by ${v.verified} community check-ins.`,
    check: `Mostly good, with things to know before you go. Based on ${v.verified} community check-ins.`,
    barrier: `The community has flagged real barriers here, from ${v.verified} check-ins.`,
    unknown: `Nobody with your access needs has checked this venue yet. Your visit could be the first data point.`
  }[verdict.kind];
  const bar = /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 22px calc(var(--ra-tabs-pad) + 8px)',
      background: C2.paper,
      borderTop: `1px solid ${C2.hair}`,
      display: 'flex',
      gap: 10,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "primary",
    style: {
      flex: 1.5
    },
    onClick: () => app.toast('Demo only — this opens Maps in the real app.')
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z",
    stroke: C2.paper,
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "2.5",
    stroke: C2.paper,
    strokeWidth: "2"
  })), "Directions"), /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "outline",
    style: {
      flex: 1
    },
    onClick: () => app.toast('Demo only — this dials the venue in the real app.')
  }, "Call"));
  return /*#__PURE__*/React.createElement(V2Shell, {
    bar: bar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 22px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(V2Back, {
    app: app,
    to: app.venueOrigin,
    label: "Back"
  }), /*#__PURE__*/React.createElement(V2RoundBtn, {
    onClick: () => app.toggleSave(v.id),
    pressed: saved,
    ariaLabel: saved ? `Remove ${v.name} from saved` : `Save ${v.name}`,
    style: saved ? {
      background: C2.tealSoft,
      borderColor: C2.teal
    } : {}
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: saved ? C2.teal : 'none',
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 4h12v17l-6-4-6 4V4Z",
    stroke: saved ? C2.teal : C2.char,
    strokeWidth: "2",
    strokeLinejoin: "round"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 22px 24px'
    }
  }, /*#__PURE__*/React.createElement(V2Plate, {
    style: {
      marginBottom: 16
    }
  }), /*#__PURE__*/React.createElement("h1", {
    ref: h,
    tabIndex: -1,
    style: {
      ...V2_H1,
      fontSize: 30,
      lineHeight: 1.05,
      marginBottom: 4
    }
  }, v.name, /*#__PURE__*/React.createElement("span", {
    style: {
      color: C2.rust
    }
  }, ".")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: C2.slate,
      margin: '0 0 16px',
      fontFamily: F2
    }
  }, v.kind, " \xB7 ", v.area, " \xB7 ", v.mins, " min away"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: meta.bg,
      borderRadius: 18,
      padding: 20,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(V2Verdict, {
    kind: verdict.kind,
    big: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16.5,
      lineHeight: 1.5,
      color: C2.char,
      margin: '12px 0 0',
      fontFamily: F2
    }
  }, verdictLead)), verdict.barriers.length > 0 && /*#__PURE__*/React.createElement("section", {
    style: {
      borderRadius: 18,
      border: `1.5px solid ${C2.line}`,
      overflow: 'hidden',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      padding: '16px 18px 6px',
      fontSize: 14,
      fontWeight: 700,
      color: C2.red,
      margin: 0,
      fontFamily: F2,
      letterSpacing: '0.02em'
    }
  }, "BARRIERS"), verdict.barriers.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.t,
    style: {
      display: 'flex',
      gap: 12,
      padding: '12px 18px',
      alignItems: 'flex-start',
      borderTop: `1px solid ${C2.hair}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 22,
      height: 22,
      borderRadius: 999,
      background: C2.red,
      color: C2.redBg,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 800,
      fontFamily: M2
    }
  }, "\u2717"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      lineHeight: 1.45,
      fontFamily: F2
    }
  }, f.t)))), verdict.works.length > 0 && /*#__PURE__*/React.createElement("section", {
    style: {
      borderRadius: 18,
      border: `1.5px solid ${C2.line}`,
      overflow: 'hidden',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      padding: '16px 18px 6px',
      fontSize: 14,
      fontWeight: 700,
      color: C2.blue,
      margin: 0,
      fontFamily: F2,
      letterSpacing: '0.02em'
    }
  }, "WHAT WORKS"), verdict.works.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.t,
    style: {
      display: 'flex',
      gap: 12,
      padding: '12px 18px',
      alignItems: 'flex-start',
      borderTop: `1px solid ${C2.hair}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 22,
      height: 22,
      borderRadius: 999,
      background: C2.blue,
      color: C2.blueBg,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 800,
      fontFamily: M2
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      lineHeight: 1.45,
      fontFamily: F2
    }
  }, f.t)))), verdict.checks.length > 0 && /*#__PURE__*/React.createElement("section", {
    style: {
      borderRadius: 18,
      border: `1.5px solid ${C2.line}`,
      overflow: 'hidden',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      padding: '16px 18px 6px',
      fontSize: 14,
      fontWeight: 700,
      color: C2.amber,
      margin: 0,
      fontFamily: F2,
      letterSpacing: '0.02em'
    }
  }, "CHECK BEFORE YOU GO"), verdict.checks.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.t,
    style: {
      display: 'flex',
      gap: 12,
      padding: '12px 18px',
      alignItems: 'flex-start',
      borderTop: `1px solid ${C2.hair}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 22,
      height: 22,
      borderRadius: 999,
      background: C2.amber,
      color: C2.amberBg,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 800,
      fontFamily: M2
    }
  }, "!"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      lineHeight: 1.45,
      fontFamily: F2
    }
  }, f.t)))), v.reviews[0] && /*#__PURE__*/React.createElement("div", {
    style: {
      background: C2.stone,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: C2.slate,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontFamily: M2,
      margin: '0 0 10px'
    }
  }, "From the community"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.5,
      margin: '0 0 10px',
      fontFamily: F2
    }
  }, "\u201C", v.reviews[0].text, "\u201D"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: C2.slate,
      fontWeight: 600,
      margin: 0,
      fontFamily: F2
    }
  }, v.reviews[0].who, " \xB7 ", v.reviews[0].when)), written > 0 ? /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "ghost",
    onClick: () => app.goto('reviews', v.id)
  }, "Read all ", written, " ", written === 1 ? 'review' : 'reviews') : /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "ghost",
    onClick: () => app.goto('review', v.id)
  }, "No written reviews yet \u2014 add yours"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10
    }
  }), /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "outline",
    onClick: () => app.goto('review', v.id)
  }, "Share your experience"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: M2,
      fontSize: 10.5,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: C2.slate,
      textAlign: 'center',
      margin: '16px 0 0'
    }
  }, "Fictional venue \xB7 pilot sample data")));
}

// ─────────────────────────────────────────────────────────────
// ALL REVIEWS — filter by lived experience
// ─────────────────────────────────────────────────────────────
function V2AllReviews({
  app
}) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('reviews-' + v.id);
  const [filter, setFilter] = React.useState('All');
  const [helped, setHelped] = React.useState({});
  const mine = (app.world.myReviews[v.id] || []).map(r => ({
    ...r,
    mineFlag: true
  }));
  const all = [...mine, ...v.reviews];
  const filters = ['All', 'Wheelchair', 'Blind / low vision', 'Deaf', 'Autistic', 'Chronic illness'];
  const shown = filter === 'All' ? all : all.filter(r => r.tag === filter);
  return /*#__PURE__*/React.createElement(V2Shell, {
    tabs: true,
    app: app,
    active: "home"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 22px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(V2Back, {
    app: app,
    to: "venue",
    id: v.id,
    label: `Back to ${v.name}`
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    ref: h,
    tabIndex: -1,
    style: {
      ...V2_H1,
      fontSize: 19,
      letterSpacing: '-0.015em'
    }
  }, v.name, " reviews"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: C2.slate,
      margin: 0,
      fontFamily: F2
    }
  }, all.length, " written \xB7 ", v.verified, " quick check-ins"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 22px 0',
      display: 'flex',
      gap: 7,
      flexWrap: 'wrap'
    },
    role: "group",
    "aria-label": "Filter reviews by lived experience"
  }, filters.map(f => {
    const on = filter === f;
    return /*#__PURE__*/React.createElement("button", {
      key: f,
      onClick: () => setFilter(f),
      "aria-pressed": on,
      style: {
        minHeight: 44,
        padding: '0 16px',
        borderRadius: 999,
        cursor: 'pointer',
        border: on ? `1.5px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
        background: on ? C2.teal : C2.paper,
        color: on ? C2.paper : C2.char,
        fontFamily: F2,
        fontSize: 14.5,
        fontWeight: 600
      }
    }, f);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 22px 24px'
    }
  }, shown.map((r, i) => /*#__PURE__*/React.createElement("article", {
    key: r.id || i,
    style: {
      border: `1.5px solid ${C2.hair}`,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: C2.teal,
      fontFamily: F2
    }
  }, r.who), /*#__PURE__*/React.createElement(V2Verdict, {
    kind: r.v
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15.5,
      lineHeight: 1.5,
      margin: '0 0 12px',
      color: C2.char,
      fontFamily: F2
    }
  }, r.text), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: C2.slate,
      fontFamily: F2
    }
  }, r.when, r.mineFlag ? ' · yours, on this device' : ''), !r.mineFlag && /*#__PURE__*/React.createElement("button", {
    onClick: () => setHelped(prev => ({
      ...prev,
      [r.id]: !prev[r.id]
    })),
    "aria-pressed": !!helped[r.id],
    style: {
      minHeight: 44,
      padding: '0 14px',
      borderRadius: 999,
      border: `1.5px solid ${helped[r.id] ? C2.teal : C2.line}`,
      background: helped[r.id] ? C2.tealSoft : C2.paper,
      cursor: 'pointer',
      fontFamily: F2,
      fontSize: 13.5,
      fontWeight: 600,
      color: helped[r.id] ? C2.teal : C2.char,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 11v9M7 11l4-8a2 2 0 0 1 2 2v4h6l-2 9a2 2 0 0 1-2 2H7M7 11H4v9h3",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), "Helpful \xB7 ", (r.helpful || 0) + (helped[r.id] ? 1 : 0))))), !shown.length && /*#__PURE__*/React.createElement("p", {
    style: {
      padding: 24,
      textAlign: 'center',
      color: C2.slate,
      fontSize: 15,
      border: `1.5px dashed ${C2.line}`,
      borderRadius: 16,
      fontFamily: F2
    }
  }, "No reviews from this lived experience yet \u2014 yours could be the first."), /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "primary",
    onClick: () => app.goto('review', v.id)
  }, "Share your experience")));
}

// ─────────────────────────────────────────────────────────────
// REVIEW — three taps, done
// ─────────────────────────────────────────────────────────────
function V2ReviewView({
  app
}) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('review-' + v.id);
  const [choice, setChoice] = React.useState(null);
  const options = [{
    kind: 'works',
    label: 'It worked for me',
    sub: 'I could get in, get around, and enjoy it'
  }, {
    kind: 'check',
    label: 'Some barriers',
    sub: 'I managed, but with workarounds'
  }, {
    kind: 'barrier',
    label: "It didn't work",
    sub: "I couldn't use the venue as I needed"
  }];
  function send() {
    if (!choice) return;
    app.addReview(v.id, choice);
    app.goto('thanks', v.id);
  }
  return /*#__PURE__*/React.createElement(V2Shell, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 22px 0',
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => app.goto('venue', v.id),
    style: {
      minHeight: 48,
      padding: '0 18px',
      borderRadius: 999,
      border: 0,
      background: 'transparent',
      color: C2.slate,
      fontFamily: F2,
      fontSize: 16,
      fontWeight: 600,
      cursor: 'pointer',
      textDecoration: 'underline',
      textUnderlineOffset: 4
    }
  }, "Skip")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 24px 24px'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: M2,
      fontSize: 12,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: C2.slate,
      margin: '0 0 10px'
    }
  }, "You visited recently"), /*#__PURE__*/React.createElement("h1", {
    ref: h,
    tabIndex: -1,
    style: {
      ...V2_H1,
      fontSize: 30,
      lineHeight: 1.1,
      marginBottom: 8
    }
  }, "How was ", v.name, /*#__PURE__*/React.createElement("span", {
    style: {
      color: C2.rust
    }
  }, "?")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16.5,
      color: C2.char,
      lineHeight: 1.5,
      margin: '0 0 26px',
      fontFamily: F2
    }
  }, "One tap helps thousands of people plan their day. That's it \u2014 details are optional."), options.map(o => {
    const meta = V2_VERDICT_META[o.kind];
    const on = choice === o.kind;
    return /*#__PURE__*/React.createElement("button", {
      key: o.kind,
      onClick: () => setChoice(o.kind),
      "aria-pressed": on,
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        minHeight: 84,
        borderRadius: 18,
        padding: '12px 18px',
        marginBottom: 10,
        border: on ? `2.5px solid ${meta.fg}` : `1.5px solid ${C2.line}`,
        background: on ? meta.bg : C2.paper,
        cursor: 'pointer',
        fontFamily: F2,
        textAlign: 'left',
        boxSizing: 'border-box'
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        width: 44,
        height: 44,
        borderRadius: 999,
        background: meta.fg,
        color: meta.bg,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 19,
        fontWeight: 800,
        fontFamily: M2
      }
    }, meta.icon), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 18.5,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        marginBottom: 3,
        color: C2.char
      }
    }, o.label), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 14.5,
        color: C2.slate,
        lineHeight: 1.35
      }
    }, o.sub)));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => app.toast('Voice notes aren’t in this pilot demo yet.'),
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      justifyContent: 'center',
      minHeight: 60,
      borderRadius: 16,
      marginTop: 14,
      border: `1.5px dashed ${C2.teal}`,
      background: C2.tealSoft,
      cursor: 'pointer',
      fontFamily: F2
    }
  }, /*#__PURE__*/React.createElement(V2Mic, {
    size: 22,
    color: C2.teal
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16.5,
      fontWeight: 700,
      color: C2.teal
    }
  }, "Prefer to talk? Record a voice note")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "primary",
    onClick: send,
    disabled: !choice,
    ariaDescribedBy: "rev-hint"
  }, "Send it \u2192")), /*#__PURE__*/React.createElement("p", {
    id: "rev-hint",
    style: {
      fontSize: 13.5,
      color: C2.slate,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 1.4,
      fontFamily: F2
    }
  }, choice ? 'Shown with your lived experience — never your name.' : 'Choose one of the three options above to send.')));
}

// ─────────────────────────────────────────────────────────────
// THANKS — the community loop, made visible
// ─────────────────────────────────────────────────────────────
function V2Thanks({
  app
}) {
  const v = RA2_VENUES.find(x => x.id === app.selectedId) || RA2_VENUES[0];
  const h = useV2Heading('thanks');
  const name = app.user?.name;
  return /*#__PURE__*/React.createElement(V2Shell, {
    bg: C2.teal
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '56px 26px 0',
      textAlign: 'center'
    },
    "data-ra-oncolor": ""
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      width: 88,
      height: 88,
      borderRadius: 999,
      margin: '0 auto 26px',
      background: 'rgba(250,249,246,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "40",
    height: "32",
    viewBox: "0 0 16 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 6l5 5L15 1",
    stroke: C2.paper,
    strokeWidth: "2",
    strokeLinecap: "round"
  }))), /*#__PURE__*/React.createElement("h1", {
    ref: h,
    tabIndex: -1,
    style: {
      ...V2_H1,
      fontSize: 34,
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      color: C2.paper,
      marginBottom: 12
    }
  }, "Thanks", name ? `, ${name}` : '', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'rgba(250,249,246,0.55)'
    }
  }, ".")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17.5,
      lineHeight: 1.5,
      color: 'rgba(250,249,246,0.9)',
      margin: '0 auto',
      maxWidth: 300,
      fontFamily: F2
    }
  }, "Your review of ", v.name, " is live. Here's what your voice does:")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '30px 26px 0'
    }
  }, [{
    n: '~1,200',
    l: 'people search this area every month'
  }, {
    n: '14',
    l: `people saved ${v.name} after reviews like yours`
  }, {
    n: String(app.user?.stats?.helped ?? 38),
    l: 'places you’ve helped make findable'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.l,
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
      padding: '16px 18px',
      borderRadius: 16,
      marginBottom: 10,
      background: 'rgba(250,249,246,0.09)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: M2,
      fontSize: 26,
      fontWeight: 700,
      color: C2.paper,
      whiteSpace: 'nowrap'
    }
  }, s.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: 'rgba(250,249,246,0.88)',
      lineHeight: 1.4,
      fontFamily: F2
    }
  }, s.l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 26px 30px'
    },
    "data-ra-oncolor": ""
  }, /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "rust",
    onClick: () => app.goto('home')
  }, "Done"), /*#__PURE__*/React.createElement("button", {
    onClick: () => app.toast('Details and photos aren’t in this pilot demo yet.'),
    style: {
      width: '100%',
      minHeight: 54,
      marginTop: 8,
      borderRadius: 16,
      border: 0,
      background: 'transparent',
      color: C2.paper,
      fontFamily: F2,
      fontSize: 16,
      fontWeight: 600,
      cursor: 'pointer',
      textDecoration: 'underline',
      textUnderlineOffset: 4
    }
  }, "Add details or photos")));
}

// ─────────────────────────────────────────────────────────────
// SAVED — plan your day out
// ─────────────────────────────────────────────────────────────
function V2SavedView({
  app
}) {
  const h = useV2Heading('saved');
  const places = RA2_VENUES.filter(v => app.world.saved.includes(v.id));
  return /*#__PURE__*/React.createElement(V2Shell, {
    tabs: true,
    app: app,
    active: "saved"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 22px 24px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    ref: h,
    tabIndex: -1,
    style: {
      ...V2_H1,
      fontSize: 30,
      marginBottom: 6
    }
  }, "Saved", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C2.rust
    }
  }, ".")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15.5,
      color: C2.slate,
      margin: '0 0 18px',
      lineHeight: 1.45,
      fontFamily: F2
    }
  }, "Your places. We'll tell you if their access changes."), places.map(p => {
    const verdict = ra2Verdict(p, app.user?.needs || []);
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      onClick: () => app.goto('venue', p.id),
      style: {
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: F2,
        background: C2.paper,
        border: `1.5px solid ${C2.line}`,
        borderRadius: 18,
        padding: 18,
        marginBottom: 12,
        display: 'block',
        boxSizing: 'border-box'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '-0.015em',
        color: C2.char,
        marginBottom: 3
      }
    }, p.name), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontSize: 13.5,
        color: C2.slate
      }
    }, p.kind, " \xB7 ", p.area)), /*#__PURE__*/React.createElement(V2Verdict, {
      kind: verdict.kind
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        color: C2.char,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        color: C2.rust,
        fontWeight: 700
      }
    }, "/"), p.note));
  }), !places.length && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      textAlign: 'center',
      border: `1.5px dashed ${C2.line}`,
      borderRadius: 18
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15.5,
      color: C2.slate,
      margin: '0 0 16px',
      fontFamily: F2
    }
  }, "Nothing saved yet. Find somewhere that works and keep it here."), /*#__PURE__*/React.createElement(V2BigBtn, {
    kind: "primary",
    onClick: () => app.goto('home')
  }, "Explore places"))));
}

// ─────────────────────────────────────────────────────────────
// ME — profile, needs, impact, settings
// ─────────────────────────────────────────────────────────────
function V2Me({
  app
}) {
  const h = useV2Heading('me');
  const name = app.user?.name;
  const needChips = RA2_NEEDS.filter(n => (app.user?.needs || []).includes(n.id)).map(n => n.chip);
  const stats = app.user?.stats || RA2_DEFAULT_STATS;
  const rows = [{
    l: 'Accessibility settings',
    m: 'Text size · contrast · motion · voice',
    hi: true,
    fn: () => app.openA11y()
  }, {
    l: 'My reviews',
    m: `${stats.reviews} shared`,
    fn: () => app.toast('Full review history isn’t in this pilot demo.')
  }, {
    l: 'Notifications',
    m: 'Access changes at saved places',
    fn: () => app.toast('Notifications aren’t in this pilot demo.')
  }, {
    l: 'Privacy & my data',
    m: 'You control everything',
    fn: () => app.toast('This pilot stores everything on your device only.')
  }, {
    l: 'Invite a friend',
    m: 'Every new voice makes the map better',
    fn: () => app.toast('Invites aren’t in this pilot demo.')
  }, {
    l: 'Restart the demo',
    m: 'Clear this device and start fresh',
    fn: () => app.resetDemo()
  }];
  return /*#__PURE__*/React.createElement(V2Shell, {
    tabs: true,
    app: app,
    active: "me"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 22px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 64,
      height: 64,
      borderRadius: 999,
      background: C2.teal,
      color: C2.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 22,
      fontFamily: F2
    }
  }, (name || 'You').charAt(0).toUpperCase()), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    ref: h,
    tabIndex: -1,
    style: {
      ...V2_H1,
      fontSize: 24,
      letterSpacing: '-0.02em'
    }
  }, name || 'You', /*#__PURE__*/React.createElement("span", {
    style: {
      color: C2.rust
    }
  }, ".")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: C2.slate,
      margin: 0,
      fontFamily: F2
    }
  }, "Sydney \xB7 pilot demo member"))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: C2.stone,
      borderRadius: 18,
      padding: 18,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 15.5,
      fontWeight: 700,
      margin: 0,
      fontFamily: F2
    }
  }, "What I need"), /*#__PURE__*/React.createElement("button", {
    onClick: () => app.goto('setup'),
    style: {
      minHeight: 44,
      padding: '0 14px',
      borderRadius: 999,
      border: 0,
      background: 'transparent',
      color: C2.teal,
      fontFamily: F2,
      fontSize: 14.5,
      fontWeight: 700,
      cursor: 'pointer',
      textDecoration: 'underline',
      textUnderlineOffset: 4
    }
  }, "Edit")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, needChips.length ? needChips.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      padding: '8px 13px',
      borderRadius: 999,
      background: C2.paper,
      color: C2.char,
      border: `1px solid ${C2.line}`,
      fontFamily: F2
    }
  }, t)) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: C2.slate,
      fontFamily: F2
    }
  }, "Nothing set \u2014 showing general access for now."))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: C2.teal,
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
      color: C2.paper
    },
    "data-ra-oncolor": ""
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 15.5,
      fontWeight: 700,
      margin: '0 0 12px',
      fontFamily: F2
    }
  }, "Your impact"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, [[String(stats.reviews), 'reviews'], [String(stats.helped), 'places helped'], [String(stats.votes), 'helpful votes']].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      flex: 1,
      background: 'rgba(250,249,246,0.1)',
      borderRadius: 12,
      padding: '12px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: M2,
      fontSize: 24,
      fontWeight: 700,
      marginBottom: 3
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.88,
      lineHeight: 1.3,
      fontFamily: F2
    }
  }, l))))), rows.map(r => /*#__PURE__*/React.createElement("button", {
    key: r.l,
    onClick: r.fn,
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      minHeight: 66,
      padding: '10px 16px',
      marginBottom: 8,
      cursor: 'pointer',
      textAlign: 'left',
      borderRadius: 16,
      fontFamily: F2,
      boxSizing: 'border-box',
      border: r.hi ? `2px solid ${C2.teal}` : `1.5px solid ${C2.line}`,
      background: r.hi ? C2.tealSoft : C2.paper
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 16,
      fontWeight: 700,
      color: C2.char,
      marginBottom: 2
    }
  }, r.l), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      color: C2.slate
    }
  }, r.m)), /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 5l7 7-7 7",
    stroke: C2.slate,
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: M2,
      fontSize: 10.5,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: C2.slate,
      textAlign: 'center',
      margin: '16px 0 0'
    }
  }, "Pilot demo \xB7 fictional sample data \xB7 roamaccess.com.au")));
}

// ─────────────────────────────────────────────────────────────
// ACCESSIBILITY SHEET — text size, contrast, motion (all real)
// ─────────────────────────────────────────────────────────────
function V2A11ySheet({
  open,
  onClose,
  prefs,
  onChange
}) {
  const ref = useRA2Dialog(open, onClose);
  const scaleRefs = React.useRef([]);
  const SCALES = [{
    v: 1,
    label: 'Default text size'
  }, {
    v: 1.125,
    label: 'Large text size, 112%'
  }, {
    v: 1.25,
    label: 'Larger text size, 125%'
  }, {
    v: 1.5,
    label: 'Largest text size, 150%'
  }];
  if (!open) return null;
  function onScaleKey(e, i) {
    const map = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    const next = (i + d + SCALES.length) % SCALES.length;
    onChange({
      scale: SCALES[next].v
    });
    const el = scaleRefs.current[next];
    if (el) el.focus();
  }
  const row = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    marginTop: 12,
    borderTop: `1px solid ${C2.hair}`
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 120,
      background: 'rgba(26,26,26,0.5)'
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref,
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "a11y-h",
    tabIndex: -1,
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      background: C2.paper,
      borderRadius: '22px 22px 0 0',
      padding: '20px 22px',
      paddingBottom: 'calc(var(--ra-tabs-pad) + 16px)',
      maxHeight: '82%',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    id: "a11y-h",
    style: {
      fontSize: 19,
      fontWeight: 700,
      margin: 0,
      fontFamily: F2
    }
  }, "Accessibility"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close accessibility settings",
    style: {
      background: 'transparent',
      border: 0,
      cursor: 'pointer',
      padding: 14,
      margin: -14,
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 14 14",
    fill: "none",
    "aria-hidden": "true",
    focusable: "false"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l12 12M13 1L1 13",
    stroke: C2.char,
    strokeWidth: "2",
    strokeLinecap: "square"
  })))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: C2.slate,
      margin: '4px 0 6px',
      fontFamily: F2
    }
  }, "Adjust how the app works for you. Saved on this device."), /*#__PURE__*/React.createElement("div", {
    style: row
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    id: "a11y-scale-label",
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      fontFamily: F2
    }
  }, "Text size"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C2.slate,
      fontFamily: F2
    }
  }, "Scales the whole app.")), /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    "aria-labelledby": "a11y-scale-label",
    style: {
      display: 'inline-flex',
      border: `1px solid ${C2.line}`,
      borderRadius: 999,
      padding: 2,
      gap: 2,
      flexShrink: 0
    }
  }, SCALES.map((s, i) => {
    const on = prefs.scale === s.v;
    return /*#__PURE__*/React.createElement("button", {
      key: s.v,
      type: "button",
      role: "radio",
      "aria-checked": on,
      "aria-label": s.label,
      ref: el => {
        scaleRefs.current[i] = el;
      },
      tabIndex: on ? 0 : -1,
      onKeyDown: e => onScaleKey(e, i),
      onClick: () => onChange({
        scale: s.v
      }),
      style: {
        minWidth: 44,
        minHeight: 44,
        padding: '0 6px',
        fontSize: 11 + (s.v - 1) * 8,
        fontWeight: 600,
        borderRadius: 999,
        cursor: 'pointer',
        background: on ? C2.char : 'transparent',
        color: on ? C2.paper : C2.char,
        border: 0,
        fontFamily: F2
      }
    }, /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "A"));
  }))), /*#__PURE__*/React.createElement("div", {
    style: row
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      fontFamily: F2
    }
  }, "Higher contrast"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C2.slate,
      fontFamily: F2
    }
  }, "Darkens borders and secondary text.")), /*#__PURE__*/React.createElement(V2Switch, {
    checked: prefs.contrast,
    onChange: () => onChange({
      contrast: !prefs.contrast
    }),
    label: "Higher contrast"
  })), /*#__PURE__*/React.createElement("div", {
    style: row
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      fontFamily: F2
    }
  }, "Reduce motion"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C2.slate,
      fontFamily: F2
    }
  }, "Disables animation and movement.")), /*#__PURE__*/React.createElement(V2Switch, {
    checked: prefs.motion,
    onChange: () => onChange({
      motion: !prefs.motion
    }),
    label: "Reduce motion"
  })), /*#__PURE__*/React.createElement("div", {
    style: row
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      fontFamily: F2
    }
  }, "Voice"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C2.slate,
      fontFamily: F2,
      maxWidth: 220
    }
  }, "Search and reviews work by voice wherever you see the mic.")), /*#__PURE__*/React.createElement(V2Mic, {
    size: 24,
    color: C2.teal
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...row,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: C2.slate,
      fontFamily: F2
    }
  }, "Saved on this device"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange({
      scale: 1,
      contrast: false,
      motion: false
    }),
    style: {
      fontSize: 14,
      color: C2.teal,
      fontWeight: 700,
      background: 'transparent',
      border: 0,
      padding: '10px 6px',
      cursor: 'pointer',
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      fontFamily: F2
    }
  }, "Reset"))));
}
Object.assign(window, {
  V2MapView,
  V2VenueView,
  V2AllReviews,
  V2ReviewView,
  V2Thanks,
  V2SavedView,
  V2Me,
  V2A11ySheet
});