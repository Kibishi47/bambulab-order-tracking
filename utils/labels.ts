import {
  NeedStatus,
  OrderStatus,
  PaymentMethod,
  ShippingSplitMode,
  FilamentFormat
} from '../types'

/**
 * Dictionnaires exhaustifs des libellés lisibles en français
 * pour l'interface utilisateur.
 */
export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  [NeedStatus.REQUESTED]: 'Demandé',
  [NeedStatus.ASSIGNED]: 'Pris en charge',
  [NeedStatus.ORDERED]: 'Commandé',
  [NeedStatus.RECEIVED]: 'Reçu',
  [NeedStatus.DISTRIBUTED]: 'Distribué',
  [NeedStatus.CANCELLED]: 'Annulé'
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.ORDERED]: 'Commandé',
  [OrderStatus.RECEIVED]: 'Reçu',
  [OrderStatus.DISTRIBUTED]: 'Distribué'
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.WERO]: 'Wero',
  [PaymentMethod.TRANSFER]: 'Virement',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.CASH]: 'Espèces',
  [PaymentMethod.LYDIA]: 'Lydia',
  [PaymentMethod.OTHER]: 'Autre'
}

export const SHIPPING_SPLIT_LABELS: Record<ShippingSplitMode, string> = {
  [ShippingSplitMode.EQUAL]: 'Parts égales',
  [ShippingSplitMode.PRO_RATA]: 'Au pro-rata'
}

export const FILAMENT_FORMAT_LABELS: Record<FilamentFormat, string> = {
  [FilamentFormat.REFILL]: 'Recharge',
  [FilamentFormat.SPOOL]: 'Bobine'
}

/**
 * Fonctions de formatage avec fallback sécurisé
 */
export function formatNeedStatus(status?: NeedStatus | string | null): string {
  if (!status) return ''
  return (NEED_STATUS_LABELS as Record<string, string>)[status] || status
}

export function formatOrderStatus(status?: OrderStatus | string | null): string {
  if (!status) return ''
  return (ORDER_STATUS_LABELS as Record<string, string>)[status] || status
}

export function formatPaymentMethod(method?: PaymentMethod | string | null): string {
  if (!method) return ''
  return (PAYMENT_METHOD_LABELS as Record<string, string>)[method] || method
}

export function formatShippingSplitMode(mode?: ShippingSplitMode | string | null): string {
  if (!mode) return ''
  return (SHIPPING_SPLIT_LABELS as Record<string, string>)[mode] || mode
}

export function formatFilamentFormat(format?: FilamentFormat | string | null): string {
  if (!format) return ''
  return (FILAMENT_FORMAT_LABELS as Record<string, string>)[format] || format
}
