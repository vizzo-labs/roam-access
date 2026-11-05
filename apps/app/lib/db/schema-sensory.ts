// F6 · Sensory content — typed mirror of migrations/202611061600_sensory_content.sql.
// The SQL is the source of truth. Re-exported from ./schema.
import { sql } from 'drizzle-orm';
import { pgTable, text, boolean, timestamp, uuid, index, check } from 'drizzle-orm/pg-core';
import {
  venues, profiles, reviews,
  type SensoryNoise, type SensoryLight, type SensoryCrowd, type SensorySlot, type SensoryDayKind,
} from './schema';

// Time-stamped observations: from a review (review_id set) or a "How is it
// right now?" check-in (review_id NULL). User id only — never needs or name.
export const sensoryReports = pgTable('sensory_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }),
  noise: text('noise').$type<SensoryNoise>(),
  light: text('light').$type<SensoryLight>(),
  crowd: text('crowd').$type<SensoryCrowd>(),
  slot: text('slot').$type<SensorySlot>().notNull(),
  dayKind: text('day_kind').$type<SensoryDayKind>(),
  observedAt: timestamp('observed_at', { withTimezone: true }).notNull().defaultNow(),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('sensory_reports_venue_idx').on(t.venueId, t.observedAt),
  index('sensory_reports_user_idx').on(t.userId),
  index('sensory_reports_review_idx').on(t.reviewId),
  check('sensory_reports_noise_chk', sql`${t.noise} is null or ${t.noise} in ('quiet', 'some', 'loud')`),
  check('sensory_reports_light_chk', sql`${t.light} is null or ${t.light} in ('soft', 'bright', 'harsh')`),
  check('sensory_reports_crowd_chk', sql`${t.crowd} is null or ${t.crowd} in ('few', 'some', 'busy')`),
  check('sensory_reports_slot_chk', sql`${t.slot} in ('early', 'midday', 'afternoon', 'evening')`),
  check('sensory_reports_day_kind_chk', sql`${t.dayKind} is null or ${t.dayKind} in ('weekday', 'weekend')`),
]);

export type SensoryReport = typeof sensoryReports.$inferSelect;
