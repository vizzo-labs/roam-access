-- F6 · Sensory content (#17). Additive and idempotent.
--
-- What a reviewer noticed on their visit: noise, light and crowds, plus the
-- times of day they say the place is usually quiet. All optional. These
-- describe the PLACE; they never change a verdict.
--   sensory_noise  quiet | some | loud
--   sensory_light  soft | bright | harsh        (harsh = harsh or flickering)
--   sensory_crowd  few | some | busy
--   quiet_times    any of early (before 10am) · midday (10am–2pm)
--                  · afternoon (2–5pm) · evening (after 5pm)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS sensory_noise text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS sensory_light text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS sensory_crowd text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS quiet_times text[] NOT NULL DEFAULT '{}'::text[];

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_sensory_chk') THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_sensory_chk CHECK (
      (sensory_noise IS NULL OR sensory_noise IN ('quiet', 'some', 'loud'))
      AND (sensory_light IS NULL OR sensory_light IN ('soft', 'bright', 'harsh'))
      AND (sensory_crowd IS NULL OR sensory_crowd IN ('few', 'some', 'busy'))
      AND quiet_times <@ ARRAY['early', 'midday', 'afternoon', 'evening']::text[]
    );
  END IF;
END $$;

-- Time-stamped sensory observations: "how was it, and when?". Two kinds:
--  · from a review (review_id set) when the reviewer said when they were there;
--  · a "How is it right now?" check-in from the venue page (review_id NULL).
-- slot = time of day in Sydney; day_kind = weekday | weekend (NULL = not said).
-- Only the user id is stored (for deletion and one check-in per person at a
-- time) — never needs or a name. Rows go with the account (cascade).
CREATE TABLE IF NOT EXISTS sensory_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     text NOT NULL,
  user_id      text NOT NULL,
  review_id    uuid,
  noise        text,
  light        text,
  crowd        text,
  slot         text NOT NULL,
  day_kind     text,
  observed_at  timestamp with time zone NOT NULL DEFAULT now(),
  hidden       boolean NOT NULL DEFAULT false,
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sensory_reports_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT sensory_reports_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT sensory_reports_review_id_reviews_id_fk FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT sensory_reports_noise_chk CHECK (noise IS NULL OR noise IN ('quiet', 'some', 'loud')),
  CONSTRAINT sensory_reports_light_chk CHECK (light IS NULL OR light IN ('soft', 'bright', 'harsh')),
  CONSTRAINT sensory_reports_crowd_chk CHECK (crowd IS NULL OR crowd IN ('few', 'some', 'busy')),
  CONSTRAINT sensory_reports_slot_chk CHECK (slot IN ('early', 'midday', 'afternoon', 'evening')),
  CONSTRAINT sensory_reports_day_kind_chk CHECK (day_kind IS NULL OR day_kind IN ('weekday', 'weekend')),
  CONSTRAINT sensory_reports_something_chk CHECK (noise IS NOT NULL OR light IS NOT NULL OR crowd IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS sensory_reports_venue_idx ON sensory_reports USING btree (venue_id, observed_at);
CREATE INDEX IF NOT EXISTS sensory_reports_user_idx ON sensory_reports USING btree (user_id);
CREATE INDEX IF NOT EXISTS sensory_reports_review_idx ON sensory_reports USING btree (review_id);
