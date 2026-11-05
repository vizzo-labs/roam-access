// Typed mirror of the SQL in migrations/ — the SQL is the source of truth.
// When you add a migration, mirror it here. Never `drizzle-kit push`.
import { sql } from 'drizzle-orm';
import {
  pgTable, text, bigint, doublePrecision, jsonb, boolean, timestamp, uuid,
  integer, date, primaryKey, uniqueIndex, index, check,
} from 'drizzle-orm/pg-core';

// Real places in the pilot area, seeded from OpenStreetMap (ODbL). Access
// facts are NOT stored here: they come from community reviews; the raw OSM
// tags are kept only to show "listed on OpenStreetMap, not yet confirmed".
export const venues = pgTable('venues', {
  id: text('id').primaryKey(),
  osmType: text('osm_type').notNull(),
  osmId: bigint('osm_id', { mode: 'number' }).notNull(),
  name: text('name').notNull(),
  kind: text('kind').notNull(),
  cat: text('cat').notNull(),
  suburb: text('suburb'),
  address: text('address'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  phone: text('phone'),
  website: text('website'),
  osmTags: jsonb('osm_tags').$type<Record<string, string>>().notNull().default({}),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex('venues_osm_uq').on(t.osmType, t.osmId),
  index('venues_cat_idx').on(t.cat),
]);

// One row per signed-in tester (Clerk user id). `needs` is disability
// information — sensitive data under the Privacy Act: never expose it with a
// name, and delete it with the account.
export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey(),
  name: text('name').notNull().default(''),
  needs: text('needs').array().notNull().default(sql`'{}'::text[]`),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  verdict: text('verdict').notNull(),
  // Reviewer's needs at the time of the review: reviews are shown by lived
  // experience ("Wheelchair user"), never by name.
  needs: text('needs').array().notNull().default(sql`'{}'::text[]`),
  features: jsonb('features').$type<Record<string, 'yes' | 'no'>>().notNull().default({}),
  note: text('note'),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // "Step-free way in through another entrance?" (migration 202611061445).
  entranceAlt: text('entrance_alt').$type<EntranceAlt>(),
  entranceNote: text('entrance_note'),
}, t => [
  index('reviews_venue_idx').on(t.venueId),
  index('reviews_user_idx').on(t.userId),
  check('reviews_verdict_chk', sql`${t.verdict} in ('works', 'check', 'barrier')`),
  check('reviews_entrance_alt_chk', sql`${t.entranceAlt} is null or ${t.entranceAlt} in ('side', 'back', 'lift', 'other', 'none')`),
]);

export type EntranceAlt = 'side' | 'back' | 'lift' | 'other' | 'none';

export const saved = pgTable('saved', {
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.userId, t.venueId] })]);

// "Still accurate? Yes" — one row per tester per place (migration 202611061445).
export const venueConfirmations = pgTable('venue_confirmations', {
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  primaryKey({ name: 'venue_confirmations_pk', columns: [t.venueId, t.userId] }),
  index('venue_confirmations_user_idx').on(t.userId),
]);

export type IssueKind = 'closed' | 'moved' | 'wrong_location' | 'duplicate' | 'info_wrong';
export type IssueResolution = 'fixed' | 'no_change' | 'venue_inactive';

// "Report a problem" — the admin queue (migration 202611061445).
export const venueIssues = pgTable('venue_issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  kind: text('kind').$type<IssueKind>().notNull(),
  note: text('note'),
  status: text('status').$type<'open' | 'resolved'>().notNull().default('open'),
  resolution: text('resolution').$type<IssueResolution>(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('venue_issues_status_idx').on(t.status, t.createdAt),
  index('venue_issues_venue_idx').on(t.venueId),
  index('venue_issues_user_idx').on(t.userId),
  check('venue_issues_kind_chk', sql`${t.kind} in ('closed', 'moved', 'wrong_location', 'duplicate', 'info_wrong')`),
  check('venue_issues_status_chk', sql`${t.status} in ('open', 'resolved')`),
  check('venue_issues_resolution_chk', sql`${t.resolution} is null or ${t.resolution} in ('fixed', 'no_change', 'venue_inactive')`),
]);

// F2 · Photos on reviews (migrations/202611061443_review_photos_ai_usage.sql).
// The image is in a private Vercel Blob store; review_id is NULL while the
// review form is still open (draft). Alt text is required to attach.
export const reviewPhotos = pgTable('review_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull().default('other'),
  alt: text('alt').notNull().default(''),
  pathname: text('pathname').notNull(),
  thumbPathname: text('thumb_pathname').notNull(),
  width: integer('width').notNull().default(0),
  height: integer('height').notNull().default(0),
  bytes: integer('bytes').notNull().default(0),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('review_photos_review_idx').on(t.reviewId),
  index('review_photos_venue_idx').on(t.venueId),
  index('review_photos_user_idx').on(t.userId),
  check('review_photos_kind_chk', sql`${t.kind} in ('entrance', 'toilet', 'step', 'seating', 'other')`),
]);

// F2 · Per-user daily AI counters (rate limits). Counts only, nothing else.
export const aiUsage = pgTable('ai_usage', {
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  day: date('day').notNull(),
  kind: text('kind').notNull(),
  count: integer('count').notNull().default(0),
}, t => [
  primaryKey({ name: 'ai_usage_pk', columns: [t.userId, t.day, t.kind] }),
  check('ai_usage_kind_chk', sql`${t.kind} in ('ask', 'photo')`),
]);

export type Venue = typeof venues.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type ReviewPhoto = typeof reviewPhotos.$inferSelect;
