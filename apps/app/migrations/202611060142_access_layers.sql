-- F3 · Access layers: public toilets + beach access items (facilities),
-- partner badges on venues, and temporary barrier reports that expire.
-- Additive and idempotent (IF NOT EXISTS everywhere).

-- Things on the map that aren't venues: public toilets (National Public
-- Toilet Map, CC BY 3.0 AU), beach wheelchairs, Liberty Swings, accessible
-- showers, the ferry ramp, accessible walks. These are LISTINGS from their
-- source, never community-confirmed facts: they never produce a verdict.
CREATE TABLE IF NOT EXISTS facilities (
  id              text PRIMARY KEY,                       -- 'nptm-6115', 'beach-wheelchair-manly'
  layer           text NOT NULL,                          -- 'toilets' | 'beach'
  kind            text NOT NULL,                          -- 'toilet' | 'beach_wheelchair' | 'liberty_swing' | 'shower' | 'mlak' | 'ferry' | 'walk'
  name            text NOT NULL,
  suburb          text,
  address         text,
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  -- Structured attributes from the source (accessible, mlak, adultChange,
  -- changingPlaces, openingHours, notes …) — shape depends on `kind`.
  details         jsonb NOT NULL DEFAULT '{}'::jsonb,
  description     text,
  booking_url     text,
  booking_phone   text,
  source          text NOT NULL,                          -- 'National Public Toilet Map', 'Northern Beaches Council' …
  source_url      text,
  source_licence  text,
  sort            integer NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT facilities_layer_chk CHECK (layer IN ('toilets', 'beach'))
);
CREATE INDEX IF NOT EXISTS facilities_layer_idx ON facilities USING btree (layer);

-- Partner programs a venue belongs to (Companion Card affiliate, Sunflower,
-- Aspect Autism Friendly, ATIC, Changing Places). Shown as the PARTNER'S
-- claim, with its source; a badge never changes a verdict or a ranking.
CREATE TABLE IF NOT EXISTS venue_badges (
  venue_id    text NOT NULL,
  badge       text NOT NULL,
  source_url  text NOT NULL,
  note        text,
  added_by    text,                                       -- admin's Clerk user id
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_badges_pk PRIMARY KEY (venue_id, badge),
  CONSTRAINT venue_badges_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT venue_badges_badge_chk CHECK (badge IN ('companion_card', 'sunflower', 'aspect_autism_friendly', 'atic', 'changing_places'))
);

-- Today's problems: lift out of order, ramp blocked, roadworks … and the
-- beach question "Is there matting today?". Each report expires (default by
-- type); "Still there?" confirmations push the expiry out; "It's gone"
-- resolves it. Expired / resolved / hidden reports are never shown.
-- The reporter's id is kept for moderation and deleted with the account; it
-- is never shown.
CREATE TABLE IF NOT EXISTS temp_barriers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type        text NOT NULL,                       -- 'venue' | 'facility'
  target_id          text NOT NULL,
  type               text NOT NULL,
  note               text,
  created_by         text NOT NULL,
  confirmed_by       text[] NOT NULL DEFAULT '{}'::text[],
  confirmations      integer NOT NULL DEFAULT 0,
  created_at         timestamp with time zone NOT NULL DEFAULT now(),
  last_confirmed_at  timestamp with time zone NOT NULL DEFAULT now(),
  expires_at         timestamp with time zone NOT NULL,
  resolved_at        timestamp with time zone,
  hidden             boolean NOT NULL DEFAULT false,
  CONSTRAINT temp_barriers_created_by_profiles_user_id_fk FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT temp_barriers_target_type_chk CHECK (target_type IN ('venue', 'facility'))
);
CREATE INDEX IF NOT EXISTS temp_barriers_target_idx ON temp_barriers USING btree (target_type, target_id);
CREATE INDEX IF NOT EXISTS temp_barriers_expires_idx ON temp_barriers USING btree (expires_at);
