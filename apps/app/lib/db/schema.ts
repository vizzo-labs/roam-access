import { sql } from 'drizzle-orm';
import {
  pgTable, text, bigint, doublePrecision, jsonb, boolean, timestamp, uuid,
  primaryKey, uniqueIndex, index, check,
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
}, t => [
  index('reviews_venue_idx').on(t.venueId),
  index('reviews_user_idx').on(t.userId),
  check('reviews_verdict_chk', sql`${t.verdict} in ('works', 'check', 'barrier')`),
]);

export const saved = pgTable('saved', {
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.userId, t.venueId] })]);

export type Venue = typeof venues.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
