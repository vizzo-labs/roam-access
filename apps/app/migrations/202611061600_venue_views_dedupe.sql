-- F5 follow-up: de-duplicate and rate-limit anonymous view counts, and tell
-- venues when the pilot team hides their "Venue says" text.

-- One row per (HMAC of user + venue + kind + Sydney day), or per (HMAC of
-- user + minute) for burst limiting. The key is a keyed hash: who looked can't
-- be recovered from it, and rows are purged after two days.
CREATE TABLE IF NOT EXISTS venue_view_keys (
  key         text PRIMARY KEY,
  day         date NOT NULL,
  hits        integer NOT NULL DEFAULT 1,
  created_at  timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venue_view_keys_day_idx ON venue_view_keys USING btree (day);

-- When and why an admin hid a statement or reply (shown to the venue only).
ALTER TABLE venue_replies ADD COLUMN IF NOT EXISTS hidden_at timestamp with time zone;
ALTER TABLE venue_replies ADD COLUMN IF NOT EXISTS hidden_note text;
