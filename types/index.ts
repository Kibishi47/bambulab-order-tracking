/**
 * Centralisation des énumérations, constantes métier et interfaces typées
 * pour l'ensemble de l'application BambuShare.
 */

// --- 1. Énumérations et types d'états métier ---

export const NeedStatus = {
  REQUESTED: 'DEMANDE',
  ASSIGNED: 'PRIS_EN_CHARGE',
  ORDERED: 'COMMANDE',
  RECEIVED: 'RECU',
  DISTRIBUTED: 'DISTRIBUE',
  CANCELLED: 'ANNULE'
} as const

export type NeedStatus = (typeof NeedStatus)[keyof typeof NeedStatus]
export const NEED_STATUS_VALUES = [
  NeedStatus.REQUESTED,
  NeedStatus.ASSIGNED,
  NeedStatus.ORDERED,
  NeedStatus.RECEIVED,
  NeedStatus.DISTRIBUTED,
  NeedStatus.CANCELLED
] as const

export const OrderStatus = {
  PENDING: 'PREPARATION',
  ORDERED: 'COMMANDE',
  RECEIVED: 'LIVRE',
  DELIVERED: 'LIVRE',
  DISTRIBUTED: 'CLOTURE',
  CLOSED: 'CLOTURE'
} as const

export type OrderStatus = 'PREPARATION' | 'COMMANDE' | 'LIVRE' | 'CLOTURE'
export const ORDER_STATUS_VALUES = ['PREPARATION', 'COMMANDE', 'LIVRE', 'CLOTURE'] as const

export const PaymentMethod = {
  WERO: 'WERO',
  TRANSFER: 'VIREMENT',
  PAYPAL: 'PAYPAL',
  CASH: 'ESPECES',
  LYDIA: 'LYDIA',
  OTHER: 'AUTRE'
} as const

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]
export const PAYMENT_METHOD_VALUES = [
  PaymentMethod.WERO,
  PaymentMethod.TRANSFER,
  PaymentMethod.PAYPAL,
  PaymentMethod.CASH,
  PaymentMethod.LYDIA,
  PaymentMethod.OTHER
] as const

export const ShippingSplitMode = {
  EQUAL: 'EQUITABLE',
  PRO_RATA: 'PRORATA'
} as const

export type ShippingSplitMode = (typeof ShippingSplitMode)[keyof typeof ShippingSplitMode]
export const SHIPPING_SPLIT_VALUES = [ShippingSplitMode.EQUAL, ShippingSplitMode.PRO_RATA] as const

export const FilamentFormat = {
  REFILL: 'RECHARGE',
  SPOOL: 'BOBINE'
} as const

export type FilamentFormat = (typeof FilamentFormat)[keyof typeof FilamentFormat]
export const FILAMENT_FORMAT_VALUES = [FilamentFormat.REFILL, FilamentFormat.SPOOL] as const

// --- 2. Types DTO pour les échanges API & Composants ---

export interface MemberDTO {
  id: number
  name: string
  email: string | null
  phone: string | null
  dropoffLocation: string | null
  createdAt: string
}

export interface MemberWithStatsDTO extends MemberDTO {
  demandsCount: number
  pendingDemandsCount: number
  ordersBoughtCount: number
}

export interface FilamentDemandDTO {
  id: number
  memberId: number
  payerMemberId: number | null
  groupOrderId: number | null
  filamentType: string
  format: FilamentFormat
  colorName: string
  colorHex: string
  quantity: number
  estimatedUnitPrice: number
  actualUnitPrice: number | null
  status: NeedStatus
  isPaused: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  memberName?: string
  memberEmail?: string | null
  payerMemberName?: string | null
  orderNumber?: string | null
}

export interface SettlementDTO {
  id: number
  groupOrderId: number | null
  payerId: number
  receiverId: number
  amount: number
  paymentMethod: PaymentMethod
  settledAt: string
  notes: string | null
  createdAt: string
  payerName?: string
  receiverName?: string
  groupOrderNumber?: string | null
}

export interface MemberOrderCostBreakdown {
  memberId: number
  memberName: string
  itemsCount: number
  spoolsCount: number
  filamentCost: number
  shippingShare: number
  totalCost: number
}

export interface GroupOrderDTO {
  id: number
  orderNumber: string
  buyerId: number
  purchaseDate: string
  status: OrderStatus
  totalAmount: number
  shippingFee: number
  shippingSplitMethod: ShippingSplitMode
  notes: string | null
  createdAt: string
  buyerName?: string
  buyerEmail?: string | null
  buyerPhone?: string | null
  itemCount?: number
  totalSpools?: number
  demands?: FilamentDemandDTO[]
  settlements?: SettlementDTO[]
  breakdown?: MemberOrderCostBreakdown[]
}

export interface MemberBalanceDTO {
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

export interface SimplifiedDebtDTO {
  fromMemberId: number
  fromMemberName: string
  toMemberId: number
  toMemberName: string
  amount: number
}

export interface BalancesSummaryDTO {
  totalOrdersAmount: number
  totalSettled: number
  pendingDemandsCount: number
  activeOrdersCount: number
  totalMembers: number
  totalDebtsCount: number
}

export interface BalancesResponseDTO {
  membersBalances: MemberBalanceDTO[]
  simplifiedDebts: SimplifiedDebtDTO[]
  summary: BalancesSummaryDTO
}

export type CascadeAction = 'RECEIVE' | 'DISTRIBUTE'
