// Typed mirror of the SQL in migrations/ — the SQL is the source of truth.
// When you add a migration, mirror it here. Never `drizzle-kit push`.
import { sql } from 'drizzle-orm';
import {
  pgTable, text, bigint, doublePrecision, jsonb, boolean, timestamp, uuid,
  integer, date, primaryKey, uniqueIndex, index, check, foreignKey,
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
  // F6 · sensory (migration 202611061600_sensory_content): what the reviewer
  // noticed, and when they say it's usually quiet. Never changes a verdict.
  sensoryNoise: text('sensory_noise').$type<SensoryNoise>(),
  sensoryLight: text('sensory_light').$type<SensoryLight>(),
  sensoryCrowd: text('sensory_crowd').$type<SensoryCrowd>(),
  quietTimes: text('quiet_times').array().$type<SensorySlot[]>().notNull().default(sql`'{}'::text[]`),
}, t => [
  index('reviews_venue_idx').on(t.venueId),
  index('reviews_user_idx').on(t.userId),
  check('reviews_verdict_chk', sql`${t.verdict} in ('works', 'check', 'barrier')`),
  check('reviews_entrance_alt_chk', sql`${t.entranceAlt} is null or ${t.entranceAlt} in ('side', 'back', 'lift', 'other', 'none')`),
]);

export type EntranceAlt = 'side' | 'back' | 'lift' | 'other' | 'none';
export type SensoryNoise = 'quiet' | 'some' | 'loud';
export type SensoryLight = 'soft' | 'bright' | 'harsh';
export type SensoryCrowd = 'few' | 'some' | 'busy';
export type SensorySlot = 'early' | 'midday' | 'afternoon' | 'evening';
export type SensoryDayKind = 'weekday' | 'weekend';

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

// ── F3 access layers (migrations/202611060142_access_layers.sql) ─────────
// Toilets (National Public Toilet Map, CC BY 3.0 AU) and beach access items.
// Listings from their source — never community-confirmed, never a verdict.
export const facilities = pgTable('facilities', {
  id: text('id').primaryKey(),
  layer: text('layer').notNull(),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  suburb: text('suburb'),
  address: text('address'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
  description: text('description'),
  bookingUrl: text('booking_url'),
  bookingPhone: text('booking_phone'),
  source: text('source').notNull(),
  sourceUrl: text('source_url'),
  sourceLicence: text('source_licence'),
  sort: integer('sort').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('facilities_layer_idx').on(t.layer),
  check('facilities_layer_chk', sql`${t.layer} in ('toilets', 'beach')`),
]);

// Partner programs (the partner's claim, with a source). Never a verdict.
export const venueBadges = pgTable('venue_badges', {
  venueId: text('venue_id').notNull(),
  badge: text('badge').notNull(),
  sourceUrl: text('source_url').notNull(),
  note: text('note'),
  addedBy: text('added_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  primaryKey({ name: 'venue_badges_pk', columns: [t.venueId, t.badge] }),
  foreignKey({ name: 'venue_badges_venue_id_venues_id_fk', columns: [t.venueId], foreignColumns: [venues.id] }).onDelete('cascade'),
  check('venue_badges_badge_chk', sql`${t.badge} in ('companion_card', 'sunflower', 'aspect_autism_friendly', 'atic', 'changing_places')`),
]);

// Temporary barrier reports that expire. `createdBy` is never shown.
export const tempBarriers = pgTable('temp_barriers', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  type: text('type').notNull(),
  note: text('note'),
  createdBy: text('created_by').notNull(),
  confirmedBy: text('confirmed_by').array().notNull().default(sql`'{}'::text[]`),
  confirmations: integer('confirmations').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  hidden: boolean('hidden').notNull().default(false),
}, t => [
  index('temp_barriers_target_idx').on(t.targetType, t.targetId),
  index('temp_barriers_expires_idx').on(t.expiresAt),
  foreignKey({ name: 'temp_barriers_created_by_profiles_user_id_fk', columns: [t.createdBy], foreignColumns: [profiles.userId] }).onDelete('cascade'),
  check('temp_barriers_target_type_chk', sql`${t.targetType} in ('venue', 'facility')`),
]);

export type Venue = typeof venues.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type ReviewPhoto = typeof reviewPhotos.$inferSelect;

// ── F4 Community growth (migrations/202611061442_community_growth.sql) ──
// Quick answers: one yes/no per person per place per access question. They
// count toward that feature's facts and are labelled "quick answer".
export const microAnswers = pgTable('micro_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  feature: text('feature').notNull(),
  answer: text('answer').$type<'yes' | 'no'>().notNull(),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex('micro_answers_user_venue_feature_uq').on(t.userId, t.venueId, t.feature),
  index('micro_answers_venue_idx').on(t.venueId),
  check('micro_answers_answer_chk', sql`${t.answer} in ('yes', 'no')`),
]);

export const mappingEvents = pgTable('mapping_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  area: text('area').notNull().default(''),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex('mapping_events_code_uq').on(t.code),
  check('mapping_events_time_chk', sql`${t.endsAt} > ${t.startsAt}`),
]);

// Anonymous on the leaderboard unless show_name (opt-in).
export const mappingEventMembers = pgTable('mapping_event_members', {
  eventId: uuid('event_id').notNull().references(() => mappingEvents.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  showName: boolean('show_name').notNull().default(false),
  displayName: text('display_name'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  primaryKey({ name: 'mapping_event_members_pk', columns: [t.eventId, t.userId] }),
  index('mapping_event_members_user_idx').on(t.userId),
]);

export type MicroAnswer = typeof microAnswers.$inferSelect;
export type MappingEvent = typeof mappingEvents.$inferSelect;

// F5 · venues & councils (venue_claims, venue_replies, needs_cards, user_roles, venue_views)
export * from './schema-venues';
// F6 · sensory content (sensory_reports)
export * from './schema-sensory';
export type Facility = typeof facilities.$inferSelect;
export type VenueBadge = typeof venueBadges.$inferSelect;
export type TempBarrier = typeof tempBarriers.$inferSelect;
