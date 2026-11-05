// en-AU formatting helpers for UI copy. Dates read "6 November 2026".

const TZ = 'Australia/Sydney';

function toDate(d) {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

// "6 November 2026"
function formatDate(d) {
  const x = toDate(d);
  return x ? x.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }) : '';
}

// "today", "yesterday", "3 days ago", "2 weeks ago", "4 months ago", "over a year ago"
function timeAgo(d, now = new Date()) {
  const x = toDate(d);
  if (!x) return '';
  const days = Math.floor((now.getTime() - x.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return 'over a year ago';
}

// "1 review" / "3 reviews"
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export { formatDate, timeAgo, plural };
