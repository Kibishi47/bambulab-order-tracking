import { getDatabase } from '../../database'
import { groupOrders, members, filamentDemands, type Order } from '../../database/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { OrderStatus, NeedStatus, ShippingSplitMode } from '../../../types'
import { computeEffectiveUnitPrice } from '../../../utils/pricing'

export default defineEventHandler(async (event): Promise<Order> => {
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
  const shippingSplitMethod = body.shippingSplitMethod === ShippingSplitMode.PRO_RATA ? ShippingSplitMode.PRO_RATA : ShippingSplitMode.EQUAL

  const discountPercentage = Math.min(100, Math.max(0, parseFloat(body.discountPercentage) || 0))

  const [newOrder] = await db.insert(groupOrders).values({
    orderNumber: body.orderNumber.trim(),
    buyerId: buyer.id,
    purchaseDate: body.purchaseDate,
    status: body.status || OrderStatus.ORDERED,
    totalAmount,
    shippingFee,
    shippingSplitMethod,
    discountPercentage,
    notes: body.notes?.trim() || null,
    createdAt: now
  }).returning().all()

  // If demand IDs are attached, link only non-paused demands and compute effective prices
  if (Array.isArray(body.demandIds) && body.demandIds.length > 0) {
    const demandIds = body.demandIds.map(Number)
    const ineligibleDemandIdsSet = new Set<number>(
      Array.isArray(body.ineligibleDemandIds) ? body.ineligibleDemandIds.map(Number) : []
    )

    const linkedDemands = await db.select()
      .from(filamentDemands)
      .where(and(inArray(filamentDemands.id, demandIds), eq(filamentDemands.isPaused, false)))
      .all()

    for (const d of linkedDemands) {
      const isEligible = !ineligibleDemandIdsSet.has(d.id)
      const effectiveUnitPrice = computeEffectiveUnitPrice(d.estimatedUnitPrice, discountPercentage, isEligible)

      await db.update(filamentDemands)
        .set({
          groupOrderId: newOrder.id,
          isDiscountEligible: isEligible,
          effectiveUnitPrice,
          actualUnitPrice: effectiveUnitPrice,
          status: NeedStatus.ORDERED,
          updatedAt: now
        })
        .where(eq(filamentDemands.id, d.id))
        .run()
    }
  }

  return newOrder
})
