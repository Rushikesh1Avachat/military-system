import { pgTable, serial, text, integer, timestamp, boolean, decimal, jsonb } from 'drizzle-orm/pg-core';

export const bases = pgTable('bases', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  commander: text('commander'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentTypes = pgTable('equipment_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  baseId: integer('base_id').notNull().references(() => bases.id),
  equipmentTypeId: integer('equipment_type_id').notNull().references(() => equipmentTypes.id),
  openingBalance: integer('opening_balance').notNull().default(0),
  closingBalance: integer('closing_balance').notNull().default(0),
  quantityOnHand: integer('quantity_on_hand').notNull().default(0),
  assignedQuantity: integer('assigned_quantity').notNull().default(0),
  expendedQuantity: integer('expended_quantity').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  baseId: integer('base_id').notNull().references(() => bases.id),
  equipmentTypeId: integer('equipment_type_id').notNull().references(() => equipmentTypes.id),
  quantity: integer('quantity').notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  purchaseDate: timestamp('purchase_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transfers = pgTable('transfers', {
  id: serial('id').primaryKey(),
  fromBaseId: integer('from_base_id').notNull().references(() => bases.id),
  toBaseId: integer('to_base_id').notNull().references(() => bases.id),
  equipmentTypeId: integer('equipment_type_id').notNull().references(() => equipmentTypes.id),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  transferDate: timestamp('transfer_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  baseId: integer('base_id').notNull().references(() => bases.id),
  equipmentTypeId: integer('equipment_type_id').notNull().references(() => equipmentTypes.id),
  assetName: text('asset_name').notNull(),
  assignedTo: text('assigned_to').notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull().default('active'),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const expenditures = pgTable('expenditures', {
  id: serial('id').primaryKey(),
  baseId: integer('base_id').notNull().references(() => bases.id),
  equipmentTypeId: integer('equipment_type_id').notNull().references(() => equipmentTypes.id),
  assetName: text('asset_name').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  expenditureDate: timestamp('expenditure_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  tableName: text('table_name').notNull(),
  action: text('action').notNull(),
  actorRole: text('actor_role').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  googleId: text('google_id').unique(),
  picture: text('picture'),
  role: text('role').notNull(),
  assignedBaseId: integer('assigned_base_id').references(() => bases.id),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
