import { getDatabase } from '../../database'
import { settlements } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID règlement invalide' })
  }

  const { db } = getDatabase()
  const [deleted] = await db.delete(settlements).where(eq(settlements.id, id)).returning().all()
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Règlement non trouvé' })
  }

  return { success: true, deletedId: id }
})
