import { getDatabase } from '../database'
import { members, groupOrders, filamentDemands, settlements } from '../database/schema'

export interface MemberBalance {
  memberId: number
  memberName: string
  memberEmail: string | null
  memberPhone: string | null
  dropoffLocation: string | null
  totalAdvanced: number
  totalConsumed: number
  settlementsPaid: number
  settlementsReceived: number
  netBalance: number
  status: 'CREDITOR' | 'DEBTOR' | 'BALANCED'
}

export interface SimplifiedDebt {
  fromMemberId: number
  fromMemberName: string
  toMemberId: number
  toMemberName: string
  amount: number
}

export default defineEventHandler(async () => {
  const { db } = getDatabase()

  const allMembers = await db.select().from(members).all()
  const allOrders = await db.select().from(groupOrders).all()
  const allDemands = await db.select().from(filamentDemands).all()
  const allSettlements = await db.select().from(settlements).all()

  const membersBalances: MemberBalance[] = []

  for (const m of allMembers) {
    // 1. Total advanced as buyer
    const totalAdvanced = allOrders
      .filter(o => o.buyerId === m.id)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    // 2. Total consumed by this member (demands that were ordered or received)
    const activeStatuses = ['COMMANDE', 'RECU', 'DISTRIBUE']
    const memberDemandsInOrders = allDemands.filter(d => d.memberId === m.id && activeStatuses.includes(d.status))
    const totalConsumed = memberDemandsInOrders.reduce((sum, d) => {
      const price = d.actualUnitPrice ?? d.estimatedUnitPrice
      return sum + (d.quantity * price)
    }, 0)

    // 3. Settlements paid (money sent to reimburse someone)
    const settlementsPaid = allSettlements
      .filter(s => s.payerId === m.id)
      .reduce((sum, s) => sum + s.amount, 0)

    // 4. Settlements received (money received from someone)
    const settlementsReceived = allSettlements
      .filter(s => s.receiverId === m.id)
      .reduce((sum, s) => sum + s.amount, 0)

    // Net balance: (Advanced - Consumed) + (Refunds Sent - Refunds Received)
    // Positive: member is owed money (creditor)
    // Negative: member owes money (debtor)
    const rawNet = (totalAdvanced - totalConsumed) + (settlementsPaid - settlementsReceived)
    const netBalance = Math.round(rawNet * 100) / 100

    let status: 'CREDITOR' | 'DEBTOR' | 'BALANCED' = 'BALANCED'
    if (netBalance > 0.01) status = 'CREDITOR'
    else if (netBalance < -0.01) status = 'DEBTOR'

    membersBalances.push({
      memberId: m.id,
      memberName: m.name,
      memberEmail: m.email,
      memberPhone: m.phone,
      dropoffLocation: m.dropoffLocation,
      totalAdvanced: Math.round(totalAdvanced * 100) / 100,
      totalConsumed: Math.round(totalConsumed * 100) / 100,
      settlementsPaid: Math.round(settlementsPaid * 100) / 100,
      settlementsReceived: Math.round(settlementsReceived * 100) / 100,
      netBalance,
      status
    })
  }

  // Debt simplification algorithm ("Qui doit quoi à qui")
  const creditors = membersBalances
    .filter(m => m.netBalance > 0.01)
    .map(m => ({ id: m.memberId, name: m.memberName, amount: m.netBalance }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = membersBalances
    .filter(m => m.netBalance < -0.01)
    .map(m => ({ id: m.memberId, name: m.memberName, amount: Math.abs(m.netBalance) }))
    .sort((a, b) => b.amount - a.amount)

  const simplifiedDebts: SimplifiedDebt[] = []

  let cIdx = 0
  let dIdx = 0

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx]
    const debtor = debtors[dIdx]

    const amountToSettle = Math.min(creditor.amount, debtor.amount)
    const roundedAmount = Math.round(amountToSettle * 100) / 100

    if (roundedAmount > 0.01) {
      simplifiedDebts.push({
        fromMemberId: debtor.id,
        fromMemberName: debtor.name,
        toMemberId: creditor.id,
        toMemberName: creditor.name,
        amount: roundedAmount
      })
    }

    creditor.amount -= roundedAmount
    debtor.amount -= roundedAmount

    if (creditor.amount < 0.01) cIdx++
    if (debtor.amount < 0.01) dIdx++
  }

  // Global metrics
  const totalOrdersAmount = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const totalSettled = allSettlements.reduce((sum, s) => sum + (s.amount || 0), 0)
  const pendingDemandsCount = allDemands.filter(d => d.status === 'DEMANDE' || d.status === 'PRIS_EN_CHARGE').length
  const activeOrdersCount = allOrders.filter(o => o.status !== 'CLOTURE').length

  return {
    membersBalances,
    simplifiedDebts,
    summary: {
      totalOrdersAmount: Math.round(totalOrdersAmount * 100) / 100,
      totalSettled: Math.round(totalSettled * 100) / 100,
      pendingDemandsCount,
      activeOrdersCount,
      totalMembers: allMembers.length,
      totalDebtsCount: simplifiedDebts.length
    }
  }
})
