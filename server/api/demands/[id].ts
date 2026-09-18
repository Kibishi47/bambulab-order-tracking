import { getDatabase } from '../../database'
import { filamentDemands } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID besoin invalide' })
  }

  const { db } = getDatabase()
  const method = getMethod(event)

  if (method === 'GET') {
    const [demand] = await db.select().from(filamentDemands).where(eq(filamentDemands.id, id)).all()
    if (!demand) {
      throw createError({ statusCode: 404, statusMessage: 'Besoin non trouvé' })
    }
    return demand
  }

  if (method === 'PATCH' || method === 'PUT') {
    const body = await readBody(event)
    const updateData: Partial<typeof filamentDemands.$inferInsert> = {
      updatedAt: new Date().toISOString()
    }

    if (body.memberId !== undefined) updateData.memberId = Number(body.memberId)
    if (body.payerMemberId !== undefined) updateData.payerMemberId = body.payerMemberId ? Number(body.payerMemberId) : null
    if (body.status !== undefined) updateData.status = body.status
    if (body.quantity !== undefined) updateData.quantity = Math.max(1, parseInt(body.quantity))
    if (body.estimatedUnitPrice !== undefined) updateData.estimatedUnitPrice = parseFloat(body.estimatedUnitPrice)
    if (body.actualUnitPrice !== undefined) updateData.actualUnitPrice = body.actualUnitPrice !== null ? parseFloat(body.actualUnitPrice) : null
    if (body.format !== undefined) updateData.format = body.format
    if (body.filamentType !== undefined) updateData.filamentType = body.filamentType
    if (body.colorName !== undefined) updateData.colorName = body.colorName
    if (body.colorHex !== undefined) updateData.colorHex = body.colorHex
    if (body.isPaused !== undefined) updateData.isPaused = Boolean(body.isPaused)
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.groupOrderId !== undefined) updateData.groupOrderId = body.groupOrderId

    const [updated] = await db.update(filamentDemands)
      .set(updateData)
      .where(eq(filamentDemands.id, id))
      .returning()
      .all()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'Besoin non trouvé' })
    }

    return updated
  }

  if (method === 'DELETE') {
    const [deleted] = await db.delete(filamentDemands).where(eq(filamentDemands.id, id)).returning().all()
    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: 'Besoin non trouvé' })
    }
    return { success: true, deletedId: id }
  }

  throw createError({ statusCode: 405, statusMessage: 'Méthode non autorisée' })
})
