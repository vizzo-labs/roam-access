-- F4 Community growth: quick answers ("Help fill the gaps", #9) and mapping
-- days with a leaderboard (#10). Additive and idempotent.

-- One yes/no answer to one access question about one place, from a tester who
-- has been there. Counts toward that feature's facts exactly like the optional
-- yes/no questions in a full review, and is labelled "quick answer" wherever
-- it's shown. One row per person per place per question: answering again
-- replaces the answer (updated_at), it never adds a second vote.
-- No needs or name are stored here — only the user id, for deletion and
-- mapping-day attribution.
CREATE TABLE IF NOT EXISTS micro_answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    text NOT NULL,
  user_id     text NOT NULL,
  feature     text NOT NULL,
  answer      text NOT NULL,
  hidden      boolean NOT NULL DEFAULT false,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT micro_answers_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT micro_answers_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT micro_answers_answer_chk CHECK (answer IN ('yes', 'no'))
);
CREATE UNIQUE INDEX IF NOT EXISTS micro_answers_user_venue_feature_uq ON micro_answers USING btree (user_id, venue_id, feature);
CREATE INDEX IF NOT EXISTS micro_answers_venue_idx ON micro_answers USING btree (venue_id);

-- A "Map Manly" day. Testers join with the code (link or QR); reviews and
-- quick answers they make between starts_at and ends_at count for the event.
CREATE TABLE IF NOT EXISTS mapping_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL,
  name        text NOT NULL,
  area        text NOT NULL DEFAULT '',
  starts_at   timestamp with time zone NOT NULL,
  ends_at     timestamp with time zone NOT NULL,
  created_by  text,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mapping_events_time_chk CHECK (ends_at > starts_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS mapping_events_code_uq ON mapping_events USING btree (code);

-- Membership. Leaderboards are anonymous by default: display_name is shown
-- only when the member opted in (show_name). Never joined with needs.
CREATE TABLE IF NOT EXISTS mapping_event_members (
  event_id      uuid NOT NULL,
  user_id       text NOT NULL,
  show_name     boolean NOT NULL DEFAULT false,
  display_name  text,
  joined_at     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mapping_event_members_pk PRIMARY KEY (event_id, user_id),
  CONSTRAINT mapping_event_members_event_id_fk FOREIGN KEY (event_id) REFERENCES mapping_events(id) ON DELETE CASCADE,
  CONSTRAINT mapping_event_members_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS mapping_event_members_user_idx ON mapping_event_members USING btree (user_id);
