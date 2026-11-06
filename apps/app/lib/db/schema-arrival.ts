// Getting there (I1) — typed mirror of migrations/202611061700_venue_entrances.sql.
// The SQL is the source of truth. Re-exported from ./schema.
import { sql } from 'drizzle-orm';
import { pgTable, text, bigint, boolean, doublePrecision, timestamp, uuid, index, uniqueIndex, check, primaryKey } from 'drizzle-orm/pg-core';
import { venues, profiles, reviews, reviewPhotos } from './schema';

export type EntranceKind = 'main' | 'side' | 'back' | 'lift' | 'other';
export type EntranceSource = 'community' | 'osm';
export type EntranceLocatedBy = 'pin' | 'gps';
export type EntranceAnswer = 'yes' | 'changed';

// The step-free way in, marked by a reviewer (or an OpenStreetMap node, shown
// as unconfirmed). Describes how to get in; never changes a verdict.
export const venueEntrances = pgTable('venue_entrances', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => profiles.userId, { onDelete: 'cascade' }),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }),
  source: text('source').$type<EntranceSource>().notNull().default('community'),
  osmId: bigint('osm_id', { mode: 'number' }),
  kind: text('kind').$type<EntranceKind>().notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  locatedBy: text('located_by').$type<EntranceLocatedBy>(),
  note: text('note'),
  photoId: uuid('photo_id').references(() => reviewPhotos.id, { onDelete: 'set null' }),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('venue_entrances_venue_idx').on(t.venueId),
  index('venue_entrances_user_idx').on(t.userId),
  uniqueIndex('venue_entrances_review_uq').on(t.reviewId),
  uniqueIndex('venue_entrances_osm_uq').on(t.osmId),
  check('venue_entrances_kind_chk', sql`${t.kind} in ('main', 'side', 'back', 'lift', 'other')`),
  check('venue_entrances_source_chk', sql`${t.source} in ('community', 'osm')`),
  check('venue_entrances_located_by_chk', sql`${t.locatedBy} is null or ${t.locatedBy} in ('pin', 'gps')`),
  check('venue_entrances_point_chk', sql`(${t.lat} is null) = (${t.lng} is null)`),
  check('venue_entrances_owner_chk', sql`${t.source} = 'osm' or ${t.userId} is not null`),
]);

// "Still the way in? Yes / Changed" — one answer per person per entrance.
export const entranceConfirmations = pgTable('entrance_confirmations', {
  entranceId: uuid('entrance_id').notNull().references(() => venueEntrances.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  answer: text('answer').$type<EntranceAnswer>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  primaryKey({ name: 'entrance_confirmations_pk', columns: [t.entranceId, t.userId] }),
  index('entrance_confirmations_user_idx').on(t.userId),
  check('entrance_confirmations_answer_chk', sql`${t.answer} in ('yes', 'changed')`),
]);

export type VenueEntrance = typeof venueEntrances.$inferSelect;
export type EntranceConfirmation = typeof entranceConfirmations.$inferSelect;
