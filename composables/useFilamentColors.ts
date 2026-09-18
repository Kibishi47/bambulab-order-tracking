export interface FilamentPreset {
  name: string
  hex: string
}

import { CheckCircle, ShoppingBag, Truck, PackageCheck } from 'lucide-vue-next'
import { NeedStatus, OrderStatus, PaymentMethod } from '../types'

export interface FilamentTypeConfig {
  name: string
  category: string
  badgeClass: string
  defaultPrice: number
}

export const BAMBU_FILAMENT_TYPES: FilamentTypeConfig[] = [
  {
    name: 'PLA Basic',
    category: 'Standard',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60',
    defaultPrice: 16.99
  },
  {
    name: 'PLA Matte',
    category: 'Standard',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800/60',
    defaultPrice: 17.99
  },
  {
    name: 'PLA Silk',
    category: 'Effet',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60',
    defaultPrice: 19.99
  },
  {
    name: 'PLA Galaxy',
    category: 'Effet',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800/60',
    defaultPrice: 20.99
  },
  {
    name: 'PETG HF',
    category: 'Technique',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-800/60',
    defaultPrice: 16.99
  },
  {
    name: 'PETG-CF',
    category: 'Technique',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
    defaultPrice: 29.99
  },
  {
    name: 'ABS',
    category: 'Technique',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800/60',
    defaultPrice: 18.99
  },
  {
    name: 'TPU 95A',
    category: 'Flexible',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/60',
    defaultPrice: 24.99
  },
  {
    name: 'PC',
    category: 'Haute résistance',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/60',
    defaultPrice: 29.99
  },
  {
    name: 'Support for PLA',
    category: 'Support',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/60',
    defaultPrice: 22.99
  }
]

export const BAMBU_COLOR_PALETTE: FilamentPreset[] = [
  { name: 'Bambu Green', hex: '#00AE42' },
  { name: 'Blanc Jade', hex: '#FFFFFF' },
  { name: 'Noir Mat', hex: '#1E1E1E' },
  { name: 'Gris Cendre', hex: '#7E8287' },
  { name: 'Rouge Bambu', hex: '#D32F2F' },
  { name: 'Bleu Cobalt', hex: '#1976D2' },
  { name: 'Jaune Bambu', hex: '#FBC02D' },
  { name: 'Orange Bambu', hex: '#F57C00' },
  { name: 'Or Métallique', hex: '#D4AF37' },
  { name: 'Argent Métallique', hex: '#A6B1B9' },
  { name: 'Cyan Ciel', hex: '#00BCD4' },
  { name: 'Violet Bambu', hex: '#7B1FA2' },
  { name: 'Rose Sakura', hex: '#F48FB1' },
  { name: 'Brun Terre', hex: '#5D4037' }
]

export const DEMAND_STATUSES = [
  {
    value: NeedStatus.REQUESTED,
    label: NeedStatus.REQUESTED,
    color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
  },
  {
    value: NeedStatus.ASSIGNED,
    label: NeedStatus.ASSIGNED,
    color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30'
  },
  {
    value: NeedStatus.ORDERED,
    label: NeedStatus.ORDERED,
    color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30'
  },
  {
    value: NeedStatus.RECEIVED,
    label: NeedStatus.RECEIVED,
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30'
  },
  {
    value: NeedStatus.DISTRIBUTED,
    label: NeedStatus.DISTRIBUTED,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
  },
  {
    value: NeedStatus.CANCELLED,
    label: NeedStatus.CANCELLED,
    color: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
  }
] as const

export const ORDER_STATUSES = [
  {
    value: OrderStatus.PENDING,
    label: OrderStatus.PENDING,
    color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
  },
  {
    value: OrderStatus.ORDERED,
    label: OrderStatus.ORDERED,
    color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30'
  },
  {
    value: OrderStatus.RECEIVED,
    label: OrderStatus.RECEIVED,
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30'
  },
  {
    value: OrderStatus.DISTRIBUTED,
    label: OrderStatus.DISTRIBUTED,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
  }
] as const

export const PAYMENT_METHODS = [
  { value: PaymentMethod.WERO, label: PaymentMethod.WERO },
  { value: PaymentMethod.TRANSFER, label: PaymentMethod.TRANSFER },
  { value: PaymentMethod.PAYPAL, label: PaymentMethod.PAYPAL },
  { value: PaymentMethod.CASH, label: PaymentMethod.CASH },
  { value: PaymentMethod.LYDIA, label: PaymentMethod.LYDIA },
  { value: PaymentMethod.OTHER, label: PaymentMethod.OTHER }
] as const

export function resolveColorHex(colorName: string, existingHex?: string): string {
  if (!colorName) return existingHex || '#71717a'
  const trimmed = colorName.trim()
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) {
    return trimmed
  }
  const matchedPreset = BAMBU_COLOR_PALETTE.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
  if (matchedPreset) return matchedPreset.hex

  const lower = trimmed.toLowerCase()
  if (lower.includes('noir') || lower.includes('black')) return '#18181b'
  if (lower.includes('blanc') || lower.includes('white')) return '#ffffff'
  if (lower.includes('vert') || lower.includes('green') || lower.includes('bambu')) return '#00AE42'
  if (lower.includes('rouge') || lower.includes('red')) return '#ef4444'
  if (lower.includes('bleu') || lower.includes('blue')) return '#3b82f6'
  if (lower.includes('gris') || lower.includes('grey') || lower.includes('gray')) return '#71717a'
  if (lower.includes('jaune') || lower.includes('yellow')) return '#eab308'
  if (lower.includes('orange')) return '#f97316'
  if (lower.includes('violet') || lower.includes('purple')) return '#a855f7'
  if (lower.includes('rose') || lower.includes('pink')) return '#ec4899'
  if (lower.includes('cyan')) return '#06b6d4'
  if (lower.includes('marron') || lower.includes('brown')) return '#78350f'
  if (lower.includes('or') || lower.includes('gold')) return '#d4af37'
  if (lower.includes('argent') || lower.includes('silver')) return '#a6b1b9'

  return existingHex || '#71717a'
}

export function getDemandNextStatus(status: NeedStatus | string) {
  switch (status) {
    case NeedStatus.REQUESTED:
      return { next: NeedStatus.ASSIGNED, label: NeedStatus.ASSIGNED, icon: CheckCircle }
    case NeedStatus.ASSIGNED:
      return { next: NeedStatus.ORDERED, label: NeedStatus.ORDERED, icon: ShoppingBag }
    case NeedStatus.ORDERED:
      return { next: NeedStatus.RECEIVED, label: NeedStatus.RECEIVED, icon: Truck }
    case NeedStatus.RECEIVED:
      return { next: NeedStatus.DISTRIBUTED, label: NeedStatus.DISTRIBUTED, icon: PackageCheck }
    default:
      return null
  }
}

