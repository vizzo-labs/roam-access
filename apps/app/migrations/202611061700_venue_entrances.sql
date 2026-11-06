-- Getting there, stage 1 (I1): the step-free entrance, on a map. Additive and idempotent.
--
-- A wheelchair user's restaurant has its ramp round the back; map apps route
-- to the street address. A reviewer who found the step-free way in can drop a
-- pin on it (or use their location while standing there), say which door it
-- is, add a one-line note and an entrance photo. Directions then go to that
-- door. Others answer "Still the way in? Yes / Changed".
--
-- Honesty: an entrance describes how to get in; it NEVER changes a verdict.
-- source = 'community' (marked in a review) or 'osm' (an OpenStreetMap
-- entrance node, always shown as unconfirmed; none imported yet).
--   kind        main | side | back | lift | other
--   lat, lng    NULL when the reviewer only described where it is
--   located_by  pin (moved on the map) | gps (their location) | NULL
-- Only the user id is stored (for deletion and "one answer per person") —
-- never needs or a name; "who" comes from the linked review. Rows go with the
-- account and with the review (cascade).
CREATE TABLE IF NOT EXISTS venue_entrances (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    text NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id     text REFERENCES profiles(user_id) ON DELETE CASCADE,
  review_id   uuid REFERENCES reviews(id) ON DELETE CASCADE,
  source      text NOT NULL DEFAULT 'community',
  osm_id      bigint,
  kind        text NOT NULL,
  lat         double precision,
  lng         double precision,
  located_by  text,
  note        text,
  photo_id    uuid REFERENCES review_photos(id) ON DELETE SET NULL,
  hidden      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_entrances_kind_chk CHECK (kind IN ('main', 'side', 'back', 'lift', 'other')),
  CONSTRAINT venue_entrances_source_chk CHECK (source IN ('community', 'osm')),
  CONSTRAINT venue_entrances_located_by_chk CHECK (located_by IS NULL OR located_by IN ('pin', 'gps')),
  CONSTRAINT venue_entrances_point_chk CHECK ((lat IS NULL) = (lng IS NULL)),
  CONSTRAINT venue_entrances_owner_chk CHECK (source = 'osm' OR user_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS venue_entrances_venue_idx ON venue_entrances (venue_id);
CREATE INDEX IF NOT EXISTS venue_entrances_user_idx ON venue_entrances (user_id);
-- One entrance per review; one row per OpenStreetMap node.
CREATE UNIQUE INDEX IF NOT EXISTS venue_entrances_review_uq ON venue_entrances (review_id);
CREATE UNIQUE INDEX IF NOT EXISTS venue_entrances_osm_uq ON venue_entrances (osm_id);

-- "Still the way in?" — one answer per person per entrance (latest wins).
--   answer  yes | changed
CREATE TABLE IF NOT EXISTS entrance_confirmations (
  entrance_id  uuid NOT NULL REFERENCES venue_entrances(id) ON DELETE CASCADE,
  user_id      text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  answer       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entrance_confirmations_pk PRIMARY KEY (entrance_id, user_id),
  CONSTRAINT entrance_confirmations_answer_chk CHECK (answer IN ('yes', 'changed'))
);
CREATE INDEX IF NOT EXISTS entrance_confirmations_user_idx ON entrance_confirmations (user_id);

-- Reviews written before this feature that already said where the step-free
-- way in is ("Yes, at the back" …): one described entrance each, no pin.
INSERT INTO venue_entrances (venue_id, user_id, review_id, source, kind, note, created_at, updated_at)
SELECT r.venue_id, r.user_id, r.id, 'community', r.entrance_alt, r.entrance_note, r.created_at, r.created_at
FROM reviews r
WHERE r.entrance_alt IN ('side', 'back', 'lift', 'other')
ON CONFLICT (review_id) DO NOTHING;
