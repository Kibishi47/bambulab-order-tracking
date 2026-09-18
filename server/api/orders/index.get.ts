import { getDatabase } from '../../database'
import { groupOrders, members, filamentDemands } from '../../database/schema'
import { desc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import type { GroupOrderDTO } from '../../../types'

export default defineEventHandler(async (): Promise<GroupOrderDTO[]> => {
  const { db } = getDatabase()

  const payerMembers = alias(members, 'payer_members')

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

  const allDemands = await db.select({
    id: filamentDemands.id,
    memberId: filamentDemands.memberId,
    payerMemberId: filamentDemands.payerMemberId,
    groupOrderId: filamentDemands.groupOrderId,
    filamentType: filamentDemands.filamentType,
    format: filamentDemands.format,
    colorName: filamentDemands.colorName,
    colorHex: filamentDemands.colorHex,
    quantity: filamentDemands.quantity,
    status: filamentDemands.status,
    isPaused: filamentDemands.isPaused,
    memberName: members.name,
    payerMemberName: payerMembers.name
  })
  .from(filamentDemands)
  .leftJoin(members, eq(filamentDemands.memberId, members.id))
  .leftJoin(payerMembers, eq(filamentDemands.payerMemberId, payerMembers.id))
  .all()

  return orders.map(order => {
    const orderDemands = allDemands.filter(d => d.groupOrderId === order.id)
    const totalSpools = orderDemands.reduce((sum, d) => sum + d.quantity, 0)
    return {
      ...order,
      itemCount: orderDemands.length,
      totalSpools,
      demands: orderDemands
    }
  })
})
