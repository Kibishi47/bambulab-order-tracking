import { getDatabase } from '../../database'
import { groupOrders, members, filamentDemands } from '../../database/schema'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const { db } = getDatabase()

  const orders = await db.select({
    id: groupOrders.id,
    orderNumber: groupOrders.orderNumber,
    buyerId: groupOrders.buyerId,
    purchaseDate: groupOrders.purchaseDate,
    status: groupOrders.status,
    totalAmount: groupOrders.totalAmount,
    shippingFee: groupOrders.shippingFee,
    notes: groupOrders.notes,
    createdAt: groupOrders.createdAt,
    buyerName: members.name
  })
  .from(groupOrders)
  .leftJoin(members, eq(groupOrders.buyerId, members.id))
  .orderBy(desc(groupOrders.purchaseDate), desc(groupOrders.createdAt))
  .all()

  const allDemands = await db.select().from(filamentDemands).all()

  return orders.map(order => {
    const orderDemands = allDemands.filter(d => d.groupOrderId === order.id)
    const totalSpools = orderDemands.reduce((sum, d) => sum + d.quantity, 0)
    return {
      ...order,
      itemCount: orderDemands.length,
      totalSpools
    }
  })
})
