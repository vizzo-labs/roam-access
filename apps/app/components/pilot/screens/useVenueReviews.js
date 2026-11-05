'use client';

import React from 'react';

// Reviews for one venue: cached copy first (instant), then fresh from the API.
function useVenueReviews(app, id) {
  const [state, setState] = React.useState(() => ({ reviews: app.reviewsCache[id] || null, error: false }));
  React.useEffect(() => {
    let live = true;
    app.loadReviews(id).then(
      r => { if (live) setState({ reviews: r, error: false }); },
      () => { if (live) setState(s => ({ ...s, error: true })); },
    );
    return () => { live = false; };
  }, [id, app.reviewsVersion]);
  return state;
}

export { useVenueReviews };
