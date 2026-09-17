import { getDatabase } from '../../database'
import { settlements, members, groupOrders } from '../../database/schema'
import { desc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

export default defineEventHandler(async () => {
  const { db } = getDatabase()

  const payers = alias(members, 'payers')
  const receivers = alias(members, 'receivers')

  const list = await db.select({
    id: settlements.id,
    groupOrderId: settlements.groupOrderId,
    payerId: settlements.payerId,
    receiverId: settlements.receiverId,
    amount: settlements.amount,
    paymentMethod: settlements.paymentMethod,
    settledAt: settlements.settledAt,
    notes: settlements.notes,
    createdAt: settlements.createdAt,
    payerName: payers.name,
    receiverName: receivers.name,
    orderNumber: groupOrders.orderNumber
  })
  .from(settlements)
  .leftJoin(payers, eq(settlements.payerId, payers.id))
  .leftJoin(receivers, eq(settlements.receiverId, receivers.id))
  .leftJoin(groupOrders, eq(settlements.groupOrderId, groupOrders.id))
  .orderBy(desc(settlements.settledAt), desc(settlements.createdAt))
  .all()

  return list
})
