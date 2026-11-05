-- F1 · Trust & freshness: entrance nuance on reviews, "Still accurate?"
-- confirmations, and problem reports for the admin queue. Additive only.

-- #5 Entrance nuance: "Step-free way in through another entrance?"
--   side | back | lift | other = there is a step-free alternative there
--   none = no other step-free way in
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS entrance_alt text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS entrance_note text;

-- (BEGIN shares the DO line: the runner refuses lines that start with BEGIN.)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_entrance_alt_chk') THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_entrance_alt_chk
      CHECK (entrance_alt IS NULL OR entrance_alt IN ('side', 'back', 'lift', 'other', 'none'));
  END IF;
END $$;

-- #2 "Still accurate? Yes" — one row per tester per place; confirming again
-- moves confirmed_at forward. Refreshes the place's "Last confirmed" date.
-- Deleted with the account.
CREATE TABLE IF NOT EXISTS venue_confirmations (
  venue_id      text NOT NULL,
  user_id       text NOT NULL,
  confirmed_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_confirmations_pk PRIMARY KEY (venue_id, user_id),
  CONSTRAINT venue_confirmations_venue_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT venue_confirmations_user_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS venue_confirmations_user_idx ON venue_confirmations USING btree (user_id);

-- #2 "Report a problem" — the admin queue in /admin. Deleted with the account.
CREATE TABLE IF NOT EXISTS venue_issues (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     text NOT NULL,
  user_id      text NOT NULL,
  kind         text NOT NULL,
  note         text,
  status       text NOT NULL DEFAULT 'open',
  resolution   text,
  resolved_at  timestamp with time zone,
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_issues_venue_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT venue_issues_user_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT venue_issues_kind_chk CHECK (kind IN ('closed', 'moved', 'wrong_location', 'duplicate', 'info_wrong')),
  CONSTRAINT venue_issues_status_chk CHECK (status IN ('open', 'resolved')),
  CONSTRAINT venue_issues_resolution_chk CHECK (resolution IS NULL OR resolution IN ('fixed', 'no_change', 'venue_inactive'))
);
CREATE INDEX IF NOT EXISTS venue_issues_status_idx ON venue_issues USING btree (status, created_at);
CREATE INDEX IF NOT EXISTS venue_issues_venue_idx ON venue_issues USING btree (venue_id);
CREATE INDEX IF NOT EXISTS venue_issues_user_idx ON venue_issues USING btree (user_id);
