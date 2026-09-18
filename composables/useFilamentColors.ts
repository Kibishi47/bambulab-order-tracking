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
    value: 'DEMANDE',
    label: 'En attente',
    color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
  },
  {
    value: 'PRIS_EN_CHARGE',
    label: 'Pris en charge',
    color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30'
  },
  {
    value: 'COMMANDE',
    label: 'Commandé',
    color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30'
  },
  {
    value: 'RECU',
    label: 'Reçu',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30'
  },
  {
    value: 'DISTRIBUE',
    label: 'Distribué',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
  },
  {
    value: 'ANNULE',
    label: 'Annulé',
    color: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700'
  }
]

export const ORDER_STATUSES = [
  {
    value: 'PREPARATION',
    label: 'En préparation',
    color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
  },
  {
    value: 'COMMANDE',
    label: 'Commandé',
    color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30'
  },
  {
    value: 'LIVRE',
    label: 'Livré',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30'
  },
  {
    value: 'CLOTURE',
    label: 'Clôturé',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
  }
]

export const PAYMENT_METHODS = [
  { value: 'LYDIA', label: 'Lydia' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'AUTRE', label: 'Autre' }
]
