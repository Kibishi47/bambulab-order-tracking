import { getDatabase } from '../../database'
import { groupOrders, members, filamentDemands, settlements } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID commande invalide' })
  }

  const { db } = getDatabase()
  const method = getMethod(event)

  if (method === 'GET') {
    const [order] = await db.select({
      id: groupOrders.id,
      orderNumber: groupOrders.orderNumber,
      buyerId: groupOrders.buyerId,
      purchaseDate: groupOrders.purchaseDate,
      status: groupOrders.status,
      totalAmount: groupOrders.totalAmount,
      shippingFee: groupOrders.shippingFee,
      shippingSplitMethod: groupOrders.shippingSplitMethod,
      notes: groupOrders.notes,
      createdAt: groupOrders.createdAt,
      buyerName: members.name,
      buyerEmail: members.email,
      buyerPhone: members.phone
    })
    .from(groupOrders)
    .leftJoin(members, eq(groupOrders.buyerId, members.id))
    .where(eq(groupOrders.id, id))
    .all()

    if (!order) {
      throw createError({ statusCode: 404, statusMessage: 'Commande non trouvée' })
    }

    // Demands in this order
    const orderDemands = await db.select({
      id: filamentDemands.id,
      memberId: filamentDemands.memberId,
      groupOrderId: filamentDemands.groupOrderId,
      filamentType: filamentDemands.filamentType,
      format: filamentDemands.format,
      colorName: filamentDemands.colorName,
      colorHex: filamentDemands.colorHex,
      quantity: filamentDemands.quantity,
      estimatedUnitPrice: filamentDemands.estimatedUnitPrice,
      actualUnitPrice: filamentDemands.actualUnitPrice,
      status: filamentDemands.status,
      notes: filamentDemands.notes,
      memberName: members.name,
      memberEmail: members.email
    })
    .from(filamentDemands)
    .leftJoin(members, eq(filamentDemands.memberId, members.id))
    .where(eq(filamentDemands.groupOrderId, id))
    .all()

    // Settlements linked to this order
    const orderSettlements = await db.select({
      id: settlements.id,
      payerId: settlements.payerId,
      receiverId: settlements.receiverId,
      amount: settlements.amount,
      paymentMethod: settlements.paymentMethod,
      settledAt: settlements.settledAt,
      notes: settlements.notes
    })
    .from(settlements)
    .where(eq(settlements.groupOrderId, id))
    .all()

    // Member cost breakdown for this order including shipping fee split
    const memberBreakdownMap = new Map<number, {
      memberId: number
      memberName: string
      itemsCount: number
      spoolsCount: number
      filamentCost: number
      shippingShare: number
      totalCost: number
    }>()

    let totalFilamentsValue = 0

    for (const d of orderDemands) {
      const unitPrice = d.actualUnitPrice ?? d.estimatedUnitPrice
      const cost = d.quantity * unitPrice
      totalFilamentsValue += cost

      const current = memberBreakdownMap.get(d.memberId) || {
        memberId: d.memberId,
        memberName: d.memberName || 'Membre inconnu',
        itemsCount: 0,
        spoolsCount: 0,
        filamentCost: 0,
        shippingShare: 0,
        totalCost: 0
      }
      current.itemsCount += 1
      current.spoolsCount += d.quantity
      current.filamentCost += cost
      memberBreakdownMap.set(d.memberId, current)
    }

    const participantsCount = memberBreakdownMap.size
    const orderShipping = Number(order.shippingFee || 0)

    for (const item of memberBreakdownMap.values()) {
      let share = 0
      if (orderShipping > 0 && participantsCount > 0) {
        if (order.shippingSplitMethod === 'PRORATA' && totalFilamentsValue > 0) {
          share = (item.filamentCost / totalFilamentsValue) * orderShipping
        } else {
          share = orderShipping / participantsCount
        }
      }
      item.shippingShare = Math.round(share * 100) / 100
      item.filamentCost = Math.round(item.filamentCost * 100) / 100
      item.totalCost = Math.round((item.filamentCost + item.shippingShare) * 100) / 100
    }

    return {
      ...order,
      demands: orderDemands,
      settlements: orderSettlements,
      breakdown: Array.from(memberBreakdownMap.values())
    }
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const updateData: Partial<typeof groupOrders.$inferInsert> = {}

    if (body.orderNumber !== undefined) updateData.orderNumber = body.orderNumber.trim()
    if (body.buyerId !== undefined) updateData.buyerId = Number(body.buyerId)
    if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate
    if (body.status !== undefined) updateData.status = body.status
    if (body.totalAmount !== undefined) updateData.totalAmount = parseFloat(body.totalAmount)
    if (body.shippingFee !== undefined) updateData.shippingFee = parseFloat(body.shippingFee)
    if (body.shippingSplitMethod !== undefined) updateData.shippingSplitMethod = body.shippingSplitMethod === 'PRORATA' ? 'PRORATA' : 'EQUITABLE'
    if (body.notes !== undefined) updateData.notes = body.notes

    const [updated] = await db.update(groupOrders)
      .set(updateData)
      .where(eq(groupOrders.id, id))
      .returning()
      .all()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'Commande non trouvée' })
    }

    return updated
  }

  if (method === 'DELETE') {
    // Unlink demands
    await db.update(filamentDemands)
      .set({ groupOrderId: null, status: 'DEMANDE' })
      .where(eq(filamentDemands.groupOrderId, id))
      .run()

    const [deleted] = await db.delete(groupOrders).where(eq(groupOrders.id, id)).returning().all()
    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: 'Commande non trouvée' })
    }

    return { success: true, deletedId: id }
  }

  throw createError({ statusCode: 405, statusMessage: 'Méthode non autorisée' })
})
