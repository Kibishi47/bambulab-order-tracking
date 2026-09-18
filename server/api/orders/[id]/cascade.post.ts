import { getDatabase } from '../../../database'
import { groupOrders } from '../../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID commande invalide' })
  }

  const body = await readBody(event)
  const action = body?.action as 'RECEIVE' | 'DISTRIBUTE' | undefined

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

  if (action === 'RECEIVE') {
    targetOrderStatus = 'LIVRE'
    targetDemandStatus = 'RECU'
  } else {
    targetOrderStatus = 'CLOTURE'
    targetDemandStatus = 'DISTRIBUE'
  }

  // Execute in an atomic SQLite transaction
  const executeCascade = sqlite.transaction(() => {
    // 1. Update group order status
    sqlite.prepare(`
      UPDATE group_orders
      SET status = ?
      WHERE id = ?
    `).run(targetOrderStatus, id)

    // 2. Cascade update all linked demands that are not cancelled
    const result = sqlite.prepare(`
      UPDATE filament_demands
      SET status = ?, updated_at = ?
      WHERE group_order_id = ? AND status != 'ANNULE'
    `).run(targetDemandStatus, now, id)

    return result.changes
  })

  const affectedDemandsCount = executeCascade()

  return {
    success: true,
    orderId: id,
    orderStatus: targetOrderStatus,
    demandStatus: targetDemandStatus,
    affectedDemandsCount
  }
})
