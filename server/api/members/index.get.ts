import { getDatabase } from '../../database'
import { members, filamentDemands, groupOrders } from '../../database/schema'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const { db } = getDatabase()
  const allMembers = await db.select().from(members).orderBy(desc(members.createdAt)).all()

  // Attach quick statistics for each member
  const allDemands = await db.select().from(filamentDemands).all()
  const allOrders = await db.select().from(groupOrders).all()

  return allMembers.map(m => {
    const memberDemands = allDemands.filter(d => d.memberId === m.id)
    const ordersBought = allOrders.filter(o => o.buyerId === m.id)
    return {
      ...m,
      demandsCount: memberDemands.length,
      pendingDemandsCount: memberDemands.filter(d => d.status === 'DEMANDE' || d.status === 'PRIS_EN_CHARGE').length,
      ordersBoughtCount: ordersBought.length
    }
  })
})
