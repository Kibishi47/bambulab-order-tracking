import { getDatabase } from '../index'
import { members, groupOrders, filamentDemands, settlements } from '../schema'
import { cleanDatabase } from './clean'
import {
  FilamentFormat,
  NeedStatus,
  OrderStatus,
  PaymentMethod,
  ShippingSplitMode
} from '../../../types'
import { computeEffectiveUnitPrice } from '../../../utils/pricing'

export function seedFull() {
  cleanDatabase()

  const { db } = getDatabase()
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  console.log('🌱 Injection du jeu de données exhaustif ("full")...')

  // 1. Membres complets
  const memberList = [
    {
      name: 'Thomas',
      email: 'thomas@bambushare.fr',
      phone: '06 12 34 56 78',
      dropoffLocation: 'Makerspace / Atelier central',
      createdAt: now
    },
    {
      name: 'Sophie',
      email: 'sophie@bambushare.fr',
      phone: '06 98 76 54 32',
      dropoffLocation: 'Bureau Sophie (Semaine)',
      createdAt: now
    },
    {
      name: 'Lucas',
      email: 'lucas@bambushare.fr',
      phone: '07 11 22 33 44',
      dropoffLocation: 'Maison Thomas (soir)',
      createdAt: now
    },
    {
      name: 'Camille',
      email: 'camille@bambushare.fr',
      phone: '06 55 44 33 22',
      dropoffLocation: 'FabLab Université',
      createdAt: now
    },
    {
      name: 'Alexandre',
      email: 'alexandre@bambushare.fr',
      phone: '07 88 99 00 11',
      dropoffLocation: 'Atelier central',
      createdAt: now
    }
  ]

  const [thomas, sophie, lucas, camille, alexandre] = db.insert(members).values(memberList).returning().all()

  // 2. Commande 1 : Frais de port EQUAL (6.00 €), acheteur Thomas, statut RECEIVED, 0% remise
  // Total = 2*14.99 + 2*16.99 + 1*15.99 + 6.00 = 29.98 + 33.98 + 15.99 + 6.00 = 85.95 €
  const [order1] = db.insert(groupOrders).values({
    orderNumber: 'FR24098112',
    buyerId: thomas.id,
    purchaseDate: '2026-09-08',
    status: OrderStatus.RECEIVED,
    totalAmount: 85.95,
    shippingFee: 6.00,
    shippingSplitMethod: ShippingSplitMode.EQUAL,
    discountPercentage: 0,
    notes: 'Livraison express reçue à l\'atelier. Bobines prêtes pour remise en main propre.',
    createdAt: now
  }).returning().all()

  // 3. Commande 2 : Frais de port PRO_RATA (8.50 €), acheteuse Sophie, statut ORDERED, 35% de remise
  // Articles éligibles (remisés à 35% avec arrondi au centime inférieur) :
  // - Sophie (2x PLA Silk @ 19.99 €) -> 12.99 €/u => 25.98 €
  // - Lucas (2x PETG-CF @ 29.99 €) -> 19.49 €/u => 38.98 €
  // Article exclu de la remise :
  // - Camille (1x TPU 95A @ 24.99 €) -> 24.99 €/u => 24.99 €
  // Total filaments = 25.98 + 38.98 + 24.99 = 89.95 €
  // Total = 89.95 + 8.50 = 98.45 €
  const [order2] = db.insert(groupOrders).values({
    orderNumber: 'FR24099450',
    buyerId: sophie.id,
    purchaseDate: '2026-09-15',
    status: OrderStatus.ORDERED,
    totalAmount: 98.45,
    shippingFee: 8.50,
    shippingSplitMethod: ShippingSplitMode.PRO_RATA,
    discountPercentage: 35,
    notes: 'Commande groupée Bambu Lab avec palier 35% de remise (filament TPU exclu).',
    createdAt: now
  }).returning().all()

  // 4. Demandes associées et statuts variés (REQUESTED, ORDERED, RECEIVED, DISTRIBUTED)
  db.insert(filamentDemands).values([
    // Dans Commande 1 (Statut RECU & DISTRIBUE, sans remise)
    {
      memberId: thomas.id,
      groupOrderId: order1.id,
      filamentType: 'PLA Basic',
      format: FilamentFormat.REFILL,
      colorName: 'Bambu Green',
      colorHex: '#00AE42',
      quantity: 2,
      estimatedUnitPrice: 15.99,
      actualUnitPrice: 14.99,
      effectiveUnitPrice: 14.99,
      isDiscountEligible: true,
      status: NeedStatus.RECEIVED,
      notes: 'Proto boîtiers',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: sophie.id,
      groupOrderId: order1.id,
      filamentType: 'PLA Matte',
      format: FilamentFormat.SPOOL,
      colorName: 'Charcoal Black',
      colorHex: '#1E1E1E',
      quantity: 2,
      estimatedUnitPrice: 17.99,
      actualUnitPrice: 16.99,
      effectiveUnitPrice: 16.99,
      isDiscountEligible: true,
      status: NeedStatus.DISTRIBUTED,
      notes: 'Décoration événementielle - Déjà récupéré',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: lucas.id,
      payerMemberId: alexandre.id,
      groupOrderId: order1.id,
      filamentType: 'PETG HF',
      format: FilamentFormat.REFILL,
      colorName: 'Blanc Jade',
      colorHex: '#FFFFFF',
      quantity: 1,
      estimatedUnitPrice: 16.99,
      actualUnitPrice: 15.99,
      effectiveUnitPrice: 15.99,
      isDiscountEligible: true,
      status: NeedStatus.RECEIVED,
      notes: 'Fixations murales (Offert par Alexandre pour rendre une bobine prêtée)',
      createdAt: now,
      updatedAt: now
    },

    // Dans Commande 2 (Statut ORDERED, remise 35%, 1 article exclu)
    {
      memberId: sophie.id,
      payerMemberId: null,
      groupOrderId: order2.id,
      filamentType: 'PLA Silk',
      format: FilamentFormat.REFILL,
      colorName: 'Or Métallique',
      colorHex: '#D4AF37',
      quantity: 2,
      estimatedUnitPrice: 19.99,
      actualUnitPrice: computeEffectiveUnitPrice(19.99, 35, true), // 12.99 €
      effectiveUnitPrice: computeEffectiveUnitPrice(19.99, 35, true),
      isDiscountEligible: true,
      status: NeedStatus.ORDERED,
      notes: 'Trophées robotique',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: lucas.id,
      payerMemberId: null,
      groupOrderId: order2.id,
      filamentType: 'PETG-CF',
      format: FilamentFormat.SPOOL,
      colorName: 'Noir Carbone',
      colorHex: '#121212',
      quantity: 2,
      estimatedUnitPrice: 29.99,
      actualUnitPrice: computeEffectiveUnitPrice(29.99, 35, true), // 19.49 €
      effectiveUnitPrice: computeEffectiveUnitPrice(29.99, 35, true),
      isDiscountEligible: true,
      status: NeedStatus.ORDERED,
      notes: 'Pièces mécaniques drone haute résistance',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: camille.id,
      payerMemberId: null,
      groupOrderId: order2.id,
      filamentType: 'TPU 95A',
      format: FilamentFormat.SPOOL,
      colorName: 'Gris Cendre',
      colorHex: '#808080',
      quantity: 1,
      estimatedUnitPrice: 24.99,
      actualUnitPrice: 24.99,
      effectiveUnitPrice: 24.99,
      isDiscountEligible: false, // EXCLU de la réduction
      status: NeedStatus.ORDERED,
      notes: 'Semelles test prototype - filament technique non éligible',
      createdAt: now,
      updatedAt: now
    },

    // Besoins non commandés (Statut REQUESTED, groupOrderId = null)
    {
      memberId: alexandre.id,
      payerMemberId: null,
      groupOrderId: null,
      filamentType: 'PLA Galaxy',
      format: FilamentFormat.REFILL,
      colorName: 'Violet Nébuleuse',
      colorHex: '#4A0E4E',
      quantity: 2,
      estimatedUnitPrice: 18.99,
      actualUnitPrice: null,
      status: NeedStatus.REQUESTED,
      isPaused: true,
      notes: 'Luminaires salon - Pas de budget ce mois-ci (besoin mis en pause)',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: camille.id,
      payerMemberId: sophie.id,
      groupOrderId: null,
      filamentType: 'Support Filament',
      format: FilamentFormat.SPOOL,
      colorName: 'Blanc PVA',
      colorHex: '#F0F0F0',
      quantity: 1,
      estimatedUnitPrice: 29.99,
      actualUnitPrice: null,
      status: NeedStatus.REQUESTED,
      isPaused: false,
      notes: 'Support soluble (Cadeau offert par Sophie pour le projet associatif)',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: lucas.id,
      payerMemberId: null,
      groupOrderId: null,
      filamentType: 'PLA Matte',
      format: FilamentFormat.REFILL,
      colorName: 'Bleu Océan',
      colorHex: '#0077BE',
      quantity: 1,
      estimatedUnitPrice: 16.99,
      actualUnitPrice: null,
      status: NeedStatus.REQUESTED,
      isPaused: false,
      notes: 'Boîtier domotique',
      createdAt: now,
      updatedAt: now
    }
  ]).run()

  // 5. Règlements de remboursement (Wero et virement)
  db.insert(settlements).values([
    // Alexandre rembourse 17.99 € à Thomas via WERO pour la bobine offerte à Lucas dans la commande 1
    {
      groupOrderId: order1.id,
      payerId: alexandre.id,
      receiverId: thomas.id,
      amount: 17.99,
      paymentMethod: PaymentMethod.WERO,
      settledAt: '2026-09-12',
      notes: 'Remboursement de la bobine PETG HF offerte à Lucas (#FR24098112) via Wero',
      createdAt: now
    },
    // Camille verse un acompte de 20.00 € à Sophie par virement bancaire pour la commande 2
    {
      groupOrderId: order2.id,
      payerId: camille.id,
      receiverId: sophie.id,
      amount: 20.00,
      paymentMethod: PaymentMethod.TRANSFER,
      settledAt: '2026-09-16',
      notes: 'Acompte bobine TPU',
      createdAt: now
    }
  ]).run()

  console.log('✅ Jeu de données exhaustif injecté avec succès :')
  console.log('   - 5 membres avec coordonnées complètes')
  console.log('   - 2 commandes groupées (1 EQUAL, 1 PRO_RATA)')
  console.log('   - 8 besoins (REQUESTED, ORDERED, RECEIVED, DISTRIBUTED)')
  console.log('   - Règlements via WERO et TRANSFER')
}

if (process.argv[1]?.endsWith('full.ts')) {
  seedFull()
}
