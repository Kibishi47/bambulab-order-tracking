/**
 * Paliers de réduction quantitative officiels Bambu Lab
 */
export const VOLUME_DISCOUNT_TIERS = [
  { percentage: 0, label: '0%', minSpools: 0, description: 'Aucune' },
  { percentage: 10, label: '10%', minSpools: 2, description: '2+ bobines' },
  { percentage: 20, label: '20%', minSpools: 4, description: '4+ bobines' },
  { percentage: 30, label: '30%', minSpools: 6, description: '6+ bobines' },
  { percentage: 35, label: '35%', minSpools: 10, description: '10+ bobines' }
] as const

/**
 * Calcule le prix unitaire effectif après réduction avec arrondi au centime inférieur (floor).
 * - Si isDiscountEligible est faux ou si discountPercentage <= 0 : retourne basePrice.
 * - Sinon : Math.floor(basePrice * (1 - discountPercentage / 100) * 100) / 100
 *
 * @param basePrice Prix unitaire catalogue non remisé
 * @param discountPercentage Pourcentage de remise globale (ex: 35 pour 35%)
 * @param isDiscountEligible Indique si l'article bénéficie de la réduction
 */
export function computeEffectiveUnitPrice(
  basePrice: number,
  discountPercentage: number,
  isDiscountEligible: boolean = true
): number {
  if (!isDiscountEligible || discountPercentage <= 0) {
    return Math.round(basePrice * 100) / 100
  }
  const factor = 1 - (discountPercentage / 100)
  return Math.floor(basePrice * factor * 100) / 100
}

/**
 * Calcule le montant total d'une ligne d'article (quantité * prix unitaire effectif).
 */
export function computeLineTotal(
  basePrice: number,
  quantity: number,
  discountPercentage: number,
  isDiscountEligible: boolean = true
): number {
  const unitPrice = computeEffectiveUnitPrice(basePrice, discountPercentage, isDiscountEligible)
  return Math.round(unitPrice * quantity * 100) / 100
}
