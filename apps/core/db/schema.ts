import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Organizations table - stores company or team details
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  domain: text('domain').unique(),
  ownerEmail: text('owner_email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Apps table - metadata for each registered app in the ecosystem
 */
export const apps = pgTable('apps', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g. 'notes', 'attendance'
  name: text('name').notNull(),
  description: text('description'),
});

/**
 * Subscriptions table - tracks which org has access to which app and plan
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  appId: uuid('app_id')
    .references(() => apps.id)
    .notNull(),
  planCode: text('plan_code').notNull(), // 'free', 'pro', 'business', 'enterprise'
  status: text('status').default('active'), // 'active', 'expired', 'cancelled'
  startedAt: timestamp('started_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});

/**
 * Plan features table - defines limits and features per plan
 */
export const planFeatures = pgTable('plan_features', {
  id: uuid('id').primaryKey().defaultRandom(),
  planCode: text('plan_code').notNull(),
  feature: text('feature').notNull(),
  limitValue: integer('limit_value'),
});

/**
 * Global users table - holds identity for all registered users across organizations
 */
export const globalUsers = pgTable('global_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  role: text('role').default('org_admin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

