-- Business portal v2 (brief M): venue owners manage their place. Additive and
-- idempotent. Honesty rule: nothing here is read by the verdict engine —
-- everything a venue writes or uploads is shown as "Venue says" / "From the
-- venue", apart from community facts, and never changes a verdict, the
-- ranking or which reviews are shown.

-- 1. Updates ("Lift out of service until Friday"). Optional last day it shows
--    (ends_on, inclusive, Sydney date). The pilot team can hide one. Written
--    by the venue's verified staff; the row stays with the venue if that
--    person deletes their account (user_id set null).
CREATE TABLE IF NOT EXISTS venue_notices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    text NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id     text REFERENCES profiles(user_id) ON DELETE SET NULL,
  body        text NOT NULL,
  ends_on     date,
  hidden      boolean NOT NULL DEFAULT false,
  hidden_at   timestamp with time zone,
  hidden_note text,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_notices_venue_idx ON venue_notices USING btree (venue_id);
CREATE INDEX IF NOT EXISTS venue_notices_created_idx ON venue_notices USING btree (created_at);

-- 2. "Seen" marks for updates from saved places (the unread count on Saved).
--    Per person; goes with the account.
CREATE TABLE IF NOT EXISTS notice_seen (
  user_id   text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  notice_id uuid NOT NULL REFERENCES venue_notices(id) ON DELETE CASCADE,
  seen_at   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notice_seen_pk PRIMARY KEY (user_id, notice_id)
);

-- 3. Photos from the venue (up to ~10). Public, unlike review photos, but the
--    files still live in the private Blob store and are served by
--    /api/venue-photos/[id], so hiding one really hides it. The description
--    is required: it is the alt text. Never a cover photo.
CREATE TABLE IF NOT EXISTS venue_photos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id       text NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id        text REFERENCES profiles(user_id) ON DELETE SET NULL,
  kind           text NOT NULL DEFAULT 'other',
  alt            text NOT NULL,
  pathname       text NOT NULL,
  thumb_pathname text NOT NULL,
  width          integer NOT NULL,
  height         integer NOT NULL,
  bytes          integer NOT NULL,
  hidden         boolean NOT NULL DEFAULT false,
  hidden_at      timestamp with time zone,
  hidden_note    text,
  created_at     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_photos_kind_chk CHECK (kind IN ('entrance', 'inside', 'toilet', 'parking', 'other'))
);
CREATE INDEX IF NOT EXISTS venue_photos_venue_idx ON venue_photos USING btree (venue_id);

-- 4. "Report this review" from a venue: goes to the admin queue with a
--    reason. A report never hides anything by itself — only the pilot team
--    decides. One open report per review per person.
CREATE TABLE IF NOT EXISTS review_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  venue_id    text NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  reporter_id text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason      text NOT NULL,
  note        text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'open',
  decided_by  text,
  decided_at  timestamp with time zone,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_reports_reason_chk CHECK (reason IN ('personal', 'offensive', 'wrong-place', 'fake', 'other')),
  CONSTRAINT review_reports_status_chk CHECK (status IN ('open', 'kept', 'hidden'))
);
CREATE INDEX IF NOT EXISTS review_reports_status_idx ON review_reports USING btree (status);
CREATE UNIQUE INDEX IF NOT EXISTS review_reports_open_uq ON review_reports USING btree (review_id, reporter_id) WHERE status = 'open';

-- 5. The venue's corrections to its phone, website and opening hours. Shown
--    as "Venue says"; the OpenStreetMap values in `venues` stay as they are
--    and show underneath. One row per venue.
CREATE TABLE IF NOT EXISTS venue_corrections (
  venue_id      text PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
  user_id       text REFERENCES profiles(user_id) ON DELETE SET NULL,
  phone         text,
  website       text,
  opening_hours text,
  updated_at    timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. "New reviews since your last visit": when the owner last opened the
--    dashboard (a visit = after 30 minutes away), and the visit before.
ALTER TABLE venue_claims ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone;
ALTER TABLE venue_claims ADD COLUMN IF NOT EXISTS prev_seen_at timestamp with time zone;
