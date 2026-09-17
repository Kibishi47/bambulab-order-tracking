import { getDatabase } from '../../database'
import { members } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom du membre est requis'
    })
  }

  const { db } = getDatabase()
  const now = new Date().toISOString()

  const [newMember] = await db.insert(members).values({
    name: body.name.trim(),
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    dropoffLocation: body.dropoffLocation?.trim() || null,
    createdAt: now
  }).returning().all()

  return newMember
})
