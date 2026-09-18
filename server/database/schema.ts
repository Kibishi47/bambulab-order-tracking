import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const members = sqliteTable('members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  dropoffLocation: text('dropoff_location'),
  createdAt: text('created_at').notNull()
})

export const groupOrders = sqliteTable('group_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull(),
  buyerId: integer('buyer_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  purchaseDate: text('purchase_date').notNull(),
  status: text('status', { enum: ['PREPARATION', 'COMMANDE', 'LIVRE', 'CLOTURE'] }).notNull().default('PREPARATION'),
  totalAmount: real('total_amount').notNull(),
  shippingFee: real('shipping_fee').notNull().default(0),
  shippingSplitMethod: text('shipping_split_method', { enum: ['EQUITABLE', 'PRORATA'] }).notNull().default('EQUITABLE'),
  notes: text('notes'),
  createdAt: text('created_at').notNull()
})

export const filamentDemands = sqliteTable('filament_demands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  payerMemberId: integer('payer_member_id').references(() => members.id, { onDelete: 'set null' }),
  groupOrderId: integer('group_order_id').references(() => groupOrders.id, { onDelete: 'set null' }),
  filamentType: text('filament_type').notNull(),
  format: text('format', { enum: ['RECHARGE', 'BOBINE'] }).notNull().default('RECHARGE'),
  colorName: text('color_name').notNull(),
  colorHex: text('color_hex').notNull(),
  quantity: integer('quantity').notNull().default(1),
  estimatedUnitPrice: real('estimated_unit_price').notNull().default(16.99),
  actualUnitPrice: real('actual_unit_price'),
  status: text('status', { enum: ['DEMANDE', 'PRIS_EN_CHARGE', 'COMMANDE', 'RECU', 'DISTRIBUE', 'ANNULE'] }).notNull().default('DEMANDE'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const settlements = sqliteTable('settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupOrderId: integer('group_order_id').references(() => groupOrders.id, { onDelete: 'set null' }),
  payerId: integer('payer_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  receiverId: integer('receiver_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method', { enum: ['WERO', 'LYDIA', 'PAYPAL', 'VIREMENT', 'ESPECES', 'AUTRE'] }).notNull().default('WERO'),
  settledAt: text('settled_at').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull()
})

// Relations
export const membersRelations = relations(members, ({ many }) => ({
  demands: many(filamentDemands, { relationName: 'demands' }),
  sponsoredDemands: many(filamentDemands, { relationName: 'sponsoredDemands' }),
  ordersBought: many(groupOrders),
  settlementsPaid: many(settlements, { relationName: 'payer' }),
  settlementsReceived: many(settlements, { relationName: 'receiver' })
}))

export const groupOrdersRelations = relations(groupOrders, ({ one, many }) => ({
  buyer: one(members, {
    fields: [groupOrders.buyerId],
    references: [members.id]
  }),
  demands: many(filamentDemands),
  settlements: many(settlements)
}))

export const filamentDemandsRelations = relations(filamentDemands, ({ one }) => ({
  member: one(members, {
    fields: [filamentDemands.memberId],
    references: [members.id],
    relationName: 'demands'
  }),
  payerMember: one(members, {
    fields: [filamentDemands.payerMemberId],
    references: [members.id],
    relationName: 'sponsoredDemands'
  }),
  groupOrder: one(groupOrders, {
    fields: [filamentDemands.groupOrderId],
    references: [groupOrders.id]
  })
}))

export const settlementsRelations = relations(settlements, ({ one }) => ({
  payer: one(members, {
    fields: [settlements.payerId],
    references: [members.id],
    relationName: 'payer'
  }),
  receiver: one(members, {
    fields: [settlements.receiverId],
    references: [members.id],
    relationName: 'receiver'
  }),
  groupOrder: one(groupOrders, {
    fields: [settlements.groupOrderId],
    references: [groupOrders.id]
  })
}))

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type GroupOrder = typeof groupOrders.$inferSelect
export type NewGroupOrder = typeof groupOrders.$inferInsert
export type FilamentDemand = typeof filamentDemands.$inferSelect
export type NewFilamentDemand = typeof filamentDemands.$inferInsert
export type Settlement = typeof settlements.$inferSelect
export type NewSettlement = typeof settlements.$inferInsert
