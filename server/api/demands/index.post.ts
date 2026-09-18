import { getDatabase } from '../../database'
import { filamentDemands, members } from '../../database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.memberId) {
    throw createError({ statusCode: 400, statusMessage: 'Le membre demandeur est requis' })
  }
  if (!body.filamentType || typeof body.filamentType !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Le type de filament est requis' })
  }
  if (!body.colorName || typeof body.colorName !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'La couleur est requise' })
  }

  const colorHex = (body.colorHex && typeof body.colorHex === 'string') ? body.colorHex.trim() : '#71717a'
  const quantity = Math.max(1, parseInt(body.quantity) || 1)
  const estimatedUnitPrice = Math.max(0, parseFloat(body.estimatedUnitPrice) || 16.99)
  const format = body.format === 'BOBINE' ? 'BOBINE' : 'RECHARGE'

  const { db } = getDatabase()

  // Verify member exists
  const [member] = await db.select().from(members).where(eq(members.id, Number(body.memberId))).all()
  if (!member) {
    throw createError({ statusCode: 400, statusMessage: 'Membre introuvable' })
  }

  let payerMemberId: number | null = null
  if (body.payerMemberId) {
    const [payer] = await db.select().from(members).where(eq(members.id, Number(body.payerMemberId))).all()
    if (!payer) {
      throw createError({ statusCode: 400, statusMessage: 'Membre payeur introuvable' })
    }
    payerMemberId = payer.id
  }

  const isPaused = Boolean(body.isPaused)

  const now = new Date().toISOString()
  const [newDemand] = await db.insert(filamentDemands).values({
    memberId: member.id,
    payerMemberId,
    groupOrderId: null,
    filamentType: body.filamentType.trim(),
    format,
    colorName: body.colorName.trim(),
    colorHex,
    quantity,
    estimatedUnitPrice,
    actualUnitPrice: null,
    status: 'DEMANDE',
    isPaused,
    notes: body.notes?.trim() || null,
    createdAt: now,
    updatedAt: now
  }).returning().all()

  return newDemand
})
