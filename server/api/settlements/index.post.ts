import { getDatabase } from '../../database'
import { settlements, members, type Payment } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { PaymentMethod } from '../../../types'

export default defineEventHandler(async (event): Promise<Payment> => {
  const body = await readBody(event)

  if (!body.payerId) {
    throw createError({ statusCode: 400, statusMessage: 'Le membre payeur est requis' })
  }
  if (!body.receiverId) {
    throw createError({ statusCode: 400, statusMessage: 'Le membre bénéficiaire est requis' })
  }
  if (Number(body.payerId) === Number(body.receiverId)) {
    throw createError({ statusCode: 400, statusMessage: 'Le payeur et le bénéficiaire doivent être différents' })
  }
  if (!body.amount || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Le montant doit être supérieur à 0' })
  }
  if (!body.settledAt) {
    throw createError({ statusCode: 400, statusMessage: 'La date de règlement est requise' })
  }

  const { db } = getDatabase()

  // Verify payer and receiver
  const [payer] = await db.select().from(members).where(eq(members.id, Number(body.payerId))).all()
  const [receiver] = await db.select().from(members).where(eq(members.id, Number(body.receiverId))).all()

  if (!payer || !receiver) {
    throw createError({ statusCode: 400, statusMessage: 'Payeur ou bénéficiaire introuvable' })
  }

  const now = new Date().toISOString()
  const [newSettlement] = await db.insert(settlements).values({
    payerId: payer.id,
    receiverId: receiver.id,
    groupOrderId: body.groupOrderId ? Number(body.groupOrderId) : null,
    amount: parseFloat(body.amount),
    paymentMethod: body.paymentMethod || PaymentMethod.WERO,
    settledAt: body.settledAt,
    notes: body.notes?.trim() || null,
    createdAt: now
  }).returning().all()

  return newSettlement
})
