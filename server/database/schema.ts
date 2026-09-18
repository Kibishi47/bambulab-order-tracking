import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm'
import {
  ORDER_STATUS_VALUES,
  SHIPPING_SPLIT_VALUES,
  FILAMENT_FORMAT_VALUES,
  NEED_STATUS_VALUES,
  PAYMENT_METHOD_VALUES
} from '../../types'

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
  status: text('status', { enum: ORDER_STATUS_VALUES }).notNull().default('PENDING'),
  totalAmount: real('total_amount').notNull(),
  shippingFee: real('shipping_fee').notNull().default(0),
  shippingSplitMethod: text('shipping_split_method', { enum: SHIPPING_SPLIT_VALUES }).notNull().default('EQUAL'),
  discountPercentage: real('discount_percentage').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull()
})

export const filamentDemands = sqliteTable('filament_demands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  payerMemberId: integer('payer_member_id').references(() => members.id, { onDelete: 'set null' }),
  groupOrderId: integer('group_order_id').references(() => groupOrders.id, { onDelete: 'set null' }),
  filamentType: text('filament_type').notNull(),
  format: text('format', { enum: FILAMENT_FORMAT_VALUES }).notNull().default('REFILL'),
  colorName: text('color_name').notNull(),
  colorHex: text('color_hex').notNull(),
  quantity: integer('quantity').notNull().default(1),
  estimatedUnitPrice: real('estimated_unit_price').notNull().default(16.99),
  actualUnitPrice: real('actual_unit_price'),
  effectiveUnitPrice: real('effective_unit_price'),
  isDiscountEligible: integer('is_discount_eligible', { mode: 'boolean' }).notNull().default(true),
  status: text('status', { enum: NEED_STATUS_VALUES }).notNull().default('REQUESTED'),
  isPaused: integer('is_paused', { mode: 'boolean' }).notNull().default(false),
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
  paymentMethod: text('payment_method', { enum: PAYMENT_METHOD_VALUES }).notNull().default('WERO'),
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

// Types inférés Drizzle
export type Member = InferSelectModel<typeof members>
export type NewMember = InferInsertModel<typeof members>

export type GroupOrder = InferSelectModel<typeof groupOrders>
export type NewGroupOrder = InferInsertModel<typeof groupOrders>
export type Order = GroupOrder
export type NewOrder = NewGroupOrder

export type FilamentDemand = InferSelectModel<typeof filamentDemands>
export type NewFilamentDemand = InferInsertModel<typeof filamentDemands>
export type Need = FilamentDemand
export type NewNeed = NewFilamentDemand

export type Settlement = InferSelectModel<typeof settlements>
export type NewSettlement = InferInsertModel<typeof settlements>
export type Payment = Settlement
export type NewPayment = NewSettlement
