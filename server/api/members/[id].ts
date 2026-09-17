import { getDatabase } from '../../database'
import { members, filamentDemands, groupOrders, settlements } from '../../database/schema'
import { eq, or } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID membre invalide' })
  }

  const { db } = getDatabase()
  const method = getMethod(event)

  if (method === 'GET') {
    const [member] = await db.select().from(members).where(eq(members.id, id)).all()
    if (!member) {
      throw createError({ statusCode: 404, statusMessage: 'Membre non trouvé' })
    }

    const demandsList = await db.select().from(filamentDemands).where(eq(filamentDemands.memberId, id)).all()
    const ordersBought = await db.select().from(groupOrders).where(eq(groupOrders.buyerId, id)).all()
    const settlementsList = await db.select().from(settlements).where(
      or(eq(settlements.payerId, id), eq(settlements.receiverId, id))
    ).all()

    return {
      ...member,
      demands: demandsList,
      ordersBought,
      settlements: settlementsList
    }
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Le nom du membre est requis' })
    }

    const [updated] = await db.update(members)
      .set({
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        dropoffLocation: body.dropoffLocation?.trim() || null
      })
      .where(eq(members.id, id))
      .returning()
      .all()

    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'Membre non trouvé' })
    }

    return updated
  }

  if (method === 'DELETE') {
    const [deleted] = await db.delete(members).where(eq(members.id, id)).returning().all()
    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: 'Membre non trouvé' })
    }
    return { success: true, deletedId: id }
  }

  throw createError({ statusCode: 405, statusMessage: 'Méthode non autorisée' })
})
