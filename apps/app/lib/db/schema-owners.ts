// Business portal v2 — typed mirror of migrations/202611071305_business_portal_v2.sql.
// The SQL is the source of truth. Re-exported from ./schema.
// Nothing here is read by the verdict engine (honesty rule).
import { sql } from 'drizzle-orm';
import { pgTable, text, boolean, timestamp, uuid, date, integer, primaryKey, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { venues, profiles, reviews } from './schema';

export const venueNotices = pgTable('venue_notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => profiles.userId, { onDelete: 'set null' }),
  body: text('body').notNull(),
  endsOn: date('ends_on'),
  hidden: boolean('hidden').notNull().default(false),
  hiddenAt: timestamp('hidden_at', { withTimezone: true }),
  hiddenNote: text('hidden_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('venue_notices_venue_idx').on(t.venueId),
  index('venue_notices_created_idx').on(t.createdAt),
]);

export const noticeSeen = pgTable('notice_seen', {
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  noticeId: uuid('notice_id').notNull().references(() => venueNotices.id, { onDelete: 'cascade' }),
  seenAt: timestamp('seen_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ name: 'notice_seen_pk', columns: [t.userId, t.noticeId] })]);

export type VenuePhotoKind = 'entrance' | 'inside' | 'toilet' | 'parking' | 'other';

export const venuePhotos = pgTable('venue_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => profiles.userId, { onDelete: 'set null' }),
  kind: text('kind').$type<VenuePhotoKind>().notNull().default('other'),
  alt: text('alt').notNull(),
  pathname: text('pathname').notNull(),
  thumbPathname: text('thumb_pathname').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  bytes: integer('bytes').notNull(),
  hidden: boolean('hidden').notNull().default(false),
  hiddenAt: timestamp('hidden_at', { withTimezone: true }),
  hiddenNote: text('hidden_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('venue_photos_venue_idx').on(t.venueId),
  check('venue_photos_kind_chk', sql`${t.kind} IN ('entrance', 'inside', 'toilet', 'parking', 'other')`),
]);

export type ReportReason = 'personal' | 'offensive' | 'wrong-place' | 'fake' | 'other';
export type ReportStatus = 'open' | 'kept' | 'hidden';

export const reviewReports = pgTable('review_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  reporterId: text('reporter_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  reason: text('reason').$type<ReportReason>().notNull(),
  note: text('note').notNull().default(''),
  status: text('status').$type<ReportStatus>().notNull().default('open'),
  decidedBy: text('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('review_reports_status_idx').on(t.status),
  uniqueIndex('review_reports_open_uq').on(t.reviewId, t.reporterId).where(sql`status = 'open'`),
  check('review_reports_reason_chk', sql`${t.reason} IN ('personal', 'offensive', 'wrong-place', 'fake', 'other')`),
  check('review_reports_status_chk', sql`${t.status} IN ('open', 'kept', 'hidden')`),
]);

export const venueCorrections = pgTable('venue_corrections', {
  venueId: text('venue_id').primaryKey().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => profiles.userId, { onDelete: 'set null' }),
  phone: text('phone'),
  website: text('website'),
  openingHours: text('opening_hours'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type VenueNotice = typeof venueNotices.$inferSelect;
export type VenuePhoto = typeof venuePhotos.$inferSelect;
export type ReviewReport = typeof reviewReports.$inferSelect;
export type VenueCorrection = typeof venueCorrections.$inferSelect;
