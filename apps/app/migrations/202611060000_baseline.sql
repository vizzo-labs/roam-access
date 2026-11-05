-- Baseline: the schema as it was when migrations were introduced
-- (lib/db/schema.ts at that time). Everything is IF NOT EXISTS, so this is a
-- no-op on production (tables already existed) and builds an empty database
-- from scratch. Constraint names match production exactly.

CREATE TABLE IF NOT EXISTS venues (
  id          text PRIMARY KEY,
  osm_type    text NOT NULL,
  osm_id      bigint NOT NULL,
  name        text NOT NULL,
  kind        text NOT NULL,
  cat         text NOT NULL,
  suburb      text,
  address     text,
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  phone       text,
  website     text,
  osm_tags    jsonb NOT NULL DEFAULT '{}'::jsonb,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS venues_osm_uq ON venues USING btree (osm_type, osm_id);
CREATE INDEX IF NOT EXISTS venues_cat_idx ON venues USING btree (cat);

-- One row per signed-in tester (Clerk user id). `needs` is disability
-- information: sensitive under the Privacy Act.
CREATE TABLE IF NOT EXISTS profiles (
  user_id       text PRIMARY KEY,
  name          text NOT NULL DEFAULT '',
  needs         text[] NOT NULL DEFAULT '{}'::text[],
  onboarded_at  timestamp with time zone,
  created_at    timestamp with time zone NOT NULL DEFAULT now(),
  updated_at    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    text NOT NULL,
  user_id     text NOT NULL,
  verdict     text NOT NULL,
  needs       text[] NOT NULL DEFAULT '{}'::text[],
  features    jsonb NOT NULL DEFAULT '{}'::jsonb,
  note        text,
  hidden      boolean NOT NULL DEFAULT false,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT reviews_verdict_chk CHECK (verdict IN ('works', 'check', 'barrier'))
);
CREATE INDEX IF NOT EXISTS reviews_venue_idx ON reviews USING btree (venue_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON reviews USING btree (user_id);

CREATE TABLE IF NOT EXISTS saved (
  user_id     text NOT NULL,
  venue_id    text NOT NULL,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saved_user_id_venue_id_pk PRIMARY KEY (user_id, venue_id),
  CONSTRAINT saved_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT saved_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);
