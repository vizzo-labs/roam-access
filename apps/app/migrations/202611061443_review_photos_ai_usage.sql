-- F2 · Photos & AI (#3, #15, #16).
--
-- review_photos: optional photos on a review (entrance, toilet, step, seating,
-- other). The image itself lives in a PRIVATE Vercel Blob store and is only
-- served through /api/photos/[id] to signed-in testers. A photo is uploaded
-- while the review form is open (review_id NULL = draft) and attached to the
-- review when it is sent. Alt text is required before it can be attached.
--
-- ai_usage: per-user, per-day counters for the AI features (rate limits).
-- Counts only — never the question, the photo or the answer.

CREATE TABLE IF NOT EXISTS review_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text NOT NULL,
  venue_id        text NOT NULL,
  review_id       uuid,
  kind            text NOT NULL DEFAULT 'other',
  alt             text NOT NULL DEFAULT '',
  pathname        text NOT NULL,
  thumb_pathname  text NOT NULL,
  width           integer NOT NULL DEFAULT 0,
  height          integer NOT NULL DEFAULT 0,
  bytes           integer NOT NULL DEFAULT 0,
  hidden          boolean NOT NULL DEFAULT false,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_photos_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT review_photos_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT review_photos_review_id_reviews_id_fk FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT review_photos_kind_chk CHECK (kind IN ('entrance', 'toilet', 'step', 'seating', 'other'))
);
CREATE INDEX IF NOT EXISTS review_photos_review_idx ON review_photos USING btree (review_id);
CREATE INDEX IF NOT EXISTS review_photos_venue_idx ON review_photos USING btree (venue_id);
CREATE INDEX IF NOT EXISTS review_photos_user_idx ON review_photos USING btree (user_id);

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id  text NOT NULL,
  day      date NOT NULL,
  kind     text NOT NULL,
  count    integer NOT NULL DEFAULT 0,
  CONSTRAINT ai_usage_pk PRIMARY KEY (user_id, day, kind),
  CONSTRAINT ai_usage_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT ai_usage_kind_chk CHECK (kind IN ('ask', 'photo'))
);
