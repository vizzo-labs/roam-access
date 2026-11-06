// Getting there 2 (I2) — typed mirror of migrations/202611061730_arrival_guide.sql.
// The SQL is the source of truth. Re-exported from ./schema.
import { sql } from 'drizzle-orm';
import { pgTable, text, boolean, integer, jsonb, timestamp, uuid, index, check } from 'drizzle-orm/pg-core';
import { venues, profiles, reviewPhotos } from './schema';

// One person's ordered steps from the street to the door. Describes how to
// get there; never changes a verdict. User id only (for deletion and "one
// confirmation per person"); shown by the `needs` snapshot, never by name.
export const arrivalSteps = pgTable('arrival_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  needs: text('needs').array().notNull().default(sql`'{}'::text[]`),
  source: text('source').$type<'community' | 'venue'>().notNull().default('community'),
  fromPlace: text('from_place'),
  steps: jsonb('steps').$type<string[]>().notNull(),
  photoId: uuid('photo_id').references(() => reviewPhotos.id, { onDelete: 'set null' }),
  confirmations: integer('confirmations').notNull().default(0),
  confirmedBy: text('confirmed_by').array().notNull().default(sql`'{}'::text[]`),
  lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true }).notNull().defaultNow(),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('arrival_steps_venue_idx').on(t.venueId),
  index('arrival_steps_photo_idx').on(t.photoId),
  check('arrival_steps_source_chk', sql`${t.source} in ('community', 'venue')`),
  check('arrival_steps_steps_chk', sql`jsonb_typeof(${t.steps}) = 'array' and jsonb_array_length(${t.steps}) between 1 and 6`),
]);

export type ArrivalStep = typeof arrivalSteps.$inferSelect;
