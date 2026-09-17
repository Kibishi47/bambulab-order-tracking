import { getDatabase } from '../../database'
import { groupOrders, members, filamentDemands } from '../../database/schema'
import { eq, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.orderNumber || typeof body.orderNumber !== 'string' || body.orderNumber.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Le numéro de commande est requis (ex: FR12345678)' })
  }
  if (!body.buyerId) {
    throw createError({ statusCode: 400, statusMessage: "L'acheteur (membre qui avance les fonds) est requis" })
  }
  if (!body.purchaseDate) {
    throw createError({ statusCode: 400, statusMessage: "La date d'achat est requise" })
  }
  if (body.totalAmount === undefined || isNaN(Number(body.totalAmount))) {
    throw createError({ statusCode: 400, statusMessage: 'Le montant total réel est requis' })
  }

  const { db } = getDatabase()

  // Validate buyer exists
  const [buyer] = await db.select().from(members).where(eq(members.id, Number(body.buyerId))).all()
  if (!buyer) {
    throw createError({ statusCode: 400, statusMessage: 'Acheteur introuvable' })
  }

  const now = new Date().toISOString()
  const totalAmount = Math.max(0, parseFloat(body.totalAmount))
  const shippingFee = Math.max(0, parseFloat(body.shippingFee) || 0)

  const [newOrder] = await db.insert(groupOrders).values({
    orderNumber: body.orderNumber.trim(),
    buyerId: buyer.id,
    purchaseDate: body.purchaseDate,
    status: body.status || 'COMMANDE',
    totalAmount,
    shippingFee,
    notes: body.notes?.trim() || null,
    createdAt: now
  }).returning().all()

  // If demand IDs are attached, link them and update status to COMMANDE
  if (Array.isArray(body.demandIds) && body.demandIds.length > 0) {
    const demandIds = body.demandIds.map(Number)
    await db.update(filamentDemands)
      .set({
        groupOrderId: newOrder.id,
        status: 'COMMANDE',
        updatedAt: now
      })
      .where(inArray(filamentDemands.id, demandIds))
      .run()
  }

  return newOrder
})
