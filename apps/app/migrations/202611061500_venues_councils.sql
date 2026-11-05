-- F5 · Venues & councils: venue claims + right of reply, pre-arrival needs
-- cards, roles (council), and anonymous venue view counts.
--
-- Honesty rule: nothing here can change a verdict. Venue replies and
-- statements are shown as "Venue says", apart from community facts.
-- Privacy: needs are disability information. needs_cards are deleted with the
-- account (FK cascade from profiles); venue_views holds counts only, never a
-- user id.

-- Roles beyond tester. Admins stay in ADMIN_EMAILS; this table holds roles an
-- admin grants in /admin/venues (today: 'council'). No CHECK on the value so
-- new roles don't need a constraint change.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id     text NOT NULL,
  role        text NOT NULL,
  org         text,
  granted_by  text,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pk PRIMARY KEY (user_id, role),
  CONSTRAINT user_roles_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- A signed-in person asks to manage a venue; an admin approves or rejects it
-- after checking the evidence (website-domain email, a call to the listed
-- phone number, …). Several staff can hold approved claims for one venue.
CREATE TABLE IF NOT EXISTS venue_claims (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id       text NOT NULL,
  user_id        text NOT NULL,
  status         text NOT NULL DEFAULT 'pending',
  role           text NOT NULL DEFAULT 'owner',
  contact_name   text NOT NULL DEFAULT '',
  contact_email  text NOT NULL DEFAULT '',
  contact_phone  text NOT NULL DEFAULT '',
  evidence       text NOT NULL DEFAULT '',
  verification   text,
  admin_note     text,
  decided_by     text,
  decided_at     timestamp with time zone,
  created_at     timestamp with time zone NOT NULL DEFAULT now(),
  updated_at     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_claims_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT venue_claims_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT venue_claims_status_chk CHECK (status IN ('pending', 'approved', 'rejected', 'revoked'))
);
CREATE INDEX IF NOT EXISTS venue_claims_venue_idx ON venue_claims USING btree (venue_id);
CREATE INDEX IF NOT EXISTS venue_claims_user_idx ON venue_claims USING btree (user_id);
-- One open (pending or approved) claim per person per venue.
CREATE UNIQUE INDEX IF NOT EXISTS venue_claims_open_uq ON venue_claims USING btree (venue_id, user_id)
  WHERE status IN ('pending', 'approved');

-- "Venue says": a public reply to one review (review_id set), or the venue's
-- own access statement (review_id NULL). One of each, edited in place.
CREATE TABLE IF NOT EXISTS venue_replies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    text NOT NULL,
  review_id   uuid,
  user_id     text NOT NULL,
  body        text NOT NULL,
  hidden      boolean NOT NULL DEFAULT false,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_replies_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT venue_replies_review_id_reviews_id_fk FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT venue_replies_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS venue_replies_review_uq ON venue_replies USING btree (review_id) WHERE review_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS venue_replies_statement_uq ON venue_replies USING btree (venue_id) WHERE review_id IS NULL;

-- Pre-arrival "my needs" card. venue_id NULL = the tester's saved card
-- (template); venue_id set = a card sent in-app to a claimed venue, which the
-- venue sees without a name. Deleted with the account.
CREATE TABLE IF NOT EXISTS needs_cards (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL,
  venue_id          text,
  needs             text[] NOT NULL DEFAULT '{}'::text[],
  note              text NOT NULL DEFAULT '',
  visit_on          date,
  status            text NOT NULL DEFAULT 'draft',
  venue_response    text,
  seen_at           timestamp with time zone,
  responded_at      timestamp with time zone,
  created_at        timestamp with time zone NOT NULL DEFAULT now(),
  updated_at        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT needs_cards_user_id_profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT needs_cards_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT needs_cards_status_chk CHECK (status IN ('draft', 'sent', 'seen', 'replied'))
);
CREATE INDEX IF NOT EXISTS needs_cards_venue_idx ON needs_cards USING btree (venue_id);
CREATE UNIQUE INDEX IF NOT EXISTS needs_cards_template_uq ON needs_cards USING btree (user_id) WHERE venue_id IS NULL;

-- Anonymous daily counts for venue dashboards and the council dashboard:
-- kind 'view' (venue page opened) or 'search' (shown in search results),
-- per access need of the person looking ('any' = everyone). No user ids.
CREATE TABLE IF NOT EXISTS venue_views (
  venue_id  text NOT NULL,
  day       date NOT NULL,
  kind      text NOT NULL,
  need      text NOT NULL,
  count     integer NOT NULL DEFAULT 0,
  CONSTRAINT venue_views_pk PRIMARY KEY (venue_id, day, kind, need),
  CONSTRAINT venue_views_venue_id_venues_id_fk FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS venue_views_day_idx ON venue_views USING btree (day);
