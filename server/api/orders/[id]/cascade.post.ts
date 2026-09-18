import { getDatabase } from '../../../database'
import { groupOrders } from '../../../database/schema'
import { eq } from 'drizzle-orm'
import { OrderStatus, NeedStatus, type CascadeAction } from '../../../../types'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID commande invalide' })
  }

  const body = await readBody(event)
  const action = body?.action as CascadeAction | undefined

  if (!action || !['RECEIVE', 'DISTRIBUTE'].includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Action invalide. Choix possibles : RECEIVE, DISTRIBUTE' })
  }

  const { db, sqlite } = getDatabase()

  // Verify order exists
  const [order] = await db.select().from(groupOrders).where(eq(groupOrders.id, id)).all()
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Commande non trouvée' })
  }

  const now = new Date().toISOString()
  let targetOrderStatus: string
  let targetDemandStatus: string
  let requiredPreviousStatus: string

  if (action === 'RECEIVE') {
    targetOrderStatus = OrderStatus.RECEIVED
    targetDemandStatus = NeedStatus.RECEIVED
    requiredPreviousStatus = NeedStatus.ORDERED
  } else {
    targetOrderStatus = OrderStatus.DISTRIBUTED
    targetDemandStatus = NeedStatus.DISTRIBUTED
    requiredPreviousStatus = NeedStatus.RECEIVED
  }

  // Execute in an atomic SQLite transaction
  const executeCascade = sqlite.transaction(() => {
    // 1. Update group order status
    sqlite.prepare(`
      UPDATE group_orders
      SET status = ?
      WHERE id = ?
    `).run(targetOrderStatus, id)

    // Total linked demands in this order
    const totalDemands = (sqlite.prepare(`
      SELECT count(*) as count
      FROM filament_demands
      WHERE group_order_id = ?
    `).get(id) as any)?.count || 0

    // 2. Cascade update ONLY demands that are strictly in the required previous status
    const result = sqlite.prepare(`
      UPDATE filament_demands
      SET status = ?, updated_at = ?
      WHERE group_order_id = ? AND status = ?
    `).run(targetDemandStatus, now, id, requiredPreviousStatus)

    const affectedCount = result.changes
    const ignoredCount = totalDemands - affectedCount

    return { affectedCount, ignoredCount, totalDemands }
  })

  const { affectedCount, ignoredCount, totalDemands } = executeCascade()

  return {
    success: true,
    orderId: id,
    orderStatus: targetOrderStatus,
    demandStatus: targetDemandStatus,
    requiredPreviousStatus,
    affectedCount,
    ignoredCount,
    totalDemands
  }
})
