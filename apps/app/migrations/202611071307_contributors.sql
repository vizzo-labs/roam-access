-- Community recognition (Brief L): reviews show who wrote them, a self-described
-- relationship to disability, "This helped me", contributor badges. Additive
-- and idempotent.
--
-- 1. How a person appears on their reviews (profiles).
--    Until a person chooses (relationship IS NULL) their reviews keep showing
--    exactly what they always did: their lived experience ("Wheelchair user"),
--    never a name. Existing accounts stay like that until they act themselves.
--    - public_name       "Sam K." — the name shown on reviews (admin can clear it)
--    - post_anonymously  shows "Roam Access member" instead (default: anonymous)
--    - relationship      lived · carer · ally · unsaid — self-described, unchecked
--    - show_needs        explicit opt-in to show access needs next to the name
--    - public_id         stable random id for /u/<public_id> (never the Clerk id)
--    - name_prompted_at  when an existing account saw the one-time prompt
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS post_anonymously boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_needs boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_id text NOT NULL DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_prompted_at timestamp with time zone;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_id_uq ON profiles USING btree (public_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_relationship_chk') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_relationship_chk
      CHECK (relationship IS NULL OR relationship IN ('lived', 'carer', 'ally', 'unsaid'));
  END IF;
END $$;

-- 2. Who a review was written as, and ally observations.
--    written_as: the writer's relationship when they wrote it (NULL = before
--    this feature). A carer's review is about the person they were with
--    ("It worked for them"); its needs are that person's.
--    verdict NULL = an ally's observation: facts they noticed, with no verdict.
--    Observations NEVER set or change a verdict and never make a place "Works
--    for you" (lib/venues.ts drops them from every verdict and count path).
--    NULL passes the existing reviews_verdict_chk.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS written_as text;
ALTER TABLE reviews ALTER COLUMN verdict DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_written_as_chk') THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_written_as_chk
      CHECK (written_as IS NULL OR written_as IN ('lived', 'carer', 'ally', 'unsaid'));
  END IF;
END $$;

-- 3. "This helped me": one per person per review, never on your own (checked
--    in lib/data/contributors.ts). Goes with either account or the review.
CREATE TABLE IF NOT EXISTS review_thanks (
  review_id  uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT review_thanks_pk PRIMARY KEY (review_id, user_id)
);
CREATE INDEX IF NOT EXISTS review_thanks_user_idx ON review_thanks USING btree (user_id);

-- Top contributors this month: visible reviews by date.
CREATE INDEX IF NOT EXISTS reviews_created_idx ON reviews USING btree (created_at);
