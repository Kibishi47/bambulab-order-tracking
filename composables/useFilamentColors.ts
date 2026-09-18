export interface FilamentPreset {
  name: string
  hex: string
}

export interface FilamentTypeConfig {
  name: string
  category: string
  badgeClass: string
  defaultPrice: number
}

export const BAMBU_FILAMENT_TYPES: FilamentTypeConfig[] = [
  { name: 'PLA Basic', category: 'Standard', badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60', defaultPrice: 16.99 },
  { name: 'PLA Matte', category: 'Standard', badgeClass: 'bg-teal-950/70 text-teal-300 border-teal-800/60', defaultPrice: 17.99 },
  { name: 'PLA Silk', category: 'Effet', badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/60', defaultPrice: 19.99 },
  { name: 'PLA Galaxy', category: 'Effet', badgeClass: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60', defaultPrice: 20.99 },
  { name: 'PETG HF', category: 'Technique', badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60', defaultPrice: 16.99 },
  { name: 'PETG-CF', category: 'Technique', badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700', defaultPrice: 29.99 },
  { name: 'ABS', category: 'Technique', badgeClass: 'bg-orange-950/70 text-orange-300 border-orange-800/60', defaultPrice: 18.99 },
  { name: 'TPU 95A', category: 'Flexible', badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-800/60', defaultPrice: 24.99 },
  { name: 'PC', category: 'Haute résistance', badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60', defaultPrice: 29.99 },
  { name: 'Support for PLA', category: 'Support', badgeClass: 'bg-blue-950/70 text-blue-300 border-blue-800/60', defaultPrice: 22.99 }
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
  { value: 'DEMANDE', label: 'En attente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'PRIS_EN_CHARGE', label: 'Pris en charge', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { value: 'COMMANDE', label: 'Commandé', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { value: 'RECU', label: 'Reçu au point relais', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { value: 'DISTRIBUE', label: 'Distribué', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { value: 'ANNULE', label: 'Annulé', color: 'bg-zinc-800 text-zinc-500 border-zinc-700' }
]

export const ORDER_STATUSES = [
  { value: 'PREPARATION', label: 'En préparation', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'COMMANDE', label: 'Commandé sur Bambu Lab', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { value: 'LIVRE', label: 'Colis livré', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { value: 'CLOTURE', label: 'Clôturé & Distribué', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
]

export const PAYMENT_METHODS = [
  { value: 'LYDIA', label: 'Lydia' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'AUTRE', label: 'Autre' }
]
