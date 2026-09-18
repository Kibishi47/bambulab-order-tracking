import { getDatabase } from '../../database'
import { filamentDemands, members, groupOrders } from '../../database/schema'
import { desc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { NeedStatus, type FilamentDemandDTO } from '../../../types'

export default defineEventHandler(async (event): Promise<FilamentDemandDTO[]> => {
  const query = getQuery(event)
  const { db } = getDatabase()

  const payerMembers = alias(members, 'payer_members')

  const conditions = []

  if (query.status) {
    conditions.push(eq(filamentDemands.status, query.status as NeedStatus))
  }
  if (query.memberId) {
    conditions.push(eq(filamentDemands.memberId, Number(query.memberId)))
  }
  if (query.filamentType) {
    conditions.push(eq(filamentDemands.filamentType, query.filamentType as string))
  }
  if (query.groupOrderId) {
    if (query.groupOrderId === 'null') {
      // Unassigned demands (pending for an order)
      // will filter in JS or where isNull
    } else {
      conditions.push(eq(filamentDemands.groupOrderId, Number(query.groupOrderId)))
    }
  }

  let items = await db.select({
    id: filamentDemands.id,
    memberId: filamentDemands.memberId,
    payerMemberId: filamentDemands.payerMemberId,
    groupOrderId: filamentDemands.groupOrderId,
    filamentType: filamentDemands.filamentType,
    format: filamentDemands.format,
    colorName: filamentDemands.colorName,
    colorHex: filamentDemands.colorHex,
    quantity: filamentDemands.quantity,
    estimatedUnitPrice: filamentDemands.estimatedUnitPrice,
    actualUnitPrice: filamentDemands.actualUnitPrice,
    effectiveUnitPrice: filamentDemands.effectiveUnitPrice,
    isDiscountEligible: filamentDemands.isDiscountEligible,
    status: filamentDemands.status,
    isPaused: filamentDemands.isPaused,
    notes: filamentDemands.notes,
    createdAt: filamentDemands.createdAt,
    updatedAt: filamentDemands.updatedAt,
    memberName: members.name,
    payerMemberName: payerMembers.name,
    orderNumber: groupOrders.orderNumber
  })
  .from(filamentDemands)
  .leftJoin(members, eq(filamentDemands.memberId, members.id))
  .leftJoin(payerMembers, eq(filamentDemands.payerMemberId, payerMembers.id))
  .leftJoin(groupOrders, eq(filamentDemands.groupOrderId, groupOrders.id))
  .orderBy(desc(filamentDemands.createdAt))
  .all()

  if (query.groupOrderId === 'null') {
    items = items.filter(item => item.groupOrderId === null)
  }
  if (query.status) {
    items = items.filter(item => item.status === query.status)
  }
  if (query.memberId) {
    items = items.filter(item => item.memberId === Number(query.memberId))
  }
  if (query.filamentType) {
    items = items.filter(item => item.filamentType === query.filamentType)
  }

  return items
})
