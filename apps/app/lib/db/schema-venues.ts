// F5 · Venues & councils — typed mirror of migrations/202611061500_venues_councils.sql.
// The SQL is the source of truth. Re-exported from ./schema.
import { sql } from 'drizzle-orm';
import {
  pgTable, text, boolean, timestamp, uuid, date, integer,
  primaryKey, uniqueIndex, index, check,
} from 'drizzle-orm/pg-core';
import { venues, profiles, reviews } from './schema';

// Roles an admin grants (today: 'council'). Admins themselves are ADMIN_EMAILS.
export const userRoles = pgTable('user_roles', {
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  org: text('org'),
  grantedBy: text('granted_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ name: 'user_roles_pk', columns: [t.userId, t.role] })]);

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export const venueClaims = pgTable('venue_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  status: text('status').$type<ClaimStatus>().notNull().default('pending'),
  role: text('role').notNull().default('owner'),
  contactName: text('contact_name').notNull().default(''),
  contactEmail: text('contact_email').notNull().default(''),
  contactPhone: text('contact_phone').notNull().default(''),
  evidence: text('evidence').notNull().default(''),
  verification: text('verification'),
  adminNote: text('admin_note'),
  decidedBy: text('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('venue_claims_venue_idx').on(t.venueId),
  index('venue_claims_user_idx').on(t.userId),
  uniqueIndex('venue_claims_open_uq').on(t.venueId, t.userId).where(sql`status IN ('pending', 'approved')`),
  check('venue_claims_status_chk', sql`${t.status} IN ('pending', 'approved', 'rejected', 'revoked')`),
]);

// "Venue says": reply to a review (reviewId set) or the venue's access statement (reviewId null).
export const venueReplies = pgTable('venue_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex('venue_replies_review_uq').on(t.reviewId).where(sql`review_id IS NOT NULL`),
  uniqueIndex('venue_replies_statement_uq').on(t.venueId).where(sql`review_id IS NULL`),
]);

export type CardStatus = 'draft' | 'sent' | 'seen' | 'replied';

// Pre-arrival needs card: venueId null = the tester's saved card; set = sent to a venue.
export const needsCards = pgTable('needs_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  venueId: text('venue_id').references(() => venues.id, { onDelete: 'cascade' }),
  needs: text('needs').array().notNull().default(sql`'{}'::text[]`),
  note: text('note').notNull().default(''),
  visitOn: date('visit_on'),
  status: text('status').$type<CardStatus>().notNull().default('draft'),
  venueResponse: text('venue_response'),
  seenAt: timestamp('seen_at', { withTimezone: true }),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index('needs_cards_venue_idx').on(t.venueId),
  uniqueIndex('needs_cards_template_uq').on(t.userId).where(sql`venue_id IS NULL`),
  check('needs_cards_status_chk', sql`${t.status} IN ('draft', 'sent', 'seen', 'replied')`),
]);

// Anonymous daily counts: kind 'view' | 'search', need = a NeedId or 'any'. No user ids.
export const venueViews = pgTable('venue_views', {
  venueId: text('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  day: date('day').notNull(),
  kind: text('kind').notNull(),
  need: text('need').notNull(),
  count: integer('count').notNull().default(0),
}, t => [
  primaryKey({ name: 'venue_views_pk', columns: [t.venueId, t.day, t.kind, t.need] }),
  index('venue_views_day_idx').on(t.day),
]);

export type VenueClaim = typeof venueClaims.$inferSelect;
export type VenueReply = typeof venueReplies.$inferSelect;
export type NeedsCard = typeof needsCards.$inferSelect;
